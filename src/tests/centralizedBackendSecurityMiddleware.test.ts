import { db } from '../services/db';
import { executeApiPipeline } from '../services/apiMiddleware';
import { userAccountManagementService } from '../services/userAccountManagementService';
import { User } from '../types';

console.log('🧪 Starting Centralized Backend Auth & API Security Middleware Test Suite...\n');

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

// 1. Seed Database & Setup Users
db.resetToDefaultSeed();
const allUsers = db.getUsers();
const superAdmin = allUsers.find(u => u.role === 'SUPER_ADMIN')!;

const studentUser = userAccountManagementService.createUser({
  username: '230101999',
  name: 'Backend Test Student',
  email: 'student.backend@swarrnim.edu.in',
  role: 'STUDENT',
  enrollmentNo: '230101999',
  departmentId: 'dept-1',
  instituteId: 'inst-sit',
  password: 'Password@123',
  accountStatus: 'ACTIVE'
}, superAdmin);

const facultyUser = userAccountManagementService.createUser({
  username: 'FAC-BE-101',
  name: 'Backend Test Faculty',
  email: 'faculty.backend@swarrnim.edu.in',
  role: 'FACULTY',
  employeeId: 'FAC-BE-101',
  departmentId: 'dept-1',
  instituteId: 'inst-sit',
  password: 'Password@123',
  accountStatus: 'ACTIVE'
}, superAdmin);

const hodUser = userAccountManagementService.createUser({
  username: 'HOD-BE-102',
  name: 'Backend Test HOD',
  email: 'hod.backend@swarrnim.edu.in',
  role: 'HOD',
  employeeId: 'HOD-BE-102',
  departmentId: 'dept-1',
  instituteId: 'inst-sit',
  password: 'Password@123',
  accountStatus: 'ACTIVE'
}, superAdmin);

console.log('--- TEST GROUP 1: AUTHENTICATION & TOKEN CREDENTIAL VALIDATION ---');

// 1. Unauthenticated request -> HTTP 401 Unauthorized
const res1 = await executeApiPipeline(
  { user: null, role: null, path: '/api/v1/notesheets' },
  { requireAuth: true },
  null,
  () => ({ data: 'secret' })
);
assert(!res1.success && res1.statusCode === 401, 'AUTH_GUARD', '1: Unauthenticated request rejected with HTTP 401 Unauthorized');

// 2. Authenticated valid user -> HTTP 200 OK
const res2 = await executeApiPipeline(
  { user: facultyUser, role: 'FACULTY', path: '/api/v1/notesheets' },
  { requireAuth: true },
  null,
  () => ({ notesheets: [] })
);
assert(res2.success && res2.statusCode === 200, 'AUTH_GUARD', '2: Authenticated active user permitted with HTTP 200 OK');

console.log('\n--- TEST GROUP 2: ACCOUNT STATUS ENFORCEMENT (ACTIVE vs LOCKED / SUSPENDED / INACTIVE) ---');

// 3. Locked User -> HTTP 403 Forbidden
const lockedUser: User = { ...facultyUser, accountStatus: 'LOCKED', status: 'INACTIVE' };
const res3 = await executeApiPipeline(
  { user: lockedUser, role: 'FACULTY', path: '/api/v1/notesheets' },
  { requireAuth: true },
  null,
  () => ({ notesheets: [] })
);
assert(!res3.success && res3.statusCode === 403 && res3.error?.message?.includes('LOCKED'), 'STATUS_GUARD', '3: LOCKED account rejected from protected API with HTTP 403');

// 4. Suspended User -> HTTP 403 Forbidden
const suspendedUser: User = { ...facultyUser, accountStatus: 'SUSPENDED', status: 'INACTIVE' };
const res4 = await executeApiPipeline(
  { user: suspendedUser, role: 'FACULTY', path: '/api/v1/notesheets' },
  { requireAuth: true },
  null,
  () => ({ notesheets: [] })
);
assert(!res4.success && res4.statusCode === 403 && res4.error?.message?.includes('SUSPENDED'), 'STATUS_GUARD', '4: SUSPENDED account rejected from protected API with HTTP 403');

console.log('\n--- TEST GROUP 3: ROLE AUTHORIZATION & PRIVILEGE BARRIERS ---');

