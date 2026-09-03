import { describe, it, expect } from 'vitest';
import { attendanceAcademicAssessmentLifecycleService } from '../services/attendanceAcademicAssessmentLifecycleService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 39: Attendance & Academic Assessment Management Engine', () => {

  it('TEST 1: Dynamic Attendance Derivation & Short Attendance Flagging: Computes attendance % and condonation flags', () => {
    // 34 attended + 2 excused out of 40 conducted = 36/40 = 90% -> ELIGIBLE
    const attEligible = attendanceAcademicAssessmentLifecycleService.calculateStudentCourseAttendance({
      studentId: 'stud-001',
      courseCode: 'CS-301',
      totalClassesConducted: 40,
      classesAttended: 34,
      classesExcused: 2
    });
    expect(attEligible.attendancePercentage).toBe(90);
    expect(attEligible.isShortAttendance).toBe(false);
    expect(attEligible.eligibilityStatus).toBe('ELIGIBLE');

    // 28 attended out of 40 conducted = 28/40 = 70% -> CONDONATION_REQUIRED
    const attCondonation = attendanceAcademicAssessmentLifecycleService.calculateStudentCourseAttendance({
      studentId: 'stud-002',
      courseCode: 'CS-301',
      totalClassesConducted: 40,
      classesAttended: 28
    });
    expect(attCondonation.attendancePercentage).toBe(70);
    expect(attCondonation.isShortAttendance).toBe(true);
    expect(attCondonation.eligibilityStatus).toBe('CONDONATION_REQUIRED');

    // 22 attended out of 40 conducted = 22/40 = 55% -> SHORT
    const attShort = attendanceAcademicAssessmentLifecycleService.calculateStudentCourseAttendance({
      studentId: 'stud-003',
      courseCode: 'CS-301',
      totalClassesConducted: 40,
      classesAttended: 22
    });
    expect(attShort.attendancePercentage).toBe(55);
    expect(attShort.isShortAttendance).toBe(true);
    expect(attShort.eligibilityStatus).toBe('SHORT');
  });

  it('TEST 2: Continuous Internal Assessment Weightage Calculation: Computes multi-component internal marks accurately', () => {
    // Midterm: 44/50 * 50% = 44
    // Asg 1: 18/20 * 25% = 22.5
    // Quiz 1: 16/20 * 25% = 20
    // Total = 44 + 22.5 + 20 = 86.5%
    const score = attendanceAcademicAssessmentLifecycleService.calculateContinuousInternalScore('stud-001', 'CS-301');
    expect(score.totalInternalMarks).toBe(86.5);
    expect(score.percentage).toBe(86.5);
  });

  it('TEST 3: Timetable Conflict Interception: Blocks faculty, room, and section double booking', () => {
    const existing = [
      { facultyId: 'fac-01', roomCode: 'LH-101', sectionName: 'A', dayOfWeek: 'Monday', periodNumber: 1 }
    ];

    // Faculty conflict
    const facultyConflict = attendanceAcademicAssessmentLifecycleService.validateTimetableSlot({
      facultyId: 'fac-01',
      roomCode: 'LH-102',
      sectionName: 'B',
      dayOfWeek: 'Monday',
      periodNumber: 1,
      existingSchedule: existing
    });
    expect(facultyConflict.isValid).toBe(false);
    expect(facultyConflict.conflictReason).toContain('Faculty double-booking');

    // Room conflict
    const roomConflict = attendanceAcademicAssessmentLifecycleService.validateTimetableSlot({
      facultyId: 'fac-02',
      roomCode: 'LH-101',
      sectionName: 'B',
      dayOfWeek: 'Monday',
      periodNumber: 1,
      existingSchedule: existing
    });
    expect(roomConflict.isValid).toBe(false);
    expect(roomConflict.conflictReason).toContain('Room double-booking');

    // Section conflict
    const sectionConflict = attendanceAcademicAssessmentLifecycleService.validateTimetableSlot({
      facultyId: 'fac-02',
      roomCode: 'LH-102',
      sectionName: 'A',
      dayOfWeek: 'Monday',
      periodNumber: 1,
      existingSchedule: existing
    });
    expect(sectionConflict.isValid).toBe(false);
    expect(sectionConflict.conflictReason).toContain('Section A already has a scheduled class');

    // Valid conflict-free slot
    const validSlot = attendanceAcademicAssessmentLifecycleService.validateTimetableSlot({
      facultyId: 'fac-02',
      roomCode: 'LH-102',
      sectionName: 'B',
      dayOfWeek: 'Monday',
      periodNumber: 1,
      existingSchedule: existing
    });
    expect(validSlot.isValid).toBe(true);
  });
});
