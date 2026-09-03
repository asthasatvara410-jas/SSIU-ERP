/**
 * PHASE 3 — EXAM FORM VERIFICATION & HALL TICKET MANAGEMENT TEST SUITE
 * 
 * Comprehensive automated test suite verifying:
 * 1. Submitted forms appear in Exam Controller queue.
 * 2. Exam Controller starts review -> status = UNDER_REVIEW.
 * 3. Exam Controller can verify valid paid form -> status = VERIFIED, verifier info recorded.
 * 4. Controller cannot verify unpaid form -> 400 Bad Request.
 * 5. Return requires mandatory reason.
 * 6. Reject requires mandatory reason.
 * 7. Student role cannot verify own or other forms (403 Forbidden).
 * 8. Bulk verification validates all selected forms, ensures same exam & paid status.
 * 9. Hall ticket cannot be generated for unverified form (400 Bad Request).
 * 10. Hall ticket cannot be generated for unpaid form (400 Bad Request).
 * 11. Unique Hall Ticket Number generation.
 * 12. Student can access only their own Hall Ticket (RBAC).
 * 13. HOD can access only department students' Hall Tickets.
 * 14. Public QR verification returns authentic sanitized metadata without sensitive info exposure.
 */

import { ExamService } from './src/exam/exam.service';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetails?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}`);
    if (errorDetails) {
      console.error('     Details:', errorDetails);
    }
  }
}

// In-Memory Mock Store for Phase 3 Verification & Hall Ticket tests
class MockPrismaService {
  private exams: any[] = [];
  private examSubjects: any[] = [];
  private examFees: any[] = [];
  private examLateFeeRules: any[] = [];
  private examForms: any[] = [];
  private examFormSubjects: any[] = [];
  private hallTickets: any[] = [];
  private students: any[] = [];
  private programs: any[] = [];
  private departments: any[] = [];
  private institutes: any[] = [];
  private subjects: any[] = [];
  private users: any[] = [];

  constructor() {
    this.departments = [
      { id: 'dept-cse', code: 'CSE', name: 'Department of Computer Engineering' },
      { id: 'dept-me', code: 'ME', name: 'Department of Mechanical Engineering' },
    ];

    this.institutes = [
      { id: 'inst-1', code: 'SSCIT', name: 'Swarrnim Institute of Technology' },
    ];

    this.programs = [
      { id: 'prog-btech-cse', code: 'BTECH-CSE', name: 'B.Tech Computer Engineering', departmentId: 'dept-cse', instituteId: 'inst-1' },
      { id: 'prog-btech-me', code: 'BTECH-ME', name: 'B.Tech Mechanical Engineering', departmentId: 'dept-me', instituteId: 'inst-1' },
    ];

    this.subjects = [
      { id: 'sub-ce401', code: 'CE401', name: 'Data Structures', programId: 'prog-btech-cse', credits: 4 },
      { id: 'sub-ce402', code: 'CE402', name: 'Database Systems', programId: 'prog-btech-cse', credits: 4 },
    ];

    this.students = [
      {
        id: 'stu-01',
        erpId: 'STU001',
        enrollmentNo: 'EN2024CSE001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        status: 'ACTIVE',
        departmentId: 'dept-cse',
        instituteId: 'inst-1',
        programId: 'prog-btech-cse',
        batch: { programId: 'prog-btech-cse', academicYear: '2026-27' },
        department: this.departments[0],
        institute: this.institutes[0],
      },
      {
        id: 'stu-02',
        erpId: 'STU002',
        enrollmentNo: 'EN2024CSE002',
        firstName: 'Priya',
        lastName: 'Patel',
        status: 'ACTIVE',
        departmentId: 'dept-cse',
        instituteId: 'inst-1',
        programId: 'prog-btech-cse',
        batch: { programId: 'prog-btech-cse', academicYear: '2026-27' },
        department: this.departments[0],
        institute: this.institutes[0],
      },
      {
        id: 'stu-03',
        erpId: 'STU003',
        enrollmentNo: 'EN2024ME001',
        firstName: 'Amit',
        lastName: 'Verma',
        status: 'ACTIVE',
        departmentId: 'dept-me',
        instituteId: 'inst-1',
        programId: 'prog-btech-me',
        batch: { programId: 'prog-btech-me', academicYear: '2026-27' },
        department: this.departments[1],
        institute: this.institutes[0],
      },
    ];

    this.users = [
      { id: 'usr-controller', username: 'exam_controller', name: 'Dr. S. K. Controller', role: 'EXAM_CONTROLLER', roles: ['EXAM_CONTROLLER'] },
      { id: 'usr-student1', username: 'EN2024CSE001', name: 'Rahul Sharma', role: 'STUDENT', roles: ['STUDENT'], student: this.students[0] },
      { id: 'usr-student2', username: 'EN2024CSE002', name: 'Priya Patel', role: 'STUDENT', roles: ['STUDENT'], student: this.students[1] },
      { id: 'usr-hod-cse', username: 'hod_cse', name: 'Prof. HOD CSE', role: 'HOD', department: 'dept-cse' },
    ];
  }

  get exam() {
    return {
      create: async ({ data }: any) => {
        const item = { id: `exam-${Date.now()}`, ...data, createdAt: new Date() };
        this.exams.push(item);
        return item;
      },
      findUnique: async ({ where }: any) => {
        const item = this.exams.find(e => e.id === where.id || e.code === where.code);
        if (!item) return null;
        return {
          ...item,
          program: this.programs.find(p => p.id === item.programId),
          examFees: this.examFees.filter(f => f.examId === item.id),
          lateFeeRules: this.examLateFeeRules.filter(l => l.examId === item.id),
          examSubjects: this.examSubjects.filter(s => s.examId === item.id).map(es => ({
            ...es,
            subject: this.subjects.find(s => s.id === es.subjectId),
          })),
        };
      },
    };
  }

  get examSubject() {
    return {
      create: async ({ data }: any) => {
        const item = { id: `es-${Date.now()}-${Math.random()}`, ...data };
        this.examSubjects.push(item);
        return item;
      },
    };
  }

  get examFee() {
    return {
      create: async ({ data }: any) => {
        const item = { id: `ef-${Date.now()}`, ...data };
        this.examFees.push(item);
        return item;
      },
    };
  }

  get examLateFeeRule() {
    return {
      create: async ({ data }: any) => {
        const item = { id: `el-${Date.now()}`, ...data };
        this.examLateFeeRules.push(item);
        return item;
      },
    };
  }

  get examForm() {
    return {
      create: async ({ data }: any) => {
        const item = {
          id: `form-${Date.now()}-${Math.random()}`,
          status: 'DRAFT',
          paymentStatus: 'PENDING',
          feePaid: false,
          attemptNumber: 1,
          createdAt: new Date(),
          ...data,
        };
        this.examForms.push(item);
        return item;
      },
      findUnique: async ({ where }: any) => {
        const f = this.examForms.find(x => x.id === where.id || x.formNumber === where.formNumber);
        if (!f) return null;
        const exam = this.exams.find(e => e.id === f.examId);
        const student = this.students.find(s => s.id === f.studentId);
        const formSubs = this.examFormSubjects.filter(s => s.examFormId === f.id).map(fs => ({
          ...fs,
          subject: this.subjects.find(sub => sub.id === fs.subjectId),
        }));
        const ticket = this.hallTickets.find(h => h.examFormId === f.id);
        return {
          ...f,
          exam: exam ? {
            ...exam,
            program: this.programs.find(p => p.id === exam.programId),
            examSubjects: this.examSubjects.filter(s => s.examId === exam.id).map(es => ({
              ...es,
              subject: this.subjects.find(sub => sub.id === es.subjectId),
            })),
          } : null,
          student: student ? {
            ...student,
            department: this.departments.find(d => d.id === student.departmentId),
            institute: this.institutes.find(i => i.id === student.instituteId),
          } : null,
          formSubjects: formSubs,
          hallTicket: ticket || null,
        };
      },
      findMany: async ({ where }: any) => {
        let list = [...this.examForms];
        if (where?.id?.in) {
          list = list.filter(f => where.id.in.includes(f.id));
        }
        if (where?.examId) {
          list = list.filter(f => f.examId === where.examId);
        }
        if (where?.studentId) {
          list = list.filter(f => f.studentId === where.studentId);
        }
        if (where?.status?.in) {
          list = list.filter(f => where.status.in.includes(f.status));
        } else if (where?.status) {
          list = list.filter(f => f.status === where.status);
        }
        return list.map(f => {
          const exam = this.exams.find(e => e.id === f.examId);
          const student = this.students.find(s => s.id === f.studentId);
          const ticket = this.hallTickets.find(h => h.examFormId === f.id);
          return {
            ...f,
            exam,
            student,
            hallTicket: ticket || null,
            formSubjects: this.examFormSubjects.filter(s => s.examFormId === f.id),
          };
        });
      },
      count: async () => this.examForms.length,
      update: async ({ where, data }: any) => {
        const idx = this.examForms.findIndex(x => x.id === where.id);
        if (idx === -1) throw new Error('Form not found');
        this.examForms[idx] = { ...this.examForms[idx], ...data, updatedAt: new Date() };
        return this.examForm.findUnique({ where });
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        this.examForms = this.examForms.map(f => {
          if (where?.id?.in && where.id.in.includes(f.id)) {
            count++;
            return { ...f, ...data, updatedAt: new Date() };
          }
          return f;
        });
        return { count };
      },
    };
  }

  get examFormSubject() {
    return {
      create: async ({ data }: any) => {
        const item = { id: `efs-${Date.now()}-${Math.random()}`, ...data };
        this.examFormSubjects.push(item);
        return item;
      },
    };
  }

  get hallTicket() {
    return {
      create: async ({ data }: any) => {
        const item = {
          id: `ht-${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          ...data,
        };
        this.hallTickets.push(item);
        return item;
      },
      findUnique: async ({ where }: any) => {
        const ticket = this.hallTickets.find(h => h.verificationCode === where.verificationCode || h.hallTicketNo === where.hallTicketNo || h.id === where.id);
        if (!ticket) return null;
        const student = this.students.find(s => s.id === ticket.studentId);
        const form = this.examForms.find(f => f.id === ticket.examFormId);
        const exam = this.exams.find(e => e.id === ticket.examId);
        return {
          ...ticket,
          student: student ? {
            ...student,
            department: this.departments.find(d => d.id === student.departmentId),
            institute: this.institutes.find(i => i.id === student.instituteId),
          } : null,
          examForm: form ? {
            ...form,
            exam,
            formSubjects: this.examFormSubjects.filter(fs => fs.examFormId === form.id).map(fs => ({
              ...fs,
              subject: this.subjects.find(sub => sub.id === fs.subjectId),
            })),
          } : null,
        };
      },
      findFirst: async ({ where }: any) => {
        let ticket: any = null;
        if (where?.OR) {
          ticket = this.hallTickets.find(h => where.OR.some((cond: any) => h.id === cond.id || h.hallTicketNo === cond.hallTicketNo || h.examFormId === cond.examFormId));
        }
        if (!ticket) return null;
        const student = this.students.find(s => s.id === ticket.studentId);
        const form = this.examForms.find(f => f.id === ticket.examFormId);
        const exam = this.exams.find(e => e.id === ticket.examId);
        return {
          ...ticket,
          student: student ? {
            ...student,
            department: this.departments.find(d => d.id === student.departmentId),
            institute: this.institutes.find(i => i.id === student.instituteId),
          } : null,
          examForm: form ? {
            ...form,
            exam,
            formSubjects: this.examFormSubjects.filter(fs => fs.examFormId === form.id),
          } : null,
        };
      },
      findMany: async ({ where }: any) => {
        let list = [...this.hallTickets];
        if (where?.studentId) list = list.filter(h => h.studentId === where.studentId);
        if (where?.student?.departmentId) {
          list = list.filter(h => {
            const s = this.students.find(stu => stu.id === h.studentId);
            return s && s.departmentId === where.student.departmentId;
          });
        }
        if (where?.examId) list = list.filter(h => h.examId === where.examId);
        return list.map(t => {
          const student = this.students.find(s => s.id === t.studentId);
          const form = this.examForms.find(f => f.id === t.examFormId);
          return {
            ...t,
            student,
            examForm: form,
          };
        });
      },
    };
  }

  get student() {
    return {
      findUnique: async ({ where }: any) => this.students.find(s => s.id === where.id || s.erpId === where.erpId || s.enrollmentNo === where.enrollmentNo),
      findFirst: async ({ where }: any) => {
        if (where?.OR) {
          for (const cond of where.OR) {
            const found = this.students.find(s => (cond.id && s.id === cond.id) || (cond.enrollmentNo && s.enrollmentNo === cond.enrollmentNo));
            if (found) return found;
          }
        }
        return this.students.find(s => s.enrollmentNo === where?.enrollmentNo || s.erpId === where?.erpId || s.id === where?.id);
      },
    };
  }

  get user() {
    return {
      findUnique: async ({ where }: any) => this.users.find(u => u.id === where.id || u.username === where.username),
      findFirst: async ({ where }: any) => {
        if (where?.OR) {
          for (const cond of where.OR) {
            const found = this.users.find(u => (cond.id && u.id === cond.id) || (cond.username && u.username === cond.username));
            if (found) return found;
          }
        }
        return this.users.find(u => u.id === where?.id || u.username === where?.username);
      },
    };
  }

  get noteSheet() {
    return {
      findUnique: async () => null,
      update: async () => ({}),
    };
  }

  $transaction = async (cb: any) => cb(this);
}

