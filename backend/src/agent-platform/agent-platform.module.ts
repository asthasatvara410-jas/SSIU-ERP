import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentAuditLoggerService } from './audit/agent-audit-logger.service';
import { AgentPermissionEngineService } from './permissions/agent-permission-engine.service';
import { AgentPolicyEngineService } from './policy/agent-policy-engine.service';
import { PolicyEngineService } from './policy/policy-engine.service';
import { PolicyController } from './policy/policy.controller';
import { AgentApprovalEngineService } from './approval/agent-approval-engine.service';
import { ApprovalEngineService } from './approval/approval-engine.service';
import { ApprovalController } from './approval/approval.controller';
import { AgentCommunicationService } from './communication/communication.service';
import { AgentToolRegistryService } from './tools/agent-tool-registry.service';
import { ToolRegistryService } from './tools/tool-registry.service';
import { ToolPermissionService } from './tools/tool-permission.service';
import { ToolValidationService } from './tools/tool-validation.service';
import { ToolRateLimitService } from './tools/tool-rate-limit.service';
import { ToolIdempotencyService } from './tools/tool-idempotency.service';
import { ToolTimeoutService } from './tools/tool-timeout.service';
import { ToolAuditService } from './tools/tool-audit.service';
import { ToolExecutionService } from './tools/tool-execution.service';
import { ToolPlatformController } from './tools/tool-platform.controller';
import { AgentEventBusService } from './events/agent-event-bus.service';
import { EventBusService } from './events/event-bus.service';
import { EventValidatorService } from './events/event-validator.service';
import { EventIdempotencyService } from './events/event-idempotency.service';
import { EventDispatcherService } from './events/event-dispatcher.service';
import { TriggerRegistryService } from './triggers/trigger-registry.service';
import { TriggerController } from './triggers/trigger.controller';
import { AgentRegistryService } from './registry/agent-registry.service';
import { AgentExecutionService } from './execution/agent-execution.service';
import { AgentSchedulerService } from './scheduler/agent-scheduler.service';
import { AIProviderService, GeminiProvider, OpenAIProvider } from './ai/ai-provider.service';
import { TimetableSubstitutionAgentService } from './agents/timetable-substitution-agent.service';
import { SmartDocumentVerifierAgentService } from './agents/smart-document-verifier-agent.service';
import { ProactiveFeeRecoveryAgentService } from './agents/proactive-fee-recovery-agent.service';
import { AgentOrchestratorService } from './orchestrator/agent-orchestrator.service';
import { 
  AgentPlatformController, 
  AgentsController, 
  AgentExecutionsController, 
  AgentJobsController, 
  AgentAuditController,
  AgentApprovalsController,
  AgentEventsController,
} from './controllers/agent-platform.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AgentsController,
    AgentExecutionsController,
    AgentJobsController,
    AgentAuditController,
    AgentApprovalsController,
    AgentEventsController,
    TriggerController,
    PolicyController,
    ApprovalController,
    ToolPlatformController,
    AgentPlatformController,
  ],
  providers: [
    AgentAuditLoggerService,
    AgentPermissionEngineService,
    AgentPolicyEngineService,
    PolicyEngineService,
    AgentApprovalEngineService,
    ApprovalEngineService,
    AgentCommunicationService,
    AgentToolRegistryService,
    ToolRegistryService,
    ToolPermissionService,
    ToolValidationService,
    ToolRateLimitService,
    ToolIdempotencyService,
    ToolTimeoutService,
    ToolAuditService,
    ToolExecutionService,
    AgentEventBusService,
    EventBusService,
    EventValidatorService,
    EventIdempotencyService,
    EventDispatcherService,
    TriggerRegistryService,
    AgentRegistryService,
    AgentExecutionService,
    AgentSchedulerService,
    GeminiProvider,
    OpenAIProvider,
    AIProviderService,
    TimetableSubstitutionAgentService,
    SmartDocumentVerifierAgentService,
    ProactiveFeeRecoveryAgentService,
    AgentOrchestratorService,
  ],
  exports: [
    AgentRegistryService,
    AgentExecutionService,
    AgentSchedulerService,
    AIProviderService,
    AgentOrchestratorService,
    AgentEventBusService,
    EventBusService,
    EventValidatorService,
    EventIdempotencyService,
    EventDispatcherService,
    TriggerRegistryService,
    PolicyEngineService,
    ApprovalEngineService,
    ToolRegistryService,
    ToolExecutionService,
    ToolPermissionService,
    ToolValidationService,
    ToolRateLimitService,
    ToolIdempotencyService,
    ToolTimeoutService,
    ToolAuditService,
    AgentToolRegistryService,
    AgentPolicyEngineService,
    AgentPermissionEngineService,
    AgentApprovalEngineService,
    AgentCommunicationService,
    AgentAuditLoggerService,
    TimetableSubstitutionAgentService,
    SmartDocumentVerifierAgentService,
    ProactiveFeeRecoveryAgentService,
  ],
})
export class AgentPlatformModule {}
