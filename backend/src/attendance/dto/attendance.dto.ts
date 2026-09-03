import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';

export enum AttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  LEAVE = 'LEAVE',
  EXCUSED = 'EXCUSED'
}

export enum AttendanceSessionStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  LOCKED = 'LOCKED'
}

export class StudentAttendanceRecordDto {
  @ApiProperty({ example: 'stu-1' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiPropertyOptional({ example: 'ABC Student 1' })
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional({ example: 'STUDENT-001' })
  @IsOptional()
  @IsString()
  enrollmentNo?: string;

  @ApiProperty({ enum: AttendanceStatusEnum, example: AttendanceStatusEnum.PRESENT })
  @IsEnum(AttendanceStatusEnum)
  status: AttendanceStatusEnum;

  @ApiPropertyOptional({ example: 'Approved medical slip' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateAttendanceSessionDto {
  @ApiProperty({ example: '2026-08-14' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'sub-dbms' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'div-cse-4a' })
  @IsString()
  @IsNotEmpty()
  divisionId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(12)
  lectureNo: number;

  @ApiPropertyOptional({ example: '09:00 AM - 10:00 AM' })
  @IsOptional()
  @IsString()
  timeSlot?: string;

  @ApiPropertyOptional({ example: 'B+ Tree Indexing & Query Optimization' })
  @IsOptional()
  @IsString()
  topicTaught?: string;

  @ApiPropertyOptional({ example: 'ay-2024' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  semester?: number;

  @ApiPropertyOptional({ example: 'dept-1' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'inst-1' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiProperty({ type: [StudentAttendanceRecordDto] })
  @IsArray()
  records: StudentAttendanceRecordDto[];

  @ApiPropertyOptional({ enum: AttendanceSessionStatusEnum, default: AttendanceSessionStatusEnum.SUBMITTED })
  @IsOptional()
  @IsEnum(AttendanceSessionStatusEnum)
  status?: AttendanceSessionStatusEnum;
}

export class CreateAttendanceCorrectionDto {
  @ApiProperty({ example: 'att-12' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'stu-1' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatusEnum, example: AttendanceStatusEnum.PRESENT })
  @IsEnum(AttendanceStatusEnum)
  newStatus: AttendanceStatusEnum;

  @ApiProperty({ example: 'Student was present in laboratory session' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReviewAttendanceCorrectionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' })
  @IsString()
  @IsNotEmpty()
  decision: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Verified lab attendance log' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateAttendancePolicyDto {
  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  requiredPercentage?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(100)
  condonationFloorPct?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isCondonationAllowed?: boolean;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  warningThreshold?: number;

  @ApiPropertyOptional({ example: 65 })
  @IsOptional()
  @IsNumber()
  criticalThreshold?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  autoLockHours?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  allowCorrectionDays?: number;
}

export enum AttendanceApplicationReasonEnum {
  MEDICAL = 'MEDICAL',
  UNIVERSITY_ACTIVITY = 'UNIVERSITY_ACTIVITY',
  OFFICIAL_DUTY = 'OFFICIAL_DUTY',
  ACADEMIC_ACTIVITY = 'ACADEMIC_ACTIVITY',
  OTHER = 'OTHER'
}

export enum AttendanceApprovalStatusEnum {
  SUBMITTED_TO_FACULTY = 'SUBMITTED_TO_FACULTY',
  FACULTY_APPROVED = 'FACULTY_APPROVED',
  FACULTY_REJECTED = 'FACULTY_REJECTED',
  WITH_MENTOR = 'WITH_MENTOR',
  MENTOR_APPROVED = 'MENTOR_APPROVED',
  MENTOR_REJECTED = 'MENTOR_REJECTED',
  WITH_HOD = 'WITH_HOD',
  HOD_APPROVED = 'HOD_APPROVED',
  HOD_REJECTED = 'HOD_REJECTED',
  WITH_HOI = 'WITH_HOI',
  HOI_APPROVED = 'HOI_APPROVED',
  HOI_REJECTED = 'HOI_REJECTED',
  MORE_INFORMATION_REQUIRED = 'MORE_INFORMATION_REQUIRED',
  FINAL_APPROVED = 'FINAL_APPROVED',
  EXAM_ELIGIBLE = 'EXAM_ELIGIBLE',
  CLOSED = 'CLOSED'
}

export class CreateAttendanceApplicationDto {
  @ApiProperty({ example: 'sub-dbms', description: 'Subject ID with attendance shortage (< 75%)' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ enum: AttendanceApplicationReasonEnum, example: AttendanceApplicationReasonEnum.MEDICAL })
  @IsEnum(AttendanceApplicationReasonEnum)
  reason: AttendanceApplicationReasonEnum;

  @ApiProperty({ example: 'Hospitalized due to viral infection from 10th to 18th July. Doctor certificate attached.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu/documents/medical_cert.pdf' })
  @IsOptional()
  @IsString()
  supportingDocumentUrl?: string;

  @ApiPropertyOptional({ example: 'Doctor_Medical_Certificate.pdf' })
  @IsOptional()
  @IsString()
  supportingDocumentName?: string;
}

export class AttendanceReviewActionDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'REQUEST_MORE_INFO'], example: 'APPROVE' })
  @IsString()
  @IsNotEmpty()
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';

  @ApiProperty({ example: 'Verified medical documentation and doctor fitness certificate. Approved for condonation.' })
  @IsString()
  @IsNotEmpty()
  remarks: string;
}

export class AttendanceApplicationQueryDto {
  @ApiPropertyOptional({ example: 'dept-1' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'prog-1' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ example: 'sem-4' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: 'sub-dbms' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ enum: AttendanceApprovalStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Jigar' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number;
}

export class AttendanceEligibilityQueryDto {
  @ApiPropertyOptional({ example: 'dept-1' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'prog-1' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ example: 'sem-4' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ enum: ['ALL', 'ELIGIBLE', 'SHORTAGE', 'CONDONED'], example: 'ALL' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '240101001' })
  @IsOptional()
  @IsString()
  search?: string;
}
