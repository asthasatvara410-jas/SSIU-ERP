import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type DocumentCategory =
  | 'IDENTITY'
  | 'ADMISSION'
  | 'ACADEMIC'
  | 'FINANCIAL'
  | 'TRANSFER'
  | 'CERTIFICATE'
  | 'LEGAL'
  | 'OTHER';

export type StudentDocumentStatus =
  | 'REQUIRED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REPLACED'
  | 'WAIVED'
  | 'NOT_APPLICABLE';

export type DocumentValidity = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';

export interface StudentDocumentRequirementRecord {
  id: string;
  program_id: string;
  document_type_code: string;
  document_type_name: string;
  category: DocumentCategory;
  is_mandatory: boolean;
}

export interface StudentDossierDocumentRecord {
  id: string;
  student_id: string;
  document_type_code: string;
  document_name: string;
  category: DocumentCategory;
  file_url: string;
  version: number;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  status: StudentDocumentStatus;
  is_archived: boolean;
  uploaded_by: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  waived_by?: string;
  waiver_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVerificationQueueItem {
  id: string;
  document_id: string;
  student_id: string;
  student_name: string;
  document_type_name: string;
  submitted_at: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  assigned_verifier?: string;
}

export interface StudentDossierSummary {
  student_id: string;
  total_required: number;
  submitted_count: number;
  verified_count: number;
  pending_count: number;
  rejected_count: number;
  expired_count: number;
  waived_count: number;
  completeness_percentage: number;
}

export interface StudentDossierDashboardMetrics {
  totalDocumentsInDossier: number;
  verifiedDocuments: number;
  pendingVerification: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  expiringSoonDocuments: number;
  completeDossiersCount: number;
  incompleteDossiersCount: number;
  averageDossierCompleteness: number;
}

class StudentDossierDocumentService {
  private static instance: StudentDossierDocumentService;

  private requirements: StudentDocumentRequirementRecord[] = [
    {
      id: 'req-001',
      program_id: 'prog-bca',
      document_type_code: 'DOC_AADHAAR',
      document_type_name: 'Aadhaar Card / National ID',
      category: 'IDENTITY',
      is_mandatory: true
    },
    {
      id: 'req-002',
      program_id: 'prog-bca',
      document_type_code: 'DOC_10TH_MARKSHEET',
      document_type_name: '10th Standard Marksheet',
      category: 'ACADEMIC',
      is_mandatory: true
    },
    {
      id: 'req-003',
      program_id: 'prog-bca',
      document_type_code: 'DOC_12TH_MARKSHEET',
      document_type_name: '12th Standard Marksheet',
      category: 'ACADEMIC',
      is_mandatory: true
    },
    {
      id: 'req-004',
      program_id: 'prog-bca',
      document_type_code: 'DOC_MIGRATION_CERT',
      document_type_name: 'School / College Migration Certificate',
      category: 'TRANSFER',
      is_mandatory: true
    }
  ];

  private documents: StudentDossierDocumentRecord[] = [
    {
      id: 'doc-001',
      student_id: 'STU-2026-000001',
      document_type_code: 'DOC_AADHAAR',
      document_name: 'Aadhaar_AaravPatel.pdf',
      category: 'IDENTITY',
      file_url: 'https://docs.swarrnim.edu.in/students/STU-2026-000001/aadhaar_v1.pdf',
      version: 1,
      document_number: '1234-5678-9012',
      status: 'VERIFIED',
      is_archived: false,
      uploaded_by: 'STU-2026-000001',
      verified_by: 'emp-reg-001',
      verified_at: '2026-04-12T10:00:00Z',
      created_at: '2026-04-10T11:00:00Z',
      updated_at: '2026-04-12T10:00:00Z'
    },
    {
      id: 'doc-002',
      student_id: 'STU-2026-000001',
      document_type_code: 'DOC_10TH_MARKSHEET',
      document_name: 'Marksheet_10th_AaravPatel.pdf',
      category: 'ACADEMIC',
      file_url: 'https://docs.swarrnim.edu.in/students/STU-2026-000001/10th_marksheet_v1.pdf',
      version: 1,
      status: 'VERIFIED',
      is_archived: false,
      uploaded_by: 'STU-2026-000001',
      verified_by: 'emp-reg-001',
      verified_at: '2026-04-12T10:05:00Z',
      created_at: '2026-04-10T11:05:00Z',
      updated_at: '2026-04-12T10:05:00Z'
    },
    {
      id: 'doc-003',
      student_id: 'STU-2026-000001',
      document_type_code: 'DOC_12TH_MARKSHEET',
      document_name: 'Marksheet_12th_AaravPatel.pdf',
      category: 'ACADEMIC',
      file_url: 'https://docs.swarrnim.edu.in/students/STU-2026-000001/12th_marksheet_v1.pdf',
      version: 1,
      status: 'VERIFIED',
      is_archived: false,
      uploaded_by: 'STU-2026-000001',
      verified_by: 'emp-reg-001',
      verified_at: '2026-04-12T10:10:00Z',
      created_at: '2026-04-10T11:10:00Z',
      updated_at: '2026-04-12T10:10:00Z'
    }
  ];

