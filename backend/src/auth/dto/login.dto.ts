import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'ERP ID or Username is required.' })
  @IsString()
  loginId: string; // Accepts ERP ID (e.g. ADM000001) or Username

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;
}
