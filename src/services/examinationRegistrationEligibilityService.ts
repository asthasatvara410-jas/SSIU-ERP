import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { ExamTypeCode } from './examinationCoreDataModelService';

export type ExamRegistrationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'ELIGIBLE'
  | 'FEE_PENDING'
  | 'FEE_PAID'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type SubjectEligibilityStatus =
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'ALREADY_PASSED'
  | 'BACKLOG'
  | 'REPEAT_ALLOWED'
  | 'BLOCKED';

export interface ExamRegistrationRecord {
  id: string;
  registration_number: string;
  exam_id: string;
  student_id: string;
  academic_year_id: string;
  semester_id: string;
  institute_id: string;
  department_id: string;
  program_id: string;
  registration_date: string;
  registration_type: ExamTypeCode;
  status: ExamRegistrationStatus;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamFormRecord {
  id: string;
  exam_registration_id: string;
  student_id: string;
  exam_id: string;
  form_number: string;
  submission_date: string;
  status: ExamRegistrationStatus;
  selected_subject_ids: string[];
  total_fee_amount: number;
  fee_demand_id?: string;
  payment_status: 'PENDING' | 'PAID' | 'WAIVED';
  remarks?: string;
}

export interface ExamAttemptRecord {
  id: string;
  student_id: string;
  subject_id: string;
  exam_id: string;
  attempt_number: number;
  registration_id: string;
  result_status?: 'PASS' | 'FAIL' | 'ABSENT' | 'PENDING';
  created_at: string;
}

export interface ExamEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  warnings: string[];
  eligibleSubjectIds: string[];
  blockedSubjectIds: string[];
}

export interface ExamRegistrationDashboardMetrics {
  totalEligibleStudents: number;
  totalForms: number;
  draftForms: number;
  submittedForms: number;
  underVerificationForms: number;
  approvedForms: number;
  rejectedForms: number;
  feePendingForms: number;
  feePaidForms: number;
  totalFeeDemand: number;
  totalFeeCollected: number;
}

class ExaminationRegistrationEligibilityService {
  private static instance: ExaminationRegistrationEligibilityService;

  private registrations: ExamRegistrationRecord[] = [
    {
      id: 'reg-001',
      registration_number: 'EXREG-2026-000001',
      exam_id: 'exam-2026-w-001',
      student_id: 'stud-001',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      program_id: 'prog-bca',
      registration_date: '2026-08-26',
      registration_type: 'REGULAR',
      status: 'APPROVED',
      submitted_at: '2026-08-26T10:00:00Z',
      approved_at: '2026-08-27T11:00:00Z',
      approved_by: 'emp-reg-001',
      created_at: '2026-08-26T09:30:00Z',
      updated_at: '2026-08-27T11:00:00Z'
    }
  ];

  private forms: ExamFormRecord[] = [
    {
      id: 'form-001',
      exam_registration_id: 'reg-001',
      student_id: 'stud-001',
      exam_id: 'exam-2026-w-001',
      form_number: 'EXFORM-2026-000001',
      submission_date: '2026-08-26',
      status: 'APPROVED',
      selected_subject_ids: ['subj-cs101', 'subj-cs102'],
      total_fee_amount: 1500,
      fee_demand_id: 'FD-2026-000101',
      payment_status: 'PAID'
    }
  ];

  private attempts: ExamAttemptRecord[] = [
    {
      id: 'att-001',
      student_id: 'stud-001',
      subject_id: 'subj-cs101',
      exam_id: 'exam-2026-w-001',
      attempt_number: 1,
      registration_id: 'reg-001',
      result_status: 'PENDING',
      created_at: '2026-08-26T10:00:00Z'
    }
  ];

  // Passed subjects cache to prevent duplicate passing attempts
  private studentPassedSubjects: Map<string, Set<string>> = new Map([
    ['stud-001', new Set(['subj-math101'])]
  ]);

  private constructor() {}

  public static getInstance(): ExaminationRegistrationEligibilityService {
    if (!ExaminationRegistrationEligibilityService.instance) {
      ExaminationRegistrationEligibilityService.instance = new ExaminationRegistrationEligibilityService();
    }
    return ExaminationRegistrationEligibilityService.instance;
  }

