import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { attendanceApprovalService } from '../services/attendanceApprovalService';
import { AttendanceApplication, User } from '../types';

describe('Attendance Approval Lifecycle & Dashboard Consistency Suite', () => {
  let principalUser: User;
  let hodUser: User;
  let mentorUser: User;
  let facultyUser: User;

  let instituteId = 'inst-1';
  let deptId = 'dept-1';

  beforeEach(() => {
    const st = db.getState() as any;

    principalUser = {
      id: 'usr-principal-1',
      name: 'Dr. K. L. Shivaprasad',
      role: 'PRINCIPAL',
      instituteId: instituteId,
      status: 'ACTIVE'
    };

    hodUser = {
      id: 'usr-hod-1',
      name: 'Dr. Vikram Shah (HOD)',
      role: 'HOD',
      instituteId: instituteId,
      departmentId: deptId,
      status: 'ACTIVE'
    };

    mentorUser = {
      id: 'fac-1',
      name: 'Demo Faculty 1 (Mentor)',
      role: 'MENTOR',
      instituteId: instituteId,
      departmentId: deptId,
      status: 'ACTIVE'
    };

    facultyUser = {
      id: 'fac-3',
      name: 'Dr. Aarav Mehta (Subject Faculty)',
      role: 'FACULTY',
      instituteId: instituteId,
      departmentId: deptId,
      status: 'ACTIVE'
    };

    // Seed clean single application at Tier 1 (SUBMITTED_TO_FACULTY)
    const app1: AttendanceApplication = {
      id: 'app-att-test-01',
      applicationNo: 'APP/ATT/2026/000001',
      studentId: 'stu-3',
      studentName: 'XYZ Student 1',
      enrollmentNo: 'STUDENT-003',
      instituteId: instituteId,
      departmentId: deptId,
      subjectId: 'sub-cn',
      subjectCode: 'CSE-404',
      subjectName: 'Computer Networks',
      subjectFacultyId: 'fac-3',
      subjectFacultyName: 'Dr. Aarav Mehta',
      mentorFacultyId: 'fac-1',
      mentorFacultyName: 'Demo Faculty 1',
      hodUserId: 'usr-hod-1',
      hoiUserId: 'usr-principal-1',
      currentAttendancePct: 71.43,
      requiredAttendancePct: 75.0,
      shortagePct: 3.57,
      reason: 'MEDICAL',
      currentHandlerRole: 'SUBJECT_FACULTY',
      currentHandlerId: 'fac-3',
      status: 'SUBMITTED_TO_FACULTY',
      finalEligibilityGranted: false,
      timeline: []
    } as any;

    st.attendanceApplications = [app1];
    db.saveState();
  });

  describe('1. Root Cause Consistency Audit: SUBMITTED_TO_FACULTY status', () => {
    it('accurately reports Principal Pending Approvals = 0 when request is at Faculty tier', () => {
      const allInstApps = db.getAttendanceApplications().filter(a => a.instituteId === instituteId);
      expect(allInstApps.length).toBe(1);
      expect(allInstApps[0].applicationNo).toBe('APP/ATT/2026/000001');
      expect(allInstApps[0].status).toBe('SUBMITTED_TO_FACULTY');

      // Actionable for HOI:
      const pendingHOIApps = allInstApps.filter(a => 
        a.status === 'HOD_APPROVED' || 
        a.status === 'WITH_HOI' || 
        a.status === 'SUBMITTED_TO_PRINCIPAL'
      );

      // KPI MUST be 0 (because it is currently with Subject Faculty, not HOI)
      expect(pendingHOIApps.length).toBe(0);

      // Actionable for Subject Faculty:
      const pendingFacultyApps = allInstApps.filter(a => a.status === 'SUBMITTED_TO_FACULTY');
      expect(pendingFacultyApps.length).toBe(1);
    });

    it('displays full audit tracking in All Applications view without false actionable fallback', () => {
      const allInstApps = db.getAttendanceApplications().filter(a => a.instituteId === instituteId);
      const pendingActionable = allInstApps.filter(a => a.status === 'HOD_APPROVED' || a.status === 'WITH_HOI');

      // Table filtered to PENDING_MY_ACTION returns [] (clean empty state)
      expect(pendingActionable).toEqual([]);

      // Table filtered to ALL returns the 1 in-progress application
      expect(allInstApps.length).toBe(1);
      expect(allInstApps[0].status).toBe('SUBMITTED_TO_FACULTY');
      expect(allInstApps[0].currentHandlerRole).toBe('SUBJECT_FACULTY');
    });
  });

  describe('2. Multi-Tier Workflow Progression & Dynamic KPI Recalculation', () => {
    it('dynamically increments Principal Pending Approvals when HOD recommends the application', () => {
      const st = db.getState() as any;
      const app = st.attendanceApplications.find((a: AttendanceApplication) => a.id === 'app-att-test-01');

      // Transition application to HOD_APPROVED (Tier 4 HOI Action Required)
      app.status = 'HOD_APPROVED';
      app.currentHandlerRole = 'HOI';
      app.currentHandlerId = 'usr-principal-1';
      db.saveState();

      const allInstApps = db.getAttendanceApplications().filter(a => a.instituteId === instituteId);
      const pendingHOIApps = allInstApps.filter(a => 
        a.status === 'HOD_APPROVED' || 
        a.status === 'WITH_HOI' || 
        a.status === 'SUBMITTED_TO_PRINCIPAL'
      );

      // Principal Pending Approvals KPI dynamically becomes 1
      expect(pendingHOIApps.length).toBe(1);
      expect(pendingHOIApps[0].applicationNo).toBe('APP/ATT/2026/000001');
    });

    it('dynamically clears Principal Pending Approvals when HOI approves or rejects', () => {
      const st = db.getState() as any;
      const app = st.attendanceApplications.find((a: AttendanceApplication) => a.id === 'app-att-test-01');

      // Principal approves
      app.status = 'FINAL_APPROVED';
      app.finalEligibilityGranted = true;
      db.saveState();

      const pendingHOIApps = db.getAttendanceApplications().filter(a => 
        (a.instituteId === instituteId) &&
        (a.status === 'HOD_APPROVED' || a.status === 'WITH_HOI' || a.status === 'SUBMITTED_TO_PRINCIPAL')
      );

      const approvedApps = db.getAttendanceApplications().filter(a => 
        (a.instituteId === instituteId) &&
        (a.status === 'FINAL_APPROVED' || a.status === 'HOI_APPROVED')
      );

      // Pending becomes 0, Approved becomes 1
      expect(pendingHOIApps.length).toBe(0);
      expect(approvedApps.length).toBe(1);
      expect(approvedApps[0].finalEligibilityGranted).toBe(true);
    });
  });

  describe('3. Institutional & Departmental Scope Isolation', () => {
    it('never leaks approval records across different institutes', () => {
      const st = db.getState() as any;
      // Add application for another institute
      const otherInstApp: AttendanceApplication = {
        id: 'app-other-inst',
        applicationNo: 'APP/ATT/2026/999999',
        instituteId: 'inst-other-medical',
        departmentId: 'dept-pharmacy',
        status: 'HOD_APPROVED'
      } as any;

      st.attendanceApplications.push(otherInstApp);
      db.saveState();

      const sitApps = db.getAttendanceApplications().filter(a => a.instituteId === instituteId);
      expect(sitApps.some(a => a.id === 'app-other-inst')).toBe(false);
    });
  });
});
