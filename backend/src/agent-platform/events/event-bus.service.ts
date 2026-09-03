import { Injectable, Logger } from '@nestjs/common';
import { ERPEvent, ERPEventType, EventSubscriptionHandler, EventDispatchResult } from './event.types';
import { EventValidatorService } from './event-validator.service';
import { EventIdempotencyService } from './event-idempotency.service';
import { EventDispatcherService } from './event-dispatcher.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger('EventBusService');
  private readonly subscribers = new Map<string, Set<EventSubscriptionHandler>>();

  constructor(
    private readonly validator: EventValidatorService,
    private readonly idempotency: EventIdempotencyService,
    private readonly dispatcher: EventDispatcherService,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  /**
   * Publishes an event to the Event Bus with validation, idempotency, and audit logging.
   */
  async publish<T = Record<string, any>>(event: ERPEvent<T>): Promise<{ success: boolean; eventId: string; status: string; reason?: string }> {
    const correlationId = event.correlationId || `corr-evt-${Date.now()}`;
    const tenantId = event.tenantId || 'DEFAULT';

    // 1. Validate Event Structure
    const validation = this.validator.validateEvent(event as any);
    if (!validation.valid) {
      this.logger.warn(`Event validation failed: ${validation.errors.join(', ')}`);
      
      await this.auditLogger.logAction({
        agentCode: 'SYSTEM_EVENT_BUS',
        correlationId,
        eventType: 'EVENT_REJECTED',
        actionSummary: `Event rejected due to schema validation errors: ${validation.errors.join(', ')}`,
        payload: { event, errors: validation.errors },
        tenantId,
        actorType: 'TRIGGER_EVENT',
      });

      return {
        success: false,
        eventId: event.eventId,
        status: 'REJECTED',
        reason: validation.errors.join(', '),
      };
    }

    // 2. Check Idempotency & Deduplication
    const isDuplicate = await this.idempotency.isDuplicate(event as any);
    if (isDuplicate) {
      this.logger.warn(`Duplicate event suppressed: key='${event.idempotencyKey || event.eventId}'`);
      
      await this.auditLogger.logAction({
        agentCode: 'SYSTEM_EVENT_BUS',
        correlationId,
        eventType: 'EVENT_REJECTED',
        actionSummary: `Duplicate event suppressed: key='${event.idempotencyKey || event.eventId}'`,
        payload: { eventId: event.eventId, eventType: event.eventType },
        tenantId,
        actorType: 'TRIGGER_EVENT',
      });

      return {
        success: true,
        eventId: event.eventId,
        status: 'DUPLICATE_SUPPRESSED',
        reason: 'Event already processed or queued (Idempotency matched).',
      };
    }

    // 3. Record in Idempotency Store
    await this.idempotency.recordEvent(event as any);

    // 4. Audit Log: EVENT_PUBLISHED
    await this.auditLogger.logAction({
      agentCode: 'SYSTEM_EVENT_BUS',
      correlationId,
      eventType: 'EVENT_PUBLISHED',
      actionSummary: `Event '${event.eventType}' published by module '${event.sourceModule}' (Entity: ${event.entityType} #${event.entityId})`,
      payload: { eventId: event.eventId, eventType: event.eventType, sourceModule: event.sourceModule },
      tenantId,
      actorType: 'TRIGGER_EVENT',
      actorId: event.actorId,
    });

    // 5. Notify custom in-process subscribers
    const handlers = this.subscribers.get(event.eventType);
    if (handlers && handlers.size > 0) {
      for (const handler of handlers) {
        try {
          await handler(event as any);
        } catch (err: any) {
          this.logger.error(`Subscriber error for event '${event.eventType}': ${err.message}`);
        }
      }
    }

    // 6. Dispatch to Registered Agent Triggers
    const dispatchResult = await this.dispatcher.dispatchEvent(event as any);

    await this.idempotency.markStatus(
      event.idempotencyKey || event.eventId,
      dispatchResult.status === 'FAILED' ? 'FAILED' : 'PROCESSED',
      dispatchResult.error,
    );

    return {
      success: true,
      eventId: event.eventId,
      status: 'PUBLISHED_AND_DISPATCHED',
    };
  }

  /**
   * Subscribes a handler to an event type.
   */
  subscribe(eventType: ERPEventType, handler: EventSubscriptionHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
    this.logger.log(`Subscribed handler to event type '${eventType}'`);
  }

  /**
   * Unsubscribes a handler from an event type.
   */
  unsubscribe(eventType: ERPEventType, handler: EventSubscriptionHandler): boolean {
    const handlers = this.subscribers.get(eventType);
    if (!handlers) return false;
    return handlers.delete(handler);
  }
}
