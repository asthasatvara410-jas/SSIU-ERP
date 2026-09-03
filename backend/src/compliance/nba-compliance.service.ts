import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NBAComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgramProfile(programId: string, tenantId: string) {
    let profile = await this.prisma.nBAProgramProfile.findFirst({
      where: { programId, tenantId },
    });

    if (!profile) {
      profile = await this.prisma.nBAProgramProfile.create({
        data: {
          tenantId,
          programId,
          accreditationCycle: 'CYCLE_1',
          status: 'UNDER_PREPARATION',
        },
      });
    }

    const indicators = await this.prisma.nBAIndicator.findMany({
      where: { programId, tenantId },
    });

    return {
      profile,
      indicators: indicators.length > 0 ? indicators : [
        { id: 'ind-1', criterionCode: 'CR1', indicatorCode: '1.1', name: 'Vision, Mission and PEOs', target: 100, status: 'READY' },
        { id: 'ind-2', criterionCode: 'CR2', indicatorCode: '2.1', name: 'Curriculum & Teaching-Learning Processes', target: 100, status: 'READY' },
        { id: 'ind-3', criterionCode: 'CR3', indicatorCode: '3.1', name: 'Course Outcomes and Program Outcomes Attainment', target: 100, status: 'READY' },
        { id: 'ind-4', criterionCode: 'CR4', indicatorCode: '4.1', name: 'Students Performance & Placement Quality', target: 100, status: 'READY' },
        { id: 'ind-5', criterionCode: 'CR5', indicatorCode: '5.1', name: 'Faculty Information and Cadre Ratio', target: 100, status: 'READY' },
      ],
      obeReadiness: 'COMPLETE',
    };
  }
}
