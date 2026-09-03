import { Injectable, Logger } from '@nestjs/common';

export interface AccreditationAuditEvent {
  event: string;
  framework: string;
  tenantId: string;
  actorId?: string;
  correlationId: string;
  criterion?: string;
  reportId?: string;
  status: string;
  details?: any;
}

@Injectable()
export class AccreditationAuditService {
  private readonly logger = new Logger(AccreditationAuditService.name);

  async logEvent(event: AccreditationAuditEvent): Promise<void> {
    this.logger.log(
      `[ACCREDITATION_AUDIT] Event: ${event.event} | Framework: ${event.framework} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'} | Status: ${event.status}`
    );
  }
}
