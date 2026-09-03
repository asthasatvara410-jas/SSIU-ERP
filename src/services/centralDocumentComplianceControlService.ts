import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentRegulatoryComplianceService } from './centralDocumentRegulatoryComplianceService';
import { centralDocumentInternalAuditService } from './centralDocumentInternalAuditService';

export type ControlType = 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'DIRECTIVE' | 'COMPENSATING';
export type ControlCategory = 
  | 'DOCUMENT'
  | 'ACCESS'
  | 'SECURITY'
  | 'RETENTION'
  | 'ARCHIVAL'
  | 'DISPOSITION'
  | 'VERSIONING'
  | 'APPROVAL'
  | 'DATA_QUALITY'
  | 'PRIVACY'
  | 'COMPLIANCE'
  | 'AUDIT'
  | 'OTHER';

export type ControlFrequency = 
  | 'CONTINUOUS'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'YEARLY'
  | 'EVENT_BASED'
  | 'MANUAL';

export type ControlStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'RETIRED';
export type ControlEffectivenessStatus = 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'NOT_TESTED';
export type ControlTestMethod = 'INSPECTION' | 'OBSERVATION' | 'INQUIRY' | 'REPERFORMANCE' | 'AUTOMATED' | 'DATA_ANALYSIS' | 'SAMPLING';
export type DeficiencyType = 'DESIGN_DEFICIENCY' | 'IMPLEMENTATION_DEFICIENCY' | 'OPERATING_DEFICIENCY' | 'EVIDENCE_DEFICIENCY' | 'DOCUMENTATION_DEFICIENCY' | 'MONITORING_DEFICIENCY';

export interface ComplianceControlRecord {
  id: string;
  control_code: string;
  name: string;
  description: string;
  control_type: ControlType;
  category: ControlCategory;
  objective: string;
  owner_id: string;
  organization_id: string;
  frequency: ControlFrequency;
  status: ControlStatus;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  version: number;
  mapped_requirement_codes: string[];
  mapped_policy_codes: string[];
  replaced_by_control_code?: string;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ControlTestRecord {
  id: string;
  test_number: string;
  control_id: string;
  control_version: number;
  audit_id?: string;
  tested_by: string;
  tested_at: string;
  method: ControlTestMethod;
  sample_size: number;
  result: 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_TESTED' | 'NOT_APPLICABLE';
  evidence_reference?: string;
  notes: string;
}

export interface ControlDeficiencyRecord {
  id: string;
  deficiency_number: string;
  control_id: string;
  test_id?: string;
  deficiency_type: DeficiencyType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  root_cause: string;
  owner_id: string;
  due_date: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATION' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CLOSED' | 'ACCEPTED_RISK';
  remediation_action?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface ControlMonitorRecord {
  id: string;
  monitor_number: string;
  control_id: string;
  rule_name: string;
  result: 'PASS' | 'FAIL' | 'WARNING' | 'ERROR';
  executed_at: string;
  details: string;
}

export interface ControlMatrixItem {
  requirementCode: string;
  riskLevel: string;
  controlCode: string;
  controlName: string;
  ownerId: string;
  frequency: ControlFrequency;
  effectiveness: ControlEffectivenessStatus;
}

export interface ControlDashboardMetrics {
  totalControlsCount: number;
  activeControlsCount: number;
  effectiveControlsCount: number;
  partiallyEffectiveCount: number;
  ineffectiveCount: number;
  untestedControlsCount: number;
  openDeficienciesCount: number;
  criticalDeficienciesCount: number;
}

class CentralDocumentComplianceControlService {
  private static instance: CentralDocumentComplianceControlService;

  private controls: ComplianceControlRecord[] = [];
  private tests: ControlTestRecord[] = [];
  private deficiencies: ControlDeficiencyRecord[] = [];
  private monitors: ControlMonitorRecord[] = [];

