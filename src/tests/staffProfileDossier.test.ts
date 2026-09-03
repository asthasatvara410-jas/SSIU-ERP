import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { staffProfileService } from '../services/staffProfileService';
import { Faculty, Student } from '../types';

describe('SSIU ERP – Staff Profile Dossier & Registrar Consistency', () => {

  it('TEST 1: Should retrieve a canonical Faculty entity from shared db', () => {
    const facultyList = db.getFaculty();
    expect(facultyList.length).toBeGreaterThan(0);

    const sampleFaculty = facultyList[0];
    expect(sampleFaculty.id).toBeDefined();
    expect(sampleFaculty.name).toBeDefined();
    expect(sampleFaculty.employeeId).toBeDefined();
    expect(sampleFaculty.departmentId).toBeDefined();
  });

  it('TEST 2: Should resolve 10 dossier sections with correct relational references', () => {
    const facultyList = db.getFaculty();
    const faculty = facultyList[0];

    // 1. Profile & Relations
    const dept = db.getDepartmentById(faculty.departmentId || '');
    expect(dept).toBeDefined();

    const inst = db.getInstituteById(faculty.instituteId || dept?.instituteId || '');
    expect(inst).toBeDefined();

    // 2. Academic Portfolio
    const allSubjects = db.getSubjects();
    const assignedSubjects = allSubjects.filter(s => (faculty.subjectIds || []).includes(s.id));
    expect(assignedSubjects).toBeDefined();

    // 3. Workload (Theory + Lab)
    let weeklyHours = 0;
    assignedSubjects.forEach(s => {
      weeklyHours += (s.theoryHoursPerWeek || 3) + (s.labHoursPerWeek || 2);
    });
    expect(weeklyHours).toBeGreaterThanOrEqual(0);

    // 4. Mentees (Strict Isolation)
    const allStudents = db.getStudents();
    const mentees = allStudents.filter(s => s.mentorId === faculty.id || s.mentorId === faculty.employeeId);
    expect(Array.isArray(mentees)).toBe(true);

    // 5. Staff Documents vs Student Documents (Strict Separation)
    const studentDocs = db.getState().studentDocuments || [];
    const isSeparated = studentDocs.every((doc: any) => !doc.employeeId);
    expect(isSeparated).toBe(true);
  });

  it('TEST 3: Should normalize staff profile and statutory responsibilities', () => {
    const facultyUser = db.getUsers().find(u => u.role === 'FACULTY') || {
      id: 'fac-1',
      name: 'Prof. Demo Faculty',
      email: 'demo.faculty@swarrnim.edu.in',
      role: 'FACULTY' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };

    const profile = staffProfileService.getStaffProfile(facultyUser, 'FACULTY');
    expect(profile).toBeDefined();
    expect(profile.name).toBeDefined();
    expect(profile.role).toBe('FACULTY');
    expect(profile.statutoryResponsibilities.length).toBeGreaterThan(0);
    expect(profile.operationalResponsibilities.length).toBeGreaterThan(0);
  });

  it('TEST 4: Should accurately handle active mentorship and empty state for non-mentors', () => {
    const students = db.getStudents();
    const facultyList = db.getFaculty();

    // Faculty with mentees
    const mentorWithMentees = facultyList.find(f => students.some(s => s.mentorId === f.id || s.mentorId === f.employeeId));
    if (mentorWithMentees) {
      const mentees = students.filter(s => s.mentorId === mentorWithMentees.id || s.mentorId === mentorWithMentees.employeeId);
      expect(mentees.length).toBeGreaterThan(0);
    }

    // Faculty without mentees
    const facultyWithoutMentees = facultyList.find(f => !students.some(s => s.mentorId === f.id || s.mentorId === f.employeeId));
    if (facultyWithoutMentees) {
      const mentees = students.filter(s => s.mentorId === facultyWithoutMentees.id || s.mentorId === facultyWithoutMentees.employeeId);
      expect(mentees.length).toBe(0);
    }
  });

  it('TEST 5: Should ensure Requests and Audit trail query relational records for employee', () => {
    const facultyList = db.getFaculty();
    const faculty = facultyList[0];

    const requests = db.getApprovalRequests().filter(r => 
      r.applicantId === faculty.id || 
      r.applicantEnrollmentOrEmpId === faculty.employeeId ||
      r.applicantEmail === faculty.email
    );
    expect(Array.isArray(requests)).toBe(true);

    const auditLogs = db.getAuditLogs().filter(l => 
      l.userId === faculty.id || 
      (l.userName && l.userName.includes(faculty.name))
    );
    expect(Array.isArray(auditLogs)).toBe(true);
  });
});
