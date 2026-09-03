import { IsNotEmpty, IsString } from 'class-validator';

export class MapStudentMentorDto {
  @IsNotEmpty({ message: 'Student ID is required.' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Mentor Faculty ID is required.' })
  @IsString()
  mentorFacultyId: string;

  @IsNotEmpty({ message: 'Academic Year ID is required.' })
  @IsString()
  academicYearId: string;
}
