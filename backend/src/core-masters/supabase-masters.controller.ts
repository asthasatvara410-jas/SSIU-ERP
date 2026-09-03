import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseMastersService } from './supabase-masters.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUserSession } from '../auth/supabase-session.types';

@ApiTags('Supabase Central Masters & Academic Architecture')
@ApiBearerAuth()
@Controller('api/v1/supabase-master')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SupabaseMastersController {
  constructor(private readonly mastersService: SupabaseMastersService) {}

  // 1. Academic Master
  @Get('academic/universities')
  @ApiOperation({ summary: 'List all Universities' })
  async getUniversities() {
    return this.mastersService.getUniversities();
  }

  @Get('academic/institutes')
  @ApiOperation({ summary: 'List Institutes' })
  async getInstitutes(@Query('universityId') universityId?: string) {
    return this.mastersService.getInstitutes(universityId);
  }

  @Get('academic/departments')
  @ApiOperation({ summary: 'List Departments' })
  async getDepartments(@Query('instituteId') instituteId?: string) {
    return this.mastersService.getDepartments(instituteId);
  }

  @Get('academic/years')
  @ApiOperation({ summary: 'List Academic Years' })
  async getAcademicYears() {
    return this.mastersService.getAcademicYears();
  }

  @Get('academic/programs')
  @ApiOperation({ summary: 'List Programs' })
  async getPrograms(@Query('departmentId') departmentId?: string) {
    return this.mastersService.getPrograms(departmentId);
  }

  @Get('academic/batches')
  @ApiOperation({ summary: 'List Batches' })
  async getBatches(@Query('programId') programId?: string) {
    return this.mastersService.getBatches(programId);
  }

  @Get('academic/semesters')
  @ApiOperation({ summary: 'List Semesters' })
  async getSemesters(@Query('programId') programId?: string) {
    return this.mastersService.getSemesters(programId);
  }

  @Get('academic/divisions')
  @ApiOperation({ summary: 'List Divisions' })
  async getDivisions(@Query('semesterId') semesterId?: string) {
    return this.mastersService.getDivisions(semesterId);
  }

  @Get('academic/subjects')
  @ApiOperation({ summary: 'List Subjects' })
  async getSubjects(
    @Query('programId') programId?: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.mastersService.getSubjects(programId, semesterId);
  }

  // 2. Student Master
  @Get('students')
  @ApiOperation({ summary: 'List Students (Role-Scoped via RLS rules)' })
  async getStudents(
    @CurrentUser() user: AuthenticatedUserSession,
    @Query('departmentId') departmentId?: string,
    @Query('programId') programId?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.mastersService.getStudents(user, { departmentId, programId, batchId });
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get Student Profile by ID (Scoped)' })
  async getStudentById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUserSession,
  ) {
    return this.mastersService.getStudentById(id, user);
  }

  @Patch('students/:id/contact')
  @ApiOperation({ summary: 'Update Student Contact Information' })
  async updateStudentContact(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUserSession,
    @Body() body: { contactNumber?: string; personalEmail?: string; currentAddress?: string },
  ) {
    return this.mastersService.updateStudentContact(id, user, body);
  }

  // 3. Faculty Master
  @Get('faculty')
  @ApiOperation({ summary: 'List Faculty Members' })
  async getFacultyList(
    @CurrentUser() user: AuthenticatedUserSession,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.mastersService.getFacultyList(user, { departmentId });
  }

  // 4. Academic Mappings
  @Get('mappings/allocations')
  @ApiOperation({ summary: 'List Faculty Subject Allocations' })
  async getFacultyAllocations(
    @CurrentUser() user: AuthenticatedUserSession,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.mastersService.getFacultyAllocations(user, academicYearId);
  }

  @Get('mappings/enrollments')
  @ApiOperation({ summary: 'List Student Academic Enrollments' })
  async getStudentEnrollments(
    @CurrentUser() user: AuthenticatedUserSession,
    @Query('studentId') studentId?: string,
  ) {
    return this.mastersService.getStudentEnrollments(user, studentId);
  }
}
