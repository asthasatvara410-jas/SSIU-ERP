import { Controller, Get, Post, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StartupGrantService } from './startup-grant.service';
import {
  CreateStartupDto,
  CreateSSIPProjectDto,
  CreateGrantDto,
  SubmitExpenseDto,
  CreateMilestoneDto,
} from './dto/startup-grant.dto';

@Controller('api/v1/startup-grants')
export class StartupGrantController {
  constructor(private readonly sgService: StartupGrantService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getDashboardSummary(tenantId);
    return {
      success: true,
      data,
      correlationId: `sg-dash-${Date.now()}`,
    };
  }

  // Startups
  @Post('startups')
  @UseGuards(JwtAuthGuard)
  async createStartup(@Req() req: any, @Body() dto: CreateStartupDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'founder-user';
    const data = await this.sgService.createStartup(dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `str-${Date.now()}`,
    };
  }

  @Get('startups')
  @UseGuards(JwtAuthGuard)
  async listStartups(
    @Req() req: any,
    @Query('stage') stage?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listStartups(tenantId, stage, status);
    return {
      success: true,
      data,
      correlationId: `strs-${Date.now()}`,
    };
  }

  @Get('startups/:id')
  @UseGuards(JwtAuthGuard)
  async getStartupDetails(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getStartupDetails(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `strd-${Date.now()}`,
    };
  }

  // SSIP
  @Post('ssip/projects')
  @UseGuards(JwtAuthGuard)
  async createSSIPProject(@Req() req: any, @Body() dto: CreateSSIPProjectDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createSSIPProject(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `ssip-${Date.now()}`,
    };
  }

  @Get('ssip/projects')
  @UseGuards(JwtAuthGuard)
  async listSSIPProjects(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listSSIPProjects(tenantId);
    return {
      success: true,
      data,
      correlationId: `ssips-${Date.now()}`,
    };
  }

  // Hackathons
  @Get('hackathons')
  @UseGuards(JwtAuthGuard)
  async listHackathons(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listHackathons(tenantId);
    return {
      success: true,
      data,
      correlationId: `hack-${Date.now()}`,
    };
  }

  // Grants
  @Post('grants')
  @UseGuards(JwtAuthGuard)
  async createGrant(@Req() req: any, @Body() dto: CreateGrantDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createGrant(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `grt-${Date.now()}`,
    };
  }

  @Get('grants')
  @UseGuards(JwtAuthGuard)
  async listGrants(@Req() req: any, @Query('type') grantType?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listGrants(tenantId, grantType);
    return {
      success: true,
      data,
      correlationId: `grts-${Date.now()}`,
    };
  }

  @Get('grants/:id')
  @UseGuards(JwtAuthGuard)
  async getGrantDetails(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getGrantDetails(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `grtd-${Date.now()}`,
    };
  }

  @Post('grants/:id/releases')
  @UseGuards(JwtAuthGuard)
  async releaseFunds(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { amount: number; financeTransactionId: string },
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.releaseFunds(id, body.amount, body.financeTransactionId, tenantId);
    return {
      success: true,
      data,
      correlationId: `rel-${Date.now()}`,
    };
  }

  @Post('grants/:id/expenses')
  @UseGuards(JwtAuthGuard)
  async submitExpense(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitExpenseDto,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'officer-user';
    const data = await this.sgService.submitExpense(id, dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `exp-${Date.now()}`,
    };
  }

  @Post('grants/:id/milestones')
  @UseGuards(JwtAuthGuard)
  async createMilestone(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createMilestone(id, dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `mls-${Date.now()}`,
    };
  }

  @Get('grants/:id/utilization')
  @UseGuards(JwtAuthGuard)
  async getUtilization(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getUtilization(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `utl-${Date.now()}`,
    };
  }

  @Post('grants/:id/applications')
  @UseGuards(JwtAuthGuard)
  async submitGrantApplication(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { requestedAmount: number; startupId?: string; ssipProjectId?: string },
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'applicant-user';
    const data = await this.sgService.submitGrantApplication(id, userId, body.requestedAmount, tenantId, body.startupId, body.ssipProjectId);
    return {
      success: true,
      data,
      correlationId: `app-${Date.now()}`,
    };
  }

