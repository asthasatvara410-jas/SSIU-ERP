import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class CreateProgramDto {
  @IsNotEmpty({ message: 'Program code is required.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Program name is required.' })
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  degree: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  durationYears: number;

  @IsNotEmpty({ message: 'Department ID is required.' })
  @IsString()
  departmentId: string;
}
