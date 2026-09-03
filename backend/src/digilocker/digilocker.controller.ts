import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Req, 
  UseGuards, 
  Query, 
  ForbiddenException, 
  UnauthorizedException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DigiLockerService } from './digilocker.service';
import { DigiLockerAuthService } from './digilocker-auth.service';
import { DigiLockerDocumentService } from './digilocker-document.service';
import { ConsentDto, InitiateConnectDto, CallbackDto, IssueDocumentDto, SyncDocumentDto, RetrySyncDto } from './dto/digilocker.dto';

@ApiTags('DigiLocker Integration')
@ApiBearerAuth()
@Controller('api/v1/digilocker')
export class DigiLockerController {
  constructor(
    private readonly digiLockerService: DigiLockerService,
    private readonly authService: DigiLockerAuthService,
    private readonly documentService: DigiLockerDocumentService,
  ) {}

  // ----------------------------------------------------
  // 0. FOUNDATION & COMMAND OVERVIEW (Multi-role RBAC)
  // ----------------------------------------------------

  @Get('health')
  @ApiOperation({ summary: 'DigiLocker requester gateway health and readiness diagnostics' })
  @ApiResponse({ status: 200, description: 'DigiLocker gateway health and readiness details' })
  async getHealth() {
    const data = await this.digiLockerService.getHealth();
    return {
      success: true,
      data,
      correlationId: `dl-hlth-${Date.now()}`,
    };
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unified DigiLocker integration overview, metrics, and health status' })
  @ApiResponse({ status: 200, description: 'Live DigiLocker overview statistics retrieved successfully' })
  async getOverview(@Req() req: any) {
    const data = await this.digiLockerService.getOverview(req.user);
    return {
      success: true,
      data,
      correlationId: `dl-ovw-${Date.now()}`,
    };
  }

  // ----------------------------------------------------
  // 1. STUDENT AUTHENTICATED ENDPOINTS (req.user scoped)
  // ----------------------------------------------------

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated student DigiLocker connection, consent, and document repository' })
  @ApiResponse({ status: 200, description: 'Student DigiLocker status details' })
  async getMyStatus(@Req() req: any) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.digiLockerService.getStudentStatus(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `dl-stat-${Date.now()}`,
    };
  }

  @Post('consent')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Grant or revoke citizen consent for digital document delivery' })
  @ApiBody({ type: ConsentDto })
  @ApiResponse({ status: 200, description: 'Citizen consent updated' })
  async updateConsent(@Req() req: any, @Body() dto: ConsentDto) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const res = await this.digiLockerService.updateConsent(studentId, dto, tenantId, ip);
    return {
      success: res.success,
      message: res.message,
      data: res.consent,
      correlationId: `dl-con-${Date.now()}`,
    };
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate DigiLocker OAuth2 authorization flow for student' })
  @ApiBody({ type: InitiateConnectDto })
  @ApiResponse({ status: 200, description: 'Authorization request generated' })
  async initiateConnect(@Req() req: any, @Body() dto: InitiateConnectDto) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.authService.initiateConnect(studentId, tenantId);
    return {
      success: true,
      data: res,
      correlationId: `dl-conn-${Date.now()}`,
    };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Process DigiLocker OAuth2 redirect callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  @ApiResponse({ status: 200, description: 'Authorization code exchanged' })
  async handleCallback(@Query() query: CallbackDto) {
    const res = await this.authService.handleCallback(query.code, query.state);
    return {
      success: res.success,
      message: res.message,
      status: res.status,
      correlationId: `dl-cb-${Date.now()}`,
    };
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Synchronize student documents with institutional repository' })
  @ApiBody({ type: SyncDocumentDto })
  @ApiResponse({ status: 200, description: 'Sync operation result' })
  async syncMyDocuments(@Req() req: any, @Body() dto: SyncDocumentDto) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.documentService.syncStudentDocuments(studentId, tenantId, dto);
    return {
      success: res.success,
      data: res,
      correlationId: res.correlationId,
      message: res.message,
    };
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List student digital credentials stored in repository' })
  @ApiResponse({ status: 200, description: 'List of academic documents' })
  async getMyDocuments(@Req() req: any) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const docs = await this.documentService.getStudentDocuments(studentId, tenantId);
    return {
      success: true,
      data: docs,
      correlationId: `dl-docs-${Date.now()}`,
    };
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disconnect student DigiLocker account' })
  @ApiResponse({ status: 200, description: 'Account disconnected' })
  async disconnectMyAccount(@Req() req: any) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.authService.disconnect(studentId, tenantId);
    return {
      success: res.success,
      message: res.message,
      correlationId: `dl-disc-${Date.now()}`,
    };
  }

  // ----------------------------------------------------
  // 2. ADMIN / MENTOR / REGISTRAR ENDPOINTS (RBAC scoped)
  // ----------------------------------------------------

  @Get('admin/students')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List student DigiLocker status bounded by user role and authority' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Paginated list of student document records' })
  async listAdminStudents(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const res = await this.digiLockerService.listAdminStudents(
      req.user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      success: true,
      data: res.data,
      total: res.total,
      page: res.page,
      limit: res.limit,
      scope: res.scope,
      correlationId: `dl-adm-${Date.now()}`,
    };
  }

  @Post('admin/issue/:studentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Issue an academic document to student citizen DigiLocker account' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiBody({ type: IssueDocumentDto })
  @ApiResponse({ status: 201, description: 'Document issued and registered' })
  async issueDocument(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body() dto: IssueDocumentDto,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot issue institutional documents.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    dto.studentId = studentId;
    const res = await this.documentService.issueDocument(dto, tenantId, req.user?.id);
    return {
      success: res.success,
      data: res.document,
      message: res.message,
      correlationId: `dl-iss-${Date.now()}`,
    };
  }

  @Post('admin/retry')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retry failed DigiLocker document issuance or sync' })
  @ApiBody({ type: RetrySyncDto })
  @ApiResponse({ status: 200, description: 'Retry queued' })
  async retryIssuance(@Req() req: any, @Body() dto: RetrySyncDto) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot trigger administrative retries.');
    }
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const res = await this.documentService.retryIssuance(dto, tenantId);
    return {
      success: res.success,
      correlationId: res.correlationId,
      message: res.message,
    };
  }
}
