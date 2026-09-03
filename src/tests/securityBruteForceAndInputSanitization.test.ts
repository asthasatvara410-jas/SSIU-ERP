import { db } from '../services/db';
import { userAccountManagementService } from '../services/userAccountManagementService';
import { inputSanitizer } from '../services/inputSanitizer';
import { studentGatePassService } from '../services/studentGatePassService';
import { User } from '../types';

console.log('🧪 Starting Security, Brute Force & Input Sanitization Test Suite...\n');

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

// 1. Initialize Seed & Provision Admin & Target User
db.resetToDefaultSeed();
const allUsers = db.getUsers();
const adminUser = allUsers.find(u => u.role === 'SUPER_ADMIN')!;

const testUser = userAccountManagementService.createUser({
  username: 'brute.force.test',
  name: 'Security Test Target',
  email: 'security.target@swarrnim.edu.in',
  role: 'FACULTY',
  departmentId: 'dept-1',
  departmentName: 'Computer Engineering',
  instituteId: 'inst-sit',
  password: 'TargetPassword@123',
  accountStatus: 'ACTIVE'
}, adminUser);

console.log('--- TEST GROUP 1: BRUTE FORCE & ACCOUNT LOCKING (3 ATTEMPTS -> 30 MIN LOCK) ---');

// Mock Auth Function matching AuthContext.tsx logic
function testAuthenticate(identifier: string, pass: string) {
  const users = db.getUsers();
  const cleanId = identifier.trim().toLowerCase();
  const foundUser = users.find(u => u.username?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId);

  if (!foundUser) return { success: false, error: 'User not found' };

  // Check Lock State & Lazy Expiration
  const now = new Date();
  if (foundUser.lockedUntil) {
    const lockExpiry = new Date(foundUser.lockedUntil);
    if (now.getTime() < lockExpiry.getTime()) {
      const remainingMinutes = Math.max(1, Math.ceil((lockExpiry.getTime() - now.getTime()) / (60 * 1000)));
      return {
        success: false,
        error: `Your account is temporarily locked due to multiple failed login attempts. Please try again after ${remainingMinutes} minutes.`
      };
    } else {
      // Lazy auto-unlock
      foundUser.accountStatus = 'ACTIVE';
      foundUser.status = 'ACTIVE';
      foundUser.failedLoginAttempts = 0;
      foundUser.lockedUntil = undefined;
      db.updateEntity<User>('users', foundUser.id, {
        accountStatus: 'ACTIVE',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: undefined
      });
    }
  }

  const currentStatus = foundUser.accountStatus || foundUser.status;
  if (currentStatus === 'LOCKED' || currentStatus === 'INACTIVE' || currentStatus === 'SUSPENDED') {
    return { success: false, error: `Account status is ${currentStatus}` };
  }

  // Password verification
  if (foundUser.password !== pass) {
    const attempts = (foundUser.failedLoginAttempts || 0) + 1;
    const updates: Partial<User> = {
      failedLoginAttempts: attempts,
      lastFailedLoginAt: new Date().toISOString()
    };

    if (attempts >= 3) {
      const lockDurationMs = 30 * 60 * 1000;
      updates.accountStatus = 'LOCKED';
      updates.status = 'INACTIVE';
      updates.lockedUntil = new Date(Date.now() + lockDurationMs).toISOString();
      updates.lockedAt = new Date().toISOString();
      updates.lockReason = 'Exceeded maximum failed login attempts (3 consecutive failures).';
      db.updateEntity<User>('users', foundUser.id, updates);
      return { success: false, error: 'Your account is temporarily locked due to multiple failed login attempts. Please try again after 30 minutes.' };
    } else {
      db.updateEntity<User>('users', foundUser.id, updates);
      return { success: false, error: `Incorrect Password. Failed attempt ${attempts} of 3.` };
    }
  }

  // Reset on success
  db.updateEntity<User>('users', foundUser.id, {
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date().toISOString()
  });
  return { success: true };
}

