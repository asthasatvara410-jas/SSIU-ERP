import { 
  UserRole, CampusServiceType, ApprovalRequestCategory, ApprovalOfficeType, 
  User, CampusServiceRequest, ApprovalRequest 
} from '../types';
import { db } from './db';

// ─── PERMITTED CAMPUS SERVICES PER ROLE ──────────────────────────────────────

export const PERMITTED_CAMPUS_SERVICES: Record<UserRole, CampusServiceType[]> = {
  STUDENT: [
    'Hostel',
    'Transport',
    'IT Support',
    'Maintenance',
    'Electrical',
    'Plumbing',
    'Cleaning',
    'Furniture',
    'Other'
  ],
  FACULTY: [
    'Maintenance',
    'Electrical',
    'Plumbing',
    'Cleaning',
    'IT Support',
    'Furniture',
    'Security',
    'Transport',
    'Hostel',
    'Other'
  ],
  MENTOR: [
    'Maintenance',
    'Electrical',
    'Plumbing',
    'Cleaning',
    'IT Support',
    'Furniture',
    'Security',
    'Transport',
    'Hostel',
    'Other'
  ],
  SUPER_ADMIN: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  PRESIDENT: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  VICE_PRESIDENT: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  PROVOST: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  UNIVERSITY_ADMIN: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  PRINCIPAL: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  HOD: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  REGISTRAR: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  DEPUTY_REGISTRAR: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Security', 'Transport', 'Hostel', 'Other'
  ],
  MAINTENANCE_ADMIN: [
    'Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'IT Support',
    'Furniture', 'Other'
  ],
  HOSTEL_ADMIN: ['Hostel', 'Plumbing', 'Electrical', 'Cleaning', 'Maintenance'],
  TRANSPORT_ADMIN: ['Transport', 'Maintenance'],
  LIBRARY_ADMIN: ['IT Support', 'Furniture', 'Maintenance', 'Cleaning'],
  EXAM_CELL: ['IT Support', 'Maintenance', 'Furniture'],
  STUDENT_SECTION: ['Maintenance', 'IT Support', 'Furniture'],
  ACCOUNTS_ADMIN: ['IT Support', 'Maintenance', 'Furniture'],
  IQAC: ['Maintenance', 'IT Support'],
  STUDENT_ADMIN: ['IT Support', 'Maintenance', 'Furniture'],
  HR_ADMIN: ['IT Support', 'Maintenance', 'Furniture', 'Cleaning'],
  HR_OFFICER: ['IT Support', 'Maintenance', 'Furniture', 'Cleaning'],
  ERP_COORDINATOR: ['IT Support', 'Maintenance', 'Electrical', 'Cleaning', 'Furniture', 'Other'],
  STAFF: ['IT Support', 'Maintenance', 'Electrical', 'Cleaning', 'Furniture', 'Other'],
  HOSTEL_WARDEN: ['Hostel', 'Plumbing', 'Electrical', 'Cleaning', 'Maintenance', 'Security', 'Other'],
  SECURITY: ['Security', 'Maintenance', 'IT Support', 'Other'],
  PARENT: []
};

// ─── PERMITTED APPROVAL REQUEST CATEGORIES PER ROLE ──────────────────────────

