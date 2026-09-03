import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AgentRegistryService } from '../registry/agent-registry.service';
import { AgentExecutionService } from '../execution/agent-execution.service';
import { AgentApprovalEngineService, ResolveApprovalDto } from '../approval/agent-approval-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PublishEventDto } from '../events/agent-event-bus.service';
import { AgentOrchestratorService } from '../orchestrator/agent-orchestrator.service';

@ApiTags('Agent Platform — Agent Management')
@ApiBearerAuth()
@Controller('api/v1/agents')
export class AgentsController {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  // 1. List all agents
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all registered autonomous ERP agents' })
  @ApiResponse({ status: 200, description: 'List of agents retrieved successfully' })
  async listAgents(@Request() req: any) {
    this.assertAdminRole(req.user?.role);
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.registry.getAllAgents(tenantId);
  }

  // 2. Get single agent details by id or code
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get agent details by ID or code' })
  @ApiParam({ name: 'id', description: 'Agent ID or Agent code (e.g. TIMETABLE_SUBSTITUTION_AGENT)' })
  @ApiResponse({ status: 200, description: 'Agent details retrieved' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgent(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const agent = await this.prisma.agent.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });
    if (!agent) {
      throw new NotFoundException(`Agent '${id}' not found.`);
    }
    return {
      ...agent,
      isImplemented: this.registry.has(agent.code),
    };
  }

  // 3. Enable Agent
  @Post(':id/enable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable an agent (Status -> ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Agent ID or Agent code' })
  async enableAgent(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const agent = await this.prisma.agent.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!agent) throw new NotFoundException(`Agent '${id}' not found.`);
    return this.registry.updateAgentStatus(agent.code, 'ACTIVE', req.user?.tenantId || 'DEFAULT');
  }

  // 4. Disable Agent
  @Post(':id/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable an agent (Status -> DISABLED)' })
  @ApiParam({ name: 'id', description: 'Agent ID or Agent code' })
  async disableAgent(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const agent = await this.prisma.agent.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!agent) throw new NotFoundException(`Agent '${id}' not found.`);
    return this.registry.updateAgentStatus(agent.code, 'DISABLED', req.user?.tenantId || 'DEFAULT');
  }

  // 5. Pause Agent
  @Post(':id/pause')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pause an agent (Status -> PAUSED)' })
  @ApiParam({ name: 'id', description: 'Agent ID or Agent code' })
  async pauseAgent(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const agent = await this.prisma.agent.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!agent) throw new NotFoundException(`Agent '${id}' not found.`);
    return this.registry.updateAgentStatus(agent.code, 'PAUSED', req.user?.tenantId || 'DEFAULT');
  }

  // 6. Get agent executions
  @Get(':id/executions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get execution history for an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID or Agent code' })
  async getAgentExecutions(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const agent = await this.prisma.agent.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!agent) return [];
    return this.prisma.agentExecution.findMany({
      where: { agentId: agent.id },
      take: 20,
      orderBy: { startTime: 'desc' },
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
      throw new ForbiddenException('Access denied: Agent control operations require administrative privileges.');
    }
  }
}

@ApiTags('Agents - Executions')
@ApiBearerAuth()
@Controller('api/v1/agent-executions')
export class AgentExecutionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all agent execution runs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max number of execution records to return' })
  async listExecutions(@Request() req: any, @Query('limit') limit = '50') {
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.prisma.agentExecution.findMany({
      where: { tenantId },
      take: parseInt(limit, 10),
      orderBy: { startTime: 'desc' },
      include: { agent: true, actions: true },
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get execution details by ID' })
  @ApiParam({ name: 'id', description: 'Execution run ID' })
  async getExecutionById(@Request() req: any, @Param('id') id: string) {
    const execution = await this.prisma.agentExecution.findUnique({
      where: { id },
      include: { agent: true, actions: true, approvals: true },
    });
    if (!execution) {
      throw new NotFoundException(`Agent execution '${id}' not found.`);
    }
    return execution;
  }
}

@ApiTags('Agents - Approvals')
@ApiBearerAuth()
@Controller('api/v1/agent-approvals')
export class AgentApprovalsController {
  constructor(
    private readonly approvalEngine: AgentApprovalEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List agent approval requests' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by approval status (e.g. PENDING, APPROVED, REJECTED)' })
  async listApprovals(@Request() req: any, @Query('status') status?: string) {
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.prisma.agentApproval.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { agent: true, execution: true },
    });
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve an agent action ticket' })
  @ApiParam({ name: 'id', description: 'Approval ticket ID' })
  async approveTicket(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.approvalEngine.resolveApprovalTicket({
      approvalId: id,
      actionTakenBy: req.user?.id || 'admin-user',
      actionTakenRole: req.user?.role || 'SUPER_ADMIN',
      decision: 'APPROVED',
      reason: body?.reason || 'Approved via Admin Approval Center',
    });
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reject an agent action ticket' })
  @ApiParam({ name: 'id', description: 'Approval ticket ID' })
  async rejectTicket(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.approvalEngine.resolveApprovalTicket({
      approvalId: id,
      actionTakenBy: req.user?.id || 'admin-user',
      actionTakenRole: req.user?.role || 'SUPER_ADMIN',
      decision: 'REJECTED',
      reason: body?.reason || 'Rejected via Admin Approval Center',
    });
  }
}

@ApiTags('Agents - Events')
@ApiBearerAuth()
@Controller('api/v1/agent-events')
export class AgentEventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List automation events' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events to retrieve' })
  async listEvents(@Request() req: any, @Query('limit') limit = '50') {
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.prisma.automationEvent.findMany({
      where: { tenantId },
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: { jobs: true },
    });
  }
}

