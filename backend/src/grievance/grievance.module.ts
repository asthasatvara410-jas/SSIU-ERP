import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrievanceController } from './grievance.controller';
import { GrievanceService } from './grievance.service';
import { AnonymousComplaintService } from './anonymous-complaint.service';
import { ComplaintWorkflowService } from './complaint-workflow.service';
import { ComplaintEscalationService } from './complaint-escalation.service';
import { AntiRaggingService } from './anti-ragging.service';
import { ICCService } from './icc.service';
import { CommitteeService } from './committee.service';
import { CaseAssignmentService } from './case-assignment.service';
import { InvestigationService } from './investigation.service';
import { CaseEvidenceService } from './case-evidence.service';
import { GrievanceSLAService } from './grievance-sla.service';
import { GrievanceReportService } from './grievance-report.service';
import { GrievanceAuditService } from './grievance-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [GrievanceController],
  providers: [
    GrievanceService,
    AnonymousComplaintService,
    ComplaintWorkflowService,
    ComplaintEscalationService,
    AntiRaggingService,
    ICCService,
    CommitteeService,
    CaseAssignmentService,
    InvestigationService,
    CaseEvidenceService,
    GrievanceSLAService,
    GrievanceReportService,
    GrievanceAuditService,
  ],
  exports: [
    GrievanceService,
    AnonymousComplaintService,
    ComplaintWorkflowService,
    ComplaintEscalationService,
    AntiRaggingService,
    ICCService,
    CommitteeService,
    CaseAssignmentService,
    InvestigationService,
    CaseEvidenceService,
    GrievanceSLAService,
    GrievanceReportService,
    GrievanceAuditService,
  ],
})
export class GrievanceModule {}
