import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentTemplateService } from './centralDocumentTemplateService';

export type DocumentWorkflowStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_APPROVAL'
  | 'RETURNED'
  | 'REJECTED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DocumentWorkflowInstanceRecord {
  id: string;
  request_number: string;
  document_type_id: string;
  requester_type: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ADMIN';
  requester_id: string;
  requester_name: string;
  organization_id: string;
  department_id?: string;
  purpose: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: DocumentWorkflowStatus;
  current_step_number: number;
  total_steps: number;
  rejection_reason?: string;
  return_reason?: string;
  resubmission_count: number;
  request_payload: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

export interface DocumentApprovalStepRecord {
  id: string;
  workflow_instance_id: string;
  step_number: number;
  step_name: string;
  assigned_role: string;
  assigned_user_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED' | 'SKIPPED';
  sla_hours: number;
  due_date: string;
  started_at: string;
  completed_at?: string;
}

export interface DocumentApprovalActionRecord {
  id: string;
  step_id: string;
  workflow_instance_id: string;
  actor_id: string;
  actor_role: string;
  action: 'APPROVE' | 'REJECT' | 'RETURN' | 'RESUBMIT' | 'DELEGATE' | 'ESCALATE';
  comment: string;
  delegated_from?: string;
  delegated_to?: string;
  created_at: string;
}

export interface ApprovalDelegationRecord {
  id: string;
  original_approver_id: string;
  delegate_user_id: string;
  role: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface DocumentWorkflowDashboardMetrics {
  totalRequestsCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  returnedCount: number;
  rejectedCount: number;
  overdueCount: number;
  delegatedCount: number;
}

class CentralDocumentWorkflowService {
  private static instance: CentralDocumentWorkflowService;

  private instances: DocumentWorkflowInstanceRecord[] = [];
  private steps: DocumentApprovalStepRecord[] = [];
  private actions: DocumentApprovalActionRecord[] = [];
  private delegations: ApprovalDelegationRecord[] = [];
  private requestCounter = 100;

  private constructor() {
    this.seedDemoWorkflow();
  }

  public static getInstance(): CentralDocumentWorkflowService {
    if (!CentralDocumentWorkflowService.instance) {
      CentralDocumentWorkflowService.instance = new CentralDocumentWorkflowService();
    }
    return CentralDocumentWorkflowService.instance;
  }

  private seedDemoWorkflow(): void {
    const instanceId = 'wf-inst-001';
    this.instances.push({
      id: instanceId,
      request_number: 'REQ/2026/000001',
      document_type_id: 'DOC_BONAFIDE_CERT',
      requester_type: 'STUDENT',
      requester_id: 'STU-2026-000001',
      requester_name: 'Aarav Patel',
      organization_id: 'inst-sit',
      department_id: 'dept-cse',
      purpose: 'Passport Application Verification',
      priority: 'NORMAL',
      status: 'APPROVED',
      current_step_number: 2,
      total_steps: 2,
      resubmission_count: 0,
      request_payload: {
        student: { name: 'Aarav Patel', enrollment_no: 'SSIU-2026-001' },
        program: { name: 'B.Tech Computer Engineering' },
        issue_date: '2026-04-10'
      },
      started_at: '2026-04-10T09:00:00Z',
      completed_at: '2026-04-10T11:30:00Z'
    });

    this.steps.push(
      {
        id: 'step-001-1',
        workflow_instance_id: instanceId,
        step_number: 1,
        step_name: 'Student Section Verification',
        assigned_role: 'STUDENT_SECTION_OFFICER',
        assigned_user_id: 'emp-sec-001',
        status: 'APPROVED',
        sla_hours: 24,
        due_date: '2026-04-11T09:00:00Z',
        started_at: '2026-04-10T09:00:00Z',
        completed_at: '2026-04-10T10:15:00Z'
      },
      {
        id: 'step-001-2',
        workflow_instance_id: instanceId,
        step_number: 2,
        step_name: 'Registrar Approval & Sign',
        assigned_role: 'REGISTRAR',
        assigned_user_id: 'emp-reg-001',
        status: 'APPROVED',
        sla_hours: 48,
        due_date: '2026-04-12T09:00:00Z',
        started_at: '2026-04-10T10:15:00Z',
        completed_at: '2026-04-10T11:30:00Z'
      }
    );

    this.actions.push(
      {
        id: 'act-001',
        step_id: 'step-001-1',
        workflow_instance_id: instanceId,
        actor_id: 'emp-sec-001',
        actor_role: 'STUDENT_SECTION_OFFICER',
        action: 'APPROVE',
        comment: 'Verified active student status and fee clearance',
        created_at: '2026-04-10T10:15:00Z'
      },
      {
        id: 'act-002',
        step_id: 'step-001-2',
        workflow_instance_id: instanceId,
        actor_id: 'emp-reg-001',
        actor_role: 'REGISTRAR',
        action: 'APPROVE',
        comment: 'Approved official bonafide issue',
        created_at: '2026-04-10T11:30:00Z'
      }
    );
  }

