export type StudentRequestCategory =
  | 'ACADEMIC'
  | 'SUBJECT_RELATED'
  | 'ATTENDANCE'
  | 'FACULTY_RELATED'
  | 'EXAMINATION'
  | 'FEES'
  | 'ACCOUNTS'
  | 'HOSTEL'
  | 'TRANSPORT'
  | 'IT_SUPPORT'
  | 'LIBRARY'
  | 'ADMINISTRATION'
  | 'DOCUMENT_CERTIFICATE'
  | 'COMPLAINT'
  | 'OTHER';

export type StudentRequestStatus =
  | 'SUBMITTED'
  | 'WITH_MENTOR'
  | 'FORWARDED_TO_FACULTY'
  | 'WITH_FACULTY'
  | 'FORWARDED_TO_HOD'
  | 'WITH_HOD'
  | 'FORWARDED_TO_HOI'
  | 'WITH_HOI'
  | 'FORWARDED_TO_DEPARTMENT'
  | 'WITH_DEPARTMENT'
  | 'WORK_IN_PROGRESS'
  | 'RESOLVED_BY_FACULTY'
  | 'RESOLVED_BY_HOD'
  | 'RESOLVED_BY_HOI'
  | 'RESOLVED_BY_DEPARTMENT'
  | 'RESOLVED'
  | 'RETURNED_TO_MENTOR'
  | 'RETURNED_FOR_REWORK'
  | 'COMPLETED'
  | 'REOPENED'
  | 'CANCELLED';

export type HandlerDestinationType =
  | 'MENTOR'
  | 'SUBJECT_FACULTY'
  | 'HOD'
  | 'HOI'
  | 'DEPARTMENT';

export type AuthorizedDepartment =
  | 'ACCOUNTS_ADMIN'
  | 'HOSTEL_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'STUDENT_SECTION'
  | 'MAINTENANCE_ADMIN'
  | 'LIBRARY_ADMIN'
  | 'EXAM_CELL'
  | 'IT_SUPPORT';

export interface StudentRequestAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface StudentRequestTimelineItem {
  id: string;
  action: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  toUserId?: string;
  toUserName?: string;
  toUserRole?: string;
  timestamp: string;
  remarks: string;
  isInternalOnly?: boolean;
  status: StudentRequestStatus;
}

export interface StudentRequest {
  id: string;
  requestNo: string; // e.g. "REQ/2026/000001"
  
  // Student Metadata
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  studentEmail: string;
  studentPhone: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  programId: string;
  semesterId: string;
  divisionId?: string;

  // Request Details
  category: StudentRequestCategory;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  subject: string; // Request Subject Line / Title
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  attachments?: StudentRequestAttachment[];
  preferredContact?: string;

  // Assigned Origin Mentor (Immutable Anchor)
  mentorId: string;
  mentorName: string;
  mentorEmail?: string;

  // Current Handler / Desk
  currentHandler: HandlerDestinationType;
  currentHandlerId?: string;
  currentHandlerName?: string;
  currentHandlerRole?: string;
  targetDepartment?: AuthorizedDepartment;

  // Status & Lifecycle
  status: StudentRequestStatus;

  // Assigned Actors throughout escalation
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  assignedHodId?: string;
  assignedHodName?: string;
  assignedHoiId?: string;
  assignedHoiName?: string;

  // Work & Resolution Details
  resolutionSummary?: string;
  resolvedByRole?: string;
  resolvedByName?: string;
  resolvedAt?: string;

  // Rework & Reopen Lifecycle
  reworkRemarks?: string;
  reopenReason?: string;
  reopenCount?: number;
  reopenedAt?: string;
  completedAt?: string;

  // Complete Audit Timeline
  timeline: StudentRequestTimelineItem[];

  createdAt: string;
  updatedAt: string;
}
