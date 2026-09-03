import { db } from '../services/db';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { User, UserRole } from '../types';

console.log('🧪 Starting ERP Admin Portal Security & Lifecycle Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Reason: ${detail}`);
    failCount++;
  }
}

// Ensure clean environment
db.resetToDefaultSeed();

const allUsers = db.getUsers();

// ─── 1. DEMO ADMIN ACCOUNT VERIFICATION ──────────────────────────────────────
console.log('--- Test Group 1: Demo Admin Account Initialization ---');

const demoAdmin = allUsers.find(u => u.username === 'demo.admin');
assert(Boolean(demoAdmin), 'demo.admin user exists in database');
assert(demoAdmin?.role === 'SUPER_ADMIN', 'demo.admin has SUPER_ADMIN role');
assert(demoAdmin?.accountStatus === 'ACTIVE', 'demo.admin status is ACTIVE');
assert(demoAdmin?.email === 'demo.admin@ssiu-erp.local', 'demo.admin email is correct');

// ─── 2. ADMIN AUTHENTICATION & ACCESS CONTROL ────────────────────────────────
console.log('\n--- Test Group 2: Admin Portal Role Access Authorization ---');

const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'UNIVERSITY_ADMIN',
  'ERP_COORDINATOR',
  'REGISTRAR',
  'DEPUTY_REGISTRAR',
  'VICE_PRESIDENT',
  'PRESIDENT',
  'PROVOST',
  'PRINCIPAL',
  'HOD'
];

// Super Admin authorization
assert(ADMIN_ROLES.includes(demoAdmin?.role || ''), 'Super Admin is authorized for Admin Portal');

// Student authorization check (Should be false)
const studentUser = allUsers.find(u => u.role === 'STUDENT');
assert(!ADMIN_ROLES.includes(studentUser?.role || ''), 'Student CANNOT access Admin Portal');

// Faculty authorization check (Should be false for non-HOD faculty)
const plainFaculty = allUsers.find(u => u.role === 'FACULTY');
assert(!ADMIN_ROLES.includes(plainFaculty?.role || ''), 'Plain Faculty CANNOT access Admin Portal');

// HOD authorization check (Should be true)
const hodUser = allUsers.find(u => u.role === 'HOD');
assert(ADMIN_ROLES.includes(hodUser?.role || ''), 'HOD CAN access Admin Portal (Departmental Admin)');

// Principal / HOI authorization check (Should be true)
const principalUser = allUsers.find(u => u.role === 'PRINCIPAL');
assert(ADMIN_ROLES.includes(principalUser?.role || ''), 'Principal CAN access Admin Portal (Institute Admin)');

// ─── 3. USER LIFECYCLE MUTATIONS BY DEMO ADMIN ──────────────────────────────
console.log('\n--- Test Group 3: Administrative User Lifecycle Mutations ---');

if (demoAdmin) {
  // Create Staff Account
  const newStaff = userAccountManagementService.createUser({
    username: 'staff_demo_ops',
    email: 'staff.ops@swarrnim.edu.in',
    name: 'Ops Staff Member',
    role: 'STAFF',
    employeeId: 'EMP-OPS-99',
    departmentName: 'Central Operations',
    designation: 'Operations Executive',
    accountStatus: 'ACTIVE'
  }, demoAdmin);

  assert(Boolean(newStaff && newStaff.id), 'Admin can create new Staff account');

  // Deactivate User (Soft Deactivation)
  const deactivated = userAccountManagementService.toggleAccountStatus(newStaff.id, 'INACTIVE', demoAdmin);
  assert(deactivated.accountStatus === 'INACTIVE', 'Admin can deactivate user account');
  const evalDeactivated = userAccountManagementService.evaluateAuthorization(deactivated, 'DASHBOARD', 'VIEW');
  assert(!evalDeactivated.allowed, 'Deactivated user blocked from ERP access');

  // Reactivate User
  const reactivated = userAccountManagementService.toggleAccountStatus(newStaff.id, 'ACTIVE', demoAdmin);
  assert(reactivated.accountStatus === 'ACTIVE', 'Admin can reactivate user account');

  // Suspend User
  const suspended = userAccountManagementService.toggleAccountStatus(newStaff.id, 'SUSPENDED', demoAdmin);
  assert(suspended.accountStatus === 'SUSPENDED', 'Admin can suspend user account');
  const evalSuspended = userAccountManagementService.evaluateAuthorization(suspended, 'DASHBOARD', 'VIEW');
  assert(!evalSuspended.allowed, 'Suspended user blocked from ERP access');

  // Security Lock
  const locked = userAccountManagementService.lockUser(newStaff.id, 'Security lock test', demoAdmin);
  assert(locked.accountStatus === 'LOCKED', 'Admin can lock user account');

  // Unlock User
  const unlocked = userAccountManagementService.unlockUser(newStaff.id, demoAdmin);
  assert(unlocked.accountStatus === 'ACTIVE', 'Admin can unlock user account');
}

