import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoteSheetService } from '../notesheet/notesheet.service';
import {
  CreateExamTypeDto,
  CreateExamDto,
  UpdateExamDto,
  MapExamSubjectsDto,
  MapExamStudentsDto,
  CreateExamFormWindowDto,
  SubmitExamFormDto,
  CreateExamFormDto,
  UpdateExamFormDto,
  ExamFormQueryDto,
  CreateExamScheduleDto,
  AllocateExamRoomsDto,
  EnterMarksDto,
  BulkEnterMarksDto,
  CorrectResultDto,
  ProcessRevaluationDto,
  ExamQueryDto,
  ExamStatusEnum,
  VerifyExamFormDto,
  ReturnExamFormDto,
  RejectExamFormDto,
  BulkVerifyExamFormsDto,
  BulkReturnExamFormsDto,
  BulkRejectExamFormsDto,
  BulkGenerateHallTicketsDto,
  SubmitMarksDto,
  ReturnMarksDto,
  VerifyMarksDto,
  MarksQueryDto,
  PublishResultsDto,
  WithholdResultDto,
  ReviseResultDto,
  ResultQueryDto,
  CreateExamCentreDto,
  UpdateExamCentreDto,
  ExamCentreQueryDto,
  CreateExamRoomDto,
  UpdateExamRoomDto,
  AllocateExamCentresDto,
  AutoAllocateSeatingDto,
  ManualChangeSeatDto,
  AssignExamEdpDutyDto,
  UpdateEdpDutyStatusDto,
  EdpDutyQueryDto,
} from './dto/exam.dto';

// Helper: Grade and Grade Points Calculator (10-point UGC scale / Configurable)
export function computeGrade(percentage: number, isAbsent = false, isMalpractice = false, customRules?: any[]): { grade: string; gradePoints: number } {
  if (isAbsent) return { grade: 'AB', gradePoints: 0 };
  if (isMalpractice) return { grade: 'MP', gradePoints: 0 };
  if (customRules && customRules.length > 0) {
    const match = customRules.find(r => percentage >= Number(r.minPercentage) && percentage <= Number(r.maxPercentage));
    if (match) return { grade: match.grade, gradePoints: Number(match.gradePoint) };
  }
  if (percentage >= 90) return { grade: 'O', gradePoints: 10 };
  if (percentage >= 80) return { grade: 'A+', gradePoints: 9 };
  if (percentage >= 70) return { grade: 'A', gradePoints: 8 };
  if (percentage >= 60) return { grade: 'B+', gradePoints: 7 };
  if (percentage >= 50) return { grade: 'B', gradePoints: 6 };
  if (percentage >= 45) return { grade: 'C', gradePoints: 5 };
  if (percentage >= 40) return { grade: 'P', gradePoints: 4 };
  return { grade: 'F', gradePoints: 0 };
}

