/**
 * SSIU ERP — Roles & RBAC Management Domain Types
 * File: src/modules/permissions/types/index.ts
 */

import { UserRole } from '../../../types';

export interface RolePermissionConfigDTO {
  role: UserRole;
  roleTitle: string;
  category: 'LEADERSHIP' | 'ADMINISTRATION' | 'ACADEMIC' | 'OPERATIONS' | 'STUDENT_SERVICES';
  totalAssignedUsers: number;
  isSystemProtected: boolean;
  permissions: Record<string, {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canExport: boolean;
  }>;
}

export interface UserCustomScopeDTO {
  userId: string;
  userName: string;
  role: UserRole;
  allowedInstitutes: string[];
  allowedDepartments: string[];
  isCrossCampusAuthorized: boolean;
  validUntil?: string;
  grantedBy: string;
}

export interface PermissionAuditEntryDTO {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorName: string;
  targetRoleOrUser: string;
  actionType: 'ROLE_MODIFIED' | 'SCOPE_GRANTED' | 'SCOPE_REVOKED' | 'CUSTOM_PERMISSION_SET';
  details: string;
  beforeState: string;
  afterState: string;
}
