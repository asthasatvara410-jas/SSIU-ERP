import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEstimateItemDto {
  @IsString()
  @IsNotEmpty()
  itemName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string = 'Nos';

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;
}

export class CreateNoteSheetAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'JPEG', 'PNG', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'])
  fileType!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fileSize?: number;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

export class CreateNoteSheetDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  subject?: string; // Fallback alias

  @IsString()
  @IsNotEmpty()
  department!: string; // e.g. EXAM, HOSTEL, ACCOUNTS, ADMIN, ADMISSION, TRANSPORT, STUDENT_SECTION, CSE, IT, etc.

  @IsOptional()
  @IsString()
  section?: string; // e.g. Conduct, Evaluation, Mess, Boys Hostel, Block A

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'low', 'medium', 'high', 'urgent'])
  priority?: string = 'MEDIUM';

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  proposal!: string;

  @IsString()
  @IsNotEmpty()
  purposeJustification!: string;

  @IsOptional()
  @IsBoolean()
  budgetRequired?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number = 0;

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
  @IsString()
  instituteId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean = false;

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
