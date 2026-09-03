import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganogramService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. SSIU Organogram Tree Hierarchy ──────────────────────────────────────

  async getOrganizationTree() {
    return {
      title: 'Swarrnim Startup & Innovation University (SSIU) Organogram',
      executive: {
        role: 'PRESIDENT',
        title: 'President',
        subordinate: {
          role: 'VICE_PRESIDENT',
          title: 'Vice President',
          subordinate: {
            role: 'PROVOST',
            title: 'Provost',
            functionalBranches: [
              {
                branch: 'UNIVERSITY_OPERATIONS',
                head: 'REGISTRAR',
                title: 'Registrar',
                subdepartments: [
                  { name: 'Finance & Accounts', head: 'FINANCE_OFFICER', sub: ['ACCOUNTANT'] },
                  { name: 'Examination Section', head: 'CONTROLLER_EXAMINATION', sub: ['DEPUTY_REGISTRAR_EXAM'] },
                  { name: 'Human Resources', head: 'HR', sub: [] },
                  { name: 'General Operations', head: 'DEPUTY_REGISTRAR', sub: ['ASSISTANT_REGISTRAR'] },
                  { name: 'Student Section', head: 'STUDENT_SECTION', sub: [] },
                  { name: 'Logistics & Campus', head: 'TRANSPORT_MANAGER', sub: ['HOSTEL_WARDEN'] },
                  { name: 'IT & Digital Systems', head: 'ERP_COORDINATOR', sub: [] },
                  { name: 'Knowledge Resource', head: 'LIBRARIAN', sub: [] },
                  { name: 'Sports & Wellness', head: 'SPORT_EXECUTIVE', sub: [] },
                ],
              },
              {
                branch: 'ACADEMICS_AND_INNOVATION',
                head: 'ACADEMIC_DEAN',
                title: 'Academic Dean',
                subdepartments: [
                  { name: 'IEDC & Entrepreneurship', head: 'HEAD_IEDC', sub: [] },
                  { name: 'Deans / Associate Deans', head: 'DEAN', sub: ['ASSOCIATE_DEAN'] },
                  { name: 'Institutes & Colleges', head: 'HEAD_OF_INSTITUTE', sub: ['HEAD_OF_DEPARTMENT', 'FACULTY', 'MENTOR', 'STUDENT'] },
                ],
              },
              {
                branch: 'INTERNAL_QUALITY_ASSURANCE',
                head: 'DIRECTOR_IQAC',
                title: 'Director IQAC',
                subdepartments: [
                  { name: 'Quality Cell', head: 'IQAC_COORDINATOR', sub: [] },
                ],
              },
              {
                branch: 'TRAINING_AND_PLACEMENT',
                head: 'DIRECTOR_TP',
                title: 'Director T&P',
                subdepartments: [
                  { name: 'Corporate Relations', head: 'GENERAL_MANAGER_TP', sub: ['PLACEMENT_EXECUTIVE', 'TRAINER'] },
                ],
              },
              {
                branch: 'UNIVERSITY_ADMISSIONS',
                head: 'DIRECTOR_ADMISSION',
                title: 'Director Admission',
                subdepartments: [
                  { name: 'Admissions Desk', head: 'MANAGER_ADMISSION', sub: ['BDM', 'BDE', 'COUNSELLOR'] },
                ],
              },
              {
                branch: 'RESEARCH_AND_DEVELOPMENT',
                head: 'DIRECTOR_RESEARCH',
                title: 'Director Research',
                subdepartments: [
                  { name: 'Research Cell', head: 'ASSOCIATE_DR', sub: [] },
                ],
              },
            ],
          },
        },
      },
    };
  }

  // ── 2. Role Master List ──────────────────────────────────────────────────────

  async getRoles() {
    return this.prisma.role.findMany({
      orderBy: { authorityLevel: 'desc' },
    });
  }

  // ── 3. User Role & Reporting Assignment ────────────────────────────────────

  async assignUserReporting(data: {
    userId: string;
    roleCode: string;
    reportsToUserId?: string;
    instituteId?: string;
    departmentId?: string;
    functionalDept?: string;
    scopeType?: string;
    reason?: string;
    assignedByUserId: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundException('User account not found.');

    const role = await this.prisma.role.findUnique({ where: { code: data.roleCode.toUpperCase() } });
    if (!role) throw new NotFoundException(`Role '${data.roleCode}' does not exist.`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current role if any
      const existingRole = await tx.userRole.findFirst({ where: { userId: data.userId } });

      // 2. Clear previous user roles & assign new role
      await tx.userRole.deleteMany({ where: { userId: data.userId } });
      await tx.userRole.create({
        data: {
          userId: data.userId,
          roleId: role.id,
          assignedBy: data.assignedByUserId,
          scopeType: data.scopeType || 'UNIVERSITY',
          scopeId: data.instituteId || data.departmentId,
        },
      });

      // 3. Upsert UserOrgReporting
      const reporting = await tx.userOrgReporting.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          roleCode: role.code,
          reportsToUserId: data.reportsToUserId,
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          functionalDept: data.functionalDept,
          authorityLevel: role.authorityLevel,
          status: 'ACTIVE',
        },
        update: {
          roleCode: role.code,
          reportsToUserId: data.reportsToUserId,
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          functionalDept: data.functionalDept,
          authorityLevel: role.authorityLevel,
        },
      });

      // 4. Record UserRoleHistory audit entry
      await tx.userRoleHistory.create({
        data: {
          userId: data.userId,
          oldRoleCode: existingRole ? existingRole.roleId : null,
          newRoleCode: role.code,
          reason: data.reason || 'Role & Reporting Line Assignment',
          approvedBy: data.assignedByUserId,
        },
      });

      return reporting;
    });
  }

  async getUserReporting(userId: string) {
    const reporting = await this.prisma.userOrgReporting.findUnique({
      where: { userId },
      include: { user: { select: { id: true, erpId: true, username: true, userRoles: { include: { role: true } } } } },
    });
    const history = await this.prisma.userRoleHistory.findMany({
      where: { userId },
      orderBy: { effectiveDate: 'desc' },
    });

    return { reporting, history };
  }

  // ── 4. Module Authority Matrix ─────────────────────────────────────────────

  async configureModuleAuthority(data: {
    module: string;
    roleCode: string;
    permission: string;
    scopeType?: string;
    canApprove?: boolean;
    canReject?: boolean;
    canForward?: boolean;
    canVerify?: boolean;
    reportsToRole?: string;
    nextAuthorityRole?: string;
  }) {
    return this.prisma.moduleAuthorityConfig.upsert({
      where: {
        module_roleCode_permission: {
          module: data.module.toUpperCase(),
          roleCode: data.roleCode.toUpperCase(),
          permission: data.permission.toUpperCase(),
        },
      },
      create: {
        module: data.module.toUpperCase(),
        roleCode: data.roleCode.toUpperCase(),
        permission: data.permission.toUpperCase(),
        scopeType: data.scopeType || 'UNIVERSITY',
        canApprove: data.canApprove ?? false,
        canReject: data.canReject ?? false,
        canForward: data.canForward ?? false,
        canVerify: data.canVerify ?? false,
        reportsToRole: data.reportsToRole?.toUpperCase(),
        nextAuthorityRole: data.nextAuthorityRole?.toUpperCase(),
        status: 'ACTIVE',
      },
      update: {
        scopeType: data.scopeType,
        canApprove: data.canApprove,
        canReject: data.canReject,
        canForward: data.canForward,
        canVerify: data.canVerify,
        reportsToRole: data.reportsToRole?.toUpperCase(),
        nextAuthorityRole: data.nextAuthorityRole?.toUpperCase(),
      },
    });
  }

  async getModuleAuthorityMatrix(module?: string) {
    return this.prisma.moduleAuthorityConfig.findMany({
      where: { ...(module ? { module: module.toUpperCase() } : {}) },
      orderBy: [{ module: 'asc' }, { roleCode: 'asc' }],
    });
  }
}
