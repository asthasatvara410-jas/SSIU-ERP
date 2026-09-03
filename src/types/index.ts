export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'PRESIDENT'
  | 'VICE_PRESIDENT'
  | 'PROVOST'
  | 'UNIVERSITY_ADMIN' 
  | 'ERP_COORDINATOR'
  | 'PRINCIPAL' 
  | 'HOD' 
  | 'FACULTY' 
  | 'STAFF'
  | 'MENTOR'
  | 'STUDENT_ADMIN'
  | 'STUDENT'
  | 'PARENT'
  | 'REGISTRAR'
  | 'DEPUTY_REGISTRAR'
  | 'IQAC'
  | 'EXAM_CELL'
  | 'STUDENT_SECTION'
  | 'HOSTEL_ADMIN'
  | 'HOSTEL_WARDEN'
  | 'SECURITY'
  | 'LIBRARY_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'MAINTENANCE_ADMIN'
  | 'ACCOUNTS_ADMIN'
  | 'HR_ADMIN'
  | 'HR_OFFICER';

export * from './ptm';
export * from './userAdmin';


export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'DISABLED' | 'SUSPENDED' | 'PENDING';
export type AccessStatusType = 'ENABLED' | 'RESTRICTED' | 'LOCKED' | 'SUSPENDED' | 'DISABLED';

export type DataScopeType = 
  | 'ALL_UNIVERSITY' 
  | 'INSTITUTION' 
  | 'DEPARTMENT' 
  | 'PROGRAM' 
  | 'CLASS' 
  | 'SELF' 
  | 'ASSIGNED_USERS' 
  | 'ASSIGNED_ASSETS';

export type ModuleActionType = 
  | 'VIEW' 
  | 'CREATE' 
  | 'EDIT' 
  | 'DELETE' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'EXPORT' 
  | 'IMPORT' 
  | 'PRINT' 
  | 'ASSIGN' 
  | 'TRANSFER' 
  | 'VERIFY' 
  | 'MANAGE'
  | 'RETURN'
  | 'REPLACE'
  | 'MAINTENANCE'
  | 'SUBMIT'
  | 'FORWARD'
  | 'ANALYTICS';

