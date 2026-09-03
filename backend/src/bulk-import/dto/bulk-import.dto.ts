import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export enum BulkImportTypeEnum {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  STAFF = 'STAFF',
  SUBJECT = 'SUBJECT',
  EXAM_FORM = 'EXAM_FORM',
  MARKS = 'MARKS',
  HOSTEL_STUDENT = 'HOSTEL_STUDENT',
  HOSTEL_ROOM = 'HOSTEL_ROOM',
  FEE_ASSIGNMENT = 'FEE_ASSIGNMENT',
  TRANSPORT_VEHICLE = 'TRANSPORT_VEHICLE',
  TRANSPORT_DRIVER = 'TRANSPORT_DRIVER',
  TRANSPORT_ROUTE = 'TRANSPORT_ROUTE',
}

export enum BulkImportModeEnum {
  INSERT_ONLY = 'INSERT_ONLY',
  UPSERT = 'UPSERT',
}

export class UploadBulkImportDto {
  @ApiProperty({ enum: BulkImportTypeEnum, example: 'STUDENT' })
  @IsNotEmpty()
  @IsEnum(BulkImportTypeEnum)
  importType: string;

  @ApiProperty({ example: 'students_batch_2026.xlsx' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ description: 'Base64 encoded file content or parsed row array' })
  @IsOptional()
  fileBase64?: string;

  @ApiPropertyOptional({ description: 'Pre-parsed rows from client if uploaded via JSON' })
  @IsOptional()
  @IsArray()
  rows?: any[];

  @ApiPropertyOptional({ example: 'inst-01' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'dept-cse' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: '{"academicYear": "2026-27", "examId": "exam-summer-2026"}' })
  @IsOptional()
  metadata?: any;
}

export class ValidateBulkImportDto {
  @ApiPropertyOptional({ enum: BulkImportModeEnum, default: 'INSERT_ONLY' })
  @IsOptional()
  @IsEnum(BulkImportModeEnum)
  importMode?: string;
}

export class ConfirmBulkImportDto {
  @ApiPropertyOptional({ enum: BulkImportModeEnum, default: 'INSERT_ONLY' })
  @IsOptional()
  @IsEnum(BulkImportModeEnum)
  importMode?: string;

  @ApiPropertyOptional({ description: 'List of specific valid row numbers to import (omit for all valid)' })
  @IsOptional()
  @IsArray()
  selectedRowNumbers?: number[];
}

export class BulkImportFilterDto {
  @ApiPropertyOptional({ enum: BulkImportTypeEnum })
  @IsOptional()
  importType?: string;

  @ApiPropertyOptional({ example: 'READY' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
