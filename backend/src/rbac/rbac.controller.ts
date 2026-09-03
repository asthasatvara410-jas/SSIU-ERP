import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CheckPermissionDto } from './dto/check-permission.dto';
import { SetUserOverrideDto } from './dto/set-user-override.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from './rbac.guard';
import { RequirePermission } from './require-permission.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePermission('RBAC', 'VIEW')
  async getAllRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  @RequirePermission('RBAC', 'APPROVE')
  async createRole(@Body() dto: CreateRoleDto, @Req() req: any) {
    return this.rbacService.createRole(dto, req.user.id);
  }

  @Patch('roles/:id')
  @RequirePermission('RBAC', 'APPROVE')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: any) {
    return this.rbacService.updateRole(id, dto, req.user.id);
  }

  @Get('permissions')
  @RequirePermission('RBAC', 'VIEW')
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Post('roles/:id/permissions')
  @RequirePermission('RBAC', 'ASSIGN')
  async assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto, @Req() req: any) {
    return this.rbacService.assignPermissionsToRole(id, dto.permissionIds, req.user.id);
  }

  @Get('users/:id/roles')
  @RequirePermission('RBAC', 'VIEW')
  async getUserRoles(@Param('id') id: string) {
    return this.rbacService.getUserEffectivePermissions(id);
  }

  @Post('users/:id/roles')
  @RequirePermission('RBAC', 'ASSIGN')
  async assignUserRole(@Param('id') id: string, @Body() dto: AssignUserRoleDto, @Req() req: any) {
    return this.rbacService.assignRoleToUser({ ...dto, userId: id }, req.user.id);
  }

  @Delete('users/:id/roles/:roleId')
  @RequirePermission('RBAC', 'ASSIGN')
  async revokeUserRole(@Param('id') id: string, @Param('roleId') roleId: string, @Req() req: any) {
    return this.rbacService.revokeRoleFromUser(id, roleId, req.user.id);
  }

  @Get('users/:id/permissions')
  @RequirePermission('RBAC', 'VIEW')
  async getUserPermissions(@Param('id') id: string) {
    return this.rbacService.getUserEffectivePermissions(id);
  }

  // ── User-Specific Overrides ──
  @Get('users/:id/overrides')
  @RequirePermission('RBAC', 'VIEW')
  async getUserOverrides(@Param('id') id: string) {
    return this.rbacService.getUserPermissionOverrides(id);
  }

  @Post('users/:id/overrides')
  @RequirePermission('RBAC', 'ASSIGN')
  async setUserOverride(@Param('id') id: string, @Body() dto: SetUserOverrideDto, @Req() req: any) {
    return this.rbacService.setUserPermissionOverride(id, dto.module, dto.action, dto.granted, req.user.id);
  }

  @Delete('users/:id/overrides/:module/:action')
  @RequirePermission('RBAC', 'ASSIGN')
  async removeUserOverride(
    @Param('id') id: string,
    @Param('module') module: string,
    @Param('action') action: string,
    @Req() req: any,
  ) {
    return this.rbacService.removeUserPermissionOverride(id, module, action, req.user.id);
  }

  @Post('rbac/check-permission')
  @HttpCode(HttpStatus.OK)
  async checkPermission(@Body() dto: CheckPermissionDto, @Req() req: any) {
    return this.rbacService.checkPermission(req.user.id, dto.module, dto.action, dto.resourceMeta);
  }
}
