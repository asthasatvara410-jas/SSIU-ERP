import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TriggerRegistryService } from './trigger-registry.service';
import { RegisterTriggerDto } from './trigger.types';

@ApiTags('Agents - Triggers')
@ApiBearerAuth()
@Controller('api/v1/triggers')
export class TriggerController {
  constructor(private readonly triggerRegistry: TriggerRegistryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all automation triggers' })
  @ApiResponse({ status: 200, description: 'Triggers listed successfully' })
  async listTriggers(@Request() req: any) {
    this.assertAdminRole(req.user?.role);
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.triggerRegistry.listTriggers(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register a new event trigger' })
  async registerTrigger(@Request() req: any, @Body() dto: RegisterTriggerDto) {
    this.assertAdminRole(req.user?.role);
    return this.triggerRegistry.registerTrigger({
      ...dto,
      tenantScope: dto.tenantScope || req.user?.tenantId || 'DEFAULT',
    });
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable trigger' })
  @ApiParam({ name: 'id', description: 'Trigger ID' })
  async enableTrigger(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const success = this.triggerRegistry.enableTrigger(id);
    if (!success) throw new NotFoundException(`Trigger '${id}' not found.`);
    return { success: true, triggerId: id, status: 'ENABLED' };
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable trigger' })
  @ApiParam({ name: 'id', description: 'Trigger ID' })
  async disableTrigger(@Request() req: any, @Param('id') id: string) {
    this.assertAdminRole(req.user?.role);
    const success = this.triggerRegistry.disableTrigger(id);
    if (!success) throw new NotFoundException(`Trigger '${id}' not found.`);
    return { success: true, triggerId: id, status: 'DISABLED' };
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
      throw new ForbiddenException('Access denied: Trigger administration requires administrative privileges.');
    }
  }
}
