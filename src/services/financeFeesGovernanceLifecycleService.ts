import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface FeeHeadRecord {
  id: string;
  code: 'TUITION_FEE' | 'ADMISSION_FEE' | 'EXAMINATION_FEE' | 'HOSTEL_FEE' | 'TRANSPORT_FEE' | 'LIBRARY_FEE' | 'LATE_FEE' | 'OTHER';
  name: string;
  category: 'ACADEMIC' | 'HOSTEL' | 'TRANSPORT' | 'EXAMINATION' | 'ADMINISTRATIVE';
}

export interface StudentInvoiceRecord {
  id: string;
  invoiceNumber: string;
  studentId: string;
  enrollmentNumber: string;
  academicYear: string;
  semesterNumber: number;
  feeHead: FeeHeadRecord['code'];
  grossAmount: number;
  appliedDiscount: number;
  netPayableAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueDate: string;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface FeeReceiptRecord {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  studentId: string;
  enrollmentNumber: string;
  amountPaid: number;
  paymentMethod: 'ONLINE' | 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'CHEQUE';
  transactionReference: string;
  timestamp: string;
  verificationCode: string;
  status: 'SUCCESS' | 'CANCELLED';
}

export interface StudentLedgerEntryRecord {
  id: string;
  studentId: string;
  transactionType: 'DEMAND' | 'PAYMENT' | 'SCHOLARSHIP' | 'CONCESSION' | 'WAIVER' | 'REFUND';
  amount: number;
  balanceAfter: number;
  referenceId: string;
  timestamp: string;
}

class FinanceFeesGovernanceLifecycleService {
  private static instance: FinanceFeesGovernanceLifecycleService;

  private invoices: StudentInvoiceRecord[] = [
    {
      id: 'inv-2026-001',
      invoiceNumber: 'INV-2026-000101',
      studentId: 'stud-001',
      enrollmentNumber: 'SSIU26BCA000059',
      academicYear: '2026-2027',
      semesterNumber: 1,
      feeHead: 'TUITION_FEE',
      grossAmount: 50000,
      appliedDiscount: 0,
      netPayableAmount: 50000,
      amountPaid: 0,
      outstandingBalance: 50000,
      dueDate: '2026-09-15',
      status: 'ISSUED'
    }
  ];

  private receipts: FeeReceiptRecord[] = [];
  private ledger: StudentLedgerEntryRecord[] = [
    {
      id: 'ledg-001',
      studentId: 'stud-001',
      transactionType: 'DEMAND',
      amount: 50000,
      balanceAfter: 50000,
      referenceId: 'inv-2026-001',
      timestamp: new Date().toISOString()
    }
  ];

  private processedTransactions: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): FinanceFeesGovernanceLifecycleService {
    if (!FinanceFeesGovernanceLifecycleService.instance) {
      FinanceFeesGovernanceLifecycleService.instance = new FinanceFeesGovernanceLifecycleService();
    }
    return FinanceFeesGovernanceLifecycleService.instance;
  }

  // ─── OUTSTANDING BALANCE CALCULATION ──────────────────────────────────

  public getStudentOutstanding(studentId: string): {
    totalGrossInvoiced: number;
    totalPaid: number;
    totalAdjustments: number;
    totalOutstanding: number;
    hasOverdue: boolean;
  } {
    const studentInvoices = this.invoices.filter(i => i.studentId === studentId && i.status !== 'CANCELLED');
    const totalGrossInvoiced = studentInvoices.reduce((sum, inv) => sum + inv.grossAmount, 0);
    const totalPaid = studentInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalAdjustments = studentInvoices.reduce((sum, inv) => sum + inv.appliedDiscount, 0);
    const totalOutstanding = studentInvoices.reduce((sum, inv) => sum + inv.outstandingBalance, 0);
    const hasOverdue = studentInvoices.some(inv => inv.status === 'OVERDUE');

    return {
      totalGrossInvoiced,
      totalPaid,
      totalAdjustments,
      totalOutstanding,
      hasOverdue
    };
  }

  // ─── IDEMPOTENT PAYMENT PROCESSING & RECEIPT GENERATION ───────────────

  public processPaymentAndGenerateReceipt(params: {
    invoiceId: string;
    studentId: string;
    enrollmentNumber: string;
    amountToPay: number;
    paymentMethod: FeeReceiptRecord['paymentMethod'];
    transactionReference: string;
  }): FeeReceiptRecord {
    if (this.processedTransactions.has(params.transactionReference)) {
      throw new Error(`Duplicate transaction: Reference ${params.transactionReference} already processed`);
    }

    const invoice = this.invoices.find(i => i.id === params.invoiceId);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found`);

    if (params.amountToPay <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }
    if (params.amountToPay > invoice.outstandingBalance) {
      throw new Error(`Payment amount (₹${params.amountToPay}) exceeds outstanding balance (₹${invoice.outstandingBalance})`);
    }

    // Process payment
    invoice.amountPaid += params.amountToPay;
    invoice.outstandingBalance -= params.amountToPay;
    invoice.status = invoice.outstandingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const currentBalance = this.getStudentOutstanding(params.studentId).totalOutstanding;

    // Append to ledger
    this.ledger.push({
      id: `ledg-${Date.now()}`,
      studentId: params.studentId,
      transactionType: 'PAYMENT',
      amount: params.amountToPay,
      balanceAfter: currentBalance,
      referenceId: params.transactionReference,
      timestamp: new Date().toISOString()
    });

    const receipt: FeeReceiptRecord = {
      id: `rec-${Date.now()}`,
      receiptNumber: `REC-2026-${(this.receipts.length + 1).toString().padStart(6, '0')}`,
      invoiceId: params.invoiceId,
      studentId: params.studentId,
      enrollmentNumber: params.enrollmentNumber,
      amountPaid: params.amountToPay,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      timestamp: new Date().toISOString(),
      verificationCode: `VER-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'SUCCESS'
    };

    this.receipts.push(receipt);
    this.processedTransactions.add(params.transactionReference);

    return receipt;
  }

  // ─── FINANCIAL ADJUSTMENTS (SCHOLARSHIP / CONCESSION / WAIVER) ────────

  public applyAuthorizedAdjustment(params: {
    invoiceId: string;
    studentId: string;
    adjustmentType: 'SCHOLARSHIP' | 'CONCESSION' | 'WAIVER';
    adjustmentAmount: number;
    approvalReference: string;
  }): StudentInvoiceRecord {
    const invoice = this.invoices.find(i => i.id === params.invoiceId);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found`);

    if (params.adjustmentAmount > invoice.outstandingBalance) {
      throw new Error(`Adjustment amount (₹${params.adjustmentAmount}) exceeds invoice outstanding balance (₹${invoice.outstandingBalance})`);
    }

    invoice.appliedDiscount += params.adjustmentAmount;
    invoice.netPayableAmount -= params.adjustmentAmount;
    invoice.outstandingBalance -= params.adjustmentAmount;
    invoice.status = invoice.outstandingBalance === 0 ? 'PAID' : (invoice.amountPaid > 0 ? 'PARTIALLY_PAID' : 'ISSUED');

    const currentBalance = this.getStudentOutstanding(params.studentId).totalOutstanding;

    this.ledger.push({
      id: `ledg-${Date.now()}`,
      studentId: params.studentId,
      transactionType: params.adjustmentType,
      amount: params.adjustmentAmount,
      balanceAfter: currentBalance,
      referenceId: params.approvalReference,
      timestamp: new Date().toISOString()
    });

    return invoice;
  }
}

export const financeFeesGovernanceLifecycleService = FinanceFeesGovernanceLifecycleService.getInstance();