  @Post('applications/:id/review')
  @UseGuards(JwtAuthGuard)
  async reviewGrantApplication(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { action: string; comment: string; newStatus: string },
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const actorId = req.user?.id || 'officer-user';
    const actorRole = req.user?.role || 'GRANT_OFFICER';
    const data = await this.sgService.reviewGrantApplication(id, actorId, actorRole, body.action, body.comment, body.newStatus, tenantId);
    return {
      success: true,
      data,
      correlationId: `act-${Date.now()}`,
    };
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard)
  async listGrantApplications(
    @Req() req: any,
    @Query('grantId') grantId?: string,
    @Query('applicantUserId') applicantUserId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listGrantApplications(tenantId, grantId, applicantUserId, status);
    return {
      success: true,
      data,
      correlationId: `apps-${Date.now()}`,
    };
  }

  @Get('grants-summary-report')
  @UseGuards(JwtAuthGuard)
  async getGrantsSummaryReport(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getGrantsSummaryReport(tenantId);
    return data;
  }

  // ─── STAGE 10.2 REST ENDPOINTS: INNOVATION & INCUBATION ────────────────────

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getComprehensiveInnovationMetrics(tenantId);
    return data;
  }

  @Get('naac-summary')
  @UseGuards(JwtAuthGuard)
  async getNaacSummary(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.getNaacInnovationSummary(tenantId);
    return data;
  }

  @Post('innovations')
  @UseGuards(JwtAuthGuard)
  async createInnovation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'innovator-user';
    const data = await this.sgService.createInnovationProject(dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `inn-${Date.now()}`,
    };
  }

  @Get('innovations')
  @UseGuards(JwtAuthGuard)
  async listInnovations(@Req() req: any, @Query('category') category?: string, @Query('stage') stage?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listInnovationProjects(tenantId, category, stage);
    return {
      success: true,
      data,
      correlationId: `inns-${Date.now()}`,
    };
  }

  @Post('incubation-applications')
  @UseGuards(JwtAuthGuard)
  async createIncubationApplication(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'applicant-user';
    const data = await this.sgService.createIncubationApplication(dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `inc-${Date.now()}`,
    };
  }

  @Get('incubation-applications')
  @UseGuards(JwtAuthGuard)
  async listIncubationApplications(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listIncubationApplications(tenantId);
    return {
      success: true,
      data,
      correlationId: `incs-${Date.now()}`,
    };
  }

  @Post('mentors')
  @UseGuards(JwtAuthGuard)
  async createMentor(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createInnovationMentor(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `mnt-${Date.now()}`,
    };
  }

  @Get('mentors')
  @UseGuards(JwtAuthGuard)
  async listMentors(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listInnovationMentors(tenantId);
    return {
      success: true,
      data,
      correlationId: `mnts-${Date.now()}`,
    };
  }

  @Post('mentoring-sessions')
  @UseGuards(JwtAuthGuard)
  async createSession(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createMentoringSession(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `ms-${Date.now()}`,
    };
  }

  @Post('funding')
  @UseGuards(JwtAuthGuard)
  async createFunding(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createInnovationFunding(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `fnd-${Date.now()}`,
    };
  }

  @Get('funding')
  @UseGuards(JwtAuthGuard)
  async listFunding(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listInnovationFundings(tenantId);
    return {
      success: true,
      data,
      correlationId: `fnds-${Date.now()}`,
    };
  }

  @Post('collaborations')
  @UseGuards(JwtAuthGuard)
  async createCollaboration(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createIndustryCollaboration(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `col-${Date.now()}`,
    };
  }

  @Get('collaborations')
  @UseGuards(JwtAuthGuard)
  async listCollaborations(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listIndustryCollaborations(tenantId);
    return {
      success: true,
      data,
      correlationId: `cols-${Date.now()}`,
    };
  }

  @Post('events')
  @UseGuards(JwtAuthGuard)
  async createEvent(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createInnovationEvent(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `evt-${Date.now()}`,
    };
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async listEvents(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listInnovationEvents(tenantId);
    return {
      success: true,
      data,
      correlationId: `evts-${Date.now()}`,
    };
  }

  @Post('awards')
  @UseGuards(JwtAuthGuard)
  async createAward(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.createInnovationAward(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `awd-${Date.now()}`,
    };
  }

  @Get('awards')
  @UseGuards(JwtAuthGuard)
  async listAwards(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.sgService.listInnovationAwards(tenantId);
    return {
      success: true,
      data,
      correlationId: `awds-${Date.now()}`,
    };
  }
}

