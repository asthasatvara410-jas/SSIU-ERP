import { IsOptional, IsString, IsDateString, IsBoolean, IsInt } from 'class-validator';

export class CreateAcademicYearDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  yearCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  startYear?: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
