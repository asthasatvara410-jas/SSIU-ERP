import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('University Governance & Compliance')
@ApiBearerAuth()
@Controller('api/v1')
@UseGuards(JwtAuthGuard, RbacGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  // ── Committees & Meetings ──────────────────────────────────────────────────
  @Post('committees')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Create University Committee' })
  createCommittee(
    @Body('code') code: string,
    @Body('name') name: string,
    @Body('committeeType') committeeType: string,
    @Body('chairperson') chairperson?: string,
    @Body('secretary') secretary?: string,
  ) {
    return this.governanceService.createCommittee(code, name, committeeType, chairperson, secretary);
  }

  @Get('committees')
  @ApiOperation({ summary: 'List University Committees' })
  getCommittees() {
    return this.governanceService.getCommittees();
  }

  @Post('committees/:id/members')
  @RequirePermission('GOVERNANCE', 'EDIT')
  @ApiOperation({ summary: 'Add member to Committee' })
  addCommitteeMember(
    @Param('id') id: string,
    @Body('memberName') memberName: string,
    @Body('role') role?: string,
    @Body('userId') userId?: string,
  ) {
    return this.governanceService.addCommitteeMember(id, memberName, role, userId);
  }

  @Post('meetings')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Schedule Committee Meeting' })
  createCommitteeMeeting(
    @Body('committeeId') committeeId: string,
    @Body('meetingDate') meetingDate: string,
    @Body('agenda') agenda: string,
    @Body('venue') venue?: string,
    @Body('minutes') minutes?: string,
  ) {
    return this.governanceService.createCommitteeMeeting(committeeId, meetingDate, agenda, venue, minutes);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'List Committee Meetings' })
  @ApiQuery({ name: 'committeeId', required: false })
  getCommitteeMeetings(@Query('committeeId') committeeId?: string) {
    return this.governanceService.getCommitteeMeetings(committeeId);
  }

  // ── Policies & Circulars ────────────────────────────────────────────────────
  @Post('policies')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Publish University Policy' })
  createPolicy(
    @Body('title') title: string,
    @Body('category') category: string,
    @Body('effectiveDate') effectiveDate: string,
    @Body('version') version?: string,
    @Body('documentUrl') documentUrl?: string,
  ) {
    return this.governanceService.createPolicy(title, category, effectiveDate, version, documentUrl);
  }

  @Get('policies')
  @ApiOperation({ summary: 'List Policies' })
  @ApiQuery({ name: 'category', required: false })
  getPolicies(@Query('category') category?: string) {
    return this.governanceService.getPolicies(category);
  }

  @Post('circulars')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Issue Circular / Notice' })
  createCircular(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('audience') audience?: string,
    @Body('documentUrl') documentUrl?: string,
  ) {
    return this.governanceService.createCircular(title, content, audience, documentUrl);
  }

  @Get('circulars')
  @ApiOperation({ summary: 'List Circulars' })
  @ApiQuery({ name: 'audience', required: false })
  getCirculars(@Query('audience') audience?: string) {
    return this.governanceService.getCirculars(audience);
  }

  // ── RTI Requests ────────────────────────────────────────────────────────────
  @Post('rti')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Register RTI Request' })
  createRTI(
    @Body('applicantName') applicantName: string,
    @Body('subject') subject: string,
    @Body('responsibleOfficer') responsibleOfficer: string,
    @Body('dueDate') dueDate: string,
  ) {
    return this.governanceService.createRTI(applicantName, subject, responsibleOfficer, dueDate);
  }

  @Get('rti')
  @RequirePermission('GOVERNANCE', 'VIEW')
  @ApiOperation({ summary: 'List RTI Requests' })
  @ApiQuery({ name: 'status', required: false })
  getRTIs(@Query('status') status?: string) {
    return this.governanceService.getRTIs(status);
  }

  // ── Legal Cases ─────────────────────────────────────────────────────────────
  @Post('legal')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Record Legal Case' })
  createLegalCase(
    @Body('courtName') courtName: string,
    @Body('caseType') caseType: string,
    @Body('petitioner') petitioner: string,
    @Body('respondent') respondent: string,
    @Body('responsibleOfficer') responsibleOfficer: string,
    @Body('hearingDate') hearingDate?: string,
  ) {
    return this.governanceService.createLegalCase(courtName, caseType, petitioner, respondent, responsibleOfficer, hearingDate);
  }

  @Get('legal')
  @RequirePermission('GOVERNANCE', 'VIEW')
  @ApiOperation({ summary: 'List Legal Cases' })
  @ApiQuery({ name: 'status', required: false })
  getLegalCases(@Query('status') status?: string) {
    return this.governanceService.getLegalCases(status);
  }

  // ── Grievances ──────────────────────────────────────────────────────────────
  @Post('grievances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Grievance / Complaint' })
  submitGrievance(
    @Req() req: any,
    @Body('category') category: string,
    @Body('subject') subject: string,
    @Body('description') description: string,
    @Body('assignedOffice') assignedOffice: string,
    @Body('priority') priority?: string,
  ) {
    return this.governanceService.submitGrievance(category, subject, description, assignedOffice, priority, req.user.id);
  }

  @Get('grievances')
  @ApiOperation({ summary: 'List Grievances' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my', required: false })
  getGrievances(@Req() req: any, @Query('status') status?: string, @Query('my') my?: string) {
    return this.governanceService.getGrievances(status, my === 'true' ? req.user.id : undefined);
  }

  // ── File Tracking ───────────────────────────────────────────────────────────
  @Post('file-tracking')
  @RequirePermission('GOVERNANCE', 'CREATE')
  @ApiOperation({ summary: 'Create Official File record' })
  createFile(
    @Body('subject') subject: string,
    @Body('originOffice') originOffice: string,
    @Body('currentOffice') currentOffice: string,
    @Body('currentHolder') currentHolder: string,
  ) {
    return this.governanceService.createFile(subject, originOffice, currentOffice, currentHolder);
  }

  @Get('file-tracking')
  @RequirePermission('GOVERNANCE', 'VIEW')
  @ApiOperation({ summary: 'List Official Files' })
  @ApiQuery({ name: 'status', required: false })
  getFiles(@Query('status') status?: string) {
    return this.governanceService.getFiles(status);
  }

  @Patch('file-tracking/:id/forward')
  @RequirePermission('GOVERNANCE', 'EDIT')
  @ApiOperation({ summary: 'Forward Official File to another office/holder' })
  forwardFile(
    @Param('id') id: string,
    @Body('newOffice') newOffice: string,
    @Body('newHolder') newHolder: string,
  ) {
    return this.governanceService.forwardFile(id, newOffice, newHolder);
  }
}
