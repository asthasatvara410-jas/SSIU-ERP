import { describe, it, expect } from 'vitest';
import { centralDataGovernanceService } from '../services/centralDataGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.35: Data Governance & Master Data Quality Engine', () => {

  const dataSteward: UserAuthorizationContext = {
    userId: 'emp-steward-001',
    userName: 'Chief Data Governance Officer & Lead Steward',
    email: 'datagov@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'DATA_GOVERNANCE_VIEW',
      'DATA_DOMAIN_MANAGE',
      'DATA_QUALITY_RULE_MANAGE',
      'DATA_QUALITY_RUN',
      'DATA_DUPLICATE_REVIEW',
      'DATA_DUPLICATE_MERGE',
      'DATA_LINEAGE_VIEW',
      'DATA_RECONCILIATION_MANAGE',
      'DATA_GOVERNANCE_REPORT'
    ]
  };

  it('TEST 1: Data Quality Rules & Profiling: Executes rules and generates actionable data quality issues', () => {
    // Register format validation rule
    centralDataGovernanceService.createQualityRule({
      ruleCode: 'DQR-STUDENT-EMAIL-FMT',
      name: 'Valid University Student Email Format',
      domain: 'STUDENT',
      entityCode: 'STUDENT_MASTER_RECORD',
      attributeCode: 'email',
      dimension: 'VALIDITY',
      ruleType: 'FORMAT',
      severity: 'HIGH'
    });

    const testRecords = [
      { id: 'rec-001', enrollment_number: 'ENR-2026-001', email: 'student1@swarrnim.edu.in' },
      { id: 'rec-002', enrollment_number: '', email: 'student2@swarrnim.edu.in' },          // Missing enrollment_number
      { id: 'rec-003', enrollment_number: 'ENR-2026-003', email: 'invalid-email-address' }   // Invalid email
    ];

    const result = centralDataGovernanceService.runDataQualityProfile({
      entityCode: 'STUDENT_MASTER_RECORD',
      records: testRecords
    });

    expect(result.qualityScorePercent).toBeLessThan(100);
    expect(result.issuesGenerated.length).toBeGreaterThanOrEqual(2);
    expect(result.issuesGenerated[0].issue_number).toMatch(/^DQ-2026-\d{6}$/);
    expect(result.issuesGenerated[0].status).toBe('OPEN');
  });

  it('TEST 2: Duplicate Detection & Controlled Merge: Detects candidates and enforces cross-org merge protection', () => {
    // 1. Cross-org candidate
    const crossOrgCandidate = centralDataGovernanceService.detectDuplicateCandidate({
      entityCode: 'STUDENT_MASTER_RECORD',
      recordAId: 'stu-campus-a-01',
      recordBId: 'stu-campus-b-02',
      matchScore: 94,
      orgA: 'inst-sit-campus-1',
      orgB: 'inst-sit-campus-2'
    });

    expect(crossOrgCandidate.id).toBeDefined();
    expect(crossOrgCandidate.match_score).toBe(94);

    // Cross-org merge must throw
    expect(() => {
      centralDataGovernanceService.mergeDuplicate(crossOrgCandidate.id, 'emp-steward-001');
    }).toThrow(/Unauthorized Cross-Organization Merge Blocked/);

    // 2. Intra-org candidate
    const intraOrgCandidate = centralDataGovernanceService.detectDuplicateCandidate({
      entityCode: 'STUDENT_MASTER_RECORD',
      recordAId: 'stu-sit-01',
      recordBId: 'stu-sit-02',
      matchScore: 98,
      orgA: 'inst-sit',
      orgB: 'inst-sit'
    });

    const merged = centralDataGovernanceService.mergeDuplicate(intraOrgCandidate.id, 'emp-steward-001');
    expect(merged.status).toBe('MERGED');
    expect(merged.decision).toBeDefined();
  });

  it('TEST 3: Data Lineage & Impact Analysis: Traces data transformations and downstream dependencies', () => {
    const impact = centralDataGovernanceService.runImpactAnalysis('STUDENT_MASTER_RECORD');

    expect(impact.entityCode).toBe('STUDENT_MASTER_RECORD');
    expect(impact.downstreamSystems).toContain('Fee Invoicing Ledger');
    expect(impact.downstreamSystems).toContain('Transcript Generation Engine');
    expect(impact.dependenciesCount).toBeGreaterThanOrEqual(3);
  });

  it('TEST 4: Data Reconciliation Engine: Reconciles counts and detects mismatched ledger records', () => {
    // 1. Matched run
    const passRun = centralDataGovernanceService.executeReconciliation({
      reconciliationCode: 'REC-ADMISSIONS-FEES-Q1',
      sourceSystem: 'Admissions Intake Ledger',
      targetSystem: 'Finance Student Receivables',
      sourceCount: 1500,
      targetCount: 1500
    });

    expect(passRun.status).toBe('MATCHED');
    expect(passRun.difference_count).toBe(0);

    // 2. Mismatched run
    const failRun = centralDataGovernanceService.executeReconciliation({
      reconciliationCode: 'REC-EXAM-ENROLLMENT-Q1',
      sourceSystem: 'Examination Hall Ticket Index',
      targetSystem: 'Academic Enrollment Master',
      sourceCount: 1500,
      targetCount: 1485
    });

    expect(failRun.status).toBe('MISMATCHED');
    expect(failRun.difference_count).toBe(15);
  });

  it('TEST 5: Data Governance Dashboard Telemetry: Validates KPIs and institutional data posture', () => {
    const metrics = centralDataGovernanceService.getDataGovernanceDashboardMetrics(dataSteward);

    expect(metrics.governedDomainsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.dataEntitiesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.overallQualityScorePercent).toBeGreaterThanOrEqual(90);
    expect(metrics.governancePosture).toBe('HEALTHY');
  });
});
