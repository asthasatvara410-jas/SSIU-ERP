import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export enum MaintenanceCategoryEnum {
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  FURNITURE = 'FURNITURE',
  AC_FAN = 'AC_FAN',
  WATER = 'WATER',
  CLEANING = 'CLEANING',
  INTERNET = 'INTERNET',
  ROOM = 'ROOM',
  WASHROOM = 'WASHROOM',
  COMMON_AREA = 'COMMON_AREA',
  OTHER = 'OTHER',
}

export enum MaintenancePriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceStatusEnum {
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  REOPENED = 'REOPENED',
}

export class CreateMaintenanceRequestDto {
  @ApiPropertyOptional({ example: 'stud-01', description: 'Student ID (defaults to logged-in student)' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: 'hst-01', description: 'Hostel ID' })
  @IsNotEmpty()
  @IsString()
  hostelId: string;

  @ApiPropertyOptional({ example: 'room-01', description: 'Room ID' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ enum: MaintenanceCategoryEnum, example: MaintenanceCategoryEnum.ELECTRICAL })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'Ceiling fan making vibrating noise' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'The fan in room 204 has a loose blade and operates intermittently.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: MaintenancePriorityEnum, default: MaintenancePriorityEnum.MEDIUM })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'https://storage.university.edu/photos/fan-issue.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class AssignMaintenanceDto {
  @ApiProperty({ example: 'staff-01', description: 'Maintenance Staff User ID' })
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar (Electrician)' })
  @IsOptional()
  @IsString()
  staffName?: string;

  @ApiPropertyOptional({ enum: MaintenancePriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '2026-08-20T18:00:00Z' })
  @IsOptional()
  @IsString()
  expectedCompletionDate?: string;

  @ApiPropertyOptional({ example: 'Assigned to senior electrician for priority fix' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class HoldMaintenanceDto {
  @ApiProperty({ example: 'Awaiting replacement capacitor delivery from vendor' })
  @IsNotEmpty()
  @IsString()
  holdReason: string;
}

export class ResolveMaintenanceDto {
  @ApiProperty({ example: 'Replaced faulty capacitor and balanced fan blades. Tested functional.' })
  @IsNotEmpty()
  @IsString()
  resolutionDetails: string;

  @ApiPropertyOptional({ example: 'https://storage.university.edu/photos/fan-fixed.jpg' })
  @IsOptional()
  @IsString()
  resolvedPhotoUrl?: string;
}

export class ConfirmResolutionDto {
  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Fan working smoothly and quietly. Thank you.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class ReopenMaintenanceDto {
  @ApiProperty({ example: 'Fan stopped working again after 2 hours. Noise returned.' })
  @IsNotEmpty()
  @IsString()
  reopenedReason: string;
}

export class MaintenanceQueryDto {
  @ApiPropertyOptional({ example: 'hst-01' })
  @IsOptional()
  @IsString()
  hostelId?: string;

  @ApiPropertyOptional({ example: 'ELECTRICAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'URGENT' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'SUBMITTED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'staff-01' })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @ApiPropertyOptional({ example: 'stud-01' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'HOST-MNT-2026-000001' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isOverdue?: boolean | string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
