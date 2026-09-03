import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StudentCouncilService } from './student-council.service';
import {
  CreateCouncilDto,
  CreateClubDto,
  AssignMemberDto,
  CreateMeetingDto,
  UpdateMeetingStatusDto,
  CreateEventProposalDto,
  ReviewEventProposalDto,
  CouncilQueryDto,
  CouncilCommitteeType,
} from './dto/student-council.dto';

@Controller('api/v1/student-council')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentCouncilController {
  constructor(private readonly councilService: StudentCouncilService) {}

  // 1. Council Directory
  @Post('councils')
  async createCouncil(@Request() req: any, @Body() dto: CreateCouncilDto) {
    const data = await this.councilService.createCouncil(req.user, dto);
    return { message: 'Student council established successfully.', data };
  }

  @Get('councils')
  async listCouncils(@Request() req: any, @Query() query: CouncilQueryDto) {
    query.committeeType = CouncilCommitteeType.STUDENT_COUNCIL;
    return this.councilService.listOrganizations(req.user, query);
  }

  // 2. Clubs & Student Committees
  @Post('clubs')
  async createClub(@Request() req: any, @Body() dto: CreateClubDto) {
    const data = await this.councilService.createClub(req.user, dto);
    return { message: 'Student club / cell registered successfully.', data };
  }

  @Get('clubs')
  async listClubs(@Request() req: any, @Query() query: CouncilQueryDto) {
    return this.councilService.listOrganizations(req.user, query);
  }

  @Get('organizations/:id')
  async getOrganizationDetails(@Request() req: any, @Param('id') id: string) {
    return this.councilService.getOrganizationDetails(req.user, id);
  }

  // 3. Office Bearers & Memberships
  @Post('members')
  async assignMember(@Request() req: any, @Body() dto: AssignMemberDto) {
    const data = await this.councilService.assignMember(req.user, dto);
    return { message: 'Member / Office bearer assigned successfully.', data };
  }

  @Delete('members/:id')
  async removeMember(@Request() req: any, @Param('id') id: string) {
    return this.councilService.removeMember(req.user, id);
  }

  @Get('organizations/:id/members')
  async listMembers(
    @Request() req: any,
    @Param('id') id: string,
    @Query() query: CouncilQueryDto,
  ) {
    return this.councilService.listMembers(req.user, id, query);
  }

  @Get('office-bearers')
  async listOfficeBearers(@Request() req: any, @Query() query: CouncilQueryDto) {
    return this.councilService.listOfficeBearers(req.user, query);
  }

  // 4. Meetings & Minutes of Meeting (MoM)
  @Post('meetings')
  async createMeeting(@Request() req: any, @Body() dto: CreateMeetingDto) {
    const data = await this.councilService.createMeeting(req.user, dto);
    return { message: 'Meeting draft recorded successfully.', data };
  }

  @Patch('meetings/:id/status')
  async updateMeetingStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    const data = await this.councilService.updateMeetingStatus(req.user, id, dto);
    return { message: `Meeting status updated to ${dto.status}.`, data };
  }

  @Get('meetings')
  async listMeetings(
    @Request() req: any,
    @Query('committeeId') committeeId?: string,
    @Query() query?: CouncilQueryDto,
  ) {
    return this.councilService.listMeetings(req.user, committeeId, query);
  }

  // 5. Event Proposals Workflow
  @Post('event-proposals')
  async createEventProposal(@Request() req: any, @Body() dto: CreateEventProposalDto) {
    const data = await this.councilService.createEventProposal(req.user, dto);
    return { message: 'Event proposal submitted for faculty review.', data };
  }

  @Patch('event-proposals/:id/review')
  async reviewEventProposal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewEventProposalDto,
  ) {
    const data = await this.councilService.reviewEventProposal(req.user, id, dto);
    return { message: `Proposal marked as ${dto.status}.`, data };
  }

  @Get('event-proposals')
  async listEventProposals(@Request() req: any, @Query() query?: CouncilQueryDto) {
    return this.councilService.listEventProposals(req.user, query);
  }

  // 6. Council Executive Dashboard
  @Get('dashboard')
  async getDashboardMetrics(@Request() req: any) {
    return this.councilService.getDashboardMetrics(req.user);
  }
}
