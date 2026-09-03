import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramSpecificOutcomeDto } from './dto/obe.dto';

const DEFAULT_PSOS = [
  {
    code: 'PSO1',
    description: 'Software Engineering & System Architecture: Design, develop, and deploy secure, distributed, and scalable enterprise applications with robust data models.',
  },
  {
    code: 'PSO2',
    description: 'Intelligent Systems & Cloud Computing: Apply machine learning, data intelligence, and cloud virtualization frameworks to solve complex industrial problems.',
  },
];

@Injectable()
export class ProgramSpecificOutcomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProgramSpecificOutcomeDto, tenantId: string) {
    const existing = await this.prisma.programSpecificOutcome.findFirst({
      where: {
        programId: dto.programId,
        code: dto.code,
        tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException(`PSO ${dto.code} already exists for this program.`);
    }

    return this.prisma.programSpecificOutcome.create({
      data: {
        tenantId,
        programId: dto.programId,
        code: dto.code,
        description: dto.description,
        version: dto.version || 'v1.0',
        status: 'ACTIVE',
      },
    });
  }

  async listByProgram(programId: string, tenantId: string) {
    let list = await this.prisma.programSpecificOutcome.findMany({
      where: {
        OR: [{ programId, tenantId }, { programId, tenantId: 'DEFAULT' }, { tenantId: 'DEFAULT' }],
      },
      include: { coMappings: true },
      orderBy: { code: 'asc' },
    });

    if (list.length === 0) {
      for (const pso of DEFAULT_PSOS) {
        const existing = await this.prisma.programSpecificOutcome.findFirst({
          where: {
            programId,
            code: pso.code,
            tenantId,
          },
        });
        if (!existing) {
          await this.prisma.programSpecificOutcome.create({
            data: {
              tenantId,
              programId,
              code: pso.code,
              description: pso.description,
              version: 'v1.0',
              status: 'ACTIVE',
            },
          });
        }
      }

      list = await this.prisma.programSpecificOutcome.findMany({
        where: {
          OR: [{ programId, tenantId }, { tenantId: 'DEFAULT' }],
        },
        include: { coMappings: true },
        orderBy: { code: 'asc' },
      });
    }

    return list;
  }
}
