import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CheckPermissionDto {
  @IsNotEmpty({ message: 'Module is required.' })
  @IsString()
  module: string;

  @IsNotEmpty({ message: 'Action is required.' })
  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  resourceMeta?: {
    instituteId?: string;
    departmentId?: string;
    studentId?: string;
    facultyId?: string;
  };
}
