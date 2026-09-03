import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentComplianceService } from './centralDocumentComplianceService';

export type RegulatoryRequirementCategory = 
  | 'ACADEMIC'
  | 'STUDENT'
  | 'FACULTY'
  | 'FINANCE'
  | 'HR'
  | 'ADMISSION'
  | 'EXAMINATION'
  | 'DOCUMENT'
  | 'DATA'
  | 'SECURITY'
  | 'PRIVACY'
  | 'RESEARCH'
  | 'LIBRARY'
  | 'HOSTEL'
  | 'TRANSPORT'
  | 'OTHER';

export type RegulatoryComplianceStatus = 
  | 'COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT'
  | 'UNDER_REVIEW'
  | 'EXEMPT'
  | 'NOT_APPLICABLE'
  | 'PENDING';

export type RegulatoryRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ComplianceRequirementRecord {
  id: string;
  requirement_code: string;
  name: string;
  description: string;
  category: RegulatoryRequirementCategory;
  authority: string;
  jurisdiction: 'COUNTRY' | 'STATE' | 'UNIVERSITY' | 'INSTITUTION' | 'PROGRAM' | 'DEPARTMENT';
  version: number;
  effective_from: string;
  effective_to?: string;
  status: 'ACTIVE' | 'RETIRED';
}

export interface ComplianceRecordItem {
  id: string;
  record_number: string;
  document_id: string;
  organization_id: string;
  requirement_id: string;
  compliance_status: RegulatoryComplianceStatus;
  risk_level: RegulatoryRiskLevel;
  effective_from: string;
  effective_to?: string;
  owner_id: string;
  review_due_at: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceObligationRecord {
  id: string;
  obligation_code: string;
  requirement_id: string;
  owner_id: string;
  organization_id: string;
  frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'EVENT_BASED';
  due_date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'WAIVED' | 'NOT_APPLICABLE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reviewer_id?: string;
}

export interface RegulatoryEvidenceRecord {
  id: string;
  evidence_number: string;
  requirement_id: string;
  document_id: string;
  version_id?: string;
  evidence_type: 'DOCUMENT' | 'REPORT' | 'RECORD' | 'SYSTEM_LOG' | 'APPROVAL' | 'CERTIFICATE' | 'AUDIT_EVENT';
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'UNDER_REVIEW' | 'INVALID';
  collected_by: string;
  collected_at: string;
  valid_from: string;
  valid_to?: string;
}

export interface ComplianceCheckRecord {
  id: string;
  check_number: string;
  requirement_id: string;
  scope: string;
  performed_by: string;
  performed_at: string;
  result: 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_TESTED' | 'NOT_APPLICABLE';
  risk_level: RegulatoryRiskLevel;
  findings_count: number;
}

export interface ComplianceFindingRecord {
  id: string;
  finding_number: string;
  check_id: string;
  requirement_id: string;
  severity: RegulatoryRiskLevel;
  description: string;
  root_cause?: string;
  owner_id: string;
  due_date: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATION' | 'RESOLVED' | 'VERIFIED' | 'CLOSED';
  resolution?: string;
}

export interface RegulatoryExceptionRecord {
  id: string;
  exception_number: string;
  requirement_id: string;
  scope: string;
  reason: string;
  risk: RegulatoryRiskLevel;
  requested_by: string;
  approved_by?: string;
  start_date: string;
  end_date: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface ComplianceCalendarEvent {
  id: string;
  title: string;
  eventType: 'REQUIREMENT_REVIEW' | 'OBLIGATION_DUE' | 'EVIDENCE_EXPIRY' | 'AUDIT_DATE';
  dueDate: string;
  status: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'COMPLETED';
  ownerId: string;
  requirementCode: string;
}

export interface AuditReadinessPackage {
  id: string;
  packageNumber: string;
  scope: string;
  totalRequirements: number;
  compliantCount: number;
  openFindingsCount: number;
  evidenceItemsCount: number;
  readinessScorePercent: number;
  generatedAt: string;
  generatedBy: string;
}

export interface RegulatoryComplianceDashboardMetrics {
  totalRequirementsCount: number;
  compliantRequirementsCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  openFindingsCount: number;
  criticalFindingsCount: number;
  overdueObligationsCount: number;
  expiringEvidenceCount: number;
  activeExceptionsCount: number;
  overallComplianceScorePercent: number;
}

class CentralDocumentRegulatoryComplianceService {
  private static instance: CentralDocumentRegulatoryComplianceService;

