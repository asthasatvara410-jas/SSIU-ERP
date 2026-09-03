import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateExamFormDto {
  @ApiPropertyOptional({ description: 'Updated list of selected subject IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ description: 'Optional student remarks or notes' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
