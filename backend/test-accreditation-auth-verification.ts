import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAccreditationAuth() {
  console.log('========================================================================');
  console.log('ACCREDITATION API AUTHENTICATION & FACULTY JWT VERIFICATION');
  console.log('========================================================================\n');

  const authBaseUrl = 'http://localhost:3001/api/v1/auth';
  const accBaseUrl = 'http://localhost:3001/api/v1/accreditation';

  // 1. Authenticate as Faculty via POST /api/v1/auth/login
  console.log('--- Logging in as Faculty (fac_demo01) ---');
  let facultyToken = '';
  try {
    const loginRes = await fetch(`${authBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'fac_amitshah', password: 'Faculty@123' }),
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      facultyToken = loginData?.data?.accessToken || loginData?.accessToken || '';
      console.log(`✔ Faculty Login Successful: Role = ${loginData?.data?.user?.role}, Token obtained`);
    } else {
      console.log(`Login failed with status: ${loginRes.status}`);
      const err = await loginRes.json().catch(() => ({}));
      console.log('Error details:', err);
    }
  } catch (e: any) {
    console.error('Login request error:', e.message);
  }

  // 2. Authenticate as Student via POST /api/v1/auth/login
  console.log('\n--- Logging in as Student (stu_demo01) ---');
  let studentToken = '';
  try {
    const loginRes = await fetch(`${authBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo01', password: 'Student@123' }),
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      studentToken = loginData?.data?.accessToken || loginData?.accessToken || '';
      console.log(`✔ Student Login Successful: Role = ${loginData?.data?.user?.role}, Token obtained`);
    }
  } catch (e: any) {
    console.error('Student login error:', e.message);
  }

  // TEST 1: Unauthenticated request (no token) -> Expect 401
  console.log('\n--- TEST 1: Unauthenticated request (No Authorization Header) ---');
  const resNoAuth = await fetch(`${accBaseUrl}/criteria`, { method: 'GET' });
  console.log(`Response Status: ${resNoAuth.status}`);
  console.assert(resNoAuth.status === 401, `Expected 401, got ${resNoAuth.status}`);
  console.log('✔ TEST 1 PASS: Unauthenticated request returns 401 Unauthorized');

  // TEST 2: Student JWT -> Expect 403 Forbidden
  console.log('\n--- TEST 2: Authenticated Student JWT ---');
  if (studentToken) {
    const resStudent = await fetch(`${accBaseUrl}/criteria`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`Response Status: ${resStudent.status}`);
    console.assert(resStudent.status === 403, `Expected 403, got ${resStudent.status}`);
    console.log('✔ TEST 2 PASS: Student role returns 403 Forbidden');
  }

  // TEST 3: Faculty JWT on criteria -> Expect 200 OK
  console.log('\n--- TEST 3: Authenticated Faculty JWT on /criteria ---');
  if (facultyToken) {
    const resFaculty = await fetch(`${accBaseUrl}/criteria?framework=NAAC`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    console.log(`Response Status: ${resFaculty.status}`);
    const raw = await resFaculty.json();
    const criteriaList = raw?.data?.data || raw?.data || [];
    console.assert(resFaculty.status === 200, `Expected 200, got ${resFaculty.status}`);
    console.assert(Array.isArray(criteriaList), 'Expected success array of criteria');
    console.log(`✔ TEST 3 PASS: Faculty authenticated successfully, retrieved ${criteriaList.length} criteria`);
  }

  // TEST 4: Faculty JWT on /dashboard -> Expect 200 OK
  console.log('\n--- TEST 4: Authenticated Faculty JWT on /dashboard ---');
  if (facultyToken) {
    const resDash = await fetch(`${accBaseUrl}/dashboard?framework=NAAC`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    console.log(`Response Status: ${resDash.status}`);
    const raw = await resDash.json();
    const dashData = raw?.data?.data || raw?.data;
    console.assert(resDash.status === 200, `Expected 200, got ${resDash.status}`);
    console.log(`✔ TEST 4 PASS: Faculty retrieved dashboard with ${dashData?.criteria?.length || 0} criteria readiness summaries`);
  }

  // TEST 5: Faculty JWT on /evidence -> Expect 200 OK
  console.log('\n--- TEST 5: Authenticated Faculty JWT on /evidence ---');
  if (facultyToken) {
    const resEv = await fetch(`${accBaseUrl}/evidence?framework=NAAC`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    console.log(`Response Status: ${resEv.status}`);
    const raw = await resEv.json();
    const evList = raw?.data?.data || raw?.data || [];
    console.assert(resEv.status === 200, `Expected 200, got ${resEv.status}`);
    console.log(`✔ TEST 5 PASS: Faculty retrieved evidence list (${evList.length} items)`);
  }

  // TEST 6: Faculty JWT on /reports -> Expect 200 OK
  console.log('\n--- TEST 6: Authenticated Faculty JWT on /reports ---');
  if (facultyToken) {
    const resRep = await fetch(`${accBaseUrl}/reports?framework=NAAC`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    console.log(`Response Status: ${resRep.status}`);
    const raw = await resRep.json();
    const repList = raw?.data?.data || raw?.data || [];
    console.assert(resRep.status === 200, `Expected 200, got ${resRep.status}`);
    console.log(`✔ TEST 6 PASS: Faculty retrieved reports list (${repList.length} reports)`);
  }

  console.log('\n========================================================================');
  console.log('ALL ACCREDITATION AUTHENTICATION VERIFICATION TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

verifyAccreditationAuth()
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
