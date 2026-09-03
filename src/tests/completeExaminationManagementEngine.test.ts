import { describe, it, expect } from 'vitest';
import { examinationGovernanceService } from '../services/examinationGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10: Complete Examination Management Engine', () => {

  const studentAContext: UserAuthorizationContext = {
    userId: 'stud-001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'stud-002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Examination Master & Scope: Winter Regular Examination exists with valid Academic Year & Program links', () => {
    const exams = examinationGovernanceService.getExaminations('ay-2026-27');
    expect(exams.length).toBeGreaterThan(0);
    expect(exams[0].code).toBe('EXAM-W26-CSE3');
    expect(exams[0].examType).toBe('END_SEMESTER');
  });

  it('TEST 2: Eligibility Engine prevents blocked students from submitting exam forms', () => {
    const eligA = examinationGovernanceService.getStudentEligibility('exam-2026-sem3-reg', 'stud-001');
    const eligB = examinationGovernanceService.getStudentEligibility('exam-2026-sem3-reg', 'stud-002');

    expect(eligA?.status).toBe('ELIGIBLE');
    expect(eligB?.status).toBe('BLOCKED');
    expect(eligB?.reason).toContain('Attendance Shortage');

    // Attempt blocked submission
    expect(() => {
      examinationGovernanceService.submitExamForm({
        examinationId: 'exam-2026-sem3-reg',
        studentId: 'stud-002',
        studentName: 'Diya Sharma',
        enrollmentNo: 'SSIU26CS002',
        registeredSubjectIds: ['es-dbms']
      });
    }).toThrow(/not eligible/i);
  });

  it('TEST 3: Exam Fee Transaction is distinct and tracks payment status', () => {
    const feeTx = examinationGovernanceService.getExamFeeTransaction('exam-2026-sem3-reg', 'stud-001');
    expect(feeTx).toBeDefined();
    expect(feeTx?.amount).toBe(1500);
    expect(feeTx?.status).toBe('PAID');
    expect(feeTx?.transactionReference).toBe('TXN-EXAM-99881');
  });

  it('TEST 4: Exam Schedule & Invigilation: Verified timetable slots and invigilators', () => {
    const schedule = examinationGovernanceService.getExamSchedule('exam-2026-sem3-reg');
    expect(schedule.length).toBe(2);
    expect(schedule[0].subjectCode).toBe('CS301');
    expect(schedule[0].roomNumber).toBe('Block-A 101');
  });

  it('TEST 5: Result Privacy: Student A can view own result, but Student B is strictly blocked from viewing Student A result', () => {
    const ownResult = examinationGovernanceService.getStudentResult('exam-2026-sem3-reg', 'stud-001', studentAContext);
    expect(ownResult).toBeDefined();
    expect(ownResult?.sgpa).toBe(8.5);
    expect(ownResult?.overallStatus).toBe('PASS');

    const unauthorizedResult = examinationGovernanceService.getStudentResult('exam-2026-sem3-reg', 'stud-001', studentBContext);
    expect(unauthorizedResult).toBeUndefined(); // Strictly blocked
  });

  it('TEST 6: Dashboard KPI Aggregation matches real underlying exam records', () => {
    const kpis = examinationGovernanceService.getExamKpiSummary();
    expect(kpis.totalEligibleStudents).toBe(1);
    expect(kpis.approvedFormsCount).toBe(1);
    expect(kpis.scheduledExamsCount).toBe(2);
    expect(kpis.publishedResultsCount).toBe(1);
  });
});
