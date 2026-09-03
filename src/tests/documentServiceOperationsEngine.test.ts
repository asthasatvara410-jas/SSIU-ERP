import { describe, it, expect } from 'vitest';
import { centralServiceOperationsService } from '../services/centralServiceOperationsService';
import { centralPortalPlatformService } from '../services/centralPortalPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.40: Service Operations, Task Workflow & SLA Engine', () => {

  const studentUser: UserAuthorizationContext = {
    userId: 'stu-2026-001',
    userName: 'Aarav Patel',
    email: 'aarav@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['SERVICE_VIEW', 'SERVICE_REQUEST', 'SERVICE_TRACK']
  };

  const staffOfficer: UserAuthorizationContext = {
    userId: 'emp-staff-001',
    userName: 'Senior Registrar Operations Officer',
    email: 'operations@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'CASE_VIEW',
      'CASE_ASSIGN',
      'CASE_RESOLVE',
      'CASE_CLOSE',
      'TASK_CREATE',
      'TASK_COMPLETE',
      'SLA_MANAGE',
      'DOCUMENT_GOVERNANCE_VIEW'
    ]
  };

  it('TEST 1: Case Creation & Staff Assignment: Converts self-service request into operational case', () => {
    // 1. Student submits request
    const request = centralPortalPlatformService.submitServiceRequest({
      serviceCode: 'SRV-BONAFIDE-CERT',
      context: studentUser
    });

    // 2. System creates Case
    const serviceCase = centralServiceOperationsService.createCaseFromServiceRequest({
      serviceCode: request.service_code,
      requestId: request.id,
      requesterId: request.requester_id,
      organizationId: request.organization_id,
      departmentId: request.department_id,
      priority: 'HIGH',
      slaHours: 48
    });

    expect(serviceCase.id).toBeDefined();
    expect(serviceCase.case_number).toMatch(/^CASE-2026-\d{6}$/);
    expect(serviceCase.status).toBe('NEW');
    expect(serviceCase.queue_id).toBe('QUEUE-REGISTRAR-DESK');
    expect(serviceCase.sla_status).toBe('ON_TRACK');

    // 3. Assign to staff
    const assigned = centralServiceOperationsService.assignCaseToStaff(serviceCase.id, 'emp-staff-001', 'emp-reg-001');
    expect(assigned.status).toBe('ASSIGNED');
    expect(assigned.owner_id).toBe('emp-staff-001');
  });

  it('TEST 2: Task Engine & Dependencies: Enforces strict completion order for prerequisite tasks', () => {
    const serviceCase = centralServiceOperationsService.createCaseFromServiceRequest({
      serviceCode: 'SRV-BONAFIDE-CERT',
      requestId: 'req-test-001',
      requesterId: 'stu-2026-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-academic'
    });

    // 1. Task A: Prerequisite
    const taskA = centralServiceOperationsService.createTask({
      caseId: serviceCase.id,
      title: 'Fee Dues & Financial Clearance Check',
      assigneeId: 'emp-cfo-001'
    });

    // 2. Task B: Dependent on Task A
    const taskB = centralServiceOperationsService.createTask({
      caseId: serviceCase.id,
      title: 'Apply University Registrar Digital Seal and Signature',
      assigneeId: 'emp-reg-001',
      dependsOnTaskId: taskA.id
    });

    expect(taskA.status).toBe('PENDING');
    expect(taskB.status).toBe('BLOCKED');

    // Attempting to complete Task B while Task A is incomplete must throw
    expect(() => {
      centralServiceOperationsService.completeTask(taskB.id, 'emp-reg-001');
    }).toThrow(/Task Dependency Blocked: Prerequisite task .* must be completed/);

    // Complete Task A
    centralServiceOperationsService.completeTask(taskA.id, 'emp-cfo-001');
    expect(taskA.status).toBe('COMPLETED');
    expect(taskB.status).toBe('PENDING');

    // Complete Task B
    const completedB = centralServiceOperationsService.completeTask(taskB.id, 'emp-reg-001');
    expect(completedB.status).toBe('COMPLETED');
  });

  it('TEST 3: SLA Engine: Pauses SLA on requester wait and resumes upon action', () => {
    const serviceCase = centralServiceOperationsService.createCaseFromServiceRequest({
      serviceCode: 'SRV-BONAFIDE-CERT',
      requestId: 'req-test-002',
      requesterId: 'stu-2026-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-academic'
    });

    // 1. Pause SLA
    const paused = centralServiceOperationsService.pauseCaseSLA(serviceCase.id, 'Waiting for student to upload identity card photocopy');
    expect(paused.sla_paused).toBe(true);
    expect(paused.sla_status).toBe('PAUSED');
    expect(paused.status).toBe('WAITING');

    // 2. Resume SLA
    const resumed = centralServiceOperationsService.resumeCaseSLA(serviceCase.id);
    expect(resumed.sla_paused).toBe(false);
    expect(resumed.sla_status).toBe('ON_TRACK');
    expect(resumed.status).toBe('IN_PROGRESS');
  });

  it('TEST 4: Case Closure Gates: Blocks closure on pending mandatory operational tasks', () => {
    const serviceCase = centralServiceOperationsService.createCaseFromServiceRequest({
      serviceCode: 'SRV-BONAFIDE-CERT',
      requestId: 'req-test-003',
      requesterId: 'stu-2026-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-academic'
    });

    const task = centralServiceOperationsService.createTask({
      caseId: serviceCase.id,
      title: 'Mandatory Student Enrollment Verification Task',
      assigneeId: 'emp-staff-001'
    });

    // Attempting closure with pending task must throw
    expect(() => {
      centralServiceOperationsService.closeCase(serviceCase.id, 'emp-staff-001');
    }).toThrow(/Case Closure Blocked: Cannot close case .* with .* incomplete mandatory operational tasks/);

    // Complete task
    centralServiceOperationsService.completeTask(task.id, 'emp-staff-001');

    // Resolve case
    centralServiceOperationsService.resolveCase({
      caseId: serviceCase.id,
      resolutionCode: 'COMPLETED',
      resolutionSummary: 'Verified credentials, generated bonafide certificate with digital QR verification seal, and published to student portal.',
      resolvedBy: 'emp-staff-001'
    });

    // Successfully close case
    const closed = centralServiceOperationsService.closeCase(serviceCase.id, 'emp-staff-001');
    expect(closed.status).toBe('CLOSED');
    expect(closed.closed_at).toBeDefined();
  });

  it('TEST 5: Service Operations Dashboard Telemetry: Validates metrics, active tasks, and operational posture', () => {
    const metrics = centralServiceOperationsService.getServiceOperationsDashboardMetrics(staffOfficer);

    expect(metrics.totalCasesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.slaOnTrackPercent).toBeGreaterThanOrEqual(95);
    expect(metrics.slaBreachedCount).toBe(0);
    expect(metrics.operationsPosture).toBe('HEALTHY');
  });
});
