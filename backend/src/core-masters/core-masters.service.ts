import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasterDataCacheService } from '../common/cache/master-data-cache.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class CoreMastersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MasterDataCacheService,
  ) {}

  // 1. University Master
  async getUniversities() {
    return this.cache.getOrSet('university:master', () =>
      this.prisma.university.findMany({
        include: {
          institutes: { select: { id: true, code: true, name: true, status: true } },
        },
        orderBy: { code: 'asc' },
      }),
    );
  }

  async createUniversity(dto: CreateUniversityDto) {
    const existing = await this.prisma.university.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) throw new BadRequestException(`University with code '${dto.code}' already exists.`);

    const created = await this.prisma.university.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        tagline: dto.tagline,
        address: dto.address,
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
        status: 'ACTIVE',
      },
    });

    this.cache.invalidate('university');
    return created;
  }

  async updateUniversity(id: string, dto: Partial<CreateUniversityDto>) {
    const uni = await this.prisma.university.findUnique({ where: { id } });
    if (!uni) throw new NotFoundException('University not found.');

    const updated = await this.prisma.university.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : uni.name,
        tagline: dto.tagline !== undefined ? dto.tagline : uni.tagline,
        address: dto.address !== undefined ? dto.address : uni.address,
        website: dto.website !== undefined ? dto.website : uni.website,
        email: dto.email !== undefined ? dto.email : uni.email,
        phone: dto.phone !== undefined ? dto.phone : uni.phone,
      },
    });

    this.cache.invalidate('university');
    return updated;
  }

  // 2. Institutes
  async getInstitutes() {
    return this.cache.getOrSet('institutes', () =>
      this.prisma.institute.findMany({
        include: {
          university: { select: { code: true, name: true } },
          departments: { select: { id: true, code: true, name: true, status: true } },
          _count: { select: { students: true, faculty: true } },
        },
        orderBy: { code: 'asc' },
      }),
    );
  }

  async createInstitute(dto: CreateInstituteDto) {
    const existing = await this.prisma.institute.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) throw new BadRequestException(`Institute with code '${dto.code}' already exists.`);

    const created = await this.prisma.institute.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        shortName: dto.shortName,
        universityId: dto.universityId,
        status: 'ACTIVE',
      },
    });

    this.cache.invalidate('institutes');
    return created;
  }

  async updateInstitute(id: string, dto: Partial<CreateInstituteDto>) {
    const inst = await this.prisma.institute.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institute not found.');

    const updated = await this.prisma.institute.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : inst.name,
        shortName: dto.shortName !== undefined ? dto.shortName : inst.shortName,
      },
    });

    this.cache.invalidate('institutes');
    return updated;
  }

  // 3. Departments
  async getDepartments(instituteId?: string) {
    const cacheKey = `departments:${instituteId || 'all'}`;
    return this.cache.getOrSet(cacheKey, () => {
      const where: any = {};
      if (instituteId) where.instituteId = instituteId;

      return this.prisma.department.findMany({
        where,
        include: {
          institute: { select: { code: true, name: true } },
          programs: true,
          _count: { select: { students: true, faculty: true } },
        },
        orderBy: { code: 'asc' },
      });
    });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) throw new BadRequestException(`Department with code '${dto.code}' already exists.`);

    const created = await this.prisma.department.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        instituteId: dto.instituteId,
        status: 'ACTIVE',
      },
    });

    this.cache.invalidate('departments');
    return created;
  }

  async updateDepartment(id: string, dto: Partial<CreateDepartmentDto>) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('Department not found.');

    const updated = await this.prisma.department.update({
      where: { id },
      data: { name: dto.name ? dto.name.trim() : department.name },
    });

    this.cache.invalidate('departments');
    return updated;
  }
  // 4. Programs
  async getPrograms(departmentId?: string) {
    const cacheKey = `programs:${departmentId || 'all'}`;
    return this.cache.getOrSet(cacheKey, () => {
      const where: any = {};
      if (departmentId) where.departmentId = departmentId;

      return this.prisma.program.findMany({
        where,
        include: {
          department: { select: { code: true, name: true, instituteId: true } },
          subjects: true,
          _count: { select: { batches: true, subjects: true } },
        },
        orderBy: { code: 'asc' },
      });
    });
  }

  async createProgram(dto: CreateProgramDto) {
    const existing = await this.prisma.program.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) throw new BadRequestException(`Program with code '${dto.code}' already exists.`);

    const created = await this.prisma.program.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        degreeType: dto.degree || 'UG',
        durationYears: dto.durationYears,
        departmentId: dto.departmentId,
        status: 'ACTIVE',
      },
    });

    this.cache.invalidate('programs');
    return created;
  }

  async updateProgram(id: string, dto: Partial<CreateProgramDto>) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program not found.');

    const updated = await this.prisma.program.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : program.name,
        degreeType: dto.degree || program.degreeType,
        durationYears: dto.durationYears || program.durationYears,
      },
    });

    this.cache.invalidate('programs');
    return updated;
  }

  // 5. Academic Years
  async getAcademicYears() {
    return this.cache.getOrSet('academic-years', () =>
      this.prisma.academicYear.findMany({
        include: {
          batches: true,
          _count: { select: { batches: true } },
        },
        orderBy: { startYear: 'desc' },
      }),
    );
  }

  async createAcademicYear(dto: CreateAcademicYearDto) {
    const code = dto.yearCode?.trim() || `${dto.startYear}-${dto.endYear}`;
    const existing = await this.prisma.academicYear.findUnique({ where: { code } });
    if (existing) throw new BadRequestException(`Academic year '${code}' already exists.`);

    const created = await this.prisma.academicYear.create({
      data: {
        code,
        startYear: dto.startYear || Number(code.split('-')[0]),
        endYear: dto.endYear || Number(code.split('-')[1]),
        isCurrent: !!dto.isCurrent,
        status: 'ACTIVE',
      },
    });

    this.cache.invalidate('academic-years');
    return created;
  }

  async updateAcademicYear(id: string, dto: Partial<CreateAcademicYearDto>) {
    const ay = await this.prisma.academicYear.findUnique({ where: { id } });
    if (!ay) throw new NotFoundException('Academic year not found.');

    const updated = await this.prisma.academicYear.update({
      where: { id },
      data: {
        isCurrent: dto.isCurrent !== undefined ? dto.isCurrent : ay.isCurrent,
      },
    });

    this.cache.invalidate('academic-years');
    return updated;
  }

  // 6. Subjects / Courses Master
  async getSubjects(departmentId?: string, programId?: string, semesterNumber?: number) {
    const cacheKey = `subjects:${departmentId || 'all'}:${programId || 'all'}:${semesterNumber || 'all'}`;
    return this.cache.getOrSet(cacheKey, () => {
      const where: any = {};
      if (programId) where.programId = programId;

      return this.prisma.subject.findMany({
        where,
        include: {
          program: { select: { code: true, name: true } },
          semester: { select: { name: true } },
        },
        orderBy: { code: 'asc' },
      });
    });
  }

  async createSubject(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) throw new BadRequestException(`Subject code '${dto.code}' already exists.`);

    const created = await this.prisma.subject.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        credits: dto.credits,
        subjectType: dto.type || dto.subjectType || 'THEORY',
        programId: dto.programId,
        semesterId: dto.semesterId,
        status: 'ACTIVE',
      },
    });

    this.cache.invalidate('subjects');
    return created;
  }

  async updateSubject(id: string, dto: Partial<CreateSubjectDto>) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found.');

    const updated = await this.prisma.subject.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : subject.name,
        credits: dto.credits !== undefined ? dto.credits : subject.credits,
        subjectType: dto.type || dto.subjectType || subject.subjectType,
      },
    });

    this.cache.invalidate('subjects');
    return updated;
  }

  // 7. Students Directory, Creation & Profile
  async getStudents(query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(Number(query.limit) || 20, 100)); // Capped at 100 records max
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.instituteId && query.instituteId !== 'ALL') where.instituteId = query.instituteId;
    if (query.departmentId && query.departmentId !== 'ALL') where.departmentId = query.departmentId;
    if (query.programId && query.programId !== 'ALL') {
      where.batch = { programId: query.programId };
    }
    if (query.batchId && query.batchId !== 'ALL') where.batchId = query.batchId;

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { enrollmentNo: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const allowedSortFields = ['enrollmentNo', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'status'];
    const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy! : 'enrollmentNo';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const [total, data] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          erpId: true,
          enrollmentNo: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          gender: true,
          status: true,
          dateOfBirth: true,
          instituteId: true,
          departmentId: true,
          batchId: true,
          createdAt: true,
          institute: { select: { id: true, code: true, name: true } },
          department: { select: { id: true, code: true, name: true } },
          batch: {
            select: {
              id: true,
              code: true,
              program: { select: { id: true, code: true, name: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ── Central User Management Pagination & Filtering ──
  async getUsers(query: PaginationQueryDto, currentUser: any) {
    const allowedRoles = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR', 'HOI', 'PRINCIPAL', 'HOD', 'HR', 'HR_ADMIN', 'ERP_COORDINATOR'];
    const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
    const hasAccess = userRoles.some((r: string) => allowedRoles.includes(r));
    if (!hasAccess) {
      throw new ForbiddenException('403 Forbidden: You do not have permission to access Central User Management.');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(Number(query.limit) || 20, 100)); // Max 100 records
    const skip = (page - 1) * limit;

    const where: any = {};

    // Scope Enforcement for HOD / HOI
    if (userRoles.includes('HOD') && !userRoles.some((r: string) => ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'ADMIN'].includes(r))) {
      if (currentUser.departmentId) {
        where.OR = [
          { faculty: { departmentId: currentUser.departmentId } },
          { student: { departmentId: currentUser.departmentId } },
          { employee: { departmentId: currentUser.departmentId } },
        ];
      }
    } else if (userRoles.includes('HOI') || userRoles.includes('PRINCIPAL')) {
      if (currentUser.instituteId) {
        where.OR = [
          { faculty: { instituteId: currentUser.instituteId } },
          { student: { instituteId: currentUser.instituteId } },
          { employee: { instituteId: currentUser.instituteId } },
        ];
      }
    }

    if (query.instituteId && query.instituteId !== 'ALL') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { faculty: { instituteId: query.instituteId } },
            { student: { instituteId: query.instituteId } },
            { employee: { instituteId: query.instituteId } },
          ],
        },
      ];
    }

    if (query.departmentId && query.departmentId !== 'ALL') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { faculty: { departmentId: query.departmentId } },
            { student: { departmentId: query.departmentId } },
            { employee: { departmentId: query.departmentId } },
          ],
        },
      ];
    }

    if (query.status && query.status !== 'ALL') {
      where.accountStatus = query.status;
    }

    if (query.role && query.role !== 'ALL') {
      where.userRoles = {
        some: { role: { code: query.role } },
      };
    }

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        const searchConditions = [
          { username: { contains: term, mode: 'insensitive' } },
          { erpId: { contains: term, mode: 'insensitive' } },
          { student: { OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { enrollmentNo: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ] } },
          { faculty: { OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { employeeCode: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ] } },
          { employee: { OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { employeeCode: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ] } },
        ];

        if (where.OR) {
          where.AND = [...(where.AND || []), { OR: searchConditions }];
        } else {
          where.OR = searchConditions;
        }
      }
    }

    const [total, rawData] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          erpId: true,
          username: true,
          accountStatus: true,
          isFirstLogin: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              role: { select: { code: true, name: true } },
              scopeType: true,
              scopeId: true,
            },
          },
          student: {
            select: {
              id: true,
              enrollmentNo: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              instituteId: true,
              departmentId: true,
            },
          },
          faculty: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              designation: true,
              instituteId: true,
              departmentId: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              designation: true,
              instituteId: true,
              departmentId: true,
            },
          },
        },
        orderBy: { username: 'asc' },
      }),
    ]);

    // Strip any sensitive hashes and format clean DTO
    const data = rawData.map(u => {
      const primaryRole = u.userRoles?.[0]?.role?.code || 'USER';
      const name = u.student
        ? `${u.student.firstName} ${u.student.lastName}`
        : u.faculty
        ? `${u.faculty.firstName} ${u.faculty.lastName}`
        : u.employee
        ? `${u.employee.firstName} ${u.employee.lastName}`
        : u.username;

      const email = u.student?.email || u.faculty?.email || u.employee?.email || `${u.username}@swarrnim.edu.in`;
      const identifier = u.student?.enrollmentNo || u.faculty?.employeeCode || u.employee?.employeeCode || u.erpId || u.username;

      return {
        id: u.id,
        erpId: u.erpId,
        username: u.username,
        name,
        email,
        identifier,
        role: primaryRole,
        accountStatus: u.accountStatus,
        isFirstLogin: u.isFirstLogin,
        instituteId: u.student?.instituteId || u.faculty?.instituteId || u.employee?.instituteId,
        departmentId: u.student?.departmentId || u.faculty?.departmentId || u.employee?.departmentId,
        createdAt: u.createdAt,
      };
    });

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getStudentById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        institute: true,
        department: true,
        batch: true,
        division: true,
        user: { select: { erpId: true, username: true, accountStatus: true } },
      },
    });

    if (!student) throw new NotFoundException('Student record not found.');
    return student;
  }

  async getStudentAcademicProfile(id: string) {
    const student = await this.getStudentById(id);

    const [subjects, courseTeachers, mentors] = await Promise.all([
      this.prisma.subject.findMany({
        where: { programId: student.batch.programId, status: 'ACTIVE' },
      }),
      this.prisma.studentFacultyMapping.findMany({
        where: { studentId: id, status: 'ACTIVE' },
        include: {
          faculty: { select: { employeeCode: true, firstName: true, lastName: true, designation: true, email: true } },
          subject: { select: { code: true, name: true, credits: true } },
        },
      }),
      this.prisma.studentMentorMapping.findMany({
        where: { studentId: id, status: 'ACTIVE' },
        include: {
          faculty: { select: { employeeCode: true, firstName: true, lastName: true, designation: true, email: true } },
          academicYear: { select: { code: true } },
        },
      }),
    ]);

    return {
      student,
      enrolledSubjects: subjects,
      assignedCourseTeachers: courseTeachers,
      assignedMentors: mentors,
    };
  }

  async createStudent(dto: CreateStudentDto) {
    const existing = await this.prisma.student.findFirst({
      where: { OR: [{ enrollmentNo: dto.enrollmentNo.trim() }, { email: dto.email.trim().toLowerCase() }] },
    });
    if (existing) throw new BadRequestException(`Student with enrollment '${dto.enrollmentNo}' or email '${dto.email}' already exists.`);

    return this.prisma.student.create({
      data: {
        erpId: `STU${String(Date.now()).slice(-6)}`,
        enrollmentNo: dto.enrollmentNo.trim(),
        firstName: dto.firstName?.trim() || dto.name?.trim() || 'Student',
        middleName: dto.middleName?.trim(),
        lastName: dto.lastName?.trim() || '',
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone,
        gender: dto.gender || 'Male',
        instituteId: dto.instituteId,
        departmentId: dto.departmentId,
        batchId: dto.batchId,
        currentDivisionId: dto.divisionId || dto.currentDivisionId,
        status: dto.status || 'ACTIVE',
      },
      include: {
        institute: { select: { code: true, name: true } },
        department: { select: { code: true, name: true } },
        batch: { select: { code: true } },
      },
    });
  }

  async updateStudent(id: string, dto: UpdateStudentDto, user?: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found.');

    // Check if student identity is verified via DigiLocker
    const dlConn = await this.prisma.digiLockerConnection.findUnique({ where: { studentId: id } });
    const isDlVerified = dlConn && dlConn.status === 'CONNECTED';

    if (isDlVerified && user?.role === 'STUDENT') {
      const isNameModified = (dto.firstName && dto.firstName !== student.firstName) || (dto.lastName && dto.lastName !== student.lastName);
      if (isNameModified) {
        throw new BadRequestException('Student legal name is verified via DigiLocker and cannot be manually modified. Please update via issuing authority and synchronize DigiLocker.');
      }
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: isDlVerified && user?.role === 'STUDENT' ? student.firstName : (dto.firstName || (dto.name ? dto.name.trim() : student.firstName)),
        lastName: isDlVerified && user?.role === 'STUDENT' ? student.lastName : (dto.lastName || student.lastName),
        email: dto.email ? dto.email.trim().toLowerCase() : student.email,
        phone: dto.phone !== undefined ? dto.phone : student.phone,
        currentDivisionId: dto.divisionId || dto.currentDivisionId || student.currentDivisionId,
        status: dto.status || student.status,
      },
    });
  }

  async bulkImportStudents(students: CreateStudentDto[]) {
    const results = [];
    for (const studentDto of students) {
      try {
        const created = await this.createStudent(studentDto);
        results.push({ success: true, enrollmentNo: studentDto.enrollmentNo, id: created.id });
      } catch (err: any) {
        results.push({ success: false, enrollmentNo: studentDto.enrollmentNo, error: err.message });
      }
    }
    return { total: students.length, results };
  }

  // 8. Faculty Directory, Creation & Profile
  async getFaculty(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.instituteId) where.instituteId = query.instituteId;
    if (query.departmentId) where.departmentId = query.departmentId;

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { employeeCode: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { designation: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.faculty.count({ where }),
      this.prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        include: {
          institute: { select: { code: true, name: true } },
          department: { select: { code: true, name: true } },
        },
        orderBy: { employeeCode: 'asc' },
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getFacultyById(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        institute: true,
        department: true,
        user: { select: { erpId: true, username: true, accountStatus: true } },
        facultySubjectMappings: {
          include: {
            subject: { select: { code: true, name: true, credits: true } },
            division: { select: { name: true } },
          },
        },
        studentMentorMappings: {
          include: {
            student: { select: { enrollmentNo: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!faculty) throw new NotFoundException('Faculty record not found.');
    return faculty;
  }

  async createFaculty(dto: CreateFacultyDto) {
    const existing = await this.prisma.faculty.findFirst({
      where: { OR: [{ employeeCode: dto.employeeCode.trim() }, { email: dto.email.trim().toLowerCase() }] },
    });
    if (existing) throw new BadRequestException(`Faculty with code '${dto.employeeCode}' or email '${dto.email}' already exists.`);

    return this.prisma.faculty.create({
      data: {
        erpId: `FAC${String(Date.now()).slice(-6)}`,
        employeeCode: dto.employeeCode.trim(),
        firstName: dto.firstName?.trim() || dto.name?.trim() || 'Faculty',
        middleName: dto.middleName?.trim(),
        lastName: dto.lastName?.trim() || '',
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone,
        designation: dto.designation || 'Assistant Professor',
        instituteId: dto.instituteId,
        departmentId: dto.departmentId,
        status: dto.status || 'ACTIVE',
      },
      include: {
        institute: { select: { code: true, name: true } },
        department: { select: { code: true, name: true } },
      },
    });
  }

  async updateFaculty(id: string, dto: Partial<CreateFacultyDto>) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id } });
    if (!faculty) throw new NotFoundException('Faculty not found.');

    return this.prisma.faculty.update({
      where: { id },
      data: {
        firstName: dto.firstName || (dto.name ? dto.name.trim() : faculty.firstName),
        lastName: dto.lastName || faculty.lastName,
        email: dto.email ? dto.email.trim().toLowerCase() : faculty.email,
        phone: dto.phone !== undefined ? dto.phone : faculty.phone,
        designation: dto.designation || faculty.designation,
        status: dto.status || faculty.status,
      },
    });
  }

  async bulkImportFaculty(facultyList: CreateFacultyDto[]) {
    const results = [];
    for (const facultyDto of facultyList) {
      try {
        const created = await this.createFaculty(facultyDto);
        results.push({ success: true, employeeCode: facultyDto.employeeCode, id: created.id });
      } catch (err: any) {
        results.push({ success: false, employeeCode: facultyDto.employeeCode, error: err.message });
      }
    }
    return { total: facultyList.length, results };
  }
}
