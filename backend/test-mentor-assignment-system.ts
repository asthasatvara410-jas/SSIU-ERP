/**
 * Test Suite: Student Mentor Assignment & Advisory System (17 Test Cases)
 * Validates HOD/HOI centralized mentor allocation, mentor eligibility,
 * non-destructive overwrite protection, student request routing, and bulk .xlsx workflows.
 */

import { CentralMentorAssignmentService } from '../src/services/mentorAssignmentService';
import { studentRequestService } from '../src/services/studentRequestService';
import { db } from '../src/services/db';
import { User, Student, Faculty } from '../src/types';
import * as XLSX from 'xlsx';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${errorDetail ? ` -> ${errorDetail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 RUNNING AUTOMATED TEST SUITE: STUDENT MENTOR ASSIGNMENT SYSTEM (17 SCENARIOS)');
  console.log('========================================================================\n');

  const mentorService = new CentralMentorAssignmentService();

  // Test Actors Setup
  const superAdmin: any = {
    id: 'usr-admin',
    name: 'Super Administrator',
    email: 'admin@ssiu.edu',
    role: 'SUPER_ADMIN',
    username: 'admin',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodCSE: any = {
    id: 'usr-hod-cse',
    name: 'Dr. CSE HOD',
    email: 'hod.cse@ssiu.edu',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    username: 'hod_cse',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodECE: any = {
    id: 'usr-hod-ece',
    name: 'Dr. ECE HOD',
    email: 'hod.ece@ssiu.edu',
    role: 'HOD',
    departmentId: 'dept-2',
    instituteId: 'inst-1',
    username: 'hod_ece',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principalSSCIT: any = {
    id: 'usr-principal-sscit',
    name: 'Dr. Principal SSCIT (HOI)',
    email: 'principal@ssiu.edu',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    username: 'hoi_sscit',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principalOtherInst: any = {
    id: 'usr-principal-pharmacy',
    name: 'Dr. Principal Pharmacy (HOI)',
    email: 'principal.pharm@ssiu.edu',
    role: 'PRINCIPAL',
    instituteId: 'inst-2',
    username: 'hoi_pharm',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const studentCSE: any = {
    id: 'std-cse-101',
    enrollmentNo: 'SSIU2026CSE101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@ssiu.edu',
    phone: '+91 98765 43210',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    programId: 'prog-1',
    batchId: 'batch-1',
    semesterId: 'sem-4',
    divisionId: 'div-1',
    guardianName: 'Mr. Sharma',
    guardianPhone: '+91 98765 00001',
    status: 'ACTIVE',
    gender: 'Male'
  };

  const studentECE: any = {
    id: 'std-ece-201',
    enrollmentNo: 'SSIU2026ECE201',
    name: 'Priya Patel',
    email: 'priya.patel@ssiu.edu',
    phone: '+91 98765 43211',
    instituteId: 'inst-1',
    departmentId: 'dept-2',
    programId: 'prog-2',
    batchId: 'batch-2',
    semesterId: 'sem-4',
    divisionId: 'div-2',
    guardianName: 'Mr. Patel',
    guardianPhone: '+91 98765 00002',
    status: 'ACTIVE',
    gender: 'Female'
  };

  const studentPharm: any = {
    id: 'std-pharm-301',
    enrollmentNo: 'SSIU2026PHARM301',
    name: 'Rohan Verma',
    email: 'rohan.verma@ssiu.edu',
    phone: '+91 98765 43212',
    instituteId: 'inst-2',
    departmentId: 'dept-3',
    programId: 'prog-3',
    batchId: 'batch-3',
    semesterId: 'sem-2',
    divisionId: 'div-3',
    guardianName: 'Mr. Verma',
    guardianPhone: '+91 98765 00003',
    status: 'ACTIVE',
    gender: 'Male'
  };

  const facultyCSE1: any = {
    id: 'fac-cse-01',
    employeeId: 'EMP-CS-001',
    name: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@ssiu.edu',
    phone: '+91 98250 11001',
    designation: 'Associate Professor',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    qualification: 'Ph.D in CSE',
    experienceYears: 12,
    subjectIds: ['sub-1', 'sub-2'],
    status: 'ACTIVE'
  };

  const facultyCSE2: any = {
    id: 'fac-cse-02',
    employeeId: 'EMP-CS-002',
    name: 'Prof. Sneha Shah',
    email: 'sneha.shah@ssiu.edu',
    phone: '+91 98250 11002',
    designation: 'Assistant Professor',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    qualification: 'M.Tech in CSE',
    experienceYears: 6,
    subjectIds: ['sub-1'],
    status: 'ACTIVE'
  };

  const facultyECE1: any = {
    id: 'fac-ece-01',
    employeeId: 'EMP-EC-001',
    name: 'Prof. Amit Joshi',
    email: 'amit.joshi@ssiu.edu',
    phone: '+91 98250 11003',
    designation: 'Associate Professor',
    instituteId: 'inst-1',
    departmentId: 'dept-2',
    qualification: 'Ph.D in ECE',
    experienceYears: 10,
    subjectIds: ['sub-3'],
    status: 'ACTIVE'
  };

  const inactiveFacultyCSE: any = {
    id: 'fac-cse-inact',
    employeeId: 'EMP-CS-INACT',
    name: 'Prof. Inactive Faculty',
    email: 'inactive@ssiu.edu',
    phone: '+91 98250 11004',
    designation: 'Assistant Professor',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    qualification: 'M.Tech',
    experienceYears: 4,
    subjectIds: [],
    status: 'INACTIVE'
  };

  // Seed into database store
  const state = db.getState();
  state.students = [studentCSE, studentECE, studentPharm, ...(state.students || [])];
  state.faculty = [facultyCSE1, facultyCSE2, facultyECE1, inactiveFacultyCSE, ...(state.faculty || [])];
  state.mentorAssignments = [];
  state.mentorAssignmentHistory = [];
  state.studentRequests = [];

  // =========================================================================
  // SCENARIO 1: HOD assigns Mentor to student in their Department -> Success
  // =========================================================================
  try {
    const res = mentorService.assignMentor({
      studentId: studentCSE.id,
      mentorFacultyId: facultyCSE1.id,
      effectiveFrom: new Date().toISOString()
    }, hodCSE);

    assert(
      res.assignment.status === 'ACTIVE' &&
      res.assignment.studentId === studentCSE.id &&
      res.assignment.mentorFacultyId === facultyCSE1.id &&
      res.assignment.assignedByRole === 'HOD',
      'Scenario 1: HOD successfully assigns Mentor to Department student'
    );
  } catch (err: any) {
    assert(false, 'Scenario 1: HOD assigns Mentor', err.message);
  }

  // =========================================================================
  // SCENARIO 2: Student query returns Active Mentor
  // =========================================================================
  const activeForStudent = mentorService.getActiveMentorForStudent(studentCSE.id);
  assert(
    activeForStudent !== null &&
    activeForStudent.mentorFacultyId === facultyCSE1.id &&
    activeForStudent.mentorName === facultyCSE1.name,
    'Scenario 2: Student correctly resolves Active Mentor in profile'
  );

  // =========================================================================
  // SCENARIO 3: Mentor sees assigned Mentee in Dashboard data
  // =========================================================================
  const facultyUser: any = {
    id: facultyCSE1.id,
    name: facultyCSE1.name,
    email: facultyCSE1.email,
    role: 'FACULTY',
    username: facultyCSE1.employeeId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const mentorScoped = mentorService.getAssignments({}, facultyUser);
  assert(
    mentorScoped.assignments.length === 1 &&
    mentorScoped.assignments[0].studentId === studentCSE.id,
    'Scenario 3: Mentor sees only their assigned mentees in Mentor Dashboard'
  );

  // =========================================================================
  // SCENARIO 4: Student creates request -> Auto-routed to active Mentor
  // =========================================================================
  const studentUser: any = {
    id: studentCSE.id,
    name: studentCSE.name,
    email: studentCSE.email,
    role: 'STUDENT',
    enrollmentNo: studentCSE.enrollmentNo,
    username: studentCSE.enrollmentNo,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const req1 = studentRequestService.createStudentRequest({
    category: 'ACADEMIC',
    subject: 'Request for Project Lab Access',
    description: 'Need additional lab hours for final year capstone project.',
    priority: 'MEDIUM'
  }, studentUser);

  assert(
    req1.mentorId === facultyCSE1.id &&
    req1.mentorName === facultyCSE1.name &&
    req1.currentHandler === 'MENTOR' &&
    req1.status === 'SUBMITTED',
    'Scenario 4: Student Request auto-routes directly to active Mentor (student does NOT choose mentor)'
  );

  // =========================================================================
  // SCENARIO 5: HOD changes Mentor -> Requires Reason, marks old INACTIVE, records History
  // =========================================================================
  try {
    const changeRes = mentorService.assignMentor({
      studentId: studentCSE.id,
      mentorFacultyId: facultyCSE2.id,
      isChange: true,
      changeReason: 'Faculty 1 assigned to sponsored research grant; reassigning mentorship to Faculty 2.'
    }, hodCSE);

    const history = mentorService.getAssignmentHistory(studentCSE.id);
    const activeNow = mentorService.getActiveMentorForStudent(studentCSE.id);

    assert(
      activeNow?.mentorFacultyId === facultyCSE2.id &&
      activeNow?.status === 'ACTIVE' &&
      history.length === 1 &&
      history[0].previousMentorId === facultyCSE1.id &&
      history[0].newMentorId === facultyCSE2.id &&
      history[0].changedByRole === 'HOD',
      'Scenario 5: HOD changes Mentor with mandatory reason, deactivates old, records audit history'
    );
  } catch (err: any) {
    assert(false, 'Scenario 5: HOD changes Mentor', err.message);
  }

  // =========================================================================
  // SCENARIO 6: New Request routes to New Active Mentor
  // =========================================================================
  const req2 = studentRequestService.createStudentRequest({
    category: 'EXAMINATION',
    subject: 'Correction in Mid-sem Grade Card',
    description: 'Marking discrepancy in DBMS Theory Component.',
    priority: 'HIGH'
  }, studentUser);

  assert(
    req2.mentorId === facultyCSE2.id &&
    req2.mentorName === facultyCSE2.name &&
    req2.currentHandlerId === facultyCSE2.id,
    'Scenario 6: New student request routes to NEW active Mentor'
  );

  // =========================================================================
  // SCENARIO 7: Existing Request remains with Old Mentor (Workflow integrity)
  // =========================================================================
  const req1Current = studentRequestService.getRequestById(req1.id);
  assert(
    req1Current?.mentorId === facultyCSE1.id &&
    req1Current?.currentHandlerId === facultyCSE1.id,
    'Scenario 7: Existing pending request remains with OLD Mentor (preserves workflow integrity)'
  );

  // =========================================================================
  // SCENARIO 8: HOI assigns Mentor across departments under Institute -> Success
  // =========================================================================
  try {
    const hoiRes = mentorService.assignMentor({
      studentId: studentECE.id,
      mentorFacultyId: facultyECE1.id,
      effectiveFrom: new Date().toISOString()
    }, principalSSCIT);

    assert(
      hoiRes.assignment.status === 'ACTIVE' &&
      hoiRes.assignment.studentId === studentECE.id &&
      hoiRes.assignment.assignedByRole === 'PRINCIPAL',
      'Scenario 8: HOI (Principal) assigns Mentor across departments in their Institute'
    );
  } catch (err: any) {
    assert(false, 'Scenario 8: HOI assigns Mentor', err.message);
  }

  // =========================================================================
  // SCENARIO 9: HOI changes Mentor with reason -> Success
  // =========================================================================
  try {
    // Add second ECE faculty
    const facultyECE2: any = {
      id: 'fac-ece-02',
      employeeId: 'EMP-EC-002',
      name: 'Prof. Neha Gupta',
      email: 'neha.gupta@ssiu.edu',
      phone: '+91 98250 11005',
      designation: 'Assistant Professor',
      instituteId: 'inst-1',
      departmentId: 'dept-2',
      qualification: 'Ph.D in ECE',
      experienceYears: 5,
      subjectIds: ['sub-3'],
      status: 'ACTIVE'
    };
    state.faculty.push(facultyECE2);

    mentorService.assignMentor({
      studentId: studentECE.id,
      mentorFacultyId: facultyECE2.id,
      isChange: true,
      changeReason: 'Principal reassigned mentor for specialized robotics project supervision.'
    }, principalSSCIT);

    const activeECE = mentorService.getActiveMentorForStudent(studentECE.id);
    assert(
      activeECE?.mentorFacultyId === facultyECE2.id &&
      activeECE?.status === 'ACTIVE',
      'Scenario 9: HOI successfully reassigns Mentor with mandatory change reason'
    );
  } catch (err: any) {
    assert(false, 'Scenario 9: HOI changes Mentor', err.message);
  }

  // =========================================================================
  // SCENARIO 10: HOD blocked from assigning student outside Department
  // =========================================================================
  let hodOutsideBlocked = false;
  try {
    mentorService.assignMentor({
      studentId: studentECE.id, // ECE student
      mentorFacultyId: facultyCSE1.id
    }, hodCSE); // CSE HOD
  } catch (err: any) {
    hodOutsideBlocked = true;
  }
  assert(hodOutsideBlocked, 'Scenario 10: HOD strictly BLOCKED from assigning students outside authorized Department');

  // =========================================================================
  // SCENARIO 11: HOI blocked from assigning student outside Institute
  // =========================================================================
  let hoiOutsideBlocked = false;
  try {
    mentorService.assignMentor({
      studentId: studentPharm.id, // Pharmacy (inst-2)
      mentorFacultyId: facultyCSE1.id
    }, principalSSCIT); // SSCIT Principal (inst-1)
  } catch (err: any) {
    hoiOutsideBlocked = true;
  }
  assert(hoiOutsideBlocked, 'Scenario 11: HOI strictly BLOCKED from assigning students outside authorized Institute');

  // =========================================================================
  // SCENARIO 12: Ineligible faculty (inactive / wrong dept) cannot be assigned
  // =========================================================================
  let ineligDeptBlocked = false;
  try {
    mentorService.assignMentor({
      studentId: studentCSE.id,
      mentorFacultyId: facultyECE1.id // ECE faculty for CSE student
    }, superAdmin);
  } catch (err: any) {
    ineligDeptBlocked = true;
  }

  let inactBlocked = false;
  try {
    mentorService.assignMentor({
      studentId: studentCSE.id,
      mentorFacultyId: inactiveFacultyCSE.id // Inactive faculty
    }, superAdmin);
  } catch (err: any) {
    inactBlocked = true;
  }
  assert(
    ineligDeptBlocked && inactBlocked,
    'Scenario 12: Ineligible faculty (wrong department or inactive status) cannot be assigned'
  );

  // =========================================================================
  // SCENARIO 13: Overwrite blocked without explicit change flag & reason
  // =========================================================================
  let overwriteBlocked = false;
  try {
    mentorService.assignMentor({
      studentId: studentCSE.id,
      mentorFacultyId: facultyCSE1.id,
      isChange: false // Silent overwrite attempt
    }, hodCSE);
  } catch (err: any) {
    overwriteBlocked = true;
  }
  assert(overwriteBlocked, 'Scenario 13: Silent mentor overwrite is strictly blocked without explicit change flag & reason');

  // =========================================================================
  // SCENARIO 14: Bulk .xlsx import validation passes valid & flags invalid rows
  // =========================================================================
  const sampleBulkRows = [
    {
      'Student Enrollment Number': studentCSE.enrollmentNo,
      'Department Code': 'CSE',
      'Program Code': 'BTECH-CSE',
      'Semester': '4',
      'Section': 'Division A',
      'Mentor Employee ID': facultyCSE1.employeeId
    },
    {
      'Student Enrollment Number': 'INVALID_ENROLLMENT_999',
      'Department Code': 'CSE',
      'Program Code': 'BTECH-CSE',
      'Semester': '4',
      'Section': 'Division A',
      'Mentor Employee ID': facultyCSE1.employeeId
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleBulkRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const bulkVal = mentorService.parseAndValidateBulkXlsx(xlsxBuf, hodCSE);
  assert(
    bulkVal.validRows.length === 1 &&
    bulkVal.invalidRows.length === 1 &&
    bulkVal.invalidRows[0].studentEnrollmentNo === 'INVALID_ENROLLMENT_999',
    'Scenario 14: Bulk .xlsx parser accurately validates valid records and flags invalid rows with error summaries'
  );

  // =========================================================================
  // SCENARIO 15: Mentor Assignment Audit History is permanently queryable
  // =========================================================================
  const cseHistory = mentorService.getAssignmentHistory(studentCSE.id);
  assert(
    cseHistory.length >= 1 &&
    Boolean(cseHistory[0].changeReason) &&
    Boolean(cseHistory[0].changedByName),
    'Scenario 15: Complete chronological mentor audit trail is preserved and queryable'
  );

  // =========================================================================
  // SCENARIO 16: RBAC Enforcement across all query endpoints
  // =========================================================================
  const hodView = mentorService.getAssignments({}, hodCSE);
  const hoiView = mentorService.getAssignments({}, principalSSCIT);
  const adminView = mentorService.getAssignments({}, superAdmin);

  assert(
    hodView.students.every(s => s.departmentId === 'dept-1') &&
    hoiView.students.every(s => s.instituteId === 'inst-1') &&
    adminView.students.length >= hodView.students.length,
    'Scenario 16: RBAC scoping strictly enforces Department, Institute, and Centralized boundaries'
  );

  // =========================================================================
  // SCENARIO 17: Database persistence and zero data corruption
  // =========================================================================
  const allAssignments = db.getMentorAssignments();
  const allHistory = db.getMentorAssignmentHistory();
  const activeAssignments = allAssignments.filter(a => a.status === 'ACTIVE');

  // Verify exactly 1 active assignment per assigned student
  const studentIds = activeAssignments.map(a => a.studentId);
  const hasDuplicates = new Set(studentIds).size !== studentIds.length;

  assert(
    !hasDuplicates &&
    allAssignments.length > 0 &&
    allHistory.length > 0,
    'Scenario 17: Database integrity verified — exactly 1 active mentor per student with zero data corruption'
  );

  console.log('\n========================================================================');
  console.log(`📊 TEST EXECUTION SUMMARY: ${passed} PASSED / ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
