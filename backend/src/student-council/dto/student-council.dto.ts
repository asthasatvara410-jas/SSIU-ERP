import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum CouncilCommitteeType {
  STUDENT_COUNCIL = 'STUDENT_COUNCIL',
  STUDENT_CLUB = 'STUDENT_CLUB',
  TECHNICAL_CLUB = 'TECHNICAL_CLUB',
  CULTURAL_CLUB = 'CULTURAL_CLUB',
  SPORTS_CLUB = 'SPORTS_CLUB',
  INNOVATION_CLUB = 'INNOVATION_CLUB',
  STUDENT_CELL = 'STUDENT_CELL',
  OTHER = 'OTHER',
}

export enum CouncilMemberRole {
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  GENERAL_SECRETARY = 'GENERAL_SECRETARY',
  JOINT_SECRETARY = 'JOINT_SECRETARY',
  TREASURER = 'TREASURER',
  FACULTY_COORDINATOR = 'FACULTY_COORDINATOR',
  STUDENT_COORDINATOR = 'STUDENT_COORDINATOR',
  EVENT_LEAD = 'EVENT_LEAD',
  MEMBER = 'MEMBER',
}

export enum MeetingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum EventProposalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  FACULTY_REVIEW = 'FACULTY_REVIEW',
  COUNCIL_REVIEW = 'COUNCIL_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export class CreateCouncilDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  committeeType?: CouncilCommitteeType = CouncilCommitteeType.STUDENT_COUNCIL;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  instituteId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  chairperson?: string; // Faculty Coordinator

  @IsString()
  @IsOptional()
  secretary?: string; // General Secretary / Student Coordinator
}

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  committeeType: CouncilCommitteeType;

  @IsString()
  @IsOptional()
  instituteId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  chairperson?: string; // Faculty Coordinator

  @IsString()
  @IsOptional()
  secretary?: string; // Student Coordinator
}

export class AssignMemberDto {
  @IsString()
  @IsNotEmpty()
  committeeId: string;

  @IsString()
  @IsNotEmpty()
  memberName: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  role?: string = 'MEMBER';

  @IsString()
  @IsOptional()
  instituteId?: string;

  @IsString()
  @IsOptional()
  department?: string;
}

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  committeeId: string;

  @IsString()
  @IsNotEmpty()
  meetingDate: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  @IsNotEmpty()
  agenda: string;

  @IsString()
  @IsOptional()
  minutes?: string;

  @IsOptional()
  actionItems?: Array<{
    itemNumber: string;
    description: string;
    responsibleDepartment?: string;
    responsiblePerson?: string;
    deadline: string;
  }>;
}

export class UpdateMeetingStatusDto {
  @IsString()
  @IsNotEmpty()
  status: MeetingStatus;

  @IsString()
  @IsOptional()
  minutes?: string;
}

export class CreateEventProposalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  organizingClub: string;

  @IsString()
  @IsOptional()
  committeeId?: string;

  @IsString()
  @IsOptional()
  instituteId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsNotEmpty()
  eventDate: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsNumber()
  @IsOptional()
  estimatedBudget?: number;

  @IsNumber()
  @IsOptional()
  expectedParticipants?: number;

  @IsString()
  @IsOptional()
  facultyCoordinator?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ReviewEventProposalDto {
  @IsString()
  @IsNotEmpty()
  status: EventProposalStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CouncilQueryDto {
  @IsString()
  @IsOptional()
  instituteId?: string;

  @IsString()
  @IsOptional()
  committeeType?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
