// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT SECTION & OFFICIAL SERVICES TYPES
// ==============================================================================

export type StudentSectionDeliveryMode = 'DIGITAL' | 'PHYSICAL' | 'BOTH';

export type StudentSectionRequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'DOCUMENT_READY'
  | 'READY'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type StudentSectionPaymentStatus = 
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'WAIVED';

export type StudentServiceCategory =
  | 'CERTIFICATE'
  | 'TRANSCRIPT'
  | 'DEGREE'
  | 'DUPLICATE_ID'
  | 'VERIFICATION'
  | 'MIGRATION'
  | 'TRANSFER'
  | 'MARKSHEET'
  | 'OTHER';

export interface StudentServiceFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
}

export interface StudentSectionService {
  id: string;
  code: string;
  name: string;
  description: string;
  category: StudentServiceCategory;
  fee: number;
  urgentFee: number;
  isRefundable: boolean;
  deliveryMode: StudentSectionDeliveryMode;
  processingDays: number;
  urgentProcessingDays: number;
  requiredDocuments: string[];
  customFields?: StudentServiceFieldConfig[];
  templateId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// SERVICE FEE MASTER CONFIGURATION TYPES
// ==============================================================================

export interface ServiceFeeMasterConfig {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: StudentServiceCategory;
  
  // Rate Rules (Official Paper Form Matrix)
  baseFeeEnrolled: number;          // Enrolled regular students
  baseFeePassout: number;           // Pass-out / graduated alumni
  perCopyFee: number;               // Cost per additional copy
  firstCopyIncluded: boolean;       // Base fee covers 1st copy (true default)
  
  // Document Type specific rates (for Document Verification & Attestation)
  documentTypeRates?: Record<string, { baseFee: number; perCopyFee: number }>;
  
  // Expedited / Urgent Surcharge
  urgentFee: number;
  
  // Surcharges & Postal
  postalCharges?: number;
  processingCharges?: number;
  
  isRefundable: boolean;
  isActive: boolean;
}

export interface ServiceFeeCalculationBreakdownItem {
  head: string;
  rate: number;
  qty: string;
  amount: number;
}

export interface ServiceFeeCalculationResult {
  serviceCode: string;
  serviceName: string;
  passoutStatus: 'NON_PASSOUT' | 'PASSOUT';
  documentType?: string;
  copies: number;
  
  baseFee: number;
  perCopyFee: number;
  additionalCopiesCount: number;
  copiesFeeTotal: number;
  urgentFee: number;
  postalCharges: number;
  processingCharges: number;
  
  totalFee: number;
  breakdownItems: ServiceFeeCalculationBreakdownItem[];
}

export interface StudentSectionTimelineItem {
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
  status: StudentSectionRequestStatus;
}

export interface StudentSectionRequest {
  id: string;
  requestNo: string; // e.g. SSR/2026/000001
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  admissionNo?: string;
  applicationNumber?: string;
  email: string;
  phone?: string;
  instituteId?: string;
  instituteName?: string;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  semesterId?: string;
  semesterName?: string;
  divisionName?: string;
  batchName?: string;
  academicYear?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  
  // Service configuration
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  category: StudentServiceCategory;
  purpose: string;
  copies: number;
  isUrgent: boolean;
  serviceSpecificData?: Record<string, any>;

  // Financial / Payment
  calculatedFee: number;
  paymentStatus: StudentSectionPaymentStatus;
  paymentTransactionId?: string;
  receiptNo?: string;
  paymentMode?: string;
  paidAt?: string;

  // Delivery & Dispatch
  deliveryMode: StudentSectionDeliveryMode;
  deliveryAddress?: string;
  trackingNumber?: string;
  dispatchedAt?: string;

  // Review & Processing Lifecycle
  status: StudentSectionRequestStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  rejectionReason?: string;
  remarks?: string;
  expectedCompletionDate?: string;
  workingDaysDueDate?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedAt?: string;
  processedBy?: string;
  processedByName?: string;
  processedAt?: string;
  documentReadyAt?: string;
  collectedBy?: string;
  collectedByName?: string;
  collectedAt?: string;
  deliveryOfficerName?: string;

  // Generated Document
  documentId?: string;
  documentNo?: string;
  documentUrl?: string;
  documentIssuedAt?: string;

  // Attachments
  attachments: {
    name: string;
    url: string;
    uploadedAt: string;
    fileSize?: string;
    required?: boolean;
  }[];

  timeline: StudentSectionTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentSectionDocument {
  id: string;
  documentNo: string; // e.g. SSIU/DOC/2026/000123
  requestId: string;
  requestNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  departmentName: string;
  programName: string;
  serviceName: string;
  title: string;
  contentHtml?: string;
  fileUrl: string;
  fileType: 'PDF' | 'IMAGE';
  generatedBy: string;
  generatedByName: string;
  generatedAt: string;
  version: number;
  verificationCode: string; // QR / Security Hash
  status: 'ACTIVE' | 'REVOKED';
  downloadsCount: number;
}
