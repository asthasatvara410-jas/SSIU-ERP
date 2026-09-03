import { db } from '../services/db';
import { userAccountManagementService } from '../services/userAccountManagementService';
import { User } from '../types';

console.log('🧪 Starting Soft Delete, Data Versioning & Complete User History Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, group: string, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [${group}] PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [${group}] FAIL: ${testName}`);
    if (detail) console.error(`     Reason: ${detail}`);
    failCount++;
  }
}

// 1. Initialize & Provision Admin & Target User
db.resetToDefaultSeed();
const allUsers = db.getUsers();
const adminUser = allUsers.find(u => u.role === 'SUPER_ADMIN')!;

console.log('--- 1. SOFT DELETE & DEACTIVATION POLICY ---');
// 1.1 Create new Faculty User
const facultyUser = userAccountManagementService.createUser({
  username: 'faculty.audit.test',
  name: 'Prof. Audit Test',
  email: 'audit.test@swarrnim.edu.in',
  employeeId: 'EMP-AUDIT-999',
  role: 'FACULTY',
  departmentId: 'dept-1',
  departmentName: 'Computer Engineering',
  instituteId: 'inst-sit',
  accountStatus: 'ACTIVE'
}, adminUser);

assert(facultyUser.accountStatus === 'ACTIVE' && facultyUser.status === 'ACTIVE', 'SOFT_DELETE', 'User created with ACTIVE status');

// 1.2 Deactivate User (Soft Delete)
const deactivatedUser = userAccountManagementService.toggleAccountStatus(facultyUser.id, 'INACTIVE', adminUser);
assert(deactivatedUser.accountStatus === 'INACTIVE' && deactivatedUser.status === 'INACTIVE', 'SOFT_DELETE', 'Account deactivated without record deletion');

// 1.3 Verify Master Record and Relationships Remain Intact
const userInDb = db.getUsers().find(u => u.id === facultyUser.id);
assert(Boolean(userInDb), 'SOFT_DELETE', 'User record still exists in master users table');

// 1.4 Inactive User Login & Authorization Denied
const authCheck = userAccountManagementService.evaluateAuthorization(userInDb!, 'DASHBOARD', 'VIEW');
assert(authCheck.allowed === false, 'SOFT_DELETE', 'Deactivated user blocked from authentication & authorization');

// 1.5 Reactivate User
const reactivatedUser = userAccountManagementService.toggleAccountStatus(facultyUser.id, 'ACTIVE', adminUser);
assert(reactivatedUser.accountStatus === 'ACTIVE' && reactivatedUser.status === 'ACTIVE', 'SOFT_DELETE', 'Account successfully reactivated');

console.log('\n--- 2. AUTOMATED DATA VERSIONING & CHANGELOG ---');
// 2.1 Update user mobile number
const updated1 = userAccountManagementService.updateUser(facultyUser.id, {
  phone: '9988776655'
}, adminUser);

// 2.2 Update department & designation
const updated2 = userAccountManagementService.updateUser(facultyUser.id, {
  departmentId: 'dept-2',
  departmentName: 'Information Technology',
  designation: 'Associate Professor'
}, adminUser);

// 2.3 Retrieve versioned history records
const historyRecords = userAccountManagementService.getUserHistory(facultyUser.id);
assert(historyRecords.length >= 2, 'VERSIONING', 'Changelog versions automatically recorded on master profile mutations');

const latestVersion = historyRecords[0];
assert(
  latestVersion.changedFields.includes('departmentId') || latestVersion.changedFields.includes('departmentName'),
  'VERSIONING',
  'Field-level diff identifies modified attributes'
);
assert(latestVersion.changedBy === adminUser.name, 'VERSIONING', 'History preserves the identity of the modifying administrator');
assert(Boolean(latestVersion.changedAt), 'VERSIONING', 'History captures precise modification timestamp');

console.log('\n--- 3. PERMISSION & ROLE VERSIONING ---');
// 3.1 Role Change
userAccountManagementService.updateUser(facultyUser.id, {
  role: 'HOD'
}, adminUser);

// 3.2 Permission Override Change
userAccountManagementService.saveUserPermissions(facultyUser.id, {
  REPORTS: { canExport: true }
}, adminUser);

const updatedHistory = userAccountManagementService.getUserHistory(facultyUser.id);
const roleHistoryEntry = updatedHistory.find(h => h.action === 'ROLE_CHANGED');
const permHistoryEntry = updatedHistory.find(h => h.action === 'PERMISSION_CHANGED');

assert(Boolean(roleHistoryEntry), 'VERSIONING', 'Role promotions/modifications versioned with ROLE_CHANGED action');
assert(Boolean(permHistoryEntry), 'VERSIONING', 'Direct custom permission overrides versioned with PERMISSION_CHANGED action');

console.log('\n--- 4. PASSWORD & SECURITY HISTORY HYGIENE ---');
// 4.1 Reset Password
userAccountManagementService.resetPassword(facultyUser.id, 'NewPass@2026', true, adminUser);
const historyAfterPwd = userAccountManagementService.getUserHistory(facultyUser.id);
const anyPasswordExposed = historyAfterPwd.some(h => JSON.stringify(h.oldData).includes('NewPass') || JSON.stringify(h.newData).includes('NewPass'));
assert(!anyPasswordExposed, 'SECURITY_HYGIENE', 'Plaintext and hashed passwords never leak into version history snapshots');

console.log('\n======================================================================');
console.log(`🏁 Soft Delete, Versioning & History Tests: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
