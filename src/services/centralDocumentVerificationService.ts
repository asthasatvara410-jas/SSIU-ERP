import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';
import { centralDocumentSignatureService } from './centralDocumentSignatureService';

export type VerificationTypeCode = 
  | 'IDENTITY'
  | 'ACADEMIC'
  | 'EMPLOYMENT'
  | 'FINANCIAL'
  | 'ADDRESS'
  | 'CERTIFICATE'
  | 'DOCUMENT_AUTHENTICITY'
  | 'SOURCE'
  | 'SIGNATURE'
  | 'QR'
  | 'EXTERNAL';

export type VerificationStatus = 
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'VERIFIED_WITH_WARNING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REQUIRES_REVIEW'
  | 'CANCELLED';

export type VerificationResult = 
  | 'AUTHENTIC'
  | 'NOT_AUTHENTIC'
  | 'PARTIALLY_VERIFIED'
  | 'UNABLE_TO_VERIFY'
  | 'MISMATCH'
  | 'EXPIRED';

export interface DocumentVerificationTypeRecord {
  id: string;
  code: VerificationTypeCode;
  name: string;
  description: string;
  applicable_document_types: string[];
  required_evidence: string[];
  requires_external_source: boolean;
  requires_approval: boolean;
  validity_months: number; // 0 for permanent
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DocumentVerificationEvidenceRecord {
  id: string;
  verification_id: string;
  evidence_type: 'INTERNAL_RECORD' | 'EXTERNAL_RECORD' | 'QR_RESULT' | 'SIGNATURE_RESULT' | 'MANUAL_REVIEW' | 'ISSUER_CONFIRMATION';
  source: string;
  reference: string;
  result: 'PASSED' | 'FAILED' | 'WARNING' | 'INDETERMINATE';
  notes: string;
  created_by: string;
  created_at: string;
}

export interface DocumentVerificationRecord {
  id: string;
  verification_number: string;
  document_id: string;
  document_version_id: string;
  verification_type_code: VerificationTypeCode;
  status: VerificationStatus;
  result?: VerificationResult;
  requested_by: string;
  assigned_to?: string;
  requested_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  rejection_reason?: string;
  evidence: DocumentVerificationEvidenceRecord[];
  is_reverification: boolean;
  previous_verification_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationDashboardMetrics {
  totalVerificationsCount: number;
  verifiedCount: number;
  rejectedCount: number;
  warningCount: number;
  expiredCount: number;
  pendingCount: number;
}

class CentralDocumentVerificationService {
  private static instance: CentralDocumentVerificationService;

  private verificationTypes: DocumentVerificationTypeRecord[] = [
    {
      id: 'ver-type-ident-001',
      code: 'IDENTITY',
      name: 'Government Identity Proof Verification',
      description: 'Verification of Aadhaar, PAN, Passport, or Voter ID against government identity standards',
      applicable_document_types: ['DOC_AADHAAR', 'DOC_PAN', 'DOC_PASSPORT'],
      required_evidence: ['INTERNAL_RECORD', 'MANUAL_REVIEW'],
      requires_external_source: false,
      requires_approval: true,
      validity_months: 24,
      status: 'ACTIVE'
    },
    {
      id: 'ver-type-acad-001',
      code: 'ACADEMIC',
      name: 'Academic Marksheet / Certificate Verification',
      description: 'Verification of 10th/12th/Degree marksheet against secondary board or university records',
      applicable_document_types: ['DOC_MARKSHEET_10TH', 'DOC_MARKSHEET_12TH', 'DOC_DEGREE_CERT'],
      required_evidence: ['INTERNAL_RECORD', 'MANUAL_REVIEW'],
      requires_external_source: false,
      requires_approval: true,
      validity_months: 0, // Permanent
      status: 'ACTIVE'
    },
    {
      id: 'ver-type-cert-001',
      code: 'CERTIFICATE',
      name: 'University Certificate & QR Verification',
      description: 'Verification of SSIU issued Bonafide, NOC, or Degree via cryptographic signature and QR endpoint',
      applicable_document_types: ['DOC_BONAFIDE_CERT', 'DOC_NOC_CERT', 'DOC_DEGREE_CERT'],
      required_evidence: ['QR_RESULT', 'SIGNATURE_RESULT'],
      requires_external_source: false,
      requires_approval: false,
      validity_months: 12,
      status: 'ACTIVE'
    }
  ];

