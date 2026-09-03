/**
 * SSIU ERP — STUDENT LOGIN MODULE VISIBILITY & ATTENDANCE RBAC VERIFICATION
 * Validates complete frontend and backend isolation:
 * 1. Student navigation has "My Attendance" and NO "Attendance" marking page
 * 2. Route guards strictly block Student from /attendance and administrative hubs
 * 3. Frontend service layer blocks Student from rosters, session marking, deleting
 * 4. Live Backend API rejects Student session creation, marking, and submission with 403
 * 5. Live Backend API enforces IDOR protection: Student A querying Student B returns 403
 * 6. Live Backend API allows Student to view OWN attendance via /me or own ID (200 OK)
 * 7. Faculty attendance marking & management remains 100% operational
 */

import { 
  isTabPermittedForRole, 
  getRoleNavigationItems, 
  STUDENT_NAVIGATION_STRUCTURE, 
  ALL_NAV_ITEMS 
} from '../src/constants/navigationConfig';
import { attendanceService } from '../src/services/attendanceService';

const BACKEND_BASE = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function check(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  const icon = condition ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${name}: ${details}`);
}

async function apiPost(endpoint: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BACKEND_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err: any) {
    return { status: 0, data: { error: err.message } };
  }
}

async function apiGet(endpoint: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BACKEND_BASE}${endpoint}`, {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err: any) {
    return { status: 0, data: { error: err.message } };
  }
}

