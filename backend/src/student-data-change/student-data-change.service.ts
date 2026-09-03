import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStudentDataChangeDto,
  ReviewStudentDataChangeDto,
  QueryStudentDataChangeDto,
  DataChangeStatusEnum,
} from './dto/student-data-change.dto';

@Injectable()
export class StudentDataChangeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Generate human-friendly Request Number (e.g. DCR-2026-000001)
   */
  private async generateRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.prisma.studentDataChangeRequest.count()) + 1;
    return `DCR-${year}-${String(count).padStart(6, '0')}`;
  }

  /**
   * Helper: Extract current old value from Student record
   */
  private extractOldValue(student: any, fieldName: string): string {
    if (!student) return '';
    if (fieldName === 'studentName' || fieldName === 'name') {
      return `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
    }
    if (fieldName === 'dateOfBirth' && student.dateOfBirth) {
      return new Date(student.dateOfBirth).toISOString().split('T')[0];
    }
    if (student[fieldName] !== undefined && student[fieldName] !== null) {
      return String(student[fieldName]);
    }
    return '';
  }

  /**
   * 1. CREATE DATA CHANGE REQUEST (STUDENT)
   */
  async createRequest(
    studentUserIdOrId: string,
    dto: CreateStudentDataChangeDto,
    currentUser: any,
  ) {
    // 1. Resolve student record
    let student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: studentUserIdOrId },
          { erpId: studentUserIdOrId },
          { enrollmentNo: studentUserIdOrId },
          { email: studentUserIdOrId },
          { user: { id: studentUserIdOrId } },
        ],
      },
      include: {
        department: true,
        institute: true,
        mentorAssignments: {
          where: { status: 'ACTIVE' },
          include: { faculty: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile record not found.');
    }

    // RBAC: If requester is a student, ensure they can only submit for themselves
    if (currentUser?.role === 'STUDENT') {
      const isOwner =
        currentUser.id === student.id ||
        currentUser.enrollmentNo === student.enrollmentNo ||
        currentUser.email === student.email ||
        currentUser.studentId === student.id;
      if (!isOwner) {
        throw new ForbiddenException('You are only authorized to submit change requests for your own profile.');
      }
    }

    // 2. Duplicate Request Protection
    const pendingStatuses = [
      DataChangeStatusEnum.DRAFT,
      DataChangeStatusEnum.SUBMITTED,
      DataChangeStatusEnum.MENTOR_PENDING,
      DataChangeStatusEnum.MENTOR_APPROVED,
      DataChangeStatusEnum.HOD_PENDING,
    ];

    const existingPending = await this.prisma.studentDataChangeRequest.findFirst({
      where: {
        studentId: student.id,
        fieldName: dto.fieldName,
        status: { in: pendingStatuses },
      },
    });

    if (existingPending) {
      throw new BadRequestException('A change request for this field is already pending.');
    }

    // 3. Resolve active Mentor if assigned
    const activeAssignment = student.mentorAssignments?.[0];
    const mentorId = activeAssignment?.mentorFacultyId || null;
    const mentorName = activeAssignment?.faculty
      ? `${activeAssignment.faculty.firstName} ${activeAssignment.faculty.lastName}`.trim()
      : null;

    const requestNo = await this.generateRequestNo();
    const oldValue = this.extractOldValue(student, dto.fieldName);

    // 4. Create request + Initial audit log in a transaction
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.studentDataChangeRequest.create({
        data: {
          requestNo,
          studentId: student.id,
          fieldCategory: dto.fieldCategory,
          fieldName: dto.fieldName,
          fieldLabel: dto.fieldLabel,
          oldValue,
          newValue: dto.newValue,
          reason: dto.reason,
          attachmentUrl: dto.attachmentUrl,
          attachmentName: dto.attachmentName,
          attachmentSize: dto.attachmentSize,
          status: DataChangeStatusEnum.MENTOR_PENDING,
          mentorId,
          mentorName,
        },
      });

      await tx.studentDataChangeRequestAuditLog.create({
        data: {
          requestId: request.id,
          studentId: student.id,
          action: 'CREATED',
          fromStatus: 'NONE',
          toStatus: DataChangeStatusEnum.MENTOR_PENDING,
          performedByUserId: currentUser?.id || student.id,
          performedByName: currentUser?.name || `${student.firstName} ${student.lastName}`.trim(),
          performedByRole: currentUser?.role || 'STUDENT',
          fieldName: dto.fieldName,
          oldValue,
          newValue: dto.newValue,
          remarks: dto.reason,
          ipAddress: currentUser?.ipAddress || '127.0.0.1',
          userAgent: currentUser?.userAgent || 'Browser',
        },
      });

      return request;
    });
  }

  /**
   * 2. MENTOR REVIEW (APPROVE, REJECT, SEND_BACK)
   */
  async mentorReview(
    requestId: string,
    dto: ReviewStudentDataChangeDto,
    currentUser: any,
  ) {
    const request = await this.prisma.studentDataChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            mentorAssignments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Data change request not found.');
    }

    // Ensure valid status
    if (
      request.status !== DataChangeStatusEnum.MENTOR_PENDING &&
      request.status !== DataChangeStatusEnum.SUBMITTED &&
      request.status !== DataChangeStatusEnum.SENT_BACK
    ) {
      throw new BadRequestException(`Cannot perform mentor action on request with status ${request.status}.`);
    }

    // Remarks are mandatory for reject and send back
    if ((dto.action === 'REJECT' || dto.action === 'SEND_BACK') && !dto.remarks?.trim()) {
      throw new BadRequestException('Remarks are mandatory when rejecting or sending back a request.');
    }

    let toStatus: DataChangeStatusEnum;
    let auditAction: string;

    if (dto.action === 'APPROVE') {
      toStatus = DataChangeStatusEnum.HOD_PENDING;
      auditAction = 'MENTOR_APPROVED';
    } else if (dto.action === 'REJECT') {
      toStatus = DataChangeStatusEnum.REJECTED_BY_MENTOR;
      auditAction = 'MENTOR_REJECTED';
    } else {
      toStatus = DataChangeStatusEnum.SENT_BACK;
      auditAction = 'MENTOR_SENT_BACK';
    }

    const mentorName = currentUser?.name || 'Faculty Mentor';
    const mentorId = currentUser?.facultyId || currentUser?.id;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentDataChangeRequest.update({
        where: { id: requestId },
        data: {
          status: toStatus,
          mentorId,
          mentorName,
          mentorRemarks: dto.remarks || 'Mentor review completed.',
          mentorActionAt: new Date(),
        },
      });

      await tx.studentDataChangeRequestAuditLog.create({
        data: {
          requestId: request.id,
          studentId: request.studentId,
          action: auditAction,
          fromStatus: request.status,
          toStatus,
          performedByUserId: currentUser?.id || 'usr-mentor',
          performedByName: mentorName,
          performedByRole: currentUser?.role || 'MENTOR',
          fieldName: request.fieldName,
          oldValue: request.oldValue,
          newValue: request.newValue,
          remarks: dto.remarks,
          ipAddress: currentUser?.ipAddress || '127.0.0.1',
          userAgent: currentUser?.userAgent || 'Browser',
        },
      });

      return updated;
    });
  }

  /**
   * 3. HOD FINAL REVIEW (APPROVE, REJECT, SEND_BACK)
   * On HOD Approval: ATOMICALLY updates actual Student master data in DB!
   */
  async hodReview(
    requestId: string,
    dto: ReviewStudentDataChangeDto,
    currentUser: any,
  ) {
    const request = await this.prisma.studentDataChangeRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      throw new NotFoundException('Data change request not found.');
    }

    // HOD can only review requests that are in HOD_PENDING or MENTOR_APPROVED status
    if (
      request.status !== DataChangeStatusEnum.HOD_PENDING &&
      request.status !== DataChangeStatusEnum.MENTOR_APPROVED
    ) {
      throw new BadRequestException(`HOD final approval requires request to be MENTOR_APPROVED. Current status: ${request.status}`);
    }

    // Mandatory remarks for reject/send back
    if ((dto.action === 'REJECT' || dto.action === 'SEND_BACK') && !dto.remarks?.trim()) {
      throw new BadRequestException('Remarks are mandatory when rejecting or sending back a request.');
    }

    let toStatus: DataChangeStatusEnum;
    let auditAction: string;

    if (dto.action === 'APPROVE') {
      toStatus = DataChangeStatusEnum.APPROVED;
      auditAction = 'HOD_APPROVED';
    } else if (dto.action === 'REJECT') {
      toStatus = DataChangeStatusEnum.REJECTED_BY_HOD;
      auditAction = 'HOD_REJECTED';
    } else {
      toStatus = DataChangeStatusEnum.SENT_BACK;
      auditAction = 'HOD_SENT_BACK';
    }

    const hodName = currentUser?.name || 'Head of Department';
    const hodId = currentUser?.id;
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. If approved, apply the actual change to Student Master
      if (dto.action === 'APPROVE') {
        const studentUpdateData: any = {};
        const field = request.fieldName;
        const val = request.newValue;

        if (field === 'phone' || field === 'mobileNumber') {
          studentUpdateData.phone = val;
        } else if (field === 'email') {
          studentUpdateData.email = val.toLowerCase().trim();
        } else if (field === 'dateOfBirth') {
          studentUpdateData.dateOfBirth = new Date(val);
        } else if (field === 'gender') {
          studentUpdateData.gender = val;
        } else if (field === 'firstName') {
          studentUpdateData.firstName = val;
        } else if (field === 'lastName') {
          studentUpdateData.lastName = val;
        } else if (field === 'studentName' || field === 'name') {
          const parts = val.split(' ');
          studentUpdateData.firstName = parts[0] || request.student.firstName;
          studentUpdateData.lastName = parts.slice(1).join(' ') || request.student.lastName;
        } else if (field === 'abcId') {
          studentUpdateData.abcId = val;
          studentUpdateData.abcIdStatus = 'VERIFIED';
        }

        if (Object.keys(studentUpdateData).length > 0) {
          await tx.student.update({
            where: { id: request.studentId },
            data: studentUpdateData,
          });
        }
      }

      // 2. Update the request status and timestamps
      const updated = await tx.studentDataChangeRequest.update({
        where: { id: requestId },
        data: {
          status: toStatus,
          hodId,
          hodName,
          hodRemarks: dto.remarks || 'HOD final approval granted.',
          hodActionAt: now,
          completedAt: dto.action === 'APPROVE' ? now : null,
        },
      });

      // 3. Log permanent audit entry
      await tx.studentDataChangeRequestAuditLog.create({
        data: {
          requestId: request.id,
          studentId: request.studentId,
          action: auditAction,
          fromStatus: request.status,
          toStatus,
          performedByUserId: currentUser?.id || 'usr-hod',
          performedByName: hodName,
          performedByRole: currentUser?.role || 'HOD',
          fieldName: request.fieldName,
          oldValue: request.oldValue,
          newValue: request.newValue,
          remarks: dto.remarks,
          ipAddress: currentUser?.ipAddress || '127.0.0.1',
          userAgent: currentUser?.userAgent || 'Browser',
        },
      });

      return updated;
    });
  }

  /**
   * 4. STUDENT CANCEL REQUEST
   */
  async cancelRequest(requestId: string, currentUser: any) {
    const request = await this.prisma.studentDataChangeRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      throw new NotFoundException('Data change request not found.');
    }

    if (
      request.status !== DataChangeStatusEnum.MENTOR_PENDING &&
      request.status !== DataChangeStatusEnum.SENT_BACK
    ) {
      throw new BadRequestException(`Cannot cancel request when in status ${request.status}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentDataChangeRequest.update({
        where: { id: requestId },
        data: { status: DataChangeStatusEnum.CANCELLED },
      });

      await tx.studentDataChangeRequestAuditLog.create({
        data: {
          requestId: request.id,
          studentId: request.studentId,
          action: 'CANCELLED',
          fromStatus: request.status,
          toStatus: DataChangeStatusEnum.CANCELLED,
          performedByUserId: currentUser?.id || request.studentId,
          performedByName: currentUser?.name || 'Student',
          performedByRole: currentUser?.role || 'STUDENT',
          fieldName: request.fieldName,
          oldValue: request.oldValue,
          newValue: request.newValue,
          remarks: 'Cancelled by student.',
          ipAddress: currentUser?.ipAddress || '127.0.0.1',
          userAgent: currentUser?.userAgent || 'Browser',
        },
      });

      return updated;
    });
  }

  /**
   * 5. GET SCOPED REQUESTS (RBAC FILTERING)
   */
  async getScopedRequests(query: QueryStudentDataChangeDto, currentUser: any) {
    const role = currentUser?.role || 'SUPER_ADMIN';
    const where: any = {};

    // RBAC Filter:
    if (role === 'STUDENT') {
      where.OR = [
        { studentId: currentUser.id },
        { student: { enrollmentNo: currentUser.enrollmentNo } },
        { student: { email: currentUser.email } },
      ];
    } else if (role === 'MENTOR' || role === 'FACULTY') {
      const facultyId = currentUser.facultyId || currentUser.id;
      where.OR = [
        { mentorId: facultyId },
        { student: { mentorAssignments: { some: { mentorFacultyId: facultyId, status: 'ACTIVE' } } } },
      ];
    } else if (role === 'HOD') {
      const departmentId = currentUser.departmentId || query.departmentId;
      if (departmentId) {
        where.student = { departmentId };
      }
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.fieldCategory && query.fieldCategory !== 'ALL') {
      where.fieldCategory = query.fieldCategory;
    }
    if (query.studentId) {
      where.studentId = query.studentId;
    }
    if (query.mentorId) {
      where.mentorId = query.mentorId;
    }
    if (query.hodId) {
      where.hodId = query.hodId;
    }
    if (query.search) {
      where.OR = [
        { requestNo: { contains: query.search, mode: 'insensitive' } },
        { fieldLabel: { contains: query.search, mode: 'insensitive' } },
        { fieldName: { contains: query.search, mode: 'insensitive' } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.studentDataChangeRequest.count({ where }),
      this.prisma.studentDataChangeRequest.findMany({
        where,
        include: {
          student: {
            include: {
              department: true,
              institute: true,
            },
          },
          auditLogs: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit), items };
  }

  /**
   * 6. GET REQUEST DETAILS BY ID
   */
  async getRequestById(id: string) {
    const request = await this.prisma.studentDataChangeRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            department: true,
            institute: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Data change request not found.');
    }

    return request;
  }

  /**
   * 7. GET DASHBOARD STATISTICS
   */
  async getStatistics(currentUser: any) {
    const role = currentUser?.role || 'SUPER_ADMIN';
    const where: any = {};

    if (role === 'STUDENT') {
      where.studentId = currentUser.id;
    } else if (role === 'MENTOR' || role === 'FACULTY') {
      const facultyId = currentUser.facultyId || currentUser.id;
      where.mentorId = facultyId;
    } else if (role === 'HOD' && currentUser.departmentId) {
      where.student = { departmentId: currentUser.departmentId };
    }

    const [
      total,
      mentorPending,
      hodPending,
      approved,
      rejectedByMentor,
      rejectedByHod,
      sentBack,
    ] = await Promise.all([
      this.prisma.studentDataChangeRequest.count({ where }),
      this.prisma.studentDataChangeRequest.count({
        where: { ...where, status: DataChangeStatusEnum.MENTOR_PENDING },
      }),
      this.prisma.studentDataChangeRequest.count({
        where: { ...where, status: DataChangeStatusEnum.HOD_PENDING },
      }),
      this.prisma.studentDataChangeRequest.count({
        where: { ...where, status: DataChangeStatusEnum.APPROVED },
      }),
      this.prisma.studentDataChangeRequest.count({
        where: { ...where, status: DataChangeStatusEnum.REJECTED_BY_MENTOR },
      }),
      this.prisma.studentDataChangeRequest.count({
        where: { ...where, status: DataChangeStatusEnum.REJECTED_BY_HOD },
      }),
      this.prisma.studentDataChangeRequest.count({
        where: { ...where, status: DataChangeStatusEnum.SENT_BACK },
      }),
    ]);

    return {
      total,
      mentorPending,
      hodPending,
      approved,
      rejected: rejectedByMentor + rejectedByHod,
      rejectedByMentor,
      rejectedByHod,
      sentBack,
    };
  }
}
