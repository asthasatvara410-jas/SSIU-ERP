import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type ExamStatus = 'DRAFT' | 'FORM_OPEN' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'RESULT_DECLARED';
export type ExamEligibilityStatus = 'ELIGIBLE' | 'CONDITIONAL' | 'NOT_ELIGIBLE' | 'OVERRIDDEN';
export type ExamFormStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ExamAttendanceStatus = 'PRESENT' | 'ABSENT' | 'MALPRACTICE';
export type AcademicProgressionStatus = 'PROMOTED' | 'CONDITIONAL' | 'NOT_PROMOTED' | 'PASSED';

export interface ExaminationMasterRecord {
  id: string;
  name: string;
  examCode: string;
  academicYearId: string;
  semesterId: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
}

export interface ExamEligibilityRecord {
  id: string;
  examinationId: string;
  studentId: string;
  attendancePercentage: number;
  feeClearanceStatus: 'PAID' | 'PENDING';
  status: ExamEligibilityStatus;
  overrideReason?: string;
  overriddenByUserId?: string;
}

export interface ExamFormRecord {
  id: string;
  examinationId: string;
  studentId: string;
  applicationNumber: string;
  submittedAt: string;
  status: ExamFormStatus;
  verifiedByUserId?: string;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    attemptType: 'REGULAR' | 'BACKLOG' | 'IMPROVEMENT';
  }>;
}

export interface HallTicketRecord {
  id: string;
  hallTicketNumber: string;
  examFormId: string;
  studentId: string;
  examinationId: string;
  seatNumber: string;
  centreName: string;
  issuedAt: string;
  status: 'ISSUED' | 'CANCELLED';
}

export interface MarkEntryRecord {
  id: string;
  examinationId: string;
  studentId: string;
  subjectId: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  maxMarks: number;
  status: 'DRAFT' | 'SUBMITTED' | 'LOCKED';
}

export interface SubjectResultDetail {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  status: 'PASS' | 'FAIL';
}

export interface StudentResultRecord {
  id: string;
  examinationId: string;
  studentId: string;
  semester: number;
  subjectResults: SubjectResultDetail[];
  totalCredits: number;
  earnedCredits: number;
  sgpa: number;
  cgpa: number;
  backlogsCount: number;
  resultStatus: 'PASS' | 'FAIL' | 'ATKT';
  declaredAt: string;
}

export interface RevaluationRequestRecord {
  id: string;
  studentId: string;
  examinationId: string;
  subjectId: string;
  originalMarks: number;
  revisedMarks?: number;
  finalMarks?: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
}

export interface AcademicProgressionRecord {
  studentId: string;
  currentSemester: number;
  totalCreditsEarned: number;
  cgpa: number;
  activeBacklogsCount: number;
  progressionStatus: AcademicProgressionStatus;
  eligibleForNextSemester: boolean;
}

class ExaminationProgressionGovernanceService {
  private static instance: ExaminationProgressionGovernanceService;

  private examinations: ExaminationMasterRecord[] = [
    {
      id: 'exam-winter-2026',
      name: 'Winter 2026 Regular & Backlog End Semester Examination',
      examCode: 'EXAM-W26-BTECH',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-3',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      programId: 'prog-1',
      startDate: '2026-11-15',
      endDate: '2026-12-05',
      status: 'FORM_OPEN'
    }
  ];

  private eligibilities: ExamEligibilityRecord[] = [
    { id: 'el-01', examinationId: 'exam-winter-2026', studentId: 'stud-001', attendancePercentage: 80, feeClearanceStatus: 'PAID', status: 'ELIGIBLE' },
    { id: 'el-02', examinationId: 'exam-winter-2026', studentId: 'stud-002', attendancePercentage: 25, feeClearanceStatus: 'PAID', status: 'NOT_ELIGIBLE' }
  ];

  private examForms: ExamFormRecord[] = [
    {
      id: 'ef-01',
      examinationId: 'exam-winter-2026',
      studentId: 'stud-001',
      applicationNumber: 'EXF-2026-00918',
      submittedAt: '2026-08-20T10:00:00Z',
      status: 'APPROVED',
      verifiedByUserId: 'usr-hod-01',
      subjects: [
        { subjectId: 'sub-dbms', subjectName: 'Database Management Systems', attemptType: 'REGULAR' },
        { subjectId: 'sub-os', subjectName: 'Operating Systems', attemptType: 'REGULAR' }
      ]
    }
  ];

  private hallTickets: HallTicketRecord[] = [
    {
      id: 'ht-01',
      hallTicketNumber: 'HT-SSIU-W26-10029',
      examFormId: 'ef-01',
      studentId: 'stud-001',
      examinationId: 'exam-winter-2026',
      seatNumber: 'SIT-CSE-042',
      centreName: 'Swarrnim Institute of Technology - Block B',
      issuedAt: '2026-08-22T12:00:00Z',
      status: 'ISSUED'
    }
  ];

