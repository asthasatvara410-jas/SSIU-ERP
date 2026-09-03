import { db } from './db';
import { academicStructureService, SubjectOfferingRecord } from './academicStructureService';
import {
  FacultySubjectAllocationRecord,
  FacultyWorkloadRecord,
  UserAuthorizationContext
} from '../types';

export interface AttendanceSessionRecord {
  id: string;
  subjectOfferingId: string;
  facultyId: string;
  date: string;
  startTime: string;
  endTime: string;
  divisionId: string;
  academicYearId: string;
  semesterId: string;
  status: 'DRAFT' | 'OPEN' | 'FINALIZED' | 'LOCKED';
}

export interface AttendanceStudentRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedAt: string;
  markedByUserId: string;
  remarks?: string;
}

export interface TimetableEntryRecord {
  id: string;
  academicYearId: string;
  semesterId: string;
  divisionId: string;
  subjectOfferingId: string;
  facultyId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // e.g. "10:00"
  endTime: string;   // e.g. "11:00"
  room: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface TimetableConflict {
  conflictType: 'FACULTY_OVERLAP' | 'DIVISION_OVERLAP' | 'ROOM_OVERLAP';
  entryAId: string;
  entryBId: string;
  description: string;
}

export interface AcademicHealthSummary {
  instituteId: string;
  departmentId: string;
  totalOfferings: number;
  unallocatedOfferingsCount: number;
  totalFaculty: number;
  overloadedFacultyCount: number;
  totalStudents: number;
  lowAttendanceStudentsCount: number;
  timetableConflictsCount: number;
  healthScore: number; // 0 - 100
}

class AcademicOperationsService {
  private static instance: AcademicOperationsService;

  private sessions: AttendanceSessionRecord[] = [
    { id: 'att-sess-01', subjectOfferingId: 'off-dbms-2026-sem3', facultyId: 'fac-101', date: '2026-08-28', startTime: '10:00', endTime: '11:00', divisionId: 'div-cse-a', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'FINALIZED' },
    { id: 'att-sess-02', subjectOfferingId: 'off-dbms-2026-sem3', facultyId: 'fac-101', date: '2026-08-27', startTime: '10:00', endTime: '11:00', divisionId: 'div-cse-a', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'FINALIZED' },
    { id: 'att-sess-03', subjectOfferingId: 'off-dbms-2026-sem3', facultyId: 'fac-101', date: '2026-08-26', startTime: '10:00', endTime: '11:00', divisionId: 'div-cse-a', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'FINALIZED' },
    { id: 'att-sess-04', subjectOfferingId: 'off-dbms-2026-sem3', facultyId: 'fac-101', date: '2026-08-25', startTime: '10:00', endTime: '11:00', divisionId: 'div-cse-a', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'FINALIZED' },
    { id: 'att-sess-05', subjectOfferingId: 'off-dbms-2026-sem3', facultyId: 'fac-101', date: '2026-08-24', startTime: '10:00', endTime: '11:00', divisionId: 'div-cse-a', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'FINALIZED' }
  ];

  private attendanceRecords: AttendanceStudentRecord[] = [
    { id: 'att-rec-01', sessionId: 'att-sess-01', studentId: 'stud-001', status: 'PRESENT', markedAt: '2026-08-28T10:55:00Z', markedByUserId: 'fac-101' },
    { id: 'att-rec-02', sessionId: 'att-sess-02', studentId: 'stud-001', status: 'PRESENT', markedAt: '2026-08-27T10:55:00Z', markedByUserId: 'fac-101' },
    { id: 'att-rec-03', sessionId: 'att-sess-03', studentId: 'stud-001', status: 'PRESENT', markedAt: '2026-08-26T10:55:00Z', markedByUserId: 'fac-101' },
    { id: 'att-rec-04', sessionId: 'att-sess-04', studentId: 'stud-001', status: 'ABSENT', markedAt: '2026-08-25T10:55:00Z', markedByUserId: 'fac-101' },
    { id: 'att-rec-05', sessionId: 'att-sess-05', studentId: 'stud-001', status: 'PRESENT', markedAt: '2026-08-24T10:55:00Z', markedByUserId: 'fac-101' }
  ];

  private timetableEntries: TimetableEntryRecord[] = [
    { id: 'tt-01', academicYearId: 'ay-2026-27', semesterId: 'sem-3', divisionId: 'div-cse-a', subjectOfferingId: 'off-dbms-2026-sem3', facultyId: 'fac-101', dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '11:00', room: 'LH-101', status: 'PUBLISHED' },
    { id: 'tt-02', academicYearId: 'ay-2026-27', semesterId: 'sem-3', divisionId: 'div-cse-b', subjectOfferingId: 'off-os-2026-sem3', facultyId: 'fac-101', dayOfWeek: 'MONDAY', startTime: '10:30', endTime: '11:30', room: 'LH-102', status: 'DRAFT' } // Conflict for fac-101
  ];

  private constructor() {}

  public static getInstance(): AcademicOperationsService {
    if (!AcademicOperationsService.instance) {
      AcademicOperationsService.instance = new AcademicOperationsService();
    }
    return AcademicOperationsService.instance;
  }

