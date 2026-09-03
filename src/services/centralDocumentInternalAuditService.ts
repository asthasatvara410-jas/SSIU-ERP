import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentComplianceService } from './centralDocumentComplianceService';
import { centralDocumentRegulatoryComplianceService } from './centralDocumentRegulatoryComplianceService';

export type AuditType = 
  | 'INTERNAL'
  | 'COMPLIANCE'
  | 'DOCUMENT'
  | 'PROCESS'
  | 'SYSTEM'
  | 'SECURITY'
  | 'ACADEMIC'
  | 'FINANCE'
  | 'HR'
  | 'STUDENT'
  | 'RESEARCH'
  | 'SPECIAL_REVIEW';

export type AuditPlanStatus = 
  | 'DRAFT'
  | 'PLANNED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'REPORT_DRAFT'
  | 'REPORT_FINAL'
  | 'CLOSED'
  | 'CANCELLED';

export type AuditRole = 'LEAD_AUDITOR' | 'AUDITOR' | 'REVIEWER' | 'OBSERVER' | 'AUDIT_OWNER';
export type AuditorConflictStatus = 'NO_CONFLICT' | 'CONFLICT_DECLARED' | 'REQUIRES_REVIEW';
export type AuditTestResult = 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_TESTED' | 'NOT_APPLICABLE';
export type AuditFindingSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditFindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATION' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CLOSED' | 'ACCEPTED_RISK';

export interface AuditPlanRecord {
  id: string;
  audit_number: string;
  name: string;
  description: string;
  audit_type: AuditType;
  organization_id: string;
  department_id?: string;
  planned_start: string;
  planned_end: string;
  owner_id: string;
  status: AuditPlanStatus;
  scope_summary: string;
  created_at: string;
  updated_at: string;
}

export interface AuditAssignmentRecord {
  id: string;
  audit_id: string;
  user_id: string;
  role: AuditRole;
  conflict_status: AuditorConflictStatus;
  status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  assigned_at: string;
  accepted_at?: string;
}

export interface AuditChecklistItemRecord {
  id: string;
  audit_id: string;
  item_code: string;
  question: string;
  criteria: string;
  mandatory: boolean;
  weight: number;
}

export interface AuditTestRecord {
  id: string;
  audit_id: string;
  checklist_item_id: string;
  tested_by: string;
  tested_at: string;
  result: AuditTestResult;
  evidence_reference?: string;
  notes: string;
}

export interface InternalAuditFindingRecord {
  id: string;
  finding_number: string;
  audit_id: string;
  test_id?: string;
  requirement_id?: string;
  description: string;
  severity: AuditFindingSeverity;
  root_cause: 'PEOPLE' | 'PROCESS' | 'SYSTEM' | 'POLICY' | 'DATA' | 'TRAINING' | 'GOVERNANCE' | 'EXTERNAL';
  owner_id: string;
  due_date: string;
  status: AuditFindingStatus;
  corrective_action?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface AuditReportRecord {
  id: string;
  report_number: string;
  audit_id: string;
  version: 'DRAFT' | 'FINAL';
  executive_summary: string;
  total_tests_conducted: number;
  pass_rate_percent: number;
  total_findings_count: number;
  critical_findings_count: number;
  certificate_number?: string;
  approved_by?: string;
  finalized_at?: string;
}

export interface AuditDashboardMetrics {
  totalPlannedAudits: number;
  inProgressAuditsCount: number;
  underReviewAuditsCount: number;
  closedAuditsCount: number;
  totalOpenFindingsCount: number;
  criticalFindingsCount: number;
  overdueActionsCount: number;
  averageAuditCompletionDays: number;
}

class CentralDocumentInternalAuditService {
  private static instance: CentralDocumentInternalAuditService;

  private auditPlans: AuditPlanRecord[] = [];
  private assignments: AuditAssignmentRecord[] = [];
  private checklistItems: AuditChecklistItemRecord[] = [];
  private tests: AuditTestRecord[] = [];
  private findings: InternalAuditFindingRecord[] = [];
  private reports: AuditReportRecord[] = [];

  private audCounter = 100;
  private fndCounter = 100;
  private repCounter = 100;
  private certCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDocumentInternalAuditService {
    if (!CentralDocumentInternalAuditService.instance) {
      CentralDocumentInternalAuditService.instance = new CentralDocumentInternalAuditService();
    }
    return CentralDocumentInternalAuditService.instance;
  }