export interface UserScopeConfig {
  moduleKey: string;
  scope: DataScopeType;
  allowedDepartmentIds?: string[];
  allowedInstituteIds?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  instituteId?: string;
  departmentId?: string;
  departmentName?: string;
  programId?: string;
  designation?: string;
  enrollmentNo?: string;
  temporaryEnrollmentNumber?: string;
  finalEnrollmentNumber?: string;
  enrollmentStatus?: 'TEMPORARY' | 'FINAL';
  studentAccessCode?: string;
  isFirstLogin?: boolean;
  studentId?: string;
  facultyId?: string;
  employeeId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  is_active?: boolean;
  accountStatus?: AccountStatus;
  accessStatus?: AccessStatusType;
  lockedAt?: string;
  lockedBy?: string;
  lockReason?: string;
  lockedUntil?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  failedLoginAttempts?: number;
  lastFailedLoginAt?: string;
  twoFactorEnabled?: boolean;
  forcePasswordReset?: boolean;
  accountExpiresAt?: string;
  customPermissions?: Record<string, Record<string, boolean>>;
  permissionOverrides?: any[];
  userScopes?: Record<string, DataScopeType>;
  userScopeAssignments?: any[];
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string;
  joiningDate?: string;
  academicYear?: string;
  programName?: string;
  mentorId?: string;
  assignedMentorId?: string;
  assignedStudentIds?: string[];
  assignedInstituteIds?: string[];
  assignedDepartmentIds?: string[];
  signatureFile?: string;
  signatureStatus?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  signatureVersion?: number;
  signatureUpdatedAt?: string;
  reportingToUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserHistoryRecord {
  id: string;
  userId: string;
  version: number;
  action: string;
  changedBy: string;
  changedByUserId?: string;
  changedByRole?: string;
  changedAt: string;
  changedFields: string[];
  oldData: Partial<User>;
  newData: Partial<User>;
  reason?: string;
}

export interface University {
  id: string;
  code: string;
  name: string;
  tagline?: string;
  establishedYear: number;
  chancellorName: string;
  viceChancellorName: string;
  registrarName: string;
  location: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

export interface Institute {
  id: string;
  code: string;
  name: string;
  universityId?: string;
  type: 'Engineering' | 'Management' | 'Design' | 'Architecture' | 'Pharmacy' | 'Science' | 'Agriculture' | 'Nursing' | 'Physiotherapy' | 'Homoeopathy' | 'Ayurveda' | 'Media' | 'Other' | string;
  principalName?: string;
  principalId?: string;
  email: string;
  phone: string;
  location: string;
  establishedYear: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Department {
  id: string;
  code: string;
  name: string;
  instituteId: string;
  hodName?: string;
  hodId?: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Program {
  id: string;
  code: string;
  name: string;
  departmentId?: string; // Optional when institute directly has programs
  instituteId: string;
  degreeType: 'B.Tech' | 'M.Tech' | 'BCA' | 'MCA' | 'MBA' | 'BBA' | 'B.Com' | 'BA' | 'B.Sc' | 'M.Sc' | 'B.Des' | 'M.Des' | 'M.Plan' | 'B.Pharm' | 'M.Pharm' | 'D.Pharm' | 'B.Arch' | 'BPT' | 'MPT' | 'BHMS' | 'BAMS' | 'BJMC' | 'MJMC' | 'PG Diploma' | 'Diploma' | 'Ph.D' | string;
  level?: 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DIPLOMA' | 'DOCTORATE' | 'PHD' | string;
  durationYears: number;
  totalSemesters: number;
  intakeCapacity: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024-2025"
  year?: string; // e.g. "2026-27"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface Batch {
  id: string;
  name: string; // e.g. "2024-2028"
  programId: string;
  academicYearId: string;
  startYear: number;
  endYear: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Semester {
  id: string;
  number: number; // e.g. 1 to 8
  code: string; // e.g. "SEM-1"
  name?: string; // e.g. "Semester 1", "Semester 4"
  programId: string;
  academicYearId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
}

export interface Division {
  id: string;
  name: string; // e.g. "Div A", "Div B"
  semesterId: string;
  batchId: string;
  programId: string;
  capacity: number;
  roomNo: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Subject {
  id: string;
  code: string; // e.g. "CSE-101"
  name: string;
  semesterId: string;
  programId: string;
  departmentId?: string;
  type: 'THEORY' | 'PRACTICAL' | 'ELECTIVE' | 'LAB';
  credits: number;
  theoryHoursPerWeek: number;
  labHoursPerWeek: number;
  assignedFacultyId?: string;
  enrolledStudentIds?: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Faculty {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  designation: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Lecturer' | 'Adjunct';
  instituteId: string;
  departmentId?: string;
  qualification: string;
  specialization?: string;
  joiningDate?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  experienceYears: number;
  subjectIds: string[];
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
}

export interface StudentAcademicHistoryRecord {
  id: string;
  academicYearId: string;
  academicYearName: string;
  semesterId: string;
  semesterNumber: number;
  batchId: string;
  divisionId: string;
  divisionName?: string;
  spi?: number;
  cpi?: number;
  attendancePercentage?: number;
  feeClearanceStatus?: 'CLEARED' | 'PENDING' | 'WAIVED';
  status: 'COMPLETED' | 'PROMOTED' | 'DETAINED';
  completedDate: string;
  remarks?: string;
}

export type StudentStatus = 
  | 'APPLICANT'
  | 'ADMISSION_CONFIRMED'
  | 'DOCUMENT_PENDING'
  | 'FEE_PENDING'
  | 'READY_TO_ONBOARD'
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'GRADUATED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'ALUMNI';

export type StudentOnboardingStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'DOCUMENT_PENDING'
  | 'FEE_PENDING'
  | 'APPROVED'
  | 'READY_TO_ONBOARD'
  | 'ONBOARDED'
  | 'REJECTED'
  | 'CANCELLED'
  // Backward compatibility aliases
  | 'ONBOARDING_DRAFT'
  | 'READY'
  | 'HOLD'
  | 'PENDING';

export type CoreRbacRole = 
  | 'SUPER_ADMIN'
  | 'ADMISSION_OFFICER'
  | 'STUDENT_ADMIN'
  | 'ADMIN_OFFICER'
  | 'UNIVERSITY_ADMIN'
  | 'FACULTY'
  | 'MENTOR'
  | 'EXAM_OFFICER'
  | 'EXAM_CELL'
  | 'FINANCE_OFFICER'
  | 'ACCOUNTS_ADMIN'
  | 'HR_ADMIN'
  | 'STUDENT';

export interface StandardRolePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canVerify: boolean;
  canExport: boolean;
  canPrint: boolean;
}

export interface Student {
  // ─── MASTER STUDENT DATA SCHEMA (Single Source of Truth) ───
  // Core Identifiers
  id: string;
  enrollmentNo: string;
  universityId?: string; // e.g. SSIU-2023-CS-001
  grNo?: string; // General Register No (Gr.No)
  admissionId?: string;
  admissionNumber?: string;
  applicationNumber?: string;
  admissionDate?: string;
  admissionYear?: string | number;
  classToBeAdmitted?: string; // Class to be admitted
  academicYear?: string;
  instituteName?: string;
  programName?: string;
  branch?: string;
  branchName?: string;
  academicStanding?: 'GOOD_STANDING' | 'ATTENDANCE_SHORTAGE' | 'ACADEMIC_RISK';
  mobile?: string;
  rollNo?: string;

  // Personal Information
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  fullNameAsPerMarksheet?: string; // Full Name as per SSC/HSC Marksheet
  fullNameAsPerAadhar?: string; // Full Name As Per Aadhar
  photo?: string;
  signature?: string;
  dateOfBirth?: string;
  dob?: string;
  dobWords?: string; // DOB in Words
  dobInWords?: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  caste?: string;
  subCaste?: string;
  aadhaarNo?: string;
  aadhaarCardNo?: string; // Aadhaar Card No
  aadhaarDocRef?: string; // Aadhar Card / Document reference
  isSpecialNeed?: boolean; // Is Special Need?
  passportNumber?: string;
  visaNumber?: string;
  birthPlace?: string;
  pob?: string; // Place of Birth (POB)
  birthDistrict?: string;
  birthState?: string;
  maritalStatus?: 'Unmarried' | 'Married' | 'Other';
  universityRegNo?: string;
  abcNumber?: string; // Academic Bank of Credits (ABC Number)

  // Contact Details
  email: string;
  officialEmail?: string; // Official Email ID
  phone: string;
  phoneNo?: string;
  mobileNumber?: string; // Mobile Number
  alternateMobile1?: string; // Alternate Mobile No. 1
  alternateMobile2?: string; // Alternate Mobile No. 2
  alternateMobile3?: string; // Alternate Mobile No. 3
  whatsappNumber?: string;
  alternatePhone?: string;
  alternateEmail?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;

  // Family / Parent Details
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  fatherAnnualIncome?: number | string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  motherAnnualIncome?: number | string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelation?: string;
  guardianOccupation?: string;
  fatherIsGuardian?: boolean;
  motherIsGuardian?: boolean;

  // Address
  address?: string;
  city?: string;
  district?: string;
  taluka?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  pincode?: string;
  currentAddressLine1?: string;
  currentAddressLine2?: string;
  currentCity?: string;
  currentDistrict?: string;
  currentState?: string;
  currentCountry?: string;
  currentPincode?: string;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentDistrict?: string;
  permanentState?: string;
  permanentCountry?: string;
  permanentPincode?: string;
  isPermanentSameAsCurrent?: boolean;

  // Previous Academic Qualifications
  tenthBoard?: string;
  tenthSchool?: string;
  tenthPassingYear?: number | string;
  tenthPercentage?: number | string;
  twelfthBoard?: string;
  twelfthSchool?: string;
  twelfthPassingYear?: number | string;
  twelfthPercentage?: number | string;
  diplomaCollege?: string;
  diplomaBranch?: string;
  diplomaPassingYear?: number | string;
  diplomaPercentage?: number | string;
  graduationInstitute?: string;
  graduationDegree?: string;
  graduationPassingYear?: number | string;
  graduationPercentage?: number | string;

  // Current Academic Mapping
  instituteId: string;
  departmentId?: string;
  programId: string;
  academicYearId?: string;
  batchId: string;
  semesterId: string;
  divisionId: string;
  rollNumber?: string;
  admissionType?: string;
  admissionCategory?: string;
  admissionStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ON_HOLD';
  academicStatus?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'DROPOUT' | 'TRANSFERRED';

  // Additional Information & Amenities
  physicallyChallenged?: boolean;
  disabilityDetails?: string;
  motherTongue?: string;
  hostelRequired?: boolean;
  transportRequired?: boolean;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;

  // Mentorship & ERP Account
  mentorId?: string;
  mentorName?: string;
  mentorAssignedBy?: string;
  mentorAssignedDate?: string;
  erpUsername?: string;
  erpAccountStatus?: 'NOT_CREATED' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'LOCKED' | 'DISABLED';
  onboardingStatus?: StudentOnboardingStatus;
  onboardingSource?: 'ADMISSION_APPLICATION' | 'MANUAL_ONBOARDING';
  onboardedBy?: string;
  onboardedDate?: string;

  studentType?: 'DOMESTIC' | 'INTERNATIONAL';
  
  // Temporary & Final Enrollment Lifecycles
  temporaryEnrollmentNumber?: string; // e.g. "TEMP-2026-00001"
  finalEnrollmentNumber?: string; // e.g. "2026CE000123"
  enrollmentStatus?: 'TEMPORARY' | 'FINAL';
  studentAccessCode?: string; // 5-digit secure access code e.g. "48271"
  onboardingCompletedAt?: string;
  finalEnrollmentAssignedAt?: string;
  finalEnrollmentAssignedBy?: string;
  firstLoginAt?: string;
  isFirstLogin?: boolean;

  abcId?: string; // 12-digit Academic Bank of Credits ID e.g. "9842-1056-7890" or "984210567890"
  abcIdStatus?: 'NOT_SUBMITTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  abcIdVerifiedByUserId?: string;
  abcIdVerifiedByName?: string;
  abcIdVerifiedAt?: string;
  abcIdRejectionReason?: string;
  abcIdAcademicYear?: string;
  abcIdDocUrl?: string;
  abcIdRemarks?: string;
  abcIdHistory?: {
    abcId: string;
    submittedAt: string;
    status: 'NOT_SUBMITTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    remarks?: string;
  }[];
  academicHistory?: StudentAcademicHistoryRecord[];
  academicLifecycleStatus?: 'ADMITTED' | 'PURSUING' | 'GRADUATED' | 'ALUMNI';
  studentStatus?: StudentStatus;
  status: StudentStatus | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED';
}

export type DocumentVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface DocumentVerificationRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  action: 'VERIFIED' | 'REJECTED' | 'UNLOCKED' | 'UPLOADED' | 'REPLACED';
  status: DocumentVerificationStatus;
  verifiedByUserId?: string;
  verifiedByName?: string;
  verifiedByRole?: string;
  timestamp: string;
  remarks?: string;
  rejectionReason?: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  title: string;
  category: 'ACADEMIC' | 'IDENTITY' | 'ADMISSION' | 'CERTIFICATE' | 'OTHER';
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  uploadDate: string;
  status: DocumentVerificationStatus;
  isLocked: boolean; // Permanently locked after Admin verification
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
  rejectionReason?: string;
  version?: number;
  verificationHistory?: DocumentVerificationRecord[];
}

export interface StandardDocumentDefinition {
  title: string;
  category: 'ACADEMIC' | 'IDENTITY' | 'ADMISSION' | 'CERTIFICATE' | 'OTHER';
  description: string;
  required: boolean;
}

export const STANDARD_STUDENT_DOCUMENTS: StandardDocumentDefinition[] = [
  { title: 'Aadhaar Card', category: 'IDENTITY', description: 'National Identity Proof (12-digit Unique Identification)', required: true },
  { title: 'Passport Size Photo', category: 'IDENTITY', description: 'Official Color Photograph for University ID Card', required: true },
  { title: 'Student Signature', category: 'IDENTITY', description: 'Specimen Signature for Examination & Official Records', required: true },
  { title: '10th Marksheet', category: 'ACADEMIC', description: 'Secondary School Certificate (SSC) Marksheet', required: true },
  { title: '12th Marksheet', category: 'ACADEMIC', description: 'Higher Secondary Certificate (HSC) Marksheet', required: true },
  { title: 'Diploma Marksheet', category: 'ACADEMIC', description: 'Polytechnic / Diploma Transcripts (For Lateral Entry)', required: false },
  { title: 'Graduation Marksheet', category: 'ACADEMIC', description: 'Undergraduate Degree Transcripts (For Post-Graduate Programs)', required: false },
  { title: 'Transfer Certificate (TC)', category: 'ADMISSION', description: 'Original College / School Leaving Transfer Certificate', required: true },
  { title: 'Migration Certificate', category: 'ADMISSION', description: 'Inter-Board / Inter-University Migration Certificate', required: true },
  { title: 'Caste Certificate', category: 'CERTIFICATE', description: 'Government Issued Caste / Category Certificate (SC/ST/OBC/EWS)', required: false },
  { title: 'Income Certificate', category: 'CERTIFICATE', description: 'Financial Year Income Proof Certificate for Scholarships', required: false },
  { title: 'ABC ID', category: 'CERTIFICATE', description: '12-Digit Academic Bank of Credits DigiLocker Card', required: true },
  { title: 'Bank Passbook / Cancelled Cheque', category: 'CERTIFICATE', description: 'Bank Account Passbook Front Page or Cancelled Cheque for Refunds/Stipends', required: true }
];


export type AuditModule = 
  | 'AUTH' 
  | 'STUDENT' 
  | 'ADMISSION' 
  | 'FEES' 
  | 'EXAMINATION' 
  | 'HR' 
  | 'HOSTEL' 
  | 'TRANSPORT' 
  | 'NOTE_SHEET' 
  | 'REPORTS' 
  | 'CAMPUS_SERVICES' 
  | 'APPROVAL_WORKFLOW' 
  | 'EDP_DUTY' 
  | 'SYSTEM';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
export type AuditStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'WARNING' | 'ALERT';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module?: AuditModule | string;
  entity: string;
  recordId?: string;
  details: string;
  status?: AuditStatus;
  severity?: AuditSeverity;
  previousValue?: string | Record<string, any>;
  newValue?: string | Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
}

export interface SecurityAuditRecord extends AuditLog {
  status: AuditStatus;
  severity: AuditSeverity;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  triggerCount: number;
  affectedUser?: string;
  affectedRole?: UserRole;
  module: AuditModule | string;
  detectedAt: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  recommendation: string;
}

export interface SecurityDashboardStats {
  totalLoginsToday: number;
  failedLoginsToday: number;
  totalLoginsOverall: number;
  activeSessions: number;
  criticalEvents: number;
  recentAdminActions: number;
  securityAlertsCount: number;
}

// --- ACADEMIC MANAGEMENT MODULE TYPES ---

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceStudentEntry {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  divisionId: string;
  facultyId: string;
  facultyName: string;
  lectureNo: number;
  topicTaught: string;
  records: AttendanceStudentEntry[];
  submittedAt: string;
  status: 'SUBMITTED' | 'DRAFT';
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string; // e.g. "09:00 AM - 10:00 AM"
  subjectId: string;
  facultyId: string;
  divisionId: string;
  roomNo: string;
  departmentId: string;
  academicYearId?: string;
  semesterId?: string;
  programId?: string;
  lectureType?: 'THEORY' | 'PRACTICAL' | 'LAB' | 'TUTORIAL';
  buildingName?: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface SessionPlanTopic {
  id: string;
  subjectId: string;
  unitNo: number;
  unitTitle?: string;
  lectureNo: number;
  topicTitle: string;
  subTopic?: string;
  teachingMethod: 'Chalk & Board' | 'PPT Presentation' | 'Lab Demonstration' | 'Interactive Case Study' | 'Lecture + Practical' | 'Board + PPT' | string;
  plannedDate: string;
  completedDate?: string;
  durationHours?: number;
  referenceMaterial?: string;
  remarks?: string;
  notes?: string;
  divisionId?: string;
  academicYearId?: string;
  semesterId?: string;
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'CANCELLED';
  facultyId: string;
}

export interface UnitMaterial {
  id: string;
  subjectId: string;
  unitNo: number;
  unitTitle: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'PPT' | 'DOC' | 'ZIP' | 'LINK';
  fileSize?: string;
  fileUrl: string;
  uploadedByFacultyId: string;
  uploadedByFacultyName: string;
  uploadedDate: string;
  status?: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT';
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  submittedDate: string;
  submittedTime?: string;
  fileUrl: string;
  fileName?: string;
  notes?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  lateStatus?: 'ON_TIME' | 'LATE';
  obtainedMarks?: number;
  feedback?: string;
  academicYearId?: string;
  semesterId?: string;
  divisionId?: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  divisionId: string;
  unitNo: number;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  totalMarks: number;
  createdByFacultyId: string;
  createdByFacultyName: string;
  createdDate: string;
  attachmentUrl?: string;
  academicYearId?: string;
  semesterId?: string;
  status: 'ACTIVE' | 'CLOSED';
}

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  eventType: 'HOLIDAY' | 'EXAM' | 'EVENT' | 'SEMINAR' | 'IMPORTANT' | 'WORKSHOP';
  startDate: string; // YYYY-MM-DD
  endDate: string;
  description: string;
  location?: string;
  venue?: string;
  time?: string;
  isImportant: boolean;
  createdBy: string;
  organizedBy?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
}

// --- PHASE 1: FEE HEAD MASTER & FINANCE MANAGEMENT TYPES ---

export type FeeHeadCategory = 
  | 'ACADEMIC'
  | 'ADMISSION'
  | 'EXAMINATION'
  | 'HOSTEL'
  | 'TRANSPORT'
  | 'CERTIFICATE'
  | 'LIBRARY'
  | 'LABORATORY'
  | 'STUDENT_ACTIVITY'
  | 'OTHER';

export interface FeeHead {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: FeeHeadCategory;
  defaultAmount: number;
  isMandatory: boolean;
  isOptional: boolean;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeHeadAuditLog {
  id: string;
  feeHeadId: string;
  action: 'CREATED' | 'UPDATED' | 'ACTIVATED' | 'DEACTIVATED';
  performedByUserId: string;
  performedByName?: string;
  details?: string;
  createdAt: string;
}

export type FeeStructureStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type FeeFrequency = 'ONE_TIME' | 'PER_SEMESTER' | 'PER_YEAR' | 'MONTHLY' | 'OTHER';

export interface FeeStructureItem {
  id: string;
  feeStructureId: string;
  feeHeadId: string;
  feeHead?: FeeHead;
  amount: number;
  isMandatory: boolean;
  isOptional: boolean;
  frequency: FeeFrequency;
  sequence: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeStructureAuditLog {
  id: string;
  feeStructureId: string;
  action: 'CREATED' | 'UPDATED' | 'DUPLICATED' | 'ACTIVATED' | 'DEACTIVATED' | 'ITEM_ADDED' | 'ITEM_UPDATED' | 'ITEM_REMOVED';
  performedByUserId: string;
  performedByName?: string;
  details?: string;
  createdAt: string;
}

export interface FeeStructure {
  id: string;
  structureCode?: string;
  instituteId?: string;
  departmentId?: string;
  programId: string;
  semesterId: string;
  academicYearId?: string;
  academicYearCode: string;
  studentCategoryId?: string;
  name: string;
  description?: string;
  totalAmount: number;
  dueDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: FeeStructureStatus;
  version?: number;
  items?: FeeStructureItem[];
  tuitionFee?: number;
  labFee?: number;
  developmentFee?: number;
  hostelFee?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FeePaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_PAID' | 'WAIVED' | 'CANCELLED';

export interface StudentFeeItem {
  id: string;
  studentFeeAccountId: string;
  feeHeadId: string;
  feeHeadName?: string;
  feeHeadCode?: string;
  feeHeadCategory?: string;
  feeStructureItemId?: string;
  amount: number;
  paidAmount: number;
  discountAmount?: number;
  waivedAmount?: number;
  outstandingAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentFeeAccountAuditLog {
  id: string;
  studentFeeAccountId: string;
  action: 'FEE_ASSIGNED' | 'DUPLICATE_ATTEMPT' | 'ACCOUNT_CREATED' | 'STATUS_CHANGED' | 'FEE_ITEM_CREATED';
  performedByUserId: string;
  performedByName?: string;
  details?: string;
  createdAt: string;
}

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  programId: string;
  semesterId: string;
  academicYearId: string;
  academicYearCode?: string;
  feeStructureId: string;
  feeStructureName?: string;
  feeStructureCode?: string;
  tuitionFee: number;
  labFee: number;
  developmentFee: number;
  hostelFee: number;
  examFee?: number;
  lateFeePerDay?: number;
  lateFeeAmount?: number;
  feeType?: 'TUITION' | 'EXAM' | 'HOSTEL' | 'ALL';
  totalAmount: number;
  paidAmount: number;
  previouslyPaid?: number;
  currentPaid?: number;
  refundedAmount?: number;
  discountAmount?: number;
  waivedAmount?: number;
  pendingAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: FeePaymentStatus;
  academicYear?: string;
  breakdown?: any[];
  semesterName?: string;
  items?: StudentFeeItem[];
  auditLogs?: StudentFeeAccountAuditLog[];
  createdAt?: string;
  updatedAt?: string;
}

export type FeeInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface FeeInvoiceItem {
  id: string;
  invoiceId: string;
  feeHeadId: string;
  feeHeadName?: string;
  feeHeadCode?: string;
  feeHeadCategory?: string;
  studentFeeItemId?: string;
  description?: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeInvoiceAuditLog {
  id: string;
  invoiceId: string;
  action: 'CREATED' | 'ISSUED' | 'UPDATED' | 'CANCELLED' | 'DOWNLOADED' | 'PRINTED';
  performedByUserId: string;
  performedByName?: string;
  details?: string;
  createdAt: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  studentFeeAccountId: string;
  feeStructureId: string;
  feeStructureName?: string;
  programId?: string;
  programCode?: string;
  semesterId?: string;
  academicYearId?: string;
  academicYearCode: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  waiverAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  status: FeeInvoiceStatus;
  remarks?: string;
  issuedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdBy?: string;
  items?: FeeInvoiceItem[];
  auditLogs?: FeeInvoiceAuditLog[];
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMode = 'Online UPI' | 'Credit/Debit Card' | 'Debit Card' | 'Credit Card' | 'Net Banking' | 'Cheque' | 'Demand Draft' | 'Bank Transfer' | 'Cash' | 'UPI' | 'Other';

export interface FeePaymentTransaction {
  id: string;
  studentFeeRecordId: string;
  receiptNo: string; // e.g. "SSIU-REC-2024-001"
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  programId: string;
  semesterId: string;
  semesterName?: string;
  academicYear?: string;
  paidAmount: number;
  paymentMode: PaymentMode;
  transactionId: string;
  referenceNo?: string;
  referenceDate?: string;
  bankName?: string;
  gatewayName?: string;
  gatewayRef?: string;
  feeType?: 'TUITION' | 'EXAM' | 'HOSTEL' | 'TRANSPORT' | 'OTHER' | 'ALL';
  status?: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  paymentDate: string; // YYYY-MM-DD
  remarks?: string;
  recordedBy: string;
}

export type PaymentOrderStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export type PaymentTransactionStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentOrder {
  id: string;
  orderNumber: string;
  invoiceId: string;
  studentId: string;
  gateway: string;
  gatewayOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionRecord {
  id: string;
  paymentOrderId?: string;
  invoiceId: string;
  invoiceNumber?: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  transactionNumber: string;
  gateway: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentTransactionStatus;
  failureReason?: string;
  gatewayResponseReference?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAuditLog {
  id: string;
  transactionId?: string;
  paymentOrderId?: string;
  action: 'ORDER_CREATED' | 'VERIFICATION_ATTEMPT' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILURE' | 'PAYMENT_CANCELLED' | 'DUPLICATE_ATTEMPT' | 'UNAUTHORIZED_ATTEMPT' | 'WEBHOOK_RECEIVED';
  performedByUserId?: string;
  performedByName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  paymentTransactionId: string;
  transactionNumber?: string;
  invoiceId: string;
  invoiceNumber?: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  programId?: string;
  programCode?: string;
  semesterId?: string;
  amount: number;
  totalPaidAfter: number;
  balanceRemaining: number;
  paymentDate: string;
  paymentMode: string;
  gateway: string;
  status: 'ISSUED' | 'CANCELLED';
  pdfReference?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceiptAuditLog {
  id: string;
  receiptId: string;
  action: 'GENERATED' | 'VIEWED' | 'DOWNLOADED' | 'PRINTED';
  performedByUserId?: string;
  performedByName?: string;
  details?: string;
  createdAt: string;
}

// --- PHASE 7: LATE FEE MANAGEMENT TYPES ---

export type LateFeeCalculationType = 'FIXED' | 'PER_DAY' | 'PERCENTAGE' | 'ONE_TIME';

export interface LateFeeRule {
  id: string;
  name: string;
  description?: string;
  feeStructureId?: string;
  feeHeadId?: string;
  calculationType: LateFeeCalculationType;
  amount: number;
  maximumAmount?: number;
  gracePeriodDays: number;
  applyOnOutstanding: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LateFeeRecord {
  id: string;
  invoiceId: string;
  ruleId: string;
  calculationDate: string;
  overdueDays: number;
  baseAmount: number;
  lateFeeAmount: number;
  status: 'APPLIED' | 'REVERSED';
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLateFeeInfo {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  invoiceTotal: number;
  totalPaid: number;
  outstanding: number;
  overdueDays: number;
  lateFeeAmount: number;
  totalPayable: number;
  isOverdue: boolean;
  rule?: LateFeeRule | null;
  message?: string;
}

export interface OverdueInvoiceSummary {
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  enrollmentNo: string;
  instituteName: string;
  programName: string;
  dueDate: string;
  daysOverdue: number;
  invoiceTotal: number;
  totalPaid: number;
  outstanding: number;
  lateFeeAmount: number;
  totalPayable: number;
  status: string;
}

// --- PHASE 6: CRM & ADMISSION MANAGEMENT TYPES ---

export interface LeadFollowUp {
  id: string;
  date: string; // YYYY-MM-DD
  notes: string;
  counsellorName: string;
  nextFollowUpDate?: string;
}

export type LeadSource = 'Website' | 'Social Media' | 'Newspaper' | 'Walk-in' | 'Reference' | 'Educational Fair' | 'Direct' | 'Campaign' | 'Referral';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'FOLLOW_UP' | 'APPLICATION' | 'CONVERTED' | 'LOST' | 'CLOSED';

export interface CRMLead {
  id: string;
  leadNumber?: string; // e.g. "LEAD/2026/0001"
  name: string;
  email: string;
  phone: string;
  instituteId?: string;
  instituteName?: string;
  programId: string;
  programName?: string;
  departmentId?: string;
  departmentName?: string;
  academicYearId?: string;
  academicYearName?: string;
  source: LeadSource;
  status: LeadStatus;
  counsellorId: string; // faculty / counsellor ID
  counsellorName: string;
  followUpDate?: string;
  followUps: LeadFollowUp[];
  remarks?: string;
  createdAt: string; // YYYY-MM-DD
  updatedAt?: string;
}

export interface CRMLeadDashboardStats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  followUp: number;
  application: number;
  converted: number;
  lost: number;
  conversionRate: number; // percentage
}

export type AdmissionApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPLIED' 
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_VERIFICATION' 
  | 'DOCUMENTS_VERIFIED'
  | 'SHORTLISTED' 
  | 'FEE_PENDING'
  | 'FEE_VERIFIED'
  | 'APPROVED' 
  | 'ADMISSION_CONFIRMED'
  | 'READY_FOR_ONBOARDING'
  | 'ONBOARDING_IN_PROGRESS'
  | 'ONBOARDED'
  | 'CONVERTED' 
  | 'REJECTED' 
  | 'HOLD'
  | 'CANCELLED';

export interface AdmissionDocument {
  id: string;
  name: string;
  documentType?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'N/A';
  fileUrl?: string;
  uploadDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  remarks?: string;
}

export interface AdmissionApplication {
  id: string;
  applicationNumber?: string;
  admissionNumber?: string;
  admissionType?: 'REGULAR' | 'MERIT' | 'MANAGEMENT' | 'INTERNATIONAL' | 'TRANSFER' | 'LATERAL_ENTRY';
  leadId?: string; // If converted from CRM lead
  studentId?: string; // Generated once converted to active Student
  enrollmentNo?: string;
  studentUserId?: string;
  applicantName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  bloodGroup: string;
  nationality?: string;
  category?: string;
  religion?: string;
  maritalStatus?: string;
  motherTongue?: string;
  aadhaarNumber?: string;
  photo?: string;
  
  // Address
  address: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Family Information
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContact?: string;

  // Academic Information
  instituteId?: string;
  instituteName?: string;
  departmentId?: string;
  departmentName?: string;
  academicYearId?: string;
  admissionYear?: string;
  programId: string;
  semesterId: string;
  batchId: string;
  divisionId: string;
  rollNumber?: string;

  // Academic Qualification
  qualifyingExam?: string;
  qualifyingBoard?: string;
  passingYear?: number;
  percentage?: number;

  // Fees
  isFeePaid?: boolean;
  feeAmountPaid?: number;
  feeReceiptNo?: string;
  feeStructureId?: string;
  feeTotal?: number;
  feePaid?: number;
  feePending?: number;
  feePaymentStatus?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED' | 'WAIVED' | 'SUCCESS';
  paymentTransactionId?: string;
  paymentDate?: string;

  // Academic Mapping & Mentorship
  mentorId?: string;
  mentorName?: string;
  hodId?: string;
  hodName?: string;
  classCoordinatorId?: string;

  // Status & Lifecycle
  status: AdmissionApplicationStatus;
  onboardingStatus?: 'PENDING' | 'DOC_VERIFIED' | 'FEE_VERIFIED' | 'READY' | 'ONBOARDED' | 'HOLD' | 'REJECTED';
  onboardingStep?: number; // 1 to 11
  onboardedAt?: string;
  onboardedBy?: string;
  documents: AdmissionDocument[];
  reviewerRemarks?: string;
  submittedAt: string; // YYYY-MM-DD
}

// --- PHASE 12: EXAMINATION MANAGEMENT TYPES ---

export type ExamType =
  | 'Regular'
  | 'Backlog'
  | 'Supplementary'
  | 'Remedial'
  | 'Re-Examination'
  | 'Improvement'
  | 'Special Examination'
  | 'Other'
  | 'Mid Semester'
  | 'End Semester'
  | 'Practical'
  // Canonical ERP exam-category values
  | 'REGULAR'
  | 'BACKLOG'
  | 'ATKT'
  | 'RE_EXAM'
  | 'SUPPLEMENTARY'
  | 'REASSESSMENT'
  | 'RECHECKING';

export type ExamStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'OPEN'
  | 'CLOSED'
  | 'FORM_OPEN'
  | 'FORM_CLOSED'
  | 'SCHEDULED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'EVALUATION'
  | 'APPROVAL'
  | 'RESULT_PROCESSING'
  | 'RESULT_PUBLISHED'
  | 'RESULTS_PUBLISHED'
  | 'CANCELLED';

export interface ExamSubjectItem {
  id?: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  examType?: string;
  examDate?: string;
  durationMinutes?: number;
  maximumMarks?: number;
  passingMarks?: number;
  internalMarks?: number;
  externalMarks?: number;
  credits?: number;
  examMode?: 'OFFLINE' | 'ONLINE' | 'OTHER';
  status?: string;
}

export interface ExamFeeItem {
  id?: string;
  examType: string;
  amount: number;
  currency?: string;
  isMandatory?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface ExamLateFeeRule {
  id?: string;
  calculationType: 'FIXED' | 'PER_DAY' | 'PERCENTAGE';
  amount: number;
  maximumAmount?: number;
  gracePeriodDays?: number;
  isActive?: boolean;
}

export interface Exam {
  id: string;
  code?: string;
  examCode?: string;
  name: string; // e.g., "B.Tech Sem-4 End Semester Exam 2026"
  type: ExamType | string;
  academicYearId: string;
  academicYearCode?: string;
  academicYear?: string;
  instituteId?: string;
  departmentId?: string;
  programId: string;
  semesterId: string;
  semesterNumber?: number;
  session?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  formStartDate?: string;
  formEndDate?: string;
  lateFeeStartDate?: string;
  lateFeeEndDate?: string;
  status: ExamStatus;
  description?: string;
  instructions?: string;
  notesheetId?: string;
  notesheetNumber?: string;
  // Mappings & Sub-Configurations
  subjects?: ExamSubjectItem[];
  fees?: ExamFeeItem[];
  lateFeeRule?: ExamLateFeeRule;
  subjectIds?: string[];
  studentIds?: string[];
  // Fee & Deadline Configuration (Legacy compatible)
  baseFee?: number;
  perSubjectFee?: number;
  lateFee?: number;
  formDeadline?: string; // YYYY-MM-DD
  lateFeeDeadline?: string; // YYYY-MM-DD
  minAttendancePercentage?: number; // e.g., 75
  minAttendanceRequired?: number; // default 75
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamDashboardStats {
  total: number;
  upcoming: number;
  completed: number;
  evaluationPending: number;
  resultsPublished: number;
}

export interface ExamTimetable {
  id: string;
  examId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM AM/PM
  endTime: string;
  roomNo: string;
  supervisorId?: string; // Faculty ID
}

export type ExamFormStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW'
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_COMPLETED'
  | 'PAID' 
  | 'VERIFICATION_PENDING' 
  | 'VERIFIED'
  | 'RETURNED'
  | 'APPROVED' 
  | 'HALL_TICKET_ISSUED' 
  | 'REJECTED'
  | 'CANCELLED';

export interface ExamFormSubjectItem {
  id?: string;
  examFormId?: string;
  examinationSubjectId?: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  credits?: number;
  examType?: string;
  amount?: number;
  status?: 'ENROLLED' | 'EXEMPTED' | 'DROPPED';
}

export interface ExamFormDocument {
  id: string;
  name: string;
  fileUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface ExamForm {
  id: string;
  examId: string;
  studentId: string;
  formNumber?: string;
  studentName?: string;
  enrollmentNo?: string;
  programId?: string;
  semesterId?: string;
  semesterNumber?: number;
  appliedDate?: string; // YYYY-MM-DD
  submittedAt?: string;
  submittedBy?: string;
  status: ExamFormStatus;
  paymentStatus: 'PAID' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'WAIVED' | 'SUCCESS' | 'INITIATED' | 'REFUNDED';
  regularSubjects?: string[]; // Subject IDs
  remedialSubjects?: string[]; // Subject IDs
  backlogSubjects?: string[]; // Subject IDs
  formSubjects?: ExamFormSubjectItem[];
  examFeeAmount?: number;
  lateFeeAmount?: number;
  totalAmount?: number;
  baseFee?: number;
  subjectFee?: number;
  lateFee?: number;
  totalFee?: number;
  feePaid?: boolean;
  documents?: ExamFormDocument[];
  receiptNo?: string;
  receiptNumber?: string;
  paymentMode?: string;
  transactionId?: string;
  paymentTransactionId?: string;
  paidAt?: string;
  hallTicketNo?: string;
  isEligible?: boolean;
  isVerified?: boolean;
  returnReason?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationRemarks?: string;
  returnedAt?: string;
  returnedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  remarks?: string;
  attendancePercentage?: number;
  examCentreName?: string;
  examBuilding?: string;
  examRoomNo?: string;
  examSeatNo?: string;
  declarationAccepted?: boolean;
  examTypeCategory?: 'REGULAR' | 'BACKLOG' | 'ATKT' | 'RE_EXAM' | 'SUPPLEMENTARY' | 'REASSESSMENT' | 'RECHECKING';
  createdAt?: string;
  updatedAt?: string;
}

// ─── REASSESSMENT / RECHECKING APPLICATION ────────────────────────────────────

export type ReassessmentType = 'REASSESSMENT' | 'RECHECKING';

export type ReassessmentStatus =
  | 'SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ReassessmentApplication {
  id: string;
  applicationNo: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  examId: string;
  examName?: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  semesterId?: string;
  semesterNumber?: number;
  programId?: string;
  type: ReassessmentType;
  marksObtained?: number;
  maximumMarks?: number;
  revisedMarks?: number;
  result?: string;           // PASS / FAIL / ABSENT etc.
  deadline?: string;         // Application deadline YYYY-MM-DD
  fee: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMode?: string;
  transactionId?: string;
  paidAt?: string;
  status: ReassessmentStatus;
  processingRemarks?: string;
  rejectionReason?: string;
  applicationDate: string;
  processedAt?: string;
  processedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Fee Breakdown (backend-authoritative — frontend must NOT recalculate)
export interface ExamFeeBreakdown {
  baseFee: number;
  perSubjectFee: number;
  subjectCount: number;
  subjectFeeTotal: number;
  lateFee: number;
  concession: number;
  totalPayable: number;
  currency: string;
  isLate: boolean;
  feeCategory: 'REGULAR' | 'BACKLOG' | 'ATKT' | 'RE_EXAM' | 'SUPPLEMENTARY' | 'REASSESSMENT' | 'RECHECKING';
}

// Backlog eligible subject entry
export interface BacklogSubjectEntry {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  semesterId?: string;
  semesterNumber?: number;
  attemptNumber: number;
  marksObtained?: number;
  maximumMarks?: number;
  result: string;    // FAIL / ABSENT / ATKT
  examType: 'BACKLOG' | 'ATKT' | 'RE_EXAM';
  eligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'MAX_ATTEMPTS_REACHED';
  eligibilityReason?: string;
  fee?: number;
  previousExamFormId?: string;
}

export interface HallTicket {
  id: string;
  hallTicketNo: string;
  examId: string;
  studentId: string;
  examFormId?: string;
  examSessionName: string;
  verificationCode: string;
  issueDate: string;
  status: 'GENERATED' | 'ISSUED' | 'BLOCKED' | 'CANCELLED';
  qrData?: string;
  downloadUrl?: string;
  student?: Student;
  examForm?: ExamForm;
  centreName?: string;
  roomNumber?: string;
  seatNumber?: string;
  createdAt?: string;
}

export interface ExamCentre {
  id: string;
  code: string;
  name: string;
  instituteId?: string;
  building: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  rooms?: ExamRoom[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamRoom {
  id: string;
  centreId: string;
  building?: string;
  roomNumber: string;
  roomCode?: string;
  floor?: number;
  capacity: number;
  roomType?: 'CLASSROOM' | 'LAB' | 'HALL' | 'OTHER';
  hasCCTV?: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'ACTIVE' | 'INACTIVE';
  centre?: ExamCentre;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamCentreAllocation {
  id: string;
  examId: string;
  centreId: string;
  status: 'ACTIVE' | 'CANCELLED';
  allocatedCapacity: number;
  centre?: ExamCentre;
  exam?: Exam;
  createdAt?: string;
}

export interface ExamSeatAllocation {
  id: string;
  examId: string;
  examScheduleId?: string;
  centreId: string;
  roomId: string;
  studentId: string;
  hallTicketId?: string;
  seatNumber: string;
  row?: string;
  column?: number;
  status: 'ALLOCATED' | 'CHANGED' | 'CANCELLED';
  reason?: string;
  allocatedAt?: string;
  centre?: ExamCentre;
  room?: ExamRoom;
  student?: Student;
  history?: ExamSeatChangeHistory[];
}

export interface ExamSeatChangeHistory {
  id: string;
  seatAllocationId: string;
  studentId: string;
  examId: string;
  fromCentreId?: string;
  toCentreId?: string;
  fromRoomId?: string;
  toRoomId?: string;
  fromSeatNumber?: string;
  toSeatNumber: string;
  reason: string;
  changedByUserId: string;
  changedByName?: string;
  changedAt: string;
}

export interface ExamEdpDuty {
  id: string;
  dutyNo: string;
  examId: string;
  dutyDate: string;
  shift: string;
  centreId: string;
  building?: string;
  roomId?: string;
  dutyType: 'EDP_OPERATOR' | 'EXAM_SUPPORT' | 'TECHNICAL_SUPPORT' | 'CONTROL_ROOM' | 'OTHER';
  staffUserId: string;
  status: 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  rejectionReason?: string;
  remarks?: string;
  assignedByUserId?: string;
  assignedAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  centre?: ExamCentre;
  room?: ExamRoom;
  staffUser?: any;
  history?: ExamEdpDutyHistory[];
}

export interface ExamEdpDutyHistory {
  id: string;
  dutyId: string;
  action: string;
  performedByUserId: string;
  performedByName?: string;
  reason?: string;
  createdAt: string;
}

export interface StudentMarks {
  id: string;
  examId?: string;
  examFormId?: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  examScheduleId?: string;
  internalMarks: number;
  maxInternalMarks: number;
  externalMarks: number;
  maxExternalMarks: number;
  practicalMarks?: number;
  maxPracticalMarks?: number;
  totalMarks: number;
  maxMarks?: number;
  grade: string;
  gradePoints?: number;
  isPass: boolean;
  isPassed?: boolean;
  isAbsent?: boolean;
  isMalpractice?: boolean;
  evaluationStatus?: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'RETURNED' | 'REJECTED' | 'APPROVED' | 'REVISED';
  resultStatus?: 'PENDING' | 'DECLARED' | 'WITHHELD' | 'CANCELLED';
  returnReason?: string;
  correctionReason?: string;
  enteredBy?: string;
  enteredAt?: string;
  submittedBy?: string;
  submittedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ResultRevisionHistory {
  id: string;
  resultSummaryId: string;
  examResultId?: string;
  previousMarks?: number;
  newMarks?: number;
  previousGrade?: string;
  newGrade?: string;
  previousResultStatus?: string;
  newResultStatus?: string;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export interface GradeConfiguration {
  id: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  description?: string;
  isPass: boolean;
}

export interface StudentResult {
  id: string;
  examId: string;
  examName?: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  programId: string;
  programName?: string;
  departmentId?: string;
  departmentName?: string;
  semesterId: string;
  semesterNumber?: number;
  academicYearCode?: string;
  totalCredits?: number;
  earnedCredits?: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage?: number;
  sgpa: number;
  cgpa: number;
  backlogsCount?: number;
  status: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD' | 'REVISED';
  isPublished?: boolean;
  publishedDate?: string;
  publishedAt?: string;
  marksheetNo?: string;
  verificationCode?: string;
  withheldCategory?: string;
  withheldReason?: string;
  remarks?: string;
  revisions?: ResultRevisionHistory[];
  subjectResults?: StudentMarks[];
}

export interface ResultSummary extends StudentResult {}

export type FeedbackType = 'FACULTY' | 'DEPARTMENT' | 'SUBJECT' | 'FACILITIES' | 'UNIVERSITY';

export interface StudentFeedback {
  id: string;
  studentId: string; // Kept internally for student edit rights, hidden from Faculty
  type: FeedbackType;
  academicYearId: string;
  departmentId: string;
  programId?: string;
  semesterId?: string;
  facultyId?: string;
  facultyName?: string;
  subjectId?: string;
  subjectName?: string;

  // Faculty Ratings (1-5 Stars)
  teachingQualityRating?: number;
  communicationRating?: number;
  subjectKnowledgeRating?: number;
  disciplineRating?: number;

  // Department / Facility Ratings (1-5 Stars)
  facilitiesRating?: number;
  administrationRating?: number;
  academicSupportRating?: number;

  overallRating: number;
  comments?: string;
  submittedAt: string; // YYYY-MM-DD
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'ACADEMIC' | 'ADMINISTRATIVE' | 'FEE_FINANCE' | 'EXAMINATION' | 'HOSTEL_FACILITIES' | 'OTHER';

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  fileUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  departmentId: string;
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  category: TicketCategory;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationModule = 
  | 'NOTICE' 
  | 'TIMETABLE' 
  | 'ASSIGNMENT' 
  | 'MATERIAL' 
  | 'EXAM' 
  | 'FEES' 
  | 'REQUEST' 
  | 'APPROVAL' 
  | 'EVENT' 
  | 'SYSTEM';

export type ExamNotificationType =
  | 'EXAM_FORM'
  | 'EXAM_FEE'
  | 'EXAM_DEADLINE'
  | 'EXAM_SCHEDULE'
  | 'EXAM_CENTRE'
  | 'HALL_TICKET'
  | 'RESULT'
  | 'REASSESSMENT'
  | 'RECHECKING'
  | 'BACKLOG'
  | 'RE_EXAM'
  | 'IMPORTANT_NOTICE';

export type NotificationType = 
  | 'ACTION_REQUIRED'
  | 'STATUS_UPDATE'
  | 'INFORMATION'
  | 'REMINDER'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_COMPLETED'
  | 'REJECTION'
  | 'SUCCESS'
  | 'DEADLINE';

export type NotificationScopeType = 
  | 'TARGETED'
  | 'DEPARTMENT_WIDE'
  | 'INSTITUTE_WIDE'
  | 'UNIVERSITY_WIDE';

export type NotificationRecipientType =
  | 'DIRECT_USER'
  | 'ROLE'
  | 'DEPARTMENT'
  | 'INSTITUTE'
  | 'WORKFLOW_STEP'
  | 'REQUESTER'
  | 'APPROVER'
  | 'ASSIGNEE'
  | 'UNIVERSITY';

export interface NotificationRecipientRecord {
  id: string;
  notificationId: string;
  userId: string;
  userRole?: UserRole | string;
  deliveredAt: string;
  readAt?: string;
  isRead: boolean;
}

export interface ERPNotification {
  id: string;
  type?: NotificationType;
  title: string;
  message: string;
  module: NotificationModule | string;
  timestamp?: string;
  createdAt: string;
  isReadByUsers: string[];
  recipients?: NotificationRecipientRecord[];
  scopeType?: NotificationScopeType;
  referenceId?: string;
  referenceType?: string;
  recordId?: string;
  actionType?: string;
  targetRoute?: string;
  targetParams?: Record<string, any>;
  targetRole?: UserRole | 'ALL';
  targetInstituteId?: string;
  targetDepartmentId?: string;
  targetProgramId?: string;
  targetSemesterId?: string;
  targetDivisionId?: string;
  targetAcademicYearId?: string;
  targetUserId?: string;
  targetUserIds?: string[];
  linkTab?: string;
  examId?: string;
  examName?: string;
  examNotificationType?: ExamNotificationType;
  actionUrl?: string;
  actionLabel?: string;
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';
  publishDate?: string;
  expiryDate?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdBy?: string;
}

export type InwardOutwardType = 'INWARD' | 'OUTWARD';
export type InwardOutwardStatus =
  | 'RECEIVED'
  | 'UNDER_PROCESS'
  | 'FORWARDED'
  | 'ACTION_REQUIRED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'DRAFT'
  | 'READY'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'PROCESSING'
  | 'DISPOSED';

export type InwardOutwardPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';
export type InwardOutwardMode =
  | 'POST'
  | 'COURIER'
  | 'EMAIL'
  | 'HAND_DELIVERY'
  | 'SPEED_POST'
  | 'REGISTERED_POST'
  | 'BY_HAND'
  | 'OTHER';

export type RegisterDocumentType =
  | 'LETTER'
  | 'CIRCULAR'
  | 'NOTICE'
  | 'APPLICATION'
  | 'GOVERNMENT_COMMUNICATION'
  | 'UNIVERSITY_COMMUNICATION'
  | 'INVOICE'
  | 'LEGAL_DOCUMENT'
  | 'ACADEMIC_DOCUMENT'
  | 'OTHER';

export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'LOST';

export interface InwardOutwardDocument {
  id: string;
  name: string;
  url: string;
  size?: string;
  fileType?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface InwardForwardingItem {
  id: string;
  inwardId: string;
  forwardedByUserId: string;
  forwardedByName?: string;
  forwardedToOffice?: string;
  forwardedToDepartmentId?: string;
  forwardedToDepartmentName?: string;
  forwardedToUserId?: string;
  forwardedToUserName?: string;
  forwardedDate: string;
  actionRequired: string;
  dueDate?: string;
  remarks?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ACTION_TAKEN' | 'COMPLETED';
  actionTaken?: string;
  actionTakenDate?: string;
}

export interface OutwardDispatchItem {
  id: string;
  outwardId: string;
  courierService: string;
  trackingNumber?: string;
  dispatchDate: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  deliveryStatus: DeliveryStatus;
  dispatchedByUserId?: string;
  dispatchedByName?: string;
  remarks?: string;
}

export interface RegisterTimelineEvent {
  id: string;
  date: string;
  actor: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  remarks?: string;
}

export interface InwardOutwardRecord {
  id: string;
  type: InwardOutwardType;
  recordNumber: string; // INW/2026/000001 or OUT/2026/000001
  inwardNumber?: string;
  outwardNumber?: string;
  dispatchNo: string; // backwards compatibility alias for recordNumber

  // Inward specific
  receiptDate?: string;
  receivedDate?: string;
  receivedFrom?: string;
  senderOrganization?: string;
  letterNumber?: string;
  letterDate?: string;
  assignedTo?: string; // User ID or User Name
  assignedToUserId?: string;
  assignedToName?: string;
  description?: string;
  documentType?: RegisterDocumentType;
  modeOfReceipt?: InwardOutwardMode;
  dueDate?: string;

  // Outward specific
  dispatchDate?: string;
  recipient?: string;
  sentTo?: string;
  recipientOrganization?: string;
  receiverAddress?: string;
  address?: string;
  recipientEmail?: string;
  receiverPhone?: string;
  referenceNumber?: string;
  preparedBy?: string; // User ID or User Name
  preparedByName?: string;
  dispatchMode?: InwardOutwardMode;
  modeOfDispatch?: InwardOutwardMode;
  courierService?: string;
  trackingNumber?: string;
  mode?: InwardOutwardMode; // backwards compat
  trackingNo?: string; // backwards compat
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  deliveryStatus?: DeliveryStatus;

  // Common
  subject: string;
  departmentId?: string;
  departmentName?: string;
  sourceInstituteId?: string;
  sourceDepartmentId?: string;
  instituteId?: string;
  instituteName?: string;
  destinationInstitute?: string;
  issuedDate?: string;
  issuedBy?: string;
  inwardId?: string; // Linked inward ID when record is OUTWARD
  priority: InwardOutwardPriority;
  status: InwardOutwardStatus;
  remarks?: string;
  notesheetId?: string;
  notesheetNumber?: string;
  supportingDocuments?: InwardOutwardDocument[];
  forwardings?: InwardForwardingItem[];
  dispatches?: OutwardDispatchItem[];
  timeline?: RegisterTimelineEvent[];
  senderOrRecipient?: string; // backwards compat
  category?: 'GOVT_DIRECTIVE' | 'UGC_AICTE' | 'AFFILIATION' | 'LEGAL' | 'GENERAL'; // backwards compat
  receivedOrDispatchedDate?: string; // backwards compat
  assignedSection?: string; // backwards compat
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface InwardOutwardDashboardStats {
  todayInward: number;
  pendingInward: number;
  actionRequired: number;
  overdueInward: number;
  totalInward: number;
  todayOutward: number;
  dispatchedOutward: number;
  deliveredOutward: number;
  returnedOutward: number;
  totalOutward: number;
  // backwards compat
  pending?: number;
  inProgress?: number;
  completed?: number;
  todayCount?: number;
  thisMonthCount?: number;
}

export interface RegistrarFileMovement {
  id: string;
  fileNo: string;
  fileTitle: string;
  initiatingSection: string;
  currentCustodian: string;
  movementDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'IN_MOVEMENT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
  remarks?: string;
}

// --- CENTRAL APPROVAL WORKFLOW TYPES ---

export type ApprovalOfficeType = 
  | 'REGISTRAR'
  | 'UNIVERSITY_ADMIN'
  | 'IQAC'
  | 'EXAM_CELL'
  | 'STUDENT_SECTION'
  | 'HOSTEL_ADMIN'
  | 'LIBRARY_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'MAINTENANCE_ADMIN'
  | 'HOD_ACADEMIC'
  | 'FINANCE_CELL';

export type ApprovalRequestCategory = 
  | 'BONAFIDE_CERTIFICATE'
  | 'TRANSCRIPT_DEGREE'
  | 'FEE_CONCESSION'
  | 'HOSTEL_NO_DUES'
  | 'RE_EVALUATION'
  | 'NO_OBJECTION_CERTIFICATE'
  | 'LEAVE_APPLICATION'
  | 'RESEARCH_GRANT'
  | 'EVENT_PERMISSION'
  | 'INFRASTRUCTURE_MAINTENANCE'
  | 'GENERAL_ADMINISTRATIVE';

export type ApprovalStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'RETURNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED'
  | 'FORWARDED'
  | 'WITHDRAWN'
  | 'LOCKED';

export type ApprovalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkflowModuleSource = 
  | 'GENERAL_REQUEST'
  | 'NOTE_SHEET'
  | 'CAMPUS_SERVICE'
  | 'ADMISSION'
  | 'FINANCE'
  | 'EVENT'
  | 'HOSTEL'
  | 'TRANSPORT';

export interface WorkflowStageStep {
  stageIndex: number;
  stageName: string;
  requiredRole: UserRole | 'DEPUTY_REGISTRAR' | 'VICE_PRESIDENT' | 'FINANCE_CELL' | string;
  requiredOffice?: ApprovalOfficeType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'SKIPPED';
  actionByUserId?: string;
  actionByUserName?: string;
  actionByUserRole?: UserRole | string;
  actionAt?: string;
  remarks?: string;
}

export interface ApprovalWorkflowConfig {
  id: string;
  name: string;
  description?: string;
  category?: ApprovalRequestCategory | string;
  moduleSource?: WorkflowModuleSource;
  stages: {
    stageIndex: number;
    stageName: string;
    requiredRole: UserRole | 'DEPUTY_REGISTRAR' | 'VICE_PRESIDENT' | 'FINANCE_CELL' | string;
    requiredOffice?: ApprovalOfficeType;
  }[];
  isActive: boolean;
}

export interface ApprovalAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ApprovalRemarkHistory {
  id: string;
  actionByUserId: string;
  actionByUserName: string;
  actionByUserRole: UserRole | string;
  office: ApprovalOfficeType;
  action: ApprovalStatus | 'COMMENTED';
  remarks: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  requestNo: string;
  moduleSource?: WorkflowModuleSource;
  sourceEntityId?: string;
  
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  applicantEmail: string;
  applicantPhone?: string;
  applicantEnrollmentOrEmpId?: string;
  departmentId?: string;
  departmentName?: string;
  instituteId?: string;
  instituteName?: string;
  
  category: ApprovalRequestCategory;
  title: string;
  description: string;
  priority: ApprovalPriority;
  
  // Financial & Estimate details where applicable
  amount?: number;
  financialEstimateSummary?: string;
  
  targetOffice: ApprovalOfficeType;
  currentOffice: ApprovalOfficeType;
  
  // Workflow hierarchy & multi-stage tracking
  workflowConfigId?: string;
  currentStageIndex?: number;
  totalStages?: number;
  stages?: WorkflowStageStep[];
  
  status: ApprovalStatus;
  deadlineDate: string;
  
  attachments: ApprovalAttachment[];
  remarksHistory: ApprovalRemarkHistory[];
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
}

export interface ApprovalDashboardStats {
  pendingApprovals: number;
  approvedToday: number;
  totalApproved: number;
  totalRejected: number;
  totalReturned: number;
  averageApprovalTimeHours: number;
  averageApprovalTimeDisplay: string;
  inboxCount: number;
  submittedByMeCount: number;
  totalRequests: number;
}

// --- PHASE 3: SMART ACTION CENTER TYPES ---

export type SmartActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SmartActionCategory = 
  | 'APPROVAL'
  | 'FEE'
  | 'ATTENDANCE'
  | 'EXAM'
  | 'ASSIGNMENT'
  | 'WORK_DIARY'
  | 'EDP_DUTY'
  | 'CRM'
  | 'HOSTEL'
  | 'MAINTENANCE'
  | 'ACADEMIC'
  | 'GENERAL';

export interface SmartActionItem {
  id: string;
  title: string;
  shortDescription: string;
  count: number;
  countLabel?: string;
  priority: SmartActionPriority;
  dueDate?: string;
  category: SmartActionCategory;
  targetTab: string;
  targetRecordId?: string;
  actionType?: string;
  targetParams?: Record<string, any>;
  takeActionText: string;
  iconName: string;
  badgeVariant: 'danger' | 'warning' | 'orange' | 'gold' | 'active' | 'navy' | 'success';
  sourceModule?: string;
}

// --- EDP DUTY MANAGEMENT MODULE TYPES ---

export type EdpDutyRole = 
  | 'EVENT_COORDINATOR'
  | 'VENUE_INCHARGE'
  | 'DISCIPLINE_OFFICER'
  | 'TECHNICAL_LEAD'
  | 'REGISTRATION_DESK'
  | 'STAGE_MANAGER'
  | 'VIP_HOSPITALITY'
  | 'CHIEF_GUEST_ESCORT'
  | 'GENERAL_DUTY';

export type EdpDutyStatus = 
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'EXCUSED'
  | 'ABSENT';

export interface EdpDutyPhoto {
  id: string;
  photoUrl: string;
  caption: string;
  uploadedAt: string;
  fileSize?: string;
  fileName?: string;
}

export interface EdpDutyEvidence {
  id: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  capturedAt: string;
  deviceInfo?: string;
  remarks?: string;
}

export interface EdpDuty {
  id: string;
  dutyCode: string; // e.g. "EDP-2026-001"
  
  // Faculty Staff Details
  facultyId?: string;
  facultyName?: string;
  facultyDesignation?: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedUserRole: UserRole;
  assignedUserDesignation?: string;
  
  // Academic Class Hierarchy
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  semesterId?: string;
  semesterName?: string;
  batchId?: string;
  batchName?: string;
  divisionId?: string;
  divisionName?: string;
  
  // Subject & Classroom Details
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  roomNo?: string;
  classroom?: string;
  venue?: string;
  
  // Schedule Details
  dutyDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  
  // Student Headcount Verification
  totalStudents?: number;
  presentStudents?: number;
  absentStudents?: number;
  
  // Classroom Photo Proofs & Documentation
  photos?: EdpDutyPhoto[];
  evidenceList: EdpDutyEvidence[];
  
  // Remarks & Submission Status
  remarks?: string;
  responsibilityDetails?: string;
  reportsNotes?: string;
  status: EdpDutyStatus;
  
  submittedAt?: string;
  verifiedByAdminId?: string;
  verifiedByAdminName?: string;
  verifiedAt?: string;
  verificationRemarks?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface EdpDutyDashboardStats {
  totalDuties: number;
  assigned: number;
  inProgress: number;
  submitted: number;
  verified: number;
  rejected: number;
  classesCovered: number;
  studentsCovered: number;
  photosUploaded: number;
}

// ─── NAAC & IQAC FRAMEWORK TYPES ───────────────────────────────────────────

export interface NaacCriterion {
  id: string;
  code: string; // e.g. "C1", "C2" ... "C7"
  number: number; // 1 to 7
  title: string;
  description: string;
  weightage: number;
  keyIndicatorsCount: number;
}

export interface NaacKeyIndicator {
  id: string;
  criterionId: string;
  code: string; // e.g. "1.1", "2.4"
  title: string;
  weightage: number;
}

export type NaacMetricType = 'QnM' | 'QlM'; // QnM = Quantitative Metric, QlM = Qualitative Metric

export interface NaacMetric {
  id: string;
  keyIndicatorId: string;
  criterionId: string;
  code: string; // e.g. "1.1.1", "2.4.2"
  title: string;
  type: NaacMetricType;
  weightage: number;
  formulaDescription?: string;
  autoErpSource?: 'STUDENTS_COUNT' | 'FACULTY_COUNT' | 'FACULTY_PHD_COUNT' | 'PASS_PERCENTAGE' | 'RESEARCH_PAPERS' | 'EDP_DUTIES' | 'FEEDBACK_RATING';
  requiredEvidence: string[];
}

export interface NaacDataSubmission {
  id: string;
  metricId: string;
  metricCode: string;
  criterionId: string;
  departmentId?: string;
  instituteId?: string;
  academicYearId: string;
  
  // Data values
  quantitativeValue?: number;
  qualitativeText?: string;
  dataFields?: Record<string, any>;
  
  // Evidence
  evidenceUrls: string[];
  geoTaggedPhotoUrls?: string[];
  websiteLinks?: string[];
  
  // Multi-Stage Approval Workflow: Dept -> HOD -> IQAC -> Registrar -> Locked
  status: ApprovalStatus;
  currentApproverRole: UserRole;
  submittedByUserId: string;
  submittedByUserName: string;
  submittedAt: string;
  
  remarksHistory: ApprovalRemarkHistory[];
  updatedAt: string;
  lockedAt?: string;
}

// ─── RESEARCH & INNOVATION TYPES ──────────────────────────────────────────

export interface ResearchProject {
  id: string;
  projectCode: string;
  title: string;
  principalInvestigatorId: string;
  principalInvestigatorName: string;
  departmentId: string;
  instituteId: string;
  fundingAgency: string; // e.g. GUJCOST, DST, SERB, UGC, Industry Sponsored
  sanctionedAmount: number;
  sanctionYear: number;
  durationYears: number;
  status: 'PROPOSED' | 'SANCTIONED' | 'ONGOING' | 'COMPLETED';
}

export interface PublicationRecord {
  id: string;
  title: string;
  authors: string;
  facultyId: string;
  departmentId: string;
  journalOrConferenceName: string;
  indexing: 'Scopus' | 'Web of Science' | 'UGC CARE' | 'IEEE' | 'Other';
  issnIsbn?: string;
  publicationYear: number;
  doiUrl?: string;
}

export interface PatentRecord {
  id: string;
  applicationNo: string;
  title: string;
  inventors: string;
  facultyId: string;
  departmentId: string;
  status: 'FILED' | 'PUBLISHED' | 'GRANTED';
  filedDate: string;
  grantedDate?: string;
}

// ─── HR MANAGEMENT MODULE TYPES ──────────────────────────────────────────

export type EmployeeType = 
  | 'FACULTY' 
  | 'ADMINISTRATIVE' 
  | 'ADMIN_STAFF'
  | 'TECHNICAL' 
  | 'TECHNICAL_STAFF'
  | 'NON_TEACHING' 
  | 'LAB_STAFF' 
  | 'LIBRARY' 
  | 'IT' 
  | 'SUPPORT' 
  | 'SUPPORT_STAFF'
  | 'SECURITY' 
  | 'HOUSEKEEPING' 
  | 'MAINTENANCE' 
  | 'DRIVER' 
  | 'OTHER';

export type EmploymentType = 
  | 'PERMANENT' 
  | 'PROBATION' 
  | 'CONTRACT' 
  | 'TEMPORARY' 
  | 'PART_TIME' 
  | 'VISITING' 
  | 'GUEST' 
  | 'CONSULTANT' 
  | 'OTHER';

export type EmployeeStatus = 
  | 'ACTIVE' 
  | 'ON_LEAVE' 
  | 'PROBATION' 
  | 'RESIGNED' 
  | 'RELIEVED' 
  | 'RETIRED' 
  | 'TERMINATED' 
  | 'SUSPENDED' 
  | 'TRANSFERRED';

export type LeaveType = 
  | 'CASUAL' 
  | 'SICK' 
  | 'MEDICAL' 
  | 'EARNED' 
  | 'MATERNITY' 
  | 'PATERNITY' 
  | 'STUDY_LEAVE' 
  | 'DUTY_LEAVE' 
  | 'SPECIAL_LEAVE' 
  | 'UNPAID' 
  | 'OTHER';

export type AttendanceMark = 
  | 'PRESENT' 
  | 'ABSENT' 
  | 'HALF_DAY' 
  | 'LATE' 
  | 'EARLY_EXIT' 
  | 'WORK_FROM_HOME' 
  | 'ON_DUTY' 
  | 'HOLIDAY' 
  | 'WEEKLY_OFF';

export interface Employee {
  id: string;
  employeeId: string; // e.g. "EMP-2026-00001"
  employeeCode?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Employment & Hierarchy
  designation: string;
  employeeType: EmployeeType;
  employmentType?: EmploymentType;
  employmentStatus?: string;
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  joiningDate: string;
  confirmationDate?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  hodHoiId?: string;
  hodHoiName?: string;
  workLocation?: string;
  shift?: string;
  status: EmployeeStatus;

  // Compensation & Statutory
  salary: number; // monthly gross pay
  basicSalary?: number;
  hra?: number;
  da?: number;
  specialAllowance?: number;
  otherAllowance?: number;
  bankName?: string;
  bankAccountNo: string;
  ifscCode?: string;
  panNo: string;
  aadhaarNo: string;
  pfNumber?: string;
  uanNumber?: string;
  esicNumber?: string;

  // Qualifications & Experience
  qualification: string;
  highestDegree?: string;
  specialization?: string;
  experienceYears: number;
  previousInstitute?: string;

  // Faculty-Specific Academic Profile (N/A for Non-Teaching)
  isFaculty?: boolean;
  programId?: string;
  teachingLoadHours?: number;
  researchInterests?: string[];
  publicationsCount?: number;
  fdpConductedCount?: number;
  fdpAttendedCount?: number;
  conferencesCount?: number;
  certificationsCount?: number;
  menteeStudentsCount?: number;

  // System & Login Linkage
  userId?: string;
  username?: string;
  loginActivated?: boolean;
  assignedAssetIds?: string[];
  
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  departmentId: string;
  departmentName?: string;
  date: string; // YYYY-MM-DD
  inTime?: string; // HH:mm
  outTime?: string; // HH:mm
  status: AttendanceMark;
  workHours?: number;
  isLate?: boolean;
  lateMinutes?: number;
  isEarlyExit?: boolean;
  source: 'MANUAL' | 'BIOMETRIC' | 'BULK_IMPORT' | 'CORRECTION' | 'WEB';
  remarks?: string;
  verifiedBy?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  requestNo: string; // e.g. "ATT-CORR-2026-00001"
  employeeId: string;
  employeeName: string;
  departmentId: string;
  date: string;
  currentStatus: AttendanceMark;
  requestedStatus: AttendanceMark;
  requestedInTime?: string;
  requestedOutTime?: string;
  reason: string;
  status: 'SUBMITTED' | 'MANAGER_APPROVED' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  createdAt: string;
}

export interface EmployeeLeaveBalance {
  id: string;
  employeeId: string;
  academicYear: string;
  leaveType: LeaveType;
  openingBalance: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface EmployeeLeaveApplication {
  id: string;
  applicationNo?: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: ApprovalStatus | 'SUBMITTED' | 'MANAGER_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  managerApproval?: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerRemarks?: string;
  hodApproval?: 'PENDING' | 'APPROVED' | 'REJECTED';
  hodRemarks?: string;
  hrApproval?: 'PENDING' | 'APPROVED' | 'REJECTED';
  hrRemarks?: string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedDate?: string;
  appliedDate: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  departmentName: string;
  basicPay: number;
  hra: number;
  da: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfDeduction: number;
  esicDeduction: number;
  professionalTax: number;
  tdsDeduction: number;
  loanDeduction: number;
  totalDeductions: number;
  netSalary: number;
  effectiveFrom: string;
  status: 'ACTIVE' | 'REVISED' | 'INACTIVE';
}

export interface PayrollRecord {
  id: string;
  payrollNumber?: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  month: string; // e.g. "August 2026"
  year: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  basicPay: number;
  hra: number;
  da: number;
  specialAllowance: number;
  incentives?: number;
  overtimePay?: number;
  arrears?: number;
  grossSalary: number;
  pfDeduction: number;
  esicDeduction?: number;
  professionalTax?: number;
  taxDeduction: number; // TDS
  loanAdvanceDeduction?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  bankName?: string;
  bankAccountNo?: string;
  paymentMode?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
  transactionRef?: string;
  status: 'DRAFT' | 'CALCULATED' | 'VERIFIED' | 'APPROVED' | 'PAID';
  processedBy?: string;
  processedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidDate?: string;
  payslipGenerated?: boolean;
}

export interface EmployeeDocumentItem {
  id: string;
  employeeId: string;
  documentType: 
    | 'ID_PROOF' 
    | 'PAN_CARD' 
    | 'AADHAAR_CARD' 
    | 'ACADEMIC_CERTIFICATE' 
    | 'DEGREE_CERTIFICATE' 
    | 'MARKSHEET' 
    | 'EXPERIENCE_CERTIFICATE' 
    | 'APPOINTMENT_LETTER' 
    | 'JOINING_REPORT' 
    | 'BANK_PASSBOOK_CANCELLED_CHEQUE' 
    | 'CONTRACT_AGREEMENT' 
    | 'NOC' 
    | 'RELIEVING_LETTER' 
    | 'SALARY_SLIP_PREVIOUS' 
    | 'OTHER';
  documentTitle: string;
  documentNumber?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  uploadedDate: string;
  uploadedBy: string;
  expiryDate?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export interface PerformanceAppraisal {
  id: string;
  appraisalNo?: string;
  employeeId: string;
  employeeName: string;
  designation?: string;
  departmentName?: string;
  academicYearId: string;
  academicYearCode?: string;
  reviewCycle: 'ANNUAL' | 'PROBATION' | 'MID_YEAR';
  kraList?: { kra: string; weightage: number; selfScore: number; managerScore: number }[];
  selfAssessmentRemarks?: string;
  managerAssessmentRemarks?: string;
  hodRemarks?: string;
  hrRemarks?: string;
  teachingRating: number; // out of 5.0 (N/A for Non-Teaching)
  researchRating: number; // out of 5.0 (N/A for Non-Teaching)
  administrativeRating: number; // out of 5.0
  universityContributionRating?: number;
  overallScore: number; // out of 5.0
  grade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  recommendation?: 'PROMOTION' | 'INCREMENT' | 'CONFIRMATION' | 'TRAINING_REQUIRED' | 'RETAIN_SAME';
  feedback: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED';
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface TrainingFdpRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  trainingType: 'FDP' | 'WORKSHOP' | 'TRAINING' | 'CERTIFICATION' | 'CONFERENCE' | 'SEMINAR' | 'SKILL_DEVELOPMENT';
  title: string;
  organizer: string;
  location?: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  costSponsoredByUniversity?: number;
  certificateUrl?: string;
  certificateNumber?: string;
  status: 'NOMINATED' | 'ATTENDED' | 'COMPLETED' | 'VERIFIED';
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface JobVacancy {
  id: string;
  vacancyCode: string; // e.g. "VAC-2026-001"
  positionTitle: string;
  instituteId: string;
  instituteName: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  employeeType: EmployeeType;
  employmentType: EmploymentType;
  vacanciesCount: number;
  requiredQualification: string;
  minExperienceYears: number;
  jobDescription: string;
  postingDate: string;
  closingDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCREENING' | 'INTERVIEWS' | 'CLOSED' | 'CANCELLED';
  applicantCount: number;
}

export interface JobApplication {
  id: string;
  applicationNo: string;
  vacancyId: string;
  vacancyTitle: string;
  candidateName: string;
  email: string;
  phone: string;
  currentDesignation?: string;
  currentCompany?: string;
  highestQualification: string;
  totalExperienceYears: number;
  resumeUrl?: string;
  appliedDate: string;
  screeningStatus: 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'SELECTED' | 'OFFER_EXTENDED' | 'OFFER_ACCEPTED' | 'JOINED' | 'REJECTED';
  interviewFeedback?: string;
  interviewScore?: number;
  offerDate?: string;
  offeredSalary?: number;
  joiningDate?: string;
  remarks?: string;
}

export interface PromotionRecord {
  id: string;
  proposalNo: string; // e.g. "PROM-2026-0001"
  employeeId: string;
  employeeName: string;
  departmentName: string;
  currentDesignation: string;
  proposedDesignation: string;
  currentSalary: number;
  proposedSalary: number;
  effectiveDate: string;
  reason: string;
  evaluationScore?: number;
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
}

export interface SalaryIncrementRecord {
  id: string;
  incrementNo: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  currentSalary: number;
  incrementType: 'PERCENTAGE' | 'FLAT_AMOUNT';
  incrementValue: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface EmployeeTransferRecord {
  id: string;
  transferNo: string;
  employeeId: string;
  employeeName: string;
  fromInstituteId: string;
  fromInstituteName: string;
  fromDepartmentId: string;
  fromDepartmentName: string;
  fromDesignation: string;
  toInstituteId: string;
  toInstituteName: string;
  toDepartmentId: string;
  toDepartmentName: string;
  toDesignation: string;
  transferType: 'DEPARTMENT' | 'INSTITUTE' | 'ROLE' | 'LOCATION';
  effectiveDate: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface WorkloadTransferRecord {
  id: string;
  transferNo: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  workloadType: 'TEACHING_SUBJECT' | 'LAB_SESSION' | 'ADMIN_RESPONSIBILITY' | 'COMMITTEE_DUTY';
  subjectOrDutyName: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  reason: 'ON_LEAVE' | 'VACATION' | 'OFFICIAL_DUTY' | 'MEDICAL' | 'OTHER';
  status: 'ACTIVE' | 'RESTORED' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface EmployeeSeparationRecord {
  id: string;
  separationNo: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  departmentName: string;
  separationType: 'RESIGNATION' | 'RETIREMENT' | 'TERMINATION' | 'CONTRACT_END' | 'TRANSFERRED_OUT' | 'OTHER';
  resignationDate: string;
  noticePeriodDays: number;
  lastWorkingDay: string;
  reason: string;
  status: 'SUBMITTED' | 'APPROVED' | 'CLEARANCE_IN_PROGRESS' | 'SETTLEMENT_COMPLETED' | 'RELIEVED' | 'REJECTED';
  departmentClearance: boolean;
  departmentClearanceRemarks?: string;
  libraryClearance: boolean;
  assetClearance: boolean;
  itClearance: boolean;
  financeClearance: boolean;
  hrClearance: boolean;
  gratuityAmount?: number;
  leaveEncashmentAmount?: number;
  netSettlementAmount?: number;
  relievingLetterUrl?: string;
  experienceLetterUrl?: string;
  settledDate?: string;
  clearedBy?: string;
}

export interface EmployeeSelfServiceRequest {
  id: string;
  requestNo: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  requestType: 
    | 'LEAVE' 
    | 'ATTENDANCE_CORRECTION' 
    | 'WORK_FROM_HOME' 
    | 'ON_DUTY' 
    | 'LATE_ENTRY' 
    | 'EXPERIENCE_CERTIFICATE' 
    | 'NOC_REQUEST' 
    | 'SALARY_SLIP_COPY' 
    | 'ASSET_REQUISITION' 
    | 'TRANSFER_REQUEST' 
    | 'PROMOTION_REQUEST' 
    | 'PAYROLL_QUERY' 
    | 'OTHER';
  title: string;
  description: string;
  supportingDocUrl?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface HRAuditLogItem {
  id: string;
  timestamp: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: string;
  actionType: 
    | 'CREATE_EMPLOYEE' 
    | 'UPDATE_EMPLOYEE' 
    | 'ACTIVATE_LOGIN' 
    | 'ONBOARD_EMPLOYEE' 
    | 'RECORD_ATTENDANCE' 
    | 'APPROVE_LEAVE' 
    | 'PROCESS_PAYROLL' 
    | 'APPROVE_PAYROLL' 
    | 'UPLOAD_DOCUMENT' 
    | 'VERIFY_DOCUMENT' 
    | 'SUBMIT_APPRAISAL' 
    | 'ADD_TRAINING' 
    | 'PROCESS_PROMOTION' 
    | 'PROCESS_INCREMENT' 
    | 'TRANSFER_EMPLOYEE' 
    | 'TRANSFER_WORKLOAD' 
    | 'ASSIGN_ASSET' 
    | 'RETURN_ASSET' 
    | 'INITIATE_SEPARATION' 
    | 'COMPLETE_CLEARANCE' 
    | 'DEACTIVATE_EMPLOYEE' 
    | 'BULK_IMPORT';
  moduleName: string;
  entityId: string;
  entityName: string;
  details: string;
  previousValue?: string | Record<string, any>;
  newValue?: string | Record<string, any>;
  ipAddress?: string;
}

// ─── INCUBATION & STARTUP MANAGEMENT MODULE TYPES ────────────────────────────

export type StartupStage =
  | 'IDEA'
  | 'VALIDATION'
  | 'PROTOTYPE'
  | 'MVP'
  | 'EARLY_REVENUE'
  | 'GROWTH'
  | 'SCALING'
  | 'GRADUATED'
  | 'ALUMNI';

export type StartupSector =
  | 'EDTECH'
  | 'HEALTHTECH'
  | 'AGRITECH'
  | 'FINTECH'
  | 'CLEAN_ENERGY'
  | 'MANUFACTURING'
  | 'IOT_ROBOTICS'
  | 'AI_ML'
  | 'SOCIAL_IMPACT'
  | 'OTHER';

export type IncubationApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCREENING'
  | 'SCREENED'
  | 'COMMITTEE_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'INCUBATING'
  | 'GRADUATED'
  | 'WITHDRAWN';

export type FundingType =
  | 'SSIP_GOVT'
  | 'DST_NIDHI'
  | 'MSME_SCHEME'
  | 'ANGEL_INVESTMENT'
  | 'SEED_FUND'
  | 'VENTURE_CAPITAL'
  | 'GRANT'
  | 'BOOTSTRAP';

export interface StartupFounder {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'FACULTY' | 'EXTERNAL';
  studentId?: string;
  facultyId?: string;
  programId?: string;
  departmentId?: string;
  instituteId?: string;
  designation?: string; // For faculty/external founders
}

export interface StartupIdea {
  id: string;
  ideaCode: string; // e.g. "IDEA-2024-001"
  title: string;
  description: string;
  problemStatement: string;
  proposedSolution: string;
  targetMarket: string;
  sector: StartupSector;
  stage: StartupStage;
  founderIds: string[];
  leadFounderId: string;
  instituteId: string;
  departmentId: string;
  registeredDate: string;
  status: IncubationApplicationStatus;
  applicationStatus: IncubationApplicationStatus;
  screeningScore?: number;
  screeningRemarks?: string;
  committeeRemarks?: string;
  approvedByUserId?: string;
  approvedDate?: string;
  rejectionReason?: string;
  mentorId?: string;
  mentorName?: string;
  patentApplicationNo?: string;
  patentStatus?: 'NONE' | 'FILED' | 'PUBLISHED' | 'GRANTED';
  hasPrototype: boolean;
  hasProduct: boolean;
  fundingReceived: number;
  totalInvestment: number;
  annualRevenue: number;
  employeesCount: number;
  investorNames?: string;
  awards?: string;
  milestones: StartupMilestone[];
  documents: StartupDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface StartupMilestone {
  id: string;
  startupId: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  evidenceUrl?: string;
}

export interface StartupDocument {
  id: string;
  startupId: string;
  name: string;
  type: 'PITCH_DECK' | 'BUSINESS_PLAN' | 'PROTOTYPE_VIDEO' | 'IPR_CERT' | 'FUNDING_LETTER' | 'REGISTRATION_CERT' | 'OTHER';
  uploadedDate: string;
  fileUrl?: string;
  verified: boolean;
}

export interface StartupFunding {
  id: string;
  startupId: string;
  startupName: string;
  fundingType: FundingType;
  amount: number;
  currency: 'INR' | 'USD';
  source: string;
  receivedDate: string;
  status: 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  utilizationReport?: string;
}

export interface IncubationMentorSession {
  id: string;
  startupId: string;
  startupName: string;
  mentorId: string;
  mentorName: string;
  sessionDate: string;
  duration: number; // minutes
  agenda: string;
  notes: string;
  nextSteps: string;
  rating?: number; // 1-5 by founder
}

export interface IncubationWorkshop {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  conductedBy: string;
  topic: string;
  registeredStartupIds: string[];
  status: 'UPCOMING' | 'COMPLETED';
}

// ─── UNIVERSITY ORGANOGRAM & WORKFLOW DEFINITIONS ─────────────────────────
export type UniversityBranch = 
  | 'ACADEMIC' 
  | 'REGISTRAR' 
  | 'EXAMINATION' 
  | 'FINANCE' 
  | 'IQAC' 
  | 'TRAINING_PLACEMENT' 
  | 'ADMISSION' 
  | 'RESEARCH' 
  | 'IEDC' 
  | 'OPERATIONS';

export type OrganogramRole =
  | 'PRESIDENT'
  | 'VICE_PRESIDENT'
  | 'PROVOST'
  | 'REGISTRAR'
  | 'ACADEMIC_DEAN'
  | 'DIRECTOR_IQAC'
  | 'DIRECTOR_TP'
  | 'DIRECTOR_ADMISSION'
  | 'DIRECTOR_RESEARCH'
  | 'HEAD_IEDC'
  | 'DEAN_ASSOCIATE_DEAN'
  | 'HEAD_OF_INSTITUTE'
  | 'HEAD_OF_DEPARTMENT'
  | 'FACULTY'
  | 'FINANCE_OFFICER'
  | 'ACCOUNTANT'
  | 'CONTROLLER_OF_EXAMINATION'
  | 'DEPUTY_REGISTRAR_EXAM'
  | 'EXAM_STAFF'
  | 'IQAC_COORDINATOR'
  | 'GENERAL_MANAGER_TP'
  | 'PLACEMENT_EXECUTIVE'
  | 'TRAINER'
  | 'MANAGER_ADMISSION'
  | 'BDM'
  | 'BDE'
  | 'COUNSELLOR'
  | 'ASSOCIATE_DR'
  | 'RESEARCH_STAFF'
  | 'HR'
  | 'DEPUTY_ASSISTANT_REGISTRAR'
  | 'STUDENT_SECTION'
  | 'TRANSPORT_MANAGER'
  | 'HOSTEL_WARDEN'
  | 'ERP_COORDINATOR'
  | 'LIBRARIAN'
  | 'SPORT_EXECUTIVE';

// ─── DIGITAL NOTE SHEET & UNIVERSITY APPROVAL WORKFLOW ───────────────────────
export type NoteSheetStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_HOD'
  | 'PENDING_HOI'
  | 'PENDING_DEPUTY_REGISTRAR'
  | 'PENDING_REGISTRAR'
  | 'PENDING_FINANCE'
  | 'PENDING_EXAMINATION'
  | 'PENDING_STUDENT_SECTION'
  | 'PENDING_HOSTEL'
  | 'PENDING_IQAC'
  | 'PENDING_HR'
  | 'PENDING_FACULTY'
  | 'PENDING_VICE_PRESIDENT'
  | 'PENDING_HIGHER_AUTHORITY'
  | 'PENDING_APPROVAL'
  | 'FORWARDED'
  | 'CLARIFICATION_REQUIRED'
  | 'IN_CONSULTATION'
  | 'RESUBMITTED'
  | 'RETURNED'
  | 'APPROVED'
  | 'ACTION_PENDING'
  | 'ACTION_IN_PROGRESS'
  | 'ACTION_COMPLETED'
  | 'REJECTED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REOPENED'
  | 'COMPLETED';

export type NoteSheetPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'IMMEDIATE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type NoteSheetVisibility = 'NORMAL' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL';

export type NoteSheetAction =
  | 'CREATE'
  | 'SAVE_DRAFT'
  | 'SUBMIT'
  | 'APPROVE'
  | 'FORWARD'
  | 'RETURN'
  | 'REJECT'
  | 'REQUEST_CLARIFICATION'
  | 'PROVIDE_CLARIFICATION'
  | 'CONSULT'
  | 'RETURN_CONSULTATION'
  | 'TRANSFER'
  | 'RESUBMIT'
  | 'ADD_REMARK'
  | 'ACTION_ASSIGN'
  | 'ACTION_TAKEN'
  | 'COMPLIANCE_UPDATE'
  | 'REOPEN_REQUEST'
  | 'REOPEN_APPROVE'
  | 'CLOSE';

export interface NoteSheetMovement {
  id: string;
  noteSheetId: string;
  fromUser: string; // Name & Role
  fromUserId?: string;
  fromUserRole?: string;
  designation?: string;
  toUser: string; // Name & Role / Office
  toUserId?: string;
  toOffice?: string;
  toRole?: string;
  stage?: NoteSheetStatus;
  fromStage?: string;
  toStage?: string;
  action: NoteSheetAction;
  decision?: string;
  actorUserId?: string;
  actorName?: string;
  actorRole?: string;
  remarks: string;
  attachmentUrl?: string;
  approvalId?: string; // Digital Approval ID e.g. NS-APR-000001
  signatureSnapshot?: {
    signatureData?: string;
    signatureReference?: string;
    signatureVersion?: number;
    verifiedAt?: string;
  };
  date?: string;
  time?: string;
  timestamp: string;
}

export interface NoteSheetAttachmentItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  fileUrl: string;
  documentCategory?: 'Quotation' | 'Proposal' | 'Estimate' | 'Bill' | 'Approval Letter' | 'Comparative Statement' | 'Sanction Letter' | 'Purchase Document' | 'Official Letter' | 'Other Supporting Document' | string;
  version?: number;
  status?: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  uploadedByUserId?: string;
  uploadedByName?: string;
  uploadedByRole?: string;
  createdAt: string;
}

export interface NoteSheetEstimateItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface NoteSheetAmountRevision {
  id: string;
  notesheetId: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole | string;
  previousAmount: number;
  newAmount: number;
  changeAmount: number; // positive, negative, or zero
  changeType: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
  reason: string;
  workflowStage: string;
  createdAt: string;
}

export interface NoteSheetClarificationItem {
  id: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  query: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  status?: 'PENDING' | 'ANSWERED';
}

export interface NoteSheetConsultationItem {
  id: string;
  consultedOffice: string;
  consultedBy: string;
  consultedAt: string;
  reason: string;
  opinion?: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface NoteSheetComplianceItem {
  id: string;
  notesheetId: string;
  actionDescription: string;
  responsibleDept: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  deadline?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedAt?: string;
  remarks?: string;
  proofUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type NoteSheetAuditAction =
  | 'CREATE'
  | 'SAVE_DRAFT'
  | 'SUBMIT'
  | 'VIEW'
  | 'FORWARD'
  | 'APPROVE'
  | 'REJECT'
  | 'RETURN'
  | 'CLARIFICATION_REQUEST'
  | 'CLARIFICATION_RESPONSE'
  | 'RESUBMIT'
  | 'ACTION_START'
  | 'ACTION_COMPLETE'
  | 'CLOSE'
  | 'ATTACHMENT_UPLOAD'
  | 'ATTACHMENT_DELETE';

export interface NoteSheetAuditEntry {
  id: string;
  notesheetId: string;
  notesheetNumber: string;
  userId: string;
  userName: string;
  userRole: string;
  action: NoteSheetAuditAction;
  date: string;
  time: string;
  timestamp: string;
  remark: string;
  previousState?: string;
  newState?: string;
}

export type NoteSheetPermission =
  | 'NOTESHEET_VIEW'
  | 'NOTESHEET_CREATE'
  | 'NOTESHEET_EDIT'
  | 'NOTESHEET_SUBMIT'
  | 'NOTESHEET_REVIEW'
  | 'NOTESHEET_FORWARD'
  | 'NOTESHEET_APPROVE'
  | 'NOTESHEET_REJECT'
  | 'NOTESHEET_RETURN'
  | 'NOTESHEET_CLARIFICATION'
  | 'NOTESHEET_ACTION'
  | 'NOTESHEET_CLOSE'
  | 'NOTESHEET_REPORT';

export const ROLE_NOTESHEET_PERMISSIONS: Record<UserRole, NoteSheetPermission[]> = {
  SUPER_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  PRESIDENT: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  VICE_PRESIDENT: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  PROVOST: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  UNIVERSITY_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  REGISTRAR: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  DEPUTY_REGISTRAR: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_REPORT',
  ],
  PRINCIPAL: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_CLOSE',
    'NOTESHEET_REPORT',
  ],
  HOD: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  FACULTY: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_CLARIFICATION',
  ],
  MENTOR: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_CLARIFICATION',
  ],
  STUDENT_SECTION: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  EXAM_CELL: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  ACCOUNTS_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  HOSTEL_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  LIBRARY_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  TRANSPORT_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  MAINTENANCE_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  IQAC: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  HR_ADMIN: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_APPROVE',
    'NOTESHEET_REJECT',
    'NOTESHEET_RETURN',
    'NOTESHEET_CLARIFICATION',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  HR_OFFICER: [
    'NOTESHEET_VIEW',
    'NOTESHEET_CREATE',
    'NOTESHEET_EDIT',
    'NOTESHEET_SUBMIT',
    'NOTESHEET_REVIEW',
    'NOTESHEET_FORWARD',
    'NOTESHEET_ACTION',
    'NOTESHEET_REPORT',
  ],
  STUDENT_ADMIN: [],
  ERP_COORDINATOR: ['NOTESHEET_VIEW', 'NOTESHEET_REPORT'],
  STAFF: ['NOTESHEET_VIEW'],
  HOSTEL_WARDEN: ['NOTESHEET_VIEW', 'NOTESHEET_CREATE', 'NOTESHEET_SUBMIT'],
  SECURITY: ['NOTESHEET_VIEW'],
  STUDENT: [],
  PARENT: [],
};

export interface NoteSheet {
  id: string;
  notesheetNumber?: string; // e.g. SSIU/NS/2026/000001
  noteSheetNumber: string; // Auto-generated e.g., SIT-NOTESHEET-0826-001
  notesheetType?: string; // Administrative, Academic, Financial, Purchase, HR, Student Matter, Examination, Hostel, Infrastructure, IT / Technical, Maintenance, Event, Legal / Compliance, Other
  visibility?: NoteSheetVisibility;
  title?: string;
  subject: string;
  category?: string; // Academic, Administrative, Examination, Student Section, Accounts, HR, Infrastructure, Hostel, General, Other
  branch?: UniversityBranch;
  department?: string; // EXAM | HOSTEL | ACCOUNTS | ADMIN | ADMISSION | TRANSPORT | STUDENT_SECTION | LIBRARY | MAINTENANCE | IQAC | CSE | IT | etc.
  section?: string; // e.g. Conduct, Mess, Boys Hostel, Block A
  referenceNumber?: string; // External memo / circular ref
  referenceDate?: string;
  relatedModule?: string;
  relatedRecordId?: string;
  previousNoteSheetId?: string;
  previousNoteSheetNumber?: string;
  relatedNoteSheetIds?: string[];
  priority?: NoteSheetPriority;
  date: string;
  dueDate?: string;
  workflowDueDate?: string;
  isOverdue?: boolean;
  slaDays?: number;
  instituteId: string;
  instituteCode?: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  periodMMYY?: string; // e.g. 0826
  sequenceNumber?: number; // e.g. 1, 2, 3
  creatorId: string;
  creatorName: string;
  creatorRole?: string;
  contactNumber: string;
  description?: string;
  proposal: string;
  purposeJustification: string;
  financialRequirement?: boolean;
  budgetRequired: boolean;
  estimatedCost: number;
  amountInWords?: string;
  estimateDetails?: string;
  financialImpact?: string;
  currency?: string; // e.g. INR ₹
  expenseCategory?: 'CAPEX' | 'OPEX' | 'EVENT' | 'RESEARCH_EQUIPMENT' | 'SOFTWARE' | 'TRAVEL' | 'STATIONERY' | 'OTHER' | string;
  budgetHead?: string;
  budgetAvailable?: boolean;
  requestedAmount?: number;
  originalRequestedAmount?: number; // Initial permanent requested amount (never overwritten)
  currentAmount?: number; // Proposed amount at current workflow stage
  finalApprovedAmount?: number; // Final sanctioned amount by final terminal authority
  approvedAmount?: number;
  approvedAmountRemarks?: string;
  approvedAmountByUserId?: string;
  approvedAmountByName?: string;
  approvedAmountAt?: string;
  financialRevisionHistory?: NoteSheetAmountRevision[]; // Immutable chronological revision history
  financeRemarks?: string;
  procurementRequirement?: 'DIRECT_PAYMENT' | 'ADVANCE_DISBURSEMENT' | 'REIMBURSEMENT' | 'PURCHASE_ORDER' | 'NOT_APPLICABLE' | string;
  supportingFinancialDoc?: string;
  items?: NoteSheetEstimateItem[];
  subtotal?: number;
  additionalCharges?: number;
  discount?: number;
  totalEstimatedAmount?: number;
  vendorQuotation?: string;
  requiredDate: string;
  status: NoteSheetStatus;
  currentOffice: string; // HOD, HOI, DEAN, ACADEMIC_DEAN, REGISTRAR, FINANCE_OFFICER, CONTROLLER_OF_EXAMINATION, DIRECTOR_IQAC, DIRECTOR_TP, DIRECTOR_ADMISSION, DIRECTOR_RESEARCH, PROVOST, VICE_PRESIDENT, PRESIDENT, etc.
  currentStage?: string; // e.g. VICE_PRESIDENT_APPROVAL, REGISTRAR_APPROVAL
  currentAuthorityRole?: OrganogramRole | string;
  currentHandlerId?: string; // Current user ID responsible
  currentAssigneeUserId?: string;
  currentAssigneeName?: string;
  currentAssigneeRole?: string;
  organogramPath?: string[]; // Upward hierarchy chain
  consultationActive?: boolean;
  consultationHistory?: NoteSheetConsultationItem[];
  decision?: 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CLARIFICATION_REQUIRED';
  decisionDate?: string;
  decisionReason?: string;
  finalApprovalId?: string; // e.g. NS-APR-000001
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedByUserId?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  returnedByUserId?: string;
  returnedByName?: string;
  returnedAt?: string;
  actionAssignedToUserId?: string;
  actionTakenSummary?: string;
  actionTakenByUserId?: string;
  actionTakenByName?: string;
  actionTakenAt?: string;
  actionTakenProofUrl?: string;
  reopenedReason?: string;
  reopenedByUserId?: string;
  reopenedByName?: string;
  reopenedAt?: string;
  closedByUserId?: string;
  closedByName?: string;
  closedAt?: string;
  allocatedFundAccountId?: string;
  allocatedFundAccountName?: string;
  financialStatus?: 'NOT_ALLOCATED' | 'ALLOCATED' | 'ACTIVE' | 'SETTLED' | 'CLOSED';
  financialSummary?: NoteSheetFinancialSummary;
  inwardId?: string;
  inwardNumber?: string; // e.g. REG-IN-2026-000001
  inwardDate?: string;
  inwardStatus?: 'RECEIVED' | 'UNDER_PROCESS' | 'FORWARDED' | 'DISPATCHED' | 'COMPLETED';
  inwardReceivedBy?: string;
  inwardReceivedByName?: string;
  outwardId?: string;
  outwardNumber?: string; // e.g. REG-OUT-2026-000001
  outwardDate?: string;
  outwardStatus?: 'PREPARED' | 'DISPATCHED' | 'DELIVERED' | 'COMPLETED';
  outwardIssuedBy?: string;
  outwardIssuedByName?: string;
  outwardRecipient?: string;
  outwardDestination?: string;
  attachments: string[]; // List of file names/URLs
  attachmentObjects?: NoteSheetAttachmentItem[];
  clarifications?: NoteSheetClarificationItem[];
  complianceItems?: NoteSheetComplianceItem[];
  movements: NoteSheetMovement[];
  auditTrail?: NoteSheetAuditEntry[];
  verificationId?: string; // e.g. NSV-2026-000001
  finalApprovalDate?: string;
  digitalApprovalId?: string;
  approvals?: any[];
  isLocked?: boolean;
  documentHash?: string;
  dataHash?: string;
  amendmentReason?: string;
  amendedByUserId?: string;
  amendedByName?: string;
  amendedDate?: string;
  versionHistory?: NoteSheetVersionRecord[];
  version: number | string;
  lastReminderSentAt?: string;
  officerPendingSince?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSheetVersionRecord {
  version: string | number;
  notesheetId: string;
  noteSheetNumber: string;
  verificationId?: string;
  status: NoteSheetStatus;
  decision?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  amendmentReason?: string;
  changedByUserId: string;
  changedByName: string;
  changedByRole?: string;
  changedDate?: string;
  createdAt: string;
  snapshotData?: any;
}

export interface NoteSheetVerificationResult {
  valid: boolean;
  notesheetNumber?: string;
  verificationId?: string;
  status?: NoteSheetStatus | string;
  decision?: string;
  finalApprovalDate?: string;
  finalApprovalId?: string;
  instituteName?: string;
  departmentName?: string;
  subject?: string;
  approvedAmount?: number;
  inwardNumber?: string;
  inwardDate?: string;
  outwardNumber?: string;
  outwardDate?: string;
  version?: string | number;
  integrityStatus: 'VERIFIED_AUTHENTIC' | 'HASH_MISMATCH' | 'RECORD_NOT_FOUND' | 'INVALID_DATA';
  generatedAt?: string;
  dataHash?: string;
  message?: string;
}

export interface NoteSheetAnalyticsSummary {
  totalNotesheets: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  returnedCount: number;
  financialCount: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  avgTurnaroundHours: number;
  stageAvgHours: { stage: string; avgHours: number; count: number }[];
  pendingAgeing: {
    under2Days: number;
    twoToFiveDays: number;
    above5Days: number;
  };
  departmentWorkload: { department: string; count: number; pending: number }[];
  approverWorkload: { role: string; pending: number; processed: number }[];
  monthlyVolume: { month: string; created: number; approved: number }[];
  rejectionRate: number;
  returnRate: number;
}

export interface NoteSheetWorkflowLevel {
  level: number;
  role: string;
  roleLabel: string;
  isMandatory: boolean;
}

export interface NoteSheetWorkflowConfig {
  id: string;
  name: string;
  instituteId?: string;
  instituteName?: string;
  departmentId?: string;
  departmentName?: string;
  notesheetType?: string;
  financialRequired?: boolean;
  minAmount?: number;
  maxAmount?: number;
  approvalLevels?: NoteSheetWorkflowLevel[];
  steps: string[]; // Array of roles e.g., ['HOD', 'HOI', 'FINANCE_OFFICER', 'REGISTRAR', 'PROVOST']
  isActive: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// ACCOUNT / FUND MANAGEMENT MODULE TYPES
// ──────────────────────────────────────────────────────────────────────────────

export interface FundAccount {
  id: string;
  name: string;
  code: string;
  description?: string;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  currentBalance: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface FundSource {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface MoneyReceivedRecord {
  id: string;
  noteSheetId: string;
  noteSheetNumber: string;
  date: string;
  amount: number;
  source: string;
  paymentMode: PaymentMode;
  referenceNo: string;
  bankAccountId: string;
  bankAccountName: string;
  receivedBy: string;
  receivedById: string;
  remarks: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  noteSheetId: string;
  noteSheetNumber: string;
  date: string;
  category: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  vendor: string;
  invoiceNo: string;
  referenceNo?: string;
  paidFromAccountId: string;
  paidFromAccountName: string;
  paidBy: string;
  paidById: string;
  remarks?: string;
  invoiceUrl?: string;
  isApproved: boolean;
  approvedBy?: string;
  createdAt: string;
}

export interface ReimbursementClaim {
  id: string;
  noteSheetId: string;
  noteSheetNumber: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  expenseDate: string;
  amount: number;
  category: string;
  purpose: string;
  billAttachmentUrl?: string;
  submittedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  paymentReference?: string;
  paidFromAccountId?: string;
  remarks?: string;
}

export interface RefundRecord {
  id: string;
  noteSheetId: string;
  noteSheetNumber: string;
  date: string;
  amount: number;
  reason: string;
  returnedTo: string;
  paymentMode: PaymentMode;
  referenceNo: string;
  toAccountId: string;
  toAccountName: string;
  processedBy: string;
  processedById: string;
  remarks?: string;
  createdAt: string;
}

export type LedgerTransactionType = 'ALLOCATION' | 'MONEY_RECEIVED' | 'EXPENSE' | 'REIMBURSEMENT' | 'REFUND' | 'SETTLEMENT';

export interface AccountLedgerEntry {
  id: string;
  noteSheetId?: string;
  noteSheetNumber?: string;
  fundAccountId: string;
  fundAccountName: string;
  date: string;
  transactionId: string;
  transactionType: LedgerTransactionType;
  description: string;
  reference: string;
  moneyIn: number;
  moneyOut: number;
  balance: number;
  paymentMode: string;
  createdBy: string;
  createdById: string;
  createdAt: string;
}

export interface FinancialSettlement {
  id: string;
  noteSheetId: string;
  noteSheetNumber: string;
  settledDate: string;
  approvedBudget: number;
  totalReceived: number;
  totalSpent: number;
  totalReturned: number;
  finalBalance: number;
  utilizationPercent: number;
  unutilizedAmount: number;
  settledBy: string;
  settledById: string;
  isClosed: boolean;
  closureRemarks?: string;
  reopenedBy?: string;
  reopenedAt?: string;
}

export interface NoteSheetFinancialSummary {
  approvedBudget: number;
  totalReceived: number;
  totalSpent: number;
  totalReturned: number;
  balanceAvailable: number;
  utilizedPercentage: number;
  remainingPercentage: number;
  warningLevel: 'NORMAL' | 'WARNING' | 'HIGH_WARNING' | 'EXHAUSTED';
  isClosed: boolean;
}

export interface NoteSheetPdfRecord {
  pdfId: string;
  notesheetId: string;
  noteSheetNumber: string;
  fileName: string;
  version: number;
  fileSize: number;
  dataUrl?: string;
  storageReference?: string;
  generatedBy: {
    id: string;
    name: string;
    role: string;
  };
  generatedAt: string;
  notesheetStatusAtGeneration: string;
  dataHash: string;
}

export interface NoteSheetPdfResponse {
  success: boolean;
  notesheetId: string;
  noteSheetNumber: string;
  pdfId: string;
  downloadUrl: string;
  fileName: string;
  version: number;
  fileSize: number;
  generatedAt: string;
  status: string;
  isCached?: boolean;
}

// --- PHASE 1A: AI & SMART ACADEMIC ANALYTICS — ACADEMIC RISK PREDICTION TYPES ---

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AcademicRiskRecord {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  semesterId: string;
  semesterNumber: number;
  academicYearId: string;
  academicYearName: string;
  attendanceScore: number;   // 0-100 (higher = more risk)
  assignmentScore: number;   // 0-100
  examinationScore: number;  // 0-100
  engagementScore: number;   // 0-100
  riskScore: number;         // 0-100 composite
  riskLevel: RiskLevel;
  predictionReason: string;
  recommendedAction: string;
  lastCalculatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// PERSONAL WORK DIARY MODULE TYPES
// ──────────────────────────────────────────────────────────────────────────────

export type WorkDiaryCategory = 
  | 'ACADEMIC'
  | 'ADMINISTRATIVE'
  | 'MEETING'
  | 'EXAMINATION'
  | 'RESEARCH'
  | 'NAAC'
  | 'STUDENT_AFFAIRS'
  | 'GENERAL'
  | 'OTHER';

export type WorkDiaryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type WorkDiaryStatus = 'DRAFT' | 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface WorkDiaryEntry {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  workTitle: string;
  description?: string;
  category: WorkDiaryCategory;
  workDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  priority: WorkDiaryPriority;
  status: WorkDiaryStatus;
  relatedModule?: string;
  relatedPerson?: string;
  relatedDepartment?: string;
  relatedInstitute?: string;
  meetingDetails?: string;     // Attendees, agenda, decisions
  appointmentDetails?: string; // Visitor name, contact, outcome
  taskDetails?: string;        // Specific deliverables, action items
  remarks?: string;
  attachments?: string[];      // File paths or URLs
  createdAt: string;
  updatedAt: string;
}

export interface WorkDiaryFormData {
  workTitle: string;
  description: string;
  category: WorkDiaryCategory;
  workDate: string;
  startTime: string;
  endTime: string;
  priority: WorkDiaryPriority;
  status: WorkDiaryStatus;
  relatedModule: string;
  relatedPerson: string;
  relatedDepartment: string;
  relatedInstitute: string;
  meetingDetails: string;
  appointmentDetails: string;
  taskDetails: string;
  remarks: string;
  attachments: string[];
}

export interface WorkDiaryDashboardStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  todayCount: number;
}

// ─── HOSTEL & VISITOR ENTRY TYPES ──────────────────────────────────────────

export type HostelIdProofType = 
  | 'AADHAAR' 
  | 'PAN' 
  | 'DRIVING_LICENSE' 
  | 'PASSPORT' 
  | 'VOTER_ID' 
  | 'GOVT_ID' 
  | 'OTHER';

export type HostelVisitorStatus = 
  | 'REGISTERED' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'INSIDE' 
  | 'EXITED' 
  | 'COMPLETED' 
  | 'REJECTED';

export interface HostelRoom {
  id: string;
  blockName: string;
  roomNo: string;
  capacity: number;
  occupied: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
}

export interface HostelMaster {
  id: string;
  code: string;
  name: string;
  hostelType: 'STANDARD' | 'DELUXE' | 'INTERNATIONAL';
  gender: 'BOYS' | 'GIRLS' | 'CO_ED';
  building?: string;
  address?: string;
  location?: string;
  capacity: number;
  occupied?: number;
  wardenName?: string;
  wardenPhone?: string;
  wardenEmail?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface HostelRoomDetail {
  id: string;
  hostelId: string;
  hostelName?: string;
  block: string;
  floor: number;
  roomNumber: string;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SEATER' | 'OTHER' | 'AC' | 'NON_AC' | 'DELUXE';
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE' | 'BLOCKED';
  facilities?: string;
}

export interface HostelAllotmentDetail {
  id: string;
  allotmentNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  instituteName?: string;
  departmentName?: string;
  programName?: string;
  semester?: number | string;
  hostelId: string;
  hostelName: string;
  roomId: string;
  roomNumber: string;
  bedId: string;
  bedNumber: string;
  allottedDate: string;
  checkInDate?: string;
  expectedCheckout?: string;
  vacatedDate?: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'VACATED' | 'CANCELLED';
  remarks?: string;
}

export type HostelMaintenanceCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'FURNITURE'
  | 'AC_FAN'
  | 'WATER'
  | 'CLEANING'
  | 'INTERNET'
  | 'ROOM'
  | 'WASHROOM'
  | 'COMMON_AREA'
  | 'OTHER';

export type HostelMaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type HostelMaintenanceStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'REOPENED';

export interface HostelMaintenanceHistoryItem {
  id: string;
  requestId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedByUserId: string;
  performedByName?: string;
  performedByRole?: string;
  remarks?: string;
  timestamp: string;
}

export interface HostelMaintenanceAttachmentItem {
  id: string;
  requestId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  attachmentType: 'PROBLEM_PHOTO' | 'COMPLETION_PHOTO' | 'DOCUMENT';
  uploadedByUserId: string;
  uploadedByName?: string;
  uploadedByRole?: string;
  createdAt: string;
}

export interface HostelMaintenanceRequestItem {
  id: string;
  requestNo: string; // e.g. "HOST-MNT-2026-000001"
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  hostelId: string;
  hostelName: string;
  roomId?: string;
  roomNumber?: string;
  category: HostelMaintenanceCategory;
  title: string;
  description: string;
  priority: HostelMaintenancePriority;
  status: HostelMaintenanceStatus;
  photoUrl?: string;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  assignedByUserId?: string;
  assignedByName?: string;
  assignedAt?: string;
  expectedCompletionDate?: string;
  slaHours: number;
  slaDueDate?: string;
  isOverdue?: boolean;
  holdReason?: string;
  resolutionDetails?: string;
  resolvedAt?: string;
  resolvedPhotoUrl?: string;
  studentConfirmedAt?: string;
  studentRating?: number;
  studentFeedback?: string;
  reopenedReason?: string;
  reopenedAt?: string;
  closedAt?: string;
  closedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  history?: HostelMaintenanceHistoryItem[];
  attachments?: HostelMaintenanceAttachmentItem[];
}

export interface HostelVisitorEntry {
  id: string;
  passNumber: string; // e.g. "VIS/2026/0001"
  visitorName: string;
  mobileNumber: string;
  idProofType: HostelIdProofType;
  idProofNumber: string;
  visitorPhoto?: string;
  
  studentId?: string;
  studentName: string;
  enrollmentNumber: string;
  hostelBlock: string;
  roomNo: string;
  purpose: string;
  
  entryDate: string; // YYYY-MM-DD
  entryTime: string; // HH:mm
  expectedExitTime: string; // HH:mm
  actualExitDate?: string;
  actualExitTime?: string;
  
  status: HostelVisitorStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  remarks?: string;
  supportingDocument?: InwardOutwardDocument;
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface HostelVisitorDashboardStats {
  visitorsToday: number;
  currentlyInside: number;
  exited: number;
  pendingApproval: number;
  rejected: number;
  totalEntries: number;
}

// ─── STUDENT GATE PASS & HOSTEL OUTPASS TYPES ─────────────────────────────

export type GatePassStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ACTIVE' 
  | 'OUT' 
  | 'CHECKED_OUT'
  | 'CHECKED_IN'
  | 'RETURNED' 
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED' 
  | 'EXPIRED';

export type GatePassType = 
  | 'Day Out'
  | 'Night Out'
  | 'Home Visit'
  | 'Medical'
  | 'Emergency'
  | 'Personal'
  | 'Other';

export type GatePassPurpose = 
  | 'Day Out'
  | 'Night Out'
  | 'Home Visit'
  | 'Medical'
  | 'Emergency'
  | 'Personal'
  | 'Family Visit'
  | 'Academic'
  | 'Other';

export type GatePassTravelMode = 
  | 'Walking'
  | 'Two Wheeler'
  | 'Four Wheeler'
  | 'Public Transport'
  | 'Other';

export type GatePassTravelingWith = 
  | 'Alone'
  | 'Parent / Guardian'
  | 'Friend'
  | 'Other';

export interface GatePassAuditEntry {
  id: string;
  action: 
    | 'CREATED'
    | 'SUBMITTED' 
    | 'VIEWED' 
    | 'UNDER_REVIEW'
    | 'APPROVED' 
    | 'REJECTED' 
    | 'CANCELLED' 
    | 'QR_GENERATED'
    | 'QR_SCANNED'
    | 'OUT_RECORDED' 
    | 'CHECKED_OUT'
    | 'IN_RECORDED'
    | 'CHECKED_IN'
    | 'COMPLETED'
    | 'MARKED_OVERDUE';
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  remarks?: string;
  metadata?: string;
}

export interface StudentGatePass {
  id: string;
  requestNo: string; // e.g. "GP/2026/000001"
  gatePassNo: string; // Alias or same as requestNo e.g. "GP/2026/000001"
  studentId: string;
  studentName: string;
  enrollmentNo: string; // Primary Official University Student Identity
  studentPhoto?: string;
  instituteId?: string;
  instituteName?: string;
  departmentId?: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  semester?: string | number;
  hostelId: string;
  hostelName: string;
  block?: string;
  roomNo: string;
  bedNo: string;
  
  parentGuardianName: string;
  parentGuardianMobile: string;
  
  passType: GatePassType;
  purpose: GatePassPurpose | string;
  reason: string;
  destination: string;
  destinationAddress?: string;
  
  leavingDate: string; // YYYY-MM-DD
  leavingTime: string; // HH:mm
  expectedReturnDate: string; // YYYY-MM-DD
  expectedReturnTime: string; // HH:mm
  
  // Legacy / convenience date mapping
  outingDate: string; // YYYY-MM-DD
  expectedOutTime: string; // HH:mm
  
  travelMode?: GatePassTravelMode | string;
  modeOfTravel?: string;
  travelingWith?: GatePassTravelingWith | string;
  emergencyContact: string;
  
  studentRemarks?: string;
  attachment?: string;
  supportingDocument?: string;
  declarationAccepted: boolean;
  isEmergency?: boolean;
  priority?: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  
  status: GatePassStatus;
  qrToken?: string;
  qrCodeData?: string;
  
  // Warden Approval Details
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  wardenRemarks?: string;
  
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  
  // Security / Gate Check-Out Details
  actualOutDateTime?: string;
  actualCheckOutTime?: string;
  actualOutRecordedBy?: string;
  actualOutRecordedByName?: string;
  actualCheckOutStaff?: string;
  
  // Security / Gate Check-In Details
  actualInDateTime?: string;
  actualCheckInTime?: string;
  actualInRecordedBy?: string;
  actualInRecordedByName?: string;
  actualCheckInStaff?: string;
  isLateReturn?: boolean;
  
  // Cancellation details
  cancellationReason?: string;
  cancelledAt?: string;
  
  createdAt: string;
  updatedAt: string;
  
  history: GatePassAuditEntry[];
}


// ─── TRANSPORT MANAGEMENT & VEHICLE FLEET TYPES ───────────────────────────

export type VehicleType = 
  | 'BUS' 
  | 'MINI_BUS' 
  | 'VAN' 
  | 'AMBULANCE' 
  | 'CAR' 
  | 'UTILITY' 
  | 'OTHER';

export type VehicleStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'MAINTENANCE' 
  | 'DECOMMISSIONED';

export type VehicleDocumentType = 
  | 'REGISTRATION' 
  | 'INSURANCE' 
  | 'FITNESS' 
  | 'POLLUTION' 
  | 'PERMIT' 
  | 'OTHER';

export interface VehicleDocument {
  id: string;
  documentType: VehicleDocumentType;
  documentNumber?: string;
  name: string;
  url: string;
  size?: string;
  expiryDate?: string;
  uploadedAt: string;
}

export interface TransportVehicle {
  id: string;
  vehicleNumber: string; // e.g. "GJ-01-AB-1234"
  vehicleType: VehicleType;
  makeModel: string; // e.g. "Tata Starbus 40-Seater"
  capacity: number; // e.g. 50
  registrationNumber: string; // e.g. "GJ01AB1234"
  registrationDate: string; // YYYY-MM-DD
  
  // Insurance Details
  insuranceNumber: string;
  insuranceExpiry: string; // YYYY-MM-DD
  
  // Fitness Certificate
  fitnessCertificate: string;
  fitnessExpiry: string; // YYYY-MM-DD
  
  // Pollution Certificate (PUC)
  pollutionCertificate: string;
  pollutionExpiry: string; // YYYY-MM-DD
  
  // Permit Details
  permitNumber: string;
  permitExpiry: string; // YYYY-MM-DD
  
  status: VehicleStatus;
  remarks?: string;
  
  // Documents
  documents?: VehicleDocument[];
  
  assignedRoute?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  fuelType?: 'DIESEL' | 'CNG' | 'ELECTRIC' | 'PETROL';
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TransportVehicleDashboardStats {
  totalVehicles: number;
  active: number;
  inactive: number;
  documentsExpiring: number;
  inMaintenance: number;
}

export interface RouteStop {
  id: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  sequence: number;
  landmark?: string;
}

export type RouteStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface BusRoute {
  id: string;
  routeNo: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  stops: RouteStop[];
  pickupTime: string;
  dropTime: string;
  assignedVehicleNumber?: string;
  assignedDriverId?: string;
  assignedDriverName: string;
  assignedDriverPhone: string;
  capacity: number;
  assignedStudents: number;
  status: RouteStatus;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface TransportRouteDashboardStats {
  totalRoutes: number;
  active: number;
  inactive: number;
  totalCapacity: number;
  totalAssignedStudents: number;
}

export interface TransportExecutiveDashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  activeRoutes: number;
  studentsUsingTransport: number;
  documentsExpiring: number;
  vehicleUtilization: number;
  routeUtilization: number;
}



// ─── TRANSPORT DRIVER MANAGEMENT TYPES ────────────────────────────────────

export type DriverLicenseType = 
  | 'HMV' 
  | 'LMV' 
  | 'COMMERCIAL_HEAVY' 
  | 'TRANS' 
  | 'OTHER';

export type DriverStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'ON_LEAVE' 
  | 'SUSPENDED' 
  | 'TERMINATED';

export type DriverDocumentType = 
  | 'DRIVING_LICENSE' 
  | 'ID_PROOF' 
  | 'MEDICAL_FITNESS' 
  | 'POLICE_VERIFICATION' 
  | 'OTHER';

export interface DriverDocument {
  id: string;
  documentType: DriverDocumentType;
  documentNumber?: string;
  name: string;
  url: string;
  size?: string;
  expiryDate?: string;
  uploadedAt: string;
}

export interface TransportDriver {
  id: string;
  name: string;
  mobile: string;
  address: string;
  emergencyContact: string;
  emergencyContactRelation?: string;
  licenseNumber: string;
  licenseType: DriverLicenseType;
  licenseExpiry: string; // YYYY-MM-DD
  joiningDate: string; // YYYY-MM-DD
  status: DriverStatus;
  photo?: string;
  
  assignedVehicleNumber?: string;
  assignedRouteNo?: string;
  bloodGroup?: string;
  remarks?: string;
  documents?: DriverDocument[];
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TransportDriverDashboardStats {
  totalDrivers: number;
  active: number;
  inactive: number;
  onLeave: number;
  licensesExpiring: number;
}

// ─── CAMPUS SERVICES & AUXILIARY HUB TYPES ─────────────────────────────────

export type CampusServiceType =
  | 'Maintenance'
  | 'Electrical'
  | 'Plumbing'
  | 'Cleaning'
  | 'IT Support'
  | 'Furniture'
  | 'Security'
  | 'Transport'
  | 'Hostel'
  | 'Other';

export type CampusServicePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type CampusServiceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface CampusServiceResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isInternalNote?: boolean;
  statusChange?: CampusServiceStatus;
  createdAt: string;
}

export interface CampusServiceRequest {
  id: string;
  requestId: string;
  service: CampusServiceType;
  subject: string;
  description: string;
  location: string;
  priority: CampusServicePriority;
  
  // Attachments
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  
  // Requester Info
  requestedById: string;
  requestedByName: string;
  requestedByRole: string;
  requestedByEmail?: string;
  requestedByPhone?: string;
  requestedByEnrollmentOrEmpId?: string;
  departmentId?: string;
  departmentName?: string;
  instituteId?: string;
  instituteName?: string;
  
  // Assignment Info
  assignedToId?: string;
  assignedToName?: string;
  assignedToRole?: string;
  assignedToPhone?: string;
  assignedDate?: string;
  
  // Lifecycle & Status
  status: CampusServiceStatus;
  createdDate: string;
  resolvedDate?: string;
  closedDate?: string;
  resolutionRemarks?: string;
  
  // Communication & Response Handling Log
  responses: CampusServiceResponse[];
  
  // Ratings / Feedback if closed
  feedbackRating?: number;
  feedbackRemarks?: string;
  
  updatedAt: string;
}

export interface CampusServiceDashboardStats {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  rejected: number;
}

// ─── PHASE 6: CENTRALIZED BULK EXCEL IMPORT SYSTEM TYPES ──────────────────────

export type BulkImportType =
  | 'STUDENT'
  | 'FACULTY'
  | 'STAFF'
  | 'INSTITUTE'
  | 'DEPARTMENT'
  | 'PROGRAM'
  | 'ACADEMIC_YEAR'
  | 'SEMESTER'
  | 'SUBJECT'
  | 'INVENTORY_ASSET'
  | 'INVENTORY_CONSUMABLE'
  | 'HOSTEL_STUDENT'
  | 'HOSTEL_ROOM'
  | 'EXAM_FORM'
  | 'MARKS'
  | 'FEE_ASSIGNMENT'
  | 'TRANSPORT_VEHICLE'
  | 'TRANSPORT_DRIVER'
  | 'TRANSPORT_ROUTE';

export type ErpPermission =
  // Student Module
  | 'STUDENT_VIEW'
  | 'STUDENT_CREATE'
  | 'STUDENT_EDIT'
  | 'STUDENT_DELETE'
  | 'STUDENT_IMPORT'
  // Faculty Module
  | 'FACULTY_VIEW'
  | 'FACULTY_CREATE'
  | 'FACULTY_EDIT'
  | 'FACULTY_DELETE'
  | 'FACULTY_IMPORT'
  // Academic & Curriculum
  | 'INSTITUTE_MANAGE'
  | 'DEPARTMENT_MANAGE'
  | 'PROGRAM_MANAGE'
  | 'SUBJECT_MANAGE'
  | 'ATTENDANCE_MANAGE'
  | 'TIMETABLE_MANAGE'
  // Notesheet & Approvals
  | 'NOTESHEET_VIEW'
  | 'NOTESHEET_CREATE'
  | 'NOTESHEET_REVIEW'
  | 'NOTESHEET_APPROVE'
  | 'NOTESHEET_FORWARD'
  | 'NOTESHEET_REJECT'
  | 'APPROVAL_VIEW'
  | 'APPROVAL_SUBMIT'
  | 'APPROVAL_DECIDE'
  // Exams
  | 'EXAM_VIEW'
  | 'EXAM_MANAGE'
  | 'MARKS_ENTRY'
  | 'MARKS_APPROVE'
  // Finance & Accounts
  | 'FEE_VIEW'
  | 'FEE_MANAGE'
  | 'PAYMENT_COLLECT'
  // Campus & Admin Offices
  | 'HOSTEL_MANAGE'
  | 'TRANSPORT_MANAGE'
  | 'INVENTORY_MANAGE'
  | 'LIBRARY_MANAGE'
  | 'CAMPUS_SERVICE_MANAGE'
  | 'AUDIT_VIEW'
  | 'SETTINGS_MANAGE';

export type BulkImportPermission =
  | 'INSTITUTE_IMPORT'
  | 'STUDENT_IMPORT'
  | 'FACULTY_IMPORT'
  | 'STAFF_IMPORT'
  | 'DEPARTMENT_IMPORT'
  | 'PROGRAM_IMPORT'
  | 'ACADEMIC_IMPORT'
  | 'SUBJECT_IMPORT'
  | 'INVENTORY_IMPORT'
  | 'HOSTEL_IMPORT'
  | 'EXAM_IMPORT'
  | 'FINANCE_IMPORT'
  | 'TRANSPORT_IMPORT';

export const ROLE_BULK_IMPORT_PERMISSIONS: Record<UserRole, BulkImportPermission[]> = {
  SUPER_ADMIN: [
    'INSTITUTE_IMPORT', 'STUDENT_IMPORT', 'FACULTY_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT', 'HOSTEL_IMPORT', 'EXAM_IMPORT',
    'FINANCE_IMPORT', 'TRANSPORT_IMPORT'
  ],
  PRESIDENT: [
    'INSTITUTE_IMPORT', 'STUDENT_IMPORT', 'FACULTY_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT', 'HOSTEL_IMPORT', 'EXAM_IMPORT',
    'FINANCE_IMPORT', 'TRANSPORT_IMPORT'
  ],
  VICE_PRESIDENT: [
    'INSTITUTE_IMPORT', 'STUDENT_IMPORT', 'FACULTY_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT', 'HOSTEL_IMPORT', 'EXAM_IMPORT',
    'FINANCE_IMPORT', 'TRANSPORT_IMPORT'
  ],
  PROVOST: [
    'INSTITUTE_IMPORT', 'STUDENT_IMPORT', 'FACULTY_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT', 'HOSTEL_IMPORT', 'EXAM_IMPORT',
    'FINANCE_IMPORT', 'TRANSPORT_IMPORT'
  ],
  UNIVERSITY_ADMIN: [
    'INSTITUTE_IMPORT', 'STUDENT_IMPORT', 'FACULTY_IMPORT', 'STAFF_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT', 'HOSTEL_IMPORT', 'EXAM_IMPORT',
    'FINANCE_IMPORT', 'TRANSPORT_IMPORT'
  ],
  REGISTRAR: [
    'INSTITUTE_IMPORT', 'STUDENT_IMPORT', 'FACULTY_IMPORT', 'STAFF_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT'
  ],
  DEPUTY_REGISTRAR: [
    'STUDENT_IMPORT', 'FACULTY_IMPORT', 'STAFF_IMPORT'
  ],
  PRINCIPAL: [
    'STUDENT_IMPORT', 'FACULTY_IMPORT', 'STAFF_IMPORT', 'DEPARTMENT_IMPORT', 'PROGRAM_IMPORT',
    'ACADEMIC_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT'
  ],
  HOD: [
    'STUDENT_IMPORT', 'FACULTY_IMPORT', 'STAFF_IMPORT', 'SUBJECT_IMPORT', 'INVENTORY_IMPORT'
  ],
  STUDENT_SECTION: [
    'STUDENT_IMPORT'
  ],
  EXAM_CELL: [
    'EXAM_IMPORT', 'SUBJECT_IMPORT'
  ],
  ACCOUNTS_ADMIN: [
    'FINANCE_IMPORT'
  ],
  HOSTEL_ADMIN: [
    'HOSTEL_IMPORT', 'INVENTORY_IMPORT'
  ],
  TRANSPORT_ADMIN: [
    'TRANSPORT_IMPORT'
  ],
  MAINTENANCE_ADMIN: [
    'INVENTORY_IMPORT'
  ],
  LIBRARY_ADMIN: [
    'INVENTORY_IMPORT'
  ],
  IQAC: [
    'FACULTY_IMPORT', 'SUBJECT_IMPORT'
  ],
  STUDENT_ADMIN: [
    'STUDENT_IMPORT'
  ],
  HR_ADMIN: [
    'FACULTY_IMPORT',
    'STAFF_IMPORT'
  ],
  HR_OFFICER: [
    'FACULTY_IMPORT',
    'STAFF_IMPORT'
  ],
  ERP_COORDINATOR: [
    'STUDENT_IMPORT',
    'FACULTY_IMPORT',
    'STAFF_IMPORT',
    'INVENTORY_IMPORT'
  ],
  STAFF: [],
  HOSTEL_WARDEN: ['HOSTEL_IMPORT', 'INVENTORY_IMPORT'],
  SECURITY: [],
  FACULTY: [],
  MENTOR: [],
  STUDENT: [],
  PARENT: []
};

export const MODULE_TO_BULK_PERMISSION: Record<BulkImportType, BulkImportPermission> = {
  INSTITUTE: 'INSTITUTE_IMPORT',
  STUDENT: 'STUDENT_IMPORT',
  FACULTY: 'FACULTY_IMPORT',
  STAFF: 'STAFF_IMPORT',
  DEPARTMENT: 'DEPARTMENT_IMPORT',
  PROGRAM: 'PROGRAM_IMPORT',
  ACADEMIC_YEAR: 'ACADEMIC_IMPORT',
  SEMESTER: 'ACADEMIC_IMPORT',
  SUBJECT: 'SUBJECT_IMPORT',
  INVENTORY_ASSET: 'INVENTORY_IMPORT',
  INVENTORY_CONSUMABLE: 'INVENTORY_IMPORT',
  HOSTEL_ROOM: 'HOSTEL_IMPORT',
  HOSTEL_STUDENT: 'HOSTEL_IMPORT',
  EXAM_FORM: 'EXAM_IMPORT',
  MARKS: 'EXAM_IMPORT',
  FEE_ASSIGNMENT: 'FINANCE_IMPORT',
  TRANSPORT_VEHICLE: 'TRANSPORT_IMPORT',
  TRANSPORT_DRIVER: 'TRANSPORT_IMPORT',
  TRANSPORT_ROUTE: 'TRANSPORT_IMPORT'
};

export type BulkImportStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'READY'
  | 'CONFIRMED'
  | 'IMPORTED'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'PARTIALLY_IMPORTED'
  | 'FAILED'
  | 'CANCELLED';

export type BulkImportMode = 'INSERT_ONLY' | 'UPDATE_ONLY' | 'UPSERT';

export type BulkImportRowStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID'
  | 'DUPLICATE'
  | 'WARNING'
  | 'IMPORTED'
  | 'FAILED'
  | 'SKIPPED';

export interface BulkImportTemplateMeta {
  type: BulkImportType;
  name: string;
  fileName: string;
  description: string;
  headers: string[];
  requiredHeaders?: string[];
  moduleGroup?: string;
}

export interface BulkImportRowItem {
  id: string;
  rowNumber: number;
  status: BulkImportRowStatus;
  rawData: Record<string, any>;
  parsedData?: Record<string, any>;
  errorMessage?: string;
  errorField?: string;
  warningMessage?: string;
  targetId?: string;
  isExisting?: boolean;
}

export interface BulkImportHistoryItem {
  id: string;
  importId: string;
  action: string;
  performedByUserId: string;
  performedByName?: string;
  performedByRole?: string;
  details?: string;
  timestamp: string;
}

export interface BulkImportSession {
  id: string;
  importNo: string;
  importType: BulkImportType;
  fileName: string;
  fileSize?: number;
  uploadedByUserId: string;
  uploadedByName?: string;
  uploadedByRole?: string;
  instituteId?: string;
  departmentId?: string;
  status: BulkImportStatus;
  importMode: BulkImportMode;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  updatedRows?: number;
  failedRows: number;
  skippedRows?: number;
  validationSummary?: string;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
  history?: BulkImportHistoryItem[];
  rows?: BulkImportRowItem[];
}

// ─── PHASE 8 TRANSPORT MANAGEMENT TYPES ────────────────────────────────────

export interface StudentTransportAllocation {
  id: string;
  allotmentNo: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  semester?: number;
  routeId: string;
  routeName?: string;
  routeNumber?: string;
  stopId: string;
  stopName?: string;
  pickupTime?: string;
  dropTime?: string;
  vehicleId: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  academicYear: string;
  allocatedDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'TRANSFERRED';
  passNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TransportRequestType =
  | 'NEW_ALLOCATION'
  | 'ROUTE_CHANGE'
  | 'STOP_CHANGE'
  | 'TEMPORARY_REQUEST'
  | 'CANCELLATION';

export type TransportRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TransportRequestItem {
  id: string;
  applicationNo: string;
  studentId: string;
  studentName?: string;
  enrollmentNo?: string;
  routeId: string;
  routeName?: string;
  stopId: string;
  stopName?: string;
  requestType: TransportRequestType;
  academicYear: string;
  status: TransportRequestStatus;
  remarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type VehicleMaintenanceCategory =
  | 'ENGINE'
  | 'ELECTRICAL'
  | 'TYRES'
  | 'BRAKES'
  | 'BODY_WORK'
  | 'AC_COOLING'
  | 'SERVICE_ROUTINE'
  | 'OTHER';

export type VehicleMaintenancePriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type VehicleMaintenanceStatus = 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface VehicleMaintenanceItem {
  id: string;
  maintenanceNo: string;
  vehicleId: string;
  vehicleNumber?: string;
  issue: string;
  category: VehicleMaintenanceCategory;
  description?: string;
  priority: VehicleMaintenancePriority;
  reportedDate: string;
  assignedStaff?: string;
  estimatedCost?: number;
  actualCost?: number;
  notesheetId?: string;
  status: VehicleMaintenanceStatus;
  completedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TripType = 'PICKUP' | 'DROP' | 'SPECIAL_TRIP' | 'OTHER';
export type TripStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';

export interface TransportTripScheduleItem {
  id: string;
  tripNo: string;
  vehicleId: string;
  vehicleNumber?: string;
  routeId: string;
  routeName?: string;
  driverId?: string;
  driverName?: string;
  tripDate: string;
  shift?: string;
  startTime: string;
  endTime?: string;
  tripType: TripType;
  status: TripStatus;
  createdAt: string;
}

export type TransportReportType =
  | 'VEHICLE_LIST'
  | 'DRIVER_LIST'
  | 'VEHICLE_DOC_EXPIRY'
  | 'DRIVER_DOC_EXPIRY'
  | 'ROUTE_LIST'
  | 'ROUTE_STOPS'
  | 'STUDENT_ALLOCATION'
  | 'VEHICLE_CAPACITY'
  | 'DRIVER_ASSIGNMENT'
  | 'MAINTENANCE_REPORT'
  | 'TRIP_SCHEDULE'
  | 'TRANSPORT_REQUEST_REPORT';

// ─── PHASE 9: UNIVERSITY ACCOUNTS & FINANCE TYPES ─────────────────────────────

export type ReconciliationStatus = 'MATCHED' | 'PENDING' | 'MISMATCH' | 'RECONCILED';

export interface PaymentReconciliationItem {
  id: string;
  reconciliationNumber: string;
  paymentTransactionId?: string;
  gatewayPaymentId?: string;
  transactionRef?: string;
  studentId?: string;
  studentName?: string;
  enrollmentNo?: string;
  reconciliationType: 'GATEWAY' | 'BANK_TRANSFER' | 'MANUAL';
  gatewayAmount?: number;
  erpAmount?: number;
  discrepancyAmount?: number;
  paymentDate: string;
  paymentMode: string;
  gatewayStatus: string;
  erpStatus: string;
  reconciliationStatus: ReconciliationStatus;
  remarks?: string;
  reconciledByUserId?: string;
  reconciledByName?: string;
  reconciledAt?: string;
  createdAt: string;
}

export type ConcessionType = 'MERIT_SCHOLARSHIP' | 'NEED_BASED_CONCESSION' | 'SIBLING_DISCOUNT' | 'STAFF_WARD' | 'SPECIAL_WAIVER' | 'GOVERNMENT_SCHOLARSHIP';
export type ConcessionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export interface ConcessionItem {
  id: string;
  concessionNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  programName?: string;
  feeAccountId?: string;
  concessionType: ConcessionType;
  calculationType: 'FIXED' | 'PERCENTAGE';
  amount: number;
  percentage?: number;
  reason: string;
  approvedBy?: string;
  approvalDate?: string;
  status: ConcessionStatus;
  notesheetId?: string;
  createdAt: string;
}

export type RefundStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSED' | 'COMPLETED' | 'REJECTED';

export interface RefundItem {
  id: string;
  refundNumber: string;
  feeAccountId: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  refundMode: string;
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  processedDate?: string;
  refundReference?: string;
  status: RefundStatus;
  notesheetId?: string;
  createdAt: string;
}

export interface StudentLedgerEntry {
  id: string;
  date: string;
  type: 'FEE_ASSIGNED' | 'CONCESSION_APPLIED' | 'LATE_FEE_LEVIED' | 'PAYMENT_RECEIVED' | 'REFUND_PROCESSED' | 'ADJUSTMENT';
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StudentLedgerSummary {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  programName: string;
  semesterName: string;
  academicYear: string;
  openingBalance: number;
  totalFeesAssigned: number;
  totalConcessions: number;
  totalLateFees: number;
  totalPayments: number;
  totalRefunds: number;
  closingBalance: number;
  entries: StudentLedgerEntry[];
}

export type AccountsReportType =
  | 'DAILY_COLLECTION'
  | 'MONTHLY_COLLECTION'
  | 'FEE_HEAD_COLLECTION'
  | 'PENDING_FEES'
  | 'OVERDUE_FEES'
  | 'STUDENT_LEDGER'
  | 'PAYMENT_TRANSACTIONS'
  | 'FAILED_PAYMENTS'
  | 'REFUND_REPORT'
  | 'CONCESSION_REPORT'
  | 'INTERNATIONAL_STUDENT_REPORT'
  | 'INSTITUTE_COLLECTION'
  | 'DEPARTMENT_COLLECTION'
  | 'ACADEMIC_YEAR_COLLECTION';

export * from './studentRequest';
export * from './studentSection';
export * from './feeQuery';
export * from './mentorAssignment';
export * from './attendanceApproval';

// ──────────────────────────────────────────────────────────────────────────────
// UNIVERSITY INVENTORY, ASSET & STORAGE REGISTER MODULE TYPES
// ──────────────────────────────────────────────────────────────────────────────

export type InventoryCategoryGroup = 
  | 'IT_EQUIPMENT'
  | 'OFFICE_EQUIPMENT'
  | 'FURNITURE'
  | 'STATIONERY_CONSUMABLES'
  | 'PHYSICAL_RECORDS'
  | 'LAB_TECHNICAL'
  | 'FACILITY_ELECTRICAL';

export type AssetStatus = 
  | 'AVAILABLE'
  | 'ASSIGNED_TO_HOI'
  | 'ASSIGNED_TO_HOD'
  | 'ASSIGNED_TO_FACULTY'
  | 'ASSIGNED_TO_STAFF'
  | 'TRANSFER_REQUESTED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'UNDER_MAINTENANCE'
  | 'REPLACEMENT_REQUESTED'
  | 'DAMAGED'
  | 'LOST'
  | 'RETIRED'
  | 'DISPOSED'
  | 'ARCHIVED'
  | 'ACTIVE'
  | 'IN_STORE'
  | 'IN_STOCK'
  | 'ALLOCATED'
  | 'ASSIGNED'
  | 'IN_USE'
  | 'REPAIR'
  | 'MISSING'
  | 'TRANSFERRED'
  | 'RESERVED';

export type AssetCondition = 
  | 'NEW'
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'DAMAGED'
  | 'CRITICAL'
  | 'NON_FUNCTIONAL'
  | 'OBSOLETE';

export interface AssetCpuConfig {
  cpuAssetId?: string;
  processor: string; // e.g. Intel Core i7 12th Gen
  generation?: string;
  ram: string; // e.g. 16 GB DDR4
  ramType?: string;
  storageType?: string; // SSD / NVMe / HDD
  storageCapacity: string; // e.g. 512 GB SSD + 1 TB HDD
  ssdOrHdd?: string;
  graphics?: string; // Integrated / Dedicated 4GB RTX
  os: string; // Windows 11 Pro / Ubuntu 22.04 LTS
  monitorAssetId?: string;
  keyboardAssetId?: string;
  mouseAssetId?: string;
  ipAddress?: string;
  macAddress?: string;
  computerName?: string;
  warranty?: string;
  condition?: string;
}

export interface InventoryCategoryItem {
  id: string;
  code: string;
  name: string;
  categoryGroup: InventoryCategoryGroup;
  description?: string;
  isConsumable: boolean;
  usefulLifeYears?: number;
  depreciationRate?: number;
}

export interface InventoryLocationRecord {
  id: string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  building: string;
  block?: string;
  floor: string;
  roomNo: string;
  roomType: 'CLASSROOM' | 'LAB' | 'FACULTY_ROOM' | 'STORE_ROOM' | 'OFFICE' | 'ARCHIVE' | 'LIBRARY' | string;
  labName?: string;
  rackNumber?: string;
  shelfNumber?: string;
  drawerNumber?: string;
  boxNumber?: string;
  custodianName?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FixedAsset {
  id: string;
  assetTag: string; // e.g. SIT-CE-PC-0001, SIT-CE-MON-0001
  name: string;
  categoryId: string;
  categoryName: string;
  categoryGroup: InventoryCategoryGroup;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  locationId?: string;
  locationName?: string;
  building?: string;
  floor?: string;
  roomNo?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  assignedToEmpCode?: string;
  assignedToDesignation?: string;
  purchaseDate?: string;
  purchaseOrderNumber?: string;
  vendor?: string;
  invoiceNumber?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  purchaseCost: number;
  currentValue: number;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  assetCondition: AssetCondition;
  status: AssetStatus;
  usefulLifeYears?: number;
  depreciationRate?: number;
  cpuConfig?: AssetCpuConfig;
  qrCodeData?: string;
  remarks?: string;
  documents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetAssignmentRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  assignedToUserId?: string;
  assignedToName: string;
  assignedToEmpCode?: string;
  assignedToDesignation?: string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  location?: string;
  roomNo?: string;
  issueDate: string;
  expectedReturnDate?: string;
  returnDate?: string;
  conditionAtIssue: AssetCondition;
  conditionAtReturn?: AssetCondition;
  purpose?: string;
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED';
  remarks?: string;
  assignedByName?: string;
  createdAt: string;
}

export interface ConsumableItem {
  id: string;
  itemCode: string; // STN-A4, IT-LAN, STN-TONER
  name: string;
  categoryId: string;
  categoryName: string;
  categoryGroup: InventoryCategoryGroup;
  unit: 'PCS' | 'BOX' | 'PACKET' | 'REAM' | 'SET' | 'BOTTLE' | 'ROLL' | 'KG' | 'LITRE' | 'OTHER' | string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  locationName?: string;
  openingQuantity: number;
  receivedQuantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
  currentBalance: number;
  minimumStockLevel: number;
  reorderLevel: number;
  standardRate?: number;
  lastTransactionDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StockTransactionRecord {
  id: string;
  transactionNo: string; // STX-2026-000001
  itemId: string;
  itemCode: string;
  itemName: string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  transactionType: 'RECEIVE' | 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  vendorName?: string;
  purchaseOrderNo?: string;
  invoiceNo?: string;
  issuedToName?: string;
  issuedToEmpCode?: string;
  issuedToDeptName?: string;
  purpose?: string;
  approvedByName?: string;
  receivedByName?: string;
  batchNumber?: string;
  expiryDate?: string;
  remarks?: string;
  documentUrl?: string;
  transactionDate: string;
}

export interface PhysicalFileRecord {
  id: string;
  fileId: string; // e.g. SSIU-EXAM-2026-001, SIT-CE-NAAC-CR1-001
  fileNumber: string;
  fileName: string;
  fileCategory: 'STUDENT_FILES' | 'FACULTY_FILES' | 'ADMISSION_FILES' | 'EXAM_FILES' | 'FINANCE_FILES' | 'HR_FILES' | 'DEPT_FILES' | 'NAAC_IQAC_FILES' | 'RESEARCH_FILES' | 'EVENT_FILES' | 'OTHER' | string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  academicYear?: string;
  documentYear: number;
  storageLocation: string;
  rackNumber: string;
  shelfNumber: string;
  boxNumber: string;
  custodianName: string;
  custodianEmployeeId?: string;
  dateOpened: string;
  lastUpdated?: string;
  retentionUntil?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'TRANSFERRED' | 'DESTROYED';
  description?: string;
}

export interface AssetTransferRecord {
  id: string;
  transferNo?: string; // TRF-2026-000001
  assetMasterId?: string;
  assetId: string;
  assetTag?: string;
  assetName: string;
  quantity?: number;
  fromInstituteId?: string;
  fromInstituteName?: string;
  toInstituteId?: string;
  toInstituteName?: string;
  fromDeptId?: string;
  fromDeptName?: string;
  toDeptId?: string;
  toDeptName?: string;
  fromDepartmentId?: string;
  fromDepartmentName?: string;
  toDepartmentId?: string;
  toDepartmentName?: string;
  fromLocation?: string;
  toLocation?: string;
  fromCustodian?: string;
  toCustodian?: string;
  fromPersonId?: string;
  fromPersonName?: string;
  toPersonId?: string;
  toPersonName?: string;
  transferDate: string;
  transferredBy?: string;
  transferredByName?: string;
  authorizedByName?: string;
  receivedByName?: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AssetMaintenanceRecord {
  id: string;
  maintenanceNo?: string; // MNT-2026-000001
  assetMasterId?: string;
  assetId: string;
  assetTag?: string;
  assetName: string;
  maintenanceType?: 'PREVENTIVE' | 'CORRECTIVE' | 'BREAKDOWN' | 'AMC' | 'CALIBRATION' | string;
  serviceType?: 'PREVENTIVE' | 'CORRECTIVE' | 'UPGRADE' | 'WARRANTY_SERVICE' | 'REPAIR' | string;
  issueDescription: string;
  reportedByName?: string;
  reportedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  maintenanceDate?: string;
  nextServiceDate?: string;
  vendorTechnician?: string;
  vendor?: string;
  estimatedCost?: number;
  actualCost?: number;
  cost?: number;
  partsReplaced?: string;
  isUnderWarranty?: boolean;
  status: 'REPORTED' | 'ASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
  remarks?: string;
  documentUrl?: string;
  recordedBy?: string;
  completedAt?: string;
}

export interface PhysicalVerificationRecord {
  id: string;
  verificationNo: string; // PV-2026-000001
  assetId: string;
  assetTag: string;
  assetName: string;
  expectedLocation: string;
  actualLocation: string;
  expectedCustodian?: string;
  actualCustodian?: string;
  physicalCondition: AssetCondition;
  verifiedByName: string;
  verificationDate: string;
  status: 'VERIFIED' | 'NOT_FOUND' | 'DAMAGED' | 'LOCATION_MISMATCH' | 'CUSTODIAN_MISMATCH' | 'TRANSFER_REQUIRED';
  discrepancyNotes?: string;
  actionTaken?: string;
}

export interface AssetDisposalRecord {
  id: string;
  disposalNo: string; // DIS-2026-000001
  assetId: string;
  assetTag: string;
  assetName: string;
  disposalMethod: 'AUCTION' | 'SCRAPPED' | 'DONATED' | 'SOLD' | 'WRITTEN_OFF';
  disposalDate: string;
  bookValue: number;
  disposalValue: number;
  buyerName?: string;
  reason: string;
  approvedByName?: string;
  status: 'PROPOSED' | 'UNDER_APPROVAL' | 'APPROVED' | 'DISPOSED' | 'CANCELLED';
  remarks?: string;
  documentUrl?: string;
}

export interface InventoryAuditRecord {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'ASSIGN' | 'RETURN' | 'ISSUE' | 'RECEIVE' | 'TRANSFER' | 'MAINTENANCE' | 'VERIFY' | 'DISPOSE' | 'IMPORT' | 'EXPORT';
  module: 'ASSETS' | 'CONSUMABLES' | 'PHYSICAL_FILES' | 'LOCATIONS' | 'TRANSFERS';
  entityId: string;
  entityName: string;
  instituteName?: string;
  departmentName?: string;
  performedByName: string;
  performedByRole?: string;
  oldValueJson?: string;
  newValueJson?: string;
  remarks?: string;
  timestamp: string;
}

export interface AssetMovementRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  fromUserId?: string;
  fromUserName: string;
  fromRole: 'CENTRAL_STORE' | 'HOI' | 'HOD' | 'FACULTY' | 'STAFF' | string;
  toUserId?: string;
  toUserName: string;
  toRole: 'CENTRAL_STORE' | 'HOI' | 'HOD' | 'FACULTY' | 'STAFF' | string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  location: string;
  action: 'CENTRAL_DISPATCH' | 'HOI_ALLOCATION' | 'HOD_ASSIGNMENT' | 'FACULTY_TRANSFER' | 'RETURN_TO_STORE' | 'MAINTENANCE_DISPATCH' | 'REPLACEMENT' | 'DISPOSAL';
  reason?: string;
  conditionBefore: AssetCondition;
  conditionAfter: AssetCondition;
  approvedById?: string;
  approvedByName?: string;
  approvalDate?: string;
  remarks?: string;
  documentUrl?: string;
  timestamp: string;
}

export type AssetRequisitionType = 'NEW_ASSET' | 'ADDITIONAL_ASSET' | 'TEMPORARY_ASSET';

export type AssetRequisitionStatus = 
  | 'PENDING_HOD_APPROVAL'
  | 'APPROVED_BY_HOD'
  | 'REJECTED_BY_HOD'
  | 'PENDING_STORE_FULFILLMENT'
  | 'ASSIGNED'
  | 'CANCELLED';

export interface AssetRequestRecord {
  id: string;
  requestNo: string;
  requestedByUserId: string;
  requestedByName: string;
  requestedByEmpCode?: string;
  requestedByDesignation?: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName: string;
  requestType: AssetRequisitionType;
  categoryId: string;
  categoryName: string;
  assetNameRequirement: string;
  quantity: number;
  purpose: string;
  requiredFromDate: string;
  requiredUntilDate?: string;
  preferredLocation?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: AssetRequisitionStatus;
  remarks?: string;
  attachmentUrl?: string;
  hodId?: string;
  hodName?: string;
  hodAction?: 'APPROVED' | 'REJECTED';
  hodActionAt?: string;
  hodRejectionReason?: string;
  hodRemarks?: string;
  assignedAssetId?: string;
  assignedAssetTag?: string;
  assignedAssetName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetTransferRequestRecord {
  id: string;
  requestNo: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  departmentId: string;
  departmentName: string;
  reason: string;
  status: 'PENDING_HOD' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedDate: string;
  reviewedByHODId?: string;
  reviewedByHODName?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  remarks?: string;
}

export interface AssetReturnRequestRecord {
  id: string;
  requestNo: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  requestedByUserId: string;
  requestedByName: string;
  departmentId: string;
  departmentName: string;
  returnReason: string;
  conditionAtReturn: AssetCondition;
  remarks?: string;
  supportingPhoto?: string;
  status: 'PENDING_INSPECTION' | 'ACCEPTED' | 'REJECTED';
  requestedDate: string;
  inspectedByHODId?: string;
  inspectedByHODName?: string;
  inspectedDate?: string;
  inspectionRemarks?: string;
}

export interface AssetReplacementRequestRecord {
  id: string;
  requestNo: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  requestedByUserId: string;
  requestedByName: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName: string;
  reason: string;
  problemDescription: string;
  currentCondition: AssetCondition;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  supportingDocument?: string;
  remarks?: string;
  status: 'PENDING_HOD' | 'ESCALATED_TO_HOI' | 'APPROVED' | 'REJECTED' | 'REPLACED';
  requestedDate: string;
  hodReviewDate?: string;
  hodReviewRemarks?: string;
  hoiApprovedById?: string;
  hoiApprovedByName?: string;
  hoiApprovalDate?: string;
  hoiRemarks?: string;
  replacementAssetTag?: string;
}

export interface AssetIssueReportRecord {
  id: string;
  reportNo: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  reportedByUserId: string;
  reportedByName: string;
  departmentId: string;
  departmentName: string;
  issueType: 'DAMAGED' | 'NOT_WORKING' | 'MISSING_PART' | 'TECHNICAL_PROBLEM' | 'PHYSICAL_DAMAGE' | 'LOST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'REPORTED' | 'UNDER_REVIEW' | 'SENT_TO_MAINTENANCE' | 'MARKED_DAMAGED' | 'REPLACEMENT_INITIATED' | 'RESOLVED';
  reportedDate: string;
  hodActionRemarks?: string;
  resolvedDate?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// REGISTRAR OFFICE MANAGEMENT SYSTEM TYPES
// ──────────────────────────────────────────────────────────────────────────────

export type CorrespondenceType = 'INCOMING' | 'OUTGOING' | 'CIRCULAR' | 'EXTERNAL_GOV';

export interface OfficialCorrespondenceRecord {
  id: string;
  correspondenceType: CorrespondenceType;
  referenceNumber: string; // e.g. SSIU/REG/IN/2026/042
  date: string;
  senderOrRecipient: string;
  subject: string;
  instituteId?: string;
  instituteName?: string;
  departmentId?: string;
  departmentName?: string;
  category: 'UGC' | 'AICTE' | 'GOV_GUJARAT' | 'AFFILIATION' | 'ACADEMIC' | 'GENERAL' | string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'DISPATCHED' | 'ACTION_TAKEN' | 'CLOSED';
  receivedOrPreparedByName?: string;
  approvedByName?: string;
  attachmentUrl?: string;
  actionTaken?: string;
  remarks?: string;
  createdAt: string;
}

export interface FileMovementRecord {
  id: string;
  fileNumber: string; // e.g. SSIU/REG/FILE/2026/019
  subject: string;
  currentHolder: string;
  fromOffice: string;
  toOffice: string;
  sentDate: string;
  receivedDate?: string;
  actionRequired: string;
  status: 'IN_TRANSIT' | 'RECEIVED' | 'ACTIONED' | 'ARCHIVED';
  remarks?: string;
  createdAt: string;
}

export interface CommitteeMasterRecord {
  id: string;
  code: string; // e.g. BOG, AC, SYNDICATE, ARC, GRC
  name: string;
  type: 'STATUTORY' | 'STANDING' | 'AD_HOC' | 'APPELLATE';
  chairpersonName: string;
  memberSecretary: string;
  members: {
    id: string;
    name: string;
    designation: string;
    affiliation: string;
    role: 'CHAIRPERSON' | 'MEMBER_SECRETARY' | 'INTERNAL_MEMBER' | 'EXTERNAL_EXPERT';
  }[];
  tenureYears: number;
  establishedDate: string;
  status: 'ACTIVE' | 'DORMANT' | 'RECONSTITUTED';
}

export interface CommitteeMeetingRecord {
  id: string;
  committeeId: string;
  committeeName: string;
  meetingNumber: string; // e.g. AC/2026/01
  meetingDate: string;
  venue: string;
  agenda: string;
  momText?: string;
  attendanceCount: number;
  status: 'SCHEDULED' | 'CONCLUDED' | 'MOM_CIRCULATED' | 'ADJOURNED';
}

export interface CommitteeActionItemRecord {
  id: string;
  meetingId: string;
  committeeName: string;
  meetingNumber: string;
  itemNumber: string;
  description: string;
  responsibleDepartment: string;
  responsiblePerson: string;
  deadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  complianceRemarks?: string;
  completedAt?: string;
}

export interface StatutoryApprovalRecord {
  id: string;
  requestNo: string; // e.g. SSIU/REG/APPR/2026/001
  title: string;
  category: 'AFFILIATION' | 'PROGRAM_SANCTION' | 'FACULTY_APPOINTMENT' | 'CURRICULUM' | 'BUDGET' | 'SPECIAL' | string;
  applicantEntity: string;
  instituteId?: string;
  instituteName?: string;
  departmentId?: string;
  departmentName?: string;
  submittedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | 'FORWARDED';
  actionedByUserId?: string;
  actionedByName?: string;
  actionedAt?: string;
  remarks?: string;
}

export interface InternationalStudentRecord {
  id: string;
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  country: string;
  passportNumber: string;
  visaNumber: string;
  visaExpiryDate: string;
  frroRegistrationNo: string;
  frroStatus: 'VALID' | 'PENDING_RENEWAL' | 'EXPIRED';
  embassyNocStatus: 'RECEIVED' | 'PENDING';
  instituteName: string;
  programName: string;
  currentSemester: number;
}

// ─── DEPUTY REGISTRAR INSTITUTIONAL & DEPARTMENTAL SCOPE MAPPING ───────────
export type DeputyRegistrarScopeLevel = 
  | 'UNIVERSITY'
  | 'INSTITUTE'
  | 'DEPARTMENT'
  | 'MULTI_INSTITUTE'
  | 'MULTI_DEPARTMENT';

export type DeputyRegistrarScopeStatus = 
  | 'ACTIVE' 
  | 'SUSPENDED' 
  | 'REVOKED' 
  | 'INACTIVE';

export interface DeputyRegistrarScopeMapping {
  id: string;
  userId: string;
  userName?: string;
  employeeId?: string;
  userEmail?: string;
  designation?: string;
  instituteId: string;
  instituteCode?: string;
  instituteName?: string;
  departmentIds: string[];
  departmentNames?: string[];
  scopeLevel?: DeputyRegistrarScopeLevel;
  effectiveFrom?: string;
  effectiveTo?: string;
  reason?: string;
  assignedByUserId: string;
  assignedByName?: string;
  assignedByRole?: string;
  assignedBy?: string;
  assignedAt?: string;
  revokedByUserId?: string;
  revokedByName?: string;
  revokedAt?: string;
  revokeReason?: string;
  isUniversalInstituteScope?: boolean;
  status: DeputyRegistrarScopeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeputyRegistrarScopeAudit {
  id: string;
  scopeId?: string;
  userId: string;
  userName: string;
  employeeId?: string;
  instituteId: string;
  instituteName?: string;
  departmentId?: string;
  departmentName?: string;
  oldScope?: string;
  newScope?: string;
  action: 'ASSIGNED' | 'REMOVED' | 'UPDATED' | 'TRANSFERRED' | 'REVOKED' | 'SUSPENDED' | 'REACTIVATED';
  reason?: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedByRole: string;
  timestamp: string;
  details?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── UNIVERSITY ASSET MANAGEMENT & DEPARTMENT-WISE ALLOCATION TYPES ─────────
// ══════════════════════════════════════════════════════════════════════════════

export type AssetCategory = 
  | 'FURNITURE'
  | 'IT_ELECTRONICS'
  | 'CLASSROOM'
  | 'LABORATORY'
  | 'OFFICE'
  | 'SPORTS'
  | 'LIBRARY'
  | 'EVENT_CULTURAL'
  | 'NETWORKING'
  | 'SAFETY'
  | 'VEHICLES'
  | 'MISCELLANEOUS';



export interface UniversityAsset {
  id: string;
  assetId: string; // Unique e.g. SSIU-PC-2026-00125
  name: string;
  category: AssetCategory;
  subCategory: string;
  brand?: string;
  model?: string;
  serialNumber?: string; // Unique for serialized assets
  assetTag?: string;
  isSerialized: boolean;
  totalQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  purchaseDate: string;
  purchaseCost: number;
  vendor?: string;
  invoiceNumber?: string;
  fundingSource?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  warrantyProvider?: string;
  warrantyNumber?: string;
  condition: AssetCondition;
  status: AssetStatus;
  instituteId?: string;
  departmentId?: string;
  currentInstituteId?: string;
  currentDepartmentId?: string;
  building?: string;
  floor?: string;
  room?: string;
  labId?: string;
  classroomId?: string;
  officeName?: string;
  assignedPersonType?: 'FACULTY' | 'STAFF' | 'DEPARTMENT' | 'LAB' | 'CLASSROOM' | 'OFFICE' | 'STORE';
  assignedPersonId?: string; // Uses existing Faculty Master ID / User ID
  assignedPersonName?: string;
  assignedDate?: string;
  allottedDate?: string;
  qrCodeData?: string;
  image?: string;
  documents?: { name: string; url: string; type: string }[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDepartmentAllocation {
  id: string;
  assetMasterId: string;
  assetId: string; // SSIU-PC-2026-00125
  assetName: string;
  category: AssetCategory;
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  allocatedQuantity: number;
  building?: string;
  floor?: string;
  room?: string;
  labId?: string;
  labName?: string;
  classroomId?: string;
  classroomName?: string;
  officeName?: string;
  assignedPersonId?: string;
  assignedPersonName?: string;
  allocatedAt: string;
  allocatedBy: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'RETURNED' | 'UNDER_MAINTENANCE' | 'DISPOSED';
  remarks?: string;
}



export interface AssetReturnRecord {
  id: string;
  assetMasterId: string;
  assetId: string;
  assetName: string;
  quantity: number;
  fromDepartmentId: string;
  fromDepartmentName: string;
  returnedBy: string;
  receivedBy: string;
  returnDate: string;
  condition: AssetCondition;
  remarks?: string;
}



export interface AssetAllocationRequest {
  id: string;
  requestNo: string; // e.g. REQ-ASSET-2026-0001
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName?: string;
  category: AssetCategory;
  subCategory: string;
  requestedQuantity: number;
  specifications?: string;
  justification: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  targetLocation?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ALLOCATED' | 'REJECTED';
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  allocatedAssetMasterIds?: string[];
  allocatedQuantity?: number;
}

export interface AssetHistoryEvent {
  id: string;
  assetMasterId: string;
  assetId: string;
  actionType: 
    | 'CREATED'
    | 'PURCHASED'
    | 'ALLOCATED'
    | 'TRANSFERRED'
    | 'ASSIGNED'
    | 'RETURNED'
    | 'MAINTENANCE_LOGGED'
    | 'REPAIRED'
    | 'DAMAGED'
    | 'LOST'
    | 'RECOVERED'
    | 'DISPOSED'
    | 'BULK_IMPORTED';
  actorName: string;
  actorRole: string;
  timestamp: string;
  previousDepartment?: string;
  newDepartment?: string;
  previousLocation?: string;
  newLocation?: string;
  previousPerson?: string;
  newPerson?: string;
  previousStatus?: string;
  newStatus?: string;
  quantity?: number;
  reason?: string;
  remarks?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── UNIVERSITY RESOURCE ALLOCATION (CLASSROOMS, LABS, FACULTY, SUBJECTS) ───
// ══════════════════════════════════════════════════════════════════════════════

export type InstitutionalResourceType = 
  | 'CLASSROOM'
  | 'LABORATORY'
  | 'SEMINAR_HALL'
  | 'COMPUTER_LAB'
  | 'SMART_CLASSROOM'
  | 'WORKSHOP'
  | 'AUDITORIUM'
  | 'DEPARTMENT_OFFICE'
  | 'EQUIPMENT'
  | 'OTHER';

export interface InstitutionalResource {
  id: string; // Unique resource ID
  resourceCode: string; // e.g. A-101, LAB-CSE-1, SEM-HALL-1
  name: string;
  type: InstitutionalResourceType;
  instituteId: string;
  instituteName?: string;
  departmentId?: string; // Optional default home department
  departmentName?: string;
  building: string;
  floor: string;
  roomNumber: string;
  capacity: number;
  labType?: string; // e.g. 'Software Lab', 'IoT & Embedded Systems', 'Hardware Lab'
  computerCount?: number;
  projectorAvailable: boolean;
  smartBoardAvailable: boolean;
  airConditioned: boolean;
  softwareInstalled?: string[];
  equipmentList?: string[];
  status: 'AVAILABLE' | 'ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'MAINTENANCE' | 'INACTIVE';
  remarks?: string;
}

export interface ClassroomAllocation {
  id: string;
  academicYearId: string;
  academicYearCode: string;
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  programId: string;
  programName?: string;
  semesterId: string;
  semesterName?: string;
  divisionId: string;
  divisionName?: string;
  resourceId: string;
  roomNumber: string;
  building: string;
  floor: string;
  capacity: number;
  dayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'ALL';
  timeSlot?: string; // e.g. "09:00 AM - 10:00 AM" or "FULL_SEMESTER"
  effectiveFrom: string;
  effectiveTo: string;
  status: 'ALLOCATED' | 'RELEASED' | 'TRANSFERRED';
  allocatedBy: string;
  allocatedAt: string;
  remarks?: string;
}

export interface LaboratoryAllocation {
  id: string;
  academicYearId: string;
  academicYearCode: string;
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  programId: string;
  programName?: string;
  semesterId: string;
  semesterName?: string;
  divisionId: string;
  divisionName?: string;
  resourceId: string;
  labName: string;
  roomNumber: string;
  building: string;
  floor: string;
  capacity: number;
  labType: string;
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  computerCount?: number;
  softwareAvailability?: string[];
  equipmentAvailability?: string[];
  dayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'ALL';
  timeSlot?: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'ALLOCATED' | 'RELEASED' | 'TRANSFERRED';
  allocatedBy: string;
  allocatedAt: string;
  remarks?: string;
}

export interface FacultyAllocation {
  id: string;
  facultyId: string; // Uses existing Faculty Master ID
  facultyName: string;
  employeeCode?: string;
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  programId: string;
  programName?: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  semesterId: string;
  semesterName?: string;
  divisionId: string;
  divisionName?: string;
  academicYearId: string;
  academicYearCode: string;
  teachingLoad: number; // Hours per week
  theoryHours: number;
  practicalHours: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'ACTIVE' | 'RELEASED' | 'TRANSFERRED';
  allocatedBy: string;
  allocatedAt: string;
  remarks?: string;
}

export interface SubjectAllocation {
  id: string;
  subjectId: string; // Uses existing Subject Master
  subjectName: string;
  subjectCode: string;
  credits: number;
  theoryHours: number;
  practicalHours: number;
  academicYearId: string;
  academicYearCode: string;
  instituteId: string;
  departmentId: string;
  departmentName?: string;
  programId: string;
  programName?: string;
  semesterId: string;
  semesterName?: string;
  divisionId: string;
  divisionName?: string;
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  classroomId?: string;
  classroomName?: string;
  laboratoryId?: string;
  laboratoryName?: string;
  status: 'ALLOCATED' | 'PENDING_FACULTY' | 'INACTIVE';
  allocatedBy: string;
  allocatedAt: string;
}

export interface DepartmentResourceAllocation {
  id: string;
  resourceType: 'CLASSROOM' | 'LAB' | 'FACULTY' | 'EQUIPMENT' | 'COMPUTERS' | 'PROJECTORS' | 'SMART_BOARDS' | 'FURNITURE' | 'SEMINAR_HALL' | 'OTHER';
  resourceName: string;
  instituteId: string;
  instituteName?: string;
  departmentId: string;
  departmentName?: string;
  quantity: number;
  allocationDate: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ALLOCATED' | 'PARTIAL' | 'RELEASED' | 'TRANSFERRED';
  allocatedBy: string;
  remarks?: string;
}

export interface AllocationRequest {
  id: string;
  requestNo: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  resourceType: 'CLASSROOM' | 'LAB' | 'FACULTY' | 'COMPUTERS' | 'EQUIPMENT' | 'FURNITURE' | 'OTHER';
  requestedItem: string;
  quantity: number;
  justification: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ALLOCATED' | 'REJECTED';
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  allocatedResourceId?: string;
}

export interface AllocationConflict {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'CLASSROOM' | 'LABORATORY' | 'FACULTY' | 'SUBJECT' | 'DIVISION';
  conflictType: 
    | 'CLASSROOM_DOUBLE_BOOKING'
    | 'LAB_DOUBLE_BOOKING'
    | 'FACULTY_DOUBLE_BOOKING'
    | 'DIVISION_SCHEDULE_CLASH'
    | 'CAPACITY_OVERFLOW';
  academicYear: string;
  dayOfWeek?: string;
  timeSlot?: string;
  conflictingEntities: string[];
  description: string;
  severity: 'CRITICAL' | 'WARNING';
  suggestedResolution: string;
  detectedAt: string;
}

export interface AllocationHistoryRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  academicYear: string;
  previousDepartment?: string;
  newDepartment: string;
  previousAcademicPlacement?: string;
  newAcademicPlacement: string;
  changedBy: string;
  dateTime: string;
  actionType: 'ALLOCATED' | 'TRANSFERRED' | 'RELEASED' | 'EDITED';
  reason?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTESHEET MANUAL TESTING & QA VERIFICATION TYPES
// ══════════════════════════════════════════════════════════════════════════════
export type ManualTestType = 
  | 'Manual' 
  | 'Functional' 
  | 'UI' 
  | 'Workflow' 
  | 'Validation' 
  | 'RBAC' 
  | 'Regression' 
  | 'Other';

export type ManualTestStatus = 
  | 'Pending' 
  | 'Pass' 
  | 'Fail' 
  | 'Blocked' 
  | 'Retest Required'
  | 'Fixed';

export type ManualTestPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ManualTestHistoryEntry {
  id: string;
  previousStatus: ManualTestStatus;
  newStatus: ManualTestStatus;
  changedBy: string;
  changedDate: string;
  remarks: string;
}

export interface ManualTestRecord {
  id: string;
  testId: string;
  module: string;
  feature: string;
  testScenario: string;
  testType: ManualTestType;
  expectedResult: string;
  actualResult: string;
  status: ManualTestStatus;
  priority: ManualTestPriority;
  testedBy: string;
  testDate: string;
  remarks?: string;
  bugIssue?: string;
  fixStatus?: 'Open' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed' | 'N/A';
  retestResult?: string;
  lastUpdated: string;
  history: ManualTestHistoryEntry[];
  notesheetId?: string;
  notesheetNumber?: string;
}

export * from './studentDataChangeRequest';
export * from './studentMapping';
export * from './registrarOffice';

// ==============================================================================
// SSIU ERP — RELATIONAL FOUNDATION & MASTER DATA MODELS (PHASE 1)
// ==============================================================================

export interface UserOrganizationScope {
  id: string;
  userId: string;
  organizationType: 'UNIVERSITY' | 'INSTITUTE' | 'DEPARTMENT' | 'PROGRAM';
  organizationId: string;
  roleId: UserRole | string;
  isActive: boolean;
  validFrom: string;
  validTo?: string;
  assignedByUserId?: string;
  createdAt: string;
}

export interface MentorAssignmentRecord {
  id: string;
  mentorId: string;
  mentorName?: string;
  studentId: string;
  studentName?: string;
  programId: string;
  departmentId: string;
  instituteId: string;
  academicYearId: string;
  semesterId?: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED';
  assignedByUserId: string;
  createdAt: string;
}

export interface HODAssignmentRecord {
  id: string;
  hodId: string;
  hodName: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'RELIEVED';
  appointedByUserId: string;
  createdAt: string;
}

export interface HOIAssignmentRecord {
  id: string;
  hoiId: string;
  hoiName: string;
  instituteId: string;
  instituteName: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'RELIEVED';
  appointedByUserId: string;
  createdAt: string;
}

export interface FacultySubjectAllocationRecord {
  id: string;
  facultyId: string;
  facultyName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  programId: string;
  departmentId: string;
  instituteId: string;
  semesterId: string;
  academicYearId: string;
  divisionId?: string;
  workloadHoursPerWeek: number;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
}

export interface FacultyWorkloadRecord {
  id: string;
  facultyId: string;
  subjectId: string;
  programId: string;
  departmentId: string;
  instituteId: string;
  semesterId: string;
  academicYearId: string;
  hours: number;
  workloadType: 'THEORY' | 'PRACTICAL' | 'TUTORIAL' | 'LAB' | 'ADMINISTRATIVE';
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface AssetBusinessTransferRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  fromDepartmentId: string;
  fromDepartmentName: string;
  toDepartmentId: string;
  toDepartmentName: string;
  fromUserId?: string;
  toUserId?: string;
  transferredByUserId: string;
  transferDate: string;
  remarks: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

export interface AssetBusinessIssueRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  issuedToUserId: string;
  issuedToUserName: string;
  issuedToRole: string;
  issuedByUserId: string;
  departmentId: string;
  issueDate: string;
  expectedReturnDate?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  createdAt: string;
}

export interface AssetBusinessReturnRecord {
  id: string;
  assetId: string;
  assetTag: string;
  issueId?: string;
  returnedByUserId: string;
  returnedByUserName: string;
  receivedByUserId: string;
  returnDate: string;
  assetCondition: 'EXCELLENT' | 'GOOD' | 'DAMAGED' | 'SCRAP';
  status: 'COMPLETED';
  remarks?: string;
  createdAt: string;
}

export interface AssetBusinessReplacementRecord {
  id: string;
  oldAssetId: string;
  newAssetId: string;
  reason: string;
  requestedByUserId: string;
  approvedByUserId?: string;
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

export interface AssetBusinessMaintenanceRecord {
  id: string;
  assetId: string;
  vendorName: string;
  issueDescription: string;
  estimatedCost: number;
  actualCost?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceDate: string;
  completionDate?: string;
  createdAt: string;
}

export interface AssetBusinessRequisitionRecord {
  id: string;
  requisitionNumber: string;
  requesterUserId: string;
  requesterName: string;
  departmentId: string;
  instituteId: string;
  itemName: string;
  quantity: number;
  estimatedBudget: number;
  purpose: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  approvalId?: string;
  createdAt: string;
}

export interface UniversalDocumentRecord {
  id: string;
  entityType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'NOTESHEET' | 'REQUEST' | 'EXAMINATION' | 'APPROVAL' | 'ASSET';
  entityId: string;
  documentCategory: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedByUserId: string;
  uploadedByName: string;
  verifiedByUserId?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  version: number;
  createdAt: string;
}

export interface UserAuthorizationContext {
  userId: string;
  userName: string;
  email: string;
  activeRole: UserRole | string;
  assignedRoles: Array<UserRole | string>;
  permissions: string[];
  universityId?: string;
  instituteId?: string;
  instituteIds?: string[];
  departmentId?: string;
  departmentIds?: string[];
  programIds?: string[];
  assignedStudentIds?: string[];
  delegationIds?: string[];
}

export interface ReportingRelationshipRecord {
  id: string;
  managerUserId: string;
  managerName?: string;
  managerRole?: string;
  employeeUserId: string;
  employeeName?: string;
  employeeRole?: string;
  relationshipType: 'DIRECT_REPORTS_TO' | 'DELEGATED_TO' | 'COMMITTEE_CHAIR' | 'DEPUTY_ASSIGNED';
  organizationId?: string;
  departmentId?: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdByUserId: string;
  createdAt: string;
}

export interface DelegationRecord {
  id: string;
  delegatorUserId: string;
  delegatorName: string;
  delegatorRole: UserRole | string;
  delegateUserId: string;
  delegateName: string;
  delegateRole: UserRole | string;
  permissionScope: string[];
  entityScope?: {
    instituteId?: string;
    departmentId?: string;
    programId?: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  revokedAt?: string;
  revokedByUserId?: string;
}


