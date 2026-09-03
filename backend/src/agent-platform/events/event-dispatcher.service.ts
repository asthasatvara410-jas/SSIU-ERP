import { Injectable, Logger } from '@nestjs/common';
import { ERPEvent, EventDispatchResult } from './event.types';
import { TriggerRegistryService } from '../triggers/trigger-registry.service';
import { AgentRegistryService } from '../registry/agent-registry.service';
import { AgentExecutionService } from '../execution/agent-execution.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';

@Injectable()
export class EventDispatcherService {
  private readonly logger = new Logger('EventDispatcherService');

  constructor(
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly agentRegistry: AgentRegistryService,
    private readonly executionService: AgentExecutionService,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  /**
   * Dispatches an authorized event to all registered and enabled agent triggers.
   */
  async dispatchEvent(event: ERPEvent): Promise<EventDispatchResult> {
    const start = new Date();
    const correlationId = event.correlationId || `corr-disp-${Date.now()}`;
    const tenantId = event.tenantId || 'DEFAULT';

    this.logger.log(
      `[EVENT_DISPATCH] Type: '${event.eventType}' | Tenant: '${tenantId}' | EventID: '${event.eventId}'`,
    );

    // 1. Identify matching triggers for this event and tenant
    const matchingTriggers = this.triggerRegistry.getTriggersForEvent(event.eventType, tenantId);

    if (matchingTriggers.length === 0) {
      this.logger.log(`No active triggers registered for event type '${event.eventType}' (tenant: ${tenantId})`);
      return {
        eventId: event.eventId,
        eventType: event.eventType,
        tenantId,
        triggersMatched: 0,
        agentsInvoked: [],
        dispatchedAt: start,
        status: 'NO_MATCHING_TRIGGER',
      };
    }

    const agentsInvoked: string[] = [];

    // Audit Log: EVENT_DISPATCHED
    await this.auditLogger.logAction({
      agentCode: 'SYSTEM_EVENT_BUS',
      correlationId,
      eventType: 'EVENT_DISPATCHED',
      actionSummary: `Dispatched event '${event.eventType}' to ${matchingTriggers.length} matching triggers`,
      payload: { eventId: event.eventId, eventType: event.eventType, triggersCount: matchingTriggers.length },
      tenantId,
      actorType: 'TRIGGER_EVENT',
      actorId: event.actorId,
    });

    // 2. Dispatch to each target agent
    for (const trigger of matchingTriggers) {
      const agentKey = trigger.agentKey;
      agentsInvoked.push(agentKey);

      try {
        await this.executionService.executeAgent({
          agentKey,
          institutionId: tenantId,
          triggerType: event.eventType,
          triggerSource: event.sourceModule,
          payload: event.payload,
          correlationId,
          idempotencyKey: event.idempotencyKey || event.eventId,
          mode: 'DRY_RUN',
        });
      } catch (err: any) {
        this.logger.error(`Error executing agent '${agentKey}' on trigger '${trigger.triggerId}': ${err.message}`);
      }
    }

    return {
      eventId: event.eventId,
      eventType: event.eventType,
      tenantId,
      triggersMatched: matchingTriggers.length,
      agentsInvoked,
      dispatchedAt: start,
      status: 'DISPATCHED',
    };
  }
}
