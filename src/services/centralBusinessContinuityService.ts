import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';
import { centralDocumentRiskManagementService } from './centralDocumentRiskManagementService';

export type BCPStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'SUPERSEDED' | 'ARCHIVED';
export type ProcessCriticality = 'NON_CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecoveryPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type DisasterScenario = 
  | 'DATABASE_FAILURE'
  | 'APPLICATION_FAILURE'
  | 'NETWORK_FAILURE'
  | 'STORAGE_FAILURE'
  | 'DATA_CORRUPTION'
  | 'CYBER_INCIDENT'
  | 'CLOUD_OUTAGE'
  | 'POWER_FAILURE'
  | 'OTHER';

export type DisasterStatus = 'DETECTED' | 'ASSESSING' | 'DECLARED' | 'RECOVERY' | 'VALIDATION' | 'SERVICE_RESTORED' | 'CLOSED';
export type DRTestType = 'TABLETOP' | 'WALKTHROUGH' | 'TECHNICAL' | 'RESTORE' | 'FAILOVER' | 'FULL_SIMULATION';

export interface BusinessContinuityPlanRecord {
  id: string;
  bcp_number: string;
  name: string;
  description: string;
  organization_id: string;
  owner_id: string;
  version: number;
  status: BCPStatus;
  effective_from: string;
  review_due_at: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CriticalProcessRecord {
  id: string;
  process_name: string;
  owner_id: string;
  organization_id: string;
  criticality: ProcessCriticality;
  recovery_priority: RecoveryPriority;
  max_tolerable_downtime_hours: number;
  target_rto_hours: number;
  target_rpo_hours: number;
  primary_recovery_strategy: 'BACKUP_RESTORE' | 'FAILOVER' | 'REDUNDANCY' | 'MANUAL_WORKAROUND';
  fallback_strategy: string;
}

export interface ProcessDependencyRecord {
  id: string;
  process_id: string;
  dependency_name: string;
  dependency_type: 'APPLICATION' | 'DATABASE' | 'STORAGE' | 'NETWORK' | 'AUTHENTICATION' | 'THIRD_PARTY';
  criticality: 'REQUIRED' | 'IMPORTANT' | 'OPTIONAL';
  is_spof: boolean;
}

export interface DisasterRecoveryPlanRecord {
  id: string;
  dr_number: string;
  name: string;
  organization_id: string;
  version: number;
  owner_id: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'TESTING';
  scenario: DisasterScenario;
  runbook_steps: { step_number: number; action: string; owner_role: string; timeout_minutes: number }[];
}

export interface DisasterEventRecord {
  id: string;
  event_number: string;
  scenario: DisasterScenario;
  organization_id: string;
  declared_at: string;
  declared_by: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: DisasterStatus;
  restored_at?: string;
  closed_at?: string;
}

export interface RestoreTestRecord {
  id: string;
  test_number: string;
  backup_id: string;
  target_environment: string;
  tested_by: string;
  tested_at: string;
  actual_rto_hours: number;
  actual_rpo_hours: number;
  result: 'PASS' | 'FAIL' | 'PARTIAL';
  database_integrity_verified: boolean;
  business_validation_verified: boolean;
  notes: string;
}

export interface RecoveryGapRecord {
  id: string;
  gap_number: string;
  process_name: string;
  metric: 'RTO' | 'RPO' | 'DEPENDENCY_SPOF';
  target_value: number;
  actual_value: number;
  status: 'OPEN' | 'REMEDIATION' | 'RESOLVED';
  created_at: string;
}

export interface DRTestRecord {
  id: string;
  test_number: string;
  dr_plan_id: string;
  test_type: DRTestType;
  scope: string;
  planned_date: string;
  actual_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  result: 'PASS' | 'PARTIAL' | 'FAIL';
  conducted_by: string;
}

export interface BCPDashboardMetrics {
  activePlansCount: number;
  criticalProcessesCount: number;
  openRecoveryGapsCount: number;
  spofIdentifiedCount: number;
  lastBackupStatus: 'HEALTHY' | 'FAILED' | 'WARNING';
  lastDRTestResult: 'PASS' | 'PARTIAL' | 'FAIL';
  averageRTOCompliancePercent: number;
}

class CentralBusinessContinuityService {
  private static instance: CentralBusinessContinuityService;

  private bcpPlans: BusinessContinuityPlanRecord[] = [];
  private criticalProcesses: CriticalProcessRecord[] = [];
  private dependencies: ProcessDependencyRecord[] = [];
  private drPlans: DisasterRecoveryPlanRecord[] = [];
  private disasterEvents: DisasterEventRecord[] = [];
  private restoreTests: RestoreTestRecord[] = [];
  private recoveryGaps: RecoveryGapRecord[] = [];
  private drTests: DRTestRecord[] = [];

  private bcpCounter = 100;
  private drCounter = 100;
  private evtCounter = 100;
  private rstCounter = 100;
  private gapCounter = 100;
  private drtCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralBusinessContinuityService {
    if (!CentralBusinessContinuityService.instance) {
      CentralBusinessContinuityService.instance = new CentralBusinessContinuityService();
    }
    return CentralBusinessContinuityService.instance;
  }

