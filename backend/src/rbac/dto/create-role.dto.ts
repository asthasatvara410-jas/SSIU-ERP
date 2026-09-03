import { IsNotEmpty, IsString, IsInt, Min, Max, IsIn, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Role code is required.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Role name is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Authority level is required.' })
  @IsInt()
  @Min(1)
  @Max(100)
  authorityLevel: number;

  @IsNotEmpty({ message: 'Data scope is required.' })
  @IsIn(['OWN', 'ASSIGNED', 'DEPARTMENT', 'INSTITUTE', 'UNIVERSITY'], {
    message: 'Data scope must be one of: OWN, ASSIGNED, DEPARTMENT, INSTITUTE, UNIVERSITY',
  })
  dataScope: string;
}
