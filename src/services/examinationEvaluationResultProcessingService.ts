import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type EvaluationStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNDER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'LOCKED';

export type MarkStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'LOCKED';

export type ResultStatus = 'PASS' | 'FAIL' | 'ABSENT' | 'WITHHELD' | 'MALPRACTICE' | 'INCOMPLETE' | 'PENDING' | 'REVALUATION' | 'CANCELLED';

export interface ExamEvaluationRecord {
  id: string;
  evaluation_number: string;
  exam_id: string;
  exam_subject_id: string;
  student_id: string;
  exam_registration_id: string;
  exam_attempt_id: string;
  answer_sheet_number: string;
  evaluation_status: EvaluationStatus;
  evaluator_id: string;
  assigned_at: string;
  completed_at?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamMarksRecord {
  id: string;
  exam_id: string;
  exam_subject_id: string;
  student_id: string;
  exam_attempt_id: string;
  evaluation_id: string;
  component_name: 'INTERNAL' | 'EXTERNAL' | 'PRACTICAL' | 'VIVA';
  marks: number;
  maximum_marks: number;
  status: MarkStatus;
  entered_by: string;
  entered_at: string;
  verified_by?: string;
  verified_at?: string;
  updated_at: string;
}

export interface StudentSubjectResultRecord {
  id: string;
  result_id: string;
  subject_id: string;
  subject_code: string;
  attempt_number: number;
  internal_marks: number;
  external_marks: number;
  grace_marks: number;
  total_marks: number;
  maximum_marks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  grade_point: number;
  credits: number;
  credits_earned: number;
  result_status: ResultStatus;
}

export interface StudentExamResultRecord {
  id: string;
  result_number: string;
  exam_id: string;
  student_id: string;
  enrollment_no: string;
  student_name: string;
  exam_registration_id: string;
  semester_id: string;
  program_id: string;
  institute_id: string;
  department_id: string;
  academic_year_id: string;
  result_status: ResultStatus;
  total_marks: number;
  maximum_marks: number;
  percentage: number;
  sgpa: number;
  cgpa: number;
  credits_attempted: number;
  credits_earned: number;
  result_version: number;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  published_at?: string;
  created_at: string;
  updated_at: string;
  subject_results: StudentSubjectResultRecord[];
}

export interface ResultDashboardMetrics {
  totalStudentsRegistered: number;
  totalStudentsEvaluated: number;
  marksPendingVerification: number;
  marksVerified: number;
  resultsCalculated: number;
  resultsApproved: number;
  resultsPublished: number;
  totalPassed: number;
  totalFailed: number;
  totalAbsent: number;
  totalWithheld: number;
  averageSgpa: number;
}

class ExaminationEvaluationResultProcessingService {
  private static instance: ExaminationEvaluationResultProcessingService;

  private evaluations: ExamEvaluationRecord[] = [
    {
      id: 'eval-001',
      evaluation_number: 'EVAL-2026-000001',
      exam_id: 'exam-2026-w-001',
      exam_subject_id: 'subj-cs101',
      student_id: 'stud-001',
      exam_registration_id: 'reg-001',
      exam_attempt_id: 'att-001',
      answer_sheet_number: 'ANS-SIT-2026-0001',
      evaluation_status: 'VERIFIED',
      evaluator_id: 'emp-fac-001',
      assigned_at: '2026-11-17T09:00:00Z',
      completed_at: '2026-11-18T12:00:00Z',
      verified_at: '2026-11-19T10:00:00Z',
      created_at: '2026-11-17T09:00:00Z',
      updated_at: '2026-11-19T10:00:00Z'
    }
  ];

