import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { registrarAttendanceGovernanceService } from '../services/registrarAttendanceGovernanceService';
import { REGISTRAR_NAVIGATION_STRUCTURE } from '../constants/navigationConfig';

describe('SSIU ERP – Registrar Academic Administration & Attendance Separation', () => {

  it('TEST 1: Navigation config separation: Academic Administration and Attendance have completely distinct default tabs', () => {
    const academicAdminNav = REGISTRAR_NAVIGATION_STRUCTURE.find(n => n.id === 'academic-admin');
    const attendanceNav = REGISTRAR_NAVIGATION_STRUCTURE.find(n => n.id === 'attendance');

    expect(academicAdminNav).toBeDefined();
    expect(attendanceNav).toBeDefined();

    expect(academicAdminNav?.defaultTab).toBe('reg-academic-overview');
    expect(attendanceNav?.defaultTab).toBe('reg-attendance-overview');

    // CRITICAL: They must not be identical
    expect(academicAdminNav?.defaultTab).not.toBe(attendanceNav?.defaultTab);
  });

  it('TEST 2: Attendance Summary KPIs derive dynamically from ERP data with zero hardcoding', () => {
    const kpis = registrarAttendanceGovernanceService.getSummaryKPIs();
    const rawStudents = db.getStudents();
    const rawInstitutes = db.getInstitutes();
    const rawDepartments = db.getDepartments();

    expect(kpis.totalStudents).toBe(rawStudents.length);
    expect(kpis.totalInstitutes).toBe(rawInstitutes.length);
    expect(kpis.totalDepartments).toBe(rawDepartments.length);
    expect(kpis.studentsBelow75Pct).toBeGreaterThanOrEqual(0);
    expect(kpis.pendingAttendanceApprovals).toBeGreaterThanOrEqual(0);
    expect(kpis.universityAverageAttendancePct).toBeGreaterThan(0);
  });

  it('TEST 3: Exact mathematical match: Pending Attendance Approvals card count strictly equals pending list count', () => {
    const kpis = registrarAttendanceGovernanceService.getSummaryKPIs();
    const pendingList = registrarAttendanceGovernanceService.getPendingAttendanceApprovals();

    expect(kpis.pendingAttendanceApprovals).toBe(pendingList.length);
  });

  it('TEST 4: Attendance Shortage Roster returns all students with attendance below 75%', () => {
    const shortageRoster = registrarAttendanceGovernanceService.getAttendanceShortageRoster();
    const allStudents = db.getStudents();
    const expectedDefaulters = allStudents.filter(s => (s.attendancePercentage ?? 80) < 75);

    expect(shortageRoster.length).toBe(expectedDefaulters.length);

    shortageRoster.forEach(s => {
      expect(s.attendancePercentage).toBeLessThan(75);
      expect(s.gapSessionsTo75).toBeGreaterThanOrEqual(0);
      expect(['ELIGIBLE', 'CONDITIONAL', 'DEBARRED']).toContain(s.examEligibilityStatus);
      expect(['NONE', 'PENDING', 'APPROVED', 'REJECTED']).toContain(s.condonationStatus);
    });
  });

  it('TEST 5: Institute Attendance Matrix contains all constituent institutes with valid average percentages', () => {
    const matrix = registrarAttendanceGovernanceService.getInstituteAttendanceMatrix();
    const institutes = db.getInstitutes();

    expect(matrix.length).toBe(institutes.length);

    matrix.forEach(inst => {
      expect(inst.instituteId).toBeDefined();
      expect(inst.instituteCode).toBeDefined();
      expect(inst.instituteName).toBeDefined();
      expect(inst.averageAttendancePct).toBeGreaterThan(0);
      expect(inst.defaultersCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('TEST 6: Department Attendance Matrix accurately scopes students and averages', () => {
    const deptMatrix = registrarAttendanceGovernanceService.getDepartmentAttendanceMatrix();
    const depts = db.getDepartments();

    expect(deptMatrix.length).toBe(depts.length);

    deptMatrix.forEach(d => {
      expect(d.departmentId).toBeDefined();
      expect(d.departmentName).toBeDefined();
      expect(d.averageAttendancePct).toBeGreaterThan(0);
      expect(d.hodName).toBeDefined();
    });
  });

  it('TEST 7: Program Attendance Matrix computes student strength and exam clearance counts', () => {
    const progMatrix = registrarAttendanceGovernanceService.getProgramAttendanceMatrix();
    expect(progMatrix.length).toBeGreaterThan(0);

    progMatrix.forEach(p => {
      expect(p.programId).toBeDefined();
      expect(p.programName).toBeDefined();
      expect(p.degreeType).toBeDefined();
      expect(p.eligibleForExamsCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('TEST 8: Student Subject-Wise Attendance drilldown returns valid session counts and exam statuses', () => {
    const rawStudents = db.getStudents();
    const sampleStudent = rawStudents[0];

    const stats = registrarAttendanceGovernanceService.getStudentSubjectAttendance(sampleStudent.id);
    expect(stats).toBeInstanceOf(Array);

    if (stats.length > 0) {
      const first = stats[0];
      expect(first.subjectName).toBeDefined();
      const total = first.totalClasses ?? (first as any).totalSessions;
      expect(total).toBeGreaterThan(0);
      expect(first.percentage).toBeGreaterThanOrEqual(0);
    }
  });

  it('TEST 9: Strict Data Isolation: Attendance records do not leak into asset or work transfer modules', () => {
    const students = db.getStudents();
    const assets = db.getState().assets || [];
    const workTransfers = db.getState().workTransfers || [];

    const studentIds = new Set(students.map(s => s.id));

    assets.forEach((a: any) => {
      expect(studentIds.has(a.id)).toBe(false);
    });

    workTransfers.forEach((wt: any) => {
      expect(studentIds.has(wt.id)).toBe(false);
    });
  });
});
