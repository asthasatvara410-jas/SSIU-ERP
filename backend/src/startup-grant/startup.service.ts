import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStartupDto } from './dto/startup-grant.dto';

@Injectable()
export class StartupService {
  constructor(private readonly prisma: PrismaService) {}

  async createStartup(dto: CreateStartupDto, tenantId: string, createdBy: string) {
    // Validate ownership <= 100%
    if (dto.founders && dto.founders.length > 0) {
      const totalOwnership = dto.founders.reduce((sum, f) => sum + (f.ownershipPercentage || 0), 0);
      if (totalOwnership > 100) {
        throw new BadRequestException(`Total founder ownership cannot exceed 100%. (Provided: ${totalOwnership}%)`);
      }
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.startup.count();
    const startupCode = `STR-${year}-${String(count + 1).padStart(6, '0')}`;

    const startup = await this.prisma.startup.create({
      data: {
        tenantId,
        startupCode,
        name: dto.name,
        category: dto.category,
        description: dto.description || null,
        sector: dto.sector || 'DeepTech & AI',
        industry: dto.industry || 'Information Technology',
        stage: dto.stage || 'IDEATION',
        website: dto.website || null,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
        status: 'SUBMITTED',
        incubationStatus: 'ACTIVE',
        createdBy,
      },
    });

    if (dto.founders && dto.founders.length > 0) {
      for (const f of dto.founders) {
        await this.prisma.startupFounder.create({
          data: {
            tenantId,
            startupId: startup.id,
            userId: f.userId || null,
            studentId: f.studentId || null,
            facultyId: f.facultyId || null,
            nameSnapshot: f.name,
            role: f.role || 'CO_FOUNDER',
            ownershipPercentage: f.ownershipPercentage || 0,
            isPrimaryFounder: Boolean(f.isPrimaryFounder),
          },
        });
      }
    }

    return startup;
  }

  async listStartups(tenantId: string, stage?: string, status?: string) {
    return this.prisma.startup.findMany({
      where: {
        tenantId,
        ...(stage ? { stage } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        founders: true,
        mentors: true,
        milestones: true,
        ssipProjects: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStartupDetails(id: string, tenantId: string) {
    const startup = await this.prisma.startup.findFirst({
      where: { OR: [{ id }, { startupCode: id }], tenantId },
      include: {
        founders: true,
        mentors: true,
        milestones: true,
        ssipProjects: true,
        grantApplications: { include: { grant: true } },
        grantExpenses: true,
      },
    });

    if (!startup) throw new BadRequestException(`Startup ${id} not found.`);
    return startup;
  }
}