  private requirements: ComplianceRequirementRecord[] = [];
  private complianceRecords: ComplianceRecordItem[] = [];
  private obligations: ComplianceObligationRecord[] = [];
  private evidences: RegulatoryEvidenceRecord[] = [];
  private checks: ComplianceCheckRecord[] = [];
  private findings: ComplianceFindingRecord[] = [];
  private exceptions: RegulatoryExceptionRecord[] = [];
  private packages: AuditReadinessPackage[] = [];

  private recCounter = 100;
  private oblCounter = 100;
  private evCounter = 100;
  private chkCounter = 100;
  private fndCounter = 100;
  private excCounter = 100;
  private pkgCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDocumentRegulatoryComplianceService {
    if (!CentralDocumentRegulatoryComplianceService.instance) {
      CentralDocumentRegulatoryComplianceService.instance = new CentralDocumentRegulatoryComplianceService();
    }
    return CentralDocumentRegulatoryComplianceService.instance;
  }

  private seedDemoData(): void {
    this.requirements.push(
      {
        id: 'req-ugc-001',
        requirement_code: 'UGC_DEGREE_ARCHIVE_MANDATE',
        name: 'UGC Mandatory Degree & Permanent Academic Record Preservation',
        description: 'Universities must preserve permanent degree certificates and grade ledgers with digital traceability',
        category: 'ACADEMIC',
        authority: 'University Grants Commission (UGC)',
        jurisdiction: 'COUNTRY',
        version: 1,
        effective_from: '2020-01-01T00:00:00Z',
        status: 'ACTIVE'
      },
      {
        id: 'req-aicte-002',
        requirement_code: 'AICTE_FACULTY_QUAL_VERIFICATION',
        name: 'AICTE Faculty Credential & Appointment Verification',
        description: 'Mandatory verification of highest degree certificates and appointment orders for engineering faculties',
        category: 'FACULTY',
        authority: 'All India Council for Technical Education (AICTE)',
        jurisdiction: 'COUNTRY',
        version: 1,
        effective_from: '2021-06-01T00:00:00Z',
        status: 'ACTIVE'
      },
      {
        id: 'req-stat-003',
        requirement_code: 'STATE_ADMISSION_RESERVATION_EVID',
        name: 'State Admission Quota & Category Evidence Preservation',
        description: 'Preservation of caste/domicile/income certificates supporting admission allotments for 5 years',
        category: 'ADMISSION',
        authority: 'Admission Committee for Professional Courses (ACPC)',
        jurisdiction: 'STATE',
        version: 1,
        effective_from: '2022-04-01T00:00:00Z',
        status: 'ACTIVE'
      }
    );

    // Seed 1 active obligation
    this.obligations.push({
      id: 'obl-seed-001',
      obligation_code: 'OBL/2026/000001',
      requirement_id: 'req-ugc-001',
      owner_id: 'emp-reg-001',
      organization_id: 'inst-sit',
      frequency: 'YEARLY',
      due_date: '2026-12-31T00:00:00Z',
      status: 'OPEN',
      priority: 'HIGH',
      reviewer_id: 'emp-comp-001'
    });
  }

  // ─── REQUIREMENT MAPPING & COMPLIANCE RECORD ─────────────────────────

