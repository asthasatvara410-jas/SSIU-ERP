import { db } from './db';
import { academicStructureService } from './academicStructureService';
import { UserAuthorizationContext, UserRole } from '../types';

export type ExamType = 'MID_TERM' | 'END_SEMESTER' | 'SUPPLEMENTARY' | 'BACKLOG' | 'REVALUATION';
export type ExamStatus = 'DRAFT' | 'OPEN_FOR_FORMS' | 'FORMS_CLOSED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESULT_PROCESSING' | 'RESULT_PUBLISHED' | 'CLOSED';
export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'BLOCKED' | 'PENDING';
export type ExamFormStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED';
export type ExamFeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type ResultGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export interface ExaminationRecord {
  id: string;
  universityId: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  name: string;
  code: string;
  examType: ExamType;
  academicYearId: string;
  semesterId: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  createdAt: string;
}

export interface ExamSubjectRecord {
  id: string;
  examinationId: string;
  subjectOfferingId: string;
  subjectCode: string;
  subjectName: string;
  maximumMarks: number;
  passingMarks: number;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface ExamEligibilityRecord {
  id: string;
  examinationId: string;
  studentId: string;
  status: EligibilityStatus;
  reason?: string;
  calculatedAt: string;
}

export interface ExamFormRecord {
  id: string;
  examinationId: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  status: ExamFormStatus;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
  registeredSubjectIds: string[];
  remarks?: string;
}

export interface ExamFeeTransactionRecord {
  id: string;
  examinationId: string;
  examFormId: string;
  studentId: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: ExamFeeStatus;
  transactionReference?: string;
  paymentDate?: string;
}

export interface ExamScheduleRecord {
  id: string;
  examinationId: string;
  examSubjectId: string;
  subjectCode: string;
  date: string;
  startTime: string; // "10:00"
  endTime: string;   // "13:00"
  roomId: string;
  roomNumber: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
}

export interface ExamSeatAssignmentRecord {
  id: string;
  examinationId: string;
  examScheduleId: string;
  studentId: string;
  roomId: string;
  seatNumber: string;
}

export interface InvigilationAssignmentRecord {
  id: string;
  examScheduleId: string;
  facultyId: string;
  facultyName: string;
  roomId: string;
  role: 'CHIEF_INVIGILATOR' | 'INVIGILATOR' | 'RELIEF';
  status: 'ASSIGNED' | 'CONFIRMED';
}

export interface ExamAttendanceRecord {
  id: string;
  examScheduleId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'MALPRACTICE';
  markedAt: string;
  markedByUserId: string;
}

export interface ExamMarksRecord {
  id: string;
  examinationId: string;
  examSubjectId: string;
  studentId: string;
  theoryMarks: number;
  practicalMarks?: number;
  totalMarks: number;
  maximumMarks: number;
  status: 'ENTERED' | 'VERIFIED' | 'LOCKED';
  enteredByUserId: string;
}

export interface StudentResultRecord {
  id: string;
  examinationId: string;
  studentId: string;
  studentName: string;
  sgpa: number;
  cgpa: number;
  overallStatus: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD';
  publishedAt?: string;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  subjectResults: Array<{
    subjectCode: string;
    marksObtained: number;
    maximumMarks: number;
    grade: ResultGrade;
    gradePoints: number;
    status: 'PASS' | 'FAIL';
  }>;
}

class ExaminationGovernanceService {
  private static instance: ExaminationGovernanceService;

  private examinations: ExaminationRecord[] = [
    {
      id: 'exam-2026-sem3-reg',
      universityId: 'univ-ssiu',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      programId: 'prog-1',
      name: 'Winter Regular Examination 2026',
      code: 'EXAM-W26-CSE3',
      examType: 'END_SEMESTER',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-3',
      startDate: '2026-11-15',
      endDate: '2026-11-30',
      status: 'OPEN_FOR_FORMS',
      createdAt: '2026-08-01T00:00:00Z'
    }
  ];

