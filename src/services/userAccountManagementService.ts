import { db } from './db';
import { 
  User, UserRole, AccountStatus, AccessStatusType, DataScopeType, AuditLog,
  AdminModuleKey, PermissionActionType, ScopeLevel, UserPermissionOverride,
  ADMIN_ERP_MODULES, ALL_PERMISSION_ACTIONS, UserHistoryRecord
} from '../types';
import ExcelJS from 'exceljs';

export interface PermissionModuleDef {
  key: string;
  name: string;
  category: string;
  description: string;
}

export const ERP_PERMISSION_MODULES: PermissionModuleDef[] = [
  { key: 'DASHBOARD', name: 'Dashboard & Analytics', category: 'Core', description: 'Institutional overview, analytics, and summary statistics' },
  { key: 'USER_MANAGEMENT', name: 'User Management & Accounts', category: 'System', description: 'Central user accounts, credentials, statuses, and locks' },
  { key: 'ACADEMIC', name: 'Academic & Syllabus', category: 'Academics', description: 'Curriculum, subject allocations, and session planning' },
  { key: 'STUDENTS', name: 'Student Master & Admissions', category: 'Students', description: 'Student directory, GR numbers, and enrollment records' },
  { key: 'FACULTY', name: 'Faculty Directory & Workload', category: 'Faculty', description: 'Faculty profiles, workload transfers, and allocations' },
  { key: 'DEPARTMENTS', name: 'University Departments', category: 'Academic', description: 'Academic departments, HOD assignments, and resources' },
  { key: 'PROGRAMS', name: 'Academic Programs & Degrees', category: 'Academic', description: 'Degree programs, intake capacities, and regulations' },
  { key: 'SUBJECTS', name: 'Subject Masters & Courses', category: 'Academic', description: 'Course codes, credits, lecture/lab hour configurations' },
  { key: 'ATTENDANCE', name: 'Student Attendance', category: 'Academics', description: 'Daily session attendance and shortage alerts' },
  { key: 'TIMETABLE', name: 'Timetable & Scheduling', category: 'Academics', description: 'Classroom schedules, lab allocations, and faculty load' },
  { key: 'ASSIGNMENTS', name: 'Assignments & LMS', category: 'Academics', description: 'Coursework assignments, submissions, and grading' },
  { key: 'RESULTS', name: 'Results & Marksheets', category: 'Academics', description: 'Semester results, grade sheets, transcripts, and publishing' },
  { key: 'EXAMINATION', name: 'Examination & Grading', category: 'Academics', description: 'Exam scheduling, marks entry, and result publishing' },
  { key: 'EXAM_FORMS', name: 'Exam Forms & Enrollment', category: 'Academics', description: 'Student exam form registrations and verification' },
  { key: 'EXAM_FEES', name: 'Exam Fee Collection', category: 'Academics', description: 'Exam fee payments, receipt generation, and reconciliations' },
  { key: 'BACKLOG_REEXAM', name: 'Backlog & Remedial Exams', category: 'Academics', description: 'Remedial exam applications, eligibility, and fee processing' },
  { key: 'REASSESSMENT', name: 'Reassessment / Rechecking', category: 'Academics', description: 'Answer sheet review applications, re-evaluations, and results' },
  { key: 'HALL_TICKET', name: 'Hall Tickets & Admit Cards', category: 'Academics', description: 'Exam hall ticket generation, QR validation, and printing' },
  { key: 'FEES_PAYMENTS', name: 'Fees & Finance', category: 'Finance', description: 'Tuition fees, receipts, refunds, ledgers, and settlements' },
  { key: 'STUDENT_SECTION', name: 'Student Section & Documents', category: 'Administration', description: 'Bonafide, migration, transcripts, and verification requests' },
  { key: 'HOSTEL', name: 'Hostel & Residential Life', category: 'Campus', description: 'Room allocations, occupancy, mess, and visitor register' },
  { key: 'HOSTEL_GATE_PASS', name: 'Hostel Gate Pass', category: 'Campus', description: 'Student night out and weekend gate pass requests' },
  { key: 'TRANSPORT', name: 'Transport & Buses', category: 'Campus', description: 'Bus routes, vehicle allocations, and driver rosters' },
  { key: 'DIGILOCKER', name: 'DigiLocker & Documents', category: 'Academic', description: 'Official degree certificates, marksheet sync, and verifications' },
  { key: 'ABC_CREDITS', name: 'Academic Credits / ABC', category: 'Academic', description: 'APAAR / ABC ID linking, credit accumulation, and transfers' },
  { key: 'REQUESTS', name: 'Student & Staff Requests', category: 'Administration', description: 'Bonafide, NOC, certificate, and grievance requests' },
  { key: 'FEEDBACK', name: 'Student Feedback & IQAC', category: 'Governance', description: 'Teacher evaluations, suggestions, and quality audits' },
  { key: 'PTM_MANAGEMENT', name: 'Parent Teacher Meetings (PTM)', category: 'Students', description: 'Meeting schedules, attendance, and mentor feedback' },
  { key: 'RESEARCH', name: 'Research & Innovation', category: 'Governance', description: 'Publications, research grants, seed funding, and citations' },
  { key: 'GRANTS_SSIP', name: 'Grants & SSIP Innovation', category: 'Governance', description: 'Student startup incubation, mentor sessions, and grants' },
  { key: 'NOTESHEET', name: 'University Notesheets', category: 'Governance', description: 'Administrative proposals, financial approvals, and memos' },
  { key: 'NOTIFICATIONS', name: 'Notification Center', category: 'System', description: 'Automated triggers, broadcasts, and user alerts' },
  { key: 'REPORTS', name: 'Reports & Analytics Center', category: 'Core', description: 'Regulatory reports, NAAC/NIRF snapshots, and custom BI' },
  { key: 'AUDIT_LOGS', name: 'Security & Audit Logs', category: 'System', description: 'Immutable system audit trails and security monitoring' },
  { key: 'SETTINGS', name: 'Settings & User Administration', category: 'System', description: 'User account management, security, and master tables' },
];

