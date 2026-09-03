// ==============================================================================
// SWARRNIM UNIVERSITY ERP — PHASE 2: STUDENT PROFILE & DATA CHANGE PORTAL TESTS
// ==============================================================================

import { db } from '../src/services/db';
import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { studentDataChangeRequestService } from '../src/services/studentDataChangeRequestService';
import { mentorAssignmentService } from '../src/services/mentorAssignmentService';
import { studentFeeService } from '../src/services/studentFeeService';
import { Student, User, AdmissionApplication } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
  }
}

async function runStudentProfileTestSuite() {
  console.log('\n==================================================================');
  console.log('  SSIU ERP — PHASE 2: STUDENT PROFILE & DATA CHANGE TEST SUITE');
  console.log('==================================================================\n');

  // ── TEST 1: Seed Onboarded Student & Login Account ──
  console.log('--- Test Suite 1: Student Login Account & Profile Resolution ---');
  const studentAdmin = db.getUsers().find(u => u.role === 'STUDENT_ADMIN') || db.getUsers()[0];
  const facultyMentor = db.getUsers().find(u => u.role === 'FACULTY' || (u as any).isMentor) || db.getUsers().find(u => u.role === 'FACULTY');
  const hodUser = db.getUsers().find(u => u.role === 'HOD') || {
    id: 'user-hod-cse',
    name: 'Dr. Kireet Joshi (HOD)',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    departmentId: 'dept-cse',
    status: 'ACTIVE'
  } as User;

  const testAppId = `app-portal-${Date.now()}`;
  const testEnrollmentNo = `260109${Math.floor(1000 + Math.random() * 9000)}`;
  const testEmail = `rahul.sharma.${Date.now()}@swarrnim.edu.in`;

  const testApp: AdmissionApplication = {
    id: testAppId,
    applicationNumber: `APP-PORTAL-${Date.now().toString().slice(-4)}`,
    admissionNumber: `ADM-2026-${Date.now().toString().slice(-4)}`,
    applicantName: 'Rahul Sharma',
    email: testEmail,
    phone: '+91 98250 88776',
    gender: 'Male',
    dateOfBirth: '2005-11-14',
    bloodGroup: 'O+',
    address: 'Plot 55, Swarrnim Avenue, Gandhinagar',
    fatherName: 'Sharma Vinodbhai',
    fatherPhone: '+91 98250 11223',
    guardianName: 'Sharma Vinodbhai',
    guardianPhone: '+91 98250 11223',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    status: 'APPROVED',
    onboardingStatus: 'READY',
    isFeePaid: true,
    feeReceiptNo: `REC-${Date.now()}`,
    documents: [
      { id: `doc-1-${Date.now()}`, name: '10th Marksheet', status: 'VERIFIED' },
      { id: `doc-2-${Date.now()}`, name: 'Aadhaar ID', status: 'VERIFIED' }
    ]
  };

  db.addEntity('admissionApplications', testApp, 'Registered candidate test application');

  const onboardingResult = studentOnboardingService.onboardStudent({
    applicationId: testAppId,
    customEnrollmentNo: testEnrollmentNo,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    mentorId: facultyMentor?.id || 'fac-1',
    initialFeePaid: 45000,
    feeReceiptNo: `REC-${Date.now()}`
  }, studentAdmin);

  assert(onboardingResult.success === true, 'Student onboarded from admission application');
  const student = onboardingResult.student!;
  assert(Boolean(student), 'Student Master record created in database');
  assert(student.enrollmentNo === testEnrollmentNo, 'Enrollment number matches onboarding assignment');

  // Verify Student User Login Account exists
  const studentUser = db.getUsers().find(u => u.username === testEnrollmentNo || u.id === student.id);
  assert(Boolean(studentUser), 'Student Login Account created with username matching Enrollment Number');
  assert(studentUser?.role === 'STUDENT', 'User login assigned role is STUDENT');
  assert(studentUser?.status === 'ACTIVE', 'User login account status is ACTIVE');

  // ── TEST 2: Student Master Data Read-Only & Scope Resolution ──
  console.log('\n--- Test Suite 2: Student Master Read-Only & Scope Resolution ---');
  const fetchedStudent = db.getStudentById(student.id);
  assert(Boolean(fetchedStudent), 'Student Master retrievable by ID');
  assert(fetchedStudent?.name === 'Rahul Sharma', 'Student name matches master record');
  assert(fetchedStudent?.bloodGroup === 'O+', 'Blood group matches master record');

  // Mentor assignment lookup
  const activeMentor = mentorAssignmentService.getActiveMentorForStudent(student.id);
  assert(activeMentor?.mentorFacultyId === (facultyMentor?.id || 'fac-1') || student.mentorId === (facultyMentor?.id || 'fac-1'), 'Assigned faculty mentor mapped correctly to student');

  // ── TEST 3: Student Data Change Request Initiation ──
  console.log('\n--- Test Suite 3: Data Change Request Initiation by Student ---');
  const initialPhone = student.phone || '+91 98250 88776';
  const newPhone = '+91 98989 11223';

  const changeRequest = studentDataChangeRequestService.createRequest({
    studentId: student.id,
    fieldCategory: 'CONTACT',
    fieldName: 'phone',
    fieldLabel: 'Primary Student Mobile Number',
    newValue: newPhone,
    reason: 'Upgraded to new SIM card and mobile number',
    attachmentName: 'Aadhaar_Updated_Mobile_Proof.pdf',
    attachmentUrl: 'https://docs.swarrnim.edu.in/proofs/aadhaar.pdf'
  }, studentUser!);

  assert(Boolean(changeRequest), 'Data change request created successfully');
  assert(changeRequest.status === 'MENTOR_PENDING', 'Initial status is MENTOR_PENDING');
  assert(changeRequest.oldValue === initialPhone, 'Old value captured correctly from Student Master');
  assert(changeRequest.newValue === newPhone, 'New requested value captured correctly');
  assert(changeRequest.auditLogs && changeRequest.auditLogs.length > 0, 'Audit log trail initialized with CREATED action');

  // Verify Student Master is NOT directly updated yet (Read-Only Enforcement)
  const studentMasterBeforeApproval = db.getStudentById(student.id);
  assert(studentMasterBeforeApproval?.phone === initialPhone, 'Student Master remains UNCHANGED before approvals (Strict Read-Only Enforcement)');

  // ── TEST 4: Duplicate Pending Request Prevention ──
  console.log('\n--- Test Suite 4: Duplicate Pending Request Prevention ---');
  let duplicateThrew = false;
  try {
    studentDataChangeRequestService.createRequest({
      studentId: student.id,
      fieldCategory: 'CONTACT',
      fieldName: 'phone',
      fieldLabel: 'Primary Student Mobile Number',
      newValue: '+91 99999 00000',
      reason: 'Another duplicate change attempt'
    }, studentUser!);
  } catch (e: any) {
    duplicateThrew = true;
  }
  assert(duplicateThrew, 'Duplicate pending request for the same field is strictly rejected');

  // ── TEST 5: Mentor Review Workflow (Approve & Forward to HOD) ──
  console.log('\n--- Test Suite 5: Tier 1 Mentor Review & Recommendation ---');
  
  // Mandatory rejection reason check
  let mentorRejectWithoutReasonThrew = false;
  try {
    studentDataChangeRequestService.mentorReview({
      requestId: changeRequest.id,
      action: 'REJECT',
      remarks: '',
      reviewerUser: facultyMentor!
    });
  } catch (e) {
    mentorRejectWithoutReasonThrew = true;
  }
  assert(mentorRejectWithoutReasonThrew, 'Mentor rejection without remarks is blocked');

  // Mentor APPROVES request
  const mentorApprovedReq = studentDataChangeRequestService.mentorReview({
    requestId: changeRequest.id,
    action: 'APPROVE',
    remarks: 'Verified mobile number SIM ownership proof. Recommended for HOD approval.',
    reviewerUser: facultyMentor!
  });

  assert(mentorApprovedReq.status === 'HOD_PENDING', 'Request status transitioned to HOD_PENDING after Mentor approval');
  assert(mentorApprovedReq.mentorName === facultyMentor?.name, 'Mentor reviewer name recorded');
  assert(mentorApprovedReq.auditLogs?.some(a => a.action === 'MENTOR_APPROVED'), 'Audit trail records MENTOR_APPROVED event');

  // Student Master still unchanged
  const studentMasterAfterMentor = db.getStudentById(student.id);
  assert(studentMasterAfterMentor?.phone === initialPhone, 'Student Master still UNCHANGED after mentor approval (Awaiting final HOD approval)');

  // ── TEST 6: Tier 2 HOD Final Approval & Atomic Student Master Update ──
  console.log('\n--- Test Suite 6: Tier 2 HOD Final Approval & Atomic Master Mutation ---');

  const hodApprovedReq = studentDataChangeRequestService.hodReview({
    requestId: changeRequest.id,
    action: 'APPROVE',
    remarks: 'Final HOD approval granted. Master data updated.',
    reviewerUser: hodUser
  });

  assert(hodApprovedReq.status === 'APPROVED', 'Request status transitioned to APPROVED (APPLIED)');
  assert(hodApprovedReq.auditLogs?.some(a => a.action === 'HOD_APPROVED'), 'Audit trail records HOD_APPROVED event');

  // ── TEST 7: Verification of Master Data Mutation ──
  console.log('\n--- Test Suite 7: Master Data Integrity & Mutation Verification ---');
  const studentMasterAfterHOD = db.getStudentById(student.id);
  assert(studentMasterAfterHOD?.phone === newPhone, 'Student Master phone number ATOMICALLY updated to requested new value');

  // ── TEST 8: Full Audit Trail & Request History Inspection ──
  console.log('\n--- Test Suite 8: Complete Audit History & Regulatory Compliance ---');
  const finalRequests = studentDataChangeRequestService.getAllRequests();
  const targetReq = finalRequests.find(r => r.id === changeRequest.id);
  assert(Boolean(targetReq), 'Request persisted in permanent historical records');
  assert(targetReq?.auditLogs?.length! >= 3, 'Audit log tracks full lifecycle (CREATED → MENTOR_APPROVED → HOD_APPROVED)');
  
  const centralAuditLogs = db.getAuditLogs().filter(a => a.details?.recordId === changeRequest.id || a.action.includes('STUDENT_DATA_CHANGE') || a.action.includes('HOD_APPROVED'));
  assert(centralAuditLogs.length > 0, 'Central ERP audit log tracks student data change events');

  // ── TEST 9: Student Fee Dashboard & Ledger Verification ──
  console.log('\n--- Test Suite 9: Student Fee Ledger & Dashboard Integration ---');
  const feeSummary = studentFeeService.calculateStudentFeeSummary(student.id);
  assert(feeSummary.totalFees >= 0, 'Student fee calculation computed successfully');
  assert(feeSummary.totalPaid >= 0, 'Student paid fee computed successfully');

  // ── TEST 10: Multi-Field Master Change Test (Address, Blood Group, Father Phone) ──
  console.log('\n--- Test Suite 10: Multi-Category Master Changes (Address & Family) ---');
  
  // Test address change
  const addrReq = studentDataChangeRequestService.createRequest({
    studentId: student.id,
    fieldCategory: 'ADDRESS',
    fieldName: 'currentCity',
    fieldLabel: 'Current City',
    newValue: 'Ahmedabad',
    reason: 'Family relocated to Ahmedabad'
  }, studentUser!);

  studentDataChangeRequestService.mentorReview({
    requestId: addrReq.id,
    action: 'APPROVE',
    remarks: 'Address proof checked',
    reviewerUser: facultyMentor!
  });

  studentDataChangeRequestService.hodReview({
    requestId: addrReq.id,
    action: 'APPROVE',
    remarks: 'Approved',
    reviewerUser: hodUser
  });

  const studentWithNewCity = db.getStudentById(student.id);
  assert(studentWithNewCity?.currentCity === 'Ahmedabad', 'Student Master currentCity updated to Ahmedabad after full 2-tier approval');

  // ── Summary ──
  console.log('\n==================================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStudentProfileTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
