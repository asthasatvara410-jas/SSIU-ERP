import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCouncilDto,
  CreateClubDto,
  AssignMemberDto,
  CreateMeetingDto,
  UpdateMeetingStatusDto,
  CreateEventProposalDto,
  ReviewEventProposalDto,
  CouncilQueryDto,
  CouncilCommitteeType,
  MeetingStatus,
  EventProposalStatus,
} from './dto/student-council.dto';

const COUNCIL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'UNIVERSITY_ADMIN',
  'VICE_PRESIDENT',
  'REGISTRAR',
  'PRINCIPAL',
  'HOI',
  'HOD',
  'FACULTY',
  'FACULTY_COORDINATOR',
  'DEPUTY_REGISTRAR',
];

const EXECUTIVE_BEARER_ROLES = [
  'PRESIDENT',
  'VICE_PRESIDENT',
  'GENERAL_SECRETARY',
  'JOINT_SECRETARY',
  'TREASURER',
  'FACULTY_COORDINATOR',
];

@Injectable()
export class StudentCouncilService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Authoritative check: Ensures user has administrative permissions over council desk.
   * Students and unauthorized roles are strictly blocked.
   */
  private checkAdminAuthority(user: any, actionName: string = 'manage student council') {
    const role = (user?.role || '').toUpperCase();
    if (!COUNCIL_ADMIN_ROLES.includes(role)) {
      throw new ForbiddenException(`Access denied: Students and unauthorized users cannot ${actionName}.`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // A & C. COUNCIL & CLUB DIRECTORY
  // ─────────────────────────────────────────────────────────────────────────────

  async createCouncil(user: any, dto: CreateCouncilDto) {
    this.checkAdminAuthority(user, 'create student council');

    const existing = await this.prisma.committee.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Council with code "${dto.code}" already exists.`);
    }

    const council = await this.prisma.committee.create({
      data: {
        code: dto.code,
        name: dto.name,
        committeeType: dto.committeeType || CouncilCommitteeType.STUDENT_COUNCIL,
        chairperson: dto.chairperson || null,
        secretary: dto.secretary || null,
        status: 'ACTIVE',
      },
    });

    return council;
  }

  async createClub(user: any, dto: CreateClubDto) {
    this.checkAdminAuthority(user, 'create club or student committee');

    const existing = await this.prisma.committee.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Organization with code "${dto.code}" already exists.`);
    }

    const club = await this.prisma.committee.create({
      data: {
        code: dto.code,
        name: dto.name,
        committeeType: dto.committeeType || CouncilCommitteeType.STUDENT_CLUB,
        chairperson: dto.chairperson || null,
        secretary: dto.secretary || null,
        status: 'ACTIVE',
      },
    });

    return club;
  }

  async listOrganizations(user: any, query: CouncilQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.committeeType) {
      where.committeeType = query.committeeType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { chairperson: { contains: query.search, mode: 'insensitive' } },
        { secretary: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.committee.count({ where }),
      this.prisma.committee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true, meetings: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationDetails(user: any, id: string) {
    const org = await this.prisma.committee.findUnique({
      where: { id },
      include: {
        members: true,
        meetings: {
          orderBy: { meetingDate: 'desc' },
          take: 10,
          include: { actionItems: true },
        },
      },
    });
    if (!org) {
      throw new NotFoundException(`Organization with id "${id}" not found.`);
    }

    // If user is a student, filter out non-published meetings
    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    if (isStudent && org.meetings) {
      org.meetings = org.meetings.filter((m) => m.status === MeetingStatus.PUBLISHED);
    }

    return org;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // B & D. OFFICE BEARERS & MEMBERSHIP MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async assignMember(user: any, dto: AssignMemberDto) {
    this.checkAdminAuthority(user, 'assign council members or office bearers');

    const org = await this.prisma.committee.findUnique({
      where: { id: dto.committeeId },
    });
    if (!org) {
      throw new NotFoundException(`Organization with id "${dto.committeeId}" not found.`);
    }

    // 1. Check duplicate active membership by student/user ID or name
    const existingMembership = await this.prisma.committeeMember.findFirst({
      where: {
        committeeId: dto.committeeId,
        OR: [
          ...(dto.userId ? [{ userId: dto.userId }] : []),
          { memberName: { equals: dto.memberName, mode: 'insensitive' } },
        ],
      },
    });
    if (existingMembership) {
      throw new BadRequestException(
        `Student "${dto.memberName}" is already an active member of this organization.`,
      );
    }

    // 2. Prevent duplicate active office bearer for single-holder executive posts
    const targetRole = (dto.role || 'MEMBER').toUpperCase();
    if (EXECUTIVE_BEARER_ROLES.includes(targetRole) && targetRole !== 'FACULTY_COORDINATOR') {
      const existingBearer = await this.prisma.committeeMember.findFirst({
        where: {
          committeeId: dto.committeeId,
          role: targetRole,
        },
      });
      if (existingBearer) {
        throw new BadRequestException(
          `Post of "${targetRole}" is already occupied by "${existingBearer.memberName}" in this organization.`,
        );
      }
    }

    const member = await this.prisma.committeeMember.create({
      data: {
        committeeId: dto.committeeId,
        userId: dto.userId || null,
        memberName: dto.memberName,
        role: targetRole,
        joinedAt: new Date(),
      },
    });

    return member;
  }

  async removeMember(user: any, memberId: string) {
    this.checkAdminAuthority(user, 'remove organization members');

    const member = await this.prisma.committeeMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with id "${memberId}" not found.`);
    }

    await this.prisma.committeeMember.delete({
      where: { id: memberId },
    });

    return { success: true, message: `Member "${member.memberName}" removed.` };
  }

  async listMembers(user: any, committeeId: string, query: CouncilQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { committeeId };
    if (query.search) {
      where.OR = [
        { memberName: { contains: query.search, mode: 'insensitive' } },
        { role: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.committeeMember.count({ where }),
      this.prisma.committeeMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listOfficeBearers(user: any, query: CouncilQueryDto) {
    const where: any = {
      role: { in: EXECUTIVE_BEARER_ROLES },
    };
    if (query.committeeType) {
      where.committee = { committeeType: query.committeeType };
    }

    const bearers = await this.prisma.committeeMember.findMany({
      where,
      include: {
        committee: {
          select: { id: true, name: true, code: true, committeeType: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return bearers;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // E. MEETINGS & MOM WORKFLOW
  // ─────────────────────────────────────────────────────────────────────────────

  async createMeeting(user: any, dto: CreateMeetingDto) {
    this.checkAdminAuthority(user, 'create council meeting minutes');

    const meetingCount = await this.prisma.committeeMeeting.count();
    const meetingNo = `MOM-${new Date().getFullYear()}-${String(meetingCount + 1).padStart(6, '0')}`;

    const meeting = await this.prisma.committeeMeeting.create({
      data: {
        meetingNo,
        committeeId: dto.committeeId,
        meetingDate: new Date(dto.meetingDate),
        venue: dto.venue || 'Council Chamber',
        agenda: dto.agenda,
        minutes: dto.minutes || null,
        status: MeetingStatus.DRAFT,
      },
    });

    // Create action items if provided
    if (dto.actionItems && dto.actionItems.length > 0) {
      for (const item of dto.actionItems) {
        await this.prisma.committeeActionItem.create({
          data: {
            meetingId: meeting.id,
            itemNumber: item.itemNumber,
            description: item.description,
            responsibleDepartment: item.responsibleDepartment || 'Student Affairs',
            responsiblePerson: item.responsiblePerson || 'Unassigned',
            deadline: new Date(item.deadline),
            status: 'PENDING',
          },
        });
      }
    }

    return this.prisma.committeeMeeting.findUnique({
      where: { id: meeting.id },
      include: { actionItems: true },
    });
  }

  async updateMeetingStatus(user: any, meetingId: string, dto: UpdateMeetingStatusDto) {
    this.checkAdminAuthority(user, 'update meeting status or publish MoM');

    const meeting = await this.prisma.committeeMeeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with id "${meetingId}" not found.`);
    }

    const updated = await this.prisma.committeeMeeting.update({
      where: { id: meetingId },
      data: {
        status: dto.status,
        ...(dto.minutes ? { minutes: dto.minutes } : {}),
      },
      include: { actionItems: true },
    });

    return updated;
  }

  async listMeetings(user: any, committeeId?: string, query?: CouncilQueryDto) {
    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    const where: any = {};

    if (committeeId) {
      where.committeeId = committeeId;
    }

    // STRICT VISIBILITY: Students can only view PUBLISHED MoMs!
    if (isStudent) {
      where.status = MeetingStatus.PUBLISHED;
    } else if (query?.status) {
      where.status = query.status;
    }

    const meetings = await this.prisma.committeeMeeting.findMany({
      where,
      orderBy: { meetingDate: 'desc' },
      include: {
        committee: { select: { id: true, name: true, code: true } },
        actionItems: true,
      },
    });

    return meetings;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // F. EVENT PROPOSAL WORKFLOW
  // ─────────────────────────────────────────────────────────────────────────────

  async createEventProposal(user: any, dto: CreateEventProposalDto) {
    const count = await this.prisma.statutoryApproval.count({
      where: { category: 'STUDENT_EVENT_PROPOSAL' },
    });
    const requestNo = `EVT-PROP-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const metadata = {
      eventDate: dto.eventDate,
      venue: dto.venue || 'University Main Campus',
      estimatedBudget: dto.estimatedBudget || 0,
      expectedParticipants: dto.expectedParticipants || 0,
      facultyCoordinator: dto.facultyCoordinator || 'TBD',
      description: dto.description || '',
      submittedByUserId: user?.id,
      submittedByRole: user?.role,
    };

    const proposal = await this.prisma.statutoryApproval.create({
      data: {
        requestNo,
        title: dto.title,
        category: 'STUDENT_EVENT_PROPOSAL',
        applicantEntity: dto.organizingClub,
        instituteId: dto.instituteId || user?.instituteId || null,
        departmentId: dto.departmentId || user?.departmentId || null,
        submittedDate: new Date(),
        status: EventProposalStatus.SUBMITTED,
        remarks: JSON.stringify(metadata),
      },
    });

    return {
      ...proposal,
      metadata,
    };
  }

  async reviewEventProposal(user: any, proposalId: string, dto: ReviewEventProposalDto) {
    const role = (user?.role || '').toUpperCase();

    // 1. Students are strictly forbidden from approving proposals
    if (role === 'STUDENT') {
      throw new ForbiddenException('Students are not permitted to review or approve event proposals.');
    }

    const proposal = await this.prisma.statutoryApproval.findUnique({
      where: { id: proposalId },
    });
    if (!proposal || proposal.category !== 'STUDENT_EVENT_PROPOSAL') {
      throw new NotFoundException(`Event proposal with id "${proposalId}" not found.`);
    }

    // 2. Prevent self-approval if applicant is the reviewer
    let metadata: any = {};
    try {
      metadata = JSON.parse(proposal.remarks || '{}');
    } catch {
      metadata = {};
    }

    if (metadata.submittedByUserId && metadata.submittedByUserId === user.id) {
      throw new ForbiddenException('Conflict of interest: Proposal creator cannot approve their own event proposal.');
    }

    metadata.reviewRemarks = dto.remarks || '';
    metadata.reviewedBy = user.username || user.name || 'Staff';

    const updated = await this.prisma.statutoryApproval.update({
      where: { id: proposalId },
      data: {
        status: dto.status,
        actionedByUserId: user.id,
        actionedByName: user.username || user.name || 'Authorized Staff',
        actionedAt: new Date(),
        remarks: JSON.stringify(metadata),
      },
    });

    return {
      ...updated,
      metadata,
    };
  }

  async listEventProposals(user: any, query?: CouncilQueryDto) {
    const where: any = {
      category: 'STUDENT_EVENT_PROPOSAL',
    };
    if (query?.status) {
      where.status = query.status;
    }

    const proposals = await this.prisma.statutoryApproval.findMany({
      where,
      orderBy: { submittedDate: 'desc' },
    });

    return proposals.map((p) => {
      let metadata: any = {};
      try {
        metadata = JSON.parse(p.remarks || '{}');
      } catch {
        metadata = {};
      }
      return {
        ...p,
        metadata,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // G. COUNCIL EXECUTIVE DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────

  async getDashboardMetrics(user: any) {
    const [
      activeCouncilsCount,
      activeClubsCount,
      totalOfficeBearersCount,
      totalActiveMembersCount,
      pendingProposalsCount,
      approvedProposalsCount,
      pendingMoMsCount,
      actionItemsDueSoonCount,
      recentApprovedProposalsList,
    ] = await Promise.all([
      this.prisma.committee.count({
        where: { committeeType: CouncilCommitteeType.STUDENT_COUNCIL, status: 'ACTIVE' },
      }),
      this.prisma.committee.count({
        where: {
          committeeType: { not: CouncilCommitteeType.STUDENT_COUNCIL },
          status: 'ACTIVE',
        },
      }),
      this.prisma.committeeMember.count({
        where: { role: { in: EXECUTIVE_BEARER_ROLES } },
      }),
      this.prisma.committeeMember.count(),
      this.prisma.statutoryApproval.count({
        where: {
          category: 'STUDENT_EVENT_PROPOSAL',
          status: { in: [EventProposalStatus.SUBMITTED, EventProposalStatus.FACULTY_REVIEW, EventProposalStatus.COUNCIL_REVIEW] },
        },
      }),
      this.prisma.statutoryApproval.count({
        where: {
          category: 'STUDENT_EVENT_PROPOSAL',
          status: EventProposalStatus.APPROVED,
        },
      }),
      this.prisma.committeeMeeting.count({
        where: { status: { in: [MeetingStatus.DRAFT, MeetingStatus.SUBMITTED, MeetingStatus.UNDER_REVIEW] } },
      }),
      this.prisma.committeeActionItem.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.statutoryApproval.findMany({
        where: {
          category: 'STUDENT_EVENT_PROPOSAL',
          status: EventProposalStatus.APPROVED,
        },
        orderBy: { actionedAt: 'desc' },
        take: 5,
      }),
    ]);

    const recentApprovedProposals = recentApprovedProposalsList.map((p) => {
      let meta: any = {};
      try {
        meta = JSON.parse(p.remarks || '{}');
      } catch {
        meta = {};
      }
      return {
        id: p.id,
        requestNo: p.requestNo,
        title: p.title,
        applicantEntity: p.applicantEntity,
        actionedAt: p.actionedAt,
        actionedByName: p.actionedByName,
        ...meta,
      };
    });

    return {
      activeCouncilsCount,
      activeClubsCount,
      totalOfficeBearersCount,
      totalActiveMembersCount,
      upcomingEventsCount: approvedProposalsCount,
      pendingProposalsCount,
      pendingMoMsCount,
      actionItemsDueSoonCount,
      recentApprovedProposals,
      timestamp: new Date().toISOString(),
    };
  }
}
