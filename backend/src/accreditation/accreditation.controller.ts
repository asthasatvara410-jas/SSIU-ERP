import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccreditationService } from './accreditation.service';
import {
  FrameworkCreateDto,
  AggregateRequestDto,
  ValidationRequestDto,
  EvidenceCreateDto,
  EvidenceVerifyDto,
  EvidenceRejectDto,
  GenerateReportDto,
  FinalizeReportDto,
} from './dto/accreditation.dto';

@ApiTags('NAAC & NBA Accreditation Engine')
@ApiBearerAuth()
@Controller('api/v1/accreditation')
export class AccreditationController {
  constructor(private readonly accreditationService: AccreditationService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unified NAAC/NBA Accreditation Dashboard overview, completeness, and readiness' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false, description: 'Accreditation framework (default NAAC)' })
  @ApiResponse({ status: 200, description: 'Accreditation readiness overview retrieved successfully' })
  async getDashboard(@Req() req: any, @Query('framework') framework?: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students do not have access to institutional accreditation dashboards.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getDashboardSummary(framework || 'NAAC', tenantId);
    return {
      success: true,
      data,
      correlationId: `acc-dash-${Date.now()}`,
    };
  }

  @Get('frameworks')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List supported accreditation frameworks (NAAC, NBA)' })
  async getFrameworks(@Req() req: any) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getFrameworks(tenantId);
    return {
      success: true,
      data,
      correlationId: `acc-frm-${Date.now()}`,
    };
  }

  @Get('criteria')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all accreditation criteria and associated metrics' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false })
  async listCriteria(@Req() req: any, @Query('framework') framework?: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.listCriteria(framework || 'NAAC', tenantId);
    return {
      success: true,
      data,
      correlationId: `acc-crit-${Date.now()}`,
    };
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all accreditation metrics with 5-year aggregated values' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false })
  @ApiQuery({ name: 'criterionCode', required: false })
  async listMetrics(
    @Req() req: any,
    @Query('framework') framework?: string,
    @Query('criterionCode') criterionCode?: string,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.listMetrics(framework || 'NAAC', criterionCode, tenantId);
    return {
      success: true,
      data,
      correlationId: `acc-metl-${Date.now()}`,
    };
  }

  @Post('aggregate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Aggregate 5-year metrics from live ERP tables (Students, Faculty, Academics, Grants, Placements)' })
  @ApiBody({ type: AggregateRequestDto })
  async aggregateData(@Req() req: any, @Body() dto: AggregateRequestDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.aggregate(dto, tenantId, req.user);
    return {
      success: true,
      data: res,
      correlationId: `acc-agg-${Date.now()}`,
    };
  }

