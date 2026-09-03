import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResearchService } from './research.service';
import {
  CreateResearchProjectDto,
  CreatePublicationDto,
  CreatePatentDto,
  ResearchApprovalActionDto,
} from './dto/research.dto';

@Controller('api/v1/research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.getDashboardSummary(tenantId);
    return {
      success: true,
      data,
      correlationId: `res-dash-${Date.now()}`,
    };
  }

  // Projects
  @Post('projects')
  @UseGuards(JwtAuthGuard)
  async createProject(@Req() req: any, @Body() dto: CreateResearchProjectDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-user';
    const data = await this.researchService.createProject(dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `res-prj-${Date.now()}`,
    };
  }

  @Get('projects')
  @UseGuards(JwtAuthGuard)
  async listProjects(@Req() req: any, @Query('departmentId') departmentId?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listProjects(tenantId, departmentId);
    return {
      success: true,
      data,
      correlationId: `res-prjs-${Date.now()}`,
    };
  }

  @Get('projects/:id')
  @UseGuards(JwtAuthGuard)
  async getProjectDetails(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.getProjectDetails(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `res-prjd-${Date.now()}`,
    };
  }

  // Publications
  @Post('publications')
  @UseGuards(JwtAuthGuard)
  async createPublication(@Req() req: any, @Body() dto: CreatePublicationDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-user';
    const data = await this.researchService.createPublication(dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `res-pub-${Date.now()}`,
    };
  }

  @Get('publications')
  @UseGuards(JwtAuthGuard)
  async listPublications(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listPublications(tenantId, type, status);
    return {
      success: true,
      data,
      correlationId: `res-pubs-${Date.now()}`,
    };
  }

  @Get('publications/:id')
  @UseGuards(JwtAuthGuard)
  async getPublicationDetails(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.getPublicationDetails(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `res-pubd-${Date.now()}`,
    };
  }

  @Post('publications/:id/validate')
  @UseGuards(JwtAuthGuard)
  async validatePublication(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.validatePublication(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `res-pubv-${Date.now()}`,
    };
  }

  // Patents
  @Post('patents')
  @UseGuards(JwtAuthGuard)
  async createPatent(@Req() req: any, @Body() dto: CreatePatentDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-user';
    const data = await this.researchService.createPatent(dto, tenantId, userId);
    return {
      success: true,
      data,
      correlationId: `res-pat-${Date.now()}`,
    };
  }

  @Get('patents')
  @UseGuards(JwtAuthGuard)
  async listPatents(@Req() req: any, @Query('status') status?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listPatents(tenantId, status);
    return {
      success: true,
      data,
      correlationId: `res-pats-${Date.now()}`,
    };
  }

  @Get('patents/:id')
  @UseGuards(JwtAuthGuard)
  async getPatentDetails(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.getPatentDetails(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `res-patd-${Date.now()}`,
    };
  }

  @Post('patents/:id/validate')
  @UseGuards(JwtAuthGuard)
  async validatePatent(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.validatePatent(id, tenantId);
    return {
      success: true,
      data,
      correlationId: `res-patv-${Date.now()}`,
    };
  }

  // Workflow Approval
  @Post(':entityType/:id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForReview(
    @Req() req: any,
    @Param('entityType') entityType: 'PUBLICATION' | 'PATENT' | 'PROJECT',
    @Param('id') id: string,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.submitForReview(entityType, id, tenantId, req.user?.id || 'researcher');
    return {
      success: true,
      data,
      correlationId: `res-sub-${Date.now()}`,
    };
  }

  @Post(':entityType/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveResearch(
    @Req() req: any,
    @Param('entityType') entityType: 'PUBLICATION' | 'PATENT' | 'PROJECT',
    @Param('id') id: string,
    @Body() dto: ResearchApprovalActionDto,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.processApproval(entityType, id, dto, tenantId, req.user?.id || 'approver', req.user?.role || 'HOD');
    return {
      success: true,
      data,
      correlationId: `res-app-${Date.now()}`,
    };
  }

  // -------------------------------------------------------------------------
  // STAGE 10.1 — GRANTS, SCHOLARS, CONSULTANCY, CONFERENCES, BOOKS, AWARDS & NAAC
  // -------------------------------------------------------------------------

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getComprehensiveMetrics(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.getComprehensiveResearchMetrics(tenantId, req.user);
    return { success: true, data };
  }

  @Get('naac-summary')
  @UseGuards(JwtAuthGuard)
  async getNaacSummary(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.getNaacCriterion3Summary(tenantId);
    return { success: true, data };
  }

  @Post('grants')
  @UseGuards(JwtAuthGuard)
  async createGrant(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.createGrant(dto, tenantId, req.user?.id || 'faculty');
    return { success: true, data };
  }

  @Get('grants')
  @UseGuards(JwtAuthGuard)
  async listGrants(@Req() req: any, @Query('departmentId') departmentId?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listGrants(tenantId, departmentId);
    return { success: true, data };
  }

  @Post('scholars')
  @UseGuards(JwtAuthGuard)
  async createScholar(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.createScholar(dto, tenantId, req.user?.id || 'faculty');
    return { success: true, data };
  }

  @Get('scholars')
  @UseGuards(JwtAuthGuard)
  async listScholars(@Req() req: any, @Query('departmentId') departmentId?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listScholars(tenantId, departmentId);
    return { success: true, data };
  }

  @Post('consultancies')
  @UseGuards(JwtAuthGuard)
  async createConsultancy(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.createConsultancy(dto, tenantId, req.user?.id || 'faculty');
    return { success: true, data };
  }

  @Get('consultancies')
  @UseGuards(JwtAuthGuard)
  async listConsultancies(@Req() req: any, @Query('departmentId') departmentId?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listConsultancies(tenantId, departmentId);
    return { success: true, data };
  }

  @Post('conferences')
  @UseGuards(JwtAuthGuard)
  async createConference(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.createConference(dto, tenantId, req.user?.id || 'faculty');
    return { success: true, data };
  }

  @Get('conferences')
  @UseGuards(JwtAuthGuard)
  async listConferences(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listConferences(tenantId);
    return { success: true, data };
  }

  @Post('books')
  @UseGuards(JwtAuthGuard)
  async createBook(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.createBook(dto, tenantId, req.user?.id || 'faculty');
    return { success: true, data };
  }

  @Get('books')
  @UseGuards(JwtAuthGuard)
  async listBooks(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listBooks(tenantId);
    return { success: true, data };
  }

  @Post('awards')
  @UseGuards(JwtAuthGuard)
  async createAward(@Req() req: any, @Body() dto: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.createAward(dto, tenantId, req.user?.id || 'faculty');
    return { success: true, data };
  }

  @Get('awards')
  @UseGuards(JwtAuthGuard)
  async listAwards(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.researchService.listAwards(tenantId);
    return { success: true, data };
  }
}

