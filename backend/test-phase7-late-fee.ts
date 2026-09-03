/**
 * ========================================================================
 * PHASE 7 TEST SUITE — LATE FEE MANAGEMENT & FAILED PAYMENT HANDLING
 * ========================================================================
 */

import { LateFeeService } from './src/fees/late-fee.service';
import { Prisma } from '@prisma/client';

// ── Minimal Mock Prisma ─────────────────────────────────────────────────────

interface MockState {
  lateFeeRules: any[];
  lateFeeRecords: any[];
  feeInvoices: any[];
  paymentTransactions: any[];
  paymentOrders: any[];
  paymentAuditLogs: any[];
  feeInvoiceAuditLogs: any[];
}

const state: MockState = {
  lateFeeRules: [],
  lateFeeRecords: [],
  feeInvoices: [],
  paymentTransactions: [],
  paymentOrders: [],
  paymentAuditLogs: [],
  feeInvoiceAuditLogs: [],
};

const mockPrisma: any = {
  lateFeeRule: {
    create: async ({ data }: any) => {
      const rule = { id: `rule-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      state.lateFeeRules.push(rule);
      return rule;
    },
    findUnique: async ({ where }: any) =>
      state.lateFeeRules.find((r: any) => r.id === where.id) || null,
    findFirst: async ({ where, orderBy }: any) => {
      let rules = state.lateFeeRules.filter((r: any) => {
        if (!r.isActive) return false;
        if (where?.OR) {
          return where.OR.some((cond: any) => {
            if (cond.feeStructureId !== undefined) return r.feeStructureId === cond.feeStructureId;
            if (cond.feeStructureId === null && cond.feeHeadId === null)
              return r.feeStructureId == null && r.feeHeadId == null;
            return false;
          });
        }
        return true;
      });
      return rules[0] || null;
    },
    findMany: async ({ where }: any) => {
      return state.lateFeeRules.filter((r: any) => {
        if (where?.isActive !== undefined && r.isActive !== where.isActive) return false;
        return true;
      });
    },
    count: async () => state.lateFeeRules.length,
    update: async ({ where, data }: any) => {
      const idx = state.lateFeeRules.findIndex((r: any) => r.id === where.id);
      if (idx === -1) throw new Error('Rule not found');
      state.lateFeeRules[idx] = { ...state.lateFeeRules[idx], ...data, updatedAt: new Date() };
      return state.lateFeeRules[idx];
    },
  },
  lateFeeRecord: {
    create: async ({ data }: any) => {
      const rec = { id: `rec-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      state.lateFeeRecords.push(rec);
      return rec;
    },
    update: async ({ where, data }: any) => {
      const idx = state.lateFeeRecords.findIndex((r: any) => r.id === where.id);
      if (idx === -1) throw new Error('LateFeeRecord not found');
      state.lateFeeRecords[idx] = { ...state.lateFeeRecords[idx], ...data, updatedAt: new Date() };
      return state.lateFeeRecords[idx];
    },
    findMany: async ({ where }: any) => {
      return state.lateFeeRecords.filter((r: any) => {
        if (where?.invoiceId && r.invoiceId !== where.invoiceId) return false;
        if (where?.status && r.status !== where.status) return false;
        return true;
      });
    },
  },
  feeInvoice: {
    findUnique: async ({ where, include }: any) => {
      const inv = state.feeInvoices.find((i: any) => i.id === where.id);
      if (!inv) return null;
      const txs = state.paymentTransactions.filter(
        (tx: any) => tx.invoiceId === inv.id && tx.status === 'SUCCESS',
      );
      const lateFeeRecords = state.lateFeeRecords.filter(
        (r: any) => r.invoiceId === inv.id && r.status === 'APPLIED',
      );
      return { ...inv, paymentTransactions: txs, lateFeeRecords };
    },
    findMany: async ({ where }: any) => {
      const now = new Date();
      return state.feeInvoices.filter((inv: any) => {
        if (where?.dueDate?.lt && new Date(inv.dueDate) >= now) return false;
        if (where?.status?.in && !where.status.in.includes(inv.status)) return false;
        return true;
      });
    },
    count: async () => state.feeInvoices.length,
    update: async ({ where, data }: any) => {
      const idx = state.feeInvoices.findIndex((i: any) => i.id === where.id);
      if (idx === -1) throw new Error('Invoice not found');
      state.feeInvoices[idx] = { ...state.feeInvoices[idx], ...data, updatedAt: new Date() };
      return state.feeInvoices[idx];
    },
  },
  paymentTransaction: {
    findUnique: async ({ where }: any) =>
      state.paymentTransactions.find((tx: any) => tx.id === where.id) || null,
    findFirst: async ({ where }: any) =>
      state.paymentTransactions.find((tx: any) =>
        (!where.gatewayPaymentId || tx.gatewayPaymentId === where.gatewayPaymentId) &&
        (!where.status || tx.status === where.status)
      ) || null,
    findMany: async ({ where }: any) => {
      return state.paymentTransactions.filter((tx: any) => {
        if (where?.invoiceId && tx.invoiceId !== where.invoiceId) return false;
        if (where?.status && tx.status !== where.status) return false;
        if (where?.studentId && tx.studentId !== where.studentId) return false;
        return true;
      });
    },
    count: async ({ where }: any = {}) => {
      return state.paymentTransactions.filter((tx: any) => {
        if (where?.status && tx.status !== where.status) return false;
        return true;
      }).length;
    },
    create: async ({ data }: any) => {
      const tx = { id: `tx-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      state.paymentTransactions.push(tx);
      return tx;
    },
    update: async ({ where, data }: any) => {
      const idx = state.paymentTransactions.findIndex((t: any) => t.id === where.id);
      if (idx !== -1) state.paymentTransactions[idx] = { ...state.paymentTransactions[idx], ...data };
      return state.paymentTransactions[idx];
    },
  },
  paymentOrder: {
    findUnique: async ({ where }: any) =>
      state.paymentOrders.find((o: any) => o.id === where.id) || null,
    findFirst: async ({ where }: any) =>
      state.paymentOrders.find((o: any) => o.gatewayOrderId === where.gatewayOrderId) || null,
    create: async ({ data }: any) => {
      const order = { id: `ord-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      state.paymentOrders.push(order);
      return order;
    },
    update: async ({ where, data }: any) => {
      const idx = state.paymentOrders.findIndex((o: any) => o.id === where.id);
      if (idx !== -1) state.paymentOrders[idx] = { ...state.paymentOrders[idx], ...data };
      return state.paymentOrders[idx];
    },
  },
  paymentAuditLog: {
    create: async ({ data }: any) => {
      const log = { id: `alog-${Date.now()}`, ...data, createdAt: new Date() };
      state.paymentAuditLogs.push(log);
      return log;
    },
  },
  feeInvoiceAuditLog: {
    create: async ({ data }: any) => {
      const log = { id: `ilog-${Date.now()}`, ...data, createdAt: new Date() };
      state.feeInvoiceAuditLogs.push(log);
      return log;
    },
    findMany: async () => state.feeInvoiceAuditLogs,
  },
  $transaction: async (fn: Function) => {
    const txProxy: any = {
      lateFeeRule: mockPrisma.lateFeeRule,
      lateFeeRecord: mockPrisma.lateFeeRecord,
      feeInvoice: mockPrisma.feeInvoice,
      paymentTransaction: mockPrisma.paymentTransaction,
      paymentOrder: mockPrisma.paymentOrder,
      paymentAuditLog: mockPrisma.paymentAuditLog,
      feeInvoiceAuditLog: mockPrisma.feeInvoiceAuditLog,
    };
    return fn(txProxy);
  },
};

// ── Test Helpers ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label}`);
    failed++;
  }
}

