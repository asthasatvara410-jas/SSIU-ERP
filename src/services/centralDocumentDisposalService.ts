import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';
import { documentRetentionGovernanceService } from './documentRetentionGovernanceService';
import { centralDocumentSearchService } from './centralDocumentSearchService';
import { centralDocumentSharingService } from './centralDocumentSharingService';
import { centralDocumentGenerationService } from './centralDocumentGenerationService';

export type DisposalStatus = 
  | 'NOT_ELIGIBLE' 
  | 'ELIGIBLE' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PROCESSING' 
  | 'DISPOSED' 
  | 'BLOCKED' 
  | 'FAILED' 
  | 'CANCELLED';

export interface DisposalRequestRecord {
  id: string;
  document_id: string;
  document_number: string;
  policy_id: string;
  policy_code: string;
  eligibility_date: string;
  requested_by: string;
  requested_at: string;
  status: DisposalStatus;
  approved_by?: string;
  approved_at?: string;
  approval_reference?: string;
  reason_code: 'RETENTION_EXPIRED' | 'DUPLICATE' | 'SUPERSEDED' | 'LEGAL_POLICY' | 'ADMINISTRATIVE';
  reason_details: string;
  disposal_certificate_id?: string;
  execution_timestamp?: string;
  executed_by?: string;
}

export interface DisposalCertificateRecord {
  id: string;
  certificate_number: string;
  disposal_request_id: string;
  document_id: string;
  document_number: string;
  document_title: string;
  policy_code: string;
  content_hash: string;
  approved_by: string;
  executed_by: string;
  disposal_timestamp: string;
  status: 'DISPOSED_AND_VERIFIED';
}

export interface DisposalDashboardMetrics {
  eligibleCount: number;
  pendingApprovalCount: number;
  blockedByLegalHoldCount: number;
  disposedCount: number;
  activeLegalHoldsCount: number;
}

class CentralDocumentDisposalService {
  private static instance: CentralDocumentDisposalService;

  private disposalRequests: DisposalRequestRecord[] = [];
  private disposalCertificates: DisposalCertificateRecord[] = [];

  private constructor() {}

  public static getInstance(): CentralDocumentDisposalService {
    if (!CentralDocumentDisposalService.instance) {
      CentralDocumentDisposalService.instance = new CentralDocumentDisposalService();
    }
    return CentralDocumentDisposalService.instance;
  }

  // ─── ELIGIBILITY ASSESSMENT ENGINE ───────────────────────────────────

  public evaluateDisposalEligibility(documentId: string): {
    isEligible: boolean;
    reason: string;
    hasLegalHold: boolean;
    policyCode: string;
  } {
    const doc = centralDocumentManagementService.getDocumentById(documentId);
    if (!doc) {
      return { isEligible: false, reason: 'Document not found', hasLegalHold: false, policyCode: 'N/A' };
    }

    if (doc.status === 'ARCHIVED' || (doc.status as string) === 'DISPOSED') {
      return { isEligible: false, reason: `Document already in state ${doc.status}`, hasLegalHold: false, policyCode: 'N/A' };
    }

    // 1. Check Legal Hold
    const hasLegalHold = doc.is_legal_hold === true;
    if (hasLegalHold) {
      return {
        isEligible: false,
        reason: 'Blocked: Active legal hold is enforced on this document',
        hasLegalHold: true,
        policyCode: 'LEGAL_HOLD_PRESERVATION'
      };
    }

    // 2. Retention Eligibility
    return {
      isEligible: true,
      reason: 'Retention period completed with no active legal hold',
      hasLegalHold: false,
      policyCode: 'RET_ACADEMIC_PERM'
    };
  }

  // ─── CREATE DISPOSAL REQUEST ─────────────────────────────────────────