  private seedDemoData(): void {
    // Seed 1 active audit plan
    const auditId = 'aud-seed-001';
    this.auditPlans.push({
      id: auditId,
      audit_number: 'AUD/2026/000001',
      name: 'Annual Academic & UGC Regulatory Records Audit 2026',
      description: 'Systematic examination of student dossiers, degree ledger integrity, and retention schedules',
      audit_type: 'ACADEMIC',
      organization_id: 'inst-sit',
      department_id: 'dept-cse',
      planned_start: '2026-02-01T00:00:00Z',
      planned_end: '2026-03-31T00:00:00Z',
      owner_id: 'emp-reg-001',
      status: 'IN_PROGRESS',
      scope_summary: 'All Graduated Batch Student Records 2020-2025',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z'
    });

    // Seed checklist items
    this.checklistItems.push(
      {
        id: 'chk-item-001',
        audit_id: auditId,
        item_code: 'CHK_DEG_EVID',
        question: 'Are verified degree copies and transcripts present for all eligible students?',
        criteria: 'UGC permanent record compliance guidelines',
        mandatory: true,
        weight: 30
      },
      {
        id: 'chk-item-002',
        audit_id: auditId,
        item_code: 'CHK_COLD_ARC',
        question: 'Are inactive records older than 3 years archived with SHA-256 integrity hashes?',
        criteria: 'Phase 13.23 Archival standard protocol',
        mandatory: true,
        weight: 40
      }
    );
  }

  // ─── AUDIT PLANNING & WORKFLOW ────────────────────────────────────────

  public createAuditPlan(params: {
    name: string;
    description: string;
    auditType: AuditType;
    organizationId: string;
    departmentId?: string;
    plannedStart: string;
    plannedEnd: string;
    scopeSummary: string;
    ownerId: string;
    context?: UserAuthorizationContext;
  }): AuditPlanRecord {
    this.audCounter += 1;
    const auditNumber = `AUD/2026/${String(this.audCounter).padStart(6, '0')}`;

    const plan: AuditPlanRecord = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      audit_number: auditNumber,
      name: params.name,
      description: params.description,
      audit_type: params.auditType,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      planned_start: params.plannedStart,
      planned_end: params.plannedEnd,
      owner_id: params.ownerId,
      status: 'APPROVED',
      scope_summary: params.scopeSummary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.auditPlans.push(plan);
    return plan;
  }

  // ─── AUDITOR ASSIGNMENT & CONFLICT DECLARATION ────────────────────────

