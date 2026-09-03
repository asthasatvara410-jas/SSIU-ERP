import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GrievanceService } from './grievance.service';
import { AnonymousComplaintService } from './anonymous-complaint.service';
import {
  CreateComplaintDto,
  CreateAntiRaggingDto,
  CreateICCDto,
  AssignComplaintDto,
  CreateInvestigationDto,
  CreateActionPlanDto,
  ResolveComplaintDto,
  ReopenCaseDto,
  FeedbackDto,
  AddInternalNoteDto,
  TrackAnonymousDto,
  UpdateCaseStatusDto,
} from './dto/grievance.dto';

@Controller('api/v1/grievance')
export class GrievanceController {
  constructor(
    private readonly grievanceService: GrievanceService,
    private readonly anonService: AnonymousComplaintService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.getDashboardSummary(tenantId);
    return { success: true, data, correlationId: `grv-dash-${Date.now()}` };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async fileComplaint(@Req() req: any, @Body() dto: CreateComplaintDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id;
    const res = await this.grievanceService.fileComplaint(dto, tenantId, studentId);
    return { success: true, data: res, correlationId: `grv-file-${Date.now()}` };
  }

  /**
   * Public Anonymous Grievance Submission (Zero Authentication Required)
   */
  @Post('anonymous')
  async fileAnonymousComplaint(@Req() req: any, @Body() dto: CreateComplaintDto) {
    const tenantId = req.headers['x-tenant-id'] || 'DEFAULT';
    dto.type = 'ANONYMOUS';
    const res = await this.grievanceService.fileComplaint(dto, tenantId);
    return {
      success: true,
      data: {
        caseNumber: res.caseNumber,
        trackingToken: res.trackingToken,
        status: res.status,
        createdAt: res.createdAt,
        message: res.message,
      },
      correlationId: `grv-anon-${Date.now()}`,
    };
  }

  /**
   * Public Anonymous Status Tracking via Body
   */
  @Post('track')
  async trackAnonymousByBody(@Req() req: any, @Body() dto: TrackAnonymousDto) {
    const tenantId = req.headers['x-tenant-id'] || 'DEFAULT';
    const data = await this.anonService.trackAnonymous(dto.caseNumber, dto.trackingToken, tenantId);
    return {
      success: true,
      data,
      correlationId: `grv-trk-${Date.now()}`,
    };
  }

  /**
   * Public Anonymous Status Tracking via URL Param
   */
  @Get('track/:trackingId')
  async trackAnonymousByToken(@Param('trackingId') trackingId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'DEFAULT';
    const caseRecord = await this.grievanceService.getCaseDetails(trackingId, tenantId, false);
    return {
      success: true,
      data: {
        caseNumber: caseRecord.caseNumber,
        category: caseRecord.category,
        subject: caseRecord.subject,
        status: caseRecord.status,
        createdAt: caseRecord.createdAt,
        timeline: caseRecord.timelineEvents,
      },
      correlationId: `grv-trk-${Date.now()}`,
    };
  }

  @Post('anti-ragging')
  @UseGuards(JwtAuthGuard)
  async fileAntiRagging(@Req() req: any, @Body() dto: CreateAntiRaggingDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id;
    const res = await this.grievanceService.fileAntiRagging(dto, tenantId, studentId);
    return { success: true, data: res, correlationId: `rag-${Date.now()}` };
  }

  @Post('icc')
  @UseGuards(JwtAuthGuard)
  async fileICC(@Req() req: any, @Body() dto: CreateICCDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id;
    const res = await this.grievanceService.fileICC(dto, tenantId, studentId);
    return { success: true, data: res, correlationId: `icc-${Date.now()}` };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyComplaints(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id;
    const data = await this.grievanceService.listMyComplaints(studentId, tenantId);
    return { success: true, data, correlationId: `grv-my-${Date.now()}` };
  }

  /**
   * Authorized Grievance Management List
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listComplaints(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'FACULTY', 'STAFF', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: Unauthorized to manage grievances.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.listAdminComplaints(tenantId, { status, category, type, search });
    return { success: true, data, correlationId: `grv-list-${Date.now()}` };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async listAdminComplaints(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.getDashboardSummary(tenantId);
    return { success: true, data, correlationId: `grv-adm-${Date.now()}` };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCaseDetails(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    const data = await this.grievanceService.getCaseDetails(id, tenantId, isPrivileged);
    return { success: true, data, correlationId: `grv-det-${Date.now()}` };
  }

  /**
   * Update Status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateCaseStatusDto) {
    const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: Only authorized staff can modify grievance status.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.updateCaseStatus(id, dto.status, dto.remarks, req.user, tenantId);
    return { success: true, data, correlationId: `grv-stat-${Date.now()}` };
  }

  /**
   * Add Internal Note / Remarks
   */
  @Post(':id/note')
  @UseGuards(JwtAuthGuard)
  async addInternalNote(@Param('id') id: string, @Req() req: any, @Body() dto: AddInternalNoteDto) {
    const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: Only authorized staff can add internal notes.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.addInternalNote(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-note-${Date.now()}` };
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard)
  async assignCase(@Param('id') id: string, @Req() req: any, @Body() dto: AssignComplaintDto) {
    const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: Only authorized officers can assign cases.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.assignCase(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-asn-${Date.now()}` };
  }

  @Post(':id/investigation')
  @UseGuards(JwtAuthGuard)
  async startInvestigation(@Param('id') id: string, @Req() req: any, @Body() dto: CreateInvestigationDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.startInvestigation(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-inv-${Date.now()}` };
  }

  @Post(':id/action-plan')
  @UseGuards(JwtAuthGuard)
  async addActionPlan(@Param('id') id: string, @Req() req: any, @Body() dto: CreateActionPlanDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.addActionPlan(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-act-${Date.now()}` };
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard)
  async resolveCase(@Param('id') id: string, @Req() req: any, @Body() dto: ResolveComplaintDto) {
    const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: Only authorized staff can resolve grievances.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.resolveCase(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-res-${Date.now()}` };
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard)
  async closeCase(@Param('id') id: string, @Req() req: any) {
    const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'IQAC', 'GRIEVANCE_OFFICER'].includes(req.user?.role);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: Only authorized staff can close grievances.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.closeCase(id, req.user, tenantId);
    return { success: true, data, correlationId: `grv-cls-${Date.now()}` };
  }

  @Post(':id/reopen')
  @UseGuards(JwtAuthGuard)
  async reopenCase(@Param('id') id: string, @Req() req: any, @Body() dto: ReopenCaseDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.reopenCase(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-rop-${Date.now()}` };
  }

  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  async submitFeedback(@Param('id') id: string, @Req() req: any, @Body() dto: FeedbackDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.submitFeedback(id, dto, req.user, tenantId);
    return { success: true, data, correlationId: `grv-fdb-${Date.now()}` };
  }

  @Get('reports/annual')
  @UseGuards(JwtAuthGuard)
  async getAnnualReport(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.grievanceService.generateAnnualReport(tenantId);
    return { success: true, data, correlationId: `grv-rpt-${Date.now()}` };
  }
}
