import { describe, it, expect } from 'vitest';
import { centralDocumentInternalAuditService } from '../services/centralDocumentInternalAuditService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.26: Document Compliance & Internal Audit Engine', () => {

  const leadAuditorContext: UserAuthorizationContext = {
    userId: 'emp-aud-001',
    userName: 'Prof. Lead Auditor',
    email: 'auditor@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['AUDIT_VIEW', 'AUDIT_PLAN', 'AUDIT_ASSIGN', 'AUDIT_EXECUTE', 'AUDIT_REVIEW', 'AUDIT_CLOSE', 'AUDIT_REPORT_VIEW']
  };

  it('TEST 1: Audit Planning & Scope: Creates and initializes structured internal audit plan', () => {
    const plan = centralDocumentInternalAuditService.createAuditPlan({
      name: 'Q1 Comprehensive DMS & Retention Governance Audit',
      description: 'Review of student dossiers, cold storage archives, and disposal certificates',
      auditType: 'DOCUMENT',
      organizationId: 'inst-sit',
      departmentId: 'dept-cse',
      plannedStart: '2026-03-01T00:00:00Z',
      plannedEnd: '2026-03-15T00:00:00Z',
      scopeSummary: 'Batch 2022-2026 CSE Student Dossiers',
      ownerId: 'emp-aud-001',
      context: leadAuditorContext
    });

    expect(plan.id).toBeDefined();
    expect(plan.audit_number).toMatch(/^AUD\/2026\/\d{6}$/);
    expect(plan.status).toBe('APPROVED');
  });

  it('TEST 2: Auditor Assignment & Conflict Declaration: Assigns auditor and verifies acceptance', () => {
    const asgn = centralDocumentInternalAuditService.assignAuditor({
      auditId: 'aud-seed-001',
      userId: 'emp-aud-001',
      role: 'LEAD_AUDITOR',
      conflictStatus: 'NO_CONFLICT'
    });

    expect(asgn.id).toBeDefined();
    expect(asgn.status).toBe('ACCEPTED');
    expect(asgn.conflict_status).toBe('NO_CONFLICT');
  });

  it('TEST 3: Checklist Testing & Automatic Finding Generation: Executes tests and logs finding on failure', () => {
    // 1. Passing Test
    const passTest = centralDocumentInternalAuditService.executeAuditTest({
      auditId: 'aud-seed-001',
      checklistItemId: 'chk-item-001',
      testedBy: 'emp-aud-001',
      result: 'PASS',
      evidenceReference: 'REV/2026/000001',
      notes: 'All sampled student degree certificates are cryptographically verified'
    });
    expect(passTest.test.result).toBe('PASS');
    expect(passTest.finding).toBeUndefined();

    // 2. Failing Test with automatic finding
    const failTest = centralDocumentInternalAuditService.executeAuditTest({
      auditId: 'aud-seed-001',
      checklistItemId: 'chk-item-002',
      testedBy: 'emp-aud-001',
      result: 'FAIL',
      notes: 'Discovered 4 legacy records missing SHA-256 cold storage verification hash'
    });
    expect(failTest.test.result).toBe('FAIL');
    expect(failTest.finding).toBeDefined();
    expect(failTest.finding?.finding_number).toMatch(/^AFN\/2026\/\d{6}$/);
    expect(failTest.finding?.severity).toBe('HIGH');
    expect(failTest.finding?.status).toBe('OPEN');
  });

  it('TEST 4: Corrective Action & Verification Workflow: Assigns remediation action and closes verified finding', () => {
    const failTest = centralDocumentInternalAuditService.executeAuditTest({
      auditId: 'aud-seed-001',
      checklistItemId: 'chk-item-002',
      testedBy: 'emp-aud-001',
      result: 'FAIL',
      notes: 'Sampled archive record missing verification metadata'
    });

    const findingId = failTest.finding!.id;

    // 1. Record Corrective Action
    const remediated = centralDocumentInternalAuditService.recordCorrectiveAction({
      findingId,
      action: 'Batch SHA-256 integrity hash calculation executed across legacy cold archive',
      ownerId: 'emp-sys-001'
    });
    expect(remediated.status).toBe('REMEDIATION');
    expect(remediated.corrective_action).toBeDefined();

    // 2. Verify Closure
    const closed = centralDocumentInternalAuditService.verifyFindingClosure({
      findingId,
      verifiedBy: 'emp-aud-001',
      isRemediated: true
    });
    expect(closed.status).toBe('CLOSED');
    expect(closed.verified_by).toBe('emp-aud-001');
  });

  it('TEST 5: Final Report Generation & Audit Dashboard Telemetry: Generates final report and checks metrics', () => {
    const report = centralDocumentInternalAuditService.finalizeAuditReport({
      auditId: 'aud-seed-001',
      approvedBy: 'emp-aud-001',
      executiveSummary: 'Annual Academic Audit completed with 100% test coverage and remediated findings.'
    });

    expect(report.id).toBeDefined();
    expect(report.report_number).toMatch(/^REP\/2026\/\d{6}$/);
    expect(report.certificate_number).toMatch(/^ACERT\/2026\/\d{6}$/);
    expect(report.version).toBe('FINAL');

    const metrics = centralDocumentInternalAuditService.getAuditDashboardMetrics(leadAuditorContext);
    expect(metrics.totalPlannedAudits).toBeGreaterThanOrEqual(1);
    expect(metrics.closedAuditsCount).toBeGreaterThanOrEqual(1);
  });
});
