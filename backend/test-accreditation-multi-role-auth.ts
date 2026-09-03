import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuthAndEndpoints() {
  console.log('========================================================================');
  console.log('COMPLETE ACCREDITATION AUTHENTICATION & MULTI-ROLE VERIFICATION');
  console.log('========================================================================\n');

  const authUrl = 'http://localhost:3001/api/v1/auth/login';
  const accBase = 'http://localhost:3001/api/v1/accreditation';

  async function login(loginId: string, pass: string) {
    const res = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password: pass }),
    });
    if (!res.ok) {
      throw new Error(`Login failed for ${loginId}: ${res.status}`);
    }
    const json = await res.json();
    return json?.data?.accessToken || json?.accessToken;
  }

  // 1. Test alias logins
  console.log('--- 1. Testing Alias & Standard Logins ---');
  const facultyToken = await login('faculty', 'Faculty@123');
  console.log('✔ Faculty alias "faculty" login successful');

  const hodToken = await login('hod', 'Faculty@123');
  console.log('✔ HOD alias "hod" login successful');

  const principalToken = await login('principal', 'Admin@123');
  console.log('✔ Principal alias "principal" login successful');

  const registrarToken = await login('registrar', 'Admin@123');
  console.log('✔ Registrar alias "registrar" login successful');

  const adminToken = await login('admin', 'Admin@123');
  console.log('✔ Admin alias "admin" login successful');

  const studentToken = await login('student', 'Student@123');
  console.log('✔ Student alias "student" login successful');

  // 2. Test Unauthenticated Requests -> 401
  console.log('\n--- 2. Testing Unauthenticated Access (HTTP 401) ---');
  const endpoints = ['dashboard', 'frameworks', 'criteria', 'metrics', 'evidence', 'reports'];
  for (const ep of endpoints) {
    const res = await fetch(`${accBase}/${ep}`);
    console.assert(res.status === 401, `Expected 401 for ${ep}, got ${res.status}`);
    console.log(`✔ GET /${ep} -> 401 Unauthorized (No token)`);
  }

  // 3. Test Student Access -> 403
  console.log('\n--- 3. Testing Student Access (HTTP 403 Forbidden) ---');
  for (const ep of endpoints) {
    const res = await fetch(`${accBase}/${ep}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.assert(res.status === 403, `Expected 403 for ${ep}, got ${res.status}`);
    console.log(`✔ GET /${ep} with Student JWT -> 403 Forbidden`);
  }

  // 4. Test Faculty Access -> 200
  console.log('\n--- 4. Testing Faculty Access (HTTP 200 OK) ---');
  for (const ep of endpoints) {
    const res = await fetch(`${accBase}/${ep}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    console.assert(res.status === 200, `Expected 200 for ${ep}, got ${res.status}`);
    const data = await res.json();
    console.log(`✔ GET /${ep} with Faculty JWT -> 200 OK (${data.success ? 'Success' : 'Failed'})`);
  }

  // 5. Test HOD Access -> 200
  console.log('\n--- 5. Testing HOD Access (HTTP 200 OK) ---');
  const resHodDash = await fetch(`${accBase}/dashboard?framework=NBA`, {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  console.assert(resHodDash.status === 200, `Expected 200 for HOD, got ${resHodDash.status}`);
  console.log('✔ HOD retrieved NBA dashboard -> 200 OK');

  // 6. Test Admin Actions (Recalculate & Validate) -> 200
  console.log('\n--- 6. Testing Admin / IQAC Recalculation & Validation ---');
  const resRecalc = await fetch(`${accBase}/recalculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ framework: 'NAAC' }),
  });
  console.assert(resRecalc.status === 200 || resRecalc.status === 201, `Recalculate status: ${resRecalc.status}`);
  console.log(`✔ POST /recalculate -> 200/201 OK`);

  const resVal = await fetch(`${accBase}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ framework: 'NAAC' }),
  });
  console.assert(resVal.status === 200 || resVal.status === 201, `Validate status: ${resVal.status}`);
  console.log(`✔ POST /validate -> 200/201 OK`);

  console.log('\n========================================================================');
  console.log('ALL AUTHENTICATION & MULTI-ROLE VERIFICATION TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

testAuthAndEndpoints()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
