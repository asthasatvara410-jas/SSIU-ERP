import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type LifecycleEventType =
  | 'ADMISSION'
  | 'ENROLLMENT'
  | 'ACTIVATION'
  | 'LEAVE'
  | 'LEAVE_RETURN'
  | 'SUSPENSION'
  | 'SUSPENSION_RETURN'
  | 'DEFERMENT'
  | 'REACTIVATION'
  | 'INTERNAL_TRANSFER'
  | 'EXTERNAL_TRANSFER'
  | 'WITHDRAWAL'
  | 'REJOIN'
  | 'COMPLETION'
  | 'GRADUATION'
  | 'ALUMNI_HANDOFF'
  | 'CANCELLATION';

export type LifecycleStatus =
  | 'APPLICANT'
  | 'ADMITTED'
  | 'ENROLLED'
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'DEFERRED'
  | 'TRANSFERRED'
  | 'WITHDRAWN'
  | 'COMPLETED'
  | 'GRADUATED'
  | 'ALUMNI'
  | 'CANCELLED';

export interface StudentLifecycleEventRecord {
  id: string;
  student_id: string;
  enrollment_id?: string;
  event_type: LifecycleEventType;
  from_status: LifecycleStatus;
  to_status: LifecycleStatus;
  effective_date: string;
  event_date: string;
  reason?: string;
  remarks?: string;
  reference_type?: string;
  reference_id?: string;
  initiated_by: string;
  approved_by?: string;
  created_at: string;
}

export interface StudentTransferRecord {
  id: string;
  student_id: string;
  from_enrollment_id: string;
  to_enrollment_id?: string;
  from_institute_id: string;
  to_institute_id: string;
  from_department_id: string;
  to_department_id: string;
  from_program_id: string;
  to_program_id: string;
  transfer_type: 'INTERNAL' | 'EXTERNAL';
  destination_institution?: string;
  request_date: string;
  effective_date: string;
  reason: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  requested_by: string;
  approved_by?: string;
  created_at: string;
}

export interface StudentRejoinRecord {
  id: string;
  student_id: string;
  previous_status: LifecycleStatus;
  rejoin_date: string;
  program_id: string;
  academic_year_id: string;
  semester_id: string;
  reason: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface StudentGraduationRecord {
  id: string;
  student_id: string;
  enrollment_id: string;
  program_id: string;
  academic_year_id: string;
  batch_id: string;
  completion_date: string;
  graduation_date: string;
  degree_awarded: string;
  status: 'COMPLETED' | 'GRADUATED' | 'ALUMNI_HANDOFF';
  approved_by: string;
  created_at: string;
}

export interface StudentLifecycleStateMetrics {
  totalStudents: number;
  activeCount: number;
  onLeaveCount: number;
  suspendedCount: number;
  deferredCount: number;
  transferredCount: number;
  withdrawnCount: number;
  completedCount: number;
  graduatedCount: number;
  alumniCount: number;
  pendingTransfers: number;
  pendingWithdrawals: number;
  pendingGraduations: number;
}

class StudentLifecycleStateMachineService {
  private static instance: StudentLifecycleStateMachineService;

  private currentStatuses: Record<string, LifecycleStatus> = {
    'STU-2026-000001': 'ACTIVE'
  };

  private events: StudentLifecycleEventRecord[] = [
    {
      id: 'evt-001',
      student_id: 'STU-2026-000001',
      enrollment_id: 'enr-rec-001',
      event_type: 'ADMISSION',
      from_status: 'APPLICANT',
      to_status: 'ADMITTED',
      effective_date: '2026-04-10',
      event_date: '2026-04-10',
      reason: 'Admission offer accepted and confirmed',
      initiated_by: 'emp-reg-001',
      approved_by: 'emp-reg-001',
      created_at: '2026-04-10T10:00:00Z'
    },
    {
      id: 'evt-002',
      student_id: 'STU-2026-000001',
      enrollment_id: 'enr-rec-001',
      event_type: 'ENROLLMENT',
      from_status: 'ADMITTED',
      to_status: 'ENROLLED',
      effective_date: '2026-04-15',
      event_date: '2026-04-15',
      reason: 'Enrollment handoff processed in SIS',
      initiated_by: 'emp-reg-001',
      approved_by: 'emp-reg-001',
      created_at: '2026-04-15T11:30:00Z'
    },
    {
      id: 'evt-003',
      student_id: 'STU-2026-000001',
      enrollment_id: 'enr-rec-001',
      event_type: 'ACTIVATION',
      from_status: 'ENROLLED',
      to_status: 'ACTIVE',
      effective_date: '2026-07-01',
      event_date: '2026-07-01',
      reason: 'Commenced academic semester 1',
      initiated_by: 'emp-reg-001',
      approved_by: 'emp-reg-001',
      created_at: '2026-07-01T09:00:00Z'
    }
  ];

  private transfers: StudentTransferRecord[] = [];
  private rejoins: StudentRejoinRecord[] = [];
  private graduations: StudentGraduationRecord[] = [];

