import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CampusServicesService } from './campus-services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('Campus Operations & Maintenance')
@ApiBearerAuth()
@Controller('api/v1/campus/requests')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CampusServicesController {
  constructor(private readonly campusService: CampusServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Campus Service Request (Electrical, Plumbing, Cleaning, Maintenance)' })
  createRequest(
    @Req() req: any,
    @Body('serviceType') serviceType: string,
    @Body('location') location: string,
    @Body('description') description: string,
    @Body('priority') priority?: string,
  ) {
    return this.campusService.createRequest(req.user.id, serviceType, location, description, priority);
  }

  @Get()
  @ApiOperation({ summary: 'List Campus Service Requests' })
  @ApiQuery({ name: 'serviceType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my', required: false })
  getRequests(
    @Req() req: any,
    @Query('serviceType') serviceType?: string,
    @Query('status') status?: string,
    @Query('my') my?: string,
  ) {
    return this.campusService.getRequests(serviceType, status, my === 'true' ? req.user.id : undefined);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update Campus Service Request status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('assignedTo') assignedTo?: string,
  ) {
    return this.campusService.updateStatus(id, status, assignedTo);
  }
}
