import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FrameworkCreateDto {
  @ApiProperty({ description: 'Accreditation Framework Name', enum: ['NAAC', 'NBA'], example: 'NAAC' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['NAAC', 'NBA'])
  name!: string;

  @ApiPropertyOptional({ description: 'Framework manual / guidelines version', example: 'v2026.1' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Applicable academic year range', example: '2021-22 to 2025-26' })
  @IsOptional()
  @IsString()
  academicYearRange?: string;
}

export class AggregateRequestDto {
  @ApiProperty({ description: 'Accreditation Framework to aggregate data for', enum: ['NAAC', 'NBA'], example: 'NAAC' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['NAAC', 'NBA'])
  framework!: string;

  @ApiPropertyOptional({ description: 'Starting academic year of aggregation cycle', example: '2021-22' })
  @IsOptional()
  @IsString()
  academicYearFrom?: string;

  @ApiPropertyOptional({ description: 'Ending academic year of aggregation cycle', example: '2025-26' })
  @IsOptional()
  @IsString()
  academicYearTo?: string;

  @ApiPropertyOptional({ description: 'Optional list of explicit academic years to aggregate', example: ['2023-24', '2024-25', '2025-26'] })
  @IsOptional()
  academicYears?: string[];

  @ApiPropertyOptional({ description: 'Optional Institute ID boundary' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Optional Department ID boundary' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Optional Program ID boundary' })
  @IsOptional()
  @IsString()
  programId?: string;
}

export class ValidationRequestDto {
  @ApiProperty({ description: 'Accreditation Framework to validate data for', enum: ['NAAC', 'NBA'], example: 'NAAC' })
  @IsNotEmpty()
  @IsString()
  framework!: string;

  @ApiPropertyOptional({ description: 'Optional single academic year to validate', example: '2025-26' })
  @IsOptional()
  @IsString()
  academicYear?: string;
}

export class EvidenceCreateDto {
  @ApiProperty({ description: 'Framework e.g. NAAC or NBA', enum: ['NAAC', 'NBA'], example: 'NAAC' })
  @IsNotEmpty()
  @IsString()
  framework!: string;

  @ApiProperty({ description: 'Criterion Code e.g. CR1, CR2, NBA-C1', example: 'CR1' })
  @IsNotEmpty()
  @IsString()
  criterionCode!: string;

  @ApiProperty({ description: 'Title or descriptive summary of the evidence document', example: 'BOS Minutes of Curriculum Revision 2024-25' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Additional description or notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Associated metric ID if directly mapping to a sub-metric' })
  @IsOptional()
  @IsString()
  metricId?: string;

  @ApiPropertyOptional({ description: 'Document ID from institutional DMS' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Academic year to which evidence applies', example: '2024-25' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: 'Format of evidence', enum: ['PDF', 'DOC', 'XLSX', 'IMAGE', 'LINK', 'ERP_RECORD', 'DIGILOCKER_DOCUMENT', 'DMS_DOCUMENT'], default: 'PDF' })
  @IsOptional()
  @IsString()
  evidenceType?: string;

  @ApiPropertyOptional({ description: 'Source module', enum: ['DMS', 'DIGILOCKER', 'ERP', 'OBE'], default: 'DMS' })
  @IsOptional()
  @IsString()
  sourceModule?: string;

  @ApiPropertyOptional({ description: 'Referenced ERP or OBE source record ID' })
  @IsOptional()
  @IsString()
  sourceRecordId?: string;

  @ApiPropertyOptional({ description: 'Department ID scope' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Program ID scope' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Direct file URL or external repository link' })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class EvidenceVerifyDto {
  @ApiPropertyOptional({ description: 'Optional verification remarks/notes' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class EvidenceRejectDto {
  @ApiProperty({ description: 'Reason for evidence rejection', example: 'Document date does not match academic year 2024-25' })
  @IsNotEmpty()
  @IsString()
  rejectionReason!: string;
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Accreditation Framework', enum: ['NAAC', 'NBA'], example: 'NAAC' })
  @IsNotEmpty()
  @IsString()
  framework!: string;

  @ApiPropertyOptional({ description: 'Evaluation 5-year cycle range', example: '2021-22 to 2025-26' })
  @IsOptional()
  @IsString()
  academicYearRange?: string;

  @ApiPropertyOptional({ description: 'Institute ID filter' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Output document format', enum: ['PDF', 'EXCEL'], default: 'PDF' })
  @IsOptional()
  @IsString()
  @IsIn(['PDF', 'EXCEL'])
  outputFormat?: string;
}

export class FinalizeReportDto {
  @ApiPropertyOptional({ description: 'Finalization remarks or approval sign-off note' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