  // Matrix of legal transitions
  private readonly transitionMatrix: Record<LifecycleStatus, LifecycleStatus[]> = {
    APPLICANT: ['ADMITTED', 'CANCELLED'],
    ADMITTED: ['ENROLLED', 'WITHDRAWN', 'CANCELLED'],
    ENROLLED: ['ACTIVE', 'WITHDRAWN', 'CANCELLED'],
    ACTIVE: ['ON_LEAVE', 'SUSPENDED', 'DEFERRED', 'TRANSFERRED', 'WITHDRAWN', 'COMPLETED'],
    ON_LEAVE: ['ACTIVE', 'WITHDRAWN'],
    SUSPENDED: ['ACTIVE', 'WITHDRAWN', 'CANCELLED'],
    DEFERRED: ['ACTIVE', 'WITHDRAWN'],
    TRANSFERRED: ['ACTIVE', 'WITHDRAWN'],
    WITHDRAWN: ['ACTIVE'], // via Rejoin only
    COMPLETED: ['GRADUATED'],
    GRADUATED: ['ALUMNI'],
    ALUMNI: [],
    CANCELLED: []
  };

  private constructor() {}

  public static getInstance(): StudentLifecycleStateMachineService {
    if (!StudentLifecycleStateMachineService.instance) {
      StudentLifecycleStateMachineService.instance = new StudentLifecycleStateMachineService();
    }
    return StudentLifecycleStateMachineService.instance;
  }

  // ─── STATE MACHINE TRANSITION ENGINE ──────────────────────────────────

  public executeTransition(params: {
    studentId: string;
    enrollmentId?: string;
    eventType: LifecycleEventType;
    targetStatus: LifecycleStatus;
    effectiveDate: string;
    reason?: string;
    remarks?: string;
    initiatedBy: string;
    approvedBy?: string;
  }): StudentLifecycleEventRecord {
    const current = this.currentStatuses[params.studentId] || 'ACTIVE';
    const allowed = this.transitionMatrix[current] || [];

    if (!allowed.includes(params.targetStatus)) {
      throw new Error(`State machine transition blocked: Illegal transition from ${current} to ${params.targetStatus}`);
    }

    const sensitiveEvents: LifecycleEventType[] = [
      'SUSPENSION',
      'DEFERMENT',
      'WITHDRAWAL',
      'INTERNAL_TRANSFER',
      'EXTERNAL_TRANSFER',
      'CANCELLATION'
    ];

    if (sensitiveEvents.includes(params.eventType) && !params.reason) {
      throw new Error(`Mandatory justification reason required for lifecycle event ${params.eventType}`);
    }

    this.currentStatuses[params.studentId] = params.targetStatus;

    const eventRecord: StudentLifecycleEventRecord = {
      id: `evt-${Date.now()}`,
      student_id: params.studentId,
      enrollment_id: params.enrollmentId,
      event_type: params.eventType,
      from_status: current,
      to_status: params.targetStatus,
      effective_date: params.effectiveDate,
      event_date: new Date().toISOString().split('T')[0],
      reason: params.reason,
      remarks: params.remarks,
      initiated_by: params.initiatedBy,
      approved_by: params.approvedBy,
      created_at: new Date().toISOString()
    };

    this.events.push(eventRecord);
    return eventRecord;
  }

  // ─── INTERNAL / EXTERNAL PROGRAM TRANSFER ────────────────────────────

  public requestInternalTransfer(params: {
    studentId: string;
    fromEnrollmentId: string;
    fromInstituteId: string;
    toInstituteId: string;
    fromDepartmentId: string;
    toDepartmentId: string;
    fromProgramId: string;
    toProgramId: string;
    reason: string;
    effectiveDate: string;
    requestedBy: string;
  }): StudentTransferRecord {
    if (!params.reason) throw new Error('Mandatory justification reason required for program transfer');

    const transfer: StudentTransferRecord = {
      id: `trans-${Date.now()}`,
      student_id: params.studentId,
      from_enrollment_id: params.fromEnrollmentId,
      from_institute_id: params.fromInstituteId,
      to_institute_id: params.toInstituteId,
      from_department_id: params.fromDepartmentId,
      to_department_id: params.toDepartmentId,
      from_program_id: params.fromProgramId,
      to_program_id: params.toProgramId,
      transfer_type: 'INTERNAL',
      request_date: new Date().toISOString().split('T')[0],
      effective_date: params.effectiveDate,
      reason: params.reason,
      status: 'APPROVED',
      requested_by: params.requestedBy,
      created_at: new Date().toISOString()
    };

    this.transfers.push(transfer);

    this.executeTransition({
      studentId: params.studentId,
      enrollmentId: params.fromEnrollmentId,
      eventType: 'INTERNAL_TRANSFER',
      targetStatus: 'TRANSFERRED',
      effectiveDate: params.effectiveDate,
      reason: params.reason,
      initiatedBy: params.requestedBy
    });

    return transfer;
  }

