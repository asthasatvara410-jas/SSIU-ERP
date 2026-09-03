import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrievanceReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAnnualReport(tenantId: string) {
    const cases = await this.prisma.grievanceCase.findMany({
      where: { tenantId },
    });

    const nonICC = cases.filter(c => c.category !== 'SEXUAL_HARASSMENT');

    const total = nonICC.length;
    const resolved = nonICC.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const escalated = nonICC.filter(c => c.status === 'ESCALATED').length;
    const antiRaggingCount = nonICC.filter(c => c.category === 'ANTI_RAGGING').length;

    return {
      reportType: 'UGC_ANNUAL_GRIEVANCE_REPORT',
      totalGrievancesReceived: total,
      totalGrievancesRedressed: resolved,
      escalatedCases: escalated,
      antiRaggingCases: antiRaggingCount,
      slaComplianceRate: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(2)) : 100.0,
      generatedAt: new Date().toISOString(),
      confidentialityNotice: 'ICC Sexual Harassment cases are sequestered into separate authorized reports.',
    };
  }
}
