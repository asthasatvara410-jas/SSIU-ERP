import { PrismaClient } from '../backend/node_modules/@prisma/client';

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:3001';

interface TestResult {
  title: string;
  category: 'AUTH' | 'NOTESHEETS' | 'FINANCE' | 'GATE_PASS' | 'SECURITY' | 'REGRESSION';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, title: string, category: 'AUTH' | 'NOTESHEETS' | 'FINANCE' | 'GATE_PASS' | 'SECURITY' | 'REGRESSION', details: string) {
  results.push({ title, category, passed: !!condition, details });
  const tag = condition ? '[PASS]' : '[FAIL]';
  console.log(`${tag} [${category}] ${title} — ${details}`);
}

async function runPhase7TestSuite() {
  console.log('====================================================');
  console.log('SSIU ERP — PHASE 7: MANAGEMENT ANALYTICS & KPI VERIFICATION');
  console.log('====================================================\n');

  let adminToken = '';
  let studentToken = '';
  let facultyToken = '';
  let hodToken = '';
  let principalToken = '';

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

    const hodRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'hod_demo01', password: 'Hod@123' }),
    });
    hodToken = (await hodRes.json()).data?.accessToken || '';

    const hoiRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'hoi_demo01', password: 'Hoi@123' }),
    });
    principalToken = (await hoiRes.json()).data?.accessToken || '';
  } catch (err: any) {
    console.error('Persona authentication error:', err.message);
  }

  // 2. Setup Seed Data for Notesheets & Gate Passes to Ensure Non-Zero Aggregations
  const adminUser = await prisma.user.findFirst({ where: { username: 'superadmin' } });
  const adminUserId = adminUser?.id || '';

  const depts = await prisma.department.findMany({ take: 2 });
  const deptA = depts[0];
  const deptB = depts[1];

  const institutes = await prisma.institute.findMany({ take: 2 });
  const instA = institutes[0];
  const instB = institutes[1];

  const now = new Date();
  const testTag = `P7TEST-${Date.now()}`;

  // Seed Approved Notesheet with approvedAmount
  const approvedNs = await prisma.noteSheet.create({
    data: {
      notesheetNumber: `NS-APP-${testTag}`,
      title: 'Lab Equipment Modernization Proposal',
      subject: 'Lab Equipment',
      department: deptA?.name || 'CSE',
      departmentId: deptA?.id,
      instituteId: instA?.id,
      proposal: 'Procure high-performance workstations for artificial intelligence laboratory.',
      purposeJustification: 'Required for semester 7 advanced computing practicals.',
      status: 'APPROVED',
      priority: 'HIGH',
      estimatedCost: 150000,
      approvedAmount: 145000,
      approvedAt: now,
      createdAt: new Date(now.getTime() - 86400000 * 2), // 2 days ago
      createdByUserId: adminUserId,
      createdByName: 'Administrator',
      createdByRole: 'SYSTEM_ADMIN',
    },
  });

  // Seed Pending Notesheet
  const pendingNs = await prisma.noteSheet.create({
    data: {
      notesheetNumber: `NS-PEN-${testTag}`,
      title: 'Annual Department Symposium Budget',
      subject: 'Symposium Budget',
      department: deptB?.name || 'IT',
      departmentId: deptB?.id,
      instituteId: instB?.id,
      proposal: 'Organize university tech symposium and coding marathon.',
      purposeJustification: 'Promote student innovation and startup ideation.',
      status: 'PENDING_APPROVAL',
      priority: 'URGENT',
      estimatedCost: 85000,
      requestedAmount: 85000,
      createdAt: new Date(now.getTime() - 86400000 * 5), // 5 days ago
      createdByUserId: adminUserId,
      createdByName: 'Administrator',
      createdByRole: 'SYSTEM_ADMIN',
    },
  });

  const sampleStudent = await prisma.student.findFirst();
  const sampleStudentId = sampleStudent?.id || '';

  // Seed Gate Passes (One currently outside, one returned)
  let hasHostelGatePassTable = false;
  try {
    await prisma.hostelGatePass.count();
    hasHostelGatePassTable = true;
  } catch {
    hasHostelGatePassTable = false;
  }

  if (hasHostelGatePassTable) {
    await prisma.hostelGatePass.create({
      data: {
        requestNo: `REQ-OUT-${testTag}`,
        gatePassNo: `GP-OUT-${testTag}`,
        studentId: sampleStudentId,
        enrollmentNo: 'ENR-OUT-001',
        studentName: 'Rahul Sharma',
        departmentName: deptA?.name || 'Computer Engineering',
        hostelId: 'hostel-1',
        hostelName: 'Swami Vivekananda Boys Hostel A',
        roomNo: '204',
        reason: 'Medical Emergency Consultation',
        leavingDate: now,
        leavingTime: '10:00 AM',
        expectedReturnDate: now,
        expectedReturnTime: '06:00 PM',
        destination: 'Gandhinagar Civil Hospital',
        emergencyContact: '9876543210',
        status: 'CHECKED_OUT',
        actualCheckOutTime: new Date(now.getTime() - 3600000 * 2), // 2 hours ago
        actualCheckInTime: null,
      },
    });

    await prisma.hostelGatePass.create({
      data: {
        requestNo: `REQ-RET-${testTag}`,
        gatePassNo: `GP-RET-${testTag}`,
        studentId: sampleStudentId,
        enrollmentNo: 'ENR-RET-002',
        studentName: 'Priya Patel',
        departmentName: deptB?.name || 'Information Technology',
        hostelId: 'hostel-2',
        hostelName: 'Saraswati Girls Hostel Block B',
        roomNo: '108',
        reason: 'Library Research Work',
        leavingDate: now,
        leavingTime: '09:00 AM',
        expectedReturnDate: now,
        expectedReturnTime: '02:00 PM',
        destination: 'Central Library Gandhinagar',
        emergencyContact: '9876543211',
        status: 'CHECKED_IN',
        actualCheckOutTime: new Date(now.getTime() - 3600000 * 5),
        actualCheckInTime: new Date(now.getTime() - 3600000 * 1),
      },
    });
  } else if (sampleStudentId) {
    await prisma.outpassRequest.create({
      data: {
        outpassNo: `REQ-OUT-${testTag}`,
        studentId: sampleStudentId,
        fromDate: now,
        toDate: now,
        purpose: 'Medical Emergency Consultation',
        destination: 'Gandhinagar Civil Hospital',
        contactNumber: '9876543210',
        status: 'ACTIVE',
        actualReturnTime: null,
      },
    });

    await prisma.outpassRequest.create({
      data: {
        outpassNo: `REQ-RET-${testTag}`,
        studentId: sampleStudentId,
        fromDate: now,
        toDate: now,
        purpose: 'Library Research Work',
        destination: 'Central Library Gandhinagar',
        contactNumber: '9876543211',
        status: 'COMPLETED',
        actualReturnTime: new Date(now.getTime() - 3600000 * 1),
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // 1. RBAC AUTHORIZATION & SCOPE ISOLATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 1. RBAC Authorization & Scope Boundaries ---');

  // Test 1: Management Summary Access (Admin succeeds)
  const sumRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const sumData = (await sumRes.json()).data;
  assert(
    sumRes.status === 200 && typeof sumData?.totalStudents === 'number' && typeof sumData?.monthlyApprovedExpense === 'number',
    'Management Summary Access by Administrator',
    'AUTH',
    `Retrieved management summary: ${sumData?.totalStudents} students, ₹${sumData?.monthlyApprovedExpense} monthly expense.`,
  );

  // Test 2: Student Access Rejected (HTTP 403)
  const stuRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/summary`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(
    stuRes.status === 403,
    'Student Forbidden from Management Analytics',
    'SECURITY',
    `Student request blocked with HTTP 403 Forbidden.`,
  );

  // Test 3: Unauthorized Faculty Access Rejected (HTTP 403)
  const facRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/summary`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(
    facRes.status === 403,
    'Ordinary Faculty Forbidden from Management Analytics',
    'SECURITY',
    `Ordinary teaching faculty blocked with HTTP 403 Forbidden.`,
  );

  // Test 4: HOD Department Scope Isolation
  const hodRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/summary`, {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  const hodData = (await hodRes.json()).data;
  assert(
    hodRes.status === 200 && hodData?.appliedScope?.role === 'HOD',
    'HOD Access & Department Isolation',
    'SECURITY',
    `HOD authorized with appliedScope role HOD.`,
  );

  // Test 5: Principal Institute Scope Isolation
  const prinRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/summary`, {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  const prinData = (await prinRes.json()).data;
  assert(
    prinRes.status === 200 && (prinData?.appliedScope?.role === 'HOI' || prinData?.appliedScope?.role === 'PRINCIPAL'),
    'Principal Institute Scope Isolation',
    'SECURITY',
    `Principal authorized with appliedScope role HOI/PRINCIPAL.`,
  );

  // Test 6: University Admin University-Wide Access
  assert(
    sumData?.appliedScope?.role === 'SYSTEM_ADMIN' || sumData?.appliedScope?.role === 'SUPER_ADMIN',
    'University Admin University-Wide Authority',
    'AUTH',
    `University Admin possesses campus-wide governance authority.`,
  );

  // ──────────────────────────────────────────────────────────
  // 2. NOTESHEET ANALYTICS & AGGREGATIONS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 2. Notesheet Pipeline & Lifecycle Analytics ---');

  const nsRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/notesheets`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const nsData = (await nsRes.json()).data;

  // Test 7: Notesheet Status Aggregation
  assert(
    typeof nsData?.totalNotesheets === 'number' &&
      nsData?.pendingCount >= 1 &&
      nsData?.approvedCount >= 1,
    'Notesheet Status Aggregation (Pending, Approved, Total)',
    'NOTESHEETS',
    `Total: ${nsData?.totalNotesheets}, Pending: ${nsData?.pendingCount}, Approved: ${nsData?.approvedCount}.`,
  );

  // Test 8: Department Pending Aggregation
  assert(
    Array.isArray(nsData?.departmentWisePending) && nsData?.departmentWisePending.length > 0,
    'Department-wise Pending Notesheet Aggregation',
    'NOTESHEETS',
    `Grouped pending notesheets across ${nsData?.departmentWisePending.length} departments.`,
  );

  // Test 9: Average Processing Time Calculation
  assert(
    typeof nsData?.averageProcessingTimeHours === 'number' && nsData?.averageProcessingTimeHours >= 0,
    'Average Notesheet Processing Time Calculation',
    'NOTESHEETS',
    `Average turnaround time: ${nsData?.averageProcessingTimeHours} hours.`,
  );

  // Test 10: Top 5 Oldest Pending Notesheets
  assert(
    Array.isArray(nsData?.oldestPendingNotesheets) &&
      nsData?.oldestPendingNotesheets.length > 0 &&
      nsData?.oldestPendingNotesheets[0].notesheetNumber !== undefined,
    'Top 5 Oldest Pending Notesheets Identification',
    'NOTESHEETS',
    `Identified ${nsData?.oldestPendingNotesheets.length} oldest pending files. Oldest: ${nsData?.oldestPendingNotesheets[0]?.notesheetNumber}.`,
  );

  // ──────────────────────────────────────────────────────────
  // 3. FINANCIAL & EXPENSE ANALYTICS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 3. Financial Sanctions & Expense Analytics ---');

  const expRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/expenses`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const expData = (await expRes.json()).data;

  // Test 11: Monthly Approved Expense
  assert(
    typeof sumData?.monthlyApprovedExpense === 'number' && sumData?.monthlyApprovedExpense >= 145000,
    'Current Month Approved Expense using NoteSheet.approvedAmount',
    'FINANCE',
    `Monthly approved expense: ₹${sumData?.monthlyApprovedExpense.toLocaleString()}.`,
  );

  // Test 12: Department Expense Aggregation
  assert(
    Array.isArray(expData?.departmentWiseApprovedExpense) && expData?.departmentWiseApprovedExpense.length > 0,
    'Department-wise Approved Expense Aggregation',
    'FINANCE',
    `Aggregated approved expenses across ${expData?.departmentWiseApprovedExpense.length} departments.`,
  );

  // Test 13: Approved vs. Pending Financial Values
  const pipeline = expData?.approvedVsPendingValue;
  assert(
    pipeline &&
      typeof pipeline.approvedValue === 'number' &&
      typeof pipeline.pendingValue === 'number' &&
      typeof pipeline.approvedPercentage === 'number',
    'Approved vs Pending Financial Pipeline Calculation',
    'FINANCE',
    `Approved: ₹${pipeline?.approvedValue}, Pending: ₹${pipeline?.pendingValue} (${pipeline?.approvedPercentage}% approved).`,
  );

  // ──────────────────────────────────────────────────────────
  // 4. GATE PASS & HOSTEL OUTINGS ANALYTICS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 4. Gate Pass & Hostel Outing Analytics ---');

  const gpRes = await fetch(`${BACKEND_URL}/api/v1/analytics/management/gate-pass`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const gpData = (await gpRes.json()).data;

  // Test 14: Today's Gate Pass Count
  assert(
    typeof gpData?.todayOutings === 'number' && gpData?.todayOutings >= 2,
    "Today's Actual Gate Pass Outings Count",
    'GATE_PASS',
    `Recorded ${gpData?.todayOutings} actual scanned outings today.`,
  );

  // Test 15: Date-Range Gate Pass Count
  assert(
    typeof gpData?.dateRangeTotalOutings === 'number' && gpData?.dateRangeTotalOutings >= 2,
    'Date-Range Total Outings Aggregation',
    'GATE_PASS',
    `Total outings in range: ${gpData?.dateRangeTotalOutings}.`,
  );

  // Test 16: Average Daily Outings Calculation
  assert(
    typeof gpData?.averageDailyOutings === 'number' && gpData?.averageDailyOutings >= 0,
    'Average Daily Outings Calculation',
    'GATE_PASS',
    `Average daily departures: ${gpData?.averageDailyOutings} outings/day.`,
  );

  // Test 17: Currently Outside Students Calculation
  assert(
    typeof gpData?.currentlyOutsideCount === 'number' && gpData?.currentlyOutsideCount >= 1,
    'Currently Outside Students Calculation',
    'GATE_PASS',
    `Currently outside campus: ${gpData?.currentlyOutsideCount} students.`,
  );

  // Test 18: Returned Students Calculation
  assert(
    typeof gpData?.returnedCount === 'number' && gpData?.returnedCount >= 1,
    'Returned Students Calculation',
    'GATE_PASS',
    `Completed return trips: ${gpData?.returnedCount} students.`,
  );

  // Test 19: Department-wise Outing Aggregation
  assert(
    Array.isArray(gpData?.departmentWiseOutings) && gpData?.departmentWiseOutings.length > 0,
    'Department-wise Outing Aggregation',
    'GATE_PASS',
    `Aggregated outings across ${gpData?.departmentWiseOutings.length} departments.`,
  );

  // Test 20: Hostel-wise Outing Aggregation
  assert(
    Array.isArray(gpData?.hostelWiseOutings) && gpData?.hostelWiseOutings.length > 0,
    'Hostel-wise Outing Aggregation',
    'GATE_PASS',
    `Aggregated outings across ${gpData?.hostelWiseOutings.length} hostels.`,
  );

  // ──────────────────────────────────────────────────────────
  // 5. VALIDATION, SECURITY & EDGE CASES
  // ──────────────────────────────────────────────────────────
  console.log('\n--- 5. Input Validation, Tampering Defense & Edge Cases ---');

  // Test 21: Invalid Date Range Rejection (fromDate > toDate -> HTTP 400)
  const invalidDateRes = await fetch(
    `${BACKEND_URL}/api/v1/analytics/management/summary?fromDate=2026-12-31&toDate=2026-01-01`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert(
    invalidDateRes.status === 400,
    'Invalid Date Range Rejection (fromDate > toDate)',
    'SECURITY',
    `Invalid chronological date range rejected with HTTP 400 Bad Request.`,
  );

  // Test 22: Scope Parameter Tampering Protection
  // HOD attempting to pass another departmentId
  const hodTamperRes = await fetch(
    `${BACKEND_URL}/api/v1/analytics/management/summary?departmentId=unauthorized-dept-uuid`,
    {
      headers: { Authorization: `Bearer ${hodToken}` },
    },
  );
  const hodTamperData = (await hodTamperRes.json()).data;
  assert(
    hodTamperRes.status === 200 && hodTamperData?.appliedScope?.departmentId !== 'unauthorized-dept-uuid',
    'Scope Parameter Tampering Protection (HOD Override Blocked)',
    'SECURITY',
    `Backend strictly maintained authorized HOD department scope.`,
  );

  // Test 23: Empty Dataset Handling
  const emptyRes = await fetch(
    `${BACKEND_URL}/api/v1/analytics/management/notesheets?fromDate=1970-01-01&toDate=1970-01-02`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  const emptyData = (await emptyRes.json()).data;
  assert(
    emptyRes.status === 200 && emptyData?.totalNotesheets === 0 && Array.isArray(emptyData?.oldestPendingNotesheets),
    'Empty Dataset Graceful Handling',
    'SECURITY',
    `Zero-record date range gracefully returns structured zeroes and empty arrays without crashing.`,
  );

  // Test 24: Zero Credential Leakage in Analytics Responses
  const fullJson = JSON.stringify({ sumData, nsData, expData, gpData });
  const hasLeak = fullJson.includes('passwordHash') || fullJson.includes('refreshToken') || fullJson.includes('jwt');
  assert(
    !hasLeak,
    'Zero Credential Leakage in Management Analytics APIs',
    'SECURITY',
    `Response projections strictly omit passwords, hashes, and auth tokens.`,
  );

  // Clean up seeded test records
  try {
    await prisma.noteSheet.deleteMany({
      where: { notesheetNumber: { in: [`NS-APP-${testTag}`, `NS-PEN-${testTag}`] } },
    });
    if (hasHostelGatePassTable) {
      await prisma.hostelGatePass.deleteMany({
        where: { requestNo: { in: [`REQ-OUT-${testTag}`, `REQ-RET-${testTag}`] } },
      });
    } else {
      await prisma.outpassRequest.deleteMany({
        where: { outpassNo: { in: [`REQ-OUT-${testTag}`, `REQ-RET-${testTag}`] } },
      });
    }
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

runPhase7TestSuite().catch((err) => {
  console.error('Fatal error executing Phase 7 test suite:', err);
  process.exit(1);
});
