import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type EnrollmentHandoffStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type WithdrawalCancellationType = 'WITHDRAWAL' | 'CANCELLATION';

export type MigrationBatchStatus = 'DRAFT' | 'VALIDATING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

export type AdmissionExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AdmissionEnrollmentHandoffRecord {
  id: string;
  admission_id: string;
  student_id: string;
  enrollment_no: string;
  applicant_name: string;
  program_id: string;
  program_name: string;
  department_id: string;
  institute_id: string;
  academic_year_id: string;
  semester_id: string;
  status: EnrollmentHandoffStatus;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  remarks?: string;
}

export interface AdmissionWithdrawalCancellationRecord {
  id: string;
  admission_id: string;
  student_id: string;
  enrollment_no: string;
  applicant_name: string;
  action_type: WithdrawalCancellationType;
  reason: string;
  refund_requested: boolean;
  refund_status: 'PENDING' | 'PROCESSED' | 'NOT_APPLICABLE';
  refund_reference_id?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface MigrationBatchRecord {
  id: string;
  batch_number: string;
  source: 'CSV' | 'EXCEL' | 'LEGACY_DATABASE';
  entity: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: MigrationBatchStatus;
  started_at: string;
  completed_at?: string;
  created_by: string;
  error_log?: { row: number; field: string; error: string }[];
}

export interface AdmissionExceptionRecord {
  id: string;
  entity_type: 'APPLICATION' | 'OFFER' | 'ADMISSION' | 'ENROLLMENT';
  entity_id: string;
  exception_type: 'UNENROLLED_ADMISSION' | 'UNALLOCATED_OFFER' | 'FEE_MISMATCH' | 'DOCUMENT_PENDING';
  severity: AdmissionExceptionSeverity;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WAIVED';
  assigned_to?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface AdmissionClosureSnapshotRecord {
  id: string;
  session_id: string;
  total_applications: number;
  total_eligible: number;
  total_offers: number;
  total_admissions: number;
  total_withdrawals: number;
  total_cancelled: number;
  seats_reconciled: boolean;
  closed_at: string;
  closed_by: string;
  is_reopened: boolean;
  reopened_by?: string;
  reopened_at?: string;
  reopen_reason?: string;
}

export interface AdmissionFinalDashboardMetrics {
  totalAdmissionsConfirmed: number;
  enrollmentHandoffsCompleted: number;
  enrollmentHandoffsPending: number;
  totalWithdrawals: number;
  totalCancellations: number;
  migrationBatchesCount: number;
  migratedRecordsCount: number;
  openExceptionsCount: number;
  isAdmissionSessionClosed: boolean;
  overallConversionPercentage: number;
}

class AdmissionFinalizationClosureService {
  private static instance: AdmissionFinalizationClosureService;

  private handoffs: AdmissionEnrollmentHandoffRecord[] = [
    {
      id: 'handoff-001',
      admission_id: 'adm-rec-001',
      student_id: 'stud-001',
      enrollment_no: 'SSIU26BCA000059',
      applicant_name: 'Aarav Patel',
      program_id: 'prog-bca',
      program_name: 'Bachelor of Computer Applications (BCA)',
      department_id: 'dept-cse',
      institute_id: 'inst-sit',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      status: 'COMPLETED',
      requested_at: '2026-04-15T11:00:00Z',
      processed_at: '2026-04-15T11:30:00Z',
      processed_by: 'emp-reg-001',
      remarks: 'Student enrolled and activated in Student Information System'
    }
  ];

  private withdrawalsAndCancellations: AdmissionWithdrawalCancellationRecord[] = [];

  private migrationBatches: MigrationBatchRecord[] = [
    {
      id: 'mig-001',
      batch_number: 'MIG-2026-0001',
      source: 'CSV',
      entity: 'HISTORICAL_ADMISSIONS',
      total_records: 50,
      successful_records: 50,
      failed_records: 0,
      status: 'COMPLETED',
      started_at: '2026-03-01T09:00:00Z',
      completed_at: '2026-03-01T09:15:00Z',
      created_by: 'emp-reg-001'
    }
  ];

  private exceptions: AdmissionExceptionRecord[] = [
    {
      id: 'exc-001',
      entity_type: 'ADMISSION',
      entity_id: 'adm-rec-002',
      exception_type: 'DOCUMENT_PENDING',
      severity: 'MEDIUM',
      description: 'Original Migration Certificate pending submission by candidate',
      status: 'OPEN'
    }
  ];

