import { AgentKey } from '../types/agent.types';

export type ToolKey = 
  | 'TIMETABLE_GET'
  | 'TIMETABLE_FIND_FREE_FACULTY'
  | 'DMS_GET_DOCUMENT'
  | 'DMS_GET_DOCUMENT_METADATA'
  | 'FEES_GET_OUTSTANDING'
  | 'FEES_CREATE_PAYMENT_PLAN'
  | 'NOTIFICATION_SEND'
  | 'STUDENT_GET_PROFILE'
  | string;

export type ToolStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED';

export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ToolExecutionStatus = 
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REJECTED'
  | 'TIMEOUT'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_REJECTED'
  | 'RATE_LIMITED';

export type ToolErrorCode = 
  | 'TOOL_NOT_FOUND'
  | 'TOOL_DISABLED'
  | 'AGENT_NOT_ALLOWED'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'TENANT_SCOPE_VIOLATION'
  | 'PERMISSION_DENIED'
  | 'POLICY_DENIED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_REJECTED'
  | 'INVALID_INPUT'
  | 'INVALID_OUTPUT'
  | 'RATE_LIMITED'
  | 'DUPLICATE_EXECUTION'
  | 'EXECUTION_TIMEOUT'
  | 'TOOL_EXECUTION_FAILED'
  | 'SENSITIVE_OUTPUT_BLOCKED';

export interface ToolExecutionContext {
  executionId?: string;
  requestId?: string;
  correlationId?: string;
  tenantId: string;
  institutionId: string;
  actorUserId?: string;
  actorRole?: string;
  agentKey: AgentKey;
  idempotencyKey?: string;
  approvalToken?: string;
  dryRun?: boolean;
}

export type ToolHandler<TInput = any, TOutput = any> = (
  input: TInput,
  context: ToolExecutionContext,
) => Promise<TOutput>;

export interface ToolRateLimitConfig {
  requests: number;
  windowSeconds: number;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  key: ToolKey;
  name: string;
  description: string;
  version: string;
  status: ToolStatus;
  category: 'ACADEMIC' | 'DMS' | 'FINANCE' | 'COMMUNICATION' | 'STUDENT' | 'SYSTEM';
  riskLevel: ToolRiskLevel;
  allowedAgents: (AgentKey | 'ALL')[];
  requiredPermissions: string[];
  allowedTenants?: string[]; // undefined or empty means ALL
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresApproval: boolean;
  supportsDryRun: boolean;
  timeoutMs: number;
  rateLimit: ToolRateLimitConfig;
  idempotent: boolean;
  handler: ToolHandler<TInput, TOutput>;
}

export interface ToolExecutionResult<TData = any> {
  success: boolean;
  executionId: string;
  toolKey: ToolKey;
  status: ToolExecutionStatus;
  data?: TData;
  error?: {
    code: ToolErrorCode;
    message: string;
  };
  requiresApproval?: boolean;
  approvalId?: string;
  durationMs?: number;
  isDryRun?: boolean;
}