export interface ModulePermissionSet {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canExport: boolean;
  canImport: boolean;
  canPrint: boolean;
  canAssign: boolean;
  canTransfer: boolean;
  canVerify: boolean;
  canManage: boolean;
}

export type UserEffectivePermissions = Record<string, ModulePermissionSet>;

export interface PermissionCellInfo {
  moduleKey: string;
  action: keyof ModulePermissionSet;
  value: boolean;
  source: 'ROLE' | 'DIRECT';
}

export interface UserAccountFilters {
  role?: string;
  departmentId?: string;
  instituteId?: string;
  status?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserSortConfig {
  column: keyof User | 'departmentName' | 'instituteName';
  direction: 'asc' | 'desc';
}

export class UserAccountManagementService {
  /**
   * 1. GET DEFAULT ROLE PERMISSIONS TEMPLATE
   */
  public getDefaultPermissionsForRole(role: UserRole | string): UserEffectivePermissions {
    const fullAccess: ModulePermissionSet = {
      canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canReject: true,
      canExport: true, canImport: true, canPrint: true, canAssign: true, canTransfer: true, canVerify: true, canManage: true
    };
    const governanceCoordinator: ModulePermissionSet = {
      canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
      canExport: true, canImport: true, canPrint: true, canAssign: true, canTransfer: true, canVerify: true, canManage: true
    };
    const readOnly: ModulePermissionSet = {
      canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
      canExport: true, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
    };
    const none: ModulePermissionSet = {
      canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
      canExport: false, canImport: false, canPrint: false, canAssign: false, canTransfer: false, canVerify: false, canManage: false
    };

    const template: UserEffectivePermissions = {};

    ERP_PERMISSION_MODULES.forEach(mod => {
      switch (role) {
        case 'SUPER_ADMIN':
          template[mod.key] = { ...fullAccess };
          break;

        case 'ERP_COORDINATOR':
          // Central ERP Coordinator has complete access control & governance across all modules
          if (mod.key === 'SETTINGS') {
            template[mod.key] = {
              canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: true, canTransfer: true, canVerify: true, canManage: true
            };
          } else {
            template[mod.key] = { ...governanceCoordinator };
          }
          break;

        case 'UNIVERSITY_ADMIN':
          template[mod.key] = { ...fullAccess };
          break;

        case 'VICE_PRESIDENT':
        case 'PRESIDENT':
        case 'PROVOST':
          template[mod.key] = {
            ...fullAccess,
            canDelete: mod.key === 'SETTINGS' ? false : true
          };
          break;

        case 'PRINCIPAL':
        case 'HOI':
        case 'REGISTRAR':
        case 'DEPUTY_REGISTRAR':
          if (mod.key === 'SETTINGS') {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: true, canTransfer: true, canVerify: true, canManage: true
            };
          } else {
            template[mod.key] = { ...fullAccess };
          }
          break;

        case 'HOD':
          if (['DASHBOARD', 'ACADEMIC', 'SESSION_PLAN', 'STUDY_MATERIAL', 'ATTENDANCE', 'EXAM_ELIGIBILITY', 'EXAMINATION', 'STUDENTS', 'PTM_MANAGEMENT', 'WORKLOAD_TRANSFER', 'REQUESTS', 'FEEDBACK', 'NOTICES', 'EVENTS', 'INVENTORY_ASSETS', 'NOTESHEET'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: true, canTransfer: true, canVerify: true, canManage: true
            };
          } else if (mod.key === 'SETTINGS') {
            template[mod.key] = { ...none };
          } else {
            template[mod.key] = { ...readOnly };
          }
          break;

        case 'FACULTY':
          if (mod.key === 'EXAM_ELIGIBILITY') {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: false,
              canExport: true, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: true, canManage: false
            };
          } else if (['DASHBOARD', 'ACADEMIC', 'SESSION_PLAN', 'STUDY_MATERIAL', 'ATTENDANCE', 'EXAMINATION', 'STUDENTS', 'PTM_MANAGEMENT', 'NOTICES', 'EVENTS', 'FEEDBACK'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canReject: false,
              canExport: true, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (['NOTESHEET', 'REQUESTS', 'WORKLOAD_TRANSFER'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (mod.key === 'INVENTORY_ASSETS') {
            // Faculty can view assigned assets and create request/return/transfer/issue reports
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        case 'MENTOR':
          // Mentor has VIEW + Endorsement permission on Exam Eligibility, and VIEW on Academics, Session Plan, Attendance, Students
          if (mod.key === 'EXAM_ELIGIBILITY') {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: false,
              canExport: true, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: true, canManage: false
            };
          } else if (['DASHBOARD', 'ACADEMIC', 'SESSION_PLAN', 'STUDY_MATERIAL', 'ATTENDANCE', 'EXAMINATION', 'STUDENTS', 'PTM_MANAGEMENT', 'NOTICES', 'EVENTS', 'NOTIFICATIONS'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: true, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (['NOTESHEET', 'FEEDBACK', 'REQUESTS'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (mod.key === 'INVENTORY_ASSETS') {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        case 'STAFF':
          if (['DASHBOARD', 'NOTICES', 'EVENTS', 'FEEDBACK'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: true, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (mod.key === 'INVENTORY_ASSETS') {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        case 'STUDENT_ADMIN':
        case 'STUDENT_SECTION':
          if (['STUDENTS', 'REQUESTS', 'DOCUMENTS', 'NOTICES'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: false, canTransfer: false, canVerify: true, canManage: true
            };
          } else if (['DASHBOARD', 'ACADEMIC', 'ATTENDANCE'].includes(mod.key)) {
            template[mod.key] = { ...readOnly };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        case 'EXAM_CELL':
        case 'EXAM_OFFICER':
          if (['EXAMINATION', 'STUDENTS', 'ACADEMIC'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: false, canTransfer: false, canVerify: true, canManage: true
            };
          } else if (['DASHBOARD', 'NOTICES'].includes(mod.key)) {
            template[mod.key] = { ...readOnly };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        case 'IQAC':
          if (['FEEDBACK', 'ACADEMIC', 'DASHBOARD', 'REPORTS'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: false, canTransfer: false, canVerify: true, canManage: true
            };
          } else {
            template[mod.key] = { ...readOnly };
          }
          break;

        case 'ACCOUNTS_ADMIN':
        case 'FINANCE_OFFICER':
          if (['NOTESHEET', 'INVENTORY_ASSETS', 'DASHBOARD', 'DOCUMENTS'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canReject: true,
              canExport: true, canImport: true, canPrint: true, canAssign: true, canTransfer: true, canVerify: true, canManage: true
            };
          } else {
            template[mod.key] = { ...readOnly };
          }
          break;

        case 'STUDENT':
          if (['DASHBOARD', 'ACADEMIC', 'STUDENTS', 'ATTENDANCE', 'EXAMINATION', 'NOTICES', 'EVENTS', 'DIGILOCKER', 'ABC_CREDITS', 'TIMETABLE', 'ASSIGNMENTS', 'RESULTS', 'EXAM_FORMS', 'EXAM_FEES', 'HALL_TICKET', 'FEES_PAYMENTS', 'HOSTEL', 'TRANSPORT'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (['REQUESTS', 'FEEDBACK', 'HOSTEL_GATE_PASS', 'PTM_MANAGEMENT'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        case 'PARENT':
          if (['DASHBOARD', 'ATTENDANCE', 'EXAMINATION', 'PTM_MANAGEMENT', 'NOTICES'].includes(mod.key)) {
            template[mod.key] = {
              canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else if (mod.key === 'FEEDBACK') {
            template[mod.key] = {
              canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canReject: false,
              canExport: false, canImport: false, canPrint: true, canAssign: false, canTransfer: false, canVerify: false, canManage: false
            };
          } else {
            template[mod.key] = { ...none };
          }
          break;

        default:
          template[mod.key] = { ...readOnly };
          break;
      }
    });

    return template;
  }

  /**
   * 2. ROLE TEMPLATE PERSISTENCE & OVERRIDE
   */
  public getRolePermissionTemplate(role: UserRole | string): UserEffectivePermissions {
    const customTemplates = (db.getState() as any).rolePermissionTemplates || {};
    if (customTemplates[role]) {
      return customTemplates[role];
    }
    return this.getDefaultPermissionsForRole(role);
  }

  public updateRolePermissionTemplate(role: UserRole | string, template: UserEffectivePermissions, actorUser?: User | null): void {
    const state = db.getState() as any;
    if (!state.rolePermissionTemplates) {
      state.rolePermissionTemplates = {};
    }
    state.rolePermissionTemplates[role] = template;
    db.saveState();

    this.logSecurityAudit({
      action: 'ROLE_TEMPLATE_UPDATED',
      module: 'SETTINGS',
      entity: 'role_permissions',
      recordId: role,
      details: `Role permission template for ${role} updated by ${actorUser?.name || 'Administrator'}`,
      actorUser
    });
  }

  /**
   * 3. CALCULATE EFFECTIVE USER PERMISSIONS (Merging Role template + User custom overrides)
   */
  public getEffectivePermissions(user: User): {
    permissions: UserEffectivePermissions;
    details: Record<string, Record<keyof ModulePermissionSet, { value: boolean; source: 'ROLE' | 'DIRECT' }>>;
    isCoordinator?: boolean;
  } {
    const roleDefault = this.getRolePermissionTemplate(user.role);
    const overrides = user.customPermissions || {};

    const effective: UserEffectivePermissions = {};
    const details: Record<string, Record<keyof ModulePermissionSet, { value: boolean; source: 'ROLE' | 'DIRECT' }>> = {};

    const actionKeys: (keyof ModulePermissionSet)[] = [
      'canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canReject',
      'canExport', 'canImport', 'canPrint', 'canAssign', 'canTransfer', 'canVerify', 'canManage'
    ];

    ERP_PERMISSION_MODULES.forEach(mod => {
      const defaultMod = roleDefault[mod.key] || {
        canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canReject: false,
        canExport: false, canImport: false, canPrint: false, canAssign: false, canTransfer: false, canVerify: false, canManage: false
      };
      const userModOverrides = overrides[mod.key] || {};

      effective[mod.key] = {} as ModulePermissionSet;
      details[mod.key] = {} as any;

      actionKeys.forEach(act => {
        const isOverridden = userModOverrides[act] !== undefined;
        const val = isOverridden ? Boolean(userModOverrides[act]) : Boolean(defaultMod[act]);
        effective[mod.key][act] = val;
        details[mod.key][act] = {
          value: val,
          source: isOverridden ? 'DIRECT' : 'ROLE'
        };
      });
    });

    return { 
      permissions: effective, 
      details,
      isCoordinator: user.role === 'ERP_COORDINATOR'
    };
  }

  /**
   * 4. GET FILTERED & SORTED USERS LIST
   */
  public getUsers(filters?: UserAccountFilters, sortConfig?: UserSortConfig): User[] {
    let list = [...db.getUsers()];

    // Apply Filters
    if (filters) {
      if (filters.role && filters.role !== 'ALL') {
        list = list.filter(u => u.role === filters.role);
      }
      if (filters.instituteId && filters.instituteId !== 'ALL') {
        list = list.filter(u => u.instituteId === filters.instituteId);
      }
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        list = list.filter(u => u.departmentId === filters.departmentId);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(u => (u.accountStatus || (u.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE')) === filters.status);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        list = list.filter(u => {
          const matchUsername = (u.username || '').toLowerCase().includes(q);
          const matchName = (u.name || '').toLowerCase().includes(q);
          const matchEmail = (u.email || '').toLowerCase().includes(q);
          const matchEmpId = (u.employeeId || u.enrollmentNo || '').toLowerCase().includes(q);
          const matchRole = (u.role || '').toLowerCase().includes(q);
          const matchDept = (u.departmentName || '').toLowerCase().includes(q);
          return matchUsername || matchName || matchEmail || matchEmpId || matchRole || matchDept;
        });
      }
      if (filters.dateFrom) {
        list = list.filter(u => u.createdAt >= (filters.dateFrom as string));
      }
      if (filters.dateTo) {
        list = list.filter(u => u.createdAt <= (filters.dateTo as string));
      }
    }

    // Apply Sorting
    if (sortConfig) {
      const { column, direction } = sortConfig;
      list.sort((a, b) => {
        let valA: any = a[column as keyof User] || '';
        let valB: any = b[column as keyof User] || '';

        if (column === 'departmentName') {
          valA = a.departmentName || '';
          valB = b.departmentName || '';
        }

        if (typeof valA === 'string') {
          return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return list;
  }

  /**
   * 4B. GET USERS WITH SERVER-SIDE PAGINATION & SCOPING
   * Supports 6,000+ user records with backend API and fallback.
   */
  public async getUsersServer(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      instituteId?: string;
      departmentId?: string;
    }
  ): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    const limit = Math.min(query.limit || 20, 100);
    const page = Math.max(1, query.page || 1);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (query.search?.trim()) params.set('search', query.search.trim());
      if (query.role && query.role !== 'ALL') params.set('role', query.role);
      if (query.status && query.status !== 'ALL') params.set('status', query.status);
      if (query.instituteId && query.instituteId !== 'ALL') params.set('instituteId', query.instituteId);
      if (query.departmentId && query.departmentId !== 'ALL') params.set('departmentId', query.departmentId);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/users?${params.toString()}`, {
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        const payload = json.data || json;
        const data = Array.isArray(payload) ? payload : (payload.data || []);
        const total = typeof payload.total === 'number' ? payload.total : data.length;
        const totalPages = typeof payload.totalPages === 'number' ? payload.totalPages : Math.ceil(total / limit) || 1;

        if (total > 0) {
          return {
            data: data as User[],
            total,
            page,
            totalPages,
          };
        }
      }
    } catch (e) {
      // Fallback to local db if backend is unreachable
    }

    const localUsers = this.getUsers(
      {
        role: (query.role as any) || 'ALL',
        instituteId: query.instituteId,
        departmentId: query.departmentId,
        status: (query.status as any) || 'ALL',
        searchQuery: query.search,
      }
    );

    const total = localUsers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;

    return {
      data: localUsers.slice(start, start + limit),
      total,
      page,
      totalPages,
    };
  }

  /**
   * 5. CREATE USER ACCOUNT
   */
  public createUser(data: {
    username: string;
    email: string;
    name: string;
    password?: string;
    role: UserRole;
    employeeId?: string;
    enrollmentNo?: string;
    phone?: string;
    instituteId?: string;
    departmentId?: string;
    departmentName?: string;
    designation?: string;
    accountStatus?: AccountStatus;
    forcePasswordReset?: boolean;
    twoFactorEnabled?: boolean;
    accountExpiresAt?: string;
  }, actorUser?: User | null): User {
    const existingUsers = db.getUsers();

    // Validation
    if (!data.username || data.username.trim().length < 3) {
      throw new Error('Username / Login ID must be at least 3 characters long.');
    }
    const cleanUsername = data.username.trim().toLowerCase();
    if (existingUsers.some(u => (u.username || '').toLowerCase() === cleanUsername)) {
      throw new Error(`Username / Login ID "${data.username}" is already assigned to another user account.`);
    }

    // Duplicate account protection for Enrollment Number
    if (data.enrollmentNo && data.enrollmentNo.trim()) {
      const cleanEnroll = data.enrollmentNo.trim().toLowerCase();
      if (existingUsers.some(u => (u.enrollmentNo && u.enrollmentNo.toLowerCase() === cleanEnroll) || (u.username && u.username.toLowerCase() === cleanEnroll))) {
        throw new Error(`ERP Login account already exists for this student (Enrollment No: ${data.enrollmentNo}).`);
      }
    }

    // Duplicate account protection for Employee Code
    if (data.employeeId && data.employeeId.trim()) {
      const cleanEmp = data.employeeId.trim().toLowerCase();
      if (existingUsers.some(u => (u.employeeId && u.employeeId.toLowerCase() === cleanEmp) || (u.username && u.username.toLowerCase() === cleanEmp))) {
        throw new Error(`ERP Login account already exists for this staff/faculty member (Employee Code: ${data.employeeId}).`);
      }
    }

    // Privilege Escalation Prevention: Only SUPER_ADMIN can create SUPER_ADMIN accounts
    if (data.role === 'SUPER_ADMIN' && actorUser?.role !== 'SUPER_ADMIN') {
      throw new Error('Privilege escalation denied: Only Super Administrators can provision SUPER_ADMIN accounts.');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      throw new Error('Please provide a valid official email address.');
    }
    const cleanEmail = data.email.trim().toLowerCase();
    if (existingUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email address "${data.email}" is already registered in the university system.`);
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Please enter the full legal name of the user.');
    }

    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const inst = data.instituteId ? institutes.find(i => i.id === data.instituteId) : undefined;
    const dept = data.departmentId ? departments.find(d => d.id === data.departmentId) : undefined;

    const now = new Date().toISOString();
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-6)}-${uniqueSuffix}`,
      username: cleanUsername,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password || 'User@123',
      role: data.role,
      employeeId: data.employeeId?.trim(),
      enrollmentNo: data.enrollmentNo?.trim(),
      phone: data.phone?.trim(),
      instituteId: inst?.id || data.instituteId || '',
      departmentId: dept?.id || data.departmentId || '',
      departmentName: dept?.name || data.departmentName || '',
      designation: data.designation || (data.role === 'STUDENT' ? 'Student' : 'Faculty Member'),
      status: (data.accountStatus === 'INACTIVE' || data.accountStatus === 'SUSPENDED' || data.accountStatus === 'LOCKED' || data.accountStatus === 'DISABLED') ? 'INACTIVE' : 'ACTIVE',
      accountStatus: data.accountStatus || 'ACTIVE',
      accessStatus: (data.accountStatus === 'LOCKED' || data.accountStatus === 'DISABLED') ? 'LOCKED' : 'ENABLED',
      forcePasswordReset: data.forcePasswordReset !== undefined ? data.forcePasswordReset : true,
      twoFactorEnabled: data.twoFactorEnabled || false,
      accountExpiresAt: data.accountExpiresAt,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now
    };

    db.addEntity<User>('users', newUser, `Provisioned new user account: ${newUser.username} (${newUser.name}, Role: ${newUser.role})`);

    this.logSecurityAudit({
      action: 'USER_CREATED',
      module: 'SETTINGS',
      entity: 'users',
      recordId: newUser.id,
      details: `User account ${newUser.username} (${newUser.role}) provisioned by ${actorUser?.name || 'Administrator'}`,
      newValue: { username: newUser.username, email: newUser.email, role: newUser.role, status: newUser.accountStatus },
      actorUser
    });

    return newUser;
  }

  /**
   * 6. EDIT USER ACCOUNT
   */
  public updateUser(id: string, updates: Partial<User>, actorUser?: User | null): User {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account record not found.');

    // If email is changing, validate uniqueness
    if (updates.email && updates.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const cleanEmail = updates.email.trim().toLowerCase();
      if (db.getUsers().some(u => u.id !== id && u.email.toLowerCase() === cleanEmail)) {
        throw new Error(`Email address "${updates.email}" is already used by another user account.`);
      }
    }

    const now = new Date().toISOString();
    const newStatus = updates.accountStatus 
      ? ((updates.accountStatus === 'INACTIVE' || updates.accountStatus === 'SUSPENDED' || updates.accountStatus === 'LOCKED' || updates.accountStatus === 'DISABLED') ? 'INACTIVE' : 'ACTIVE')
      : (updates.status || existing.status);

    const merged: User = {
      ...existing,
      ...updates,
      status: newStatus,
      is_active: newStatus === 'ACTIVE',
      accountStatus: updates.accountStatus || existing.accountStatus || (newStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
      updatedAt: now
    };

    // ─── AUTOMATED DATA VERSIONING & HISTORY TRACKING ────────────────────────
    const trackedFields: (keyof User)[] = [
      'name', 'email', 'phone', 'designation', 'departmentId', 'departmentName',
      'instituteId', 'role', 'status', 'accountStatus', 'accessStatus', 'customPermissions', 'userScopes'
    ];

    const changedFields: string[] = [];
    const oldSnapshot: Partial<User> = {};
    const newSnapshot: Partial<User> = {};

    trackedFields.forEach(f => {
      if (updates[f] !== undefined) {
        const oldVal = JSON.stringify(existing[f]);
        const newVal = JSON.stringify(merged[f]);
        if (oldVal !== newVal) {
          changedFields.push(f);
          oldSnapshot[f] = existing[f] as any;
          newSnapshot[f] = merged[f] as any;
        }
      }
    });

    if (changedFields.length > 0) {
      const state = db.getState() as any;
      if (!state.userHistories) state.userHistories = [];
      
      const userHistoryList: UserHistoryRecord[] = state.userHistories.filter((h: UserHistoryRecord) => h.userId === id);
      const nextVersion = userHistoryList.length + 1;

      const historyRecord: UserHistoryRecord = {
        id: `uhist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: id,
        version: nextVersion,
        action: updates.accountStatus === 'INACTIVE' ? 'ACCOUNT_DEACTIVATED' :
                updates.accountStatus === 'ACTIVE' && existing.accountStatus !== 'ACTIVE' ? 'ACCOUNT_REACTIVATED' :
                updates.role && updates.role !== existing.role ? 'ROLE_CHANGED' :
                updates.customPermissions ? 'PERMISSION_CHANGED' :
                updates.userScopes ? 'SCOPE_CHANGED' : 'USER_UPDATED',
        changedBy: actorUser?.name || 'Administrator',
        changedByUserId: actorUser?.id || 'admin',
        changedByRole: actorUser?.role || 'SUPER_ADMIN',
        changedAt: now,
        changedFields,
        oldData: oldSnapshot,
        newData: newSnapshot,
        reason: (updates as any).lockReason || (updates as any).reason || 'Administrative update'
      };

      state.userHistories.unshift(historyRecord);
      db.saveState();
    }

    db.updateEntity<User>('users', id, merged, `Updated user credentials and profile for: ${existing.username}`);

    this.logSecurityAudit({
      action: 'USER_UPDATED',
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `User profile for ${existing.username} updated by ${actorUser?.name || 'Administrator'}. Modified fields: ${changedFields.join(', ') || 'None'}`,
      previousValue: oldSnapshot,
      newValue: newSnapshot,
      actorUser
    });

    return merged;
  }

  /**
   * GET VERSIONED USER HISTORY (Immutable chronological changelog)
   */
  public getUserHistory(userId: string): UserHistoryRecord[] {
    const state = db.getState() as any;
    const all = (state.userHistories || []) as UserHistoryRecord[];
    return all.filter(h => h.userId === userId).sort((a, b) => b.version - a.version);
  }

  /**
   * 7. USER LOCK ACTION (With mandatory lock reason, timestamp, and audit trail)
   */
  public lockUser(id: string, reason: string, actorUser?: User | null): User {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account not found.');
    if (!reason || reason.trim().length < 3) {
      throw new Error('Please provide a valid lock reason before locking this account.');
    }

    const now = new Date().toISOString();
    const updated = this.updateUser(id, {
      accountStatus: 'LOCKED',
      accessStatus: 'LOCKED',
      status: 'INACTIVE',
      lockedAt: now,
      lockedBy: actorUser?.username || actorUser?.name || 'Central ERP Coordinator',
      lockReason: reason.trim()
    }, actorUser);

    this.logSecurityAudit({
      action: 'USER_LOCKED',
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `User account ${existing.username} LOCKED by ${actorUser?.username || actorUser?.name || 'Administrator'}. Reason: ${reason.trim()}`,
      previousValue: { status: existing.accountStatus || existing.status },
      newValue: { status: 'LOCKED', lockedAt: now, lockedBy: actorUser?.username || actorUser?.name, lockReason: reason.trim() },
      actorUser
    });

    return updated;
  }

  /**
   * 8. USER UNLOCK ACTION
   */
  public unlockUser(id: string, actorUser?: User | null): User {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account not found.');

    const updated = this.updateUser(id, {
      accountStatus: 'ACTIVE',
      accessStatus: 'ENABLED',
      status: 'ACTIVE',
      lockedAt: undefined,
      lockedBy: undefined,
      lockReason: undefined,
      failedLoginAttempts: 0
    }, actorUser);

    this.logSecurityAudit({
      action: 'USER_UNLOCKED',
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `User account ${existing.username} UNLOCKED by ${actorUser?.username || actorUser?.name || 'Administrator'}`,
      previousValue: { status: 'LOCKED', lockReason: existing.lockReason },
      newValue: { status: 'ACTIVE' },
      actorUser
    });

    return updated;
  }

  /**
   * 9. TOGGLE STATUS (ACTIVE / INACTIVE / SUSPENDED / LOCKED / DISABLED)
   */
  public toggleAccountStatus(id: string, targetStatus: AccountStatus, actorUser?: User | null): User {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account not found.');

    const statusMap: Record<AccountStatus, 'ACTIVE' | 'INACTIVE'> = {
      ACTIVE: 'ACTIVE',
      PENDING: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      LOCKED: 'INACTIVE',
      SUSPENDED: 'INACTIVE',
      DISABLED: 'INACTIVE'
    };

    const updated = this.updateUser(id, {
      accountStatus: targetStatus,
      status: statusMap[targetStatus],
      accessStatus: targetStatus === 'ACTIVE' ? 'ENABLED' : 'LOCKED'
    }, actorUser);

    const actionName = targetStatus === 'ACTIVE' ? 'ACCOUNT_ACTIVATED' :
      targetStatus === 'LOCKED' ? 'ACCOUNT_LOCKED' :
      targetStatus === 'DISABLED' ? 'ACCOUNT_DISABLED' :
      targetStatus === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_DEACTIVATED';

    this.logSecurityAudit({
      action: actionName,
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `Account status for ${existing.username} changed to ${targetStatus}`,
      previousValue: { status: existing.accountStatus || existing.status },
      newValue: { status: targetStatus },
      actorUser
    });

    return updated;
  }

  /**
   * 10. RESET USER PASSWORD
   */
  public resetPassword(id: string, newPasswordVal: string, forceResetAtNextLogin: boolean = true, actorUser?: User | null): void {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account not found.');

    if (!newPasswordVal || newPasswordVal.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    this.updateUser(id, {
      password: newPasswordVal,
      forcePasswordReset: forceResetAtNextLogin,
      failedLoginAttempts: 0
    }, actorUser);

    this.logSecurityAudit({
      action: 'PASSWORD_RESET',
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `Password reset performed for user account ${existing.username} (Force reset next login: ${forceResetAtNextLogin ? 'Yes' : 'No'})`,
      actorUser
    });
  }

  /**
   * 11. SAVE USER DIRECT PERMISSION OVERRIDES
   */
  public saveUserPermissions(id: string, customPermissions: Record<string, Record<string, boolean>>, actorUser?: User | null): User {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account not found.');

    const updated = this.updateUser(id, {
      customPermissions
    }, actorUser);

    this.logSecurityAudit({
      action: 'PERMISSION_CHANGED',
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `Custom module permissions matrix updated for ${existing.username}`,
      actorUser
    });

    return updated;
  }

  /**
   * 12. RESET USER CUSTOM PERMISSIONS TO ROLE DEFAULTS
   */
  public resetUserPermissions(id: string, actorUser?: User | null): User {
    const existing = db.getUsers().find(u => u.id === id);
    if (!existing) throw new Error('User account not found.');

    const updated = this.updateUser(id, {
      customPermissions: {}
    }, actorUser);

    this.logSecurityAudit({
      action: 'PERMISSIONS_RESET_TO_ROLE_DEFAULT',
      module: 'SETTINGS',
      entity: 'users',
      recordId: id,
      details: `Custom permission overrides cleared for ${existing.username}. Reverted to ${existing.role} role defaults.`,
      actorUser
    });

    return updated;
  }

  /**
   * 13. USER DATA SCOPES (ALL_UNIVERSITY, INSTITUTION, DEPARTMENT, PROGRAM, CLASS, SELF, ASSIGNED_ASSETS)
   */
  public getUserScopes(userId: string): Record<string, DataScopeType> {
    const user = db.getUsers().find(u => u.id === userId);
    if (user && user.userScopes) return user.userScopes;
    const state = db.getState() as any;
    const globalScopes = state.userScopes || {};
    return globalScopes[userId] || {};
  }

  public setUserScopes(userId: string, scopes: Record<string, DataScopeType>, actorUser?: User | null): void {
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) throw new Error('User not found.');

    this.updateUser(userId, { userScopes: scopes }, actorUser);

    const state = db.getState() as any;
    if (!state.userScopes) state.userScopes = {};
    state.userScopes[userId] = scopes;
    db.saveState();

    this.logSecurityAudit({
      action: 'USER_SCOPE_UPDATED',
      module: 'SETTINGS',
      entity: 'user_scopes',
      recordId: userId,
      details: `Data scope configuration updated for ${user.username}`,
      newValue: scopes,
      actorUser
    });
  }

  /**
   * 14. MULTI-TIER AUTHORIZATION EVALUATION ENGINE (System -> Account Status -> Role Perms -> Custom Perms -> Scope -> Workflow)
   */
  public evaluateAuthorization(
    user: User | null,
    moduleKey: string,
    action: keyof ModulePermissionSet | string,
    context?: {
      targetEntityId?: string;
      targetUserId?: string;
      ownerId?: string;
      requesterId?: string;
      targetDepartmentId?: string;
      departmentId?: string;
      targetInstituteId?: string;
      instituteId?: string;
      isCustodian?: boolean;
    }
  ): { allowed: boolean; authorized: boolean; code?: number; statusCode?: number; message?: string; reason?: string } {
    // Tier 1: Authentication
    if (!user) {
      return { 
        allowed: false, 
        authorized: false, 
        code: 401, 
        statusCode: 401, 
        message: 'Authentication required. Please login.',
        reason: 'Authentication required. Please login.'
      };
    }

    // Tier 2: Account Status Verification
    const status = user.accountStatus || user.status;
    if (status === 'LOCKED') {
      const lockMsg = `Your user account is LOCKED. Reason: ${user.lockReason || 'Administrative security lock'}. Please contact the Central ERP Coordinator.`;
      return {
        allowed: false,
        authorized: false,
        code: 403,
        statusCode: 403,
        message: lockMsg,
        reason: lockMsg
      };
    }
    if (status === 'DISABLED' || status === 'INACTIVE' || status === 'SUSPENDED') {
      const statusMsg = `Your user account is ${status}. Access to protected ERP operations is disabled.`;
      return {
        allowed: false,
        authorized: false,
        code: 403,
        statusCode: 403,
        message: statusMsg,
        reason: statusMsg
      };
    }

    // Normalize Action Property
    let actProp: keyof ModulePermissionSet = 'canView';
    if (action.startsWith('can')) {
      actProp = action as keyof ModulePermissionSet;
    } else {
      const formatted = `can${action.charAt(0).toUpperCase()}${action.slice(1).toLowerCase()}`;
      actProp = formatted as keyof ModulePermissionSet;
    }

    // Tier 2.5: Anti-Self-Approval Workflow Rule (Requester cannot approve their own request)
    if ((actProp === 'canApprove' || action === 'APPROVE') && context?.requesterId && context.requesterId === user.id) {
      return {
        allowed: false,
        authorized: false,
        code: 403,
        statusCode: 403,
        message: 'Self-approval is strictly prohibited. Requester cannot approve their own requests.',
        reason: 'Self-approval is strictly prohibited. Requester cannot approve their own requests.'
      };
    }

    // Super Admin special bypass
    if (user.role === 'SUPER_ADMIN') {
      return { allowed: true, authorized: true };
    }

    // Tier 3: Module & Action Effective Permissions
    const { permissions } = this.getEffectivePermissions(user);
    let modPerms = permissions[moduleKey];

    // Fallback for sub-academic modules
    if (!modPerms && (moduleKey === 'SESSION_PLAN' || moduleKey === 'STUDY_MATERIAL')) {
      modPerms = permissions['ACADEMIC'] || this.getDefaultPermissionsForRole(user.role)[moduleKey] || this.getDefaultPermissionsForRole(user.role)['ACADEMIC'];
    }

    if (!modPerms) {
      const msg = `Access denied to module '${moduleKey}'.`;
      return { allowed: false, authorized: false, code: 403, statusCode: 403, message: msg, reason: msg };
    }

    const hasAction = modPerms[actProp] ?? false;
    if (!hasAction) {
      const msg = `You do not have permission to perform '${action}' on '${moduleKey}'.`;
      return {
        allowed: false,
        authorized: false,
        code: 403,
        statusCode: 403,
        message: msg,
        reason: msg
      };
    }

    // Tier 4: Data Scope Verification
    const userScopes = this.getUserScopes(user.id);
    const effectiveScope: DataScopeType = userScopes[moduleKey] || (
      ['ERP_COORDINATOR', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'].includes(user.role as string)
        ? 'ALL_UNIVERSITY'
        : user.role === 'PRINCIPAL'
        ? 'INSTITUTION'
        : user.role === 'HOD'
        ? 'DEPARTMENT'
        : user.role === 'FACULTY' || user.role === 'STAFF'
        ? 'ASSIGNED_ASSETS'
        : 'SELF'
    );

    if (context) {
      const targetUserId = context.targetUserId || context.ownerId;
      const targetDeptId = context.targetDepartmentId || context.departmentId;
      const targetInstId = context.targetInstituteId || context.instituteId;

      if (effectiveScope === 'SELF' && targetUserId && targetUserId !== user.id) {
        return { 
          allowed: false, 
          authorized: false, 
          code: 403, 
          statusCode: 403, 
          message: 'Access restricted to own user records only (Self Scope).',
          reason: 'Access restricted to own user records only (Self Scope).'
        };
      }
      if (effectiveScope === 'ASSIGNED_ASSETS' && targetUserId && targetUserId !== user.id && !context.isCustodian) {
        return { 
          allowed: false, 
          authorized: false, 
          code: 403, 
          statusCode: 403, 
          message: 'Access restricted to assigned assets and custody only.',
          reason: 'Access restricted to assigned assets and custody only.'
        };
      }
      if (effectiveScope === 'DEPARTMENT' && targetDeptId && user.departmentId && targetDeptId !== user.departmentId) {
        return { 
          allowed: false, 
          authorized: false, 
          code: 403, 
          statusCode: 403, 
          message: 'Data scope restricted to your own department records only.',
          reason: 'Data scope restricted to your own department records only.'
        };
      }
      if (effectiveScope === 'INSTITUTION' && targetInstId && user.instituteId && targetInstId !== user.instituteId) {
        return { 
          allowed: false, 
          authorized: false, 
          code: 403, 
          statusCode: 403, 
          message: 'Data scope restricted to your own constituent institution only.',
          reason: 'Data scope restricted to your own constituent institution only.'
        };
      }
    }

    return { allowed: true, authorized: true };
  }

  /**
   * Helper function to check authorization for user + module + action
   */
  public can(user: User | null | undefined, moduleKey: string, action: string = 'VIEW', context?: any): boolean {
    if (!user) return false;
    // Support compound permission strings like "SESSION_PLAN_VIEW"
    if (moduleKey.includes('_') && action === 'VIEW') {
      const parts = moduleKey.split('_');
      const lastPart = parts[parts.length - 1].toUpperCase();
      if (['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'PRINT', 'ASSIGN', 'TRANSFER', 'VERIFY', 'MANAGE'].includes(lastPart)) {
        const act = lastPart;
        const mod = parts.slice(0, -1).join('_');
        return this.evaluateAuthorization(user, mod, act, context).allowed;
      }
    }
    return this.evaluateAuthorization(user, moduleKey, action, context).allowed;
  }

  /**
   * 15. GET SECURITY AUDIT LOGS FOR SPECIFIC USER
   */
  public getUserAuditLogs(user: User): AuditLog[] {
    const allLogs = db.getAuditLogs();
    const uname = (user.username || '').toLowerCase();
    const uid = user.id;

    return allLogs.filter(l => {
      const matchTarget = (l.recordId === uid) || (l.details || '').toLowerCase().includes(uname);
      const matchActor = l.userId === uid || l.userName.toLowerCase() === uname;
      return matchTarget || matchActor;
    });
  }

  /**
   * 16. EXPORT TO OFFICIAL EXCEL (.xlsx)
   */
  public async exportUsersExcel(users: User[], filename: string = 'SSIU_User_Account_Register.xlsx'): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Swarrnim Startup & Innovation University - Central Identity & Access Governance';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('User Account Register', {
      views: [{ state: 'frozen', ySplit: 5 }]
    });

    // University Title Banner
    ws.mergeCells('A1:J1');
    const headerCell = ws.getCell('A1');
    headerCell.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    headerCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // Subtitle
    ws.mergeCells('A2:J2');
    const subCell = ws.getCell('A2');
    subCell.value = 'CENTRAL USER ACCOUNT & AUTHORIZATION REGISTER';
    subCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2C59' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 22;

    // Metadata Row
    ws.getCell('A3').value = `Generated: ${new Date().toLocaleString('en-IN')}`;
    ws.getCell('A3').font = { italic: true, size: 9 };
    ws.getCell('F3').value = `Total Accounts Exported: ${users.length}`;
    ws.getCell('F3').font = { bold: true, size: 9 };

    const headers = [
      'USERNAME', 'FULL NAME', 'EMAIL ADDRESS', 'EMP ID / ENROLLMENT NO.',
      'DEPARTMENT', 'INSTITUTE', 'ASSIGNED ROLE', 'ACCOUNT STATUS',
      'LAST LOGIN', 'CREATED DATE'
    ];

    ws.getRow(5).values = headers;
    ws.getRow(5).height = 24;
    ws.getRow(5).eachCell(cell => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF001F3F' } }
      };
    });

    users.forEach(u => {
      const row = ws.addRow([
        u.username || 'N/A',
        u.name,
        u.email,
        u.employeeId || u.enrollmentNo || 'N/A',
        u.departmentName || 'SSCIT',
        'Swarrnim Institute',
        u.role,
        u.accountStatus || (u.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never',
        u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2024-01-01'
      ]);
      row.height = 20;
      row.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    ws.columns = [
      { width: 18 }, { width: 26 }, { width: 30 }, { width: 22 },
      { width: 24 }, { width: 20 }, { width: 22 }, { width: 16 },
      { width: 22 }, { width: 16 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * 17. EXPORT TO CSV
   */
  public exportUsersCsv(users: User[], filename: string = 'SSIU_User_Accounts.csv'): void {
    const headers = [
      'Username', 'Full Name', 'Email Address', 'Emp ID / Enrollment No.',
      'Department', 'Role', 'Status', 'Last Login', 'Created Date'
    ];

    const rows = users.map(u => [
      `"${u.username || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.employeeId || u.enrollmentNo || ''}"`,
      `"${(u.departmentName || '').replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.accountStatus || u.status}"`,
      `"${u.lastLoginAt || 'Never'}"`,
      `"${u.createdAt ? u.createdAt.split('T')[0] : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * INTERNAL HELPER: LOG SECURITY AUDIT
   */
  public logSecurityAudit(params: {
    action: string;
    module: string;
    entity: string;
    recordId?: string;
    details: string;
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    actorUser?: User | null;
  }) {
    const actor = params.actorUser || { name: 'System Administrator', role: 'SUPER_ADMIN' as UserRole, id: 'admin' };
    const now = new Date().toISOString();

    const auditEntry: AuditLog = {
      id: `aud-${Date.now().toString().slice(-8)}`,
      timestamp: now,
      userId: actor.id,
      userName: actor.name || 'Administrator',
      userRole: actor.role || 'SUPER_ADMIN',
      action: params.action,
      module: params.module,
      entity: params.entity,
      recordId: params.recordId,
      details: params.details,
      status: 'SUCCESS',
      severity: params.action.includes('LOCK') || params.action.includes('DELETE') ? 'WARNING' : 'INFO',
      previousValue: params.previousValue ? JSON.stringify(params.previousValue) : undefined,
      newValue: params.newValue ? JSON.stringify(params.newValue) : undefined
    };

    db.addEntity<AuditLog>('auditLogs', auditEntry);
  }
}

export const userAccountManagementService = new UserAccountManagementService();
export const can = (user: User | null | undefined, moduleKey: string, action: string = 'VIEW', context?: any): boolean =>
  userAccountManagementService.can(user, moduleKey, action, context);
