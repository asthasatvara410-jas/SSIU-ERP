import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';

export type DataDomain = 
  | 'STUDENT'
  | 'ACADEMIC'
  | 'ADMISSION'
  | 'FACULTY'
  | 'HR'
  | 'FINANCE'
  | 'FEES'
  | 'LIBRARY'
  | 'HOSTEL'
  | 'DOCUMENT'
  | 'SECURITY'
  | 'PRIVACY';

export type QualityDimension = 'ACCURACY' | 'COMPLETENESS' | 'CONSISTENCY' | 'VALIDITY' | 'UNIQUENESS' | 'TIMELINESS';
export type QualityRuleType = 'NOT_NULL' | 'UNIQUE' | 'FORMAT' | 'RANGE' | 'CROSS_FIELD' | 'BUSINESS_LOGIC';
export type DQIssueStatus = 'OPEN' | 'ASSIGNED' | 'UNDER_REVIEW' | 'REMEDIATION' | 'RESOLVED' | 'CLOSED';
export type DuplicateStatus = 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'MERGED';

export interface DataEntityDefinitionRecord {
  id: string;
  code: string;
  name: string;
  domain: DataDomain;
  owner_id: string;
  steward_id: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  system_reference: string;
  status: 'ACTIVE' | 'UNDER_REVIEW';
}

export interface DataQualityRuleRecord {
  id: string;
  rule_code: string;
  name: string;
  domain: DataDomain;
  entity_code: string;
  attribute_code: string;
  dimension: QualityDimension;
  rule_type: QualityRuleType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'DISABLED';
  version: number;
}

export interface DataQualityIssueRecord {
  id: string;
  issue_number: string;
  rule_code: string;
  entity_code: string;
  record_reference: string;
  attribute_code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: DQIssueStatus;
  detected_at: string;
  owner_id: string;
  steward_id: string;
  resolution_notes?: string;
}

export interface DuplicateCandidateRecord {
  id: string;
  entity_code: string;
  record_a_id: string;
  record_b_id: string;
  match_score: number; // 0-100
  organization_id_a: string;
  organization_id_b: string;
  status: DuplicateStatus;
  reviewed_by?: string;
  decision?: string;
}

export interface DataLineageRecord {
  id: string;
  entity_code: string;
  source_system: string;
  transformation_rule: string;
  target_system: string;
  downstream_dependencies: string[];
}

export interface ReconciliationRunRecord {
  id: string;
  reconciliation_code: string;
  source_system: string;
  target_system: string;
  source_count: number;
  target_count: number;
  difference_count: number;
  status: 'MATCHED' | 'MISMATCHED' | 'UNDER_REVIEW';
  run_at: string;
}

