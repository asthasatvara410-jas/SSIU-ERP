import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  authorityLevel?: number;

  @IsOptional()
  @IsIn(['OWN', 'ASSIGNED', 'DEPARTMENT', 'INSTITUTE', 'UNIVERSITY'])
  dataScope?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
