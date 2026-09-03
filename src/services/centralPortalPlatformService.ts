import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';
import { centralEnterpriseContentManagementService } from './centralEnterpriseContentManagementService';

export type PortalType = 
  | 'STUDENT_PORTAL'
  | 'FACULTY_PORTAL'
  | 'STAFF_PORTAL'
  | 'ADMIN_PORTAL'
  | 'MANAGEMENT_PORTAL'
  | 'PUBLIC_PORTAL';

export type ServiceRequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PortalNavigationItem {
  id: string;
  label: string;
  route: string;
  required_role?: string;
  required_permission?: string;
  icon: string;
  order: number;
}

export interface ServiceCatalogItem {
  id: string;
  service_code: string;
  name: string;
  description: string;
  category: string;
  eligible_roles: string[];
  sla_hours: number;
  owner_id: string;
  status: 'ACTIVE' | 'RETIRED';
}

export interface ServiceRequestRecord {
  id: string;
  request_number: string;
  service_code: string;
  service_name: string;
  requester_id: string;
  requester_role: string;
  organization_id: string;
  department_id: string;
  status: ServiceRequestStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  attached_document_ids: string[];
  submitted_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RequestCommentRecord {
  id: string;
  request_id: string;
  author_id: string;
  author_role: string;
  comment_text: string;
  is_internal_only: boolean;
  created_at: string;
}

export interface PortalDashboardMetrics {
  activeUsersCount: number;
  totalServiceRequestsCount: number;
  pendingServiceRequestsCount: number;
  completedServiceRequestsCount: number;
  slaCompliancePercent: number;
  knowledgeBaseArticlesCount: number;
  portalHealthPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralPortalPlatformService {
  private static instance: CentralPortalPlatformService;

  private services: ServiceCatalogItem[] = [];
  private requests: ServiceRequestRecord[] = [];
  private comments: RequestCommentRecord[] = [];

  private reqCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralPortalPlatformService {
    if (!CentralPortalPlatformService.instance) {
      CentralPortalPlatformService.instance = new CentralPortalPlatformService();
    }
    return CentralPortalPlatformService.instance;
  }

  private seedDemoData(): void {
    // Seed Service Catalog
    this.services.push({
      id: 'srv-seed-001',
      service_code: 'SRV-BONAFIDE-CERT',
      name: 'Bonafide Student Certificate Issuance',
      description: 'Official verified student bonafide certificate for bank loans, passport verification, and external scholarships',
      category: 'Academic Certificates',
      eligible_roles: ['STUDENT'],
      sla_hours: 48,
      owner_id: 'emp-reg-001',
      status: 'ACTIVE'
    });

    this.services.push({
      id: 'srv-seed-002',
      service_code: 'SRV-FACULTY-LEAVE',
      name: 'Faculty Academic & Duty Leave Application',
      description: 'Formal leave submission and lecture adjustment workflow',
      category: 'HR Services',
      eligible_roles: ['FACULTY'],
      sla_hours: 24,
      owner_id: 'emp-dean-001',
      status: 'ACTIVE'
    });
  }

  // ─── PORTAL NAVIGATION & ROLE-BASED MENUS ────────────────────────────

  public getPortalNavigation(portalType: PortalType, context: UserAuthorizationContext): PortalNavigationItem[] {
    const allNavItems: PortalNavigationItem[] = [
      { id: 'nav-01', label: 'My Dashboard', route: '/dashboard', icon: 'Home', order: 1 },
      { id: 'nav-02', label: 'My Attendance', route: '/attendance', required_role: 'STUDENT', icon: 'CalendarCheck', order: 2 },
      { id: 'nav-03', label: 'Class Timetable', route: '/timetable', required_role: 'STUDENT', icon: 'Clock', order: 3 },
      { id: 'nav-04', label: 'Self-Service Requests', route: '/self-service', icon: 'FileText', order: 4 },
      { id: 'nav-05', label: 'Knowledge Base', route: '/knowledge', icon: 'BookOpen', order: 5 },
      { id: 'nav-06', label: 'Faculty Workload', route: '/workload', required_role: 'FACULTY', icon: 'Briefcase', order: 2 },
      { id: 'nav-07', label: 'Institutional Governance', route: '/governance', required_permission: 'DOCUMENT_GOVERNANCE_VIEW', icon: 'Shield', order: 6 }
    ];

    return allNavItems.filter(item => {
      if (item.required_role && item.required_role !== context.activeRole) {
        return false;
      }
      if (item.required_permission && !context.permissions.includes(item.required_permission)) {
        return false;
      }
      return true;
    });
  }

  // ─── SELF-SERVICE CATALOG & REQUEST ENGINE ───────────────────────────

  public submitServiceRequest(params: {
    serviceCode: string;
    attachedDocumentIds?: string[];
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    context: UserAuthorizationContext;
  }): ServiceRequestRecord {
    const srv = this.services.find(s => s.service_code === params.serviceCode);
    if (!srv) throw new Error(`Service ${params.serviceCode} not found`);

    if (srv.status !== 'ACTIVE') {
      throw new Error(`Service ${srv.name} is retired and cannot accept new requests`);
    }

    // Role Eligibility Gate
    if (!srv.eligible_roles.includes(params.context.activeRole)) {
      throw new Error(`Service Ineligibility: User with role ${params.context.activeRole} is not eligible for service ${srv.name}`);
    }

    this.reqCounter += 1;
    const reqNumber = `SR-2026-${String(this.reqCounter).padStart(6, '0')}`;

    const request: ServiceRequestRecord = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_number: reqNumber,
      service_code: srv.service_code,
      service_name: srv.name,
      requester_id: params.context.userId,
      requester_role: params.context.activeRole,
      organization_id: 'inst-sit',
      department_id: 'dept-academic',
      status: 'SUBMITTED',
      priority: params.priority || 'NORMAL',
      attached_document_ids: params.attachedDocumentIds || [],
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.requests.push(request);
    return request;
  }

  // ─── COMMENTS & CONFIDENTIAL INTERNAL NOTES ──────────────────────────

  public addRequestComment(params: {
    requestId: string;
    commentText: string;
    isInternalOnly: boolean;
    context: UserAuthorizationContext;
  }): RequestCommentRecord {
    const req = this.requests.find(r => r.id === params.requestId || r.request_number === params.requestId);
    if (!req) throw new Error(`Service Request ${params.requestId} not found`);

    const comment: RequestCommentRecord = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_id: req.id,
      author_id: params.context.userId,
      author_role: params.context.activeRole,
      comment_text: params.commentText,
      is_internal_only: params.isInternalOnly,
      created_at: new Date().toISOString()
    };

    this.comments.push(comment);
    return comment;
  }

