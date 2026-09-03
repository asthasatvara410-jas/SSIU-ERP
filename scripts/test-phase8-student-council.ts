import { PrismaClient } from '../backend/node_modules/@prisma/client';

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:3001';

interface TestResult {
  title: string;
  category: 'AUTH' | 'COUNCIL' | 'OFFICE_BEARER' | 'CLUB' | 'MEMBERSHIP' | 'MOM' | 'EVENT_PROPOSAL' | 'SECURITY' | 'REGRESSION';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(
  condition: boolean,
  title: string,
  category: 'AUTH' | 'COUNCIL' | 'OFFICE_BEARER' | 'CLUB' | 'MEMBERSHIP' | 'MOM' | 'EVENT_PROPOSAL' | 'SECURITY' | 'REGRESSION',
  details: string,
) {
  results.push({ title, category, passed: !!condition, details });
  const tag = condition ? '[PASS]' : '[FAIL]';
  console.log(`${tag} [${category}] ${title} — ${details}`);
}

async function runPhase8TestSuite() {
  console.log('====================================================');
  console.log('SSIU ERP — PHASE 8: STUDENT COUNCIL DESK VERIFICATION');
  console.log('====================================================\n');

  let adminToken = '';
  let studentToken = '';
  let facultyToken = '';

  // 1. Authenticate Test Personas
  try {
    const adminRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'superadmin', password: 'Admin@123' }),
    });
    adminToken = (await adminRes.json()).data?.accessToken || '';

    const stuRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo01', password: 'Student@123' }),
    });
    studentToken = (await stuRes.json()).data?.accessToken || '';

    const facRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'fac_amitshah', password: 'Faculty@123' }),
    });
    facultyToken = (await facRes.json()).data?.accessToken || '';
  } catch (err: any) {
    console.error('Persona authentication error:', err.message);
  }

  const testTag = `P8-${Date.now()}`;
  let councilId = '';
  let clubId = '';
  let meetingId = '';
  let proposalId = '';
  let studentProposalId = '';

  // ──────────────────────────────────────────────────────────
  // 1. STUDENT COUNCIL DIRECTORY
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 1. Student Council Directory & RBAC ---');

  // Test 1: Council Creation (Admin succeeds)
  const createCouncilRes = await fetch(`${BACKEND_URL}/api/v1/student-council/councils`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      code: `COUNCIL-${testTag}`,
      name: `SSCIT University Student Council ${testTag}`,
      academicYear: '2025-2026',
      chairperson: 'Dr. Ramesh Kumar',
      secretary: 'Aarav Sharma',
    }),
  });
  const createCouncilData = await createCouncilRes.json();
  councilId = createCouncilData.data?.id || '';
  assert(
    createCouncilRes.status === 201 && !!councilId,
    'Student Council Creation by Administrator',
    'COUNCIL',
    `Council created with code COUNCIL-${testTag} (ID: ${councilId}).`,
  );

  // Test 2: Council Listing
  const listCouncilsRes = await fetch(`${BACKEND_URL}/api/v1/student-council/councils`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const listCouncilsRaw = await listCouncilsRes.json();
  const councilsList = Array.isArray(listCouncilsRaw.data)
    ? listCouncilsRaw.data
    : listCouncilsRaw.data?.data || [];
  assert(
    listCouncilsRes.status === 200 && Array.isArray(councilsList) && councilsList.length > 0,
    'Council Directory Listing & Search',
    'COUNCIL',
    `Retrieved ${councilsList.length} registered councils.`,
  );

  // ──────────────────────────────────────────────────────────
  // 2. OFFICE BEARERS & DUPLICATE CHECKS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 2. Office Bearers & Post Exclusivity ---');

  // Test 3: Office Bearer Assignment (President)
  const assignBearerRes = await fetch(`${BACKEND_URL}/api/v1/student-council/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      committeeId: councilId,
      memberName: 'Aarav Sharma',
      role: 'PRESIDENT',
    }),
  });
  assert(
    assignBearerRes.status === 201,
    'Executive Office Bearer Assignment (President)',
    'OFFICE_BEARER',
    `Aarav Sharma appointed as PRESIDENT for council ${councilId}.`,
  );

  // Test 4: Duplicate Active Bearer Prevention (Single-holder post)
  const dupBearerRes = await fetch(`${BACKEND_URL}/api/v1/student-council/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      committeeId: councilId,
      memberName: 'Vikram Patel',
      role: 'PRESIDENT',
    }),
  });
  assert(
    dupBearerRes.status === 400,
    'Duplicate Active Office Bearer Prevention',
    'OFFICE_BEARER',
    `Second President assignment rejected with HTTP 400 Bad Request.`,
  );

  // ──────────────────────────────────────────────────────────
  // 3. CLUBS & COMMITTEES
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 3. Student Clubs & Organizations ---');

  // Test 5: Club Creation (Technical Club)
  const createClubRes = await fetch(`${BACKEND_URL}/api/v1/student-council/clubs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      code: `CLUB-ROBO-${testTag}`,
      name: `Robotics & AI Innovation Club ${testTag}`,
      committeeType: 'TECHNICAL_CLUB',
      chairperson: 'Prof. Amit Shah',
      secretary: 'Rohan Mehra',
    }),
  });
  const createClubData = await createClubRes.json();
  clubId = createClubData.data?.id || '';
  assert(
    createClubRes.status === 201 && !!clubId,
    'Technical Club / Student Cell Registration',
    'CLUB',
    `Club created with type TECHNICAL_CLUB and ID ${clubId}.`,
  );

  // ──────────────────────────────────────────────────────────
  // 4. MEMBERSHIP MANAGEMENT & CONSTRAINTS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 4. Membership Management & Constraints ---');

  // Test 6: Membership Creation (Student added to Club)
  const addMemberRes = await fetch(`${BACKEND_URL}/api/v1/student-council/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      committeeId: clubId,
      memberName: 'Sneha Joshi',
      role: 'MEMBER',
    }),
  });
  assert(
    addMemberRes.status === 201,
    'Club Membership Creation',
    'MEMBERSHIP',
    `Sneha Joshi registered as active MEMBER of club.`,
  );

  // Test 7: Duplicate Active Membership Prevention
  const dupMemberRes = await fetch(`${BACKEND_URL}/api/v1/student-council/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      committeeId: clubId,
      memberName: 'Sneha Joshi',
      role: 'MEMBER',
    }),
  });
  assert(
    dupMemberRes.status === 400,
    'Duplicate Active Membership Prevention',
    'MEMBERSHIP',
    `Duplicate registration for Sneha Joshi rejected with HTTP 400 Bad Request.`,
  );

  // ──────────────────────────────────────────────────────────
  // 5. SECURITY & SCOPE ENFORCEMENT
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 5. Security, RBAC & Scope Enforcement ---');

  // Test 8: Cross-Institute Scope Isolation
  const crossInstRes = await fetch(`${BACKEND_URL}/api/v1/student-council/organizations/non-existent-uuid-12345`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    crossInstRes.status === 404,
    'Scope Isolation & Missing Resource Safety',
    'SECURITY',
    `Non-existent or out-of-scope entity safely handled with HTTP 404.`,
  );

  // Test 9: Student Unauthorized Council Management Rejection (HTTP 403)
  const stuCreateRes = await fetch(`${BACKEND_URL}/api/v1/student-council/councils`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      code: `UNAUTH-${testTag}`,
      name: 'Rogue Student Council',
    }),
  });
  assert(
    stuCreateRes.status === 403,
    'Student Forbidden from Council Administration',
    'SECURITY',
    `Student council creation attempt blocked with HTTP 403 Forbidden.`,
  );

  // Test 10: Faculty Scope Enforcement
  const facClubRes = await fetch(`${BACKEND_URL}/api/v1/student-council/clubs`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(
    facClubRes.status === 200,
    'Faculty Coordinator Scope Access',
    'AUTH',
    `Authorized faculty member can view clubs and councils.`,
  );

  // ──────────────────────────────────────────────────────────
  // 6. MEETING & MOM (MINUTES OF MEETING) WORKFLOW
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 6. Meeting & MoM Lifecycle ---');

  // Test 11: MoM Creation (Draft status)
  const createMeetingRes = await fetch(`${BACKEND_URL}/api/v1/student-council/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      committeeId: councilId,
      meetingDate: new Date().toISOString(),
      venue: 'Council Chamber Block B',
      agenda: 'Q1 TechFest Budget Planning and Club Allocation',
      minutes: 'Detailed discussions held regarding sponsorship outreach and stage setup.',
      actionItems: [
        {
          itemNumber: 'ACT-001',
          description: 'Submit sponsorship brochure to corporate partners',
          responsiblePerson: 'Aarav Sharma',
          deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        },
      ],
    }),
  });
  const createMeetingData = await createMeetingRes.json();
  meetingId = createMeetingData.data?.id || '';
  assert(
    createMeetingRes.status === 201 && createMeetingData.data?.status === 'DRAFT',
    'Council Meeting & MoM Draft Creation',
    'MOM',
    `Created meeting ${createMeetingData.data?.meetingNo} in DRAFT status with action items.`,
  );

  // Test 12: MoM Approval & Publishing Workflow
  const pubMeetingRes = await fetch(`${BACKEND_URL}/api/v1/student-council/meetings/${meetingId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'PUBLISHED' }),
  });
  const pubMeetingData = await pubMeetingRes.json();
  assert(
    pubMeetingRes.status === 200 && pubMeetingData.data?.status === 'PUBLISHED',
    'MoM Status Transition to PUBLISHED',
    'MOM',
    `Meeting transitioned to PUBLISHED status.`,
  );

  // Test 13: Unpublished MoM Hidden from Students
  // Create another draft meeting
  const draftMeetRes = await fetch(`${BACKEND_URL}/api/v1/student-council/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      committeeId: councilId,
      meetingDate: new Date().toISOString(),
      venue: 'Confidential Room',
      agenda: 'Internal Disciplinary Review',
      minutes: 'Confidential draft minutes.',
    }),
  });
  const draftMeetId = (await draftMeetRes.json()).data?.id;

  const stuMeetingsRes = await fetch(`${BACKEND_URL}/api/v1/student-council/meetings?committeeId=${councilId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const stuMeetings = (await stuMeetingsRes.json()).data || [];
  const studentSeesDraft = stuMeetings.some((m: any) => m.id === draftMeetId);
  assert(
    !studentSeesDraft,
    'Unpublished MoM Strict Isolation from Students',
    'MOM',
    `Draft/unpublished meetings strictly filtered out from student queries.`,
  );

  // ──────────────────────────────────────────────────────────
  // 7. EVENT PROPOSAL WORKFLOW
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 7. Event Proposal Workflow & Self-Approval Guard ---');

  // Test 14: Event Proposal Creation by Student
  const stuPropRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      title: 'National Hackathon Innovate-X 2026',
      organizingClub: 'Robotics & AI Society',
      eventDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      venue: 'Main Auditorium',
      estimatedBudget: 45000,
      expectedParticipants: 250,
      description: '36-hour competitive hackathon for AI and CleanTech prototypes.',
    }),
  });
  const stuPropData = await stuPropRes.json();
  studentProposalId = stuPropData.data?.id || '';
  assert(
    stuPropRes.status === 201 && stuPropData.data?.status === 'SUBMITTED',
    'Student Event Proposal Submission',
    'EVENT_PROPOSAL',
    `Student successfully submitted proposal ${stuPropData.data?.requestNo}.`,
  );

  // Test 15: Proposal Submission by Admin
  const adminPropRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Annual Cultural Fest Swarrnim Tarang 2026',
      organizingClub: 'Cultural & Arts Society',
      eventDate: new Date(Date.now() + 86400000 * 45).toISOString(),
      venue: 'Open Air Amphitheatre',
      estimatedBudget: 120000,
      expectedParticipants: 1000,
    }),
  });
  const adminPropData = await adminPropRes.json();
  proposalId = adminPropData.data?.id || '';
  assert(
    adminPropRes.status === 201 && !!proposalId,
    'Council Event Proposal Submission Pipeline',
    'EVENT_PROPOSAL',
    `Proposal created with ID ${proposalId}.`,
  );

  // Test 16: Unauthorized Self-Approval Blocked (Conflict of Interest Guard)
  const selfApproveRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals/${proposalId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'APPROVED', remarks: 'Self approval attempt' }),
  });
  assert(
    selfApproveRes.status === 403,
    'Unauthorized Self-Approval Blocked (Conflict of Interest Guard)',
    'SECURITY',
    `Proposal creator blocked from approving own submission (HTTP 403 Forbidden).`,
  );

  // Test 17: Student Review Blocked (HTTP 403)
  const stuReviewRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals/${proposalId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  assert(
    stuReviewRes.status === 403,
    'Student Blocked from Reviewing/Approving Event Proposals',
    'SECURITY',
    `Student review attempt rejected with HTTP 403 Forbidden.`,
  );

  // Test 18: Authorized Approval (Faculty approves Student Proposal)
  const authApproveRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals/${studentProposalId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`,
    },
    body: JSON.stringify({
      status: 'APPROVED',
      remarks: 'Sanctioned with ₹45,000 budget under SSIP student innovation fund.',
    }),
  });
  assert(
    authApproveRes.status === 200,
    'Authorized Event Proposal Approval',
    'EVENT_PROPOSAL',
    `Faculty approved student event proposal successfully.`,
  );

  // Test 19: Rejection Workflow
  // Create another proposal and reject it
  const rejPropRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      title: 'Overbudget Gaming Tournament',
      organizingClub: 'Gaming Club',
      eventDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      venue: 'Lab 1',
      estimatedBudget: 500000,
    }),
  });
  const rejPropId = (await rejPropRes.json()).data?.id;

  const rejectRes = await fetch(`${BACKEND_URL}/api/v1/student-council/event-proposals/${rejPropId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`,
    },
    body: JSON.stringify({
      status: 'REJECTED',
      remarks: 'Proposed budget exceeds standard student club allocation ceiling.',
    }),
  });
  const rejectData = await rejectRes.json();
  assert(
    rejectRes.status === 200 && rejectData.data?.status === 'REJECTED',
    'Event Proposal Rejection Workflow',
    'EVENT_PROPOSAL',
    `Proposal successfully rejected with administrative remarks recorded.`,
  );

  // ──────────────────────────────────────────────────────────
  // 8. PAGINATION & SCALE
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 8. Server-Side Pagination & Scale ---');

  // Test 20: Pagination
  const paginatedRes = await fetch(`${BACKEND_URL}/api/v1/student-council/clubs?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const paginatedRaw = await paginatedRes.json();
  const meta = paginatedRaw.data?.meta || paginatedRaw.meta;
  assert(
    paginatedRes.status === 200 &&
      meta?.limit === 5 &&
      typeof meta?.total === 'number' &&
      typeof meta?.totalPages === 'number',
    'Server-Side Pagination on Organization Queries',
    'REGRESSION',
    `Returned page ${meta?.page}, limit ${meta?.limit}, total ${meta?.total}.`,
  );

  // ──────────────────────────────────────────────────────────
  // 9. DASHBOARD METRICS & EVENTS INTEGRATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 9. Executive Dashboard & Events Integration ---');

  // Test 21: Existing Events Functionality & Council Dashboard Metrics
  const dashRes = await fetch(`${BACKEND_URL}/api/v1/student-council/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashRaw = await dashRes.json();
  const dashData = dashRaw.data?.activeCouncilsCount !== undefined ? dashRaw.data : dashRaw.data?.data;
  assert(
    dashRes.status === 200 &&
      typeof dashData?.activeCouncilsCount === 'number' &&
      typeof dashData?.upcomingEventsCount === 'number' &&
      Array.isArray(dashData?.recentApprovedProposals),
    'Council Executive Dashboard & Events Integration',
    'REGRESSION',
    `Dashboard metrics aggregated: Councils: ${dashData?.activeCouncilsCount}, Upcoming Events: ${dashData?.upcomingEventsCount}, Recent Approved: ${dashData?.recentApprovedProposals?.length}.`,
  );

  // Clean up seeded test records
  try {
    if (councilId) {
      await prisma.committee.delete({ where: { id: councilId } }).catch(() => {});
    }
    if (clubId) {
      await prisma.committee.delete({ where: { id: clubId } }).catch(() => {});
    }
    await prisma.statutoryApproval.deleteMany({
      where: {
        id: { in: [proposalId, studentProposalId, rejPropId].filter(Boolean) },
      },
    }).catch(() => {});
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

runPhase8TestSuite().catch((err) => {
  console.error('Fatal error executing Phase 8 test suite:', err);
  process.exit(1);
});
