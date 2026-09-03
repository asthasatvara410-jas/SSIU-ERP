import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Reset token is required.' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'New password is required.' })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long.' })
  newPassword: string;
}