// A. Correct password -> login succeeds
const loginA = testAuthenticate('brute.force.test', 'TargetPassword@123');
assert(loginA.success === true, 'BRUTE_FORCE', 'A: Correct password authenticates successfully');

// B. Wrong password once -> counter = 1
const loginB = testAuthenticate('brute.force.test', 'WrongPass1');
let userObj = db.getUsers().find(u => u.id === testUser.id)!;
assert(loginB.success === false && userObj.failedLoginAttempts === 1, 'BRUTE_FORCE', 'B: First failed password sets counter = 1');

// C. Wrong password twice -> counter = 2
const loginC = testAuthenticate('brute.force.test', 'WrongPass2');
userObj = db.getUsers().find(u => u.id === testUser.id)!;
assert(loginC.success === false && userObj.failedLoginAttempts === 2, 'BRUTE_FORCE', 'C: Second failed password sets counter = 2');

// D. Wrong password 3rd time -> account LOCKED for 30 minutes
const loginD = testAuthenticate('brute.force.test', 'WrongPass3');
userObj = db.getUsers().find(u => u.id === testUser.id)!;
assert(
  loginD.success === false && 
  userObj.accountStatus === 'LOCKED' && 
  Boolean(userObj.lockedUntil) &&
  new Date(userObj.lockedUntil!).getTime() > Date.now() + 25 * 60 * 1000,
  'BRUTE_FORCE',
  'D: 3rd failed password atomically locks account with ~30-minute lockedUntil duration'
);

// E. 4th attempt while locked -> login rejected with remaining time
const loginE = testAuthenticate('brute.force.test', 'TargetPassword@123');
assert(
  loginE.success === false && 
  loginE.error?.includes('temporarily locked'), 
  'BRUTE_FORCE', 
  'E: 4th attempt while locked is strictly rejected even with correct password'
);

// F. Lock expiration -> lazy unlock restores account
userObj.lockedUntil = new Date(Date.now() - 1000).toISOString(); // simulate expiry
db.updateEntity<User>('users', userObj.id, { lockedUntil: userObj.lockedUntil });
const loginF = testAuthenticate('brute.force.test', 'TargetPassword@123');
userObj = db.getUsers().find(u => u.id === testUser.id)!;
assert(
  loginF.success === true && 
  userObj.accountStatus === 'ACTIVE' && 
  userObj.failedLoginAttempts === 0,
  'BRUTE_FORCE',
  'F: Expired lock automatically restores ACTIVE status and resets failed counter to 0 on login'
);

// G. Successful login resets failed attempts
testAuthenticate('brute.force.test', 'WrongPass1');
testAuthenticate('brute.force.test', 'TargetPassword@123');
userObj = db.getUsers().find(u => u.id === testUser.id)!;
assert(userObj.failedLoginAttempts === 0, 'BRUTE_FORCE', 'G: Successful login resets failed attempts back to 0');

// H & I. Inactive & Suspended accounts barred from login
userAccountManagementService.updateUser(testUser.id, { accountStatus: 'INACTIVE' }, adminUser);
const loginH = testAuthenticate('brute.force.test', 'TargetPassword@123');
assert(loginH.success === false, 'BRUTE_FORCE', 'H: INACTIVE account rejected from login');

userAccountManagementService.updateUser(testUser.id, { accountStatus: 'SUSPENDED' }, adminUser);
const loginI = testAuthenticate('brute.force.test', 'TargetPassword@123');
assert(loginI.success === false, 'BRUTE_FORCE', 'I: SUSPENDED account rejected from login');

console.log('\n--- TEST GROUP 2: MULTILINGUAL INPUT VALIDATION & XSS / SQLi DEFENSE ---');

// K. Notesheet Remarks: Normal Multilingual Text Accepted
const normalTextResult = inputSanitizer.validateNotesheetRemarks('Approved per university organogram guidelines.');
assert(normalTextResult.isValid && normalTextResult.sanitized === 'Approved per university organogram guidelines.', 'INPUT_VALIDATION', 'K: Normal English text accepted');

