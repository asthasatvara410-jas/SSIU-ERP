import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { CreateEmployeeDto, ApplyLeaveDto, RecordAttendanceDto } from './dto/hr.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { RequireRole } from '../rbac/require-role.decorator';
import { RequireScope } from '../rbac/require-scope.decorator';

@ApiTags('University HR, Employee & Payroll Management')
@ApiBearerAuth()
@Controller('api/v1/hr')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get HR Dashboard KPIs & Statistics' })
  getHrDashboardMetrics() {
    return this.hrService.getHrDashboardMetrics();
  }

  // ── Employees
  @Post('employees')
  @RequireRole('HR_ADMIN', 'HR_OFFICER', 'REGISTRAR', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('HR', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Employee record' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Get('employees')
  @RequirePermission('HR', 'VIEW')
  @ApiOperation({ summary: 'List Employees' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.hrService.getEmployees(departmentId, status, search);
  }

  @Get('employees/:id')
  @RequirePermission('HR', 'VIEW')
  @ApiOperation({ summary: 'Get Employee detail with service history and leave balance' })
  getEmployeeById(@Param('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Post('employees/:id/documents')
  @RequireRole('HR_ADMIN', 'HR_OFFICER', 'REGISTRAR', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('HR', 'EDIT')
  @ApiOperation({ summary: 'Upload and verify employee document' })
  uploadEmployeeDocument(@Param('id') id: string, @Body() body: any) {
    return this.hrService.uploadEmployeeDocument(id, body);
  }

  // ── Attendance
  @Post('attendance')
  @RequirePermission('HR', 'CREATE')
  @ApiOperation({ summary: 'Record employee attendance (Check-in/Check-out)' })
  recordAttendance(@Body() dto: RecordAttendanceDto) {
    return this.hrService.recordAttendance(dto);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance report' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'date', required: false })
  getAttendance(@Query('employeeId') employeeId?: string, @Query('date') date?: string) {
    return this.hrService.getAttendance(employeeId, date);
  }

  // ── Duty Requests (WFH / On Duty)
  @Post('duty')
  @ApiOperation({ summary: 'Submit Duty Request (WFH, On-Duty, Conference, Official Visit)' })
  applyDutyRequest(@Body() body: any) {
    return this.hrService.applyDutyRequest(body);
  }

  @Get('duty')
  @ApiOperation({ summary: 'Get Duty Requests' })
  @ApiQuery({ name: 'employeeId', required: false })
  getDutyRequests(@Query('employeeId') employeeId?: string) {
    return this.hrService.getDutyRequests(employeeId);
  }

  @Patch('duty/:id/approve')
  @ApiOperation({ summary: 'Approve Duty Request' })
  approveDutyRequest(@Param('id') id: string, @Req() req: any) {
    return this.hrService.approveDutyRequest(id, req.user.id);
  }

  // ── Leaves & Holidays
  @Get('leave-types')
  @ApiOperation({ summary: 'List Leave Types (CL, SL, EL, ML, PL)' })
  getLeaveTypes() {
    return this.hrService.getLeaveTypes();
  }

  @Post('leaves/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Employee submits leave application' })
  applyLeave(@Body() dto: ApplyLeaveDto) {
    return this.hrService.applyLeave(dto);
  }

  @Get('leaves')
  @ApiOperation({ summary: 'Get leave applications' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getLeaves(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return this.hrService.getLeaveApplications(employeeId, status);
  }

  @Patch('leaves/:id/approve')
  @ApiOperation({ summary: 'Approve leave application' })
  approveLeave(@Param('id') id: string) {
    return this.hrService.approveLeave(id);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Get University Holiday Calendar' })
  getHolidays() {
    return this.hrService.getHolidays();
  }

  // ── Appraisal
  @Get('appraisal/cycles')
  @ApiOperation({ summary: 'Get Performance Appraisal Cycles' })
  getAppraisalCycles() {
    return this.hrService.getAppraisalCycles();
  }

  @Post('appraisal/self-review')
  @ApiOperation({ summary: 'Employee submits appraisal self review' })
  submitSelfReview(@Body() body: any) {
    return this.hrService.submitAppraisalSelfReview(body);
  }

  // ── Payroll & Payslips
  @Post('payroll/process')
  @ApiOperation({ summary: 'Process monthly employee payroll' })
  processPayroll(@Body('month') month: number, @Body('year') year: number) {
    return this.hrService.processPayroll(month || new Date().getMonth() + 1, year || new Date().getFullYear());
  }

  @Get('payroll/payslips')
  @ApiOperation({ summary: 'Get Payslips' })
  @ApiQuery({ name: 'employeeId', required: false })
  getPayslips(@Query('employeeId') employeeId?: string) {
    return this.hrService.getPayslips(employeeId);
  }

  // ── Recruitment
  @Post('recruitment/requisitions')
  @ApiOperation({ summary: 'Create Job Requisition' })
  createJobRequisition(@Body() body: any) {
    return this.hrService.createJobRequisition(body);
  }

  @Get('recruitment/requisitions')
  @ApiOperation({ summary: 'Get Job Requisitions & Pipeline' })
  getJobRequisitions() {
    return this.hrService.getJobRequisitions();
  }

  @Post('recruitment/apply')
  @ApiOperation({ summary: 'Submit Job Application' })
  applyForJob(@Body() body: any) {
    return this.hrService.applyForJob(body);
  }

  // ── Resignation & Exit Clearance
  @Post('resignation/submit')
  @ApiOperation({ summary: 'Submit Employee Resignation' })
  submitResignation(@Body() body: any) {
    return this.hrService.submitResignation(body);
  }

  @Get('resignation')
  @ApiOperation({ summary: 'Get Resignation Requests & Exit Clearances' })
  getResignations() {
    return this.hrService.getResignations();
  }
}
