import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';
import { centralDocumentRegulatoryComplianceService } from './centralDocumentRegulatoryComplianceService';

export type RiskCategory = 
  | 'ACADEMIC'
  | 'STUDENT'
  | 'ADMISSION'
  | 'EXAMINATION'
  | 'FACULTY'
  | 'HR'
  | 'FINANCE'
  | 'DOCUMENT'
  | 'DATA'
  | 'SECURITY'
  | 'PRIVACY'
  | 'RESEARCH'
  | 'COMPLIANCE'
  | 'REPUTATION'
  | 'STRATEGIC'
  | 'TECHNOLOGY'
  | 'OTHER';

export type RiskStatus = 
  | 'IDENTIFIED'
  | 'ASSESSMENT_PENDING'
  | 'ASSESSED'
  | 'TREATMENT_REQUIRED'
  | 'TREATMENT_IN_PROGRESS'
  | 'MONITORED'
  | 'ACCEPTED'
  | 'MITIGATED'
  | 'CLOSED'
  | 'RETIRED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TreatmentStrategy = 'MITIGATE' | 'TRANSFER' | 'AVOID' | 'ACCEPT';
export type KRIStatus = 'NORMAL' | 'WARNING' | 'BREACH' | 'ERROR';

export interface RiskRegisterRecord {
  id: string;
  risk_number: string;
  name: string;
  description: string;
  category: RiskCategory;
  organization_id: string;
  owner_id: string;
  status: RiskStatus;
  risk_level: RiskLevel;
  inherent_score: number;
  residual_score: number;
  likelihood: number;
  impact: number;
  has_control_gap: boolean;
  identified_at: string;
  last_assessed_at: string;
  next_review_at: string;
  created_at: string;
  updated_at: string;
}

export interface RiskControlMappingRecord {
  id: string;
  risk_id: string;
  control_code: string;
  coverage_type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'COMPENSATING';
  coverage_strength: 'FULL' | 'PARTIAL' | 'WEAK';
  mapped_at: string;
  mapped_by: string;
}

export interface RiskTreatmentRecord {
  id: string;
  treatment_number: string;
  risk_id: string;
  strategy: TreatmentStrategy;
  description: string;
  owner_id: string;
  due_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';
  expected_residual_score: number;
  evidence_reference?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface RiskAcceptanceRecord {
  id: string;
  risk_id: string;
  reason: string;
  accepted_by: string;
  approved_by: string;
  approved_at: string;
  expires_at: string;
  status: 'REQUESTED' | 'APPROVED' | 'EXPIRED' | 'CANCELLED';
}

export interface KeyRiskIndicatorRecord {
  id: string;
  risk_id: string;
  name: string;
  metric: string;
  threshold_value: number;
  current_value: number;
  status: KRIStatus;
  owner_id: string;
  last_evaluated_at: string;
}

export interface RiskDashboardMetrics {
  totalRisksCount: number;
  highAndCriticalRisksCount: number;
  overToleranceRisksCount: number;
  controlGapRisksCount: number;
  activeTreatmentsCount: number;
  kriBreachesCount: number;
  averageInherentScore: number;
  averageResidualScore: number;
}

class CentralDocumentRiskManagementService {
  private static instance: CentralDocumentRiskManagementService;

  private risks: RiskRegisterRecord[] = [];
  private controlMappings: RiskControlMappingRecord[] = [];
  private treatments: RiskTreatmentRecord[] = [];
  private acceptances: RiskAcceptanceRecord[] = [];
  private kris: KeyRiskIndicatorRecord[] = [];

  private rskCounter = 100;
  private trtCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDocumentRiskManagementService {
    if (!CentralDocumentRiskManagementService.instance) {
      CentralDocumentRiskManagementService.instance = new CentralDocumentRiskManagementService();
    }
    return CentralDocumentRiskManagementService.instance;
  }

  private seedDemoData(): void {
    const riskId = 'rsk-seed-001';
    this.risks.push({
      id: riskId,
      risk_number: 'RISK-2026-000001',
      name: 'Tampering or Silent Data Loss in Archival Degree Records',
      description: 'Potential integrity corruption of student certificates during long-term storage across decentralized repositories',
      category: 'DOCUMENT',
      organization_id: 'inst-sit',
      owner_id: 'emp-sec-001',
      status: 'ASSESSED',
      risk_level: 'LOW',
      inherent_score: 20, // 5 * 4
      residual_score: 4,  // Mitigated by DOC-CTRL-001
      likelihood: 4,
      impact: 5,
      has_control_gap: false,
      identified_at: '2026-01-01T00:00:00Z',
      last_assessed_at: '2026-01-15T00:00:00Z',
      next_review_at: '2026-07-15T00:00:00Z',
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z'
    });

    this.controlMappings.push({
      id: 'rcm-seed-001',
      risk_id: riskId,
      control_code: 'DOC-CTRL-001',
      coverage_type: 'PREVENTIVE',
      coverage_strength: 'FULL',
      mapped_at: '2026-01-15T00:00:00Z',
      mapped_by: 'emp-sec-001'
    });
  }

