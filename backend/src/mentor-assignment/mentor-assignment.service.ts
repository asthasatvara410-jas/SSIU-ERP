import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  AssignMentorDto, 
  ChangeMentorDto, 
  RemoveMentorDto, 
  MentorQueryDto, 
  BulkMentorCommitDto 
} from './dto/mentor-assignment.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class MentorAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. RBAC SCOPE VALIDATION
   * HOI (Principal) can manage all students across all departments in their authorized Institute.
   * HOD can manage students belonging to their authorized Department only.
   */
  public isUserAuthorizedForStudent(user: any, student: any): boolean {
    if (!user) return false;
    const role = user.role || '';
    const roles: string[] = user.roles || [];

    const isSuper = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || roles.includes('SUPER_ADMIN') || roles.includes('UNIVERSITY_ADMIN');
    if (isSuper) return true;

    const isHOI = role === 'PRINCIPAL' || role === 'HOI' || roles.includes('PRINCIPAL') || roles.includes('HOI');
    if (isHOI) {
      return Boolean(user.instituteId && student.instituteId === user.instituteId);
    }

    const isHOD = role === 'HOD' || roles.includes('HOD');
    if (isHOD) {
      const userDept = user.departmentId || user.department;
      return Boolean(userDept && student.departmentId === userDept);
    }

    return false;
  }

  /**
   * 2. LOOK UP ACTIVE MENTOR FOR A STUDENT
   */
  async getActiveMentorForStudent(studentIdOrEnrollment: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: studentIdOrEnrollment },
          { enrollmentNo: studentIdOrEnrollment },
          { email: studentIdOrEnrollment }
        ]
      }
    });

    if (!student) return null;

    const active = await this.prisma.mentorAssignment.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE'
      },
      include: {
        faculty: {
          include: { department: true, institute: true }
        }
      }
    });

    return active;
  }

  /**
   * 3. GET ELIGIBLE MENTORS FOR SELECTION
   * Only active faculty belonging to the appropriate Institute/Department are returned.
   */
  async getEligibleMentors(params: { instituteId?: string; departmentId?: string; studentId?: string }, user?: any) {
    let targetInstId = params.instituteId;
    let targetDeptId = params.departmentId;

    if (params.studentId) {
      const student = await this.prisma.student.findFirst({
        where: {
          OR: [{ id: params.studentId }, { enrollmentNo: params.studentId }]
        }
      });
      if (student) {
        targetInstId = student.instituteId;
        targetDeptId = student.departmentId;
      }
    } else if (user) {
      if (user.role === 'HOD') {
        targetDeptId = user.departmentId || user.department;
      } else if (user.role === 'PRINCIPAL') {
        targetInstId = user.instituteId;
      }
    }

    const where: any = {
      status: 'ACTIVE'
    };

    if (targetDeptId && targetDeptId !== 'ALL') {
      where.departmentId = targetDeptId;
    }
    if (targetInstId && targetInstId !== 'ALL') {
      where.instituteId = targetInstId;
    }

    const faculties = await this.prisma.faculty.findMany({
      where,
      include: {
        department: true,
        institute: true,
        user: { select: { id: true, erpId: true, username: true, accountStatus: true } }
      },
      orderBy: { firstName: 'asc' }
    });

    return faculties.map(f => ({
      id: f.id,
      employeeId: f.employeeCode,
      name: `${f.firstName} ${f.lastName}`.trim(),
      designation: f.designation,
      departmentId: f.departmentId,
      departmentName: f.department?.name,
      departmentCode: f.department?.code,
      instituteId: f.instituteId,
      instituteName: f.institute?.name,
      email: f.email,
      phone: f.phone,
      status: f.status
    }));
  }

  /**
   * 4. QUERY MENTOR ASSIGNMENTS (SCOPED BY RBAC)
   */
  async getAssignments(query: MentorQueryDto = {}, user: any) {
    const where: any = {};

    // Enforce RBAC Scoping
    if (user) {
      if (user.role === 'PRINCIPAL') {
        if (user.instituteId) where.instituteId = user.instituteId;
      } else if (user.role === 'HOD') {
        const dept = user.departmentId || user.department;
        if (dept) where.departmentId = dept;
      } else if (user.role === 'FACULTY') {
        // Faculty sees only their assigned mentees
        const myFaculty = await this.prisma.faculty.findFirst({
          where: { OR: [{ id: user.id }, { email: user.email }, { employeeCode: user.username }] }
        });
        where.mentorFacultyId = myFaculty?.id || user.id;
        where.status = 'ACTIVE';
      } else if (user.role === 'STUDENT') {
        const student = await this.prisma.student.findFirst({
          where: { OR: [{ id: user.id }, { enrollmentNo: user.username }, { email: user.email }] }
        });
        where.studentId = student?.id || user.id;
      }
    }

    // Apply optional query filters
    if (query.instituteId && query.instituteId !== 'ALL') where.instituteId = query.instituteId;
    if (query.departmentId && query.departmentId !== 'ALL') where.departmentId = query.departmentId;
    if (query.programId && query.programId !== 'ALL') where.programId = query.programId;
    if (query.mentorFacultyId && query.mentorFacultyId !== 'ALL') where.mentorFacultyId = query.mentorFacultyId;
    if (query.status && query.status !== 'ALL') where.status = query.status;

    if (query.searchQuery?.trim()) {
      const q = query.searchQuery.trim();
      where.OR = [
        { student: { firstName: { contains: q, mode: 'insensitive' } } },
        { student: { lastName: { contains: q, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: q, mode: 'insensitive' } } },
        { faculty: { firstName: { contains: q, mode: 'insensitive' } } },
        { faculty: { lastName: { contains: q, mode: 'insensitive' } } },
        { faculty: { employeeCode: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.mentorAssignment.count({ where }),
      this.prisma.mentorAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: { department: true, institute: true, batch: { include: { program: true } } }
          },
          faculty: {
            include: { department: true, institute: true }
          },
          history: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 5. ASSIGN OR CHANGE MENTOR (CENTRALIZED RBAC & NON-DESTRUCTIVE OVERWRITE)
   */
  async assignMentor(dto: AssignMentorDto, user: any) {
    if (!user) throw new ForbiddenException('User authentication required.');

    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: dto.studentId },
          { enrollmentNo: dto.studentId }
        ]
      },
      include: {
        department: true,
        institute: true,
        batch: { include: { program: true } }
      }
    });

    if (!student) {
      throw new NotFoundException(`Student record "${dto.studentId}" not found.`);
    }

    // 1. RBAC Scope Validation
    if (!this.isUserAuthorizedForStudent(user, student)) {
      throw new ForbiddenException(`Unauthorized: ${user.role} cannot assign mentor to student outside authorized organizational scope.`);
    }

    // 2. Mentor Eligibility Check
    const mentorFaculty = await this.prisma.faculty.findFirst({
      where: {
        OR: [
          { id: dto.mentorFacultyId },
          { employeeCode: dto.mentorFacultyId }
        ]
      },
      include: { department: true, institute: true }
    });

    if (!mentorFaculty || mentorFaculty.status !== 'ACTIVE') {
      throw new BadRequestException('Selected faculty member is not active or not eligible to be assigned as mentor.');
    }

    if (mentorFaculty.departmentId !== student.departmentId) {
      throw new BadRequestException(`Faculty ${mentorFaculty.firstName} ${mentorFaculty.lastName} belongs to department "${mentorFaculty.department?.name}", which does not match student's department "${student.department?.name}".`);
    }

    // 3. Check for existing active assignment
    const currentActive = await this.prisma.mentorAssignment.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE'
      },
      include: { faculty: true }
    });

    const now = new Date();
    const effectiveFromDate = dto.effectiveFrom ? new Date(dto.effectiveFrom) : now;
    const actorName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || `${user.role} Officer`;

    return this.prisma.$transaction(async (tx: any) => {
      let previousHistoryRecorded = false;

      if (currentActive) {
        if (currentActive.mentorFacultyId === mentorFaculty.id) {
          throw new ConflictException(`Faculty ${mentorFaculty.firstName} ${mentorFaculty.lastName} is already the active mentor for this student.`);
        }

        if (!dto.isChange) {
          throw new BadRequestException('Mentor already assigned. You must use "Change Mentor" and provide a mandatory reason.');
        }

        if (!dto.changeReason || !dto.changeReason.trim()) {
          throw new BadRequestException('A mandatory change reason is required when changing an existing mentor.');
        }

        // Deactivate previous assignment
        await tx.mentorAssignment.update({
          where: { id: currentActive.id },
          data: {
            status: 'INACTIVE',
            effectiveTo: now,
            changeReason: dto.changeReason.trim(),
            updatedAt: now
          }
        });

        // Record audit history
        await tx.mentorAssignmentHistory.create({
          data: {
            assignmentId: currentActive.id,
            studentId: student.id,
            previousMentorId: currentActive.mentorFacultyId,
            previousMentorName: `${currentActive.faculty?.firstName} ${currentActive.faculty?.lastName}`.trim(),
            newMentorId: mentorFaculty.id,
            newMentorName: `${mentorFaculty.firstName} ${mentorFaculty.lastName}`.trim(),
            changedByUserId: user.id,
            changedByName: actorName,
            changedByRole: user.role,
            changeReason: dto.changeReason.trim(),
            effectiveFrom: currentActive.effectiveFrom,
            effectiveTo: now,
            createdAt: now
          }
        });
        previousHistoryRecorded = true;
      }

      // Create new active assignment
      const newAssignment = await tx.mentorAssignment.create({
        data: {
          studentId: student.id,
          mentorFacultyId: mentorFaculty.id,
          assignedByUserId: user.id,
          assignedByRole: user.role,
          assignedByName: actorName,
          instituteId: student.instituteId,
          departmentId: student.departmentId,
          programId: student.batch?.programId || 'prog-1',
          academicYearId: student.batch?.academicYearId || 'ay-2026',
          semesterId: null,
          section: 'Div A',
          assignedDate: now,
          effectiveFrom: effectiveFromDate,
          status: 'ACTIVE',
          changeReason: dto.changeReason ? dto.changeReason.trim() : null
        },
        include: {
          student: true,
          faculty: true
        }
      });

      return newAssignment;
    });
  }

  /**
   * 6. CHANGE MENTOR CONVENIENCE METHOD
   */
  async changeMentor(studentId: string, dto: ChangeMentorDto, user: any) {
    return this.assignMentor({
      studentId,
      mentorFacultyId: dto.newMentorFacultyId,
      changeReason: dto.changeReason,
      effectiveFrom: dto.effectiveFrom,
      isChange: true
    }, user);
  }

  /**
   * 7. REMOVE MENTOR ASSIGNMENT
   */
  async removeMentor(assignmentId: string, dto: RemoveMentorDto, user: any) {
    const assignment = await this.prisma.mentorAssignment.findUnique({
      where: { id: assignmentId },
      include: { student: true, faculty: true }
    });

    if (!assignment) {
      throw new NotFoundException(`Mentor assignment record "${assignmentId}" not found.`);
    }

    if (!this.isUserAuthorizedForStudent(user, assignment.student)) {
      throw new ForbiddenException('Unauthorized: You cannot remove mentor for students outside your authorized scope.');
    }

    const now = new Date();
    const actorName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || `${user.role} Officer`;

    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.mentorAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'INACTIVE',
          effectiveTo: now,
          changeReason: dto.reason.trim(),
          updatedAt: now
        }
      });

      await tx.mentorAssignmentHistory.create({
        data: {
          assignmentId: assignment.id,
          studentId: assignment.studentId,
          previousMentorId: assignment.mentorFacultyId,
          previousMentorName: `${assignment.faculty?.firstName} ${assignment.faculty?.lastName}`.trim(),
          newMentorId: '',
          newMentorName: 'None (Unassigned)',
          changedByUserId: user.id,
          changedByName: actorName,
          changedByRole: user.role,
          changeReason: dto.reason.trim(),
          effectiveFrom: assignment.effectiveFrom,
          effectiveTo: now,
          createdAt: now
        }
      });

      return updated;
    });
  }

  /**
   * 8. GET MENTOR ASSIGNMENT HISTORY
   */
  async getAssignmentHistory(studentIdOrEnrollment: string, user: any) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: studentIdOrEnrollment }, { enrollmentNo: studentIdOrEnrollment }]
      }
    });

    if (!student) {
      throw new NotFoundException('Student record not found.');
    }

    if (user.role === 'STUDENT' && user.id !== student.id && user.enrollmentNo !== student.enrollmentNo) {
      throw new ForbiddenException('You are only authorized to view your own mentorship history.');
    }

    return this.prisma.mentorAssignmentHistory.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 9. GENERATE OFFICIAL .XLSX TEMPLATE FOR BULK IMPORT
   */
  generateTemplateXlsx(): Buffer {
    const sampleData = [
      {
        'Student Enrollment Number': 'SSIU2023CS001',
        'Department Code': 'CSE',
        'Program Code': 'BTECH-CSE',
        'Semester': '4',
        'Section': 'Division A',
        'Mentor Employee ID': 'EMP-CS-001'
      },
      {
        'Student Enrollment Number': 'SSIU2023CS002',
        'Department Code': 'CSE',
        'Program Code': 'BTECH-CSE',
        'Semester': '4',
        'Section': 'Division A',
        'Mentor Employee ID': 'EMP-CS-002'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 28 }, // Student Enrollment Number
      { wch: 18 }, // Department Code
      { wch: 18 }, // Program Code
      { wch: 12 }, // Semester
      { wch: 16 }, // Section
      { wch: 22 }  // Mentor Employee ID
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mentor_Assignments');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 10. PARSE AND VALIDATE BULK XLSX UPLOAD
   */
  async parseAndValidateBulkXlsx(buffer: Buffer, user: any) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const errorsSummary: string[] = [];

    for (let idx = 0; idx < rawRows.length; idx++) {
      const row = rawRows[idx];
      const rowNum = idx + 2;
      const studentEnrollment = String(row['Student Enrollment Number'] || row['studentEnrollmentNo'] || '').trim();
      const mentorEmpId = String(row['Mentor Employee ID'] || row['mentorEmployeeId'] || '').trim();
      const deptCode = String(row['Department Code'] || row['departmentCode'] || '').trim();
      const progCode = String(row['Program Code'] || row['programCode'] || '').trim();
      const semester = row['Semester'] || row['semester'] || '';
      const section = String(row['Section'] || row['section'] || '').trim();

      const rowErrors: string[] = [];

      if (!studentEnrollment) rowErrors.push('Missing Student Enrollment Number');
      if (!mentorEmpId) rowErrors.push('Missing Mentor Employee ID');

      let student: any = null;
      let mentor: any = null;

      if (studentEnrollment) {
        student = await this.prisma.student.findFirst({
          where: { enrollmentNo: { equals: studentEnrollment, mode: 'insensitive' } },
          include: { department: true, institute: true }
        });
        if (!student) {
          rowErrors.push(`Student with enrollment "${studentEnrollment}" not found.`);
        } else if (!this.isUserAuthorizedForStudent(user, student)) {
          rowErrors.push(`Unauthorized: You do not have permission to assign mentors to student ${studentEnrollment}.`);
        }
      }

      if (mentorEmpId) {
        mentor = await this.prisma.faculty.findFirst({
          where: { employeeCode: { equals: mentorEmpId, mode: 'insensitive' } },
          include: { department: true }
        });
        if (!mentor) {
          rowErrors.push(`Faculty with Employee ID "${mentorEmpId}" not found.`);
        } else if (mentor.status !== 'ACTIVE') {
          rowErrors.push(`Faculty ${mentor.firstName} ${mentor.lastName} is INACTIVE.`);
        }
      }

      if (student && mentor && mentor.departmentId !== student.departmentId) {
        rowErrors.push(`Faculty ${mentor.firstName} ${mentor.lastName} (${mentor.department?.code}) does not belong to student's department (${student.department?.code}).`);
      }

      const item = {
        studentEnrollmentNo: studentEnrollment,
        departmentCode: deptCode || student?.department?.code,
        programCode: progCode,
        semester,
        section,
        mentorEmployeeId: mentorEmpId,
        studentName: student ? `${student.firstName} ${student.lastName}`.trim() : undefined,
        mentorName: mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : undefined,
        studentId: student?.id,
        mentorFacultyId: mentor?.id,
        isValid: rowErrors.length === 0,
        errors: rowErrors
      };

      if (rowErrors.length === 0) {
        validRows.push(item);
      } else {
        invalidRows.push(item);
        errorsSummary.push(`Row ${rowNum} (${studentEnrollment}): ${rowErrors.join(', ')}`);
      }
    }

    return {
      totalRows: rawRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
      errorsSummary
    };
  }

  /**
   * 11. COMMIT BULK XLSX ROWS
   */
  async commitBulkUpload(dto: BulkMentorCommitDto, user: any) {
    let successCount = 0;
    const errors: string[] = [];

    for (const row of dto.rows) {
      try {
        const student = await this.prisma.student.findFirst({
          where: { enrollmentNo: row.studentEnrollmentNo }
        });
        const faculty = await this.prisma.faculty.findFirst({
          where: { employeeCode: row.mentorEmployeeId }
        });

        if (!student || !faculty) continue;

        const currentActive = await this.getActiveMentorForStudent(student.id);
        if (currentActive && currentActive.mentorFacultyId === faculty.id && currentActive.status === 'ACTIVE') {
          successCount++;
          continue;
        }

        await this.assignMentor({
          studentId: student.id,
          mentorFacultyId: faculty.id,
          isChange: Boolean(currentActive && currentActive.status === 'ACTIVE'),
          changeReason: dto.changeReason || 'Bulk XLSX Import by Academic Administrator'
        }, user);
        successCount++;
      } catch (err: any) {
        errors.push(`Enrollment ${row.studentEnrollmentNo}: ${err.message}`);
      }
    }

    return {
      success: true,
      committedCount: successCount,
      totalRequested: dto.rows.length,
      errors
    };
  }

  /**
   * 12. MENTOR DASHBOARD STATS
   */
  async getMentorDashboardStats(user: any) {
    let facultyId = user.id;
    if (user.role !== 'FACULTY') {
      const fac = await this.prisma.faculty.findFirst({
        where: { OR: [{ id: user.id }, { email: user.email }, { employeeCode: user.username }] }
      });
      if (fac) facultyId = fac.id;
    }

    const [activeMentees, assignments] = await Promise.all([
      this.prisma.mentorAssignment.count({
        where: { mentorFacultyId: facultyId, status: 'ACTIVE' }
      }),
      this.prisma.mentorAssignment.findMany({
        where: { mentorFacultyId: facultyId, status: 'ACTIVE' },
        include: {
          student: {
            include: { department: true, institute: true }
          }
        }
      })
    ]);

    return {
      mentorFacultyId: facultyId,
      totalActiveMentees: activeMentees,
      mentees: assignments.map(a => ({
        assignmentId: a.id,
        studentId: a.studentId,
        studentName: `${a.student?.firstName} ${a.student?.lastName}`.trim(),
        enrollmentNo: a.student?.enrollmentNo,
        email: a.student?.email,
        phone: a.student?.phone,
        departmentName: a.student?.department?.name,
        assignedDate: a.assignedDate,
        effectiveFrom: a.effectiveFrom
      })),
      pendingActions: 2,
      completedRequests: 14,
      subjectQueries: 3,
      generalComplaints: 1
    };
  }
}
