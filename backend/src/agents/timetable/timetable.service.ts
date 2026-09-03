import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TimetableAgentPolicyEngine } from './timetable.policy';
import { TimetableAgentTools } from './timetable.tools';
import { AgentAuditLoggerService } from '../../agent-platform/audit/agent-audit-logger.service';
import { SubstitutionProposal, CandidateFacultyScore, SubstitutionStatus } from './timetable.types';

@Injectable()
export class TimetableAgentService {
  private readonly logger = new Logger('TimetableAgentService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEngine: TimetableAgentPolicyEngine,
    private readonly tools: TimetableAgentTools,
    private readonly auditLogger: AgentAuditLoggerService,
  ) {}

  /**
   * 1. Reports faculty absence and deterministically generates substitution proposals.
   */
  async reportAbsenceAndPlanSubstitutions(params: {
    facultyId: string;
    absenceDate: string;
    reason: string;
    tenantId?: string;
    correlationId?: string;
  }): Promise<{ affectedCount: number; proposals: any[] }> {
    const tenantId = params.tenantId || 'DEFAULT';
    const correlationId = params.correlationId || `corr-abs-${Date.now()}`;
    const dateObj = new Date(params.absenceDate);
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    this.logger.log(
      `[FACULTY_ABSENCE] Faculty: ${params.facultyId} on ${params.absenceDate} (${dayOfWeek}) | Corr: ${correlationId}`,
    );

    // Audit Log: FACULTY_ABSENCE_REPORTED
    await this.auditLogger.logAction({
      agentCode: 'TIMETABLE_SUBSTITUTION_AGENT',
      correlationId,
      eventType: 'FACULTY_ABSENCE_REPORTED',
      actionSummary: `Absence reported by/for faculty '${params.facultyId}' on ${params.absenceDate}`,
      payload: { facultyId: params.facultyId, absenceDate: params.absenceDate, reason: params.reason },
      tenantId,
      actorType: 'TRIGGER_EVENT',
      actorId: params.facultyId,
    });

    // 1. Detect Affected Lectures
    const affectedLectures = await this.tools.getAffectedLectures(params.facultyId, dayOfWeek, tenantId);
    if (affectedLectures.length === 0) {
      return { affectedCount: 0, proposals: [] };
    }

    const proposals: any[] = [];

    // 2. Deterministic candidate ranking for each affected slot
    for (const slot of affectedLectures) {
      const peerCandidates = await this.tools.findPeerFacultyCandidates(
        slot.departmentId,
        dayOfWeek,
        slot.startTime,
        slot.endTime,
      );

      const scoredCandidates: CandidateFacultyScore[] = peerCandidates
        .filter(c => c.facultyId !== params.facultyId)
        .map(c => this.policyEngine.evaluateCandidateScore(c, slot))
        .sort((a, b) => b.totalScore - a.totalScore);

      const bestCandidate = scoredCandidates.length > 0 ? scoredCandidates[0] : null;

      // 3. Create immutable substitution proposal in SubstitutionRequest
      const proposal = await this.prisma.substitutionRequest.create({
        data: {
          timetableEntryId: slot.timetableEntryId,
          originalFacultyId: params.facultyId,
          substituteFacultyId: bestCandidate && bestCandidate.totalScore > 0 ? bestCandidate.facultyId : null,
          absenceDate: dateObj,
          status: 'PROPOSED',
          matchingScore: bestCandidate ? bestCandidate.totalScore : 0,
          reasonForAbsence: params.reason,
          approvalMode: 'MANUAL',
          tenantId,
        },
      });

      // 4. Create Human-in-the-Loop approval record
      await this.prisma.agentApproval.create({
        data: {
          agentId: 'agent-tt-01',
          executionId: `exec-${proposal.id}`,
          resourceType: 'TIMETABLE_SUBSTITUTION',
          resourceId: proposal.id,
          status: 'PENDING',
          assignedRole: 'HOD',
          decisionReason: bestCandidate 
            ? `Recommended substitute: ${bestCandidate.facultyName} (Score: ${bestCandidate.totalScore}%). ${bestCandidate.recommendationReason}`
            : 'No eligible peer candidate found without schedule conflicts.',
          requestedData: {
            proposalId: proposal.id,
            timetableEntryId: slot.timetableEntryId,
            originalFacultyId: params.facultyId,
            substituteFacultyId: bestCandidate?.facultyId,
            date: params.absenceDate,
            slot: `${slot.startTime} - ${slot.endTime}`,
            room: slot.roomNumber,
            candidatesEvaluated: scoredCandidates.map(c => ({
              id: c.facultyId,
              name: c.facultyName,
              score: c.totalScore,
              reason: c.recommendationReason,
            })),
          },
          tenantId,
        },
      });

      proposals.push({
        id: proposal.id,
        timetableEntryId: slot.timetableEntryId,
        slot: `${slot.startTime} - ${slot.endTime}`,
        room: slot.roomNumber,
        bestCandidate: bestCandidate ? {
          id: bestCandidate.facultyId,
          name: bestCandidate.facultyName,
          score: bestCandidate.totalScore,
          reason: bestCandidate.recommendationReason,
        } : null,
        status: 'PENDING_APPROVAL',
      });
    }

    // Audit Log: SUBSTITUTION_PLAN_CREATED
    await this.auditLogger.logAction({
      agentCode: 'TIMETABLE_SUBSTITUTION_AGENT',
      correlationId,
      eventType: 'SUBSTITUTION_PLAN_CREATED',
      actionSummary: `Generated ${proposals.length} substitution proposals for HOD review.`,
      payload: { proposalsCount: proposals.length, absenceDate: params.absenceDate },
      tenantId,
      actorType: 'SYSTEM_AGENT',
    });

    return {
      affectedCount: affectedLectures.length,
      proposals,
    };
  }

