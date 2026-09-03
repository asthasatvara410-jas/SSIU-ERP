// ─── PTM Types & Interfaces ──────────────────────────────────────────────────

export type PTMMeetingMode = 'PHYSICAL' | 'ONLINE' | 'HYBRID';

export type PTMTargetType = 'CLASS' | 'SELECTED_STUDENTS' | 'SELECTED_PARENTS';

export type PTMEventStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PTMScheduleStatus = 
  | 'SCHEDULED' 
  | 'INVITED' 
  | 'CONFIRMED' 
  | 'ATTENDED' 
  | 'MISSED' 
  | 'RESCHEDULED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type PTMParentResponse = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'RESCHEDULE_REQUESTED' 
  | 'DECLINED';

export type PTMAttendanceStatus = 
  | 'PENDING' 
  | 'PRESENT' 
  | 'ABSENT' 
  | 'RESCHEDULED' 
  | 'DECLINED';

export type PTMRating = 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT';

export type PTMOutcome = 
  | 'SATISFACTORY' 
  | 'IMPROVEMENT_REQUIRED' 
  | 'ACADEMIC_CONCERN' 
  | 'ATTENDANCE_CONCERN' 
  | 'BEHAVIOUR_CONCERN' 
  | 'PARENT_FOLLOWUP_REQUIRED';

export type PTMFollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PTMFollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface PTMEvent {
  id: string;
  title: string;
  academicYearId: string;
  academicYearName: string;
  instituteId: string;
  instituteName: string;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  semesterId: string;
  semesterNumber: number;
  divisionId: string;
  divisionName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  mode: PTMMeetingMode;
  meetingLink?: string;
  assignedFacultyIds: string[];
  assignedFacultyNames?: string[];
  description: string;
  instructions: string;
  targetType: PTMTargetType;
  selectedStudentIds?: string[];
  status: PTMEventStatus;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface PTMSchedule {
  id: string;
  ptmEventId: string;
  ptmEventTitle?: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentRelationship: 'Father' | 'Mother' | 'Guardian';
  facultyId: string;
  facultyName: string;
  instituteId: string;
  instituteName: string;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  semesterId: string;
  semesterNumber: number;
  divisionId: string;
  divisionName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  slotTime?: string;
  venue: string;
  mode: PTMMeetingMode;
  meetingLink?: string;
  status: PTMScheduleStatus;
  parentResponse: PTMParentResponse;
  parentResponseReason?: string;
  rescheduleRequestedDate?: string;
  rescheduleRequestedTime?: string;
  attendanceStatus: PTMAttendanceStatus;
  markedAt?: string;
  markedBy?: string;
  ptmRecordId?: string;
  createdAt: string;
}

export interface PTMAcademicSubjectDiscussion {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName?: string;
  internalMarks: number;
  maxInternalMarks: number;
  attendancePercentage: number;
  remarks?: string;
}

export interface PTMRecord {
  id: string;
  ptmScheduleId: string;
  ptmEventId: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  parentId: string;
  parentName: string;
  facultyId: string;
  facultyName: string;
  date: string;
  attendanceStatus: PTMAttendanceStatus;
  
  // Academic Discussion
  academicPerformance: string;
  strengths: string;
  areasForImprovement: string;
  attendanceConcern: boolean;
  attendanceConcernDetails?: string;
  assignmentConcern: boolean;
  assignmentConcernDetails?: string;
  examConcern: boolean;
  examConcernDetails?: string;
  subjectDiscussions?: PTMAcademicSubjectDiscussion[];

  // Student Development Ratings
  behaviourRating: PTMRating;
  disciplineRating: PTMRating;
  communicationRating: PTMRating;
  participationRating: PTMRating;
  overallDevelopment: string;

  // Remarks & Feedback
  facultyRemarks: string;
  visibleToStudent: boolean; // Controls whether student can see this remark
  parentFeedback: string;
  parentConcerns: string;
  parentSatisfactionScore?: number; // 1 to 5

  // Action Items & Outcome
  actionRequired: boolean;
  outcome: PTMOutcome;
  finalRemarks: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PTMFollowUpAction {
  id: string;
  ptmRecordId: string;
  ptmScheduleId: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  actionDescription: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  priority: PTMFollowUpPriority;
  dueDate: string; // YYYY-MM-DD
  status: PTMFollowUpStatus;
  completionDate?: string;
  completionRemarks?: string;
  createdAt: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  occupation?: string;
  address?: string;
  linkedStudentIds: string[];
  createdAt: string;
}

export interface PTMNotification {
  id: string;
  recipientUserId: string;
  recipientRole: string;
  studentId?: string;
  studentName?: string;
  ptmEventId?: string;
  ptmScheduleId?: string;
  title: string;
  message: string;
  type: 'SCHEDULED' | 'REMINDER' | 'CONFIRMATION' | 'RESCHEDULE' | 'FOLLOWUP' | 'FEEDBACK';
  isRead: boolean;
  createdAt: string;
}
