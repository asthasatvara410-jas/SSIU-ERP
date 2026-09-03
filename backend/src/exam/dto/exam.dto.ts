import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ExaminationSubjectItemDto,
  ExaminationFeeItemDto,
  ExaminationLateFeeRuleDto,
} from './create-examination.dto';

export enum ExamStatusEnum {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  CONDUCTED = 'CONDUCTED',
  EVALUATION = 'EVALUATION',
  APPROVAL = 'APPROVAL',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ExamTypeCodeEnum {
  REGULAR = 'REGULAR',
  REMEDIAL = 'REMEDIAL',
  BACKLOG = 'BACKLOG',
  INTERNAL_MID = 'INTERNAL_MID',
  EXTERNAL_END_SEM = 'EXTERNAL_END_SEM',
  PRACTICAL = 'PRACTICAL',
  VIVA = 'VIVA',
}

export class CreateExamTypeDto {
  @ApiProperty({ example: 'REGULAR' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Regular Semester Examination' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard end-semester university evaluation' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateExamDto {
  @ApiPropertyOptional({ example: 'EXAM-CSE-SEM4-2026' })
  @IsOptional()
  @IsString()
  examCode?: string;

  @ApiPropertyOptional({ example: 'EXAM-CSE-SEM4-2026' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'B.Tech CSE Semester-4 End-Semester Examination 2026' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'ExamType ID or Code (REGULAR, REMEDIAL, etc.)' })
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Exam Type Name/Code' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Program ID' })
  @IsNotEmpty()
  @IsString()
  programId: string;

  @ApiPropertyOptional({ description: 'Institute ID' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Academic Year ID' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ description: 'Semester ID' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional({ example: 'Summer 2026' })
  @IsOptional()
  @IsString()
  session?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-15' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  formStartDate?: string;

  @ApiPropertyOptional({ example: '2026-09-20' })
  @IsOptional()
  @IsString()
  formEndDate?: string;

  @ApiPropertyOptional({ enum: ExamStatusEnum, default: ExamStatusEnum.DRAFT })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Main end semester examination session' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Bring University ID card and hall ticket.' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Linked Phase 1 NoteSheet ID' })
  @IsOptional()
  @IsString()
  notesheetId?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  baseFee?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  lateFee?: number;

  @ApiPropertyOptional({ example: '2026-10-20' })
  @IsOptional()
  @IsString()
  formDeadline?: string;

  @ApiPropertyOptional({ example: '2026-10-25' })
  @IsOptional()
  @IsString()
  lateFeeDeadline?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  subjectIds?: string[];

  @ApiPropertyOptional({ type: [ExaminationSubjectItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationSubjectItemDto)
  subjects?: ExaminationSubjectItemDto[];

  @ApiPropertyOptional({ type: [ExaminationFeeItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationFeeItemDto)
  fees?: ExaminationFeeItemDto[];

  @ApiPropertyOptional({ type: ExaminationLateFeeRuleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExaminationLateFeeRuleDto)
  lateFeeRule?: ExaminationLateFeeRuleDto;
}

export class UpdateExamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  session?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formEndDate?: string;

  @ApiPropertyOptional({ enum: ExamStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notesheetId?: string;

  @ApiPropertyOptional({ type: [ExaminationSubjectItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationSubjectItemDto)
  subjects?: ExaminationSubjectItemDto[];

  @ApiPropertyOptional({ type: [ExaminationFeeItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationFeeItemDto)
  fees?: ExaminationFeeItemDto[];

  @ApiPropertyOptional({ type: ExaminationLateFeeRuleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExaminationLateFeeRuleDto)
  lateFeeRule?: ExaminationLateFeeRuleDto;
}

export class MapExamSubjectsDto {
  @ApiProperty({ type: [String], description: 'List of Subject IDs to map to the exam' })
  @IsNotEmpty()
  @IsArray()
  subjectIds: string[];
}

export class MapExamStudentsDto {
  @ApiProperty({ type: [String], description: 'List of Student IDs to enroll into the exam' })
  @IsNotEmpty()
  @IsArray()
  studentIds: string[];
}

export class CreateExamScheduleDto {
  @ApiProperty({ description: 'Exam ID' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'Semester ID' })
  @IsNotEmpty()
  @IsString()
  semesterId: string;

  @ApiProperty({ example: '2026-11-05' })
  @IsNotEmpty()
  @IsString()
  examDate: string;

  @ApiProperty({ example: '10:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '13:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Hall A - Block 1' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ example: 'Prof. Ramesh Sharma' })
  @IsOptional()
  @IsString()
  invigilator?: string;
}

export class AllocateExamRoomsDto {
  @ApiProperty({ description: 'Exam Schedule ID' })
  @IsNotEmpty()
  @IsString()
  examScheduleId: string;

  @ApiProperty({ type: [String], description: 'Room IDs to distribute students across' })
  @IsNotEmpty()
  @IsArray()
  roomIds: string[];

  @ApiPropertyOptional({ example: 'S' })
  @IsOptional()
  @IsString()
  seatPrefix?: string;
}

export class EnterMarksDto {
  @ApiProperty({ description: 'Exam Form ID' })
  @IsNotEmpty()
  @IsString()
  examFormId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Exam Schedule ID' })
  @IsOptional()
  @IsString()
  examScheduleId?: string;

  @ApiPropertyOptional({ example: 25.5, description: 'Internal / Continuous evaluation marks' })
  @IsOptional()
  @IsNumber()
  internalMarks?: number;

  @ApiPropertyOptional({ example: 30, description: 'Maximum internal marks' })
  @IsOptional()
  @IsNumber()
  maxInternalMarks?: number;

  @ApiPropertyOptional({ example: 56.0, description: 'External / University end-semester marks' })
  @IsOptional()
  @IsNumber()
  externalMarks?: number;

  @ApiPropertyOptional({ example: 70, description: 'Maximum external marks' })
  @IsOptional()
  @IsNumber()
  maxExternalMarks?: number;

  @ApiPropertyOptional({ example: 0, description: 'Practical / Lab marks' })
  @IsOptional()
  @IsNumber()
  practicalMarks?: number;

  @ApiPropertyOptional({ example: 0, description: 'Maximum practical marks' })
  @IsOptional()
  @IsNumber()
  maxPracticalMarks?: number;

  @ApiPropertyOptional({ example: 81.5, description: 'Total marks obtained (calculated automatically if internal/external provided)' })
  @IsOptional()
  @IsNumber()
  marksObtained?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  maxMarks?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isMalpractice?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkEnterMarksDto {
  @ApiProperty({ description: 'Exam ID' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiProperty({ type: [EnterMarksDto], description: 'Array of student marks entries' })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterMarksDto)
  entries: EnterMarksDto[];
}

export class CorrectResultDto {
  @ApiPropertyOptional({ example: 62.0 })
  @IsOptional()
  @IsNumber()
  revisedMarks?: number;

  @ApiPropertyOptional({ example: 28.0 })
  @IsOptional()
  @IsNumber()
  revisedInternalMarks?: number;

  @ApiPropertyOptional({ example: 58.0 })
  @IsOptional()
  @IsNumber()
  revisedExternalMarks?: number;

  @ApiProperty({ example: 'Correction following re-totaling verified by Examination Controller' })
  @IsNotEmpty()
  @IsString()
  correctionReason: string;
}

export class ProcessRevaluationDto {
  @ApiProperty({ example: 68.5 })
  @IsNotEmpty()
  @IsNumber()
  revisedMarks: number;

  @ApiProperty({ example: 'EVALUATED' })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Examiner verified answer book and increased marks by 8' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateExamFormWindowDto {
  @ApiProperty({ description: 'Exam ID' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsNotEmpty()
  @IsString()
  windowOpen: string;

  @ApiProperty({ example: '2026-10-15' })
  @IsNotEmpty()
  @IsString()
  windowClose: string;

  @ApiPropertyOptional({ example: '2026-10-20' })
  @IsOptional()
  @IsString()
  lateWindowClose?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  examFee?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  lateFee?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  maxAttempts?: number;
}


export class ExamQueryDto {
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

  @ApiPropertyOptional({ example: 'program-btech-id' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ enum: ExamStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional({ example: 'CSE' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class VerifyExamFormDto {
  @ApiPropertyOptional({ example: 'Verified all regular subjects and fee clearance' })
  @IsOptional()
  @IsString()
  verificationRemarks?: string;
}

export class ReturnExamFormDto {
  @ApiProperty({ example: 'Please correct chosen backlog subject code' })
  @IsNotEmpty()
  @IsString()
  returnReason: string;
}

export class RejectExamFormDto {
  @ApiProperty({ example: 'Attendance below statutory minimum eligibility' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

export class BulkVerifyExamFormsDto {
  @ApiProperty({ type: [String], example: ['form-id-1', 'form-id-2'] })
  @IsArray()
  @IsString({ each: true })
  formIds: string[];

  @ApiPropertyOptional({ example: 'Bulk verified by Examination Controller' })
  @IsOptional()
  @IsString()
  verificationRemarks?: string;
}

export class BulkReturnExamFormsDto {
  @ApiProperty({ type: [String], example: ['form-id-1', 'form-id-2'] })
  @IsArray()
  @IsString({ each: true })
  formIds: string[];

  @ApiProperty({ example: 'Please re-verify semester subjects' })
  @IsNotEmpty()
  @IsString()
  returnReason: string;
}

export class BulkRejectExamFormsDto {
  @ApiProperty({ type: [String], example: ['form-id-1', 'form-id-2'] })
  @IsArray()
  @IsString({ each: true })
  formIds: string[];

  @ApiProperty({ example: 'Ineligible for examination session' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

export class BulkGenerateHallTicketsDto {
  @ApiPropertyOptional({ example: 'exam-id-1' })
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiPropertyOptional({ type: [String], example: ['form-id-1', 'form-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formIds?: string[];
}

export class SubmitMarksDto {
  @ApiProperty({ example: 'exam-id-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: 'sub-id-1' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examScheduleId?: string;
}

export class ReturnMarksDto {
  @ApiProperty({ example: 'exam-id-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: 'sub-id-1' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiProperty({ example: 'Practical components missing evaluation' })
  @IsNotEmpty()
  @IsString()
  returnReason: string;
}

export class VerifyMarksDto {
  @ApiProperty({ example: 'exam-id-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: 'sub-id-1' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationRemarks?: string;
}

export class MarksQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class ProcessResultsDto {
  @ApiProperty({ example: 'exam-id-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;
}

export class PublishResultsDto {
  @ApiProperty({ example: 'exam-id-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class WithholdResultDto {
  @ApiProperty({ example: 'student-id-1' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'exam-id-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: 'DOCUMENTATION', enum: ['DOCUMENTATION', 'ACADEMIC', 'FEE', 'DISCIPLINARY', 'EXAMINATION', 'OTHER'] })
  @IsNotEmpty()
  @IsString()
  withheldCategory: string;

  @ApiProperty({ example: 'Eligibility migration certificate pending submission' })
  @IsNotEmpty()
  @IsString()
  withheldReason: string;
}

export class ReviseResultDto {
  @ApiProperty({ example: 'result-summary-id-1' })
  @IsNotEmpty()
  @IsString()
  resultSummaryId: string;

  @ApiPropertyOptional({ example: 'exam-result-id-1' })
  @IsOptional()
  @IsString()
  examResultId?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  revisedMarks?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  revisedInternalMarks?: number;

  @ApiPropertyOptional({ example: 57 })
  @IsOptional()
  @IsNumber()
  revisedExternalMarks?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  revisedPracticalMarks?: number;

  @ApiProperty({ example: 'Scrutiny re-check revealed uncounted marks in Section B' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ResultQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  semesterNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  limit?: number;
}

// ── PHASE 5 DTOs: EXAM CENTRE, ROOM, SEATING & EDP DUTY ─────────────────────

export class CreateExamCentreDto {
  @ApiProperty({ example: 'CENTRE-01' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'SSIU Main Campus Examination Centre' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'inst-1' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiProperty({ example: 'Academic Block A & B' })
  @IsNotEmpty()
  @IsString()
  building: string;

  @ApiPropertyOptional({ example: 'Swarrnim University Campus, Gandhinagar' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Dr. R. K. Sharma' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateExamCentreDto {
  @ApiPropertyOptional({ example: 'CENTRE-01' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'SSIU Main Campus Centre' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'inst-1' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'Academic Block A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 'Swarrnim University, Gandhinagar' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Prof. J. Patel' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: '+91 9876543211' })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: 700 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ExamCentreQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateExamRoomDto {
  @ApiProperty({ example: 'centre-uuid-1' })
  @IsNotEmpty()
  @IsString()
  centreId: string;

  @ApiPropertyOptional({ example: 'Block A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiProperty({ example: 'ROOM-101' })
  @IsNotEmpty()
  @IsString()
  roomNumber: string;

  @ApiPropertyOptional({ example: 'R101' })
  @IsOptional()
  @IsString()
  roomCode?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiProperty({ example: 40 })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Room capacity must be greater than 0.' })
  capacity: number;

  @ApiPropertyOptional({ example: 'CLASSROOM', enum: ['CLASSROOM', 'LAB', 'HALL', 'OTHER'] })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasCCTV?: boolean;

  @ApiPropertyOptional({ example: 'AVAILABLE', enum: ['AVAILABLE', 'UNAVAILABLE', 'ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateExamRoomDto {
  @ApiPropertyOptional({ example: 'Block A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 'ROOM-101' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'R101' })
  @IsOptional()
  @IsString()
  roomCode?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Room capacity must be greater than 0.' })
  capacity?: number;

  @ApiPropertyOptional({ example: 'CLASSROOM', enum: ['CLASSROOM', 'LAB', 'HALL', 'OTHER'] })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasCCTV?: boolean;

  @ApiPropertyOptional({ example: 'AVAILABLE', enum: ['AVAILABLE', 'UNAVAILABLE', 'ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AllocateExamCentresDto {
  @ApiProperty({ example: 'exam-uuid-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: ['centre-uuid-1', 'centre-uuid-2'] })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  centreIds: string[];
}

export class AutoAllocateSeatingDto {
  @ApiProperty({ example: 'exam-uuid-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiPropertyOptional({ example: 'centre-uuid-1' })
  @IsOptional()
  @IsString()
  centreId?: string;

  @ApiPropertyOptional({ example: ['room-uuid-1', 'room-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomIds?: string[];

  @ApiPropertyOptional({ example: 'SEQUENTIAL', enum: ['SEQUENTIAL', 'ALTERNATE', 'ROW_COLUMN'] })
  @IsOptional()
  @IsString()
  seatPattern?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  startNumber?: number;
}

export class ManualChangeSeatDto {
  @ApiProperty({ example: 'allocation-uuid-1' })
  @IsNotEmpty()
  @IsString()
  seatAllocationId: string;

  @ApiPropertyOptional({ example: 'centre-uuid-1' })
  @IsOptional()
  @IsString()
  newCentreId?: string;

  @ApiProperty({ example: 'room-uuid-2' })
  @IsNotEmpty()
  @IsString()
  newRoomId: string;

  @ApiProperty({ example: 'B04' })
  @IsNotEmpty()
  @IsString()
  newSeatNumber: string;

  @ApiProperty({ example: 'Student requested disability accessibility accommodation on ground floor' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class AssignExamEdpDutyDto {
  @ApiProperty({ example: 'exam-uuid-1' })
  @IsNotEmpty()
  @IsString()
  examId: string;

  @ApiProperty({ example: '2026-11-15' })
  @IsNotEmpty()
  @IsString()
  dutyDate: string;

  @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON', 'EVENING', '09:30 AM - 12:30 PM'] })
  @IsNotEmpty()
  @IsString()
  shift: string;

  @ApiProperty({ example: 'centre-uuid-1' })
  @IsNotEmpty()
  @IsString()
  centreId: string;

  @ApiPropertyOptional({ example: 'Block A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 'room-uuid-1' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ example: 'EDP_OPERATOR', enum: ['EDP_OPERATOR', 'EXAM_SUPPORT', 'TECHNICAL_SUPPORT', 'CONTROL_ROOM', 'OTHER'] })
  @IsNotEmpty()
  @IsString()
  dutyType: string;

  @ApiProperty({ example: 'user-uuid-staff-1' })
  @IsNotEmpty()
  @IsString()
  staffUserId: string;

  @ApiPropertyOptional({ example: 'Duty for IT Surveillance and CCTV verification' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateEdpDutyStatusDto {
  @ApiProperty({ example: 'CONFIRMED', enum: ['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'] })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Pre-scheduled academic conference leave' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class EdpDutyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  centreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dutyDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export * from './create-examination.dto';
export * from './update-examination.dto';
export * from './examination-query.dto';
export * from './create-exam-form.dto';
export * from './update-exam-form.dto';
export * from './submit-exam-form.dto';
export * from './exam-form-query.dto';



