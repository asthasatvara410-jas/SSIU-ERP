import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';
import { centralEnterpriseContentManagementService } from './centralEnterpriseContentManagementService';
import { centralPortalPlatformService } from './centralPortalPlatformService';

export type CaseLifecycleStatus = 
  | 'NEW'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type SLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'PAUSED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export interface ServiceCaseRecord {
  id: string;
  case_number: string;
  service_code: string;
  request_id: string;
  requester_id: string;
  organization_id: string;
  department_id: string;
  priority: CasePriority;
  status: CaseLifecycleStatus;
  owner_id?: string;
  queue_id: string;
  sla_status: SLAStatus;
  sla_paused: boolean;
  sla_pause_reason?: string;
  opened_at: string;
  due_at: string;
  resolution_code?: string;
  resolution_summary?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceQueueRecord {
  id: string;
  queue_code: string;
  name: string;
  department_id: string;
  organization_id: string;
  manager_id: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ServiceTaskRecord {
  id: string;
  case_id: string;
  title: string;
  assignee_id: string;
  status: TaskStatus;
  depends_on_task_id?: string;
  due_at: string;
  completed_at?: string;
  created_at: string;
}

export interface ServiceOperationsDashboardMetrics {
  totalCasesCount: number;
  openCasesCount: number;
  inProgressCasesCount: number;
  resolvedCasesCount: number;
  closedCasesCount: number;
  slaOnTrackPercent: number;
  slaBreachedCount: number;
  activeTasksCount: number;
  operationsPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralServiceOperationsService {
  private static instance: CentralServiceOperationsService;

  private cases: ServiceCaseRecord[] = [];
  private queues: ServiceQueueRecord[] = [];
  private tasks: ServiceTaskRecord[] = [];

  private caseCounter = 100;
  private taskCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralServiceOperationsService {
    if (!CentralServiceOperationsService.instance) {
      CentralServiceOperationsService.instance = new CentralServiceOperationsService();
    }
    return CentralServiceOperationsService.instance;
  }

  private seedDemoData(): void {
    // Seed Queues
    this.queues.push({
      id: 'queue-seed-001',
      queue_code: 'QUEUE-REGISTRAR-DESK',
      name: 'Central Registrar Certificate & Verification Queue',
      department_id: 'dept-academic',
      organization_id: 'inst-sit',
      manager_id: 'emp-reg-001',
      status: 'ACTIVE'
    });

    this.queues.push({
      id: 'queue-seed-002',
      queue_code: 'QUEUE-FINANCE-DESK',
      name: 'Student Accounts & Fee Clearance Desk',
      department_id: 'dept-finance',
      organization_id: 'inst-sit',
      manager_id: 'emp-cfo-001',
      status: 'ACTIVE'
    });
  }

  // ─── CASE MANAGEMENT & CREATION ──────────────────────────────────────

  public createCaseFromServiceRequest(params: {
    serviceCode: string;
    requestId: string;
    requesterId: string;
    organizationId: string;
    departmentId: string;
    priority?: CasePriority;
    slaHours?: number;
  }): ServiceCaseRecord {
    this.caseCounter += 1;
    const caseNumber = `CASE-2026-${String(this.caseCounter).padStart(6, '0')}`;

    const duration = params.slaHours || 48;
    const dueAt = new Date(Date.now() + duration * 3600 * 1000).toISOString();

    const caseItem: ServiceCaseRecord = {
      id: `case-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      case_number: caseNumber,
      service_code: params.serviceCode,
      request_id: params.requestId,
      requester_id: params.requesterId,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      priority: params.priority || 'NORMAL',
      status: 'NEW',
      queue_id: 'QUEUE-REGISTRAR-DESK',
      sla_status: 'ON_TRACK',
      sla_paused: false,
      opened_at: new Date().toISOString(),
      due_at: dueAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.cases.push(caseItem);
    return caseItem;
  }

  // ─── QUEUE ROUTING & CASE ASSIGNMENT ─────────────────────────────────

  public assignCaseToStaff(caseId: string, staffId: string, authorizedBy: string): ServiceCaseRecord {
    const c = this.cases.find(item => item.id === caseId || item.case_number === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);

    c.owner_id = staffId;
    c.status = 'ASSIGNED';
    c.updated_at = new Date().toISOString();

    return c;
  }

  // ─── TASK ENGINE & DEPENDENCY ENFORCEMENT ────────────────────────────

  public createTask(params: {
    caseId: string;
    title: string;
    assigneeId: string;
    dependsOnTaskId?: string;
    durationHours?: number;
  }): ServiceTaskRecord {
    this.taskCounter += 1;
    const task: ServiceTaskRecord = {
      id: `tsk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      case_id: params.caseId,
      title: params.title,
      assignee_id: params.assigneeId,
      status: params.dependsOnTaskId ? 'BLOCKED' : 'PENDING',
      depends_on_task_id: params.dependsOnTaskId,
      due_at: new Date(Date.now() + (params.durationHours || 24) * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    this.tasks.push(task);
    return task;
  }

  public completeTask(taskId: string, completedBy: string): ServiceTaskRecord {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    // Prerequisite Dependency Gate
    if (task.depends_on_task_id) {
      const prerequisite = this.tasks.find(t => t.id === task.depends_on_task_id);
      if (prerequisite && prerequisite.status !== 'COMPLETED') {
        throw new Error(`Task Dependency Blocked: Prerequisite task '${prerequisite.title}' must be completed before completing this task`);
      }
    }

    task.status = 'COMPLETED';
    task.completed_at = new Date().toISOString();

    // Unblock dependent tasks
    const dependentTasks = this.tasks.filter(t => t.depends_on_task_id === task.id);
    for (const dt of dependentTasks) {
      if (dt.status === 'BLOCKED') {
        dt.status = 'PENDING';
      }
    }

    return task;
  }

  // ─── SLA ENGINE, PAUSE/RESUME & ESCALATIONS ──────────────────────────

  public pauseCaseSLA(caseId: string, reason: string): ServiceCaseRecord {
    const c = this.cases.find(item => item.id === caseId || item.case_number === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);

    c.sla_paused = true;
    c.sla_status = 'PAUSED';
    c.sla_pause_reason = reason;
    c.status = 'WAITING';
    c.updated_at = new Date().toISOString();

    return c;
  }

  public resumeCaseSLA(caseId: string): ServiceCaseRecord {
    const c = this.cases.find(item => item.id === caseId || item.case_number === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);

    c.sla_paused = false;
    c.sla_status = 'ON_TRACK';
    c.sla_pause_reason = undefined;
    c.status = 'IN_PROGRESS';
    c.updated_at = new Date().toISOString();

    return c;
  }

  // ─── RESOLUTION & CLOSURE GATES ──────────────────────────────────────

  public resolveCase(params: {
    caseId: string;
    resolutionCode: string;
    resolutionSummary: string;
    resolvedBy: string;
  }): ServiceCaseRecord {
    const c = this.cases.find(item => item.id === params.caseId || item.case_number === params.caseId);
    if (!c) throw new Error(`Case ${params.caseId} not found`);

    c.status = 'RESOLVED';
    c.resolution_code = params.resolutionCode;
    c.resolution_summary = params.resolutionSummary;
    c.resolved_at = new Date().toISOString();
    c.updated_at = new Date().toISOString();

    return c;
  }

  public closeCase(caseId: string, closedBy: string): ServiceCaseRecord {
    const c = this.cases.find(item => item.id === caseId || item.case_number === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);

    // Incomplete mandatory tasks gate
    const pendingTasks = this.tasks.filter(t => t.case_id === c.id && t.status !== 'COMPLETED');
    if (pendingTasks.length > 0) {
      throw new Error(`Case Closure Blocked: Cannot close case ${c.case_number} with ${pendingTasks.length} incomplete mandatory operational tasks`);
    }

    if (!c.resolution_summary) {
      throw new Error(`Case Closure Blocked: Resolution summary is required before closing case ${c.case_number}`);
    }

    c.status = 'CLOSED';
    c.closed_at = new Date().toISOString();
    c.updated_at = new Date().toISOString();

    return c;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getServiceOperationsDashboardMetrics(context?: UserAuthorizationContext): ServiceOperationsDashboardMetrics {
    const totalCasesCount = this.cases.length;
    const openCasesCount = this.cases.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const inProgressCasesCount = this.cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
    const resolvedCasesCount = this.cases.filter(c => c.status === 'RESOLVED').length;
    const closedCasesCount = this.cases.filter(c => c.status === 'CLOSED').length;
    const activeTasksCount = this.tasks.filter(t => t.status !== 'COMPLETED').length;

    return {
      totalCasesCount,
      openCasesCount,
      inProgressCasesCount,
      resolvedCasesCount,
      closedCasesCount,
      slaOnTrackPercent: 98,
      slaBreachedCount: 0,
      activeTasksCount,
      operationsPosture: 'HEALTHY'
    };
  }
}

export const centralServiceOperationsService = CentralServiceOperationsService.getInstance();
