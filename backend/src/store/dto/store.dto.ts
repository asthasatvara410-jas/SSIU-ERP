import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemCategoryDto {
  @ApiProperty({ example: 'IT_EQUIPMENT' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'IT Equipment & Peripherals' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for sub-categories' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateUnitDto {
  @ApiProperty({ example: 'NOS' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Numbers' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Nos' })
  @IsNotEmpty()
  @IsString()
  abbreviation: string;
}

export class CreateItemDto {
  @ApiProperty({ example: 'ITM-001' })
  @IsNotEmpty()
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 'A4 Size Paper Ream' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ItemCategory ID' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Unit of Measurement ID' })
  @IsNotEmpty()
  @IsString()
  unitId: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderQuantity?: number;

  @ApiPropertyOptional({ example: 250.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 'Rack B - Shelf 3' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class StockInDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 250.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'GRN ID or reference' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'GRN' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateStockAdjustmentDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 'DAMAGE', enum: ['DAMAGE', 'LOSS', 'CORRECTION', 'EXPIRY', 'TRANSFER'] })
  @IsNotEmpty()
  @IsString()
  adjustmentType: string;

  @ApiProperty({ example: -5, description: 'Positive for addition, negative for reduction' })
  @IsNotEmpty()
  @IsInt()
  quantityChanged: number;

  @ApiProperty({ example: 'Found 5 damaged items during quarterly audit' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CreateStockIssueDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantityIssued: number;

  @ApiPropertyOptional({ description: 'User ID to issue to' })
  @IsOptional()
  @IsString()
  issuedToUserId?: string;

  @ApiPropertyOptional({ description: 'Department name to issue to' })
  @IsOptional()
  @IsString()
  issuedToDepartment?: string;

  @ApiPropertyOptional({ example: 'For classroom use' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateStockReturnDto {
  @ApiProperty({ description: 'Issue ID (StockIssue reference)' })
  @IsNotEmpty()
  @IsString()
  issueId: string;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantityReturned: number;

  @ApiPropertyOptional({ example: 'GOOD', enum: ['GOOD', 'DAMAGED', 'PARTIAL'] })
  @IsOptional()
  @IsString()
  returnCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
