import { describe, it, expect } from 'vitest';
import { academicOperationsService } from '../services/academicOperationsService';
import { academicStructureService } from '../services/academicStructureService';

describe('SSIU ERP – Phase 9: Attendance, Faculty Workload, Timetable & Academic Monitoring Engine', () => {

  it('TEST 1: Attendance Calculation is derived strictly from real sessions and records (not hardcoded numbers)', () => {
    const attendanceBefore = academicOperationsService.calculateStudentAttendance('stud-001', 'off-dbms-2026-sem3');
    expect(attendanceBefore.totalSessions).toBe(5);
    expect(attendanceBefore.attendedSessions).toBe(4);
    expect(attendanceBefore.percentage).toBe(80); // 4 / 5 * 100 = 80%

    // Mark a new session where student is ABSENT
    academicOperationsService.markAttendance({
      subjectOfferingId: 'off-dbms-2026-sem3',
      facultyId: 'fac-101',
      date: '2026-08-29',
      startTime: '10:00',
      endTime: '11:00',
      divisionId: 'div-cse-a',
      records: [{ studentId: 'stud-001', status: 'ABSENT' }]
    });

    const attendanceAfter = academicOperationsService.calculateStudentAttendance('stud-001', 'off-dbms-2026-sem3');
    expect(attendanceAfter.totalSessions).toBe(6);
    expect(attendanceAfter.attendedSessions).toBe(4);
    expect(attendanceAfter.percentage).toBe(67); // 4 / 6 * 100 = 66.67 -> 67%
    expect(attendanceAfter.status).toBe('WARNING');
  });

  it('TEST 2: Timetable Conflict Engine detects faculty slot overlaps on the same day', () => {
    const conflicts = academicOperationsService.detectTimetableConflicts();
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some(c => c.conflictType === 'FACULTY_OVERLAP')).toBe(true);
    expect(conflicts[0].description).toContain('Faculty fac-101 is scheduled in overlapping slots');
  });

  it('TEST 3: Cross-Module Isolation: Subject Allocation does NOT create fake Attendance or Timetable records', () => {
    const allocations = academicStructureService.getFacultyAllocations('fac-102');
    expect(allocations.length).toBe(1);
    expect(allocations[0].subjectCode).toBe('CS302');

    // fac-102 has NO attendance sessions marked in demo data
    const sessions = academicOperationsService.calculateStudentAttendance('stud-001', 'off-os-2026-sem3');
    expect(sessions.totalSessions).toBe(0); // Strictly isolated
  });

  it('TEST 4: Academic Monitoring Health Score reflects unallocated subjects and timetable conflicts', () => {
    const health = academicOperationsService.getAcademicMonitoringHealth('dept-1');
    expect(health).toBeDefined();
    expect(health.timetableConflictsCount).toBeGreaterThan(0);
    expect(health.healthScore).toBeLessThan(100);
  });
});
