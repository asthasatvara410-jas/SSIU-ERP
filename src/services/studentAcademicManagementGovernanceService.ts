import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface CourseSectionRecord {
  id: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  semesterNumber: number;
  facultyId: string;
  facultyName: string;
  credits: number;
}

export interface StudentCourseRegistrationRecord {
  id: string;
  studentId: string;
  courseSectionId: string;
  courseCode: string;
  academicTerm: string;
  classesConducted: number;
  classesAttended: number;
  internalAssessmentScore: number; // Max 50
  status: 'REGISTERED' | 'DROPPED' | 'COMPLETED';
}

export interface StudentAcademicDossierRecord {
  studentId: string;
  enrollmentNumber: string;
  rollNumber: string;
  programName: string;
  batchName: string;
  currentSemester: number;
  overallAttendancePercentage: number;
  totalCreditsEarned: number;
  cgpa: number;
  activeBacklogsCount: number;
  atRiskStatus: 'NORMAL' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
  academicStatus: 'ACTIVE' | 'PROMOTED' | 'DETAINED';
}

class StudentAcademicManagementGovernanceService {
  private static instance: StudentAcademicManagementGovernanceService;

  private courseSections: CourseSectionRecord[] = [
    {
      id: 'sec-cs301-a',
      courseCode: 'CS-301',
      courseName: 'Database Management Systems',
      sectionName: 'A',
      semesterNumber: 3,
      facultyId: 'fac-01',
      facultyName: 'Dr. Aarav Mehta',
      credits: 4
    },
    {
      id: 'sec-cs302-a',
      courseCode: 'CS-302',
      courseName: 'Data Structures & Algorithms',
      sectionName: 'A',
      semesterNumber: 3,
      facultyId: 'fac-02',
      facultyName: 'Prof. Sneha Patel',
      credits: 4
    }
  ];

  private registrations: StudentCourseRegistrationRecord[] = [
    {
      id: 'reg-01',
      studentId: 'stud-001',
      courseSectionId: 'sec-cs301-a',
      courseCode: 'CS-301',
      academicTerm: 'Autumn 2026',
      classesConducted: 40,
      classesAttended: 34, // 85%
      internalAssessmentScore: 42,
      status: 'REGISTERED'
    },
    {
      id: 'reg-02',
      studentId: 'stud-001',
      courseSectionId: 'sec-cs302-a',
      courseCode: 'CS-302',
      academicTerm: 'Autumn 2026',
      classesConducted: 40,
      classesAttended: 28, // 70% (Short)
      internalAssessmentScore: 35,
      status: 'REGISTERED'
    }
  ];

  private constructor() {}

  public static getInstance(): StudentAcademicManagementGovernanceService {
    if (!StudentAcademicManagementGovernanceService.instance) {
      StudentAcademicManagementGovernanceService.instance = new StudentAcademicManagementGovernanceService();
    }
    return StudentAcademicManagementGovernanceService.instance;
  }

  // ─── ATTENDANCE & SHORT ATTENDANCE CALCULATION ────────────────────────

  public getCourseAttendance(studentId: string, courseCode: string): {
    classesConducted: number;
    classesAttended: number;
    attendancePercentage: number;
    attendanceFlag: 'ELIGIBLE' | 'WARNING' | 'SHORT';
  } {
    const reg = this.registrations.find(r => r.studentId === studentId && r.courseCode === courseCode);
    if (!reg) throw new Error(`Course registration not found for ${studentId} and ${courseCode}`);

    const attendancePercentage = reg.classesConducted > 0
      ? Math.round((reg.classesAttended / reg.classesConducted) * 100)
      : 0;

    let attendanceFlag: 'ELIGIBLE' | 'WARNING' | 'SHORT' = 'ELIGIBLE';
    if (attendancePercentage < 75) {
      attendanceFlag = 'SHORT';
    } else if (attendancePercentage < 80) {
      attendanceFlag = 'WARNING';
    }

    return {
      classesConducted: reg.classesConducted,
      classesAttended: reg.classesAttended,
      attendancePercentage,
      attendanceFlag
    };
  }

  // ─── AT-RISK ACADEMIC EVALUATION ENGINE ───────────────────────────────

  public evaluateAtRiskStatus(params: {
    overallAttendancePercentage: number;
    cgpa: number;
    activeBacklogsCount: number;
  }): 'NORMAL' | 'WATCH' | 'AT_RISK' | 'CRITICAL' {
    if (params.activeBacklogsCount >= 3 || params.overallAttendancePercentage < 65 || params.cgpa < 4.0) {
      return 'CRITICAL';
    }
    if (params.activeBacklogsCount >= 1 || params.overallAttendancePercentage < 75 || params.cgpa < 5.5) {
      return 'AT_RISK';
    }
    if (params.overallAttendancePercentage < 80 || params.cgpa < 6.5) {
      return 'WATCH';
    }
    return 'NORMAL';
  }

  // ─── PROMOTION & DETENTION GOVERNANCE ─────────────────────────────────

  public evaluateSemesterPromotion(params: {
    earnedCredits: number;
    requiredCredits: number;
    maxAllowedBacklogs: number;
    activeBacklogsCount: number;
  }): {
    decision: 'PROMOTED' | 'DETAINED';
    reason: string;
  } {
    if (params.earnedCredits < params.requiredCredits) {
      return {
        decision: 'DETAINED',
        reason: `Insufficient credits earned (${params.earnedCredits}/${params.requiredCredits} required)`
      };
    }
    if (params.activeBacklogsCount > params.maxAllowedBacklogs) {
      return {
        decision: 'DETAINED',
        reason: `Active backlogs (${params.activeBacklogsCount}) exceed maximum allowed threshold (${params.maxAllowedBacklogs})`
      };
    }
    return {
      decision: 'PROMOTED',
      reason: 'Academic progression criteria satisfied'
    };
  }
}

export const studentAcademicManagementGovernanceService = StudentAcademicManagementGovernanceService.getInstance();
