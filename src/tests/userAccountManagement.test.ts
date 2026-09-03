import { describe, it, expect } from 'vitest';
import { userAccountManagementService, ERP_PERMISSION_MODULES } from '../services/userAccountManagementService';
import { isTabPermittedForRole, ALL_NAV_ITEMS } from '../constants/navigationConfig';
import { db } from '../services/db';
import { User } from '../types';

describe('Settings → User Account Management & Central Identity RBAC Suite', () => {
  it('1. Central ERP Coordinator: Seeded demo user exists with correct identity and active status', () => {
    const users = db.getUsers();
    const erpCoordinator = users.find(u => u.username === 'erpcoordinator');
    expect(erpCoordinator).toBeDefined();
    expect(erpCoordinator?.name).toBe('Central ERP Coordinator');
    expect(erpCoordinator?.email).toBe('demo.erpcoordinator@ssiu-demo.ac.in');
    expect(erpCoordinator?.role).toBe('ERP_COORDINATOR');
    expect(erpCoordinator?.departmentName).toBe('CENTRAL UNIVERSITY / CORPORATE OFFICE');
    expect(erpCoordinator?.status).toBe('ACTIVE');
  });

  it('2. Central ERP Coordinator Permissions: Read-only oversight across modules without destructive powers', () => {
    const perms = userAccountManagementService.getDefaultPermissionsForRole('ERP_COORDINATOR');
    expect(perms.SETTINGS.canView).toBe(true);
    expect(perms.SETTINGS.canExport).toBe(true);
    expect(perms.SETTINGS.canPrint).toBe(true);
    expect(perms.SETTINGS.canCreate).toBe(false);
    expect(perms.SETTINGS.canDelete).toBe(false);
    expect(perms.DASHBOARD.canView).toBe(true);
    expect(perms.INVENTORY_ASSETS.canView).toBe(true);
    expect(perms.ACADEMIC.canView).toBe(true);
  });

  it('3. Navigation RBAC: Only authorized roles can access Settings (Super Admin, Univ Admin, ERP Coordinator, Registrar)', () => {
    // Authorized roles
    expect(isTabPermittedForRole('settings', 'SUPER_ADMIN')).toBe(true);
    expect(isTabPermittedForRole('settings', 'UNIVERSITY_ADMIN')).toBe(true);
    expect(isTabPermittedForRole('settings', 'ERP_COORDINATOR')).toBe(true);
    expect(isTabPermittedForRole('settings', 'REGISTRAR')).toBe(true);

    // Strictly unauthorized roles
    expect(isTabPermittedForRole('settings', 'VICE_PRESIDENT')).toBe(false);
    expect(isTabPermittedForRole('settings', 'PRINCIPAL')).toBe(false);
    expect(isTabPermittedForRole('settings', 'HOD')).toBe(false);
    expect(isTabPermittedForRole('settings', 'FACULTY')).toBe(false);
    expect(isTabPermittedForRole('settings', 'STAFF')).toBe(false);
    expect(isTabPermittedForRole('settings', 'STUDENT')).toBe(false);
    expect(isTabPermittedForRole('settings', 'PARENT')).toBe(false);
    expect(isTabPermittedForRole('settings', 'DEPUTY_REGISTRAR')).toBe(false);
    expect(isTabPermittedForRole('settings', 'STUDENT_SECTION')).toBe(false);
    expect(isTabPermittedForRole('settings', 'MENTOR')).toBe(false);
  });

  it('4. Search and Filtering: Performs multi-criteria query across users', () => {
    const allUsers = userAccountManagementService.getUsers();
    expect(allUsers.length).toBeGreaterThan(0);

    // Search by username
    const adminUser = userAccountManagementService.getUsers({ searchQuery: 'admin' });
    expect(adminUser.length).toBeGreaterThanOrEqual(1);

    // Filter by role
    const facultyUsers = userAccountManagementService.getUsers({ role: 'FACULTY' });
    expect(facultyUsers.every(u => u.role === 'FACULTY')).toBe(true);

    // Filter by ERP Coordinator
    const erpUsers = userAccountManagementService.getUsers({ role: 'ERP_COORDINATOR' });
    expect(erpUsers.length).toBeGreaterThanOrEqual(1);
    expect(erpUsers[0].username).toBe('erpcoordinator');

    // Filter by status
    const activeUsers = userAccountManagementService.getUsers({ status: 'ACTIVE' });
    expect(activeUsers.every(u => (u.accountStatus || u.status) === 'ACTIVE')).toBe(true);
  });

  it('5. Role Permissions Matrix: Correct hierarchy access for Super Admin, Faculty, and Students', () => {
    // SUPER_ADMIN has full access
    const superAdminPerms = userAccountManagementService.getDefaultPermissionsForRole('SUPER_ADMIN');
    expect(superAdminPerms.SETTINGS.canDelete).toBe(true);
    expect(superAdminPerms.DASHBOARD.canView).toBe(true);

    // FACULTY has NO settings access
    const facultyPerms = userAccountManagementService.getDefaultPermissionsForRole('FACULTY');
    expect(facultyPerms.ACADEMIC.canView).toBe(true);
    expect(facultyPerms.ACADEMIC.canEdit).toBe(true);
    expect(facultyPerms.SETTINGS.canView).toBe(false);
    expect(facultyPerms.SETTINGS.canDelete).toBe(false);

    // STUDENT has academic view but no settings access
    const studentPerms = userAccountManagementService.getDefaultPermissionsForRole('STUDENT');
    expect(studentPerms.ACADEMIC.canView).toBe(true);
    expect(studentPerms.ACADEMIC.canEdit).toBe(false);
    expect(studentPerms.SETTINGS.canView).toBe(false);
  });

  it('6. Account Creation & Unique Validation: Validates email, username, and sets initial status', () => {
    const timestamp = Date.now().toString().slice(-6);
    const testUsername = `user.test.${timestamp}`;
    const testEmail = `test.user.${timestamp}@swarrnim.edu.in`;

    const newUser = userAccountManagementService.createUser({
      username: testUsername,
      email: testEmail,
      name: 'Dr. Test Administrator',
      password: 'SecurePassword@123',
      role: 'FACULTY',
      employeeId: `EMP-TEST-${timestamp}`,
      designation: 'Associate Professor',
      accountStatus: 'ACTIVE',
      forcePasswordReset: true,
      twoFactorEnabled: true
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.username).toBe(testUsername);
    expect(newUser.role).toBe('FACULTY');
    expect(newUser.forcePasswordReset).toBe(true);

    // Duplicate username check
    expect(() => {
      userAccountManagementService.createUser({
        username: testUsername,
        email: `another.${timestamp}@swarrnim.edu.in`,
        name: 'Duplicate User',
        role: 'FACULTY'
      });
    }).toThrow(/already assigned/);

    // Duplicate email check
    expect(() => {
      userAccountManagementService.createUser({
        username: `unique.${timestamp}`,
        email: testEmail,
        name: 'Duplicate Email User',
        role: 'FACULTY'
      });
    }).toThrow(/already registered/);
  });

  it('7. Account Status Transitions: Toggles Lock, Active, and Inactive with state persistence', () => {
    const users = db.getUsers();
    const targetUser = users[0];

    // Lock user
    const locked = userAccountManagementService.toggleAccountStatus(targetUser.id, 'LOCKED');
    expect(locked.accountStatus).toBe('LOCKED');
    expect(locked.status).toBe('INACTIVE');

    // Reactivate user
    const active = userAccountManagementService.toggleAccountStatus(targetUser.id, 'ACTIVE');
    expect(active.accountStatus).toBe('ACTIVE');
    expect(active.status).toBe('ACTIVE');
  });

  it('8. Custom Permissions: Merges direct module overrides with role defaults', () => {
    const users = db.getUsers();
    const facultyUser = users.find(u => u.role === 'FACULTY') || users[0];

    // Grant custom export override on ACADEMIC
    const updated = userAccountManagementService.saveUserPermissions(facultyUser.id, {
      ACADEMIC: { canExport: true, canDelete: true }
    });

    const { permissions, details } = userAccountManagementService.getEffectivePermissions(updated);
    expect(permissions.ACADEMIC.canExport).toBe(true);
    expect(permissions.ACADEMIC.canDelete).toBe(true);
    expect(details.ACADEMIC.canExport.source).toBe('DIRECT');
  });

  it('9. Password Reset & Audit Trails: Secure reset with audit log entries', () => {
    const users = db.getUsers();
    const targetUser = users[0];

    userAccountManagementService.resetPassword(targetUser.id, 'NewSecuredPass@2026', true);
    const updated = db.getUsers().find(u => u.id === targetUser.id);

    expect(updated?.password).toBe('NewSecuredPass@2026');
    expect(updated?.forcePasswordReset).toBe(true);

    const auditLogs = userAccountManagementService.getUserAuditLogs(targetUser);
    expect(auditLogs.some(l => l.action === 'PASSWORD_RESET')).toBe(true);
  });
});
