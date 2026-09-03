import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';
import { centralDocumentRiskManagementService } from './centralDocumentRiskManagementService';
import { centralSecurityIncidentService } from './centralSecurityIncidentService';
import { centralSOCService } from './centralSOCService';

export type PolicyCategory = 
  | 'ACCESS_CONTROL'
  | 'IDENTITY'
  | 'PASSWORD'
  | 'MFA'
  | 'DATA_PROTECTION'
  | 'PRIVACY'
  | 'NETWORK_SECURITY'
  | 'APPLICATION_SECURITY'
  | 'API_SECURITY'
  | 'ENDPOINT_SECURITY'
  | 'LOGGING'
  | 'MONITORING'
  | 'INCIDENT_RESPONSE'
  | 'BUSINESS_CONTINUITY'
  | 'DISASTER_RECOVERY'
  | 'VENDOR_SECURITY'
  | 'CHANGE_MANAGEMENT'
  | 'BACKUP'
  | 'RETENTION'
  | 'ACCEPTABLE_USE';

export type PolicyStatus = 'DRAFT' | 'REVIEW' | 'APPROVAL' | 'PUBLISHED' | 'ACTIVE' | 'REVIEW_DUE' | 'REVISED' | 'RETIRED';
export type ExceptionType = 'TEMPORARY' | 'PERMANENT' | 'EMERGENCY';
export type ExceptionStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'REVOKED';
export type AttestationStatement = 'CONTROL_EFFECTIVE' | 'CONTROL_PARTIALLY_EFFECTIVE' | 'CONTROL_NOT_EFFECTIVE' | 'NOT_APPLICABLE';
export type AttestationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ATTESTED' | 'REJECTED' | 'REMEDIATION_REQUIRED';

export interface SecurityPolicyRecord {
  id: string;
  policy_code: string;
  title: string;
  description: string;
  category: PolicyCategory;
  owner_id: string;
  organization_id: string;
  status: PolicyStatus;
  version: number;
  effective_from: string;
  review_due: string;
  document_reference?: string;
  approval_status: 'PENDING' | 'APPROVED';
  created_at: string;
  updated_at: string;
}

export interface SecurityExceptionRecord {
  id: string;
  exception_number: string;
  title: string;
  description: string;
  policy_id: string;
  control_id: string;
  organization_id: string;
  requester_id: string;
  owner_id: string;
  risk_id?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  exception_type: ExceptionType;
  status: ExceptionStatus;
  requested_from: string;
  requested_until: string;
  compensating_control_id?: string;
  risk_assessment_conducted: boolean;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ControlAttestationRecord {
  id: string;
  control_id: string;
  organization_id: string;
  period: 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  attestor_id: string;
  status: AttestationStatus;
  statement: AttestationStatement;
  attested_at: string;
  evidence_reference?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  remediation_id?: string;
}

export interface SecurityCertificationRecord {
  id: string;
  certificate_number: string;
  name: string;
  scope: string;
  framework: string;
  issuer: string;
  issued_date: string;
  valid_until: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';
}

export interface SecurityGovernanceDashboardMetrics {
  activePoliciesCount: number;
  attestedControlsPercent: number;
  activeExceptionsCount: number;
  highRiskExceptionsCount: number;
  activeCertificationsCount: number;
  governanceScorePercent: number;
  securityPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK' | 'CRITICAL';
}

class CentralSecurityGovernanceService {
  private static instance: CentralSecurityGovernanceService;

  private policies: SecurityPolicyRecord[] = [];
  private exceptions: SecurityExceptionRecord[] = [];
  private attestations: ControlAttestationRecord[] = [];
  private certifications: SecurityCertificationRecord[] = [];

  private polCounter = 100;
  private excCounter = 100;
  private certCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralSecurityGovernanceService {
    if (!CentralSecurityGovernanceService.instance) {
      CentralSecurityGovernanceService.instance = new CentralSecurityGovernanceService();
    }
    return CentralSecurityGovernanceService.instance;
  }

  private seedDemoData(): void {
    const polId = 'pol-seed-001';
    this.policies.push({
      id: polId,
      policy_code: 'POL-SEC-ACCESS-001',
      title: 'University Role-Based Access Control & Principle of Least Privilege Policy',
      description: 'Defines RBAC access scopes, privileged account segregation, and quarterly access attestation requirements',
      category: 'ACCESS_CONTROL',
      owner_id: 'emp-ciso-001',
      organization_id: 'inst-sit',
      status: 'ACTIVE',
      version: 1,
      effective_from: '2026-01-01T00:00:00Z',
      review_due: '2026-12-31T00:00:00Z',
      document_reference: 'DMS-DOC-2026-000101',
      approval_status: 'APPROVED',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });

    this.certifications.push({
      id: 'cert-seed-001',
      certificate_number: 'CERT/2026/000001',
      name: 'ISO/IEC 27001:2022 Information Security Management System',
      scope: 'Campus Central Cloud Infrastructure, Student Dossier & Examination DMS Vaults',
      framework: 'ISO27001',
      issuer: 'BSI Global Accreditation',
      issued_date: '2025-06-01T00:00:00Z',
      valid_until: '2028-05-31T00:00:00Z',
      status: 'ACTIVE'
    });
  }

  // ─── SECURITY POLICY LIFECYCLE ───────────────────────────────────────

