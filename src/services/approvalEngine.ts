import { 
  ApprovalRequest, ApprovalStatus, ApprovalRequestCategory, ApprovalOfficeType, 
  WorkflowModuleSource, WorkflowStageStep, ApprovalWorkflowConfig, ApprovalDashboardStats,
  User, UserRole, ApprovalRemarkHistory, ApprovalPriority, ApprovalAttachment
} from '../types';
import { db } from './db';
import { canUserAccessApprovalCategory } from './securityService';

/**
 * Pre-configured University Approval Workflow Templates
 */
export const DEFAULT_APPROVAL_WORKFLOW_CONFIGS: ApprovalWorkflowConfig[] = [
  {
    id: 'wf-academic-multi',
    name: 'Multi-Stage Academic & Proposal Workflow',
    description: '4-Stage approval sequence: Department HOD -> Principal -> Registrar -> University Admin',
    category: 'RESEARCH_GRANT',
    moduleSource: 'GENERAL_REQUEST',
    stages: [
      { stageIndex: 0, stageName: 'Department HOD Recommendation', requiredRole: 'HOD', requiredOffice: 'HOD_ACADEMIC' },
      { stageIndex: 1, stageName: 'Principal Institutional Sanction', requiredRole: 'PRINCIPAL', requiredOffice: 'UNIVERSITY_ADMIN' },
      { stageIndex: 2, stageName: 'Registrar Official Verification', requiredRole: 'REGISTRAR', requiredOffice: 'REGISTRAR' },
      { stageIndex: 3, stageName: 'Executive Vice Chancellor Sanction', requiredRole: 'UNIVERSITY_ADMIN', requiredOffice: 'UNIVERSITY_ADMIN' }
    ],
    isActive: true
  },
  {
    id: 'wf-student-certificates',
    name: 'Student Certificate Issuance Workflow',
    description: '2-Stage verification: Student Section Verification -> Registrar Attestation',
    category: 'BONAFIDE_CERTIFICATE',
    moduleSource: 'GENERAL_REQUEST',
    stages: [
      { stageIndex: 0, stageName: 'Student Section Record Verification', requiredRole: 'STUDENT_SECTION', requiredOffice: 'STUDENT_SECTION' },
      { stageIndex: 1, stageName: 'Registrar Digital Sign & Attestation', requiredRole: 'REGISTRAR', requiredOffice: 'REGISTRAR' }
    ],
    isActive: true
  },
  {
    id: 'wf-fee-concession',
    name: 'Fee Concession & Scholarship Clearance',
    description: '3-Stage financial review: Student Section -> Finance Cell -> Registrar',
    category: 'FEE_CONCESSION',
    moduleSource: 'FINANCE',
    stages: [
      { stageIndex: 0, stageName: 'Eligibility & Document Audit', requiredRole: 'STUDENT_SECTION', requiredOffice: 'STUDENT_SECTION' },
      { stageIndex: 1, stageName: 'Finance Cell Budget & Ledger Clearance', requiredRole: 'FINANCE_CELL', requiredOffice: 'FINANCE_CELL' },
      { stageIndex: 2, stageName: 'Registrar Final Approval', requiredRole: 'REGISTRAR', requiredOffice: 'REGISTRAR' }
    ],
    isActive: true
  },
  {
    id: 'wf-hostel-nodues',
    name: 'Hostel No-Dues & Clearance Workflow',
    description: '3-Stage clearance: Hostel Warden -> Finance Cell -> Student Section',
    category: 'HOSTEL_NO_DUES',
    moduleSource: 'HOSTEL',
    stages: [
      { stageIndex: 0, stageName: 'Hostel Warden Room & Facility Clearance', requiredRole: 'HOSTEL_ADMIN', requiredOffice: 'HOSTEL_ADMIN' },
      { stageIndex: 1, stageName: 'Finance Mess & Caution Deposit Audit', requiredRole: 'FINANCE_CELL', requiredOffice: 'FINANCE_CELL' },
      { stageIndex: 2, stageName: 'Student Section Clearance Certificate', requiredRole: 'STUDENT_SECTION', requiredOffice: 'STUDENT_SECTION' }
    ],
    isActive: true
  },
  {
    id: 'wf-exam-reeval',
    name: 'Examination Answer Script Re-evaluation Workflow',
    description: '2-Stage review: Exam Cell Evaluation Coordinator -> Exam Controller',
    category: 'RE_EVALUATION',
    moduleSource: 'GENERAL_REQUEST',
    stages: [
      { stageIndex: 0, stageName: 'Exam Cell Script Assignment', requiredRole: 'EXAM_CELL', requiredOffice: 'EXAM_CELL' },
      { stageIndex: 1, stageName: 'Controller of Examinations Final Approval', requiredRole: 'REGISTRAR', requiredOffice: 'EXAM_CELL' }
    ],
    isActive: true
  },
  {
    id: 'wf-campus-maintenance',
    name: 'Campus Auxiliary & Estate Maintenance Approval',
    description: '2-Stage estate workflow: Maintenance Office Estimate -> Finance Cell Allocation',
    category: 'INFRASTRUCTURE_MAINTENANCE',
    moduleSource: 'CAMPUS_SERVICE',
    stages: [
      { stageIndex: 0, stageName: 'Estate Maintenance Technical Inspection', requiredRole: 'MAINTENANCE_ADMIN', requiredOffice: 'MAINTENANCE_ADMIN' },
      { stageIndex: 1, stageName: 'Finance Sanction & Work Order Release', requiredRole: 'FINANCE_CELL', requiredOffice: 'FINANCE_CELL' }
    ],
    isActive: true
  }
];