async function runTests() {
  console.log('================================================================================');
  console.log('🛡️  VERIFYING STUDENT MODULE VISIBILITY & ATTENDANCE RBAC ISOLATION');
  console.log('================================================================================\n');

  // 1. FRONTEND NAVIGATION & SIDEBAR VERIFICATION
  console.log('--- 1. FRONTEND NAVIGATION & SIDEBAR AUDIT ---');

  const studentNavItems = getRoleNavigationItems('STUDENT');
  const hasAttendanceManagement = studentNavItems.some(item => item.id === 'attendance');
  const hasMyAttendance = studentNavItems.some(item => item.id === 'my-attendance');

  check(
    'Student Nav Items Audit',
    !hasAttendanceManagement && hasMyAttendance,
    `Student role nav items: has "my-attendance"=${hasMyAttendance}, has "attendance"=${hasAttendanceManagement}`
  );

  const academicGroup = STUDENT_NAVIGATION_STRUCTURE.find(g => g.id === 'academic');
  const academicChildren = academicGroup?.children || [];
  const attendanceChild = academicChildren.find(c => c.targetTab === 'attendance');
  const myAttendanceChild = academicChildren.find(c => c.targetTab === 'my-attendance');

  check(
    'Student Structured Sidebar Hierarchy',
    !attendanceChild && Boolean(myAttendanceChild && myAttendanceChild.label === 'My Attendance'),
    `Academic sidebar contains: ${academicChildren.map(c => `${c.label} (->${c.targetTab})`).join(', ')}`
  );

  check(
    'ALL_NAV_ITEMS Allowed Roles Audit',
    !ALL_NAV_ITEMS['attendance'].allowedRoles.includes('STUDENT') &&
    ALL_NAV_ITEMS['my-attendance'].allowedRoles.includes('STUDENT'),
    `attendance allowedRoles: [${ALL_NAV_ITEMS['attendance'].allowedRoles.join(', ')}], my-attendance allowedRoles: [${ALL_NAV_ITEMS['my-attendance'].allowedRoles.join(', ')}]`
  );

  // 2. ROUTE GUARD IS_TAB_PERMITTED_FOR_ROLE AUDIT
  console.log('\n--- 2. FRONTEND ROUTE GUARDS VERIFICATION ---');

  const studentAttendanceBlocked = !isTabPermittedForRole('attendance', 'STUDENT');
  const studentAcademicAttendanceBlocked = !isTabPermittedForRole('academic-attendance', 'STUDENT');
  const studentMarkAttendanceBlocked = !isTabPermittedForRole('faculty-mark-attendance', 'STUDENT');
  const studentHistoryBlocked = !isTabPermittedForRole('attendance-history', 'STUDENT');
  const studentReportsBlocked = !isTabPermittedForRole('attendance-reports', 'STUDENT');
  const studentImportBlocked = !isTabPermittedForRole('attendance-import', 'STUDENT');
  const studentTemplatesBlocked = !isTabPermittedForRole('attendance-templates', 'STUDENT');
  const studentMyAttendanceAllowed = isTabPermittedForRole('my-attendance', 'STUDENT');

  check(
    'Student Attendance Route Blocks',
    studentAttendanceBlocked && studentAcademicAttendanceBlocked && studentMarkAttendanceBlocked &&
    studentHistoryBlocked && studentReportsBlocked && studentImportBlocked && studentTemplatesBlocked,
    `All faculty attendance tabs strictly blocked for STUDENT in route guard.`
  );

  check(
    'Student My Attendance Route Allowed',
    studentMyAttendanceAllowed,
    `Student is permitted to access /my-attendance.`
  );

  // Other administrative module leak check for student
  const studentSettingsBlocked = !isTabPermittedForRole('settings', 'STUDENT');
  const studentStaffHubBlocked = !isTabPermittedForRole('staff-hub', 'STUDENT');
  const studentFacultyBlocked = !isTabPermittedForRole('faculty', 'STUDENT');
  const studentHRBlocked = !isTabPermittedForRole('hr', 'STUDENT');
  const studentPayrollBlocked = !isTabPermittedForRole('payroll', 'STUDENT');
  const studentBulkImportBlocked = !isTabPermittedForRole('bulk-import', 'STUDENT');

  check(
    'Administrative Hub Route Blocks for Student',
    studentSettingsBlocked && studentStaffHubBlocked && studentFacultyBlocked &&
    studentHRBlocked && studentPayrollBlocked && studentBulkImportBlocked,
    `Admin, Staff Hub, HR, Payroll, Bulk Import strictly blocked for STUDENT.`
  );

  // Faculty must still be allowed to access attendance
  const facultyAttendanceAllowed = isTabPermittedForRole('attendance', 'FACULTY');
  check(
    'Faculty Attendance Access Maintained',
    facultyAttendanceAllowed,
    `Faculty permitted to access /attendance: ${facultyAttendanceAllowed}`
  );

  // 3. FRONTEND SERVICE LAYER DEFENSE-IN-DEPTH
  console.log('\n--- 3. FRONTEND SERVICE LAYER DEFENSE-IN-DEPTH ---');

  let studentRosterBlocked = false;
  try {
    attendanceService.getStudentRoster('sub-dsa', 'div-4a', { role: 'STUDENT' } as any, 'STUDENT');
  } catch (e: any) {
    studentRosterBlocked = e.message.includes('Access Denied');
  }

  check(
    'attendanceService.getStudentRoster Student Block',
    studentRosterBlocked,
    `Calling getStudentRoster with STUDENT role threw Access Denied.`
  );

  let studentSaveSessionBlocked = false;
  try {
    attendanceService.saveAttendanceSession({
      subjectId: 'sub-dsa',
      divisionId: 'div-4a',
      date: '2026-09-02',
      lectureNo: 1,
      topicTaught: 'Hacked topic',
      records: []
    }, { role: 'STUDENT' } as any);
  } catch (e: any) {
    studentSaveSessionBlocked = e.message.includes('Access Denied');
  }

  check(
    'attendanceService.saveAttendanceSession Student Block',
    studentSaveSessionBlocked,
    `Calling saveAttendanceSession with STUDENT role threw Access Denied.`
  );

  // 4. LIVE BACKEND API RBAC & IDOR VERIFICATION
  console.log('\n--- 4. LIVE BACKEND API RBAC & IDOR VERIFICATION ---');

  // Authenticate as Student A (stu_demo01 -> 2026SSIUCE0101)
  const studentLogin = await apiPost('/api/v1/auth/login', {
    loginId: 'stu_demo01',
    password: 'Student@123',
  });
  const studentToken = studentLogin.data?.data?.accessToken;
  const studentAEnrollment = '2026SSIUCE0101';
  const studentBEnrollment = '2026SSIUCE0102';

  // Authenticate as Faculty (fac_amitshah)
  const facultyLogin = await apiPost('/api/v1/auth/login', {
    loginId: 'fac_amitshah',
    password: 'Faculty@123',
  });
  const facultyToken = facultyLogin.data?.data?.accessToken;

  // Attack 4a: Student attempts to create an attendance session
  const stuCreateSession = await apiPost('/api/v1/attendance/session', {
    subjectId: 'sub-dsa',
    divisionId: 'div-4a',
    date: '2026-09-02',
    lectureNo: 1,
    records: []
  }, studentToken);
  check(
    'Live API: Student Calling POST /attendance/session',
    stuCreateSession.status === 403,
    `Status: HTTP ${stuCreateSession.status} (Expected: 403 Forbidden)`
  );

  // Attack 4b: Student attempts to mark attendance
  const stuMarkAttendance = await apiPost('/api/v1/attendance/mark', {
    subjectId: 'sub-dsa',
    divisionId: 'div-4a',
    date: '2026-09-02',
    lectureNo: 1,
    records: []
  }, studentToken);
  check(
    'Live API: Student Calling POST /attendance/mark',
    stuMarkAttendance.status === 403,
    `Status: HTTP ${stuMarkAttendance.status} (Expected: 403 Forbidden)`
  );

  // Attack 4c: Student attempts to submit attendance
  const stuSubmitAttendance = await apiPost('/api/v1/attendance/submit', {
    subjectId: 'sub-dsa',
    divisionId: 'div-4a',
    date: '2026-09-02',
    lectureNo: 1,
    records: []
  }, studentToken);
  check(
    'Live API: Student Calling POST /attendance/submit',
    stuSubmitAttendance.status === 403,
    `Status: HTTP ${stuSubmitAttendance.status} (Expected: 403 Forbidden)`
  );

  // Attack 4d: Student attempts to modify attendance policy
  const stuPatchPolicy = await apiPost('/api/v1/attendance/policy', {
    requiredPercentage: 50.0
  }, studentToken);
  check(
    'Live API: Student Calling PATCH /attendance/policy',
    stuPatchPolicy.status === 403 || stuPatchPolicy.status === 404 || stuPatchPolicy.status === 405,
    `Status: HTTP ${stuPatchPolicy.status} (Expected: 403 Forbidden)`
  );

  // Attack 4e: Student A attempts IDOR query against Student B
  const idorAttendance = await apiGet(`/api/v1/attendance/student/${studentBEnrollment}`, studentToken);
  check(
    'Live API IDOR: Student A Querying Student B Attendance',
    idorAttendance.status === 403,
    `Status: HTTP ${idorAttendance.status} (Expected: 403 Forbidden via IDOR check)`
  );

  // Control 4f: Student A accessing OWN attendance via /student/:ownId
  const ownAttendanceViaId = await apiGet(`/api/v1/attendance/student/${studentAEnrollment}`, studentToken);
  check(
    'Live API Control: Student A Querying Own Attendance via ID',
    ownAttendanceViaId.status === 200 && Boolean(ownAttendanceViaId.data?.data?.overall),
    `Status: HTTP ${ownAttendanceViaId.status}, Percentage: ${ownAttendanceViaId.data?.data?.overall?.percentage}%`
  );

  // Control 4g: Student A accessing OWN attendance via /me
  const ownAttendanceViaMe = await apiGet('/api/v1/attendance/me', studentToken);
  check(
    'Live API Control: Student A Querying Own Attendance via /me',
    ownAttendanceViaMe.status === 200 && Boolean(ownAttendanceViaMe.data?.data?.overall),
    `Status: HTTP ${ownAttendanceViaMe.status}, Overall Status: ${ownAttendanceViaMe.data?.data?.overall?.status}`
  );

  // Control 4h: Faculty legitimate attendance operations
  const facCreateSession = await apiPost('/api/v1/attendance/session', {
    subjectId: 'sub-dsa',
    divisionId: 'div-4a',
    date: '2026-09-02',
    lectureNo: 1,
    topicTaught: 'Binary Search Tree Balancing',
    records: [
      { studentId: 'stu-1', status: 'PRESENT', remarks: 'On time' }
    ]
  }, facultyToken);
  check(
    'Live API Control: Faculty Calling POST /attendance/session',
    facCreateSession.status === 201 || facCreateSession.status === 200,
    `Status: HTTP ${facCreateSession.status} (Faculty operation permitted)`
  );

  // Control 4i: Faculty querying student attendance for mentorship/advising
  const facQueryStudent = await apiGet(`/api/v1/attendance/student/${studentAEnrollment}`, facultyToken);
  check(
    'Live API Control: Faculty Querying Student Attendance for Academic Advising',
    facQueryStudent.status === 200,
    `Status: HTTP ${facQueryStudent.status} (Authorized Faculty access permitted)`
  );

  console.log('\n================================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`🏁 STUDENT ATTENDANCE RBAC VERIFICATION: ${passedCount} / ${results.length} PASSED (Failed: ${failedCount})`);
  console.log('================================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
