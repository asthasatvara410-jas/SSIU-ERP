import { describe, it, expect } from 'vitest';
import { accountsReceivableFinanceGovernanceService } from '../services/accountsReceivableFinanceGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 18: Finance + Fees + Scholarship + Accounts Receivable Engine', () => {

  const studentAContext: UserAuthorizationContext = {
    userId: 'stud-001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'stud-002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Accounts Receivable Aging: Computes aging buckets and total receivables', () => {
    const aging = accountsReceivableFinanceGovernanceService.getAccountsReceivableAging();
    expect(aging.totalReceivable).toBe(25000);
    expect(aging.aging_31_60_days).toBe(25000);
  });

  it('TEST 2: Financial Hold Release & Fee Clearance: Releasing hold automatically updates fee clearance status', () => {
    const summaryBefore = accountsReceivableFinanceGovernanceService.getStudentFinanceSummary('stud-002');
    expect(summaryBefore?.holds.length).toBe(1);
    expect(summaryBefore?.clearance?.status).toBe('HELD');

    const releasedHold = accountsReceivableFinanceGovernanceService.releaseFinancialHold('hold-01', 'usr-finance-admin');
    expect(releasedHold.status).toBe('RELEASED');
    expect(releasedHold.releasedAt).toBeDefined();

    const summaryAfter = accountsReceivableFinanceGovernanceService.getStudentFinanceSummary('stud-002');
    expect(summaryAfter?.holds.length).toBe(0);
    expect(summaryAfter?.clearance?.status).toBe('CLEARED');
  });

  it('TEST 3: Financial Privacy: Student A can view own finance summary, but Student B cannot view Student A finance details', () => {
    const ownSummary = accountsReceivableFinanceGovernanceService.getStudentFinanceSummary('stud-001', studentAContext);
    expect(ownSummary).toBeDefined();
    expect(ownSummary?.scholarships.length).toBeGreaterThan(0);

    const unauthorizedSummary = accountsReceivableFinanceGovernanceService.getStudentFinanceSummary('stud-001', studentBContext);
    expect(unauthorizedSummary).toBeUndefined(); // Strictly blocked
  });
});
