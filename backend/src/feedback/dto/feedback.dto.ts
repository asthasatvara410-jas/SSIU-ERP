import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, IsObject, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FeedbackCategoryEnum {
  SUBJECT = 'SUBJECT',
  FACULTY = 'FACULTY',
  MENTOR = 'MENTOR',
  HOD = 'HOD',
  HOI = 'HOI',
  CAMPUS = 'CAMPUS',
  GENERAL_UNIVERSITY = 'GENERAL_UNIVERSITY'
}

export enum CampusFacilityEnum {
  CAMPUS_INFRASTRUCTURE = 'CAMPUS_INFRASTRUCTURE',
  CLASSROOMS = 'CLASSROOMS',
  LABORATORIES = 'LABORATORIES',
  LIBRARY = 'LIBRARY',
  HOSTEL = 'HOSTEL',
  FOOD_CAFETERIA = 'FOOD_CAFETERIA',
  TRANSPORT = 'TRANSPORT',
  SPORTS_FACILITIES = 'SPORTS_FACILITIES',
  CLEANLINESS = 'CLEANLINESS',
  SECURITY = 'SECURITY',
  WIFI_INTERNET = 'WIFI_INTERNET',
  PARKING = 'PARKING',
  STUDENT_SERVICES = 'STUDENT_SERVICES',
  OTHER = 'OTHER'
}

export enum SuggestionCategoryEnum {
  ACADEMIC = 'ACADEMIC',
  TEACHING = 'TEACHING',
  CAMPUS = 'CAMPUS',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  TECHNOLOGY = 'TECHNOLOGY',
  STUDENT_SERVICES = 'STUDENT_SERVICES',
  HOSTEL = 'HOSTEL',
  TRANSPORT = 'TRANSPORT',
  EVENTS = 'EVENTS',
  CLUBS = 'CLUBS',
  LIBRARY = 'LIBRARY',
  SPORTS = 'SPORTS',
  CAFETERIA = 'CAFETERIA',
  OTHER = 'OTHER'
}

export class SubmitFeedbackDto {
  @ApiProperty({ enum: FeedbackCategoryEnum, description: 'Category of feedback' })
  @IsEnum(FeedbackCategoryEnum)
  category: FeedbackCategoryEnum;

  @ApiPropertyOptional({ enum: CampusFacilityEnum, description: 'Facility sub-category if Campus feedback' })
  @IsOptional()
  @IsEnum(CampusFacilityEnum)
  campusFacilityCategory?: CampusFacilityEnum;