export const PERMITTED_APPROVAL_CATEGORIES: Record<UserRole, ApprovalRequestCategory[]> = {
  STUDENT: [
    'BONAFIDE_CERTIFICATE',
    'TRANSCRIPT_DEGREE',
    'FEE_CONCESSION',
    'HOSTEL_NO_DUES',
    'RE_EVALUATION',
    'NO_OBJECTION_CERTIFICATE'
  ],
  FACULTY: [
    'LEAVE_APPLICATION',
    'RESEARCH_GRANT',
    'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE',
    'NO_OBJECTION_CERTIFICATE',
    'GENERAL_ADMINISTRATIVE'
  ],
  STAFF: [
    'LEAVE_APPLICATION',
    'INFRASTRUCTURE_MAINTENANCE',
    'GENERAL_ADMINISTRATIVE'
  ],
  MENTOR: [
    'LEAVE_APPLICATION',
    'RESEARCH_GRANT',
    'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE',
    'NO_OBJECTION_CERTIFICATE',
    'GENERAL_ADMINISTRATIVE'
  ],
  SUPER_ADMIN: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'FEE_CONCESSION',
    'HOSTEL_NO_DUES', 'RE_EVALUATION', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'
  ],
  PRESIDENT: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'FEE_CONCESSION',
    'HOSTEL_NO_DUES', 'RE_EVALUATION', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'
  ],
  VICE_PRESIDENT: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'FEE_CONCESSION',
    'HOSTEL_NO_DUES', 'RE_EVALUATION', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'
  ],
  PROVOST: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'FEE_CONCESSION',
    'HOSTEL_NO_DUES', 'RE_EVALUATION', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'
  ],
  UNIVERSITY_ADMIN: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'FEE_CONCESSION',
    'HOSTEL_NO_DUES', 'RE_EVALUATION', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'
  ],
  PRINCIPAL: [
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'NO_OBJECTION_CERTIFICATE', 'GENERAL_ADMINISTRATIVE'
  ],
  HOD: [
    'LEAVE_APPLICATION', 'RESEARCH_GRANT', 'EVENT_PERMISSION',
    'INFRASTRUCTURE_MAINTENANCE', 'NO_OBJECTION_CERTIFICATE', 'GENERAL_ADMINISTRATIVE'
  ],
  REGISTRAR: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'EVENT_PERMISSION', 'GENERAL_ADMINISTRATIVE'
  ],
  DEPUTY_REGISTRAR: [
    'BONAFIDE_CERTIFICATE', 'TRANSCRIPT_DEGREE', 'NO_OBJECTION_CERTIFICATE',
    'LEAVE_APPLICATION', 'EVENT_PERMISSION', 'GENERAL_ADMINISTRATIVE'
  ],
  HOSTEL_ADMIN: ['HOSTEL_NO_DUES', 'INFRASTRUCTURE_MAINTENANCE'],
  TRANSPORT_ADMIN: ['INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'],
  EXAM_CELL: ['RE_EVALUATION', 'TRANSCRIPT_DEGREE'],
  STUDENT_SECTION: ['BONAFIDE_CERTIFICATE', 'NO_OBJECTION_CERTIFICATE', 'TRANSCRIPT_DEGREE'],
  IQAC: ['RESEARCH_GRANT', 'EVENT_PERMISSION'],
  MAINTENANCE_ADMIN: ['INFRASTRUCTURE_MAINTENANCE'],
  ACCOUNTS_ADMIN: ['FEE_CONCESSION', 'GENERAL_ADMINISTRATIVE'],
  LIBRARY_ADMIN: ['GENERAL_ADMINISTRATIVE'],
  STUDENT_ADMIN: ['GENERAL_ADMINISTRATIVE'],
  HR_ADMIN: ['LEAVE_APPLICATION', 'GENERAL_ADMINISTRATIVE'],
  HR_OFFICER: ['LEAVE_APPLICATION', 'GENERAL_ADMINISTRATIVE'],
  ERP_COORDINATOR: ['GENERAL_ADMINISTRATIVE', 'INFRASTRUCTURE_MAINTENANCE'],
  HOSTEL_WARDEN: ['LEAVE_APPLICATION', 'HOSTEL_NO_DUES', 'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'],
  SECURITY: ['LEAVE_APPLICATION', 'INFRASTRUCTURE_MAINTENANCE', 'GENERAL_ADMINISTRATIVE'],
  PARENT: []
};

// ─── PERMITTED TARGET OFFICES PER CATEGORY ───────────────────────────────────

export const CATEGORY_TARGET_OFFICE_MAP: Record<ApprovalRequestCategory, ApprovalOfficeType[]> = {
  BONAFIDE_CERTIFICATE: ['STUDENT_SECTION', 'REGISTRAR'],
  TRANSCRIPT_DEGREE: ['EXAM_CELL', 'STUDENT_SECTION', 'REGISTRAR'],
  FEE_CONCESSION: ['FINANCE_CELL', 'REGISTRAR', 'UNIVERSITY_ADMIN'],
  HOSTEL_NO_DUES: ['HOSTEL_ADMIN'],
  RE_EVALUATION: ['EXAM_CELL'],
  NO_OBJECTION_CERTIFICATE: ['STUDENT_SECTION', 'REGISTRAR', 'HOD_ACADEMIC'],
  LEAVE_APPLICATION: ['HOD_ACADEMIC', 'REGISTRAR', 'UNIVERSITY_ADMIN'],
  RESEARCH_GRANT: ['IQAC', 'REGISTRAR', 'UNIVERSITY_ADMIN'],
  EVENT_PERMISSION: ['REGISTRAR', 'IQAC', 'UNIVERSITY_ADMIN', 'HOD_ACADEMIC'],
  INFRASTRUCTURE_MAINTENANCE: ['MAINTENANCE_ADMIN'],
  GENERAL_ADMINISTRATIVE: ['REGISTRAR', 'UNIVERSITY_ADMIN', 'HOD_ACADEMIC', 'LIBRARY_ADMIN', 'TRANSPORT_ADMIN']
};

