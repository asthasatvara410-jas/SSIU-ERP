import { describe, it, expect } from 'vitest';
import { feesFinanceScholarshipGovernanceService } from '../services/feesFinanceScholarshipGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 23: Fees + Finance + Scholarship + Student Ledger Engine', () => {

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

  it('TEST 1: Idempotent Payment & Dynamic Ledger: Records payment, generates receipt, and updates running ledger', () => {
    const res = feesFinanceScholarshipGovernanceService.recordPayment({
      studentId: 'stud-002',
      invoiceId: 'inv-2026-002',
      amount: 15000,
      paymentMethod: 'UPI',
      transactionReference: 'UPI-SSIU-882103'
    });

    expect(res.payment.status).toBe('SUCCESS');
    expect(res.receipt.receiptNumber).toBeDefined();

    // Prevent duplicate payment
    expect(() => {
      feesFinanceScholarshipGovernanceService.recordPayment({
        studentId: 'stud-002',
        invoiceId: 'inv-2026-002',
        amount: 15000,
        paymentMethod: 'UPI',
        transactionReference: 'UPI-SSIU-882103' // duplicate
      });
    }).toThrow(/already been processed/);
  });

  it('TEST 2: Refund Ceiling Enforcement: Enforces refund ceiling against original successful payment', () => {
    // Attempt refund higher than payment amount (41500)
    expect(() => {
      feesFinanceScholarshipGovernanceService.processRefund({
        studentId: 'stud-001',
        paymentId: 'pay-01',
        refundAmount: 50000, // exceeds 41500
        reason: 'Excess fee reversal',
        approvedByUserId: 'usr-finance-admin'
      });
    }).toThrow(/exceeds original payment/);

    // Valid refund
    const refund = feesFinanceScholarshipGovernanceService.processRefund({
      studentId: 'stud-001',
      paymentId: 'pay-01',
      refundAmount: 5000,
      reason: 'Course adjustment refund',
      approvedByUserId: 'usr-finance-admin'
    });
    expect(refund.status).toBe('PROCESSED');
    expect(refund.requestedAmount).toBe(5000);
  });

  it('TEST 3: Financial Privacy & Access Scoping: Student A can view own finance history, but Student B is strictly blocked', () => {
    const ownHistory = feesFinanceScholarshipGovernanceService.getStudentFinanceHistory('stud-001', studentAContext);
    expect(ownHistory).toBeDefined();
    expect(ownHistory?.invoices.length).toBeGreaterThan(0);

    const unauthorizedHistory = feesFinanceScholarshipGovernanceService.getStudentFinanceHistory('stud-001', studentBContext);
    expect(unauthorizedHistory).toBeUndefined(); // Strictly blocked
  });
});
