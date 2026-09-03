import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicMappingService } from './academic-mapping.service';
import { MapStudentFacultyDto } from './dto/map-student-faculty.dto';
import { MapStudentMentorDto } from './dto/map-student-mentor.dto';
import { MapFacultySubjectDto } from './dto/map-faculty-subject.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Academic Mappings')
@ApiBearerAuth()
@Controller('api/v1/mappings')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AcademicMappingController {
  constructor(private readonly mappingService: AcademicMappingService) {}

  @ApiOperation({ summary: 'List Student Academic Mappings (Course Teachers & Mentors)' })
  @Get('students')
  async getStudentMappings(
    @Query('studentId') studentId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('subjectId') subjectId?: string
  ) {
    return this.mappingService.getStudentMappings({ studentId, facultyId, subjectId });
  }

  @ApiOperation({ summary: 'Map Student to Subject Course Teacher / Lab Instructor' })
  @Post('student-faculty')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('STUDENT', 'EDIT')
  async mapStudentToFaculty(@Body() dto: MapStudentFacultyDto, @Req() req: any) {
    return this.mappingService.mapStudentToFaculty(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Map Student to Faculty Mentor' })
  @Post('student-mentor')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('STUDENT', 'EDIT')
  async mapStudentToMentor(@Body() dto: MapStudentMentorDto, @Req() req: any) {
    return this.mappingService.mapStudentToMentor(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Map Faculty to Subject & Division' })
  @Post('faculty-subject')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('FACULTY', 'EDIT')
  async mapFacultyToSubject(@Body() dto: MapFacultySubjectDto) {
    return this.mappingService.mapFacultyToSubject(dto);
  }

  @ApiOperation({ summary: 'Deactivate / Remove Academic Mapping' })
  @Delete(':type/:id')
  @RequirePermission('STUDENT', 'DELETE')
  async deactivateMapping(@Param('type') type: 'course' | 'mentor' | 'faculty-subject', @Param('id') id: string) {
    return this.mappingService.deactivateMapping(type, id);
  }

  @ApiOperation({ summary: 'Update Mapping Status' })
  @Patch(':type/:id')
  @RequirePermission('STUDENT', 'EDIT')
  async updateMappingStatus(@Param('type') type: 'course' | 'mentor' | 'faculty-subject', @Param('id') id: string) {
    return this.mappingService.deactivateMapping(type, id);
  }
}
