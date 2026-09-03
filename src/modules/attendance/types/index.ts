/**
 * SSIU ERP — Attendance Intelligence Domain Types
 * File: src/modules/attendance/types/index.ts
 */

export interface AttendanceAnalyticsOverviewDTO {
  totalSessionsRecorded: number;
  averageAttendancePercentage: number;
  totalStudentsEnrolled: number;
  studentsWithShortage: number; // < 75%
  criticalShortageCount: number; // < 60%
  eligibleForExamsCount: number; // >= 75%
  departmentMetrics: Array<{
    departmentId: string;
    departmentName: string;
    sessionsCount: number;
    avgPercentage: number;
    studentsShortageCount: number;
    status: 'EXCELLENT' | 'SATISFACTORY' | 'LOW';
  }>;
}

export interface StudentAttendanceShortageDTO {
  studentId: string;
  enrollmentNumber: string;
  studentName: string;
  departmentName: string;
  semester: number;
  totalClassesHeld: number;
  classesAttended: number;
  attendancePercentage: number;
  isDebarredFromExams: boolean;
  shortageSeverity: 'CRITICAL' | 'WARNING' | 'ELIGIBLE';
}

export interface AttendanceCorrectionRecordDTO {
  correctionId: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  sessionDate: string;
  originalStatus: 'ABSENT' | 'LEAVE';
  correctedStatus: 'PRESENT' | 'ON_DUTY';
  reason: string;
  approvedBy: string;
  timestamp: string;
}
