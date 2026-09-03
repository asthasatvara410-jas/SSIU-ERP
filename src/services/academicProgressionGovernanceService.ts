import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type AttendanceItemStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'ON_DUTY';
export type AcademicRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AttendanceSessionRecord {
  id: string;
  classSessionId: string;
  courseCode: string;
  sectionName: string;
  facultyId: string;
  date: string;
  status: 'OPEN' | 'SUBMITTED' | 'LOCKED';
}

export interface AttendanceItemRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceItemStatus;
}

export interface ExamRegistrationRecord {
  id: string;
  examId: string;
  studentId: string;
  isEligible: boolean;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  hallTicketNumber?: string;
}

export interface StudentCourseResultRecord {
  id: string;
  studentId: string;
  courseCode: string;
  academicTermId: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  credits: number;
  attempt: number;
  status: 'PASS' | 'FAIL' | 'WITHHELD';
  version: number;
}

export interface StudentAcademicProgressSummary {
  studentId: string;
  totalCreditsEarned: number;
  currentSGPA: number;
  cumulativeCGPA: number;
  backlogsCount: number;
  overallAttendancePercentage: number;
  riskLevel: AcademicRiskLevel;
}

class AcademicProgressionGovernanceService {
  private static instance: AcademicProgressionGovernanceService;

  private attendanceSessions: AttendanceSessionRecord[] = [
    {
      id: 'att-sess-01',
      classSessionId: 'cs-01',
      courseCode: 'CS301',
      sectionName: 'CSE-A',
      facultyId: 'emp-fac-101',
      date: '2026-08-25',
      status: 'LOCKED'
    }
  ];

  private attendanceItems: AttendanceItemRecord[] = [
    { id: 'att-item-1', sessionId: 'att-sess-01', studentId: 'stud-001', status: 'PRESENT' },
    { id: 'att-item-2', sessionId: 'att-sess-01', studentId: 'stud-002', status: 'ABSENT' }
  ];

  private examRegistrations: ExamRegistrationRecord[] = [
    { id: 'ex-reg-01', examId: 'exam-2026-endsem', studentId: 'stud-001', isEligible: true, status: 'APPROVED', hallTicketNumber: 'HT-2026-0042' }
  ];

  private results: StudentCourseResultRecord[] = [
    {
      id: 'res-01',
      studentId: 'stud-001',
      courseCode: 'CS301',
      academicTermId: 'term-2026-sem3',
      marksObtained: 85,
      maxMarks: 100,
      grade: 'AA',
      gradePoint: 10,
      credits: 4,
      attempt: 1,
      status: 'PASS',
      version: 1
    },
    {
      id: 'res-02',
      studentId: 'stud-001',
      courseCode: 'CS302',
      academicTermId: 'term-2026-sem3',
      marksObtained: 76,
      maxMarks: 100,
      grade: 'AB',
      gradePoint: 9,
      credits: 4,
      attempt: 1,
      status: 'PASS',
      version: 1
    }
  ];

  private constructor() {}

  public static getInstance(): AcademicProgressionGovernanceService {
    if (!AcademicProgressionGovernanceService.instance) {
      AcademicProgressionGovernanceService.instance = new AcademicProgressionGovernanceService();
    }
    return AcademicProgressionGovernanceService.instance;
  }

  // ─── ATTENDANCE & SHORTAGE ENGINE ─────────────────────────────────────

  public calculateAttendancePercentage(studentId: string): number {
    const records = this.attendanceItems.filter(i => i.studentId === studentId);
    if (records.length === 0) return 100;

    const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY' || r.status === 'EXCUSED').length;
    return Math.round((presentCount / records.length) * 100);
  }

  // ─── SGPA & CGPA ENGINE ───────────────────────────────────────────────

  public calculateSGPA(studentId: string, academicTermId: string): number {
    const termResults = this.results.filter(r => r.studentId === studentId && r.academicTermId === academicTermId && r.status === 'PASS');
    if (termResults.length === 0) return 0;

    const totalWeightedPoints = termResults.reduce((sum, r) => sum + (r.credits * r.gradePoint), 0);
    const totalCredits = termResults.reduce((sum, r) => sum + r.credits, 0);

    return Number((totalWeightedPoints / totalCredits).toFixed(2));
  }

  // ─── ACADEMIC RISK ASSESSMENT ─────────────────────────────────────────

  public getAcademicProgressSummary(studentId: string, context?: UserAuthorizationContext): StudentAcademicProgressSummary | undefined {
    // RBAC: If student, restrict to self
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    const attendancePct = this.calculateAttendancePercentage(studentId);
    const sgpa = this.calculateSGPA(studentId, 'term-2026-sem3');
    const studentResults = this.results.filter(r => r.studentId === studentId);
    const backlogs = studentResults.filter(r => r.status === 'FAIL').length;
    const credits = studentResults.filter(r => r.status === 'PASS').reduce((sum, r) => sum + r.credits, 0);

    let riskLevel: AcademicRiskLevel = 'LOW';
    if (attendancePct < 65 || backlogs >= 3) {
      riskLevel = 'CRITICAL';
    } else if (attendancePct < 75 || backlogs > 0) {
      riskLevel = 'HIGH';
    } else if (sgpa < 6.0 && sgpa > 0) {
      riskLevel = 'MEDIUM';
    }

    return {
      studentId,
      totalCreditsEarned: credits,
      currentSGPA: sgpa,
      cumulativeCGPA: sgpa,
      backlogsCount: backlogs,
      overallAttendancePercentage: attendancePct,
      riskLevel
    };
  }
}

export const academicProgressionGovernanceService = AcademicProgressionGovernanceService.getInstance();
