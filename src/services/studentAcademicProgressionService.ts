import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type AcademicStatus =
  | 'ACTIVE'
  | 'PROMOTED'
  | 'NOT_PROMOTED'
  | 'CONDITIONAL'
  | 'DETAINED'
  | 'COMPLETED'
  | 'WITHDRAWN'
  | 'TRANSFERRED';

export type ProgressionDecision = 'PROMOTED' | 'NOT_PROMOTED' | 'CONDITIONAL' | 'DETAINED' | 'COMPLETED';

export type BacklogStatus = 'ACTIVE' | 'CLEARED' | 'CARRIED_FORWARD' | 'WAIVED' | 'CANCELLED';

export type AcademicStandingType = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'PROBATION' | 'CRITICAL' | 'COMPLETED';

export interface StudentAcademicRecord {
  id: string;
  student_id: string;
  enrollment_id: string;
  academic_year_id: string;
  semester_id: string;
  program_id: string;
  department_id: string;
  institute_id: string;
  section_id?: string;
  batch_id?: string;
  academic_status: AcademicStatus;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAcademicProgressionRecord {
  id: string;
  student_id: string;
  enrollment_id: string;
  from_academic_year_id: string;
  from_semester_id: string;
  to_academic_year_id: string;
  to_semester_id: string;
  from_section_id?: string;
  to_section_id?: string;
  decision: ProgressionDecision;
  decision_date: string;
  reason?: string;
  rule_version: string;
  approved_by: string;
  created_at: string;
}

export interface StudentBacklogRecord {
  id: string;
  student_id: string;
  enrollment_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  academic_year_id: string;
  semester_id: string;
  attempt_number: number;
  status: BacklogStatus;
  result_reference?: string;
  cleared_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAcademicStandingRecord {
  id: string;
  student_id: string;
  semester_id: string;
  academic_year_id: string;
  standing: AcademicStandingType;
  cgpa: number;
  backlog_count: number;
  attendance_percentage: number;
  reason: string;
  calculated_at: string;
}

export interface StudentSectionAssignmentRecord {
  id: string;
  student_id: string;
  enrollment_id: string;
  academic_year_id: string;
  semester_id: string;
  section_id: string;
  section_name: string;
  status: 'ACTIVE' | 'TRANSFERRED';
  start_date: string;
  end_date?: string;
  assigned_by: string;
  created_at: string;
}

export interface SectionCapacityRecord {
  id: string;
  program_id: string;
  semester_id: string;
  section_name: string;
  capacity: number;
  assigned_count: number;
}

export interface AcademicProgressionDashboardMetrics {
  totalAcademicStudents: number;
  promotedStudents: number;
  conditionalPromotions: number;
  detainedStudents: number;
  graduatingStudents: number;
  studentsWithBacklogs: number;
  totalActiveBacklogs: number;
  warningProbationCount: number;
  averageCGPA: number;
}

class StudentAcademicProgressionService {
  private static instance: StudentAcademicProgressionService;

  private academicRecords: StudentAcademicRecord[] = [
    {
      id: 'acad-rec-001',
      student_id: 'STU-2026-000001',
      enrollment_id: 'enr-rec-001',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      program_id: 'prog-bca',
      department_id: 'dept-cse',
      institute_id: 'inst-sit',
      section_id: 'sec-a',
      batch_id: 'batch-2026',
      academic_status: 'ACTIVE',
      start_date: '2026-07-01',
      created_at: '2026-04-15T11:30:00Z',
      updated_at: '2026-04-15T11:30:00Z'
    }
  ];

  private progressions: StudentAcademicProgressionRecord[] = [];

  private backlogs: StudentBacklogRecord[] = [];

  private standings: StudentAcademicStandingRecord[] = [
    {
      id: 'stand-001',
      student_id: 'STU-2026-000001',
      semester_id: 'sem-01',
      academic_year_id: 'ay-2026-27',
      standing: 'EXCELLENT',
      cgpa: 8.85,
      backlog_count: 0,
      attendance_percentage: 92.5,
      reason: 'Outstanding academic performance with >90% attendance and zero backlogs',
      calculated_at: '2026-08-10T10:00:00Z'
    }
  ];

  private sectionAssignments: StudentSectionAssignmentRecord[] = [
    {
      id: 'sec-assign-001',
      student_id: 'STU-2026-000001',
      enrollment_id: 'enr-rec-001',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      section_id: 'sec-a',
      section_name: 'Section A',
      status: 'ACTIVE',
      start_date: '2026-07-01',
      assigned_by: 'emp-reg-001',
      created_at: '2026-04-15T11:30:00Z'
    }
  ];

  private sections: SectionCapacityRecord[] = [
    {
      id: 'sec-a',
      program_id: 'prog-bca',
      semester_id: 'sem-01',
      section_name: 'Section A',
      capacity: 60,
      assigned_count: 1
    },
    {
      id: 'sec-b',
      program_id: 'prog-bca',
      semester_id: 'sem-01',
      section_name: 'Section B',
      capacity: 60,
      assigned_count: 0
    }
  ];

