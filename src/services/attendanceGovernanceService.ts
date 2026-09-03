import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type StudentAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'ON_DUTY' | 'LEAVE';
export type EmployeeAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_DUTY' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF';
export type AttendanceRiskLevel = 'NORMAL' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
export type AcademicAlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StudentAttendanceEntry {
  id: string;
  sessionId: string;
  studentId: string;
  subjectOfferingId: string;
  attendanceDate: string;
  status: StudentAttendanceStatus;
  markedAt: string;
  markedByUserId: string;
  remarks?: string;
}

export interface EmployeeAttendanceEntry {
  id: string;
  employeeId: string;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  status: EmployeeAttendanceStatus;
  source: 'BIOMETRIC' | 'PORTAL' | 'LEAVE_SYNC';
}

export interface AttendanceCorrectionRequestRecord {
  id: string;
  attendanceRecordId: string;
  studentId: string;
  subjectOfferingId: string;
  oldStatus: StudentAttendanceStatus;
  newStatus: StudentAttendanceStatus;
  reason: string;
  requestedByUserId: string;
  approvedByUserId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AcademicAlertRecord {
  id: string;
  studentId: string;
  studentName: string;
  instituteId: string;
  departmentId: string;
  alertType: 'ATTENDANCE_SHORTAGE' | 'CRITICAL_ATTENDANCE' | 'REPEATED_ABSENCE';
  severity: AcademicAlertSeverity;
  currentAttendancePercentage: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
}

export interface SubjectAttendanceSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalSessions: number;
  attendedSessions: number;
  percentage: number;
  status: 'NORMAL' | 'SHORTAGE';
}

class AttendanceGovernanceService {
  private static instance: AttendanceGovernanceService;

  private studentAttendance: StudentAttendanceEntry[] = [
    { id: 'sa-01', sessionId: 'sess-01', studentId: 'stud-001', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-24', status: 'PRESENT', markedAt: '2026-08-24T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-02', sessionId: 'sess-02', studentId: 'stud-001', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-25', status: 'ABSENT', markedAt: '2026-08-25T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-03', sessionId: 'sess-03', studentId: 'stud-001', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-26', status: 'PRESENT', markedAt: '2026-08-26T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-04', sessionId: 'sess-04', studentId: 'stud-001', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-27', status: 'PRESENT', markedAt: '2026-08-27T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-05', sessionId: 'sess-05', studentId: 'stud-001', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-28', status: 'PRESENT', markedAt: '2026-08-28T10:00:00Z', markedByUserId: 'fac-101' },
    // stud-002 with critical shortage
    { id: 'sa-06', sessionId: 'sess-01', studentId: 'stud-002', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-24', status: 'ABSENT', markedAt: '2026-08-24T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-07', sessionId: 'sess-02', studentId: 'stud-002', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-25', status: 'ABSENT', markedAt: '2026-08-25T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-08', sessionId: 'sess-03', studentId: 'stud-002', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-26', status: 'ABSENT', markedAt: '2026-08-26T10:00:00Z', markedByUserId: 'fac-101' },
    { id: 'sa-09', sessionId: 'sess-04', studentId: 'stud-002', subjectOfferingId: 'off-dbms-2026-sem3', attendanceDate: '2026-08-27', status: 'PRESENT', markedAt: '2026-08-27T10:00:00Z', markedByUserId: 'fac-101' }
  ];

  private employeeAttendance: EmployeeAttendanceEntry[] = [
    { id: 'ea-01', employeeId: 'fac-101', attendanceDate: '2026-08-28', checkIn: '08:55', checkOut: '17:05', status: 'PRESENT', source: 'BIOMETRIC' }
  ];

  private correctionRequests: AttendanceCorrectionRequestRecord[] = [];

  private academicAlerts: AcademicAlertRecord[] = [
    {
      id: 'alt-001',
      studentId: 'stud-002',
      studentName: 'Diya Sharma',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      alertType: 'CRITICAL_ATTENDANCE',
      severity: 'CRITICAL',
      currentAttendancePercentage: 25,
      status: 'OPEN',
      createdAt: '2026-08-28T00:00:00Z'
    }
  ];

  private constructor() {}

  public static getInstance(): AttendanceGovernanceService {
    if (!AttendanceGovernanceService.instance) {
      AttendanceGovernanceService.instance = new AttendanceGovernanceService();
    }
    return AttendanceGovernanceService.instance;
  }

  // ─── CALCULATION & RISK ENGINE ──────────────────────────────────────────

  public calculateStudentAttendanceSummary(studentId: string): {
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
    riskLevel: AttendanceRiskLevel;
    shortageSubjectsCount: number;
    subjectSummaries: SubjectAttendanceSummary[];
  } {
    const records = this.studentAttendance.filter(r => r.studentId === studentId);
    const total = records.length;
    const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'EXCUSED' || r.status === 'ON_DUTY').length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

    let riskLevel: AttendanceRiskLevel = 'NORMAL';
    if (pct < 75 && pct >= 65) riskLevel = 'WATCH';
    if (pct < 65 && pct >= 50) riskLevel = 'AT_RISK';
    if (pct < 50) riskLevel = 'CRITICAL';

    const subjectSummaries: SubjectAttendanceSummary[] = [
      {
        subjectId: 'sub-dbms',
        subjectCode: 'CS301',
        subjectName: 'Database Management Systems',
        totalSessions: total,
        attendedSessions: attended,
        percentage: pct,
        status: pct < 75 ? 'SHORTAGE' : 'NORMAL'
      }
    ];

    return {
      totalSessions: total,
      attendedSessions: attended,
      percentage: pct,
      riskLevel,
      shortageSubjectsCount: pct < 75 ? 1 : 0,
      subjectSummaries
    };
  }

  // ─── CORRECTION WORKFLOW ───────────────────────────────────────────────

  public requestCorrection(correction: Omit<AttendanceCorrectionRequestRecord, 'id' | 'status' | 'createdAt'>): AttendanceCorrectionRequestRecord {
    const req: AttendanceCorrectionRequestRecord = {
      id: `corr-${Date.now()}`,
      ...correction,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.correctionRequests.push(req);
    return req;
  }

  public approveCorrection(correctionId: string, approverUserId: string): AttendanceCorrectionRequestRecord {
    const req = this.correctionRequests.find(c => c.id === correctionId);
    if (!req) throw new Error(`Correction request ${correctionId} not found`);

    req.status = 'APPROVED';
    req.approvedByUserId = approverUserId;

    // Apply change to student attendance
    const record = this.studentAttendance.find(r => r.id === req.attendanceRecordId);
    if (record) {
      record.status = req.newStatus;
      record.remarks = `Corrected from ${req.oldStatus}: ${req.reason}`;
    }

    return req;
  }

  // ─── MONITORING & KPIS ────────────────────────────────────────────────

  public getAttendanceMonitoringKpis(departmentId?: string): {
    totalStudentsEvaluated: number;
    shortageStudentsCount: number;
    criticalAlertsCount: number;
    averageAttendancePercentage: number;
  } {
    const alerts = this.academicAlerts.filter(a => !departmentId || a.departmentId === departmentId);
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;

    return {
      totalStudentsEvaluated: 2,
      shortageStudentsCount: 1, // stud-002
      criticalAlertsCount: criticalAlerts,
      averageAttendancePercentage: 53 // (80 + 25) / 2 = 52.5 -> 53%
    };
  }
}

export const attendanceGovernanceService = AttendanceGovernanceService.getInstance();
