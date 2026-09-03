import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'ERP ID, Username or Email is required.' })
  @IsString()
  identifier: string;
}
