import { describe, it, expect } from 'vitest';
import { examinationRevaluationBacklogReportingService } from '../services/examinationRevaluationBacklogReportingService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10.6: Examination Revaluation, Backlog, Progression & Analytics Engine', () => {

  it('TEST 1: Revaluation Eligibility & Fee Integration: Checks window, prevents duplicate requests and creates fee reference', () => {
    // 1. Revaluation window closed check
    expect(() => {
      examinationRevaluationBacklogReportingService.applyForRevaluation({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs101',
        subjectCode: 'CS101',
        studentId: 'stud-002',
        enrollmentNo: 'SSIU26BCA000060',
        studentName: 'Priya Sharma',
        originalResultId: 'res-002',
        originalMarks: 50,
        originalGrade: 'C',
        feeAmount: 500,
        isWindowOpen: false // Window closed
      });
    }).toThrow(/Revaluation application closed/);

    // 2. Valid Revaluation Application
    const req = examinationRevaluationBacklogReportingService.applyForRevaluation({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs101',
      subjectCode: 'CS101',
      studentId: 'stud-002',
      enrollmentNo: 'SSIU26BCA000060',
      studentName: 'Priya Sharma',
      originalResultId: 'res-002',
      originalMarks: 50,
      originalGrade: 'C',
      feeAmount: 500,
      isWindowOpen: true
    });

    expect(req.id).toBeDefined();
    expect(req.request_number).toMatch(/^REV-2026-\d{6}$/);
    expect(req.status).toBe('FEE_VERIFIED');
    expect(req.fee_reference_id).toMatch(/^FD-REV-2026-\d{6}$/);

    // 3. Duplicate Revaluation Request Prevention
    expect(() => {
      examinationRevaluationBacklogReportingService.applyForRevaluation({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs101',
        subjectCode: 'CS101',
        studentId: 'stud-002', // Same student & subject
        enrollmentNo: 'SSIU26BCA000060',
        studentName: 'Priya Sharma',
        originalResultId: 'res-002',
        originalMarks: 50,
        originalGrade: 'C',
        feeAmount: 500,
        isWindowOpen: true
      });
    }).toThrow(/Active revaluation request already exists/);
  });

  it('TEST 2: Revaluation Evaluation & Versioned Result Revision: Evaluates revaluation and recalculates SGPA under policy', () => {
    const outcome = examinationRevaluationBacklogReportingService.processRevaluationEvaluation({
      requestId: 'rev-001',
      revaluationEvaluatorId: 'emp-fac-003',
      revaluatedMarks: 88, // Original was 82 -> New marks 88 (Grade A+)
      policy: 'HIGHER_MARK',
      approvedBy: 'emp-reg-001'
    });

    expect(outcome.request.status).toBe('RESULT_REVISED');
    expect(outcome.finalMarks).toBe(88);
    expect(outcome.finalGrade).toBe('A+');
    expect(outcome.revision.new_version).toBe(2);
    expect(outcome.revision.new_sgpa).toBe(8.25);
  });

  it('TEST 3: Rechecking Service: Handles totaling/unmarked question verification with audit outcomes', () => {
    // 1. Submit rechecking request
    const recReq = examinationRevaluationBacklogReportingService.submitRecheckingRequest({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs102',
      studentId: 'stud-002',
      originalResultId: 'res-002'
    });

    expect(recReq.id).toBeDefined();
    expect(recReq.request_number).toMatch(/^REC-2026-\d{6}$/);
    expect(recReq.status).toBe('SUBMITTED');

    // 2. Complete rechecking with NO_CHANGE outcome
    const completed = examinationRevaluationBacklogReportingService.completeRechecking({
      requestId: recReq.id,
      verifiedBy: 'emp-fac-001',
      outcome: 'NO_CHANGE',
      remarks: 'All questions totaled correctly and no unassessed answer scripts found'
    });

    expect(completed.status).toBe('NO_CHANGE');
    expect(completed.verified_by).toBe('emp-fac-001');
  });

  it('TEST 4: Backlog & Supplementary Clearance: Logs failed subjects and marks cleared upon supplementary success', () => {
    // 1. Record backlog for student who failed CS102
    const backlog = examinationRevaluationBacklogReportingService.recordBacklogSubject({
      studentId: 'stud-004',
      enrollmentNo: 'SSIU26BCA000062',
      studentName: 'Rohan Sharma',
      subjectId: 'subj-cs102',
      subjectCode: 'CS102',
      subjectName: 'Data Structures & Algorithms',
      credits: 4,
      originalExamId: 'exam-2026-w-001',
      originalAttemptNumber: 1,
      resultId: 'res-004'
    });

    expect(backlog.status).toBe('ACTIVE');

    // 2. Clear backlog in supplementary examination (Attempt 2)
    const cleared = examinationRevaluationBacklogReportingService.clearBacklogInSupplementaryExam({
      studentId: 'stud-004',
      subjectId: 'subj-cs102',
      supplementaryExamId: 'exam-2026-supp-001',
      clearedAttemptNumber: 2
    });

    expect(cleared.status).toBe('CLEARED');
    expect(cleared.cleared_in_exam_id).toBe('exam-2026-supp-001');
    expect(cleared.cleared_attempt_number).toBe(2);
  });

  it('TEST 5: Academic Progression & Analytics KPIs: Evaluates semester promotion and graduation criteria', () => {
    // 1. Student with 1 active backlog -> Promoted to next semester
    const progression = examinationRevaluationBacklogReportingService.evaluateAcademicProgression({
      studentId: 'stud-003',
      enrollmentNo: 'SSIU26BCA000061',
      studentName: 'Kabir Mehta',
      programId: 'prog-bca',
      totalCreditsRequired: 120,
      creditsAttempted: 20,
      creditsEarned: 16,
      currentCgpa: 6.8
    });

    expect(progression.activeBacklogsCount).toBe(1);
    expect(progression.isEligibleForNextSemester).toBe(true);
    expect(progression.isEligibleForGraduation).toBe(false);

    // 2. Examination Analytics KPIs
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['EXAM_ANALYTICS_VIEW', 'REVALUATION_VIEW', 'BACKLOG_VIEW']
    };

    const kpis = examinationRevaluationBacklogReportingService.getExaminationAnalyticsKPIs(registrarContext);
    expect(kpis.totalExamsConducted).toBeGreaterThanOrEqual(4);
    expect(kpis.overallPassPercentage).toBeGreaterThanOrEqual(80.0);
    expect(kpis.activeBacklogsCount).toBeGreaterThanOrEqual(1);
    expect(kpis.revaluationRequestsTotal).toBeGreaterThanOrEqual(2);
  });
});
