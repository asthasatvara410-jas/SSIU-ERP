import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResearchApprovalActionDto } from './dto/research.dto';

@Injectable()
export class ResearchApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async submitForReview(entityType: 'PUBLICATION' | 'PATENT' | 'PROJECT', entityId: string, tenantId: string, actorId: string) {
    if (entityType === 'PUBLICATION') {
      await this.prisma.publication.update({
        where: { id: entityId },
        data: { approvalStatus: 'UNDER_REVIEW' },
      });
    } else if (entityType === 'PATENT') {
      await this.prisma.patent.update({
        where: { id: entityId },
        data: { approvalStatus: 'UNDER_REVIEW' },
      });
    }

    return this.prisma.researchApprovalAction.create({
      data: {
        tenantId,
        entityType,
        entityId,
        actorId,
        actorRole: 'RESEARCHER',
        action: 'SUBMITTED',
        comment: 'Submitted for HOD / Research Cell verification.',
        ...(entityType === 'PUBLICATION' ? { publicationId: entityId } : {}),
        ...(entityType === 'PATENT' ? { patentId: entityId } : {}),
      },
    });
  }

  async processApproval(
    entityType: 'PUBLICATION' | 'PATENT' | 'PROJECT',
    entityId: string,
    dto: ResearchApprovalActionDto,
    tenantId: string,
    actorId: string,
    actorRole: string = 'HOD',
  ) {
    const nextStatus = dto.action === 'APPROVED' ? 'APPROVED' : dto.action === 'REJECTED' ? 'REJECTED' : 'CHANGES_REQUESTED';

    if (entityType === 'PUBLICATION') {
      await this.prisma.publication.update({
        where: { id: entityId },
        data: { approvalStatus: nextStatus },
      });
    } else if (entityType === 'PATENT') {
      await this.prisma.patent.update({
        where: { id: entityId },
        data: { approvalStatus: nextStatus },
      });
    }

    return this.prisma.researchApprovalAction.create({
      data: {
        tenantId,
        entityType,
        entityId,
        actorId,
        actorRole,
        action: dto.action,
        comment: dto.comment || null,
        ...(entityType === 'PUBLICATION' ? { publicationId: entityId } : {}),
        ...(entityType === 'PATENT' ? { patentId: entityId } : {}),
      },
    });
  }
}
