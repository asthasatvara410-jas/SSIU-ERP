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
import { centralServiceOperationsService } from './centralServiceOperationsService';

export type IncidentSeverity = 'SEV1_CRITICAL' | 'SEV2_HIGH' | 'SEV3_MEDIUM' | 'SEV4_LOW';
export type IncidentStatus = 'DETECTED' | 'TRIAGED' | 'ASSIGNED' | 'INVESTIGATING' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
export type ChangeType = 'STANDARD' | 'NORMAL' | 'EMERGENCY';
export type ChangeStatus = 'DRAFT' | 'ASSESSMENT' | 'APPROVED' | 'SCHEDULED' | 'IMPLEMENTING' | 'VALIDATION' | 'COMPLETED' | 'ROLLED_BACK';

export interface IncidentRecord {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  affected_service: string;
  organization_id: string;
  campus_id: string;
  department_id: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  commander_id?: string;
  is_major_incident: boolean;
  major_incident_id?: string;
  problem_id?: string;
  reported_at: string;
  resolved_at?: string;
  closed_at?: string;
}

export interface MajorIncidentRecord {
  id: string;
  major_incident_number: string;
  incident_id: string;
  commander_id: string;
  war_room_status: 'ACTIVE' | 'STANDBY' | 'DEACTIVATED';
  affected_services: string[];
  declared_at: string;
  status: 'DECLARED' | 'INVESTIGATING' | 'MITIGATING' | 'SERVICE_RESTORED' | 'CLOSED';
}

export interface ProblemRecord {
  id: string;
  problem_number: string;
  title: string;
  affected_service: string;
  incident_count: number;
  root_cause_confirmed: boolean;
  status: 'IDENTIFIED' | 'ANALYSIS' | 'ROOT_CAUSE_IDENTIFIED' | 'RESOLVED' | 'CLOSED';
  created_at: string;
}

export interface RootCauseAnalysisRecord {
  id: string;
  problem_id: string;
  method: '5_WHY' | 'FISHBONE' | 'TECHNICAL_ANALYSIS';
  root_cause_summary: string;
  contributing_factors: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONFIRMED';
  created_at: string;
}

export interface KnownErrorRecord {
  id: string;
  error_number: string;
  problem_id: string;
  symptoms: string;
  workaround_text: string;
  status: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
  published_at?: string;
}

export interface ChangeRequestRecord {
  id: string;
  change_number: string;
  title: string;
  change_type: ChangeType;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affected_service: string;
  implementation_plan: string;
  rollback_plan: string;
  status: ChangeStatus;
  requested_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContinuousImprovementItem {
  id: string;
  source: 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'AUDIT';
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'STRATEGIC';
  status: 'IDENTIFIED' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
}

export interface ITSMDashboardMetrics {
  openIncidentsCount: number;
  criticalSev1Count: number;
  activeMajorIncidentsCount: number;
  openProblemsCount: number;
  pendingChangesCount: number;
  publishedKnownErrorsCount: number;
  changeSuccessRatePercent: number;
  itsmPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralAdvancedCaseIncidentManagementService {
  private static instance: CentralAdvancedCaseIncidentManagementService;

  private incidents: IncidentRecord[] = [];
  private majorIncidents: MajorIncidentRecord[] = [];
  private problems: ProblemRecord[] = [];
  private rcas: RootCauseAnalysisRecord[] = [];
  private knownErrors: KnownErrorRecord[] = [];
  private changes: ChangeRequestRecord[] = [];
  private improvements: ContinuousImprovementItem[] = [];

  private incCounter = 100;
  private miCounter = 100;
  private prbCounter = 100;
  private keCounter = 100;
  private chgCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralAdvancedCaseIncidentManagementService {
    if (!CentralAdvancedCaseIncidentManagementService.instance) {
      CentralAdvancedCaseIncidentManagementService.instance = new CentralAdvancedCaseIncidentManagementService();
    }
    return CentralAdvancedCaseIncidentManagementService.instance;
  }

  private seedDemoData(): void {
    // Seed Sample Standard Change
    this.changes.push({
      id: 'chg-seed-001',
      change_number: 'CHG-2026-000001',
      title: 'Routine Database Index Optimization & Stats Refresh',
      change_type: 'STANDARD',
      risk_level: 'LOW',
      affected_service: 'Central Examination Vault',
      implementation_plan: 'Execute standard index reindexing script during maintenance window',
      rollback_plan: 'Revert to previous index structure from snapshot',
      status: 'COMPLETED',
      requested_by: 'emp-dba-001',
      approved_by: 'emp-it-head-001',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });
  }

  // ─── INCIDENT MANAGEMENT & AUTOMATED MAJOR INCIDENTS ─────────────────

  public reportIncident(params: {
    title: string;
    description: string;
    affectedService: string;
    organizationId: string;
    campusId: string;
    departmentId: string;
    severity: IncidentSeverity;
    commanderId?: string;
  }): { incident: IncidentRecord; majorIncident?: MajorIncidentRecord } {
    this.incCounter += 1;
    const incNumber = `INC-2026-${String(this.incCounter).padStart(6, '0')}`;
    const incId = `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let majorIncident: MajorIncidentRecord | undefined;
    let isMajor = false;
    let miId: string | undefined;

    // SEV1 Critical Rule: Automatically declares Major Incident and activates War Room
    if (params.severity === 'SEV1_CRITICAL') {
      isMajor = true;
      this.miCounter += 1;
      miId = `mi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      majorIncident = {
        id: miId,
        major_incident_number: `MI-2026-${String(this.miCounter).padStart(6, '0')}`,
        incident_id: incId,
        commander_id: params.commanderId || 'emp-it-commander-001',
        war_room_status: 'ACTIVE',
        affected_services: [params.affectedService],
        declared_at: new Date().toISOString(),
        status: 'DECLARED'
      };
      this.majorIncidents.push(majorIncident);
    }

    const incident: IncidentRecord = {
      id: incId,
      incident_number: incNumber,
      title: params.title,
      description: params.description,
      affected_service: params.affectedService,
      organization_id: params.organizationId,
      campus_id: params.campusId,
      department_id: params.departmentId,
      severity: params.severity,
      status: 'INVESTIGATING',
      is_major_incident: isMajor,
      major_incident_id: miId,
      commander_id: params.commanderId,
      reported_at: new Date().toISOString()
    };

    this.incidents.push(incident);
    return { incident, majorIncident };
  }