  // ─── ELIGIBILITY EVALUATION ENGINE ────────────────────────────────────

  public evaluateStudentExamEligibility(params: {
    studentId: string;
    examId: string;
    isEnrolled: boolean;
    hasFinancialHold: boolean;
    hasAcademicHold: boolean;
    attendancePercentage: number;
    candidateSubjectIds: string[];
    isRepeatAllowed?: boolean;
  }): ExamEligibilityResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const eligibleSubjectIds: string[] = [];
    const blockedSubjectIds: string[] = [];

    if (!params.isEnrolled) {
      reasons.push('Student is not actively enrolled in the academic semester.');
    }
    if (params.hasAcademicHold) {
      reasons.push('Academic Hold active on student profile.');
    }
    if (params.hasFinancialHold) {
      reasons.push('Financial Hold active: Tuition/Semester dues outstanding.');
    }
    if (params.attendancePercentage < 75) {
      warnings.push(`Attendance is ${params.attendancePercentage}% (< 75% threshold). Condonation / Special approval may be required.`);
    }

    const passedSet = this.studentPassedSubjects.get(params.studentId) || new Set();

    for (const subId of params.candidateSubjectIds) {
      if (passedSet.has(subId) && !params.isRepeatAllowed) {
        blockedSubjectIds.push(subId);
        warnings.push(`Subject ${subId} already passed in previous session. Duplicate registration not permitted without repeat authorization.`);
      } else {
        eligibleSubjectIds.push(subId);
      }
    }

    const isEligible = reasons.length === 0 && eligibleSubjectIds.length > 0;

