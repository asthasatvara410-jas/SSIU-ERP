/**
 * SSIU ERP — HR Governance Service Unit Tests
 * File: src/modules/hr/tests/hrGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { hrGovernanceService } from '../services/hrGovernanceService';

describe('HRGovernanceService (Stage 3 Module)', () => {
  it('should aggregate total workforce, faculty counts, and leave metrics correctly', () => {
    const metrics = hrGovernanceService.getHRWorkforceMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.totalEmployees).toBeGreaterThan(0);
    expect(metrics.facultyCount).toBeGreaterThan(0);
    expect(metrics.activeEmployees).toBeLessThanOrEqual(metrics.totalEmployees);
    expect(Array.isArray(metrics.departmentWorkforce)).toBe(true);
    expect(metrics.departmentWorkforce.length).toBeGreaterThan(0);
  });

  it('should compute individual leave balances and status quotas', () => {
    const leaveBalances = hrGovernanceService.getEmployeeLeaveBalances();

    expect(Array.isArray(leaveBalances)).toBe(true);
    expect(leaveBalances.length).toBeGreaterThan(0);

    const first = leaveBalances[0];
    expect(first.employeeId).toBeDefined();
    expect(first.casualLeaveBalance).toBeGreaterThanOrEqual(0);
    expect(first.earnedLeaveBalance).toBeGreaterThanOrEqual(0);
    expect(['NORMAL', 'EXHAUSTED', 'ON_EXTENDED_LEAVE']).toContain(first.leaveStatus);
  });

  it('should evaluate payroll-readiness checklist across departments', () => {
    const checklist = hrGovernanceService.getPayrollReadinessChecklist();

    expect(Array.isArray(checklist)).toBe(true);
    expect(checklist.length).toBeGreaterThan(0);

    const first = checklist[0];
    expect(first.departmentId).toBeDefined();
    expect(first.payrollReadinessScore).toBeGreaterThanOrEqual(0);
    expect(first.payrollReadinessScore).toBeLessThanOrEqual(100);
    expect(['READY', 'ACTION_REQUIRED', 'BLOCKED']).toContain(first.readinessStatus);
  });

  it('should respect department filtering when querying leave balances', () => {
    const metrics = hrGovernanceService.getHRWorkforceMetrics();
    const targetDept = metrics.departmentWorkforce[0];

    const filtered = hrGovernanceService.getEmployeeLeaveBalances(targetDept.departmentId);
    expect(Array.isArray(filtered)).toBe(true);
    filtered.forEach(item => {
      expect(item.departmentName).toBeDefined();
    });
  });
});
