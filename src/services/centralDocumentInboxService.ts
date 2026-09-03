import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';
import { centralDocumentSearchService } from './centralDocumentSearchService';

export type IntakeSource = 
  | 'PORTAL_UPLOAD'
  | 'ADMIN_UPLOAD'
  | 'EMAIL'
  | 'ADMISSION_UPLOAD'
  | 'HR_UPLOAD'
  | 'FINANCE_UPLOAD'
  | 'VENDOR_UPLOAD'
  | 'SCANNER'
  | 'API'
  | 'IMPORT';

export type ScanStatus = 'PENDING' | 'SCANNING' | 'CLEAN' | 'QUARANTINED';
export type DuplicateStatus = 'NO_DUPLICATE' | 'POSSIBLE_DUPLICATE' | 'CONFIRMED_DUPLICATE';
export type ClassificationStatus = 'PENDING' | 'AUTO_CLASSIFIED' | 'MANUAL_REVIEW' | 'CONFIRMED';
export type OCRStatus = 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'LOW_CONFIDENCE';
export type ValidationStatus = 'PENDING' | 'PASSED' | 'WARNING' | 'DATA_MISMATCH' | 'FAILED';
export type ReviewStatus = 'PENDING' | 'ASSIGNED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RETURNED';

export interface DocumentEntityLinkRecord {
  id: string;
  inbox_item_id: string;
  entity_type: 'STUDENT' | 'APPLICANT' | 'EMPLOYEE' | 'VENDOR' | 'FINANCE_RECORD';
  entity_id: string;
  relationship_type: 'PRIMARY_DOSSIER' | 'SUPPORTING_ATTACHMENT' | 'CHECKLIST_ITEM';
  is_primary: boolean;
  linked_at: string;
  linked_by: string;
}

export interface DocumentInboxItemRecord {
  id: string;
  inbox_number: string;
  source: IntakeSource;
  source_reference: string;
  uploaded_by: string;
  organization_id: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  content_hash: string;
  scan_status: ScanStatus;
  duplicate_status: DuplicateStatus;
  duplicate_of_inbox_id?: string;
  document_type_code: string;
  classification_status: ClassificationStatus;
  ocr_status: OCRStatus;
  ocr_text?: string;
  ocr_confidence: number;
  extracted_metadata: Record<string, any>;
  validation_status: ValidationStatus;
  validation_remarks?: string;
  review_status: ReviewStatus;
  assigned_reviewer_id?: string;
  rejection_reason?: string;
  finalized_document_id?: string;
  created_at: string;
  finalized_at?: string;
}

export interface DocumentInboxDashboardMetrics {
  totalInboxCount: number;
  pendingScanCount: number;
  pendingClassificationCount: number;
  inReviewCount: number;
  quarantinedCount: number;
  finalizedCount: number;
  duplicateCount: number;
}

class CentralDocumentInboxService {
  private static instance: CentralDocumentInboxService;

  private inboxItems: DocumentInboxItemRecord[] = [];
  private entityLinks: DocumentEntityLinkRecord[] = [];
  private sequenceCounter = 100;

  private constructor() {
    this.seedDemoInbox();
  }

  public static getInstance(): CentralDocumentInboxService {
    if (!CentralDocumentInboxService.instance) {
      CentralDocumentInboxService.instance = new CentralDocumentInboxService();
    }
    return CentralDocumentInboxService.instance;
  }

  private seedDemoInbox(): void {
    // Seed an initial demo item for student Aarav Patel
    this.inboxItems.push({
      id: 'inbox-item-001',
      inbox_number: 'SSIU/INBOX/2026/000100',
      source: 'ADMISSION_UPLOAD',
      source_reference: 'APP-2026-000001',
      uploaded_by: 'STU-2026-000001',
      organization_id: 'inst-sit',
      file_name: 'Aadhaar_Card_Aarav.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 1245000,
      content_hash: 'sha256_aadhaar_aarav_patel_001',
      scan_status: 'CLEAN',
      duplicate_status: 'NO_DUPLICATE',
      document_type_code: 'DOC_AADHAAR',
      classification_status: 'CONFIRMED',
      ocr_status: 'COMPLETED',
      ocr_text: 'Government of India Unique Identification Authority of India Name: Aarav Patel DOB: 15/08/2004 Gender: Male Aadhaar No: 1234 5678 9012',
      ocr_confidence: 0.98,
      extracted_metadata: {
        document_number: '1234 5678 9012',
        name_on_document: 'Aarav Patel',
        dob: '2004-08-15',
        issuer: 'UIDAI'
      },
      validation_status: 'PASSED',
      review_status: 'APPROVED',
      finalized_document_id: 'dms-doc-001',
      created_at: '2026-04-10T10:00:00Z',
      finalized_at: '2026-04-10T10:15:00Z'
    });
  }

