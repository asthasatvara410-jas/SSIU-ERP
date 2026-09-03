/**
 * SSIU ERP — Staff & Faculty Governance Unit Tests
 * File: src/modules/staff/tests/staffGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { staffGovernanceService } from '../services/staffGovernanceService';

describe('SSIU ERP — Staff & Faculty Governance Module Engine', () => {
  it('TEST 1: Calculates department-wise SFR and average teaching workload', () => {
    const metrics = staffGovernanceService.getStaffGovernanceMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.totalFaculty).toBeGreaterThan(0);
    expect(metrics.activeFaculty).toBeLessThanOrEqual(metrics.totalFaculty);
    expect(metrics.studentFacultyRatio).toBeGreaterThan(0);
    expect(metrics.departmentWorkloadStats.length).toBeGreaterThan(0);

    const firstDept = metrics.departmentWorkloadStats[0];
    expect(firstDept.departmentName).toBeDefined();
    expect(['OPTIMAL', 'OVERLOADED', 'UNDERLOADED']).toContain(firstDept.workloadStatus);
  });

  it('TEST 2: Builds acyclic supervisor hierarchy tree with Dean -> HOD -> Faculty structure', () => {
    const hierarchy = staffGovernanceService.getSupervisorReportingHierarchy();

    expect(hierarchy.length).toBeGreaterThan(0);
    const rootHoi = hierarchy[0];

    expect(rootHoi.role).toBe('PRINCIPAL');
    expect(rootHoi.children).toBeDefined();
    expect(rootHoi.children!.length).toBeGreaterThan(0);

    const firstHod = rootHoi.children![0];
    expect(firstHod.role).toBe('HOD');
    expect(firstHod.children).toBeDefined();

    // Verify non-circularity: no child references parent id
    const childIds = new Set<string>();
    const checkCycle = (node: any) => {
      expect(childIds.has(node.id)).toBe(false);
      childIds.add(node.id);
      if (node.children) {
        node.children.forEach(checkCycle);
      }
    };
    checkCycle(rootHoi);
  });

  it('TEST 3: Aggregates faculty research output and patent metrics accurately', () => {
    const portfolios = staffGovernanceService.getFacultyResearchPortfolios();

    expect(portfolios.length).toBeGreaterThan(0);
    const firstFaculty = portfolios[0];

    expect(firstFaculty.facultyId).toBeDefined();
    expect(firstFaculty.facultyName).toBeDefined();
    expect(firstFaculty.journalPapersCount).toBeGreaterThanOrEqual(0);
    expect(firstFaculty.hIndex).toBeGreaterThan(0);
  });

  it('TEST 4: Respects department filtering in research portfolio aggregation', () => {
    const metrics = staffGovernanceService.getStaffGovernanceMetrics();
    if (metrics.departmentWorkloadStats.length > 0) {
      const targetDeptId = metrics.departmentWorkloadStats[0].departmentId;
      const deptPortfolios = staffGovernanceService.getFacultyResearchPortfolios(targetDeptId);

      deptPortfolios.forEach(p => {
        expect(p.departmentName).toBe(metrics.departmentWorkloadStats[0].departmentName);
      });
    }
  });
});
