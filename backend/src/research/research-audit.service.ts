import { Injectable, Logger } from '@nestjs/common';

export interface ResearchAuditEvent {
  event: string;
  tenantId: string;
  actorId?: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  status?: string;
  details?: any;
}

@Injectable()
export class ResearchAuditService {
  private readonly logger = new Logger(ResearchAuditService.name);

  async logEvent(event: ResearchAuditEvent): Promise<void> {
    this.logger.log(
      `[RESEARCH_AUDIT] Event: ${event.event} | Entity: ${event.entityType}#${event.entityId} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'}`
    );
  }
}
