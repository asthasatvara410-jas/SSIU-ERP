import { describe, it, expect } from 'vitest';
import { centralMasterDataGovernanceService } from '../services/centralMasterDataGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.48: Enterprise Master Data Governance & Data Quality Engine', () => {

  const dataSteward: UserAuthorizationContext = {
    userId: 'emp-steward-001',
    userName: 'Enterprise Data Steward',
    email: 'data.steward@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['MDG_VIEW', 'MDG_VALIDATE', 'MDG_MERGE', 'DATA_STEWARD_ADMIN']
  };

  it('TEST 1: Data Quality & Validation Engine: Blocks invalid records and records quality issues', () => {
    // 1. Invalid payload missing mandatory fields
    const invalidRes = centralMasterDataGovernanceService.validateMasterRecord('STUDENT_MASTER', {
      enrollment_number: '2026-CE-099'
      // missing first_name, email, department_id
    });

    expect(invalidRes.is_valid).toBe(false);
    expect(invalidRes.errors.length).toBeGreaterThanOrEqual(2);

    // 2. Valid payload
    const validRes = centralMasterDataGovernanceService.validateMasterRecord('STUDENT_MASTER', {
      enrollment_number: '2026-CE-099',
      first_name: 'Diya',
      email: 'diya.ce2026@swarrnim.edu.in',
      department_id: 'dept-ce'
    });

    expect(validRes.is_valid).toBe(true);
    expect(validRes.errors.length).toBe(0);
  });

  it('TEST 2: Duplicate Detection Engine: Identifies matching duplicate records using normalized fields', () => {
    const duplicates = centralMasterDataGovernanceService.findDuplicates('STUDENT_MASTER', 'aarav.ce2026@swarrnim.edu.in');
    expect(duplicates.length).toBe(2);
    expect(duplicates[0].id).toBe('stu-rec-001');
    expect(duplicates[1].id).toBe('stu-rec-002');
  });

  it('TEST 3: Governed Merge & Audit: Safely consolidates duplicate records and produces immutable merge audit', () => {
    const mergeRes = centralMasterDataGovernanceService.mergeRecords({
      survivingRecordId: 'stu-rec-001',
      victimRecordId: 'stu-rec-002',
      reason: 'Duplicate student record created during bulk application intake migration',
      context: dataSteward
    });

    expect(mergeRes.merged).toBe(true);
    expect(mergeRes.audit_id).toContain('MDG-MERGE-');

    // Re-query duplicates -> now only 1 active record remains
    const activeAfterMerge = centralMasterDataGovernanceService.findDuplicates('STUDENT_MASTER', 'aarav.ce2026@swarrnim.edu.in');
    expect(activeAfterMerge.length).toBe(1);
    expect(activeAfterMerge[0].id).toBe('stu-rec-001');
  });

  it('TEST 4: Data Lineage & Flow Tracing: Traces upstream sources and downstream consumers', () => {
    const lineage = centralMasterDataGovernanceService.getDataLineage('STUDENT_MASTER');
    expect(lineage.upstream).toContain('Integration Hub');
    expect(lineage.downstream).toContain('Enrollment Service');
    expect(lineage.downstream).toContain('BI & Reporting Catalog');
  });

  it('TEST 5: Data Quality Dashboard Telemetry: Validates quality scores, issues count, and posture', () => {
    const metrics = centralMasterDataGovernanceService.getDataQualityDashboardMetrics(dataSteward);

    expect(metrics.overallQualityScore).toBeGreaterThanOrEqual(95);
    expect(metrics.completenessScore).toBeGreaterThanOrEqual(95);
    expect(metrics.uniquenessScore).toBeGreaterThanOrEqual(95);
    expect(metrics.governancePosture).toBe('HEALTHY');
  });
});
