import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrantUtilizationService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateUtilization(grantId: string, tenantId: string) {
    const grant = await this.prisma.grant.findFirst({
      where: { id: grantId, tenantId },
      include: {
        fundReleases: true,
        expenses: true,
      },
    });

    if (!grant) throw new BadRequestException(`Grant ${grantId} not found.`);

    const sanctionedAmount = Number(grant.sanctionedAmount || 0);
    const releasedAmount = grant.fundReleases
      .filter(r => r.status === 'RELEASED')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const verifiedExpense = grant.expenses
      .filter(e => e.verificationStatus === 'VERIFIED')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const unverifiedExpense = grant.expenses
      .filter(e => e.verificationStatus === 'PENDING')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const remainingAmount = Math.max(0, releasedAmount - verifiedExpense);
    const utilizationPercentage = releasedAmount > 0 ? (verifiedExpense / releasedAmount) * 100 : 0;

    return {
      grantId,
      grantCode: grant.grantCode,
      sanctionedAmount,
      releasedAmount,
      verifiedExpense,
      unverifiedExpense,
      remainingAmount,
      utilizationPercentage: Number(utilizationPercentage.toFixed(2)),
      thresholdStatus:
        utilizationPercentage >= 100 ? 'EXHAUSTED' : utilizationPercentage >= 90 ? 'CRITICAL' : utilizationPercentage >= 75 ? 'HIGH' : 'NORMAL',
    };
  }

  async generateUtilizationCertificate(grantId: string, preparedBy: string, tenantId: string) {
    const util = await this.calculateUtilization(grantId, tenantId);
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), 3, 1); // 1st April
    const periodEnd = now;

    return this.prisma.grantUtilizationRecord.create({
      data: {
        tenantId,
        grantId,
        periodStart,
        periodEnd,
        releasedAmount: util.releasedAmount,
        verifiedExpense: util.verifiedExpense,
        remainingAmount: util.remainingAmount,
        utilizationPercentage: util.utilizationPercentage,
        preparedBy,
        status: 'PREPARED',
      },
    });
  }
}
