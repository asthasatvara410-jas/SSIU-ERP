import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { QuestionBankService } from './question-bank.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  ReviewQuestionDto,
  BulkUploadQuestionsDto,
} from './dto/question-bank.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('Smart Examination & Question Bank Engine')
@ApiBearerAuth()
@Controller('question-bank')
@UseGuards(JwtAuthGuard, RbacGuard)
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  /**
   * STAGE 10.3A: Faculty Question Create Endpoint
   * POST /question-bank/questions
   */
  @Post('questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Faculty Question Create API',
    description: 'Allows authorized Faculty to author and add a new question to the Question Bank in DRAFT status with Bloom taxonomy alignment and rubric details.',
  })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully in DRAFT status.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request / Validation failure (missing fields, invalid marks, or invalid MCQ structure).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT authentication token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role or unauthorized subject assignment access.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Duplicate question detected for the subject.',
  })
  createQuestion(@Body() dto: CreateQuestionDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    const facultyAllowedSubjects = req.user?.allowedSubjects || undefined;

    return this.questionBankService.createQuestion(
      dto,
      tenantId,
      userId,
      userRole,
      facultyAllowedSubjects,
    );
  }

  @Get('questions')
  @ApiOperation({ summary: 'List Question Bank questions with RBAC scoping' })
  listQuestions(@Query() query: any, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.listQuestions(query, tenantId, userId, userRole);
  }

  @Get('questions/metrics')
  @ApiOperation({ summary: 'Get Question Bank KPI metrics & analytics' })
  getQuestionMetrics(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.getQuestionBankMetrics(tenantId, userId, userRole);
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get Question Bank question details' })
  getQuestionDetails(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.getQuestionDetails(id, tenantId, userId, userRole);
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Update question in Question Bank (Faculty ownership required)' })
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.updateQuestion(id, dto, tenantId, userId, userRole);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete draft question from Question Bank' })
  deleteQuestion(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.deleteQuestion(id, tenantId, userId, userRole);
  }

  @Post('questions/:id/submit')
  @ApiOperation({ summary: 'Submit question for HOD review' })
  submitQuestionForReview(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.submitQuestionForReview(id, tenantId, userId, userRole);
  }

  @Post('questions/:id/review')
  @ApiOperation({ summary: 'HOD review of question (Approve/Reject)' })
  reviewQuestion(@Param('id') id: string, @Body() dto: ReviewQuestionDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'hod-01';
    const userRole = req.user?.role || 'HOD';
    return this.questionBankService.reviewQuestion(id, dto, tenantId, userId, userRole);
  }

  @Post('questions/bulk-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk upload questions via CSV/JSON' })
  bulkUploadQuestions(@Body() dto: BulkUploadQuestionsDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.bulkUploadQuestions(dto, tenantId, userId, userRole);
  }
}
