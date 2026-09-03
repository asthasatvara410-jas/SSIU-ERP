import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrganogramService } from './organogram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Organogram & University Authority Engine')
@ApiBearerAuth()
@Controller('api/v1/organogram')
@UseGuards(JwtAuthGuard, RbacGuard)
export class OrganogramController {
  constructor(private readonly organogramService: OrganogramService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get Swarrnim University Organizational Organogram Tree' })
  getOrganizationTree() {
    return this.organogramService.getOrganizationTree();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get All Registered Roles with Authority Levels' })
  getRoles() {
    return this.organogramService.getRoles();
  }

  @Post('user-assignment')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign User Role, Reporting Line & Scope with Audit Logging' })
  assignUserReporting(@Body() body: any, @Req() req: any) {
    return this.organogramService.assignUserReporting({
      ...body,
      assignedByUserId: req.user.id,
    });
  }

  @Get('user-assignment/:userId')
  @RequirePermission('GOVERNANCE', 'VIEW')
  @ApiOperation({ summary: 'Get User Reporting details and Role Change History' })
  getUserReporting(@Param('userId') userId: string) {
    return this.organogramService.getUserReporting(userId);
  }

  @Post('authority-matrix')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Configure Module Authority Matrix' })
  configureModuleAuthority(@Body() body: any) {
    return this.organogramService.configureModuleAuthority(body);
  }

  @Get('authority-matrix')
  @ApiOperation({ summary: 'Get Module Authority Matrix' })
  @ApiQuery({ name: 'module', required: false })
  getModuleAuthorityMatrix(@Query('module') module?: string) {
    return this.organogramService.getModuleAuthorityMatrix(module);
  }
}
