/**
 * ==============================================================================
 * SSIU ERP — SUPABASE AUTHENTICATION & SESSION DATA TYPES
 * Central type definitions for authenticated sessions, roles, and identity mappings
 * ==============================================================================
 */

export type ERPRoleCode = 
  | 'SUPER_ADMIN'
  | 'UNIVERSITY_ADMIN'
  | 'HOD'
  | 'FACULTY'
  | 'MENTOR'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF'
  | 'GUEST';

export interface AuthenticatedUserSession {
  userAccountId: string;           // UUID from user_accounts.id
  authUserId: string;              // UUID from Supabase auth.users.id
  email: string;
  username: string;
  accountType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ADMIN' | 'PARENT' | 'EXTERNAL';
  accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'PENDING_ACTIVATION' | 'DISABLED';
  
  // Role & Permission Resolution
  roles: ERPRoleCode[];
  primaryRole: ERPRoleCode;
  permissions: string[];           // List of permission codes e.g. ['attendance.take', 'marks.view']
  isSuperAdmin: boolean;
  
  // Identity Resolution (Resolved from central master tables)
  studentId?: string;              // UUID from students.id
  facultyId?: string;              // UUID from faculty.id
  parentId?: string;               // UUID from parents.id
  
  // Scope Resolution
  instituteId?: string;            // UUID from institutes.id
  departmentId?: string;           // UUID from departments.id
  departmentIds?: string[];        // Array of department IDs (e.g. for HOD or joint faculty)
  
  // Parent Specific Wards
  linkedWardStudentIds?: string[]; // Array of student IDs linked to parent
  
  // Session Metadata
  token?: string;
  expiresAt?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string | string[];
  timestamp: string;
}
