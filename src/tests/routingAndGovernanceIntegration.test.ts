import { describe, it, expect, beforeEach } from 'vitest';
import { isTabPermittedForRole, ERP_COORDINATOR_NAVIGATION_STRUCTURE } from '../constants/navigationConfig';
import { ROUTE_PATH_MAP, TAB_TO_CANONICAL_PATH } from '../App';
import { userAccountManagementService } from '../services/userAccountManagementService';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { db } from '../services/db';
import { User, AssetCondition } from '../types';

describe('SSIU ERP Routing & Access Governance Integration', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  describe('1. Clean Route Resolution & Path Mappings', () => {
    it('maps clean path routes to correct ERP tabs without query parameters', () => {
      expect(ROUTE_PATH_MAP['']).toBe('dashboard');
      expect(ROUTE_PATH_MAP['dashboard']).toBe('dashboard');
      expect(ROUTE_PATH_MAP['settings']).toBe('settings');
      expect(ROUTE_PATH_MAP['inventory-assets']).toBe('inventory-assets');
      expect(ROUTE_PATH_MAP['faculty/assets']).toBe('faculty-assets');
      expect(ROUTE_PATH_MAP['feedback']).toBe('feedback');
      expect(ROUTE_PATH_MAP['faculty/students/search']).toBe('student-search');
      expect(ROUTE_PATH_MAP['faculty/students/my-students']).toBe('my-students');
      expect(ROUTE_PATH_MAP['faculty/students/academic']).toBe('student-academics');
      expect(ROUTE_PATH_MAP['faculty/students/requests']).toBe('student-requests');
    });

    it('provides canonical paths for navigation history pushState', () => {
      expect(TAB_TO_CANONICAL_PATH['dashboard']).toBe('/dashboard');
      expect(TAB_TO_CANONICAL_PATH['settings']).toBe('/settings');
      expect(TAB_TO_CANONICAL_PATH['inventory-assets']).toBe('/inventory-assets');
      expect(TAB_TO_CANONICAL_PATH['faculty-assets']).toBe('/faculty/assets');
      expect(TAB_TO_CANONICAL_PATH['feedback']).toBe('/feedback');
      expect(TAB_TO_CANONICAL_PATH['student-search']).toBe('/faculty/students/search');
    });
  });

  describe('2. Route Permissions & Role Authorization Guards', () => {
    it('allows Central ERP Coordinator, Super Admin, University Admin to access Settings', () => {
      expect(isTabPermittedForRole('settings', 'ERP_COORDINATOR')).toBe(true);
      expect(isTabPermittedForRole('settings', 'SUPER_ADMIN')).toBe(true);
      expect(isTabPermittedForRole('settings', 'UNIVERSITY_ADMIN')).toBe(true);
      expect(isTabPermittedForRole('settings', 'REGISTRAR')).toBe(true);
    });

    it('strictly denies Settings route access to Faculty and Students (triggers HTTP 403 Access Denied)', () => {
      expect(isTabPermittedForRole('settings', 'FACULTY')).toBe(false);
      expect(isTabPermittedForRole('settings', 'STUDENT')).toBe(false);
      expect(isTabPermittedForRole('settings', 'PARENT')).toBe(false);
    });

    it('permits Inventory and Assets route for authorized academic and administrative roles', () => {
      expect(isTabPermittedForRole('inventory-assets', 'ERP_COORDINATOR')).toBe(true);
      expect(isTabPermittedForRole('inventory-assets', 'FACULTY')).toBe(true);
      expect(isTabPermittedForRole('inventory-assets', 'HOD')).toBe(true);
      expect(isTabPermittedForRole('inventory-assets', 'PRINCIPAL')).toBe(true);
      expect(isTabPermittedForRole('faculty-assets', 'FACULTY')).toBe(true);
    });

    it('permits Student Feedback route across University stakeholders', () => {
      expect(isTabPermittedForRole('feedback', 'STUDENT')).toBe(true);
      expect(isTabPermittedForRole('feedback', 'FACULTY')).toBe(true);
      expect(isTabPermittedForRole('feedback', 'HOD')).toBe(true);
      expect(isTabPermittedForRole('feedback', 'ERP_COORDINATOR')).toBe(true);
    });
  });

  describe('3. ERP Coordinator Navigation Structure', () => {
    it('defines rich accordion navigation structure for ERP Coordinator', () => {
      const ids = ERP_COORDINATOR_NAVIGATION_STRUCTURE.map(g => g.id);
      expect(ids).toContain('dashboard');
      expect(ids).toContain('settings');
      expect(ids).toContain('inventory-assets');
      expect(ids).toContain('feedback');
      expect(ids).toContain('security-audit');
      expect(ids).toContain('reports');
    });
  });

  describe('4. Central Access Governance & User Account Lifecycle', () => {
    it('allows Central ERP Coordinator to lock a user with a reason and blocks authorization', () => {
      const coordinator = db.getUsers().find(u => u.username === 'erpcoordinator')!;
      expect(coordinator).toBeDefined();

      const faculty = db.getUsers().find(u => u.username === 'faculty')!;
      expect(faculty).toBeDefined();

      // Lock faculty user
      const locked = userAccountManagementService.lockUser(
        faculty.id,
        'Security policy violation: Suspicious concurrent logins detected',
        coordinator
      );

      expect(locked.accountStatus).toBe('LOCKED');
      expect(locked.lockReason).toContain('Suspicious concurrent logins detected');
      expect(locked.lockedBy).toBe('erpcoordinator');

      // Evaluating authorization for locked user returns authorized false
      const auth = userAccountManagementService.evaluateAuthorization(
        locked,
        'INVENTORY_ASSETS',
        'VIEW',
        { ownerUserId: locked.id, departmentId: locked.departmentId }
      );

      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain('is LOCKED');

      // Unlock faculty user
      const unlocked = userAccountManagementService.unlockUser(faculty.id, coordinator);
      expect(unlocked.accountStatus).toBe('ACTIVE');
      expect(unlocked.lockedAt).toBeUndefined();

      const restoredAuth = userAccountManagementService.evaluateAuthorization(
        unlocked,
        'INVENTORY_ASSETS',
        'VIEW',
        { ownerUserId: unlocked.id, departmentId: unlocked.departmentId }
      );
      expect(restoredAuth.authorized).toBe(true);
    });

    it('preserves immutable audit logs for all access governance operations', () => {
      const coordinator = db.getUsers().find(u => u.username === 'erpcoordinator')!;
      const targetUser = db.getUsers().find(u => u.username === 'faculty')!;

      userAccountManagementService.lockUser(targetUser.id, 'Routine security lockdown', coordinator);

      const logs = db.getAuditLogs();
      const lockLog = logs.find(l => l.action === 'USER_LOCKED' && l.recordId === targetUser.id);
      expect(lockLog).toBeDefined();
      expect(lockLog?.userName).toBe(coordinator.name);
      expect(lockLog?.details).toContain('Routine security lockdown');
    });
  });

  describe('5. Faculty Asset Requisition & Custody Flow', () => {
    it('executes full custody assignment, transfer, and movement log flow', () => {
      const faculty = db.getUsers().find(u => u.username === 'faculty')!;
      const hod = db.getUsers().find(u => u.username === 'hod')!;
      const assets = db.getFixedAssets();
      expect(assets.length).toBeGreaterThan(0);
      const targetAsset = assets[0];

      // 1. HOD assigns asset to faculty
      const assigned = inventoryManagementService.assignAsset({
        assetId: targetAsset.id,
        assignedToUserId: faculty.id,
        assignedToName: faculty.name,
        assignedToEmpCode: faculty.employeeId,
        purpose: 'Official teaching & research workstation'
      }, hod);

      expect(assigned).toBeDefined();
      expect(assigned.assignedToName).toBe(faculty.name);

      // 2. Faculty requests asset transfer
      const transferReq = inventoryManagementService.requestAssetTransfer({
        assetId: targetAsset.id,
        toUserId: 'user-faculty-2',
        toUserName: 'Prof. Sharma',
        toDepartmentId: 'dept-1',
        toDepartmentName: 'Computer Engineering',
        reason: 'Handover for semester 2 lab'
      }, faculty);

      expect(transferReq.status).toBe('PENDING_HOD');
      expect(transferReq.assetId).toBe(targetAsset.id);

      // 3. HOD approves transfer
      const approvedTransfer = inventoryManagementService.reviewTransferRequest(
        transferReq.id,
        true,
        'Approved transfer to new lab in-charge',
        hod
      );

      expect(approvedTransfer.status).toBe('APPROVED');

      // 4. Custody movements & faculty dashboard data reflect changes
      const facultyDashboard = inventoryManagementService.getFacultyDashboardData(faculty);
      expect(facultyDashboard).toBeDefined();
      expect(facultyDashboard.transferRequests.length).toBeGreaterThanOrEqual(1);
    });
  });
});
