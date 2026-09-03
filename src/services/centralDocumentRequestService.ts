import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentGenerationService } from './centralDocumentGenerationService';
import { centralDocumentSignatureService } from './centralDocumentSignatureService';
import { centralDocumentSharingService } from './centralDocumentSharingService';

export type RequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ELIGIBILITY_REVIEW'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'PENDING_APPROVAL'
  | 'PROCESSING'
  | 'DOCUMENT_GENERATION'
  | 'SIGNATURE_PENDING'
  | 'READY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type RequestPaymentStatus = 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'WAIVED';
export type RequestApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentRequestTypeRecord {
  id: string;
  code: string; // e.g. BONAFIDE, NOC, TRANSCRIPT, EXPERIENCE_LETTER
  name: string;
  description: string;
  document_type_code: string;
  template_code: string;
  applicable_roles: string[]; // 'STUDENT', 'FACULTY', 'STAFF', 'ALUMNI'
  requires_approval: boolean;
  approver_role: string;
  requires_fee: boolean;
  fee_amount: number;
  requires_signature: boolean;
  signer_role: string;
  sla_hours: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
}

export interface DocumentRequestRecord {
  id: string;
  request_number: string;
  request_type_code: string;
  requester_type: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ALUMNI';
  requester_id: string;
  requester_name: string;
  requester_email: string;
  organization_id: string;
  purpose: string;
  status: RequestStatus;
  payment_status: RequestPaymentStatus;
  fee_amount: number;
  approval_status: RequestApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  generated_document_id?: string;
  generated_document_number?: string;
  signature_request_id?: string;
  delivery_status: 'PENDING' | 'DELIVERED';
  sla_due_at: string;
  is_sla_breached: boolean;
  created_at: string;
  completed_at?: string;
}

export interface DocumentRequestDashboardMetrics {
  totalRequestsCount: number;
  pendingPaymentCount: number;
  pendingApprovalCount: number;
  processingCount: number;
  completedCount: number;
  rejectedCount: number;
}

class CentralDocumentRequestService {
  private static instance: CentralDocumentRequestService;

  private requestTypes: DocumentRequestTypeRecord[] = [
    {
      id: 'req-type-bonafide-001',
      code: 'REQ_BONAFIDE_CERT',
      name: 'Student Bonafide Certificate Request',
      description: 'Official university certificate for visa, passport, or scholarship purposes',
      document_type_code: 'DOC_BONAFIDE_CERT',
      template_code: 'BONAFIDE_CERTIFICATE',
      applicable_roles: ['STUDENT', 'ALUMNI'],
      requires_approval: true,
      approver_role: 'REGISTRAR',
      requires_fee: true,
      fee_amount: 100, // ₹100
      requires_signature: true,
      signer_role: 'REGISTRAR',
      sla_hours: 24,
      status: 'ACTIVE'
    },
    {
      id: 'req-type-noc-001',
      code: 'REQ_NOC_CERT',
      name: 'No Objection Certificate (NOC) Request',
      description: 'NOC for external internships, project competitions, or travel',
      document_type_code: 'DOC_NOC_CERT',
      template_code: 'BONAFIDE_CERTIFICATE',
      applicable_roles: ['STUDENT', 'FACULTY', 'STAFF'],
      requires_approval: true,
      approver_role: 'REGISTRAR',
      requires_fee: false,
      fee_amount: 0,
      requires_signature: true,
      signer_role: 'REGISTRAR',
      sla_hours: 48,
      status: 'ACTIVE'
    }
  ];

  private requests: DocumentRequestRecord[] = [];
  private sequenceCounter = 100;

  private constructor() {}

  public static getInstance(): CentralDocumentRequestService {
    if (!CentralDocumentRequestService.instance) {
      CentralDocumentRequestService.instance = new CentralDocumentRequestService();
    }
    return CentralDocumentRequestService.instance;
  }

  // ─── ELIGIBILITY ASSESSMENT ENGINE ───────────────────────────────────

  public evaluateRequestEligibility(params: {
    requestTypeCode: string;
    requesterType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ALUMNI';
    requesterId: string;
  }): { isEligible: boolean; reason: string; requestType?: DocumentRequestTypeRecord } {
    const rType = this.requestTypes.find(t => t.code === params.requestTypeCode && t.status === 'ACTIVE');
    if (!rType) {
      return { isEligible: false, reason: `Request type '${params.requestTypeCode}' is not active or available` };
    }

    if (!rType.applicable_roles.includes(params.requesterType)) {
      return {
        isEligible: false,
        reason: `Role '${params.requesterType}' is not permitted to request '${rType.name}'`
      };
    }

    return { isEligible: true, reason: 'Eligible for request submission', requestType: rType };
  }

  // ─── CREATE DOCUMENT REQUEST ─────────────────────────────────────────

