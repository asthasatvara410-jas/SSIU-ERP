import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogParams {
  agentId?: string;
  agentCode: string;
  executionId?: string;
  correlationId: string;
  eventType: string;
  actionSummary: string;
  payload?: Record<string, any>;
  actorType?: 'SYSTEM_AGENT' | 'HUMAN_APPROVER' | 'TRIGGER_EVENT';
  actorId?: string;
  tenantId?: string;
  ipAddress?: string;
}

@Injectable()
export class AgentAuditLoggerService {
  private readonly logger = new Logger('AgentAuditLogger');

  constructor(private readonly prisma: PrismaService) {}

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitiveKeys = ['password', 'secret', 'token', 'authorization', 'apiKey', 'geminiKey', 'openaiKey', 'jwtSecret'];
    const clean: Record<string, any> = Array.isArray(obj) ? [] : {};

    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        clean[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        clean[key] = this.sanitize(obj[key]);
      } else {
        clean[key] = obj[key];
      }
    }
    return clean;
  }

  async logAction(params: AuditLogParams): Promise<void> {
    const sanitizedPayload = this.sanitize(params.payload || {});
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentCode: params.agentCode,
      executionId: params.executionId,
      correlationId: params.correlationId,
      eventType: params.eventType,
      summary: params.actionSummary,
      actorType: params.actorType || 'SYSTEM_AGENT',
      actorId: params.actorId || 'system',
      tenantId: params.tenantId || 'DEFAULT',
      payload: sanitizedPayload,
    };

    this.logger.log(`[AGENT_AUDIT] ${JSON.stringify(logEntry)}`);

    try {
      if (params.agentId) {
        await this.prisma.agentAuditLog.create({
          data: {
            agentId: params.agentId,
            executionId: params.executionId,
            correlationId: params.correlationId,
            eventType: params.eventType,
            actionSummary: params.actionSummary,
            payload: sanitizedPayload,
            actorType: params.actorType || 'SYSTEM_AGENT',
            actorId: params.actorId,
            tenantId: params.tenantId || 'DEFAULT',
            ipAddress: params.ipAddress || '127.0.0.1',
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to persist database audit log: ${err.message}`);
    }
  }
}
