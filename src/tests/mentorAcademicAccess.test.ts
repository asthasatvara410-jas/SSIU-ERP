import { describe, it, expect, beforeEach } from 'vitest';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { isTabPermittedForRole } from '../constants/navigationConfig';
import { sessionPlanService } from '../services/sessionPlanService';
import { db } from '../services/db';
import { User } from '../types';

describe('Mentor Academic Access - Session Plan & Study Material Security Suite', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const mentorUser: User = {
    id: 'fac-1',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@ssiu.edu.in',
    username: 'faculty',
    role: 'MENTOR',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const facultyUser: User = {
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

  const hodUser: User = {
    id: 'hod-1',
    name: 'Dr. Suresh Mehta (HOD)',
    email: 'hod.ce@ssiu.edu.in',
    username: 'hod',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const studentUser: User = {
    id: 'stud-1',
    name: 'Aarav Patel',
    email: 'aarav@ssiu.edu.in',
    username: 'student',
    role: 'STUDENT',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const erpCoordinatorUser: User = {
    id: 'coord-1',
    name: 'Central ERP Coordinator',
    email: 'coordinator@ssiu.edu.in',
    username: 'erp_coordinator',
    role: 'ERP_COORDINATOR',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const superAdminUser: User = {
    id: 'admin-1',
    name: 'Super Administrator',
    email: 'admin@ssiu.edu.in',
    username: 'admin',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  it('1. Navigation permission engine allows MENTOR on session-plan, study-material, and materials', () => {
    expect(isTabPermittedForRole('session-plan', 'MENTOR')).toBe(true);
    expect(isTabPermittedForRole('study-material', 'MENTOR')).toBe(true);
    expect(isTabPermittedForRole('materials', 'MENTOR')).toBe(true);
    expect(isTabPermittedForRole('mentor-session-plan', 'MENTOR')).toBe(true);
    expect(isTabPermittedForRole('mentor-study-material', 'MENTOR')).toBe(true);
  });

  it('2. Central Permission Model grants MENTOR VIEW permissions for SESSION_PLAN and STUDY_MATERIAL', () => {
    // SESSION_PLAN
    const viewSessionPlan = userAccountManagementService.evaluateAuthorization(mentorUser, 'SESSION_PLAN', 'VIEW');
    expect(viewSessionPlan.allowed).toBe(true);
    expect(can(mentorUser, 'SESSION_PLAN', 'VIEW')).toBe(true);
    expect(can(mentorUser, 'SESSION_PLAN_VIEW')).toBe(true);

    // STUDY_MATERIAL
    const viewStudyMaterial = userAccountManagementService.evaluateAuthorization(mentorUser, 'STUDY_MATERIAL', 'VIEW');
    expect(viewStudyMaterial.allowed).toBe(true);
    expect(can(mentorUser, 'STUDY_MATERIAL', 'VIEW')).toBe(true);
    expect(can(mentorUser, 'STUDY_MATERIAL_VIEW')).toBe(true);
  });

  it('3. Central Permission Model DENIES MENTOR CREATE, EDIT, and DELETE operations', () => {
    // Session Plan Create / Edit / Delete denied for default Mentor
    expect(userAccountManagementService.evaluateAuthorization(mentorUser, 'SESSION_PLAN', 'CREATE').allowed).toBe(false);
    expect(userAccountManagementService.evaluateAuthorization(mentorUser, 'SESSION_PLAN', 'EDIT').allowed).toBe(false);
    expect(userAccountManagementService.evaluateAuthorization(mentorUser, 'SESSION_PLAN', 'DELETE').allowed).toBe(false);

    // Study Material Create / Edit / Delete denied for default Mentor
    expect(userAccountManagementService.evaluateAuthorization(mentorUser, 'STUDY_MATERIAL', 'CREATE').allowed).toBe(false);
    expect(userAccountManagementService.evaluateAuthorization(mentorUser, 'STUDY_MATERIAL', 'EDIT').allowed).toBe(false);
    expect(userAccountManagementService.evaluateAuthorization(mentorUser, 'STUDY_MATERIAL', 'DELETE').allowed).toBe(false);
  });

  it('4. Central Permission Model grants FACULTY VIEW, CREATE, and EDIT permissions', () => {
    expect(can(facultyUser, 'SESSION_PLAN', 'VIEW')).toBe(true);
    expect(can(facultyUser, 'SESSION_PLAN', 'CREATE')).toBe(true);
    expect(can(facultyUser, 'SESSION_PLAN', 'EDIT')).toBe(true);

    expect(can(facultyUser, 'STUDY_MATERIAL', 'VIEW')).toBe(true);
    expect(can(facultyUser, 'STUDY_MATERIAL', 'CREATE')).toBe(true);
    expect(can(facultyUser, 'STUDY_MATERIAL', 'EDIT')).toBe(true);
  });

  it('5. Central Permission Model grants HOD comprehensive management permissions', () => {
    expect(can(hodUser, 'SESSION_PLAN', 'VIEW')).toBe(true);
    expect(can(hodUser, 'SESSION_PLAN', 'CREATE')).toBe(true);
    expect(can(hodUser, 'SESSION_PLAN', 'EDIT')).toBe(true);
    expect(can(hodUser, 'SESSION_PLAN', 'APPROVE')).toBe(true);

    expect(can(hodUser, 'STUDY_MATERIAL', 'VIEW')).toBe(true);
    expect(can(hodUser, 'STUDY_MATERIAL', 'CREATE')).toBe(true);
    expect(can(hodUser, 'STUDY_MATERIAL', 'EDIT')).toBe(true);
    expect(can(hodUser, 'STUDY_MATERIAL', 'APPROVE')).toBe(true);
  });

  it('6. Central Permission Model grants SUPER_ADMIN and ERP_COORDINATOR full bypass/permissions', () => {
    expect(can(superAdminUser, 'SESSION_PLAN', 'VIEW')).toBe(true);
    expect(can(superAdminUser, 'SESSION_PLAN', 'CREATE')).toBe(true);
    expect(can(superAdminUser, 'STUDY_MATERIAL', 'DELETE')).toBe(true);

    expect(can(erpCoordinatorUser, 'SESSION_PLAN', 'VIEW')).toBe(true);
    expect(can(erpCoordinatorUser, 'STUDY_MATERIAL', 'VIEW')).toBe(true);
  });

  it('7. Mentor getFacultySubjects returns subjects scoped to department/mentees', () => {
    const subjects = sessionPlanService.getFacultySubjects(mentorUser, 'MENTOR');
    expect(subjects.length).toBeGreaterThan(0);
    expect(subjects.every(s => s.departmentId === mentorUser.departmentId || s.departmentId === 'dept-1')).toBe(true);
  });
});
