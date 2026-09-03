import { describe, it, expect } from 'vitest';
import { centralDataReconciliationValidationService } from '../services/centralDataReconciliationValidationService';

describe('SSIU ERP – Phase 40.15: Full ERP Data Reconciliation & Integrity Validation Gate Engine', () => {

  it('TEST 1: Double-Entry Financial Ledger Reconciliation: Total Debit exactly equals Total Credit with zero variance', () => {
    const metrics = centralDataReconciliationValidationService.runFullDataReconciliation();

    expect(metrics.total_debit_inr).toBe(380500);
    expect(metrics.total_credit_inr).toBe(380500);
    expect(metrics.is_ledger_balanced).toBe(true);
  });

  it('TEST 2: Physical & System Inventory Stock Reconciliation: Matches Opening + Purchases - Issues = Closing equation', () => {
    const metrics = centralDataReconciliationValidationService.runFullDataReconciliation();

    expect(metrics.inventory_opening).toBe(0);
    expect(metrics.inventory_purchased).toBe(20);
    expect(metrics.inventory_issued).toBe(1);
    expect(metrics.inventory_closing_calculated).toBe(19);
    expect(metrics.inventory_closing_actual).toBe(19);
    expect(metrics.is_inventory_reconciled).toBe(true);
  });

  it('TEST 3: Student Financial & Attendance Formula Reconciliation: Enforces zero dues and accurate attendance percentage', () => {
    const metrics = centralDataReconciliationValidationService.runFullDataReconciliation();

    expect(metrics.student_fee_invoiced_inr).toBe(87000);
    expect(metrics.student_fee_paid_inr).toBe(87000);
    expect(metrics.student_closing_balance_inr).toBe(0);
    expect(metrics.is_fee_reconciled).toBe(true);

    expect(metrics.attendance_present).toBe(35);
    expect(metrics.attendance_absent).toBe(5);
    expect(metrics.attendance_total_sessions).toBe(40);
    expect(metrics.attendance_pct).toBe(87.5);
    expect(metrics.is_attendance_reconciled).toBe(true);
  });

  it('TEST 4: Zero Orphan & Multi-Tenant Purity Engine: Confirms zero orphan records across all critical relational entities', () => {
    const metrics = centralDataReconciliationValidationService.runFullDataReconciliation();

    expect(metrics.master_data_orphans).toBe(0);
    expect(metrics.student_orphans).toBe(0);
    expect(metrics.faculty_orphans).toBe(0);
    expect(metrics.document_orphans).toBe(0);
    expect(metrics.cross_tenant_violations).toBe(0);
    expect(metrics.audit_missing_count).toBe(0);
  });

  it('TEST 5: Phase 40.15 Final Data Integrity Gate Execution: Confirms green status across all 80 Data Reconciliation criteria', () => {
    const gateReport = centralDataReconciliationValidationService.runFullDataReconciliationGate();

    expect(gateReport.referentialIntegrityAndOrphansPassed).toBe(true);
    expect(gateReport.financialLedgerBalancePassed).toBe(true);
    expect(gateReport.inventoryStockReconciliationPassed).toBe(true);
    expect(gateReport.studentFeeAndLedgerReconciliationPassed).toBe(true);
    expect(gateReport.attendanceFormulaReconciliationPassed).toBe(true);
    expect(gateReport.tenantIsolationAndZeroLeakagePassed).toBe(true);
    expect(gateReport.auditIntegrityPassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
