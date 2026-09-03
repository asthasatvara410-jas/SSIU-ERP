import { describe, it, expect } from 'vitest';
import { documentVerificationApprovalService } from '../services/documentVerificationApprovalService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.2: Document Verification, Approval & Checklist Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_VERIFY', 'DOCUMENT_APPROVE', 'DOCUMENT_WAIVE']
  };

  it('TEST 1: Checklist Progress & Completion: Calculates verified items and completeness percentage', () => {
    // STU-2026-000001 has Aadhaar verified (1 out of 4) -> 25%
    const progress = documentVerificationApprovalService.evaluateChecklistProgress('STU-2026-000001', 'prog-bca');

    expect(progress.totalRequired).toBe(4);
    expect(progress.satisfiedCount).toBeGreaterThanOrEqual(1);
    expect(progress.completionPercentage).toBeGreaterThanOrEqual(25);
    expect(progress.itemDetails.find(i => i.documentTypeCode === 'DOC_AADHAAR')?.status).toBe('VERIFIED');
  });

  it('TEST 2: Document Requirement Waiver: Waives requirement with mandatory justification and updates progress', () => {
    // 1. Waiver without reason fails
    expect(() => {
      documentVerificationApprovalService.waiveChecklistRequirement({
        entityId: 'STU-2026-000001',
        documentTypeCode: 'DOC_MIGRATION_CERT',
        waivedBy: 'emp-reg-001',
        reason: ''
      });
    }).toThrow(/Mandatory justification reason required/);

    // 2. Valid waiver
    const waived = documentVerificationApprovalService.waiveChecklistRequirement({
      entityId: 'STU-2026-000001',
      documentTypeCode: 'DOC_MIGRATION_CERT',
      waivedBy: 'emp-reg-001',
      reason: 'Admitted under internal university progression scheme'
    });

    expect(waived.waivers['DOC_MIGRATION_CERT']).toBeDefined();
    expect(waived.waivers['DOC_MIGRATION_CERT'].reason).toContain('internal university progression');

    // 3. Re-evaluate progress
    const updated = documentVerificationApprovalService.evaluateChecklistProgress('STU-2026-000001', 'prog-bca');
    expect(updated.itemDetails.find(i => i.documentTypeCode === 'DOC_MIGRATION_CERT')?.status).toBe('WAIVED');
  });

  it('TEST 3: Review Queue & Reviewer Lock: Enforces single-reviewer exclusive lock and prevents concurrent conflict', () => {
    // 1. Reviewer A locks document
    const locked = documentVerificationApprovalService.lockDocumentForReview({
      queueItemId: 'queue-001',
      reviewerId: 'emp-rev-001'
    });

    expect(locked.status).toBe('IN_REVIEW');
    expect(locked.locked_by).toBe('emp-rev-001');

    // 2. Reviewer B attempting to lock same document is blocked
    expect(() => {
      documentVerificationApprovalService.lockDocumentForReview({
        queueItemId: 'queue-001',
        reviewerId: 'emp-rev-002'
      });
    }).toThrow(/Review Lock: Document is currently being reviewed by emp-rev-001/);

    // 3. Reviewer A releases lock
    const released = documentVerificationApprovalService.releaseReviewLock('queue-001', 'emp-rev-001');
    expect(released.locked_by).toBeUndefined();
    expect(released.status).toBe('PENDING');
  });

  it('TEST 4: Multi-Level Approval Workflow: Initiates workflow and records multi-level approval', () => {
    const wf = documentVerificationApprovalService.initiateApprovalWorkflow({
      documentId: 'dms-doc-001',
      versionId: 'ver-001',
      level: 'LEVEL_2_HOD',
      approverId: 'emp-hod-001'
    });

    expect(wf.id).toBeDefined();
    expect(wf.approval_status).toBe('PENDING');

    const approved = documentVerificationApprovalService.approveWorkflowStep(wf.id, 'emp-hod-001', 'Curriculum transcript verified');
    expect(approved.approval_status).toBe('APPROVED');
    expect(approved.approved_at).toBeDefined();
  });

  it('TEST 5: Verification Dashboard Metrics: Computes authoritative verification, review queue and checklist counters', () => {
    const metrics = documentVerificationApprovalService.getVerificationDashboardMetrics(registrarContext);

    expect(metrics.activeChecklistsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.expiringSoonCount).toBe(1);
  });
});
