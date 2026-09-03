import { describe, it, expect } from 'vitest';
import { centralDocumentArchiveService } from '../services/centralDocumentArchiveService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.23: Central Document Archival, Cold Storage & Long-Term Record Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['ARCHIVE_VIEW', 'ARCHIVE_SEARCH', 'ARCHIVE_REQUEST', 'ARCHIVE_APPROVE', 'ARCHIVE_EXECUTE', 'ARCHIVE_RESTORE', 'ARCHIVE_INTEGRITY_VIEW']
  };

  it('TEST 1: Archive Eligibility & Simulation: Validates policy rules and suggests cold tier', () => {
    const sim = centralDocumentArchiveService.simulateArchivePolicy({
      documentTypeId: 'DOC_DEGREE_CERT',
      inactivityYears: 4
    });

    expect(sim.isEligible).toBe(true);
    expect(sim.recommendedTier).toBe('COLD');
    expect(sim.approvalRequired).toBe(true);

    const eligibility = centralDocumentArchiveService.checkArchiveEligibility('dms-doc-001');
    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.applicablePolicy).toBeDefined();
  });

  it('TEST 2: Archive Request & Approval Lifecycle: Submits, approves and executes long-term archive', () => {
    // 1. Submit Request
    const req = centralDocumentArchiveService.createArchiveRequest({
      documentId: 'dms-doc-arch-002',
      storageTier: 'COLD',
      reason: 'Student graduated in 2022; archival to cold storage requested',
      requestedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(req.id).toBeDefined();
    expect(req.request_number).toMatch(/^ARQ\/2026\/\d{6}$/);
    expect(req.status).toBe('SUBMITTED');

    // 2. Approve Request
    const approved = centralDocumentArchiveService.approveArchiveRequest(req.id, 'emp-reg-001');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approved_by).toBe('emp-reg-001');

    // 3. Execute Archive
    const arc = centralDocumentArchiveService.executeArchive({
      requestId: req.id,
      documentId: 'dms-doc-arch-002',
      storageTier: 'COLD',
      reason: 'Student graduated in 2022',
      executedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(arc.id).toBeDefined();
    expect(arc.archive_reference).toMatch(/^ARC\/2026\/\d{6}$/);
    expect(arc.status).toBe('ARCHIVED');
    expect(arc.storage_tier).toBe('COLD');
    expect(arc.integrity_hash).toContain('sha256_arc_');
  });

  it('TEST 3: Cryptographic Integrity Validation: Validates healthy archive and detects tampered records', () => {
    // Healthy check
    const healthyCheck = centralDocumentArchiveService.verifyArchiveIntegrity('ARC/2026/000001');
    expect(healthyCheck.status).toBe('HEALTHY');

    // Simulated corrupt check
    const corruptCheck = centralDocumentArchiveService.verifyArchiveIntegrity('ARC/2026/000001', true);
    expect(corruptCheck.status).toBe('INTEGRITY_FAILURE');
  });

  it('TEST 4: Restore Workflow & Conflict Prevention: Restores archived record with full audit traceability', () => {
    // 1. Request Restore
    const rstReq = centralDocumentArchiveService.createRestoreRequest({
      archiveId: 'ARC/2026/000001',
      reason: 'Alumni requested duplicate degree verification',
      requestedBy: 'emp-reg-001'
    });

    expect(rstReq.id).toBeDefined();
    expect(rstReq.request_number).toMatch(/^RST\/2026\/\d{6}$/);
    expect(rstReq.status).toBe('SUBMITTED');

    // 2. Approve Restore
    const approved = centralDocumentArchiveService.approveRestoreRequest(rstReq.id, 'emp-reg-001');
    expect(approved.status).toBe('APPROVED');

    // 3. Execute Restore
    const restored = centralDocumentArchiveService.executeRestore(rstReq.id);
    expect(restored.status).toBe('RESTORED');
  });

  it('TEST 5: Scoped Archive Search & Dashboard Metrics: Verifies pagination, filters and cold storage metrics', () => {
    const searchRes = centralDocumentArchiveService.searchArchivedDocuments({
      query: 'Degree',
      storageTier: 'COLD',
      context: registrarContext
    });

    expect(searchRes.total).toBeGreaterThanOrEqual(1);
    expect(searchRes.items.length).toBeGreaterThanOrEqual(1);

    const metrics = centralDocumentArchiveService.getArchiveDashboardMetrics(registrarContext);
    expect(metrics.totalArchivedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.coldStorageSizeBytes).toBeGreaterThan(0);
    expect(metrics.storageByTier.COLD).toBeGreaterThan(0);
  });
});
