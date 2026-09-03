import { describe, it, expect } from 'vitest';
import { centralDocumentWorkflowService } from '../services/centralDocumentWorkflowService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.18: Central Document Workflow, Multi-Level Approval & SLA Engine', () => {

  const studentContext: UserAuthorizationContext = {
    userId: 'STU-2026-000001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['REQUEST_OWN_DOCUMENTS']
  };

  const studentSectionContext: UserAuthorizationContext = {
    userId: 'emp-sec-001',
    userName: 'Student Section Officer',
    email: 'student.section@swarrnim.edu.in',
    activeRole: 'STUDENT_SECTION_OFFICER',
    assignedRoles: ['STUDENT_SECTION_OFFICER'],
    permissions: ['REVIEW_DOCUMENT_REQUEST']
  };

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['APPROVE_DOCUMENT_REQUEST', 'WORKFLOW_ADMIN']
  };

  const deputyRegistrarContext: UserAuthorizationContext = {
    userId: 'emp-dep-reg-001',
    userName: 'Deputy Registrar',
    email: 'deputy.registrar@swarrnim.edu.in',
    activeRole: 'DEPUTY_REGISTRAR',
    assignedRoles: ['DEPUTY_REGISTRAR'],
    permissions: ['REVIEW_DOCUMENT_REQUEST']
  };

  it('TEST 1: Multi-Level Sequential Approval: Advances Level 1 Student Section to Level 2 Registrar', () => {
    // 1. Student initiates Bonafide request
    const wf = centralDocumentWorkflowService.startDocumentRequestWorkflow({
      documentTypeId: 'DOC_BONAFIDE_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000001',
      requesterName: 'Aarav Patel',
      organizationId: 'inst-sit',
      departmentId: 'dept-cse',
      purpose: 'Bank Loan Application',
      priority: 'HIGH',
      payload: {
        student: { name: 'Aarav Patel', enrollment_no: 'SSIU-2026-001', is_scholarship_holder: true },
        program: { name: 'B.Tech Computer Engineering' },
        issue_date: '2026-08-29'
      }
    });

    expect(wf.id).toBeDefined();
    expect(wf.status).toBe('PENDING_APPROVAL');
    expect(wf.current_step_number).toBe(1);

    // 2. Level 1 Approval (Student Section)
    const step1Result = centralDocumentWorkflowService.approveStep({
      instanceId: wf.id,
      approver: studentSectionContext,
      comment: 'Verified enrolled student & fee clearance'
    });

    expect(step1Result.completedStep.status).toBe('APPROVED');
    expect(step1Result.isWorkflowCompleted).toBe(false);
    expect(step1Result.instance.current_step_number).toBe(2);

    // 3. Level 2 Approval (Registrar) -> Finalizes Workflow
    const step2Result = centralDocumentWorkflowService.approveStep({
      instanceId: wf.id,
      approver: registrarContext,
      comment: 'Approved bonafide certificate issue'
    });

    expect(step2Result.completedStep.status).toBe('APPROVED');
    expect(step2Result.isWorkflowCompleted).toBe(true);
    expect(step2Result.instance.status).toBe('APPROVED');
  });

  it('TEST 2: Separation of Duties: Prevents student from approving their own request', () => {
    const wf = centralDocumentWorkflowService.startDocumentRequestWorkflow({
      documentTypeId: 'DOC_NOC_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000001',
      requesterName: 'Aarav Patel',
      organizationId: 'inst-sit',
      purpose: 'Internship NOC',
      payload: { student: { name: 'Aarav Patel' } }
    });

    // Student attempts to approve own request -> SoD violation
    expect(() => {
      centralDocumentWorkflowService.approveStep({
        instanceId: wf.id,
        approver: studentContext,
        comment: 'Self approving'
      });
    }).toThrow(/Separation of Duties Violation: Requester cannot approve their own document request/);
  });

  it('TEST 3: Return for Correction & Resubmission: Allows correction cycle without permanent termination', () => {
    const wf = centralDocumentWorkflowService.startDocumentRequestWorkflow({
      documentTypeId: 'DOC_NOC_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000001',
      requesterName: 'Aarav Patel',
      organizationId: 'inst-sit',
      purpose: 'Visa NOC',
      payload: { student: { name: 'Aarav Patel' } }
    });

    // 1. Approver returns for correction
    const returned = centralDocumentWorkflowService.returnForCorrection({
      instanceId: wf.id,
      approver: studentSectionContext,
      correctionReason: 'Missing company internship offer letter attachment'
    });

    expect(returned.status).toBe('RETURNED');
    expect(returned.return_reason).toContain('Missing company internship offer letter');

    // 2. Student resubmits with updated payload
    const resubmitted = centralDocumentWorkflowService.resubmitRequest({
      instanceId: wf.id,
      requesterId: 'STU-2026-000001',
      updatedPayload: { offer_letter_attached: true },
      resubmissionNotes: 'Attached offer letter from TCS'
    });

    expect(resubmitted.status).toBe('PENDING_APPROVAL');
    expect(resubmitted.resubmission_count).toBe(1);
    expect(resubmitted.current_step_number).toBe(1);
  });

  it('TEST 4: Permanent Rejection: Terminates workflow with mandatory audit reason', () => {
    const wf = centralDocumentWorkflowService.startDocumentRequestWorkflow({
      documentTypeId: 'DOC_NOC_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000001',
      requesterName: 'Aarav Patel',
      organizationId: 'inst-sit',
      purpose: 'Duplicate NOC',
      payload: { student: { name: 'Aarav Patel' } }
    });

    const rejected = centralDocumentWorkflowService.rejectStep({
      instanceId: wf.id,
      approver: studentSectionContext,
      reason: 'Disciplinary suspension active - request denied'
    });

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejection_reason).toContain('Disciplinary suspension active');
  });

  it('TEST 5: Delegation, Timeline & Dashboard Metrics: Validates delegation and workflow metrics', () => {
    // 1. Registrar delegates to Deputy Registrar
    const del = centralDocumentWorkflowService.delegateApproval({
      originalApproverId: 'emp-reg-001',
      delegateUserId: 'emp-dep-reg-001',
      role: 'REGISTRAR',
      reason: 'Annual leave',
      startDate: '2026-08-28',
      endDate: '2026-09-05'
    });
    expect(del.status).toBe('ACTIVE');

    // 2. Check workflow timeline
    const timeline = centralDocumentWorkflowService.getWorkflowTimeline('wf-inst-001');
    expect(timeline.instance).toBeDefined();
    expect(timeline.steps.length).toBe(2);
    expect(timeline.actions.length).toBeGreaterThanOrEqual(2);

    // 3. Workflow Dashboard Metrics
    const metrics = centralDocumentWorkflowService.getWorkflowDashboardMetrics();
    expect(metrics.totalRequestsCount).toBeGreaterThanOrEqual(4);
    expect(metrics.approvedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.returnedCount).toBeGreaterThanOrEqual(0);
    expect(metrics.delegatedCount).toBeGreaterThanOrEqual(1);
  });
});
