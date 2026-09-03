/**
 * SSIU ERP — Finance Governance Service Unit Tests
 * File: src/modules/finance/tests/financeGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { financeGovernanceService } from '../services/financeGovernanceService';

describe('FinanceGovernanceService (Stage 3 Module)', () => {
  it('should compute institutional finance summary, budget caps, and variance status', () => {
    const summary = financeGovernanceService.getInstitutionalFinanceSummary();

    expect(summary).toBeDefined();
    expect(summary.totalBudgetAllocatedLakhs).toBeGreaterThan(0);
    expect(summary.totalActualExpenditureLakhs).toBeGreaterThan(0);
    expect(summary.budgetUtilizationPercentage).toBeGreaterThan(0);
    expect(summary.budgetUtilizationPercentage).toBeLessThanOrEqual(100);
    expect(['FAVORABLE', 'ON_TRACK', 'DEFICIT']).toContain(summary.varianceStatus);
    expect(Array.isArray(summary.instituteFinancials)).toBe(true);
    expect(summary.instituteFinancials.length).toBeGreaterThan(0);
  });

  it('should map department-level cost centers with budget caps and balances', () => {
    const costCenters = financeGovernanceService.getDepartmentCostCenters();

    expect(Array.isArray(costCenters)).toBe(true);
    expect(costCenters.length).toBeGreaterThan(0);

    const first = costCenters[0];
    expect(first.costCenterCode).toBeDefined();
    expect(first.budgetCapLakhs).toBeGreaterThan(0);
    expect(first.uncommittedBalanceLakhs).toBeGreaterThanOrEqual(0);
    expect(['HEALTHY', 'ALERT_75', 'EXHAUSTED']).toContain(first.costCenterStatus);
  });

  it('should return revenue reconciliation streams with valid fiscal progress', () => {
    const streams = financeGovernanceService.getRevenueStreams();

    expect(Array.isArray(streams)).toBe(true);
    expect(streams.length).toBeGreaterThan(0);

    const first = streams[0];
    expect(first.streamId).toBeDefined();
    expect(first.projectedRevenueLakhs).toBeGreaterThan(0);
    expect(first.collectionProgress).toBeGreaterThanOrEqual(0);
    expect(first.collectionProgress).toBeLessThanOrEqual(100);
  });

  it('should respect department filtering when querying cost centers', () => {
    const costCenters = financeGovernanceService.getDepartmentCostCenters();
    const target = costCenters[0];

    const filtered = financeGovernanceService.getDepartmentCostCenters(target.departmentId);
    expect(Array.isArray(filtered)).toBe(true);
    expect(filtered.length).toBe(1);
    expect(filtered[0].departmentId).toBe(target.departmentId);
  });
});
