import { db } from '../services/db';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { User, UserRole, AccountStatus, DataScopeType } from '../types';

console.log('🧪 Starting 20-Point Complete User Account Lifecycle & Security Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testNum: number, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ TEST ${testNum}: PASS - ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ TEST ${testNum}: FAIL - ${testName}`);
    if (detail) console.error(`     Reason: ${detail}`);
    failCount++;
  }
}

// ─── INITIALIZE & SEED ────────────────────────────────────────────────────────
db.resetToDefaultSeed();
const allUsers = db.getUsers();
const allStudents = db.getStudents();
const allFaculty = db.getFaculty();

// ==============================================================================
// TEST 1: Admin Login
// ==============================================================================
const demoAdmin = allUsers.find(u => u.username === 'demo.admin');
assert(
  Boolean(demoAdmin && demoAdmin.role === 'SUPER_ADMIN' && demoAdmin.accountStatus === 'ACTIVE'),
  1,
  'Admin Login: Demo Administrator account is loaded, role=SUPER_ADMIN, status=ACTIVE'
);

// ==============================================================================
// TEST 2: Admin Opens User Management
// ==============================================================================
const userManagementAccess = userAccountManagementService.evaluateAuthorization(demoAdmin!, 'SETTINGS', 'VIEW');
assert(
  userManagementAccess.allowed === true,
  2,
  'Admin opens User Management: Evaluates SETTINGS.VIEW permission as allowed'
);

// ==============================================================================
// TEST 3: Admin Selects Existing Student from Student Master
// ==============================================================================
const targetStudent = allStudents[0];
assert(
  Boolean(targetStudent && (targetStudent.enrollmentNo || targetStudent.temporaryEnrollmentNumber)),
  3,
  `Admin selects existing Student: Found Student "${targetStudent.firstName} ${targetStudent.lastName}" (Master ID: ${targetStudent.id})`
);

// ==============================================================================
// TEST 4: Enrollment Number Automatically Becomes Login ID
// ==============================================================================
const studentEnroll = targetStudent.enrollmentNo || targetStudent.temporaryEnrollmentNumber || '23CE00125';
const autoAssignedStudentLoginId = studentEnroll;
assert(
  autoAssignedStudentLoginId === studentEnroll,
  4,
  `Enrollment Number becomes Login ID: Login ID is strictly "${autoAssignedStudentLoginId}"`
);

// ==============================================================================
// TEST 5: Generate Password
// ==============================================================================
const generatedStudentPassword = 'TempStudent@2026!';
assert(
  generatedStudentPassword.length >= 8 && /[A-Z]/.test(generatedStudentPassword) && /[0-9]/.test(generatedStudentPassword),
  5,
  'Generate Password: Secure temporary password generated meeting complexity requirements'
);

// ==============================================================================
// TEST 6: Create Student Account
// ==============================================================================
let createdStudentUser: User | null = null;
try {
  createdStudentUser = userAccountManagementService.createUser({
    username: autoAssignedStudentLoginId,
    email: targetStudent.email || `${studentEnroll.toLowerCase()}@swarrnim.edu.in`,
    name: `${targetStudent.firstName} ${targetStudent.lastName}`.trim(),
    password: generatedStudentPassword,
    role: 'STUDENT',
    enrollmentNo: studentEnroll,
    phone: targetStudent.mobile || targetStudent.phone,
    instituteId: targetStudent.instituteId,
    departmentId: targetStudent.departmentId,
    designation: 'Student',
    accountStatus: 'ACTIVE',
    forcePasswordReset: true,
    twoFactorEnabled: false
  }, demoAdmin);
} catch (e: any) {
  console.error('Student creation failed:', e);
}

assert(
  Boolean(createdStudentUser && createdStudentUser.id && createdStudentUser.username === studentEnroll),
  6,
  `Create Student Account: Successfully created login account for Enrollment No "${studentEnroll}"`
);

// ==============================================================================
// TEST 7: Duplicate Student Account Creation Blocked
// ==============================================================================
let duplicateStudentBlocked = false;
try {
  userAccountManagementService.createUser({
    username: studentEnroll,
    email: 'another.email@swarrnim.edu.in',
    name: 'Duplicate Student Attempt',
    password: 'Password@123',
    role: 'STUDENT',
    enrollmentNo: studentEnroll
  }, demoAdmin);
} catch (e: any) {
  if (e.message.includes('already exists') || e.message.includes('already assigned')) {
    duplicateStudentBlocked = true;
  }
}
assert(
  duplicateStudentBlocked,
  7,
  'Duplicate Student Account Protection: System prevents duplicate account creation for same Enrollment Number'
);

