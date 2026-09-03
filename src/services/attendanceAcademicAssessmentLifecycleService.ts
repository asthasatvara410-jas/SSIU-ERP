import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface ClassSessionRecord {
  id: string;
  courseCode: string;
  sectionName: string;
  facultyId: string;
  facultyName: string;
  sessionDate: string;
  periodNumber: number;
  roomCode: string;
  status: 'SCHEDULED' | 'OPEN' | 'COMPLETED' | 'LOCKED';
}

export interface StudentSessionAttendanceRecord {
  id: string;
  classSessionId: string;
  studentId: string;
  enrollmentNumber: string;
  courseCode: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface ContinuousAssessmentRecord {
  id: string;
  assessmentName: string;
  assessmentType: 'ASSIGNMENT' | 'QUIZ' | 'MIDTERM' | 'PRACTICAL' | 'PROJECT' | 'VIVA';
  courseCode: string;
  sectionName: string;
  maxMarks: number;
  weightagePercentage: number;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'LOCKED';
}

export interface StudentAssessmentMarkRecord {
  id: string;
  assessmentId: string;
  studentId: string;
  enrollmentNumber: string;
  marksObtained: number;
  isAbsent: boolean;
  status: 'SUBMITTED' | 'VERIFIED' | 'LOCKED';
}

class AttendanceAcademicAssessmentLifecycleService {
  private static instance: AttendanceAcademicAssessmentLifecycleService;

  private sessions: ClassSessionRecord[] = [
    {
      id: 'sess-cs301-01',
      courseCode: 'CS-301',
      sectionName: 'A',
      facultyId: 'fac-01',
      facultyName: 'Dr. Aarav Mehta',
      sessionDate: '2026-08-28',
      periodNumber: 1,
      roomCode: 'LH-101',
      status: 'LOCKED'
    }
  ];

  private attendanceRecords: StudentSessionAttendanceRecord[] = [
    { id: 'att-rec-01', classSessionId: 'sess-cs301-01', studentId: 'stud-001', enrollmentNumber: 'SSIU26BCA000059', courseCode: 'CS-301', status: 'PRESENT' }
  ];

  private assessments: ContinuousAssessmentRecord[] = [
    {
      id: 'asm-cs301-mid',
      assessmentName: 'Midterm Examination',
      assessmentType: 'MIDTERM',
      courseCode: 'CS-301',
      sectionName: 'A',
      maxMarks: 50,
      weightagePercentage: 50,
      status: 'LOCKED'
    },
    {
      id: 'asm-cs301-asg1',
      assessmentName: 'Assignment 1 (SQL Queries)',
      assessmentType: 'ASSIGNMENT',
      courseCode: 'CS-301',
      sectionName: 'A',
      maxMarks: 20,
      weightagePercentage: 25,
      status: 'LOCKED'
    },
    {
      id: 'asm-cs301-quiz1',
      assessmentName: 'Quiz 1 (Normalization)',
      assessmentType: 'QUIZ',
      courseCode: 'CS-301',
      sectionName: 'A',
      maxMarks: 20,
      weightagePercentage: 25,
      status: 'LOCKED'
    }
  ];

  private marks: StudentAssessmentMarkRecord[] = [
    { id: 'mk-01', assessmentId: 'asm-cs301-mid', studentId: 'stud-001', enrollmentNumber: 'SSIU26BCA000059', marksObtained: 44, isAbsent: false, status: 'LOCKED' },
    { id: 'mk-02', assessmentId: 'asm-cs301-asg1', studentId: 'stud-001', enrollmentNumber: 'SSIU26BCA000059', marksObtained: 18, isAbsent: false, status: 'LOCKED' },
    { id: 'mk-03', assessmentId: 'asm-cs301-quiz1', studentId: 'stud-001', enrollmentNumber: 'SSIU26BCA000059', marksObtained: 16, isAbsent: false, status: 'LOCKED' }
  ];

  private constructor() {}

