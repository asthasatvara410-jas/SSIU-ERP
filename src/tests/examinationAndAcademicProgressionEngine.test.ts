import { describe, it, expect } from 'vitest';
import { examinationProgressionGovernanceService } from '../services/examinationProgressionGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 15: Examination + Result + Academic Progression Engine', () => {

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

  it('TEST 1: SGPA & Academic Progression: Derives SGPA and promotion status dynamically from credits and grade points', () => {
    const sgpa = examinationProgressionGovernanceService.calculateSgpa([
      { subjectId: 'sub-1', subjectCode: 'CS101', subjectName: 'Programming in C', credits: 4, marksObtained: 85, maxMarks: 100, grade: 'AA', gradePoint: 10, status: 'PASS' },
      { subjectId: 'sub-2', subjectCode: 'MA101', subjectName: 'Calculus', credits: 4, marksObtained: 75, maxMarks: 100, grade: 'AB', gradePoint: 9, status: 'PASS' }
    ]);

    expect(sgpa).toBe(9.5); // (4*10 + 4*9) / 8 = 76 / 8 = 9.5

    const progression = examinationProgressionGovernanceService.evaluateAcademicProgression('stud-001');
    expect(progression.progressionStatus).toBe('PROMOTED');
    expect(progression.eligibleForNextSemester).toBe(true);
    expect(progression.totalCreditsEarned).toBeGreaterThan(0);
  });

  it('TEST 2: Eligibility & Audited Override: Authorized authority can override eligibility with reason', () => {
    const eligibility = examinationProgressionGovernanceService.evaluateEligibility('stud-002', 'exam-winter-2026');
    expect(eligibility.status).toBe('NOT_ELIGIBLE');

    const overridden = examinationProgressionGovernanceService.overrideEligibility(eligibility.id, 'Medical exception approved by HOI', 'usr-hoi-01');
    expect(overridden.status).toBe('OVERRIDDEN');
    expect(overridden.overrideReason).toContain('Medical exception');
  });

  it('TEST 3: Revaluation Workflow: Preserves original marks while tracking revised evaluated score', () => {
    const reval = examinationProgressionGovernanceService.applyRevaluation({
      studentId: 'stud-001',
      examinationId: 'exam-summer-2026',
      subjectId: 'sub-maths',
      originalMarks: 72,
      reason: 'Discrepancy in question 4 evaluation'
    });

    expect(reval.status).toBe('REQUESTED');

    const completedReval = examinationProgressionGovernanceService.completeRevaluation(reval.id, 80);
    expect(completedReval.status).toBe('COMPLETED');
    expect(completedReval.originalMarks).toBe(72);
    expect(completedReval.revisedMarks).toBe(80);
    expect(completedReval.finalMarks).toBe(80);
  });

  it('TEST 4: Result Privacy: Student A can view own result, but Student B cannot view Student A result', () => {
    const ownResult = examinationProgressionGovernanceService.getStudentResult('stud-001', studentAContext);
    expect(ownResult).toBeDefined();
    expect(ownResult?.studentId).toBe('stud-001');

    const unauthorizedResult = examinationProgressionGovernanceService.getStudentResult('stud-001', studentBContext);
    expect(unauthorizedResult).toBeUndefined(); // Strictly blocked
  });
});
