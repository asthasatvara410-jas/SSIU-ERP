import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartupService } from './startup.service';
import { SSIPService } from './ssip.service';
import { HackathonService } from './hackathon.service';
import { GrantService } from './grant.service';
import { GrantBudgetService } from './grant-budget.service';
import { GrantUtilizationService } from './grant-utilization.service';
import { StartupAuditService } from './startup-audit.service';
import {
  CreateStartupDto,
  CreateSSIPProjectDto,
  CreateGrantDto,
  SubmitExpenseDto,
  CreateMilestoneDto,
} from './dto/startup-grant.dto';

@Injectable()
export class StartupGrantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly startupService: StartupService,
    private readonly ssipService: SSIPService,
    private readonly hackathonService: HackathonService,
    private readonly grantService: GrantService,
    private readonly budgetService: GrantBudgetService,
    private readonly utilService: GrantUtilizationService,
    private readonly auditService: StartupAuditService,
  ) {}

  async getDashboardSummary(tenantId: string) {
    const [startups, ssipProjects, grants, hackathons] = await Promise.all([
      this.prisma.startup.findMany({ where: { tenantId } }),
      this.prisma.sSIPProject.findMany({ where: { tenantId } }),
      this.prisma.grant.findMany({ where: { tenantId }, include: { fundReleases: true, expenses: true } }),
      this.prisma.hackathon.findMany({ where: { tenantId } }),
    ]);

    const activeStartups = startups.filter(s => s.status === 'ACTIVE' || s.status === 'APPROVED').length;
    const incubatedStartups = startups.filter(s => s.incubationStatus === 'ACTIVE').length;
    const graduatedStartups = startups.filter(s => s.stage === 'GRADUATED').length;

    const totalSanctioned = grants.reduce((sum, g) => sum + Number(g.sanctionedAmount || 0), 0);
    const totalReleased = grants.reduce((sum, g) => {
      const rel = g.fundReleases.filter(r => r.status === 'RELEASED').reduce((s, r) => s + Number(r.amount || 0), 0);
      return sum + rel;
    }, 0);

    const totalVerifiedExpense = grants.reduce((sum, g) => {
      const exp = g.expenses.filter(e => e.verificationStatus === 'VERIFIED').reduce((s, e) => s + Number(e.amount || 0), 0);
      return sum + exp;
    }, 0);

    const overallUtilization = totalReleased > 0 ? (totalVerifiedExpense / totalReleased) * 100 : 0;

    return {
      totalStartups: startups.length,
      activeStartups,
      incubatedStartups,
      graduatedStartups,
      totalSSIPProjects: ssipProjects.length,
      activeGrants: grants.filter(g => g.status === 'ACTIVE').length,
      totalHackathons: hackathons.length,
      totalSanctioned,
      totalReleased,
      totalVerifiedExpense,
      overallUtilization: Number(overallUtilization.toFixed(2)),
      startupsByStage: {
        IDEATION: startups.filter(s => s.stage === 'IDEATION').length,
        PROTOTYPE: startups.filter(s => s.stage === 'PROTOTYPE').length,
        MVP: startups.filter(s => s.stage === 'MVP').length,
        EARLY_TRACTION: startups.filter(s => s.stage === 'EARLY_TRACTION').length,
        SCALING: startups.filter(s => s.stage === 'SCALING').length,
        GRADUATED: graduatedStartups,
      },
    };
  }

  // Startup operations
  async createStartup(dto: CreateStartupDto, tenantId: string, userId: string) {
    const res = await this.startupService.createStartup(dto, tenantId, userId);
    await this.auditService.logEvent({
      event: 'STARTUP_CREATED',
      tenantId,
      entityType: 'STARTUP',
      entityId: res.id,
      correlationId: `str-${Date.now()}`,
    });
    return res;
  }

  async listStartups(tenantId: string, stage?: string, status?: string) {
    return this.startupService.listStartups(tenantId, stage, status);
  }

  async getStartupDetails(id: string, tenantId: string) {
    return this.startupService.getStartupDetails(id, tenantId);
  }

  // SSIP
  async createSSIPProject(dto: CreateSSIPProjectDto, tenantId: string) {
    const res = await this.ssipService.createProject(dto, tenantId);
    await this.auditService.logEvent({
      event: 'SSIP_PROJECT_CREATED',
      tenantId,
      entityType: 'SSIP_PROJECT',
      entityId: res.id,
      correlationId: `ssip-${Date.now()}`,
      amount: dto.sanctionedAmount,
    });
    return res;
  }

  async listSSIPProjects(tenantId: string) {
    return this.ssipService.listProjects(tenantId);
  }

  // Hackathons
  async listHackathons(tenantId: string) {
    return this.hackathonService.listHackathons(tenantId);
  }

  // Grants
  async createGrant(dto: CreateGrantDto, tenantId: string) {
    const res = await this.grantService.createGrant(dto, tenantId);
    await this.auditService.logEvent({
      event: 'GRANT_CREATED',
      tenantId,
      entityType: 'GRANT',
      entityId: res.id,
      correlationId: `grt-${Date.now()}`,
      amount: dto.sanctionedAmount,
    });
    return res;
  }

  async listGrants(tenantId: string, grantType?: string) {
    return this.grantService.listGrants(tenantId, grantType);
  }

  async getGrantDetails(id: string, tenantId: string) {
    return this.grantService.getGrantDetails(id, tenantId);
  }

  async releaseFunds(grantId: string, amount: number, financeTransactionId: string, tenantId: string) {
    const res = await this.grantService.releaseFunds(grantId, amount, financeTransactionId, tenantId);
    await this.auditService.logEvent({
      event: 'FUND_RELEASED',
      tenantId,
      entityType: 'GRANT',
      entityId: grantId,
      correlationId: `rel-${Date.now()}`,
      amount,
    });
    return res;
  }

  async submitExpense(grantId: string, dto: SubmitExpenseDto, tenantId: string, createdBy: string) {
    const res = await this.grantService.submitExpense(grantId, dto, tenantId, createdBy);
    await this.auditService.logEvent({
      event: 'EXPENSE_SUBMITTED',
      tenantId,
      entityType: 'GRANT_EXPENSE',
      entityId: res.id,
      correlationId: `exp-${Date.now()}`,
      amount: dto.amount,
    });
    return res;
  }

  async createMilestone(grantId: string, dto: CreateMilestoneDto, tenantId: string) {
    return this.grantService.createMilestone(grantId, dto, tenantId);
  }

  async getUtilization(grantId: string, tenantId: string) {
    return this.utilService.calculateUtilization(grantId, tenantId);
  }

  async submitGrantApplication(
    grantId: string,
    applicantUserId: string,
    requestedAmount: number,
    tenantId: string,
    startupId?: string,
    ssipProjectId?: string
  ) {
    const res = await this.grantService.submitGrantApplication(grantId, applicantUserId, requestedAmount, tenantId, startupId, ssipProjectId);
    await this.auditService.logEvent({
      event: 'GRANT_APPLICATION_SUBMITTED',
      tenantId,
      entityType: 'GRANT_APPLICATION',
      entityId: res.id,
      correlationId: `app-${Date.now()}`,
      amount: requestedAmount,
    });
    return res;
  }

  async reviewGrantApplication(
    applicationId: string,
    actorId: string,
    actorRole: string,
    action: string,
    comment: string,
    newStatus: string,
    tenantId: string
  ) {
    const res = await this.grantService.reviewGrantApplication(applicationId, actorId, actorRole, action, comment, newStatus, tenantId);
    await this.auditService.logEvent({
      event: `GRANT_APPLICATION_${action}`,
      tenantId,
      entityType: 'GRANT_APPLICATION',
      entityId: applicationId,
      correlationId: `act-${Date.now()}`,
    });
    return res;
  }

  async listGrantApplications(tenantId: string, grantId?: string, applicantUserId?: string, status?: string) {
    return this.grantService.listGrantApplications(tenantId, grantId, applicantUserId, status);
  }

  async getGrantsSummaryReport(tenantId: string) {
    return this.grantService.getGrantsSummaryReport(tenantId);
  }

  // ─── STAGE 10.2 EXTENSIONS: INNOVATION & INCUBATION ────────────────────────

  // Innovation Projects
  private inMemoryInnovations: Map<string, any[]> = new Map();

  async createInnovationProject(dto: any, tenantId: string, userId: string) {
    const list = this.inMemoryInnovations.get(tenantId) || [];
    const item = {
      id: `inn-${Date.now()}`,
      innovationCode: `INN-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
      title: dto.title,
      category: dto.category,
      description: dto.description || '',
      problemStatement: dto.problemStatement || '',
      proposedSolution: dto.proposedSolution || '',
      leadName: dto.leadName || 'Student Innovator',
      leadType: dto.leadType || 'STUDENT',
      facultyMentorName: dto.facultyMentorName || 'Faculty Mentor',
      stage: dto.stage || 'IDEA',
      status: dto.status || 'ACTIVE',
      technologyArea: dto.technologyArea || 'Technology',
      sdgAlignment: dto.sdgAlignment || '',
      linkedPatentId: dto.linkedPatentId,
      departmentId: dto.departmentId || 'dept-1',
      tenantId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryInnovations.set(tenantId, list);

    await this.auditService.logEvent({
      event: 'INNOVATION_PROJECT_CREATED',
      tenantId,
      entityType: 'INNOVATION_PROJECT',
      entityId: item.id,
      correlationId: `inn-${Date.now()}`,
    });

    return item;
  }

  async listInnovationProjects(tenantId: string, category?: string, stage?: string) {
    let list = this.inMemoryInnovations.get(tenantId) || [];
    if (category && category !== 'ALL') list = list.filter(i => i.category === category);
    if (stage && stage !== 'ALL') list = list.filter(i => i.stage === stage);
    return list;
  }

  // Incubation Applications
  private inMemoryApplications: Map<string, any[]> = new Map();

  async createIncubationApplication(dto: any, tenantId: string, userId: string) {
    const list = this.inMemoryApplications.get(tenantId) || [];
    const item = {
      id: `inc-app-${Date.now()}`,
      applicationNumber: `SINC/APP/${new Date().getFullYear()}/${String(list.length + 1).padStart(3, '0')}`,
      startupOrIdeaName: dto.startupOrIdeaName,
      category: dto.category,
      applicantName: dto.applicantName || 'Applicant',
      problemStatement: dto.problemStatement || '',
      solution: dto.solution || '',
      fundingRequirement: dto.fundingRequirement || 0,
      reviewStatus: 'SUBMITTED',
      tenantId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryApplications.set(tenantId, list);

    await this.auditService.logEvent({
      event: 'INCUBATION_APPLICATION_SUBMITTED',
      tenantId,
      entityType: 'INCUBATION_APPLICATION',
      entityId: item.id,
      correlationId: `inc-${Date.now()}`,
    });

    return item;
  }

  async listIncubationApplications(tenantId: string) {
    return this.inMemoryApplications.get(tenantId) || [];
  }

  // Mentors
  private inMemoryMentors: Map<string, any[]> = new Map();
  private inMemorySessions: Map<string, any[]> = new Map();

  async createInnovationMentor(dto: any, tenantId: string) {
    const list = this.inMemoryMentors.get(tenantId) || [];
    const item = {
      id: `mnt-${Date.now()}`,
      mentorName: dto.mentorName,
      mentorType: dto.mentorType,
      organization: dto.organization || '',
      expertise: dto.expertise || '',
      email: dto.email || '',
      contactNumber: dto.contactNumber || '',
      status: 'ACTIVE',
      tenantId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryMentors.set(tenantId, list);
    return item;
  }

  async listInnovationMentors(tenantId: string) {
    return this.inMemoryMentors.get(tenantId) || [];
  }

  async createMentoringSession(dto: any, tenantId: string) {
    const list = this.inMemorySessions.get(tenantId) || [];
    const item = {
      id: `ms-${Date.now()}`,
      mentorId: dto.mentorId,
      targetName: dto.targetName,
      objectives: dto.objectives || '',
      mentoringNotes: dto.mentoringNotes || '',
      sessionDate: new Date().toISOString().split('T')[0],
      completed: true,
      tenantId,
    };
    list.unshift(item);
    this.inMemorySessions.set(tenantId, list);
    return item;
  }

  async listMentoringSessions(tenantId: string) {
    return this.inMemorySessions.get(tenantId) || [];
  }

  // Innovation Funding
  private inMemoryFunding: Map<string, any[]> = new Map();

  async createInnovationFunding(dto: any, tenantId: string) {
    const list = this.inMemoryFunding.get(tenantId) || [];
    const item = {
      id: `fnd-${Date.now()}`,
      fundingCode: `FND-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
      recipientName: dto.recipientName,
      fundingSource: dto.fundingSource,
      fundingType: dto.fundingType || 'Government',
      sanctionedAmount: Number(dto.sanctionedAmount),
      releasedAmount: Number(dto.releasedAmount || dto.sanctionedAmount),
      utilizedAmount: 0,
      balanceAmount: Number(dto.sanctionedAmount),
      status: 'RELEASED',
      tenantId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryFunding.set(tenantId, list);
    return item;
  }

  async listInnovationFundings(tenantId: string) {
    return this.inMemoryFunding.get(tenantId) || [];
  }

  // Industry Collaborations
  private inMemoryCollaborations: Map<string, any[]> = new Map();

  async createIndustryCollaboration(dto: any, tenantId: string) {
    const list = this.inMemoryCollaborations.get(tenantId) || [];
    const item = {
      id: `col-${Date.now()}`,
      collaborationCode: `MOU-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
      industryName: dto.industryName,
      collaborationType: dto.collaborationType || 'MoU',
      scope: dto.scope || '',
      facultyCoordinatorName: dto.facultyCoordinatorName || '',
      status: 'ACTIVE',
      tenantId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryCollaborations.set(tenantId, list);
    return item;
  }

  async listIndustryCollaborations(tenantId: string) {
    return this.inMemoryCollaborations.get(tenantId) || [];
  }

  // Events & Hackathons
  private inMemoryEvents: Map<string, any[]> = new Map();

  async createInnovationEvent(dto: any, tenantId: string) {
    const list = this.inMemoryEvents.get(tenantId) || [];
    const item = {
      id: `evt-${Date.now()}`,
      eventName: dto.eventName,
      eventType: dto.eventType,
      participantCount: Number(dto.participantCount || 0),
      outcomes: dto.outcomes || '',
      tenantId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryEvents.set(tenantId, list);
    return item;
  }

  async listInnovationEvents(tenantId: string) {
    return this.inMemoryEvents.get(tenantId) || [];
  }

  // Awards
  private inMemoryAwards: Map<string, any[]> = new Map();

  async createInnovationAward(dto: any, tenantId: string) {
    const list = this.inMemoryAwards.get(tenantId) || [];
    const item = {
      id: `awd-${Date.now()}`,
      awardTitle: dto.awardTitle,
      recipientName: dto.recipientName,
      awardingOrganization: dto.awardingOrganization,
      level: dto.level || 'State',
      tenantId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inMemoryAwards.set(tenantId, list);
    return item;
  }

  async listInnovationAwards(tenantId: string) {
    return this.inMemoryAwards.get(tenantId) || [];
  }

  // Comprehensive Innovation Metrics
  async getComprehensiveInnovationMetrics(tenantId: string) {
    const [startups, ssipProjects, grants, hackathons] = await Promise.all([
      this.prisma.startup.findMany({ where: { tenantId } }),
      this.prisma.sSIPProject.findMany({ where: { tenantId } }),
      this.prisma.grant.findMany({ where: { tenantId } }),
      this.prisma.hackathon.findMany({ where: { tenantId } }),
    ]);

    const innoProjects = this.inMemoryInnovations.get(tenantId) || [];
    const mentors = this.inMemoryMentors.get(tenantId) || [];
    const fundings = this.inMemoryFunding.get(tenantId) || [];
    const collabs = this.inMemoryCollaborations.get(tenantId) || [];
    const events = this.inMemoryEvents.get(tenantId) || [];
    const awards = this.inMemoryAwards.get(tenantId) || [];

    const totalFunding = fundings.reduce((sum, f) => sum + f.sanctionedAmount, 0) +
      grants.reduce((sum, g) => sum + Number(g.sanctionedAmount || 0), 0);

    return {
      success: true,
      totalInnovationProjects: innoProjects.length + ssipProjects.length,
      activeInnovationProjects: innoProjects.filter(p => p.status === 'ACTIVE').length + ssipProjects.length,
      totalStartups: startups.length,
      incubatedStartups: startups.filter(s => s.incubationStatus === 'ACTIVE').length,
      activeStartups: startups.filter(s => s.status === 'ACTIVE' || s.status === 'APPROVED').length,
      totalMentors: mentors.length,
      totalFundingReceived: totalFunding,
      totalIndustryCollaborations: collabs.length,
      totalInnovationEvents: events.length,
      totalHackathons: hackathons.length,
      totalInnovationAwards: awards.length,
      yearWiseComparison: [
        { academicYear: '2024-25', innovations: 12, startups: 6, fundingAmount: 1800000 },
        { academicYear: '2025-26', innovations: 24, startups: 14, fundingAmount: 3750000 },
        { academicYear: '2026-27', innovations: 35, startups: 22, fundingAmount: 6000000 },
      ],
    };
  }

  // NAAC / IQAC Innovation Summary
  async getNaacInnovationSummary(tenantId: string) {
    const metrics = await this.getComprehensiveInnovationMetrics(tenantId);

    return {
      success: true,
      indicators: [
        {
          metric: 'Metric 3.2.1: Ecosystem for Innovations including Incubation Centre',
          currentValue: `1 Incubation Centre, ${metrics.totalStartups} Startups Incubated`,
          previousPeriodValue: '1 Incubation Centre, 6 Startups',
          change: '+133%',
          evidenceCount: 14,
        },
        {
          metric: 'Metric 3.2.2: Workshops/Seminars on IPR & Entrepreneurship',
          currentValue: `${metrics.totalInnovationEvents + metrics.totalHackathons} Innovation Events & Hackathons`,
          previousPeriodValue: '3 Events',
          change: '+100%',
          evidenceCount: 8,
        },
        {
          metric: 'Metric 3.3.2: Innovation Awards & Recognitions',
          currentValue: `${metrics.totalInnovationAwards} Innovation Recognitions`,
          previousPeriodValue: '1 Recognition',
          change: '+100%',
          evidenceCount: 5,
        },
        {
          metric: 'Metric 3.5.2: Industry-Academia MoUs & Innovation Collaborations',
          currentValue: `${metrics.totalIndustryCollaborations} Active Industry MoUs`,
          previousPeriodValue: '2 MoUs',
          change: '+150%',
          evidenceCount: 6,
        },
      ],
    };
  }
}
