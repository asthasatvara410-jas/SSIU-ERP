import { IsNotEmpty, IsString, IsArray, ValidateNested, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStepDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  stepNumber: number;

  @IsNotEmpty()
  @IsString()
  stepName: string;

  @IsNotEmpty()
  @IsString()
  requiredRoleCode: string;

  @IsNotEmpty()
  @IsInt()
  @Min(10)
  minAuthorityLevel: number;

  @IsNotEmpty()
  @IsString()
  dataScope: string;

  @IsNotEmpty()
  actionsAllowed: string | string[];

  @IsOptional()
  @IsInt()
  slaHours?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateWorkflowDefinitionDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  module: string;

  @IsNotEmpty()
  @IsString()
  requestType: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}
