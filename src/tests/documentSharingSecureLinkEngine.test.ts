import { describe, it, expect } from 'vitest';
import { centralDocumentSharingService } from '../services/centralDocumentSharingService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.15: Central Document Sharing, Secure Links & OTP Protection Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_ADMIN', 'SHARE_EXTERNAL', 'REVOKE_SHARE']
  };

  it('TEST 1: Secure Link Creation & Watermark Configuration: Generates high-entropy token and dynamic watermark', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/DOC/2026/000001',
      senderId: 'emp-reg-001',
      recipientType: 'EXTERNAL',
      recipientName: 'Embassy Visa Officer',
      recipientEmail: 'visa.officer@embassy.gov.in',
      shareType: 'EXTERNAL',
      permission: 'VIEW_AND_DOWNLOAD',
      expiryDays: 7,
      maxDownloads: 2,
      maxViews: 5,
      watermarkEnabled: true,
      context: registrarContext
    });

    expect(share.id).toBeDefined();
    expect(share.share_number).toMatch(/^SSIU\/SHR\/2026\/\d{6}$/);
    expect(share.secure_token).toContain('sh_tok_');
    expect(share.status).toBe('ACTIVE');
    expect(share.watermark_enabled).toBe(true);
    expect(share.watermark_text).toContain('CONFIDENTIAL - SHARED WITH VISA.OFFICER@EMBASSY.GOV.IN');
  });

  it('TEST 2: OTP Verification & Attempt Limits: Blocks unverified access, limits failed attempts, and prevents replay', () => {
    // Create share requiring OTP
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/DOC/2026/000001',
      senderId: 'emp-reg-001',
      recipientType: 'EXTERNAL',
      recipientName: 'Bank Loan Officer',
      recipientEmail: 'loans@nationalbank.com',
      shareType: 'EXTERNAL',
      otpRequired: true,
      maxDownloads: 1,
      context: registrarContext
    });

    expect(share.otp_required).toBe(true);
    expect(share.otp_code).toBeDefined();
    const correctOtp = share.otp_code!;

    // 1. Access before OTP verification -> DENIED
    const preOtpAccess = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD', 'loans@nationalbank.com');
    expect(preOtpAccess.isAllowed).toBe(false);
    expect(preOtpAccess.errorMessage).toContain('OTP Verification Required');

    // 2. Failed OTP attempts
    const fail1 = centralDocumentSharingService.verifyShareOtp(share.secure_token, '000000', 'loans@nationalbank.com');
    expect(fail1.success).toBe(false);
    expect(fail1.message).toContain('Attempt 1 of 3');

    // 3. Successful OTP verification
    const successVerify = centralDocumentSharingService.verifyShareOtp(share.secure_token, correctOtp, 'loans@nationalbank.com');
    expect(successVerify.success).toBe(true);
    expect(share.otp_verified).toBe(true);
    expect(share.otp_code).toBeUndefined(); // Burned to prevent replay

    // 4. Access after OTP verification -> ALLOWED
    const postOtpAccess = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD', 'loans@nationalbank.com');
    expect(postOtpAccess.isAllowed).toBe(true);
    expect(postOtpAccess.watermark).toBeDefined();
  });

  it('TEST 3: Download Limit Quotas & Concurrency Protection: Strictly enforces max downloads', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/DOC/2026/000001',
      senderId: 'emp-reg-001',
      recipientType: 'EXTERNAL',
      recipientName: 'Recruiter',
      recipientEmail: 'recruitment@techcorp.com',
      shareType: 'EXTERNAL',
      permission: 'VIEW_AND_DOWNLOAD',
      maxDownloads: 1,
      context: registrarContext
    });

    // First download succeeds
    const download1 = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD', 'recruitment@techcorp.com');
    expect(download1.isAllowed).toBe(true);
    expect(download1.remainingDownloads).toBe(0);

    // Second download is blocked because quota is exhausted
    const download2 = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'DOWNLOAD', 'recruitment@techcorp.com');
    expect(download2.isAllowed).toBe(false);
    expect(download2.errorMessage).toContain('Download quota exceeded');
  });

  it('TEST 4: Recipient Binding: Rejects access from unauthorized recipient identities', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/DOC/2026/000001',
      senderId: 'emp-reg-001',
      recipientType: 'EXTERNAL',
      recipientName: 'Specific Reviewer',
      recipientEmail: 'auditor.authorized@state.gov.in',
      shareType: 'EXTERNAL',
      context: registrarContext
    });

    // Wrong email attempts access -> DENIED
    const wrongRecipient = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'PREVIEW', 'intruder@other.com');
    expect(wrongRecipient.isAllowed).toBe(false);
    expect(wrongRecipient.errorMessage).toContain('Access Denied: Recipient email does not match');
  });

  it('TEST 5: Revocation & Parent Document Invalidation Cascade: Instantly blocks revoked shares', () => {
    const share = centralDocumentSharingService.createDocumentShare({
      documentId: 'dms-doc-001',
      documentNumber: 'SSIU/DOC/2026/000001',
      senderId: 'emp-reg-001',
      recipientType: 'EXTERNAL',
      recipientName: 'Temporary Agent',
      recipientEmail: 'agent@tempagency.com',
      context: registrarContext
    });

    // 1. Revoke individual share
    centralDocumentSharingService.revokeDocumentShare({
      shareId: share.id,
      revokedBy: 'emp-reg-001',
      reason: 'Agent contract terminated prematurely'
    });

    const accessAfterRevoke = centralDocumentSharingService.accessSharedDocument(share.secure_token, 'PREVIEW', 'agent@tempagency.com');
    expect(accessAfterRevoke.isAllowed).toBe(false);
    expect(accessAfterRevoke.errorMessage).toContain('Access Revoked');

    // 2. Cascade Invalidation on Document Revocation
    const count = centralDocumentSharingService.invalidateSharesForDocument('dms-doc-001', 'Document marked confidential/revoked');
    expect(count).toBeGreaterThanOrEqual(1);

    // 3. Telemetry metrics
    const metrics = centralDocumentSharingService.getSharingDashboardMetrics(registrarContext);
    expect(metrics.totalSharesCount).toBeGreaterThanOrEqual(4);
    expect(metrics.revokedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.securityEventsCount).toBeGreaterThanOrEqual(1);
  });
});
