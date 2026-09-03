import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateItemCategoryDto,
  CreateUnitDto,
  CreateItemDto,
  StockInDto,
  CreateStockAdjustmentDto,
  CreateStockIssueDto,
  CreateStockReturnDto,
} from './dto/store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Counter Helpers ──────────────────────────────────────────────────────────

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ── Item Category ─────────────────────────────────────────────────────────────

  async createCategory(dto: CreateItemCategoryDto) {
    const existing = await this.prisma.itemCategory.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException(`Category code '${dto.code}' already exists.`);
    if (dto.parentId) {
      const parent = await this.prisma.itemCategory.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found.');
    }
    return this.prisma.itemCategory.create({
      data: { code: dto.code.toUpperCase(), name: dto.name, description: dto.description, parentId: dto.parentId },
    });
  }

  async getCategories() {
    return this.prisma.itemCategory.findMany({
      where: { status: 'ACTIVE' },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  // ── Unit of Measurement ───────────────────────────────────────────────────────

  async createUnit(dto: CreateUnitDto) {
    const existing = await this.prisma.unitOfMeasurement.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException(`Unit code '${dto.code}' already exists.`);
    return this.prisma.unitOfMeasurement.create({
      data: { code: dto.code.toUpperCase(), name: dto.name, abbreviation: dto.abbreviation },
    });
  }

  async getUnits() {
    return this.prisma.unitOfMeasurement.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }

  // ── Item Master ───────────────────────────────────────────────────────────────

  async createItem(dto: CreateItemDto) {
    const existing = await this.prisma.itemMaster.findUnique({ where: { itemCode: dto.itemCode.toUpperCase() } });
    if (existing) throw new ConflictException(`Item code '${dto.itemCode}' already exists.`);
    const [category, unit] = await Promise.all([
      this.prisma.itemCategory.findUnique({ where: { id: dto.categoryId } }),
      this.prisma.unitOfMeasurement.findUnique({ where: { id: dto.unitId } }),
    ]);
    if (!category) throw new NotFoundException('Category not found.');
    if (!unit) throw new NotFoundException('Unit of measurement not found.');
    return this.prisma.itemMaster.create({
      data: {
        itemCode: dto.itemCode.toUpperCase(),
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        minStockLevel: dto.minStockLevel ?? 0,
        reorderLevel: dto.reorderLevel ?? 5,
        reorderQuantity: dto.reorderQuantity ?? 10,
        unitPrice: dto.unitPrice ?? 0,
        location: dto.location,
      },
      include: { category: true, unit: true },
    });
  }

  async getItems(categoryId?: string, search?: string) {
    return this.prisma.itemMaster.findMany({
      where: {
        status: 'ACTIVE',
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { itemCode: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      include: { category: true, unit: true },
      orderBy: { name: 'asc' },
    });
  }

  async getItemById(id: string) {
    const item = await this.prisma.itemMaster.findUnique({
      where: { id },
      include: { category: true, unit: true, stockLedger: { take: 20, orderBy: { transactionDate: 'desc' } } },
    });
    if (!item) throw new NotFoundException('Item not found.');
    return item;
  }

  // ── Stock In ──────────────────────────────────────────────────────────────────

  async stockIn(dto: StockInDto, userId: string) {
    const item = await this.prisma.itemMaster.findUnique({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Item not found.');
    const newStock = item.currentStock + dto.quantity;

    return this.prisma.$transaction(async (tx) => {
      await tx.itemMaster.update({
        where: { id: dto.itemId },
        data: { currentStock: newStock, unitPrice: dto.unitPrice ?? item.unitPrice },
      });
      return tx.stockLedger.create({
        data: {
          itemId: dto.itemId,
          transactionType: 'STOCK_IN',
          quantity: dto.quantity,
          balanceAfter: newStock,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType ?? 'MANUAL',
          unitPrice: dto.unitPrice,
          totalValue: dto.unitPrice ? dto.unitPrice * dto.quantity : undefined,
          remarks: dto.remarks,
          performedByUserId: userId,
        },
      });
    });
  }

  // ── Stock Adjustment ──────────────────────────────────────────────────────────

  async createAdjustment(dto: CreateStockAdjustmentDto, userId: string) {
    const item = await this.prisma.itemMaster.findUnique({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Item not found.');
    const newStock = item.currentStock + dto.quantityChanged;
    if (newStock < 0) throw new BadRequestException('Adjustment would result in negative stock.');

    const adjNo = await this.nextSeq('ADJ', () => this.prisma.stockAdjustment.count());

    return this.prisma.$transaction(async (tx) => {
      const adj = await tx.stockAdjustment.create({
        data: {
          adjustmentNo: adjNo,
          itemId: dto.itemId,
          adjustmentType: dto.adjustmentType,
          quantityBefore: item.currentStock,
          quantityChanged: dto.quantityChanged,
          quantityAfter: newStock,
          reason: dto.reason,
          approvedByUserId: userId,
          status: 'APPROVED',
        },
      });
      await tx.itemMaster.update({ where: { id: dto.itemId }, data: { currentStock: newStock } });
      await tx.stockLedger.create({
        data: {
          itemId: dto.itemId,
          transactionType: 'ADJUSTMENT',
          quantity: dto.quantityChanged,
          balanceAfter: newStock,
          referenceType: 'ADJUSTMENT',
          referenceId: adj.id,
          remarks: dto.reason,
          performedByUserId: userId,
        },
      });
      return adj;
    });
  }

  async getAdjustments(itemId?: string) {
    return this.prisma.stockAdjustment.findMany({
      where: { ...(itemId ? { itemId } : {}) },
      include: { item: true },
      orderBy: { adjustmentDate: 'desc' },
    });
  }

  // ── Stock Issue ───────────────────────────────────────────────────────────────

  async issueStock(dto: CreateStockIssueDto, issuedByUserId: string) {
    const item = await this.prisma.itemMaster.findUnique({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Item not found.');
    if (item.currentStock < dto.quantityIssued) {
      throw new BadRequestException(`Insufficient stock. Available: ${item.currentStock}, Requested: ${dto.quantityIssued}`);
    }

    const issueNo = await this.nextSeq('ISS', () => this.prisma.stockIssue.count());
    const newStock = item.currentStock - dto.quantityIssued;

    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.stockIssue.create({
        data: {
          issueNo,
          itemId: dto.itemId,
          quantityIssued: dto.quantityIssued,
          issuedToUserId: dto.issuedToUserId,
          issuedToDepartment: dto.issuedToDepartment,
          issuedByUserId,
          purpose: dto.purpose,
          expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : undefined,
          remarks: dto.remarks,
        },
        include: { item: true, issuedToUser: true },
      });
      await tx.itemMaster.update({ where: { id: dto.itemId }, data: { currentStock: newStock } });
      await tx.stockLedger.create({
        data: {
          itemId: dto.itemId,
          transactionType: 'ISSUE',
          quantity: -dto.quantityIssued,
          balanceAfter: newStock,
          referenceType: 'ISSUE',
          referenceId: issue.id,
          remarks: dto.purpose,
          performedByUserId: issuedByUserId,
        },
      });
      return issue;
    });
  }

  async getIssues(itemId?: string, status?: string) {
    return this.prisma.stockIssue.findMany({
      where: {
        ...(itemId ? { itemId } : {}),
        ...(status ? { status } : {}),
      },
      include: { item: { include: { unit: true } }, issuedToUser: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  // ── Stock Return ──────────────────────────────────────────────────────────────

  async returnStock(dto: CreateStockReturnDto, receivedByUserId: string) {
    const issue = await this.prisma.stockIssue.findUnique({ where: { id: dto.issueId } });
    if (!issue) throw new NotFoundException('Issue record not found.');
    if (['FULLY_RETURNED', 'LOST'].includes(issue.status)) {
      throw new BadRequestException('This issue is already fully returned or marked as lost.');
    }
    if (dto.quantityReturned > issue.quantityIssued) {
      throw new BadRequestException('Return quantity exceeds issued quantity.');
    }

    const returnNo = await this.nextSeq('RET', () => this.prisma.stockReturn.count());
    const item = await this.prisma.itemMaster.findUnique({ where: { id: issue.itemId } });
    const newStock = item!.currentStock + dto.quantityReturned;

    return this.prisma.$transaction(async (tx) => {
      const ret = await tx.stockReturn.create({
        data: {
          returnNo,
          issueId: dto.issueId,
          itemId: issue.itemId,
          quantityReturned: dto.quantityReturned,
          returnCondition: dto.returnCondition ?? 'GOOD',
          receivedByUserId,
          remarks: dto.remarks,
        },
        include: { item: true },
      });
      await tx.itemMaster.update({ where: { id: issue.itemId }, data: { currentStock: newStock } });
      await tx.stockIssue.update({ where: { id: dto.issueId }, data: { status: 'FULLY_RETURNED' } });
      await tx.stockLedger.create({
        data: {
          itemId: issue.itemId,
          transactionType: 'RETURN',
          quantity: dto.quantityReturned,
          balanceAfter: newStock,
          referenceType: 'RETURN',
          referenceId: ret.id,
          remarks: dto.remarks,
          performedByUserId: receivedByUserId,
        },
      });
      return ret;
    });
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  async getCurrentStock(categoryId?: string) {
    return this.prisma.itemMaster.findMany({
      where: { status: 'ACTIVE', ...(categoryId ? { categoryId } : {}) },
      include: { category: true, unit: true },
      orderBy: { name: 'asc' },
    });
  }

  async getLowStockAlerts() {
    const items = await this.prisma.itemMaster.findMany({ where: { status: 'ACTIVE' } });
    return items.filter((i) => i.currentStock <= i.reorderLevel);
  }

  async getStockLedger(itemId: string) {
    const item = await this.prisma.itemMaster.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found.');
    const ledger = await this.prisma.stockLedger.findMany({
      where: { itemId },
      orderBy: { transactionDate: 'desc' },
    });
    return { item, ledger };
  }
}
