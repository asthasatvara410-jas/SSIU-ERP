import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, IsArray } from 'class-validator';

export class LinkABCDto {
  @IsNotEmpty()
  @IsString()
  abcId: string;
}

export class SyncCreditsDto {
  @IsOptional()
  @IsArray()
  courseCodes?: string[];

  @IsOptional()
  @IsNumber()
  semester?: number;
}

export class ConnectDigiLockerDto {
  @IsNotEmpty()
  @IsString()
  providerUserReference: string;
}

export class PublishCredentialDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['DEGREE', 'DIPLOMA', 'MARKSHEET', 'TRANSCRIPT', 'CERTIFICATE', 'OTHER'])
  credentialType: string;

  @IsNotEmpty()
  @IsString()
  credentialNumber: string;

  @IsNotEmpty()
  @IsString()
  documentId: string;
}

export class WebhookPayloadDto {
  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsOptional()
  data?: any;
}
