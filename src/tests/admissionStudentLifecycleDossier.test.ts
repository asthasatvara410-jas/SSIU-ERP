import { describe, it, expect } from 'vitest';
import { studentLifecycleService } from '../services/studentLifecycleService';
import { db } from '../services/db';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 11: Admission, Student Lifecycle & Student 360 Dossier', () => {

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

  it('TEST 1: Applicant to Student Lifecycle: Approved Applicant converts cleanly into active Student master record', () => {
    const totalStudentsBefore = db.getStudents().length;
    const admissionResult = studentLifecycleService.admitApplicant('app-2026-001');

    expect(admissionResult.student).toBeDefined();
    expect(admissionResult.student.name).toBe('Rohan Sharma');
    expect(admissionResult.student.status).toBe('ACTIVE');
    expect(admissionResult.student.enrollmentNo).toBeDefined();

    const totalStudentsAfter = db.getStudents().length;
    expect(totalStudentsAfter).toBe(totalStudentsBefore + 1);
  });

  it('TEST 2: Student 360 Dossier aggregates attendance, academics, fees, documents and lifecycle timeline', () => {
    const student = db.getStudents()[0];
    expect(student).toBeDefined();

    const dossier = studentLifecycleService.getStudentDossier360(student.id);
    expect(dossier).toBeDefined();
    expect(dossier?.student.name).toBe(student.name);
    expect(dossier?.currentEnrollment.programName).toBeDefined();
    expect(dossier?.enrollmentHistory.length).toBeGreaterThanOrEqual(2);
    expect(dossier?.academicSummary.sgpa).toBe(8.5);
    expect(dossier?.feeSummary.status).toBe('PAID');
    expect(dossier?.timelineEvents.length).toBeGreaterThan(0);
  });

  it('TEST 3: Student Transfer: Updating student institution/department records transfer while preserving student identity', () => {
    const student = db.getStudents()[0];
    const transfer = studentLifecycleService.transferStudent({
      studentId: student.id,
      fromInstituteId: student.instituteId || 'inst-1',
      fromDepartmentId: student.departmentId || 'dept-1',
      fromProgramId: student.programId || 'prog-1',
      toInstituteId: 'inst-1',
      toDepartmentId: 'dept-2',
      toProgramId: 'prog-2',
      effectiveDate: '2026-08-28',
      reason: 'Department transfer request',
      approvedByUserId: 'usr-admin-01'
    });

    expect(transfer.status).toBe('APPROVED');
    const updatedStudent = db.getStudents().find(s => s.id === student.id);
    expect(updatedStudent?.departmentId).toBe('dept-2');
    expect(updatedStudent?.programId).toBe('prog-2');
  });

  it('TEST 4: Student Privacy: Student A can view own 360 dossier, but Student B cannot view Student A dossier', () => {
    const student = db.getStudents()[0];
    const contextA: UserAuthorizationContext = {
      userId: student.id,
      userName: student.name,
      email: student.email || 'student@ssiu.ac.in',
      activeRole: 'STUDENT',
      assignedRoles: ['STUDENT'],
      instituteId: student.instituteId || 'inst-1',
      departmentId: student.departmentId || 'dept-1'
    };

    const contextB: UserAuthorizationContext = {
      userId: 'unauthorized-other-student',
      userName: 'Other Student',
      email: 'other@student.ssiu.ac.in',
      activeRole: 'STUDENT',
      assignedRoles: ['STUDENT'],
      instituteId: 'inst-1',
      departmentId: 'dept-1'
    };

    const ownDossier = studentLifecycleService.getStudentDossier360(student.id, contextA);
    expect(ownDossier).toBeDefined();

    const unauthorizedDossier = studentLifecycleService.getStudentDossier360(student.id, contextB);
    expect(unauthorizedDossier).toBeUndefined(); // Strictly blocked
  });

});