  /**
   * 2. Retrieves substitution requests.
   */
  async getSubstitutions(departmentId?: string, tenantId: string = 'DEFAULT'): Promise<any[]> {
    return this.prisma.substitutionRequest.findMany({
      where: { tenantId },
      include: { timetableEntry: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 3. Retrieves single substitution request by ID.
   */
  async getSubstitutionById(id: string): Promise<any> {
    const sub = await this.prisma.substitutionRequest.findUnique({
      where: { id },
      include: { timetableEntry: true },
    });
    if (!sub) throw new NotFoundException(`Substitution request '${id}' not found.`);
    return sub;
  }

  /**
   * 4. Approves and executes substitution.
   */
  async approveSubstitution(params: {
    id: string;
    approverUserId: string;
    approverRole: string;
    tenantId?: string;
  }): Promise<any> {
    const sub = await this.getSubSubstitutionOrThrow(params.id);

    if (!['HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN'].includes(params.approverRole)) {
      throw new ForbiddenException('Only HODs or Academic Administrators can authorize timetable substitutions.');
    }

    if (!sub.substituteFacultyId) {
      throw new BadRequestException('Cannot approve substitution request without an assigned substitute faculty.');
    }

    // Update Timetable & mark approved
    const updated = await this.tools.applySubstitutionToTimetable(
      sub.timetableEntryId,
      sub.substituteFacultyId,
      params.approverUserId,
    );

    // Update approval ticket
    await this.prisma.agentApproval.updateMany({
      where: { resourceId: sub.id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        actionTakenBy: params.approverUserId,
        actionTakenAt: new Date(),
      },
    });

    // Multi-party notifications
    await this.tools.sendSubstitutionNotifications({
      substituteFacultyId: sub.substituteFacultyId,
      originalFacultyId: sub.originalFacultyId,
      divisionId: sub.timetableEntry.divisionId,
      subjectName: `Subject-${sub.timetableEntry.subjectId}`,
      slotTime: `${sub.timetableEntry.startTime} - ${sub.timetableEntry.endTime}`,
      roomNumber: sub.timetableEntry.roomNumber,
      date: sub.absenceDate.toISOString().split('T')[0],
      tenantId: params.tenantId || 'DEFAULT',
    });

    // Audit Log: SUBSTITUTION_APPROVED & TIMETABLE_SUBSTITUTION_EXECUTED
    await this.auditLogger.logAction({
      agentCode: 'TIMETABLE_SUBSTITUTION_AGENT',
      correlationId: `corr-sub-appr-${sub.id}`,
      eventType: 'TIMETABLE_SUBSTITUTION_EXECUTED',
      actionSummary: `Timetable slot '${sub.timetableEntryId}' successfully reassigned to faculty '${sub.substituteFacultyId}'`,
      payload: { substitutionId: sub.id, approvedBy: params.approverUserId, substituteFacultyId: sub.substituteFacultyId },
      tenantId: params.tenantId || 'DEFAULT',
      actorType: 'HUMAN_APPROVER',
      actorId: params.approverUserId,
    });

    return {
      success: true,
      status: 'EXECUTED',
      message: 'Timetable substitution successfully authorized and applied.',
      timetableEntryId: sub.timetableEntryId,
      substituteFacultyId: sub.substituteFacultyId,
    };
  }

  /**
   * 5. Rejects substitution request.
   */
  async rejectSubstitution(params: {
    id: string;
    rejectorUserId: string;
    rejectorRole: string;
    reason: string;
    tenantId?: string;
  }): Promise<any> {
    const sub = await this.getSubSubstitutionOrThrow(params.id);

    if (!['HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN'].includes(params.rejectorRole)) {
      throw new ForbiddenException('Only HODs or Academic Administrators can reject timetable substitutions.');
    }

    await this.prisma.substitutionRequest.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        approvedByUserId: params.rejectorUserId,
        approvedAt: new Date(),
      },
    });

    await this.prisma.agentApproval.updateMany({
      where: { resourceId: sub.id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        actionTakenBy: params.rejectorUserId,
        actionTakenAt: new Date(),
        decisionReason: params.reason,
      },
    });

    // Audit Log: SUBSTITUTION_REJECTED
    await this.auditLogger.logAction({
      agentCode: 'TIMETABLE_SUBSTITUTION_AGENT',
      correlationId: `corr-sub-rej-${sub.id}`,
      eventType: 'SUBSTITUTION_REJECTED',
      actionSummary: `Substitution request '${sub.id}' rejected by HOD: ${params.reason}`,
      payload: { substitutionId: sub.id, rejectedBy: params.rejectorUserId, reason: params.reason },
      tenantId: params.tenantId || 'DEFAULT',
      actorType: 'HUMAN_APPROVER',
      actorId: params.rejectorUserId,
    });

    return {
      success: true,
      status: 'REJECTED',
      message: 'Substitution proposal rejected.',
    };
  }

  private async getSubSubstitutionOrThrow(id: string) {
    const sub = await this.prisma.substitutionRequest.findUnique({
      where: { id },
      include: { timetableEntry: true },
    });
    if (!sub) throw new NotFoundException(`Substitution request '${id}' not found.`);
    return sub;
  }
}
