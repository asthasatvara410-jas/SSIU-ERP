import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  async listHackathons(tenantId: string) {
    return this.prisma.hackathon.findMany({
      where: { tenantId },
      include: {
        teams: {
          include: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHackathon(data: { name: string; description?: string; prizePoolReference?: string }, tenantId: string) {
    return this.prisma.hackathon.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description || null,
        prizePoolReference: data.prizePoolReference || '₹5,00,000 Total Prize Pool',
        status: 'REGISTRATION_OPEN',
      },
    });
  }
}
