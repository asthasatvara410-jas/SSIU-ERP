import { describe, it, expect } from 'vitest';
import { centralDocumentComplianceControlService } from '../services/centralDocumentComplianceControlService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.27: Document Compliance Control Library Engine', () => {

  const complianceAdmin: UserAuthorizationContext = {
    userId: 'emp-comp-001',
    userName: 'Compliance & Risk Officer',
    email: 'risk@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['CONTROL_VIEW', 'CONTROL_CREATE', 'CONTROL_UPDATE', 'CONTROL_TEST', 'CONTROL_REVIEW', 'CONTROL_MONITOR', 'CONTROL_REPORT_VIEW']
  };

  it('TEST 1: Control Master & Versioning: Creates control, maps to statutory requirement, and bumps version', () => {
    const ctrl = centralDocumentComplianceControlService.createControl({
      controlCode: 'DOC-CTRL-003',
      name: 'Automated AICTE Faculty Qualification Expiry Monitoring',
      description: 'Continuous validation that all appointed faculty credentials remain active and verified',
      controlType: 'PREVENTIVE',
      category: 'COMPLIANCE',
      objective: 'Prevent accreditation non-compliance under AICTE norm',
      ownerId: 'emp-hr-001',
      organizationId: 'inst-sit',
      frequency: 'MONTHLY',
      riskLevel: 'HIGH',
      mappedRequirements: ['AICTE_FACULTY_QUAL_VERIFICATION'],
      mappedPolicies: ['POL_MIGRATION_RETENTION_7Y'],
      context: complianceAdmin
    });

    expect(ctrl.id).toBeDefined();
    expect(ctrl.control_code).toBe('DOC-CTRL-003');
    expect(ctrl.version).toBe(1);
    expect(ctrl.status).toBe('ACTIVE');

    // Bump version
    const updated = centralDocumentComplianceControlService.publishControlVersion('DOC-CTRL-003', {
      frequency: 'QUARTERLY'
    });
    expect(updated.version).toBe(2);
    expect(updated.frequency).toBe('QUARTERLY');
  });

  it('TEST 2: Control Testing & Effectiveness Assessment: Executes test and assesses effectiveness', () => {
    // 1. Passing test
    const passTest = centralDocumentComplianceControlService.executeControlTest({
      controlCode: 'DOC-CTRL-001',
      testedBy: 'emp-comp-001',
      method: 'AUTOMATED',
      sampleSize: 100,
      result: 'PASS',
      notes: 'All 100 ingested documents have valid SHA-256 hashes'
    });

    expect(passTest.test.id).toBeDefined();
    expect(passTest.test.test_number).toMatch(/^TST\/2026\/\d{6}$/);
    expect(passTest.test.result).toBe('PASS');
    expect(passTest.deficiency).toBeUndefined();

    // Assess effectiveness
    const eff = centralDocumentComplianceControlService.assessControlEffectiveness('DOC-CTRL-001');
    expect(eff).toBe('EFFECTIVE');
  });

  it('TEST 3: Deficiency Creation & Remediation Workflow: Logs deficiency on test fail and verifies remediation', () => {
    // 1. Failing test
    const failTest = centralDocumentComplianceControlService.executeControlTest({
      controlCode: 'DOC-CTRL-002',
      testedBy: 'emp-comp-001',
      method: 'INSPECTION',
      sampleSize: 20,
      result: 'FAIL',
      notes: 'Discovered 1 disposal request approved without dual officer separation'
    });

    expect(failTest.test.result).toBe('FAIL');
    expect(failTest.deficiency).toBeDefined();
    expect(failTest.deficiency?.deficiency_number).toMatch(/^DEF\/2026\/\d{6}$/);
    expect(failTest.deficiency?.severity).toBe('CRITICAL');
    expect(failTest.deficiency?.status).toBe('OPEN');

    const defId = failTest.deficiency!.id;

    // 2. Record Remediation Plan
    const rem = centralDocumentComplianceControlService.recordRemediationPlan({
      deficiencyId: defId,
      action: 'Enforced system-level API block preventing self-approval on disposal requests',
      ownerId: 'emp-sec-001'
    });
    expect(rem.status).toBe('REMEDIATION');

    // 3. Verify Closure
    const closed = centralDocumentComplianceControlService.verifyDeficiencyClosure({
      deficiencyId: defId,
      verifiedBy: 'emp-comp-001',
      isRemediated: true
    });
    expect(closed.status).toBe('CLOSED');
    expect(closed.verified_by).toBe('emp-comp-001');
  });

  it('TEST 4: Continuous Automated Monitoring: Runs automated monitor check without errors', () => {
    const mon = centralDocumentComplianceControlService.runControlMonitor('DOC-CTRL-001');
    expect(mon.id).toBeDefined();
    expect(mon.monitor_number).toMatch(/^MON\/2026\/\d{6}$/);
    expect(mon.result).toBe('PASS');
  });

  it('TEST 5: Control Matrix, Gap Analysis & Dashboard Telemetry: Inspects coverage matrix and KPIs', () => {
    const matrix = centralDocumentComplianceControlService.getControlMatrix();
    expect(matrix.length).toBeGreaterThanOrEqual(1);

    const gap = centralDocumentComplianceControlService.getControlGapAnalysis();
    expect(gap).toBeDefined();

    const metrics = centralDocumentComplianceControlService.getControlDashboardMetrics(complianceAdmin);
    expect(metrics.totalControlsCount).toBeGreaterThanOrEqual(2);
    expect(metrics.activeControlsCount).toBeGreaterThanOrEqual(2);
    expect(metrics.effectiveControlsCount).toBeGreaterThanOrEqual(1);
  });
});
