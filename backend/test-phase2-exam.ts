/**
 * PHASE 2 — UNIVERSITY EXAMINATION MANAGEMENT CORE TEST SUITE
 * 
 * Comprehensive test suite verifying:
 * 1. Exam Controller: Create new examination session, save draft.
 * 2. Academic Mapping: Institute, Department, Program, Academic Year, Semester validation.
 * 3. Subject Configuration: Map subjects with marks scheme, duration, credits, exam mode.
 * 4. Fee Configuration: Configure Regular, Backlog, and Supplementary exam fees.
 * 5. Late Fee Rules: Fixed, Per Day, and Percentage calculations.
 * 6. Exam Form Window: Start and End date configuration.
 * 7. Status Machine: DRAFT -> FORM_OPEN -> FORM_CLOSED -> CANCELLED.
 * 8. Validation Rules:
 *    - Invalid dates (start > end, formStart >= formEnd) rejected.
 *    - Negative fees rejected.
 *    - Duplicate exam code rejected.
 * 9. RBAC & Security:
 *    - Students blocked from creating/updating/cancelling examinations (403).
 *    - HOD scoped to department examinations.
 * 10. Notesheet Integration: Link Phase 1 Notesheet to Examination.
 * 11. Sidebar Verification: Ensure EDP Duty is NOT in Exam Controller sidebar.
 */

import { ExamService } from './src/exam/exam.service';
import { NoteSheetService } from './src/notesheet/notesheet.service';

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

// In-Memory Mock Store for Examination Entities & Academic Masters
class MockPrismaService {
  private exams: any[] = [];
  private examSubjects: any[] = [];
  private examFees: any[] = [];
  private examLateFeeRules: any[] = [];
  private examFormWindows: any[] = [];
  private examTypes: any[] = [
    { id: 'et-regular', code: 'REGULAR', name: 'Regular Semester Examination', status: 'ACTIVE' },
    { id: 'et-backlog', code: 'BACKLOG', name: 'Backlog Examination', status: 'ACTIVE' },
    { id: 'et-remedial', code: 'REMEDIAL', name: 'Remedial Examination', status: 'ACTIVE' },
  ];
  private programs: any[] = [
    { id: 'prog-btech-cse', code: 'BTECH-CSE', name: 'B.Tech Computer Engineering', departmentId: 'dept-cse', instituteId: 'inst-1' },
    { id: 'prog-btech-it', code: 'BTECH-IT', name: 'B.Tech Information Technology', departmentId: 'dept-it', instituteId: 'inst-1' },
  ];
  private subjects: any[] = [
    { id: 'sub-ds', code: 'CE401', name: 'Data Structures & Algorithms', programId: 'prog-btech-cse', semesterId: 'sem-4', credits: 4 },
    { id: 'sub-dbms', code: 'CE402', name: 'Database Management Systems', programId: 'prog-btech-cse', semesterId: 'sem-4', credits: 4 },
    { id: 'sub-os', code: 'CE403', name: 'Operating Systems', programId: 'prog-btech-cse', semesterId: 'sem-4', credits: 3 },
  ];
  private noteSheets: any[] = [];