    return {
      isEligible,
      reasons,
      warnings,
      eligibleSubjectIds,
      blockedSubjectIds
    };
  }

  // ─── REGISTRATION & EXAM FORM DRAFT CREATION ──────────────────────────

  public createExamRegistrationDraft(params: {
    examId: string;
    studentId: string;
    academicYearId: string;
    semesterId: string;
    instituteId: string;
    departmentId: string;
    programId: string;
    registrationType: ExamTypeCode;
    selectedSubjectIds: string[];
    feePerSubject?: number;
  }): { registration: ExamRegistrationRecord; form: ExamFormRecord } {
    // 1. One Registration Rule
    const existingActive = this.registrations.find(r =>
      r.student_id === params.studentId &&
      r.exam_id === params.examId &&
      r.registration_type === params.registrationType &&
      r.status !== 'CANCELLED' &&
      r.status !== 'REJECTED'
    );
    if (existingActive) {
      throw new Error(`Active exam registration already exists for Student ${params.studentId} in Examination ${params.examId}`);
    }

    if (params.selectedSubjectIds.length === 0) {
      throw new Error('At least one eligible subject must be selected for examination registration');
    }

    const regNumber = `EXREG-2026-${(this.registrations.length + 1).toString().padStart(6, '0')}`;
    const formNumber = `EXFORM-2026-${(this.forms.length + 1).toString().padStart(6, '0')}`;
    const feeRate = params.feePerSubject || 750;
    const totalFee = params.selectedSubjectIds.length * feeRate;

    const registration: ExamRegistrationRecord = {
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      registration_number: regNumber,
      exam_id: params.examId,
      student_id: params.studentId,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      institute_id: params.instituteId,
      department_id: params.departmentId,
      program_id: params.programId,
      registration_date: new Date().toISOString().split('T')[0],
      registration_type: params.registrationType,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const form: ExamFormRecord = {
      id: `form-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      exam_registration_id: registration.id,
      student_id: params.studentId,
      exam_id: params.examId,
      form_number: formNumber,
      submission_date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      selected_subject_ids: params.selectedSubjectIds,
      total_fee_amount: totalFee,
      payment_status: 'PENDING'
    };

    this.registrations.push(registration);
    this.forms.push(form);

    return { registration, form };
  }

  // ─── FORM SUBMISSION & CENTRAL FINANCE FEE DEMAND ROUTING ─────────────

  public submitExamForm(formId: string): ExamFormRecord {
    const form = this.forms.find(f => f.id === formId);
    if (!form) throw new Error(`Exam form ${formId} not found`);

    if (form.status !== 'DRAFT') {
      throw new Error(`Cannot submit form in ${form.status} state. Only DRAFT forms can be submitted.`);
    }

    const reg = this.registrations.find(r => r.id === form.exam_registration_id);
    if (!reg) throw new Error(`Associated registration not found for form ${formId}`);

    // Generate central finance demand reference
    form.fee_demand_id = `FD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    form.status = 'SUBMITTED';
    reg.status = 'SUBMITTED';
    reg.submitted_at = new Date().toISOString();
    reg.updated_at = new Date().toISOString();

    return form;
  }

  // ─── VERIFICATION & APPROVAL STATE MACHINE ────────────────────────────

  public approveExamRegistration(params: {
    registrationId: string;
    approverUserId: string;
    isPaymentVerified: boolean;
  }): ExamRegistrationRecord {
    const reg = this.registrations.find(r => r.id === params.registrationId);
    if (!reg) throw new Error(`Exam registration ${params.registrationId} not found`);

    if (!params.isPaymentVerified) {
      throw new Error(`Cannot approve registration ${reg.registration_number}: Exam fee payment not confirmed in Central Finance`);
    }

    const form = this.forms.find(f => f.exam_registration_id === reg.id);
    if (form) {
      form.status = 'APPROVED';
      form.payment_status = 'PAID';

      // Create attempt records for each registered subject
      for (const subId of form.selected_subject_ids) {
        const priorAttempts = this.attempts.filter(a => a.student_id === reg.student_id && a.subject_id === subId).length;
        this.attempts.push({
          id: `att-${Date.now()}-${subId}`,
          student_id: reg.student_id,
          subject_id: subId,
          exam_id: reg.exam_id,
          attempt_number: priorAttempts + 1,
          registration_id: reg.id,
          result_status: 'PENDING',
          created_at: new Date().toISOString()
        });
      }
    }

    reg.status = 'APPROVED';
    reg.approved_at = new Date().toISOString();
    reg.approved_by = params.approverUserId;
    reg.updated_at = new Date().toISOString();

    return reg;
  }

  // ─── DASHBOARD QUERY ENGINE (100% CARD-TO-LIST CONSISTENCY) ───────────

  public getRegistrationDashboardMetrics(context?: UserAuthorizationContext): ExamRegistrationDashboardMetrics {
    let regs = [...this.registrations];
    if (context && context.activeRole !== 'REGISTRAR' && context.instituteId) {
      regs = regs.filter(r => r.institute_id === context.instituteId);
    }
    if (context && context.activeRole === 'HOD' && context.departmentId) {
      regs = regs.filter(r => r.department_id === context.departmentId);
    }

    const totalForms = regs.length;
    const draftForms = regs.filter(r => r.status === 'DRAFT').length;
    const submittedForms = regs.filter(r => r.status === 'SUBMITTED').length;
    const underVerificationForms = regs.filter(r => r.status === 'UNDER_VERIFICATION').length;
    const approvedForms = regs.filter(r => r.status === 'APPROVED').length;
    const rejectedForms = regs.filter(r => r.status === 'REJECTED').length;
    const feePendingForms = regs.filter(r => r.status === 'SUBMITTED' || r.status === 'FEE_PENDING').length;
    const feePaidForms = regs.filter(r => r.status === 'APPROVED' || r.status === 'FEE_PAID').length;

    const matchedForms = this.forms.filter(f => regs.some(r => r.id === f.exam_registration_id));
    const totalFeeDemand = matchedForms.reduce((sum, f) => sum + f.total_fee_amount, 0);
    const totalFeeCollected = matchedForms.filter(f => f.payment_status === 'PAID').reduce((sum, f) => sum + f.total_fee_amount, 0);

    return {
      totalEligibleStudents: 1850,
      totalForms,
      draftForms,
      submittedForms,
      underVerificationForms,
      approvedForms,
      rejectedForms,
      feePendingForms,
      feePaidForms,
      totalFeeDemand,
      totalFeeCollected
    };
  }
}

export const examinationRegistrationEligibilityService = ExaminationRegistrationEligibilityService.getInstance();
