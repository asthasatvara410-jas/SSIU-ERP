export type ExamEligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PROVISIONAL_HOLD';

export interface ExamEligibilityResult {
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  programId: string;
  semester: number;
  examId: string;
  examName: string;
  attendancePercentage: number;
  attendanceThreshold: number;
  hasAttendanceShortage: boolean;
  hasOverdueFeeHold: boolean;
  overdueFeeAmount: number;
  isEnrollmentValid: boolean;
  status: ExamEligibilityStatus;
  reasons: string[];
  evaluatedAt: string;
}

export interface GradePointTier {
  minMarks: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  description: string;
  isPassing: boolean;
}

export interface UniversityGradingPolicy {
  policyId: string;
  policyName: string;
  scaleMax: 10;
  passingMinMarks: number;
  tiers: GradePointTier[];
}

export interface CourseMarksItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  practicalMarks?: number;
  totalMarks: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  isPassing: boolean;
}

export interface StudentSemesterResultSummary {
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  programName: string;
  semester: number;
  academicYear: string;
  courseMarks: CourseMarksItem[];
  totalCreditsOffered: number;
  totalCreditsEarned: number;
  sgpa: number;
  cgpa: number;
  backlogsCount: number;
  resultStatus: 'DISTINCTION' | 'FIRST_CLASS' | 'PASS' | 'ATKT' | 'FAIL';
  issuedDate: string;
}

export interface DigitalMarksheetPayload {
  marksheetId: string;
  universityName: string;
  institutionName: string;
  studentDetails: {
    studentId: string;
    enrollmentNo: string;
    fullName: string;
    fatherName?: string;
    programName: string;
    semester: number;
    academicYear: string;
  };
  evaluationSummary: StudentSemesterResultSummary;
  securityHash: string;
  qrVerificationUrl: string;
  isOfficial: boolean;
}

export interface DegreeCertificatePayload {
  certificateId: string;
  certificateNumber: string;
  universityName: string;
  candidateName: string;
  enrollmentNumber: string;
  programConferred: string;
  specialization?: string;
  finalCgpa: number;
  divisionConferred: 'FIRST_CLASS_DISTINCTION' | 'FIRST_CLASS' | 'SECOND_CLASS' | 'PASS_CLASS';
  conferredDate: string;
  disclaimer: string;
  verificationDigest: string;
}
