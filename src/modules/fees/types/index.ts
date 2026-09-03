/**
 * SSIU ERP — Fee Operations & Governance Domain Types
 * File: src/modules/fees/types/index.ts
 */

export interface FeeCollectionMetricsDTO {
  totalDemandAmountLakhs: number;
  totalCollectedAmountLakhs: number;
  totalPendingDuesAmountLakhs: number;
  collectionPercentage: number;
  totalInvoicesIssued: number;
  paidInvoicesCount: number;
  partialInvoicesCount: number;
  overdueInvoicesCount: number;
  headWiseCollection: Array<{
    feeHeadId: string;
    feeHeadName: string;
    collectedAmountLakhs: number;
    pendingAmountLakhs: number;
  }>;
}

export interface StudentFeeDuesSummaryDTO {
  studentId: string;
  enrollmentNumber: string;
  studentName: string;
  programName: string;
  semester: number;
  totalDemand: number;
  totalPaid: number;
  pendingDue: number;
  dueDate: string;
  agingBracket: 'CURRENT' | '1_30_DAYS' | '31_60_DAYS' | 'OVER_60_DAYS';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export interface ScholarshipAllocationRecordDTO {
  scholarshipId: string;
  studentId: string;
  studentName: string;
  schemeName: string;
  category: 'MERIT' | 'OBC' | 'SC_ST' | 'EWS' | 'SPORTS_QUOTA';
  sanctionedAmount: number;
  disbursedAmount: number;
  financialYear: string;
  verificationStatus: 'SANCTIONED' | 'DISBURSED' | 'UNDER_VERIFICATION';
}
