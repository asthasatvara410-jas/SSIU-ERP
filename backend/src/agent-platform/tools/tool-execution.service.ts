import { Injectable, Logger } from '@nestjs/common';
import { 
  ToolDefinition, 
  ToolExecutionContext, 
  ToolExecutionResult, 
  ToolKey 
} from './tool.types';
import { ToolRegistryService } from './tool-registry.service';
import { ToolPermissionService } from './tool-permission.service';
import { ToolValidationService } from './tool-validation.service';
import { ToolRateLimitService } from './tool-rate-limit.service';
import { ToolIdempotencyService } from './tool-idempotency.service';
import { ToolTimeoutService } from './tool-timeout.service';
import { ToolAuditService } from './tool-audit.service';
import { PolicyEngineService } from '../policy/policy-engine.service';
import { ApprovalEngineService } from '../approval/approval-engine.service';

@Injectable()
export class ToolExecutionService {
  private readonly logger = new Logger('ToolExecutionService');

  constructor(
    private readonly registry: ToolRegistryService,
    private readonly permissions: ToolPermissionService,
    private readonly validator: ToolValidationService,
    private readonly rateLimiter: ToolRateLimitService,
    private readonly idempotency: ToolIdempotencyService,
    private readonly timeoutService: ToolTimeoutService,
    private readonly audit: ToolAuditService,
    private readonly policyEngine: PolicyEngineService,
    private readonly approvalEngine: ApprovalEngineService,
  ) {}

  /**
   * Executes a registered agent tool securely with end-to-end authorization, validation, rate limiting, and timeout guards.
   */
  async execute<TInput = any, TOutput = any>(
    toolKey: ToolKey,
    input: TInput,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult<TOutput>> {
    const startTime = Date.now();
    const executionId = context.executionId || `tool-exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tenantId = context.tenantId || 'DEFAULT';

    // 1. Tool Lookup
    const tool = this.registry.getTool(toolKey);
    if (!tool) {
      const failResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: 'FAILED',
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${toolKey}' is not registered in the Tool Registry.`,
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(undefined, context, failResult);
      return failResult;
    }

    // 2. Permission & Tenant Scope Verification
    const permCheck = this.permissions.evaluateToolPermission(tool, context);
    if (!permCheck.allowed) {
      const failResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: 'REJECTED',
        error: {
          code: permCheck.errorCode || 'PERMISSION_DENIED',
          message: permCheck.errorMessage || 'Tool execution permission denied.',
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, failResult);
      return failResult;
    }

    // 3. Policy Engine Evaluation
    const policyResult = await this.policyEngine.evaluate({
      tenantId,
      institutionId: context.institutionId || tenantId,
      actorId: context.actorUserId,
      actorRole: context.actorRole,
      agentKey: context.agentKey,
      resource: tool.category,
      action: tool.key,
      riskLevel: tool.riskLevel,
      isDryRun: context.dryRun,
    });

    if (policyResult.decision === 'DENY') {
      const failResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: 'REJECTED',
        error: {
          code: 'POLICY_DENIED',
          message: `Policy evaluation rejected tool invocation: ${policyResult.reason}`,
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, failResult);
      return failResult;
    }

    // 4. Approval Engine Evaluation
    const requiresApproval = tool.requiresApproval || policyResult.decision === 'REQUIRES_APPROVAL';
    if (requiresApproval && !context.approvalToken) {
      // Create approval ticket
      const ticket = await this.approvalEngine.createApprovalRequest({
        agentKey: context.agentKey,
        executionId,
        action: tool.key,
        resource: tool.category,
        resourceId: (input as any)?.resourceId || 'GLOBAL',
        requestedBy: context.actorUserId || 'SYSTEM_AGENT',
        reason: `Tool '${tool.key}' requires administrative authorization.`,
        riskLevel: tool.riskLevel,
        proposedChanges: input as any,
        assignedRole: policyResult.assignedRole || 'ADMIN',
        tenantId,
      });

      const approvalResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        approvalId: ticket.id,
        error: {
          code: 'APPROVAL_REQUIRED',
          message: `Action requires human authorization from '${policyResult.assignedRole || 'ADMIN'}'. Ticket #${ticket.id} created.`,
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, approvalResult);
      return approvalResult;
    }

    // 5. Input Validation
    const inputValidation = this.validator.validateInput(tool, input);
    if (!inputValidation.valid) {
      const failResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: 'FAILED',
        error: {
          code: inputValidation.errorCode || 'INVALID_INPUT',
          message: inputValidation.errorMessage || 'Invalid input payload.',
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, failResult);
      return failResult;
    }

    // 6. Rate Limiting Check
    const rateLimitKey = `${tenantId}:${context.agentKey}:${tool.key}`;
    if (this.rateLimiter.isRateLimited(rateLimitKey, tool.rateLimit)) {
      const failResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: 'RATE_LIMITED',
        error: {
          code: 'RATE_LIMITED',
          message: `Tool rate limit exceeded for '${tool.key}' (${tool.rateLimit.requests} reqs / ${tool.rateLimit.windowSeconds}s).`,
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, failResult);
      return failResult;
    }

    // 7. Idempotency Check
    let compositeIdempotencyKey: string | null = null;
    if (tool.idempotent && context.idempotencyKey) {
      compositeIdempotencyKey = this.idempotency.getCompositeKey(tenantId, tool.key, context.idempotencyKey);
      const previousResult = this.idempotency.getPreviousExecution(compositeIdempotencyKey);
      if (previousResult) {
        this.logger.log(`Returning cached idempotent result for composite key: '${compositeIdempotencyKey}'`);
        return previousResult as ToolExecutionResult<TOutput>;
      }
    }

    // 8. DRY-RUN Simulation Check
    if (context.dryRun) {
      const dryRunResult: ToolExecutionResult<TOutput> = {
        success: true,
        executionId,
        toolKey,
        status: 'SUCCESS',
        isDryRun: true,
        data: {
          simulated: true,
          toolKey: tool.key,
          riskLevel: tool.riskLevel,
          message: 'Dry-run validation successful. No persistent state mutated.',
          evaluatedInput: input,
        } as any,
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, dryRunResult);
      return dryRunResult;
    }

    // 9. Execute Tool Handler with Timeout Guard
    try {
      const rawOutput = await this.timeoutService.withTimeout(
        tool.handler(input, context),
        tool.timeoutMs || 10000,
        `Tool '${tool.key}' execution timed out.`,
      );

      // 10. Output Sanitization
      const sanitizedOutput = this.validator.sanitizeOutput(rawOutput);

      const successResult: ToolExecutionResult<TOutput> = {
        success: true,
        executionId,
        toolKey,
        status: 'SUCCESS',
        data: sanitizedOutput,
        durationMs: Date.now() - startTime,
      };

      if (compositeIdempotencyKey) {
        this.idempotency.recordExecution(compositeIdempotencyKey, successResult);
      }

      await this.audit.logToolExecution(tool, context, successResult);
      return successResult;
    } catch (err: any) {
      const isTimeout = err.message?.includes('EXECUTION_TIMEOUT');
      const failResult: ToolExecutionResult = {
        success: false,
        executionId,
        toolKey,
        status: isTimeout ? 'TIMEOUT' : 'FAILED',
        error: {
          code: isTimeout ? 'EXECUTION_TIMEOUT' : 'TOOL_EXECUTION_FAILED',
          message: isTimeout ? err.message : 'Tool execution handler encountered an internal error.',
        },
        durationMs: Date.now() - startTime,
      };
      await this.audit.logToolExecution(tool, context, failResult);
      return failResult;
    }
  }
}
