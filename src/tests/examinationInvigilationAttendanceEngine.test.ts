import { describe, it, expect } from 'vitest';
import { examinationInvigilationAttendanceService } from '../services/examinationInvigilationAttendanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10.4: Examination Invigilator Duty, Exam Attendance & Room Monitoring Engine', () => {

  it('TEST 1: Invigilator Duty Assignment & Conflict Detection: Assigns duty and detects timeslot collisions', () => {
    // 1. Valid duty assignment for Dr. Priya Dave on a non-conflicting timeslot
    const duty1 = examinationInvigilationAttendanceService.assignInvigilatorDuty({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs101',
      centerId: 'ctr-001',
      hallId: 'hall-102',
      facultyId: 'emp-fac-002',
      facultyName: 'Dr. Priya Dave',
      dutyDate: '2026-11-16',
      session: 'MORNING',
      reportingTime: '09:15',
      startTime: '10:00',
      endTime: '13:00',
      dutyType: 'INVIGILATOR',
      assignedBy: 'emp-reg-001'
    });

    expect(duty1.id).toBeDefined();
    expect(duty1.duty_number).toMatch(/^DUTY-2026-\d{6}$/);
    expect(duty1.status).toBe('ASSIGNED');

    // 2. Schedule conflict detection for same faculty on overlapping timeslot
    expect(() => {
      examinationInvigilationAttendanceService.assignInvigilatorDuty({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs102',
        centerId: 'ctr-001',
        hallId: 'hall-101',
        facultyId: 'emp-fac-002', // Same faculty
        facultyName: 'Dr. Priya Dave',
        dutyDate: '2026-11-16', // Same date
        session: 'MORNING',
        reportingTime: '09:15',
        startTime: '11:00', // Overlaps 10:00 - 13:00
        endTime: '14:00',
        dutyType: 'RELIEVER',
        assignedBy: 'emp-reg-001'
      });
    }).toThrow(/Duty conflict detected/);
  });

  it('TEST 2: Duty Response & Decline Workflow: Accepts duty or records mandatory decline reason', () => {
    const duty = examinationInvigilationAttendanceService.assignInvigilatorDuty({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs102',
      centerId: 'ctr-001',
      hallId: 'hall-101',
      facultyId: 'emp-fac-003',
      facultyName: 'Prof. Ankit Shah',
      dutyDate: '2026-11-18',
      session: 'MORNING',
      reportingTime: '09:15',
      startTime: '10:00',
      endTime: '13:00',
      dutyType: 'INVIGILATOR',
      assignedBy: 'emp-reg-001'
    });

    // Decline without reason must fail
    expect(() => {
      examinationInvigilationAttendanceService.respondToDuty({
        dutyId: duty.id,
        action: 'DECLINE'
      });
    }).toThrow(/Decline reason is mandatory/);

    // Decline with reason
    const declined = examinationInvigilationAttendanceService.respondToDuty({
      dutyId: duty.id,
      action: 'DECLINE',
      reason: 'Scheduled for PhD viva evaluation on university campus'
    });

    expect(declined.status).toBe('DECLINED');
    expect(declined.decline_reason).toContain('PhD viva evaluation');
  });

  it('TEST 3: Exam Session Lifecycle & Attendance Marking: Manages session transitions and records attendance', () => {
    // 1. Start Session
    const startedSession = examinationInvigilationAttendanceService.startExamSession('sess-001', 'emp-fac-001');
    expect(startedSession.status).toBe('IN_PROGRESS');
    expect(startedSession.started_by).toBe('emp-fac-001');

    // 2. Mark student attendance (Late arrival)
    const attLate = examinationInvigilationAttendanceService.markStudentAttendance({
      sessionId: 'sess-001',
      studentId: 'stud-002',
      enrollmentNo: 'SSIU26BCA000060',
      studentName: 'Priya Sharma',
      examRegistrationId: 'reg-002',
      examSubjectId: 'subj-cs101',
      hallId: 'hall-101',
      seatNumber: 'R1-C2',
      status: 'LATE',
      markedBy: 'emp-fac-001',
      arrivalTime: '10:20',
      remarks: 'Traffic delay due to rain'
    });

    expect(attLate.attendance_status).toBe('LATE');
    expect(attLate.arrival_time).toBe('10:20');

    // 3. Mark student absent
    const attAbsent = examinationInvigilationAttendanceService.markStudentAttendance({
      sessionId: 'sess-001',
      studentId: 'stud-003',
      enrollmentNo: 'SSIU26BCA000061',
      studentName: 'Kabir Mehta',
      examRegistrationId: 'reg-003',
      examSubjectId: 'subj-cs101',
      hallId: 'hall-101',
      seatNumber: 'R1-C3',
      status: 'ABSENT',
      markedBy: 'emp-fac-001'
    });

    expect(attAbsent.attendance_status).toBe('ABSENT');
  });

  it('TEST 4: Session Finalization & Locked Attendance Correction: Enforces lock and audits corrections', () => {
    // 1. Complete session (locks all session attendance records)
    const completedSession = examinationInvigilationAttendanceService.completeExamSession('sess-001', 'emp-fac-001');
    expect(completedSession.status).toBe('COMPLETED');

    // 2. Editing locked attendance directly must throw error
    expect(() => {
      examinationInvigilationAttendanceService.markStudentAttendance({
        sessionId: 'sess-001',
        studentId: 'stud-001',
        enrollmentNo: 'SSIU26BCA000059',
        studentName: 'Aarav Patel',
        examRegistrationId: 'reg-001',
        examSubjectId: 'subj-cs101',
        hallId: 'hall-101',
        seatNumber: 'R1-C1',
        status: 'ABSENT',
        markedBy: 'emp-fac-001'
      });
    }).toThrow(/is locked after session finalization/);

    // 3. Authorized correction with mandatory audit reason
    const corrected = examinationInvigilationAttendanceService.correctFinalizedAttendance({
      attendanceId: 'att-rec-001',
      newStatus: 'PRESENT',
      reason: 'Biometric verification confirmed student attendance during exam',
      correctedBy: 'emp-reg-001'
    });

    expect(corrected.attendance_status).toBe('PRESENT');
    expect(corrected.remarks).toContain('Biometric verification confirmed');
  });

  it('TEST 5: Incident Reporting & Operations Dashboard Metrics: Records incident and provides accurate metrics', () => {
    // 1. Report Malpractice Incident
    const incident = examinationInvigilationAttendanceService.reportExamIncident({
      sessionId: 'sess-001',
      hallId: 'hall-101',
      studentId: 'stud-003',
      incidentType: 'MALPRACTICE',
      description: 'Unauthorized reference material found in possession during examination',
      severity: 'HIGH',
      reportedBy: 'emp-fac-001'
    });

    expect(incident.id).toBeDefined();
    expect(incident.incident_number).toMatch(/^INC-2026-\d{6}$/);
    expect(incident.status).toBe('OPEN');

    // 2. Metrics Verification
    const metrics = examinationInvigilationAttendanceService.getOperationsDashboardMetrics();
    expect(metrics.totalSessionsToday).toBeGreaterThanOrEqual(1);
    expect(metrics.completedSessions).toBeGreaterThanOrEqual(1);
    expect(metrics.totalInvigilatorsAssigned).toBeGreaterThanOrEqual(2);
    expect(metrics.totalStudentsPresent).toBeGreaterThanOrEqual(1);
    expect(metrics.totalStudentsLate).toBeGreaterThanOrEqual(1);
    expect(metrics.openIncidentsCount).toBeGreaterThanOrEqual(1);
  });
});