@ApiTags('Agents - Jobs')
@ApiBearerAuth()
@Controller('api/v1/agent-jobs')
export class AgentJobsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List automation jobs' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter jobs by status' })
  async listJobs(@Request() req: any, @Query('status') status?: string) {
    return this.prisma.automationJob.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { event: true },
    });
  }
}

@ApiTags('Agents - Audit')
@ApiBearerAuth()
@Controller('api/v1/agent-audit')
export class AgentAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get agent action audit logs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of audit logs to retrieve' })
  async getAuditLogs(@Request() req: any, @Query('limit') limit = '50') {
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.prisma.agentAuditLog.findMany({
      where: { tenantId },
      take: parseInt(limit, 10),
      orderBy: { timestamp: 'desc' },
      include: { agent: true },
    });
  }
}

@ApiTags('Agents - Overview & Dashboard')
@ApiBearerAuth()
@Controller('api/v1/agent-platform')
export class AgentPlatformController {
  constructor(
    private readonly orchestrator: AgentOrchestratorService,
    private readonly executionService: AgentExecutionService,
    private readonly approvalEngine: AgentApprovalEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard-stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get agent automation dashboard overview statistics' })
  async getDashboardStats(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'DEFAULT';

    const [
      activeAgents,
      totalExecutions,
      successExecutions,
      failedExecutions,
      pendingApprovals,
      recentExecutions,
    ] = await Promise.all([
      this.prisma.agent.count({ where: { status: 'ACTIVE' } }),
      this.prisma.agentExecution.count({ where: { tenantId } }),
      this.prisma.agentExecution.count({ where: { status: 'SUCCESS', tenantId } }),
      this.prisma.agentExecution.count({ where: { status: 'FAILED', tenantId } }),
      this.prisma.agentApproval.count({ where: { status: 'PENDING', tenantId } }),
      this.prisma.agentExecution.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { startTime: 'desc' },
        include: { agent: true, actions: true },
      }),
    ]);

    return {
      activeAgents,
      totalExecutions,
      successExecutions,
      failedExecutions,
      pendingApprovals,
      recentExecutions,
      killSwitchActive: this.executionService.isKillSwitchActive(),
    };
  }

  @Get('pending-approvals')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get pending approvals for role' })
  @ApiQuery({ name: 'role', required: false, description: 'Role to check pending approvals for' })
  async getPendingApprovals(@Request() req: any, @Query('role') role?: string) {
    const userRole = role || req.user?.role;
    return this.approvalEngine.getPendingApprovals(userRole, req.user?.tenantId || 'DEFAULT');
  }

  @Post('resolve-approval')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resolve an approval ticket' })
  async resolveApproval(@Request() req: any, @Body() body: ResolveApprovalDto) {
    return this.approvalEngine.resolveApprovalTicket({
      approvalId: body.approvalId,
      actionTakenBy: req.user?.id || 'admin-user',
      actionTakenRole: req.user?.role || 'SUPER_ADMIN',
      decision: body.decision,
      reason: body.reason,
    });
  }

  @Post('trigger-event')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trigger an automation event manually' })
  async triggerEvent(@Request() req: any, @Body() dto: PublishEventDto) {
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.orchestrator.dispatchEvent({
      ...dto,
      tenantId,
    });
  }
}
