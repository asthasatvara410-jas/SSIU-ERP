import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('University Communication & Official Correspondence')
@ApiBearerAuth()
@Controller('api/v1/communications')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CommunicationController {
  constructor(private readonly commService: CommunicationService) {}

  private checkNonStudent(req: any) {
    const roles: string[] = req.user?.roles || [];
    if (roles.length === 1 && roles[0].toUpperCase() === 'STUDENT') {
      throw new ForbiddenException('Communication Center is available to University Staff & Authorized Authorities only.');
    }
  }

  @Get('types')
  @ApiOperation({ summary: 'Get Configurable Letter / Document Types' })
  getCommunicationTypes() {
    return this.commService.getCommunicationTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'Create new Letter / Document Type' })
  createCommunicationType(@Body() body: any) {
    return this.commService.createCommunicationType(body);
  }

  @Post('inward')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register Inward Communication' })
  registerInwardCommunication(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.commService.registerInwardCommunication(req.user.id, body);
  }

  @Post('outward')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Outward Official Letter' })
  createOutwardCommunication(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.commService.createOutwardCommunication(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get Communications by folder (Inbox, Outbox, Drafts, Pending, Archive)' })
  @ApiQuery({ name: 'folder', required: false })
  @ApiQuery({ name: 'search', required: false })
  getCommunications(@Req() req: any, @Query('folder') folder?: string, @Query('search') search?: string) {
    this.checkNonStudent(req);
    return this.commService.getCommunications(req.user.id, folder, search);
  }

  @Get('dispatch')
  @ApiOperation({ summary: 'Get Dispatch Tracking Records' })
  getDispatchRecords() {
    return this.commService.getDispatchRecords();
  }

  @Post('dispatch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Courier/Post Dispatch Record' })
  createDispatchRecord(@Req() req: any, @Body() body: any) {
    this.checkNonStudent(req);
    return this.commService.createDispatchRecord(req.user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Communication Details by ID' })
  getCommunicationById(@Param('id') id: string) {
    return this.commService.getCommunicationById(id);
  }

  @Post(':id/forward')
  @ApiOperation({ summary: 'Forward Communication to another department/officer' })
  forwardCommunication(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkNonStudent(req);
    return this.commService.forwardCommunication(req.user.id, id, body.toOffice, body.remarks, body.newAssignedUserId);
  }

  @Post(':id/create-task')
  @ApiOperation({ summary: 'Create Work Task from Received Communication' })
  createTaskFromCommunication(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkNonStudent(req);
    return this.commService.createTaskFromCommunication(req.user.id, id, body.title, body.dueDate, body.assignedToUserId);
  }

  @Post(':id/schedule-meeting')
  @ApiOperation({ summary: 'Schedule Meeting from Communication' })
  scheduleMeetingFromCommunication(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkNonStudent(req);
    return this.commService.scheduleMeetingFromCommunication(req.user.id, id, body);
  }
}
