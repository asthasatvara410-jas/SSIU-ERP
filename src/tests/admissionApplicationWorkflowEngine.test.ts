import { describe, it, expect } from 'vitest';
import { admissionApplicationWorkflowService } from '../services/admissionApplicationWorkflowService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 11.1: Admission Application, Prospect & Workflow Engine', () => {

  it('TEST 1: Prospect Lead Management & Duplicate Detection: Creates leads and flags potential duplicate contacts', () => {
    // 1. Valid Lead Creation
    const lead1 = admissionApplicationWorkflowService.createProspect({
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: '2005-08-15',
      gender: 'FEMALE',
      mobile: '+919811122233',
      email: 'priya.sharma@gmail.com',
      city: 'Vadodara',
      state: 'Gujarat',
      source: 'WALK_IN'
    });

    expect(lead1.id).toBeDefined();
    expect(lead1.prospect_number).toMatch(/^LEAD-2026-\d{6}$/);
    expect(lead1.status).toBe('NEW');
    expect(lead1.is_possible_duplicate).toBe(false);

    // 2. Duplicate Detection for same mobile
    const lead2 = admissionApplicationWorkflowService.createProspect({
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: '2005-08-15',
      gender: 'FEMALE',
      mobile: '+919811122233', // Duplicate mobile
      email: 'priya.sharma2@gmail.com',
      city: 'Vadodara',
      state: 'Gujarat',
      source: 'WEBSITE'
    });

    expect(lead2.status).toBe('DUPLICATE');
    expect(lead2.is_possible_duplicate).toBe(true);
  });

  it('TEST 2: Application Draft & Central Finance Fee Demand: Validates draft creation and submission rules', () => {
    // 1. Create Application Draft
    const draft = admissionApplicationWorkflowService.createApplicationDraft({
      sessionId: 'adm-sess-001',
      programIntakeId: 'intake-bca-001',
      applicantName: 'Rohan Sharma',
      email: 'rohan.sharma@gmail.com',
      mobile: '+919822233344',
      dateOfBirth: '2005-06-20',
      gender: 'MALE',
      category: 'OPEN',
      qualifyingExam: '12th Science',
      academicPercentage: 72.5,
      hasRequiredSubjects: true
    });

    expect(draft.id).toBeDefined();
    expect(draft.application_number).toMatch(/^ADM-2026-\d{6}$/);
    expect(draft.status).toBe('DRAFT');
    expect(draft.fee_demand_id).toMatch(/^FD-ADM-2026-\d{6}$/);

    // 2. Submission without fee payment must fail
    expect(() => {
      admissionApplicationWorkflowService.submitApplication({
        applicationId: draft.id,
        isFeePaid: false
      });
    }).toThrow(/Application fee payment pending in Central Finance/);

    // 3. Valid Submission with fee paid
    const submitted = admissionApplicationWorkflowService.submitApplication({
      applicationId: draft.id,
      isFeePaid: true
    });

    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.is_fee_paid).toBe(true);
  });

  it('TEST 3: Eligibility Rule Engine: Evaluates academic percentage and prerequisite subjects', () => {
    // 1. Eligible Candidate Check (Rohan Sharma - 72.5%)
    const apps = (admissionApplicationWorkflowService as any).applications;
    const rohanApp = apps.find((a: any) => a.applicant_name === 'Rohan Sharma');
    const eligibleOutcome = admissionApplicationWorkflowService.evaluateApplicationEligibility(rohanApp.id);

    expect(eligibleOutcome.eligibilityStatus).toBe('ELIGIBLE');
    expect(eligibleOutcome.application.status).toBe('ELIGIBLE');

    // 2. Ineligible Candidate Check (below 50% threshold)
    const ineligDraft = admissionApplicationWorkflowService.createApplicationDraft({
      sessionId: 'adm-sess-001',
      programIntakeId: 'intake-bca-001',
      applicantName: 'Vikram Singh',
      email: 'vikram.singh@gmail.com',
      mobile: '+919833344455',
      dateOfBirth: '2005-09-10',
      gender: 'MALE',
      category: 'OPEN',
      qualifyingExam: '12th Arts',
      academicPercentage: 44.0, // Ineligible (< 50%)
      hasRequiredSubjects: false
    });

    const ineligOutcome = admissionApplicationWorkflowService.evaluateApplicationEligibility(ineligDraft.id);
    expect(ineligOutcome.eligibilityStatus).toBe('INELIGIBLE');
    expect(ineligOutcome.reasons.length).toBeGreaterThanOrEqual(1);
    expect(ineligOutcome.reasons[0]).toContain('Minimum qualifying marks requirement not met');
  });

  it('TEST 4: Offer Letter Issuance & Acceptance: Manages provisional offers and applicant acceptance', () => {
    const apps = (admissionApplicationWorkflowService as any).applications;
    const rohanApp = apps.find((a: any) => a.applicant_name === 'Rohan Sharma');

    // 1. Issue Offer
    const offer = admissionApplicationWorkflowService.issueAdmissionOffer({
      applicationId: rohanApp.id,
      programId: 'prog-bca',
      validityDays: 10,
      terms: 'Provisional offer valid for 10 days subject to tuition fee payment'
    });

    expect(offer.id).toBeDefined();
    expect(offer.offer_number).toMatch(/^OFFER-2026-\d{6}$/);
    expect(offer.status).toBe('ISSUED');

    // 2. Accept Offer
    const acceptedOffer = admissionApplicationWorkflowService.acceptOffer(offer.id);
    expect(acceptedOffer.status).toBe('ACCEPTED');
  });

  it('TEST 5: Atomic Admission Confirmation & Seat Allocation: Confirms admission, increments seat count and links Student Master', () => {
    const apps = (admissionApplicationWorkflowService as any).applications;
    const rohanApp = apps.find((a: any) => a.applicant_name === 'Rohan Sharma');
    const offers = (admissionApplicationWorkflowService as any).offers;
    const rohanOffer = offers.find((o: any) => o.application_id === rohanApp.id);

    // 1. Confirmation without tuition fee payment must fail
    expect(() => {
      admissionApplicationWorkflowService.confirmAdmission({
        applicationId: rohanApp.id,
        offerId: rohanOffer.id,
        admissionType: 'REGULAR',
        isTuitionFeePaid: false,
        confirmedBy: 'emp-adm-001'
      });
    }).toThrow(/Semester tuition fee payment pending in Central Finance/);

    // 2. Valid Admission Confirmation
    const admission = admissionApplicationWorkflowService.confirmAdmission({
      applicationId: rohanApp.id,
      offerId: rohanOffer.id,
      admissionType: 'REGULAR',
      isTuitionFeePaid: true,
      confirmedBy: 'emp-adm-001'
    });

    expect(admission.id).toBeDefined();
    expect(admission.admission_number).toMatch(/^AD-2026-\d{6}$/);
    expect(admission.enrollment_no).toMatch(/^SSIU26BCA\d{6}$/);
    expect(admission.status).toBe('CONFIRMED');
    expect(rohanApp.status).toBe('ADMITTED');
  });

  it('TEST 6: Admission Funnel Dashboard Metrics: Computes authoritative funnel counts matching underlying records', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['ADMISSION_SESSION_VIEW', 'APPLICATION_VIEW', 'ADMISSION_VIEW']
    };

    const metrics = admissionApplicationWorkflowService.getAdmissionFunnelMetrics(registrarContext);
    expect(metrics.totalProspects).toBeGreaterThanOrEqual(3);
    expect(metrics.totalApplications).toBeGreaterThanOrEqual(3);
    expect(metrics.offersIssued).toBeGreaterThanOrEqual(2);
    expect(metrics.offersAccepted).toBeGreaterThanOrEqual(2);
    expect(metrics.confirmedAdmissions).toBeGreaterThanOrEqual(2);
    expect(metrics.totalProgramCapacity).toBe(120);
    expect(metrics.totalFilledSeats).toBeGreaterThanOrEqual(2);
    expect(metrics.totalRemainingSeats).toBeLessThanOrEqual(118);
  });
});
