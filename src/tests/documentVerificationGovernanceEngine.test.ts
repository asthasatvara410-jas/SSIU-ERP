import { describe, it, expect } from 'vitest';
import { centralDocumentVerificationService } from '../services/centralDocumentVerificationService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.12: Central Document Verification, Evidence & Version Isolation Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['VERIFICATION_VIEW', 'VERIFICATION_EXECUTE', 'VERIFICATION_APPROVE', 'VERIFICATION_REVERIFY']
  };

  it('TEST 1: Verification Request Creation & Type Master: Creates verification with unique number', () => {
    const verif = centralDocumentVerificationService.createVerificationRequest({
      documentId: 'dms-doc-001',
      documentVersionId: 'ver-001',
      verificationTypeCode: 'IDENTITY',
      requestedBy: 'STU-2026-000001',
      assignedTo: 'emp-reg-001',
      context: registrarContext
    });

    expect(verif.id).toBeDefined();
    expect(verif.verification_number).toContain('SSIU/VER/2026/');
    expect(verif.status).toBe('IN_REVIEW');
    expect(verif.verification_type_code).toBe('IDENTITY');
  });

  it('TEST 2: Evidence Collection & Verification Completion: Records evidence and sets verification expiry', () => {
    const verif = centralDocumentVerificationService.createVerificationRequest({
      documentId: 'dms-doc-001',
      documentVersionId: 'ver-001',
      verificationTypeCode: 'IDENTITY',
      requestedBy: 'STU-2026-000001',
      assignedTo: 'emp-reg-001',
      context: registrarContext
    });

    // Add Evidence
    const ev1 = centralDocumentVerificationService.addEvidence({
      verificationId: verif.id,
      evidenceType: 'INTERNAL_RECORD',
      source: 'Student Admission Master Record',
      reference: 'APP-2026-000001',
      result: 'PASSED',
      notes: 'Name and DOB match Aadhaar document exactly',
      createdBy: 'emp-reg-001'
    });

    expect(ev1.id).toBeDefined();
    expect(verif.evidence.length).toBe(1);

    // Complete Verification
    const completed = centralDocumentVerificationService.completeVerification({
      verificationId: verif.id,
      decision: 'VERIFY',
      verifiedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(completed.status).toBe('VERIFIED');
    expect(completed.result).toBe('AUTHENTIC');
    expect(completed.completed_at).toBeDefined();
    expect(completed.expires_at).toBeDefined(); // 24-month validity for Identity
  });

  it('TEST 3: Rejection Governance: Enforces mandatory rejection reason for invalid documents', () => {
    const verif = centralDocumentVerificationService.createVerificationRequest({
      documentId: 'dms-doc-001',
      documentVersionId: 'ver-001',
      verificationTypeCode: 'ACADEMIC',
      requestedBy: 'STU-2026-000002',
      assignedTo: 'emp-reg-001',
      context: registrarContext
    });

    // Rejection without reason must fail
    expect(() => {
      centralDocumentVerificationService.completeVerification({
        verificationId: verif.id,
        decision: 'REJECT',
        verifiedBy: 'emp-reg-001',
        context: registrarContext
      });
    }).toThrow(/Mandatory rejection reason required/);

    // Rejection with reason succeeds
    const rejected = centralDocumentVerificationService.completeVerification({
      verificationId: verif.id,
      decision: 'REJECT',
      rejectionReason: 'Illegible photocopy and missing official seal',
      verifiedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.result).toBe('NOT_AUTHENTIC');
    expect(rejected.rejection_reason).toBe('Illegible photocopy and missing official seal');
  });

  it('TEST 4: Version Isolation: Ensures verified status of v1 does not blindly validate v2', () => {
    // Check verification for ver-001
    const v1 = centralDocumentVerificationService.getVerificationForVersion('dms-doc-001', 'ver-001');
    expect(v1).toBeDefined();
    expect(v1?.status).toBe('VERIFIED');

    // Check verification for ver-002 (unverified new version)
    const v2 = centralDocumentVerificationService.getVerificationForVersion('dms-doc-001', 'ver-002');
    expect(v2).toBeUndefined();
  });

  it('TEST 5: Re-Verification & Dashboard Metrics: Creates reverification link without altering past history', () => {
    // Request re-verification
    const reverif = centralDocumentVerificationService.requestReverification({
      previousVerificationId: 'verif-demo-001',
      requestedBy: 'STU-2026-000001',
      reason: 'Periodic 2-year compliance re-verification'
    });

    expect(reverif.id).toBeDefined();
    expect(reverif.is_reverification).toBe(true);
    expect(reverif.previous_verification_id).toBe('verif-demo-001');
    expect(reverif.status).toBe('PENDING');

    const metrics = centralDocumentVerificationService.getVerificationDashboardMetrics(registrarContext);

    expect(metrics.totalVerificationsCount).toBeGreaterThanOrEqual(4);
    expect(metrics.verifiedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.rejectedCount).toBeGreaterThanOrEqual(1);
  });
});
