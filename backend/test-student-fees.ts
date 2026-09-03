// ==============================================================================
// SWARRNIM UNIVERSITY ERP — PHASE 3: STUDENT FEE MANAGEMENT & PORTAL TESTS
// ==============================================================================

import { db } from '../src/services/db';
import { studentFeeService } from '../src/services/studentFeeService';
import { feeQueryService } from '../src/services/feeQueryService';
import { Student, StudentFeeRecord, FeePaymentTransaction, User } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
  }
}

async function runStudentFeeTestSuite() {
  console.log('\n==================================================================');
  console.log('  SSIU ERP — PHASE 3: STUDENT FEE MANAGEMENT & PORTAL TEST SUITE');
  console.log('==================================================================\n');

  // Seed Users
  const financeUser: User = {
    id: 'user-finance-officer',
    name: 'Shailesh Parmar (Finance Officer)',
    email: 'finance.officer@swarrnim.edu.in',
    role: 'ACCOUNTS_ADMIN' as any,
    status: 'ACTIVE'
  };

  const studentAUser: User = {
    id: 'user-stu-a',
    username: '2601090101',
    name: 'Aarav Patel',
    email: 'aarav.patel@swarrnim.edu.in',
    role: 'STUDENT',
    status: 'ACTIVE'
  };

  const studentBUser: User = {
    id: 'user-stu-b',
    username: '2601090102',
    name: 'Diya Sharma',
    email: 'diya.sharma@swarrnim.edu.in',
    role: 'STUDENT',
    status: 'ACTIVE'
  };

  // Seed Students
  const studentA: Student = {
    id: 'stu-fee-a',
    name: 'Aarav Patel',
    enrollmentNo: '2601090101',
    email: 'aarav.patel@swarrnim.edu.in',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    status: 'ACTIVE',
    phone: '+91 98250 11111'
  };

  const studentB: Student = {
    id: 'stu-fee-b',
    name: 'Diya Sharma',
    enrollmentNo: '2601090102',
    email: 'diya.sharma@swarrnim.edu.in',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    status: 'ACTIVE',
    phone: '+91 98250 22222'
  };

  db.addEntity('students', studentA, 'Seed Student A for Fee Tests');
  db.addEntity('students', studentB, 'Seed Student B for Fee Tests');
  db.addEntity('users', studentAUser, 'Seed Student A User');
  db.addEntity('users', studentBUser, 'Seed Student B User');

  // ── TEST 1: Fully Paid Student ──
  console.log('--- Test Suite 1: Fully Paid Student ---');
  const feeRecordA1: StudentFeeRecord = {
    id: 'fee-rec-a1',
    studentId: studentA.id,
    semesterId: 'sem-1',
    semesterName: 'Semester 1',
    academicYearCode: '2026-2027',
    feeStructureId: 'fs-1',
    feeStructureName: 'B.Tech Regular Tuition',
    feeType: 'TUITION & ACADEMIC',
    totalAmount: 95000,
    paidAmount: 95000,
    pendingAmount: 0,
    refundedAmount: 0,
    status: 'PAID',
    dueDate: '2026-09-30'
  };
  db.addEntity('studentFeeRecords', feeRecordA1, 'Seed Sem 1 Fee Record for Student A (Paid)');

  const txA1: FeePaymentTransaction = {
    id: 'tx-a1',
    studentFeeRecordId: feeRecordA1.id,
    studentId: studentA.id,
    studentName: studentA.name,
    enrollmentNo: studentA.enrollmentNo,
    programId: 'prog-1',
    semesterId: 'sem-1',
    semesterName: 'Semester 1',
    academicYear: '2026-2027',
    feeType: 'TUITION',
    paidAmount: 95000,
    paymentMode: 'Online UPI',
    transactionId: 'TXN-UPI-984210',
    referenceNo: 'UPI/984210/HDFC',
    referenceDate: '2026-08-10',
    bankName: 'HDFC Bank',
    gatewayName: 'HDFC SmartHub',
    paymentDate: '2026-08-10',
    receiptNo: 'SSIU-REC-2026-001',
    status: 'SUCCESS',
    recordedBy: 'Admin'
  };
  db.addEntity('feePaymentTransactions', txA1, 'Seed Sem 1 Paid Transaction');

  const summaryA = studentFeeService.calculateStudentFeeSummary(studentA.id);
  assert(summaryA.totalFees === 95000, 'Student A total fees correctly computed (₹95,000)');
  assert(summaryA.totalPaid === 95000, 'Student A total paid equals total fees (₹95,000)');
  assert(summaryA.outstandingAmount === 0, 'Student A outstanding balance is zero');

  // ── TEST 2: Partially Paid Student ──
  console.log('\n--- Test Suite 2: Partially Paid Student ---');
  const feeRecordB1: StudentFeeRecord = {
    id: 'fee-rec-b1',
    studentId: studentB.id,
    semesterId: 'sem-1',
    semesterName: 'Semester 1',
    academicYearCode: '2026-2027',
    feeStructureId: 'fs-1',
    feeStructureName: 'B.Tech Regular Tuition',
    feeType: 'TUITION & ACADEMIC',
    totalAmount: 95000,
    paidAmount: 45000,
    pendingAmount: 50000,
    refundedAmount: 0,
    status: 'PARTIAL',
    dueDate: '2026-09-30'
  };
  db.addEntity('studentFeeRecords', feeRecordB1, 'Seed Sem 1 Fee Record for Student B (Partial)');

  const txB1: FeePaymentTransaction = {
    id: 'tx-b1',
    studentFeeRecordId: feeRecordB1.id,
    studentId: studentB.id,
    studentName: studentB.name,
    enrollmentNo: studentB.enrollmentNo,
    programId: 'prog-1',
    semesterId: 'sem-1',
    semesterName: 'Semester 1',
    academicYear: '2026-2027',
    feeType: 'TUITION',
    paidAmount: 45000,
    paymentMode: 'Bank Transfer / NEFT',
    transactionId: 'TXN-NEFT-554433',
    referenceNo: 'UTR5544339900',
    referenceDate: '2026-08-12',
    bankName: 'State Bank of India',
    gatewayName: 'DIRECT_NEFT',
    paymentDate: '2026-08-12',
    receiptNo: 'SSIU-REC-2026-002',
    status: 'SUCCESS',
    recordedBy: 'Admin'
  };
  db.addEntity('feePaymentTransactions', txB1, 'Seed Sem 1 Partial Payment');

  const summaryB = studentFeeService.calculateStudentFeeSummary(studentB.id);
  assert(summaryB.totalFees === 95000, 'Student B total fees is ₹95,000');
  assert(summaryB.totalPaid === 45000, 'Student B paid amount is ₹45,000');
  assert(summaryB.outstandingAmount === 50000, 'Student B outstanding dues is ₹50,000');

  // ── TEST 3: Pending Payment (Unpaid New Semester) ──
  console.log('\n--- Test Suite 3: Pending Payment (New Semester) ---');
  const feeRecordB2: StudentFeeRecord = {
    id: 'fee-rec-b2',
    studentId: studentB.id,
    semesterId: 'sem-2',
    semesterName: 'Semester 2',
    academicYearCode: '2026-2027',
    feeStructureId: 'fs-1',
    feeStructureName: 'B.Tech Regular Tuition',
    feeType: 'TUITION & ACADEMIC',
    totalAmount: 95000,
    paidAmount: 0,
    pendingAmount: 95000,
    refundedAmount: 0,
    status: 'PENDING',
    dueDate: '2027-02-28'
  };
  db.addEntity('studentFeeRecords', feeRecordB2, 'Seed Sem 2 Fee Record for Student B (Pending)');

  const summaryBWithSem2 = studentFeeService.calculateStudentFeeSummary(studentB.id);
  assert(summaryBWithSem2.totalFees === 190000, 'Student B cumulative total fees updated to ₹1,90,000');
  assert(summaryBWithSem2.outstandingAmount === 145000, 'Student B cumulative outstanding updated to ₹1,45,000 (Sem 1 + Sem 2)');

  // ── TEST 4: Failed Payment (Must NOT Be Credited As Paid) ──
  console.log('\n--- Test Suite 4: Failed Payment Integrity ---');
  const failedTx: FeePaymentTransaction = {
    id: 'tx-b-failed',
    studentFeeRecordId: feeRecordB2.id,
    studentId: studentB.id,
    studentName: studentB.name,
    enrollmentNo: studentB.enrollmentNo,
    programId: 'prog-1',
    semesterId: 'sem-2',
    semesterName: 'Semester 2',
    academicYear: '2026-2027',
    feeType: 'TUITION',
    paidAmount: 95000,
    paymentMode: 'Card',
    transactionId: 'TXN-FAIL-001',
    paymentDate: '2026-08-15',
    receiptNo: '', // No receipt generated for failed
    status: 'FAILED',
    remarks: 'Gateway Timeout: Card Issuer Declined Transaction',
    recordedBy: 'Gateway'
  };
  db.addEntity('feePaymentTransactions', failedTx, 'Seed Failed Payment Transaction');

  // Verify Student B fee balance is NOT reduced by failed payment
  const summaryBAfterFailed = studentFeeService.calculateStudentFeeSummary(studentB.id);
  assert(summaryBAfterFailed.totalPaid === 45000, 'Failed payment transaction was NOT credited to total paid');
  assert(summaryBAfterFailed.outstandingAmount === 145000, 'Outstanding amount remained strictly intact after failed payment');

  // ── TEST 5: Refund Processing ──
  console.log('\n--- Test Suite 5: Refund Amount Processing ---');
  db.updateEntity('studentFeeRecords', feeRecordA1.id, {
    refundedAmount: 5000
  }, 'Processed ₹5,000 caution deposit refund for Student A');

  const summaryAAfterRefund = studentFeeService.calculateStudentFeeSummary(studentA.id);
  assert(summaryAAfterRefund.refundAmount === 5000, 'Student A refund amount recorded correctly (₹5,000)');

  // ── TEST 6: Multiple Semesters Breakdown ──
  console.log('\n--- Test Suite 6: Multiple Semesters Table Aggregation ---');
  const semRowsB = studentFeeService.getSemesterFeeDetails(studentB.id);
  assert(semRowsB.length === 2, 'Student B has 2 semester fee records');
  const sem1Row = semRowsB.find(r => r.semesterId === 'sem-1');
  const sem2Row = semRowsB.find(r => r.semesterId === 'sem-2');
  assert(Boolean(sem1Row), 'Sem 1 record resolved correctly');
  assert(sem1Row?.status === 'PARTIAL', `Sem 1 status is PARTIAL (actual: ${sem1Row?.status})`);
  assert(Boolean(sem2Row), 'Sem 2 record resolved correctly');
  assert(sem2Row?.status === 'PENDING', `Sem 2 status is PENDING (actual: ${sem2Row?.status})`);

  // ── TEST 7: Receipt Download & Activity Audit Logging ──
  console.log('\n--- Test Suite 7: Receipt Generation & Audit Logging ---');
  const paymentHistoryA = studentFeeService.getStudentPaymentHistory(studentA.id);
  assert(paymentHistoryA.length === 1, 'Student A has 1 settled payment transaction');
  assert(paymentHistoryA[0].receiptNo === 'SSIU-REC-2026-001', 'Official receipt number matches expected format');

  // Test Audit Log creation
  studentFeeService.logReceiptActivity('DOWNLOAD', 'SSIU-REC-2026-001', studentA.name, studentAUser, 'STUDENT');
  studentFeeService.logReceiptActivity('PRINT', 'SSIU-REC-2026-001', studentA.name, studentAUser, 'STUDENT');

  const receiptAuditLogs = db.getAuditLogs().filter(a => a.action.startsWith('FEE_RECEIPT_'));
  assert(receiptAuditLogs.length >= 2, 'Receipt download and print events logged in ERP Central Audit Trail');

  // ── TEST 8: Transaction History Filtering ──
  console.log('\n--- Test Suite 8: Transaction History Filtering ---');
  const filteredByUpi = studentFeeService.getStudentPaymentHistory(studentA.id, { paymentMode: 'Online UPI' });
  assert(filteredByUpi.length === 1, 'Filter by paymentMode Online UPI returned 1 match');

  const filteredByFailed = studentFeeService.getStudentPaymentHistory(studentB.id, { status: 'FAILED' });
  assert(filteredByFailed.length === 1, 'Filter by status FAILED returned failed transaction');

  // ── TEST 9: Strict Scoping & Unauthorized Access Prevention ──
  console.log('\n--- Test Suite 9: Security Scoping & Cross-Student Isolation ---');
  const studentAQueries = feeQueryService.getScopedQueries(studentAUser, 'STUDENT');
  assert(studentAQueries.every(q => q.studentId === studentA.id || q.enrollmentNo === studentA.enrollmentNo), 'Student A only retrieves own scoped queries');

  const studentAFeeTxs = studentFeeService.getStudentPaymentHistory(studentA.id);
  assert(studentAFeeTxs.every(t => t.studentId === studentA.id), 'Student A payment history strictly isolated from other students');

  // ── TEST 10: Raise Fee Query & Financial Correction Workflow ──
  console.log('\n--- Test Suite 10: Fee Query & Financial Correction Workflow ---');
  
  // 1. Student B raises a query for Sem 1 balance adjustment
  const newQuery = feeQueryService.createFeeQuery({
    category: 'SEMESTER_FEE',
    subject: 'Scholarship concession not applied to Semester 1 fee',
    description: 'Received 50% merit scholarship of ₹25,000. Please adjust against Sem 1 outstanding balance.',
    priority: 'HIGH',
    claimedAmount: 25000,
    studentFeeRecordId: feeRecordB1.id
  }, studentBUser);

  assert(Boolean(newQuery), 'Fee query submitted by Student B');
  assert(newQuery.status === 'SUBMITTED', 'Initial query status is SUBMITTED');
  assert(newQuery.timeline.length === 1, 'Initial query timeline item recorded');

  // 2. Finance resolves query with ₹25,000 credit adjustment
  const resolvedQuery = feeQueryService.resolveFeeQuery(
    newQuery.id,
    {
      resolutionSummary: 'Verified 50% Merit Scholarship certificate. Applied ₹25,000 fee concession.',
      resolutionRemarks: 'Credited ₹25,000 scholarship concession to Sem 1 fee ledger.',
      action: 'RESOLVED',
      adjustmentAmount: 25000,
      adjustStudentRecordId: feeRecordB1.id,
      adjustmentType: 'CREDIT_PAYMENT'
    },
    financeUser
  );

  assert(resolvedQuery.status === 'RESOLVED', 'Query status transitioned to RESOLVED');
  assert(resolvedQuery.assignedAccountsHandlerName === financeUser.name, 'Accounts handler recorded in resolved query');

  // 3. Verify Master StudentFeeRecord was adjusted atomically
  const updatedFeeRecordB1 = db.getStudentFeeRecords().find(r => r.id === feeRecordB1.id);
  assert(updatedFeeRecordB1?.paidAmount === 70000, 'Student B Sem 1 paidAmount updated from ₹45,000 to ₹70,000 (+₹25,000)');
  assert(updatedFeeRecordB1?.pendingAmount === 25000, 'Student B Sem 1 pendingAmount reduced to ₹25,000');

  // 4. Verify Financial Correction Audit Log
  const financialAuditLogs = db.getAuditLogs().filter(a => a.action === 'FINANCIAL_CORRECTION_APPLIED');
  assert(financialAuditLogs.length > 0, 'Central financial correction audit log created for accounts adjustment');

  // ── Number To Words Helper Verification ──
  console.log('\n--- Number to Words Currency Test ---');
  const words75k = studentFeeService.numberToWords(75000);
  assert(words75k === 'Rupees Seventy Five Thousand Only', `75000 converted to words correctly: "${words75k}"`);

  // ── Summary ──
  console.log('\n==================================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStudentFeeTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
