import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkDiaryDto,
  UpdateWorkDiaryDto,
  SubmitWorkDiaryDto,
  FacultyReviewDto,
  HodReviewDto,
  ApproveWorkDiaryDto,
  RejectWorkDiaryDto,
  WorkDiaryQueryDto,
  WorkDiaryStatusEnum,
} from './dto/work-diary.dto';

function parseDateSafe(dateInput?: string | Date): Date | undefined {
  if (!dateInput) return undefined;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? undefined : dateInput;
  const str = String(dateInput).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    const d = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalizePriority(p?: string): string {
  if (!p) return 'NORMAL';
  const upper = p.trim().toUpperCase();
  if (['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(upper)) return upper;
  if (upper === 'MEDIUM') return 'NORMAL';
  return 'NORMAL';
}

@Injectable()
export class WorkManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. Work Diary Core & Workflow ────────────────────────────────────────

  /**
   * Create a new Work Diary entry (either as DRAFT or directly SUBMITTED)
   */
  async createDiaryEntry(user: any, data: CreateWorkDiaryDto, forceDraft = false) {
    const userId = user.id;
    const safeWorkDate = parseDateSafe(data.workDate) || new Date();
    
    // Auto-resolve departmentId and instituteId from user's faculty profile if omitted
    let departmentId = data.departmentId || user.faculty?.departmentId;
    let instituteId = data.instituteId || user.faculty?.instituteId;

    if (!departmentId || !instituteId) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { faculty: { select: { departmentId: true, instituteId: true } } },
      });
      if (userRecord?.faculty) {
        departmentId = departmentId || userRecord.faculty.departmentId;
        instituteId = instituteId || userRecord.faculty.instituteId;
      }
    }

    const initialStatus = forceDraft
      ? WorkDiaryStatusEnum.DRAFT
      : (data.status?.toUpperCase() || WorkDiaryStatusEnum.DRAFT);

    const isSubmitted = initialStatus === WorkDiaryStatusEnum.SUBMITTED;

    const diary = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workDiary.create({
        data: {
          userId,
          workTitle: data.workTitle,
          description: data.description,
          category: data.category?.toUpperCase() || 'GENERAL',
          workDate: safeWorkDate,
          startTime: data.startTime,
          endTime: data.endTime,
          priority: normalizePriority(data.priority),
          status: initialStatus,
          relatedModule: data.relatedModule,
          relatedPerson: data.relatedPerson,
          relatedDepartment: data.relatedDepartment,
          relatedInstitute: data.relatedInstitute,
          departmentId,
          instituteId,
          remarks: data.remarks,
          submittedAt: isSubmitted ? new Date() : null,
        },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                  departmentId: true,
                  instituteId: true,
                },
              },
            },
          },
          history: true,
        },
      });

      // Record initial history
      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: created.id,
          action: isSubmitted ? 'SUBMITTED' : (initialStatus === WorkDiaryStatusEnum.DRAFT ? 'SAVED_DRAFT' : 'CREATED'),
          fromStatus: null,
          toStatus: initialStatus,
          performedBy: user.username || user.erpId || userId,
          comments: isSubmitted ? 'Work diary submitted for review' : 'Work diary entry created',
        },
      });

      return created;
    });

    return diary;
  }

  /**
   * Save work diary as draft shortcut
   */
  async saveDraft(user: any, data: CreateWorkDiaryDto) {
    return this.createDiaryEntry(user, data, true);
  }

  /**
   * Submit an existing work diary (transitions DRAFT -> SUBMITTED)
   */
  async submitDiaryEntry(user: any, id: string, data?: SubmitWorkDiaryDto) {
    const diary = await this.getDiaryEntryById(user, id);

    if (diary.userId !== user.id && user.authorityLevel > 2) {
      throw new ForbiddenException('Only the diary owner or an administrator can submit this work diary.');
    }

    if (diary.status === WorkDiaryStatusEnum.APPROVED) {
      throw new BadRequestException('This work diary is already approved and cannot be resubmitted.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.workDiary.update({
        where: { id },
        data: {
          status: WorkDiaryStatusEnum.SUBMITTED,
          submittedAt: new Date(),
          remarks: data?.submissionRemarks ? `${diary.remarks ? diary.remarks + ' | ' : ''}Submission: ${data.submissionRemarks}` : diary.remarks,
        },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                },
              },
            },
          },
        },
      });

      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: id,
          action: 'SUBMITTED',
          fromStatus: diary.status,
          toStatus: WorkDiaryStatusEnum.SUBMITTED,
          performedBy: user.username || user.erpId || user.id,
          comments: data?.submissionRemarks || 'Work diary submitted for faculty and HOD review',
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Update work diary content
   */
  async updateDiaryEntry(user: any, id: string, data: UpdateWorkDiaryDto) {
    const diary = await this.getDiaryEntryById(user, id);

    // Ownership check: only owner or Admin can update content
    const isOwner = diary.userId === user.id;
    const isAdmin = user.authorityLevel <= 2;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify this work diary.');
    }

    // If already approved, locked unless admin
    if (diary.status === WorkDiaryStatusEnum.APPROVED && !isAdmin) {
      throw new BadRequestException('Approved work diary entries are locked and cannot be edited.');
    }

    const updateData: any = {};
    if (data.workTitle !== undefined) updateData.workTitle = data.workTitle;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category.toUpperCase();
    if (data.workDate !== undefined) updateData.workDate = parseDateSafe(data.workDate);
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.priority !== undefined) updateData.priority = normalizePriority(data.priority);
    if (data.status !== undefined) updateData.status = data.status.toUpperCase();
    if (data.relatedModule !== undefined) updateData.relatedModule = data.relatedModule;
    if (data.relatedPerson !== undefined) updateData.relatedPerson = data.relatedPerson;
    if (data.relatedDepartment !== undefined) updateData.relatedDepartment = data.relatedDepartment;
    if (data.relatedInstitute !== undefined) updateData.relatedInstitute = data.relatedInstitute;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.instituteId !== undefined) updateData.instituteId = data.instituteId;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.workDiary.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                },
              },
            },
          },
        },
      });

      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: id,
          action: 'UPDATED',
          fromStatus: diary.status,
          toStatus: updateData.status || diary.status,
          performedBy: user.username || user.erpId || user.id,
          comments: 'Work diary details updated',
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Faculty response & review step (SUBMITTED -> FACULTY_REVIEW / HOD_REVIEW)
   */
  async facultyReview(user: any, id: string, data: FacultyReviewDto) {
    const diary = await this.getDiaryEntryById(user, id);

    // Verify reviewer authority (Faculty, Mentor, HOD, Admin)
    if (user.authorityLevel > 5) {
      throw new ForbiddenException('Faculty or Mentor review authority required.');
    }

    const nextStatus = data.nextStatus
      ? data.nextStatus.toUpperCase()
      : WorkDiaryStatusEnum.HOD_REVIEW;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.workDiary.update({
        where: { id },
        data: {
          status: nextStatus,
          facultyComments: data.facultyComments,
          facultyReviewedAt: new Date(),
          facultyReviewedById: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                },
              },
            },
          },
        },
      });

      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: id,
          action: 'FACULTY_REVIEWED',
          fromStatus: diary.status,
          toStatus: nextStatus,
          performedBy: user.username || user.erpId || user.id,
          comments: data.facultyComments,
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * HOD Review step (HOD_REVIEW -> APPROVED / REJECTED / HOD_REVIEW)
   */
  async hodReview(user: any, id: string, data: HodReviewDto) {
    const diary = await this.getDiaryEntryById(user, id);

    // HOD or higher authority required (level <= 4)
    if (user.authorityLevel > 4) {
      throw new ForbiddenException('HOD or Academic Executive review authority required.');
    }

    const decision = data.decision ? data.decision.toUpperCase() : WorkDiaryStatusEnum.APPROVED;
    const isApproved = decision === WorkDiaryStatusEnum.APPROVED;
    const isRejected = decision === WorkDiaryStatusEnum.REJECTED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.workDiary.update({
        where: { id },
        data: {
          status: decision,
          hodComments: data.hodComments,
          hodReviewedAt: new Date(),
          hodReviewedById: user.id,
          ...(isApproved ? { approvedAt: new Date(), approvedById: user.id } : {}),
          ...(isRejected ? { rejectedAt: new Date(), rejectedById: user.id, rejectionReason: data.hodComments } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                },
              },
            },
          },
        },
      });

      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: id,
          action: isApproved ? 'APPROVED' : (isRejected ? 'REJECTED' : 'HOD_REVIEWED'),
          fromStatus: diary.status,
          toStatus: decision,
          performedBy: user.username || user.erpId || user.id,
          comments: data.hodComments,
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Approve Work Diary directly (HOD, Principal, Super Admin)
   */
  async approveDiaryEntry(user: any, id: string, data?: ApproveWorkDiaryDto) {
    const diary = await this.getDiaryEntryById(user, id);

    if (user.authorityLevel > 4) {
      throw new ForbiddenException('Only HOD, Principal, or University Administrators can approve work diaries.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.workDiary.update({
        where: { id },
        data: {
          status: WorkDiaryStatusEnum.APPROVED,
          approvedAt: new Date(),
          approvedById: user.id,
          hodComments: data?.approvalRemarks || diary.hodComments || 'Approved',
        },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                },
              },
            },
          },
        },
      });

      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: id,
          action: 'APPROVED',
          fromStatus: diary.status,
          toStatus: WorkDiaryStatusEnum.APPROVED,
          performedBy: user.username || user.erpId || user.id,
          comments: data?.approvalRemarks || 'Work diary approved',
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Reject Work Diary with reason
   */
  async rejectDiaryEntry(user: any, id: string, data: RejectWorkDiaryDto) {
    const diary = await this.getDiaryEntryById(user, id);

    if (user.authorityLevel > 4) {
      throw new ForbiddenException('Only HOD, Principal, or University Administrators can reject work diaries.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.workDiary.update({
        where: { id },
        data: {
          status: WorkDiaryStatusEnum.REJECTED,
          rejectedAt: new Date(),
          rejectedById: user.id,
          rejectionReason: data.rejectionReason,
        },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                },
              },
            },
          },
        },
      });

      await tx.workDiaryHistory.create({
        data: {
          workDiaryId: id,
          action: 'REJECTED',
          fromStatus: diary.status,
          toStatus: WorkDiaryStatusEnum.REJECTED,
          performedBy: user.username || user.erpId || user.id,
          comments: `Rejection reason: ${data.rejectionReason}`,
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Get complete chronological history of a work diary entry
   */
  async getDiaryHistory(user: any, id: string) {
    await this.getDiaryEntryById(user, id);

    return this.prisma.workDiaryHistory.findMany({
      where: { workDiaryId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get Work Diary entries with full pagination, search, and multi-dimensional filtering
   */
  async getDiaryEntries(user: any, query?: WorkDiaryQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const safeDate = query?.date ? parseDateSafe(query.date) : undefined;
    const safeStartDate = query?.startDate ? parseDateSafe(query.startDate) : undefined;
    const safeEndDate = query?.endDate ? parseDateSafe(query.endDate) : undefined;

    const where: any = {};

    // ── RBAC Scope Resolution:
    const isExecutive = user.authorityLevel <= 2; // Super Admin, Principal, Registrar
    const isHOD = user.authorityLevel === 4 || user.role === 'HOD';

    if (query?.facultyId) {
      where.userId = query.facultyId;
    } else if (query?.allDepartments && (isExecutive || isHOD)) {
      // HOD or Executive requesting department/institute view
      if (isHOD && user.faculty?.departmentId && !isExecutive) {
        where.departmentId = user.faculty.departmentId;
      }
    } else if (isExecutive) {
      // Admin without specific user filter can view all
    } else if (isHOD && query?.departmentId) {
      where.departmentId = query.departmentId;
    } else {
      // Default: regular faculty sees their own entries
      where.userId = user.id;
    }

    // ── Date Filters:
    if (safeDate) {
      where.workDate = safeDate;
    } else if (safeStartDate || safeEndDate) {
      where.workDate = {};
      if (safeStartDate) where.workDate.gte = safeStartDate;
      if (safeEndDate) where.workDate.lte = safeEndDate;
    }

    // ── Department & Institute Filters:
    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query?.instituteId) {
      where.instituteId = query.instituteId;
    }

    // ── Status, Category & Priority Filters:
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status.toUpperCase();
    }
    if (query?.category && query.category !== 'ALL') {
      where.category = query.category.toUpperCase();
    }
    if (query?.priority && query.priority !== 'ALL') {
      where.priority = query.priority.toUpperCase();
    }

    // ── Full-Text Search:
    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { workTitle: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { remarks: { contains: q, mode: 'insensitive' } },
        { relatedPerson: { contains: q, mode: 'insensitive' } },
        { relatedDepartment: { contains: q, mode: 'insensitive' } },
        { relatedInstitute: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.workDiary.count({ where }),
      this.prisma.workDiary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { workDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              erpId: true,
              username: true,
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  designation: true,
                  departmentId: true,
                  instituteId: true,
                },
              },
            },
          },
          history: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
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

  /**
   * Get single Work Diary entry by ID with authorization check
   */
  async getDiaryEntryById(user: any, id: string) {
    const entry = await this.prisma.workDiary.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            erpId: true,
            username: true,
            faculty: {
              select: {
                firstName: true,
                lastName: true,
                designation: true,
                departmentId: true,
                instituteId: true,
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Work Diary entry not found.');
    }

    // Permission check: owner, faculty/mentor of same department, HOD, or Administrator (level <= 2)
    const isOwner = entry.userId === user.id;
    const isAdmin = user.authorityLevel <= 2;
    const isSameDepartmentFaculty = user.authorityLevel <= 5 && 
                                    user.faculty?.departmentId && 
                                    entry.departmentId &&
                                    user.faculty.departmentId === entry.departmentId;
    const isHOD = (user.authorityLevel <= 4 || user.role === 'HOD');

    if (!isOwner && !isAdmin && !isSameDepartmentFaculty && !isHOD) {
      throw new ForbiddenException('You do not have permission to view this Work Diary entry.');
    }

    return entry;
  }

  /**
   * Delete Work Diary entry (allowed for DRAFT or REJECTED by owner, or Admin)
   */
  async deleteDiaryEntry(user: any, id: string) {
    const entry = await this.getDiaryEntryById(user, id);

    const isOwner = entry.userId === user.id;
    const isAdmin = user.authorityLevel <= 2;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this Work Diary entry.');
    }

    if (entry.status === WorkDiaryStatusEnum.APPROVED && !isAdmin) {
      throw new BadRequestException('Approved work diary entries cannot be deleted.');
    }

    await this.prisma.workDiary.delete({
      where: { id },
    });

    return { success: true, message: 'Work Diary entry deleted successfully.' };
  }

  /**
   * Dashboard Statistics for Work Diary
   */
  async getDiaryDashboardStats(user: any, departmentId?: string, instituteId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {};
    const isExecutive = user.authorityLevel <= 2;
    const isHOD = user.authorityLevel === 4 || user.role === 'HOD';

    if (departmentId && (isHOD || isExecutive)) {
      where.departmentId = departmentId;
    } else if (instituteId && isExecutive) {
      where.instituteId = instituteId;
    } else if (isHOD && user.faculty?.departmentId) {
      where.departmentId = user.faculty.departmentId;
    } else if (!isExecutive) {
      where.userId = user.id;
    }

    const [
      total,
      drafts,
      submitted,
      facultyReview,
      hodReview,
      approved,
      rejected,
      overdueEntries,
      todaysEntries,
    ] = await Promise.all([
      this.prisma.workDiary.count({ where }),
      this.prisma.workDiary.count({ where: { ...where, status: WorkDiaryStatusEnum.DRAFT } }),
      this.prisma.workDiary.count({ where: { ...where, status: WorkDiaryStatusEnum.SUBMITTED } }),
      this.prisma.workDiary.count({ where: { ...where, status: WorkDiaryStatusEnum.FACULTY_REVIEW } }),
      this.prisma.workDiary.count({ where: { ...where, status: WorkDiaryStatusEnum.HOD_REVIEW } }),
      this.prisma.workDiary.count({ where: { ...where, status: WorkDiaryStatusEnum.APPROVED } }),
      this.prisma.workDiary.count({ where: { ...where, status: WorkDiaryStatusEnum.REJECTED } }),
      this.prisma.workDiary.count({
        where: {
          ...where,
          OR: [
            { status: 'OVERDUE' },
            { workDate: { lt: today }, status: { in: [WorkDiaryStatusEnum.DRAFT, WorkDiaryStatusEnum.SUBMITTED] } },
          ],
        },
      }),
      this.prisma.workDiary.count({ where: { ...where, workDate: today } }),
    ]);

    return {
      total,
      drafts,
      submitted,
      underReview: submitted + facultyReview + hodReview,
      facultyReview,
      hodReview,
      approved,
      rejected,
      overdue: overdueEntries,
      todayCount: todaysEntries,
    };
  }

  // ── 2. Dashboard Aggregation ─────────────────────────────────────────────

  async getWorkDashboard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todaysTasks,
      overdueTasks,
      upcomingTasks,
      todaysMeetings,
      upcomingMeetings,
      appointments,
      followUps,
      recentDiary,
      quickNotes,
    ] = await Promise.all([
      this.prisma.workTask.findMany({
        where: { userId, dueDate: today, status: { not: 'COMPLETED' } },
        orderBy: { priority: 'desc' },
      }),
      this.prisma.workTask.findMany({
        where: { userId, dueDate: { lt: today }, status: { not: 'COMPLETED' } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.workTask.findMany({
        where: { userId, dueDate: { gt: today }, status: { not: 'COMPLETED' } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      this.prisma.personalMeeting.findMany({
        where: {
          meetingDate: today,
          OR: [{ organizerUserId: userId }, { participants: { some: { userId } } }],
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.personalMeeting.findMany({
        where: {
          meetingDate: { gt: today },
          OR: [{ organizerUserId: userId }, { participants: { some: { userId } } }],
        },
        orderBy: { meetingDate: 'asc' },
        take: 5,
      }),
      this.prisma.personalAppointment.findMany({
        where: { userId, appointmentDate: { gte: today }, status: 'SCHEDULED' },
        orderBy: { appointmentDate: 'asc' },
        take: 5,
      }),
      this.prisma.workFollowUp.findMany({
        where: { userId, status: { in: ['PENDING', 'FOLLOW_UP_TODAY'] } },
        orderBy: { nextFollowUpDate: 'asc' },
        take: 5,
      }),
      this.prisma.workDiary.findMany({
        where: { userId },
        orderBy: { workDate: 'desc' },
        take: 5,
      }),
      this.prisma.personalNote.findMany({
        where: { userId },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
    ]);

    const [completedTasksCount, pendingTasksCount] = await Promise.all([
      this.prisma.workTask.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.workTask.count({ where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    ]);

    return {
      todaysTasks,
      overdueTasks,
      upcomingTasks,
      todaysMeetings,
      upcomingMeetings,
      appointments,
      followUps,
      recentDiary,
      quickNotes,
      summary: {
        completed: completedTasksCount,
        pending: pendingTasksCount,
        overdue: overdueTasks.length,
        scheduledMeetings: todaysMeetings.length + upcomingMeetings.length,
      },
    };
  }

  // ── 3. Task Management & Next Action ─────────────────────────────────────

  async createTask(userId: string, data: {
    title: string;
    description?: string;
    priority?: string;
    startDate?: string;
    dueDate?: string;
    assignedToUserId?: string;
    nextAction?: string;
    nextActionDate?: string;
    relatedModule?: string;
    relatedRecord?: string;
    remarks?: string;
  }) {
    const safeStartDate = parseDateSafe(data.startDate);
    const safeDueDate = parseDateSafe(data.dueDate) || new Date();
    const safeNextActionDate = parseDateSafe(data.nextActionDate);

    return this.prisma.workTask.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        priority: normalizePriority(data.priority),
        startDate: safeStartDate,
        dueDate: safeDueDate,
        status: 'TODO',
        assignedByUserId: userId,
        assignedToUserId: data.assignedToUserId || userId,
        nextAction: data.nextAction,
        nextActionDate: safeNextActionDate,
        relatedModule: data.relatedModule,
        relatedRecord: data.relatedRecord,
        remarks: data.remarks,
      },
    });
  }

  async getTasks(userId: string, status?: string, assignedToMe?: boolean) {
    return this.prisma.workTask.findMany({
      where: {
        ...(assignedToMe ? { assignedToUserId: userId } : { userId }),
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      include: { delegations: true },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });
  }

  async updateTaskStatus(userId: string, taskId: string, status: string, nextAction?: string, nextActionDate?: string) {
    const task = await this.prisma.workTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found.');
    if (task.userId !== userId && task.assignedToUserId !== userId) {
      throw new ForbiddenException('You are not authorized to update this task.');
    }

    const safeNextActionDate = parseDateSafe(nextActionDate);

    return this.prisma.workTask.update({
      where: { id: taskId },
      data: {
        status: status.toUpperCase(),
        ...(status.toUpperCase() === 'COMPLETED' ? { completedAt: new Date() } : {}),
        ...(nextAction ? { nextAction } : {}),
        ...(safeNextActionDate ? { nextActionDate: safeNextActionDate } : {}),
      },
    });
  }

  async delegateTask(userId: string, taskId: string, delegateToUserId: string, dueBy: string, reason?: string) {
    const task = await this.prisma.workTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found.');

    const safeDueBy = parseDateSafe(dueBy) || new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.taskDelegation.create({
        data: {
          taskId,
          delegatedBy: userId,
          delegatedTo: delegateToUserId,
          dueBy: safeDueBy,
          reason,
        },
      });

      return tx.workTask.update({
        where: { id: taskId },
        data: { assignedToUserId: delegateToUserId },
      });
    });
  }

  // ── 4. Meetings & Invitations ──────────────────────────────────────────────

  async createMeeting(userId: string, data: {
    title: string;
    meetingDate: string;
    startTime: string;
    endTime: string;
    location?: string;
    isOnline?: boolean;
    meetingLink?: string;
    agenda?: string;
    participantUserIds?: string[];
  }) {
    const safeMeetingDate = parseDateSafe(data.meetingDate) || new Date();
    return this.prisma.personalMeeting.create({
      data: {
        organizerUserId: userId,
        title: data.title,
        meetingDate: safeMeetingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isOnline: data.isOnline || false,
        meetingLink: data.meetingLink,
        agenda: data.agenda,
        status: 'SCHEDULED',
        participants: {
          create: (data.participantUserIds || []).map((pUserId) => ({
            userId: pUserId,
            rsvp: pUserId === userId ? 'ACCEPTED' : 'PENDING',
          })),
        },
      },
      include: { participants: true },
    });
  }

  async getMeetings(userId: string) {
    return this.prisma.personalMeeting.findMany({
      where: {
        OR: [{ organizerUserId: userId }, { participants: { some: { userId } } }],
      },
      include: { participants: true },
      orderBy: { meetingDate: 'desc' },
    });
  }

  // ── 5. Appointments & Follow-ups ───────────────────────────────────────────

  async createAppointment(userId: string, data: {
    title: string;
    personName: string;
    purpose?: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    location?: string;
    contact?: string;
    notes?: string;
    reminderMinutes?: number;
  }) {
    const safeApptDate = parseDateSafe(data.appointmentDate) || new Date();
    return this.prisma.personalAppointment.create({
      data: {
        userId,
        title: data.title,
        personName: data.personName,
        purpose: data.purpose,
        appointmentDate: safeApptDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        contact: data.contact,
        notes: data.notes,
        reminderMinutes: data.reminderMinutes || 15,
        status: 'SCHEDULED',
      },
    });
  }

  async getAppointments(userId: string) {
    return this.prisma.personalAppointment.findMany({
      where: { userId },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async createFollowUp(userId: string, data: {
    subject: string;
    personName: string;
    relatedModule?: string;
    relatedRecord?: string;
    nextFollowUpDate: string;
    remarks?: string;
  }) {
    const safeNextFollowUpDate = parseDateSafe(data.nextFollowUpDate) || new Date();
    return this.prisma.workFollowUp.create({
      data: {
        userId,
        subject: data.subject,
        personName: data.personName,
        relatedModule: data.relatedModule,
        relatedRecord: data.relatedRecord,
        nextFollowUpDate: safeNextFollowUpDate,
        status: 'PENDING',
        remarks: data.remarks,
      },
    });
  }

  async getFollowUps(userId: string) {
    return this.prisma.workFollowUp.findMany({
      where: { userId },
      orderBy: { nextFollowUpDate: 'asc' },
    });
  }

  // ── 6. Personal Notes ──────────────────────────────────────────────────────

  async createNote(userId: string, data: { title: string; content: string; tags?: string; isPinned?: boolean }) {
    return this.prisma.personalNote.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        tags: data.tags,
        isPinned: data.isPinned || false,
        isPrivate: true,
      },
    });
  }

  async getNotes(userId: string, search?: string) {
    return this.prisma.personalNote.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { tags: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ── 7. Calendar Aggregation ───────────────────────────────────────────────

  async getCalendarItems(userId: string) {
    const [tasks, meetings, appointments, followUps] = await Promise.all([
      this.prisma.workTask.findMany({ where: { userId } }),
      this.prisma.personalMeeting.findMany({
        where: { OR: [{ organizerUserId: userId }, { participants: { some: { userId } } }] },
      }),
      this.prisma.personalAppointment.findMany({ where: { userId } }),
      this.prisma.workFollowUp.findMany({ where: { userId } }),
    ]);

    return {
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, date: t.dueDate, type: 'TASK', status: t.status })),
      meetings: meetings.map((m) => ({ id: m.id, title: m.title, date: m.meetingDate, type: 'MEETING', status: m.status })),
      appointments: appointments.map((a) => ({ id: a.id, title: a.title, date: a.appointmentDate, type: 'APPOINTMENT', status: a.status })),
      followUps: followUps.map((f) => ({ id: f.id, title: f.subject, date: f.nextFollowUpDate, type: 'FOLLOW_UP', status: f.status })),
    };
  }

  // ── 8. Workload & Work Transfer / Delegation Engine ────────────────────────

  async createWorkTransfer(user: any, data: any) {
    const fromUserId = user.id;
    if (fromUserId === data.toUserId) {
      throw new BadRequestException('Cannot transfer workload to oneself.');
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    if (endAt < startAt) {
      throw new BadRequestException('End date cannot be earlier than start date.');
    }

    const now = new Date();
    const isImmediate = startAt <= now && now <= endAt;
    const count = (await (this.prisma as any).workTransfer.count()) + 1;
    const trackingCode = `WTR-${now.getFullYear()}-${String(count).padStart(6, '0')}`;

    const toUser = await this.prisma.user.findUnique({
      where: { id: data.toUserId },
      include: { faculty: { include: { department: true } } },
    });

    const fromUserRecord = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      include: { faculty: { include: { department: true } } },
    });

    const transfer = await (this.prisma as any).workTransfer.create({
      data: {
        trackingCode,
        fromUserId,
        fromUserName: fromUserRecord?.username || user.username || 'Faculty Member',
        fromUserRole: user.role || 'FACULTY',
        fromDepartmentId: fromUserRecord?.faculty?.departmentId,
        fromDepartmentName: fromUserRecord?.faculty?.department?.name,
        fromInstituteId: fromUserRecord?.faculty?.instituteId,
        toUserId: data.toUserId,
        toUserName: toUser?.username || 'Assigned Recipient',
        toUserRole: (toUser as any)?.role || 'FACULTY',
        toDepartmentId: toUser?.faculty?.departmentId,
        toDepartmentName: toUser?.faculty?.department?.name,
        toInstituteId: toUser?.faculty?.instituteId,
        startAt,
        endAt,
        reason: data.reason,
        remarks: data.remarks,
        status: isImmediate ? 'ACTIVE' : 'SCHEDULED',
        workItemIds: data.workItemIds || [],
        workItemTypes: ['STUDENT_REQUEST', 'APPROVAL_REQUEST'],
        totalItemsCount: (data.workItemIds || []).length,
        completedItemIds: [],
        createdBy: user.id,
        createdByName: user.username,
        createdByRole: user.role,
        activatedAt: isImmediate ? now : null,
        auditTrail: [
          {
            timestamp: now.toISOString(),
            actorId: user.id,
            actorName: user.username,
            actorRole: user.role,
            action: 'TRANSFER_CREATED',
            details: `Delegated ${(data.workItemIds || []).length} work items to ${toUser?.username || data.toUserId}`,
          },
        ],
      },
    });

    return transfer;
  }

  async getMyWorkTransfers(userId: string) {
    const [transferredOut, transferredIn] = await Promise.all([
      (this.prisma as any).workTransfer.findMany({
        where: { fromUserId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).workTransfer.findMany({
        where: { toUserId: userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { transferredOut, transferredIn };
  }

  async getAllWorkTransfers(query: any, user: any) {
    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.reason && query.reason !== 'ALL') {
      where.reason = query.reason;
    }
    if (query.departmentId && query.departmentId !== 'ALL') {
      where.OR = [
        { fromDepartmentId: query.departmentId },
        { toDepartmentId: query.departmentId },
      ];
    }
    if (query.search) {
      where.OR = [
        { trackingCode: { contains: query.search, mode: 'insensitive' } },
        { fromUserName: { contains: query.search, mode: 'insensitive' } },
        { toUserName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const transfers = await (this.prisma as any).workTransfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return transfers;
  }

  async revokeWorkTransfer(id: string, user: any) {
    const existing = await (this.prisma as any).workTransfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work transfer not found.');
    if (['EXPIRED', 'REVOKED', 'CANCELLED'].includes(existing.status)) {
      throw new BadRequestException(`Cannot revoke transfer in ${existing.status} status.`);
    }

    const now = new Date();
    const updated = await (this.prisma as any).workTransfer.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: now,
        revokedBy: user.id,
        revokedByName: user.username,
        auditTrail: [
          ...(existing.auditTrail || []),
          {
            timestamp: now.toISOString(),
            actorId: user.id,
            actorName: user.username,
            actorRole: user.role,
            action: 'TRANSFER_REVOKED',
            details: `Work transfer revoked by ${user.username}. Tasks restored to original owner.`,
          },
        ],
      },
    });

    return updated;
  }

  async cancelScheduledTransfer(id: string, user: any) {
    const existing = await (this.prisma as any).workTransfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work transfer not found.');
    if (existing.status !== 'SCHEDULED') {
      throw new BadRequestException('Only SCHEDULED transfers can be cancelled.');
    }

    const now = new Date();
    const updated = await (this.prisma as any).workTransfer.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelledBy: user.id,
        cancelledByName: user.username,
        auditTrail: [
          ...(existing.auditTrail || []),
          {
            timestamp: now.toISOString(),
            actorId: user.id,
            actorName: user.username,
            actorRole: user.role,
            action: 'TRANSFER_CANCELLED',
            details: `Scheduled transfer cancelled by ${user.username}.`,
          },
        ],
      },
    });

    return updated;
  }
}

