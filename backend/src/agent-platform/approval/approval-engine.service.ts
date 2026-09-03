import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';
import { PolicyEngineService } from '../policy/policy-engine.service';
import { ActionRiskLevel } from '../policy/policy.types';
import * as crypto from 'crypto';

export interface CreateApprovalRequestDto {
  agentKey: string;
  executionId: string;
  action: string;
  resource: string;
  resourceId: string;
  requestedBy: string;
  reason: string;
  riskLevel: ActionRiskLevel;
  eventId?: string;
  correlationId?: string;
  policyId?: string;
  proposedChanges: Record<string, any>;
  assignedRole: string;
  requiredApprovals?: number;
  expiresInHours?: number;
  tenantId?: string;
}

export interface ReviewerDecisionDto {
  approvalId: string;
  reviewerUserId: string;
  reviewerRole: string;
  tenantId?: string;
  reason?: string;
}

export interface RevalidationContext {
  tenantId: string;
  agentKey: string;
  action: string;
  resource: string;
  resourceId: string;
  isDryRun?: boolean;
}

@Injectable()
export class ApprovalEngineService {
  private readonly logger = new Logger('ApprovalEngineService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AgentAuditLoggerService,
    private readonly policyEngine: PolicyEngineService,
  ) {}

  /**
   * 1. Creates an immutable approval ticket with expiration timestamp.
   */
  async createApprovalRequest(dto: CreateApprovalRequestDto) {
    const tenantId = dto.tenantId || 'DEFAULT';
    const correlationId = dto.correlationId || `corr-appr-${Date.now()}`;
    const requiredApprovals = dto.requiredApprovals || 1;
    const expiresInHours = dto.expiresInHours || 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const ticket = await this.prisma.agentApproval.create({
      data: {
        agentId: dto.agentKey,
        executionId: dto.executionId,
        resourceType: dto.resource,
        resourceId: dto.resourceId,
        requestedData: {
          action: dto.action,
          proposedChanges: dto.proposedChanges,
          policyId: dto.policyId,
          riskLevel: dto.riskLevel,
          requiredApprovals,
          receivedApprovals: [],
          expiresAt: expiresAt.toISOString(),
        },
        assignedRole: dto.assignedRole,
        decisionReason: dto.reason,
        status: 'PENDING',
        tenantId,
      },
    });

    // Audit Log: APPROVAL_REQUESTED
    await this.auditLogger.logAction({
      agentCode: dto.agentKey,
      correlationId,
      eventType: 'APPROVAL_REQUESTED',
      actionSummary: `Approval requested for action '${dto.action}' on ${dto.resource} #${dto.resourceId} (Role: ${dto.assignedRole})`,
      payload: { approvalId: ticket.id, action: dto.action, riskLevel: dto.riskLevel, expiresAt },
      tenantId,
      actorType: 'SYSTEM_AGENT',
      actorId: dto.requestedBy,
    });

    return ticket;
  }

