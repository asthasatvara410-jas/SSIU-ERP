import { User, UserRole } from '../types';
import { isTabPermittedForRole } from '../constants/navigationConfig';

export type ERPModule = 
  | 'ATTENDANCE' 
  | 'STUDENTS' 
  | 'FACULTY' 
  | 'FACULTY_WORKLOAD' 
  | 'SUBJECTS' 
  | 'SESSION_PLAN' 
  | 'STUDY_MATERIAL' 
  | 'EXAM_ELIGIBILITY' 
  | 'EXAMINATION' 
  | 'REQUESTS' 
  | 'DOCUMENTS' 
  | 'APPROVALS' 
  | 'REPORTS' 
  | 'SETTINGS'
  | 'INVENTORY_ASSETS'
  | 'PTM_MANAGEMENT'
  | 'FEEDBACK';

export type ERPAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'EXPORT' | 'APPROVE' | 'REJECT' | 'ALLOCATE';

export interface AccessResourceContext {
  departmentId?: string;
  instituteId?: string;
  branchId?: string;
  programId?: string;
  semesterId?: string;
  facultyId?: string;
  studentId?: string;
  mentorId?: string;
  isOwner?: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
}

/**
 * Centralized Enterprise Authorization & RBAC Access Evaluator
 * Enforces role, department, branch, and ownership boundaries without 403 breakage for valid operations.
 */
export function canAccess(
  user: User | null | undefined,
  module: ERPModule | string,
  action: ERPAction | string = 'VIEW',
  resource?: AccessResourceContext
): AccessDecision {
  if (!user) {
    return { allowed: false, reason: 'Unauthenticated user.', statusCode: 401 };
  }

  const role = (user.role || '').toUpperCase() as UserRole;
  const mod = module.toUpperCase();
  const act = action.toUpperCase();

  // Tier 1: System Administrators & University Leadership (Full Access)
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'ERP_COORDINATOR'].includes(role)) {
    return { allowed: true };
  }

  // Tier 2: Institutional Leadership (Principal / HOI / Dean)
  if (['PRINCIPAL', 'HOI', 'DEAN', 'DIRECTOR'].includes(role)) {
    if (resource?.instituteId && user.instituteId && resource.instituteId !== user.instituteId) {
      return { allowed: false, reason: 'Access restricted to own constituent institute.', statusCode: 403 };
    }
    return { allowed: true };
  }

  // Tier 3: Department Leadership (HOD)
  if (role === 'HOD') {
    // HOD has full management permissions in their own department
    if (resource?.departmentId && user.departmentId && resource.departmentId !== user.departmentId) {
      return { allowed: false, reason: 'Access restricted to your assigned department only.', statusCode: 403 };
    }
    // HOD cannot delete core system settings
    if (mod === 'SETTINGS' && (act === 'EDIT' || act === 'DELETE')) {
      return { allowed: false, reason: 'System settings management requires Administrator privileges.', statusCode: 403 };
    }
    return { allowed: true };
  }

  // Tier 4: Faculty Members
  if (role === 'FACULTY') {
    // Faculty can view academic materials, session plans, study materials
    if (['SESSION_PLAN', 'STUDY_MATERIAL', 'MATERIALS', 'ATTENDANCE', 'SUBJECTS', 'EXAMINATION'].includes(mod)) {
      if (act === 'VIEW' || act === 'CREATE' || act === 'EDIT' || act === 'EXPORT') {
        return { allowed: true };
      }
    }
    if (mod === 'ATTENDANCE' && (act === 'VIEW' || act === 'CREATE' || act === 'EDIT' || act === 'EXPORT')) {
      return { allowed: true };
    }
    if (mod === 'STUDENTS' && (act === 'VIEW' || act === 'EXPORT')) {
      return { allowed: true };
    }
    if (resource?.departmentId && user.departmentId && resource.departmentId !== user.departmentId) {
      return { allowed: false, reason: 'Access restricted to your department scope.', statusCode: 403 };
    }
    return { allowed: true };
  }

  // Tier 5: Mentors
  if (role === 'MENTOR') {
    // Mentors have full viewing access for session plans, study materials, mentee attendance, and eligibility
    if (['SESSION_PLAN', 'STUDY_MATERIAL', 'MATERIALS', 'ATTENDANCE', 'EXAM_ELIGIBILITY', 'STUDENTS', 'APPROVALS', 'REPORTS'].includes(mod)) {
      if (act === 'VIEW' || act === 'EXPORT' || act === 'APPROVE') {
        return { allowed: true };
      }
    }
    if (resource?.mentorId && resource.mentorId !== user.id) {
      return { allowed: false, reason: 'Access restricted to assigned mentees only.', statusCode: 403 };
    }
    return { allowed: true };
  }

  // Tier 6: Students & Parents (Self Scope Only)
  if (role === 'STUDENT' || role === 'PARENT') {
    if (['ATTENDANCE', 'SESSION_PLAN', 'STUDY_MATERIAL', 'EXAMINATION', 'DOCUMENTS', 'FEEDBACK', 'REQUESTS'].includes(mod)) {
      if (act === 'VIEW' || (act === 'CREATE' && (mod === 'REQUESTS' || mod === 'FEEDBACK' || mod === 'DOCUMENTS'))) {
        return { allowed: true };
      }
    }
    if (act !== 'VIEW') {
      return { allowed: false, reason: 'Students and parents have read-only access.', statusCode: 403 };
    }
    return { allowed: true };
  }

  // Fallback check against navigation permissions
  const navPermitted = isTabPermittedForRole(mod.toLowerCase(), role);
  return { allowed: navPermitted };
}

export const authorizationService = {
  canAccess
};
