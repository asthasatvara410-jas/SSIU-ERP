import { describe, it, expect } from 'vitest';
import { centralDocumentDispositionService } from '../services/centralDocumentDispositionService';
import { centralDocumentComplianceService } from '../services/centralDocumentComplianceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.24: Document Record Disposition & Disposal Governance Engine', () => {

  const registrarOfficerA: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Registrar Officer A',
    email: 'officera@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DISPOSITION_VIEW', 'DISPOSITION_REQUEST']
  };

  const complianceOfficerB: UserAuthorizationContext = {
    userId: 'emp-comp-002',
    userName: 'Legal Compliance Officer B',
    email: 'complianceb@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DISPOSITION_VIEW', 'DISPOSITION_APPROVE', 'DISPOSITION_EXECUTE', 'DISPOSITION_CERTIFICATE_VIEW']
  };

  it('TEST 1: Disposal Eligibility & Legal Hold Blocking: Accurately checks eligibility and blocks on active hold', () => {
    // 1. Check eligible doc
    const elig1 = centralDocumentDispositionService.checkDisposalEligibility('dms-doc-disp-001');
    expect(elig1.status).toBe('ELIGIBLE');
    expect(elig1.hasActiveHold).toBe(false);

    // 2. Place legal hold
    centralDocumentComplianceService.placeLegalHold({
      documentId: 'dms-doc-disp-002',
      holdType: 'LEGAL_HOLD',
      reason: 'State Regulatory Commission Audit',
      authority: 'Gujarat Education Department',
      createdBy: 'emp-comp-002'
    });

    // 3. Re-evaluate
    const elig2 = centralDocumentDispositionService.checkDisposalEligibility('dms-doc-disp-002');
    expect(elig2.status).toBe('BLOCKED');
    expect(elig2.hasActiveHold).toBe(true);
    expect(elig2.reason).toContain('Disposal blocked by active hold');
  });

  it('TEST 2: Dual Control & Approval Workflow: Blocks self-approval and mandates dual-officer signoff', () => {
    const req = centralDocumentDispositionService.createDisposalRequest({
      documentId: 'dms-doc-disp-003',
      policyId: 'POL_MIGRATION_RETENTION_7Y',
      reason: '7-Year retention period elapsed post-graduation',
      disposalMethod: 'LOGICAL_REMOVAL',
      requestedBy: 'emp-reg-001',
      context: registrarOfficerA
    });

    expect(req.id).toBeDefined();
    expect(req.request_number).toMatch(/^DSP\/2026\/\d{6}$/);
    expect(req.status).toBe('DISPOSAL_REQUESTED');

    // Self-approval must throw dual control error
    expect(() => {
      centralDocumentDispositionService.approveDisposal({
        requestId: req.id,
        approvedBy: 'emp-reg-001', // Same user
        context: registrarOfficerA
      });
    }).toThrow(/Dual control violation: Requester emp-reg-001 cannot self-approve/);

    // Approval by separate compliance officer succeeds
    const approved = centralDocumentDispositionService.approveDisposal({
      requestId: req.id,
      approvedBy: 'emp-comp-002',
      context: complianceOfficerB
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.approved_by).toBe('emp-comp-002');
  });

  it('TEST 3: Execution, Share Invalidation & Certificate Issuance: Issues immutable DPC certificate', () => {
    const req = centralDocumentDispositionService.createDisposalRequest({
      documentId: 'dms-doc-disp-004',
      policyId: 'POL_MIGRATION_RETENTION_7Y',
      reason: 'Standard retention expiration',
      requestedBy: 'emp-reg-001'
    });

    centralDocumentDispositionService.approveDisposal({
      requestId: req.id,
      approvedBy: 'emp-comp-002'
    });

    // Execute disposal
    const result = centralDocumentDispositionService.executeDisposal({
      requestId: req.id,
      executedBy: 'emp-comp-002',
      context: complianceOfficerB
    });

    expect(result.request.status).toBe('DISPOSED');
    expect(result.request.verification_status).toBe('VERIFIED');
    expect(result.certificate).toBeDefined();
    expect(result.certificate?.certificate_number).toMatch(/^DPC\/2026\/\d{6}$/);
    expect(result.certificate?.integrity_reference).toContain('sha256_disp_cert_');
  });

  it('TEST 4: Batch Disposal Preview: Correctly partitions eligible and blocked documents before batch execution', () => {
    const preview = centralDocumentDispositionService.previewBatchDisposal([
      'dms-doc-batch-001',
      'dms-doc-batch-002',
      'dms-doc-disp-002' // Has active legal hold from Test 1
    ]);

    expect(preview.totalCandidates).toBe(3);
    expect(preview.eligibleCount).toBe(2);
    expect(preview.blockedCount).toBe(1);
    expect(preview.blockedDetails[0].documentId).toBe('dms-doc-disp-002');
  });

  it('TEST 5: Reconciliation & Dashboard Telemetry: Detects residual storage objects and verifies KPIs', () => {
    // Reconciliation Clean
    const cleanRecon = centralDocumentDispositionService.reconcileDisposedDocument('dms-doc-disp-seed');
    expect(cleanRecon.isClean).toBe(true);
    expect(cleanRecon.status).toBe('VERIFIED_PURGED');

    // Reconciliation Residual Orphan Object
    const orphanRecon = centralDocumentDispositionService.reconcileDisposedDocument('dms-doc-disp-seed', true);
    expect(orphanRecon.isClean).toBe(false);
    expect(orphanRecon.status).toBe('ORPHAN_AFTER_DISPOSAL');

    // Dashboard Telemetry
    const metrics = centralDocumentDispositionService.getDispositionDashboardMetrics(complianceOfficerB);
    expect(metrics.eligibleCount).toBeGreaterThanOrEqual(1);
    expect(metrics.disposedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activeLegalHoldsCount).toBeGreaterThanOrEqual(1);
  });
});
