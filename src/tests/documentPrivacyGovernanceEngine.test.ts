import { describe, it, expect } from 'vitest';
import { centralPrivacyGovernanceService } from '../services/centralPrivacyGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.34: Privacy Governance & Personal Data Protection Engine', () => {

  const dpoOfficer: UserAuthorizationContext = {
    userId: 'emp-dpo-001',
    userName: 'Data Protection Officer (DPO)',
    email: 'dpo@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'PRIVACY_VIEW',
      'DATA_INVENTORY_MANAGE',
      'PROCESSING_ACTIVITY_MANAGE',
      'CONSENT_MANAGE',
      'DSR_MANAGE',
      'PIA_APPROVE',
      'PRIVACY_REPORT'
    ]
  };

  it('TEST 1: Processing Activity Registration (RoPA): Registers processing activity with legal basis', () => {
    const activity = centralPrivacyGovernanceService.registerProcessingActivity({
      name: 'Hostel Resident Biometric Access & Meal Management',
      purpose: 'Verification of resident identity for hostel premises security and mess hall access',
      dataCategories: ['IDENTITY', 'BIOMETRIC', 'CONTACT'],
      dataSubjectCategories: ['Students', 'Resident Wardens'],
      legalBasis: 'CONSENT',
      organizationId: 'inst-sit',
      departmentId: 'dept-hostel',
      systemReference: 'Hostel Biometric Gateway',
      retentionPolicyRef: 'RET-HOSTEL-RESIDENCY-DURATION',
      context: dpoOfficer
    });

    expect(activity.id).toBeDefined();
    expect(activity.processing_number).toMatch(/^PRIV-PA-2026-\d{6}$/);
    expect(activity.status).toBe('ACTIVE');
    expect(activity.legal_basis).toBe('CONSENT');
  });

  it('TEST 2: Consent Lifecycle: Grants consent with evidence and supports verifiable withdrawal', () => {
    // 1. Grant Consent
    const consent = centralPrivacyGovernanceService.grantConsent({
      dataSubjectId: 'stu-2026-999',
      purpose: 'Alumni Placement Newsletter & Career Opportunity Direct Outreach',
      processingActivityId: 'pa-seed-001',
      version: 1,
      evidenceReference: 'EVD-PORTAL-CLICKWRAP-2026'
    });

    expect(consent.id).toBeDefined();
    expect(consent.consent_number).toMatch(/^CONS-2026-\d{6}$/);
    expect(consent.consent_status).toBe('GRANTED');
    expect(consent.given_at).toBeDefined();

    // 2. Withdraw Consent
    const withdrawn = centralPrivacyGovernanceService.withdrawConsent(consent.id);
    expect(withdrawn.consent_status).toBe('WITHDRAWN');
    expect(withdrawn.withdrawn_at).toBeDefined();
  });

  it('TEST 3: Data Subject Requests (DSR): Submits access request and completes fulfillment', () => {
    const dsr = centralPrivacyGovernanceService.submitDSR({
      dataSubjectId: 'stu-2026-888',
      requestType: 'ACCESS',
      description: 'Student requested full export of academic dossier, attendance logs, and fee receipts',
      context: dpoOfficer
    });

    expect(dsr.id).toBeDefined();
    expect(dsr.request_number).toMatch(/^DSR-2026-\d{6}$/);
    expect(dsr.status).toBe('RECEIVED');

    // Fulfill DSR
    const fulfilled = centralPrivacyGovernanceService.fulfillDSR(dsr.id, 'emp-dpo-001');
    expect(fulfilled.status).toBe('COMPLETED');
    expect(fulfilled.identity_verified).toBe(true);
    expect(fulfilled.completion_notes).toBeDefined();
  });

  it('TEST 4: Deletion Validation & Legal Hold / Retention Gates: Blocks deletion under legal hold and statutory retention', () => {
    // 1. Deletion request with Legal Hold
    const dsrLegalHold = centralPrivacyGovernanceService.submitDSR({
      dataSubjectId: 'stu-2026-777',
      requestType: 'DELETION',
      description: 'Right to be Forgotten deletion request on admission dossier',
      hasActiveLegalHold: true
    });

    expect(() => {
      centralPrivacyGovernanceService.fulfillDSR(dsrLegalHold.id, 'emp-dpo-001');
    }).toThrow(/Deletion Request Blocked: Active Legal Hold is in effect/);

    // 2. Deletion request with Mandatory Statutory Retention
    const dsrRetention = centralPrivacyGovernanceService.submitDSR({
      dataSubjectId: 'stu-2026-666',
      requestType: 'DELETION',
      description: 'Deletion request on permanent degree register',
      hasMandatoryRetention: true
    });

    expect(() => {
      centralPrivacyGovernanceService.fulfillDSR(dsrRetention.id, 'emp-dpo-001');
    }).toThrow(/Deletion Request Blocked: Mandatory statutory retention requirement/);
  });

  it('TEST 5: Privacy Impact Assessment (PIA) & Executive Dashboard: Creates PIA and validates posture metrics', () => {
    const pia = centralPrivacyGovernanceService.createPIA({
      processingActivityId: 'pa-seed-001',
      riskLevel: 'HIGH',
      safeguardsDocumented: true
    });

    expect(pia.id).toBeDefined();
    expect(pia.pia_number).toMatch(/^PIA-2026-\d{6}$/);
    expect(pia.status).toBe('APPROVED');

    const metrics = centralPrivacyGovernanceService.getPrivacyGovernanceDashboardMetrics(dpoOfficer);
    expect(metrics.processingActivitiesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.personalDataElementsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.completedDSRsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.privacyComplianceScorePercent).toBeGreaterThanOrEqual(90);
    expect(metrics.privacyPosture).toBe('HEALTHY');
  });
});
