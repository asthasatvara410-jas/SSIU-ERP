import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetAssessmentCOMapDto, BulkSetAssessmentCOMapDto } from './dto/obe.dto';

@Injectable()
export class AssessmentMappingService {
  constructor(private readonly prisma: PrismaService) {}

  async mapAssessmentToCO(dto: SetAssessmentCOMapDto, tenantId: string) {
    return this.prisma.assessmentCOMap.upsert({
      where: {
        assessmentId_courseOutcomeId_tenantId: {
          assessmentId: dto.assessmentId,
          courseOutcomeId: dto.courseOutcomeId,
          tenantId,
        },
      },
      create: {
        tenantId,
        assessmentId: dto.assessmentId,
        courseOutcomeId: dto.courseOutcomeId,
        weight: dto.weight,
        maxMarks: dto.maxMarks,
      },
      update: {
        weight: dto.weight,
        maxMarks: dto.maxMarks,
      },
    });
  }

  async mapAssessmentBatch(dto: BulkSetAssessmentCOMapDto, tenantId: string) {
    const upserts = dto.mappings.map((m) =>
      this.prisma.assessmentCOMap.upsert({
        where: {
          assessmentId_courseOutcomeId_tenantId: {
            assessmentId: m.assessmentId,
            courseOutcomeId: m.courseOutcomeId,
            tenantId,
          },
        },
        create: {
          tenantId,
          assessmentId: m.assessmentId,
          courseOutcomeId: m.courseOutcomeId,
          weight: m.weight,
          maxMarks: m.maxMarks,
        },
        update: {
          weight: m.weight,
          maxMarks: m.maxMarks,
        },
      })
    );
    const saved = await this.prisma.$transaction(upserts);
    return {
      success: true,
      updatedCount: saved.length,
      lastUpdated: new Date(),
    };
  }

  async listByCourse(courseId: string, tenantId: string) {
    let list = await this.prisma.assessmentCOMap.findMany({
      where: {
        courseOutcome: {
          OR: [{ courseId }, { subjectId: courseId }],
        },
        tenantId,
      },
      include: { courseOutcome: true },
    });

    if (list.length === 0) {
      const cos = await this.prisma.courseOutcome.findMany({
        where: {
          OR: [{ courseId }, { subjectId: courseId }],
          tenantId,
        },
      });

      if (cos.length > 0) {
        // Seed default CIE Mid-Sem, Lab & SEE
        const defaultAssessments = [
          { assessmentId: 'ASM-CIE-MIDSEM', weight: 0.3, maxMarks: 30 },
          { assessmentId: 'ASM-CIE-LAB', weight: 0.2, maxMarks: 20 },
          { assessmentId: 'ASM-SEE-ENDSEM', weight: 0.5, maxMarks: 50 },
        ];

        for (const co of cos) {
          for (const asm of defaultAssessments) {
            await this.prisma.assessmentCOMap.upsert({
              where: {
                assessmentId_courseOutcomeId_tenantId: {
                  assessmentId: asm.assessmentId,
                  courseOutcomeId: co.id,
                  tenantId,
                },
              },
              create: {
                tenantId,
                assessmentId: asm.assessmentId,
                courseOutcomeId: co.id,
                weight: asm.weight,
                maxMarks: asm.maxMarks,
              },
              update: {},
            });
          }
        }

        list = await this.prisma.assessmentCOMap.findMany({
          where: {
            courseOutcome: {
              OR: [{ courseId }, { subjectId: courseId }],
            },
            tenantId,
          },
          include: { courseOutcome: true },
        });
      }
    }

    return list;
  }
}