  private verificationQueue: DocumentVerificationQueueItem[] = [];

  private constructor() {}

  public static getInstance(): StudentDossierDocumentService {
    if (!StudentDossierDocumentService.instance) {
      StudentDossierDocumentService.instance = new StudentDossierDocumentService();
    }
    return StudentDossierDocumentService.instance;
  }

  // ─── DOCUMENT UPLOAD & VERSIONING ENGINE ──────────────────────────────

  public uploadDocument(params: {
    studentId: string;
    documentTypeCode: string;
    documentName: string;
    category: DocumentCategory;
    fileUrl: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    uploadedBy: string;
  }): StudentDossierDocumentRecord {
    if (!params.fileUrl) throw new Error('Valid file storage URL is mandatory for document upload');

    // Check existing versions for this student and document type
    const previousVersions = this.documents.filter(
      d => d.student_id === params.studentId && d.document_type_code === params.documentTypeCode
    );

    let nextVersion = 1;
    if (previousVersions.length > 0) {
      // Mark latest previous version as REPLACED
      previousVersions.forEach(pv => {
        if (pv.status !== 'REPLACED' && pv.status !== 'WAIVED') {
          pv.status = 'REPLACED';
          pv.updated_at = new Date().toISOString();
        }
      });
      nextVersion = Math.max(...previousVersions.map(pv => pv.version)) + 1;
    }

    const docRecord: StudentDossierDocumentRecord = {
      id: `doc-${Date.now()}`,
      student_id: params.studentId,
      document_type_code: params.documentTypeCode,
      document_name: params.documentName,
      category: params.category,
      file_url: params.fileUrl,
      version: nextVersion,
      document_number: params.documentNumber,
      issue_date: params.issueDate,
      expiry_date: params.expiryDate,
      status: 'SUBMITTED',
      is_archived: false,
      uploaded_by: params.uploadedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.documents.push(docRecord);

    this.verificationQueue.push({
      id: `vq-${Date.now()}`,
      document_id: docRecord.id,
      student_id: params.studentId,
      student_name: 'Student Record',
      document_type_name: params.documentName,
      submitted_at: new Date().toISOString(),
      status: 'PENDING',
      priority: 'NORMAL'
    });

    return docRecord;
  }

  // ─── VERIFICATION & REJECTION WORKFLOW ────────────────────────────────

  public verifyDocument(params: {
    documentId: string;
    verifiedBy: string;
  }): StudentDossierDocumentRecord {
    const doc = this.documents.find(d => d.id === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    doc.status = 'VERIFIED';
    doc.verified_by = params.verifiedBy;
    doc.verified_at = new Date().toISOString();
    doc.updated_at = new Date().toISOString();

    const qItem = this.verificationQueue.find(q => q.document_id === params.documentId);
    if (qItem) qItem.status = 'VERIFIED';

    return doc;
  }

  public rejectDocument(params: {
    documentId: string;
    rejectionReason: string;
    rejectedBy: string;
  }): StudentDossierDocumentRecord {
    const doc = this.documents.find(d => d.id === params.documentId);
    if (!doc) throw new Error(`Document ${params.documentId} not found`);

    if (!params.rejectionReason) throw new Error('Mandatory rejection reason required for document rejection');

    doc.status = 'REJECTED';
    doc.rejection_reason = params.rejectionReason;
    doc.verified_by = params.rejectedBy;
    doc.verified_at = new Date().toISOString();
    doc.updated_at = new Date().toISOString();

    const qItem = this.verificationQueue.find(q => q.document_id === params.documentId);
    if (qItem) qItem.status = 'REJECTED';

    return doc;
  }

  public waiveDocument(params: {
    studentId: string;
    documentTypeCode: string;
    waiverReason: string;
    waivedBy: string;
  }): StudentDossierDocumentRecord {
    if (!params.waiverReason) throw new Error('Mandatory justification required to waive document requirement');

    const waivedDoc: StudentDossierDocumentRecord = {
      id: `doc-waive-${Date.now()}`,
      student_id: params.studentId,
      document_type_code: params.documentTypeCode,
      document_name: 'Requirement Waived',
      category: 'OTHER',
      file_url: 'N/A',
      version: 1,
      status: 'WAIVED',
      is_archived: false,
      uploaded_by: params.waivedBy,
      waived_by: params.waivedBy,
      waiver_reason: params.waiverReason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.documents.push(waivedDoc);
    return waivedDoc;
  }

  // ─── DYNAMIC EXPIRY & VALIDITY ENGINE ─────────────────────────────────

  public evaluateDocumentValidity(doc: StudentDossierDocumentRecord): DocumentValidity {
    if (!doc.expiry_date) return 'NO_EXPIRY';

    const now = new Date().getTime();
    const expiryTime = new Date(doc.expiry_date).getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    if (expiryTime < now) return 'EXPIRED';
    if (expiryTime - now <= thirtyDaysInMs) return 'EXPIRING_SOON';
    return 'VALID';
  }

  // ─── DOSSIER COMPLETENESS ENGINE ─────────────────────────────────────

  public calculateDossierSummary(studentId: string, programId: string = 'prog-bca'): StudentDossierSummary {
    const progReqs = this.requirements.filter(r => r.program_id === programId && r.is_mandatory);
    const studentDocs = this.documents.filter(d => d.student_id === studentId && !d.is_archived && d.status !== 'REPLACED');

    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let expiredCount = 0;
    let waivedCount = 0;

    progReqs.forEach(req => {
      const matchDoc = studentDocs.find(d => d.document_type_code === req.document_type_code);
      if (!matchDoc) {
        pendingCount++;
      } else if (matchDoc.status === 'VERIFIED') {
        const validity = this.evaluateDocumentValidity(matchDoc);
        if (validity === 'EXPIRED') {
          expiredCount++;
        } else {
          verifiedCount++;
        }
      } else if (matchDoc.status === 'WAIVED') {
        waivedCount++;
        verifiedCount++; // Waived counts towards completed requirement
      } else if (matchDoc.status === 'REJECTED') {
        rejectedCount++;
      } else {
        pendingCount++;
      }
    });

    const totalRequired = progReqs.length;
    const completenessPercentage = totalRequired > 0 ? Math.round((verifiedCount / totalRequired) * 100) : 100;

    return {
      student_id: studentId,
      total_required: totalRequired,
      submitted_count: studentDocs.length,
      verified_count: verifiedCount,
      pending_count: pendingCount,
      rejected_count: rejectedCount,
      expired_count: expiredCount,
      waived_count: waivedCount,
      completeness_percentage: completenessPercentage
    };
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getDossierDashboardMetrics(context?: UserAuthorizationContext): StudentDossierDashboardMetrics {
    const totalDocumentsInDossier = this.documents.length;
    const verifiedDocuments = this.documents.filter(d => d.status === 'VERIFIED').length;
    const pendingVerification = this.documents.filter(d => d.status === 'SUBMITTED' || d.status === 'PENDING' || d.status === 'UNDER_REVIEW').length;
    const rejectedDocuments = this.documents.filter(d => d.status === 'REJECTED').length;

    let expiredDocuments = 0;
    let expiringSoonDocuments = 0;

    this.documents.forEach(d => {
      const val = this.evaluateDocumentValidity(d);
      if (val === 'EXPIRED') expiredDocuments++;
      if (val === 'EXPIRING_SOON') expiringSoonDocuments++;
    });

    // Sample computation for Aarav Patel
    const summary = this.calculateDossierSummary('STU-2026-000001', 'prog-bca');
    const completeDossiersCount = summary.completeness_percentage === 100 ? 1 : 0;
    const incompleteDossiersCount = summary.completeness_percentage < 100 ? 1 : 0;

    return {
      totalDocumentsInDossier,
      verifiedDocuments,
      pendingVerification,
      rejectedDocuments,
      expiredDocuments,
      expiringSoonDocuments,
      completeDossiersCount,
      incompleteDossiersCount,
      averageDossierCompleteness: summary.completeness_percentage
    };
  }
}

export const studentDossierDocumentService = StudentDossierDocumentService.getInstance();
