import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type DocumentOwnerType =
  | 'STUDENT'
  | 'FACULTY'
  | 'STAFF'
  | 'VENDOR'
  | 'ORGANIZATION'
  | 'DEPARTMENT'
  | 'APPLICATION'
  | 'TRANSACTION'
  | 'OTHER_ENTITY';

export type DocumentCategoryCode =
  | 'IDENTITY'
  | 'ACADEMIC'
  | 'ADMISSION'
  | 'FINANCIAL'
  | 'EMPLOYMENT'
  | 'LEGAL'
  | 'MEDICAL'
  | 'RESEARCH'
  | 'PROCUREMENT'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type DocumentStatus =
  | 'DRAFT'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'ACTIVE'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'DELETED';

export type DocumentVerificationStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type DocumentValidityState = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';

export interface DocumentCategoryRecord {
  id: string;
  code: DocumentCategoryCode;
  name: string;
  description: string;
}

export interface DocumentTypeRecord {
  id: string;
  code: string; // e.g. DOC_AADHAAR, DOC_MARKSHEET_10TH, DOC_HR_OFFER, DOC_FIN_INVOICE
  name: string;
  category_code: DocumentCategoryCode;
  required: boolean;
  multiple_allowed: boolean;
  verification_required: boolean;
  expiry_supported: boolean;
  versioning_enabled: boolean;
  allowed_mime_types: string[];
  max_file_size_bytes: number;
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface FileObjectRecord {
  id: string;
  storage_provider: 'LOCAL' | 'OBJECT_STORAGE' | 'CLOUD';
  storage_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  checksum: string;
  created_at: string;
}

export interface DocumentVersionRecord {
  id: string;
  document_id: string;
  version_number: number;
  file_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  checksum: string;
  uploaded_by: string;
  uploaded_at: string;
  change_reason?: string;
  status: 'CURRENT' | 'HISTORICAL' | 'REJECTED';
}

export interface DocumentVerificationRecord {
  id: string;
  document_id: string;
  version_id: string;
  reviewer_id: string;
  status: 'VERIFIED' | 'REJECTED';
  remarks?: string;
  rejection_reason?: string;
  verified_at: string;
}

export interface DocumentRecord {
  id: string;
  document_type_code: string;
  owner_type: DocumentOwnerType;
  owner_id: string;
  organization_id: string;
  title: string;
  description?: string;
  status: DocumentStatus;
  verification_status: DocumentVerificationStatus;
  current_version_id?: string;
  issue_date?: string;
  expiry_date?: string;
  custom_metadata?: Record<string, any>;
  tags?: string[];
  is_legal_hold: boolean;
  source_module?: string;
  source_entity_type?: string;
  source_entity_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CentralDmsDashboardMetrics {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingVerificationCount: number;
  rejectedDocumentsCount: number;
  expiringSoonCount: number;
  expiredDocumentsCount: number;
  archivedDocumentsCount: number;
  totalStorageBytes: number;
  legalHoldCount: number;
}

class CentralDocumentManagementService {
  private static instance: CentralDocumentManagementService;

  private categories: DocumentCategoryRecord[] = [
    { id: 'cat-01', code: 'IDENTITY', name: 'Identity & Citizenship', description: 'Government identity cards & citizenship proofs' },
    { id: 'cat-02', code: 'ACADEMIC', name: 'Academic Records', description: 'Transcripts, marksheets, and degree certificates' },
    { id: 'cat-03', code: 'ADMISSION', name: 'Admission & Transfer', description: 'Admission forms, migration & school leaving certificates' },
    { id: 'cat-04', code: 'FINANCIAL', name: 'Financial & Fees', description: 'Fee receipts, invoices, bank challans, and income certificates' },
    { id: 'cat-05', code: 'EMPLOYMENT', name: 'Employment & HR', description: 'Offer letters, service agreements, and experience letters' },
    { id: 'cat-06', code: 'LEGAL', name: 'Legal & Affidavits', description: 'Anti-ragging affidavits, undertaking deeds, and contracts' },
    { id: 'cat-07', code: 'PROCUREMENT', name: 'Procurement & Assets', description: 'Vendor agreements, purchase orders, and asset warranties' }
  ];

