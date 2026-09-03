import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EdpService } from './edp.service';
import {
  CreateEdpDutyDto,
  UpdateEdpDutyDto,
  SubmitEdpObservationDto,
  VerifyEdpDutyDto,
  UploadDutyPhotoDto,
  EdpDutyQueryDto,
} from './dto/edp.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('EDP Duty & Academic Surveillance Inspection Management')
@ApiBearerAuth()
@Controller('api/v1/edp')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EdpController {
  constructor(private readonly edpService: EdpService) {}

  // ── Reports & Dashboard ───────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get EDP Duty Dashboard KPIs & Inspection Summary' })
  getEdpDashboardMetrics(@Req() req: any) {
    return this.edpService.getEdpDashboardMetrics(req.user);
  }

  @Get('reports/dates')
  @ApiOperation({ summary: 'Get Date-wise EDP Inspection & Attendance Report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getDateWiseReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.edpService.getDateWiseReport(startDate, endDate);
  }

  @Get('reports/departments')
  @ApiOperation({ summary: 'Get Department-wise EDP Inspection & Compliance Summary' })
  getDepartmentWiseReport() {
    return this.edpService.getDepartmentWiseReport();
  }

  @Get('reports/faculty')
  @ApiOperation({ summary: 'Get Faculty-wise Lecture Inspection & Observed Attendance Report' })
  getFacultyWiseReport() {
    return this.edpService.getFacultyWiseReport();
  }

  @Get('reports/classes')
  @ApiOperation({ summary: 'Get Class/Room-wise Inspection Frequency & Attendance Density' })
  getClassWiseReport() {
    return this.edpService.getClassWiseReport();
  }

  @Get('reports/students')
  @ApiOperation({ summary: 'Get Student-wise Attendance & Conduct Observations' })
  @ApiQuery({ name: 'enrollmentNo', required: false })
  getStudentWiseReport(@Query('enrollmentNo') enrollmentNo?: string) {
    return this.edpService.getStudentWiseReport(enrollmentNo);
  }

  // ── 1. Duty CRUD ──────────────────────────────────────────────────────────

  @Post('duties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create & Assign new EDP Inspection Duty' })
  createDuty(@Req() req: any, @Body() dto: CreateEdpDutyDto) {
    return this.edpService.createDuty(req.user, dto);
  }

  @Get('duties')
  @ApiOperation({ summary: 'List EDP Duties with search, department/officer scope, date & status filter' })
  getDuties(@Req() req: any, @Query() query: EdpDutyQueryDto) {
    return this.edpService.getDuties(req.user, query);
  }

  @Get('duties/:id')
  @ApiOperation({ summary: 'Get EDP Duty details, classroom photos, student observations & audit trail' })
  getDutyById(@Param('id') id: string, @Req() req: any) {
    return this.edpService.getDutyById(id, req.user);
  }

  @Patch('duties/:id')
  @ApiOperation({ summary: 'Update EDP Duty parameters' })
  updateDuty(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateEdpDutyDto) {
    return this.edpService.updateDuty(id, req.user, dto);
  }

  @Delete('duties/:id')
  @ApiOperation({ summary: 'Delete EDP Duty record' })
  deleteDuty(@Param('id') id: string, @Req() req: any) {
    return this.edpService.deleteDuty(id, req.user);
  }

  // ── 2. Inspection Execution & Observations ────────────────────────────────

  @Patch('duties/:id/start')
  @ApiOperation({ summary: 'EDP Officer starts classroom inspection' })
  startDuty(@Param('id') id: string, @Req() req: any) {
    return this.edpService.startDuty(id, req.user);
  }

  @Post('duties/:id/observations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit classroom inspection observation, student attendance & photos' })
  submitObservation(@Param('id') id: string, @Req() req: any, @Body() dto: SubmitEdpObservationDto) {
    return this.edpService.submitObservation(id, req.user, dto);
  }

  @Patch('duties/:id/verify')
  @ApiOperation({ summary: 'Supervisor / Academic Dean verifies submitted EDP inspection' })
  verifyDuty(@Param('id') id: string, @Req() req: any, @Body() dto?: VerifyEdpDutyDto) {
    return this.edpService.verifyDuty(id, req.user, dto);
  }

  // ── 3. Classroom Photos ───────────────────────────────────────────────────

  @Post('duties/:id/photos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload geo-tagged & timestamped classroom photo' })
  uploadDutyPhoto(@Param('id') id: string, @Req() req: any, @Body() dto: UploadDutyPhotoDto) {
    return this.edpService.uploadDutyPhoto(id, req.user, dto);
  }

  @Delete('photos/:photoId')
  @ApiOperation({ summary: 'Delete classroom inspection photo' })
  deleteDutyPhoto(@Param('photoId') photoId: string, @Req() req: any) {
    return this.edpService.deleteDutyPhoto(photoId, req.user);
  }
}
