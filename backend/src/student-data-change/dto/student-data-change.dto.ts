import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsIn } from 'class-validator';

export enum DataChangeCategoryEnum {
  PERSONAL = 'PERSONAL',
  CONTACT = 'CONTACT',
  PARENT = 'PARENT',
  ACADEMIC = 'ACADEMIC',
  OTHER = 'OTHER',
}

export enum DataChangeStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  MENTOR_PENDING = 'MENTOR_PENDING',
  MENTOR_APPROVED = 'MENTOR_APPROVED',
  HOD_PENDING = 'HOD_PENDING',
  APPROVED = 'APPROVED',
  REJECTED_BY_MENTOR = 'REJECTED_BY_MENTOR',
  REJECTED_BY_HOD = 'REJECTED_BY_HOD',
  SENT_BACK = 'SENT_BACK',
  CANCELLED = 'CANCELLED',
}

export class CreateStudentDataChangeDto {
  @ApiProperty({ description: 'Technical field name to change, e.g. phone, address, bloodGroup' })
  @IsNotEmpty()
  @IsString()
  fieldName: string;

  @ApiProperty({ enum: DataChangeCategoryEnum, description: 'Category of field' })
  @IsNotEmpty()
  @IsEnum(DataChangeCategoryEnum)
  fieldCategory: DataChangeCategoryEnum;

  @ApiProperty({ description: 'Human-readable label for field, e.g. Mobile Number' })
  @IsNotEmpty()
  @IsString()
  fieldLabel: string;

  @ApiProperty({ description: 'Requested new value' })
  @IsNotEmpty()
  @IsString()
  newValue: string;

  @ApiProperty({ description: 'Justification and reason for the change' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Supporting document attachment URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: 'Attachment file name' })
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional({ description: 'Attachment file size string e.g. 1.2 MB' })
  @IsOptional()
  @IsString()
  attachmentSize?: string;
}

export class ReviewStudentDataChangeDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'SEND_BACK'], description: 'Action to perform' })
  @IsNotEmpty()
  @IsIn(['APPROVE', 'REJECT', 'SEND_BACK'])
  action: 'APPROVE' | 'REJECT' | 'SEND_BACK';

  @ApiPropertyOptional({ description: 'Review remarks (mandatory for REJECT and SEND_BACK)' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryStudentDataChangeDto {
  @ApiPropertyOptional({ description: 'Filter by request status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: DataChangeCategoryEnum, description: 'Filter by field category' })
  @IsOptional()
  @IsString()
  fieldCategory?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by mentor ID' })
  @IsOptional()
  @IsString()
  mentorId?: string;

  @ApiPropertyOptional({ description: 'Filter by HOD ID' })
  @IsOptional()
  @IsString()
  hodId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Search across requestNo, studentName, enrollment, field' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
