import { describe, it, expect } from 'vitest';
import { documentRetentionGovernanceService } from '../services/documentRetentionGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.3: Document Retention, Archive & Governance Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_RETENTION_MANAGE', 'DOCUMENT_LEGAL_HOLD', 'DOCUMENT_DISPOSE']
  };

  it('TEST 1: Retention Calculation & Registration: Calculates accurate retention dates based on policy', () => {
    const item = documentRetentionGovernanceService.registerDocumentRetention({
      documentId: 'dms-doc-fin-001',
      documentTypeCode: 'DOC_FIN_INVOICE',
      ownerType: 'TRANSACTION',
      ownerId: 'TXN-2026-0001',
      policyCode: 'RET_FIN_INVOICE_8YR',
      startDate: '2026-04-10'
    });

    expect(item.policy_id).toBe('pol-fin-invoice');
    expect(item.retention_end_date).toContain('2034'); // 2026 + 8 years = 2034
    expect(item.status).toBe('ACTIVE');
    expect(item.storage_tier).toBe('HOT');
  });

  it('TEST 2: Legal Hold Governance & Disposal Blocking: Protects document against disposal under active hold', () => {
    // 1. Apply Legal Hold
    const hold = documentRetentionGovernanceService.applyLegalHold({
      name: 'High Court Compliance Audit Hold',
      description: 'Audit concerning all 2026 fee transaction records',
      scope: 'DOCUMENT',
      targetId: 'dms-doc-fin-001',
      createdBy: 'emp-reg-001',
      justification: 'Court notification received regarding taxation audit'
    });

    expect(hold.status).toBe('ACTIVE');

    // 2. Disposal attempt while under Legal Hold must be blocked
    expect(() => {
      documentRetentionGovernanceService.executeDocumentDisposal({
        documentId: 'dms-doc-fin-001',
        approvedBy: 'emp-reg-001',
        executorId: 'emp-reg-001',
        justification: 'Routine disposal'
      });
    }).toThrow(/Legal Hold Violation: Disposal strictly blocked for documents under Legal Hold/);

    // 3. Release Legal Hold
    const released = documentRetentionGovernanceService.releaseLegalHold(
      hold.id,
      'emp-reg-001',
      'Taxation audit completed with full compliance clearance'
    );
    expect(released.status).toBe('RELEASED');
  });

  it('TEST 3: Archival & Restore Flow: Archives to cold storage and restores with mandatory justification', () => {
    // 1. Archive document
    const archived = documentRetentionGovernanceService.archiveDocument(
      'dms-doc-fin-001',
      'emp-reg-001',
      'Financial year closed, transitioning to archive storage'
    );
    expect(archived.status).toBe('ARCHIVED');
    expect(archived.storage_tier).toBe('ARCHIVE');

    // 2. Restore without reason fails
    expect(() => {
      documentRetentionGovernanceService.restoreDocument('dms-doc-fin-001', 'emp-reg-001', '');
    }).toThrow(/Mandatory reason required to restore archived document/);

    // 3. Valid restore
    const restored = documentRetentionGovernanceService.restoreDocument(
      'dms-doc-fin-001',
      'emp-reg-001',
      'Re-opened for internal comptroller review'
    );
    expect(restored.status).toBe('ACTIVE');
    expect(restored.storage_tier).toBe('HOT');
  });

  it('TEST 4: Controlled Disposal & Certificate Issuance: Issues immutable disposal certificate', () => {
    // 1. Disposal without reason fails
    expect(() => {
      documentRetentionGovernanceService.executeDocumentDisposal({
        documentId: 'dms-doc-fin-001',
        approvedBy: 'emp-reg-001',
        executorId: 'emp-reg-001',
        justification: ''
      });
    }).toThrow(/Mandatory justification required to execute document disposal/);

    // 2. Valid Disposal
    const cert = documentRetentionGovernanceService.executeDocumentDisposal({
      documentId: 'dms-doc-fin-001',
      approvedBy: 'emp-reg-001',
      executorId: 'emp-reg-001',
      justification: 'Retention cycle elapsed and statutory requirements completed'
    });

    expect(cert.id).toBeDefined();
    expect(cert.document_id).toBe('dms-doc-fin-001');
    expect(cert.storage_tier_removed).toBe('PHYSICAL_STORAGE_PURGED');
  });

  it('TEST 5: Retention Compliance Dashboard Metrics: Computes authoritative retention, hold, and disposal counters', () => {
    const metrics = documentRetentionGovernanceService.getRetentionDashboardMetrics(registrarContext);

    expect(metrics.totalUnderRetention).toBeGreaterThanOrEqual(1);
    expect(metrics.disposedDocumentsCount).toBeGreaterThanOrEqual(1);
  });
});
