import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnonymousComplaintService } from './anonymous-complaint.service';
import { CreateComplaintDto } from './dto/grievance.dto';

@Injectable()
export class ICCService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anonService: AnonymousComplaintService,
  ) {}

  async reportCase(dto: CreateComplaintDto, tenantId: string, studentId?: string) {
    dto.category = 'SEXUAL_HARASSMENT';
    dto.priority = 'CRITICAL';
    return this.anonService.createComplaint(dto, tenantId, studentId);
  }

  async getDashboardSummary(tenantId: string) {
    const cases = await this.prisma.grievanceCase.findMany({
      where: {
        category: { in: ['SEXUAL_HARASSMENT', 'HARASSMENT', 'DISCRIMINATION'] },
        tenantId,
      },
    });

    return {
      totalCases: cases.length,
      openCases: cases.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length,
      resolvedCases: cases.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
      committee: 'Internal Complaints Committee (ICC) - SSIU Campus',
      presidingOfficer: 'Dr. Neha Patel (Presiding Officer, ICC)',
    };
  }
}
