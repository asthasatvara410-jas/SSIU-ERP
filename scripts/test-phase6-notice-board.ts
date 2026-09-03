import { PrismaClient } from '../backend/node_modules/@prisma/client';

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:3001';

interface TestResult {
  title: string;
  category: 'AUTH' | 'LIFECYCLE' | 'AUDIENCE' | 'SECURITY' | 'REGRESSION';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, title: string, category: 'AUTH' | 'LIFECYCLE' | 'AUDIENCE' | 'SECURITY' | 'REGRESSION', details: string) {
  results.push({ title, category, passed: !!condition, details });
  const tag = condition ? '[PASS]' : '[FAIL]';
  console.log(`${tag} [${category}] ${title} — ${details}`);
}

async function runPhase6TestSuite() {
  console.log('====================================================');
  console.log('SSIU ERP — PHASE 6: NOTICE BOARD & ANNOUNCEMENT VERIFICATION');
  console.log('====================================================\n');

  let adminToken = '';
  let adminUserId = '';
  let studentAToken = '';
  let studentAUserId = '';
  let studentBToken = '';
  let studentBUserId = '';
  let facultyToken = '';
  let facultyUserId = '';

  // Setup: Authenticate Test Personas
  try {
    const adminRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'superadmin', password: 'Admin@123' }),
    });
    const adminData = (await adminRes.json()).data;
    adminToken = adminData?.accessToken || '';
    adminUserId = adminData?.user?.id || '';

    const stuARes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo01', password: 'Student@123' }),
    });
    const stuAData = (await stuARes.json()).data;
    studentAToken = stuAData?.accessToken || '';
    studentAUserId = stuAData?.user?.id || '';

    const stuBRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo02', password: 'Student@123' }),
    });
    const stuBData = (await stuBRes.json()).data;
    studentBToken = stuBData?.accessToken || '';
    studentBUserId = stuBData?.user?.id || '';

    const facRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'fac_amitshah', password: 'Faculty@123' }),
    });
    const facData = (await facRes.json()).data;
    facultyToken = facData?.accessToken || '';
    facultyUserId = facData?.user?.id || '';
  } catch (err: any) {
    console.error('Persona authentication error:', err.message);
  }

  // Fetch departments and institutes for audience tests
  const depts = await prisma.department.findMany({ take: 2 });
  const deptA = depts[0]?.id || 'dept-1';
  const deptB = depts[1]?.id || 'dept-2';

  const institutes = await prisma.institute.findMany({ take: 2 });
  const instA = institutes[0]?.id || 'inst-1';
  const instB = institutes[1]?.id || 'inst-2';

  let createdNoticeId = '';
  let draftNoticeId = '';
  let scheduledNoticeId = '';
  let expiredNoticeId = '';
  let deptNoticeId = '';
  let instNoticeId = '';
  let roleNoticeId = '';

  // ──────────────────────────────────────────────────────────
  // 1. NOTICE CREATION & AUTHORIZATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 1. Notice Creation & RBAC Authorization ---');

  // Test 1: Admin Can Create Notice (University-Wide)
  const createUnivRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'University Annual Convocation 2026 Announcement',
      content: 'The 10th Annual Convocation of SSIU will be held at Central Auditorium on 15th April 2026.',
      category: 'EVENT',
      priority: 'HIGH',
      isPinned: true,
      scopeType: 'UNIVERSITY_WIDE',
      targetRole: 'ALL',
      publishedBy: 'Office of the Registrar',
      attachmentUrl: 'https://swarrnim.edu.in/docs/convocation_2026.pdf',
    }),
  });
  const rawUniv = await createUnivRes.json();
  const univNotice = rawUniv.data || rawUniv;
  createdNoticeId = univNotice.id;

  assert(
    createUnivRes.status === 201 && univNotice.status === 'PUBLISHED' && univNotice.isPinned === true,
    'Admin Create Notice (UNIVERSITY_WIDE)',
    'AUTH',
    `Created notice ${univNotice.noticeNo} with scope UNIVERSITY_WIDE.`,
  );

  // Test 2: Student Forbidden from Creating Notice
  const studentCreateRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      title: 'Student Unauthorized Notice',
      content: 'Student trying to broadcast',
      category: 'GENERAL',
    }),
  });
  assert(
    studentCreateRes.status === 403,
    'Student Forbidden from Creating Notices',
    'SECURITY',
    `Student notice creation rejected with HTTP 403 Forbidden.`,
  );

  // Test 3: Date Validation — Expiry Before Publish Date Rejected
  const invalidDateRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Invalid Date Notice',
      content: 'Testing date rejection',
      category: 'GENERAL',
      publishAt: '2026-06-15T00:00:00.000Z',
      expiresAt: '2026-06-10T00:00:00.000Z',
    }),
  });
  assert(
    invalidDateRes.status === 400,
    'Invalid Date Combination Rejected',
    'LIFECYCLE',
    `expiresAt before publishAt correctly rejected with HTTP 400 Bad Request.`,
  );

  // Test 4: Audience Tampering Protection
  // Faculty attempting to publish UNIVERSITY_WIDE notice without University Admin authority
  const facultyUnivRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      title: 'Faculty Unauthorized Broadcast',
      content: 'Testing audience privilege escalation',
      category: 'GENERAL',
      scopeType: 'UNIVERSITY_WIDE',
    }),
  });
  assert(
    facultyUnivRes.status === 403,
    'Audience Tampering / Privilege Escalation Guard',
    'SECURITY',
    `Faculty attempting UNIVERSITY_WIDE broadcast rejected with HTTP 403 Forbidden.`,
  );

  // ──────────────────────────────────────────────────────────
  // 2. LIFECYCLE: DRAFT, SCHEDULED, PUBLISHED, EXPIRED, ARCHIVED
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 2. Notice Lifecycle States & Transitions ---');

  // Test 5: Create DRAFT Notice
  const createDraftRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Confidential Internal Draft Guidelines',
      content: 'Draft guidelines under syndication committee review.',
      category: 'ADMINISTRATIVE',
      status: 'DRAFT',
    }),
  });
  draftNoticeId = ((await createDraftRes.json()).data || {}).id;
  assert(
    createDraftRes.status === 201,
    'Create DRAFT Notice by Admin',
    'LIFECYCLE',
    `Draft notice created successfully.`,
  );

  // Test 6: Student CANNOT View DRAFT Notice
  const studentViewDraftRes = await fetch(`${BACKEND_URL}/api/v1/notices/${draftNoticeId}`, {
    headers: { Authorization: `Bearer ${studentAToken}` },
  });
  assert(
    studentViewDraftRes.status === 403,
    'DRAFT Notice Hidden from Students',
    'SECURITY',
    `Student direct access to draft notice rejected with HTTP 403 Forbidden.`,
  );

  // Test 7: Publish DRAFT Notice
  const publishDraftRes = await fetch(`${BACKEND_URL}/api/v1/notices/${draftNoticeId}/publish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const publishedDraftData = (await publishDraftRes.json()).data;
  assert(
    publishDraftRes.status === 200 && publishedDraftData.status === 'PUBLISHED',
    'Publish DRAFT Notice Transition',
    'LIFECYCLE',
    `Notice status transitioned from DRAFT to PUBLISHED.`,
  );

  // Test 8: Create SCHEDULED Notice (future publish date)
  const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
  const createSchedRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Future Semester Commencement Notice',
      content: 'New semester starts in 10 days.',
      category: 'ACADEMIC',
      publishAt: futureDate,
    }),
  });
  const schedNotice = (await createSchedRes.json()).data;
  scheduledNoticeId = schedNotice.id;
  assert(
    createSchedRes.status === 201 && schedNotice.status === 'SCHEDULED',
    'Scheduled Notice Creation (Future publishAt)',
    'LIFECYCLE',
    `Notice automatically assigned SCHEDULED status based on future publish date.`,
  );

  // Test 9: Create EXPIRED Notice (past expiry date)
  const pastPublish = new Date(Date.now() - 86400000 * 30).toISOString();
  const pastExpiry = new Date(Date.now() - 86400000 * 10).toISOString();
  const createExpRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Expired Old Fee Circular',
      content: 'Past payment notice from last semester.',
      category: 'FEES',
      publishAt: pastPublish,
      expiresAt: pastExpiry,
    }),
  });
  const expNotice = (await createExpRes.json()).data;
  expiredNoticeId = expNotice.id;
  assert(
    createExpRes.status === 201,
    'Expired Notice Creation (Past expiresAt)',
    'LIFECYCLE',
    `Expired notice created for lifecycle testing.`,
  );

  // Test 10: Expired Notice Omitted from Student Active Query
  const studentActiveRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    headers: { Authorization: `Bearer ${studentAToken}` },
  });
  const studentActiveList = ((await studentActiveRes.json()).data || {}).data || [];
  const hasExpiredInStudentView = studentActiveList.some((n: any) => n.id === expiredNoticeId);
  assert(
    !hasExpiredInStudentView,
    'Expired Notice Omitted from Active Query',
    'LIFECYCLE',
    `Expired notices automatically filtered out from student active notice list.`,
  );

  // Test 11: Archive Notice
  const archiveRes = await fetch(`${BACKEND_URL}/api/v1/notices/${createdNoticeId}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const archiveData = (await archiveRes.json()).data;
  assert(
    archiveRes.status === 200 && archiveData.status === 'ARCHIVED',
    'Archive Notice Transition',
    'LIFECYCLE',
    `Notice status transitioned to ARCHIVED.`,
  );

  // ──────────────────────────────────────────────────────────
  // 3. TARGETED AUDIENCE ISOLATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 3. Targeted Audience Scoping & Isolation ---');

  // Test 12: Department-Wide Targeted Notice
  const createDeptRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Department A Specific Laboratory Schedule',
      content: 'Lab practical timings for Department A only.',
      category: 'ACADEMIC',
      scopeType: 'DEPARTMENT_WIDE',
      targetDepartmentId: deptA,
    }),
  });
  deptNoticeId = ((await createDeptRes.json()).data || {}).id;
  assert(
    createDeptRes.status === 201,
    'Create Department-Specific Notice',
    'AUDIENCE',
    `Notice created targeting Department ${deptA}.`,
  );

  // Test 13: Institute-Wide Targeted Notice
  const createInstRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Institute A Specific Faculty Meeting',
      content: 'All faculty members of Institute A must attend.',
      category: 'ADMINISTRATIVE',
      scopeType: 'INSTITUTE_WIDE',
      targetInstituteId: instA,
      targetRole: 'FACULTY',
    }),
  });
  instNoticeId = ((await createInstRes.json()).data || {}).id;
  assert(
    createInstRes.status === 201,
    'Create Institute-Specific Notice',
    'AUDIENCE',
    `Notice created targeting Institute ${instA}.`,
  );

  // Test 14: Role-Based Targeted Notice (Faculty Only)
  const createRoleRes = await fetch(`${BACKEND_URL}/api/v1/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Faculty Syllabus Completion Status Review',
      content: 'All faculty must upload course coverage percentage before Friday.',
      category: 'ACADEMIC',
      scopeType: 'ROLE_BASED',
      targetRole: 'FACULTY',
    }),
  });
  roleNoticeId = ((await createRoleRes.json()).data || {}).id;
  assert(
    createRoleRes.status === 201,
    'Create Role-Specific Notice (FACULTY Only)',
    'AUDIENCE',
    `Notice created targeting FACULTY role only.`,
  );

  // Test 15: Student Cannot View Faculty-Only Notice (IDOR Guard)
  const studentRoleNoticeRes = await fetch(`${BACKEND_URL}/api/v1/notices/${roleNoticeId}`, {
    headers: { Authorization: `Bearer ${studentAToken}` },
  });
  assert(
    studentRoleNoticeRes.status === 403,
    'Role Isolation: Student Blocked from Faculty Notice',
    'SECURITY',
    `Student attempting to view faculty-only notice rejected with HTTP 403 Forbidden.`,
  );

  // Test 16: Faculty CAN View Faculty-Only Notice
  const facultyRoleNoticeRes = await fetch(`${BACKEND_URL}/api/v1/notices/${roleNoticeId}`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(
    facultyRoleNoticeRes.status === 200,
    'Role Isolation: Faculty Access Allowed',
    'AUDIENCE',
    `Faculty member successfully retrieved faculty-only notice.`,
  );

  // ──────────────────────────────────────────────────────────
  // 4. ATTACHMENT, PAGINATION, AUDIT & CREDENTIAL SECURITY
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 4. Attachments, Pagination & Security Safeguards ---');

  // Test 17: Attachment URL Integrity
  const detailRes = await fetch(`${BACKEND_URL}/api/v1/notices/${createdNoticeId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const detailData = (await detailRes.json()).data;
  assert(
    detailData.attachmentUrl === 'https://swarrnim.edu.in/docs/convocation_2026.pdf',
    'Attachment URL Integrity & Preservation',
    'SECURITY',
    `Attachment URL preserved without exposing internal filesystem paths.`,
  );

  // Test 18: Server-Side Pagination
  const pagRes = await fetch(`${BACKEND_URL}/api/v1/notices?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const pagData = (await pagRes.json()).data;
  assert(
    pagData.limit === 10 && typeof pagData.total === 'number' && Array.isArray(pagData.data),
    'Server-Side Controlled Pagination',
    'SECURITY',
    `Pagination returned page 1 with limit 10 and total ${pagData.total}.`,
  );

  // Test 19: Pagination Max Limit Capping (<= 100)
  const overLimitRes = await fetch(`${BACKEND_URL}/api/v1/notices?page=1&limit=500`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const overLimitData = (await overLimitRes.json()).data;
  assert(
    overLimitData.limit <= 100,
    'Max Limit Capped <= 100',
    'SECURITY',
    `Excessive limit parameter automatically clamped to ${overLimitData.limit}.`,
  );

  // Test 20: Audit Trail Recorded
  assert(
    Array.isArray(detailData.auditTrail) && detailData.auditTrail.length > 0,
    'Notice Mutation Audit Logging',
    'SECURITY',
    `Recorded ${detailData.auditTrail?.length} mutation audit entries for notice.`,
  );

  // Test 21: Zero Credential Leakage
  const detailJson = JSON.stringify(detailData);
  const hasLeak = detailJson.includes('passwordHash') || detailJson.includes('refreshToken') || detailJson.includes('jwt');
  assert(
    !hasLeak,
    'Zero Credential Leakage in Notice APIs',
    'SECURITY',
    `Notice response strictly omits passwords, hashes, and auth tokens.`,
  );

  // Clean up test notifications
  try {
    await prisma.notification.deleteMany({
      where: {
        title: {
          in: [
            'University Annual Convocation 2026 Announcement',
            'Confidential Internal Draft Guidelines',
            'Future Semester Commencement Notice',
            'Expired Old Fee Circular',
            'Department A Specific Laboratory Schedule',
            'Institute A Specific Faculty Meeting',
            'Faculty Syllabus Completion Status Review',
          ],
        },
      },
    });
  } catch (e) {}

  // ──────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Assertions: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  await prisma.$disconnect();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase6TestSuite().catch((err) => {
  console.error('Fatal error executing Phase 6 test suite:', err);
  process.exit(1);
});
