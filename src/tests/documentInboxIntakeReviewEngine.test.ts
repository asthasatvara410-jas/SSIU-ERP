import { describe, it, expect } from 'vitest';
import { centralDocumentInboxService } from '../services/centralDocumentInboxService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.11: Central Document Inbox, Intake, OCR & Review Pipeline Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['INBOX_VIEW', 'INBOX_REVIEW', 'INBOX_APPROVE', 'DMS_MANAGE']
  };

  it('TEST 1: Multi-Source Intake & Malware Quarantine: Isolates malicious files from the document pipeline', () => {
    // 1. Clean File Upload
    const cleanDoc = centralDocumentInboxService.receiveIncomingDocument({
      source: 'PORTAL_UPLOAD',
      sourceReference: 'PORTAL_REQ_8932',
      uploadedBy: 'STU-2026-000001',
      fileName: '10th_Marksheet_Aarav.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 845000,
      contentHash: 'sha256_marksheet_10th_aarav_998',
      simulatedMalwareScanResult: 'CLEAN'
    });

    expect(cleanDoc.id).toBeDefined();
    expect(cleanDoc.inbox_number).toContain('SSIU/INBOX/2026/');
    expect(cleanDoc.scan_status).toBe('CLEAN');
    expect(cleanDoc.duplicate_status).toBe('NO_DUPLICATE');

    // 2. Malware Infected Upload
    const maliciousDoc = centralDocumentInboxService.receiveIncomingDocument({
      source: 'EMAIL',
      sourceReference: 'EML_ATT_991823',
      uploadedBy: 'EXT_APPLICANT',
      fileName: 'trojan_payload.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 245000,
      contentHash: 'sha256_malicious_script_e398',
      simulatedMalwareScanResult: 'MALWARE_DETECTED'
    });

    expect(maliciousDoc.scan_status).toBe('QUARANTINED');
    expect(maliciousDoc.validation_status).toBe('FAILED');
    expect(maliciousDoc.review_status).toBe('REJECTED');

    // Attempting OCR on quarantined item must throw
    expect(() => {
      centralDocumentInboxService.processClassificationAndOCR({
        inboxItemId: maliciousDoc.id,
        documentTypeCode: 'DOC_MARKSHEET_10TH',
        extractedText: 'Sample text',
        extractedMetadata: {},
        confidence: 0.9
      });
    }).toThrow(/Processing Blocked: Item .* is quarantined/);
  });

  it('TEST 2: SHA-256 Duplicate Detection: Flags repeated file submissions with reference to original item', () => {
    // Upload duplicate of cleanDoc from TEST 1
    const duplicateDoc = centralDocumentInboxService.receiveIncomingDocument({
      source: 'ADMIN_UPLOAD',
      sourceReference: 'ADM_SCAN_882',
      uploadedBy: 'emp-staff-001',
      fileName: '10th_Marksheet_Duplicate.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 845000,
      contentHash: 'sha256_marksheet_10th_aarav_998', // Identical hash
      simulatedMalwareScanResult: 'CLEAN'
    });

    expect(duplicateDoc.duplicate_status).toBe('CONFIRMED_DUPLICATE');
    expect(duplicateDoc.duplicate_of_inbox_id).toBeDefined();
  });

  it('TEST 3: OCR Metadata Extraction & Data Mismatch Detection: Flags discrepancies between extracted text and student master', () => {
    const item = centralDocumentInboxService.receiveIncomingDocument({
      source: 'ADMISSION_UPLOAD',
      sourceReference: 'APP-2026-000889',
      uploadedBy: 'STU-2026-000002',
      fileName: '12th_Marksheet_Diya.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 950000,
      contentHash: 'sha256_marksheet_12th_diya_001',
      simulatedMalwareScanResult: 'CLEAN'
    });

    // Process OCR
    centralDocumentInboxService.processClassificationAndOCR({
      inboxItemId: item.id,
      documentTypeCode: 'DOC_MARKSHEET_12TH',
      extractedText: 'Gujarat Secondary and Higher Secondary Education Board Name: Rohan Sharma Total Marks: 450/500',
      extractedMetadata: {
        document_number: 'GSEB-12-889234',
        name_on_document: 'Rohan Sharma', // Extracted wrong name
        passing_year: '2024'
      },
      confidence: 0.95
    });

    // Validate against expected student 'Diya Shah'
    const validated = centralDocumentInboxService.validateInboxItem({
      inboxItemId: item.id,
      expectedEntityName: 'Diya Shah'
    });

    expect(validated.validation_status).toBe('DATA_MISMATCH');
    expect(validated.validation_remarks).toContain('Data Mismatch');

    // Promotion must be blocked when data mismatch exists
    expect(() => {
      centralDocumentInboxService.finalizeToCentralDMS({
        inboxItemId: item.id,
        reviewerId: 'emp-reg-001',
        context: registrarContext
      });
    }).toThrow(/Promotion Blocked: Unresolved data mismatch/);
  });

  it('TEST 4: Entity Linking & Central DMS Promotion: Successfully promotes verified inbox document to Central DMS', () => {
    const item = centralDocumentInboxService.receiveIncomingDocument({
      source: 'PORTAL_UPLOAD',
      sourceReference: 'REQ-BON-001',
      uploadedBy: 'STU-2026-000003',
      fileName: 'Valid_Document_Aarav.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 720000,
      contentHash: 'sha256_valid_doc_aarav_001',
      simulatedMalwareScanResult: 'CLEAN'
    });

    centralDocumentInboxService.processClassificationAndOCR({
      inboxItemId: item.id,
      documentTypeCode: 'DOC_AADHAAR',
      extractedText: 'Aadhaar Card Name: Aarav Patel',
      extractedMetadata: {
        document_number: '9876 5432 1098',
        name_on_document: 'Aarav Patel'
      },
      confidence: 0.99
    });

    // Link entity to student
    const link = centralDocumentInboxService.linkEntity({
      inboxItemId: item.id,
      entityType: 'STUDENT',
      entityId: 'STU-2026-000003',
      relationshipType: 'PRIMARY_DOSSIER',
      isPrimary: true,
      linkedBy: 'emp-reg-001'
    });

    expect(link.id).toBeDefined();
    expect(link.is_primary).toBe(true);

    // Validate successfully
    centralDocumentInboxService.validateInboxItem({
      inboxItemId: item.id,
      expectedEntityName: 'Aarav Patel'
    });

    // Finalize to Central DMS
    const dmsDoc = centralDocumentInboxService.finalizeToCentralDMS({
      inboxItemId: item.id,
      reviewerId: 'emp-reg-001',
      title: 'Aadhaar Card - Aarav Patel Verified',
      context: registrarContext
    });

    expect(dmsDoc.id).toBeDefined();
    expect(dmsDoc.document_type_code).toBe('DOC_AADHAAR');
    expect(item.review_status).toBe('APPROVED');
    expect(item.finalized_document_id).toBe(dmsDoc.id);
  });

  it('TEST 5: Inbox Dashboard Metrics: Computes authoritative inbox distribution counters', () => {
    const metrics = centralDocumentInboxService.getInboxDashboardMetrics(registrarContext);

    expect(metrics.totalInboxCount).toBeGreaterThanOrEqual(4);
    expect(metrics.quarantinedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.duplicateCount).toBeGreaterThanOrEqual(1);
    expect(metrics.finalizedCount).toBeGreaterThanOrEqual(2);
  });
});
