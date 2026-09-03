import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { feesFinanceScholarshipGovernanceService } from './feesFinanceScholarshipGovernanceService';

export interface BudgetRecord {
  id: string;
  financialYearId: string;
  organizationUnitId: string;
  organizationUnitName: string;
  category: 'ACADEMIC' | 'ADMINISTRATION' | 'RESEARCH' | 'INFRASTRUCTURE';
  approvedAmount: number;
  committedAmount: number;
  spentAmount: number;
  availableAmount: number;
  status: 'ACTIVE' | 'CLOSED';
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  departmentId: string;
  totalAmount: number;
  issuedDate: string;
  status: 'DRAFT' | 'APPROVED' | 'GOODS_RECEIVED' | 'INVOICED' | 'PAID';
}

export interface VendorInvoiceRecord {
  id: string;
  vendorInvoiceNumber: string;
  poId: string;
  vendorName: string;
  invoiceAmount: number;
  dueDate: string;
  status: 'PENDING_MATCH' | 'MATCHED' | 'APPROVED_FOR_PAYMENT' | 'PAID';
}

class CentralFinanceGovernanceService {
  private static instance: CentralFinanceGovernanceService;

  private budgets: BudgetRecord[] = [
    {
      id: 'bg-sit-cse-2026',
      financialYearId: 'fy-2026-27',
      organizationUnitId: 'dept-1',
      organizationUnitName: 'Department of Computer Science & Engineering',
      category: 'ACADEMIC',
      approvedAmount: 5000000,
      committedAmount: 1200000,
      spentAmount: 1800000,
      availableAmount: 2000000, // 50L - 12L - 18L = 20L
      status: 'ACTIVE'
    },
    {
      id: 'bg-reg-office-2026',
      financialYearId: 'fy-2026-27',
      organizationUnitId: 'org-reg-office',
      organizationUnitName: 'Office of the Registrar',
      category: 'ADMINISTRATION',
      approvedAmount: 3000000,
      committedAmount: 500000,
      spentAmount: 900000,
      availableAmount: 1600000,
      status: 'ACTIVE'
    }
  ];

  private purchaseOrders: PurchaseOrderRecord[] = [
    {
      id: 'po-2026-001',
      poNumber: 'PO-SSIU-2026-081',
      vendorId: 'ven-dell-01',
      vendorName: 'Dell Technologies India Pvt Ltd',
      departmentId: 'dept-1',
      totalAmount: 1200000,
      issuedDate: '2026-08-01',
      status: 'APPROVED'
    }
  ];

  private vendorInvoices: VendorInvoiceRecord[] = [
    {
      id: 'vinv-01',
      vendorInvoiceNumber: 'INV-DELL-88219',
      poId: 'po-2026-001',
      vendorName: 'Dell Technologies India Pvt Ltd',
      invoiceAmount: 1200000,
      dueDate: '2026-09-01',
      status: 'PENDING_MATCH'
    }
  ];

  private constructor() {}

  public static getInstance(): CentralFinanceGovernanceService {
    if (!CentralFinanceGovernanceService.instance) {
      CentralFinanceGovernanceService.instance = new CentralFinanceGovernanceService();
    }
    return CentralFinanceGovernanceService.instance;
  }

  // ─── THREE-WAY MATCH & VENDOR INVOICE MATCHING ────────────────────────

  public executeThreeWayMatch(vendorInvoiceId: string): VendorInvoiceRecord {
    const invoice = this.vendorInvoices.find(v => v.id === vendorInvoiceId);
    if (!invoice) throw new Error(`Vendor invoice ${vendorInvoiceId} not found`);

    const po = this.purchaseOrders.find(p => p.id === invoice.poId);
    if (!po) throw new Error(`Purchase order ${invoice.poId} not found`);

    if (po.totalAmount !== invoice.invoiceAmount) {
      throw new Error(`Three-way mismatch: PO amount (₹${po.totalAmount}) does not match Invoice amount (₹${invoice.invoiceAmount})`);
    }

    invoice.status = 'MATCHED';
    po.status = 'INVOICED';
    return invoice;
  }

  // ─── BUDGET RECONCILIATION & DYNAMIC DERIVATION ────────────────────────

  public getBudgetSummary(orgUnitId?: string): BudgetRecord[] {
    if (orgUnitId) {
      return this.budgets.filter(b => b.organizationUnitId === orgUnitId);
    }
    return this.budgets;
  }

  public recordExpenseAgainstBudget(params: {
    budgetId: string;
    expenseAmount: number;
  }): BudgetRecord {
    const budget = this.budgets.find(b => b.id === params.budgetId);
    if (!budget) throw new Error(`Budget ${params.budgetId} not found`);

    if (params.expenseAmount > budget.availableAmount) {
      throw new Error(`Expense ₹${params.expenseAmount} exceeds available budget ₹${budget.availableAmount}`);
    }

    budget.spentAmount += params.expenseAmount;
    budget.availableAmount = budget.approvedAmount - budget.committedAmount - budget.spentAmount;
    return budget;
  }
}

export const centralFinanceGovernanceService = CentralFinanceGovernanceService.getInstance();
