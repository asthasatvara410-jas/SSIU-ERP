import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type DutyType = 'CHIEF_INVIGILATOR' | 'INVIGILATOR' | 'RELIEVER' | 'RESERVE' | 'OBSERVER' | 'FLYING_SQUAD';

export type DutyStatus = 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'REPLACEMENT_REQUIRED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ExamSessionStatus = 'SCHEDULED' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';

export type ExamAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL' | 'EXCUSED' | 'WITHHELD';

export type IncidentType = 'LATE_ENTRY' | 'MALPRACTICE' | 'DISRUPTION' | 'MEDICAL' | 'DOCUMENT_ISSUE' | 'SEAT_ISSUE' | 'QUESTION_PAPER_ISSUE' | 'OTHER';

export interface InvigilatorDutyRecord {
  id: string;
  duty_number: string;
  exam_id: string;
  exam_subject_id: string;
  exam_center_id: string;
  exam_hall_id: string;
  faculty_id: string;
  faculty_name: string;
  duty_date: string;
  session: string;
  reporting_time: string;
  start_time: string;
  end_time: string;
  duty_type: DutyType;
  status: DutyStatus;
  assigned_by: string;
  assigned_at: string;
  confirmed_at?: string;
  decline_reason?: string;
  replacement_faculty_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSessionRecord {
  id: string;
  exam_id: string;
  exam_subject_id: string;
  center_id: string;
  hall_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  reporting_time: string;
  status: ExamSessionStatus;
  started_at?: string;
  started_by?: string;
  completed_at?: string;
  completed_by?: string;
}

export interface ExamAttendanceRecord {
  id: string;
  exam_session_id: string;
  student_id: string;
  enrollment_no: string;
  student_name: string;
  exam_registration_id: string;
  exam_subject_id: string;
  hall_id: string;
  seat_number: string;
  attendance_status: ExamAttendanceStatus;
  marked_at: string;
  marked_by: string;
  is_locked: boolean;
  arrival_time?: string;
  remarks?: string;
}

export interface RoomMonitoringRecord {
  id: string;
  exam_session_id: string;
  hall_id: string;
  chief_invigilator_id: string;
  student_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  answer_sheets_received: number;
  answer_sheets_issued: number;
  answer_sheets_collected: number;
  is_checklist_verified: boolean;
  notes?: string;
}

export interface ExamIncidentRecord {
  id: string;
  incident_number: string;
  exam_session_id: string;
  hall_id: string;
  student_id?: string;
  faculty_id?: string;
  incident_type: IncidentType;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reported_by: string;
  reported_at: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface ExamOperationsDashboardMetrics {
  totalSessionsToday: number;
  activeSessions: number;
  completedSessions: number;
  totalInvigilatorsAssigned: number;
  pendingDutyConfirmations: number;
  totalStudentsRegistered: number;
  totalStudentsPresent: number;
  totalStudentsAbsent: number;
  totalStudentsLate: number;
  openIncidentsCount: number;
}

class ExaminationInvigilationAttendanceService {
  private static instance: ExaminationInvigilationAttendanceService;

  private duties: InvigilatorDutyRecord[] = [
    {
      id: 'duty-001',
      duty_number: 'DUTY-2026-000001',
      exam_id: 'exam-2026-w-001',
      exam_subject_id: 'subj-cs101',
      exam_center_id: 'ctr-001',
      exam_hall_id: 'hall-101',
      faculty_id: 'emp-fac-001',
      faculty_name: 'Dr. Ramesh Sharma',
      duty_date: '2026-11-16',
      session: 'MORNING',
      reporting_time: '09:15',
      start_time: '10:00',
      end_time: '13:00',
      duty_type: 'CHIEF_INVIGILATOR',
      status: 'ACCEPTED',
      assigned_by: 'emp-reg-001',
      assigned_at: '2026-08-28T08:00:00Z',
      confirmed_at: '2026-08-28T09:00:00Z',
      created_at: '2026-08-28T08:00:00Z',
      updated_at: '2026-08-28T09:00:00Z'
    }
  ];

  private sessions: ExamSessionRecord[] = [
    {
      id: 'sess-001',
      exam_id: 'exam-2026-w-001',
      exam_subject_id: 'subj-cs101',
      center_id: 'ctr-001',
      hall_id: 'hall-101',
      session_date: '2026-11-16',
      start_time: '10:00',
      end_time: '13:00',
      reporting_time: '09:15',
      status: 'SCHEDULED'
    }
  ];

