import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class MapStudentFacultyDto {
  @IsNotEmpty({ message: 'Student ID is required.' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Subject ID is required.' })
  @IsString()
  subjectId: string;

  @IsNotEmpty({ message: 'Faculty ID is required.' })
  @IsString()
  facultyId: string;

  @IsOptional()
  @IsIn(['COURSE_TEACHER', 'LAB_INSTRUCTOR'])
  mappingType?: string = 'COURSE_TEACHER';
}
