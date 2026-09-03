import { describe, it, expect } from 'vitest';
import { studentAcademicProgressionService } from '../services/studentAcademicProgressionService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.2: Student Academic Progression, Promotion, Backlog & Section Engine', () => {

  it('TEST 1: Rule-Based Promotion Evaluation: Evaluates PROMOTED, CONDITIONAL, and DETAINED recommendations', () => {
    // 1. Low attendance -> DETAINED
    const lowAttOutcome = studentAcademicProgressionService.evaluatePromotionRecommendation({
      studentId: 'STU-2026-000001',
      creditsEarned: 24,
      requiredCredits: 24,
      activeBacklogCount: 0,
      maxAllowedBacklogs: 2,
      attendancePercentage: 68.0, // Below 75%
      minAttendanceRequired: 75.0
    });
    expect(lowAttOutcome.recommendation).toBe('DETAINED');
    expect(lowAttOutcome.reason).toContain('below mandatory threshold');

    // 2. Clear pass with full credits -> PROMOTED
    const passOutcome = studentAcademicProgressionService.evaluatePromotionRecommendation({
      studentId: 'STU-2026-000001',
      creditsEarned: 24,
      requiredCredits: 24,
      activeBacklogCount: 0,
      maxAllowedBacklogs: 2,
      attendancePercentage: 88.0,
      minAttendanceRequired: 75.0
    });
    expect(passOutcome.recommendation).toBe('PROMOTED');

    // 3. One backlog within permissible limit -> CONDITIONAL
    const condOutcome = studentAcademicProgressionService.evaluatePromotionRecommendation({
      studentId: 'STU-2026-000002',
      creditsEarned: 20,
      requiredCredits: 24,
      activeBacklogCount: 1,
      maxAllowedBacklogs: 2,
      attendancePercentage: 82.0,
      minAttendanceRequired: 75.0
    });
    expect(condOutcome.recommendation).toBe('CONDITIONAL');
    expect(condOutcome.reason).toContain('permissible limit');

    // 4. Final semester with zero backlogs -> COMPLETED (Graduation Ready)
    const gradOutcome = studentAcademicProgressionService.evaluatePromotionRecommendation({
      studentId: 'STU-2026-000003',
      creditsEarned: 160,
      requiredCredits: 160,
      activeBacklogCount: 0,
      maxAllowedBacklogs: 2,
      attendancePercentage: 90.0,
      minAttendanceRequired: 75.0,
      isFinalSemester: true
    });
    expect(gradOutcome.recommendation).toBe('COMPLETED');
  });

  it('TEST 2: Progression Execution & Next Semester Context: Records progression and creates next semester academic context', () => {
    const progression = studentAcademicProgressionService.executeProgressionDecision({
      studentId: 'STU-2026-000001',
      enrollmentId: 'enr-rec-001',
      fromAcademicYearId: 'ay-2026-27',
      fromSemesterId: 'sem-01',
      toAcademicYearId: 'ay-2026-27',
      toSemesterId: 'sem-02',
      fromSectionId: 'sec-a',
      toSectionId: 'sec-a',
      decision: 'PROMOTED',
      reason: 'Cleared all Semester 1 courses with SGPA 8.85',
      ruleVersion: 'RULE-ACAD-V2026.1',
      approvedBy: 'emp-reg-001'
    });

    expect(progression.id).toBeDefined();
    expect(progression.decision).toBe('PROMOTED');
    expect(progression.rule_version).toBe('RULE-ACAD-V2026.1');
  });

  it('TEST 3: Backlog Recording & Clearance: Tracks active backlog and clears it after supplementary attempt', () => {
    // 1. Record Backlog
    const backlog = studentAcademicProgressionService.recordBacklog({
      studentId: 'STU-2026-000002',
      enrollmentId: 'enr-rec-002',
      subjectId: 'sub-dsa-001',
      subjectCode: 'BCA201',
      subjectName: 'Data Structures & Algorithms',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-02',
      attemptNumber: 1,
      resultReference: 'RES-SIT-2026-004412'
    });

    expect(backlog.id).toBeDefined();
    expect(backlog.status).toBe('ACTIVE');

    // 2. Clear Backlog on Supplementary Pass
    const cleared = studentAcademicProgressionService.clearBacklog({
      backlogId: backlog.id,
      resultReference: 'RES-SUPP-2026-008819'
    });

    expect(cleared.status).toBe('CLEARED');
    expect(cleared.cleared_at).toBeDefined();
  });

  it('TEST 4: Academic Standing & Interventions: Evaluates EXCELLENT, WARNING, and PROBATION standings', () => {
    // Excellent standing
    const excStanding = studentAcademicProgressionService.calculateAcademicStanding({
      studentId: 'STU-2026-000001',
      semesterId: 'sem-01',
      academicYearId: 'ay-2026-27',
      cgpa: 8.9,
      backlogCount: 0,
      attendancePercentage: 92.0
    });
    expect(excStanding.standing).toBe('EXCELLENT');

    // Warning standing (backlog present)
    const warnStanding = studentAcademicProgressionService.calculateAcademicStanding({
      studentId: 'STU-2026-000002',
      semesterId: 'sem-01',
      academicYearId: 'ay-2026-27',
      cgpa: 5.2,
      backlogCount: 1,
      attendancePercentage: 80.0
    });
    expect(warnStanding.standing).toBe('WARNING');

    // Critical standing (multiple backlogs / low CGPA)
    const critStanding = studentAcademicProgressionService.calculateAcademicStanding({
      studentId: 'STU-2026-000004',
      semesterId: 'sem-01',
      academicYearId: 'ay-2026-27',
      cgpa: 4.2,
      backlogCount: 3,
      attendancePercentage: 70.0
    });
    expect(critStanding.standing).toBe('CRITICAL');
  });

  it('TEST 5: Section Management & Over-Capacity Guard: Assigns section and rejects assignment when capacity full', () => {
    // 1. Assign to Section B (capacity 60, assigned count 0)
    const assignB = studentAcademicProgressionService.assignSection({
      studentId: 'STU-2026-000002',
      enrollmentId: 'enr-rec-002',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-01',
      sectionId: 'sec-b',
      assignedBy: 'emp-reg-001'
    });

    expect(assignB.id).toBeDefined();
    expect(assignB.section_name).toBe('Section B');

    // 2. Set capacity to full for testing over-capacity guard
    const secArray = (studentAcademicProgressionService as any).sections;
    const secB = secArray.find((s: any) => s.id === 'sec-b');
    secB.capacity = 1;
    secB.assigned_count = 1; // Section B is now full

    expect(() => {
      studentAcademicProgressionService.assignSection({
        studentId: 'STU-2026-000003',
        enrollmentId: 'enr-rec-003',
        academicYearId: 'ay-2026-27',
        semesterId: 'sem-01',
        sectionId: 'sec-b',
        assignedBy: 'emp-reg-001'
      });
    }).toThrow(/already at full capacity/);
  });

  it('TEST 6: Academic Progression Dashboard Metrics: Computes authoritative promotion, backlog, and CGPA metrics', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['ACADEMIC_PROGRESS_VIEW', 'PROMOTION_VIEW', 'BACKLOG_VIEW']
    };

    const metrics = studentAcademicProgressionService.getProgressionDashboardMetrics(registrarContext);
    expect(metrics.totalAcademicStudents).toBeGreaterThanOrEqual(1);
    expect(metrics.promotedStudents).toBeGreaterThanOrEqual(1);
    expect(metrics.warningProbationCount).toBeGreaterThanOrEqual(2);
    expect(metrics.averageCGPA).toBeGreaterThan(0);
  });
});
