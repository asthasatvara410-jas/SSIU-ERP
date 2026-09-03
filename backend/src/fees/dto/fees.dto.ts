import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsEnum, IsInt, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

export enum FeeCategoryEnum {
  ACADEMIC = 'ACADEMIC',
  ADMISSION = 'ADMISSION',
  EXAMINATION = 'EXAMINATION',
  HOSTEL = 'HOSTEL',
  TRANSPORT = 'TRANSPORT',
  CERTIFICATE = 'CERTIFICATE',
  LIBRARY = 'LIBRARY',
  LABORATORY = 'LABORATORY',
  STUDENT_ACTIVITY = 'STUDENT_ACTIVITY',
  OTHER = 'OTHER',
}

export class CreateFeeHeadDto {
  @ApiProperty({ example: 'TUITION' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Academic Tuition Fee' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Semester academic instruction and lecture fee' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FeeCategoryEnum, default: FeeCategoryEnum.ACADEMIC })
  @IsOptional()
  @IsString()
  category?: string = FeeCategoryEnum.ACADEMIC;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultAmount?: number = 0;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean = false;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}

export class UpdateFeeHeadDto {
  @ApiPropertyOptional({ example: 'Academic Tuition Fee (Revised)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FeeCategoryEnum })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultAmount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateFeeHeadStatusDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class FeeHeadQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'Tuition' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FeeCategoryEnum })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export enum FeeFrequencyEnum {
  ONE_TIME = 'ONE_TIME',
  PER_SEMESTER = 'PER_SEMESTER',
  PER_YEAR = 'PER_YEAR',
  MONTHLY = 'MONTHLY',
  OTHER = 'OTHER',
}

export enum FeeStructureStatusEnum {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class FeeStructureItemDto {
  @ApiPropertyOptional({ description: 'Existing Item ID if updating' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'FeeHead ID (from Phase 1 FeeHead master)' })
  @IsNotEmpty()
  @IsString()
  feeHeadId: string;

  @ApiProperty({ example: 45000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean = false;

  @ApiPropertyOptional({ enum: FeeFrequencyEnum, default: FeeFrequencyEnum.PER_SEMESTER })
  @IsOptional()
  @IsString()
  frequency?: string = FeeFrequencyEnum.PER_SEMESTER;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number = 1;

  @ApiPropertyOptional({ example: 'Tuition and academic lab instruction' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFeeStructureDto {
  @ApiPropertyOptional({ example: 'FS-BTECH-CSE-S5-2026' })
  @IsOptional()
  @IsString()
  structureCode?: string;

  @ApiPropertyOptional({ description: 'Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ description: 'Program ID' })
  @IsNotEmpty()
  @IsString()
  programId: string;

  @ApiProperty({ description: 'Semester ID' })
  @IsNotEmpty()
  @IsString()
  semesterId: string;

  @ApiProperty({ example: '2026-27' })
  @IsNotEmpty()
  @IsString()
  academicYearCode: string;

  @ApiPropertyOptional({ description: 'Academic Year ID' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Student Category ID (e.g. GENERAL, TFWS, SC, ST)' })
  @IsOptional()
  @IsString()
  studentCategoryId?: string;

  @ApiProperty({ example: 'B.Tech CSE Semester 5 Fee 2026-27' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Regular academic fee schedule for AY 2026-27' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [FeeStructureItemDto] })
  @IsNotEmpty()
  items: FeeStructureItemDto[];

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2027-06-30' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ enum: FeeStructureStatusEnum, default: FeeStructureStatusEnum.DRAFT })
  @IsOptional()
  @IsString()
  status?: string = FeeStructureStatusEnum.DRAFT;
}

export class UpdateFeeStructureDto {
  @ApiPropertyOptional({ example: 'B.Tech CSE Semester 5 Fee 2026-27 (Revised)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ enum: FeeStructureStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [FeeStructureItemDto] })
  @IsOptional()
  items?: FeeStructureItemDto[];
}

export class DuplicateFeeStructureDto {
  @ApiProperty({ example: '2027-28' })
  @IsNotEmpty()
  @IsString()
  targetAcademicYearCode: string;

  @ApiPropertyOptional({ description: 'Target Academic Year ID' })
  @IsOptional()
  @IsString()
  targetAcademicYearId?: string;

  @ApiPropertyOptional({ example: 'B.Tech CSE Semester 5 Fee 2027-28' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  copyItems?: boolean = true;
}

export class FeeStructureQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'B.Tech' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentCategoryId?: string;

  @ApiPropertyOptional({ enum: FeeStructureStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class AddFeeStructureItemDto {
  @ApiProperty({ description: 'FeeHead ID' })
  @IsNotEmpty()
  @IsString()
  feeHeadId: string;

  @ApiProperty({ example: 5000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;

  @ApiPropertyOptional({ enum: FeeFrequencyEnum, default: FeeFrequencyEnum.PER_SEMESTER })
  @IsOptional()
  @IsString()
  frequency?: string = FeeFrequencyEnum.PER_SEMESTER;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeeStructureItemDto {
  @ApiPropertyOptional({ example: 6000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ enum: FeeFrequencyEnum })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// ── Phase 3 — Student Fee Assignment & Student Fee Account DTOs ──────────────

export enum FeeAccountStatusEnum {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  CANCELLED = 'CANCELLED',
}

export class AssignFeeStructureDto {
  @ApiProperty({ description: 'Active Fee Structure ID to assign' })
  @IsNotEmpty()
  @IsString()
  feeStructureId: string;

  @ApiProperty({ description: 'Array of eligible student IDs to assign fees to', type: [String] })
  @IsNotEmpty()
  @IsArray()
  studentIds: string[];
}

export class EligibleStudentsQueryDto {
  @ApiProperty({ description: 'Fee Structure ID to find eligible students for' })
  @IsNotEmpty()
  @IsString()
  feeStructureId: string;

  @ApiPropertyOptional({ description: 'Search by student name or enrollment number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Filter by Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Program ID' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Filter by Semester ID' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Filter by Academic Year' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

export class StudentFeeAccountQueryDto {
  @ApiPropertyOptional({ description: 'Search by student name or enrollment number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Filter by Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Program ID' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Filter by Semester ID' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Filter by Academic Year Code' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ description: 'Filter by Fee Structure ID' })
  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @ApiPropertyOptional({ description: 'Filter by Student ID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ enum: FeeAccountStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class CreateStudentFeeAccountDto {
  @ApiProperty({ description: 'Student ID' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Fee Structure ID' })
  @IsNotEmpty()
  @IsString()
  feeStructureId: string;

  @ApiProperty({ example: '2026-27' })
  @IsNotEmpty()
  @IsString()
  academicYearCode: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: 'Fee Account ID (StudentFeeAccount)' })
  @IsNotEmpty()
  @IsString()
  feeAccountId: string;

  @ApiProperty({ example: 25000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'ONLINE', enum: ['CASH', 'CHEQUE', 'DD', 'ONLINE', 'UPI', 'NEFT', 'RTGS'] })
  @IsNotEmpty()
  @IsString()
  paymentMode: string;

  @ApiPropertyOptional({ example: 'TXN123456789' })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Breakdown by fee heads' })
  @IsOptional()
  items?: { feeHeadId: string; amount: number }[];
}

export class ApplyDiscountDto {
  @ApiProperty({ description: 'Fee Account ID' })
  @IsNotEmpty()
  @IsString()
  feeAccountId: string;

  @ApiProperty({ example: 'SCHOLARSHIP', enum: ['SCHOLARSHIP', 'MERIT', 'STAFF_WARD', 'GOVERNMENT', 'MANAGEMENT', 'OTHER'] })
  @IsNotEmpty()
  @IsString()
  discountType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Fee Account ID' })
  @IsNotEmpty()
  @IsString()
  feeAccountId: string;

  @ApiProperty({ description: 'Payment ID to refund against' })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 5000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  refundAmount: number;

  @ApiProperty({ example: 'Withdrawal from course' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'ONLINE' })
  @IsOptional()
  @IsString()
  refundMode?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// PHASE 4: FEE INVOICE / DEMAND DTOs
// ──────────────────────────────────────────────────────────────────────────────

export enum FeeInvoiceStatusEnum {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class GenerateFeeInvoiceDto {
  @ApiProperty({ description: 'Student Fee Account ID', example: 'sfa-uuid-1' })
  @IsNotEmpty()
  @IsString()
  studentFeeAccountId: string;

  @ApiProperty({ description: 'Due Date for invoice payment (YYYY-MM-DD or ISO)', example: '2026-09-30' })
  @IsNotEmpty()
  @IsString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Invoice Date (defaults to current date)', example: '2026-08-16' })
  @IsOptional()
  @IsString()
  invoiceDate?: string;

  @ApiPropertyOptional({ enum: FeeInvoiceStatusEnum, default: FeeInvoiceStatusEnum.ISSUED })
  @IsOptional()
  @IsEnum(FeeInvoiceStatusEnum)
  status?: FeeInvoiceStatusEnum;

  @ApiPropertyOptional({ description: 'Selected Student Fee Item IDs to include (omit to include all outstanding items)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  feeItemIds?: string[];

  @ApiPropertyOptional({ description: 'Optional administrative remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateFeeInvoiceDto {
  @ApiPropertyOptional({ description: 'Updated Due Date (YYYY-MM-DD or ISO)' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Updated administrative remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CancelFeeInvoiceDto {
  @ApiProperty({ description: 'Reason for cancelling the fee demand/invoice', example: 'Incorrect category applied, reissue required' })
  @IsNotEmpty()
  @IsString()
  cancellationReason: string;
}

export class FeeInvoiceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by Invoice Number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by Student ID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Student Fee Account ID' })
  @IsOptional()
  @IsString()
  studentFeeAccountId?: string;

  @ApiPropertyOptional({ description: 'Filter by Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Filter by Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Program ID' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Filter by Semester ID' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Filter by Academic Year (e.g. 2026-27)' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ enum: FeeInvoiceStatusEnum })
  @IsOptional()
  @IsEnum(FeeInvoiceStatusEnum)
  status?: FeeInvoiceStatusEnum;

  @ApiPropertyOptional({ description: 'Search by Invoice Number, Student Name, or Enrollment Number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'From Date for invoice date filter' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To Date for invoice date filter' })
  @IsOptional()
  @IsString()
  toDate?: string;
}

// ─── PHASE 9: ADVANCED ACCOUNTS & RECONCILIATION DTOs ────────────────────────

export class BulkAssignFeePreviewDto {
  @ApiProperty({ example: 'structure-uuid' })
  @IsNotEmpty()
  @IsString()
  feeStructureId: string;

  @ApiPropertyOptional({ example: ['student-1', 'student-2'] })
  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @ApiPropertyOptional({ example: 'inst-1' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'dept-1' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'prog-1' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ example: 'sem-1' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ example: 'REGULAR' })
  @IsOptional()
  @IsString()
  studentType?: string;
}

export class BulkAssignFeeExecutionDto extends BulkAssignFeePreviewDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoGenerateInvoice?: boolean = false;
}

export enum ConcessionTypeEnum {
  MERIT_SCHOLARSHIP = 'MERIT_SCHOLARSHIP',
  NEED_BASED_CONCESSION = 'NEED_BASED_CONCESSION',
  SIBLING_DISCOUNT = 'SIBLING_DISCOUNT',
  STAFF_WARD = 'STAFF_WARD',
  SPECIAL_WAIVER = 'SPECIAL_WAIVER',
  GOVERNMENT_SCHOLARSHIP = 'GOVERNMENT_SCHOLARSHIP',
}

export class CreateConcessionDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiPropertyOptional({ example: 'account-uuid' })
  @IsOptional()
  @IsString()
  feeAccountId?: string;

  @ApiProperty({ enum: ConcessionTypeEnum, default: ConcessionTypeEnum.MERIT_SCHOLARSHIP })
  @IsNotEmpty()
  @IsEnum(ConcessionTypeEnum)
  concessionType: ConcessionTypeEnum;

  @ApiProperty({ example: 'FIXED', enum: ['FIXED', 'PERCENTAGE'] })
  @IsNotEmpty()
  @IsString()
  calculationType: 'FIXED' | 'PERCENTAGE';

  @ApiProperty({ example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiProperty({ example: 'Merit scholarship awarded for university entrance rank #1' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'NS/ACCOUNTS/2026/0045' })
  @IsOptional()
  @IsString()
  notesheetId?: string;
}

export class ApproveConcessionDto {
  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'] })
  @IsNotEmpty()
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Approved by Director of Finance' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ProcessRefundDto {
  @ApiProperty({ example: 'PROCESSED', enum: ['PROCESSED', 'COMPLETED', 'REJECTED'] })
  @IsNotEmpty()
  @IsString()
  status: 'PROCESSED' | 'COMPLETED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'REF-UTR-9988776655' })
  @IsOptional()
  @IsString()
  refundReference?: string;

  @ApiPropertyOptional({ example: 'Processed via ICICI corporate banking gateway' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReconciliationActionDto {
  @ApiProperty({ example: 'RECONCILED', enum: ['MATCHED', 'PENDING', 'MISMATCH', 'RECONCILED'] })
  @IsNotEmpty()
  @IsString()
  status: 'MATCHED' | 'PENDING' | 'MISMATCH' | 'RECONCILED';

  @ApiPropertyOptional({ example: 'Bank statement matched with transaction reference' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

