import { describe, it, expect } from 'vitest';
import { studentAcademicManagementGovernanceService } from '../services/studentAcademicManagementGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 35: Student Academic Management System Engine', () => {

  it('TEST 1: Course Attendance & Short Attendance Derivation: Accurately derives attendance % and short flags', () => {
    // CS-301: 34 / 40 = 85% -> ELIGIBLE
    const att1 = studentAcademicManagementGovernanceService.getCourseAttendance('stud-001', 'CS-301');
    expect(att1.attendancePercentage).toBe(85);
    expect(att1.attendanceFlag).toBe('ELIGIBLE');

    // CS-302: 28 / 40 = 70% -> SHORT
    const att2 = studentAcademicManagementGovernanceService.getCourseAttendance('stud-001', 'CS-302');
    expect(att2.attendancePercentage).toBe(70);
    expect(att2.attendanceFlag).toBe('SHORT');
  });

  it('TEST 2: At-Risk Student Classification Engine: Evaluates attendance, GPA, and backlogs to classify risk levels', () => {
    // Normal student
    const statusNormal = studentAcademicManagementGovernanceService.evaluateAtRiskStatus({
      overallAttendancePercentage: 88,
      cgpa: 8.2,
      activeBacklogsCount: 0
    });
    expect(statusNormal).toBe('NORMAL');

    // At-Risk due to attendance < 75%
    const statusAtRisk = studentAcademicManagementGovernanceService.evaluateAtRiskStatus({
      overallAttendancePercentage: 72,
      cgpa: 6.8,
      activeBacklogsCount: 0
    });
    expect(statusAtRisk).toBe('AT_RISK');

    // Critical due to active backlogs >= 3
    const statusCritical = studentAcademicManagementGovernanceService.evaluateAtRiskStatus({
      overallAttendancePercentage: 60,
      cgpa: 3.8,
      activeBacklogsCount: 3
    });
    expect(statusCritical).toBe('CRITICAL');
  });

  it('TEST 3: Academic Promotion vs Detention Governance: Evaluates minimum credit requirements and backlog limits', () => {
    // Satisfies requirements
    const promotion = studentAcademicManagementGovernanceService.evaluateSemesterPromotion({
      earnedCredits: 22,
      requiredCredits: 20,
      maxAllowedBacklogs: 2,
      activeBacklogsCount: 1
    });
    expect(promotion.decision).toBe('PROMOTED');

    // Detained due to insufficient credits
    const detentionCredits = studentAcademicManagementGovernanceService.evaluateSemesterPromotion({
      earnedCredits: 16,
      requiredCredits: 20,
      maxAllowedBacklogs: 2,
      activeBacklogsCount: 1
    });
    expect(detentionCredits.decision).toBe('DETAINED');
    expect(detentionCredits.reason).toContain('Insufficient credits');

    // Detained due to excessive backlogs
    const detentionBacklogs = studentAcademicManagementGovernanceService.evaluateSemesterPromotion({
      earnedCredits: 22,
      requiredCredits: 20,
      maxAllowedBacklogs: 2,
      activeBacklogsCount: 4
    });
    expect(detentionBacklogs.decision).toBe('DETAINED');
    expect(detentionBacklogs.reason).toContain('Active backlogs');
  });
});
