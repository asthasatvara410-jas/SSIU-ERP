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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterService } from './register.service';
import {
  CreateInwardRegisterDto,
  UpdateInwardRegisterDto,
  InwardForwardDto,
  InwardActionDto,
  InwardStatusUpdateDto,
  InwardQueryDto,
  CreateOutwardRegisterDto,
  UpdateOutwardRegisterDto,
  OutwardDispatchDto,
  OutwardDeliveryDto,
  OutwardReturnDto,
  OutwardStatusUpdateDto,
  OutwardQueryDto,
} from './dto/register.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('University Inward & Outward Register')
@ApiBearerAuth()
@Controller('api/v1/registers')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Inward & Outward KPI metrics and real-time dashboard data' })
  getDashboardMetrics() {
    return this.registerService.getRegisterDashboardMetrics();
  }

  @Get('reports/departments')
  @ApiOperation({ summary: 'Get Department-wise Inward & Outward volume summary report' })
  getDepartmentSummary() {
    return this.registerService.getDepartmentRegisterSummary();
  }

  @Get('reports/:reportType')
  @ApiOperation({ summary: 'Get dataset for one of 10 official University Inward/Outward reports' })
  getReport(@Param('reportType') reportType: string, @Query() query: any) {
    return this.registerService.getRegisterReports(reportType, query);
  }

  // ── 1. Inward Register ────────────────────────────────────────────────────

  @Post('inward')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Inward Register entry with auto-generated sequential number' })
  createInward(@Req() req: any, @Body() dto: CreateInwardRegisterDto) {
    return this.registerService.createInward(req.user.id, dto);
  }

  @Get('inward')
  @ApiOperation({ summary: 'List Inward entries with search, department, priority, status, and date filters' })
  getInwards(@Req() req: any, @Query() query: InwardQueryDto) {
    return this.registerService.getInwards(req.user, query);
  }

  @Get('inward/:id')
  @ApiOperation({ summary: 'Get Inward entry details, forwarding history, and audit timeline' })
  getInwardById(@Req() req: any, @Param('id') id: string) {
    return this.registerService.getInwardById(id, req.user);
  }

  @Patch('inward/:id')
  @ApiOperation({ summary: 'Update Inward entry details' })
  updateInward(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateInwardRegisterDto) {
    return this.registerService.updateInward(id, req.user, dto);
  }

  @Post('inward/:id/forward')
  @ApiOperation({ summary: 'Forward inward communication to a department/user/office with action requirement' })
  forwardInward(@Req() req: any, @Param('id') id: string, @Body() dto: InwardForwardDto) {
    return this.registerService.forwardInward(id, req.user, dto);
  }

  @Post('inward/:id/action')
  @ApiOperation({ summary: 'Record action taken on an assigned inward communication' })
  recordInwardAction(@Req() req: any, @Param('id') id: string, @Body() dto: InwardActionDto) {
    return this.registerService.recordInwardAction(id, req.user, dto);
  }

  @Post('inward/:id/complete')
  @ApiOperation({ summary: 'Mark inward communication as COMPLETED' })
  completeInward(@Req() req: any, @Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.registerService.completeInward(id, req.user, remarks);
  }

  @Post('inward/:id/close')
  @ApiOperation({ summary: 'Archive and close an inward communication record' })
  closeInward(@Req() req: any, @Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.registerService.closeInward(id, req.user, remarks);
  }

  @Patch('inward/:id/status')
  @ApiOperation({ summary: 'Update Inward status and reassign if necessary' })
  updateInwardStatus(@Req() req: any, @Param('id') id: string, @Body() dto: InwardStatusUpdateDto) {
    return this.registerService.updateInwardStatus(id, req.user, dto);
  }

  @Delete('inward/:id')
  @ApiOperation({ summary: 'Delete Inward Register entry' })
  deleteInward(@Req() req: any, @Param('id') id: string) {
    return this.registerService.deleteInward(id, req.user);
  }

  @Get('inward/:id/audit')
  @ApiOperation({ summary: 'Get Inward chronological audit history' })
  getInwardAudit(@Param('id') id: string) {
    return this.registerService.getAuditHistory('INWARD', id);
  }

  // ── 2. Outward Register ───────────────────────────────────────────────────

  @Post('outward')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Outward / Dispatch Register entry with auto-generated sequential number' })
  createOutward(@Req() req: any, @Body() dto: CreateOutwardRegisterDto) {
    return this.registerService.createOutward(req.user.id, dto);
  }

  @Get('outward')
  @ApiOperation({ summary: 'List Outward entries with search, department, mode, status, and date filters' })
  getOutwards(@Req() req: any, @Query() query: OutwardQueryDto) {
    return this.registerService.getOutwards(req.user, query);
  }

  @Get('outward/:id')
  @ApiOperation({ summary: 'Get Outward entry details, dispatch history, and audit timeline' })
  getOutwardById(@Req() req: any, @Param('id') id: string) {
    return this.registerService.getOutwardById(id, req.user);
  }

  @Patch('outward/:id')
  @ApiOperation({ summary: 'Update Outward entry details' })
  updateOutward(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOutwardRegisterDto) {
    return this.registerService.updateOutward(id, req.user, dto);
  }

  @Post('outward/:id/dispatch')
  @ApiOperation({ summary: 'Dispatch outward communication with courier/service and tracking number' })
  dispatchOutward(@Req() req: any, @Param('id') id: string, @Body() dto: OutwardDispatchDto) {
    return this.registerService.dispatchOutward(id, req.user, dto);
  }

  @Post('outward/:id/delivery')
  @ApiOperation({ summary: 'Record confirmed delivery of an outward communication' })
  recordOutwardDelivery(@Req() req: any, @Param('id') id: string, @Body() dto: OutwardDeliveryDto) {
    return this.registerService.recordOutwardDelivery(id, req.user, dto);
  }

  @Post('outward/:id/return')
  @ApiOperation({ summary: 'Record returned/undelivered status for an outward communication' })
  recordOutwardReturn(@Req() req: any, @Param('id') id: string, @Body() dto: OutwardReturnDto) {
    return this.registerService.recordOutwardReturn(id, req.user, dto);
  }

  @Patch('outward/:id/status')
  @ApiOperation({ summary: 'Update Outward status, tracking number, or delivered date' })
  updateOutwardStatus(@Req() req: any, @Param('id') id: string, @Body() dto: OutwardStatusUpdateDto) {
    return this.registerService.updateOutwardStatus(id, req.user, dto);
  }

  @Delete('outward/:id')
  @ApiOperation({ summary: 'Delete Outward Register entry' })
  deleteOutward(@Req() req: any, @Param('id') id: string) {
    return this.registerService.deleteOutward(id, req.user);
  }

  @Get('outward/:id/audit')
  @ApiOperation({ summary: 'Get Outward chronological audit history' })
  getOutwardAudit(@Param('id') id: string) {
    return this.registerService.getAuditHistory('OUTWARD', id);
  }
}
