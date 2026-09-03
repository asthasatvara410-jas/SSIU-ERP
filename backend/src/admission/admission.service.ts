import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  CreateLeadDto,
  UpdateLeadDto,
  AssignLeadDto,
  UpdateLeadStatusDto,
  RecordFollowUpDto,
  CreateApplicationDto,
  DocumentAttachmentDto,
  VerifyDocumentDto,
  VerifyApplicationDto,
  ApproveAdmissionDto,
  RejectAdmissionDto,
  EnrollStudentDto,
  LeadQueryDto,
  ApplicationQueryDto,
  LeadStatusEnum,
} from './dto/admission.dto';

@Injectable()
export class AdmissionService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── 1. Admission Cycles ───────────────────────────────────────────────────

  async getAdmissionCycles() {
    let cycles = await this.prisma.admissionCycle.findMany({
      orderBy: { startDate: 'desc' },
    });

    if (cycles.length === 0) {
      const defaultCycle = await this.prisma.admissionCycle.create({
        data: {
          code: 'ADM-2026-REGULAR',
          academicYearCode: '2026-27',
          name: 'Academic Year 2026-27 Regular Admissions',
          admissionType: 'REGULAR',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-09-30'),
          applicationFee: 500,
          status: 'ACTIVE',
        },
      });
      cycles = [defaultCycle];
    }
    return cycles;
  }

  async createAdmissionCycle(data: {
    code: string;
    academicYearCode?: string;
    name: string;
    admissionType?: string;
    startDate: string;
    endDate: string;
    applicationFee?: number;
  }) {
    return this.prisma.admissionCycle.create({
      data: {
        code: data.code.toUpperCase(),
        academicYearCode: data.academicYearCode || '2026-27',
        name: data.name,
        admissionType: data.admissionType || 'REGULAR',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        applicationFee: data.applicationFee ?? 500,
        status: 'ACTIVE',
      },
    });
  }

  // ── 2. Lead Generation & Management ───────────────────────────────────────

  async createInquiry(data: CreateLeadDto) {
    const inqNo = this.generateNumber('INQ');

    return this.prisma.admissionInquiry.create({
      data: {
        inquiryNo: inqNo,
        applicantName: data.applicantName,
        mobile: data.mobile,
        email: data.email,
        city: data.city,
        state: data.state,
        interestedInstituteId: data.interestedInstituteId,
        interestedProgramId: data.interestedProgramId,
        source: data.source || 'WEBSITE',
        counsellorUserId: data.counsellorUserId,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
        remarks: data.remarks,
        status: LeadStatusEnum.NEW,
      },
    });
  }

  async getInquiries(user: any, query?: LeadQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC: If user is Counselor / non-admin, filter by assigned counselor if specified or required
    if (user.role === 'COUNSELLOR' || (user.authorityLevel > 4 && user.role !== 'SUPER_ADMIN')) {
      where.counsellorUserId = user.id;
    } else if (query?.counsellorUserId) {
      where.counsellorUserId = query.counsellorUserId;
    }

    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.source) where.source = query.source.toUpperCase();
    if (query?.interestedProgramId) where.interestedProgramId = query.interestedProgramId;
    if (query?.interestedInstituteId) where.interestedInstituteId = query.interestedInstituteId;

    if (query?.startDate || query?.endDate) {
      where.inquiryDate = {};
      if (query.startDate) where.inquiryDate.gte = new Date(query.startDate);
      if (query.endDate) where.inquiryDate.lte = new Date(query.endDate);
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { applicantName: { contains: q, mode: 'insensitive' } },
        { inquiryNo: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.admissionInquiry.count({ where }),
      this.prisma.admissionInquiry.findMany({
        where,
        skip,
        take: limit,
        include: {
          counsellings: { orderBy: { counsellingDate: 'desc' }, take: 2 },
          applications: { select: { id: true, applicationNo: true, status: true } },
        },
        orderBy: { inquiryDate: 'desc' },
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

  async getInquiryById(id: string) {
    const inquiry = await this.prisma.admissionInquiry.findUnique({
      where: { id },
      include: {
        counsellings: { orderBy: { counsellingDate: 'desc' } },
        applications: {
          include: {
            admissionCycle: true,
            documents: true,
            enrollment: true,
          },
        },
      },
    });
    if (!inquiry) throw new NotFoundException('Inquiry / Lead not found.');
    return inquiry;
  }

  async updateInquiry(id: string, dto: UpdateLeadDto) {
    await this.getInquiryById(id);

    return this.prisma.admissionInquiry.update({
      where: { id },
      data: {
        applicantName: dto.applicantName,
        mobile: dto.mobile,
        email: dto.email,
        city: dto.city,
        state: dto.state,
        interestedInstituteId: dto.interestedInstituteId,
        interestedProgramId: dto.interestedProgramId,
        source: dto.source?.toUpperCase(),
        status: dto.status?.toUpperCase(),
        counsellorUserId: dto.counsellorUserId,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
        remarks: dto.remarks,
      },
    });
  }

  async assignLead(id: string, dto: AssignLeadDto) {
    await this.getInquiryById(id);

    return this.prisma.admissionInquiry.update({
      where: { id },
      data: {
        counsellorUserId: dto.counsellorUserId,
        status: LeadStatusEnum.CONTACTED,
        remarks: dto.remarks,
      },
    });
  }

  async updateLeadStatus(id: string, dto: UpdateLeadStatusDto) {
    await this.getInquiryById(id);

    return this.prisma.admissionInquiry.update({
      where: { id },
      data: {
        status: dto.status.toUpperCase(),
        remarks: dto.remarks,
      },
    });
  }

  async recordCounselling(data: RecordFollowUpDto, counsellorUserId: string) {
    const inquiry = await this.prisma.admissionInquiry.findUnique({ where: { id: data.inquiryId } });
    if (!inquiry) throw new NotFoundException('Inquiry not found.');

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.counsellingRecord.create({
        data: {
          inquiryId: data.inquiryId,
          counsellorUserId,
          discussionPoints: data.discussionPoints,
          applicantNeed: data.applicantNeed,
          nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
          remarks: data.remarks,
        },
      });

      await tx.admissionInquiry.update({
        where: { id: data.inquiryId },
        data: {
          status: LeadStatusEnum.FOLLOW_UP,
          nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : inquiry.nextFollowUpDate,
        },
      });

      return record;
    });
  }

  async getFollowUpHistory(inquiryId: string) {
    await this.getInquiryById(inquiryId);
    return this.prisma.counsellingRecord.findMany({
      where: { inquiryId },
      orderBy: { counsellingDate: 'desc' },
    });
  }

  // ── 3. Applications & Documents ───────────────────────────────────────────

  async createApplication(data: CreateApplicationDto) {
    const appNo = this.generateNumber('APP');

    // Auto resolve active cycle if not provided
    let cycleId = data.admissionCycleId;
    if (!cycleId) {
      const cycle = await this.prisma.admissionCycle.findFirst({ where: { status: 'ACTIVE' } });
      if (cycle) cycleId = cycle.id;
      else {
        const newCycle = await this.prisma.admissionCycle.create({
          data: {
            code: 'ADM-2026-REG',
            academicYearCode: '2026-27',
            name: 'Regular Admissions 2026-27',
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-09-30'),
            status: 'ACTIVE',
          },
        });
        cycleId = newCycle.id;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const app = await tx.admissionApplication.create({
        data: {
          applicationNo: appNo,
          inquiryId: data.inquiryId,
          admissionCycleId: cycleId!,
          instituteId: data.instituteId,
          programId: data.programId,
          admissionType: data.admissionType || 'REGULAR',
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          email: data.email,
          mobile: data.mobile,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          category: data.category || 'GENERAL',
          city: data.city,
          state: data.state,
          address: data.address,
          qualifyingExam: data.qualifyingExam,
          qualifyingBoard: data.qualifyingBoard,
          passingYear: data.passingYear,
          percentage: data.percentage,
          status: 'SUBMITTED',
          documents: {
            create: (data.documents || []).map((doc) => ({
              documentType: doc.documentType,
              documentUrl: doc.documentUrl,
              status: 'UPLOADED',
            })),
          },
        },
        include: { documents: true, admissionCycle: true },
      });

      if (data.inquiryId) {
        await tx.admissionInquiry.update({
          where: { id: data.inquiryId },
          data: { status: LeadStatusEnum.APPLIED },
        });
      }

      return app;
    });
  }

  async getApplications(query?: ApplicationQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.instituteId) where.instituteId = query.instituteId;
    if (query?.programId) where.programId = query.programId;
    if (query?.status) where.status = query.status.toUpperCase();

    if (query?.startDate || query?.endDate) {
      where.submissionDate = {};
      if (query.startDate) where.submissionDate.gte = new Date(query.startDate);
      if (query.endDate) where.submissionDate.lte = new Date(query.endDate);
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { applicationNo: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.admissionApplication.count({ where }),
      this.prisma.admissionApplication.findMany({
        where,
        skip,
        take: limit,
        include: {
          admissionCycle: true,
          documents: true,
          approvals: true,
          enrollment: true,
        },
        orderBy: { submissionDate: 'desc' },
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

  async getApplicationById(id: string) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id },
      include: {
        admissionCycle: true,
        documents: true,
        eligibilityResults: true,
        approvals: true,
        enrollment: true,
      },
    });
    if (!app) throw new NotFoundException('Application not found.');
    return app;
  }

  async uploadApplicationDocument(applicationId: string, doc: DocumentAttachmentDto) {
    await this.getApplicationById(applicationId);

    return this.prisma.admissionApplicationDocument.create({
      data: {
        applicationId,
        documentType: doc.documentType,
        documentUrl: doc.documentUrl,
        status: 'UPLOADED',
      },
    });
  }

  async verifyDocument(documentId: string, verifiedByUserId: string, isApproved: boolean, remarks?: string) {
    const doc = await this.prisma.admissionApplicationDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');

    return this.prisma.admissionApplicationDocument.update({
      where: { id: documentId },
      data: {
        status: isApproved ? 'VERIFIED' : 'REJECTED',
        verifiedBy: verifiedByUserId,
        remarks,
      },
    });
  }

  async verifyApplication(id: string, verifiedByUserId: string, dto: VerifyApplicationDto) {
    const app = await this.getApplicationById(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionApplication.update({
        where: { id },
        data: {
          status: dto.isVerified ? 'VERIFIED' : 'DOCUMENT_QUERY',
          verifiedByUserId,
          verifiedAt: new Date(),
          remarks: dto.remarks,
        },
        include: { documents: true },
      });

      if (app.inquiryId && dto.isVerified) {
        await tx.admissionInquiry.update({
          where: { id: app.inquiryId },
          data: { status: LeadStatusEnum.VERIFIED },
        });
      }

      return updated;
    });
  }

  async approveApplication(id: string, approverUserId: string, roleCode: string, dto?: ApproveAdmissionDto) {
    const app = await this.getApplicationById(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.admissionApproval.create({
        data: {
          applicationId: id,
          approverRole: roleCode,
          approverUserId,
          status: 'APPROVED',
          comments: dto?.comments || 'Application approved by admissions authority',
        },
      });

      const updated = await tx.admissionApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedByUserId: approverUserId,
          approvedAt: new Date(),
          remarks: dto?.comments,
        },
      });

      if (app.inquiryId) {
        await tx.admissionInquiry.update({
          where: { id: app.inquiryId },
          data: { status: LeadStatusEnum.ADMITTED },
        });
      }

      return updated;
    });
  }

  async rejectApplication(id: string, rejectorUserId: string, dto: RejectAdmissionDto) {
    const app = await this.getApplicationById(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          approvedByUserId: rejectorUserId,
          approvedAt: new Date(),
        },
      });

      if (app.inquiryId) {
        await tx.admissionInquiry.update({
          where: { id: app.inquiryId },
          data: { status: LeadStatusEnum.REJECTED },
        });
      }

      return updated;
    });
  }

  async confirmFeePayment(id: string, feeAmount: number, receiptNo: string) {
    const app = await this.getApplicationById(id);

    return this.prisma.admissionApplication.update({
      where: { id },
      data: {
        isFeePaid: true,
        feeAmountPaid: feeAmount,
        feeReceiptNo: receiptNo,
        status: 'ADMISSION_CONFIRMED',
      },
    });
  }

  // ── 4. Student Conversion & Institutional Enrollment ──────────────────────

  async enrollStudent(applicationId: string, enrolledByUserId: string, dto?: EnrollStudentDto) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id: applicationId },
      include: { enrollment: true },
    });
    if (!app) throw new NotFoundException('Application not found.');
    if (app.enrollment) throw new ConflictException('Student already enrolled for this application.');

    // 1. Resolve Academic Batch
    let targetBatchId = dto?.batchId;
    if (!targetBatchId) {
      const batch = await this.prisma.batch.findFirst({
        where: { programId: app.programId },
        orderBy: { startYear: 'desc' },
      });
      if (batch) targetBatchId = batch.id;
    }

    if (!targetBatchId) {
      const academicYear =
        (await this.prisma.academicYear.findFirst({ where: { isCurrent: true } })) ||
        (await this.prisma.academicYear.findFirst());
      const newBatch = await this.prisma.batch.create({
        data: {
          code: `BATCH-2026-${app.programId.slice(0, 4).toUpperCase()}`,
          programId: app.programId,
          academicYearId: academicYear?.id || '',
          startYear: 2026,
          endYear: 2030,
          status: 'ACTIVE',
        },
      });
      targetBatchId = newBatch.id;
    }

    // 2. Generate Safe Sequential Temporary Enrollment Number & 5-Digit Access Code
    const year = '2026';
    const tempEnrollCount = await this.prisma.student.count({
      where: {
        temporaryEnrollmentNumber: { startsWith: `TEMP-${year}-` },
      },
    });
    const tempSeq = (tempEnrollCount + 1).toString().padStart(5, '0');
    const temporaryEnrollmentNumber = `TEMP-${year}-${tempSeq}`;
    
    // Generate exactly 5-digit random access code with leading zeros
    const studentAccessCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const enrollmentNo = temporaryEnrollmentNumber;
    const erpId = `STU${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.$transaction(async (tx) => {
      // 3. Create Student in Master
      const program = await tx.program.findUnique({ where: { id: app.programId } });
      const departmentId = program?.departmentId || '';

      const student = await tx.student.create({
        data: {
          erpId,
          enrollmentNo,
          temporaryEnrollmentNumber,
          enrollmentStatus: 'TEMPORARY',
          studentAccessCode,
          onboardingCompletedAt: new Date(),
          firstName: app.firstName,
          middleName: app.middleName,
          lastName: app.lastName,
          email: app.email,
          phone: app.mobile,
          dateOfBirth: app.dateOfBirth,
          gender: app.gender,
          instituteId: app.instituteId,
          departmentId,
          batchId: targetBatchId!,
          currentDivisionId: dto?.divisionId,
          status: 'ACTIVE',
        },
      });

      // 4. Create User Account for Student login with Temporary Enrollment & Access Code
      const passwordHash = await bcrypt.hash(studentAccessCode, 10);
      const studentRole = await tx.role.findUnique({ where: { code: 'STUDENT' } });

      const user = await tx.user.create({
        data: {
          erpId,
          username: temporaryEnrollmentNumber,
          temporaryEnrollmentNumber,
          enrollmentStatus: 'TEMPORARY',
          studentAccessCode,
          passwordHash,
          accountStatus: 'ACTIVE',
          studentId: student.id,
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

      // 5. Create Enrollment record
      const enrollment = await tx.enrollment.create({
        data: {
          applicationId: app.id,
          studentId: student.id,
          enrollmentNo: temporaryEnrollmentNumber,
          academicYearCode: dto?.academicYearCode || '2026-27',
          enrolledBy: enrolledByUserId,
        },
      });

      // 6. Update Application & Inquiry status
      await tx.admissionApplication.update({
        where: { id: app.id },
        data: { status: 'ENROLLED' },
      });

      if (app.inquiryId) {
        await tx.admissionInquiry.update({
          where: { id: app.inquiryId },
          data: { status: LeadStatusEnum.ENROLLED },
        });
      }

      return {
        enrollment,
        student,
        temporaryEnrollmentNumber,
        studentAccessCode,
        user: { id: user.id, username: user.username, erpId: user.erpId },
      };
    });
  }

  async assignFinalEnrollment(studentId: string, officerUserId: string, finalEnrollmentNo: string, remarks?: string) {
    const cleanFinalNo = finalEnrollmentNo.trim();
    if (!cleanFinalNo) {
      throw new BadRequestException('Final enrollment number cannot be empty.');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found.');

    // Duplicate check for final enrollment number
    const existing = await this.prisma.student.findFirst({
      where: {
        OR: [
          { enrollmentNo: cleanFinalNo },
          { finalEnrollmentNumber: cleanFinalNo },
        ],
        NOT: { id: studentId },
      },
    });
    if (existing) {
      throw new ConflictException(`Final enrollment number "${cleanFinalNo}" is already assigned to student ${existing.firstName} ${existing.lastName}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Student Record on SAME ID
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          enrollmentNo: cleanFinalNo,
          finalEnrollmentNumber: cleanFinalNo,
          enrollmentStatus: 'FINAL',
          finalEnrollmentAssignedAt: new Date(),
          finalEnrollmentAssignedBy: officerUserId,
        },
      });

      // 2. Update User Account on SAME ID
      await tx.user.updateMany({
        where: { studentId },
        data: {
          username: cleanFinalNo,
          finalEnrollmentNumber: cleanFinalNo,
          enrollmentStatus: 'FINAL',
        },
      });

      // 3. Update Enrollment record if exists
      await tx.enrollment.updateMany({
        where: { studentId },
        data: { enrollmentNo: cleanFinalNo },
      });

      return {
        success: true,
        student: updatedStudent,
        temporaryEnrollmentNumber: student.temporaryEnrollmentNumber || student.enrollmentNo,
        finalEnrollmentNumber: cleanFinalNo,
        message: `Student ${student.firstName} ${student.lastName} successfully converted to Final Enrollment: ${cleanFinalNo}`,
      };
    });
  }

  async resetAccessCode(studentId: string, officerUserId: string, reason?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found.');

    const newCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const passwordHash = await bcrypt.hash(newCode, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: { studentAccessCode: newCode },
      });

      await tx.user.updateMany({
        where: { studentId },
        data: { passwordHash, studentAccessCode: newCode },
      });
    });

    return {
      success: true,
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      temporaryEnrollmentNumber: student.temporaryEnrollmentNumber,
      studentAccessCode: newCode,
      message: `Access code regenerated successfully.`,
    };
  }

  async getTemporaryEnrollments() {
    return this.prisma.student.findMany({
      where: { enrollmentStatus: 'TEMPORARY' },
      include: {
        institute: true,
        department: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  // ── 5. Reports & Funnel Analytics ─────────────────────────────────────────

  async getAdmissionDashboardMetrics() {
    const [
      totalInquiries,
      newLeads,
      contactedLeads,
      followUpLeads,
      appliedLeads,
      totalApplications,
      underVerification,
      approved,
      rejected,
      enrolled,
    ] = await Promise.all([
      this.prisma.admissionInquiry.count(),
      this.prisma.admissionInquiry.count({ where: { status: LeadStatusEnum.NEW } }),
      this.prisma.admissionInquiry.count({ where: { status: LeadStatusEnum.CONTACTED } }),
      this.prisma.admissionInquiry.count({ where: { status: LeadStatusEnum.FOLLOW_UP } }),
      this.prisma.admissionInquiry.count({ where: { status: LeadStatusEnum.APPLIED } }),
      this.prisma.admissionApplication.count(),
      this.prisma.admissionApplication.count({ where: { status: 'UNDER_VERIFICATION' } }),
      this.prisma.admissionApplication.count({ where: { status: 'APPROVED' } }),
      this.prisma.admissionApplication.count({ where: { status: 'REJECTED' } }),
      this.prisma.admissionApplication.count({ where: { status: 'ENROLLED' } }),
    ]);

    return {
      funnel: {
        totalInquiries,
        newLeads,
        contactedLeads,
        followUpLeads,
        appliedLeads,
        totalApplications,
        underVerification,
        approved,
        rejected,
        enrolled,
        conversionRate: totalInquiries > 0 ? Number(((enrolled / totalInquiries) * 100).toFixed(2)) : 0,
      },
    };
  }

  async getProgramAdmissionsReport() {
    const applications = await this.prisma.admissionApplication.findMany({
      include: { admissionCycle: true },
    });

    const progMap = new Map<string, any>();

    for (const app of applications) {
      const pId = app.programId;
      if (!progMap.has(pId)) {
        const prog = await this.prisma.program.findUnique({ where: { id: pId } });
        progMap.set(pId, {
          programId: pId,
          programName: prog?.name || 'Program',
          applied: 0,
          approved: 0,
          enrolled: 0,
          rejected: 0,
        });
      }
      const data = progMap.get(pId);
      data.applied++;
      if (app.status === 'APPROVED' || app.status === 'ADMISSION_CONFIRMED') data.approved++;
      if (app.status === 'ENROLLED') data.enrolled++;
      if (app.status === 'REJECTED') data.rejected++;
    }

    return Array.from(progMap.values());
  }

  async getSourceEffectivenessReport() {
    const inquiries = await this.prisma.admissionInquiry.findMany();
    const sourceMap = new Map<string, { source: string; total: number; converted: number }>();

    for (const inq of inquiries) {
      const src = inq.source || 'OTHER';
      if (!sourceMap.has(src)) {
        sourceMap.set(src, { source: src, total: 0, converted: 0 });
      }
      const s = sourceMap.get(src)!;
      s.total++;
      if (inq.status === LeadStatusEnum.ENROLLED || inq.status === LeadStatusEnum.ADMITTED) {
        s.converted++;
      }
    }

    return Array.from(sourceMap.values()).map((s) => ({
      ...s,
      conversionRate: s.total > 0 ? Number(((s.converted / s.total) * 100).toFixed(2)) : 0,
    }));
  }
}
