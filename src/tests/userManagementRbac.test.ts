import { db } from '../services/db';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { User, UserRole, AccountStatus } from '../types';

console.log('🧪 Starting Enterprise User Management & RBAC Test Suite...\n');

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

// Ensure clean test environment
db.resetToDefaultSeed();

const adminUser: User = {
  id: 'usr-admin-test',
  username: 'superadmin_test',
  name: 'Test Super Administrator',
  email: 'superadmin_test@swarrnim.edu.in',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  accountStatus: 'ACTIVE',
  createdAt: new Date().toISOString()
};

// ─── 1. USER CREATION & VALIDATION ───────────────────────────────────────────
console.log('--- Test Group 1: User Creation & Duplicate Detection ---');

try {
  const newFaculty = userAccountManagementService.createUser({
    username: 'test_faculty_01',
    email: 'test_faculty_01@swarrnim.edu.in',
    name: 'Prof. Ramesh Patel',
    role: 'FACULTY',
    employeeId: 'EMP-TEST-001',
    phone: '9876543210',
    departmentName: 'Computer Engineering',
    designation: 'Assistant Professor',
    accountStatus: 'ACTIVE'
  }, adminUser);

  assert(Boolean(newFaculty && newFaculty.id), 'Create valid Faculty account');
  assert(newFaculty.accountStatus === 'ACTIVE', 'Account status defaults to ACTIVE');
  assert(newFaculty.role === 'FACULTY', 'Correct role assigned');
} catch (e: any) {
  assert(false, 'Create valid Faculty account', e.message);
}

// Test Duplicate Username
try {
  userAccountManagementService.createUser({
    username: 'test_faculty_01',
    email: 'different_email@swarrnim.edu.in',
    name: 'Duplicate Username User',
    role: 'FACULTY'
  }, adminUser);
  assert(false, 'Reject duplicate username', 'Allowed duplicate username');
} catch (e: any) {
  assert(e.message.includes('already assigned'), 'Reject duplicate username');
}

// Test Duplicate Email
try {
  userAccountManagementService.createUser({
    username: 'unique_user_02',
    email: 'test_faculty_01@swarrnim.edu.in',
    name: 'Duplicate Email User',
    role: 'FACULTY'
  }, adminUser);
  assert(false, 'Reject duplicate email', 'Allowed duplicate email');
} catch (e: any) {
  assert(e.message.includes('already registered'), 'Reject duplicate email');
}

// ─── 2. ACCOUNT STATUS & LIFECYCLE ──────────────────────────────────────────
console.log('\n--- Test Group 2: Account Status & Lock Controls ---');

const testFaculty = db.getUsers().find(u => u.username === 'test_faculty_01');
if (testFaculty) {
  // Lock User
  const lockedUser = userAccountManagementService.lockUser(testFaculty.id, 'Security violation: Repeated anomalous attempts', adminUser);
  assert(lockedUser.accountStatus === 'LOCKED', 'User locked status set');
  assert(lockedUser.status === 'INACTIVE', 'User active flag disabled');
  assert(lockedUser.lockReason === 'Security violation: Repeated anomalous attempts', 'Lock reason stored');

  // Verify locked user cannot perform operations
  const evalLocked = userAccountManagementService.evaluateAuthorization(lockedUser, 'DASHBOARD', 'VIEW');
  assert(!evalLocked.allowed, 'Locked user authorization blocked');
  assert(evalLocked.statusCode === 403, 'Locked user returns 403 Forbidden');

  // Unlock User
  const unlockedUser = userAccountManagementService.unlockUser(testFaculty.id, adminUser);
  assert(unlockedUser.accountStatus === 'ACTIVE', 'User unlocked status restored');
  assert(unlockedUser.status === 'ACTIVE', 'User active flag restored');

  // Suspend User
  const suspendedUser = userAccountManagementService.toggleAccountStatus(testFaculty.id, 'SUSPENDED', adminUser);
  assert(suspendedUser.accountStatus === 'SUSPENDED', 'User status toggled to SUSPENDED');
  const evalSuspended = userAccountManagementService.evaluateAuthorization(suspendedUser, 'DASHBOARD', 'VIEW');
  assert(!evalSuspended.allowed, 'Suspended user authorization blocked');

  // Reactivate User
  const reactivatedUser = userAccountManagementService.toggleAccountStatus(testFaculty.id, 'ACTIVE', adminUser);
  assert(reactivatedUser.accountStatus === 'ACTIVE', 'User reactivated to ACTIVE');
} else {
  assert(false, 'Find test faculty account for lifecycle tests');
}

