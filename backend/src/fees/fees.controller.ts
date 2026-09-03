import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import {
  CreateFeeHeadDto,
  UpdateFeeHeadDto,
  UpdateFeeHeadStatusDto,
  FeeHeadQueryDto,
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  DuplicateFeeStructureDto,
  FeeStructureQueryDto,
  AddFeeStructureItemDto,
  UpdateFeeStructureItemDto,
  AssignFeeStructureDto,
  EligibleStudentsQueryDto,
  StudentFeeAccountQueryDto,
  CreateStudentFeeAccountDto,
  RecordPaymentDto,
  ApplyDiscountDto,
  CreateRefundDto,
  GenerateFeeInvoiceDto,
  UpdateFeeInvoiceDto,
  CancelFeeInvoiceDto,
  FeeInvoiceQueryDto,
} from './dto/fees.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Student Fees Management')
@ApiBearerAuth()
@Controller('api/v1')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // ── Fee Heads (Phase 1 — University Fee Head Master)

  @Post('fee-heads')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Fee Head (TUITION, HOSTEL, LAB, etc.)' })
  createFeeHead(@Body() dto: CreateFeeHeadDto, @Req() req: any) {
    return this.feesService.createFeeHead(dto, req.user);
  }

  @Get('fee-heads')
  @ApiOperation({ summary: 'List all Fee Heads with search, filters, and pagination' })
  getFeeHeads(@Query() query: FeeHeadQueryDto) {
    return this.feesService.getFeeHeads(query);
  }

  @Get('fee-heads/categories')
  @ApiOperation({ summary: 'Get list of configurable Fee Categories' })
  getFeeCategories() {
    return this.feesService.getFeeCategories();
  }

  @Get('fee-heads/:id')
  @ApiOperation({ summary: 'Get Fee Head details and usage by ID' })
  getFeeHeadById(@Param('id') id: string) {
    return this.feesService.getFeeHeadById(id);
  }

  @Patch('fee-heads/:id')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Update Fee Head parameters' })
  updateFeeHead(@Param('id') id: string, @Body() dto: UpdateFeeHeadDto, @Req() req: any) {
    return this.feesService.updateFeeHead(id, dto, req.user);
  }

  @Patch('fee-heads/:id/status')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Activate or Deactivate Fee Head' })
  updateFeeHeadStatus(@Param('id') id: string, @Body() dto: UpdateFeeHeadStatusDto, @Req() req: any) {
    return this.feesService.updateFeeHeadStatus(id, dto, req.user);
  }

  @Get('fee-heads/:id/audit-history')
  @ApiOperation({ summary: 'Get Fee Head change and audit log history' })
  getFeeHeadAuditLogs(@Param('id') id: string) {
    return this.feesService.getFeeHeadAuditLogs(id);
  }

  // ── Fee Structures (Phase 2 — University Fee Structure Master)

  @Post('fee-structures')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Fee Structure for Program + Semester + Academic Year' })
  createFeeStructure(@Body() dto: CreateFeeStructureDto, @Req() req: any) {
    return this.feesService.createFeeStructure(dto, req.user);
  }

  @Get('fee-structures')
  @ApiOperation({ summary: 'List Fee Structures with search, filters, and pagination' })
  getFeeStructures(@Query() query: FeeStructureQueryDto) {
    return this.feesService.getFeeStructures(query);
  }

  @Get('fee-structures/:id')
  @ApiOperation({ summary: 'Get Fee Structure detail and breakdown by ID' })
  getFeeStructureById(@Param('id') id: string) {
    return this.feesService.getFeeStructureById(id);
  }

  @Patch('fee-structures/:id')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Update Fee Structure metadata and items' })
  updateFeeStructure(@Param('id') id: string, @Body() dto: UpdateFeeStructureDto, @Req() req: any) {
    return this.feesService.updateFeeStructure(id, dto, req.user);
  }

  @Post('fee-structures/:id/duplicate')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate Fee Structure to a target Academic Year (creates DRAFT)' })
  duplicateFeeStructure(@Param('id') id: string, @Body() dto: DuplicateFeeStructureDto, @Req() req: any) {
    return this.feesService.duplicateFeeStructure(id, dto, req.user);
  }

  @Patch('fee-structures/:id/activate')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Activate a Fee Structure' })
  activateFeeStructure(@Param('id') id: string, @Req() req: any) {
    return this.feesService.activateFeeStructure(id, req.user);
  }

  @Patch('fee-structures/:id/deactivate')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Deactivate a Fee Structure' })
  deactivateFeeStructure(@Param('id') id: string, @Req() req: any) {
    return this.feesService.deactivateFeeStructure(id, req.user);
  }

  @Post('fee-structures/:id/items')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new Fee Head Item to Fee Structure' })
  addFeeStructureItem(@Param('id') id: string, @Body() dto: AddFeeStructureItemDto, @Req() req: any) {
    return this.feesService.addFeeStructureItem(id, dto, req.user);
  }

  @Patch('fee-structures/:id/items/:itemId')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Update an existing Fee Head Item in Fee Structure' })
  updateFeeStructureItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateFeeStructureItemDto,
    @Req() req: any,
  ) {
    return this.feesService.updateFeeStructureItem(id, itemId, dto, req.user);
  }

  @Delete('fee-structures/:id/items/:itemId')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Remove a Fee Head Item from Fee Structure' })
  deleteFeeStructureItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    return this.feesService.deleteFeeStructureItem(id, itemId, req.user);
  }

  @Get('fee-structures/:id/audit-history')
  @ApiOperation({ summary: 'Get Fee Structure change and audit log history' })
  getFeeStructureAuditLogs(@Param('id') id: string) {
    return this.feesService.getFeeStructureAuditLogs(id);
  }

  // ── Phase 3 — Student Fee Assignment & Student Fee Account Master ─────────────

  @Get('fee-assignments/eligible-students')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get eligible students for a given fee structure' })
  getEligibleStudents(@Query() query: EligibleStudentsQueryDto) {
    return this.feesService.getEligibleStudents(query);
  }

  @Post('fee-assignments')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk assign an active Fee Structure to eligible students' })
  assignFeeStructure(@Body() dto: AssignFeeStructureDto, @Req() req: any) {
    return this.feesService.assignFeeStructure(dto, req.user);
  }

  @Get('student-fees')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List all Student Fee Accounts with search, filters, pagination' })
  getStudentFeeAccounts(@Query() query: StudentFeeAccountQueryDto, @Req() req: any) {
    return this.feesService.getStudentFeeAccounts(query, req.user);
  }

  @Get('student-fees/my')
  @ApiOperation({ summary: 'View own fee accounts (logged-in student)' })
  getMyFeeAccount(@Req() req: any) {
    const userId = typeof req === 'string' ? req : (req?.user?.id || req?.id);
    return this.feesService.getMyFeeAccount(userId);
  }

  @Get('student-fees/:id')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get single Student Fee Account details and breakdown' })
  getStudentFeeAccountById(@Param('id') id: string, @Req() req: any) {
    return this.feesService.getStudentFeeAccountById(id, req?.user || req);
  }

  @Get('student-fees/:id/audit-history')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get Student Fee Account audit history' })
  getStudentFeeAccountAuditLogs(@Param('id') id: string, @Req() req: any) {
    return this.feesService.getStudentFeeAccountAuditLogs(id, req?.user || req);
  }

  @Get('students/:studentId/fees')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get all fee accounts for a specific student' })
  getStudentFeesByStudentId(@Param('studentId') studentId: string, @Req() req: any) {
    return this.feesService.getStudentFeesByStudentId(studentId, req?.user || req);
  }

  // ── Phase 4: Fee Invoice / Demand Endpoints ─────────────────────────────────

  @Post('fee-invoices')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate Fee Invoice / Demand for a student fee account' })
  generateFeeInvoice(@Body() dto: GenerateFeeInvoiceDto, @Req() req: any) {
    return this.feesService.generateFeeInvoice(dto, req?.user || req);
  }

  @Get('fee-invoices')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List and filter Fee Invoices with pagination' })
  getFeeInvoices(@Query() query: FeeInvoiceQueryDto, @Req() req: any) {
    return this.feesService.getFeeInvoices(query, req?.user || req);
  }

  @Get('fee-invoices/my')
  @ApiOperation({ summary: 'View own fee invoices (logged-in student)' })
  getMyFeeInvoices(@Req() req: any) {
    const userId = typeof req === 'string' ? req : (req?.user?.id || req?.id);
    return this.feesService.getMyFeeInvoices(userId);
  }

  @Get('fee-invoices/:id')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get single Fee Invoice details with line items' })
  getFeeInvoiceById(@Param('id') id: string, @Req() req: any) {
    return this.feesService.getFeeInvoiceById(id, req?.user || req);
  }

  @Patch('fee-invoices/:id')
  @RequirePermission('FEES', 'UPDATE')
  @ApiOperation({ summary: 'Update a DRAFT Fee Invoice (due date, remarks)' })
  updateFeeInvoice(@Param('id') id: string, @Body() dto: UpdateFeeInvoiceDto, @Req() req: any) {
    return this.feesService.updateFeeInvoice(id, dto, req?.user || req);
  }

  @Post('fee-invoices/:id/issue')
  @RequirePermission('FEES', 'UPDATE')
  @ApiOperation({ summary: 'Issue a DRAFT Fee Invoice' })
  issueFeeInvoice(@Param('id') id: string, @Req() req: any) {
    return this.feesService.issueFeeInvoice(id, req?.user || req);
  }

  @Post('fee-invoices/:id/cancel')
  @RequirePermission('FEES', 'DELETE')
  @ApiOperation({ summary: 'Cancel a Fee Invoice with reason' })
  cancelFeeInvoice(@Param('id') id: string, @Body() dto: CancelFeeInvoiceDto, @Req() req: any) {
    return this.feesService.cancelFeeInvoice(id, dto, req?.user || req);
  }

  @Get('fee-invoices/:id/pdf')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Download or print Fee Invoice PDF payload' })
  getFeeInvoicePdf(@Param('id') id: string, @Req() req: any) {
    return this.feesService.getFeeInvoicePdf(id, req?.user || req);
  }

  @Get('fee-invoices/:id/audit-history')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get Fee Invoice audit history' })
  getFeeInvoiceAuditLogs(@Param('id') id: string, @Req() req: any) {
    return this.feesService.getFeeInvoiceAuditLogs(id, req?.user || req);
  }

  @Get('students/:studentId/fee-invoices')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get all Fee Invoices for a specific student' })
  getStudentFeeInvoicesByStudentId(@Param('studentId') studentId: string, @Req() req: any) {
    return this.feesService.getStudentFeeInvoicesByStudentId(studentId, req?.user || req);
  }

  // ── Backward Compatible / Legacy helper endpoints ────────────────────────────

  @Post('student-fees/accounts')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Create Student Fee Account' })
  createAccount(@Body() dto: CreateStudentFeeAccountDto, @Req() req: any) {
    return this.feesService.assignFeeStructure({
      feeStructureId: dto.feeStructureId,
      studentIds: [dto.studentId],
    }, req.user);
  }

  // ── Payments
  @Post('fee-payments')
  @RequirePermission('FEES', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a fee payment (generates receipt)' })
  recordPayment(@Body() dto: RecordPaymentDto, @Req() req: any) {
    return this.feesService.recordPayment(dto, req.user.id);
  }

  @Get('fee-payments/:feeAccountId')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get payment history for a fee account' })
  getPaymentHistory(@Param('feeAccountId') feeAccountId: string) {
    return this.feesService.getPaymentHistory(feeAccountId);
  }

  // ── Discounts / Scholarships
  @Post('fee-discounts')
  @RequirePermission('FEES', 'APPROVE')
  @ApiOperation({ summary: 'Apply discount/scholarship to a student fee account' })
  applyDiscount(@Body() dto: ApplyDiscountDto, @Req() req: any) {
    return this.feesService.applyDiscount(dto, req.user.id);
  }

  // ── Refunds
  @Post('fee-refunds')
  @RequirePermission('FEES', 'APPROVE')
  @ApiOperation({ summary: 'Create fee refund request' })
  createRefund(@Body() dto: CreateRefundDto) {
    return this.feesService.createRefund(dto);
  }

  // ── Reports
  @Get('fees/reports/dues')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get outstanding dues report' })
  getDuesReport() {
    return this.feesService.getDuesReport();
  }

  // ── Phase 9: Accounts & Bulk Assignment REST APIs ───────────────────────────

  @Post('accounts/fee-assignments/bulk/preview')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Preview bulk fee structure assignment' })
  previewBulkAssign(@Body() dto: any) {
    return this.feesService.previewBulkAssignFeeStructure(dto);
  }

  @Post('accounts/fee-assignments/bulk')
  @RequirePermission('FEES', 'CREATE')
  @ApiOperation({ summary: 'Execute bulk fee structure assignment' })
  executeBulkAssign(@Body() dto: any, @Req() req: any) {
    return this.feesService.executeBulkAssignFeeStructure(dto, req.user);
  }

  @Get('accounts/ledger/:studentId')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get financial ledger for student (Accounts Officer view)' })
  getStudentLedger(@Param('studentId') studentId: string, @Req() req: any) {
    return this.feesService.getStudentLedger(studentId, req.user);
  }

  @Get('student/my-ledger')
  @ApiOperation({ summary: 'Get student own financial ledger (Student Self-Service)' })
  getMyLedger(@Req() req: any) {
    return this.feesService.getStudentLedger(req.user.studentId || req.user.id, req.user);
  }

  @Post('accounts/concessions')
  @RequirePermission('FEES', 'APPROVE')
  @ApiOperation({ summary: 'Apply concession / scholarship / waiver' })
  createConcession(@Body() dto: any, @Req() req: any) {
    return this.feesService.createConcession(dto, req.user);
  }

  @Get('accounts/concessions')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List all student concessions and scholarships' })
  getConcessions(@Query() query: any) {
    return this.feesService.getConcessions(query);
  }

  @Get('accounts/refunds')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List all fee refunds' })
  getRefunds(@Query() query: any) {
    return this.feesService.getRefunds(query);
  }

  @Patch('accounts/refunds/:id/process')
  @RequirePermission('FEES', 'APPROVE')
  @ApiOperation({ summary: 'Process and complete fee refund' })
  processRefund(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.feesService.processRefund(id, dto, req.user);
  }

  @Get('accounts/reconciliation')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List payment reconciliations (Gateway vs ERP)' })
  getReconciliations(@Query() query: any) {
    return this.feesService.getPaymentReconciliations(query);
  }

  @Patch('accounts/reconciliation/:id')
  @RequirePermission('FEES', 'APPROVE')
  @ApiOperation({ summary: 'Reconcile or update reconciliation item' })
  reconcilePayment(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.feesService.reconcilePayment(id, dto, req.user);
  }

  @Get('accounts/dashboard-metrics')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get real-time financial KPI dashboard metrics' })
  getAccountsDashboardMetrics() {
    return this.feesService.getAccountsExecutiveDashboard();
  }

  @Get('accounts/reports')
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Generate 14 official accounts and finance reports' })
  getAccountsReports(@Query('reportType') reportType: string, @Query() filters: any) {
    return this.feesService.getAccountsReports(reportType, filters);
  }
}

