import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoreMastersService } from './core-masters.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Core University Masters & Academic Structure')
@ApiBearerAuth()
@Controller('api/v1')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CoreMastersController {
  constructor(private readonly coreMastersService: CoreMastersService) {}

  @ApiOperation({ summary: 'Get University Master details' })
  @Get('university')
  async getUniversity() {
    const list = await this.coreMastersService.getUniversities();
    return list[0] || null;
  }

  // 2. Institutes Master
  @ApiOperation({ summary: 'List all Institutes' })
  @Get('institutes')
  async getInstitutes() {
    return this.coreMastersService.getInstitutes();
  }

  @ApiOperation({ summary: 'Create new Institute' })
  @Post('institutes')
  @RequirePermission('RBAC', 'APPROVE')
  async createInstitute(@Body() dto: CreateInstituteDto) {
    return this.coreMastersService.createInstitute(dto);
  }

  @ApiOperation({ summary: 'Update Institute details' })
  @Patch('institutes/:id')
  @RequirePermission('RBAC', 'APPROVE')
  async updateInstitute(@Param('id') id: string, @Body() dto: Partial<CreateInstituteDto>) {
    return this.coreMastersService.updateInstitute(id, dto);
  }

  // 3. Departments Master
  @ApiOperation({ summary: 'List Departments' })
  @Get('departments')
  async getDepartments(@Query('instituteId') instituteId?: string) {
    return this.coreMastersService.getDepartments(instituteId);
  }

  @ApiOperation({ summary: 'Create new Department' })
  @Post('departments')
  @RequirePermission('RBAC', 'APPROVE')
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.coreMastersService.createDepartment(dto);
  }

  @ApiOperation({ summary: 'Update Department details' })
  @Patch('departments/:id')
  @RequirePermission('RBAC', 'APPROVE')
  async updateDepartment(@Param('id') id: string, @Body() dto: Partial<CreateDepartmentDto>) {
    return this.coreMastersService.updateDepartment(id, dto);
  }

  // 4. Programs Master
  @ApiOperation({ summary: 'List Programs' })
  @Get('programs')
  async getPrograms(@Query('departmentId') departmentId?: string) {
    return this.coreMastersService.getPrograms(departmentId);
  }

  @ApiOperation({ summary: 'Create new Program' })
  @Post('programs')
  @RequirePermission('RBAC', 'APPROVE')
  async createProgram(@Body() dto: CreateProgramDto) {
    return this.coreMastersService.createProgram(dto);
  }

  @ApiOperation({ summary: 'Update Program details' })
  @Patch('programs/:id')
  @RequirePermission('RBAC', 'APPROVE')
  async updateProgram(@Param('id') id: string, @Body() dto: Partial<CreateProgramDto>) {
    return this.coreMastersService.updateProgram(id, dto);
  }

  // 5. Academic Years Master
  @ApiOperation({ summary: 'List Academic Years' })
  @Get('academic-years')
  async getAcademicYears() {
    return this.coreMastersService.getAcademicYears();
  }

  @ApiOperation({ summary: 'Create Academic Year' })
  @Post('academic-years')
  @RequirePermission('RBAC', 'APPROVE')
  async createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.coreMastersService.createAcademicYear(dto);
  }

  @ApiOperation({ summary: 'Update Academic Year' })
  @Patch('academic-years/:id')
  @RequirePermission('RBAC', 'APPROVE')
  async updateAcademicYear(@Param('id') id: string, @Body() dto: Partial<CreateAcademicYearDto>) {
    return this.coreMastersService.updateAcademicYear(id, dto);
  }

  // 6. Subjects / Courses Master & Structure
  @ApiOperation({ summary: 'List Subjects / Courses' })
  @Get('academic/subjects')
  async getSubjects(
    @Query('departmentId') departmentId?: string,
    @Query('programId') programId?: string,
    @Query('semesterNumber') semesterNumber?: number
  ) {
    return this.coreMastersService.getSubjects(departmentId, programId, semesterNumber);
  }

  @ApiOperation({ summary: 'Create Subject / Course' })
  @Post('academic/subjects')
  @RequirePermission('STUDENT', 'CREATE')
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.coreMastersService.createSubject(dto);
  }

  @ApiOperation({ summary: 'Update Subject / Course' })
  @Patch('academic/subjects/:id')
  @RequirePermission('STUDENT', 'EDIT')
  async updateSubject(@Param('id') id: string, @Body() dto: Partial<CreateSubjectDto>) {
    return this.coreMastersService.updateSubject(id, dto);
  }

  // ── Central User Management ──
  @ApiOperation({ summary: 'Get Central User Directory with pagination and filtering' })
  @Get('users')
  @RequirePermission('SETTINGS', 'VIEW')
  async getUsers(@Query() query: PaginationQueryDto, @Req() req: any) {
    return this.coreMastersService.getUsers(query, req.user);
  }

  // 7. Student Management APIs
  @ApiOperation({ summary: 'Get Student Directory with pagination and filtering' })
  @Get('students')
  @RequirePermission('STUDENT', 'VIEW')
  async getStudents(@Query() query: PaginationQueryDto) {
    return this.coreMastersService.getStudents(query);
  }

  @ApiOperation({ summary: 'Get Student details by ID' })
  @Get('students/:id')
  @RequirePermission('STUDENT', 'VIEW')
  async getStudentById(@Param('id') id: string) {
    return this.coreMastersService.getStudentById(id);
  }

  @ApiOperation({ summary: 'Get Student Academic Profile (Courses, Teachers, Mentors)' })
  @Get('students/:id/academic-profile')
  @RequirePermission('STUDENT', 'VIEW')
  async getStudentAcademicProfile(@Param('id') id: string) {
    return this.coreMastersService.getStudentAcademicProfile(id);
  }

  @ApiOperation({ summary: 'Create new Student Record' })
  @Post('students')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('STUDENT', 'CREATE')
  async createStudent(@Body() dto: CreateStudentDto) {
    return this.coreMastersService.createStudent(dto);
  }

  @ApiOperation({ summary: 'Update Student details or status' })
  @Patch('students/:id')
  @RequirePermission('STUDENT', 'EDIT')
  async updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto, @Req() req: any) {
    return this.coreMastersService.updateStudent(id, dto, req.user);
  }

  @ApiOperation({ summary: 'Authorized Bulk Student Import' })
  @Post('students/bulk-import')
  @RequirePermission('STUDENT', 'CREATE')
  async bulkImportStudents(@Body() body: { students: CreateStudentDto[] }) {
    return this.coreMastersService.bulkImportStudents(body.students || []);
  }

  // 8. Faculty Management APIs
  @ApiOperation({ summary: 'Get Faculty Directory with pagination and filtering' })
  @Get('faculty')
  @RequirePermission('FACULTY', 'VIEW')
  async getFaculty(@Query() query: PaginationQueryDto) {
    return this.coreMastersService.getFaculty(query);
  }

  @ApiOperation({ summary: 'Get Faculty details by ID' })
  @Get('faculty/:id')
  @RequirePermission('FACULTY', 'VIEW')
  async getFacultyById(@Param('id') id: string) {
    return this.coreMastersService.getFacultyById(id);
  }

  @ApiOperation({ summary: 'Create new Faculty Record' })
  @Post('faculty')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('FACULTY', 'CREATE')
  async createFaculty(@Body() dto: CreateFacultyDto) {
    return this.coreMastersService.createFaculty(dto);
  }

  @ApiOperation({ summary: 'Update Faculty details or status' })
  @Patch('faculty/:id')
  @RequirePermission('FACULTY', 'EDIT')
  async updateFaculty(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.coreMastersService.updateFaculty(id, dto);
  }

  @ApiOperation({ summary: 'Authorized Bulk Faculty Import' })
  @Post('faculty/bulk-import')
  @RequirePermission('FACULTY', 'CREATE')
  async bulkImportFaculty(@Body() body: { faculty: CreateFacultyDto[] }) {
    return this.coreMastersService.bulkImportFaculty(body.faculty || []);
  }
}