  // ─── RISK CREATION & SCORING ──────────────────────────────────────────

  public calculateRiskLevel(score: number): RiskLevel {
    if (score >= 20) return 'CRITICAL';
    if (score >= 12) return 'HIGH';
    if (score >= 6) return 'MEDIUM';
    return 'LOW';
  }

  public createRisk(params: {
    name: string;
    description: string;
    category: RiskCategory;
    organizationId: string;
    ownerId: string;
    likelihood: number;
    impact: number;
    context?: UserAuthorizationContext;
  }): RiskRegisterRecord {
    this.rskCounter += 1;
    const riskNumber = `RISK-2026/${String(this.rskCounter).padStart(6, '0')}`;
    const inherentScore = params.likelihood * params.impact;
    const riskLevel = this.calculateRiskLevel(inherentScore);

    const risk: RiskRegisterRecord = {
      id: `rsk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      risk_number: riskNumber,
      name: params.name,
      description: params.description,
      category: params.category,
      organization_id: params.organizationId,
      owner_id: params.ownerId,
      status: 'IDENTIFIED',
      risk_level: riskLevel,
      inherent_score: inherentScore,
      residual_score: inherentScore, // Initially equals inherent before controls
      likelihood: params.likelihood,
      impact: params.impact,
      has_control_gap: true,
      identified_at: new Date().toISOString(),
      last_assessed_at: new Date().toISOString(),
      next_review_at: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.risks.push(risk);
    return risk;
  }

  // ─── CONTROL MAPPING & RESIDUAL RISK ─────────────────────────────────

  public mapControlToRisk(params: {
    riskId: string;
    controlCode: string;
    coverageType: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'COMPENSATING';
    coverageStrength: 'FULL' | 'PARTIAL' | 'WEAK';
    mappedBy: string;
  }): { risk: RiskRegisterRecord; mapping: RiskControlMappingRecord } {
    const risk = this.risks.find(r => r.id === params.riskId || r.risk_number === params.riskId);
    if (!risk) throw new Error(`Risk ${params.riskId} not found`);

    const mapping: RiskControlMappingRecord = {
      id: `rcm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      risk_id: risk.id,
      control_code: params.controlCode,
      coverage_type: params.coverageType,
      coverage_strength: params.coverageStrength,
      mapped_at: new Date().toISOString(),
      mapped_by: params.mappedBy
    };

    this.controlMappings.push(mapping);
    risk.has_control_gap = false;

    // Calculate residual score based on control effectiveness
    const eff = centralDocumentComplianceControlService.assessControlEffectiveness(params.controlCode);
    let mitigationFactor = 0.5; // default partial mitigation
    if (eff === 'EFFECTIVE' && params.coverageStrength === 'FULL') {
      mitigationFactor = 0.2;
    } else if (eff === 'INEFFECTIVE') {
      mitigationFactor = 0.9;
    }

    risk.residual_score = Math.max(1, Math.round(risk.inherent_score * mitigationFactor));
    risk.risk_level = this.calculateRiskLevel(risk.residual_score);
    risk.status = risk.residual_score > 10 ? 'TREATMENT_REQUIRED' : 'ASSESSED';
    risk.updated_at = new Date().toISOString();

    return { risk, mapping };
  }

  // ─── RISK TREATMENT & VERIFICATION ───────────────────────────────────