  private results: StudentResultRecord[] = [
    {
      id: 'res-stud-001-sem2',
      examinationId: 'exam-summer-2026',
      studentId: 'stud-001',
      semester: 2,
      subjectResults: [
        { subjectId: 'sub-ds', subjectCode: 'CS201', subjectName: 'Data Structures & Algorithms', credits: 4, marksObtained: 85, maxMarks: 100, grade: 'AA', gradePoint: 10, status: 'PASS' },
        { subjectId: 'sub-maths', subjectCode: 'MA201', subjectName: 'Discrete Mathematics', credits: 4, marksObtained: 72, maxMarks: 100, grade: 'AB', gradePoint: 9, status: 'PASS' }
      ],
      totalCredits: 8,
      earnedCredits: 8,
      sgpa: 9.5,
      cgpa: 9.2,
      backlogsCount: 0,
      resultStatus: 'PASS',
      declaredAt: '2026-06-30T15:00:00Z'
    }
  ];

  private revaluations: RevaluationRequestRecord[] = [];

  private constructor() {}

  public static getInstance(): ExaminationProgressionGovernanceService {
    if (!ExaminationProgressionGovernanceService.instance) {
      ExaminationProgressionGovernanceService.instance = new ExaminationProgressionGovernanceService();
    }
    return ExaminationProgressionGovernanceService.instance;
  }

  // ─── ELIGIBILITY EVALUATION ───────────────────────────────────────────

  public evaluateEligibility(studentId: string, examinationId: string): ExamEligibilityRecord {
    const existing = this.eligibilities.find(e => e.studentId === studentId && e.examinationId === examinationId);
    if (existing) return existing;

    const newRecord: ExamEligibilityRecord = {
      id: `el-${Date.now()}`,
      examinationId,
      studentId,
      attendancePercentage: 78,
      feeClearanceStatus: 'PAID',
      status: 'ELIGIBLE'
    };
    this.eligibilities.push(newRecord);
    return newRecord;
  }

  public overrideEligibility(eligibilityId: string, reason: string, approverUserId: string): ExamEligibilityRecord {
    const el = this.eligibilities.find(e => e.id === eligibilityId);
    if (!el) throw new Error(`Eligibility record ${eligibilityId} not found`);

    el.status = 'OVERRIDDEN';
    el.overrideReason = reason;
    el.overriddenByUserId = approverUserId;
    return el;
  }

  // ─── SGPA / CGPA & ACADEMIC PROGRESSION ────────────────────────────────

  public calculateSgpa(subjectResults: SubjectResultDetail[]): number {
    const totalCredits = subjectResults.reduce((sum, s) => sum + s.credits, 0);
    if (totalCredits === 0) return 0;

    const totalWeightedPoints = subjectResults.reduce((sum, s) => sum + (s.credits * s.gradePoint), 0);
    return Number((totalWeightedPoints / totalCredits).toFixed(2));
  }

  public evaluateAcademicProgression(studentId: string): AcademicProgressionRecord {
    const studentResults = this.results.filter(r => r.studentId === studentId);
    const totalEarnedCredits = studentResults.reduce((sum, r) => sum + r.earnedCredits, 0);
    const activeBacklogs = studentResults.reduce((sum, r) => sum + r.backlogsCount, 0);
    const averageCgpa = studentResults.length > 0
      ? Number((studentResults.reduce((sum, r) => sum + r.sgpa, 0) / studentResults.length).toFixed(2))
      : 0;

    const isEligible = activeBacklogs <= 3;

    return {
      studentId,
      currentSemester: 3,
      totalCreditsEarned: totalEarnedCredits,
      cgpa: averageCgpa,
      activeBacklogsCount: activeBacklogs,
      progressionStatus: isEligible ? 'PROMOTED' : 'CONDITIONAL',
      eligibleForNextSemester: isEligible
    };
  }

  // ─── REVALUATION WORKFLOW ──────────────────────────────────────────────

  public applyRevaluation(request: Omit<RevaluationRequestRecord, 'id' | 'status' | 'requestedAt'>): RevaluationRequestRecord {
    const newReq: RevaluationRequestRecord = {
      id: `rev-${Date.now()}`,
      ...request,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString()
    };
    this.revaluations.push(newReq);
    return newReq;
  }

  public completeRevaluation(requestId: string, revisedMarks: number): RevaluationRequestRecord {
    const req = this.revaluations.find(r => r.id === requestId);
    if (!req) throw new Error(`Revaluation request ${requestId} not found`);

    req.revisedMarks = revisedMarks;
    req.finalMarks = Math.max(req.originalMarks, revisedMarks); // Benefit to student policy
    req.status = 'COMPLETED';
    req.processedAt = new Date().toISOString();
    return req;
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getStudentResult(studentId: string, context?: UserAuthorizationContext): StudentResultRecord | undefined {
    // RBAC: If student, prevent viewing other student's result
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }
    return this.results.find(r => r.studentId === studentId);
  }
}

export const examinationProgressionGovernanceService = ExaminationProgressionGovernanceService.getInstance();
