import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ExaminationSubjectItemDto,
  ExaminationFeeItemDto,
  ExaminationLateFeeRuleDto,
  ExaminationStatusEnum,
} from './create-examination.dto';

export class UpdateExaminationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  session?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formEndDate?: string;

  @ApiPropertyOptional({ enum: ExaminationStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
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
