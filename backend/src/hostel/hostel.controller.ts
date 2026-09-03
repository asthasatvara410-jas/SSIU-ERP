import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HostelService } from './hostel.service';
import {
  CreateVisitorRequestDto,
  UpdateVisitorDto,
  ApproveVisitorDto,
  RejectVisitorDto,
  CheckInVisitorDto,
  CheckOutVisitorDto,
  VisitorQueryDto,
} from './dto/visitor.dto';
import {
  CreateMaintenanceRequestDto,
  AssignMaintenanceDto,
  HoldMaintenanceDto,
  ResolveMaintenanceDto,
  ConfirmResolutionDto,
  ReopenMaintenanceDto,
  MaintenanceQueryDto,
} from './dto/maintenance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { RequireRole } from '../rbac/require-role.decorator';
import { RequireScope } from '../rbac/require-scope.decorator';

@ApiTags('University Hostel & Accommodation Management')
@ApiBearerAuth()
@Controller('api/v1/hostel')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  // ── Dashboard Metrics ───────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Get Hostel Dashboard KPIs, Occupancy & Maintenance Metrics' })
  getHostelDashboardMetrics() {
    return this.hostelService.getHostelDashboardMetrics();
  }

  // ── Hostel Master ─────────────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create Hostel Master' })
  createHostel(@Body() body: any) {
    return this.hostelService.createHostel(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all Hostels with room inventory & active occupancy' })
  getHostels() {
    return this.hostelService.getHostels();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Hostel details' })
  updateHostel(@Param('id') id: string, @Body() body: any) {
    return this.hostelService.updateHostel(id, body);
  }

  // ── Room Management ───────────────────────────────────────────────────────
  @Post('rooms')
  @ApiOperation({ summary: 'Add Room to Hostel' })
  createRoom(@Body() body: any) {
    return this.hostelService.createRoom(body);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List Hostel Rooms' })
  @ApiQuery({ name: 'hostelId', required: false })
  getRooms(@Query('hostelId') hostelId?: string) {
    return this.hostelService.getRooms(hostelId);
  }

  @Get(':id/rooms')
  @ApiOperation({ summary: 'List Rooms for specific Hostel ID' })
  getHostelRooms(@Param('id') id: string) {
    return this.hostelService.getRoomsByHostel(id);
  }

  @Post(':id/rooms')
  @ApiOperation({ summary: 'Create Room under specific Hostel ID' })
  createHostelRoom(@Param('id') id: string, @Body() body: any) {
    return this.hostelService.createRoom({ ...body, hostelId: id });
  }

  @Patch('rooms/:id')
  @ApiOperation({ summary: 'Update Room configurations & capacity' })
  updateRoom(@Param('id') id: string, @Body() body: any) {
    return this.hostelService.updateRoom(id, body);
  }

  // ── Student Hostel Allotments ───────────────────────────────────────────────
  @Post('allotments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Allot Hostel Room and Bed to Student (prevents duplicates and over-capacity)' })
  allotBed(@Body() body: any) {
    return this.hostelService.allotBed(body);
  }

  @Get('allotments')
  @ApiOperation({ summary: 'List Hostel Allotments' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'hostelId', required: false })
  getAllotments(@Query('studentId') studentId?: string, @Query('hostelId') hostelId?: string) {
    return this.hostelService.getAllotments(studentId, hostelId);
  }

  @Patch('allotments/:id')
  @ApiOperation({ summary: 'Update Allotment Status' })
  updateAllotment(@Param('id') id: string, @Body() body: any) {
    return this.hostelService.updateAllotment(id, body);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Transfer student to another bed / room' })
  transferBed(@Body() body: any, @Req() req: any) {
    return this.hostelService.transferBed(body.allotmentId, body.toBedId, body.reason, req.user?.id);
  }

  @Patch('allotments/:id/vacate')
  @ApiOperation({ summary: 'Vacate hostel room allocation' })
  vacateBed(@Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.hostelService.vacateBed(id, remarks);
  }

  // ── Applications & Outpasses ───────────────────────────────────────────────
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit hostel application' })
  submitApplication(@Body() body: any) {
    return this.hostelService.submitApplication(body);
  }

  @Get('applications')
  @ApiOperation({ summary: 'List hostel applications' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getApplications(@Query('studentId') studentId?: string, @Query('status') status?: string) {
    return this.hostelService.getApplications(studentId, status);
  }

  @Patch('applications/:id/approve')
  @ApiOperation({ summary: 'Approve hostel application' })
  approveApplication(@Param('id') id: string, @Req() req: any) {
    return this.hostelService.approveApplication(id, req.user?.id);
  }

  @Post('outpass')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student requests Outpass / Leave' })
  requestOutpass(@Body() body: any) {
    return this.hostelService.requestOutpass(body);
  }

  @Get('outpass')
  @ApiOperation({ summary: 'List Outpass Requests' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getOutpasses(@Query('studentId') studentId?: string, @Query('status') status?: string) {
    return this.hostelService.getOutpasses(studentId, status);
  }

  @Patch('outpass/:id/approve')
  @RequireRole('HOSTEL_WARDEN', 'HOSTEL_ADMIN', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('HOSTEL', 'APPROVE')
  @ApiOperation({ summary: 'Warden approves Outpass' })
  approveOutpass(@Param('id') id: string, @Req() req: any) {
    return this.hostelService.approveOutpass(id, req.user?.id);
  }

  @Post('outpass/batch-checkout')
  @RequireRole('HOSTEL_WARDEN', 'HOSTEL_ADMIN', 'SECURITY', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('HOSTEL', 'CHECK_OUT')
  @ApiOperation({ summary: 'Warden or Gate Security records batch checkout for multiple students' })
  batchCheckoutOutpasses(@Body('outpassIds') outpassIds: string[], @Req() req: any) {
    return this.hostelService.batchCheckoutOutpasses(outpassIds, req.user?.id);
  }

  // ── Visitors Management ───────────────────────────────────────────────────
  @Get('visitors/dashboard')
  @RequirePermission('HOSTEL', 'VIEW')
  @ApiOperation({ summary: 'Get Visitor KPI metrics and current in-hostel status' })
  getVisitorDashboardMetrics(@Req() req: any) {
    return this.hostelService.getVisitorDashboardMetrics(req.user);
  }

  @Post('visitors')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('HOSTEL', 'CREATE')
  @ApiOperation({ summary: 'Register Hostel Visitor Request (Student or Gate Security Entry)' })
  registerVisitor(@Req() req: any, @Body() dto: CreateVisitorRequestDto) {
    return this.hostelService.registerVisitor(req.user, dto);
  }

  @Get('visitors')
  @RequirePermission('HOSTEL', 'VIEW')
  @ApiOperation({ summary: 'List Hostel Visitors with filters' })
  getVisitors(@Req() req: any, @Query() query: VisitorQueryDto) {
    return this.hostelService.getVisitors(req.user, query);
  }

  @Get('visitors/:id')
  @RequirePermission('HOSTEL', 'VIEW')
  @ApiOperation({ summary: 'Get Visitor details and chronological audit logs' })
  getVisitorById(@Req() req: any, @Param('id') id: string) {
    return this.hostelService.getVisitorById(id, req.user);
  }

  @Patch('visitors/:id')
  @RequirePermission('HOSTEL', 'EDIT')
  @ApiOperation({ summary: 'Update Visitor details' })
  updateVisitor(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVisitorDto) {
    return this.hostelService.updateVisitor(id, req.user, dto);
  }

  @Patch('visitors/:id/approve')
  @RequireRole('HOSTEL_WARDEN', 'HOSTEL_ADMIN', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('HOSTEL', 'APPROVE')
  @ApiOperation({ summary: 'Warden approves Visitor Request' })
  approveVisitor(@Req() req: any, @Param('id') id: string, @Body() dto?: ApproveVisitorDto) {
    return this.hostelService.approveVisitor(id, req.user, dto);
  }

  @Patch('visitors/:id/reject')
  @RequireRole('HOSTEL_WARDEN', 'HOSTEL_ADMIN', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('HOSTEL', 'REJECT')
  @ApiOperation({ summary: 'Warden rejects Visitor Request with mandatory reason' })
  rejectVisitor(@Req() req: any, @Param('id') id: string, @Body() dto: RejectVisitorDto) {
    return this.hostelService.rejectVisitor(id, req.user, dto);
  }

  @Patch('visitors/:id/checkin')
  @RequireRole('SECURITY', 'HOSTEL_WARDEN', 'HOSTEL_ADMIN', 'SUPER_ADMIN')
  @RequirePermission('HOSTEL', 'CHECK_IN')
  @ApiOperation({ summary: 'Hostel gate security records Visitor Check-in' })
  checkInVisitor(@Req() req: any, @Param('id') id: string, @Body() dto?: CheckInVisitorDto) {
    return this.hostelService.checkInVisitor(id, req.user, dto);
  }

  @Patch('visitors/:id/checkout')
  @RequireRole('SECURITY', 'HOSTEL_WARDEN', 'HOSTEL_ADMIN', 'SUPER_ADMIN')
  @RequirePermission('HOSTEL', 'CHECK_OUT')
  @ApiOperation({ summary: 'Hostel gate security records Visitor Check-out' })
  checkOutVisitor(@Req() req: any, @Param('id') id: string, @Body() dto?: CheckOutVisitorDto) {
    return this.hostelService.checkOutVisitor(id, req.user, dto);
  }

  @Get('visitors/:id/history')
  @ApiOperation({ summary: 'Get Visitor chronological audit history' })
  getVisitorHistory(@Req() req: any, @Param('id') id: string) {
    return this.hostelService.getVisitorHistory(id, req.user);
  }

  // ── Hostel Maintenance Request Workflow ────────────────────────────────────
  @Post('maintenance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Hostel Maintenance Request (Student / Hostel Staff)' })
  createMaintenanceRequest(@Req() req: any, @Body() dto: CreateMaintenanceRequestDto) {
    return this.hostelService.createMaintenanceRequest(req.user, dto);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'List Maintenance Requests (scoped by Student, Assigned Staff, or Hostel Scope)' })
  getMaintenanceRequests(@Req() req: any, @Query() query: MaintenanceQueryDto) {
    return this.hostelService.getMaintenanceRequests(req.user, query);
  }

  @Get('maintenance/:id')
  @ApiOperation({ summary: 'Get Maintenance Request details with timeline history and attachments' })
  getMaintenanceRequestById(@Req() req: any, @Param('id') id: string) {
    return this.hostelService.getMaintenanceRequestById(id, req.user);
  }

  @Post('maintenance/:id/assign')
  @ApiOperation({ summary: 'Maintenance Head assigns technician staff and sets expected completion' })
  assignMaintenanceRequest(
    @Param('id') id: string,
    @Body() dto: AssignMaintenanceDto,
    @Req() req: any,
  ) {
    return this.hostelService.assignMaintenanceRequest(id, dto, req.user);
  }

  @Post('maintenance/:id/start')
  @ApiOperation({ summary: 'Maintenance Staff starts work on request' })
  startMaintenanceWork(@Param('id') id: string, @Req() req: any) {
    return this.hostelService.startMaintenanceWork(id, req.user);
  }

  @Post('maintenance/:id/hold')
  @ApiOperation({ summary: 'Maintenance Staff puts request on hold with mandatory reason' })
  holdMaintenanceRequest(
    @Param('id') id: string,
    @Body() dto: HoldMaintenanceDto,
    @Req() req: any,
  ) {
    return this.hostelService.holdMaintenanceRequest(id, dto, req.user);
  }

  @Post('maintenance/:id/resolve')
  @ApiOperation({ summary: 'Maintenance Staff marks request as resolved with completion proof' })
  resolveMaintenanceRequest(
    @Param('id') id: string,
    @Body() dto: ResolveMaintenanceDto,
    @Req() req: any,
  ) {
    return this.hostelService.resolveMaintenanceRequest(id, dto, req.user);
  }

  @Post('maintenance/:id/confirm')
  @ApiOperation({ summary: 'Student confirms resolution and closes request with rating' })
  confirmResolution(
    @Param('id') id: string,
    @Body() dto: ConfirmResolutionDto,
    @Req() req: any,
  ) {
    return this.hostelService.confirmResolution(id, dto, req.user);
  }

  @Post('maintenance/:id/reopen')
  @ApiOperation({ summary: 'Student reopens unresolved request with reason (escalates to Head)' })
  reopenMaintenanceRequest(
    @Param('id') id: string,
    @Body() dto: ReopenMaintenanceDto,
    @Req() req: any,
  ) {
    return this.hostelService.reopenMaintenanceRequest(id, dto, req.user);
  }

  @Post('maintenance/:id/close')
  @ApiOperation({ summary: 'Hostel Admin / Warden closes maintenance request' })
  closeMaintenanceRequest(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Req() req: any,
  ) {
    return this.hostelService.closeMaintenanceRequest(id, req.user, remarks);
  }

  // ── Hostel Reports ────────────────────────────────────────────────────────
  @Get('reports')
  @ApiOperation({ summary: 'Generate Hostel reports (Occupancy, Allocations, Visitors, Maintenance, Overdue)' })
  @ApiQuery({ name: 'type', required: true, example: 'HOSTEL_OCCUPANCY' })
  getHostelReports(@Query('type') type: string, @Query() filter: any, @Req() req: any) {
    return this.hostelService.getHostelReports(type, filter, req.user);
  }

  // ── Mess Management ───────────────────────────────────────────────────────
  @Get('mess')
  @ApiOperation({ summary: 'Get Mess list and dining menus' })
  getMesses() {
    return this.hostelService.getMesses();
  }

  @Post('mess/enroll')
  @ApiOperation({ summary: 'Enroll student in mess meal plan' })
  enrollInMess(@Body() body: any) {
    return this.hostelService.enrollInMess(body);
  }
}