  @ApiPropertyOptional({ description: 'Subject ID if Subject Feedback' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Faculty Member ID if Faculty Feedback' })
  @IsOptional()
  @IsString()
  facultyId?: string;

  @ApiProperty({ description: 'Category-specific criteria breakdown ratings (1 to 5)', type: Object })
  @IsObject()
  ratings: Record<string, number>;

  @ApiProperty({ description: 'Overall Rating (1 to 5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiPropertyOptional({ description: 'Qualitative comments / remarks' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: 'Improvement suggestions' })
  @IsOptional()
  @IsString()
  suggestions?: string;

  @ApiPropertyOptional({ description: 'Anonymous submission toggle' })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class SubmitSuggestionDto {
  @ApiProperty({ enum: SuggestionCategoryEnum, description: 'Category of suggestion' })
  @IsEnum(SuggestionCategoryEnum)
  category: SuggestionCategoryEnum;

  @ApiProperty({ description: 'Suggestion Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed Description of the Suggestion' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Expected Improvement or Benefit' })
  @IsOptional()
  @IsString()
  expectedImprovement?: string;

  @ApiPropertyOptional({ description: 'Attachment file URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: 'Anonymous submission toggle' })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class UpdateSuggestionActionDto {
  @ApiProperty({ description: 'New Status for the suggestion' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ description: 'Department to route/assign suggestion' })
  @IsOptional()
  @IsString()
  assignedDepartment?: string;

  @ApiPropertyOptional({ description: 'Administrative response to student' })
  @IsOptional()
  @IsString()
  adminResponse?: string;

  @ApiPropertyOptional({ description: 'Action taken description' })
  @IsOptional()
  @IsString()
  actionTaken?: string;
}

export class FeedbackFilterQueryDto {
  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Institute ID filter' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Semester ID filter' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Academic Year ID filter' })
  @IsOptional()
  @IsString()
  academicYearId?: string;
}

export enum GrievanceCategoryEnum {
  ACADEMIC = 'ACADEMIC',
  EXAMINATION = 'EXAMINATION',
  FACILITY = 'FACILITY',
  HOSTEL = 'HOSTEL',
  TRANSPORT = 'TRANSPORT',
  ANTI_RAGGING = 'ANTI_RAGGING',
  HARASSMENT = 'HARASSMENT',
  OTHER = 'OTHER'
}

export enum GrievanceStatusEnum {
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  REJECTED = 'REJECTED'
}

export class SubmitAnonymousGrievanceDto {
  @ApiProperty({ enum: GrievanceCategoryEnum, description: 'Category of grievance' })
  @IsEnum(GrievanceCategoryEnum)
  category: GrievanceCategoryEnum;

  @ApiProperty({ description: 'Grievance Subject / Title' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Detailed Description of the incident / grievance' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Priority level', default: 'MEDIUM' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Target Department Name or ID' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Incident Location' })
  @IsOptional()
  @IsString()
  incidentLocation?: string;

  @ApiPropertyOptional({ description: 'Attachment file name / URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: 'Attachment file name' })
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional({ description: 'Attachment file size in bytes' })
  @IsOptional()
  @IsNumber()
  attachmentSize?: number;

  @ApiPropertyOptional({ description: 'Optional email strictly for notifications (never exposed to handlers)' })
  @IsOptional()
  @IsString()
  optionalContactEmail?: string;

  @ApiPropertyOptional({ description: 'Optional phone strictly for notifications (never exposed to handlers)' })
  @IsOptional()
  @IsString()
  optionalContactPhone?: string;
}

export class TrackAnonymousGrievanceDto {
  @ApiProperty({ description: 'Public Grievance Reference (GRV-...)' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({ description: 'Secret 32-character Tracking Token received at submission' })
  @IsString()
  @IsNotEmpty()
  trackingToken: string;
}

export class UpdateGrievanceStatusDto {
  @ApiProperty({ enum: GrievanceStatusEnum, description: 'New workflow status' })
  @IsEnum(GrievanceStatusEnum)
  status: GrievanceStatusEnum;

  @ApiPropertyOptional({ description: 'Internal remarks / justification' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Public response / update visible to tracking submitter' })
  @IsOptional()
  @IsString()
  publicResponse?: string;

  @ApiPropertyOptional({ description: 'Resolution summary (if status is RESOLVED or CLOSED)' })
  @IsOptional()
  @IsString()
  resolutionSummary?: string;

  @ApiPropertyOptional({ description: 'Assigned Officer / User ID' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Assigned Department' })
  @IsOptional()
  @IsString()
  assignedDepartment?: string;
}

export class GrievanceFilterQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by Priority' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Filter by Escalation Level' })
  @IsOptional()
  @IsString()
  escalationLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by SLA Status' })
  @IsOptional()
  @IsString()
  slaStatus?: string;

  @ApiPropertyOptional({ description: 'Search by reference or subject' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class EscalateGrievanceDto {
  @ApiPropertyOptional({ description: 'Target Escalation Level (1 to 4)' })
  @IsOptional()
  toLevel?: number;

  @ApiProperty({ description: 'Reason for escalation (SLA_BREACH, CRITICAL_PRIORITY, MANUAL_ESCALATION, REPEATED_UNRESOLVED, AUTHORITY_UNAVAILABLE, REOPENED_CASE, OTHER)' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional explanatory notes or directive' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Specific Officer ID to escalate to' })
  @IsOptional()
  @IsString()
  escalateToUserId?: string;

  @ApiPropertyOptional({ description: 'Target Role or Designation' })
  @IsOptional()
  @IsString()
  targetRole?: string;
}

export class AssignGrievanceDto {
  @ApiPropertyOptional({ description: 'Assigned Officer / User ID' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiProperty({ description: 'Assigned Role or Committee' })
  @IsString()
  @IsNotEmpty()
  assignedRole: string;

  @ApiPropertyOptional({ description: 'Assignment instructions / directive' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolveGrievanceDto {
  @ApiProperty({ description: 'Formal resolution summary communicated' })
  @IsString()
  @IsNotEmpty()
  resolutionSummary: string;

  @ApiPropertyOptional({ description: 'Institutional corrective action taken' })
  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @ApiPropertyOptional({ description: 'Internal remarks / committee notes' })
  @IsOptional()
  @IsString()
  internalRemarks?: string;
}

export class ReopenGrievanceDto {
  @ApiProperty({ description: 'Justification for reopening case' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional evidence or observation' })
  @IsOptional()
  @IsString()
  additionalDetails?: string;
}


