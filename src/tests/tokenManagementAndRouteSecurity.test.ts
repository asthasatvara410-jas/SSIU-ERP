import { db } from '../services/db';
import { userAccountManagementService, can } from '../services/userAccountManagementService';
import { isTabPermittedForRole } from '../constants/navigationConfig';
import { executeApiPipeline, ApiRequestContext, ApiSecurityPolicy } from '../services/apiMiddleware';
import { User, UserRole } from '../types';

console.log('🧪 Starting Security, Token, Route Guard & API Authorization Test Suite...\n');

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

// ─── INITIALIZE & SEED ────────────────────────────────────────────────────────
db.resetToDefaultSeed();
const allUsers = db.getUsers();
const studentUser = allUsers.find(u => u.role === 'STUDENT')!;
const facultyUser = allUsers.find(u => u.role === 'FACULTY')!;
const hodUser = allUsers.find(u => u.role === 'HOD')!;
const hoiUser = allUsers.find(u => u.role === 'PRINCIPAL')!;
const registrarUser = allUsers.find(u => u.role === 'REGISTRAR')!;
const superAdminUser = allUsers.find(u => u.role === 'SUPER_ADMIN')!;

console.log('--- 1. AUTHENTICATION & STATUS GATES ---');
// 1.1 Active user authorization evaluation
const activeAuth = userAccountManagementService.evaluateAuthorization(studentUser, 'DASHBOARD', 'VIEW');
assert(activeAuth.allowed === true, 'AUTH', 'Active student account authorized for Dashboard');

// 1.2 Inactive user access blocked
const inactiveStudent = { ...studentUser, accountStatus: 'INACTIVE' as const };
const inactiveAuth = userAccountManagementService.evaluateAuthorization(inactiveStudent, 'DASHBOARD', 'VIEW');
assert(inactiveAuth.allowed === false, 'AUTH', 'Inactive user barred from authentication/authorization');

// 1.3 Locked user access blocked
const lockedFaculty = { ...facultyUser, accountStatus: 'LOCKED' as const };
const lockedAuth = userAccountManagementService.evaluateAuthorization(lockedFaculty, 'ACADEMIC', 'VIEW');
assert(lockedAuth.allowed === false, 'AUTH', 'Locked user barred from authentication/authorization');

// 1.4 Suspended user access blocked
const suspendedHod = { ...hodUser, accountStatus: 'SUSPENDED' as const };
const suspendedAuth = userAccountManagementService.evaluateAuthorization(suspendedHod, 'DASHBOARD', 'VIEW');
assert(suspendedAuth.allowed === false, 'AUTH', 'Suspended user barred from authentication/authorization');

console.log('\n--- 2. ROUTE GUARDS & DIRECT URL PROTECTION ---');
// 2.1 Student cannot access Admin routes
assert(isTabPermittedForRole('settings', 'STUDENT') === false, 'ROUTE', 'Student barred from /settings');
assert(isTabPermittedForRole('security-audit', 'STUDENT') === false, 'ROUTE', 'Student barred from /security-audit');
assert(isTabPermittedForRole('work-transfer-audit', 'STUDENT') === false, 'ROUTE', 'Student barred from /work-transfer-audit');

// 2.2 Student can access own modules
assert(isTabPermittedForRole('dashboard', 'STUDENT') === true, 'ROUTE', 'Student allowed /dashboard');
assert(isTabPermittedForRole('fees', 'STUDENT') === true, 'ROUTE', 'Student allowed /fees');
assert(isTabPermittedForRole('examination', 'STUDENT') === true, 'ROUTE', 'Student allowed /examination');
assert(isTabPermittedForRole('exam-hallticket', 'STUDENT') === true, 'ROUTE', 'Student allowed /exam-hallticket');
assert(isTabPermittedForRole('feedback', 'STUDENT') === true, 'ROUTE', 'Student allowed /feedback');

// 2.3 Faculty cannot access User Management / System Settings
assert(isTabPermittedForRole('settings', 'FACULTY') === false, 'ROUTE', 'Faculty barred from User Management Settings');
assert(isTabPermittedForRole('subjects', 'FACULTY') === true, 'ROUTE', 'Faculty allowed academic subjects view');

// 2.4 HOD & Principal access
assert(isTabPermittedForRole('hod-dept-overview', 'HOD') === true, 'ROUTE', 'HOD allowed HOD Department Overview');
assert(isTabPermittedForRole('hoi-inst-overview', 'PRINCIPAL') === true, 'ROUTE', 'Principal allowed HOI Institute Overview');

// 2.5 Super Admin allowed Admin Portal
assert(isTabPermittedForRole('settings', 'SUPER_ADMIN') === true, 'ROUTE', 'Super Admin allowed System Settings');

console.log('\n--- 3. SERVER-SIDE API AUTHORIZATION & PIPELINE ENFORCEMENT ---');
// 3.1 Unauthenticated Request -> 401 Unauthorized
let unauthResponse: any;
await (async () => {
  const ctx: ApiRequestContext = { user: null, role: null, path: '/api/v1/notesheets/approve' };
  const policy: ApiSecurityPolicy = { requireAuth: true, allowedRoles: ['HOD', 'PRINCIPAL', 'SUPER_ADMIN'] };
  unauthResponse = await executeApiPipeline(ctx, policy, null, async () => ({ approved: true }));
})();
assert(unauthResponse.statusCode === 401, 'API_SECURITY', 'Missing authentication rejects with HTTP 401 Unauthorized');

