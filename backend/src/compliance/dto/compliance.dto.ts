import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';

export class CreateCOAssessmentMappingDto {
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsString()
  assessmentType: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maximumMarks?: number;
}

export class CalculateCOAttainmentDto {
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsString()
  academicYear: string;

  @IsNotEmpty()
  @IsNumber()
  semester: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  target?: number;

  @IsOptional()
  @IsNumber()
  directWeight?: number;

  @IsOptional()
  @IsNumber()
  indirectWeight?: number;
}

export class AttainmentOverrideDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['CO_ATTAINMENT', 'PO_ATTAINMENT', 'PSO_ATTAINMENT'])
  entityType: string;

  @IsNotEmpty()
  @IsString()
  entityId: string;

  @IsNotEmpty()
  @IsNumber()
  originalValue: number;

  @IsNotEmpty()
  @IsNumber()
  overrideValue: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CreateNEPIndicatorDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  target?: number;
}

export class CreateSnapshotDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['NAAC', 'NBA', 'NEP', 'OBE'])
  framework: string;

  @IsNotEmpty()
  @IsString()
  academicYear: string;
}
