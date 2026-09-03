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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LateFeeService } from './late-fee.service';
import {
  CreateLateFeeRuleDto,
  UpdateLateFeeRuleDto,
  UpdateLateFeeRuleStatusDto,
  LateFeeRuleQueryDto,
} from './dto/late-fee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Late Fee & Failed Payments')
@ApiBearerAuth()
@Controller('api/v1')
export class LateFeeController {
  constructor(private readonly lateFeeService: LateFeeService) {}

  // ─── Late Fee Rule Management ───────────────────────────────────────────────

  /**
   * POST /api/v1/late-fee-rules
   * Create a new late fee rule (Admin/Accounts only)
   */
  @Post('late-fee-rules')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Late Fee Rule (FIXED/PER_DAY/PERCENTAGE/ONE_TIME)' })
  createLateFeeRule(@Body() dto: CreateLateFeeRuleDto, @Req() req: any) {
    return this.lateFeeService.createLateFeeRule(dto, req.user);
  }

  /**
   * GET /api/v1/late-fee-rules
   * List all late fee rules with optional filters
   */
  @Get('late-fee-rules')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List all Late Fee Rules with optional filters' })
  getLateFeeRules(@Query() query: LateFeeRuleQueryDto) {
    return this.lateFeeService.getLateFeeRules(query);
  }

  /**
   * GET /api/v1/late-fee-rules/:id
   */
  @Get('late-fee-rules/:id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get a Late Fee Rule by ID' })
  getLateFeeRuleById(@Param('id') id: string) {
    return this.lateFeeService.getLateFeeRuleById(id);
  }

  /**
   * PATCH /api/v1/late-fee-rules/:id
   */
  @Patch('late-fee-rules/:id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'UPDATE')
  @ApiOperation({ summary: 'Update a Late Fee Rule' })
  updateLateFeeRule(
    @Param('id') id: string,
    @Body() dto: UpdateLateFeeRuleDto,
    @Req() req: any,
  ) {
    return this.lateFeeService.updateLateFeeRule(id, dto, req.user);
  }

  /**
   * PATCH /api/v1/late-fee-rules/:id/status
   */
  @Patch('late-fee-rules/:id/status')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'UPDATE')
  @ApiOperation({ summary: 'Activate or deactivate a Late Fee Rule' })
  updateLateFeeRuleStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLateFeeRuleStatusDto,
    @Req() req: any,
  ) {
    return this.lateFeeService.updateLateFeeRuleStatus(id, dto, req.user);
  }

  // ─── Late Fee Calculation ──────────────────────────────────────────────────

  /**
   * GET /api/v1/fee-invoices/:id/late-fee
   * Calculate current late fee for an invoice (read-only, no DB write)
   */
  @Get('fee-invoices/:id/late-fee')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get calculated late fee for an invoice (live calculation, no DB change)' })
  calculateLateFee(@Param('id') id: string, @Req() req: any) {
    return this.lateFeeService.calculateLateFeeForInvoice(id, req.user);
  }

  /**
   * POST /api/v1/fee-invoices/:id/recalculate-late-fee
   * Recalculate and persist late fee for an invoice (idempotent)
   */
  @Post('fee-invoices/:id/recalculate-late-fee')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'UPDATE')
  @ApiOperation({ summary: 'Recalculate and save late fee for an overdue invoice (idempotent)' })
  recalculateLateFee(@Param('id') id: string, @Req() req: any) {
    return this.lateFeeService.recalculateAndApplyLateFee(id, req.user);
  }

  /**
   * GET /api/v1/fee-invoices/overdue
   * Get all overdue invoices with late fee summary for Admin
   */
  @Get('fee-invoices/overdue')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get all overdue invoices with calculated late fees (Admin only)' })
  getOverdueInvoices(
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
    @Query('semesterId') semesterId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.lateFeeService.getOverdueInvoicesSummary({
      instituteId,
      programId,
      semesterId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // ─── Failed Payment Report ─────────────────────────────────────────────────

  /**
   * GET /api/v1/payments/failed
   * List all failed payment transactions with filters
   */
  @Get('payments/failed')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List failed payment transactions with filters for Admin reporting' })
  getFailedPayments(
    @Query('invoiceId') invoiceId: string,
    @Query('studentId') studentId: string,
    @Query('gateway') gateway: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.lateFeeService.getFailedPayments(
      {
        invoiceId,
        studentId,
        gateway,
        fromDate,
        toDate,
        search,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      },
      req.user,
    );
  }
}
