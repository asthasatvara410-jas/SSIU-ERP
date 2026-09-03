import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class CreateStartupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  @IsIn(['IDEATION', 'PROTOTYPE', 'MVP', 'EARLY_TRACTION', 'SCALING', 'GRADUATED'])
  stage?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsArray()
  founders?: Array<{
    name: string;
    userId?: string;
    studentId?: string;
    facultyId?: string;
    role?: string;
    ownershipPercentage: number;
    isPrimaryFounder?: boolean;
  }>;
}

export class CreateSSIPProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  studentLeadId: string;

  @IsOptional()
  @IsString()
  facultyMentorId?: string;

  @IsOptional()
  @IsString()
  startupId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sanctionedAmount?: number;
}

export class CreateGrantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  grantingAgency: string;

  @IsOptional()
  @IsString()
  schemeName?: string;

  @IsOptional()
  @IsString()
  grantType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sanctionedAmount?: number;
}

export class SubmitExpenseDto {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  financeTransactionId?: string;

  @IsOptional()
  @IsString()
  receiptDocumentId?: string;
}

export class CreateMilestoneDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;
}

export class GrantApprovalActionDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'RETURNED', 'SANCTIONED', 'CLOSED'])
  action: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateInnovationProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @IsString()
  proposedSolution?: string;

  @IsOptional()
  @IsString()
  leadName?: string;

  @IsOptional()
  @IsString()
  leadType?: string;

  @IsOptional()
  @IsString()
  facultyMentorName?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  technologyArea?: string;

  @IsOptional()
  @IsString()
  sdgAlignment?: string;

  @IsOptional()
  @IsString()
  linkedPatentId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class CreateIncubationApplicationDto {
  @IsNotEmpty()
  @IsString()
  startupOrIdeaName: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  applicantName?: string;

  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsNumber()
  fundingRequirement?: number;
}

export class CreateInnovationMentorDto {
  @IsNotEmpty()
  @IsString()
  mentorName: string;

  @IsNotEmpty()
  @IsString()
  mentorType: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  expertise?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;
}

export class CreateMentoringSessionDto {
  @IsNotEmpty()
  @IsString()
  mentorId: string;

  @IsNotEmpty()
  @IsString()
  targetName: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  mentoringNotes?: string;
}

export class CreateInnovationFundingDto {
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  fundingSource: string;

  @IsNotEmpty()
  @IsNumber()
  sanctionedAmount: number;

  @IsOptional()
  @IsNumber()
  releasedAmount?: number;

  @IsOptional()
  @IsString()
  fundingType?: string;
}

export class CreateIndustryCollaborationDto {
  @IsNotEmpty()
  @IsString()
  industryName: string;

  @IsNotEmpty()
  @IsString()
  collaborationType: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  facultyCoordinatorName?: string;
}

export class CreateInnovationEventDto {
  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @IsOptional()
  @IsNumber()
  participantCount?: number;

  @IsOptional()
  @IsString()
  outcomes?: string;
}

export class CreateHackathonDto {
  @IsNotEmpty()
  @IsString()
  hackathonName: string;

  @IsNotEmpty()
  @IsString()
  theme: string;

  @IsOptional()
  @IsNumber()
  teamsCount?: number;

  @IsOptional()
  @IsNumber()
  participantsCount?: number;

  @IsOptional()
  @IsNumber()
  awardsPrizePool?: number;
}

export class CreateInnovationAwardDto {
  @IsNotEmpty()
  @IsString()
  awardTitle: string;

  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  awardingOrganization: string;

  @IsOptional()
  @IsString()
  level?: string;
}

