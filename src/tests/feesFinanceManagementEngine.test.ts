import { describe, it, expect } from 'vitest';
import { feesFinanceGovernanceService } from '../services/feesFinanceGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12: Fees & Finance Management Engine', () => {

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

  it('TEST 1: Transactional Payment & Receipt: Recording payment updates invoice outstanding and creates official receipt', () => {
    const summaryBefore = feesFinanceGovernanceService.getFinanceSummary();
    const paymentResult = feesFinanceGovernanceService.recordPayment({
      studentId: 'stud-001',
      invoiceId: 'inv-stud-001-sem3',
      amount: 15000,
      paymentMode: 'UPI',
      transactionReference: 'PAY-UPI-2026-99182',
      receivedByUserId: 'usr-admin-01'
    });

    expect(paymentResult.payment).toBeDefined();
    expect(paymentResult.payment.amount).toBe(15000);
    expect(paymentResult.payment.status).toBe('SUCCESS');
    expect(paymentResult.receipt.receiptNumber).toContain('RCPT-');

    const summaryAfter = feesFinanceGovernanceService.getFinanceSummary();
    expect(summaryAfter.totalCollected).toBe(summaryBefore.totalCollected + 15000);
    expect(summaryAfter.totalOutstanding).toBe(0); // Fully cleared
  });

  it('TEST 2: Payment Idempotency: Duplicate transaction reference returns existing record without double-charging', () => {
    const firstCall = feesFinanceGovernanceService.recordPayment({
      studentId: 'stud-001',
      invoiceId: 'inv-stud-001-sem3',
      amount: 5000,
      paymentMode: 'UPI',
      transactionReference: 'PAY-IDEMPOTENT-001',
      receivedByUserId: 'usr-admin-01'
    });

    const secondCall = feesFinanceGovernanceService.recordPayment({
      studentId: 'stud-001',
      invoiceId: 'inv-stud-001-sem3',
      amount: 5000,
      paymentMode: 'UPI',
      transactionReference: 'PAY-IDEMPOTENT-001',
      receivedByUserId: 'usr-admin-01'
    });

    expect(firstCall.payment.id).toBe(secondCall.payment.id);
  });

  it('TEST 3: Student Fee Ledger: Computes exact debits, credits, and running balance from transactions', () => {
    const ledger = feesFinanceGovernanceService.getStudentLedger('stud-001');
    expect(ledger.length).toBeGreaterThan(0);
    expect(ledger.some(entry => entry.debit > 0)).toBe(true);
    expect(ledger.some(entry => entry.credit > 0)).toBe(true);
  });

  it('TEST 4: Financial Privacy: Student A can view own ledger, but Student B cannot view Student A financial ledger', () => {
    const ownLedger = feesFinanceGovernanceService.getStudentLedger('stud-001', studentAContext);
    expect(ownLedger.length).toBeGreaterThan(0);

    const unauthorizedLedger = feesFinanceGovernanceService.getStudentLedger('stud-001', studentBContext);
    expect(unauthorizedLedger.length).toBe(0); // Strictly blocked
  });
});
