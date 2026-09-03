import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TriggerDefinition, RegisterTriggerDto } from './trigger.types';
import { ERPEventType } from '../events/event.types';

@Injectable()
export class TriggerRegistryService implements OnModuleInit {
  private readonly logger = new Logger('TriggerRegistryService');
  private readonly triggers = new Map<string, TriggerDefinition>();

  onModuleInit() {
    this.seedDefaultTriggers();
  }

  seedDefaultTriggers(): void {
    const defaults: RegisterTriggerDto[] = [
      {
        triggerId: 'trig-tt-absence',
        eventType: 'FACULTY_ABSENCE_REPORTED',
        agentKey: 'TIMETABLE_SUBSTITUTION_AGENT',
        name: 'Faculty Absence Auto-Trigger',
        description: 'Triggers Timetable Substitution Agent when a faculty member reports absence.',
        enabled: true,
        tenantScope: 'ALL',
        priority: 1,
      },
      {
        triggerId: 'trig-doc-upload',
        eventType: 'DOCUMENT_UPLOADED',
        agentKey: 'DOCUMENT_VERIFICATION_AGENT',
        name: 'Document Upload OCR Trigger',
        description: 'Triggers Smart Document Verifier when a new student document is uploaded to DMS.',
        enabled: true,
        tenantScope: 'ALL',
        priority: 1,
      },
      {
        triggerId: 'trig-fee-overdue',
        eventType: 'FEE_OVERDUE',
        agentKey: 'FEE_RECOVERY_AGENT',
        name: 'Fee Overdue Recovery Trigger',
        description: 'Triggers Proactive Fee Recovery Agent when an invoice becomes overdue.',
        enabled: true,
        tenantScope: 'ALL',
        priority: 1,
      },
    ];

    for (const dto of defaults) {
      this.registerTrigger(dto);
    }
  }

  registerTrigger(dto: RegisterTriggerDto): TriggerDefinition {
    const triggerId = dto.triggerId || `trig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const trigger: TriggerDefinition = {
      triggerId,
      eventType: dto.eventType,
      agentKey: dto.agentKey,
      name: dto.name,
      description: dto.description || '',
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      tenantScope: dto.tenantScope || 'ALL',
      conditions: dto.conditions,
      priority: dto.priority || 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.triggers.set(triggerId, trigger);
    this.logger.log(`Registered trigger '${triggerId}' for event '${trigger.eventType}' ➔ agent '${trigger.agentKey}'`);
    return trigger;
  }

  getTriggersForEvent(eventType: ERPEventType, tenantId: string = 'DEFAULT'): TriggerDefinition[] {
    const matching: TriggerDefinition[] = [];

    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) continue;
      if (trigger.eventType !== eventType) continue;

      // Tenant Scope Check
      if (trigger.tenantScope !== 'ALL' && trigger.tenantScope !== tenantId) {
        continue;
      }

      matching.push(trigger);
    }

    return matching.sort((a, b) => a.priority - b.priority);
  }

  listTriggers(tenantId?: string): TriggerDefinition[] {
    const list = Array.from(this.triggers.values());
    if (!tenantId) return list;
    return list.filter(t => t.tenantScope === 'ALL' || t.tenantScope === tenantId);
  }

  getTrigger(triggerId: string): TriggerDefinition | undefined {
    return this.triggers.get(triggerId);
  }

  enableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;
    trigger.enabled = true;
    trigger.updatedAt = new Date();
    return true;
  }

  disableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;
    trigger.enabled = false;
    trigger.updatedAt = new Date();
    return true;
  }

  deleteTrigger(triggerId: string): boolean {
    return this.triggers.delete(triggerId);
  }
}