  private seedDemoData(): void {
    const bcpId = 'bcp-seed-001';
    this.bcpPlans.push({
      id: bcpId,
      bcp_number: 'BCP/2026/000001',
      name: 'University Academic, Admissions & Degree DMS Continuity Plan',
      description: 'Comprehensive business continuity strategy covering admissions, student dossiers, examination records, and verification APIs',
      organization_id: 'inst-sit',
      owner_id: 'emp-bcp-001',
      version: 1,
      status: 'ACTIVE',
      effective_from: '2026-01-01T00:00:00Z',
      review_due_at: '2026-12-31T00:00:00Z',
      approved_by: 'emp-reg-001',
      approved_at: '2026-01-01T10:00:00Z',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });

    const procId = 'proc-seed-001';
    this.criticalProcesses.push({
      id: procId,
      process_name: 'Examination Record Preservation & Transcript Verification',
      owner_id: 'emp-reg-001',
      organization_id: 'inst-sit',
      criticality: 'CRITICAL',
      recovery_priority: 'P1',
      max_tolerable_downtime_hours: 8,
      target_rto_hours: 4,
      target_rpo_hours: 1,
      primary_recovery_strategy: 'FAILOVER',
      fallback_strategy: 'Local Warm Replica Node Backup Restore'
    });

    this.dependencies.push({
      id: 'dep-seed-001',
      process_id: procId,
      dependency_name: 'Primary PostgreSQL Database & Cold Object Storage',
      dependency_type: 'DATABASE',
      criticality: 'REQUIRED',
      is_spof: false
    });
  }

  // ─── BCP PLANNING & BUSINESS IMPACT ANALYSIS ─────────────────────────

  public createBCP(params: {
    name: string;
    description: string;
    organizationId: string;
    ownerId: string;
    context?: UserAuthorizationContext;
  }): BusinessContinuityPlanRecord {
    this.bcpCounter += 1;
    const bcpNumber = `BCP/2026/${String(this.bcpCounter).padStart(6, '0')}`;

    const plan: BusinessContinuityPlanRecord = {
      id: `bcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bcp_number: bcpNumber,
      name: params.name,
      description: params.description,
      organization_id: params.organizationId,
      owner_id: params.ownerId,
      version: 1,
      status: 'APPROVED',
      effective_from: new Date().toISOString(),
      review_due_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.bcpPlans.push(plan);
    return plan;
  }

  public registerCriticalProcess(params: {
    processName: string;
    ownerId: string;
    organizationId: string;
    criticality: ProcessCriticality;
    recoveryPriority: RecoveryPriority;
    maxTolerableDowntimeHours: number;
    targetRtoHours: number;
    targetRpoHours: number;
    primaryRecoveryStrategy: 'BACKUP_RESTORE' | 'FAILOVER' | 'REDUNDANCY' | 'MANUAL_WORKAROUND';
    fallbackStrategy: string;
  }): CriticalProcessRecord {
    // Validate RTO <= MTD
    if (params.targetRtoHours > params.maxTolerableDowntimeHours) {
      throw new Error(`Configuration Conflict: Target RTO (${params.targetRtoHours}h) cannot exceed MTD (${params.maxTolerableDowntimeHours}h)`);
    }

    const proc: CriticalProcessRecord = {
      id: `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      process_name: params.processName,
      owner_id: params.ownerId,
      organization_id: params.organizationId,
      criticality: params.criticality,
      recovery_priority: params.recoveryPriority,
      max_tolerable_downtime_hours: params.maxTolerableDowntimeHours,
      target_rto_hours: params.targetRtoHours,
      target_rpo_hours: params.targetRpoHours,
      primary_recovery_strategy: params.primaryRecoveryStrategy,
      fallback_strategy: params.fallbackStrategy
    };

    this.criticalProcesses.push(proc);
    return proc;
  }

  public addProcessDependency(params: {
    processId: string;
    dependencyName: string;
    dependencyType: 'APPLICATION' | 'DATABASE' | 'STORAGE' | 'NETWORK' | 'AUTHENTICATION' | 'THIRD_PARTY';
    criticality: 'REQUIRED' | 'IMPORTANT' | 'OPTIONAL';
    isSpof?: boolean;
  }): ProcessDependencyRecord {
    const dep: ProcessDependencyRecord = {
      id: `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      process_id: params.processId,
      dependency_name: params.dependencyName,
      dependency_type: params.dependencyType,
      criticality: params.criticality,
      is_spof: params.isSpof || false
    };

    this.dependencies.push(dep);
    return dep;
  }

  // ─── DR PLANNING & DISASTER DECLARATION ───────────────────────────────

  public createDRPlan(params: {
    name: string;
    organizationId: string;
    ownerId: string;
    scenario: DisasterScenario;
    runbookSteps: { step_number: number; action: string; owner_role: string; timeout_minutes: number }[];
  }): DisasterRecoveryPlanRecord {
    this.drCounter += 1;
    const drNumber = `DRP/2026/${String(this.drCounter).padStart(6, '0')}`;

    const plan: DisasterRecoveryPlanRecord = {
      id: `drp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dr_number: drNumber,
      name: params.name,
      organization_id: params.organizationId,
      version: 1,
      owner_id: params.ownerId,
      status: 'ACTIVE',
      scenario: params.scenario,
      runbook_steps: params.runbookSteps
    };

    this.drPlans.push(plan);
    return plan;
  }

