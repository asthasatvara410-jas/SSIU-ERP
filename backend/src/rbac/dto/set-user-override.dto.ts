import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class SetUserOverrideDto {
  @IsNotEmpty({ message: 'Module name is required.' })
  @IsString()
  module: string;

  @IsNotEmpty({ message: 'Action name is required.' })
  @IsString()
  action: string;

  @IsNotEmpty({ message: 'Granted boolean flag is required.' })
  @IsBoolean()
  granted: boolean;
}
