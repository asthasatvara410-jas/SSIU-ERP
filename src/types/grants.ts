/**
 * SSIU ERP — GRANTS & SSIP MANAGEMENT TYPES
 * Stage 10.2: Full Institutional Grants, SSIP 2.0 & Seed Funding Lifecycle
 */

export type GrantType =
  | 'GOVERNMENT'
  | 'RESEARCH'
  | 'SSIP'
  | 'INSTITUTIONAL'
  | 'INDUSTRY'
  | 'SEED_FUNDING'
  | 'STARTUP'
  | 'HACKATHON'
  | 'OTHER';

export type GrantOpportunityStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'CLOSING_SOON'
  | 'CLOSED'
  | 'ARCHIVED';

export type GrantApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'RECOMMENDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SANCTIONED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CLOSED';

export type GrantMilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DELAYED'
  | 'COMPLETED';

export type GrantExpenseCategory =
  | 'EQUIPMENT'
  | 'SOFTWARE'
  | 'PROTOTYPE'
  | 'MATERIALS'
  | 'TRAVEL'
  | 'PUBLICATION'
  | 'CONFERENCE'
  | 'CONSULTANCY'
  | 'STUDENT_SUPPORT'
  | 'OTHER';

export type GrantExpenseVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export type GrantDocumentType =
  | 'PROPOSAL'
  | 'SANCTION_LETTER'
  | 'APPROVAL_LETTER'
  | 'BUDGET'
  | 'AGREEMENT'
  | 'INVOICE'
  | 'UTILIZATION_CERTIFICATE'
  | 'STATEMENT_OF_EXPENDITURE'
  | 'PROGRESS_REPORT'
  | 'FINAL_REPORT'
  | 'OTHER';

export interface GrantOpportunityItem {
  id: string;
  opportunityCode: string; // e.g. "OPP-2026-001"
  title: string;
  grantingAgency: string; // "DST", "SERB", "SSIP 2.0", "AICTE", "GUJCOST", "BIRAC", "MeitY", "Institutional Seed"
  schemeName?: string;
  grantType: GrantType;
  description: string;
  eligibilityCriteria: string;
  targetAudience: 'FACULTY' | 'STUDENT' | 'BOTH';
  departmentId?: string;
  departmentName?: string;
  openingDate: string;
  closingDate: string;
  minFundingAmount: number;
  maxFundingAmount: number;
  applicationGuidelines?: string;
  requiredDocuments: string[];
  externalApplicationUrl?: string;
  status: GrantOpportunityStatus;
  academicYear: string;
  createdBy: string;
  createdAt: string;
}

export interface BudgetBreakdownItem {
  category: GrantExpenseCategory;
  allocatedAmount: number;
  description?: string;
}

export interface ApprovalActionLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  comment?: string;
  previousStatus: GrantApplicationStatus;
  newStatus: GrantApplicationStatus;
  timestamp: string;
}

