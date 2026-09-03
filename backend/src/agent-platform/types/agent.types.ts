export type AgentKey = 
  | 'TIMETABLE_SUBSTITUTION_AGENT'
  | 'DOCUMENT_VERIFICATION_AGENT'
  | 'FEE_RECOVERY_AGENT'
  | 'TIMETABLE_SUBSTITUTION'
  | 'DOCUMENT_VERIFIER'
  | 'FEE_RECOVERY'
  | string;

export type AgentCode = AgentKey;

export type AgentStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'DISABLED'
  | 'ERROR';

export type AutonomyLevel = 
  | 'ASSISTED'
  | 'APPROVAL_REQUIRED'
  | 'SEMI_AUTONOMOUS'
  | 'AUTONOMOUS';

export type ToolRiskLevel = 
  | 'READ_ONLY'
  | 'LOW_RISK'
  | 'MEDIUM_RISK'
  | 'HIGH_RISK'
  | 'CRITICAL';

export type AgentMode = 
  | 'LIVE'
  | 'DRY_RUN';

export type AgentType = 
  | 'TIMETABLE_SUBSTITUTION'
  | 'DOCUMENT_VERIFICATION'
  | 'FEE_RECOVERY'
  | 'NOTIFICATION'
  | 'ACADEMIC_SUPPORT'
  | 'ADMIN_OPERATIONS'
  | 'CUSTOM'
  | 'ACADEMIC'
  | 'DMS'
  | 'FINANCE'
  | 'GOVERNANCE';

export type TriggerEventType =
  | 'FACULTY_ABSENCE_REPORTED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_PROCESSING_REQUESTED'
  | 'FEE_OVERDUE'
  | 'FEE_PAYMENT_RECEIVED'
  | 'STUDENT_REQUEST_CREATED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'TIMETABLE_CHANGED'
  | 'EXAM_SCHEDULE_CHANGED'
  | 'TIMETABLE'
  | 'FACULTY_ABSENCE'
  | 'DOCUMENT_VERIFICATION_REQUIRED'
  | 'FEE_DUE'
  | 'FEE_DUE_SOON'
  | 'PAYMENT_RECEIVED'
  | 'STUDENT_PAYMENT_MESSAGE_RECEIVED'
  | 'STUDENT_PAYMENT_NEGOTIATION'
  | 'STUDENT_STATUS_CHANGED'
  | 'TIMETABLE_UPDATED'
  | 'DOCUMENT_VERIFIED'
  | 'EMI_PLAN_CREATED'
  | string;

export type ExecutionStatus = 
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REQUIRES_REVIEW'
  | 'PENDING'
  | 'SUCCESS'
  | 'RETRYING'
  | 'SKIPPED'
  | 'APPROVAL_REQUIRED'
  | 'PENDING_APPROVAL';

export type ApprovalStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type CommunicationChannel = 
  | 'IN_APP'
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'PUSH';

export interface AgentContext {
  executionId: string;
  correlationId: string;
  agentKey?: AgentKey;
  agentCode?: string;
  agentId?: string;
  triggerType: string;
  triggerSource?: string;
  institutionId?: string;
  tenantId?: string;
  departmentId?: string;
  studentId?: string;
  facultyId?: string;
  eventId?: string;
  conversationId?: string;
  actorUserId?: string;
  actorRole?: string;
  mode?: AgentMode;
  payload: Record<string, any>;
  startTime?: Date;
}

export interface AgentHandler {
  key: AgentKey;
  version: string;
  name: string;
  description: string;
  category: AgentType;
  autonomyLevel?: AutonomyLevel;
  validate(context: AgentContext): Promise<boolean>;
  canExecute(context: AgentContext): Promise<boolean>;
  execute(context: AgentContext): Promise<AgentExecutionResult>;
}

export interface AgentExecutionParams {
  agentKey: AgentKey;
  institutionId?: string;
  triggerType: string;
  triggerSource?: string;
  payload: Record<string, any>;
  correlationId?: string;
  idempotencyKey?: string;
  mode?: AgentMode;
  actorUserId?: string;
  actorRole?: string;
}

export interface AgentExecutionResult {
  executionId: string;
  agentKey?: AgentKey;
  agentCode?: string;
  institutionId?: string;
  mode?: AgentMode;
  status: ExecutionStatus;
  decisionSummary: string;
  actionsExecuted: Array<{
    actionType: string;
    toolName?: string;
    targetResource?: string;
    riskLevel?: ToolRiskLevel;
    status: 'SUCCESS' | 'FAILED' | 'DRY_RUN_SIMULATED' | 'WAITING_APPROVAL';
    output?: any;
  }>;
  approvalRequired?: {
    approvalId: string;
    resourceType: string;
    resourceId: string;
    riskLevel?: ToolRiskLevel;
    assignedRole: string;
    reason: string;
    proposedChanges?: any;
  };
  durationMs: number;
  error?: string;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  policyCode: string;
  score?: number;
  autoApprove?: boolean;
  autoApprovalAllowed?: boolean;
  requiresHumanReview?: boolean;
  assignedRole?: string;
  reason: string;
  violations?: string[];
  metrics?: Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  agentCode?: string;
  riskLevel?: ToolRiskLevel;
  requiredPermission: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  schema?: Record<string, any>;
  requiresApproval?: boolean;
  execute: (input: any, context: AgentContext) => Promise<any>;
}

export interface NotificationPayload {
  notificationId?: string;
  channel: CommunicationChannel;
  recipient: string;
  templateCode?: string;
  subject?: string;
  messageBody: string;
  entityType?: string;
  entityId?: string;
  agentExecutionId?: string;
  status?: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  failureReason?: string;
  tenantId?: string;
}

export interface AIProvider {
  providerName: 'GEMINI' | 'OPENAI' | 'MOCK';
  generate(prompt: string, options?: Record<string, any>): Promise<string>;
  classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
  extract(text: string, schema: Record<string, any>): Promise<Record<string, any>>;
  validate(content: string, rules: string[]): Promise<{ valid: boolean; reasons: string[] }>;
}
