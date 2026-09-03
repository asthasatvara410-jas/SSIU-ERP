import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignComplaintDto } from './dto/grievance.dto';

@Injectable()
export class CaseAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async assignCase(caseId: string, dto: AssignComplaintDto, user: any, tenantId: string) {
    const grievanceCase = await this.prisma.grievanceCase.findFirst({
      where: { id: caseId, tenantId },
    });
    if (!grievanceCase) throw new BadRequestException('Grievance case not found.');

    const assignment = await this.prisma.caseAssignment.create({
      data: {
        tenantId,
        caseId,
        committeeId: dto.committeeId || null,
        assignedTo: dto.assigneeId || null,
        assignedBy: user?.id || user?.email || 'ADMIN',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        status: 'ASSIGNED',
      },
    });

    await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: {
        status: 'ASSIGNED',
        currentAssigneeId: dto.assigneeId || null,
        currentCommitteeId: dto.committeeId || null,
      },
    });

    return assignment;
  }
}
