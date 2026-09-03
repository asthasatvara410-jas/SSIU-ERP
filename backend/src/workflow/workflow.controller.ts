import { Controller, Get, Post, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDefinitionDto } from './dto/create-workflow-definition.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Central Workflow & Approval Engine')
@ApiBearerAuth()
@Controller('api/v1/workflows')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // 1. Workflow Definitions
  @ApiOperation({ summary: 'Create new Workflow Definition' })
  @Post()
  @RequirePermission('RBAC', 'APPROVE')
  async createDefinition(@Body() dto: CreateWorkflowDefinitionDto, @Req() req: any) {
    return this.workflowService.createDefinition(dto, req.user.id);
  }

  @ApiOperation({ summary: 'List all Workflow Definitions' })
  @Get()
  async getDefinitions() {
    return this.workflowService.getDefinitions();
  }

  @ApiOperation({ summary: 'Get Workflow Definition by Code' })
  @Get(':code')
  async getDefinitionByCode(@Param('code') code: string) {
    return this.workflowService.getDefinitionByCode(code);
  }

  // 2. Workflow Instance Starts & Actions
  @ApiOperation({ summary: 'Start a new Workflow Instance for an entity' })
  @Post('instances/start')
  @HttpCode(HttpStatus.CREATED)
  async startInstance(@Body() dto: StartWorkflowDto, @Req() req: any) {
    return this.workflowService.startInstance(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Execute Workflow Action (SUBMIT, VERIFY, FORWARD, RECOMMEND, APPROVE, REJECT, RETURN)' })
  @Post('instances/:id/action')
  @HttpCode(HttpStatus.OK)
  async executeAction(@Param('id') id: string, @Body() dto: WorkflowActionDto, @Req() req: any) {
    return this.workflowService.executeAction(id, dto, req.user.id);
  }

  // Action Shortcuts
  @Post('instances/:id/submit')
  @HttpCode(HttpStatus.OK)
  async submitAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'SUBMIT', ...body }, req.user.id);
  }

  @Post('instances/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'VERIFY', ...body }, req.user.id);
  }

  @Post('instances/:id/forward')
  @HttpCode(HttpStatus.OK)
  async forwardAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'FORWARD', ...body }, req.user.id);
  }

  @Post('instances/:id/recommend')
  @HttpCode(HttpStatus.OK)
  async recommendAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'RECOMMEND', ...body }, req.user.id);
  }

  @Post('instances/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'APPROVE', ...body }, req.user.id);
  }

  @Post('instances/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'REJECT', ...body }, req.user.id);
  }

  @Post('instances/:id/return')
  @HttpCode(HttpStatus.OK)
  async returnAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'RETURN', ...body }, req.user.id);
  }

  @Post('instances/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeAction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.workflowService.executeAction(id, { action: 'COMPLETE', ...body }, req.user.id);
  }

  // 3. User Approvals & Submissions
  @ApiOperation({ summary: 'Get Pending Approvals requiring current user action' })
  @Get('instances/my-pending')
  async getMyPending(@Req() req: any) {
    return this.workflowService.getPendingForUser(req.user.id);
  }

  @ApiOperation({ summary: 'Get My Submitted Workflow Requests' })
  @Get('instances/my-requests')
  async getMyRequests(@Req() req: any) {
    return this.workflowService.getUserRequests(req.user.id);
  }

  @ApiOperation({ summary: 'Get Workflow Instance Audit History' })
  @Get('instances/:id/history')
  async getInstanceHistory(@Param('id') id: string) {
    return this.workflowService.getInstanceHistory(id);
  }

  // 4. Delegations
  @ApiOperation({ summary: 'Create Authority Delegation' })
  @Post('delegations')
  async createDelegation(@Body() dto: CreateDelegationDto, @Req() req: any) {
    return this.workflowService.createDelegation(req.user.id, dto);
  }

  @ApiOperation({ summary: 'List Active Delegations' })
  @Get('delegations')
  async getDelegations() {
    return this.workflowService.getDelegations();
  }
}
