import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseOutcomeDto, UpdateCourseOutcomeDto } from './dto/obe.dto';

@Injectable()
export class CourseOutcomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseOutcomeDto, tenantId: string) {
    const existing = await this.prisma.courseOutcome.findFirst({
      where: {
        courseId: dto.courseId,
        code: dto.code,
        academicYear: dto.academicYear || '2025-26',
        tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException(`Course Outcome ${dto.code} already exists for this course and academic year.`);
    }

    return this.prisma.courseOutcome.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        subjectId: dto.courseId,
        code: dto.code,
        description: dto.description,
        academicYear: dto.academicYear || '2025-26',
        status: 'ACTIVE',
      },
    });
  }

  async listByCourse(courseId: string, tenantId: string) {
    return this.prisma.courseOutcome.findMany({
      where: {
        OR: [{ courseId }, { subjectId: courseId }],
        tenantId,
      },
      include: {
        copoMappings: { include: { programOutcome: true } },
        psoMappings: { include: { programSpecificOutcome: true } },
        assessmentMaps: true,
        courseAttainments: true,
        improvementActions: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCourseOutcomeDto, tenantId: string) {
    const co = await this.prisma.courseOutcome.findFirst({ where: { id, tenantId } });
    if (!co) {
      throw new BadRequestException(`Course Outcome ${id} not found.`);
    }

    return this.prisma.courseOutcome.update({
      where: { id },
      data: {
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }
}
