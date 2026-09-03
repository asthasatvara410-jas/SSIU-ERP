import { describe, it, expect } from 'vitest';
import { curriculumTimetableGovernanceService } from '../services/curriculumTimetableGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 21: Academic Curriculum + Faculty Allocation + Timetable Scheduling Engine', () => {

  const facultyAContext: UserAuthorizationContext = {
    userId: 'emp-fac-101',
    userName: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const facultyBContext: UserAuthorizationContext = {
    userId: 'emp-fac-102',
    userName: 'Prof. Anjali Sharma',
    email: 'anjali.sharma@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Timetable Conflict Engine: Detects and rejects overlapping room schedules', () => {
    // Room conflict test
    expect(() => {
      curriculumTimetableGovernanceService.addTimetableSlot({
        dayOfWeek: 'MONDAY',
        startTime: '10:15',
        endTime: '11:15',
        courseCode: 'CS302',
        sectionName: 'CSE-B',
        facultyId: 'emp-fac-102',
        roomId: 'room-301' // Same room as slot-01 (10:00 - 11:00)
      });
    }).toThrow(/Room conflict/);
  });

  it('TEST 2: Timetable Conflict Engine: Detects and rejects overlapping faculty allocations', () => {
    // Faculty conflict test
    expect(() => {
      curriculumTimetableGovernanceService.addTimetableSlot({
        dayOfWeek: 'MONDAY',
        startTime: '10:30',
        endTime: '11:30',
        courseCode: 'CS302',
        sectionName: 'CSE-B',
        facultyId: 'emp-fac-101', // Same faculty as slot-01 (10:00 - 11:00)
        roomId: 'room-302'
      });
    }).toThrow(/Faculty conflict/);
  });

  it('TEST 3: Faculty Substitution: Records substitute faculty without destructive in-place allocation overwrite', () => {
    const substitution = curriculumTimetableGovernanceService.recordFacultySubstitution({
      originalFacultyId: 'emp-fac-101',
      substituteFacultyId: 'emp-fac-102',
      slotId: 'slot-01',
      sessionDate: '2026-09-01',
      reason: 'Academic Conference presentation',
      approvedByUserId: 'usr-hod-01',
      status: 'APPROVED'
    });

    expect(substitution.status).toBe('APPROVED');
    expect(substitution.originalFacultyId).toBe('emp-fac-101');
    expect(substitution.substituteFacultyId).toBe('emp-fac-102');
  });

  it('TEST 4: Faculty Privacy & Access Scoping: Faculty A can view own schedule, but Faculty B is strictly blocked', () => {
    const ownSchedule = curriculumTimetableGovernanceService.getFacultySchedule('emp-fac-101', facultyAContext);
    expect(ownSchedule).toBeDefined();
    expect(ownSchedule?.length).toBeGreaterThan(0);

    const unauthorizedSchedule = curriculumTimetableGovernanceService.getFacultySchedule('emp-fac-101', facultyBContext);
    expect(unauthorizedSchedule).toBeUndefined(); // Strictly blocked
  });
});