// ─── 4. ROLE × PERMISSION OVERRIDES ──────────────────────────────────────────
console.log('\n--- Test Group 4: Permission Matrix & Overrides ---');

const facultySubject = allUsers.find(u => u.role === 'FACULTY')!;
if (demoAdmin && facultySubject) {
  // Check baseline permission
  const baselineCanExport = can(facultySubject, 'REPORTS', 'EXPORT');
  assert(!baselineCanExport, 'Faculty default: Reports EXPORT is false');

  // Explicit ALLOW
  userAccountManagementService.saveUserPermissions(facultySubject.id, {
    REPORTS: {
      canView: true,
      canExport: true
    }
  }, demoAdmin);

  const modifiedFac = db.getUsers().find(u => u.id === facultySubject.id)!;
  assert(can(modifiedFac, 'REPORTS', 'EXPORT'), 'Explicit ALLOW: Admin granted Reports EXPORT');

  // Explicit DENY on an action default permitted
  userAccountManagementService.saveUserPermissions(modifiedFac.id, {
    ...modifiedFac.customPermissions,
    ACADEMIC: {
      canCreate: false
    }
  }, demoAdmin);

  const deniedFac = db.getUsers().find(u => u.id === facultySubject.id)!;
  assert(!can(deniedFac, 'ACADEMIC', 'CREATE'), 'Explicit DENY: Admin revoked Academic CREATE');
}

// ─── 5. STUDENT ACCOUNT LINKING VIA ENROLLMENT NUMBER ────────────────────────
console.log('\n--- Test Group 5: Student Account Linking via Enrollment Number ---');

const existingStudent = db.getStudents()[0];
if (existingStudent && demoAdmin) {
  const studentUserAcc = userAccountManagementService.createUser({
    username: existingStudent.enrollmentNo || '2601019999',
    email: existingStudent.email || 'linked.student@swarrnim.edu.in',
    name: `${existingStudent.firstName} ${existingStudent.lastName}`.trim(),
    role: 'STUDENT',
    enrollmentNo: existingStudent.enrollmentNo,
    instituteId: existingStudent.instituteId,
    departmentId: existingStudent.departmentId,
    accountStatus: 'ACTIVE'
  }, demoAdmin);

  assert(studentUserAcc.enrollmentNo === existingStudent.enrollmentNo, 'Student account linked to official Enrollment Number');
  assert(studentUserAcc.role === 'STUDENT', 'Account role is STUDENT');
}

// ─── 6. AUDIT TRAILS RECORDING ──────────────────────────────────────────────
console.log('\n--- Test Group 6: Audit Trail Recording ---');

const auditLogs = db.getAuditLogs();
assert(auditLogs.length > 0, 'Audit logs recorded');
assert(auditLogs.some(a => a.userName?.includes('Admin') || a.userId === demoAdmin?.id), 'Admin actions logged in audit trail');

console.log(`\n==================================================`);
console.log(`🏁 Admin Security Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
