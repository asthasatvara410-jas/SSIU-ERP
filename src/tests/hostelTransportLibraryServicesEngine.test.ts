import { describe, it, expect } from 'vitest';
import { studentServicesGovernanceService } from '../services/studentServicesGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 17: Hostel + Transport + Library + Student Services Engine', () => {

  const studentAContext: UserAuthorizationContext = {
    userId: 'stud-001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'stud-002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Hostel Allocation: Retrieves active hostel bed allocation and processes vacate request', () => {
    const allocation = studentServicesGovernanceService.getStudentHostelAllocation('stud-001');
    expect(allocation).toBeDefined();
    expect(allocation?.hostelName).toContain('Boys Hostel');
    expect(allocation?.status).toBe('ALLOCATED');

    const vacated = studentServicesGovernanceService.vacateHostelBed(allocation!.id);
    expect(vacated.status).toBe('VACATED');
  });

  it('TEST 2: Library Book Issue & Return: Tracks accession number, due date, and return event', () => {
    const issues = studentServicesGovernanceService.getStudentLibraryIssues('stud-001');
    expect(issues.length).toBeGreaterThan(0);

    const activeIssue = issues[0];
    expect(activeIssue.status).toBe('ISSUED');
    expect(activeIssue.accessionNumber).toBeDefined();

    const returned = studentServicesGovernanceService.returnLibraryBook(activeIssue.id);
    expect(returned.status).toBe('RETURNED');
    expect(returned.returnedAt).toBeDefined();
  });

  it('TEST 3: Student Service Request Lifecycle: Submits certificate request and completes with SLA tracking', () => {
    const request = studentServicesGovernanceService.submitServiceRequest({
      studentId: 'stud-001',
      serviceType: 'BONAFIDE_CERTIFICATE'
    });

    expect(request.status).toBe('SUBMITTED');
    expect(request.applicationNumber).toContain('SSR-');
    expect(request.targetSlaHours).toBe(48);

    const completed = studentServicesGovernanceService.completeServiceRequest(request.id, 'usr-staff-01', 'Certificate issued');
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
  });

  it('TEST 4: Student Logistics Privacy: Student A can view own summary, but Student B cannot view Student A summary', () => {
    const ownSummary = studentServicesGovernanceService.getStudentServicesSummary('stud-001', studentAContext);
    expect(ownSummary).toBeDefined();
    expect(ownSummary?.transport?.status).toBe('ACTIVE');

    const unauthorizedSummary = studentServicesGovernanceService.getStudentServicesSummary('stud-001', studentBContext);
    expect(unauthorizedSummary).toBeUndefined(); // Strictly blocked
  });
});