  private tstCounter = 100;
  private defCounter = 100;
  private monCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDocumentComplianceControlService {
    if (!CentralDocumentComplianceControlService.instance) {
      CentralDocumentComplianceControlService.instance = new CentralDocumentComplianceControlService();
    }
    return CentralDocumentComplianceControlService.instance;
  }

  private seedDemoData(): void {
    this.controls.push(
      {
        id: 'ctrl-001',
        control_code: 'DOC-CTRL-001',
        name: 'Mandatory Cryptographic Hash Verification on Ingestion',
        description: 'Every uploaded or generated document must have a SHA-256 integrity hash calculated and stored immutably.',
        control_type: 'PREVENTIVE',
        category: 'DOCUMENT',
        objective: 'Prevent silent data tampering and ensure forensic authenticity of university records',
        owner_id: 'emp-sec-001',
        organization_id: 'inst-sit',
        frequency: 'CONTINUOUS',
        status: 'ACTIVE',
        risk_level: 'HIGH',
        version: 1,
        mapped_requirement_codes: ['UGC_DEGREE_ARCHIVE_MANDATE'],
        mapped_policy_codes: ['POL_MIGRATION_RETENTION_7Y'],
        effective_from: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T10:00:00Z',
        updated_at: '2026-01-01T10:00:00Z'
      },
      {
        id: 'ctrl-002',
        control_code: 'DOC-CTRL-002',
        name: 'Dual-Control Signoff on Permanent Record Disposal',
        description: 'Disposal of records requires separate requester and approver officers to avoid unauthorized destruction.',
        control_type: 'PREVENTIVE',
        category: 'DISPOSITION',
        objective: 'Mitigate risk of accidental or malicious loss of statutory compliance records',
        owner_id: 'emp-reg-001',
        organization_id: 'inst-sit',
        frequency: 'EVENT_BASED',
        status: 'ACTIVE',
        risk_level: 'CRITICAL',
        version: 1,
        mapped_requirement_codes: ['STATE_ADMISSION_RESERVATION_EVID'],
        mapped_policy_codes: ['POL_MIGRATION_RETENTION_7Y'],
        effective_from: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T10:00:00Z',
        updated_at: '2026-01-01T10:00:00Z'
      }
    );
  }

  // ─── CONTROL MASTER MANAGEMENT ────────────────────────────────────────

