import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type StudentLifecycleStatus =
  | 'APPLICANT'
  | 'ADMITTED'
  | 'ENROLLED'
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'DEFERRED'
  | 'TRANSFERRED'
  | 'GRADUATED'
  | 'WITHDRAWN'
  | 'CANCELLED'
  | 'ALUMNI'
  | 'INACTIVE'
  | 'DECEASED';

export type StudentHoldType = 'ACADEMIC_HOLD' | 'FINANCIAL_HOLD' | 'DOCUMENT_HOLD' | 'DISCIPLINARY_HOLD';

export interface StudentStatusHistoryRecord {
  id: string;
  student_id: string;
  old_status: StudentLifecycleStatus;
  new_status: StudentLifecycleStatus;
  effective_date: string;
  reason?: string;
  remarks?: string;
  changed_by: string;
  approved_by?: string;
  created_at: string;
}

export interface StudentLifecycleEnrollmentRecord {
  id: string;
  student_id: string;
  enrollment_number: string;
  program_id: string;
  program_name: string;
  department_id: string;
  institute_id: string;
  academic_year_id: string;
  semester_id: string;
  section_id?: string;
  batch_id?: string;
  enrollment_date: string;
  start_date: string;
  end_date?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'TRANSFERRED' | 'WITHDRAWN' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface StudentHoldRecord {
  id: string;
  student_id: string;
  hold_type: StudentHoldType;
  reason: string;
  start_date: string;
  end_date?: string;
  status: 'ACTIVE' | 'RELEASED' | 'CANCELLED';
  created_by: string;
  released_by?: string;
  created_at: string;
  released_at?: string;
}

export interface StudentTimelineEvent {
  id: string;
  student_id: string;
  event_type: 'ADMISSION' | 'ENROLLMENT' | 'STATUS_CHANGE' | 'SECTION_CHANGE' | 'HOLD_PLACED' | 'HOLD_RELEASED' | 'GRADUATION';
  title: string;
  description: string;
  timestamp: string;
  performed_by: string;
}

export interface StudentLifecycleProfile {
  student_id: string; // STU-2026-000001
  enrollment_number: string; // SU26CSE0001
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  mobile: string;
  email: string;
  current_status: StudentLifecycleStatus;
  profile_completeness_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface StudentLifecycleDashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  onLeaveStudents: number;
  suspendedStudents: number;
  graduatedStudents: number;
  withdrawnStudents: number;
  alumniStudents: number;
  activeHoldsCount: number;
  averageProfileCompleteness: number;
}

class StudentLifecycleStatusEnrollmentService {
  private static instance: StudentLifecycleStatusEnrollmentService;

  private students: StudentLifecycleProfile[] = [
    {
      student_id: 'STU-2026-000001',
      enrollment_number: 'SU26CSE0001',
      first_name: 'Aarav',
      last_name: 'Patel',
      full_name: 'Aarav Patel',
      date_of_birth: '2004-06-15',
      gender: 'MALE',
      mobile: '9876543210',
      email: 'aarav.patel@swarrnim.edu.in',
      current_status: 'ACTIVE',
      profile_completeness_percentage: 95,
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-15T11:30:00Z'
    }
  ];

  private statusHistories: StudentStatusHistoryRecord[] = [
    {
      id: 'stat-hist-001',
      student_id: 'STU-2026-000001',
      old_status: 'ENROLLED',
      new_status: 'ACTIVE',
      effective_date: '2026-04-15',
      remarks: 'Student activated following successful enrollment handoff',
      changed_by: 'emp-reg-001',
      created_at: '2026-04-15T11:30:00Z'
    }
  ];

  private enrollments: StudentLifecycleEnrollmentRecord[] = [
    {
      id: 'enr-rec-001',
      student_id: 'STU-2026-000001',
      enrollment_number: 'SU26CSE0001',
      program_id: 'prog-bca',
      program_name: 'Bachelor of Computer Applications (BCA)',
      department_id: 'dept-cse',
      institute_id: 'inst-sit',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      section_id: 'sec-a',
      batch_id: 'batch-2026',
      enrollment_date: '2026-04-15',
      start_date: '2026-07-01',
      status: 'ACTIVE',
      created_at: '2026-04-15T11:30:00Z',
      updated_at: '2026-04-15T11:30:00Z'
    }
  ];

