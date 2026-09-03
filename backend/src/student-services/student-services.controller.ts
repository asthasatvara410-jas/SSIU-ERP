import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentServicesService } from './student-services.service';
import {
  CreateServiceRequestDto,
  AssignServiceRequestDto,
  UpdateServiceRequestStatusDto,
  ResolveServiceRequestDto,
  RejectServiceRequestDto,
  AddServiceRequestMessageDto,
  ServiceRequestQueryDto,
} from './dto/service-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { RequireRole } from '../rbac/require-role.decorator';
import { RequireScope } from '../rbac/require-scope.decorator';

@ApiTags('Digital Student Services & Campus Requests')
@Controller('api/v1/student-services')
export class StudentServicesController {
  constructor(private readonly servicesService: StudentServicesService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get Configurable Digital Student Service Catalog' })
  getServiceCatalog() {
    return this.servicesService.getServiceCatalog();
  }

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Service Request Dashboard Metrics & Queue Status' })
  getServiceRequestDashboardMetrics(@Req() req: any) {
    return this.servicesService.getServiceRequestDashboardMetrics(req.user);
  }

  // ── Service Requests ──────────────────────────────────────────────────────

  @Post('requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Digital Student Service Request' })
  createServiceRequest(@Req() req: any, @Body() dto: CreateServiceRequestDto) {
    return this.servicesService.createServiceRequest(req.user, dto);
  }

  @Get('requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'List Service Requests (Strictly scoped: Student gets own only, Staff gets department queue)' })
  getStudentRequests(@Req() req: any, @Query() query: ServiceRequestQueryDto) {
    return this.servicesService.getServiceRequests(req.user, query);
  }

  @Get('requests/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Service Request Details by ID (Enforces server-side student privacy & staff authorization)' })
  getRequestById(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.getRequestById(id, req.user);
  }

  @Patch('requests/:id/assign')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole('STAFF', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('STUDENT_SERVICES', 'ASSIGN')
  @ApiOperation({ summary: 'Assign Service Request to Staff / Department' })
  assignServiceRequest(@Param('id') id: string, @Req() req: any, @Body() dto: AssignServiceRequestDto) {
    return this.servicesService.assignServiceRequest(id, req.user, dto);
  }

  @Patch('requests/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('STUDENT_SERVICES', 'EDIT')
  @ApiOperation({ summary: 'Update Service Request status' })
  updateServiceRequestStatus(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateServiceRequestStatusDto) {
    return this.servicesService.updateServiceRequestStatus(id, req.user, dto);
  }

  @Patch('requests/:id/resolve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole('STAFF', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('STUDENT_SERVICES', 'APPROVE')
  @ApiOperation({ summary: 'Resolve Service Request with completion details' })
  resolveServiceRequest(@Param('id') id: string, @Req() req: any, @Body() dto: ResolveServiceRequestDto) {
    return this.servicesService.resolveServiceRequest(id, req.user, dto);
  }

  @Patch('requests/:id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole('STAFF', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN')
  @RequirePermission('STUDENT_SERVICES', 'REJECT')
  @ApiOperation({ summary: 'Reject Service Request with mandatory reason' })
  rejectServiceRequest(@Param('id') id: string, @Req() req: any, @Body() dto: RejectServiceRequestDto) {
    return this.servicesService.rejectServiceRequest(id, req.user, dto);
  }

  @Post('requests/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireScope('OWN')
  @ApiOperation({ summary: 'Cancel Service Request (Student only, if unapproved)' })
  cancelRequest(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.cancelRequest(id, req.user);
  }

  // ── Conversations / Messages ──────────────────────────────────────────────

  @Post('requests/:id/messages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send response or clarification message on Service Request' })
  addRequestMessage(@Param('id') id: string, @Req() req: any, @Body() dto: AddServiceRequestMessageDto) {
    return this.servicesService.addRequestMessage(id, req.user, dto);
  }

  @Get('requests/:id/history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Service Request chronological audit history' })
  getRequestHistory(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.getRequestHistory(id, req.user);
  }

  // ── Certificates ──────────────────────────────────────────────────────────

  @Post('requests/:id/generate-certificate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole('STAFF', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR')
  @RequirePermission('STUDENT_SERVICES', 'APPROVE')
  @ApiOperation({ summary: 'Generate Digital Certificate upon Request Approval' })
  generateCertificate(@Param('id') id: string, @Body('signatoryTitle') signatoryTitle?: string) {
    return this.servicesService.generateCertificate(id, signatoryTitle);
  }

  @Get('certificates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Student Certificates' })
  getCertificates(@Req() req: any) {
    return this.servicesService.getCertificates(req.user);
  }

  @Get('certificates/verify/:certificateNumber')
  @ApiOperation({ summary: 'Public Digital Certificate Verification Endpoint' })
  verifyCertificate(@Param('certificateNumber') certificateNumber: string) {
    return this.servicesService.verifyCertificate(certificateNumber);
  }
}
