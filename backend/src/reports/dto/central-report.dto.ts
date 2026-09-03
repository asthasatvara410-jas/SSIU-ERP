import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ReportModuleEnum {
  WORK_DIARY = 'WORK_DIARY',
  EXAMINATION = 'EXAMINATION',
  RESULTS = 'RESULTS',
  ADMISSION = 'ADMISSION',
  INWARD = 'INWARD',
  OUTWARD = 'OUTWARD',
  HOSTEL_VISITOR = 'HOSTEL_VISITOR',
  TRANSPORT = 'TRANSPORT',
  CAMPUS_SERVICES = 'CAMPUS_SERVICES',
  EDP_DUTY = 'EDP_DUTY',
  STUDENTS = 'STUDENTS',
  FACULTY = 'FACULTY',
  FEES = 'FEES',
}

export enum ReportTypeEnum {
  SINGLE_RECORD = 'SINGLE_RECORD',
  DATE_WISE = 'DATE_WISE',
  DEPARTMENT_WISE = 'DEPARTMENT_WISE',
  INSTITUTE_WISE = 'INSTITUTE_WISE',
  USER_WISE = 'USER_WISE',
  STATUS_WISE = 'STATUS_WISE',
  FILTER_WISE = 'FILTER_WISE',
  DASHBOARD_SUMMARY = 'DASHBOARD_SUMMARY',
}

export enum ReportExportFormatEnum {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  HTML_PRINT = 'HTML_PRINT',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportModuleEnum, example: ReportModuleEnum.WORK_DIARY })
  @IsNotEmpty()
  @IsString()
  module: string;

  @ApiProperty({ enum: ReportTypeEnum, example: ReportTypeEnum.FILTER_WISE })
  @IsNotEmpty()
  @IsString()
  reportType: string;

  @ApiPropertyOptional({ enum: ReportExportFormatEnum, default: ReportExportFormatEnum.JSON })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ example: 'record-uuid-01' })
  @IsOptional()
  @IsString()
  recordId?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'usr-faculty-id' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'stu-id-01' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'SUBMITTED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'DBMS' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