  public createPolicy(params: {
    title: string;
    description: string;
    category: PolicyCategory;
    ownerId: string;
    organizationId: string;
    documentReference?: string;
    context?: UserAuthorizationContext;
  }): SecurityPolicyRecord {
    this.polCounter += 1;
    const policyCode = `POL-SEC-${params.category.slice(0, 4)}-${String(this.polCounter).padStart(3, '0')}`;

    const policy: SecurityPolicyRecord = {
      id: `pol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      policy_code: policyCode,
      title: params.title,
      description: params.description,
      category: params.category,
      owner_id: params.ownerId,
      organization_id: params.organizationId,
      status: 'DRAFT',
      version: 1,
      effective_from: new Date().toISOString(),
      review_due: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      document_reference: params.documentReference,
      approval_status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.policies.push(policy);
    return policy;
  }

  public approveAndPublishPolicy(policyId: string, approverId: string): SecurityPolicyRecord {
    const policy = this.policies.find(p => p.id === policyId || p.policy_code === policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found`);

    policy.approval_status = 'APPROVED';
    policy.status = 'ACTIVE';
    policy.updated_at = new Date().toISOString();

    return policy;
  }

  // ─── SECURITY EXCEPTIONS & RISK ACCEPTANCES ──────────────────────────

  public createSecurityException(params: {
    title: string;
    description: string;
    policyId: string;
    controlId: string;
    organizationId: string;
    requesterId: string;
    ownerId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    exceptionType: ExceptionType;
    requestedUntil: string;
    compensatingControlId?: string;
    riskAssessmentConducted?: boolean;
    context?: UserAuthorizationContext;
  }): SecurityExceptionRecord {
    this.excCounter += 1;
    const excNumber = `SEC-EXC-2026-${String(this.excCounter).padStart(6, '0')}`;

    const exception: SecurityExceptionRecord = {
      id: `exc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exception_number: excNumber,
      title: params.title,
      description: params.description,
      policy_id: params.policyId,
      control_id: params.controlId,
      organization_id: params.organizationId,
      requester_id: params.requesterId,
      owner_id: params.ownerId,
      severity: params.severity,
      exception_type: params.exceptionType,
      status: 'SUBMITTED',
      requested_from: new Date().toISOString(),
      requested_until: params.requestedUntil,
      compensating_control_id: params.compensatingControlId,
      risk_assessment_conducted: params.riskAssessmentConducted || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.exceptions.push(exception);
    return exception;
  }

  public approveSecurityException(exceptionId: string, approverId: string): SecurityExceptionRecord {
    const exc = this.exceptions.find(e => e.id === exceptionId || e.exception_number === exceptionId);
    if (!exc) throw new Error(`Exception ${exceptionId} not found`);

    // Exception Validation: Cannot approve without documented risk assessment
    if (!exc.risk_assessment_conducted) {
      throw new Error(`Exception Approval Blocked: Security Exception ${exc.exception_number} requires formal risk assessment before approval`);
    }

    exc.status = 'ACTIVE';
    exc.approval_notes = `Approved by Security Governance Authority ${approverId}`;
    exc.updated_at = new Date().toISOString();

    return exc;
  }

  // ─── CONTROL ATTESTATION WORKFLOW ────────────────────────────────────

  public submitControlAttestation(params: {
    controlId: string;
    organizationId: string;
    period: 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
    attestorId: string;
    statement: AttestationStatement;
    evidenceReference?: string;
  }): ControlAttestationRecord {
    const attestation: ControlAttestationRecord = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      control_id: params.controlId,
      organization_id: params.organizationId,
      period: params.period,
      attestor_id: params.attestorId,
      status: params.statement === 'CONTROL_NOT_EFFECTIVE' ? 'REMEDIATION_REQUIRED' : 'ATTESTED',
      statement: params.statement,
      attested_at: new Date().toISOString(),
      evidence_reference: params.evidenceReference,
      reviewed_at: new Date().toISOString()
    };

    if (params.statement === 'CONTROL_NOT_EFFECTIVE') {
      attestation.remediation_id = `REM-DEF-${Date.now()}`;
    }

    this.attestations.push(attestation);
    return attestation;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getSecurityGovernanceDashboardMetrics(context?: UserAuthorizationContext): SecurityGovernanceDashboardMetrics {
    const activePoliciesCount = this.policies.filter(p => p.status === 'ACTIVE').length;
    const activeExceptions = this.exceptions.filter(e => e.status === 'ACTIVE');
    const activeExceptionsCount = activeExceptions.length;
    const highRiskExceptionsCount = activeExceptions.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length;
    const activeCertificationsCount = this.certifications.filter(c => c.status === 'ACTIVE').length;

    const effectiveAttestations = this.attestations.filter(a => a.statement === 'CONTROL_EFFECTIVE').length;
    const totalAttestations = this.attestations.length;
    const attestedControlsPercent = totalAttestations > 0 ? Math.round((effectiveAttestations / totalAttestations) * 100) : 95;

    return {
      activePoliciesCount,
      attestedControlsPercent,
      activeExceptionsCount,
      highRiskExceptionsCount,
      activeCertificationsCount,
      governanceScorePercent: 94,
      securityPosture: 'HEALTHY'
    };
  }
}

export const centralSecurityGovernanceService = CentralSecurityGovernanceService.getInstance();