class CentralApprovalWorkflowEngine {
  /**
   * Resolve default workflow stages for a given category & module
   */
  public resolveWorkflowStages(
    category: ApprovalRequestCategory,
    targetOffice: ApprovalOfficeType,
    moduleSource?: WorkflowModuleSource
  ): { workflowConfigId: string; stages: WorkflowStageStep[] } {
    let matchedConfig = DEFAULT_APPROVAL_WORKFLOW_CONFIGS.find(
      c => c.isActive && (c.category === category || (moduleSource && c.moduleSource === moduleSource))
    );

    if (!matchedConfig) {
      // Default single-office or direct 2-stage fallback
      matchedConfig = {
        id: `wf-direct-${targetOffice.toLowerCase()}`,
        name: `Direct Desk Approval — ${targetOffice}`,
        category,
        moduleSource: moduleSource || 'GENERAL_REQUEST',
        stages: [
          {
            stageIndex: 0,
            stageName: `${targetOffice.replace(/_/g, ' ')} Review & Action`,
            requiredRole: (targetOffice as any),
            requiredOffice: targetOffice
          }
        ],
        isActive: true
      };
    }

    const stages: WorkflowStageStep[] = matchedConfig.stages.map((st, idx) => ({
      stageIndex: idx,
      stageName: st.stageName,
      requiredRole: st.requiredRole,
      requiredOffice: st.requiredOffice,
      status: idx === 0 ? 'PENDING' : 'PENDING'
    }));

    return {
      workflowConfigId: matchedConfig.id,
      stages
    };
  }

  /**
   * Get Approval Inbox: requests awaiting the logged-in user's direct review/action
   */
  public getApprovalInbox(user?: User | null, role?: UserRole | null): ApprovalRequest[] {
    if (!user || !role) return [];

    // Students have no approval inbox (applicants only)
    if (role === 'STUDENT') return [];

    const allRequests = db.getScopedApprovalRequests(user, role);

    return allRequests.filter(req => {
      // Completed, rejected or draft requests are not in pending inbox
      if (req.status === 'APPROVED' || req.status === 'REJECTED' || req.status === 'WITHDRAWN' || req.status === 'DRAFT') {
        return false;
      }

      return this.canUserActOnRequest(req, user, role);
    });
  }

  /**
   * Check if a user is authorized to execute an action on a specific request right now
   */
  public canUserActOnRequest(req: ApprovalRequest, user?: User | null, role?: UserRole | null): boolean {
    if (!user || !role || role === 'STUDENT') return false;

    // Super Admin, University Admin & Registrar can act on any active request under university governance
    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR') {
      return req.status === 'PENDING' || req.status === 'UNDER_REVIEW' || req.status === 'FORWARDED' || req.status === 'SUBMITTED' || req.status === 'RETURNED';
    }

