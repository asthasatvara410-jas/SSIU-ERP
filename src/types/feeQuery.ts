// ==============================================================================
// SWARRNIM UNIVERSITY ERP — FEE QUERY & EXAM FEE CONFIG TYPES
// ==============================================================================

export type FeeQueryCategory =
  | 'SEMESTER_FEE'
  | 'EXAM_FEE'
  | 'BACKLOG_FEE'
  | 'RE_EXAM_FEE'
  | 'RECHECK_FEE'
  | 'REASSESSMENT_FEE'
  | 'LATE_FEE'
  | 'PAYMENT_ISSUE'
  | 'RECEIPT_ISSUE'
  | 'REFUND'
  | 'OTHER_FEE_QUERY';

export type FeeQueryStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED';

export interface FeeQueryTimelineItem {
  id: string;
  action: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  toUserId?: string;
  toUserName?: string;
  toUserRole?: string;
  timestamp: string;
  remarks?: string;
  status: FeeQueryStatus;
}

export interface FeeQuery {
  id: string;
  queryNo: string; // e.g. FQ/2026/000001
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  
  category: FeeQueryCategory;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  attachmentUrl?: string;

  // Optional references
  studentFeeRecordId?: string;
  paymentTransactionId?: string;
  claimedAmount?: number;
  transactionReferenceNo?: string;

  status: FeeQueryStatus;
  assignedAccountsHandlerId?: string;
  assignedAccountsHandlerName?: string;
  resolutionSummary?: string;
  resolutionRemarks?: string;
  resolvedAt?: string;

  timeline: FeeQueryTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export type ExamFeeCategory =
  | 'REGULAR_EXAM'
  | 'BACKLOG_EXAM'
  | 'RE_EXAM'
  | 'RECHECK'
  | 'REASSESSMENT'
  | 'EXAM_FORM'
  | 'LATE_EXAM_FORM';

export interface ExamFeeConfigItem {
  id: string;
  category: ExamFeeCategory;
  name: string;
  code: string;
  description: string;
  baseAmount: number;
  perSubjectAmount: number;
  lateFeePerDay: number;
  maxLateFee: number;
  isRefundable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
