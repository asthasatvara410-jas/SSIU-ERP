import { describe, it, expect } from 'vitest';
import { studentLifecycleStatusEnrollmentService } from '../services/studentLifecycleStatusEnrollmentService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.1: Student Lifecycle Architecture, Master Integration & Enrollment Engine', () => {

  it('TEST 1: Student Status State Machine: Enforces valid transitions and requires reason for sensitive changes', () => {
    // 1. Illegal transition attempt: ACTIVE directly to ALUMNI (must graduate first)
    expect(() => {
      studentLifecycleStatusEnrollmentService.transitionStudentStatus({
        studentId: 'STU-2026-000001',
        newStatus: 'ALUMNI',
        effectiveDate: '2026-05-01',
        changedBy: 'emp-reg-001'
      });
    }).toThrow(/Invalid status transition from ACTIVE to ALUMNI/);

    // 2. Sensitive transition without mandatory reason (SUSPENDED without reason)
    expect(() => {
      studentLifecycleStatusEnrollmentService.transitionStudentStatus({
        studentId: 'STU-2026-000001',
        newStatus: 'SUSPENDED',
        effectiveDate: '2026-05-01',
        changedBy: 'emp-reg-001'
        // Missing reason
      });
    }).toThrow(/Mandatory reason required for transitioning student status to SUSPENDED/);

    // 3. Valid transition: ACTIVE -> ON_LEAVE
    const onLeaveTransition = studentLifecycleStatusEnrollmentService.transitionStudentStatus({
      studentId: 'STU-2026-000001',
      newStatus: 'ON_LEAVE',
      effectiveDate: '2026-05-01',
      reason: 'Medical leave approved by university doctor',
      changedBy: 'emp-reg-001'
    });

    expect(onLeaveTransition.new_status).toBe('ON_LEAVE');
    expect(onLeaveTransition.effective_date).toBe('2026-05-01');

    // 4. Return to ACTIVE
    const activeTransition = studentLifecycleStatusEnrollmentService.transitionStudentStatus({
      studentId: 'STU-2026-000001',
      newStatus: 'ACTIVE',
      effectiveDate: '2026-06-01',
      remarks: 'Returned from medical leave',
      changedBy: 'emp-reg-001'
    });

    expect(activeTransition.new_status).toBe('ACTIVE');
  });

  it('TEST 2: Student Matching & Duplicate Protection: Correctly matches exact and fuzzy applicant identities', () => {
    // 1. Exact match by mobile
    const matchMobile = studentLifecycleStatusEnrollmentService.matchStudent({
      mobile: '9876543210'
    });
    expect(matchMobile.matchStatus).toBe('MATCH_FOUND');
    expect(matchMobile.matchedStudent?.student_id).toBe('STU-2026-000001');

    // 2. Fuzzy match by Name + DOB
    const matchFuzzy = studentLifecycleStatusEnrollmentService.matchStudent({
      fullName: 'Aarav Patel',
      dob: '2004-06-15'
    });
    expect(matchFuzzy.matchStatus).toBe('POSSIBLE_MATCH');
    expect(matchFuzzy.matchedStudent?.student_id).toBe('STU-2026-000001');

    // 3. No match for new applicant
    const noMatch = studentLifecycleStatusEnrollmentService.matchStudent({
      mobile: '9123456789',
      email: 'new.student@swarrnim.edu.in'
    });
    expect(noMatch.matchStatus).toBe('NO_MATCH');
  });

  it('TEST 3: Multi-Program Historical Enrollments & Section Change: Preserves academic history under single Student ID', () => {
    // 1. Enroll in additional program (e.g. Master's program under same Student ID)
    const newEnrollment = studentLifecycleStatusEnrollmentService.enrollStudentInProgram({
      studentId: 'STU-2026-000001',
      enrollmentNumber: 'SU28MCA0001',
      programId: 'prog-mca',
      programName: 'Master of Computer Applications (MCA)',
      departmentId: 'dept-cse',
      instituteId: 'inst-sit',
      academicYearId: 'ay-2028-29',
      semesterId: 'sem-01',
      sectionId: 'sec-a'
    });

    expect(newEnrollment.id).toBeDefined();
    expect(newEnrollment.student_id).toBe('STU-2026-000001');
    expect(newEnrollment.status).toBe('ACTIVE');

    // 2. Section Change
    const updatedSec = studentLifecycleStatusEnrollmentService.changeSection({
      enrollmentId: newEnrollment.id,
      newSectionId: 'sec-b',
      reason: 'Re-allocated due to elective subject lab timetable balancing',
      changedBy: 'emp-reg-001'
    });

    expect(updatedSec.section_id).toBe('sec-b');
  });

  it('TEST 4: Student Hold Governance: Places hold, records restriction and releases cleanly', () => {
    // Hold without reason must fail
    expect(() => {
      studentLifecycleStatusEnrollmentService.placeStudentHold({
        studentId: 'STU-2026-000001',
        holdType: 'FINANCIAL_HOLD',
        reason: '',
        startDate: '2026-05-10',
        createdBy: 'emp-fin-001'
      });
    }).toThrow(/Mandatory reason required to place a student hold/);

    // Place valid hold
    const hold = studentLifecycleStatusEnrollmentService.placeStudentHold({
      studentId: 'STU-2026-000001',
      holdType: 'DOCUMENT_HOLD',
      reason: 'Pending physical verification of original 12th Grade Marksheet',
      startDate: '2026-05-10',
      createdBy: 'emp-reg-001'
    });

    expect(hold.status).toBe('ACTIVE');

    // Release hold
    const released = studentLifecycleStatusEnrollmentService.releaseStudentHold({
      holdId: hold.id,
      releasedBy: 'emp-reg-001'
    });

    expect(released.status).toBe('RELEASED');
    expect(released.released_at).toBeDefined();
  });

  it('TEST 5: Dynamic Profile Completeness: Calculates percentage dynamically from actual attributes', () => {
    // 8 out of 10 attributes filled = 80%
    const partial = studentLifecycleStatusEnrollmentService.calculateProfileCompleteness({
      firstName: 'Aarav',
      lastName: 'Patel',
      dob: '2004-06-15',
      mobile: '9876543210',
      email: 'aarav.patel@swarrnim.edu.in',
      currentAddress: 'Gandhinagar, Gujarat',
      guardianName: 'Ramesh Patel',
      guardianMobile: '9876543211',
      aadhaarVerified: false,
      photoUploaded: false
    });
    expect(partial).toBe(80);

    // 10 out of 10 attributes filled = 100%
    const full = studentLifecycleStatusEnrollmentService.calculateProfileCompleteness({
      firstName: 'Aarav',
      lastName: 'Patel',
      dob: '2004-06-15',
      mobile: '9876543210',
      email: 'aarav.patel@swarrnim.edu.in',
      currentAddress: 'Gandhinagar, Gujarat',
      guardianName: 'Ramesh Patel',
      guardianMobile: '9876543211',
      aadhaarVerified: true,
      photoUploaded: true
    });
    expect(full).toBe(100);
  });

  it('TEST 6: Unified Student Timeline & Scoped Metrics: Chronologically orders events and computes dashboard metrics', () => {
    const timeline = studentLifecycleStatusEnrollmentService.getStudentTimeline('STU-2026-000001');
    expect(timeline.length).toBeGreaterThanOrEqual(4);

    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['STUDENT_VIEW', 'STUDENT_STATUS_VIEW', 'ENROLLMENT_VIEW']
    };

    const metrics = studentLifecycleStatusEnrollmentService.getStudentLifecycleMetrics(registrarContext);
    expect(metrics.totalStudents).toBeGreaterThanOrEqual(1);
    expect(metrics.activeStudents).toBeGreaterThanOrEqual(1);
    expect(metrics.averageProfileCompleteness).toBeGreaterThanOrEqual(80);
  });
});
