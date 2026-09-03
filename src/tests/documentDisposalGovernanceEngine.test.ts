import { describe, it, expect } from 'vitest';
import { centralDocumentDisposalService } from '../services/centralDocumentDisposalService';
import { centralDocumentManagementService } from '../services/centralDocumentManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.9: Central Document Disposal, Secure Deletion & Compliance Governance Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DISPOSAL_VIEW', 'DISPOSAL_APPROVE', 'DISPOSAL_EXECUTE', 'DISPOSAL_AUDIT']
  };

  it('TEST 1: Eligibility Evaluation: Confirms retention completion and validates legal hold clearance', () => {
    const eligibility = centralDocumentDisposalService.evaluateDisposalEligibility('dms-doc-001');

    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.hasLegalHold).toBe(false);
    expect(eligibility.policyCode).toBe('RET_ACADEMIC_PERM');
  });

  it('TEST 2: Separation of Duties Enforcement: Prevents self-approval of disposal requests', () => {
    const req = centralDocumentDisposalService.createDisposalRequest({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000101',
      reasonCode: 'RETENTION_EXPIRED',
      reasonDetails: '7-year retention period completed',
      requestedBy: 'emp-staff-001',
      context: registrarContext
    });

    expect(req.id).toBeDefined();
    expect(req.status).toBe('PENDING_APPROVAL');

    // Self-approval attempt must fail
    expect(() => {
      centralDocumentDisposalService.approveDisposalRequest({
        requestId: req.id,
        approvedBy: 'emp-staff-001', // Same user as requester
        context: registrarContext
      });
    }).toThrow(/Separation of Duties Violation: Requester cannot approve their own disposal request/);

    // Approval by distinct authorized officer succeeds
    const approved = centralDocumentDisposalService.approveDisposalRequest({
      requestId: req.id,
      approvedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.approved_by).toBe('emp-reg-001');
  });

  it('TEST 3: End-to-End Disposal Execution & Cryptographic Certificate: Irreversibly disposes document and issues certificate', () => {
    const req = centralDocumentDisposalService.createDisposalRequest({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000102',
      reasonCode: 'SUPERSEDED',
      reasonDetails: 'Superseded by updated university record',
      requestedBy: 'emp-staff-002',
      context: registrarContext
    });

    centralDocumentDisposalService.approveDisposalRequest({
      requestId: req.id,
      approvedBy: 'emp-reg-001',
      context: registrarContext
    });

    const cert = centralDocumentDisposalService.executeDisposal({
      requestId: req.id,
      executedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(cert.id).toBeDefined();
    expect(cert.certificate_number).toContain('SSIU/DISP/2026/');
    expect(cert.status).toBe('DISPOSED_AND_VERIFIED');
    expect(cert.content_hash).toBeDefined();
    expect(cert.disposal_timestamp).toBeDefined();
  });

  it('TEST 4: Pre-Execution Legal Hold Race-Condition Check: Aborts disposal if legal hold is placed before deletion', () => {
    const doc = centralDocumentManagementService.getDocumentById('dms-doc-001');
    if (doc) {
      doc.status = 'ACTIVE';
      doc.is_legal_hold = false;
    }

    const req = centralDocumentDisposalService.createDisposalRequest({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000103',
      reasonCode: 'RETENTION_EXPIRED',
      reasonDetails: 'Routine disposal',
      requestedBy: 'emp-staff-003',
      context: registrarContext
    });

    centralDocumentDisposalService.approveDisposalRequest({
      requestId: req.id,
      approvedBy: 'emp-reg-001',
      context: registrarContext
    });

    // Simulate active legal hold placed on document right before execution
    if (doc) doc.is_legal_hold = true;

    expect(() => {
      centralDocumentDisposalService.executeDisposal({
        requestId: req.id,
        executedBy: 'emp-reg-001',
        context: registrarContext
      });
    }).toThrow(/Disposal Execution Aborted: Legal hold was activated/);

    // Clean up
    if (doc) doc.is_legal_hold = false;
  });

  it('TEST 5: Disposal Dashboard Metrics: Computes authoritative disposal and legal hold counters', () => {
    const metrics = centralDocumentDisposalService.getDisposalDashboardMetrics(registrarContext);

    expect(metrics.eligibleCount).toBeGreaterThanOrEqual(1);
    expect(metrics.disposedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activeLegalHoldsCount).toBe(1);
  });
});
