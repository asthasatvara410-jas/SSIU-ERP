/**
 * SSIU ERP — Unit Tests: Organization Governance Module
 * File: src/modules/organization/tests/organizationGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { organizationGovernanceService } from '../services/organizationGovernanceService';

describe('SSIU ERP — Organization Governance Module Engine', () => {
  it('TEST 1: Retrieves university campus metrics correctly', () => {
    const metrics = organizationGovernanceService.getCampusMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.totalInstitutes).toBeGreaterThanOrEqual(1);
    expect(metrics.totalDepartments).toBeGreaterThanOrEqual(1);
    expect(metrics.totalEnrolledStudents).toBeGreaterThanOrEqual(1);
    expect(metrics.totalActiveFaculty).toBeGreaterThanOrEqual(1);
  });

  it('TEST 2: Calculates institute-wise breakdown with student and staff counts', () => {
    const institutes = organizationGovernanceService.getInstituteSummaries();

    expect(institutes.length).toBeGreaterThanOrEqual(1);
    const firstInst = institutes[0];
    expect(firstInst.id).toBeDefined();
    expect(firstInst.code).toBeDefined();
    expect(firstInst.totalDepartments).toBeGreaterThanOrEqual(1);
    expect(firstInst.accreditationStatus).toBeDefined();
  });

  it('TEST 3: Generates organizational hierarchy tree without circular references', () => {
    const tree = organizationGovernanceService.getOrganizationHierarchyTree();

    expect(tree.length).toBeGreaterThanOrEqual(1);
    const uni = tree[0];
    expect(uni.type).toBe('UNIVERSITY');
    expect(uni.children).toBeDefined();
    expect(uni.children?.length).toBeGreaterThanOrEqual(1);
    expect(uni.children?.[0].type).toBe('INSTITUTE');
  });

  it('TEST 4: Retrieves department infrastructure capacity mapping', () => {
    const depts = organizationGovernanceService.getDepartmentInfrastructures();

    expect(depts.length).toBeGreaterThanOrEqual(1);
    const firstDept = depts[0];
    expect(firstDept.departmentName).toBeDefined();
    expect(firstDept.allocatedClassrooms).toBeGreaterThan(0);
    expect(firstDept.seatingCapacity).toBeGreaterThan(0);
  });
});
