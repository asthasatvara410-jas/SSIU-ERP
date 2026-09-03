import { Injectable, Logger, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentRegistryService } from '../registry/agent-registry.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';
import { AgentExecutionParams, AgentExecutionResult, AgentContext } from '../types/agent.types';

@Injectable()
export class AgentExecutionService {
  private readonly logger = new Logger('AgentExecutionService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly registry: AgentRegistryService,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  /**
   * Evaluates the global emergency kill switch.
   */
  isKillSwitchActive(): boolean {
    const sysEnabled = this.configService.get<string>('AGENT_SYSTEM_ENABLED');
    const agentsEnabled = this.configService.get<string>('AGENTS_ENABLED');

    if (sysEnabled === 'false' || agentsEnabled === 'false') {
      return true;
    }
    return false;
  }

  async executeAgent(params: AgentExecutionParams): Promise<AgentExecutionResult> {
    const startTime = new Date();
    const startMs = Date.now();
    const correlationId = params.correlationId || `corr-exec-${Date.now()}`;
    const executionId = `exec-${Date.now()}`;
    const mode = params.mode || 'DRY_RUN';
    const institutionId = params.institutionId || 'DEFAULT';

    this.logger.log(
      `[AGENT_EXECUTION_START] Agent: '${params.agentKey}' | Correlation: ${correlationId} | Mode: ${mode}`,
    );

    // 1. Emergency Kill Switch Check
    if (this.isKillSwitchActive()) {
      this.logger.warn(`[KILL_SWITCH] Global Agent Kill Switch is ACTIVE. Refusing execution for '${params.agentKey}'.`);
      return {
        executionId,
        agentKey: params.agentKey,
        institutionId,
        mode,
        status: 'SKIPPED',
        decisionSummary: 'Execution refused: Global Emergency Agent Kill Switch is active (AGENT_SYSTEM_ENABLED=false).',
        actionsExecuted: [],
        durationMs: Date.now() - startMs,
      };
    }

    // 2. Idempotency Check
    if (params.idempotencyKey) {
      const existingEvent = await this.prisma.automationEvent.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingEvent && existingEvent.status === 'PROCESSED') {
        this.logger.warn(
          `[IDEMPOTENCY_HIT] Execution with idempotency key '${params.idempotencyKey}' already completed. Returning cached status.`,
        );
        return {
          executionId: existingEvent.id,
          agentKey: params.agentKey,
          institutionId,
          mode,
          status: 'SUCCESS',
          decisionSummary: `Idempotency matched: Event '${params.idempotencyKey}' already executed. Duplicate execution suppressed.`,
          actionsExecuted: [],
          durationMs: Date.now() - startMs,
        };
      }
    }

    // 3. Agent Existence & Database Record
    const dbAgent = await this.prisma.agent.findUnique({
      where: { code: params.agentKey },
    });

    if (!dbAgent) {
      throw new NotFoundException(`Agent '${params.agentKey}' is not registered in the system.`);
    }

    // 4. Agent Status Validation
    if (dbAgent.status !== 'ACTIVE') {
      this.logger.warn(`Agent '${params.agentKey}' status is '${dbAgent.status}'. Execution refused.`);
      
      await this.auditLogger.logAction({
        agentId: dbAgent.id,
        agentCode: params.agentKey,
        executionId,
        correlationId,
        eventType: 'EXECUTION_REFUSED_INACTIVE',
        actionSummary: `Execution refused: Agent status is '${dbAgent.status}' (requires 'ACTIVE').`,
        payload: { agentKey: params.agentKey, status: dbAgent.status },
        tenantId: institutionId,
      });

      return {
        executionId,
        agentKey: params.agentKey,
        institutionId,
        mode,
        status: 'SKIPPED',
        decisionSummary: `Execution refused: Agent '${params.agentKey}' is ${dbAgent.status} (Foundation ready, agent logic not active).`,
        actionsExecuted: [],
        durationMs: Date.now() - startMs,
      };
    }

    // 5. Tenant Boundary Check
    if (dbAgent.tenantId !== 'DEFAULT' && dbAgent.tenantId !== institutionId) {
      throw new ForbiddenException(
        `Cross-institution execution blocked: Agent institution '${dbAgent.tenantId}' != Request '${institutionId}'`,
      );
    }

    // 6. Check Handler in Registry
    const handler = this.registry.get(params.agentKey);
    if (!handler) {
      return {
        executionId,
        agentKey: params.agentKey,
        institutionId,
        mode,
        status: 'SKIPPED',
        decisionSummary: `Foundation Ready: Agent '${params.agentKey}' handler logic is NOT IMPLEMENTED yet.`,
        actionsExecuted: [],
        durationMs: Date.now() - startMs,
      };
    }

    const context: AgentContext = {
      executionId,
      correlationId,
      agentKey: params.agentKey,
      agentId: dbAgent.id,
      triggerType: params.triggerType,
      triggerSource: params.triggerSource,
      institutionId,
      tenantId: institutionId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      mode,
      payload: params.payload,
      startTime,
    };

    // 7. Execute Handler with Retry Support
    let attempts = 0;
    const maxRetries = 3;
    let lastError: any = null;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const canRun = await handler.canExecute(context);
        if (!canRun) {
          return {
            executionId,
            agentKey: params.agentKey,
            institutionId,
            mode,
            status: 'SKIPPED',
            decisionSummary: `Agent '${params.agentKey}' conditions not met for trigger '${params.triggerType}'.`,
            actionsExecuted: [],
            durationMs: Date.now() - startMs,
          };
        }

        const result = await handler.execute(context);
        const durationMs = Date.now() - startMs;

        // If DRY RUN mode, ensure simulated tagging
        if (mode === 'DRY_RUN') {
          result.decisionSummary = `[DRY_RUN SIMULATION] ${result.decisionSummary}`;
        }

        await this.auditLogger.logAction({
          agentId: dbAgent.id,
          agentCode: params.agentKey,
          executionId,
          correlationId,
          eventType: 'AGENT_EXECUTION_COMPLETED',
          actionSummary: `Completed execution of agent '${params.agentKey}' in mode '${mode}' (${durationMs}ms)`,
          payload: { resultSummary: result.decisionSummary, mode, durationMs },
          tenantId: institutionId,
        });

        return {
          ...result,
          durationMs,
        };
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Execution attempt ${attempts}/${maxRetries} failed: ${err.message}`);

        // Non-retryable errors
        const isNonRetryable = 
          err instanceof ForbiddenException || 
          err instanceof BadRequestException || 
          err.message?.includes('Validation') || 
          err.message?.includes('Idempotency') ||
          err.message?.includes('Unauthorized');

        if (isNonRetryable || attempts >= maxRetries) {
          break;
        }

        // Exponential backoff delay simulation
        const delayMs = Math.min(100 * Math.pow(2, attempts), 1000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const durationMs = Date.now() - startMs;
    await this.auditLogger.logAction({
      agentId: dbAgent.id,
      agentCode: params.agentKey,
      executionId,
      correlationId,
      eventType: 'AGENT_EXECUTION_FAILED',
      actionSummary: `Agent '${params.agentKey}' failed after ${attempts} attempts: ${lastError?.message}`,
      payload: { error: lastError?.message, attempts, durationMs },
      tenantId: institutionId,
    });

    return {
      executionId,
      agentKey: params.agentKey,
      institutionId,
      mode,
      status: 'FAILED',
      decisionSummary: `Execution failed: ${lastError?.message}`,
      actionsExecuted: [],
      durationMs,
      error: lastError?.message,
    };
  }
}
