import { describe, it, expect } from 'vitest';
import { centralEnterpriseWorkflowBPMService } from '../services/centralEnterpriseWorkflowBPMService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.47: Enterprise Workflow & BPM 2.0 Engine', () => {

  const departmentHod: UserAuthorizationContext = {
    userId: 'emp-hod-001',
    userName: 'Head of Computer Engineering',
    email: 'hod.ce@swarrnim.edu.in',
    activeRole: 'HOD',
    assignedRoles: ['HOD', 'FACULTY'],
    permissions: ['WORKFLOW_APPROVE']
  };

  const registrarOfficer: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'University Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['WORKFLOW_APPROVE']
  };

  const actingFaculty: UserAuthorizationContext = {
    userId: 'emp-acting-fac-001',
    userName: 'Acting Department Coordinator',
    email: 'acting.coord@swarrnim.edu.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    permissions: ['WORKFLOW_APPROVE']
  };

  it('TEST 1: Multi-Level Sequential Approval: Enforces step progression across HOD and Registrar levels', () => {
    // 1. Start Workflow
    const instance = centralEnterpriseWorkflowBPMService.startWorkflow({
      workflowCode: 'WF-STUDENT-BONAFIDE-APPROVAL',
      entityType: 'STUDENT_SERVICE',
      entityId: 'SR-2026-000101',
      initiatedBy: 'stu-2026-001'
    });

    expect(instance.id).toBeDefined();
    expect(instance.status).toBe('RUNNING');
    expect(instance.current_step_index).toBe(0);

    // 2. Level 1 Approval by HOD
    const level1 = centralEnterpriseWorkflowBPMService.processApproval({
      instanceId: instance.id,
      decision: 'APPROVED',
      comments: 'Academic credentials and semester attendance verified.',
      context: departmentHod
    });
    expect(level1.current_step_index).toBe(1);
    expect(level1.status).toBe('RUNNING');

    // 3. Level 2 Final Approval by Registrar
    const level2 = centralEnterpriseWorkflowBPMService.processApproval({
      instanceId: instance.id,
      decision: 'APPROVED',
      comments: 'Digital seal applied and officially published.',
      context: registrarOfficer
    });
    expect(level2.status).toBe('COMPLETED');
    expect(level2.completed_at).toBeDefined();
  });

  it('TEST 2: Role Clearance Gate: Prohibits unauthorized users from approving restricted steps', () => {
    const instance = centralEnterpriseWorkflowBPMService.startWorkflow({
      workflowCode: 'WF-STUDENT-BONAFIDE-APPROVAL',
      entityType: 'STUDENT_SERVICE',
      entityId: 'SR-2026-000102',
      initiatedBy: 'stu-2026-001'
    });

    // Step 0 requires HOD; Registrar cannot approve Step 0 directly
    expect(() => {
      centralEnterpriseWorkflowBPMService.processApproval({
        instanceId: instance.id,
        decision: 'APPROVED',
        comments: 'Attempted premature registrar bypass',
        context: registrarOfficer
      });
    }).toThrow(/Workflow Authorization Failed: Step 'Department Head Verification' requires role HOD/);
  });

  it('TEST 3: Delegation & Authorized Substitution: Allows acting delegate to execute approvals on behalf of delegator', () => {
    const instance = centralEnterpriseWorkflowBPMService.startWorkflow({
      workflowCode: 'WF-STUDENT-BONAFIDE-APPROVAL',
      entityType: 'STUDENT_SERVICE',
      entityId: 'SR-2026-000103',
      initiatedBy: 'stu-2026-001'
    });

    // 1. HOD delegates authority to Acting Faculty
    centralEnterpriseWorkflowBPMService.setDelegation({
      delegatorId: 'emp-hod-001',
      delegateId: 'emp-acting-fac-001',
      workflowCode: 'WF-STUDENT-BONAFIDE-APPROVAL',
      durationDays: 7
    });

    // 2. Acting Faculty approves Step 0
    const delegatedApproval = centralEnterpriseWorkflowBPMService.processApproval({
      instanceId: instance.id,
      decision: 'APPROVED',
      comments: 'Approved under official delegation orders during HOD conference leave.',
      context: actingFaculty
    });

    expect(delegatedApproval.current_step_index).toBe(1);
  });

  it('TEST 4: Visual Simulation: Traces execution path and SLA estimates without database mutations', () => {
    const simulation = centralEnterpriseWorkflowBPMService.simulateWorkflow({
      workflowCode: 'WF-STUDENT-BONAFIDE-APPROVAL',
      inputVariables: { amount: 0 }
    });

    expect(simulation.total_steps).toBe(2);
    expect(simulation.estimated_hours).toBe(48);
    expect(simulation.simulated_path[0]).toContain('Step 1: Department Head Verification');
  });

  it('TEST 5: Workflow BPM Dashboard Telemetry: Validates active instances, SLA compliance %, and posture', () => {
    const metrics = centralEnterpriseWorkflowBPMService.getWorkflowMonitoringMetrics(departmentHod);

    expect(metrics.activeInstancesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.completedInstancesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.slaCompliancePercent).toBeGreaterThanOrEqual(95);
    expect(metrics.workflowPosture).toBe('HEALTHY');
  });
});
