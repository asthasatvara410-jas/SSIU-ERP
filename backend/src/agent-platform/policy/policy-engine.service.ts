import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { 
  PolicyEvaluationContext, 
  PolicyEvaluationResult, 
  AgentPolicyDefinition, 
  CreatePolicyDto, 
  ActionRiskLevel 
} from './policy.types';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';

@Injectable()
export class PolicyEngineService implements OnModuleInit {
  private readonly logger = new Logger('PolicyEngineService');
  private readonly policies = new Map<string, AgentPolicyDefinition>();

  constructor(private readonly auditLogger: AgentAuditLoggerService) {}

  onModuleInit() {
    this.seedDefaultPolicies();
  }

  /**
   * Evaluates an agent's requested action against deterministic server policies.
   * Safety invariant: DEFAULT DENY.
   */
  async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const correlationId = context.correlationId || `corr-pol-${Date.now()}`;
    const evaluatedAt = new Date();
    const riskLevel = context.riskLevel || this.classifyActionRisk(context.action);

    this.logger.log(
      `[POLICY_EVAL] Agent: '${context.agentKey}' | Action: '${context.action}' | Res: '${context.resource}' | Risk: '${riskLevel}' | Tenant: '${context.tenantId}'`,
    );

    // 1. Critical Hardcoded Security Boundary Checks (Highest Precedence)
    if (this.isProhibitedCriticalAction(context.action)) {
      const result: PolicyEvaluationResult = {
        decision: 'DENY',
        reason: `Action '${context.action}' is classified as a PROHIBITED_CRITICAL_ACTION and cannot be executed by autonomous agents.`,
        riskLevel: 'CRITICAL',
        approvalRequired: false,
        approvalMode: 'NONE',
        requiredApprovals: 0,
        evaluatedAt,
        correlationId,
      };
      await this.logEvaluationAudit(context, result);
      return result;
    }

    // 2. Tenant / Institution Isolation Check
    if (context.metadata?.targetTenantId && context.metadata.targetTenantId !== context.tenantId) {
      const result: PolicyEvaluationResult = {
        decision: 'DENY',
        reason: `Cross-tenant access prohibited. Source tenant '${context.tenantId}' cannot access target '${context.metadata.targetTenantId}'.`,
        riskLevel: 'CRITICAL',
        approvalRequired: false,
        approvalMode: 'NONE',
        requiredApprovals: 0,
        evaluatedAt,
        correlationId,
      };
      await this.logEvaluationAudit(context, result);
      return result;
    }

    // 3. Evaluate Registered Policies in Priority Order
    const candidatePolicies = this.findMatchingPolicies(context);

    // 3A. Precedence Check: Any Explicit DENY Rule overrides ALL ALLOW rules
    const explicitDeny = candidatePolicies.find(p => p.effect === 'DENY');
    if (explicitDeny) {
      const result: PolicyEvaluationResult = {
        decision: 'DENY',
        policyId: explicitDeny.policyId,
        policyVersion: explicitDeny.policyVersion,
        reason: `Explicit DENY policy '${explicitDeny.policyId}' forbids action '${context.action}' on resource '${context.resource}'.`,
        riskLevel,
        approvalRequired: false,
        approvalMode: 'NONE',
        requiredApprovals: 0,
        evaluatedAt,
        correlationId,
      };
      await this.logEvaluationAudit(context, result);
      return result;
    }

    // 3B. Check Explicit ALLOW Rules
    const matchingAllow = candidatePolicies.find(p => p.effect === 'ALLOW');
    if (matchingAllow) {
      if (matchingAllow.approvalRequired) {
        const result: PolicyEvaluationResult = {
          decision: 'REQUIRES_APPROVAL',
          policyId: matchingAllow.policyId,
          policyVersion: matchingAllow.policyVersion,
          reason: `Policy '${matchingAllow.policyId}' permits action '${context.action}' conditionally upon ${matchingAllow.approvalMode} (${matchingAllow.assignedRole || 'ADMIN'}).`,
          riskLevel,
          approvalRequired: true,
          approvalMode: matchingAllow.approvalMode,
          requiredApprovals: matchingAllow.requiredApprovals || 1,
          assignedRole: matchingAllow.assignedRole,
          evaluatedAt,
          correlationId,
        };
        await this.logEvaluationAudit(context, result);
        return result;
      }

      const result: PolicyEvaluationResult = {
        decision: 'ALLOW',
        policyId: matchingAllow.policyId,
        policyVersion: matchingAllow.policyVersion,
        reason: `Policy '${matchingAllow.policyId}' explicitly allows action '${context.action}'.`,
        riskLevel,
        approvalRequired: false,
        approvalMode: 'NONE',
        requiredApprovals: 0,
        evaluatedAt,
        correlationId,
      };
      await this.logEvaluationAudit(context, result);
      return result;
    }

