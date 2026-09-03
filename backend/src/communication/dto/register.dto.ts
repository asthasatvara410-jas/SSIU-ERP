import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum InwardStatusEnum {
  RECEIVED = 'RECEIVED',
  UNDER_PROCESS = 'UNDER_PROCESS',
  FORWARDED = 'FORWARDED',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  // legacy compatibility
  ASSIGNED = 'ASSIGNED',
  IN_PROCESS = 'IN_PROCESS',
  REPLIED = 'REPLIED',
  ARCHIVED = 'ARCHIVED',
}

export enum OutwardStatusEnum {
  DRAFT = 'DRAFT',
  READY = 'READY',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  // legacy compatibility
  PREPARED = 'PREPARED',
  IN_TRANSIT = 'IN_TRANSIT',
  CLOSED = 'CLOSED',
}

export enum DocumentTypeEnum {
  LETTER = 'LETTER',
  CIRCULAR = 'CIRCULAR',
  NOTICE = 'NOTICE',
  APPLICATION = 'APPLICATION',
  GOVERNMENT_COMMUNICATION = 'GOVERNMENT_COMMUNICATION',
  UNIVERSITY_COMMUNICATION = 'UNIVERSITY_COMMUNICATION',
  INVOICE = 'INVOICE',
  LEGAL_DOCUMENT = 'LEGAL_DOCUMENT',
  ACADEMIC_DOCUMENT = 'ACADEMIC_DOCUMENT',
  OTHER = 'OTHER',
}

export enum RegisterPriorityEnum {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RegisterModeEnum {
  POST = 'POST',
  COURIER = 'COURIER',
  EMAIL = 'EMAIL',
  HAND_DELIVERY = 'HAND_DELIVERY',
  SPEED_POST = 'SPEED_POST',
  REGISTERED_POST = 'REGISTERED_POST',
  OTHER = 'OTHER',
}

export enum DeliveryStatusEnum {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  LOST = 'LOST',
}

// ── Inward DTOs ─────────────────────────────────────────────────────────────

export class CreateInwardRegisterDto {
  @ApiPropertyOptional({ example: 'INW/2026/000001' })
  @IsOptional()
  @IsString()
  registerNo?: string;

  @ApiPropertyOptional({ example: 'INW/2026/000001' })
  @IsOptional()
  @IsString()
  inwardNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  receiptDate?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  receivedDate?: string;

  @ApiProperty({ example: 'Prof. Ramesh Patel' })
  @IsNotEmpty()
  @IsString()
  senderName: string;

  @ApiPropertyOptional({ example: 'Prof. Ramesh Patel' })
  @IsOptional()
  @IsString()
  receivedFrom?: string;

  @ApiPropertyOptional({ example: 'Department of Higher & Technical Education, Gandhinagar' })
  @IsOptional()
  @IsString()
  senderOrganization?: string;

  @ApiPropertyOptional({ example: 'Department of Higher & Technical Education, Gandhinagar' })
  @IsOptional()
  @IsString()
  organizationOrPerson?: string;

  @ApiPropertyOptional({ example: 'dhte.gujarat@gov.in' })
  @IsOptional()
  @IsString()
  senderEmail?: string;

  @ApiPropertyOptional({ example: '079-23250000' })
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiPropertyOptional({ example: 'DHTE/UNI/2026/9088' })
  @IsOptional()
  @IsString()
  letterNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @IsString()
  letterDate?: string;

