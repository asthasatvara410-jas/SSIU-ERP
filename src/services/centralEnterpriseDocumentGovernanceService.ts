import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDocumentDispositionService } from './centralDocumentDispositionService';

export type EnterpriseDocumentType = 
  | 'POLICY'
  | 'PROCEDURE'
  | 'FORM'
  | 'CERTIFICATE'
  | 'AGREEMENT'
  | 'CONTRACT'
  | 'REPORT'
  | 'ACADEMIC_RECORD'
  | 'STUDENT_DOCUMENT'
  | 'FACULTY_DOCUMENT'
  | 'HR_DOCUMENT'
  | 'FINANCIAL_DOCUMENT'
  | 'LEGAL_DOCUMENT'
  | 'OTHER';

export type DocumentLifecycleStatus = 
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'EFFECTIVE'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'ARCHIVED'
  | 'DISPOSED';

export type VersionLifecycleStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'EFFECTIVE' | 'SUPERSEDED';
export type SignatureStatus = 'REQUESTED' | 'SENT' | 'SIGNED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface EnterpriseDocumentRecord {
  id: string;
  document_number: string;
  title: string;
  description: string;
  document_type: EnterpriseDocumentType;
  category: string;
  owner_id: string;
  organization_id: string;
  department_id: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  privacy_tag: 'PERSONAL_DATA' | 'SENSITIVE_PERSONAL_DATA' | 'NO_PERSONAL_DATA';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: DocumentLifecycleStatus;
  current_version_id?: string;
  has_legal_hold: boolean;
  retention_policy_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseDocumentVersionRecord {
  id: string;
  document_id: string;
  version_number: string; // e.g. "1.0", "1.1", "2.0"
  file_reference: string;
  checksum: string;
  created_by: string;
  created_at: string;
  change_summary: string;
  status: VersionLifecycleStatus;
  is_signed_and_locked: boolean;
}

export interface EnterpriseSignatureRequestRecord {
  id: string;
  document_version_id: string;
  signer_id: string;
  signature_type: 'ELECTRONIC' | 'DIGITAL' | 'ORGANIZATIONAL';
  status: SignatureStatus;
  requested_at: string;
  signed_at?: string;
  provider_reference?: string;
}

export interface EnterpriseDocumentShareRecord {
  id: string;
  document_id: string;
  recipient_email: string;
  purpose: string;
  watermark_text?: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  created_at: string;
}

