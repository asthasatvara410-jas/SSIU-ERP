import { describe, it, expect } from 'vitest';
import { centralDocumentRequestService } from '../services/centralDocumentRequestService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.10: Central Document Request Portal, Fee Integration & Automated Pipeline Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['REQUEST_VIEW', 'REQUEST_APPROVE', 'REQUEST_DELIVER', 'SIGN_DOCUMENT']
  };

  it('TEST 1: Eligibility Evaluation: Validates permitted requester roles per document request type', () => {
    // 1. Student requesting Student Bonafide Certificate -> ELIGIBLE
    const eligibleStudent = centralDocumentRequestService.evaluateRequestEligibility({
      requestTypeCode: 'REQ_BONAFIDE_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000001'
    });

    expect(eligibleStudent.isEligible).toBe(true);
    expect(eligibleStudent.requestType?.fee_amount).toBe(100);

    // 2. Faculty requesting Student Bonafide Certificate -> NOT_ELIGIBLE
    const ineligibleFaculty = centralDocumentRequestService.evaluateRequestEligibility({
      requestTypeCode: 'REQ_BONAFIDE_CERT',
      requesterType: 'FACULTY',
      requesterId: 'FAC-2026-000001'
    });

    expect(ineligibleFaculty.isEligible).toBe(false);
    expect(ineligibleFaculty.reason).toContain('Role \'FACULTY\' is not permitted');
  });

  it('TEST 2: Online Request Submission & Fee Integration: Generates request number and enforces payment workflow', () => {
    const req = centralDocumentRequestService.createDocumentRequest({
      requestTypeCode: 'REQ_BONAFIDE_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000001',
      requesterName: 'Aarav Patel',
      requesterEmail: 'aarav.patel@swarrnim.edu.in',
      purpose: 'Application for international education visa',
      organizationId: 'inst-sit'
    });

    expect(req.id).toBeDefined();
    expect(req.request_number).toContain('SSIU/DOCREQ/2026/');
    expect(req.status).toBe('PAYMENT_PENDING');
    expect(req.payment_status).toBe('PENDING');
    expect(req.fee_amount).toBe(100);
    expect(req.sla_due_at).toBeDefined();

    // Payment completion transitions request to PENDING_APPROVAL
    const paidReq = centralDocumentRequestService.recordPayment({
      requestId: req.id,
      transactionReference: 'TXN_UPI_98234789'
    });

    expect(paidReq.payment_status).toBe('PAID');
    expect(paidReq.status).toBe('PENDING_APPROVAL');
  });

  it('TEST 3: Payment Precondition Enforcement: Blocks processing if required fee has not been paid', async () => {
    const req = centralDocumentRequestService.createDocumentRequest({
      requestTypeCode: 'REQ_BONAFIDE_CERT',
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000002',
      requesterName: 'Diya Shah',
      requesterEmail: 'diya.shah@swarrnim.edu.in',
      purpose: 'Scholarship verification',
      organizationId: 'inst-sit'
    });

    // Attempting to approve/process while payment is pending must fail
    await expect(
      centralDocumentRequestService.approveAndProcessRequest({
        requestId: req.id,
        approvedBy: 'emp-reg-001',
        approvalRole: 'REGISTRAR',
        context: registrarContext
      })
    ).rejects.toThrow(/Processing Blocked: Fee payment of ₹100 is pending/);
  });

  it('TEST 4: End-to-End Automated Pipeline: Executes approval, generation, digital signature and DMS delivery', async () => {
    const req = centralDocumentRequestService.createDocumentRequest({
      requestTypeCode: 'REQ_NOC_CERT', // Fee: 0
      requesterType: 'STUDENT',
      requesterId: 'STU-2026-000003',
      requesterName: 'Rohan Mehra',
      requesterEmail: 'rohan.mehra@swarrnim.edu.in',
      purpose: 'Summer internship at tech company',
      organizationId: 'inst-sit'
    });

    expect(req.payment_status).toBe('NOT_REQUIRED');
    expect(req.status).toBe('PENDING_APPROVAL');

    const completedReq = await centralDocumentRequestService.approveAndProcessRequest({
      requestId: req.id,
      approvedBy: 'emp-reg-001',
      approvalRole: 'REGISTRAR',
      mergeData: {
        student: {
          name: 'Rohan Mehra',
          enrollment_no: 'SU26CSE0003'
        },
        program: {
          name: 'Bachelor of Technology in Computer Science & Engineering'
        },
        academic_year: '2026-2027'
      },
      context: registrarContext
    });

    expect(completedReq.approval_status).toBe('APPROVED');
    expect(completedReq.status).toBe('DELIVERED');
    expect(completedReq.delivery_status).toBe('DELIVERED');
    expect(completedReq.generated_document_id).toBeDefined();
    expect(completedReq.generated_document_number).toContain('SSIU/BON/2026/');
    expect(completedReq.signature_request_id).toBeDefined();
    expect(completedReq.completed_at).toBeDefined();
  });

  it('TEST 5: Request Dashboard Metrics: Computes authoritative pipeline and status counters', () => {
    const metrics = centralDocumentRequestService.getRequestDashboardMetrics(registrarContext);

    expect(metrics.totalRequestsCount).toBeGreaterThanOrEqual(3);
    expect(metrics.completedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.pendingPaymentCount).toBeGreaterThanOrEqual(1);
  });
});
