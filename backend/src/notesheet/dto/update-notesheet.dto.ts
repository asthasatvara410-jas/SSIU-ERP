import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEstimateItemDto, CreateNoteSheetAttachmentDto } from './create-notesheet.dto';

export class UpdateNoteSheetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  proposal?: string;

  @IsOptional()
  @IsString()
  purposeJustification?: string;

  @IsOptional()
  @IsBoolean()
  budgetRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  amountInWords?: string;

  @IsOptional()
  @IsString()
  financialImpact?: string;

  @IsOptional()
  @IsString()
  vendorQuotation?: string;

  @IsOptional()
  @IsString()
  requiredDate?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEstimateItemDto)
  items?: CreateEstimateItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNoteSheetAttachmentDto)
  attachments?: CreateNoteSheetAttachmentDto[];
}
