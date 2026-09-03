import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';

export type DocumentAction = 
  | 'VIEW'
  | 'PREVIEW'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'EDIT'
  | 'CREATE_VERSION'
  | 'DELETE_DRAFT'
  | 'VERIFY'
  | 'APPROVE'
  | 'PUBLISH'
  | 'SHARE'
  | 'PRINT'
  | 'EXPORT'
  | 'RESTORE'
  | 'DISPOSE';

export type DocumentClassification = 
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'HIGHLY_RESTRICTED';

export interface DocumentAccessGrantRecord {
  id: string;
  document_id: string;
  version_scope: 'ALL_VERSIONS' | 'CURRENT_VERSION' | 'SPECIFIC_VERSION';
  specific_version_id?: string;
  principal_type: 'USER' | 'ROLE' | 'DEPARTMENT' | 'ORGANIZATION';
  principal_id: string;
  permission: DocumentAction;
  start_at: string;
  expires_at?: string;
  granted_by: string;
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  created_at: string;
}

export interface DocumentAccessRequestRecord {
  id: string;
  request_number: string;
  document_id: string;
  requested_by: string;
  requested_permission: DocumentAction;
  reason: string;
  duration_hours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approved_by?: string;
  decision_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface BreakGlassAccessRecord {
  id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  reason: string;
  granted_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVIEWED';
}

export interface DocumentAccessAuditRecord {
  id: string;
  actor_id: string;
  actor_name: string;
  document_id: string;
  action: DocumentAction;
  decision: 'ALLOW' | 'DENY';
  reason: string;
  timestamp: string;
  is_break_glass: boolean;
}

export interface DocumentAccessDashboardMetrics {
  totalAccessChecksCount: number;
  allowedCount: number;
  deniedCount: number;
  activeGrantsCount: number;
  pendingAccessRequestsCount: number;
  breakGlassEventsCount: number;
}

class CentralDocumentAccessControlService {
  private static instance: CentralDocumentAccessControlService;

  private accessGrants: DocumentAccessGrantRecord[] = [];
  private accessRequests: DocumentAccessRequestRecord[] = [];
  private breakGlassEvents: BreakGlassAccessRecord[] = [];
  private accessAudits: DocumentAccessAuditRecord[] = [];
  private sequenceCounter = 100;

  private constructor() {}

  public static getInstance(): CentralDocumentAccessControlService {
    if (!CentralDocumentAccessControlService.instance) {
      CentralDocumentAccessControlService.instance = new CentralDocumentAccessControlService();
    }
    return CentralDocumentAccessControlService.instance;
  }

  // ─── CAN ACCESS EVALUATION ENGINE (DEFAULT DENY) ──────────────────────