// ─── SECURITY & RBAC ENFORCEMENT FUNCTIONS ───────────────────────────────────

/**
 * Validates whether a given user role is permitted to submit a campus service request category.
 */
export const canUserAccessCampusService = (service: CampusServiceType, role?: UserRole | null): boolean => {
  if (!role) return false;
  const permitted = PERMITTED_CAMPUS_SERVICES[role] || [];
  return permitted.includes(service);
};

/**
 * Validates whether a given user role is permitted to submit an approval request category.
 */
export const canUserAccessApprovalCategory = (category: ApprovalRequestCategory, role?: UserRole | null): boolean => {
  if (!role) return false;
  const permitted = PERMITTED_APPROVAL_CATEGORIES[role] || [];
  return permitted.includes(category);
};

/**
 * Returns the list of permitted campus services for a given role.
 */
export const getPermittedCampusServices = (role?: UserRole | null): CampusServiceType[] => {
  if (!role) return [];
  return PERMITTED_CAMPUS_SERVICES[role] || [];
};

/**
 * Returns the list of permitted approval categories for a given role.
 */
export const getPermittedApprovalCategories = (role?: UserRole | null): ApprovalRequestCategory[] => {
  if (!role) return [];
  return PERMITTED_APPROVAL_CATEGORIES[role] || [];
};

/**
 * Returns permitted target offices for a given category and user role.
 */
export const getPermittedTargetOffices = (category: ApprovalRequestCategory, role?: UserRole | null): ApprovalOfficeType[] => {
  const offices = CATEGORY_TARGET_OFFICE_MAP[category] || ['REGISTRAR'];
  return offices;
};

/**
 * Core security check: Determines whether an authenticated user has authorization to view/access
 * a specific Campus Service Request.
 */
export const isUserAuthorizedForCampusServiceRequest = (
  req: CampusServiceRequest,
  user?: User | null,
  role?: UserRole | null
): boolean => {
  if (!user || !role) return false;

  // Executive leadership has full campus service visibility
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST'].includes(role)) {
    return true;
  }

  // Student Rule: A student can ONLY see their own requests
  if (role === 'STUDENT') {
    const isOwner =
      req.requestedById === user.id ||
      (Boolean(req.requestedByEmail) && req.requestedByEmail?.toLowerCase() === user.email?.toLowerCase()) ||
      (Boolean(user.enrollmentNo) && req.requestedByEnrollmentOrEmpId === user.enrollmentNo);
    return isOwner;
  }

  // Owner check for faculty / staff
  if (
    req.requestedById === user.id ||
    (Boolean(req.requestedByEmail) && req.requestedByEmail?.toLowerCase() === user.email?.toLowerCase())
  ) {
    return true;
  }

  // Assigned technician / staff check
  if (
    req.assignedToId === user.id ||
    (Boolean(req.assignedToName) && user.name && req.assignedToName!.toLowerCase().includes(user.name.toLowerCase()))
  ) {
    return true;
  }

  // Authority-specific scoping
  switch (role) {
    case 'HOSTEL_ADMIN':
      return req.service === 'Hostel' || req.location?.toLowerCase().includes('hostel');

    case 'TRANSPORT_ADMIN':
      return req.service === 'Transport';

    case 'MAINTENANCE_ADMIN':
      return ['Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'Furniture', 'IT Support', 'Other'].includes(req.service);

    case 'LIBRARY_ADMIN':
      return req.service === 'IT Support' || req.location?.toLowerCase().includes('library');

    case 'HOD':
      return Boolean(user.departmentId) && req.departmentId === user.departmentId;

    case 'PRINCIPAL':
      return Boolean(user.instituteId) && req.instituteId === user.instituteId;

    case 'REGISTRAR':
    case 'DEPUTY_REGISTRAR':
      return true;

    case 'FACULTY':
      return Boolean(user.departmentId) && req.departmentId === user.departmentId;

    default:
      return false;
  }
};