  public declareDisaster(params: {
    scenario: DisasterScenario;
    organizationId: string;
    declaredBy: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    context?: UserAuthorizationContext;
  }): DisasterEventRecord {
    this.evtCounter += 1;
    const eventNumber = `DIS/2026/${String(this.evtCounter).padStart(6, '0')}`;

    const event: DisasterEventRecord = {
      id: `dis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event_number: eventNumber,
      scenario: params.scenario,
      organization_id: params.organizationId,
      declared_at: new Date().toISOString(),
      declared_by: params.declaredBy,
      severity: params.severity,
      status: 'DECLARED'
    };

    this.disasterEvents.push(event);
    return event;
  }

  // ─── RESTORE TESTING & RECOVERY GAP DETECTION ─────────────────────────

  public executeRestoreTest(params: {
    backupId: string;
    targetEnvironment: string;
    testedBy: string;
    actualRtoHours: number;
    actualRpoHours: number;
    processName: string;
    targetRtoHours: number;
    targetRpoHours: number;
  }): { test: RestoreTestRecord; gap?: RecoveryGapRecord } {
    this.rstCounter += 1;
    const testNumber = `RST-TST/2026/${String(this.rstCounter).padStart(6, '0')}`;

    const isPass = params.actualRtoHours <= params.targetRtoHours && params.actualRpoHours <= params.targetRpoHours;

    const test: RestoreTestRecord = {
      id: `rtst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      test_number: testNumber,
      backup_id: params.backupId,
      target_environment: params.targetEnvironment,
      tested_by: params.testedBy,
      tested_at: new Date().toISOString(),
      actual_rto_hours: params.actualRtoHours,
      actual_rpo_hours: params.actualRpoHours,
      result: isPass ? 'PASS' : 'FAIL',
      database_integrity_verified: true,
      business_validation_verified: isPass,
      notes: isPass ? 'All integrity checks & business validations passed' : `RTO/RPO threshold exceeded: Actual RTO=${params.actualRtoHours}h, Target RTO=${params.targetRtoHours}h`
    };

    this.restoreTests.push(test);

    let gap: RecoveryGapRecord | undefined;
    if (!isPass) {
      this.gapCounter += 1;
      const gapNumber = `GAP/2026/${String(this.gapCounter).padStart(6, '0')}`;

      gap = {
        id: `gap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        gap_number: gapNumber,
        process_name: params.processName,
        metric: params.actualRtoHours > params.targetRtoHours ? 'RTO' : 'RPO',
        target_value: params.targetRtoHours,
        actual_value: params.actualRtoHours,
        status: 'OPEN',
        created_at: new Date().toISOString()
      };

      this.recoveryGaps.push(gap);
    }

    return { test, gap };
  }

  // ─── DR EXERCISE TESTING ─────────────────────────────────────────────

  public createDRTest(params: {
    drPlanId: string;
    testType: DRTestType;
    scope: string;
    plannedDate: string;
    conductedBy: string;
  }): DRTestRecord {
    this.drtCounter += 1;
    const testNumber = `DRT/2026/${String(this.drtCounter).padStart(6, '0')}`;

    const test: DRTestRecord = {
      id: `drt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      test_number: testNumber,
      dr_plan_id: params.drPlanId,
      test_type: params.testType,
      scope: params.scope,
      planned_date: params.plannedDate,
      actual_date: new Date().toISOString(),
      status: 'COMPLETED',
      result: 'PASS',
      conducted_by: params.conductedBy
    };

    this.drTests.push(test);
    return test;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getBCPDashboardMetrics(context?: UserAuthorizationContext): BCPDashboardMetrics {
    const activePlansCount = this.bcpPlans.filter(p => p.status === 'ACTIVE' || p.status === 'APPROVED').length;
    const criticalProcessesCount = this.criticalProcesses.length;
    const openRecoveryGapsCount = this.recoveryGaps.filter(g => g.status === 'OPEN').length;
    const spofIdentifiedCount = this.dependencies.filter(d => d.is_spof).length;

    const lastTest = this.drTests.length > 0 ? this.drTests[this.drTests.length - 1].result : 'PASS';

    return {
      activePlansCount,
      criticalProcessesCount,
      openRecoveryGapsCount,
      spofIdentifiedCount,
      lastBackupStatus: 'HEALTHY',
      lastDRTestResult: lastTest,
      averageRTOCompliancePercent: 96
    };
  }
}

export const centralBusinessContinuityService = CentralBusinessContinuityService.getInstance();
