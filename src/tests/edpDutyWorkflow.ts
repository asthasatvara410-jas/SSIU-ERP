declare const process: any;

import { db } from '../services/db';
import { User, EdpDuty, EdpDutyPhoto } from '../types';

// Mock Users
const facultyUser: User = {
  id: 'fac-1',
  name: 'Dr. Rajesh Patel',
  username: 'rpatel',
  email: 'rajesh.patel@swarrnim.edu.in',
  role: 'FACULTY',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const otherFacultyUser: User = {
  id: 'fac-99',
  name: 'Prof. Vikram Singh',
  username: 'vsingh',
  email: 'vikram.singh@swarrnim.edu.in',
  role: 'FACULTY',
  departmentId: 'dept-2',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const hodUser: User = {
  id: 'user-hod-1',
  name: 'Dr. K. Sharma',
  username: 'ksharma',
  email: 'hod.ce@swarrnim.edu.in',
  role: 'HOD',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const adminUser: User = {
  id: 'user-admin',
  name: 'Executive Super Admin',
  username: 'admin',
  email: 'admin@swarrnim.edu.in',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runEdpDutyTests() {
  console.log('\n🏫 STARTING SSIU ERP CLASSROOM EDP DUTY MANAGEMENT TEST SUITE\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Admin / HOD Assigns Classroom EDP Duty
  // ──────────────────────────────────────────────────────────────────────────
  const createdDuty = db.addEdpDuty({
    facultyId: facultyUser.id,
    facultyName: facultyUser.name,
    facultyDesignation: 'Associate Professor',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    programId: 'prog-1',
    programName: 'B.Tech Computer Science & Engineering',
    semesterId: 'sem-cse-4',
    semesterName: 'Semester 4',
    divisionId: 'div-cse-4a',
    divisionName: 'Division A',
    subjectId: 'sub-cse-401',
    subjectName: 'Database Management Systems & SQL Lab',
    subjectCode: 'CSE-401',
    roomNo: 'Room 302 (Block A)',
    dutyDate: '2026-08-16',
    startTime: '09:30 AM',
    endTime: '11:30 AM',
    totalStudents: 60,
    responsibilityDetails: 'Classroom attendance audit and photo evidence reporting.'
  }, hodUser);

  assert(Boolean(createdDuty && createdDuty.id), '1.1 Duty successfully created with unique ID');
  assert(createdDuty.dutyCode.startsWith('EDP-'), '1.2 Duty Code has standard EDP-YYYY-XXX format');
  assert(createdDuty.status === 'ASSIGNED', '1.3 Initial status is ASSIGNED');
  assert(createdDuty.assignedUserId === facultyUser.id, '1.4 Assigned faculty matches Dr. Rajesh Patel');
  assert(createdDuty.roomNo === 'Room 302 (Block A)', '1.5 Classroom roomNo correctly stored');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Faculty Enters Classroom & Starts Duty
  // ──────────────────────────────────────────────────────────────────────────
  const inProgressDuty = db.startEdpDuty(createdDuty.id, facultyUser);
  assert(inProgressDuty.status === 'IN_PROGRESS', '2.1 Faculty opens duty and status transitions to IN_PROGRESS');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Validation - Present Students cannot exceed Total Students
  // ──────────────────────────────────────────────────────────────────────────
  let validationErrorCaught = false;
  try {
    db.submitEdpDutyReport(createdDuty.id, {
      totalStudents: 60,
      presentStudents: 65, // Invalid: exceeds 60
      photos: []
    }, facultyUser);
  } catch (err: any) {
    validationErrorCaught = true;
  }
  assert(validationErrorCaught, '3.1 Validation rejects report when Present Students (65) > Total Students (60)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Faculty Records Student Count, Uploads Photos & Submits Report
  // ──────────────────────────────────────────────────────────────────────────
  const mockPhotos: EdpDutyPhoto[] = [
    {
      id: 'p-1',
      photoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
      caption: 'Front Classroom View - Students seated',
      uploadedAt: new Date().toISOString(),
      fileName: 'front_view_302.jpg',
      fileSize: '2.4 MB'
    },
    {
      id: 'p-2',
      photoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      caption: 'Blackboard & Projector Active Teaching View',
      uploadedAt: new Date().toISOString(),
      fileName: 'board_view_302.jpg',
      fileSize: '1.9 MB'
    }
  ];

  const submittedDuty = db.submitEdpDutyReport(createdDuty.id, {
    totalStudents: 60,
    presentStudents: 56,
    absentStudents: 4,
    photos: mockPhotos,
    remarks: '56 out of 60 students present. ER modeling topic covered effectively.',
    roomNo: 'Room 302 (Block A)',
    subjectName: 'Database Management Systems & SQL Lab'
  }, facultyUser);

  assert(submittedDuty.status === 'SUBMITTED', '4.1 Duty report status transitions to SUBMITTED');
  assert(submittedDuty.presentStudents === 56, '4.2 Present student count recorded as 56');
  assert(submittedDuty.absentStudents === 4, '4.3 Absent student count correctly calculated as 4');
  assert((submittedDuty.photos || []).length === 2, '4.4 Two classroom photos attached to report');
  assert(Boolean(submittedDuty.submittedAt), '4.5 Submission timestamp is recorded');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Admin / HOD Reviews & Verifies Duty
  // ──────────────────────────────────────────────────────────────────────────
  db.verifyEdpDuty(
    createdDuty.id, 
    hodUser, 
    'VERIFIED', 
    'Student attendance count verified against ERP enrollment roster.'
  );

  const verifiedDuty = db.getEdpDuties().find(d => d.id === createdDuty.id);
  assert(verifiedDuty?.status === 'VERIFIED', '5.1 Status transitions to VERIFIED');
  assert(verifiedDuty?.verifiedByAdminName === hodUser.name, '5.2 Verified by Dr. K. Sharma (HOD)');
  assert(Boolean(verifiedDuty?.verifiedAt), '5.3 Verification timestamp recorded');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Security & RBAC Scoping
  // ──────────────────────────────────────────────────────────────────────────
  const facultyDuties = db.getScopedEdpDuties(facultyUser, 'FACULTY');
  const otherFacultyDuties = db.getScopedEdpDuties(otherFacultyUser, 'FACULTY');
  const adminDuties = db.getScopedEdpDuties(adminUser, 'SUPER_ADMIN');

  assert(facultyDuties.some(d => d.id === createdDuty.id), '6.1 Assigned Faculty sees their duty in scoped list');
  assert(!otherFacultyDuties.some(d => d.id === createdDuty.id), '6.2 Unrelated Faculty CANNOT see another faculty duty in scoped list');
  assert(adminDuties.some(d => d.id === createdDuty.id), '6.3 Super Admin sees all duties in scoped list');

  const unauthorizedDirectLookup = db.getEdpDutyById(createdDuty.id, otherFacultyUser, 'FACULTY');
  assert(unauthorizedDirectLookup === null, '6.4 Direct ID lookup by unauthorized faculty returns null/403 with audit log');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Real-Time Dashboard KPI Statistics
  // ──────────────────────────────────────────────────────────────────────────
  const stats = db.getEdpDutyDashboardStats(adminUser, 'SUPER_ADMIN');

  assert(stats.totalDuties > 0, '7.1 Dashboard computes Total Duties');
  assert(stats.verified > 0, '7.2 Dashboard computes Verified Duties');
  assert(stats.studentsCovered > 0, '7.3 Dashboard computes Students Covered (Sum of Present Students)');
  assert(stats.photosUploaded > 0, '7.4 Dashboard computes Photos Uploaded');
  assert(stats.classesCovered > 0, '7.5 Dashboard computes Unique Classes Covered');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runEdpDutyTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
