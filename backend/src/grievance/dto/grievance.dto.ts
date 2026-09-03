import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class CreateComplaintDto {
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'GENERAL', 'ACADEMIC', 'ADMINISTRATIVE', 'EXAMINATION', 'FEES',
    'HOSTEL', 'TRANSPORT', 'FACULTY', 'STAFF', 'ANTI_RAGGING',
    'ICC', 'HARASSMENT', 'SAFETY', 'INFRASTRUCTURE', 'OTHER'
  ])
  category: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['IDENTIFIED', 'CONFIDENTIAL', 'ANONYMOUS'])
  type: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  incidentLocation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  instituteContext?: string;

  @IsOptional()
  @IsString()
  optionalContactEmail?: string;

  @IsOptional()
  @IsString()
  optionalContactPhone?: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  attachmentName?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentType?: string;

  @IsOptional()
  @IsNumber()
  attachmentSize?: number;
}

export class UpdateCaseStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ASSIGNED',
    'IN_PROGRESS', 'ACTION_REQUIRED', 'ESCALATED', 'RESOLVED',
    'CLOSED', 'REJECTED', 'DUPLICATE'
  ])
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateAntiRaggingDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @IsOptional()
  @IsNumber()
  victimCount?: number;

  @IsOptional()
  @IsString()
  witnessInformation?: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;

  @IsOptional()
  @IsString()
  documentId?: string;
}

export class CreateICCDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['RESTRICTED', 'HIGHLY_RESTRICTED'])
  confidentialityLevel?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

export class AssignComplaintDto {
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  committeeId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class CreateInvestigationDto {
  @IsNotEmpty()
  @IsString()
  investigatorId: string;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;
}

export class CreateActionPlanDto {
  @IsNotEmpty()
  @IsString()
  actionType: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class ResolveComplaintDto {
  @IsNotEmpty()
  @IsString()
  resolutionType: string;

  @IsNotEmpty()
  @IsString()
  summary: string;

  @IsNotEmpty()
  @IsString()
  studentVisibleSummary: string;
}

export class ReopenCaseDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class FeedbackDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['SATISFIED', 'PARTIALLY_SATISFIED', 'NOT_SATISFIED'])
  satisfactionLevel: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateCommitteeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['GRIEVANCE_COMMITTEE', 'ANTI_RAGGING_COMMITTEE', 'ICC', 'OTHER'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddCommitteeMemberDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['CHAIRPERSON', 'MEMBER', 'SECRETARY', 'INVESTIGATOR', 'AUTHORIZED_OFFICER'])
  role: string;
}

export class AddInternalNoteDto {
  @IsNotEmpty()
  @IsString()
  note: string;
}

export class TrackAnonymousDto {
  @IsNotEmpty()
  @IsString()
  caseNumber: string;

  @IsNotEmpty()
  @IsString()
  trackingToken: string;
}