// ─── 3. ROLE PERMISSION MATRIX ───────────────────────────────────────────────
console.log('\n--- Test Group 3: Default Role Permission Matrix ---');

const studentUser: User = {
  id: 'usr-stud-test',
  username: '22BEIT001',
  name: 'Student Rahul',
  email: 'rahul@swarrnim.edu.in',
  role: 'STUDENT',
  status: 'ACTIVE',
  accountStatus: 'ACTIVE',
  enrollmentNo: '22BEIT001',
  createdAt: new Date().toISOString()
};

const hodUser: User = {
  id: 'usr-hod-test',
  username: 'hod_ce',
  name: 'Dr. Vikram Patel',
  email: 'hod.ce@swarrnim.edu.in',
  role: 'HOD',
  departmentId: 'dept-1',
  departmentName: 'Computer Engineering',
  status: 'ACTIVE',
  accountStatus: 'ACTIVE',
  createdAt: new Date().toISOString()
};

const hoiUser: User = {
  id: 'usr-hoi-test',
  username: 'hoi_engineering',
  name: 'Dr. Principal Mehta',
  email: 'principal@swarrnim.edu.in',
  role: 'PRINCIPAL',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  accountStatus: 'ACTIVE',
  createdAt: new Date().toISOString()
};

// Student Permissions Check
assert(can(studentUser, 'DASHBOARD', 'VIEW'), 'Student can VIEW Dashboard');
assert(can(studentUser, 'FEEDBACK', 'CREATE'), 'Student can CREATE Feedback');
assert(!can(studentUser, 'USER_MANAGEMENT', 'VIEW'), 'Student CANNOT VIEW User Management');
assert(!can(studentUser, 'NOTESHEET', 'VIEW'), 'Student CANNOT VIEW Notesheet');

// HOD Permissions Check
assert(can(hodUser, 'ACADEMIC', 'APPROVE'), 'HOD can APPROVE Academic records');
assert(can(hodUser, 'FEEDBACK', 'VIEW'), 'HOD can VIEW Feedback');
assert(can(hodUser, 'NOTESHEET', 'APPROVE'), 'HOD can APPROVE Notesheet');

// HOI / Principal Permissions Check
assert(can(hoiUser, 'ACADEMIC', 'APPROVE'), 'HOI can APPROVE Institute Academic records');
assert(can(hoiUser, 'NOTESHEET', 'APPROVE'), 'HOI can APPROVE Institute Notesheets');

// ─── 4. SCOPE CONSTRAINTS ───────────────────────────────────────────────────
console.log('\n--- Test Group 4: Data Scope & Boundary Restrictions ---');

// HOD in Dept-1 checking Dept-1 vs Dept-2
const hodDept1Access = userAccountManagementService.evaluateAuthorization(hodUser, 'ACADEMIC', 'VIEW', {
  departmentId: 'dept-1'
});
assert(hodDept1Access.allowed, 'HOD can access own department (Dept-1)');

const hodDept2Access = userAccountManagementService.evaluateAuthorization(hodUser, 'ACADEMIC', 'VIEW', {
  departmentId: 'dept-2'
});
assert(!hodDept2Access.allowed, 'HOD restricted from other department (Dept-2)');

