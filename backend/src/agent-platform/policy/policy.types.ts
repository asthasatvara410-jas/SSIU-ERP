import { AgentKey } from '../types/agent.types';

export type PolicyEffect = 'ALLOW' | 'DENY';

export type ApprovalMode = 'NONE' | 'SINGLE_APPROVAL' | 'MULTI_APPROVAL' | 'ROLE_APPROVAL';

export type ActionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PolicyEvaluationDecision = 'ALLOW' | 'DENY' | 'REQUIRES_APPROVAL';

export interface PolicyEvaluationContext {
  tenantId: string;
  institutionId: string;
  actorId?: string;
  actorRole?: string;
  agentKey: AgentKey;
  eventId?: string;
  correlationId?: string;
  resource: string;
  resourceId?: string;
  action: string;
  requestedOperation?: string;
  riskLevel?: ActionRiskLevel;
  metadata?: Record<string, any>;
  isDryRun?: boolean;
}

export interface PolicyEvaluationResult {
  decision: PolicyEvaluationDecision;
  policyId?: string;
  policyVersion?: number;
  reason: string;
  riskLevel: ActionRiskLevel;
  approvalRequired: boolean;
  approvalMode: ApprovalMode;
  requiredApprovals: number;
  assignedRole?: string;
  evaluatedAt: Date;
  correlationId: string;
}

export interface AgentPolicyDefinition {
  policyId: string;
  policyVersion: number;
  tenantId: string;
  institutionId: string;
  agentKey: string; // 'ALL' or specific AgentKey
  action: string;   // 'READ_*', 'UPDATE_TIMETABLE', 'VERIFY_DOCUMENT', '*'
  resource: string; // 'TIMETABLE', 'DOCUMENT', 'FEE', '*'
  effect: PolicyEffect;
  conditions?: Record<string, any>;
  approvalRequired: boolean;
  approvalMode: ApprovalMode;
  requiredApprovals: number;
  assignedRole?: string;
  maxRiskLevel: ActionRiskLevel;
  enabled: boolean;
  priority: number; // 1 = highest
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicyDto {
  policyId?: string;
  tenantId?: string;
  institutionId?: string;
  agentKey?: string;
  action: string;
  resource: string;
  effect: PolicyEffect;
  conditions?: Record<string, any>;
  approvalRequired?: boolean;
  approvalMode?: ApprovalMode;
  requiredApprovals?: number;
  assignedRole?: string;
  maxRiskLevel?: ActionRiskLevel;
  enabled?: boolean;
  priority?: number;
}
