import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsArray, Min, Max } from 'class-validator';

export class CreateCourseOutcomeDto {
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  academicYear?: string;
}

export class UpdateCourseOutcomeDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: string;
}

export class CreateProgramOutcomeDto {
  @IsNotEmpty()
  @IsString()
  programId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateProgramSpecificOutcomeDto {
  @IsNotEmpty()
  @IsString()
  programId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class SetCOPOMappingDto {
  @IsNotEmpty()
  @IsString()
  coId: string;

  @IsNotEmpty()
  @IsString()
  poId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3)
  correlationLevel: number;
}

export class MatrixCellDto {
  @IsNotEmpty()
  @IsString()
  coId: string;

  @IsNotEmpty()
  @IsString()
  poId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3)
  correlationLevel: number;
}

export class BulkSetCOPOMatrixDto {
  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsNotEmpty()
  @IsArray()
  mappings: MatrixCellDto[];
}

export class SetCOPSOMappingDto {
  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsString()
  programSpecificOutcomeId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3)
  level: number;
}

export class SetAssessmentCOMapDto {
  @IsNotEmpty()
  @IsString()
  assessmentId: string;

  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  weight: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxMarks: number;
}

export class CalculateAttainmentDto {
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;
}

export class OverrideAttainmentDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['COURSE_CO', 'PROGRAM_PO'])
  targetType: string;

  @IsNotEmpty()
  @IsString()
  targetId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3)
  overrideLevel: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  overridePercentage: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CreateImprovementActionDto {
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsString()
  issue: string;

  @IsNotEmpty()
  @IsString()
  action: string;

  @IsNotEmpty()
  @IsString()
  owner: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class GenerateOBEReportDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['COURSE', 'PROGRAM', 'CO_PO_MATRIX', 'ATTAINMENT'])
  reportType: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;
}

export class PSOMatrixCellDto {
  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsString()
  programSpecificOutcomeId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3)
  level: number;
}

export class BulkSetCOPSOMatrixDto {
  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsNotEmpty()
  @IsArray()
  mappings: PSOMatrixCellDto[];
}

export class AssessmentMapItemDto {
  @IsNotEmpty()
  @IsString()
  assessmentId: string;

  @IsNotEmpty()
  @IsString()
  courseOutcomeId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  weight: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxMarks: number;
}

export class BulkSetAssessmentCOMapDto {
  @IsNotEmpty()
  @IsArray()
  mappings: AssessmentMapItemDto[];
}

export class UpdateImprovementActionStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED'])
  status: string;
}

