import { describe, it, expect } from 'vitest';
import { centralAcademicIntegrationValidationService } from '../services/centralAcademicIntegrationValidationService';

describe('SSIU ERP – Phase 40.3: Academic End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Admission to Student Conversion: Converts approved admission and rejects unapproved candidates', () => {
    // 1. Approved admission converts to student
    const res = centralAcademicIntegrationValidationService.processAdmissionToStudent({
      admissionId: 'ADM-2026-901',
      isApproved: true,
      programId: 'PROG-BTECH-CSE',
      candidateName: 'Jigar Parmar'
    });
    expect(res.studentId).toBe('STU-2026-901');
    expect(res.status).toBe('CONVERTED');

    // 2. Unapproved admission is rejected
    expect(() => {
      centralAcademicIntegrationValidationService.processAdmissionToStudent({
        admissionId: 'ADM-2026-902',
        isApproved: false,
        programId: 'PROG-BTECH-CSE',
        candidateName: 'Unapproved Candidate'
      });
    }).toThrow(/403 Forbidden: Unapproved admission application cannot be converted to student/);
  });

  it('TEST 2: Faculty Workload Calculation: Correctly weighs theory, practical, and tutorial hours', () => {
    const hours = centralAcademicIntegrationValidationService.calculateFacultyWorkload([
      { theoryHours: 4, practicalHours: 4, tutorialHours: 2 } // 4 + (4 * 1.5) + 2 = 12
    ]);

    expect(hours).toBe(12);
  });

  it('TEST 3: Timetable Conflict Detection: Flags faculty clashes during timetable slot allocation', () => {
    const conflict = centralAcademicIntegrationValidationService.detectTimetableConflict(
      { facultyId: 'EMP-FAC-001', roomId: 'ROOM-101', timeSlot: 'MON-09:00' },
      { facultyId: 'EMP-FAC-001', roomId: 'ROOM-102', timeSlot: 'MON-09:00' }
    );

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictType).toBe('FACULTY_CLASH');
  });

  it('TEST 4: Attendance & Exam Eligibility: Evaluates 75% threshold and qualifies student with 85% attendance', () => {
    const attendance = centralAcademicIntegrationValidationService.evaluateAttendanceEligibility(34, 40, 75);

    expect(attendance.percentage).toBe(85);
    expect(attendance.isEligible).toBe(true);
  });

  it('TEST 5: Marks Validation & Grading: Validates mark boundaries and awards AA grade for 92%', () => {
    // 1. Valid Marks -> AA Grade
    const result = centralAcademicIntegrationValidationService.calculateSubjectResult({
      internalMarks: 28,
      maxInternal: 30,
      externalMarks: 64,
      maxExternal: 70
    });

    expect(result.totalMarks).toBe(92);
    expect(result.grade).toBe('AA');
    expect(result.gradePoint).toBe(10);
    expect(result.isPass).toBe(true);

    // 2. Marks exceeding max bounds are rejected
    expect(() => {
      centralAcademicIntegrationValidationService.calculateSubjectResult({
        internalMarks: 35, // > 30 max
        maxInternal: 30,
        externalMarks: 60,
        maxExternal: 70
      });
    }).toThrow(/Invalid internal marks: 35/);
  });

  it('TEST 6: End-to-End Continuous Academic Flow: Validates unbroken execution from Admission to Certificate', () => {
    const flow = centralAcademicIntegrationValidationService.runCompleteAcademicLifecycle();

    expect(flow.student_id).toBe('STU-2026-901');
    expect(flow.is_exam_eligible).toBe(true);
    expect(flow.grade).toBe('AA');
    expect(flow.gpa).toBe(9.4);
    expect(flow.cgpa).toBe(9.2);
    expect(flow.certificate_number).toContain('CERT-SSIU-2026-STU-2026-901');
    expect(flow.status).toBe('COMPLETED');
  });

  it('TEST 7: Phase 40.3 Final Gate Execution: Confirms green status across all 74 Academic criteria', () => {
    const gateReport = centralAcademicIntegrationValidationService.runFullAcademicIntegrationGate();

    expect(gateReport.admissionToStudentPassed).toBe(true);
    expect(gateReport.hierarchyLinkedPassed).toBe(true);
    expect(gateReport.subjectFacultyAllocationPassed).toBe(true);
    expect(gateReport.workloadCalculationPassed).toBe(true);
    expect(gateReport.timetableConflictDetectionPassed).toBe(true);
    expect(gateReport.attendanceMarkingAndEligibilityPassed).toBe(true);
    expect(gateReport.examAndMarksValidationPassed).toBe(true);
    expect(gateReport.resultCalculationAndLockPassed).toBe(true);
    expect(gateReport.certificateIssuedPassed).toBe(true);
    expect(gateReport.reportsAndAuditPassed).toBe(true);
    expect(gateReport.rbacAndDataIsolationPassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
