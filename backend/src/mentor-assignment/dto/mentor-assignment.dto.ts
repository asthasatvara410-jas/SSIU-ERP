import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignMentorDto {
  @ApiProperty({ description: 'Student ID or Enrollment Number' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Faculty Member ID to assign as Mentor' })
  @IsString()
  @IsNotEmpty()
  mentorFacultyId: string;

  @ApiPropertyOptional({ description: 'Effective start date for mentorship (ISO Date)' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Mandatory reason when changing an existing active mentor' })
  @IsOptional()
  @IsString()
  changeReason?: string;

  @ApiPropertyOptional({ description: 'Explicit confirmation flag to reassign an existing mentor' })
  @IsOptional()
  @IsBoolean()
  isChange?: boolean;
}

export class ChangeMentorDto {
  @ApiProperty({ description: 'New Faculty Member ID to assign as Mentor' })
  @IsString()
  @IsNotEmpty()
  newMentorFacultyId: string;

  @ApiProperty({ description: 'Mandatory reason for changing the mentor' })
  @IsString()
  @IsNotEmpty()
  changeReason: string;

  @ApiPropertyOptional({ description: 'Effective start date (ISO Date)' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}

export class RemoveMentorDto {
  @ApiProperty({ description: 'Mandatory reason for removing the mentor assignment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class MentorQueryDto {
  @ApiPropertyOptional({ description: 'Institute ID filter' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Program ID filter' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Semester ID filter' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Status filter', enum: ['ALL', 'ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ description: 'Mentor Faculty ID filter' })
  @IsOptional()
  @IsString()
  mentorFacultyId?: string;

  @ApiPropertyOptional({ description: 'Search term for student name/enrollment or mentor name' })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Page limit', default: 20 })
  @IsOptional()
  limit?: number;
}

export class BulkMentorUploadRowDto {
  @ApiProperty({ description: 'Student Enrollment Number' })
  @IsString()
  @IsNotEmpty()
  studentEnrollmentNo: string;

  @ApiProperty({ description: 'Mentor Faculty Employee ID' })
  @IsString()
  @IsNotEmpty()
  mentorEmployeeId: string;

  @ApiPropertyOptional({ description: 'Department Code' })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ description: 'Program Code' })
  @IsOptional()
  @IsString()
  programCode?: string;

  @ApiPropertyOptional({ description: 'Semester' })
  @IsOptional()
  semester?: string | number;

  @ApiPropertyOptional({ description: 'Section / Division' })
  @IsOptional()
  @IsString()
  section?: string;
}

export class BulkMentorCommitDto {
  @ApiProperty({ description: 'List of validated rows to commit', type: [BulkMentorUploadRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMentorUploadRowDto)
  rows: BulkMentorUploadRowDto[];

  @ApiPropertyOptional({ description: 'Optional remarks / change reason for bulk assignment' })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
