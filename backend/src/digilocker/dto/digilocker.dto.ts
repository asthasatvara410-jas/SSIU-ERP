import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsentDto {
  @ApiProperty({ description: 'Citizen consent decision', example: true })
  @IsBoolean()
  consentGiven: boolean;

  @ApiPropertyOptional({ description: 'Consent policy version', example: 'v1.0' })
  @IsOptional()
  @IsString()
  consentVersion?: string;
}

export class InitiateConnectDto {
  @ApiPropertyOptional({ description: 'Optional OAuth callback override URL' })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class CallbackDto {
  @ApiProperty({ description: 'OAuth2 authorization code returned by DigiLocker', example: 'dl_auth_code_123' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'CSRF state verification token', example: 'dl_state_abc' })
  @IsNotEmpty()
  @IsString()
  state: string;
}

export class IssueDocumentDto {
  @ApiProperty({ description: 'Student UUID', example: 'student-uuid-123' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ 
    description: 'Document credential category', 
    enum: ['DEGREE', 'MARKSHEET', 'TRANSCRIPT', 'PROVISIONAL', 'MIGRATION'],
    example: 'DEGREE' 
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['DEGREE', 'MARKSHEET', 'TRANSCRIPT', 'PROVISIONAL', 'MIGRATION'])
  documentType: string;

  @ApiProperty({ description: 'Unique document or certificate number', example: 'DEG-SSIU-2026-001' })
  @IsNotEmpty()
  @IsString()
  documentNumber: string;

  @ApiPropertyOptional({ description: 'Internal DMS document UUID reference' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Structured academic metadata payload' })
  @IsOptional()
  metadata?: any;
}

export class SyncDocumentDto {
  @ApiPropertyOptional({ description: 'Unique correlation ID for tracing', example: 'sync-1788172000' })
  @IsOptional()
  @IsString()
  correlationId?: string;
}

export class RetrySyncDto {
  @ApiPropertyOptional({ description: 'Failed sync log UUID to retry' })
  @IsOptional()
  @IsString()
  syncLogId?: string;

  @ApiPropertyOptional({ description: 'DigiLocker document record UUID' })
  @IsOptional()
  @IsString()
  documentId?: string;
}
