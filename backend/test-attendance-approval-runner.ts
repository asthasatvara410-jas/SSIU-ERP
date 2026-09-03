/**
 * SSIU ERP: 13-POINT AUTOMATED ATTENDANCE APPROVAL & CONDONATION TEST SUITE
 * Tests:
 * 1. 80% attendance -> EXAM ELIGIBLE status
 * 2. 69% attendance -> ATTENDANCE SHORTAGE status
 * 3. 75.0% attendance -> EXACT THRESHOLD ELIGIBLE status
 * 4. Student with 69% attendance cannot submit exam form directly without approval
 * 5. Student creates attendance application for 69% subject
 * 6. Duplicate application blocked for the same subject
 * 7. Faculty Approval: SUBMITTED_TO_FACULTY -> FACULTY_APPROVED (next: MENTOR)
 * 8. Mentor Approval: FACULTY_APPROVED -> MENTOR_APPROVED (next: HOD)
 * 9. HOD Approval: MENTOR_APPROVED -> HOD_APPROVED (next: HOI)
 * 10. HOI Final Approval: HOD_APPROVED -> FINAL_APPROVED, sets finalEligibilityGranted = true
 * 11. Attendance percentage remains 69% (Zero Attendance Overwrite Rule)
 * 12. Student can now submit exam form for the condoned subject
 * 13. Rejection terminates workflow immediately and records in audit history
 */

interface MockAttendanceApplication {
  id: string;
  applicationNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectFacultyId: string;
  subjectFacultyName: string;
  mentorFacultyId: string;
  mentorFacultyName: string;
  hodUserId: string;
  hodUserName: string;
  hoiUserId: string;
  hoiUserName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  currentAttendancePct: number;
  requiredAttendancePct: number;
  shortagePct: number;
  reason: string;
  status: string;
  currentHandlerRole: string;
  currentHandlerId: string;
  currentHandlerName: string;
  finalEligibilityGranted: boolean;
  eligibilityType?: string;
  timeline: any[];
}

interface MockAuditLog {
  id: string;
  applicationId: string;
  action: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  toUserId: string;
  toUserName: string;
  toUserRole: string;
  remarks: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

class AttendanceWorkflowEngine {
  private applications: Map<string, MockAttendanceApplication> = new Map();
  private auditLogs: MockAuditLog[] = [];
  public minRequiredPct: number = 75.0;

  // Calculate subject attendance
  public calculateAttendance(present: number, total: number) {
    const rawPct = total > 0 ? (present / total) * 100 : 100;
    const percentage = Math.round(rawPct * 10) / 10;
    const shortagePercentage = percentage < this.minRequiredPct ? Math.round((this.minRequiredPct - percentage) * 10) / 10 : 0;
    const isEligible = percentage >= this.minRequiredPct;
    return { percentage, shortagePercentage, isEligible, status: isEligible ? 'EXAM_ELIGIBLE' : 'ATTENDANCE_SHORTAGE' };
  }

