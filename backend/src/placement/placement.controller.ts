import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlacementService } from './placement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Training & Placement Cell')
@ApiBearerAuth()
@Controller('api/v1/placement')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Post('companies')
  @RequirePermission('PLACEMENT', 'CREATE')
  @ApiOperation({ summary: 'Add Recruiting Company' })
  createCompany(
    @Body('code') code: string,
    @Body('name') name: string,
    @Body('industry') industry: string,
    @Body('contactPerson') contactPerson?: string,
    @Body('email') email?: string,
    @Body('phone') phone?: string,
    @Body('website') website?: string,
  ) {
    return this.placementService.createCompany(code, name, industry, contactPerson, email, phone, website);
  }

  @Get('companies')
  @ApiOperation({ summary: 'List Recruiting Companies' })
  getCompanies() {
    return this.placementService.getCompanies();
  }

  @Post('drives')
  @RequirePermission('PLACEMENT', 'CREATE')
  @ApiOperation({ summary: 'Create Placement Drive' })
  createDrive(@Body() body: any) {
    return this.placementService.createDrive(body);
  }

  @Get('drives')
  @ApiOperation({ summary: 'List Placement Drives' })
  @ApiQuery({ name: 'status', required: false })
  getDrives(@Query('status') status?: string) {
    return this.placementService.getDrives(status);
  }

  @Post('drives/:id/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student applies to a Placement Drive' })
  applyToDrive(@Param('id') id: string, @Req() req: any) {
    return this.placementService.applyToDrive(id, req.user.id);
  }

  @Get('applications/my')
  @ApiOperation({ summary: 'Get my placement applications (student)' })
  getMyApplications(@Req() req: any) {
    return this.placementService.getMyApplications(req.user.id);
  }

  @Post('offers')
  @RequirePermission('PLACEMENT', 'APPROVE')
  @ApiOperation({ summary: 'Issue Placement Offer' })
  createOffer(
    @Body('driveId') driveId: string,
    @Body('studentId') studentId: string,
    @Body('packageLpa') packageLpa: number,
    @Body('joiningDate') joiningDate?: string,
  ) {
    return this.placementService.createOffer(driveId, studentId, packageLpa, joiningDate);
  }

  @Post('training-programs')
  @RequirePermission('PLACEMENT', 'CREATE')
  @ApiOperation({ summary: 'Create Training Program' })
  createTraining(
    @Body('code') code: string,
    @Body('title') title: string,
    @Body('trainer') trainer: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('description') description?: string,
  ) {
    return this.placementService.createTraining(code, title, trainer, startDate, endDate, description);
  }

  @Get('training-programs')
  @ApiOperation({ summary: 'List Training Programs' })
  getTrainings() {
    return this.placementService.getTrainings();
  }
}