  private closures: AdmissionClosureSnapshotRecord[] = [];

  private constructor() {}

  public static getInstance(): AdmissionFinalizationClosureService {
    if (!AdmissionFinalizationClosureService.instance) {
      AdmissionFinalizationClosureService.instance = new AdmissionFinalizationClosureService();
    }
    return AdmissionFinalizationClosureService.instance;
  }

  // ─── ENROLLMENT HANDOFF & STUDENT ACTIVATION ──────────────────────────

  public requestEnrollmentHandoff(params: {
    admissionId: string;
    studentId: string;
    enrollmentNo: string;
    applicantName: string;
    programId: string;
    programName: string;
    departmentId: string;
    instituteId: string;
    academicYearId: string;
    semesterId: string;
  }): AdmissionEnrollmentHandoffRecord {
    const existing = this.handoffs.find(h => h.admission_id === params.admissionId);
    if (existing) return existing;

    const handoff: AdmissionEnrollmentHandoffRecord = {
      id: `handoff-${Date.now()}`,
      admission_id: params.admissionId,
      student_id: params.studentId,
      enrollment_no: params.enrollmentNo,
      applicant_name: params.applicantName,
      program_id: params.programId,
      program_name: params.programName,
      department_id: params.departmentId,
      institute_id: params.instituteId,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      status: 'PENDING',
      requested_at: new Date().toISOString()
    };

    this.handoffs.push(handoff);
    return handoff;
  }

  public completeEnrollmentHandoff(params: {
    handoffId: string;
    processedBy: string;
  }): AdmissionEnrollmentHandoffRecord {
    const handoff = this.handoffs.find(h => h.id === params.handoffId);
    if (!handoff) throw new Error(`Enrollment handoff ${params.handoffId} not found`);

    handoff.status = 'COMPLETED';
    handoff.processed_at = new Date().toISOString();
    handoff.processed_by = params.processedBy;
    handoff.remarks = 'Student successfully registered in academic courses and semester roster';

    return handoff;
  }

  // ─── CONTROLLED ADMISSION WITHDRAWAL & CANCELLATION ───────────────────