  private holds: StudentHoldRecord[] = [];
  private timelineEvents: StudentTimelineEvent[] = [
    {
      id: 'tl-001',
      student_id: 'STU-2026-000001',
      event_type: 'ADMISSION',
      title: 'Admission Confirmed',
      description: 'Admission confirmed into BCA Program under Open Category',
      timestamp: '2026-04-10T10:00:00Z',
      performed_by: 'emp-reg-001'
    },
    {
      id: 'tl-002',
      student_id: 'STU-2026-000001',
      event_type: 'ENROLLMENT',
      title: 'Enrolled in Semester 1 (Section A)',
      description: 'Assigned enrollment number SU26CSE0001',
      timestamp: '2026-04-15T11:30:00Z',
      performed_by: 'emp-reg-001'
    }
  ];

  private readonly legalTransitions: Record<StudentLifecycleStatus, StudentLifecycleStatus[]> = {
    APPLICANT: ['ADMITTED', 'CANCELLED'],
    ADMITTED: ['ENROLLED', 'WITHDRAWN', 'CANCELLED'],
    ENROLLED: ['ACTIVE', 'WITHDRAWN', 'CANCELLED'],
    ACTIVE: ['ON_LEAVE', 'SUSPENDED', 'DEFERRED', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN', 'INACTIVE'],
    ON_LEAVE: ['ACTIVE', 'WITHDRAWN'],
    SUSPENDED: ['ACTIVE', 'WITHDRAWN', 'CANCELLED'],
    DEFERRED: ['ACTIVE', 'WITHDRAWN'],
    TRANSFERRED: ['ACTIVE', 'WITHDRAWN'],
    GRADUATED: ['ALUMNI'],
    WITHDRAWN: [],
    CANCELLED: [],
    ALUMNI: [],
    INACTIVE: ['ACTIVE'],
    DECEASED: []
  };

  private constructor() {}

  public static getInstance(): StudentLifecycleStatusEnrollmentService {
    if (!StudentLifecycleStatusEnrollmentService.instance) {
      StudentLifecycleStatusEnrollmentService.instance = new StudentLifecycleStatusEnrollmentService();
    }
    return StudentLifecycleStatusEnrollmentService.instance;
  }

  // ─── STATUS TRANSITION ENGINE ─────────────────────────────────────────

  public transitionStudentStatus(params: {
    studentId: string;
    newStatus: StudentLifecycleStatus;
    effectiveDate: string;
    reason?: string;
    remarks?: string;
    changedBy: string;
    approvedBy?: string;
  }): StudentStatusHistoryRecord {
    const student = this.students.find(s => s.student_id === params.studentId);
    if (!student) throw new Error(`Student ${params.studentId} not found`);

    const currentStatus = student.current_status;
    const allowedNext = this.legalTransitions[currentStatus] || [];

    if (!allowedNext.includes(params.newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${params.newStatus}`);
    }

    const sensitiveStatuses: StudentLifecycleStatus[] = ['SUSPENDED', 'WITHDRAWN', 'TRANSFERRED', 'CANCELLED', 'DEFERRED'];
    if (sensitiveStatuses.includes(params.newStatus) && !params.reason) {
      throw new Error(`Mandatory reason required for transitioning student status to ${params.newStatus}`);
    }

    student.current_status = params.newStatus;
    student.updated_at = new Date().toISOString();

    const historyRecord: StudentStatusHistoryRecord = {
      id: `stat-hist-${Date.now()}`,
      student_id: params.studentId,
      old_status: currentStatus,
      new_status: params.newStatus,
      effective_date: params.effectiveDate,
      reason: params.reason,
      remarks: params.remarks,
      changed_by: params.changedBy,
      approved_by: params.approvedBy,
      created_at: new Date().toISOString()
    };

    this.statusHistories.push(historyRecord);

    this.timelineEvents.push({
      id: `tl-${Date.now()}`,
      student_id: params.studentId,
      event_type: 'STATUS_CHANGE',
      title: `Status Changed: ${currentStatus} → ${params.newStatus}`,
      description: params.reason || params.remarks || 'Status transition executed',
      timestamp: new Date().toISOString(),
      performed_by: params.changedBy
    });

    return historyRecord;
  }

  // ─── STUDENT MATCHING & DUPLICATE PROTECTION ─────────────────────────

  public matchStudent(params: {
    enrollmentNo?: string;
    mobile?: string;
    email?: string;
    fullName?: string;
    dob?: string;
  }): { matchStatus: 'MATCH_FOUND' | 'POSSIBLE_MATCH' | 'NO_MATCH'; matchedStudent?: StudentLifecycleProfile; matchedFields: string[] } {
    const matchedFields: string[] = [];

    const exactMatch = this.students.find(s => {
      if (params.enrollmentNo && s.enrollment_number.toLowerCase() === params.enrollmentNo.toLowerCase()) {
        matchedFields.push('enrollment_number');
        return true;
      }
      if (params.email && s.email.toLowerCase() === params.email.toLowerCase()) {
        matchedFields.push('email');
        return true;
      }
      if (params.mobile && s.mobile === params.mobile) {
        matchedFields.push('mobile');
        return true;
      }
      return false;
    });

    if (exactMatch) {
      return { matchStatus: 'MATCH_FOUND', matchedStudent: exactMatch, matchedFields };
    }

    const fuzzyMatch = this.students.find(s => {
      if (params.fullName && s.full_name.toLowerCase() === params.fullName.toLowerCase() && params.dob && s.date_of_birth === params.dob) {
        matchedFields.push('name_and_dob');
        return true;
      }
      return false;
    });

    if (fuzzyMatch) {
      return { matchStatus: 'POSSIBLE_MATCH', matchedStudent: fuzzyMatch, matchedFields };
    }

    return { matchStatus: 'NO_MATCH', matchedFields: [] };
  }

  // ─── MULTI-PROGRAM HISTORICAL ENROLLMENTS & SECTION ALLOCATION ───────

  public enrollStudentInProgram(params: {
    studentId: string;
    enrollmentNumber: string;
    programId: string;
    programName: string;
    departmentId: string;
    instituteId: string;
    academicYearId: string;
    semesterId: string;
    sectionId?: string;
    batchId?: string;
  }): StudentLifecycleEnrollmentRecord {
    const student = this.students.find(s => s.student_id === params.studentId);
    if (!student) throw new Error(`Student ${params.studentId} not found`);

    const enrollmentRecord: StudentLifecycleEnrollmentRecord = {
      id: `enr-${Date.now()}`,
      student_id: params.studentId,
      enrollment_number: params.enrollmentNumber,
      program_id: params.programId,
      program_name: params.programName,
      department_id: params.departmentId,
      institute_id: params.instituteId,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      section_id: params.sectionId,
      batch_id: params.batchId,
      enrollment_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.enrollments.push(enrollmentRecord);
    return enrollmentRecord;
  }

  public changeSection(params: {
    enrollmentId: string;
    newSectionId: string;
    reason: string;
    changedBy: string;
  }): StudentLifecycleEnrollmentRecord {
    const enr = this.enrollments.find(e => e.id === params.enrollmentId);
    if (!enr) throw new Error(`Enrollment ${params.enrollmentId} not found`);

    const oldSec = enr.section_id || 'NONE';
    enr.section_id = params.newSectionId;
    enr.updated_at = new Date().toISOString();

    this.timelineEvents.push({
      id: `tl-${Date.now()}`,
      student_id: enr.student_id,
      event_type: 'SECTION_CHANGE',
      title: `Section Changed: ${oldSec} → ${params.newSectionId}`,
      description: params.reason,
      timestamp: new Date().toISOString(),
      performed_by: params.changedBy
    });

    return enr;
  }

  // ─── STUDENT HOLD GOVERNANCE ──────────────────────────────────────────

  public placeStudentHold(params: {
    studentId: string;
    holdType: StudentHoldType;
    reason: string;
    startDate: string;
    createdBy: string;
  }): StudentHoldRecord {
    if (!params.reason) throw new Error('Mandatory reason required to place a student hold');

    const hold: StudentHoldRecord = {
      id: `hold-${Date.now()}`,
      student_id: params.studentId,
      hold_type: params.holdType,
      reason: params.reason,
      start_date: params.startDate,
      status: 'ACTIVE',
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    this.holds.push(hold);

    this.timelineEvents.push({
      id: `tl-${Date.now()}`,
      student_id: params.studentId,
      event_type: 'HOLD_PLACED',
      title: `Hold Placed: ${params.holdType}`,
      description: params.reason,
      timestamp: new Date().toISOString(),
      performed_by: params.createdBy
    });

    return hold;
  }

  public releaseStudentHold(params: {
    holdId: string;
    releasedBy: string;
  }): StudentHoldRecord {
    const hold = this.holds.find(h => h.id === params.holdId);
    if (!hold) throw new Error(`Student hold ${params.holdId} not found`);

    hold.status = 'RELEASED';
    hold.released_by = params.releasedBy;
    hold.released_at = new Date().toISOString();

    this.timelineEvents.push({
      id: `tl-${Date.now()}`,
      student_id: hold.student_id,
      event_type: 'HOLD_RELEASED',
      title: `Hold Released: ${hold.hold_type}`,
      description: `Released by ${params.releasedBy}`,
      timestamp: new Date().toISOString(),
      performed_by: params.releasedBy
    });

    return hold;
  }

  // ─── DYNAMIC PROFILE COMPLETENESS ENGINE ─────────────────────────────

  public calculateProfileCompleteness(profile: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    mobile?: string;
    email?: string;
    currentAddress?: string;
    guardianName?: string;
    guardianMobile?: string;
    aadhaarVerified?: boolean;
    photoUploaded?: boolean;
  }): number {
    const fields = [
      Boolean(profile.firstName),
      Boolean(profile.lastName),
      Boolean(profile.dob),
      Boolean(profile.mobile),
      Boolean(profile.email),
      Boolean(profile.currentAddress),
      Boolean(profile.guardianName),
      Boolean(profile.guardianMobile),
      Boolean(profile.aadhaarVerified),
      Boolean(profile.photoUploaded)
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }

  // ─── TIMELINE & 360-DEGREE DOSSIER ───────────────────────────────────

  public getStudentTimeline(studentId: string): StudentTimelineEvent[] {
    return this.timelineEvents
      .filter(t => t.student_id === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ─── LOOKUP METHODS ──────────────────────────────────────────────────

  public getStudentById(studentId: string): StudentLifecycleProfile | undefined {
    return this.students.find(s => s.student_id === studentId);
  }

  public getPrimaryEnrollment(studentId: string): StudentLifecycleEnrollmentRecord | undefined {
    return this.enrollments.find(e => e.student_id === studentId);
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getStudentLifecycleMetrics(context?: UserAuthorizationContext): StudentLifecycleDashboardMetrics {
    const totalStudents = this.students.length;
    const activeStudents = this.students.filter(s => s.current_status === 'ACTIVE').length;
    const onLeaveStudents = this.students.filter(s => s.current_status === 'ON_LEAVE').length;
    const suspendedStudents = this.students.filter(s => s.current_status === 'SUSPENDED').length;
    const graduatedStudents = this.students.filter(s => s.current_status === 'GRADUATED').length;
    const withdrawnStudents = this.students.filter(s => s.current_status === 'WITHDRAWN').length;
    const alumniStudents = this.students.filter(s => s.current_status === 'ALUMNI').length;
    const activeHoldsCount = this.holds.filter(h => h.status === 'ACTIVE').length;

    const avgCompleteness = totalStudents > 0
      ? Math.round(this.students.reduce((sum, s) => sum + s.profile_completeness_percentage, 0) / totalStudents)
      : 100;

    return {
      totalStudents,
      activeStudents,
      onLeaveStudents,
      suspendedStudents,
      graduatedStudents,
      withdrawnStudents,
      alumniStudents,
      activeHoldsCount,
      averageProfileCompleteness: avgCompleteness
    };
  }
}

export const studentLifecycleStatusEnrollmentService = StudentLifecycleStatusEnrollmentService.getInstance();
