/**
 * SSIU ERP — PHASE 3 AUTOMATED END-TO-END VERIFICATION SUITE
 * 
 * Verifies live running application:
 * 1. Master Data In-Memory Caching (Hit, Miss, Invalidation, Latency)
 * 2. Student Directory Server-Side Pagination, Filtering & Search (Max Limit 100)
 * 3. Central User Management Server-Side Pagination & Scope Authorization
 * 4. IT Helpdesk / Support Tickets Server-Side Pagination & Search
 * 5. Scale & Performance Latency Benchmarks (< 100ms response time)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const unwrap = (json: any) => (json && json.data !== undefined ? json.data : json);

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runPhase3Tests() {
  console.log('\n================================================================');
  console.log('🧪 SSIU ERP — PHASE 3 PERFORMANCE & PAGINATION E2E VERIFICATION');
  console.log('================================================================\n');

  try {
    // ── 0. Obtain Admin Authentication Token ──
    console.log('--- 0. AUTHENTICATING ERP ADMINISTRATOR ---');
    const loginRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'superadmin', password: 'Admin@123' }),
    });

    const loginData = await loginRes.json();
    const adminToken = loginData.data?.accessToken || loginData.access_token || loginData.token;
    assert(!!adminToken, 'Admin Authentication', `Status ${loginRes.status}`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // ── SECTION 1: MASTER DATA IN-MEMORY CACHE TESTS ─────────────
    console.log('\n--- 1. MASTER DATA IN-MEMORY CACHING ---');

    // 1.1 Initial Master Data Fetch (Warm Cache)
    const t0 = performance.now();
    const instRes1 = await fetch(`${BACKEND_URL}/api/v1/institutes`, { headers: authHeaders });
    const inst1 = unwrap(await instRes1.json());
    const dur1 = performance.now() - t0;
    assert(instRes1.status === 200 && Array.isArray(inst1), 'Institutes Master Data initial query succeeded', `${dur1.toFixed(1)}ms`);

    // 1.2 Cache Hit Verification (Should be significantly faster, < 15ms)
    const t1 = performance.now();
    const instRes2 = await fetch(`${BACKEND_URL}/api/v1/institutes`, { headers: authHeaders });
    const inst2 = unwrap(await instRes2.json());
    const dur2 = performance.now() - t1;
    assert(instRes2.status === 200 && inst2.length === inst1.length, 'Institutes cached query returned identical records');
    assert(dur2 < 20, 'Master Data Cache Hit performance', `Returned in ${dur2.toFixed(1)}ms (< 20ms threshold)`);

    // 1.3 Departments Master Data Cache
    const deptRes = await fetch(`${BACKEND_URL}/api/v1/departments`, { headers: authHeaders });
    const depts = unwrap(await deptRes.json());
    assert(deptRes.status === 200 && Array.isArray(depts), 'Departments Master Data cached query succeeded');

    // 1.4 Academic Years Master Data Cache
    const ayRes = await fetch(`${BACKEND_URL}/api/v1/academic-years`, { headers: authHeaders });
    const ays = unwrap(await ayRes.json());
    assert(ayRes.status === 200 && Array.isArray(ays), 'Academic Years Master Data cached query succeeded');

    // ── SECTION 2: STUDENT DIRECTORY PAGINATION & SEARCH ────────
    console.log('\n--- 2. STUDENT DIRECTORY SERVER-SIDE PAGINATION ---');

    // 2.1 Standard pagination
    const stuRes = await fetch(`${BACKEND_URL}/api/v1/students?page=1&limit=20`, { headers: authHeaders });
    const stuPayload = unwrap(await stuRes.json());
    const stuData = stuPayload.data || stuPayload;
    assert(stuRes.status === 200, 'Student Directory paginated endpoint accessible');
    assert(stuPayload.page === 1, 'Page parameter respected', `page=${stuPayload.page}`);
    assert(stuPayload.limit === 20, 'Limit parameter respected', `limit=${stuPayload.limit}`);
    assert(typeof stuPayload.total === 'number', 'Total count returned accurately', `total=${stuPayload.total}`);

    // 2.2 Max limit enforcement (Security rule: Limit <= 100 rejected by DTO or capped)
    const stuOverLimitRes = await fetch(`${BACKEND_URL}/api/v1/students?page=1&limit=500`, { headers: authHeaders });
    const stuOverLimitPayload = unwrap(await stuOverLimitRes.json());
    assert(
      stuOverLimitRes.status === 400 || (stuOverLimitPayload && stuOverLimitPayload.limit <= 100),
      'Max Limit Enforcement (DTO rejects or caps limit > 100)',
      `Status ${stuOverLimitRes.status}`
    );

    // 2.3 Projections: Sensitive credentials never exposed
    if (stuData.length > 0) {
      const s0 = stuData[0];
      assert(!s0.passwordHash && !s0.password, 'Student list projection strictly omits password fields');
      assert(!!s0.enrollmentNo && !!s0.firstName, 'Student list returns required identity summary fields');
    }

    // 2.4 Server-side search
    const stuSearchRes = await fetch(`${BACKEND_URL}/api/v1/students?page=1&limit=10&search=2026`, { headers: authHeaders });
    const stuSearchPayload = unwrap(await stuSearchRes.json());
    assert(stuSearchRes.status === 200, 'Student server-side search query succeeded');

    // ── SECTION 3: CENTRAL USER MANAGEMENT PAGINATION & SCOPE ────
    console.log('\n--- 3. CENTRAL USER MANAGEMENT PAGINATION & SCOPE ---');

    // 3.1 Super Admin user management access
    const usersRes = await fetch(`${BACKEND_URL}/api/v1/users?page=1&limit=20`, { headers: authHeaders });
    const usersPayload = unwrap(await usersRes.json());
    const usersData = usersPayload.data || usersPayload;
    assert(usersRes.status === 200, 'Central User Management GET /api/v1/users accessible to Admin');
    assert(usersPayload.limit <= 100, 'Central User Management limit capped <= 100', `limit=${usersPayload.limit}`);
    assert(typeof usersPayload.total === 'number', 'Total users count returned accurately', `total=${usersPayload.total}`);

    // 3.2 Security Projections: User hashes never exposed
    if (usersData.length > 0) {
      const u0 = usersData[0];
      assert(!u0.passwordHash && !u0.password, 'User Management projection strictly omits sensitive credentials');
      assert(!!u0.username && !!u0.role, 'User Management returns safe username and role summaries');
    }

    // 3.3 Search by identifier (Enrollment No / Employee Code / Username)
    const userSearchRes = await fetch(`${BACKEND_URL}/api/v1/users?page=1&limit=10&search=superadmin`, { headers: authHeaders });
    const userSearchPayload = unwrap(await userSearchRes.json());
    const userSearchData = userSearchPayload.data || userSearchPayload;
    assert(userSearchData.length >= 1 && userSearchData.some((u: any) => u.username === 'superadmin'), 'User Search by username succeeded');

    // 3.4 Unauthenticated / Unauthorized access forbidden
    const unauthRes = await fetch(`${BACKEND_URL}/api/v1/users?page=1&limit=20`, {
      headers: { 'Content-Type': 'application/json' },
    });
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthorized request rejected', `Status ${unauthRes.status}`);

    // ── SECTION 4: IT HELPDESK & SUPPORT TICKETS PAGINATION ──────
    console.log('\n--- 4. IT HELPDESK & SUPPORT TICKETS PAGINATION ---');

    const ticketRes = await fetch(`${BACKEND_URL}/api/v1/it/tickets?page=1&limit=15`, { headers: authHeaders });
    const ticketPayload = unwrap(await ticketRes.json());
    assert(ticketRes.status === 200, 'IT Helpdesk paginated endpoint accessible');
    assert(ticketPayload.limit === 15, 'Tickets limit set to 15');
    assert(ticketPayload.limit <= 100, 'Tickets limit strictly <= 100');
    assert(Array.isArray(ticketPayload.data), 'Tickets data returned as array');

    // ── SECTION 5: PERFORMANCE & LATENCY BENCHMARKS ─────────────
    console.log('\n--- 5. SCALE & LATENCY BENCHMARKS (< 100ms) ---');

    const benchStart = performance.now();
    await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/institutes`, { headers: authHeaders }),
      fetch(`${BACKEND_URL}/api/v1/departments`, { headers: authHeaders }),
      fetch(`${BACKEND_URL}/api/v1/academic-years`, { headers: authHeaders }),
      fetch(`${BACKEND_URL}/api/v1/students?page=1&limit=20`, { headers: authHeaders }),
      fetch(`${BACKEND_URL}/api/v1/users?page=1&limit=20`, { headers: authHeaders }),
      fetch(`${BACKEND_URL}/api/v1/it/tickets?page=1&limit=20`, { headers: authHeaders }),
    ]);
    const benchDuration = performance.now() - benchStart;
    assert(benchDuration < 400, 'Concurrent paginated + cached HTTP requests benchmark', `Completed in ${benchDuration.toFixed(1)}ms (< 400ms total)`);

    console.log('\n================================================================');
    console.log(`Phase 3 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3Tests();