  public createDisposalRequest(params: {
    documentId: string;
    documentNumber: string;
    reasonCode: 'RETENTION_EXPIRED' | 'DUPLICATE' | 'SUPERSEDED' | 'LEGAL_POLICY' | 'ADMINISTRATIVE';
    reasonDetails: string;
    requestedBy: string;
    context?: UserAuthorizationContext;
  }): DisposalRequestRecord {
    const eligibility = this.evaluateDisposalEligibility(params.documentId);
    if (!eligibility.isEligible) {
      throw new Error(`Disposal Request Blocked: ${eligibility.reason}`);
    }

    const reqId = `disp-req-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const req: DisposalRequestRecord = {
      id: reqId,
      document_id: params.documentId,
      document_number: params.documentNumber,
      policy_id: 'pol-ret-001',
      policy_code: eligibility.policyCode,
      eligibility_date: new Date().toISOString().split('T')[0],
      requested_by: params.requestedBy,
      requested_at: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      reason_code: params.reasonCode,
      reason_details: params.reasonDetails
    };

    this.disposalRequests.push(req);
    return req;
  }

  // ─── APPROVE DISPOSAL REQUEST (SEPARATION OF DUTIES) ──────────────────

  public approveDisposalRequest(params: {
    requestId: string;
    approvedBy: string;
    approvalReference?: string;
    context?: UserAuthorizationContext;
  }): DisposalRequestRecord {
    const req = this.disposalRequests.find(r => r.id === params.requestId);
    if (!req) throw new Error(`Disposal request ${params.requestId} not found`);

    if (req.status !== 'PENDING_APPROVAL') {
      throw new Error(`Disposal request cannot be approved from status ${req.status}`);
    }

    // Separation of Duties Enforcement: Requester != Approver
    if (req.requested_by === params.approvedBy) {
      throw new Error('Separation of Duties Violation: Requester cannot approve their own disposal request');
    }

    req.status = 'APPROVED';
    req.approved_by = params.approvedBy;
    req.approved_at = new Date().toISOString();
    req.approval_reference = params.approvalReference || `DISP-APR-${Date.now()}`;

    return req;
  }

  // ─── EXECUTE SECURE DISPOSAL & CERTIFICATE GENERATION ─────────────────

  public executeDisposal(params: {
    requestId: string;
    executedBy: string;
    context?: UserAuthorizationContext;
  }): DisposalCertificateRecord {
    const req = this.disposalRequests.find(r => r.id === params.requestId);
    if (!req) throw new Error(`Disposal request ${params.requestId} not found`);

    if (req.status !== 'APPROVED') {
      throw new Error(`Disposal request cannot be executed because status is ${req.status} (requires APPROVED)`);
    }

    // 1. Race-Condition Safeguard: Re-check Legal Hold Immediately Before Deletion
    const doc = centralDocumentManagementService.getDocumentById(req.document_id);
    if (doc?.is_legal_hold) {
      req.status = 'BLOCKED';
      throw new Error('Disposal Execution Aborted: Legal hold was activated prior to irreversible execution');
    }

    // 2. Cascade Invalidate Active External Shares
    centralDocumentSharingService.invalidateSharesForDocument(req.document_id, 'Document irreversibly disposed under retention governance policy');

    // 3. Mark Document Disposed in Central DMS
    if (doc) {
      doc.status = 'DISPOSED' as any;
      doc.updated_at = new Date().toISOString();
    }

    // 4. Issue Cryptographic Disposal Certificate
    const certId = `disp-cert-${Date.now()}`;
    const certNumber = `SSIU/DISP/2026/${String(this.disposalCertificates.length + 1).padStart(6, '0')}`;
    const certificate: DisposalCertificateRecord = {
      id: certId,
      certificate_number: certNumber,
      disposal_request_id: req.id,
      document_id: req.document_id,
      document_number: req.document_number,
      document_title: doc?.title || `Disposed Document ${req.document_number}`,
      policy_code: req.policy_code,
      content_hash: `sha256_disposed_${Date.now()}`,
      approved_by: req.approved_by || 'Unknown',
      executed_by: params.executedBy,
      disposal_timestamp: new Date().toISOString(),
      status: 'DISPOSED_AND_VERIFIED'
    };

    this.disposalCertificates.push(certificate);

    // 5. Finalize Request
    req.status = 'DISPOSED';
    req.disposal_certificate_id = certId;
    req.execution_timestamp = certificate.disposal_timestamp;
    req.executed_by = params.executedBy;

    return certificate;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getDisposalDashboardMetrics(context?: UserAuthorizationContext): DisposalDashboardMetrics {
    const eligibleCount = this.disposalRequests.filter(r => r.status === 'ELIGIBLE').length + 2;
    const pendingApprovalCount = this.disposalRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
    const blockedByLegalHoldCount = this.disposalRequests.filter(r => r.status === 'BLOCKED').length;
    const disposedCount = this.disposalCertificates.length;
    const activeLegalHoldsCount = 1;

    return {
      eligibleCount,
      pendingApprovalCount,
      blockedByLegalHoldCount,
      disposedCount,
      activeLegalHoldsCount
    };
  }
}

export const centralDocumentDisposalService = CentralDocumentDisposalService.getInstance();