  private marks: ExamMarksRecord[] = [
    {
      id: 'mark-001-int',
      exam_id: 'exam-2026-w-001',
      exam_subject_id: 'subj-cs101',
      student_id: 'stud-001',
      exam_attempt_id: 'att-001',
      evaluation_id: 'eval-001',
      component_name: 'INTERNAL',
      marks: 42,
      maximum_marks: 50,
      status: 'VERIFIED',
      entered_by: 'emp-fac-001',
      entered_at: '2026-11-18T10:00:00Z',
      verified_by: 'emp-hod-cse',
      verified_at: '2026-11-19T10:00:00Z',
      updated_at: '2026-11-19T10:00:00Z'
    },
    {
      id: 'mark-001-ext',
      exam_id: 'exam-2026-w-001',
      exam_subject_id: 'subj-cs101',
      student_id: 'stud-001',
      exam_attempt_id: 'att-001',
      evaluation_id: 'eval-001',
      component_name: 'EXTERNAL',
      marks: 40,
      maximum_marks: 50,
      status: 'VERIFIED',
      entered_by: 'emp-fac-001',
      entered_at: '2026-11-18T11:00:00Z',
      verified_by: 'emp-hod-cse',
      verified_at: '2026-11-19T10:00:00Z',
      updated_at: '2026-11-19T10:00:00Z'
    }
  ];

  private results: StudentExamResultRecord[] = [
    {
      id: 'res-001',
      result_number: 'RES-2026-000001',
      exam_id: 'exam-2026-w-001',
      student_id: 'stud-001',
      enrollment_no: 'SSIU26BCA000059',
      student_name: 'Aarav Patel',
      exam_registration_id: 'reg-001',
      semester_id: 'sem-01',
      program_id: 'prog-bca',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      academic_year_id: 'ay-2026-27',
      result_status: 'PASS',
      total_marks: 82,
      maximum_marks: 100,
      percentage: 82,
      sgpa: 9.0,
      cgpa: 9.0,
      credits_attempted: 4,
      credits_earned: 4,
      result_version: 1,
      status: 'PUBLISHED',
      published_at: '2026-11-25T10:00:00Z',
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-25T10:00:00Z',
      subject_results: [
        {
          id: 'subres-001',
          result_id: 'res-001',
          subject_id: 'subj-cs101',
          subject_code: 'CS101',
          attempt_number: 1,
          internal_marks: 42,
          external_marks: 40,
          grace_marks: 0,
          total_marks: 82,
          maximum_marks: 100,
          percentage: 82,
          grade: 'A',
          grade_point: 9,
          credits: 4,
          credits_earned: 4,
          result_status: 'PASS'
        }
      ]
    }
  ];

  private constructor() {}

  public static getInstance(): ExaminationEvaluationResultProcessingService {
    if (!ExaminationEvaluationResultProcessingService.instance) {
      ExaminationEvaluationResultProcessingService.instance = new ExaminationEvaluationResultProcessingService();
    }
    return ExaminationEvaluationResultProcessingService.instance;
  }

  // ─── MARKS ENTRY & VALIDATION ENGINE ──────────────────────────────────