  private constructor() {}

  public static getInstance(): StudentAcademicProgressionService {
    if (!StudentAcademicProgressionService.instance) {
      StudentAcademicProgressionService.instance = new StudentAcademicProgressionService();
    }
    return StudentAcademicProgressionService.instance;
  }

  // ─── PROMOTION RULE & CALCULATION ENGINE ──────────────────────────────

  public evaluatePromotionRecommendation(params: {
    studentId: string;
    creditsEarned: number;
    requiredCredits: number;
    activeBacklogCount: number;
    maxAllowedBacklogs: number; // e.g. 2 for conditional promotion
    attendancePercentage: number;
    minAttendanceRequired: number; // e.g. 75%
    isFinalSemester?: boolean;
  }): { recommendation: ProgressionDecision; reason: string } {
    if (params.attendancePercentage < params.minAttendanceRequired) {
      return {
        recommendation: 'DETAINED',
        reason: `Attendance (${params.attendancePercentage}%) is below mandatory threshold (${params.minAttendanceRequired}%)`
      };
    }

    if (params.isFinalSemester) {
      if (params.activeBacklogCount === 0 && params.creditsEarned >= params.requiredCredits) {
        return {
          recommendation: 'COMPLETED',
          reason: 'All degree curriculum requirements cleared; student ready for graduation'
        };
      } else {
        return {
          recommendation: 'NOT_PROMOTED',
          reason: `Final semester backlog remaining (${params.activeBacklogCount} backlogs); degree completion pending`
        };
      }
    }

    if (params.activeBacklogCount === 0 && params.creditsEarned >= params.requiredCredits) {
      return {
        recommendation: 'PROMOTED',
        reason: 'All courses cleared successfully with full credits'
      };
    }

    if (params.activeBacklogCount <= params.maxAllowedBacklogs) {
      return {
        recommendation: 'CONDITIONAL',
        reason: `Promoted with ${params.activeBacklogCount} carried forward backlog(s) within permissible limit (max ${params.maxAllowedBacklogs})`
      };
    }

    return {
      recommendation: 'DETAINED',
      reason: `Backlogs (${params.activeBacklogCount}) exceed permissible progression threshold (max ${params.maxAllowedBacklogs})`
    };
  }

