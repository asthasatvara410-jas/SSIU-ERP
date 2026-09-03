import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccreditationMetricService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves full 5-year trend and source traceability for a metric.
   */
  async getMetricDetails(metricId: string, tenantId: string) {
    const metric = await this.prisma.accreditationMetric.findUnique({
      where: { id: metricId },
      include: {
        criterion: { include: { framework: true } },
        aggregatedValues: {
          where: { tenantId },
          orderBy: { academicYear: 'asc' },
        },
        evidences: {
          where: { tenantId },
        },
      },
    });

    if (!metric) {
      throw new BadRequestException(`Metric ${metricId} not found.`);
    }

    return {
      metric: {
        id: metric.id,
        code: metric.code,
        name: metric.name,
        description: metric.description,
        formula: metric.formula,
        unit: metric.unit,
        sourceModule: metric.sourceModule,
        calculationMethod: metric.calculationMethod,
      },
      criterion: {
        code: metric.criterion.code,
        title: metric.criterion.title,
        framework: metric.criterion.framework.name,
      },
      fiveYearTrend: metric.aggregatedValues.map(v => ({
        academicYear: v.academicYear,
        value: v.value,
        status: v.status,
        sourceRecordCount: v.sourceRecordCount,
        sourceRecordReference: v.sourceRecordReference,
      })),
      evidences: metric.evidences.map(e => ({
        id: e.id,
        title: e.title,
        evidenceType: e.evidenceType,
        status: e.status,
        verifiedBy: e.verifiedBy,
      })),
    };
  }
}
