import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamFormDto {
  @ApiProperty({ description: 'ID of the examination session (status must be FORM_OPEN)' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({ description: 'List of subject IDs selected by the student (defaults to all mandatory exam subjects if empty)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ description: 'Optional student remarks or notes' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
