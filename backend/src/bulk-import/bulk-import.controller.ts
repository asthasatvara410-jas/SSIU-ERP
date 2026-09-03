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
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BulkImportService } from './bulk-import.service';
import {
  UploadBulkImportDto,
  ValidateBulkImportDto,
  ConfirmBulkImportDto,
  BulkImportFilterDto,
} from './dto/bulk-import.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequireRole } from '../rbac/require-role.decorator';
import { RateLimit } from '../common/decorators/rate-limit.decorator';

@ApiTags('Centralized Bulk Excel Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'ERP_COORDINATOR', 'REGISTRAR', 'DEPUTY_REGISTRAR')
@Controller(['api/v1/bulk-import', 'bulk-import'])
export class BulkImportController {
  constructor(private readonly bulkImportService: BulkImportService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available Excel templates authorized for current user' })
  getTemplates(@Req() req: any) {
    return this.bulkImportService.getTemplates(req.user);
  }

  @Get('templates/:type')
  @ApiOperation({ summary: 'Download structured Excel template with instructions' })
  async downloadTemplate(
    @Param('type') type: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { fileName, buffer } = this.bulkImportService.getTemplateFile(type, req.user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  }

  @Post('upload')
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'bulk:upload' })
  @ApiOperation({ summary: 'Upload spreadsheet / raw rows for staging and validation' })
  uploadFile(@Body() dto: UploadBulkImportDto, @Req() req: any) {
    return this.bulkImportService.uploadFile(dto, req.user);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Re-run or validate staged rows with specified mode (INSERT_ONLY / UPSERT)' })
  validateImport(
    @Param('id') id: string,
    @Body() dto: ValidateBulkImportDto,
    @Req() req: any,
  ) {
    return this.bulkImportService.validateImport(id, dto, req.user);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get validation preview with paginated rows and error notes' })
  getPreview(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: any,
  ) {
    return this.bulkImportService.getImportPreview(id, page, limit, req.user);
  }

  @Post(':id/confirm')
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'bulk:confirm' })
  @ApiOperation({ summary: 'Confirm and execute transactional commit of valid rows' })
  confirmImport(
    @Param('id') id: string,
    @Body() dto: ConfirmBulkImportDto,
    @Req() req: any,
  ) {
    return this.bulkImportService.confirmImport(id, dto, req.user);
  }

  @Get(':id/error-report')
  @ApiOperation({ summary: 'Download Excel error report containing rejected rows and error reasons' })
  async downloadErrorReport(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { fileName, buffer } = await this.bulkImportService.getErrorReportFile(id, req.user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated audit list of past bulk imports' })
  getHistory(@Query() filter: BulkImportFilterDto, @Req() req: any) {
    return this.bulkImportService.getImportHistory(filter, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single bulk import session summary and audit trail' })
  getDetails(@Param('id') id: string, @Req() req: any) {
    return this.bulkImportService.getImportDetails(id, req.user);
  }
}