  private documentTypes: DocumentTypeRecord[] = [
    {
      id: 'dtype-01',
      code: 'DOC_AADHAAR',
      name: 'Government Aadhaar Card',
      category_code: 'IDENTITY',
      required: true,
      multiple_allowed: false,
      verification_required: true,
      expiry_supported: false,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'],
      max_file_size_bytes: 5 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-02',
      code: 'DOC_MARKSHEET_10TH',
      name: 'Secondary School (10th) Marksheet',
      category_code: 'ACADEMIC',
      required: true,
      multiple_allowed: false,
      verification_required: true,
      expiry_supported: false,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'],
      max_file_size_bytes: 5 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-03',
      code: 'DOC_MARKSHEET_12TH',
      name: 'Higher Secondary (12th) Marksheet',
      category_code: 'ACADEMIC',
      required: true,
      multiple_allowed: false,
      verification_required: true,
      expiry_supported: false,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'],
      max_file_size_bytes: 5 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-04',
      code: 'DOC_MIGRATION_CERT',
      name: 'University / Board Migration Certificate',
      category_code: 'ADMISSION',
      required: true,
      multiple_allowed: false,
      verification_required: true,
      expiry_supported: false,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf'],
      max_file_size_bytes: 10 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-05',
      code: 'DOC_HR_OFFER_LETTER',
      name: 'Faculty Appointment & Offer Letter',
      category_code: 'EMPLOYMENT',
      required: true,
      multiple_allowed: false,
      verification_required: true,
      expiry_supported: false,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf'],
      max_file_size_bytes: 10 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-06',
      code: 'DOC_FIN_INVOICE',
      name: 'Finance Fee Assessment Invoice',
      category_code: 'FINANCIAL',
      required: false,
      multiple_allowed: true,
      verification_required: false,
      expiry_supported: true,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf'],
      max_file_size_bytes: 5 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-07',
      code: 'DOC_BONAFIDE_CERT',
      name: 'Student Bonafide Certificate',
      category_code: 'ACADEMIC',
      required: false,
      multiple_allowed: true,
      verification_required: false,
      expiry_supported: true,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf'],
      max_file_size_bytes: 5 * 1024 * 1024,
      status: 'ACTIVE'
    },
    {
      id: 'dtype-08',
      code: 'DOC_NOC_CERT',
      name: 'No Objection Certificate (NOC)',
      category_code: 'ACADEMIC',
      required: false,
      multiple_allowed: true,
      verification_required: false,
      expiry_supported: true,
      versioning_enabled: true,
      allowed_mime_types: ['application/pdf'],
      max_file_size_bytes: 5 * 1024 * 1024,
      status: 'ACTIVE'
    }
  ];

  private files: FileObjectRecord[] = [];
  private versions: DocumentVersionRecord[] = [];
  private documents: DocumentRecord[] = [];
  private verifications: DocumentVerificationRecord[] = [];

  private constructor() {
    this.seedDemoDocuments();
  }

  public static getInstance(): CentralDocumentManagementService {
    if (!CentralDocumentManagementService.instance) {
      CentralDocumentManagementService.instance = new CentralDocumentManagementService();
    }
    return CentralDocumentManagementService.instance;
  }

  private seedDemoDocuments(): void {
    // Demo Document: Aarav Patel Aadhaar Card
    const fileId = 'file-001';
    this.files.push({
      id: fileId,
      storage_provider: 'CLOUD',
      storage_key: 'dms/students/STU-2026-000001/aadhaar_v1.pdf',
      file_name: 'Aadhaar_Card_AaravPatel.pdf',
      mime_type: 'application/pdf',
      size_bytes: 1245000,
      checksum: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created_at: '2026-04-10T10:00:00Z'
    });

    const versionId = 'ver-001';
    const docId = 'dms-doc-001';

    this.versions.push({
      id: versionId,
      document_id: docId,
      version_number: 1,
      file_id: fileId,
      file_name: 'Aadhaar_Card_AaravPatel.pdf',
      file_size_bytes: 1245000,
      mime_type: 'application/pdf',
      checksum: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      uploaded_by: 'STU-2026-000001',
      uploaded_at: '2026-04-10T10:00:00Z',
      status: 'CURRENT'
    });

    this.documents.push({
      id: docId,
      document_type_code: 'DOC_AADHAAR',
      owner_type: 'STUDENT',
      owner_id: 'STU-2026-000001',
      organization_id: 'inst-sit',
      title: 'Aadhaar Card - Aarav Patel',
      status: 'ACTIVE',
      verification_status: 'VERIFIED',
      current_version_id: versionId,
      is_legal_hold: false,
      source_module: 'ADMISSION',
      source_entity_type: 'APPLICATION',
      source_entity_id: 'APP-2026-000001',
      created_by: 'STU-2026-000001',
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-12T11:00:00Z'
    });
  }

  // ─── MASTER DOCUMENT CREATION & VERSION UPLOAD ENGINE ────────────────

