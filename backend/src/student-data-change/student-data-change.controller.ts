import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentDataChangeService } from './student-data-change.service';
import {
  CreateStudentDataChangeDto,
  ReviewStudentDataChangeDto,
  QueryStudentDataChangeDto,
} from './dto/student-data-change.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('Student Data Change Request & Approval Workflow')
@Controller('api/v1/student-data-change')
export class StudentDataChangeController {
  constructor(private readonly dataChangeService: StudentDataChangeService) {}

  @Post('requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a Student Data Change Request' })
  createRequest(@Req() req: any, @Body() dto: CreateStudentDataChangeDto) {
    const studentId = req.user?.studentId || req.user?.id;
    return this.dataChangeService.createRequest(studentId, dto, req.user);
  }

  @Get('requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Scoped Data Change Requests (with filters)' })
  getRequests(@Req() req: any, @Query() query: QueryStudentDataChangeDto) {
    return this.dataChangeService.getScopedRequests(query, req.user);
  }

  @Get('requests/statistics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Data Change Request Dashboard Metrics' })
  getStatistics(@Req() req: any) {
    return this.dataChangeService.getStatistics(req.user);
  }

  @Get('requests/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Get Details and Audit History of a Data Change Request' })
  getRequestById(@Param('id') id: string) {
    return this.dataChangeService.getRequestById(id);
  }

  @Patch('requests/:id/mentor-review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Mentor Review: Approve, Reject, or Send Back' })
  mentorReview(
    @Param('id') id: string,
    @Body() dto: ReviewStudentDataChangeDto,
    @Req() req: any,
  ) {
    return this.dataChangeService.mentorReview(id, dto, req.user);
  }

  @Patch('requests/:id/hod-review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'HOD Final Review: Approve (updates master data), Reject, or Send Back' })
  hodReview(
    @Param('id') id: string,
    @Body() dto: ReviewStudentDataChangeDto,
    @Req() req: any,
  ) {
    return this.dataChangeService.hodReview(id, dto, req.user);
  }

  @Patch('requests/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @ApiOperation({ summary: 'Student Cancel Data Change Request' })
  cancelRequest(@Param('id') id: string, @Req() req: any) {
    return this.dataChangeService.cancelRequest(id, req.user);
  }
}