  public canAccessDocument(params: {
    user: UserAuthorizationContext;
    documentId: string;
    action: DocumentAction;
    versionId?: string;
  }): { allowed: boolean; reason: string } {
    const doc = centralDocumentManagementService.getDocumentById(params.documentId);
    if (!doc) {
      this.recordAudit(params.user, params.documentId, params.action, 'DENY', 'Document does not exist or has been deleted', false);
      return { allowed: false, reason: 'DENIED: Document not found' };
    }

    const now = new Date().getTime();

    // 1. Check Active Break-Glass Emergency Overrides
    const activeBreakGlass = this.breakGlassEvents.find(bg => 
      bg.document_id === params.documentId && 
      bg.user_id === params.user.userId && 
      bg.status === 'ACTIVE' && 
      new Date(bg.expires_at).getTime() > now
    );
    if (activeBreakGlass) {
      this.recordAudit(params.user, params.documentId, params.action, 'ALLOW', 'Emergency Break-Glass access active', true);
      return { allowed: true, reason: 'ALLOWED: Emergency Break-Glass override active' };
    }

    // 2. Check Active Explicit Temporary / User Grants
    const validGrant = this.accessGrants.find(g => 
      g.document_id === params.documentId &&
      g.status === 'ACTIVE' &&
      (g.principal_id === params.user.userId || g.principal_id === params.user.activeRole) &&
      (g.permission === params.action || g.permission === 'VIEW') &&
      (!g.expires_at || new Date(g.expires_at).getTime() > now)
    );
    if (validGrant) {
      this.recordAudit(params.user, params.documentId, params.action, 'ALLOW', `Explicit access grant ${validGrant.id} active`, false);
      return { allowed: true, reason: 'ALLOWED: Explicit access grant active' };
    }

    // 3. Student Self-Access Rule: Students can ONLY access their own documents
    if (params.user.activeRole === 'STUDENT') {
      if (doc.owner_id === params.user.userId && (params.action === 'VIEW' || params.action === 'PREVIEW' || params.action === 'DOWNLOAD')) {
        this.recordAudit(params.user, params.documentId, params.action, 'ALLOW', 'Student accessing their own verified document', false);
        return { allowed: true, reason: 'ALLOWED: Student owner access' };
      } else {
        this.recordAudit(params.user, params.documentId, params.action, 'DENY', 'Cross-student or administrative document access prohibited', false);
        return { allowed: false, reason: 'DENIED: Cross-student or restricted document access' };
      }
    }

    // 4. Role & Organizational Scope Evaluation
    const isAdmin = params.user.activeRole === 'REGISTRAR' || params.user.activeRole === 'SUPER_ADMIN' || params.user.activeRole === 'HOI';
    if (isAdmin) {
      this.recordAudit(params.user, params.documentId, params.action, 'ALLOW', `Role ${params.user.activeRole} authorized for organization`, false);
      return { allowed: true, reason: `ALLOWED: Authorized administrative role ${params.user.activeRole}` };
    }

    // 5. Default Deny
    this.recordAudit(params.user, params.documentId, params.action, 'DENY', 'No matching RBAC permission or explicit grant found', false);
    return { allowed: false, reason: 'DENIED: Default Deny policy enforced' };
  }

  // ─── GRANT TEMPORARY ACCESS ───────────────────────────────────────────

  public grantTemporaryAccess(params: {
    documentId: string;
    principalType: 'USER' | 'ROLE' | 'DEPARTMENT' | 'ORGANIZATION';
    principalId: string;
    permission: DocumentAction;
    durationHours: number;
    reason: string;
    grantedBy: string;
  }): DocumentAccessGrantRecord {
    const grantId = `grant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const expiresAt = new Date(Date.now() + params.durationHours * 60 * 60 * 1000).toISOString();

    const grant: DocumentAccessGrantRecord = {
      id: grantId,
      document_id: params.documentId,
      version_scope: 'ALL_VERSIONS',
      principal_type: params.principalType,
      principal_id: params.principalId,
      permission: params.permission,
      start_at: new Date().toISOString(),
      expires_at: expiresAt,
      granted_by: params.grantedBy,
      reason: params.reason,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    this.accessGrants.push(grant);
    return grant;
  }

  // ─── REVOKE ACCESS GRANT ──────────────────────────────────────────────

  public revokeAccessGrant(grantId: string): DocumentAccessGrantRecord {
    const grant = this.accessGrants.find(g => g.id === grantId);
    if (!grant) throw new Error(`Access grant ${grantId} not found`);

    grant.status = 'REVOKED';
    return grant;
  }

  // ─── BREAK-GLASS EMERGENCY ACCESS PROTOCOL ────────────────────────────

  public requestBreakGlass(params: {
    documentId: string;
    userId: string;
    userName: string;
    reason: string;
  }): BreakGlassAccessRecord {
    if (!params.reason || params.reason.trim().length < 10) {
      throw new Error('Mandatory detailed business/legal justification required for Break-Glass access');
    }

    const bgId = `bg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // 30-minute short-lived emergency window
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const record: BreakGlassAccessRecord = {
      id: bgId,
      document_id: params.documentId,
      user_id: params.userId,
      user_name: params.userName,
      reason: params.reason,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: 'ACTIVE'
    };

    this.breakGlassEvents.push(record);
    return record;
  }

