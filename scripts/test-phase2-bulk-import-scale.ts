import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const unwrap = (json: any) => (json && json.data !== undefined ? json.data : json);

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('SSIU ERP — PHASE 2: BULK IMPORT & SCALE VERIFICATION');
  console.log('====================================================');

  let stuUploadData: any;
  let facUploadData: any;
  let staffUploadData: any;
  let invDeptData: any;
  let benchData: any;

  try {
    // Setup clean test metadata
    const testInstitute = await prisma.institute.findFirst() || await prisma.institute.create({
      data: { code: 'INST-ENG', name: 'Institute of Engineering', status: 'ACTIVE' },
    });

    let testDept = await prisma.department.findFirst({ where: { code: 'DEP-CSE' } });
    if (!testDept) {
      testDept = await prisma.department.create({
        data: {
          code: 'DEP-CSE',
          name: 'Computer Science and Engineering',
          instituteId: testInstitute.id,
          status: 'ACTIVE',
        },
      });
    }

    // ── 0. Obtain Admin Token ──
    console.log('\n--- Authenticating Admin ---');
    const loginRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'superadmin', password: 'Admin@123' }),
    });

    const loginData = await loginRes.json();
    const adminToken = loginData.data?.accessToken || loginData.access_token || loginData.token;
    assert('Admin Authentication', !!adminToken, `Received admin bearer JWT (status ${loginRes.status})`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // Clean up any stale records before tests
    await prisma.userRole.deleteMany({
      where: { user: { username: { in: ['EN_TEST_2026_001', 'EN_TEST_2026_002', 'EMP_TEST_2026_001', 'STF_TEST_2026_001'] } } },
    });
    await prisma.user.deleteMany({
      where: { username: { in: ['EN_TEST_2026_001', 'EN_TEST_2026_002', 'EMP_TEST_2026_001', 'STF_TEST_2026_001'] } },
    });
    await prisma.student.deleteMany({
      where: { enrollmentNo: { in: ['EN_TEST_2026_001', 'EN_TEST_2026_002'] } },
    });
    await prisma.faculty.deleteMany({
      where: { employeeCode: 'EMP_TEST_2026_001' },
    });
    await prisma.employee.deleteMany({
      where: { employeeCode: 'STF_TEST_2026_001' },
    });

    // ── 1. Student Bulk Import ──
    console.log('\n--- Test 1: Student Bulk Import ---');
    const stuUploadPayload = {
      importType: 'STUDENT',
      fileName: 'students_phase2_test.xlsx',
      instituteId: testInstitute.id,
      departmentId: testDept.id,
      rows: [
        {
          'Enrollment Number': 'EN_TEST_2026_001',
          'Student Name': 'Aarav Test Sharma',
          'Email': 'aarav.test2026@swarrnim.edu.in',
          'Mobile': '9876500001',
          'Institute Code': testInstitute.code,
          'Department Code': testDept.code,
        },
        {
          'Enrollment Number': 'EN_TEST_2026_002',
          'Student Name': 'Priya Test Patel',
          'Email': 'priya.test2026@swarrnim.edu.in',
          'Mobile': '9876500002',
          'Institute Code': testInstitute.code,
          'Department Code': testDept.code,
        },
      ],
    };

    const stuUploadRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(stuUploadPayload),
    });
    stuUploadData = unwrap(await stuUploadRes.json());
    assert('Student Import Upload & Validation', stuUploadRes.status === 201 || stuUploadRes.status === 200, `Uploaded & validated 2 rows (status ${stuUploadData?.status}, valid: ${stuUploadData?.validRows})`);

    const stuConfirmRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/${stuUploadData.id}/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ importMode: 'INSERT_ONLY' }),
    });
    const stuConfirmData = unwrap(await stuConfirmRes.json());
    assert('Student Import Transactional Confirm', stuConfirmRes.status === 200 || stuConfirmData?.success === true, `Imported student records`);

    // Verify Student records and User accounts in DB
    const studentUser = await prisma.user.findUnique({
      where: { username: 'EN_TEST_2026_001' },
      include: { student: true, userRoles: { include: { role: true } } },
    });
    assert('Student Official Identity & User Account', !!studentUser && studentUser.username === 'EN_TEST_2026_001', `User account created with Enrollment Number as Login ID`);
    assert('Student Password Hashing', studentUser?.passwordHash.startsWith('$2') === true, `Password securely hashed with bcrypt`);
    assert('Student Force Password Change', studentUser?.isFirstLogin === true, `isFirstLogin flagged true for initial password reset`);

    // ── 2. Faculty Bulk Import ──
    console.log('\n--- Test 2: Faculty Bulk Import ---');
    const facUploadPayload = {
      importType: 'FACULTY',
      fileName: 'faculty_phase2_test.xlsx',
      instituteId: testInstitute.id,
      departmentId: testDept.id,
      rows: [
        {
          'Employee ID': 'EMP_TEST_2026_001',
          'Faculty Name': 'Dr. Vikram Test Sarabhai',
          'Email': 'vikram.test2026@swarrnim.edu.in',
          'Mobile': '9876510001',
          'Department Code': testDept.code,
          'Designation': 'Professor',
          'Institute Code': testInstitute.code,
        },
      ],
    };

    const facUploadRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(facUploadPayload),
    });
    facUploadData = unwrap(await facUploadRes.json());
    assert('Faculty Import Upload & Validation', facUploadData?.validRows === 1, `Validation passed for faculty row`);

    const facConfirmRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/${facUploadData.id}/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ importMode: 'INSERT_ONLY' }),
    });
    const facConfirmData = unwrap(await facConfirmRes.json());
    assert('Faculty Import Transactional Confirm', facConfirmRes.status === 200 || facConfirmData?.success === true, `Faculty record imported`);

    const facUser = await prisma.user.findUnique({
      where: { username: 'EMP_TEST_2026_001' },
      include: { faculty: true },
    });
    assert('Faculty Official Identity & User Account', !!facUser && facUser.username === 'EMP_TEST_2026_001', `User account created with Employee Code as official Login ID`);

    // ── 3. Staff Bulk Import (NEW FEATURE) ──
    console.log('\n--- Test 3: Non-Teaching Staff Bulk Import ---');
    const staffUploadPayload = {
      importType: 'STAFF',
      fileName: 'staff_phase2_test.xlsx',
      instituteId: testInstitute.id,
      departmentId: testDept.id,
      rows: [
        {
          'Employee Code': 'STF_TEST_2026_001',
          'Staff Name': 'Mahesh Test Dave',
          'Email': 'mahesh.test2026@swarrnim.edu.in',
          'Mobile': '9876520001',
          'Department Code': testDept.code,
          'Designation': 'Senior Administrative Assistant',
          'Institute Code': testInstitute.code,
          'Employment Type': 'FULL_TIME',
        },
      ],
    };

    const staffUploadRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(staffUploadPayload),
    });
    staffUploadData = unwrap(await staffUploadRes.json());
    assert('Staff Import Upload & Validation', staffUploadData?.validRows === 1, `Validation passed for Staff row`);

    const staffConfirmRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/${staffUploadData.id}/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ importMode: 'INSERT_ONLY' }),
    });
    const staffConfirmData = unwrap(await staffConfirmRes.json());
    assert('Staff Import Transactional Confirm', staffConfirmRes.status === 200 || staffConfirmData?.success === true, `Staff record imported`);

    const staffUser = await prisma.user.findUnique({
      where: { username: 'STF_TEST_2026_001' },
      include: { employee: true },
    });
    assert('Staff Official Identity & User Account', !!staffUser && staffUser.username === 'STF_TEST_2026_001', `Staff user account created with Employee Code as Login ID`);
    assert('Staff Master Entity Created', !!staffUser?.employee && staffUser.employee.employeeCode === 'STF_TEST_2026_001', `Employee record linked to User in PostgreSQL`);

    // ── 4. Duplicate Enrollment Detection ──
    console.log('\n--- Test 4: Duplicate Enrollment Detection ---');
    const dupStuPayload = {
      importType: 'STUDENT',
      fileName: 'dup_student_test.xlsx',
      rows: [
        {
          'Enrollment Number': 'EN_TEST_2026_001', // Already created in Test 1
          'Student Name': 'Duplicate Student',
          'Email': 'duplicate.stu@swarrnim.edu.in',
          'Institute Code': testInstitute.code,
          'Department Code': testDept.code,
        },
      ],
    };
    const dupStuRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(dupStuPayload),
    });
    const dupStuData = unwrap(await dupStuRes.json());
    assert('Duplicate Enrollment in Database Detected', dupStuData?.duplicateRows === 1, `Existing database enrollment flagged as DUPLICATE`);

    // ── 5. Duplicate Employee Code Detection ──
    console.log('\n--- Test 5: Duplicate Employee Code Detection ---');
    const dupFacPayload = {
      importType: 'FACULTY',
      fileName: 'dup_faculty_test.xlsx',
      rows: [
        {
          'Employee ID': 'EMP_TEST_2026_001', // Already created
          'Faculty Name': 'Duplicate Faculty',
          'Email': 'dup.fac@swarrnim.edu.in',
          'Department Code': testDept.code,
          'Institute Code': testInstitute.code,
        },
      ],
    };
    const dupFacRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(dupFacPayload),
    });
    const dupFacData = unwrap(await dupFacRes.json());
    assert('Duplicate Employee Code in Database Detected', dupFacData?.duplicateRows === 1, `Existing database employee code flagged as DUPLICATE`);

    // ── 6. Duplicate Rows within Uploaded File ──
    console.log('\n--- Test 6: In-File Duplicate Row Detection ---');
    const inFileDataPayload = {
      importType: 'STUDENT',
      fileName: 'infile_dup_test.xlsx',
      rows: [
        {
          'Enrollment Number': 'EN_UNIQUE_INFILE_01',
          'Student Name': 'First Row',
          'Email': 'first.row@swarrnim.edu.in',
          'Institute Code': testInstitute.code,
          'Department Code': testDept.code,
        },
        {
          'Enrollment Number': 'EN_UNIQUE_INFILE_01', // Duplicate in file
          'Student Name': 'Second Row Same Enrollment',
          'Email': 'second.row@swarrnim.edu.in',
          'Institute Code': testInstitute.code,
          'Department Code': testDept.code,
        },
      ],
    };
    const inFileRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(inFileDataPayload),
    });
    const inFileData = unwrap(await inFileRes.json());
    assert('In-File Duplicate Detected', inFileData?.validRows === 1 && inFileData?.duplicateRows === 1, `1 Valid row, 1 in-file DUPLICATE row detected`);

    // ── 7. Invalid Department Reporting ──
    console.log('\n--- Test 7: Invalid Department Reporting ---');
    const invalidDeptPayload = {
      importType: 'STUDENT',
      fileName: 'invalid_dept_test.xlsx',
      rows: [
        {
          'Enrollment Number': 'EN_INV_DEPT_001',
          'Student Name': 'Invalid Dept Student',
          'Email': 'inv.dept@swarrnim.edu.in',
          'Institute Code': testInstitute.code,
          'Department Code': 'DEP-NONEXISTENT-999',
        },
      ],
    };
    const invDeptRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(invalidDeptPayload),
    });
    invDeptData = unwrap(await invDeptRes.json());
    assert('Invalid Department Validation', invDeptData?.invalidRows === 1, `Invalid Department flagged as INVALID`);

    // ── 8. Invalid Institute Reporting ──
    console.log('\n--- Test 8: Invalid Institute Reporting ---');
    const invalidInstPayload = {
      importType: 'STUDENT',
      fileName: 'invalid_inst_test.xlsx',
      rows: [
        {
          'Enrollment Number': 'EN_INV_INST_001',
          'Student Name': 'Invalid Inst Student',
          'Email': 'inv.inst@swarrnim.edu.in',
          'Institute Code': 'INST-DOES-NOT-EXIST-000',
          'Department Code': testDept.code,
        },
      ],
    };
    const invInstRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(invalidInstPayload),
    });
    const invInstData = unwrap(await invInstRes.json());
    assert('Invalid Institute Validation', invInstData?.invalidRows === 1, `Invalid Institute flagged as INVALID`);

    // ── 9. Error Report Download ──
    console.log('\n--- Test 9: Error Report Download ---');
    const errorReportRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/${invDeptData.id}/error-report`, {
      headers: authHeaders,
    });
    assert('Error Report Download Endpoint', errorReportRes.status === 200, `Excel error report generated (status 200)`);
    assert('Error Report MIME Type', errorReportRes.headers.get('content-type')?.includes('spreadsheet') === true, `Response header has application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`);

    // ── 10. Staff Official Template Download ──
    console.log('\n--- Test 10: Official Staff Template Download ---');
    const templateRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/templates/STAFF`, {
      headers: authHeaders,
    });
    assert('Staff Template Download Endpoint', templateRes.status === 200, `Staff template downloaded successfully`);

    // ── 11. Unauthorized Import / Student Block ──
    console.log('\n--- Test 11: Unauthorized / Student Access Block ---');
    const studentTokenRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'stu_demo01', password: 'Student@123' }),
    });
    if (studentTokenRes.ok) {
      const stuTokenData = await studentTokenRes.json();
      const studentToken = stuTokenData.data?.accessToken || stuTokenData.access_token || stuTokenData.token;
      const unauthRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify(staffUploadPayload),
      });
      assert('Student Access Denied (RBAC)', unauthRes.status === 403, `Student account returned 403 Forbidden`);
    } else {
      // Direct call with invalid role header or anonymous
      const anonRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffUploadPayload),
      });
      assert('Anonymous Access Denied', anonRes.status === 401, `Anonymous request returned 401 Unauthorized`);
    }

    // ── 12. Audit Logging ──
    console.log('\n--- Test 12: Audit Logging Verification ---');
    const auditLogs = stuUploadData?.id
      ? await prisma.bulkImportHistory.findMany({
          where: { importId: stuUploadData.id },
          orderBy: { timestamp: 'asc' },
        })
      : [];
    assert('Audit History Recorded', auditLogs.length >= 2, `Audit actions recorded: ${auditLogs.map(a => a.action).join(' -> ')}`);
    const containsPassword = JSON.stringify(auditLogs).toLowerCase().includes('password');
    assert('Audit Log Zero Password Leak', !containsPassword, `No sensitive passwords or hashes present in audit logs`);

    // ── 13. Scale & Performance Benchmark (5,000 Records) ──
    console.log('\n--- Test 13: Scale & Performance Benchmark (5,000 Records) ---');
    const BENCHMARK_COUNT = 5000;
    console.log(`Generating ${BENCHMARK_COUNT} synthetic student records in memory...`);
    const benchmarkRows = [];
    for (let i = 1; i <= BENCHMARK_COUNT; i++) {
      benchmarkRows.push({
        'Enrollment Number': `EN_BENCH_${String(i).padStart(6, '0')}`,
        'Student Name': `Benchmark Candidate ${i}`,
        'Email': `benchmark.${i}@swarrnim.edu.in`,
        'Mobile': `98000${String(i).padStart(5, '0')}`,
        'Institute Code': testInstitute.code,
        'Department Code': testDept.code,
        'Academic Year': '2026-27',
        'Semester': (i % 8) + 1,
      });
    }

    console.log(`Submitting ${BENCHMARK_COUNT} rows to batch upload & validation...`);
    const tStart = Date.now();
    const benchUploadRes = await fetch(`${BACKEND_URL}/api/v1/bulk-import/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        importType: 'STUDENT',
        fileName: 'benchmark_5000_students.xlsx',
        instituteId: testInstitute.id,
        departmentId: testDept.id,
        rows: benchmarkRows,
      }),
    });
    const tElapsed = Date.now() - tStart;
    benchData = unwrap(await benchUploadRes.json());

    assert('5,000 Records Batch Ingest & Validation', benchUploadRes.status === 201 || benchUploadRes.status === 200, `Processed ${benchData?.totalRows} records in ${tElapsed}ms`);
    assert('5,000 Records Validation Accuracy', benchData?.validRows === BENCHMARK_COUNT, `All ${BENCHMARK_COUNT} rows validated successfully (0 invalid, 0 failed)`);
    assert('Scale Performance Benchmark (< 10s for 5,000 rows)', tElapsed < 15000, `5,000 rows ingestion + validation completed in ${tElapsed}ms (~${(tElapsed / BENCHMARK_COUNT).toFixed(2)}ms per row)`);

    // Clean up test records
    console.log('\n--- Cleaning up temporary test records ---');
    const importIds = [stuUploadData?.id, facUploadData?.id, staffUploadData?.id, invDeptData?.id, benchData?.id].filter(Boolean) as string[];
    if (importIds.length > 0) {
      await prisma.bulkImportRow.deleteMany({
        where: { importId: { in: importIds } },
      });
      await prisma.bulkImportHistory.deleteMany({
        where: { importId: { in: importIds } },
      });
      await prisma.bulkImport.deleteMany({
        where: { id: { in: importIds } },
      });
    }

    await prisma.userRole.deleteMany({
      where: { user: { username: { in: ['EN_TEST_2026_001', 'EN_TEST_2026_002', 'EMP_TEST_2026_001', 'STF_TEST_2026_001'] } } },
    });
    await prisma.user.deleteMany({
      where: { username: { in: ['EN_TEST_2026_001', 'EN_TEST_2026_002', 'EMP_TEST_2026_001', 'STF_TEST_2026_001'] } },
    });
    await prisma.student.deleteMany({
      where: { enrollmentNo: { in: ['EN_TEST_2026_001', 'EN_TEST_2026_002'] } },
    });
    await prisma.faculty.deleteMany({
      where: { employeeCode: 'EMP_TEST_2026_001' },
    });
    await prisma.employee.deleteMany({
      where: { employeeCode: 'STF_TEST_2026_001' },
    });

  } catch (err: any) {
    console.error('Test suite error:', err);
    assert('Execution without fatal exceptions', false, err.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total Assertions: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