export interface DocumentGovernanceDashboardMetrics {
  totalDocumentsCount: number;
  effectiveDocumentsCount: number;
  draftDocumentsCount: number;
  pendingSignaturesCount: number;
  activeSharesCount: number;
  legalHoldDocumentsCount: number;
  governanceScorePercent: number;
  posture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseDocumentGovernanceService {
  private static instance: CentralEnterpriseDocumentGovernanceService;

  private documents: EnterpriseDocumentRecord[] = [];
  private versions: EnterpriseDocumentVersionRecord[] = [];
  private signatureRequests: EnterpriseSignatureRequestRecord[] = [];
  private shares: EnterpriseDocumentShareRecord[] = [];

  private docCounter = 100;
  private sigCounter = 100;
  private shrCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseDocumentGovernanceService {
    if (!CentralEnterpriseDocumentGovernanceService.instance) {
      CentralEnterpriseDocumentGovernanceService.instance = new CentralEnterpriseDocumentGovernanceService();
    }
    return CentralEnterpriseDocumentGovernanceService.instance;
  }

  private seedDemoData(): void {
    const docId = 'gov-doc-seed-001';
    const verId = 'ver-seed-001';

    this.documents.push({
      id: docId,
      document_number: 'DOC-2026-000001',
      title: 'University Degree Certification & Academic Credential Master',
      description: 'Authoritative degree register and digitally verifiable student graduation credential',
      document_type: 'CERTIFICATE',
      category: 'Academic/Examination',
      owner_id: 'emp-reg-001',
      organization_id: 'inst-sit',
      department_id: 'dept-exam',
      classification: 'RESTRICTED',
      privacy_tag: 'SENSITIVE_PERSONAL_DATA',
      criticality: 'CRITICAL',
      status: 'EFFECTIVE',
      current_version_id: verId,
      has_legal_hold: false,
      retention_policy_ref: 'RET-DEGREE-PERMANENT',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });

    this.versions.push({
      id: verId,
      document_id: docId,
      version_number: '1.0',
      file_reference: 'dms://vault/credentials/degree_master_v1.pdf',
      checksum: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      created_by: 'emp-reg-001',
      created_at: '2026-01-01T09:00:00Z',
      change_summary: 'Initial official degree template publication',
      status: 'EFFECTIVE',
      is_signed_and_locked: true
    });
  }

  // ─── DOCUMENT MASTER & LIFECYCLE ─────────────────────────────────────

  public createDocument(params: {
    title: string;
    description: string;
    documentType: EnterpriseDocumentType;
    category: string;
    ownerId: string;
    organizationId: string;
    departmentId: string;
    classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    privacyTag?: 'PERSONAL_DATA' | 'SENSITIVE_PERSONAL_DATA' | 'NO_PERSONAL_DATA';
    criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    initialFileReference: string;
    initialChecksum: string;
    context?: UserAuthorizationContext;
  }): { document: EnterpriseDocumentRecord; version: EnterpriseDocumentVersionRecord } {
    this.docCounter += 1;
    const docNumber = `DOC-2026-${String(this.docCounter).padStart(6, '0')}`;

    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const verId = `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const version: EnterpriseDocumentVersionRecord = {
      id: verId,
      document_id: docId,
      version_number: '1.0',
      file_reference: params.initialFileReference,
      checksum: params.initialChecksum,
      created_by: params.ownerId,
      created_at: new Date().toISOString(),
      change_summary: 'Initial draft version created',
      status: 'DRAFT',
      is_signed_and_locked: false
    };

    const document: EnterpriseDocumentRecord = {
      id: docId,
      document_number: docNumber,
      title: params.title,
      description: params.description,
      document_type: params.documentType,
      category: params.category,
      owner_id: params.ownerId,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      classification: params.classification,
      privacy_tag: params.privacyTag || 'NO_PERSONAL_DATA',
      criticality: params.criticality || 'MEDIUM',
      status: 'DRAFT',
      current_version_id: verId,
      has_legal_hold: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.versions.push(version);
    this.documents.push(document);

    return { document, version };
  }

  public approveAndPublishDocument(documentId: string, approverId: string): EnterpriseDocumentRecord {
    const doc = this.documents.find(d => d.id === documentId || d.document_number === documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    const ver = this.versions.find(v => v.id === doc.current_version_id);
    if (ver) {
      ver.status = 'EFFECTIVE';
    }

    doc.status = 'EFFECTIVE';
    doc.updated_at = new Date().toISOString();

    return doc;
  }

  // ─── VERSION CONTROL & IMMUTABILITY ──────────────────────────────────

  public createNewVersion(params: {
    documentId: string;
    versionNumber: string;
    fileReference: string;
    checksum: string;
    createdBy: string;
    changeSummary: string;
  }): EnterpriseDocumentVersionRecord {
    const doc = this.documents.find(d => d.id === params.documentId || d.document_number === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    // Old version marked superseded
    const oldVer = this.versions.find(v => v.id === doc.current_version_id);
    if (oldVer) {
      oldVer.status = 'SUPERSEDED';
    }

    const verId = `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newVersion: EnterpriseDocumentVersionRecord = {
      id: verId,
      document_id: doc.id,
      version_number: params.versionNumber,
      file_reference: params.fileReference,
      checksum: params.checksum,
      created_by: params.createdBy,
      created_at: new Date().toISOString(),
      change_summary: params.changeSummary,
      status: 'DRAFT',
      is_signed_and_locked: false
    };

    this.versions.push(newVersion);
    doc.current_version_id = verId;
    doc.status = 'IN_REVIEW';
    doc.updated_at = new Date().toISOString();

    return newVersion;
  }

  // ─── E-SIGNATURE INTEGRATION & LOCK ──────────────────────────────────

  public requestSignature(params: {
    documentVersionId: string;
    signerId: string;
    signatureType: 'ELECTRONIC' | 'DIGITAL' | 'ORGANIZATIONAL';
  }): EnterpriseSignatureRequestRecord {
    const ver = this.versions.find(v => v.id === params.documentVersionId);
    if (!ver) throw new Error(`Document Version ${params.documentVersionId} not found`);

    if (ver.is_signed_and_locked) {
      throw new Error(`Signature Request Blocked: Document Version ${ver.version_number} is already signed and locked`);
    }

    this.sigCounter += 1;
    const req: EnterpriseSignatureRequestRecord = {
      id: `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      document_version_id: params.documentVersionId,
      signer_id: params.signerId,
      signature_type: params.signatureType,
      status: 'REQUESTED',
      requested_at: new Date().toISOString(),
      provider_reference: `EXT-SIG-PROV-${this.sigCounter}`
    };

    this.signatureRequests.push(req);
    return req;
  }

  public completeSignature(requestId: string): EnterpriseSignatureRequestRecord {
    const req = this.signatureRequests.find(s => s.id === requestId);
    if (!req) throw new Error(`Signature request ${requestId} not found`);

    req.status = 'SIGNED';
    req.signed_at = new Date().toISOString();

    // Lock document version on successful signature
    const ver = this.versions.find(v => v.id === req.document_version_id);
    if (ver) {
      ver.is_signed_and_locked = true;
      ver.status = 'EFFECTIVE';
    }

    return req;
  }

  // ─── ACCESS GOVERNANCE & SECURE TIME-BOUND SHARES ─────────────────────

  public createSecureShare(params: {
    documentId: string;
    recipientEmail: string;
    purpose: string;
    durationHours: number;
    watermarkText?: string;
  }): EnterpriseDocumentShareRecord {
    const doc = this.documents.find(d => d.id === params.documentId || d.document_number === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    this.shrCounter += 1;
    const share: EnterpriseDocumentShareRecord = {
      id: `shr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      document_id: doc.id,
      recipient_email: params.recipientEmail,
      purpose: params.purpose,
      watermark_text: params.watermarkText || `CONFIDENTIAL - ${params.recipientEmail} - ${new Date().toISOString()}`,
      expiry_date: new Date(Date.now() + params.durationHours * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    this.shares.push(share);
    return share;
  }

  // ─── RETENTION & DISPOSITION GATES ───────────────────────────────────

  public requestDisposition(documentId: string): EnterpriseDocumentRecord {
    const doc = this.documents.find(d => d.id === documentId || d.document_number === documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.has_legal_hold) {
      throw new Error(`Disposition Blocked: Document ${doc.document_number} is under active Legal Hold`);
    }

    doc.status = 'DISPOSED';
    doc.updated_at = new Date().toISOString();

    return doc;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getDocumentGovernanceDashboardMetrics(context?: UserAuthorizationContext): DocumentGovernanceDashboardMetrics {
    const totalDocumentsCount = this.documents.length;
    const effectiveDocumentsCount = this.documents.filter(d => d.status === 'EFFECTIVE').length;
    const draftDocumentsCount = this.documents.filter(d => d.status === 'DRAFT').length;
    const pendingSignaturesCount = this.signatureRequests.filter(s => s.status === 'REQUESTED').length;
    const activeSharesCount = this.shares.filter(s => s.status === 'ACTIVE').length;
    const legalHoldDocumentsCount = this.documents.filter(d => d.has_legal_hold).length;

    return {
      totalDocumentsCount,
      effectiveDocumentsCount,
      draftDocumentsCount,
      pendingSignaturesCount,
      activeSharesCount,
      legalHoldDocumentsCount,
      governanceScorePercent: 97,
      posture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseDocumentGovernanceService = CentralEnterpriseDocumentGovernanceService.getInstance();
