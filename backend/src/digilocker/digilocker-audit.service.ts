import { Injectable, Logger } from '@nestjs/common';

export interface DigiLockerAuditEvent {
  event: string;
  studentId?: string;
  tenantId: string;
  actorId?: string;
  correlationId: string;
  status: string;
  details?: any;
}

@Injectable()
export class DigiLockerAuditService {
  private readonly logger = new Logger(DigiLockerAuditService.name);

  async logEvent(event: DigiLockerAuditEvent): Promise<void> {
    // Sanitize any accidental sensitive fields before logging
    const safeDetails = { ...event.details };
    delete safeDetails.accessToken;
    delete safeDetails.refreshToken;
    delete safeDetails.clientSecret;
    delete safeDetails.password;

    this.logger.log(
      `[DIGILOCKER_AUDIT] Event: ${event.event} | CID: ${event.correlationId} | Student: ${event.studentId || 'N/A'} | Tenant: ${event.tenantId} | Status: ${event.status} | Details: ${JSON.stringify(safeDetails)}`
    );
  }
}