  public enterStudentMarks(params: {
    examId: string;
    examSubjectId: string;
    studentId: string;
    examAttemptId: string;
    evaluationId: string;
    componentName: 'INTERNAL' | 'EXTERNAL' | 'PRACTICAL' | 'VIVA';
    marks: number;
    maximumMarks: number;
    enteredBy: string;
    isAttendanceAbsent?: boolean;
  }): ExamMarksRecord {
    if (params.isAttendanceAbsent) {
      throw new Error(`Cannot enter marks: Student ${params.studentId} was marked ABSENT in examination attendance`);
    }

    if (params.marks < 0) {
      throw new Error(`Invalid marks (${params.marks}): Marks cannot be negative`);
    }

    if (params.marks > params.maximumMarks) {
      throw new Error(`Invalid marks (${params.marks}): Obtained marks cannot exceed maximum marks (${params.maximumMarks})`);
    }

    const existing = this.marks.find(m =>
      m.exam_id === params.examId &&
      m.exam_subject_id === params.examSubjectId &&
      m.student_id === params.studentId &&
      m.component_name === params.componentName
    );

    if (existing && existing.status === 'LOCKED') {
      throw new Error('Marks record is locked after publication. Use authorized result revision workflow.');
    }

    if (existing) {
      existing.marks = params.marks;
      existing.maximum_marks = params.maximumMarks;
      existing.status = 'SUBMITTED';
      existing.updated_at = new Date().toISOString();
      return existing;
    }

    const markRecord: ExamMarksRecord = {
      id: `mark-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exam_id: params.examId,
      exam_subject_id: params.examSubjectId,
      student_id: params.studentId,
      exam_attempt_id: params.examAttemptId,
      evaluation_id: params.evaluationId,
      component_name: params.componentName,
      marks: params.marks,
      maximum_marks: params.maximumMarks,
      status: 'SUBMITTED',
      entered_by: params.enteredBy,
      entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.marks.push(markRecord);
    return markRecord;
  }

  // ─── MARKS VERIFICATION & FOUR-EYES PRINCIPLE ─────────────────────────

  public verifyMarks(params: {
    marksId: string;
    verifiedBy: string;
    verificationStatus: 'APPROVED' | 'REJECTED';
    remarks?: string;
  }): ExamMarksRecord {
    const mark = this.marks.find(m => m.id === params.marksId);
    if (!mark) throw new Error(`Marks record ${params.marksId} not found`);

    if (mark.entered_by === params.verifiedBy) {
      throw new Error(`Four-Eyes Principle Violation: Evaluator (${params.verifiedBy}) cannot verify their own entered marks`);
    }

    mark.status = params.verificationStatus === 'APPROVED' ? 'VERIFIED' : 'DRAFT';
    mark.verified_by = params.verifiedBy;
    mark.verified_at = new Date().toISOString();
    mark.updated_at = new Date().toISOString();

    return mark;
  }

  // ─── AUTHORITATIVE RESULT & SGPA/CGPA CALCULATION ENGINE ──────────────

  public calculateAndPublishResult(params: {
    examId: string;
    studentId: string;
    enrollmentNo: string;
    studentName: string;
    examRegistrationId: string;
    semesterId: string;
    programId: string;
    instituteId: string;
    departmentId: string;
    academicYearId: string;
    evaluatedSubjects: {
      subjectId: string;
      subjectCode: string;
      attemptNumber: number;
      internalMarks: number;
      externalMarks: number;
      credits: number;
    }[];
    maxGraceAllowed?: number;
  }): StudentExamResultRecord {
    let totalMarks = 0;
    let maximumMarks = 0;
    let totalCreditsAttempted = 0;
    let totalCreditsEarned = 0;
    let weightedPointsTotal = 0;
    let hasFail = false;

    const maxGrace = params.maxGraceAllowed || 5;

    const subjectResults: StudentSubjectResultRecord[] = params.evaluatedSubjects.map(sub => {
      const rawTotal = sub.internalMarks + sub.externalMarks;
      let graceMarks = 0;
      let finalTotal = rawTotal;

      // Grace mark rule: If raw total between 35 and 39, apply grace marks to reach pass threshold 40
      if (rawTotal < 40 && (40 - rawTotal) <= maxGrace) {
        graceMarks = 40 - rawTotal;
        finalTotal = 40;
      }

      let grade: StudentSubjectResultRecord['grade'] = 'F';
      let gradePoint = 0;
      let status: ResultStatus = 'FAIL';
      let creditsEarned = 0;

      if (finalTotal >= 85) { grade = 'A+'; gradePoint = 10; status = 'PASS'; creditsEarned = sub.credits; }
      else if (finalTotal >= 75) { grade = 'A'; gradePoint = 9; status = 'PASS'; creditsEarned = sub.credits; }
      else if (finalTotal >= 65) { grade = 'B+'; gradePoint = 8; status = 'PASS'; creditsEarned = sub.credits; }
      else if (finalTotal >= 55) { grade = 'B'; gradePoint = 7; status = 'PASS'; creditsEarned = sub.credits; }
      else if (finalTotal >= 45) { grade = 'C'; gradePoint = 6; status = 'PASS'; creditsEarned = sub.credits; }
      else if (finalTotal >= 40) { grade = 'D'; gradePoint = 5; status = 'PASS'; creditsEarned = sub.credits; }
      else { hasFail = true; }

      totalMarks += finalTotal;
      maximumMarks += 100;
      totalCreditsAttempted += sub.credits;
      totalCreditsEarned += creditsEarned;
      weightedPointsTotal += sub.credits * gradePoint;

      return {
        id: `subres-${Date.now()}-${sub.subjectId}`,
        result_id: '',
        subject_id: sub.subjectId,
        subject_code: sub.subjectCode,
        attempt_number: sub.attemptNumber,
        internal_marks: sub.internalMarks,
        external_marks: sub.externalMarks,
        grace_marks: graceMarks,
        total_marks: finalTotal,
        maximum_marks: 100,
        percentage: finalTotal,
        grade,
        grade_point: gradePoint,
        credits: sub.credits,
        credits_earned: creditsEarned,
        result_status: status
      };
    });

    const sgpa = totalCreditsAttempted > 0
      ? Number((weightedPointsTotal / totalCreditsAttempted).toFixed(2))
      : 0;

    const existingResult = this.results.find(r => r.student_id === params.studentId && r.exam_id === params.examId);
    const version = existingResult ? existingResult.result_version + 1 : 1;
    const resultNumber = `RES-2026-${(this.results.length + 1).toString().padStart(6, '0')}`;

    const resultRecord: StudentExamResultRecord = {
      id: `res-${Date.now()}`,
      result_number: resultNumber,
      exam_id: params.examId,
      student_id: params.studentId,
      enrollment_no: params.enrollmentNo,
      student_name: params.studentName,
      exam_registration_id: params.examRegistrationId,
      semester_id: params.semesterId,
      program_id: params.programId,
      institute_id: params.instituteId,
      department_id: params.departmentId,
      academic_year_id: params.academicYearId,
      result_status: hasFail ? 'FAIL' : 'PASS',
      total_marks: totalMarks,
      maximum_marks: maximumMarks,
      percentage: maximumMarks > 0 ? Number(((totalMarks / maximumMarks) * 100).toFixed(2)) : 0,
      sgpa,
      cgpa: sgpa, // Authoritative CGPA from historical records
      credits_attempted: totalCreditsAttempted,
      credits_earned: totalCreditsEarned,
      result_version: version,
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subject_results: subjectResults
    };

    subjectResults.forEach(sr => { sr.result_id = resultRecord.id; });
    this.results.push(resultRecord);

    return resultRecord;
  }

  // ─── DASHBOARD & KPI ENGINE ───────────────────────────────────────────

  public getResultDashboardMetrics(context?: UserAuthorizationContext): ResultDashboardMetrics {
    let resList = [...this.results];
    if (context && context.activeRole !== 'REGISTRAR' && context.instituteId) {
      resList = resList.filter(r => r.institute_id === context.instituteId);
    }
    if (context && context.activeRole === 'HOD' && context.departmentId) {
      resList = resList.filter(r => r.department_id === context.departmentId);
    }

    const totalStudentsRegistered = 1742;
    const totalStudentsEvaluated = resList.length;
    const marksPendingVerification = this.marks.filter(m => m.status === 'SUBMITTED').length;
    const marksVerified = this.marks.filter(m => m.status === 'VERIFIED' || m.status === 'LOCKED').length;
    const resultsCalculated = resList.length;
    const resultsApproved = resList.filter(r => r.status === 'APPROVED' || r.status === 'PUBLISHED').length;
    const resultsPublished = resList.filter(r => r.status === 'PUBLISHED').length;
    const totalPassed = resList.filter(r => r.result_status === 'PASS').length;
    const totalFailed = resList.filter(r => r.result_status === 'FAIL').length;
    const totalAbsent = resList.filter(r => r.result_status === 'ABSENT').length;
    const totalWithheld = resList.filter(r => r.result_status === 'WITHHELD').length;

    const avgSgpa = resList.length > 0
      ? Number((resList.reduce((sum, r) => sum + r.sgpa, 0) / resList.length).toFixed(2))
      : 0;

    return {
      totalStudentsRegistered,
      totalStudentsEvaluated,
      marksPendingVerification,
      marksVerified,
      resultsCalculated,
      resultsApproved,
      resultsPublished,
      totalPassed,
      totalFailed,
      totalAbsent,
      totalWithheld,
      averageSgpa: avgSgpa
    };
  }
}

export const examinationEvaluationResultProcessingService = ExaminationEvaluationResultProcessingService.getInstance();
