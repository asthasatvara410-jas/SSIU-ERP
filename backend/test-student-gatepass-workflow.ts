import { studentGatePassService } from '../src/services/studentGatePassService';
import { db } from '../src/services/db';

console.log('================================================================');
console.log('SSIU ERP - STUDENT GATE PASS 3-ROLE WORKFLOW TEST SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failCount++;
  }
}

// ── TEST SCENARIO 1: STUDENT SUBMITS GATE PASS REQUEST ─────────────────────
console.log('--- TEST SCENARIO 1: STUDENT SUBMITS GATE PASS REQUEST ---');

const studentUser = {
  id: 'stu-test-101',
  name: 'Kavya Shah',
  username: '26SSIU042',
  enrollmentNo: '26SSIU042',
  role: 'STUDENT'
};

const newPass = studentGatePassService.createGatePass(
  {
    studentId: studentUser.id,
    studentName: studentUser.name,
    enrollmentNo: studentUser.enrollmentNo,
    hostelId: 'hst-1',
    hostelName: 'Vivekananda Boys Hostel (Block A)',
    roomNo: 'A-204',
    bedNo: 'Bed-1',
    parentGuardianName: 'Mr. Bharat Shah',
    parentGuardianMobile: '+91 98250 99887',
    purpose: 'Family Visit',
    destination: 'Ahmedabad Paldi Residence',
    outingDate: '2026-08-25',
    expectedOutTime: '17:00',
    expectedReturnTime: '20:30',
    modeOfTravel: 'Campus Shuttle / Bus',
    emergencyContact: '+91 98250 99887',
    studentRemarks: 'Weekend family dinner'
  },
  studentUser
);

assert(Boolean(newPass.id), 'Gate Pass must have a unique internal ID');
assert(newPass.gatePassNo.startsWith('GP/2026/'), `Gate pass number ${newPass.gatePassNo} must follow GP/2026/XXXX format`);
assert(newPass.status === 'PENDING', 'Initial gate pass status must be PENDING (Pending Warden Approval)');
assert(newPass.studentName === 'Kavya Shah', 'Student name must match');
assert(newPass.history.length > 0, 'Audit history must record SUBMITTED event');

// ── TEST SCENARIO 2: STUDENT CANCELLATION WHILE PENDING ─────────────────────
console.log('\n--- TEST SCENARIO 2: STUDENT CANCELLATION ---');

const passToCancel = studentGatePassService.createGatePass(
  {
    studentId: studentUser.id,
    studentName: studentUser.name,
    enrollmentNo: studentUser.enrollmentNo,
    parentGuardianName: 'Mr. Bharat Shah',
    parentGuardianMobile: '+91 98250 99887',
    purpose: 'Personal',
    destination: 'Gandhinagar Market',
    outingDate: '2026-08-26',
    expectedOutTime: '16:00',
    expectedReturnTime: '18:00'
  },
  studentUser
);

const cancelledPass = studentGatePassService.cancelGatePass(passToCancel.id, 'Change of plans', studentUser);
assert(cancelledPass.status === 'CANCELLED', 'Gate pass status must update to CANCELLED');
assert(cancelledPass.history.some(h => h.action === 'CANCELLED'), 'Audit trail must record CANCELLED event');

// ── TEST SCENARIO 3: WARDEN REJECTION WITH MANDATORY REASON ─────────────────
console.log('\n--- TEST SCENARIO 3: WARDEN REJECTION ---');

const passToReject = studentGatePassService.createGatePass(
  {
    studentId: studentUser.id,
    studentName: studentUser.name,
    enrollmentNo: studentUser.enrollmentNo,
    parentGuardianName: 'Mr. Bharat Shah',
    parentGuardianMobile: '+91 98250 99887',
    purpose: 'Personal',
    destination: 'Late night club',
    outingDate: '2026-08-25',
    expectedOutTime: '23:00',
    expectedReturnTime: '04:00'
  },
  studentUser
);

const wardenUser = {
  id: 'warden-1',
  name: 'Dr. Rajesh Patel (Chief Warden)',
  role: 'HOSTEL_ADMIN'
};

let rejectErrorThrown = false;
try {
  studentGatePassService.rejectGatePass(passToReject.id, '', wardenUser);
} catch (e) {
  rejectErrorThrown = true;
}
assert(rejectErrorThrown, 'Rejection without reason must fail');

const rejectedPass = studentGatePassService.rejectGatePass(passToReject.id, 'Timing exceeds hostel curfew guidelines (10:00 PM)', wardenUser);
assert(rejectedPass.status === 'REJECTED', 'Status must be marked as REJECTED');
assert(Boolean(rejectedPass.rejectedReason), 'Rejection reason must be stored on record');

// ── TEST SCENARIO 4: WARDEN APPROVAL ─────────────────────────────────────────
console.log('\n--- TEST SCENARIO 4: WARDEN APPROVAL ---');

const approvedPass = studentGatePassService.approveGatePass(newPass.id, 'Approved for family visit. Ensure return by 08:30 PM.', wardenUser);
assert(approvedPass.status === 'APPROVED', 'Status must transition to APPROVED');
assert(approvedPass.approvedBy === wardenUser.id, 'ApprovedBy must record warden ID');
assert(Boolean(approvedPass.approvedAt), 'Approval timestamp must be recorded');
assert(Boolean(approvedPass.wardenRemarks), 'Warden clearance remarks must be stored');

// ── TEST SCENARIO 5: SECURITY GATE CHECKPOINT & QR VERIFICATION ───────────────
console.log('\n--- TEST SCENARIO 5: SECURITY CHECKPOINT & QR VERIFICATION ---');

const securityUser = {
  id: 'sec-101',
  name: 'Officer Vikram Singh (Gate 1)',
  role: 'SECURITY'
};

// 1. Verify Rejected Pass at Security
const qrRejected = studentGatePassService.verifyGatePassQR(rejectedPass.gatePassNo);
console.log('QR Rejected verification result:', qrRejected);
assert(qrRejected.valid === false, 'Rejected Gate Pass must be invalid at Security Checkpoint');

// 2. Verify Approved Pass at Security
const qrApproved = studentGatePassService.verifyGatePassQR(approvedPass.gatePassNo);
console.log('QR Approved verification result:', qrApproved);
assert(qrApproved.valid === true, 'Approved Gate Pass must be VALID at Security Checkpoint');

// 3. Mark Student OUT
const outPass = studentGatePassService.recordGatePassOut(approvedPass.id, securityUser);
assert(outPass.status === 'OUT', 'Status must transition to OUT upon campus exit');
assert(Boolean(outPass.actualOutDateTime), 'Actual OUT datetime must be recorded');

// 4. Mark Student RETURN (IN)
const inPass = studentGatePassService.recordGatePassIn(outPass.id, securityUser);
assert(inPass.status === 'RETURNED', 'Status must transition to RETURNED upon campus reentry');
assert(Boolean(inPass.actualInDateTime), 'Actual IN datetime must be recorded');
assert(inPass.history.length >= 4, `Audit history length (${inPass.history.length}) must contain full lifecycle events`);

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
