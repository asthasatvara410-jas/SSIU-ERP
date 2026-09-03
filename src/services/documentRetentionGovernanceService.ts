import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';

export type RetentionUnit = 'DAYS' | 'MONTHS' | 'YEARS' | 'PERMANENT';

export type RetentionStartEvent =
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_VERIFIED'
  | 'STUDENT_GRADUATION'
  | 'EMPLOYEE_EXIT'
  | 'CONTRACT_END';

export type ActionAfterRetention = 'REVIEW' | 'ARCHIVE' | 'DELETE' | 'PERMANENT_RETENTION';

export type RetentionQueueStatus =
  | 'ACTIVE'
  | 'UPCOMING'
  | 'DUE_FOR_REVIEW'
  | 'ON_HOLD'
  | 'ARCHIVED'
  | 'DISPOSAL_PENDING'
  | 'DISPOSED';

export interface RetentionPolicyRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  retention_period: number;
  retention_unit: RetentionUnit;
  retention_start_event: RetentionStartEvent;
  action_after_retention: ActionAfterRetention;
  review_required: boolean;
  legal_hold_supported: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  organization_id?: string;
}

export interface LegalHoldRecord {
  id: string;
  name: string;
  description: string;
  scope: 'DOCUMENT' | 'STUDENT' | 'EMPLOYEE' | 'VENDOR' | 'ORGANIZATION';
  target_id: string;
  status: 'ACTIVE' | 'RELEASED' | 'CANCELLED';
  start_date: string;
  end_date?: string;
  created_by: string;
  released_by?: string;
  released_at?: string;
  justification: string;
}

export interface DocumentRetentionQueueItem {
  id: string;
  document_id: string;
  document_type_code: string;
  owner_type: string;
  owner_id: string;
  policy_id: string;
  retention_start_date: string;
  retention_end_date: string;
  is_legal_hold: boolean;
  action_required: ActionAfterRetention;
  status: RetentionQueueStatus;
  storage_tier: 'HOT' | 'WARM' | 'ARCHIVE';
}

export interface DocumentDisposalCertificateRecord {
  id: string;
  document_id: string;
  document_title: string;
  owner_id: string;
  policy_id: string;
  disposed_by: string;
  approved_by: string;
  disposal_date: string;
  storage_tier_removed: string;
  justification: string;
}

export interface DocumentRetentionDashboardMetrics {
  totalUnderRetention: number;
  upcomingReviewsCount: number;
  dueForReviewCount: number;
  activeLegalHoldsCount: number;
  archivedDocumentsCount: number;
  disposalPendingCount: number;
  disposedDocumentsCount: number;
}

class DocumentRetentionGovernanceService {
  private static instance: DocumentRetentionGovernanceService;

  private policies: RetentionPolicyRecord[] = [
    {
      id: 'pol-stu-academic',
      code: 'RET_STU_ACADEMIC_PERM',
      name: 'Permanent Student Academic Dossier Retention',
      description: 'Permanent retention for degree transcripts, marksheets, and migration certificates',
      retention_period: 99,
      retention_unit: 'PERMANENT',
      retention_start_event: 'STUDENT_GRADUATION',
      action_after_retention: 'PERMANENT_RETENTION',
      review_required: false,
      legal_hold_supported: true,
      status: 'ACTIVE'
    },
    {
      id: 'pol-fin-invoice',
      code: 'RET_FIN_INVOICE_8YR',
      name: 'Statutory 8-Year Financial Ledger & Invoice Retention',
      description: 'Statutory compliance retention for taxation and audit fee receipts',
      retention_period: 8,
      retention_unit: 'YEARS',
      retention_start_event: 'DOCUMENT_CREATED',
      action_after_retention: 'ARCHIVE',
      review_required: true,
      legal_hold_supported: true,
      status: 'ACTIVE'
    },
    {
      id: 'pol-temp-admin',
      code: 'RET_TEMP_ADMIN_1YR',
      name: '1-Year Temporary Administrative File Retention',
      description: 'Short-term retention for gate passes, temporary undertaking notes',
      retention_period: 1,
      retention_unit: 'YEARS',
      retention_start_event: 'DOCUMENT_CREATED',
      action_after_retention: 'DELETE',
      review_required: true,
      legal_hold_supported: true,
      status: 'ACTIVE'
    }
  ];

  private legalHolds: LegalHoldRecord[] = [];
  private retentionQueue: DocumentRetentionQueueItem[] = [];
  private disposalCertificates: DocumentDisposalCertificateRecord[] = [];