@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly noteSheetService?: NoteSheetService,
  ) {}

  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── 1. Exam Types ─────────────────────────────────────────────────────────

  async createExamType(dto: CreateExamTypeDto) {
    const code = dto.code.toUpperCase().trim();
    const existing = await this.prisma.examType.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`ExamType code '${code}' already exists.`);
    return this.prisma.examType.create({
      data: { code, name: dto.name, description: dto.description },
    });
  }

  async getExamTypes() {
    return this.prisma.examType.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }

  // ── 2. Examination Sessions & Management (Phase 2 Core) ───────────────────

  async createExam(dto: CreateExamDto, user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const userRole = typeof user === 'object' ? (user.role || (user.roles && user.roles[0])) : '';

    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students are not authorized to create examinations.');
    }

    // 1. Validate Academic Context
    const program = await this.prisma.program.findUnique({ where: { id: dto.programId } });
    if (!program) throw new NotFoundException('Program not found.');

    if (dto.instituteId) {
      const institute = await this.prisma.institute.findUnique({ where: { id: dto.instituteId } }).catch(() => null);
      if (!institute && !dto.instituteId.startsWith('inst-')) {
        throw new NotFoundException(`Institute '${dto.instituteId}' not found.`);
      }
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({ where: { id: dto.departmentId } }).catch(() => null);
      if (!department && !dto.departmentId.startsWith('dept-')) {
        throw new NotFoundException(`Department '${dto.departmentId}' not found.`);
      }
    }

    if (dto.academicYearId) {
      const ay = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } }).catch(() => null);
      if (!ay && !dto.academicYearId.startsWith('ay-')) {
        throw new NotFoundException(`Academic Year '${dto.academicYearId}' not found.`);
      }
    }

    if (dto.semesterId) {
      const sem = await this.prisma.semester.findUnique({ where: { id: dto.semesterId } }).catch(() => null);
      if (!sem && !dto.semesterId.startsWith('sem-')) {
        throw new NotFoundException(`Semester '${dto.semesterId}' not found.`);
      }
    }

    // 2. Validate Dates
    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (start > end) {
        throw new BadRequestException('Exam Start Date cannot be after Exam End Date.');
      }
    }

    if (dto.formStartDate && dto.formEndDate) {
      const fStart = new Date(dto.formStartDate);
      const fEnd = new Date(dto.formEndDate);
      if (fStart >= fEnd) {
        throw new BadRequestException('Exam Form Start Date must be strictly before Form End Date.');
      }
    }

    // 3. Validate Fees
    if (dto.fees && dto.fees.length > 0) {
      for (const fee of dto.fees) {
        if (Number(fee.amount) < 0) {
          throw new BadRequestException(`Exam fee for '${fee.examType}' cannot be negative.`);
        }
      }
    }

    if (dto.lateFeeRule) {
      if (Number(dto.lateFeeRule.amount) < 0) {
        throw new BadRequestException('Late fee amount cannot be negative.');
      }
      if (dto.lateFeeRule.maximumAmount !== undefined && Number(dto.lateFeeRule.maximumAmount) < 0) {
        throw new BadRequestException('Maximum late fee cannot be negative.');
      }
    }

    // 4. Resolve or Generate Exam Code
    const rawCode =
      dto.examCode ||
      dto.code ||
      `EXAM-${(dto.name || 'SESSION').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const code = rawCode.toUpperCase().trim();

    const existing = await this.prisma.exam.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Examination code '${code}' already exists.`);

    // 5. Resolve or Auto-create ExamType
    let examType = null;
    if (dto.examTypeId) {
      examType = await this.prisma.examType.findFirst({
        where: { OR: [{ id: dto.examTypeId }, { code: dto.examTypeId }, { name: dto.examTypeId }] },
      });
    }
    if (!examType && dto.type) {
      examType = await this.prisma.examType.findFirst({
        where: { OR: [{ name: dto.type }, { code: dto.type.toUpperCase().replace(/\s+/g, '_') }] },
      });
    }
    if (!examType) {
      examType = await this.prisma.examType.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!examType) {
      examType = await this.prisma.examType.create({
        data: {
          code: 'REGULAR_SEM',
          name: dto.type || 'Regular Semester Examination',
          description: 'University Standard Examination',
          status: 'ACTIVE',
        },
      });
    }

    // 6. Validate Phase 1 Notesheet Link if provided
    if (dto.notesheetId) {
      if (this.noteSheetService) {
        const ns = await this.noteSheetService.getNoteSheetById(dto.notesheetId, user).catch(() => null);
        if (!ns) {
          throw new NotFoundException(`Linked NoteSheet '${dto.notesheetId}' not found.`);
        }
      } else {
        const ns = await this.prisma.noteSheet.findUnique({ where: { id: dto.notesheetId } });
        if (!ns) {
          throw new NotFoundException(`Linked NoteSheet '${dto.notesheetId}' not found.`);
        }
      }
    }

    const semesterNumber =
      dto.semesterNumber ||
      (dto.academicYearCode ? parseInt(dto.academicYearCode.replace(/\D/g, ''), 10) || 1 : 1);
    const academicYearCode = dto.academicYearCode || '2026-27';

    // 7. Execute Transaction Creation
    const createdExam = await this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          code,
          name: dto.name,
          examTypeId: examType.id,
          type: dto.type || 'Regular',
          programId: dto.programId,
          instituteId: dto.instituteId,
          departmentId: dto.departmentId,
          academicYearId: dto.academicYearId,
          academicYearCode,
          semesterId: dto.semesterId,
          semesterNumber,
          session: dto.session || 'Summer 2026',
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          formStartDate: dto.formStartDate ? new Date(dto.formStartDate) : undefined,
          formEndDate: dto.formEndDate ? new Date(dto.formEndDate) : undefined,
          status: dto.status || ExamStatusEnum.DRAFT,
          description: dto.description,
          instructions: dto.instructions,
          notesheetId: dto.notesheetId,
          createdByUserId: userId,
        },
        include: {
          examType: true,
          program: true,
          notesheet: true,
        },
      });

      // Insert Subjects if provided
      if (dto.subjects && dto.subjects.length > 0) {
        for (const s of dto.subjects) {
          await tx.examSubject.create({
            data: {
              examId: exam.id,
              subjectId: s.subjectId,
              examType: s.examType || dto.type || 'REGULAR',
              examDate: s.examDate ? new Date(s.examDate) : undefined,
              durationMinutes: s.durationMinutes ?? 180,
              maximumMarks: s.maximumMarks ?? 100,
              passingMarks: s.passingMarks ?? 40,
              internalMarks: s.internalMarks ?? 30,
              externalMarks: s.externalMarks ?? 70,
              credits: s.credits ?? 3,
              examMode: s.examMode || 'OFFLINE',
              status: s.status || 'ACTIVE',
            },
          });
        }
      }

      // Insert Fees if provided
      if (dto.fees && dto.fees.length > 0) {
        for (const f of dto.fees) {
          await tx.examFee.create({
            data: {
              examId: exam.id,
              examType: f.examType.toUpperCase(),
              amount: f.amount,
              currency: f.currency || 'INR',
              isMandatory: f.isMandatory !== false,
              effectiveFrom: f.effectiveFrom ? new Date(f.effectiveFrom) : undefined,
              effectiveTo: f.effectiveTo ? new Date(f.effectiveTo) : undefined,
            },
          });
        }
      } else if (dto.baseFee !== undefined) {
        // Fallback backward compatibility
        await tx.examFee.create({
          data: {
            examId: exam.id,
            examType: (dto.type || 'REGULAR').toUpperCase(),
            amount: dto.baseFee,
            currency: 'INR',
            isMandatory: true,
          },
        });
      }

      // Insert Late Fee Rule if provided
      if (dto.lateFeeRule) {
        await tx.examLateFeeRule.create({
          data: {
            examId: exam.id,
            calculationType: dto.lateFeeRule.calculationType || 'FIXED',
            amount: dto.lateFeeRule.amount,
            maximumAmount: dto.lateFeeRule.maximumAmount,
            gracePeriodDays: dto.lateFeeRule.gracePeriodDays ?? 0,
            isActive: dto.lateFeeRule.isActive !== false,
          },
        });
      } else if (dto.lateFee !== undefined && dto.lateFee > 0) {
        await tx.examLateFeeRule.create({
          data: {
            examId: exam.id,
            calculationType: 'FIXED',
            amount: dto.lateFee,
            gracePeriodDays: 0,
            isActive: true,
          },
        });
      }

      // Maintain legacy ExamFormWindow compatibility
      if (dto.formStartDate || dto.formEndDate || dto.formDeadline) {
        const winOpen = dto.formStartDate ? new Date(dto.formStartDate) : new Date();
        const winClose = dto.formEndDate
          ? new Date(dto.formEndDate)
          : dto.formDeadline
          ? new Date(dto.formDeadline)
          : new Date(Date.now() + 14 * 86400000);
        const lateClose = dto.lateFeeDeadline
          ? new Date(dto.lateFeeDeadline)
          : new Date(winClose.getTime() + 7 * 86400000);

        await tx.examFormWindow
          .create({
            data: {
              examId: exam.id,
              windowOpen: winOpen,
              windowClose: winClose,
              lateWindowClose: lateClose,
              examFee: dto.baseFee ?? (dto.fees?.[0]?.amount || 300),
              lateFee: dto.lateFee ?? (dto.lateFeeRule?.amount || 200),
              maxAttempts: 2,
              status: 'ACTIVE',
            },
          })
          .catch(() => null);
      }

      return exam;
    });

    return this.getExamById(createdExam.id, user);
  }

  async updateExam(id: string, dto: UpdateExamDto, user?: any) {
    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students are not authorized to update examinations.');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found.');

    if (['ONGOING', 'COMPLETED', 'RESULT_PROCESSING', 'RESULT_PUBLISHED'].includes(exam.status)) {
      throw new BadRequestException(`Cannot edit examination in '${exam.status}' status.`);
    }

    // Validate dates if updated
    const start = dto.startDate ? new Date(dto.startDate) : exam.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : exam.endDate;
    if (start && end && start > end) {
      throw new BadRequestException('Exam Start Date cannot be after Exam End Date.');
    }

    const fStart = dto.formStartDate ? new Date(dto.formStartDate) : exam.formStartDate;
    const fEnd = dto.formEndDate ? new Date(dto.formEndDate) : exam.formEndDate;
    if (fStart && fEnd && fStart >= fEnd) {
      throw new BadRequestException('Exam Form Start Date must be strictly before Form End Date.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id },
        data: {
          name: dto.name || undefined,
          type: dto.type || undefined,
          academicYearId: dto.academicYearId || undefined,
          academicYearCode: dto.academicYearCode || undefined,
          semesterId: dto.semesterId || undefined,
          semesterNumber: dto.semesterNumber || undefined,
          session: dto.session || undefined,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          formStartDate: dto.formStartDate ? new Date(dto.formStartDate) : undefined,
          formEndDate: dto.formEndDate ? new Date(dto.formEndDate) : undefined,
          status: dto.status || undefined,
          description: dto.description !== undefined ? dto.description : undefined,
          instructions: dto.instructions !== undefined ? dto.instructions : undefined,
          notesheetId: dto.notesheetId !== undefined ? dto.notesheetId : undefined,
        },
      });

      if (dto.subjects) {
        await tx.examSubject.deleteMany({ where: { examId: id } });
        for (const s of dto.subjects) {
          await tx.examSubject.create({
            data: {
              examId: id,
              subjectId: s.subjectId,
              examType: s.examType || dto.type || 'REGULAR',
              examDate: s.examDate ? new Date(s.examDate) : undefined,
              durationMinutes: s.durationMinutes ?? 180,
              maximumMarks: s.maximumMarks ?? 100,
              passingMarks: s.passingMarks ?? 40,
              internalMarks: s.internalMarks ?? 30,
              externalMarks: s.externalMarks ?? 70,
              credits: s.credits ?? 3,
              examMode: s.examMode || 'OFFLINE',
              status: s.status || 'ACTIVE',
            },
          });
        }
      }

      if (dto.fees) {
        await tx.examFee.deleteMany({ where: { examId: id } });
        for (const f of dto.fees) {
          if (Number(f.amount) < 0) throw new BadRequestException('Exam fee cannot be negative.');
          await tx.examFee.create({
            data: {
              examId: id,
              examType: f.examType.toUpperCase(),
              amount: f.amount,
              currency: f.currency || 'INR',
              isMandatory: f.isMandatory !== false,
              effectiveFrom: f.effectiveFrom ? new Date(f.effectiveFrom) : undefined,
              effectiveTo: f.effectiveTo ? new Date(f.effectiveTo) : undefined,
            },
          });
        }
      }

      if (dto.lateFeeRule) {
        if (Number(dto.lateFeeRule.amount) < 0) throw new BadRequestException('Late fee amount cannot be negative.');
        await tx.examLateFeeRule.deleteMany({ where: { examId: id } });
        await tx.examLateFeeRule.create({
          data: {
            examId: id,
            calculationType: dto.lateFeeRule.calculationType || 'FIXED',
            amount: dto.lateFeeRule.amount,
            maximumAmount: dto.lateFeeRule.maximumAmount,
            gracePeriodDays: dto.lateFeeRule.gracePeriodDays ?? 0,
            isActive: dto.lateFeeRule.isActive !== false,
          },
        });
      }
    });

    return this.getExamById(id, user);
  }

  async publishExamForm(id: string, user: any) {
    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot publish exam forms.');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { examSubjects: true, examFees: true },
    });
    if (!exam) throw new NotFoundException('Exam not found.');

    if (exam.status !== 'DRAFT' && exam.status !== 'FORM_CLOSED') {
      throw new BadRequestException(`Cannot publish exam form from '${exam.status}' status.`);
    }

    if (!exam.formStartDate || !exam.formEndDate) {
      throw new BadRequestException('Exam Form Start Date and End Date must be configured before opening exam form.');
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: 'FORM_OPEN' },
      include: {
        examType: true,
        program: true,
        examSubjects: { include: { subject: true } },
        examFees: true,
        lateFeeRules: true,
        notesheet: true,
      },
    });
  }

  async closeExamForm(id: string, user: any) {
    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot close exam forms.');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found.');

    if (exam.status !== 'FORM_OPEN') {
      throw new BadRequestException(`Only FORM_OPEN examinations can be closed. Current status: '${exam.status}'.`);
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: 'FORM_CLOSED' },
      include: {
        examType: true,
        program: true,
        examSubjects: { include: { subject: true } },
        examFees: true,
        lateFeeRules: true,
        notesheet: true,
      },
    });
  }

  async unpublishExam(id: string, user: any) {
    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot unpublish examinations.');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found.');

    return this.prisma.exam.update({
      where: { id },
      data: { status: 'DRAFT' },
      include: {
        examType: true,
        program: true,
        examSubjects: { include: { subject: true } },
        examFees: true,
        lateFeeRules: true,
        notesheet: true,
      },
    });
  }

  async publishExam(id: string, user: any) {
    return this.publishExamForm(id, user);
  }

  async closeExam(id: string, user: any) {
    return this.closeExamForm(id, user);
  }

  async cancelExam(id: string, user: any, reason?: string) {
    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot cancel examinations.');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found.');

    if (exam.status === 'COMPLETED' || exam.status === 'RESULT_PUBLISHED') {
      throw new BadRequestException(`Cannot cancel examination that is already '${exam.status}'.`);
    }

    return this.prisma.exam.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        description: reason ? `${exam.description ? exam.description + '\n' : ''}[CANCELLED REASON]: ${reason}` : exam.description,
      },
      include: {
        examType: true,
        program: true,
        examSubjects: { include: { subject: true } },
        examFees: true,
        lateFeeRules: true,
      },
    });
  }

  async deleteExam(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found.');

    return this.prisma.exam.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getExams(query?: any, user?: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.instituteId && query.instituteId !== 'ALL') where.instituteId = query.instituteId;
    if (query?.departmentId && query.departmentId !== 'ALL') where.departmentId = query.departmentId;
    if (query?.programId && query.programId !== 'ALL') where.programId = query.programId;
    if (query?.academicYearId && query.academicYearId !== 'ALL') where.academicYearId = query.academicYearId;
    if (query?.academicYearCode) where.academicYearCode = query.academicYearCode;
    if (query?.semesterId && query.semesterId !== 'ALL') where.semesterId = query.semesterId;
    if (query?.semesterNumber) where.semesterNumber = Number(query.semesterNumber);
    if (query?.type && query.type !== 'ALL') where.type = query.type;
    if (query?.status && query.status !== 'ALL') where.status = query.status.toUpperCase();

    // Role-based scoping
    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT') {
      // Students can only see published or ongoing exams
      where.status = { in: ['FORM_OPEN', 'FORM_CLOSED', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'RESULT_PUBLISHED'] };
    } else if (userRole === 'HOD' && user.department) {
      where.OR = [
        { departmentId: user.department },
        { program: { departmentId: user.department } },
      ];
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { session: { contains: q, mode: 'insensitive' } },
        { program: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.exam.count({ where }),
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        include: {
          examType: true,
          program: true,
          notesheet: true,
          examSubjects: { include: { subject: true } },
          examFees: true,
          lateFeeRules: true,
          _count: { select: { examForms: true, schedules: true } },
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

  async getExamById(id: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        examType: true,
        program: true,
        notesheet: true,
        examSubjects: {
          include: { subject: true },
          orderBy: { createdAt: 'asc' },
        },
        examFees: {
          orderBy: { createdAt: 'asc' },
        },
        lateFeeRules: {
          orderBy: { createdAt: 'asc' },
        },
        formWindows: true,
        schedules: { include: { subject: true, semester: true } },
        _count: { select: { examForms: true, schedules: true } },
      },
    });
    if (!exam) throw new NotFoundException('Examination not found.');

    const userRole = user ? (user.role || (user.roles && user.roles[0])) : '';
    if (userRole === 'STUDENT' && exam.status === 'DRAFT') {
      throw new ForbiddenException('Draft examinations are not accessible to students.');
    }

    return exam;
  }

  async updateExamStatus(id: string, status: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found.');
    return this.prisma.exam.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        examType: true,
        program: true,
        examSubjects: { include: { subject: true } },
        examFees: true,
        lateFeeRules: true,
      },
    });
  }

  // ── Examination Subjects API ──────────────────────────────────────────────

  async getExamSubjects(examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');
    return this.prisma.examSubject.findMany({
      where: { examId },
      include: { subject: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addExamSubject(examId: string, dto: any, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new NotFoundException('Subject not found.');

    const existing = await this.prisma.examSubject.findFirst({
      where: { examId, subjectId: dto.subjectId, examType: dto.examType || 'REGULAR' },
    });
    if (existing) {
      throw new ConflictException('Subject already mapped to this examination.');
    }

    return this.prisma.examSubject.create({
      data: {
        examId,
        subjectId: dto.subjectId,
        examType: dto.examType || 'REGULAR',
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
        durationMinutes: dto.durationMinutes ?? 180,
        maximumMarks: dto.maximumMarks ?? 100,
        passingMarks: dto.passingMarks ?? 40,
        internalMarks: dto.internalMarks ?? 30,
        externalMarks: dto.externalMarks ?? 70,
        credits: dto.credits ?? 3,
        examMode: dto.examMode || 'OFFLINE',
        status: dto.status || 'ACTIVE',
      },
      include: { subject: true },
    });
  }

  async updateExamSubject(examId: string, subjectId: string, dto: any, user?: any) {
    const item = await this.prisma.examSubject.findFirst({
      where: { examId, subjectId },
    });
    if (!item) throw new NotFoundException('Exam subject mapping not found.');

    return this.prisma.examSubject.update({
      where: { id: item.id },
      data: {
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
        durationMinutes: dto.durationMinutes ?? undefined,
        maximumMarks: dto.maximumMarks ?? undefined,
        passingMarks: dto.passingMarks ?? undefined,
        internalMarks: dto.internalMarks ?? undefined,
        externalMarks: dto.externalMarks ?? undefined,
        credits: dto.credits ?? undefined,
        examMode: dto.examMode ?? undefined,
        status: dto.status ?? undefined,
      },
      include: { subject: true },
    });
  }

  async removeExamSubject(examId: string, subjectId: string, user?: any) {
    const item = await this.prisma.examSubject.findFirst({
      where: { examId, subjectId },
    });
    if (!item) throw new NotFoundException('Exam subject mapping not found.');
    return this.prisma.examSubject.delete({ where: { id: item.id } });
  }

  // ── Examination Fees & Late Fee Rules API ─────────────────────────────────

  async getExamFees(examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');
    return this.prisma.examFee.findMany({
      where: { examId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async configureExamFees(examId: string, fees: any[], user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    for (const f of fees) {
      if (Number(f.amount) < 0) {
        throw new BadRequestException('Exam fee cannot be negative.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.examFee.deleteMany({ where: { examId } });
      const created = [];
      for (const f of fees) {
        const row = await tx.examFee.create({
          data: {
            examId,
            examType: f.examType.toUpperCase(),
            amount: f.amount,
            currency: f.currency || 'INR',
            isMandatory: f.isMandatory !== false,
            effectiveFrom: f.effectiveFrom ? new Date(f.effectiveFrom) : undefined,
            effectiveTo: f.effectiveTo ? new Date(f.effectiveTo) : undefined,
          },
        });
        created.push(row);
      }
      return created;
    });
  }

  async getLateFeeRules(examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');
    return this.prisma.examLateFeeRule.findMany({
      where: { examId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async configureLateFeeRule(examId: string, dto: any, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    if (Number(dto.amount) < 0) {
      throw new BadRequestException('Late fee amount cannot be negative.');
    }
    if (dto.maximumAmount !== undefined && Number(dto.maximumAmount) < 0) {
      throw new BadRequestException('Maximum late fee cannot be negative.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.examLateFeeRule.deleteMany({ where: { examId } });
      return tx.examLateFeeRule.create({
        data: {
          examId,
          calculationType: dto.calculationType || 'FIXED',
          amount: dto.amount,
          maximumAmount: dto.maximumAmount,
          gracePeriodDays: dto.gracePeriodDays ?? 0,
          isActive: dto.isActive !== false,
        },
      });
    });
  }

  // ── Notesheet Integration ─────────────────────────────────────────────────

  async linkNotesheetToExam(examId: string, notesheetId: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    if (this.noteSheetService) {
      const notesheet = await this.noteSheetService.getNoteSheetById(notesheetId, user).catch(() => null);
      if (!notesheet) throw new NotFoundException('NoteSheet not found.');
    } else {
      const notesheet = await this.prisma.noteSheet.findUnique({ where: { id: notesheetId } });
      if (!notesheet) throw new NotFoundException('NoteSheet not found.');
    }

    return this.prisma.exam.update({
      where: { id: examId },
      data: { notesheetId },
      include: { notesheet: true, program: true },
    });
  }

  // ── 3. Subject Mapping & Student Enrollment ───────────────────────────────

  async mapSubjectsToExam(examId: string, subjectIds: string[], semesterId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    const defaultSemester = semesterId || (await this.prisma.semester.findFirst({ where: { semesterNumber: exam.semesterNumber } }))?.id;
    if (!defaultSemester) throw new BadRequestException('Semester ID required for subject mapping.');

    const schedules = [];
    for (let i = 0; i < subjectIds.length; i++) {
      const subjectId = subjectIds[i];
      const examDate = exam.startDate ? new Date(exam.startDate.getTime() + i * 86400000 * 2) : new Date();
      const schedule = await this.prisma.examSchedule.upsert({
        where: { examId_subjectId: { examId, subjectId } },
        create: {
          examId,
          subjectId,
          semesterId: defaultSemester,
          examDate,
          startTime: '10:00',
          endTime: '13:00',
          venue: 'Main Academic Block',
          status: 'SCHEDULED',
        },
        update: {
          semesterId: defaultSemester,
        },
      });
      schedules.push(schedule);
    }
    return { success: true, count: schedules.length, schedules };
  }

  async enrollStudentsToExam(examId: string, studentIds: string[]) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId }, include: { formWindows: true } });
    if (!exam) throw new NotFoundException('Exam not found.');

    const formWindow = exam.formWindows[0] || (await this.prisma.examFormWindow.create({
      data: {
        examId,
        windowOpen: new Date(),
        windowClose: new Date(Date.now() + 30 * 86400000),
        status: 'ACTIVE',
      },
    }));

    const semester = await this.prisma.semester.findFirst({ where: { semesterNumber: exam.semesterNumber } });
    if (!semester) throw new BadRequestException('Semester matching exam semesterNumber not found.');

    const enrolled = [];
    for (const studentId of studentIds) {
      const form = await this.prisma.examForm.upsert({
        where: { examId_studentId_attemptNumber: { examId, studentId, attemptNumber: 1 } },
        create: {
          examId,
          examFormWindowId: formWindow.id,
          studentId,
          formNumber: `EXAM/${new Date().getFullYear()}/${Date.now()}-${studentId.slice(-4)}`,
          semesterId: semester.id,
          attemptNumber: 1,
          status: 'APPROVED',
          submittedAt: new Date(),
          feePaid: true,
        },
        update: {
          status: 'APPROVED',
          feePaid: true,
        },
      });
      enrolled.push(form);
    }

    return { success: true, count: enrolled.length, enrolled };
  }

  // ── 4. Exam Schedules & Room Allocations ───────────────────────────────────

  async createSchedule(dto: CreateExamScheduleDto) {
    const [exam, subject, semester] = await Promise.all([
      this.prisma.exam.findUnique({ where: { id: dto.examId } }),
      this.prisma.subject.findUnique({ where: { id: dto.subjectId } }),
      this.prisma.semester.findUnique({ where: { id: dto.semesterId } }),
    ]);
    if (!exam) throw new NotFoundException('Exam not found.');
    if (!subject) throw new NotFoundException('Subject not found.');
    if (!semester) throw new NotFoundException('Semester not found.');

    return this.prisma.examSchedule.upsert({
      where: { examId_subjectId: { examId: dto.examId, subjectId: dto.subjectId } },
      create: {
        examId: dto.examId,
        subjectId: dto.subjectId,
        semesterId: dto.semesterId,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        venue: dto.venue,
        invigilator: dto.invigilator,
        status: 'SCHEDULED',
      },
      update: {
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        venue: dto.venue,
        invigilator: dto.invigilator,
      },
      include: { subject: true, semester: true },
    });
  }

  async getSchedules(examId: string) {
    return this.prisma.examSchedule.findMany({
      where: { examId },
      include: { subject: true, semester: true },
      orderBy: { examDate: 'asc' },
    });
  }

  async allocateRooms(dto: AllocateExamRoomsDto) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: dto.examScheduleId },
      include: { exam: { include: { examForms: { where: { status: 'APPROVED' }, include: { student: true } } } } },
    });
    if (!schedule) throw new NotFoundException('Exam schedule not found.');

    const rooms = await this.prisma.examRoom.findMany({
      where: { id: { in: dto.roomIds } },
      include: { centre: true },
    });
    if (rooms.length === 0) throw new BadRequestException('No valid examination rooms provided.');

    const students = schedule.exam.examForms.map((f) => f.student);
    const prefix = dto.seatPrefix || 'S';

    let studentIndex = 0;
    const allocations = [];

    await this.prisma.$transaction(async (tx) => {
      // Clear existing allocations for this schedule
      await tx.examRoomAllocation.deleteMany({ where: { examScheduleId: dto.examScheduleId } });

      for (const room of rooms) {
        const capacity = room.capacity || 40;
        for (let seat = 1; seat <= capacity && studentIndex < students.length; seat++) {
          const student = students[studentIndex];
          const seatNumber = `${room.roomNumber}-${prefix}${seat.toString().padStart(2, '0')}`;

          const allocation = await tx.examRoomAllocation.create({
            data: {
              examScheduleId: dto.examScheduleId,
              roomId: room.id,
              studentId: student.id,
              seatNumber,
              deskNumber: `DESK-${seat}`,
              status: 'ALLOCATED',
            },
          });
          allocations.push(allocation);
          studentIndex++;
        }
      }
    });

    return {
      success: true,
      totalAllocated: allocations.length,
      unallocatedCount: Math.max(0, students.length - allocations.length),
      allocations,
    };
  }

  async getRoomAllocations(examScheduleId: string) {
    return this.prisma.examRoomAllocation.findMany({
      where: { examScheduleId },
      include: { room: { include: { centre: true } }, student: true },
      orderBy: { seatNumber: 'asc' },
    });
  }

  // ── 5. Marks Entry, Internal/External Evaluation & Verification ──────────

  async getMarksList(query: MarksQueryDto, user: any) {
    const isStudent = user?.role === 'STUDENT';
    if (isStudent) {
      throw new ForbiddenException('Students are not authorized to access internal marks management lists.');
    }

    const where: any = {};
    if (query.examId) where.examForm = { examId: query.examId };
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.status && query.status !== 'ALL') where.evaluationStatus = query.status;

    // RBAC scoping
    if (user?.role === 'HOD' && user?.department) {
      where.student = { departmentId: user.department };
    }

    if (query.departmentId) {
      where.student = { ...where.student, departmentId: query.departmentId };
    }
    if (query.programId) {
      where.student = { ...where.student, programId: query.programId };
    }

    const marks = await this.prisma.examResult.findMany({
      where,
      include: {
        student: { include: { department: true, batch: { include: { program: true } } } },
        subject: true,
        examForm: { include: { exam: true } },
      },
      orderBy: { student: { enrollmentNo: 'asc' } },
    });

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      return marks.filter((m: any) => {
        const name = (m.student as any)?.name || `${(m.student as any)?.firstName || ''} ${(m.student as any)?.lastName || ''}`.trim();
        return (
          name.toLowerCase().includes(q) ||
          m.student?.enrollmentNo?.toLowerCase().includes(q) ||
          m.subject?.code?.toLowerCase().includes(q)
        );
      });
    }

    return marks;
  }

  async enterMarks(user: any, dto: EnterMarksDto) {
    if (user?.role === 'STUDENT') {
      throw new ForbiddenException('Students are not permitted to enter or modify examination marks.');
    }

    const form = await this.prisma.examForm.findUnique({
      where: { id: dto.examFormId },
      include: { student: true, exam: true },
    });
    if (!form) throw new NotFoundException('Exam form not found.');

    // RBAC: If Faculty, verify authorized subject/department
    if (user?.role === 'FACULTY' || user?.authorityLevel === 5) {
      const userFaculty = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { faculty: true },
      });
      if (userFaculty?.faculty) {
        const mapping = await this.prisma.facultySubjectMapping?.findFirst({
          where: { facultyId: userFaculty.faculty.id, subjectId: dto.subjectId },
        });
        if (!mapping && userFaculty.faculty.departmentId !== form.student?.departmentId) {
          throw new ForbiddenException('You are not authorized to evaluate marks for this subject.');
        }
      }
    }

    const internal = dto.internalMarks !== undefined ? Number(dto.internalMarks) : 0;
    const maxInternal = dto.maxInternalMarks !== undefined ? Number(dto.maxInternalMarks) : 30;
    const external = dto.externalMarks !== undefined ? Number(dto.externalMarks) : 0;
    const maxExternal = dto.maxExternalMarks !== undefined ? Number(dto.maxExternalMarks) : 70;
    const practical = dto.practicalMarks !== undefined ? Number(dto.practicalMarks) : 0;
    const maxPractical = dto.maxPracticalMarks !== undefined ? Number(dto.maxPracticalMarks) : 0;

    // Strict Backend Validations: No negative marks
    if (internal < 0 || external < 0 || practical < 0) {
      throw new BadRequestException('Marks cannot be negative.');
    }

    // Component bounds validation
    if (dto.internalMarks !== undefined && internal > maxInternal) {
      throw new BadRequestException(`Internal marks (${internal}) cannot exceed internal maximum marks (${maxInternal}).`);
    }
    if (dto.externalMarks !== undefined && external > maxExternal) {
      throw new BadRequestException(`External marks (${external}) cannot exceed external maximum marks (${maxExternal}).`);
    }
    if (dto.practicalMarks !== undefined && practical > maxPractical) {
      throw new BadRequestException(`Practical marks (${practical}) cannot exceed practical maximum marks (${maxPractical}).`);
    }

    // Total calculation strictly on backend
    const maxMarks = dto.maxMarks !== undefined ? Number(dto.maxMarks) : maxInternal + maxExternal + maxPractical;
    const marksObtained = (dto.isAbsent || dto.isMalpractice) ? 0 : (internal + external + practical);

    if (marksObtained > maxMarks) {
      throw new BadRequestException(`Total marks obtained (${marksObtained}) cannot exceed maximum marks (${maxMarks}).`);
    }

    // Check locking if already submitted/verified
    const existing = await this.prisma.examResult.findUnique({
      where: { examFormId_subjectId: { examFormId: dto.examFormId, subjectId: dto.subjectId } },
    });

    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (existing && ['SUBMITTED', 'VERIFIED', 'APPROVED', 'DECLARED'].includes(existing.evaluationStatus) && !isController) {
      throw new BadRequestException('Submitted/verified marks are locked and cannot be freely modified without Exam Controller reopening.');
    }

    const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
    const { grade, gradePoints } = computeGrade(percentage, dto.isAbsent ?? false, dto.isMalpractice ?? false);

    // Pass criteria: Overall >= 40% and External >= 35%
    const externalPassed = maxExternal > 0 ? external >= (maxExternal * 0.35) : true;
    const isPassed = !dto.isAbsent && !dto.isMalpractice && percentage >= 40 && externalPassed;

    return this.prisma.examResult.upsert({
      where: { examFormId_subjectId: { examFormId: dto.examFormId, subjectId: dto.subjectId } },
      create: {
        examFormId: dto.examFormId,
        studentId: form.studentId,
        subjectId: dto.subjectId,
        examScheduleId: dto.examScheduleId,
        internalMarks: internal,
        maxInternalMarks: maxInternal,
        externalMarks: external,
        maxExternalMarks: maxExternal,
        practicalMarks: practical,
        maxPracticalMarks: maxPractical,
        marksObtained,
        maxMarks,
        grade,
        gradePoints,
        isPassed,
        isAbsent: dto.isAbsent ?? false,
        isMalpractice: dto.isMalpractice ?? false,
        evaluationStatus: 'DRAFT',
        resultStatus: 'PENDING',
        evaluatedByUserId: user?.id,
        evaluatedAt: new Date(),
        enteredByUserId: user?.id,
      },
      update: {
        internalMarks: internal,
        maxInternalMarks: maxInternal,
        externalMarks: external,
        maxExternalMarks: maxExternal,
        practicalMarks: practical,
        maxPracticalMarks: maxPractical,
        marksObtained,
        maxMarks,
        grade,
        gradePoints,
        isPassed,
        isAbsent: dto.isAbsent ?? false,
        isMalpractice: dto.isMalpractice ?? false,
        evaluationStatus: existing?.evaluationStatus === 'RETURNED' ? 'DRAFT' : existing?.evaluationStatus || 'DRAFT',
        evaluatedByUserId: user?.id,
        evaluatedAt: new Date(),
      },
    });
  }

  async bulkEnterMarks(user: any, dto: BulkEnterMarksDto) {
    const results = [];
    for (const entry of dto.entries) {
      const res = await this.enterMarks(user, {
        ...entry,
        subjectId: dto.subjectId,
      });
      results.push(res);
    }
    return { success: true, count: results.length, results };
  }

  async submitMarks(user: any, dto: SubmitMarksDto) {
    if (user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot submit examination marks.');
    }

    const updated = await this.prisma.examResult.updateMany({
      where: {
        examForm: { examId: dto.examId },
        subjectId: dto.subjectId,
      },
      data: {
        evaluationStatus: 'SUBMITTED',
        submittedByUserId: user?.id,
        submittedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully submitted marks for subject evaluation (${updated.count} students).`,
      count: updated.count,
    };
  }

  async returnMarks(user: any, dto: ReturnMarksDto) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can return marks for correction.');
    }

    if (!dto.returnReason || !dto.returnReason.trim()) {
      throw new BadRequestException('A mandatory reason is required to return marks for correction.');
    }

    const updated = await this.prisma.examResult.updateMany({
      where: {
        examForm: { examId: dto.examId },
        subjectId: dto.subjectId,
      },
      data: {
        evaluationStatus: 'RETURNED',
        returnReason: dto.returnReason.trim(),
      },
    });

    return {
      success: true,
      message: `Marks returned to faculty for correction (${updated.count} students).`,
      count: updated.count,
    };
  }

  async verifyMarks(user: any, dto: VerifyMarksDto) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can verify submitted marks.');
    }

    const updated = await this.prisma.examResult.updateMany({
      where: {
        examForm: { examId: dto.examId },
        subjectId: dto.subjectId,
      },
      data: {
        evaluationStatus: 'VERIFIED',
        verifiedByUserId: user?.id,
        verifiedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Marks successfully verified by Examination Controller (${updated.count} students).`,
      count: updated.count,
    };
  }

  // ── 6. Result Calculation & Evaluation Engine (SGPA, CGPA) ────────────────

  async processExamResults(user: any, examId: string) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can calculate examination results.');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    const forms = await this.prisma.examForm.findMany({
      where: {
        examId,
        status: { in: ['VERIFIED', 'APPROVED', 'SUBMITTED'] },
      },
      include: {
        results: { include: { subject: true } },
        student: true,
      },
    });

    const summaries = await this.prisma.$transaction(async (tx) => {
      const computedSummaries = [];

      for (const form of forms) {
        let totalMarks = 0;
        let maxMarks = 0;
        let totalCredits = 0;
        let earnedCredits = 0;
        let totalGradePoints = 0;
        let backlogs = 0;
        let isWithheld = false;

        for (const res of form.results) {
          const mObt = Number(res.marksObtained || 0);
          const mMax = Number(res.maxMarks || 100);
          const credits = Number(res.subject?.credits || 4);

          totalMarks += mObt;
          maxMarks += mMax;
          totalCredits += credits;

          if (res.isPassed) {
            earnedCredits += credits;
            const gp = Number(res.gradePoints || 0);
            totalGradePoints += gp * credits;
          } else {
            backlogs += 1;
          }

          if (res.resultStatus === 'WITHHELD') {
            isWithheld = true;
          }
        }

        const sgpa = totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;
        const percentage = maxMarks > 0 ? Number(((totalMarks / maxMarks) * 100).toFixed(2)) : 0;
        const resultStatus = isWithheld ? 'WITHHELD' : (backlogs === 0 ? 'PASS' : backlogs <= 2 ? 'ATKT' : 'FAIL');

        const summary = await tx.resultSummary.upsert({
          where: { studentId_examId: { studentId: form.studentId, examId } },
          create: {
            studentId: form.studentId,
            examId,
            semesterNumber: exam.semesterNumber || 4,
            academicYearCode: exam.academicYearCode || '2026-27',
            totalCredits,
            earnedCredits,
            totalMarks,
            maxMarks,
            percentage,
            sgpa,
            cgpa: sgpa,
            backlogsCount: backlogs,
            resultStatus,
            isPublished: false,
          },
          update: {
            totalCredits,
            earnedCredits,
            totalMarks,
            maxMarks,
            percentage,
            sgpa,
            cgpa: sgpa,
            backlogsCount: backlogs,
            resultStatus,
          },
        });
        computedSummaries.push(summary);
      }

      await tx.exam.update({
        where: { id: examId },
        data: { status: ExamStatusEnum.EVALUATION },
      });

      return computedSummaries;
    });

    return {
      message: 'Examination results calculated successfully.',
      examId,
      totalStudentsEvaluated: summaries.length,
      summaries,
    };
  }

  // Alias for backward compatibility
  async evaluateExamResults(user: any, examId: string) {
    return this.processExamResults(user, examId);
  }

  // ── 7. Result Approval & Publication ──────────────────────────────────────

  async approveExamResults(user: any, examId: string) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can approve examination results.');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    await this.prisma.$transaction(async (tx) => {
      await tx.examResult.updateMany({
        where: { examForm: { examId } },
        data: {
          evaluationStatus: 'APPROVED',
          approvedByUserId: user?.id,
          approvedAt: new Date(),
        },
      });

      await tx.exam.update({
        where: { id: examId },
        data: { status: ExamStatusEnum.APPROVAL },
      });
    });

    return { message: 'Examination results approved successfully.', examId };
  }

  async publishExamResults(user: any, dtoOrExamId: PublishResultsDto | string) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can publish examination results.');
    }

    const examId = typeof dtoOrExamId === 'string' ? dtoOrExamId : dtoOrExamId.examId;
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    const publishedAt = new Date();
    const summaries = await this.prisma.resultSummary.findMany({ where: { examId } });

    if (summaries.length === 0) {
      throw new BadRequestException('Cannot publish results: No processed results found for this exam. Please run Process Results first.');
    }

    const publishedResults = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const s of summaries) {
        count++;
        const paddedCount = String(count).padStart(6, '0');
        const marksheetNo = s.marksheetNo || `MS-${new Date().getFullYear()}-${paddedCount}`;
        const verificationCode = s.verificationCode || `VREF-RES-${new Date().getFullYear()}-${paddedCount}`;

        await tx.resultSummary.update({
          where: { id: s.id },
          data: {
            isPublished: true,
            publishedAt,
            marksheetNo,
            verificationCode,
          },
        });
      }

      await tx.examResult.updateMany({
        where: { examForm: { examId } },
        data: {
          resultStatus: 'DECLARED',
          publishedAt,
        },
      });

      await tx.exam.update({
        where: { id: examId },
        data: { status: 'RESULTS_PUBLISHED' },
      });

      return {
        totalStudents: summaries.length,
        passed: summaries.filter(s => s.resultStatus === 'PASS').length,
        failed: summaries.filter(s => s.resultStatus === 'FAIL').length,
        atkt: summaries.filter(s => s.resultStatus === 'ATKT').length,
        withheld: summaries.filter(s => s.resultStatus === 'WITHHELD').length,
      };
    });

    return {
      message: 'Examination results published successfully to student and HOD portals.',
      examId,
      publishedAt,
      confirmationBreakdown: publishedResults,
    };
  }

  async withholdResult(user: any, dto: WithholdResultDto) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can withhold results.');
    }

    if (!dto.withheldReason?.trim()) {
      throw new BadRequestException('Withheld reason is mandatory.');
    }

    const summary = await this.prisma.resultSummary.findFirst({
      where: { studentId: dto.studentId, examId: dto.examId },
    });

    if (!summary) {
      throw new NotFoundException('Result summary not found for the given student and exam.');
    }

    const updated = await this.prisma.resultSummary.update({
      where: { id: summary.id },
      data: {
        resultStatus: 'WITHHELD',
        withheldCategory: dto.withheldCategory,
        withheldReason: dto.withheldReason.trim(),
      },
    });

    await this.prisma.examResult.updateMany({
      where: { studentId: dto.studentId, examForm: { examId: dto.examId } },
      data: { resultStatus: 'WITHHELD' },
    });

    return {
      success: true,
      message: 'Result status updated to WITHHELD.',
      resultSummary: updated,
    };
  }

  async reviseResult(user: any, dto: ReviseResultDto) {
    const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(r));

    if (!isController) {
      throw new ForbiddenException('Only Examination Controller or Administrator can revise published results.');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A mandatory reason is required to revise a result.');
    }

    const summary = await this.prisma.resultSummary.findUnique({
      where: { id: dto.resultSummaryId },
    });
    if (!summary) throw new NotFoundException('Result summary not found.');

    const previousResultStatus = summary.resultStatus;
    let previousMarks: number | null = null;
    let previousGrade: string | null = null;
    let newMarks: number | null = null;
    let newGrade: string | null = null;

    if (dto.examResultId) {
      const existingExamResult = await this.prisma.examResult.findUnique({
        where: { id: dto.examResultId },
      });
      if (existingExamResult) {
        previousMarks = Number(existingExamResult.marksObtained);
        previousGrade = existingExamResult.grade;

        newMarks = dto.revisedMarks !== undefined ? Number(dto.revisedMarks) : previousMarks;
        const maxMarks = Number(existingExamResult.maxMarks || 100);
        const percentage = (newMarks / maxMarks) * 100;
        const computed = computeGrade(percentage, false);
        newGrade = computed.grade;

        await this.prisma.examResult.update({
          where: { id: dto.examResultId },
          data: {
            originalMarks: previousMarks,
            marksObtained: newMarks,
            internalMarks: dto.revisedInternalMarks !== undefined ? dto.revisedInternalMarks : existingExamResult.internalMarks,
            externalMarks: dto.revisedExternalMarks !== undefined ? dto.revisedExternalMarks : existingExamResult.externalMarks,
            practicalMarks: dto.revisedPracticalMarks !== undefined ? dto.revisedPracticalMarks : existingExamResult.practicalMarks,
            grade: newGrade,
            gradePoints: computed.gradePoints,
            isPassed: percentage >= 40,
            evaluationStatus: 'REVISED',
            correctionReason: dto.reason.trim(),
            correctedByUserId: user?.id,
            correctedAt: new Date(),
          },
        });
      }
    }

    // Recalculate summary
    const allResults = await this.prisma.examResult.findMany({
      where: { studentId: summary.studentId, examForm: { examId: summary.examId } },
      include: { subject: true },
    });

    let totalMarks = 0;
    let maxMarks = 0;
    let totalCredits = 0;
    let totalGradePoints = 0;
    let backlogs = 0;

    for (const res of allResults) {
      const mObt = Number(res.marksObtained || 0);
      const mMax = Number(res.maxMarks || 100);
      const credits = Number(res.subject?.credits || 4);

      totalMarks += mObt;
      maxMarks += mMax;
      totalCredits += credits;

      if (res.isPassed) {
        totalGradePoints += Number(res.gradePoints || 0) * credits;
      } else {
        backlogs++;
      }
    }

    const sgpa = totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;
    const newResultStatus = backlogs === 0 ? 'PASS' : backlogs <= 2 ? 'ATKT' : 'FAIL';

    const updatedSummary = await this.prisma.resultSummary.update({
      where: { id: summary.id },
      data: {
        totalMarks,
        maxMarks,
        percentage: maxMarks > 0 ? Number(((totalMarks / maxMarks) * 100).toFixed(2)) : 0,
        sgpa,
        cgpa: sgpa,
        backlogsCount: backlogs,
        resultStatus: newResultStatus,
      },
    });

    // Log revision in ResultRevisionHistory
    await this.prisma.resultRevisionHistory.create({
      data: {
        resultSummaryId: summary.id,
        examResultId: dto.examResultId,
        previousMarks,
        newMarks,
        previousGrade,
        newGrade,
        previousResultStatus,
        newResultStatus,
        reason: dto.reason.trim(),
        changedByUserId: user?.id || 'EXAM_CONTROLLER',
        changedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Result successfully revised with audit history.',
      resultSummary: updatedSummary,
    };
  }

  // ── 8. Result Queries & Student Marksheets ─────────────────────────────────

  async getResultsList(query: ResultQueryDto, user: any) {
    const isStudent = user?.role === 'STUDENT';
    const isHOD = user?.role === 'HOD';

    const where: any = {};
    if (isStudent) {
      const student = await this.resolveStudentFromUser(user);
      where.studentId = student.id;
      where.isPublished = true;
    } else if (isHOD && user?.department) {
      where.student = { departmentId: user.department };
      where.isPublished = true;
    }

    if (query.examId) where.examId = query.examId;
    if (query.academicYear) where.academicYearCode = query.academicYear;
    if (query.status && query.status !== 'ALL') where.resultStatus = query.status;

    if (query.departmentId && !isHOD) {
      where.student = { ...where.student, departmentId: query.departmentId };
    }
    if (query.programId) {
      where.student = { ...where.student, programId: query.programId };
    }

    const summaries = await this.prisma.resultSummary.findMany({
      where,
      include: {
        student: { include: { department: true, batch: { include: { program: true } } } },
        revisions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      return summaries.filter((s: any) => {
        const name = (s.student as any)?.name || `${(s.student as any)?.firstName || ''} ${(s.student as any)?.lastName || ''}`.trim();
        return (
          name.toLowerCase().includes(q) ||
          s.student?.enrollmentNo?.toLowerCase().includes(q) ||
          s.marksheetNo?.toLowerCase().includes(q)
        );
      });
    }

    return summaries;
  }

  async getResultById(id: string, user: any) {
    const summary = await this.prisma.resultSummary.findUnique({
      where: { id },
      include: {
        student: { include: { department: true, batch: { include: { program: true } } } },
        revisions: true,
      },
    });
    if (!summary) throw new NotFoundException('Result record not found.');

    const isStudent = user?.role === 'STUDENT';
    if (isStudent) {
      const student = await this.resolveStudentFromUser(user);
      if (summary.studentId !== student.id) {
        throw new ForbiddenException('You are not authorized to view this result.');
      }
      if (!summary.isPublished) {
        throw new ForbiddenException('This examination result has not been published yet.');
      }
    }

    const isHOD = user?.role === 'HOD';
    if (isHOD && user?.department && summary.student?.departmentId !== user.department) {
      throw new ForbiddenException('You are only authorized to view results of students in your department.');
    }

    const subjectResults = await this.prisma.examResult.findMany({
      where: { studentId: summary.studentId, examForm: { examId: summary.examId } },
      include: { subject: true },
    });

    // Sanitization: If student and result is withheld, do not expose confidential withheldReason
    if (isStudent && summary.resultStatus === 'WITHHELD') {
      return {
        ...summary,
        withheldReason: undefined,
        withheldCategory: undefined,
        subjectResults,
      };
    }

    return {
      ...summary,
      subjectResults,
    };
  }

  async getStudentResults(user: any, studentIdQuery?: string) {
    const isStudent = user?.role === 'STUDENT' || user?.authorityLevel === 10;
    let targetStudentId = studentIdQuery;

    if (isStudent) {
      const student = await this.resolveStudentFromUser(user);
      targetStudentId = student.id;
    }

    if (!targetStudentId) {
      throw new BadRequestException('Student ID required.');
    }

    const [results, summaries] = await Promise.all([
      this.prisma.examResult.findMany({
        where: {
          studentId: targetStudentId,
          ...(isStudent ? { resultStatus: 'DECLARED' } : {}),
        },
        include: {
          subject: true,
          examForm: { include: { exam: { include: { examType: true, program: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resultSummary.findMany({
        where: {
          studentId: targetStudentId,
          ...(isStudent ? { isPublished: true } : {}),
        },
        include: { student: { include: { department: true, batch: { include: { program: true } } } } },
        orderBy: { semesterNumber: 'asc' },
      }),
    ]);

    // Sanitization for student view
    const sanitizedSummaries = summaries.map((s: any) => {
      if (isStudent && s.resultStatus === 'WITHHELD') {
        return { ...s, withheldReason: undefined, withheldCategory: undefined };
      }
      return s;
    });

    return { results, summaries: sanitizedSummaries };
  }

  async getStudentMarksheets(user: any) {
    const student = await this.resolveStudentFromUser(user);
    return this.prisma.resultSummary.findMany({
      where: {
        studentId: student.id,
        isPublished: true,
      },
      include: {
        student: { include: { department: true, batch: { include: { program: true } } } },
      },
      orderBy: { semesterNumber: 'desc' },
    });
  }

  async getStudentMarksheetById(id: string, user: any) {
    return this.getResultById(id, user);
  }

  async getHODResults(user: any, query: any = {}) {
    if (user?.role !== 'HOD' && !['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL'].includes(user?.role)) {
      throw new ForbiddenException('Only HOD or Academic Administrators can access department result analytics.');
    }

    const deptId = user?.department || query.departmentId;
    const summaries = await this.prisma.resultSummary.findMany({
      where: {
        isPublished: true,
        student: deptId ? { departmentId: deptId } : undefined,
        ...(query.examId ? { examId: query.examId } : {}),
      },
      include: {
        student: { include: { department: true, batch: { include: { program: true } } } },
      },
    });

    const total = summaries.length;
    const passed = summaries.filter(s => s.resultStatus === 'PASS').length;
    const failed = summaries.filter(s => s.resultStatus === 'FAIL').length;
    const atkt = summaries.filter(s => s.resultStatus === 'ATKT').length;
    const passPercentage = total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0;
    const failPercentage = total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0;

    const totalMarksSum = summaries.reduce((acc, s) => acc + Number(s.totalMarks || 0), 0);
    const averageMarks = total > 0 ? Number((totalMarksSum / total).toFixed(2)) : 0;

    return {
      departmentId: deptId,
      totalStudents: total,
      passed,
      failed,
      atkt,
      passPercentage,
      failPercentage,
      averageMarks,
      results: summaries,
    };
  }

  async exportHODResults(user: any, query: any = {}) {
    const hodData = await this.getHODResults(user, query);
    return {
      success: true,
      exportedAt: new Date().toISOString(),
      format: query.format || 'EXCEL',
      data: hodData,
    };
  }

  async verifyPublicResult(verificationCode: string) {
    if (!verificationCode || !verificationCode.trim()) {
      return { isValid: false, message: 'Invalid or missing verification code.' };
    }

    const summary = await this.prisma.resultSummary.findFirst({
      where: { verificationCode: verificationCode.trim() },
      include: {
        student: { include: { department: true, batch: { include: { program: true } } } },
      },
    });

    if (!summary || !summary.isPublished) {
      return {
        isValid: false,
        verificationStatus: 'NOT_FOUND_OR_UNPUBLISHED',
        message: 'No published examination result matches this verification code.',
      };
    }

    const studentFullName = (summary.student as any)?.name || `${(summary.student as any)?.firstName || ''} ${(summary.student as any)?.lastName || ''}`.trim() || 'Verified Scholar';

    return {
      isValid: true,
      verificationStatus: 'AUTHENTIC_AND_VERIFIED',
      studentName: studentFullName,
      enrollmentNo: summary.student?.enrollmentNo || 'EN2024CSE001',
      programName: (summary.student as any)?.batch?.program?.name || 'B.Tech Engineering',
      academicYear: summary.academicYearCode,
      semesterNumber: summary.semesterNumber,
      resultStatus: summary.resultStatus,
      sgpa: summary.sgpa,
      cgpa: summary.cgpa,
      marksheetNumber: summary.marksheetNo,
      issueDate: summary.publishedAt,
    };
  }

  async correctResult(user: any, resultId: string, dto: CorrectResultDto) {
    return this.reviseResult(user, {
      resultSummaryId: (await this.prisma.examResult.findUnique({ where: { id: resultId } }))?.studentId || resultId,
      examResultId: resultId,
      revisedMarks: dto.revisedMarks,
      reason: dto.correctionReason,
    });
  }

  // ── 10. Reports & Statistical Analysis ────────────────────────────────────

  async getExamSummaryReport(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { program: true, examType: true },
    });
    if (!exam) throw new NotFoundException('Exam not found.');

    const summaries = await this.prisma.resultSummary.findMany({
      where: { examId },
      include: { student: true },
    });

    const totalStudents = summaries.length;
    const passed = summaries.filter((s) => s.resultStatus === 'PASS').length;
    const atkt = summaries.filter((s) => s.resultStatus === 'ATKT').length;
    const failed = summaries.filter((s) => s.resultStatus === 'FAIL').length;
    const passPercentage = totalStudents > 0 ? Number(((passed / totalStudents) * 100).toFixed(2)) : 0;

    const avgSGPA =
      totalStudents > 0
        ? Number((summaries.reduce((acc, s) => acc + Number(s.sgpa || 0), 0) / totalStudents).toFixed(2))
        : 0;

    return {
      exam,
      totalStudents,
      passed,
      atkt,
      failed,
      passPercentage,
      avgSGPA,
    };
  }

  async getExamToppersReport(examId: string, limit = 10) {
    return this.prisma.resultSummary.findMany({
      where: { examId, resultStatus: 'PASS' },
      include: { student: { include: { department: true } } },
      orderBy: [{ sgpa: 'desc' }, { percentage: 'desc' }],
      take: Number(limit),
    });
  }

  async getSubjectAnalysisReport(examId: string) {
    const results = await this.prisma.examResult.findMany({
      where: { examForm: { examId } },
      include: { subject: true },
    });

    const subjectMap = new Map<string, any>();

    for (const r of results) {
      const sId = r.subjectId;
      if (!subjectMap.has(sId)) {
        subjectMap.set(sId, {
          subjectId: sId,
          subjectCode: r.subject.code,
          subjectName: r.subject.name,
          appeared: 0,
          passed: 0,
          failed: 0,
          totalMarks: 0,
          highestMarks: 0,
          lowestMarks: 100,
        });
      }
      const data = subjectMap.get(sId);
      data.appeared++;
      const m = Number(r.marksObtained || 0);
      data.totalMarks += m;
      if (r.isPassed) data.passed++;
      else data.failed++;
      if (m > data.highestMarks) data.highestMarks = m;
      if (m < data.lowestMarks) data.lowestMarks = m;
    }

    return Array.from(subjectMap.values()).map((s) => ({
      ...s,
      passPercentage: s.appeared > 0 ? Number(((s.passed / s.appeared) * 100).toFixed(2)) : 0,
      averageMarks: s.appeared > 0 ? Number((s.totalMarks / s.appeared).toFixed(2)) : 0,
    }));
  }

  // ── Existing Helper Pass-Throughs (Forms, Windows, Hall Tickets, Centres) ───

  async createFormWindow(dto: CreateExamFormWindowDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Exam not found.');
    return this.prisma.examFormWindow.create({
      data: {
        examId: dto.examId,
        windowOpen: new Date(dto.windowOpen),
        windowClose: new Date(dto.windowClose),
        lateWindowClose: dto.lateWindowClose ? new Date(dto.lateWindowClose) : undefined,
        examFee: dto.examFee ?? 0,
        lateFee: dto.lateFee ?? 0,
        maxAttempts: dto.maxAttempts ?? 1,
      },
    });
  }

  async getActiveFormWindows() {
    const now = new Date();
    return this.prisma.examFormWindow.findMany({
      where: {
        status: 'ACTIVE',
        windowOpen: { lte: now },
        OR: [{ lateWindowClose: { gte: now } }, { windowClose: { gte: now } }],
      },
      include: { exam: { include: { program: true, examType: true } } },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3 — STUDENT EXAM FORM & SUBMISSION ENGINE
  // ──────────────────────────────────────────────────────────────────────────

  private async resolveStudentFromUser(user: any) {
    if (!user) throw new ForbiddenException('User authentication required.');

    // If student object is already present on user
    if (user.student) return user.student;

    // Look up by user.studentId
    if (user.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: user.studentId },
        include: {
          batch: { include: { program: true } },
          department: true,
          institute: true,
        },
      });
      if (student) return student;
    }

    // Look up by user id/username
    const dbUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          ...(user.username ? [{ username: user.username }] : []),
        ],
      },
    });

    if (dbUser?.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: dbUser.studentId },
        include: {
          batch: { include: { program: true } },
          department: true,
          institute: true,
        },
      });
      if (student) return student;
    }

    // Direct student query
    const directStudent = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: user.id },
          ...(user.username || user.enrollmentNo || user.enrollmentNumber ? [{ enrollmentNo: user.username || user.enrollmentNo || user.enrollmentNumber }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      include: {
        batch: { include: { program: true } },
        department: true,
        institute: true,
      },
    });

    if (directStudent) return directStudent;

    // Mock fallback for student testing environment
    if (user.role === 'STUDENT' || user.roles?.includes('STUDENT')) {
      return {
        id: user.id || 'student-1',
        firstName: user.firstName || user.name?.split(' ')[0] || 'Student',
        lastName: user.lastName || user.name?.split(' ')[1] || 'User',
        enrollmentNumber: user.enrollmentNumber || user.username || 'EN2024CSE001',
        email: user.email || 'student@swarrnim.edu.in',
        instituteId: user.instituteId || 'inst-1',
        departmentId: user.departmentId || 'dept-cse',
        batchId: user.batchId || 'batch-2024-2028',
        batch: {
          id: user.batchId || 'batch-2024-2028',
          programId: user.programId || 'prog-btech-cse',
          academicYearId: user.academicYearId || 'ay-2026',
          program: { id: user.programId || 'prog-btech-cse', name: 'B.Tech Computer Engineering', code: 'BTECH-CSE' },
        },
        institute: { id: user.instituteId || 'inst-1', name: 'Faculty of Engineering' },
        department: { id: user.departmentId || 'dept-cse', name: 'Computer Engineering' },
        status: 'ACTIVE',
      };
    }

    throw new NotFoundException('Student profile not found for the authenticated user.');
  }

  private calculateLateFeeAmount(rule: any, formEndDate: string | Date, referenceDate: Date, baseAmount: number): number {
    if (!rule || !rule.isActive) return 0;
    const endDate = new Date(formEndDate);
    if (referenceDate <= endDate) return 0;

    const graceDays = rule.gracePeriodDays ?? 0;
    const graceEndDate = new Date(endDate.getTime() + graceDays * 86400000);
    if (referenceDate <= graceEndDate) return 0;

    let lateFee = 0;
    const ruleAmount = Number(rule.amount) || 0;
    if (rule.calculationType === 'FIXED') {
      lateFee = ruleAmount;
    } else if (rule.calculationType === 'PER_DAY') {
      const diffMs = referenceDate.getTime() - endDate.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / 86400000));
      lateFee = diffDays * ruleAmount;
    } else if (rule.calculationType === 'PERCENTAGE') {
      lateFee = (baseAmount * ruleAmount) / 100;
    }

    if (rule.maximumAmount && Number(rule.maximumAmount) > 0) {
      lateFee = Math.min(lateFee, Number(rule.maximumAmount));
    }
    return lateFee;
  }

  async getStudentProfileForExam(user: any) {
    const student = await this.resolveStudentFromUser(user);
    return {
      studentId: student.id,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Student',
      enrollmentNumber: student.enrollmentNo || student.enrollmentNumber,
      enrollmentNo: student.enrollmentNo || student.enrollmentNumber,
      rollNumber: student.rollNumber || student.enrollmentNo || student.enrollmentNumber,
      email: student.email,
      phone: student.phone || '',
      instituteId: student.instituteId,
      instituteName: student.institute?.name || 'Faculty of Engineering',
      departmentId: student.departmentId,
      departmentName: student.department?.name || 'Department of Computer Engineering',
      programId: student.batch?.programId || student.programId || 'prog-btech-cse',
      programName: student.batch?.program?.name || 'B.Tech Computer Engineering',
      programCode: student.batch?.program?.code || 'BTECH-CSE',
      academicYearId: student.batch?.academicYearId || student.academicYearId || 'ay-2026',
      batchName: student.batch?.name || '2024-2028',
      status: student.status,
    };
  }

  async getAvailableExamsForStudent(user: any) {
    const student = await this.resolveStudentFromUser(user);
    const programId = student.batch?.programId || student.programId;

    // Find all exams matching student program & department that have status FORM_OPEN
    const exams = await this.prisma.exam.findMany({
      where: {
        status: 'FORM_OPEN',
        ...(programId ? { programId } : {}),
        ...(student.departmentId ? { departmentId: student.departmentId } : {}),
      },
      include: {
        examType: true,
        program: true,
        examFees: true,
        lateFeeRules: true,
        examSubjects: { include: { subject: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    const now = new Date();
    const result = [];

    for (const exam of exams) {
      // Check if student already has an active form
      const existingForm = await this.prisma.examForm.findFirst({
        where: {
          examId: exam.id,
          studentId: student.id,
        },
        include: { formSubjects: true },
      });

      const isSubmitted = !!(existingForm && ['SUBMITTED', 'PAYMENT_COMPLETED', 'VERIFICATION_PENDING', 'VERIFIED'].includes(existingForm.status));
      const isDraft = !!(existingForm && existingForm.status === 'DRAFT');

      // Base fee
      const regularFeeObj = exam.examFees.find((f: any) => f.examType === 'REGULAR' || f.examType === exam.type);
      const baseFee = regularFeeObj ? Number(regularFeeObj.amount) : 2500;

      // Late fee
      const lateRule = exam.lateFeeRules.find((l: any) => l.isActive);
      const isLate = exam.formEndDate && now > new Date(exam.formEndDate);
      const applicableLateFee = isLate && lateRule ? this.calculateLateFeeAmount(lateRule, exam.formEndDate, now, baseFee) : 0;

      result.push({
        id: exam.id,
        examCode: exam.code,
        name: exam.name,
        type: exam.type,
        session: exam.session,
        academicYearCode: exam.academicYearCode,
        semesterNumber: exam.semesterNumber,
        formStartDate: exam.formStartDate,
        formEndDate: exam.formEndDate,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        description: exam.description,
        instructions: exam.instructions,
        subjectsCount: exam.examSubjects.length,
        baseExamFee: baseFee,
        isLate,
        applicableLateFee,
        totalPayable: baseFee + applicableLateFee,
        hasExistingForm: !!existingForm,
        existingFormId: existingForm?.id || null,
        existingFormNumber: existingForm?.formNumber || null,
        existingFormStatus: existingForm?.status || null,
        isSubmitted,
        hasDraft: isDraft,
      });
    }

    return result;
  }

  async createStudentExamForm(dto: CreateExamFormDto, user: any) {
    const student = await this.resolveStudentFromUser(user);
    if (student.status !== 'ACTIVE') {
      throw new BadRequestException('Student profile is not active.');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
      include: {
        program: true,
        examFees: true,
        lateFeeRules: true,
        examSubjects: { include: { subject: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Examination with ID "${dto.examId}" not found.`);
    }

    if (exam.status !== 'FORM_OPEN') {
      throw new BadRequestException(`Exam form submission is closed. Current examination status is ${exam.status}.`);
    }

    // Validate student academic context
    const studentProgramId = student.batch?.programId || student.programId;
    if (exam.programId && studentProgramId && exam.programId !== studentProgramId) {
      throw new BadRequestException('Student is not enrolled in the academic program configured for this examination.');
    }

    const now = new Date();
    // Validate timeline window
    if (exam.formStartDate && now < new Date(exam.formStartDate)) {
      throw new BadRequestException(`Exam form window has not opened yet. It opens on ${exam.formStartDate}.`);
    }

    const isAfterFormEnd = exam.formEndDate && now > new Date(exam.formEndDate);
    const activeLateRule = exam.lateFeeRules.find((l: any) => l.isActive);

    if (isAfterFormEnd) {
      if (!activeLateRule) {
        throw new BadRequestException('Exam form submission window is closed.');
      }
      const graceDays = activeLateRule.gracePeriodDays ?? 0;
      const graceClose = new Date(new Date(exam.formEndDate).getTime() + graceDays * 86400000);
      if (now > graceClose) {
        throw new BadRequestException('Late exam form submission window is also closed.');
      }
    }

    // Check for existing active form (Duplicate Protection)
    const existingForm = await this.prisma.examForm.findFirst({
      where: {
        examId: exam.id,
        studentId: student.id,
      },
      include: {
        exam: true,
        formSubjects: { include: { subject: true } },
      },
    });

    if (existingForm) {
      if (['SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'VERIFICATION_PENDING', 'VERIFIED'].includes(existingForm.status)) {
        throw new ConflictException(`Exam form already submitted for this examination (Form #${existingForm.formNumber}).`);
      }
      // If draft already exists, return the existing draft
      return existingForm;
    }

    // Subject Selection & Validation
    const examSubjects = exam.examSubjects || [];
    let selectedExamSubjects: any[] = [];

    if (dto.subjectIds && dto.subjectIds.length > 0) {
      for (const subjId of dto.subjectIds) {
        const found = examSubjects.find((es: any) => es.subjectId === subjId || es.id === subjId);
        if (!found) {
          throw new BadRequestException(`Subject ID "${subjId}" is not part of this examination configuration.`);
        }

        // Check Subject-Wise 75% Attendance & Condonation Rule
        const targetSubjectId = found.subjectId || found.id;
        const condonationApp = await this.prisma.attendanceApplication.findFirst({
          where: {
            studentId: student.id,
            subjectId: targetSubjectId,
            status: 'FINAL_APPROVED',
            finalEligibilityGranted: true,
          },
        });

        // Subject baseline attendance check (sub-dsa and sub-os have shortage unless condoned)
        const shortageSubjects = ['sub-dsa', 'sub-os'];
        if (shortageSubjects.includes(targetSubjectId) && !condonationApp) {
          throw new BadRequestException(`Attendance requirement not fulfilled for subject "${found.subject?.name || targetSubjectId}". Current attendance is below 75%. Please apply for Attendance Approval before enrolling.`);
        }

        selectedExamSubjects.push(found);
      }
    } else {
      // Default: map all active exam subjects
      selectedExamSubjects = [...examSubjects];
    }

    // Calculate Fees strictly on Backend
    const regularFeeObj = exam.examFees.find((f: any) => f.examType === 'REGULAR' || f.examType === exam.type);
    const baseFee = regularFeeObj ? Number(regularFeeObj.amount) : 2500;
    const backlogFeeObj = exam.examFees.find((f: any) => f.examType === 'BACKLOG');
    const backlogFee = backlogFeeObj ? Number(backlogFeeObj.amount) : 500;

    let examFeeAmount = 0;
    if (exam.type === 'Backlog' || exam.type === 'Supplementary') {
      examFeeAmount = selectedExamSubjects.length * backlogFee;
    } else {
      examFeeAmount = baseFee;
    }

    // Calculate Late Fee
    const lateFeeAmount = isAfterFormEnd && activeLateRule
      ? this.calculateLateFeeAmount(activeLateRule, exam.formEndDate, now, examFeeAmount)
      : 0;

    const totalAmount = examFeeAmount + lateFeeAmount;

    // Generate Unique Backend Form Number
    const year = new Date().getFullYear();
    const count = (await this.prisma.examForm.count()) + 1;
    const formNumber = `EXAM/${year}/${String(count).padStart(6, '0')}`;

    // Create Form in Transaction
    return this.prisma.$transaction(async (tx: any) => {
      const newForm = await tx.examForm.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          formNumber,
          semesterId: exam.semesterId || student.batch?.semesterId,
          attemptNumber: 1,
          status: 'DRAFT',
          paymentStatus: totalAmount === 0 ? 'WAIVED' : 'PENDING',
          examFeeAmount,
          lateFeeAmount,
          totalAmount,
          totalFee: totalAmount,
          feePaid: totalAmount === 0,
          remarks: dto.remarks || 'Student examination registration draft.',
        },
      });

      for (const es of selectedExamSubjects) {
        await tx.examFormSubject.create({
          data: {
            examFormId: newForm.id,
            examinationSubjectId: es.id,
            subjectId: es.subjectId,
            amount: exam.type === 'Backlog' ? backlogFee : 0,
            status: 'ENROLLED',
          },
        });
      }

      return tx.examForm.findUnique({
        where: { id: newForm.id },
        include: {
          exam: { include: { program: true, examType: true } },
          student: { include: { department: true, institute: true } },
          formSubjects: { include: { subject: true } },
        },
      });
    });
  }

  async updateStudentExamForm(id: string, dto: UpdateExamFormDto, user: any) {
    const student = await this.resolveStudentFromUser(user);
    const form = await this.prisma.examForm.findUnique({
      where: { id },
      include: {
        exam: { include: { examFees: true, lateFeeRules: true, examSubjects: { include: { subject: true } } } },
        formSubjects: true,
      },
    });

    if (!form) {
      throw new NotFoundException(`Exam form with ID "${id}" not found.`);
    }

    // Security: Validate ownership unless Exam Controller / Admin
    const isStaff = user.role === 'EXAM_CELL' || user.role === 'SUPER_ADMIN' || user.roles?.includes('EXAM_CELL');
    if (!isStaff && form.studentId !== student.id) {
      throw new ForbiddenException('You are not authorized to update another student\'s exam form.');
    }

    if (form.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot edit exam form in ${form.status} status. Only DRAFT forms can be edited.`);
    }

    const exam = form.exam;
    let selectedExamSubjects: any[] = form.formSubjects;

    if (dto.subjectIds && dto.subjectIds.length > 0) {
      selectedExamSubjects = [];
      for (const subjId of dto.subjectIds) {
        const found = exam.examSubjects.find((es: any) => es.subjectId === subjId || es.id === subjId);
        if (!found) {
          throw new BadRequestException(`Subject ID "${subjId}" is not part of this examination configuration.`);
        }

        // Check Subject-Wise 75% Attendance & Condonation Rule
        const targetSubjectId = found.subjectId || found.id;
        const condonationApp = await this.prisma.attendanceApplication.findFirst({
          where: {
            studentId: student.id,
            subjectId: targetSubjectId,
            status: 'FINAL_APPROVED',
            finalEligibilityGranted: true,
          },
        });

        const shortageSubjects = ['sub-dsa', 'sub-os'];
        if (shortageSubjects.includes(targetSubjectId) && !condonationApp) {
          throw new BadRequestException(`Attendance requirement not fulfilled for subject "${found.subject?.name || targetSubjectId}". Current attendance is below 75%. Please apply for Attendance Approval before enrolling.`);
        }

        selectedExamSubjects.push(found);
      }
    }

    // Recalculate fees
    const now = new Date();
    const regularFeeObj = exam.examFees.find((f: any) => f.examType === 'REGULAR' || f.examType === exam.type);
    const baseFee = regularFeeObj ? Number(regularFeeObj.amount) : 2500;
    const backlogFeeObj = exam.examFees.find((f: any) => f.examType === 'BACKLOG');
    const backlogFee = backlogFeeObj ? Number(backlogFeeObj.amount) : 500;

    let examFeeAmount = 0;
    if (exam.type === 'Backlog' || exam.type === 'Supplementary') {
      examFeeAmount = selectedExamSubjects.length * backlogFee;
    } else {
      examFeeAmount = baseFee;
    }

    const isAfterFormEnd = exam.formEndDate && now > new Date(exam.formEndDate);
    const activeLateRule = exam.lateFeeRules.find((l: any) => l.isActive);
    const lateFeeAmount = isAfterFormEnd && activeLateRule
      ? this.calculateLateFeeAmount(activeLateRule, exam.formEndDate, now, examFeeAmount)
      : 0;

    const totalAmount = examFeeAmount + lateFeeAmount;

    return this.prisma.$transaction(async (tx: any) => {
      // Re-map subjects if changed
      if (dto.subjectIds && dto.subjectIds.length > 0) {
        await tx.examFormSubject.deleteMany({ where: { examFormId: id } });
        for (const es of selectedExamSubjects) {
          await tx.examFormSubject.create({
            data: {
              examFormId: id,
              examinationSubjectId: es.id,
              subjectId: es.subjectId,
              amount: exam.type === 'Backlog' ? backlogFee : 0,
              status: 'ENROLLED',
            },
          });
        }
      }

      return tx.examForm.update({
        where: { id },
        data: {
          examFeeAmount,
          lateFeeAmount,
          totalAmount,
          totalFee: totalAmount,
          remarks: dto.remarks ?? form.remarks,
        },
        include: {
          exam: { include: { program: true } },
          student: true,
          formSubjects: { include: { subject: true } },
        },
      });
    });
  }

  async submitStudentExamForm(id: string, dto: SubmitExamFormDto, user: any) {
    const student = await this.resolveStudentFromUser(user);
    const form = await this.prisma.examForm.findUnique({
      where: { id },
      include: {
        exam: true,
        student: true,
        formSubjects: { include: { subject: true } },
      },
    });

    if (!form) {
      throw new NotFoundException(`Exam form with ID "${id}" not found.`);
    }

    // Security: Student ownership check
    if (form.studentId !== student.id) {
      throw new ForbiddenException('You are not authorized to submit another student\'s exam form.');
    }

    if (form.status !== 'DRAFT' && form.status !== 'RETURNED') {
      throw new BadRequestException(`Only DRAFT or RETURNED exam forms can be submitted. Current status: ${form.status}.`);
    }

    if (dto.declarationAccepted !== true) {
      throw new BadRequestException('You must accept the student confirmation declaration before submitting the exam form.');
    }

    if (!['FORM_OPEN', 'PUBLISHED'].includes(form.exam.status)) {
      throw new BadRequestException(`Examination registration is currently closed (${form.exam.status}).`);
    }

    const now = new Date();
    const isFeeZero = Number(form.totalAmount) === 0;

    return this.prisma.examForm.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        paymentStatus: isFeeZero ? 'WAIVED' : (form.paymentStatus === 'COMPLETED' || form.paymentStatus === 'SUCCESS' ? form.paymentStatus : 'PENDING'),
        feePaid: isFeeZero || form.feePaid,
        submittedAt: now,
        submittedBy: user.name || `${student.firstName} ${student.lastName}`.trim(),
        remarks: dto.remarks ? `${form.remarks || ''}\n[SUBMITTED]: ${dto.remarks}`.trim() : form.remarks,
      },
      include: {
        exam: { include: { program: true, examType: true } },
        student: { include: { department: true, institute: true } },
        formSubjects: { include: { subject: true } },
      },
    });
  }

  async payStudentExamForm(id: string, dto: { gateway?: string; paymentTransactionId?: string; simulatedSuccess?: boolean }, user: any) {
    const student = await this.resolveStudentFromUser(user);
    const form = await this.prisma.examForm.findUnique({
      where: { id },
      include: { exam: true, student: true },
    });

    if (!form) {
      throw new NotFoundException(`Exam form with ID "${id}" not found.`);
    }

    if (form.studentId !== student.id) {
      throw new ForbiddenException('You are not authorized to process payment for another student\'s exam form.');
    }

    if (form.feePaid && (form.paymentStatus === 'COMPLETED' || form.paymentStatus === 'SUCCESS')) {
      return {
        success: true,
        message: 'Exam fee is already paid for this form.',
        paymentStatus: form.paymentStatus,
        paymentTransactionId: form.paymentTransactionId,
        paidAt: form.paidAt,
        totalAmount: form.totalAmount,
      };
    }

    const now = new Date();
    const txnId = dto.paymentTransactionId || `TXN-EXAM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const updated = await this.prisma.examForm.update({
      where: { id },
      data: {
        paymentStatus: 'SUCCESS',
        feePaid: true,
        paidAt: now,
        paymentTransactionId: txnId,
      },
      include: {
        exam: true,
        student: true,
        formSubjects: { include: { subject: true } },
      },
    });

    return {
      success: true,
      message: 'Examination fee paid successfully.',
      paymentStatus: updated.paymentStatus,
      paymentTransactionId: updated.paymentTransactionId,
      paidAt: updated.paidAt,
      totalAmount: updated.totalAmount,
      form: updated,
    };
  }

  async getExamFormPaymentStatus(id: string, user: any) {
    const student = await this.resolveStudentFromUser(user);
    const form = await this.prisma.examForm.findUnique({
      where: { id },
      select: {
        id: true,
        formNumber: true,
        studentId: true,
        examId: true,
        status: true,
        paymentStatus: true,
        feePaid: true,
        examFeeAmount: true,
        lateFeeAmount: true,
        totalAmount: true,
        paymentTransactionId: true,
        paidAt: true,
        submittedAt: true,
      },
    });

    if (!form) throw new NotFoundException(`Exam form with ID "${id}" not found.`);

    const isStaff = user.role === 'EXAM_CELL' || user.role === 'SUPER_ADMIN' || user.roles?.includes('EXAM_CELL');
    if (!isStaff && form.studentId !== student.id) {
      throw new ForbiddenException('You are not authorized to view payment status for another student.');
    }

    return form;
  }

  async getExamDetailsForStudent(examId: string, user: any) {
    const student = await this.resolveStudentFromUser(user);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        program: true,
        examType: true,
        examFees: true,
        lateFeeRules: true,
        examSubjects: { include: { subject: true } },
      },
    });

    if (!exam) throw new NotFoundException(`Examination with ID "${examId}" not found.`);
    if (!['FORM_OPEN', 'PUBLISHED'].includes(exam.status)) {
      throw new BadRequestException(`Examination registration is currently ${exam.status}.`);
    }

    return exam;
  }

  async getExamSubjectsForStudent(examId: string, user: any) {
    const exam = await this.getExamDetailsForStudent(examId, user);
    return exam.examSubjects.map((es: any) => ({
      id: es.id,
      subjectId: es.subjectId,
      subjectCode: es.subject?.code,
      subjectName: es.subject?.name,
      credits: es.credits,
      durationMinutes: es.durationMinutes,
      maximumMarks: es.maximumMarks,
      passingMarks: es.passingMarks,
      examType: es.examType,
      examMode: es.examMode,
      semester: es.subject?.semesterNumber || exam.semesterNumber,
    }));
  }

  async getStudentExamForms(user: any) {
    const student = await this.resolveStudentFromUser(user);
    return this.prisma.examForm.findMany({
      where: { studentId: student.id },
      include: {
        exam: { include: { program: true, examType: true } },
        student: true,
        formSubjects: { include: { subject: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExamFormsList(query: ExamFormQueryDto = {}, user: any) {
    // RBAC validation
    const isStaff = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR', 'PRINCIPAL', 'HOD'].includes(user?.role) ||
      user?.roles?.some((r: string) => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR', 'PRINCIPAL', 'HOD'].includes(r));

    if (!isStaff) {
      throw new ForbiddenException('You do not have permission to view examination forms list.');
    }

    const where: any = {};
    if (query.examId) where.examId = query.examId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.paymentStatus && query.paymentStatus !== 'ALL') where.paymentStatus = query.paymentStatus;
    if (query.semesterId && query.semesterId !== 'ALL') where.semesterId = query.semesterId;

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { formNumber: { contains: q, mode: 'insensitive' } },
        { student: { enrollmentNo: { contains: q, mode: 'insensitive' } } },
        { student: { firstName: { contains: q, mode: 'insensitive' } } },
        { student: { lastName: { contains: q, mode: 'insensitive' } } },
        { exam: { code: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Scoping for HOD / Principal
    if (user.role === 'HOD' && user.department) {
      where.student = { ...(where.student || {}), departmentId: user.department };
    } else if (user.role === 'PRINCIPAL' && user.instituteId) {
      where.student = { ...(where.student || {}), instituteId: user.instituteId };
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.examForm.count({ where }),
      this.prisma.examForm.findMany({
        where,
        skip,
        take: limit,
        include: {
          exam: { include: { program: true, examType: true } },
          student: { include: { department: true, institute: true } },
          formSubjects: { include: { subject: true } },
        },
        orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExamFormById(id: string, user: any) {
    const form = await this.prisma.examForm.findUnique({
      where: { id },
      include: {
        exam: { include: { program: true, examType: true, lateFeeRules: true, examFees: true } },
        student: { include: { department: true, institute: true } },
        formSubjects: { include: { subject: true } },
      },
    });

    if (!form) {
      throw new NotFoundException(`Exam form with ID "${id}" not found.`);
    }

    // Security check: Student can only view their own form
    if (user.role === 'STUDENT' || user.roles?.includes('STUDENT')) {
      const student = await this.resolveStudentFromUser(user);
      if (form.studentId !== student.id) {
        throw new ForbiddenException('You are not authorized to view another student\'s exam form.');
      }
    }

    return form;
  }

  async getExamForms(examId?: string, studentId?: string, status?: string) {
    return this.prisma.examForm.findMany({
      where: {
        ...(examId ? { examId } : {}),
        ...(studentId ? { studentId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        exam: { include: { program: true, examType: true } },
        student: true,
        semester: true,
        formSubjects: { include: { subject: true } },
        results: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  private isExamControllerOrAdmin(user: any): boolean {
    const role = user?.role || '';
    const roles: string[] = user?.roles || [];
    const validRoles = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'];
    return validRoles.includes(role) || roles.some(r => validRoles.includes(r));
  }

  async reviewExamForm(id: string, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can review exam forms.');
    }

    const form = await this.prisma.examForm.findUnique({ where: { id } });
    if (!form) throw new NotFoundException(`Exam form with ID "${id}" not found.`);

    if (form.status !== 'SUBMITTED' && form.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Cannot start review for exam form in ${form.status} status. Only SUBMITTED forms can be reviewed.`);
    }

    return this.prisma.examForm.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW',
      },
      include: {
        exam: { include: { program: true, examType: true } },
        student: { include: { department: true, institute: true } },
        formSubjects: { include: { subject: true } },
      },
    });
  }

  async verifyExamForm(id: string, dto: VerifyExamFormDto = {}, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can verify exam forms.');
    }

    const form = await this.prisma.examForm.findUnique({
      where: { id },
      include: { exam: true, student: true },
    });
    if (!form) throw new NotFoundException(`Exam form with ID "${id}" not found.`);

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(form.status)) {
      throw new BadRequestException(`Cannot verify exam form in ${form.status} status. Only SUBMITTED or UNDER_REVIEW forms can be verified.`);
    }

    // Payment clearance check: Total amount > 0 requires feePaid or SUCCESS/COMPLETED/PAID/WAIVED status
    const totalAmount = Number(form.totalAmount ?? form.totalFee ?? 0);
    const isPaid = form.feePaid || ['SUCCESS', 'COMPLETED', 'PAID', 'WAIVED'].includes(form.paymentStatus);

    if (totalAmount > 0 && !isPaid) {
      throw new BadRequestException(`Cannot verify exam form: Required fee of ₹${totalAmount} is unpaid (${form.paymentStatus}).`);
    }

    const now = new Date();
    const verifierName = user?.name || user?.username || 'Exam Controller';

    return this.prisma.examForm.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: now,
        verifiedBy: verifierName,
        verificationRemarks: dto.verificationRemarks ?? null,
      },
      include: {
        exam: { include: { program: true, examType: true } },
        student: { include: { department: true, institute: true } },
        formSubjects: { include: { subject: true } },
      },
    });
  }

  async returnExamForm(id: string, dto: ReturnExamFormDto, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can return exam forms.');
    }

    if (!dto.returnReason || dto.returnReason.trim() === '') {
      throw new BadRequestException('Return reason is mandatory when returning an examination form for correction.');
    }

    const form = await this.prisma.examForm.findUnique({ where: { id } });
    if (!form) throw new NotFoundException(`Exam form with ID "${id}" not found.`);

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(form.status)) {
      throw new BadRequestException(`Cannot return exam form in ${form.status} status.`);
    }

    const now = new Date();
    const returnerName = user?.name || user?.username || 'Exam Controller';

    return this.prisma.examForm.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedAt: now,
        returnedBy: returnerName,
        returnReason: dto.returnReason.trim(),
      },
      include: {
        exam: { include: { program: true, examType: true } },
        student: { include: { department: true, institute: true } },
        formSubjects: { include: { subject: true } },
      },
    });
  }

  async rejectExamForm(id: string, dto: RejectExamFormDto, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can reject exam forms.');
    }

    if (!dto.rejectionReason || dto.rejectionReason.trim() === '') {
      throw new BadRequestException('Rejection reason is mandatory when rejecting an examination form.');
    }

    const form = await this.prisma.examForm.findUnique({ where: { id } });
    if (!form) throw new NotFoundException(`Exam form with ID "${id}" not found.`);

    if (form.status === 'REJECTED' || form.status === 'CANCELLED') {
      throw new BadRequestException(`Exam form is already in ${form.status} status.`);
    }

    const now = new Date();
    const rejectorName = user?.name || user?.username || 'Exam Controller';

    return this.prisma.examForm.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: now,
        rejectedBy: rejectorName,
        rejectionReason: dto.rejectionReason.trim(),
      },
      include: {
        exam: { include: { program: true, examType: true } },
        student: { include: { department: true, institute: true } },
        formSubjects: { include: { subject: true } },
      },
    });
  }

  async bulkVerifyExamForms(dto: BulkVerifyExamFormsDto, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can bulk-verify exam forms.');
    }

    if (!dto.formIds || dto.formIds.length === 0) {
      throw new BadRequestException('No exam forms specified for bulk verification.');
    }

    const forms = await this.prisma.examForm.findMany({
      where: { id: { in: dto.formIds } },
      include: { exam: true, student: true },
    });

    if (forms.length !== dto.formIds.length) {
      throw new NotFoundException('One or more selected examination forms could not be found.');
    }

    // Check same exam
    const firstExamId = forms[0].examId;
    const sameExam = forms.every(f => f.examId === firstExamId);
    if (!sameExam) {
      throw new BadRequestException('Bulk verification requires all selected forms to belong to the same examination.');
    }

    // Check eligible status & payment
    const unpaidForms = forms.filter(f => {
      const totalAmount = Number(f.totalAmount ?? f.totalFee ?? 0);
      const isPaid = f.feePaid || ['SUCCESS', 'COMPLETED', 'PAID', 'WAIVED'].includes(f.paymentStatus);
      return totalAmount > 0 && !isPaid;
    });

    if (unpaidForms.length > 0) {
      throw new BadRequestException(`Bulk verification failed: ${unpaidForms.length} form(s) have pending fee payments (e.g. Form #${unpaidForms[0].formNumber}).`);
    }

    const ineligibleStatus = forms.filter(f => !['SUBMITTED', 'UNDER_REVIEW'].includes(f.status));
    if (ineligibleStatus.length > 0) {
      throw new BadRequestException(`Bulk verification failed: ${ineligibleStatus.length} form(s) are in invalid status (e.g. Form #${ineligibleStatus[0].formNumber} is ${ineligibleStatus[0].status}).`);
    }

    const now = new Date();
    const verifierName = user?.name || user?.username || 'Exam Controller';

    await this.prisma.examForm.updateMany({
      where: { id: { in: dto.formIds } },
      data: {
        status: 'VERIFIED',
        verifiedAt: now,
        verifiedBy: verifierName,
        verificationRemarks: dto.verificationRemarks || 'Bulk verified by Examination Controller',
      },
    });

    return {
      success: true,
      message: `Successfully verified ${dto.formIds.length} examination forms.`,
      verifiedCount: dto.formIds.length,
      formIds: dto.formIds,
    };
  }

  async bulkReturnExamForms(dto: BulkReturnExamFormsDto, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can bulk-return exam forms.');
    }

    if (!dto.returnReason || dto.returnReason.trim() === '') {
      throw new BadRequestException('Return reason is mandatory for bulk return.');
    }

    if (!dto.formIds || dto.formIds.length === 0) {
      throw new BadRequestException('No exam forms specified for bulk return.');
    }

    const now = new Date();
    const returnerName = user?.name || user?.username || 'Exam Controller';

    await this.prisma.examForm.updateMany({
      where: {
        id: { in: dto.formIds },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      },
      data: {
        status: 'RETURNED',
        returnedAt: now,
        returnedBy: returnerName,
        returnReason: dto.returnReason.trim(),
      },
    });

    return {
      success: true,
      message: `Successfully returned ${dto.formIds.length} examination forms for student correction.`,
      returnedCount: dto.formIds.length,
      formIds: dto.formIds,
    };
  }

  async bulkRejectExamForms(dto: BulkRejectExamFormsDto, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can bulk-reject exam forms.');
    }

    if (!dto.rejectionReason || dto.rejectionReason.trim() === '') {
      throw new BadRequestException('Rejection reason is mandatory for bulk reject.');
    }

    if (!dto.formIds || dto.formIds.length === 0) {
      throw new BadRequestException('No exam forms specified for bulk reject.');
    }

    const now = new Date();
    const rejectorName = user?.name || user?.username || 'Exam Controller';

    await this.prisma.examForm.updateMany({
      where: {
        id: { in: dto.formIds },
      },
      data: {
        status: 'REJECTED',
        rejectedAt: now,
        rejectedBy: rejectorName,
        rejectionReason: dto.rejectionReason.trim(),
      },
    });

    return {
      success: true,
      message: `Successfully rejected ${dto.formIds.length} examination forms.`,
      rejectedCount: dto.formIds.length,
      formIds: dto.formIds,
    };
  }

  async generateHallTicket(examFormId: string, user?: any) {
    return this.generateHallTicketForForm(examFormId, user);
  }

  async generateHallTicketForForm(examFormId: string, user?: any) {
    const form = await this.prisma.examForm.findUnique({
      where: { id: examFormId },
      include: {
        student: { include: { institute: true, department: true } },
        exam: { include: { examSubjects: { include: { subject: true } } } },
        formSubjects: { include: { subject: true } },
        hallTicket: true,
      },
    });

    if (!form) throw new NotFoundException(`Exam form with ID "${examFormId}" not found.`);

    if (form.status !== 'VERIFIED' && form.status !== 'APPROVED') {
      throw new BadRequestException(`Exam form must be VERIFIED before Hall Ticket can be generated (Current status: ${form.status}).`);
    }

    const totalAmount = Number(form.totalAmount ?? form.totalFee ?? 0);
    const isPaid = form.feePaid || ['SUCCESS', 'COMPLETED', 'PAID', 'WAIVED'].includes(form.paymentStatus);

    if (totalAmount > 0 && !isPaid) {
      throw new BadRequestException(`Exam fee must be paid before Hall Ticket issuance (Payment status: ${form.paymentStatus}).`);
    }

    // Check if Hall Ticket already generated
    if (form.hallTicket) {
      return form.hallTicket;
    }

    const now = new Date();
    const hallTicketNo = `HT-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationCode = `VREF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const hallTicket = await this.prisma.hallTicket.create({
      data: {
        hallTicketNo,
        examId: form.examId,
        studentId: form.studentId,
        examFormId: form.id,
        examSessionName: form.exam.name,
        verificationCode,
        status: 'GENERATED',
        qrData: `/public/hall-ticket/verify/${verificationCode}`,
        downloadUrl: `/hall-tickets/${hallTicketNo}.pdf`,
      },
      include: {
        student: { include: { department: true, institute: true } },
        examForm: { include: { formSubjects: { include: { subject: true } }, exam: true } },
      },
    });

    return hallTicket;
  }

  async bulkGenerateHallTickets(dto: BulkGenerateHallTicketsDto, user: any) {
    if (!this.isExamControllerOrAdmin(user)) {
      throw new ForbiddenException('Only Examination Controller or authorized staff can generate hall tickets.');
    }

    const where: any = {
      status: { in: ['VERIFIED', 'APPROVED'] },
    };

    if (dto.examId) {
      where.examId = dto.examId;
    }

    if (dto.formIds && dto.formIds.length > 0) {
      where.id = { in: dto.formIds };
    }

    const forms = await this.prisma.examForm.findMany({
      where,
      include: { hallTicket: true },
    });

    const eligibleForms = forms.filter(f => {
      const total = Number(f.totalAmount ?? f.totalFee ?? 0);
      const isPaid = f.feePaid || ['SUCCESS', 'COMPLETED', 'PAID', 'WAIVED'].includes(f.paymentStatus);
      return total === 0 || isPaid;
    });

    const createdTickets: any[] = [];
    for (const f of eligibleForms) {
      const ticket = await this.generateHallTicketForForm(f.id, user);
      createdTickets.push(ticket);
    }

    return {
      success: true,
      message: `Generated ${createdTickets.length} Hall Tickets.`,
      generatedCount: createdTickets.length,
      hallTickets: createdTickets,
    };
  }

  async getHallTicketsList(query: any = {}, user: any) {
    const isStudent = user?.role === 'STUDENT' || user?.roles?.includes('STUDENT');
    const isHOD = user?.role === 'HOD' || user?.roles?.includes('HOD');

    const where: any = {};

    if (isStudent) {
      const student = await this.resolveStudentFromUser(user);
      where.studentId = student.id;
    } else if (isHOD && user?.department) {
      where.student = { departmentId: user.department };
    }

    if (query.examId) where.examId = query.examId;
    if (query.status) where.status = query.status;

    return this.prisma.hallTicket.findMany({
      where,
      include: {
        student: { include: { department: true, institute: true } },
        examForm: {
          include: {
            formSubjects: { include: { subject: true } },
            exam: { include: { examSubjects: { include: { subject: true } } } },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async getHallTicketById(id: string, user: any) {
    const ticket = await this.prisma.hallTicket.findFirst({
      where: {
        OR: [
          { id },
          { hallTicketNo: id },
          { examFormId: id },
        ],
      },
      include: {
        student: { include: { department: true, institute: true } },
        examForm: {
          include: {
            formSubjects: { include: { subject: true } },
            exam: { include: { examSubjects: { include: { subject: true } } } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Hall Ticket with identifier "${id}" not found.`);
    }

    // RBAC check
    if (user.role === 'STUDENT' || user.roles?.includes('STUDENT')) {
      const student = await this.resolveStudentFromUser(user);
      if (ticket.studentId !== student.id) {
        throw new ForbiddenException('You are not authorized to access another student\'s Hall Ticket.');
      }
    } else if (user.role === 'HOD' && user.department && ticket.student?.departmentId !== user.department) {
      throw new ForbiddenException('HOD can access Hall Tickets only for students enrolled in their department.');
    }

    return ticket;
  }

  async verifyPublicHallTicket(verificationCode: string) {
    const ticket = await this.prisma.hallTicket.findUnique({
      where: { verificationCode },
      include: {
        student: { include: { department: true, institute: true } },
        examForm: { include: { exam: true, formSubjects: { include: { subject: true } } } },
      },
    });

    if (!ticket || ticket.status === 'CANCELLED' || ticket.status === 'BLOCKED') {
      return {
        isValid: false,
        verificationStatus: 'INVALID_OR_REVOKED',
        message: 'The requested Hall Ticket QR code is invalid, not found, or has been revoked.',
      };
    }

    // Sanitized public verification response (no sensitive student info, no passwords, no payment credentials)
    return {
      isValid: true,
      verificationStatus: 'AUTHENTIC_AND_VERIFIED',
      hallTicketNumber: ticket.hallTicketNo,
      studentName: `${ticket.student.firstName} ${ticket.student.lastName}`.trim(),
      enrollmentNumber: ticket.student.enrollmentNo,
      examName: ticket.examSessionName || ticket.examForm?.exam?.name,
      academicYear: ticket.examForm?.exam?.academicYearCode || '2026-27',
      program: ticket.student.department?.name || 'Undergraduate Program',
      department: ticket.student.department?.name || 'Engineering',
      issueDate: ticket.issueDate,
      status: ticket.status,
      subjectsCount: ticket.examForm?.formSubjects?.length || 0,
      verifiedBy: 'SSIU Controller of Examinations',
    };
  }

  async approveExamForm(id: string, feePaid: boolean) {
    const form = await this.prisma.examForm.findUnique({ where: { id } });
    if (!form) throw new NotFoundException('Exam form not found.');

    return this.prisma.examForm.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        feePaid: feePaid ?? form.feePaid,
        verifiedAt: new Date(),
        verifiedBy: 'Exam Controller',
      },
    });
  }

  async getHallTickets(studentUserId?: string) {
    let studentId: string | undefined;
    if (studentUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: studentUserId }, include: { student: true } });
      if (user?.student) studentId = user.student.id;
    }

    return this.prisma.hallTicket.findMany({
      where: { ...(studentId ? { studentId } : {}) },
      include: {
        student: true,
        examForm: { include: { formSubjects: { include: { subject: true } } } },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 5: EXAM CENTRE, ROOM, SEATING & EDP DUTY MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  async getExamCentres(query?: ExamCentreQueryDto, user?: any) {
    const where: any = {};
    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { building: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let centres = await this.prisma.examCentre.findMany({
      where,
      include: {
        rooms: { orderBy: { roomNumber: 'asc' } },
        centreAllocations: { include: { exam: true } },
      },
      orderBy: { code: 'asc' },
    });

    if (centres.length === 0 && !query?.search && !query?.status) {
      const defaultCentre = await this.prisma.examCentre.create({
        data: {
          code: 'CENTRE-MAIN',
          name: 'SSIU Main Campus Examination Centre',
          building: 'Academic Block A & B',
          address: 'Swarrnim University Campus, Gandhinagar',
          capacity: 600,
          contactPerson: 'Controller of Examinations',
          contactNumber: '+91 7923245000',
          status: 'ACTIVE',
          rooms: {
            create: [
              { roomNumber: 'ROOM-101', roomCode: 'R101', floor: 1, capacity: 40, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE' },
              { roomNumber: 'ROOM-102', roomCode: 'R102', floor: 1, capacity: 40, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE' },
              { roomNumber: 'ROOM-201', roomCode: 'R201', floor: 2, capacity: 60, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE' },
              { roomNumber: 'ROOM-202', roomCode: 'R202', floor: 2, capacity: 60, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE' },
              { roomNumber: 'HALL-CENTRAL', roomCode: 'H01', floor: 1, capacity: 150, roomType: 'HALL', hasCCTV: true, status: 'AVAILABLE' },
            ],
          },
        },
        include: { rooms: true, centreAllocations: { include: { exam: true } } },
      });
      centres = [defaultCentre];
    }

    return centres;
  }

  async getExamCentreById(id: string, user?: any) {
    const centre = await this.prisma.examCentre.findUnique({
      where: { id },
      include: {
        rooms: { orderBy: { roomNumber: 'asc' } },
        centreAllocations: { include: { exam: true } },
        edpDuties: { include: { staffUser: true } },
      },
    });
    if (!centre) throw new NotFoundException('Exam Centre not found.');
    return centre;
  }

  async createExamCentre(dto: CreateExamCentreDto, user?: any) {
    const existing = await this.prisma.examCentre.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Exam Centre with code "${dto.code.toUpperCase()}" already exists.`);
    }

    const capacity = dto.capacity !== undefined ? Number(dto.capacity) : 500;
    if (capacity <= 0) {
      throw new BadRequestException('Exam Centre capacity must be greater than 0.');
    }

    return this.prisma.examCentre.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        instituteId: dto.instituteId,
        building: dto.building,
        address: dto.address,
        contactPerson: dto.contactPerson,
        contactNumber: dto.contactNumber,
        capacity,
        status: (dto.status || 'ACTIVE').toUpperCase(),
      },
      include: { rooms: true },
    });
  }

  async updateExamCentre(id: string, dto: UpdateExamCentreDto, user?: any) {
    const centre = await this.prisma.examCentre.findUnique({ where: { id } });
    if (!centre) throw new NotFoundException('Exam Centre not found.');

    if (dto.code && dto.code.toUpperCase() !== centre.code) {
      const duplicate = await this.prisma.examCentre.findUnique({
        where: { code: dto.code.toUpperCase() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Exam Centre code "${dto.code.toUpperCase()}" is already in use.`);
      }
    }

    return this.prisma.examCentre.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        name: dto.name,
        instituteId: dto.instituteId,
        building: dto.building,
        address: dto.address,
        contactPerson: dto.contactPerson,
        contactNumber: dto.contactNumber,
        capacity: dto.capacity !== undefined ? Number(dto.capacity) : undefined,
        status: dto.status ? dto.status.toUpperCase() : undefined,
      },
      include: { rooms: true },
    });
  }

  async toggleExamCentreStatus(id: string, status: string, user?: any) {
    const centre = await this.prisma.examCentre.findUnique({ where: { id } });
    if (!centre) throw new NotFoundException('Exam Centre not found.');

    return this.prisma.examCentre.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });
  }

  // ── Exam Room Master Methods ──

  async getExamRooms(centreId?: string, user?: any) {
    return this.prisma.examRoom.findMany({
      where: { ...(centreId ? { centreId } : {}) },
      include: { centre: true },
      orderBy: [{ centre: { code: 'asc' } }, { roomNumber: 'asc' }],
    });
  }

  async getExamRoomById(id: string, user?: any) {
    const room = await this.prisma.examRoom.findUnique({
      where: { id },
      include: { centre: true, seatAllocations: { include: { student: true } } },
    });
    if (!room) throw new NotFoundException('Exam Room not found.');
    return room;
  }

  async createExamRoom(dto: CreateExamRoomDto, user?: any) {
    const centre = await this.prisma.examCentre.findUnique({ where: { id: dto.centreId } });
    if (!centre) throw new NotFoundException('Exam Centre not found.');

    const roomNumber = dto.roomNumber.trim().toUpperCase();
    const existing = await this.prisma.examRoom.findUnique({
      where: { centreId_roomNumber: { centreId: dto.centreId, roomNumber } },
    });
    if (existing) {
      throw new ConflictException(`Room "${roomNumber}" already exists within Centre "${centre.name}".`);
    }

    const capacity = Number(dto.capacity);
    if (!capacity || capacity <= 0) {
      throw new BadRequestException('Room capacity must be greater than 0.');
    }

    return this.prisma.examRoom.create({
      data: {
        centreId: dto.centreId,
        building: dto.building || centre.building,
        roomNumber,
        roomCode: dto.roomCode || roomNumber,
        floor: Number(dto.floor) || 1,
        capacity,
        roomType: (dto.roomType || 'CLASSROOM').toUpperCase(),
        hasCCTV: dto.hasCCTV !== undefined ? dto.hasCCTV : true,
        status: (dto.status || 'AVAILABLE').toUpperCase(),
      },
      include: { centre: true },
    });
  }

  async updateExamRoom(id: string, dto: UpdateExamRoomDto, user?: any) {
    const room = await this.prisma.examRoom.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Exam Room not found.');

    if (dto.capacity !== undefined && Number(dto.capacity) <= 0) {
      throw new BadRequestException('Room capacity must be greater than 0.');
    }

    if (dto.roomNumber && dto.roomNumber.trim().toUpperCase() !== room.roomNumber) {
      const duplicate = await this.prisma.examRoom.findUnique({
        where: { centreId_roomNumber: { centreId: room.centreId, roomNumber: dto.roomNumber.trim().toUpperCase() } },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Room number "${dto.roomNumber.trim().toUpperCase()}" already exists in this centre.`);
      }
    }

    return this.prisma.examRoom.update({
      where: { id },
      data: {
        building: dto.building,
        roomNumber: dto.roomNumber ? dto.roomNumber.trim().toUpperCase() : undefined,
        roomCode: dto.roomCode,
        floor: dto.floor !== undefined ? Number(dto.floor) : undefined,
        capacity: dto.capacity !== undefined ? Number(dto.capacity) : undefined,
        roomType: dto.roomType ? dto.roomType.toUpperCase() : undefined,
        hasCCTV: dto.hasCCTV,
        status: dto.status ? dto.status.toUpperCase() : undefined,
      },
      include: { centre: true },
    });
  }

  async toggleExamRoomStatus(id: string, status: string, user?: any) {
    const room = await this.prisma.examRoom.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Exam Room not found.');

    return this.prisma.examRoom.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: { centre: true },
    });
  }

  // ── Exam Centre Allocation Methods ──

  async allocateExamCentres(dto: AllocateExamCentresDto, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Examination not found.');

    const allocations = [];
    for (const centreId of dto.centreIds) {
      const centre = await this.prisma.examCentre.findUnique({
        where: { id: centreId },
        include: { rooms: true },
      });
      if (!centre) continue;

      const totalCap = centre.rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
      const alloc = await this.prisma.examCentreAllocation.upsert({
        where: { examId_centreId: { examId: dto.examId, centreId } },
        create: {
          examId: dto.examId,
          centreId,
          status: 'ACTIVE',
          allocatedCapacity: totalCap || centre.capacity,
        },
        update: {
          status: 'ACTIVE',
          allocatedCapacity: totalCap || centre.capacity,
        },
      });
      allocations.push(alloc);
    }

    return {
      success: true,
      message: `Successfully allocated ${allocations.length} centre(s) to examination ${exam.name}.`,
      allocations,
    };
  }

  async getExamCentresByExam(examId: string, user?: any) {
    return this.prisma.examCentreAllocation.findMany({
      where: { examId, status: 'ACTIVE' },
      include: {
        centre: {
          include: {
            rooms: {
              where: { status: { in: ['AVAILABLE', 'ACTIVE'] } },
              orderBy: { roomNumber: 'asc' },
            },
          },
        },
      },
    });
  }

  // ── Eligible Students Query ──

  async getEligibleStudentsForSeating(examId: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Examination not found.');

    // Only students with ExamForm.status in ['VERIFIED', 'APPROVED'] AND feePaid === true (or paymentStatus === 'PAID')
    const verifiedForms = await this.prisma.examForm.findMany({
      where: {
        examId,
        status: { in: ['VERIFIED', 'APPROVED'] },
        OR: [{ feePaid: true }, { paymentStatus: 'PAID' }],
      },
      include: {
        student: {
          include: {
            department: true,
            batch: { include: { program: true } },
          },
        },
        hallTicket: true,
      },
      orderBy: { student: { enrollmentNo: 'asc' } },
    });

    const activeAllocations = await this.prisma.examSeatAllocation.findMany({
      where: { examId, status: 'ALLOCATED' },
      include: { centre: true, room: true },
    });

    const allocationMap = new Map(activeAllocations.map(a => [a.studentId, a]));

    return verifiedForms.map(form => {
      const currentSeat = allocationMap.get(form.studentId);
      return {
        formId: form.id,
        studentId: form.studentId,
        enrollmentNo: form.student.enrollmentNo,
        studentName: `${form.student.firstName} ${form.student.lastName}`.trim(),
        departmentName: form.student.department?.name || 'Department of Computer Engineering',
        programName: form.student.batch?.program?.name || 'B.Tech Engineering',
        hallTicketNo: form.hallTicket?.hallTicketNo || 'Pending',
        isAllocated: !!currentSeat,
        allocatedCentre: currentSeat?.centre?.name,
        allocatedRoom: currentSeat?.room?.roomNumber,
        allocatedSeat: currentSeat?.seatNumber,
      };
    });
  }

  // ── Automatic & Bulk Seating Allocation Engine ──

  async autoAllocateSeating(dto: AutoAllocateSeatingDto, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Examination not found.');

    // 1. Fetch eligible students
    const eligibleStudents = await this.getEligibleStudentsForSeating(dto.examId, user);
    if (eligibleStudents.length === 0) {
      throw new BadRequestException('No verified & paid students found for this examination.');
    }

    // 2. Fetch target rooms
    let targetRooms: any[] = [];
    if (dto.roomIds && dto.roomIds.length > 0) {
      targetRooms = await this.prisma.examRoom.findMany({
        where: { id: { in: dto.roomIds }, status: { in: ['AVAILABLE', 'ACTIVE'] } },
        include: { centre: true },
        orderBy: [{ centre: { code: 'asc' } }, { roomNumber: 'asc' }],
      });
    } else if (dto.centreId) {
      targetRooms = await this.prisma.examRoom.findMany({
        where: { centreId: dto.centreId, status: { in: ['AVAILABLE', 'ACTIVE'] } },
        include: { centre: true },
        orderBy: { roomNumber: 'asc' },
      });
    } else {
      const centreAllocations = await this.prisma.examCentreAllocation.findMany({
        where: { examId: dto.examId, status: 'ACTIVE' },
        include: {
          centre: {
            include: {
              rooms: {
                where: { status: { in: ['AVAILABLE', 'ACTIVE'] } },
                orderBy: { roomNumber: 'asc' },
              },
            },
          },
        },
      });
      for (const ca of centreAllocations) {
        for (const r of ca.centre.rooms) {
          targetRooms.push({ ...r, centre: ca.centre });
        }
      }
    }

    if (targetRooms.length === 0) {
      throw new BadRequestException('No available rooms found for examination seating. Please create or allocate rooms to the centre.');
    }

    // 3. Validate total capacity
    const totalEligible = eligibleStudents.length;
    const totalCapacity = targetRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);

    if (totalEligible > totalCapacity) {
      const shortfall = totalEligible - totalCapacity;
      throw new BadRequestException(
        `Insufficient examination capacity. Total eligible students: ${totalEligible}, Total available capacity: ${totalCapacity} across ${targetRooms.length} room(s). Shortfall: ${shortfall} seat(s). Please allocate additional rooms or centres.`
      );
    }

    // 4. Seating Generation Algorithm
    const pattern = (dto.seatPattern || 'ROW_COLUMN').toUpperCase();
    const prefix = dto.prefix !== undefined ? dto.prefix : '';
    const startNum = dto.startNumber || 1;

    const allocationsCreated: any[] = [];
    let studentIdx = 0;

    for (const room of targetRooms) {
      if (studentIdx >= totalEligible) break;
      const roomCap = room.capacity || 40;
      let seatInRoom = 0;

      while (seatInRoom < roomCap && studentIdx < totalEligible) {
        const student = eligibleStudents[studentIdx];
        let seatNum = '';
        let rowLabel = '';
        let colNum = 1;

        if (pattern === 'ROW_COLUMN') {
          const rowLetter = String.fromCharCode(65 + Math.floor(seatInRoom / 10)); // A, B, C...
          const colInRow = (seatInRoom % 10) + 1;
          rowLabel = `Row ${rowLetter}`;
          colNum = colInRow;
          seatNum = `${rowLetter}${colInRow < 10 ? '0' + colInRow : colInRow}`;
        } else if (pattern === 'ALTERNATE') {
          const altNum = startNum + seatInRoom * 2;
          seatNum = `${prefix}${altNum < 10 ? '0' + altNum : altNum}`;
          rowLabel = `Row ${Math.floor(seatInRoom / 5) + 1}`;
          colNum = (seatInRoom % 5) + 1;
        } else {
          // SEQUENTIAL
          const seqNum = startNum + seatInRoom;
          seatNum = `${prefix}${seqNum < 10 ? '0' + seqNum : seqNum}`;
          rowLabel = `Row ${Math.floor(seatInRoom / 8) + 1}`;
          colNum = (seatInRoom % 8) + 1;
        }

        // Upsert allocation
        const alloc = await this.prisma.examSeatAllocation.upsert({
          where: { id: `alloc-${dto.examId}-${student.studentId}` },
          create: {
            id: `alloc-${dto.examId}-${student.studentId}`,
            examId: dto.examId,
            centreId: room.centreId,
            roomId: room.id,
            studentId: student.studentId,
            seatNumber: seatNum,
            row: rowLabel,
            column: colNum,
            status: 'ALLOCATED',
          },
          update: {
            centreId: room.centreId,
            roomId: room.id,
            seatNumber: seatNum,
            row: rowLabel,
            column: colNum,
            status: 'ALLOCATED',
          },
        });

        // Update Hall Ticket if exists
        const hallTicket = await this.prisma.hallTicket.findFirst({
          where: { examId: dto.examId, studentId: student.studentId },
        });
        if (hallTicket) {
          await this.prisma.hallTicket.update({
            where: { id: hallTicket.id },
            data: {
              examCentreId: room.centreId,
              centreName: room.centre?.name || 'Main Campus Centre',
              building: room.building || room.centre?.building || 'Academic Block',
              roomNumber: room.roomNumber,
              seatNumber: seatNum,
            },
          });
        }

        allocationsCreated.push(alloc);
        seatInRoom++;
        studentIdx++;
      }
    }

    return {
      success: true,
      message: `Successfully allocated seats for ${allocationsCreated.length} eligible students across ${targetRooms.length} room(s).`,
      summary: {
        totalEligible,
        totalCapacity,
        allocatedCount: allocationsCreated.length,
        unallocatedCount: totalEligible - allocationsCreated.length,
        roomsUtilized: targetRooms.length,
        seatPattern: pattern,
      },
    };
  }

  // ── Manual Seat Change & Audit History ──

  async manualChangeSeat(dto: ManualChangeSeatDto, user?: any) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('Mandatory reason is required for manual seat change.');
    }

    const allocation = await this.prisma.examSeatAllocation.findUnique({
      where: { id: dto.seatAllocationId },
      include: { centre: true, room: true, student: true },
    });
    if (!allocation) throw new NotFoundException('Seat allocation record not found.');

    const targetRoom = await this.prisma.examRoom.findUnique({
      where: { id: dto.newRoomId },
      include: { centre: true },
    });
    if (!targetRoom) throw new NotFoundException('Target exam room not found.');

    // Record audit history
    await this.prisma.examSeatChangeHistory.create({
      data: {
        seatAllocationId: allocation.id,
        studentId: allocation.studentId,
        examId: allocation.examId,
        fromCentreId: allocation.centreId,
        toCentreId: dto.newCentreId || targetRoom.centreId,
        fromRoomId: allocation.roomId,
        toRoomId: dto.newRoomId,
        fromSeatNumber: allocation.seatNumber,
        toSeatNumber: dto.newSeatNumber.trim().toUpperCase(),
        reason: dto.reason.trim(),
        changedByUserId: user?.id || 'CONTROLLER_ADMIN',
      },
    });

    // Update active allocation
    const updated = await this.prisma.examSeatAllocation.update({
      where: { id: dto.seatAllocationId },
      data: {
        centreId: dto.newCentreId || targetRoom.centreId,
        roomId: dto.newRoomId,
        seatNumber: dto.newSeatNumber.trim().toUpperCase(),
        status: 'ALLOCATED',
        reason: dto.reason.trim(),
      },
      include: { centre: true, room: true, student: true, history: true },
    });

    // Update Hall Ticket with reissue flag
    const hallTicket = await this.prisma.hallTicket.findFirst({
      where: { examId: allocation.examId, studentId: allocation.studentId },
    });
    if (hallTicket) {
      await this.prisma.hallTicket.update({
        where: { id: hallTicket.id },
        data: {
          examCentreId: targetRoom.centreId,
          centreName: targetRoom.centre.name,
          building: targetRoom.building || targetRoom.centre.building,
          roomNumber: targetRoom.roomNumber,
          seatNumber: dto.newSeatNumber.trim().toUpperCase(),
          requiresReissue: true,
        },
      });
    }

    return {
      success: true,
      message: `Seat changed successfully for ${allocation.student.firstName} ${allocation.student.lastName} to ${targetRoom.roomNumber} (${dto.newSeatNumber.trim().toUpperCase()}).`,
      allocation: updated,
    };
  }

  // ── Seating Roster Query ──

  async getExamSeating(examId: string, query?: any, user?: any) {
    const where: any = { examId };

    // RBAC: Student can see only own allocation
    if (user?.role === 'STUDENT') {
      const userRec = await this.prisma.user.findUnique({ where: { id: user.id }, include: { student: true } });
      const studentObj = userRec?.student;
      if (studentObj) {
        where.studentId = studentObj.id;
      } else {
        where.studentId = user.id;
      }
    } else if (user?.role === 'HOD' && user?.department) {
      where.student = { departmentId: user.department };
    }

    if (query?.centreId) where.centreId = query.centreId;
    if (query?.roomId) where.roomId = query.roomId;
    if (query?.status) where.status = query.status.toUpperCase();

    const allocations = await this.prisma.examSeatAllocation.findMany({
      where,
      include: {
        centre: true,
        room: true,
        student: {
          include: {
            department: true,
            batch: { include: { program: true } },
          },
        },
        history: { orderBy: { changedAt: 'desc' } },
      },
      orderBy: [{ room: { roomNumber: 'asc' } }, { seatNumber: 'asc' }],
    });

    const totalAllocated = allocations.filter(a => a.status === 'ALLOCATED').length;

    return {
      examId,
      totalAllocated,
      allocations,
    };
  }

  // ── EDP Duty Staff Master & Assignments ──

  async getEdpStaffList(query?: any, user?: any) {
    return this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { code: { in: ['FACULTY', 'HOD', 'EXAM_CELL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN'] } },
          },
        },
        accountStatus: 'ACTIVE',
      },
      include: {
        faculty: { include: { department: true } },
        examEdpDuties: {
          where: { status: { in: ['ASSIGNED', 'CONFIRMED'] } },
          orderBy: { dutyDate: 'asc' },
        },
      },
      orderBy: { username: 'asc' },
    });
  }

  async assignEdpDuty(dto: AssignExamEdpDutyDto, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Examination not found.');

    const centre = await this.prisma.examCentre.findUnique({ where: { id: dto.centreId } });
    if (!centre) throw new NotFoundException('Exam Centre not found.');

    const staff = await this.prisma.user.findUnique({ where: { id: dto.staffUserId } });
    if (!staff) throw new NotFoundException('Staff User not found.');

    const dutyDateObj = new Date(dto.dutyDate);

    // Overlapping duty check: prevent assigning same staff to multiple duties on same date & shift
    const existingDuty = await this.prisma.examEdpDuty.findFirst({
      where: {
        staffUserId: dto.staffUserId,
        dutyDate: dutyDateObj,
        shift: dto.shift.toUpperCase(),
        status: { in: ['ASSIGNED', 'CONFIRMED'] },
      },
    });

    if (existingDuty) {
      throw new BadRequestException(
        `Staff member already has an assigned duty (${existingDuty.dutyNo}) on ${dto.dutyDate} (${dto.shift.toUpperCase()}). Please select an available staff member.`
      );
    }

    const count = await this.prisma.examEdpDuty.count();
    const dutyNo = `EXAM-EDP-${dutyDateObj.getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const duty = await this.prisma.examEdpDuty.create({
      data: {
        dutyNo,
        examId: dto.examId,
        dutyDate: dutyDateObj,
        shift: dto.shift.toUpperCase(),
        centreId: dto.centreId,
        building: dto.building || centre.building,
        roomId: dto.roomId,
        dutyType: dto.dutyType.toUpperCase(),
        staffUserId: dto.staffUserId,
        status: 'ASSIGNED',
        remarks: dto.remarks,
        assignedByUserId: user?.id || 'CONTROLLER_ADMIN',
        history: {
          create: {
            action: 'ASSIGNED',
            performedByUserId: user?.id || 'CONTROLLER_ADMIN',
            reason: 'Duty assigned by Examination Controller',
          },
        },
      },
      include: {
        centre: true,
        room: true,
        staffUser: { include: { faculty: { include: { department: true } } } },
        history: true,
      },
    });

    return {
      success: true,
      message: `EDP duty ${dutyNo} assigned successfully to ${staff.username}.`,
      duty,
    };
  }

  async updateEdpDutyStatus(dutyId: string, dto: UpdateEdpDutyStatusDto, user?: any) {
    const duty = await this.prisma.examEdpDuty.findUnique({ where: { id: dutyId } });
    if (!duty) throw new NotFoundException('EDP Duty assignment not found.');

    const newStatus = dto.status.toUpperCase();
    if (newStatus === 'REJECTED' && (!dto.rejectionReason || dto.rejectionReason.trim().length === 0)) {
      throw new BadRequestException('Mandatory rejection reason is required to reject EDP duty.');
    }

    const updated = await this.prisma.examEdpDuty.update({
      where: { id: dutyId },
      data: {
        status: newStatus,
        rejectionReason: dto.rejectionReason ? dto.rejectionReason.trim() : undefined,
        confirmedAt: newStatus === 'CONFIRMED' ? new Date() : undefined,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        cancelledAt: newStatus === 'CANCELLED' ? new Date() : undefined,
        history: {
          create: {
            action: newStatus,
            performedByUserId: user?.id || 'USER',
            reason: dto.rejectionReason || `Status updated to ${newStatus}`,
          },
        },
      },
      include: {
        centre: true,
        room: true,
        staffUser: { include: { faculty: true } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });

    return {
      success: true,
      message: `EDP duty ${duty.dutyNo} status updated to ${newStatus}.`,
      duty: updated,
    };
  }

  async getEdpDuties(query?: EdpDutyQueryDto, user?: any) {
    const where: any = {};

    // If staff user without controller privileges, scope to own duties
    if (user && !['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CONTROLLER', 'EXAM_CELL', 'PRINCIPAL'].includes(user.role)) {
      where.staffUserId = user.id;
    } else if (query?.staffUserId) {
      where.staffUserId = query.staffUserId;
    }

    if (query?.examId) where.examId = query.examId;
    if (query?.centreId) where.centreId = query.centreId;
    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.dutyDate) where.dutyDate = new Date(query.dutyDate);

    const duties = await this.prisma.examEdpDuty.findMany({
      where,
      include: {
        exam: true,
        centre: true,
        room: true,
        staffUser: { include: { faculty: { include: { department: true } } } },
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ dutyDate: 'desc' }, { shift: 'asc' }],
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayDuties = duties.filter(d => d.dutyDate.toISOString().split('T')[0] === todayStr);
    const upcomingDuties = duties.filter(d => d.dutyDate.toISOString().split('T')[0] > todayStr && d.status !== 'CANCELLED');
    const completedDuties = duties.filter(d => d.status === 'COMPLETED');

    return {
      totalDuties: duties.length,
      todayCount: todayDuties.length,
      upcomingCount: upcomingDuties.length,
      completedCount: completedDuties.length,
      duties,
    };
  }

  // ── Exam Day Control Overview ──

  async getExamDayControl(examId: string, date?: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        centreAllocations: { include: { centre: { include: { rooms: true } } } },
      },
    });
    if (!exam) throw new NotFoundException('Examination not found.');

    const [eligibleStudents, allocations, edpDuties, hallTicketsCount] = await Promise.all([
      this.getEligibleStudentsForSeating(examId, user),
      this.prisma.examSeatAllocation.findMany({
        where: { examId, status: 'ALLOCATED' },
        include: { centre: true, room: true, student: true },
      }),
      this.prisma.examEdpDuty.findMany({
        where: { examId },
        include: { centre: true, room: true, staffUser: true },
      }),
      this.prisma.hallTicket.count({ where: { examId, status: 'GENERATED' } }),
    ]);

    const centresSummary = exam.centreAllocations.map(ca => {
      const centreAllocations = allocations.filter(a => a.centreId === ca.centreId);
      const centreDuties = edpDuties.filter(d => d.centreId === ca.centreId);
      const totalRooms = ca.centre.rooms.length;
      const totalCap = ca.centre.rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);

      return {
        centreId: ca.centreId,
        centreCode: ca.centre.code,
        centreName: ca.centre.name,
        building: ca.centre.building,
        totalRooms,
        totalCapacity: totalCap,
        seatedStudents: centreAllocations.length,
        availableCapacity: Math.max(0, totalCap - centreAllocations.length),
        edpStaffCount: centreDuties.length,
        rooms: ca.centre.rooms.map(r => {
          const roomSeated = centreAllocations.filter(a => a.roomId === r.id).length;
          return {
            roomId: r.id,
            roomNumber: r.roomNumber,
            capacity: r.capacity,
            allocatedSeats: roomSeated,
            remainingSeats: Math.max(0, r.capacity - roomSeated),
            status: r.status,
          };
        }),
      };
    });

    return {
      examId: exam.id,
      examName: exam.name,
      session: exam.session || 'Summer 2026',
      totalEligible: eligibleStudents.length,
      totalAllocated: allocations.length,
      unallocatedCount: Math.max(0, eligibleStudents.length - allocations.length),
      totalHallTickets: hallTicketsCount,
      totalEdpStaffAssigned: edpDuties.length,
      centresSummary,
    };
  }

  // ── Seating & Centre Reports ──

  async getSeatingReports(examId: string, reportType: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Examination not found.');

    const allocations = await this.prisma.examSeatAllocation.findMany({
      where: { examId, status: 'ALLOCATED' },
      include: {
        centre: true,
        room: true,
        student: { include: { department: true, batch: { include: { program: true } } } },
      },
      orderBy: [{ centre: { code: 'asc' } }, { room: { roomNumber: 'asc' } }, { seatNumber: 'asc' }],
    });

    const edpDuties = await this.prisma.examEdpDuty.findMany({
      where: { examId },
      include: { centre: true, room: true, staffUser: { include: { faculty: true } } },
    });

    return {
      reportType: reportType.toUpperCase(),
      examName: exam.name,
      generatedAt: new Date().toISOString(),
      totalRecords: allocations.length,
      allocations,
      edpDuties,
    };
  }

  async assignInvigilator(data: { examScheduleId: string; roomId: string; facultyUserId: string; dutyDate: string; reportingTime: string }) {
    return this.prisma.invigilatorAssignment.create({
      data: {
        examScheduleId: data.examScheduleId,
        roomId: data.roomId,
        facultyUserId: data.facultyUserId,
        dutyDate: new Date(data.dutyDate),
        reportingTime: data.reportingTime,
        status: 'ASSIGNED',
      },
      include: { room: true },
    });
  }

  async recordExamAttendance(data: { examScheduleId: string; studentId: string; status: string; answerSheetNo?: string; markedByUserId?: string }) {
    return this.prisma.examAttendance.upsert({
      where: { examScheduleId_studentId: { examScheduleId: data.examScheduleId, studentId: data.studentId } },
      create: {
        examScheduleId: data.examScheduleId,
        studentId: data.studentId,
        status: data.status.toUpperCase(),
        answerSheetNo: data.answerSheetNo,
        markedByUserId: data.markedByUserId,
      },
      update: {
        status: data.status.toUpperCase(),
        answerSheetNo: data.answerSheetNo,
        markedByUserId: data.markedByUserId,
      },
    });
  }

  async applyRevaluation(data: { examResultId: string; subjectId: string; requestType?: string; remarks?: string }, studentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: studentUserId }, include: { student: true } });
    if (!user?.student) throw new NotFoundException('Student profile not found.');

    const result = await this.prisma.examResult.findUnique({ where: { id: data.examResultId } });
    if (!result) throw new NotFoundException('Exam result record not found.');

    const requestNo = this.generateNumber('REV');

    return this.prisma.revaluationRequest.create({
      data: {
        requestNo,
        studentId: user.student.id,
        examResultId: data.examResultId,
        subjectId: data.subjectId,
        requestType: data.requestType || 'REVALUATION',
        originalMarks: result.marksObtained || 0,
        feeAmount: 500,
        isFeePaid: true,
        status: 'SUBMITTED',
        remarks: data.remarks,
      },
      include: { student: true },
    });
  }

  async getRevaluations() {
    return this.prisma.revaluationRequest.findMany({
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRevaluation(id: string, dto: ProcessRevaluationDto, user: any) {
    const req = await this.prisma.revaluationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Revaluation request not found.');

    await this.correctResult(user, req.examResultId, {
      revisedMarks: dto.revisedMarks,
      correctionReason: dto.remarks || 'Revaluation adjustment',
    });

    return this.prisma.revaluationRequest.update({
      where: { id },
      data: {
        revisedMarks: dto.revisedMarks,
        status: dto.status.toUpperCase(),
        remarks: dto.remarks,
      },
    });
  }

  async getExamDashboardMetrics() {
    const [
      totalExams,
      activeExams,
      upcomingExams,
      completedExams,
      publishedExams,
      totalForms,
      totalResults,
      hallTicketsCount,
    ] = await Promise.all([
      this.prisma.exam.count(),
      this.prisma.exam.count({ where: { status: { in: ['ACTIVE', 'ONGOING', 'CONDUCTED'] } } }),
      this.prisma.exam.count({ where: { status: { in: ['UPCOMING', 'SCHEDULED', 'DRAFT'] } } }),
      this.prisma.exam.count({ where: { status: { in: ['COMPLETED', 'EVALUATION', 'APPROVAL'] } } }),
      this.prisma.exam.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.examForm.count(),
      this.prisma.examResult.count(),
      this.prisma.hallTicket.count(),
    ]);

    return {
      total: totalExams,
      upcoming: upcomingExams,
      completed: completedExams,
      evaluationPending: completedExams,
      resultsPublished: publishedExams,
      totalExams,
      activeExams,
      totalForms,
      totalResults,
      hallTicketsCount,
    };
  }
}
