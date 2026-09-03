import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OBEService } from './obe.service';
import {
  CreateCourseOutcomeDto,
  UpdateCourseOutcomeDto,
  CreateProgramOutcomeDto,
  CreateProgramSpecificOutcomeDto,
  SetCOPOMappingDto,
  BulkSetCOPOMatrixDto,
  BulkSetCOPSOMatrixDto,
  SetCOPSOMappingDto,
  SetAssessmentCOMapDto,
  BulkSetAssessmentCOMapDto,
  CalculateAttainmentDto,
  OverrideAttainmentDto,
  CreateImprovementActionDto,
  UpdateImprovementActionStatusDto,
  GenerateOBEReportDto,
} from './dto/obe.dto';

@Controller('api/v1/obe')
export class OBEController {
  constructor(private readonly obeService: OBEService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.getDashboardSummary(tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-dash-${Date.now()}`,
    };
  }

  // Course Outcomes
  @Post('co')
  @UseGuards(JwtAuthGuard)
  async createCO(@Req() req: any, @Body() dto: CreateCourseOutcomeDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot create Course Outcomes.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.createCO(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-co-${Date.now()}`,
    };
  }

  @Get('courses/:courseId/co')
  @UseGuards(JwtAuthGuard)
  async listCOs(@Req() req: any, @Param('courseId') courseId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.listCOs(courseId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-col-${Date.now()}`,
    };
  }

  @Patch('co/:id')
  @UseGuards(JwtAuthGuard)
  async updateCO(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCourseOutcomeDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.updateCO(id, dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-cou-${Date.now()}`,
    };
  }

  // Program Outcomes
  @Post('po')
  @UseGuards(JwtAuthGuard)
  async createPO(@Req() req: any, @Body() dto: CreateProgramOutcomeDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.createPO(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-po-${Date.now()}`,
    };
  }

  @Get('programs/:programId/po')
  @UseGuards(JwtAuthGuard)
  async listPOs(@Req() req: any, @Param('programId') programId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.listPOs(programId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-pol-${Date.now()}`,
    };
  }

  // PSOs
  @Post('pso')
  @UseGuards(JwtAuthGuard)
  async createPSO(@Req() req: any, @Body() dto: CreateProgramSpecificOutcomeDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.createPSO(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-pso-${Date.now()}`,
    };
  }

  @Get('programs/:programId/pso')
  @UseGuards(JwtAuthGuard)
  async listPSOs(@Req() req: any, @Param('programId') programId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.listPSOs(programId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-psol-${Date.now()}`,
    };
  }

  // Mappings
  @Post('mappings/co-po')
  @UseGuards(JwtAuthGuard)
  async setCOPOMapping(@Req() req: any, @Body() dto: SetCOPOMappingDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.setCOPOMapping(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-map-copo-${Date.now()}`,
    };
  }

  @Post('mappings/co-pso')
  @UseGuards(JwtAuthGuard)
  async setCOPSOMapping(@Req() req: any, @Body() dto: SetCOPSOMappingDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.setCOPSOMapping(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-map-copso-${Date.now()}`,
    };
  }

  @Get('matrix')
  @UseGuards(JwtAuthGuard)
  async getMatrix(
    @Req() req: any,
    @Query('courseId') courseId: string,
    @Query('programId') programId: string,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.getMatrix(courseId || 'COURSE-CS301', programId || 'PROG-BTECH-CSE', tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-matrix-${Date.now()}`,
    };
  }

  @Get('courses/:courseId/co-po-matrix')
  @UseGuards(JwtAuthGuard)
  async getCourseMatrix(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Query('programId') programId?: string,
  ) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.getMatrix(courseId, programId || 'PROG-BTECH-CSE', tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-course-matrix-${Date.now()}`,
    };
  }

  @Post('courses/:courseId/co-po-matrix')
  @UseGuards(JwtAuthGuard)
  async saveCOPOMatrixPost(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() dto: BulkSetCOPOMatrixDto,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot modify CO-PO mappings.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.saveCOPOMatrix(courseId, dto, tenantId, req.user);
    return {
      success: true,
      data,
      message: 'CO-PO matrix successfully saved and validated.',
      correlationId: `obe-matrix-save-${Date.now()}`,
    };
  }

  @Patch('courses/:courseId/co-po-matrix')
  @UseGuards(JwtAuthGuard)
  async saveCOPOMatrixPatch(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() dto: BulkSetCOPOMatrixDto,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot modify CO-PO mappings.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.saveCOPOMatrix(courseId, dto, tenantId, req.user);
    return {
      success: true,
      data,
      message: 'CO-PO matrix successfully saved and validated.',
      correlationId: `obe-matrix-patch-${Date.now()}`,
    };
  }

