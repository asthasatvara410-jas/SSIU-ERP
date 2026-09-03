import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Body, 
  Param, 
  Query, 
  Req, 
  Headers,
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { 
  SubmitFeedbackDto, 
  SubmitSuggestionDto, 
  UpdateSuggestionActionDto, 
  FeedbackFilterQueryDto,
  SubmitAnonymousGrievanceDto,
  TrackAnonymousGrievanceDto,
  UpdateGrievanceStatusDto,
  GrievanceFilterQueryDto,
  EscalateGrievanceDto,
  AssignGrievanceDto,
  ResolveGrievanceDto,
  ReopenGrievanceDto
} from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('Student Feedback & Grievance Management')
@Controller('api/v1/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // -------------------------------------------------------------------------
  // PUBLIC ANONYMOUS GRIEVANCE ENDPOINTS (ZERO AUTH / NO LOGIN REQUIRED)
  // -------------------------------------------------------------------------

  @Post('anonymous-grievance')
  @ApiOperation({ summary: 'Submit anonymous grievance with zero submitter identity exposure' })
  submitAnonymousGrievance(
    @Body() dto: SubmitAnonymousGrievanceDto,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.submitAnonymousGrievance(dto, tenantId || 'DEFAULT');
  }

  @Post('track-grievance')
  @ApiOperation({ summary: 'Track anonymous grievance status using public reference and tracking token' })
  trackAnonymousGrievance(
    @Body() dto: TrackAnonymousGrievanceDto,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.trackAnonymousGrievance(dto.reference, dto.trackingToken, tenantId || 'DEFAULT');
  }

  // -------------------------------------------------------------------------
  // PROTECTED STUDENT FEEDBACK ENDPOINTS
  // -------------------------------------------------------------------------

  @Get('student/targets')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get valid feedback targets (Subjects, Faculty, Mentor, HOD, HOI) for current student' })
  getStudentTargets(@Req() req: any) {
    return this.feedbackService.getStudentFeedbackTargets(req.user);
  }

  @Post('student/submit')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback across any of the 7 feedback categories' })
  submitFeedback(@Body() dto: SubmitFeedbackDto, @Req() req: any) {
    return this.feedbackService.submitFeedback(dto, req.user);
  }

  @Post('student/suggestions')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit student improvement suggestion' })
  submitSuggestion(@Body() dto: SubmitSuggestionDto, @Req() req: any) {
    return this.feedbackService.submitSuggestion(dto, req.user);
  }

  @Get('faculty/summary')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated feedback metrics for logged in faculty' })
  getFacultySummary(@Req() req: any) {
    return this.feedbackService.getFacultyFeedbackSummary(req.user);
  }

  @Get('mentor/summary')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated mentorship feedback metrics for logged in mentor' })
  getMentorSummary(@Req() req: any) {
    return this.feedbackService.getMentorFeedbackSummary(req.user);
  }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get University / Departmental feedback & suggestion analytics' })
  getAdminDashboard(@Query() query: FeedbackFilterQueryDto, @Req() req: any) {
    return this.feedbackService.getAdminDashboardStats(query, req.user);
  }

  @Post('admin/suggestions/:id/action')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update suggestion status or route to department' })
  updateSuggestionAction(
    @Param('id') id: string, 
    @Body() dto: UpdateSuggestionActionDto, 
    @Req() req: any
  ) {
    return this.feedbackService.updateSuggestionAction(id, dto, req.user);
  }

  // -------------------------------------------------------------------------
  // PROTECTED AUTHORIZED GRIEVANCE MANAGEMENT ENDPOINTS
  // -------------------------------------------------------------------------

  @Get('grievances')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List grievances for authorized officers (HOD/HOI/IQAC/Admin)' })
  listAuthorizedGrievances(
    @Query() query: GrievanceFilterQueryDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.listAuthorizedGrievances(query, req.user, tenantId || 'DEFAULT');
  }

  @Get('grievances/:id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get grievance details (Identity strictly shielded for anonymous grievances)' })
  getGrievanceDetails(
    @Param('id') id: string,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.getGrievanceDetails(id, req.user, tenantId || 'DEFAULT');
  }

  @Patch('grievances/:id/status')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update grievance workflow status, assign officer, or resolve case' })
  updateGrievanceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGrievanceStatusDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.updateGrievanceStatus(id, dto, req.user, tenantId || 'DEFAULT');
  }

  // -------------------------------------------------------------------------
  // STAGE 9.2 — ESCALATION ENGINE ENDPOINTS
  // -------------------------------------------------------------------------

  @Get('escalations/queue')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active escalation queue with live SLA statuses and assigned hierarchy' })
  getEscalationQueue(
    @Query() query: GrievanceFilterQueryDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.getEscalationQueue(query, req.user, tenantId || 'DEFAULT');
  }

  @Get('escalations/analytics')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get escalation analytics, SLA compliance, and NAAC/IQAC evidence metrics' })
  getEscalationAnalytics(
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.getEscalationAnalytics(tenantId || 'DEFAULT', req.user);
  }

  @Post('escalations/process-sla')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger background SLA processing and automatic breach escalations (Idempotent)' })
  processSlaEscalations(
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.processSlaEscalations(tenantId || 'DEFAULT', req.user);
  }

  @Post('escalations/:id/escalate')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually escalate grievance to higher institutional authority level' })
  escalateGrievance(
    @Param('id') id: string,
    @Body() dto: EscalateGrievanceDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.escalateGrievance(id, dto, req.user, tenantId || 'DEFAULT');
  }

  @Post('escalations/:id/assign')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign grievance to designated officer or committee' })
  assignGrievance(
    @Param('id') id: string,
    @Body() dto: AssignGrievanceDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.assignGrievance(id, dto, req.user, tenantId || 'DEFAULT');
  }

  @Post('escalations/:id/resolve')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Formally resolve grievance with resolution summary and corrective actions' })
  resolveGrievance(
    @Param('id') id: string,
    @Body() dto: ResolveGrievanceDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.resolveGrievance(id, dto, req.user, tenantId || 'DEFAULT');
  }

  @Post('escalations/:id/reopen')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reopen resolved case with justification and initiate new SLA cycle' })
  reopenGrievance(
    @Param('id') id: string,
    @Body() dto: ReopenGrievanceDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.reopenGrievance(id, dto, req.user, tenantId || 'DEFAULT');
  }

  // -------------------------------------------------------------------------
  // STAGE 9.3 — INSTITUTIONAL REPORTING & NAAC ANALYTICS ENDPOINTS
  // -------------------------------------------------------------------------

  @Get('reports/comprehensive')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comprehensive institutional feedback report, faculty/subject metrics, and NAAC summary' })
  getComprehensiveFeedbackReport(
    @Query() query: FeedbackFilterQueryDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.getComprehensiveFeedbackReport(query, req.user, tenantId || 'DEFAULT');
  }

  @Get('reports/grievance-analytics')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get grievance redressal analytics, priority/category distribution, and action-taken log' })
  getGrievanceAnalyticsReport(
    @Query() query: GrievanceFilterQueryDto,
    @Req() req: any,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    return this.feedbackService.getGrievanceAnalyticsReport(query, req.user, tenantId || 'DEFAULT');
  }
}

