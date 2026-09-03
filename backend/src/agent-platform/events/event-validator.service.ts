import { Injectable, BadRequestException } from '@nestjs/common';
import { ERPEvent } from './event.types';

@Injectable()
export class EventValidatorService {
  /**
   * Validates structure, tenant scope, and required attributes of an ERP event.
   */
  validateEvent(event: ERPEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.eventId) errors.push('Missing required property: eventId');
    if (!event.eventType) errors.push('Missing required property: eventType');
    if (!event.tenantId) errors.push('Missing required property: tenantId');
    if (!event.institutionId) errors.push('Missing required property: institutionId');
    if (!event.sourceModule) errors.push('Missing required property: sourceModule');
    if (!event.entityType) errors.push('Missing required property: entityType');
    if (!event.entityId) errors.push('Missing required property: entityId');
    if (event.payload === undefined || event.payload === null) errors.push('Missing required property: payload');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  assertValid(event: ERPEvent): void {
    const { valid, errors } = this.validateEvent(event);
    if (!valid) {
      throw new BadRequestException(`Invalid ERP Event: ${errors.join(', ')}`);
    }
  }
}