  public createControl(params: {
    controlCode: string;
    name: string;
    description: string;
    controlType: ControlType;
    category: ControlCategory;
    objective: string;
    ownerId: string;
    organizationId: string;
    frequency: ControlFrequency;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    mappedRequirements?: string[];
    mappedPolicies?: string[];
    context?: UserAuthorizationContext;
  }): ComplianceControlRecord {
    const existing = this.controls.find(c => c.control_code === params.controlCode);
    if (existing) {
      throw new Error(`Control code ${params.controlCode} already exists`);
    }

    const control: ComplianceControlRecord = {
      id: `ctrl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      control_code: params.controlCode,
      name: params.name,
      description: params.description,
      control_type: params.controlType,
      category: params.category,
      objective: params.objective,
      owner_id: params.ownerId,
      organization_id: params.organizationId,
      frequency: params.frequency,
      status: 'ACTIVE',
      risk_level: params.riskLevel,
      version: 1,
      mapped_requirement_codes: params.mappedRequirements || [],
      mapped_policy_codes: params.mappedPolicies || [],
      effective_from: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.controls.push(control);
    return control;
  }

  public publishControlVersion(controlCode: string, updates: Partial<ComplianceControlRecord>): ComplianceControlRecord {
    const control = this.controls.find(c => c.control_code === controlCode);
    if (!control) throw new Error(`Control ${controlCode} not found`);

    control.version += 1;
    Object.assign(control, updates);
    control.updated_at = new Date().toISOString();

    return control;
  }

  public retireControl(controlCode: string, replacedByCode?: string): ComplianceControlRecord {
    const control = this.controls.find(c => c.control_code === controlCode);
    if (!control) throw new Error(`Control ${controlCode} not found`);

    control.status = 'RETIRED';
    if (replacedByCode) {
      control.replaced_by_control_code = replacedByCode;
    }
    control.updated_at = new Date().toISOString();

    return control;
  }

  // ─── CONTROL TESTING & EFFECTIVENESS ─────────────────────────────────

  public executeControlTest(params: {
    controlCode: string;
    auditId?: string;
    testedBy: string;
    method: ControlTestMethod;
    sampleSize: number;
    result: 'PASS' | 'FAIL' | 'PARTIAL';
    evidenceReference?: string;
    notes: string;
  }): { test: ControlTestRecord; deficiency?: ControlDeficiencyRecord } {
    const control = this.controls.find(c => c.control_code === params.controlCode);
    if (!control) throw new Error(`Control ${params.controlCode} not found`);

    this.tstCounter += 1;
    const testNumber = `TST/2026/${String(this.tstCounter).padStart(6, '0')}`;

    const test: ControlTestRecord = {
      id: `tst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      test_number: testNumber,
      control_id: control.id,
      control_version: control.version,
      audit_id: params.auditId,
      tested_by: params.testedBy,
      tested_at: new Date().toISOString(),
      method: params.method,
      sample_size: params.sampleSize,
      result: params.result,
      evidence_reference: params.evidenceReference,
      notes: params.notes
    };

    this.tests.push(test);

    let deficiency: ControlDeficiencyRecord | undefined;
    if (params.result === 'FAIL') {
      this.defCounter += 1;
      const defNumber = `DEF/2026/${String(this.defCounter).padStart(6, '0')}`;

      deficiency = {
        id: `def-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        deficiency_number: defNumber,
        control_id: control.id,
        test_id: test.id,
        deficiency_type: 'OPERATING_DEFICIENCY',
        severity: control.risk_level,
        description: `Control failure during ${params.method} testing: ${params.notes}`,
        root_cause: 'Operating exception during high-volume batch processing',
        owner_id: control.owner_id,
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        status: 'OPEN'
      };

      this.deficiencies.push(deficiency);
    }

    return { test, deficiency };
  }

  public assessControlEffectiveness(controlCode: string): ControlEffectivenessStatus {
    const control = this.controls.find(c => c.control_code === controlCode);
    if (!control) return 'NOT_TESTED';

    const controlTests = this.tests.filter(t => t.control_id === control.id);
    if (controlTests.length === 0) return 'NOT_TESTED';

    const failCount = controlTests.filter(t => t.result === 'FAIL').length;
    if (failCount === 0) return 'EFFECTIVE';
    if (failCount < controlTests.length) return 'PARTIALLY_EFFECTIVE';
    return 'INEFFECTIVE';
  }

  // ─── DEFICIENCY REMEDIATION ──────────────────────────────────────────

  public recordRemediationPlan(params: {
    deficiencyId: string;
    action: string;
    ownerId: string;
  }): ControlDeficiencyRecord {
    const def = this.deficiencies.find(d => d.id === params.deficiencyId);
    if (!def) throw new Error(`Deficiency ${params.deficiencyId} not found`);

    def.remediation_action = params.action;
    def.owner_id = params.ownerId;
    def.status = 'REMEDIATION';

    return def;
  }

  public verifyDeficiencyClosure(params: {
    deficiencyId: string;
    verifiedBy: string;
    isRemediated: boolean;
  }): ControlDeficiencyRecord {
    const def = this.deficiencies.find(d => d.id === params.deficiencyId);
    if (!def) throw new Error(`Deficiency ${params.deficiencyId} not found`);

    if (params.isRemediated) {
      def.status = 'CLOSED';
      def.verified_by = params.verifiedBy;
      def.verified_at = new Date().toISOString();
    } else {
      def.status = 'REMEDIATION';
    }

    return def;
  }

  // ─── CONTINUOUS MONITORING ───────────────────────────────────────────

  public runControlMonitor(controlCode: string, simulateFailure?: boolean): ControlMonitorRecord {
    const control = this.controls.find(c => c.control_code === controlCode);
    if (!control) throw new Error(`Control ${controlCode} not found`);

    this.monCounter += 1;
    const monNumber = `MON/2026/${String(this.monCounter).padStart(6, '0')}`;

    const monitor: ControlMonitorRecord = {
      id: `mon-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      monitor_number: monNumber,
      control_id: control.id,
      rule_name: `RULE_${control.control_code}_AUTO_CHECK`,
      result: simulateFailure ? 'FAIL' : 'PASS',
      executed_at: new Date().toISOString(),
      details: simulateFailure ? 'Telemetry detected 1 unverified transaction' : '100% integrity validation passed across current cycle'
    };

    this.monorsPush(monitor);
    return monitor;
  }

  private monorsPush(m: ControlMonitorRecord) {
    this.monitors.push(m);
  }

  // ─── CONTROL MATRIX & GAP ANALYSIS ───────────────────────────────────

  public getControlMatrix(): ControlMatrixItem[] {
    const matrix: ControlMatrixItem[] = [];

    for (const ctrl of this.controls.filter(c => c.status === 'ACTIVE')) {
      const eff = this.assessControlEffectiveness(ctrl.control_code);
      for (const reqCode of ctrl.mapped_requirement_codes) {
        matrix.push({
          requirementCode: reqCode,
          riskLevel: ctrl.risk_level,
          controlCode: ctrl.control_code,
          controlName: ctrl.name,
          ownerId: ctrl.owner_id,
          frequency: ctrl.frequency,
          effectiveness: eff
        });
      }
    }

    return matrix;
  }

  public getControlGapAnalysis(): { unmappedRequirements: string[]; controlsWithoutRequirements: string[] } {
    const allRequirements = ['UGC_DEGREE_ARCHIVE_MANDATE', 'AICTE_FACULTY_QUAL_VERIFICATION', 'STATE_ADMISSION_RESERVATION_EVID'];
    const mapped = new Set<string>();

    for (const ctrl of this.controls) {
      for (const r of ctrl.mapped_requirement_codes) {
        mapped.add(r);
      }
    }

    const unmappedRequirements = allRequirements.filter(r => !mapped.has(r));
    const controlsWithoutRequirements = this.controls
      .filter(c => c.mapped_requirement_codes.length === 0)
      .map(c => c.control_code);

    return { unmappedRequirements, controlsWithoutRequirements };
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getControlDashboardMetrics(context?: UserAuthorizationContext): ControlDashboardMetrics {
    const totalControlsCount = this.controls.length;
    const activeControlsCount = this.controls.filter(c => c.status === 'ACTIVE').length;

    let effectiveControlsCount = 0;
    let partiallyEffectiveCount = 0;
    let ineffectiveCount = 0;
    let untestedControlsCount = 0;

    for (const ctrl of this.controls.filter(c => c.status === 'ACTIVE')) {
      const eff = this.assessControlEffectiveness(ctrl.control_code);
      if (eff === 'EFFECTIVE') effectiveControlsCount++;
      else if (eff === 'PARTIALLY_EFFECTIVE') partiallyEffectiveCount++;
      else if (eff === 'INEFFECTIVE') ineffectiveCount++;
      else untestedControlsCount++;
    }

    const openDeficienciesCount = this.deficiencies.filter(d => d.status === 'OPEN' || d.status === 'REMEDIATION').length;
    const criticalDeficienciesCount = this.deficiencies.filter(d => d.severity === 'CRITICAL' && d.status !== 'CLOSED').length;

    return {
      totalControlsCount,
      activeControlsCount,
      effectiveControlsCount,
      partiallyEffectiveCount,
      ineffectiveCount,
      untestedControlsCount,
      openDeficienciesCount,
      criticalDeficienciesCount
    };
  }
}

export const centralDocumentComplianceControlService = CentralDocumentComplianceControlService.getInstance();
