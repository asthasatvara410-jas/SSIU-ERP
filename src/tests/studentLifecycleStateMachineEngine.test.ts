import { describe, it, expect } from 'vitest';
import { studentLifecycleStateMachineService } from '../services/studentLifecycleStateMachineService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.4: Complete Student Lifecycle State Machine, Transfer, Leave & Graduation Engine', () => {

  it('TEST 1: State Machine Transition Matrix: Enforces legal transitions and blocks illegal state jumps', () => {
    // 1. Illegal transition attempt: ACTIVE directly to ALUMNI (must complete and graduate first)
    expect(() => {
      studentLifecycleStateMachineService.executeTransition({
        studentId: 'STU-2026-000001',
        eventType: 'ALUMNI_HANDOFF',
        targetStatus: 'ALUMNI',
        effectiveDate: '2026-05-01',
        initiatedBy: 'emp-reg-001'
      });
    }).toThrow(/State machine transition blocked: Illegal transition/);

    // 2. Sensitive transition without mandatory reason (SUSPENSION without reason)
    expect(() => {
      studentLifecycleStateMachineService.executeTransition({
        studentId: 'STU-2026-000001',
        eventType: 'SUSPENSION',
        targetStatus: 'SUSPENDED',
        effectiveDate: '2026-05-01',
        initiatedBy: 'emp-reg-001'
        // Missing reason
      });
    }).toThrow(/Mandatory justification reason required/);

    // 3. Valid transition: ACTIVE -> ON_LEAVE
    const leaveEvent = studentLifecycleStateMachineService.executeTransition({
      studentId: 'STU-2026-000001',
      eventType: 'LEAVE',
      targetStatus: 'ON_LEAVE',
      effectiveDate: '2026-05-01',
      reason: 'Approved academic research exchange semester',
      initiatedBy: 'emp-reg-001'
    });

    expect(leaveEvent.id).toBeDefined();
    expect(leaveEvent.to_status).toBe('ON_LEAVE');

    // 4. Return to ACTIVE
    const returnEvent = studentLifecycleStateMachineService.executeTransition({
      studentId: 'STU-2026-000001',
      eventType: 'LEAVE_RETURN',
      targetStatus: 'ACTIVE',
      effectiveDate: '2026-08-01',
      reason: 'Returned from exchange program; re-activated',
      initiatedBy: 'emp-reg-001'
    });

    expect(returnEvent.to_status).toBe('ACTIVE');
  });

  it('TEST 2: Internal Program Transfer: Transfers student between programs and preserves academic history', () => {
    // Transfer without reason must fail
    expect(() => {
      studentLifecycleStateMachineService.requestInternalTransfer({
        studentId: 'STU-2026-000001',
        fromEnrollmentId: 'enr-rec-001',
        fromInstituteId: 'inst-sit',
        toInstituteId: 'inst-sit',
        fromDepartmentId: 'dept-cse',
        toDepartmentId: 'dept-it',
        fromProgramId: 'prog-bca',
        toProgramId: 'prog-bsc-it',
        reason: '',
        effectiveDate: '2026-08-15',
        requestedBy: 'emp-reg-001'
      });
    }).toThrow(/Mandatory justification reason required/);

    // Valid transfer
    const transfer = studentLifecycleStateMachineService.requestInternalTransfer({
      studentId: 'STU-2026-000001',
      fromEnrollmentId: 'enr-rec-001',
      fromInstituteId: 'inst-sit',
      toInstituteId: 'inst-sit',
      fromDepartmentId: 'dept-cse',
      toDepartmentId: 'dept-it',
      fromProgramId: 'prog-bca',
      toProgramId: 'prog-bsc-it',
      reason: 'Student opted for Cloud Systems specialization under BSc IT',
      effectiveDate: '2026-08-15',
      requestedBy: 'emp-reg-001'
    });

    expect(transfer.id).toBeDefined();
    expect(transfer.status).toBe('APPROVED');
    expect(transfer.transfer_type).toBe('INTERNAL');
  });

  it('TEST 3: Controlled Withdrawal & Rejoin Workflow: Withdraws student and vets rejoin back to ACTIVE', () => {
    // 1. Withdraw student
    const withdrawalEvent = studentLifecycleStateMachineService.executeTransition({
      studentId: 'STU-2026-000002',
      eventType: 'WITHDRAWAL',
      targetStatus: 'WITHDRAWN',
      effectiveDate: '2026-06-01',
      reason: 'Personal leave of absence for startup venture',
      initiatedBy: 'emp-reg-001'
    });

    expect(withdrawalEvent.to_status).toBe('WITHDRAWN');

    // 2. Direct jump from WITHDRAWN to GRADUATED must be blocked
    expect(() => {
      studentLifecycleStateMachineService.executeTransition({
        studentId: 'STU-2026-000002',
        eventType: 'GRADUATION',
        targetStatus: 'GRADUATED',
        effectiveDate: '2026-07-01',
        initiatedBy: 'emp-reg-001'
      });
    }).toThrow(/State machine transition blocked/);

    // 3. Rejoin back to ACTIVE
    const rejoin = studentLifecycleStateMachineService.processRejoin({
      studentId: 'STU-2026-000002',
      programId: 'prog-bca',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-03',
      reason: 'Rejoining degree program following completion of venture incubation period',
      approvedBy: 'emp-reg-001'
    });

    expect(rejoin.id).toBeDefined();
    expect(rejoin.status).toBe('APPROVED');
  });

  it('TEST 4: Graduation & Alumni Handoff Pipeline: Completes degree, records graduation and hands off to Alumni', () => {
    const outcome = studentLifecycleStateMachineService.processGraduationAndAlumniHandoff({
      studentId: 'STU-2026-000003',
      enrollmentId: 'enr-rec-003',
      programId: 'prog-bca',
      academicYearId: 'ay-2026-27',
      batchId: 'batch-2026',
      degreeAwarded: 'Bachelor of Computer Applications (Honours)',
      approvedBy: 'emp-reg-001'
    });

    expect(outcome.graduation.status).toBe('ALUMNI_HANDOFF');
    expect(outcome.graduation.degree_awarded).toBe('Bachelor of Computer Applications (Honours)');
    expect(outcome.alumniEvent.to_status).toBe('ALUMNI');
  });

  it('TEST 5: Lifecycle Dashboard Metrics: Computes authoritative student counts across all lifecycle states', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['LIFECYCLE_VIEW', 'STATUS_CHANGE', 'GRADUATION_VIEW']
    };

    const metrics = studentLifecycleStateMachineService.getLifecycleDashboardMetrics(registrarContext);
    expect(metrics.totalStudents).toBeGreaterThanOrEqual(1);
    expect(metrics.alumniCount).toBeGreaterThanOrEqual(1);
  });
});
