import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class AssignTicketDto {
  @IsNotEmpty({ message: 'Target user ID is required.' })
  @IsString()
  assignedToUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