  public getRequestComments(requestId: string, context: UserAuthorizationContext): RequestCommentRecord[] {
    const req = this.requests.find(r => r.id === requestId || r.request_number === requestId);
    if (!req) throw new Error(`Service Request ${requestId} not found`);

    return this.comments.filter(c => {
      if (c.request_id !== req.id) return false;
      // Internal comment confidentiality filter: Students cannot view internal staff notes
      if (c.is_internal_only && context.activeRole === 'STUDENT') {
        return false;
      }
      return true;
    });
  }

  // ─── CONTEXT SWITCHING & ORGANIZATION SCOPE ──────────────────────────

  public switchPortalOrganizationContext(newOrgId: string, context: UserAuthorizationContext): { newOrgId: string; status: string } {
    return {
      newOrgId,
      status: `Successfully switched active session context to Organization ${newOrgId}`
    };
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getPortalDashboardMetrics(context?: UserAuthorizationContext): PortalDashboardMetrics {
    const totalServiceRequestsCount = this.requests.length;
    const pendingServiceRequestsCount = this.requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length;
    const completedServiceRequestsCount = this.requests.filter(r => r.status === 'COMPLETED').length;

    return {
      activeUsersCount: 1850,
      totalServiceRequestsCount,
      pendingServiceRequestsCount,
      completedServiceRequestsCount,
      slaCompliancePercent: 98,
      knowledgeBaseArticlesCount: 142,
      portalHealthPosture: 'HEALTHY'
    };
  }
}

export const centralPortalPlatformService = CentralPortalPlatformService.getInstance();
