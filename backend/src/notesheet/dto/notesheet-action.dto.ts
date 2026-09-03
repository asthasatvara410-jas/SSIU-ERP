import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class SubmitNoteSheetDto {
  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  forwardToOffice?: string;
}

export class ApproveNoteSheetDto {
  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  forwardToOffice?: string;
}

export class RejectNoteSheetDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is mandatory.' })
  reason!: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ReturnNoteSheetDto {
  @IsString()
  @IsNotEmpty({ message: 'Return reason is mandatory.' })
  reason!: string;

  @IsOptional()
  @IsString()
  returnToOffice?: string; // Optional target office or creator

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class CloseNoteSheetDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}
