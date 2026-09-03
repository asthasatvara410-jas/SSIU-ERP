import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum EdpDutyStatusEnum {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TeachingMethodologyEnum {
  BLACKBOARD = 'BLACKBOARD',
  PROJECTOR = 'PROJECTOR',
  PPT = 'PPT',
  LAB_HANDS_ON = 'LAB_HANDS_ON',
  HYBRID = 'HYBRID',
}

export enum ClassroomEnvironmentEnum {
  DISCIPLINED = 'DISCIPLINED',
  NOISY = 'NOISY',
  CLEAN = 'CLEAN',
  PROJECTOR_ISSUE = 'PROJECTOR_ISSUE',
  INTERRUPTED = 'INTERRUPTED',
}

export class StudentObservationItemDto {
  @ApiPropertyOptional({ example: 'stu-uuid-01' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: 'SSIU2026CSE001' })
  @IsNotEmpty()
  @IsString()
  enrollmentNo: string;

  @ApiProperty({ example: 'Aarav Patel' })
  @IsNotEmpty()
  @IsString()
  studentName: string;

  @ApiPropertyOptional({ example: 'PRESENT', default: 'PRESENT' })
  @IsOptional()
  @IsString()
  attendanceStatus?: string;

  @ApiPropertyOptional({ example: 'Attentive and actively taking notes.' })
  @IsOptional()
  @IsString()
  observationRemarks?: string;
}

export class DutyPhotoUploadItemDto {
  @ApiProperty({ example: 'https://cdn.ssiu.edu.in/edp/classroom_302_1030am.jpg' })
  @IsNotEmpty()
  @IsString()
  photoUrl: string;

  @ApiPropertyOptional({ example: 'Classroom front row view during DBMS lecture' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 23.0225 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.5714 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateEdpDutyDto {
  @ApiProperty({ example: 'dept-cse-id' })
  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @ApiPropertyOptional({ example: 'sub-dbms-id' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'Database Management Systems (CS401)' })
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiProperty({ example: 'Room 302, Block B' })
  @IsNotEmpty()
  @IsString()
  classRoom: string;

  @ApiPropertyOptional({ example: 'B.Tech CSE - 4th Sem (Div A)' })
  @IsOptional()
  @IsString()
  batchOrDivision?: string;

  @ApiPropertyOptional({ example: 'fac-prof-sharma-id' })
  @IsOptional()
  @IsString()
  teachingFacultyId?: string;

  @ApiPropertyOptional({ example: 'Prof. Rajesh Sharma' })
  @IsOptional()
  @IsString()
  teachingFacultyName?: string;

  @ApiProperty({ example: 'usr-edp-officer-id' })
  @IsNotEmpty()
  @IsString()
  assignedOfficerId: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsNotEmpty()
  @IsString()
  dutyDate: string;

  @ApiProperty({ example: '10:30 AM' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '11:30 AM' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalRegisteredStudents?: number;

  @ApiPropertyOptional({ example: 'Inspect adherence to syllabus timeline and digital projector usage.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateEdpDutyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classRoom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchOrDivision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedOfficerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dutyDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ enum: EdpDutyStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitEdpObservationDto {
  @ApiProperty({ example: 54 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  presentStudentCount: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  absentStudentCount?: number;

  @ApiPropertyOptional({ example: 'Relational Algebra & Normalization Rules (3NF)' })
  @IsOptional()
  @IsString()
  lectureTopic?: string;

  @ApiPropertyOptional({ enum: TeachingMethodologyEnum, default: TeachingMethodologyEnum.PROJECTOR })
  @IsOptional()
  @IsString()
  teachingMethodology?: string;

  @ApiPropertyOptional({ enum: ClassroomEnvironmentEnum, default: ClassroomEnvironmentEnum.DISCIPLINED })
  @IsOptional()
  @IsString()
  classroomEnvironment?: string;

  @ApiPropertyOptional({ example: 'Faculty covered all scheduled topics with interactive slide deck and live SQL queries.' })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({ example: 'Air conditioning unit near row 4 vibrating slightly.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ type: [StudentObservationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentObservationItemDto)
  studentObservations?: StudentObservationItemDto[];

  @ApiPropertyOptional({ type: [DutyPhotoUploadItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DutyPhotoUploadItemDto)
  photos?: DutyPhotoUploadItemDto[];
}

export class VerifyEdpDutyDto {
  @ApiPropertyOptional({ example: 'Inspection report verified and archived by Academic Dean.' })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class UploadDutyPhotoDto {
  @ApiProperty({ example: 'https://cdn.ssiu.edu.in/edp/classroom_302.jpg' })
  @IsNotEmpty()
  @IsString()
  photoUrl: string;

  @ApiPropertyOptional({ example: 'Classroom front view' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 23.0225 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.5714 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class EdpDutyQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'usr-officer-id' })
  @IsOptional()
  @IsString()
  assignedOfficerId?: string;

  @ApiPropertyOptional({ example: 'fac-sharma-id' })
  @IsOptional()
  @IsString()
  teachingFacultyId?: string;

  @ApiPropertyOptional({ enum: EdpDutyStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Room 302' })
  @IsOptional()
  @IsString()
  classRoom?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'DBMS' })
  @IsOptional()
  @IsString()
  search?: string;
}
