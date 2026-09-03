import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResearchProjectDto } from './dto/research.dto';

@Injectable()
export class ResearchProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateResearchProjectDto, tenantId: string, userId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.researchProject.count();
    const projectCode = `PRJ-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.researchProject.create({
      data: {
        projectCode,
        title: dto.title,
        abstract: dto.abstract || null,
        researchArea: dto.researchArea || 'Computer Science & Engineering',
        departmentId: dto.departmentId || 'DEP-CSE',
        instituteId: tenantId,
        piFacultyId: userId,
        createdByUserId: userId,
        startDate: new Date(),
        totalBudget: dto.fundingAmount || 0,
        status: 'SUBMITTED',
      },
    });
  }

  async listProjects(tenantId: string, departmentId?: string) {
    return this.prisma.researchProject.findMany({
      where: {
        instituteId: tenantId,
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        members: true,
        milestones: true,
        grants: true,
        publications: true,
        patents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectDetails(id: string, tenantId: string) {
    const prj = await this.prisma.researchProject.findFirst({
      where: { OR: [{ id }, { projectCode: id }], instituteId: tenantId },
      include: {
        members: true,
        milestones: true,
        grants: true,
        publications: true,
        patents: true,
      },
    });

    if (!prj) throw new BadRequestException(`Project ${id} not found.`);
    return prj;
  }
}
