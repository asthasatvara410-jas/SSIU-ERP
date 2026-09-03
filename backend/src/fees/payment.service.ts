import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentGatewayService } from './payment-gateway/payment-gateway.service';
import {
  CreatePaymentOrderDto,
  VerifyPaymentDto,
  CancelPaymentOrderDto,
  RecordPaymentFailureDto,
  PaymentQueryDto,
  PaymentOrderStatusEnum,
  PaymentTransactionStatusEnum,
} from './dto/payments.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGatewayService: PaymentGatewayService,
  ) {}

  /**
   * Generates a safe, sequential, collision-free Payment Order Number:
   * e.g. ORD-2026-000001
   */
  async generateOrderNumber(prismaClient: any = this.prisma): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const count = await prismaClient.paymentOrder.count();
    let seq = count + 1;
    let orderNumber = `${prefix}${seq.toString().padStart(6, '0')}`;

    // Collision check
    let exists = await prismaClient.paymentOrder.findUnique({
      where: { orderNumber },
    });
    while (exists) {
      seq++;
      orderNumber = `${prefix}${seq.toString().padStart(6, '0')}`;
      exists = await prismaClient.paymentOrder.findUnique({
        where: { orderNumber },
      });
    }

    return orderNumber;
  }

  /**
   * Generates a safe, sequential, collision-free Payment Transaction Number:
   * e.g. TXN-2026-000001
   */
  async generateTransactionNumber(prismaClient: any = this.prisma): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}-`;
    const count = await prismaClient.paymentTransaction.count();
    let seq = count + 1;
    let transactionNumber = `${prefix}${seq.toString().padStart(6, '0')}`;

    // Collision check
    let exists = await prismaClient.paymentTransaction.findUnique({
      where: { transactionNumber },
    });
    while (exists) {
      seq++;
      transactionNumber = `${prefix}${seq.toString().padStart(6, '0')}`;
      exists = await prismaClient.paymentTransaction.findUnique({
        where: { transactionNumber },
      });
    }

    return transactionNumber;
  }

  /**
   * Step 1: Create Payment Order
   * Authenticates student, checks invoice payable state, calculates outstanding balance,
   * creates gateway order via abstraction, stores internal PaymentOrder, returns safe payload.
   */
  async createPaymentOrder(dto: CreatePaymentOrderDto, user: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        student: true,
        studentFeeAccount: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fee Invoice with ID '${dto.invoiceId}' was not found`);
    }

    // RBAC & Student Privacy Check
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      if (invoice.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to create payment orders for another student’s invoice');
      }
    }

    // Check if invoice is payable
    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Invoice is still in DRAFT status and cannot accept payments');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice has been CANCELLED and cannot accept payments');
    }
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already fully PAID');
    }

    // Calculate actual confirmed payments on this invoice
    const confirmedTxs = await this.prisma.paymentTransaction.findMany({
      where: {
        invoiceId: invoice.id,
        status: PaymentTransactionStatusEnum.SUCCESS,
      },
    });

    const alreadyPaid = confirmedTxs.reduce(
      (sum, tx) => sum.add(new Prisma.Decimal(tx.amount)),
      new Prisma.Decimal(0),
    );

    const totalInvoiceAmount = new Prisma.Decimal(invoice.totalAmount);
    const outstandingAmount = totalInvoiceAmount.minus(alreadyPaid);

    if (outstandingAmount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Invoice has no outstanding payable balance');
    }

    // Validate requested payment amount
    let paymentAmount: Prisma.Decimal;
    if (dto.amount !== undefined && dto.amount !== null) {
      paymentAmount = new Prisma.Decimal(dto.amount);
      if (paymentAmount.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }
      if (paymentAmount.greaterThan(outstandingAmount)) {
        throw new BadRequestException(
          `Requested payment amount (₹${paymentAmount}) exceeds the current outstanding invoice balance (₹${outstandingAmount})`,
        );
      }
    } else {
      // Default to full outstanding balance
      paymentAmount = outstandingAmount;
    }

    const orderNumber = await this.generateOrderNumber();
    const gatewayProvider = this.paymentGatewayService.getGateway(dto.gateway);

    // Create gateway order
    const gatewayOrder = await gatewayProvider.createOrder({
      orderNumber,
      amount: paymentAmount.toNumber(),
      currency: 'INR',
      student: {
        id: invoice.student.id,
        name: `${invoice.student.firstName} ${invoice.student.lastName || ''}`.trim(),
        email: invoice.student.email,
        phone: invoice.student.phone || undefined,
        enrollmentNo: invoice.student.enrollmentNo,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    // Store internal PaymentOrder
    const paymentOrder = await this.prisma.paymentOrder.create({
      data: {
        orderNumber,
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        gateway: gatewayProvider.gatewayName,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        amount: paymentAmount,
        currency: 'INR',
        status: PaymentOrderStatusEnum.PENDING,
      },
    });

    // Log in PaymentAuditLog
    await this.prisma.paymentAuditLog.create({
      data: {
        paymentOrderId: paymentOrder.id,
        action: 'ORDER_CREATED',
        performedByUserId: user?.id || null,
        performedByName: user?.username || user?.firstName || 'Student',
        details: `Payment Order ${orderNumber} created for Invoice ${invoice.invoiceNumber} (Amount: ₹${paymentAmount})`,
      },
    });

    return {
      success: true,
      paymentOrderId: paymentOrder.id,
      orderNumber: paymentOrder.orderNumber,
      gateway: paymentOrder.gateway,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      amount: paymentOrder.amount.toNumber(),
      currency: paymentOrder.currency,
      keyId: gatewayProvider.getKeyId(),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  /**
   * Step 2: Payment Verification & Settlement (Idempotent & Atomic)
   * Validates gateway signature independently on backend.
   * Atomically creates PaymentTransaction, updates FeeInvoice & StudentFeeAccount.
   */
  async verifyPayment(dto: VerifyPaymentDto, user: any) {
    // 1. Idempotency & Duplicate Protection Check
    const existingSuccessfulTx = await this.prisma.paymentTransaction.findUnique({
      where: { gatewayPaymentId: dto.gatewayPaymentId },
      include: { invoice: true },
    });

    if (existingSuccessfulTx && existingSuccessfulTx.status === PaymentTransactionStatusEnum.SUCCESS) {
      await this.prisma.paymentAuditLog.create({
        data: {
          transactionId: existingSuccessfulTx.id,
          paymentOrderId: dto.paymentOrderId,
          action: 'DUPLICATE_ATTEMPT',
          performedByUserId: user?.id || null,
          performedByName: user?.username || 'System',
          details: `Duplicate payment verification skipped for Gateway Payment ID: ${dto.gatewayPaymentId}`,
        },
      });

      return {
        success: true,
        alreadyProcessed: true,
        transactionId: existingSuccessfulTx.id,
        transactionNumber: existingSuccessfulTx.transactionNumber,
        amount: Number(existingSuccessfulTx.amount),
        currency: existingSuccessfulTx.currency,
        paidAt: existingSuccessfulTx.paidAt,
        status: existingSuccessfulTx.status,
        invoiceStatus: existingSuccessfulTx.invoice.status,
        message: 'Payment was already verified and settled successfully.',
      };
    }

    // 2. Fetch authoritative internal PaymentOrder
    const paymentOrder = await this.prisma.paymentOrder.findUnique({
      where: { id: dto.paymentOrderId },
      include: {
        invoice: {
          include: {
            studentFeeAccount: {
              include: { items: true },
            },
            items: true,
          },
        },
        student: true,
      },
    });

    if (!paymentOrder) {
      throw new NotFoundException(`Payment Order '${dto.paymentOrderId}' was not found`);
    }

    // If order was already marked PAID
    if (paymentOrder.status === PaymentOrderStatusEnum.PAID) {
      const existingTx = await this.prisma.paymentTransaction.findFirst({
        where: { paymentOrderId: paymentOrder.id, status: PaymentTransactionStatusEnum.SUCCESS },
      });
      if (existingTx) {
        return {
          success: true,
          alreadyProcessed: true,
          transactionId: existingTx.id,
          transactionNumber: existingTx.transactionNumber,
          amount: Number(existingTx.amount),
          currency: existingTx.currency,
          paidAt: existingTx.paidAt,
          status: existingTx.status,
          invoiceStatus: paymentOrder.invoice.status,
          message: 'Payment order has already been settled.',
        };
      }
    }

    // 3. Independent Cryptographic Gateway Verification
    const gatewayProvider = this.paymentGatewayService.getGateway(paymentOrder.gateway);
    const verificationResult = await gatewayProvider.verifyPayment({
      orderId: paymentOrder.orderNumber,
      gatewayOrderId: dto.gatewayOrderId || paymentOrder.gatewayOrderId || '',
      gatewayPaymentId: dto.gatewayPaymentId,
      signature: dto.signature,
      amount: paymentOrder.amount.toNumber(),
      currency: paymentOrder.currency,
    });

    if (!verificationResult.isVerified) {
      // Record failed transaction attempt
      await this.prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: { status: PaymentOrderStatusEnum.FAILED },
      });

      const failedTxNumber = await this.generateTransactionNumber();
      const failedTx = await this.prisma.paymentTransaction.create({
        data: {
          paymentOrderId: paymentOrder.id,
          invoiceId: paymentOrder.invoiceId,
          studentId: paymentOrder.studentId,
          transactionNumber: failedTxNumber,
          gateway: paymentOrder.gateway,
          gatewayPaymentId: dto.gatewayPaymentId,
          gatewayOrderId: dto.gatewayOrderId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          paymentMethod: dto.paymentMethod || 'ONLINE',
          status: PaymentTransactionStatusEnum.FAILED,
          failureReason: verificationResult.failureReason || 'Signature verification failed',
        },
      });

      await this.prisma.paymentAuditLog.create({
        data: {
          transactionId: failedTx.id,
          paymentOrderId: paymentOrder.id,
          action: 'PAYMENT_FAILURE',
          performedByUserId: user?.id || null,
          performedByName: user?.username || 'Gateway',
          details: `Verification failed for Order ${paymentOrder.orderNumber}: ${verificationResult.failureReason}`,
        },
      });

      throw new BadRequestException(
        `Payment verification failed: ${verificationResult.failureReason || 'Invalid signature'}`,
      );
    }

    // 4. ATOMIC DATABASE TRANSACTION (Prisma $transaction)
    const result = await this.prisma.$transaction(async (tx) => {
      const txNumber = await this.generateTransactionNumber(tx);
      const paidDate = new Date();

      // Create PaymentTransaction
      const paymentTx = await tx.paymentTransaction.create({
        data: {
          paymentOrderId: paymentOrder.id,
          invoiceId: paymentOrder.invoiceId,
          studentId: paymentOrder.studentId,
          transactionNumber: txNumber,
          gateway: paymentOrder.gateway,
          gatewayPaymentId: dto.gatewayPaymentId,
          gatewayOrderId: dto.gatewayOrderId || paymentOrder.gatewayOrderId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          paymentMethod: dto.paymentMethod || verificationResult.paymentMethod || 'UPI',
          status: PaymentTransactionStatusEnum.SUCCESS,
          paidAt: paidDate,
        },
      });

      // Calculate total paid across all confirmed transactions including this one
      const allConfirmedTxs = await tx.paymentTransaction.findMany({
        where: {
          invoiceId: paymentOrder.invoiceId,
          status: PaymentTransactionStatusEnum.SUCCESS,
        },
      });

      const totalPaidOnInvoice = allConfirmedTxs.reduce(
        (sum, t) => sum.add(new Prisma.Decimal(t.amount)),
        new Prisma.Decimal(0),
      );

      const totalInvoiceAmount = new Prisma.Decimal(paymentOrder.invoice.totalAmount);
      const isInvoiceFullyPaid = totalPaidOnInvoice.greaterThanOrEqualTo(totalInvoiceAmount);
      const newInvoiceStatus = isInvoiceFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

      // Update FeeInvoice
      await tx.feeInvoice.update({
        where: { id: paymentOrder.invoiceId },
        data: {
          status: newInvoiceStatus,
          updatedAt: new Date(),
        },
      });

      // Update StudentFeeAccount
      const account = paymentOrder.invoice.studentFeeAccount;
      if (account) {
        const currentAccountPaid = new Prisma.Decimal(account.totalPaid || 0);
        const newAccountPaid = currentAccountPaid.add(new Prisma.Decimal(paymentOrder.amount));
        const totalDue = new Prisma.Decimal(account.totalDue);
        const discount = new Prisma.Decimal(account.totalDiscount || 0);
        const waived = new Prisma.Decimal(account.totalWaived || 0);
        const newBalanceDue = totalDue.minus(discount).minus(waived).minus(newAccountPaid);

        const newAccountStatus = newBalanceDue.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID';

        await tx.studentFeeAccount.update({
          where: { id: account.id },
          data: {
            totalPaid: newAccountPaid,
            balanceDue: newBalanceDue.lessThan(0) ? new Prisma.Decimal(0) : newBalanceDue,
            status: newAccountStatus,
            updatedAt: new Date(),
          },
        });

        // Allocate payment sequentially across student fee items
        let remainingAllocation = new Prisma.Decimal(paymentOrder.amount);
        for (const item of account.items) {
          if (remainingAllocation.lessThanOrEqualTo(0)) break;
          const outstanding = new Prisma.Decimal(item.outstandingAmount ?? item.amount);
          if (outstanding.greaterThan(0)) {
            const alloc = Prisma.Decimal.min(outstanding, remainingAllocation);
            const currentItemPaid = new Prisma.Decimal(item.paidAmount || 0);
            const newItemPaid = currentItemPaid.add(alloc);
            const newItemOutstanding = outstanding.minus(alloc);

            await tx.studentFeeItem.update({
              where: { id: item.id },
              data: {
                paidAmount: newItemPaid,
                outstandingAmount: newItemOutstanding,
                status: newItemOutstanding.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID',
              },
            });

            remainingAllocation = remainingAllocation.minus(alloc);
          }
        }
      }

      // Update PaymentOrder to PAID
      await tx.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: { status: PaymentOrderStatusEnum.PAID },
      });

      // Create Payment Audit Log
      await tx.paymentAuditLog.create({
        data: {
          transactionId: paymentTx.id,
          paymentOrderId: paymentOrder.id,
          action: 'PAYMENT_SUCCESS',
          performedByUserId: user?.id || null,
          performedByName: user?.username || 'Gateway Webhook/Client',
          details: `Settled payment of ₹${paymentOrder.amount} for Invoice ${paymentOrder.invoice.invoiceNumber}. Tx: ${txNumber}, Gateway Ref: ${dto.gatewayPaymentId}`,
        },
      });

      // Generate Official Payment Receipt (Phase 6)
      const ay = paymentOrder.invoice.academicYearCode || `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`;
      const receiptPrefix = `SSIU/REC/${ay}/`;
      const receiptCount = await tx.paymentReceipt.count();
      let receiptSeq = receiptCount + 1;
      let receiptNumber = `${receiptPrefix}${receiptSeq.toString().padStart(6, '0')}`;
      let receiptExists = await tx.paymentReceipt.findUnique({ where: { receiptNumber } });
      while (receiptExists) {
        receiptSeq++;
        receiptNumber = `${receiptPrefix}${receiptSeq.toString().padStart(6, '0')}`;
        receiptExists = await tx.paymentReceipt.findUnique({ where: { receiptNumber } });
      }

      const paymentReceipt = await tx.paymentReceipt.create({
        data: {
          receiptNumber,
          paymentTransactionId: paymentTx.id,
          invoiceId: paymentOrder.invoiceId,
          studentId: paymentOrder.studentId,
          amount: paymentOrder.amount,
          totalPaidAfter: totalPaidOnInvoice,
          balanceRemaining: Prisma.Decimal.max(new Prisma.Decimal(0), totalInvoiceAmount.minus(totalPaidOnInvoice)),
          paymentDate: paidDate,
          paymentMode: dto.paymentMethod || verificationResult.paymentMethod || 'UPI',
          gateway: paymentOrder.gateway,
          status: 'ISSUED',
        },
      });

      await tx.paymentReceiptAuditLog.create({
        data: {
          receiptId: paymentReceipt.id,
          action: 'GENERATED',
          performedByUserId: user?.id || null,
          performedByName: user?.username || 'Payment System',
          details: `Receipt ${receiptNumber} auto-generated upon verified payment.`,
        },
      });

      return {
        paymentTx,
        newInvoiceStatus,
        paymentReceipt,
      };
    });

    return {
      success: true,
      transactionId: result.paymentTx.id,
      transactionNumber: result.paymentTx.transactionNumber,
      receiptId: result.paymentReceipt?.id,
      receiptNumber: result.paymentReceipt?.receiptNumber,
      amount: Number(result.paymentTx.amount),
      currency: result.paymentTx.currency,
      paidAt: result.paymentTx.paidAt,
      status: result.paymentTx.status,
      invoiceStatus: result.newInvoiceStatus,
      invoiceNumber: paymentOrder.invoice.invoiceNumber,
      gatewayPaymentId: result.paymentTx.gatewayPaymentId,
    };
  }

  /**
   * Webhook Handler for asynchronous gateway events (idempotent & signature verified)
   */
  async handleWebhook(rawBody: string | Buffer, signature: string, headers: any) {
    const gateway = this.paymentGatewayService.getGateway();
    const isValid = gateway.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      this.logger.warn('Received unauthorized webhook with invalid signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
    const event = payload.event || payload.type;
    const paymentEntity = payload?.payload?.payment?.entity || payload?.data?.payment;

    if (!paymentEntity) {
      return { received: true, ignored: true };
    }

    const gatewayOrderId = paymentEntity.order_id || paymentEntity.gateway_order_id;
    const gatewayPaymentId = paymentEntity.id || paymentEntity.gateway_payment_id;

    if (event === 'payment.captured' || event === 'order.paid') {
      const order = await this.prisma.paymentOrder.findFirst({
        where: { gatewayOrderId },
      });

      if (order) {
        await this.verifyPayment(
          {
            paymentOrderId: order.id,
            gatewayOrderId,
            gatewayPaymentId,
            paymentMethod: paymentEntity.method?.toUpperCase() || 'UPI',
          },
          { id: 'SYSTEM_WEBHOOK', username: 'Razorpay Webhook' },
        );
      }
    } else if (event === 'payment.failed') {
      const order = await this.prisma.paymentOrder.findFirst({
        where: { gatewayOrderId },
      });

      if (order && order.status !== PaymentOrderStatusEnum.PAID) {
        await this.recordPaymentFailure(
          {
            paymentOrderId: order.id,
            gatewayPaymentId,
            failureReason: paymentEntity.error_description || 'Payment failed at gateway',
          },
          { id: 'SYSTEM_WEBHOOK', username: 'Razorpay Webhook' },
        );
      }
    }

    return { received: true, status: 'PROCESSED' };
  }

  /**
   * Cancel Payment Order
   */
  async cancelPaymentOrder(dto: CancelPaymentOrderDto, user: any) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: dto.paymentOrderId },
    });

    if (!order) {
      throw new NotFoundException(`Payment Order '${dto.paymentOrderId}' was not found`);
    }

    if (order.status === PaymentOrderStatusEnum.PAID) {
      throw new BadRequestException('Cannot cancel a payment order that is already PAID');
    }

    const updated = await this.prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: PaymentOrderStatusEnum.CANCELLED },
    });

    await this.prisma.paymentAuditLog.create({
      data: {
        paymentOrderId: order.id,
        action: 'PAYMENT_CANCELLED',
        performedByUserId: user?.id || null,
        performedByName: user?.username || 'Student',
        details: `Payment Order ${order.orderNumber} cancelled. Reason: ${dto.reason || 'User cancelled'}`,
      },
    });

    return { success: true, status: updated.status };
  }

  /**
   * Record Payment Failure (without affecting invoice balance)
   */
  async recordPaymentFailure(dto: RecordPaymentFailureDto, user: any) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: dto.paymentOrderId },
    });

    if (!order) {
      throw new NotFoundException(`Payment Order '${dto.paymentOrderId}' was not found`);
    }

    if (order.status === PaymentOrderStatusEnum.PAID) {
      throw new BadRequestException('Cannot record failure for an already PAID order');
    }

    await this.prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: PaymentOrderStatusEnum.FAILED },
    });

    const txNumber = await this.generateTransactionNumber();
    const failedTx = await this.prisma.paymentTransaction.create({
      data: {
        paymentOrderId: order.id,
        invoiceId: order.invoiceId,
        studentId: order.studentId,
        transactionNumber: txNumber,
        gateway: order.gateway,
        gatewayPaymentId: dto.gatewayPaymentId || `fail_${Date.now()}`,
        amount: order.amount,
        currency: order.currency,
        paymentMethod: 'ONLINE',
        status: PaymentTransactionStatusEnum.FAILED,
        failureReason: dto.failureReason,
      },
    });

    await this.prisma.paymentAuditLog.create({
      data: {
        transactionId: failedTx.id,
        paymentOrderId: order.id,
        action: 'PAYMENT_FAILURE',
        performedByUserId: user?.id || null,
        performedByName: user?.username || 'Gateway',
        details: `Payment failed for Order ${order.orderNumber}. Reason: ${dto.failureReason}`,
      },
    });

    return {
      success: true,
      transactionId: failedTx.id,
      status: failedTx.status,
      failureReason: failedTx.failureReason,
    };
  }

  /**
   * Query Payment Transactions with Filters and Student Privacy Isolation
   */
  async getPayments(query: PaymentQueryDto, user: any) {
    const where: Prisma.PaymentTransactionWhereInput = {};

    // Privacy isolation
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      where.studentId = studentId;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.status) where.status = query.status;
    if (query.gateway) where.gateway = query.gateway;

    if (query.fromDate || query.toDate) {
      where.paidAt = {};
      if (query.fromDate) where.paidAt.gte = new Date(query.fromDate);
      if (query.toDate) where.paidAt.lte = new Date(query.toDate);
    }

    if (query.search) {
      where.OR = [
        { transactionNumber: { contains: query.search, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: query.search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      this.prisma.paymentTransaction.count({ where }),
      this.prisma.paymentTransaction.findMany({
        where,
        include: {
          student: true,
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Payment Transaction by ID
   */
  async getPaymentById(id: string, user: any) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        student: true,
        invoice: {
          include: {
            studentFeeAccount: true,
            feeStructure: true,
          },
        },
        paymentOrder: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tx) {
      throw new NotFoundException(`Payment Transaction '${id}' was not found`);
    }

    // Privacy isolation
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      if (tx.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to view transactions of another student');
      }
    }

    return tx;
  }

  /**
   * Get Current Student's Payment Transactions
   */
  async getMyPayments(user: any) {
    const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
    if (!studentId) {
      return [];
    }

    return this.prisma.paymentTransaction.findMany({
      where: { studentId },
      include: {
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get Current Payment / Settlement Status of an Invoice
   */
  async getInvoicePaymentStatus(invoiceId: string, user: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: true,
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice '${invoiceId}' was not found`);
    }

    // Privacy isolation
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      if (invoice.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to view payment status for this invoice');
      }
    }

    const confirmedTxs = invoice.paymentTransactions.filter(
      (t) => t.status === PaymentTransactionStatusEnum.SUCCESS,
    );

    const paidAmount = confirmedTxs.reduce(
      (sum, t) => sum.add(new Prisma.Decimal(t.amount)),
      new Prisma.Decimal(0),
    );

    const totalAmount = new Prisma.Decimal(invoice.totalAmount);
    const outstandingAmount = Prisma.Decimal.max(new Prisma.Decimal(0), totalAmount.minus(paidAmount));

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalAmount: totalAmount.toNumber(),
      paidAmount: paidAmount.toNumber(),
      outstandingAmount: outstandingAmount.toNumber(),
      isPayable: invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && outstandingAmount.greaterThan(0),
      transactions: invoice.paymentTransactions,
    };
  }

  /**
   * Overview Payment Metrics (for future Dashboard / Backend consumption)
   */
  async getPaymentOverviewMetrics() {
    const [totalTransactions, successfulTxs, failedTxs, pendingOrders] = await Promise.all([
      this.prisma.paymentTransaction.count(),
      this.prisma.paymentTransaction.findMany({
        where: { status: PaymentTransactionStatusEnum.SUCCESS },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: PaymentTransactionStatusEnum.FAILED },
      }),
      this.prisma.paymentOrder.count({
        where: { status: PaymentOrderStatusEnum.PENDING },
      }),
    ]);

    const totalCollectionAmount = successfulTxs.reduce(
      (sum, tx) => sum.add(new Prisma.Decimal(tx.amount)),
      new Prisma.Decimal(0),
    );

    return {
      totalTransactions,
      successfulCount: successfulTxs.length,
      failedCount: failedTxs,
      pendingOrdersCount: pendingOrders,
      totalCollectionAmount: totalCollectionAmount.toNumber(),
    };
  }

  private async resolveStudentId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });
    return user?.student?.id || null;
  }
}
