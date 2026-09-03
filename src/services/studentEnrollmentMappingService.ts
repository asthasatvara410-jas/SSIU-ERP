// ==============================================================================
// SWARRNIM UNIVERSITY ERP — CENTRALIZED STUDENT ENROLLMENT MAPPING SERVICE
// ==============================================================================

import * as XLSX from 'xlsx';
import { db } from './db';
import { 
  Student, User, UserRole, 
  StudentEnrollmentMapping, 
  StudentMappingHistoryRecord, 
  StudentMappingHistoryRowDetail,
  ParsedMappingRow, 
  BulkMappingValidationResult, 
  BulkMappingExecutionResult,
  RawStudentMappingExcelRow
} from '../types';
import { auditLogService } from './auditLogService';

export class StudentEnrollmentMappingService {
  private static instance: StudentEnrollmentMappingService;

  private constructor() {}

  public static getInstance(): StudentEnrollmentMappingService {
    if (!StudentEnrollmentMappingService.instance) {
      StudentEnrollmentMappingService.instance = new StudentEnrollmentMappingService();
    }
    return StudentEnrollmentMappingService.instance;
  }

  // ============================================================================
  // 1. RBAC PERMISSION CHECK
  // ============================================================================

  public canUserPerformBulkMapping(user: User | null, role: UserRole | string | null): boolean {
    if (!user || !role) return false;
    const privilegedRoles = [
      'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PROVOST', 
      'PRESIDENT', 'REGISTRAR', 'DEPUTY_REGISTRAR', 'PRINCIPAL', 
      'HOD', 'STUDENT_ADMIN', 'STUDENT_SECTION'
    ];
    return privilegedRoles.includes(role);
  }

  public isUserAuthorizedForScope(
    user: User | null, 
    role: UserRole | string | null, 
    instituteId?: string, 
    departmentId?: string
  ): boolean {
    if (!user || !role) return false;

    // University-level admins have full access
    if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PROVOST', 'PRESIDENT', 'REGISTRAR'].includes(role)) {
      return true;
    }

    // Deputy Registrar: Scoped
    if (role === 'DEPUTY_REGISTRAR') {
      const scopes = db.getDeputyRegistrarScopeByUserId(user.id);
      if (scopes.length === 0) return true;
      return scopes.some(s => {
        const matchInst = !s.instituteId || s.instituteId === instituteId;
        const matchDept = s.departmentIds.length > 0
          ? (s.departmentIds.includes('ALL') || (Boolean(departmentId) && s.departmentIds.includes(departmentId!)))
          : true;
        return matchInst && matchDept;
      });
    }

    // Principal / HOI: Own institute
    if (role === 'PRINCIPAL') {
      return Boolean(user.instituteId) && user.instituteId === instituteId;
    }

    // HOD: Own department and institute
    if (role === 'HOD') {
      const uInstMatch = !user.instituteId || user.instituteId === instituteId;
      const uDept = user.departmentId;
      if (!uDept || !departmentId) return uInstMatch;
      return uInstMatch && (uDept === departmentId || uDept.toUpperCase() === departmentId.toUpperCase());
    }

    // Student Section / Student Admin
    if (['STUDENT_ADMIN', 'STUDENT_SECTION'].includes(role)) {
      if (!user.instituteId) return true;
      return user.instituteId === instituteId || user.instituteId === 'inst-1';
    }

