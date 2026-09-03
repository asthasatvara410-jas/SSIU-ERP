import { describe, it, expect } from 'vitest';
import { centralDocumentRegulatoryComplianceService } from '../services/centralDocumentRegulatoryComplianceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.25: Document Compliance & Regulatory Record Management Engine', () => {

  const complianceAdmin: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar & Compliance Chair',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['COMPLIANCE_VIEW', 'COMPLIANCE_SEARCH', 'COMPLIANCE_CREATE', 'COMPLIANCE_REVIEW', 'COMPLIANCE_APPROVE', 'COMPLIANCE_ADMIN', 'COMPLIANCE_AUDIT_PACKAGE']
  };

  it('TEST 1: Regulatory Requirement Mapping: Maps document record to statutory UGC mandate', () => {
    const record = centralDocumentRegulatoryComplianceService.mapComplianceRecord({
      documentId: 'dms-doc-deg-001',
      requirementCode: 'UGC_DEGREE_ARCHIVE_MANDATE',
      organizationId: 'inst-sit',
      ownerId: 'emp-reg-001',
      context: complianceAdmin
    });

    expect(record.id).toBeDefined();
    expect(record.record_number).toMatch(/^CMP\/2026\/\d{6}$/);
    expect(record.compliance_status).toBe('COMPLIANT');
    expect(record.risk_level).toBe('LOW');
  });

  it('TEST 2: Evidence Attachment & Validity: Links valid digital evidence with tamper-proof reference', () => {
    const evidence = centralDocumentRegulatoryComplianceService.addComplianceEvidence({
      requirementCode: 'AICTE_FACULTY_QUAL_VERIFICATION',
      documentId: 'dms-doc-fac-001',
      evidenceType: 'CERTIFICATE',
      collectedBy: 'emp-reg-001',
      validDays: 365
    });

    expect(evidence.id).toBeDefined();
    expect(evidence.evidence_number).toMatch(/^REV\/2026\/\d{6}$/);
    expect(evidence.status).toBe('VALID');
    expect(evidence.valid_to).toBeDefined();
  });

  it('TEST 3: Compliance Checks & Findings: Runs check and creates high-severity finding on check failure', () => {
    // 1. Passing check
    const passResult = centralDocumentRegulatoryComplianceService.runRegulatoryComplianceCheck({
      requirementCode: 'UGC_DEGREE_ARCHIVE_MANDATE',
      scope: 'ALL_FACULTY_SIT',
      performedBy: 'emp-reg-001'
    });
    expect(passResult.check.result).toBe('PASS');
    expect(passResult.finding).toBeUndefined();

    // 2. Failing check
    const failResult = centralDocumentRegulatoryComplianceService.runRegulatoryComplianceCheck({
      requirementCode: 'STATE_ADMISSION_RESERVATION_EVID',
      scope: 'ADMISSION_BATCH_2026',
      performedBy: 'emp-reg-001',
      simulateFailure: true
    });
    expect(failResult.check.result).toBe('FAIL');
    expect(failResult.finding).toBeDefined();
    expect(failResult.finding?.finding_number).toMatch(/^FND\/2026\/\d{6}$/);
    expect(failResult.finding?.severity).toBe('HIGH');
    expect(failResult.finding?.status).toBe('OPEN');
  });

  it('TEST 4: Exception Management & Audit Readiness Package: Issues exception and compiles audit package', () => {
    // 1. Request Exception
    const exc = centralDocumentRegulatoryComplianceService.requestComplianceException({
      requirementCode: 'STATE_ADMISSION_RESERVATION_EVID',
      scope: 'ADMISSION_BATCH_2026_PROVISIONAL',
      reason: 'Late government caste validity certificate verification window extended by state board',
      risk: 'MEDIUM',
      requestedBy: 'emp-reg-001',
      durationDays: 60
    });

    expect(exc.id).toBeDefined();
    expect(exc.exception_number).toMatch(/^EXC\/2026\/\d{6}$/);
    expect(exc.status).toBe('ACTIVE');

    // 2. Generate Audit Package
    const pkg = centralDocumentRegulatoryComplianceService.generateAuditReadinessPackage({
      scope: 'ANNUAL_STATUTORY_AUDIT_2026',
      generatedBy: 'emp-reg-001'
    });

    expect(pkg.id).toBeDefined();
    expect(pkg.packageNumber).toMatch(/^PKG\/2026\/\d{6}$/);
    expect(pkg.readinessScorePercent).toBeGreaterThanOrEqual(0);
    expect(pkg.evidenceItemsCount).toBeGreaterThanOrEqual(1);
  });

  it('TEST 5: Compliance Calendar & Dashboard Telemetry: Synchronizes obligation calendar and executive KPIs', () => {
    const calendarEvents = centralDocumentRegulatoryComplianceService.getComplianceCalendarEvents();
    expect(calendarEvents.length).toBeGreaterThanOrEqual(1);
    expect(calendarEvents[0].eventType).toBe('OBLIGATION_DUE');

    const dashboard = centralDocumentRegulatoryComplianceService.getRegulatoryComplianceDashboard();
    expect(dashboard.totalRequirementsCount).toBe(3);
    expect(dashboard.overallComplianceScorePercent).toBeGreaterThanOrEqual(0);
    expect(dashboard.openFindingsCount).toBeGreaterThanOrEqual(1);
  });
});
