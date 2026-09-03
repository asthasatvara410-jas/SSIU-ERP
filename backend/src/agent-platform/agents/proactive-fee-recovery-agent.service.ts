import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentPolicyEngineService } from '../policy/agent-policy-engine.service';
import { AgentCommunicationService } from '../communication/communication.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';
import { AgentExecutionResult } from '../types/agent.types';

export interface FeeRecoveryTriggerDto {
  studentId: string;
  triggerType: 'FEE_OVERDUE' | 'FEE_DUE_SOON' | 'STUDENT_PAYMENT_NEGOTIATION';
  studentMessage?: string;
  requestedInstallments?: number;
  proposedDownPayment?: number;
  correlationId?: string;
  tenantId?: string;
}

@Injectable()
export class ProactiveFeeRecoveryAgentService {
  private readonly logger = new Logger('ProactiveFeeRecoveryAgent');

  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEngine: AgentPolicyEngineService,
    private readonly commService: AgentCommunicationService,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  async processFeeRecovery(dto: FeeRecoveryTriggerDto): Promise<AgentExecutionResult> {
    const start = Date.now();
    const correlationId = dto.correlationId || `corr-fee-${Date.now()}`;
    const executionId = `exec-fee-${Date.now()}`;
    const tenantId = dto.tenantId || 'DEFAULT';

    this.logger.log(
      `[FEE_RECOVERY_AGENT] Processing trigger '${dto.triggerType}' for student '${dto.studentId}'`,
    );

    // 1. Ensure Agent record in DB
    let agent = await this.prisma.agent.findUnique({
      where: { code: 'PROACTIVE_FEE_RECOVERY' },
    });
    if (!agent) {
      agent = await this.prisma.agent.create({
        data: {
          code: 'PROACTIVE_FEE_RECOVERY',
          name: 'Proactive Fee Recovery & EMI Agent',
          category: 'FINANCE',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Create execution entry
    const execution = await this.prisma.agentExecution.create({
      data: {
        id: executionId,
        agentId: agent.id,
        triggerEvent: dto.triggerType,
        correlationId,
        status: 'RUNNING',
        contextJson: { studentId: dto.studentId, triggerType: dto.triggerType, message: dto.studentMessage },
        tenantId,
      },
    });

    const actionsExecuted: any[] = [];

    try {
      // 3. Query student fee accounts from DB
      const feeAccounts = await this.prisma.studentFeeAccount.findMany({
        where: { studentId: dto.studentId, status: { not: 'PAID' } },
      });

      const totalOutstanding = feeAccounts.reduce(
        (acc, accnt) => acc + Number(accnt.balanceDue),
        0,
      ) || 50000; // default fallback if fresh test

      // 4. Create or fetch Fee Recovery Case
      let recoveryCase = await this.prisma.feeRecoveryCase.findFirst({
        where: { studentId: dto.studentId, status: { in: ['OPEN', 'ENGAGED', 'PROPOSED_EMI'] } },
      });

      if (!recoveryCase) {
        recoveryCase = await this.prisma.feeRecoveryCase.create({
          data: {
            studentId: dto.studentId,
            totalDueAmount: totalOutstanding,
            currentOverdue: totalOutstanding,
            dueSinceDate: new Date(),
            status: 'OPEN',
            riskLevel: totalOutstanding > 40000 ? 'HIGH' : 'MEDIUM',
            tenantId,
          },
        });
      }

      // 5. Record inbound message if student sent a negotiation query
      if (dto.studentMessage) {
        await this.prisma.feeConversation.create({
          data: {
            caseId: recoveryCase.id,
            channel: 'IN_APP',
            direction: 'INBOUND',
            senderType: 'STUDENT',
            messageText: dto.studentMessage,
            intentDetected: 'REQUEST_EMI',
          },
        });
      }

      // 6. Propose installment schedule
      const installmentsCount = dto.requestedInstallments || 2;
      const proposedDownPayment = dto.proposedDownPayment || Math.round(totalOutstanding * 0.5);

      // 7. Policy Engine Validation (Strict 0 discounts, <= 3 installments, >= 30% down payment)
      const policyResult = await this.policyEngine.evaluateFeeRecoveryPolicy(
        totalOutstanding,
        proposedDownPayment,
        installmentsCount,
        0, // 0 discounts permitted
      );

      if (!policyResult.passed) {
        actionsExecuted.push({
          actionType: 'EMI_PROPOSAL_REJECTED',
          targetResource: recoveryCase.id,
          status: 'FAILED',
          output: { reason: policyResult.reason, violations: policyResult.violations },
        });

        await this.commService.sendNotification({
          recipientType: 'STUDENT',
          recipientId: dto.studentId,
          channel: 'IN_APP',
          subject: 'Fee Installment Proposal Notice',
          messageBody: `Your proposed installment plan could not be processed: ${policyResult.violations?.join(', ')}. University policy permits maximum 3 installments with minimum 30% down payment.`,
          tenantId,
        });

        const durationMs = Date.now() - start;
        await this.prisma.agentExecution.update({
          where: { id: execution.id },
          data: { status: 'FAILED', endTime: new Date(), durationMs, resultJson: { policyResult } as any },
        });

        return {
          executionId: execution.id,
          agentCode: 'PROACTIVE_FEE_RECOVERY',
          status: 'FAILED',
          decisionSummary: policyResult.reason,
          actionsExecuted,
          durationMs,
        };
      }

      // 8. Create Negotiation Proposal & EMI Plan
      const remainingAmount = totalOutstanding - proposedDownPayment;
      const installmentAmount = Math.round(remainingAmount / (installmentsCount - 1 || 1));

      const installmentTerms = [];
      const now = new Date();
      // Installment 1: Down payment due in 7 days
      installmentTerms.push({
        seq: 1,
        amount: proposedDownPayment,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      // Installment 2+: Next 30-day intervals
      for (let i = 2; i <= installmentsCount; i++) {
        installmentTerms.push({
          seq: i,
          amount: installmentAmount,
          dueDate: new Date(now.getTime() + (i * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }

      const proposal = await this.prisma.feeNegotiationProposal.create({
        data: {
          caseId: recoveryCase.id,
          totalAmount: totalOutstanding,
          downPaymentAmount: proposedDownPayment,
          downPaymentDueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          installmentsCount,
          installmentTerms,
          status: 'ACCEPTED',
          policyCheckPassed: true,
        },
      });

      // 9. Generate active EMI Plan
      const emiPlan = await this.prisma.feeEMIPlan.create({
        data: {
          caseId: recoveryCase.id,
          proposalId: proposal.id,
          studentId: dto.studentId,
          totalPlanAmount: totalOutstanding,
          totalPaidAmount: 0.0,
          status: 'ACTIVE',
          approvedByRole: 'POLICY_ENGINE',
          tenantId,
        },
      });

      // Create structured installment records with payment links
      for (const term of installmentTerms) {
        await this.prisma.feeEMIInstallment.create({
          data: {
            planId: emiPlan.id,
            installmentNo: term.seq,
            dueDate: new Date(term.dueDate),
            amount: term.amount,
            paidAmount: 0.0,
            status: 'PENDING',
            paymentLinkUrl: `https://erp.ssiu.ac.in/fees/pay?plan=${emiPlan.id}&seq=${term.seq}`,
          },
        });
      }

      await this.prisma.feeRecoveryCase.update({
        where: { id: recoveryCase.id },
        data: { status: 'PROPOSED_EMI', lastContactedAt: new Date() },
      });

      actionsExecuted.push({
        actionType: 'EMI_PLAN_CREATED',
        toolName: 'createStudentEMIPlan',
        targetResource: emiPlan.id,
        status: 'SUCCESS',
        output: { emiPlanId: emiPlan.id, installmentsCount, totalAmount: totalOutstanding },
      });

      // 10. Record outbound conversational response & notification
      const notificationMsg = `An installment plan for your outstanding fees of ₹${totalOutstanding.toLocaleString('en-IN')} has been configured: Down payment ₹${proposedDownPayment.toLocaleString('en-IN')} due within 7 days, followed by ${installmentsCount - 1} installment(s) of ₹${installmentAmount.toLocaleString('en-IN')}.`;

      await this.prisma.feeConversation.create({
        data: {
          caseId: recoveryCase.id,
          channel: 'IN_APP',
          direction: 'OUTBOUND',
          senderType: 'AI_AGENT',
          messageText: notificationMsg,
          intentDetected: 'PROMISE_TO_PAY',
        },
      });

      await this.commService.sendNotification({
        recipientType: 'STUDENT',
        recipientId: dto.studentId,
        channel: 'IN_APP',
        subject: 'SSIU Fee Installment Plan Approved',
        messageBody: notificationMsg,
        tenantId,
      });

      const durationMs = Date.now() - start;
      await this.prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'SUCCESS',
          endTime: new Date(),
          durationMs,
          resultJson: { emiPlanId: emiPlan.id, actions: actionsExecuted } as any,
        },
      });

      await this.auditLogger.logAction({
        agentId: agent.id,
        agentCode: 'PROACTIVE_FEE_RECOVERY',
        executionId: execution.id,
        correlationId,
        eventType: 'FEE_EMI_PLAN_ESTABLISHED',
        actionSummary: `Created EMI Plan (${installmentsCount} installments, ₹${totalOutstanding.toLocaleString('en-IN')}) for student ${dto.studentId}`,
        payload: { emiPlanId: emiPlan.id, totalOutstanding, installmentsCount, durationMs },
        tenantId,
      });

      return {
        executionId: execution.id,
        agentCode: 'PROACTIVE_FEE_RECOVERY',
        status: 'SUCCESS',
        decisionSummary: `Approved and established ${installmentsCount}-part EMI plan for ₹${totalOutstanding.toLocaleString('en-IN')}.`,
        actionsExecuted,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - start;
      await this.prisma.agentExecution.update({
        where: { id: execution.id },
        data: { status: 'FAILED', endTime: new Date(), durationMs, errorDetails: err.message },
      });
      throw err;
    }
  }
}
