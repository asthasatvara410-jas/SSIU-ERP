import { IsNotEmpty, IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty({ message: 'Enrollment Number is required.' })
  @IsString()
  enrollmentNo: string;

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
  gender?: string;

  @IsNotEmpty({ message: 'Institute ID is required.' })
  @IsString()
  instituteId: string;

  @IsNotEmpty({ message: 'Department ID is required.' })
  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsNotEmpty({ message: 'Batch ID is required.' })
  @IsString()
  batchId: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;

  @IsOptional()
  @IsString()
  divisionId?: string;

  @IsOptional()
  @IsString()
  currentDivisionId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'ALUMNI', 'DROPPED', 'WITHDRAWN'])
  status?: string = 'ACTIVE';
}