  private constructor() {
    this.seedRetentionData();
  }

  public static getInstance(): DocumentRetentionGovernanceService {
    if (!DocumentRetentionGovernanceService.instance) {
      DocumentRetentionGovernanceService.instance = new DocumentRetentionGovernanceService();
    }
    return DocumentRetentionGovernanceService.instance;
  }

  private seedRetentionData(): void {
    this.retentionQueue.push({
      id: 'ret-q-001',
      document_id: 'dms-doc-001',
      document_type_code: 'DOC_AADHAAR',
      owner_type: 'STUDENT',
      owner_id: 'STU-2026-000001',
      policy_id: 'pol-stu-academic',
      retention_start_date: '2026-04-10',
      retention_end_date: '2099-12-31',
      is_legal_hold: false,
      action_required: 'PERMANENT_RETENTION',
      status: 'ACTIVE',
      storage_tier: 'HOT'
    });
  }

  // ─── RETENTION CALCULATION & QUEUE ENGINE ────────────────────────────

  public calculateRetentionEndDate(startDate: string, policy: RetentionPolicyRecord): string {
    if (policy.retention_unit === 'PERMANENT') return '2099-12-31';

    const start = new Date(startDate);
    const result = new Date(start);

    if (policy.retention_unit === 'DAYS') {
      result.setDate(result.getDate() + policy.retention_period);
    } else if (policy.retention_unit === 'MONTHS') {
      result.setMonth(result.getMonth() + policy.retention_period);
    } else if (policy.retention_unit === 'YEARS') {
      result.setFullYear(result.getFullYear() + policy.retention_period);
    }

    return result.toISOString().split('T')[0];
  }

  public registerDocumentRetention(params: {
    documentId: string;
    documentTypeCode: string;
    ownerType: string;
    ownerId: string;
    policyCode: string;
    startDate?: string;
  }): DocumentRetentionQueueItem {
    const policy = this.policies.find(p => p.code === params.policyCode) || this.policies[0];
    const startDate = params.startDate || new Date().toISOString().split('T')[0];
    const endDate = this.calculateRetentionEndDate(startDate, policy);

    const item: DocumentRetentionQueueItem = {
      id: `ret-q-${Date.now()}`,
      document_id: params.documentId,
      document_type_code: params.documentTypeCode,
      owner_type: params.ownerType,
      owner_id: params.ownerId,
      policy_id: policy.id,
      retention_start_date: startDate,
      retention_end_date: endDate,
      is_legal_hold: false,
      action_required: policy.action_after_retention,
      status: 'ACTIVE',
      storage_tier: 'HOT'
    };

    this.retentionQueue.push(item);
    return item;
  }

  // ─── LEGAL HOLD GOVERNANCE ───────────────────────────────────────────

  public applyLegalHold(params: {
    name: string;
    description: string;
    scope: 'DOCUMENT' | 'STUDENT' | 'EMPLOYEE' | 'VENDOR' | 'ORGANIZATION';
    targetId: string;
    createdBy: string;
    justification: string;
  }): LegalHoldRecord {
    if (!params.justification || params.justification.trim().length === 0) {
      throw new Error('Mandatory justification required to place entity under Legal Hold');
    }

    const hold: LegalHoldRecord = {
      id: `hold-${Date.now()}`,
      name: params.name,
      description: params.description,
      scope: params.scope,
      target_id: params.targetId,
      status: 'ACTIVE',
      start_date: new Date().toISOString(),
      created_by: params.createdBy,
      justification: params.justification
    };

    this.legalHolds.push(hold);

    // Update affected retention queue items
    this.retentionQueue.forEach(item => {
      if (item.document_id === params.targetId || item.owner_id === params.targetId) {
        item.is_legal_hold = true;
        item.status = 'ON_HOLD';
      }
    });

    return hold;
  }

  public releaseLegalHold(holdId: string, releasedBy: string, justification: string): LegalHoldRecord {
    if (!justification || justification.trim().length === 0) {
      throw new Error('Mandatory justification required to release Legal Hold');
    }

    const hold = this.legalHolds.find(h => h.id === holdId);
    if (!hold) throw new Error(`Legal hold ${holdId} not found`);

    hold.status = 'RELEASED';
    hold.released_by = releasedBy;
    hold.released_at = new Date().toISOString();

    // Check remaining active holds
    this.retentionQueue.forEach(item => {
      const activeHolds = this.legalHolds.filter(
        h => h.status === 'ACTIVE' && (h.target_id === item.document_id || h.target_id === item.owner_id)
      );
      if (activeHolds.length === 0) {
        item.is_legal_hold = false;
        item.status = 'ACTIVE';
      }
    });

    return hold;
  }

