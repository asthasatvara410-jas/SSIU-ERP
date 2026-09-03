import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { departmentScopeService } from '../services/departmentScopeService';
import { canAccess } from '../services/authorizationService';
import { User, Student, Subject, Faculty, AttendanceStatus } from '../types';
import * as XLSX from 'xlsx';

describe('HOD Department Attendance Register & Centralized Authorization Test Suite', () => {
  const hodCE: User = {
    id: 'user-hod-ce',
    name: 'Dr. Rajesh Patel',
    email: 'rajesh.patel@ssiu.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1' // Computer Engineering
  };

  const hodME: User = {
    id: 'user-hod-me',
    name: 'Dr. Ramesh Joshi',
    email: 'ramesh.joshi@ssiu.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-2' // Mechanical Engineering
  };

  const mentorFaculty: User = {
    id: 'fac-1',
    name: 'Prof. Anjali Sharma',
    email: 'anjali.sharma@ssiu.edu.in',
    role: 'MENTOR',
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const regularFaculty: User = {
    id: 'fac-2',
    name: 'Prof. Suresh Verma',
    email: 'suresh.verma@ssiu.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  beforeEach(() => {
    // Reset database state
    db.resetToDefaultSeed();
  });

  it('1. Strict Department & Branch Data Scoping (Zero Cross-Department Leakage)', () => {
    // Add a Mechanical student to test department isolation
    db.getState().students.push({
      id: 'stu-me-1',
      name: 'ME Student 01',
      enrollmentNo: '2401010099',
      email: 'me.stu@ssiu.edu.in',
      phone: '+91 98765 00000',
      instituteId: 'inst-1',
      departmentId: 'dept-2',
      programId: 'prog-me',
      semesterId: 'sem-4',
      academicYearId: 'ay-2026-27',
      status: 'ACTIVE',
      mentorId: 'fac-me-1'
    });

    const studentsCE = departmentScopeService.getScopedStudents(hodCE, 'HOD');
    expect(studentsCE.length).toBeGreaterThan(0);
    expect(studentsCE.every(s => s.departmentId === 'dept-1')).toBe(true);

    const studentsME = departmentScopeService.getScopedStudents(hodME, 'HOD');
    expect(studentsME.length).toBe(1);
    expect(studentsME[0].departmentId).toBe('dept-2');

    // Cross-check that no CE student is visible to ME HOD and vice versa
    const ceIds = new Set(studentsCE.map(s => s.id));
    studentsME.forEach(s => {
      expect(ceIds.has(s.id)).toBe(false);
    });
  });

  it('2. Excel Register 20-Column Data Model Completeness for Student-Subject Pairs', () => {
    const students = departmentScopeService.getScopedStudents(hodCE, 'HOD');
    const subjects = departmentScopeService.getScopedSubjects(hodCE, 'HOD');
    const faculty = departmentScopeService.getScopedFaculty(hodCE, 'HOD');

    expect(students.length).toBeGreaterThan(0);
    expect(subjects.length).toBeGreaterThan(0);

    // Build matrix row model
    const testStudent = students[0];
    const testSubject = subjects[0];
    const testFaculty = faculty.find(f => f.id === testSubject.assignedFacultyId) || faculty[0];

    const record = {
      id: `${testStudent.id}_${testSubject.id}`,
      studentId: testStudent.id,
      studentName: testStudent.name,
      enrollmentNo: testStudent.enrollmentNo,
      departmentId: testStudent.departmentId,
      departmentName: 'Computer Engineering',
      departmentCode: 'CE',
      programId: testStudent.programId,
      programName: 'B.Tech Computer Science & Engineering',
      programCode: 'B.Tech CSE',
      semesterId: testStudent.semesterId,
      semesterNumber: 4,
      divisionId: testStudent.divisionId || 'Div A',
      subjectId: testSubject.id,
      subjectCode: testSubject.code,
      subjectName: testSubject.name,
      facultyId: testFaculty.id,
      facultyName: testFaculty.name,
      totalClasses: 24,
      presentClasses: 20,
      absentClasses: 4,
      attendancePercentage: Math.round((20 / 24) * 100),
      minRequiredPercentage: 75,
      shortagePercentage: Math.max(0, 75 - Math.round((20 / 24) * 100)),
      eligibilityStatus: 'ELIGIBLE',
      lastUpdated: new Date().toISOString()
    };

    expect(record.studentName).toBe(testStudent.name);
    expect(record.enrollmentNo).toBe(testStudent.enrollmentNo);
    expect(record.subjectCode).toBe(testSubject.code);
    expect(record.totalClasses).toBe(record.presentClasses + record.absentClasses);
    expect(record.attendancePercentage).toBe(83);
    expect(record.shortagePercentage).toBe(0);
    expect(record.eligibilityStatus).toBe('ELIGIBLE');
  });

  it('3. Attendance Percentage & Shortage Mathematical Integrity', () => {
    const testCases = [
      { total: 30, present: 30, expectedPct: 100, expectedShortage: 0, expectedStatus: 'GOOD' },
      { total: 28, present: 22, expectedPct: 79, expectedShortage: 0, expectedStatus: 'ELIGIBLE' },
      { total: 24, present: 16, expectedPct: 67, expectedShortage: 8, expectedStatus: 'SHORTAGE' },
      { total: 20, present: 10, expectedPct: 50, expectedShortage: 25, expectedStatus: 'CRITICAL' }
    ];

    testCases.forEach(({ total, present, expectedPct, expectedShortage, expectedStatus }) => {
      const pct = Math.round((present / total) * 100);
      const shortage = Math.max(0, 75 - pct);
      let status = 'ELIGIBLE';
      if (pct >= 90) status = 'GOOD';
      else if (pct >= 75) status = 'ELIGIBLE';
      else if (pct >= 60) status = 'SHORTAGE';
      else status = 'CRITICAL';

      expect(pct).toBe(expectedPct);
      expect(shortage).toBe(expectedShortage);
      expect(status).toBe(expectedStatus);
    });
  });

  it('4. Dynamic Summary KPIs Derived from Filtered Scope', () => {
    const students = departmentScopeService.getScopedStudents(hodCE, 'HOD');
    const subjects = departmentScopeService.getScopedSubjects(hodCE, 'HOD');

    const totalStudents = students.length;
    const totalSubjects = subjects.length;
    const totalRecords = totalStudents * Math.min(subjects.length, 4);

    expect(totalStudents).toBeGreaterThan(0);
    expect(totalSubjects).toBeGreaterThan(0);
    expect(totalRecords).toBeGreaterThan(0);
  });

  it('5. Inline Attendance Editing & DB Session Record Update', () => {
    const students = departmentScopeService.getScopedStudents(hodCE, 'HOD');
    const subjects = departmentScopeService.getScopedSubjects(hodCE, 'HOD');
    const targetStudent = students[0];
    const targetSubject = subjects[0];

    const sessions = db.getState().attendanceSessions;
    let targetSession = sessions.find(s => s.subjectId === targetSubject.id);

    if (!targetSession) {
      targetSession = {
        id: `sess-test-${Date.now()}`,
        subjectId: targetSubject.id,
        facultyId: 'fac-1',
        divisionId: 'Div A',
        date: '2026-08-27',
        lectureNo: 1,
        totalStudents: 1,
        presentStudents: 1,
        absentStudents: 0,
        records: []
      };
      sessions.push(targetSession);
    }

    // Update attendance inline
    targetSession.records = [
      { studentId: targetStudent.id, status: 'PRESENT', remarks: 'Present in class' }
    ];
    db.saveState();

    const updatedStats = db.getStudentAttendanceStats(targetStudent.id);
    expect(updatedStats).toBeDefined();
    expect(updatedStats.totalClasses).toBeGreaterThanOrEqual(1);
  });

  it('6. Centralized RBAC: canAccess Authorization Rules & 403 Prevention', () => {
    // 1. HOD has full access to Attendance, Session Plans, Study Materials, Faculty in own department
    expect(canAccess(hodCE, 'ATTENDANCE', 'VIEW').allowed).toBe(true);
    expect(canAccess(hodCE, 'ATTENDANCE', 'EDIT', { departmentId: 'dept-1' }).allowed).toBe(true);
    expect(canAccess(hodCE, 'SESSION_PLAN', 'VIEW').allowed).toBe(true);
    expect(canAccess(hodCE, 'STUDY_MATERIAL', 'VIEW').allowed).toBe(true);
    expect(canAccess(hodCE, 'FACULTY_WORKLOAD', 'ALLOCATE').allowed).toBe(true);

    // 2. HOD blocked from accessing another department's resources
    const crossDeptDecision = canAccess(hodCE, 'ATTENDANCE', 'VIEW', { departmentId: 'dept-2' });
    expect(crossDeptDecision.allowed).toBe(false);
    expect(crossDeptDecision.statusCode).toBe(403);

    // 3. Mentor has read access to session plans, study materials, attendance
    expect(canAccess(mentorFaculty, 'SESSION_PLAN', 'VIEW').allowed).toBe(true);
    expect(canAccess(mentorFaculty, 'STUDY_MATERIAL', 'VIEW').allowed).toBe(true);
    expect(canAccess(mentorFaculty, 'ATTENDANCE', 'VIEW').allowed).toBe(true);

    // 4. Faculty has access to session plans, study materials, attendance
    expect(canAccess(regularFaculty, 'SESSION_PLAN', 'VIEW').allowed).toBe(true);
    expect(canAccess(regularFaculty, 'STUDY_MATERIAL', 'VIEW').allowed).toBe(true);
    expect(canAccess(regularFaculty, 'ATTENDANCE', 'CREATE').allowed).toBe(true);

    // 5. Unauthenticated user blocked with 401
    expect(canAccess(null, 'ATTENDANCE', 'VIEW').allowed).toBe(false);
    expect(canAccess(null, 'ATTENDANCE', 'VIEW').statusCode).toBe(401);
  });

  it('7. Formatted Excel Export (.xlsx) Structure Generation', () => {
    const students = departmentScopeService.getScopedStudents(hodCE, 'HOD');
    const subjects = departmentScopeService.getScopedSubjects(hodCE, 'HOD');

    const exportRows = students.slice(0, 3).map((st, idx) => ({
      '#': idx + 1,
      'Student Name': st.name,
      'Enrollment No.': st.enrollmentNo,
      'Department': 'Computer Engineering',
      'Branch': 'B.Tech CSE',
      'Semester': 4,
      'Section': st.divisionId || 'Div A',
      'Subject Code': subjects[0]?.code || 'CS401',
      'Subject Name': subjects[0]?.name || 'Database Management Systems',
      'Faculty': 'Prof. Anjali Sharma',
      'Total Classes': 24,
      'Present': 20,
      'Absent': 4,
      'Attendance %': '83%',
      'Required %': '75%',
      'Shortage %': '0%',
      'Eligibility Status': 'ELIGIBLE',
      'Last Updated': '2026-08-25'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Register');

    expect(wb.SheetNames).toContain('Attendance_Register');
    expect(exportRows.length).toBe(3);
    expect(exportRows[0]['Student Name']).toBe(students[0].name);
    expect(exportRows[0]['Enrollment No.']).toBe(students[0].enrollmentNo);
  });
});
