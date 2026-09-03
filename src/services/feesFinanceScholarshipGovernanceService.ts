import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type LedgerEntryType = 'DEBIT' | 'CREDIT' | 'ADJUSTMENT' | 'PAYMENT' | 'REFUND' | 'SCHOLARSHIP' | 'CONCESSION';

export interface FeeStructureItem {
  componentId: string;
  componentName: string;
  amount: number;
  frequency: 'ONE_TIME' | 'SEMESTER' | 'ANNUAL';
}

export interface StudentFeeAssessmentRecord {
  id: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  originalTotal: number;
  concessionAmount: number;
  scholarshipAmount: number;
  netDue: number;
  status: 'ASSESSED' | 'PARTIALLY_PAID' | 'PAID';
}

export interface StudentInvoiceRecord {
  id: string;
  invoiceNumber: string;
  studentId: string;
  assessmentId: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
}

export interface StudentPaymentRecord {
  id: string;
  paymentNumber: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  status: PaymentStatus;
  paymentDate: string;
}

export interface StudentReceiptRecord {
  id: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  amount: number;
  issuedAt: string;
}

export interface StudentLedgerRecord {
  id: string;
  studentId: string;
  transactionDate: string;
  type: LedgerEntryType;
  referenceId: string;
  debit: number;
  credit: number;
  runningBalance: number;
  description: string;
}

export interface RefundRequestRecord {
  id: string;
  studentId: string;
  paymentId: string;
  requestedAmount: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  approvedByUserId?: string;
  processedAt?: string;
}

class FeesFinanceScholarshipGovernanceService {
  private static instance: FeesFinanceScholarshipGovernanceService;

  private assessments: StudentFeeAssessmentRecord[] = [
    {
      id: 'fa-2026-001',
      studentId: 'stud-001',
      feeStructureId: 'fsv-btech-cse-2026-v1',
      academicYearId: 'ay-2026-27',
      originalTotal: 51500,
      concessionAmount: 0,
      scholarshipAmount: 10000,
      netDue: 41500,
      status: 'PAID'
    }
  ];

  private invoices: StudentInvoiceRecord[] = [
    {
      id: 'inv-2026-001',
      invoiceNumber: 'INV-2026-000001',
      studentId: 'stud-001',
      assessmentId: 'fa-2026-001',
      issueDate: '2026-07-01',
      dueDate: '2026-08-15',
      totalAmount: 41500,
      paidAmount: 41500,
      balanceAmount: 0,
      status: 'PAID'
    },
    {
      id: 'inv-2026-002',
      invoiceNumber: 'INV-2026-000002',
      studentId: 'stud-002',
      assessmentId: 'fa-2026-002',
      issueDate: '2026-07-01',
      dueDate: '2026-08-01',
      totalAmount: 51500,
      paidAmount: 26500,
      balanceAmount: 25000,
      status: 'OVERDUE'
    }
  ];

  private payments: StudentPaymentRecord[] = [
    {
      id: 'pay-01',
      paymentNumber: 'PAY-2026-000001',
      studentId: 'stud-001',
      invoiceId: 'inv-2026-001',
      amount: 41500,
      paymentMethod: 'ONLINE',
      transactionReference: 'TXN-SSIU-981245',
      status: 'SUCCESS',
      paymentDate: '2026-07-10T14:30:00Z'
    }
  ];

  private receipts: StudentReceiptRecord[] = [
    {
      id: 'rcp-01',
      receiptNumber: 'RCP-2026-000001',
      paymentId: 'pay-01',
      studentId: 'stud-001',
      amount: 41500,
      issuedAt: '2026-07-10T14:31:00Z'
    }
  ];

  private ledgerEntries: StudentLedgerRecord[] = [
    {
      id: 'led-01',
      studentId: 'stud-001',
      transactionDate: '2026-07-01',
      type: 'DEBIT',
      referenceId: 'inv-2026-001',
      debit: 51500,
      credit: 0,
      runningBalance: 51500,
      description: 'Semester 3 Tuition & Exam Fee Assessed'
    },
    {
      id: 'led-02',
      studentId: 'stud-001',
      transactionDate: '2026-07-05',
      type: 'SCHOLARSHIP',
      referenceId: 'sch-01',
      debit: 0,
      credit: 10000,
      runningBalance: 41500,
      description: 'SSIU Merit Scholarship Credit'
    },
    {
      id: 'led-03',
      studentId: 'stud-001',
      transactionDate: '2026-07-10',
      type: 'PAYMENT',
      referenceId: 'pay-01',
      debit: 0,
      credit: 41500,
      runningBalance: 0,
      description: 'Online Payment Received (TXN-SSIU-981245)'
    }
  ];

  private refunds: RefundRequestRecord[] = [];

  private constructor() {}

