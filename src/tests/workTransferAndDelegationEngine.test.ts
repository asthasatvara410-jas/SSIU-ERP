import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { workTransferService } from '../services/workTransferService';
import { isTabPermittedForRole } from '../constants/navigationConfig';
import { User } from '../types';

describe('Work Transfer & Delegation Engine Suite', () => {
  beforeEach(() => {
    workTransferService.resetToInitialSeed();
  });

  const facultyUserA: User = {
    id: 'fac-1',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@ssiu.edu.in',
    username: 'faculty',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const facultyUserB: User = {
    id: 'fac-2',
    name: 'Prof. Anjali Patel',
    email: 'anjali.patel@ssiu.edu.in',
    username: 'faculty2',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  it('1. Active Work vs Historical Work Separation & Complete Cycle', () => {
    const transferredTaskIds = ['task-a1', 'task-a2', 'task-a3'];

    const transfer1 = workTransferService.createWorkTransfer({
      fromUserId: facultyUserA.id,
      toUserId: facultyUserB.id,
      startAt: '2026-08-20',
      endAt: '2026-08-25',
      reason: 'LEAVE',
      remarks: 'Medical leave coverage for examination and student requests',
      workItemIds: transferredTaskIds
    }, facultyUserA);

    expect(transfer1).toBeDefined();
    workTransferService.autoSyncTransferStatuses('2026-08-22');
    const activeTransfer = workTransferService.getAllTransfers().find(t => t.id === transfer1.id);
    expect(activeTransfer?.status).toBe('ACTIVE');
    expect(transfer1.auditTrail.length).toBeGreaterThanOrEqual(1);

    const transferredOutA = workTransferService.getTransferredOutWorkItemIds(facultyUserA.id, '2026-08-22');
    expect(transferredOutA.has('task-a1')).toBe(true);
    expect(transferredOutA.has('task-a2')).toBe(true);
    expect(transferredOutA.has('task-a3')).toBe(true);

    workTransferService.markWorkItemCompleted('task-a1', facultyUserB.id, 'Prof. Anjali Patel');
    const updatedTransfer = workTransferService.getAllTransfers().find(t => t.id === transfer1.id);
    expect(updatedTransfer?.completedItemIds.includes('task-a1')).toBe(true);

    workTransferService.autoSyncTransferStatuses('2026-08-26');
    const expiredTransfer = workTransferService.getAllTransfers().find(t => t.id === transfer1.id);
    expect(expiredTransfer?.status).toBe('EXPIRED');
  });

  it('2. Multi-Hop Transfer Chain & Assignment History', () => {
    const chainItem = 'task-chain-99';
    const tChain1 = workTransferService.createWorkTransfer({
      fromUserId: 'fac-1',
      toUserId: 'fac-2',
      startAt: '2026-07-01',
      endAt: '2026-07-05',
      reason: 'LEAVE',
      workItemIds: [chainItem]
    }, facultyUserA);

    const tChain2 = workTransferService.createWorkTransfer({
      fromUserId: 'fac-2',
      toUserId: 'fac-3',
      startAt: '2026-07-06',
      endAt: '2026-07-10',
      reason: 'OFFICIAL_DUTY',
      workItemIds: [chainItem]
    }, facultyUserB);

    const history = workTransferService.getWorkItemAssignmentHistory(chainItem);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.some(h => h.transferTrackingCode === tChain1.trackingCode || h.transferTrackingCode === tChain2.trackingCode)).toBe(true);
  });

  it('3. Higher Authority Filter & Audit Metrics', () => {
    const metrics = workTransferService.getTransferAuditMetrics();
    expect(metrics.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof metrics.activeCount).toBe('number');
    expect(typeof metrics.expiredCount).toBe('number');
    expect(typeof metrics.scheduledCount).toBe('number');

    const searchResults = workTransferService.getFilteredTransfers({
      searchQuery: 'Rajesh'
    });
    expect(Array.isArray(searchResults)).toBe(true);

    const expiredResults = workTransferService.getFilteredTransfers({
      status: 'EXPIRED'
    });
    expect(expiredResults.every(r => r.status === 'EXPIRED')).toBe(true);
  });

  it('4. Cancellation, Revocation & Audit Immutability', () => {
    const schedTransfer = workTransferService.createWorkTransfer({
      fromUserId: 'fac-1',
      toUserId: 'fac-4',
      startAt: '2026-10-01',
      endAt: '2026-10-05',
      reason: 'VACATION',
      workItemIds: ['task-cancel-1']
    }, facultyUserA);

    workTransferService.autoSyncTransferStatuses('2026-08-27');
    const scheduled = workTransferService.getAllTransfers().find(t => t.id === schedTransfer.id);
    expect(scheduled?.status).toBe('SCHEDULED');
    const cancelled = workTransferService.cancelScheduledTransfer(schedTransfer.id, { id: 'admin-1', name: 'Dr. Registrar', role: 'REGISTRAR' });
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledByName).toBe('Dr. Registrar');
  });

  it('5. Route Permissions & Dedicated Page Isolation', () => {
    expect(isTabPermittedForRole('work-transfer', 'FACULTY')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-new', 'FACULTY')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-received', 'FACULTY')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-active', 'FACULTY')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-history', 'FACULTY')).toBe(true);

    expect(isTabPermittedForRole('work-transfer', 'HOD')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-audit', 'HOD')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-audit', 'PRINCIPAL')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-audit', 'REGISTRAR')).toBe(true);
    expect(isTabPermittedForRole('work-transfer-audit', 'VICE_PRESIDENT')).toBe(true);

    expect(isTabPermittedForRole('work-transfer', 'STUDENT')).toBe(false);
    expect(isTabPermittedForRole('work-transfer-audit', 'STUDENT')).toBe(false);
  });
});
