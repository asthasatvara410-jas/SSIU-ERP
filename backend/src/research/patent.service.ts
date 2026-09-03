import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatentDto } from './dto/research.dto';

@Injectable()
export class PatentService {
  constructor(private readonly prisma: PrismaService) {}

  async createPatent(dto: CreatePatentDto, tenantId: string, createdBy: string) {
    const patent = await this.prisma.patent.create({
      data: {
        tenantId,
        title: dto.title,
        inventors: dto.inventors,
        applicationNumber: dto.applicationNumber,
        publicationNumber: dto.publicationNumber || null,
        patentNumber: dto.patentNumber || null,
        filingDate: new Date(),
        jurisdiction: dto.jurisdiction || 'INDIA (IPO)',
        status: dto.status || 'FILED',
        applicant: dto.applicant || 'Swarrnim Startup & Innovation University',
        validationStatus: 'NOT_VERIFIED',
        approvalStatus: 'SUBMITTED',
        createdBy,
      },
    });

    if (dto.inventorList && dto.inventorList.length > 0) {
      for (let i = 0; i < dto.inventorList.length; i++) {
        const inv = dto.inventorList[i];
        await this.prisma.patentInventor.create({
          data: {
            tenantId,
            patentId: patent.id,
            userId: inv.userId || null,
            studentId: inv.studentId || null,
            nameSnapshot: inv.name,
            inventorOrder: inv.order || (i + 1),
          },
        });
      }
    }

    return patent;
  }

  async listPatents(tenantId: string, status?: string) {
    return this.prisma.patent.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        inventorRecords: { orderBy: { inventorOrder: 'asc' } },
        evidences: true,
        approvalActions: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPatentDetails(id: string, tenantId: string) {
    const pat = await this.prisma.patent.findFirst({
      where: { id, tenantId },
      include: {
        inventorRecords: { orderBy: { inventorOrder: 'asc' } },
        evidences: true,
        approvalActions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!pat) throw new BadRequestException(`Patent ${id} not found.`);
    return pat;
  }
}