  public executeProgressionDecision(params: {
    studentId: string;
    enrollmentId: string;
    fromAcademicYearId: string;
    fromSemesterId: string;
    toAcademicYearId: string;
    toSemesterId: string;
    fromSectionId?: string;
    toSectionId?: string;
    decision: ProgressionDecision;
    reason: string;
    ruleVersion: string;
    approvedBy: string;
  }): StudentAcademicProgressionRecord {
    const progression: StudentAcademicProgressionRecord = {
      id: `prog-${Date.now()}`,
      student_id: params.studentId,
      enrollment_id: params.enrollmentId,
      from_academic_year_id: params.fromAcademicYearId,
      from_semester_id: params.fromSemesterId,
      to_academic_year_id: params.toAcademicYearId,
      to_semester_id: params.toSemesterId,
      from_section_id: params.fromSectionId,
      to_section_id: params.toSectionId,
      decision: params.decision,
      decision_date: new Date().toISOString().split('T')[0],
      reason: params.reason,
      rule_version: params.ruleVersion,
      approved_by: params.approvedBy,
      created_at: new Date().toISOString()
    };

    this.progressions.push(progression);

    // Update current academic record status
    const currentRec = this.academicRecords.find(r => r.student_id === params.studentId && r.semester_id === params.fromSemesterId);
    if (currentRec) {
      currentRec.academic_status = params.decision as AcademicStatus;
      currentRec.updated_at = new Date().toISOString();
    }

    // If promoted or conditional, create next academic context
    if (params.decision === 'PROMOTED' || params.decision === 'CONDITIONAL') {
      const nextRecord: StudentAcademicRecord = {
        id: `acad-rec-${Date.now()}`,
        student_id: params.studentId,
        enrollment_id: params.enrollmentId,
        academic_year_id: params.toAcademicYearId,
        semester_id: params.toSemesterId,
        program_id: currentRec?.program_id || 'prog-bca',
        department_id: currentRec?.department_id || 'dept-cse',
        institute_id: currentRec?.institute_id || 'inst-sit',
        section_id: params.toSectionId,
        academic_status: 'ACTIVE',
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.academicRecords.push(nextRecord);
    }

    return progression;
  }

  // ─── BACKLOG MANAGEMENT & CLEARANCE ───────────────────────────────────

  public recordBacklog(params: {
    studentId: string;
    enrollmentId: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    academicYearId: string;
    semesterId: string;
    attemptNumber?: number;
    resultReference?: string;
  }): StudentBacklogRecord {
    const existing = this.backlogs.find(b =>
      b.student_id === params.studentId &&
      b.subject_id === params.subjectId &&
      b.status === 'ACTIVE'
    );

    if (existing) return existing;

    const backlog: StudentBacklogRecord = {
      id: `bl-${Date.now()}`,
      student_id: params.studentId,
      enrollment_id: params.enrollmentId,
      subject_id: params.subjectId,
      subject_code: params.subjectCode,
      subject_name: params.subjectName,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      attempt_number: params.attemptNumber || 1,
      status: 'ACTIVE',
      result_reference: params.resultReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.backlogs.push(backlog);
    return backlog;
  }

  public clearBacklog(params: {
    backlogId: string;
    resultReference: string;
  }): StudentBacklogRecord {
    const bl = this.backlogs.find(b => b.id === params.backlogId);
    if (!bl) throw new Error(`Backlog record ${params.backlogId} not found`);

    bl.status = 'CLEARED';
    bl.result_reference = params.resultReference;
    bl.cleared_at = new Date().toISOString();
    bl.updated_at = new Date().toISOString();

    return bl;
  }

  // ─── ACADEMIC STANDING & INTERVENTION ENGINE ─────────────────────────

  public calculateAcademicStanding(params: {
    studentId: string;
    semesterId: string;
    academicYearId: string;
    cgpa: number;
    backlogCount: number;
    attendancePercentage: number;
  }): StudentAcademicStandingRecord {
    let standing: AcademicStandingType = 'GOOD';
    let reason = 'Normal academic progression in good standing';

    if (params.cgpa >= 8.5 && params.backlogCount === 0 && params.attendancePercentage >= 85) {
      standing = 'EXCELLENT';
      reason = 'Dean’s Honour Roll / Excellent academic standing';
    } else if (params.backlogCount >= 3 || params.cgpa < 4.5) {
      standing = 'CRITICAL';
      reason = 'Critical academic standing due to multiple backlogs / low CGPA';
    } else if (params.backlogCount >= 1 || params.cgpa < 5.5) {
      standing = 'WARNING';
      reason = 'Academic warning issued for backlogs / performance improvement required';
    } else if (params.attendancePercentage < 75) {
      standing = 'PROBATION';
      reason = 'Attendance probation: student attendance below 75%';
    }

    const standingRec: StudentAcademicStandingRecord = {
      id: `stand-${Date.now()}`,
      student_id: params.studentId,
      semester_id: params.semesterId,
      academic_year_id: params.academicYearId,
      standing,
      cgpa: params.cgpa,
      backlog_count: params.backlogCount,
      attendance_percentage: params.attendancePercentage,
      reason,
      calculated_at: new Date().toISOString()
    };

    this.standings.push(standingRec);
    return standingRec;
  }

  // ─── SECTION MANAGEMENT & CAPACITY OVER-ALLOCATION GUARD ─────────────

  public assignSection(params: {
    studentId: string;
    enrollmentId: string;
    academicYearId: string;
    semesterId: string;
    sectionId: string;
    assignedBy: string;
  }): StudentSectionAssignmentRecord {
    const sec = this.sections.find(s => s.id === params.sectionId);
    if (!sec) throw new Error(`Section ${params.sectionId} not found`);

    if (sec.assigned_count >= sec.capacity) {
      throw new Error(`Section ${sec.section_name} is already at full capacity (${sec.capacity})`);
    }

    sec.assigned_count += 1;

    const assignment: StudentSectionAssignmentRecord = {
      id: `sec-assign-${Date.now()}`,
      student_id: params.studentId,
      enrollment_id: params.enrollmentId,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      section_id: params.sectionId,
      section_name: sec.section_name,
      status: 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      assigned_by: params.assignedBy,
      created_at: new Date().toISOString()
    };

    this.sectionAssignments.push(assignment);
    return assignment;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getProgressionDashboardMetrics(context?: UserAuthorizationContext): AcademicProgressionDashboardMetrics {
    const totalAcademicStudents = this.academicRecords.length;
    const promotedStudents = this.progressions.filter(p => p.decision === 'PROMOTED').length;
    const conditionalPromotions = this.progressions.filter(p => p.decision === 'CONDITIONAL').length;
    const detainedStudents = this.progressions.filter(p => p.decision === 'DETAINED').length;
    const graduatingStudents = this.progressions.filter(p => p.decision === 'COMPLETED').length;

    const activeBacklogs = this.backlogs.filter(b => b.status === 'ACTIVE');
    const studentsWithBacklogs = new Set(activeBacklogs.map(b => b.student_id)).size;
    const totalActiveBacklogs = activeBacklogs.length;

    const warningProbationCount = this.standings.filter(s => s.standing === 'WARNING' || s.standing === 'PROBATION' || s.standing === 'CRITICAL').length;

    const totalCGPA = this.standings.reduce((sum, s) => sum + s.cgpa, 0);
    const averageCGPA = this.standings.length > 0 ? Number((totalCGPA / this.standings.length).toFixed(2)) : 8.0;

    return {
      totalAcademicStudents,
      promotedStudents,
      conditionalPromotions,
      detainedStudents,
      graduatingStudents,
      studentsWithBacklogs,
      totalActiveBacklogs,
      warningProbationCount,
      averageCGPA
    };
  }
}

export const studentAcademicProgressionService = StudentAcademicProgressionService.getInstance();
