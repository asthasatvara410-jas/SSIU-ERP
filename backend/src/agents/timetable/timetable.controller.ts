import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  UseGuards, 
  Request, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TimetableAgentService } from './timetable.service';
import { FacultyAbsenceEventDto } from './events/faculty-absence.event';

@ApiTags('Agents - Timetable Substitution Agent')
@ApiBearerAuth()
@Controller('api/v1/agents/timetable')
export class TimetableAgentController {
  constructor(private readonly timetableService: TimetableAgentService) {}

  /**
   * 1. Report Faculty Absence
   * Identity strictly resolved from JWT (req.user.id).
   */
  @Post('absence')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Report faculty absence and trigger autonomous substitution planner' })
  @ApiResponse({ status: 201, description: 'Absence recorded and substitution candidate ranked' })
  async reportAbsence(@Request() req: any, @Body() dto: FacultyAbsenceEventDto) {
    const facultyId = req.user?.id;
    const role = req.user?.role;

    if (!facultyId) {
      throw new ForbiddenException('Authenticated user identity required.');
    }

    if (role === 'STUDENT') {
      throw new ForbiddenException('Students cannot report faculty absences.');
    }

    if (!dto.absenceDate || !dto.reason) {
      throw new BadRequestException('Absence date (YYYY-MM-DD) and reason are required.');
    }

    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.timetableService.reportAbsenceAndPlanSubstitutions({
      facultyId,
      absenceDate: dto.absenceDate,
      reason: dto.reason,
      tenantId,
    });
  }

  /**
   * 2. List Substitution Proposals
   */
  @Get('substitutions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List timetable substitution proposals' })
  async listSubstitutions(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'DEFAULT';
    return this.timetableService.getSubstitutions(undefined, tenantId);
  }

  /**
   * 3. Get Single Substitution Request Details
   */
  @Get('substitutions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single substitution request details' })
  @ApiParam({ name: 'id', description: 'Substitution ID' })
  async getSubstitution(@Request() req: any, @Param('id') id: string) {
    return this.timetableService.getSubstitutionById(id);
  }

  /**
   * 4. Approve Substitution Proposal
   */
  @Post('substitutions/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve substitution proposal' })
  @ApiParam({ name: 'id', description: 'Substitution ID' })
  async approveSubstitution(@Request() req: any, @Param('id') id: string) {
    return this.timetableService.approveSubstitution({
      id,
      approverUserId: req.user?.id || 'admin-user',
      approverRole: req.user?.role || 'HOD',
      tenantId: req.user?.tenantId || 'DEFAULT',
    });
  }

  /**
   * 5. Reject Substitution Proposal
   */
  @Post('substitutions/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reject substitution proposal' })
  @ApiParam({ name: 'id', description: 'Substitution ID' })
  async rejectSubstitution(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.timetableService.rejectSubstitution({
      id,
      rejectorUserId: req.user?.id || 'admin-user',
      rejectorRole: req.user?.role || 'HOD',
      reason: body?.reason || 'Not approved by department HOD',
      tenantId: req.user?.tenantId || 'DEFAULT',
    });
  }

  /**
   * 6. Execute Substitution Directly (Admin/HOD Shortcut)
   */
  @Post('substitutions/:id/execute')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Execute substitution directly' })
  @ApiParam({ name: 'id', description: 'Substitution ID' })
  async executeSubstitution(@Request() req: any, @Param('id') id: string) {
    return this.timetableService.approveSubstitution({
      id,
      approverUserId: req.user?.id || 'admin-user',
      approverRole: req.user?.role || 'SUPER_ADMIN',
      tenantId: req.user?.tenantId || 'DEFAULT',
    });
  }
}
