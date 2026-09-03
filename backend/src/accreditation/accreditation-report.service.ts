import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccreditationSnapshotService } from './services/accreditation-snapshot.service';
import { AccreditationExportService } from './services/accreditation-export.service';
import { GenerateReportDto } from './dto/accreditation.dto';

@Injectable()
export class AccreditationReportService {
  private readonly logger = new Logger(AccreditationReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotService: AccreditationSnapshotService,
    private readonly exportService: AccreditationExportService,
  ) {}

  /**
   * Generates a complete 5-year NAAC or NBA Self-Study Report (SSR/SAR) snapshot with live ERP data.
   */
  async generateReport(dto: GenerateReportDto, tenantId: string, user: any) {
    const report = await this.snapshotService.generateSnapshot(dto, tenantId, user);

    // Create an associated completed report job
    const job = await this.prisma.accreditationReportJob.create({
      data: {
        tenantId,
        reportId: report.id,
        status: 'COMPLETED',
        progress: 100,
        outputFormat: dto.outputFormat || 'PDF',
      },
    });

    return {
      report,
      job,
      message: `${report.framework} accreditation snapshot generated successfully with SHA-256 seal.`,
    };
  }

  /**
   * Finalizes and seals an accreditation report, making it permanently immutable.
   */
  async finalizeReport(reportId: string, tenantId: string, user: any) {
    return this.snapshotService.finalizeAndSealReport(reportId, tenantId, user);
  }

  /**
   * Validates the cryptographic integrity of a stored snapshot against its canonical SHA-256 hash.
   */
  async verifyIntegrity(reportId: string, tenantId: string, user?: any) {
    return this.snapshotService.verifySnapshotIntegrity(reportId, tenantId, user);
  }

  /**
   * Exports the sealed accreditation snapshot in the requested format (JSON, EXCEL, or HTML/PDF).
   */
  async exportReport(reportId: string, tenantId: string, format: 'JSON' | 'EXCEL' | 'PDF' | 'HTML' = 'JSON', user?: any) {
    const report = await this.snapshotService.getReportById(reportId, tenantId, user);

    const fmt = format.toUpperCase();
    if (fmt === 'EXCEL' || fmt === 'XLSX') {
      const buffer = this.exportService.exportExcelBuffer(report);
      return {
        format: 'EXCEL',
        fileName: `${report.reportId}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        data: buffer,
      };
    }

    if (fmt === 'HTML' || fmt === 'PDF') {
      const html = this.exportService.exportHtml(report);
      return {
        format: 'HTML',
        fileName: `${report.reportId}.html`,
        contentType: 'text/html',
        data: html,
      };
    }

    // Default: JSON
    const json = this.exportService.exportJson(report);
    return {
      format: 'JSON',
      fileName: `${report.reportId}.json`,
      contentType: 'application/json',
      data: json,
    };
  }

  /**
   * Retrieves single report by ID.
   */
  async getReportById(reportId: string, tenantId: string, user?: any) {
    return this.snapshotService.getReportById(reportId, tenantId, user);
  }

  /**
   * Lists all historical reports.
   */
  async listReports(framework?: string, tenantId?: string, user?: any) {
    return this.snapshotService.listReports(framework, tenantId, user);
  }
}