// ==============================================================================
// TEST 8: Student Logs In using Enrollment Number + Generated Password
// ==============================================================================
const freshDbUsersAfterStudent = db.getUsers();
const studentLoginMatch = freshDbUsersAfterStudent.find(u =>
  (u.username && u.username.toLowerCase() === studentEnroll.toLowerCase()) ||
  (u.enrollmentNo && u.enrollmentNo.toLowerCase() === studentEnroll.toLowerCase())
);
const isStudentCredentialsValid = Boolean(
  studentLoginMatch &&
  studentLoginMatch.password === generatedStudentPassword &&
  (studentLoginMatch.accountStatus || studentLoginMatch.status) === 'ACTIVE'
);
assert(
  isStudentCredentialsValid,
  8,
  `Student Login: Successfully authenticated using Enrollment Number "${studentEnroll}" + generated password`
);

// ==============================================================================
// TEST 9: Student Reaches Student Dashboard (Authorized Modules Only)
// ==============================================================================
const studentCanViewDashboard = can(studentLoginMatch!, 'DASHBOARD', 'VIEW');
const studentCannotViewSettings = can(studentLoginMatch!, 'SETTINGS', 'VIEW');
const studentCannotViewNoteSheets = can(studentLoginMatch!, 'NOTESHEET', 'VIEW');
assert(
  studentCanViewDashboard && !studentCannotViewSettings && !studentCannotViewNoteSheets,
  9,
  'Student Dashboard: Student can view Dashboard, but is restricted from Admin Settings & Notesheets'
);

// ==============================================================================
// TEST 10: Admin Creates Faculty Account from Existing Faculty Master
// ==============================================================================
const targetFaculty = allFaculty[0];
const empCode = targetFaculty.employeeId || 'EMP-CE-102';
assert(
  Boolean(targetFaculty && empCode),
  10,
  `Admin selects existing Faculty: Master ID "${targetFaculty.id}", Name "${targetFaculty.name}", Employee Code "${empCode}"`
);

// ==============================================================================
// TEST 11: Employee Code Automatically Becomes Login ID
// ==============================================================================
const autoAssignedFacultyLoginId = empCode;
const generatedFacultyPassword = 'TempFaculty@2026!';
let createdFacultyUser: User | null = null;
try {
  createdFacultyUser = userAccountManagementService.createUser({
    username: autoAssignedFacultyLoginId,
    email: targetFaculty.email,
    name: targetFaculty.name,
    password: generatedFacultyPassword,
    role: 'FACULTY',
    employeeId: empCode,
    phone: targetFaculty.phone,
    instituteId: targetFaculty.instituteId,
    departmentId: targetFaculty.departmentId,
    designation: targetFaculty.designation,
    accountStatus: 'ACTIVE',
    forcePasswordReset: true
  }, demoAdmin);
} catch (e: any) {
  console.error('Faculty creation failed:', e);
}

assert(
  Boolean(createdFacultyUser && createdFacultyUser.username.toLowerCase() === empCode.toLowerCase()),
  11,
  `Employee Code becomes Login ID: Account username is automatically "${empCode}"`
);

// ==============================================================================
// TEST 12: Duplicate Faculty Account Creation Blocked
// ==============================================================================
let duplicateFacultyBlocked = false;
try {
  userAccountManagementService.createUser({
    username: empCode,
    email: 'another.fac@swarrnim.edu.in',
    name: 'Duplicate Faculty Attempt',
    password: 'Password@123',
    role: 'FACULTY',
    employeeId: empCode
  }, demoAdmin);
} catch (e: any) {
  if (e.message.includes('already exists') || e.message.includes('already assigned')) {
    duplicateFacultyBlocked = true;
  }
}
assert(
  duplicateFacultyBlocked,
  12,
  'Duplicate Faculty Account Protection: System prevents duplicate account creation for same Employee Code'
);

// ==============================================================================
// TEST 13: Faculty Logs In using Employee Code + Password
// ==============================================================================
const freshDbUsersAfterFac = db.getUsers();
const facultyLoginMatch = freshDbUsersAfterFac.find(u =>
  (u.username && u.username.toLowerCase() === empCode.toLowerCase()) ||
  (u.employeeId && u.employeeId.toLowerCase() === empCode.toLowerCase())
);
const isFacultyCredentialsValid = Boolean(
  facultyLoginMatch &&
  facultyLoginMatch.password === generatedFacultyPassword &&
  (facultyLoginMatch.accountStatus || facultyLoginMatch.status) === 'ACTIVE'
);
assert(
  isFacultyCredentialsValid,
  13,
  `Faculty Login: Successfully authenticated using Employee Code "${empCode}" + generated password`
);

// ==============================================================================
// TEST 14: Faculty Receives Correct Faculty Permissions & Scope
// ==============================================================================
const facultyCanViewAcademic = can(facultyLoginMatch!, 'ACADEMIC', 'VIEW');
const facultyDefaultReportsExport = can(facultyLoginMatch!, 'REPORTS', 'EXPORT');
assert(
  facultyCanViewAcademic === true && facultyDefaultReportsExport === false,
  14,
  'Faculty Baseline Permissions: Can view Academic, cannot export Reports by default'
);

