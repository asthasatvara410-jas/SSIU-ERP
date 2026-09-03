import { describe, it, expect } from 'vitest';
import { examinationRegistrationEligibilityService } from '../services/examinationRegistrationEligibilityService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10.2: Examination Registration, Student Eligibility & Exam Form Engine', () => {

  it('TEST 1: Eligibility Engine: Validates enrollment, checks holds, and enforces passed subject protection', () => {
    // 1. Fully eligible student
    const res1 = examinationRegistrationEligibilityService.evaluateStudentExamEligibility({
      studentId: 'stud-002',
      examId: 'exam-2026-w-001',
      isEnrolled: true,
      hasFinancialHold: false,
      hasAcademicHold: false,
      attendancePercentage: 88,
      candidateSubjectIds: ['subj-cs101', 'subj-cs102']
    });
    expect(res1.isEligible).toBe(true);
    expect(res1.eligibleSubjectIds.length).toBe(2);
    expect(res1.blockedSubjectIds.length).toBe(0);

    // 2. Ineligible due to financial hold
    const res2 = examinationRegistrationEligibilityService.evaluateStudentExamEligibility({
      studentId: 'stud-003',
      examId: 'exam-2026-w-001',
      isEnrolled: true,
      hasFinancialHold: true,
      hasAcademicHold: false,
      attendancePercentage: 80,
      candidateSubjectIds: ['subj-cs101']
    });
    expect(res2.isEligible).toBe(false);
    expect(res2.reasons).toContain('Financial Hold active: Tuition/Semester dues outstanding.');

    // 3. Passed subject protection (stud-001 already passed subj-math101)
    const res3 = examinationRegistrationEligibilityService.evaluateStudentExamEligibility({
      studentId: 'stud-001',
      examId: 'exam-2026-w-001',
      isEnrolled: true,
      hasFinancialHold: false,
      hasAcademicHold: false,
      attendancePercentage: 82,
      candidateSubjectIds: ['subj-cs101', 'subj-math101'],
      isRepeatAllowed: false
    });
    expect(res3.eligibleSubjectIds).toContain('subj-cs101');
    expect(res3.blockedSubjectIds).toContain('subj-math101');
    expect(res3.warnings.some(w => w.includes('already passed in previous session'))).toBe(true);
  });

  it('TEST 2: Exam Registration & Form Draft Creation: Enforces One Registration Rule and calculates fees', () => {
    const { registration, form } = examinationRegistrationEligibilityService.createExamRegistrationDraft({
      examId: 'exam-2026-w-001',
      studentId: 'stud-002',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-01',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      programId: 'prog-bca',
      registrationType: 'REGULAR',
      selectedSubjectIds: ['subj-cs101', 'subj-cs102'],
      feePerSubject: 750
    });

    expect(registration.id).toBeDefined();
    expect(registration.registration_number).toMatch(/^EXREG-2026-\d{6}$/);
    expect(registration.status).toBe('DRAFT');

    expect(form.id).toBeDefined();
    expect(form.form_number).toMatch(/^EXFORM-2026-\d{6}$/);
    expect(form.total_fee_amount).toBe(1500); // 2 subjects * 750
    expect(form.status).toBe('DRAFT');

    // Duplicate Active Registration rejection
    expect(() => {
      examinationRegistrationEligibilityService.createExamRegistrationDraft({
        examId: 'exam-2026-w-001',
        studentId: 'stud-002', // Same student, exam & type
        academicYearId: 'ay-2026-27',
        semesterId: 'sem-01',
        instituteId: 'inst-sit',
        departmentId: 'dept-cse',
        programId: 'prog-bca',
        registrationType: 'REGULAR',
        selectedSubjectIds: ['subj-cs101']
      });
    }).toThrow(/Active exam registration already exists/);
  });

  it('TEST 3: Form Submission & Central Finance Fee Demand: Submits form and generates demand reference', () => {
    const draft = examinationRegistrationEligibilityService.createExamRegistrationDraft({
      examId: 'exam-2026-w-001',
      studentId: 'stud-004',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-01',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      programId: 'prog-bca',
      registrationType: 'REGULAR',
      selectedSubjectIds: ['subj-cs101']
    });

    const submittedForm = examinationRegistrationEligibilityService.submitExamForm(draft.form.id);
    expect(submittedForm.status).toBe('SUBMITTED');
    expect(submittedForm.fee_demand_id).toMatch(/^FD-2026-\d{6}$/);
  });

  it('TEST 4: Form Approval & Attempt Tracking: Enforces fee verification and tracks attempt numbers', () => {
    const draft = examinationRegistrationEligibilityService.createExamRegistrationDraft({
      examId: 'exam-2026-w-001',
      studentId: 'stud-005',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-01',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      programId: 'prog-bca',
      registrationType: 'REGULAR',
      selectedSubjectIds: ['subj-cs101']
    });

    examinationRegistrationEligibilityService.submitExamForm(draft.form.id);

    // Approval without payment verification must fail
    expect(() => {
      examinationRegistrationEligibilityService.approveExamRegistration({
        registrationId: draft.registration.id,
        approverUserId: 'emp-reg-001',
        isPaymentVerified: false
      });
    }).toThrow(/Exam fee payment not confirmed in Central Finance/);

    // Approval with payment verified
    const approved = examinationRegistrationEligibilityService.approveExamRegistration({
      registrationId: draft.registration.id,
      approverUserId: 'emp-reg-001',
      isPaymentVerified: true
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.approved_by).toBe('emp-reg-001');
  });

  it('TEST 5: Registration Dashboard Metrics: Computes authoritative card counts matching list records', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['EXAM_REGISTRATION_VIEW', 'EXAM_REGISTRATION_APPROVE']
    };

    const metrics = examinationRegistrationEligibilityService.getRegistrationDashboardMetrics(registrarContext);
    expect(metrics.totalForms).toBeGreaterThanOrEqual(3);
    expect(metrics.approvedForms).toBeGreaterThanOrEqual(2);
    expect(metrics.totalFeeDemand).toBeGreaterThanOrEqual(1500);
    expect(metrics.totalFeeCollected).toBeGreaterThanOrEqual(1500);
  });
});
