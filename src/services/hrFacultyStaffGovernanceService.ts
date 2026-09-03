import { db } from './db';
import { academicStructureService } from './academicStructureService';
import { dossierCompletenessService, UniversalDossierPayload } from './dossierCompletenessService';
import { Faculty, UserAuthorizationContext } from '../types';

export type EmploymentType = 'TEACHING_FACULTY' | 'NON_TEACHING_STAFF' | 'ADMINISTRATIVE_STAFF' | 'TECHNICAL_STAFF' | 'CONTRACT_STAFF' | 'VISITING_FACULTY';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TRANSFERRED' | 'RESIGNED' | 'RETIRED';
export type LeaveType = 'CASUAL' | 'EARNED' | 'MEDICAL' | 'DUTY' | 'MATERNITY';

export interface DesignationRecord {
  id: string;
  code: string;
  title: string;
  cadre: 'TEACHING' | 'NON_TEACHING' | 'ADMINISTRATIVE';
  level: number;
}

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  userId?: string;
  fullName: string;
  officialEmail: string;
  personalContact: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  employeeStatus: EmployeeStatus;
  instituteId: string;
  departmentId: string;
  designationId: string;
  designationTitle: string;
  reportingAuthorityId?: string;
  reportingAuthorityName?: string;
}

export interface EmployeeLeaveRecord {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedByUserId?: string;
  appliedAt: string;
}

export interface EmployeeLeaveBalanceRecord {
  employeeId: string;
  academicYearId: string;
  casualLeaveRemaining: number;
  earnedLeaveRemaining: number;
  medicalLeaveRemaining: number;
}

export interface EmployeePerformanceRecord {
  id: string;
  employeeId: string;
  academicYearId: string;
  teachingScore: number; // 0-100
  researchPublicationsCount: number;
  studentFeedbackRating: number; // 0-5
  overallGrade: 'OUTSTANDING' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'SATISFACTORY';
  evaluatedByUserId: string;
  status: 'FINALIZED';
}

export interface StaffDossier360Payload {
  employee: EmployeeRecord;
  designation: DesignationRecord;
  reportingAuthority?: {
    id: string;
    name: string;
    role: string;
  };
  workloadSummary: {
    totalWeeklyHours: number;
    allocatedSubjectsCount: number;
  };
  mentorshipSummary: {
    assignedMenteesCount: number;
  };
  leaveSummary: {
    casualLeaveRemaining: number;
    earnedLeaveRemaining: number;
    medicalLeaveRemaining: number;
  };
  performanceSummary?: EmployeePerformanceRecord;
  documentsDossier: UniversalDossierPayload;
}

class HrFacultyStaffGovernanceService {
  private static instance: HrFacultyStaffGovernanceService;

  private designations: DesignationRecord[] = [
    { id: 'desig-hod', code: 'HOD', title: 'Head of Department', cadre: 'TEACHING', level: 1 },
    { id: 'desig-prof', code: 'PROF', title: 'Professor', cadre: 'TEACHING', level: 2 },
    { id: 'desig-ap', code: 'ASST_PROF', title: 'Assistant Professor', cadre: 'TEACHING', level: 3 },
    { id: 'desig-dr', code: 'DEP_REG', title: 'Deputy Registrar', cadre: 'ADMINISTRATIVE', level: 2 }
  ];

  private employees: EmployeeRecord[] = [
    {
      id: 'fac-101',
      employeeCode: 'EMP-SIT-CSE-001',
      userId: 'usr-fac-101',
      fullName: 'Prof. Rajesh Patel',
      officialEmail: 'rajesh.patel@ssiu.ac.in',
      personalContact: '+91 9825012345',
      dateOfJoining: '2020-07-01',
      employmentType: 'TEACHING_FACULTY',
      employeeStatus: 'ACTIVE',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      designationId: 'desig-ap',
      designationTitle: 'Assistant Professor',
      reportingAuthorityId: 'usr-hod-01',
      reportingAuthorityName: 'Dr. Suresh Mehta (HOD CSE)'
    }
  ];

  private leaveBalances: EmployeeLeaveBalanceRecord[] = [
    { employeeId: 'fac-101', academicYearId: 'ay-2026-27', casualLeaveRemaining: 12, earnedLeaveRemaining: 15, medicalLeaveRemaining: 10 }
  ];

  private leaveApplications: EmployeeLeaveRecord[] = [
    {
      id: 'lv-01',
      employeeId: 'fac-101',
      leaveType: 'CASUAL',
      fromDate: '2026-09-01',
      toDate: '2026-09-02',
      totalDays: 2,
      reason: 'Personal academic seminar',
      status: 'APPROVED',
      approvedByUserId: 'usr-hod-01',
      appliedAt: '2026-08-20T10:00:00Z'
    }
  ];

