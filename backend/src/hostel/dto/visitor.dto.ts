import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum VisitorStatusEnum {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
}

export enum VisitorRelationEnum {
  PARENT = 'PARENT',
  GUARDIAN = 'GUARDIAN',
  SIBLING = 'SIBLING',
  RELATIVE = 'RELATIVE',
  FRIEND = 'FRIEND',
  OFFICIAL = 'OFFICIAL',
  OTHER = 'OTHER',
}

export enum VisitorIdProofEnum {
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VOTER_ID = 'VOTER_ID',
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER',
}

export class CreateVisitorRequestDto {
  @ApiPropertyOptional({ example: 'stu-uuid-01' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'hostel-boys-a-id' })
  @IsOptional()
  @IsString()
  hostelId?: string;

  @ApiPropertyOptional({ example: 'room-101-id' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ example: 'Mukesh Sharma' })
  @IsNotEmpty()
  @IsString()
  visitorName: string;

  @ApiProperty({ enum: VisitorRelationEnum, example: VisitorRelationEnum.PARENT })
  @IsNotEmpty()
  @IsString()
  relation: string;

  @ApiProperty({ example: 'Delivering semester study materials & personal luggage' })
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiProperty({ example: '9825012345' })
  @IsNotEmpty()
  @IsString()
  contactPhone: string;

  @ApiPropertyOptional({ example: 'mukesh.sharma@example.com' })
  @IsOptional()
  @IsEmail()
  visitorEmail?: string;

  @ApiPropertyOptional({ enum: VisitorIdProofEnum, default: VisitorIdProofEnum.AADHAAR })
  @IsOptional()
  @IsString()
  idProofType?: string;

  @ApiPropertyOptional({ example: '9876-5432-1098' })
  @IsOptional()
  @IsString()
  idProofNumber?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/hostel/aadhaar_proof.pdf' })
  @IsOptional()
  @IsString()
  idProofDocumentUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/hostel/visitor_photo.jpg' })
  @IsOptional()
  @IsString()
  visitorPhotoUrl?: string;

  @ApiPropertyOptional({ example: 'GJ-01-AB-1234' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsString()
  expectedCheckInDate?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsString()
  expectedCheckOutDate?: string;

  @ApiPropertyOptional({ example: 'Visiting between 4:00 PM and 6:00 PM.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateVisitorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorName?: string;

  @ApiPropertyOptional({ enum: VisitorRelationEnum })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  visitorEmail?: string;

  @ApiPropertyOptional({ enum: VisitorIdProofEnum })
  @IsOptional()
  @IsString()
  idProofType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idProofNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idProofDocumentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorPhotoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedCheckInDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedCheckOutDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveVisitorDto {
  @ApiPropertyOptional({ example: 'Visitor request approved for visiting hours.' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ example: 'Approved by Chief Warden' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RejectVisitorDto {
  @ApiProperty({ example: 'Visiting hours are restricted during semester examination days.' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

export class CheckInVisitorDto {
  @ApiPropertyOptional({ enum: VisitorIdProofEnum })
  @IsOptional()
  @IsString()
  idProofType?: string;

  @ApiPropertyOptional({ example: '9876-5432-1098' })
  @IsOptional()
  @IsString()
  idProofNumber?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/hostel/aadhaar_proof.pdf' })
  @IsOptional()
  @IsString()
  idProofDocumentUrl?: string;

  @ApiPropertyOptional({ example: 'GJ-01-AB-1234' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'Gate pass verified and issued.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CheckOutVisitorDto {
  @ApiPropertyOptional({ example: 'Visitor left campus premises safely.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class VisitorQueryDto {
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

  @ApiPropertyOptional({ example: 'hostel-boys-a-id' })
  @IsOptional()
  @IsString()
  hostelId?: string;

  @ApiPropertyOptional({ example: 'stu-uuid-01' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'room-101-id' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ enum: VisitorStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: VisitorRelationEnum })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Mukesh' })
  @IsOptional()
  @IsString()
  search?: string;
}
