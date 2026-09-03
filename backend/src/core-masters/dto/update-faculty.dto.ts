import { IsOptional, IsString, IsEmail, IsIn } from 'class-validator';

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'ON_LEAVE', 'TRANSFERRED', 'RESIGNED', 'RETIRED', 'INACTIVE'])
  status?: string;
}
