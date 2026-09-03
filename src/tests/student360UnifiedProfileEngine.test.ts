import { describe, it, expect } from 'vitest';
import { student360UnifiedProfileService } from '../services/student360UnifiedProfileService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.6: Unified Student 360 Profile & Aggregation Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['STUDENT_360_VIEW', 'FINANCE_360_VIEW', 'DOCUMENT_360_VIEW', 'ACADEMIC_360_VIEW']
  };

  const facultyContext: UserAuthorizationContext = {
    userId: 'emp-fac-001',
    userName: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@sit.ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    permissions: ['STUDENT_360_VIEW', 'ACADEMIC_360_VIEW', 'ATTENDANCE_360_VIEW']
    // Note: NO FINANCE_360_VIEW permission
  };

  const studentAContext: UserAuthorizationContext = {
    userId: 'STU-2026-000001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['STUDENT_360_VIEW']
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'STU-2026-000002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['STUDENT_360_VIEW']
  };

  it('TEST 1: Unified 360 Aggregation: Returns complete structured profile across all core pillars', () => {
    const s360 = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', registrarContext);

    expect(s360).toBeDefined();
    expect(s360?.header.studentId).toBe('STU-2026-000001');
    expect(s360?.header.enrollmentNumber).toBe('SU26CSE0001');
    expect(s360?.header.fullName).toBe('Aarav Patel');
    expect(s360?.header.primaryStatus).toBe('ACTIVE');

    expect(s360?.profile.email).toBe('aarav.patel@swarrnim.edu.in');
    expect(s360?.academic.creditsEarned).toBe(22);
    expect(s360?.academic.currentSGPA).toBe(8.8);
    expect(s360?.attendance.overallPercentage).toBe(92.5);
    expect(s360?.documents.totalRequired).toBeGreaterThanOrEqual(4);
    expect(s360?.actionItems.length).toBeGreaterThanOrEqual(1);
    expect(s360?.timeline.length).toBeGreaterThanOrEqual(4);
  });

  it('TEST 2: Cross-Module Identity & Relational Consistency: Enforces identical Student ID & Academic context', () => {
    const s360 = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', registrarContext);

    expect(s360?.header.studentId).toBe('STU-2026-000001');
    expect(s360?.header.programId).toBe('prog-bca');
    expect(s360?.header.departmentId).toBe('dept-cse');
    expect(s360?.header.instituteId).toBe('inst-sit');
    expect(s360?.header.currentSemester).toBe(1);
  });

  it('TEST 3: Role-Based Finance Privacy: Strips sensitive financial data for faculty lacking Finance permissions', () => {
    // 1. Registrar sees finance
    const regView = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', registrarContext);
    expect(regView?.finance).toBeDefined();
    expect(regView?.finance?.totalPaid).toBe(45000);

    // 2. Faculty without FINANCE_360_VIEW does NOT receive finance object
    const facView = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', facultyContext);
    expect(facView?.finance).toBeUndefined();
    // But academic and attendance remain visible
    expect(facView?.academic.currentSGPA).toBe(8.8);
    expect(facView?.attendance.overallPercentage).toBe(92.5);
  });

  it('TEST 4: Student Self-Access Security: Blocks Student A from inspecting Student B 360 profile', () => {
    // 1. Student A can inspect self
    const ownView = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', studentAContext);
    expect(ownView).toBeDefined();
    expect(ownView?.header.studentId).toBe('STU-2026-000001');

    // 2. Student B attempting to view Student A is blocked (returns undefined)
    const blockedView = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', studentBContext);
    expect(blockedView).toBeUndefined();
  });

  it('TEST 5: Document 360 & Timeline Integration: Correctly calculates completeness and ordered events', () => {
    const s360 = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', registrarContext);

    expect(s360?.documents.completenessPercentage).toBeGreaterThanOrEqual(75);
    expect(s360?.timeline[0].category).toBe('ADMISSION');
    expect(s360?.timeline[1].category).toBe('ENROLLMENT');
  });
});
