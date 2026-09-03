import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Req, 
  Res, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MentorAssignmentService } from './mentor-assignment.service';
import { 
  AssignMentorDto, 
  ChangeMentorDto, 
  RemoveMentorDto, 
  MentorQueryDto, 
  BulkMentorCommitDto 
} from './dto/mentor-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('Student Mentor Assignment & Advisory System')
@ApiBearerAuth()
@Controller('api/v1/mentor-assignment')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MentorAssignmentController {
  constructor(private readonly mentorService: MentorAssignmentService) {}

  @Get('eligible')
  @ApiOperation({ summary: 'Get list of eligible faculty members who can be assigned as Mentors' })
  getEligibleMentors(
    @Query('instituteId') instituteId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('studentId') studentId?: string,
    @Req() req?: any
  ) {
    return this.mentorService.getEligibleMentors({ instituteId, departmentId, studentId }, req.user);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Query mentor assignments respecting HOD / HOI / SuperAdmin RBAC boundaries' })
  getAssignments(@Query() query: MentorQueryDto, @Req() req: any) {
    return this.mentorService.getAssignments(query, req.user);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get active mentor assignment for a specific student' })
  getActiveMentorForStudent(@Param('studentId') studentId: string) {
    return this.mentorService.getActiveMentorForStudent(studentId);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign or Change Mentor for a student (HOD / HOI / SuperAdmin)' })
  assignMentor(@Body() dto: AssignMentorDto, @Req() req: any) {
    return this.mentorService.assignMentor(dto, req.user);
  }

  @Post('change/:studentId')
  @ApiOperation({ summary: 'Explicitly Change Mentor for a student with mandatory reason' })
  changeMentor(@Param('studentId') studentId: string, @Body() dto: ChangeMentorDto, @Req() req: any) {
    return this.mentorService.changeMentor(studentId, dto, req.user);
  }

  @Post('remove/:assignmentId')
  @ApiOperation({ summary: 'Remove active mentor assignment' })
  removeMentor(@Param('assignmentId') assignmentId: string, @Body() dto: RemoveMentorDto, @Req() req: any) {
    return this.mentorService.removeMentor(assignmentId, dto, req.user);
  }

  @Get('history/:studentId')
  @ApiOperation({ summary: 'Get complete chronological mentor assignment history for a student' })
  getAssignmentHistory(@Param('studentId') studentId: string, @Req() req: any) {
    return this.mentorService.getAssignmentHistory(studentId, req.user);
  }

  @Get('template')
  @ApiOperation({ summary: 'Download official Excel (.xlsx) bulk mentor assignment template' })
  downloadTemplate(@Res() res: Response) {
    const buffer = this.mentorService.generateTemplateXlsx();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SSIU_Mentor_Assignment_Template.xlsx"');
    res.send(buffer);
  }

  @Post('bulk-upload')
  @ApiOperation({ summary: 'Upload, parse and validate bulk mentor assignments Excel (.xlsx) file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(@UploadedFile() file: any, @Req() req: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please upload a valid Excel (.xlsx) file.');
    }
    return this.mentorService.parseAndValidateBulkXlsx(file.buffer, req.user);
  }

  @Post('bulk-commit')
  @ApiOperation({ summary: 'Commit verified bulk mentor assignment rows to database' })
  bulkCommit(@Body() dto: BulkMentorCommitDto, @Req() req: any) {
    return this.mentorService.commitBulkUpload(dto, req.user);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get Mentor Dashboard KPIs, assigned mentees, queries and complaint counts' })
  getDashboardStats(@Req() req: any) {
    return this.mentorService.getMentorDashboardStats(req.user);
  }
}
