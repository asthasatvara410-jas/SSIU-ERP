import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralBusinessContinuityService } from './centralBusinessContinuityService';
import { centralDocumentRiskManagementService } from './centralDocumentRiskManagementService';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';

export type SecurityIncidentType = 
  | 'UNAUTHORIZED_ACCESS'
  | 'ACCOUNT_COMPROMISE'
  | 'MALWARE'
  | 'RANSOMWARE'
  | 'PHISHING'
  | 'DATA_BREACH'
  | 'DATA_LEAK'
  | 'DATA_CORRUPTION'
  | 'PRIVILEGE_ABUSE'
  | 'INSIDER_THREAT'
  | 'DENIAL_OF_SERVICE'
  | 'SYSTEM_COMPROMISE'
  | 'CREDENTIAL_COMPROMISE'
  | 'SECURITY_MISCONFIGURATION'
  | 'SUSPICIOUS_ACTIVITY'
  | 'THIRD_PARTY_INCIDENT'
  | 'OTHER';

export type SecurityIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityIncidentStatus = 
  | 'REPORTED'
  | 'TRIAGE'
  | 'CONFIRMED'
  | 'CONTAINMENT'
  | 'ERADICATION'
  | 'RECOVERY'
  | 'MONITORING'
  | 'RESOLVED'
  | 'CLOSED';

export interface SecurityIncidentRecord {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  incident_type: SecurityIncidentType;
  severity: SecurityIncidentSeverity;
  status: SecurityIncidentStatus;
  organization_id: string;
  detected_at: string;
  reported_at: string;
  declared_at?: string;
  resolved_at?: string;
  closed_at?: string;
  commander_id?: string;
  affected_assets: string[];
  cia_impact: { confidentiality: boolean; integrity: boolean; availability: boolean };
  root_cause?: string;
  is_exercise: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContainmentActionRecord {
  id: string;
  incident_id: string;
  action_type: 'DISABLE_ACCOUNT' | 'REVOKE_SESSION' | 'BLOCK_ACCESS' | 'ISOLATE_SYSTEM' | 'DISABLE_INTEGRATION';
  target: string;
  operator_id: string;
  executed_at: string;
  status: 'EXECUTED' | 'FAILED';
  notes: string;
}

export interface EradicationActionRecord {
  id: string;
  incident_id: string;
  action_type: 'MALWARE_REMOVAL' | 'CREDENTIAL_RESET' | 'PATCH_APPLIED' | 'CONFIG_CORRECTION';
  description: string;
  operator_id: string;
  executed_at: string;
  verified_by: string;
}

export interface SecurityEvidenceRecord {
  id: string;
  evidence_number: string;
  incident_id: string;
  source: string;
  collector_id: string;
  collected_at: string;
  sha256_hash: string;
  classification: 'RESTRICTED' | 'CONFIDENTIAL';
  custody_chain: { event: string; actor_id: string; timestamp: string; reason: string }[];
}

export interface PostIncidentReviewRecord {
  id: string;
  review_number: string;
  incident_id: string;
  root_cause: string;
  containment_effective: boolean;
  lessons_learned: string[];
  recommendations: string[];
  reviewed_by: string;
  approved_at: string;
}

export interface SecurityIncidentDashboardMetrics {
  openIncidentsCount: number;
  criticalIncidentsCount: number;
  containmentActiveCount: number;
  recoveryActiveCount: number;
  resolvedIncidentsCount: number;
  totalEvidenceItemsCount: number;
  averageTimeToContainHours: number;
}

class CentralSecurityIncidentService {
  private static instance: CentralSecurityIncidentService;

  private incidents: SecurityIncidentRecord[] = [];
  private containments: ContainmentActionRecord[] = [];
  private numericActions: EradicationActionRecord[] = [];
  private evidenceRecords: SecurityEvidenceRecord[] = [];
  private reviews: PostIncidentReviewRecord[] = [];

  private incCounter = 100;
  private evdCounter = 100;
  private revCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralSecurityIncidentService {
    if (!CentralSecurityIncidentService.instance) {
      CentralSecurityIncidentService.instance = new CentralSecurityIncidentService();
    }
    return CentralSecurityIncidentService.instance;
  }

