import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ── Committees & Meetings ───────────────────────────────────────────────────

  async createCommittee(code: string, name: string, committeeType: string, chairperson?: string, secretary?: string) {
    const existing = await this.prisma.committee.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) throw new ConflictException(`Committee code '${code}' already exists.`);

    return this.prisma.committee.create({
      data: { code: code.toUpperCase(), name, committeeType: committeeType.toUpperCase(), chairperson, secretary, status: 'ACTIVE' },
    });
  }

  async getCommittees() {
    return this.prisma.committee.findMany({
      include: { members: true, meetings: true, _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async addCommitteeMember(committeeId: string, memberName: string, role: string = 'MEMBER', userId?: string) {
    const committee = await this.prisma.committee.findUnique({ where: { id: committeeId } });
    if (!committee) throw new NotFoundException('Committee not found.');

    return this.prisma.committeeMember.create({
      data: { committeeId, memberName, role: role.toUpperCase(), userId },
    });
  }

  async createCommitteeMeeting(committeeId: string, meetingDate: string, agenda: string, venue?: string, minutes?: string) {
    const meetingNo = await this.nextSeq('CMT-M', () => this.prisma.committeeMeeting.count());

    return this.prisma.committeeMeeting.create({
      data: {
        meetingNo,
        committeeId,
        meetingDate: new Date(meetingDate),
        venue,
        agenda,
        minutes,
        status: 'SCHEDULED',
      },
      include: { committee: true },
    });
  }

  async getCommitteeMeetings(committeeId?: string) {
    return this.prisma.committeeMeeting.findMany({
      where: { ...(committeeId ? { committeeId } : {}) },
      include: { committee: true },
      orderBy: { meetingDate: 'desc' },
    });
  }

  // ── Policies & Circulars ────────────────────────────────────────────────────

  async createPolicy(title: string, category: string, effectiveDate: string, version: string = '1.0', documentUrl?: string) {
    const policyNo = await this.nextSeq('POL', () => this.prisma.policy.count());

    return this.prisma.policy.create({
      data: {
        policyNo,
        title,
        category: category.toUpperCase(),
        version,
        effectiveDate: new Date(effectiveDate),
        documentUrl,
        status: 'PUBLISHED',
      },
    });
  }

  async getPolicies(category?: string) {
    return this.prisma.policy.findMany({
      where: { ...(category ? { category: category.toUpperCase() } : {}) },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createCircular(title: string, content: string, audience: string = 'ALL', documentUrl?: string) {
    const circularNo = await this.nextSeq('CIR', () => this.prisma.circular.count());

    return this.prisma.circular.create({
      data: {
        circularNo,
        title,
        content,
        audience: audience.toUpperCase(),
        documentUrl,
        status: 'PUBLISHED',
      },
    });
  }

  async getCirculars(audience?: string) {
    return this.prisma.circular.findMany({
      where: { ...(audience ? { audience: audience.toUpperCase() } : {}) },
      orderBy: { issueDate: 'desc' },
    });
  }

  // ── RTI Requests ─────────────────────────────────────────────────────────────

  async createRTI(applicantName: string, subject: string, responsibleOfficer: string, dueDate: string) {
    const rtiNo = await this.nextSeq('RTI', () => this.prisma.rTIRequest.count());

    return this.prisma.rTIRequest.create({
      data: {
        rtiNo,
        applicantName,
        subject,
        responsibleOfficer,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
    });
  }

  async getRTIs(status?: string) {
    return this.prisma.rTIRequest.findMany({
      where: { ...(status ? { status: status.toUpperCase() } : {}) },
      orderBy: { receivedDate: 'desc' },
    });
  }

  // ── Legal Cases ─────────────────────────────────────────────────────────────

  async createLegalCase(courtName: string, caseType: string, petitioner: string, respondent: string, responsibleOfficer: string, hearingDate?: string) {
    const caseNo = await this.nextSeq('LGL', () => this.prisma.legalCase.count());

    return this.prisma.legalCase.create({
      data: {
        caseNo,
        courtName,
        caseType: caseType.toUpperCase(),
        petitioner,
        respondent,
        responsibleOfficer,
        hearingDate: hearingDate ? new Date(hearingDate) : undefined,
        status: 'PENDING',
      },
    });
  }

  async getLegalCases(status?: string) {
    return this.prisma.legalCase.findMany({
      where: { ...(status ? { status: status.toUpperCase() } : {}) },
      orderBy: { caseNo: 'desc' },
    });
  }

  // ── Grievances ──────────────────────────────────────────────────────────────

  async submitGrievance(category: string, subject: string, description: string, assignedOffice: string, priority: string = 'NORMAL', userId?: string) {
    const ticketNo = await this.nextSeq('GRV', () => this.prisma.grievance.count());

    return this.prisma.grievance.create({
      data: {
        ticketNo,
        userId,
        category: category.toUpperCase(),
        priority: priority.toUpperCase(),
        subject,
        description,
        assignedOffice,
        status: 'SUBMITTED',
      },
    });
  }

  async getGrievances(status?: string, userId?: string) {
    return this.prisma.grievance.findMany({
      where: {
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── File Tracking ───────────────────────────────────────────────────────────

  async createFile(subject: string, originOffice: string, currentOffice: string, currentHolder: string) {
    const fileNo = await this.nextSeq('FL', () => this.prisma.fileTracking.count());

    return this.prisma.fileTracking.create({
      data: {
        fileNo,
        subject,
        originOffice,
        currentOffice,
        currentHolder,
        status: 'ACTIVE',
      },
    });
  }

  async getFiles(status?: string) {
    return this.prisma.fileTracking.findMany({
      where: { ...(status ? { status: status.toUpperCase() } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async forwardFile(id: string, newOffice: string, newHolder: string) {
    const file = await this.prisma.fileTracking.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File tracking record not found.');

    return this.prisma.fileTracking.update({
      where: { id },
      data: {
        currentOffice: newOffice,
        currentHolder: newHolder,
        status: 'IN_TRANSIT',
      },
    });
  }
}
