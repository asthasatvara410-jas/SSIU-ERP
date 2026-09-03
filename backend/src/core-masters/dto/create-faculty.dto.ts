import { IsNotEmpty, IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateFacultyDto {
  @IsNotEmpty({ message: 'Employee Code is required.' })
  @IsString()
  employeeCode: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty({ message: 'Email address is required.' })
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string = 'Assistant Professor';

  @IsNotEmpty({ message: 'Institute ID is required.' })
  @IsString()
  instituteId: string;

  @IsNotEmpty({ message: 'Department ID is required.' })
  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'ON_LEAVE', 'TRANSFERRED', 'RESIGNED', 'RETIRED', 'INACTIVE'])
  status?: string = 'ACTIVE';
}
