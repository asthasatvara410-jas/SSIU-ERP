import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentReceiptQueryDto } from './dto/receipts.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a unique, sequential Receipt Number:
   * e.g. SSIU/REC/2026-27/000001
   */
  async generateReceiptNumber(academicYearCode?: string, prismaClient: any = this.prisma): Promise<string> {
    const ay = academicYearCode || `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`;
    const prefix = `SSIU/REC/${ay}/`;
    const count = await prismaClient.paymentReceipt.count();
    let seq = count + 1;
    let receiptNumber = `${prefix}${seq.toString().padStart(6, '0')}`;

    // Collision check
    let exists = await prismaClient.paymentReceipt.findUnique({
      where: { receiptNumber },
    });
    while (exists) {
      seq++;
      receiptNumber = `${prefix}${seq.toString().padStart(6, '0')}`;
      exists = await prismaClient.paymentReceipt.findUnique({
        where: { receiptNumber },
      });
    }

    return receiptNumber;
  }

  /**
   * Generates an official payment receipt for a successful transaction (Idempotent)
   */
  async generatePaymentReceipt(paymentTransactionId: string, user?: any, txPrisma?: any) {
    const db = txPrisma || this.prisma;

    // 1. Idempotency Check: Check if receipt already exists
    const existingReceipt = await db.paymentReceipt.findUnique({
      where: { paymentTransactionId },
      include: {
        paymentTransaction: true,
        invoice: {
          include: {
            feeStructure: true,
            studentFeeAccount: {
              include: { items: { include: { feeHead: true } } },
            },
            items: { include: { feeHead: true } },
          },
        },
        student: {
          include: {
            institute: true,
            department: true,
            batch: { include: { program: true } },
          },
        },
      },
    });

    if (existingReceipt) {
      return existingReceipt;
    }

    // 2. Fetch authoritative PaymentTransaction
    const tx = await db.paymentTransaction.findUnique({
      where: { id: paymentTransactionId },
      include: {
        invoice: {
          include: {
            feeStructure: true,
            studentFeeAccount: {
              include: { items: { include: { feeHead: true } } },
            },
            items: { include: { feeHead: true } },
          },
        },
        student: {
          include: {
            institute: true,
            department: true,
            batch: { include: { program: true } },
          },
        },
      },
    });

    if (!tx) {
      throw new NotFoundException(`Payment Transaction '${paymentTransactionId}' was not found`);
    }

    // Ensure transaction was SUCCESS
    if (tx.status !== 'SUCCESS') {
      throw new BadRequestException(
        `Official payment receipts can only be generated for successful payments. Transaction status is '${tx.status}'`,
      );
    }

    // 3. Compute Financial Balances
    const allConfirmedTxs = await db.paymentTransaction.findMany({
      where: {
        invoiceId: tx.invoiceId,
        status: 'SUCCESS',
      },
    });

    const totalPaidAfter = allConfirmedTxs.reduce(
      (sum: Prisma.Decimal, t: any) => sum.add(new Prisma.Decimal(t.amount)),
      new Prisma.Decimal(0),
    );

    const invoiceTotal = new Prisma.Decimal(tx.invoice.totalAmount);
    const balanceRemaining = Prisma.Decimal.max(new Prisma.Decimal(0), invoiceTotal.minus(totalPaidAfter));

    const receiptNumber = await this.generateReceiptNumber(tx.invoice.academicYearCode, db);

    // 4. Create Payment Receipt Record
    const receipt = await db.paymentReceipt.create({
      data: {
        receiptNumber,
        paymentTransactionId: tx.id,
        invoiceId: tx.invoiceId,
        studentId: tx.studentId,
        amount: tx.amount,
        totalPaidAfter,
        balanceRemaining,
        paymentDate: tx.paidAt || new Date(),
        paymentMode: tx.paymentMethod || 'ONLINE',
        gateway: tx.gateway || 'RAZORPAY',
        status: 'ISSUED',
      },
      include: {
        paymentTransaction: true,
        invoice: {
          include: {
            feeStructure: true,
            studentFeeAccount: {
              include: { items: { include: { feeHead: true } } },
            },
            items: { include: { feeHead: true } },
          },
        },
        student: {
          include: {
            institute: true,
            department: true,
            batch: { include: { program: true } },
          },
        },
      },
    });

    // 5. Create Audit Log
    await db.paymentReceiptAuditLog.create({
      data: {
        receiptId: receipt.id,
        action: 'GENERATED',
        performedByUserId: user?.id || null,
        performedByName: user?.username || 'Payment System',
        details: `Official Receipt ${receiptNumber} generated for Transaction ${tx.transactionNumber} (Amount: ₹${tx.amount})`,
      },
    });

    return receipt;
  }

  /**
   * List and search payment receipts with pagination and student privacy isolation
   */
  async getPaymentReceipts(query: PaymentReceiptQueryDto, user: any) {
    const where: Prisma.PaymentReceiptWhereInput = {};

    // Student privacy isolation
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      where.studentId = studentId;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.receiptNumber) {
      where.receiptNumber = { contains: query.receiptNumber, mode: 'insensitive' };
    }
    if (query.transactionId) where.paymentTransactionId = query.transactionId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.status) where.status = query.status;
    if (query.paymentMode) where.paymentMode = query.paymentMode;

    if (query.fromDate || query.toDate) {
      where.paymentDate = {};
      if (query.fromDate) where.paymentDate.gte = new Date(query.fromDate);
      if (query.toDate) where.paymentDate.lte = new Date(query.toDate);
    }

    if (query.search) {
      where.OR = [
        { receiptNumber: { contains: query.search, mode: 'insensitive' } },
        { paymentTransaction: { transactionNumber: { contains: query.search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: query.search, mode: 'insensitive' } } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [total, receipts] = await Promise.all([
      this.prisma.paymentReceipt.count({ where }),
      this.prisma.paymentReceipt.findMany({
        where,
        include: {
          paymentTransaction: true,
          invoice: {
            include: {
              feeStructure: true,
            },
          },
          student: {
            include: {
              institute: true,
              department: true,
              batch: { include: { program: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: receipts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single Payment Receipt by ID (with privacy enforcement)
   */
  async getPaymentReceiptById(id: string, user: any) {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id },
      include: {
        paymentTransaction: true,
        invoice: {
          include: {
            feeStructure: true,
            studentFeeAccount: {
              include: { items: { include: { feeHead: true } } },
            },
            items: { include: { feeHead: true } },
          },
        },
        student: {
          include: {
            institute: true,
            department: true,
            batch: { include: { program: true } },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException(`Payment Receipt '${id}' was not found`);
    }

    // Student privacy isolation
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      if (receipt.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to view payment receipts of another student');
      }
    }

    // Log VIEWED action
    await this.prisma.paymentReceiptAuditLog.create({
      data: {
        receiptId: receipt.id,
        action: 'VIEWED',
        performedByUserId: user?.id || null,
        performedByName: user?.username || 'User',
        details: `Receipt ${receipt.receiptNumber} viewed`,
      },
    });

    return receipt;
  }

  /**
   * Get or generate receipt by Transaction ID
   */
  async getPaymentReceiptByTransactionId(transactionId: string, user: any) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) {
      throw new NotFoundException(`Payment Transaction '${transactionId}' was not found`);
    }

    // Privacy isolation
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id || (await this.resolveStudentId(user.id));
      if (tx.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to access transactions of another student');
      }
    }

    return this.generatePaymentReceipt(tx.id, user);
  }

  /**
   * Get Student Payment and Receipt History
   */
  async getStudentPaymentHistory(studentId: string, user: any) {
    // Privacy check
    if (user?.roles?.includes('STUDENT')) {
      const authStudentId = user?.student?.id || (await this.resolveStudentId(user.id));
      if (studentId !== authStudentId) {
        throw new ForbiddenException('You are not authorized to view payment history of another student');
      }
    }

    const transactions = await this.prisma.paymentTransaction.findMany({
      where: { studentId },
      include: {
        invoice: {
          include: {
            feeStructure: true,
          },
        },
        receipt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions;
  }

  /**
   * Generate official PDF / Print HTML payload for Receipt
   */
  async getPaymentReceiptPdf(id: string, user: any) {
    const receipt = await this.getPaymentReceiptById(id, user);

    const studentName = `${receipt.student.firstName} ${receipt.student.lastName || ''}`.trim();
    const instName = receipt.student.institute?.name || 'Swarrnim Institute of Technology';
    const progName = receipt.student.batch?.program?.name || receipt.invoice.feeStructure?.name || 'B.Tech';
    const items = receipt.invoice?.studentFeeAccount?.items || receipt.invoice?.items || [];

    const amountFormatted = `₹${Number(receipt.amount).toLocaleString('en-IN')}`;
    const totalPaidFormatted = `₹${Number(receipt.totalPaidAfter).toLocaleString('en-IN')}`;
    const remainingFormatted = `₹${Number(receipt.balanceRemaining).toLocaleString('en-IN')}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${receipt.receiptNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; font-size: 13px; }
    .receipt-box { max-width: 780px; margin: auto; border: 2px solid #1e293b; border-radius: 8px; padding: 24px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
    .univ-name { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; }
    .univ-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; background: #2563eb; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .meta-label { color: #64748b; font-weight: 500; }
    .meta-value { font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .summary-box { width: 280px; margin-left: auto; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 12px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .total-row { border-top: 2px solid #0f172a; padding-top: 6px; font-size: 14px; font-weight: 800; color: #16a34a; }
    .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <h1 class="univ-name">Swarrnim Startup &amp; Innovation University</h1>
      <div class="univ-sub">Bhoyan Rathod, Opp. IFFCO, Near Gandhinagar, Gujarat 382420</div>
      <div class="badge">Official Fee Payment Receipt</div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-row"><span class="meta-label">Receipt No:</span><span class="meta-value" style="color: #2563eb;">${receipt.receiptNumber}</span></div>
        <div class="meta-row"><span class="meta-label">Transaction ID:</span><span class="meta-value">${receipt.paymentTransaction.transactionNumber}</span></div>
        <div class="meta-row"><span class="meta-label">Gateway Ref:</span><span class="meta-value">${receipt.paymentTransaction.gatewayPaymentId || 'N/A'}</span></div>
        <div class="meta-row"><span class="meta-label">Payment Date:</span><span class="meta-value">${new Date(receipt.paymentDate).toLocaleDateString('en-IN')}</span></div>
        <div class="meta-row"><span class="meta-label">Payment Mode:</span><span class="meta-value">${receipt.paymentMode}</span></div>
      </div>
      <div>
        <div class="meta-row"><span class="meta-label">Student Name:</span><span class="meta-value">${studentName}</span></div>
        <div class="meta-row"><span class="meta-label">Enrollment No:</span><span class="meta-value">${receipt.student.enrollmentNo}</span></div>
        <div class="meta-row"><span class="meta-label">Institute / Program:</span><span class="meta-value">${instName} • ${progName}</span></div>
        <div class="meta-row"><span class="meta-label">Invoice Ref:</span><span class="meta-value">${receipt.invoice.invoiceNumber}</span></div>
        <div class="meta-row"><span class="meta-label">Receipt Status:</span><span class="meta-value" style="color: #16a34a;">${receipt.status}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Fee Head Description</th>
          <th class="text-right">Invoiced (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${item.feeHead?.name || item.feeHeadName || item.description || 'Academic Fee'}</strong> (${item.feeHead?.code || 'FEE'})</td>
            <td class="text-right">₹${Number(item.amount).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-row"><span>Invoice Total:</span><span>₹${Number(receipt.invoice.totalAmount).toLocaleString('en-IN')}</span></div>
      <div class="summary-row total-row"><span>CURRENT PAYMENT:</span><span>${amountFormatted}</span></div>
      <div class="summary-row" style="margin-top: 6px;"><span>Total Settled:</span><span>${totalPaidFormatted}</span></div>
      <div class="summary-row"><span>Balance Remaining:</span><span>${remainingFormatted}</span></div>
    </div>

    <div class="footer">
      This is a computerized official payment receipt issued by Swarrnim Startup &amp; Innovation University. No physical signature required.
    </div>
  </div>
</body>
</html>
    `;

    // Log DOWNLOADED action
    await this.prisma.paymentReceiptAuditLog.create({
      data: {
        receiptId: receipt.id,
        action: 'DOWNLOADED',
        performedByUserId: user?.id || null,
        performedByName: user?.username || 'User',
        details: `Receipt PDF generated and downloaded`,
      },
    });

    return {
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      amount: Number(receipt.amount),
      html,
      base64Pdf: Buffer.from(html).toString('base64'),
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
