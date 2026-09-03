import { db } from '../src/services/db';
import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { AdmissionApplication, User } from '../src/types';

console.log('================================================================');
console.log('SSIU ERP - ADMISSION ONBOARDING & PAYMENT WORKFLOW TEST SUITE');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   Detail: ${detail}`);
  }
}

const mockAdminUser: User = {
  id: 'user-admin-1',
  name: 'Registrar & Student Section Office',
  email: 'registrar@swarrnim.edu.in',
  role: 'ADMIN',
  status: 'ACTIVE',
  permissions: ['ALL']
};

// Setup Test Candidate Application
const testAppId = `app-test-${Date.now()}`;
const testCandidate: AdmissionApplication = {
  id: testAppId,
  applicationNumber: `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  applicantName: 'Vikram Singh Solanki',
  email: `vikram.solanki.${Date.now()}@example.com`,
  phone: '9876543210',
  gender: 'Male',
  dateOfBirth: '2005-04-15',
  bloodGroup: 'B+',
  category: 'General',
  address: '14, Swarrnim Avenue, Gandhinagar',
  fatherName: 'Rajendra Singh Solanki',
  fatherPhone: '9876543211',
  motherName: 'Sunita Solanki',
  guardianName: 'Rajendra Singh Solanki',
  guardianPhone: '9876543211',
  instituteId: 'inst-1',
  departmentId: 'dept-cse',
  programId: 'prog-1',
  academicYearId: 'ay-2026',
  submittedAt: new Date().toISOString().split('T')[0],
  status: 'APPLICATION_SUBMITTED',
  onboardingStatus: 'PENDING',
  isFeePaid: false,
  feeAmountPaid: 0,
  feeTotal: 25000,
  feePending: 25000,
  feePaymentStatus: 'PENDING',
  documents: [
    {
      id: `doc-${Date.now()}-1`,
      name: '12th Standard Marksheet / Transcript',
      status: 'PENDING'
    },
    {
      id: `doc-${Date.now()}-2`,
      name: 'School Leaving Certificate (LC)',
      status: 'PENDING'
    }
  ]
};

// Add to db
db.addEntity('admissionApplications', testCandidate, 'Created test candidate application');

// TEST 1: Unpaid fee & unverified docs block onboarding
console.log('\n--- TEST SCENARIO 1: ENFORCE ONBOARDING GATEKEEPING ---');
const readiness1 = studentOnboardingService.evaluateReadiness(testCandidate);
assert(!readiness1.isReady, 'Applicant with pending fee & docs must not be ready for onboarding');
assert(readiness1.blockers.length > 0, 'Blockers list must contain reasons', JSON.stringify(readiness1.blockers));

const onboardAttempt1 = studentOnboardingService.onboardStudent({
  applicationId: testAppId,
  instituteId: 'inst-1',
  departmentId: 'dept-cse',
  programId: 'prog-1',
  academicYearId: 'ay-2026'
}, mockAdminUser);
assert(!onboardAttempt1.success, 'onboardStudent must strictly fail when fee is unpaid');

// TEST 2: Verify Documents
console.log('\n--- TEST SCENARIO 2: DOCUMENT VERIFICATION ---');
studentOnboardingService.verifyDocument(testAppId, testCandidate.documents![0].id, 'VERIFIED', mockAdminUser);
studentOnboardingService.verifyDocument(testAppId, testCandidate.documents![1].id, 'VERIFIED', mockAdminUser);

const appAfterDocs = db.getAdmissionApplications().find(a => a.id === testAppId)!;
const readinessAfterDocs = studentOnboardingService.evaluateReadiness(appAfterDocs);
assert(!readinessAfterDocs.isReady, 'Applicant must still NOT be ready because fee is unpaid');
assert(
  readinessAfterDocs.blockers.some(b => b.toLowerCase().includes('fee')),
  'Readiness blocker must explicitly mention unpaid initial admission fee'
);

