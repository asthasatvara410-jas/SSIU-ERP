import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface ExamFormDossierRecord {
  id: string;
  examFormNumber: string;
  studentId: string;
  enrollmentNumber: string;
  examSessionId: string;
  semesterNumber: number;
  courseCodes: string[];
  attendancePercentage: number;
  internalMarksPublished: boolean;
  examFeePaid: boolean;
  eligibilityStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  ineligibilityReason?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export interface ExamMarkEvaluationRecord {
  courseCode: string;
  internalMarks: number; // Max 50, Pass: 20
  externalMarks: number; // Max 50, Pass: 20
  moderatedMarks: number;
  graceMarksAwarded: number;
  totalMarks: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  gradePoint: number;
  isBacklog: boolean;
}

export interface PublishedGradeCardRecord {
  id: string;
  studentId: string;
  enrollmentNumber: string;
  examSessionId: string;
  semesterNumber: number;
  results: ExamMarkEvaluationRecord[];
  totalCreditsEarned: number;
  sgpa: number;
  resultStatus: 'PASS' | 'FAIL' | 'ATKT';
  resultVersion: number;
  isPublished: boolean;
  verificationCode: string;
}

class ExaminationResultCompleteLifecycleService {
  private static instance: ExaminationResultCompleteLifecycleService;

  private examForms: ExamFormDossierRecord[] = [
    {
      id: 'exf-2026-001',
      examFormNumber: 'EXF-2026-000101',
      studentId: 'stud-001',
      enrollmentNumber: 'SSIU26BCA000059',
      examSessionId: 'sess-winter-2026',
      semesterNumber: 1,
      courseCodes: ['CS-101', 'CS-102'],
      attendancePercentage: 85,
      internalMarksPublished: true,
      examFeePaid: true,
      eligibilityStatus: 'ELIGIBLE',
      status: 'APPROVED'
    }
  ];

  private gradeCards: PublishedGradeCardRecord[] = [];

  private constructor() {}

  public static getInstance(): ExaminationResultCompleteLifecycleService {
    if (!ExaminationResultCompleteLifecycleService.instance) {
      ExaminationResultCompleteLifecycleService.instance = new ExaminationResultCompleteLifecycleService();
    }
    return ExaminationResultCompleteLifecycleService.instance;
  }

  // ─── ELIGIBILITY EVALUATION ENGINE ────────────────────────────────────

  public evaluateExamEligibility(params: {
    attendancePercentage: number;
    internalMarksPublished: boolean;
    examFeePaid: boolean;
  }): { isEligible: boolean; reason?: string } {
    if (params.attendancePercentage < 75) {
      return { isEligible: false, reason: `Attendance short (${params.attendancePercentage}% < 75% threshold)` };
    }
    if (!params.internalMarksPublished) {
      return { isEligible: false, reason: 'Continuous internal assessment marks not published' };
    }
    if (!params.examFeePaid) {
      return { isEligible: false, reason: 'Examination fee payment pending' };
    }
    return { isEligible: true };
  }

  // ─── GRACE MARKS & MODERATION EVALUATION ENGINE ───────────────────────

  public computeSubjectResultWithGrace(params: {
    internalMarks: number;
    externalMarks: number;
    maxGraceAllowed?: number;
  }): ExamMarkEvaluationRecord & { courseCode: string } {
    const rawTotal = params.internalMarks + params.externalMarks;
    const maxGrace = params.maxGraceAllowed || 5;
    let graceMarksAwarded = 0;
    let finalTotal = rawTotal;

    // Passing threshold is 40. If rawTotal between 35 and 39, award grace marks
    if (rawTotal < 40 && (40 - rawTotal) <= maxGrace) {
      graceMarksAwarded = 40 - rawTotal;
      finalTotal = 40;
    }

    let grade: ExamMarkEvaluationRecord['grade'] = 'F';
    let gradePoint = 0;
    let isBacklog = true;

    if (finalTotal >= 85) { grade = 'A+'; gradePoint = 10; isBacklog = false; }
    else if (finalTotal >= 75) { grade = 'A'; gradePoint = 9; isBacklog = false; }
    else if (finalTotal >= 65) { grade = 'B+'; gradePoint = 8; isBacklog = false; }
    else if (finalTotal >= 55) { grade = 'B'; gradePoint = 7; isBacklog = false; }
    else if (finalTotal >= 45) { grade = 'C'; gradePoint = 6; isBacklog = false; }
    else if (finalTotal >= 40) { grade = 'D'; gradePoint = 5; isBacklog = false; }

    return {
      courseCode: '',
      internalMarks: params.internalMarks,
      externalMarks: params.externalMarks,
      moderatedMarks: rawTotal,
      graceMarksAwarded,
      totalMarks: finalTotal,
      grade,
      gradePoint,
      isBacklog
    };
  }

  // ─── OFFICIAL GRADE CARD PUBLICATION & REVALUATION VERSIONING ─────────

  public publishOfficialGradeCard(params: {
    studentId: string;
    enrollmentNumber: string;
    examSessionId: string;
    semesterNumber: number;
    evaluatedSubjects: {
      courseCode: string;
      internalMarks: number;
      externalMarks: number;
      credits: number;
    }[];
  }): PublishedGradeCardRecord {
    let totalCreditsEarned = 0;
    let totalCreditsRegistered = 0;
    let weightedPointsTotal = 0;
    let hasBacklog = false;

    const results: ExamMarkEvaluationRecord[] = params.evaluatedSubjects.map(sub => {
      const computed = this.computeSubjectResultWithGrace({
        internalMarks: sub.internalMarks,
        externalMarks: sub.externalMarks
      });
      computed.courseCode = sub.courseCode;

      totalCreditsRegistered += sub.credits;
      if (!computed.isBacklog) {
        totalCreditsEarned += sub.credits;
        weightedPointsTotal += sub.credits * computed.gradePoint;
      } else {
        hasBacklog = true;
      }

      return computed;
    });

    const sgpa = totalCreditsRegistered > 0
      ? Number((weightedPointsTotal / totalCreditsRegistered).toFixed(2))
      : 0;

    const existingCard = this.gradeCards.find(g => g.studentId === params.studentId && g.examSessionId === params.examSessionId);
    const version = existingCard ? existingCard.resultVersion + 1 : 1;

    const gradeCard: PublishedGradeCardRecord = {
      id: `gc-${Date.now()}`,
      studentId: params.studentId,
      enrollmentNumber: params.enrollmentNumber,
      examSessionId: params.examSessionId,
      semesterNumber: params.semesterNumber,
      results,
      totalCreditsEarned,
      sgpa,
      resultStatus: hasBacklog ? 'ATKT' : 'PASS',
      resultVersion: version,
      isPublished: true,
      verificationCode: `VER-GC-${Math.floor(100000 + Math.random() * 900000)}`
    };

    this.gradeCards.push(gradeCard);
    return gradeCard;
  }
}

export const examinationResultCompleteLifecycleService = ExaminationResultCompleteLifecycleService.getInstance();