  // Create attendance application
  public createApplication(studentId: string, studentName: string, enrollmentNo: string, subjectId: string, subjectCode: string, subjectName: string, present: number, total: number, reason: string) {
    const stats = this.calculateAttendance(present, total);
    if (stats.percentage >= this.minRequiredPct) {
      throw new Error(`Attendance is ${stats.percentage}%, which is >= ${this.minRequiredPct}%. No application needed.`);
    }

    // Check duplicate
    for (const app of this.applications.values()) {
      if (app.studentId === studentId && app.subjectId === subjectId && !['FINAL_APPROVED', 'FACULTY_REJECTED', 'MENTOR_REJECTED', 'HOD_REJECTED', 'HOI_REJECTED', 'CLOSED'].includes(app.status)) {
        throw new Error(`An attendance approval application (${app.applicationNo}) is already pending for this subject.`);
      }
    }

    const id = `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const applicationNo = `APP/ATT/2026/${String(this.applications.size + 1).padStart(6, '0')}`;
    const now = new Date();

    const app: MockAttendanceApplication = {
      id,
      applicationNo,
      studentId,
      studentName,
      enrollmentNo,
      subjectId,
      subjectCode,
      subjectName,
      subjectFacultyId: 'fac-1',
      subjectFacultyName: 'Prof. Demo Faculty',
      mentorFacultyId: 'fac-mentor-1',
      mentorFacultyName: 'Dr. Mentor Faculty',
      hodUserId: 'usr-hod-1',
      hodUserName: 'Department HOD',
      hoiUserId: 'usr-principal-1',
      hoiUserName: 'Institute Principal / HOI',
      totalClasses: total,
      presentClasses: present,
      absentClasses: total - present,
      currentAttendancePct: stats.percentage,
      requiredAttendancePct: this.minRequiredPct,
      shortagePct: stats.shortagePercentage,
      reason,
      status: 'SUBMITTED_TO_FACULTY',
      currentHandlerRole: 'SUBJECT_FACULTY',
      currentHandlerId: 'fac-1',
      currentHandlerName: 'Prof. Demo Faculty',
      finalEligibilityGranted: false,
      timeline: []
    };

    const initialHistory = {
      action: 'APPLICATION_SUBMITTED',
      fromUserId: studentId,
      fromUserName: studentName,
      fromUserRole: 'STUDENT',
      toUserId: app.subjectFacultyId,
      toUserName: app.subjectFacultyName,
      toUserRole: 'SUBJECT_FACULTY',
      remarks: `Submitted attendance condonation application for shortage (${stats.percentage}% < ${this.minRequiredPct}%).`,
      previousStatus: 'SUBMITTED_TO_FACULTY',
      newStatus: 'SUBMITTED_TO_FACULTY',
      timestamp: now.toISOString()
    };
    app.timeline.push(initialHistory);
    this.applications.set(id, app);

    this.auditLogs.push({
      id: `log-${Date.now()}`,
      applicationId: id,
      action: initialHistory.action,
      fromUserId: studentId,
      fromUserName: studentName,
      fromUserRole: 'STUDENT',
      toUserId: app.subjectFacultyId,
      toUserName: app.subjectFacultyName,
      toUserRole: 'SUBJECT_FACULTY',
      remarks: initialHistory.remarks,
      previousStatus: initialHistory.previousStatus,
      newStatus: initialHistory.newStatus,
      timestamp: now
    });

    return app;
  }

  // Step 1: Subject Faculty Review
  public facultyReview(appId: string, decision: 'APPROVE' | 'REJECT' | 'MORE_INFO', remarks: string, reviewerId: string) {
    const app = this.applications.get(appId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'SUBMITTED_TO_FACULTY' && app.status !== 'MORE_INFORMATION_REQUIRED') {
      throw new Error(`Invalid status ${app.status} for faculty review`);
    }

    const prevStatus = app.status;
    let newStatus = '';
    let nextRole = '';
    let nextId = '';
    let nextName = '';

    if (decision === 'APPROVE') {
      newStatus = 'FACULTY_APPROVED';
      nextRole = 'FACULTY_MENTOR';
      nextId = app.mentorFacultyId;
      nextName = app.mentorFacultyName;
    } else if (decision === 'REJECT') {
      newStatus = 'FACULTY_REJECTED';
      nextRole = 'REJECTED';
    } else {
      newStatus = 'MORE_INFORMATION_REQUIRED';
      nextRole = 'STUDENT';
      nextId = app.studentId;
      nextName = app.studentName;
    }

    app.status = newStatus;
    app.currentHandlerRole = nextRole;
    app.currentHandlerId = nextId;
    app.currentHandlerName = nextName;

    this.auditLogs.push({
      id: `log-${Date.now()}`,
      applicationId: appId,
      action: decision === 'APPROVE' ? 'FACULTY_APPROVED' : decision === 'REJECT' ? 'FACULTY_REJECTED' : 'MORE_INFO_REQUESTED',
      fromUserId: reviewerId,
      fromUserName: app.subjectFacultyName,
      fromUserRole: 'SUBJECT_FACULTY',
      toUserId: nextId,
      toUserName: nextName,
      toUserRole: nextRole,
      remarks,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date()
    });

    return app;
  }

  // Step 2: Mentor Review
  public mentorReview(appId: string, decision: 'APPROVE' | 'REJECT' | 'MORE_INFO', remarks: string, reviewerId: string) {
    const app = this.applications.get(appId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'FACULTY_APPROVED' && app.status !== 'WITH_MENTOR') {
      throw new Error(`Invalid status ${app.status} for mentor review`);
    }

    const prevStatus = app.status;
    let newStatus = '';
    let nextRole = '';
    let nextId = '';
    let nextName = '';

    if (decision === 'APPROVE') {
      newStatus = 'MENTOR_APPROVED';
      nextRole = 'HOD';
      nextId = app.hodUserId;
      nextName = app.hodUserName;
    } else if (decision === 'REJECT') {
      newStatus = 'MENTOR_REJECTED';
      nextRole = 'REJECTED';
    } else {
      newStatus = 'MORE_INFORMATION_REQUIRED';
      nextRole = 'SUBJECT_FACULTY';
      nextId = app.subjectFacultyId;
      nextName = app.subjectFacultyName;
    }

    app.status = newStatus;
    app.currentHandlerRole = nextRole;
    app.currentHandlerId = nextId;
    app.currentHandlerName = nextName;

    this.auditLogs.push({
      id: `log-${Date.now()}`,
      applicationId: appId,
      action: decision === 'APPROVE' ? 'MENTOR_APPROVED' : decision === 'REJECT' ? 'MENTOR_REJECTED' : 'MORE_INFO_REQUESTED',
      fromUserId: reviewerId,
      fromUserName: app.mentorFacultyName,
      fromUserRole: 'FACULTY_MENTOR',
      toUserId: nextId,
      toUserName: nextName,
      toUserRole: nextRole,
      remarks,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date()
    });

    return app;
  }

  // Step 3: HOD Review
  public hodReview(appId: string, decision: 'APPROVE' | 'REJECT' | 'MORE_INFO', remarks: string, reviewerId: string) {
    const app = this.applications.get(appId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'MENTOR_APPROVED' && app.status !== 'WITH_HOD') {
      throw new Error(`Invalid status ${app.status} for HOD review`);
    }

    const prevStatus = app.status;
    let newStatus = '';
    let nextRole = '';
    let nextId = '';
    let nextName = '';

    if (decision === 'APPROVE') {
      newStatus = 'HOD_APPROVED';
      nextRole = 'PRINCIPAL';
      nextId = app.hoiUserId;
      nextName = app.hoiUserName;
    } else if (decision === 'REJECT') {
      newStatus = 'HOD_REJECTED';
      nextRole = 'REJECTED';
    } else {
      newStatus = 'MORE_INFORMATION_REQUIRED';
      nextRole = 'FACULTY_MENTOR';
      nextId = app.mentorFacultyId;
      nextName = app.mentorFacultyName;
    }

    app.status = newStatus;
    app.currentHandlerRole = nextRole;
    app.currentHandlerId = nextId;
    app.currentHandlerName = nextName;

    this.auditLogs.push({
      id: `log-${Date.now()}`,
      applicationId: appId,
      action: decision === 'APPROVE' ? 'HOD_APPROVED' : decision === 'REJECT' ? 'HOD_REJECTED' : 'MORE_INFO_REQUESTED',
      fromUserId: reviewerId,
      fromUserName: app.hodUserName,
      fromUserRole: 'HOD',
      toUserId: nextId,
      toUserName: nextName,
      toUserRole: nextRole,
      remarks,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date()
    });

    return app;
  }

  // Step 4: HOI (Principal) Review & Condonation Grant
  public hoiReview(appId: string, decision: 'APPROVE' | 'REJECT' | 'MORE_INFO', remarks: string, reviewerId: string) {
    const app = this.applications.get(appId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'HOD_APPROVED' && app.status !== 'WITH_HOI') {
      throw new Error(`Invalid status ${app.status} for HOI review`);
    }

    const prevStatus = app.status;
    let newStatus = '';
    let nextRole = '';
    let nextId = '';
    let nextName = '';

    if (decision === 'APPROVE') {
      newStatus = 'FINAL_APPROVED';
      nextRole = 'COMPLETED';
      app.finalEligibilityGranted = true;
      app.eligibilityType = 'ATTENDANCE_APPROVAL';
      // ZERO OVERWRITE: app.currentAttendancePct remains untouched!
    } else if (decision === 'REJECT') {
      newStatus = 'HOI_REJECTED';
      nextRole = 'REJECTED';
      app.finalEligibilityGranted = false;
    } else {
      newStatus = 'MORE_INFORMATION_REQUIRED';
      nextRole = 'HOD';
      nextId = app.hodUserId;
      nextName = app.hodUserName;
      app.finalEligibilityGranted = false;
    }

    app.status = newStatus;
    app.currentHandlerRole = nextRole;
    app.currentHandlerId = nextId;
    app.currentHandlerName = nextName;

    this.auditLogs.push({
      id: `log-${Date.now()}`,
      applicationId: appId,
      action: decision === 'APPROVE' ? 'HOI_APPROVED' : decision === 'REJECT' ? 'HOI_REJECTED' : 'MORE_INFO_REQUESTED',
      fromUserId: reviewerId,
      fromUserName: app.hoiUserName,
      fromUserRole: 'PRINCIPAL',
      toUserId: nextId,
      toUserName: nextName,
      toUserRole: nextRole,
      remarks,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date()
    });

    return app;
  }

  public getApplication(id: string) {
    return this.applications.get(id);
  }

  public getAuditLogs(appId: string) {
    return this.auditLogs.filter(l => l.applicationId === appId);
  }

  // Check exam enrollment eligibility for a subject
  public isExamEnrollmentAllowed(studentId: string, subjectId: string, present: number, total: number): { allowed: boolean; reason?: string } {
    const stats = this.calculateAttendance(present, total);
    if (stats.percentage >= this.minRequiredPct) {
      return { allowed: true };
    }

    // Check if condoned
    for (const app of this.applications.values()) {
      if (app.studentId === studentId && app.subjectId === subjectId && app.status === 'FINAL_APPROVED' && app.finalEligibilityGranted) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `Attendance requirement not fulfilled (Current: ${stats.percentage}%, Required: ${this.minRequiredPct}%). Please apply for Attendance Approval.`
    };
  }
}

function runVerification() {
  console.log('================================================================');
  console.log('SSIU ERP: 13-POINT AUTOMATED ATTENDANCE APPROVAL & CONDONATION TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const engine = new AttendanceWorkflowEngine();

  function test(name: string, fn: () => boolean) {
    try {
      const ok = fn();
      if (ok) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name}`);
        failed++;
      }
    } catch (e: any) {
      console.error(`❌ [FAIL] ${name} - Exception: ${e.message}`);
      failed++;
    }
  }

  // 1. 80% attendance -> EXAM ELIGIBLE status
  test('Test 1: 80% attendance -> EXAM ELIGIBLE status', () => {
    const res = engine.calculateAttendance(32, 40);
    return res.percentage === 80.0 && res.isEligible === true && res.status === 'EXAM_ELIGIBLE';
  });

  // 2. 69% attendance -> ATTENDANCE SHORTAGE status
  test('Test 2: 69% attendance -> ATTENDANCE SHORTAGE status (< 75%)', () => {
    const res = engine.calculateAttendance(29, 42);
    return res.percentage === 69.0 && res.isEligible === false && res.status === 'ATTENDANCE_SHORTAGE';
  });

  // 3. 75.0% attendance -> EXACT THRESHOLD ELIGIBLE status
  test('Test 3: Exact 75.0% attendance meets statutory threshold', () => {
    const res = engine.calculateAttendance(30, 40);
    return res.percentage === 75.0 && res.isEligible === true;
  });

  // 4. Student with 69% attendance cannot submit exam form directly
  test('Test 4: Exam registration blocked for shortage without condonation', () => {
    const check = engine.isExamEnrollmentAllowed('stud-1', 'sub-dsa', 29, 42);
    return check.allowed === false && check.reason?.includes('Attendance requirement not fulfilled');
  });

  // 5. Student creates attendance application for 69% subject
  let app: MockAttendanceApplication;
  test('Test 5: Student creates attendance application with SUBMITTED_TO_FACULTY status', () => {
    app = engine.createApplication('stud-1', 'Aarav Patel', 'SSIU2023CS001', 'sub-dsa', 'CS403', 'Data Structures & Algorithms', 29, 42, 'MEDICAL_ILLNESS');
    return app.status === 'SUBMITTED_TO_FACULTY' && app.currentHandlerRole === 'SUBJECT_FACULTY';
  });

  // 6. Duplicate application blocked for the same subject
  test('Test 6: Duplicate application blocked for the same subject', () => {
    try {
      engine.createApplication('stud-1', 'Aarav Patel', 'SSIU2023CS001', 'sub-dsa', 'CS403', 'Data Structures & Algorithms', 29, 42, 'MEDICAL_ILLNESS');
      return false; // Should have thrown
    } catch (e: any) {
      return e.message.includes('already pending');
    }
  });

  // 7. Faculty Approval: SUBMITTED_TO_FACULTY -> FACULTY_APPROVED (next: MENTOR)
  test('Test 7: Step 1 Faculty Approval transitions to FACULTY_APPROVED and routes to Mentor', () => {
    const updated = engine.facultyReview(app.id, 'APPROVE', 'Medical certificate verified. Recommended.', 'fac-1');
    return updated.status === 'FACULTY_APPROVED' && updated.currentHandlerRole === 'FACULTY_MENTOR';
  });

  // 8. Mentor Approval: FACULTY_APPROVED -> MENTOR_APPROVED (next: HOD)
  test('Test 8: Step 2 Mentor Approval transitions to MENTOR_APPROVED and routes to HOD', () => {
    const updated = engine.mentorReview(app.id, 'APPROVE', 'Good academic conduct.', 'fac-mentor-1');
    return updated.status === 'MENTOR_APPROVED' && updated.currentHandlerRole === 'HOD';
  });

  // 9. HOD Approval: MENTOR_APPROVED -> HOD_APPROVED (next: HOI)
  test('Test 9: Step 3 HOD Approval transitions to HOD_APPROVED and routes to HOI', () => {
    const updated = engine.hodReview(app.id, 'APPROVE', 'Department endorsed for institutional condonation.', 'usr-hod-1');
    return updated.status === 'HOD_APPROVED' && updated.currentHandlerRole === 'PRINCIPAL';
  });

  // 10. HOI Final Approval: HOD_APPROVED -> FINAL_APPROVED, sets finalEligibilityGranted = true
  test('Test 10: Step 4 HOI Final Approval grants exam eligibility', () => {
    const updated = engine.hoiReview(app.id, 'APPROVE', 'Special condonation granted under statutory university guidelines.', 'usr-principal-1');
    return updated.status === 'FINAL_APPROVED' && updated.finalEligibilityGranted === true && updated.currentHandlerRole === 'COMPLETED';
  });

  // 11. Zero Attendance Overwrite Rule: Attendance percentage remains 69% intact
  test('Test 11: ZERO OVERWRITE RULE: Actual attendance percentage (69.0%) preserved intact with ATTENDANCE_APPROVAL', () => {
    const finalApp = engine.getApplication(app.id);
    return finalApp?.currentAttendancePct === 69.0 && finalApp?.finalEligibilityGranted === true && finalApp?.eligibilityType === 'ATTENDANCE_APPROVAL';
  });

  // 12. Student can now submit exam form for condoned subject
  test('Test 12: Exam form unlocked for condoned subject CS403', () => {
    const check = engine.isExamEnrollmentAllowed('stud-1', 'sub-dsa', 29, 42);
    return check.allowed === true;
  });

  // 13. Rejection terminates workflow immediately and records in audit history
  test('Test 13: Rejection terminates flow, leaves finalEligibilityGranted = false, and audits decision', () => {
    const rejectApp = engine.createApplication('stud-2', 'Riya Sharma', 'SSIU2023CS002', 'sub-os', 'CS405', 'Operating Systems', 27, 40, 'OTHER');
    const rejected = engine.facultyReview(rejectApp.id, 'REJECT', 'Insufficient justification.', 'fac-1');
    const logs = engine.getAuditLogs(rejectApp.id);
    return rejected.status === 'FACULTY_REJECTED' && rejected.finalEligibilityGranted === false && logs.length === 2;
  });

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runVerification();
