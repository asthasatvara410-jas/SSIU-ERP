import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NaacService {
  constructor(private readonly prisma: PrismaService) {}

  // ── NAAC Criteria & Metrics ────────────────────────────────────────────────

  async getCriteria() {
    return this.prisma.nAACCriterion.findMany({
      include: { metrics: true },
      orderBy: { criterionNumber: 'asc' },
    });
  }

  async createCriterion(criterionNumber: number, title: string, description?: string, weightage: number = 100) {
    return this.prisma.nAACCriterion.create({
      data: { criterionNumber, title, description, weightage },
    });
  }

  async createMetric(criterionId: string, metricNumber: string, name: string, description?: string, metricType: string = 'QUANTITATIVE', weightage: number = 10) {
    return this.prisma.nAACMetric.create({
      data: { criterionId, metricNumber, name, description, metricType, weightage },
    });
  }

  // ── NAAC Metric Data & Evidence ──────────────────────────────────────────

  async submitMetricData(metricId: string, academicYear: string, dataValue: string, userId: string, instituteId?: string, departmentId?: string) {
    const metric = await this.prisma.nAACMetric.findUnique({ where: { id: metricId } });
    if (!metric) throw new NotFoundException('NAAC metric not found.');

    return this.prisma.nAACMetricData.create({
      data: {
        metricId,
        academicYear,
        dataValue,
        submittedBy: userId,
        instituteId,
        departmentId,
        status: 'SUBMITTED',
      },
      include: { metric: { include: { criterion: true } }, evidences: true },
    });
  }

  async getMetricData(academicYear?: string, status?: string) {
    return this.prisma.nAACMetricData.findMany({
      where: {
        ...(academicYear ? { academicYear } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      include: { metric: { include: { criterion: true } }, evidences: true },
      orderBy: { academicYear: 'desc' },
    });
  }

  async verifyMetricData(id: string, status: string, verifierUserId: string) {
    const dataEntry = await this.prisma.nAACMetricData.findUnique({ where: { id } });
    if (!dataEntry) throw new NotFoundException('Metric data entry not found.');

    return this.prisma.nAACMetricData.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });
  }

  async uploadEvidence(metricDataId: string, documentTitle: string, documentUrl: string, userId: string) {
    const dataEntry = await this.prisma.nAACMetricData.findUnique({ where: { id: metricDataId } });
    if (!dataEntry) throw new NotFoundException('Metric data entry not found.');
    if (dataEntry.status === 'APPROVED') throw new BadRequestException('Data entry is locked and approved; no further evidence modifications allowed.');

    return this.prisma.nAACEvidence.create({
      data: {
        metricDataId,
        documentTitle,
        documentUrl,
        uploadedBy: userId,
        status: 'UPLOADED',
      },
    });
  }
}
