/**
 * SSIU ERP — Unit Tests: Roles & RBAC Matrix Governance Module
 * File: src/modules/permissions/tests/rbacMatrixGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { rbacMatrixGovernanceService } from '../services/rbacMatrixGovernanceService';

describe('SSIU ERP — Roles & RBAC Matrix Governance Module Engine', () => {
  it('TEST 1: Retrieves standard role matrix configurations across ERP roles', () => {
    const matrix = rbacMatrixGovernanceService.getRoleMatrixConfigurations();

    expect(matrix.length).toBeGreaterThanOrEqual(10);
    const superAdminRole = matrix.find(r => r.role === 'SUPER_ADMIN');
    expect(superAdminRole).toBeDefined();
    expect(superAdminRole?.isSystemProtected).toBe(true);
    expect(superAdminRole?.permissions.ORGANIZATION.canEdit).toBe(true);

    const studentRole = matrix.find(r => r.role === 'STUDENT');
    expect(studentRole).toBeDefined();
    expect(studentRole?.permissions.ORGANIZATION.canEdit).toBe(false);
  });

  it('TEST 2: Retrieves custom cross-campus user scopes correctly', () => {
    const scopes = rbacMatrixGovernanceService.getUserCustomScopes();

    expect(scopes.length).toBeGreaterThanOrEqual(1);
    const regScope = scopes.find(s => s.role === 'REGISTRAR');
    expect(regScope).toBeDefined();
    expect(regScope?.isCrossCampusAuthorized).toBe(true);
  });

  it('TEST 3: Appends permission audit mutation records with before/after state', () => {
    const initialLogsCount = rbacMatrixGovernanceService.getPermissionAuditLogs().length;

    const newLog = rbacMatrixGovernanceService.recordPermissionMutation(
      'usr-admin-001',
      'System Admin',
      'HOSTEL_ADMIN',
      'ROLE_MODIFIED',
      'Granted Gate Pass verification rights',
      'canApprove: false',
      'canApprove: true'
    );

    expect(newLog.id).toBeDefined();
    expect(newLog.targetRoleOrUser).toBe('HOSTEL_ADMIN');
    expect(rbacMatrixGovernanceService.getPermissionAuditLogs().length).toBe(initialLogsCount + 1);
  });
});