  @Post('courses/:courseId/co-pso-matrix')
  @UseGuards(JwtAuthGuard)
  async saveCOPSOMatrix(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() dto: BulkSetCOPSOMatrixDto,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot modify CO-PSO mappings.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.saveCOPSOMatrix(courseId, dto, tenantId, req.user);
    return {
      success: true,
      data,
      message: 'CO-PSO matrix successfully saved.',
      correlationId: `obe-pso-matrix-save-${Date.now()}`,
    };
  }

  @Post('assessment-mappings')
  @UseGuards(JwtAuthGuard)
  async mapAssessment(@Req() req: any, @Body() dto: SetAssessmentCOMapDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.mapAssessment(dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-assmap-${Date.now()}`,
    };
  }

  @Post('assessment-mappings/batch')
  @UseGuards(JwtAuthGuard)
  async mapAssessmentBatch(@Req() req: any, @Body() dto: BulkSetAssessmentCOMapDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.mapAssessmentBatch(dto, tenantId);
    return {
      success: true,
      data,
      message: 'Assessment mappings updated successfully.',
      correlationId: `obe-assmap-batch-${Date.now()}`,
    };
  }

  @Get('courses/:courseId/assessment-mappings')
  @UseGuards(JwtAuthGuard)
  async listCourseAssessments(@Req() req: any, @Param('courseId') courseId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.listAssessments(courseId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-assmap-list-${Date.now()}`,
    };
  }

  @Get('courses/:courseId/validate')
  @UseGuards(JwtAuthGuard)
  async validateCourseOBE(@Req() req: any, @Param('courseId') courseId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.validateCourse(courseId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-val-${Date.now()}`,
    };
  }

  // Attainment
  @Post('attainment/calculate')
  @UseGuards(JwtAuthGuard)
  async calculateAttainment(@Req() req: any, @Body() dto: CalculateAttainmentDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.calculateAttainment(dto, tenantId, req.user?.id);
    return {
      success: true,
      data,
      correlationId: `obe-calc-${Date.now()}`,
    };
  }

  @Post('attainment/override')
  @UseGuards(JwtAuthGuard)
  async overrideAttainment(@Req() req: any, @Body() dto: OverrideAttainmentDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot override attainment.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.overrideAttainment(dto, tenantId, req.user);
    return {
      success: true,
      data,
      message: 'Attainment overridden and audit trail updated successfully.',
      correlationId: `obe-att-ovr-${Date.now()}`,
    };
  }

  @Get('attainment/course/:courseId')
  @UseGuards(JwtAuthGuard)
  async getCourseAttainment(@Req() req: any, @Param('courseId') courseId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.getCourseAttainment(courseId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-catt-${Date.now()}`,
    };
  }

  @Get('attainment/program/:programId')
  @UseGuards(JwtAuthGuard)
  async getProgramAttainment(@Req() req: any, @Param('programId') programId: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.getProgramAttainment(programId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-patt-${Date.now()}`,
    };
  }

  // Continuous Improvement Actions
  @Post('improvement-actions')
  @UseGuards(JwtAuthGuard)
  async createAction(@Req() req: any, @Body() dto: CreateImprovementActionDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.createImprovementAction(dto, tenantId);
    return {
      success: true,
      data,
      message: 'Continuous improvement action created.',
      correlationId: `obe-act-${Date.now()}`,
    };
  }

  @Get('improvement-actions')
  @UseGuards(JwtAuthGuard)
  async listActions(@Req() req: any, @Query('courseId') courseId?: string) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.listImprovementActions(courseId, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-actl-${Date.now()}`,
    };
  }

  @Patch('improvement-actions/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateActionStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateImprovementActionStatusDto,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot update CQI status.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    await this.obeService.updateImprovementActionStatus(id, dto.status, tenantId);
    return {
      success: true,
      message: `Improvement action status updated to ${dto.status}.`,
      correlationId: `obe-act-stat-${Date.now()}`,
    };
  }

  // Reports
  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async generateReport(@Req() req: any, @Body() dto: GenerateOBEReportDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.generateReport(dto, tenantId, req.user?.id || 'admin');
    return {
      success: true,
      data: data.report,
      message: data.message,
      correlationId: `obe-rep-${Date.now()}`,
    };
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard)
  async listReports(@Req() req: any, @Query('reportType') reportType?: string) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.obeService.listReports(reportType, tenantId);
    return {
      success: true,
      data,
      correlationId: `obe-repl-${Date.now()}`,
    };
  }
}
