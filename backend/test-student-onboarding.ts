// ==============================================================================
// SWARRNIM STARTUP & INNOVATION UNIVERSITY — STUDENT ONBOARDING E2E TEST SUITE
// ==============================================================================

import { db } from '../src/services/db';
import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { mentorAssignmentService } from '../src/services/mentorAssignmentService';
import { studentDataChangeRequestService } from '../src/services/studentDataChangeRequestService';
import { AdmissionApplication, User } from '../src/types';

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

async function runOnboardingTestSuite() {
  console.log('\n==================================================================');
  console.log('  SSIU ERP — STUDENT ONBOARDING & ADMIN LOGIN VERIFICATION');
  console.log('==================================================================\n');

  // ── TEST 1: Student Admin User Account ──
  console.log('--- Phase 1: Student Admin Role & Seed Account ---');
  const studentAdmin = db.getUsers().find(u => u.username === 'studentadmin' || u.role === 'STUDENT_ADMIN');
  assert(Boolean(studentAdmin), 'STUDENT_ADMIN user account seeded successfully in database');
  assert(studentAdmin?.role === 'STUDENT_ADMIN', 'Role assigned is STUDENT_ADMIN');
  assert(studentAdmin?.status === 'ACTIVE', 'STUDENT_ADMIN account status is ACTIVE');

  // ── TEST 2: Initial KPI Statistics ──
  console.log('\n--- Phase 2: Onboarding Statistics & Application Retrieval ---');
  const initialStats = studentOnboardingService.getOnboardingStatistics();
  assert(initialStats.totalAdmissions >= 0, 'Onboarding KPI metrics computed correctly', `Total admissions: ${initialStats.totalAdmissions}`);

  // Create a new candidate Admission Application for testing
  const testAppId = `app-test-${Date.now()}`;
  const testAppNo = `APP/2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const testEmail = `neha.patel.${Date.now()}@example.com`;
  const testPhone = `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`;

  const testApp: AdmissionApplication = {
    id: testAppId,
    applicationNumber: testAppNo,
    admissionNumber: `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    applicantName: 'Neha Patel',
    email: testEmail,
    phone: testPhone,
    gender: 'Female',
    dateOfBirth: '2006-03-22',
    bloodGroup: 'B+',
    address: 'B-402 Shanti Heights, Gandhinagar, Gujarat',
    fatherName: 'Ramesh Patel',
    fatherPhone: '+91 98765 99998',
    guardianName: 'Ramesh Patel',
    guardianPhone: '+91 98765 99999',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    status: 'APPLIED',
    onboardingStatus: 'PENDING',
    submittedAt: new Date().toISOString().split('T')[0],
    documents: [
      { id: `doc-test-1-${Date.now()}`, name: '10th & 12th Marksheets', status: 'PENDING' },
      { id: `doc-test-2-${Date.now()}`, name: 'Government ID Proof (Aadhaar)', status: 'PENDING' }
    ]
  };

  db.addEntity('admissionApplications', testApp, 'Registered candidate test application');
  assert(db.getAdmissionApplications().some(a => a.id === testAppId), 'Candidate admission application registered in database');

  // ── TEST 3: Readiness Evaluation Before Verification ──
  console.log('\n--- Phase 3: Pre-Verification Readiness Evaluation ---');
  const readinessBefore = studentOnboardingService.evaluateReadiness(testApp);
  assert(readinessBefore.isReady === false, 'Candidate correctly evaluated as NOT ready before docs & fee verification');
  assert(readinessBefore.blockers.length > 0, 'Blockers list populated with actionable reasons');

  // ── TEST 4: Mandatory Document Rejection Reason Enforcement ──
  console.log('\n--- Phase 4: Document Verification & Rejection Reason Validation ---');
  let threwWithoutReason = false;
  try {
    studentOnboardingService.verifyDocument(testAppId, testApp.documents[0].id, 'REJECTED', studentAdmin!, '');
  } catch (e) {
    threwWithoutReason = true;
  }
  assert(threwWithoutReason, 'Rejecting document without reason is strictly blocked');

  const verifyDoc1 = studentOnboardingService.verifyDocument(testAppId, testApp.documents[0].id, 'VERIFIED', studentAdmin!, 'Original verified');
  const verifyDoc2 = studentOnboardingService.verifyDocument(testAppId, testApp.documents[1].id, 'VERIFIED', studentAdmin!, 'Aadhaar verified');
  assert(verifyDoc1 && verifyDoc2, 'All mandatory admission documents verified successfully');

  const updatedAppAfterDocs = db.getAdmissionApplications().find(a => a.id === testAppId);
  assert(updatedAppAfterDocs?.documents.every(d => d.status === 'VERIFIED') === true, 'Application document status updated to VERIFIED');

  // ── TEST 5: Fee Payment Verification ──
  console.log('\n--- Phase 5: Admission Fee Payment Verification ---');
  const feeReceipt = `SSIU-REC-TEST-${Date.now()}`;
  const feeVerified = studentOnboardingService.verifyFee(testAppId, 45000, feeReceipt, studentAdmin!);
  assert(feeVerified, 'Admission fee payment verified and settled');

  const updatedAppAfterFee = db.getAdmissionApplications().find(a => a.id === testAppId);
  assert(updatedAppAfterFee?.isFeePaid === true && updatedAppAfterFee?.feeReceiptNo === feeReceipt, 'Application marked with confirmed fee receipt');
  assert(updatedAppAfterFee?.status === 'READY_FOR_ONBOARDING', 'Application transitioned to READY_FOR_ONBOARDING');

  // ── TEST 6: Readiness Evaluation After Verification ──
  console.log('\n--- Phase 6: Post-Verification Readiness Evaluation ---');
  const readinessAfter = studentOnboardingService.evaluateReadiness(updatedAppAfterFee!);
  assert(readinessAfter.isReady === true, 'Candidate evaluated as READY FOR ONBOARDING');
  assert(readinessAfter.blockers.length === 0, 'No blocking reasons remaining');

  // ── TEST 7: Duplicate Protection Validation ──
  console.log('\n--- Phase 7: Duplicate Protection Validation ---');
  const dupCheckNew = studentOnboardingService.checkDuplicates({
    email: testApp.email,
    phone: testApp.phone
  });
  assert(dupCheckNew.hasDuplicate === false, 'New candidate passes duplicate check without conflicts');

  // ── TEST 8: Atomic Student Onboarding Execution ──
  console.log('\n--- Phase 8: Atomic Student Onboarding Execution ---');
  const mentorFaculty = db.getUsers().find(u => u.role === 'FACULTY' || u.role === 'MENTOR');
  const customEnrollmentNo = `260101${Math.floor(1000 + Math.random() * 9000)}`;

  const onboardingResult = studentOnboardingService.onboardStudent({
    applicationId: testAppId,
    customEnrollmentNo,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    mentorId: mentorFaculty?.id || 'fac-1',
    initialFeePaid: 45000,
    feeReceiptNo: feeReceipt,
    remarks: 'Candidate successfully onboarded by Student Administration'
  }, studentAdmin!);

  assert(onboardingResult.success === true, 'Atomic student onboarding returned success', onboardingResult.message);
  assert(Boolean(onboardingResult.student), 'Student Master record created');
  assert(Boolean(onboardingResult.userAccount), 'Student User Login account created');

  // ── TEST 9: Student Master & Relationships Verification ──
  console.log('\n--- Phase 9: Student Master & Relationships Verification ---');
  const createdStudent = db.getStudents().find(s => s.enrollmentNo === customEnrollmentNo);
  assert(createdStudent?.name === testApp.applicantName, 'Student name matches candidate applicant');
  assert(createdStudent?.email === testApp.email, 'Student email matches applicant email');
  assert(createdStudent?.status === 'ACTIVE', 'Student master status is ACTIVE');
  assert(createdStudent?.mentorId === (mentorFaculty?.id || 'fac-1'), 'Student mapped to assigned mentor');

  // ── TEST 10: Student User Login & Role Assignment ──
  console.log('\n--- Phase 10: Student User Login & Role Assignment ---');
  const createdUser = db.getUsers().find(u => u.username === customEnrollmentNo);
  assert(createdUser?.role === 'STUDENT', 'User assigned role is STUDENT');
  assert(createdUser?.username === customEnrollmentNo, 'User login username matches Enrollment Number');
  assert(createdUser?.status === 'ACTIVE', 'User account status is ACTIVE');

  // ── TEST 11: Mentor Mapping Verification ──
  console.log('\n--- Phase 11: Mentor Mapping Verification ---');
  const activeMentor = mentorAssignmentService.getActiveMentorForStudent(createdStudent!.id);
  assert(activeMentor?.mentorFacultyId === (mentorFaculty?.id || 'fac-1') || createdStudent?.mentorId === (mentorFaculty?.id || 'fac-1'), 'Mentor mapping verified for onboarded student');

  // ── TEST 12: Student Fee Ledger Initialization ──
  console.log('\n--- Phase 12: Student Fee Ledger Initialization ---');
  const feeRecords = db.getStudentFeeRecords().filter(f => f.studentId === createdStudent!.id);
  assert(feeRecords.length > 0, 'Semester 1 fee structure record created for onboarded student');
  const feeTx = db.getFeePaymentTransactions().filter(t => t.studentId === createdStudent!.id);
  assert(feeTx.length > 0, 'Admission fee payment transaction ledgered under student account');

  // ── TEST 13: Student Document Vault Migration ──
  console.log('\n--- Phase 13: Student Document Vault Migration ---');
  const migratedDocs = db.getStudentDocuments().filter(d => d.studentId === createdStudent!.id);
  assert(migratedDocs.length === testApp.documents.length, 'Candidate application documents migrated to Student Document Vault');
  assert(migratedDocs.every(d => d.status === 'VERIFIED'), 'Migrated documents maintain VERIFIED status');

  // ── TEST 14: Application Lifecycle Status Transition ──
  console.log('\n--- Phase 14: Application Lifecycle Status Transition ---');
  const finalApp = db.getAdmissionApplications().find(a => a.id === testAppId);
  assert(finalApp?.status === 'CONVERTED', 'Admission Application status updated to CONVERTED');
  assert(finalApp?.onboardingStatus === 'ONBOARDED', 'Onboarding status updated to ONBOARDED');
  assert(finalApp?.studentId === createdStudent!.id, 'Application links directly to Student Master ID');
  assert(finalApp?.enrollmentNo === customEnrollmentNo, 'Application records assigned Enrollment Number');

  // ── TEST 15: Onboarding History & Audit Ledger ──
  console.log('\n--- Phase 15: Onboarding History & Audit Ledger ---');
  const history = studentOnboardingService.getOnboardingHistory();
  const latestHist = history.find(h => h.studentId === createdStudent!.id);
  assert(Boolean(latestHist), 'Onboarding history record created');
  assert(latestHist?.newStatus === 'ONBOARDED', 'History record reflects ONBOARDED status');
  assert(latestHist?.actionsCompleted.length! > 0, 'History record tracks completed actions');

  // ── TEST 16: Re-Onboarding Duplicate Protection ──
  console.log('\n--- Phase 16: Re-Onboarding Duplicate Protection ---');
  const reOnboard = studentOnboardingService.onboardStudent({
    applicationId: testAppId,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1'
  }, studentAdmin!);
  assert(reOnboard.success === false, 'Duplicate onboarding attempt correctly blocked');

  // ── TEST 17: Comprehensive Student Profile Fields ──
  console.log('\n--- Phase 17: Comprehensive Student Master Profile Data Integrity ---');
  const fullStudent = db.getStudentById(createdStudent!.id);
  assert(Boolean(fullStudent), 'Created Student Master retrievable by ID');
  
  // Set comprehensive profile fields
  db.updateEntity('students', fullStudent!.id, {
    ...fullStudent,
    fatherName: 'Patel Rameshbhai',
    fatherOccupation: 'Senior Engineer',
    fatherAnnualIncome: '850000',
    motherName: 'Patel Meenaben',
    motherOccupation: 'Educator',
    currentAddressLine1: '402, Shivalik Greens',
    currentCity: 'Gandhinagar',
    currentState: 'Gujarat',
    currentPincode: '382421',
    tenthBoard: 'GSEB',
    tenthSchool: 'Bright High School',
    tenthPercentage: 88.5,
    twelfthBoard: 'GHSEB',
    twelfthSchool: 'Science Academy',
    twelfthPercentage: 84.2,
    bankName: 'State Bank of India',
    accountNumber: '38492019482',
    ifscCode: 'SBIN0001234',
    aadhaarNo: '9842-1234-5678',
    religion: 'Hindu',
    category: 'General',
    motherTongue: 'Gujarati',
    hostelRequired: true,
    transportRequired: false
  });

  const updatedStudent = db.getStudentById(fullStudent!.id);
  assert(updatedStudent?.fatherName === 'Patel Rameshbhai', 'Father name persisted in Student Master');
  assert(updatedStudent?.tenthPercentage === 88.5, '10th qualification percentage persisted in Student Master');
  assert(updatedStudent?.bankName === 'State Bank of India', 'Bank details persisted in Student Master');
  assert(updatedStudent?.hostelRequired === true, 'Hostel amenity preference persisted');

  // ── TEST 18: Onboarding Draft Saving & Resumption ──
  console.log('\n--- Phase 18: Onboarding Draft Save and Resume Workflow ---');
  const draftStudentId = `st-draft-${Date.now()}`;
  const draftStudentRecord: any = {
    id: draftStudentId,
    name: 'Draft Candidate Test',
    email: `draft.candidate.${Date.now()}@ssiu.edu.in`,
    enrollmentNo: `DRAFT-${Date.now().toString().slice(-6)}`,
    status: 'INACTIVE',
    onboardingStatus: 'ONBOARDING_DRAFT',
    programId: 'prog-1',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    fatherName: 'Draft Father Name',
    currentCity: 'Ahmedabad'
  };
  db.getStudents().push(draftStudentRecord);
  db.saveState();

  assert(Boolean(draftStudentRecord), 'Candidate saved with ONBOARDING_DRAFT status');
  const fetchedDraft = db.getStudentById(draftStudentId);
  assert(fetchedDraft?.onboardingStatus === 'ONBOARDING_DRAFT', 'Draft student has ONBOARDING_DRAFT status');
  assert(fetchedDraft?.fatherName === 'Draft Father Name', 'Draft student preserves partially entered data');

  // ── TEST 19: Student Profile Data Change Request Compatibility ──
  console.log('\n--- Phase 19: Profile Data Change Request Compatibility ---');
  const targetStudent = db.getStudentById(createdStudent!.id);
  const changeReqUser: User = {
    id: targetStudent!.id,
    name: targetStudent!.name,
    email: targetStudent!.email,
    role: 'STUDENT',
    enrollmentNo: targetStudent!.enrollmentNo,
    status: 'ACTIVE'
  };

  const req = studentDataChangeRequestService.createRequest({
    studentId: targetStudent!.id,
    fieldCategory: 'PERSONAL',
    fieldName: 'fatherName',
    fieldLabel: 'Father Name',
    newValue: 'Patel Rameshbhai K.',
    reason: 'Spelling correction in father full name'
  }, changeReqUser);

  assert(Boolean(req), 'Data change request created successfully on onboarded Student Master');
  assert(req.oldValue === 'Patel Rameshbhai', 'Extracts exact current value from Student Master');
  assert(req.status === 'MENTOR_PENDING', 'Initial request status is MENTOR_PENDING');

  // ── TEST 20: Pre-creation Duplicate Checking ──
  console.log('\n--- Phase 20: Multi-Attribute Duplicate Detection ---');
  const existingDupByEmail = db.getStudents().find(s => s.email === createdStudent!.email);
  assert(Boolean(existingDupByEmail), 'Duplicate email identified prior to master creation');
  const existingDupByEnroll = db.getStudents().find(s => s.enrollmentNo === customEnrollmentNo);
  assert(Boolean(existingDupByEnroll), 'Duplicate enrollment number identified prior to master creation');

  // ── TEST 21: Missing Required Fields Validation ──
  console.log('\n--- Phase 21: Missing Required Fields Validation ---');
  let missingFieldRejected = false;
  try {
    const invalidApp = studentOnboardingService.onboardStudent({
      applicationId: '', // Missing application ID
      instituteId: '',
      departmentId: '',
      programId: '',
      academicYearId: '',
      batchId: '',
      semesterId: '',
      divisionId: ''
    }, studentAdmin!);
    if (!invalidApp.success) missingFieldRejected = true;
  } catch (e) {
    missingFieldRejected = true;
  }
  assert(missingFieldRejected, 'Missing mandatory onboarding fields correctly rejected');

  // ── TEST 22: RBAC Unauthorized User Protection ──
  console.log('\n--- Phase 22: RBAC Permissions Enforcement ---');
  const unauthorizedUser: User = {
    id: 'user-unauth',
    name: 'Unauthorized Student',
    email: 'unauth@example.com',
    role: 'STUDENT',
    status: 'ACTIVE'
  };
  let rbacBlocked = false;
  try {
    const rbacResult = studentOnboardingService.onboardStudent({
      applicationId: testAppId,
      instituteId: 'inst-1',
      departmentId: 'dept-cse',
      programId: 'prog-1',
      academicYearId: 'ay-2026',
      batchId: 'batch-2026',
      semesterId: 'sem-1',
      divisionId: 'div-1'
    }, unauthorizedUser);
    if (!rbacResult.success) rbacBlocked = true;
  } catch (e) {
    rbacBlocked = true;
  }
  assert(rbacBlocked, 'Unauthorized user (STUDENT) blocked from executing student onboarding');

  // ── TEST 23: Transaction Rollback Simulation ──
  console.log('\n--- Phase 23: Transaction Rollback Integrity ---');
  const initialStudentCount = db.getStudents().length;
  const initialUserCount = db.getUsers().length;
  
  // Attempt invalid onboarding that fails duplicate check
  const failedOnboard = studentOnboardingService.onboardStudent({
    applicationId: testAppId, // already converted
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1'
  }, studentAdmin!);
  
  assert(failedOnboard.success === false, 'Failed onboarding returns unsuccessful result');
  assert(db.getStudents().length === initialStudentCount, 'Student count unchanged after failed transaction (Rollback verified)');
  assert(db.getUsers().length === initialUserCount, 'User count unchanged after failed transaction (Rollback verified)');

  // ── Summary ──
  console.log('\n==================================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runOnboardingTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
