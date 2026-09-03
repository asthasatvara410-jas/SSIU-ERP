import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Audit & System Security')
@ApiBearerAuth()
@Controller('api/v1/audit')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission('AUDIT', 'VIEW')
  @ApiOperation({ summary: 'Get System Audit Logs (Admins & Auditors only)' })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'action', required: false })
  getAuditLogs(@Query('module') module?: string, @Query('action') action?: string) {
    return this.auditService.getAuditLogs(module, action);
  }

  @Get(':id')
  @RequirePermission('AUDIT', 'VIEW')
  @ApiOperation({ summary: 'Get Audit Log by ID' })
  getAuditLogById(@Param('id') id: string) {
    return this.auditService.getAuditLogById(id);
  }
}
