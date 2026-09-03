import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WorkManagementService } from './work-management.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateWorkDiaryDto,
  UpdateWorkDiaryDto,
  SubmitWorkDiaryDto,
  FacultyReviewDto,
  HodReviewDto,
  ApproveWorkDiaryDto,
  RejectWorkDiaryDto,
  WorkDiaryQueryDto,
} from './dto/work-diary.dto';

@ApiTags('My Work & Personal Work Management')
@ApiBearerAuth()
@Controller('api/v1/my-work')
@UseGuards(JwtAuthGuard)
export class WorkManagementController {
  constructor(private readonly workService: WorkManagementService) {}

  private checkNonStudent(req: any) {
    const role: string = req.user?.role || '';
    if (role.toUpperCase() === 'STUDENT') {
      throw new ForbiddenException('Personal Work Diary module is available to University Staff & Faculty only.');
    }
  }

  // ── Work Dashboard Overview
  @Get('dashboard')
  @ApiOperation({ summary: 'Get My Work Dashboard (Tasks, Meetings, Appointments, Reminders)' })
  getWorkDashboard(@Req() req: any) {
    this.checkNonStudent(req);
    return this.workService.getWorkDashboard(req.user.id);
  }

  // ── Work Diary Endpoints ──────────────────────────────────────────────────

  @Post('diary')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Daily Work Diary entry (Draft or Submitted)' })
  @ApiResponse({ status: 201, description: 'Work Diary entry created successfully.' })
  createDiaryEntry(@Req() req: any, @Body() body: CreateWorkDiaryDto) {
    this.checkNonStudent(req);
    return this.workService.createDiaryEntry(req.user, body, false);
  }

  @Post('diary/draft')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save Daily Work Diary as Draft' })
  @ApiResponse({ status: 201, description: 'Work Diary draft saved successfully.' })
  saveDraft(@Req() req: any, @Body() body: CreateWorkDiaryDto) {
    this.checkNonStudent(req);
    return this.workService.saveDraft(req.user, body);
  }

