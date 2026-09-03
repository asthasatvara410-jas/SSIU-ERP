import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetCategoryDto {
  @ApiProperty({ example: 'IT_HARDWARE' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'IT Hardware & Computers' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 33.33, description: 'Annual depreciation rate %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depreciationRate?: number;

  @ApiPropertyOptional({ example: 3, description: 'Useful life in years' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usefulLifeYears?: number;
}

export class CreateAssetDto {
  @ApiProperty({ example: 'AST-IT-000001' })
  @IsNotEmpty()
  @IsString()
  assetTag: string;

  @ApiProperty({ example: 'Dell Inspiron 15 Laptop' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'AssetCategory ID' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: 'SN123456789' })
  @IsOptional()
  @IsString()
  serialNo?: string;

  @ApiPropertyOptional({ example: 'Inspiron 15 3511' })
  @IsOptional()
  @IsString()
  modelNo?: string;

  @ApiPropertyOptional({ example: 'Dell Technologies' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 55000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @ApiPropertyOptional({ example: 'CS Department - Ground Floor' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Block A' })
  @IsOptional()
  @IsString()
  buildingBlock?: string;

  @ApiPropertyOptional({ example: 'Ground' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ example: 'G-101' })
  @IsOptional()
  @IsString()
  roomNo?: string;

  @ApiPropertyOptional({ description: 'Assigned Department ID' })
  @IsOptional()
  @IsString()
  assignedDeptId?: string;

  @ApiPropertyOptional({ example: 'PO-2024-000001' })
  @IsOptional()
  @IsString()
  poNo?: string;

  @ApiPropertyOptional({ example: 'GRN-2024-000001' })
  @IsOptional()
  @IsString()
  grnNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AssignAssetDto {
  @ApiPropertyOptional({ description: 'User ID to assign to' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Department ID to assign to' })
  @IsOptional()
  @IsString()
  assignedToDeptId?: string;

  @ApiPropertyOptional({ example: 'Assigned for official use - Computer Lab 1' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class TransferAssetDto {
  @ApiPropertyOptional({ description: 'From Department ID' })
  @IsOptional()
  @IsString()
  fromDeptId?: string;

  @ApiPropertyOptional({ description: 'To Department ID' })
  @IsOptional()
  @IsString()
  toDeptId?: string;

  @ApiPropertyOptional({ example: 'Block A - G-101' })
  @IsOptional()
  @IsString()
  fromLocation?: string;

  @ApiPropertyOptional({ example: 'Block B - 1st Floor - 102' })
  @IsOptional()
  @IsString()
  toLocation?: string;

  @ApiPropertyOptional({ example: 'User User change due to department restructuring' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Receiving user ID' })
  @IsOptional()
  @IsString()
  receivedByUserId?: string;
}

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'CORRECTIVE', enum: ['PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN', 'AMC'] })
  @IsNotEmpty()
  @IsString()
  maintenanceType: string;

  @ApiProperty({ example: 'Keyboard keys not working — needs replacement' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: 'TechCare Services Pvt Ltd' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partsReplaced?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextMaintenanceDue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CompleteMaintenanceDto {
  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'Keyboard replaced with MK215 Logitech' })
  @IsOptional()
  @IsString()
  partsReplaced?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextMaintenanceDue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateDisposalDto {
  @ApiProperty({ example: 'SCRAPPED', enum: ['AUCTION', 'SCRAPPED', 'DONATED', 'SOLD', 'WRITTEN_OFF'] })
  @IsNotEmpty()
  @IsString()
  disposalMethod: string;

  @ApiProperty({ example: 'Asset beyond economic repair — over 10 years old' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  disposalValue?: number;

  @ApiPropertyOptional({ example: 'Scrap Dealer - Ahmedabad' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReceiveStockDto {
  @ApiProperty({ example: 'Dell Latitude 3420' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'AST-IT-000456' })
  @IsNotEmpty()
  @IsString()
  assetTag: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class IssueStockDto {
  @ApiProperty({ description: 'Asset ID to issue' })
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiProperty({ description: 'Target user ID' })
  @IsNotEmpty()
  @IsString()
  issueToUserId: string;

  @ApiProperty({ example: 'HOI' })
  @IsNotEmpty()
  @IsString()
  recipientRole: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateTransferRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReviewTransferRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateReturnRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  returnReason: string;

  @ApiProperty({ example: 'GOOD' })
  @IsNotEmpty()
  @IsString()
  conditionAtReturn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReviewReturnRequestDto {
  @ApiProperty({ example: 'GOOD' })
  @IsNotEmpty()
  @IsString()
  conditionAtReturn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateReplacementRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  problemDescription: string;

  @ApiProperty({ example: 'POOR' })
  @IsNotEmpty()
  @IsString()
  currentCondition: string;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateIssueReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiProperty({ example: 'TECHNICAL_PROBLEM' })
  @IsNotEmpty()
  @IsString()
  issueType: string;

  @ApiProperty({ example: 'HIGH' })
  @IsNotEmpty()
  @IsString()
  severity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class CreateVerificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foundLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualCustodian?: string;

  @ApiProperty({ example: 'GOOD' })
  @IsNotEmpty()
  @IsString()
  physicalCondition: string;

  @ApiProperty({ example: 'VERIFIED' })
  @IsNotEmpty()
  @IsString()
  verificationStatus: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ArchiveAssetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

