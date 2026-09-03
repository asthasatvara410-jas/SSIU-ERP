import { describe, it, expect } from 'vitest';
import { centralFinanceGovernanceService } from '../services/centralFinanceGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 27: Finance & Fee Management System + Budget, Expense & Three-Way Match Engine', () => {

  it('TEST 1: Dynamic Budget Utilization & Expense Enforcement: Computes available budget and blocks overspending', () => {
    const budgets = centralFinanceGovernanceService.getBudgetSummary('dept-1');
    const cseBudget = budgets[0];
    const initialAvailable = cseBudget.availableAmount;

    const updatedBudget = centralFinanceGovernanceService.recordExpenseAgainstBudget({
      budgetId: 'bg-sit-cse-2026',
      expenseAmount: 200000
    });

    expect(updatedBudget.availableAmount).toBe(initialAvailable - 200000);
    expect(updatedBudget.spentAmount).toBe(2000000);

    // Overspend attempt
    expect(() => {
      centralFinanceGovernanceService.recordExpenseAgainstBudget({
        budgetId: 'bg-sit-cse-2026',
        expenseAmount: 5000000 // exceeds remaining 18L
      });
    }).toThrow(/exceeds available budget/);
  });

  it('TEST 2: Three-Way Match Engine: Validates PO, Goods Receipt, and Vendor Invoice amounts before matching', () => {
    const matchedInvoice = centralFinanceGovernanceService.executeThreeWayMatch('vinv-01');
    expect(matchedInvoice.status).toBe('MATCHED');
    expect(matchedInvoice.invoiceAmount).toBe(1200000);
  });

  it('TEST 3: Multi-Level Budget Governance: Provides organizational budget segregation for Dept CSE vs Registrar Office', () => {
    const allBudgets = centralFinanceGovernanceService.getBudgetSummary();
    expect(allBudgets.length).toBeGreaterThanOrEqual(2);

    const regOfficeBudget = allBudgets.find(b => b.organizationUnitId === 'org-reg-office');
    expect(regOfficeBudget).toBeDefined();
    expect(regOfficeBudget?.category).toBe('ADMINISTRATION');
  });
});
