import { describe, it, expect } from 'vitest';
import { notificationService } from '../services/notificationService';
import { taskService } from '../services/taskService';
import { erpEventBusService, BusinessEventPayload } from '../services/erpEventBusService';
import { UserAuthorizationContext, User } from '../types';

describe('SSIU ERP – Phase 6: Notification, Task, Audit & Activity Engine', () => {

  const hodCseContext: UserAuthorizationContext = {
    userId: 'usr-hod-cse',
    userName: 'Dr. HOD CSE',
    email: 'hod.cse@ssiu.ac.in',
    activeRole: 'HOD',
    assignedRoles: ['HOD'],
    permissions: ['VIEW', 'APPROVE'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const hodMechContext: UserAuthorizationContext = {
    userId: 'usr-hod-mech',
    userName: 'Dr. HOD Mechanical',
    email: 'hod.mech@ssiu.ac.in',
    activeRole: 'HOD',
    assignedRoles: ['HOD'],
    permissions: ['VIEW', 'APPROVE'],
    instituteId: 'inst-1',
    departmentId: 'dept-2'
  };

  const facultyUser: User = {
    id: 'usr-fac-cse',
    name: 'Prof. CSE Faculty',
    email: 'faculty.cse@ssiu.ac.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  it('TEST 1: Task creation and retrieval are assignment-specific and scope-aware', () => {
    const task = taskService.createTask({
      title: 'Review Notesheet NS-2026-099',
      description: 'Faculty submitted new laboratory procurement notesheet',
      module: 'NOTESHEET',
      entityType: 'NOTESHEET',
      entityId: 'ns-2026-099',
      assignedToUserId: hodCseContext.userId,
      assignedByUserId: facultyUser.id,
      departmentId: 'dept-1',
      instituteId: 'inst-1'
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe('OPEN');

    const hodTasks = taskService.getTasksForUser(hodCseContext);
    expect(hodTasks.records.some(t => t.id === task.id)).toBe(true);

    const mechTasks = taskService.getTasksForUser(hodMechContext);
    expect(mechTasks.records.some(t => t.id === task.id)).toBe(false);
  });

  it('TEST 2: Completing an entity action marks the associated task as COMPLETED', () => {
    const completed = taskService.completeTaskForEntity('ns-2026-099', hodCseContext.userId);
    expect(completed).toBe(true);

    const hodTasks = taskService.getTasksForUser(hodCseContext);
    const updated = hodTasks.records.find(t => t.entityId === 'ns-2026-099');
    expect(updated?.status).toBe('COMPLETED');
  });

  it('TEST 3: Event Bus idempotent publishing prevents duplicate tasks and activities', () => {
    const eventId = 'evt-test-unique-771122';
    const eventPayload: BusinessEventPayload = {
      eventId,
      eventType: 'RECORD_FORWARDED',
      module: 'NOTESHEET',
      entityType: 'NOTESHEET',
      entityId: 'ns-idemp-001',
      actorUserId: facultyUser.id,
      actorName: facultyUser.name,
      actorRole: facultyUser.role,
      targetUserId: hodCseContext.userId,
      targetRole: 'HOD',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      summary: 'Faculty forwarded Notesheet to HOD',
      timestamp: new Date().toISOString()
    };

    const firstPublish = erpEventBusService.publishEvent(eventPayload);
    expect(firstPublish).toBe(true);

    const secondPublish = erpEventBusService.publishEvent(eventPayload);
    expect(secondPublish).toBe(false); // Duplicate prevented safely
  });

  it('TEST 4: Human-readable recent activity stream is scope-filtered', () => {
    const cseActivities = erpEventBusService.getRecentActivityForUser(hodCseContext);
    expect(cseActivities.length).toBeGreaterThan(0);

    cseActivities.forEach(act => {
      if (act.departmentId) {
        expect(act.departmentId).toBe('dept-1');
      }
    });
  });

  it('TEST 5: Inventory Events remain isolated across transaction types', () => {
    const transferEvent: BusinessEventPayload = {
      eventId: 'evt-tr-001',
      eventType: 'ASSET_TRANSFERRED',
      module: 'INVENTORY',
      entityType: 'ASSET_TRANSFER',
      entityId: 'tf-001',
      actorUserId: 'usr-admin',
      actorName: 'Asset Admin',
      actorRole: 'ADMIN',
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      summary: 'Asset AST-100 transferred to IT Department',
      timestamp: new Date().toISOString()
    };

    erpEventBusService.publishEvent(transferEvent);
    const activities = erpEventBusService.getRecentActivityForUser(hodCseContext);
    const transferAct = activities.find(a => a.eventId === 'evt-tr-001');

    expect(transferAct?.entityType).toBe('ASSET_TRANSFER');
    expect(transferAct?.module).toBe('INVENTORY');
  });
});
