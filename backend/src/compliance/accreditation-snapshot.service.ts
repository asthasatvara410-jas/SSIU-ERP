import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSnapshotDto } from './dto/compliance.dto';

@Injectable()
export class AccreditationSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(dto: CreateSnapshotDto, user: any, tenantId: string) {
    const snapshot = await this.prisma.accreditationSnapshot.create({
      data: {
        tenantId,
        framework: dto.framework,
        version: 'v1.0',
        academicYear: dto.academicYear,
        generatedBy: user?.id || user?.email || 'SYSTEM_ADMIN',
        status: 'LOCKED',
      },
    });

    // Populate data lineage references across ERP source modules
    await this.prisma.accreditationDataLineage.createMany({
      data: [
        {
          tenantId,
          snapshotId: snapshot.id,
          framework: dto.framework,
          metricCode: 'CR1.1',
          sourceModule: 'ACADEMIC_CURRICULUM',
          sourceEntity: 'CourseOutcome',
          sourceRecordId: 'co-root-ref',
        },
        {
          tenantId,
          snapshotId: snapshot.id,
          framework: dto.framework,
          metricCode: 'CR2.2',
          sourceModule: 'EXAMINATION_RESULTS',
          sourceEntity: 'COAttainmentRecord',
          sourceRecordId: 'att-root-ref',
        },
        {
          tenantId,
          snapshotId: snapshot.id,
          framework: dto.framework,
          metricCode: 'CR3.1',
          sourceModule: 'RESEARCH_PUBLICATIONS',
          sourceEntity: 'ResearchPublication',
          sourceRecordId: 'res-root-ref',
        },
      ],
    });

    return this.prisma.accreditationSnapshot.findUnique({
      where: { id: snapshot.id },
      include: { lineages: true },
    });
  }

  async listSnapshots(tenantId: string, framework?: string) {
    return this.prisma.accreditationSnapshot.findMany({
      where: {
        tenantId,
        ...(framework ? { framework } : {}),
      },
      include: { lineages: true },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