  private examSubjects: ExamSubjectRecord[] = [
    { id: 'es-dbms', examinationId: 'exam-2026-sem3-reg', subjectOfferingId: 'off-dbms-2026-sem3', subjectCode: 'CS301', subjectName: 'Database Management Systems', maximumMarks: 100, passingMarks: 40, status: 'ACTIVE' },
    { id: 'es-os', examinationId: 'exam-2026-sem3-reg', subjectOfferingId: 'off-os-2026-sem3', subjectCode: 'CS302', subjectName: 'Operating Systems', maximumMarks: 100, passingMarks: 40, status: 'ACTIVE' }
  ];

  private eligibilities: ExamEligibilityRecord[] = [
    { id: 'elig-01', examinationId: 'exam-2026-sem3-reg', studentId: 'stud-001', status: 'ELIGIBLE', calculatedAt: '2026-08-15T00:00:00Z' },
    { id: 'elig-02', examinationId: 'exam-2026-sem3-reg', studentId: 'stud-002', status: 'BLOCKED', reason: 'Attendance Shortage (< 60%)', calculatedAt: '2026-08-15T00:00:00Z' }
  ];

  private examForms: ExamFormRecord[] = [
    {
      id: 'ef-stud-001',
      examinationId: 'exam-2026-sem3-reg',
      studentId: 'stud-001',
      studentName: 'Aarav Patel',
      enrollmentNo: 'SSIU26CS001',
      status: 'APPROVED',
      submittedAt: '2026-08-20T10:00:00Z',
      verifiedAt: '2026-08-22T14:00:00Z',
      verifiedByUserId: 'usr-admin-01',
      registeredSubjectIds: ['es-dbms', 'es-os']
    }
  ];

  private feeTransactions: ExamFeeTransactionRecord[] = [
    {
      id: 'tx-exam-01',
      examinationId: 'exam-2026-sem3-reg',
      examFormId: 'ef-stud-001',
      studentId: 'stud-001',
      amount: 1500,
      paidAmount: 1500,
      pendingAmount: 0,
      status: 'PAID',
      transactionReference: 'TXN-EXAM-99881',
      paymentDate: '2026-08-20T10:15:00Z'
    }
  ];

  private schedules: ExamScheduleRecord[] = [
    { id: 'esch-01', examinationId: 'exam-2026-sem3-reg', examSubjectId: 'es-dbms', subjectCode: 'CS301', date: '2026-11-16', startTime: '10:00', endTime: '13:00', roomId: 'rm-101', roomNumber: 'Block-A 101', status: 'PUBLISHED' },
    { id: 'esch-02', examinationId: 'exam-2026-sem3-reg', examSubjectId: 'es-os', subjectCode: 'CS302', date: '2026-11-18', startTime: '10:00', endTime: '13:00', roomId: 'rm-101', roomNumber: 'Block-A 101', status: 'PUBLISHED' }
  ];

  private seatAssignments: ExamSeatAssignmentRecord[] = [
    { id: 'seat-01', examinationId: 'exam-2026-sem3-reg', examScheduleId: 'esch-01', studentId: 'stud-001', roomId: 'rm-101', seatNumber: 'A-101-01' }
  ];

  private invigilationAssignments: InvigilationAssignmentRecord[] = [
    { id: 'inv-01', examScheduleId: 'esch-01', facultyId: 'fac-102', facultyName: 'Prof. Anjali Sharma', roomId: 'rm-101', role: 'INVIGILATOR', status: 'CONFIRMED' }
  ];

  private examAttendance: ExamAttendanceRecord[] = [
    { id: 'eatt-01', examScheduleId: 'esch-01', studentId: 'stud-001', status: 'PRESENT', markedAt: '2026-11-16T10:15:00Z', markedByUserId: 'fac-102' }
  ];

  private marks: ExamMarksRecord[] = [
    { id: 'mrk-01', examinationId: 'exam-2026-sem3-reg', examSubjectId: 'es-dbms', studentId: 'stud-001', theoryMarks: 82, maximumMarks: 100, totalMarks: 82, status: 'LOCKED', enteredByUserId: 'fac-101' },
    { id: 'mrk-02', examinationId: 'exam-2026-sem3-reg', examSubjectId: 'es-os', studentId: 'stud-001', theoryMarks: 78, maximumMarks: 100, totalMarks: 78, status: 'LOCKED', enteredByUserId: 'fac-102' }
  ];

