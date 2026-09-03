import { IsArray, IsString, IsOptional } from 'class-validator';

export class AssignPermissionsDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsArray({ message: 'permissionIds must be an array of string permission IDs.' })
  @IsString({ each: true })
  permissionIds: string[];
}
