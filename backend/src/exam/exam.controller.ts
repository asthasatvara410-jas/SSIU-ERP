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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import {
  CreateExamTypeDto,
  CreateExamDto,
  UpdateExamDto,
  MapExamSubjectsDto,
  MapExamStudentsDto,
  CreateExamFormWindowDto,
  SubmitExamFormDto,
  CreateExamFormDto,
  UpdateExamFormDto,
  ExamFormQueryDto,
  CreateExamScheduleDto,
  AllocateExamRoomsDto,
  EnterMarksDto,
  BulkEnterMarksDto,
  CorrectResultDto,
  ProcessRevaluationDto,
  ExamQueryDto,
  VerifyExamFormDto,
  ReturnExamFormDto,
  RejectExamFormDto,
  BulkVerifyExamFormsDto,
  BulkReturnExamFormsDto,
  BulkRejectExamFormsDto,
  BulkGenerateHallTicketsDto,
  SubmitMarksDto,
  ReturnMarksDto,
  VerifyMarksDto,
  MarksQueryDto,
  ProcessResultsDto,
  PublishResultsDto,
  WithholdResultDto,
  ReviseResultDto,
  ResultQueryDto,
  CreateExamCentreDto,
  UpdateExamCentreDto,
  ExamCentreQueryDto,
  CreateExamRoomDto,
  UpdateExamRoomDto,
  AllocateExamCentresDto,
  AutoAllocateSeatingDto,
  ManualChangeSeatDto,
  AssignExamEdpDutyDto,
  UpdateEdpDutyStatusDto,
  EdpDutyQueryDto,
} from './dto/exam.dto';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  ReviewQuestionDto,
  BulkUploadQuestionsDto,
  CreateExamPaperDto,
  UpdateExamPaperDto,
  ReviewExamPaperDto,
} from './dto/question-bank.dto';
import { QuestionBankService } from './question-bank.service';
import { ExamPaperService } from './exam-paper.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('University Examination, Evaluation & Result Management')
@ApiBearerAuth()
@Controller('api/v1/exams')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly questionBankService: QuestionBankService,
    private readonly examPaperService: ExamPaperService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Examination KPI metrics & dashboard statistics' })
  getExamDashboardMetrics() {
    return this.examService.getExamDashboardMetrics();
  }

  // ── 1. Exam Types ─────────────────────────────────────────────────────────

  @Post('types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Exam Type (REGULAR, BACKLOG, REMEDIAL, INTERNAL_MID, etc.)' })
  createExamType(@Body() dto: CreateExamTypeDto) {
    return this.examService.createExamType(dto);
  }

  @Get('types')
  @ApiOperation({ summary: 'List all Exam Types' })
  getExamTypes() {
    return this.examService.getExamTypes();
  }

  // ── 2. Examination Sessions ───────────────────────────────────────────────

  // ── 2. Examination Sessions & Management (Phase 2 Core) ───────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new Examination (Regular, Backlog, Remedial, etc.)' })
  createExam(@Body() dto: CreateExamDto, @Req() req: any) {
    return this.examService.createExam(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List Exams with pagination, program, status and search filters' })
  getExams(@Query() query: ExamQueryDto, @Req() req: any) {
    return this.examService.getExams(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Exam details by ID with subjects, fees, and notesheet' })
  getExamById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamById(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Exam details (Draft or Form-Closed states)' })
  updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto, @Req() req: any) {
    return this.examService.updateExam(id, dto, req.user);
  }

  @Post(':id/publish-form')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish and Open Exam Form Window (transitions to FORM_OPEN)' })
  publishForm(@Param('id') id: string, @Req() req: any) {
    return this.examService.publishExamForm(id, req.user);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish Examination' })
  publishExam(@Param('id') id: string, @Req() req: any) {
    return this.examService.publishExam(id, req.user);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish Examination (reverts to DRAFT)' })
  unpublishExam(@Param('id') id: string, @Req() req: any) {
    return this.examService.unpublishExam(id, req.user);
  }

  @Post(':id/close-form')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close Exam Form Window (transitions to FORM_CLOSED)' })
  closeForm(@Param('id') id: string, @Req() req: any) {
    return this.examService.closeExamForm(id, req.user);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close Examination' })
  closeExam(@Param('id') id: string, @Req() req: any) {
    return this.examService.closeExam(id, req.user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel Examination Session' })
  cancelExam(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.examService.cancelExam(id, req.user, reason);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update Exam status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.examService.updateExamStatus(id, status, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or cancel Exam' })
  deleteExam(@Param('id') id: string) {
    return this.examService.deleteExam(id);
  }

  // ── 3. Examination Subjects API ───────────────────────────────────────────

  @Get(':id/subjects')
  @ApiOperation({ summary: 'Get configured subjects for an examination' })
  getExamSubjects(@Param('id') id: string) {
    return this.examService.getExamSubjects(id);
  }

  @Post(':id/subjects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a subject to an examination' })
  addExamSubject(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    if (dto.subjectIds && Array.isArray(dto.subjectIds)) {
      return this.examService.mapSubjectsToExam(id, dto.subjectIds);
    }
    return this.examService.addExamSubject(id, dto, req.user);
  }

  @Patch(':id/subjects/:subjectId')
  @ApiOperation({ summary: 'Update exam subject configuration (marks, duration, mode)' })
  updateExamSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.examService.updateExamSubject(id, subjectId, dto, req.user);
  }

  @Delete(':id/subjects/:subjectId')
  @ApiOperation({ summary: 'Remove a subject from an examination' })
  removeExamSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Req() req: any,
  ) {
    return this.examService.removeExamSubject(id, subjectId, req.user);
  }

  // ── 4. Examination Fees & Late Fee Rules API ──────────────────────────────

  @Get(':id/fees')
  @ApiOperation({ summary: 'Get configured fee structure for an examination' })
  getExamFees(@Param('id') id: string) {
    return this.examService.getExamFees(id);
  }

  @Post(':id/fees')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configure or replace examination fee structure' })
  configureExamFees(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const fees = Array.isArray(body) ? body : body.fees ? body.fees : [body];
    return this.examService.configureExamFees(id, fees, req.user);
  }

  @Get(':id/late-fee-rules')
  @ApiOperation({ summary: 'Get configured late fee rule for an examination' })
  getLateFeeRules(@Param('id') id: string) {
    return this.examService.getLateFeeRules(id);
  }

  @Post(':id/late-fee-rules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configure late fee rule for an examination' })
  configureLateFeeRule(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.examService.configureLateFeeRule(id, dto, req.user);
  }

  // ── 5. Notesheet Integration API ──────────────────────────────────────────

  @Post(':id/link-notesheet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link Phase 1 Notesheet to Examination' })
  linkNotesheet(
    @Param('id') id: string,
    @Body('notesheetId') notesheetId: string,
    @Req() req: any,
  ) {
    return this.examService.linkNotesheetToExam(id, notesheetId, req.user);
  }

  @Post(':id/students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll students into Exam session' })
  enrollStudents(@Param('id') id: string, @Body() dto: MapExamStudentsDto) {
    return this.examService.enrollStudentsToExam(id, dto.studentIds);
  }

  // ── 4. Exam Schedules & Room Allocations ───────────────────────────────────

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Exam Timetable Schedule for a subject' })
  createSchedule(@Body() dto: CreateExamScheduleDto) {
    return this.examService.createSchedule(dto);
  }

  @Get(':examId/schedules')
  @ApiOperation({ summary: 'Get Exam Timetable for an Exam' })
  getSchedules(@Param('examId') examId: string) {
    return this.examService.getSchedules(examId);
  }

  @Post('rooms/allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Allocate Exam Rooms and Desks to enrolled students' })
  allocateRooms(@Body() dto: AllocateExamRoomsDto) {
    return this.examService.allocateRooms(dto);
  }

  @Get('schedules/:scheduleId/allocations')
  @ApiOperation({ summary: 'Get Seating Arrangement and Room Allocations for a schedule' })
  getRoomAllocations(@Param('scheduleId') scheduleId: string) {
    return this.examService.getRoomAllocations(scheduleId);
  }

  // ── 5. Marks Entry, Submission & Verification ────────────────────────────

  @Get('marks')
  @ApiOperation({ summary: 'Get student marks list for examination & subject evaluation' })
  getMarksList(@Query() query: MarksQueryDto, @Req() req: any) {
    return this.examService.getMarksList(query, req.user);
  }

  @Post('marks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enter / Record Internal, External, and Practical marks' })
  enterMarks(@Body() dto: EnterMarksDto, @Req() req: any) {
    return this.examService.enterMarks(req.user, dto);
  }

  @Post('marks/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty/Examiner submits marks for evaluation review' })
  submitMarks(@Body() dto: SubmitMarksDto, @Req() req: any) {
    return this.examService.submitMarks(req.user, dto);
  }

  @Post('marks/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller returns marks to faculty with mandatory reason' })
  returnMarks(@Body() dto: ReturnMarksDto, @Req() req: any) {
    return this.examService.returnMarks(req.user, dto);
  }

  @Post('marks/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller verifies submitted marks' })
  verifyMarks(@Body() dto: VerifyMarksDto, @Req() req: any) {
    return this.examService.verifyMarks(req.user, dto);
  }

  @Post('results/enter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enter / Record Internal, External, and Practical marks' })
  enterMarksAlias(@Body() dto: EnterMarksDto, @Req() req: any) {
    return this.examService.enterMarks(req.user, dto);
  }

  @Post('results/bulk-enter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk enter marks for a batch of students in a subject' })
  bulkEnterMarks(@Body() dto: BulkEnterMarksDto, @Req() req: any) {
    return this.examService.bulkEnterMarks(req.user, dto);
  }

  // ── 6. Results Processing, Verification, Withhold & Publication ───────────

  @Get('results')
  @ApiOperation({ summary: 'Get list of processed/published examination results with multi-filters' })
  getResultsList(@Query() query: ResultQueryDto, @Req() req: any) {
    return this.examService.getResultsList(query, req.user);
  }

  @Get('results/:id')
  @ApiOperation({ summary: 'Get detailed result summary with subject marks breakdown' })
  getResultById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getResultById(id, req.user);
  }

  @Post('results/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process results: Calculate SGPA, CGPA, Credits, Backlogs and Pass/Fail' })
  processResults(@Body() dto: ProcessResultsDto, @Req() req: any) {
    return this.examService.processExamResults(req.user, dto.examId);
  }

  @Post('results/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify processed results (Exam Controller / Dean)' })
  verifyResults(@Body('examId') examId: string, @Req() req: any) {
    return this.examService.approveExamResults(req.user, examId);
  }

  @Post('results/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish results to student & HOD portals, generate marksheet numbers & QR codes' })
  publishResults(@Body() dto: PublishResultsDto, @Req() req: any) {
    return this.examService.publishExamResults(req.user, dto);
  }

  @Post('results/withhold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withhold student result with category and internal reason' })
  withholdResult(@Body() dto: WithholdResultDto, @Req() req: any) {
    return this.examService.withholdResult(req.user, dto);
  }

  @Post('results/revise')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revise published result and store audit trail in ResultRevisionHistory' })
  reviseResult(@Body() dto: ReviseResultDto, @Req() req: any) {
    return this.examService.reviseResult(req.user, dto);
  }

  @Post(':examId/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate SGPA, CGPA, Credits, Backlogs and Evaluate Exam Results' })
  evaluateResults(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.evaluateExamResults(req.user, examId);
  }

  @Post(':examId/approve-results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve examination results (Exam Controller / Dean)' })
  approveResults(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.approveExamResults(req.user, examId);
  }

  @Post(':examId/publish-results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish examination results to student portal & generate marksheet numbers' })
  publishResultsLegacy(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.publishExamResults(req.user, examId);
  }

  // ── 7. Student Results & Marksheets ───────────────────────────────────────

  @Get('student/results')
  @ApiOperation({ summary: 'Get logged-in student published results and semester summaries' })
  getStudentResultsList(@Req() req: any) {
    return this.examService.getStudentResults(req.user);
  }

  @Get('student/results/:id')
  @ApiOperation({ summary: 'Get specific result for student' })
  getStudentResultById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getResultById(id, req.user);
  }

  @Get('student/marksheets')
  @ApiOperation({ summary: 'Get logged-in student published official marksheets' })
  getStudentMarksheets(@Req() req: any) {
    return this.examService.getStudentMarksheets(req.user);
  }

  @Get('student/marksheets/:id')
  @ApiOperation({ summary: 'Get specific marksheet statement for student' })
  getStudentMarksheetById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getStudentMarksheetById(id, req.user);
  }

  @Get('results/my')
  @ApiOperation({ summary: 'Get logged-in student published results and semester summaries' })
  getMyResults(@Req() req: any) {
    return this.examService.getStudentResults(req.user);
  }

  @Get('results/student/:studentId')
  @ApiOperation({ summary: 'Get student results and transcripts (Faculty / Admin access)' })
  getStudentResults(@Param('studentId') studentId: string, @Req() req: any) {
    return this.examService.getStudentResults(req.user, studentId);
  }

  // ── 8. HOD Results & Export ───────────────────────────────────────────────

  @Get('hod/results')
  @ApiOperation({ summary: 'HOD accesses department student results and analytics' })
  getHODResults(@Query() query: any, @Req() req: any) {
    return this.examService.getHODResults(req.user, query);
  }

  @Get('hod/results/export')
  @ApiOperation({ summary: 'Export HOD department examination results' })
  exportHODResults(@Query() query: any, @Req() req: any) {
    return this.examService.exportHODResults(req.user, query);
  }

  @Get('hod/results/:id')
  @ApiOperation({ summary: 'HOD views specific student result within department' })
  getHODResultById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getResultById(id, req.user);
  }

  // ── 9. Public Result Verification ─────────────────────────────────────────

  @Get('public/result/verify/:verificationCode')
  @ApiOperation({ summary: 'Public: Verify Marksheet / Result Authenticity via QR code' })
  verifyPublicResult(@Param('verificationCode') code: string) {
    return this.examService.verifyPublicResult(code);
  }

  // ── 8. Result Correction & Revaluation Workflow ───────────────────────────

  @Post('results/:resultId/correction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revise / Correct examination marks with mandatory reason' })
  correctResult(@Param('resultId') resultId: string, @Body() dto: CorrectResultDto, @Req() req: any) {
    return this.examService.correctResult(req.user, resultId, dto);
  }

  @Post('revaluation/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student applies for Revaluation / Rechecking' })
  applyRevaluation(@Req() req: any, @Body() body: any) {
    return this.examService.applyRevaluation(body, req.user.id);
  }

  @Get('revaluations')
  @ApiOperation({ summary: 'Get Revaluation Requests list' })
  getRevaluations() {
    return this.examService.getRevaluations();
  }

  @Patch('revaluation/:id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process Revaluation evaluation and update marks' })
  processRevaluation(@Param('id') id: string, @Body() dto: ProcessRevaluationDto, @Req() req: any) {
    return this.examService.processRevaluation(id, dto, req.user);
  }

  // ── 9. Examination Reports ────────────────────────────────────────────────

  @Get(':examId/reports/summary')
  @ApiOperation({ summary: 'Get Examination statistical summary (pass %, appeared, passed, failed, ATKT, avg SGPA)' })
  getExamSummaryReport(@Param('examId') examId: string) {
    return this.examService.getExamSummaryReport(examId);
  }

  @Get(':examId/reports/toppers')
  @ApiOperation({ summary: 'Get Examination Toppers ranking list' })
  @ApiQuery({ name: 'limit', required: false })
  getExamToppersReport(@Param('examId') examId: string, @Query('limit') limit?: number) {
    return this.examService.getExamToppersReport(examId, limit);
  }

  @Get(':examId/reports/subject-analysis')
  @ApiOperation({ summary: 'Get Subject-wise performance analysis (highest, lowest, average, pass %)' })
  getSubjectAnalysisReport(@Param('examId') examId: string) {
    return this.examService.getSubjectAnalysisReport(examId);
  }

  // ── 10. Form Windows & Hall Tickets ───────────────────────────────────────

  @Post('windows')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Exam Form Window (open/close dates, fees)' })
  createWindow(@Body() dto: CreateExamFormWindowDto) {
    return this.examService.createFormWindow(dto);
  }

  @Get('windows/active')
  @ApiOperation({ summary: 'Get Active Exam Form Windows' })
  getActiveWindows() {
    return this.examService.getActiveFormWindows();
  }

  // ── 10. Student Exam Form & Submission Workflow (Phase 2 & 3) ───────────────

  @Get('student/exams/available')
  @ApiOperation({ summary: 'Student: Get Available Examinations with live status and fee calculation' })
  getStudentAvailableExams(@Req() req: any) {
    return this.examService.getAvailableExamsForStudent(req.user);
  }

  @Get('student/exams/:examId')
  @ApiOperation({ summary: 'Student: Get Exam Details and Fee breakdown' })
  getStudentExamDetails(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.getExamDetailsForStudent(examId, req.user);
  }

  @Get('student/exams/:examId/subjects')
  @ApiOperation({ summary: 'Student: Get eligible subjects for an examination' })
  getStudentExamSubjects(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.getExamSubjectsForStudent(examId, req.user);
  }

  @Post('student/exam-forms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student: Create or Save Draft Exam Form' })
  createStudentExamFormPost(@Body() dto: CreateExamFormDto, @Req() req: any) {
    return this.examService.createStudentExamForm(dto, req.user);
  }

  @Get('student/exam-forms')
  @ApiOperation({ summary: 'Student: Get all exam forms submitted or drafted by current student' })
  getStudentExamFormsList(@Req() req: any) {
    return this.examService.getStudentExamForms(req.user);
  }

  @Get('student/exam-forms/:id')
  @ApiOperation({ summary: 'Student: Get exam form details by ID' })
  getStudentExamFormById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamFormById(id, req.user);
  }

  @Patch('student/exam-forms/:id')
  @ApiOperation({ summary: 'Student: Update DRAFT or RETURNED exam form subjects and remarks' })
  updateStudentExamFormPatch(@Param('id') id: string, @Body() dto: UpdateExamFormDto, @Req() req: any) {
    return this.examService.updateStudentExamForm(id, dto, req.user);
  }

  @Post('student/exam-forms/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student: Final submit exam form with confirmation declaration' })
  submitStudentExamFormPost(@Param('id') id: string, @Body() dto: SubmitExamFormDto, @Req() req: any) {
    return this.examService.submitStudentExamForm(id, dto, req.user);
  }

  @Post('student/exam-forms/:id/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student: Process Exam Form Fee Payment' })
  payStudentExamFormPost(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.examService.payStudentExamForm(id, dto, req.user);
  }

  @Get('student/exam-forms/:id/payment-status')
  @ApiOperation({ summary: 'Student: Check Exam Form Payment Status' })
  getStudentExamFormPaymentStatus(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamFormPaymentStatus(id, req.user);
  }

  // Aliases for backward compatibility
  @Get('students/me/available')
  @ApiOperation({ summary: 'Student: Get Available Examinations' })
  getAvailableExamsForStudent(@Req() req: any) {
    return this.examService.getAvailableExamsForStudent(req.user);
  }

  @Get('students/me/profile')
  @ApiOperation({ summary: 'Student: Get Read-Only Student Academic Details for Exam Form' })
  getStudentProfileForExam(@Req() req: any) {
    return this.examService.getStudentProfileForExam(req.user);
  }

  @Get('students/me/forms')
  @ApiOperation({ summary: 'Student: Get all exam forms' })
  getStudentExamForms(@Req() req: any) {
    return this.examService.getStudentExamForms(req.user);
  }

  @Post('forms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student: Create or Save Draft Exam Form' })
  createStudentExamForm(@Body() dto: CreateExamFormDto, @Req() req: any) {
    return this.examService.createStudentExamForm(dto, req.user);
  }

  @Get('forms')
  @ApiOperation({ summary: 'Exam Controller / Staff: List all exam forms' })
  getExamFormsList(@Query() query: ExamFormQueryDto, @Req() req: any) {
    return this.examService.getExamFormsList(query, req.user);
  }

  @Get('forms/:id')
  @ApiOperation({ summary: 'Get exam form details by ID' })
  getExamFormById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamFormById(id, req.user);
  }

  @Patch('forms/:id')
  @ApiOperation({ summary: 'Student: Update DRAFT or RETURNED exam form' })
  updateStudentExamForm(@Param('id') id: string, @Body() dto: UpdateExamFormDto, @Req() req: any) {
    return this.examService.updateStudentExamForm(id, dto, req.user);
  }

  @Post('forms/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student: Final submit exam form' })
  submitStudentExamForm(@Param('id') id: string, @Body() dto: SubmitExamFormDto, @Req() req: any) {
    return this.examService.submitStudentExamForm(id, dto, req.user);
  }

  @Post('forms/:id/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process Exam Form Payment' })
  payExamForm(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.examService.payStudentExamForm(id, dto, req.user);
  }

  @Get('forms/:id/payment-status')
  @ApiOperation({ summary: 'Get Exam Form Payment Status' })
  getFormPaymentStatus(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamFormPaymentStatus(id, req.user);
  }

  // ── Phase 3: Exam Form Verification Workflow ──────────────────────────────

  @Get('exam-controller/exam-forms')
  @ApiOperation({ summary: 'Exam Controller: List exam forms with filters, search, and pagination' })
  getExamControllerFormsList(@Query() query: ExamFormQueryDto, @Req() req: any) {
    return this.examService.getExamFormsList(query, req.user);
  }

  @Get('exam-controller/exam-forms/:id')
  @ApiOperation({ summary: 'Exam Controller: Get full exam form review details by ID' })
  getExamControllerFormById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamFormById(id, req.user);
  }

  @Patch('exam-controller/exam-forms/:id/review')
  @ApiOperation({ summary: 'Exam Controller: Start review on submitted exam form (Transition to UNDER_REVIEW)' })
  reviewExamForm(@Param('id') id: string, @Req() req: any) {
    return this.examService.reviewExamForm(id, req.user);
  }

  @Post('exam-controller/exam-forms/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Verify examination form after fee clearance' })
  verifyExamForm(@Param('id') id: string, @Body() dto: VerifyExamFormDto, @Req() req: any) {
    return this.examService.verifyExamForm(id, dto, req.user);
  }

  @Post('exam-controller/exam-forms/:id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Return examination form for student correction (Reason required)' })
  returnExamForm(@Param('id') id: string, @Body() dto: ReturnExamFormDto, @Req() req: any) {
    return this.examService.returnExamForm(id, dto, req.user);
  }

  @Post('exam-controller/exam-forms/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Reject examination form (Reason required)' })
  rejectExamForm(@Param('id') id: string, @Body() dto: RejectExamFormDto, @Req() req: any) {
    return this.examService.rejectExamForm(id, dto, req.user);
  }

  @Post('exam-controller/exam-forms/bulk-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Bulk verify multiple exam forms' })
  bulkVerifyExamForms(@Body() dto: BulkVerifyExamFormsDto, @Req() req: any) {
    return this.examService.bulkVerifyExamForms(dto, req.user);
  }

  @Post('exam-controller/exam-forms/bulk-return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Bulk return multiple exam forms for correction' })
  bulkReturnExamForms(@Body() dto: BulkReturnExamFormsDto, @Req() req: any) {
    return this.examService.bulkReturnExamForms(dto, req.user);
  }

  @Post('exam-controller/exam-forms/bulk-reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Bulk reject multiple exam forms' })
  bulkRejectExamForms(@Body() dto: BulkRejectExamFormsDto, @Req() req: any) {
    return this.examService.bulkRejectExamForms(dto, req.user);
  }

  // ── Phase 3: Hall Ticket Generation & APIs ─────────────────────────────────

  @Post('exam-controller/hall-tickets/:examFormId/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Exam Controller: Generate unique Hall Ticket for VERIFIED + paid form' })
  generateHallTicketController(@Param('examFormId') examFormId: string, @Req() req: any) {
    return this.examService.generateHallTicketForForm(examFormId, req.user);
  }

  @Post('exam-controller/hall-tickets/bulk-generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller: Bulk generate Hall Tickets for verified forms' })
  bulkGenerateHallTickets(@Body() dto: BulkGenerateHallTicketsDto, @Req() req: any) {
    return this.examService.bulkGenerateHallTickets(dto, req.user);
  }

  @Get('exam-controller/hall-tickets')
  @ApiOperation({ summary: 'Exam Controller / Staff: List all generated Hall Tickets' })
  getExamControllerHallTickets(@Query() query: any, @Req() req: any) {
    return this.examService.getHallTicketsList(query, req.user);
  }

  @Get('exam-controller/hall-tickets/:id')
  @ApiOperation({ summary: 'Exam Controller / Staff: Get Hall Ticket details by ID or Number' })
  getExamControllerHallTicketById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getHallTicketById(id, req.user);
  }

  @Get('student/hall-tickets')
  @ApiOperation({ summary: 'Student: Get all Hall Tickets for logged-in student' })
  getStudentHallTickets(@Req() req: any) {
    return this.examService.getHallTicketsList({}, req.user);
  }

  @Get('student/hall-tickets/:id')
  @ApiOperation({ summary: 'Student: Get single Hall Ticket by ID with ownership security' })
  getStudentHallTicketById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getHallTicketById(id, req.user);
  }

  @Get('public/hall-ticket/verify/:verificationCode')
  @ApiOperation({ summary: 'Public: Verify Hall Ticket Authenticity via QR Code reference without exposing sensitive data' })
  verifyPublicHallTicket(@Param('verificationCode') verificationCode: string) {
    return this.examService.verifyPublicHallTicket(verificationCode);
  }

  @Patch('forms/:id/approve')
  @ApiOperation({ summary: 'Approve exam form' })
  approveForm(@Param('id') id: string, @Body('feePaid') feePaid: boolean) {
    return this.examService.approveExamForm(id, feePaid);
  }

  @Post('forms/:id/generate-hall-ticket')
  @ApiOperation({ summary: 'Generate official Hall Ticket upon form approval & fee clearance' })
  generateHallTicket(@Param('id') id: string, @Req() req: any) {
    return this.examService.generateHallTicketForForm(id, req.user);
  }

  @Get('hall-tickets')
  @ApiOperation({ summary: 'Get Hall Tickets' })
  getHallTickets(@Req() req: any) {
    return this.examService.getHallTicketsList({}, req.user);
  }

  // ── 11. Exam Centres & Rooms Master ───────────────────────────────────────

  @Get('centres')
  @ApiOperation({ summary: 'Get all Exam Centres with Rooms and allocated exams' })
  getExamCentres(@Query() query: ExamCentreQueryDto, @Req() req: any) {
    return this.examService.getExamCentres(query, req.user);
  }

  @Get('centres/:id')
  @ApiOperation({ summary: 'Get specific Exam Centre by ID' })
  getExamCentreById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamCentreById(id, req.user);
  }

  @Post('centres')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new Exam Centre' })
  createExamCentre(@Body() dto: CreateExamCentreDto, @Req() req: any) {
    return this.examService.createExamCentre(dto, req.user);
  }

  @Patch('centres/:id')
  @ApiOperation({ summary: 'Update Exam Centre' })
  updateExamCentre(@Param('id') id: string, @Body() dto: UpdateExamCentreDto, @Req() req: any) {
    return this.examService.updateExamCentre(id, dto, req.user);
  }

  @Patch('centres/:id/status')
  @ApiOperation({ summary: 'Activate or Deactivate Exam Centre' })
  toggleExamCentreStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.examService.toggleExamCentreStatus(id, status, req.user);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get Exam Rooms (optionally filtered by centreId)' })
  getExamRooms(@Query('centreId') centreId: string, @Req() req: any) {
    return this.examService.getExamRooms(centreId, req.user);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get Exam Room by ID' })
  getExamRoomById(@Param('id') id: string, @Req() req: any) {
    return this.examService.getExamRoomById(id, req.user);
  }

  @Post('rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Exam Room inside Centre' })
  createExamRoom(@Body() dto: CreateExamRoomDto, @Req() req: any) {
    return this.examService.createExamRoom(dto, req.user);
  }

  @Patch('rooms/:id')
  @ApiOperation({ summary: 'Update Exam Room' })
  updateExamRoom(@Param('id') id: string, @Body() dto: UpdateExamRoomDto, @Req() req: any) {
    return this.examService.updateExamRoom(id, dto, req.user);
  }

  @Patch('rooms/:id/status')
  @ApiOperation({ summary: 'Set Room status (AVAILABLE / UNAVAILABLE)' })
  toggleExamRoomStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.examService.toggleExamRoomStatus(id, status, req.user);
  }

  // ── 12. Exam Centre Allocation ───────────────────────────────────────────

  @Post('centre-allocations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Allocate examination to one or more exam centres' })
  allocateExamCentres(@Body() dto: AllocateExamCentresDto, @Req() req: any) {
    return this.examService.allocateExamCentres(dto, req.user);
  }

  @Get('examinations/:examId/centres')
  @ApiOperation({ summary: 'Get centres allocated to an examination' })
  getExamCentresByExam(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.getExamCentresByExam(examId, req.user);
  }

  @Get('examinations/:examId/eligible-students')
  @ApiOperation({ summary: 'Get verified & paid students eligible for exam seating' })
  getEligibleStudentsForSeating(@Param('examId') examId: string, @Req() req: any) {
    return this.examService.getEligibleStudentsForSeating(examId, req.user);
  }

  // ── 13. Seating Arrangement & Auto Allocation ────────────────────────────

  @Post('examinations/:examId/seating/auto-allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Automatically allocate seats for eligible students across rooms' })
  autoAllocateSeating(@Param('examId') examId: string, @Body() body: any, @Req() req: any) {
    return this.examService.autoAllocateSeating({ ...body, examId }, req.user);
  }

  @Post('seating/manual-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually change a student seat with mandatory audit reason' })
  manualChangeSeat(@Body() dto: ManualChangeSeatDto, @Req() req: any) {
    return this.examService.manualChangeSeat(dto, req.user);
  }

  @Get('examinations/:examId/seating')
  @ApiOperation({ summary: 'Get seating arrangement list for examination (RBAC scoped)' })
  getExamSeating(@Param('examId') examId: string, @Query() query: any, @Req() req: any) {
    return this.examService.getExamSeating(examId, query, req.user);
  }

  // ── 14. EDP Duty Management ──────────────────────────────────────────────

  @Get('edp-staff')
  @ApiOperation({ summary: 'Get list of authorized faculty & staff available for EDP duty' })
  getEdpStaffList(@Query() query: any, @Req() req: any) {
    return this.examService.getEdpStaffList(query, req.user);
  }

  @Get('edp-duties')
  @ApiOperation({ summary: 'Get EDP duties roster (scoped for staff or controller overview)' })
  getEdpDuties(@Query() query: EdpDutyQueryDto, @Req() req: any) {
    return this.examService.getEdpDuties(query, req.user);
  }

  @Post('edp-duties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign EDP duty to staff member with overlap prevention' })
  assignEdpDuty(@Body() dto: AssignExamEdpDutyDto, @Req() req: any) {
    return this.examService.assignEdpDuty(dto, req.user);
  }

  @Patch('edp-duties/:id/status')
  @ApiOperation({ summary: 'Update EDP duty status (CONFIRMED, REJECTED, COMPLETED, CANCELLED)' })
  updateEdpDutyStatus(@Param('id') id: string, @Body() dto: UpdateEdpDutyStatusDto, @Req() req: any) {
    return this.examService.updateEdpDutyStatus(id, dto, req.user);
  }

  @Post('edp-duties/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff acknowledges & confirms assigned examination duty' })
  confirmEdpDuty(@Param('id') id: string, @Req() req: any) {
    return this.examService.updateEdpDutyStatus(id, { status: 'CONFIRMED' }, req.user);
  }

  @Post('edp-duties/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff rejects assigned examination duty with mandatory reason' })
  rejectEdpDuty(@Param('id') id: string, @Body('rejectionReason') reason: string, @Req() req: any) {
    return this.examService.updateEdpDutyStatus(id, { status: 'REJECTED', rejectionReason: reason }, req.user);
  }

  @Post('edp-duties/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exam Controller cancels assigned examination duty' })
  cancelEdpDuty(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.examService.updateEdpDutyStatus(id, { status: 'CANCELLED', rejectionReason: reason }, req.user);
  }

  // ── 15. Exam Day Control & Reports ───────────────────────────────────────

  @Get('examinations/:examId/day-control')
  @ApiOperation({ summary: 'Real-time Exam Day Control live operations overview' })
  getExamDayControl(@Param('examId') examId: string, @Query('date') date: string, @Req() req: any) {
    return this.examService.getExamDayControl(examId, date, req.user);
  }

  @Get('examinations/:examId/seating-reports')
  @ApiOperation({ summary: 'Generate centre-wise, room-wise, or door chart seating reports' })
  getSeatingReports(@Param('examId') examId: string, @Query('reportType') reportType: string, @Req() req: any) {
    return this.examService.getSeatingReports(examId, reportType || 'SEATING_ARRANGEMENT', req.user);
  }

  // ── 16. Legacy Invigilation & Attendance ──────────────────────────────────

  @Post('invigilators')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign Invigilator duty to Faculty' })
  assignInvigilator(@Body() body: any) {
    return this.examService.assignInvigilator(body);
  }

  @Post('attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record student Exam Attendance (PRESENT, ABSENT, MALPRACTICE, etc.)' })
  recordAttendance(@Req() req: any, @Body() body: any) {
    return this.examService.recordExamAttendance({
      ...body,
      markedByUserId: req.user.id,
    });
  }

  // ── 17. SMART QUESTION BANK ENGINE ────────────────────────────────────────

  @Post('questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new question in Question Bank' })
  createQuestion(@Body() dto: CreateQuestionDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.questionBankService.createQuestion(dto, tenantId, userId, userRole);
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
  @ApiOperation({ summary: 'Update question in Question Bank' })
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

  // ── 18. SMART EXAM PAPER ENGINE & WORKFLOW ────────────────────────────────

  @Post('papers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Exam Paper draft' })
  createExamPaper(@Body() dto: CreateExamPaperDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.createExamPaper(dto, tenantId, userId, userRole);
  }

  @Get('papers')
  @ApiOperation({ summary: 'List Exam Papers with RBAC scoping' })
  listExamPapers(@Query() query: any, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.listExamPapers(query, tenantId, userId, userRole);
  }

  @Get('papers/metrics')
  @ApiOperation({ summary: 'Get Exam Paper KPI metrics & analytics' })
  getPaperMetrics(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.getPaperMetrics(tenantId, userId, userRole);
  }

  @Get('papers/:id')
  @ApiOperation({ summary: 'Get Exam Paper details, questions, and preview' })
  getExamPaperDetails(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.getExamPaperDetails(id, tenantId, userId, userRole);
  }

  @Patch('papers/:id')
  @ApiOperation({ summary: 'Update Exam Paper (if not locked)' })
  updateExamPaper(@Param('id') id: string, @Body() dto: UpdateExamPaperDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.updateExamPaper(id, dto, tenantId, userId, userRole);
  }

  @Delete('papers/:id')
  @ApiOperation({ summary: 'Delete draft Exam Paper' })
  deleteExamPaper(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.deleteExamPaper(id, tenantId, userId, userRole);
  }

  @Post('papers/:id/submit-hod')
  @ApiOperation({ summary: 'Submit Exam Paper for HOD approval' })
  submitPaperForHOD(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'faculty-01';
    const userRole = req.user?.role || 'FACULTY';
    return this.examPaperService.submitPaperForHOD(id, tenantId, userId, userRole);
  }

  @Post('papers/:id/review-hod')
  @ApiOperation({ summary: 'HOD review of Exam Paper (Approve/Reject)' })
  reviewPaperByHOD(@Param('id') id: string, @Body() dto: ReviewExamPaperDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'hod-01';
    const userRole = req.user?.role || 'HOD';
    return this.examPaperService.reviewPaperByHOD(id, dto, tenantId, userId, userRole);
  }

  @Post('papers/:id/submit-hoi')
  @ApiOperation({ summary: 'Escalate HOD-approved paper to HOI for locking' })
  submitPaperForHOI(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'hod-01';
    const userRole = req.user?.role || 'HOD';
    return this.examPaperService.submitPaperForHOI(id, tenantId, userId, userRole);
  }

  @Post('papers/:id/review-hoi')
  @ApiOperation({ summary: 'HOI final review: Lock, Reject, or Publish paper' })
  reviewPaperByHOI(@Param('id') id: string, @Body() dto: ReviewExamPaperDto, @Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id || 'hoi-01';
    const userRole = req.user?.role || 'PRINCIPAL';
    return this.examPaperService.reviewPaperByHOI(id, dto, tenantId, userId, userRole);
  }
}
