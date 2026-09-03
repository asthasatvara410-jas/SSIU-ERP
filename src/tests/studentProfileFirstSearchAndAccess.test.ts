// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT PROFILE-FIRST SEARCH & ACCESS TEST SUITE
// ==============================================================================

import { db } from '../services/db';
import { studentProfileAccessService } from '../services/studentProfileAccessService';
import { User, Student, StudentDocument } from '../types';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n========================================================================');
console.log('TEST SUITE: STUDENT PROFILE-FIRST SEARCH + DOCUMENT ACCESS CONTROL');
console.log('========================================================================\n');

// Test Mock Users
const superAdminUser: User = {
  id: 'user-superadmin',
  name: 'Super Admin Officer',
  email: 'admin@ssiu.edu',
  role: 'SUPER_ADMIN',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const registrarUser: User = {
  id: 'user-reg-1',
  name: 'Dr. University Registrar',
  email: 'registrar@ssiu.edu',
  role: 'REGISTRAR',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hoiUserInst1: User = {
  id: 'user-hoi-1',
  name: 'Principal SIT',
  email: 'principal.sit@ssiu.edu',
  role: 'PRINCIPAL',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hoiUserInst2: User = {
  id: 'user-hoi-2',
  name: 'Principal Pharmacy',
  email: 'principal.pharmacy@ssiu.edu',
  role: 'PRINCIPAL',
  instituteId: 'inst-2',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hodUserCSE: User = {
  id: 'user-hod-cse',
  name: 'Dr. HOD Computer Engineering',
  email: 'hod.cse@ssiu.edu',
  role: 'HOD',
  instituteId: 'inst-1',
  departmentId: 'dept-1', // CSE
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hodUserMech: User = {
  id: 'user-hod-mech',
  name: 'Dr. HOD Mechanical',
  email: 'hod.mech@ssiu.edu',
  role: 'HOD',
  instituteId: 'inst-1',
  departmentId: 'dept-2', // Mechanical
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const facultyUserCSE: User = {
  id: 'user-fac-cse',
  name: 'Prof. Faculty CSE',
  email: 'fac.cse@ssiu.edu',
  role: 'FACULTY',
  instituteId: 'inst-1',
  departmentId: 'dept-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const studentSectionStaff: User = {
  id: 'user-sec-staff',
  name: 'Mr. Student Section Officer',
  email: 'studentsection@ssiu.edu',
  role: 'STUDENT_SECTION',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const studentA: Student = {
  id: 'stud-sit-001',
  enrollmentNo: 'SIT-CE-001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@student.ssiu.edu',
  phone: '+91 9876543210',
  gender: 'Male',
  instituteId: 'inst-1',
  departmentId: 'dept-1', // CSE
  programId: 'prog-1',
  batchId: 'batch-2024',
  semesterId: 'sem-4',
  divisionId: 'div-a',
  guardianName: 'Ramesh Sharma',
  guardianPhone: '+91 9876543211',
  abcId: '1234-5678-9012',
  abcIdStatus: 'VERIFIED',
  studentType: 'DOMESTIC',
  status: 'ACTIVE'
};

const studentB: Student = {
  id: 'stud-sit-002',
  enrollmentNo: 'SIT-MECH-002',
  name: 'Rohan Verma',
  email: 'rohan.verma@student.ssiu.edu',
  phone: '+91 9876543220',
  gender: 'Male',
  instituteId: 'inst-1',
  departmentId: 'dept-2', // Mechanical
  programId: 'prog-2',
  batchId: 'batch-2024',
  semesterId: 'sem-4',
  divisionId: 'div-b',
  guardianName: 'Suresh Verma',
  guardianPhone: '+91 9876543221',
  studentType: 'DOMESTIC',
  status: 'ACTIVE'
};

const studentInst2: Student = {
  id: 'stud-pharm-001',
  enrollmentNo: 'SPHARM-001',
  name: 'Pooja Patel',
  email: 'pooja.patel@student.ssiu.edu',
  phone: '+91 9876543230',
  gender: 'Female',
  instituteId: 'inst-2', // Pharmacy
  departmentId: 'dept-pharm-1',
  programId: 'prog-pharm-1',
  batchId: 'batch-2024',
  semesterId: 'sem-2',
  divisionId: 'div-a',
  guardianName: 'Kirit Patel',
  guardianPhone: '+91 9876543231',
  studentType: 'DOMESTIC',
  status: 'ACTIVE'
};

const studentAUser: User = {
  id: 'stud-sit-001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@student.ssiu.edu',
  enrollmentNo: 'SIT-CE-001',
  role: 'STUDENT',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

// Seed test state
db.updateState(state => {
  state.students = [studentA, studentB, studentInst2];
  state.studentDocuments = [
    {
      id: 'doc-10th-aarav',
      studentId: studentA.id,
      studentName: studentA.name,
      enrollmentNo: studentA.enrollmentNo,
      title: '10th Secondary School Marksheet',
      category: 'ACADEMIC',
      fileName: 'Aarav_10th_Marksheet.pdf',
      fileSize: '1.8 MB',
      fileUrl: '/api/docs/aarav_10th.pdf',
      uploadDate: '2026-07-01',
      status: 'VERIFIED',
      isLocked: true,
      verifiedBy: 'Student Section Officer',
      verifiedAt: '2026-07-05T10:00:00Z',
      version: 1,
      verificationHistory: [
        {
          id: 'vh-1',
          documentId: 'doc-10th-aarav',
          documentTitle: '10th Secondary School Marksheet',
          action: 'VERIFIED',
          status: 'VERIFIED',
          verifiedByName: 'Student Section Officer',
          verifiedByRole: 'STUDENT_SECTION',
          timestamp: '2026-07-05T10:00:00Z',
          remarks: 'Original verified against state board records.'
        }
      ]
    },
    {
      id: 'doc-12th-aarav',
      studentId: studentA.id,
      studentName: studentA.name,
      enrollmentNo: studentA.enrollmentNo,
      title: '12th Higher Secondary Marksheet',
      category: 'ACADEMIC',
      fileName: 'Aarav_12th_Marksheet.pdf',
      fileSize: '2.1 MB',
      fileUrl: '/api/docs/aarav_12th.pdf',
      uploadDate: '2026-08-01',
      status: 'PENDING_VERIFICATION',
      isLocked: false,
      version: 1
    }
  ];
}, 'Reset test student state');

// ============================================================================
// 1. STUDENT SEARCH (MINIMAL IDENTITY PREVIEW)
// ============================================================================
console.log('--- 1. Student Search: Minimal Identity Preview ---');
const res = studentProfileAccessService.searchStudents(
  hodUserCSE,
  'HOD',
  'Aarav',
  {},
  1,
  10
);

assert(res.records.length === 1, '1.1 Search returned exactly 1 matching student');
const summary = res.records[0];
assert(summary.name === 'Aarav Sharma', '1.2 Student Name matches');
assert(summary.enrollmentNo === 'SIT-CE-001', '1.3 Enrollment No matches');
assert(summary.status === 'ACTIVE', '1.4 Student Status matches');
assert((summary as any).fileUrl === undefined, '1.5 Direct fileUrl NOT exposed in search result');
assert((summary as any).documentUrl === undefined, '1.6 Direct documentUrl NOT exposed in search result');
assert((summary as any).documents === undefined, '1.7 Raw documents list NOT exposed in search result');

// ============================================================================
// 2. STUDENT PORTAL SECURITY (BLOCKED FROM GLOBAL SEARCH)
// ============================================================================
console.log('\n--- 2. Student Portal Search Exclusion ---');
let studentSearchBlocked = false;
try {
  studentProfileAccessService.searchStudents(studentAUser, 'STUDENT', 'Aarav');
} catch (err: any) {
  if (err.message.includes('403 Forbidden')) {
    studentSearchBlocked = true;
  }
}
assert(studentSearchBlocked, '2.1 Student user is strictly blocked (403 Forbidden) from global student search');

// ============================================================================
// 3. SCOPE ISOLATION (DEPARTMENT & INSTITUTE)
// ============================================================================
console.log('\n--- 3. Scope Isolation (Department & Institute) ---');
const searchResCSE = studentProfileAccessService.searchStudents(hodUserCSE, 'HOD', '');
const foundIds = searchResCSE.records.map(r => r.id);

assert(foundIds.includes(studentA.id), '3.1 HOD CSE can find CSE student');
assert(!foundIds.includes(studentB.id), '3.2 HOD CSE CANNOT find Mechanical student (Department Scoped)');
assert(!foundIds.includes(studentInst2.id), '3.3 HOD CSE CANNOT find Pharmacy student (Institute Scoped)');

let instScopeBlocked = false;
try {
  studentProfileAccessService.getStudentProfile(hoiUserInst1, 'PRINCIPAL', studentInst2.id);
} catch (err: any) {
  if (err.message.includes('403 Forbidden')) {
    instScopeBlocked = true;
  }
}
assert(instScopeBlocked, '3.4 Principal SIT cannot access Pharmacy student profile (403 Forbidden)');

const searchResReg = studentProfileAccessService.searchStudents(registrarUser, 'REGISTRAR', '');
const regFoundIds = searchResReg.records.map(r => r.id);
assert(regFoundIds.includes(studentA.id) && regFoundIds.includes(studentB.id) && regFoundIds.includes(studentInst2.id), '3.5 Registrar has university-wide scope to access all student records');

// ============================================================================
// 4. PROFILE-FIRST ACCESS GATEWAY
// ============================================================================
console.log('\n--- 4. Profile-First Access Gateway ---');
const profile = studentProfileAccessService.getStudentProfile(hodUserCSE, 'HOD', studentA.id);
assert(profile.student.name === 'Aarav Sharma', '4.1 Student Profile loaded successfully');
assert(profile.allowedSections.includes('OVERVIEW'), '4.2 Allowed sections contains OVERVIEW');
assert(profile.allowedSections.includes('DOCUMENTS'), '4.3 Allowed sections contains DOCUMENTS');
assert(profile.allowedSections.includes('ATTENDANCE'), '4.4 Allowed sections contains ATTENDANCE');
assert(profile.allowedSections.includes('EXAMINATIONS'), '4.5 Allowed sections contains EXAMINATIONS');

// ============================================================================
// 5. DIRECT DOCUMENT TAMPERING BLOCKED
// ============================================================================
console.log('\n--- 5. Direct Document URL Tampering Blocked ---');
let tamperedDocBlocked = false;
try {
  studentProfileAccessService.getStudentDocumentFile(
    hodUserMech,
    'HOD',
    studentA.id,
    'doc-10th-aarav',
    'VIEW'
  );
} catch (err: any) {
  if (err.message.includes('403 Forbidden')) {
    tamperedDocBlocked = true;
  }
}
assert(tamperedDocBlocked, '5.1 Direct documentId tampering by unauthorized HOD is blocked with 403 Forbidden');

let crossStudentDocBlocked = false;
try {
  studentProfileAccessService.getStudentDocumentFile(
    studentAUser,
    'STUDENT',
    studentB.id,
    'doc-10th-aarav',
    'DOWNLOAD'
  );
} catch (err: any) {
  if (err.message.includes('403 Forbidden')) {
    crossStudentDocBlocked = true;
  }
}
assert(crossStudentDocBlocked, '5.2 Student A attempting to access Student B document is blocked with 403 Forbidden');

// ============================================================================
// 6. DOCUMENT VERIFICATION WORKFLOW & AUDIT
// ============================================================================
console.log('\n--- 6. Document Verification Workflow & Audit ---');
const verifiedDoc = studentProfileAccessService.verifyStudentDocument(
  studentSectionStaff,
  'STUDENT_SECTION',
  studentA.id,
  'doc-12th-aarav',
  'VERIFY',
  'Original 12th science marksheet verified against Gujarat Board records.'
);

assert(verifiedDoc.status === 'VERIFIED', '6.1 Document status updated to VERIFIED');
assert(verifiedDoc.isLocked === true, '6.2 Document is permanently LOCKED upon verification');
assert(verifiedDoc.verifiedBy?.includes('Mr. Student Section Officer') === true, '6.3 verifiedBy records staff name');
assert(verifiedDoc.verificationHistory?.length === 1, '6.4 Verification history item appended');
assert(verifiedDoc.verificationHistory?.[0].action === 'VERIFIED', '6.5 Verification history action is VERIFIED');

let facultyVerifyBlocked = false;
try {
  studentProfileAccessService.verifyStudentDocument(
    facultyUserCSE,
    'FACULTY',
    studentA.id,
    'doc-12th-aarav',
    'VERIFY',
    'Attempt by faculty'
  );
} catch (err: any) {
  if (err.message.includes('403 Forbidden')) {
    facultyVerifyBlocked = true;
  }
}
assert(facultyVerifyBlocked, '6.6 Regular Faculty blocked from verifying official documents (403 Forbidden)');

// ============================================================================
// 7. AUDIT LOG GENERATION
// ============================================================================
console.log('\n--- 7. Audit Log Generation ---');
const initialLogCount = db.getAuditLogs().length;

studentProfileAccessService.getStudentDocumentFile(
  hodUserCSE,
  'HOD',
  studentA.id,
  'doc-10th-aarav',
  'DOWNLOAD'
);

const newLogs = db.getAuditLogs();
assert(newLogs.length > initialLogCount, '7.1 Audit log entry recorded on document download');
const lastLog = newLogs[0];
assert(lastLog.action === 'DOWNLOAD_STUDENT_DOCUMENT', '7.2 Audit log action recorded as DOWNLOAD_STUDENT_DOCUMENT');
assert(lastLog.details.includes('10th Secondary School Marksheet'), '7.3 Audit log records document title');

// ============================================================================
// 8. CONSOLIDATED STUDENT HISTORY
// ============================================================================
console.log('\n--- 8. Consolidated Student History ---');
const history = studentProfileAccessService.getStudentHistory(hodUserCSE, 'HOD', studentA.id);
assert(history.length > 0, '8.1 Consolidated history returned');
const docHistoryItems = history.filter(h => h.category === 'DOCUMENT');
assert(docHistoryItems.length >= 1, '8.2 Document verification events present in consolidated student history');

console.log('\n========================================================================');
console.log(`TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} tests`);
console.log('========================================================================\n');

if (failCount > 0) {
  throw new Error(`${failCount} tests failed in Student Profile-First Search suite.`);
}
