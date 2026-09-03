import { PrismaClient } from '../backend/node_modules/@prisma/client';

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:3001';

interface TestResult {
  title: string;
  category: 'CREATION' | 'VALIDATION' | 'LIFECYCLE' | 'THREAD' | 'SECURITY' | 'REGRESSION';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, title: string, category: 'CREATION' | 'VALIDATION' | 'LIFECYCLE' | 'THREAD' | 'SECURITY' | 'REGRESSION', details: string) {
  results.push({ title, category, passed: !!condition, details });
  const tag = condition ? '[PASS]' : '[FAIL]';
  console.log(`${tag} [${category}] ${title} — ${details}`);
}

async function runPhase5TestSuite() {
  console.log('====================================================');
  console.log('SSIU ERP — PHASE 5: UNIFIED HELPDESK VERIFICATION');
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
    const adminData = await adminRes.json();
    adminToken = adminData?.data?.accessToken || adminData?.accessToken;
    adminUserId = adminData?.data?.user?.id || adminData?.user?.id || '';

    const stuARes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo01', password: 'Student@123' }),
    });
    const stuAData = await stuARes.json();
    studentAToken = stuAData?.data?.accessToken || stuAData?.accessToken;
    studentAUserId = stuAData?.data?.user?.id || stuAData?.user?.id || '';

    const stuBRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo02', password: 'Student@123' }),
    });
    const stuBData = await stuBRes.json();
    studentBToken = stuBData?.data?.accessToken || stuBData?.accessToken;
    studentBUserId = stuBData?.data?.user?.id || stuBData?.user?.id || '';

    const facRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'fac_amitshah', password: 'Faculty@123' }),
    });
    const facData = await facRes.json();
    facultyToken = facData?.data?.accessToken || facData?.accessToken;
    facultyUserId = facData?.data?.user?.id || facData?.user?.id || '';
  } catch (err: any) {
    console.error('Initial persona setup error:', err.message);
  }

  let createdTicketId = '';
  let createdTicketNo = '';

  // ──────────────────────────────────────────────────────────
  // 1. TICKET CREATION & MULTI-CATEGORY VALIDATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 1. Multi-Category Ticket Creation & Input Validation ---');

  // Test 1: Create Academic Category Ticket
  const createAcademicRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      category: 'ACADEMIC',
      title: 'Discrepancy in Semester 3 Subject Credits',
      description: 'The elective credits for Artificial Intelligence do not appear on credit ledger.',
      priority: 'HIGH',
      attachmentUrl: 'https://cdn.university.edu/docs/credit_issue.pdf',
    }),
  });
  const createAcademicData = await createAcademicRes.json();
  const ticketA = createAcademicData.data || createAcademicData;
  createdTicketId = ticketA.id;
  createdTicketNo = ticketA.ticketNo;

  assert(
    createAcademicRes.status === 201 && ticketA.category === 'ACADEMIC' && ticketA.status === 'OPEN',
    'Multi-Category Ticket Creation (ACADEMIC)',
    'CREATION',
    `Created ticket ${ticketA.ticketNo} in ACADEMIC category with status OPEN.`,
  );

  // Test 2: Create Hostel & Infrastructure Categories
  const createHostelRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      category: 'HOSTEL',
      title: 'Water Supply Low Pressure Block C',
      description: 'Block C 2nd floor has reduced water pressure since morning.',
      priority: 'NORMAL',
    }),
  });
  assert(
    createHostelRes.status === 201,
    'Multi-Category Ticket Creation (HOSTEL)',
    'CREATION',
    `Created ticket in HOSTEL category successfully.`,
  );

  // Test 3: Validation — Empty Title & Description Rejection
  const emptyRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      category: 'IT',
      title: '',
      description: '',
    }),
  });
  assert(
    emptyRes.status === 400,
    'Input Validation (Empty Title & Description)',
    'VALIDATION',
    `Empty ticket fields correctly rejected with HTTP 400 Bad Request.`,
  );

  // Test 4: Validation — Invalid Category Rejection
  const invalidCatRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      category: 'INVALID_ALIEN_CATEGORY',
      title: 'Valid Title',
      description: 'Valid Description',
    }),
  });
  assert(
    invalidCatRes.status === 400,
    'Invalid Category Rejection',
    'VALIDATION',
    `Unrecognized category rejected with HTTP 400.`,
  );

  // Test 5: Validation — Invalid Priority Rejection
  const invalidPrioRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      category: 'FEES',
      title: 'Receipt verification',
      description: 'Need receipt copy',
      priority: 'SUPER_DUPER_URGENT',
    }),
  });
  assert(
    invalidPrioRes.status === 400,
    'Invalid Priority Rejection',
    'VALIDATION',
    `Unrecognized priority rejected with HTTP 400.`,
  );

  // ──────────────────────────────────────────────────────────
  // 2. SEARCH, PAGINATION & FILTERS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 2. Server-Side Search, Pagination & Filters ---');

  // Test 6: Search by Ticket Number
  const searchRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets?search=${encodeURIComponent(createdTicketNo)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const searchData = await searchRes.json();
  const searchList = searchData.data?.data || searchData.data || searchData;
  assert(
    Array.isArray(searchList) && searchList.some((t: any) => t.ticketNo === createdTicketNo),
    'Server-Side Search by Ticket Number',
    'CREATION',
    `Found ticket ${createdTicketNo} via parameterized backend search.`,
  );

  // Test 7: Category Filter
  const filterCatRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets?category=HOSTEL`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const filterCatData = await filterCatRes.json();
  const catList = filterCatData.data?.data || filterCatData.data || filterCatData;
  assert(
    Array.isArray(catList) && catList.every((t: any) => t.category === 'HOSTEL'),
    'Category Parameterized Filter',
    'CREATION',
    `All returned tickets strictly belong to HOSTEL category.`,
  );

  // Test 8: Server-Side Pagination & Max Limit
  const pagRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const rawPagData = await pagRes.json();
  const pagData = rawPagData.data?.limit ? rawPagData.data : (rawPagData.data || rawPagData);
  assert(
    pagData.limit === 10 && typeof pagData.total === 'number',
    'Controlled Server-Side Pagination',
    'CREATION',
    `Pagination returned page 1 with limit 10 and total count ${pagData.total}.`,
  );

  // Test 9: Max Limit Capping (<= 100)
  const overLimitRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets?page=1&limit=500`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const rawOverLimit = await overLimitRes.json();
  const overLimitData = rawOverLimit.data?.limit ? rawOverLimit.data : (rawOverLimit.data || rawOverLimit);
  assert(
    overLimitData.limit <= 100,
    'Max Limit Capped <= 100',
    'CREATION',
    `Excessive limit parameter automatically clamped to ${overLimitData.limit} (<= 100).`,
  );

  // ──────────────────────────────────────────────────────────
  // 3. ASSIGNMENT & LIFECYCLE TRANSITIONS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 3. Ticket Assignment & Lifecycle Transitions ---');

  // Test 10: Assign Ticket to Staff
  const assignRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      assignedToUserId: facultyUserId,
      remarks: 'Assigned to Computer Engineering department coordinator.',
    }),
  });
  const rawAssign = await assignRes.json();
  const assignData = rawAssign.data || rawAssign;
  assert(
    assignRes.status === 200 && assignData.status === 'ASSIGNED',
    'Ticket Assignment by Administrator',
    'LIFECYCLE',
    `Ticket ${createdTicketNo} assigned to faculty with status ASSIGNED.`,
  );

  // Test 11: Unauthorized Assignment by Student Blocked
  const studentAssignRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      assignedToUserId: studentBUserId,
    }),
  });
  assert(
    studentAssignRes.status === 403,
    'Student Forbidden from Assigning Tickets',
    'SECURITY',
    `Student attempting ticket assignment rejected with HTTP 403 Forbidden.`,
  );

  // Test 12: Transition to IN_PROGRESS
  const inProgRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({ status: 'IN_PROGRESS', remarks: 'Checking credit syllabus mapping.' }),
  });
  assert(
    inProgRes.status === 200,
    'Status Transition: IN_PROGRESS',
    'LIFECYCLE',
    `Ticket transitioned to IN_PROGRESS by assigned staff.`,
  );

  // Test 13: Resolve Ticket with Resolution Notes
  const resolveRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      resolution: 'Elective credits verified and recalculated in ABC ledger.',
    }),
  });
  const rawResolve = await resolveRes.json();
  const resolveData = rawResolve.data || rawResolve;
  assert(
    resolveRes.status === 200 && resolveData.status === 'RESOLVED' && resolveData.resolvedAt !== null,
    'Status Transition: RESOLVED',
    'LIFECYCLE',
    `Ticket resolved with resolution notes and resolvedAt timestamp recorded.`,
  );

  // Test 14: Student Can Close Their Own Ticket
  const closeRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/close`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({ remarks: 'Issue resolved satisfactorily.' }),
  });
  assert(
    closeRes.status === 200,
    'Status Transition: CLOSED by Student',
    'LIFECYCLE',
    `Student successfully closed resolved ticket.`,
  );

  // Test 15: Reopen Closed Ticket
  const reopenRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/reopen`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({ remarks: 'Credit score still shows 3 instead of 4.' }),
  });
  assert(
    reopenRes.status === 200,
    'Status Transition: REOPENED',
    'LIFECYCLE',
    `Ticket successfully reopened from CLOSED state.`,
  );

  // ──────────────────────────────────────────────────────────
  // 4. THREADED CONVERSATIONS & INTERNAL NOTES
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 4. Threaded Conversations & Internal Notes Protection ---');

  // Test 16: Student Adds Public Message
  const studentMsgRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      message: 'Attached the latest grade card screenshot for reference.',
      messageType: 'USER_MESSAGE',
      attachmentUrl: 'https://cdn.university.edu/docs/grade_card.png',
    }),
  });
  assert(
    studentMsgRes.status === 201,
    'Thread Message Creation (USER_MESSAGE)',
    'THREAD',
    `Student added user message to ticket thread.`,
  );

  // Test 17: Staff Adds Internal Note
  const internalNoteRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      message: 'INTERNAL: HOD confirmed pending syndicate approval for course 302.',
      messageType: 'INTERNAL_NOTE',
    }),
  });
  assert(
    internalNoteRes.status === 201,
    'Internal Note Creation by Staff',
    'THREAD',
    `Staff added INTERNAL_NOTE to ticket thread.`,
  );

  // Test 18: Internal Note Stripping for Student (Privacy & Security Guard)
  const studentThreadRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}`, {
    headers: { Authorization: `Bearer ${studentAToken}` },
  });
  const rawStudentThread = await studentThreadRes.json();
  const studentThreadData = rawStudentThread.data || rawStudentThread;
  const studentMessages: any[] = studentThreadData.messages || [];
  const hasInternalNoteInStudentView = studentMessages.some((m) => m.messageType === 'INTERNAL_NOTE');
  assert(
    !hasInternalNoteInStudentView,
    'Internal Note Hidden from Student (Backend Enforcement)',
    'SECURITY',
    `Backend strictly filtered out INTERNAL_NOTE from student response (${studentMessages.length} messages visible).`,
  );

  // Test 19: Internal Note Visible to Staff/Admin
  const staffThreadRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  const rawStaffThread = await staffThreadRes.json();
  const staffThreadData = rawStaffThread.data || rawStaffThread;
  const staffMessages: any[] = staffThreadData.messages || [];
  const hasInternalNoteInStaffView = staffMessages.some((m) => m.messageType === 'INTERNAL_NOTE');
  assert(
    hasInternalNoteInStaffView,
    'Internal Note Visible to Staff & Admins',
    'SECURITY',
    `Staff user can view INTERNAL_NOTE for internal coordination.`,
  );

  // Test 20: Student Forbidden from Posting Internal Note
  const studentHackNoteRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    body: JSON.stringify({
      message: 'Student trying to post internal note',
      messageType: 'INTERNAL_NOTE',
    }),
  });
  assert(
    studentHackNoteRes.status === 403,
    'Student Blocked from Creating Internal Notes',
    'SECURITY',
    `Student attempting INTERNAL_NOTE rejected with HTTP 403 Forbidden.`,
  );

  // ──────────────────────────────────────────────────────────
  // 5. IDOR & SCOPE ISOLATION TESTS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 5. IDOR Protection & Scope Boundaries ---');

  // Test 21: Student B Accessing Student A Ticket (IDOR Attempt)
  const idorAccessRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}`, {
    headers: { Authorization: `Bearer ${studentBToken}` },
  });
  assert(
    idorAccessRes.status === 403,
    'IDOR Guard: Cross-Student Ticket View Blocked',
    'SECURITY',
    `Student B attempting to view Student A ticket returned HTTP 403 Forbidden.`,
  );

  // Test 22: Student B Commenting on Student A Ticket (IDOR Attempt)
  const idorCommentRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
    body: JSON.stringify({
      message: 'Intruder comment',
    }),
  });
  assert(
    idorCommentRes.status === 403,
    'IDOR Guard: Cross-Student Comment Blocked',
    'SECURITY',
    `Student B attempting to post comment on Student A ticket returned HTTP 403 Forbidden.`,
  );

  // Test 23: Student B Updating Student A Ticket Status (IDOR Attempt)
  const idorStatusRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets/${createdTicketId}/close`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
    body: JSON.stringify({ remarks: 'Malicious close' }),
  });
  assert(
    idorStatusRes.status === 403,
    'IDOR Guard: Cross-Student Status Modification Blocked',
    'SECURITY',
    `Student B attempting to close Student A ticket returned HTTP 403 Forbidden.`,
  );

  // Test 24: Student Restricted to Own Tickets in List
  const studentListRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets`, {
    headers: { Authorization: `Bearer ${studentAToken}` },
  });
  const rawStudentList = await studentListRes.json();
  const studentListData = rawStudentList.data?.data ? rawStudentList.data : (rawStudentList.data || rawStudentList);
  const stuTickets: any[] = studentListData.data || (Array.isArray(studentListData) ? studentListData : []);
  assert(
    Array.isArray(stuTickets) && stuTickets.every((t) => t.userId === studentAUserId),
    'Student Scope: Restricted to OWN Tickets',
    'SECURITY',
    `Student ticket listing strictly scoped to tickets created by Student A.`,
  );

  // Test 25: Zero Credential Leakage in Ticket APIs
  const hasCredentialLeak = JSON.stringify(staffThreadData).includes('passwordHash') || JSON.stringify(staffThreadData).includes('refreshToken');
  assert(
    !hasCredentialLeak,
    'Zero Credential Leakage in Helpdesk APIs',
    'SECURITY',
    `Ticket and user projections strictly omit passwords, hashes, and tokens.`,
  );

  // ──────────────────────────────────────────────────────────
  // 6. REGRESSION VERIFICATION (Phases 2, 3, 4)
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 6. Regression Verification Across Prior Phases ---');

  // Test 26: Master Data Caching (Phase 3)
  const cacheRes = await fetch(`${BACKEND_URL}/api/v1/institutes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    cacheRes.status === 200,
    'Master Data Cache Regression',
    'REGRESSION',
    `Master Data caching operational (status 200).`,
  );

  // Test 27: Bulk Import Staging (Phase 2)
  const bulkRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/templates/STUDENT`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    bulkRes.status === 200,
    'Bulk Import Engine Regression',
    'REGRESSION',
    `Bulk Import template download operational (status 200).`,
  );

  // Test 28: User Management Pagination (Phase 3)
  const usersRes = await fetch(`${BACKEND_URL}/api/v1/users?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    usersRes.status === 200,
    'Central User Management Regression',
    'REGRESSION',
    `User directory server-side pagination operational (status 200).`,
  );

  // Test 29: RBAC User Overrides (Phase 4)
  const overrideRes = await fetch(`${BACKEND_URL}/api/v1/users/${facultyUserId}/overrides`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    overrideRes.status === 200,
    'Role Groups & Overrides Regression',
    'REGRESSION',
    `User-specific permission overrides query operational (status 200).`,
  );

  // Clean up test tickets from PostgreSQL
  try {
    await prisma.iTTicket.deleteMany({
      where: {
        title: { in: ['Discrepancy in Semester 3 Subject Credits', 'Water Supply Low Pressure Block C'] },
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

runPhase5TestSuite().catch((err) => {
  console.error('Fatal error executing Phase 5 test suite:', err);
  process.exit(1);
});
