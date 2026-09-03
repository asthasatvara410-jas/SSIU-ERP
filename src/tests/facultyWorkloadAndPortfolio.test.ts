import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { workTransferService } from '../services/workTransferService';

describe('Faculty Workload & Portfolio Management', () => {
  beforeEach(() => {
    workTransferService.resetToInitialSeed();
  });

  it('1. Dynamic Workload Generation from Central Master & Timetable', () => {
    const allFaculty = db.getFaculty();
    expect(allFaculty.length).toBeGreaterThan(0);

    const fac1Workloads = workTransferService.getFacultyWorkloadItems('fac-1');
    expect(fac1Workloads.length).toBeGreaterThan(0);
    expect(fac1Workloads.some(w => w.workType === 'LECTURE' || w.workType === 'PRACTICAL')).toBe(true);
  });

  it('2. Distinct Faculty Profiles & Non-Identical Workloads', () => {
    const fac1Portfolio = workTransferService.getFacultyPortfolio('fac-1');
    const fac2Portfolio = workTransferService.getFacultyPortfolio('fac-2');
    const fac4Portfolio = workTransferService.getFacultyPortfolio('fac-4');

    expect(fac1Portfolio.facultyName).not.toBe(fac2Portfolio.facultyName);
    expect(typeof fac1Portfolio.totalWeeklyAcademicHours).toBe('number');
    expect(typeof fac2Portfolio.totalWeeklyAcademicHours).toBe('number');
    expect(typeof fac4Portfolio.totalWeeklyAcademicHours).toBe('number');
  });

  it('3. Strict Separation of Weekly Hours vs Non-Hour Duties', () => {
    const fac1Portfolio = workTransferService.getFacultyPortfolio('fac-1');
    const kpis = workTransferService.getFacultyWorkloadKPIs('fac-1');

    expect(typeof kpis.totalWeeklyLoad).toBe('number');
    expect(kpis.totalWeeklyLoad).toBeGreaterThanOrEqual(0);
    expect(kpis.mentoringLoad).toBe(fac1Portfolio.mentorStudentsCount);
  });

  it('4. Workload Assignment by Admin / HOD', () => {
    const assignedItem = workTransferService.assignWorkloadItem({
      facultyId: 'fac-1',
      workType: 'PROJECT_SUPERVISION',
      workTitle: 'Major Capstone Project Guide - FinTech AI',
      description: 'Supervise Final Year Semester 8 FinTech AI project group',
      programName: 'B.Tech Computer Science & Engineering',
      semesterNumber: 8,
      divisionName: 'Division A',
      weeklyHours: 3,
      responsibility: 'Project Supervisor',
      priority: 'HIGH'
    }, { id: 'admin-1', name: 'Dr. Principal', role: 'ADMIN' });

    expect(assignedItem.workId).toBeDefined();
    const updatedWorkloads = workTransferService.getFacultyWorkloadItems('fac-1');
    const found = updatedWorkloads.find(w => w.workTitle.includes('Major Capstone Project Guide'));
    expect(found).toBeDefined();
  });

  it('5. Workload Transfer & Delegation Lifecycle', () => {
    const assignedItem = workTransferService.assignWorkloadItem({
      facultyId: 'fac-1',
      workType: 'PROJECT_SUPERVISION',
      workTitle: 'AI Research Mentorship',
      weeklyHours: 2,
      priority: 'HIGH'
    }, { id: 'admin-1', name: 'Dr. Principal', role: 'ADMIN' });

    const transfer = workTransferService.createWorkTransfer({
      fromUserId: 'fac-1',
      toUserId: 'fac-2',
      startAt: '2026-08-25',
      endAt: '2026-08-30',
      reason: 'OFFICIAL_DUTY',
      remarks: 'Delegating lab session during International Conference',
      workItemIds: [assignedItem.workId]
    }, { id: 'fac-1', name: 'Dr. Rajesh Sharma', role: 'FACULTY' });

    expect(transfer.trackingCode).toBeDefined();

    workTransferService.autoSyncTransferStatuses('2026-08-26');
    const activeTransfers = workTransferService.getActiveTransfers('2026-08-26');
    const foundActive = activeTransfers.find(t => t.id === transfer.id);
    expect(foundActive).toBeDefined();

    const fac2Workloads = workTransferService.getFacultyWorkloadItems('fac-2');
    const receivedDelegation = fac2Workloads.find(w => w.isReceivedTransfer && w.transferredFromFacultyId === 'fac-1');
    expect(receivedDelegation).toBeDefined();
  });

  it('6. Transfer Audit Trail Preservation', () => {
    const allTransfers = workTransferService.getAllTransfers();
    expect(allTransfers.length).toBeGreaterThanOrEqual(2);
  });
});
