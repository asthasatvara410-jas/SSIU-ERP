import { PaymentService } from './src/fees/payment.service';
import { PaymentController } from './src/fees/payment.controller';
import { PaymentGatewayService } from './src/fees/payment-gateway/payment-gateway.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

async function runFeePaymentTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING ONLINE FEE PAYMENT & TRANSACTION ENGINE (PHASE 5) TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // In-memory data store
  const store = {
    institutes: new Map<string, any>(),
    departments: new Map<string, any>(),
    programs: new Map<string, any>(),
    semesters: new Map<string, any>(),
    students: new Map<string, any>(),
    users: new Map<string, any>(),
    feeHeads: new Map<string, any>(),
    feeStructures: new Map<string, any>(),
    studentFeeAccounts: new Map<string, any>(),
    studentFeeItems: new Map<string, any>(),
    feeInvoices: new Map<string, any>(),
    feeInvoiceItems: new Map<string, any>(),
    feeInvoiceAuditLogs: new Map<string, any>(),
    paymentOrders: new Map<string, any>(),
    paymentTransactions: new Map<string, any>(),
    paymentAuditLogs: new Map<string, any>(),
  };

  // Seed Students
  store.students.set('stu-1', {
    id: 'stu-1',
    erpId: 'STU001',
    enrollmentNo: '2026SSIUCE0101',
    firstName: 'Jigar',
    lastName: 'Parmar',
    email: 'jigar@ssiu.edu.in',
    status: 'ACTIVE',
  });

  store.students.set('stu-2', {
    id: 'stu-2',
    erpId: 'STU002',
    enrollmentNo: '2026SSIUCE0102',
    firstName: 'Aarav',
    lastName: 'Shah',
    email: 'aarav@ssiu.edu.in',
    status: 'ACTIVE',
  });

  // Seed Fee Account for Student 1 (Total Due: ₹64,000)
  store.studentFeeAccounts.set('sfa-1', {
    id: 'sfa-1',
    studentId: 'stu-1',
    academicYearCode: '2026-27',
    totalDue: new Prisma.Decimal(64000),
    totalPaid: new Prisma.Decimal(0),
    totalDiscount: new Prisma.Decimal(0),
    totalWaived: new Prisma.Decimal(0),
    balanceDue: new Prisma.Decimal(64000),
    status: 'PENDING',
  });

  store.studentFeeItems.set('sfi-1-1', { id: 'sfi-1-1', studentFeeAccountId: 'sfa-1', amount: new Prisma.Decimal(50000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(50000) });
  store.studentFeeItems.set('sfi-1-2', { id: 'sfi-1-2', studentFeeAccountId: 'sfa-1', amount: new Prisma.Decimal(10000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(10000) });
  store.studentFeeItems.set('sfi-1-3', { id: 'sfi-1-3', studentFeeAccountId: 'sfa-1', amount: new Prisma.Decimal(4000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(4000) });

  // Seed Fee Invoices
  // Invoice 1: Student 1 (₹64,000, ISSUED)
  store.feeInvoices.set('inv-1', {
    id: 'inv-1',
    invoiceNumber: 'SSIU/FEE/2026-27/000001',
    studentId: 'stu-1',
    studentFeeAccountId: 'sfa-1',
    totalAmount: new Prisma.Decimal(64000),
    status: 'ISSUED',
  });

  // Invoice 2: Student 2 (₹50,000, ISSUED)
  store.feeInvoices.set('inv-2', {
    id: 'inv-2',
    invoiceNumber: 'SSIU/FEE/2026-27/000002',
    studentId: 'stu-2',
    studentFeeAccountId: 'sfa-2',
    totalAmount: new Prisma.Decimal(50000),
    status: 'ISSUED',
  });

  // Invoice 3: Student 1 (₹10,000, DRAFT)
  store.feeInvoices.set('inv-draft', {
    id: 'inv-draft',
    invoiceNumber: 'SSIU/FEE/2026-27/000003',
    studentId: 'stu-1',
    studentFeeAccountId: 'sfa-1',
    totalAmount: new Prisma.Decimal(10000),
    status: 'DRAFT',
  });

  // Invoice 4: Student 1 (₹10,000, CANCELLED)
  store.feeInvoices.set('inv-cancelled', {
    id: 'inv-cancelled',
    invoiceNumber: 'SSIU/FEE/2026-27/000004',
    studentId: 'stu-1',
    studentFeeAccountId: 'sfa-1',
    totalAmount: new Prisma.Decimal(10000),
    status: 'CANCELLED',
  });

  let idCounter = 1;

  const mockPrisma: any = {
    feeInvoice: {
      findUnique: async ({ where }: any) => {
        const inv = store.feeInvoices.get(where.id);
        if (!inv) return null;
        const student = store.students.get(inv.studentId);
        const studentFeeAccount = store.studentFeeAccounts.get(inv.studentFeeAccountId);
        const paymentTransactions = Array.from(store.paymentTransactions.values()).filter(t => t.invoiceId === inv.id);
        return {
          ...inv,
          student,
          studentFeeAccount: studentFeeAccount ? {
            ...studentFeeAccount,
            items: Array.from(store.studentFeeItems.values()).filter(i => i.studentFeeAccountId === studentFeeAccount.id),
          } : null,
          paymentTransactions,
        };
      },
      update: async ({ where, data }: any) => {
        const current = store.feeInvoices.get(where.id);
        if (!current) throw new Error('Invoice not found');
        const updated = { ...current, ...data, updatedAt: new Date() };
        store.feeInvoices.set(where.id, updated);
        return updated;
      },
    },
    studentFeeAccount: {
      update: async ({ where, data }: any) => {
        const current = store.studentFeeAccounts.get(where.id);
        if (!current) throw new Error('Account not found');
        const updated = { ...current, ...data, updatedAt: new Date() };
        store.studentFeeAccounts.set(where.id, updated);
        return updated;
      },
    },
    studentFeeItem: {
      update: async ({ where, data }: any) => {
        const current = store.studentFeeItems.get(where.id);
        if (!current) throw new Error('Item not found');
        const updated = { ...current, ...data };
        store.studentFeeItems.set(where.id, updated);
        return updated;
      },
    },
    paymentOrder: {
      count: async () => store.paymentOrders.size,
      findUnique: async ({ where }: any) => {
        if (where.id) {
          const ord = store.paymentOrders.get(where.id);
          if (!ord) return null;
          const invoice = await mockPrisma.feeInvoice.findUnique({ where: { id: ord.invoiceId } });
          const student = store.students.get(ord.studentId);
          return { ...ord, invoice, student };
        }
        if (where.orderNumber) {
          for (const ord of store.paymentOrders.values()) {
            if (ord.orderNumber === where.orderNumber) return ord;
          }
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        for (const ord of store.paymentOrders.values()) {
          if (where.gatewayOrderId && ord.gatewayOrderId === where.gatewayOrderId) return ord;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const id = `ord-${idCounter++}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.paymentOrders.set(id, record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const current = store.paymentOrders.get(where.id);
        if (!current) throw new Error('Order not found');
        const updated = { ...current, ...data, updatedAt: new Date() };
        store.paymentOrders.set(where.id, updated);
        return updated;
      },
    },
    paymentTransaction: {
      count: async (args?: any) => {
        let list = Array.from(store.paymentTransactions.values());
        if (args?.where?.status) list = list.filter(t => t.status === args.where.status);
        return list.length;
      },
      findUnique: async ({ where }: any) => {
        if (where.id) {
          const tx = store.paymentTransactions.get(where.id);
          if (!tx) return null;
          const student = store.students.get(tx.studentId);
          const invoice = store.feeInvoices.get(tx.invoiceId);
          return { ...tx, student, invoice, auditLogs: [] };
        }
        if (where.gatewayPaymentId) {
          for (const tx of store.paymentTransactions.values()) {
            if (tx.gatewayPaymentId === where.gatewayPaymentId) {
              const invoice = store.feeInvoices.get(tx.invoiceId);
              return { ...tx, invoice };
            }
          }
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        for (const tx of store.paymentTransactions.values()) {
          if (where.paymentOrderId && tx.paymentOrderId === where.paymentOrderId && where.status && tx.status === where.status) {
            return tx;
          }
        }
        return null;
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.paymentTransactions.values());
        if (where?.invoiceId) list = list.filter(t => t.invoiceId === where.invoiceId);
        if (where?.studentId) list = list.filter(t => t.studentId === where.studentId);
        if (where?.status) list = list.filter(t => t.status === where.status);
        return list.map(t => {
          const student = store.students.get(t.studentId);
          const invoice = store.feeInvoices.get(t.invoiceId);
          return { ...t, student, invoice };
        });
      },
      create: async ({ data }: any) => {
        const id = `tx-${idCounter++}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.paymentTransactions.set(id, record);
        return record;
      },
    },
    paymentAuditLog: {
      create: async ({ data }: any) => {
        const id = `pal-${idCounter++}`;
        const record = { id, ...data, createdAt: new Date() };
        store.paymentAuditLogs.set(id, record);
        return record;
      },
    },
    feeInvoiceAuditLog: {
      create: async ({ data }: any) => {
        const id = `fial-${idCounter++}`;
        const record = { id, ...data, createdAt: new Date() };
        store.feeInvoiceAuditLogs.set(id, record);
        return record;
      },
    },
    paymentReceiptAuditLog: {
      create: async ({ data }: any) => {
        const id = `prec-al-${idCounter++}`;
        return { id, ...data, createdAt: new Date() };
      },
    },
    paymentReceipt: {
      count: async () => store.paymentTransactions.size, // approximate
      findUnique: async ({ where }: any) => {
        // Idempotency: check if receipt exists for paymentTransactionId
        if (where.receiptNumber) return null; // no stored receipts in this test
        if (where.paymentTransactionId) return null; // first call always creates
        return null;
      },
      create: async ({ data }: any) => {
        const id = `prec-${idCounter++}`;
        return { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'usr-student-1') return { id: 'usr-student-1', student: store.students.get('stu-1') };
        if (where.id === 'usr-student-2') return { id: 'usr-student-2', student: store.students.get('stu-2') };
        return null;
      },
    },
    $transaction: async (cb: (tx: any) => Promise<any>) => cb(mockPrisma),
  };

  const gatewayService = new PaymentGatewayService();
  const paymentService = new PaymentService(mockPrisma, gatewayService);
  const paymentController = new PaymentController(paymentService);

  const mockStudent1Req = {
    user: {
      id: 'usr-student-1',
      student: { id: 'stu-1' },
      roles: ['STUDENT'],
    },
  };

  const mockStudent2Req = {
    user: {
      id: 'usr-student-2',
      student: { id: 'stu-2' },
      roles: ['STUDENT'],
    },
  };

  const mockAdminReq = {
    user: {
      id: 'usr-admin',
      roles: ['ACCOUNTS_ADMIN', 'UNIVERSITY_ADMIN'],
    },
  };

  try {
    // ── TEST GROUP 1: Order Initiation & Amount Validation ──
    console.log('--- TEST GROUP 1: Payment Order Creation & Validation ---');
    const orderRes = await paymentController.createPaymentOrder({
      invoiceId: 'inv-1',
      amount: 20000, // Partial payment ₹20,000 against ₹64,000
    }, mockStudent1Req);

    assert(orderRes.success === true, 'Payment Order created successfully');
    assert(orderRes.orderNumber.startsWith('ORD-'), `Generated sequential order number: ${orderRes.orderNumber}`);
    assert(orderRes.amount === 20000, 'Order amount matches ₹20,000');
    assert(!!orderRes.gatewayOrderId, 'Gateway Order ID returned');
    assert(!!orderRes.keyId, 'Safe public Gateway Key ID returned');

    // Reject order creation for another student's invoice
    let otherStudentBlocked = false;
    try {
      await paymentController.createPaymentOrder({ invoiceId: 'inv-2' }, mockStudent1Req);
    } catch (err: any) {
      otherStudentBlocked = err instanceof ForbiddenException;
    }
    assert(otherStudentBlocked, 'Student 1 strictly blocked from creating order for Student 2 invoice (403 Forbidden)');

    // Reject order creation on DRAFT invoice
    let draftOrderBlocked = false;
    try {
      await paymentController.createPaymentOrder({ invoiceId: 'inv-draft' }, mockStudent1Req);
    } catch (err: any) {
      draftOrderBlocked = err instanceof BadRequestException && err.message.includes('DRAFT');
    }
    assert(draftOrderBlocked, 'Order creation on DRAFT invoice rejected with 400 Bad Request');

    // Reject payment amount greater than outstanding
    let excessiveAmountBlocked = false;
    try {
      await paymentController.createPaymentOrder({ invoiceId: 'inv-1', amount: 999999 }, mockStudent1Req);
    } catch (err: any) {
      excessiveAmountBlocked = err instanceof BadRequestException && err.message.includes('exceeds');
    }
    assert(excessiveAmountBlocked, 'Payment amount exceeding outstanding balance rejected with 400 Bad Request');

    // ── TEST GROUP 2: Partial Payment Verification & Atomic Settlement ──
    console.log('\n--- TEST GROUP 2: Partial Payment Verification & Atomic Settlement ---');
    const verifyRes1 = await paymentController.verifyPayment({
      paymentOrderId: orderRes.paymentOrderId,
      gatewayOrderId: orderRes.gatewayOrderId,
      gatewayPaymentId: 'pay_ssiu_test_001',
      signature: 'test_signature',
      paymentMethod: 'UPI',
    }, mockStudent1Req);

    assert(verifyRes1.success === true, 'Backend verified payment successfully');
    assert(verifyRes1.status === 'SUCCESS', 'Payment transaction status is SUCCESS');
    assert(verifyRes1.transactionNumber.startsWith('TXN-'), `Generated transaction number: ${verifyRes1.transactionNumber}`);
    assert(verifyRes1.invoiceStatus === 'PARTIALLY_PAID', 'Invoice transitioned to PARTIALLY_PAID after ₹20,000 installment');

    const inv1AfterPay1 = store.feeInvoices.get('inv-1');
    assert(inv1AfterPay1.status === 'PARTIALLY_PAID', 'Persisted invoice status is PARTIALLY_PAID in DB');

    const acc1AfterPay1 = store.studentFeeAccounts.get('sfa-1');
    assert(Number(acc1AfterPay1.totalPaid) === 20000, 'Student fee account total paid updated to ₹20,000');
    assert(Number(acc1AfterPay1.balanceDue) === 44000, 'Student fee account balance due updated to ₹44,000');

    // ── TEST GROUP 3: Idempotency & Duplicate Protection ──
    console.log('\n--- TEST GROUP 3: Idempotency & Duplicate Protection ---');
    const duplicateRes = await paymentController.verifyPayment({
      paymentOrderId: orderRes.paymentOrderId,
      gatewayOrderId: orderRes.gatewayOrderId,
      gatewayPaymentId: 'pay_ssiu_test_001', // Repeat same gateway payment ID
    }, mockStudent1Req);

    assert(duplicateRes.success === true, 'Duplicate request safely handled');
    assert(duplicateRes.alreadyProcessed === true, 'Flagged as already processed without double-crediting');
    assert(store.paymentTransactions.size === 1, 'No duplicate transaction created in database');
    assert(Number(store.studentFeeAccounts.get('sfa-1').totalPaid) === 20000, 'Balance remained untouched upon duplicate submission');

    // ── TEST GROUP 4: Full Settlement to PAID ──
    console.log('\n--- TEST GROUP 4: Remaining Balance Settlement to PAID ---');
    // Outstanding is ₹44,000
    const orderRes2 = await paymentController.createPaymentOrder({
      invoiceId: 'inv-1',
    }, mockStudent1Req); // Defaults to remaining ₹44,000

    assert(orderRes2.amount === 44000, 'Order 2 automatically defaulted to remaining outstanding balance: ₹44,000');

    const verifyRes2 = await paymentController.verifyPayment({
      paymentOrderId: orderRes2.paymentOrderId,
      gatewayOrderId: orderRes2.gatewayOrderId,
      gatewayPaymentId: 'pay_ssiu_test_002',
      signature: 'test_signature_2',
      paymentMethod: 'NETBANKING',
    }, mockStudent1Req);

    assert(verifyRes2.success === true, 'Second payment installment verified');
    assert(verifyRes2.invoiceStatus === 'PAID', 'Invoice transitioned to fully PAID status');

    const inv1Final = store.feeInvoices.get('inv-1');
    assert(inv1Final.status === 'PAID', 'Invoice status is PAID in database');

    const acc1Final = store.studentFeeAccounts.get('sfa-1');
    assert(Number(acc1Final.totalPaid) === 64000, 'Account total paid is ₹64,000');
    assert(Number(acc1Final.balanceDue) === 0, 'Account balance due is ₹0');
    assert(acc1Final.status === 'PAID', 'Student fee account transitioned to PAID');

    // Attempting to create another order on fully paid invoice
    let paidInvoiceOrderBlocked = false;
    try {
      await paymentController.createPaymentOrder({ invoiceId: 'inv-1' }, mockStudent1Req);
    } catch (err: any) {
      paidInvoiceOrderBlocked = err instanceof BadRequestException && err.message.includes('PAID');
    }
    assert(paidInvoiceOrderBlocked, 'Creating payment order on fully PAID invoice rejected with 400 Bad Request');

    // ── TEST GROUP 5: Payment Failure Handling ──
    console.log('\n--- TEST GROUP 5: Gateway Failure Handling ---');
    const orderRes3 = await paymentController.createPaymentOrder({
      invoiceId: 'inv-2',
      amount: 15000,
    }, mockStudent2Req);

    const failRes = await paymentController.recordPaymentFailure({
      paymentOrderId: orderRes3.paymentOrderId,
      failureReason: 'Insufficient funds in student bank account',
    }, mockStudent2Req);

    assert(failRes.success === true, 'Failure recorded successfully');
    assert(failRes.status === 'FAILED', 'Transaction status marked as FAILED');
    assert(store.feeInvoices.get('inv-2').status === 'ISSUED', 'Invoice 2 status remained ISSUED and untouched');

    // ── TEST GROUP 6: Payment Order Cancellation ──
    console.log('\n--- TEST GROUP 6: Payment Cancellation ---');
    const orderRes4 = await paymentController.createPaymentOrder({
      invoiceId: 'inv-2',
      amount: 10000,
    }, mockStudent2Req);

    const cancelRes = await paymentController.cancelPaymentOrder({
      paymentOrderId: orderRes4.paymentOrderId,
      reason: 'User closed payment window',
    }, mockStudent2Req);

    assert(cancelRes.success === true, 'Cancellation recorded successfully');
    assert(cancelRes.status === 'CANCELLED', 'Order status marked as CANCELLED');

    // ── TEST GROUP 7: Webhook Signature & Event Processing ──
    console.log('\n--- TEST GROUP 7: Webhook Handling ---');
    const orderRes5 = await paymentController.createPaymentOrder({
      invoiceId: 'inv-2',
      amount: 50000,
    }, mockStudent2Req);

    const webhookSecret = 'whsec_ssiu_test_secret';
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_capture_001',
            order_id: orderRes5.gatewayOrderId,
            amount: 5000000,
            method: 'upi',
          },
        },
      },
    });

    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const webhookRes = await paymentController.handleWebhook(
      webhookPayload,
      validSignature,
      {},
    );

    assert(webhookRes.received === true && webhookRes.status === 'PROCESSED', 'Webhook verified and processed payment idempotently');
    assert(store.feeInvoices.get('inv-2').status === 'PAID', 'Invoice 2 settled to PAID via webhook event');

    // ── TEST GROUP 8: Student Security & Privacy Isolation ──
    console.log('\n--- TEST GROUP 8: Student Privacy & RBAC Enforcement ---');
    const student1Payments = await paymentController.getMyPayments(mockStudent1Req);
    assert(student1Payments.length >= 2, 'Student 1 can fetch their payments history');
    assert(student1Payments.every((t: any) => t.studentId === 'stu-1'), 'Student 1 receives only their own transactions');

    // Student 1 attempts to access Student 2's payment transaction directly
    const student2Tx = Array.from(store.paymentTransactions.values()).find(t => t.studentId === 'stu-2');
    let student2TxBlocked = false;
    try {
      await paymentController.getPaymentById(student2Tx.id, mockStudent1Req);
    } catch (err: any) {
      student2TxBlocked = err instanceof ForbiddenException;
    }
    assert(student2TxBlocked, 'Student 1 strictly blocked from viewing Student 2 payment transaction (403 Forbidden)');

    // ── TEST GROUP 9: Settlement Status & Metrics ──
    console.log('\n--- TEST GROUP 9: Settlement Status & Metrics ---');
    const inv1Status = await paymentController.getInvoicePaymentStatus('inv-1', mockStudent1Req);
    assert(inv1Status.totalAmount === 64000, 'Invoice 1 total demand is ₹64,000');
    assert(inv1Status.paidAmount === 64000, 'Invoice 1 paid amount is ₹64,000');
    assert(inv1Status.outstandingAmount === 0, 'Invoice 1 outstanding amount is ₹0');
    assert(inv1Status.isPayable === false, 'Invoice 1 is no longer payable');

    const metrics = await paymentController.getPaymentMetrics();
    assert(metrics.totalTransactions >= 3, 'Overview metrics returns total transactions count');
    assert(metrics.totalCollectionAmount >= 114000, 'Overview metrics calculates total collection revenue');

  } catch (error) {
    console.error('❌ Test suite encountered unhandled error:', error);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFeePaymentTests();
