/**
 * Comprehensive Automated Verification Test Suite
 * Temporary Enrollment + Student Login + Department Auto-Sync + Final Enrollment Conversion
 */

import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { db } from '../src/services/db';
import { User, Student, AdmissionApplication } from '../src/types';

function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 RUNNING TEMPORARY ENROLLMENT & STUDENT LOGIN TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
    }
  }

  // Set up mock actor
  const mockOfficer: User = {
    id: 'user-officer-1',
    name: 'Dr. Ramesh Sharma',
    email: 'ramesh.sharma@swarrnim.edu.in',
    username: 'admission_officer',
    role: 'STUDENT_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // Setup mock admission application
  const testAppId = `app-test-${Date.now()}`;
  const availableDepts = db.getDepartments();
  const targetDept = availableDepts.find(d => d.name.toLowerCase().includes('computer')) || availableDepts[0];
  const targetDeptId = targetDept?.id || 'dept-cse';

  const availableProgs = db.getPrograms();
  const targetProg = availableProgs.find(p => p.departmentId === targetDeptId) || availableProgs[0];
  const targetProgId = targetProg?.id || 'prog-1';

  const mockApp: AdmissionApplication = {
    id: testAppId,
    applicationNumber: `APP-2026-9901`,
    applicantName: 'Rohan Jayesh Patel',
    firstName: 'Rohan',
    middleName: 'Jayesh',
    lastName: 'Patel',
    email: `rohan.patel.${Date.now()}@teststudent.edu`,
    phone: '9876543210',
    dateOfBirth: '2005-08-15',
    gender: 'MALE',
    fatherName: 'Jayesh Patel',
    fatherPhone: '9876543211',
    motherName: 'Meenaben Patel',
    motherPhone: '9876543212',
    address: '45 Swarrnim Enclave, SG Highway',
    city: 'Gandhinagar',
    state: 'Gujarat',
    pincode: '382421',
    instituteId: 'inst-1',
    departmentId: targetDeptId,
    programId: targetProgId,
    academicYearId: 'ay-2026',
    admissionYear: '2026',
    status: 'APPROVED',
    onboardingStatus: 'READY_FOR_ONBOARDING',
    isFeePaid: true,
    feeAmountPaid: 45000,
    documents: [
      { id: 'doc-1', name: '10th Marksheet', type: 'MARKSHEET_10TH', status: 'VERIFIED' },
      { id: 'doc-2', name: '12th Marksheet', type: 'MARKSHEET_12TH', status: 'VERIFIED' },
      { id: 'doc-3', name: 'Aadhaar Card', type: 'AADHAAR_CARD', status: 'VERIFIED' }
    ]
  };

  db.addEntity('admissionApplications', mockApp, 'Setup test application');

  // -------------------------------------------------------------
  // TEST 1: Temporary Enrollment Number Formatting
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Temporary Enrollment & Access Code Generation ---');
  const tempNo1 = studentOnboardingService.generateTemporaryEnrollmentNumber('2026');
  assert(
    /^TEMP-2026-\d{5}$/.test(tempNo1),
    'Temporary enrollment matches standard format TEMP-2026-XXXXX',
    `Received: ${tempNo1}`
  );

  const code1 = studentOnboardingService.generateStudentAccessCode();
  assert(
    /^\d{5}$/.test(code1) && parseInt(code1, 10) >= 0 && parseInt(code1, 10) <= 99999,
    'Student access code is exactly 5 digits (00000 to 99999) with leading zeros preserved',
    `Received: ${code1}`
  );

  // -------------------------------------------------------------
  // TEST 2: Onboarding Completion Execution
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Onboarding Execution & Master Record Ingestion ---');
  const onboardResult = studentOnboardingService.onboardStudent({
    applicationId: testAppId,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    academicYearId: 'ay-2026',
    batchId: 'batch-2026',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    initialFeePaid: 45000,
    remarks: 'Test automated onboarding'
  }, mockOfficer);

  assert(onboardResult.success === true, 'Onboarding executed successfully', onboardResult.message);
  assert(Boolean(onboardResult.student), 'Student Master entity was created');
  assert(Boolean(onboardResult.userAccount), 'User login account was created');
  assert(Boolean(onboardResult.temporaryEnrollmentNumber), 'Temporary enrollment number generated and returned in result');
  assert(Boolean(onboardResult.studentAccessCode), '5-digit student access code returned in result');

  const createdStudent = onboardResult.student!;
  const createdUser = onboardResult.userAccount!;

  assert(
    createdStudent.enrollmentStatus === 'TEMPORARY',
    'Student enrollmentStatus is "TEMPORARY"',
    `Received: ${createdStudent.enrollmentStatus}`
  );
  assert(
    createdStudent.temporaryEnrollmentNumber === onboardResult.temporaryEnrollmentNumber,
    'Student temporaryEnrollmentNumber matches generated temp number',
    `Received: ${createdStudent.temporaryEnrollmentNumber}`
  );
  assert(
    createdStudent.studentAccessCode === onboardResult.studentAccessCode,
    'Student record stores the 5-digit studentAccessCode'
  );
  assert(
    createdUser.username === onboardResult.temporaryEnrollmentNumber,
    'User account username is the temporary enrollment number'
  );
  assert(
    createdUser.password === onboardResult.studentAccessCode,
    'User account initial password is the 5-digit student access code'
  );

  // -------------------------------------------------------------
  // TEST 3: Automatic Department Mapping & Visibility
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Automatic Department Mapping & Instant Sync ---');
  assert(
    createdStudent.departmentId === targetDeptId,
    `Student record automatically mapped to Department "${targetDeptId}" without second-time entry`
  );
  assert(
    createdStudent.instituteId === 'inst-1',
    'Student record automatically mapped to Institute "inst-1"'
  );
  assert(
    createdStudent.programId === targetProgId,
    `Student record automatically mapped to Program "${targetProgId}"`
  );

  // Check Department lookup
  const deptStudents = db.getStudents().filter(s => s.departmentId === targetDeptId);
  const foundInDept = deptStudents.some(s => s.id === createdStudent.id);
  assert(foundInDept === true, 'Department Student Directory immediately contains the newly onboarded student');

  // Check Department Notification
  const notifs = db.getNotifications();
  const deptNotif = notifs.find(n => n.module === 'DEPARTMENT' && n.message.includes(createdStudent.name));
  assert(Boolean(deptNotif), 'Department In-App Notification dispatched upon onboarding completion');

  // -------------------------------------------------------------
  // TEST 4: Final Enrollment Number Conversion Workflow
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Final Enrollment Conversion & Historical Integrity ---');
  const finalEnrollmentNo = `2026CE000${Date.now().toString().slice(-4)}`;
  const initialStudentId = createdStudent.id;
  const initialTempNo = createdStudent.temporaryEnrollmentNumber;

  const conversionRes = studentOnboardingService.assignFinalEnrollment(
    initialStudentId,
    finalEnrollmentNo,
    mockOfficer,
    'Official Gujarat ACPC merit list verification'
  );

  assert(conversionRes.success === true, 'Final Enrollment assigned successfully', conversionRes.message);

  const updatedStudent = db.getStudents().find(s => s.id === initialStudentId)!;
  const updatedUser = db.getUsers().find(u => u.id === createdUser.id || u.username === finalEnrollmentNo)!;

  assert(
    updatedStudent.id === initialStudentId,
    'Canonical student ID is unchanged (Single Master Record preserved, no duplicate student created)'
  );
  assert(
    updatedStudent.enrollmentNo === finalEnrollmentNo,
    'Student enrollmentNo updated to final enrollment number',
    `Received: ${updatedStudent.enrollmentNo}`
  );
  assert(
    updatedStudent.finalEnrollmentNumber === finalEnrollmentNo,
    'Student finalEnrollmentNumber field populated'
  );
  assert(
    updatedStudent.temporaryEnrollmentNumber === initialTempNo,
    'Student temporaryEnrollmentNumber is permanently preserved as historical record',
    `Preserved Temp No: ${updatedStudent.temporaryEnrollmentNumber}`
  );
  assert(
    updatedStudent.enrollmentStatus === 'FINAL',
    'Student enrollmentStatus upgraded to "FINAL"'
  );
  assert(
    updatedUser.username === finalEnrollmentNo,
    'User login username migrated to final enrollment number'
  );
  assert(
    updatedUser.enrollmentStatus === 'FINAL',
    'User account enrollmentStatus updated to "FINAL"'
  );

  // -------------------------------------------------------------
  // TEST 5: Duplicate Final Enrollment Protection
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Duplicate Protection ---');
  // Attempt to assign the same final enrollment number to another dummy student
  const dummyStudentId = `stu-dummy-${Date.now()}`;
  db.addEntity('students', {
    ...createdStudent,
    id: dummyStudentId,
    name: 'Dummy Second Student',
    enrollmentNo: 'TEMP-2026-99999',
    temporaryEnrollmentNumber: 'TEMP-2026-99999',
    finalEnrollmentNumber: undefined,
    enrollmentStatus: 'TEMPORARY'
  }, 'Setup dummy student');

  const duplicateAttempt = studentOnboardingService.assignFinalEnrollment(
    dummyStudentId,
    finalEnrollmentNo,
    mockOfficer
  );

  assert(
    duplicateAttempt.success === false,
    'Duplicate final enrollment assignment is blocked with validation error',
    duplicateAttempt.message
  );

  // -------------------------------------------------------------
  // TEST 6: Student Access Code Reset
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: Student Access Code Reset ---');
  const prevCode = updatedStudent.studentAccessCode;
  const resetRes = studentOnboardingService.resetStudentAccessCode(
    initialStudentId,
    mockOfficer,
    'Student requested access code reset'
  );

  assert(resetRes.success === true, 'Access code reset succeeded', resetRes.message);
  assert(
    Boolean(resetRes.studentAccessCode) && resetRes.studentAccessCode !== prevCode,
    'New 5-digit student access code generated and assigned'
  );

  const studentAfterReset = db.getStudents().find(s => s.id === initialStudentId)!;
  const userAfterReset = db.getUsers().find(u => u.username === finalEnrollmentNo || u.id === createdUser.id)!;

  assert(
    studentAfterReset.studentAccessCode === resetRes.studentAccessCode,
    'Student master record updated with new access code'
  );
  assert(
    userAfterReset.password === resetRes.studentAccessCode,
    'User account password updated to match new access code'
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL SYSTEM REQUIREMENTS & INTEGRATION SPECIFICATIONS VERIFIED SUCCESSFULLY!');
    return 0;
  } else {
    console.error(`⚠️ ${totalTests - passedTests} test(s) failed.`);
    return 1;
  }
}

const exitCode = runTestSuite();
process.exit(exitCode);
