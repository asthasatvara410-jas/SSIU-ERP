export type FeedbackItemType = 'FEEDBACK' | 'GRIEVANCE';
export type SubmissionMode = 'AUTHENTICATED' | 'ANONYMOUS';

export type FeedbackCategoryType = 
  | 'SUBJECT'
  | 'FACULTY'
  | 'MENTOR'
  | 'HOD'
  | 'HOI'
  | 'CAMPUS'
  | 'GENERAL_UNIVERSITY'
  | 'ACADEMIC'
  | 'FACILITY'
  | 'HOSTEL'
  | 'TRANSPORT'
  | 'EXAMINATION'
  | 'ANTI_RAGGING'
  | 'HARASSMENT'
  | 'OTHER';

export type CampusFacilityCategory = 
  | 'CAMPUS_INFRASTRUCTURE'
  | 'CLASSROOMS'
  | 'LABORATORIES'
  | 'LIBRARY'
  | 'HOSTEL'
  | 'FOOD_CAFETERIA'
  | 'TRANSPORT'
  | 'SPORTS_FACILITIES'
  | 'CLEANLINESS'
  | 'SECURITY'
  | 'WIFI_INTERNET'
  | 'PARKING'
  | 'STUDENT_SERVICES'
  | 'OTHER';

export type SuggestionCategory = 
  | 'ACADEMIC'
  | 'TEACHING'
  | 'CAMPUS'
  | 'INFRASTRUCTURE'
  | 'TECHNOLOGY'
  | 'STUDENT_SERVICES'
  | 'HOSTEL'
  | 'TRANSPORT'
  | 'EVENTS'
  | 'CLUBS'
  | 'LIBRARY'
  | 'SPORTS'
  | 'LABORATORY'
  | 'ADMINISTRATION'
  | 'CAFETERIA'
  | 'OTHER';

export type FeedbackStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REVIEWED'
  | 'ACKNOWLEDGED'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'REOPENED';

export type SuggestionStatus = 
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface FeedbackRatingItem {
  criterion: string;
  rating: number; // 1 to 5
}

export interface DetailedStudentFeedback {
  id: string;
  feedbackNo: string; // FDB/2026/000001 or GRV-2026-XXXXXX
  studentId: string;
  studentName?: string; // Hidden in UI when isAnonymous = true or in faculty view
  studentEnrollmentNo?: string;
  isAnonymous: boolean;
  
  itemType?: FeedbackItemType; // FEEDBACK or GRIEVANCE
  submissionMode?: SubmissionMode; // AUTHENTICATED or ANONYMOUS
  publicReference?: string;
  trackingToken?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subjectTitle?: string;
  departmentContext?: string;
  incidentLocation?: string;
  optionalContactEmail?: string;
  optionalContactPhone?: string;

  category: FeedbackCategoryType;
  campusFacilityCategory?: CampusFacilityCategory;
  
  // Context targets
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  academicYearId: string;
  academicYear?: string;
  semesterId?: string;
  semesterNumber?: number;
  
  // Target entities
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  facultyId?: string;
  facultyEmployeeId?: string;
  facultyName?: string;
  mentorId?: string;
  mentorName?: string;
  hodId?: string;
  hodName?: string;
  hoiId?: string;
  hoiName?: string;

  // 5 Explicit Teaching Evaluation Ratings (1 to 5 Stars)
  teachingClarity: number;
  communication: number;
  subjectKnowledge: number;
  doubtResolution: number;
  studentEngagement: number;

  // Full Criteria map & Overall calculated rating
  ratings: Record<string, number>;
  overallRating: number; // 1 to 5 (average of metrics)
  
  positiveFeedback?: string;
  improvementSuggestion?: string;
  comments?: string;
  suggestions?: string;
  attachmentUrls?: string[];

  status: FeedbackStatus;
  adminRemarks?: string;
  resolutionSummary?: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  closedAt?: string;
  timelineEvents?: Array<{ eventType: string; title: string; details?: string; createdAt: string }>;

  createdAt: string;
  updatedAt: string;
}

export interface StudentSuggestionItem {
  id: string;
  suggestionNo: string; // SUG/2026/000001
  studentId: string;
  studentName?: string;
  studentEnrollmentNo?: string;
  isAnonymous: boolean;

  category: SuggestionCategory;
  title: string;
  description: string;
  expectedImprovement?: string;
  attachmentUrl?: string;

  departmentId?: string;
  departmentName?: string;
  instituteId?: string;

  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: SuggestionStatus;
  assignedDepartment?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  adminResponse?: string;
  actionTaken?: string;
  resolvedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface FeedbackAuditLogItem {
  id: string;
  feedbackId?: string;
  feedbackNo?: string;
  suggestionId?: string;
  suggestionNo?: string;
  user: string;
  role: string;
  action: 'FEEDBACK_SUBMITTED' | 'FEEDBACK_REVIEWED' | 'STATUS_CHANGED' | 'SUGGESTION_UPDATED' | 'FEEDBACK_EXPORTED' | 'FEEDBACK_PRINTED';
  oldValue?: string;
  newValue?: string;
  details: string;
  timestamp: string;
}

export interface FeedbackConfiguration {
  allowAnonymousFeedback: boolean;
  allowAnonymousSuggestions: boolean;
  frequencyLimits: {
    subjectFeedbackPerSemester: number;
    facultyFeedbackPerSemester: number;
    mentorFeedbackPerSemester: number;
    hodFeedbackPerSemester: number;
    hoiFeedbackPerSemester: number;
    campusFeedbackPerMonth: number;
  };
  ratingLabels: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
}

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export type SlaStatus = 'ON_TRACK' | 'DUE_SOON' | 'SLA_BREACHED' | 'RESOLVED';

export type EscalationReason = 
  | 'SLA_BREACH' 
  | 'CRITICAL_PRIORITY' 
  | 'MANUAL_ESCALATION' 
  | 'REPEATED_UNRESOLVED' 
  | 'AUTHORITY_UNAVAILABLE' 
  | 'REOPENED_CASE' 
  | 'OTHER';

export interface GrievanceEscalationItem {
  id: string;
  caseNumber: string;
  category: FeedbackCategoryType;
  type: SubmissionMode;
  subject: string;
  description: string;
  status: FeedbackStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidentLocation?: string;
  escalationLevel: EscalationLevel;
  currentAuthority: string;
  currentAuthorityRole: string;
  slaStatus: SlaStatus;
  slaDueAt: string;
  remainingHours: number;
  isBreached: boolean;
  resolutionSummary?: string;
  correctiveAction?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  evidencesCount?: number;
  timelineEvents?: Array<{
    eventType: string;
    title: string;
    details?: string;
    createdAt: string;
  }>;
  submitterType: string;
}

export interface EscalationAnalyticsData {
  totalCases: number;
  activeCount: number;
  onTrackCount: number;
  dueSoonCount: number;
  breachedCount: number;
  resolvedCount: number;
  totalEscalated: number;
  criticalCount: number;
  slaComplianceRate: number;
  avgResolutionDays: number;
  priorityCounts: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  levelCounts: {
    0: number;
    1: number;
    2: number;
    3: number;
    4: number;
  };
  categoryCounts: Record<string, number>;
  institutionalQualitySummary: {
    title: string;
    framework: string;
    evaluationPeriod: string;
    complianceRate: string;
    avgTurnaround: string;
    activeEscalationTier: string;
    generatedAt: string;
  };
}