// TEST 3: Payment Simulation Failed
console.log('\n--- TEST SCENARIO 3: PAYMENT GATEWAY SIMULATION (FAILED) ---');
const failPaymentResult = studentOnboardingService.payAdmissionFee({
  applicationId: testAppId,
  amount: 25000,
  paymentMethod: 'UPI',
  simulationStatus: 'FAILED',
  actor: mockAdminUser
});
assert(!failPaymentResult.success, 'Payment simulation with FAILED must return success=false');
const appAfterFail = db.getAdmissionApplications().find(a => a.id === testAppId)!;
assert(appAfterFail.feePaymentStatus === 'FAILED', 'Application fee payment status must be marked as FAILED');

// TEST 4: Payment Simulation Success
console.log('\n--- TEST SCENARIO 4: PAYMENT GATEWAY SIMULATION (SUCCESS) ---');
const successPaymentResult = studentOnboardingService.payAdmissionFee({
  applicationId: testAppId,
  amount: 25000,
  paymentMethod: 'UPI',
  simulationStatus: 'SUCCESS',
  actor: mockAdminUser
});

assert(successPaymentResult.success, 'Payment simulation with SUCCESS must succeed');
assert(Boolean(successPaymentResult.receiptNumber?.startsWith('REC-')), 'Receipt number must follow REC-YYYY-XXXXXX format', successPaymentResult.receiptNumber);
assert(Boolean(successPaymentResult.transactionId?.startsWith('TXN-')), 'Transaction ID must follow TXN-YYYY... format', successPaymentResult.transactionId);

const appAfterSuccess = db.getAdmissionApplications().find(a => a.id === testAppId)!;
assert(appAfterSuccess.isFeePaid === true, 'Application isFeePaid must be true');
assert(appAfterSuccess.feePaymentStatus === 'PAID', 'Application feePaymentStatus must be PAID');
assert(appAfterSuccess.feeReceiptNo === successPaymentResult.receiptNumber, 'feeReceiptNo must match generated receipt');
assert(appAfterSuccess.status === 'READY_FOR_ONBOARDING', 'Status must transition to READY_FOR_ONBOARDING');

// Check transaction record stored in DB
const storedTxn = db.getFeePaymentTransactions().find(t => t.receiptNo === successPaymentResult.receiptNumber);
assert(Boolean(storedTxn), 'FeePaymentTransaction must be saved in database');
assert(storedTxn?.paidAmount === 25000, 'Transaction amount must match 25000');
assert(storedTxn?.status === 'SUCCESS', 'Transaction status must be SUCCESS');

// TEST 5: Final Onboarding
console.log('\n--- TEST SCENARIO 5: FINAL ONBOARDING OF STUDENT ---');
const readinessAfterPayment = studentOnboardingService.evaluateReadiness(appAfterSuccess);
assert(readinessAfterPayment.isReady, 'Applicant must now be ready for onboarding');

const onboardResult = studentOnboardingService.onboardStudent({
  applicationId: testAppId,
  instituteId: 'inst-1',
  departmentId: 'dept-cse',
  programId: 'prog-1',
  academicYearId: 'ay-2026'
}, mockAdminUser);

assert(onboardResult.success, 'Final onboarding must succeed');
assert(Boolean(onboardResult.student?.id), 'Active student record must be created');
assert(Boolean(onboardResult.student?.enrollmentNo?.startsWith('TEMP-2026-')), 'Temporary enrollment number generated', onboardResult.student?.enrollmentNo);
assert(Boolean(onboardResult.studentAccessCode), '5-digit student access code generated', onboardResult.studentAccessCode);

const finalApp = db.getAdmissionApplications().find(a => a.id === testAppId)!;
assert(finalApp.status === 'CONVERTED' || finalApp.status === 'ONBOARDED', 'Application status updated to ONBOARDED/CONVERTED');

// Summary
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('================================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
