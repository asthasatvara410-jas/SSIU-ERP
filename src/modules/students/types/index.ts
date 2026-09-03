/**
 * SSIU ERP — Student Management Hub Domain Types
 * File: src/modules/students/types/index.ts
 */

export interface StudentGovernanceMetricsDTO {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  onboardingPipelineCount: number;
  abcIdVerifiedCount: number;
  abcIdCompliancePercentage: number;
  genderRatio: {
    male: number;
    female: number;
    other: number;
  };
  categoryDistribution: Record<string, number>;
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    instituteName: string;
    totalStudents: number;
    activeStudents: number;
    abcCompliancePercentage: number;
    eligibleForPromotionCount: number;
  }>;
}

export interface BatchPromotionPreviewDTO {
  batchId: string;
  batchName: string;
  departmentId: string;
  departmentName: string;
  currentSemester: number;
  nextSemester: number;
  totalStudents: number;
  eligibleCount: number;
  attendanceReadinessPercentage: number;
  feePendingCount: number;
  backlogCount: number;
  readinessStatus: 'READY' | 'ATTENTION_REQUIRED' | 'BLOCKED';
  readinessRemarks: string;
}

export interface StudentAbcComplianceItemDTO {
  studentId: string;
  enrollmentNumber: string;
  studentName: string;
  departmentName: string;
  semester: number;
  abcId: string | null;
  isVerified: boolean;
  apaarId: string | null;
  digiLockerLinked: boolean;
  complianceStatus: 'VERIFIED' | 'PENDING_UPLOAD' | 'REJECTED';
}
