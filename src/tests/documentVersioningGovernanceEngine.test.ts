import { describe, it, expect } from 'vitest';
import { centralDocumentVersioningService } from '../services/centralDocumentVersioningService';
import { centralDocumentManagementService } from '../services/centralDocumentManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.13: Central Document Versioning, Lineage & Version Restoration Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['VERSION_VIEW', 'VERSION_CREATE', 'VERSION_PUBLISH', 'VERSION_RESTORE']
  };

  it('TEST 1: Minor vs Major Increments: Correctly computes 1.1 (minor) and 2.0 (major) version numbering', () => {
    // 1. Create Minor Version Draft (1.0 -> 1.1)
    const minorDraft = centralDocumentVersioningService.createDraftVersion({
      documentId: 'dms-doc-001',
      versionType: 'MINOR',
      fileName: 'Aadhaar_Card_AaravPatel_v1.1.pdf',
      fileSizeBytes: 1250000,
      mimeType: 'application/pdf',
      contentPayload: 'Aadhaar Card - Aarav Patel - Minor Address Update 2026\nAddress: Gandhinagar, Gujarat',
      changeReason: 'Address Correction',
      changeSummary: 'Updated residential address field per student request',
      createdBy: 'emp-reg-001'
    });

    expect(minorDraft.version_number).toBe('1.1');
    expect(minorDraft.major).toBe(1);
    expect(minorDraft.minor).toBe(1);
    expect(minorDraft.status).toBe('DRAFT');

    // 2. Create Major Version Draft (1.0/1.1 -> 2.0)
    const majorDraft = centralDocumentVersioningService.createDraftVersion({
      documentId: 'dms-doc-001',
      versionType: 'MAJOR',
      fileName: 'Aadhaar_Card_AaravPatel_v2.0.pdf',
      fileSizeBytes: 1300000,
      mimeType: 'application/pdf',
      contentPayload: 'Aadhaar Card - Aarav Patel - Official Biometric Re-issue 2026\nBiometric UID: 99882233',
      changeReason: 'Official UIDAI Re-issue',
      changeSummary: 'Complete document replacement with new biometric UID update',
      createdBy: 'emp-reg-001'
    });

    expect(majorDraft.version_number).toBe('2.0');
    expect(majorDraft.major).toBe(2);
    expect(majorDraft.minor).toBe(0);
    expect(majorDraft.status).toBe('DRAFT');
  });

  it('TEST 2: Publishing & Supersession: Transitions previous version to SUPERSEDED upon publishing new version', () => {
    const historyBefore = centralDocumentVersioningService.getVersionHistory('dms-doc-001');
    const majorDraft = historyBefore.find(v => v.version_number === '2.0');
    expect(majorDraft).toBeDefined();

    const published = centralDocumentVersioningService.publishVersion({
      versionId: majorDraft!.id,
      publishedBy: 'emp-reg-001',
      approvedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(published.status).toBe('PUBLISHED');
    expect(published.published_at).toBeDefined();

    // Baseline 1.0 must now be SUPERSEDED
    const v1 = historyBefore.find(v => v.version_number === '1.0');
    expect(v1?.status).toBe('SUPERSEDED');
    expect(v1?.superseded_at).toBeDefined();

    // Central DMS current_version_id must point to 2.0
    const dmsDoc = centralDocumentManagementService.getDocumentById('dms-doc-001');
    expect(dmsDoc?.current_version_id).toBe(published.id);
  });

  it('TEST 3: Non-Destructive Version Restore: Restoring historical 1.0 creates a new Version 3.0', () => {
    const history = centralDocumentVersioningService.getVersionHistory('dms-doc-001');
    const v1 = history.find(v => v.version_number === '1.0');
    expect(v1).toBeDefined();

    // Restore from historical Version 1.0
    const restored = centralDocumentVersioningService.restoreVersionAsNew({
      documentId: 'dms-doc-001',
      historicalVersionId: v1!.id,
      restorationReason: 'Legal compliance requires reverting to baseline admission identity record',
      restoredBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(restored.version_number).toBe('3.0');
    expect(restored.status).toBe('PUBLISHED');
    expect(restored.source_version_id).toBe(v1!.id);
    expect(restored.change_reason).toContain('Restored from historical Version 1.0');

    // Previous version 2.0 is now SUPERSEDED
    const v2 = centralDocumentVersioningService.getVersionHistory('dms-doc-001').find(v => v.version_number === '2.0');
    expect(v2?.status).toBe('SUPERSEDED');
  });

  it('TEST 4: Version Comparison & Diff Engine: Accurately identifies added and removed content lines', () => {
    const history = centralDocumentVersioningService.getVersionHistory('dms-doc-001');
    const v1 = history.find(v => v.version_number === '1.0');
    const v2 = history.find(v => v.version_number === '2.0');

    expect(v1).toBeDefined();
    expect(v2).toBeDefined();

    const diff = centralDocumentVersioningService.compareVersions(v1!.id, v2!.id);

    expect(diff.versionA).toBe('1.0');
    expect(diff.versionB).toBe('2.0');
    expect(diff.isIdentical).toBe(false);
    expect(diff.contentChanges.added.length).toBeGreaterThanOrEqual(1);
    expect(diff.contentChanges.removed.length).toBeGreaterThanOrEqual(1);
    expect(diff.metadataChanges.file_name).toBeDefined();
  });

  it('TEST 5: Versioning Dashboard Metrics: Computes authoritative version distribution counters', () => {
    const metrics = centralDocumentVersioningService.getVersioningDashboardMetrics(registrarContext);

    expect(metrics.totalVersionsCount).toBeGreaterThanOrEqual(4);
    expect(metrics.publishedVersionsCount).toBe(1);
    expect(metrics.supersededVersionsCount).toBeGreaterThanOrEqual(2);
    expect(metrics.restoredVersionsCount).toBeGreaterThanOrEqual(1);
  });
});
