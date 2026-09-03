import { UserRole, AccountStatus, AccessStatusType, DataScopeType } from './index';

// ─── 20 CANONICAL PERMISSION ACTIONS ──────────────────────────────────────────
export type PermissionActionType = 
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'VERIFY'
  | 'EXPORT'
  | 'PRINT'
  | 'DOWNLOAD'
  | 'MANAGE'
  | 'ASSIGN'
  | 'PUBLISH'
  | 'PROCESS'
  | 'RECALCULATE'
  | 'GENERATE'
  | 'SCAN'
  | 'CHECK_IN'
  | 'CHECK_OUT';

export const ALL_PERMISSION_ACTIONS: PermissionActionType[] = [
  'VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT',
  'SUBMIT', 'VERIFY', 'EXPORT', 'PRINT', 'DOWNLOAD', 'MANAGE',
  'ASSIGN', 'PUBLISH', 'PROCESS', 'RECALCULATE', 'GENERATE', 'SCAN',
  'CHECK_IN', 'CHECK_OUT'
];

// ─── CANONICAL ERP MODULES ───────────────────────────────────────────────────
export type AdminModuleKey =
  | 'Dashboard'
  | 'User Management'
  | 'Academic'
  | 'Students'
  | 'Faculty'
  | 'Departments'
  | 'Programs'
  | 'Subjects'
  | 'Attendance'
  | 'Timetable'
  | 'Assignments'
  | 'Results'
  | 'Examination'
  | 'Exam Forms'
  | 'Exam Fees'
  | 'Backlog / Re-Exam'
  | 'Reassessment / Rechecking'
  | 'Hall Ticket'
  | 'Fees & Payments'
  | 'Student Section'
  | 'Hostel'
  | 'Hostel Gate Pass'
  | 'Transport'
  | 'DigiLocker & Documents'
  | 'Academic Credits / ABC'
  | 'Requests'
  | 'Feedback'
  | 'PTM Consultation'
  | 'Research & Innovation'
  | 'Grants & SSIP'
  | 'Notesheet'
  | 'Notifications'
  | 'Reports'
  | 'Audit Logs'
  | 'System Settings';

export interface AdminModuleDefinition {
  key: AdminModuleKey;
  name: string;
  category: 'Core' | 'Academic' | 'Examinations' | 'Students & Staff' | 'Finance & Admin' | 'Campus' | 'Governance' | 'System';
  description: string;
  supportedActions: PermissionActionType[];
}

