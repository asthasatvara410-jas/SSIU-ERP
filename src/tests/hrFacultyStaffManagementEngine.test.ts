import { describe, it, expect } from 'vitest';
import { hrFacultyStaffGovernanceService } from '../services/hrFacultyStaffGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13: HR + Faculty & Staff Management Engine', () => {

  const facultyAContext: UserAuthorizationContext = {
    userId: 'fac-101',
    userName: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const facultyBContext: UserAuthorizationContext = {
    userId: 'fac-102',
    userName: 'Prof. Anjali Sharma',
    email: 'anjali.sharma@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Employee Master & Cadre: Teaching Faculty record is linked to Designation and Department', () => {
    const employee = hrFacultyStaffGovernanceService.getEmployeeById('fac-101');
    expect(employee).toBeDefined();
    expect(employee?.fullName).toBe('Prof. Rajesh Patel');
    expect(employee?.employmentType).toBe('TEACHING_FACULTY');
    expect(employee?.reportingAuthorityName).toContain('HOD');
  });

  it('TEST 2: Leave Application & Approval: Approved leave deducts leave balance automatically', () => {
    const appliedLeave = hrFacultyStaffGovernanceService.applyLeave({
      employeeId: 'fac-101',
      leaveType: 'CASUAL',
      fromDate: '2026-10-01',
      toDate: '2026-10-02',
      totalDays: 2,
      reason: 'Attending National AI Conference'
    });

    expect(appliedLeave.status).toBe('PENDING');

    const approvedLeave = hrFacultyStaffGovernanceService.approveLeave(appliedLeave.id, 'usr-hod-01');
    expect(approvedLeave.status).toBe('APPROVED');
    expect(approvedLeave.approvedByUserId).toBe('usr-hod-01');

    const dossier = hrFacultyStaffGovernanceService.getStaffDossier360('fac-101');
    expect(dossier?.leaveSummary.casualLeaveRemaining).toBe(10); // 12 - 2 = 10
  });

  it('TEST 3: Staff 360 Dossier: Dynamic aggregation across workload, subjects, mentees, leave, and performance', () => {
    const dossier = hrFacultyStaffGovernanceService.getStaffDossier360('fac-101');
    expect(dossier).toBeDefined();
    expect(dossier?.employee.fullName).toBe('Prof. Rajesh Patel');
    expect(dossier?.workloadSummary.totalWeeklyHours).toBe(5);
    expect(dossier?.mentorshipSummary.assignedMenteesCount).toBe(15);
    expect(dossier?.performanceSummary?.overallGrade).toBe('OUTSTANDING');
    expect(dossier?.documentsDossier).toBeDefined();
  });

  it('TEST 4: HR Privacy & RBAC: Faculty A can view own HR dossier, but Faculty B is strictly blocked from viewing Faculty A dossier', () => {
    const ownDossier = hrFacultyStaffGovernanceService.getStaffDossier360('fac-101', facultyAContext);
    expect(ownDossier).toBeDefined();

    const unauthorizedDossier = hrFacultyStaffGovernanceService.getStaffDossier360('fac-101', facultyBContext);
    expect(unauthorizedDossier).toBeUndefined(); // Strictly blocked
  });
});