  private verifications: DocumentVerificationRecord[] = [];
  private sequenceCounter = 100;

  private constructor() {
    this.seedDemoVerifications();
  }

  public static getInstance(): CentralDocumentVerificationService {
    if (!CentralDocumentVerificationService.instance) {
      CentralDocumentVerificationService.instance = new CentralDocumentVerificationService();
    }
    return CentralDocumentVerificationService.instance;
  }

  private seedDemoVerifications(): void {
    // Demo verification for Aarav Patel Aadhaar
    this.verifications.push({
      id: 'verif-demo-001',
      verification_number: 'SSIU/VER/2026/000100',
      document_id: 'dms-doc-001',
      document_version_id: 'ver-001',
      verification_type_code: 'IDENTITY',
      status: 'VERIFIED',
      result: 'AUTHENTIC',
      requested_by: 'STU-2026-000001',
      assigned_to: 'emp-reg-001',
      requested_at: '2026-04-10T10:00:00Z',
      started_at: '2026-04-10T10:05:00Z',
      completed_at: '2026-04-10T10:15:00Z',
      expires_at: '2028-04-10T10:15:00Z',
      evidence: [
        {
          id: 'ev-demo-001',
          verification_id: 'verif-demo-001',
          evidence_type: 'INTERNAL_RECORD',
          source: 'Admission Application Form',
          reference: 'APP-2026-000001',
          result: 'PASSED',
          notes: 'Aadhaar name and DOB match Student Admission Form 100%',
          created_by: 'emp-reg-001',
          created_at: '2026-04-10T10:10:00Z'
        }
      ],
      is_reverification: false,
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-10T10:15:00Z'
    });
  }

  // ─── CREATE VERIFICATION REQUEST ─────────────────────────────────────

