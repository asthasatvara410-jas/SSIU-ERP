import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramOutcomeDto } from './dto/obe.dto';

const NBA_STANDARD_POS = [
  { code: 'PO1', description: 'Engineering Knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.' },
  { code: 'PO2', description: 'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.' },
  { code: 'PO3', description: 'Design/Development of Solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for public health and safety, and cultural, societal, and environmental considerations.' },
  { code: 'PO4', description: 'Conduct Investigations of Complex Problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.' },
  { code: 'PO5', description: 'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.' },
  { code: 'PO6', description: 'The Engineer and Society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.' },
  { code: 'PO7', description: 'Environment and Sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.' },
  { code: 'PO8', description: 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.' },
  { code: 'PO9', description: 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
  { code: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.' },
  { code: 'PO11', description: 'Project Management and Finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.' },
  { code: 'PO12', description: 'Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' },
];

@Injectable()
export class ProgramOutcomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProgramOutcomeDto, tenantId: string) {
    const existing = await this.prisma.programOutcome.findFirst({
      where: {
        programId: dto.programId,
        code: dto.code,
        tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException(`Program Outcome ${dto.code} already exists for this program.`);
    }

    return this.prisma.programOutcome.create({
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
    let list = await this.prisma.programOutcome.findMany({
      where: {
        OR: [{ programId, tenantId }, { programId, tenantId: 'DEFAULT' }, { tenantId: 'DEFAULT' }],
      },
      include: {
        copoMappings: true,
        programAttainments: true,
      },
      orderBy: { code: 'asc' },
    });

    if (list.length === 0) {
      for (const std of NBA_STANDARD_POS) {
        const existing = await this.prisma.programOutcome.findFirst({
          where: {
            programId,
            code: std.code,
            tenantId,
          },
        });
        if (!existing) {
          await this.prisma.programOutcome.create({
            data: {
              tenantId,
              programId,
              code: std.code,
              description: std.description,
              version: 'v1.0',
              status: 'ACTIVE',
            },
          });
        }
      }

      list = await this.prisma.programOutcome.findMany({
        where: {
          OR: [{ programId, tenantId }, { tenantId: 'DEFAULT' }],
        },
        include: {
          copoMappings: true,
          programAttainments: true,
        },
        orderBy: { code: 'asc' },
      });
    }

    return list;
  }
}
