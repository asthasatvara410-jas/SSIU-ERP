import { Injectable, ForbiddenException } from '@nestjs/common';
import { AgentCode } from '../types/agent.types';

@Injectable()
export class AgentPermissionEngineService {
  private readonly agentPermissions: Record<AgentCode, Set<string>> = {
    TIMETABLE_SUBSTITUTION: new Set([
      'timetable.read',
      'faculty.availability.read',
      'substitution.create',
      'timetable.update',
      'notification.send',
    ]),
    SMART_DOCUMENT_VERIFIER: new Set([
      'document.read',
      'ocr.execute',
      'student.verify',
      'document.verify',
      'document.review.create',
      'notification.send',
    ]),
    PROACTIVE_FEE_RECOVERY: new Set([
      'fees.read',
      'fee.policy.read',
      'communication.send',
      'emi.proposal.create',
      'emi.plan.create',
      'payment.link.create',
      'receipt.generate',
      'notification.send',
    ]),
  };

  validatePermission(
    agentCode: AgentCode,
    requiredPermission: string,
    context?: { tenantId?: string; targetTenantId?: string; departmentId?: string },
  ): void {
    const allowed = this.agentPermissions[agentCode];
    if (!allowed || !allowed.has(requiredPermission)) {
      throw new ForbiddenException(
        `Agent '${agentCode}' is not authorized to execute permission '${requiredPermission}'`,
      );
    }

    // Tenant boundary protection
    if (context?.tenantId && context?.targetTenantId && context.tenantId !== context.targetTenantId) {
      throw new ForbiddenException(
        `Cross-tenant execution blocked: agent tenant '${context.tenantId}' != target '${context.targetTenantId}'`,
      );
    }
  }

  isPermissionGranted(agentCode: AgentCode, permission: string): boolean {
    return !!this.agentPermissions[agentCode]?.has(permission);
  }
}
