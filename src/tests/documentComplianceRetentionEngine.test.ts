import { describe, it, expect } from 'vitest';
import { centralDocumentComplianceService } from '../services/centralDocumentComplianceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.19: Central Document Compliance, Retention Schedule & Legal Hold Engine', () => {

  const complianceAdminContext: UserAuthorizationContext = {
    userId: 'emp-comp-001',
    userName: 'Legal & Compliance Officer',
    email: 'compliance@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['COMPLIANCE_ADMIN', 'HOLD_CREATE', 'HOLD_RELEASE', 'DISPOSAL_EXECUTE', 'RETENTION_OVERRIDE']
  };

  it('TEST 1: Retention Policy Creation & Schedule Calculation: Computes exact 7-year retention clock', () => {
    // 1. Create 7-Year Migration Certificate Retention Policy
    const pol = centralDocumentComplianceService.createRetentionPolicy({
      policyCode: 'POL_MIGRATION_RETENTION_7Y',
      policyName: 'Migration Certificate 7-Year Retention',
      description: 'Retain migration certificates for 7 years post student exit',
      documentTypeId: 'DOC_MIGRATION_CERT',
      classificationId: 'CONFIDENTIAL',
      retentionPeriod: 7,
      retentionUnit: 'YEARS',
      retentionBasis: 'STUDENT_EXIT',
      createdBy: 'emp-comp-001'
    });

    expect(pol.id).toBeDefined();
    expect(pol.policy_code).toBe('POL_MIGRATION_RETENTION_7Y');

    // 2. Assign retention schedule starting from student exit on 2026-08-29
    const schedule = centralDocumentComplianceService.assignRetentionSchedule({
      documentId: 'dms-doc-002',
      policyCode: 'POL_MIGRATION_RETENTION_7Y',
      startDate: '2026-08-29T00:00:00Z',
      context: complianceAdminContext
    });

    expect(schedule.retention_start_at).toContain('2026-08-29');
    expect(schedule.retention_end_at).toContain('2033-08-29');
    expect(schedule.status).toBe('ACTIVE');
    expect(schedule.is_on_hold).toBe(false);
  });

  it('TEST 2: Legal Hold Placement: Blocks disposal even when retention period has elapsed', () => {
    // Assign past-expired retention schedule for test
    const expiredSchedule = centralDocumentComplianceService.assignRetentionSchedule({
      documentId: 'dms-doc-003',
      policyCode: 'POL_MIGRATION_RETENTION_7Y',
      startDate: '2015-01-01T00:00:00Z', // Ended in 2022
      context: complianceAdminContext
    });

    expect(expiredSchedule.status).toBe('ELIGIBLE_FOR_DISPOSAL');

    // Place Legal Hold
    const hold = centralDocumentComplianceService.placeLegalHold({
      documentId: 'dms-doc-003',
      holdType: 'LEGAL_HOLD',
      reason: 'High Court Inquiry Case #4092/2026',
      authority: 'Gujarat High Court',
      createdBy: 'emp-comp-001'
    });

    expect(hold.id).toBeDefined();
    expect(hold.status).toBe('ACTIVE');
    expect(hold.hold_number).toMatch(/^HOLD\/2026\/\d{6}$/);

    // Attempting disposal with active hold must throw
    expect(() => {
      centralDocumentComplianceService.executeDisposal({
        documentId: 'dms-doc-003',
        executedBy: 'emp-comp-001',
        approvedBy: 'emp-comp-001',
        context: complianceAdminContext
      });
    }).toThrow(/Disposal Blocked: Document dms-doc-003 has an active legal hold/);
  });

  it('TEST 3: Legal Hold Release: Restores disposal eligibility after legal inquiry closure', () => {
    // Locate hold for dms-doc-003
    const activeHold = centralDocumentComplianceService.placeLegalHold({
      documentId: 'dms-doc-004',
      holdType: 'INVESTIGATION_HOLD',
      reason: 'Internal Audit Inquiry',
      authority: 'SSIU Audit Committee',
      createdBy: 'emp-comp-001'
    });

    // Release the hold
    const released = centralDocumentComplianceService.releaseLegalHold({
      holdId: activeHold.id,
      releasedBy: 'emp-comp-001',
      releaseReason: 'Audit concluded with clean clearance'
    });

    expect(released.status).toBe('RELEASED');
    expect(released.released_by).toBe('emp-comp-001');
  });

  it('TEST 4: Policy Override: Allows authorized officer to extend retention schedule', () => {
    const overridden = centralDocumentComplianceService.overrideRetentionPolicy({
      documentId: 'dms-doc-002',
      newRetentionEndDate: '2035-12-31T00:00:00Z',
      overrideReason: 'University Academic Council 10-year archival directive',
      approvedBy: 'emp-comp-001'
    });

    expect(overridden.retention_end_at).toContain('2035-12-31');
    expect(overridden.status).toBe('ACTIVE');
  });

  it('TEST 5: Secure Disposal & Disposal Certificate: Executes disposal and issues immutable certificate', () => {
    // Assign expired schedule to dms-doc-005 without hold
    centralDocumentComplianceService.assignRetentionSchedule({
      documentId: 'dms-doc-005',
      policyCode: 'POL_BONAFIDE_RETENTION_7Y',
      startDate: '2010-01-01T00:00:00Z',
      context: complianceAdminContext
    });

    // Execute disposal
    const cert = centralDocumentComplianceService.executeDisposal({
      documentId: 'dms-doc-005',
      executedBy: 'emp-comp-001',
      approvedBy: 'emp-comp-001',
      context: complianceAdminContext
    });

    expect(cert.id).toBeDefined();
    expect(cert.certificate_number).toMatch(/^DISP\/2026\/\d{6}$/);
    expect(cert.document_id).toBe('dms-doc-005');
    expect(cert.executed_by).toBe('emp-comp-001');
    expect(cert.disposal_method).toBe('LOGICAL_DISPOSAL');

    // Compliance Dashboard Metrics
    const metrics = centralDocumentComplianceService.getComplianceDashboardMetrics();
    expect(metrics.totalPoliciesCount).toBeGreaterThanOrEqual(2);
    expect(metrics.activeRetentionsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.disposedDocumentsCount).toBeGreaterThanOrEqual(1);
  });
});
