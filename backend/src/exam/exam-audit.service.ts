import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogExamAuditEventParams {
  tenantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: 'QUESTION' | 'EXAM_PAPER' | 'BULK_UPLOAD';
  entityId: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ExamAuditService {
  private readonly logger = new Logger(ExamAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: LogExamAuditEventParams): Promise<void> {
    try {
      await this.prisma.examAuditLog.create({
        data: {
          tenantId: params.tenantId || 'DEFAULT',
          actorId: params.actorId || 'SYSTEM',
          actorRole: params.actorRole || 'SYSTEM',
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          previousStatus: params.previousStatus || null,
          newStatus: params.newStatus || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });

      this.logger.log(
        `[EXAM_AUDIT] Action: ${params.action} | Entity: ${params.entityType}#${params.entityId} | Actor: ${params.actorId} (${params.actorRole}) | Tenant: ${params.tenantId}`
      );
    } catch (err: any) {
      this.logger.error(`Failed to record exam audit log: ${err.message}`, err.stack);
    }
  }

  async getAuditLogs(entityType?: string, entityId?: string, tenantId: string = 'DEFAULT') {
    return this.prisma.examAuditLog.findMany({
      where: {
        tenantId,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
