import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InnovationService } from './innovation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Innovation Management')
@ApiBearerAuth()
@Controller('api/v1/innovation')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InnovationController {
  constructor(private readonly innovationService: InnovationService) {}

  @Post('ideas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Innovation Idea' })
  submitIdea(
    @Req() req: any,
    @Body('category') category: string,
    @Body('problemStatement') problemStatement: string,
    @Body('solution') solution: string,
  ) {
    return this.innovationService.submitIdea(req.user.id, category, problemStatement, solution);
  }

  @Get('ideas')
  @ApiOperation({ summary: 'List Innovation Ideas' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my', required: false })
  getIdeas(@Req() req: any, @Query('status') status?: string, @Query('my') my?: string) {
    return this.innovationService.getIdeas(status, my === 'true' ? req.user.id : undefined);
  }

  @Patch('ideas/:id/evaluate')
  @RequirePermission('INNOVATION', 'APPROVE')
  @ApiOperation({ summary: 'Evaluate Innovation Idea (SHORTLISTED, MENTORING, PROTOTYPE, PILOT, REJECTED)' })
  evaluateIdea(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('evaluationNotes') evaluationNotes?: string,
  ) {
    return this.innovationService.evaluateIdea(id, status, evaluationNotes);
  }
}