  // ─── INTAKE & SECURITY SCANNING ENGINE ────────────────────────────────

  public receiveIncomingDocument(params: {
    source: IntakeSource;
    sourceReference: string;
    uploadedBy: string;
    organizationId?: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    contentHash: string;
    simulatedMalwareScanResult?: 'CLEAN' | 'MALWARE_DETECTED';
  }): DocumentInboxItemRecord {
    this.sequenceCounter += 1;
    const inboxNumber = `SSIU/INBOX/2026/${String(this.sequenceCounter).padStart(6, '0')}`;
    const id = `inbox-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const isMalware = params.simulatedMalwareScanResult === 'MALWARE_DETECTED';
    const scanStatus: ScanStatus = isMalware ? 'QUARANTINED' : 'CLEAN';

    // Duplicate Check
    const existingDuplicate = this.inboxItems.find(i => i.content_hash === params.contentHash && i.scan_status !== 'QUARANTINED');
    const duplicateStatus: DuplicateStatus = existingDuplicate ? 'CONFIRMED_DUPLICATE' : 'NO_DUPLICATE';

    const item: DocumentInboxItemRecord = {
      id,
      inbox_number: inboxNumber,
      source: params.source,
      source_reference: params.sourceReference,
      uploaded_by: params.uploadedBy,
      organization_id: params.organizationId || 'inst-sit',
      file_name: params.fileName,
      mime_type: params.mimeType,
      file_size_bytes: params.fileSizeBytes,
      content_hash: params.contentHash,
      scan_status: scanStatus,
      duplicate_status: duplicateStatus,
      duplicate_of_inbox_id: existingDuplicate?.id,
      document_type_code: 'UNCLASSIFIED',
      classification_status: isMalware ? 'MANUAL_REVIEW' : 'PENDING',
      ocr_status: isMalware ? 'NOT_REQUIRED' : 'PENDING',
      ocr_confidence: 0,
      extracted_metadata: {},
      validation_status: isMalware ? 'FAILED' : 'PENDING',
      validation_remarks: isMalware ? 'File quarantined by security scanner' : undefined,
      review_status: isMalware ? 'REJECTED' : 'PENDING',
      rejection_reason: isMalware ? 'Security scan failed: file flagged as malicious or quarantined' : undefined,
      created_at: new Date().toISOString()
    };

    this.inboxItems.push(item);
    return item;
  }

  // ─── CLASSIFICATION & OCR EXTRACTION ENGINE ───────────────────────────

  public processClassificationAndOCR(params: {
    inboxItemId: string;
    documentTypeCode: string;
    extractedText: string;
    extractedMetadata: Record<string, any>;
    confidence: number;
  }): DocumentInboxItemRecord {
    const item = this.inboxItems.find(i => i.id === params.inboxItemId);
    if (!item) throw new Error(`Inbox item ${params.inboxItemId} not found`);

    if (item.scan_status === 'QUARANTINED') {
      throw new Error(`Processing Blocked: Item ${item.inbox_number} is quarantined due to security violation`);
    }

    item.document_type_code = params.documentTypeCode;
    item.classification_status = 'CONFIRMED';
    item.ocr_status = params.confidence >= 0.70 ? 'COMPLETED' : 'LOW_CONFIDENCE';
    item.ocr_text = params.extractedText;
    item.ocr_confidence = params.confidence;
    item.extracted_metadata = params.extractedMetadata;
    item.review_status = 'IN_REVIEW';

    return item;
  }

  // ─── ENTITY LINKING ENGINE ───────────────────────────────────────────

  public linkEntity(params: {
    inboxItemId: string;
    entityType: 'STUDENT' | 'APPLICANT' | 'EMPLOYEE' | 'VENDOR' | 'FINANCE_RECORD';
    entityId: string;
    relationshipType: 'PRIMARY_DOSSIER' | 'SUPPORTING_ATTACHMENT' | 'CHECKLIST_ITEM';
    isPrimary?: boolean;
    linkedBy: string;
  }): DocumentEntityLinkRecord {
    const item = this.inboxItems.find(i => i.id === params.inboxItemId);
    if (!item) throw new Error(`Inbox item ${params.inboxItemId} not found`);

    const linkId = `link-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const link: DocumentEntityLinkRecord = {
      id: linkId,
      inbox_item_id: item.id,
      entity_type: params.entityType,
      entity_id: params.entityId,
      relationship_type: params.relationshipType,
      is_primary: params.isPrimary ?? true,
      linked_at: new Date().toISOString(),
      linked_by: params.linkedBy
    };

    this.entityLinks.push(link);
    return link;
  }

