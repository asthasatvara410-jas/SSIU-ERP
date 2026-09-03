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
import { NoteSheetService } from './notesheet.service';
import { CreateNoteSheetDto } from './dto/create-notesheet.dto';
import { UpdateNoteSheetDto } from './dto/update-notesheet.dto';
import {
  SubmitNoteSheetDto,
  ApproveNoteSheetDto,
  RejectNoteSheetDto,
  ReturnNoteSheetDto,
  CloseNoteSheetDto,
} from './dto/notesheet-action.dto';
import { NoteSheetQueryDto } from './dto/notesheet-query.dto';
import { AddNoteSheetAttachmentDto } from './dto/add-attachment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Centralized University Notesheet Engine')
@ApiBearerAuth()
@Controller('api/v1/notesheets')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NoteSheetController {
  constructor(private readonly noteSheetService: NoteSheetService) {}

  /**
   * POST /api/v1/notesheets
   * Create a new Notesheet (Draft or Submitted)
   */
  @Post()
  @RequirePermission('NOTESHEET', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new departmental Notesheet (Draft or Submitted)' })
  createNoteSheet(@Body() dto: CreateNoteSheetDto, @Req() req: any) {
    return this.noteSheetService.createNoteSheet(dto, req.user);
  }

  /**
   * GET /api/v1/notesheets
   * List Notesheets with department scoping, filters, search, and pagination
   */
  @Get()
  @RequirePermission('NOTESHEET', 'VIEW')
  @ApiOperation({ summary: 'List Notesheets with department-scoping, search, and status filters' })
  getNoteSheets(@Query() query: NoteSheetQueryDto, @Req() req: any) {
    return this.noteSheetService.getNoteSheets(query, req.user);
  }

  /**
   * GET /api/v1/notesheets/pending-with-me
   * Get actionable Notesheets currently assigned to the authenticated authority with server-side pagination & search
   */
  @Get('pending-with-me')
  @RequirePermission('NOTESHEET', 'REVIEW')
  @ApiOperation({ summary: 'Get actionable Notesheets currently assigned to the authenticated authority' })
  getPendingWithMe(@Query() query: NoteSheetQueryDto, @Req() req: any) {
    return this.noteSheetService.getPendingWithMe(query, req.user);
  }

  /**
   * GET /api/v1/notesheets/pending-with-me/count
   * Get total count of actionable Notesheets currently assigned to the authenticated authority
   */
  @Get('pending-with-me/count')
  @RequirePermission('NOTESHEET', 'REVIEW')
  @ApiOperation({ summary: 'Get count of actionable Notesheets currently assigned to the authenticated authority' })
  getPendingWithMeCount(@Query() query: NoteSheetQueryDto, @Req() req: any) {
    return this.noteSheetService.getPendingWithMeCount(query, req.user);
  }

  /**
   * GET /api/v1/notesheets/dashboard/stats
   * Get role-scoped KPI summary statistics for the Notesheet module
   */
  @Get('dashboard/stats')
  @RequirePermission('NOTESHEET', 'VIEW')
  @ApiOperation({ summary: 'Get department and role-scoped Notesheet KPI summary statistics' })
  getDashboardStats(@Req() req: any) {
    return this.noteSheetService.getDashboardStats(req.user);
  }

  /**
   * GET /api/v1/notesheets/verify/:tokenOrId
   * Public QR code verification endpoint (no sensitive internal information exposed)
   */
  @Get('verify/:tokenOrId')
  @ApiOperation({ summary: 'Verify authentic Notesheet by unique QR token or number' })
  verifyNotesheet(@Param('tokenOrId') tokenOrId: string) {
    return this.noteSheetService.verifyNotesheet(tokenOrId);
  }

  /**
   * GET /api/v1/notesheets/:id
   * Get single Notesheet by ID (with department access security check)
   */
  @Get(':id')
  @RequirePermission('NOTESHEET', 'VIEW')
  @ApiOperation({ summary: 'Get full Notesheet details, estimate items, attachments, and history' })
  getNoteSheetById(@Param('id') id: string, @Req() req: any) {
    return this.noteSheetService.getNoteSheetById(id, req.user);
  }

  /**
   * PATCH /api/v1/notesheets/:id
   * Edit an existing DRAFT or RETURNED Notesheet
   */
  @Patch(':id')
  @RequirePermission('NOTESHEET', 'EDIT')
  @ApiOperation({ summary: 'Edit a DRAFT or RETURNED Notesheet' })
  updateNoteSheet(
    @Param('id') id: string,
    @Body() dto: UpdateNoteSheetDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.updateNoteSheet(id, dto, req.user);
  }

  /**
   * POST /api/v1/notesheets/:id/submit
   * Submit a DRAFT or RETURNED Notesheet to the approval workflow
   */
  @Post(':id/submit')
  @RequirePermission('NOTESHEET', 'SUBMIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit Notesheet to the departmental approval workflow' })
  submitNoteSheet(
    @Param('id') id: string,
    @Body() dto: SubmitNoteSheetDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.submitNoteSheet(id, dto, req.user);
  }

  /**
   * POST /api/v1/notesheets/:id/approve
   * Approve or forward Notesheet along the approval hierarchy
   */
  @Post(':id/approve')
  @RequirePermission('NOTESHEET', 'APPROVE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or forward a Notesheet along the approval workflow' })
  approveNoteSheet(
    @Param('id') id: string,
    @Body() dto: ApproveNoteSheetDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.approveNoteSheet(id, dto, req.user);
  }

  /**
   * POST /api/v1/notesheets/:id/reject
   * Reject Notesheet with mandatory rejection reason
   */
  @Post(':id/reject')
  @RequirePermission('NOTESHEET', 'REJECT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a Notesheet (mandatory rejection reason required)' })
  rejectNoteSheet(
    @Param('id') id: string,
    @Body() dto: RejectNoteSheetDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.rejectNoteSheet(id, dto, req.user);
  }

  /**
   * POST /api/v1/notesheets/:id/return
   * Return Notesheet for correction with mandatory return reason
   */
  @Post(':id/return')
  @RequirePermission('NOTESHEET', 'RETURN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return Notesheet for correction with mandatory reason' })
  returnNoteSheet(
    @Param('id') id: string,
    @Body() dto: ReturnNoteSheetDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.returnNoteSheet(id, dto, req.user);
  }

  /**
   * POST /api/v1/notesheets/:id/close
   * Close and archive an APPROVED Notesheet
   */
  @Post(':id/close')
  @RequirePermission('NOTESHEET', 'CLOSE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close and archive an APPROVED Notesheet' })
  closeNoteSheet(
    @Param('id') id: string,
    @Body() dto: CloseNoteSheetDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.closeNoteSheet(id, dto, req.user);
  }

  /**
   * GET /api/v1/notesheets/:id/history
   * Get movement and decision audit trail
   */
  @Get(':id/history')
  @RequirePermission('NOTESHEET', 'VIEW')
  @ApiOperation({ summary: 'Get full action and movement history for a Notesheet' })
  getNoteSheetHistory(@Param('id') id: string, @Req() req: any) {
    return this.noteSheetService.getNoteSheetHistory(id, req.user);
  }

  /**
   * POST /api/v1/notesheets/:id/attachments
   * Upload and attach supporting documents (PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG)
   */
  @Post(':id/attachments')
  @RequirePermission('NOTESHEET', 'EDIT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Attach supporting documents (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)' })
  addAttachment(
    @Param('id') id: string,
    @Body() dto: AddNoteSheetAttachmentDto,
    @Req() req: any,
  ) {
    return this.noteSheetService.addAttachment(id, dto, req.user);
  }
}
