import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AcademicRiskService } from './academic-risk.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('AI Academic Risk Prediction Engine')
@ApiBearerAuth()
@Controller('api/ai/risk')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AcademicRiskController {
  constructor(private readonly riskService: AcademicRiskService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get academic risk dashboard KPIs and distribution' })
  getDashboard(@Req() req: any) {
    return this.riskService.getDashboard(req.user);
  }

  @Get('students')
  @ApiOperation({ summary: 'Get paginated student risk list with filters' })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'search', required: false })
  getStudents(@Req() req: any, @Query() query: any) {
    return this.riskService.getStudents(req.user, query);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Get individual student risk detail and history' })
  getStudentRisk(@Param('studentId') studentId: string) {
    return this.riskService.getStudentRisk(studentId);
  }

  @Post('calculate/:studentId')
  @ApiOperation({ summary: 'Calculate or recalculate risk score for a single student' })
  calculateStudentRisk(@Param('studentId') studentId: string) {
    return this.riskService.calculateStudentRisk(studentId);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Batch recalculate risk scores for all active students' })
  recalculateAll() {
    return this.riskService.recalculateAll();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get HIGH and CRITICAL risk student alerts' })
  getAlerts(@Req() req: any) {
    return this.riskService.getAlerts(req.user);
  }
}
