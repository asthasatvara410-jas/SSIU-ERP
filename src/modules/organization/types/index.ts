/**
 * SSIU ERP — Organization Management Domain Types
 * File: src/modules/organization/types/index.ts
 */

export interface InstituteSummaryDTO {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  universityId: string;
  totalDepartments: number;
  totalPrograms: number;
  totalStudents: number;
  totalFaculty: number;
  totalRooms: number;
  accreditationStatus: 'NAAC_A_PLUS' | 'NAAC_A' | 'NBA_ACCREDITED' | 'AICTE_APPROVED' | 'IN_PROCESS';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DepartmentInfrastructureDTO {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  instituteId: string;
  instituteName: string;
  headOfDepartment: string;
  allocatedClassrooms: number;
  allocatedLabs: number;
  seatingCapacity: number;
  activeProgramsCount: number;
}

export interface OrganizationHierarchyTreeNode {
  id: string;
  name: string;
  type: 'UNIVERSITY' | 'INSTITUTE' | 'DEPARTMENT' | 'PROGRAM';
  code: string;
  headPerson?: string;
  studentCount?: number;
  facultyCount?: number;
  children?: OrganizationHierarchyTreeNode[];
}

export interface CampusGovernanceMetrics {
  totalUniversities: number;
  totalInstitutes: number;
  totalDepartments: number;
  totalPrograms: number;
  totalEnrolledStudents: number;
  totalActiveFaculty: number;
  totalClassroomsAndLabs: number;
  accreditedInstitutesCount: number;
}
