import { Injectable, Logger } from '@nestjs/common';

export interface GrievanceAuditEvent {
  event: string;
  tenantId: string;
  actorId?: string;
  caseNumber?: string;
  caseId?: string;
  correlationId: string;
  category?: string;
  status?: string;
  details?: any;
}

@Injectable()
export class GrievanceAuditService {
  private readonly logger = new Logger(GrievanceAuditService.name);

  async logEvent(event: GrievanceAuditEvent): Promise<void> {
    this.logger.log(
      `[GRIEVANCE_AUDIT] Event: ${event.event} | Case: ${event.caseNumber || event.caseId || 'N/A'} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'} | Status: ${event.status}`
    );
  }
}
