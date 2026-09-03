import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLateFeeRuleDto,
  UpdateLateFeeRuleDto,
  UpdateLateFeeRuleStatusDto,
  LateFeeRuleQueryDto,
} from './dto/late-fee.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LateFeeService {
  private readonly logger = new Logger(LateFeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────
  // PART A: LATE FEE RULE MANAGEMENT
  // ────────────────────────────────────────────────

  async createLateFeeRule(dto: CreateLateFeeRuleDto, user: any) {
    const rule = await this.prisma.lateFeeRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        feeStructureId: dto.feeStructureId || null,
        feeHeadId: dto.feeHeadId || null,
        calculationType: dto.calculationType,
        amount: new Prisma.Decimal(dto.amount),
        maximumAmount: dto.maximumAmount != null ? new Prisma.Decimal(dto.maximumAmount) : null,
        gracePeriodDays: dto.gracePeriodDays ?? 0,
        applyOnOutstanding: dto.applyOnOutstanding ?? false,
        isActive: true,
        createdBy: user?.id || 'SYSTEM',
      },
      include: {
        feeStructure: { select: { id: true, name: true } },
        feeHead: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Late Fee Rule created: '${rule.name}' (${rule.calculationType}) by ${user?.username}`);
    return rule;
  }

  async getLateFeeRules(query: LateFeeRuleQueryDto) {
    const where: Prisma.LateFeeRuleWhereInput = {};
    if (query.feeStructureId) where.feeStructureId = query.feeStructureId;
    if (query.feeHeadId) where.feeHeadId = query.feeHeadId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [total, rules] = await Promise.all([
      this.prisma.lateFeeRule.count({ where }),
      this.prisma.lateFeeRule.findMany({
        where,
        include: {
          feeStructure: { select: { id: true, name: true } },
          feeHead: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: rules, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getLateFeeRuleById(id: string) {
    const rule = await this.prisma.lateFeeRule.findUnique({
      where: { id },
      include: {
        feeStructure: { select: { id: true, name: true } },
        feeHead: { select: { id: true, name: true, code: true } },
      },
    });
    if (!rule) throw new NotFoundException(`Late Fee Rule '${id}' was not found`);
    return rule;
  }

  async updateLateFeeRule(id: string, dto: UpdateLateFeeRuleDto, user: any) {
    await this.getLateFeeRuleById(id);

    const data: Prisma.LateFeeRuleUpdateInput = {};
    if (dto.name) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.feeStructureId !== undefined) data.feeStructure = dto.feeStructureId ? { connect: { id: dto.feeStructureId } } : { disconnect: true };
    if (dto.feeHeadId !== undefined) data.feeHead = dto.feeHeadId ? { connect: { id: dto.feeHeadId } } : { disconnect: true };
    if (dto.calculationType) data.calculationType = dto.calculationType;
    if (dto.amount != null) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.maximumAmount != null) data.maximumAmount = new Prisma.Decimal(dto.maximumAmount);
    if (dto.gracePeriodDays != null) data.gracePeriodDays = dto.gracePeriodDays;
    if (dto.applyOnOutstanding !== undefined) data.applyOnOutstanding = dto.applyOnOutstanding;

    return this.prisma.lateFeeRule.update({ where: { id }, data });
  }

  async updateLateFeeRuleStatus(id: string, dto: UpdateLateFeeRuleStatusDto, user: any) {
    await this.getLateFeeRuleById(id);
    const updated = await this.prisma.lateFeeRule.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
    this.logger.log(`Late Fee Rule '${id}' set isActive=${dto.isActive} by ${user?.username}`);
    return updated;
  }

  // ────────────────────────────────────────────────
  // PART B: LATE FEE CALCULATION ENGINE
  // ────────────────────────────────────────────────

  /**
   * Core engine: compute late fee for an invoice using an applicable LateFeeRule.
   * Uses Decimal arithmetic throughout — no floating-point.
   */
  computeLateFee(params: {
    rule: { calculationType: string; amount: Prisma.Decimal; maximumAmount: Prisma.Decimal | null; gracePeriodDays: number; applyOnOutstanding: boolean };
    dueDate: Date;
    outstanding: Prisma.Decimal;
    invoiceTotal: Prisma.Decimal;
    asOfDate?: Date;
  }): { overdueDays: number; lateFeeAmount: Prisma.Decimal; baseAmount: Prisma.Decimal } {
    const { rule, dueDate, outstanding, invoiceTotal } = params;
    const today = params.asOfDate || new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateNorm = new Date(dueDate);
    dueDateNorm.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - dueDateNorm.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const lateDays = Math.max(0, diffDays - rule.gracePeriodDays);

    const ruleAmount = new Prisma.Decimal(rule.amount);
    const baseAmount = rule.applyOnOutstanding ? outstanding : invoiceTotal;

    let fee = new Prisma.Decimal(0);

    switch (rule.calculationType) {
      case 'FIXED':
        fee = lateDays > 0 ? ruleAmount : new Prisma.Decimal(0);
        break;

      case 'ONE_TIME':
        fee = lateDays > 0 ? ruleAmount : new Prisma.Decimal(0);
        break;

      case 'PER_DAY':
        fee = ruleAmount.mul(new Prisma.Decimal(lateDays));
        break;

      case 'PERCENTAGE':
        // ruleAmount is a percentage value e.g. 2 = 2%
        fee = baseAmount.mul(ruleAmount).div(new Prisma.Decimal(100));
        break;

      default:
        fee = new Prisma.Decimal(0);
    }

    // Apply maximum cap
    if (rule.maximumAmount && fee.gt(rule.maximumAmount)) {
      fee = new Prisma.Decimal(rule.maximumAmount);
    }

    return {
      overdueDays: lateDays,
      lateFeeAmount: fee,
      baseAmount,
    };
  }

  /**
   * Calculate and return current late fee for an invoice — does NOT write to DB.
   * Used for display / GET requests.
   */
  async calculateLateFeeForInvoice(invoiceId: string, user?: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        paymentTransactions: { where: { status: 'SUCCESS' } },
        lateFeeRecords: { where: { status: 'APPLIED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice '${invoiceId}' was not found`);

    // Student privacy check
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id;
      if (invoice.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to view fee details of another student');
      }
    }

    // If fully paid — no late fee
    const totalPaid = invoice.paymentTransactions.reduce(
      (sum, tx) => sum.add(new Prisma.Decimal(tx.amount)),
      new Prisma.Decimal(0),
    );
    const invoiceTotal = new Prisma.Decimal(invoice.totalAmount);
    const outstanding = Prisma.Decimal.max(new Prisma.Decimal(0), invoiceTotal.minus(totalPaid));

    if (outstanding.lte(0)) {
      return {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        invoiceTotal: Number(invoiceTotal),
        totalPaid: Number(totalPaid),
        outstanding: 0,
        overdueDays: 0,
        lateFeeAmount: 0,
        totalPayable: 0,
        isOverdue: false,
        rule: null,
      };
    }

    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const isOverdue = now > dueDate;

    if (!isOverdue) {
      return {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        invoiceTotal: Number(invoiceTotal),
        totalPaid: Number(totalPaid),
        outstanding: Number(outstanding),
        overdueDays: 0,
        lateFeeAmount: 0,
        totalPayable: Number(outstanding),
        isOverdue: false,
        rule: null,
      };
    }

    // Find applicable late fee rule (most specific first: feeStructureId, then global)
    const rule = await this.prisma.lateFeeRule.findFirst({
      where: {
        isActive: true,
        OR: [
          { feeStructureId: invoice.feeStructureId },
          { feeStructureId: null, feeHeadId: null },
        ],
      },
      orderBy: [{ feeStructureId: 'desc' }, { createdAt: 'asc' }],
    });

    if (!rule) {
      return {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        invoiceTotal: Number(invoiceTotal),
        totalPaid: Number(totalPaid),
        outstanding: Number(outstanding),
        overdueDays: 0,
        lateFeeAmount: 0,
        totalPayable: Number(outstanding),
        isOverdue: true,
        rule: null,
        message: 'Invoice is overdue but no late fee rule is configured',
      };
    }

    const { overdueDays, lateFeeAmount, baseAmount } = this.computeLateFee({
      rule,
      dueDate,
      outstanding,
      invoiceTotal,
    });

    return {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      invoiceTotal: Number(invoiceTotal),
      totalPaid: Number(totalPaid),
      outstanding: Number(outstanding),
      overdueDays,
      lateFeeAmount: Number(lateFeeAmount),
      totalPayable: Number(outstanding.add(lateFeeAmount)),
      baseAmount: Number(baseAmount),
      isOverdue: true,
      rule: {
        id: rule.id,
        name: rule.name,
        calculationType: rule.calculationType,
        amount: Number(rule.amount),
        gracePeriodDays: rule.gracePeriodDays,
        maximumAmount: rule.maximumAmount ? Number(rule.maximumAmount) : null,
      },
      existingLateFeeRecord: invoice.lateFeeRecords[0] || null,
    };
  }

  /**
   * Recalculate and persist a late fee record for an invoice (Idempotent — updates existing record)
   */
  async recalculateAndApplyLateFee(invoiceId: string, user: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        paymentTransactions: { where: { status: 'SUCCESS' } },
        lateFeeRecords: { where: { status: 'APPLIED' } },
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice '${invoiceId}' was not found`);

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot apply late fee to an invoice with status '${invoice.status}'`);
    }

    const totalPaid = invoice.paymentTransactions.reduce(
      (sum, tx) => sum.add(new Prisma.Decimal(tx.amount)),
      new Prisma.Decimal(0),
    );
    const invoiceTotal = new Prisma.Decimal(invoice.totalAmount);
    const outstanding = Prisma.Decimal.max(new Prisma.Decimal(0), invoiceTotal.minus(totalPaid));

    if (outstanding.lte(0)) {
      throw new BadRequestException('Invoice has no outstanding balance — late fee does not apply');
    }

    const now = new Date();
    if (now <= new Date(invoice.dueDate)) {
      throw new BadRequestException('Invoice is not yet overdue — late fee does not apply');
    }

    // Find applicable rule
    const rule = await this.prisma.lateFeeRule.findFirst({
      where: {
        isActive: true,
        OR: [
          { feeStructureId: invoice.feeStructureId },
          { feeStructureId: null, feeHeadId: null },
        ],
      },
      orderBy: [{ feeStructureId: 'desc' }, { createdAt: 'asc' }],
    });

    if (!rule) {
      throw new BadRequestException('No active late fee rule found for this invoice');
    }

    const { overdueDays, lateFeeAmount, baseAmount } = this.computeLateFee({
      rule,
      dueDate: new Date(invoice.dueDate),
      outstanding,
      invoiceTotal,
    });

    return this.prisma.$transaction(async (tx) => {
      // ONE_TIME: don't re-apply if already exists
      if (rule.calculationType === 'ONE_TIME' && invoice.lateFeeRecords.length > 0) {
        return {
          message: 'ONE_TIME late fee already applied — returning existing record',
          record: invoice.lateFeeRecords[0],
          overdueDays,
          lateFeeAmount: Number(lateFeeAmount),
        };
      }

      let record;
      const existingRecord = invoice.lateFeeRecords[0];

      if (existingRecord) {
        // Update existing record (idempotent recalculation)
        record = await tx.lateFeeRecord.update({
          where: { id: existingRecord.id },
          data: {
            calculationDate: now,
            overdueDays,
            baseAmount,
            lateFeeAmount,
          },
        });
      } else {
        // Create new record
        record = await tx.lateFeeRecord.create({
          data: {
            invoiceId: invoice.id,
            ruleId: rule.id,
            calculationDate: now,
            overdueDays,
            baseAmount,
            lateFeeAmount,
            status: 'APPLIED',
          },
        });
      }

      // Update invoice lateFeeAmount and status to OVERDUE if not already
      await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          lateFeeAmount,
          status: invoice.status === 'ISSUED' ? 'OVERDUE' : invoice.status,
        },
      });

      // Audit
      await tx.feeInvoiceAuditLog.create({
        data: {
          invoiceId: invoice.id,
          action: existingRecord ? 'LATE_FEE_RECALCULATED' : 'LATE_FEE_APPLIED',
          performedByUserId: user?.id || 'SYSTEM',
          performedByName: user?.username || 'Late Fee Engine',
          details: `Late fee of ₹${Number(lateFeeAmount)} applied. Rule: ${rule.name} (${rule.calculationType}). Overdue Days: ${overdueDays}`,
        },
      });

      return {
        record,
        overdueDays,
        lateFeeAmount: Number(lateFeeAmount),
        baseAmount: Number(baseAmount),
        ruleId: rule.id,
        ruleName: rule.name,
        invoiceStatus: invoice.status === 'ISSUED' ? 'OVERDUE' : invoice.status,
      };
    });
  }

  /**
   * Get overdue invoices with late fee summary for Admin view
   */
  async getOverdueInvoicesSummary(query: {
    instituteId?: string;
    programId?: string;
    semesterId?: string;
    page?: number;
    limit?: number;
  }) {
    const now = new Date();
    const where: Prisma.FeeInvoiceWhereInput = {
      dueDate: { lt: now },
      status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
    };

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [total, invoices] = await Promise.all([
      this.prisma.feeInvoice.count({ where }),
      this.prisma.feeInvoice.findMany({
        where,
        include: {
          student: {
            include: {
              institute: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
              batch: { include: { program: { select: { id: true, name: true } } } },
            },
          },
          paymentTransactions: { where: { status: 'SUCCESS' } },
          lateFeeRecords: { where: { status: 'APPLIED' }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const data = invoices.map((inv) => {
      const totalPaid = inv.paymentTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0,
      );
      const outstanding = Math.max(0, Number(inv.totalAmount) - totalPaid);
      const diffDays = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const lateFee = inv.lateFeeRecords[0] ? Number(inv.lateFeeRecords[0].lateFeeAmount) : 0;

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentName: `${inv.student.firstName} ${inv.student.lastName || ''}`.trim(),
        enrollmentNo: inv.student.enrollmentNo,
        instituteName: inv.student.institute?.name || '',
        programName: inv.student.batch?.program?.name || '',
        dueDate: inv.dueDate,
        daysOverdue: diffDays,
        invoiceTotal: Number(inv.totalAmount),
        totalPaid,
        outstanding,
        lateFeeAmount: lateFee,
        totalPayable: outstanding + lateFee,
        status: inv.status,
      };
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ────────────────────────────────────────────────
  // PART C: FAILED PAYMENT REPORTING
  // ────────────────────────────────────────────────

  /**
   * Get failed payment transactions for Admin report
   */
  async getFailedPayments(query: {
    invoiceId?: string;
    studentId?: string;
    gateway?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }, user: any) {
    const where: Prisma.PaymentTransactionWhereInput = {
      status: 'FAILED',
    };

    // Students can only see their own failed payments
    if (user?.roles?.includes('STUDENT')) {
      const studentId = user?.student?.id;
      where.studentId = studentId;
    } else {
      if (query.studentId) where.studentId = query.studentId;
    }

    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.gateway) where.gateway = query.gateway;

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) where.createdAt.lte = new Date(query.toDate);
    }

    if (query.search) {
      where.OR = [
        { transactionNumber: { contains: query.search, mode: 'insensitive' } },
        { failureReason: { contains: query.search, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: query.search, mode: 'insensitive' } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: query.search, mode: 'insensitive' } } },
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
          invoice: { select: { invoiceNumber: true, totalAmount: true } },
          student: {
            include: {
              institute: { select: { name: true } },
              department: { select: { name: true } },
              batch: { include: { program: { select: { name: true } } } },
            },
          },
          paymentOrder: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: transactions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Get friendly failure reason text — safe for student display
   */
  getFriendlyFailureReason(rawReason: string | null | undefined): string {
    const reasons: Record<string, string> = {
      INSUFFICIENT_FUNDS: 'Your bank account had insufficient funds to complete the payment.',
      BANK_ERROR: 'Your bank returned an error. Please retry or contact your bank.',
      USER_CANCELLED: 'You cancelled the payment. No amount was charged.',
      GATEWAY_ERROR: 'A payment gateway error occurred. Please retry.',
      TIMEOUT: 'The payment session timed out. Please retry.',
      INVALID_PAYMENT: 'The payment details were invalid. Please retry.',
      SIGNATURE_VERIFICATION_FAILED: 'Payment verification failed for security reasons.',
      UNKNOWN: 'The payment could not be completed. No amount has been added to your fee account.',
    };
    return reasons[rawReason || 'UNKNOWN'] || 'Your payment could not be completed. No amount has been added to your fee account.';
  }
}