// HOI in Inst-1 checking Inst-1 vs Inst-2
const hoiInst1Access = userAccountManagementService.evaluateAuthorization(hoiUser, 'ACADEMIC', 'VIEW', {
  instituteId: 'inst-1'
});
assert(hoiInst1Access.allowed, 'HOI can access own institute (Inst-1)');

const hoiInst2Access = userAccountManagementService.evaluateAuthorization(hoiUser, 'ACADEMIC', 'VIEW', {
  instituteId: 'inst-2'
});
assert(!hoiInst2Access.allowed, 'HOI restricted from other institute (Inst-2)');

// Student checking own record vs other student record
const studentOwnAccess = userAccountManagementService.evaluateAuthorization(studentUser, 'STUDENTS', 'VIEW', {
  targetUserId: studentUser.id
});
assert(studentOwnAccess.allowed, 'Student can view own profile');

const studentOtherAccess = userAccountManagementService.evaluateAuthorization(studentUser, 'STUDENTS', 'VIEW', {
  targetUserId: 'other-student-id'
});
assert(!studentOtherAccess.allowed, 'Student restricted from other student profile');

// ─── 5. CUSTOM PERMISSION OVERRIDES ──────────────────────────────────────────
console.log('\n--- Test Group 5: Custom Permission Overrides (Explicit ALLOW / DENY) ---');

const facultyOverrideTest: User = {
  id: 'usr-fac-override',
  username: 'fac_custom',
  name: 'Prof. Custom Access',
  email: 'custom@swarrnim.edu.in',
  role: 'FACULTY',
  status: 'ACTIVE',
  accountStatus: 'ACTIVE',
  createdAt: new Date().toISOString()
};
db.addEntity('users', facultyOverrideTest);

// Default faculty cannot EXPORT reports
assert(!can(facultyOverrideTest, 'REPORTS', 'EXPORT'), 'Default Faculty CANNOT export reports');

// Apply Explicit ALLOW Override
userAccountManagementService.saveUserPermissions(facultyOverrideTest.id, {
  REPORTS: {
    canView: true,
    canExport: true
  }
}, adminUser);

const refreshedFaculty = db.getUsers().find(u => u.id === facultyOverrideTest.id)!;
assert(can(refreshedFaculty, 'REPORTS', 'EXPORT'), 'Explicit ALLOW: Faculty can now EXPORT reports');

// Apply Explicit DENY Override on a default permitted action
userAccountManagementService.saveUserPermissions(refreshedFaculty.id, {
  ...refreshedFaculty.customPermissions,
  ACADEMIC: {
    canCreate: false
  }
}, adminUser);

const refreshedFacultyDeny = db.getUsers().find(u => u.id === facultyOverrideTest.id)!;
assert(!can(refreshedFacultyDeny, 'ACADEMIC', 'CREATE'), 'Explicit DENY: Faculty creation permission revoked');

// Reset Overrides
const resetUser = userAccountManagementService.resetUserPermissions(facultyOverrideTest.id, adminUser);
assert(Object.keys(resetUser.customPermissions || {}).length === 0, 'Permissions reset to role default');
assert(!can(resetUser, 'REPORTS', 'EXPORT'), 'Reverted back to default: Cannot export reports');

// ─── 6. AUDIT LOGS ───────────────────────────────────────────────────────────
console.log('\n--- Test Group 6: Security Audit Trail Verification ---');

const audits = db.getAuditLogs();
assert(audits.length > 0, 'Audit logs recorded');
assert(audits.some(a => a.action === 'USER_CREATED'), 'USER_CREATED audit log present');
assert(audits.some(a => a.action === 'USER_LOCKED'), 'USER_LOCKED audit log present');
assert(audits.some(a => a.action === 'USER_UNLOCKED'), 'USER_UNLOCKED audit log present');
assert(audits.some(a => a.action === 'PERMISSION_CHANGED'), 'PERMISSION_CHANGED audit log present');

console.log(`\n==================================================`);
console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
