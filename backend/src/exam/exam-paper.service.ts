import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamAuditService } from './exam-audit.service';
import {
  CreateExamPaperDto,
  UpdateExamPaperDto,
  ReviewExamPaperDto,
} from './dto/question-bank.dto';

@Injectable()
export class ExamPaperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: ExamAuditService,
  ) {}

  private generatePaperCode(subjectId: string, count: number): string {
    const year = new Date().getFullYear();
    const subPrefix = subjectId ? subjectId.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'SUB') : 'SUB';
    return `PPR-${year}-${subPrefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async createExamPaper(
    dto: CreateExamPaperDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot create exam papers.');
    }

    const count = await this.prisma.examPaper.count({ where: { tenantId } });
    const paperCode = this.generatePaperCode(dto.subjectId, count);

    // Validate questions if supplied
    if (dto.questions && dto.questions.length > 0) {
      const questionIds = dto.questions.map(q => q.questionId);
      const approvedQuestions = await this.prisma.questionBank.findMany({
        where: {
          id: { in: questionIds },
          tenantId,
          status: { in: ['HOD_APPROVED', 'AVAILABLE_FOR_PAPER'] },
        },
      });

      if (approvedQuestions.length !== questionIds.length) {
        throw new BadRequestException('Only approved questions can be included in exam papers.');
      }
    }

    const paper = await this.prisma.examPaper.create({
      data: {
        tenantId,
        paperCode,
        title: dto.title,
        subjectId: dto.subjectId,
        departmentId: dto.departmentId,
        programId: dto.programId || null,
        academicYearId: dto.academicYearId || null,
        semester: Number(dto.semester) || 1,
        examType: dto.examType || 'MIDTERM',
        totalMarks: Number(dto.totalMarks) || 100,
        durationMinutes: Number(dto.durationMinutes) || 180,
        instructions: dto.instructions || null,
        createdBy: userId,
        status: 'DRAFT',
      },
    });

    // Create question mappings if supplied
    if (dto.questions && dto.questions.length > 0) {
      await Promise.all(
        dto.questions.map(q =>
          this.prisma.examPaperQuestion.create({
            data: {
              tenantId,
              examPaperId: paper.id,
              questionId: q.questionId,
              section: q.section || 'SECTION_A',
              questionOrder: q.questionOrder,
              marks: Number(q.marks) || 1,
            },
          })
        )
      );
    }

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'CREATE',
      entityType: 'EXAM_PAPER',
      entityId: paper.id,
      newStatus: 'DRAFT',
      metadata: { paperCode, totalMarks: dto.totalMarks },
    });

    return this.getExamPaperDetails(paper.id, tenantId, userId, userRole);
  }

  async updateExamPaper(
    id: string,
    dto: UpdateExamPaperDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot modify exam papers.');
    }

    const paper = await this.prisma.examPaper.findFirst({ where: { id, tenantId } });
    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    if (paper.status === 'HOI_LOCKED' || paper.status === 'PUBLISHED') {
      throw new BadRequestException(`Cannot modify locked or published paper. Paper is currently ${paper.status}.`);
    }

    if (userRole === 'FACULTY' && paper.createdBy !== userId) {
      throw new ForbiddenException('Faculty can only modify their own draft papers.');
    }

    // Update Paper attributes
    const updated = await this.prisma.examPaper.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.totalMarks !== undefined ? { totalMarks: Number(dto.totalMarks) } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: Number(dto.durationMinutes) } : {}),
        ...(dto.instructions !== undefined ? { instructions: dto.instructions } : {}),
      },
    });

    // Update Question mappings if provided
    if (dto.questions !== undefined) {
      // Validate all questions are approved
      if (dto.questions.length > 0) {
        const questionIds = dto.questions.map(q => q.questionId);
        const approvedQuestions = await this.prisma.questionBank.findMany({
          where: {
            id: { in: questionIds },
            tenantId,
            status: { in: ['HOD_APPROVED', 'AVAILABLE_FOR_PAPER'] },
          },
        });
        if (approvedQuestions.length !== questionIds.length) {
          throw new BadRequestException('Only approved questions can be included in exam papers.');
        }
      }

      // Remove existing questions and re-insert
      await this.prisma.examPaperQuestion.deleteMany({ where: { examPaperId: id } });
      if (dto.questions.length > 0) {
        await Promise.all(
          dto.questions.map(q =>
            this.prisma.examPaperQuestion.create({
              data: {
                tenantId,
                examPaperId: id,
                questionId: q.questionId,
                section: q.section || 'SECTION_A',
                questionOrder: q.questionOrder,
                marks: Number(q.marks) || 1,
              },
            })
          )
        );
      }
    }

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'UPDATE',
      entityType: 'EXAM_PAPER',
      entityId: id,
      previousStatus: paper.status,
      newStatus: updated.status,
    });

    return this.getExamPaperDetails(id, tenantId, userId, userRole);
  }

  async deleteExamPaper(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot delete exam papers.');
    }

    const paper = await this.prisma.examPaper.findFirst({ where: { id, tenantId } });
    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    if (paper.status === 'HOI_LOCKED' || paper.status === 'PUBLISHED') {
      throw new BadRequestException(`Cannot delete locked or published paper.`);
    }

    if (userRole === 'FACULTY' && paper.createdBy !== userId) {
      throw new ForbiddenException('Faculty can only delete their own draft papers.');
    }

    await this.prisma.examPaper.delete({ where: { id } });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'DELETE',
      entityType: 'EXAM_PAPER',
      entityId: id,
      previousStatus: paper.status,
    });

    return { success: true, message: `Exam Paper ${id} deleted successfully.` };
  }

  async submitPaperForHOD(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const paper = await this.prisma.examPaper.findFirst({
      where: { id, tenantId },
      include: { questions: true },
    });
    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    if (userRole === 'FACULTY' && paper.createdBy !== userId) {
      throw new ForbiddenException('Faculty can only submit their own papers.');
    }

    if (paper.questions.length === 0) {
      throw new BadRequestException('Cannot submit empty exam paper without questions.');
    }

    const updated = await this.prisma.examPaper.update({
      where: { id },
      data: { status: 'SUBMITTED_FOR_HOD' },
    });

    await this.prisma.examPaperReview.create({
      data: {
        tenantId,
        examPaperId: id,
        reviewerId: userId,
        reviewerRole: userRole,
        action: 'SUBMITTED_FOR_HOD',
        remarks: 'Exam paper submitted for HOD review.',
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'SUBMIT_HOD',
      entityType: 'EXAM_PAPER',
      entityId: id,
      previousStatus: paper.status,
      newStatus: 'SUBMITTED_FOR_HOD',
    });

    return updated;
  }

  async reviewPaperByHOD(
    id: string,
    dto: ReviewExamPaperDto,
    tenantId: string,
    reviewerId: string,
    reviewerRole: string,
  ) {
    if (reviewerRole === 'STUDENT' || reviewerRole === 'FACULTY') {
      throw new ForbiddenException('Only HOD or higher authority can review exam papers at HOD stage.');
    }

    const paper = await this.prisma.examPaper.findFirst({ where: { id, tenantId } });
    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    if (paper.createdBy === reviewerId && reviewerRole !== 'SUPER_ADMIN') {
      throw new BadRequestException('Creator cannot approve their own exam paper as HOD.');
    }

    const isApprove = dto.action === 'HOD_APPROVED';
    const newStatus = isApprove ? 'HOD_APPROVED' : 'HOD_REJECTED';

    const updated = await this.prisma.examPaper.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.prisma.examPaperReview.create({
      data: {
        tenantId,
        examPaperId: id,
        reviewerId,
        reviewerRole,
        action: dto.action,
        remarks: dto.remarks || null,
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: reviewerId,
      actorRole: reviewerRole,
      action: dto.action,
      entityType: 'EXAM_PAPER',
      entityId: id,
      previousStatus: paper.status,
      newStatus,
      metadata: { remarks: dto.remarks },
    });

    return updated;
  }

  async submitPaperForHOI(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const paper = await this.prisma.examPaper.findFirst({ where: { id, tenantId } });
    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    if (paper.status !== 'HOD_APPROVED') {
      throw new BadRequestException('Paper must be HOD_APPROVED before submitting to HOI.');
    }

    const updated = await this.prisma.examPaper.update({
      where: { id },
      data: { status: 'SUBMITTED_FOR_HOI' },
    });

    await this.prisma.examPaperReview.create({
      data: {
        tenantId,
        examPaperId: id,
        reviewerId: userId,
        reviewerRole: userRole,
        action: 'SUBMITTED_FOR_HOI',
        remarks: 'Exam paper escalated to HOI for final locking.',
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'SUBMIT_HOI',
      entityType: 'EXAM_PAPER',
      entityId: id,
      previousStatus: paper.status,
      newStatus: 'SUBMITTED_FOR_HOI',
    });

    return updated;
  }

  async reviewPaperByHOI(
    id: string,
    dto: ReviewExamPaperDto,
    tenantId: string,
    reviewerId: string,
    reviewerRole: string,
  ) {
    if (reviewerRole === 'STUDENT' || reviewerRole === 'FACULTY' || reviewerRole === 'HOD') {
      throw new ForbiddenException('Only HOI, Principal or Super Admin can lock and publish exam papers.');
    }

    const paper = await this.prisma.examPaper.findFirst({ where: { id, tenantId } });
    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    let newStatus = dto.action;
    const updateData: any = { status: newStatus };

    if (dto.action === 'HOI_LOCKED') {
      updateData.lockedAt = new Date();
    } else if (dto.action === 'PUBLISHED') {
      updateData.publishedAt = new Date();
      if (!paper.lockedAt) updateData.lockedAt = new Date();
    }

    const updated = await this.prisma.examPaper.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.examPaperReview.create({
      data: {
        tenantId,
        examPaperId: id,
        reviewerId,
        reviewerRole,
        action: dto.action,
        remarks: dto.remarks || null,
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: reviewerId,
      actorRole: reviewerRole,
      action: dto.action,
      entityType: 'EXAM_PAPER',
      entityId: id,
      previousStatus: paper.status,
      newStatus,
      metadata: { remarks: dto.remarks },
    });

    return updated;
  }

  async listExamPapers(
    filters: any = {},
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const isStudent = userRole === 'STUDENT';
    const isFaculty = userRole === 'FACULTY' || userRole === 'TEACHER';

    const where: any = {
      tenantId,
      ...(filters.subjectId && filters.subjectId !== 'ALL' ? { subjectId: filters.subjectId } : {}),
      ...(filters.departmentId && filters.departmentId !== 'ALL' ? { departmentId: filters.departmentId } : {}),
      ...(filters.examType && filters.examType !== 'ALL' ? { examType: filters.examType } : {}),
    };

    if (isStudent) {
      // Students can ONLY view PUBLISHED papers
      where.status = 'PUBLISHED';
    } else if (isFaculty) {
      if (filters.myOnly === 'true') {
        where.createdBy = userId;
      }
      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status;
      }
    } else if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { paperCode: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const papers = await this.prisma.examPaper.findMany({
      where,
      include: {
        questions: {
          include: { question: true },
          orderBy: { questionOrder: 'asc' },
        },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (isStudent) {
      return papers.map(p => ({
        ...p,
        reviews: [],
        questions: p.questions.map(q => ({
          ...q,
          question: {
            ...q.question,
            correctAnswer: undefined,
            explanation: undefined,
          },
        })),
      }));
    }

    return papers;
  }

  async getExamPaperDetails(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const paper = await this.prisma.examPaper.findFirst({
      where: { OR: [{ id }, { paperCode: id }], tenantId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { questionOrder: 'asc' },
        },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!paper) throw new NotFoundException(`Exam Paper ${id} not found.`);

    if (userRole === 'STUDENT') {
      if (paper.status !== 'PUBLISHED') {
        throw new ForbiddenException('Exam Paper is not published for student access.');
      }
      return {
        ...paper,
        reviews: [],
        questions: paper.questions.map(q => ({
          ...q,
          question: {
            ...q.question,
            correctAnswer: undefined,
            explanation: undefined,
          },
        })),
      };
    }

    return paper;
  }

  async getPaperMetrics(tenantId: string, userId: string, userRole: string) {
    const allPapers = await this.prisma.examPaper.findMany({ where: { tenantId } });

    return {
      success: true,
      totalPapers: allPapers.length,
      draftPapers: allPapers.filter(p => p.status === 'DRAFT').length,
      pendingHOD: allPapers.filter(p => p.status === 'SUBMITTED_FOR_HOD').length,
      hodApproved: allPapers.filter(p => p.status === 'HOD_APPROVED').length,
      pendingHOI: allPapers.filter(p => p.status === 'SUBMITTED_FOR_HOI').length,
      hoiLocked: allPapers.filter(p => p.status === 'HOI_LOCKED').length,
      publishedPapers: allPapers.filter(p => p.status === 'PUBLISHED').length,
      rejectedPapers: allPapers.filter(p => p.status === 'HOD_REJECTED' || p.status === 'HOI_REJECTED').length,
      facultyMetrics: {
        myPapers: allPapers.filter(p => p.createdBy === userId).length,
        myDrafts: allPapers.filter(p => p.createdBy === userId && p.status === 'DRAFT').length,
        myPending: allPapers.filter(p => p.createdBy === userId && p.status === 'SUBMITTED_FOR_HOD').length,
        myApproved: allPapers.filter(p => p.createdBy === userId && (p.status === 'HOD_APPROVED' || p.status === 'HOI_LOCKED' || p.status === 'PUBLISHED')).length,
      },
    };
  }
}
