import { IsNotEmpty, IsString } from 'class-validator';

export class MapFacultySubjectDto {
  @IsNotEmpty({ message: 'Faculty ID is required.' })
  @IsString()
  facultyId: string;

  @IsNotEmpty({ message: 'Subject ID is required.' })
  @IsString()
  subjectId: string;

  @IsNotEmpty({ message: 'Division ID is required.' })
  @IsString()
  divisionId: string;

  @IsNotEmpty({ message: 'Semester ID is required.' })
  @IsString()
  semesterId: string;
}
