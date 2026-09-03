import { IsBoolean, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitExamFormDto {
  @ApiProperty({ description: 'Student confirmation declaration stating information and subject choices are correct' })
  @IsBoolean()
  declarationAccepted: boolean;

  @ApiPropertyOptional({ description: 'Optional submission remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Legacy: Exam ID' })
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiPropertyOptional({ description: 'Legacy: Exam Form Window ID' })
  @IsOptional()
  @IsString()
  examFormWindowId?: string;

  @ApiPropertyOptional({ description: 'Legacy: Semester ID' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  attemptNumber?: number;
}
