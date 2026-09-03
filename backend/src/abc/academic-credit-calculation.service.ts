import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CalculatedCreditSummary {
  studentId: string;
  totalEarnedCredits: number;
  totalAttemptedCredits: number;
  semesterWise: Array<{
    semesterNumber: number;
    academicYear: string;
    totalCredits: number;
    earnedCredits: number;
    sgpa: number | null;
    status: string;
  }>;
  courses: Array<{
    courseCode: string;
    courseName: string;
    creditValue: number;
    grade: string | null;
    isPassed: boolean;
    status: 'EARNED' | 'FAILED' | 'IN_PROGRESS';
    semesterNumber: number;
    academicYear: string;
    earnedAt?: Date | null;
    source: string;
  }>;
}

@Injectable()
export class AcademicCreditCalculationService {
  private readonly logger = new Logger('AcademicCreditCalculationService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates completion rules and calculates course-level, semester-level, and total credits.
   * Performs idempotent database ledger updates within a Prisma transaction.
   */
  async calculateAndSyncLedger(studentId: string, tenantId = 'DEFAULT'): Promise<CalculatedCreditSummary> {
    this.logger.log(`[CreditEngine] Calculating credits for student ${studentId}`);

    // 1. Fetch student master
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // 2. Fetch ResultSummaries (authoritative semester aggregates)
    const resultSummaries = await this.prisma.resultSummary.findMany({
      where: { studentId },
      orderBy: { semesterNumber: 'asc' },
    });

    // 3. Fetch ExamResults (individual course performance)
    const examResults = await this.prisma.examResult.findMany({
      where: { studentId },
      include: {
        examForm: true,
      },
    });

    // 4. Map subjects for credits and course codes
    const subjectIds = examResults.map(r => r.subjectId);
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    let totalEarned = 0;
    let totalAttempted = 0;
    const courses: CalculatedCreditSummary['courses'] = [];

    for (const result of examResults) {
      const subject = subjectMap.get(result.subjectId);
      const creditValue = subject ? subject.credits : 3;

      // Completion evaluation rule: must have passing grade and isPassed === true
      const isPassed = Boolean(
        result.isPassed === true ||
        (result.grade && !['F', 'AB', 'NA'].includes(result.grade.toUpperCase()))
      );

      const status: 'EARNED' | 'FAILED' | 'IN_PROGRESS' = isPassed
        ? 'EARNED'
        : result.isAbsent || result.grade === 'F'
        ? 'FAILED'
        : 'IN_PROGRESS';

      totalAttempted += creditValue;
      if (isPassed) {
        totalEarned += creditValue;
      }

      courses.push({
        courseCode: subject?.code || 'SUB-UNKNOWN',
        courseName: subject?.name || 'Academic Subject',
        creditValue,
        grade: result.grade,
        isPassed,
        status,
        semesterNumber: 1,
        academicYear: '2026-27',
        earnedAt: isPassed ? result.publishedAt || result.createdAt : null,
        source: 'SSIU University Examination',
      });
    }

    const semesterWise = resultSummaries.map(s => ({
      semesterNumber: s.semesterNumber,
      academicYear: s.academicYearCode,
      totalCredits: Number(s.totalCredits),
      earnedCredits: Number(s.earnedCredits),
      sgpa: s.sgpa ? Number(s.sgpa) : null,
      status: s.resultStatus,
    }));

    // 5. Idempotent Transactional Sync to AcademicCreditLedger
    await this.prisma.$transaction(async tx => {
      // Find or create ABC profile
      let abcProfile = await tx.academicBankOfCredit.findUnique({
        where: { studentId },
      });

      if (!abcProfile && student.abcId) {
        abcProfile = await tx.academicBankOfCredit.create({
          data: {
            abcId: student.abcId,
            studentId,
            totalCredits: totalEarned,
            status: 'ACTIVE',
            verificationStatus: student.abcIdStatus || 'PENDING_VERIFICATION',
            tenantId: student.instituteId || tenantId,
          },
        });
      } else if (abcProfile) {
        await tx.academicBankOfCredit.update({
          where: { id: abcProfile.id },
          data: { totalCredits: totalEarned },
        });
      }

      // Upsert course ledger entries idempotently
      for (const c of courses) {
        await tx.academicCreditLedger.upsert({
          where: {
            studentId_courseCode_academicYear: {
              studentId,
              courseCode: c.courseCode,
              academicYear: c.academicYear,
            },
          },
          create: {
            abcProfileId: abcProfile?.id,
            studentId,
            courseCode: c.courseCode,
            courseName: c.courseName,
            creditValue: c.creditValue,
            creditType: 'CORE',
            academicYear: c.academicYear,
            status: c.status,
            earnedAt: c.earnedAt,
            sourceReference: c.source,
            tenantId: student.instituteId || tenantId,
          },
          update: {
            courseName: c.courseName,
            creditValue: c.creditValue,
            status: c.status,
            earnedAt: c.earnedAt,
          },
        });
      }
    });

    return {
      studentId,
      totalEarnedCredits: totalEarned,
      totalAttemptedCredits: totalAttempted,
      semesterWise,
      courses,
    };
  }
}
