export type DocumentCategory =
  | 'ACADEMIC'
  | 'IDENTITY'
  | 'ADMISSION'
  | 'UNIVERSITY_RECORD'
  | 'COMPLETION_EXIT'
  | 'FINANCIAL_SCHOLARSHIP'
  | 'INTERNATIONAL_STUDENT'
  | 'INTERNSHIP_TRAINING'
  | 'MEDICAL'
  | 'OTHER';

export type InternationalSubcategory =
  | 'IDENTITY_NATIONALITY'
  | 'IMMIGRATION_VISA'
  | 'ADMISSION'
  | 'ACADEMIC_QUALIFICATION'
  | 'FINANCIAL_SPONSORSHIP'
  | 'MEDICAL_INSURANCE'
  | 'ACCOMMODATION_LOCAL'
  | 'UNIVERSITY_COMPLIANCE'
  | 'EXIT_COMPLETION';

export type DocumentRequirementType = 'REQUIRED' | 'OPTIONAL' | 'NOT_APPLICABLE';
export type StudentTypeApplicability = 'ALL' | 'DOMESTIC' | 'INTERNATIONAL';
export type DocumentVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REUPLOAD_REQUIRED' | 'EXPIRED';

export interface DocumentMasterItem {
  id: string;
  code: string;
  name: string;
  category: DocumentCategory;
  subcategory?: string;
  description?: string;
  required: DocumentRequirementType;
  studentType: StudentTypeApplicability;
  programId?: string;
  departmentId?: string;
  admissionType?: string;
  semester?: number;
  internationalOnly: boolean;
  verificationRequired: boolean;
  verifiedByRole: string; // FACULTY_MENTOR | HOD | PRINCIPAL | STUDENT_SECTION | REGISTRAR | UNIVERSITY_ADMIN
  allowedFileTypes: string[]; // ['pdf', 'jpg', 'jpeg', 'png']
  maxFileSize: number; // in MB
  multipleFilesAllowed: boolean;
  expiryRequired: boolean;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface StudentAcademicDocumentItem {
  id: string;
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  documentMasterId: string;
  documentCode: string;
  documentName: string;
  category: DocumentCategory;
  subcategory?: string;
  studentType: 'DOMESTIC' | 'INTERNATIONAL';
  currentVersion: number;
  
  fileName: string;
  fileSize: string;
  fileUrl: string;
  fileType?: string;
  
  issueDate?: string;
  expiryDate?: string;
  
  status: DocumentVerificationStatus;
  isLocked: boolean; // Locked after verification
  
  verifiedByUserId?: string;
  verifiedByName?: string;
  verifiedByRole?: string;
  verifiedAt?: string;
  
  rejectionReason?: string;
  remarks?: string;
  
  createdAt: string;
  updatedAt: string;
  
  versions?: StudentDocumentVersionItem[];
}

export interface StudentDocumentVersionItem {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  fileType?: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedAt: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  remarks?: string;
}

export interface DocumentVerificationLogItem {
  id: string;
  documentId: string;
  action: 'VERIFIED' | 'REJECTED' | 'UNLOCKED_OVERRIDE' | 'REUPLOAD_REQUESTED';
  performedByUserId: string;
  performedByName: string;
  performedByRole: string;
  reason?: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface DocumentFilterOptions {
  category?: DocumentCategory | 'ALL';
  subcategory?: string;
  studentType?: StudentTypeApplicability;
  required?: DocumentRequirementType | 'ALL';
  internationalOnly?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  searchQuery?: string;
}
