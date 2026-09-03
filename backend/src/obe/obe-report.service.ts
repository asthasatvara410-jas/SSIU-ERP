import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateOBEReportDto } from './dto/obe.dto';

@Injectable()
export class OBEReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(dto: GenerateOBEReportDto, tenantId: string, actorId: string) {
    const reportId = `REP-OBE-${Date.now().toString().slice(-6)}`;
    const snapshot = {
      reportId,
      reportType: dto.reportType,
      courseId: dto.courseId,
      programId: dto.programId,
      academicYear: dto.academicYear || '2025-26',
      generatedBy: actorId,
      generatedAt: new Date().toISOString(),
      institution: 'Swarrnim Startup & Innovation University',
    };

    const report = await this.prisma.oBEReport.create({
      data: {
        tenantId,
        reportId,
        reportType: dto.reportType,
        courseId: dto.courseId || null,
        programId: dto.programId || null,
        academicYear: dto.academicYear || '2025-26',
        status: 'GENERATED',
        generatedBy: actorId,
        snapshotData: snapshot,
      },
    });

    return {
      success: true,
      report,
      message: `OBE ${dto.reportType} Report ${reportId} successfully generated.`,
    };
  }

  async listReports(reportType?: string, tenantId?: string) {
    return this.prisma.oBEReport.findMany({
      where: {
        ...(reportType ? { reportType } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportById(id: string, tenantId: string) {
    const rep = await this.prisma.oBEReport.findFirst({
      where: {
        OR: [{ id }, { reportId: id }],
        tenantId,
      },
    });

    if (!rep) {
      throw new BadRequestException(`OBE Report ${id} not found.`);
    }

    return rep;
  }
}