    // Check Multi-Stage hierarchy if defined
    if (req.stages && req.stages.length > 0 && req.currentStageIndex !== undefined) {
      const currentStage = req.stages[req.currentStageIndex];
      if (currentStage) {
        // Role match
        if (currentStage.requiredRole === role) {
          if (role === 'HOD' && user.departmentId && req.departmentId && user.departmentId !== req.departmentId) {
            return false; // HOD can only act on their department
          }
          if (role === 'PRINCIPAL' && user.instituteId && req.instituteId && user.instituteId !== req.instituteId) {
            return false;
          }
          return true;
        }

        // Office match
        if (currentStage.requiredOffice && this.isUserInOffice(role, currentStage.requiredOffice)) {
          return true;
        }
      }
    }

    // Direct Office custodian match
    if (req.currentOffice && this.isUserInOffice(role, req.currentOffice)) {
      if (role === 'HOD' && user.departmentId && req.departmentId && user.departmentId !== req.departmentId) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Office-to-Role mapping helper
   */
  private isUserInOffice(role: UserRole, office: ApprovalOfficeType): boolean {
    switch (office) {
      case 'REGISTRAR': return role === 'REGISTRAR';
      case 'IQAC': return role === 'IQAC';
      case 'EXAM_CELL': return role === 'EXAM_CELL';
      case 'STUDENT_SECTION': return role === 'STUDENT_SECTION';
      case 'HOSTEL_ADMIN': return role === 'HOSTEL_ADMIN';
      case 'LIBRARY_ADMIN': return role === 'LIBRARY_ADMIN';
      case 'TRANSPORT_ADMIN': return role === 'TRANSPORT_ADMIN';
      case 'MAINTENANCE_ADMIN': return role === 'MAINTENANCE_ADMIN';
      case 'HOD_ACADEMIC': return role === 'HOD';
      case 'FINANCE_CELL': return (role as string) === 'FINANCE_CELL' || role === 'REGISTRAR' || role === 'SUPER_ADMIN';
      case 'UNIVERSITY_ADMIN': return role === 'UNIVERSITY_ADMIN' || role === 'SUPER_ADMIN' || role === 'PRINCIPAL';
      default: return false;
    }
  }

  /**
   * Execute Approval / Rejection / Return Action
   */
  public executeApprovalAction(
    requestId: string,
    action: 'APPROVED' | 'REJECTED' | 'RETURNED' | 'FORWARDED' | 'CHANGES_REQUESTED' | 'UNDER_REVIEW',
    remarks: string,
    user: User,
    role: UserRole,
    options?: {
      forwardOffice?: ApprovalOfficeType;
    }
  ): ApprovalRequest {
    const req = db.getApprovalRequestById(requestId, user, role);
    if (!req) {
      throw new Error(`403 Forbidden: Request "${requestId}" not found or unauthorized.`);
    }

    if (!this.canUserActOnRequest(req, user, role)) {
      db.logAudit(
        'UNAUTHORIZED_APPROVAL_ATTEMPT',
        'Digital Approval Engine',
        `403 Forbidden: User "${user.name}" (${role}) attempted unauthorized action "${action}" on Request ${req.requestNo}`,
        user.name,
        role
      );
      throw new Error(`403 Forbidden: User "${user.name}" (${role}) is not authorized to act on request ${req.requestNo} at the current stage.`);
    }

    // Enforce mandatory remarks for REJECTED and RETURNED
    if ((action === 'REJECTED' || action === 'RETURNED' || action === 'CHANGES_REQUESTED') && (!remarks || !remarks.trim())) {
      throw new Error(`Mandatory comments are required when rejecting or returning an approval request.`);
    }

    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleString();

    // Ensure stages array exists
    if (!req.stages || req.stages.length === 0) {
      const resolved = this.resolveWorkflowStages(req.category, req.targetOffice, req.moduleSource);
      req.workflowConfigId = resolved.workflowConfigId;
      req.stages = resolved.stages;
      req.currentStageIndex = 0;
      req.totalStages = req.stages.length;
    }

    const currentStageIdx = req.currentStageIndex || 0;
    const currentStage = req.stages[currentStageIdx];

    let newStatus: ApprovalStatus = action === 'CHANGES_REQUESTED' ? 'RETURNED' : (action as ApprovalStatus);
    let nextOffice = req.currentOffice;

    if (action === 'APPROVED') {
      if (currentStage) {
        currentStage.status = 'APPROVED';
        currentStage.actionByUserId = user.id;
        currentStage.actionByUserName = user.name;
        currentStage.actionByUserRole = role;
        currentStage.actionAt = timestamp;
        currentStage.remarks = remarks.trim() || 'Approved';
      }

      const totalStages = req.stages.length;
      if (currentStageIdx < totalStages - 1) {
        // Multi-stage progression: Advance to next stage!
        req.currentStageIndex = currentStageIdx + 1;
        const nextStage = req.stages[req.currentStageIndex];
        nextStage.status = 'PENDING';
        if (nextStage.requiredOffice) {
          nextOffice = nextStage.requiredOffice;
        }
        newStatus = 'UNDER_REVIEW';

        // Notify next approver desk
        db.addNotification({
          title: `Approval Required: ${req.requestNo}`,
          message: `Request "${req.title}" approved by ${user.name} (${currentStage?.stageName || role}). Now pending your review at Stage ${req.currentStageIndex + 1}: ${nextStage.stageName}.`,
          module: 'SYSTEM',
          timestamp,
          linkTab: 'requests'
        });

        // Notify applicant of stage advancement
        db.addNotification({
          title: `Request Progress: ${req.requestNo}`,
          message: `Your request "${req.title}" passed Stage ${currentStageIdx + 1} (${currentStage?.stageName || role}) and is now under review at ${nextStage.stageName}.`,
          module: 'SYSTEM',
          timestamp,
          targetUserId: req.applicantId,
          linkTab: 'requests'
        });

      } else {
        // Final stage completed: Fully APPROVED!
        newStatus = 'APPROVED';
        req.completedAt = timestamp;

        db.addNotification({
          title: `Request Approved: ${req.requestNo}`,
          message: `Congratulations! Your request "${req.title}" has been fully APPROVED and sanctioned by ${user.name} (${role}).`,
          module: 'SYSTEM',
          timestamp,
          targetUserId: req.applicantId,
          linkTab: 'requests'
        });
      }

    } else if (action === 'REJECTED') {
      if (currentStage) {
        currentStage.status = 'REJECTED';
        currentStage.actionByUserId = user.id;
        currentStage.actionByUserName = user.name;
        currentStage.actionByUserRole = role;
        currentStage.actionAt = timestamp;
        currentStage.remarks = remarks.trim();
      }
      newStatus = 'REJECTED';
      req.completedAt = timestamp;

      db.addNotification({
        title: `Request Rejected: ${req.requestNo}`,
        message: `Your request "${req.title}" was rejected by ${user.name} (${role}). Reason: ${remarks.trim()}`,
        module: 'SYSTEM',
        timestamp,
        targetUserId: req.applicantId,
        linkTab: 'requests'
      });

    } else if (action === 'RETURNED' || action === 'CHANGES_REQUESTED') {
      if (currentStage) {
        currentStage.status = 'RETURNED';
        currentStage.actionByUserId = user.id;
        currentStage.actionByUserName = user.name;
        currentStage.actionByUserRole = role;
        currentStage.actionAt = timestamp;
        currentStage.remarks = remarks.trim();
      }
      newStatus = 'RETURNED';

      db.addNotification({
        title: `Action Required: ${req.requestNo} Returned`,
        message: `Your request "${req.title}" was returned for correction by ${user.name} (${role}). Comments: ${remarks.trim()}`,
        module: 'SYSTEM',
        timestamp,
        targetUserId: req.applicantId,
        linkTab: 'requests'
      });

    } else if (action === 'FORWARDED') {
      if (options?.forwardOffice) {
        nextOffice = options.forwardOffice;
      }
      newStatus = 'FORWARDED';

      db.addNotification({
        title: `Request Forwarded: ${req.requestNo}`,
        message: `Request "${req.title}" forwarded to ${nextOffice} by ${user.name} (${role}). Remarks: ${remarks.trim()}`,
        module: 'SYSTEM',
        timestamp,
        linkTab: 'requests'
      });
    } else if (action === 'UNDER_REVIEW') {
      newStatus = 'UNDER_REVIEW';
    }

    // Append to Remarks & Audit History
    const newRemark: ApprovalRemarkHistory = {
      id: `rem-${Date.now()}`,
      actionByUserId: user.id,
      actionByUserName: user.name,
      actionByUserRole: role,
      office: req.currentOffice,
      action: newStatus,
      remarks: remarks.trim() || `Status updated to ${newStatus}`,
      timestamp: formattedDate
    };

    req.remarksHistory = [...(req.remarksHistory || []), newRemark];
    req.status = newStatus;
    req.currentOffice = nextOffice;
    req.updatedAt = timestamp;

    // Update in database state
    db.updateApprovalRequestDirect(req);

    db.logAudit(
      'APPROVAL_WORKFLOW_DECISION',
      'Digital Approval Engine',
      `Recorded decision "${newStatus}" for ${req.requestNo} (${req.title}) by ${user.name} (${role})`,
      user.name,
      role
    );

    return req;
  }

  /**
   * Compute comprehensive dashboard stats
   */
  public getDashboardStats(user?: User | null, role?: UserRole | null): ApprovalDashboardStats {
    const all = db.getScopedApprovalRequests(user || null, role || null);
    const todayStr = new Date().toISOString().split('T')[0];

    let pendingApprovals = 0;
    let approvedToday = 0;
    let totalApproved = 0;
    let totalRejected = 0;
    let totalReturned = 0;
    let totalApprovalDurationMs = 0;
    let completedCount = 0;
    let submittedByMeCount = 0;

    all.forEach(req => {
      if (user && (req.applicantId === user.id || req.applicantEmail === user.email)) {
        submittedByMeCount++;
      }

      if (req.status === 'PENDING' || req.status === 'UNDER_REVIEW' || req.status === 'FORWARDED' || req.status === 'SUBMITTED') {
        pendingApprovals++;
      } else if (req.status === 'APPROVED') {
        totalApproved++;
        if (req.completedAt && req.completedAt.startsWith(todayStr)) {
          approvedToday++;
        }
      } else if (req.status === 'REJECTED') {
        totalRejected++;
      } else if (req.status === 'RETURNED' || req.status === 'CHANGES_REQUESTED') {
        totalReturned++;
      }

      if ((req.status === 'APPROVED' || req.status === 'REJECTED') && req.completedAt) {
        const start = new Date(req.createdAt).getTime();
        const end = new Date(req.completedAt).getTime();
        if (end > start) {
          totalApprovalDurationMs += (end - start);
          completedCount++;
        }
      }
    });

    const avgHours = completedCount > 0 
      ? Math.round((totalApprovalDurationMs / (completedCount * 3600000)) * 10) / 10 
      : 4.5;

    const avgDisplay = avgHours < 24 
      ? `${avgHours} hrs` 
      : `${Math.round((avgHours / 24) * 10) / 10} days`;

    const inbox = this.getApprovalInbox(user, role);

    return {
      pendingApprovals,
      approvedToday,
      totalApproved,
      totalRejected,
      totalReturned,
      averageApprovalTimeHours: avgHours,
      averageApprovalTimeDisplay: avgDisplay,
      inboxCount: inbox.length,
      submittedByMeCount,
      totalRequests: all.length
    };
  }

  /**
   * Reusable Module Integration Helper
   * Allows other ERP modules (Note Sheet, Campus Services, Admission, Finance, Hostel, Transport)
   * to submit a request into the centralized approval engine.
   */
  public submitModuleApprovalRequest(params: {
    moduleSource: WorkflowModuleSource;
    sourceEntityId?: string;
    category: ApprovalRequestCategory;
    title: string;
    description: string;
    priority?: ApprovalPriority;
    targetOffice: ApprovalOfficeType;
    amount?: number;
    financialEstimateSummary?: string;
    attachments?: ApprovalAttachment[];
    applicant: User;
    applicantRole?: UserRole;
  }): ApprovalRequest {
    const resolved = this.resolveWorkflowStages(params.category, params.targetOffice, params.moduleSource);

    return db.addApprovalRequest({
      moduleSource: params.moduleSource,
      sourceEntityId: params.sourceEntityId,
      category: params.category,
      title: params.title,
      description: params.description,
      priority: params.priority || 'MEDIUM',
      targetOffice: params.targetOffice,
      currentOffice: resolved.stages[0]?.requiredOffice || params.targetOffice,
      amount: params.amount,
      financialEstimateSummary: params.financialEstimateSummary,
      attachments: params.attachments || [],
      workflowConfigId: resolved.workflowConfigId,
      currentStageIndex: 0,
      totalStages: resolved.stages.length,
      stages: resolved.stages,
      status: 'PENDING',
      departmentId: params.applicant.departmentId,
      instituteId: params.applicant.instituteId
    }, 'Submitted to Centralized Digital Approval Workflow', params.applicant, params.applicantRole || params.applicant.role);
  }
}

export const approvalWorkflowEngine = new CentralApprovalWorkflowEngine();
