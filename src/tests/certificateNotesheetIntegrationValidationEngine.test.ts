import { describe, it, expect } from 'vitest';
import { centralCertificateNotesheetIntegrationValidationService } from '../services/centralCertificateNotesheetIntegrationValidationService';

describe('SSIU ERP – Phase 40.11: Certificates / Notesheet / Central Workflow End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Institutional Dues Clearance Engine: Enforces Zero False Clearance across Tuition, Hostel, Library & Transport', () => {
    // 1. Cleared student
    const cleared = centralCertificateNotesheetIntegrationValidationService.validateInstitutionalClearance({
      tuition: 0,
      library: 0,
      hostel: 0,
      transport: 0
    });
    expect(cleared).toBe(true);

    // 2. Uncleared student (e.g. library fine or tuition balance)
    const uncleared = centralCertificateNotesheetIntegrationValidationService.validateInstitutionalClearance({
      tuition: 0,
      library: 150, // Overdue fine
      hostel: 0,
      transport: 0
    });
    expect(uncleared).toBe(false);
  });

  it('TEST 2: Multi-Tier Approval Chain & Skip Guard: Enforces strict HOD -> Dean -> Registrar sequence and denies skips', () => {
    // 1. Valid sequential approval
    const step1 = centralCertificateNotesheetIntegrationValidationService.validateApprovalTransition('DRAFT', 'APPROVE_AS_HOD');
    expect(step1.isAllowed).toBe(true);
    expect(step1.nextStage).toBe('HOD_APPROVED');

    const step2 = centralCertificateNotesheetIntegrationValidationService.validateApprovalTransition(step1.nextStage as any, 'APPROVE_AS_DEAN');
    expect(step2.isAllowed).toBe(true);
    expect(step2.nextStage).toBe('DEAN_APPROVED');

    const step3 = centralCertificateNotesheetIntegrationValidationService.validateApprovalTransition(step2.nextStage as any, 'APPROVE_AS_REGISTRAR');
    expect(step3.isAllowed).toBe(true);
    expect(step3.nextStage).toBe('REGISTRAR_APPROVED');

    // 2. Illegal approval skip (Draft -> Registrar)
    const illegalSkip = centralCertificateNotesheetIntegrationValidationService.validateApprovalTransition('DRAFT', 'APPROVE_AS_REGISTRAR');
    expect(illegalSkip.isAllowed).toBe(false);
    expect(illegalSkip.error).toContain('Approval Skip Blocked');
  });

  it('TEST 3: Digital Verification & Cryptographic Revocation Registry: Validates active, revoked, and forged credentials', () => {
    const active = new Set<string>(['CERT-DEGREE-2026-STU-101-V2']);
    const revoked = new Set<string>(['CERT-DEGREE-2026-STU-101-V1']);

    // 1. Active certificate
    const statusActive = centralCertificateNotesheetIntegrationValidationService.verifyCertificateStatus('CERT-DEGREE-2026-STU-101-V2', active, revoked);
    expect(statusActive).toBe('VERIFIED');

    // 2. Revoked certificate
    const statusRevoked = centralCertificateNotesheetIntegrationValidationService.verifyCertificateStatus('CERT-DEGREE-2026-STU-101-V1', active, revoked);
    expect(statusRevoked).toBe('REVOKED');

    // 3. Forged certificate
    const statusInvalid = centralCertificateNotesheetIntegrationValidationService.verifyCertificateStatus('CERT-FORGED-999', active, revoked);
    expect(statusInvalid).toBe('INVALID');
  });

  it('TEST 4: Complete 20-Step Certificate & Notesheet Lifecycle: Verifies unbroken chain from request to reissued degree certificate', () => {
    const summary = centralCertificateNotesheetIntegrationValidationService.runCompleteCertificateNotesheetScenario();

    expect(summary.request_id).toBe('REQ-CERT-2026-001');
    expect(summary.notesheet_id).toBe('NS-2026-001');
    expect(summary.student_id).toBe('STU-2026-101');
    expect(summary.dues_cleared).toBe(true);
    expect(summary.approval_chain_completed).toBe(true);
    expect(summary.verification_status).toBe('VERIFIED');
    expect(summary.active_certificate_id).toContain('CERT-DEGREE-2026-STU-2026-101-V2');
    expect(summary.superseded_certificate_id).toContain('CERT-DEGREE-2026-STU-2026-101-V1');
    expect(summary.audit_logged).toBe(true);
  });

  it('TEST 5: Phase 40.11 Final Gate Execution: Confirms green status across all 51 Certificate / Notesheet / Workflow criteria', () => {
    const gateReport = centralCertificateNotesheetIntegrationValidationService.runFullCertificateNotesheetGate();

    expect(gateReport.certificateRequestAndEligibilityPassed).toBe(true);
    expect(gateReport.notesheetCreationAndMultiTierApprovalPassed).toBe(true);
    expect(gateReport.approvalSkipAndSeparationOfDutiesPassed).toBe(true);
    expect(gateReport.certificateGenerationAndTemplatePassed).toBe(true);
    expect(gateReport.digitalVerificationPassed).toBe(true);
    expect(gateReport.certificateRevocationAndReissuePassed).toBe(true);
    expect(gateReport.immutableAuditTrailPassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
