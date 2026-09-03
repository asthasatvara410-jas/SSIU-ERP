import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { departmentScopeService } from '../services/departmentScopeService';
import { isTabPermittedForRole } from '../constants/navigationConfig';
import { User, Student } from '../types';

describe('HOD Department Command Center & Strict Data Scoping Suite', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const hodCE: User = {
    id: 'hod-1',
    name: 'Dr. Suresh Mehta (HOD CE)',
    email: 'hod.ce@ssiu.edu.in',
    username: 'hod_ce',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const hodME: User = {
    id: 'hod-2',
    name: 'Dr. Ramesh Joshi (HOD ME)',
    email: 'hod.me@ssiu.edu.in',
    username: 'hod_me',
    role: 'HOD',
    departmentId: 'dept-2',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const mentorA: User = {
    id: 'fac-1',
    name: 'Prof. Anjali Patel',
    email: 'anjali.patel@ssiu.edu.in',
    username: 'mentor_a',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  it('1. HOD Identity & Dynamic Department Scope Resolution', () => {
    const scopeCE = departmentScopeService.resolveScopeIdentity(hodCE, 'HOD');
    expect(scopeCE.departmentId).toBe('dept-1');
    expect(scopeCE.departmentCode).toBe('CE');
    expect(scopeCE.hodName).toBe('Dr. Suresh Mehta (HOD CE)');
    expect(scopeCE.academicYear).toBe('2025-2026');
    expect(scopeCE.programs.length).toBeGreaterThan(0);
    expect(scopeCE.programs.every(p => p.departmentId === 'dept-1')).toBe(true);

    const scopeME = departmentScopeService.resolveScopeIdentity(hodME, 'HOD');
    expect(scopeME.departmentId).toBe('dept-2');
    expect(scopeME.hodName).toBe('Dr. Ramesh Joshi (HOD ME)');
  });

  it('2. Zero Cross-Department Data Leakage: CE HOD sees 0 ME records', () => {
    const studentsCE = departmentScopeService.getScopedStudents(hodCE, 'HOD');
    const studentsME = departmentScopeService.getScopedStudents(hodME, 'HOD');

    expect(studentsCE.length).toBeGreaterThan(0);
    expect(studentsCE.every(s => s.departmentId === 'dept-1')).toBe(true);

    // Verify disjoint sets
    const ceIds = new Set(studentsCE.map(s => s.id));
    studentsME.forEach(s => {
      expect(ceIds.has(s.id)).toBe(false);
    });

    const facultyCE = departmentScopeService.getScopedFaculty(hodCE, 'HOD');
    expect(facultyCE.every(f => f.departmentId === 'dept-1')).toBe(true);

    const subjectsCE = departmentScopeService.getScopedSubjects(hodCE, 'HOD');
    expect(subjectsCE.every(s => s.departmentId === 'dept-1')).toBe(true);
  });

  it('3. Real-Time Derived Top 8 KPIs for Department', () => {
    const kpis = departmentScopeService.getDepartmentDashboardKPIs(hodCE, 'HOD');

    expect(kpis.totalStudents).toBeGreaterThan(0);
    expect(kpis.totalFaculty).toBeGreaterThan(0);
    expect(kpis.activeCourses).toBeGreaterThan(0);
    expect(typeof kpis.averageAttendancePercentage).toBe('number');
    expect(typeof kpis.attendanceShortageCount).toBe('number');
    expect(typeof kpis.academicAtRiskCount).toBe('number');
    expect(typeof kpis.pendingApprovalsCount).toBe('number');
    expect(typeof kpis.examEligibleCount).toBe('number');
    expect(kpis.examEligibleCount + kpis.examShortageCount + kpis.examProvisionalCount).toBe(kpis.totalStudents);
  });

  it('4. Program, Semester and Section Breakdown Tables', () => {
    const programs = departmentScopeService.getProgramBreakdown(hodCE, 'HOD');
    expect(programs.length).toBeGreaterThan(0);
    expect(programs.every(p => p.studentCount >= 0)).toBe(true);

    const semesters = departmentScopeService.getSemesterBreakdown(hodCE, 'HOD');
    expect(semesters.length).toBeGreaterThan(0);
    expect(semesters.every(s => typeof s.averageAttendance === 'number')).toBe(true);

    const sections = departmentScopeService.getSectionBreakdown(hodCE, 'HOD');
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.every(sec => typeof sec.mentorName === 'string')).toBe(true);
  });

  it('5. Faculty Workload & Mentorship Mapping Scoping', () => {
    const workload = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    expect(workload.length).toBeGreaterThan(0);
    workload.forEach(f => {
      expect(typeof f.totalWeeklyHours).toBe('number');
      expect(['UNDERLOAD', 'NORMAL', 'HIGH LOAD', 'OVERLOAD', 'UNDERLOADED', 'OVERLOADED'].includes(f.workloadStatus)).toBe(true);
    });

    const mentorship = departmentScopeService.getMentorshipOverview(hodCE, 'HOD');
    expect(mentorship.length).toBeGreaterThan(0);
    mentorship.forEach(m => {
      expect(m.totalMentees).toBeGreaterThan(0);
      expect(Array.isArray(m.menteeStudents)).toBe(true);
    });
  });

  it('6. Priority Action Items & Health Summary Diagnostics', () => {
    const attention = departmentScopeService.getDepartmentAttentionItems(hodCE, 'HOD');
    expect(Array.isArray(attention)).toBe(true);
    attention.forEach(item => {
      expect(['HIGH', 'MEDIUM', 'LOW'].includes(item.priority)).toBe(true);
      expect(item.actionLabel.length).toBeGreaterThan(0);
    });

    const health = departmentScopeService.getDepartmentHealthSummary(hodCE, 'HOD');
    expect(['EXCELLENT', 'GOOD', 'ATTENTION_REQUIRED', 'CRITICAL'].includes(health.attendanceStatus)).toBe(true);
    expect(['OPTIMAL', 'NORMAL', 'OVERLOADED', 'ATTENTION_REQUIRED'].includes(health.workloadStatus)).toBe(true);
    expect(['SAFE', 'MODERATE', 'HIGH_RISK'].includes(health.academicRiskStatus)).toBe(true);
  });

  it('7. Security: Cross-Department Access Blocks with 403 Forbidden', () => {
    expect(departmentScopeService.isWithinDepartment('dept-1', hodCE, 'HOD')).toBe(true);
    expect(departmentScopeService.isWithinDepartment('dept-2', hodCE, 'HOD')).toBe(false);

    expect(() => {
      departmentScopeService.assertDepartmentAccess('dept-2', hodCE, 'HOD');
    }).toThrow(/HTTP 403: Forbidden/);

    expect(() => {
      departmentScopeService.assertDepartmentAccess('dept-1', hodCE, 'HOD');
    }).not.toThrow();
  });

  it('8. Dynamic Department Switching: Changing HOD updates all metrics', () => {
    const kpisCE = departmentScopeService.getDepartmentDashboardKPIs(hodCE, 'HOD');
    const kpisME = departmentScopeService.getDepartmentDashboardKPIs(hodME, 'HOD');

    expect(kpisCE.totalPrograms).toBe(departmentScopeService.resolveScopeIdentity(hodCE, 'HOD').programs.length);
    expect(kpisME.totalPrograms).toBe(departmentScopeService.resolveScopeIdentity(hodME, 'HOD').programs.length);
  });

  it('9. Academic Permissions for FACULTY, MENTOR, and HOD on Session Plan and Study Material', () => {
    expect(isTabPermittedForRole('session-plan', 'FACULTY')).toBe(true);
    expect(isTabPermittedForRole('session-plan', 'MENTOR')).toBe(true);
    expect(isTabPermittedForRole('session-plan', 'HOD')).toBe(true);

    expect(isTabPermittedForRole('study-material', 'FACULTY')).toBe(true);
    expect(isTabPermittedForRole('study-material', 'MENTOR')).toBe(true);
    expect(isTabPermittedForRole('study-material', 'HOD')).toBe(true);
  });
});
