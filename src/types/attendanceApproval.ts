// ─── SUBJECT-WISE ATTENDANCE, 75% EXAM ELIGIBILITY & APPROVAL TYPES ─────────────

export type AttendanceApprovalStatus =
  | 'SUBMITTED_TO_FACULTY'
  | 'FACULTY_APPROVED'
  | 'FACULTY_REJECTED'
  | 'WITH_MENTOR'
  | 'MENTOR_APPROVED'
  | 'MENTOR_REJECTED'
  | 'WITH_HOD'
  | 'HOD_APPROVED'
  | 'HOD_REJECTED'
  | 'WITH_HOI'
  | 'HOI_APPROVED'
  | 'HOI_REJECTED'
  | 'MORE_INFORMATION_REQUIRED'
  | 'FINAL_APPROVED'
  | 'EXAM_ELIGIBLE'
  | 'CLOSED';

export type AttendanceApplicationReason =
  | 'MEDICAL'
  | 'UNIVERSITY_ACTIVITY'
  | 'OFFICIAL_DUTY'
  | 'ACADEMIC_ACTIVITY'
  | 'OTHER';

export type ExamEligibilityStatus =
  | 'EXAM_ELIGIBLE'
  | 'ATTENDANCE_SHORTAGE'
  | 'CONDONED_APPROVAL'
  | 'NOT_ELIGIBLE';

export type AttendanceEligibilityType =
  | 'NORMAL_ATTENDANCE'
  | 'ATTENDANCE_APPROVAL';

export interface SubjectAttendanceStat {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  percentage: number;
  requiredPercentage: number;
  shortagePercentage: number;
  isEligible: boolean;
  status: ExamEligibilityStatus;
  applicationId?: string;
  applicationNo?: string;
  applicationStatus?: AttendanceApprovalStatus;
  eligibilityType?: AttendanceEligibilityType;
  facultyId?: string;
  facultyName?: string;
  finalApprovedBy?: string;
  finalApprovedAt?: string;
}

export interface AttendanceApprovalHistoryItem {
  id: string;
  applicationId: string;
  action:
    | 'APPLICATION_SUBMITTED'
    | 'FACULTY_APPROVED'
    | 'FACULTY_REJECTED'
    | 'MENTOR_APPROVED'
    | 'MENTOR_REJECTED'
    | 'HOD_APPROVED'
    | 'HOD_REJECTED'
    | 'HOI_APPROVED'
    | 'HOI_REJECTED'
    | 'MORE_INFO_REQUESTED';
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  toUserId?: string;
  toUserName?: string;
  toUserRole?: string;
  remarks: string;
  previousStatus: AttendanceApprovalStatus;
  newStatus: AttendanceApprovalStatus;
  timestamp: string;
}

export interface AttendanceApplication {
  id: string;
  applicationNo: string; // APP/ATT/2026/000001
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  studentEmail: string;
  studentPhone?: string;
  instituteId: string;
  instituteCode?: string;
  instituteName?: string;
  departmentId: string;
  departmentCode?: string;
  departmentName?: string;
  programId: string;
  programCode?: string;
  programName?: string;
  semesterId?: string;
  semesterNumber?: number;
  section?: string;
  
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectFacultyId: string;
  subjectFacultyName: string;
  mentorFacultyId: string;
  mentorFacultyName: string;
  hodUserId: string;
  hodUserName: string;
  hoiUserId: string;
  hoiUserName: string;
  
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  currentAttendancePct: number;
  requiredAttendancePct: number; // 75.0
  shortagePct: number;
  
  reason: AttendanceApplicationReason;
  description: string;
  supportingDocumentUrl?: string;
  supportingDocumentName?: string;
  applicationDate: string;
  
  currentHandlerRole: 'SUBJECT_FACULTY' | 'FACULTY_MENTOR' | 'HOD' | 'PRINCIPAL' | 'COMPLETED' | 'REJECTED';
  currentHandlerId: string;
  currentHandlerName: string;
  
  status: AttendanceApprovalStatus;
  facultyStatus?: string;
  mentorStatus?: string;
  hodStatus?: string;
  hoiStatus?: string;
  examEligibilityStatus?: string;
  medicalCondonationApplied?: boolean;
  medicalDocs?: any[];
  finalEligibilityGranted: boolean;
  eligibilityType?: AttendanceEligibilityType;
  
  facultyRemarks?: string;
  mentorRemarks?: string;
  hodRemarks?: string;
  hoiRemarks?: string;
  
  timeline: AttendanceApprovalHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceEligibilityConfig {
  id: string;
  minimumAttendancePct: number; // default 75.0
  condonationFloorPct: number; // default 60.0
  isCondonationAllowed: boolean;
  academicYearId?: string;
  updatedByUserId?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export const ATTENDANCE_REASONS: { key: AttendanceApplicationReason; label: string; description: string }[] = [
  { key: 'MEDICAL', label: 'Medical Emergency / Health Leave', description: 'Illness, hospitalization, or medical recovery with doctor certificate' },
  { key: 'UNIVERSITY_ACTIVITY', label: 'University / Institutional Representation', description: 'Representing University in Sports, Hackathons, Youth Festival, or Tech Fests' },
  { key: 'OFFICIAL_DUTY', label: 'Official Duty / NSS / NCC / University Event', description: 'Approved Institutional volunteer service or administrative duty' },
  { key: 'ACADEMIC_ACTIVITY', label: 'Academic Workshop / Conference / Placement Drive', description: 'Attending external technical symposium, paper presentation, or recruitment drive' },
  { key: 'OTHER', label: 'Other Genuine Exceptional Circumstance', description: 'Any unforeseen compassionate situation approved by Principal/HOI' },
];
