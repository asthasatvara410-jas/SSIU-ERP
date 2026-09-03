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
import { AbcService } from './abc.service';
import { LinkAbcIdDto, VerifyAbcDto, SyncAbcDto, RetrySyncDto } from './dto/abc.dto';

@ApiTags('Academic Bank of Credits (ABC)')
@ApiBearerAuth()
@Controller('api/v1/abc')
export class AbcController {
  constructor(private readonly abcService: AbcService) {}

  // ----------------------------------------------------
  // 0. FOUNDATION OVERVIEW & UNIFIED KPI DASHBOARD
  // ----------------------------------------------------

  @Get('foundation-overview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unified ABC Foundation overview, academic structure & accreditation counts' })
  @ApiResponse({ status: 200, description: 'Live ABC Foundation statistics retrieved successfully' })
  async getFoundationOverview(@Req() req: any) {
    const data = await this.abcService.getFoundationOverview(req.user);
    return {
      success: true,
      data,
      correlationId: `abc-fnd-${Date.now()}`,
    };
  }

  // ----------------------------------------------------
  // 1. STUDENT AUTHENTICATED ENDPOINTS (req.user scoped)
  // ----------------------------------------------------

  @Get(['me', 'my-profile'])
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated student ABC profile & credit transcript' })
  @ApiResponse({ status: 200, description: 'Student ABC profile details' })
  async getMyAbcProfile(@Req() req: any) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const data = await this.abcService.getStudentAbcProfile(studentId, req.user);
    return {
      success: true,
      data,
      correlationId: `req-${Date.now()}`,
    };
  }

  @Get('me/credits')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated student academic credits ledger' })
  @ApiResponse({ status: 200, description: 'Course credit ledger and SGPA calculation' })
  async getMyCredits(@Req() req: any) {
    const studentId = req.user?.studentId || req.user?.id;
    if (!studentId) {
      throw new UnauthorizedException('Authenticated student profile identity not found');
    }
    const credits = await this.abcService.getStudentCredits(studentId, req.user);
    return {
      success: true,
      data: credits,
      correlationId: `req-${Date.now()}`,
    };
  }

  // ----------------------------------------------------
  // 2. ADMIN / MENTOR / REGISTRAR ENDPOINTS (RBAC scoped)
  // ----------------------------------------------------

  @Get('students')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List student ABC compliance records with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Paginated list of student ABC compliance records' })
  async listStudents(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const res = await this.abcService.listStudentsAbc(
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
      correlationId: `req-${Date.now()}`,
    };
  }

  @Get('students/:studentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single student ABC profile by student ID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student ABC profile details' })
  async getStudentAbcProfile(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    const data = await this.abcService.getStudentAbcProfile(studentId, req.user);
    return {
      success: true,
      data,
      correlationId: `req-${Date.now()}`,
    };
  }

  @Post('students/:studentId/link')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Link 12-digit ABC ID to a student profile' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiBody({ type: LinkAbcIdDto })
  @ApiResponse({ status: 201, description: 'ABC ID successfully linked and normalized' })
  async linkStudentAbcId(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body() dto: LinkAbcIdDto,
  ) {
    const data = await this.abcService.linkAbcId(studentId, dto, req.user);
    return {
      success: true,
      message: 'ABC ID successfully linked and submitted for institutional verification.',
      data,
      correlationId: `link-${Date.now()}`,
    };
  }

  @Post('students/:studentId/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify or reject linked ABC ID (Mentor/Registrar action)' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiBody({ type: VerifyAbcDto })
  @ApiResponse({ status: 200, description: 'Verification decision recorded' })
  async verifyStudentAbcId(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body() dto: VerifyAbcDto,
  ) {
    const data = await this.abcService.verifyAbcId(studentId, dto, req.user);
    return {
      success: true,
      message: `ABC ID verification status updated to ${dto.status}.`,
      data,
      correlationId: `ver-${Date.now()}`,
    };
  }

  @Post('students/:studentId/sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Synchronize student credits to National Academic Depository (DigiLocker)' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiBody({ type: SyncAbcDto })
  @ApiResponse({ status: 200, description: 'Depository sync operation status' })
  async syncStudentCredits(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body() dto: SyncAbcDto,
  ) {
    const result = await this.abcService.syncStudent(studentId, dto, req.user);
    return {
      success: result.success,
      data: result,
      message: result.adapterMessage,
      correlationId: result.correlationId,
    };
  }

  @Post('sync/retry')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retry failed DigiLocker/ABC sync queue items' })
  @ApiBody({ type: RetrySyncDto })
  @ApiResponse({ status: 200, description: 'Batch retry execution results' })
  async retrySync(@Req() req: any, @Body() dto: RetrySyncDto) {
    const result = await this.abcService.retrySync(dto, req.user);
    return {
      success: true,
      data: result,
      correlationId: `retry-${Date.now()}`,
    };
  }
}
