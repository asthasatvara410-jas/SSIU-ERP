import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord, DocumentValidityState } from './centralDocumentManagementService';

export type ReviewPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ChecklistItemStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WAIVED';

export type ChecklistOverallStatus =
  | 'INCOMPLETE'
  | 'PENDING_VERIFICATION'
  | 'COMPLETE'
  | 'WAIVED';

export interface DocumentChecklistItem {
  id: string;
  document_type_code: string;
  required: boolean;
  multiple_allowed: boolean;
  sequence: number;
  verification_required: boolean;
}

export interface DocumentChecklistRecord {
  id: string;
  name: string;
  code: string;
  organization_id: string;
  program_id?: string;
  status: 'ACTIVE' | 'INACTIVE';
  items: DocumentChecklistItem[];
}

export interface EntityChecklistAssignmentRecord {
  id: string;
  checklist_id: string;
  entity_type: 'STUDENT' | 'APPLICATION' | 'EMPLOYEE' | 'VENDOR';
  entity_id: string;
  program_id?: string;
  status: ChecklistOverallStatus;
  waivers: Record<string, { reason: string; waived_by: string; waived_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface DocumentReviewQueueItem {
  id: string;
  document_id: string;
  document_type_code: string;
  owner_type: string;
  owner_id: string;
  organization_id: string;
  submitted_date: string;
  priority: ReviewPriority;
  reviewer_id?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  locked_by?: string;
  locked_at?: string;
  due_date: string;
  is_overdue: boolean;
}

export interface DocumentApprovalWorkflowRecord {
  id: string;
  document_id: string;
  version_id: string;
  workflow_level: 'LEVEL_1_REVIEWER' | 'LEVEL_2_HOD' | 'LEVEL_3_REGISTRAR';
  approver_id: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  approved_at?: string;
}

export interface DocumentVerificationDashboardMetrics {
  pendingReviewCount: number;
  inReviewCount: number;
  overdueReviewCount: number;
  verifiedTodayCount: number;
  rejectedTodayCount: number;
  expiringSoonCount: number;
  activeChecklistsCount: number;
  completeChecklistsCount: number;
}

class DocumentVerificationApprovalService {
  private static instance: DocumentVerificationApprovalService;

  private checklists: DocumentChecklistRecord[] = [
    {
      id: 'chk-bca-001',
      name: 'BCA Undergraduate Student Admission Checklist',
      code: 'CHK_BCA_ADMISSION',
      organization_id: 'inst-sit',
      program_id: 'prog-bca',
      status: 'ACTIVE',
      items: [
        { id: 'item-01', document_type_code: 'DOC_AADHAAR', required: true, multiple_allowed: false, sequence: 1, verification_required: true },
        { id: 'item-02', document_type_code: 'DOC_MARKSHEET_10TH', required: true, multiple_allowed: false, sequence: 2, verification_required: true },
        { id: 'item-03', document_type_code: 'DOC_MARKSHEET_12TH', required: true, multiple_allowed: false, sequence: 3, verification_required: true },
        { id: 'item-04', document_type_code: 'DOC_MIGRATION_CERT', required: true, multiple_allowed: false, sequence: 4, verification_required: true }
      ]
    }
  ];

  private assignments: EntityChecklistAssignmentRecord[] = [
    {
      id: 'asgn-001',
      checklist_id: 'chk-bca-001',
      entity_type: 'STUDENT',
      entity_id: 'STU-2026-000001',
      program_id: 'prog-bca',
      status: 'PENDING_VERIFICATION',
      waivers: {},
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-15T11:00:00Z'
    }
  ];

  private reviewQueue: DocumentReviewQueueItem[] = [
    {
      id: 'queue-001',
      document_id: 'dms-doc-001',
      document_type_code: 'DOC_AADHAAR',
      owner_type: 'STUDENT',
      owner_id: 'STU-2026-000001',
      organization_id: 'inst-sit',
      submitted_date: '2026-04-10',
      priority: 'HIGH',
      status: 'VERIFIED',
      due_date: '2026-04-12',
      is_overdue: false
    }
  ];

  private workflows: DocumentApprovalWorkflowRecord[] = [];

  private constructor() {}

  public static getInstance(): DocumentVerificationApprovalService {
    if (!DocumentVerificationApprovalService.instance) {
      DocumentVerificationApprovalService.instance = new DocumentVerificationApprovalService();
    }
    return DocumentVerificationApprovalService.instance;
  }

  // ─── CHECKLIST ENGINE & COMPLETENESS CALCULATION ─────────────────────

  public evaluateChecklistProgress(
    entityId: string,
    programId?: string
  ): {
    assignment: EntityChecklistAssignmentRecord;
    checklist: DocumentChecklistRecord;
    totalRequired: number;
    satisfiedCount: number;
    completionPercentage: number;
    itemDetails: Array<{
      documentTypeCode: string;
      required: boolean;
      status: ChecklistItemStatus;
      isWaived: boolean;
      waiverReason?: string;
    }>;
  } {
    let assignment = this.assignments.find(a => a.entity_id === entityId);
    if (!assignment) {
      assignment = {
        id: `asgn-${Date.now()}`,
        checklist_id: 'chk-bca-001',
        entity_type: 'STUDENT',
        entity_id: entityId,
        program_id: programId || 'prog-bca',
        status: 'INCOMPLETE',
        waivers: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.assignments.push(assignment);
    }

    const checklist = this.checklists.find(c => c.id === assignment!.checklist_id) || this.checklists[0];

    const itemDetails: Array<{
      documentTypeCode: string;
      required: boolean;
      status: ChecklistItemStatus;
      isWaived: boolean;
      waiverReason?: string;
    }> = [];

    let satisfiedCount = 0;
    const totalRequired = checklist.items.filter(i => i.required).length;

    checklist.items.forEach(item => {
      const isWaived = Boolean(assignment!.waivers[item.document_type_code]);
      const waiverReason = assignment!.waivers[item.document_type_code]?.reason;

      let status: ChecklistItemStatus = 'NOT_SUBMITTED';

      if (isWaived) {
        status = 'WAIVED';
        satisfiedCount++;
      } else {
        // Look up central document status
        const dms = centralDocumentManagementService as any;
        const matchingDoc = dms.documents.find(
          (d: any) => d.owner_id === entityId && d.document_type_code === item.document_type_code && d.status !== 'DELETED'
        );

        if (matchingDoc) {
          if (matchingDoc.verification_status === 'VERIFIED') {
            status = 'VERIFIED';
            satisfiedCount++;
          } else if (matchingDoc.verification_status === 'REJECTED') {
            status = 'REJECTED';
          } else {
            status = 'PENDING_REVIEW';
          }
        }
      }

      itemDetails.push({
        documentTypeCode: item.document_type_code,
        required: item.required,
        status,
        isWaived,
        waiverReason
      });
    });

    const completionPercentage = totalRequired > 0 ? Math.round((satisfiedCount / totalRequired) * 100) : 100;
    assignment.status = completionPercentage === 100 ? 'COMPLETE' : 'INCOMPLETE';
    assignment.updated_at = new Date().toISOString();

    return {
      assignment,
      checklist,
      totalRequired,
      satisfiedCount,
      completionPercentage,
      itemDetails
    };
  }

  public waiveChecklistRequirement(params: {
    entityId: string;
    documentTypeCode: string;
    waivedBy: string;
    reason: string;
  }): EntityChecklistAssignmentRecord {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Mandatory justification reason required to waive document requirement');
    }

    let assignment = this.assignments.find(a => a.entity_id === params.entityId);
    if (!assignment) {
      assignment = {
        id: `asgn-${Date.now()}`,
        checklist_id: 'chk-bca-001',
        entity_type: 'STUDENT',
        entity_id: params.entityId,
        status: 'INCOMPLETE',
        waivers: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.assignments.push(assignment);
    }

    assignment.waivers[params.documentTypeCode] = {
      reason: params.reason,
      waived_by: params.waivedBy,
      waived_at: new Date().toISOString()
    };
    assignment.updated_at = new Date().toISOString();

    return assignment;
  }

  // ─── REVIEW QUEUE & REVIEWER LOCK GOVERNANCE ─────────────────────────

  public lockDocumentForReview(params: {
    queueItemId: string;
    reviewerId: string;
  }): DocumentReviewQueueItem {
    const item = this.reviewQueue.find(q => q.id === params.queueItemId);
    if (!item) throw new Error(`Review queue item ${params.queueItemId} not found`);

    if (item.locked_by && item.locked_by !== params.reviewerId) {
      throw new Error(`Review Lock: Document is currently being reviewed by ${item.locked_by}`);
    }

    item.locked_by = params.reviewerId;
    item.locked_at = new Date().toISOString();
    item.status = 'IN_REVIEW';
    return item;
  }

  public releaseReviewLock(queueItemId: string, reviewerId: string): DocumentReviewQueueItem {
    const item = this.reviewQueue.find(q => q.id === queueItemId);
    if (!item) throw new Error(`Review queue item ${queueItemId} not found`);

    if (item.locked_by === reviewerId) {
      item.locked_by = undefined;
      item.locked_at = undefined;
      item.status = 'PENDING';
    }

    return item;
  }

  // ─── MULTI-LEVEL APPROVAL WORKFLOW ENGINE ─────────────────────────────

  public initiateApprovalWorkflow(params: {
    documentId: string;
    versionId: string;
    level: 'LEVEL_1_REVIEWER' | 'LEVEL_2_HOD' | 'LEVEL_3_REGISTRAR';
    approverId: string;
  }): DocumentApprovalWorkflowRecord {
    const wf: DocumentApprovalWorkflowRecord = {
      id: `wf-${Date.now()}`,
      document_id: params.documentId,
      version_id: params.versionId,
      workflow_level: params.level,
      approver_id: params.approverId,
      approval_status: 'PENDING'
    };

    this.workflows.push(wf);
    return wf;
  }

  public approveWorkflowStep(workflowId: string, approverId: string, remarks?: string): DocumentApprovalWorkflowRecord {
    const wf = this.workflows.find(w => w.id === workflowId);
    if (!wf) throw new Error(`Approval workflow ${workflowId} not found`);

    wf.approval_status = 'APPROVED';
    wf.remarks = remarks;
    wf.approved_at = new Date().toISOString();
    return wf;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getVerificationDashboardMetrics(context?: UserAuthorizationContext): DocumentVerificationDashboardMetrics {
    const pendingReviewCount = this.reviewQueue.filter(q => q.status === 'PENDING').length;
    const inReviewCount = this.reviewQueue.filter(q => q.status === 'IN_REVIEW').length;
    const overdueReviewCount = this.reviewQueue.filter(q => q.is_overdue).length;

    const verifiedTodayCount = this.reviewQueue.filter(q => q.status === 'VERIFIED').length;
    const rejectedTodayCount = this.reviewQueue.filter(q => q.status === 'REJECTED').length;

    const expiringSoonCount = 1;
    const activeChecklistsCount = this.checklists.filter(c => c.status === 'ACTIVE').length;
    const completeChecklistsCount = this.assignments.filter(a => a.status === 'COMPLETE').length;

    return {
      pendingReviewCount,
      inReviewCount,
      overdueReviewCount,
      verifiedTodayCount,
      rejectedTodayCount,
      expiringSoonCount,
      activeChecklistsCount,
      completeChecklistsCount
    };
  }
}

export const documentVerificationApprovalService = DocumentVerificationApprovalService.getInstance();