  // ─── ACCESS REQUEST & APPROVAL WORKFLOW ───────────────────────────────

  public createAccessRequest(params: {
    documentId: string;
    requestedBy: string;
    requestedPermission: DocumentAction;
    reason: string;
    durationHours?: number;
  }): DocumentAccessRequestRecord {
    this.sequenceCounter += 1;
    const reqNumber = `SSIU/ACCREQ/2026/${String(this.sequenceCounter).padStart(6, '0')}`;
    const id = `accreq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const req: DocumentAccessRequestRecord = {
      id,
      request_number: reqNumber,
      document_id: params.documentId,
      requested_by: params.requestedBy,
      requested_permission: params.requestedPermission,
      reason: params.reason,
      duration_hours: params.durationHours || 24,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    this.accessRequests.push(req);
    return req;
  }

  public approveAccessRequest(params: {
    requestId: string;
    approvedBy: string;
  }): DocumentAccessGrantRecord {
    const req = this.accessRequests.find(r => r.id === params.requestId);
    if (!req) throw new Error(`Access request ${params.requestId} not found`);

    if (req.requested_by === params.approvedBy) {
      throw new Error('Separation of Duties Violation: Requester cannot approve their own access request');
    }

    req.status = 'APPROVED';
    req.approved_by = params.approvedBy;
    req.decision_at = new Date().toISOString();

    return this.grantTemporaryAccess({
      documentId: req.document_id,
      principalType: 'USER',
      principalId: req.requested_by,
      permission: req.requested_permission,
      durationHours: req.duration_hours,
      reason: `Approved access request ${req.request_number}: ${req.reason}`,
      grantedBy: params.approvedBy
    });
  }

  // ─── FIELD-LEVEL MASKING UTILITY ──────────────────────────────────────

  public maskSensitiveField(fieldName: string, value: string, role: string): string {
    if (role === 'REGISTRAR' || role === 'SUPER_ADMIN') {
      return value;
    }

    if (fieldName.toLowerCase().includes('aadhaar') || fieldName.toLowerCase().includes('id_number')) {
      const clean = value.replace(/\s+/g, '');
      if (clean.length >= 4) {
        return `**** **** ${clean.slice(-4)}`;
      }
      return '****';
    }

    if (fieldName.toLowerCase().includes('pan')) {
      return `******${value.slice(-4)}`;
    }

    return value;
  }

  // ─── AUDIT RECORDING ─────────────────────────────────────────────────

  private recordAudit(user: UserAuthorizationContext, documentId: string, action: DocumentAction, decision: 'ALLOW' | 'DENY', reason: string, isBreakGlass: boolean): void {
    this.accessAudits.push({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: user.userId,
      actor_name: user.userName,
      document_id: documentId,
      action,
      decision,
      reason,
      timestamp: new Date().toISOString(),
      is_break_glass: isBreakGlass
    });
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getAccessDashboardMetrics(): DocumentAccessDashboardMetrics {
    const totalAccessChecksCount = this.accessAudits.length;
    const allowedCount = this.accessAudits.filter(a => a.decision === 'ALLOW').length;
    const deniedCount = this.accessAudits.filter(a => a.decision === 'DENY').length;
    const activeGrantsCount = this.accessGrants.filter(g => g.status === 'ACTIVE').length;
    const pendingAccessRequestsCount = this.accessRequests.filter(r => r.status === 'PENDING').length;
    const breakGlassEventsCount = this.breakGlassEvents.length;

    return {
      totalAccessChecksCount,
      allowedCount,
      deniedCount,
      activeGrantsCount,
      pendingAccessRequestsCount,
      breakGlassEventsCount
    };
  }
}

export const centralDocumentAccessControlService = CentralDocumentAccessControlService.getInstance();
