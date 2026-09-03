import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnonymousComplaintService } from './anonymous-complaint.service';
import { CreateComplaintDto } from './dto/grievance.dto';

@Injectable()
export class AntiRaggingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anonService: AnonymousComplaintService,
  ) {}

  async reportIncident(dto: CreateComplaintDto, tenantId: string, studentId?: string) {
    dto.category = 'ANTI_RAGGING';
    dto.priority = 'CRITICAL';
    return this.anonService.createComplaint(dto, tenantId, studentId);
  }

  async getDashboardSummary(tenantId: string) {
    const cases = await this.prisma.grievanceCase.findMany({
      where: { category: 'ANTI_RAGGING', tenantId },
    });

    return {
      totalCases: cases.length,
      openCases: cases.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length,
      escalatedCases: cases.filter(c => c.status === 'ESCALATED').length,
      resolvedCases: cases.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
      committee: 'SSIU Anti-Ragging Committee & Squad',
      tollFreeHelpline: '1800-180-5522 (National Anti-Ragging Helpline)',
    };
  }
}
