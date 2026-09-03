import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestigationDto, CreateActionPlanDto } from './dto/grievance.dto';

@Injectable()
export class InvestigationService {
  constructor(private readonly prisma: PrismaService) {}

  async startInvestigation(caseId: string, dto: CreateInvestigationDto, tenantId: string) {
    const grievanceCase = await this.prisma.grievanceCase.findFirst({
      where: { id: caseId, tenantId },
    });
    if (!grievanceCase) throw new BadRequestException('Case not found.');

    const investigation = await this.prisma.investigation.create({
      data: {
        tenantId,
        caseId,
        investigatorId: dto.investigatorId,
        findings: dto.findings || null,
        recommendation: dto.recommendation || null,
        status: 'IN_PROGRESS',
      },
    });

    await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: { status: 'UNDER_REVIEW' },
    });

    return investigation;
  }

  async addActionPlan(caseId: string, dto: CreateActionPlanDto, tenantId: string) {
    return this.prisma.caseAction.create({
      data: {
        tenantId,
        caseId,
        actionType: dto.actionType,
        description: dto.description,
        assignedTo: dto.assignedTo || null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        status: 'PENDING',
      },
    });
  }
}