  private results: StudentResultRecord[] = [
    {
      id: 'res-stud-001',
      examinationId: 'exam-2026-sem3-reg',
      studentId: 'stud-001',
      studentName: 'Aarav Patel',
      sgpa: 8.5,
      cgpa: 8.4,
      overallStatus: 'PASS',
      publishedAt: '2026-12-10T00:00:00Z',
      status: 'PUBLISHED',
      subjectResults: [
        { subjectCode: 'CS301', marksObtained: 82, maximumMarks: 100, grade: 'A+', gradePoints: 9, status: 'PASS' },
        { subjectCode: 'CS302', marksObtained: 78, maximumMarks: 100, grade: 'A', gradePoints: 8, status: 'PASS' }
      ]
    }
  ];

  private constructor() {}

  public static getInstance(): ExaminationGovernanceService {
    if (!ExaminationGovernanceService.instance) {
      ExaminationGovernanceService.instance = new ExaminationGovernanceService();
    }
    return ExaminationGovernanceService.instance;
  }

  // ─── QUERY INTERFACES ──────────────────────────────────────────────────

  public getExaminations(academicYearId?: string): ExaminationRecord[] {
    if (academicYearId) {
      return this.examinations.filter(e => e.academicYearId === academicYearId);
    }
    return this.examinations;
  }

  public getStudentEligibility(examinationId: string, studentId: string): ExamEligibilityRecord | undefined {
    return this.eligibilities.find(e => e.examinationId === examinationId && e.studentId === studentId);
  }

  public getExamForm(examinationId: string, studentId: string): ExamFormRecord | undefined {
    return this.examForms.find(ef => ef.examinationId === examinationId && ef.studentId === studentId);
  }

  public submitExamForm(form: {
    examinationId: string;
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    registeredSubjectIds: string[];
  }): ExamFormRecord {
    // Check eligibility
    const elig = this.getStudentEligibility(form.examinationId, form.studentId);
    if (elig?.status === 'BLOCKED' || elig?.status === 'NOT_ELIGIBLE') {
      throw new Error(`Student ${form.studentId} is not eligible to submit exam form: ${elig.reason || 'Blocked'}`);
    }

    const newForm: ExamFormRecord = {
      id: `ef-${form.studentId}-${Date.now()}`,
      examinationId: form.examinationId,
      studentId: form.studentId,
      studentName: form.studentName,
      enrollmentNo: form.enrollmentNo,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      registeredSubjectIds: form.registeredSubjectIds
    };

    this.examForms.push(newForm);
    return newForm;
  }

  public getExamFeeTransaction(examinationId: string, studentId: string): ExamFeeTransactionRecord | undefined {
    return this.feeTransactions.find(t => t.examinationId === examinationId && t.studentId === studentId);
  }

  public getExamSchedule(examinationId: string): ExamScheduleRecord[] {
    return this.schedules.filter(s => s.examinationId === examinationId);
  }

  public getStudentResult(examinationId: string, studentId: string, context?: UserAuthorizationContext): StudentResultRecord | undefined {
    // RBAC Result Privacy: Student can only view own published result
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    const res = this.results.find(r => r.examinationId === examinationId && r.studentId === studentId);
    if (!res) return undefined;

    // Only return published results for regular viewing
    if (context && String(context.activeRole) === 'STUDENT' && res.status !== 'PUBLISHED') {
      return undefined;
    }

    return res;
  }

  public getExamKpiSummary(): {
    totalEligibleStudents: number;
    approvedFormsCount: number;
    pendingFeesCount: number;
    scheduledExamsCount: number;
    publishedResultsCount: number;
  } {
    return {
      totalEligibleStudents: this.eligibilities.filter(e => e.status === 'ELIGIBLE').length,
      approvedFormsCount: this.examForms.filter(f => f.status === 'APPROVED').length,
      pendingFeesCount: this.feeTransactions.filter(t => t.status === 'PENDING').length,
      scheduledExamsCount: this.schedules.filter(s => s.status === 'PUBLISHED').length,
      publishedResultsCount: this.results.filter(r => r.status === 'PUBLISHED').length
    };
  }
}

export const examinationGovernanceService = ExaminationGovernanceService.getInstance();
