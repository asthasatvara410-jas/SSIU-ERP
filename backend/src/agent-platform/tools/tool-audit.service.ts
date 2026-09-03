import { Injectable, Logger } from '@nestjs/common';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';
import { ToolDefinition, ToolExecutionContext, ToolExecutionResult } from './tool.types';

@Injectable()
export class ToolAuditService {
  private readonly logger = new Logger('ToolAuditService');

  constructor(private readonly auditLogger: AgentAuditLoggerService) {}

  async logToolExecution(
    tool: ToolDefinition | undefined,
    context: ToolExecutionContext,
    result: ToolExecutionResult,
  ): Promise<void> {
    const correlationId = context.correlationId || `corr-tool-${Date.now()}`;
    const eventType = result.success ? 'TOOL_EXECUTION_COMPLETED' : 'TOOL_EXECUTION_FAILED';

    await this.auditLogger.logAction({
      agentCode: context.agentKey,
      correlationId,
      eventType: eventType as any,
      actionSummary: `Tool '${result.toolKey}' [${result.status}] Duration: ${result.durationMs || 0}ms`,
      payload: {
        executionId: result.executionId,
        toolKey: result.toolKey,
        status: result.status,
        durationMs: result.durationMs,
        isDryRun: result.isDryRun,
        errorCode: result.error?.code,
        errorMessage: result.error?.message,
      },
      tenantId: context.tenantId || 'DEFAULT',
      actorType: 'SYSTEM_AGENT',
      actorId: context.actorUserId,
    });
  }
}