  // ─── VALIDATION & DATA MISMATCH CHECK ────────────────────────────────

  public validateInboxItem(params: {
    inboxItemId: string;
    expectedEntityName?: string;
  }): DocumentInboxItemRecord {
    const item = this.inboxItems.find(i => i.id === params.inboxItemId);
    if (!item) throw new Error(`Inbox item ${params.inboxItemId} not found`);

    if (params.expectedEntityName && item.extracted_metadata?.name_on_document) {
      const extractedName = String(item.extracted_metadata.name_on_document).trim().toLowerCase();
      const expectedName = params.expectedEntityName.trim().toLowerCase();

      if (extractedName !== expectedName) {
        item.validation_status = 'DATA_MISMATCH';
        item.validation_remarks = `Data Mismatch: Name on document '${item.extracted_metadata.name_on_document}' does not match entity '${params.expectedEntityName}'`;
        return item;
      }
    }

    item.validation_status = 'PASSED';
    item.validation_remarks = 'All automated validation checks passed successfully';
    return item;
  }

  // ─── REVIEW QUEUE & CENTRAL DMS PROMOTION ─────────────────────────────

  public finalizeToCentralDMS(params: {
    inboxItemId: string;
    reviewerId: string;
    title?: string;
    context?: UserAuthorizationContext;
  }): DocumentRecord {
    const item = this.inboxItems.find(i => i.id === params.inboxItemId);
    if (!item) throw new Error(`Inbox item ${params.inboxItemId} not found`);

    if (item.scan_status === 'QUARANTINED') {
      throw new Error(`Promotion Blocked: Cannot finalize quarantined document to Central DMS`);
    }

    if (item.validation_status === 'DATA_MISMATCH') {
      throw new Error(`Promotion Blocked: Unresolved data mismatch present on item ${item.inbox_number}`);
    }

    const primaryLink = this.entityLinks.find(l => l.inbox_item_id === item.id && l.is_primary);

    // Register into Central DMS via createDocumentWithVersion
    const result = centralDocumentManagementService.createDocumentWithVersion({
      documentTypeCode: item.document_type_code,
      ownerType: (primaryLink?.entity_type || 'STUDENT') as any,
      ownerId: primaryLink?.entity_id || item.uploaded_by,
      organizationId: item.organization_id,
      title: params.title || `${item.document_type_code} - ${item.file_name}`,
      fileName: item.file_name,
      fileSizeBytes: item.file_size_bytes,
      mimeType: item.mime_type,
      checksum: item.content_hash,
      uploadedBy: params.reviewerId,
      sourceModule: 'DOCUMENT_INBOX',
      sourceEntityType: 'INBOX_ITEM',
      sourceEntityId: item.id
    });

    item.review_status = 'APPROVED';
    item.finalized_document_id = result.document.id;
    item.finalized_at = new Date().toISOString();

    return result.document;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getInboxDashboardMetrics(context?: UserAuthorizationContext): DocumentInboxDashboardMetrics {
    const totalInboxCount = this.inboxItems.length;
    const pendingScanCount = this.inboxItems.filter(i => i.scan_status === 'PENDING').length;
    const pendingClassificationCount = this.inboxItems.filter(i => i.classification_status === 'PENDING').length;
    const inReviewCount = this.inboxItems.filter(i => i.review_status === 'IN_REVIEW' || i.review_status === 'PENDING').length;
    const quarantinedCount = this.inboxItems.filter(i => i.scan_status === 'QUARANTINED').length;
    const finalizedCount = this.inboxItems.filter(i => i.review_status === 'APPROVED' && i.finalized_document_id).length;
    const duplicateCount = this.inboxItems.filter(i => i.duplicate_status === 'CONFIRMED_DUPLICATE').length;

    return {
      totalInboxCount,
      pendingScanCount,
      pendingClassificationCount,
      inReviewCount,
      quarantinedCount,
      finalizedCount,
      duplicateCount
    };
  }
}

export const centralDocumentInboxService = CentralDocumentInboxService.getInstance();