  private attendances: ExamAttendanceRecord[] = [
    {
      id: 'att-rec-001',
      exam_session_id: 'sess-001',
      student_id: 'stud-001',
      enrollment_no: 'SSIU26BCA000059',
      student_name: 'Aarav Patel',
      exam_registration_id: 'reg-001',
      exam_subject_id: 'subj-cs101',
      hall_id: 'hall-101',
      seat_number: 'R1-C1',
      attendance_status: 'PRESENT',
      marked_at: '2026-11-16T10:05:00Z',
      marked_by: 'emp-fac-001',
      is_locked: false
    }
  ];

  private incidents: ExamIncidentRecord[] = [];
  private monitoringRecords: RoomMonitoringRecord[] = [];

  private constructor() {}

  public static getInstance(): ExaminationInvigilationAttendanceService {
    if (!ExaminationInvigilationAttendanceService.instance) {
      ExaminationInvigilationAttendanceService.instance = new ExaminationInvigilationAttendanceService();
    }
    return ExaminationInvigilationAttendanceService.instance;
  }

  // ─── INVIGILATOR DUTY ALLOCATION & CONFLICT DETECTION ─────────────────

  public assignInvigilatorDuty(params: {
    examId: string;
    examSubjectId: string;
    centerId: string;
    hallId: string;
    facultyId: string;
    facultyName: string;
    dutyDate: string;
    session: string;
    reportingTime: string;
    startTime: string;
    endTime: string;
    dutyType: DutyType;
    assignedBy: string;
  }): InvigilatorDutyRecord {
    // Detect schedule conflict
    const conflict = this.duties.find(d =>
      d.faculty_id === params.facultyId &&
      d.duty_date === params.dutyDate &&
      d.status !== 'CANCELLED' &&
      d.status !== 'DECLINED' &&
      ((params.startTime >= d.start_time && params.startTime < d.end_time) ||
       (params.endTime > d.start_time && params.endTime <= d.end_time))
    );

    if (conflict) {
      throw new Error(`Duty conflict detected: Faculty ${params.facultyName} is already assigned to Duty ${conflict.duty_number} on ${params.dutyDate} (${conflict.start_time} - ${conflict.end_time})`);
    }

    const dutyNumber = `DUTY-2026-${(this.duties.length + 1).toString().padStart(6, '0')}`;
    const duty: InvigilatorDutyRecord = {
      id: `duty-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      duty_number: dutyNumber,
      exam_id: params.examId,
      exam_subject_id: params.examSubjectId,
      exam_center_id: params.centerId,
      exam_hall_id: params.hallId,
      faculty_id: params.facultyId,
      faculty_name: params.facultyName,
      duty_date: params.dutyDate,
      session: params.session,
      reporting_time: params.reportingTime,
      start_time: params.startTime,
      end_time: params.endTime,
      duty_type: params.dutyType,
      status: 'ASSIGNED',
      assigned_by: params.assignedBy,
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.duties.push(duty);
    return duty;
  }

  public respondToDuty(params: {
    dutyId: string;
    action: 'ACCEPT' | 'DECLINE';
    reason?: string;
  }): InvigilatorDutyRecord {
    const duty = this.duties.find(d => d.id === params.dutyId);
    if (!duty) throw new Error(`Invigilator duty ${params.dutyId} not found`);

    if (params.action === 'ACCEPT') {
      duty.status = 'ACCEPTED';
      duty.confirmed_at = new Date().toISOString();
    } else {
      if (!params.reason) throw new Error('Decline reason is mandatory when declining an invigilation duty');
      duty.status = 'DECLINED';
      duty.decline_reason = params.reason;
    }

    duty.updated_at = new Date().toISOString();
    return duty;
  }

  // ─── EXAM SESSION LIFECYCLE ───────────────────────────────────────────

  public startExamSession(sessionId: string, startedBy: string): ExamSessionRecord {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error(`Exam session ${sessionId} not found`);

    if (session.status !== 'SCHEDULED' && session.status !== 'READY') {
      throw new Error(`Cannot start session in ${session.status} status`);
    }

    session.status = 'IN_PROGRESS';
    session.started_at = new Date().toISOString();
    session.started_by = startedBy;

    return session;
  }

  public completeExamSession(sessionId: string, completedBy: string): ExamSessionRecord {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error(`Exam session ${sessionId} not found`);

    session.status = 'COMPLETED';
    session.completed_at = new Date().toISOString();
    session.completed_by = completedBy;

    // Lock all attendance records for this session
    this.attendances
      .filter(a => a.exam_session_id === sessionId)
      .forEach(a => { a.is_locked = true; });

    return session;
  }

  // ─── EXAM ATTENDANCE MARKING & FINALIZATION ───────────────────────────

  public markStudentAttendance(params: {
    sessionId: string;
    studentId: string;
    enrollmentNo: string;
    studentName: string;
    examRegistrationId: string;
    examSubjectId: string;
    hallId: string;
    seatNumber: string;
    status: ExamAttendanceStatus;
    markedBy: string;
    arrivalTime?: string;
    remarks?: string;
  }): ExamAttendanceRecord {
    const existing = this.attendances.find(a =>
      a.exam_session_id === params.sessionId &&
      a.student_id === params.studentId &&
      a.exam_subject_id === params.examSubjectId
    );

    if (existing && existing.is_locked) {
      throw new Error(`Attendance record for Student ${params.enrollmentNo} is locked after session finalization. Use correction workflow.`);
    }

    if (existing) {
      existing.attendance_status = params.status;
      existing.marked_at = new Date().toISOString();
      existing.marked_by = params.markedBy;
      existing.arrival_time = params.arrivalTime;
      existing.remarks = params.remarks;
      return existing;
    }

    const record: ExamAttendanceRecord = {
      id: `att-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exam_session_id: params.sessionId,
      student_id: params.studentId,
      enrollment_no: params.enrollmentNo,
      student_name: params.studentName,
      exam_registration_id: params.examRegistrationId,
      exam_subject_id: params.examSubjectId,
      hall_id: params.hallId,
      seat_number: params.seatNumber,
      attendance_status: params.status,
      marked_at: new Date().toISOString(),
      marked_by: params.markedBy,
      is_locked: false,
      arrival_time: params.arrivalTime,
      remarks: params.remarks
    };

    this.attendances.push(record);
    return record;
  }

