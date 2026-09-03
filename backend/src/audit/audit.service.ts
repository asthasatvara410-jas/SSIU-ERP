import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(module?: string, action?: string) {
    return this.prisma.loginAudit.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getAuditLogById(id: string) {
    const log = await this.prisma.loginAudit.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!log) throw new NotFoundException('Audit record not found.');
    return log;
  }
}
