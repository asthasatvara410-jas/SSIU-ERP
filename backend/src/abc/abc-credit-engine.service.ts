import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreditEvaluationResult {
  totalEarnedCredits: number;
  totalAttemptedCredits: number;
  semesterWise: Array<{
    semesterNumber: number;
    academicYear: string;
    totalCredits: number;
    earnedCredits: number;
    sgpa: number | null;
    coursesCount: number;
    status: string;
  }>;
  courses: Array<{
    courseCode: string;
    courseName: string;
    creditValue: number;
    grade: string | null;
    isPassed: boolean;
    status: string;
    semesterNumber: number;
  }>;
}

@Injectable()
export class AbcCreditEngineService {
  private readonly logger = new Logger('AbcCreditEngineService');

  constructor(private readonly prisma: PrismaService) {}

  async calculateStudentCredits(studentId: string): Promise<CreditEvaluationResult> {
    this.logger.log(`[CreditEngine] Computing earned credits for student ${studentId}`);

    // 1. Fetch student result summaries
    const resultSummaries = await this.prisma.resultSummary.findMany({
      where: { studentId },
      orderBy: { semesterNumber: 'asc' },
    });

    // 2. Fetch subject results
    const examResults = await this.prisma.examResult.findMany({
      where: { studentId },
      include: {
        examForm: true,
      },
    });

    // 3. Fetch subjects map for titles/credits
    const subjectIds = examResults.map(r => r.subjectId);
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    let totalEarned = 0;
    let totalAttempted = 0;
    const courses: CreditEvaluationResult['courses'] = [];

    for (const result of examResults) {
      const subject = subjectMap.get(result.subjectId);
      const creditValue = subject ? subject.credits : 3;
      const isPassed = result.isPassed ?? (result.grade !== 'F' && result.grade !== 'AB');
      const status = isPassed ? 'EARNED' : (result.isAbsent ? 'FAILED' : 'IN_PROGRESS');

      totalAttempted += creditValue;
      if (isPassed) {
        totalEarned += creditValue;
      }

      courses.push({
        courseCode: subject?.code || 'UNKNOWN',
        courseName: subject?.name || 'Academic Course',
        creditValue,
        grade: result.grade,
        isPassed: Boolean(isPassed),
        status,
        semesterNumber: 1,
      });
    }

    const semesterWise = resultSummaries.map(summary => ({
      semesterNumber: summary.semesterNumber,
      academicYear: summary.academicYearCode,
      totalCredits: Number(summary.totalCredits),
      earnedCredits: Number(summary.earnedCredits),
      sgpa: summary.sgpa ? Number(summary.sgpa) : null,
      coursesCount: courses.length,
      status: summary.resultStatus,
    }));

    return {
      totalEarnedCredits: totalEarned,
      totalAttemptedCredits: totalAttempted,
      semesterWise,
      courses,
    };
  }
}
