import { describe, it, expect } from 'vitest';
import { admissionLifecycleGovernanceService } from '../services/admissionLifecycleGovernanceService';
import { db } from '../services/db';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 16: Admission + Complete Student Lifecycle Engine', () => {

  const studentAContext: UserAuthorizationContext = {
    userId: 'app-001',
    userName: 'Vikram Mehta',
    email: 'vikram.mehta@gmail.com',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'app-002',
    userName: 'Other Applicant',
    email: 'other@gmail.com',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Offer Acceptance to Enrolled Student: Accepting admission offer transitions candidate to ADMITTED and creates enrolled Student', () => {
    const studentCountBefore = db.getStudents().length;
    const admissionResult = admissionLifecycleGovernanceService.acceptAdmissionOffer('ofr-001');

    expect(admissionResult.offer.status).toBe('ACCEPTED');
    expect(admissionResult.applicant.status).toBe('ADMITTED');
    expect(admissionResult.newStudentId).toBeDefined();

    const studentCountAfter = db.getStudents().length;
    expect(studentCountAfter).toBe(studentCountBefore + 1);

    const createdStudent = db.getStudents().find(s => s.id === admissionResult.newStudentId);
    expect(createdStudent).toBeDefined();
    expect(createdStudent?.name).toBe('Vikram Mehta');
  });

  it('TEST 2: Graduation to Alumni Lifecycle: Graduating student records degree completion and creates active Alumni profile', () => {
    const student = db.getStudents()[0];
    const gradResult = admissionLifecycleGovernanceService.graduateStudent({
      studentId: student.id,
      programId: student.programId || 'prog-1',
      graduationYear: 2026,
      totalCreditsEarned: 160,
      finalCgpa: 8.9,
      degreeAwarded: 'Bachelor of Technology in Computer Science & Engineering'
    });

    expect(gradResult.graduation.status).toBe('GRADUATED');
    expect(gradResult.alumni.studentId).toBe(student.id);
    expect(gradResult.alumni.graduationYear).toBe(2026);
  });

  it('TEST 3: Applicant Privacy: Applicant A can view own profile, but Applicant B cannot view Applicant A profile', () => {
    const ownProfile = admissionLifecycleGovernanceService.getApplicantById('app-001', studentAContext);
    expect(ownProfile).toBeDefined();

    const unauthorizedProfile = admissionLifecycleGovernanceService.getApplicantById('app-001', studentBContext);
    expect(unauthorizedProfile).toBeUndefined(); // Strictly blocked
  });
});