  public createDocumentWithVersion(params: {
    documentTypeCode: string;
    ownerType: DocumentOwnerType;
    ownerId: string;
    organizationId: string;
    title: string;
    description?: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    checksum: string;
    uploadedBy: string;
    changeReason?: string;
    issueDate?: string;
    expiryDate?: string;
    customMetadata?: Record<string, any>;
    tags?: string[];
    sourceModule?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
  }): { document: DocumentRecord; version: DocumentVersionRecord; file: FileObjectRecord } {
    // 1. Validate Document Type
    const dType = this.documentTypes.find(t => t.code === params.documentTypeCode);
    if (!dType) throw new Error(`Document type code ${params.documentTypeCode} is not recognized or active`);

    if (dType.allowed_mime_types.length > 0 && !dType.allowed_mime_types.includes(params.mimeType)) {
      throw new Error(`File MIME type ${params.mimeType} is not permitted for document type ${params.documentTypeCode}`);
    }

    if (params.fileSizeBytes > dType.max_file_size_bytes) {
      throw new Error(`File size ${params.fileSizeBytes} bytes exceeds maximum permitted limit of ${dType.max_file_size_bytes} bytes`);
    }

    // 2. Physical File Object Registration
    const fileId = `file-${Date.now()}`;
    const fileRecord: FileObjectRecord = {
      id: fileId,
      storage_provider: 'CLOUD',
      storage_key: `dms/${params.ownerType.toLowerCase()}s/${params.ownerId}/${params.fileName}`,
      file_name: params.fileName,
      mime_type: params.mimeType,
      size_bytes: params.fileSizeBytes,
      checksum: params.checksum,
      created_at: new Date().toISOString()
    };
    this.files.push(fileRecord);

    // 3. Document Master Registration or Existing Version Append
    let docRecord = this.documents.find(
      d => d.owner_id === params.ownerId && d.document_type_code === params.documentTypeCode && d.status !== 'DELETED'
    );

    let versionNumber = 1;
    let docId = docRecord?.id || `dms-doc-${Date.now()}`;

    if (docRecord) {
      // Mark previous versions as HISTORICAL
      const existingVersions = this.versions.filter(v => v.document_id === docRecord!.id);
      existingVersions.forEach(v => {
        if (v.status === 'CURRENT') v.status = 'HISTORICAL';
      });
      versionNumber = existingVersions.length + 1;
    }

    const versionId = `ver-${Date.now()}`;
    const versionRecord: DocumentVersionRecord = {
      id: versionId,
      document_id: docId,
      version_number: versionNumber,
      file_id: fileId,
      file_name: params.fileName,
      file_size_bytes: params.fileSizeBytes,
      mime_type: params.mimeType,
      checksum: params.checksum,
      uploaded_by: params.uploadedBy,
      uploaded_at: new Date().toISOString(),
      change_reason: params.changeReason,
      status: 'CURRENT'
    };
    this.versions.push(versionRecord);

    if (!docRecord) {
      docRecord = {
        id: docId,
        document_type_code: params.documentTypeCode,
        owner_type: params.ownerType,
        owner_id: params.ownerId,
        organization_id: params.organizationId,
        title: params.title,
        description: params.description,
        status: 'UPLOADED',
        verification_status: dType.verification_required ? 'PENDING' : 'NOT_REQUIRED',
        current_version_id: versionId,
        issue_date: params.issueDate,
        expiry_date: params.expiryDate,
        custom_metadata: params.customMetadata,
        tags: params.tags,
        is_legal_hold: false,
        source_module: params.sourceModule,
        source_entity_type: params.sourceEntityType,
        source_entity_id: params.sourceEntityId,
        created_by: params.uploadedBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.documents.push(docRecord);
    } else {
      docRecord.current_version_id = versionId;
      docRecord.verification_status = dType.verification_required ? 'PENDING' : 'NOT_REQUIRED';
      docRecord.status = 'UPLOADED';
      docRecord.updated_at = new Date().toISOString();
    }

    return { document: docRecord, version: versionRecord, file: fileRecord };
  }

  public getDocumentById(documentId: string, context?: UserAuthorizationContext): DocumentRecord | undefined {
    const doc = this.documents.find(d => d.id === documentId && d.status !== 'DELETED');
    if (!doc) return undefined;

    if (context) {
      const isStudent = context.activeRole === 'STUDENT';
      if (isStudent && doc.owner_id !== context.userId) return undefined;
    }

    return doc;
  }

  // ─── DOCUMENT VERIFICATION ENGINE ─────────────────────────────────────

  public verifyDocument(params: {
    documentId: string;
    reviewerId: string;
    remarks?: string;
  }): DocumentRecord {
    const doc = this.documents.find(d => d.id === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    doc.verification_status = 'VERIFIED';
    doc.status = 'VERIFIED';
    doc.updated_at = new Date().toISOString();

    this.verifications.push({
      id: `verif-${Date.now()}`,
      document_id: doc.id,
      version_id: doc.current_version_id || 'ver-001',
      reviewer_id: params.reviewerId,
      status: 'VERIFIED',
      remarks: params.remarks,
      verified_at: new Date().toISOString()
    });

    return doc;
  }

  public rejectDocument(params: {
    documentId: string;
    reviewerId: string;
    rejectionReason: string;
    remarks?: string;
  }): DocumentRecord {
    if (!params.rejectionReason || params.rejectionReason.trim().length === 0) {
      throw new Error('Mandatory rejection reason required to reject document');
    }

    const doc = this.documents.find(d => d.id === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    doc.verification_status = 'REJECTED';
    doc.status = 'REJECTED';
    doc.updated_at = new Date().toISOString();

    this.verifications.push({
      id: `verif-${Date.now()}`,
      document_id: doc.id,
      version_id: doc.current_version_id || 'ver-001',
      reviewer_id: params.reviewerId,
      status: 'REJECTED',
      rejection_reason: params.rejectionReason,
      remarks: params.remarks,
      verified_at: new Date().toISOString()
    });

    return doc;
  }

  // ─── DYNAMIC EXPIRY & LEGAL HOLD GOVERNANCE ──────────────────────────

  public evaluateValidity(document: DocumentRecord): DocumentValidityState {
    if (!document.expiry_date) return 'NO_EXPIRY';

    const now = new Date().getTime();
    const expiryTime = new Date(document.expiry_date).getTime();
    const diffDays = (expiryTime - now) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING_SOON';
    return 'VALID';
  }

  public setLegalHold(params: {
    documentId: string;
    isLegalHold: boolean;
    authorizedBy: string;
    justification: string;
  }): DocumentRecord {
    if (!params.justification) throw new Error('Mandatory justification required to alter legal hold status');

    const doc = this.documents.find(d => d.id === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    doc.is_legal_hold = params.isLegalHold;
    doc.updated_at = new Date().toISOString();
    return doc;
  }

  public archiveDocument(documentId: string): DocumentRecord {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.is_legal_hold) {
      throw new Error('Retention Block: Cannot archive document under active Legal Hold');
    }

    doc.status = 'ARCHIVED';
    doc.updated_at = new Date().toISOString();
    return doc;
  }

  // ─── SECURE PREVIEW & DOWNLOAD ACCESS CONTROL ────────────────────────

  public generateSecureAccessToken(
    documentId: string,
    context: UserAuthorizationContext
  ): { downloadUrl: string; previewUrl: string; expiresAt: string } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    // Student ownership guard
    if (String(context.activeRole) === 'STUDENT' && doc.owner_id !== context.userId) {
      throw new Error('Access Denied: You do not possess ownership authorization for this document');
    }

    const token = `dms_sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    return {
      downloadUrl: `https://dms.swarrnim.edu.in/api/v1/download/${doc.id}?token=${token}`,
      previewUrl: `https://dms.swarrnim.edu.in/api/v1/preview/${doc.id}?token=${token}`,
      expiresAt
    };
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getDmsDashboardMetrics(context?: UserAuthorizationContext): CentralDmsDashboardMetrics {
    const totalDocuments = this.documents.filter(d => d.status !== 'DELETED').length;
    const verifiedDocuments = this.documents.filter(d => d.verification_status === 'VERIFIED').length;
    const pendingVerificationCount = this.documents.filter(d => d.verification_status === 'PENDING').length;
    const rejectedDocumentsCount = this.documents.filter(d => d.verification_status === 'REJECTED').length;

    let expiringSoonCount = 0;
    let expiredDocumentsCount = 0;

    this.documents.forEach(d => {
      const v = this.evaluateValidity(d);
      if (v === 'EXPIRING_SOON') expiringSoonCount++;
      if (v === 'EXPIRED') expiredDocumentsCount++;
    });

    const archivedDocumentsCount = this.documents.filter(d => d.status === 'ARCHIVED').length;
    const legalHoldCount = this.documents.filter(d => d.is_legal_hold).length;
    const totalStorageBytes = this.files.reduce((sum, f) => sum + f.size_bytes, 0);

    return {
      totalDocuments,
      verifiedDocuments,
      pendingVerificationCount,
      rejectedDocumentsCount,
      expiringSoonCount,
      expiredDocumentsCount,
      archivedDocumentsCount,
      totalStorageBytes,
      legalHoldCount
    };
  }
}

export const centralDocumentManagementService = CentralDocumentManagementService.getInstance();
