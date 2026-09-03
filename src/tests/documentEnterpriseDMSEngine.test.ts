import { describe, it, expect } from 'vitest';
import { centralEnterpriseDMSPlatformService } from '../services/centralEnterpriseDMSPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.61: Enterprise Document Management (EDMS) Platform Engine', () => {

  const docAdmin: UserAuthorizationContext = {
    userId: 'emp-dms-admin-001',
    userName: 'Enterprise Document Platform Administrator',
    email: 'dms.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['DOCUMENT_PLATFORM_ADMIN', 'SYSTEM_ADMIN']
  };

  const facultyUserA: UserAuthorizationContext = {
    userId: 'emp-faculty-001',
    userName: 'Prof. Jigar Parmar',
    email: 'jigar.parmar@swarrnim.edu.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    permissions: ['DOCUMENT_EDIT', 'DOCUMENT_VIEW']
  };

  const facultyUserB: UserAuthorizationContext = {
    userId: 'emp-faculty-002',
    userName: 'Prof. Anjali Shah',
    email: 'anjali.shah@swarrnim.edu.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    permissions: ['DOCUMENT_EDIT', 'DOCUMENT_VIEW']
  };

  it('TEST 1: Check-Out / Check-In Collaboration: Manages exclusive checkout locks and generates immutable versions', () => {
    const docId = 'EDMS-POL-2026-001';

    // 1. User A checks out document
    const checkedOut = centralEnterpriseDMSPlatformService.checkOutDocument(docId, facultyUserA);
    expect(checkedOut.checked_out_by).toBe('emp-faculty-001');

    // 2. User B concurrent check-out attempt is blocked
    expect(() => {
      centralEnterpriseDMSPlatformService.checkOutDocument(docId, facultyUserB);
    }).toThrow(/423 Locked: Document EDMS-POL-2026-001 is currently checked out by emp-faculty-001/);

    // 3. User A checks in new revision
    const newVersion = centralEnterpriseDMSPlatformService.checkInDocument({
      documentId: docId,
      newChecksum: 'b789123456789abcdef0123456789abcdef0123456789abcdef0123456789abc',
      newSize: 1100000,
      context: facultyUserA
    });

    expect(newVersion.version_number).toBe('v2.0');
    expect(newVersion.is_immutable).toBe(true);
  });

  it('TEST 2: Multi-Level Approval & E-Signature: Applies cryptographic signature metadata and publishes version', () => {
    const docId = 'EDMS-POL-2026-001';

    const signedDoc = centralEnterpriseDMSPlatformService.approveAndSignDocument({
      documentId: docId,
      signerName: 'Prof. Jigar Parmar (Dean Academic Affairs)',
      context: docAdmin
    });

    expect(signedDoc.status).toBe('PUBLISHED');
  });

  it('TEST 3: Dynamic Watermarking & Irreversible Redaction: Renders access watermarks and generates clean redacted versions', () => {
    const docId = 'EDMS-POL-2026-001';

    // 1. Watermarked preview
    const preview = centralEnterpriseDMSPlatformService.generateWatermarkedPreview(docId, facultyUserA);
    expect(preview.watermarkText).toContain('CONFIDENTIAL - ACCESSED BY PROF. JIGAR PARMAR (EMP-FACULTY-001)');
    expect(preview.classification).toBe('CONFIDENTIAL');

    // 2. Permanent redaction
    const redactedVersion = centralEnterpriseDMSPlatformService.applyPermanentRedaction({
      documentId: docId,
      redactedFields: ['student_phone', 'internal_financial_estimate'],
      context: docAdmin
    });

    expect(redactedVersion.version_number).toContain('-REDACTED');
    expect(redactedVersion.is_immutable).toBe(true);
  });

  it('TEST 4: Legal Hold & Disposition Safeguards: Blocks destruction of documents under active Legal Hold', () => {
    const docId = 'EDMS-POL-2026-001';

    // 1. Apply Legal Hold
    centralEnterpriseDMSPlatformService.setLegalHold(docId, true);

    // 2. Disposition blocked
    expect(() => {
      centralEnterpriseDMSPlatformService.disposeDocument(docId, docAdmin);
    }).toThrow(/403 Forbidden: Document EDMS-POL-2026-001 is under active Legal Hold and cannot be disposed/);

    // 3. Release Legal Hold and dispose
    centralEnterpriseDMSPlatformService.setLegalHold(docId, false);
    const disposition = centralEnterpriseDMSPlatformService.disposeDocument(docId, docAdmin);
    expect(disposition.disposed).toBe(true);
  });

  it('TEST 5: DMS Platform Dashboard Telemetry: Validates total documents (112k+), legal holds (14), and platform posture', () => {
    const metrics = centralEnterpriseDMSPlatformService.getDMSDashboardMetrics(docAdmin);

    expect(metrics.totalDocumentsCount).toBeGreaterThan(100000);
    expect(metrics.documentsUnderLegalHoldCount).toBe(14);
    expect(metrics.dlpIncidentsBlockedCount).toBe(0);
    expect(metrics.dmsPlatformPosture).toBe('HEALTHY');
  });
});
