/**
 * ==============================================================================
 * SSIU ERP — SUPABASE AUTH & MASTER APIs COMPREHENSIVE TEST SUITE
 * Tests authentication, session resolution, RBAC guards, permissions, and identity scoping
 * ==============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseAuthSessionService, UserAccountSession, ERPRoleCode } from '../services/access/supabaseAuthSessionService';

// Mock test accounts representing the 6 core roles
const MOCK_SESSIONS: Record<ERPRoleCode, UserAccountSession> = {
  SUPER_ADMIN: {
    userAccountId: 'ua-superadmin-01',
    authUserId: 'auth-superadmin-01',
    email: 'superadmin@swarrnim.edu.in',
    username: 'superadmin',
    accountType: 'ADMIN',
    accountStatus: 'ACTIVE',
    roles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN'],
    primaryRole: 'SUPER_ADMIN',
    permissions: ['*'],
    isSuperAdmin: true,
    token: 'mock.jwt.superadmin',
    expiresAt: Date.now() + 3600000,
  },
  HOD: {
    userAccountId: 'ua-hod-ce-01',
    authUserId: 'auth-hod-ce-01',
    email: 'amit.shah@swarrnim.edu.in',
    username: 'hod_amitshah',
    accountType: 'FACULTY',
    accountStatus: 'ACTIVE',
    roles: ['HOD', 'FACULTY'],
    primaryRole: 'HOD',
    permissions: ['attendance.view', 'attendance.approve', 'sessionplan.approve', 'timetable.manage'],
    isSuperAdmin: false,
    facultyId: 'fac-ce-001',
    instituteId: 'inst-sscit-01',
    departmentId: 'dept-ce-01',
    departmentIds: ['dept-ce-01'],
    token: 'mock.jwt.hod',
    expiresAt: Date.now() + 3600000,
  },
  FACULTY: {
    userAccountId: 'ua-faculty-priya-01',
    authUserId: 'auth-faculty-priya-01',
    email: 'priya.sharma@swarrnim.edu.in',
    username: 'fac_priyasharma',
    accountType: 'FACULTY',
    accountStatus: 'ACTIVE',
    roles: ['FACULTY'],
    primaryRole: 'FACULTY',
    permissions: ['attendance.take', 'sessionplan.manage', 'assignment.create', 'assignment.grade'],
    isSuperAdmin: false,
    facultyId: 'fac-ce-002',
    instituteId: 'inst-sscit-01',
    departmentId: 'dept-ce-01',
    departmentIds: ['dept-ce-01'],
    token: 'mock.jwt.faculty',
    expiresAt: Date.now() + 3600000,
  },
  MENTOR: {
    userAccountId: 'ua-faculty-priya-01',
    authUserId: 'auth-faculty-priya-01',
    email: 'priya.sharma@swarrnim.edu.in',
    username: 'fac_priyasharma',
    accountType: 'FACULTY',
    accountStatus: 'ACTIVE',
    roles: ['FACULTY', 'MENTOR'],
    primaryRole: 'MENTOR',
    permissions: ['mentor.counsel', 'mentor.risk_alert', 'attendance.take'],
    isSuperAdmin: false,
    facultyId: 'fac-ce-002',
    instituteId: 'inst-sscit-01',
    departmentId: 'dept-ce-01',
    token: 'mock.jwt.mentor',
    expiresAt: Date.now() + 3600000,
  },
  STUDENT: {
    userAccountId: 'ua-student-aarav-01',
    authUserId: 'auth-student-aarav-01',
    email: 'aarav.patel@swarrnim.edu.in',
    username: 'stu_aaravpatel',
    accountType: 'STUDENT',
    accountStatus: 'ACTIVE',
    roles: ['STUDENT'],
    primaryRole: 'STUDENT',
    permissions: ['student.profile.view', 'attendance.view_own', 'assignment.submit'],
    isSuperAdmin: false,
    studentId: 'stu-ce-001',
    instituteId: 'inst-sscit-01',
    departmentId: 'dept-ce-01',
    token: 'mock.jwt.student',
    expiresAt: Date.now() + 3600000,
  },
  PARENT: {
    userAccountId: 'ua-parent-mahesh-01',
    authUserId: 'auth-parent-mahesh-01',
    email: 'mahesh.patel@gmail.com',
    username: 'parent_maheshpatel',
    accountType: 'PARENT',
    accountStatus: 'ACTIVE',
    roles: ['PARENT'],
    primaryRole: 'PARENT',
    permissions: ['ward.profile.view', 'ward.attendance.view', 'ptm.view'],
    isSuperAdmin: false,
    parentId: 'parent-001',
    linkedWardStudentIds: ['stu-ce-001'],
    token: 'mock.jwt.parent',
    expiresAt: Date.now() + 3600000,
  },
  STAFF: {
    userAccountId: 'ua-staff-01',
    authUserId: 'auth-staff-01',
    email: 'staff@swarrnim.edu.in',
    username: 'staff_01',
    accountType: 'STAFF',
    accountStatus: 'ACTIVE',
    roles: ['STAFF'],
    primaryRole: 'STAFF',
    permissions: ['reports.export'],
    isSuperAdmin: false,
    token: 'mock.jwt.staff',
    expiresAt: Date.now() + 3600000,
  },
  GUEST: {
    userAccountId: 'ua-guest-01',
    authUserId: 'auth-guest-01',
    email: 'guest@swarrnim.edu.in',
    username: 'guest_01',
    accountType: 'EXTERNAL',
    accountStatus: 'ACTIVE',
    roles: ['GUEST'],
    primaryRole: 'GUEST',
    permissions: [],
    isSuperAdmin: false,
    token: 'mock.jwt.guest',
    expiresAt: Date.now() + 3600000,
  },
};

// Simulation of Backend Guards for Integration Testing
function simulateRolesGuard(session: UserAccountSession | null, requiredRoles: ERPRoleCode[]): { allowed: boolean; error?: string } {
  if (!session) return { allowed: false, error: 'Unauthorized: Unauthenticated user.' };
  if (session.isSuperAdmin || session.roles.includes('SUPER_ADMIN') || session.roles.includes('UNIVERSITY_ADMIN')) {
    return { allowed: true };
  }
  const hasRole = requiredRoles.some((r) => session.roles.includes(r));
  if (!hasRole) {
    return { allowed: false, error: `Forbidden: Required role(s) [${requiredRoles.join(', ')}].` };
  }
  return { allowed: true };
}

function simulatePermissionsGuard(session: UserAccountSession | null, requiredPermissions: string[]): { allowed: boolean; error?: string } {
  if (!session) return { allowed: false, error: 'Unauthorized: Unauthenticated user.' };
  if (session.isSuperAdmin || session.roles.includes('SUPER_ADMIN')) {
    return { allowed: true };
  }
  const userPerms = new Set(session.permissions || []);
  const hasAll = requiredPermissions.every((p) => userPerms.has(p));
  if (!hasAll) {
    return { allowed: false, error: `Forbidden: Missing required permission(s) [${requiredPermissions.join(', ')}].` };
  }
  return { allowed: true };
}

describe('SSIU ERP — Supabase Authentication, Session & Master API Foundation', () => {
  beforeEach(() => {
    supabaseAuthSessionService.logout();
  });

  describe('1. Supabase Session Lifecycle & Restoration', () => {
    it('Initial state: user is unauthenticated', () => {
      expect(supabaseAuthSessionService.isAuthenticated()).toBe(false);
      expect(supabaseAuthSessionService.getSession()).toBeNull();
    });

    it('Setting active student session resolves student identity', () => {
      supabaseAuthSessionService.setSession(MOCK_SESSIONS.STUDENT);
      expect(supabaseAuthSessionService.isAuthenticated()).toBe(true);
      expect(supabaseAuthSessionService.getStudentId()).toBe('stu-ce-001');
      expect(supabaseAuthSessionService.hasRole('STUDENT')).toBe(true);
      expect(supabaseAuthSessionService.hasRole('FACULTY')).toBe(false);
    });

    it('Setting active parent session resolves linked ward identity', () => {
      supabaseAuthSessionService.setSession(MOCK_SESSIONS.PARENT);
      expect(supabaseAuthSessionService.isAuthenticated()).toBe(true);
      expect(supabaseAuthSessionService.getParentId()).toBe('parent-001');
      expect(supabaseAuthSessionService.getLinkedWardIds()).toEqual(['stu-ce-001']);
      expect(supabaseAuthSessionService.isParentOf('stu-ce-001')).toBe(true);
      expect(supabaseAuthSessionService.isParentOf('stu-ce-002')).toBe(false);
    });

    it('Expired session triggers automatic logout', () => {
      const expiredSession = { ...MOCK_SESSIONS.FACULTY, expiresAt: Date.now() - 1000 };
      supabaseAuthSessionService.setSession(expiredSession);
      expect(supabaseAuthSessionService.isAuthenticated()).toBe(false);
      expect(supabaseAuthSessionService.getSession()).toBeNull();
    });

    it('Logout explicitly clears session and notifies subscribers', () => {
      let notifiedSession: UserAccountSession | null = null;
      supabaseAuthSessionService.subscribe((s) => {
        notifiedSession = s;
      });

      supabaseAuthSessionService.setSession(MOCK_SESSIONS.HOD);
      expect(supabaseAuthSessionService.isAuthenticated()).toBe(true);

      supabaseAuthSessionService.logout();
      expect(supabaseAuthSessionService.isAuthenticated()).toBe(false);
      expect(notifiedSession).toBeNull();
    });
  });

  describe('2. Backend RolesGuard (RBAC)', () => {
    it('SUPER_ADMIN passes all role requirements', () => {
      const result = simulateRolesGuard(MOCK_SESSIONS.SUPER_ADMIN, ['HOD', 'FACULTY']);
      expect(result.allowed).toBe(true);
    });

    it('HOD passes HOD requirement', () => {
      const result = simulateRolesGuard(MOCK_SESSIONS.HOD, ['HOD']);
      expect(result.allowed).toBe(true);
    });

    it('STUDENT is rejected from FACULTY endpoints', () => {
      const result = simulateRolesGuard(MOCK_SESSIONS.STUDENT, ['FACULTY']);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Forbidden');
    });

    it('Unauthenticated user is rejected', () => {
      const result = simulateRolesGuard(null, ['STUDENT']);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('3. Backend PermissionsGuard', () => {
    it('Faculty with attendance.take permission passes attendance guard', () => {
      const result = simulatePermissionsGuard(MOCK_SESSIONS.FACULTY, ['attendance.take']);
      expect(result.allowed).toBe(true);
    });

    it('Student without attendance.take permission is rejected', () => {
      const result = simulatePermissionsGuard(MOCK_SESSIONS.STUDENT, ['attendance.take']);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Missing required permission');
    });

    it('SUPER_ADMIN passes any permission check', () => {
      const result = simulatePermissionsGuard(MOCK_SESSIONS.SUPER_ADMIN, ['restricted.audit.wipe']);
      expect(result.allowed).toBe(true);
    });
  });

  describe('4. Master API Identity & Scoping Assertions', () => {
    it('HOD resolves departmentId DEP-CE', () => {
      supabaseAuthSessionService.setSession(MOCK_SESSIONS.HOD);
      expect(supabaseAuthSessionService.getDepartmentId()).toBe('dept-ce-01');
      expect(supabaseAuthSessionService.hasRole('HOD')).toBe(true);
    });

    it('Faculty resolves facultyId FAC-CE-002', () => {
      supabaseAuthSessionService.setSession(MOCK_SESSIONS.FACULTY);
      expect(supabaseAuthSessionService.getFacultyId()).toBe('fac-ce-002');
    });

    it('Mentor has both FACULTY and MENTOR roles', () => {
      supabaseAuthSessionService.setSession(MOCK_SESSIONS.MENTOR);
      expect(supabaseAuthSessionService.hasRole('FACULTY')).toBe(true);
      expect(supabaseAuthSessionService.hasRole('MENTOR')).toBe(true);
    });
  });
});
