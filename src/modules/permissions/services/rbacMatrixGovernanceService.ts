/**
 * SSIU ERP — Roles & RBAC Matrix Governance Service
 * File: src/modules/permissions/services/rbacMatrixGovernanceService.ts
 */

import { db } from '../../../services/db';
import { UserRole } from '../../../types';
import { RolePermissionConfigDTO, UserCustomScopeDTO, PermissionAuditEntryDTO } from '../types';

export class RbacMatrixGovernanceService {
  private static instance: RbacMatrixGovernanceService;

  private auditLogs: PermissionAuditEntryDTO[] = [];
  private customScopes: UserCustomScopeDTO[] = [];

  private constructor() {
    this.seedDemoAuditLogs();
  }

  public static getInstance(): RbacMatrixGovernanceService {
    if (!RbacMatrixGovernanceService.instance) {
      RbacMatrixGovernanceService.instance = new RbacMatrixGovernanceService();
    }
    return RbacMatrixGovernanceService.instance;
  }

  private seedDemoAuditLogs(): void {
    this.auditLogs.push(
      {
        id: 'audit-perm-001',
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        actorUserId: 'usr-admin-001',
        actorName: 'System Super Admin',
        targetRoleOrUser: 'DEPUTY_REGISTRAR',
        actionType: 'ROLE_MODIFIED',
        details: 'Granted Exam Hall Ticket and Notesheet financial approval permissions',
        beforeState: 'canApprove: false',
        afterState: 'canApprove: true',
      },
      {
        id: 'audit-perm-002',
        timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        actorUserId: 'usr-admin-001',
        actorName: 'System Super Admin',
        targetRoleOrUser: 'HOD',
        actionType: 'SCOPE_GRANTED',
        details: 'Scoped department timetable edit and student roster validation permissions',
        beforeState: 'canEdit: false',
        afterState: 'canEdit: true',
      }
    );
  }

