import { db } from '../src/services/db';

console.log('=== RUNNING END-TO-END EXAMINATION SESSION WORKFLOW TEST ===\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

// Setup users
const controllerUser: any = {
  id: 'usr-admin-1',
  name: 'Exam Controller Officer',
  role: 'EXAM_CONTROLLER',
  email: 'controller@swarrnim.edu.in'
};

const defaultStudent = db.getStudents().find(s => s.status === 'ACTIVE' || !s.status) || db.getStudents()[0];

const studentUser: any = {
  id: defaultStudent.id,
  name: defaultStudent.name,
  role: 'STUDENT',
  email: defaultStudent.email || 'student1@swarrnim.edu.in',
  studentId: defaultStudent.id,
  enrollmentNo: defaultStudent.enrollmentNo
};

// 1. Controller creates a DRAFT examination matching this student's academic mapping
console.log('\n--- Step 1: Controller creates DRAFT examination ---');
const draftExam = db.createExam({
  name: 'End Semester Summer 2026 Regular Exams',
  examCode: 'EXAM-SUMMER-2026-REG',
  session: 'Summer 2026',
  academicYearId: defaultStudent.academicYearId || 'ay-2024',
  programId: defaultStudent.programId,
  departmentId: defaultStudent.departmentId,
  semesterNumber: defaultStudent.currentSemester || (defaultStudent as any).semesterNumber || 4,
  type: 'Regular',
  status: 'DRAFT',
  formStartDate: '2026-01-01',
  formEndDate: '2026-12-31',
  startDate: '2026-07-05',
  endDate: '2026-07-25',
  examFee: 1500,
  lateFee: 500,
  instructions: 'All students must bring admit cards.'
}, controllerUser);

console.log('Default Student in DB:', {
  id: defaultStudent.id,
  name: defaultStudent.name,
  programId: defaultStudent.programId,
  departmentId: defaultStudent.departmentId,
  semesterId: defaultStudent.semesterId,
  currentSemester: defaultStudent.currentSemester,
  academicYearId: defaultStudent.academicYearId,
  status: defaultStudent.status,
  academicStatus: defaultStudent.academicStatus
});

console.log('Draft Exam Created:', {
  id: draftExam.id,
  status: draftExam.status,
  programId: draftExam.programId,
  departmentId: draftExam.departmentId,
  academicYearId: draftExam.academicYearId,
  semesterNumber: draftExam.semesterNumber
});

assert(draftExam.id !== undefined, 'Draft exam was created with ID: ' + draftExam.id);
assert(draftExam.status === 'DRAFT', 'Draft exam has status DRAFT');

// 2. Verify student DOES NOT see the draft examination
console.log('\n--- Step 2: Student Portal eligibility check on DRAFT exam ---');
let studentAvailExams = db.getAvailableExamsForStudent(studentUser);
let isDraftVisibleToStudent = studentAvailExams.some(e => e.id === draftExam.id);
assert(!isDraftVisibleToStudent, 'Draft exam is NOT visible to student in Available Examinations');

// 3. Controller publishes the exam session
console.log('\n--- Step 3: Controller publishes exam session ---');
const publishedExam = db.updateExam(draftExam.id, {
  status: 'PUBLISHED',
  subjects: [
    { subjectId: 'sub-ce401', subjectCode: 'CE401', subjectName: 'Data Structures & Algorithms', credits: 4, fee: 300 },
    { subjectId: 'sub-ce402', subjectCode: 'CE402', subjectName: 'Database Management Systems', credits: 4, fee: 300 }
  ]
}, controllerUser);

assert(publishedExam !== null && publishedExam.status === 'PUBLISHED', 'Exam status changed to PUBLISHED');

// 4. Student now sees the published examination with accurate mapping
console.log('\n--- Step 4: Student Portal retrieves published exam ---');
studentAvailExams = db.getAvailableExamsForStudent(studentUser);
const matchingExamForStudent = studentAvailExams.find(e => e.id === draftExam.id);
assert(matchingExamForStudent !== undefined, 'Published exam is automatically mapped and visible to student');
assert(matchingExamForStudent?.displayStatus === 'Open', 'Display status is "Open" for student');
assert(matchingExamForStudent?.totalPayable > 0, 'Calculated total fee is positive: ₹' + matchingExamForStudent?.totalPayable);

// 5. Student creates draft and submits examination form application
console.log('\n--- Step 5: Student applies / submits examination form ---');
const createdDraftForm = db.createStudentExamForm({
  examId: matchingExamForStudent.id,
  subjectIds: ['sub-ce401', 'sub-ce402'],
  remarks: 'Applying for regular examination'
}, studentUser);

assert(createdDraftForm !== null && createdDraftForm.id !== undefined, 'Draft form created with ID: ' + createdDraftForm.id);

const submittedForm = db.submitStudentExamForm(createdDraftForm.id, {
  declarationAccepted: true,
  remarks: 'Submitting regular exam form'
}, studentUser);

assert(submittedForm !== null, 'Form submitted successfully');
assert(submittedForm.formNumber.length > 0, 'Form number generated: ' + submittedForm.formNumber);
assert(submittedForm.status === 'SUBMITTED', 'Form status is SUBMITTED');

// Student pays exam fee
const paidForm = db.payStudentExamForm(submittedForm.id, { gateway: 'ONLINE', paymentTransactionId: 'TXN-ONLINE-999' }, studentUser);
assert(paidForm !== null && paidForm.paymentStatus === 'SUCCESS', 'Exam fee successfully cleared');

// 6. Controller sees the application in verification queue
console.log('\n--- Step 6: Controller reviews application in Queue ---');
const queueForms = db.getExamForms();
const formInQueue = queueForms.find(f => f.id === submittedForm.id || f.formNumber === submittedForm.formNumber);
assert(formInQueue !== undefined, 'Submitted form appears in Controller Verification Queue');
assert(formInQueue?.studentName !== undefined, 'Student Name populated: ' + formInQueue?.studentName);
assert(formInQueue?.enrollmentNo !== undefined, 'Enrollment No populated: ' + formInQueue?.enrollmentNo);

// 7. Controller verifies & approves the form
console.log('\n--- Step 7: Controller verifies & approves form ---');
const verifiedForm = db.verifyExamForm(submittedForm.id, 'Verified all credentials and attendance eligibility', controllerUser);
assert(verifiedForm.status === 'VERIFIED', 'Form status updated to VERIFIED');

// 8. Controller generates Hall Ticket
console.log('\n--- Step 8: Controller generates Hall Ticket ---');
const hallTicket = db.generateHallTicket(verifiedForm.id, controllerUser);
assert(hallTicket !== null, 'Hall ticket generated');
assert(hallTicket.hallTicketNo.startsWith('HT-') || hallTicket.hallTicketNo.length > 0, 'Hall Ticket Number generated: ' + hallTicket.hallTicketNo);

// 9. Student retrieves and views their Hall Ticket
console.log('\n--- Step 9: Student views generated Hall Ticket ---');
const studentTickets = db.getHallTickets(studentUser);
const myTicket = studentTickets.find(t => t.id === hallTicket.id);
assert(myTicket !== undefined, 'Student successfully retrieves their official Hall Ticket: ' + myTicket?.hallTicketNo);

console.log(`\n================================`);
console.log(`TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed/total)*100)}%)`);
console.log(`================================\n`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
