import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class AssignUserRoleDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty({ message: 'Role ID is required.' })
  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  scopeType?: string;

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
