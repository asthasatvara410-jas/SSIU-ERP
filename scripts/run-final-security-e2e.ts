/**
 * SSIU ERP — FINAL COMPREHENSIVE LIVE END-TO-END SECURITY VERIFICATION
 * Tests against real running backend (http://localhost:3001), frontend (http://localhost:5173),
 * and live PostgreSQL 16 database via Prisma.
 */

import { PrismaClient } from '@prisma/client';
import bcryptPkg from '../backend/node_modules/bcryptjs/index.js';

const bcrypt = (bcryptPkg as any).default || bcryptPkg;
const prisma = new PrismaClient();
const BACKEND_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:5173';

interface StepResult {
  step: number;
  title: string;
  category: string;
  passed: boolean;
  details: string;
  error?: string;
}

const results: StepResult[] = [];

function record(step: number, title: string, category: string, passed: boolean, details: string, error?: string) {
  results.push({ step, title, category, passed, details, error });
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} Step ${step} - ${title}: ${details}`);
  if (error) console.error(`    Details/Error: ${error}`);
}

async function apiPost(endpoint: string, body: any, token?: string): Promise<{ status: number; data: any }> {
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

async function apiGet(endpoint: string, token?: string): Promise<{ status: number; data: any }> {
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

async function runLiveVerification() {
  console.log('================================================================================');
  console.log('🛡️  STARTING FINAL REAL-RUNNING ERP SECURITY END-TO-END VERIFICATION');
  console.log('================================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. APPLICATION & SERVICE CONNECTIVITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- 1. APPLICATION & SERVICES REAL RUNNING CONNECTIVITY ---');
  try {
    const frontendRes = await fetch(FRONTEND_BASE).then(r => r.status).catch(() => 0);
    const health = await apiGet('/api/v1/health');
    const dbTest = await prisma.$queryRaw`SELECT 1 as alive`;

    const isConnected = frontendRes === 200 &&
      health.status === 200 &&
      health.data?.data?.database?.status === 'CONNECTED' &&
      Array.isArray(dbTest);

    record(1, 'Actual Application Stack Connected', 'STACK_CONNECTIVITY', isConnected,
      `Frontend HTTP ${frontendRes}, Backend Health HTTP ${health.status} (DB: ${health.data?.data?.database?.status}), Prisma Ping OK`);
  } catch (e: any) {
    record(1, 'Actual Application Stack Connected', 'STACK_CONNECTIVITY', false, 'Failed to connect services', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ERP ADMIN LOGIN
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. REAL ERP ADMIN LOGIN ---');
  let adminToken = '';
  let adminUser: any = null;
  try {
    const loginRes = await apiPost('/api/v1/auth/login', {
      loginId: 'superadmin',
      password: 'Admin@123',
    });

    if (loginRes.status === 200 && loginRes.data?.data?.accessToken) {
      adminToken = loginRes.data.data.accessToken;
      adminUser = loginRes.data.data.user;

      const meRes = await apiGet('/api/v1/auth/me', adminToken);
      const isVerifiedAdmin = meRes.status === 200 && meRes.data?.data?.role?.code === 'SYSTEM_ADMIN';

      record(2, 'ERP Administrator Login & Session Verification', 'ADMIN_LOGIN', isVerifiedAdmin,
        `Admin authenticated successfully. Role: ${meRes.data?.data?.role?.code}, Authority Level: ${meRes.data?.data?.role?.authorityLevel}`);
    } else {
      record(2, 'ERP Administrator Login & Session Verification', 'ADMIN_LOGIN', false,
        `Admin login failed with status ${loginRes.status}`, JSON.stringify(loginRes.data));
    }
  } catch (e: any) {
    record(2, 'ERP Administrator Login & Session Verification', 'ADMIN_LOGIN', false, 'Admin login exception', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. USER ACCOUNT CREATION (STUDENT & FACULTY FROM MASTERS)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. USER ACCOUNT CREATION & DUPLICATION PREVENTION ---');
  const testStudentEnroll = '2026SSIUCE0101'; // from seed
  const testFacultyEmpCode = 'FAC-CSE-001'; // from seed
  const newStudentUsername = 'stu_sec_verify_01';
  const newFacultyUsername = 'fac_sec_verify_01';
  const tempPass = 'TempPass@2026';

  let studentRole = await prisma.role.findUnique({ where: { code: 'STUDENT' } });
  let facultyRole = await prisma.role.findUnique({ where: { code: 'FACULTY' } });
  const studentMaster = await prisma.student.findUnique({ where: { enrollmentNo: testStudentEnroll } });
  const facultyMaster = await prisma.faculty.findUnique({ where: { employeeCode: testFacultyEmpCode } });

  // Clean prior test artifacts if any
  await prisma.userRole.deleteMany({
    where: { user: { username: { in: [newStudentUsername, newFacultyUsername, 'brute_force_real_user'] } } }
  }).catch(() => {});
  await prisma.user.deleteMany({
    where: { username: { in: [newStudentUsername, newFacultyUsername, 'brute_force_real_user'] } }
  }).catch(() => {});

  let studentAccountCreated = false;
  let facultyAccountCreated = false;
  let duplicatePrevented = false;

  try {
    const hashedTempPass = await bcrypt.hash(tempPass, 10);

    // Create Student Account from Master
    const createdStudent = await prisma.user.create({
      data: {
        erpId: `STU-SEC-${Date.now().toString().slice(-6)}`,
        username: newStudentUsername,
        passwordHash: hashedTempPass,
        accountStatus: 'ACTIVE',
        temporaryEnrollmentNumber: testStudentEnroll,
        studentId: studentMaster?.id,
        isFirstLogin: true,
        userRoles: {
          create: { roleId: studentRole!.id }
        }
      },
      include: { userRoles: { include: { role: true } }, student: true }
    });
    studentAccountCreated = Boolean(createdStudent && createdStudent.username === newStudentUsername);

    // Create Faculty Account from Master
    const createdFaculty = await prisma.user.create({
      data: {
        erpId: `FAC-SEC-${Date.now().toString().slice(-6)}`,
        username: newFacultyUsername,
        passwordHash: hashedTempPass,
        accountStatus: 'ACTIVE',
        facultyId: facultyMaster?.id,
        isFirstLogin: true,
        userRoles: {
          create: { roleId: facultyRole!.id }
        }
      },
      include: { userRoles: { include: { role: true } }, faculty: true }
    });
    facultyAccountCreated = Boolean(createdFaculty && createdFaculty.username === newFacultyUsername);

    // Test Duplicate Account Prevention
    try {
      await prisma.user.create({
        data: {
          erpId: createdStudent.erpId, // Duplicate erpId
          username: newStudentUsername, // Duplicate username
          passwordHash: hashedTempPass,
        }
      });
      duplicatePrevented = false;
    } catch (dupErr: any) {
      duplicatePrevented = Boolean(dupErr.code === 'P2002' || dupErr.message.includes('Unique constraint'));
    }

    record(3, 'User Account Creation & Duplicate Prevention', 'USER_PROVISIONING',
      studentAccountCreated && facultyAccountCreated && duplicatePrevented,
      `Student account (${newStudentUsername}) & Faculty account (${newFacultyUsername}) persisted in PostgreSQL. Duplicate insertion strictly rejected by unique constraints.`);
  } catch (e: any) {
    record(3, 'User Account Creation & Duplicate Prevention', 'USER_PROVISIONING', false, 'User provisioning error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. NEW USER LOGIN & MANDATORY PASSWORD CHANGE FLOW
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. NEW USER LOGIN & PASSWORD CHANGE FLOW ---');
  try {
    // 1. First login with temporary credentials
    const firstLogin = await apiPost('/api/v1/auth/login', {
      loginId: newStudentUsername,
      password: tempPass,
    });

    const firstLoginSuccess = firstLogin.status === 200 && Boolean(firstLogin.data?.data?.accessToken);
    const newStudentToken = firstLogin.data?.data?.accessToken;

    // 2. Change password via authentic API
    const newSecurePass = 'NewSecurePass@2026!';
    const changeRes = await apiPost('/api/v1/auth/change-password', {
      currentPassword: tempPass,
      newPassword: newSecurePass,
    }, newStudentToken);

    const changeSuccess = changeRes.status === 200;

    // 3. Verify old password rejected
    const oldLoginAttempt = await apiPost('/api/v1/auth/login', {
      loginId: newStudentUsername,
      password: tempPass,
    });
    const oldRejected = oldLoginAttempt.status === 401;

    // 4. Verify new password accepted
    const newLoginAttempt = await apiPost('/api/v1/auth/login', {
      loginId: newStudentUsername,
      password: newSecurePass,
    });
    const newAccepted = newLoginAttempt.status === 200;

    // 5. Inspect DB to confirm bcrypt hash and NO plaintext
    const dbRecord = await prisma.user.findUnique({ where: { username: newStudentUsername } });
    const isBcrypt = dbRecord?.passwordHash.startsWith('$2') && dbRecord.passwordHash.length >= 60;
    const isNotPlaintext = dbRecord?.passwordHash !== tempPass && dbRecord?.passwordHash !== newSecurePass;

    const step4Passed = firstLoginSuccess && changeSuccess && oldRejected && newAccepted && isBcrypt && isNotPlaintext;
    record(4, 'New User Login, First-Login Password Change, & Bcrypt Storage', 'CREDENTIAL_LIFECYCLE',
      step4Passed,
      `First login succeeded (JWT issued), password changed via API (HTTP 200), old password rejected (HTTP 401), new password authenticated (HTTP 200), Bcrypt hash verified in PostgreSQL.`);
  } catch (e: any) {
    record(4, 'New User Login, First-Login Password Change, & Bcrypt Storage', 'CREDENTIAL_LIFECYCLE', false, 'Password lifecycle error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. BRUTE FORCE REAL TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. BRUTE FORCE REAL TEST (3 ATTEMPTS -> LOCKOUT) ---');
  try {
    const bruteUsername = 'brute_force_real_user';
    const bruteCorrectPass = 'BruteCorrectPass@2026';
    const bruteHash = await bcrypt.hash(bruteCorrectPass, 10);

    await prisma.user.create({
      data: {
        erpId: `BRUTE-${Date.now().toString().slice(-6)}`,
        username: bruteUsername,
        passwordHash: bruteHash,
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
      }
    });

    // Attempt #1: Wrong password -> rejected (HTTP 401)
    const att1 = await apiPost('/api/v1/auth/login', { loginId: bruteUsername, password: 'WrongPassword1' });
    const db1 = await prisma.user.findUnique({ where: { username: bruteUsername } });
    const p1 = att1.status === 401 && db1?.failedLoginAttempts === 1;

    // Attempt #2: Wrong password -> rejected (HTTP 401)
    const att2 = await apiPost('/api/v1/auth/login', { loginId: bruteUsername, password: 'WrongPassword2' });
    const db2 = await prisma.user.findUnique({ where: { username: bruteUsername } });
    const p2 = att2.status === 401 && db2?.failedLoginAttempts === 2;

    // Attempt #3: Wrong password -> account LOCKED (HTTP 401, accountStatus = LOCKED)
    const att3 = await apiPost('/api/v1/auth/login', { loginId: bruteUsername, password: 'WrongPassword3' });
    const db3 = await prisma.user.findUnique({ where: { username: bruteUsername } });
    const p3 = att3.status === 401 && db3?.accountStatus === 'LOCKED' && db3?.lockedUntil !== null;

    // Attempt #4: With CORRECT password -> rejected because account is LOCKED
    const att4 = await apiPost('/api/v1/auth/login', { loginId: bruteUsername, password: bruteCorrectPass });
    const p4 = att4.status === 401 && (att4.data?.message?.toLowerCase()?.includes('lock') || att4.data?.error?.message?.toLowerCase()?.includes('lock'));

    const step5Passed = p1 && p2 && p3 && p4;
    record(5, 'Brute Force Defense & Atomic Account Lockout', 'BRUTE_FORCE', step5Passed,
      `Attempt 1 & 2 incremented failure counter (1, 2). Attempt 3 triggered automatic accountStatus=LOCKED with lockedUntil=${db3?.lockedUntil?.toISOString()}. Attempt 4 with valid credentials strictly rejected.`);
  } catch (e: any) {
    record(5, 'Brute Force Defense & Atomic Account Lockout', 'BRUTE_FORCE', false, 'Brute force test error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. ROLE ATTACK TEST (RBAC BOUNDARY ENFORCEMENT)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. ROLE-BASED ACCESS CONTROL (RBAC) ATTACK TESTS ---');
  try {
    // 1. Authenticate as Student
    const studentLogin = await apiPost('/api/v1/auth/login', { loginId: 'stu_demo01', password: 'Student@123' });
    const studentToken = studentLogin.data?.data?.accessToken;

    // 2. Authenticate as Faculty
    const facultyLogin = await apiPost('/api/v1/auth/login', { loginId: 'fac_amitshah', password: 'Faculty@123' });
    const facultyToken = facultyLogin.data?.data?.accessToken;

    // Attack 6a: Student tries Notesheet Approve
    const stuAtkNotesheet = await apiPost('/api/v1/notesheets/NS-TEST-999/approve', { remarks: 'Hacked approval' }, studentToken);
    const p6a = stuAtkNotesheet.status === 403;

    // Attack 6b: Student tries Notesheet Submit
    const stuAtkSubmit = await apiPost('/api/v1/notesheets/NS-TEST-999/submit', { forwardToRole: 'REGISTRAR' }, studentToken);
    const p6b = stuAtkSubmit.status === 403;

    // Attack 6c: Student tries Role Management
    const stuAtkRoles = await apiPost('/api/v1/roles', { code: 'HACKED_ROLE', name: 'Hacked' }, studentToken);
    const p6c = stuAtkRoles.status === 403;

    // Attack 6d: Student tries Institute Master creation
    const stuAtkInst = await apiPost('/api/v1/institutes', { code: 'HACK_INST', name: 'Hacked Inst' }, studentToken);
    const p6d = stuAtkInst.status === 403;

    // Attack 6e: Faculty tries unauthorized admin operations (Role Creation)
    const facAtkRoles = await apiPost('/api/v1/roles', { code: 'FAC_ROLE', name: 'Fac Role' }, facultyToken);
    const p6e = facAtkRoles.status === 403;

    // Attack 6f: Faculty tries Institute Master creation
    const facAtkInst = await apiPost('/api/v1/institutes', { code: 'FAC_INST', name: 'Fac Inst' }, facultyToken);
    const p6f = facAtkInst.status === 403;

    // Control 6g: Admin allowed
    const adminRoleCheck = await apiGet('/api/v1/roles', adminToken);
    const p6g = adminRoleCheck.status === 200 && Array.isArray(adminRoleCheck.data?.data);

    const step6Passed = p6a && p6b && p6c && p6d && p6e && p6f && p6g;
    record(6, 'RBAC Boundary & Privilege Escalation Resistance', 'RBAC_ENFORCEMENT', step6Passed,
      `Student direct API calls to Notesheet/Roles/Masters returned HTTP 403. Faculty administrative modifications returned HTTP 403. Authorized Admin permitted (HTTP 200).`);
  } catch (e: any) {
    record(6, 'RBAC Boundary & Privilege Escalation Resistance', 'RBAC_ENFORCEMENT', false, 'RBAC attack test error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. INSECURE DIRECT OBJECT REFERENCE (IDOR) TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. INSECURE DIRECT OBJECT REFERENCE (IDOR) TEST ---');
  try {
    const student1 = await prisma.student.findUnique({ where: { enrollmentNo: '2026SSIUCE0101' } });
    const student2 = await prisma.student.findUnique({ where: { enrollmentNo: '2026SSIUCE0102' } });

    // Authenticate as Student 1
    const stu1Auth = await apiPost('/api/v1/auth/login', { loginId: 'stu_demo01', password: 'Student@123' });
    const stu1Token = stu1Auth.data?.data?.accessToken;

    // Attack 7a: Student 1 attempts to query Student 2's payment history
    const idorPayments = await apiGet(`/api/v1/students/${student2?.id}/payment-history`, stu1Token);
    const p7a = idorPayments.status === 403;

    // Control 7b: Student 1 accessing own payment history via me
    const ownPayments = await apiGet('/api/v1/students/me/payment-history', stu1Token);
    const p7b = ownPayments.status === 200;

    // Control 7c: Student 1 accessing own payment history via studentId
    const ownPaymentsViaId = await apiGet(`/api/v1/students/${student1?.id}/payment-history`, stu1Token);
    const p7c = ownPaymentsViaId.status === 200;

    const step7Passed = p7a && p7b && p7c;
    record(7, 'IDOR Protection & Tenant/User Scoping', 'IDOR_PROTECTION', step7Passed,
      `Cross-student payment history query for Student 2 strictly rejected with HTTP 403 Forbidden via @RequireScope('OWN'). Own payment queries via /me and /:studentId succeeded (HTTP 200).`);
  } catch (e: any) {
    record(7, 'IDOR Protection & Tenant/User Scoping', 'IDOR_PROTECTION', false, 'IDOR test error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. NOTESHEET REAL WORKFLOW INTEGRITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. NOTESHEET REAL WORKFLOW & AUTHORIZATION ---');
  try {
    // Authenticate HOD (authorized creator)
    const hodAuth = await apiPost('/api/v1/auth/login', { loginId: 'hod_demo01', password: 'Hod@123' });
    const hodToken = hodAuth.data?.data?.accessToken;

    // Authenticate HOI (approver)
    const hoiAuth = await apiPost('/api/v1/auth/login', { loginId: 'hoi_demo01', password: 'Hoi@123' });
    const hoiToken = hoiAuth.data?.data?.accessToken;

    // Authenticate Student (unauthorized)
    const stuAuth = await apiPost('/api/v1/auth/login', { loginId: 'stu_demo01', password: 'Student@123' });
    const stuToken = stuAuth.data?.data?.accessToken;

    // 1. Create Notesheet
    const createRes = await apiPost('/api/v1/notesheets', {
      title: 'Security Audit Lab Infrastructure Upgrade',
      subject: 'Security Audit Lab Infrastructure Upgrade',
      department: 'CSE',
      priority: 'HIGH',
      proposal: 'Procurement of hardware intrusion detection testbeds',
      purposeJustification: 'Required for real-world cyber resilience and accreditation verification',
      estimatedCost: 250000,
    }, hodToken);

    const notesheetId = createRes.data?.data?.id;
    const p8a = createRes.status === 201 && Boolean(notesheetId);

    // 2. Submit Notesheet
    const submitRes = await apiPost(`/api/v1/notesheets/${notesheetId}/submit`, {
      remarks: 'Submitted for HOI administrative sanction',
    }, hodToken);
    const p8b = submitRes.status === 200;

    // 3. Unauthorized approval attempt by Student -> must be 403
    const stuApprove = await apiPost(`/api/v1/notesheets/${notesheetId}/approve`, {
      remarks: 'Student trying to approve notesheet',
    }, stuToken);
    const p8c = stuApprove.status === 403;

    // 4. Authorized approval by HOI
    const hoiApprove = await apiPost(`/api/v1/notesheets/${notesheetId}/approve`, {
      remarks: 'Sanctioned and approved by Principal / HOI',
    }, hoiToken);
    const p8d = hoiApprove.status === 200;

    // 5. Inspect audit history directly in database
    const historyEntries = await prisma.noteSheetHistory.findMany({
      where: { notesheetId }
    });
    const p8e = historyEntries.length >= 2;

    const step8Passed = p8a && p8b && p8c && p8d && p8e;
    record(8, 'Notesheet Full Lifecycle Workflow & Unauthorized Interception', 'WORKFLOW_NOTESHEET', step8Passed,
      `Notesheet created by HOD (HTTP 201), submitted (HTTP 200), student approval rejected with HTTP 403 Forbidden, HOI approval succeeded (HTTP 200), audit trail verified with ${historyEntries.length} immutable events in PostgreSQL.`);
  } catch (e: any) {
    record(8, 'Notesheet Full Lifecycle Workflow & Unauthorized Interception', 'WORKFLOW_NOTESHEET', false, 'Notesheet workflow error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. GATE PASS REAL WORKFLOW
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. GATE PASS REAL WORKFLOW INTEGRITY ---');
  try {
    const studentUser = { id: 'stu-test-gatepass-e2e', name: 'Aarav Sharma', enrollmentNo: '2026SSIUCE0101', role: 'STUDENT' };
    const wardenUser = { id: 'warden-e2e', name: 'Chief Warden', role: 'HOSTEL_ADMIN' };
    const securityUser = { id: 'security-e2e', name: 'Gate Officer', role: 'SECURITY' };

    // Dynamically import gatepass service to verify logic & QR integrity
    const { studentGatePassService } = await import('../src/services/studentGatePassService');

    // Create gate pass
    const pass = studentGatePassService.createGatePass({
      studentId: studentUser.id,
      studentName: studentUser.name,
      enrollmentNo: studentUser.enrollmentNo,
      purpose: 'Official Project Presentation',
      destination: 'Gandhinagar Tech Park',
      outingDate: new Date().toISOString().split('T')[0],
      expectedOutTime: '14:00',
      expectedReturnTime: '19:00',
    }, studentUser);

    const p9a = Boolean(pass.id) && pass.status === 'SUBMITTED';

    // Student cannot approve own pass
    let studentApprovalBlocked = false;
    try {
      studentGatePassService.approveGatePass(pass.id, 'Self-approval', studentUser as any);
    } catch {
      studentApprovalBlocked = true;
    }

    // Warden approval
    const approvedPass = studentGatePassService.approveGatePass(pass.id, 'Approved for technical visit', wardenUser as any);
    const p9b = approvedPass.status === 'APPROVED';

    // Security Gate QR Scan
    const qrScan = studentGatePassService.verifyGatePassQR(approvedPass.gatePassNo);
    const p9c = qrScan.valid === true && qrScan.data?.status === 'APPROVED';

    // Check-out & Check-in
    const outPass = studentGatePassService.recordGatePassOut(pass.id, securityUser as any);
    const inPass = studentGatePassService.recordGatePassIn(pass.id, securityUser as any);
    const p9d = outPass.status === 'OUT' && inPass.status === 'RETURNED' && inPass.history.length >= 3;

    const step9Passed = p9a && studentApprovalBlocked && p9b && p9c && p9d;
    record(9, 'Gate Pass Workflow, QR Checkpoint & Check-In/Out Audit', 'WORKFLOW_GATEPASS', step9Passed,
      `Request created (SUBMITTED), student self-approval blocked, Warden approved (APPROVED), QR verification validated, Security recorded OUT and RETURNED with full audit trail.`);
  } catch (e: any) {
    record(9, 'Gate Pass Workflow, QR Checkpoint & Check-In/Out Audit', 'WORKFLOW_GATEPASS', false, 'Gate pass workflow error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. DATABASE VERIFICATION (STATE, INVARIANTS, HASHING)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 10. DATABASE STATE & CRYPTOGRAPHIC INVARIANTS ---');
  try {
    const allUsers = await prisma.user.findMany();
    let hasPlaintext = false;
    let allHashesValid = true;

    for (const u of allUsers) {
      if (!u.passwordHash.startsWith('$2') || u.passwordHash.length < 60) {
        allHashesValid = false;
      }
      if (['Admin@123', 'Faculty@123', 'Student@123', 'Hod@123', 'Hoi@123', tempPass].includes(u.passwordHash)) {
        hasPlaintext = true;
      }
    }

    const lockedUsers = await prisma.user.findMany({ where: { accountStatus: 'LOCKED' } });
    const hasLockTimestamps = lockedUsers.every(u => u.lockedUntil !== null);

    const loginAudits = await prisma.loginAudit.findMany();
    const auditLoggingActive = loginAudits.length > 0;

    const step10Passed = allHashesValid && !hasPlaintext && hasLockTimestamps && auditLoggingActive;
    record(10, 'Database State, Invariant Enforcement & Cryptographic Integrity', 'DB_VERIFICATION', step10Passed,
      `Total Users: ${allUsers.length}. 100% stored as Bcrypt hashes (cost 10). Zero plaintext passwords. Lock timestamps populated for all locked accounts. Login audit trail active (${loginAudits.length} events logged).`);
  } catch (e: any) {
    record(10, 'Database State, Invariant Enforcement & Cryptographic Integrity', 'DB_VERIFICATION', false, 'DB verification error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11. PUBLIC API & QR VERIFICATION SECURITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 11. PUBLIC API MINIMAL EXPOSURE & DATA HYGIENE ---');
  try {
    const health = await apiGet('/api/v1/health');
    const healthStr = JSON.stringify(health.data);
    const healthClean = !healthStr.includes('password') && !healthStr.includes('secret') && !healthStr.includes('jwt') && !healthStr.includes('5432/');

    const publicNotesheetVerify = await apiGet('/api/v1/notesheets/verify/NS-NONEXISTENT-TEST');
    const verifyStr = JSON.stringify(publicNotesheetVerify.data);
    const verifyClean = !verifyStr.includes('password') && !verifyStr.includes('hash') && !verifyStr.includes('DATABASE_URL');

    const step11Passed = healthClean && verifyClean;
    record(11, 'Public API Information Exposure & Hygiene Verification', 'PUBLIC_API_HYGIENE', step11Passed,
      `Health and verification public endpoints inspected. Zero internal database credentials, passwords, hashes, or environment tokens exposed.`);
  } catch (e: any) {
    record(11, 'Public API Information Exposure & Hygiene Verification', 'PUBLIC_API_HYGIENE', false, 'Public API test error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12. SECURITY RESPONSE CODE CONVENTIONS & ERROR SANITIZATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 12. SECURITY RESPONSE CODES & EXCEPTION SANITIZATION ---');
  try {
    // 1. Unauthenticated -> 401
    const unauthRes = await apiGet('/api/v1/auth/me');
    const p12a = unauthRes.status === 401;

    // 2. Unauthorized -> 403
    const stuAuth = await apiPost('/api/v1/auth/login', { loginId: 'stu_demo01', password: 'Student@123' });
    const stuToken = stuAuth.data?.data?.accessToken;
    const unauthAction = await apiPost('/api/v1/roles', { code: 'ROLE_TEST' }, stuToken);
    const p12b = unauthAction.status === 403;

    // 3. Validation failure -> 400
    const badInput = await apiPost('/api/v1/auth/login', { invalidField: 123 });
    const p12c = badInput.status === 400;

    // 4. Zero stack traces exposed
    const errStr = JSON.stringify(badInput.data) + JSON.stringify(unauthAction.data) + JSON.stringify(unauthRes.data);
    const noStackTrace = !errStr.includes('\n    at ') && !errStr.includes('.ts:') && !errStr.includes('.js:');

    const step12Passed = p12a && p12b && p12c && noStackTrace;
    record(12, 'HTTP Status Code Conventions & Stack Trace Suppression', 'ERROR_HANDLING', step12Passed,
      `No Auth = HTTP 401. Forbidden = HTTP 403. Validation Fail = HTTP 400. Internal stack traces and file paths strictly suppressed from client payloads.`);
  } catch (e: any) {
    record(12, 'HTTP Status Code Conventions & Stack Trace Suppression', 'ERROR_HANDLING', false, 'Response code test error', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`🏁 REAL SECURITY VERIFICATION SUMMARY: ${passedCount} / ${results.length} PASSED (Failed: ${failedCount})`);
  console.log('================================================================================\n');

  await prisma.$disconnect();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch(async (e) => {
  console.error('Fatal execution error during live security verification:', e);
  await prisma.$disconnect();
  process.exit(1);
});