  public static getInstance(): AttendanceAcademicAssessmentLifecycleService {
    if (!AttendanceAcademicAssessmentLifecycleService.instance) {
      AttendanceAcademicAssessmentLifecycleService.instance = new AttendanceAcademicAssessmentLifecycleService();
    }
    return AttendanceAcademicAssessmentLifecycleService.instance;
  }

  // ─── ATTENDANCE DERIVATION & SHORT ATTENDANCE EVALUATION ──────────────

  public calculateStudentCourseAttendance(params: {
    studentId: string;
    courseCode: string;
    totalClassesConducted: number;
    classesAttended: number;
    classesExcused?: number;
  }): {
    totalConducted: number;
    totalAttended: number;
    totalExcused: number;
    attendancePercentage: number;
    isShortAttendance: boolean;
    eligibilityStatus: 'ELIGIBLE' | 'SHORT' | 'CONDONATION_REQUIRED';
  } {
    const totalExcused = params.classesExcused || 0;
    const effectiveAttended = params.classesAttended + totalExcused;
    const attendancePercentage = params.totalClassesConducted > 0
      ? Math.round((effectiveAttended / params.totalClassesConducted) * 100)
      : 0;

    let eligibilityStatus: 'ELIGIBLE' | 'SHORT' | 'CONDONATION_REQUIRED' = 'ELIGIBLE';
    if (attendancePercentage < 65) {
      eligibilityStatus = 'SHORT';
    } else if (attendancePercentage < 75) {
      eligibilityStatus = 'CONDONATION_REQUIRED';
    }

    return {
      totalConducted: params.totalClassesConducted,
      totalAttended: params.classesAttended,
      totalExcused,
      attendancePercentage,
      isShortAttendance: attendancePercentage < 75,
      eligibilityStatus
    };
  }

  // ─── CONTINUOUS INTERNAL ASSESSMENT WEIGHTED SCORE ───────────────────

  public calculateContinuousInternalScore(studentId: string, courseCode: string): {
    totalInternalMarks: number;
    maxPossibleInternalMarks: number;
    percentage: number;
  } {
    const courseAssessments = this.assessments.filter(a => a.courseCode === courseCode);
    let weightedScoreTotal = 0;

    for (const asm of courseAssessments) {
      const markRec = this.marks.find(m => m.assessmentId === asm.id && m.studentId === studentId);
      const score = markRec && !markRec.isAbsent ? markRec.marksObtained : 0;
      const normalizedComponentScore = (score / asm.maxMarks) * asm.weightagePercentage;
      weightedScoreTotal += normalizedComponentScore;
    }

    const totalInternalMarks = Number(weightedScoreTotal.toFixed(2));
    return {
      totalInternalMarks,
      maxPossibleInternalMarks: 100,
      percentage: totalInternalMarks
    };
  }

  // ─── TIMETABLE CONFLICT DETECTION ─────────────────────────────────────

  public validateTimetableSlot(params: {
    facultyId: string;
    roomCode: string;
    sectionName: string;
    dayOfWeek: string;
    periodNumber: number;
    existingSchedule: {
      facultyId: string;
      roomCode: string;
      sectionName: string;
      dayOfWeek: string;
      periodNumber: number;
    }[];
  }): { isValid: boolean; conflictReason?: string } {
    for (const item of params.existingSchedule) {
      if (item.dayOfWeek === params.dayOfWeek && item.periodNumber === params.periodNumber) {
        if (item.facultyId === params.facultyId) {
          return { isValid: false, conflictReason: `Faculty double-booking conflict in Period ${params.periodNumber}` };
        }
        if (item.roomCode === params.roomCode) {
          return { isValid: false, conflictReason: `Room double-booking conflict (${params.roomCode}) in Period ${params.periodNumber}` };
        }
        if (item.sectionName === params.sectionName) {
          return { isValid: false, conflictReason: `Section ${params.sectionName} already has a scheduled class in Period ${params.periodNumber}` };
        }
      }
    }
    return { isValid: true };
  }
}

export const attendanceAcademicAssessmentLifecycleService = AttendanceAcademicAssessmentLifecycleService.getInstance();
