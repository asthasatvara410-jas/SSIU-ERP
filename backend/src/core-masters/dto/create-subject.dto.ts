import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsIn } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty({ message: 'Subject code is required.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Subject name is required.' })
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  credits: number;

  @IsOptional()
  @IsIn(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE'])
  type?: string;

  @IsOptional()
  @IsIn(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE'])
  subjectType?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsNotEmpty({ message: 'Program ID is required.' })
  @IsString()
  programId: string;

  @IsOptional()
  @IsString()
  semesterId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  semesterNumber?: number;
}
