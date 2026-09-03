// ==============================================================================
// SWARRNIM UNIVERSITY ERP — PHASE 2: ADMISSION & ONBOARDING WORKFLOW TEST SUITE
// Automated verification for Complete Admission & Onboarding Lifecycle
// ==============================================================================

import { db } from '../src/services/db';
import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { auditLogService } from '../src/services/auditLogService';
import { AdmissionApplication, User } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

async function runAdmissionOnboardingWorkflowTests() {
  console.log('======================================================================');
  console.log('  SSIU ERP — PHASE 2: ADMISSION & ONBOARDING WORKFLOW TEST SUITE');
  console.log('======================================================================\n');

  const users = db.getUsers();
  const superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || users[0];
  const admissionOfficer = users.find(u => u.role === 'STUDENT_ADMIN') || users[0];
  const facultyMentor = users.find(u => u.role === 'FACULTY' || u.role === 'MENTOR') || users[0];

  // ============================================================================
  // SUITE 1: ADMISSION APPLICATION LIFECYCLE & STATUSES
  // ============================================================================
  console.log('--- SUITE 1: Admission Application Creation & Status Transitions ---');

  const uniqueKey = Date.now();
  const appData: Partial<AdmissionApplication> = {
    applicantName: 'Aarav Mukesh Patel',
    firstName: 'Aarav',
    middleName: 'Mukesh',
    lastName: 'Patel',
    email: `aarav.patel.${uniqueKey}@example.com`,
    phone: `98250${Math.floor(Math.random() * 89999 + 10000)}`,
    gender: 'Male',
    dateOfBirth: '2005-09-12',
    bloodGroup: 'B+',
    nationality: 'Indian',
    category: 'GENERAL',
    religion: 'Hindu',
    address: '102 Gokul Dham, Bopal',
    currentAddress: '102 Gokul Dham, Bopal',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380058',
    fatherName: 'Mukesh Patel',
    fatherPhone: '9825012345',
    motherName: 'Meena Patel',
    motherPhone: '9825012346',
    guardianName: 'Mukesh Patel',
    guardianPhone: '9825012345',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    semesterId: 'sem-1',
    batchId: 'batch-2026',
    divisionId: 'div-1',
    status: 'SUBMITTED',
    documents: [
      { id: `doc-${uniqueKey}-1`, name: '10th Standard Marksheet', documentType: 'ACADEMIC', status: 'PENDING' },
      { id: `doc-${uniqueKey}-2`, name: '12th Standard Marksheet', documentType: 'ACADEMIC', status: 'PENDING' },
      { id: `doc-${uniqueKey}-3`, name: 'Aadhaar Card Copy', documentType: 'IDENTITY', status: 'PENDING' },
      { id: `doc-${uniqueKey}-4`, name: 'Diploma Marksheet', documentType: 'ACADEMIC', status: 'PENDING' } // Optional for regular admission
    ]
  };

  // 1. Create Application
  const createdApp = studentOnboardingService.createApplication(appData, admissionOfficer);
  assert(Boolean(createdApp.id), `Admission application created with ID: ${createdApp.id}`);
  assert(Boolean(createdApp.applicationNumber), `Generated Application Number: ${createdApp.applicationNumber}`);
  assert(createdApp.status === 'SUBMITTED', 'Initial Application Status is SUBMITTED');

  // ============================================================================
  // SUITE 2: READY-TO-ONBOARD GATE & BLOCKER DETECTION
  // ============================================================================
  console.log('\n--- SUITE 2: Readiness Evaluation & Blocker Detection ---');

  // Initial state should NOT be ready (Pending approval, docs unverified, fee unpaid)
  let readiness = studentOnboardingService.evaluateReadiness(createdApp);
  assert(!readiness.isReady, 'Applicant is NOT ready to onboard initially');
  assert(readiness.blockers.some(b => b.includes('Admission review')), 'Blocker detected: Admission approval pending');
  assert(readiness.blockers.some(b => b.includes('documents')), 'Blocker detected: Mandatory documents unverified');
  assert(readiness.blockers.some(b => b.includes('fee')), 'Blocker detected: Admission fee verification pending');

  // Attempting to onboard when not ready must fail
  const failedOnboard = studentOnboardingService.onboardStudent({
    applicationId: createdApp.id,
    instituteId: createdApp.instituteId!,
    departmentId: createdApp.departmentId!,
    programId: createdApp.programId!,
    academicYearId: createdApp.academicYearId!,
    batchId: createdApp.batchId!,
    semesterId: createdApp.semesterId!,
    divisionId: createdApp.divisionId!
  }, admissionOfficer);
  assert(!failedOnboard.success, 'Onboarding blocked when prerequisites are not satisfied');

  // ============================================================================
  // SUITE 3: ADMISSION APPROVAL & DOCUMENT VERIFICATION QUEUE
  // ============================================================================
  console.log('\n--- SUITE 3: Admission Approval & Document Queue Verification ---');

  // 1. Approve Admission
  const approvedApp = studentOnboardingService.approveAdmission(createdApp.id, admissionOfficer, 'Merit eligibility verified by Admissions Desk');
  assert(approvedApp.status === 'APPROVED' || approvedApp.status === 'READY_FOR_ONBOARDING', 'Admission status updated to APPROVED');

  // 2. Reject document without mandatory reason should fail
  let caughtRejectionError = false;
  try {
    studentOnboardingService.verifyDocument(createdApp.id, `doc-${uniqueKey}-1`, 'REJECTED', admissionOfficer, '');
  } catch (e) {
    caughtRejectionError = true;
  }
  assert(caughtRejectionError, 'Document rejection strictly enforces mandatory reason');

  // 3. Verify Mandatory Documents
  studentOnboardingService.verifyDocument(createdApp.id, `doc-${uniqueKey}-1`, 'VERIFIED', admissionOfficer, 'Marksheet verified with GSEB portal');
  studentOnboardingService.verifyDocument(createdApp.id, `doc-${uniqueKey}-2`, 'VERIFIED', admissionOfficer, 'Verified original copy');
  studentOnboardingService.verifyDocument(createdApp.id, `doc-${uniqueKey}-3`, 'VERIFIED', admissionOfficer, 'Aadhaar identity verified');

  // 4. Mark Optional Document as N/A (Diploma for 12th pass candidate)
  studentOnboardingService.verifyDocument(createdApp.id, `doc-${uniqueKey}-4`, 'N/A', admissionOfficer, 'Not Applicable — candidate admitted via 12th Science');

  const refreshedApp = db.getAdmissionApplications().find(a => a.id === createdApp.id)!;
  const docsCondition = studentOnboardingService.evaluateReadiness(refreshedApp).conditions.find(c => c.key === 'DOCUMENTS_VERIFICATION');
  assert(Boolean(docsCondition?.passed), 'All documents satisfied (Verified + N/A for optional documents)');

  // ============================================================================
  // SUITE 4: FEE VERIFICATION (TOTAL, PAID, PENDING, PAYMENT STATUS)
  // ============================================================================
  console.log('\n--- SUITE 4: Fee Verification & Ledger Settlement ---');

  studentOnboardingService.verifyFee(
    createdApp.id,
    45000,
    `SSIU-REC-${uniqueKey}`,
    admissionOfficer,
    'PAID',
    60000
  );

  const feeVerifiedApp = db.getAdmissionApplications().find(a => a.id === createdApp.id)!;
  assert(Boolean(feeVerifiedApp.isFeePaid), 'Admission fee verified as PAID');
  assert(feeVerifiedApp.feeAmountPaid === 45000, 'Paid fee recorded as ₹45,000');
  assert(feeVerifiedApp.feePending === 15000, 'Pending fee computed as ₹15,000');
  assert(feeVerifiedApp.feePaymentStatus === 'PAID', 'Payment status is PAID');

  // ============================================================================
  // SUITE 5: READY TO ONBOARD GATING (ALL PREREQUISITES CLEARED)
  // ============================================================================
  console.log('\n--- SUITE 5: Ready-to-Onboard Verification ---');

  readiness = studentOnboardingService.evaluateReadiness(feeVerifiedApp);
  assert(readiness.isReady, 'Applicant is now READY TO ONBOARD (Zero blockers)');
  assert(readiness.blockers.length === 0, 'Zero blockers remaining after approval, doc verification, and fee settlement');

  // ============================================================================
  // SUITE 6: ATOMIC STUDENT ONBOARDING TRANSACTION
  // ============================================================================
  console.log('\n--- SUITE 6: Atomic Student Onboarding Execution ---');

  const customEnrollment = `260101${Math.floor(Math.random() * 8999 + 1000)}`;
  const onboardResult = studentOnboardingService.onboardStudent({
    applicationId: createdApp.id,
    customEnrollmentNo: customEnrollment,
    instituteId: createdApp.instituteId!,
    departmentId: createdApp.departmentId!,
    programId: createdApp.programId!,
    academicYearId: createdApp.academicYearId!,
    batchId: createdApp.batchId!,
    semesterId: createdApp.semesterId!,
    divisionId: createdApp.divisionId!,
    mentorId: facultyMentor.id,
    initialFeePaid: 45000,
    feeReceiptNo: `SSIU-REC-${uniqueKey}`,
    remarks: 'Comprehensive admission onboarding completed via automated workflow'
  }, admissionOfficer);

  assert(onboardResult.success, 'Student Onboarding transaction completed successfully');
  assert(Boolean(onboardResult.student), 'Student Master record created');
  assert(onboardResult.student?.enrollmentNo === customEnrollment, `Assigned Enrollment Number: ${customEnrollment}`);
  assert(onboardResult.student?.studentStatus === 'ACTIVE', 'Student Master status is ACTIVE');
  assert(onboardResult.student?.onboardingStatus === 'ONBOARDED', 'Student Onboarding Status is ONBOARDED');
  assert(onboardResult.student?.mentorId === facultyMentor.id, 'Assigned Faculty Mentor mapped to Student Master');
  assert(onboardResult.student?.fatherName === 'Mukesh Patel', 'Parent details migrated to Student Master without re-entry');
  assert(onboardResult.student?.currentCity === 'Ahmedabad', 'Address details migrated to Student Master without re-entry');

  // 1. Verify Student User Login Account Created
  const studentUser = db.getUsers().find(u => u.username === customEnrollment || u.email === createdApp.email);
  assert(Boolean(studentUser), 'Student User Login Account created in ERP');
  assert(studentUser?.role === 'STUDENT', 'User account assigned role is STUDENT');
  assert(studentUser?.status === 'ACTIVE', 'User account login status is ACTIVE');

  // 2. Verify Verified Documents Migrated to Student Document Vault
  const studentDocs = db.getStudentDocuments().filter(sd => sd.enrollmentNo === customEnrollment);
  assert(studentDocs.length >= 3, `Migrated ${studentDocs.length} verified documents to Student Document Vault`);

  // 3. Verify Fee Record Initialized
  const studentFeeRec = db.getStudentFeeRecords().find(f => f.enrollmentNo === customEnrollment);
  assert(Boolean(studentFeeRec), 'Semester 1 Student Fee Record created and allocated');
  assert(studentFeeRec?.currentPaid === 45000, 'Initial fee payment reflected in Student Fee Record');

  // 4. Verify Audit Log recorded
  const auditLogs = auditLogService.getRecordHistory(onboardResult.student!.id);
  assert(auditLogs.length >= 1, 'Audit Log recorded STUDENT_ONBOARDING_COMPLETED event with provenance');

  // ============================================================================
  // SUITE 7: DUPLICATE STUDENT ONBOARDING PREVENTION
  // ============================================================================
  console.log('\n--- SUITE 7: Duplicate Student Prevention ---');

  // 1. Attempt duplicate onboarding on the already converted application
  const repeatOnboard = studentOnboardingService.onboardStudent({
    applicationId: createdApp.id,
    instituteId: createdApp.instituteId!,
    departmentId: createdApp.departmentId!,
    programId: createdApp.programId!,
    academicYearId: createdApp.academicYearId!,
    batchId: createdApp.batchId!,
    semesterId: createdApp.semesterId!,
    divisionId: createdApp.divisionId!
  }, admissionOfficer);
  assert(!repeatOnboard.success, 'Duplicate onboarding blocked for already onboarded application');

  // 2. Attempt creating another application with the same email
  const dupEmailCheck = studentOnboardingService.checkDuplicates({
    email: createdApp.email!,
    phone: '9999988888',
    enrollmentNo: '9999999999'
  });
  assert(dupEmailCheck.hasDuplicate, 'Duplicate check correctly detects already registered email');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n======================================================================');
  console.log(`  PHASE 2 VERIFICATION COMPLETE: ${passedTests} / ${totalTests} Passed (${failedTests} Failed)`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdmissionOnboardingWorkflowTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
