import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommitteeDto, AddCommitteeMemberDto } from './dto/grievance.dto';

@Injectable()
export class CommitteeService {
  constructor(private readonly prisma: PrismaService) {}

  async listCommittees(tenantId: string, type?: string) {
    return this.prisma.grievanceCommittee.findMany({
      where: {
        tenantId,
        ...(type ? { type } : {}),
      },
      include: {
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCommittee(dto: CreateCommitteeDto, tenantId: string) {
    return this.prisma.grievanceCommittee.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        description: dto.description || null,
        status: 'ACTIVE',
      },
    });
  }

  async addMember(committeeId: string, dto: AddCommitteeMemberDto, tenantId: string) {
    const committee = await this.prisma.grievanceCommittee.findFirst({
      where: { id: committeeId, tenantId },
    });
    if (!committee) throw new BadRequestException('Committee not found.');

    return this.prisma.grievanceCommitteeMember.create({
      data: {
        tenantId,
        committeeId,
        userId: dto.userId,
        role: dto.role,
        status: 'ACTIVE',
      },
    });
  }
}