  // ─── ARCHIVAL & RESTORE LIFECYCLE ────────────────────────────────────

  public archiveDocument(documentId: string, userId: string, reason: string): DocumentRetentionQueueItem {
    const item = this.retentionQueue.find(q => q.document_id === documentId);
    if (!item) throw new Error(`Retention item for document ${documentId} not found`);

    if (item.is_legal_hold) {
      throw new Error('Legal Hold Protection: Archiving blocked due to active Legal Hold');
    }

    item.status = 'ARCHIVED';
    item.storage_tier = 'ARCHIVE';

    // Update central DMS status
    const dms = centralDocumentManagementService as any;
    const doc = dms.documents?.find((d: any) => d.id === documentId);
    if (doc) {
      doc.status = 'ARCHIVED';
      doc.updated_at = new Date().toISOString();
    }

    return item;
  }

  public restoreDocument(documentId: string, userId: string, reason: string): DocumentRetentionQueueItem {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Mandatory reason required to restore archived document');
    }

    const item = this.retentionQueue.find(q => q.document_id === documentId);
    if (!item) throw new Error(`Retention item for document ${documentId} not found`);

    item.status = 'ACTIVE';
    item.storage_tier = 'HOT';

    const dms = centralDocumentManagementService as any;
    const doc = dms.documents?.find((d: any) => d.id === documentId);
    if (doc) {
      doc.status = 'ACTIVE';
      doc.updated_at = new Date().toISOString();
    }

    return item;
  }

  // ─── CONTROLLED DISPOSAL ENGINE ──────────────────────────────────────

  public executeDocumentDisposal(params: {
    documentId: string;
    approvedBy: string;
    executorId: string;
    justification: string;
  }): DocumentDisposalCertificateRecord {
    if (!params.justification || params.justification.trim().length === 0) {
      throw new Error('Mandatory justification required to execute document disposal');
    }

    const item = this.retentionQueue.find(q => q.document_id === params.documentId);
    if (!item) throw new Error(`Retention item for document ${params.documentId} not found`);

    if (item.is_legal_hold) {
      throw new Error('Legal Hold Violation: Disposal strictly blocked for documents under Legal Hold');
    }

    item.status = 'DISPOSED';
    item.storage_tier = 'ARCHIVE';

    const cert: DocumentDisposalCertificateRecord = {
      id: `cert-disp-${Date.now()}`,
      document_id: params.documentId,
      document_title: `Disposed Document ${params.documentId}`,
      owner_id: item.owner_id,
      policy_id: item.policy_id,
      disposed_by: params.executorId,
      approved_by: params.approvedBy,
      disposal_date: new Date().toISOString(),
      storage_tier_removed: 'PHYSICAL_STORAGE_PURGED',
      justification: params.justification
    };

    this.disposalCertificates.push(cert);

    const dms = centralDocumentManagementService as any;
    const doc = dms.documents?.find((d: any) => d.id === params.documentId);
    if (doc) {
      doc.status = 'DELETED';
      doc.updated_at = new Date().toISOString();
    }

    return cert;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getRetentionDashboardMetrics(context?: UserAuthorizationContext): DocumentRetentionDashboardMetrics {
    const totalUnderRetention = this.retentionQueue.filter(q => q.status !== 'DISPOSED').length;
    const upcomingReviewsCount = this.retentionQueue.filter(q => q.status === 'UPCOMING').length;
    const dueForReviewCount = this.retentionQueue.filter(q => q.status === 'DUE_FOR_REVIEW').length;
    const activeLegalHoldsCount = this.legalHolds.filter(h => h.status === 'ACTIVE').length;
    const archivedDocumentsCount = this.retentionQueue.filter(q => q.status === 'ARCHIVED').length;
    const disposalPendingCount = this.retentionQueue.filter(q => q.status === 'DISPOSAL_PENDING').length;
    const disposedDocumentsCount = this.retentionQueue.filter(q => q.status === 'DISPOSED').length;

    return {
      totalUnderRetention,
      upcomingReviewsCount,
      dueForReviewCount,
      activeLegalHoldsCount,
      archivedDocumentsCount,
      disposalPendingCount,
      disposedDocumentsCount
    };
  }
}

export const documentRetentionGovernanceService = DocumentRetentionGovernanceService.getInstance();