  // ─── START DOCUMENT WORKFLOW REQUEST ─────────────────────────────────

  public startDocumentRequestWorkflow(params: {
    documentTypeId: string;
    requesterType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ADMIN';
    requesterId: string;
    requesterName: string;
    organizationId: string;
    departmentId?: string;
    purpose: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    payload: Record<string, any>;
    customSteps?: Array<{ stepName: string; assignedRole: string; assignedUserId?: string; slaHours?: number }>;
    context?: UserAuthorizationContext;
  }): DocumentWorkflowInstanceRecord {
    this.requestCounter += 1;
    const requestNumber = `REQ/2026/${String(this.requestCounter).padStart(6, '0')}`;
    const instanceId = `wf-inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const defaultSteps = params.customSteps || [
      { stepName: 'Department / Section Verification', assignedRole: 'STUDENT_SECTION_OFFICER', slaHours: 24 },
      { stepName: 'Authority Approval', assignedRole: 'REGISTRAR', assignedUserId: 'emp-reg-001', slaHours: 48 }
    ];

    const instance: DocumentWorkflowInstanceRecord = {
      id: instanceId,
      request_number: requestNumber,
      document_type_id: params.documentTypeId,
      requester_type: params.requesterType,
      requester_id: params.requesterId,
      requester_name: params.requesterName,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      purpose: params.purpose,
      priority: params.priority || 'NORMAL',
      status: 'PENDING_APPROVAL',
      current_step_number: 1,
      total_steps: defaultSteps.length,
      resubmission_count: 0,
      request_payload: params.payload,
      started_at: new Date().toISOString()
    };

    this.instances.push(instance);

    // Initialize Approval Steps
    defaultSteps.forEach((s, idx) => {
      const stepNumber = idx + 1;
      const sla = s.slaHours || 24;
      const dueDate = new Date(Date.now() + sla * 3600 * 1000).toISOString();

      this.steps.push({
        id: `step-${instanceId}-${stepNumber}`,
        workflow_instance_id: instanceId,
        step_number: stepNumber,
        step_name: s.stepName,
        assigned_role: s.assignedRole,
        assigned_user_id: s.assignedUserId,
        status: stepNumber === 1 ? 'PENDING' : 'SKIPPED',
        sla_hours: sla,
        due_date: dueDate,
        started_at: new Date().toISOString()
      });
    });

    return instance;
  }

  // ─── PROCESS APPROVAL STEP ───────────────────────────────────────────

  public approveStep(params: {
    instanceId: string;
    approver: UserAuthorizationContext;
    comment?: string;
  }): { instance: DocumentWorkflowInstanceRecord; completedStep: DocumentApprovalStepRecord; isWorkflowCompleted: boolean } {
    const instance = this.instances.find(i => i.id === params.instanceId);
    if (!instance) throw new Error(`Workflow instance ${params.instanceId} not found`);

    if (instance.status !== 'PENDING_APPROVAL' && instance.status !== 'UNDER_REVIEW') {
      throw new Error(`Cannot approve workflow: Current status is ${instance.status}`);
    }

    // Separation of Duties: Requester cannot approve own document
    if (instance.requester_id === params.approver.userId) {
      throw new Error('Separation of Duties Violation: Requester cannot approve their own document request');
    }

    const currentStep = this.steps.find(
      s => s.workflow_instance_id === instance.id && s.step_number === instance.current_step_number
    );
    if (!currentStep) throw new Error(`Current approval step ${instance.current_step_number} not found`);

    // Check Active Delegation
    const activeDelegation = this.delegations.find(
      d => d.original_approver_id === currentStep.assigned_user_id &&
           d.delegate_user_id === params.approver.userId &&
           d.status === 'ACTIVE'
    );

    // Validate Approver Authorization (Assigned User OR Role Match OR Active Delegation)
    const isAuthorized = 
      (currentStep.assigned_user_id && currentStep.assigned_user_id === params.approver.userId) ||
      params.approver.assignedRoles.includes(currentStep.assigned_role) ||
      params.approver.permissions.includes('WORKFLOW_ADMIN') ||
      Boolean(activeDelegation);

    if (!isAuthorized) {
      throw new Error(`Unauthorized Approver: User does not hold assigned role ${currentStep.assigned_role}`);
    }

    currentStep.status = 'APPROVED';
    currentStep.completed_at = new Date().toISOString();

    this.actions.push({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      step_id: currentStep.id,
      workflow_instance_id: instance.id,
      actor_id: params.approver.userId,
      actor_role: params.approver.activeRole,
      action: 'APPROVE',
      comment: params.comment || 'Approved',
      delegated_from: activeDelegation ? activeDelegation.original_approver_id : undefined,
      created_at: new Date().toISOString()
    });

    let isWorkflowCompleted = false;

    // Check if next step exists
    if (instance.current_step_number < instance.total_steps) {
      instance.current_step_number += 1;
      const nextStep = this.steps.find(
        s => s.workflow_instance_id === instance.id && s.step_number === instance.current_step_number
      );
      if (nextStep) {
        nextStep.status = 'PENDING';
        nextStep.started_at = new Date().toISOString();
      }
    } else {
      // Final Approval Reached -> Complete Workflow & Auto-Generate Document via Phase 13.17
      instance.status = 'APPROVED';
      instance.completed_at = new Date().toISOString();
      isWorkflowCompleted = true;

      // Downstream Document Generation
      if (instance.document_type_id === 'DOC_BONAFIDE_CERT') {
        try {
          centralDocumentTemplateService.generateOfficialDocument({
            templateCode: 'BONAFIDE_CERTIFICATE',
            entityType: instance.requester_type,
            entityId: instance.requester_id,
            data: instance.request_payload,
            generatedBy: params.approver.userId,
            context: params.approver
          });
        } catch {
          // Downstream generation handled gracefully
        }
      }
    }

    return { instance, completedStep: currentStep, isWorkflowCompleted };
  }

  // ─── REJECT WORKFLOW STEP ────────────────────────────────────────────

  public rejectStep(params: {
    instanceId: string;
    approver: UserAuthorizationContext;
    reason: string;
  }): DocumentWorkflowInstanceRecord {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Mandatory rejection reason required to reject a document request');
    }

    const instance = this.instances.find(i => i.id === params.instanceId);
    if (!instance) throw new Error(`Workflow instance ${params.instanceId} not found`);

    const currentStep = this.steps.find(
      s => s.workflow_instance_id === instance.id && s.step_number === instance.current_step_number
    );
    if (currentStep) {
      currentStep.status = 'REJECTED';
      currentStep.completed_at = new Date().toISOString();
    }

    instance.status = 'REJECTED';
    instance.rejection_reason = params.reason;
    instance.completed_at = new Date().toISOString();

    this.actions.push({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      step_id: currentStep?.id || 'none',
      workflow_instance_id: instance.id,
      actor_id: params.approver.userId,
      actor_role: params.approver.activeRole,
      action: 'REJECT',
      comment: params.reason,
      created_at: new Date().toISOString()
    });

    return instance;
  }

  // ─── RETURN FOR CORRECTION & RESUBMIT ──────────────────────────────────

  public returnForCorrection(params: {
    instanceId: string;
    approver: UserAuthorizationContext;
    correctionReason: string;
  }): DocumentWorkflowInstanceRecord {
    if (!params.correctionReason || params.correctionReason.trim().length === 0) {
      throw new Error('Mandatory correction reason required to return a document request');
    }

    const instance = this.instances.find(i => i.id === params.instanceId);
    if (!instance) throw new Error(`Workflow instance ${params.instanceId} not found`);

    instance.status = 'RETURNED';
    instance.return_reason = params.correctionReason;

    const currentStep = this.steps.find(
      s => s.workflow_instance_id === instance.id && s.step_number === instance.current_step_number
    );
    if (currentStep) {
      currentStep.status = 'RETURNED';
    }

    this.actions.push({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      step_id: currentStep?.id || 'none',
      workflow_instance_id: instance.id,
      actor_id: params.approver.userId,
      actor_role: params.approver.activeRole,
      action: 'RETURN',
      comment: params.correctionReason,
      created_at: new Date().toISOString()
    });

    return instance;
  }

  public resubmitRequest(params: {
    instanceId: string;
    requesterId: string;
    updatedPayload: Record<string, any>;
    resubmissionNotes?: string;
  }): DocumentWorkflowInstanceRecord {
    const instance = this.instances.find(i => i.id === params.instanceId);
    if (!instance) throw new Error(`Workflow instance ${params.instanceId} not found`);

    if (instance.status !== 'RETURNED') {
      throw new Error(`Cannot resubmit request: Current status is ${instance.status}`);
    }

    instance.status = 'PENDING_APPROVAL';
    instance.resubmission_count += 1;
    instance.request_payload = { ...instance.request_payload, ...params.updatedPayload };
    instance.current_step_number = 1; // Restart at verification level 1

    // Reset Steps
    this.steps
      .filter(s => s.workflow_instance_id === instance.id)
      .forEach(s => {
        s.status = s.step_number === 1 ? 'PENDING' : 'SKIPPED';
        s.started_at = new Date().toISOString();
        s.completed_at = undefined;
      });

    this.actions.push({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      step_id: this.steps[0]?.id || 'step-1',
      workflow_instance_id: instance.id,
      actor_id: params.requesterId,
      actor_role: instance.requester_type,
      action: 'RESUBMIT',
      comment: params.resubmissionNotes || 'Corrected data and resubmitted for approval',
      created_at: new Date().toISOString()
    });

    return instance;
  }

  // ─── DELEGATION & ESCALATION ENGINE ───────────────────────────────────

  public delegateApproval(params: {
    originalApproverId: string;
    delegateUserId: string;
    role: string;
    reason: string;
    startDate: string;
    endDate: string;
  }): ApprovalDelegationRecord {
    if (params.originalApproverId === params.delegateUserId) {
      throw new Error('Self-Delegation Violation: Cannot delegate approval authority to yourself');
    }

    const delegation: ApprovalDelegationRecord = {
      id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      original_approver_id: params.originalApproverId,
      delegate_user_id: params.delegateUserId,
      role: params.role,
      reason: params.reason,
      start_date: params.startDate,
      end_date: params.endDate,
      status: 'ACTIVE'
    };

    this.delegations.push(delegation);
    return delegation;
  }

  public escalateWorkflow(params: {
    instanceId: string;
    escalatedBy: string;
    escalationReason: string;
  }): DocumentWorkflowInstanceRecord {
    const instance = this.instances.find(i => i.id === params.instanceId);
    if (!instance) throw new Error(`Workflow instance ${params.instanceId} not found`);

    const currentStep = this.steps.find(
      s => s.workflow_instance_id === instance.id && s.step_number === instance.current_step_number
    );
    if (currentStep) {
      currentStep.status = 'ESCALATED';
    }

    this.actions.push({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      step_id: currentStep?.id || 'none',
      workflow_instance_id: instance.id,
      actor_id: params.escalatedBy,
      actor_role: 'ADMIN',
      action: 'ESCALATE',
      comment: params.escalationReason,
      created_at: new Date().toISOString()
    });

    return instance;
  }

  // ─── QUERY WORKFLOW & TIMELINE ────────────────────────────────────────

  public getWorkflowTimeline(instanceId: string): {
    instance: DocumentWorkflowInstanceRecord | undefined;
    steps: DocumentApprovalStepRecord[];
    actions: DocumentApprovalActionRecord[];
  } {
    const instance = this.instances.find(i => i.id === instanceId);
    const steps = this.steps.filter(s => s.workflow_instance_id === instanceId);
    const actions = this.actions.filter(a => a.workflow_instance_id === instanceId);
    return { instance, steps, actions };
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getWorkflowDashboardMetrics(): DocumentWorkflowDashboardMetrics {
    const totalRequestsCount = this.instances.length;
    const pendingApprovalCount = this.instances.filter(i => i.status === 'PENDING_APPROVAL').length;
    const approvedCount = this.instances.filter(i => i.status === 'APPROVED').length;
    const returnedCount = this.instances.filter(i => i.status === 'RETURNED').length;
    const rejectedCount = this.instances.filter(i => i.status === 'REJECTED').length;
    const overdueCount = this.steps.filter(s => s.status === 'ESCALATED' || (s.status === 'PENDING' && new Date(s.due_date) < new Date())).length;
    const delegatedCount = this.delegations.filter(d => d.status === 'ACTIVE').length;

    return {
      totalRequestsCount,
      pendingApprovalCount,
      approvedCount,
      returnedCount,
      rejectedCount,
      overdueCount,
      delegatedCount
    };
  }
}

export const centralDocumentWorkflowService = CentralDocumentWorkflowService.getInstance();