  public mapComplianceRecord(params: {
    documentId: string;
    requirementCode: string;
    organizationId: string;
    ownerId: string;
    context?: UserAuthorizationContext;
  }): ComplianceRecordItem {
    const req = this.requirements.find(r => r.requirement_code === params.requirementCode && r.status === 'ACTIVE');
    if (!req) throw new Error(`Regulatory requirement ${params.requirementCode} not found`);

    this.recCounter += 1;
    const recordNumber = `CMP/2026/${String(this.recCounter).padStart(6, '0')}`;

    const item: ComplianceRecordItem = {
      id: `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      record_number: recordNumber,
      document_id: params.documentId,
      organization_id: params.organizationId,
      requirement_id: req.id,
      compliance_status: 'COMPLIANT',
      risk_level: 'LOW',
      effective_from: new Date().toISOString(),
      owner_id: params.ownerId,
      review_due_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.complianceRecords.push(item);
    return item;
  }

  // ─── EVIDENCE ATTACHMENT & VALIDATION ────────────────────────────────

  public addComplianceEvidence(params: {
    requirementCode: string;
    documentId: string;
    versionId?: string;
    evidenceType: 'DOCUMENT' | 'REPORT' | 'RECORD' | 'APPROVAL' | 'CERTIFICATE';
    collectedBy: string;
    validDays?: number;
  }): RegulatoryEvidenceRecord {
    const req = this.requirements.find(r => r.requirement_code === params.requirementCode);
    if (!req) throw new Error(`Regulatory requirement ${params.requirementCode} not found`);

    this.evCounter += 1;
    const evNumber = `REV/2026/${String(this.evCounter).padStart(6, '0')}`;
    const validDays = params.validDays || 365;

    const evidence: RegulatoryEvidenceRecord = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      evidence_number: evNumber,
      requirement_id: req.id,
      document_id: params.documentId,
      version_id: params.versionId,
      evidence_type: params.evidenceType,
      status: 'VALID',
      collected_by: params.collectedBy,
      collected_at: new Date().toISOString(),
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + validDays * 24 * 3600 * 1000).toISOString()
    };

    this.evidences.push(evidence);
    return evidence;
  }

  // ─── COMPLIANCE CHECKS & FINDINGS ────────────────────────────────────

  public runRegulatoryComplianceCheck(params: {
    requirementCode: string;
    scope: string;
    performedBy: string;
    simulateFailure?: boolean;
    context?: UserAuthorizationContext;
  }): { check: ComplianceCheckRecord; finding?: ComplianceFindingRecord } {
    const req = this.requirements.find(r => r.requirement_code === params.requirementCode);
    if (!req) throw new Error(`Regulatory requirement ${params.requirementCode} not found`);

    this.chkCounter += 1;
    const checkNumber = `CHK/2026/${String(this.chkCounter).padStart(6, '0')}`;

    if (params.simulateFailure) {
      const check: ComplianceCheckRecord = {
        id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        check_number: checkNumber,
        requirement_id: req.id,
        scope: params.scope,
        performed_by: params.performedBy,
        performed_at: new Date().toISOString(),
        result: 'FAIL',
        risk_level: 'HIGH',
        findings_count: 1
      };
      this.checks.push(check);

      this.fndCounter += 1;
      const findingNumber = `FND/2026/${String(this.fndCounter).padStart(6, '0')}`;
      const finding: ComplianceFindingRecord = {
        id: `fnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        finding_number: findingNumber,
        check_id: check.id,
        requirement_id: req.id,
        severity: 'HIGH',
        description: `Missing mandatory verified evidence for ${req.name}`,
        root_cause: 'Document upload checklist incomplete at admission intake',
        owner_id: params.performedBy,
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        status: 'OPEN'
      };
      this.findings.push(finding);

      return { check, finding };
    }

    const check: ComplianceCheckRecord = {
      id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      check_number: checkNumber,
      requirement_id: req.id,
      scope: params.scope,
      performed_by: params.performedBy,
      performed_at: new Date().toISOString(),
      result: 'PASS',
      risk_level: 'LOW',
      findings_count: 0
    };
    this.checks.push(check);

    return { check };
  }

  // ─── EXCEPTIONS & AUDIT READINESS ────────────────────────────────────

