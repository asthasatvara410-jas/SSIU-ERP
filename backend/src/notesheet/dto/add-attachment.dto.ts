import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddNoteSheetAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'JPEG', 'PNG',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'
  ], {
    message: 'Allowed file types are PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG.',
  })
  fileType!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fileSize?: number;

  @IsOptional()
  @IsString()
  documentCategory?: string;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}
