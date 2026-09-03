import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateGeneratorService } from './template-generator.service';
import {
  UploadBulkImportDto,
  ValidateBulkImportDto,
  ConfirmBulkImportDto,
  BulkImportFilterDto,
} from './dto/bulk-import.dto';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BulkImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: TemplateGeneratorService,
  ) {}

  // ── 1. Role & Permission Governance ──

  validateRoleAccess(user: any, importType: string, targetInstituteId?: string, targetDepartmentId?: string) {
    if (!user) throw new ForbiddenException('User authentication required for bulk import.');

    const role = (user.role || '').toUpperCase();
    const type = importType.toUpperCase();

    if (role === 'STUDENT') {
      throw new ForbiddenException('Students are strictly prohibited from performing bulk data imports.');
    }

    if (role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'ADMIN' || role === 'ERP_COORDINATOR') {
      return true; // Full access across all datasets
    }

    // Role-specific dataset restrictions
    const allowedMap: Record<string, string[]> = {
      EXAM_CONTROLLER: ['EXAM_FORM', 'MARKS', 'SUBJECT', 'STUDENT'],
      EXAM_CELL: ['EXAM_FORM', 'MARKS', 'SUBJECT'],
      ACCOUNTS: ['FEE_ASSIGNMENT'],
      FINANCE: ['FEE_ASSIGNMENT'],
      HOSTEL_ADMIN: ['HOSTEL_STUDENT', 'HOSTEL_ROOM'],
      TRANSPORT_ADMIN: ['TRANSPORT_VEHICLE', 'TRANSPORT_DRIVER', 'TRANSPORT_ROUTE'],
      HOD: ['STUDENT', 'FACULTY', 'STAFF', 'SUBJECT', 'MARKS'],
      HR: ['FACULTY', 'STAFF'],
      HR_ADMIN: ['FACULTY', 'STAFF'],
      HR_OFFICER: ['FACULTY', 'STAFF'],
      REGISTRAR: ['STUDENT', 'FACULTY', 'STAFF', 'SUBJECT', 'EXAM_FORM', 'MARKS', 'HOSTEL_STUDENT', 'HOSTEL_ROOM', 'FEE_ASSIGNMENT', 'TRANSPORT_VEHICLE', 'TRANSPORT_DRIVER', 'TRANSPORT_ROUTE'],
      DEPUTY_REGISTRAR: ['STUDENT', 'FACULTY', 'STAFF', 'SUBJECT', 'EXAM_FORM', 'MARKS', 'HOSTEL_STUDENT', 'HOSTEL_ROOM', 'FEE_ASSIGNMENT', 'TRANSPORT_VEHICLE', 'TRANSPORT_DRIVER', 'TRANSPORT_ROUTE'],
      FACULTY: ['MARKS'],
    };

    const allowed = allowedMap[role] || [];
    if (!allowed.includes(type)) {
      throw new ForbiddenException(`Your role (${role}) is not authorized to import "${type}" datasets.`);
    }

    // Department-level scope checks for HOD / Faculty
    if (role === 'HOD' && targetDepartmentId && user.departmentId && targetDepartmentId !== user.departmentId) {
      throw new ForbiddenException('HOD can only import data scoped to their assigned Department.');
    }

    // Institute-level scope checks
    if (user.instituteId && targetInstituteId && targetInstituteId !== user.instituteId && role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenException('Cross-institute bulk imports are strictly prohibited for your role.');
    }

    return true;
  }

  // ── 2. Templates ──

  getTemplates(user?: any) {
    const list = this.templateService.getTemplateList();
    if (!user || user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN' || user.role === 'UNIVERSITY_ADMIN') {
      return list;
    }
    // Filter templates to authorized types for this role
    return list.filter(t => {
      try {
        this.validateRoleAccess(user, t.type);
        return true;
      } catch {
        return false;
      }
    });
  }

  getTemplateFile(type: string, user?: any) {
    this.validateRoleAccess(user, type);
    const buffer = this.templateService.generateExcelBuffer(type);
    const tpl = this.templateService.getTemplateDefinition(type);
    return {
      fileName: tpl ? tpl.fileName : `${type}_Template.xlsx`,
      buffer,
    };
  }

  // ── 3. Upload & Stage Raw Rows ──

  async uploadFile(dto: UploadBulkImportDto, user: any) {
    this.validateRoleAccess(user, dto.importType, dto.instituteId, dto.departmentId);

    if (!dto.fileName || !dto.fileName.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Invalid file format. Please upload the official .xlsx Excel template.');
    }

    let rows: any[] = [];

    if (dto.rows && Array.isArray(dto.rows) && dto.rows.length > 0) {
      rows = dto.rows;
    } else if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      } catch (err: any) {
        throw new BadRequestException(`Failed to parse spreadsheet file: ${err.message}`);
      }
    } else {
      throw new BadRequestException('No data rows or file payload provided.');
    }

    if (rows.length === 0) {
      throw new BadRequestException('The uploaded file contains no data rows.');
    }

    const year = new Date().getFullYear();
    let seq = (await this.prisma.bulkImport.count()) + 1;
    let importNo = `IMP-${year}-${String(seq).padStart(6, '0')}`;
    while (await this.prisma.bulkImport.findUnique({ where: { importNo } })) {
      seq++;
      importNo = `IMP-${year}-${String(seq).padStart(6, '0')}`;
    }

    // Create BulkImport record
    const bulkImport = await this.prisma.bulkImport.create({
      data: {
        importNo,
        importType: dto.importType.toUpperCase(),
        fileName: dto.fileName,
        uploadedByUserId: user.id,
        uploadedByName: user.name || user.username || 'System User',
        uploadedByRole: user.role || 'ADMIN',
        instituteId: dto.instituteId,
        departmentId: dto.departmentId,
        status: 'UPLOADED',
        totalRows: rows.length,
        metadata: dto.metadata ? (typeof dto.metadata === 'string' ? dto.metadata : JSON.stringify(dto.metadata)) : null,
      },
    });

    // Create Staging Rows using high-performance batch insert
    const stagingData = rows.map((r, i) => ({
      importId: bulkImport.id,
      rowNumber: i + 1,
      rawData: JSON.stringify(r),
      status: 'PENDING',
    }));

    const BATCH_SIZE = 500;
    for (let i = 0; i < stagingData.length; i += BATCH_SIZE) {
      const chunk = stagingData.slice(i, i + BATCH_SIZE);
      await this.prisma.bulkImportRow.createMany({ data: chunk });
    }

    // Record History / Audit
    await this.prisma.bulkImportHistory.create({
      data: {
        importId: bulkImport.id,
        action: 'UPLOADED',
        performedByUserId: user.id,
        performedByName: user.name || user.username,
        details: `Uploaded ${rows.length} rows for dataset ${dto.importType}`,
      },
    });

    return this.validateImport(bulkImport.id, { importMode: 'INSERT_ONLY' }, user);
  }

  // ── 4. Comprehensive Multi-Entity Validation Engine ──

  async validateImport(importId: string, dto: ValidateBulkImportDto, user: any) {
    const bulkImport = await this.prisma.bulkImport.findUnique({
      where: { id: importId },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    });
    if (!bulkImport) throw new NotFoundException('Bulk import session not found.');

    this.validateRoleAccess(user, bulkImport.importType, bulkImport.instituteId || undefined, bulkImport.departmentId || undefined);

    const importMode = dto.importMode || bulkImport.importMode || 'INSERT_ONLY';
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    // Load in-memory caches of existing DB records for ultra-fast validation
    const type = bulkImport.importType;
    const inMemorySeenKeys = new Set<string>();
    const context = await this.buildValidationContext(type, bulkImport.rows);

    const rowUpdates: {
      id: string;
      status: string;
      parsedData: string;
      errorMessage?: string | null;
      errorField?: string | null;
      warningMessage?: string | null;
    }[] = [];

    for (const row of bulkImport.rows) {
      let raw: any = {};
      try {
        raw = JSON.parse(row.rawData);
      } catch {
        raw = {};
      }

      // Execute specific validator in-memory
      const result = await this.validateRowByType(type, raw, importMode, inMemorySeenKeys, bulkImport, context);

      if (result.status === 'VALID') validCount++;
      else if (result.status === 'DUPLICATE') duplicateCount++;
      else invalidCount++;

      rowUpdates.push({
        id: row.id,
        status: result.status,
        parsedData: JSON.stringify(result.parsedData || raw),
        errorMessage: result.errorMessage || null,
        errorField: result.errorField || null,
        warningMessage: result.warningMessage || null,
      });
    }

    // Batch update staging rows in transactions of 100 rows
    const CHUNK_SIZE = 100;
    for (let i = 0; i < rowUpdates.length; i += CHUNK_SIZE) {
      const chunk = rowUpdates.slice(i, i + CHUNK_SIZE);
      await this.prisma.$transaction(
        chunk.map(u =>
          this.prisma.bulkImportRow.update({
            where: { id: u.id },
            data: {
              status: u.status,
              parsedData: u.parsedData,
              errorMessage: u.errorMessage,
              errorField: u.errorField,
              warningMessage: u.warningMessage,
            },
          })
        )
      );
    }

    const newStatus = validCount > 0 ? 'READY' : 'FAILED';

    const updated = await this.prisma.bulkImport.update({
      where: { id: importId },
      data: {
        status: newStatus,
        importMode,
        validRows: validCount,
        invalidRows: invalidCount,
        duplicateRows: duplicateCount,
        validationSummary: JSON.stringify({
          valid: validCount,
          invalid: invalidCount,
          duplicate: duplicateCount,
          total: bulkImport.rows.length,
        }),
      },
      include: { rows: { take: 50, orderBy: { rowNumber: 'asc' } } },
    });

    await this.prisma.bulkImportHistory.create({
      data: {
        importId: bulkImport.id,
        action: 'VALIDATED',
        performedByUserId: user.id,
        performedByName: user.name || user.username,
        details: `Validation finished: ${validCount} Valid, ${invalidCount} Invalid, ${duplicateCount} Duplicates`,
      },
    });

    return updated;
  }

  // ── Helper: Pre-fetch master data in batch for in-memory O(1) validation ──

  private async buildValidationContext(type: string, rows: any[]): Promise<any> {
    const [instList, deptList, progList, ayList, semList, batchList] = await Promise.all([
      this.prisma.institute.findMany({ select: { id: true, code: true, name: true } }),
      this.prisma.department.findMany({ select: { id: true, code: true, name: true, instituteId: true } }),
      this.prisma.program.findMany({ select: { id: true, code: true, name: true, departmentId: true } }),
      this.prisma.academicYear.findMany({ select: { id: true, code: true } }),
      this.prisma.semester.findMany({ select: { id: true, semesterNumber: true, name: true } }),
      this.prisma.batch.findMany({ select: { id: true, code: true } }),
    ]);

    const institutes = new Map<string, any>();
    instList.forEach(i => {
      institutes.set(i.id.toLowerCase(), i);
      if (i.code) institutes.set(i.code.toLowerCase(), i);
      if (i.name) institutes.set(i.name.toLowerCase(), i);
    });

    const departments = new Map<string, any>();
    deptList.forEach(d => {
      departments.set(d.id.toLowerCase(), d);
      if (d.code) departments.set(d.code.toLowerCase(), d);
      if (d.name) departments.set(d.name.toLowerCase(), d);
    });

    const programs = new Map<string, any>();
    progList.forEach(p => {
      programs.set(p.id.toLowerCase(), p);
      if (p.code) programs.set(p.code.toLowerCase(), p);
      if (p.name) programs.set(p.name.toLowerCase(), p);
    });

    const existingStudents = new Map<string, any>();
    const existingFaculty = new Map<string, any>();
    const existingStaff = new Map<string, any>();

    if (type === 'STUDENT') {
      const enrollments: string[] = [];
      const emails: string[] = [];
      for (const r of rows) {
        let raw: any = {};
        try { raw = JSON.parse(r.rawData); } catch {}
        const en = raw['Enrollment Number'] || raw.enrollmentNo || raw.EnrollmentNo || raw['Roll Number'];
        if (en) enrollments.push(String(en).trim());
        const em = raw['Email'] || raw.email || raw['Email Address'];
        if (em) emails.push(String(em).trim());
      }

      if (enrollments.length > 0 || emails.length > 0) {
        const found = await this.prisma.student.findMany({
          where: {
            OR: [
              ...(enrollments.length > 0 ? [{ enrollmentNo: { in: enrollments } }] : []),
              ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
            ],
          },
          select: { id: true, enrollmentNo: true, email: true, phone: true },
        });
        found.forEach(s => {
          if (s.enrollmentNo) existingStudents.set(s.enrollmentNo.toLowerCase(), s);
          if (s.email) existingStudents.set(s.email.toLowerCase(), s);
        });
      }
    } else if (type === 'FACULTY') {
      const empCodes: string[] = [];
      const emails: string[] = [];
      for (const r of rows) {
        let raw: any = {};
        try { raw = JSON.parse(r.rawData); } catch {}
        const ec = raw['Employee ID'] || raw.employeeId || raw.EmployeeCode || raw['Emp ID'];
        if (ec) empCodes.push(String(ec).trim());
        const em = raw['Email'] || raw.email;
        if (em) emails.push(String(em).trim());
      }

      if (empCodes.length > 0 || emails.length > 0) {
        const found = await this.prisma.faculty.findMany({
          where: {
            OR: [
              ...(empCodes.length > 0 ? [{ employeeCode: { in: empCodes } }] : []),
              ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
            ],
          },
          select: { id: true, employeeCode: true, email: true },
        });
        found.forEach(f => {
          if (f.employeeCode) existingFaculty.set(f.employeeCode.toLowerCase(), f);
          if (f.email) existingFaculty.set(f.email.toLowerCase(), f);
        });
      }
    } else if (type === 'STAFF') {
      const empCodes: string[] = [];
      const emails: string[] = [];
      for (const r of rows) {
        let raw: any = {};
        try { raw = JSON.parse(r.rawData); } catch {}
        const ec = raw['Employee Code'] || raw.employeeCode || raw.EmployeeID || raw.employeeId || raw['Emp Code'];
        if (ec) empCodes.push(String(ec).trim());
        const em = raw['Email'] || raw.email;
        if (em) emails.push(String(em).trim());
      }

      if (empCodes.length > 0 || emails.length > 0) {
        const found = await this.prisma.employee.findMany({
          where: {
            OR: [
              ...(empCodes.length > 0 ? [{ employeeCode: { in: empCodes } }] : []),
              ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
            ],
          },
          select: { id: true, employeeCode: true, email: true },
        });
        found.forEach(e => {
          if (e.employeeCode) existingStaff.set(e.employeeCode.toLowerCase(), e);
          if (e.email) existingStaff.set(e.email.toLowerCase(), e);
        });
      }
    }

    return {
      institutes,
      departments,
      programs,
      existingStudents,
      existingFaculty,
      existingStaff,
    };
  }

  // ── Row-Level Validation Logic per Dataset ──

  private async validateRowByType(
    type: string,
    raw: any,
    mode: string,
    seenKeys: Set<string>,
    session: any,
    context?: any,
  ): Promise<{ status: string; parsedData?: any; errorMessage?: string; errorField?: string; warningMessage?: string }> {
    const getVal = (fieldNames: string[]) => {
      for (const f of fieldNames) {
        if (raw[f] !== undefined && raw[f] !== null && String(raw[f]).trim() !== '') {
          return String(raw[f]).trim();
        }
      }
      return '';
    };

    switch (type) {
      // ── STUDENT ──
      case 'STUDENT': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo', 'EnrollmentNo', 'Roll Number']);
        const name = getVal(['Student Name', 'name', 'Name', 'FullName']);
        const email = getVal(['Email', 'email', 'Email Address']);
        const mobile = getVal(['Mobile', 'mobile', 'Phone', 'Contact Number']);
        const dob = getVal(['Date of Birth (YYYY-MM-DD)', 'dob', 'Date of Birth', 'DOB']);
        const gender = (getVal(['Gender', 'gender']) || 'MALE').toUpperCase();
        const instituteCode = getVal(['Institute Code', 'instituteCode', 'Institute']);
        const departmentCode = getVal(['Department Code', 'departmentCode', 'Department']);
        const programCode = getVal(['Program Code', 'programCode', 'Program']);
        const academicYear = getVal(['Academic Year', 'academicYear']) || '2026-27';
        const semester = Number(getVal(['Semester (1-8)', 'semester', 'Semester'])) || 1;
        const studentType = (getVal(['Student Type', 'studentType']) || 'REGULAR').toUpperCase();
        const nationality = getVal(['Nationality', 'nationality']) || 'INDIAN';
        const passportNumber = getVal(['Passport Number', 'passportNumber']);

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!name) return { status: 'INVALID', errorField: 'Student Name', errorMessage: 'Student Name is required.' };
        if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };
        if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };
        if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };

        // Duplicate in file
        if (seenKeys.has(enrollmentNo)) {
          return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Duplicate Enrollment Number "${enrollmentNo}" within uploaded file.` };
        }
        seenKeys.add(enrollmentNo);

        // Database checks (via context cache or DB fallback)
        let existing: any = context?.existingStudents?.get(enrollmentNo.toLowerCase()) || (email && context?.existingStudents?.get(email.toLowerCase()));
        if (!existing && !context) {
          existing = await this.prisma.student.findUnique({ where: { enrollmentNo } });
        }
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Student with enrollment "${enrollmentNo}" already exists in database.` };
        }

        // Validate Institute & Department
        let institute: any = context?.institutes?.get(instituteCode.toLowerCase());
        if (!institute && !context) {
          institute = await this.prisma.institute.findFirst({
            where: { OR: [{ id: instituteCode }, { code: instituteCode }, { name: instituteCode }] },
          });
        }
        if (!institute) {
          return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" does not exist in ERP.` };
        }

        let dept: any = context?.departments?.get(departmentCode.toLowerCase());
        if (!dept && !context) {
          dept = await this.prisma.department.findFirst({
            where: { OR: [{ id: departmentCode }, { code: departmentCode }, { name: departmentCode }] },
          });
        }
        if (!dept) {
          return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${departmentCode}" does not exist in ERP.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            enrollmentNo,
            name,
            email,
            mobile,
            dob,
            gender,
            instituteId: institute.id,
            departmentId: dept.id,
            programCode,
            academicYear,
            semester,
            studentType,
            nationality,
            passportNumber,
            isExisting: !!existing,
          },
        };
      }

      // ── FACULTY ──
      case 'FACULTY': {
        const employeeId = getVal(['Employee ID', 'employeeId', 'EmployeeCode', 'Emp ID']);
        const name = getVal(['Faculty Name', 'name', 'Name']);
        const email = getVal(['Email', 'email']);
        const mobile = getVal(['Mobile', 'mobile', 'Phone']);
        const departmentCode = getVal(['Department Code', 'departmentCode', 'Department']);
        const designation = getVal(['Designation', 'designation']) || 'Assistant Professor';
        const instituteCode = getVal(['Institute Code', 'instituteCode', 'Institute']);
        const joiningDate = getVal(['Joining Date (YYYY-MM-DD)', 'joiningDate', 'Joining Date']);

        if (!employeeId) return { status: 'INVALID', errorField: 'Employee ID', errorMessage: 'Employee ID is required.' };
        if (!name) return { status: 'INVALID', errorField: 'Faculty Name', errorMessage: 'Faculty Name is required.' };
        if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };
        if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };

        if (seenKeys.has(employeeId)) {
          return { status: 'DUPLICATE', errorField: 'Employee ID', errorMessage: `Duplicate Employee ID "${employeeId}" within uploaded file.` };
        }
        seenKeys.add(employeeId);

        let existing: any = context?.existingFaculty?.get(employeeId.toLowerCase()) || (email && context?.existingFaculty?.get(email.toLowerCase()));
        if (!existing && !context) {
          existing = await this.prisma.faculty.findFirst({
            where: { OR: [{ employeeCode: employeeId }, { email }] },
          });
        }
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Employee ID', errorMessage: `Faculty with ID/Email "${employeeId}" already exists in database.` };
        }

        let dept: any = context?.departments?.get(departmentCode.toLowerCase());
        if (!dept && !context) {
          dept = await this.prisma.department.findFirst({
            where: { OR: [{ id: departmentCode }, { code: departmentCode }, { name: departmentCode }] },
          });
        }
        if (!dept) {
          return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${departmentCode}" does not exist in ERP.` };
        }

        let institute: any = context && instituteCode ? context.institutes.get(instituteCode.toLowerCase()) : null;

        return {
          status: 'VALID',
          parsedData: {
            employeeId,
            name,
            email,
            mobile,
            departmentId: dept.id,
            instituteId: institute?.id || dept.instituteId || 'inst-01',
            designation,
            instituteCode,
            joiningDate,
            isExisting: !!existing,
          },
        };
      }

      // ── STAFF (NON-TEACHING) ──
      case 'STAFF': {
        const employeeCode = getVal(['Employee Code', 'employeeCode', 'EmployeeID', 'employeeId', 'Emp Code']);
        const name = getVal(['Staff Name', 'name', 'Name', 'FullName']);
        const email = getVal(['Email', 'email']);
        const mobile = getVal(['Mobile', 'mobile', 'Phone']);
        const departmentCode = getVal(['Department Code', 'departmentCode', 'Department']);
        const designation = getVal(['Designation', 'designation']) || 'Staff';
        const instituteCode = getVal(['Institute Code', 'instituteCode', 'Institute']);
        const employmentType = (getVal(['Employment Type', 'employmentType']) || 'FULL_TIME').toUpperCase();
        const joiningDate = getVal(['Joining Date (YYYY-MM-DD)', 'joiningDate', 'Joining Date']);

        if (!employeeCode) return { status: 'INVALID', errorField: 'Employee Code', errorMessage: 'Employee Code is required.' };
        if (!name) return { status: 'INVALID', errorField: 'Staff Name', errorMessage: 'Staff Name is required.' };
        if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };
        if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };

        if (seenKeys.has(employeeCode)) {
          return { status: 'DUPLICATE', errorField: 'Employee Code', errorMessage: `Duplicate Employee Code "${employeeCode}" within uploaded file.` };
        }
        seenKeys.add(employeeCode);

        let existing: any = context?.existingStaff?.get(employeeCode.toLowerCase()) || (email && context?.existingStaff?.get(email.toLowerCase()));
        if (!existing && !context) {
          existing = await this.prisma.employee.findFirst({
            where: { OR: [{ employeeCode }, { email }] },
          });
        }
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Employee Code', errorMessage: `Staff with Employee Code "${employeeCode}" already exists in database.` };
        }

        let dept: any = context?.departments?.get(departmentCode.toLowerCase());
        if (!dept && !context) {
          dept = await this.prisma.department.findFirst({
            where: { OR: [{ id: departmentCode }, { code: departmentCode }, { name: departmentCode }] },
          });
        }
        if (!dept) {
          return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${departmentCode}" does not exist in ERP.` };
        }

        let institute: any = context && instituteCode ? context.institutes.get(instituteCode.toLowerCase()) : null;

        return {
          status: 'VALID',
          parsedData: {
            employeeCode,
            name,
            email,
            mobile,
            departmentId: dept.id,
            instituteId: institute?.id || dept.instituteId || 'inst-01',
            designation,
            employmentType,
            joiningDate,
            isExisting: !!existing,
          },
        };
      }

      // ── SUBJECT ──
      case 'SUBJECT': {
        const subjectCode = getVal(['Subject Code', 'subjectCode', 'code', 'Code']);
        const subjectName = getVal(['Subject Name', 'subjectName', 'name', 'Name']);
        const departmentCode = getVal(['Department Code', 'departmentCode', 'Department']);
        const semester = Number(getVal(['Semester', 'semester'])) || 1;
        const credits = Number(getVal(['Credits', 'credits'])) || 3;
        const subjectType = (getVal(['Subject Type', 'subjectType', 'type']) || 'THEORY').toUpperCase();
        const maxMarks = Number(getVal(['Maximum Marks', 'maxMarks'])) || 100;
        const passingMarks = Number(getVal(['Passing Marks', 'passingMarks'])) || 40;

        if (!subjectCode) return { status: 'INVALID', errorField: 'Subject Code', errorMessage: 'Subject Code is required.' };
        if (!subjectName) return { status: 'INVALID', errorField: 'Subject Name', errorMessage: 'Subject Name is required.' };
        if (credits <= 0) return { status: 'INVALID', errorField: 'Credits', errorMessage: 'Credits must be greater than 0.' };
        if (passingMarks > maxMarks) return { status: 'INVALID', errorField: 'Passing Marks', errorMessage: 'Passing marks cannot exceed maximum marks.' };

        if (seenKeys.has(subjectCode)) {
          return { status: 'DUPLICATE', errorField: 'Subject Code', errorMessage: `Duplicate Subject Code "${subjectCode}" in uploaded file.` };
        }
        seenKeys.add(subjectCode);

        const existing = await this.prisma.subject.findFirst({
          where: { code: subjectCode.toUpperCase() },
        });
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Subject Code', errorMessage: `Subject code "${subjectCode}" already exists in database.` };
        }

        const dept = departmentCode ? await this.prisma.department.findFirst({
          where: { OR: [{ id: departmentCode }, { code: departmentCode }, { name: departmentCode }] },
        }) : null;

        return {
          status: 'VALID',
          parsedData: {
            code: subjectCode.toUpperCase(),
            name: subjectName,
            departmentId: dept?.id || null,
            semester,
            credits,
            subjectType,
            maxMarks,
            passingMarks,
            isExisting: !!existing,
          },
        };
      }

      // ── EXAM FORM ──
      case 'EXAM_FORM': {
        const appNo = getVal(['Application Number', 'applicationNumber', 'appNo']);
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const examCode = getVal(['Exam Code', 'examCode']);
        const examType = (getVal(['Exam Type', 'examType']) || 'REGULAR').toUpperCase();
        const subjectCodesStr = getVal(['Subject Codes (Comma Separated)', 'subjectCodes', 'subjects']);

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!examCode) return { status: 'INVALID', errorField: 'Exam Code', errorMessage: 'Exam Code is required.' };

        const student = await this.prisma.student.findUnique({ where: { enrollmentNo } });
        if (!student) {
          return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student with enrollment "${enrollmentNo}" does not exist.` };
        }

        const exam = await this.prisma.exam.findFirst({
          where: { OR: [{ id: examCode }, { code: examCode }, { name: examCode }] },
        });
        if (!exam) {
          return { status: 'INVALID', errorField: 'Exam Code', errorMessage: `Examination "${examCode}" does not exist in ERP.` };
        }

        // Duplicate check
        const existingForm = await this.prisma.examForm.findFirst({
          where: { examId: exam.id, studentId: student.id },
        });
        if (existingForm && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Exam form for student "${enrollmentNo}" in exam "${examCode}" already exists.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            appNo: appNo || `APP-EX-${Date.now()}`,
            studentId: student.id,
            enrollmentNo,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            examId: exam.id,
            examCode: exam.code,
            examType,
            subjectCodes: subjectCodesStr ? subjectCodesStr.split(',').map(s => s.trim()) : [],
            isExisting: !!existingForm,
          },
        };
      }

      // ── MARKS (WITH STRICT BACKEND CALCULATIONS) ──
      case 'MARKS': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const examCode = getVal(['Exam Code', 'examCode']);
        const subjectCode = getVal(['Subject Code', 'subjectCode']);
        const internal = Number(getVal(['Internal Marks (Max 30)', 'internalMarks', 'internal'])) || 0;
        const external = Number(getVal(['External Marks (Max 70)', 'externalMarks', 'external'])) || 0;
        const practical = Number(getVal(['Practical Marks (Max 50)', 'practicalMarks', 'practical'])) || 0;
        const viva = Number(getVal(['Viva Marks (Max 20)', 'vivaMarks', 'viva'])) || 0;
        const resultFlag = (getVal(['Result Flag', 'resultFlag']) || 'NORMAL').toUpperCase();

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!examCode) return { status: 'INVALID', errorField: 'Exam Code', errorMessage: 'Exam Code is required.' };
        if (!subjectCode) return { status: 'INVALID', errorField: 'Subject Code', errorMessage: 'Subject Code is required.' };

        if (internal < 0 || internal > 30) {
          return { status: 'INVALID', errorField: 'Internal Marks', errorMessage: 'Internal marks must be between 0 and 30.' };
        }
        if (external < 0 || external > 70) {
          return { status: 'INVALID', errorField: 'External Marks', errorMessage: 'External marks must be between 0 and 70.' };
        }

        const student = await this.prisma.student.findUnique({ where: { enrollmentNo } });
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" not found.` };

        const exam = await this.prisma.exam.findFirst({
          where: { OR: [{ id: examCode }, { code: examCode }] },
        });
        if (!exam) return { status: 'INVALID', errorField: 'Exam Code', errorMessage: `Exam "${examCode}" not found.` };

        const subject = await this.prisma.subject.findFirst({
          where: { OR: [{ id: subjectCode }, { code: subjectCode }] },
        });
        if (!subject) return { status: 'INVALID', errorField: 'Subject Code', errorMessage: `Subject "${subjectCode}" not found.` };

        // Mandatory Backend Grade & Marks Computation (Never trust Excel)
        const totalMarks = internal + external + practical + viva;
        const maxTotal = 100;
        const pct = (totalMarks / maxTotal) * 100;

        let grade = 'F';
        let gradePoint = 0;
        let isPass = false;

        if (resultFlag === 'ABSENT') {
          grade = 'AB';
          gradePoint = 0;
          isPass = false;
        } else if (resultFlag === 'MALPRACTICE') {
          grade = 'MP';
          gradePoint = 0;
          isPass = false;
        } else {
          if (pct >= 90) { grade = 'O'; gradePoint = 10; isPass = true; }
          else if (pct >= 80) { grade = 'A+'; gradePoint = 9; isPass = true; }
          else if (pct >= 70) { grade = 'A'; gradePoint = 8; isPass = true; }
          else if (pct >= 60) { grade = 'B+'; gradePoint = 7; isPass = true; }
          else if (pct >= 55) { grade = 'B'; gradePoint = 6; isPass = true; }
          else if (pct >= 50) { grade = 'C'; gradePoint = 5; isPass = true; }
          else if (pct >= 40 && external >= 25) { grade = 'P'; gradePoint = 4; isPass = true; }
          else { grade = 'F'; gradePoint = 0; isPass = false; }
        }

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            examId: exam.id,
            subjectId: subject.id,
            subjectCode: subject.code,
            internalMarks: internal,
            externalMarks: external,
            practicalMarks: practical,
            vivaMarks: viva,
            totalMarks,
            grade,
            gradePoint,
            isPass,
            resultFlag,
          },
        };
      }

      // ── HOSTEL ALLOTMENT ──
      case 'HOSTEL_STUDENT': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const hostelCode = getVal(['Hostel Code', 'hostelCode']);
        const roomNumber = getVal(['Room Number', 'roomNumber']);
        const bedNumber = getVal(['Bed Number', 'bedNumber']) || 'B1';
        const academicYear = getVal(['Academic Year', 'academicYear']) || '2026-27';

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!hostelCode) return { status: 'INVALID', errorField: 'Hostel Code', errorMessage: 'Hostel Code is required.' };
        if (!roomNumber) return { status: 'INVALID', errorField: 'Room Number', errorMessage: 'Room Number is required.' };

        const student = await this.prisma.student.findUnique({ where: { enrollmentNo } });
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" does not exist.` };

        const hostel = await this.prisma.hostel.findFirst({
          where: { OR: [{ id: hostelCode }, { code: hostelCode }, { name: hostelCode }] },
        });
        if (!hostel) return { status: 'INVALID', errorField: 'Hostel Code', errorMessage: `Hostel "${hostelCode}" not found.` };

        const room = await this.prisma.hostelRoom.findFirst({
          where: { hostelId: hostel.id, roomNumber },
          include: { beds: true, allotments: { where: { status: 'ACTIVE' } } },
        });
        if (!room) return { status: 'INVALID', errorField: 'Room Number', errorMessage: `Room "${roomNumber}" in hostel "${hostelCode}" not found.` };

        // Capacity check
        if (room.allotments.length >= room.capacity) {
          return { status: 'INVALID', errorField: 'Room Number', errorMessage: `Hostel room "${roomNumber}" has reached maximum capacity (${room.capacity}).` };
        }

        // Active allotment check
        const activeAllotment = await this.prisma.hostelAllotment.findFirst({
          where: { studentId: student.id, status: 'ACTIVE' },
        });
        if (activeAllotment && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" already has an active hostel allotment.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            hostelId: hostel.id,
            roomId: room.id,
            bedNumber,
            academicYear,
            isExisting: !!activeAllotment,
          },
        };
      }

      // ── HOSTEL ROOM MASTER ──
      case 'HOSTEL_ROOM': {
        const hostelCode = getVal(['Hostel Code', 'hostelCode']);
        const roomNumber = getVal(['Room Number', 'roomNumber']);
        const floor = Number(getVal(['Floor', 'floor'])) || 1;
        const capacity = Number(getVal(['Capacity', 'capacity'])) || 2;
        const roomType = (getVal(['Room Type', 'roomType']) || 'NON_AC').toUpperCase();
        const facilities = getVal(['Facilities', 'facilities']) || '';

        if (!hostelCode) return { status: 'INVALID', errorField: 'Hostel Code', errorMessage: 'Hostel Code is required.' };
        if (!roomNumber) return { status: 'INVALID', errorField: 'Room Number', errorMessage: 'Room Number is required.' };
        if (capacity <= 0) return { status: 'INVALID', errorField: 'Capacity', errorMessage: 'Capacity must be greater than 0.' };

        const roomKey = `${hostelCode}_${roomNumber}`;
        if (seenKeys.has(roomKey)) {
          return { status: 'DUPLICATE', errorField: 'Room Number', errorMessage: `Duplicate Room "${roomNumber}" for hostel "${hostelCode}" in file.` };
        }
        seenKeys.add(roomKey);

        const hostel = await this.prisma.hostel.findFirst({
          where: { OR: [{ id: hostelCode }, { code: hostelCode }, { name: hostelCode }] },
        });

        const existing = hostel ? await this.prisma.hostelRoom.findFirst({
          where: { hostelId: hostel.id, roomNumber },
        }) : null;
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Room Number', errorMessage: `Room "${roomNumber}" in hostel "${hostelCode}" already exists.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            hostelId: hostel?.id || 'hostel-01',
            hostelCode,
            roomNumber,
            floor,
            capacity,
            roomType,
            facilities,
            isExisting: !!existing,
          },
        };
      }

      // ── FEE ASSIGNMENT ──
      case 'FEE_ASSIGNMENT': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const academicYear = getVal(['Academic Year', 'academicYear']) || '2026-27';
        const semester = Number(getVal(['Semester', 'semester'])) || 1;
        const feeHeadCode = getVal(['Fee Head Code', 'feeHeadCode', 'feeHead', 'Fee Head']);
        const amount = Number(getVal(['Amount', 'amount']));
        const dueDate = getVal(['Due Date (YYYY-MM-DD)', 'dueDate', 'Due Date']);
        const concession = Number(getVal(['Concession Amount', 'concession'])) || 0;

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!feeHeadCode) return { status: 'INVALID', errorField: 'Fee Head Code', errorMessage: 'Fee Head Code is required.' };
        if (!amount || amount <= 0) return { status: 'INVALID', errorField: 'Amount', errorMessage: 'Fee amount must be greater than 0.' };

        const student = await this.prisma.student.findUnique({ where: { enrollmentNo } });
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" does not exist.` };

        const feeHead = await this.prisma.feeHead.findFirst({
          where: { OR: [{ id: feeHeadCode }, { code: feeHeadCode }, { name: feeHeadCode }] },
        });
        if (!feeHead) return { status: 'INVALID', errorField: 'Fee Head Code', errorMessage: `Fee Head "${feeHeadCode}" does not exist in Accounts master.` };

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            academicYear,
            semester,
            feeHeadId: feeHead.id,
            feeHeadCode: feeHead.code,
            amount,
            concession,
            netAmount: amount - concession,
            dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          },
        };
      }

      // ── TRANSPORT VEHICLE ──
      case 'TRANSPORT_VEHICLE': {
        const vehicleNumber = getVal(['Vehicle Number', 'vehicleNumber', 'registrationNumber']);
        const vehicleType = (getVal(['Vehicle Type', 'vehicleType']) || 'BUS').toUpperCase();
        const makeModel = getVal(['Make Model', 'makeModel']) || 'Standard Bus';
        const capacity = Number(getVal(['Capacity', 'capacity'])) || 40;

        if (!vehicleNumber) return { status: 'INVALID', errorField: 'Vehicle Number', errorMessage: 'Vehicle Number is required.' };
        if (capacity <= 0) return { status: 'INVALID', errorField: 'Capacity', errorMessage: 'Vehicle capacity must be greater than 0.' };

        if (seenKeys.has(vehicleNumber)) {
          return { status: 'DUPLICATE', errorField: 'Vehicle Number', errorMessage: `Duplicate Vehicle Number "${vehicleNumber}" in file.` };
        }
        seenKeys.add(vehicleNumber);

        const existing = await this.prisma.vehicle.findUnique({ where: { registrationNumber: vehicleNumber } });
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Vehicle Number', errorMessage: `Vehicle "${vehicleNumber}" already exists in database.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            registrationNumber: vehicleNumber,
            vehicleType,
            makeModel,
            capacity,
            isExisting: !!existing,
          },
        };
      }

      // ── TRANSPORT DRIVER ──
      case 'TRANSPORT_DRIVER': {
        const driverName = getVal(['Driver Name', 'driverName', 'name']);
        const contactNumber = getVal(['Contact Number', 'contactNumber', 'mobile']);
        const licenseNumber = getVal(['License Number', 'licenseNumber']);

        if (!driverName) return { status: 'INVALID', errorField: 'Driver Name', errorMessage: 'Driver Name is required.' };
        if (!licenseNumber) return { status: 'INVALID', errorField: 'License Number', errorMessage: 'License Number is required.' };

        if (seenKeys.has(licenseNumber)) {
          return { status: 'DUPLICATE', errorField: 'License Number', errorMessage: `Duplicate License Number "${licenseNumber}" in file.` };
        }
        seenKeys.add(licenseNumber);

        const existing = await this.prisma.driverProfile.findUnique({ where: { licenseNumber } });
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'License Number', errorMessage: `Driver license "${licenseNumber}" already exists in database.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            driverName,
            contactNumber,
            licenseNumber,
            isExisting: !!existing,
          },
        };
      }

      // ── TRANSPORT ROUTE ──
      case 'TRANSPORT_ROUTE': {
        const routeNumber = getVal(['Route Number', 'routeNumber']);
        const routeName = getVal(['Route Name', 'routeName']);
        const startPoint = getVal(['Start Point', 'startPoint']) || 'Origin';
        const endPoint = getVal(['End Point', 'endPoint']) || 'Campus';
        const monthlyFee = Number(getVal(['Monthly Fee', 'monthlyFee'])) || 2500;

        if (!routeNumber) return { status: 'INVALID', errorField: 'Route Number', errorMessage: 'Route Number is required.' };
        if (!routeName) return { status: 'INVALID', errorField: 'Route Name', errorMessage: 'Route Name is required.' };

        if (seenKeys.has(routeNumber)) {
          return { status: 'DUPLICATE', errorField: 'Route Number', errorMessage: `Duplicate Route Number "${routeNumber}" in file.` };
        }
        seenKeys.add(routeNumber);

        const existing = await this.prisma.transportRoute.findUnique({ where: { routeNumber } });
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Route Number', errorMessage: `Route "${routeNumber}" already exists in database.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            routeNumber,
            routeName,
            startPoint,
            endPoint,
            monthlyFee,
            isExisting: !!existing,
          },
        };
      }

      default:
        return { status: 'INVALID', errorMessage: `Unsupported import dataset type "${type}".` };
    }
  }

  // ── 5. Preview Staged Import ──

  async getImportPreview(importId: string, page = 1, limit = 50, user?: any) {
    const bulkImport = await this.prisma.bulkImport.findUnique({
      where: { id: importId },
    });
    if (!bulkImport) throw new NotFoundException('Import session not found.');

    this.validateRoleAccess(user, bulkImport.importType, bulkImport.instituteId || undefined, bulkImport.departmentId || undefined);

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, totalRows] = await Promise.all([
      this.prisma.bulkImportRow.findMany({
        where: { importId },
        orderBy: { rowNumber: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.bulkImportRow.count({ where: { importId } }),
    ]);

    const formattedRows = rows.map(r => {
      let raw = {};
      let parsed = {};
      try { raw = JSON.parse(r.rawData); } catch {}
      try { parsed = JSON.parse(r.parsedData || '{}'); } catch {}
      return {
        id: r.id,
        rowNumber: r.rowNumber,
        status: r.status,
        rawData: raw,
        parsedData: parsed,
        errorMessage: r.errorMessage,
        errorField: r.errorField,
        warningMessage: r.warningMessage,
        targetId: r.targetId,
      };
    });

    return {
      import: bulkImport,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRows,
        totalPages: Math.ceil(totalRows / Number(limit)),
      },
      rows: formattedRows,
    };
  }

  // ── 6. Confirm & Transactional Commit ──

  async confirmImport(importId: string, dto: ConfirmBulkImportDto, user: any) {
    const bulkImport = await this.prisma.bulkImport.findUnique({
      where: { id: importId },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    });
    if (!bulkImport) throw new NotFoundException('Import session not found.');

    this.validateRoleAccess(user, bulkImport.importType, bulkImport.instituteId || undefined, bulkImport.departmentId || undefined);

    if (bulkImport.status === 'IMPORTED') {
      throw new BadRequestException('This bulk import has already been completed.');
    }

    const validRows = bulkImport.rows.filter(r =>
      r.status === 'VALID' &&
      (!dto.selectedRowNumbers || dto.selectedRowNumbers.includes(r.rowNumber))
    );

    if (validRows.length === 0) {
      throw new BadRequestException('No valid rows available to import.');
    }

    let importedCount = 0;
    let failedCount = 0;

    // Process valid rows in controlled chunks of 100 records per transaction
    const CHUNK_SIZE = 100;
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);

      await this.prisma.$transaction(async (tx) => {
        for (const row of chunk) {
          let data: any = {};
          try {
            data = JSON.parse(row.parsedData || row.rawData);
          } catch {
            continue;
          }

          try {
            const targetId = await this.commitRowRecord(bulkImport.importType, data, bulkImport.importMode, user, tx);
            await tx.bulkImportRow.update({
              where: { id: row.id },
              data: { status: 'IMPORTED', targetId },
            });
            importedCount++;
          } catch (err: any) {
            failedCount++;
            await tx.bulkImportRow.update({
              where: { id: row.id },
              data: {
                status: 'FAILED',
                errorMessage: `Insertion error: ${err.message}`,
              },
            });
          }
        }
      });
    }

    const finalStatus = importedCount === validRows.length ? 'IMPORTED' : 'PARTIALLY_IMPORTED';

    const updated = await this.prisma.bulkImport.update({
      where: { id: importId },
      data: {
        status: finalStatus,
        importedRows: importedCount,
        failedRows: failedCount,
        completedAt: new Date(),
      },
    });

    await this.prisma.bulkImportHistory.create({
      data: {
        importId: bulkImport.id,
        action: 'IMPORTED',
        performedByUserId: user.id,
        performedByName: user.name || user.username,
        details: `Successfully imported ${importedCount} records. (${failedCount} failed during commit)`,
      },
    });

    return {
      success: true,
      message: `Bulk import completed: ${importedCount} record(s) imported successfully.`,
      import: updated,
      summary: {
        totalRows: bulkImport.totalRows,
        validRows: validRows.length,
        importedRows: importedCount,
        failedRows: failedCount,
      },
    };
  }

  // ── Database Insertion Logic per Record ──

  private async commitRowRecord(type: string, data: any, mode: string, user: any, client: any = this.prisma): Promise<string> {
    switch (type) {
      case 'STUDENT': {
        const names = (data.name || '').split(' ');
        const firstName = names[0] || 'Student';
        const lastName = names.slice(1).join(' ') || 'Candidate';

        if (data.isExisting && mode === 'UPSERT') {
          const updated = await client.student.update({
            where: { enrollmentNo: data.enrollmentNo },
            data: {
              firstName,
              lastName,
              email: data.email,
              phone: data.mobile,
              gender: data.gender,
              departmentId: data.departmentId,
              instituteId: data.instituteId,
            },
          });
          return updated.id;
        }

        const count = await client.student.count();
        const erpId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        // Find or create default batch
        let batch = await client.batch.findFirst();
        if (!batch) {
          const prog = await client.program.findFirst();
          const ay = await client.academicYear.findFirst();
          batch = await client.batch.create({
            data: {
              code: 'CSE-2026',
              programId: prog?.id || 'prog-cse',
              academicYearId: ay?.id || 'ay-2026',
              startYear: 2026,
              endYear: 2030,
            },
          });
        }

        const created = await client.student.create({
          data: {
            erpId,
            enrollmentNo: data.enrollmentNo,
            firstName,
            lastName,
            email: data.email,
            phone: data.mobile,
            gender: data.gender,
            dateOfBirth: data.dob ? new Date(data.dob) : new Date('2004-01-01'),
            instituteId: data.instituteId,
            departmentId: data.departmentId,
            batchId: batch.id,
            status: 'ACTIVE',
          },
        });

        // Official User account creation: Enrollment Number -> Login ID
        const tempPassword = `Ssiu@${(data.enrollmentNo || '2026').replace(/[^a-zA-Z0-9]/g, '').slice(-4)}!`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const studentRole = await client.role.findUnique({ where: { code: 'STUDENT' } });

        const existingUser = await client.user.findFirst({
          where: { OR: [{ username: data.enrollmentNo }, { studentId: created.id }] },
        });

        if (!existingUser) {
          await client.user.create({
            data: {
              erpId,
              username: data.enrollmentNo,
              passwordHash,
              accountStatus: 'ACTIVE',
              isFirstLogin: true,
              studentId: created.id,
              userRoles: studentRole
                ? {
                    create: {
                      roleId: studentRole.id,
                      scopeType: 'OWN',
                    },
                  }
                : undefined,
            },
          });
        }

        return created.id;
      }

      case 'FACULTY': {
        const names = (data.name || '').split(' ');
        const firstName = names[0] || 'Faculty';
        const lastName = names.slice(1).join(' ') || 'Member';

        if (data.isExisting && mode === 'UPSERT') {
          await client.faculty.updateMany({
            where: { employeeCode: data.employeeId },
            data: {
              firstName,
              lastName,
              email: data.email,
              phone: data.mobile,
              designation: data.designation,
              departmentId: data.departmentId,
            },
          });
          return data.employeeId;
        }

        const count = await client.faculty.count();
        const erpId = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        const inst = await client.institute.findFirst();

        const faculty = await client.faculty.create({
          data: {
            erpId,
            employeeCode: data.employeeId,
            firstName,
            lastName,
            email: data.email,
            phone: data.mobile,
            designation: data.designation,
            instituteId: inst?.id || data.instituteId || 'inst-01',
            departmentId: data.departmentId,
            status: 'ACTIVE',
          },
        });

        // Official User account creation: Employee Code -> Login ID
        const tempPassword = `Ssiu@${(data.employeeId || '2026').replace(/[^a-zA-Z0-9]/g, '').slice(-4)}!`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const facultyRole = await client.role.findUnique({ where: { code: 'FACULTY' } });

        const existingUser = await client.user.findFirst({
          where: { OR: [{ username: data.employeeId }, { facultyId: faculty.id }] },
        });

        if (!existingUser) {
          await client.user.create({
            data: {
              erpId,
              username: data.employeeId,
              passwordHash,
              accountStatus: 'ACTIVE',
              isFirstLogin: true,
              facultyId: faculty.id,
              userRoles: facultyRole
                ? {
                    create: {
                      roleId: facultyRole.id,
                      scopeType: 'DEPARTMENT',
                      scopeId: data.departmentId,
                    },
                  }
                : undefined,
            },
          });
        }

        return faculty.id;
      }

      case 'STAFF': {
        const names = (data.name || '').split(' ');
        const firstName = names[0] || 'Staff';
        const lastName = names.slice(1).join(' ') || 'Member';

        if (data.isExisting && mode === 'UPSERT') {
          const updated = await client.employee.update({
            where: { employeeCode: data.employeeCode },
            data: {
              firstName,
              lastName,
              email: data.email,
              phone: data.mobile,
              designation: data.designation,
              departmentId: data.departmentId,
              employmentType: data.employmentType || 'FULL_TIME',
            },
          });
          return updated.id;
        }

        const count = await client.employee.count();
        const erpId = `STF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        const employee = await client.employee.create({
          data: {
            erpId,
            employeeCode: data.employeeCode,
            firstName,
            lastName,
            email: data.email,
            phone: data.mobile,
            designation: data.designation || 'Staff',
            employmentType: data.employmentType || 'FULL_TIME',
            employmentStatus: 'ACTIVE',
            instituteId: data.instituteId,
            departmentId: data.departmentId,
          },
        });

        // Official User account creation: Employee Code -> Login ID
        const tempPassword = `Ssiu@${(data.employeeCode || '2026').replace(/[^a-zA-Z0-9]/g, '').slice(-4)}!`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const staffRole = await client.role.findFirst({
          where: { code: { in: ['HR', 'SYSTEM_ADMIN', 'ADMIN', 'STORE_MANAGER', 'LIBRARIAN'] } },
        });

        const existingUser = await client.user.findFirst({
          where: { OR: [{ username: data.employeeCode }, { employee: { id: employee.id } }] },
        });

        if (!existingUser) {
          await client.user.create({
            data: {
              erpId,
              username: data.employeeCode,
              passwordHash,
              accountStatus: 'ACTIVE',
              isFirstLogin: true,
              employee: { connect: { id: employee.id } },
              userRoles: staffRole
                ? {
                    create: {
                      roleId: staffRole.id,
                      scopeType: 'DEPARTMENT',
                      scopeId: data.departmentId,
                    },
                  }
                : undefined,
            },
          });
        }

        return employee.id;
      }

      case 'SUBJECT': {
        let prog = await client.program.findFirst();
        if (!prog) {
          prog = await client.program.create({
            data: {
              code: 'PROG-CSE',
              name: 'Computer Science and Engineering',
              departmentId: data.departmentId || 'dept-cse',
            },
          });
        }

        if (data.isExisting && mode === 'UPSERT') {
          await client.subject.updateMany({
            where: { code: data.code },
            data: {
              name: data.name,
              credits: data.credits,
            },
          });
          return data.code;
        }

        const created = await client.subject.create({
          data: {
            code: data.code,
            name: data.name,
            credits: data.credits,
            programId: prog.id,
            status: 'ACTIVE',
          },
        });
        return created.id;
      }

      case 'EXAM_FORM': {
        const formNumber = `EF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const form = await client.examForm.create({
          data: {
            formNumber,
            examId: data.examId,
            studentId: data.studentId,
            status: 'VERIFIED',
            feePaid: true,
            totalFee: 1500,
            paymentStatus: 'COMPLETED',
          },
        });
        return form.id;
      }

      case 'MARKS': {
        const total = (data.internalMarks || 0) + (data.externalMarks || 0);

        // Find or create exam form
        let examForm = await client.examForm.findFirst({
          where: { examId: data.examId, studentId: data.studentId },
        });
        if (!examForm) {
          examForm = await client.examForm.create({
            data: {
              formNumber: `EF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
              examId: data.examId,
              studentId: data.studentId,
              status: 'VERIFIED',
              feePaid: true,
              totalFee: 1500,
              paymentStatus: 'COMPLETED',
            },
          });
        }

        const existingResult = await client.examResult.findFirst({
          where: {
            examFormId: examForm.id,
            subjectId: data.subjectId,
          },
        });

        if (existingResult) {
          const updated = await client.examResult.update({
            where: { id: existingResult.id },
            data: {
              internalMarks: data.internalMarks,
              externalMarks: data.externalMarks,
              practicalMarks: data.practicalMarks,
              marksObtained: total,
              grade: data.grade,
              gradePoints: data.gradePoint,
              isPassed: data.isPass,
              evaluationStatus: 'VERIFIED',
              resultStatus: 'DECLARED',
            },
          });
          return updated.id;
        }

        const result = await client.examResult.create({
          data: {
            examFormId: examForm.id,
            studentId: data.studentId,
            subjectId: data.subjectId,
            internalMarks: data.internalMarks,
            externalMarks: data.externalMarks,
            practicalMarks: data.practicalMarks,
            marksObtained: total,
            maxMarks: 100,
            grade: data.grade,
            gradePoints: data.gradePoint,
            isPassed: data.isPass,
            evaluationStatus: 'VERIFIED',
            resultStatus: 'DECLARED',
          },
        });
        return result.id;
      }

      case 'HOSTEL_STUDENT': {
        const allotmentNo = `HST-ALL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const allotment = await client.hostelAllotment.create({
          data: {
            allotmentNo,
            studentId: data.studentId,
            hostelId: data.hostelId,
            roomId: data.roomId,
            bedId: data.bedId || `bed-${data.bedNumber}`,
            academicYear: data.academicYear,
            allottedDate: new Date(),
            status: 'ACTIVE',
          },
        });
        return allotment.id;
      }

      case 'HOSTEL_ROOM': {
        let hostel = await client.hostel.findFirst({
          where: { OR: [{ id: data.hostelCode }, { code: data.hostelCode }, { name: data.hostelCode }] },
        });
        if (!hostel) {
          hostel = await client.hostel.create({
            data: {
              code: data.hostelCode,
              name: `Hostel ${data.hostelCode}`,
              gender: 'BOYS',
              status: 'ACTIVE',
            },
          });
        }
        const room = await client.hostelRoom.create({
          data: {
            hostelId: hostel.id,
            roomNumber: data.roomNumber,
            floor: data.floor,
            capacity: data.capacity,
            roomType: data.roomType,
            facilities: data.facilities,
            status: 'AVAILABLE',
          },
        });
        return room.id;
      }

      case 'FEE_ASSIGNMENT': {
        let feeStruct = await client.feeStructure.findFirst();
        if (!feeStruct) {
          const inst = await client.institute.findFirst();
          const prog = await client.program.findFirst();
          const sem = await client.semester.findFirst();
          feeStruct = await client.feeStructure.create({
            data: {
              name: 'General Academic Fee Structure',
              structureCode: 'FS-GEN-2026',
              instituteId: inst?.id || 'inst-01',
              programId: prog?.id || 'prog-01',
              semesterId: sem?.id || 'sem-01',
              academicYearCode: data.academicYear || '2026-27',
              totalAmount: data.netAmount,
            },
          });
        }

        const feeAccount = await client.studentFeeAccount.upsert({
          where: {
            studentId_feeStructureId: {
              studentId: data.studentId,
              feeStructureId: feeStruct.id,
            },
          },
          create: {
            studentId: data.studentId,
            feeStructureId: feeStruct.id,
            academicYearCode: data.academicYear || '2026-27',
            totalDue: data.netAmount,
            totalDiscount: data.concession || 0,
            balanceDue: data.netAmount,
            status: 'PENDING',
          },
          update: {
            totalDue: { increment: data.netAmount },
            balanceDue: { increment: data.netAmount },
          },
        });
        return feeAccount.id;
      }

      case 'TRANSPORT_VEHICLE': {
        const vehicle = await client.vehicle.create({
          data: {
            registrationNumber: data.registrationNumber,
            vehicleType: data.vehicleType,
            makeModel: data.makeModel,
            capacity: data.capacity,
            status: 'ACTIVE',
          },
        });
        return vehicle.id;
      }

      case 'TRANSPORT_DRIVER': {
        const driver = await client.driverProfile.create({
          data: {
            driverName: data.driverName,
            contactNumber: data.contactNumber,
            licenseNumber: data.licenseNumber,
            status: 'ACTIVE',
          },
        });
        return driver.id;
      }

      case 'TRANSPORT_ROUTE': {
        const route = await client.transportRoute.create({
          data: {
            routeNumber: data.routeNumber,
            routeName: data.routeName,
            startPoint: data.startPoint,
            endPoint: data.endPoint,
            monthlyFee: data.monthlyFee,
            status: 'ACTIVE',
          },
        });
        return route.id;
      }

      default:
        throw new Error(`Unsupported dataset commit handler: ${type}`);
    }
  }

  // ── 7. Error Report Generator ──

  async getErrorReportFile(importId: string, user?: any) {
    const bulkImport = await this.prisma.bulkImport.findUnique({
      where: { id: importId },
      include: {
        rows: {
          where: { status: { in: ['INVALID', 'DUPLICATE', 'FAILED'] } },
          orderBy: { rowNumber: 'asc' },
        },
      },
    });
    if (!bulkImport) throw new NotFoundException('Import session not found.');

    this.validateRoleAccess(user, bulkImport.importType, bulkImport.instituteId || undefined, bulkImport.departmentId || undefined);

    const errors = bulkImport.rows.map(r => {
      let raw: any = {};
      try { raw = JSON.parse(r.rawData); } catch {}
      const enteredValue = r.errorField ? (raw[r.errorField] || '') : JSON.stringify(raw);
      return {
        rowNumber: r.rowNumber,
        field: r.errorField || 'Record',
        enteredValue: String(enteredValue),
        errorMessage: r.errorMessage || 'Validation failed',
      };
    });

    const buffer = this.templateService.generateErrorReportBuffer(
      bulkImport.importNo,
      bulkImport.importType,
      errors,
    );

    return {
      fileName: `Error_Report_${bulkImport.importNo}.xlsx`,
      buffer,
      errorCount: errors.length,
    };
  }

  // ── 8. Import History & Logs ──

  async getImportHistory(filter: BulkImportFilterDto, user?: any) {
    const where: any = {};

    if (filter.importType) where.importType = filter.importType.toUpperCase();
    if (filter.status) where.status = filter.status.toUpperCase();

    // Role-based restrictions
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'SYSTEM_ADMIN' && user.role !== 'ADMIN' && user.role !== 'UNIVERSITY_ADMIN') {
      if (user.role === 'HOD' && user.departmentId) {
        where.OR = [{ uploadedByUserId: user.id }, { departmentId: user.departmentId }];
      } else {
        where.uploadedByUserId = user.id;
      }
    }

    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.bulkImport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { history: { orderBy: { timestamp: 'desc' } } },
      }),
      this.prisma.bulkImport.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getImportDetails(importId: string, user?: any) {
    const bulkImport = await this.prisma.bulkImport.findUnique({
      where: { id: importId },
      include: {
        history: { orderBy: { timestamp: 'desc' } },
        rows: { take: 100, orderBy: { rowNumber: 'asc' } },
      },
    });
    if (!bulkImport) throw new NotFoundException('Import session not found.');

    this.validateRoleAccess(user, bulkImport.importType, bulkImport.instituteId || undefined, bulkImport.departmentId || undefined);
    return bulkImport;
  }
}
