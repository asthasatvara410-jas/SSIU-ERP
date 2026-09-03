import { User, UserRole } from '../../types';
import { ERPPermission } from './permissions';
import { resolveUserOrganizationScope } from './organizationScope';

export interface ResourceAccessContext {
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  facultyId?: string;
  studentId?: string;
  mentorId?: string;
  custodianId?: string;
  isOwner?: boolean;
}

/**
 * Centralized Enterprise Permission Evaluator
 * Usage: can(currentUser, 'EDIT_STUDENT', { departmentId: 'dept-1' })
 */
export function can(
  user: User | null | undefined,
  permission: ERPPermission,
  resource?: ResourceAccessContext
): boolean {
  if (!user) return false;

  const role = (user.role || '').toUpperCase() as UserRole;
  const scope = resolveUserOrganizationScope(user);

  // 1. Super Administrators & University Executive Leadership have universal authorization
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN'].includes(role)) {
    return true;
  }

  // 2. Registrar & University Governance
  if (role === 'REGISTRAR' || role === 'DEPUTY_REGISTRAR') {
    if (permission.startsWith('MANAGE_SECURITY') || permission === 'RESET_SYSTEM_DATABASE') {
      return role === 'REGISTRAR';
    }
    return true;
  }

  // 3. Principal / HOI / Dean
  if (['PRINCIPAL', 'HOI', 'DEAN', 'DIRECTOR'].includes(role)) {
    // Check institute scope boundary
    if (resource?.instituteId && !scope.allowedInstituteIds.includes(resource.instituteId)) {
      return false;
    }

    const principalAllowed: ERPPermission[] = [
      'VIEW_STUDENT', 'VIEW_STUDENT_PROFILE', 'EXPORT_STUDENT', 'VERIFY_STUDENT_DOCUMENT',
      'VIEW_FACULTY', 'EXPORT_FACULTY', 'VIEW_FACULTY_WORKLOAD', 'ASSIGN_FACULTY_WORKLOAD',
      'VIEW_ORGANIZATION', 'VIEW_INSTITUTE', 'MANAGE_INSTITUTE', 'VIEW_DEPARTMENT', 'MANAGE_DEPARTMENT', 'APPOINT_HOD', 'VIEW_PROGRAM',
      'VIEW_ATTENDANCE', 'EXPORT_ATTENDANCE', 'VIEW_SESSION_PLAN', 'VIEW_STUDY_MATERIAL', 'VIEW_ACADEMIC_CALENDAR',
      'VIEW_EXAMINATION', 'VIEW_EXAM_ELIGIBILITY', 'APPROVE_EXAM_ELIGIBILITY', 'GENERATE_HALL_TICKET',
      'VIEW_REQUEST', 'APPROVE_REQUEST', 'REJECT_REQUEST', 'ESCALATE_REQUEST',
      'VIEW_ASSET', 'ASSIGN_ASSET', 'TRANSFER_ASSET', 'RETURN_ASSET', 'REPLACE_ASSET', 'EXPORT_ASSET',
      'VIEW_FEE', 'VIEW_FINANCIAL_REPORTS',
      'CREATE_NOTESHEET', 'VIEW_NOTESHEET', 'FORWARD_NOTESHEET', 'APPROVE_NOTESHEET', 'REJECT_NOTESHEET',
      'VIEW_FEEDBACK', 'RESOLVE_FEEDBACK', 'VIEW_IQAC_ANALYTICS',
      'VIEW_REPORTS', 'EXPORT_DATA', 'GENERATE_NAAC_REPORT', 'GENERATE_NBA_REPORT',
      'VIEW_AUDIT_LOG'
    ];

    return principalAllowed.includes(permission);
  }

  // 4. Head of Department (HOD)
  if (role === 'HOD') {
    // Check department scope boundary
    if (resource?.departmentId && !scope.allowedDepartmentIds.includes(resource.departmentId)) {
      return false;
    }

    const hodAllowed: ERPPermission[] = [
      'VIEW_STUDENT', 'VIEW_STUDENT_PROFILE', 'EDIT_STUDENT', 'EXPORT_STUDENT', 'VERIFY_STUDENT_DOCUMENT',
      'VIEW_FACULTY', 'EDIT_FACULTY', 'EXPORT_FACULTY', 'VIEW_FACULTY_WORKLOAD', 'ASSIGN_FACULTY_WORKLOAD',
      'VIEW_DEPARTMENT', 'VIEW_PROGRAM',
      'VIEW_ATTENDANCE', 'TAKE_ATTENDANCE', 'EDIT_ATTENDANCE', 'EXPORT_ATTENDANCE', 'VIEW_SESSION_PLAN', 'MANAGE_SESSION_PLAN', 'VIEW_STUDY_MATERIAL', 'UPLOAD_STUDY_MATERIAL',
      'VIEW_EXAMINATION', 'VIEW_EXAM_ELIGIBILITY', 'ENDORSE_EXAM_ELIGIBILITY', 'ENTER_MARKS',
      'CREATE_REQUEST', 'VIEW_REQUEST', 'APPROVE_REQUEST', 'REJECT_REQUEST', 'ESCALATE_REQUEST',
      'VIEW_ASSET', 'ASSIGN_ASSET', 'TRANSFER_ASSET', 'RETURN_ASSET', 'REPLACE_ASSET', 'REPORT_ASSET_ISSUE', 'PERFORM_ASSET_VERIFICATION', 'EXPORT_ASSET',
      'CREATE_NOTESHEET', 'VIEW_NOTESHEET', 'FORWARD_NOTESHEET',
      'VIEW_FEEDBACK', 'RESOLVE_FEEDBACK',
      'VIEW_REPORTS', 'EXPORT_DATA'
    ];

    return hodAllowed.includes(permission);
  }

  // 5. Faculty Members
  if (role === 'FACULTY') {
    // Faculty can view students/materials within their department or assigned classes
    if (resource?.departmentId && !scope.allowedDepartmentIds.includes(resource.departmentId)) {
      return false;
    }

    const facultyAllowed: ERPPermission[] = [
      'VIEW_STUDENT', 'VIEW_STUDENT_PROFILE', 'EXPORT_STUDENT',
      'VIEW_FACULTY', 'VIEW_FACULTY_WORKLOAD',
      'VIEW_DEPARTMENT', 'VIEW_PROGRAM',
      'VIEW_ATTENDANCE', 'TAKE_ATTENDANCE', 'EDIT_ATTENDANCE', 'EXPORT_ATTENDANCE',
      'VIEW_SESSION_PLAN', 'MANAGE_SESSION_PLAN', 'VIEW_STUDY_MATERIAL', 'UPLOAD_STUDY_MATERIAL', 'VIEW_ACADEMIC_CALENDAR',
      'VIEW_EXAMINATION', 'VIEW_EXAM_ELIGIBILITY', 'ENTER_MARKS',
      'CREATE_REQUEST', 'VIEW_REQUEST',
      'VIEW_ASSET', 'TRANSFER_ASSET', 'RETURN_ASSET', 'REPLACE_ASSET', 'REPORT_ASSET_ISSUE',
      'CREATE_NOTESHEET', 'VIEW_NOTESHEET',
      'SUBMIT_FEEDBACK', 'VIEW_FEEDBACK',
      'VIEW_REPORTS'
    ];

    return facultyAllowed.includes(permission);
  }

  // 6. Mentors
  if (role === 'MENTOR') {
    if (resource?.mentorId && resource.mentorId !== user.id) {
      return false;
    }

    const mentorAllowed: ERPPermission[] = [
      'VIEW_STUDENT', 'VIEW_STUDENT_PROFILE',
      'VIEW_ATTENDANCE', 'VIEW_EXAM_ELIGIBILITY', 'ENDORSE_EXAM_ELIGIBILITY',
      'VIEW_REQUEST', 'APPROVE_REQUEST', 'REJECT_REQUEST',
      'VIEW_FEEDBACK', 'VIEW_REPORTS'
    ];

    return mentorAllowed.includes(permission);
  }

  // 7. Student & Parents (Self Scope Only)
  if (role === 'STUDENT' || role === 'PARENT') {
    if (resource?.studentId && resource.studentId !== user.id && resource.studentId !== user.enrollmentNo) {
      return false;
    }

    const studentAllowed: ERPPermission[] = [
      'VIEW_STUDENT_PROFILE', 'EDIT_STUDENT_PROFILE',
      'VIEW_ATTENDANCE', 'VIEW_SESSION_PLAN', 'VIEW_STUDY_MATERIAL', 'VIEW_ACADEMIC_CALENDAR',
      'VIEW_EXAMINATION', 'VIEW_EXAM_ELIGIBILITY', 'GENERATE_HALL_TICKET',
      'CREATE_REQUEST', 'VIEW_REQUEST',
      'VIEW_FEE',
      'SUBMIT_FEEDBACK'
    ];

    return studentAllowed.includes(permission);
  }

  return false;
}