  public requestComplianceException(params: {
    requirementCode: string;
    scope: string;
    reason: string;
    risk: RegulatoryRiskLevel;
    requestedBy: string;
    durationDays?: number;
  }): RegulatoryExceptionRecord {
    const req = this.requirements.find(r => r.requirement_code === params.requirementCode);
    if (!req) throw new Error(`Regulatory requirement ${params.requirementCode} not found`);

    this.excCounter += 1;
    const excNumber = `EXC/2026/${String(this.excCounter).padStart(6, '0')}`;
    const days = params.durationDays || 90;

    const exception: RegulatoryExceptionRecord = {
      id: `exc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exception_number: excNumber,
      requirement_id: req.id,
      scope: params.scope,
      reason: params.reason,
      risk: params.risk,
      requested_by: params.requestedBy,
      approved_by: 'emp-reg-001',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE'
    };

    this.exceptions.push(exception);
    return exception;
  }

  public generateAuditReadinessPackage(params: {
    scope: string;
    generatedBy: string;
  }): AuditReadinessPackage {
    this.pkgCounter += 1;
    const pkgNumber = `PKG/2026/${String(this.pkgCounter).padStart(6, '0')}`;

    const totalRequirements = this.requirements.length;
    const openFindingsCount = this.findings.filter(f => f.status === 'OPEN' || f.status === 'REMEDIATION').length;
    const compliantCount = Math.max(0, totalRequirements - openFindingsCount);
    const score = totalRequirements > 0 ? Math.round((compliantCount / totalRequirements) * 100) : 100;

    const pkg: AuditReadinessPackage = {
      id: `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      packageNumber: pkgNumber,
      scope: params.scope,
      totalRequirements,
      compliantCount,
      openFindingsCount,
      evidenceItemsCount: this.evidences.length,
      readinessScorePercent: score,
      generatedAt: new Date().toISOString(),
      generatedBy: params.generatedBy
    };

    this.packages.push(pkg);
    return pkg;
  }

  public getComplianceCalendarEvents(): ComplianceCalendarEvent[] {
    const events: ComplianceCalendarEvent[] = [];

    for (const obl of this.obligations) {
      const req = this.requirements.find(r => r.id === obl.requirement_id);
      events.push({
        id: `cal-obl-${obl.id}`,
        title: `Annual Obligation: ${req?.name || 'Regulatory Requirement'}`,
        eventType: 'OBLIGATION_DUE',
        dueDate: obl.due_date,
        status: new Date(obl.due_date) < new Date() ? 'OVERDUE' : 'UPCOMING',
        ownerId: obl.owner_id,
        requirementCode: req?.requirement_code || 'REQ'
      });
    }

    return events;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getRegulatoryComplianceDashboard(): RegulatoryComplianceDashboardMetrics {
    const totalRequirementsCount = this.requirements.length;
    const openFindingsCount = this.findings.filter(f => f.status === 'OPEN' || f.status === 'REMEDIATION').length;
    const criticalFindingsCount = this.findings.filter(f => f.severity === 'CRITICAL' && f.status !== 'CLOSED').length;
    const overdueObligationsCount = this.obligations.filter(o => o.status === 'OVERDUE' || (o.status === 'OPEN' && new Date(o.due_date) < new Date())).length;
    const expiringEvidenceCount = this.evidences.filter(e => e.status === 'EXPIRED' || (e.valid_to && new Date(e.valid_to) < new Date(Date.now() + 30 * 24 * 3600 * 1000))).length;
    const activeExceptionsCount = this.exceptions.filter(e => e.status === 'ACTIVE').length;

    const compliantRequirementsCount = Math.max(0, totalRequirementsCount - openFindingsCount);
    const nonCompliantCount = openFindingsCount;
    const partiallyCompliantCount = 0;

    const overallComplianceScorePercent = totalRequirementsCount > 0
      ? Math.round((compliantRequirementsCount / totalRequirementsCount) * 100)
      : 100;

    return {
      totalRequirementsCount,
      compliantRequirementsCount,
      partiallyCompliantCount,
      nonCompliantCount,
      openFindingsCount,
      criticalFindingsCount,
      overdueObligationsCount,
      expiringEvidenceCount,
      activeExceptionsCount,
      overallComplianceScorePercent
    };
  }
}

export const centralDocumentRegulatoryComplianceService = CentralDocumentRegulatoryComplianceService.getInstance();