// 5. Student calling Faculty/Officer route -> HTTP 403 Forbidden
const res5 = await executeApiPipeline(
  { user: studentUser, role: 'STUDENT', path: '/api/v1/notesheets' },
  { requireAuth: true, allowedRoles: ['FACULTY', 'HOD', 'PRINCIPAL', 'REGISTRAR'] },
  null,
  () => ({ notesheets: [] })
);
assert(!res5.success && res5.statusCode === 403, 'ROLE_GUARD', '5: Student caller on officer route rejected with HTTP 403 Forbidden');

// 6. Authorized HOD calling Notesheet route -> HTTP 200 OK
const res6 = await executeApiPipeline(
  { user: hodUser, role: 'HOD', path: '/api/v1/notesheets' },
  { requireAuth: true, allowedRoles: ['FACULTY', 'HOD', 'PRINCIPAL', 'REGISTRAR'] },
  null,
  () => ({ notesheets: [] })
);
assert(res6.success && res6.statusCode === 200, 'ROLE_GUARD', '6: Authorized HOD caller successfully accesses Notesheet API');

console.log('\n--- TEST GROUP 4: SCOPE & RESOURCE OWNERSHIP ISOLATION ---');

// 7. Student accessing OWN data -> HTTP 200 OK
const res7 = await executeApiPipeline(
  { user: studentUser, role: 'STUDENT', params: { studentId: studentUser.id }, path: '/api/v1/students/me' },
  { requireAuth: true, requireScope: { own: true } },
  null,
  () => ({ profile: 'My Student Data' })
);
assert(res7.success && res7.statusCode === 200, 'SCOPE_GUARD', '7: Student accessing OWN record allowed with HTTP 200');

// 8. Student attempting to access FOREIGN student data -> HTTP 403 Forbidden
const res8 = await executeApiPipeline(
  { user: studentUser, role: 'STUDENT', params: { studentId: 'foreign-student-999' }, path: '/api/v1/students/foreign' },
  { requireAuth: true, requireScope: { own: true } },
  null,
  () => ({ profile: 'Foreign Data' })
);
assert(!res8.success && res8.statusCode === 403, 'SCOPE_GUARD', '8: Student accessing foreign student record blocked with HTTP 403 Forbidden');

// 9. HOD missing department context -> HTTP 403 Forbidden
const res9 = await executeApiPipeline(
  { user: { ...hodUser, departmentId: undefined }, role: 'HOD', path: '/api/v1/dept-records' },
  { requireAuth: true, requireScope: { department: true } },
  null,
  () => ({ data: 'Dept Records' })
);
assert(!res9.success && res9.statusCode === 403, 'SCOPE_GUARD', '9: HOD without valid department scope blocked with HTTP 403 Forbidden');

console.log('\n--- TEST GROUP 5: USER-SPECIFIC PERMISSION OVERRIDES ---');

// 10. Explicit DENY override on user overrides role default
const facultyWithDeny: User = {
  ...facultyUser,
  customPermissions: {
    REPORTS: { EXPORT: false }
  }
};
const res10 = await executeApiPipeline(
  { user: facultyWithDeny, role: 'FACULTY', path: '/api/v1/reports/export' },
  { requireAuth: true, requirePermission: { module: 'REPORTS', action: 'EXPORT' } },
  null,
  () => ({ report: 'CSV Data' })
);
assert(!res10.success && res10.statusCode === 403 && res10.error?.message?.includes('DENY'), 'OVERRIDE_GUARD', '10: Explicit DENY permission override strictly enforced');

console.log('\n--- TEST GROUP 6: MASS ASSIGNMENT & PAYLOAD INTEGRITY ---');

// 11. Mass assignment attempt with illegal fields -> validation failure / sanitization
const payloadValidator = (data: any) => {
  const allowed = ['name', 'phone', 'address'];
  const keys = Object.keys(data);
  const illegal = keys.filter(k => !allowed.includes(k));
  if (illegal.length > 0) {
    return {
      valid: false,
      errors: illegal.map(k => ({ field: k, message: `Field "${k}" is not allowed in update payload.` }))
    };
  }
  return { valid: true, value: data };
};

const res11 = await executeApiPipeline(
  {
    user: studentUser,
    role: 'STUDENT',
    body: { name: 'Sara', role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' },
    path: '/api/v1/profile'
  },
  { requireAuth: true },
  payloadValidator,
  () => ({ updated: true })
);
assert(!res11.success && res11.statusCode === 422, 'MASS_ASSIGNMENT', '11: Mass assignment tampering with role/accountStatus blocked with HTTP 422');

console.log('\n======================================================================');
console.log(`🏁 Backend Auth & Security Middleware Tests: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
