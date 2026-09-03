import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { userAccountManagementService, ERP_PERMISSION_MODULES, ModulePermissionSet } from '../services/userAccountManagementService';
import { User, UserRole, AccountStatus, DataScopeType } from '../types';

describe('Centralized Role & Permission Governance System', () => {
  let superAdmin: User;
  let erpCoordinator: User;
  let hodUser: User;
  let facultyUser: User;
  let otherFacultyUser: User;

  beforeEach(() => {
    // Re-seed or verify test users
    const users = db.getUsers();
    
    superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || {
      id: 'super-admin-test',
      username: 'superadmin',
      name: 'Super Administrator',
      email: 'superadmin@ssiu.edu',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      accountStatus: 'ACTIVE'
    };

    erpCoordinator = users.find(u => u.role === 'ERP_COORDINATOR') || {
      id: 'erp-coord-test',
      username: 'erpcoordinator',
      name: 'Central ERP Coordinator',
      email: 'demo.erpcoordinator@ssiu-demo.ac.in',
      role: 'ERP_COORDINATOR',
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      departmentName: 'CENTRAL UNIVERSITY / CORPORATE OFFICE'
    };

    hodUser = users.find(u => u.role === 'HOD' && u.departmentId === 'dept-1') || users.find(u => u.role === 'HOD') || {
      id: 'hod-test',
      username: 'hod_cs',
      name: 'HOD Computer Science',
      email: 'hod.cs@ssiu.edu',
      role: 'HOD',
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      departmentId: 'dept-1',
      departmentName: 'Computer Science and Engineering',
      instituteId: 'inst-1'
    };

    facultyUser = users.find(u => u.role === 'FACULTY' && u.departmentId === 'dept-1') || {
      id: 'faculty-test',
      username: 'faculty_cs_1',
      name: 'Dr. Faculty One',
      email: 'faculty1@ssiu.edu',
      role: 'FACULTY',
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      departmentId: 'dept-1',
      departmentName: 'Computer Science and Engineering',
      instituteId: 'inst-1'
    };

    otherFacultyUser = users.find(u => u.role === 'FACULTY' && u.departmentId !== 'dept-1') || {
      id: 'faculty-other-dept',
      username: 'faculty_ec_1',
      name: 'Prof. EC Faculty',
      email: 'faculty.ec@ssiu.edu',
      role: 'FACULTY',
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      departmentId: 'dept-2',
      departmentName: 'Electronics and Communication',
      instituteId: 'inst-1'
    };
  });

  // ─── SCENARIO 1: Central ERP Coordinator Permissions & Roles ───────────────
  it('Scenario 1: ERP Coordinator has central access governance privileges', () => {
    const { permissions, isCoordinator } = userAccountManagementService.getEffectivePermissions(erpCoordinator);
    expect(isCoordinator).toBe(true);
    
    // Check module permissions for ERP_COORDINATOR
    expect(permissions.SETTINGS?.canView).toBe(true);
    expect(permissions.SETTINGS?.canManage).toBe(true);
    expect(permissions.SETTINGS?.canEdit).toBe(true);
    expect(permissions.INVENTORY_ASSETS?.canView).toBe(true);
    expect(permissions.ACADEMIC?.canView).toBe(true);

    const auth = userAccountManagementService.evaluateAuthorization(erpCoordinator, 'SETTINGS', 'MANAGE');
    expect(auth.authorized).toBe(true);
  });

  // ─── SCENARIO 2: Account Locking and Immediate 403 Rejection ──────────────
  it('Scenario 2: Locked accounts are immediately rejected with 403 and lock reason', () => {
    // 1. Lock the faculty user
    const lockReason = 'Security investigation into unauthorized data export';
    const locked = userAccountManagementService.lockUser(facultyUser.id, lockReason, erpCoordinator);
    
    expect(locked.accountStatus).toBe('LOCKED');
    expect(locked.lockReason).toBe(lockReason);
    expect(locked.lockedBy).toBe(erpCoordinator.username);

    // 2. Evaluate authorization for any module (even Dashboard or Academic View)
    const authDashboard = userAccountManagementService.evaluateAuthorization(locked, 'DASHBOARD', 'VIEW');
    expect(authDashboard.authorized).toBe(false);
    expect(authDashboard.statusCode).toBe(403);
    expect(authDashboard.reason).toContain('LOCKED');
    expect(authDashboard.reason).toContain(lockReason);

    // 3. Unlock the user
    const unlocked = userAccountManagementService.unlockUser(facultyUser.id, erpCoordinator);
    expect(unlocked.accountStatus).toBe('ACTIVE');
    expect(unlocked.lockReason).toBeUndefined();

    // 4. Verify user can now access authorized modules
    const authAfterUnlock = userAccountManagementService.evaluateAuthorization(unlocked, 'DASHBOARD', 'VIEW');
    expect(authAfterUnlock.authorized).toBe(true);
  });

  // ─── SCENARIO 3: Module-Level Permission Overrides (Revoke VIEW) ──────────
  it('Scenario 3: Custom permission override revoking VIEW blocks access even if role allows it', () => {
    // By default, FACULTY has canView = true for INVENTORY_ASSETS
    const initialAuth = userAccountManagementService.evaluateAuthorization(facultyUser, 'INVENTORY_ASSETS', 'VIEW');
    expect(initialAuth.authorized).toBe(true);

    // Coordinator revokes INVENTORY_ASSETS canView
    const override: Record<string, Partial<ModulePermissionSet>> = {
      INVENTORY_ASSETS: {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      }
    };
    userAccountManagementService.saveUserPermissions(facultyUser.id, override, erpCoordinator);

    // Refresh user state
    const updatedUser = db.getUsers().find(u => u.id === facultyUser.id)!;
    const postOverrideAuth = userAccountManagementService.evaluateAuthorization(updatedUser, 'INVENTORY_ASSETS', 'VIEW');
    expect(postOverrideAuth.authorized).toBe(false);
    expect(postOverrideAuth.statusCode).toBe(403);

    // Clean up: Reset permissions
    userAccountManagementService.resetUserPermissions(facultyUser.id, erpCoordinator);
  });

  // ─── SCENARIO 4: Data Scope Enforcement (DEPARTMENT vs OTHER DEPT) ─────────
  it('Scenario 4: DEPARTMENT scope isolates records from different departments', () => {
    // Configure HOD scope to DEPARTMENT
    userAccountManagementService.setUserScopes(hodUser.id, {
      INVENTORY_ASSETS: 'DEPARTMENT'
    }, erpCoordinator);

    const updatedHod = db.getUsers().find(u => u.id === hodUser.id)!;

    // 1. Same department record context -> ALLOW
    const sameDeptContext = {
      departmentId: hodUser.departmentId || 'dept-1',
      instituteId: hodUser.instituteId || 'inst-1',
      ownerId: facultyUser.id
    };
    const sameDeptAuth = userAccountManagementService.evaluateAuthorization(
      updatedHod,
      'INVENTORY_ASSETS',
      'VIEW',
      sameDeptContext
    );
    expect(sameDeptAuth.authorized).toBe(true);

    // 2. Different department record context -> DENY
    const otherDeptContext = {
      departmentId: 'dept-999', // Mechanical or other dept
      instituteId: 'inst-1',
      ownerId: otherFacultyUser.id
    };
    const otherDeptAuth = userAccountManagementService.evaluateAuthorization(
      updatedHod,
      'INVENTORY_ASSETS',
      'VIEW',
      otherDeptContext
    );
    expect(otherDeptAuth.authorized).toBe(false);
    expect(otherDeptAuth.statusCode).toBe(403);
    expect(otherDeptAuth.reason).toContain('Data scope');
  });

  // ─── SCENARIO 5: SELF Scope Enforcement ───────────────────────────────────
  it('Scenario 5: SELF scope restricts access to user own records only', () => {
    userAccountManagementService.setUserScopes(facultyUser.id, {
      INVENTORY_ASSETS: 'SELF'
    }, erpCoordinator);

    const updatedFaculty = db.getUsers().find(u => u.id === facultyUser.id)!;

    // 1. Access own record -> ALLOW
    const ownRecordContext = {
      ownerId: facultyUser.id,
      departmentId: facultyUser.departmentId
    };
    const ownAuth = userAccountManagementService.evaluateAuthorization(
      updatedFaculty,
      'INVENTORY_ASSETS',
      'VIEW',
      ownRecordContext
    );
    expect(ownAuth.authorized).toBe(true);

    // 2. Access colleague record -> DENY
    const colleagueRecordContext = {
      ownerId: 'colleague-id-456',
      departmentId: facultyUser.departmentId
    };
    const colleagueAuth = userAccountManagementService.evaluateAuthorization(
      updatedFaculty,
      'INVENTORY_ASSETS',
      'VIEW',
      colleagueRecordContext
    );
    expect(colleagueAuth.authorized).toBe(false);
    expect(colleagueAuth.statusCode).toBe(403);
  });

  // ─── SCENARIO 6: Anti-Self-Approval Workflow Rule ───────────────────────────
  it('Scenario 6: Workflow approvers cannot approve their own requests', () => {
    // HOD has APPROVE permission on INVENTORY_ASSETS
    const facultyRequestContext = {
      requesterId: facultyUser.id,
      departmentId: hodUser.departmentId
    };
    const facultyReqAuth = userAccountManagementService.evaluateAuthorization(
      hodUser,
      'INVENTORY_ASSETS',
      'APPROVE',
      facultyRequestContext
    );
    expect(facultyReqAuth.authorized).toBe(true);

    // When HOD is the requester, self-approval must be blocked
    const hodSelfRequestContext = {
      requesterId: hodUser.id,
      departmentId: hodUser.departmentId
    };
    const selfApprovalAuth = userAccountManagementService.evaluateAuthorization(
      hodUser,
      'INVENTORY_ASSETS',
      'APPROVE',
      hodSelfRequestContext
    );
    expect(selfApprovalAuth.authorized).toBe(false);
    expect(selfApprovalAuth.statusCode).toBe(403);
    expect(selfApprovalAuth.reason).toContain('Self-approval is strictly prohibited');
  });

  // ─── SCENARIO 7: Role Permission Template Dynamic Inheritance ──────────────
  it('Scenario 7: Updating role template modifies inherited permissions for all users of that role', () => {
    // 1. Get current faculty template
    const currentTemplate = userAccountManagementService.getRolePermissionTemplate('FACULTY');
    
    // 2. Update role template to add canExport = true on ACADEMIC
    const updatedFacultyTemplate = {
      ...currentTemplate,
      ACADEMIC: {
        ...currentTemplate.ACADEMIC,
        canExport: true
      }
    };
    userAccountManagementService.updateRolePermissionTemplate('FACULTY', updatedFacultyTemplate, erpCoordinator);

    // 3. Check effective permissions of facultyUser without custom overrides
    const effective = userAccountManagementService.getEffectivePermissions(facultyUser);
    expect(effective.permissions.ACADEMIC?.canExport).toBe(true);
  });

  // ─── SCENARIO 8: Immutable Security Audit Logging ──────────────────────────
  it('Scenario 8: All governance actions create immutable security audit records', () => {
    const initialLogCount = db.getAuditLogs().length;

    // Perform an account lock
    userAccountManagementService.lockUser(facultyUser.id, 'Audit log test lock', erpCoordinator);
    
    const logsAfterLock = db.getAuditLogs();
    expect(logsAfterLock.length).toBeGreaterThan(initialLogCount);
    
    const lockLog = logsAfterLock[0]; // Most recent
    expect(lockLog.action).toBe('USER_LOCKED');
    expect(lockLog.userName).toBe(erpCoordinator.name);
    expect(lockLog.details).toContain(facultyUser.username);
    expect(lockLog.details).toContain('Audit log test lock');

    // Clean up
    userAccountManagementService.unlockUser(facultyUser.id, erpCoordinator);
  });
});