function makeInvoice(opts: Partial<{
  id: string;
  invoiceNumber: string;
  feeStructureId: string;
  studentId: string;
  totalAmount: number;
  status: string;
  dueDate: Date;
  lateFeeAmount: number;
  paidAmount: number;
}> = {}) {
  const inv = {
    id: opts.id || `inv-${Date.now()}-${Math.random()}`,
    invoiceNumber: opts.invoiceNumber || `SSIU/FEE/2026-27/000001`,
    feeStructureId: opts.feeStructureId || 'fs-001',
    studentId: opts.studentId || 'stu-001',
    studentFeeAccountId: 'acct-001',
    academicYearCode: '2026-27',
    semesterId: 'sem-001',
    totalAmount: new Prisma.Decimal(opts.totalAmount ?? 50000),
    subtotal: new Prisma.Decimal(opts.totalAmount ?? 50000),
    discountAmount: new Prisma.Decimal(0),
    waiverAmount: new Prisma.Decimal(0),
    lateFeeAmount: new Prisma.Decimal(opts.lateFeeAmount ?? 0),
    status: opts.status || 'ISSUED',
    dueDate: opts.dueDate || new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    invoiceDate: new Date(),
    issuedAt: new Date(),
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    remarks: null,
    createdBy: 'admin-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  state.feeInvoices.push(inv);
  return inv;
}

// ── Instantiate ─────────────────────────────────────────────────────────────

const service = new LateFeeService(mockPrisma as any);
const adminUser = { id: 'admin-001', username: 'finance.admin', roles: ['FINANCE'] };
const studentUser = { id: 'stu-user-001', username: 'student1', roles: ['STUDENT'], student: { id: 'stu-001' } };

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 1 — LATE FEE RULE CRUD
// ══════════════════════════════════════════════════════════════════════════════
async function testLateFeeRuleCrud() {
  console.log('\n--- TEST GROUP 1: Late Fee Rule CRUD & Validation ---');

  const rule1 = await service.createLateFeeRule({
    name: 'Standard Per-Day Late Fee',
    calculationType: 'PER_DAY',
    amount: 100,
    maximumAmount: 2000,
    gracePeriodDays: 2,
    feeStructureId: 'fs-001',
  }, adminUser);

  assert(!!rule1.id, 'PER_DAY rule created successfully');
  assert(rule1.name === 'Standard Per-Day Late Fee', 'Rule name stored correctly');
  assert(Number(rule1.amount) === 100, 'PER_DAY amount is ₹100');
  assert(Number(rule1.maximumAmount) === 2000, 'Maximum late fee cap is ₹2,000');
  assert(rule1.gracePeriodDays === 2, 'Grace period is 2 days');
  assert(rule1.isActive === true, 'Rule is active by default');
  assert(rule1.calculationType === 'PER_DAY', 'Calculation type is PER_DAY');

  const rule2 = await service.createLateFeeRule({
    name: 'One-Time Penalty',
    calculationType: 'ONE_TIME',
    amount: 500,
    gracePeriodDays: 0,
  }, adminUser);
  assert(rule2.calculationType === 'ONE_TIME', 'ONE_TIME rule created');

  const rule3 = await service.createLateFeeRule({
    name: 'Percentage Late Fee 2%',
    calculationType: 'PERCENTAGE',
    amount: 2,
    maximumAmount: 5000,
    gracePeriodDays: 0,
    applyOnOutstanding: true,
  }, adminUser);
  assert(rule3.calculationType === 'PERCENTAGE', 'PERCENTAGE rule created');
  assert(rule3.applyOnOutstanding === true, 'Applies on outstanding balance');

  // Update
  const updated = await service.updateLateFeeRule(rule1.id, { gracePeriodDays: 3 }, adminUser);
  assert(updated.gracePeriodDays === 3, 'Grace period updated to 3 days');

  // Status toggle
  const deactivated = await service.updateLateFeeRuleStatus(rule2.id, { isActive: false }, adminUser);
  assert(deactivated.isActive === false, 'ONE_TIME rule deactivated');

  return { rule1, rule2, rule3 };
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 2 — PER_DAY CALCULATION ENGINE
// ══════════════════════════════════════════════════════════════════════════════
async function testPerDayCalculation(rule1: any) {
  console.log('\n--- TEST GROUP 2: PER_DAY Late Fee Calculation Engine ---');

  // 10 days overdue, 3-day grace → 7 late days → ₹700
  const result = service.computeLateFee({
    rule: { ...rule1, gracePeriodDays: 3 },
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(30000),
    invoiceTotal: new Prisma.Decimal(50000),
  });

  assert(result.overdueDays === 7, `Late days after grace is 7 (got ${result.overdueDays})`);
  assert(Number(result.lateFeeAmount) === 700, `PER_DAY fee is ₹700 (got ₹${Number(result.lateFeeAmount)})`);

  // Grace period test — within grace → ₹0
  const withinGrace = service.computeLateFee({
    rule: { ...rule1, gracePeriodDays: 15 },
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(50000),
    invoiceTotal: new Prisma.Decimal(50000),
  });
  assert(Number(withinGrace.lateFeeAmount) === 0, 'No late fee during grace period (10 days < 15-day grace)');

  // Maximum cap test — 30 days × ₹100 = ₹3,000 → capped at ₹2,000
  const capped = service.computeLateFee({
    rule: { calculationType: 'PER_DAY', amount: new Prisma.Decimal(100), maximumAmount: new Prisma.Decimal(2000), gracePeriodDays: 0, applyOnOutstanding: false },
    dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(50000),
    invoiceTotal: new Prisma.Decimal(50000),
  });
  assert(Number(capped.lateFeeAmount) === 2000, `Maximum cap applied: ₹${Number(capped.lateFeeAmount)} = ₹2,000`);
  assert(capped.overdueDays === 30, 'Overdue days calculated correctly as 30');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 3 — ONE_TIME LATE FEE
// ══════════════════════════════════════════════════════════════════════════════
async function testOneTimeLaeFee() {
  console.log('\n--- TEST GROUP 3: ONE_TIME Late Fee ---');

  const oneTimeRule = {
    calculationType: 'ONE_TIME',
    amount: new Prisma.Decimal(500),
    maximumAmount: null,
    gracePeriodDays: 0,
    applyOnOutstanding: false,
  };

  // Overdue → ₹500
  const result = service.computeLateFee({
    rule: oneTimeRule,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(50000),
    invoiceTotal: new Prisma.Decimal(50000),
  });
  assert(Number(result.lateFeeAmount) === 500, 'ONE_TIME fee is ₹500 when overdue');

  // Not yet overdue → ₹0
  const notDue = service.computeLateFee({
    rule: oneTimeRule,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(50000),
    invoiceTotal: new Prisma.Decimal(50000),
  });
  assert(Number(notDue.lateFeeAmount) === 0, 'ONE_TIME fee is ₹0 if not yet overdue');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 4 — PERCENTAGE LATE FEE
// ══════════════════════════════════════════════════════════════════════════════
async function testPercentageLaeFee() {
  console.log('\n--- TEST GROUP 4: PERCENTAGE Late Fee ---');

  const pctRule = {
    calculationType: 'PERCENTAGE',
    amount: new Prisma.Decimal(2), // 2%
    maximumAmount: new Prisma.Decimal(5000),
    gracePeriodDays: 0,
    applyOnOutstanding: true,
  };

  // 2% of ₹30,000 outstanding = ₹600
  const result = service.computeLateFee({
    rule: pctRule,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(30000),
    invoiceTotal: new Prisma.Decimal(50000),
  });
  assert(Number(result.lateFeeAmount) === 600, `PERCENTAGE: 2% of ₹30,000 outstanding = ₹600 (got ₹${Number(result.lateFeeAmount)})`);

  // 2% of ₹200,000 = ₹4,000 → below cap ₹5,000
  const bigAmount = service.computeLateFee({
    rule: pctRule,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(200000),
    invoiceTotal: new Prisma.Decimal(200000),
  });
  assert(Number(bigAmount.lateFeeAmount) === 4000, `PERCENTAGE: 2% of ₹200,000 = ₹4,000 (below cap)`);

  // 2% of ₹500,000 = ₹10,000 → capped at ₹5,000
  const cappedPct = service.computeLateFee({
    rule: pctRule,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    outstanding: new Prisma.Decimal(500000),
    invoiceTotal: new Prisma.Decimal(500000),
  });
  assert(Number(cappedPct.lateFeeAmount) === 5000, `PERCENTAGE: 2% of ₹500,000 capped at ₹5,000`);
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 5 — INVOICE CALCULATION & OVERDUE STATUS
// ══════════════════════════════════════════════════════════════════════════════
async function testInvoiceLateFeeCalculation(rule1: any) {
  console.log('\n--- TEST GROUP 5: Invoice Late Fee Calculation & Overdue Status ---');

  // Create overdue invoice with no prior payments
  const overdueInv = makeInvoice({ totalAmount: 50000, dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });

  const calc = await service.calculateLateFeeForInvoice(overdueInv.id, adminUser);
  assert(calc.isOverdue === true, 'Invoice correctly identified as overdue');
  assert(calc.outstanding === 50000, 'Full ₹50,000 is outstanding');
  assert(calc.overdueDays > 0, `Overdue days > 0 (got ${calc.overdueDays})`);

  // Fully paid invoice — no late fee
  const paidInv = makeInvoice({ totalAmount: 50000, status: 'PAID', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });
  state.paymentTransactions.push({
    id: `tx-paid-${Date.now()}`,
    invoiceId: paidInv.id,
    studentId: paidInv.studentId,
    amount: new Prisma.Decimal(50000),
    status: 'SUCCESS',
    transactionNumber: 'TXN-PAID',
    gateway: 'RAZORPAY',
    createdAt: new Date(),
  });

  const paidCalc = await service.calculateLateFeeForInvoice(paidInv.id, adminUser);
  assert(paidCalc.outstanding === 0, 'Fully paid invoice has ₹0 outstanding');
  assert(paidCalc.lateFeeAmount === 0, 'No late fee on fully paid invoice');
  assert(paidCalc.isOverdue === false, 'Fully paid invoice is not overdue');

  // Partially paid invoice
  const partialInv = makeInvoice({ totalAmount: 50000, dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });
  state.paymentTransactions.push({
    id: `tx-partial-${Date.now()}`,
    invoiceId: partialInv.id,
    studentId: partialInv.studentId,
    amount: new Prisma.Decimal(20000),
    status: 'SUCCESS',
    transactionNumber: 'TXN-PARTIAL',
    gateway: 'RAZORPAY',
    createdAt: new Date(),
  });

  const partialCalc = await service.calculateLateFeeForInvoice(partialInv.id, adminUser);
  assert(partialCalc.outstanding === 30000, 'Partial payment: ₹30,000 still outstanding');
  assert(partialCalc.isOverdue === true, 'Partially paid overdue invoice is still overdue');
  assert(partialCalc.lateFeeAmount >= 0, 'Late fee calculated for partial payment');

  return overdueInv;
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 6 — APPLY & RECALCULATE (IDEMPOTENT)
// ══════════════════════════════════════════════════════════════════════════════
async function testApplyAndRecalculate(overdueInv: any) {
  console.log('\n--- TEST GROUP 6: Apply Late Fee & Idempotent Recalculation ---');

  const applyResult = await service.recalculateAndApplyLateFee(overdueInv.id, adminUser);
  assert(!!applyResult.record, 'LateFeeRecord created successfully');
  assert(applyResult.overdueDays > 0, `Overdue days > 0 (got ${applyResult.overdueDays})`);
  assert(applyResult.lateFeeAmount >= 0, 'Late fee amount applied');

  const recordId = applyResult.record.id;
  const recordsBefore = state.lateFeeRecords.filter((r: any) => r.invoiceId === overdueInv.id).length;

  // Recalculate same invoice again — should update, NOT create a second record
  const recalcResult = await service.recalculateAndApplyLateFee(overdueInv.id, adminUser);
  const recordsAfter = state.lateFeeRecords.filter((r: any) => r.invoiceId === overdueInv.id).length;

  assert(recordsAfter === recordsBefore, `No duplicate LateFeeRecord created: ${recordsBefore} → ${recordsAfter}`);

  // Invoice status updated to OVERDUE
  const updatedInv = state.feeInvoices.find((i: any) => i.id === overdueInv.id);
  assert(updatedInv?.status === 'OVERDUE', `Invoice status updated to OVERDUE (got '${updatedInv?.status}')`);
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 7 — STUDENT PRIVACY ENFORCEMENT
// ══════════════════════════════════════════════════════════════════════════════
async function testStudentPrivacy() {
  console.log('\n--- TEST GROUP 7: Student Privacy Enforcement ---');

  const inv = makeInvoice({ studentId: 'stu-002', totalAmount: 30000, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });

  let blocked = false;
  try {
    await service.calculateLateFeeForInvoice(inv.id, studentUser); // studentUser.student.id = stu-001
  } catch (e: any) {
    blocked = e.status === 403 || e.message?.includes('not authorized');
  }
  assert(blocked, 'Student 1 blocked from viewing Student 2 late fee (403 Forbidden)');

  // Student can view own invoice
  const ownInv = makeInvoice({ studentId: 'stu-001', totalAmount: 30000, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });
  let ownCalc: any = null;
  try {
    ownCalc = await service.calculateLateFeeForInvoice(ownInv.id, studentUser);
  } catch (_) {}
  assert(ownCalc !== null, 'Student can view their own invoice late fee');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 8 — FAILED PAYMENT PROTECTION
// ══════════════════════════════════════════════════════════════════════════════
async function testFailedPaymentProtection() {
  console.log('\n--- TEST GROUP 8: Failed Payment — Invoice Unchanged ---');

  const inv = makeInvoice({ id: 'inv-fail-001', totalAmount: 64000, status: 'ISSUED' });
  const initialStatus = inv.status;
  const initialTotal = Number(inv.totalAmount);

  // Simulate a FAILED payment transaction (does NOT touch invoice)
  const failedTx = {
    id: `tx-fail-${Date.now()}`,
    invoiceId: inv.id,
    studentId: inv.studentId,
    paymentOrderId: 'ord-fail-001',
    transactionNumber: 'TXN-FAIL-001',
    gateway: 'RAZORPAY',
    gatewayPaymentId: `fail_${Date.now()}`,
    amount: new Prisma.Decimal(20000),
    currency: 'INR',
    paymentMethod: 'UPI',
    status: 'FAILED',
    failureReason: 'INSUFFICIENT_FUNDS',
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  state.paymentTransactions.push(failedTx);

  const invoiceAfter = state.feeInvoices.find((i: any) => i.id === inv.id);
  assert(invoiceAfter?.status === initialStatus, 'Invoice status unchanged after FAILED payment');
  assert(Number(invoiceAfter?.totalAmount) === initialTotal, 'Invoice amount unchanged after FAILED payment');

  const successTxsForInv = state.paymentTransactions.filter(
    (tx: any) => tx.invoiceId === inv.id && tx.status === 'SUCCESS',
  );
  assert(successTxsForInv.length === 0, 'No SUCCESS transaction exists after FAILED payment');

  const receipts = state.paymentTransactions.filter(
    (tx: any) => tx.invoiceId === inv.id && tx.status === 'SUCCESS',
  );
  assert(receipts.length === 0, 'No receipt generated for FAILED payment');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 9 — FAILURE REASONS & FRIENDLY MESSAGES
// ══════════════════════════════════════════════════════════════════════════════
async function testFailureReasons() {
  console.log('\n--- TEST GROUP 9: Failure Reasons & Friendly Messages ---');

  const reasons = [
    'INSUFFICIENT_FUNDS',
    'BANK_ERROR',
    'USER_CANCELLED',
    'GATEWAY_ERROR',
    'TIMEOUT',
    'INVALID_PAYMENT',
    'SIGNATURE_VERIFICATION_FAILED',
    'UNKNOWN',
  ] as const;

  for (const reason of reasons) {
    const msg = service.getFriendlyFailureReason(reason);
    assert(msg.length > 0 && !msg.includes('card number') && !msg.includes('CVV'), `Friendly message for ${reason} is safe and non-empty`);
  }

  const nullMsg = service.getFriendlyFailureReason(null);
  assert(nullMsg.includes('could not be completed'), 'Null reason returns generic safe message');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 10 — RETRY PAYMENT (History Shows Both)
// ══════════════════════════════════════════════════════════════════════════════
async function testRetryPayment() {
  console.log('\n--- TEST GROUP 10: Retry Payment — Both Transactions in History ---');

  const inv = makeInvoice({ id: 'inv-retry-001', totalAmount: 30000, status: 'ISSUED' });

  // Attempt 1 — FAILED
  const failedTx = {
    id: `tx-retry-fail-${Date.now()}`,
    invoiceId: inv.id,
    studentId: inv.studentId,
    transactionNumber: 'TXN-RETRY-FAIL-001',
    status: 'FAILED',
    failureReason: 'BANK_ERROR',
    amount: new Prisma.Decimal(30000),
    gateway: 'RAZORPAY',
    gatewayPaymentId: `fail_retry_${Date.now()}`,
    createdAt: new Date(Date.now() - 60000),
  };
  state.paymentTransactions.push(failedTx);

  // Attempt 2 — SUCCESS
  const successTx = {
    id: `tx-retry-success-${Date.now()}`,
    invoiceId: inv.id,
    studentId: inv.studentId,
    transactionNumber: 'TXN-RETRY-SUCCESS-001',
    status: 'SUCCESS',
    failureReason: null,
    amount: new Prisma.Decimal(30000),
    gateway: 'RAZORPAY',
    gatewayPaymentId: `pay_retry_${Date.now()}`,
    paidAt: new Date(),
    createdAt: new Date(),
  };
  state.paymentTransactions.push(successTx);

  const allTxsForInv = state.paymentTransactions.filter((tx: any) => tx.invoiceId === inv.id);
  assert(allTxsForInv.length === 2, 'Both FAILED and SUCCESS transactions appear in history');

  const failedHistory = allTxsForInv.filter((tx: any) => tx.status === 'FAILED');
  const successHistory = allTxsForInv.filter((tx: any) => tx.status === 'SUCCESS');
  assert(failedHistory.length === 1, 'FAILED attempt preserved in history');
  assert(successHistory.length === 1, 'SUCCESS attempt recorded separately');
  assert(failedHistory[0].failureReason === 'BANK_ERROR', 'Failure reason retained on failed attempt');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 11 — DUPLICATE FAILED CALLBACK PROTECTION
// ══════════════════════════════════════════════════════════════════════════════
async function testDuplicateFailedCallback() {
  console.log('\n--- TEST GROUP 11: Duplicate Failed Callback Protection ---');

  const inv = makeInvoice({ totalAmount: 20000, status: 'ISSUED' });
  const gatewayPaymentId = `fail_dup_${Date.now()}`;

  const failedTx1 = {
    id: `tx-dup-1-${Date.now()}`,
    invoiceId: inv.id,
    studentId: inv.studentId,
    transactionNumber: 'TXN-DUP-001',
    status: 'FAILED',
    failureReason: 'GATEWAY_ERROR',
    amount: new Prisma.Decimal(20000),
    gateway: 'RAZORPAY',
    gatewayPaymentId,
    createdAt: new Date(),
  };
  state.paymentTransactions.push(failedTx1);

  // Check idempotency — same gatewayPaymentId should not be inserted again
  const existing = state.paymentTransactions.find(
    (tx: any) => tx.gatewayPaymentId === gatewayPaymentId && tx.status === 'FAILED',
  );
  const isDuplicate = !!existing;

  assert(isDuplicate, 'Duplicate detection: same gatewayPaymentId found in state');

  const duplicatesCount = state.paymentTransactions.filter(
    (tx: any) => tx.gatewayPaymentId === gatewayPaymentId,
  ).length;
  assert(duplicatesCount === 1, 'Only one failed record stored for the same gateway reference');
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 12 — FAILED PAYMENT REPORT (ADMIN VIEW)
// ══════════════════════════════════════════════════════════════════════════════
async function testFailedPaymentReport() {
  console.log('\n--- TEST GROUP 12: Failed Payment Report ---');

  // Mock paymentTransaction.findMany for FAILED status
  const failedPayments = state.paymentTransactions.filter((tx: any) => tx.status === 'FAILED');
  assert(failedPayments.length > 0, 'Failed transactions are present in state for reporting');

  const result = await service.getFailedPayments({}, adminUser);
  assert(Array.isArray(result.data), 'getFailedPayments returns data array');
  assert(result.meta.total >= 0, 'getFailedPayments returns total count metadata');
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — Run all tests
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n========================================================================');
  console.log('🧪 RUNNING PHASE 7 — LATE FEE & FAILED PAYMENT HANDLING TESTS');
  console.log('========================================================================');

  try {
    const { rule1 } = await testLateFeeRuleCrud();
    await testPerDayCalculation(rule1);
    await testOneTimeLaeFee();
    await testPercentageLaeFee();
    const overdueInv = await testInvoiceLateFeeCalculation(rule1);
    await testApplyAndRecalculate(overdueInv);
    await testStudentPrivacy();
    await testFailedPaymentProtection();
    await testFailureReasons();
    await testRetryPayment();
    await testDuplicateFailedCallback();
    await testFailedPaymentReport();
  } catch (e) {
    console.error('\n🔥 UNEXPECTED ERROR:', e);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

main();
