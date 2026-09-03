import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsNotEmpty({ message: 'Target status is required.' })
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @IsOptional()
  @IsString()
  resolution?: string;
}