export interface DataGovernanceDashboardMetrics {
  governedDomainsCount: number;
  dataEntitiesCount: number;
  overallQualityScorePercent: number;
  openQualityIssuesCount: number;
  duplicateCandidatesCount: number;
  reconciliationsMatchedPercent: number;
  governancePosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralDataGovernanceService {
  private static instance: CentralDataGovernanceService;

  private entities: DataEntityDefinitionRecord[] = [];
  private rules: DataQualityRuleRecord[] = [];
  private issues: DataQualityIssueRecord[] = [];
  private duplicates: DuplicateCandidateRecord[] = [];
  private lineages: DataLineageRecord[] = [];
  private reconciliations: ReconciliationRunRecord[] = [];

  private isCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDataGovernanceService {
    if (!CentralDataGovernanceService.instance) {
      CentralDataGovernanceService.instance = new CentralDataGovernanceService();
    }
    return CentralDataGovernanceService.instance;
  }

  private seedDemoData(): void {
    // Seed Governed Data Entity
    this.entities.push({
      id: 'ent-seed-001',
      code: 'STUDENT_MASTER_RECORD',
      name: 'Central Student Master Identity & Academic Dossier',
      domain: 'STUDENT',
      owner_id: 'emp-reg-001',
      steward_id: 'emp-steward-001',
      classification: 'RESTRICTED',
      system_reference: 'Central Dossier DMS & Admissions Master',
      status: 'ACTIVE'
    });

    // Seed Quality Rules
    this.rules.push({
      id: 'dqr-seed-001',
      rule_code: 'DQR-STUDENT-ENROLLMENT-NOTNULL',
      name: 'Mandatory Unique Enrollment Number Format',
      domain: 'STUDENT',
      entity_code: 'STUDENT_MASTER_RECORD',
      attribute_code: 'enrollment_number',
      dimension: 'COMPLETENESS',
      rule_type: 'NOT_NULL',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      version: 1
    });

    // Seed Lineage
    this.lineages.push({
      id: 'lin-seed-001',
      entity_code: 'STUDENT_MASTER_RECORD',
      source_system: 'Online Admissions Intake Portal',
      transformation_rule: 'Verify Aadhaar/Passport checksum and generate permanent enrollment number',
      target_system: 'Central Academic Master & Examination Vault',
      downstream_dependencies: ['Fee Invoicing Ledger', 'Transcript Generation Engine', 'Government NIRF Export']
    });
  }

  // ─── DATA QUALITY RULES & PROFILING ──────────────────────────────────

  public createQualityRule(params: {
    ruleCode: string;
    name: string;
    domain: DataDomain;
    entityCode: string;
    attributeCode: string;
    dimension: QualityDimension;
    ruleType: QualityRuleType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }): DataQualityRuleRecord {
    const rule: DataQualityRuleRecord = {
      id: `dqr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rule_code: params.ruleCode,
      name: params.name,
      domain: params.domain,
      entity_code: params.entityCode,
      attribute_code: params.attributeCode,
      dimension: params.dimension,
      rule_type: params.ruleType,
      severity: params.severity,
      status: 'ACTIVE',
      version: 1
    };

    this.rules.push(rule);
    return rule;
  }

  public runDataQualityProfile(params: {
    entityCode: string;
    records: Record<string, any>[];
  }): { qualityScorePercent: number; issuesGenerated: DataQualityIssueRecord[] } {
    const applicableRules = this.rules.filter(r => r.entity_code === params.entityCode && r.status === 'ACTIVE');
    let totalChecks = 0;
    let failedChecks = 0;
    const issuesGenerated: DataQualityIssueRecord[] = [];

    for (const record of params.records) {
      for (const rule of applicableRules) {
        totalChecks += 1;
        const val = record[rule.attribute_code];
        let isPassed = true;

        if (rule.rule_type === 'NOT_NULL' && (!val || String(val).trim() === '')) {
          isPassed = false;
        } else if (rule.rule_type === 'FORMAT' && typeof val === 'string' && !val.includes('@') && rule.attribute_code.includes('email')) {
          isPassed = false;
        }

        if (!isPassed) {
          failedChecks += 1;
          this.isCounter += 1;
          const issue: DataQualityIssueRecord = {
            id: `iss-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            issue_number: `DQ-2026-${String(this.isCounter).padStart(6, '0')}`,
            rule_code: rule.rule_code,
            entity_code: params.entityCode,
            record_reference: record.id || 'RECORD_REF',
            attribute_code: rule.attribute_code,
            severity: rule.severity,
            status: 'OPEN',
            detected_at: new Date().toISOString(),
            owner_id: 'emp-reg-001',
            steward_id: 'emp-steward-001'
          };
          this.issues.push(issue);
          issuesGenerated.push(issue);
        }
      }
    }

    const score = totalChecks > 0 ? Math.round(((totalChecks - failedChecks) / totalChecks) * 100) : 100;
    return { qualityScorePercent: score, issuesGenerated };
  }

  // ─── DUPLICATE MANAGEMENT & MERGE CONTROL ─────────────────────────────

  public detectDuplicateCandidate(params: {
    entityCode: string;
    recordAId: string;
    recordBId: string;
    matchScore: number;
    orgA: string;
    orgB: string;
  }): DuplicateCandidateRecord {
    const candidate: DuplicateCandidateRecord = {
      id: `dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entity_code: params.entityCode,
      record_a_id: params.recordAId,
      record_b_id: params.recordBId,
      match_score: params.matchScore,
      organization_id_a: params.orgA,
      organization_id_b: params.orgB,
      status: 'UNDER_REVIEW'
    };

    this.duplicates.push(candidate);
    return candidate;
  }

  public mergeDuplicate(duplicateId: string, authorizedBy: string): DuplicateCandidateRecord {
    const candidate = this.duplicates.find(d => d.id === duplicateId);
    if (!candidate) throw new Error(`Duplicate candidate ${duplicateId} not found`);

    // Cross-organization merge protection
    if (candidate.organization_id_a !== candidate.organization_id_b) {
      throw new Error(`Unauthorized Cross-Organization Merge Blocked: Cannot merge records across distinct organization scopes (${candidate.organization_id_a} vs ${candidate.organization_id_b})`);
    }

    candidate.status = 'MERGED';
    candidate.reviewed_by = authorizedBy;
    candidate.decision = `Authoritative Golden Record merged by Data Steward ${authorizedBy}`;

    return candidate;
  }

  // ─── DATA LINEAGE & IMPACT ANALYSIS ──────────────────────────────────

  public runImpactAnalysis(entityCode: string): { entityCode: string; downstreamSystems: string[]; dependenciesCount: number } {
    const lineage = this.lineages.find(l => l.entity_code === entityCode);
    const deps = lineage ? lineage.downstream_dependencies : ['None'];
    return {
      entityCode,
      downstreamSystems: deps,
      dependenciesCount: deps.length
    };
  }

  // ─── DATA RECONCILIATION ENGINE ──────────────────────────────────────

  public executeReconciliation(params: {
    reconciliationCode: string;
    sourceSystem: string;
    targetSystem: string;
    sourceCount: number;
    targetCount: number;
  }): ReconciliationRunRecord {
    const diff = Math.abs(params.sourceCount - params.targetCount);

    const rec: ReconciliationRunRecord = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reconciliation_code: params.reconciliationCode,
      source_system: params.sourceSystem,
      target_system: params.targetSystem,
      source_count: params.sourceCount,
      target_count: params.targetCount,
      difference_count: diff,
      status: diff === 0 ? 'MATCHED' : 'MISMATCHED',
      run_at: new Date().toISOString()
    };

    this.reconciliations.push(rec);
    return rec;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getDataGovernanceDashboardMetrics(context?: UserAuthorizationContext): DataGovernanceDashboardMetrics {
    const governedDomainsCount = Array.from(new Set(this.entities.map(e => e.domain))).length;
    const dataEntitiesCount = this.entities.length;
    const openQualityIssuesCount = this.issues.filter(i => i.status === 'OPEN').length;
    const duplicateCandidatesCount = this.duplicates.filter(d => d.status === 'UNDER_REVIEW').length;

    const matchedRecs = this.reconciliations.filter(r => r.status === 'MATCHED').length;
    const totalRecs = this.reconciliations.length;
    const recMatchedPercent = totalRecs > 0 ? Math.round((matchedRecs / totalRecs) * 100) : 100;

    return {
      governedDomainsCount: governedDomainsCount || 1,
      dataEntitiesCount,
      overallQualityScorePercent: 96,
      openQualityIssuesCount,
      duplicateCandidatesCount,
      reconciliationsMatchedPercent: recMatchedPercent,
      governancePosture: 'HEALTHY'
    };
  }
}

export const centralDataGovernanceService = CentralDataGovernanceService.getInstance();
