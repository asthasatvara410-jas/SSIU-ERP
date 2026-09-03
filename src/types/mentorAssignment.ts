import { UserRole } from './index';

export interface MentorAssignment {
  id: string;
  studentId: string;
  studentEnrollmentNo: string;
  studentName: string;
  mentorFacultyId: string;
  mentorEmployeeId: string;
  mentorName: string;
  mentorEmail?: string;
  mentorPhone?: string;
  mentorDepartmentId?: string;
  mentorDepartmentName?: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedByRole: UserRole;
  instituteId: string;
  instituteCode: string;
  instituteName?: string;
  departmentId: string;
  departmentCode: string;
  departmentName?: string;
  programId: string;
  programCode: string;
  programName?: string;
  academicYearId: string;
  academicYear: string;
  semesterId?: string;
  semester?: number | string;
  section?: string;
  assignedDate: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  changeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorAssignmentHistory {
  id: string;
  assignmentId: string;
  studentId: string;
  studentEnrollmentNo?: string;
  studentName?: string;
  previousMentorId?: string;
  previousMentorName?: string;
  newMentorId: string;
  newMentorName: string;
  changedByUserId: string;
  changedByName: string;
  changedByRole: UserRole;
  changeReason: string;
  effectiveFrom: string;
  effectiveTo: string;
  createdAt: string;
}

export interface MentorBulkUploadRow {
  studentEnrollmentNo: string;
  departmentCode: string;
  programCode: string;
  semester: string | number;
  section: string;
  mentorEmployeeId: string;
  isValid?: boolean;
  errors?: string[];
  studentName?: string;
  mentorName?: string;
  studentId?: string;
  mentorFacultyId?: string;
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  academicYearId?: string;
}

export interface MentorEligibilityFilter {
  instituteId?: string;
  departmentId?: string;
  searchQuery?: string;
}

export interface MentorDashboardStats {
  totalMentees: number;
  attendanceAlertsCount: number;
  academicRiskCount: number;
  pendingFollowUpsCount: number;
  mentoringSessionsCount: number;
  pendingRequestsCount: number;
  totalPendingRequests: number;
  totalSubjectQueries: number;
  totalComplaints: number;
  totalCompletedRequests: number;
  scopedNotesheetsCount: number;
  unreadNotificationsCount: number;
}

export interface MentoringSessionRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentEnrollmentNo?: string;
  mentorId: string;
  mentorName: string;
  mentorRole?: string;
  mentorDepartmentId?: string;
  mentorInstituteId?: string;
  date: string;
  timeSlot?: string;
  topic: string;
  category?: string;
  discussion?: string;
  academicConcern?: string;
  attendanceConcern?: string;
  actionTaken: string;
  remarks?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpAction?: string;
  followUpStatus?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentoringSessionDTO {
  studentId: string;
  date: string;
  timeSlot?: string;
  topic?: string;
  discussion?: string;
  academicConcern?: string;
  attendanceConcern?: string;
  actionTaken?: string;
  remarks?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpAction?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateMentoringSessionDTO {
  topic?: string;
  discussion?: string;
  academicConcern?: string;
  attendanceConcern?: string;
  actionTaken?: string;
  remarks?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpAction?: string;
  followUpStatus?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface MenteeSummaryItem {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  photo?: string;
  email: string;
  phone?: string;
  instituteId: string;
  instituteCode?: string;
  departmentId: string;
  departmentName?: string;
  programId: string;
  programName?: string;
  semesterNumber: number;
  divisionName?: string;
  academicStatus: 'GOOD' | 'AVERAGE' | 'AT_RISK';
  attendancePercentage: number;
  totalAttendanceSessions: number;
  presentAttendanceSessions: number;
  hasAttendanceShortage: boolean;
  lastMentoringDate?: string;
  totalMentoringSessions: number;
  pendingFollowUpsCount: number;
  pendingRequestsCount: number;
  pendingDocumentsCount: number;
  isRisk: boolean;
  status: string;
}
