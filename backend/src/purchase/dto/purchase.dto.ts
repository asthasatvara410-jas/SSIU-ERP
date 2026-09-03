import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsInt, IsBoolean, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVendorDto {
  @ApiProperty({ example: 'VND-001' })
  @IsNotEmpty()
  @IsString()
  vendorCode: string;

  @ApiProperty({ example: 'ABC Suppliers Pvt Ltd' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Mr. Rajesh Patel' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;
}

export class PurchaseRequestItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantityRequested: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  estimatedUnitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreatePurchaseRequestDto {
  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requiredByDate?: string;

  @ApiPropertyOptional({ example: 'NORMAL', enum: ['URGENT', 'HIGH', 'NORMAL', 'LOW'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [PurchaseRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  items: PurchaseRequestItemDto[];
}

export class QuotationItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1450.00 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateQuotationDto {
  @ApiPropertyOptional({ description: 'Purchase Request ID (optional)' })
  @IsOptional()
  @IsString()
  purchaseRequestId?: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ example: 14, description: 'Delivery days promised' })
  @IsOptional()
  @IsInt()
  deliveryDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];
}

export class PurchaseOrderItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1450.00 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Purchase Request ID' })
  @IsOptional()
  @IsString()
  purchaseRequestId?: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class GoodsReceiptItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  quantityOrdered: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  quantityReceived: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityRejected?: number;

  @ApiProperty({ example: 1450.00 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'GOOD', enum: ['GOOD', 'DAMAGED', 'EXPIRED'] })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ description: 'Purchase Order ID' })
  @IsNotEmpty()
  @IsString()
  purchaseOrderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNo?: string;

  @ApiPropertyOptional({ description: 'Delivery Challan Number' })
  @IsOptional()
  @IsString()
  dcNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items: GoodsReceiptItemDto[];
}

export class CreatePurchaseInvoiceDto {
  @ApiProperty({ example: 'INV-2024-ABC-001' })
  @IsNotEmpty()
  @IsString()
  invoiceNo: string;

  @ApiPropertyOptional({ example: 'VENDOR-INV-789' })
  @IsOptional()
  @IsString()
  vendorInvoiceNo?: string;

  @ApiProperty({ description: 'Purchase Order ID' })
  @IsNotEmpty()
  @IsString()
  purchaseOrderId: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @ApiProperty({ example: '2024-11-01' })
  @IsNotEmpty()
  @IsDateString()
  invoiceDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 14500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 2610 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
