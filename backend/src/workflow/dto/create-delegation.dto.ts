import { IsNotEmpty, IsString, IsDateString, IsInt, Min } from 'class-validator';

export class CreateDelegationDto {
  @IsNotEmpty({ message: 'Delegatee User ID is required.' })
  @IsString()
  delegateeUserId: string;

  @IsNotEmpty({ message: 'Start date is required.' })
  @IsDateString()
  startDate: string;

  @IsNotEmpty({ message: 'End date is required.' })
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsInt()
  @Min(10)
  minAuthorityLevel: number;
}
