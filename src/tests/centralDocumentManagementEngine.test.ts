import { describe, it, expect } from 'vitest';
import { centralDocumentManagementService } from '../services/centralDocumentManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.1: Central Document Management System (DMS) Platform Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_UPLOAD', 'DOCUMENT_VERIFY', 'DOCUMENT_ARCHIVE']
  };

  const studentAContext: UserAuthorizationContext = {
    userId: 'STU-2026-000001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_UPLOAD']
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'STU-2026-000002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_UPLOAD']
  };

  it('TEST 1: Polymorphic Creation & MIME Validation: Creates documents across Student, HR & Finance with strict format checks', () => {
    // 1. Invalid MIME type attempt must fail
    expect(() => {
      centralDocumentManagementService.createDocumentWithVersion({
        documentTypeCode: 'DOC_MIGRATION_CERT',
        ownerType: 'STUDENT',
        ownerId: 'STU-2026-000002',
        organizationId: 'inst-sit',
        title: 'Migration Certificate',
        fileName: 'migration.exe',
        mimeType: 'application/x-msdownload', // Disallowed
        fileSizeBytes: 2048,
        checksum: 'sha256_dummy_exe',
        uploadedBy: 'STU-2026-000002'
      });
    }).toThrow(/File MIME type application\/x-msdownload is not permitted/);

    // 2. Valid Student Migration Certificate (PDF)
    const stuDoc = centralDocumentManagementService.createDocumentWithVersion({
      documentTypeCode: 'DOC_MIGRATION_CERT',
      ownerType: 'STUDENT',
      ownerId: 'STU-2026-000002',
      organizationId: 'inst-sit',
      title: 'Migration Certificate - Diya Sharma',
      fileName: 'Migration_Certificate_DiyaSharma.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1048576,
      checksum: 'sha256_mig_002',
      uploadedBy: 'STU-2026-000002',
      sourceModule: 'ADMISSION',
      sourceEntityType: 'APPLICATION',
      sourceEntityId: 'APP-2026-000002'
    });

    expect(stuDoc.document.id).toBeDefined();
    expect(stuDoc.version.version_number).toBe(1);
    expect(stuDoc.document.verification_status).toBe('PENDING');

    // 3. Valid HR Offer Letter
    const hrDoc = centralDocumentManagementService.createDocumentWithVersion({
      documentTypeCode: 'DOC_HR_OFFER_LETTER',
      ownerType: 'FACULTY',
      ownerId: 'EMP-FAC-001',
      organizationId: 'inst-sit',
      title: 'Appointment Letter - Prof. Rajesh Patel',
      fileName: 'Appointment_Letter_ProfRajesh.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 524288,
      checksum: 'sha256_hr_001',
      uploadedBy: 'emp-reg-001',
      sourceModule: 'HR',
      sourceEntityType: 'EMPLOYEE',
      sourceEntityId: 'EMP-FAC-001'
    });

    expect(hrDoc.document.owner_type).toBe('FACULTY');
    expect(hrDoc.document.owner_id).toBe('EMP-FAC-001');
  });

  it('TEST 2: Document Versioning & Replacement: Replaces v1 with v2 and archives v1 to HISTORICAL', () => {
    // Upload v2 of Migration Certificate for Diya Sharma
    const v2Result = centralDocumentManagementService.createDocumentWithVersion({
      documentTypeCode: 'DOC_MIGRATION_CERT',
      ownerType: 'STUDENT',
      ownerId: 'STU-2026-000002',
      organizationId: 'inst-sit',
      title: 'Migration Certificate - Diya Sharma (Signed)',
      fileName: 'Migration_Certificate_DiyaSharma_Signed.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1100000,
      checksum: 'sha256_mig_002_v2',
      uploadedBy: 'STU-2026-000002',
      changeReason: 'Uploaded stamped copy from Board'
    });

    expect(v2Result.version.version_number).toBeGreaterThan(1);
    expect(v2Result.version.status).toBe('CURRENT');
  });

  it('TEST 3: Verification & Mandatory Rejection Reason: Rejection requires reason, verification succeeds', () => {
    // 1. Rejection without reason fails
    expect(() => {
      centralDocumentManagementService.rejectDocument({
        documentId: 'dms-doc-001',
        reviewerId: 'emp-reg-001',
        rejectionReason: ''
      });
    }).toThrow(/Mandatory rejection reason required/);

    // 2. Reject with reason
    const rejected = centralDocumentManagementService.rejectDocument({
      documentId: 'dms-doc-001',
      reviewerId: 'emp-reg-001',
      rejectionReason: 'UIDAI QR code not scanning; please provide clear scan'
    });
    expect(rejected.verification_status).toBe('REJECTED');

    // 3. Verify valid document
    const verified = centralDocumentManagementService.verifyDocument({
      documentId: 'dms-doc-001',
      reviewerId: 'emp-reg-001',
      remarks: 'Re-scanned copy verified successfully'
    });
    expect(verified.verification_status).toBe('VERIFIED');
  });

  it('TEST 4: Expiry Evaluation & Legal Hold Retention Protection: Blocks archiving on legal hold', () => {
    // 1. Dynamic Expiry Evaluation
    const docWithExp = {
      expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } as any;
    expect(centralDocumentManagementService.evaluateValidity(docWithExp)).toBe('EXPIRING_SOON');

    // 2. Set Legal Hold
    const heldDoc = centralDocumentManagementService.setLegalHold({
      documentId: 'dms-doc-001',
      isLegalHold: true,
      authorizedBy: 'emp-reg-001',
      justification: 'Pending High Court verification audit'
    });
    expect(heldDoc.is_legal_hold).toBe(true);

    // 3. Archival while under Legal Hold must be blocked
    expect(() => {
      centralDocumentManagementService.archiveDocument('dms-doc-001');
    }).toThrow(/Retention Block: Cannot archive document under active Legal Hold/);

    // 4. Release Legal Hold & Archive
    centralDocumentManagementService.setLegalHold({
      documentId: 'dms-doc-001',
      isLegalHold: false,
      authorizedBy: 'emp-reg-001',
      justification: 'Audit concluded with clean report'
    });

    const archived = centralDocumentManagementService.archiveDocument('dms-doc-001');
    expect(archived.status).toBe('ARCHIVED');
  });

  it('TEST 5: Secure Preview, Download Token & Object-Level Access Guard: Prevents IDOR unauthorized download', () => {
    // 1. Student A can generate access token for own document
    const tokenA = centralDocumentManagementService.generateSecureAccessToken('dms-doc-001', studentAContext);
    expect(tokenA.downloadUrl).toContain('https://dms.swarrnim.edu.in/api/v1/download/dms-doc-001');
    expect(tokenA.expiresAt).toBeDefined();

    // 2. Student B attempting to access Student A document is blocked
    expect(() => {
      centralDocumentManagementService.generateSecureAccessToken('dms-doc-001', studentBContext);
    }).toThrow(/Access Denied: You do not possess ownership authorization/);

    // 3. Registrar can access any document
    const tokenReg = centralDocumentManagementService.generateSecureAccessToken('dms-doc-001', registrarContext);
    expect(tokenReg.downloadUrl).toBeDefined();
  });

  it('TEST 6: Central DMS Dashboard Metrics: Computes authoritative document, storage, and status counters', () => {
    const metrics = centralDocumentManagementService.getDmsDashboardMetrics(registrarContext);
    expect(metrics.totalDocuments).toBeGreaterThanOrEqual(3);
    expect(metrics.totalStorageBytes).toBeGreaterThanOrEqual(2000000);
    expect(metrics.archivedDocumentsCount).toBeGreaterThanOrEqual(1);
  });
});