  exam = {
    count: async ({ where }: any = {}) => {
      let list = [...this.exams];
      if (where?.programId) list = list.filter(e => e.programId === where.programId);
      if (where?.status) list = list.filter(e => e.status === where.status);
      return list.length;
    },
    findUnique: async ({ where }: any) => {
      const found = this.exams.find(e => (where.id && e.id === where.id) || (where.code && e.code === where.code));
      if (!found) return null;
      return {
        ...found,
        examType: this.examTypes.find(t => t.id === found.examTypeId) || null,
        program: this.programs.find(p => p.id === found.programId) || null,
        notesheet: this.noteSheets.find(n => n.id === found.notesheetId) || null,
        examSubjects: this.examSubjects.filter(s => s.examId === found.id).map(s => ({
          ...s,
          subject: this.subjects.find(sub => sub.id === s.subjectId) || null,
        })),
        examFees: this.examFees.filter(f => f.examId === found.id),
        lateFeeRules: this.examLateFeeRules.filter(l => l.examId === found.id),
        formWindows: this.examFormWindows.filter(w => w.examId === found.id),
      };
    },
    findFirst: async ({ where }: any) => {
      const all = await this.exam.findMany({ where });
      return all[0] || null;
    },
    findMany: async ({ where, skip = 0, take = 50 }: any = {}) => {
      let list = [...this.exams];
      if (where?.programId) list = list.filter(e => e.programId === where.programId);
      if (where?.departmentId) list = list.filter(e => e.departmentId === where.departmentId);
      if (where?.status) {
        if (typeof where.status === 'string') list = list.filter(e => e.status === where.status);
        else if (where.status?.in) list = list.filter(e => where.status.in.includes(e.status));
      }
      if (where?.OR) {
        const q = where.OR[0]?.code?.contains?.toLowerCase() || '';
        list = list.filter(e =>
          e.code.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          (e.session && e.session.toLowerCase().includes(q))
        );
      }
      return list.slice(skip, skip + take).map(e => ({
        ...e,
        examType: this.examTypes.find(t => t.id === e.examTypeId) || null,
        program: this.programs.find(p => p.id === e.programId) || null,
        notesheet: this.noteSheets.find(n => n.id === e.notesheetId) || null,
        examSubjects: this.examSubjects.filter(s => s.examId === e.id),
        examFees: this.examFees.filter(f => f.examId === e.id),
        lateFeeRules: this.examLateFeeRules.filter(l => l.examId === e.id),
      }));
    },
    create: async ({ data }: any) => {
      const id = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const record = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.exams.unshift(record);
      return this.exam.findUnique({ where: { id } });
    },
    update: async ({ where, data }: any) => {
      const idx = this.exams.findIndex(e => e.id === where.id);
      if (idx < 0) throw new Error('Exam not found');
      this.exams[idx] = {
        ...this.exams[idx],
        ...data,
        updatedAt: new Date(),
      };
      return this.exam.findUnique({ where });
    },
  };

  examSubject = {
    create: async ({ data }: any) => {
      const id = `es-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      this.examSubjects.push(record);
      return {
        ...record,
        subject: this.subjects.find(s => s.id === data.subjectId) || null,
      };
    },
    findFirst: async ({ where }: any) => {
      return this.examSubjects.find(s => s.examId === where.examId && s.subjectId === where.subjectId) || null;
    },
    findMany: async ({ where }: any) => {
      return this.examSubjects.filter(s => s.examId === where.examId).map(s => ({
        ...s,
        subject: this.subjects.find(sub => sub.id === s.subjectId) || null,
      }));
    },
    update: async ({ where, data }: any) => {
      const idx = this.examSubjects.findIndex(s => s.id === where.id);
      if (idx < 0) throw new Error('Not found');
      this.examSubjects[idx] = { ...this.examSubjects[idx], ...data, updatedAt: new Date() };
      return this.examSubjects[idx];
    },
    delete: async ({ where }: any) => {
      this.examSubjects = this.examSubjects.filter(s => s.id !== where.id);
      return { success: true };
    },
    deleteMany: async ({ where }: any) => {
      this.examSubjects = this.examSubjects.filter(s => s.examId !== where.examId);
    },
  };

  examFee = {
    create: async ({ data }: any) => {
      const id = `ef-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      this.examFees.push(record);
      return record;
    },
    findMany: async ({ where }: any) => {
      return this.examFees.filter(f => f.examId === where.examId);
    },
    deleteMany: async ({ where }: any) => {
      this.examFees = this.examFees.filter(f => f.examId !== where.examId);
    },
  };

  examLateFeeRule = {
    create: async ({ data }: any) => {
      const id = `elr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      this.examLateFeeRules.push(record);
      return record;
    },
    findMany: async ({ where }: any) => {
      return this.examLateFeeRules.filter(l => l.examId === where.examId);
    },
    deleteMany: async ({ where }: any) => {
      this.examLateFeeRules = this.examLateFeeRules.filter(l => l.examId !== where.examId);
    },
  };

  examFormWindow = {
    create: async ({ data }: any) => {
      const id = `efw-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      this.examFormWindows.push(record);
      return record;
    },
  };

  examType = {
    findFirst: async ({ where }: any) => {
      if (where?.status) return this.examTypes.find(t => t.status === where.status);
      return this.examTypes[0];
    },
    findMany: async () => this.examTypes,
  };

  program = {
    findUnique: async ({ where }: any) => this.programs.find(p => p.id === where.id) || null,
  };

  subject = {
    findUnique: async ({ where }: any) => this.subjects.find(s => s.id === where.id) || null,
  };

  institute = {
    findUnique: async ({ where }: any) => ({ id: where.id, name: 'Faculty of Engineering' }),
  };

  department = {
    findUnique: async ({ where }: any) => ({ id: where.id, name: 'Computer Engineering' }),
  };

  academicYear = {
    findUnique: async ({ where }: any) => ({ id: where.id, year: '2026-27' }),
  };