// 3.2 Authenticated but unauthorized role -> 403 Forbidden
let studentForbiddenResponse: any;
await (async () => {
  const ctx: ApiRequestContext = { user: studentUser, role: 'STUDENT', path: '/api/v1/notesheets/approve' };
  const policy: ApiSecurityPolicy = { requireAuth: true, allowedRoles: ['HOD', 'PRINCIPAL', 'SUPER_ADMIN'] };
  studentForbiddenResponse = await executeApiPipeline(ctx, policy, null, async () => ({ approved: true }));
})();
assert(studentForbiddenResponse.statusCode === 403, 'API_SECURITY', 'Student attempting Notesheet approve returns HTTP 403 Forbidden');

// 3.3 Missing Department scope on HOD -> 403 Forbidden
let hodMissingDeptResponse: any;
await (async () => {
  const outOfScopeHod = { ...hodUser, departmentId: undefined };
  const ctx: ApiRequestContext = { user: outOfScopeHod, role: 'HOD', path: '/api/v1/department/faculty' };
  const policy: ApiSecurityPolicy = { requireAuth: true, allowedRoles: ['HOD'], requireScope: { department: true } };
  hodMissingDeptResponse = await executeApiPipeline(ctx, policy, null, async () => ({ data: [] }));
})();
assert(hodMissingDeptResponse.statusCode === 403, 'API_SECURITY', 'HOD without valid department scope returns HTTP 403 Forbidden');

// 3.4 Valid authorized operation -> HTTP 200 Success
let validAdminResponse: any;
await (async () => {
  const ctx: ApiRequestContext = { user: superAdminUser, role: 'SUPER_ADMIN', path: '/api/v1/admin/users' };
  const policy: ApiSecurityPolicy = { requireAuth: true, allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN'] };
  validAdminResponse = await executeApiPipeline(ctx, policy, null, async () => ({ totalUsers: 15 }));
})();
assert(validAdminResponse.statusCode === 200 && validAdminResponse.data.totalUsers === 15, 'API_SECURITY', 'Authorized admin call succeeds with HTTP 200');

console.log('\n--- 4. DATA-LEVEL SCOPE & OVERRIDE ISOLATION ---');
// 4.1 Department scope boundary
const hodCanViewOwnDept = userAccountManagementService.evaluateAuthorization(hodUser, 'ACADEMIC', 'VIEW', { targetDepartmentId: hodUser.departmentId || 'dept-1' });
const hodCannotViewOtherDept = userAccountManagementService.evaluateAuthorization(hodUser, 'ACADEMIC', 'VIEW', { targetDepartmentId: 'dept-foreign-99' });
assert(hodCanViewOwnDept.allowed === true, 'SCOPE', 'HOD can access own department data');
assert(hodCannotViewOtherDept.allowed === false, 'SCOPE', 'HOD blocked from accessing foreign department data');

// 4.2 Institute scope boundary
const hoiCanViewOwnInst = userAccountManagementService.evaluateAuthorization(hoiUser, 'ACADEMIC', 'VIEW', { targetInstituteId: hoiUser.instituteId || 'inst-1' });
const hoiCannotViewOtherInst = userAccountManagementService.evaluateAuthorization(hoiUser, 'ACADEMIC', 'VIEW', { targetInstituteId: 'inst-foreign-99' });
assert(hoiCanViewOwnInst.allowed === true, 'SCOPE', 'HOI can access own institute data');
assert(hoiCannotViewOtherInst.allowed === false, 'SCOPE', 'HOI blocked from accessing foreign institute data');

// 4.3 Student self scope boundary
const studentCanViewSelf = userAccountManagementService.evaluateAuthorization(studentUser, 'STUDENTS', 'VIEW', { targetUserId: studentUser.id });
const studentCannotViewOther = userAccountManagementService.evaluateAuthorization(studentUser, 'STUDENTS', 'VIEW', { targetUserId: 'foreign-student-id-999' });
assert(studentCanViewSelf.allowed === true, 'SCOPE', 'Student can access own student profile');
assert(studentCannotViewOther.allowed === false, 'SCOPE', 'Student blocked from accessing other students data');

// 4.4 User-Specific Custom Override (Explicit ALLOW / DENY)
const testFacUser = { ...facultyUser, customPermissions: { REPORTS: { canExport: true }, ACADEMIC: { canCreate: false } } };
const overrideCanExport = can(testFacUser, 'REPORTS', 'EXPORT');
const overrideCannotCreate = can(testFacUser, 'ACADEMIC', 'CREATE');
assert(overrideCanExport === true, 'OVERRIDE', 'Explicit ALLOW grants REPORTS.EXPORT override');
assert(overrideCannotCreate === false, 'OVERRIDE', 'Explicit DENY revokes ACADEMIC.CREATE override');

console.log('\n======================================================================');
console.log(`🏁 Security, Token & Route Guard Tests: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
