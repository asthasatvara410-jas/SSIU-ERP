import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class LinkAbcIdDto {
  @ApiProperty({ description: '12-digit National Academic Bank of Credits ID e.g. ABC-123456789012 or 12-digit alphanumeric', example: 'ABC-8940-12345' })
  @IsNotEmpty()
  @IsString()
  abcId!: string;

  @ApiPropertyOptional({ description: 'Academic Year of linking', example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: 'DigiLocker / ABC proof file name or uploaded document URL', example: 'DigiLocker_ABC_Proof.pdf' })
  @IsOptional()
  @IsString()
  proofDocumentUrl?: string;

  @ApiPropertyOptional({ description: 'Remarks from student or mentor', example: 'Submitted via Student Portal' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class VerifyAbcDto {
  @ApiProperty({ description: 'Institutional Verification Decision', enum: ['VERIFIED', 'REJECTED'], example: 'VERIFIED' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Reason for rejection if status is REJECTED', example: 'Mismatch with APAAR/Aadhaar profile name' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Internal verification remarks', example: 'Verified against Digilocker certificate' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SyncAbcDto {
  @ApiPropertyOptional({ description: 'Optional correlation ID for telemetry tracking', example: 'sync-1725100000000' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Force sync bypass cached entries', default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class RetrySyncDto {
  @ApiPropertyOptional({ description: 'Specific sync record ID to retry' })
  @IsOptional()
  @IsString()
  syncRecordId?: string;

  @ApiPropertyOptional({ description: 'Specific student ID to retry sync for' })
  @IsOptional()
  @IsString()
  studentId?: string;
}
