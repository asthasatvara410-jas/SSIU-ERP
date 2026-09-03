import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NaacService } from './naac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('NAAC Accreditation & Quality Metrics')
@ApiBearerAuth()
@Controller('api/v1/naac')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NaacController {
  constructor(private readonly naacService: NaacService) {}

  @Get('criteria')
  @ApiOperation({ summary: 'Get NAAC Criteria & Metrics structure' })
  getCriteria() {
    return this.naacService.getCriteria();
  }

  @Post('criteria')
  @RequirePermission('NAAC', 'CREATE')
  @ApiOperation({ summary: 'Add NAAC Criterion' })
  createCriterion(
    @Body('criterionNumber') criterionNumber: number,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('weightage') weightage?: number,
  ) {
    return this.naacService.createCriterion(criterionNumber, title, description, weightage);
  }

  @Post('metrics')
  @RequirePermission('NAAC', 'CREATE')
  @ApiOperation({ summary: 'Add NAAC Metric' })
  createMetric(
    @Body('criterionId') criterionId: string,
    @Body('metricNumber') metricNumber: string,
    @Body('name') name: string,
    @Body('description') description?: string,
    @Body('metricType') metricType?: string,
    @Body('weightage') weightage?: number,
  ) {
    return this.naacService.createMetric(criterionId, metricNumber, name, description, metricType, weightage);
  }

  @Post('data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Department submits NAAC metric data' })
  submitMetricData(
    @Req() req: any,
    @Body('metricId') metricId: string,
    @Body('academicYear') academicYear: string,
    @Body('dataValue') dataValue: string,
    @Body('instituteId') instituteId?: string,
    @Body('departmentId') departmentId?: string,
  ) {
    return this.naacService.submitMetricData(metricId, academicYear, dataValue, req.user.id, instituteId, departmentId);
  }

  @Get('data')
  @ApiOperation({ summary: 'List submitted NAAC metric data' })
  @ApiQuery({ name: 'academicYear', required: false })
  @ApiQuery({ name: 'status', required: false })
  getMetricData(@Query('academicYear') academicYear?: string, @Query('status') status?: string) {
    return this.naacService.getMetricData(academicYear, status);
  }

  @Patch('data/:id/verify')
  @RequirePermission('NAAC', 'APPROVE')
  @ApiOperation({ summary: 'Verify/Approve NAAC Metric Data (HOD_VERIFIED, IQAC_VERIFIED, APPROVED, RETURNED)' })
  verifyMetricData(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.naacService.verifyMetricData(id, status, req.user.id);
  }

  @Post('evidence')
  @ApiOperation({ summary: 'Upload Evidence document for NAAC metric data' })
  uploadEvidence(
    @Req() req: any,
    @Body('metricDataId') metricDataId: string,
    @Body('documentTitle') documentTitle: string,
    @Body('documentUrl') documentUrl: string,
  ) {
    return this.naacService.uploadEvidence(metricDataId, documentTitle, documentUrl, req.user.id);
  }
}
