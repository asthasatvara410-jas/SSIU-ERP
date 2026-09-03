import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum TransferReasonEnum {
  LEAVE = 'LEAVE',
  VACATION = 'VACATION',
  WEEK_OFF = 'WEEK_OFF',
  OFFICIAL_DUTY = 'OFFICIAL_DUTY',
  UNAVAILABLE = 'UNAVAILABLE',
  TEMPORARY_ASSIGNMENT = 'TEMPORARY_ASSIGNMENT',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export class CreateWorkTransferDto {
  @ApiProperty({ description: 'Recipient User ID' })
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({ description: 'Transfer Start Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty({ description: 'Transfer End Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @ApiProperty({ enum: TransferReasonEnum, description: 'Absence Reason' })
  @IsEnum(TransferReasonEnum)
  reason: TransferReasonEnum;

  @ApiPropertyOptional({ description: 'Optional justification remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ description: 'Array of Work Item IDs being transferred', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  workItemIds: string[];
}

export class WorkTransferQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by Reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Filter by Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter start date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
