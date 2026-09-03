import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IncubationService } from './incubation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Incubation & Startups')
@ApiBearerAuth()
@Controller('api/v1/incubation')
@UseGuards(JwtAuthGuard, RbacGuard)
export class IncubationController {
  constructor(private readonly incubationService: IncubationService) {}

  @Post('centers')
  @RequirePermission('INCUBATION', 'CREATE')
  @ApiOperation({ summary: 'Create Incubation Center' })
  createCenter(
    @Body('code') code: string,
    @Body('name') name: string,
    @Body('location') location?: string,
    @Body('capacity') capacity?: number,
  ) {
    return this.incubationService.createCenter(code, name, location, capacity);
  }

  @Get('centers')
  @ApiOperation({ summary: 'List Incubation Centers' })
  getCenters() {
    return this.incubationService.getCenters();
  }

  @Post('startups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new Startup' })
  registerStartup(@Body() body: any, @Req() req: any) {
    return this.incubationService.registerStartup({ ...body, studentUserId: req.user.id });
  }

  @Get('startups')
  @ApiOperation({ summary: 'List Startups / My Startups' })
  @ApiQuery({ name: 'stage', required: false })
  @ApiQuery({ name: 'my', required: false })
  getStartups(@Req() req: any, @Query('stage') stage?: string, @Query('my') my?: string) {
    return this.incubationService.getStartups(stage, my === 'true' ? req.user.id : undefined);
  }

  @Post('startups/:id/milestones')
  @ApiOperation({ summary: 'Add Milestone for Startup' })
  addMilestone(@Param('id') id: string, @Body('title') title: string, @Body('dueDate') dueDate: string) {
    return this.incubationService.addMilestone(id, title, dueDate);
  }

  @Post('startups/:id/mentors')
  @RequirePermission('INCUBATION', 'EDIT')
  @ApiOperation({ summary: 'Assign Faculty Mentor to Startup' })
  assignMentor(@Param('id') id: string, @Body('facultyId') facultyId: string) {
    return this.incubationService.assignMentor(id, facultyId);
  }
}
