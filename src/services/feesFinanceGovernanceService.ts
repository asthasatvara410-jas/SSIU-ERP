import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type FeeComponentType = 'TUITION' | 'ADMISSION' | 'EXAMINATION' | 'HOSTEL' | 'TRANSPORT' | 'LIBRARY' | 'LAB' | 'OTHER';
export type FeeAssessmentStatus = 'GENERATED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMode = 'ONLINE' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';

export interface FeeStructureRecord {
  id: string;
  name: string;
  academicYearId: string;
  instituteId: string;
  programId: string;
  semesterId: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface FeeComponentRecord {
  id: string;
  feeStructureId: string;
  name: string;
  type: FeeComponentType;
  amount: number;
  mandatory: boolean;
}

export interface FeeAssessmentRecord {
  id: string;
  studentId: string;
  feeStructureId: string;
  feeComponentId: string;
  componentType: FeeComponentType;
  amount: number;
  discountAmount: number;
  scholarshipAmount: number;
  netAmount: number;
  dueDate: string;
  status: FeeAssessmentStatus;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  studentId: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  academicYearId: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  lines: Array<{
    feeComponentId: string;
    description: string;
    amount: number;
  }>;
}

export interface PaymentTransactionRecord {
  id: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference: string;
  gatewayReference?: string;
  status: PaymentStatus;
  receivedByUserId: string;
}

export interface FeeReceiptRecord {
  id: string;
  receiptNumber: string;
  paymentTransactionId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  issueDate: string;
  generatedByUserId: string;
}

export interface RefundTransactionRecord {
  id: string;
  paymentTransactionId: string;
  studentId: string;
  amount: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
}

export interface StudentFeeLedgerEntry {
  date: string;
  referenceNo: string;
  description: string;
  feeType: FeeComponentType;
  debit: number;   // Invoiced / Assessed
  credit: number;  // Paid / Concession / Waived
  balance: number; // Running balance
}

class FeesFinanceGovernanceService {
  private static instance: FeesFinanceGovernanceService;

  private feeStructures: FeeStructureRecord[] = [
    { id: 'fs-btech-cse-2026', name: 'B.Tech CSE Semester 3 Fee Structure 2026-27', academicYearId: 'ay-2026-27', instituteId: 'inst-1', programId: 'prog-1', semesterId: 'sem-3', status: 'ACTIVE' }
  ];

  private feeComponents: FeeComponentRecord[] = [
    { id: 'fc-tuition', feeStructureId: 'fs-btech-cse-2026', name: 'Tuition Fee Sem 3', type: 'TUITION', amount: 50000, mandatory: true },
    { id: 'fc-lab', feeStructureId: 'fs-btech-cse-2026', name: 'Computing Lab & IT Fee', type: 'LAB', amount: 10000, mandatory: true },
    { id: 'fc-exam', feeStructureId: 'fs-btech-cse-2026', name: 'Winter 2026 Examination Fee', type: 'EXAMINATION', amount: 1500, mandatory: false }
  ];

  private assessments: FeeAssessmentRecord[] = [
    { id: 'asm-01', studentId: 'stud-001', feeStructureId: 'fs-btech-cse-2026', feeComponentId: 'fc-tuition', componentType: 'TUITION', amount: 50000, discountAmount: 0, scholarshipAmount: 10000, netAmount: 40000, dueDate: '2026-08-30', status: 'PARTIAL' },
    { id: 'asm-02', studentId: 'stud-001', feeStructureId: 'fs-btech-cse-2026', feeComponentId: 'fc-lab', componentType: 'LAB', amount: 10000, discountAmount: 0, scholarshipAmount: 0, netAmount: 10000, dueDate: '2026-08-30', status: 'PAID' }
  ];

  private invoices: InvoiceRecord[] = [
    {
      id: 'inv-stud-001-sem3',
      invoiceNumber: 'INV-SSIU-2026-00891',
      studentId: 'stud-001',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      programId: 'prog-1',
      academicYearId: 'ay-2026-27',
      invoiceDate: '2026-07-15',
      dueDate: '2026-08-30',
      totalAmount: 50000, // 40,000 Tuition net + 10,000 Lab net
      paidAmount: 35000,
      outstandingAmount: 15000,
      status: 'PARTIAL',
      lines: [
        { feeComponentId: 'fc-tuition', description: 'Tuition Fee (Net of Merit Scholarship)', amount: 40000 },
        { feeComponentId: 'fc-lab', description: 'Computing Lab & IT Fee', amount: 10000 }
      ]
    }
  ];

  private payments: PaymentTransactionRecord[] = [
    {
      id: 'pay-001',
      studentId: 'stud-001',
      invoiceId: 'inv-stud-001-sem3',
      amount: 35000,
      paymentDate: '2026-08-10T14:30:00Z',
      paymentMode: 'ONLINE',
      transactionReference: 'PAY-TXN-7788912',
      status: 'SUCCESS',
      receivedByUserId: 'usr-gateway'
    }
  ];