  public processWithdrawalOrCancellation(params: {
    admissionId: string;
    studentId: string;
    enrollmentNo: string;
    applicantName: string;
    actionType: WithdrawalCancellationType;
    reason: string;
    requestRefund: boolean;
    approvedBy: string;
  }): AdmissionWithdrawalCancellationRecord {
    if (!params.reason) {
      throw new Error('Mandatory reason required for admission withdrawal/cancellation');
    }

    const refundRef = params.requestRefund
      ? `RFD-ADM-${Math.floor(100000 + Math.random() * 900000)}`
      : undefined;

    const record: AdmissionWithdrawalCancellationRecord = {
      id: `wth-${Date.now()}`,
      admission_id: params.admissionId,
      student_id: params.studentId,
      enrollment_no: params.enrollmentNo,
      applicant_name: params.applicantName,
      action_type: params.actionType,
      reason: params.reason,
      refund_requested: params.requestRefund,
      refund_status: params.requestRefund ? 'PENDING' : 'NOT_APPLICABLE',
      refund_reference_id: refundRef,
      status: 'APPROVED',
      approved_by: params.approvedBy,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.withdrawalsAndCancellations.push(record);
    return record;
  }

  // ─── ADMISSION MIGRATION & BULK IMPORT ─────────────────────────────────

  public processMigrationBatch(params: {
    source: 'CSV' | 'EXCEL' | 'LEGACY_DATABASE';
    records: { applicationNo: string; studentName: string; programCode: string; percentage: number }[];
    createdBy: string;
  }): MigrationBatchRecord {
    const batchNumber = `MIG-2026-${(this.migrationBatches.length + 1).toString().padStart(4, '0')}`;
    const errorLog: { row: number; field: string; error: string }[] = [];
    let successCount = 0;

    params.records.forEach((rec, idx) => {
      if (!rec.applicationNo || !rec.studentName) {
        errorLog.push({ row: idx + 1, field: 'applicationNo', error: 'Missing mandatory applicant identity' });
      } else if (rec.percentage < 0 || rec.percentage > 100) {
        errorLog.push({ row: idx + 1, field: 'percentage', error: 'Percentage out of valid range (0-100)' });
      } else {
        successCount++;
      }
    });

    const batch: MigrationBatchRecord = {
      id: `mig-${Date.now()}`,
      batch_number: batchNumber,
      source: params.source,
      entity: 'HISTORICAL_ADMISSIONS',
      total_records: params.records.length,
      successful_records: successCount,
      failed_records: errorLog.length,
      status: errorLog.length === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIAL' : 'FAILED',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_by: params.createdBy,
      error_log: errorLog.length > 0 ? errorLog : undefined
    };

    this.migrationBatches.push(batch);
    return batch;
  }

  // ─── ADMISSION SESSION CLOSURE & REOPENING ────────────────────────────

  public closeAdmissionSession(params: {
    sessionId: string;
    totalApplications: number;
    totalEligible: number;
    totalOffers: number;
    totalAdmissions: number;
    closedBy: string;
    hasBlockingExceptions?: boolean;
  }): AdmissionClosureSnapshotRecord {
    if (params.hasBlockingExceptions) {
      throw new Error('Cannot close admission session: Critical unresolved admission exceptions exist');
    }

    const snapshot: AdmissionClosureSnapshotRecord = {
      id: `close-snap-${Date.now()}`,
      session_id: params.sessionId,
      total_applications: params.totalApplications,
      total_eligible: params.totalEligible,
      total_offers: params.totalOffers,
      total_admissions: params.totalAdmissions,
      total_withdrawals: this.withdrawalsAndCancellations.filter(w => w.action_type === 'WITHDRAWAL').length,
      total_cancelled: this.withdrawalsAndCancellations.filter(w => w.action_type === 'CANCELLATION').length,
      seats_reconciled: true,
      closed_at: new Date().toISOString(),
      closed_by: params.closedBy,
      is_reopened: false
    };

    this.closures.push(snapshot);
    return snapshot;
  }

  public reopenAdmissionSession(params: {
    sessionId: string;
    reopenReason: string;
    reopenedBy: string;
  }): AdmissionClosureSnapshotRecord {
    const snapshot = this.closures.find(c => c.session_id === params.sessionId);
    if (!snapshot) throw new Error(`Closure snapshot for session ${params.sessionId} not found`);

    if (!params.reopenReason) {
      throw new Error('Mandatory justification required to reopen a closed admission session');
    }

    snapshot.is_reopened = true;
    snapshot.reopened_by = params.reopenedBy;
    snapshot.reopened_at = new Date().toISOString();
    snapshot.reopen_reason = params.reopenReason;

    return snapshot;
  }

  // ─── DASHBOARD & KPI ANALYTICS ENGINE ─────────────────────────────────

  public getFinalDashboardMetrics(context?: UserAuthorizationContext): AdmissionFinalDashboardMetrics {
    const totalAdmissionsConfirmed = 120; // 100% capacity fill for current batch
    const enrollmentHandoffsCompleted = this.handoffs.filter(h => h.status === 'COMPLETED').length;
    const enrollmentHandoffsPending = this.handoffs.filter(h => h.status === 'PENDING').length;
    const totalWithdrawals = this.withdrawalsAndCancellations.filter(w => w.action_type === 'WITHDRAWAL').length;
    const totalCancellations = this.withdrawalsAndCancellations.filter(w => w.action_type === 'CANCELLATION').length;
    const migrationBatchesCount = this.migrationBatches.length;
    const migratedRecordsCount = this.migrationBatches.reduce((sum, b) => sum + b.successful_records, 0);
    const openExceptionsCount = this.exceptions.filter(e => e.status === 'OPEN').length;
    const isAdmissionSessionClosed = this.closures.some(c => !c.is_reopened);

    return {
      totalAdmissionsConfirmed,
      enrollmentHandoffsCompleted,
      enrollmentHandoffsPending,
      totalWithdrawals,
      totalCancellations,
      migrationBatchesCount,
      migratedRecordsCount,
      openExceptionsCount,
      isAdmissionSessionClosed,
      overallConversionPercentage: 88.5
    };
  }
}

export const admissionFinalizationClosureService = AdmissionFinalizationClosureService.getInstance();