/**
 * Core security check: Determines whether an authenticated user has authorization to view/access
 * a specific Central Approval Request.
 */
export const isUserAuthorizedForApprovalRequest = (
  req: ApprovalRequest,
  user?: User | null,
  role?: UserRole | null
): boolean => {
  if (!user || !role) return false;

  // Executive leadership & Registrar office have full university-level oversight
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'REGISTRAR', 'DEPUTY_REGISTRAR', 'ASSISTANT_REGISTRAR'].includes(role)) {
    return true;
  }

  // Student Rule: A student can ONLY see their own requests
  if (role === 'STUDENT') {
    const isOwner =
      req.applicantId === user.id ||
      (Boolean(req.applicantEmail) && req.applicantEmail?.toLowerCase() === user.email?.toLowerCase()) ||
      (Boolean(user.enrollmentNo) && req.applicantEnrollmentOrEmpId === user.enrollmentNo);
    return isOwner;
  }

  // Requester ownership check
  if (
    req.applicantId === user.id ||
    (Boolean(req.applicantEmail) && req.applicantEmail?.toLowerCase() === user.email?.toLowerCase())
  ) {
    return true;
  }

  const roleOfficeMap: Partial<Record<UserRole, ApprovalOfficeType>> = {
    REGISTRAR: 'REGISTRAR',
    DEPUTY_REGISTRAR: 'REGISTRAR',
    IQAC: 'IQAC',
    EXAM_CELL: 'EXAM_CELL',
    STUDENT_SECTION: 'STUDENT_SECTION',
    HOSTEL_ADMIN: 'HOSTEL_ADMIN',
    LIBRARY_ADMIN: 'LIBRARY_ADMIN',
    TRANSPORT_ADMIN: 'TRANSPORT_ADMIN',
    MAINTENANCE_ADMIN: 'MAINTENANCE_ADMIN',
    HOD: 'HOD_ACADEMIC',
  };

  const userOffice = roleOfficeMap[role];

  // Target office or current review desk match
  if (userOffice && (req.currentOffice === userOffice || req.targetOffice === userOffice)) {
    return true;
  }

  // Academic hierarchy checks
  if (role === 'HOD' && user.departmentId && req.departmentId === user.departmentId) {
    return true;
  }

  if (role === 'PRINCIPAL' && user.instituteId && req.instituteId === user.instituteId) {
    return true;
  }

  return false;
};

// ─── UNIFIED ROLE-PERMISSION MAPPINGS & HIERARCHICAL SCOPE ENGINE ────────────

import { ErpPermission } from '../types';
import { UnauthorizedError, ForbiddenError } from './apiResponse';

