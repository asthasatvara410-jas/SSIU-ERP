import { ERPEventType } from '../events/event.types';
import { AgentKey } from '../types/agent.types';

export interface TriggerDefinition {
  triggerId: string;
  eventType: ERPEventType;
  agentKey: AgentKey;
  name: string;
  description?: string;
  enabled: boolean;
  tenantScope: string; // 'ALL' or specific tenantId (e.g. 'DEFAULT')
  conditions?: Record<string, any>;
  priority: number; // 1 = highest
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterTriggerDto {
  triggerId?: string;
  eventType: ERPEventType;
  agentKey: AgentKey;
  name: string;
  description?: string;
  enabled?: boolean;
  tenantScope?: string;
  conditions?: Record<string, any>;
  priority?: number;
}