  public static getInstance(): FeesFinanceScholarshipGovernanceService {
    if (!FeesFinanceScholarshipGovernanceService.instance) {
      FeesFinanceScholarshipGovernanceService.instance = new FeesFinanceScholarshipGovernanceService();
    }
    return FeesFinanceScholarshipGovernanceService.instance;
  }

  // ─── IDEMPOTENT PAYMENT PROCESSING ─────────────────────────────────────

  public recordPayment(params: {
    studentId: string;
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference: string;
  }): { payment: StudentPaymentRecord; receipt: StudentReceiptRecord } {
    // Prevent duplicate transaction reference
    const duplicate = this.payments.find(p => p.transactionReference === params.transactionReference && p.status === 'SUCCESS');
    if (duplicate) {
      throw new Error(`Transaction reference ${params.transactionReference} has already been processed.`);
    }

    const invoice = this.invoices.find(i => i.id === params.invoiceId);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found`);

    if (params.amount > invoice.balanceAmount) {
      throw new Error(`Payment amount ₹${params.amount} exceeds invoice balance ₹${invoice.balanceAmount}`);
    }

    const payment: StudentPaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: params.studentId,
      invoiceId: params.invoiceId,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      status: 'SUCCESS',
      paymentDate: new Date().toISOString()
    };
    this.payments.push(payment);

    // Update invoice
    invoice.paidAmount += params.amount;
    invoice.balanceAmount -= params.amount;
    invoice.status = invoice.balanceAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Generate receipt
    const receipt: StudentReceiptRecord = {
      id: `rcp-${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentId: payment.id,
      studentId: params.studentId,
      amount: params.amount,
      issuedAt: new Date().toISOString()
    };
    this.receipts.push(receipt);

    // Add ledger entry
    const previousBalance = this.ledgerEntries.filter(l => l.studentId === params.studentId).slice(-1)[0]?.runningBalance || 0;
    this.ledgerEntries.push({
      id: `led-${Date.now()}`,
      studentId: params.studentId,
      transactionDate: new Date().toISOString().split('T')[0],
      type: 'PAYMENT',
      referenceId: payment.id,
      debit: 0,
      credit: params.amount,
      runningBalance: previousBalance - params.amount,
      description: `Payment Received via ${params.paymentMethod} (${params.transactionReference})`
    });

    return { payment, receipt };
  }

  // ─── REFUND WORKFLOW WITH CEILING CHECK ────────────────────────────────

  public processRefund(params: {
    studentId: string;
    paymentId: string;
    refundAmount: number;
    reason: string;
    approvedByUserId: string;
  }): RefundRequestRecord {
    const payment = this.payments.find(p => p.id === params.paymentId && p.status === 'SUCCESS');
    if (!payment) throw new Error(`Successful payment ${params.paymentId} not found`);

    if (params.refundAmount > payment.amount) {
      throw new Error(`Refund amount ₹${params.refundAmount} exceeds original payment ₹${payment.amount}`);
    }

    const refund: RefundRequestRecord = {
      id: `ref-${Date.now()}`,
      studentId: params.studentId,
      paymentId: params.paymentId,
      requestedAmount: params.refundAmount,
      reason: params.reason,
      status: 'PROCESSED',
      approvedByUserId: params.approvedByUserId,
      processedAt: new Date().toISOString()
    };
    this.refunds.push(refund);

    // Add ledger entry for refund
    const previousBalance = this.ledgerEntries.filter(l => l.studentId === params.studentId).slice(-1)[0]?.runningBalance || 0;
    this.ledgerEntries.push({
      id: `led-${Date.now()}`,
      studentId: params.studentId,
      transactionDate: new Date().toISOString().split('T')[0],
      type: 'REFUND',
      referenceId: refund.id,
      debit: params.refundAmount,
      credit: 0,
      runningBalance: previousBalance + params.refundAmount,
      description: `Refund Processed for Payment ${payment.paymentNumber}`
    });

    return refund;
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getStudentFinanceHistory(studentId: string, context?: UserAuthorizationContext): {
    invoices: StudentInvoiceRecord[];
    payments: StudentPaymentRecord[];
    receipts: StudentReceiptRecord[];
    ledger: StudentLedgerRecord[];
    refunds: RefundRequestRecord[];
  } | undefined {
    // RBAC: If student, restrict to self
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    return {
      invoices: this.invoices.filter(i => i.studentId === studentId),
      payments: this.payments.filter(p => p.studentId === studentId),
      receipts: this.receipts.filter(r => r.studentId === studentId),
      ledger: this.ledgerEntries.filter(l => l.studentId === studentId),
      refunds: this.refunds.filter(r => r.studentId === studentId)
    };
  }
}

export const feesFinanceScholarshipGovernanceService = FeesFinanceScholarshipGovernanceService.getInstance();
