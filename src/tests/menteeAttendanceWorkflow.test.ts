import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { mentorBackendService } from '../services/mentorBackendService';
import { mentorAssignmentService } from '../services/mentorAssignmentService';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { User, Student } from '../types';

describe('Mentee Attendance Module - Comprehensive Backend, Calculation & Security Suite', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const mentorA: User = {
    id: 'fac-1',
    name: 'Dr. Rajesh Sharma (Mentor A)',
    email: 'rajesh.sharma@ssiu.edu.in',
    username: 'faculty',
    role: 'MENTOR',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const mentorB: User = {
    id: 'fac-2',
    name: 'Prof. Anjali Patel (Mentor B)',
    email: 'anjali.patel@ssiu.edu.in',
    username: 'faculty2',
    role: 'MENTOR',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const hodUser: User = {
    id: 'hod-1',
    name: 'Dr. Suresh Mehta (HOD)',
    email: 'hod.ce@ssiu.edu.in',
    username: 'hod',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const unauthorizedStudentUser: User = {
    id: 'stud-1',
    name: 'Student User',
    email: 'student@ssiu.edu.in',
    username: 'student',
    role: 'STUDENT',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  it('1. Strict Mentee Attendance Scoping (Mentor A vs Mentor B isolation)', () => {
    // Mentor A should see only their assigned mentees in attendance table
    const mentorARows = mentorBackendService.getMenteeAttendanceTable(mentorA);
    const mentorAStudentIds = new Set(mentorARows.map(r => r.studentId));

    expect(mentorAStudentIds.has('stu-1')).toBe(true);
    expect(mentorAStudentIds.has('stu-2')).toBe(true);
    expect(mentorAStudentIds.has('stu-3')).toBe(false);
    expect(mentorAStudentIds.has('stu-4')).toBe(false);

    // Mentor B should see only their assigned mentees
    const mentorBRows = mentorBackendService.getMenteeAttendanceTable(mentorB);
    const mentorBStudentIds = new Set(mentorBRows.map(r => r.studentId));

    expect(mentorBStudentIds.has('stu-3')).toBe(true);
    expect(mentorBStudentIds.has('stu-4')).toBe(true);
    expect(mentorBStudentIds.has('stu-1')).toBe(false);
    expect(mentorBStudentIds.has('stu-2')).toBe(false);
  });

  it('2. Accurate Dynamic Attendance % and Absent Calculation (No hardcoded values)', () => {
    const mentorARows = mentorBackendService.getMenteeAttendanceTable(mentorA);
    const stu1Cumulative = mentorARows.find(r => r.studentId === 'stu-1' && r.subjectId === 'ALL');
    
    expect(stu1Cumulative).toBeDefined();
    if (stu1Cumulative) {
      // Formula verification: Total = Present + Absent
      expect(stu1Cumulative.totalSessions).toBe(stu1Cumulative.presentSessions + stu1Cumulative.absentSessions);
      
      // Attendance % = (Present / Total) * 100
      const calculatedPct = stu1Cumulative.totalSessions > 0 
        ? Math.round((stu1Cumulative.presentSessions / stu1Cumulative.totalSessions) * 100)
        : 100;
      expect(stu1Cumulative.attendancePercentage).toBe(calculatedPct);

      // Required percentage from policy (75%)
      expect(stu1Cumulative.requiredPercentage).toBe(75);

      // Eligibility status
      if (stu1Cumulative.attendancePercentage >= 75) {
        expect(stu1Cumulative.eligibilityStatus).toBe('ELIGIBLE');
      } else if (stu1Cumulative.attendancePercentage >= 65) {
        expect(stu1Cumulative.eligibilityStatus).toBe('CONDITIONAL');
      } else {
        expect(stu1Cumulative.eligibilityStatus).toBe('NOT_ELIGIBLE');
      }

      // Risk status
      if (stu1Cumulative.attendancePercentage >= 85) {
        expect(stu1Cumulative.riskStatus).toBe('NORMAL');
      } else if (stu1Cumulative.attendancePercentage >= 75) {
        expect(stu1Cumulative.riskStatus).toBe('WARNING');
      } else {
        expect(stu1Cumulative.riskStatus).toBe('CRITICAL');
      }
    }
  });

  it('3. Session-Wise Attendance Log drill-down & security validation', () => {
    // Mentor A accessing assigned stu-1 succeeds
    const sessionDetails = mentorBackendService.getMenteeAttendanceSessionDetails(mentorA, 'stu-1');
    expect(sessionDetails.student.id).toBe('stu-1');
    expect(sessionDetails.summary).toBeDefined();
    expect(sessionDetails.sessions.length).toBeGreaterThan(0);

    const firstSession = sessionDetails.sessions[0];
    expect(firstSession.date).toBeDefined();
    expect(firstSession.subjectName).toBeDefined();
    expect(firstSession.status).toBeDefined();

    // Mentor A attempting to view session logs for Mentor B's student (stu-3) is blocked with 403
    expect(() => {
      mentorBackendService.getMenteeAttendanceSessionDetails(mentorA, 'stu-3');
    }).toThrow(/403 Forbidden/);
  });

  it('4. Raise Attendance Concern workflow and audit trail', () => {
    const concernRecord = mentorBackendService.raiseAttendanceConcern(mentorA, {
      studentId: 'stu-1',
      concernCategory: 'ATTENDANCE_SHORTAGE',
      remarks: 'Student missed 3 consecutive Data Structures lectures.',
      actionRequested: 'SCHEDULE_COUNSELING',
      notifyHOD: true,
      notifyParents: true
    });

    expect(concernRecord.id).toBeDefined();
    expect(concernRecord.studentId).toBe('stu-1');
    expect(concernRecord.category).toBe('ATTENDANCE');
    expect(concernRecord.topic).toContain('Attendance Concern');

    // Attempting to raise concern for unassigned mentee (stu-4) is blocked with 403
    expect(() => {
      mentorBackendService.raiseAttendanceConcern(mentorA, {
        studentId: 'stu-4',
        concernCategory: 'ATTENDANCE_SHORTAGE',
        remarks: 'Tampered attempt',
        actionRequested: 'SCHEDULE_COUNSELING'
      });
    }).toThrow(/403 Forbidden/);
  });

  it('5. Dynamic HOD Reassignment Synchronization (Old mentor loses access, new mentor gains access)', () => {
    // Initial State: stu-1 is assigned to Mentor A (fac-1)
    let mentorARows = mentorBackendService.getMenteeAttendanceTable(mentorA);
    let mentorBRows = mentorBackendService.getMenteeAttendanceTable(mentorB);
    expect(mentorARows.some(r => r.studentId === 'stu-1')).toBe(true);
    expect(mentorBRows.some(r => r.studentId === 'stu-1')).toBe(false);

    // HOD Reassigns stu-1 from Mentor A (fac-1) to Mentor B (fac-2)
    mentorAssignmentService.assignMentor({
      studentId: 'stu-1',
      mentorFacultyId: 'fac-2',
      changeReason: 'Academic load re-balancing by Department HOD',
      isChange: true,
      effectiveFrom: '2026-08-27'
    }, hodUser);

    // Updated State: Mentor A no longer sees stu-1; Mentor B now sees stu-1
    mentorARows = mentorBackendService.getMenteeAttendanceTable(mentorA);
    mentorBRows = mentorBackendService.getMenteeAttendanceTable(mentorB);

    expect(mentorARows.some(r => r.studentId === 'stu-1')).toBe(false);
    expect(mentorBRows.some(r => r.studentId === 'stu-1')).toBe(true);

    // Security guard: Mentor A accessing stu-1 now throws 403 Forbidden
    expect(() => {
      mentorBackendService.getMenteeAttendanceSessionDetails(mentorA, 'stu-1');
    }).toThrow(/403 Forbidden/);

    // Mentor B can now access stu-1 session details
    const bDetails = mentorBackendService.getMenteeAttendanceSessionDetails(mentorB, 'stu-1');
    expect(bDetails.student.id).toBe('stu-1');
  });

  it('6. Filter query parameters actually filter dataset correctly', () => {
    // Filter by subject
    const subjectFiltered = mentorBackendService.getMenteeAttendanceTable(mentorA, {
      subjectId: 'sub-dsa'
    });
    expect(subjectFiltered.every(r => r.subjectId === 'sub-dsa')).toBe(true);

    // Filter by search query
    const searchFiltered = mentorBackendService.getMenteeAttendanceTable(mentorA, {
      searchQuery: 'Aarav'
    });
    expect(searchFiltered.every(r => r.studentName.includes('Aarav') || r.enrollmentNo.includes('Aarav'))).toBe(true);
  });

  it('7. Central RBAC permissions allow MENTOR viewing and exporting attendance', () => {
    expect(can(mentorA, 'ATTENDANCE', 'VIEW')).toBe(true);
    expect(can(mentorA, 'ATTENDANCE', 'EXPORT')).toBe(true);
    expect(can(mentorA, 'ATTENDANCE', 'CREATE')).toBe(false); // Mentor does not create official attendance records

    expect(can(hodUser, 'ATTENDANCE', 'VIEW')).toBe(true);
    expect(can(hodUser, 'ATTENDANCE', 'APPROVE')).toBe(true);
  });
});
