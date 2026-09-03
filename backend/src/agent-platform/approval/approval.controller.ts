import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApprovalEngineService, CreateApprovalRequestDto, RevalidationContext } from './approval-engine.service';

@ApiTags('Agents - Human-In-The-Loop Approvals')
@ApiBearerAuth()
@Controller('api/v1/approvals')
export class ApprovalController {
  constructor(private readonly approvalEngine: ApprovalEngineService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List pending human-in-the-loop approvals' })
  @ApiQuery({ name: 'role', required: false, description: 'Role filter' })
  async listApprovals(@Request() req: any, @Query('role') role?: string) {
    this.assertAdminRole(req.user?.role);
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.approvalEngine.listPendingApprovals(role, tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get approval ticket details' })
  @ApiParam({ name: 'id', description: 'Approval ID' })
  async getApprovalDetails(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.approvalEngine.getApprovalDetails(id, tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create approval request ticket' })
  async createApproval(@Request() req: any, @Body() dto: CreateApprovalRequestDto) {
    this.assertAdminRole(req.user?.role);
    return this.approvalEngine.createApprovalRequest({
      ...dto,
      tenantId: dto.tenantId || req.user?.tenantId || 'DEFAULT',
      requestedBy: req.user?.id || 'admin',
    });
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve ticket with comments' })
  @ApiParam({ name: 'id', description: 'Approval ID' })
  async approveTicket(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.assertAdminRole(req.user?.role);
    return this.approvalEngine.approve({
      approvalId: id,
      reviewerUserId: req.user?.id || 'admin-user',
      reviewerRole: req.user?.role || 'HOD',
      tenantId: req.user?.tenantId || 'DEFAULT',
      reason: body?.reason,
    });
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reject ticket with comments' })
  @ApiParam({ name: 'id', description: 'Approval ID' })
  async rejectTicket(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.assertAdminRole(req.user?.role);
    return this.approvalEngine.reject({
      approvalId: id,
      reviewerUserId: req.user?.id || 'admin-user',
      reviewerRole: req.user?.role || 'HOD',
      tenantId: req.user?.tenantId || 'DEFAULT',
      reason: body?.reason || 'Rejected by authorized reviewer.',
    });
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel approval ticket' })
  @ApiParam({ name: 'id', description: 'Approval ID' })
  async cancelTicket(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.approvalEngine.cancel(id, req.user?.id || 'admin-user', tenantId);
  }

  @Post(':id/revalidate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revalidate ticket condition' })
  @ApiParam({ name: 'id', description: 'Approval ID' })
  async revalidateTicket(@Request() req: any, @Param('id') id: string, @Body() context: RevalidationContext) {
    this.assertAdminRole(req.user?.role);
    return this.approvalEngine.revalidateApproval(id, {
      ...context,
      tenantId: context.tenantId || req.user?.tenantId || 'DEFAULT',
    });
  }

  private assertAdminRole(role?: string) {
    const allowed = [
      'SYSTEM_ADMIN',
      'SUPER_ADMIN',
      'UNIVERSITY_ADMIN',
      'PRESIDENT',
      'VICE_PRESIDENT',
      'PROVOST',
      'REGISTRAR',
      'DEPUTY_REGISTRAR',
      'HOI',
      'PRINCIPAL',
      'HOD',
      'STUDENT_SECTION',
      'FINANCE_OFFICER',
      'ACCOUNTS_ADMIN',
      'IQAC',
      'IQAC_COORDINATOR',
      'IT_ADMIN',
    ];
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException('Access denied: Human-in-the-loop approvals require administrative privileges.');
    }
  }
}
