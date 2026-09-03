import { Injectable, Logger } from '@nestjs/common';

export interface OBEAuditEvent {
  event: string;
  tenantId: string;
  actorId?: string;
  correlationId: string;
  courseId?: string;
  programId?: string;
  academicYear?: string;
  status: string;
  details?: any;
}

@Injectable()
export class OBEAuditService {
  private readonly logger = new Logger(OBEAuditService.name);

  async logEvent(event: OBEAuditEvent): Promise<void> {
    this.logger.log(
      `[OBE_AUDIT] Event: ${event.event} | CID: ${event.correlationId} | Tenant: ${event.tenantId} | Actor: ${event.actorId || 'SYSTEM'} | Course: ${event.courseId || 'N/A'} | Status: ${event.status}`
    );
  }
}
