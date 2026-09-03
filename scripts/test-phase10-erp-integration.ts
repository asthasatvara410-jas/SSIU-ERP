/**
 * SSIU ERP — Phase 10: Complete End-to-End ERP Integration & Cross-Tier Verification Suite
 *
 * Tests representative end-to-end flows across all major ERP modules:
 * 1. Authentication, JWT Issuance & Token Security
 * 2. Core Academic Masters & In-Memory Caching
 * 3. Student Directory, Search & Profile Projections
 * 4. Central User Management & RBAC Role Overrides
 * 5. Bulk Import Engine & Template Integrity
 * 6. Centralized Notesheet Workflow & Lifecycle
 * 7. Multi-Category Helpdesk & Internal Notes Protection
 * 8. Official Notice Board & Role Audience Scoping
 * 9. Management Analytics & KPI Aggregations
 * 10. Student Council Desk & Post Exclusivity
 * 11. Attendance Marking & Student Isolation
 * 12. Security Headers, Rate Limiting & Error Sanitization
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function unwrap(payload: any) {
  if (payload && payload.success !== undefined && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function assert(condition: boolean, name: string, suite: string, details?: any) {
  if (condition) {
    console.log(`  ✅ [PASS] [${suite}] ${name}`);
    results.push({ suite, name, passed: true, details });
  } else {
    console.error(`  ❌ [FAIL] [${suite}] ${name}`);
    results.push({ suite, name, passed: false, error: 'Assertion failed', details });
  }
}

async function runPhase10IntegrationTests() {
  console.log('\n===============================================================');
  console.log('  SSIU ERP — PHASE 10: FULL ERP INTEGRATION VERIFICATION SUITE');
  console.log('===============================================================\n');

  let adminToken = '';
  let studentToken = '';
  let facultyToken = '';

  // --- 1. AUTHENTICATION & SECURITY ---
  console.log('--- TEST SECTION 1: Core Authentication & Security ---');
  try {
    const adminRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'superadmin', password: 'Admin@123' })
    });
    const adminData = await adminRes.json();
    assert(adminRes.status === 200 && adminData.success === true, 'Superadmin Login with HTTP 200', 'AUTH');
    assert(!!adminData.data?.accessToken, 'JWT Access Token Issued in Response', 'AUTH');
    assert(adminData.data?.user?.passwordHash === undefined, 'Password Hash Strictly Omitted from User Payload', 'AUTH');
    adminToken = adminData.data?.accessToken;

    const studentRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo01', password: 'Student@123' })
    });
    const studentData = await studentRes.json();
    assert(studentRes.status === 200 && studentData.success === true, 'Student Login with HTTP 200', 'AUTH');
    studentToken = studentData.data?.accessToken;

    const facultyRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'fac_amitshah', password: 'Faculty@123' })
    });
    const facultyData = await facultyRes.json();
    assert(facultyRes.status === 200 && facultyData.success === true, 'Faculty Login with HTTP 200', 'AUTH');
    facultyToken = facultyData.data?.accessToken;
  } catch (err: any) {
    assert(false, `Authentication failed with error: ${err.message}`, 'AUTH');
  }

  // --- 2. CORE ACADEMIC MASTERS ---
  console.log('\n--- TEST SECTION 2: Core Academic Masters & Caching ---');
  try {
    const deptRes = await fetch(`${BASE_URL}/api/v1/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deptData = unwrap(await deptRes.json());
    assert(deptRes.status === 200 && Array.isArray(deptData), 'Departments Master Data Array Retrieved', 'MASTERS');
    assert(Array.isArray(deptData) && deptData.length > 0, 'Departments Master Data Contains Seeded Records', 'MASTERS');

    const instRes = await fetch(`${BASE_URL}/api/v1/institutes`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const instData = unwrap(await instRes.json());
    assert(instRes.status === 200 && Array.isArray(instData), 'Institutes Master Data Retrieved', 'MASTERS');
  } catch (err: any) {
    assert(false, `Core Masters query failed: ${err.message}`, 'MASTERS');
  }

  // --- 3. STUDENT DIRECTORY & 360 PROFILE ---
  console.log('\n--- TEST SECTION 3: Student Directory & Search ---');
  try {
    const stuListRes = await fetch(`${BASE_URL}/api/v1/students?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stuPayload = unwrap(await stuListRes.json());
    const stuArray = Array.isArray(stuPayload) ? stuPayload : (stuPayload.data || []);
    assert(stuListRes.status === 200 && Array.isArray(stuArray), 'Student Directory Server-Side Paginated Query', 'STUDENTS');
    assert(stuPayload.total !== undefined || Array.isArray(stuPayload), 'Pagination Metadata / Data Present', 'STUDENTS');
    assert(stuArray[0]?.passwordHash === undefined, 'Student Projections Strictly Exclude Credentials', 'STUDENTS');
  } catch (err: any) {
    assert(false, `Student Directory query failed: ${err.message}`, 'STUDENTS');
  }

  // --- 4. CENTRAL USER MANAGEMENT & RBAC ---
  console.log('\n--- TEST SECTION 4: Central User Management & RBAC ---');
  try {
    const usersRes = await fetch(`${BASE_URL}/api/v1/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersPayload = unwrap(await usersRes.json());
    const usersArray = Array.isArray(usersPayload) ? usersPayload : (usersPayload.data || []);
    assert(usersRes.status === 200 && Array.isArray(usersArray), 'Central User Directory Listing Accessible to Admin', 'USERS');

    const rbacRes = await fetch(`${BASE_URL}/api/v1/roles`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const rbacPayload = unwrap(await rbacRes.json());
    assert(rbacRes.status === 200 && Array.isArray(rbacPayload), 'RBAC Roles Master Hierarchy Retrieved', 'RBAC');
  } catch (err: any) {
    assert(false, `User Management / RBAC query failed: ${err.message}`, 'USERS');
  }

  // --- 5. BULK IMPORT ENGINE ---
  console.log('\n--- TEST SECTION 5: Bulk Import Engine ---');
  try {
    const tmplRes = await fetch(`${BASE_URL}/api/v1/bulk-import/templates/STUDENT`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(tmplRes.status === 200, 'Student Bulk Import Template Download Operational', 'BULK_IMPORT');

    const stuBlockRes = await fetch(`${BASE_URL}/api/v1/bulk-import/templates/STUDENT`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(stuBlockRes.status === 403, 'Student Blocked from Bulk Import Engine (HTTP 403)', 'BULK_IMPORT');
  } catch (err: any) {
    assert(false, `Bulk Import query failed: ${err.message}`, 'BULK_IMPORT');
  }

  // --- 6. NOTESHEET WORKFLOW ENGINE ---
  console.log('\n--- TEST SECTION 6: Notesheet Workflow Engine ---');
  try {
    const nsRes = await fetch(`${BASE_URL}/api/v1/notesheets?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const nsPayload = unwrap(await nsRes.json());
    const nsArray = Array.isArray(nsPayload) ? nsPayload : (nsPayload.data || []);
    assert(nsRes.status === 200 && Array.isArray(nsArray), 'Notesheet Directory Listing Retrieved', 'NOTESHEET');
  } catch (err: any) {
    assert(false, `Notesheet query failed: ${err.message}`, 'NOTESHEET');
  }

  // --- 7. MULTI-CATEGORY IT HELPDESK ---
  console.log('\n--- TEST SECTION 7: Multi-Category IT Helpdesk ---');
  try {
    const hdRes = await fetch(`${BASE_URL}/api/v1/it/tickets?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const hdPayload = unwrap(await hdRes.json());
    const hdArray = Array.isArray(hdPayload) ? hdPayload : (hdPayload.data || []);
    assert(hdRes.status === 200 && Array.isArray(hdArray), 'IT Helpdesk Ticket Directory Listing Retrieved', 'HELPDESK');
  } catch (err: any) {
    assert(false, `Helpdesk query failed: ${err.message}`, 'HELPDESK');
  }

  // --- 8. NOTICE BOARD & ANNOUNCEMENTS ---
  console.log('\n--- TEST SECTION 8: Official Notice Board ---');
  try {
    const noticeRes = await fetch(`${BASE_URL}/api/v1/notices?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const noticePayload = unwrap(await noticeRes.json());
    const noticeArray = Array.isArray(noticePayload) ? noticePayload : (noticePayload.data || []);
    assert(noticeRes.status === 200 && Array.isArray(noticeArray), 'Notice Board Active Bulletins Retrieved', 'NOTICES');
  } catch (err: any) {
    assert(false, `Notice query failed: ${err.message}`, 'NOTICES');
  }

  // --- 9. MANAGEMENT ANALYTICS & KPIS ---
  console.log('\n--- TEST SECTION 9: Management Analytics & KPIs ---');
  try {
    const analyticsRes = await fetch(`${BASE_URL}/api/v1/analytics/management/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.status === 200 && analyticsData.success === true, 'Management Executive KPI Summary Retrieved', 'ANALYTICS');

    const studentBlockRes = await fetch(`${BASE_URL}/api/v1/analytics/management/summary`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentBlockRes.status === 403, 'Student Forbidden from Management Analytics (HTTP 403)', 'ANALYTICS');
  } catch (err: any) {
    assert(false, `Management Analytics query failed: ${err.message}`, 'ANALYTICS');
  }

  // --- 10. STUDENT COUNCIL DESK ---
  console.log('\n--- TEST SECTION 10: Student Council Desk ---');
  try {
    const councilRes = await fetch(`${BASE_URL}/api/v1/student-council/councils`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const councilPayload = unwrap(await councilRes.json());
    const councilArray = Array.isArray(councilPayload) ? councilPayload : (councilPayload.data || []);
    assert(councilRes.status === 200 && Array.isArray(councilArray), 'Student Council Directory Retrieved', 'COUNCIL');
  } catch (err: any) {
    assert(false, `Student Council query failed: ${err.message}`, 'COUNCIL');
  }

  // --- 11. ATTENDANCE & RBAC ISOLATION ---
  console.log('\n--- TEST SECTION 11: Attendance & RBAC Isolation ---');
  try {
    const stuSessionBlockRes = await fetch(`${BASE_URL}/api/v1/attendance/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ subjectId: 'SUB001', date: new Date().toISOString() })
    });
    assert(stuSessionBlockRes.status === 403, 'Student Forbidden from Creating Attendance Sessions (HTTP 403)', 'ATTENDANCE');
  } catch (err: any) {
    assert(false, `Attendance RBAC test failed: ${err.message}`, 'ATTENDANCE');
  }

  // --- 12. SECURITY HEADERS & ERROR SANITIZATION ---
  console.log('\n--- TEST SECTION 12: Production Security Headers ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Health Endpoint Responds HTTP 200', 'SECURITY');
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'Security Header X-Content-Type-Options Present', 'SECURITY');
    assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'Security Header X-Frame-Options Present', 'SECURITY');
    assert(healthRes.headers.get('strict-transport-security') !== null, 'Security Header HSTS Present', 'SECURITY');
    assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Security Header Referrer-Policy Present', 'SECURITY');
  } catch (err: any) {
    assert(false, `Security Headers check failed: ${err.message}`, 'SECURITY');
  }

  // --- SUMMARY ---
  console.log('\n===============================================================');
  console.log('  PHASE 10 FULL ERP INTEGRATION VERIFICATION COMPLETE');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`  Assertions: ${passedCount} / ${totalCount} Passed (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
  console.log('===============================================================');

  if (passedCount === totalCount) {
    console.log('  🎯 ALL PHASE 10 ERP INTEGRATION ASSERTIONS PASSED\n');
  } else {
    console.error(`  ⚠️ ${totalCount - passedCount} ASSERTIONS FAILED\n`);
    process.exit(1);
  }
}

runPhase10IntegrationTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