export interface GrantApplicationItem {
  id: string;
  applicationNumber: string; // e.g. "APP-2026-001"
  opportunityId?: string;
  opportunityTitle?: string;
  grantType: GrantType;
  grantingAgency: string;
  projectTitle: string;
  projectSummary: string;
  objectives: string;
  methodology?: string;
  expectedOutcomes: string;
  applicantType: 'FACULTY' | 'STUDENT';
  applicantId: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName: string;
  facultyMentorId?: string;
  facultyMentorName?: string;
  teamMembers?: Array<{
    name: string;
    role: string;
    enrollmentNo?: string;
    email?: string;
  }>;
  linkedStartupId?: string;
  linkedStartupName?: string;
  linkedInnovationId?: string;
  requestedAmount: number;
  sanctionedAmount?: number;
  durationMonths: number;
  budgetBreakdown: BudgetBreakdownItem[];
  supportingDocuments: string[];
  declarationAccepted: boolean;
  submittedDate: string;
  status: GrantApplicationStatus;
  currentReviewerId?: string;
  currentReviewerRole?: string;
  reviewComments?: string;
  approvalHistory: ApprovalActionLog[];
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrantSanctionItem {
  id: string;
  sanctionNumber: string; // e.g. "SAN-2026-001"
  applicationId: string;
  applicationNumber: string;
  projectTitle: string;
  grantingAgency: string;
  grantType: GrantType;
  sanctionedAmount: number;
  totalReleasedAmount: number;
  totalUtilizedAmount: number;
  remainingAmount: number;
  sanctionDate: string;
  projectStartDate: string;
  projectEndDate: string;
  fundingSource: string;
  conditions?: string;
  authorizedSignatory: string;
  sanctionLetterDocId?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'TERMINATED';
  academicYear: string;
}

export interface GrantDisbursementItem {
  id: string;
  releaseReference: string; // e.g. "REL-2026-001"
  sanctionId: string;
  applicationId: string;
  projectTitle: string;
  installmentNumber: number;
  amount: number;
  disbursementDate: string;
  financeTransactionId?: string;
  paymentMode: 'BANK_TRANSFER' | 'CHEQUE' | 'TREASURY_CHALLAN' | 'INTERNAL_LEDGER';
  status: 'PENDING' | 'RELEASED' | 'CANCELLED';
  remarks?: string;
  releasedBy: string;
  createdAt: string;
}

export interface GrantMilestoneItem {
  id: string;
  sanctionId: string;
  applicationId: string;
  projectTitle: string;
  milestoneNumber: number;
  title: string;
  description?: string;
  dueDate: string;
  completedDate?: string;
  weightagePercentage: number;
  completionPercentage: number;
  status: GrantMilestoneStatus;
  evidenceDocUrl?: string;
  reviewerComments?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface GrantExpenseItem {
  id: string;
  sanctionId: string;
  applicationId: string;
  projectTitle: string;
  category: GrantExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  vendorName?: string;
  invoiceNumber?: string;
  receiptDocUrl?: string;
  verificationStatus: GrantExpenseVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verifiedDate?: string;
  verificationComment?: string;
  submittedBy: string;
  createdAt: string;
}

export interface GrantDocumentItem {
  id: string;
  sanctionId?: string;
  applicationId?: string;
  projectTitle?: string;
  title: string;
  documentType: GrantDocumentType;
  fileUrl: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedRole?: string;
  uploadedAt: string;
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface SSIPProjectItem {
  id: string;
  projectCode: string; // e.g. "SSIP-2026-001"
  title: string;
  description?: string;
  studentLeadId: string;
  studentLeadName: string;
  studentEnrollment?: string;
  departmentId: string;
  departmentName: string;
  facultyMentorId?: string;
  facultyMentorName?: string;
  startupId?: string;
  startupName?: string;
  schemeName: string; // "SSIP 2.0 Policy (Govt of Gujarat)"
  sanctionedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  milestoneStage: 'IDEATION' | 'PROOF_OF_CONCEPT' | 'PROTOTYPE' | 'PILOT_TEST' | 'STARTUP_INCORPORATED';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';
  startDate: string;
  endDate?: string;
  academicYear: string;
  createdAt: string;
}

export interface GrantMetricsData {
  totalOpportunities: number;
  openOpportunities: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  sanctionedApplications: number;
  rejectedApplications: number;
  totalSanctions: number;
  activeSanctions: number;
  totalSanctionedAmount: number;
  totalReleasedAmount: number;
  totalUtilizedAmount: number;
  totalRemainingBalance: number;
  overallUtilizationPercentage: number;
  totalSSIPProjects: number;
  activeSSIPProjects: number;
  totalSSIPFundingSanctioned: number;
  totalSSIPDisbursed: number;
  totalMilestones: number;
  completedMilestones: number;
  delayedMilestones: number;
  totalDocuments: number;
  agencyBreakdown: Record<string, { count: number; sanctionedAmount: number; releasedAmount: number }>;
  grantTypeBreakdown: Record<string, { count: number; sanctionedAmount: number }>;
  departmentBreakdown: Record<string, { count: number; sanctionedAmount: number; ssipCount: number }>;
  yearlyTrajectory: Array<{
    academicYear: string;
    grantsCount: number;
    sanctionedAmount: number;
    utilizedAmount: number;
    ssipCount: number;
  }>;
}

export interface GrantFilterState {
  academicYear: string;
  instituteId: string;
  departmentId: string;
  grantType: string;
  grantingAgency: string;
  status: string;
  applicantType: string;
  searchQuery: string;
}

export interface GrantNaacSummary {
  criterion: string;
  criterionTitle: string;
  metric: string;
  metricDescription: string;
  totalFundedProjects: number;
  totalSanctionedINR: number;
  governmentGrantsINR: number;
  nonGovernmentGrantsINR: number;
  ssipGrantsINR: number;
  industryGrantsINR: number;
  averageGrantPerFacultyINR: number;
  totalFacultyBeneficiaries: number;
  totalStudentBeneficiaries: number;
  evidenceDocumentCount: number;
  complianceStatus: string;
}