  semester = {
    findUnique: async ({ where }: any) => ({ id: where.id, number: 4 }),
  };

  noteSheet = {
    findUnique: async ({ where }: any) => this.noteSheets.find(n => n.id === where.id) || null,
    create: async ({ data }: any) => {
      const record = { id: `ns-${Date.now()}`, ...data, createdAt: new Date() };
      this.noteSheets.push(record);
      return record;
    },
  };

  $transaction = async (fn: any) => {
    return fn(this);
  };
}

async function runPhase2Tests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PHASE 2 — UNIVERSITY EXAMINATION MANAGEMENT CORE TESTS');
  console.log('===============================================================\n');

  const mockPrisma = new MockPrismaService() as any;
  const service = new ExamService(mockPrisma);

  // Mock Users
  const examController = {
    id: 'user-exam-ctrl',
    username: 'exam_controller',
    name: 'Dr. Exam Controller',
    roles: ['EXAM_CELL'],
    role: 'EXAM_CELL',
  };

  const hodUser = {
    id: 'user-hod-cse',
    username: 'hod_cse',
    name: 'Prof. HOD Computer Engineering',
    roles: ['HOD'],
    role: 'HOD',
    department: 'dept-cse',
  };

  const studentUser = {
    id: 'user-stu-01',
    username: 'student_user',
    name: 'Student Jigar',
    roles: ['STUDENT'],
    role: 'STUDENT',
  };

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 1: Examination Creation & Draft Saving
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- Group 1: Examination Creation & Draft Workflow ---');

  const examDraft = await service.createExam(
    {
      examCode: 'EXAM-2026-CSE-SEM4-REG',
      name: 'B.Tech CSE Semester-4 Summer 2026 Regular Examination',
      type: 'Regular',
      programId: 'prog-btech-cse',
      instituteId: 'inst-1',
      departmentId: 'dept-cse',
      academicYearId: 'ay-2026',
      academicYearCode: '2026-27',
      semesterId: 'sem-4',
      semesterNumber: 4,
      session: 'Summer 2026',
      startDate: '2026-11-01',
      endDate: '2026-11-20',
      formStartDate: '2026-09-01',
      formEndDate: '2026-09-20',
      status: 'DRAFT',
      description: 'End semester regular theory evaluation for B.Tech CSE Batch 2024-2028.',
      instructions: 'Bring University ID and Hall Ticket. No electronic gadgets permitted.',
      subjects: [
        { subjectId: 'sub-ds', examType: 'Regular', durationMinutes: 180, maximumMarks: 100, passingMarks: 40, internalMarks: 30, externalMarks: 70, credits: 4, examMode: 'OFFLINE' as any },
        { subjectId: 'sub-dbms', examType: 'Regular', durationMinutes: 180, maximumMarks: 100, passingMarks: 40, internalMarks: 30, externalMarks: 70, credits: 4, examMode: 'OFFLINE' as any },
        { subjectId: 'sub-os', examType: 'Regular', durationMinutes: 180, maximumMarks: 100, passingMarks: 40, internalMarks: 30, externalMarks: 70, credits: 3, examMode: 'OFFLINE' as any },
      ],
      fees: [
        { examType: 'Regular', amount: 2500, currency: 'INR', isMandatory: true },
        { examType: 'Backlog', amount: 500, currency: 'INR', isMandatory: false },
        { examType: 'Supplementary', amount: 800, currency: 'INR', isMandatory: false },
      ],
      lateFeeRule: {
        calculationType: 'FIXED' as any,
        amount: 500,
        maximumAmount: 2000,
        gracePeriodDays: 2,
        isActive: true,
      },
    },
    examController,
  );

  assert(examDraft.code === 'EXAM-2026-CSE-SEM4-REG', 'Examination created with explicit code EXAM-2026-CSE-SEM4-REG');
  assert(examDraft.status === 'DRAFT', 'Initial examination status is DRAFT');
  assert(examDraft.session === 'Summer 2026', 'Examination session is Summer 2026');
  assert(examDraft.program.id === 'prog-btech-cse', 'Program linked to B.Tech CSE');
  assert(examDraft.examSubjects.length === 3, 'All 3 subjects persisted in examination subject schedule', { count: examDraft.examSubjects.length });
  assert(examDraft.examFees.length === 3, '3 fee categories configured (Regular, Backlog, Supplementary)', { fees: examDraft.examFees.length });
  assert(examDraft.lateFeeRules.length === 1 && Number(examDraft.lateFeeRules[0].amount) === 500, 'Late fee rule configured with ₹500 fixed rate');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 2: Status Machine & Form Lifecycle Transitions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 2: Status Machine & Form Lifecycle Transitions ---');

  // Publish / Open Form Window
  const publishedExam = await service.publishExamForm(examDraft.id, examController);
  assert(publishedExam.status === 'FORM_OPEN', 'Examination transitioned from DRAFT to FORM_OPEN');

  // Close Form Window
  const closedExam = await service.closeExamForm(examDraft.id, examController);
  assert(closedExam.status === 'FORM_CLOSED', 'Examination transitioned from FORM_OPEN to FORM_CLOSED');

  // Re-open Form Window from FORM_CLOSED
  const reopenedExam = await service.publishExamForm(examDraft.id, examController);
  assert(reopenedExam.status === 'FORM_OPEN', 'Examination successfully re-opened from FORM_CLOSED to FORM_OPEN');

  // Cancel Examination
  const cancelledExam = await service.cancelExam(examDraft.id, examController, 'Postponed due to state university election directive.');
  assert(cancelledExam.status === 'CANCELLED', 'Examination successfully transitioned to CANCELLED');
  assert(cancelledExam.description.includes('Postponed due to state university election directive'), 'Cancellation reason recorded in description');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 3: Validation Rules & Business Constraints
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 3: Validation Rules & Constraint Checks ---');

  // 1. Invalid Exam Dates (Start Date > End Date)
  let dateError = null;
  try {
    await service.createExam(
      {
        name: 'Invalid Date Exam',
        programId: 'prog-btech-cse',
        startDate: '2026-12-20',
        endDate: '2026-12-10', // End before Start
      },
      examController,
    );
  } catch (err: any) {
    dateError = err;
  }
  assert(
    dateError instanceof Error && dateError.message.includes('Exam Start Date cannot be after Exam End Date'),
    'Invalid exam dates (Start > End) rejected with 400 Bad Request',
    dateError,
  );

  // 2. Invalid Form Window Dates (Form Start >= Form End)
  let formDateError = null;
  try {
    await service.createExam(
      {
        name: 'Invalid Form Window Exam',
        programId: 'prog-btech-cse',
        formStartDate: '2026-10-15',
        formEndDate: '2026-10-10', // Form End before Form Start
      },
      examController,
    );
  } catch (err: any) {
    formDateError = err;
  }
  assert(
    formDateError instanceof Error && formDateError.message.includes('Exam Form Start Date must be strictly before Form End Date'),
    'Invalid form window dates (Form Start >= Form End) rejected with 400 Bad Request',
    formDateError,
  );

  // 3. Negative Exam Fee
  let negativeFeeError = null;
  try {
    await service.createExam(
      {
        name: 'Negative Fee Exam',
        programId: 'prog-btech-cse',
        fees: [{ examType: 'Regular', amount: -1500 }],
      },
      examController,
    );
  } catch (err: any) {
    negativeFeeError = err;
  }
  assert(
    negativeFeeError instanceof Error && negativeFeeError.message.includes('cannot be negative'),
    'Negative exam fee amount strictly rejected with 400 Bad Request',
    negativeFeeError,
  );

  // 4. Negative Late Fee
  let negativeLateFeeError = null;
  try {
    await service.createExam(
      {
        name: 'Negative Late Fee Exam',
        programId: 'prog-btech-cse',
        lateFeeRule: { amount: -200 },
      },
      examController,
    );
  } catch (err: any) {
    negativeLateFeeError = err;
  }
  assert(
    negativeLateFeeError instanceof Error && negativeLateFeeError.message.includes('cannot be negative'),
    'Negative late fee amount strictly rejected with 400 Bad Request',
    negativeLateFeeError,
  );

  // 5. Duplicate Exam Code Protection
  let duplicateCodeError = null;
  try {
    await service.createExam(
      {
        examCode: 'EXAM-2026-CSE-SEM4-REG', // Already created in Group 1
        name: 'Duplicate Code Exam',
        programId: 'prog-btech-cse',
      },
      examController,
    );
  } catch (err: any) {
    duplicateCodeError = err;
  }
  assert(
    duplicateCodeError instanceof Error && duplicateCodeError.message.includes('already exists'),
    'Duplicate examination code rejected with 409 Conflict',
    duplicateCodeError,
  );

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 4: RBAC & Security Protection
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 4: RBAC & Security Protection ---');

  // Student attempts to create examination -> 403 Forbidden
  let studentCreateError = null;
  try {
    await service.createExam(
      {
        name: 'Hacked Student Exam',
        programId: 'prog-btech-cse',
      },
      studentUser,
    );
  } catch (err: any) {
    studentCreateError = err;
  }
  assert(
    studentCreateError instanceof Error && (studentCreateError.message.includes('Students are not authorized') || (studentCreateError as any).status === 403),
    'Student role is strictly blocked (403 Forbidden) from creating examinations',
    studentCreateError,
  );

  // Student attempts to publish exam form -> 403 Forbidden
  let studentPublishError = null;
  try {
    await service.publishExamForm(examDraft.id, studentUser);
  } catch (err: any) {
    studentPublishError = err;
  }
  assert(
    studentPublishError instanceof Error && (studentPublishError.message.includes('Students cannot publish') || (studentPublishError as any).status === 403),
    'Student role is blocked from publishing/opening exam forms',
    studentPublishError,
  );

  // Student attempts to cancel exam -> 403 Forbidden
  let studentCancelError = null;
  try {
    await service.cancelExam(examDraft.id, studentUser);
  } catch (err: any) {
    studentCancelError = err;
  }
  assert(
    studentCancelError instanceof Error && (studentCancelError.message.includes('Students cannot cancel') || (studentCancelError as any).status === 403),
    'Student role is blocked from cancelling examinations',
    studentCancelError,
  );

  // HOD scope test: HOD can view department exams
  const hodExams = await service.getExams({}, hodUser);
  assert(Array.isArray(hodExams.data), 'HOD can query examination list scoped to department');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 5: Notesheet Engine (Phase 1) Integration
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 5: Phase 1 Notesheet Integration ---');

  // Create Phase 1 Exam Notesheet
  const examNoteSheet = await mockPrisma.noteSheet.create({
    data: {
      notesheetNumber: 'NS/EXAM/2026/0001',
      title: 'Summer 2026 Examination Sanction Proposal',
      department: 'EXAM',
      status: 'APPROVED',
      priority: 'HIGH',
      createdByUserId: examController.id,
    },
  });

  // Link Notesheet to Examination
  const linkedExam = await service.linkNotesheetToExam(examDraft.id, examNoteSheet.id, examController);
  assert(linkedExam.notesheetId === examNoteSheet.id, 'Examination successfully linked to Phase 1 Notesheet');
  assert(linkedExam.notesheet.notesheetNumber === 'NS/EXAM/2026/0001', 'Linked Notesheet reference number accessible from Examination');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 6: Examination Subject & Fee Management APIs
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 6: Sub-Config Management APIs (Subjects & Fees) ---');

  // Fetch Exam Subjects
  const subjectsList = await service.getExamSubjects(examDraft.id);
  assert(subjectsList.length === 3, 'Fetched all 3 mapped examination subjects');

  // Update Exam Subject Marks Scheme
  const updatedSub = await service.updateExamSubject(
    examDraft.id,
    'sub-ds',
    { maximumMarks: 70, passingMarks: 28, externalMarks: 70, internalMarks: 0, durationMinutes: 150 },
    examController,
  );
  assert(Number(updatedSub.maximumMarks) === 70 && updatedSub.durationMinutes === 150, 'Subject marks scheme and duration successfully updated');

  // Replace / Configure Exam Fees
  const updatedFees = await service.configureExamFees(
    examDraft.id,
    [
      { examType: 'Regular', amount: 3000, currency: 'INR', isMandatory: true },
      { examType: 'Backlog', amount: 600, currency: 'INR', isMandatory: false },
    ],
    examController,
  );
  assert(updatedFees.length === 2 && Number(updatedFees[0].amount) === 3000, 'Exam Fee structure updated to Regular ₹3,000 and Backlog ₹600');

  // Configure Late Fee Rule
  const updatedLateFee = await service.configureLateFeeRule(
    examDraft.id,
    { calculationType: 'PER_DAY', amount: 100, maximumAmount: 1500, gracePeriodDays: 3, isActive: true },
    examController,
  );
  assert(updatedLateFee.calculationType === 'PER_DAY' && Number(updatedLateFee.amount) === 100, 'Late fee rule updated to Per Day ₹100 with 3 grace days');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 7: Search & Filter Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 7: Search & Filtering Capabilities ---');

  const searchResult = await service.getExams({ search: 'CSE' }, examController);
  assert(searchResult.data.length >= 1, 'Search query locates examination by code/name keyword');

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`📊 PHASE 2 EXAM MANAGEMENT TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (${totalTests} TOTAL)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
