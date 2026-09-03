import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { RequireRole } from '../rbac/require-role.decorator';
import { RequireScope } from '../rbac/require-scope.decorator';

@ApiTags('Document Master & Student Academic Documents Repository')
@ApiBearerAuth()
@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ─── MASTER DATA ENDPOINTS ───────────────────────────────────────────────

  @Get('master')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List all Document Master definitions with filters' })
  async getAllMasterDocuments(
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('studentType') studentType?: string,
    @Query('required') required?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.documentsService.getAllMasterDocuments({
      category,
      subcategory,
      studentType,
      required,
      status,
      search
    });
  }

  @Get('master/:id')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'Get Document Master by ID' })
  async getMasterDocumentById(@Param('id') id: string) {
    return this.documentsService.getMasterDocumentById(id);
  }

  @Post('master')
  @RequireRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR')
  @RequirePermission('DOCUMENTS', 'CREATE')
  @ApiOperation({ summary: 'Create new Document Master definition' })
  async createMasterDocument(@Body() body: any) {
    return this.documentsService.createMasterDocument(body);
  }

  @Put('master/:id')
  @RequireRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR')
  @RequirePermission('DOCUMENTS', 'EDIT')
  @ApiOperation({ summary: 'Update Document Master definition' })
  async updateMasterDocument(@Param('id') id: string, @Body() body: any) {
    return this.documentsService.updateMasterDocument(id, body);
  }

  // ─── APPLICABILITY ENDPOINT ───────────────────────────────────────────────

  @Get('student/:studentId/applicable')
  @RequireScope('OWN')
  @ApiOperation({ summary: 'Get all applicable documents for a student (Domestic vs International resolution)' })
  async getApplicableDocumentsForStudent(@Param('studentId') studentId: string) {
    return this.documentsService.getApplicableDocumentsForStudent(studentId);
  }

  // ─── STUDENT UPLOAD & VERSIONING ENDPOINT ─────────────────────────────────

  @Post('student/:studentId/upload')
  @RequireScope('OWN')
  @ApiOperation({ summary: 'Student uploads document / new version (archives previous version)' })
  async uploadStudentDocument(
    @Param('studentId') studentId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    return this.documentsService.uploadStudentDocument({
      studentId,
      documentMasterId: body.documentMasterId,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      issueDate: body.issueDate,
      expiryDate: body.expiryDate,
      remarks: body.remarks,
      uploadedByUserId: req.user?.id || studentId,
      uploadedByName: req.user?.username || 'Student'
    });
  }

  // ─── VERIFICATION & LOCK WORKFLOW ENDPOINTS ───────────────────────────────

  @Post(':documentId/verify')
  @RequireRole('FACULTY', 'MENTOR', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR')
  @RequirePermission('DOCUMENTS', 'VERIFY')
  @ApiOperation({ summary: 'Verify and permanently LOCK student document' })
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    return this.documentsService.verifyDocument({
      documentId,
      verifierUserId: req.user?.id || 'admin',
      verifierName: req.user?.username || 'Verifier',
      verifierRole: req.user?.role || 'FACULTY_MENTOR',
      remarks: body.remarks
    });
  }

  @Post(':documentId/reject')
  @RequireRole('FACULTY', 'MENTOR', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR')
  @RequirePermission('DOCUMENTS', 'VERIFY')
  @ApiOperation({ summary: 'Reject student document with mandatory reason (unlocks for re-upload)' })
  async rejectDocument(
    @Param('documentId') documentId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    return this.documentsService.rejectDocument({
      documentId,
      verifierUserId: req.user?.id || 'admin',
      verifierName: req.user?.username || 'Verifier',
      verifierRole: req.user?.role || 'FACULTY_MENTOR',
      rejectionReason: body.rejectionReason,
      remarks: body.remarks
    });
  }
}
