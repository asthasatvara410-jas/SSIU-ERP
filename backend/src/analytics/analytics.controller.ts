import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequireRole } from '../rbac/require-role.decorator';
import { AnalyticsService, MANAGEMENT_ROLES } from './analytics.service';
import { ManagementAnalyticsQueryDto } from './dto/management-analytics-query.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller(['api/v1/analytics', 'analytics'])
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 7: MANAGEMENT ANALYTICS & KPI ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('management/summary')
  @RequireRole(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Get executive KPI cards summary (Students, Staff, Notesheets, Expense, Outings, Tickets)' })
  async getManagementSummary(@Req() req: any, @Query() query: ManagementAnalyticsQueryDto) {
    return this.analyticsService.getManagementSummary(req.user, query);
  }

  @Get('management/notesheets')
  @RequireRole(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Get Notesheet approval pipeline, department breakdowns, and oldest pending' })
  async getManagementNotesheets(@Req() req: any, @Query() query: ManagementAnalyticsQueryDto) {
    return this.analyticsService.getManagementNotesheets(req.user, query);
  }

  @Get('management/expenses')
  @RequireRole(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Get monthly approved expense trends and department-wise sanctioned amounts' })
  async getManagementExpenses(@Req() req: any, @Query() query: ManagementAnalyticsQueryDto) {
    return this.analyticsService.getManagementExpenses(req.user, query);
  }

  @Get('management/gate-pass')
  @RequireRole(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Get hostel gate pass outings, currently outside count, and daily outing trends' })
  async getManagementGatePass(@Req() req: any, @Query() query: ManagementAnalyticsQueryDto) {
    return this.analyticsService.getManagementGatePass(req.user, query);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRE-PHASE-7 EXISTING ENDPOINTS (Preserved 100%)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get role-scoped dashboard metrics' })
  async getDashboard(@Req() req: any) {
    const role = req.user?.role || 'STUDENT';
    const userId = req.user?.sub || req.user?.id;
    return this.analyticsService.getDashboardMetrics(role, userId);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get consolidated university overview analytics' })
  async getOverview(@Query() query: any) {
    return this.analyticsService.getOverviewAnalytics(query);
  }

  @Get('academic')
  @ApiOperation({ summary: 'Get academic and attendance analytics' })
  async getAcademic(@Query() query: any) {
    return this.analyticsService.getAcademicAnalytics(query);
  }

  @Get('finance')
  @ApiOperation({ summary: 'Get finance and fee collection analytics' })
  async getFinance() {
    return this.analyticsService.getFinanceAnalytics();
  }

  @Get('library')
  @ApiOperation({ summary: 'Get library inventory and circulation analytics' })
  async getLibrary() {
    return this.analyticsService.getLibraryAnalytics();
  }
}
