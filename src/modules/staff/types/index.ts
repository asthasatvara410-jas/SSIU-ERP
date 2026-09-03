/**
 * SSIU ERP — Staff & Faculty Governance Domain Types
 * File: src/modules/staff/types/index.ts
 */

export interface StaffGovernanceMetricsDTO {
  totalFaculty: number;
  activeFaculty: number;
  phdHolderCount: number;
  avgTeachingHoursPerWeek: number;
  studentFacultyRatio: number;
  totalResearchPapersPublished: number;
  totalPatentsFiled: number;
  totalFundedProjects: number;
  departmentWorkloadStats: Array<{
    departmentId: string;
    departmentName: string;
    instituteName: string;
    totalFaculty: number;
    studentCount: number;
    studentFacultyRatio: number;
    averageWorkloadHours: number;
    workloadStatus: 'OPTIMAL' | 'OVERLOADED' | 'UNDERLOADED';
  }>;
}

export interface SupervisorHierarchyNodeDTO {
  id: string;
  name: string;
  designation: string;
  role: string;
  department: string;
  assignedMenteesCount: number;
  weeklyWorkloadHours: number;
  employeeId?: string;
  email?: string;
  departmentId?: string;
  instituteId?: string;
  children?: SupervisorHierarchyNodeDTO[];
}

export interface FacultyResearchSummaryDTO {
  facultyId: string;
  facultyName: string;
  designation: string;
  departmentName: string;
  journalPapersCount: number;
  conferencePapersCount: number;
  patentsCount: number;
  fundedGrantsAmountLakhs: number;
  hIndex: number;
  employeeId?: string;
  email?: string;
  departmentId?: string;
  instituteId?: string;
}
