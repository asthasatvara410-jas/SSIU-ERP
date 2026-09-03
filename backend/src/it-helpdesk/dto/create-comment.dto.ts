import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Comment message is required.' })
  @IsString()
  @MaxLength(3000, { message: 'Comment cannot exceed 3000 characters.' })
  message: string;

  @IsOptional()
  @IsString()
  messageType?: 'USER_MESSAGE' | 'STAFF_RESPONSE' | 'INTERNAL_NOTE';

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
