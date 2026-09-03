import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OBEValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCourseOBE(courseId: string, tenantId: string) {
    const cos = await this.prisma.courseOutcome.findMany({
      where: { OR: [{ courseId }, { subjectId: courseId }], tenantId },
      include: { copoMappings: true, assessmentMaps: true },
    });

    const warnings: string[] = [];
    if (cos.length === 0) {
      return {
        status: 'MISSING',
        isValid: false,
        message: 'No Course Outcomes defined for this course.',
        coCount: 0,
        warnings: ['Please define at least 3-6 Course Outcomes.'],
      };
    }

    let unmappedCOs = 0;
    let unassessedCOs = 0;

    cos.forEach(c => {
      if (c.copoMappings.length === 0) unmappedCOs++;
      if (c.assessmentMaps.length === 0) unassessedCOs++;
    });

    if (unmappedCOs > 0) warnings.push(`${unmappedCOs} Course Outcome(s) not mapped to any Program Outcome.`);
    if (unassessedCOs > 0) warnings.push(`${unassessedCOs} Course Outcome(s) have no mapped assessments.`);

    return {
      status: warnings.length === 0 ? 'VALID' : 'WARNING',
      isValid: warnings.length === 0,
      coCount: cos.length,
      unmappedCOs,
      unassessedCOs,
      warnings,
    };
  }
}