  public createDocumentRequest(params: {
    requestTypeCode: string;
    requesterType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ALUMNI';
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
    organizationId?: string;
    purpose: string;
    context?: UserAuthorizationContext;
  }): DocumentRequestRecord {
    const eligibility = this.evaluateRequestEligibility({
      requestTypeCode: params.requestTypeCode,
      requesterType: params.requesterType,
      requesterId: params.requesterId
    });

    if (!eligibility.isEligible || !eligibility.requestType) {
      throw new Error(`Request Creation Blocked: ${eligibility.reason}`);
    }

    const rType = eligibility.requestType;
    this.sequenceCounter += 1;
    const reqNumber = `SSIU/DOCREQ/2026/${String(this.sequenceCounter).padStart(6, '0')}`;
    const reqId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const slaDueAt = new Date(Date.now() + rType.sla_hours * 60 * 60 * 1000).toISOString();

    const request: DocumentRequestRecord = {
      id: reqId,
      request_number: reqNumber,
      request_type_code: rType.code,
      requester_type: params.requesterType,
      requester_id: params.requesterId,
      requester_name: params.requesterName,
      requester_email: params.requesterEmail,
      organization_id: params.organizationId || 'inst-sit',
      purpose: params.purpose,
      status: rType.requires_fee ? 'PAYMENT_PENDING' : (rType.requires_approval ? 'PENDING_APPROVAL' : 'PROCESSING'),
      payment_status: rType.requires_fee ? 'PENDING' : 'NOT_REQUIRED',
      fee_amount: rType.fee_amount,
      approval_status: rType.requires_approval ? 'PENDING' : 'NOT_REQUIRED',
      delivery_status: 'PENDING',
      sla_due_at: slaDueAt,
      is_sla_breached: false,
      created_at: new Date().toISOString()
    };

    this.requests.push(request);
    return request;
  }

  // ─── RECORD PAYMENT COMPLETION ───────────────────────────────────────

  public recordPayment(params: {
    requestId: string;
    transactionReference: string;
  }): DocumentRequestRecord {
    const req = this.requests.find(r => r.id === params.requestId);
    if (!req) throw new Error(`Document request ${params.requestId} not found`);

    req.payment_status = 'PAID';
    req.status = req.approval_status === 'PENDING' ? 'PENDING_APPROVAL' : 'PROCESSING';
    return req;
  }

  // ─── APPROVE DOCUMENT REQUEST & EXECUTE AUTOMATED PIPELINE ────────────

  public async approveAndProcessRequest(params: {
    requestId: string;
    approvedBy: string;
    approvalRole: string;
    mergeData?: Record<string, any>;
    context?: UserAuthorizationContext;
  }): Promise<DocumentRequestRecord> {
    const req = this.requests.find(r => r.id === params.requestId);
    if (!req) throw new Error(`Document request ${params.requestId} not found`);

    const rType = this.requestTypes.find(t => t.code === req.request_type_code);
    if (!rType) throw new Error(`Request type ${req.request_type_code} not found`);

    // 1. Verify Payment if Required
    if (rType.requires_fee && req.payment_status !== 'PAID' && req.payment_status !== 'WAIVED') {
      throw new Error(`Processing Blocked: Fee payment of ₹${rType.fee_amount} is pending for request ${req.request_number}`);
    }

    // 2. Mark Approved
    req.approval_status = 'APPROVED';
    req.approved_by = params.approvedBy;
    req.approved_at = new Date().toISOString();
    req.status = 'DOCUMENT_GENERATION';

    // 3. Automated Document Generation
    const mergeData = params.mergeData || {
      student: {
        name: req.requester_name,
        enrollment_no: 'SU26CSE0001'
      },
      program: {
        name: 'Bachelor of Technology in Computer Science & Engineering'
      },
      academic_year: '2026-2027'
    };

    const genDoc = centralDocumentGenerationService.generateOfficialDocument({
      templateCode: rType.template_code,
      sourceModule: 'DOCUMENT_REQUEST_PORTAL',
      sourceEntityType: 'DOCUMENT_REQUEST',
      sourceEntityId: req.id,
      ownerType: req.requester_type as any,
      ownerId: req.requester_id,
      mergeData,
      generatedBy: params.approvedBy,
      organizationId: req.organization_id
    });

    req.generated_document_id = genDoc.document_id;
    req.generated_document_number = genDoc.document_number;

    // 4. Automated Digital Signature Execution if Required
    if (rType.requires_signature) {
      req.status = 'SIGNATURE_PENDING';
      const sigReq = await centralDocumentSignatureService.createAndExecuteSignatureRequest({
        documentId: genDoc.document_id,
        documentNumber: genDoc.document_number,
        documentTypeCode: rType.document_type_code,
        versionNumber: 1,
        providerType: 'DIGITAL_SIGNATURE',
        signerId: params.approvedBy,
        signerName: 'Dr. Registrar',
        signerRole: rType.signer_role,
        contentPayload: genDoc.rendered_content,
        context: params.context
      });
      req.signature_request_id = sigReq.id;
    }

    // 5. Finalize Delivery
    req.status = 'DELIVERED';
    req.delivery_status = 'DELIVERED';
    req.completed_at = new Date().toISOString();

    return req;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getRequestDashboardMetrics(context?: UserAuthorizationContext): DocumentRequestDashboardMetrics {
    const totalRequestsCount = this.requests.length;
    const pendingPaymentCount = this.requests.filter(r => r.payment_status === 'PENDING').length;
    const pendingApprovalCount = this.requests.filter(r => r.approval_status === 'PENDING').length;
    const processingCount = this.requests.filter(r => r.status === 'PROCESSING' || r.status === 'DOCUMENT_GENERATION' || r.status === 'SIGNATURE_PENDING').length;
    const completedCount = this.requests.filter(r => r.status === 'DELIVERED' || r.status === 'READY').length;
    const rejectedCount = this.requests.filter(r => r.status === 'REJECTED').length;

    return {
      totalRequestsCount,
      pendingPaymentCount,
      pendingApprovalCount,
      processingCount,
      completedCount,
      rejectedCount
    };
  }
}

export const centralDocumentRequestService = CentralDocumentRequestService.getInstance();
