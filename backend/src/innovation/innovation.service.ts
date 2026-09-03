import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InnovationService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  async submitIdea(userId: string, category: string, problemStatement: string, solution: string) {
    const ideaCode = await this.nextSeq('IDN', () => this.prisma.innovationIdea.count());

    return this.prisma.innovationIdea.create({
      data: {
        ideaCode,
        creatorUserId: userId,
        category,
        problemStatement,
        solution,
        status: 'SUBMITTED',
      },
      include: { creatorUser: true },
    });
  }

  async getIdeas(status?: string, userId?: string) {
    return this.prisma.innovationIdea.findMany({
      where: {
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(userId ? { creatorUserId: userId } : {}),
      },
      include: { creatorUser: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async evaluateIdea(id: string, status: string, evaluationNotes?: string) {
    const idea = await this.prisma.innovationIdea.findUnique({ where: { id } });
    if (!idea) throw new NotFoundException('Innovation idea not found.');

    return this.prisma.innovationIdea.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        evaluationNotes,
      },
    });
  }
}