  private receipts: FeeReceiptRecord[] = [
    {
      id: 'rcpt-001',
      receiptNumber: 'RCPT-2026-00441',
      paymentTransactionId: 'pay-001',
      invoiceId: 'inv-stud-001-sem3',
      studentId: 'stud-001',
      amount: 35000,
      issueDate: '2026-08-10T14:30:05Z',
      generatedByUserId: 'usr-admin-01'
    }
  ];

  private refunds: RefundTransactionRecord[] = [];

  private constructor() {}

  public static getInstance(): FeesFinanceGovernanceService {
    if (!FeesFinanceGovernanceService.instance) {
      FeesFinanceGovernanceService.instance = new FeesFinanceGovernanceService();
    }
    return FeesFinanceGovernanceService.instance;
  }

  // ─── TRANSACTION MANAGEMENT ──────────────────────────────────────────

  public recordPayment(payment: {
    studentId: string;
    invoiceId: string;
    amount: number;
    paymentMode: PaymentMode;
    transactionReference: string;
    receivedByUserId: string;
  }): { payment: PaymentTransactionRecord; receipt: FeeReceiptRecord } {
    // Check idempotency
    const existing = this.payments.find(p => p.transactionReference === payment.transactionReference);
    if (existing) {
      const existingReceipt = this.receipts.find(r => r.paymentTransactionId === existing.id);
      return { payment: existing, receipt: existingReceipt! };
    }

    const invoice = this.invoices.find(i => i.id === payment.invoiceId);
    if (!invoice) throw new Error(`Invoice ${payment.invoiceId} not found`);

    const newPayment: PaymentTransactionRecord = {
      id: `pay-${Date.now()}`,
      studentId: payment.studentId,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      paymentDate: new Date().toISOString(),
      paymentMode: payment.paymentMode,
      transactionReference: payment.transactionReference,
      status: 'SUCCESS',
      receivedByUserId: payment.receivedByUserId
    };

    this.payments.push(newPayment);

    // Update invoice status & amounts
    invoice.paidAmount += payment.amount;
    invoice.outstandingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    invoice.status = invoice.outstandingAmount === 0 ? 'PAID' : 'PARTIAL';

    const newReceipt: FeeReceiptRecord = {
      id: `rcpt-${Date.now()}`,
      receiptNumber: `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      paymentTransactionId: newPayment.id,
      invoiceId: invoice.id,
      studentId: payment.studentId,
      amount: payment.amount,
      issueDate: new Date().toISOString(),
      generatedByUserId: payment.receivedByUserId
    };

    this.receipts.push(newReceipt);

    return { payment: newPayment, receipt: newReceipt };
  }

  // ─── STUDENT LEDGER QUERY ─────────────────────────────────────────────

  public getStudentLedger(studentId: string, context?: UserAuthorizationContext): StudentFeeLedgerEntry[] {
    // RBAC: If Student, block viewing other students
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return [];
    }

    const ledger: StudentFeeLedgerEntry[] = [];
    let runningBalance = 0;

    // 1. Invoices (Debit)
    const studentInvoices = this.invoices.filter(i => i.studentId === studentId);
    studentInvoices.forEach(inv => {
      inv.lines.forEach(line => {
        runningBalance += line.amount;
        ledger.push({
          date: inv.invoiceDate,
          referenceNo: inv.invoiceNumber,
          description: line.description,
          feeType: 'TUITION',
          debit: line.amount,
          credit: 0,
          balance: runningBalance
        });
      });
    });

    // 2. Payments (Credit)
    const studentPayments = this.payments.filter(p => p.studentId === studentId && p.status === 'SUCCESS');
    studentPayments.forEach(pay => {
      runningBalance -= pay.amount;
      ledger.push({
        date: pay.paymentDate.split('T')[0],
        referenceNo: pay.transactionReference,
        description: `Payment received via ${pay.paymentMode}`,
        feeType: 'TUITION',
        debit: 0,
        credit: pay.amount,
        balance: runningBalance
      });
    });

    return ledger;
  }

  // ─── KPI AGGREGATIONS ─────────────────────────────────────────────────

  public getFinanceSummary(scope?: { instituteId?: string; departmentId?: string }): {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    successfulTransactionsCount: number;
  } {
    let scopedInvoices = this.invoices;
    if (scope?.instituteId) scopedInvoices = scopedInvoices.filter(i => i.instituteId === scope.instituteId);
    if (scope?.departmentId) scopedInvoices = scopedInvoices.filter(i => i.departmentId === scope.departmentId);

    const totalInvoiced = scopedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalCollected = scopedInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalOutstanding = scopedInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      successfulTransactionsCount: this.payments.filter(p => p.status === 'SUCCESS').length
    };
  }
}

export const feesFinanceGovernanceService = FeesFinanceGovernanceService.getInstance();
