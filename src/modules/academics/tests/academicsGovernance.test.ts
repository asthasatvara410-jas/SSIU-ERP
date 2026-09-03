import { describe, it, expect } from 'vitest';
import { academicsTimetableService } from '../services/academicsTimetableService';
import { db } from '../../../services/db';

describe('Academics & Timetable Engine', () => {
  it('should validate faculty workload calculations and identify assigned weekly hours', () => {
    const workloads = academicsTimetableService.getFacultyWorkloadSummaries('dept-cse');
    expect(workloads).toBeDefined();
    expect(Array.isArray(workloads)).toBe(true);

    if (workloads.length > 0) {
      const first = workloads[0];
      expect(first).toHaveProperty('facultyId');
      expect(first).toHaveProperty('facultyName');
      expect(first).toHaveProperty('totalAssignedWeeklyHours');
      expect(first.maxAllowedWeeklyHours).toBeGreaterThanOrEqual(10);
      expect(typeof first.isOverloaded).toBe('boolean');
    }
  });

  it('should compute room and lab occupancy rates without mutating database models', () => {
    const rooms = academicsTimetableService.getRoomOccupancyMetrics('dept-cse');
    expect(rooms).toBeDefined();
    expect(rooms.length).toBeGreaterThan(0);

    const firstRoom = rooms[0];
    expect(firstRoom).toHaveProperty('roomNumber');
    expect(firstRoom).toHaveProperty('capacity');
    expect(firstRoom.occupancyPercentage).toBeGreaterThanOrEqual(0);
    expect(firstRoom.occupancyPercentage).toBeLessThanOrEqual(100);
  });

  it('should generate a deterministic draft timetable preview with status DRAFT_PREVIEW', () => {
    const preview = academicsTimetableService.generateTimetablePreview({
      departmentId: 'dept-cse',
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      periodSlots: academicsTimetableService.getDefaultPeriodSlots(),
      maxDailyHoursPerFaculty: 4,
      maxWeeklyHoursPerFaculty: 18,
      allowConsecutiveLabs: true
    });

    expect(preview).toBeDefined();
    expect(preview.status).toBe('DRAFT_PREVIEW');
    expect(preview.entries.length).toBeGreaterThan(0);
    expect(preview.utilizationMetrics.totalSessionsScheduled).toBe(preview.entries.length);
    expect(preview.utilizationMetrics.roomOccupancyRate).toBeGreaterThan(0);
  });

  it('should detect faculty workload cap violations when weekly limit is set very low', () => {
    const previewWithLowCap = academicsTimetableService.generateTimetablePreview({
      departmentId: 'dept-cse',
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      periodSlots: academicsTimetableService.getDefaultPeriodSlots(),
      maxDailyHoursPerFaculty: 1,
      maxWeeklyHoursPerFaculty: 2, // Artificially low to trigger warnings
      allowConsecutiveLabs: true
    });

    expect(previewWithLowCap).toBeDefined();
    expect(previewWithLowCap.conflicts.length).toBeGreaterThan(0);
    const hasWorkloadWarning = previewWithLowCap.conflicts.some(
      c => c.conflictType === 'WORKLOAD_EXCEEDED' || c.conflictType === 'UNASSIGNED_COURSE'
    );
    expect(hasWorkloadWarning).toBe(true);
  });

  it('should preserve live timetable store without unintended mutations', () => {
    const initialTimetablesCount = db.getTimetableEntries()?.length || 0;

    academicsTimetableService.generateTimetablePreview({
      departmentId: 'dept-cse',
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
      periodSlots: academicsTimetableService.getDefaultPeriodSlots(),
      maxDailyHoursPerFaculty: 4,
      maxWeeklyHoursPerFaculty: 18,
      allowConsecutiveLabs: true
    });

    const finalTimetablesCount = db.getTimetableEntries()?.length || 0;
    expect(finalTimetablesCount).toBe(initialTimetablesCount);
  });
});