  private seedDemoData(): void {
    const incId = 'sec-seed-001';
    this.incidents.push({
      id: incId,
      incident_number: 'SEC-INC-2026-000001',
      title: 'Credential Stuffing Anomaly Detected on Student Portal',
      description: 'Multiple concurrent login failures detected from unauthorized geographic IPs targeting student accounts',
      incident_type: 'CREDENTIAL_COMPROMISE',
      severity: 'HIGH',
      status: 'RESOLVED',
      organization_id: 'inst-sit',
      detected_at: '2026-02-01T04:15:00Z',
      reported_at: '2026-02-01T04:20:00Z',
      declared_at: '2026-02-01T04:30:00Z',
      resolved_at: '2026-02-01T06:00:00Z',
      commander_id: 'emp-sec-001',
      affected_assets: ['Student Portal Auth Gateway', 'SSO Service'],
      cia_impact: { confidentiality: true, integrity: false, availability: false },
      root_cause: 'Compromised external credential dictionary attack bypass attempt',
      is_exercise: false,
      created_at: '2026-02-01T04:20:00Z',
      updated_at: '2026-02-01T06:00:00Z'
    });
  }

  // ─── INCIDENT REPORTING & TRIAGE ─────────────────────────────────────

  public reportIncident(params: {
    title: string;
    description: string;
    incidentType: SecurityIncidentType;
    severity: SecurityIncidentSeverity;
    organizationId: string;
    affectedAssets: string[];
    ciaImpact: { confidentiality: boolean; integrity: boolean; availability: boolean };
    isExercise?: boolean;
    context?: UserAuthorizationContext;
  }): SecurityIncidentRecord {
    this.incCounter += 1;
    const incNumber = `SEC-INC-2026-${String(this.incCounter).padStart(6, '0')}`;

    const incident: SecurityIncidentRecord = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incident_number: incNumber,
      title: params.title,
      description: params.description,
      incident_type: params.incidentType,
      severity: params.severity,
      status: 'REPORTED',
      organization_id: params.organizationId,
      detected_at: new Date().toISOString(),
      reported_at: new Date().toISOString(),
      affected_assets: params.affectedAssets,
      cia_impact: params.ciaImpact,
      is_exercise: params.isExercise || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.incidents.push(incident);
    return incident;
  }

  public triageIncident(params: {
    incidentId: string;
    commanderId: string;
    confirmedSeverity: SecurityIncidentSeverity;
  }): SecurityIncidentRecord {
    const inc = this.incidents.find(i => i.id === params.incidentId || i.incident_number === params.incidentId);
    if (!inc) throw new Error(`Incident ${params.incidentId} not found`);

    inc.commander_id = params.commanderId;
    inc.severity = params.confirmedSeverity;
    inc.status = 'CONFIRMED';
    inc.declared_at = new Date().toISOString();
    inc.updated_at = new Date().toISOString();

    return inc;
  }

  // ─── CONTAINMENT & ERADICATION ───────────────────────────────────────

  public executeContainment(params: {
    incidentId: string;
    actionType: 'DISABLE_ACCOUNT' | 'REVOKE_SESSION' | 'BLOCK_ACCESS' | 'ISOLATE_SYSTEM' | 'DISABLE_INTEGRATION';
    target: string;
    operatorId: string;
    notes?: string;
  }): ContainmentActionRecord {
    const inc = this.incidents.find(i => i.id === params.incidentId || i.incident_number === params.incidentId);
    if (!inc) throw new Error(`Incident ${params.incidentId} not found`);

    inc.status = 'CONTAINMENT';
    inc.updated_at = new Date().toISOString();

    const action: ContainmentActionRecord = {
      id: `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incident_id: params.incidentId,
      action_type: params.actionType,
      target: params.target,
      operator_id: params.operatorId,
      executed_at: new Date().toISOString(),
      status: 'EXECUTED',
      notes: params.notes || 'Automated/manual security containment action performed'
    };

    this.containments.push(action);
    return action;
  }

  public executeEradication(params: {
    incidentId: string;
    actionType: 'MALWARE_REMOVAL' | 'CREDENTIAL_RESET' | 'PATCH_APPLIED' | 'CONFIG_CORRECTION';
    description: string;
    operatorId: string;
    verifiedBy: string;
  }): EradicationActionRecord {
    const inc = this.incidents.find(i => i.id === params.incidentId || i.incident_number === params.incidentId);
    if (!inc) throw new Error(`Incident ${params.incidentId} not found`);

    inc.status = 'ERADICATION';
    inc.updated_at = new Date().toISOString();

    const action: EradicationActionRecord = {
      id: `erd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incident_id: params.incidentId,
      action_type: params.actionType,
      description: params.description,
      operator_id: params.operatorId,
      executed_at: new Date().toISOString(),
      verified_by: params.verifiedBy
    };

    this.numericActions.push(action);
    return action;
  }