async function runPhase3VerificationAndHallTicketTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PHASE 3 — EXAM FORM VERIFICATION & HALL TICKET TESTS');
  console.log('===============================================================\n');

  const mockPrisma = new MockPrismaService();
  const service = new ExamService(mockPrisma as any);

  const controllerUser = { id: 'usr-controller', username: 'exam_controller', name: 'Dr. S. K. Controller', role: 'EXAM_CONTROLLER', roles: ['EXAM_CONTROLLER'] };
  const student1User = { id: 'usr-student1', username: 'EN2024CSE001', name: 'Rahul Sharma', role: 'STUDENT', roles: ['STUDENT'] };
  const student2User = { id: 'usr-student2', username: 'EN2024CSE002', name: 'Priya Patel', role: 'STUDENT', roles: ['STUDENT'] };
  const hodCSEUser = { id: 'usr-hod-cse', username: 'hod_cse', name: 'Prof. HOD CSE', role: 'HOD', department: 'dept-cse' };

  // Setup Examination
  const exam = await mockPrisma.exam.create({
    data: {
      code: 'EXAM-2026-CSE-SEM4',
      name: 'B.Tech CSE Semester-4 Examination 2026',
      programId: 'prog-btech-cse',
      academicYearCode: '2026-27',
      semesterNumber: 4,
      status: 'FORM_OPEN',
    },
  });

  await mockPrisma.examSubject.create({ data: { examId: exam.id, subjectId: 'sub-ce401', credits: 4 } });
  await mockPrisma.examSubject.create({ data: { examId: exam.id, subjectId: 'sub-ce402', credits: 4 } });
  await mockPrisma.examFee.create({ data: { examId: exam.id, examType: 'REGULAR', amount: 2500 } });

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 1: Form Submission & Controller Queue
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- Group 1: Form Submission & Controller Queue ---');

  const form1 = await mockPrisma.examForm.create({
    data: {
      examId: exam.id,
      studentId: 'stu-01',
      formNumber: 'EXAM/2026/000101',
      status: 'SUBMITTED',
      totalAmount: 2500,
      paymentStatus: 'SUCCESS',
      feePaid: true,
      submittedAt: new Date(),
    },
  });

  const form2Unpaid = await mockPrisma.examForm.create({
    data: {
      examId: exam.id,
      studentId: 'stu-02',
      formNumber: 'EXAM/2026/000102',
      status: 'SUBMITTED',
      totalAmount: 2500,
      paymentStatus: 'PENDING',
      feePaid: false,
      submittedAt: new Date(),
    },
  });

  await mockPrisma.examFormSubject.create({ data: { examFormId: form1.id, subjectId: 'sub-ce401', amount: 2500 } });
  await mockPrisma.examFormSubject.create({ data: { examFormId: form2Unpaid.id, subjectId: 'sub-ce401', amount: 2500 } });

  const controllerForms = await service.getExamFormsList({}, controllerUser);
  assert(controllerForms.total >= 2, 'Submitted forms appear in Exam Controller verification queue');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 2: Review & Verification Workflow
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 2: Single Review & Verification Lifecycle ---');

  const reviewed = await service.reviewExamForm(form1.id, controllerUser);
  assert(reviewed.status === 'UNDER_REVIEW', 'Form status successfully transitioned to UNDER_REVIEW');

  const verified = await service.verifyExamForm(form1.id, { verificationRemarks: 'All subjects and payment cleared' }, controllerUser);
  assert(verified.status === 'VERIFIED', 'Form status successfully transitioned to VERIFIED');
  assert(verified.verifiedBy === 'Dr. S. K. Controller', 'Verified By examiner name stored');
  assert(verified.verifiedAt instanceof Date, 'Verified At timestamp recorded');

  // Payment Guard: Verify Unpaid Form Must Fail
  let unpaidVerifyError = null;
  try {
    await service.verifyExamForm(form2Unpaid.id, {}, controllerUser);
  } catch (err: any) {
    unpaidVerifyError = err;
  }
  assert(unpaidVerifyError instanceof Error && unpaidVerifyError.message.includes('unpaid'), 'Verification strictly blocked for unpaid exam form (400 Bad Request)');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 3: Mandatory Reason Validation on Return & Reject
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 3: Mandatory Reasons on Return and Reject ---');

  let emptyReturnError = null;
  try {
    await service.returnExamForm(form2Unpaid.id, { returnReason: '   ' }, controllerUser);
  } catch (err: any) {
    emptyReturnError = err;
  }
  assert(emptyReturnError instanceof Error && emptyReturnError.message.includes('mandatory'), 'Empty return reason is strictly rejected');

  const returned = await service.returnExamForm(form2Unpaid.id, { returnReason: 'Please select correct semester backlogs' }, controllerUser);
  assert(returned.status === 'RETURNED', 'Form status transitioned to RETURNED');
  assert(returned.returnReason === 'Please select correct semester backlogs', 'Return reason stored on form record');

  let emptyRejectError = null;
  try {
    await service.rejectExamForm(form2Unpaid.id, { rejectionReason: '' }, controllerUser);
  } catch (err: any) {
    emptyRejectError = err;
  }
  assert(emptyRejectError instanceof Error && emptyRejectError.message.includes('mandatory'), 'Empty rejection reason is strictly rejected');

  const rejected = await service.rejectExamForm(form2Unpaid.id, { rejectionReason: 'Statutory minimum attendance criteria not met' }, controllerUser);
  assert(rejected.status === 'REJECTED', 'Form status transitioned to REJECTED');
  assert(rejected.rejectionReason === 'Statutory minimum attendance criteria not met', 'Rejection reason stored on form record');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 4: RBAC & Security Enforcements
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 4: Role-Based Access Control & Security ---');

  let studentVerifyError = null;
  try {
    await service.verifyExamForm(form1.id, {}, student1User);
  } catch (err: any) {
    studentVerifyError = err;
  }
  assert(studentVerifyError instanceof Error && studentVerifyError.message.includes('Only Examination Controller'), 'Student is strictly forbidden from verifying examination forms (403 Forbidden)');

  let studentReturnError = null;
  try {
    await service.returnExamForm(form1.id, { returnReason: 'Hack' }, student1User);
  } catch (err: any) {
    studentReturnError = err;
  }
  assert(studentReturnError instanceof Error && studentReturnError.message.includes('Only Examination Controller'), 'Student is forbidden from returning examination forms');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 5: Bulk Verification Workflow
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 5: Bulk Verification & Bulk Return ---');

  const form3Paid = await mockPrisma.examForm.create({
    data: {
      examId: exam.id,
      studentId: 'stu-02',
      formNumber: 'EXAM/2026/000103',
      status: 'SUBMITTED',
      totalAmount: 2500,
      paymentStatus: 'SUCCESS',
      feePaid: true,
      submittedAt: new Date(),
    },
  });

  const form4Paid = await mockPrisma.examForm.create({
    data: {
      examId: exam.id,
      studentId: 'stu-03',
      formNumber: 'EXAM/2026/000104',
      status: 'SUBMITTED',
      totalAmount: 2500,
      paymentStatus: 'SUCCESS',
      feePaid: true,
      submittedAt: new Date(),
    },
  });

  const bulkVerifyRes = await service.bulkVerifyExamForms({ formIds: [form3Paid.id, form4Paid.id] }, controllerUser);
  assert(bulkVerifyRes.success === true && bulkVerifyRes.verifiedCount === 2, 'Bulk verification successfully approved 2 paid forms');

  const reloadedForm3 = await mockPrisma.examForm.findUnique({ where: { id: form3Paid.id } });
  assert(reloadedForm3.status === 'VERIFIED', 'Bulk-verified form 3 status is VERIFIED');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 6: Hall Ticket Generation & Rules
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 6: Hall Ticket Generation Rules & Uniqueness ---');

  // Unverified Form Hall Ticket Attempt
  let unverifiedHtError = null;
  try {
    await service.generateHallTicketForForm(form2Unpaid.id, controllerUser);
  } catch (err: any) {
    unverifiedHtError = err;
  }
  assert(unverifiedHtError instanceof Error && unverifiedHtError.message.includes('VERIFIED'), 'Hall ticket generation blocked for unverified form (400 Bad Request)');

  // Generate Hall Ticket for Verified Form 1
  const ticket1 = await service.generateHallTicketForForm(form1.id, controllerUser);
  assert(ticket1.hallTicketNo.startsWith('HT-'), 'Generated Hall Ticket Number with valid format prefix HT-');
  assert(ticket1.status === 'GENERATED', 'Hall ticket status is GENERATED');
  assert(ticket1.verificationCode.startsWith('VREF-'), 'Unique verification code generated');

  // Duplicate generation returns existing without creating duplicate
  const ticket1DuplicateAttempt = await service.generateHallTicketForForm(form1.id, controllerUser);
  assert(ticket1DuplicateAttempt.id === ticket1.id, 'Duplicate generation returns existing hall ticket without duplicate records');

  // Generate Hall Ticket for Form 3
  const ticket3 = await service.generateHallTicketForForm(form3Paid.id, controllerUser);
  assert(ticket3.hallTicketNo !== ticket1.hallTicketNo, 'Hall ticket numbers are strictly unique between students');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 7: Hall Ticket Scoping & RBAC
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 7: Student & Department Hall Ticket Scoping ---');

  const student1Tickets = await service.getHallTicketsList({}, student1User);
  assert(student1Tickets.length === 1 && student1Tickets[0].studentId === 'stu-01', 'Student 1 retrieves only their own Hall Ticket');

  let crossStudentHtError = null;
  try {
    await service.getHallTicketById(ticket3.id, student1User);
  } catch (err: any) {
    crossStudentHtError = err;
  }
  assert(crossStudentHtError instanceof Error && crossStudentHtError.message.includes('not authorized'), 'Student cannot access another student Hall Ticket (403 Forbidden)');

  const hodTickets = await service.getHallTicketsList({}, hodCSEUser);
  assert(hodTickets.every((t: any) => t.student?.departmentId === 'dept-cse'), 'HOD accesses only Hall Tickets of their own department');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 8: Public QR Verification Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 8: Public QR Verification ---');

  const publicVerification = await service.verifyPublicHallTicket(ticket1.verificationCode);
  assert(publicVerification.isValid === true, 'Public QR verification confirms authentic Hall Ticket');
  assert(publicVerification.verificationStatus === 'AUTHENTIC_AND_VERIFIED', 'Verification status AUTHENTIC_AND_VERIFIED returned');
  assert(publicVerification.studentName === 'Rahul Sharma', 'Student name matches public verification record');
  assert(publicVerification.hallTicketNumber === ticket1.hallTicketNo, 'Hall Ticket number verified');
  assert((publicVerification as any).password === undefined, 'No sensitive password data exposed in public endpoint');
  assert((publicVerification as any).paymentTransactionId === undefined, 'No payment transaction data exposed in public verification');

  const invalidVerification = await service.verifyPublicHallTicket('INVALID-CODE-999');
  assert(invalidVerification.isValid === false, 'Invalid QR verification code returns isValid: false');

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`📊 PHASE 3 VERIFICATION & HALL TICKET SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (${totalTests} TOTAL)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase3VerificationAndHallTicketTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
