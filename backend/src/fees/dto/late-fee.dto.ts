import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LateFeeCalculationType {
  FIXED = 'FIXED',
  PER_DAY = 'PER_DAY',
  PERCENTAGE = 'PERCENTAGE',
  ONE_TIME = 'ONE_TIME',
}

export class CreateLateFeeRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @IsOptional()
  @IsString()
  feeHeadId?: string;

  @IsIn(['FIXED', 'PER_DAY', 'PERCENTAGE', 'ONE_TIME'])
  calculationType!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maximumAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  gracePeriodDays?: number = 0;

  @IsOptional()
  @IsBoolean()
  applyOnOutstanding?: boolean = false;
}

export class UpdateLateFeeRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @IsOptional()
  @IsString()
  feeHeadId?: string;

  @IsOptional()
  @IsIn(['FIXED', 'PER_DAY', 'PERCENTAGE', 'ONE_TIME'])
  calculationType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maximumAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  gracePeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  applyOnOutstanding?: boolean;
}

export class UpdateLateFeeRuleStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

export class LateFeeRuleQueryDto {
  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @IsOptional()
  @IsString()
  feeHeadId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;
}