  public correctFinalizedAttendance(params: {
    attendanceId: string;
    newStatus: ExamAttendanceStatus;
    reason: string;
    correctedBy: string;
  }): ExamAttendanceRecord {
    const record = this.attendances.find(a => a.id === params.attendanceId);
    if (!record) throw new Error(`Attendance record ${params.attendanceId} not found`);

    if (!params.reason) {
      throw new Error('Audit reason is required for correcting locked attendance records');
    }

    record.attendance_status = params.newStatus;
    record.remarks = `Corrected by ${params.correctedBy}: ${params.reason}`;
    record.marked_at = new Date().toISOString();

    return record;
  }

  // ─── EXAM INCIDENT & MALPRACTICE ENGINE ───────────────────────────────

  public reportExamIncident(params: {
    sessionId: string;
    hallId: string;
    studentId?: string;
    facultyId?: string;
    incidentType: IncidentType;
    description: string;
    severity: ExamIncidentRecord['severity'];
    reportedBy: string;
  }): ExamIncidentRecord {
    const incidentNumber = `INC-2026-${(this.incidents.length + 1).toString().padStart(6, '0')}`;
    const incident: ExamIncidentRecord = {
      id: `inc-${Date.now()}`,
      incident_number: incidentNumber,
      exam_session_id: params.sessionId,
      hall_id: params.hallId,
      student_id: params.studentId,
      faculty_id: params.facultyId,
      incident_type: params.incidentType,
      description: params.description,
      severity: params.severity,
      reported_by: params.reportedBy,
      reported_at: new Date().toISOString(),
      status: 'OPEN'
    };

    this.incidents.push(incident);
    return incident;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getOperationsDashboardMetrics(context?: UserAuthorizationContext): ExamOperationsDashboardMetrics {
    const totalSessionsToday = this.sessions.length;
    const activeSessions = this.sessions.filter(s => s.status === 'IN_PROGRESS').length;
    const completedSessions = this.sessions.filter(s => s.status === 'COMPLETED').length;

    const totalInvigilatorsAssigned = this.duties.filter(d => d.status !== 'CANCELLED').length;
    const pendingDutyConfirmations = this.duties.filter(d => d.status === 'ASSIGNED').length;

    const totalStudentsRegistered = 1742;
    const totalStudentsPresent = this.attendances.filter(a => a.attendance_status === 'PRESENT').length;
    const totalStudentsAbsent = this.attendances.filter(a => a.attendance_status === 'ABSENT').length;
    const totalStudentsLate = this.attendances.filter(a => a.attendance_status === 'LATE').length;
    const openIncidentsCount = this.incidents.filter(i => i.status === 'OPEN' || i.status === 'UNDER_REVIEW').length;

    return {
      totalSessionsToday,
      activeSessions,
      completedSessions,
      totalInvigilatorsAssigned,
      pendingDutyConfirmations,
      totalStudentsRegistered,
      totalStudentsPresent,
      totalStudentsAbsent,
      totalStudentsLate,
      openIncidentsCount
    };
  }
}

export const examinationInvigilationAttendanceService = ExaminationInvigilationAttendanceService.getInstance();
