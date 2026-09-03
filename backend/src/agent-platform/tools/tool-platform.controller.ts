import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ToolRegistryService } from './tool-registry.service';
import { ToolExecutionService } from './tool-execution.service';
import { ToolKey } from './tool.types';

@ApiTags('Agents - Tool Registry')
@ApiBearerAuth()
@Controller('api/v1/agent/tools')
export class ToolPlatformController {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly executionService: ToolExecutionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List available agent tools' })
  @ApiQuery({ name: 'category', required: false, description: 'Tool category filter' })
  @ApiResponse({ status: 200, description: 'Tools retrieved successfully' })
  async listTools(@Request() req: any, @Query('category') category?: string) {
    this.assertAdminRole(req.user?.role);
    return this.registry.listTools(category);
  }

  @Get(':toolKey')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get tool definition and parameter schema' })
  @ApiParam({ name: 'toolKey', description: 'Tool key identifier' })
  async getToolDetails(@Request() req: any, @Param('toolKey') toolKey: ToolKey) {
    this.assertAdminRole(req.user?.role);
    const tool = this.registry.getTool(toolKey);
    if (!tool) throw new NotFoundException(`Tool '${toolKey}' not found.`);
    return tool;
  }

  @Post(':toolKey/dry-run')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Simulate tool execution (dry-run without mutations)' })
  @ApiParam({ name: 'toolKey', description: 'Tool key identifier' })
  async dryRunTool(@Request() req: any, @Param('toolKey') toolKey: ToolKey, @Body() body: any) {
    this.assertAdminRole(req.user?.role);
    return this.executionService.execute(toolKey, body.input || body, {
      tenantId: req.user?.tenantId || 'DEFAULT',
      institutionId: req.user?.tenantId || 'DEFAULT',
      actorUserId: req.user?.id || 'admin-user',
      actorRole: req.user?.role || 'SUPER_ADMIN',
      agentKey: body.agentKey || 'TIMETABLE_SUBSTITUTION_AGENT',
      dryRun: true,
    });
  }

  @Post(':toolKey/execute')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Execute tool safely with policies and idempotency' })
  @ApiParam({ name: 'toolKey', description: 'Tool key identifier' })
  async executeTool(@Request() req: any, @Param('toolKey') toolKey: ToolKey, @Body() body: any) {
    this.assertAdminRole(req.user?.role);
    return this.executionService.execute(toolKey, body.input || body, {
      tenantId: req.user?.tenantId || 'DEFAULT',
      institutionId: req.user?.tenantId || 'DEFAULT',
      actorUserId: req.user?.id || 'admin-user',
      actorRole: req.user?.role || 'SUPER_ADMIN',
      agentKey: body.agentKey || 'TIMETABLE_SUBSTITUTION_AGENT',
      idempotencyKey: body.idempotencyKey,
      approvalToken: body.approvalToken,
      dryRun: false,
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
      throw new ForbiddenException('Access denied: Agent tool administration requires administrative privileges.');
    }
  }
}