  // ─── FORENSIC EVIDENCE & CHAIN OF CUSTODY ─────────────────────────────

  public collectEvidence(params: {
    incidentId: string;
    source: string;
    collectorId: string;
    sha256Hash: string;
    classification: 'RESTRICTED' | 'CONFIDENTIAL';
  }): SecurityEvidenceRecord {
    this.evdCounter += 1;
    const evdNumber = `EVD/2026/${String(this.evdCounter).padStart(6, '0')}`;

    const evidence: SecurityEvidenceRecord = {
      id: `evd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      evidence_number: evdNumber,
      incident_id: params.incidentId,
      source: params.source,
      collector_id: params.collectorId,
      collected_at: new Date().toISOString(),
      sha256_hash: params.sha256Hash,
      classification: params.classification,
      custody_chain: [
        {
          event: 'COLLECTED',
          actor_id: params.collectorId,
          timestamp: new Date().toISOString(),
          reason: 'Initial forensic acquisition and cryptographic hashing'
        }
      ]
    };

    this.evidenceRecords.push(evidence);
    return evidence;
  }

  public transferCustody(params: {
    evidenceId: string;
    actorId: string;
    event: string;
    reason: string;
  }): SecurityEvidenceRecord {
    const evd = this.evidenceRecords.find(e => e.id === params.evidenceId || e.evidence_number === params.evidenceId);
    if (!evd) throw new Error(`Evidence ${params.evidenceId} not found`);

    evd.custody_chain.push({
      event: params.event,
      actor_id: params.actorId,
      timestamp: new Date().toISOString(),
      reason: params.reason
    });

    return evd;
  }

  // ─── POST-INCIDENT REVIEW & CLOSURE ──────────────────────────────────

  public createPostIncidentReview(params: {
    incidentId: string;
    rootCause: string;
    containmentEffective: boolean;
    lessonsLearned: string[];
    recommendations: string[];
    reviewedBy: string;
  }): PostIncidentReviewRecord {
    this.revCounter += 1;
    const revNumber = `PIR/2026/${String(this.revCounter).padStart(6, '0')}`;

    const review: PostIncidentReviewRecord = {
      id: `pir-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      review_number: revNumber,
      incident_id: params.incidentId,
      root_cause: params.rootCause,
      containment_effective: params.containmentEffective,
      lessons_learned: params.lessonsLearned,
      recommendations: params.recommendations,
      reviewed_by: params.reviewedBy,
      approved_at: new Date().toISOString()
    };

    this.reviews.push(review);

    const inc = this.incidents.find(i => i.id === params.incidentId || i.incident_number === params.incidentId);
    if (inc) {
      inc.root_cause = params.rootCause;
      inc.status = 'RESOLVED';
      inc.resolved_at = new Date().toISOString();
      inc.updated_at = new Date().toISOString();
    }

    return review;
  }

  public closeIncident(incidentId: string): SecurityIncidentRecord {
    const inc = this.incidents.find(i => i.id === incidentId || i.incident_number === incidentId);
    if (!inc) throw new Error(`Incident ${incidentId} not found`);

    // Closure Validation: Must have root cause & post incident review
    const hasReview = this.reviews.some(r => r.incident_id === inc.id);
    if (!hasReview || !inc.root_cause) {
      throw new Error(`Incident Closure Blocked: Incident ${inc.incident_number} requires approved Post-Incident Review and documented Root Cause before closing`);
    }

    inc.status = 'CLOSED';
    inc.closed_at = new Date().toISOString();
    inc.updated_at = new Date().toISOString();

    return inc;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getSecurityIncidentDashboardMetrics(context?: UserAuthorizationContext): SecurityIncidentDashboardMetrics {
    // Only count non-exercise incidents in operational dashboard
    const prodIncidents = this.incidents.filter(i => !i.is_exercise);

    const openIncidentsCount = prodIncidents.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length;
    const criticalIncidentsCount = prodIncidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'CLOSED').length;
    const containmentActiveCount = prodIncidents.filter(i => i.status === 'CONTAINMENT').length;
    const recoveryActiveCount = prodIncidents.filter(i => i.status === 'RECOVERY').length;
    const resolvedIncidentsCount = prodIncidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    const totalEvidenceItemsCount = this.evidenceRecords.length;

    return {
      openIncidentsCount,
      criticalIncidentsCount,
      containmentActiveCount,
      recoveryActiveCount,
      resolvedIncidentsCount,
      totalEvidenceItemsCount,
      averageTimeToContainHours: 1.5
    };
  }
}

export const centralSecurityIncidentService = CentralSecurityIncidentService.getInstance();