  @ApiProperty({ example: 'NOC for Introduction of New AI & Data Science Degree Program' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiPropertyOptional({ example: 'Official government communication concerning curriculum alignment and seat capacity approval.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentTypeEnum, default: DocumentTypeEnum.LETTER })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum, default: RegisterModeEnum.POST })
  @IsOptional()
  @IsString()
  receivedThrough?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum, default: RegisterModeEnum.POST })
  @IsOptional()
  @IsString()
  modeOfReceipt?: string;

  @ApiPropertyOptional({ enum: RegisterPriorityEnum, default: RegisterPriorityEnum.NORMAL })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'user-hod-id' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ example: '2026-08-25' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/inward/noc_letter.pdf' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'noc_letter.pdf' })
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional({ example: 2048500 })
  @IsOptional()
  @IsNumber()
  documentSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  documentTypeMime?: string;

  @ApiPropertyOptional({ example: 'Urgent compliance required within 10 days.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: 'NS/ADMIN/2026/0045' })
  @IsOptional()
  @IsString()
  notesheetId?: string;
}

export class UpdateInwardRegisterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receivedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receivedFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderOrganization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationOrPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  letterNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  letterDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentTypeEnum })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum })
  @IsOptional()
  @IsString()
  receivedThrough?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum })
  @IsOptional()
  @IsString()
  modeOfReceipt?: string;

  @ApiPropertyOptional({ enum: RegisterPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: InwardStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  documentSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentTypeMime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notesheetId?: string;
}

export class InwardForwardDto {
  @ApiPropertyOptional({ example: 'REGISTRAR_OFFICE' })
  @IsOptional()
  @IsString()
  forwardedToOffice?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  forwardedToDepartmentId?: string;

  @ApiPropertyOptional({ example: 'user-hod-id' })
  @IsOptional()
  @IsString()
  forwardedToUserId?: string;

  @ApiProperty({ example: 'Prepare compliance verification report' })
  @IsNotEmpty()
  @IsString()
  actionRequired: string;

  @ApiPropertyOptional({ example: '2026-08-25' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Coordinate with academic committee for syllabus sign-off.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class InwardActionDto {
  @ApiProperty({ example: 'Compliance report finalized and submitted to Registrar Office.' })
  @IsNotEmpty()
  @IsString()
  actionTaken: string;

  @ApiPropertyOptional({ example: 'Ready for official dispatch to DHTE.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ enum: InwardStatusEnum, default: InwardStatusEnum.COMPLETED })
  @IsOptional()
  @IsString()
  status?: string;
}

export class InwardStatusUpdateDto {
  @ApiProperty({ enum: InwardStatusEnum, example: InwardStatusEnum.UNDER_PROCESS })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Forwarded to Dean Academics for drafting reply.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: 'user-dean-id' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;
}

export class InwardQueryDto {
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

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ enum: InwardStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: RegisterPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum })
  @IsOptional()
  @IsString()
  receivedThrough?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'NOC' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ── Outward DTOs ────────────────────────────────────────────────────────────

export class CreateOutwardRegisterDto {
  @ApiPropertyOptional({ example: 'OUT/2026/000001' })
  @IsOptional()
  @IsString()
  dispatchNo?: string;

  @ApiPropertyOptional({ example: 'OUT/2026/000001' })
  @IsOptional()
  @IsString()
  outwardNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  dispatchDate?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  letterDate?: string;

  @ApiProperty({ example: 'Registrar, Gujarat Technological University' })
  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @ApiPropertyOptional({ example: 'Registrar, Gujarat Technological University' })
  @IsOptional()
  @IsString()
  sentTo?: string;

  @ApiPropertyOptional({ example: 'GTU Campus, Chandkheda, Ahmedabad' })
  @IsOptional()
  @IsString()
  receiverOrganization?: string;

  @ApiPropertyOptional({ example: 'GTU Campus, Chandkheda, Ahmedabad' })
  @IsOptional()
  @IsString()
  organizationOrPerson?: string;

  @ApiPropertyOptional({ example: 'Nr. Visat Three Roads, Sabarmati-Koba Highway, Chandkheda, Ahmedabad, Gujarat 382424' })
  @IsOptional()
  @IsString()
  receiverAddress?: string;

  @ApiPropertyOptional({ example: 'Nr. Visat Three Roads, Sabarmati-Koba Highway, Chandkheda, Ahmedabad, Gujarat 382424' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'registrar@gtu.ac.in' })
  @IsOptional()
  @IsString()
  receiverEmail?: string;

  @ApiPropertyOptional({ example: 'registrar@gtu.ac.in' })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiPropertyOptional({ example: '079-23267500' })
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiProperty({ example: 'Submission of Annual Quality Assurance Report (AQAR) 2025-26' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiPropertyOptional({ example: 'SSIU/REG/AQAR/2026/089' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ enum: DocumentTypeEnum, default: DocumentTypeEnum.LETTER })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ example: 'dept-iqac-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum, default: RegisterModeEnum.COURIER })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum, default: RegisterModeEnum.COURIER })
  @IsOptional()
  @IsString()
  modeOfDispatch?: string;

  @ApiPropertyOptional({ example: 'EG123456789IN' })
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @ApiPropertyOptional({ example: 'EG123456789IN' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'India Post Speed Post' })
  @IsOptional()
  @IsString()
  courierService?: string;

  @ApiPropertyOptional({ example: 'India Post Speed Post' })
  @IsOptional()
  @IsString()
  courierAgency?: string;

  @ApiPropertyOptional({ enum: RegisterPriorityEnum, default: RegisterPriorityEnum.NORMAL })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: OutwardStatusEnum, default: OutwardStatusEnum.DRAFT })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-08-22' })
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/outward/aqar_report.pdf' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'aqar_report.pdf' })
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional({ example: 'Official AQAR submission packet.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: 'NS/ADMIN/2026/0078' })
  @IsOptional()
  @IsString()
  notesheetId?: string;
}

export class UpdateOutwardRegisterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dispatchDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  letterDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sentTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverOrganization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationOrPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ enum: DocumentTypeEnum })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum })
  @IsOptional()
  @IsString()
  modeOfDispatch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courierService?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courierAgency?: string;

  @ApiPropertyOptional({ enum: RegisterPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: OutwardStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveredDate?: string;

  @ApiPropertyOptional({ enum: DeliveryStatusEnum })
  @IsOptional()
  @IsString()
  deliveryStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notesheetId?: string;
}

export class OutwardDispatchDto {
  @ApiProperty({ example: 'India Post Speed Post' })
  @IsNotEmpty()
  @IsString()
  courierService: string;

  @ApiPropertyOptional({ example: 'EG123456789IN' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  dispatchDate?: string;

  @ApiPropertyOptional({ example: '2026-08-22' })
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ example: 'Dispatched through university central dispatch desk.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class OutwardDeliveryDto {
  @ApiPropertyOptional({ example: '2026-08-21' })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 'Delivered and acknowledged by GTU Inward Department.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class OutwardReturnDto {
  @ApiProperty({ example: 'Addressee moved / Incorrect premise address provided.' })
  @IsNotEmpty()
  @IsString()
  returnReason: string;

  @ApiPropertyOptional({ example: 'Returned package deposited in University Central Registry.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class OutwardStatusUpdateDto {
  @ApiProperty({ enum: OutwardStatusEnum, example: OutwardStatusEnum.DISPATCHED })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'EG123456789IN' })
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @ApiPropertyOptional({ example: 'India Post Speed Post' })
  @IsOptional()
  @IsString()
  courierAgency?: string;

  @ApiPropertyOptional({ example: 'India Post Speed Post' })
  @IsOptional()
  @IsString()
  courierService?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  deliveredDate?: string;

  @ApiPropertyOptional({ example: 'Consignment handed over to postal staff.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class OutwardQueryDto {
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

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ enum: OutwardStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: RegisterPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: RegisterModeEnum })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'AQAR' })
  @IsOptional()
  @IsString()
  search?: string;
}
