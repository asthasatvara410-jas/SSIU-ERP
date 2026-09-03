import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'Ticket category is required.' })
  @IsString()
  category: string;

  @IsNotEmpty({ message: 'Ticket title is required.' })
  @IsString()
  @MaxLength(200, { message: 'Title cannot exceed 200 characters.' })
  title: string;

  @IsNotEmpty({ message: 'Ticket description is required.' })
  @IsString()
  @MaxLength(4000, { message: 'Description cannot exceed 4000 characters.' })
  description: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
