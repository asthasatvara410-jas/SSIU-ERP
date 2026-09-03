import { describe, it, expect } from 'vitest';
import { centralDocumentComplianceAuditService } from '../services/centralDocumentComplianceAuditService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.20: Central Document Compliance Audit, Evidence & Audit Pack Engine', () => {

  const auditorContext: UserAuthorizationContext = {
    userId: 'emp-audit-001',
    userName: 'Lead Compliance Auditor',
    email: 'auditor@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['COMPLIANCE_ADMIN', 'RUN_AUDIT', 'GENERATE_AUDIT_PACK', 'RESOLVE_EXCEPTION']
  };

  it('TEST 1: Compliance Audit Run & Missing Document Detection: Identifies missing mandatory identity document', () => {
    const { auditRun, newExceptions } = centralDocumentComplianceAuditService.runComplianceAudit({
      scope: 'STUDENTS_BTECH_CSE_2026',
      targetEntityIds: ['STU-2026-000001', 'STU-2026-000002'],
      auditedBy: 'emp-audit-001',
      context: auditorContext
    });

    expect(auditRun.id).toBeDefined();
    expect(auditRun.audit_number).toMatch(/^CA\/2026\/\d{6}$/);
    expect(auditRun.records_checked).toBe(2);
    expect(auditRun.exceptions_found).toBeGreaterThanOrEqual(1);

    const missingExc = newExceptions.find(e => e.entity_id === 'STU-2026-000002' && e.rule_code === 'REQ_STUDENT_IDENTITY');
    expect(missingExc).toBeDefined();
    expect(missingExc?.exception_type).toBe('MISSING_DOCUMENT');
    expect(missingExc?.severity).toBe('CRITICAL');
    expect(missingExc?.status).toBe('OPEN');
  });

  it('TEST 2: Corrective Action Assignment: Assigns document remediation action to student section', () => {
    // 1. Run audit
    const { newExceptions } = centralDocumentComplianceAuditService.runComplianceAudit({
      scope: 'STUDENTS_PHARMACY_2026',
      targetEntityIds: ['STU-2026-000002'],
      auditedBy: 'emp-audit-001',
      context: auditorContext
    });

    const exc = newExceptions[0];
    expect(exc).toBeDefined();

    // 2. Assign corrective action
    const action = centralDocumentComplianceAuditService.assignCorrectiveAction({
      exceptionId: exc.id,
      actionType: 'UPLOAD_DOCUMENT',
      description: 'Collect and upload verified Aadhaar card from student Diya Shah',
      assignedTo: 'emp-sec-001',
      dueDays: 5
    });

    expect(action.id).toBeDefined();
    expect(action.status).toBe('PENDING');
    expect(action.assigned_to).toBe('emp-sec-001');
    expect(exc.status).toBe('ACTION_REQUIRED');
  });

  it('TEST 3: Evidence Attachment & Exception Resolution: Resolves exception and captures audit evidence', () => {
    const { newExceptions } = centralDocumentComplianceAuditService.runComplianceAudit({
      scope: 'STUDENTS_NURSING_2026',
      targetEntityIds: ['STU-2026-000002'],
      auditedBy: 'emp-audit-001',
      context: auditorContext
    });

    const exc = newExceptions[0];
    const action = centralDocumentComplianceAuditService.assignCorrectiveAction({
      exceptionId: exc.id,
      actionType: 'UPLOAD_DOCUMENT',
      description: 'Upload Aadhaar copy',
      assignedTo: 'emp-sec-001'
    });

    // Resolve exception with uploaded document evidence
    const { exception, evidence } = centralDocumentComplianceAuditService.resolveExceptionWithEvidence({
      exceptionId: exc.id,
      actionId: action.id,
      evidenceDocumentId: 'dms-doc-001',
      description: 'Physical Aadhaar verified and uploaded to DMS',
      resolvedBy: 'emp-sec-001'
    });

    expect(exception.status).toBe('RESOLVED');
    expect(evidence.id).toBeDefined();
    expect(evidence.evidence_number).toMatch(/^EVID\/2026\/\d{6}$/);
    expect(evidence.integrity_hash).toContain('sha256_ev_');
  });

  it('TEST 4: Audit Pack Compilation: Compiles immutable audit pack with evidence index', () => {
    const { auditRun } = centralDocumentComplianceAuditService.runComplianceAudit({
      scope: 'FACULTY_ENGINEERING_2026',
      targetEntityIds: ['EMP-FAC-001'],
      auditedBy: 'emp-audit-001',
      context: auditorContext
    });

    const pack = centralDocumentComplianceAuditService.generateAuditPack({
      auditRunId: auditRun.id,
      generatedBy: 'emp-audit-001'
    });

    expect(pack.id).toBeDefined();
    expect(pack.pack_number).toMatch(/^AUDIT-PACK\/2026\/\d{6}$/);
    expect(pack.status).toBe('FINAL');
    expect(pack.compliance_score_percent).toBe(100);
  });

  it('TEST 5: Compliance Audit Dashboard Metrics: Synchronizes operational compliance metrics', () => {
    const metrics = centralDocumentComplianceAuditService.getComplianceAuditDashboardMetrics();
    expect(metrics.totalAuditsCount).toBeGreaterThanOrEqual(4);
    expect(metrics.recordsCheckedCount).toBeGreaterThanOrEqual(4);
    expect(metrics.auditPacksGeneratedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.complianceScorePercent).toBeGreaterThanOrEqual(0);
  });
});
