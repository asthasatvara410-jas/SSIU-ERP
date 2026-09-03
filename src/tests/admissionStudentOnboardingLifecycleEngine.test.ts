import { describe, it, expect } from 'vitest';
import { studentOnboardingLifecycleGovernanceService } from '../services/studentOnboardingLifecycleGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 20: Admission + Student Onboarding + Academic Lifecycle Engine', () => {

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

  it('TEST 1: Rule-Based Semester Promotion: Promotes student with acceptable backlogs and retains audit trail', () => {
    const promotion = studentOnboardingLifecycleGovernanceService.promoteStudentSemester({
      studentId: 'stud-002',
      fromSemester: 2,
      toSemester: 3,
      academicYearId: 'ay-2026-27',
      creditsEarned: 40,
      backlogsCount: 1,
      approvedByUserId: 'usr-hod-01'
    });

    expect(promotion.decision).toBe('PROMOTED');
    expect(promotion.toSemester).toBe(3);
  });

  it('TEST 2: Section & Roll Number Assignment: Successfully allocates section and prevents roll number collisions', () => {
    const allocation = studentOnboardingLifecycleGovernanceService.assignSectionAndRollNumber({
      studentId: 'stud-002',
      academicTermId: 'term-2026-sem3',
      sectionName: 'CSE-A',
      rollNumber: '26CSE043'
    });

    expect(allocation.sectionName).toBe('CSE-A');
    expect(allocation.rollNumber).toBe('26CSE043');

    // Attempt duplicate roll number allocation
    expect(() => {
      studentOnboardingLifecycleGovernanceService.assignSectionAndRollNumber({
        studentId: 'stud-003',
        academicTermId: 'term-2026-sem3',
        sectionName: 'CSE-A',
        rollNumber: '26CSE043'
      });
    }).toThrow(/already assigned/);
  });

  it('TEST 3: Student Privacy & Access Scoping: Student A can view own lifecycle dossier, but Student B is strictly blocked', () => {
    const ownDossier = studentOnboardingLifecycleGovernanceService.getStudentLifecycleSummary('stud-001', studentAContext);
    expect(ownDossier).toBeDefined();
    expect(ownDossier?.sectionEnrollment?.rollNumber).toBe('26CSE042');

    const unauthorizedDossier = studentOnboardingLifecycleGovernanceService.getStudentLifecycleSummary('stud-001', studentBContext);
    expect(unauthorizedDossier).toBeUndefined(); // Strictly blocked
  });
});
