import { IsNotEmpty, IsString, IsEmail, IsOptional, IsInt, IsDateString, IsDecimal } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'Employee Code is required.' })
  @IsString()
  employeeCode: string;

  @IsNotEmpty({ message: 'First name is required.' })
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsOptional()
  @IsString()
  employmentType?: string = 'FULL_TIME';

  @IsNotEmpty()
  @IsString()
  instituteId: string;

  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;
}

export class ApplyLeaveDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsNotEmpty()
  @IsString()
  leaveTypeId: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsInt()
  totalDays: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RecordAttendanceDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsDateString()
  attendanceDate: string;

  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  status?: string = 'PRESENT';

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateSalaryStructureDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  basicPay: number;

  @IsOptional()
  hra?: number;

  @IsOptional()
  da?: number;

  @IsOptional()
  specialAllow?: number;

  @IsOptional()
  pfDeduction?: number;

  @IsOptional()
  taxDeduction?: number;
}
