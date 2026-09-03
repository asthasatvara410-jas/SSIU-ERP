import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralFinanceGovernanceService } from './centralFinanceGovernanceService';

export interface ExamSubjectResultRecord {
  courseCode: string;
  courseName: string;
  credits: number;
  internalMarks: number; // Max 50
  externalMarks: number; // Max 50
  totalMarks: number;    // Max 100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  gradePoint: number;
  isBacklog: boolean;
}

export interface StudentSemesterResultRecord {
  id: string;
  studentId: string;
  enrollmentNumber: string;
  examSessionId: string;
  semesterNumber: number;
  subjects: ExamSubjectResultRecord[];
  totalCreditsRegistered: number;
  totalCreditsEarned: number;
  sgpa: number;
  cgpa: number;
  resultStatus: 'PASS' | 'FAIL' | 'WITHHELD';
  isDeclared: boolean;
  version: number;
}

export interface HallTicketRecord {
  id: string;
  studentId: string;
  enrollmentNumber: string;
  examSessionId: string;
  hallTicketNumber: string;
  centerName: string;
  roomNumber: string;
  seatNumber: string;
  status: 'GENERATED' | 'PUBLISHED' | 'CANCELLED';
}

class ExaminationResultGovernanceService {
  private static instance: ExaminationResultGovernanceService;

  private results: StudentSemesterResultRecord[] = [];
  private hallTickets: HallTicketRecord[] = [
    {
      id: 'ht-01',
      studentId: 'stud-001',
      enrollmentNumber: 'SSIU26BCA000059',
      examSessionId: 'sess-winter-2026',
      hallTicketNumber: 'HT-2026-W-00412',
      centerName: 'SIT Main Exam Block',
      roomNumber: 'LH-101',
      seatNumber: 'A-12',
      status: 'PUBLISHED'
    }
  ];

  private constructor() {}

  public static getInstance(): ExaminationResultGovernanceService {
    if (!ExaminationResultGovernanceService.instance) {
      ExaminationResultGovernanceService.instance = new ExaminationResultGovernanceService();
    }
    return ExaminationResultGovernanceService.instance;
  }

  // ─── GRADE & GRADE POINT CALCULATION ENGINE ───────────────────────────

  public calculateGradeAndPoints(totalMarks: number): { grade: ExamSubjectResultRecord['grade']; gradePoint: number; isBacklog: boolean } {
    if (totalMarks >= 85) return { grade: 'A+', gradePoint: 10, isBacklog: false };
    if (totalMarks >= 75) return { grade: 'A', gradePoint: 9, isBacklog: false };
    if (totalMarks >= 65) return { grade: 'B+', gradePoint: 8, isBacklog: false };
    if (totalMarks >= 55) return { grade: 'B', gradePoint: 7, isBacklog: false };
    if (totalMarks >= 45) return { grade: 'C', gradePoint: 6, isBacklog: false };
    if (totalMarks >= 40) return { grade: 'D', gradePoint: 5, isBacklog: false };
    return { grade: 'F', gradePoint: 0, isBacklog: true };
  }

  // ─── OFFICIAL SGPA & RESULT PROCESSING ENGINE ─────────────────────────

  public processSemesterResult(params: {
    studentId: string;
    enrollmentNumber: string;
    examSessionId: string;
    semesterNumber: number;
    subjectMarks: {
      courseCode: string;
      courseName: string;
      credits: number;
      internalMarks: number;
      externalMarks: number;
    }[];
  }): StudentSemesterResultRecord {
    let totalWeightedPoints = 0;
    let totalCreditsRegistered = 0;
    let totalCreditsEarned = 0;
    let hasFail = false;

    const subjects: ExamSubjectResultRecord[] = params.subjectMarks.map(sub => {
      const totalMarks = sub.internalMarks + sub.externalMarks;
      const { grade, gradePoint, isBacklog } = this.calculateGradeAndPoints(totalMarks);

      totalCreditsRegistered += sub.credits;
      if (!isBacklog) {
        totalCreditsEarned += sub.credits;
        totalWeightedPoints += sub.credits * gradePoint;
      } else {
        hasFail = true;
      }

      return {
        courseCode: sub.courseCode,
        courseName: sub.courseName,
        credits: sub.credits,
        internalMarks: sub.internalMarks,
        externalMarks: sub.externalMarks,
        totalMarks,
        grade,
        gradePoint,
        isBacklog
      };
    });

    const sgpa = totalCreditsRegistered > 0
      ? Number((totalWeightedPoints / totalCreditsRegistered).toFixed(2))
      : 0;

    const newResult: StudentSemesterResultRecord = {
      id: `res-${Date.now()}`,
      studentId: params.studentId,
      enrollmentNumber: params.enrollmentNumber,
      examSessionId: params.examSessionId,
      semesterNumber: params.semesterNumber,
      subjects,
      totalCreditsRegistered,
      totalCreditsEarned,
      sgpa,
      cgpa: sgpa, // In single semester scope
      resultStatus: hasFail ? 'FAIL' : 'PASS',
      isDeclared: true,
      version: 1
    };

    this.results.push(newResult);
    return newResult;
  }

  // ─── HALL TICKET & SEATING ────────────────────────────────────────────

  public getHallTicket(studentId: string, examSessionId: string): HallTicketRecord | undefined {
    return this.hallTickets.find(h => h.studentId === studentId && h.examSessionId === examSessionId);
  }
}

export const examinationResultGovernanceService = ExaminationResultGovernanceService.getInstance();