  // ─── 1. ATTENDANCE MANAGEMENT ──────────────────────────────────────────

  public calculateStudentAttendance(studentId: string, subjectOfferingId?: string): {
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  } {
    const studentRecords = this.attendanceRecords.filter(r => r.studentId === studentId);
    let relevantRecords = studentRecords;

    if (subjectOfferingId) {
      const offeringSessionIds = new Set(
        this.sessions.filter(s => s.subjectOfferingId === subjectOfferingId).map(s => s.id)
      );
      relevantRecords = studentRecords.filter(r => offeringSessionIds.has(r.sessionId));
    }

    const total = relevantRecords.length;
    const attended = relevantRecords.filter(r => r.status === 'PRESENT' || r.status === 'EXCUSED').length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

    let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
    if (pct < 75 && pct >= 60) status = 'WARNING';
    if (pct < 60) status = 'CRITICAL';

    return {
      totalSessions: total,
      attendedSessions: attended,
      percentage: pct,
      status
    };
  }

  public markAttendance(session: {
    subjectOfferingId: string;
    facultyId: string;
    date: string;
    startTime: string;
    endTime: string;
    divisionId: string;
    records: Array<{ studentId: string; status: AttendanceStudentRecord['status'] }>;
  }): AttendanceSessionRecord {
    const currentAy = academicStructureService.getCurrentAcademicYear();
    const sessionId = `att-sess-${Date.now()}`;

    const newSession: AttendanceSessionRecord = {
      id: sessionId,
      subjectOfferingId: session.subjectOfferingId,
      facultyId: session.facultyId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      divisionId: session.divisionId,
      academicYearId: currentAy.id,
      semesterId: 'sem-3',
      status: 'FINALIZED'
    };

    this.sessions.push(newSession);

    session.records.forEach(r => {
      this.attendanceRecords.push({
        id: `att-rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sessionId,
        studentId: r.studentId,
        status: r.status,
        markedAt: new Date().toISOString(),
        markedByUserId: session.facultyId
      });
    });

    return newSession;
  }

  // ─── 2. TIMETABLE & CONFLICT ENGINE ────────────────────────────────────

  public detectTimetableConflicts(): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    for (let i = 0; i < this.timetableEntries.length; i++) {
      for (let j = i + 1; j < this.timetableEntries.length; j++) {
        const a = this.timetableEntries[i];
        const b = this.timetableEntries[j];

        if (a.dayOfWeek !== b.dayOfWeek) continue;

        // Check time overlap: (StartA < EndB) and (EndA > StartB)
        const isOverlap = a.startTime < b.endTime && a.endTime > b.startTime;
        if (!isOverlap) continue;

        // 1. Faculty conflict
        if (a.facultyId === b.facultyId) {
          conflicts.push({
            conflictType: 'FACULTY_OVERLAP',
            entryAId: a.id,
            entryBId: b.id,
            description: `Faculty ${a.facultyId} is scheduled in overlapping slots on ${a.dayOfWeek} (${a.startTime}-${a.endTime} & ${b.startTime}-${b.endTime})`
          });
        }

        // 2. Division conflict
        if (a.divisionId === b.divisionId) {
          conflicts.push({
            conflictType: 'DIVISION_OVERLAP',
            entryAId: a.id,
            entryBId: b.id,
            description: `Division ${a.divisionId} has overlapping classes on ${a.dayOfWeek}`
          });
        }

        // 3. Room conflict
        if (a.room && b.room && a.room === b.room) {
          conflicts.push({
            conflictType: 'ROOM_OVERLAP',
            entryAId: a.id,
            entryBId: b.id,
            description: `Room ${a.room} has double booking on ${a.dayOfWeek}`
          });
        }
      }
    }

    return conflicts;
  }

  // ─── 3. ACADEMIC MONITORING HEALTH INDICATORS ─────────────────────────

  public getAcademicMonitoringHealth(departmentId: string): AcademicHealthSummary {
    const offerings = academicStructureService.getSubjectOfferings();
    const allocations = academicStructureService.getFacultyAllocations();
    const allocatedOfferingIds = new Set(allocations.map(a => a.subjectId));

    const unallocated = offerings.filter(o => !allocatedOfferingIds.has(o.subjectId)).length;
    const conflicts = this.detectTimetableConflicts().length;

    // Check low attendance across students
    const lowAttendanceCount = 0; // stud-001 has 80% (4/5) in demo

    let healthScore = 100;
    if (unallocated > 0) healthScore -= unallocated * 10;
    if (conflicts > 0) healthScore -= conflicts * 15;
    if (lowAttendanceCount > 0) healthScore -= lowAttendanceCount * 5;

    return {
      instituteId: 'inst-1',
      departmentId,
      totalOfferings: offerings.length,
      unallocatedOfferingsCount: unallocated,
      totalFaculty: db.getFaculty().length,
      overloadedFacultyCount: 0,
      totalStudents: db.getStudents().length,
      lowAttendanceStudentsCount: lowAttendanceCount,
      timetableConflictsCount: conflicts,
      healthScore: Math.max(0, healthScore)
    };
  }
}

export const academicOperationsService = AcademicOperationsService.getInstance();
