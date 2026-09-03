import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkDiaryCategoryEnum {
  ACADEMIC = 'ACADEMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  MEETING = 'MEETING',
  EXAMINATION = 'EXAMINATION',
  RESEARCH = 'RESEARCH',
  NAAC = 'NAAC',
  STUDENT_AFFAIRS = 'STUDENT_AFFAIRS',
  GENERAL = 'GENERAL',
  OTHER = 'OTHER',
}

export enum WorkDiaryPriorityEnum {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum WorkDiaryStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  FACULTY_REVIEW = 'FACULTY_REVIEW',
  HOD_REVIEW = 'HOD_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class CreateWorkDiaryDto {
  @ApiProperty({ example: 'Curriculum Review & NAAC Documentation' })
  @IsString()
  @IsNotEmpty()
  workTitle: string;

  @ApiPropertyOptional({ example: 'Reviewed syllabus units 3 and 4 with department committee.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: WorkDiaryCategoryEnum, default: WorkDiaryCategoryEnum.GENERAL })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsString()
  @IsNotEmpty()
  workDate: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '11:30' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ enum: WorkDiaryPriorityEnum, default: WorkDiaryPriorityEnum.NORMAL })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: WorkDiaryStatusEnum, default: WorkDiaryStatusEnum.DRAFT })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'ACADEMICS' })
  @IsOptional()
  @IsString()
  relatedModule?: string;

  @ApiPropertyOptional({ example: 'Dr. Ramesh Sharma (HOD)' })
  @IsOptional()
  @IsString()
  relatedPerson?: string;

  @ApiPropertyOptional({ example: 'Computer Science & Engineering' })
  @IsOptional()
  @IsString()
  relatedDepartment?: string;

  @ApiPropertyOptional({ example: 'SSCIT' })
  @IsOptional()
  @IsString()
  relatedInstitute?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'Agenda: NAAC Criteria 2 review. Decision: Submissions due Friday.' })
  @IsOptional()
  @IsString()
  meetingDetails?: string;

  @ApiPropertyOptional({ example: 'Visitor: Prof. A. Mehta (External Examiner). Outcome: Approved practical rubric.' })
  @IsOptional()
  @IsString()
  appointmentDetails?: string;

  @ApiPropertyOptional({ example: 'Task 1: Upload revised rubric (Done). Task 2: Notify batch (Pending).' })
  @IsOptional()
  @IsString()
  taskDetails?: string;

  @ApiPropertyOptional({ example: 'Follow up required next week.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: ['naac_criterion_2_draft.pdf'] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class UpdateWorkDiaryDto {
  @ApiPropertyOptional({ example: 'Curriculum Review & NAAC Documentation' })
  @IsOptional()
  @IsString()
  workTitle?: string;

  @ApiPropertyOptional({ example: 'Reviewed syllabus units 3 and 4 with department committee.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: WorkDiaryCategoryEnum })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsString()
  workDate?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '11:30' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ enum: WorkDiaryPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ enum: WorkDiaryStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'ACADEMICS' })
  @IsOptional()
  @IsString()
  relatedModule?: string;

  @ApiPropertyOptional({ example: 'Dr. Ramesh Sharma (HOD)' })
  @IsOptional()
  @IsString()
  relatedPerson?: string;

  @ApiPropertyOptional({ example: 'Computer Science & Engineering' })
  @IsOptional()
  @IsString()
  relatedDepartment?: string;

  @ApiPropertyOptional({ example: 'SSCIT' })
  @IsOptional()
  @IsString()
  relatedInstitute?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'Agenda: NAAC Criteria 2 review. Decision: Submissions due Friday.' })
  @IsOptional()
  @IsString()
  meetingDetails?: string;

  @ApiPropertyOptional({ example: 'Visitor: Prof. A. Mehta (External Examiner). Outcome: Approved practical rubric.' })
  @IsOptional()
  @IsString()
  appointmentDetails?: string;

  @ApiPropertyOptional({ example: 'Task 1: Upload revised rubric (Done). Task 2: Notify batch (Pending).' })
  @IsOptional()
  @IsString()
  taskDetails?: string;

  @ApiPropertyOptional({ example: 'Follow up required next week.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: ['naac_criterion_2_draft.pdf'] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class SubmitWorkDiaryDto {
  @ApiPropertyOptional({ example: 'Ready for faculty mentor and HOD review.' })
  @IsOptional()
  @IsString()
  submissionRemarks?: string;
}

export class FacultyReviewDto {
  @ApiProperty({ example: 'Verified curriculum alignment and lab schedule entries.' })
  @IsString()
  @IsNotEmpty()
  facultyComments: string;

  @ApiPropertyOptional({ enum: [WorkDiaryStatusEnum.FACULTY_REVIEW, WorkDiaryStatusEnum.HOD_REVIEW], default: WorkDiaryStatusEnum.HOD_REVIEW })
  @IsOptional()
  @IsString()
  nextStatus?: string;
}

export class HodReviewDto {
  @ApiProperty({ example: 'Department goals met. Excellent documentation.' })
  @IsString()
  @IsNotEmpty()
  hodComments: string;

  @ApiPropertyOptional({ enum: [WorkDiaryStatusEnum.HOD_REVIEW, WorkDiaryStatusEnum.APPROVED, WorkDiaryStatusEnum.REJECTED], default: WorkDiaryStatusEnum.APPROVED })
  @IsOptional()
  @IsString()
  decision?: string;
}

export class ApproveWorkDiaryDto {
  @ApiPropertyOptional({ example: 'Approved by Head of Department / Academic Authority.' })
  @IsOptional()
  @IsString()
  approvalRemarks?: string;
}

export class RejectWorkDiaryDto {
  @ApiProperty({ example: 'Incomplete documentation for NAAC Criterion 2 task. Please revise.' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class WorkDiaryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: WorkDiaryStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: WorkDiaryCategoryEnum })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: WorkDiaryPriorityEnum })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'user-faculty-id' })
  @IsOptional()
  @IsString()
  facultyId?: string;

  @ApiPropertyOptional({ example: 'dept-cse-id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'NAAC' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  allDepartments?: boolean;
}
