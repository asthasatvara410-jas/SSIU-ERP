import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreateVendorDto, CreatePurchaseRequestDto, CreateQuotationDto, CreatePurchaseOrderDto, CreateGoodsReceiptDto, CreatePurchaseInvoiceDto } from './dto/purchase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Purchase Management')
@ApiBearerAuth()
@Controller('api/v1/purchase')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // ── Vendors
  @Post('vendors')
  @RequirePermission('PURCHASE', 'CREATE')
  @ApiOperation({ summary: 'Create new Vendor/Supplier' })
  createVendor(@Body() dto: CreateVendorDto) {
    return this.purchaseService.createVendor(dto);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List all Vendors' })
  @ApiQuery({ name: 'search', required: false })
  getVendors(@Query('search') search?: string) {
    return this.purchaseService.getVendors(search);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get Vendor detail' })
  getVendorById(@Param('id') id: string) {
    return this.purchaseService.getVendorById(id);
  }

  @Patch('vendors/:id')
  @RequirePermission('PURCHASE', 'EDIT')
  @ApiOperation({ summary: 'Update Vendor details' })
  updateVendor(@Param('id') id: string, @Body() dto: Partial<CreateVendorDto>) {
    return this.purchaseService.updateVendor(id, dto);
  }

  @Patch('vendors/:id/deactivate')
  @RequirePermission('PURCHASE', 'EDIT')
  @ApiOperation({ summary: 'Deactivate Vendor' })
  deactivateVendor(@Param('id') id: string) {
    return this.purchaseService.deactivateVendor(id);
  }

  // ── Purchase Requests
  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a Purchase Request (Requisition)' })
  createRequest(@Body() dto: CreatePurchaseRequestDto, @Req() req: any) {
    return this.purchaseService.createPurchaseRequest(dto, req.user.id);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List Purchase Requests' })
  @ApiQuery({ name: 'status', required: false })
  getRequests(@Query('status') status?: string) {
    return this.purchaseService.getPurchaseRequests(status);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get Purchase Request detail with quotations and POs' })
  getRequestById(@Param('id') id: string) {
    return this.purchaseService.getPurchaseRequestById(id);
  }

  @Patch('requests/:id/approve')
  @RequirePermission('PURCHASE', 'APPROVE')
  @ApiOperation({ summary: 'Approve Purchase Request (HOI/Registrar)' })
  approveRequest(@Param('id') id: string, @Req() req: any) {
    return this.purchaseService.approvePurchaseRequest(id, req.user.id);
  }

  @Patch('requests/:id/reject')
  @RequirePermission('PURCHASE', 'REJECT')
  @ApiOperation({ summary: 'Reject Purchase Request' })
  rejectRequest(@Param('id') id: string, @Body('remarks') remarks: string) {
    return this.purchaseService.rejectPurchaseRequest(id, remarks);
  }

  // ── Quotations
  @Post('quotations')
  @RequirePermission('PURCHASE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record Vendor Quotation' })
  createQuotation(@Body() dto: CreateQuotationDto) {
    return this.purchaseService.createQuotation(dto);
  }

  @Get('quotations')
  @ApiOperation({ summary: 'List Quotations' })
  @ApiQuery({ name: 'purchaseRequestId', required: false })
  getQuotations(@Query('purchaseRequestId') purchaseRequestId?: string) {
    return this.purchaseService.getQuotations(purchaseRequestId);
  }

  @Patch('quotations/:id/select')
  @RequirePermission('PURCHASE', 'APPROVE')
  @ApiOperation({ summary: 'Select a Quotation (L1 vendor approval)' })
  selectQuotation(@Param('id') id: string) {
    return this.purchaseService.selectQuotation(id);
  }

  // ── Purchase Orders
  @Post('orders')
  @RequirePermission('PURCHASE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Purchase Order (PO)' })
  createOrder(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.purchaseService.createPurchaseOrder(dto, req.user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List Purchase Orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  getOrders(@Query('status') status?: string, @Query('vendorId') vendorId?: string) {
    return this.purchaseService.getPurchaseOrders(status, vendorId);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get Purchase Order detail with GRNs and invoices' })
  getOrderById(@Param('id') id: string) {
    return this.purchaseService.getPurchaseOrderById(id);
  }

  // ── Goods Receipt Notes (GRN)
  @Post('grn')
  @RequirePermission('STORE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Goods Receipt Note (GRN) — auto updates stock' })
  createGRN(@Body() dto: CreateGoodsReceiptDto, @Req() req: any) {
    return this.purchaseService.createGoodsReceipt(dto, req.user.id);
  }

  @Get('grn')
  @ApiOperation({ summary: 'List Goods Receipt Notes' })
  @ApiQuery({ name: 'purchaseOrderId', required: false })
  getGRNs(@Query('purchaseOrderId') purchaseOrderId?: string) {
    return this.purchaseService.getGoodsReceipts(purchaseOrderId);
  }

  // ── Invoices
  @Post('invoices')
  @RequirePermission('PURCHASE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Purchase Invoice' })
  createInvoice(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchaseService.createInvoice(dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List Purchase Invoices' })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  getInvoices(@Query('vendorId') vendorId?: string, @Query('paymentStatus') paymentStatus?: string) {
    return this.purchaseService.getInvoices(vendorId, paymentStatus);
  }

  @Patch('invoices/:id/pay')
  @RequirePermission('PURCHASE', 'APPROVE')
  @ApiOperation({ summary: 'Mark invoice as paid (partial or full)' })
  markPaid(@Param('id') id: string, @Body('amount') amount: number) {
    return this.purchaseService.markInvoicePaid(id, amount);
  }
}
