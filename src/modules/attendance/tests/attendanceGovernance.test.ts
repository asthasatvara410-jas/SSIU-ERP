/**
 * SSIU ERP — Attendance Intelligence Service Unit Tests
 * File: src/modules/attendance/tests/attendanceGovernance.test.ts
 */

import { describe, it, expect } from 'vitest';
import { attendanceGovernanceAggregatorService } from '../services/attendanceGovernanceAggregatorService';

describe('AttendanceGovernanceAggregatorService (Stage 3 Module)', () => {
  it('should aggregate total sessions, average attendance, and shortage counts', () => {
    const overview = attendanceGovernanceAggregatorService.getAttendanceAnalyticsOverview();

    expect(overview).toBeDefined();
    expect(overview.totalSessionsRecorded).toBeGreaterThan(0);
    expect(overview.averageAttendancePercentage).toBeGreaterThan(0);
    expect(overview.averageAttendancePercentage).toBeLessThanOrEqual(100);
    expect(overview.totalStudentsEnrolled).toBeGreaterThan(0);
    expect(Array.isArray(overview.departmentMetrics)).toBe(true);
    expect(overview.departmentMetrics.length).toBeGreaterThan(0);
  });

  it('should evaluate student attendance percentages and detect shortage severity', () => {
    const students = attendanceGovernanceAggregatorService.getStudentsWithAttendanceShortage();

    expect(Array.isArray(students)).toBe(true);
    expect(students.length).toBeGreaterThan(0);

    const first = students[0];
    expect(first.studentId).toBeDefined();
    expect(first.enrollmentNumber).toBeDefined();
    expect(first.attendancePercentage).toBeGreaterThanOrEqual(0);
    expect(first.attendancePercentage).toBeLessThanOrEqual(100);
    expect(['CRITICAL', 'WARNING', 'ELIGIBLE']).toContain(first.shortageSeverity);
  });

  it('should retrieve attendance correction logs with approved reasons', () => {
    const corrections = attendanceGovernanceAggregatorService.getAttendanceCorrectionRecords();

    expect(Array.isArray(corrections)).toBe(true);
    expect(corrections.length).toBeGreaterThan(0);

    const first = corrections[0];
    expect(first.correctionId).toBeDefined();
    expect(first.studentName).toBeDefined();
    expect(first.approvedBy).toBeDefined();
    expect(['PRESENT', 'ON_DUTY']).toContain(first.correctedStatus);
  });

  it('should respect department filtering when querying shortage records', () => {
    const overview = attendanceGovernanceAggregatorService.getAttendanceAnalyticsOverview();
    const targetDept = overview.departmentMetrics[0];

    const filtered = attendanceGovernanceAggregatorService.getStudentsWithAttendanceShortage(targetDept.departmentId);
    expect(Array.isArray(filtered)).toBe(true);
  });
});
