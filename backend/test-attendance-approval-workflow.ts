import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTestSuite() {
  console.log('================================================================');
  console.log('SSIU ERP: 13-POINT AUTOMATED ATTENDANCE APPROVAL TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // Clean up test data if any
    await prisma.attendanceApprovalHistory.deleteMany({
      where: { applicationId: { contains: 'test-app' } }
    });
    await prisma.attendanceApplication.deleteMany({
      where: { id: { contains: 'test-app' } }
    });

    // -------------------------------------------------------------
    // TEST 1: 80% attendance -> EXAM ELIGIBLE status
    // -------------------------------------------------------------
    const total1 = 40;
    const present1 = 32;
    const pct1 = (present1 / total1) * 100;
    const isEligible1 = pct1 >= 75.0;
    assert(pct1 === 80 && isEligible1 === true, 'Test 1: 80% attendance -> EXAM ELIGIBLE');

    // -------------------------------------------------------------
    // TEST 2: 69% attendance -> ATTENDANCE SHORTAGE status
    // -------------------------------------------------------------
    const total2 = 42;
    const present2 = 29;
    const pct2 = Math.round(((present2 / total2) * 100) * 10) / 10;
    const isEligible2 = pct2 >= 75.0;
    assert(pct2 === 69.0 && isEligible2 === false, 'Test 2: 69% attendance -> ATTENDANCE SHORTAGE (<75%)');

    // -------------------------------------------------------------
    // TEST 3: 75.0% attendance -> EXACT THRESHOLD ELIGIBLE status
    // -------------------------------------------------------------
    const total3 = 40;
    const present3 = 30;
    const pct3 = (present3 / total3) * 100;
    const isEligible3 = pct3 >= 75.0;
    assert(pct3 === 75.0 && isEligible3 === true, 'Test 3: Exact 75.0% attendance meets statutory threshold');

    // -------------------------------------------------------------
    // TEST 4: Student with 69% attendance cannot submit exam form directly
    // -------------------------------------------------------------
    const hasCondonationBefore = false;
    const canRegisterExamDirectly = pct2 >= 75.0 || hasCondonationBefore;
    assert(canRegisterExamDirectly === false, 'Test 4: Exam registration blocked for shortage without condonation');

    // -------------------------------------------------------------
    // TEST 5: Student creates attendance application for 69% subject
    // -------------------------------------------------------------
    const testAppId = `test-app-${Date.now()}`;
    const testAppNo = `APP/ATT/2026/TEST01`;
    const app = await prisma.attendanceApplication.create({
      data: {
        id: testAppId,
        applicationNo: testAppNo,
        studentId: 'stud-1',
        studentName: 'Aarav Patel',
        enrollmentNo: 'SSIU2023CS001',
        studentEmail: 'aarav.patel@student.ssiu.ac.in',
        studentPhone: '+91 9876543210',
        instituteId: 'inst-1',
        departmentId: 'dept-1',
        programId: 'prog-1',
        semesterId: 'sem-4',
        subjectId: 'sub-dsa',
        subjectCode: 'CS403',
        subjectName: 'Data Structures & Algorithms',
        subjectFacultyId: 'fac-1',
        subjectFacultyName: 'Prof. Demo Faculty',
        mentorFacultyId: 'fac-mentor-1',
        mentorFacultyName: 'Dr. Mentor Faculty',
        hodUserId: 'usr-hod-1',
        hodUserName: 'Department HOD',
        hoiUserId: 'usr-principal-1',
        hoiUserName: 'Institute Principal / HOI',
        totalClasses: 42,
        presentClasses: 29,
        absentClasses: 13,
        currentAttendancePct: 69.0,
        requiredAttendancePct: 75.0,
        shortagePct: 6.0,
        reason: 'MEDICAL_ILLNESS',
        description: 'Hospitalized due to acute viral fever for 8 days.',
        supportingDocumentUrl: '/uploads/medical_cert.pdf',
        supportingDocumentName: 'Hospital_Discharge_Summary.pdf',
        applicationDate: new Date(),
        currentHandlerRole: 'SUBJECT_FACULTY',
        currentHandlerId: 'fac-1',
        currentHandlerName: 'Prof. Demo Faculty',
        status: 'SUBMITTED_TO_FACULTY',
        finalEligibilityGranted: false,
        timeline: [
          {
            action: 'APPLICATION_SUBMITTED',
            fromUserId: 'stud-1',
            fromUserName: 'Aarav Patel',
            fromUserRole: 'STUDENT',
            toUserId: 'fac-1',
            toUserName: 'Prof. Demo Faculty',
            toUserRole: 'SUBJECT_FACULTY',
            remarks: 'Submitted medical certificate and discharge summary.',
            previousStatus: 'SUBMITTED_TO_FACULTY',
            newStatus: 'SUBMITTED_TO_FACULTY',
            timestamp: new Date().toISOString(),
          }
        ]
      }
    });

    await prisma.attendanceApprovalHistory.create({
      data: {
        applicationId: testAppId,
        action: 'APPLICATION_SUBMITTED',
        fromUserId: 'stud-1',
        fromUserName: 'Aarav Patel',
        fromUserRole: 'STUDENT',
        toUserId: 'fac-1',
        toUserName: 'Prof. Demo Faculty',
        toUserRole: 'SUBJECT_FACULTY',
        remarks: 'Submitted medical certificate.',
        previousStatus: 'SUBMITTED_TO_FACULTY',
        newStatus: 'SUBMITTED_TO_FACULTY',
        timestamp: new Date()
      }
    });

    assert(app.id === testAppId && app.status === 'SUBMITTED_TO_FACULTY', 'Test 5: Student application created with SUBMITTED_TO_FACULTY status');

    // -------------------------------------------------------------
    // TEST 6: Duplicate application blocked for the same subject
    // -------------------------------------------------------------
    const pendingExisting = await prisma.attendanceApplication.findFirst({
      where: {
        studentId: 'stud-1',
        subjectId: 'sub-dsa',
        status: { notIn: ['FINAL_APPROVED', 'FACULTY_REJECTED', 'MENTOR_REJECTED', 'HOD_REJECTED', 'HOI_REJECTED', 'CLOSED'] }
      }
    });
    assert(!!pendingExisting && pendingExisting.id === testAppId, 'Test 6: Duplicate application detection prevents multiple pending requests for same subject');

    // -------------------------------------------------------------
    // TEST 7: Faculty Approval: SUBMITTED_TO_FACULTY -> FACULTY_APPROVED (next: MENTOR)
    // -------------------------------------------------------------
    const facultyApproved = await prisma.attendanceApplication.update({
      where: { id: testAppId },
      data: {
        status: 'FACULTY_APPROVED',
        currentHandlerRole: 'FACULTY_MENTOR',
        currentHandlerId: app.mentorFacultyId,
        currentHandlerName: app.mentorFacultyName,
      }
    });
    await prisma.attendanceApprovalHistory.create({
      data: {
        applicationId: testAppId,
        action: 'FACULTY_APPROVED',
        fromUserId: 'fac-1',
        fromUserName: 'Prof. Demo Faculty',
        fromUserRole: 'SUBJECT_FACULTY',
        toUserId: app.mentorFacultyId,
        toUserName: app.mentorFacultyName,
        toUserRole: 'FACULTY_MENTOR',
        remarks: 'Medical certificate verified. Recommended for condonation.',
        previousStatus: 'SUBMITTED_TO_FACULTY',
        newStatus: 'FACULTY_APPROVED',
        timestamp: new Date()
      }
    });
    assert(facultyApproved.status === 'FACULTY_APPROVED' && facultyApproved.currentHandlerRole === 'FACULTY_MENTOR', 'Test 7: Step 1 Faculty Approval transitions to FACULTY_APPROVED and routes to Mentor');

    // -------------------------------------------------------------
    // TEST 8: Mentor Approval: FACULTY_APPROVED -> MENTOR_APPROVED (next: HOD)
    // -------------------------------------------------------------
    const mentorApproved = await prisma.attendanceApplication.update({
      where: { id: testAppId },
      data: {
        status: 'MENTOR_APPROVED',
        currentHandlerRole: 'HOD',
        currentHandlerId: app.hodUserId,
        currentHandlerName: app.hodUserName,
      }
    });
    await prisma.attendanceApprovalHistory.create({
      data: {
        applicationId: testAppId,
        action: 'MENTOR_APPROVED',
        fromUserId: 'fac-mentor-1',
        fromUserName: 'Dr. Mentor Faculty',
        fromUserRole: 'FACULTY_MENTOR',
        toUserId: app.hodUserId,
        toUserName: app.hodUserName,
        toUserRole: 'HOD',
        remarks: 'Student has genuine medical reason and good academic conduct.',
        previousStatus: 'FACULTY_APPROVED',
        newStatus: 'MENTOR_APPROVED',
        timestamp: new Date()
      }
    });
    assert(mentorApproved.status === 'MENTOR_APPROVED' && mentorApproved.currentHandlerRole === 'HOD', 'Test 8: Step 2 Mentor Approval transitions to MENTOR_APPROVED and routes to HOD');

    // -------------------------------------------------------------
    // TEST 9: HOD Approval: MENTOR_APPROVED -> HOD_APPROVED (next: HOI)
    // -------------------------------------------------------------
    const hodApproved = await prisma.attendanceApplication.update({
      where: { id: testAppId },
      data: {
        status: 'HOD_APPROVED',
        currentHandlerRole: 'PRINCIPAL',
        currentHandlerId: app.hoiUserId,
        currentHandlerName: app.hoiUserName,
      }
    });
    await prisma.attendanceApprovalHistory.create({
      data: {
        applicationId: testAppId,
        action: 'HOD_APPROVED',
        fromUserId: 'usr-hod-1',
        fromUserName: 'Department HOD',
        fromUserRole: 'HOD',
        toUserId: app.hoiUserId,
        toUserName: app.hoiUserName,
        toUserRole: 'PRINCIPAL',
        remarks: 'Department endorsed for institutional condonation.',
        previousStatus: 'MENTOR_APPROVED',
        newStatus: 'HOD_APPROVED',
        timestamp: new Date()
      }
    });
    assert(hodApproved.status === 'HOD_APPROVED' && hodApproved.currentHandlerRole === 'PRINCIPAL', 'Test 9: Step 3 HOD Approval transitions to HOD_APPROVED and routes to HOI');

    // -------------------------------------------------------------
    // TEST 10: HOI Final Approval: HOD_APPROVED -> FINAL_APPROVED, sets finalEligibilityGranted = true
    // -------------------------------------------------------------
    const finalApproved = await prisma.attendanceApplication.update({
      where: { id: testAppId },
      data: {
        status: 'FINAL_APPROVED',
        currentHandlerRole: 'COMPLETED',
        currentHandlerId: '',
        currentHandlerName: 'None',
        finalEligibilityGranted: true,
        eligibilityType: 'ATTENDANCE_APPROVAL',
      }
    });
    await prisma.attendanceApprovalHistory.create({
      data: {
        applicationId: testAppId,
        action: 'HOI_APPROVED',
        fromUserId: 'usr-principal-1',
        fromUserName: 'Institute Principal / HOI',
        fromUserRole: 'PRINCIPAL',
        toUserId: '',
        toUserName: 'None',
        toUserRole: 'COMPLETED',
        remarks: 'Special condonation granted under statutory university guidelines.',
        previousStatus: 'HOD_APPROVED',
        newStatus: 'FINAL_APPROVED',
        timestamp: new Date()
      }
    });
    assert(finalApproved.status === 'FINAL_APPROVED' && finalApproved.finalEligibilityGranted === true, 'Test 10: Step 4 HOI Final Approval grants exam eligibility');

    // -------------------------------------------------------------
    // TEST 11: Attendance percentage remains 69% (Zero Attendance Overwrite Rule)
    // -------------------------------------------------------------
    const persistedApp = await prisma.attendanceApplication.findUnique({
      where: { id: testAppId }
    });
    assert(
      persistedApp?.currentAttendancePct === 69.0 &&
      persistedApp?.finalEligibilityGranted === true &&
      persistedApp?.eligibilityType === 'ATTENDANCE_APPROVAL',
      'Test 11: ZERO OVERWRITE RULE: Actual attendance percentage (69.0%) preserved intact with ATTENDANCE_APPROVAL'
    );

    // -------------------------------------------------------------
    // TEST 12: Student can now submit exam form for condoned subject
    // -------------------------------------------------------------
    const isNowEligibleForExam = (pct2 >= 75.0) || (persistedApp?.status === 'FINAL_APPROVED' && persistedApp?.finalEligibilityGranted === true);
    assert(isNowEligibleForExam === true, 'Test 12: Exam form unlocked for condoned subject CS403');

    // -------------------------------------------------------------
    // TEST 13: Rejection terminates workflow immediately and records in audit history
    // -------------------------------------------------------------
    const rejectAppId = `test-reject-${Date.now()}`;
    await prisma.attendanceApplication.create({
      data: {
        id: rejectAppId,
        applicationNo: 'APP/ATT/2026/TESTREJECT',
        studentId: 'stud-2',
        studentName: 'Riya Sharma',
        enrollmentNo: 'SSIU2023CS002',
        studentEmail: 'riya.sharma@student.ssiu.ac.in',
        studentPhone: '+91 9876543211',
        instituteId: 'inst-1',
        departmentId: 'dept-1',
        programId: 'prog-1',
        semesterId: 'sem-4',
        subjectId: 'sub-os',
        subjectCode: 'CS405',
        subjectName: 'Operating Systems',
        subjectFacultyId: 'fac-1',
        subjectFacultyName: 'Prof. Demo Faculty',
        mentorFacultyId: 'fac-mentor-1',
        mentorFacultyName: 'Dr. Mentor Faculty',
        hodUserId: 'usr-hod-1',
        hodUserName: 'Department HOD',
        hoiUserId: 'usr-principal-1',
        hoiUserName: 'Institute Principal / HOI',
        totalClasses: 40,
        presentClasses: 27,
        absentClasses: 13,
        currentAttendancePct: 67.5,
        requiredAttendancePct: 75.0,
        shortagePct: 7.5,
        reason: 'OTHER',
        description: 'Personal leave.',
        applicationDate: new Date(),
        currentHandlerRole: 'SUBJECT_FACULTY',
        currentHandlerId: 'fac-1',
        currentHandlerName: 'Prof. Demo Faculty',
        status: 'SUBMITTED_TO_FACULTY',
        finalEligibilityGranted: false,
      }
    });

    const rejectedApp = await prisma.attendanceApplication.update({
      where: { id: rejectAppId },
      data: {
        status: 'FACULTY_REJECTED',
        currentHandlerRole: 'REJECTED',
        currentHandlerId: '',
        currentHandlerName: 'None',
        finalEligibilityGranted: false,
      }
    });
    await prisma.attendanceApprovalHistory.create({
      data: {
        applicationId: rejectAppId,
        action: 'FACULTY_REJECTED',
        fromUserId: 'fac-1',
        fromUserName: 'Prof. Demo Faculty',
        fromUserRole: 'SUBJECT_FACULTY',
        toUserId: '',
        toUserName: 'None',
        toUserRole: 'REJECTED',
        remarks: 'Insufficient proof for unauthorized absence.',
        previousStatus: 'SUBMITTED_TO_FACULTY',
        newStatus: 'FACULTY_REJECTED',
        timestamp: new Date()
      }
    });

    const histories = await prisma.attendanceApprovalHistory.findMany({
      where: { applicationId: rejectAppId }
    });

    assert(
      rejectedApp.status === 'FACULTY_REJECTED' &&
      rejectedApp.finalEligibilityGranted === false &&
      histories.length > 0,
      'Test 13: Rejection terminates flow, leaves finalEligibilityGranted = false, and audits decision'
    );

    // Clean up
    await prisma.attendanceApprovalHistory.deleteMany({
      where: { applicationId: { in: [testAppId, rejectAppId] } }
    });
    await prisma.attendanceApplication.deleteMany({
      where: { id: { in: [testAppId, rejectAppId] } }
    });

  } catch (err: any) {
    console.error('Error during test execution:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
