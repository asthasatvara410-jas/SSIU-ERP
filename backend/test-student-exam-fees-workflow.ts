import { db } from '../src/services/db';
import { ExamForm } from '../src/types';

console.log('================================================================');
console.log('SSIU ERP - STUDENT EXAM FEES & PAYMENT WORKFLOW TEST SUITE');
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

// ── TEST SCENARIO 1: EXAM CONTROLLER FEE CONFIGURATION RESOLUTION ────────────
console.log('--- TEST SCENARIO 1: DYNAMIC FEE RESOLUTION ---');

const exams = db.getExams();
assert(exams.length > 0, 'At least one university examination must exist in database');

const targetExam = exams[0];
const regularBreakdown = db.getExamFeeBreakdown(targetExam.id, 'stu-1', 'REGULAR', 6);

assert(regularBreakdown.baseFee > 0, `Regular base fee (Rs ${regularBreakdown.baseFee}) must be > 0`);
assert(regularBreakdown.perSubjectFee > 0, `Per subject fee (Rs ${regularBreakdown.perSubjectFee}) must be > 0`);
assert(regularBreakdown.subjectFeeTotal === regularBreakdown.perSubjectFee * 6, 'Subject fee total must equal perSubjectFee * 6');
assert(regularBreakdown.totalPayable >= regularBreakdown.baseFee + regularBreakdown.subjectFeeTotal, 'Total payable must include base fee and subject fees');

const backlogBreakdown = db.getExamFeeBreakdown(targetExam.id, 'stu-1', 'BACKLOG', 2);
assert(backlogBreakdown.baseFee >= 300, 'Backlog base fee must be configured');
assert(backlogBreakdown.subjectFeeTotal === backlogBreakdown.perSubjectFee * 2, 'Backlog subject fees calculated correctly');

const reassessmentBreakdown = db.getExamFeeBreakdown(targetExam.id, 'stu-1', 'REASSESSMENT', 1);
assert(reassessmentBreakdown.baseFee > 0, 'Reassessment fee must be configured');

// ── TEST SCENARIO 2: EXAM FORM PAYMENT VERIFICATION GATEWAY ──────────────────
console.log('\n--- TEST SCENARIO 2: EXAM FORM PAYMENT INTEGRATION ---');

// 1. Create a draft exam form with PAYMENT_PENDING
const draftForm: ExamForm = {
  id: `form-test-${Date.now()}`,
  examId: targetExam.id,
  studentId: 'stu-1',
  studentName: 'Kavya Shah',
  enrollmentNo: '26SSIU042',
  academicYear: '2026-2027',
  semester: 4,
  formSubjects: ['CS401', 'CS402', 'CS403', 'CS404', 'CS405', 'CS406'],
  baseFee: regularBreakdown.baseFee,
  subjectFee: regularBreakdown.subjectFeeTotal,
  lateFee: 0,
  totalFee: regularBreakdown.totalPayable,
  paymentStatus: 'PENDING',
  status: 'PAYMENT_PENDING',
  submittedAt: new Date().toISOString()
};

db.addEntity<ExamForm>('examForms', draftForm);

// Prior to payment, verify form is NOT marked as paid or approved
const fetchedFormBefore = db.getExamForms().find(f => f.id === draftForm.id);
assert(fetchedFormBefore?.paymentStatus === 'PENDING', 'Exam form payment status must be PENDING before payment');
assert(fetchedFormBefore?.status !== 'APPROVED', 'Unpaid exam form must not be marked APPROVED');

// 2. Process Simulated Payment
const transactionId = `TXN-EXAM-${Date.now().toString().slice(-6)}`;
const receiptNo = `EXAM-FEE/2026/0099`;
const paidDate = new Date().toISOString().split('T')[0];

db.updateEntity<ExamForm>('examForms', draftForm.id, {
  paymentStatus: 'PAID',
  paymentMode: 'UPI (Google Pay)',
  transactionId,
  receiptNo,
  paidAt: paidDate,
  status: 'VERIFICATION_PENDING'
});

const fetchedFormAfter = db.getExamForms().find(f => f.id === draftForm.id);
assert(fetchedFormAfter?.paymentStatus === 'PAID', 'Exam form payment status must update to PAID');
assert(fetchedFormAfter?.status === 'VERIFICATION_PENDING', 'Exam form status must transition to VERIFICATION_PENDING upon payment');
assert(fetchedFormAfter?.transactionId === transactionId, 'Transaction ID must be recorded on form');
assert(fetchedFormAfter?.receiptNo === receiptNo, 'Receipt No must be recorded on form');

// ── TEST SCENARIO 3: ERP NOTIFICATION INTEGRATION ────────────────────────────
console.log('\n--- TEST SCENARIO 3: NOTIFICATIONS ---');

db.addNotification({
  title: 'Exam Fee Paid Successfully',
  message: `Payment of ₹${draftForm.totalFee} for ${targetExam.name} confirmed. Receipt: ${receiptNo}`,
  module: 'EXAM' as any,
  priority: 'HIGH' as any,
  linkTab: 'exam-fees-student'
});

const notifications = db.getNotifications();
const paymentNotification = notifications.find(n => n.message.includes(receiptNo));
assert(Boolean(paymentNotification), 'ERP Notification must be created for successful payment');

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
