import { describe, it, expect } from 'vitest';
import { centralDocumentSharingService } from '../services/centralDocumentSharingService';
import { centralDocumentManagementService } from '../services/centralDocumentManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.8: Central Document Sharing, Secure Communication & Delivery Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_SHARE', 'DOCUMENT_SHARE_REVOKE', 'DOCUMENT_VIEW']
  };

  it('TEST 1: Secure Link Generation: Creates secure link with high-entropy token and download quota', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000101',
      senderId: 'emp-reg-001',
      recipientType: 'STUDENT',
      recipientId: 'STU-2026-000001',
      recipientName: 'Aarav Patel',
      recipientEmail: 'aarav.patel@swarrnim.edu.in',
      shareType: 'SECURE_LINK',
      purposeCode: 'PURP_STUDENT_BONAFIDE',
      expiryDays: 7,
      maxDownloads: 2,
      context: registrarContext
    });

    expect(share.id).toBeDefined();
    expect(share.secure_token).toContain('sh_tok_');
    expect(share.secure_link_url).toContain('https://dms.swarrnim.edu.in/share/doc?token=');
    expect(share.delivery_status).toBe('DELIVERED');
    expect(share.max_downloads).toBe(2);
    expect(share.downloads_count).toBe(0);
  });

  it('TEST 2: Download Quota Enforcement: Increments download counts and blocks requests when quota is exceeded', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000102',
      senderId: 'emp-reg-001',
      recipientType: 'EXTERNAL',
      recipientName: 'Embassy Visa Officer',
      recipientEmail: 'visa.verify@embassy.gov.in',
      shareType: 'SECURE_LINK',
      purposeCode: 'PURP_STUDENT_BONAFIDE',
      expiryDays: 5,
      maxDownloads: 1, // Only 1 download allowed
      context: registrarContext
    });

    // 1. First Download: Permitted
    const res1 = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD');
    expect(res1.isAllowed).toBe(true);
    expect(res1.downloadUrl).toContain('/api/v1/dms/download/shared/');
    expect(res1.remainingDownloads).toBe(0);

    // 2. Second Download: Quota Exceeded
    const res2 = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD');
    expect(res2.isAllowed).toBe(false);
    expect(res2.errorMessage).toContain('Download quota exceeded');
  });

  it('TEST 3: Share Revocation Governance: Immediately revokes secure token with recorded reason', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000103',
      senderId: 'emp-reg-001',
      recipientType: 'STUDENT',
      recipientName: 'Rohan Shah',
      recipientEmail: 'rohan.shah@swarrnim.edu.in',
      shareType: 'SECURE_LINK',
      purposeCode: 'PURP_STUDENT_BONAFIDE',
      expiryDays: 10,
      context: registrarContext
    });

    const revoked = centralDocumentSharingService.revokeDocumentShare({
      shareId: share.id,
      revokedBy: 'emp-reg-001',
      reason: 'Shared with incorrect recipient email by mistake'
    });

    expect(revoked.is_revoked).toBe(true);
    expect(revoked.status).toBe('REVOKED');

    // Subsequent access is blocked
    const access = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD');
    expect(access.isAllowed).toBe(false);
    expect(access.errorMessage).toContain('Access Revoked');
  });

  it('TEST 4: Document Invalidation Cascade: Automatically revokes active shares when parent document is revoked', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/BON/2026/000104',
      senderId: 'emp-reg-001',
      recipientType: 'STUDENT',
      recipientName: 'Kavita Dave',
      recipientEmail: 'kavita.dave@swarrnim.edu.in',
      shareType: 'SECURE_LINK',
      purposeCode: 'PURP_STUDENT_BONAFIDE',
      context: registrarContext
    });

    const invalidatedCount = centralDocumentSharingService.invalidateSharesForDocument('dms-doc-001', 'Course change applied');
    expect(invalidatedCount).toBeGreaterThanOrEqual(1);

    const access = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD');
    expect(access.isAllowed).toBe(false);
    expect(access.errorMessage).toContain('Parent document revoked');
  });

  it('TEST 5: Sharing Dashboard Metrics: Computes authoritative share distribution counters', () => {
    const metrics = centralDocumentSharingService.getSharingDashboardMetrics(registrarContext);

    expect(metrics.totalSharesCount).toBeGreaterThanOrEqual(4);
    expect(metrics.deliveredCount).toBeGreaterThanOrEqual(4);
    expect(metrics.revokedCount).toBeGreaterThanOrEqual(2);
  });
});