  private performanceRecords: EmployeePerformanceRecord[] = [
    {
      id: 'perf-fac-101-2026',
      employeeId: 'fac-101',
      academicYearId: 'ay-2026-27',
      teachingScore: 92,
      researchPublicationsCount: 3,
      studentFeedbackRating: 4.8,
      overallGrade: 'OUTSTANDING',
      evaluatedByUserId: 'usr-hod-01',
      status: 'FINALIZED'
    }
  ];

  private constructor() {}

  public static getInstance(): HrFacultyStaffGovernanceService {
    if (!HrFacultyStaffGovernanceService.instance) {
      HrFacultyStaffGovernanceService.instance = new HrFacultyStaffGovernanceService();
    }
    return HrFacultyStaffGovernanceService.instance;
  }

  // ─── QUERY & WORKFLOW ──────────────────────────────────────────────────

  public getEmployees(scope?: { instituteId?: string; departmentId?: string }): EmployeeRecord[] {
    let list = this.employees;
    if (scope?.instituteId) list = list.filter(e => e.instituteId === scope.instituteId);
    if (scope?.departmentId) list = list.filter(e => e.departmentId === scope.departmentId);
    return list;
  }

  public getEmployeeById(employeeId: string): EmployeeRecord | undefined {
    return this.employees.find(e => e.id === employeeId || e.employeeCode === employeeId);
  }

  public applyLeave(application: Omit<EmployeeLeaveRecord, 'id' | 'status' | 'appliedAt'>): EmployeeLeaveRecord {
    const newLeave: EmployeeLeaveRecord = {
      id: `lv-${Date.now()}`,
      ...application,
      status: 'PENDING',
      appliedAt: new Date().toISOString()
    };

    this.leaveApplications.push(newLeave);
    return newLeave;
  }

  public approveLeave(leaveId: string, approverUserId: string): EmployeeLeaveRecord {
    const leave = this.leaveApplications.find(l => l.id === leaveId);
    if (!leave) throw new Error(`Leave application ${leaveId} not found`);

    leave.status = 'APPROVED';
    leave.approvedByUserId = approverUserId;

    // Deduct leave balance
    const balance = this.leaveBalances.find(b => b.employeeId === leave.employeeId);
    if (balance) {
      if (leave.leaveType === 'CASUAL') balance.casualLeaveRemaining = Math.max(0, balance.casualLeaveRemaining - leave.totalDays);
      if (leave.leaveType === 'EARNED') balance.earnedLeaveRemaining = Math.max(0, balance.earnedLeaveRemaining - leave.totalDays);
      if (leave.leaveType === 'MEDICAL') balance.medicalLeaveRemaining = Math.max(0, balance.medicalLeaveRemaining - leave.totalDays);
    }

    return leave;
  }

  public getStaffDossier360(employeeId: string, context?: UserAuthorizationContext): StaffDossier360Payload | undefined {
    // RBAC: If Faculty role, block viewing another faculty's confidential HR dossier
    if (context && String(context.activeRole) === 'FACULTY' && context.userId !== employeeId) {
      return undefined;
    }

    const employee = this.getEmployeeById(employeeId);
    if (!employee) return undefined;

    const designation = this.designations.find(d => d.id === employee.designationId) || {
      id: 'desig-default',
      code: 'EMP',
      title: employee.designationTitle,
      cadre: 'TEACHING',
      level: 3
    };

    const workload = academicStructureService.getFacultyWorkload(employee.id, 'ay-2026-27');
    const allocations = academicStructureService.getFacultyAllocations(employee.id, 'ay-2026-27');
    const leaveBal = this.leaveBalances.find(b => b.employeeId === employee.id) || {
      employeeId: employee.id,
      academicYearId: 'ay-2026-27',
      casualLeaveRemaining: 12,
      earnedLeaveRemaining: 15,
      medicalLeaveRemaining: 10
    };

    const perf = this.performanceRecords.find(p => p.employeeId === employee.id);
    const dossierDocs = dossierCompletenessService.getDossier('FACULTY', employee.id, context);

    return {
      employee,
      designation,
      reportingAuthority: {
        id: employee.reportingAuthorityId || 'usr-hod-01',
        name: employee.reportingAuthorityName || 'Dr. HOD',
        role: 'HOD'
      },
      workloadSummary: {
        totalWeeklyHours: workload.hours,
        allocatedSubjectsCount: allocations.length
      },
      mentorshipSummary: {
        assignedMenteesCount: 15
      },
      leaveSummary: {
        casualLeaveRemaining: leaveBal.casualLeaveRemaining,
        earnedLeaveRemaining: leaveBal.earnedLeaveRemaining,
        medicalLeaveRemaining: leaveBal.medicalLeaveRemaining
      },
      performanceSummary: perf,
      documentsDossier: dossierDocs!
    };
  }
}

export const hrFacultyStaffGovernanceService = HrFacultyStaffGovernanceService.getInstance();
