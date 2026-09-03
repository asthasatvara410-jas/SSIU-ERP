import { Injectable, Logger } from '@nestjs/common';
import { ToolDefinition, ToolExecutionContext, ToolErrorCode } from './tool.types';

@Injectable()
export class ToolPermissionService {
  private readonly logger = new Logger('ToolPermissionService');

  /**
   * Evaluates all authorization and tenant boundary conditions for tool execution.
   */
  evaluateToolPermission(
    tool: ToolDefinition,
    context: ToolExecutionContext,
  ): { allowed: boolean; errorCode?: ToolErrorCode; errorMessage?: string } {
    // 1. Tool Status Check
    if (tool.status !== 'ACTIVE') {
      return {
        allowed: false,
        errorCode: 'TOOL_DISABLED',
        errorMessage: `Tool '${tool.key}' is currently '${tool.status}' and cannot be executed.`,
      };
    }

    // 2. Mandatory Tenant & Institution Context
    if (!context.tenantId || !context.institutionId) {
      return {
        allowed: false,
        errorCode: 'TENANT_CONTEXT_REQUIRED',
        errorMessage: 'Tool execution requires explicit, server-verified tenantId and institutionId.',
      };
    }

    // 3. Allowed Tenants Scope
    if (tool.allowedTenants && tool.allowedTenants.length > 0) {
      if (!tool.allowedTenants.includes(context.tenantId) && !tool.allowedTenants.includes('ALL')) {
        return {
          allowed: false,
          errorCode: 'TENANT_SCOPE_VIOLATION',
          errorMessage: `Tenant '${context.tenantId}' is not authorized to invoke tool '${tool.key}'.`,
        };
      }
    }

    // 4. Allowed Agents Check
    const agentAllowed = tool.allowedAgents.includes('ALL') || tool.allowedAgents.includes(context.agentKey);
    if (!agentAllowed) {
      return {
        allowed: false,
        errorCode: 'AGENT_NOT_ALLOWED',
        errorMessage: `Agent '${context.agentKey}' is not in the authorized agent list for tool '${tool.key}'.`,
      };
    }

    // 5. RBAC Role & Permission Verification
    if (context.actorRole === 'STUDENT' && tool.riskLevel !== 'LOW') {
      return {
        allowed: false,
        errorCode: 'PERMISSION_DENIED',
        errorMessage: 'Student role is strictly prohibited from invoking administrative or modifying agent tools.',
      };
    }

    return { allowed: true };
  }
}