  public createRiskTreatment(params: {
    riskId: string;
    strategy: TreatmentStrategy;
    description: string;
    ownerId: string;
    dueDate: string;
    expectedResidualScore: number;
  }): RiskTreatmentRecord {
    const risk = this.risks.find(r => r.id === params.riskId || r.risk_number === params.riskId);
    if (!risk) throw new Error(`Risk ${params.riskId} not found`);

    this.trtCounter += 1;
    const treatmentNumber = `TRT/2026/${String(this.trtCounter).padStart(6, '0')}`;

    const treatment: RiskTreatmentRecord = {
      id: `trt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      treatment_number: treatmentNumber,
      risk_id: risk.id,
      strategy: params.strategy,
      description: params.description,
      owner_id: params.ownerId,
      due_date: params.dueDate,
      status: 'IN_PROGRESS',
      expected_residual_score: params.expectedResidualScore
    };

    this.treatments.push(treatment);
    risk.status = 'TREATMENT_IN_PROGRESS';
    return treatment;
  }

  public verifyTreatmentCompletion(params: {
    treatmentId: string;
    verifiedBy: string;
    actualResidualScore: number;
    evidenceReference?: string;
  }): { treatment: RiskTreatmentRecord; risk: RiskRegisterRecord } {
    const treatment = this.treatments.find(t => t.id === params.treatmentId);
    if (!treatment) throw new Error(`Treatment ${params.treatmentId} not found`);

    const risk = this.risks.find(r => r.id === treatment.risk_id);
    if (!risk) throw new Error(`Risk for treatment ${params.treatmentId} not found`);

    treatment.status = 'VERIFIED';
    treatment.verified_by = params.verifiedBy;
    treatment.verified_at = new Date().toISOString();
    treatment.evidence_reference = params.evidenceReference;

    // Reassess risk with new residual score
    risk.residual_score = params.actualResidualScore;
    risk.risk_level = this.calculateRiskLevel(risk.residual_score);
    risk.status = risk.residual_score <= 10 ? 'MITIGATED' : 'MONITORED';
    risk.last_assessed_at = new Date().toISOString();

    return { treatment, risk };
  }

  // ─── RISK ACCEPTANCE & EXPIRY ────────────────────────────────────────

  public requestRiskAcceptance(params: {
    riskId: string;
    reason: string;
    acceptedBy: string;
    approvedBy: string;
    durationDays?: number;
  }): RiskAcceptanceRecord {
    const risk = this.risks.find(r => r.id === params.riskId || r.risk_number === params.riskId);
    if (!risk) throw new Error(`Risk ${params.riskId} not found`);

    const days = params.durationDays || 90;
    const acceptance: RiskAcceptanceRecord = {
      id: `acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      risk_id: risk.id,
      reason: params.reason,
      accepted_by: params.acceptedBy,
      approved_by: params.approvedBy,
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
      status: 'APPROVED'
    };

    this.acceptances.push(acceptance);
    risk.status = 'ACCEPTED';
    return acceptance;
  }

  // ─── KEY RISK INDICATOR (KRI) MONITORING ─────────────────────────────

  public recordKRI(params: {
    riskId: string;
    name: string;
    metric: string;
    thresholdValue: number;
    currentValue: number;
    ownerId: string;
  }): KeyRiskIndicatorRecord {
    const risk = this.risks.find(r => r.id === params.riskId || r.risk_number === params.riskId);
    if (!risk) throw new Error(`Risk ${params.riskId} not found`);

    const isBreached = params.currentValue >= params.thresholdValue;
    const kri: KeyRiskIndicatorRecord = {
      id: `kri-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      risk_id: risk.id,
      name: params.name,
      metric: params.metric,
      threshold_value: params.thresholdValue,
      current_value: params.currentValue,
      status: isBreached ? 'BREACH' : 'NORMAL',
      owner_id: params.ownerId,
      last_evaluated_at: new Date().toISOString()
    };

    this.kris.push(kri);
    if (isBreached && risk.status === 'ASSESSED') {
      risk.status = 'TREATMENT_REQUIRED';
    }

    return kri;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getRiskDashboardMetrics(context?: UserAuthorizationContext): RiskDashboardMetrics {
    const totalRisksCount = this.risks.length;
    const highAndCriticalRisksCount = this.risks.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length;
    const overToleranceRisksCount = this.risks.filter(r => r.residual_score > 10).length;
    const controlGapRisksCount = this.risks.filter(r => r.has_control_gap).length;
    const activeTreatmentsCount = this.treatments.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PLANNED').length;
    const kriBreachesCount = this.kris.filter(k => k.status === 'BREACH').length;

    const totalInherent = this.risks.reduce((acc, r) => acc + r.inherent_score, 0);
    const totalResidual = this.risks.reduce((acc, r) => acc + r.residual_score, 0);

    const averageInherentScore = totalRisksCount > 0 ? Math.round((totalInherent / totalRisksCount) * 10) / 10 : 0;
    const averageResidualScore = totalRisksCount > 0 ? Math.round((totalResidual / totalRisksCount) * 10) / 10 : 0;

    return {
      totalRisksCount,
      highAndCriticalRisksCount,
      overToleranceRisksCount,
      controlGapRisksCount,
      activeTreatmentsCount,
      kriBreachesCount,
      averageInherentScore,
      averageResidualScore
    };
  }
}

export const centralDocumentRiskManagementService = CentralDocumentRiskManagementService.getInstance();