  public createVerificationRequest(params: {
    documentId: string;
    documentVersionId: string;
    verificationTypeCode: VerificationTypeCode;
    requestedBy: string;
    assignedTo?: string;
    isReverification?: boolean;
    previousVerificationId?: string;
    context?: UserAuthorizationContext;
  }): DocumentVerificationRecord {
    const vType = this.verificationTypes.find(t => t.code === params.verificationTypeCode && t.status === 'ACTIVE');
    if (!vType) throw new Error(`Verification type '${params.verificationTypeCode}' not recognized`);

    this.sequenceCounter += 1;
    const vNumber = `SSIU/VER/2026/${String(this.sequenceCounter).padStart(6, '0')}`;
    const id = `verif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const req: DocumentVerificationRecord = {
      id,
      verification_number: vNumber,
      document_id: params.documentId,
      document_version_id: params.documentVersionId,
      verification_type_code: params.verificationTypeCode,
      status: params.assignedTo ? 'IN_REVIEW' : 'PENDING',
      requested_by: params.requestedBy,
      assigned_to: params.assignedTo,
      requested_at: new Date().toISOString(),
      started_at: params.assignedTo ? new Date().toISOString() : undefined,
      evidence: [],
      is_reverification: params.isReverification ?? false,
      previous_verification_id: params.previousVerificationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.verifications.push(req);
    return req;
  }

  // ─── ADD VERIFICATION EVIDENCE ───────────────────────────────────────

  public addEvidence(params: {
    verificationId: string;
    evidenceType: 'INTERNAL_RECORD' | 'EXTERNAL_RECORD' | 'QR_RESULT' | 'SIGNATURE_RESULT' | 'MANUAL_REVIEW' | 'ISSUER_CONFIRMATION';
    source: string;
    reference: string;
    result: 'PASSED' | 'FAILED' | 'WARNING' | 'INDETERMINATE';
    notes: string;
    createdBy: string;
  }): DocumentVerificationEvidenceRecord {
    const verif = this.verifications.find(v => v.id === params.verificationId);
    if (!verif) throw new Error(`Verification ${params.verificationId} not found`);

    const evId = `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ev: DocumentVerificationEvidenceRecord = {
      id: evId,
      verification_id: verif.id,
      evidence_type: params.evidenceType,
      source: params.source,
      reference: params.reference,
      result: params.result,
      notes: params.notes,
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    verif.evidence.push(ev);
    verif.updated_at = new Date().toISOString();
    return ev;
  }

  // ─── EXECUTE VERIFICATION DECISION ───────────────────────────────────

  public completeVerification(params: {
    verificationId: string;
    decision: 'VERIFY' | 'VERIFY_WITH_WARNING' | 'REJECT';
    rejectionReason?: string;
    verifiedBy: string;
    context?: UserAuthorizationContext;
  }): DocumentVerificationRecord {
    const verif = this.verifications.find(v => v.id === params.verificationId);
    if (!verif) throw new Error(`Verification ${params.verificationId} not found`);

    const vType = this.verificationTypes.find(t => t.code === verif.verification_type_code);

    if (params.decision === 'REJECT') {
      if (!params.rejectionReason) throw new Error('Mandatory rejection reason required to reject verification');
      verif.status = 'REJECTED';
      verif.result = 'NOT_AUTHENTIC';
      verif.rejection_reason = params.rejectionReason;
    } else if (params.decision === 'VERIFY_WITH_WARNING') {
      verif.status = 'VERIFIED_WITH_WARNING';
      verif.result = 'PARTIALLY_VERIFIED';
    } else {
      verif.status = 'VERIFIED';
      verif.result = 'AUTHENTIC';
    }

    verif.completed_at = new Date().toISOString();
    verif.assigned_to = params.verifiedBy;

    // Calculate expiry date if policy defines validity
    if (vType && vType.validity_months > 0 && verif.status === 'VERIFIED') {
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + vType.validity_months);
      verif.expires_at = expDate.toISOString();
    }

    verif.updated_at = new Date().toISOString();

    // Propagate verification status to Central DMS document
    const doc = centralDocumentManagementService.getDocumentById(verif.document_id);
    if (doc) {
      doc.verification_status = verif.status as any;
      doc.updated_at = new Date().toISOString();
    }

    return verif;
  }

  // ─── VERSION ISOLATION VERIFICATION CHECK ────────────────────────────

  public getVerificationForVersion(documentId: string, versionId: string): DocumentVerificationRecord | undefined {
    return this.verifications.find(v => v.document_id === documentId && v.document_version_id === versionId && v.status === 'VERIFIED');
  }

  // ─── RE-VERIFICATION ENGINE ──────────────────────────────────────────

  public requestReverification(params: {
    previousVerificationId: string;
    requestedBy: string;
    reason: string;
  }): DocumentVerificationRecord {
    const prev = this.verifications.find(v => v.id === params.previousVerificationId);
    if (!prev) throw new Error(`Previous verification ${params.previousVerificationId} not found`);

    return this.createVerificationRequest({
      documentId: prev.document_id,
      documentVersionId: prev.document_version_id,
      verificationTypeCode: prev.verification_type_code,
      requestedBy: params.requestedBy,
      isReverification: true,
      previousVerificationId: prev.id
    });
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getVerificationDashboardMetrics(context?: UserAuthorizationContext): VerificationDashboardMetrics {
    const totalVerificationsCount = this.verifications.length;
    const verifiedCount = this.verifications.filter(v => v.status === 'VERIFIED').length;
    const rejectedCount = this.verifications.filter(v => v.status === 'REJECTED').length;
    const warningCount = this.verifications.filter(v => v.status === 'VERIFIED_WITH_WARNING').length;
    const expiredCount = this.verifications.filter(v => v.status === 'EXPIRED').length;
    const pendingCount = this.verifications.filter(v => v.status === 'PENDING' || v.status === 'IN_REVIEW').length;

    return {
      totalVerificationsCount,
      verifiedCount,
      rejectedCount,
      warningCount,
      expiredCount,
      pendingCount
    };
  }
}

export const centralDocumentVerificationService = CentralDocumentVerificationService.getInstance();
