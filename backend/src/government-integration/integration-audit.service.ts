import { Injectable, Logger } from '@nestjs/common';

export interface GovernmentAuditEvent {
  event: string;
  tenantId: string;
  actorId?: string;
  studentId?: string;
  provider: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  status?: string;
  details?: any;
}

@Injectable()
export class IntegrationAuditService {
  private readonly logger = new Logger(IntegrationAuditService.name);

  async logEvent(event: GovernmentAuditEvent): Promise<void> {
    this.logger.log(
      `[GOVERNMENT_AUDIT] Event: ${event.event} | Provider: ${event.provider} | Entity: ${event.entityType}#${event.entityId} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'}${event.studentId ? ` | Student: ${event.studentId}` : ''}`
    );
  }
}