export const ADMIN_ERP_MODULES: AdminModuleDefinition[] = [
  { key: 'Dashboard', name: 'Dashboard & Executive KPI', category: 'Core', description: 'Institutional analytics, KPI cards, and operational overview', supportedActions: ['VIEW', 'EXPORT', 'PRINT', 'RECALCULATE'] },
  { key: 'User Management', name: 'User Management & Accounts', category: 'System', description: 'Central user accounts, credentials, statuses, and locks', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE', 'EXPORT', 'PRINT'] },
  { key: 'Academic', name: 'Academic & Curriculum', category: 'Academic', description: 'Syllabus, session plans, study materials, and academic calendars', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'PRINT', 'PUBLISH'] },
  { key: 'Students', name: 'Student Master & Directory', category: 'Students & Staff', description: 'Student enrollment records, profiles, and academic histories', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'VERIFY', 'EXPORT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Faculty', name: 'Faculty Directory & Workload', category: 'Students & Staff', description: 'Faculty profiles, workload transfers, and subject allocations', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'PROCESS', 'EXPORT', 'PRINT'] },
  { key: 'Departments', name: 'University Departments', category: 'Academic', description: 'Academic departments, HOD assignments, and resources', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE', 'EXPORT'] },
  { key: 'Programs', name: 'Academic Programs & Degrees', category: 'Academic', description: 'Degree programs, intake capacities, and regulations', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE', 'EXPORT'] },
  { key: 'Subjects', name: 'Subject Masters & Courses', category: 'Academic', description: 'Course codes, credits, lecture/lab hour configurations', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'EXPORT'] },
  { key: 'Attendance', name: 'Student Attendance Register', category: 'Academic', description: 'Daily session attendance, leaves, and eligibility tracking', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'VERIFY', 'APPROVE', 'RECALCULATE', 'EXPORT', 'PRINT'] },
  { key: 'Timetable', name: 'Academic Timetable & Scheduling', category: 'Academic', description: 'Classroom schedules, lab allocations, and faculty load', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'GENERATE', 'PUBLISH', 'PRINT', 'EXPORT'] },
  { key: 'Assignments', name: 'Assignments & LMS', category: 'Academic', description: 'Coursework assignments, submissions, and grading', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'SUBMIT', 'VERIFY', 'DOWNLOAD', 'PRINT'] },
  { key: 'Results', name: 'Results & Marksheets', category: 'Examinations', description: 'Semester results, grade sheets, transcripts, and publishing', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE', 'VERIFY', 'GENERATE', 'PUBLISH', 'EXPORT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Examination', name: 'Examination Central Desk', category: 'Examinations', description: 'Exam sessions, schedules, seating, and duty assignments', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'MANAGE', 'EXPORT', 'PRINT'] },
  { key: 'Exam Forms', name: 'Examination Enrollment Forms', category: 'Examinations', description: 'Student exam form registrations and verification', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'VERIFY', 'APPROVE', 'REJECT', 'EXPORT', 'PRINT'] },
  { key: 'Exam Fees', name: 'Exam Fee Collection & Slips', category: 'Examinations', description: 'Exam fee payments, receipt generation, and reconciliations', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'PROCESS', 'VERIFY', 'EXPORT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Backlog / Re-Exam', name: 'Backlog & Remedial Exams', category: 'Examinations', description: 'Remedial exam applications, eligibility, and fee processing', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'APPROVE', 'REJECT', 'PROCESS', 'EXPORT', 'PRINT'] },
  { key: 'Reassessment / Rechecking', name: 'Reassessment & Rechecking', category: 'Examinations', description: 'Answer sheet review applications, re-evaluations, and results', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'VERIFY', 'APPROVE', 'PROCESS', 'EXPORT', 'PRINT'] },
  { key: 'Hall Ticket', name: 'Admit Cards & Hall Tickets', category: 'Examinations', description: 'Exam hall ticket generation, QR validation, and printing', supportedActions: ['VIEW', 'GENERATE', 'VERIFY', 'PRINT', 'DOWNLOAD', 'SCAN'] },
  { key: 'Fees & Payments', name: 'University Fees & Finance', category: 'Finance & Admin', description: 'Tuition fees, receipts, refunds, ledgers, and settlements', supportedActions: ['VIEW', 'CREATE', 'PROCESS', 'VERIFY', 'APPROVE', 'RECALCULATE', 'EXPORT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Student Section', name: 'Student Section & Documents', category: 'Students & Staff', description: 'Bonafide, migration, transcripts, and verification requests', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'VERIFY', 'APPROVE', 'REJECT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Hostel', name: 'Hostel & Residential Life', category: 'Campus', description: 'Room allocations, occupancy, mess, and visitor register', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'MANAGE', 'EXPORT', 'PRINT'] },
  { key: 'Hostel Gate Pass', name: 'Hostel Gate Pass & Movement', category: 'Campus', description: 'Student night out and weekend gate pass requests', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'APPROVE', 'REJECT', 'SCAN', 'CHECK_IN', 'CHECK_OUT', 'PRINT'] },
  { key: 'Transport', name: 'Campus Transport & Buses', category: 'Campus', description: 'Bus routes, vehicle allocations, and driver rosters', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'ASSIGN', 'MANAGE', 'EXPORT', 'PRINT'] },
  { key: 'DigiLocker & Documents', name: 'DigiLocker & Digital Vault', category: 'Academic', description: 'Official degree certificates, marksheet sync, and verifications', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'VERIFY', 'DOWNLOAD', 'PRINT'] },
  { key: 'Academic Credits / ABC', name: 'Academic Bank of Credits (ABC)', category: 'Academic', description: 'APAAR / ABC ID linking, credit accumulation, and transfers', supportedActions: ['VIEW', 'SUBMIT', 'VERIFY', 'MANAGE', 'EXPORT', 'PRINT'] },
  { key: 'Requests', name: 'Institutional Service Requests', category: 'Finance & Admin', description: 'Certificates, NOCs, IT tickets, and campus maintenance requests', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'APPROVE', 'REJECT', 'MANAGE', 'PRINT'] },
  { key: 'Feedback', name: 'Feedback & IQAC Evaluations', category: 'Governance', description: 'Student feedback for faculty, suggestions, and grievance logs', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'VERIFY', 'PROCESS', 'EXPORT', 'PRINT'] },
  { key: 'PTM Consultation', name: 'Parent Teacher Meetings (PTM)', category: 'Students & Staff', description: 'PTM scheduling, slots, meeting records, and mentor remarks', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'EDIT', 'PRINT', 'EXPORT'] },
  { key: 'Research & Innovation', name: 'Research, Patents & Pubs', category: 'Governance', description: 'Publications, research grants, seed funding, and citations', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'SUBMIT', 'APPROVE', 'EXPORT', 'PRINT'] },
  { key: 'Grants & SSIP', name: 'Startups & SSIP Innovation', category: 'Governance', description: 'Student startup incubation, mentor sessions, and grants', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'APPROVE', 'REJECT', 'MANAGE', 'EXPORT'] },
  { key: 'Notesheet', name: 'University Notesheets', category: 'Governance', description: 'Proposals, financial sanctions, and multi-tier digital workflows', supportedActions: ['VIEW', 'CREATE', 'SUBMIT', 'APPROVE', 'REJECT', 'EXPORT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Notifications', name: 'University Broadcasts & Alerts', category: 'System', description: 'Urgent notices, SMS, push notifications, and announcements', supportedActions: ['VIEW', 'CREATE', 'PUBLISH', 'MANAGE'] },
  { key: 'Reports', name: 'Reports & Analytics Center', category: 'Core', description: 'Regulatory reports, NAAC/NIRF snapshots, and custom BI', supportedActions: ['VIEW', 'GENERATE', 'EXPORT', 'PRINT', 'DOWNLOAD'] },
  { key: 'Audit Logs', name: 'Security & Audit Logs', category: 'System', description: 'Immutable system audit trails and security monitoring', supportedActions: ['VIEW', 'EXPORT', 'PRINT'] },
  { key: 'System Settings', name: 'System Configuration & RBAC', category: 'System', description: 'Role matrices, scopes, overrides, and master tables', supportedActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE', 'EXPORT'] }
];

// ─── HIERARCHICAL SCOPES ─────────────────────────────────────────────────────
export type ScopeLevel = 
  | 'UNIVERSITY'
  | 'INSTITUTE'
  | 'DEPARTMENT'
  | 'PROGRAM'
  | 'SUBJECT'
  | 'ASSIGNED_STUDENTS'
  | 'OWN'
  | 'OWN_REQUESTS'
  | 'OWN_NOTESHEETS'
  | 'ASSIGNED_WORKFLOW';

export interface UserScopeAssignment {
  userId: string;
  moduleKey: AdminModuleKey;
  scopeLevel: ScopeLevel;
  universityId?: string;
  instituteId?: string;
  assignedInstituteIds?: string[];
  departmentId?: string;
  assignedDepartmentIds?: string[];
  programId?: string;
  subjectIds?: string[];
  assignedStudentIds?: string[];
  assignedWorkflowIds?: string[];
}

// ─── PERMISSION OVERRIDES (EXPLICIT ALLOW / DENY) ────────────────────────────
export type OverrideEffect = 'ALLOW' | 'DENY';

export interface UserPermissionOverride {
  id: string;
  userId: string;
  moduleKey: AdminModuleKey;
  action: PermissionActionType;
  effect: OverrideEffect;
  scope?: ScopeLevel;
  grantedBy: string;
  grantedAt: string;
  reason?: string;
}

// ─── ROLE DEFINITION ─────────────────────────────────────────────────────────
export interface RoleMetadata {
  role: UserRole;
  name: string;
  description: string;
  hierarchyLevel: number; // 1 = Super Admin, 2 = VP, 3 = Registrar, 4 = Deputy Registrar, 5 = HOI, 6 = HOD, 7 = Faculty/Staff, 8 = Student
  defaultScope: ScopeLevel;
  isSystemRole: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export type RolePermissionMatrix = Record<UserRole, Record<AdminModuleKey, PermissionActionType[]>>;

// ─── EFFECTIVE ACCESS DECISION ───────────────────────────────────────────────
export interface AccessEvaluationResult {
  granted: boolean;
  source: 'EXPLICIT_DENY' | 'EXPLICIT_ALLOW' | 'ROLE_PERMISSION' | 'SCOPE_DENY' | 'STATUS_DENY';
  effectiveScope: ScopeLevel;
  reason: string;
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────
export type AdminAuditAction = 
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'SCOPE_CHANGED'
  | 'ACCOUNT_ACTIVATED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PASSWORD_RESET'
  | 'FORCE_LOGOUT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ROLE_TEMPLATE_UPDATED';

export interface AdminSecurityAuditRecord {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  targetUserId?: string;
  targetUsername?: string;
  targetRole?: UserRole;
  action: AdminAuditAction;
  module: string;
  details: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  remarks?: string;
}