  public assignAuditor(params: {
    auditId: string;
    userId: string;
    role: AuditRole;
    conflictStatus?: AuditorConflictStatus;
  }): AuditAssignmentRecord {
    const plan = this.auditPlans.find(p => p.id === params.auditId);
    if (!plan) throw new Error(`Audit plan ${params.auditId} not found`);

    const assignment: AuditAssignmentRecord = {
      id: `asgn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      audit_id: params.auditId,
      user_id: params.userId,
      role: params.role,
      conflict_status: params.conflictStatus || 'NO_CONFLICT',
      status: 'ACCEPTED',
      assigned_at: new Date().toISOString(),
      accepted_at: new Date().toISOString()
    };

    this.assignments.push(assignment);
    return assignment;
  }

  // ─── CHECKLIST & TESTING EXECUTION ───────────────────────────────────

  public addChecklistItem(params: {
    auditId: string;
    itemCode: string;
    question: string;
    criteria: string;
    mandatory?: boolean;
    weight?: number;
  }): AuditChecklistItemRecord {
    const item: AuditChecklistItemRecord = {
      id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      audit_id: params.auditId,
      item_code: params.itemCode,
      question: params.question,
      criteria: params.criteria,
      mandatory: params.mandatory ?? true,
      weight: params.weight || 10
    };

    this.checklistItems.push(item);
    return item;
  }

  public executeAuditTest(params: {
    auditId: string;
    checklistItemId: string;
    testedBy: string;
    result: AuditTestResult;
    evidenceReference?: string;
    notes: string;
    createFindingOnFail?: boolean;
  }): { test: AuditTestRecord; finding?: InternalAuditFindingRecord } {
    const test: AuditTestRecord = {
      id: `tst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      audit_id: params.auditId,
      checklist_item_id: params.checklistItemId,
      tested_by: params.testedBy,
      tested_at: new Date().toISOString(),
      result: params.result,
      evidence_reference: params.evidenceReference,
      notes: params.notes
    };

    this.tests.push(test);

    let finding: InternalAuditFindingRecord | undefined;
    if (params.result === 'FAIL' && params.createFindingOnFail !== false) {
      this.fndCounter += 1;
      const findingNumber = `AFN/2026/${String(this.fndCounter).padStart(6, '0')}`;

      finding = {
        id: `afn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        finding_number: findingNumber,
        audit_id: params.auditId,
        test_id: test.id,
        description: `Audit test failure: ${params.notes}`,
        severity: 'HIGH',
        root_cause: 'PROCESS',
        owner_id: params.testedBy,
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        status: 'OPEN'
      };

      this.findings.push(finding);
    }

    return { test, finding };
  }

  // ─── CORRECTIVE ACTIONS & REMEDIATION ────────────────────────────────

  public recordCorrectiveAction(params: {
    findingId: string;
    action: string;
    ownerId: string;
  }): InternalAuditFindingRecord {
    const finding = this.findings.find(f => f.id === params.findingId);
    if (!finding) throw new Error(`Audit finding ${params.findingId} not found`);

    finding.corrective_action = params.action;
    finding.status = 'REMEDIATION';
    finding.owner_id = params.ownerId;

    return finding;
  }

  public verifyFindingClosure(params: {
    findingId: string;
    verifiedBy: string;
    isRemediated: boolean;
  }): InternalAuditFindingRecord {
    const finding = this.findings.find(f => f.id === params.findingId);
    if (!finding) throw new Error(`Audit finding ${params.findingId} not found`);

    if (params.isRemediated) {
      finding.status = 'CLOSED';
      finding.verified_by = params.verifiedBy;
      finding.verified_at = new Date().toISOString();
    } else {
      // Reopen finding if remediation verification fails
      finding.status = 'REMEDIATION';
    }

    return finding;
  }

  // ─── AUDIT CLOSURE & FINAL REPORT ─────────────────────────────────────

  public finalizeAuditReport(params: {
    auditId: string;
    approvedBy: string;
    executiveSummary: string;
  }): AuditReportRecord {
    const plan = this.auditPlans.find(p => p.id === params.auditId);
    if (!plan) throw new Error(`Audit plan ${params.auditId} not found`);

    const auditTests = this.tests.filter(t => t.audit_id === params.auditId);
    const passCount = auditTests.filter(t => t.result === 'PASS').length;
    const passRate = auditTests.length > 0 ? Math.round((passCount / auditTests.length) * 100) : 100;

    const auditFindings = this.findings.filter(f => f.audit_id === params.auditId);
    const criticalCount = auditFindings.filter(f => f.severity === 'CRITICAL' && f.status !== 'CLOSED').length;

    this.repCounter += 1;
    const reportNumber = `REP/2026/${String(this.repCounter).padStart(6, '0')}`;

    this.certCounter += 1;
    const certNumber = `ACERT/2026/${String(this.certCounter).padStart(6, '0')}`;

    const report: AuditReportRecord = {
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      report_number: reportNumber,
      audit_id: params.auditId,
      version: 'FINAL',
      executive_summary: params.executiveSummary,
      total_tests_conducted: auditTests.length,
      pass_rate_percent: passRate,
      total_findings_count: auditFindings.length,
      critical_findings_count: criticalCount,
      certificate_number: certNumber,
      approved_by: params.approvedBy,
      finalized_at: new Date().toISOString()
    };

    this.reports.push(report);
    plan.status = 'CLOSED';

    return report;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getAuditDashboardMetrics(context?: UserAuthorizationContext): AuditDashboardMetrics {
    const totalPlannedAudits = this.auditPlans.length;
    const inProgressAuditsCount = this.auditPlans.filter(p => p.status === 'IN_PROGRESS').length;
    const underReviewAuditsCount = this.auditPlans.filter(p => p.status === 'UNDER_REVIEW').length;
    const closedAuditsCount = this.auditPlans.filter(p => p.status === 'CLOSED').length;

    const totalOpenFindingsCount = this.findings.filter(f => f.status === 'OPEN' || f.status === 'REMEDIATION').length;
    const criticalFindingsCount = this.findings.filter(f => f.severity === 'CRITICAL' && f.status !== 'CLOSED').length;
    const overdueActionsCount = this.findings.filter(f => (f.status === 'OPEN' || f.status === 'REMEDIATION') && new Date(f.due_date) < new Date()).length;

    return {
      totalPlannedAudits,
      inProgressAuditsCount,
      underReviewAuditsCount,
      closedAuditsCount,
      totalOpenFindingsCount,
      criticalFindingsCount,
      overdueActionsCount,
      averageAuditCompletionDays: 14
    };
  }
}

export const centralDocumentInternalAuditService = CentralDocumentInternalAuditService.getInstance();
