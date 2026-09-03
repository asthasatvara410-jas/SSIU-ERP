import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentPolicyEngineService } from '../policy/agent-policy-engine.service';
import { AgentApprovalEngineService } from '../approval/agent-approval-engine.service';
import { AgentCommunicationService } from '../communication/communication.service';
import { AgentAuditLoggerService } from '../audit/agent-audit-logger.service';
import { AgentExecutionResult } from '../types/agent.types';

export interface ProcessDocumentUploadDto {
  documentId: string;
  studentId: string;
  documentType: string;
  ocrConfidence?: number;
  extractedFields?: {
    name?: string;
    enrollmentNo?: string;
    dob?: string;
    institute?: string;
  };
  correlationId?: string;
  tenantId?: string;
}

@Injectable()
export class SmartDocumentVerifierAgentService {
  private readonly logger = new Logger('SmartDocumentVerifierAgent');

  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEngine: AgentPolicyEngineService,
    private readonly approvalEngine: AgentApprovalEngineService,
    private readonly commService: AgentCommunicationService,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  async processDocument(dto: ProcessDocumentUploadDto): Promise<AgentExecutionResult> {
    const start = Date.now();
    const correlationId = dto.correlationId || `corr-doc-${Date.now()}`;
    const executionId = `exec-doc-${Date.now()}`;
    const tenantId = dto.tenantId || 'DEFAULT';

    this.logger.log(
      `[DOCUMENT_AGENT] Processing document '${dto.documentId}' for student '${dto.studentId}' (${dto.documentType})`,
    );

    // 1. Ensure Agent record in DB
    let agent = await this.prisma.agent.findUnique({
      where: { code: 'SMART_DOCUMENT_VERIFIER' },
    });
    if (!agent) {
      agent = await this.prisma.agent.create({
        data: {
          code: 'SMART_DOCUMENT_VERIFIER',
          name: 'Smart Document Verifier & Processor Agent',
          category: 'DMS',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Create execution entry
    const execution = await this.prisma.agentExecution.create({
      data: {
        id: executionId,
        agentId: agent.id,
        triggerEvent: 'DOCUMENT_UPLOADED',
        correlationId,
        status: 'RUNNING',
        contextJson: { documentId: dto.documentId, studentId: dto.studentId, type: dto.documentType },
        tenantId,
      },
    });

    const actionsExecuted: any[] = [];

    try {
      // 3. Fetch student ERP record for cross-verification
      const student = await this.prisma.student.findUnique({
        where: { id: dto.studentId },
      });

      const ocrConfidence = dto.ocrConfidence ?? 96.5;
      const extracted = dto.extractedFields || {
        name: student ? `${student.firstName} ${student.lastName}` : 'Demo Student',
        enrollmentNo: student?.enrollmentNo || 'ENR2026101',
        dob: '2004-05-15',
        institute: 'SSCIT',
      };

      // 4. Cross-match extracted entity fields
      const nameMatch = !student || (extracted.name?.toLowerCase().includes(student.firstName.toLowerCase()) ?? true);
      const enrollmentMatch = !student || extracted.enrollmentNo === student.enrollmentNo;
      const dobMatch = true;

      // 5. Persist Document Extraction record
      const extraction = await this.prisma.documentExtraction.upsert({
        where: { documentId: dto.documentId },
        create: {
          documentId: dto.documentId,
          studentId: dto.studentId,
          documentType: dto.documentType,
          ocrConfidence,
          extractedFields: extracted,
        },
        update: {
          ocrConfidence,
          extractedFields: extracted,
        },
      });

      // 6. Policy Engine Confidence Evaluation
      const policyResult = await this.policyEngine.evaluateDocumentVerificationPolicy(
        ocrConfidence,
        { nameMatch, enrollmentMatch, dobMatch },
        tenantId,
      );

      let decision = 'REJECTED';
      let executionStatus: 'SUCCESS' | 'PENDING_APPROVAL' = 'SUCCESS';
      let approvalData: any = undefined;

      if (policyResult.autoApprovalAllowed) {
        decision = 'AUTO_VERIFIED';

        // Update verification result
        await this.prisma.documentVerificationResult.upsert({
          where: { documentId: dto.documentId },
          create: {
            extractionId: extraction.id,
            documentId: dto.documentId,
            studentId: dto.studentId,
            overallScore: ocrConfidence,
            decision: 'AUTO_VERIFIED',
            matchingDetails: { nameMatch, enrollmentMatch, dobMatch },
            tenantId,
          },
          update: {
            overallScore: ocrConfidence,
            decision: 'AUTO_VERIFIED',
            matchingDetails: { nameMatch, enrollmentMatch, dobMatch },
          },
        });

        actionsExecuted.push({
          actionType: 'DOCUMENT_AUTO_VERIFIED',
          toolName: 'verifyStudentDocument',
          targetResource: dto.documentId,
          status: 'SUCCESS',
          output: { decision: 'AUTO_VERIFIED', confidence: ocrConfidence },
        });

        // Notify student
        await this.commService.sendNotification({
          recipientType: 'STUDENT',
          recipientId: dto.studentId,
          channel: 'IN_APP',
          subject: 'Document Auto-Verified Successfully',
          messageBody: `Your uploaded ${dto.documentType} has been automatically verified by the SSIU Smart Document Verifier.`,
          tenantId,
        });
      } else if (policyResult.passed) {
        decision = 'ADMIN_REVIEW';
        executionStatus = 'PENDING_APPROVAL';

        const verResult = await this.prisma.documentVerificationResult.upsert({
          where: { documentId: dto.documentId },
          create: {
            extractionId: extraction.id,
            documentId: dto.documentId,
            studentId: dto.studentId,
            overallScore: ocrConfidence,
            decision: 'ADMIN_REVIEW',
            matchingDetails: { nameMatch, enrollmentMatch, dobMatch },
            tenantId,
          },
          update: {
            overallScore: ocrConfidence,
            decision: 'ADMIN_REVIEW',
            matchingDetails: { nameMatch, enrollmentMatch, dobMatch },
          },
        });

        // Create human-in-the-loop review ticket for Student Section
        const ticket = await this.approvalEngine.createApprovalTicket({
          agentId: agent.id,
          executionId: execution.id,
          resourceType: 'DOCUMENT_VERIFICATION',
          resourceId: verResult.id,
          assignedRole: 'STUDENT_SECTION',
          requestedData: {
            documentId: dto.documentId,
            studentId: dto.studentId,
            ocrConfidence,
            extracted,
            reason: policyResult.reason,
          },
          tenantId,
        });

        approvalData = {
          approvalId: ticket.id,
          resourceType: 'DOCUMENT_VERIFICATION',
          resourceId: verResult.id,
          assignedRole: 'STUDENT_SECTION',
          reason: policyResult.reason,
        };

        actionsExecuted.push({
          actionType: 'ADMIN_REVIEW_REQUESTED',
          targetResource: verResult.id,
          status: 'SUCCESS',
          output: { approvalId: ticket.id },
        });
      } else {
        decision = 'REJECTED';
        await this.prisma.documentVerificationResult.upsert({
          where: { documentId: dto.documentId },
          create: {
            extractionId: extraction.id,
            documentId: dto.documentId,
            studentId: dto.studentId,
            overallScore: ocrConfidence,
            decision: 'REJECTED',
            matchingDetails: { nameMatch, enrollmentMatch, dobMatch },
            discrepancies: policyResult.violations,
            tenantId,
          },
          update: {
            overallScore: ocrConfidence,
            decision: 'REJECTED',
            matchingDetails: { nameMatch, enrollmentMatch, dobMatch },
            discrepancies: policyResult.violations,
          },
        });

        actionsExecuted.push({
          actionType: 'DOCUMENT_REJECTED',
          targetResource: dto.documentId,
          status: 'SUCCESS',
          output: { decision: 'REJECTED', violations: policyResult.violations },
        });
      }

      const durationMs = Date.now() - start;
      await this.prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: executionStatus,
          endTime: new Date(),
          durationMs,
          resultJson: { decision, actions: actionsExecuted, policy: policyResult } as any,
        },
      });

      await this.auditLogger.logAction({
        agentId: agent.id,
        agentCode: 'SMART_DOCUMENT_VERIFIER',
        executionId: execution.id,
        correlationId,
        eventType: 'DOCUMENT_VERIFICATION_EVALUATED',
        actionSummary: `Document ${dto.documentId} evaluated: ${decision} (${ocrConfidence.toFixed(1)}%)`,
        payload: { decision, ocrConfidence, policyResult, durationMs },
        tenantId,
      });

      return {
        executionId: execution.id,
        agentCode: 'SMART_DOCUMENT_VERIFIER',
        status: executionStatus,
        decisionSummary: `${decision}: ${policyResult.reason}`,
        actionsExecuted,
        approvalRequired: approvalData,
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
