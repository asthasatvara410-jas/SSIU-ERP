import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExaminationTypeEnum {
  REGULAR = 'Regular',
  BACKLOG = 'Backlog',
  SUPPLEMENTARY = 'Supplementary',
  REMEDIAL = 'Remedial',
  RE_EXAMINATION = 'Re-Examination',
  IMPROVEMENT = 'Improvement',
  SPECIAL_EXAMINATION = 'Special Examination',
  OTHER = 'Other',
}

export enum ExaminationStatusEnum {
  DRAFT = 'DRAFT',
  FORM_OPEN = 'FORM_OPEN',
  FORM_CLOSED = 'FORM_CLOSED',
  SCHEDULED = 'SCHEDULED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  RESULT_PROCESSING = 'RESULT_PROCESSING',
  RESULT_PUBLISHED = 'RESULT_PUBLISHED',
  CANCELLED = 'CANCELLED',
}

export enum ExamModeEnum {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  OTHER = 'OTHER',
}

export enum LateFeeCalculationTypeEnum {
  FIXED = 'FIXED',
  PER_DAY = 'PER_DAY',
  PERCENTAGE = 'PERCENTAGE',
}

export class ExaminationSubjectItemDto {
  @ApiProperty({ description: 'Subject ID (existing Subject in academic structure)' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ example: 'REGULAR' })
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiPropertyOptional({ example: '2026-11-05' })
  @IsOptional()
  @IsString()
  examDate?: string;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumMarks?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  internalMarks?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  externalMarks?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credits?: number;

  @ApiPropertyOptional({ enum: ExamModeEnum, default: ExamModeEnum.OFFLINE })
  @IsOptional()
  @IsEnum(ExamModeEnum)
  examMode?: ExamModeEnum;

  @ApiPropertyOptional({ default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ExaminationFeeItemDto {
  @ApiProperty({ example: 'REGULAR', description: 'Exam Type: REGULAR, BACKLOG, SUPPLEMENTARY, REMEDIAL, RE_EXAM, IMPROVEMENT, SPECIAL' })
  @IsNotEmpty()
  @IsString()
  examType: string;

  @ApiProperty({ example: 2500, description: 'Fee Amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Exam fee cannot be negative' })
  amount: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class ExaminationLateFeeRuleDto {
  @ApiPropertyOptional({ enum: LateFeeCalculationTypeEnum, default: LateFeeCalculationTypeEnum.FIXED })
  @IsOptional()
  @IsEnum(LateFeeCalculationTypeEnum)
  calculationType?: LateFeeCalculationTypeEnum;

  @ApiProperty({ example: 500, description: 'Late Fee Amount or Rate' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Late fee amount cannot be negative' })
  amount: number;

  @ApiPropertyOptional({ example: 2000, description: 'Maximum Late Fee Cap' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Maximum late fee cannot be negative' })
  maximumAmount?: number;

  @ApiPropertyOptional({ example: 2, description: 'Grace Period in Days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateExaminationDto {
  @ApiPropertyOptional({ example: 'EXAM-2026-CSE-SEM4-REG' })
  @IsOptional()
  @IsString()
  examCode?: string;

  @ApiProperty({ example: 'B.Tech CSE Semester-4 Summer 2026 Regular Examination' })
  @IsNotEmpty({ message: 'Examination Name is required' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Regular', description: 'Regular, Backlog, Supplementary, Remedial, Re-Examination, Improvement, Special Examination, Other' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Program ID' })
  @IsNotEmpty({ message: 'Program ID is required' })
  @IsString()
  programId: string;

  @ApiPropertyOptional({ description: 'Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Academic Year ID' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ description: 'Semester ID' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional({ example: 'Summer 2026' })
  @IsOptional()
  @IsString()
  session?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-20' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  formStartDate?: string;

  @ApiPropertyOptional({ example: '2026-09-20' })
  @IsOptional()
  @IsString()
  formEndDate?: string;

  @ApiPropertyOptional({ enum: ExaminationStatusEnum, default: ExaminationStatusEnum.DRAFT })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'End semester regular theory and practical evaluation for Batch 2024-2028.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Candidates must bring valid University ID and Hall Ticket.' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Optional Phase 1 NoteSheet ID' })
  @IsOptional()
  @IsString()
  notesheetId?: string;

  @ApiPropertyOptional({ type: [ExaminationSubjectItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationSubjectItemDto)
  subjects?: ExaminationSubjectItemDto[];

  @ApiPropertyOptional({ type: [ExaminationFeeItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationFeeItemDto)
  fees?: ExaminationFeeItemDto[];

  @ApiPropertyOptional({ type: ExaminationLateFeeRuleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExaminationLateFeeRuleDto)
  lateFeeRule?: ExaminationLateFeeRuleDto;
}
