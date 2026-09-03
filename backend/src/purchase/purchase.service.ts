import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVendorDto,
  CreatePurchaseRequestDto,
  CreateQuotationDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
  CreatePurchaseInvoiceDto,
} from './dto/purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ── Vendor ────────────────────────────────────────────────────────────────────

  async createVendor(dto: CreateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({ where: { vendorCode: dto.vendorCode.toUpperCase() } });
    if (existing) throw new ConflictException(`Vendor code '${dto.vendorCode}' already exists.`);
    return this.prisma.vendor.create({
      data: {
        vendorCode: dto.vendorCode.toUpperCase(),
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        gstNo: dto.gstNo,
        panNo: dto.panNo,
        bankAccount: dto.bankAccount,
        bankIfsc: dto.bankIfsc,
        bankName: dto.bankName,
      },
    });
  }

  async getVendors(search?: string) {
    return this.prisma.vendor.findMany({
      where: {
        status: 'ACTIVE',
        ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { vendorCode: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getVendorById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true, quotations: true, invoices: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    return vendor;
  }

  async updateVendor(id: string, data: Partial<CreateVendorDto>) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    return this.prisma.vendor.update({ where: { id }, data });
  }

  async deactivateVendor(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    return this.prisma.vendor.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  // ── Purchase Request ──────────────────────────────────────────────────────────

  async createPurchaseRequest(dto: CreatePurchaseRequestDto, requestedByUserId: string) {
    const requestNo = await this.nextSeq('PR', () => this.prisma.purchaseRequest.count());
    return this.prisma.purchaseRequest.create({
      data: {
        requestNo,
        requestedByUserId,
        departmentId: dto.departmentId,
        instituteId: dto.instituteId,
        requiredByDate: dto.requiredByDate ? new Date(dto.requiredByDate) : undefined,
        priority: dto.priority ?? 'NORMAL',
        remarks: dto.remarks,
        status: 'SUBMITTED',
        items: {
          create: dto.items.map((item) => ({
            itemId: item.itemId,
            quantityRequested: item.quantityRequested,
            estimatedUnitPrice: item.estimatedUnitPrice,
            specifications: item.specifications,
            remarks: item.remarks,
          })),
        },
      },
      include: { items: { include: { item: true } }, requestedByUser: true },
    });
  }

  async getPurchaseRequests(status?: string) {
    return this.prisma.purchaseRequest.findMany({
      where: { ...(status ? { status } : {}) },
      include: { items: { include: { item: true } }, requestedByUser: true },
      orderBy: { requestDate: 'desc' },
    });
  }

  async getPurchaseRequestById(id: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        items: { include: { item: { include: { unit: true } } } },
        requestedByUser: true,
        quotations: { include: { vendor: true } },
        purchaseOrders: { include: { vendor: true } },
      },
    });
    if (!pr) throw new NotFoundException('Purchase request not found.');
    return pr;
  }

  async approvePurchaseRequest(id: string, approvedByUserId: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Purchase request not found.');
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'HOI_APPROVED' },
    });
  }

  async rejectPurchaseRequest(id: string, remarks: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Purchase request not found.');
    return this.prisma.purchaseRequest.update({ where: { id }, data: { status: 'REJECTED', remarks } });
  }

  // ── Quotation ─────────────────────────────────────────────────────────────────

  async createQuotation(dto: CreateQuotationDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found.');

    const quotNo = await this.nextSeq('QT', () => this.prisma.quotation.count());
    const totalAmount = dto.items.reduce((sum, i) => {
      const lineTotal = i.unitPrice * i.quantity;
      const gst = lineTotal * (i.gstPercent ?? 0) / 100;
      return sum + lineTotal + gst;
    }, 0);

    return this.prisma.quotation.create({
      data: {
        quotationNo: quotNo,
        purchaseRequestId: dto.purchaseRequestId,
        vendorId: dto.vendorId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        totalAmount,
        deliveryDays: dto.deliveryDays,
        termsConditions: dto.termsConditions,
        items: {
          create: dto.items.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
            gstPercent: i.gstPercent ?? 0,
            gstAmount: (i.unitPrice * i.quantity * (i.gstPercent ?? 0)) / 100,
            remarks: i.remarks,
          })),
        },
      },
      include: { vendor: true, items: { include: { item: true } } },
    });
  }

  async getQuotations(purchaseRequestId?: string) {
    return this.prisma.quotation.findMany({
      where: { ...(purchaseRequestId ? { purchaseRequestId } : {}) },
      include: { vendor: true, items: { include: { item: true } } },
      orderBy: { quotationDate: 'desc' },
    });
  }

  async selectQuotation(id: string) {
    const q = await this.prisma.quotation.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Quotation not found.');
    // Deselect others for same PR
    if (q.purchaseRequestId) {
      await this.prisma.quotation.updateMany({
        where: { purchaseRequestId: q.purchaseRequestId },
        data: { isSelected: false, status: 'REJECTED' },
      });
    }
    return this.prisma.quotation.update({ where: { id }, data: { isSelected: true, status: 'SELECTED' } });
  }

  // ── Purchase Order ────────────────────────────────────────────────────────────

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, createdByUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found.');

    const poNo = await this.nextSeq('PO', () => this.prisma.purchaseOrder.count());
    let gstTotal = 0;
    let subtotal = 0;
    const itemsData = dto.items.map((i) => {
      const lineTotal = i.unitPrice * i.quantity;
      const gst = lineTotal * (i.gstPercent ?? 0) / 100;
      subtotal += lineTotal;
      gstTotal += gst;
      return {
        itemId: i.itemId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: lineTotal,
        gstPercent: i.gstPercent ?? 0,
        gstAmount: gst,
        remarks: i.remarks,
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        poNo,
        purchaseRequestId: dto.purchaseRequestId,
        vendorId: dto.vendorId,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        totalAmount: subtotal,
        gstAmount: gstTotal,
        grandTotal: subtotal + gstTotal,
        terms: dto.terms,
        status: 'APPROVED',
        approvedByUserId: createdByUserId,
        approvedAt: new Date(),
        items: { create: itemsData },
      },
      include: { vendor: true, items: { include: { item: true } } },
    });
  }

  async getPurchaseOrders(status?: string, vendorId?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(vendorId ? { vendorId } : {}),
      },
      include: { vendor: true, _count: { select: { items: true, goodsReceipts: true } } },
      orderBy: { orderDate: 'desc' },
    });
  }

  async getPurchaseOrderById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: { include: { item: { include: { unit: true } } } },
        goodsReceipts: { include: { items: true } },
        invoices: true,
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found.');
    return po;
  }

  // ── Goods Receipt ─────────────────────────────────────────────────────────────

  async createGoodsReceipt(dto: CreateGoodsReceiptDto, receivedByUserId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: dto.purchaseOrderId } });
    if (!po) throw new NotFoundException('Purchase order not found.');
    if (['CANCELLED', 'CLOSED'].includes(po.status)) {
      throw new BadRequestException('Cannot receive goods for a cancelled or closed PO.');
    }

    const grnNo = await this.nextSeq('GRN', () => this.prisma.goodsReceipt.count());

    return this.prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.create({
        data: {
          grnNo,
          purchaseOrderId: dto.purchaseOrderId,
          receivedByUserId,
          vehicleNo: dto.vehicleNo,
          dcNo: dto.dcNo,
          invoiceRef: dto.invoiceRef,
          remarks: dto.remarks,
          items: {
            create: dto.items.map((i) => ({
              itemId: i.itemId,
              quantityOrdered: i.quantityOrdered,
              quantityReceived: i.quantityReceived,
              quantityRejected: i.quantityRejected ?? 0,
              unitPrice: i.unitPrice,
              condition: i.condition ?? 'GOOD',
              remarks: i.remarks,
            })),
          },
        },
        include: { items: { include: { item: true } } },
      });

      // Update stock for each received item
      for (const item of dto.items) {
        if (item.quantityReceived > 0) {
          const storeItem = await tx.itemMaster.findUnique({ where: { id: item.itemId } });
          if (storeItem) {
            const newStock = storeItem.currentStock + item.quantityReceived;
            await tx.itemMaster.update({ where: { id: item.itemId }, data: { currentStock: newStock } });
            await tx.stockLedger.create({
              data: {
                itemId: item.itemId,
                transactionType: 'STOCK_IN',
                quantity: item.quantityReceived,
                balanceAfter: newStock,
                referenceType: 'GRN',
                referenceId: grn.id,
                unitPrice: item.unitPrice,
                totalValue: item.unitPrice * item.quantityReceived,
                performedByUserId: receivedByUserId,
              },
            });
          }
        }
      }

      // Update PO status
      await tx.purchaseOrder.update({
        where: { id: dto.purchaseOrderId },
        data: { status: 'PARTIALLY_RECEIVED' },
      });

      return grn;
    });
  }

  async getGoodsReceipts(purchaseOrderId?: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { ...(purchaseOrderId ? { purchaseOrderId } : {}) },
      include: { items: { include: { item: true } }, purchaseOrder: { include: { vendor: true } } },
      orderBy: { receivedDate: 'desc' },
    });
  }

  // ── Purchase Invoice ──────────────────────────────────────────────────────────

  async createInvoice(dto: CreatePurchaseInvoiceDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: dto.purchaseOrderId } });
    if (!po) throw new NotFoundException('Purchase order not found.');

    const gst = dto.gstAmount ?? 0;
    const total = Number(dto.subtotal) + gst;

    return this.prisma.purchaseInvoice.create({
      data: {
        invoiceNo: dto.invoiceNo,
        vendorInvoiceNo: dto.vendorInvoiceNo,
        purchaseOrderId: dto.purchaseOrderId,
        vendorId: dto.vendorId,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        subtotal: dto.subtotal,
        gstAmount: gst,
        totalAmount: total,
        paidAmount: 0,
        balanceAmount: total,
        remarks: dto.remarks,
      },
      include: { vendor: true, purchaseOrder: true },
    });
  }

  async getInvoices(vendorId?: string, paymentStatus?: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      include: { vendor: true, purchaseOrder: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async markInvoicePaid(id: string, paidAmount: number) {
    const inv = await this.prisma.purchaseInvoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invoice not found.');
    const newPaid = Number(inv.paidAmount) + paidAmount;
    const newBalance = Number(inv.totalAmount) - newPaid;
    return this.prisma.purchaseInvoice.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        balanceAmount: newBalance,
        paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIAL',
        status: newBalance <= 0 ? 'PAID' : 'VERIFIED',
      },
    });
  }
}