export const ROLE_ERP_PERMISSIONS: Record<UserRole, ErpPermission[]> = {
  SUPER_ADMIN: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_DELETE', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_DELETE', 'FACULTY_IMPORT',
    'INSTITUTE_MANAGE', 'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT', 'APPROVAL_DECIDE',
    'EXAM_VIEW', 'EXAM_MANAGE', 'MARKS_ENTRY', 'MARKS_APPROVE',
    'FEE_VIEW', 'FEE_MANAGE', 'PAYMENT_COLLECT',
    'HOSTEL_MANAGE', 'TRANSPORT_MANAGE', 'INVENTORY_MANAGE', 'LIBRARY_MANAGE',
    'CAMPUS_SERVICE_MANAGE', 'AUDIT_VIEW', 'SETTINGS_MANAGE'
  ],
  PRESIDENT: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_DELETE', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_DELETE', 'FACULTY_IMPORT',
    'INSTITUTE_MANAGE', 'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT', 'APPROVAL_DECIDE',
    'EXAM_VIEW', 'EXAM_MANAGE', 'MARKS_ENTRY', 'MARKS_APPROVE',
    'FEE_VIEW', 'FEE_MANAGE', 'PAYMENT_COLLECT',
    'HOSTEL_MANAGE', 'TRANSPORT_MANAGE', 'INVENTORY_MANAGE', 'LIBRARY_MANAGE',
    'CAMPUS_SERVICE_MANAGE', 'AUDIT_VIEW', 'SETTINGS_MANAGE'
  ],
  VICE_PRESIDENT: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_DELETE', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_DELETE', 'FACULTY_IMPORT',
    'INSTITUTE_MANAGE', 'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT', 'APPROVAL_DECIDE',
    'EXAM_VIEW', 'EXAM_MANAGE', 'MARKS_ENTRY', 'MARKS_APPROVE',
    'FEE_VIEW', 'FEE_MANAGE', 'PAYMENT_COLLECT',
    'HOSTEL_MANAGE', 'TRANSPORT_MANAGE', 'INVENTORY_MANAGE', 'LIBRARY_MANAGE',
    'CAMPUS_SERVICE_MANAGE', 'AUDIT_VIEW', 'SETTINGS_MANAGE'
  ],
  PROVOST: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_DELETE', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_DELETE', 'FACULTY_IMPORT',
    'INSTITUTE_MANAGE', 'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT', 'APPROVAL_DECIDE',
    'EXAM_VIEW', 'EXAM_MANAGE', 'MARKS_ENTRY', 'MARKS_APPROVE',
    'FEE_VIEW', 'FEE_MANAGE', 'PAYMENT_COLLECT',
    'HOSTEL_MANAGE', 'TRANSPORT_MANAGE', 'INVENTORY_MANAGE', 'LIBRARY_MANAGE',
    'CAMPUS_SERVICE_MANAGE', 'AUDIT_VIEW', 'SETTINGS_MANAGE'
  ],
  UNIVERSITY_ADMIN: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_DELETE', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_DELETE', 'FACULTY_IMPORT',
    'INSTITUTE_MANAGE', 'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT', 'APPROVAL_DECIDE',
    'EXAM_VIEW', 'EXAM_MANAGE', 'MARKS_ENTRY', 'MARKS_APPROVE',
    'FEE_VIEW', 'FEE_MANAGE', 'PAYMENT_COLLECT',
    'HOSTEL_MANAGE', 'TRANSPORT_MANAGE', 'INVENTORY_MANAGE', 'LIBRARY_MANAGE',
    'CAMPUS_SERVICE_MANAGE', 'AUDIT_VIEW', 'SETTINGS_MANAGE'
  ],
  REGISTRAR: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_IMPORT',
    'INSTITUTE_MANAGE', 'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE',
    'AUDIT_VIEW'
  ],
  DEPUTY_REGISTRAR: [
    'STUDENT_VIEW',
    'FACULTY_VIEW',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE',
    'AUDIT_VIEW'
  ],
  PRINCIPAL: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_IMPORT',
    'DEPARTMENT_MANAGE', 'PROGRAM_MANAGE', 'SUBJECT_MANAGE',
    'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_APPROVE', 'NOTESHEET_FORWARD', 'NOTESHEET_REJECT',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE',
    'CAMPUS_SERVICE_MANAGE', 'INVENTORY_MANAGE'
  ],
  HOD: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_IMPORT',
    'FACULTY_VIEW', 'FACULTY_CREATE', 'FACULTY_EDIT', 'FACULTY_IMPORT',
    'SUBJECT_MANAGE', 'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_REVIEW', 'NOTESHEET_FORWARD',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE',
    'CAMPUS_SERVICE_MANAGE', 'INVENTORY_MANAGE'
  ],
  FACULTY: [
    'STUDENT_VIEW', 'SUBJECT_MANAGE', 'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'MARKS_ENTRY',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT',
    'CAMPUS_SERVICE_MANAGE'
  ],
  MENTOR: [
    'STUDENT_VIEW', 'SUBJECT_MANAGE', 'ATTENDANCE_MANAGE', 'TIMETABLE_MANAGE',
    'MARKS_ENTRY',
    'NOTESHEET_VIEW', 'NOTESHEET_CREATE',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT',
    'CAMPUS_SERVICE_MANAGE'
  ],
  STUDENT: [
    'STUDENT_VIEW',
    'APPROVAL_VIEW', 'APPROVAL_SUBMIT',
    'CAMPUS_SERVICE_MANAGE'
  ],
  STUDENT_SECTION: [
    'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_IMPORT',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  EXAM_CELL: [
    'EXAM_VIEW', 'EXAM_MANAGE', 'MARKS_ENTRY', 'MARKS_APPROVE',
    'SUBJECT_MANAGE', 'TIMETABLE_MANAGE',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  ACCOUNTS_ADMIN: [
    'FEE_VIEW', 'FEE_MANAGE', 'PAYMENT_COLLECT',
    'NOTESHEET_VIEW', 'NOTESHEET_REVIEW',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  HOSTEL_ADMIN: [
    'HOSTEL_MANAGE', 'INVENTORY_MANAGE',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  TRANSPORT_ADMIN: [
    'TRANSPORT_MANAGE',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  LIBRARY_ADMIN: [
    'LIBRARY_MANAGE', 'INVENTORY_MANAGE',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  MAINTENANCE_ADMIN: [
    'CAMPUS_SERVICE_MANAGE', 'INVENTORY_MANAGE',
    'APPROVAL_VIEW', 'APPROVAL_DECIDE'
  ],
  IQAC: [
    'FACULTY_VIEW', 'AUDIT_VIEW', 'SUBJECT_MANAGE',
    'NOTESHEET_VIEW', 'NOTESHEET_REVIEW'
  ],
  STUDENT_ADMIN: [
    'STUDENT_VIEW',
    'STUDENT_CREATE',
    'STUDENT_EDIT',
    'STUDENT_IMPORT'
  ],
  HR_ADMIN: [
    'FACULTY_VIEW',
    'FACULTY_CREATE',
    'FACULTY_EDIT',
    'FACULTY_IMPORT',
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_REVIEW',
    'NOTESHEET_APPROVE',
    'APPROVAL_VIEW',
    'APPROVAL_DECIDE'
  ],
  HR_OFFICER: [
    'FACULTY_VIEW',
    'FACULTY_CREATE',
    'FACULTY_EDIT',
    'FACULTY_IMPORT',
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'APPROVAL_VIEW'
  ],
  ERP_COORDINATOR: [
    'STUDENT_VIEW',
    'FACULTY_VIEW',
    'AUDIT_VIEW',
    'NOTESHEET_VIEW',
    'APPROVAL_VIEW',
    'INVENTORY_MANAGE',
    'SETTINGS_MANAGE'
  ],
  STAFF: [
    'INVENTORY_MANAGE',
    'NOTESHEET_VIEW',
    'APPROVAL_SUBMIT',
    'APPROVAL_VIEW'
  ],
  HOSTEL_WARDEN: [
    'HOSTEL_MANAGE',
    'NOTESHEET_VIEW',
    'APPROVAL_SUBMIT',
    'APPROVAL_VIEW'
  ],
  SECURITY: [
    'CAMPUS_SERVICE_MANAGE',
    'APPROVAL_VIEW'
  ],
  PARENT: []
};

/**
 * Checks if a user has a specific permission based on their role
 */
export function hasPermission(
  user: User | null,
  role: UserRole | null,
  permission: ErpPermission
): boolean {
  if (!user || !role) return false;
  const permissions = ROLE_ERP_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export interface ScopeTarget {
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  studentId?: string;
  facultyId?: string;
}

/**
 * Enforces Organizational Scope Verification
 * Validates whether the caller has rights to interact with a specific department or institute.
 */
export function verifyScopeAccess(
  user: User | null,
  role: UserRole | null,
  target: ScopeTarget
): { allowed: boolean; reason?: string } {
  if (!user || !role) {
    return { allowed: false, reason: '401 Unauthorized: Session authentication required.' };
  }

  // 1. Super Admin, University Admin, and Registrar have unrestricted university-level scope
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'].includes(role)) {
    return { allowed: true };
  }

  // 1b. Deputy Registrar Scope: Scoped to assigned Institutes and Departments
  if (role === 'DEPUTY_REGISTRAR') {
    const scopes = db.getDeputyRegistrarScopeByUserId(user.id);
    if (scopes.length === 0) {
      return {
        allowed: false,
        reason: '403 Forbidden: No departmental/institutional scope has been assigned to this Deputy Registrar.'
      };
    }

    if (target.instituteId) {
      const matchInst = scopes.some(s => s.instituteId === target.instituteId);
      if (!matchInst) {
        return {
          allowed: false,
          reason: `403 Forbidden: Institutional scope violation: You are not assigned to Institute "${target.instituteId}".`
        };
      }
    }

    if (target.departmentId) {
      const matchDept = scopes.some(s => {
        const instMatch = !target.instituteId || s.instituteId === target.instituteId;
        const deptMatch = s.departmentIds.length > 0 ? s.departmentIds.includes(target.departmentId!) : false;
        return instMatch && deptMatch;
      });

      if (!matchDept) {
        return {
          allowed: false,
          reason: `403 Forbidden: Departmental scope violation: You are not assigned to Department "${target.departmentId}".`
        };
      }
    }

    return { allowed: true };
  }

  // 2. Student Scope: Can only access own records
  if (role === 'STUDENT') {
    if (target.studentId && target.studentId !== user.id) {
      return { allowed: false, reason: '403 Forbidden: Students can only view their own student records.' };
    }
    return { allowed: true };
  }

  // 3. Principal (HOI) Scope: Strictly scoped to user's institute
  if (role === 'PRINCIPAL') {
    if (!user.instituteId) {
      return { allowed: false, reason: '403 Forbidden: Principal session is missing authorized Institute ID.' };
    }
    if (target.instituteId && target.instituteId !== user.instituteId) {
      return {
        allowed: false,
        reason: `403 Forbidden: As Principal of Institute "${user.instituteId}", you cannot access records for Institute "${target.instituteId}".`
      };
    }
    return { allowed: true };
  }

  // 4. HOD Scope: Strictly scoped to user's department & institute
  if (role === 'HOD') {
    if (!user.departmentId) {
      return { allowed: false, reason: '403 Forbidden: HOD session is missing authorized Department ID.' };
    }
    if (target.departmentId && target.departmentId !== user.departmentId) {
      return {
        allowed: false,
        reason: `403 Forbidden: As HOD of Department "${user.departmentId}", you cannot access records for Department "${target.departmentId}".`
      };
    }
    if (target.instituteId && user.instituteId && target.instituteId !== user.instituteId) {
      return {
        allowed: false,
        reason: `403 Forbidden: Department scope violation: Institute mismatch.`
      };
    }
    return { allowed: true };
  }

  // 5. Specialized Administrative Offices
  if (role === 'STUDENT_SECTION' || role === 'EXAM_CELL' || role === 'ACCOUNTS_ADMIN') {
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Generic collection filter for data queries matching caller's organizational scope
 */
export function filterRecordsByScope<T extends { instituteId?: string; departmentId?: string }>(
  records: T[],
  user: User | null,
  role: UserRole | null
): T[] {
  if (!user || !role || !Array.isArray(records)) return [];

  // University level administrators (unrestricted)
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'STUDENT_SECTION', 'EXAM_CELL', 'ACCOUNTS_ADMIN'].includes(role)) {
    return records;
  }

  // Deputy Registrar (Assigned Institutes & Departments)
  if (role === 'DEPUTY_REGISTRAR') {
    const scopes = db.getDeputyRegistrarScopeByUserId(user.id);
    if (scopes.length === 0) return [];
    return records.filter(r => {
      return scopes.some(s => {
        const matchInst = !r.instituteId || s.instituteId === r.instituteId;
        const matchDept = s.departmentIds.length > 0 ? (Boolean(r.departmentId) && s.departmentIds.includes(r.departmentId!)) : false;
        return matchInst && matchDept;
      });
    });
  }

  // Principal (Institute level)
  if (role === 'PRINCIPAL') {
    if (!user.instituteId) return [];
    return records.filter(r => !r.instituteId || r.instituteId === user.instituteId);
  }

  // HOD (Department level)
  if (role === 'HOD') {
    if (!user.departmentId) return [];
    return records.filter(r => 
      (!r.departmentId || r.departmentId === user.departmentId) &&
      (!r.instituteId || !user.instituteId || r.instituteId === user.instituteId)
    );
  }

  // Faculty (Department level for faculty shared datasets)
  if (role === 'FACULTY') {
    if (!user.departmentId) return records;
    return records.filter(r => !r.departmentId || r.departmentId === user.departmentId);
  }

  return records;
}

/**
 * Top-level API Security Enforcement helper
 * Validates Authentication + Permission + Scope, throwing standardized ApiErrors on violation.
 */
export function enforceApiSecurity(
  user: User | null,
  role: UserRole | null,
  permission: ErpPermission,
  targetScope?: ScopeTarget
): void {
  if (!user || !role) {
    throw new UnauthorizedError('401 Unauthorized: Valid session credentials required.');
  }

  if (!hasPermission(user, role, permission)) {
    throw new ForbiddenError(`403 Forbidden: Role "${role}" lacks required permission "${permission}".`);
  }

  if (targetScope) {
    const scopeCheck = verifyScopeAccess(user, role, targetScope);
    if (!scopeCheck.allowed) {
      throw new ForbiddenError(scopeCheck.reason || '403 Forbidden: Organizational scope violation.');
    }
  }
}