    // 4. Default Precedence: DEFAULT DENY
    const defaultDenyResult: PolicyEvaluationResult = {
      decision: 'DENY',
      reason: `DEFAULT DENY: No matching policy permits action '${context.action}' on resource '${context.resource}' for agent '${context.agentKey}'.`,
      riskLevel,
      approvalRequired: false,
      approvalMode: 'NONE',
      requiredApprovals: 0,
      evaluatedAt,
      correlationId,
    };
    await this.logEvaluationAudit(context, defaultDenyResult);
    return defaultDenyResult;
  }

  /**
   * Action Risk Level Classification
   */
  classifyActionRisk(action: string): ActionRiskLevel {
    const act = action.toUpperCase();

    if (
      act.startsWith('DELETE_') || 
      act.includes('DISCOUNT') || 
      act.includes('WAIVER') || 
      act.includes('SECURITY_CONFIG') || 
      act.includes('RBAC')
    ) {
      return 'CRITICAL';
    }

    if (
      act.startsWith('UPDATE_') || 
      act.startsWith('CREATE_FEE_PLAN') || 
      act.startsWith('VERIFY_DOCUMENT_STATUS') || 
      act.startsWith('SEND_OFFICIAL_')
    ) {
      return 'HIGH';
    }

    if (
      act.startsWith('GENERATE_') || 
      act.startsWith('PROPOSE_') || 
      act.startsWith('DRAFT_') || 
      act.startsWith('PLAN_')
    ) {
      return 'MEDIUM';
    }

    return 'LOW'; // READ-only queries
  }

  private isProhibitedCriticalAction(action: string): boolean {
    const act = action.toUpperCase();
    const prohibited = [
      'DELETE_STUDENT_RECORD',
      'DELETE_FACULTY_RECORD',
      'FEE_WAIVER_DISCOUNT',
      'MODIFY_SECURITY_CONFIG',
      'BYPASS_RBAC',
      'EXECUTE_RAW_SQL',
    ];
    return prohibited.includes(act);
  }

  private findMatchingPolicies(context: PolicyEvaluationContext): AgentPolicyDefinition[] {
    return Array.from(this.policies.values())
      .filter(p => {
        if (!p.enabled) return false;

        // Tenant scope check
        if (p.tenantId !== 'ALL' && p.tenantId !== context.tenantId) return false;

        // Agent key check
        if (p.agentKey !== 'ALL' && p.agentKey !== context.agentKey) return false;

        // Resource match
        if (p.resource !== '*' && p.resource !== context.resource) return false;

        // Action match
        if (p.action !== '*' && p.action !== context.action) {
          if (p.action.endsWith('*')) {
            const prefix = p.action.slice(0, -1);
            if (!context.action.startsWith(prefix)) return false;
          } else {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  private async logEvaluationAudit(context: PolicyEvaluationContext, result: PolicyEvaluationResult): Promise<void> {
    const eventType = result.decision === 'ALLOW' ? 'POLICY_ALLOWED' : result.decision === 'DENY' ? 'POLICY_DENIED' : 'POLICY_EVALUATED';
    await this.auditLogger.logAction({
      agentCode: context.agentKey,
      correlationId: result.correlationId,
      eventType,
      actionSummary: `Policy evaluation for action '${context.action}' resulted in '${result.decision}'. Reason: ${result.reason}`,
      payload: { context, decision: result.decision, policyId: result.policyId, riskLevel: result.riskLevel },
      tenantId: context.tenantId || 'DEFAULT',
      actorType: 'SYSTEM_AGENT',
      actorId: context.actorId,
    });
  }

  seedDefaultPolicies(): void {
    const defaults: CreatePolicyDto[] = [
      // 1. Read-only permissions across ERP (LOW RISK)
      {
        policyId: 'pol-read-all',
        tenantId: 'ALL',
        institutionId: 'ALL',
        agentKey: 'ALL',
        action: 'READ_*',
        resource: '*',
        effect: 'ALLOW',
        approvalRequired: false,
        approvalMode: 'NONE',
        maxRiskLevel: 'LOW',
        priority: 10,
      },
      // 2. Timetable Substitution Planning (MEDIUM RISK)
      {
        policyId: 'pol-tt-plan',
        tenantId: 'ALL',
        institutionId: 'ALL',
        agentKey: 'TIMETABLE_SUBSTITUTION_AGENT',
        action: 'PLAN_SUBSTITUTION',
        resource: 'TIMETABLE',
        effect: 'ALLOW',
        approvalRequired: false,
        approvalMode: 'NONE',
        maxRiskLevel: 'MEDIUM',
        priority: 5,
      },
      // 3. Timetable Update Mutation (HIGH RISK - Requires HOD Approval)
      {
        policyId: 'pol-tt-update',
        tenantId: 'ALL',
        institutionId: 'ALL',
        agentKey: 'TIMETABLE_SUBSTITUTION_AGENT',
        action: 'UPDATE_TIMETABLE',
        resource: 'TIMETABLE',
        effect: 'ALLOW',
        approvalRequired: true,
        approvalMode: 'SINGLE_APPROVAL',
        requiredApprovals: 1,
        assignedRole: 'HOD',
        maxRiskLevel: 'HIGH',
        priority: 5,
      },
      // 4. Document Verification Status Update (HIGH RISK - Requires Student Section Approval)
      {
        policyId: 'pol-doc-verify',
        tenantId: 'ALL',
        institutionId: 'ALL',
        agentKey: 'DOCUMENT_VERIFICATION_AGENT',
        action: 'VERIFY_DOCUMENT_STATUS',
        resource: 'DOCUMENT',
        effect: 'ALLOW',
        approvalRequired: true,
        approvalMode: 'SINGLE_APPROVAL',
        requiredApprovals: 1,
        assignedRole: 'STUDENT_SECTION',
        maxRiskLevel: 'HIGH',
        priority: 5,
      },
      // 5. Fee EMI Plan Creation (HIGH RISK - Requires Multi-Approval by Finance + Registrar)
      {
        policyId: 'pol-fee-plan',
        tenantId: 'ALL',
        institutionId: 'ALL',
        agentKey: 'FEE_RECOVERY_AGENT',
        action: 'CREATE_FEE_PLAN',
        resource: 'FEE',
        effect: 'ALLOW',
        approvalRequired: true,
        approvalMode: 'MULTI_APPROVAL',
        requiredApprovals: 2,
        assignedRole: 'FINANCE_OFFICER',
        maxRiskLevel: 'HIGH',
        priority: 5,
      },
    ];

    for (const dto of defaults) {
      this.createPolicy(dto);
    }
  }

  createPolicy(dto: CreatePolicyDto): AgentPolicyDefinition {
    const policyId = dto.policyId || `pol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existing = this.policies.get(policyId);
    const policyVersion = existing ? existing.policyVersion + 1 : 1;

    const policy: AgentPolicyDefinition = {
      policyId,
      policyVersion,
      tenantId: dto.tenantId || 'ALL',
      institutionId: dto.institutionId || 'ALL',
      agentKey: dto.agentKey || 'ALL',
      action: dto.action,
      resource: dto.resource,
      effect: dto.effect,
      conditions: dto.conditions,
      approvalRequired: dto.approvalRequired || false,
      approvalMode: dto.approvalMode || 'NONE',
      requiredApprovals: dto.requiredApprovals || (dto.approvalRequired ? 1 : 0),
      assignedRole: dto.assignedRole,
      maxRiskLevel: dto.maxRiskLevel || 'LOW',
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      priority: dto.priority || 10,
      createdBy: 'SYSTEM_ADMIN',
      createdAt: existing ? existing.createdAt : new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(policyId, policy);
    return policy;
  }

  listPolicies(tenantId?: string): AgentPolicyDefinition[] {
    const list = Array.from(this.policies.values());
    if (!tenantId) return list;
    return list.filter(p => p.tenantId === 'ALL' || p.tenantId === tenantId);
  }

  getPolicy(policyId: string): AgentPolicyDefinition | undefined {
    return this.policies.get(policyId);
  }

  enablePolicy(policyId: string): boolean {
    const p = this.policies.get(policyId);
    if (!p) return false;
    p.enabled = true;
    p.updatedAt = new Date();
    return true;
  }

  disablePolicy(policyId: string): boolean {
    const p = this.policies.get(policyId);
    if (!p) return false;
    p.enabled = false;
    p.updatedAt = new Date();
    return true;
  }
}
