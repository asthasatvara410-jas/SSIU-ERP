import { describe, it, expect } from 'vitest';
import { attendanceGovernanceService } from '../services/attendanceGovernanceService';

describe('SSIU ERP – Phase 14: Attendance + Academic Monitoring Engine', () => {

  it('TEST 1: Dynamic Calculation: Calculates attendance percentage, subject summaries, and shortage classification', () => {
    const summaryA = attendanceGovernanceService.calculateStudentAttendanceSummary('stud-001');
    expect(summaryA.totalSessions).toBe(5);
    expect(summaryA.attendedSessions).toBe(4);
    expect(summaryA.percentage).toBe(80);
    expect(summaryA.riskLevel).toBe('NORMAL');
    expect(summaryA.shortageSubjectsCount).toBe(0);

    const summaryB = attendanceGovernanceService.calculateStudentAttendanceSummary('stud-002');
    expect(summaryB.totalSessions).toBe(4);
    expect(summaryB.attendedSessions).toBe(1);
    expect(summaryB.percentage).toBe(25);
    expect(summaryB.riskLevel).toBe('CRITICAL');
    expect(summaryB.shortageSubjectsCount).toBe(1);
  });

  it('TEST 2: Audited Correction Workflow: Correction request requires approval before modifying marked attendance', () => {
    const correction = attendanceGovernanceService.requestCorrection({
      attendanceRecordId: 'sa-02',
      studentId: 'stud-001',
      subjectOfferingId: 'off-dbms-2026-sem3',
      oldStatus: 'ABSENT',
      newStatus: 'PRESENT',
      reason: 'Student was participating in inter-college tech competition (OD)',
      requestedByUserId: 'fac-101'
    });

    expect(correction.status).toBe('PENDING');

    const approved = attendanceGovernanceService.approveCorrection(correction.id, 'usr-hod-01');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedByUserId).toBe('usr-hod-01');

    // Recalculate attendance
    const updatedSummary = attendanceGovernanceService.calculateStudentAttendanceSummary('stud-001');
    expect(updatedSummary.attendedSessions).toBe(5); // 4 + 1 = 5
    expect(updatedSummary.percentage).toBe(100);
  });

  it('TEST 3: Department & Institutional Monitoring: Reconciles evaluated student shortage count and critical alerts', () => {
    const kpis = attendanceGovernanceService.getAttendanceMonitoringKpis('dept-1');
    expect(kpis.totalStudentsEvaluated).toBe(2);
    expect(kpis.shortageStudentsCount).toBe(1);
    expect(kpis.criticalAlertsCount).toBe(1);
    expect(kpis.averageAttendancePercentage).toBeGreaterThan(0);
  });
});
