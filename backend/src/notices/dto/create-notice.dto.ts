import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateNoticeDto {
  @IsNotEmpty({ message: 'Notice title is required.' })
  @IsString()
  @MaxLength(300, { message: 'Title cannot exceed 300 characters.' })
  title: string;

  @IsNotEmpty({ message: 'Notice content is required.' })
  @IsString()
  content: string;

  @IsNotEmpty({ message: 'Category is required.' })
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  priority?: string; // URGENT | HIGH | NORMAL | LOW

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsString()
  scopeType?: string; // UNIVERSITY_WIDE | INSTITUTE_WIDE | DEPARTMENT_WIDE | ROLE_BASED | TARGETED

  @IsOptional()
  @IsString()
  targetInstituteId?: string;

  @IsOptional()
  @IsString()
  targetDepartmentId?: string;

  @IsOptional()
  @IsString()
  targetRole?: string; // ALL | STUDENT | FACULTY | STAFF | HOD | PRINCIPAL

  @IsOptional()
  @IsString()
  publishAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  publishedBy?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  status?: string; // DRAFT | SCHEDULED | PUBLISHED
}
