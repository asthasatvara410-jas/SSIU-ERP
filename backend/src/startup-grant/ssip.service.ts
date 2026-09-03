import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSSIPProjectDto } from './dto/startup-grant.dto';

@Injectable()
export class SSIPService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateSSIPProjectDto, tenantId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.sSIPProject.count();
    const projectCode = `SSIP-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.sSIPProject.create({
      data: {
        tenantId,
        projectCode,
        title: dto.title,
        description: dto.description || null,
        studentLeadId: dto.studentLeadId,
        facultyMentorId: dto.facultyMentorId || null,
        startupId: dto.startupId || null,
        sanctionedAmount: dto.sanctionedAmount || 50000,
        releasedAmount: 25000,
        utilizedAmount: 0,
        status: 'APPROVED',
      },
    });
  }

  async listProjects(tenantId: string) {
    return this.prisma.sSIPProject.findMany({
      where: { tenantId },
      include: { startup: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
