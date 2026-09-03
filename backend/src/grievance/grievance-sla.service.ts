import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrievanceSLAService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateDeadline(caseType: string, priority: string, tenantId: string): Promise<Date> {
    const config = await this.prisma.grievanceSLAConfig.findFirst({
      where: { caseType, priority, tenantId, active: true },
    });

    const resolutionHours = config?.resolutionHours ?? (priority === 'CRITICAL' ? 24 : 168);
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + resolutionHours);
    return deadline;
  }

  async checkOverdueCases(tenantId: string) {
    const now = new Date();
    return this.prisma.grievanceCase.findMany({
      where: {
        tenantId,
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
        escalationDeadline: { lt: now },
      },
      orderBy: { escalationDeadline: 'asc' },
    });
  }
}
