import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateUniversityDto {
  @IsNotEmpty({ message: 'University code is required.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'University name is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
