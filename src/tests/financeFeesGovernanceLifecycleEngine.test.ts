import { describe, it, expect } from 'vitest';
import { financeFeesGovernanceLifecycleService } from '../services/financeFeesGovernanceLifecycleService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 37: Finance & Fees Management System Engine', () => {

  it('TEST 1: Dynamic Outstanding Balance Derivation: Computes gross demand, paid, adjustments, and dues accurately', () => {
    const balance = financeFeesGovernanceLifecycleService.getStudentOutstanding('stud-001');
    expect(balance.totalGrossInvoiced).toBe(50000);
    expect(balance.totalPaid).toBe(0);
    expect(balance.totalAdjustments).toBe(0);
    expect(balance.totalOutstanding).toBe(50000);
  });

  it('TEST 2: Authorized Financial Adjustment: Applies Merit Scholarship, decrements net payable, and logs to ledger', () => {
    const updatedInvoice = financeFeesGovernanceLifecycleService.applyAuthorizedAdjustment({
      invoiceId: 'inv-2026-001',
      studentId: 'stud-001',
      adjustmentType: 'SCHOLARSHIP',
      adjustmentAmount: 10000,
      approvalReference: 'SCH-APR-2026-001'
    });

    expect(updatedInvoice.grossAmount).toBe(50000);
    expect(updatedInvoice.appliedDiscount).toBe(10000);
    expect(updatedInvoice.netPayableAmount).toBe(40000);
    expect(updatedInvoice.outstandingBalance).toBe(40000);

    const balanceAfterScholarship = financeFeesGovernanceLifecycleService.getStudentOutstanding('stud-001');
    expect(balanceAfterScholarship.totalOutstanding).toBe(40000);
  });

  it('TEST 3: Payment Processing & Receipt Generation: Records partial payment, creates verified receipt, and updates ledger', () => {
    const receipt = financeFeesGovernanceLifecycleService.processPaymentAndGenerateReceipt({
      invoiceId: 'inv-2026-001',
      studentId: 'stud-001',
      enrollmentNumber: 'SSIU26BCA000059',
      amountToPay: 25000,
      paymentMethod: 'UPI',
      transactionReference: 'TXN-UPI-987654321'
    });

    expect(receipt.status).toBe('SUCCESS');
    expect(receipt.amountPaid).toBe(25000);
    expect(receipt.receiptNumber).toBe('REC-2026-000001');
    expect(receipt.verificationCode).toMatch(/^VER-\d{6}$/);

    const balanceAfterPayment = financeFeesGovernanceLifecycleService.getStudentOutstanding('stud-001');
    expect(balanceAfterPayment.totalPaid).toBe(25000);
    expect(balanceAfterPayment.totalOutstanding).toBe(15000); // 40000 - 25000 = 15000
  });

  it('TEST 4: Idempotency & Overpayment Protection: Rejects duplicate transaction ID and payments exceeding dues', () => {
    // Attempting duplicate transaction ID
    expect(() => {
      financeFeesGovernanceLifecycleService.processPaymentAndGenerateReceipt({
        invoiceId: 'inv-2026-001',
        studentId: 'stud-001',
        enrollmentNumber: 'SSIU26BCA000059',
        amountToPay: 5000,
        paymentMethod: 'UPI',
        transactionReference: 'TXN-UPI-987654321' // Same reference
      });
    }).toThrow(/Duplicate transaction/);

    // Attempting overpayment beyond remaining 15,000 balance
    expect(() => {
      financeFeesGovernanceLifecycleService.processPaymentAndGenerateReceipt({
        invoiceId: 'inv-2026-001',
        studentId: 'stud-001',
        enrollmentNumber: 'SSIU26BCA000059',
        amountToPay: 20000, // Exceeds 15000
        paymentMethod: 'NET_BANKING',
        transactionReference: 'TXN-NB-123456789'
      });
    }).toThrow(/exceeds outstanding balance/);
  });
});
