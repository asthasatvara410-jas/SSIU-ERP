import { describe, it, expect } from 'vitest';
import { centralBusinessContinuityService } from '../services/centralBusinessContinuityService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.29: Business Continuity & Disaster Recovery Management Engine', () => {

  const bcpOfficer: UserAuthorizationContext = {
    userId: 'emp-bcp-001',
    userName: 'Director of Business Continuity & Disaster Recovery',
    email: 'bcp@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['BCP_VIEW', 'BCP_CREATE', 'BCP_UPDATE', 'BCP_APPROVE', 'BIA_MANAGE', 'DR_VIEW', 'DR_CREATE', 'DR_EXECUTE', 'DR_TEST', 'BACKUP_VIEW', 'RESTORE_TEST', 'DISASTER_DECLARE', 'RECOVERY_REPORT_VIEW']
  };

  it('TEST 1: BCP Master & Business Impact Analysis (BIA): Creates BCP and validates RTO <= MTD rule', () => {
    const bcp = centralBusinessContinuityService.createBCP({
      name: 'Campus IT, Admissions & Central Student Record BCP',
      description: 'Business continuity plan for student records, fee receipts, and degree verification APIs',
      organizationId: 'inst-sit',
      ownerId: 'emp-bcp-001',
      context: bcpOfficer
    });

    expect(bcp.id).toBeDefined();
    expect(bcp.bcp_number).toMatch(/^BCP\/2026\/\d{6}$/);
    expect(bcp.status).toBe('APPROVED');

    // Register critical process with valid RTO <= MTD
    const proc = centralBusinessContinuityService.registerCriticalProcess({
      processName: 'Online Admission Intake & Fee Ledger Validation',
      ownerId: 'emp-reg-001',
      organizationId: 'inst-sit',
      criticality: 'HIGH',
      recoveryPriority: 'P1',
      maxTolerableDowntimeHours: 12,
      targetRtoHours: 6,
      targetRpoHours: 2,
      primaryRecoveryStrategy: 'BACKUP_RESTORE',
      fallbackStrategy: 'Manual Paper Intake with 24h Post-Recovery Data Ingestion'
    });

    expect(proc.id).toBeDefined();
    expect(proc.recovery_priority).toBe('P1');

    // Invalid config where Target RTO > MTD must throw configuration conflict
    expect(() => {
      centralBusinessContinuityService.registerCriticalProcess({
        processName: 'Invalid Process Config',
        ownerId: 'emp-reg-001',
        organizationId: 'inst-sit',
        criticality: 'MEDIUM',
        recoveryPriority: 'P2',
        maxTolerableDowntimeHours: 4,
        targetRtoHours: 8, // Exceeds MTD
        targetRpoHours: 2,
        primaryRecoveryStrategy: 'FAILOVER',
        fallbackStrategy: 'None'
      });
    }).toThrow(/Configuration Conflict: Target RTO \(8h\) cannot exceed MTD \(4h\)/);
  });

  it('TEST 2: Process Dependency & Single Point of Failure (SPOF): Maps infrastructure and flags SPOF', () => {
    const dep = centralBusinessContinuityService.addProcessDependency({
      processId: 'proc-seed-001',
      dependencyName: 'Third-Party SMS Gateway for OTP Verification',
      dependencyType: 'THIRD_PARTY',
      criticality: 'REQUIRED',
      isSpof: true
    });

    expect(dep.id).toBeDefined();
    expect(dep.is_spof).toBe(true);
    expect(dep.criticality).toBe('REQUIRED');
  });

  it('TEST 3: DR Planning & Disaster Declaration: Creates DR plan and logs disaster event lifecycle', () => {
    const drPlan = centralBusinessContinuityService.createDRPlan({
      name: 'Primary Data Center Storage & Database Failover Runbook',
      organizationId: 'inst-sit',
      ownerId: 'emp-bcp-001',
      scenario: 'DATABASE_FAILURE',
      runbookSteps: [
        { step_number: 1, action: 'Detect database split-brain / storage corruption', owner_role: 'DATABASE_LEAD', timeout_minutes: 15 },
        { step_number: 2, action: 'Promote hot replica to primary cluster node', owner_role: 'TECHNICAL_LEAD', timeout_minutes: 30 },
        { step_number: 3, action: 'Verify application connectivity and DMS read-write', owner_role: 'APPLICATION_LEAD', timeout_minutes: 15 }
      ]
    });

    expect(drPlan.id).toBeDefined();
    expect(drPlan.dr_number).toMatch(/^DRP\/2026\/\d{6}$/);
    expect(drPlan.runbook_steps.length).toBe(3);

    // Declare disaster
    const disaster = centralBusinessContinuityService.declareDisaster({
      scenario: 'DATABASE_FAILURE',
      organizationId: 'inst-sit',
      declaredBy: 'emp-bcp-001',
      severity: 'CRITICAL',
      context: bcpOfficer
    });

    expect(disaster.id).toBeDefined();
    expect(disaster.event_number).toMatch(/^DIS\/2026\/\d{6}$/);
    expect(disaster.status).toBe('DECLARED');
  });

  it('TEST 4: Restore Testing & Recovery Gap Detection: Detects RTO/RPO breach and creates recovery gap', () => {
    // 1. Passing restore test
    const passResult = centralBusinessContinuityService.executeRestoreTest({
      backupId: 'bkp-2026-001',
      targetEnvironment: 'STAGING_DR_CLUSTER',
      testedBy: 'emp-bcp-001',
      actualRtoHours: 2,
      actualRpoHours: 0.5,
      processName: 'Examination Record Preservation',
      targetRtoHours: 4,
      targetRpoHours: 1
    });

    expect(passResult.test.result).toBe('PASS');
    expect(passResult.test.database_integrity_verified).toBe(true);
    expect(passResult.gap).toBeUndefined();

    // 2. Failing restore test (Actual RTO 6h > Target 4h)
    const failResult = centralBusinessContinuityService.executeRestoreTest({
      backupId: 'bkp-2026-002',
      targetEnvironment: 'STAGING_DR_CLUSTER',
      testedBy: 'emp-bcp-001',
      actualRtoHours: 6, // Exceeds target 4h
      actualRpoHours: 0.5,
      processName: 'Examination Record Preservation',
      targetRtoHours: 4,
      targetRpoHours: 1
    });

    expect(failResult.test.result).toBe('FAIL');
    expect(failResult.gap).toBeDefined();
    expect(failResult.gap?.gap_number).toMatch(/^GAP\/2026\/\d{6}$/);
    expect(failResult.gap?.metric).toBe('RTO');
    expect(failResult.gap?.status).toBe('OPEN');
  });

  it('TEST 5: DR Exercise Simulation & Dashboard Telemetry: Conducts DR test and asserts dashboard metrics', () => {
    const drTest = centralBusinessContinuityService.createDRTest({
      drPlanId: 'drp-seed-001',
      testType: 'TECHNICAL',
      scope: 'Annual Database Replica Failover Simulation',
      plannedDate: '2026-04-15T00:00:00Z',
      conductedBy: 'emp-bcp-001'
    });

    expect(drTest.id).toBeDefined();
    expect(drTest.test_number).toMatch(/^DRT\/2026\/\d{6}$/);
    expect(drTest.result).toBe('PASS');

    const metrics = centralBusinessContinuityService.getBCPDashboardMetrics(bcpOfficer);
    expect(metrics.activePlansCount).toBeGreaterThanOrEqual(1);
    expect(metrics.criticalProcessesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.openRecoveryGapsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.spofIdentifiedCount).toBeGreaterThanOrEqual(1);
  });
});
