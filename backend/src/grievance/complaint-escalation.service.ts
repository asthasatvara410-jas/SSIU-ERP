import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplaintEscalationService {
  private readonly logger = new Logger(ComplaintEscalationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Escalates overdue open grievance cases.
   */
  async runAutoEscalationJob(tenantId: string = 'DEFAULT') {
    const now = new Date();

    // Find open cases where deadline is past and status is not resolved/closed/rejected
    const overdueCases = await this.prisma.grievanceCase.findMany({
      where: {
        tenantId,
        status: { in: ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'UNDER_REVIEW'] },
        escalationDeadline: { lte: now },
      },
    });

    const escalatedCases: any[] = [];

    for (const c of overdueCases) {
      const nextLevel = c.escalationLevel + 1;
      const nextAuthority = nextLevel === 1 ? 'REGISTRAR' : 'VICE_CHANCELLOR';

      const updated = await this.prisma.grievanceCase.update({
        where: { id: c.id },
        data: {
          status: 'ESCALATED',
          escalationLevel: nextLevel,
          currentAssigneeId: nextAuthority,
        },
      });

      await this.prisma.grievanceCaseEvent.create({
        data: {
          tenantId,
          caseId: c.id,
          eventType: 'ESCALATED',
          title: `Auto-Escalated to Level ${nextLevel} (${nextAuthority})`,
          details: `Resolution SLA exceeded (Deadline: ${c.escalationDeadline?.toISOString().split('T')[0]}). Automatically escalated to ${nextAuthority}.`,
        },
      });

      escalatedCases.push(updated);
    }

    return {
      evaluatedCases: overdueCases.length,
      escalatedCasesCount: escalatedCases.length,
      timestamp: new Date().toISOString(),
    };
  }

  async processAutomaticEscalation(tenantId: string = 'DEFAULT') {
    return this.runAutoEscalationJob(tenantId);
  }

  /**
   * Manual escalation trigger by an authorized officer.
   */
  async manualEscalate(caseId: string, reason: string, tenantId: string, actorId?: string) {
    const caseRecord = await this.prisma.grievanceCase.findFirst({ where: { id: caseId, tenantId } });
    if (!caseRecord) throw new Error('Case not found.');

    const nextLevel = caseRecord.escalationLevel + 1;
    const nextAuthority = nextLevel === 1 ? 'REGISTRAR' : 'VICE_CHANCELLOR';

    const updated = await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: {
        status: 'ESCALATED',
        escalationLevel: nextLevel,
        currentAssigneeId: nextAuthority,
      },
    });

    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId,
        eventType: 'ESCALATED',
        actorId,
        title: `Manually Escalated to Level ${nextLevel}`,
        details: reason,
      },
    });

    return updated;
  }
}
