import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateApprovalDto {
  agentId: string;
  executionId: string;
  resourceType: 'TIMETABLE_SUBSTITUTION' | 'DOCUMENT_VERIFICATION' | 'FEE_EMI_PLAN';
  resourceId: string;
  requestedData: Record<string, any>;
  assignedRole: 'HOD' | 'STUDENT_SECTION' | 'FINANCE_OFFICER' | 'PRINCIPAL';
  assignedUserId?: string;
  tenantId?: string;
}

export interface ResolveApprovalDto {
  approvalId: string;
  actionTakenBy: string;
  actionTakenRole: string;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

@Injectable()
export class AgentApprovalEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createApprovalTicket(dto: CreateApprovalDto) {
    return this.prisma.agentApproval.create({
      data: {
        agentId: dto.agentId,
        executionId: dto.executionId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        requestedData: dto.requestedData,
        assignedRole: dto.assignedRole,
        assignedUserId: dto.assignedUserId,
        tenantId: dto.tenantId || 'DEFAULT',
        status: 'PENDING',
      },
    });
  }

  async getPendingApprovals(role?: string, tenantId: string = 'DEFAULT') {
    return this.prisma.agentApproval.findMany({
      where: {
        status: 'PENDING',
        tenantId,
        ...(role ? { assignedRole: role } : {}),
      },
      include: {
        agent: true,
        execution: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveApprovalTicket(dto: ResolveApprovalDto) {
    const ticket = await this.prisma.agentApproval.findUnique({
      where: { id: dto.approvalId },
    });

    if (!ticket) {
      throw new NotFoundException(`Approval ticket '${dto.approvalId}' not found.`);
    }

    const updated = await this.prisma.agentApproval.update({
      where: { id: dto.approvalId },
      data: {
        status: dto.decision,
        decisionReason: dto.reason || (dto.decision === 'APPROVED' ? 'Approved by authorized officer' : 'Rejected by authorized officer'),
        actionTakenBy: dto.actionTakenBy,
        actionTakenAt: new Date(),
      },
    });

    return updated;
  }
}
