import { describe, it, expect } from 'vitest';
import { admissionFinalizationClosureService } from '../services/admissionFinalizationClosureService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 11.3: Admission Finalization, Enrollment Handoff & Closure Engine', () => {

  it('TEST 1: Enrollment Handoff Workflow: Creates handoff request and marks completed for SIS activation', () => {
    // 1. Request Handoff
    const handoff = admissionFinalizationClosureService.requestEnrollmentHandoff({
      admissionId: 'adm-rec-002',
      studentId: 'stud-002',
      enrollmentNo: 'SSIU26BCA000060',
      applicantName: 'Priya Sharma',
      programId: 'prog-bca',
      programName: 'Bachelor of Computer Applications (BCA)',
      departmentId: 'dept-cse',
      instituteId: 'inst-sit',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-01'
    });

    expect(handoff.id).toBeDefined();
    expect(handoff.status).toBe('PENDING');

    // 2. Process and Complete Enrollment Handoff
    const completed = admissionFinalizationClosureService.completeEnrollmentHandoff({
      handoffId: handoff.id,
      processedBy: 'emp-reg-001'
    });

    expect(completed.status).toBe('COMPLETED');
    expect(completed.processed_by).toBe('emp-reg-001');
  });

  it('TEST 2: Admission Withdrawal & Refund Handoff: Processes withdrawal and routes refund reference to Central Finance', () => {
    // Withdrawal without reason must fail
    expect(() => {
      admissionFinalizationClosureService.processWithdrawalOrCancellation({
        admissionId: 'adm-rec-003',
        studentId: 'stud-003',
        enrollmentNo: 'SSIU26BCA000061',
        applicantName: 'Kabir Mehta',
        actionType: 'WITHDRAWAL',
        reason: '', // Missing reason
        requestRefund: true,
        approvedBy: 'emp-reg-001'
      });
    }).toThrow(/Mandatory reason required/);

    // Valid withdrawal with Central Finance refund request
    const withdrawal = admissionFinalizationClosureService.processWithdrawalOrCancellation({
      admissionId: 'adm-rec-003',
      studentId: 'stud-003',
      enrollmentNo: 'SSIU26BCA000061',
      applicantName: 'Kabir Mehta',
      actionType: 'WITHDRAWAL',
      reason: 'Relocating to another state due to family transfer',
      requestRefund: true,
      approvedBy: 'emp-reg-001'
    });

    expect(withdrawal.status).toBe('APPROVED');
    expect(withdrawal.refund_requested).toBe(true);
    expect(withdrawal.refund_status).toBe('PENDING');
    expect(withdrawal.refund_reference_id).toMatch(/^RFD-ADM-\d{6}$/);
  });

  it('TEST 3: Migration & Bulk Import Batch: Validates records and flags erroneous rows', () => {
    const batch = admissionFinalizationClosureService.processMigrationBatch({
      source: 'CSV',
      records: [
        { applicationNo: 'ADM-LEG-001', studentName: 'Ravi Verma', programCode: 'BCA', percentage: 78.5 },
        { applicationNo: '', studentName: 'Anil Shah', programCode: 'BCA', percentage: 65.0 }, // Erroneous row (missing app no)
        { applicationNo: 'ADM-LEG-003', studentName: 'Neha Patel', programCode: 'BCA', percentage: 115.0 } // Erroneous row (percentage > 100)
      ],
      createdBy: 'emp-reg-001'
    });

    expect(batch.id).toBeDefined();
    expect(batch.batch_number).toMatch(/^MIG-2026-\d{4}$/);
    expect(batch.status).toBe('PARTIAL');
    expect(batch.total_records).toBe(3);
    expect(batch.successful_records).toBe(1);
    expect(batch.failed_records).toBe(2);
    expect(batch.error_log?.length).toBe(2);
  });

  it('TEST 4: Admission Session Closure & Reopen Workflow: Blocks on exceptions and takes snapshot', () => {
    // 1. Closure blocked by unresolved critical exceptions
    expect(() => {
      admissionFinalizationClosureService.closeAdmissionSession({
        sessionId: 'adm-sess-001',
        totalApplications: 150,
        totalEligible: 140,
        totalOffers: 130,
        totalAdmissions: 120,
        closedBy: 'emp-reg-001',
        hasBlockingExceptions: true
      });
    }).toThrow(/Critical unresolved admission exceptions exist/);

    // 2. Clean Closure Snapshot
    const snapshot = admissionFinalizationClosureService.closeAdmissionSession({
      sessionId: 'adm-sess-001',
      totalApplications: 150,
      totalEligible: 140,
      totalOffers: 130,
      totalAdmissions: 120,
      closedBy: 'emp-reg-001',
      hasBlockingExceptions: false
    });

    expect(snapshot.id).toBeDefined();
    expect(snapshot.seats_reconciled).toBe(true);
    expect(snapshot.is_reopened).toBe(false);

    // 3. Audited Session Reopen
    const reopened = admissionFinalizationClosureService.reopenAdmissionSession({
      sessionId: 'adm-sess-001',
      reopenReason: 'Special state government mop-up round authorized for vacant reserved seats',
      reopenedBy: 'emp-reg-001'
    });

    expect(reopened.is_reopened).toBe(true);
    expect(reopened.reopen_reason).toContain('Special state government mop-up round');
  });

  it('TEST 5: Final Admission Dashboard Metrics: Computes authoritative handoffs, exceptions and migration counters', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['ADMISSION_FINALIZE', 'ENROLLMENT_HANDOFF_VIEW', 'ADMISSION_CLOSURE']
    };

    const metrics = admissionFinalizationClosureService.getFinalDashboardMetrics(registrarContext);
    expect(metrics.totalAdmissionsConfirmed).toBe(120);
    expect(metrics.enrollmentHandoffsCompleted).toBeGreaterThanOrEqual(2);
    expect(metrics.totalWithdrawals).toBeGreaterThanOrEqual(1);
    expect(metrics.migrationBatchesCount).toBeGreaterThanOrEqual(2);
    expect(metrics.migratedRecordsCount).toBeGreaterThanOrEqual(51);
  });
});
