import { describe, it, expect } from 'vitest';
import { centralProcurementInventoryIntegrationValidationService } from '../services/centralProcurementInventoryIntegrationValidationService';

describe('SSIU ERP – Phase 40.8: Procurement / Vendor / Inventory / Maintenance End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Three-Way Match Engine: Validates matching PO, GRN, and Invoice and flags discrepancies', () => {
    // 1. Matched PO, GRN, Invoice
    const matched = centralProcurementInventoryIntegrationValidationService.verifyThreeWayMatch(
      { qty: 20, unitPrice: 57500, total: 1150000 },
      { receivedQty: 20, acceptedQty: 20 },
      { billedQty: 20, billedTotal: 1150000 }
    );
    expect(matched.isMatched).toBe(true);
    expect(matched.variance).toBe(0);

    // 2. Discrepancy detected on invoice mismatch
    const mismatched = centralProcurementInventoryIntegrationValidationService.verifyThreeWayMatch(
      { qty: 20, unitPrice: 57500, total: 1150000 },
      { receivedQty: 20, acceptedQty: 20 },
      { billedQty: 20, billedTotal: 1300000 }
    );
    expect(mismatched.isMatched).toBe(false);
    expect(mismatched.discrepancy).toContain('PO total price does not match Invoice total amount');
  });

  it('TEST 2: Stock Reconciliation: Accurately balances opening stock, purchases, issues, and adjustments', () => {
    const stock = centralProcurementInventoryIntegrationValidationService.calculateStockReconciliation(0, 20, 1, 0);

    expect(stock).toBe(19);
  });

  it('TEST 3: Complete 27-Step Procurement & Asset Lifecycle: Verifies unbroken flow from PR to Asset Registration & Maintenance', () => {
    const summary = centralProcurementInventoryIntegrationValidationService.runCompleteProcurementScenario();

    expect(summary.pr_number).toBe('PR-2026-001');
    expect(summary.po_number).toBe('PO-2026-001');
    expect(summary.grn_number).toBe('GRN-2026-001');
    expect(summary.is_three_way_matched).toBe(true);
    expect(summary.total_asset_units_created).toBe(20);
    expect(summary.stock_on_hand).toBe(19);
    expect(summary.maintenance_tickets_resolved).toBe(1);
    expect(summary.vendor_payable_outstanding).toBe(0);
    expect(summary.budget_remaining).toBe(850000);
  });

  it('TEST 4: Phase 40.8 Final Gate Execution: Confirms green status across all 90 Procurement / Vendor / Inventory criteria', () => {
    const gateReport = centralProcurementInventoryIntegrationValidationService.runFullProcurementInventoryGate();

    expect(gateReport.purchaseRequestAndBudgetPassed).toBe(true);
    expect(gateReport.vendorRFQAndQuotationPassed).toBe(true);
    expect(gateReport.purchaseOrderAndGRNPassed).toBe(true);
    expect(gateReport.inventoryStockAndMovementPassed).toBe(true);
    expect(gateReport.threeWayMatchAndVendorPaymentPassed).toBe(true);
    expect(gateReport.assetCreationAndTaggingPassed).toBe(true);
    expect(gateReport.maintenanceAndPartsIntegrationPassed).toBe(true);
    expect(gateReport.stockAndFinanceReconciled).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
