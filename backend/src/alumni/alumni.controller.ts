import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlumniService } from './alumni.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Alumni Association')
@ApiBearerAuth()
@Controller('api/v1/alumni')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Post('profiles')
  @RequirePermission('ALUMNI', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register Alumni Profile' })
  createProfile(
    @Body('studentId') studentId: string,
    @Body('graduationYear') graduationYear: number,
    @Body('currentCompany') currentCompany?: string,
    @Body('designation') designation?: string,
    @Body('industry') industry?: string,
    @Body('city') city?: string,
    @Body('linkedinUrl') linkedinUrl?: string,
    @Body('isMentor') isMentor?: boolean,
  ) {
    return this.alumniService.createProfile({
      studentId,
      graduationYear,
      currentCompany,
      designation,
      industry,
      city,
      linkedinUrl,
      isMentor,
    });
  }

  @Get('profiles')
  @ApiOperation({ summary: 'List Alumni Directory' })
  @ApiQuery({ name: 'graduationYear', required: false })
  @ApiQuery({ name: 'industry', required: false })
  @ApiQuery({ name: 'search', required: false })
  getProfiles(
    @Query('graduationYear') graduationYear?: number,
    @Query('industry') industry?: string,
    @Query('search') search?: string,
  ) {
    return this.alumniService.getProfiles(graduationYear ? Number(graduationYear) : undefined, industry, search);
  }
}
