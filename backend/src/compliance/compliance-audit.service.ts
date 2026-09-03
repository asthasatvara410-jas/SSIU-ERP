import { Injectable, Logger } from '@nestjs/common';

export interface ComplianceAuditEvent {
  event: string;
  tenantId: string;
  actorId?: string;
  framework?: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  details?: any;
}

@Injectable()
export class ComplianceAuditService {
  private readonly logger = new Logger(ComplianceAuditService.name);

  async logEvent(event: ComplianceAuditEvent): Promise<void> {
    this.logger.log(
      `[COMPLIANCE_AUDIT] Event: ${event.event} | Framework: ${event.framework || 'OBE'} | Entity: ${event.entityType}#${event.entityId} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'}`
    );
  }
}
