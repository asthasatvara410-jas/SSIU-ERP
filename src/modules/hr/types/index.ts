/**
 * SSIU ERP — HR Governance & Workforce Domain Types
 * File: src/modules/hr/types/index.ts
 */

export interface HRWorkforceMetricsDTO {
  totalEmployees: number;
  activeEmployees: number;
  probationEmployees: number;
  facultyCount: number;
  nonTeachingCount: number;
  monthlyNewJoiners: number;
  monthlySeparations: number;
  leaveUtilizationPercentage: number;
  departmentWorkforce: Array<{
    departmentId: string;
    departmentName: string;
    instituteName: string;
    facultyCount: number;
    staffCount: number;
    totalHeadcount: number;
    activeOnLeave: number;
  }>;
}

export interface EmployeeLeaveBalanceDTO {
  employeeId: string;
  employeeName: string;
  designation: string;
  departmentName: string;
  casualLeaveBalance: number;
  earnedLeaveBalance: number;
  medicalLeaveBalance: number;
  leavesAppliedThisMonth: number;
  pendingApprovals: number;
  leaveStatus: 'NORMAL' | 'EXHAUSTED' | 'ON_EXTENDED_LEAVE';
}

export interface PayrollReadinessChecklistDTO {
  departmentId: string;
  departmentName: string;
  totalEligibleStaff: number;
  attendanceVerifiedCount: number;
  bankDetailsVerifiedCount: number;
  statutoryDeductionsConfigured: boolean;
  payrollReadinessScore: number; // 0 - 100%
  readinessStatus: 'READY' | 'ACTION_REQUIRED' | 'BLOCKED';
}