  // ─── WITHDRAWAL & REJOIN WORKFLOW ─────────────────────────────────────

  public processRejoin(params: {
    studentId: string;
    programId: string;
    academicYearId: string;
    semesterId: string;
    reason: string;
    approvedBy: string;
  }): StudentRejoinRecord {
    if (!params.reason) throw new Error('Mandatory justification reason required for student rejoin');

    const rejoin: StudentRejoinRecord = {
      id: `rej-${Date.now()}`,
      student_id: params.studentId,
      previous_status: this.currentStatuses[params.studentId] || 'WITHDRAWN',
      rejoin_date: new Date().toISOString().split('T')[0],
      program_id: params.programId,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      reason: params.reason,
      status: 'APPROVED',
      approved_by: params.approvedBy,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.rejoins.push(rejoin);

    this.executeTransition({
      studentId: params.studentId,
      eventType: 'REJOIN',
      targetStatus: 'ACTIVE',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: params.reason,
      initiatedBy: params.approvedBy,
      approvedBy: params.approvedBy
    });

    return rejoin;
  }

  // ─── GRADUATION & ALUMNI HANDOFF WORKFLOW ─────────────────────────────

  public processGraduationAndAlumniHandoff(params: {
    studentId: string;
    enrollmentId: string;
    programId: string;
    academicYearId: string;
    batchId: string;
    degreeAwarded: string;
    approvedBy: string;
  }): { graduation: StudentGraduationRecord; alumniEvent: StudentLifecycleEventRecord } {
    // 1. Transition ACTIVE -> COMPLETED
    this.executeTransition({
      studentId: params.studentId,
      enrollmentId: params.enrollmentId,
      eventType: 'COMPLETION',
      targetStatus: 'COMPLETED',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: 'All degree curriculum credits and prerequisites cleared',
      initiatedBy: params.approvedBy
    });

    // 2. Transition COMPLETED -> GRADUATED
    this.executeTransition({
      studentId: params.studentId,
      enrollmentId: params.enrollmentId,
      eventType: 'GRADUATION',
      targetStatus: 'GRADUATED',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: `Graduated with degree: ${params.degreeAwarded}`,
      initiatedBy: params.approvedBy,
      approvedBy: params.approvedBy
    });

    const gradRecord: StudentGraduationRecord = {
      id: `grad-${Date.now()}`,
      student_id: params.studentId,
      enrollment_id: params.enrollmentId,
      program_id: params.programId,
      academic_year_id: params.academicYearId,
      batch_id: params.batchId,
      completion_date: new Date().toISOString().split('T')[0],
      graduation_date: new Date().toISOString().split('T')[0],
      degree_awarded: params.degreeAwarded,
      status: 'ALUMNI_HANDOFF',
      approved_by: params.approvedBy,
      created_at: new Date().toISOString()
    };

    this.graduations.push(gradRecord);

    // 3. Transition GRADUATED -> ALUMNI
    const alumniEvent = this.executeTransition({
      studentId: params.studentId,
      enrollmentId: params.enrollmentId,
      eventType: 'ALUMNI_HANDOFF',
      targetStatus: 'ALUMNI',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: 'Enrolled in Swarrnim Alumni Association Dossier',
      initiatedBy: params.approvedBy,
      approvedBy: params.approvedBy
    });

    return { graduation: gradRecord, alumniEvent };
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getLifecycleDashboardMetrics(context?: UserAuthorizationContext): StudentLifecycleStateMetrics {
    const statuses = Object.values(this.currentStatuses);

    const totalStudents = statuses.length;
    const activeCount = statuses.filter(s => s === 'ACTIVE').length;
    const onLeaveCount = statuses.filter(s => s === 'ON_LEAVE').length;
    const suspendedCount = statuses.filter(s => s === 'SUSPENDED').length;
    const deferredCount = statuses.filter(s => s === 'DEFERRED').length;
    const transferredCount = statuses.filter(s => s === 'TRANSFERRED').length;
    const withdrawnCount = statuses.filter(s => s === 'WITHDRAWN').length;
    const completedCount = statuses.filter(s => s === 'COMPLETED').length;
    const graduatedCount = statuses.filter(s => s === 'GRADUATED').length;
    const alumniCount = statuses.filter(s => s === 'ALUMNI').length;

    const pendingTransfers = this.transfers.filter(t => t.status === 'REQUESTED' || t.status === 'UNDER_REVIEW').length;
    const pendingWithdrawals = 0;
    const pendingGraduations = this.graduations.filter(g => g.status === 'COMPLETED').length;

    return {
      totalStudents,
      activeCount,
      onLeaveCount,
      suspendedCount,
      deferredCount,
      transferredCount,
      withdrawnCount,
      completedCount,
      graduatedCount,
      alumniCount,
      pendingTransfers,
      pendingWithdrawals,
      pendingGraduations
    };
  }
}

export const studentLifecycleStateMachineService = StudentLifecycleStateMachineService.getInstance();
