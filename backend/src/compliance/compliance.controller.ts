import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ComplianceService } from './compliance.service';
import {
  CreateCOAssessmentMappingDto,
  CalculateCOAttainmentDto,
  AttainmentOverrideDto,
  CreateNEPIndicatorDto,
  CreateSnapshotDto,
} from './dto/compliance.dto';

@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.getExecutiveDashboard(tenantId);
    return { success: true, data, correlationId: `cmp-dash-${Date.now()}` };
  }

  // NEP 2020 Indicators
  @Get('nep-indicators')
  @UseGuards(JwtAuthGuard)
  async listNEPIndicators(@Req() req: any, @Query('category') category?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.listNEPIndicators(tenantId, category);
    return { success: true, data, correlationId: `nep-lst-${Date.now()}` };
  }

  @Post('nep-indicators')
  @UseGuards(JwtAuthGuard)
  async createNEPIndicator(@Req() req: any, @Body() dto: CreateNEPIndicatorDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.createOrUpdateNEPIndicator(dto, tenantId);
    return { success: true, data, correlationId: `nep-crt-${Date.now()}` };
  }

  // OBE Assessments & Attainments
  @Post('obe/assessment-mapping')
  @UseGuards(JwtAuthGuard)
  async createAssessmentMapping(@Req() req: any, @Body() dto: CreateCOAssessmentMappingDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.createCOAssessmentMapping(dto, tenantId);
    return { success: true, data, correlationId: `obe-asm-${Date.now()}` };
  }

  @Post('obe/calculate-co-attainment')
  @UseGuards(JwtAuthGuard)
  async calculateCOAttainment(@Req() req: any, @Body() dto: CalculateCOAttainmentDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.calculateCOAttainment(dto, tenantId);
    return { success: true, data, correlationId: `obe-coa-${Date.now()}` };
  }

  @Post('obe/calculate-po-attainment')
  @UseGuards(JwtAuthGuard)
  async calculatePOAttainment(@Req() req: any, @Body('programId') programId: string, @Body('academicYear') academicYear: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.calculatePOAttainment(programId, academicYear, tenantId);
    return { success: true, data, correlationId: `obe-poa-${Date.now()}` };
  }

  @Post('obe/override-attainment')
  @UseGuards(JwtAuthGuard)
  async overrideAttainment(@Req() req: any, @Body() dto: AttainmentOverrideDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.overrideAttainment(dto, req.user, tenantId);
    return { success: true, data, correlationId: `obe-ovr-${Date.now()}` };
  }

  // NBA
  @Get('nba/program-profile/:programId')
  @UseGuards(JwtAuthGuard)
  async getNBAProgramProfile(@Req() req: any, @Param('programId') programId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.getNBAProgramProfile(programId, tenantId);
    return { success: true, data, correlationId: `nba-prf-${Date.now()}` };
  }

  // Snapshots
  @Post('snapshots')
  @UseGuards(JwtAuthGuard)
  async createSnapshot(@Req() req: any, @Body() dto: CreateSnapshotDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.createSnapshot(dto, req.user, tenantId);
    return { success: true, data, correlationId: `snp-crt-${Date.now()}` };
  }

  @Get('snapshots')
  @UseGuards(JwtAuthGuard)
  async listSnapshots(@Req() req: any, @Query('framework') framework?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.complianceService.listSnapshots(tenantId, framework);
    return { success: true, data, correlationId: `snp-lst-${Date.now()}` };
  }
}
