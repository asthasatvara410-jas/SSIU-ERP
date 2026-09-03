import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ManagementAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date filter (ISO format, e.g. 2026-01-01)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO format, e.g. 2026-12-31)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Filter by Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Filter by Department ID or Code' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
