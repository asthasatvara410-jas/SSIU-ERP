export type WorkTransferStatus = 
  | 'REQUESTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED' 
  | 'ACTIVE' 
  | 'EXPIRED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REVOKED';

export type WorkItemType = 
  | 'LECTURE'
  | 'TUTORIAL'
  | 'PRACTICAL'
  | 'PROJECT_SUPERVISION'
  | 'MENTORING'
  | 'EXAMINATION_DUTY'
  | 'EVALUATION'
  | 'ACADEMIC_COORDINATION'
  | 'DEPARTMENT_COORDINATION'
  | 'EDP_DUTY'
  | 'COMMITTEE'
  | 'ADMINISTRATIVE'
  | 'EVENT_ACTIVITY'
  | 'OTHER'
  | 'STUDENT_TASK' 
  | 'STUDENT_REQUEST' 
  | 'APPROVAL_REQUEST' 
  | 'EXAM_VERIFICATION' 
  | 'ATTENDANCE_TASK' 
  | 'MARKS_ENTRY' 
  | 'DOCUMENT_VERIFICATION' 
  | 'GRIEVANCE' 
  | 'WORK_DIARY' 
  | 'COURSE_WORKLOAD';

export type TransferReason = 
  | 'LEAVE' 
  | 'VACATION' 
  | 'WEEK_OFF' 
  | 'OFFICIAL_DUTY' 
  | 'UNAVAILABLE' 
  | 'TEMPORARY_ASSIGNMENT' 
  | 'EMERGENCY'
  | 'OTHER';

export type WorkPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WorkStatus = 'ACTIVE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELEGATED' | 'TRANSFERRED';

export interface WorkTransferAuditEvent {
  id: string;
  transferId: string;
  workItemId?: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 
    | 'TRANSFER_CREATED' 
    | 'TRANSFER_CONFIRMED' 
    | 'TRANSFER_ACTIVATED' 
    | 'WORK_ACCESSED' 
    | 'WORK_COMPLETED' 
    | 'TRANSFER_EXPIRED' 
    | 'RESPONSIBILITY_RESTORED' 
    | 'TRANSFER_REVOKED' 
    | 'TRANSFER_CANCELLED'
    | 'TRANSFER_APPROVED'
    | 'TRANSFER_REJECTED';
  details: string;
}

export interface FacultyWorkloadItem {
  id: string;
  workId: string; // e.g. "WL-001"
  workType: WorkItemType;
  workTitle: string;
  description: string;
  subjectName?: string;
  subjectId?: string;
  courseCode?: string;
  programName?: string;
  programId?: string;
  semesterNumber?: number;
  semesterId?: string;
  divisionName?: string;
  divisionId?: string;
  instituteName?: string;
  instituteId?: string;
  departmentName?: string;
  departmentId?: string;
  studentReference?: string; // e.g. "12 Mentees" or student name/enrollment
  assignedDate: string;
  dueDate?: string;
  weeklyHours?: number; // Real weekly academic load hours
  priority: WorkPriority;
  responsibility: string; // e.g. "Faculty", "Mentor", "Lab Incharge", "Coordinator", "Examiner"
  status: WorkStatus;
  facultyId: string;
  facultyName: string;
  isTransferredOut?: boolean;
  isReceivedTransfer?: boolean;
  transferTrackingCode?: string;
  transferId?: string;
  transferredFromFacultyId?: string;
  transferredFromFacultyName?: string;
}

export interface FacultyPortfolioSummary {
  facultyId: string;
  employeeId: string;
  facultyName: string;
  designation: string;
  instituteName: string;
  instituteId: string;
  departmentName: string;
  departmentId: string;
  programName: string;
  employmentType: string;
  academicYear: string;
  specialization: string;
  assignedSubjects: {
    id: string;
    name: string;
    code: string;
    type: 'THEORY' | 'PRACTICAL' | 'BOTH';
    weeklyHours: number;
    semester: number;
    division: string;
  }[];
  assignedClasses: string[];
  assignedDivisions: string[];
  lectureLoadHours: number;
  practicalLoadHours: number;
  tutorialLoadHours: number;
  projectSupervisionHours: number;
  totalWeeklyAcademicHours: number;
  mentorStudentsCount: number;
  mentorStudentsList: {
    id: string;
    name: string;
    enrollmentNo: string;
    program: string;
    semester: number;
    division: string;
  }[];
  administrativeResponsibilities: {
    id: string;
    title: string;
    role: string;
    description: string;
  }[];
  academicResponsibilities: {
    id: string;
    title: string;
    role: string;
    description: string;
  }[];
  committeeResponsibilities: {
    id: string;
    committeeName: string;
    designation: string;
  }[];
  examinationResponsibilities: {
    id: string;
    examName: string;
    dutyType: string;
    date: string;
  }[];
  otherResponsibilities: {
    id: string;
    title: string;
    category: string;
    description: string;
  }[];
}

export interface FacultyWorkloadKPIs {
  totalWeeklyLoad: number; // Total Weekly Academic Hours
  lectureLoad: number;     // Lecture Hours/Week
  practicalLoad: number;   // Practical Hours/Week
  mentoringLoad: number;   // Count of Mentee Students
  administrativeDuties: number; // Count of Admin Responsibilities
  pendingTasks: number;
  inProgress: number;
  dueToday: number;
  overdue: number;
}

export interface WorkItemSummary {
  id: string;
  type: WorkItemType;
  title: string;
  description?: string;
  module: string;
  studentId?: string;
  studentName?: string;
  enrollmentNo?: string;
  studentEnrollment?: string;
  departmentName?: string;
  programName?: string;
  priority: WorkPriority;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  assignedAt: string;
  createdAt?: string;
  originalOwnerId?: string;
  originalOwnerName?: string;
  currentAssigneeId?: string;
  currentAssigneeName?: string;
  isDelegated?: boolean;
  isReturnedFromDelegation?: boolean;
  delegationLabel?: string;
}

export interface WorkTransferRecord {
  id: string;
  trackingCode: string; // e.g. WTR-2026-000001
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  fromUserDepartmentId?: string;
  fromUserDepartmentName?: string;
  fromUserInstituteId?: string;
  fromUserInstituteName?: string;
  toUserId: string;
  toUserName: string;
  toUserRole: string;
  toUserDepartmentId?: string;
  toUserDepartmentName?: string;
  toUserInstituteId?: string;
  toUserInstituteName?: string;
  startAt: string; // YYYY-MM-DD
  endAt: string;   // YYYY-MM-DD
  reason: TransferReason;
  remarks?: string;
  status: WorkTransferStatus;
  workItemIds: string[];
  workItemTypes: WorkItemType[];
  totalItemsCount: number;
  completedItemIds: string[];
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  activatedAt?: string;
  completedAt?: string;
  completedByUserId?: string;
  completedByUserName?: string;
  expiredAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokedByName?: string;
  auditTrail: WorkTransferAuditEvent[];
}

export interface CreateWorkTransferDTO {
  fromUserId: string;
  toUserId: string;
  startAt: string;
  endAt: string;
  reason: TransferReason;
  remarks?: string;
  workItemIds: string[];
}

export interface WorkTransferFilterParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  instituteId?: string;
  fromUserId?: string;
  toUserId?: string;
  module?: string;
  workType?: WorkItemType;
  status?: WorkTransferStatus | 'ALL';
  reason?: TransferReason | 'ALL';
  searchQuery?: string;
}

export interface WorkAssignmentHistoryChainItem {
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  fromUser?: string;
  toUser?: string;
  transferTrackingCode?: string;
  reason?: string;
  status?: string;
  notes?: string;
}
