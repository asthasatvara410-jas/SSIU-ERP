import { describe, it, expect } from 'vitest';
import { academicProgressionGovernanceService } from '../services/academicProgressionGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 22: Attendance + Examination + Result + Student Progress Engine', () => {

  const studentAContext: UserAuthorizationContext = {
    userId: 'stud-001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'stud-002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Deterministic SGPA Engine: Calculates SGPA based on weighted course credits and grade points', () => {
    // Student 1 has:
    // CS301 (4 credits, grade AA = 10 pts) -> 40
    // CS302 (4 credits, grade AB = 9 pts) -> 36
    // SGPA = (40 + 36) / 8 = 76 / 8 = 9.5
    const sgpa = academicProgressionGovernanceService.calculateSGPA('stud-001', 'term-2026-sem3');
    expect(sgpa).toBe(9.5);
  });

  it('TEST 2: Academic Risk Engine: Accurately identifies at-risk students based on attendance shortages and failures', () => {
    const summaryGood = academicProgressionGovernanceService.getAcademicProgressSummary('stud-001');
    expect(summaryGood?.riskLevel).toBe('LOW');
    expect(summaryGood?.overallAttendancePercentage).toBe(100);

    const summaryShortage = academicProgressionGovernanceService.getAcademicProgressSummary('stud-002');
    expect(summaryShortage?.riskLevel).toBe('CRITICAL'); // 0% attendance
    expect(summaryShortage?.overallAttendancePercentage).toBe(0);
  });

  it('TEST 3: Student Privacy & Access Scoping: Student A can view own progress, but Student B is strictly blocked', () => {
    const ownProgress = academicProgressionGovernanceService.getAcademicProgressSummary('stud-001', studentAContext);
    expect(ownProgress).toBeDefined();
    expect(ownProgress?.currentSGPA).toBe(9.5);

    const unauthorizedProgress = academicProgressionGovernanceService.getAcademicProgressSummary('stud-001', studentBContext);
    expect(unauthorizedProgress).toBeUndefined(); // Strictly blocked
  });
});
