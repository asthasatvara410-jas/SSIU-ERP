import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { examEligibilityService } from '../services/examEligibilityService';
import { mentorAssignmentService } from '../services/mentorAssignmentService';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { User, Student } from '../types';

describe('Mentee Exam Eligibility Module - Comprehensive Workflow, Security & Mathematical Engine', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const mentorA: User = {
    id: 'fac-1',
    name: 'Dr. Rajesh Sharma (Mentor A)',
    email: 'rajesh.sharma@ssiu.edu.in',
    username: 'faculty',
    role: 'MENTOR',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const mentorB: User = {
    id: 'fac-2',
    name: 'Prof. Anjali Patel (Mentor B)',
    email: 'anjali.patel@ssiu.edu.in',
    username: 'faculty2',
    role: 'MENTOR',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const hodUser: User = {
    id: 'hod-1',
    name: 'Dr. Suresh Mehta (HOD CE)',
    email: 'hod.ce@ssiu.edu.in',
    username: 'hod',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const crossDeptHOD: User = {
    id: 'hod-2',
    name: 'Dr. Ramesh Joshi (HOD ME)',
    email: 'hod.me@ssiu.edu.in',
    username: 'hod_me',
    role: 'HOD',
    departmentId: 'dept-2',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const unauthorizedStudent: User = {
    id: 'stu-1',
    name: 'Student One',
    email: 'student1@ssiu.edu.in',
    username: 'student1',
    role: 'STUDENT',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  it('1. Strict Data Scoping: Mentor A and Mentor B see only their assigned mentees in Exam Eligibility', () => {
    const mentorALedger = examEligibilityService.getExamEligibilityLedger(mentorA);
    const mentorAStudentIds = new Set(mentorALedger.map(r => r.studentId));

    expect(mentorAStudentIds.has('stu-1')).toBe(true);
    expect(mentorAStudentIds.has('stu-2')).toBe(true);
    expect(mentorAStudentIds.has('stu-3')).toBe(false);
    expect(mentorAStudentIds.has('stu-4')).toBe(false);

    const mentorBLedger = examEligibilityService.getExamEligibilityLedger(mentorB);
    const mentorBStudentIds = new Set(mentorBLedger.map(r => r.studentId));

    expect(mentorBStudentIds.has('stu-3')).toBe(true);
    expect(mentorBStudentIds.has('stu-4')).toBe(true);
    expect(mentorBStudentIds.has('stu-1')).toBe(false);
    expect(mentorBStudentIds.has('stu-2')).toBe(false);
  });

  it('2. Accurate Dynamic Attendance % and Formula Check (Present / Total * 100)', () => {
    const ledger = examEligibilityService.getExamEligibilityLedger(mentorA);
    const stu1 = ledger.find(r => r.studentId === 'stu-1');

    expect(stu1).toBeDefined();
    if (stu1) {
      expect(stu1.totalSessions).toBe(stu1.presentSessions + stu1.absentSessions);
      const computedPct = stu1.totalSessions > 0 ? Math.round((stu1.presentSessions / stu1.totalSessions) * 100) : 100;
      expect(stu1.attendancePercentage).toBe(computedPct);
      expect(stu1.requiredPercentage).toBe(75);

      if (stu1.attendancePercentage >= 75) {
        expect(stu1.attendanceStatus).toBe('GOOD_STANDING');
      } else if (stu1.attendancePercentage >= 60) {
        expect(stu1.attendanceStatus).toBe('SHORTAGE');
      } else {
        expect(stu1.attendanceStatus).toBe('CRITICAL');
      }
    }
  });

  it('3. Multi-Tier Workflow: Mentor submits endorsement and Final Eligibility updates dynamically', () => {
    const updated = examEligibilityService.submitMentorEndorsement(mentorA, {
      studentId: 'stu-1',
      status: 'RECOMMENDED',
      remarks: 'Student has completed all laboratory sessions with excellent participation.'
    });

    expect(updated.mentorEndorsement.status).toBe('RECOMMENDED');
    expect(updated.mentorEndorsement.remarks).toContain('laboratory sessions');
    expect(updated.history.length).toBeGreaterThan(0);
    expect(updated.history[0].action).toBe('MENTOR_ENDORSED');
    expect(updated.history[0].performedByUserId).toBe(mentorA.id);

    // Verify final eligibility status based on rules
    expect(['ELIGIBLE', 'PENDING_APPROVAL']).toContain(updated.finalEligibility);
  });

  it('4. HOD Approval Workflow: Department HOD approves, rejects, and requests corrections', () => {
    // HOD approves stu-1
    const approvedRec = examEligibilityService.submitHODApproval(hodUser, {
      studentId: 'stu-1',
      status: 'APPROVED',
      remarks: 'Granted final examination admittance for Winter 2026.'
    });
    expect(approvedRec.hodApproval.status).toBe('APPROVED');
    expect(approvedRec.finalEligibility).toBe('ELIGIBLE');

    // HOD rejects stu-2
    const rejectedRec = examEligibilityService.submitHODApproval(hodUser, {
      studentId: 'stu-2',
      status: 'REJECTED',
      remarks: 'Debarred due to unexcused absence in practical examinations.'
    });
    expect(rejectedRec.hodApproval.status).toBe('REJECTED');
    expect(rejectedRec.finalEligibility).toBe('REJECTED');

    // HOD requests correction for stu-1
    const corrRec = examEligibilityService.submitHODApproval(hodUser, {
      studentId: 'stu-1',
      status: 'CORRECTION_REQUESTED',
      remarks: 'Please re-verify medical certificate authenticity.'
    });
    expect(corrRec.hodApproval.status).toBe('CORRECTION_REQUESTED');
    expect(corrRec.finalEligibility).toBe('CONDITIONAL');
  });

  it('5. Security Guard: Mentor A cannot submit endorsement for Mentor B’s student (403 Forbidden)', () => {
    expect(() => {
      examEligibilityService.submitMentorEndorsement(mentorA, {
        studentId: 'stu-3',
        status: 'RECOMMENDED',
        remarks: 'Tampered attempt for unassigned student'
      });
    }).toThrow(/403 Forbidden/);
  });

  it('6. Security Guard: Cross-Department HOD cannot approve student from another department (403 Forbidden)', () => {
    expect(() => {
      examEligibilityService.submitHODApproval(crossDeptHOD, {
        studentId: 'stu-1',
        status: 'APPROVED',
        remarks: 'Cross department approval attempt'
      });
    }).toThrow(/403 Forbidden/);
  });

  it('7. Security Guard: Student cannot submit endorsements or approvals (403 Forbidden)', () => {
    expect(() => {
      examEligibilityService.submitMentorEndorsement(unauthorizedStudent, {
        studentId: 'stu-1',
        status: 'RECOMMENDED',
        remarks: 'Self endorsement attempt'
      });
    }).toThrow(/403 Forbidden/);

    expect(() => {
      examEligibilityService.submitHODApproval(unauthorizedStudent, {
        studentId: 'stu-1',
        status: 'APPROVED',
        remarks: 'Self approval attempt'
      });
    }).toThrow(/403 Forbidden/);
  });

  it('8. Dynamic Reassignment Synchronization: When HOD reassigns student, exam eligibility updates immediately', () => {
    let mentorALedger = examEligibilityService.getExamEligibilityLedger(mentorA);
    let mentorBLedger = examEligibilityService.getExamEligibilityLedger(mentorB);

    expect(mentorALedger.some(r => r.studentId === 'stu-1')).toBe(true);
    expect(mentorBLedger.some(r => r.studentId === 'stu-1')).toBe(false);

    // HOD reassigns stu-1 from Mentor A (fac-1) to Mentor B (fac-2)
    mentorAssignmentService.assignMentor({
      studentId: 'stu-1',
      mentorFacultyId: 'fac-2',
      changeReason: 'Academic mentorship workload redistribution',
      isChange: true,
      effectiveFrom: '2026-08-27'
    }, hodUser);

    mentorALedger = examEligibilityService.getExamEligibilityLedger(mentorA);
    mentorBLedger = examEligibilityService.getExamEligibilityLedger(mentorB);

    expect(mentorALedger.some(r => r.studentId === 'stu-1')).toBe(false);
    expect(mentorBLedger.some(r => r.studentId === 'stu-1')).toBe(true);

    // Mentor A attempting to endorse stu-1 is now rejected with 403
    expect(() => {
      examEligibilityService.submitMentorEndorsement(mentorA, {
        studentId: 'stu-1',
        status: 'RECOMMENDED',
        remarks: 'Old mentor trying to endorse'
      });
    }).toThrow(/403 Forbidden/);

    // Mentor B can now endorse stu-1
    const bEndorse = examEligibilityService.submitMentorEndorsement(mentorB, {
      studentId: 'stu-1',
      status: 'RECOMMENDED',
      remarks: 'Endorsed by new mentor'
    });
    expect(bEndorse.mentorEndorsement.mentorId).toBe(mentorB.id);
  });

  it('9. Central RBAC: EXAM_ELIGIBILITY module permissions evaluation', () => {
    expect(can(mentorA, 'EXAM_ELIGIBILITY', 'VIEW')).toBe(true);
    expect(can(mentorA, 'EXAM_ELIGIBILITY', 'APPROVE')).toBe(true); // Mentor can submit endorsement
    expect(can(mentorA, 'EXAM_ELIGIBILITY', 'EXPORT')).toBe(true);

    expect(can(hodUser, 'EXAM_ELIGIBILITY', 'VIEW')).toBe(true);
    expect(can(hodUser, 'EXAM_ELIGIBILITY', 'APPROVE')).toBe(true);
    expect(can(hodUser, 'EXAM_ELIGIBILITY', 'REJECT')).toBe(true);

    expect(can(unauthorizedStudent, 'EXAM_ELIGIBILITY', 'APPROVE')).toBe(false);
  });
});