  @Post('diary/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit Work Diary for Faculty and HOD Review' })
  @ApiResponse({ status: 200, description: 'Work Diary submitted for review.' })
  submitDiaryEntry(@Req() req: any, @Param('id') id: string, @Body() body?: SubmitWorkDiaryDto) {
    this.checkNonStudent(req);
    return this.workService.submitDiaryEntry(req.user, id, body);
  }

  @Post('diary/:id/faculty-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty / Mentor Review and Response on Work Diary' })
  @ApiResponse({ status: 200, description: 'Faculty review recorded.' })
  facultyReview(@Req() req: any, @Param('id') id: string, @Body() body: FacultyReviewDto) {
    this.checkNonStudent(req);
    return this.workService.facultyReview(req.user, id, body);
  }

  @Post('diary/:id/hod-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'HOD Review and Decision on Work Diary' })
  @ApiResponse({ status: 200, description: 'HOD review decision recorded.' })
  hodReview(@Req() req: any, @Param('id') id: string, @Body() body: HodReviewDto) {
    this.checkNonStudent(req);
    return this.workService.hodReview(req.user, id, body);
  }

  @Post('diary/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve Work Diary Entry' })
  @ApiResponse({ status: 200, description: 'Work Diary approved successfully.' })
  approveDiaryEntry(@Req() req: any, @Param('id') id: string, @Body() body?: ApproveWorkDiaryDto) {
    this.checkNonStudent(req);
    return this.workService.approveDiaryEntry(req.user, id, body);
  }

  @Post('diary/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject Work Diary Entry with Reason' })
  @ApiResponse({ status: 200, description: 'Work Diary rejected with comments.' })
  rejectDiaryEntry(@Req() req: any, @Param('id') id: string, @Body() body: RejectWorkDiaryDto) {
    this.checkNonStudent(req);
    return this.workService.rejectDiaryEntry(req.user, id, body);
  }

  @Get('diary/:id/history')
  @ApiOperation({ summary: 'Get Chronological Workflow History of a Work Diary' })
  @ApiResponse({ status: 200, description: 'Work Diary history log.' })
  getDiaryHistory(@Req() req: any, @Param('id') id: string) {
    this.checkNonStudent(req);
    return this.workService.getDiaryHistory(req.user, id);
  }

  @Get('diary/stats')
  @ApiOperation({ summary: 'Get Work Diary Dashboard summary statistics' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'instituteId', required: false })
  getDiaryDashboardStats(
    @Req() req: any,
    @Query('departmentId') departmentId?: string,
    @Query('instituteId') instituteId?: string,
  ) {
    this.checkNonStudent(req);
    return this.workService.getDiaryDashboardStats(req.user, departmentId, instituteId);
  }

  @Get('diary')
  @ApiOperation({ summary: 'Get Work Diary entries with date, faculty, department, status filtering, pagination and search' })
  getDiaryEntries(@Req() req: any, @Query() query: WorkDiaryQueryDto) {
    this.checkNonStudent(req);
    return this.workService.getDiaryEntries(req.user, query);
  }

  @Get('diary/:id')
  @ApiOperation({ summary: 'Get Work Diary entry by ID' })
  getDiaryEntryById(@Req() req: any, @Param('id') id: string) {
    this.checkNonStudent(req);
    return this.workService.getDiaryEntryById(req.user, id);
  }

  @Patch('diary/:id')
  @ApiOperation({ summary: 'Update Work Diary entry details' })
  updateDiaryEntry(@Req() req: any, @Param('id') id: string, @Body() body: UpdateWorkDiaryDto) {
    this.checkNonStudent(req);
    return this.workService.updateDiaryEntry(req.user, id, body);
  }

  @Delete('diary/:id')
  @ApiOperation({ summary: 'Delete Work Diary entry' })
  deleteDiaryEntry(@Req() req: any, @Param('id') id: string) {
    this.checkNonStudent(req);
    return this.workService.deleteDiaryEntry(req.user, id);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Work Task' })
  createTask(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.workService.createTask(req.user.id, body);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get Tasks (Personal or Assigned)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assignedToMe', required: false })
  getTasks(@Req() req: any, @Query('status') status?: string, @Query('assignedToMe') assignedToMe?: string) {
    this.checkNonStudent(req);
    return this.workService.getTasks(req.user.id, status, assignedToMe === 'true');
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update Task Status & Next Action' })
  updateTaskStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('nextAction') nextAction?: string,
    @Body('nextActionDate') nextActionDate?: string,
  ) {
    this.checkNonStudent(req);
    return this.workService.updateTaskStatus(req.user.id, id, status, nextAction, nextActionDate);
  }

  @Post('tasks/:id/delegate')
  @ApiOperation({ summary: 'Delegate Task to Team Member' })
  delegateTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body('delegateToUserId') delegateToUserId: string,
    @Body('dueBy') dueBy: string,
    @Body('reason') reason?: string,
  ) {
    this.checkNonStudent(req);
    return this.workService.delegateTask(req.user.id, id, delegateToUserId, dueBy, reason);
  }

  // ── Meetings ──────────────────────────────────────────────────────────────

  @Post('meetings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule Personal Meeting & Invite Participants' })
  createMeeting(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.workService.createMeeting(req.user.id, body);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'Get Meetings' })
  getMeetings(@Req() req: any) {
    this.checkNonStudent(req);
    return this.workService.getMeetings(req.user.id);
  }

  // ── Appointments & Follow-ups ─────────────────────────────────────────────

  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Personal Appointment' })
  createAppointment(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.workService.createAppointment(req.user.id, body);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get Appointments' })
  getAppointments(@Req() req: any) {
    this.checkNonStudent(req);
    return this.workService.getAppointments(req.user.id);
  }

  @Post('follow-ups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Follow-up Tracker' })
  createFollowUp(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.workService.createFollowUp(req.user.id, body);
  }

  @Get('follow-ups')
  @ApiOperation({ summary: 'Get Follow-ups' })
  getFollowUps(@Req() req: any) {
    this.checkNonStudent(req);
    return this.workService.getFollowUps(req.user.id);
  }

  // ── Notes & Calendar ──────────────────────────────────────────────────────

  @Post('notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Private Quick Note' })
  createNote(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.workService.createNote(req.user.id, body);
  }

  @Get('notes')
  @ApiOperation({ summary: 'Get Personal Notes' })
  @ApiQuery({ name: 'search', required: false })
  getNotes(@Req() req: any, @Query('search') search?: string) {
    this.checkNonStudent(req);
    return this.workService.getNotes(req.user.id, search);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get Calendar Aggregated Items' })
  getCalendarItems(@Req() req: any) {
    this.checkNonStudent(req);
    return this.workService.getCalendarItems(req.user.id);
  }

  // ── Work Transfer & Workload Delegation Endpoints ─────────────────────────

  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Workload Transfer & Delegation' })
  @ApiResponse({ status: 201, description: 'Workload transfer successfully registered.' })
  createWorkTransfer(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.workService.createWorkTransfer(req.user, body);
  }

  @Get('transfers/my')
  @ApiOperation({ summary: 'Get My Active & Received Workload Transfers' })
  getMyWorkTransfers(@Req() req: any) {
    this.checkNonStudent(req);
    return this.workService.getMyWorkTransfers(req.user.id);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get All Workload Transfers (Higher Authority Audit)' })
  getAllWorkTransfers(@Req() req: any, @Query() query: any) {
    this.checkNonStudent(req);
    return this.workService.getAllWorkTransfers(query, req.user);
  }

  @Post('transfers/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an Active Workload Transfer' })
  revokeWorkTransfer(@Req() req: any, @Param('id') id: string) {
    this.checkNonStudent(req);
    return this.workService.revokeWorkTransfer(id, req.user);
  }

  @Post('transfers/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a Scheduled Workload Transfer' })
  cancelScheduledTransfer(@Req() req: any, @Param('id') id: string) {
    this.checkNonStudent(req);
    return this.workService.cancelScheduledTransfer(id, req.user);
  }
}
