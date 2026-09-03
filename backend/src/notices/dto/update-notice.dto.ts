import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsString()
  scopeType?: string;

  @IsOptional()
  @IsString()
  targetInstituteId?: string;

  @IsOptional()
  @IsString()
  targetDepartmentId?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

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
  status?: string; // DRAFT | SCHEDULED | PUBLISHED | EXPIRED | ARCHIVED
}