// L. Gate Pass Reason: Normal Multilingual Text Accepted
const normalGatePass = inputSanitizer.validateGatePassReason('Visiting family in Gandhinagar.');
assert(normalGatePass.isValid && normalGatePass.sanitized === 'Visiting family in Gandhinagar.', 'INPUT_VALIDATION', 'L: Normal Gate Pass reason accepted');

// M. XSS Payload Neutralization: <script>alert(1)</script>
const xssPayload1 = inputSanitizer.sanitizePlainText('Urgent approval required <script>alert(1)</script> for student fee concession.');
assert(!xssPayload1.includes('<script>') && !xssPayload1.includes('alert(1)'), 'XSS_DEFENSE', 'M: <script> tag neutralized from user input');

// N. HTML Event Payload Neutralization: <img src=x onerror=alert(1)>
const xssPayload2 = inputSanitizer.sanitizePlainText('Approved <img src=x onerror=alert("hacked")> with standard allowance.');
assert(!xssPayload2.includes('onerror') && !xssPayload2.includes('<img'), 'XSS_DEFENSE', 'N: <img onerror=...> event handler stripped from user input');

// O. SQL Injection-Style Input: ' OR '1'='1
const sqliPayload = inputSanitizer.sanitizePlainText("' OR '1'='1 -- admin");
assert(sqliPayload === "' OR '1'='1 -- admin", 'SQLI_DEFENSE', 'O: SQL injection string treated as safe literal data without executing');

// P. Unicode Support: Gujarati and Hindi Text Preserved
const gujaratiText = 'વિદ્યાર્થી ગેટ પાસ અને યુનિવર્સિટી નોંધ પત્રક મંજૂરી.';
const sanitizedGuj = inputSanitizer.sanitizePlainText(gujaratiText);
assert(sanitizedGuj === gujaratiText, 'UNICODE', 'P1: Gujarati Unicode characters preserved perfectly');

const hindiText = 'छात्र छात्रावास अनुमति एवं प्रशासनिक अनुमोदन।';
const sanitizedHindi = inputSanitizer.sanitizePlainText(hindiText);
assert(sanitizedHindi === hindiText, 'UNICODE', 'P2: Hindi Unicode characters preserved perfectly');

// Q. Long Input Constraint Enforcement
const longString = 'A'.repeat(4000);
const longRemarksResult = inputSanitizer.validateNotesheetRemarks(longString, false, 3000);
assert(!longRemarksResult.isValid && longRemarksResult.sanitized.length === 3000, 'CONSTRAINTS', 'Q: Max length constraint strictly enforced');

// R. Notesheet Workflow Integration with Sanitizer
const notesheetObj = db.createNoteSheet({
  subject: 'Annual AI Laboratory Upgradation <script>alert("xss")</script>',
  proposal: 'Detailed equipment procurement plan <iframe src="evil.com"></iframe>.',
  notesheetType: 'Administrative',
  department: 'Computer Engineering',
  instituteId: 'inst-sit'
}, adminUser, false);

assert(!notesheetObj.subject.includes('<script>') && !notesheetObj.proposal.includes('<iframe>'), 'WORKFLOW_INTEGRITY', 'R: Notesheet creation seamlessly sanitizes subject and proposal');

// S. Gate Pass Workflow Integration with Sanitizer
const gatePassObj = studentGatePassService.createGatePass({
  reason: 'Medical checkup in Ahmedabad <img src=x onerror=alert(1)>',
  destination: 'Civil Hospital',
  enrollmentNo: '26SSIU999'
}, adminUser);

assert(!gatePassObj.reason.includes('onerror') && !gatePassObj.reason.includes('<img'), 'WORKFLOW_INTEGRITY', 'S: Gate Pass creation seamlessly sanitizes reason text');

console.log('\n======================================================================');
console.log(`🏁 Security, Brute Force & Sanitization Tests: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