  // ─── PROBLEM MANAGEMENT & ROOT CAUSE ANALYSIS (RCA) ──────────────────

  public createProblemFromIncidents(params: {
    title: string;
    affectedService: string;
    incidentIds: string[];
  }): ProblemRecord {
    this.prbCounter += 1;
    const prbNumber = `PRB-2026-${String(this.prbCounter).padStart(6, '0')}`;

    const problem: ProblemRecord = {
      id: `prb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      problem_number: prbNumber,
      title: params.title,
      affected_service: params.affectedService,
      incident_count: params.incidentIds.length,
      root_cause_confirmed: false,
      status: 'ANALYSIS',
      created_at: new Date().toISOString()
    };

    this.problems.push(problem);
    return problem;
  }

  public conductRCA(params: {
    problemId: string;
    method: '5_WHY' | 'FISHBONE' | 'TECHNICAL_ANALYSIS';
    rootCauseSummary: string;
    contributingFactors: string[];
  }): RootCauseAnalysisRecord {
    const prb = this.problems.find(p => p.id === params.problemId || p.problem_number === params.problemId);
    if (!prb) throw new Error(`Problem ${params.problemId} not found`);

    const rca: RootCauseAnalysisRecord = {
      id: `rca-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      problem_id: prb.id,
      method: params.method,
      root_cause_summary: params.rootCauseSummary,
      contributing_factors: params.contributingFactors,
      confidence: 'CONFIRMED',
      created_at: new Date().toISOString()
    };

    this.rcas.push(rca);
    prb.root_cause_confirmed = true;
    prb.status = 'ROOT_CAUSE_IDENTIFIED';

    return rca;
  }

  // ─── KNOWN ERROR DATABASE (KEDB) & WORKAROUNDS ────────────────────────

  public createKnownError(params: {
    problemId: string;
    symptoms: string;
    workaroundText: string;
  }): KnownErrorRecord {
    this.keCounter += 1;
    const keNumber = `KE-2026-${String(this.keCounter).padStart(6, '0')}`;

    const ke: KnownErrorRecord = {
      id: `ke-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      error_number: keNumber,
      problem_id: params.problemId,
      symptoms: params.symptoms,
      workaround_text: params.workaroundText,
      status: 'PUBLISHED',
      published_at: new Date().toISOString()
    };

    this.knownErrors.push(ke);
    return ke;
  }

  // ─── CHANGE MANAGEMENT & ROLLBACK CONTROL ─────────────────────────────

  public submitChangeRequest(params: {
    title: string;
    changeType: ChangeType;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    affectedService: string;
    implementationPlan: string;
    rollbackPlan: string;
    requestedBy: string;
  }): ChangeRequestRecord {
    this.chgCounter += 1;
    const chgNumber = `CHG-2026-${String(this.chgCounter).padStart(6, '0')}`;

    const change: ChangeRequestRecord = {
      id: `chg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      change_number: chgNumber,
      title: params.title,
      change_type: params.changeType,
      risk_level: params.riskLevel,
      affected_service: params.affectedService,
      implementation_plan: params.implementationPlan,
      rollback_plan: params.rollbackPlan,
      status: 'APPROVED',
      requested_by: params.requestedBy,
      approved_by: 'emp-cab-chair-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.changes.push(change);
    return change;
  }

  public rollbackChange(changeId: string, reason: string): ChangeRequestRecord {
    const chg = this.changes.find(c => c.id === changeId || c.change_number === changeId);
    if (!chg) throw new Error(`Change Request ${changeId} not found`);

    chg.status = 'ROLLED_BACK';
    chg.updated_at = new Date().toISOString();

    // Log Improvement Item automatically from failed change
    this.improvements.push({
      id: `imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source: 'CHANGE',
      title: `Remediate Change Rollback for ${chg.change_number}: ${reason}`,
      priority: 'HIGH',
      status: 'IDENTIFIED',
      created_at: new Date().toISOString()
    });

    return chg;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getITSMDashboardMetrics(context?: UserAuthorizationContext): ITSMDashboardMetrics {
    const openIncidentsCount = this.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
    const criticalSev1Count = this.incidents.filter(i => i.severity === 'SEV1_CRITICAL' && i.status !== 'CLOSED').length;
    const activeMajorIncidentsCount = this.majorIncidents.filter(m => m.war_room_status === 'ACTIVE').length;
    const openProblemsCount = this.problems.filter(p => p.status !== 'CLOSED').length;
    const pendingChangesCount = this.changes.filter(c => c.status === 'APPROVED' || c.status === 'SCHEDULED').length;
    const publishedKnownErrorsCount = this.knownErrors.filter(k => k.status === 'PUBLISHED').length;

    return {
      openIncidentsCount,
      criticalSev1Count,
      activeMajorIncidentsCount,
      openProblemsCount,
      pendingChangesCount,
      publishedKnownErrorsCount,
      changeSuccessRatePercent: 98,
      itsmPosture: 'HEALTHY'
    };
  }
}

export const centralAdvancedCaseIncidentManagementService = CentralAdvancedCaseIncidentManagementService.getInstance();
