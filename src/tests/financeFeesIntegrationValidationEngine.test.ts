import { describe, it, expect } from 'vitest';
import { centralFinanceFeesIntegrationValidationService } from '../services/centralFinanceFeesIntegrationValidationService';

describe('SSIU ERP – Phase 40.6: Finance & Fees End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Fee Calculation & Invoicing: Computes net payable fee applying scholarship concessions', () => {
    const net = centralFinanceFeesIntegrationValidationService.calculateNetPayableFee(107000, 0, 20000, 0);

    expect(net).toBe(87000);
  });

  it('TEST 2: Payment Processing & Idempotency: Handles partial payments, full settlement, and blocks duplicate transactions', () => {
    const existingKeys = new Set<string>();

    // 1. Partial payment
    const pay1 = centralFinanceFeesIntegrationValidationService.processStudentPayment({
      invoiceAmount: 87000,
      paidSoFar: 0,
      paymentAmount: 40000,
      idempotencyKey: 'IDEMP-PAY-001',
      existingKeys
    });
    expect(pay1.newPaidTotal).toBe(40000);
    expect(pay1.outstanding).toBe(47000);
    expect(pay1.invoiceStatus).toBe('PARTIALLY_PAID');

    // 2. Full settlement
    const pay2 = centralFinanceFeesIntegrationValidationService.processStudentPayment({
      invoiceAmount: 87000,
      paidSoFar: pay1.newPaidTotal,
      paymentAmount: 47000,
      idempotencyKey: 'IDEMP-PAY-002',
      existingKeys
    });
    expect(pay2.newPaidTotal).toBe(87000);
    expect(pay2.outstanding).toBe(0);
    expect(pay2.invoiceStatus).toBe('PAID');

    // 3. Duplicate payment with same key is blocked
    expect(() => {
      centralFinanceFeesIntegrationValidationService.processStudentPayment({
        invoiceAmount: 87000,
        paidSoFar: pay2.newPaidTotal,
        paymentAmount: 47000,
        idempotencyKey: 'IDEMP-PAY-002',
        existingKeys
      });
    }).toThrow(/409 Conflict: Duplicate payment transaction rejected/);
  });

  it('TEST 3: Double-Entry General Ledger Balancing: Enforces balanced debit and credit entries across Payroll and Vendor flows', () => {
    const check = centralFinanceFeesIntegrationValidationService.validateDoubleEntryGL([
      { transaction_id: 'TX-001', account_code: 'EXP-5001', account_name: 'Salary Expense', debit: 130500, credit: 0 },
      { transaction_id: 'TX-001', account_code: 'BANK-1001', account_name: 'Bank', debit: 0, credit: 115000 },
      { transaction_id: 'TX-001', account_code: 'LIAB-2001', account_name: 'Statutory Payables', debit: 0, credit: 15500 }
    ]);

    expect(check.totalDebit).toBe(130500);
    expect(check.totalCredit).toBe(130500);
    expect(check.isBalanced).toBe(true);
  });

  it('TEST 4: Complete 26-Step Financial Scenario: Verifies Student Ledger, Payroll GL, Vendor AP, and Budget consumption', () => {
    const scenario = centralFinanceFeesIntegrationValidationService.runCompleteFinanceFeesScenario();

    expect(scenario.studentLedger.student_id).toBe('STU-2026-101');
    expect(scenario.studentLedger.outstanding_balance).toBe(0);
    expect(scenario.studentLedger.is_financially_cleared).toBe(true);
    expect(scenario.payrollGLBalanced).toBe(true);
    expect(scenario.vendorPaymentProcessed).toBe(true);
    expect(scenario.budgetRemaining).toBe(619500);
  });

  it('TEST 5: Phase 40.6 Final Gate Execution: Confirms green status across all 81 Finance & Fees criteria', () => {
    const gateReport = centralFinanceFeesIntegrationValidationService.runFullFinanceFeesGate();

    expect(gateReport.feeStructureAndAssignmentPassed).toBe(true);
    expect(gateReport.invoiceAndScholarshipPassed).toBe(true);
    expect(gateReport.paymentAndReceiptIdempotencyPassed).toBe(true);
    expect(gateReport.refundAndReversalWorkflowPassed).toBe(true);
    expect(gateReport.studentLedgerReconciliationPassed).toBe(true);
    expect(gateReport.payrollAndGLPostingPassed).toBe(true);
    expect(gateReport.procurementAndVendorPaymentPassed).toBe(true);
    expect(gateReport.budgetAndCostCenterPassed).toBe(true);
    expect(gateReport.doubleEntryAccountingBalanced).toBe(true);
    expect(gateReport.financialPeriodLockPassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
