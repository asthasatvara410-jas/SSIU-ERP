import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGrantDto,
  SubmitExpenseDto,
  CreateMilestoneDto,
  GrantApprovalActionDto,
} from './dto/startup-grant.dto';

@Injectable()
export class GrantService {
  constructor(private readonly prisma: PrismaService) {}

  async createGrant(dto: CreateGrantDto, tenantId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.grant.count();
    const grantCode = `GRT-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.grant.create({
      data: {
        tenantId,
        grantCode,
        name: dto.name,
        grantingAgency: dto.grantingAgency,
        schemeName: dto.schemeName || null,
        grantType: dto.grantType || 'GOVERNMENT',
        description: dto.description || null,
        sanctionedAmount: dto.sanctionedAmount || 0,
        status: 'ACTIVE',
      },
    });
  }

  async listGrants(tenantId: string, grantType?: string) {
    return this.prisma.grant.findMany({
      where: {
        tenantId,
        ...(grantType ? { grantType } : {}),
      },
      include: {
        budgets: true,
        fundReleases: true,
        expenses: true,
        milestones: true,
        utilizationRecords: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGrantDetails(id: string, tenantId: string) {
    const grant = await this.prisma.grant.findFirst({
      where: { OR: [{ id }, { grantCode: id }], tenantId },
      include: {
        applications: { include: { approvals: true, startup: true } },
        budgets: true,
        fundReleases: true,
        expenses: true,
        milestones: true,
        documents: true,
        utilizationRecords: true,
      },
    });

    if (!grant) throw new BadRequestException(`Grant ${id} not found.`);
    return grant;
  }

  async releaseFunds(grantId: string, amount: number, financeTransactionId: string, tenantId: string) {
    const grant = await this.prisma.grant.findFirst({ where: { id: grantId, tenantId } });
    if (!grant) throw new BadRequestException('Grant not found.');

    const relCount = await this.prisma.grantFundRelease.count({ where: { grantId } });
    const releaseReference = `REL-${new Date().getFullYear()}-${String(relCount + 1).padStart(4, '0')}`;

    const release = await this.prisma.grantFundRelease.create({
      data: {
        tenantId,
        grantId,
        releaseReference,
        amount,
        financeTransactionId,
        status: 'RELEASED',
      },
    });

    // Update grant released amount
    await this.prisma.grant.update({
      where: { id: grantId },
      data: { releasedAmount: { increment: amount } },
    });

    return release;
  }

  async submitExpense(grantId: string, dto: SubmitExpenseDto, tenantId: string, createdBy: string) {
    return this.prisma.grantExpense.create({
      data: {
        tenantId,
        grantId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        financeTransactionId: dto.financeTransactionId || null,
        receiptDocumentId: dto.receiptDocumentId || null,
        verificationStatus: dto.financeTransactionId ? 'VERIFIED' : 'PENDING',
        verifiedBy: dto.financeTransactionId ? 'FINANCE_SYNC' : null,
        verifiedAt: dto.financeTransactionId ? new Date() : null,
        createdBy,
      },
    });
  }

  async createMilestone(grantId: string, dto: CreateMilestoneDto, tenantId: string) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);

    return this.prisma.grantMilestone.create({
      data: {
        tenantId,
        grantId,
        title: dto.title,
        description: dto.description || null,
        dueDate: deadline,
        completionPercentage: dto.completionPercentage,
        status: dto.completionPercentage >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });
  }

  async submitGrantApplication(
    grantId: string,
    applicantUserId: string,
    requestedAmount: number,
    tenantId: string,
    startupId?: string,
    ssipProjectId?: string
  ) {
    const grant = await this.prisma.grant.findFirst({ where: { id: grantId, tenantId } });
    if (!grant) throw new BadRequestException(`Grant ${grantId} not found.`);

    const count = await this.prisma.grantApplication.count({ where: { tenantId } });
    const applicationNumber = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const application = await this.prisma.grantApplication.create({
      data: {
        tenantId,
        grantId,
        applicantUserId,
        startupId: startupId || null,
        ssipProjectId: ssipProjectId || null,
        applicationNumber,
        requestedAmount: requestedAmount || 0,
        status: 'SUBMITTED',
      },
    });

    // Create audit action
    await this.prisma.grantApprovalAction.create({
      data: {
        tenantId,
        grantApplicationId: application.id,
        entityType: 'GRANT_APPLICATION',
        entityId: application.id,
        actorId: applicantUserId,
        actorRole: 'APPLICANT',
        action: 'SUBMITTED',
        comment: 'Initial grant application submitted for scrutiny.',
      },
    });

    return application;
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
    const app = await this.prisma.grantApplication.findFirst({ where: { id: applicationId, tenantId } });
    if (!app) throw new BadRequestException(`Grant Application ${applicationId} not found.`);

    const updated = await this.prisma.grantApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
    });

    await this.prisma.grantApprovalAction.create({
      data: {
        tenantId,
        grantApplicationId: applicationId,
        entityType: 'GRANT_APPLICATION',
        entityId: applicationId,
        actorId,
        actorRole,
        action,
        comment,
      },
    });

    return updated;
  }

  async listGrantApplications(tenantId: string, grantId?: string, applicantUserId?: string, status?: string) {
    return this.prisma.grantApplication.findMany({
      where: {
        tenantId,
        ...(grantId ? { grantId } : {}),
        ...(applicantUserId ? { applicantUserId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        grant: true,
        startup: true,
        approvals: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMilestones(tenantId: string, grantId?: string, status?: string) {
    return this.prisma.grantMilestone.findMany({
      where: {
        tenantId,
        ...(grantId ? { grantId } : {}),
        ...(status ? { status } : {}),
      },
      include: { grant: true, startup: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async listExpenses(tenantId: string, grantId?: string, verificationStatus?: string) {
    return this.prisma.grantExpense.findMany({
      where: {
        tenantId,
        ...(grantId ? { grantId } : {}),
        ...(verificationStatus ? { verificationStatus } : {}),
      },
      include: { grant: true, startup: true },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async getGrantsSummaryReport(tenantId: string) {
    const [grants, applications, ssipProjects] = await Promise.all([
      this.prisma.grant.findMany({
        where: { tenantId },
        include: { fundReleases: true, expenses: true, milestones: true },
      }),
      this.prisma.grantApplication.findMany({ where: { tenantId } }),
      this.prisma.sSIPProject.findMany({ where: { tenantId } }),
    ]);

    const totalSanctioned = grants.reduce((sum, g) => sum + Number(g.sanctionedAmount || 0), 0);
    const totalReleased = grants.reduce((sum, g) => {
      const rel = g.fundReleases.filter(r => r.status === 'RELEASED').reduce((s, r) => s + Number(r.amount || 0), 0);
      return sum + rel;
    }, 0);
    const totalVerifiedExpense = grants.reduce((sum, g) => {
      const exp = g.expenses.filter(e => e.verificationStatus === 'VERIFIED').reduce((s, e) => s + Number(e.amount || 0), 0);
      return sum + exp;
    }, 0);
    const remainingBalance = totalReleased - totalVerifiedExpense;
    const overallUtilization = totalReleased > 0 ? Number(((totalVerifiedExpense / totalReleased) * 100).toFixed(2)) : 0;

    return {
      success: true,
      totalGrants: grants.length,
      activeGrants: grants.filter(g => g.status === 'ACTIVE').length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length,
      approvedApplications: applications.filter(a => a.status === 'APPROVED' || a.status === 'SANCTIONED').length,
      totalSSIPProjects: ssipProjects.length,
      totalSanctioned,
      totalReleased,
      totalVerifiedExpense,
      remainingBalance,
      overallUtilization,
      naacCriterion3: {
        metric3_1_1: {
          description: 'Grants received from Government and non-governmental agencies for research projects',
          totalSanctionedINR: totalSanctioned,
          fundedProjectsCount: grants.length + ssipProjects.length,
        },
        metric3_2_1: {
          description: 'Ecosystem for innovations, incubation centre and other initiatives for creation and transfer of knowledge',
          ssipProjectsCount: ssipProjects.length,
        },
      },
    };
  }
}
