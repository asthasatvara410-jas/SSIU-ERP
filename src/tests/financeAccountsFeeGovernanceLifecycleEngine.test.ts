import { describe, it, expect } from 'vitest';
import { financeAccountsFeeGovernanceLifecycleService } from '../services/financeAccountsFeeGovernanceLifecycleService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 41: Finance, Fees & Accounts Management Engine', () => {

  it('TEST 1: Double-Entry Journal Posting: Validates balanced Debit and Credit accounts with audit trail', () => {
    const journal = financeAccountsFeeGovernanceLifecycleService.postJournalEntry({
      entryType: 'SCHOLARSHIP_ADJUSTMENT',
      debitAccount: 'SCHOLARSHIP_EXPENSE_FUND',
      creditAccount: 'ACCOUNTS_RECEIVABLE_STUDENTS',
      amount: 10000,
      referenceId: 'SCH-2026-001'
    });

    expect(journal.status).toBe('POSTED');
    expect(journal.debitAccount).toBe('SCHOLARSHIP_EXPENSE_FUND');
    expect(journal.creditAccount).toBe('ACCOUNTS_RECEIVABLE_STUDENTS');
    expect(journal.amount).toBe(10000);
    expect(journal.journalNumber).toMatch(/^JN-2026-\d{6}$/);
  });

  it('TEST 2: Authoritative Student Financial Balance Derivation: Accurately computes net dues across demands and deductions', () => {
    // 60,000 gross demand - 10,000 scholarship = 50,000 net outstanding
    const summary = financeAccountsFeeGovernanceLifecycleService.getStudentAccountSummary('stud-001');
    expect(summary.totalGrossDemand).toBe(60000);
    expect(summary.totalScholarship).toBe(10000);
    expect(summary.totalPaid).toBe(0);
    expect(summary.netOutstandingBalance).toBe(50000);
  });

  it('TEST 3: Payment Posting with Double-Entry Journal: Records transaction, generates verified receipt, and updates balance', () => {
    const res = financeAccountsFeeGovernanceLifecycleService.recordPaymentWithDoubleEntry({
      studentId: 'stud-001',
      enrollmentNumber: 'SSIU26BCA000059',
      amount: 30000,
      paymentMode: 'UPI',
      gatewayTransactionId: 'TXN-RAZORPAY-888999'
    });

    expect(res.receipt.status).toBe('SUCCESS');
    expect(res.receipt.amountPaid).toBe(30000);
    expect(res.receipt.receiptNumber).toMatch(/^REC-2026-\d{6}$/);
    expect(res.receipt.verificationCode).toMatch(/^VER-REC-\d{6}$/);

    expect(res.journal.debitAccount).toBe('BANK_OPERATIONAL_ACCOUNT');
    expect(res.journal.creditAccount).toBe('ACCOUNTS_RECEIVABLE_STUDENTS');
    expect(res.journal.amount).toBe(30000);

    // Balance after 30,000 payment should be 20,000
    const summaryAfter = financeAccountsFeeGovernanceLifecycleService.getStudentAccountSummary('stud-001');
    expect(summaryAfter.totalPaid).toBe(30000);
    expect(summaryAfter.netOutstandingBalance).toBe(20000);
  });

  it('TEST 4: Idempotency & Overpayment Protection: Blocks duplicate gateway transactions and overpayments', () => {
    // Duplicate transaction ID
    expect(() => {
      financeAccountsFeeGovernanceLifecycleService.recordPaymentWithDoubleEntry({
        studentId: 'stud-001',
        enrollmentNumber: 'SSIU26BCA000059',
        amount: 5000,
        paymentMode: 'UPI',
        gatewayTransactionId: 'TXN-RAZORPAY-888999' // Duplicate
      });
    }).toThrow(/Idempotency Violation/);

    // Overpayment beyond remaining 20,000 balance
    expect(() => {
      financeAccountsFeeGovernanceLifecycleService.recordPaymentWithDoubleEntry({
        studentId: 'stud-001',
        enrollmentNumber: 'SSIU26BCA000059',
        amount: 25000, // Exceeds 20000
        paymentMode: 'ONLINE',
        gatewayTransactionId: 'TXN-ONLINE-999000'
      });
    }).toThrow(/exceeds net outstanding balance/);
  });
});
