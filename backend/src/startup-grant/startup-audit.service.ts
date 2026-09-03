import { Injectable, Logger } from '@nestjs/common';

export interface GrantAuditEvent {
  event: string;
  tenantId: string;
  actorId?: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  amount?: number;
  status?: string;
  details?: any;
}

@Injectable()
export class StartupAuditService {
  private readonly logger = new Logger(StartupAuditService.name);

  async logEvent(event: GrantAuditEvent): Promise<void> {
    this.logger.log(
      `[GRANT_AUDIT] Event: ${event.event} | Entity: ${event.entityType}#${event.entityId} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'}${event.amount ? ` | Amount: ₹${event.amount}` : ''}`
    );
  }
}