  @Post('recalculate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Recalculate accreditation metric values from current live database records' })
  @ApiBody({ type: AggregateRequestDto })
  async recalculate(@Req() req: any, @Body() dto: AggregateRequestDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.aggregate(dto, tenantId, req.user);
    return {
      success: true,
      data: res,
      message: `Accreditation metrics recalculated from live database for ${dto.framework}.`,
      correlationId: `acc-recalc-${Date.now()}`,
    };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate data quality, completeness, and missing evidence warnings' })
  @ApiBody({ type: ValidationRequestDto })
  async validateData(@Req() req: any, @Body() dto: ValidationRequestDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.validate(dto, tenantId);
    return {
      success: true,
      data: res,
      correlationId: `acc-val-${Date.now()}`,
    };
  }

  @Get('metrics/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single metric details, formula, and 5-year trend history' })
  @ApiParam({ name: 'id', description: 'Metric ID' })
  async getMetricDetails(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getMetricDetails(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `acc-met-${Date.now()}`,
    };
  }

  @Post('evidence')
  @Post('evidence/attach')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload or link institutional evidence document to an accreditation criterion or metric' })
  @ApiBody({ type: EvidenceCreateDto })
  async addEvidence(@Req() req: any, @Body() dto: EvidenceCreateDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot attach accreditation evidence.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.addEvidence(dto, tenantId, req.user);
    return {
      success: true,
      data: res,
      message: 'Evidence successfully linked and recorded in institutional repository.',
      correlationId: `acc-ev-${Date.now()}`,
    };
  }

  @Patch('evidence/:id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify pending accreditation evidence (HOD / HOI / IQAC Coordinator / Admin)' })
  @ApiParam({ name: 'id', description: 'Evidence record ID' })
  @ApiBody({ type: EvidenceVerifyDto, required: false })
  async verifyEvidence(@Req() req: any, @Param('id') id: string, @Body() dto?: EvidenceVerifyDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.verifyEvidence(id, tenantId, req.user, dto);
    return {
      success: true,
      data: res,
      message: 'Accreditation evidence marked as VERIFIED.',
      correlationId: `acc-evv-${Date.now()}`,
    };
  }

  @Patch('evidence/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reject non-compliant accreditation evidence with reason' })
  @ApiParam({ name: 'id', description: 'Evidence record ID' })
  @ApiBody({ type: EvidenceRejectDto })
  async rejectEvidence(@Req() req: any, @Param('id') id: string, @Body() dto: EvidenceRejectDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.rejectEvidence(id, tenantId, req.user, dto);
    return {
      success: true,
      data: res,
      message: 'Accreditation evidence rejected.',
      correlationId: `acc-evr-${Date.now()}`,
    };
  }

  @Get('evidence/completeness')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get evidence completeness breakdown and status for NAAC or NBA' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false })
  async getEvidenceCompleteness(@Req() req: any, @Query('framework') framework?: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getEvidenceCompleteness(framework || 'NAAC', tenantId, {
      departmentId: req.user?.departmentId,
    });
    return {
      success: true,
      data,
      correlationId: `acc-evc-${Date.now()}`,
    };
  }

  @Get('evidence/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get details and data lineage history for a specific evidence item' })
  @ApiParam({ name: 'id', description: 'Evidence ID' })
  async getEvidenceById(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getEvidenceById(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `acc-evd-${Date.now()}`,
    };
  }

  @Get('evidence')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List institutional evidence documents filterable by framework, criterion, metric, status, scope' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false })
  @ApiQuery({ name: 'criterionCode', required: false })
  @ApiQuery({ name: 'metricId', required: false })
  @ApiQuery({ name: 'academicYear', required: false })
  @ApiQuery({ name: 'status', enum: ['PENDING', 'VERIFIED', 'REJECTED'], required: false })
  async listEvidence(
    @Req() req: any,
    @Query('framework') framework?: string,
    @Query('criterionCode') criterionCode?: string,
    @Query('metricId') metricId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('status') status?: string,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.listEvidence(
      { framework, criterionCode, metricId, academicYear, status },
      tenantId,
      req.user,
    );
    return {
      success: true,
      data,
      correlationId: `acc-evl-${Date.now()}`,
    };
  }

  @Post('reports')
  @Post('reports/generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate a new NAAC / NBA Self-Study Report (SSR/SAR) snapshot' })
  @ApiBody({ type: GenerateReportDto })
  @ApiResponse({ status: 201, description: 'Accreditation report snapshot generated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions for report generation' })
  async generateReport(@Req() req: any, @Body() dto: GenerateReportDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot generate accreditation reports.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.generateReport(dto, tenantId, req.user);
    return {
      success: true,
      data: res.report,
      job: res.job,
      message: res.message,
      correlationId: `acc-rep-${Date.now()}`,
    };
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List generated accreditation reports scoped by role & tenant' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false })
  @ApiResponse({ status: 200, description: 'Accreditation reports list retrieved' })
  async listReports(@Req() req: any, @Query('framework') framework?: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.listReports(framework, tenantId, req.user);
    return {
      success: true,
      data,
      correlationId: `acc-repl-${Date.now()}`,
    };
  }

  @Get('reports/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get detailed accreditation report snapshot by ID with scope validation' })
  @ApiParam({ name: 'id', description: 'Report ID or unique report code' })
  @ApiResponse({ status: 200, description: 'Report details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-department or cross-tenant access denied' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getReport(id, tenantId, req.user);
    return {
      success: true,
      data,
      correlationId: `acc-repd-${Date.now()}`,
    };
  }

  @Post('reports/:id/finalize')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Finalize and seal an accreditation report with SHA-256 integrity lock' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report sealed with immutable cryptographic digest' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient authority to seal report' })
  async finalizeReport(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.accreditationService.finalizeReport(id, tenantId, req.user);
    return {
      success: true,
      data: res,
      message: 'Accreditation report finalized and sealed with immutable SHA-256 cryptographic digest.',
      correlationId: `acc-repfin-${Date.now()}`,
    };
  }

  @Post('reports/:id/verify-integrity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify the cryptographic SHA-256 integrity of a sealed accreditation report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Cryptographic integrity check result' })
  async verifyIntegrity(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.verifyReportIntegrity(id, tenantId, req.user);
    return {
      success: true,
      data,
      correlationId: `acc-repinteg-${Date.now()}`,
    };
  }

  @Get('reports/:id/export')
  @Post('reports/:id/export')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Export sealed accreditation report in JSON, EXCEL (XLSX), or HTML/PDF format' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiQuery({ name: 'format', enum: ['JSON', 'EXCEL', 'PDF', 'HTML'], required: false })
  @ApiResponse({ status: 200, description: 'Export file payload generated' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-department or cross-tenant export denied' })
  async exportReport(
    @Req() req: any,
    @Param('id') id: string,
    @Query('format') format?: 'JSON' | 'EXCEL' | 'PDF' | 'HTML',
    @Body('format') bodyFormat?: 'JSON' | 'EXCEL' | 'PDF' | 'HTML',
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.exportReport(id, tenantId, format || bodyFormat || 'JSON', req.user);
    return {
      success: true,
      data,
      correlationId: `acc-repexp-${Date.now()}`,
    };
  }

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get accreditation audit logs and data lineage trace (restricted to IQAC, Registrar, Admin)' })
  @ApiQuery({ name: 'framework', enum: ['NAAC', 'NBA'], required: false })
  @ApiResponse({ status: 200, description: 'Accreditation audit trail retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-administrative roles' })
  async getAuditLogs(@Req() req: any, @Query('framework') framework?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.accreditationService.getAuditLogs(framework, tenantId, req.user);
    return {
      success: true,
      data,
      correlationId: `acc-aud-${Date.now()}`,
    };
  }
}