    return false;
  }

  // ============================================================================
  // 2. EXCEL TEMPLATE GENERATION (2 SHEETS)
  // ============================================================================

  public generateTemplateWorkbook(): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();

    // ── SHEET 1: DATA TEMPLATE ──
    const headers = [
      'Enrollment No',
      'Student Name',
      'Student Email',
      'Institute',
      'Department',
      'Program Code',
      'Program Name',
      'Academic Year',
      'Semester',
      'Division',
      'Class / Batch',
      'Mentor Faculty',
      'Student Status'
    ];

    const sampleRows = [
      [
        '240101001',
        'Aarav Sharma',
        'aarav.sharma@swarrnim.edu.in',
        'SSCIT',
        'CSE',
        'BTECH_CSE',
        'B.Tech Computer Science & Engineering',
        '2025-26',
        4,
        'A',
        '2023-2027',
        'Dr. Rajesh Verma',
        'ACTIVE'
      ],
      [
        '240101002',
        'Priya Patel',
        'priya.patel@swarrnim.edu.in',
        'SSCIT',
        'CSE',
        'BTECH_CSE',
        'B.Tech Computer Science & Engineering',
        '2025-26',
        4,
        'A',
        '2023-2027',
        'Prof. Sneha Shah',
        'ACTIVE'
      ],
      [
        '240101003',
        'Rohan Mehta',
        'rohan.mehta@swarrnim.edu.in',
        'SSCIT',
        'IT',
        'BTECH_IT',
        'B.Tech Information Technology',
        '2025-26',
        4,
        'B',
        '2023-2027',
        'Dr. Amit Joshi',
        'ACTIVE'
      ]
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set Column Widths for readability
    ws['!cols'] = [
      { wch: 18 }, // Enrollment No
      { wch: 24 }, // Student Name
      { wch: 30 }, // Student Email
      { wch: 14 }, // Institute
      { wch: 16 }, // Department
      { wch: 16 }, // Program Code
      { wch: 36 }, // Program Name
      { wch: 16 }, // Academic Year
      { wch: 12 }, // Semester
      { wch: 12 }, // Division
      { wch: 16 }, // Class / Batch
      { wch: 22 }, // Mentor Faculty
      { wch: 16 }  // Student Status
    ];

    // Freeze first row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'Student_Mapping_Template');

    // ── SHEET 2: INSTRUCTIONS & VALID VALUES ──
    const instructions = [
      ['SWARRNIM STARTUP & INNOVATION UNIVERSITY — ERP BULK STUDENT MAPPING GUIDE', ''],
      ['IMPORTANT INSTRUCTIONS:', ''],
      ['1.', 'Do NOT rename, delete, or reorder column headers in the "Student_Mapping_Template" sheet.'],
      ['2.', 'Enrollment No is mandatory and must be unique per student.'],
      ['3.', 'If an Enrollment No already exists in the system, its academic mapping will be upgraded/updated without creating a duplicate student.'],
      ['4.', 'Historical academic mappings (previous semesters/years) will be preserved in the ERP database.'],
      ['5.', 'Ensure Academic Year matches the standard format: "2024-25", "2025-26", "2026-27", or "2025-2026".'],
      ['6.', 'Semester must be an integer number between 1 and 8 (or 10 for integrated programs).'],
      ['7.', 'Division should be "A", "B", "C", "D", etc.'],
      ['', ''],
      ['COLUMN SPECIFICATIONS & VALID MASTER VALUES:', ''],
      ['Column Name', 'Required', 'Accepted Codes / Values', 'Description'],
      ['Enrollment No', 'YES', 'Unique alphanumeric ID e.g. "240101001", "STUDENT-001"', 'Unique student identifier.'],
      ['Student Name', 'YES', 'Full Name e.g. "Aarav Sharma"', 'Full legal name of the student.'],
      ['Student Email', 'OPTIONAL', 'Valid university or personal email', 'Official or student email address.'],
      ['Institute', 'YES', 'SSCIT, SOET, SSAS, SSIP, SAMS, SHAS', 'Institute short code or name.'],
      ['Department', 'YES', 'CSE, IT, ME, CE, EC, EE, AIDS, MCA, PHARM', 'Department short code.'],
      ['Program Code', 'YES', 'BTECH_CSE, BTECH_IT, BTECH_ME, BTECH_CE, BCA, MCA, BSC_CS', 'Program/Degree code.'],
      ['Program Name', 'OPTIONAL', 'Full program name', 'Human-readable program title.'],
      ['Academic Year', 'YES', '2024-25, 2025-26, 2026-27', 'Active academic session.'],
      ['Semester', 'YES', '1, 2, 3, 4, 5, 6, 7, 8', 'Numeric semester (1 to 8).'],
      ['Division', 'YES', 'A, B, C, D', 'Classroom section/division.'],
      ['Class / Batch', 'OPTIONAL', '2023-2027, 2024-2028, Batch A1', 'Admitted batch cohort or lab batch.'],
      ['Mentor Faculty', 'OPTIONAL', 'Faculty Name, Code, or Email', 'Assigned faculty counselor / mentor.'],
      ['Student Status', 'OPTIONAL', 'ACTIVE, INACTIVE, PROVISIONAL, ON_HOLD', 'Default is "ACTIVE".']
    ];

    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    wsInst['!cols'] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 40 },
      { wch: 45 }
    ];

    XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions');

    return wb;
  }

  public downloadExcelTemplate(): void {
    const wb = this.generateTemplateWorkbook();
    XLSX.writeFile(wb, 'SSIU_Student_Mapping_Template.xlsx');
  }

  // ============================================================================
  // 3. PARSE & VALIDATE EXCEL FILE
  // ============================================================================

  public async parseAndValidateExcel(
    fileBuffer: ArrayBuffer,
    user: User | null,
    role: UserRole | string | null
  ): Promise<BulkMappingValidationResult> {
    try {
      const wb = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          newStudentsCount: 0,
          existingStudentsCount: 0,
          alreadyMappedCount: 0,
          duplicateRowsCount: 0,
          errorRowsCount: 0,
          rows: [],
          errorRows: [],
          canImport: false,
          globalErrors: ['Uploaded Excel file contains no readable sheets.']
        };
      }

      const ws = wb.Sheets[sheetName];
      const rawRows: RawStudentMappingExcelRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rawRows.length === 0) {
        return {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          newStudentsCount: 0,
          existingStudentsCount: 0,
          alreadyMappedCount: 0,
          duplicateRowsCount: 0,
          errorRowsCount: 0,
          rows: [],
          errorRows: [],
          canImport: false,
          globalErrors: ['Uploaded Excel sheet has no data rows.']
        };
      }

      // Fetch reference master entities from DB
      const institutes = db.getInstitutes();
      const departments = db.getDepartments();
      const programs = db.getPrograms();
      const semesters = db.getSemesters();
      const divisions = db.getDivisions();
      const batches = db.getBatches();
      const facultyList = db.getFaculty();
      const existingStudents = db.getStudents();
      const existingMappings = this.getStudentEnrollmentMappings();

      const seenEnrollmentsInFile = new Set<string>();
      const parsedRows: ParsedMappingRow[] = [];
      const errorRows: ParsedMappingRow[] = [];

      let validCount = 0;
      let invalidCount = 0;
      let newStudentsCount = 0;
      let existingStudentsCount = 0;
      let alreadyMappedCount = 0;
      let duplicateRowsCount = 0;

      rawRows.forEach((row, index) => {
        const rowNo = index + 2; // +2 for 1-based indexing + header row
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Extract values
        const enrollmentNo = String(row['Enrollment No'] || row['Enrollment Number'] || '').trim();
        const studentName = String(row['Student Name'] || row['Name'] || '').trim();
        const studentEmail = String(row['Student Email'] || row['Email'] || '').trim();
        const instituteInput = String(row['Institute'] || row['Institute Code'] || '').trim();
        const departmentInput = String(row['Department'] || row['Department Code'] || '').trim();
        const programInput = String(row['Program Code'] || row['Program'] || row['Program Name'] || '').trim();
        const academicYearInput = String(row['Academic Year'] || '').trim();
        const semesterInput = String(row['Semester'] || '').trim();
        const divisionInput = String(row['Division'] || '').trim().toUpperCase();
        const batchInput = String(row['Class / Batch'] || row['Batch'] || '').trim();
        const mentorInput = String(row['Mentor Faculty'] || row['Mentor'] || '').trim();
        const statusInput = String(row['Student Status'] || row['Status'] || 'ACTIVE').trim().toUpperCase() || 'ACTIVE';

        // 2. Validate mandatory fields
        if (!enrollmentNo) {
          errors.push('Enrollment No is required.');
        }
        if (!studentName) {
          errors.push('Student Name is required.');
        }
        if (!instituteInput) {
          errors.push('Institute is required.');
        }
        if (!departmentInput) {
          errors.push('Department is required.');
        }
        if (!programInput) {
          errors.push('Program is required.');
        }
        if (!academicYearInput) {
          errors.push('Academic Year is required.');
        }
        if (!semesterInput) {
          errors.push('Semester is required.');
        }
        if (!divisionInput) {
          errors.push('Division is required.');
        }

        // 3. Duplicate check within same Excel file
        if (enrollmentNo) {
          const lowerEnroll = enrollmentNo.toLowerCase();
          if (seenEnrollmentsInFile.has(lowerEnroll)) {
            errors.push(`Duplicate Enrollment No "${enrollmentNo}" found within the upload file.`);
            duplicateRowsCount++;
          } else {
            seenEnrollmentsInFile.add(lowerEnroll);
          }
        }

        // 4. Resolve Institute
        let resolvedInstitute = institutes.find(
          i => i.code?.toLowerCase() === instituteInput.toLowerCase() || 
               i.id.toLowerCase() === instituteInput.toLowerCase() ||
               i.name.toLowerCase().includes(instituteInput.toLowerCase())
        );
        if (!resolvedInstitute && institutes.length > 0) {
          // Fallback to first matching institute or default
          resolvedInstitute = institutes[0];
          warnings.push(`Institute "${instituteInput}" not recognized; defaulted to "${resolvedInstitute.name}".`);
        }

        // 5. Resolve Department
        let resolvedDepartment = departments.find(
          d => d.code?.toLowerCase() === departmentInput.toLowerCase() ||
               d.id.toLowerCase() === departmentInput.toLowerCase() ||
               d.name.toLowerCase().includes(departmentInput.toLowerCase())
        );
        if (!resolvedDepartment && departments.length > 0) {
          resolvedDepartment = departments[0];
          warnings.push(`Department "${departmentInput}" defaulted to "${resolvedDepartment.name}".`);
        }

        // 6. Resolve Program
        let resolvedProgram = programs.find(
          p => p.code?.toLowerCase() === programInput.toLowerCase() ||
               p.id.toLowerCase() === programInput.toLowerCase() ||
               p.name.toLowerCase().includes(programInput.toLowerCase())
        );
        if (!resolvedProgram && programs.length > 0) {
          resolvedProgram = programs[0];
          warnings.push(`Program "${programInput}" defaulted to "${resolvedProgram.name}".`);
        }

        // 7. Resolve Semester
        let semesterNumber = parseInt(semesterInput, 10);
        if (isNaN(semesterNumber) || semesterNumber < 1 || semesterNumber > 12) {
          // try regex e.g. "Sem 4" or "SEM-4"
          const match = semesterInput.match(/\d+/);
          if (match) {
            semesterNumber = parseInt(match[0], 10);
          } else {
            errors.push(`Invalid Semester "${semesterInput}". Must be a number between 1 and 8.`);
            semesterNumber = 1;
          }
        }

        const resolvedSemester = semesters.find(
          s => s.number === semesterNumber && 
               (!resolvedProgram || s.programId === resolvedProgram.id || s.id.includes(resolvedProgram.code.toLowerCase()))
        ) || semesters.find(s => s.number === semesterNumber) || semesters[0];

        // 8. Resolve Division
        let resolvedDivision = divisions.find(
          div => (div.name.toLowerCase() === `division ${divisionInput.toLowerCase()}` ||
                  div.name.toLowerCase() === divisionInput.toLowerCase() ||
                  div.id.toLowerCase().includes(divisionInput.toLowerCase())) &&
                 (!resolvedSemester || div.semesterId === resolvedSemester?.id)
        ) || divisions.find(
          div => div.name.toLowerCase().includes(divisionInput.toLowerCase())
        ) || divisions[0];

        // 9. Resolve Batch
        let resolvedBatch = batches.find(
          b => b.name?.toLowerCase().includes(batchInput.toLowerCase()) ||
               b.id?.toLowerCase() === batchInput.toLowerCase()
        ) || batches[0];

        // 10. Resolve Mentor
        let resolvedMentor = mentorInput 
          ? facultyList.find(
              f => f.name.toLowerCase().includes(mentorInput.toLowerCase()) ||
                   f.email?.toLowerCase() === mentorInput.toLowerCase() ||
                   f.id === mentorInput
            )
          : undefined;

        // 11. Normalize Academic Year
        let normalizedAcademicYear = academicYearInput;
        if (!normalizedAcademicYear.includes('-')) {
          warnings.push(`Academic Year "${academicYearInput}" formatted to standard format.`);
          normalizedAcademicYear = '2025-26';
        }

        // 12. Check existing student in master
        const existingStudent = existingStudents.find(
          s => s.enrollmentNo.toLowerCase() === enrollmentNo.toLowerCase()
        );
        const isExistingStudent = Boolean(existingStudent);
        if (isExistingStudent) {
          existingStudentsCount++;
        } else {
          newStudentsCount++;
        }

        // 13. Check if already mapped for this exact Academic Year + Semester
        const isAlreadyMappedCurrentSemester = existingMappings.some(
          m => m.enrollmentNo.toLowerCase() === enrollmentNo.toLowerCase() &&
               m.academicYear === normalizedAcademicYear &&
               m.semester === semesterNumber &&
               m.division === divisionInput &&
               m.isCurrent
        );
        if (isAlreadyMappedCurrentSemester) {
          alreadyMappedCount++;
          warnings.push(`Student is already actively mapped to ${normalizedAcademicYear} Sem ${semesterNumber} Div ${divisionInput}. Mapping will refresh.`);
        }

        // 14. RBAC Scoping Validation
        if (resolvedInstitute && resolvedDepartment) {
          const isAuthorized = this.isUserAuthorizedForScope(
            user, 
            role, 
            resolvedInstitute.id, 
            resolvedDepartment.id
          );
          if (!isAuthorized) {
            errors.push(`You are not authorized to map students in ${resolvedInstitute.name} / ${resolvedDepartment.name}.`);
          }
        }

        const isValid = errors.length === 0;
        if (isValid) {
          validCount++;
        } else {
          invalidCount++;
        }

        const parsedItem: ParsedMappingRow = {
          rowNo,
          enrollmentNo,
          studentName,
          studentEmail: studentEmail || (existingStudent?.email || `${enrollmentNo.toLowerCase()}@swarrnim.edu.in`),
          instituteCode: resolvedInstitute?.code || instituteInput,
          departmentCode: resolvedDepartment?.code || departmentInput,
          programCode: resolvedProgram?.code || programInput,
          academicYear: normalizedAcademicYear,
          semesterNumber,
          division: divisionInput || 'A',
          batchName: resolvedBatch?.name || batchInput || '2024-2028',
          mentorFaculty: resolvedMentor?.name || mentorInput || '',
          studentStatus: statusInput || 'ACTIVE',
          
          resolvedInstituteId: resolvedInstitute?.id || 'inst-1',
          resolvedDepartmentId: resolvedDepartment?.id || 'dept-1',
          resolvedProgramId: resolvedProgram?.id || 'prog-1',
          resolvedSemesterId: resolvedSemester?.id || 'sem-cse-4',
          resolvedDivisionId: resolvedDivision?.id || 'div-cse-4a',
          resolvedBatchId: resolvedBatch?.id || 'batch-2023-2027',
          resolvedMentorId: resolvedMentor?.id,
          
          resolvedInstituteName: resolvedInstitute?.name || 'Swarrnim Institute of Technology',
          resolvedDepartmentName: resolvedDepartment?.name || 'Computer Science & Engineering',
          resolvedProgramName: resolvedProgram?.name || 'B.Tech Computer Science & Engineering',
          resolvedMentorName: resolvedMentor?.name,
          
          isValid,
          isExistingStudent,
          existingStudentId: existingStudent?.id,
          isAlreadyMappedCurrentSemester,
          errors,
          warnings
        };

        parsedRows.push(parsedItem);
        if (!isValid) {
          errorRows.push(parsedItem);
        }
      });

      return {
        totalRows: rawRows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        newStudentsCount,
        existingStudentsCount,
        alreadyMappedCount,
        duplicateRowsCount,
        errorRowsCount: errorRows.length,
        rows: parsedRows,
        errorRows,
        canImport: validCount > 0
      };
    } catch (err: any) {
      console.error('[STUDENT MAPPING SERVICE] Excel parse error:', err);
      return {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        newStudentsCount: 0,
        existingStudentsCount: 0,
        alreadyMappedCount: 0,
        duplicateRowsCount: 0,
        errorRowsCount: 0,
        rows: [],
        errorRows: [],
        canImport: false,
        globalErrors: [`Failed to parse Excel workbook: ${err?.message || 'Unknown format error'}`]
      };
    }
  }

  // ============================================================================
  // 4. DOWNLOAD ERROR EXCEL WORKBOOK
  // ============================================================================

  public downloadErrorExcel(errorRows: ParsedMappingRow[]): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Row No',
      'Enrollment No',
      'Student Name',
      'Student Email',
      'Institute',
      'Department',
      'Program',
      'Academic Year',
      'Semester',
      'Division',
      'Class / Batch',
      'Validation Errors',
      'Warnings'
    ];

    const data = errorRows.map(r => [
      r.rowNo,
      r.enrollmentNo,
      r.studentName,
      r.studentEmail || '',
      r.instituteCode,
      r.departmentCode,
      r.programCode,
      r.academicYear,
      r.semesterNumber,
      r.division,
      r.batchName || '',
      r.errors.join('; '),
      r.warnings.join('; ')
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 22 },
      { wch: 26 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 45 },
      { wch: 35 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Validation_Errors');
    XLSX.writeFile(wb, `Student_Mapping_Errors_${Date.now()}.xlsx`);
  }

  // ============================================================================
  // 5. ATOMIC BULK MAPPING TRANSACTION EXECUTION
  // ============================================================================

  public executeBulkMappingTransaction(
    validRows: ParsedMappingRow[],
    user: User | null,
    role: UserRole | string | null,
    metadata?: { fileName?: string; fileSize?: string }
  ): BulkMappingExecutionResult {
    const historyId = `sm-hist-${Date.now()}`;
    const batchId = `BATCH-MAP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const actorId = user?.id || 'system-admin';
    const actorName = user?.name || 'Administrator';
    const actorRole = (role as string) || 'SUPER_ADMIN';

    let successfullyMapped = 0;
    let updatedExisting = 0;
    let newCreated = 0;
    let skipped = 0;
    let failed = 0;

    const rowDetails: StudentMappingHistoryRowDetail[] = [];

    try {
      // Execute atomically inside db.runInTransaction
      db.runInTransaction((state) => {
        // Ensure studentEnrollmentMappings collection exists in state
        if (!state.studentEnrollmentMappings) {
          state.studentEnrollmentMappings = [];
        }
        if (!state.studentMappingHistories) {
          state.studentMappingHistories = [];
        }

        for (const row of validRows) {
          if (!row.isValid) {
            skipped++;
            rowDetails.push({
              rowNo: row.rowNo,
              enrollmentNo: row.enrollmentNo,
              studentName: row.studentName,
              studentEmail: row.studentEmail,
              institute: row.instituteCode,
              department: row.departmentCode,
              program: row.programCode,
              academicYear: row.academicYear,
              semester: `Sem ${row.semesterNumber}`,
              division: row.division,
              batch: row.batchName,
              mentor: row.mentorFaculty,
              studentStatus: row.studentStatus,
              actionTaken: 'SKIPPED',
              status: 'ERROR',
              message: 'Row was invalid and skipped.',
              error: row.errors.join('; ')
            });
            continue;
          }

          try {
            let targetStudentId = row.existingStudentId;

            // ── STEP A: Create or Update Master Student Record ──
            if (!targetStudentId) {
              const existingByEnroll = state.students.find(
                s => s.enrollmentNo.toLowerCase() === row.enrollmentNo.toLowerCase()
              );
              if (existingByEnroll) {
                targetStudentId = existingByEnroll.id;
              }
            }

            if (!targetStudentId) {
              // Create New Student Master Record
              targetStudentId = `stu-map-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
              const newStudent: Student = {
                id: targetStudentId,
                enrollmentNo: row.enrollmentNo,
                name: row.studentName,
                email: row.studentEmail || `${row.enrollmentNo.toLowerCase()}@swarrnim.edu.in`,
                phone: '+91 98765 00000',
                gender: 'Male',
                guardianName: 'Parent of ' + row.studentName,
                guardianPhone: '+91 98765 00001',
                instituteId: row.resolvedInstituteId || 'inst-1',
                departmentId: row.resolvedDepartmentId || 'dept-1',
                programId: row.resolvedProgramId || 'prog-1',
                academicYearId: 'ay-2024',
                academicYear: row.academicYear,
                batchId: row.resolvedBatchId || 'batch-2023-2027',
                semesterId: row.resolvedSemesterId || 'sem-cse-4',
                divisionId: row.resolvedDivisionId || 'div-cse-4a',
                mentorId: row.resolvedMentorId,
                status: (row.studentStatus as any) || 'ACTIVE',
                academicStatus: 'ACTIVE',
                onboardingStatus: 'ONBOARDED',
                admissionDate: nowIso.slice(0, 10),
                studentType: 'DOMESTIC',
                academicHistory: []
              };

              state.students.push(newStudent);
              newCreated++;
            } else {
              // Update Existing Student Record with New Academic Coordinates
              const stIdx = state.students.findIndex(s => s.id === targetStudentId);
              if (stIdx !== -1) {
                const currentStudent = state.students[stIdx];
                state.students[stIdx] = {
                  ...currentStudent,
                  instituteId: row.resolvedInstituteId || currentStudent.instituteId,
                  departmentId: row.resolvedDepartmentId || currentStudent.departmentId,
                  programId: row.resolvedProgramId || currentStudent.programId,
                  academicYear: row.academicYear,
                  semesterId: row.resolvedSemesterId || currentStudent.semesterId,
                  divisionId: row.resolvedDivisionId || currentStudent.divisionId,
                  batchId: row.resolvedBatchId || currentStudent.batchId,
                  mentorId: row.resolvedMentorId || currentStudent.mentorId,
                  status: (row.studentStatus as any) || currentStudent.status || 'ACTIVE'
                };
                updatedExisting++;
              }
            }

            // ── STEP B: Historical Mapping Management ──
            // Mark all previous mappings for this student as historical (isCurrent = false)
            state.studentEnrollmentMappings.forEach(m => {
              if (m.studentId === targetStudentId && m.isCurrent) {
                m.isCurrent = false;
                if (m.status === 'ACTIVE') {
                  m.status = 'HISTORICAL';
                }
              }
            });

            // Create New Current Mapping Record
            const mappingId = `sem-map-${targetStudentId}-${row.academicYear.replace(/[^a-zA-Z0-9]/g, '')}-s${row.semesterNumber}-${Date.now()}`;
            const newMapping: StudentEnrollmentMapping = {
              id: mappingId,
              studentId: targetStudentId,
              enrollmentNo: row.enrollmentNo,
              studentName: row.studentName,
              studentEmail: row.studentEmail,
              academicYear: row.academicYear,
              instituteId: row.resolvedInstituteId || 'inst-1',
              instituteCode: row.instituteCode,
              instituteName: row.resolvedInstituteName,
              departmentId: row.resolvedDepartmentId || 'dept-1',
              departmentCode: row.departmentCode,
              departmentName: row.resolvedDepartmentName,
              programId: row.resolvedProgramId || 'prog-1',
              programCode: row.programCode,
              programName: row.resolvedProgramName,
              semester: row.semesterNumber,
              semesterId: row.resolvedSemesterId || 'sem-cse-4',
              divisionId: row.resolvedDivisionId || 'div-cse-4a',
              division: row.division,
              classBatchId: row.resolvedBatchId,
              batchName: row.batchName,
              mentorFacultyId: row.resolvedMentorId,
              mentorName: row.resolvedMentorName,
              status: 'ACTIVE',
              isCurrent: true,
              mappedBy: actorId,
              mappedByName: actorName,
              mappedByRole: actorRole,
              mappedAt: nowIso,
              batchImportSessionId: batchId
            };

            state.studentEnrollmentMappings.push(newMapping);
            successfullyMapped++;

            rowDetails.push({
              rowNo: row.rowNo,
              enrollmentNo: row.enrollmentNo,
              studentName: row.studentName,
              studentEmail: row.studentEmail,
              institute: row.instituteCode,
              department: row.departmentCode,
              program: row.programCode,
              academicYear: row.academicYear,
              semester: `Sem ${row.semesterNumber}`,
              division: row.division,
              batch: row.batchName,
              mentor: row.resolvedMentorName || row.mentorFaculty,
              studentStatus: row.studentStatus,
              actionTaken: row.isExistingStudent ? 'UPDATED' : 'CREATED',
              status: 'SUCCESS',
              message: row.isExistingStudent
                ? `Updated existing student mapping to ${row.academicYear} Sem ${row.semesterNumber} Div ${row.division}.`
                : `Created new student record and mapped to ${row.academicYear} Sem ${row.semesterNumber} Div ${row.division}.`
            });

          } catch (rowErr: any) {
            console.error(`[ROW IMPORT ERROR] Row ${row.rowNo}:`, rowErr);
            failed++;
            rowDetails.push({
              rowNo: row.rowNo,
              enrollmentNo: row.enrollmentNo,
              studentName: row.studentName,
              studentEmail: row.studentEmail,
              institute: row.instituteCode,
              department: row.departmentCode,
              program: row.programCode,
              academicYear: row.academicYear,
              semester: `Sem ${row.semesterNumber}`,
              division: row.division,
              actionTaken: 'FAILED',
              status: 'ERROR',
              message: 'Failed to process student mapping record.',
              error: rowErr?.message || 'Database error'
            });
          }
        }

        // ── STEP C: Create History Record ──
        const primaryRow = validRows[0];
        const historyRecord: StudentMappingHistoryRecord = {
          id: historyId,
          batchId,
          timestamp: nowIso,
          importedBy: actorId,
          importedByName: actorName,
          importedByRole: actorRole,
          academicYear: primaryRow?.academicYear || '2025-26',
          institute: primaryRow?.resolvedInstituteName || primaryRow?.instituteCode || 'SSCIT',
          department: primaryRow?.resolvedDepartmentName || primaryRow?.departmentCode || 'CSE',
          program: primaryRow?.resolvedProgramName || primaryRow?.programCode || 'B.Tech CSE',
          semester: `Sem ${primaryRow?.semesterNumber || 4}`,
          division: primaryRow?.division || 'A',
          totalRecords: validRows.length,
          successful: successfullyMapped,
          updatedExisting,
          newStudents: newCreated,
          failed,
          skipped,
          status: failed === 0 ? 'COMPLETED' : successfullyMapped > 0 ? 'PARTIAL' : 'FAILED',
          fileName: metadata?.fileName || 'Bulk_Student_Mapping.xlsx',
          fileSize: metadata?.fileSize || '32 KB',
          rowDetails,
          notes: `Bulk mapped ${successfullyMapped} students by ${actorName} (${actorRole})`
        };

        state.studentMappingHistories.unshift(historyRecord);

        // ── STEP D: Audit Log ──
        try {
          auditLogService.log({
            action: 'BULK_STUDENT_MAPPING',
            module: 'STUDENT_MAPPING',
            recordId: batchId,
            details: `Bulk mapped ${successfullyMapped} students across ${primaryRow?.programCode || 'Academic Programs'} for Academic Year ${primaryRow?.academicYear || '2025-26'}`,
            user: user || undefined,
            newValue: {
              batchId,
              historyId,
              successful: successfullyMapped,
              newCreated,
              updatedExisting,
              failed,
              skipped
            }
          });
        } catch (auditErr) {
          console.warn('[AUDIT LOG WARNING]', auditErr);
        }
      });

      const savedHistory = this.getStudentMappingHistoryById(historyId);

      return {
        success: true,
        historyId,
        totalRecords: validRows.length,
        successfullyMapped,
        updatedExisting,
        newCreated,
        skipped,
        failed,
        message: `Successfully mapped ${successfullyMapped} students (${newCreated} new, ${updatedExisting} updated).`,
        historyRecord: savedHistory!
      };

    } catch (txnErr: any) {
      console.error('[BULK MAPPING TRANSACTION FAILED]', txnErr);
      return {
        success: false,
        historyId,
        totalRecords: validRows.length,
        successfullyMapped: 0,
        updatedExisting: 0,
        newCreated: 0,
        skipped: validRows.length,
        failed: validRows.length,
        message: `Import transaction aborted: ${txnErr?.message || 'Database error occurred'}. All changes were rolled back.`,
        errors: [txnErr?.message || 'Unknown database exception'],
        historyRecord: {
          id: historyId,
          batchId,
          timestamp: nowIso,
          importedBy: actorId,
          importedByName: actorName,
          importedByRole: actorRole,
          academicYear: '2025-26',
          institute: 'SSCIT',
          department: 'CSE',
          program: 'B.Tech CSE',
          semester: 'Sem 4',
          division: 'A',
          totalRecords: validRows.length,
          successful: 0,
          updatedExisting: 0,
          newStudents: 0,
          failed: validRows.length,
          skipped: 0,
          status: 'FAILED',
          rowDetails: []
        }
      };
    }
  }

  // ============================================================================
  // 6. QUERY & RETRIEVAL APIS
  // ============================================================================

  public getStudentEnrollmentMappings(filters?: {
    academicYear?: string;
    instituteId?: string;
    departmentId?: string;
    programId?: string;
    semester?: number;
    division?: string;
    batchId?: string;
    mentorFacultyId?: string;
    isCurrentOnly?: boolean;
  }): StudentEnrollmentMapping[] {
    const all = (db.getState().studentEnrollmentMappings || []) as StudentEnrollmentMapping[];

    if (!filters) return all;

    return all.filter(m => {
      if (filters.isCurrentOnly && !m.isCurrent) return false;
      if (filters.academicYear && filters.academicYear !== 'ALL' && m.academicYear !== filters.academicYear) return false;
      if (filters.instituteId && filters.instituteId !== 'ALL' && m.instituteId !== filters.instituteId) return false;
      if (filters.departmentId && filters.departmentId !== 'ALL' && m.departmentId !== filters.departmentId) return false;
      if (filters.programId && filters.programId !== 'ALL' && m.programId !== filters.programId) return false;
      if (filters.semester && m.semester !== filters.semester) return false;
      if (filters.division && filters.division !== 'ALL' && m.division.toUpperCase() !== filters.division.toUpperCase()) return false;
      if (filters.batchId && filters.batchId !== 'ALL' && m.classBatchId !== filters.batchId) return false;
      if (filters.mentorFacultyId && filters.mentorFacultyId !== 'ALL' && m.mentorFacultyId !== filters.mentorFacultyId) return false;
      return true;
    });
  }

  public getActiveMappingForStudent(studentId: string): StudentEnrollmentMapping | undefined {
    const mappings = this.getStudentEnrollmentMappings({ isCurrentOnly: true });
    return mappings.find(m => m.studentId === studentId || m.enrollmentNo === studentId);
  }

  public getHistoricalMappingsForStudent(studentId: string): StudentEnrollmentMapping[] {
    const all = (db.getState().studentEnrollmentMappings || []) as StudentEnrollmentMapping[];
    return all.filter(m => m.studentId === studentId || m.enrollmentNo === studentId).sort(
      (a, b) => new Date(b.mappedAt).getTime() - new Date(a.mappedAt).getTime()
    );
  }

  public getStudentMappingHistories(): StudentMappingHistoryRecord[] {
    return (db.getState().studentMappingHistories || []) as StudentMappingHistoryRecord[];
  }

  public getStudentMappingHistoryById(id: string): StudentMappingHistoryRecord | undefined {
    const list = this.getStudentMappingHistories();
    return list.find(h => h.id === id || h.batchId === id);
  }

  // ============================================================================
  // 7. EXPORT MAPPING REPORT AS EXCEL
  // ============================================================================

  public exportMappingReport(historyId: string): void {
    const history = this.getStudentMappingHistoryById(historyId);
    if (!history) {
      alert('Mapping history record not found.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['SWARRNIM UNIVERSITY ERP — STUDENT MAPPING IMPORT REPORT', ''],
      ['Batch ID', history.batchId],
      ['Import Timestamp', new Date(history.timestamp).toLocaleString()],
      ['Imported By', `${history.importedByName} (${history.importedByRole})`],
      ['Academic Year', history.academicYear],
      ['Institute', history.institute],
      ['Department', history.department],
      ['Program', history.program],
      ['Semester / Division', `${history.semester} / ${history.division}`],
      ['Total Processed Records', history.totalRecords],
      ['Successfully Mapped', history.successful],
      ['New Students Registered', history.newStudents],
      ['Existing Students Updated', history.updatedExisting],
      ['Failed Records', history.failed],
      ['Skipped Records', history.skipped],
      ['Overall Batch Status', history.status]
    ];

    const wsSumm = XLSX.utils.aoa_to_sheet(summaryData);
    wsSumm['!cols'] = [{ wch: 28 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsSumm, 'Batch_Summary');

    // Details Sheet
    const detailHeaders = [
      'Row No',
      'Enrollment No',
      'Student Name',
      'Email',
      'Institute',
      'Department',
      'Program',
      'Academic Year',
      'Semester',
      'Division',
      'Batch',
      'Mentor',
      'Action Taken',
      'Status',
      'Message',
      'Error'
    ];

    const detailRows = history.rowDetails.map(r => [
      r.rowNo,
      r.enrollmentNo,
      r.studentName,
      r.studentEmail || '',
      r.institute,
      r.department,
      r.program,
      r.academicYear,
      r.semester,
      r.division,
      r.batch || '',
      r.mentor || '',
      r.actionTaken,
      r.status,
      r.message,
      r.error || ''
    ]);

    const wsDet = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDet['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 24 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 22 },
      { wch: 14 },
      { wch: 12 },
      { wch: 45 },
      { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, wsDet, 'Row_Level_Details');

    XLSX.writeFile(wb, `Student_Mapping_Report_${history.batchId}.xlsx`);
  }
}

export const studentEnrollmentMappingService = StudentEnrollmentMappingService.getInstance();
