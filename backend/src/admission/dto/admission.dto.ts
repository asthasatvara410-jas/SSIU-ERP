import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum LeadStatusEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  FOLLOW_UP = 'FOLLOW_UP',
  APPLIED = 'APPLIED',
  VERIFIED = 'VERIFIED',
  ADMITTED = 'ADMITTED',
  ENROLLED = 'ENROLLED',
  REJECTED = 'REJECTED',
}

export enum LeadSourceEnum {
  WEBSITE = 'WEBSITE',
  WALK_IN = 'WALK_IN',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EDUCATION_FAIR = 'EDUCATION_FAIR',
  REFERRAL = 'REFERRAL',
  CAMPAIGN = 'CAMPAIGN',
  DIRECT = 'DIRECT',
  OTHER = 'OTHER',
}

export enum LeadQualityEnum {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Rohan Sharma' })
  @IsNotEmpty()
  @IsString()
  applicantName: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ example: 'rohan.sharma@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Ahmedabad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Gujarat' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  interestedInstituteId?: string;

  @ApiPropertyOptional({ example: 'prog-cse-id' })
  @IsOptional()
  @IsString()
  interestedProgramId?: string;

  @ApiPropertyOptional({ enum: LeadSourceEnum, default: LeadSourceEnum.WEBSITE })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'user-counselor-id' })
  @IsOptional()
  @IsString()
  counsellorUserId?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({ enum: LeadQualityEnum, default: LeadQualityEnum.WARM })
  @IsOptional()
  @IsString()
  leadQuality?: string;

  @ApiPropertyOptional({ example: 'Inquired about B.Tech CSE AI & ML specialization.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'Rohan Sharma' })
  @IsOptional()
  @IsString()
  applicantName?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'rohan.sharma@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interestedInstituteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interestedProgramId?: string;

  @ApiPropertyOptional({ enum: LeadSourceEnum })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: LeadStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counsellorUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({ enum: LeadQualityEnum })
  @IsOptional()
  @IsString()
  leadQuality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AssignLeadDto {
  @ApiProperty({ example: 'user-counselor-id' })
  @IsNotEmpty()
  @IsString()
  counsellorUserId: string;

  @ApiPropertyOptional({ example: 'Assigned for priority counseling follow-up.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LeadStatusEnum, example: LeadStatusEnum.CONTACTED })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Spoke with applicant and parent; shared brochure.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RecordFollowUpDto {
  @ApiProperty({ description: 'Inquiry / Lead ID' })
  @IsNotEmpty()
  @IsString()
  inquiryId: string;

  @ApiProperty({ example: 'Discussed scholarship criteria and fee structure options.' })
  @IsNotEmpty()
  @IsString()
  discussionPoints: string;

  @ApiPropertyOptional({ example: 'Needs hostel accommodation & transportation from Gandhinagar.' })
  @IsOptional()
  @IsString()
  applicantNeed?: string;

  @ApiPropertyOptional({ example: 'PHONE_CALL' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ example: 'POSITIVE' })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({ example: '2026-08-25' })
  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({ example: 'Scheduled campus visit on Saturday.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class DocumentAttachmentDto {
  @ApiProperty({ example: '10TH_MARKSHEET' })
  @IsNotEmpty()
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'https://storage.ssiu.edu.in/docs/10th_marksheet.pdf' })
  @IsNotEmpty()
  @IsString()
  documentUrl: string;

  @ApiPropertyOptional({ example: '10th Standard Board Marksheet' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateApplicationDto {
  @ApiPropertyOptional({ example: 'inq-uuid' })
  @IsOptional()
  @IsString()
  inquiryId?: string;

  @ApiPropertyOptional({ example: 'cycle-2026-id' })
  @IsOptional()
  @IsString()
  admissionCycleId?: string;

  @ApiProperty({ example: 'inst-sscit-id' })
  @IsNotEmpty()
  @IsString()
  instituteId: string;

  @ApiProperty({ example: 'prog-cse-id' })
  @IsNotEmpty()
  @IsString()
  programId: string;

  @ApiPropertyOptional({ example: 'REGULAR' })
  @IsOptional()
  @IsString()
  admissionType?: string;

  @ApiProperty({ example: 'Rohan' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Manoj' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Sharma' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'rohan.sharma@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '2006-05-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Ahmedabad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Gujarat' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '123 Swarrnim Residency, Gandhinagar' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '12th Science' })
  @IsOptional()
  @IsString()
  qualifyingExam?: string;

  @ApiPropertyOptional({ example: 'GSEB' })
  @IsOptional()
  @IsString()
  qualifyingBoard?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  passingYear?: number;

  @ApiPropertyOptional({ example: 86.5 })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ type: [DocumentAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentAttachmentDto)
  documents?: DocumentAttachmentDto[];
}

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  @IsNotEmpty()
  @IsString()
  documentId: string;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  isApproved: boolean;

  @ApiPropertyOptional({ example: 'Original marksheet verified against board portal.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class VerifyApplicationDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  isVerified: boolean;

  @ApiPropertyOptional({ example: 'All mandatory certificates verified and eligibility confirmed.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveAdmissionDto {
  @ApiPropertyOptional({ example: 'Admitted into B.Tech CSE (General Category Merit Seat)' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  meritRank?: number;

  @ApiPropertyOptional({ example: 'OPEN' })
  @IsOptional()
  @IsString()
  allocatedCategory?: string;
}

export class RejectAdmissionDto {
  @ApiProperty({ example: 'Does not satisfy minimum 50% PCM eligibility criterion.' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

export class EnrollStudentDto {
  @ApiPropertyOptional({ example: 'batch-2026-cse-id' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 'div-a-id' })
  @IsOptional()
  @IsString()
  divisionId?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYearCode?: string;

  @ApiPropertyOptional({ example: 'SSIU2026CSE042' })
  @IsOptional()
  @IsString()
  customEnrollmentNo?: string;
}

export class LeadQueryDto {
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

  @ApiPropertyOptional({ enum: LeadStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: LeadSourceEnum })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'user-counselor-id' })
  @IsOptional()
  @IsString()
  counsellorUserId?: string;

  @ApiPropertyOptional({ example: 'prog-cse-id' })
  @IsOptional()
  @IsString()
  interestedProgramId?: string;

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  interestedInstituteId?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Rohan' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ApplicationQueryDto {
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

  @ApiPropertyOptional({ example: 'inst-sscit-id' })
  @IsOptional()
  @IsString()
  instituteId?: string;

  @ApiPropertyOptional({ example: 'prog-cse-id' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ example: 'SUBMITTED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Rohan' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AssignFinalEnrollmentDto {
  @ApiProperty({ example: '2026CE000123', description: 'Final Enrollment Number assigned by University' })
  @IsNotEmpty()
  @IsString()
  finalEnrollmentNo: string;

  @ApiPropertyOptional({ example: 'Final university enrollment number verified and assigned.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ResetAccessCodeDto {
  @ApiPropertyOptional({ example: 'Student requested access code reset.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

