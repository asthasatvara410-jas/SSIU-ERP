import { describe, it, expect } from 'vitest';
import { examinationEvaluationResultProcessingService } from '../services/examinationEvaluationResultProcessingService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10.5: Examination Evaluation, Marks & Result Processing Engine', () => {

  it('TEST 1: Marks Entry & Boundary Validation: Enforces mark range and absent student restrictions', () => {
    // 1. Negative marks check
    expect(() => {
      examinationEvaluationResultProcessingService.enterStudentMarks({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs101',
        studentId: 'stud-002',
        examAttemptId: 'att-002',
        evaluationId: 'eval-002',
        componentName: 'INTERNAL',
        marks: -5,
        maximumMarks: 50,
        enteredBy: 'emp-fac-001'
      });
    }).toThrow(/Marks cannot be negative/);

    // 2. Marks exceeding maximum check
    expect(() => {
      examinationEvaluationResultProcessingService.enterStudentMarks({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs101',
        studentId: 'stud-002',
        examAttemptId: 'att-002',
        evaluationId: 'eval-002',
        componentName: 'EXTERNAL',
        marks: 55,
        maximumMarks: 50,
        enteredBy: 'emp-fac-001'
      });
    }).toThrow(/Obtained marks cannot exceed maximum marks/);

    // 3. Absent student restriction
    expect(() => {
      examinationEvaluationResultProcessingService.enterStudentMarks({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs101',
        studentId: 'stud-003',
        examAttemptId: 'att-003',
        evaluationId: 'eval-003',
        componentName: 'EXTERNAL',
        marks: 35,
        maximumMarks: 50,
        enteredBy: 'emp-fac-001',
        isAttendanceAbsent: true
      });
    }).toThrow(/marked ABSENT in examination attendance/);

    // 4. Valid Marks Entry
    const mark = examinationEvaluationResultProcessingService.enterStudentMarks({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs101',
      studentId: 'stud-002',
      examAttemptId: 'att-002',
      evaluationId: 'eval-002',
      componentName: 'INTERNAL',
      marks: 38,
      maximumMarks: 50,
      enteredBy: 'emp-fac-001'
    });

    expect(mark.id).toBeDefined();
    expect(mark.status).toBe('SUBMITTED');
  });

  it('TEST 2: Four-Eyes Principle: Evaluator cannot verify own marks, requires distinct authorized verifier', () => {
    const mark = examinationEvaluationResultProcessingService.enterStudentMarks({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs102',
      studentId: 'stud-002',
      examAttemptId: 'att-002',
      evaluationId: 'eval-002',
      componentName: 'EXTERNAL',
      marks: 44,
      maximumMarks: 50,
      enteredBy: 'emp-fac-002'
    });

    // Self-verification must fail
    expect(() => {
      examinationEvaluationResultProcessingService.verifyMarks({
        marksId: mark.id,
        verifiedBy: 'emp-fac-002', // Same user
        verificationStatus: 'APPROVED'
      });
    }).toThrow(/Four-Eyes Principle Violation/);

    // Independent verification
    const verified = examinationEvaluationResultProcessingService.verifyMarks({
      marksId: mark.id,
      verifiedBy: 'emp-hod-cse',
      verificationStatus: 'APPROVED'
    });

    expect(verified.status).toBe('VERIFIED');
    expect(verified.verified_by).toBe('emp-hod-cse');
  });

  it('TEST 3: Grace Marks & Result Calculation: Applies grace marks to border pass and computes SGPA', () => {
    // Student with raw 38 marks in subject 1 (needs 2 grace marks to pass 40 threshold)
    const result = examinationEvaluationResultProcessingService.calculateAndPublishResult({
      examId: 'exam-2026-w-001',
      studentId: 'stud-002',
      enrollmentNo: 'SSIU26BCA000060',
      studentName: 'Priya Sharma',
      examRegistrationId: 'reg-002',
      semesterId: 'sem-01',
      programId: 'prog-bca',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      academicYearId: 'ay-2026-27',
      evaluatedSubjects: [
        {
          subjectId: 'subj-cs101',
          subjectCode: 'CS101',
          attemptNumber: 1,
          internalMarks: 18,
          externalMarks: 20, // Total raw 38 -> Grace 2 -> Total 40 (Grade D, Grade Point 5)
          credits: 4
        },
        {
          subjectId: 'subj-cs102',
          subjectCode: 'CS102',
          attemptNumber: 1,
          internalMarks: 40,
          externalMarks: 45, // Total 85 -> Grade A+, Grade Point 10
          credits: 4
        }
      ]
    });

    expect(result.id).toBeDefined();
    expect(result.result_status).toBe('PASS');
    expect(result.subject_results[0].grace_marks).toBe(2);
    expect(result.subject_results[0].total_marks).toBe(40);
    expect(result.subject_results[0].grade).toBe('D');
    expect(result.subject_results[1].grade).toBe('A+');
    // SGPA = (4*5 + 4*10) / 8 = 60 / 8 = 7.5
    expect(result.sgpa).toBe(7.5);
    expect(result.credits_earned).toBe(8);
    expect(result.result_version).toBe(1);
  });

  it('TEST 4: Result Versioning & Revision Workflow: Preserves history and increments version on republish', () => {
    const revisedResult = examinationEvaluationResultProcessingService.calculateAndPublishResult({
      examId: 'exam-2026-w-001',
      studentId: 'stud-002',
      enrollmentNo: 'SSIU26BCA000060',
      studentName: 'Priya Sharma',
      examRegistrationId: 'reg-002',
      semesterId: 'sem-01',
      programId: 'prog-bca',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      academicYearId: 'ay-2026-27',
      evaluatedSubjects: [
        {
          subjectId: 'subj-cs101',
          subjectCode: 'CS101',
          attemptNumber: 1,
          internalMarks: 22,
          externalMarks: 28, // Updated total 50 (Grade C, Grade Point 6)
          credits: 4
        },
        {
          subjectId: 'subj-cs102',
          subjectCode: 'CS102',
          attemptNumber: 1,
          internalMarks: 40,
          externalMarks: 45,
          credits: 4
        }
      ]
    });

    expect(revisedResult.result_version).toBe(2); // Incremented version
    expect(revisedResult.sgpa).toBe(8.0); // (4*6 + 4*10) / 8 = 8.0
  });

  it('TEST 5: Result Dashboard Metrics: Computes authoritative pass, fail and average SGPA metrics', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['RESULT_VIEW', 'RESULT_APPROVE', 'RESULT_PUBLISH']
    };

    const metrics = examinationEvaluationResultProcessingService.getResultDashboardMetrics(registrarContext);
    expect(metrics.totalStudentsRegistered).toBe(1742);
    expect(metrics.resultsPublished).toBeGreaterThanOrEqual(2);
    expect(metrics.totalPassed).toBeGreaterThanOrEqual(2);
    expect(metrics.averageSgpa).toBeGreaterThanOrEqual(7.0);
  });
});
