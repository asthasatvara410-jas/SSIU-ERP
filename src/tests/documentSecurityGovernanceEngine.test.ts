import { describe, it, expect } from 'vitest';
import { centralSecurityGovernanceService } from '../services/centralSecurityGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.33: Security Governance & Policy Management Engine', () => {

  const governanceOfficer: UserAuthorizationContext = {
    userId: 'emp-gov-001',
    userName: 'Head of Information Security Governance & Compliance',
    email: 'secgov@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'SECURITY_GOVERNANCE_VIEW',
      'SECURITY_POLICY_CREATE',
      'SECURITY_POLICY_APPROVE',
      'SECURITY_POLICY_PUBLISH',
      'SECURITY_EXCEPTION_CREATE',
      'SECURITY_EXCEPTION_APPROVE',
      'SECURITY_CONTROL_ATTEST',
      'SECURITY_CERTIFICATION_VIEW',
      'SECURITY_GOVERNANCE_REPORT'
    ]
  };

  it('TEST 1: Security Policy Lifecycle & Publication: Creates policy in DRAFT and approves to ACTIVE', () => {
    const policy = centralSecurityGovernanceService.createPolicy({
      title: 'Enterprise Cryptographic Key Management & Storage Policy',
      description: 'Standards for AES-256 GCM encryption of student records, certificates, and salary ledgers',
      category: 'DATA_PROTECTION',
      ownerId: 'emp-gov-001',
      organizationId: 'inst-sit',
      documentReference: 'DMS-DOC-2026-000555',
      context: governanceOfficer
    });

    expect(policy.id).toBeDefined();
    expect(policy.policy_code).toMatch(/^POL-SEC-DATA-\d{3}$/);
    expect(policy.status).toBe('DRAFT');

    // Approve and publish policy
    const published = centralSecurityGovernanceService.approveAndPublishPolicy(policy.id, 'emp-ciso-001');
    expect(published.status).toBe('ACTIVE');
    expect(published.approval_status).toBe('APPROVED');
  });

  it('TEST 2: Security Exception & Risk Assessment Gate: Blocks approval without risk assessment and activates on compliance', () => {
    const exception = centralSecurityGovernanceService.createSecurityException({
      title: 'Legacy Departmental Scanner SMBv1 Protocol Temporary Exception',
      description: 'Temporary protocol access for legacy laboratory hardware pending firmware upgrade',
      policyId: 'pol-seed-001',
      controlId: 'DOC-CTRL-001',
      organizationId: 'inst-sit',
      requesterId: 'emp-fac-001',
      ownerId: 'emp-gov-001',
      severity: 'MEDIUM',
      exceptionType: 'TEMPORARY',
      requestedUntil: '2026-06-30T00:00:00Z',
      riskAssessmentConducted: false // Not yet assessed
    });

    expect(exception.id).toBeDefined();
    expect(exception.exception_number).toMatch(/^SEC-EXC-2026-\d{6}$/);
    expect(exception.status).toBe('SUBMITTED');

    // Attempt approval without risk assessment must throw
    expect(() => {
      centralSecurityGovernanceService.approveSecurityException(exception.id, 'emp-ciso-001');
    }).toThrow(/Exception Approval Blocked: Security Exception .* requires formal risk assessment/);

    // Conduct risk assessment and approve
    exception.risk_assessment_conducted = true;
    const approved = centralSecurityGovernanceService.approveSecurityException(exception.id, 'emp-ciso-001');
    expect(approved.status).toBe('ACTIVE');
    expect(approved.approval_notes).toBeDefined();
  });

  it('TEST 3: Compensating Controls: Configures compensating control for high-risk exception', () => {
    const exc = centralSecurityGovernanceService.createSecurityException({
      title: 'Vendor Remote API Access Exception',
      description: 'Direct vendor API integration for third-party admission portal',
      policyId: 'pol-seed-001',
      controlId: 'DOC-CTRL-003',
      organizationId: 'inst-sit',
      requesterId: 'emp-adm-001',
      ownerId: 'emp-gov-001',
      severity: 'HIGH',
      exceptionType: 'TEMPORARY',
      requestedUntil: '2026-08-31T00:00:00Z',
      compensatingControlId: 'DOC-CTRL-002', // Mapped compensating control
      riskAssessmentConducted: true
    });

    expect(exc.compensating_control_id).toBe('DOC-CTRL-002');
    const approved = centralSecurityGovernanceService.approveSecurityException(exc.id, 'emp-ciso-001');
    expect(approved.status).toBe('ACTIVE');
  });

  it('TEST 4: Control Attestation & Deficiency Remediation: Records quarterly attestations and flags deficiencies', () => {
    // 1. Effective Attestation
    const passAttestation = centralSecurityGovernanceService.submitControlAttestation({
      controlId: 'DOC-CTRL-001',
      organizationId: 'inst-sit',
      period: 'QUARTERLY',
      attestorId: 'emp-gov-001',
      statement: 'CONTROL_EFFECTIVE',
      evidenceReference: 'AUD-REP-Q1-2026'
    });

    expect(passAttestation.status).toBe('ATTESTED');
    expect(passAttestation.statement).toBe('CONTROL_EFFECTIVE');

    // 2. Ineffective Attestation triggering remediation
    const failAttestation = centralSecurityGovernanceService.submitControlAttestation({
      controlId: 'DOC-CTRL-002',
      organizationId: 'inst-sit',
      period: 'QUARTERLY',
      attestorId: 'emp-gov-001',
      statement: 'CONTROL_NOT_EFFECTIVE',
      evidenceReference: 'VULN-SCAN-Q1-2026'
    });

    expect(failAttestation.status).toBe('REMEDIATION_REQUIRED');
    expect(failAttestation.remediation_id).toBeDefined();
  });

  it('TEST 5: Security Certification & Governance KPIs: Validates ISO 27001 active status and dashboard posture', () => {
    const metrics = centralSecurityGovernanceService.getSecurityGovernanceDashboardMetrics(governanceOfficer);

    expect(metrics.activePoliciesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activeCertificationsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activeExceptionsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.governanceScorePercent).toBeGreaterThanOrEqual(90);
    expect(metrics.securityPosture).toBe('HEALTHY');
  });
});
