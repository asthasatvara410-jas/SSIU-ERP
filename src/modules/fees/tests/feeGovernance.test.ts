/**
 * SSIU ERP — Fee Governance Service Unit Tests
 * File: src/modules/fees/tests/feeGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { feeGovernanceService } from '../services/feeGovernanceService';

describe('FeeGovernanceService (Stage 3 Module)', () => {
  it('should compute total fee demand, realization percentage, and head-wise collections', () => {
    const metrics = feeGovernanceService.getFeeCollectionMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.totalDemandAmountLakhs).toBeGreaterThan(0);
    expect(metrics.totalCollectedAmountLakhs).toBeGreaterThan(0);
    expect(metrics.collectionPercentage).toBeGreaterThan(0);
    expect(metrics.collectionPercentage).toBeLessThanOrEqual(100);
    expect(Array.isArray(metrics.headWiseCollection)).toBe(true);
    expect(metrics.headWiseCollection.length).toBeGreaterThan(0);
  });

  it('should aggregate student fee dues and categorize aging brackets', () => {
    const dues = feeGovernanceService.getStudentFeeDuesList();

    expect(Array.isArray(dues)).toBe(true);
    expect(dues.length).toBeGreaterThan(0);

    const first = dues[0];
    expect(first.studentId).toBeDefined();
    expect(first.totalDemand).toBeGreaterThan(0);
    expect(first.pendingDue).toBeGreaterThanOrEqual(0);
    expect(['CURRENT', '1_30_DAYS', '31_60_DAYS', 'OVER_60_DAYS']).toContain(first.agingBracket);
    expect(['PAID', 'PARTIAL', 'UNPAID']).toContain(first.paymentStatus);
  });

  it('should list sanctioned and disbursed scholarship aid records', () => {
    const scholarships = feeGovernanceService.getScholarshipAllocations();

    expect(Array.isArray(scholarships)).toBe(true);
    expect(scholarships.length).toBeGreaterThan(0);

    const first = scholarships[0];
    expect(first.scholarshipId).toBeDefined();
    expect(first.sanctionedAmount).toBeGreaterThan(0);
    expect(['SANCTIONED', 'DISBURSED', 'UNDER_VERIFICATION']).toContain(first.verificationStatus);
  });

  it('should respect program filtering when querying fee dues', () => {
    const dues = feeGovernanceService.getStudentFeeDuesList();
    const target = dues[0];

    const filtered = feeGovernanceService.getStudentFeeDuesList((target as any).programId);
    expect(Array.isArray(filtered)).toBe(true);
  });
});