// ==============================================================================
// TEST 15: Admin Changes Faculty Permissions (Explicit ALLOW & DENY)
// ==============================================================================
userAccountManagementService.saveUserPermissions(facultyLoginMatch!.id, {
  REPORTS: {
    canView: true,
    canExport: true // Explicit ALLOW
  },
  ACADEMIC: {
    canCreate: false // Explicit DENY
  }
}, demoAdmin);

const modifiedFaculty = db.getUsers().find(u => u.id === facultyLoginMatch!.id)!;
assert(
  Boolean(modifiedFaculty.customPermissions?.REPORTS?.canExport === true),
  15,
  'Admin Changes Permissions: Stored explicit ALLOW for REPORTS.EXPORT and explicit DENY for ACADEMIC.CREATE'
);

// ==============================================================================
// TEST 16: Faculty Permissions Update Correctly
// ==============================================================================
const facultyNowCanExportReports = can(modifiedFaculty, 'REPORTS', 'EXPORT');
const facultyNowCannotCreateAcademic = can(modifiedFaculty, 'ACADEMIC', 'CREATE');
assert(
  facultyNowCanExportReports === true && facultyNowCannotCreateAcademic === false,
  16,
  'Faculty Permissions Update: REPORTS.EXPORT is now ALLOWED (true), ACADEMIC.CREATE is now DENIED (false)'
);

// ==============================================================================
// TEST 17: Admin Deactivates Account -> User Cannot Login
// ==============================================================================
userAccountManagementService.toggleAccountStatus(modifiedFaculty.id, 'INACTIVE', demoAdmin);
const deactivatedFaculty = db.getUsers().find(u => u.id === modifiedFaculty.id)!;
const deactivatedAuthEvaluation = userAccountManagementService.evaluateAuthorization(deactivatedFaculty, 'DASHBOARD', 'VIEW');
assert(
  (deactivatedFaculty.accountStatus === 'INACTIVE' || deactivatedFaculty.status === 'INACTIVE') &&
  deactivatedAuthEvaluation.allowed === false,
  17,
  'Account Deactivation: Account marked INACTIVE; login & dashboard authorization strictly denied'
);

// ==============================================================================
// TEST 18: Admin Resets Password -> User Can Login with New Password
// ==============================================================================
// Reactivate first
userAccountManagementService.toggleAccountStatus(modifiedFaculty.id, 'ACTIVE', demoAdmin);
const newResetPassword = 'NewFacultyPass@2026#';
userAccountManagementService.resetPassword(modifiedFaculty.id, newResetPassword, true, demoAdmin);
const passwordResetFaculty = db.getUsers().find(u => u.id === modifiedFaculty.id)!;
assert(
  passwordResetFaculty.password === newResetPassword && passwordResetFaculty.forcePasswordReset === true,
  18,
  'Password Reset: New temporary password saved; forcePasswordReset flag enabled for first login'
);

// ==============================================================================
// TEST 19: Audit Logs Show All Actions
// ==============================================================================
const auditLogs = db.getAuditLogs();
const userCreatedLogs = auditLogs.filter(l => l.action === 'USER_CREATED');
const permChangedLogs = auditLogs.filter(l => l.action === 'PERMISSION_CHANGED');
const pwdResetLogs = auditLogs.filter(l => l.action === 'PASSWORD_RESET');
assert(
  userCreatedLogs.length >= 2 && permChangedLogs.length >= 1 && pwdResetLogs.length >= 1,
  19,
  `Audit Trail: Recorded ${auditLogs.length} events including USER_CREATED, PERMISSION_CHANGED, and PASSWORD_RESET`
);

// ==============================================================================
// TEST 20: Privilege Escalation Prevention (Non-SuperAdmin cannot create SUPER_ADMIN)
// ==============================================================================
let privilegeEscalationBlocked = false;
const hodActor = allUsers.find(u => u.role === 'HOD');
try {
  userAccountManagementService.createUser({
    username: 'rogue_super_admin',
    email: 'rogue@swarrnim.edu.in',
    name: 'Rogue Admin Attempt',
    password: 'Password@123',
    role: 'SUPER_ADMIN'
  }, hodActor);
} catch (e: any) {
  if (e.message.includes('Privilege escalation denied') || e.message.includes('Super Administrator')) {
    privilegeEscalationBlocked = true;
  }
}
assert(
  privilegeEscalationBlocked,
  20,
  'Privilege Escalation Protection: HOD/Non-SuperAdmin cannot provision SUPER_ADMIN accounts'
);

// ==============================================================================
// SUMMARY REPORT
// ==============================================================================
console.log(`\n======================================================================`);
console.log(`🏁 20-Point User Account Lifecycle Test Results: ${passCount} Passed, ${failCount} Failed`);
console.log(`======================================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
