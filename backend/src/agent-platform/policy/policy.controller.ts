import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PolicyEngineService } from './policy-engine.service';
import { CreatePolicyDto, PolicyEvaluationContext } from './policy.types';

@ApiTags('Agents - Policy Engine')
@ApiBearerAuth()
@Controller('api/v1/policies')
export class PolicyController {
  constructor(private readonly policyEngine: PolicyEngineService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all agent execution governance policies' })
  @ApiResponse({ status: 200, description: 'Policies retrieved successfully' })
  async listPolicies(@Request() req: any) {
    this.assertAdminRole(req.user?.role);
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.policyEngine.listPolicies(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get policy details by ID' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  async getPolicy(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const policy = this.policyEngine.getPolicy(id);
    if (!policy) throw new NotFoundException(`Policy '${id}' not found.`);
    return policy;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new policy' })
  async createPolicy(@Request() req: any, @Body() dto: CreatePolicyDto) {
    this.assertAdminRole(req.user?.role);
    return this.policyEngine.createPolicy({
      ...dto,
      tenantId: dto.tenantId || req.user?.tenantId || 'DEFAULT',
    });
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  async enablePolicy(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const success = this.policyEngine.enablePolicy(id);
    if (!success) throw new NotFoundException(`Policy '${id}' not found.`);
    return { success: true, policyId: id, status: 'ENABLED' };
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  async disablePolicy(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const success = this.policyEngine.disablePolicy(id);
    if (!success) throw new NotFoundException(`Policy '${id}' not found.`);
    return { success: true, policyId: id, status: 'DISABLED' };
  }

  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Evaluate policy rules against a target action context' })
  async evaluatePolicy(@Request() req: any, @Body() context: PolicyEvaluationContext) {
    this.assertAdminRole(req.user?.role);
    return this.policyEngine.evaluate({
      ...context,
      tenantId: context.tenantId || req.user?.tenantId || 'DEFAULT',
      institutionId: context.institutionId || req.user?.tenantId || 'DEFAULT',
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
      throw new ForbiddenException('Access denied: Policy management requires administrative privileges.');
    }
  }
}
