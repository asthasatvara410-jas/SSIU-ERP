import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentSearchService } from './centralDocumentSearchService';
import { centralDocumentSharingService } from './centralDocumentSharingService';

export type RecordClassification = 
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'HIGHLY_RESTRICTED';

export type RetentionUnit = 'DAYS' | 'MONTHS' | 'YEARS' | 'PERMANENT';

export type RetentionBasis = 
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_FINALIZED'
  | 'STUDENT_EXIT'
  | 'COURSE_COMPLETION'
  | 'EMPLOYEE_EXIT'
  | 'CONTRACT_END';

export type RetentionStatus = 
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'ELIGIBLE_FOR_DISPOSAL'
  | 'ON_HOLD'
  | 'DISPOSAL_PENDING'
  | 'DISPOSED'
  | 'PERMANENT';

export type HoldType = 
  | 'LEGAL_HOLD'
  | 'INVESTIGATION_HOLD'
  | 'AUDIT_HOLD'
  | 'DISPUTE_HOLD';

export interface DocumentRetentionPolicyRecord {
  id: string;
  policy_code: string;
  policy_name: string;
  description: string;
  document_type_id: string;
  classification_id: RecordClassification;
  scope: 'GLOBAL' | 'ORGANIZATION' | 'DEPARTMENT';
  retention_period: number;
  retention_unit: RetentionUnit;
  retention_basis: RetentionBasis;
  disposal_method: 'LOGICAL_DISPOSAL' | 'CRYPTOGRAPHIC_ERASURE';
  approval_required: boolean;
  legal_hold_supported: boolean;
  status: 'ACTIVE' | 'RETIRED';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRetentionRecord {
  id: string;
  document_id: string;
  version_id?: string;
  policy_id: string;
  classification_id: RecordClassification;
  retention_start_at: string;
  retention_end_at?: string;
  status: RetentionStatus;
  is_on_hold: boolean;
  last_evaluated_at: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentHoldRecord {
  id: string;
  hold_number: string;
  document_id: string;
  hold_type: HoldType;
  reason: string;
  authority: string;
  status: 'ACTIVE' | 'RELEASED';
  created_by: string;
  created_at: string;
  released_by?: string;
  released_at?: string;
  release_reason?: string;
}

export interface DocumentDisposalCertificateRecord {
  id: string;
  certificate_number: string;
  document_id: string;
  document_type_id: string;
  policy_code: string;
  retention_period_desc: string;
  disposal_method: string;
  approved_by: string;
  executed_by: string;
  disposed_at: string;
  checksum_at_disposal: string;
}

export interface DocumentComplianceDashboardMetrics {
  totalPoliciesCount: number;
  activeRetentionsCount: number;
  documentsOnHoldCount: number;
  expiringSoonCount: number;
  eligibleForDisposalCount: number;
  disposedDocumentsCount: number;
}

class CentralDocumentComplianceService {
  private static instance: CentralDocumentComplianceService;

  private policies: DocumentRetentionPolicyRecord[] = [];
  private retentionRecords: DocumentRetentionRecord[] = [];
  private holds: DocumentHoldRecord[] = [];
  private certificates: DocumentDisposalCertificateRecord[] = [];
  private holdCounter = 100;
  private certCounter = 100;

  private constructor() {
    this.seedDemoComplianceData();
  }

  public static getInstance(): CentralDocumentComplianceService {
    if (!CentralDocumentComplianceService.instance) {
      CentralDocumentComplianceService.instance = new CentralDocumentComplianceService();
    }
    return CentralDocumentComplianceService.instance;
  }

  private seedDemoComplianceData(): void {
    const policyId = 'pol-bonafide-001';
    this.policies.push({
      id: policyId,
      policy_code: 'POL_BONAFIDE_RETENTION_7Y',
      policy_name: 'Student Bonafide 7-Year Retention Policy',
      description: 'Retain bonafide certificate records for 7 years following student course exit',
      document_type_id: 'DOC_BONAFIDE_CERT',
      classification_id: 'CONFIDENTIAL',
      scope: 'GLOBAL',
      retention_period: 7,
      retention_unit: 'YEARS',
      retention_basis: 'STUDENT_EXIT',
      disposal_method: 'LOGICAL_DISPOSAL',
      approval_required: true,
      legal_hold_supported: true,
      status: 'ACTIVE',
      created_by: 'emp-reg-001',
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-10T10:00:00Z'
    });

    this.retentionRecords.push({
      id: 'ret-001',
      document_id: 'dms-doc-001',
      policy_id: policyId,
      classification_id: 'CONFIDENTIAL',
      retention_start_at: '2026-04-10T10:00:00Z',
      retention_end_at: '2033-04-10T10:00:00Z',
      status: 'ACTIVE',
      is_on_hold: false,
      last_evaluated_at: '2026-04-10T10:00:00Z',
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-10T10:00:00Z'
    });
  }

  // ─── RETENTION POLICY MANAGEMENT ─────────────────────────────────────

  public createRetentionPolicy(params: {
    policyCode: string;
    policyName: string;
    description: string;
    documentTypeId: string;
    classificationId: RecordClassification;
    scope?: 'GLOBAL' | 'ORGANIZATION' | 'DEPARTMENT';
    retentionPeriod: number;
    retentionUnit: RetentionUnit;
    retentionBasis: RetentionBasis;
    disposalMethod?: 'LOGICAL_DISPOSAL' | 'CRYPTOGRAPHIC_ERASURE';
    approvalRequired?: boolean;
    createdBy: string;
  }): DocumentRetentionPolicyRecord {
    if (this.policies.some(p => p.policy_code === params.policyCode)) {
      throw new Error(`Retention policy code ${params.policyCode} already exists`);
    }

    const policy: DocumentRetentionPolicyRecord = {
      id: `pol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      policy_code: params.policyCode,
      policy_name: params.policyName,
      description: params.description,
      document_type_id: params.documentTypeId,
      classification_id: params.classificationId,
      scope: params.scope || 'GLOBAL',
      retention_period: params.retentionPeriod,
      retention_unit: params.retentionUnit,
      retention_basis: params.retentionBasis,
      disposal_method: params.disposalMethod || 'LOGICAL_DISPOSAL',
      approval_required: params.approvalRequired !== undefined ? params.approvalRequired : true,
      legal_hold_supported: true,
      status: 'ACTIVE',
      created_by: params.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.policies.push(policy);
    return policy;
  }

  // ─── ASSIGN & EVALUATE RETENTION SCHEDULE ────────────────────────────

  public assignRetentionSchedule(params: {
    documentId: string;
    policyCode: string;
    startDate: string;
    context?: UserAuthorizationContext;
  }): DocumentRetentionRecord {
    const policy = this.policies.find(p => p.policy_code === params.policyCode && p.status === 'ACTIVE');
    if (!policy) throw new Error(`Active retention policy ${params.policyCode} not found`);

    let endDate: string | undefined;
    if (policy.retention_unit !== 'PERMANENT') {
      const start = new Date(params.startDate);
      if (policy.retention_unit === 'DAYS') {
        start.setDate(start.getDate() + policy.retention_period);
      } else if (policy.retention_unit === 'MONTHS') {
        start.setMonth(start.getMonth() + policy.retention_period);
      } else if (policy.retention_unit === 'YEARS') {
        start.setFullYear(start.getFullYear() + policy.retention_period);
      }
      endDate = start.toISOString();
    }

    const now = new Date();
    let status: RetentionStatus = 'ACTIVE';
    if (policy.retention_unit === 'PERMANENT') {
      status = 'PERMANENT';
    } else if (endDate && new Date(endDate) <= now) {
      status = 'ELIGIBLE_FOR_DISPOSAL';
    }

    const record: DocumentRetentionRecord = {
      id: `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      document_id: params.documentId,
      policy_id: policy.id,
      classification_id: policy.classification_id,
      retention_start_at: new Date(params.startDate).toISOString(),
      retention_end_at: endDate,
      status,
      is_on_hold: false,
      last_evaluated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.retentionRecords.push(record);
    return record;
  }

  // ─── LEGAL HOLD MANAGEMENT (DISPOSAL BLOCK) ───────────────────────────

  public placeLegalHold(params: {
    documentId: string;
    holdType: HoldType;
    reason: string;
    authority: string;
    createdBy: string;
  }): DocumentHoldRecord {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Mandatory legal hold justification reason required');
    }

    this.holdCounter += 1;
    const holdNumber = `HOLD/2026/${String(this.holdCounter).padStart(6, '0')}`;

    const hold: DocumentHoldRecord = {
      id: `hold-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      hold_number: holdNumber,
      document_id: params.documentId,
      hold_type: params.holdType,
      reason: params.reason,
      authority: params.authority,
      status: 'ACTIVE',
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    this.holds.push(hold);

    // Update retention record hold status
    const ret = this.retentionRecords.find(r => r.document_id === params.documentId);
    if (ret) {
      ret.is_on_hold = true;
      ret.status = 'ON_HOLD';
      ret.updated_at = new Date().toISOString();
    }

    return hold;
  }

  public releaseLegalHold(params: {
    holdId: string;
    releasedBy: string;
    releaseReason: string;
  }): DocumentHoldRecord {
    const hold = this.holds.find(h => h.id === params.holdId);
    if (!hold) throw new Error(`Legal hold ${params.holdId} not found`);

    hold.status = 'RELEASED';
    hold.released_by = params.releasedBy;
    hold.released_at = new Date().toISOString();
    hold.release_reason = params.releaseReason;

    // Check if other active holds remain for document
    const otherActiveHolds = this.holds.filter(h => h.document_id === hold.document_id && h.status === 'ACTIVE');
    const ret = this.retentionRecords.find(r => r.document_id === hold.document_id);

    if (ret && otherActiveHolds.length === 0) {
      ret.is_on_hold = false;
      const now = new Date();
      if (ret.retention_end_at && new Date(ret.retention_end_at) <= now) {
        ret.status = 'ELIGIBLE_FOR_DISPOSAL';
      } else {
        ret.status = 'ACTIVE';
      }
      ret.updated_at = new Date().toISOString();
    }

    return hold;
  }

  public getActiveHolds(documentId?: string): DocumentHoldRecord[] {
    let list = this.holds.filter(h => h.status === 'ACTIVE');
    if (documentId) {
      list = list.filter(h => h.document_id === documentId);
    }
    return list;
  }

  // ─── POLICY OVERRIDE ─────────────────────────────────────────────────

  public overrideRetentionPolicy(params: {
    documentId: string;
    newRetentionEndDate: string;
    overrideReason: string;
    approvedBy: string;
  }): DocumentRetentionRecord {
    const ret = this.retentionRecords.find(r => r.document_id === params.documentId);
    if (!ret) throw new Error(`Retention record for document ${params.documentId} not found`);

    ret.retention_end_at = new Date(params.newRetentionEndDate).toISOString();
    ret.status = new Date(params.newRetentionEndDate) <= new Date() ? 'ELIGIBLE_FOR_DISPOSAL' : 'ACTIVE';
    ret.updated_at = new Date().toISOString();

    return ret;
  }

  // ─── SECURE DISPOSAL EXECUTION & CERTIFICATE GENERATION ───────────────

  public executeDisposal(params: {
    documentId: string;
    executedBy: string;
    approvedBy: string;
    context?: UserAuthorizationContext;
  }): DocumentDisposalCertificateRecord {
    const ret = this.retentionRecords.find(r => r.document_id === params.documentId);
    if (!ret) throw new Error(`Retention schedule for document ${params.documentId} not found`);

    // Verify no active holds
    const activeHold = this.holds.find(h => h.document_id === params.documentId && h.status === 'ACTIVE');
    if (activeHold || ret.is_on_hold) {
      throw new Error(`Disposal Blocked: Document ${params.documentId} has an active legal hold (${activeHold?.hold_number || 'ACTIVE_HOLD'})`);
    }

    const policy = this.policies.find(p => p.id === ret.policy_id);

    // Invalidate Search Index & Secure Shares
    centralDocumentSearchService.removeDocumentFromIndex(params.documentId);
    centralDocumentSharingService.invalidateSharesForDocument(params.documentId, 'Document disposed under compliance retention policy');

    ret.status = 'DISPOSED';
    ret.updated_at = new Date().toISOString();

    this.certCounter += 1;
    const certNumber = `DISP/2026/${String(this.certCounter).padStart(6, '0')}`;

    const cert: DocumentDisposalCertificateRecord = {
      id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      certificate_number: certNumber,
      document_id: params.documentId,
      document_type_id: policy?.document_type_id || 'DOC_UNKNOWN',
      policy_code: policy?.policy_code || 'POL_STANDARD',
      retention_period_desc: `${policy?.retention_period || 7} ${policy?.retention_unit || 'YEARS'}`,
      disposal_method: policy?.disposal_method || 'LOGICAL_DISPOSAL',
      approved_by: params.approvedBy,
      executed_by: params.executedBy,
      disposed_at: new Date().toISOString(),
      checksum_at_disposal: `sha256_disp_${Date.now()}`
    };

    this.certificates.push(cert);
    return cert;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getComplianceDashboardMetrics(): DocumentComplianceDashboardMetrics {
    const totalPoliciesCount = this.policies.length;
    const activeRetentionsCount = this.retentionRecords.filter(r => r.status === 'ACTIVE').length;
    const documentsOnHoldCount = this.retentionRecords.filter(r => r.is_on_hold || r.status === 'ON_HOLD').length;
    const expiringSoonCount = this.retentionRecords.filter(r => r.status === 'EXPIRING_SOON').length;
    const eligibleForDisposalCount = this.retentionRecords.filter(r => r.status === 'ELIGIBLE_FOR_DISPOSAL').length;
    const disposedDocumentsCount = this.retentionRecords.filter(r => r.status === 'DISPOSED').length;

    return {
      totalPoliciesCount,
      activeRetentionsCount,
      documentsOnHoldCount,
      expiringSoonCount,
      eligibleForDisposalCount,
      disposedDocumentsCount
    };
  }
}

export const centralDocumentComplianceService = CentralDocumentComplianceService.getInstance();
