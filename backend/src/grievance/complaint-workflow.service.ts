import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignComplaintDto, ResolveComplaintDto, AddInternalNoteDto } from './dto/grievance.dto';

@Injectable()
export class ComplaintWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async acknowledgeCase(caseId: string, tenantId: string, actorId?: string) {
    const caseRecord = await this.prisma.grievanceCase.findFirst({ where: { id: caseId, tenantId } });
    if (!caseRecord) throw new BadRequestException(`Case ${caseId} not found.`);

    const updated = await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: { status: 'ACKNOWLEDGED' },
    });

    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId,
        eventType: 'ACKNOWLEDGED',
        actorId,
        title: 'Case Acknowledged',
        details: 'Grievance cell has acknowledged receipt of this complaint.',
      },
    });

    return updated;
  }

  async assignCase(caseId: string, dto: AssignComplaintDto, tenantId: string, actorId?: string) {
    const caseRecord = await this.prisma.grievanceCase.findFirst({ where: { id: caseId, tenantId } });
    if (!caseRecord) throw new BadRequestException(`Case ${caseId} not found.`);

    const updated = await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: {
        status: 'ASSIGNED',
        currentAssigneeId: dto.assigneeId || null,
        currentCommitteeId: dto.committeeId || null,
      },
    });

    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId,
        eventType: 'ASSIGNED',
        actorId,
        title: 'Assigned to Committee / Officer',
        details: `Case assigned for formal inquiry.`,
      },
    });

    return updated;
  }

  async addInternalNote(caseId: string, dto: AddInternalNoteDto, tenantId: string, authorId: string, authorRole: string) {
    return this.prisma.grievanceInternalNote.create({
      data: {
        tenantId,
        caseId,
        authorId,
        authorRole,
        note: dto.note,
      },
    });
  }

  async resolveCase(caseId: string, dto: ResolveComplaintDto, tenantId: string, actorId?: string) {
    const caseRecord = await this.prisma.grievanceCase.findFirst({ where: { id: caseId, tenantId } });
    if (!caseRecord) throw new BadRequestException(`Case ${caseId} not found.`);

    const summaryText = dto.summary || (dto as any).resolutionSummary || 'Case resolved.';

    const updated = await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: {
        status: 'RESOLVED',
        resolutionSummary: summaryText,
        closedAt: new Date(),
      },
    });

    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId,
        eventType: 'RESOLVED',
        actorId,
        title: 'Grievance Resolved',
        details: summaryText,
      },
    });

    return updated;
  }

  async updateStatus(caseId: string, status: string, remarks: string | undefined, tenantId: string, actorId?: string) {
    const caseRecord = await this.prisma.grievanceCase.findFirst({ where: { id: caseId, tenantId } });
    if (!caseRecord) throw new BadRequestException(`Case ${caseId} not found.`);

    const validStatuses = [
      'SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ASSIGNED',
      'IN_PROGRESS', 'ACTION_REQUIRED', 'ESCALATED', 'RESOLVED',
      'CLOSED', 'REJECTED', 'DUPLICATE'
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid grievance status transition: ${status}`);
    }

    const updated = await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: {
        status,
        ...(status === 'RESOLVED' || status === 'CLOSED' ? { closedAt: new Date(), ...(remarks ? { resolutionSummary: remarks } : {}) } : {}),
      },
    });

    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId,
        eventType: status,
        actorId,
        title: `Status Changed to ${status.replace(/_/g, ' ')}`,
        details: remarks || `Status transitioned to ${status}.`,
      },
    });

    return updated;
  }

  async closeCase(caseId: string, tenantId: string, actorId?: string) {
    const updated = await this.prisma.grievanceCase.update({
      where: { id: caseId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId,
        eventType: 'CLOSED',
        actorId,
        title: 'Case Closed',
        details: 'Grievance case formally closed.',
      },
    });

    return updated;
  }
}
