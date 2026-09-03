import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ServiceRequestPriorityEnum {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ServiceRequestStatusEnum {
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_STUDENT = 'PENDING_STUDENT',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum ServiceRequestCategoryEnum {
  ACADEMIC = 'ACADEMIC',
  CERTIFICATE = 'CERTIFICATE',
  HOSTEL = 'HOSTEL',
  TRANSPORT = 'TRANSPORT',
  FINANCE = 'FINANCE',
  LIBRARY = 'LIBRARY',
  EXAMINATION = 'EXAMINATION',
  GENERAL = 'GENERAL',
  OTHER = 'OTHER',
}

export class ServiceRequestDocumentItemDto {
  @ApiProperty({ example: 'grade_sheet_sem3.pdf' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://cdn.ssiu.edu.in/services/sem3_grades.pdf' })
  @IsNotEmpty()
  @IsString()
  documentUrl: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: 1048576 })
  @IsOptional()
  @IsInt()
  fileSize?: number;
}

export class CreateServiceRequestDto {
  @ApiPropertyOptional({ example: 'srv-uuid-01' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: 'Request for Bonafide Certificate for Passport Renewal' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'I urgently need a Bonafide Certificate addressed to Regional Passport Office, Ahmedabad.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: ServiceRequestCategoryEnum, default: ServiceRequestCategoryEnum.CERTIFICATE })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ServiceRequestPriorityEnum, default: ServiceRequestPriorityEnum.NORMAL })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Passport application appointment on 25th Aug.' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ type: [ServiceRequestDocumentItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestDocumentItemDto)
  documents?: ServiceRequestDocumentItemDto[];
}

export class AssignServiceRequestDto {
  @ApiProperty({ example: 'usr-staff-uuid-01' })
  @IsNotEmpty()
  @IsString()
  assignedToUserId: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  assignedDepartmentId?: string;

  @ApiPropertyOptional({ example: 'Assigned for certificate verification and printing' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateServiceRequestStatusDto {
  @ApiProperty({ enum: ServiceRequestStatusEnum })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Verification completed, processing document print.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ResolveServiceRequestDto {
  @ApiProperty({ example: 'Bonafide certificate generated and ready for pickup at Student Section window #2.' })
  @IsNotEmpty()
  @IsString()
  resolution: string;

  @ApiPropertyOptional({ example: 'Student notified via SMS and email.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RejectServiceRequestDto {
  @ApiProperty({ example: 'Pending semester fee dues must be cleared before certificate issuance.' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;

  @ApiPropertyOptional({ example: 'Contact accounts desk for fee ledger clearance.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AddServiceRequestMessageDto {
  @ApiProperty({ example: 'Please provide your passport file reference number.' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/attachments/clarification.pdf' })
  @IsOptional()
  @IsString()
  attachments?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class ServiceRequestQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ServiceRequestStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ServiceRequestCategoryEnum })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ServiceRequestPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'usr-staff-id' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Passport' })
  @IsOptional()
  @IsString()
  search?: string;
}
