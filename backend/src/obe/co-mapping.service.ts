import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetCOPOMappingDto, SetCOPSOMappingDto, BulkSetCOPOMatrixDto, BulkSetCOPSOMatrixDto } from './dto/obe.dto';
import { OBEAuditService } from './obe-audit.service';

@Injectable()
export class COMappingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: OBEAuditService,
  ) {}

  /**
   * Sets or updates CO-PO correlation level (0 to 3).
   */
  async setCOPOMapping(dto: SetCOPOMappingDto, tenantId: string) {
    if (dto.correlationLevel < 0 || dto.correlationLevel > 3) {
      throw new BadRequestException('Correlation level must be an integer between 0 and 3.');
    }

    return this.prisma.cOPOMapping.upsert({
      where: {
        coId_poId: {
          coId: dto.coId,
          poId: dto.poId,
        },
      },
      create: {
        tenantId,
        coId: dto.coId,
        poId: dto.poId,
        correlationLevel: dto.correlationLevel,
        weight: 1.0,
      },
      update: {
        correlationLevel: dto.correlationLevel,
        tenantId,
      },
    });
  }

  /**
   * Sets or updates CO-PSO correlation level (0 to 3).
   */
  async setCOPSOMapping(dto: SetCOPSOMappingDto, tenantId: string) {
    if (dto.level < 0 || dto.level > 3) {
      throw new BadRequestException('Correlation level must be an integer between 0 and 3.');
    }

    return this.prisma.cOPSOMapping.upsert({
      where: {
        courseOutcomeId_programSpecificOutcomeId_tenantId: {
          courseOutcomeId: dto.courseOutcomeId,
          programSpecificOutcomeId: dto.programSpecificOutcomeId,
          tenantId,
        },
      },
      create: {
        tenantId,
        courseOutcomeId: dto.courseOutcomeId,
        programSpecificOutcomeId: dto.programSpecificOutcomeId,
        level: dto.level,
        weight: 1.0,
      },
      update: {
        level: dto.level,
      },
    });
  }

  /**
   * Saves and updates the complete CO-PO matrix in a single transaction.
   */
  async saveCOPOMatrix(courseId: string, dto: BulkSetCOPOMatrixDto, tenantId: string, user: any) {
    if (user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot modify CO-PO mappings.');
    }

    const { mappings, programId, academicYear = '2025-26' } = dto;

    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw new BadRequestException('Mappings array must contain at least one valid cell mapping.');
    }

    // Validate all cells
    for (const m of mappings) {
      if (typeof m.correlationLevel !== 'number' || m.correlationLevel < 0 || m.correlationLevel > 3) {
        throw new BadRequestException(`Invalid correlation level '${m.correlationLevel}' for CO ${m.coId} -> PO ${m.poId}. Must be 0, 1, 2, or 3.`);
      }
    }

    // Upsert mappings in a transaction
    const upsertPromises = mappings.map((m) =>
      this.prisma.cOPOMapping.upsert({
        where: {
          coId_poId: {
            coId: m.coId,
            poId: m.poId,
          },
        },
        create: {
          tenantId,
          coId: m.coId,
          poId: m.poId,
          correlationLevel: m.correlationLevel,
          weight: 1.0,
        },
        update: {
          correlationLevel: m.correlationLevel,
          tenantId,
        },
      })
    );

    const savedMappings = await this.prisma.$transaction(upsertPromises);

    // Calculate updated statistics
    const activeMappings = savedMappings.filter((m) => m.correlationLevel > 0);
    const totalLevelSum = activeMappings.reduce((acc, curr) => acc + curr.correlationLevel, 0);
    const avgCorrelation = activeMappings.length > 0 ? parseFloat((totalLevelSum / activeMappings.length).toFixed(2)) : 0;
    const coveragePercentage = savedMappings.length > 0 ? parseFloat(((activeMappings.length / savedMappings.length) * 100).toFixed(1)) : 0;

    await this.auditService.logEvent({
      event: 'OBE_CO_PO_MATRIX_UPDATED',
      tenantId,
      actorId: user?.id || 'SYSTEM',
      correlationId: `copo-mat-${Date.now()}`,
      courseId,
      programId: programId || 'PROG-DEFAULT',
      academicYear,
      status: 'SUCCESS',
      details: {
        totalCellsSaved: savedMappings.length,
        activeMappingsCount: activeMappings.length,
        averageCorrelation: avgCorrelation,
        coveragePercentage,
      },
    });

    return {
      success: true,
      courseId,
      programId,
      academicYear,
      updatedCount: savedMappings.length,
      stats: {
        totalCells: savedMappings.length,
        mappedCells: activeMappings.length,
        unmappedCells: savedMappings.length - activeMappings.length,
        averageCorrelation: avgCorrelation,
        coveragePercentage,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Retrieves full CO-PO matrix for a course, automatically initializing standard POs/COs if needed.
   */
  async getMatrix(courseId: string, programId: string = 'PROG-BTECH-CSE', tenantId: string = 'DEFAULT') {
    // 1. Ensure 12 Standard NBA Program Outcomes exist
    let pos = await this.prisma.programOutcome.findMany({
      where: {
        OR: [{ programId }, { tenantId: 'DEFAULT' }],
      },
      orderBy: { code: 'asc' },
    });

    if (pos.length < 12) {
      const defaultPOs = [
        { code: 'PO1', description: 'Engineering Knowledge: Apply mathematics, science, engineering fundamentals, and an engineering specialization.' },
        { code: 'PO2', description: 'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems.' },
        { code: 'PO3', description: 'Design/Development of Solutions: Design solutions for complex engineering problems and design system components or processes.' },
        { code: 'PO4', description: 'Conduct Investigations of Complex Problems: Use research-based knowledge and research methods including design of experiments.' },
        { code: 'PO5', description: 'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools.' },
        { code: 'PO6', description: 'The Engineer and Society: Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues.' },
        { code: 'PO7', description: 'Environment and Sustainability: Understand the impact of professional engineering solutions in societal and environmental contexts.' },
        { code: 'PO8', description: 'Ethics: Apply ethical principles and commit to professional ethics, responsibilities, and norms of engineering practice.' },
        { code: 'PO9', description: 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams.' },
        { code: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities with the engineering community and with society.' },
        { code: 'PO11', description: 'Project Management and Finance: Demonstrate knowledge and understanding of engineering and management principles.' },
        { code: 'PO12', description: 'Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning.' },
      ];

      for (const p of defaultPOs) {
        const existing = pos.find((ep) => ep.code === p.code);
        if (!existing) {
          await this.prisma.programOutcome.create({
            data: {
              tenantId,
              programId,
              code: p.code,
              description: p.description,
              version: 'v1.0',
              status: 'ACTIVE',
            },
          });
        }
      }

      pos = await this.prisma.programOutcome.findMany({
        where: {
          OR: [{ programId }, { tenantId: 'DEFAULT' }],
        },
        orderBy: { code: 'asc' },
      });
    }

    // 2. Ensure standard COs exist for the course
    let cos = await this.prisma.courseOutcome.findMany({
      where: {
        OR: [{ courseId }, { subjectId: courseId }],
      },
      include: {
        copoMappings: true,
        psoMappings: true,
      },
      orderBy: { code: 'asc' },
    });

    if (cos.length === 0) {
      const defaultCOs = [
        { code: 'CO1', description: 'Understand theoretical fundamentals and core mathematical principles of the subject.' },
        { code: 'CO2', description: 'Analyze complex engineering problems and formulate algorithmic and architectural solutions.' },
        { code: 'CO3', description: 'Design and implement modular, performant, and reliable software/hardware components.' },
        { code: 'CO4', description: 'Conduct empirical performance evaluations, benchmarking, and comprehensive testing.' },
        { code: 'CO5', description: 'Collaborate in multidisciplinary project teams adhering to professional engineering standards.' },
      ];

      for (const c of defaultCOs) {
        await this.prisma.courseOutcome.create({
          data: {
            tenantId,
            courseId,
            subjectId: courseId,
            code: c.code,
            description: c.description,
            academicYear: '2025-26',
            status: 'ACTIVE',
          },
        });
      }

      cos = await this.prisma.courseOutcome.findMany({
        where: {
          OR: [{ courseId }, { subjectId: courseId }],
        },
        include: {
          copoMappings: true,
          psoMappings: true,
        },
        orderBy: { code: 'asc' },
      });
    }

    // 3. Fetch PSOs
    const psos = await this.prisma.programSpecificOutcome.findMany({
      where: {
        OR: [{ programId }, { tenantId: 'DEFAULT' }],
      },
      orderBy: { code: 'asc' },
    });

    // 4. Compute matrix cell map & averages
    const matrixMap: Record<string, number> = {};
    const coAverages: Record<string, number> = {};
    const poAverages: Record<string, number> = {};
    const poSums: Record<string, { sum: number; count: number }> = {};

    let totalActiveMappings = 0;
    let grandSum = 0;

    for (const co of cos) {
      let coSum = 0;
      let coCount = 0;

      for (const po of pos) {
        const mapping = co.copoMappings.find((m) => m.poId === po.id);
        const level = mapping ? mapping.correlationLevel : 0;
        matrixMap[`${co.id}_${po.id}`] = level;

        if (level > 0) {
          coSum += level;
          coCount += 1;
          totalActiveMappings += 1;
          grandSum += level;

          if (!poSums[po.id]) poSums[po.id] = { sum: 0, count: 0 };
          poSums[po.id].sum += level;
          poSums[po.id].count += 1;
        }
      }

      coAverages[co.id] = coCount > 0 ? parseFloat((coSum / coCount).toFixed(2)) : 0;
    }

    for (const po of pos) {
      const bucket = poSums[po.id];
      poAverages[po.id] = bucket && bucket.count > 0 ? parseFloat((bucket.sum / bucket.count).toFixed(2)) : 0;
    }

    const totalCells = cos.length * pos.length;
    const coveragePercentage = totalCells > 0 ? parseFloat(((totalActiveMappings / totalCells) * 100).toFixed(1)) : 0;
    const averageCorrelation = totalActiveMappings > 0 ? parseFloat((grandSum / totalActiveMappings).toFixed(2)) : 0;

    return {
      courseId,
      programId,
      courseOutcomes: cos,
      programOutcomes: pos,
      programSpecificOutcomes: psos,
      matrixMap,
      coAverages,
      poAverages,
      stats: {
        totalCells,
        mappedCells: totalActiveMappings,
        unmappedCells: totalCells - totalActiveMappings,
        averageCorrelation,
        coveragePercentage,
      },
    };
  }

  /**
   * Bulk saves CO-PSO mapping matrix with audit logging.
   */
  async saveCOPSOMatrix(
    courseId: string,
    dto: BulkSetCOPSOMatrixDto,
    tenantId: string,
    user: any
  ) {
    if (user?.role === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot modify CO-PSO mappings.');
    }

    const upsertPromises = dto.mappings.map((m) =>
      this.prisma.cOPSOMapping.upsert({
        where: {
          courseOutcomeId_programSpecificOutcomeId_tenantId: {
            courseOutcomeId: m.courseOutcomeId,
            programSpecificOutcomeId: m.programSpecificOutcomeId,
            tenantId,
          },
        },
        create: {
          tenantId,
          courseOutcomeId: m.courseOutcomeId,
          programSpecificOutcomeId: m.programSpecificOutcomeId,
          level: m.level,
          weight: 1.0,
        },
        update: {
          level: m.level,
          tenantId,
        },
      })
    );

    const saved = await this.prisma.$transaction(upsertPromises);

    await this.auditService.logEvent({
      event: 'OBE_CO_PSO_MATRIX_UPDATED',
      tenantId,
      actorId: user?.id || 'SYSTEM',
      correlationId: `copso-mat-${Date.now()}`,
      courseId,
      programId: dto.programId || 'PROG-DEFAULT',
      academicYear: dto.academicYear || '2025-26',
      status: 'SUCCESS',
      details: {
        totalCellsSaved: saved.length,
      },
    });

    return {
      success: true,
      courseId,
      updatedCount: saved.length,
      lastUpdated: new Date(),
    };
  }
}


