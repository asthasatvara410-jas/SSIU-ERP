// ==============================================================================
// SWARRNIM UNIVERSITY ERP — PHASE 4: COMPLETE STUDENT LIFECYCLE WORKFLOW TESTS
// ==============================================================================

import { db } from '../src/services/db';
import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { studentDataChangeRequestService } from '../src/services/studentDataChangeRequestService';
import { mentorAssignmentService } from '../src/services/mentorAssignmentService';
import { studentFeeService } from '../src/services/studentFeeService';
import { feeQueryService } from '../src/services/feeQueryService';
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

async function runStudentLifecycleTestSuite() {
  console.log('\n==================================================================');
  console.log('  SSIU ERP — PHASE 4: COMPLETE STUDENT LIFECYCLE WORKFLOW TEST SUITE');
  console.log('==================================================================\n');

  // RBAC User Roles
  const superAdminUser: User = {
    id: 'user-super-admin',
    name: 'Dr. Vice Chancellor',
    email: 'vc@swarrnim.edu.in',
    role: 'SUPER_ADMIN' as any,
    status: 'ACTIVE'
  };

  const onboardingOfficer: User = {
    id: 'user-onb-officer',
    name: 'Anjali Shah (Onboarding Officer)',
    email: 'onboarding.officer@swarrnim.edu.in',
    role: 'STUDENT_ADMIN',
    status: 'ACTIVE'
  };

  const docVerifier: User = {
    id: 'user-doc-verifier',
    name: 'Mukesh Sharma (Doc Verifier)',
    email: 'docs@swarrnim.edu.in',
    role: 'STUDENT_ADMIN',
    status: 'ACTIVE'
  };

  const financeOfficer: User = {
    id: 'user-finance-officer',
    name: 'Shailesh Parmar (Finance)',
    email: 'finance@swarrnim.edu.in',
    role: 'ACCOUNTS_ADMIN' as any,
    status: 'ACTIVE'
  };

  const mentorFaculty: User = {
    id: 'user-fac-mentor',
    name: 'Prof. Hardik Dave (Mentor)',
    email: 'hardik.dave@swarrnim.edu.in',
    role: 'FACULTY',
    departmentId: 'dept-cse',
    status: 'ACTIVE'
  };

  const hodUser: User = {
    id: 'user-hod-cse',
    name: 'Dr. Kireet Joshi (HOD CSE)',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    departmentId: 'dept-cse',
    status: 'ACTIVE'
  };

  // ── TEST 1: Complete End-to-End Lifecycle Stage Execution ──
  console.log('--- Test Suite 1: Full 15-Stage End-to-End Lifecycle ---');

  // Stage 1: Admission Application Registration
  const ts = Date.now();
  const lifecycleAppId = `app-lc-${ts}`;
  const lifecycleEnrollmentNo = `260109${Math.floor(1000 + Math.random() * 9000)}`;
  const lifecycleEmail = `kunal.patel.${ts}@swarrnim.edu.in`;

  const lifecycleApp: AdmissionApplication = {
    id: lifecycleAppId,
    applicationNumber: `APP-LC-${ts.toString().slice(-4)}`,
    admissionNumber: `ADM-LC-${ts.toString().slice(-4)}`,
    applicantName: 'Kunal Patel',
    email: lifecycleEmail,
    phone: '+91 98250 33445',
    gender: 'Male',
    dateOfBirth: '2005-07-15',
    bloodGroup: 'B+',
    address: 'B-204, Swarrnim Green Residency, Gandhinagar',
    fatherName: 'Patel Bhaveshbhai',
    fatherPhone: '+91 98250 99887',
    guardianName: 'Patel Bhaveshbhai',
    guardianPhone: '+91 98250 99887',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    status: 'PENDING',
    onboardingStatus: 'PENDING',
    isFeePaid: false,
    documents: [
      { id: `doc-1-${ts}`, name: '10th SSC Marksheet', status: 'PENDING' },
      { id: `doc-2-${ts}`, name: '12th HSC Marksheet', status: 'PENDING' },
      { id: `doc-3-${ts}`, name: 'Aadhaar Card', status: 'PENDING' }
    ]
  };
  db.addEntity('admissionApplications', lifecycleApp, 'Stage 1: Admission Application registered');
  assert(Boolean(db.getAdmissionApplications().find(a => a.id === lifecycleAppId)), 'Stage 1: Admission Application registered');

  // Stage 2: Admission Confirmed
  db.updateEntity('admissionApplications', lifecycleAppId, {
    status: 'APPROVED'
  }, 'Stage 2: Admission Confirmed by Admissions Committee');
  const stage2App = db.getAdmissionApplications().find(a => a.id === lifecycleAppId);
  assert(stage2App?.status === 'APPROVED', 'Stage 2: Admission Confirmed status transitioned to APPROVED');

  // Stage 3: Document Verification
  studentOnboardingService.verifyDocument(lifecycleAppId, `doc-1-${ts}`, 'VERIFIED', docVerifier);
  studentOnboardingService.verifyDocument(lifecycleAppId, `doc-2-${ts}`, 'VERIFIED', docVerifier);
  studentOnboardingService.verifyDocument(lifecycleAppId, `doc-3-${ts}`, 'VERIFIED', docVerifier);
  const stage3App = db.getAdmissionApplications().find(a => a.id === lifecycleAppId);
  assert(stage3App?.documents?.every(d => d.status === 'VERIFIED') === true, 'Stage 3: All mandatory documents marked VERIFIED');

  // Stage 4: Fee Verification
  const receiptNo = `SSIU-ADM-REC-${ts.toString().slice(-6)}`;
  studentOnboardingService.verifyFee(lifecycleAppId, 45000, receiptNo, financeOfficer);
  const stage4App = db.getAdmissionApplications().find(a => a.id === lifecycleAppId);
  assert(stage4App?.isFeePaid === true && stage4App?.feeReceiptNo === receiptNo, 'Stage 4: Admission fee verified and settled');

  // Stage 5: Ready to Onboard Evaluation
  const readiness = studentOnboardingService.evaluateReadiness(stage4App!);
  assert(readiness.isReady === true, 'Stage 5: Application evaluated as READY TO ONBOARD');

  // Stage 6, 7, 8, 9: Atomic Student Creation, ID/Enrollment Generation, Mentor Assignment & Login Activation
  const onboardResult = studentOnboardingService.onboardStudent({
    applicationId: lifecycleAppId,
    customEnrollmentNo: lifecycleEnrollmentNo,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    mentorId: mentorFaculty.id,
    initialFeePaid: 45000,
    feeReceiptNo: receiptNo
  }, onboardingOfficer);

  assert(onboardResult.success === true, 'Stage 6: Student Master record created');
  const student = onboardResult.student!;
  assert(student.enrollmentNo === lifecycleEnrollmentNo, 'Stage 7: Unique Enrollment Number generated & mapped');

  const assignedMentor = mentorAssignmentService.getActiveMentorForStudent(student.id);
  assert(assignedMentor?.mentorFacultyId === mentorFaculty.id || student.mentorId === mentorFaculty.id, 'Stage 8: Mentor Assignment recorded');

  const studentUser = db.getUsers().find(u => u.username === lifecycleEnrollmentNo || u.id === student.id);
  assert(studentUser?.role === 'STUDENT' && studentUser?.status === 'ACTIVE', 'Stage 9: Student Login Account activated');

  // Stage 10: Student Profile Access (Read-Only Enforcement)
  const masterStudent = db.getStudentById(student.id);
  assert(masterStudent?.name === 'Kunal Patel' && masterStudent?.bloodGroup === 'B+', 'Stage 10: Student Profile resolved with canonical master data');

  // Stage 11: Academic, Exam, and Fee Access
  const feeSummary = studentFeeService.calculateStudentFeeSummary(student.id);
  assert(feeSummary.totalFees >= 45000 && feeSummary.totalPaid === 45000, 'Stage 11: Fee ledger initialized with confirmed payment');

  // Stage 12: Profile Change Request Initiation
  const dcr = studentDataChangeRequestService.createRequest({
    studentId: student.id,
    fieldCategory: 'CONTACT',
    fieldName: 'phone',
    fieldLabel: 'Primary Student Mobile',
    newValue: '+91 98989 77889',
    reason: 'Updated to new mobile phone'
  }, studentUser!);
  assert(dcr.status === 'MENTOR_PENDING', 'Stage 12: Data change request initiated with status MENTOR_PENDING');

  // Stage 13: Tier 1 Mentor Review & Recommendation
  const mentorApproved = studentDataChangeRequestService.mentorReview({
    requestId: dcr.id,
    action: 'APPROVE',
    remarks: 'Verified student mobile update request. Recommended.',
    reviewerUser: mentorFaculty
  });
  assert(mentorApproved.status === 'HOD_PENDING', 'Stage 13: Mentor approval transitioned request to HOD_PENDING');

  // Stage 14: Tier 2 HOD Final Approval
  const hodApproved = studentDataChangeRequestService.hodReview({
    requestId: dcr.id,
    action: 'APPROVE',
    remarks: 'Final HOD approval granted.',
    reviewerUser: hodUser
  });
  assert(hodApproved.status === 'APPROVED', 'Stage 14: HOD approval transitioned request to APPROVED (APPLIED)');

  // Stage 15: Master Data Update & Audit Log
  const updatedStudent = db.getStudentById(student.id);
  assert(updatedStudent?.phone === '+91 98989 77889', 'Stage 15: Master Data ATOMICALLY updated to requested new value');

  // ── TEST 2: Workflow Rules Enforcement ──
  console.log('\n--- Test Suite 2: Workflow Rules Enforcement ---');

  // Rule 1: Cannot onboard before admission confirmation
  const unconfirmedApp: AdmissionApplication = {
    id: `app-unconf-${ts}`,
    applicationNumber: `APP-UNCONF-${ts.toString().slice(-4)}`,
    admissionNumber: `ADM-UNCONF-${ts.toString().slice(-4)}`,
    applicantName: 'Test Unconfirmed',
    email: `unconf.${ts}@test.com`,
    phone: '+91 98000 00001',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    status: 'PENDING',
    onboardingStatus: 'PENDING',
    isFeePaid: true,
    documents: [{ id: `doc-u-${ts}`, name: 'Docs', status: 'VERIFIED' }]
  };
  db.addEntity('admissionApplications', unconfirmedApp, 'Seed unconfirmed app');
  const resRule1 = studentOnboardingService.onboardStudent({
    applicationId: unconfirmedApp.id,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1'
  }, onboardingOfficer);
  assert(resRule1.success === false, 'Rule 1: Cannot onboard before admission confirmation (Blocked)');

  // Rule 2: Cannot onboard before required documents are verified
  const unverifiedDocsApp: AdmissionApplication = {
    id: `app-undoc-${ts}`,
    applicationNumber: `APP-UNDOC-${ts.toString().slice(-4)}`,
    admissionNumber: `ADM-UNDOC-${ts.toString().slice(-4)}`,
    applicantName: 'Test Unverified Docs',
    email: `undoc.${ts}@test.com`,
    phone: '+91 98000 00002',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    status: 'APPROVED',
    onboardingStatus: 'PENDING',
    isFeePaid: true,
    documents: [{ id: `doc-undoc-${ts}`, name: 'Docs', status: 'PENDING' }]
  };
  db.addEntity('admissionApplications', unverifiedDocsApp, 'Seed unverified docs app');
  const resRule2 = studentOnboardingService.onboardStudent({
    applicationId: unverifiedDocsApp.id,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1'
  }, onboardingOfficer);
  assert(resRule2.success === false, 'Rule 2: Cannot onboard before required documents are verified (Blocked)');

  // Rule 3: Cannot onboard before required fee verification
  const unpaidApp: AdmissionApplication = {
    id: `app-unpaid-${ts}`,
    applicationNumber: `APP-UNPAID-${ts.toString().slice(-4)}`,
    admissionNumber: `ADM-UNPAID-${ts.toString().slice(-4)}`,
    applicantName: 'Test Unpaid Fee',
    email: `unpaid.${ts}@test.com`,
    phone: '+91 98000 00003',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    status: 'APPROVED',
    onboardingStatus: 'PENDING',
    isFeePaid: false,
    documents: [{ id: `doc-unpaid-${ts}`, name: 'Docs', status: 'VERIFIED' }]
  };
  db.addEntity('admissionApplications', unpaidApp, 'Seed unpaid fee app');
  const resRule3 = studentOnboardingService.onboardStudent({
    applicationId: unpaidApp.id,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1'
  }, onboardingOfficer);
  assert(resRule3.success === false, 'Rule 3: Cannot onboard before required fee verification (Blocked)');

  // Rule 4 & 5: Student ID and Enrollment Number uniqueness
  const duplicateEnrollResult = studentOnboardingService.checkDuplicates({
    enrollmentNo: lifecycleEnrollmentNo,
    email: `unique.email.${ts}@test.com`,
    phone: '+91 99999 88888'
  });
  assert(duplicateEnrollResult.hasDuplicate === true, 'Rule 5: Duplicate Enrollment Number strictly detected and blocked');

  // Rule 6: Approval Bypass Prevention (Mentor cannot directly mutate master without HOD approval)
  const bypassDcr = studentDataChangeRequestService.createRequest({
    studentId: student.id,
    fieldCategory: 'PERSONAL',
    fieldName: 'bloodGroup',
    fieldLabel: 'Blood Group',
    newValue: 'AB+',
    reason: 'Testing bypass prevention'
  }, studentUser!);
  studentDataChangeRequestService.mentorReview({
    requestId: bypassDcr.id,
    action: 'APPROVE',
    remarks: 'Mentor approval only',
    reviewerUser: mentorFaculty
  });
  const studentMasterBypassCheck = db.getStudentById(student.id);
  assert(studentMasterBypassCheck?.bloodGroup === 'B+', 'Rule 6: Approval Bypass strictly prevented (Master NOT changed after Mentor approval)');

  // ── TEST 3: RBAC Scoping & Cross-Student Security Isolation ──
  console.log('\n--- Test Suite 3: RBAC Scoping & Security Isolation ---');

  // Student only sees own requests
  const studentScopedRequests = studentDataChangeRequestService.getScopedRequests(studentUser, 'STUDENT');
  assert(studentScopedRequests.every(r => r.studentId === student.id), 'RBAC: Student user can only access own data change requests');

  // Mentor sees assigned student requests
  const mentorScopedRequests = studentDataChangeRequestService.getScopedRequests(mentorFaculty, 'FACULTY');
  assert(mentorScopedRequests.some(r => r.studentId === student.id), 'RBAC: Faculty mentor can access requests from assigned mentee');

  // HOD sees department student requests
  const hodScopedRequests = studentDataChangeRequestService.getScopedRequests(hodUser, 'HOD', { departmentId: 'dept-cse' });
  assert(hodScopedRequests.some(r => r.studentId === student.id), 'RBAC: HOD can access requests from department students');

  // ── TEST 4: Central Audit Trail & Action Verification ──
  console.log('\n--- Test Suite 4: Central Audit Trail & Action Logging ---');
  const allAuditLogs = db.getAuditLogs();
  const studentOnboardLogs = allAuditLogs.filter(a => a.action.includes('STUDENT_ONBOARD') || a.action.includes('STUDENT_CREATED'));
  assert(studentOnboardLogs.length > 0, 'Audit Log: STUDENT_ONBOARDING_COMPLETED and STUDENT_CREATED recorded');

  const dcrAuditLogs = allAuditLogs.filter(a => a.action.includes('STUDENT_DATA_CHANGE') || a.action.includes('HOD_APPROVED'));
  assert(dcrAuditLogs.length > 0, 'Audit Log: Data Change Request and Approval events logged');

  // ── TEST 5: Demo Mode 7 Realistic Seed Records Verification ──
  console.log('\n--- Test Suite 5: Demo Mode Seed Records Verification ---');
  const allApps = db.getAdmissionApplications();
  const allDcr = studentDataChangeRequestService.getAllRequests();

  const pendingAdm = allApps.find(a => a.status === 'PENDING');
  assert(Boolean(pendingAdm), 'Demo Record 1: One pending admission application exists (app-7)');

  const docPending = allApps.find(a => a.status === 'DOCUMENT_VERIFICATION' || (a.documents && a.documents.some(d => d.status === 'PENDING')));
  assert(Boolean(docPending), 'Demo Record 2: One document pending student application exists (app-2)');

  const feePending = allApps.find(a => a.status === 'FEE_PENDING' || (a.isFeePaid === false && a.onboardingStatus === 'DOC_VERIFIED'));
  assert(Boolean(feePending), 'Demo Record 3: One fee pending student application exists (app-3)');

  const readyToOnboard = allApps.find(a => a.onboardingStatus === 'READY');
  assert(Boolean(readyToOnboard), 'Demo Record 4: One ready-to-onboard student application exists (app-1/app-4)');

  const onboarded = allApps.find(a => a.onboardingStatus === 'ONBOARDED' || a.status === 'CONVERTED');
  assert(Boolean(onboarded), 'Demo Record 5: One onboarded student record exists (app-6)');

  const pendingMentorDcr = allDcr.find(r => r.status === 'MENTOR_PENDING');
  assert(Boolean(pendingMentorDcr), 'Demo Record 6: One data change request with pending mentor approval exists (dcr-seed-001)');

  const pendingHodDcr = allDcr.find(r => r.status === 'HOD_PENDING');
  assert(Boolean(pendingHodDcr), 'Demo Record 7: One data change request with pending HOD approval exists (dcr-seed-002)');

  // ── Summary ──
  console.log('\n==================================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStudentLifecycleTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
