import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamAuditService } from './exam-audit.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  ReviewQuestionDto,
  BulkUploadQuestionsDto,
} from './dto/question-bank.dto';

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: ExamAuditService,
  ) {}

  private generateQuestionCode(subjectId: string, count: number): string {
    const year = new Date().getFullYear();
    const subPrefix = subjectId ? subjectId.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'SUB') : 'SUB';
    return `QBK-${year}-${subPrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Stage 10.3A: Faculty Question Create API
   * Implements strict RBAC, subject authorization, DTO validation, duplicate detection,
   * server-enforced DRAFT status, creator ownership, and audit trail logging.
   */
  async createQuestion(
    dto: CreateQuestionDto,
    tenantId: string,
    userId: string,
    userRole: string,
    facultyAllowedSubjects?: string[],
  ) {
    // 1. Role Authorization Check
    const allowedRoles = ['FACULTY', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'TEACHER', 'HEAD_OF_DEPARTMENT'];
    if (!userRole || !allowedRoles.includes(userRole.toUpperCase())) {
      throw new ForbiddenException(`Role '${userRole}' is not permitted to create question bank entries.`);
    }

    // 2. DTO Structural & Semantic Validation
    if (!dto.questionText || dto.questionText.trim().length < 5) {
      throw new BadRequestException('Question text is required and must be at least 5 characters long.');
    }

    if (!dto.subjectId || dto.subjectId.trim().length === 0) {
      throw new BadRequestException('Subject ID is required.');
    }

    if (!dto.marks || Number(dto.marks) <= 0) {
      throw new BadRequestException('Marks allocation must be a positive numeric value.');
    }

    // Validate MCQ / Multiple Select options
    if (dto.questionType === 'MCQ' || dto.questionType === 'MULTIPLE_SELECT') {
      if (!dto.options || !Array.isArray(dto.options) || dto.options.length < 2) {
        throw new BadRequestException('Multiple choice questions require an options array with at least 2 choices.');
      }
      const validOptions = dto.options.filter(o => typeof o === 'string' && o.trim().length > 0);
      if (validOptions.length < 2) {
        throw new BadRequestException('Multiple choice questions must have at least 2 non-empty choices.');
      }
    }

    // 3. Subject Authorization & Scope Verification
    // If facultyAllowedSubjects is passed, or if user is FACULTY, verify permission
    if (userRole.toUpperCase() === 'FACULTY' && facultyAllowedSubjects && facultyAllowedSubjects.length > 0) {
      if (!facultyAllowedSubjects.includes(dto.subjectId)) {
        throw new ForbiddenException(`Faculty is not authorized to create questions for subject '${dto.subjectId}'.`);
      }
    }

    // 4. Duplicate Question Check
    const normalizedText = dto.questionText.trim().toLowerCase();
    const existingQuestions = await this.prisma.questionBank.findMany({
      where: {
        tenantId,
        subjectId: dto.subjectId,
        status: { in: ['DRAFT', 'SUBMITTED_FOR_REVIEW', 'HOD_APPROVED', 'AVAILABLE_FOR_PAPER'] },
      },
    });

    const isDuplicate = existingQuestions.some(
      (eq: any) => eq.questionText.trim().toLowerCase() === normalizedText
    );

    if (isDuplicate) {
      throw new ConflictException(`A duplicate question with identical text already exists for subject '${dto.subjectId}'.`);
    }

    // 5. Code Generation & Server-Enforced DRAFT Status
    const count = await this.prisma.questionBank.count({ where: { tenantId } });
    const questionCode = this.generateQuestionCode(dto.subjectId, count);

    // Status is strictly forced to DRAFT on creation
    const initialStatus = 'DRAFT';

    const question = await this.prisma.questionBank.create({
      data: {
        tenantId,
        questionCode,
        questionText: dto.questionText.trim(),
        questionType: dto.questionType,
        options: dto.options ? JSON.stringify(dto.options) : null,
        correctAnswer: dto.correctAnswer || null,
        explanation: dto.explanation || null,
        marks: Number(dto.marks),
        difficultyLevel: dto.difficultyLevel || 'MEDIUM',
        bloomLevel: dto.bloomLevel || 'UNDERSTAND',
        subjectId: dto.subjectId,
        departmentId: dto.departmentId || 'dept-cse',
        programId: dto.programId || null,
        academicYearId: dto.academicYearId || '2025-26',
        semester: Number(dto.semester) || 1,
        topic: dto.topic || null,
        unit: dto.unit || null,
        attachmentUrl: dto.attachmentUrl || null,
        createdBy: userId,
        status: initialStatus,
      },
    });

    // 6. Audit Trail Logging
    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'QUESTION_CREATED',
      entityType: 'QUESTION',
      entityId: question.id,
      previousStatus: undefined,
      newStatus: question.status,
      metadata: {
        questionCode,
        subjectId: dto.subjectId,
        departmentId: dto.departmentId,
        academicYear: dto.academicYearId || '2025-26',
        marks: dto.marks,
        bloomLevel: dto.bloomLevel,
      },
    });

    return {
      statusCode: 201,
      success: true,
      message: 'Question created successfully in DRAFT status',
      data: {
        id: question.id,
        questionCode: question.questionCode,
        questionText: question.questionText,
        questionType: question.questionType,
        marks: question.marks,
        difficultyLevel: question.difficultyLevel,
        bloomLevel: question.bloomLevel,
        subjectId: question.subjectId,
        departmentId: question.departmentId,
        status: question.status,
        createdBy: question.createdBy,
        createdAt: question.createdAt,
      },
    };
  }

  async listQuestions(
    query: any,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const isStudent = userRole.toUpperCase() === 'STUDENT';
    const isFaculty = userRole.toUpperCase() === 'FACULTY';

    const where: any = { tenantId };

    if (query?.subjectId && query.subjectId !== 'ALL') {
      where.subjectId = query.subjectId;
    }
    if (query?.departmentId && query.departmentId !== 'ALL') {
      where.departmentId = query.departmentId;
    }
    if (query?.difficultyLevel && query.difficultyLevel !== 'ALL') {
      where.difficultyLevel = query.difficultyLevel;
    }
    if (query?.questionType && query.questionType !== 'ALL') {
      where.questionType = query.questionType;
    }
    if (query?.bloomLevel && query.bloomLevel !== 'ALL') {
      where.bloomLevel = query.bloomLevel;
    }

    if (isStudent) {
      where.status = { in: ['HOD_APPROVED', 'AVAILABLE_FOR_PAPER'] };
    } else if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    } else if (isFaculty && query?.myOnly === 'true') {
      where.createdBy = userId;
    }

    const rawList = await this.prisma.questionBank.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (isStudent) {
      return rawList.map((q: any) => ({
        id: q.id,
        questionCode: q.questionCode,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options ? JSON.parse(q.options) : [],
        marks: q.marks,
        difficultyLevel: q.difficultyLevel,
        bloomLevel: q.bloomLevel,
        subjectId: q.subjectId,
        departmentId: q.departmentId,
        status: q.status,
        createdAt: q.createdAt,
      }));
    }

    return rawList.map((q: any) => ({
      ...q,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
    }));
  }

  async getQuestionDetails(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const isStudent = userRole.toUpperCase() === 'STUDENT';

    const question = await this.prisma.questionBank.findFirst({
      where: {
        tenantId,
        OR: [{ id }, { questionCode: id }],
      },
    });

    if (!question) {
      throw new NotFoundException(`Question '${id}' not found in Question Bank.`);
    }

    if (isStudent && question.status !== 'HOD_APPROVED' && question.status !== 'AVAILABLE_FOR_PAPER') {
      throw new ForbiddenException('Question is not available for student viewing.');
    }

    if (isStudent) {
      return {
        id: question.id,
        questionCode: question.questionCode,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options ? JSON.parse(question.options) : [],
        marks: question.marks,
        difficultyLevel: question.difficultyLevel,
        bloomLevel: question.bloomLevel,
        subjectId: question.subjectId,
        departmentId: question.departmentId,
        status: question.status,
        createdAt: question.createdAt,
      };
    }

    const reviews = await this.prisma.questionReview.findMany({
      where: { questionId: question.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...question,
      options: question.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : [],
      reviews,
    };
  }

  async updateQuestion(
    id: string,
    dto: UpdateQuestionDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole.toUpperCase() === 'STUDENT') {
      throw new ForbiddenException('Students cannot modify questions.');
    }

    const question = await this.prisma.questionBank.findFirst({
      where: { tenantId, id },
    });

    if (!question) {
      throw new NotFoundException(`Question '${id}' not found.`);
    }

    if (userRole.toUpperCase() === 'FACULTY' && question.createdBy !== userId) {
      throw new ForbiddenException('Faculty can only modify their own questions.');
    }

    if (userRole.toUpperCase() === 'FACULTY' && question.status === 'HOD_APPROVED') {
      throw new BadRequestException('Cannot edit an approved question directly. Request HOD re-evaluation.');
    }

    const updated = await this.prisma.questionBank.update({
      where: { id },
      data: {
        ...(dto.questionText && { questionText: dto.questionText.trim() }),
        ...(dto.questionType && { questionType: dto.questionType }),
        ...(dto.options && { options: JSON.stringify(dto.options) }),
        ...(dto.correctAnswer !== undefined && { correctAnswer: dto.correctAnswer }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.marks && { marks: Number(dto.marks) }),
        ...(dto.difficultyLevel && { difficultyLevel: dto.difficultyLevel }),
        ...(dto.bloomLevel && { bloomLevel: dto.bloomLevel }),
        ...(dto.topic !== undefined && { topic: dto.topic }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.attachmentUrl !== undefined && { attachmentUrl: dto.attachmentUrl }),
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'UPDATE',
      entityType: 'QUESTION',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return updated;
  }

  async deleteQuestion(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole.toUpperCase() === 'STUDENT') {
      throw new ForbiddenException('Students cannot delete questions.');
    }

    const question = await this.prisma.questionBank.findFirst({
      where: { tenantId, id },
    });

    if (!question) {
      throw new NotFoundException(`Question '${id}' not found.`);
    }

    if (userRole.toUpperCase() === 'FACULTY' && question.createdBy !== userId) {
      throw new ForbiddenException('Faculty can only delete their own draft questions.');
    }

    if (userRole.toUpperCase() === 'FACULTY' && question.status !== 'DRAFT' && question.status !== 'REJECTED') {
      throw new BadRequestException('Faculty can only delete DRAFT or REJECTED questions.');
    }

    const paperUsageCount = await this.prisma.examPaperQuestion.count({
      where: { questionId: id },
    });

    if (paperUsageCount > 0) {
      throw new BadRequestException('Cannot delete a question that is currently assigned to examination papers.');
    }

    await this.prisma.questionBank.delete({ where: { id } });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'DELETE',
      entityType: 'QUESTION',
      entityId: id,
    });

    return { success: true, message: `Question ${id} deleted successfully.` };
  }

  async submitQuestionForReview(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const question = await this.prisma.questionBank.findFirst({
      where: { tenantId, id },
    });

    if (!question) {
      throw new NotFoundException(`Question '${id}' not found.`);
    }

    if (userRole.toUpperCase() === 'FACULTY' && question.createdBy !== userId) {
      throw new ForbiddenException('Faculty can only submit their own questions for review.');
    }

    const updated = await this.prisma.questionBank.update({
      where: { id },
      data: { status: 'SUBMITTED_FOR_REVIEW' },
    });

    await this.prisma.questionReview.create({
      data: {
        tenantId,
        questionId: id,
        reviewerId: userId,
        reviewerRole: userRole,
        action: 'SUBMITTED',
        remarks: 'Question submitted for HOD scrutiny.',
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'SUBMIT',
      entityType: 'QUESTION',
      entityId: id,
      previousStatus: question.status,
      newStatus: 'SUBMITTED_FOR_REVIEW',
    });

    return updated;
  }

  async reviewQuestion(
    id: string,
    dto: ReviewQuestionDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole.toUpperCase() === 'STUDENT' || userRole.toUpperCase() === 'FACULTY') {
      throw new ForbiddenException('Only HOD, Principal, or Examination Cell can review questions.');
    }

    const question = await this.prisma.questionBank.findFirst({
      where: { tenantId, id },
    });

    if (!question) {
      throw new NotFoundException(`Question '${id}' not found.`);
    }

    // Self-approval defense
    if (question.createdBy === userId && userRole.toUpperCase() !== 'SUPER_ADMIN') {
      throw new BadRequestException('Creator cannot self-approve their own question as HOD.');
    }

    const newStatus = dto.decision === 'APPROVED' ? 'HOD_APPROVED' : 'REJECTED';

    const updated = await this.prisma.questionBank.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.prisma.questionReview.create({
      data: {
        tenantId,
        questionId: id,
        reviewerId: userId,
        reviewerRole: userRole,
        action: dto.decision,
        remarks: dto.remarks || `${dto.decision} by ${userRole}`,
      },
    });

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: dto.decision,
      entityType: 'QUESTION',
      entityId: id,
      previousStatus: question.status,
      newStatus,
      metadata: { remarks: dto.remarks },
    });

    return updated;
  }

  /**
   * Bulk Upload Architecture Foundation
   */
  async bulkUploadQuestions(
    dto: BulkUploadQuestionsDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole.toUpperCase() === 'STUDENT') {
      throw new ForbiddenException('Students cannot perform bulk question uploads.');
    }

    const errors: Array<{ row: number; field: string; error: string }> = [];
    const validItems: any[] = [];

    dto.questions.forEach((q, idx) => {
      const rowNum = idx + 1;
      if (!q.questionText || q.questionText.trim().length === 0) {
        errors.push({ row: rowNum, field: 'questionText', error: 'Missing question text.' });
        return;
      }
      if (q.marks && Number(q.marks) <= 0) {
        errors.push({ row: rowNum, field: 'marks', error: 'Marks must be greater than zero.' });
        return;
      }

      validItems.push({
        tenantId,
        questionCode: `QBK-${new Date().getFullYear()}-${dto.subjectId.slice(0, 4).toUpperCase()}-${String(Date.now() + idx).slice(-5)}`,
        questionText: q.questionText.trim(),
        questionType: q.questionType || 'MCQ',
        options: q.options ? JSON.stringify(q.options) : null,
        correctAnswer: q.correctAnswer || null,
        explanation: q.explanation || null,
        marks: Number(q.marks) || 1,
        difficultyLevel: q.difficultyLevel || 'MEDIUM',
        bloomLevel: q.bloomLevel || 'UNDERSTAND',
        subjectId: dto.subjectId,
        departmentId: dto.departmentId || 'dept-cse',
        programId: dto.programId || null,
        academicYearId: dto.academicYearId || '2025-26',
        semester: Number(dto.semester) || 1,
        topic: q.topic || null,
        unit: q.unit || null,
        createdBy: userId,
        status: 'DRAFT',
      });
    });

    const importedQuestions: any[] = [];
    for (const item of validItems) {
      const created = await this.prisma.questionBank.create({ data: item });
      importedQuestions.push(created);
    }

    await this.auditService.logEvent({
      tenantId,
      actorId: userId,
      actorRole: userRole,
      action: 'BULK_IMPORT',
      entityType: 'BULK_UPLOAD',
      entityId: `bulk-${Date.now()}`,
      metadata: {
        importedCount: importedQuestions.length,
        errorCount: errors.length,
        subjectId: dto.subjectId,
      },
    });

    return {
      importedCount: importedQuestions.length,
      errors,
      items: importedQuestions,
    };
  }

  async getQuestionBankMetrics(
    tenantId: string,
    userId: string,
    userRole: string,
  ) {
    const questions = await this.prisma.questionBank.findMany({
      where: { tenantId },
    });

    const diffDist: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
    questions.forEach((q: any) => {
      diffDist[q.difficultyLevel] = (diffDist[q.difficultyLevel] || 0) + 1;
    });

    const bloomDist: Record<string, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    questions.forEach((q: any) => {
      bloomDist[q.bloomLevel] = (bloomDist[q.bloomLevel] || 0) + 1;
    });

    return {
      totalQuestions: questions.length,
      draftQuestions: questions.filter((q: any) => q.status === 'DRAFT').length,
      pendingReviewQuestions: questions.filter((q: any) => q.status === 'SUBMITTED_FOR_REVIEW').length,
      approvedQuestions: questions.filter((q: any) => q.status === 'HOD_APPROVED' || q.status === 'AVAILABLE_FOR_PAPER').length,
      rejectedQuestions: questions.filter((q: any) => q.status === 'REJECTED').length,
      difficultyDistribution: diffDist,
      bloomDistribution: bloomDist,
    };
  }
}
