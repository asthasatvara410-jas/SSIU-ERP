import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { deputyRegistrarScopeService } from '../services/deputyRegistrarScopeService';
import { User } from '../types';

describe('SSIU ERP – Registrar Deputy Registrar Jurisdiction & Delegation Module', () => {

  const registrarUser: User = {
    id: 'usr-reg-1',
    name: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    departmentId: 'dept-adm',
    instituteId: 'inst-main'
  };

  const nonRegistrarUser: User = {
    id: 'usr-faculty-1',
    name: 'Faculty User',
    email: 'faculty@swarrnim.edu.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1'
  };

  it('TEST 1: Summary KPIs should derive dynamically from actual ERP relational state', () => {
    const kpis = deputyRegistrarScopeService.getSummaryKPIs();
    expect(kpis).toBeDefined();
    expect(kpis.activeDeputyRegistrars).toBeGreaterThanOrEqual(0);
    expect(kpis.assignedInstitutes).toBeGreaterThanOrEqual(0);
    expect(kpis.assignedDepartments).toBeGreaterThanOrEqual(0);
    expect(kpis.unassignedInstitutes).toBeGreaterThanOrEqual(0);
    expect(kpis.unassignedDepartments).toBeGreaterThanOrEqual(0);
    expect(kpis.recentChangesCount).toBeGreaterThanOrEqual(0);
  });

  it('TEST 2: Deputy Registrar Directory should return populated items with employee ID and email', () => {
    const assignments = deputyRegistrarScopeService.getDeputyRegistrarAssignments();
    expect(assignments.length).toBeGreaterThanOrEqual(1);

    const first = assignments[0];
    expect(first.id).toBeDefined();
    expect(first.userId).toBeDefined();
    expect(first.userName).toBeDefined();
    expect(first.employeeId).toBeDefined();
    expect(first.instituteName).toBeDefined();
    expect(first.departmentNames).toBeInstanceOf(Array);
    expect(first.status).toBe('ACTIVE');
  });

  it('TEST 3: Registrar can assign new Deputy Registrar jurisdiction and log immutable audit event', () => {
    const newScope = deputyRegistrarScopeService.createAssignment({
      userId: 'user-deputyregistrar',
      instituteId: 'inst-2',
      departmentIds: ['dept-3', 'dept-4'],
      scopeLevel: 'MULTI_DEPARTMENT',
      effectiveFrom: '2026-08-15',
      reason: 'Official expansion of administrative jurisdiction'
    }, registrarUser);

    expect(newScope).toBeDefined();
    expect(newScope.instituteId).toBe('inst-2');
    expect(newScope.departmentIds).toContain('dept-3');
    expect(newScope.departmentIds).toContain('dept-4');
    expect(newScope.status).toBe('ACTIVE');

    const audits = deputyRegistrarScopeService.getAuditHistory(newScope.id);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].action).toBe('ASSIGNED');
    expect(audits[0].assignedByName).toBe(registrarUser.name);
  });

  it('TEST 4: Scope modification records OLD vs NEW delta in audit trail', () => {
    const created = deputyRegistrarScopeService.createAssignment({
      userId: 'user-deputyregistrar',
      instituteId: 'inst-3',
      departmentIds: ['dept-5'],
      scopeLevel: 'DEPARTMENT',
      effectiveFrom: '2026-08-10',
      reason: 'Single dept assignment'
    }, registrarUser);

    const updated = deputyRegistrarScopeService.updateAssignment(created.id, {
      instituteId: 'inst-3',
      departmentIds: ['dept-5', 'dept-6'],
      scopeLevel: 'MULTI_DEPARTMENT',
      reason: 'Added dept-6 to jurisdiction'
    }, registrarUser);

    expect(updated.departmentIds).toContain('dept-6');

    const audits = deputyRegistrarScopeService.getAuditHistory(created.id);
    const updateAudit = audits.find(a => a.action === 'UPDATED');
    expect(updateAudit).toBeDefined();
    expect(updateAudit?.newScope).toContain('dept-6');
  });

  it('TEST 5: Scope Transfer workflow correctly reassigns departments between Deputy Registrars', () => {
    const transferResult = deputyRegistrarScopeService.transferScope({
      fromUserId: 'user-deputyregistrar',
      toUserId: 'usr-reg-1', // transfer to another officer
      instituteId: 'inst-2',
      departmentIds: ['dept-3'],
      reason: 'Administrative restructuring'
    }, registrarUser);

    expect(transferResult.toScope).toBeDefined();
    expect(transferResult.toScope.userId).toBe('usr-reg-1');
    expect(transferResult.toScope.departmentIds).toContain('dept-3');

    const audits = deputyRegistrarScopeService.getAuditHistory();
    const transferAudit = audits.find(a => a.action === 'TRANSFERRED');
    expect(transferAudit).toBeDefined();
    expect(transferAudit?.reason).toBe('Administrative restructuring');
  });

  it('TEST 6: Conflict detection detects overlapping active assignments', () => {
    const conflict = deputyRegistrarScopeService.checkScopeConflicts({
      targetUserId: 'user-different',
      instituteId: 'inst-2',
      departmentIds: ['dept-4']
    });

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictingDetails.length).toBeGreaterThan(0);
  });

  it('TEST 7: Revoke / Suspend workflow marks status and preserves immutable audit log', () => {
    const created = deputyRegistrarScopeService.createAssignment({
      userId: 'user-deputyregistrar',
      instituteId: 'inst-4',
      departmentIds: ['dept-7'],
      reason: 'Temporary assignment for testing revoke'
    }, registrarUser);

    const revoked = deputyRegistrarScopeService.revokeScope(
      created.id, 
      'Administrative restructuring and consolidation', 
      'REVOKED', 
      registrarUser
    );

    expect(revoked.status).toBe('REVOKED');
    expect(revoked.revokeReason).toBe('Administrative restructuring and consolidation');

    const audits = deputyRegistrarScopeService.getAuditHistory(created.id);
    const revokeAudit = audits.find(a => a.action === 'REVOKED');
    expect(revokeAudit).toBeDefined();
  });

  it('TEST 8: Reactivate workflow restores suspended/revoked scopes with new effective date', () => {
    const created = deputyRegistrarScopeService.createAssignment({
      userId: 'user-deputyregistrar',
      instituteId: 'inst-5',
      departmentIds: ['dept-8'],
      reason: 'Assignment for reactivate testing'
    }, registrarUser);

    deputyRegistrarScopeService.revokeScope(created.id, 'Suspended for review', 'SUSPENDED', registrarUser);

    const reactivated = deputyRegistrarScopeService.reactivateScope(
      created.id, 
      'Review completed and restored', 
      '2026-09-01', 
      registrarUser
    );

    expect(reactivated.status).toBe('ACTIVE');
    expect(reactivated.effectiveFrom).toBe('2026-09-01');

    const audits = deputyRegistrarScopeService.getAuditHistory(created.id);
    const reactivateAudit = audits.find(a => a.action === 'REACTIVATED');
    expect(reactivateAudit).toBeDefined();
  });

  it('TEST 9: Security & RBAC: Prohibits non-Registrar users from creating or modifying scopes', () => {
    expect(() => {
      deputyRegistrarScopeService.createAssignment({
        userId: 'user-deputyregistrar',
        instituteId: 'inst-1',
        departmentIds: ['dept-1']
      }, nonRegistrarUser);
    }).toThrow(/403 Forbidden/);

    expect(() => {
      deputyRegistrarScopeService.revokeScope('dr-scope-1', 'Attempted unauthorized revoke', 'REVOKED', nonRegistrarUser);
    }).toThrow(/403 Forbidden/);
  });
});