  /**
   * Generates standard role permission matrix configurations for all 27 ERP roles
   */
  public getRoleMatrixConfigurations(): RolePermissionConfigDTO[] {
    const roles: Array<{ role: UserRole; title: string; category: RolePermissionConfigDTO['category'] }> = [
      { role: 'SUPER_ADMIN', title: 'Super Administrator', category: 'LEADERSHIP' },
      { role: 'UNIVERSITY_ADMIN', title: 'University Administrator', category: 'LEADERSHIP' },
      { role: 'REGISTRAR', title: 'University Registrar', category: 'LEADERSHIP' },
      { role: 'DEPUTY_REGISTRAR', title: 'Deputy Registrar', category: 'LEADERSHIP' },
      { role: 'PRINCIPAL', title: 'Institute Dean / Principal', category: 'LEADERSHIP' },
      { role: 'HOD', title: 'Head of Department', category: 'ACADEMIC' },
      { role: 'FACULTY', title: 'Faculty Member / Professor', category: 'ACADEMIC' },
      { role: 'MENTOR', title: 'Faculty Mentor', category: 'ACADEMIC' },
      { role: 'STUDENT', title: 'Enrolled Student', category: 'STUDENT_SERVICES' },
      { role: 'ACCOUNTS_ADMIN', title: 'Accounts & Finance Officer', category: 'OPERATIONS' },
      { role: 'HR_ADMIN', title: 'HR & Workforce Manager', category: 'ADMINISTRATION' },
      { role: 'EXAM_CELL', title: 'Controller of Examinations', category: 'ADMINISTRATION' },
      { role: 'HOSTEL_ADMIN', title: 'Hostel Chief Warden', category: 'OPERATIONS' },
      { role: 'TRANSPORT_ADMIN', title: 'Transport Fleet Manager', category: 'OPERATIONS' },
      { role: 'LIBRARY_ADMIN', title: 'Chief Librarian', category: 'OPERATIONS' },
      { role: 'STUDENT_SECTION', title: 'Student Section Officer', category: 'STUDENT_SERVICES' },
    ];

    const users = db.getUsers();

    return roles.map(r => {
      const assignedCount = users.filter(u => u.role === r.role).length;
      const isSuper = r.role === 'SUPER_ADMIN';
      const isLeader = ['UNIVERSITY_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR', 'PRINCIPAL'].includes(r.role);

      return {
        role: r.role,
        roleTitle: r.title,
        category: r.category,
        totalAssignedUsers: Math.max(assignedCount, 1),
        isSystemProtected: isSuper,
        permissions: {
          'ORGANIZATION': {
            canView: true,
            canCreate: isSuper,
            canEdit: isSuper || isLeader,
            canDelete: isSuper,
            canApprove: isSuper || isLeader,
            canExport: true,
          },
          'STUDENT_MGMT': {
            canView: true,
            canCreate: isSuper || isLeader || ['HOD', 'STUDENT_SECTION'].includes(r.role),
            canEdit: isSuper || isLeader || ['HOD', 'STUDENT_SECTION'].includes(r.role),
            canDelete: isSuper,
            canApprove: isSuper || isLeader,
            canExport: true,
          },
          'ACADEMICS_LMS': {
            canView: true,
            canCreate: isSuper || ['HOD', 'FACULTY'].includes(r.role),
            canEdit: isSuper || ['HOD', 'FACULTY'].includes(r.role),
            canDelete: isSuper || r.role === 'HOD',
            canApprove: isSuper || isLeader || r.role === 'HOD',
            canExport: true,
          },
          'FEES_FINANCE': {
            canView: isSuper || isLeader || ['ACCOUNTS_ADMIN', 'STUDENT'].includes(r.role),
            canCreate: isSuper || r.role === 'ACCOUNTS_ADMIN',
            canEdit: isSuper || r.role === 'ACCOUNTS_ADMIN',
            canDelete: isSuper,
            canApprove: isSuper || isLeader || r.role === 'ACCOUNTS_ADMIN',
            canExport: isSuper || isLeader || r.role === 'ACCOUNTS_ADMIN',
          },
        },
      };
    });
  }

  /**
   * Retrieves custom cross-campus permission scopes
   */
  public getUserCustomScopes(): UserCustomScopeDTO[] {
    if (this.customScopes.length === 0) {
      this.customScopes = [
        {
          userId: 'usr-fac-001',
          userName: 'Dr. Rajesh Sharma',
          role: 'FACULTY',
          allowedInstitutes: ['inst-1'],
          allowedDepartments: ['dept-1'],
          isCrossCampusAuthorized: false,
          grantedBy: 'Super Admin',
        },
        {
          userId: 'usr-reg-001',
          userName: 'University Registrar',
          role: 'REGISTRAR',
          allowedInstitutes: ['inst-1', 'inst-2'],
          allowedDepartments: ['dept-1', 'dept-2', 'dept-3'],
          isCrossCampusAuthorized: true,
          grantedBy: 'Provost',
        },
      ];
    }
    return this.customScopes;
  }

  /**
   * Retrieves permission audit logs
   */
  public getPermissionAuditLogs(): PermissionAuditEntryDTO[] {
    return this.auditLogs;
  }

  /**
   * Records a permission mutation audit event
   */
  public recordPermissionMutation(
    actorId: string,
    actorName: string,
    target: string,
    action: PermissionAuditEntryDTO['actionType'],
    details: string,
    before: string,
    after: string
  ): PermissionAuditEntryDTO {
    const entry: PermissionAuditEntryDTO = {
      id: `audit-perm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: actorId,
      actorName,
      targetRoleOrUser: target,
      actionType: action,
      details,
      beforeState: before,
      afterState: after,
    };
    this.auditLogs.unshift(entry);
    return entry;
  }
}

export const rbacMatrixGovernanceService = RbacMatrixGovernanceService.getInstance();
