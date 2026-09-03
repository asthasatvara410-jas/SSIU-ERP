import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateResearchProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  researchArea?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  fundingSource?: string;

  @IsOptional()
  @IsNumber()
  fundingAmount?: number;
}

export class CreatePublicationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  authors: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  publicationType?: string;

  @IsOptional()
  @IsString()
  journalName?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  issn?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  indexing?: string;

  @IsOptional()
  @IsArray()
  authorList?: Array<{
    name: string;
    userId?: string;
    studentId?: string;
    orcidId?: string;
    affiliation?: string;
    correspondingAuthor?: boolean;
    order?: number;
  }>;
}

export class CreatePatentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  inventors: string;

  @IsNotEmpty()
  @IsString()
  applicationNumber: string;

  @IsOptional()
  @IsString()
  publicationNumber?: string;

  @IsOptional()
  @IsString()
  patentNumber?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  applicant?: string;

  @IsOptional()
  @IsArray()
  inventorList?: Array<{
    name: string;
    userId?: string;
    studentId?: string;
    order?: number;
  }>;
}

export class ResearchApprovalActionDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'RETURNED'])
  action: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ValidateExternalDto {
  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  orcidId?: string;
}

export class CreateResearchGrantDto {
  @IsNotEmpty()
  @IsString()
  grantNo: string;

  @IsNotEmpty()
  @IsString()
  projectTitle: string;

  @IsNotEmpty()
  @IsString()
  fundingAgency: string;

  @IsOptional()
  @IsString()
  grantType?: string;

  @IsNotEmpty()
  @IsNumber()
  sanctionedAmount: number;

  @IsOptional()
  @IsNumber()
  releasedAmount?: number;

  @IsOptional()
  @IsNumber()
  utilizedAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class CreateResearchScholarDto {
  @IsNotEmpty()
  @IsString()
  scholarName: string;

  @IsNotEmpty()
  @IsString()
  registrationNumber: string;

  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsNotEmpty()
  @IsString()
  supervisorName: string;

  @IsOptional()
  @IsString()
  researchArea?: string;

  @IsNotEmpty()
  @IsString()
  thesisTitle: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateConsultancyDto {
  @IsNotEmpty()
  @IsString()
  projectTitle: string;

  @IsNotEmpty()
  @IsString()
  clientName: string;

  @IsNotEmpty()
  @IsString()
  facultyConsultantName: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsNotEmpty()
  @IsNumber()
  contractAmount: number;

  @IsOptional()
  @IsNumber()
  receivedAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateConferenceDto {
  @IsNotEmpty()
  @IsString()
  conferenceName: string;

  @IsOptional()
  @IsString()
  conferenceType?: string;

  @IsNotEmpty()
  @IsString()
  organizer: string;

  @IsNotEmpty()
  @IsString()
  facultyName: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  paperPresented?: string;
}

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  authors: string;

  @IsNotEmpty()
  @IsString()
  publisher: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  itemType?: string;
}

export class CreateAwardDto {
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
  awardCategory?: string;

  @IsOptional()
  @IsString()
  level?: string;
}

export class ResearchFilterDto {
  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  instituteId?: string;

  @IsOptional()
  @IsString()
  facultyId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

