import { Injectable, Logger } from '@nestjs/common';
import { AgentEventBusService, PublishEventDto } from '../events/agent-event-bus.service';
import { TimetableSubstitutionAgentService } from '../agents/timetable-substitution-agent.service';
import { SmartDocumentVerifierAgentService } from '../agents/smart-document-verifier-agent.service';
import { ProactiveFeeRecoveryAgentService } from '../agents/proactive-fee-recovery-agent.service';
import { AgentToolRegistryService } from '../tools/agent-tool-registry.service';
import { AgentExecutionResult } from '../types/agent.types';

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger('AgentOrchestrator');

  constructor(
    private readonly eventBus: AgentEventBusService,
    private readonly toolRegistry: AgentToolRegistryService,
    private readonly timetableAgent: TimetableSubstitutionAgentService,
    private readonly documentAgent: SmartDocumentVerifierAgentService,
    private readonly feeAgent: ProactiveFeeRecoveryAgentService,
  ) {
    this.registerStandardTools();
  }

  private registerStandardTools(): void {
    // 1. Timetable Tool
    this.toolRegistry.registerTool({
      name: 'updateTimetableSchedule',
      description: 'Updates timetable schedule slot with substitute faculty',
      requiredPermission: 'timetable.update',
      agentCode: 'TIMETABLE_SUBSTITUTION',
      schema: { timetableEntryId: 'string', substituteFacultyId: 'string' },
      execute: async (input) => ({ success: true, updated: input.timetableEntryId }),
    });

    // 2. Document Tool
    this.toolRegistry.registerTool({
      name: 'verifyStudentDocument',
      description: 'Marks a student document as verified after OCR cross-check',
      requiredPermission: 'document.verify',
      agentCode: 'SMART_DOCUMENT_VERIFIER',
      schema: { documentId: 'string', status: 'string' },
      execute: async (input) => ({ success: true, verifiedDocumentId: input.documentId }),
    });

    // 3. Fee Tool
    this.toolRegistry.registerTool({
      name: 'createStudentEMIPlan',
      description: 'Generates an institutional EMI installment plan for fee balance',
      requiredPermission: 'emi.plan.create',
      agentCode: 'PROACTIVE_FEE_RECOVERY',
      schema: { studentId: 'string', totalAmount: 'number', installments: 'number' },
      execute: async (input) => ({ success: true, planCreated: true }),
    });
  }

  async dispatchEvent(dto: PublishEventDto): Promise<{
    eventId: string;
    isDuplicate: boolean;
    result?: AgentExecutionResult;
  }> {
    const publishResult = await this.eventBus.publish(dto);
    if (publishResult.isDuplicate) {
      return { eventId: publishResult.eventId, isDuplicate: true };
    }

    let agentResult: AgentExecutionResult | undefined;

    try {
      switch (dto.eventType) {
        case 'FACULTY_ABSENCE_REPORTED':
          agentResult = await this.timetableAgent.processFacultyAbsence({
            facultyId: dto.payload.facultyId,
            absenceDate: dto.payload.absenceDate || new Date().toISOString().split('T')[0],
            reason: dto.payload.reason,
            correlationId: dto.idempotencyKey,
            tenantId: dto.tenantId,
          });
          break;

        case 'DOCUMENT_UPLOADED':
        case 'DOCUMENT_VERIFICATION_REQUIRED':
          agentResult = await this.documentAgent.processDocument({
            documentId: dto.payload.documentId,
            studentId: dto.payload.studentId,
            documentType: dto.payload.documentType || 'LEAVING_CERTIFICATE',
            ocrConfidence: dto.payload.ocrConfidence,
            extractedFields: dto.payload.extractedFields,
            correlationId: dto.idempotencyKey,
            tenantId: dto.tenantId,
          });
          break;

        case 'FEE_OVERDUE':
        case 'FEE_DUE_SOON':
        case 'STUDENT_PAYMENT_NEGOTIATION':
          agentResult = await this.feeAgent.processFeeRecovery({
            studentId: dto.payload.studentId,
            triggerType: dto.eventType as any,
            studentMessage: dto.payload.studentMessage,
            requestedInstallments: dto.payload.requestedInstallments,
            proposedDownPayment: dto.payload.proposedDownPayment,
            correlationId: dto.idempotencyKey,
            tenantId: dto.tenantId,
          });
          break;

        default:
          this.logger.warn(`No registered agent for event '${dto.eventType}'`);
      }

      await this.eventBus.markEventProcessed(publishResult.eventId);
      return { eventId: publishResult.eventId, isDuplicate: false, result: agentResult };
    } catch (err: any) {
      await this.eventBus.markEventProcessed(publishResult.eventId, err.message);
      throw err;
    }
  }
}
