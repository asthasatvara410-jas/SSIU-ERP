import { describe, it, expect } from 'vitest';
import { centralDocumentSignatureService } from '../services/centralDocumentSignatureService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.7: Central Document Digital & E-Signature Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['SIGNATURE_REQUEST', 'SIGNATURE_VALIDATE', 'SIGNATURE_REVOKE']
  };

  it('TEST 1: Signer Authorization: Rejects signature requests when signer lacks authority for document type', async () => {
    await expect(
      centralDocumentSignatureService.createAndExecuteSignatureRequest({
        documentId: 'doc-bon-001',
        documentNumber: 'SSIU/BON/2026/000101',
        documentTypeCode: 'DOC_BONAFIDE_CERT',
        versionNumber: 1,
        providerType: 'DIGITAL_SIGNATURE',
        signerId: 'stu-001',
        signerName: 'Student User',
        signerRole: 'STUDENT',
        contentPayload: '<p>Sample Bonafide Certificate</p>',
        context: registrarContext
      })
    ).rejects.toThrow(/Unauthorized Signer: Role 'STUDENT' is not authorized/);
  });

  it('TEST 2: Digital Signature Execution: Issues HSM PKCS#7 signature and TSA timestamp for authorized Registrar', async () => {
    const sigReq = await centralDocumentSignatureService.createAndExecuteSignatureRequest({
      documentId: 'doc-bon-001',
      documentNumber: 'SSIU/BON/2026/000101',
      documentTypeCode: 'DOC_BONAFIDE_CERT',
      versionNumber: 1,
      providerType: 'DIGITAL_SIGNATURE',
      signerId: 'emp-reg-001',
      signerName: 'Dr. Registrar',
      signerRole: 'REGISTRAR',
      contentPayload: '<div class="certificate">Official Bonafide Content</div>',
      context: registrarContext
    });

    expect(sigReq.id).toBeDefined();
    expect(sigReq.status).toBe('SIGNED');
    expect(sigReq.certificate_serial_no).toContain('SSIU-PKI-CERT-');
    expect(sigReq.signature_evidence?.auth_mode).toBe('INSTITUTIONAL_HARDWARE_HSM');
    expect(sigReq.signature_evidence?.timestamp_token).toBeDefined();
  });

  it('TEST 3: Cryptographic Signature Validation: Validates authentic signature against Root Trust Anchor', async () => {
    const payload = '<div class="certificate">Official Bonafide Content</div>';
    const sigReq = await centralDocumentSignatureService.createAndExecuteSignatureRequest({
      documentId: 'doc-bon-002',
      documentNumber: 'SSIU/BON/2026/000102',
      documentTypeCode: 'DOC_BONAFIDE_CERT',
      versionNumber: 1,
      providerType: 'DIGITAL_SIGNATURE',
      signerId: 'emp-reg-001',
      signerName: 'Dr. Registrar',
      signerRole: 'REGISTRAR',
      contentPayload: payload,
      context: registrarContext
    });

    const validation = centralDocumentSignatureService.validateDocumentSignature(sigReq.id, payload);

    expect(validation.status).toBe('VALID');
    expect(validation.contentHashMatches).toBe(true);
    expect(validation.signerAuthorized).toBe(true);
    expect(validation.certificateValid).toBe(true);
    expect(validation.details).toContain('Root Trust Anchor');
  });

  it('TEST 4: Signature Revocation Governance: Revokes signature with mandatory reason and updates validation', async () => {
    const sigReq = await centralDocumentSignatureService.createAndExecuteSignatureRequest({
      documentId: 'doc-bon-003',
      documentNumber: 'SSIU/BON/2026/000103',
      documentTypeCode: 'DOC_BONAFIDE_CERT',
      versionNumber: 1,
      providerType: 'DIGITAL_SIGNATURE',
      signerId: 'emp-reg-001',
      signerName: 'Dr. Registrar',
      signerRole: 'REGISTRAR',
      contentPayload: 'Revokable Document Content',
      context: registrarContext
    });

    const revoked = centralDocumentSignatureService.revokeSignature({
      requestId: sigReq.id,
      revokedBy: 'emp-reg-001',
      reason: 'Administrative correction required'
    });

    expect(revoked.is_revoked).toBe(true);
    expect(revoked.status).toBe('REVOKED');

    const validation = centralDocumentSignatureService.validateDocumentSignature(sigReq.id, 'Revokable Document Content');
    expect(validation.status).toBe('REVOKED');
    expect(validation.details).toContain('Administrative correction required');
  });

  it('TEST 5: Signature Dashboard Metrics: Computes authoritative signature lifecycle counters', () => {
    const metrics = centralDocumentSignatureService.getSignatureDashboardMetrics(registrarContext);

    expect(metrics.totalRequestsCount).toBeGreaterThanOrEqual(3);
    expect(metrics.signedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.revokedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activeIssuersCount).toBeGreaterThanOrEqual(2);
  });
});
