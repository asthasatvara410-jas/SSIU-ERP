/**
 * SSIU ERP — Student Governance & Management Unit Tests
 * File: src/modules/students/tests/studentGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { studentGovernanceService } from '../services/studentGovernanceService';

describe('SSIU ERP — Student Management Hub Engine', () => {
  it('TEST 1: Aggregates student cohort demographics & gender ratios correctly', () => {
    const metrics = studentGovernanceService.getStudentGovernanceMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.totalStudents).toBeGreaterThan(0);
    expect(metrics.activeStudents).toBeLessThanOrEqual(metrics.totalStudents);
    expect(metrics.genderRatio.male + metrics.genderRatio.female + metrics.genderRatio.other).toBe(metrics.totalStudents);
    expect(metrics.departmentBreakdown.length).toBeGreaterThan(0);
  });

  it('TEST 2: Calculates ABC ID compliance and APAAR verification metrics', () => {
    const metrics = studentGovernanceService.getStudentGovernanceMetrics();
    const complianceList = studentGovernanceService.getStudentAbcComplianceList();

    expect(metrics.abcIdCompliancePercentage).toBeGreaterThanOrEqual(0);
    expect(metrics.abcIdCompliancePercentage).toBeLessThanOrEqual(100);
    expect(complianceList.length).toBeGreaterThan(0);

    const firstItem = complianceList[0];
    expect(firstItem.studentId).toBeDefined();
    expect(firstItem.enrollmentNumber).toBeDefined();
    expect(['VERIFIED', 'PENDING_UPLOAD', 'REJECTED']).toContain(firstItem.complianceStatus);
  });

  it('TEST 3: Evaluates batch promotion preview readiness without mutating live data', () => {
    const previews = studentGovernanceService.getBatchPromotionPreviews();

    expect(previews.length).toBeGreaterThan(0);
    const firstBatch = previews[0];

    expect(firstBatch.batchId).toBeDefined();
    expect(firstBatch.totalStudents).toBeGreaterThan(0);
    expect(firstBatch.eligibleCount).toBeLessThanOrEqual(firstBatch.totalStudents);
    expect(['READY', 'ATTENTION_REQUIRED', 'BLOCKED']).toContain(firstBatch.readinessStatus);
    expect(firstBatch.nextSemester).toBeGreaterThanOrEqual(firstBatch.currentSemester);
  });

  it('TEST 4: Respects department scoping when filtering student metrics', () => {
    const allMetrics = studentGovernanceService.getStudentGovernanceMetrics();
    if (allMetrics.departmentBreakdown.length > 0) {
      const firstDept = allMetrics.departmentBreakdown[0];
      const deptMetrics = studentGovernanceService.getStudentGovernanceMetrics(undefined, firstDept.departmentId);

      expect(deptMetrics.totalStudents).toBe(firstDept.totalStudents);
    }
  });
});
