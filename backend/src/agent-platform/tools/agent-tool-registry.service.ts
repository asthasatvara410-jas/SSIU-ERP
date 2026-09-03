import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AgentContext, ToolDefinition } from '../types/agent.types';
import { AgentPermissionEngineService } from '../permissions/agent-permission-engine.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';

@Injectable()
export class AgentToolRegistryService {
  private readonly logger = new Logger('AgentToolRegistry');
  private readonly tools = new Map<string, ToolDefinition>();

  constructor(
    private readonly permissionEngine: AgentPermissionEngineService,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    this.logger.log(`Registered agent tool '${tool.name}'`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async executeTool(toolName: string, input: any, context: AgentContext): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new NotFoundException(`Tool '${toolName}' not registered in Agent Platform.`);
    }

    const agentKey = context.agentCode || context.agentKey;

    // Enforce Permission & Tenant Boundary
    this.permissionEngine.validatePermission(agentKey, tool.requiredPermission, {
      tenantId: context.tenantId,
    });

    const start = Date.now();
    try {
      const result = await tool.execute(input, context);
      const durationMs = Date.now() - start;

      await this.auditLogger.logAction({
        agentCode: agentKey,
        executionId: context.executionId,
        correlationId: context.correlationId,
        eventType: 'TOOL_EXECUTION_SUCCESS',
        actionSummary: `Executed tool '${toolName}' in ${durationMs}ms`,
        payload: { toolName, input, output: result, durationMs },
        tenantId: context.tenantId,
        actorType: 'SYSTEM_AGENT',
        actorId: agentKey,
      });

      return result;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      await this.auditLogger.logAction({
        agentCode: agentKey,
        executionId: context.executionId,
        correlationId: context.correlationId,
        eventType: 'TOOL_EXECUTION_FAILED',
        actionSummary: `Tool '${toolName}' failed: ${err.message}`,
        payload: { toolName, input, error: err.message, durationMs },
        tenantId: context.tenantId,
        actorType: 'SYSTEM_AGENT',
        actorId: agentKey,
      });
      throw err;
    }
  }
}
