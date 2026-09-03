import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IqacService } from './iqac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('IQAC Quality Assurance')
@ApiBearerAuth()
@Controller('api/v1/iqac')
@UseGuards(JwtAuthGuard, RbacGuard)
export class IqacController {
  constructor(private readonly iqacService: IqacService) {}

  @Post('activities')
  @RequirePermission('IQAC', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Plan IQAC Activity' })
  createActivity(@Body() body: any) {
    return this.iqacService.createActivity(body);
  }

  @Get('activities')
  @ApiOperation({ summary: 'List IQAC Activities' })
  @ApiQuery({ name: 'academicYear', required: false })
  @ApiQuery({ name: 'category', required: false })
  getActivities(@Query('academicYear') academicYear?: string, @Query('category') category?: string) {
    return this.iqacService.getActivities(academicYear, category);
  }

  @Post('meetings')
  @RequirePermission('IQAC', 'CREATE')
  @ApiOperation({ summary: 'Schedule IQAC Meeting' })
  createMeeting(@Body() body: any) {
    return this.iqacService.createMeeting(body);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'List IQAC Meetings' })
  @ApiQuery({ name: 'activityId', required: false })
  getMeetings(@Query('activityId') activityId?: string) {
    return this.iqacService.getMeetings(activityId);
  }

  @Post('action-items')
  @RequirePermission('IQAC', 'CREATE')
  @ApiOperation({ summary: 'Add IQAC Action Item' })
  addActionItem(
    @Body('meetingId') meetingId: string,
    @Body('title') title: string,
    @Body('assignedTo') assignedTo: string,
    @Body('dueDate') dueDate: string,
  ) {
    return this.iqacService.addActionItem(meetingId, title, assignedTo, dueDate);
  }

  @Get('action-items')
  @ApiOperation({ summary: 'List IQAC Action Items' })
  @ApiQuery({ name: 'meetingId', required: false })
  getActionItems(@Query('meetingId') meetingId?: string) {
    return this.iqacService.getActionItems(meetingId);
  }
}