  /**
   * 2. Lists pending approval tickets for a given role and tenant.
   */
  async listPendingApprovals(role?: string, tenantId: string = 'DEFAULT') {
    const approvals = await this.prisma.agentApproval.findMany({
      where: {
        status: 'PENDING',
        tenantId,
        ...(role ? { assignedRole: role } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out expired items and update their status in background
    const active: any[] = [];
    const now = new Date();

    for (const app of approvals) {
      const data = app.requestedData as any;
      const expiresAt = data?.expiresAt ? new Date(data.expiresAt) : null;

      if (expiresAt && expiresAt < now) {
        await this.prisma.agentApproval.update({
          where: { id: app.id },
          data: { status: 'EXPIRED' },
        });
        await this.auditLogger.logAction({
          agentCode: app.agentId,
          correlationId: `corr-exp-${app.id}`,
          eventType: 'APPROVAL_EXPIRED',
          actionSummary: `Approval ticket '${app.id}' expired automatically.`,
          payload: { approvalId: app.id, expiredAt: now },
          tenantId,
          actorType: 'SYSTEM_AGENT',
        });
      } else {
        active.push(app);
      }
    }

    return active;
  }

  /**
   * 3. Fetches approval details by ID.
   */
  async getApprovalDetails(approvalId: string, tenantId: string = 'DEFAULT') {
    const ticket = await this.prisma.agentApproval.findUnique({
      where: { id: approvalId },
    });
    if (!ticket) throw new NotFoundException(`Approval ticket '${approvalId}' not found.`);

    if (ticket.tenantId !== tenantId && tenantId !== 'DEFAULT') {
      throw new ForbiddenException('Cross-tenant access prohibited for approval review.');
    }

    return ticket;
  }

  /**
   * 4. Approves an approval ticket (Supports Single and Multi-Approval).
   */
  async approve(dto: ReviewerDecisionDto) {
    const ticket = await this.getApprovalDetails(dto.approvalId, dto.tenantId);

    if (ticket.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve ticket in status '${ticket.status}'.`);
    }

    // Role Verification
    if (ticket.assignedRole !== 'ADMIN' && ticket.assignedRole !== dto.reviewerRole && dto.reviewerRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(`User role '${dto.reviewerRole}' is not authorized to approve tickets assigned to '${ticket.assignedRole}'.`);
    }

    const requestedData = (ticket.requestedData as any) || {};
    const requiredApprovals = requestedData.requiredApprovals || 1;
    const receivedApprovals: Array<{ userId: string; role: string; approvedAt: string }> = requestedData.receivedApprovals || [];

    // Duplicate Reviewer Prevention
    if (receivedApprovals.some(r => r.userId === dto.reviewerUserId)) {
      throw new BadRequestException('Reviewer has already approved this request. Multi-approval requires distinct reviewers.');
    }

    receivedApprovals.push({
      userId: dto.reviewerUserId,
      role: dto.reviewerRole,
      approvedAt: new Date().toISOString(),
    });

    const isFullyApproved = receivedApprovals.length >= requiredApprovals;
    const newStatus = isFullyApproved ? 'APPROVED' : 'PENDING';

    // Generate secure execution token if fully approved
    const executionToken = isFullyApproved 
      ? crypto.createHmac('sha256', 'SSIU_ERP_APPROVAL_SECRET').update(`${ticket.id}-${Date.now()}`).digest('hex')
      : null;

    const updated = await this.prisma.agentApproval.update({
      where: { id: dto.approvalId },
      data: {
        status: newStatus,
        actionTakenBy: dto.reviewerUserId,
        actionTakenAt: new Date(),
        decisionReason: dto.reason || 'Approved by authorized reviewer.',
        requestedData: {
          ...requestedData,
          receivedApprovals,
          executionToken,
        },
      },
    });

    // Audit Log: APPROVAL_APPROVED
    await this.auditLogger.logAction({
      agentCode: ticket.agentId,
      correlationId: `corr-appr-${ticket.id}`,
      eventType: 'APPROVAL_APPROVED',
      actionSummary: `Approval ${isFullyApproved ? 'COMPLETED' : 'PROGRESS'} for ticket '${ticket.id}' by ${dto.reviewerRole} #${dto.reviewerUserId} (${receivedApprovals.length}/${requiredApprovals})`,
      payload: { approvalId: ticket.id, reviewerUserId: dto.reviewerUserId, status: newStatus, isFullyApproved },
      tenantId: ticket.tenantId,
      actorType: 'HUMAN_APPROVER',
      actorId: dto.reviewerUserId,
    });

    return {
      success: true,
      approvalId: ticket.id,
      status: newStatus,
      approvalsCount: receivedApprovals.length,
      requiredApprovals,
      executionToken,
    };
  }

  /**
   * 5. Rejects an approval ticket.
   */
  async reject(dto: ReviewerDecisionDto) {
    const ticket = await this.getApprovalDetails(dto.approvalId, dto.tenantId);

    if (ticket.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject ticket in status '${ticket.status}'.`);
    }

    const updated = await this.prisma.agentApproval.update({
      where: { id: dto.approvalId },
      data: {
        status: 'REJECTED',
        actionTakenBy: dto.reviewerUserId,
        actionTakenAt: new Date(),
        decisionReason: dto.reason || 'Rejected by authorized reviewer.',
      },
    });

    // Audit Log: APPROVAL_REJECTED
    await this.auditLogger.logAction({
      agentCode: ticket.agentId,
      correlationId: `corr-rej-${ticket.id}`,
      eventType: 'APPROVAL_REJECTED',
      actionSummary: `Approval REJECTED for ticket '${ticket.id}' by ${dto.reviewerRole} #${dto.reviewerUserId}: ${dto.reason}`,
      payload: { approvalId: ticket.id, reviewerUserId: dto.reviewerUserId, reason: dto.reason },
      tenantId: ticket.tenantId,
      actorType: 'HUMAN_APPROVER',
      actorId: dto.reviewerUserId,
    });

    return {
      success: true,
      approvalId: ticket.id,
      status: 'REJECTED',
    };
  }

  /**
   * 6. Cancels an approval ticket.
   */
  async cancel(approvalId: string, cancelledBy: string, tenantId: string = 'DEFAULT') {
    const ticket = await this.getApprovalDetails(approvalId, tenantId);

    if (ticket.status !== 'PENDING') {
      throw new BadRequestException(`Cannot cancel ticket in status '${ticket.status}'.`);
    }

    await this.prisma.agentApproval.update({
      where: { id: approvalId },
      data: { status: 'CANCELLED' },
    });

    // Audit Log: APPROVAL_CANCELLED
    await this.auditLogger.logAction({
      agentCode: ticket.agentId,
      correlationId: `corr-canc-${ticket.id}`,
      eventType: 'APPROVAL_CANCELLED',
      actionSummary: `Approval CANCELLED for ticket '${ticket.id}' by user #${cancelledBy}`,
      payload: { approvalId: ticket.id, cancelledBy },
      tenantId: ticket.tenantId,
      actorType: 'HUMAN_APPROVER',
      actorId: cancelledBy,
    });

    return { success: true, status: 'CANCELLED' };
  }

  /**
   * 7. CRITICAL APPROVAL REVALIDATION (Pre-Execution Security Check)
   */
  async revalidateApproval(approvalId: string, context: RevalidationContext): Promise<{ valid: boolean; reason: string }> {
    const ticket = await this.prisma.agentApproval.findUnique({
      where: { id: approvalId },
    });

    if (!ticket) {
      return { valid: false, reason: 'Approval ticket not found.' };
    }

    // 1. Status Check
    if (ticket.status !== 'APPROVED') {
      return { valid: false, reason: `Ticket status is '${ticket.status}' (must be 'APPROVED').` };
    }

    // 2. Expiration Check
    const data = (ticket.requestedData as any) || {};
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      await this.prisma.agentApproval.update({
        where: { id: ticket.id },
        data: { status: 'EXPIRED' },
      });
      return { valid: false, reason: 'Approval ticket has expired prior to execution.' };
    }

    // 3. Tenant Isolation Check
    if (ticket.tenantId !== context.tenantId && context.tenantId !== 'DEFAULT') {
      return { valid: false, reason: `Tenant mismatch: Ticket tenant '${ticket.tenantId}' != Context tenant '${context.tenantId}'.` };
    }

    // 4. Resource & Action Check
    if (ticket.resourceId !== context.resourceId) {
      return { valid: false, reason: `Resource ID mismatch: '${ticket.resourceId}' != '${context.resourceId}'.` };
    }

    // 5. DRY_RUN Protection
    if (context.isDryRun) {
      return { valid: false, reason: 'Cannot mutate production state in DRY_RUN mode.' };
    }

    // 6. Policy Re-check
    const currentPolicy = await this.policyEngine.evaluate({
      tenantId: context.tenantId,
      institutionId: context.tenantId,
      agentKey: context.agentKey as any,
      resource: context.resource,
      resourceId: context.resourceId,
      action: context.action,
    });

    if (currentPolicy.decision === 'DENY') {
      return { valid: false, reason: `Underlying policy has been revoked or changed to DENY (${currentPolicy.reason}).` };
    }

    // Audit Log: APPROVAL_REVALIDATED & EXECUTION_AUTHORIZED
    await this.auditLogger.logAction({
      agentCode: context.agentKey,
      correlationId: `corr-reval-${approvalId}`,
      eventType: 'EXECUTION_AUTHORIZED',
      actionSummary: `Pre-execution revalidation PASSED for approval ticket '${approvalId}'`,
      payload: { approvalId, action: context.action, resourceId: context.resourceId },
      tenantId: context.tenantId,
      actorType: 'SYSTEM_AGENT',
    });

    return { valid: true, reason: 'Approval successfully revalidated and authorized for execution.' };
  }
}
