import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'Department code is required.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Department name is required.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Institute ID is required.' })
  @IsString()
  instituteId: string;
}
