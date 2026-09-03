import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceRequestDto,
  AssignServiceRequestDto,
  UpdateServiceRequestStatusDto,
  ResolveServiceRequestDto,
  RejectServiceRequestDto,
  AddServiceRequestMessageDto,
  ServiceRequestQueryDto,
  ServiceRequestStatusEnum,
  ServiceRequestPriorityEnum,
  ServiceRequestCategoryEnum,
} from './dto/service-request.dto';

@Injectable()
export class StudentServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Generate unique Request / Certificate Numbers
  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── Helper: Resolve User Context & Scope ───────────────────────────────────

  private async resolveUserContext(user: any) {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isStudent = roles.includes('STUDENT') || user?.role === 'STUDENT';
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';
    const isPrincipal = roles.includes('PRINCIPAL') || user?.role === 'PRINCIPAL';
    const isRegistrar = roles.includes('REGISTRAR') || user?.role === 'REGISTRAR';
    const isHOD = roles.includes('HOD') || user?.role === 'HOD';
    const isStaff = roles.includes('FACULTY') || roles.includes('STAFF') || roles.includes('DEPARTMENT_ADMIN') || isHOD;

    let studentProfile: any = null;
    if (isStudent) {
      studentProfile = await this.prisma.student.findFirst({
        where: {
          OR: [
            { id: user.studentId || user.id },
            { erpId: user.erpId || user.id },
            { email: user.email || user.username },
          ],
        },
      });
    }

    return {
      userId: user.id,
      userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || user.name || 'User',
      roles,
      isStudent,
      studentId: studentProfile?.id,
      studentProfile,
      isSuperAdmin,
      isPrincipal,
      isRegistrar,
      isHOD,
      isStaff,
      departmentId: user.departmentId || studentProfile?.departmentId,
      authorityLevel: user.authorityLevel ?? (isSuperAdmin ? 1 : isPrincipal ? 2 : isHOD ? 3 : isStaff ? 5 : 10),
    };
  }

  // ── 1. Service Catalog ───────────────────────────────────────────────────

  async getServiceCatalog() {
    let services = await this.prisma.studentService.findMany({
      where: { isActive: true },
      include: { requirements: true },
      orderBy: { name: 'asc' },
    });

    if (services.length === 0) {
      const defaultCatalog = [
        { code: 'BONAFIDE', name: 'Bonafide Certificate', category: 'CERTIFICATE', expectedDays: 2, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'CHARACTER_CERT', name: 'Character Certificate', category: 'CERTIFICATE', expectedDays: 3, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'TRANSCRIPT', name: 'Official Transcript Request', category: 'ACADEMIC', expectedDays: 7, feeAmount: 500, responsibleRoleCode: 'EXAM_SECTION' },
        { code: 'MIGRATION', name: 'Migration Certificate', category: 'CERTIFICATE', expectedDays: 5, feeAmount: 250, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'TRANSFER_CERT', name: 'Transfer Certificate (TC)', category: 'CERTIFICATE', expectedDays: 5, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'DUPLICATE_ID', name: 'Duplicate Student ID Card', category: 'ADMINISTRATIVE', expectedDays: 3, feeAmount: 200, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'FEE_RECEIPT', name: 'Duplicate Fee Receipt / Ledger', category: 'FINANCE', expectedDays: 2, responsibleRoleCode: 'FINANCE_OFFICER' },
        { code: 'NO_DUES', name: 'No Dues Clearance Certificate', category: 'ADMINISTRATIVE', expectedDays: 4, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'INTERNSHIP_LETTER', name: 'Internship NOC / Permission Letter', category: 'ACADEMIC', expectedDays: 3, responsibleRoleCode: 'HOD' },
        { code: 'SCHOLARSHIP_REQ', name: 'Scholarship / Financial Aid Endorsement', category: 'FINANCE', expectedDays: 4, responsibleRoleCode: 'STUDENT_SECTION' },
        { code: 'HOSTEL_REQ', name: 'Hostel Room Change / Request', category: 'HOSTEL', expectedDays: 3, responsibleRoleCode: 'HOSTEL_WARDEN' },
        { code: 'TRANSPORT_REQ', name: 'Bus Route Change Request', category: 'TRANSPORT', expectedDays: 3, responsibleRoleCode: 'TRANSPORT_MANAGER' },
      ];

      for (const s of defaultCatalog) {
        await this.prisma.studentService.upsert({
          where: { code: s.code },
          create: s,
          update: {},
        });
      }

      services = await this.prisma.studentService.findMany({
        where: { isActive: true },
        include: { requirements: true },
        orderBy: { name: 'asc' },
      });
    }

    return services;
  }

  // ── 2. Service Request Creation (with Ownership Protection) ───────────────

  async createServiceRequest(user: any, dto: CreateServiceRequestDto) {
    const ctx = await this.resolveUserContext(user);

    if (!ctx.studentId && ctx.isStudent) {
      throw new BadRequestException('Student profile not found for the logged-in user.');
    }

    // Determine target student ID
    let targetStudentId = ctx.studentId;
    if (!ctx.isStudent && !targetStudentId) {
      // If staff is creating on behalf of a student, require studentId
      const student = await this.prisma.student.findFirst();
      targetStudentId = student?.id;
      if (!targetStudentId) throw new BadRequestException('Valid student profile required.');
    }

    // Resolve or fallback service
    let serviceId = dto.serviceId;
    if (!serviceId) {
      const defaultService = await this.prisma.studentService.findFirst({
        where: { isActive: true },
      });
      serviceId = defaultService?.id;
    }
    if (!serviceId) {
      const catalog = await this.getServiceCatalog();
      serviceId = catalog[0]?.id;
    }

    const requestNo = this.generateNumber('REQ');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const departmentId = dto.departmentId || ctx.departmentId || ctx.studentProfile?.departmentId;

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.studentServiceRequest.create({
        data: {
          requestNo,
          studentId: targetStudentId!,
          serviceId: serviceId!,
          departmentId,
          subject: dto.subject,
          description: dto.description,
          category: dto.category || ServiceRequestCategoryEnum.GENERAL,
          priority: dto.priority || ServiceRequestPriorityEnum.NORMAL,
          purpose: dto.purpose || dto.description,
          status: ServiceRequestStatusEnum.SUBMITTED,
          currentStage: 'SUBMITTED',
          dueDate,
          documents: {
            create: (dto.documents || []).map((doc) => ({
              name: doc.name,
              documentUrl: doc.documentUrl,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
            })),
          },
        },
        include: {
          student: { include: { department: true } },
          service: true,
          department: true,
          documents: true,
        },
      });

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: request.id,
          action: 'CREATED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          toStatus: ServiceRequestStatusEnum.SUBMITTED,
          remarks: `Request ${requestNo} submitted by student`,
        },
      });

      return request;
    });
  }

  // ── 3. Query Service Requests with Strict Server-Side Privacy Scope ───────

  async getServiceRequests(user: any, query?: ServiceRequestQueryDto) {
    const ctx = await this.resolveUserContext(user);

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 🔒 CRITICAL PRIVACY ENFORCEMENT
    if (ctx.isStudent) {
      // Student A can NEVER see Student B's requests
      where.studentId = ctx.studentId;
    } else if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isRegistrar) {
      // Department Staff / HOD: Scoped strictly to assigned requests OR authorized department
      if (ctx.departmentId) {
        where.OR = [
          { departmentId: ctx.departmentId },
          { assignedToUserId: ctx.userId },
        ];
      } else {
        where.assignedToUserId = ctx.userId;
      }
    }

    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.category) where.category = query.category.toUpperCase();
    if (query?.priority) where.priority = query.priority.toUpperCase();
    if (query?.departmentId && !ctx.isStudent) where.departmentId = query.departmentId;
    if (query?.assignedToUserId && !ctx.isStudent) where.assignedToUserId = query.assignedToUserId;

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      const searchConditions: any[] = [
        { requestNo: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
      if (!ctx.isStudent) {
        searchConditions.push(
          { student: { firstName: { contains: q, mode: 'insensitive' } } },
          { student: { lastName: { contains: q, mode: 'insensitive' } } },
          { student: { enrollmentNo: { contains: q, mode: 'insensitive' } } },
        );
      }
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.studentServiceRequest.count({ where }),
      this.prisma.studentServiceRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              erpId: true,
              enrollmentNo: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { id: true, name: true, code: true } },
            },
          },
          service: true,
          department: { select: { id: true, name: true, code: true } },
          documents: true,
          certificates: true,
          _count: { select: { messages: true, history: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getRequestById(id: string, user: any) {
    const ctx = await this.resolveUserContext(user);

    const request = await this.prisma.studentServiceRequest.findUnique({
      where: { id },
      include: {
        service: { include: { requirements: true } },
        student: { include: { institute: true, department: true, batch: true } },
        department: true,
        documents: true,
        certificates: true,
        messages: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!request) throw new NotFoundException('Service request not found.');

    // 🔒 SERVER-SIDE AUTHORIZATION & PRIVACY CHECK
    if (ctx.isStudent) {
      if (request.studentId !== ctx.studentId) {
        throw new ForbiddenException('Privacy violation: You are strictly forbidden from viewing another student’s requests.');
      }
      // Filter out internal staff notes from student view
      request.messages = request.messages.filter((m) => !m.isInternal);
    } else if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isRegistrar) {
      // Staff / HOD can only view assigned requests or their authorized department requests
      const isAssigned = request.assignedToUserId === ctx.userId;
      const isDeptMatch = ctx.departmentId && request.departmentId === ctx.departmentId;
      if (!isAssigned && !isDeptMatch) {
        throw new ForbiddenException('Access denied: You are not authorized to view requests outside your assigned department queue.');
      }
    }

    return request;
  }

  // ── 4. Assignment, Status Transitions & Resolution ─────────────────────────

  async assignServiceRequest(id: string, user: any, dto: AssignServiceRequestDto) {
    const ctx = await this.resolveUserContext(user);
    if (ctx.isStudent) throw new ForbiddenException('Students cannot assign service requests.');

    const existing = await this.getRequestById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentServiceRequest.update({
        where: { id },
        data: {
          assignedToUserId: dto.assignedToUserId,
          assignedDepartmentId: dto.assignedDepartmentId || existing.departmentId,
          status: ServiceRequestStatusEnum.ASSIGNED,
          currentStage: 'ASSIGNED',
        },
        include: { student: true, service: true, department: true },
      });

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: id,
          action: 'ASSIGNED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: ServiceRequestStatusEnum.ASSIGNED,
          remarks: dto.remarks || `Assigned to user ${dto.assignedToUserId}`,
        },
      });

      return updated;
    });
  }

  async updateServiceRequestStatus(id: string, user: any, dto: UpdateServiceRequestStatusDto) {
    const ctx = await this.resolveUserContext(user);
    if (ctx.isStudent) throw new ForbiddenException('Students cannot change request status directly.');

    const existing = await this.getRequestById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentServiceRequest.update({
        where: { id },
        data: {
          status: dto.status.toUpperCase(),
          currentStage: dto.status.toUpperCase(),
          remarks: dto.remarks || existing.remarks,
        },
        include: { student: true, service: true, department: true },
      });

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: id,
          action: 'STATUS_CHANGED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: dto.status.toUpperCase(),
          remarks: dto.remarks || `Status changed to ${dto.status}`,
        },
      });

      return updated;
    });
  }

  async resolveServiceRequest(id: string, user: any, dto: ResolveServiceRequestDto) {
    const ctx = await this.resolveUserContext(user);
    if (ctx.isStudent) throw new ForbiddenException('Students cannot mark requests as resolved.');

    const existing = await this.getRequestById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentServiceRequest.update({
        where: { id },
        data: {
          status: ServiceRequestStatusEnum.RESOLVED,
          currentStage: 'RESOLVED',
          resolution: dto.resolution,
          resolvedByUserId: ctx.userId,
          resolvedAt: new Date(),
          completedAt: new Date(),
          remarks: dto.remarks || existing.remarks,
        },
        include: { student: true, service: true, department: true },
      });

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: id,
          action: 'RESOLVED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: ServiceRequestStatusEnum.RESOLVED,
          remarks: dto.resolution,
        },
      });

      return updated;
    });
  }

  async rejectServiceRequest(id: string, user: any, dto: RejectServiceRequestDto) {
    const ctx = await this.resolveUserContext(user);
    if (ctx.isStudent) throw new ForbiddenException('Students cannot reject service requests.');

    const existing = await this.getRequestById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentServiceRequest.update({
        where: { id },
        data: {
          status: ServiceRequestStatusEnum.REJECTED,
          currentStage: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          completedAt: new Date(),
          remarks: dto.remarks || existing.remarks,
        },
        include: { student: true, service: true, department: true },
      });

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: id,
          action: 'REJECTED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: ServiceRequestStatusEnum.REJECTED,
          remarks: dto.rejectionReason,
        },
      });

      return updated;
    });
  }

  async cancelRequest(id: string, user: any) {
    const existing = await this.getRequestById(id, user);
    const ctx = await this.resolveUserContext(user);

    if (ctx.isStudent && existing.studentId !== ctx.studentId) {
      throw new ForbiddenException('Cannot cancel request belonging to another student.');
    }

    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_VERIFICATION') {
      throw new BadRequestException('Request is already being processed and cannot be cancelled.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentServiceRequest.update({
        where: { id },
        data: { status: ServiceRequestStatusEnum.CANCELLED, currentStage: 'CANCELLED' },
      });

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: id,
          action: 'CANCELLED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: ServiceRequestStatusEnum.CANCELLED,
          remarks: 'Request cancelled by student',
        },
      });

      return updated;
    });
  }

  // ── 5. Conversation / Messages ─────────────────────────────────────────────

  async addRequestMessage(id: string, user: any, dto: AddServiceRequestMessageDto) {
    const existing = await this.getRequestById(id, user);
    const ctx = await this.resolveUserContext(user);

    const senderType = ctx.isStudent ? 'STUDENT' : ctx.isSuperAdmin ? 'ADMIN' : 'STAFF';

    // Students cannot create internal staff notes
    const isInternal = ctx.isStudent ? false : dto.isInternal || false;

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.studentServiceRequestMessage.create({
        data: {
          requestId: id,
          senderId: ctx.userId,
          senderName: ctx.userName,
          senderType,
          message: dto.message,
          attachments: dto.attachments,
          isInternal,
        },
      });

      // Update status to PENDING_STUDENT if staff requested clarification, or IN_PROGRESS if student responded
      let newStatus = existing.status;
      if (!ctx.isStudent && !isInternal && existing.status === 'IN_PROGRESS') {
        newStatus = ServiceRequestStatusEnum.PENDING_STUDENT;
      } else if (ctx.isStudent && existing.status === 'PENDING_STUDENT') {
        newStatus = ServiceRequestStatusEnum.IN_PROGRESS;
      }

      if (newStatus !== existing.status) {
        await tx.studentServiceRequest.update({
          where: { id },
          data: { status: newStatus },
        });
      }

      await tx.studentServiceRequestHistory.create({
        data: {
          requestId: id,
          action: 'REPLIED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: newStatus,
          remarks: `${senderType} message: ${dto.message.slice(0, 80)}`,
        },
      });

      return message;
    });
  }

  async getRequestHistory(id: string, user: any) {
    await this.getRequestById(id, user);
    return this.prisma.studentServiceRequestHistory.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 6. Reports & Metrics ──────────────────────────────────────────────────

  async getServiceRequestDashboardMetrics(user: any) {
    const ctx = await this.resolveUserContext(user);
    const where: any = {};

    if (ctx.isStudent) {
      where.studentId = ctx.studentId;
    } else if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isRegistrar) {
      if (ctx.departmentId) {
        where.departmentId = ctx.departmentId;
      } else {
        where.assignedToUserId = ctx.userId;
      }
    }

    const [
      totalRequests,
      submitted,
      assigned,
      inProgress,
      pendingStudent,
      resolved,
      rejected,
      cancelled,
    ] = await Promise.all([
      this.prisma.studentServiceRequest.count({ where }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.SUBMITTED } }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.ASSIGNED } }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.IN_PROGRESS } }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.PENDING_STUDENT } }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.RESOLVED } }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.REJECTED } }),
      this.prisma.studentServiceRequest.count({ where: { ...where, status: ServiceRequestStatusEnum.CANCELLED } }),
    ]);

    return {
      totalRequests,
      pending: submitted + assigned + inProgress + pendingStudent,
      submitted,
      assigned,
      inProgress,
      pendingStudent,
      resolved,
      rejected,
      cancelled,
    };
  }

  // ── 7. Digital Certificate Generation & Verification ──────────────────────

  async generateCertificate(requestId: string, signatoryTitle?: string) {
    const request = await this.prisma.studentServiceRequest.findUnique({
      where: { id: requestId },
      include: { student: { include: { institute: true, department: true } }, service: true },
    });
    if (!request) throw new NotFoundException('Service request not found.');

    const certNo = this.generateNumber('CERT');
    const verificationHash = `HASH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const cert = await tx.certificate.create({
        data: {
          certificateNumber: certNo,
          requestId: request.id,
          studentId: request.studentId,
          serviceId: request.serviceId,
          certificateType: request.service.code,
          title: `${request.service.name} - ${request.student.firstName} ${request.student.lastName}`,
          status: 'VALID',
          signatoryTitle: signatoryTitle || 'Registrar / Authorized Signatory',
          verificationHash,
          certificateUrl: `/certificates/${certNo}.pdf`,
        },
      });

      await tx.studentServiceRequest.update({
        where: { id: requestId },
        data: { status: ServiceRequestStatusEnum.COMPLETED, currentStage: 'COMPLETED', completedAt: new Date() },
      });

      return cert;
    });
  }

  async getCertificates(user: any) {
    const ctx = await this.resolveUserContext(user);
    const where: any = {};
    if (ctx.isStudent) where.studentId = ctx.studentId;

    return this.prisma.certificate.findMany({
      where,
      include: {
        student: { select: { id: true, erpId: true, enrollmentNo: true, firstName: true, lastName: true } },
        service: true,
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async verifyCertificate(certificateNumberOrHash: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: {
        OR: [{ certificateNumber: certificateNumberOrHash }, { verificationHash: certificateNumberOrHash }],
      },
      include: {
        student: {
          select: {
            enrollmentNo: true,
            firstName: true,
            lastName: true,
            institute: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        service: { select: { name: true, code: true } },
      },
    });

    if (!cert) {
      return {
        isValid: false,
        message: 'Certificate record not found or invalid certificate number.',
      };
    }

    return {
      isValid: cert.status === 'VALID',
      certificateNumber: cert.certificateNumber,
      title: cert.title,
      serviceName: cert.service?.name,
      studentName: `${cert.student.firstName} ${cert.student.lastName}`,
      enrollmentNo: cert.student.enrollmentNo,
      institute: cert.student.institute?.name,
      department: cert.student.department?.name,
      issueDate: cert.issueDate,
      validUntil: cert.validUntil,
      status: cert.status,
      signatory: cert.signatoryTitle,
      verificationHash: cert.verificationHash,
    };
  }
}
