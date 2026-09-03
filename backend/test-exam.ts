import { Test, TestingModule } from '@nestjs/testing';
import { ExamService, computeGrade } from './src/exam/exam.service';
import { PrismaService } from './src/prisma/prisma.service';
import { ExamController } from './src/exam/exam.controller';
import {
  ExamStatusEnum,
  ExamTypeCodeEnum,
} from './src/exam/dto/exam.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

async function runExamTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE EXAMINATION & RESULTS TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    examTypes: new Map<string, any>(),
    exams: new Map<string, any>(),
    programs: new Map<string, any>(),
    semesters: new Map<string, any>(),
    subjects: new Map<string, any>(),
    students: new Map<string, any>(),
    formWindows: new Map<string, any>(),
    examForms: new Map<string, any>(),
    schedules: new Map<string, any>(),
    rooms: new Map<string, any>(),
    roomAllocations: new Map<string, any>(),
    results: new Map<string, any>(),
    summaries: new Map<string, any>(),
    revaluations: new Map<string, any>(),
    users: new Map<string, any>(),
    facultySubjectMappings: new Map<string, any>(),
  };

  // Seed default data
  store.programs.set('prog-cse', { id: 'prog-cse', code: 'BTECH_CSE', name: 'B.Tech Computer Science & Engineering' });
  store.semesters.set('sem-4', { id: 'sem-4', semesterNumber: 4, name: 'Semester 4' });
  store.subjects.set('sub-dbms', { id: 'sub-dbms', code: 'CS401', name: 'Database Management Systems', credits: 4 });
  store.subjects.set('sub-os', { id: 'sub-os', code: 'CS402', name: 'Operating Systems', credits: 4 });
  store.subjects.set('sub-dsa', { id: 'sub-dsa', code: 'CS403', name: 'Design and Analysis of Algorithms', credits: 3 });

  store.students.set('stu-01', {
    id: 'stu-01',
    erpId: 'STU000001',
    enrollmentNo: 'SSIU2024CSE001',
    firstName: 'Aarav',
    lastName: 'Patel',
    departmentId: 'dept-cse',
    batchId: 'batch-2024',
    batch: { program: { id: 'prog-cse', name: 'B.Tech CSE' } },
    department: { name: 'Computer Science' },
  });

  store.students.set('stu-02', {
    id: 'stu-02',
    erpId: 'STU000002',
    enrollmentNo: 'SSIU2024CSE002',
    firstName: 'Diya',
    lastName: 'Shah',
    departmentId: 'dept-cse',
    batchId: 'batch-2024',
    batch: { program: { id: 'prog-cse', name: 'B.Tech CSE' } },
    department: { name: 'Computer Science' },
  });

  store.rooms.set('room-101', { id: 'room-101', roomNumber: 'ROOM-101', capacity: 2, centre: { name: 'Main Centre' } });
  store.rooms.set('room-102', { id: 'room-102', roomNumber: 'ROOM-102', capacity: 2, centre: { name: 'Main Centre' } });

  const mockPrismaService = {
    examType: {
      create: async ({ data }: any) => {
        const id = 'et-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, status: 'ACTIVE' };
        store.examTypes.set(id, record);
        store.examTypes.set(data.code, record);
        return record;
      },
      findUnique: async ({ where }: any) => store.examTypes.get(where.code) || store.examTypes.get(where.id),
      findFirst: async ({ where }: any) => Array.from(store.examTypes.values()).find((e) => e.status === 'ACTIVE'),
      findMany: async () => Array.from(store.examTypes.values()),
    },
    program: {
      findUnique: async ({ where }: any) => store.programs.get(where.id),
    },
    semester: {
      findUnique: async ({ where }: any) => store.semesters.get(where.id),
      findFirst: async ({ where }: any) => Array.from(store.semesters.values()).find((s) => s.semesterNumber === where?.semesterNumber) || Array.from(store.semesters.values())[0],
    },
    subject: {
      findUnique: async ({ where }: any) => store.subjects.get(where.id),
    },
    student: {
      findUnique: async ({ where }: any) => store.students.get(where.id),
    },
    user: {
      findUnique: async ({ where }: any) => store.users.get(where.id),
    },
    facultySubjectMapping: {
      findFirst: async ({ where }: any) => {
        return Array.from(store.facultySubjectMappings.values()).find(
          (m) => m.facultyId === where.facultyId && m.subjectId === where.subjectId
        );
      },
    },
    exam: {
      create: async ({ data }: any) => {
        const id = 'exam-' + Math.random().toString(36).substr(2, 7);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date(), examForms: [] };
        store.exams.set(id, record);
        store.exams.set(data.code, record);
        return { ...record, examType: { name: 'Regular Exam' }, program: { name: 'B.Tech CSE' } };
      },
      update: async ({ where, data }: any) => {
        const existing = store.exams.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.exams.set(where.id, updated);
        return updated;
      },
      findUnique: async ({ where }: any) => {
        const found = store.exams.get(where.id);
        if (!found) return null;
        const forms = Array.from(store.examForms.values()).filter((f) => f.examId === where.id);
        const schedules = Array.from(store.schedules.values()).filter((s) => s.examId === where.id);
        return {
          ...found,
          examType: { name: 'Regular' },
          program: store.programs.get(found.programId),
          formWindows: Array.from(store.formWindows.values()).filter((w) => w.examId === where.id),
          examForms: forms.map((f) => ({ ...f, student: store.students.get(f.studentId) })),
          schedules: schedules.map((s) => ({ ...s, subject: store.subjects.get(s.subjectId), semester: store.semesters.get(s.semesterId) })),
          _count: { examForms: forms.length, schedules: schedules.length },
        };
      },
      findMany: async () => Array.from(store.exams.values()).map((e) => ({
        ...e,
        examType: { name: 'Regular' },
        program: store.programs.get(e.programId),
        _count: { examForms: 2, schedules: 2 },
      })),
      count: async () => store.exams.size,
    },
    examFormWindow: {
      create: async ({ data }: any) => {
        const id = 'efw-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data };
        store.formWindows.set(id, record);
        return record;
      },
      findMany: async () => Array.from(store.formWindows.values()),
    },
    examForm: {
      create: async ({ data }: any) => {
        const id = 'ef-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data };
        store.examForms.set(id, record);
        return record;
      },
      upsert: async ({ where, create, update }: any) => {
        const existingKey = Object.values(where)[0] as any;
        const existing = Array.from(store.examForms.values()).find(
          (f) => f.examId === (existingKey?.examId || create.examId) && f.studentId === (existingKey?.studentId || create.studentId)
        );
        if (existing) {
          const updated = { ...existing, ...update };
          store.examForms.set(existing.id, updated);
          return updated;
        }
        const id = 'ef-' + Math.random().toString(36).substr(2, 6);
        const created = { id, ...create };
        store.examForms.set(id, created);
        return created;
      },
      findUnique: async ({ where }: any) => {
        const found = store.examForms.get(where.id);
        if (!found) return null;
        return {
          ...found,
          student: store.students.get(found.studentId),
          exam: store.exams.get(found.examId),
        };
      },
      findMany: async ({ where }: any) => {
        let forms = Array.from(store.examForms.values());
        if (where?.examId) forms = forms.filter((f) => f.examId === where.examId);
        if (where?.status) forms = forms.filter((f) => f.status === where.status);
        return forms.map((f) => ({
          ...f,
          student: store.students.get(f.studentId),
          exam: store.exams.get(f.examId),
          results: Array.from(store.results.values()).filter((r) => r.examFormId === f.id).map((r) => ({
            ...r,
            subject: store.subjects.get(r.subjectId),
          })),
        }));
      },
      update: async ({ where, data }: any) => {
        const existing = store.examForms.get(where.id);
        const updated = { ...existing, ...data };
        store.examForms.set(where.id, updated);
        return updated;
      },
      count: async () => store.examForms.size,
    },
    examSchedule: {
      create: async ({ data }: any) => {
        const id = 'es-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data };
        store.schedules.set(id, record);
        return { ...record, subject: store.subjects.get(data.subjectId), semester: store.semesters.get(data.semesterId) };
      },
      upsert: async ({ where, create, update }: any) => {
        const key = `${create.examId}_${create.subjectId}`;
        const existing = Array.from(store.schedules.values()).find((s) => s.examId === create.examId && s.subjectId === create.subjectId);
        if (existing) {
          const updated = { ...existing, ...update };
          store.schedules.set(existing.id, updated);
          return updated;
        }
        const id = 'es-' + Math.random().toString(36).substr(2, 6);
        const created = { id, ...create };
        store.schedules.set(id, created);
        return created;
      },
      findUnique: async ({ where }: any) => {
        const found = store.schedules.get(where.id);
        if (!found) return null;
        const examForms = Array.from(store.examForms.values()).filter((f) => f.examId === found.examId);
        return {
          ...found,
          exam: {
            ...store.exams.get(found.examId),
            examForms: examForms.map((f) => ({ ...f, student: store.students.get(f.studentId) })),
          },
          subject: store.subjects.get(found.subjectId),
        };
      },
      findMany: async ({ where }: any) => {
        return Array.from(store.schedules.values())
          .filter((s) => s.examId === where?.examId)
          .map((s) => ({ ...s, subject: store.subjects.get(s.subjectId), semester: store.semesters.get(s.semesterId) }));
      },
    },
    examRoom: {
      findMany: async ({ where }: any) => {
        if (where?.id?.in) {
          return where.id.in.map((id: string) => store.rooms.get(id)).filter(Boolean);
        }
        return Array.from(store.rooms.values());
      },
    },
    examRoomAllocation: {
      create: async ({ data }: any) => {
        const id = 'era-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data };
        store.roomAllocations.set(id, record);
        return record;
      },
      deleteMany: async ({ where }: any) => {
        for (const [id, r] of store.roomAllocations.entries()) {
          if (r.examScheduleId === where.examScheduleId) store.roomAllocations.delete(id);
        }
        return { count: 1 };
      },
      findMany: async ({ where }: any) => {
        return Array.from(store.roomAllocations.values())
          .filter((r) => r.examScheduleId === where.examScheduleId)
          .map((r) => ({ ...r, room: store.rooms.get(r.roomId), student: store.students.get(r.studentId) }));
      },
    },
    examResult: {
      upsert: async ({ where, create, update }: any) => {
        const existingKey = Object.values(where)[0] as any;
        const existing = Array.from(store.results.values()).find(
          (r) => r.examFormId === (existingKey?.examFormId || create.examFormId) && r.subjectId === (existingKey?.subjectId || create.subjectId)
        );
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          store.results.set(existing.id, updated);
          return updated;
        }
        const id = 'er-' + Math.random().toString(36).substr(2, 6);
        const created = { id, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.results.set(id, created);
        return created;
      },
      findUnique: async ({ where }: any) => {
        const found = store.results.get(where.id);
        if (!found) return null;
        return {
          ...found,
          examForm: store.examForms.get(found.examFormId),
        };
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.results.values());
        if (where?.studentId) list = list.filter((r) => r.studentId === where.studentId);
        if (where?.resultStatus) list = list.filter((r) => r.resultStatus === where.resultStatus);
        if (where?.examFormId) list = list.filter((r) => r.examFormId === where.examFormId);
        if (where?.examForm?.examId) {
          list = list.filter((r) => {
            const f = store.examForms.get(r.examFormId);
            return f && f.examId === where.examForm.examId;
          });
        }
        return list.map((r) => ({
          ...r,
          subject: store.subjects.get(r.subjectId),
          examForm: { exam: store.exams.get(store.examForms.get(r.examFormId)?.examId) },
        }));
      },
      update: async ({ where, data }: any) => {
        const existing = store.results.get(where.id);
        const updated = { ...existing, ...data };
        store.results.set(where.id, updated);
        return updated;
      },
      updateMany: async ({ where, data }: any) => {
        for (const [id, r] of store.results.entries()) {
          const form = store.examForms.get(r.examFormId);
          if (where?.examForm?.examId && form?.examId === where.examForm.examId) {
            store.results.set(id, { ...r, ...data });
          }
        }
        return { count: store.results.size };
      },
      count: async () => store.results.size,
    },
    resultSummary: {
      upsert: async ({ where, create, update }: any) => {
        const existingKey = Object.values(where)[0] as any;
        const existing = Array.from(store.summaries.values()).find(
          (s) => s.studentId === (existingKey?.studentId || create.studentId) && s.examId === (existingKey?.examId || create.examId)
        );
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          store.summaries.set(existing.id, updated);
          return updated;
        }
        const id = 'rs-' + Math.random().toString(36).substr(2, 6);
        const created = { id, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.summaries.set(id, created);
        return created;
      },
      updateMany: async ({ where, data }: any) => {
        for (const [id, s] of store.summaries.entries()) {
          if ((!where.studentId || s.studentId === where.studentId) && (!where.examId || s.examId === where.examId)) {
            store.summaries.set(id, { ...s, ...data });
          }
        }
        return { count: store.summaries.size };
      },
      findMany: async ({ where, orderBy, take }: any) => {
        let list = Array.from(store.summaries.values());
        if (where?.examId) list = list.filter((s) => s.examId === where.examId);
        if (where?.studentId) list = list.filter((s) => s.studentId === where.studentId);
        if (where?.isPublished !== undefined) list = list.filter((s) => s.isPublished === where.isPublished);
        if (where?.resultStatus) list = list.filter((s) => s.resultStatus === where.resultStatus);
        if (orderBy?.[0]?.sgpa === 'desc') {
          list.sort((a, b) => (b.sgpa || 0) - (a.sgpa || 0));
        }
        if (take) list = list.slice(0, take);
        return list.map((s) => ({ ...s, student: store.students.get(s.studentId) }));
      },
    },
    revaluationRequest: {
      create: async ({ data }: any) => {
        const id = 'rr-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data };
        store.revaluations.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => store.revaluations.get(where.id),
      update: async ({ where, data }: any) => {
        const existing = store.revaluations.get(where.id);
        const updated = { ...existing, ...data };
        store.revaluations.set(where.id, updated);
        return updated;
      },
      findMany: async () => Array.from(store.revaluations.values()).map((r) => ({ ...r, student: store.students.get(r.studentId) })),
    },
    hallTicket: {
      count: async () => 2,
    },
    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ExamService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<ExamService>(ExamService);
  const controller = new ExamController(service);

  // Users
  const examControllerUser = { id: 'usr-ec-01', role: 'EXAM_CELL', authorityLevel: 3 };
  const adminUser = { id: 'usr-admin-01', role: 'SUPER_ADMIN', authorityLevel: 1 };
  const facultyUser = { id: 'usr-fac-01', role: 'FACULTY', authorityLevel: 5, faculty: { id: 'fac-01', departmentId: 'dept-cse' } };
  const studentUser1 = { id: 'usr-stu-01', role: 'STUDENT', authorityLevel: 10, student: { id: 'stu-01' } };
  const studentUser2 = { id: 'usr-stu-02', role: 'STUDENT', authorityLevel: 10, student: { id: 'stu-02' } };

  store.users.set('usr-fac-01', { id: 'usr-fac-01', faculty: { id: 'fac-01', departmentId: 'dept-cse' } });
  store.users.set('usr-stu-01', { id: 'usr-stu-01', student: { id: 'stu-01' } });
  store.users.set('usr-stu-02', { id: 'usr-stu-02', student: { id: 'stu-02' } });

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // ── TEST 1: Grade Calculator Logic ───────────────────────────────────────
  console.log('--- 1. Grade & Points Calculation Engine ---');
  const gradeO = computeGrade(95);
  assert('Grade for >= 90 is O (10 points)', gradeO.grade === 'O' && gradeO.gradePoints === 10);
  const gradeA = computeGrade(75);
  assert('Grade for 75 is A (8 points)', gradeA.grade === 'A' && gradeA.gradePoints === 8);
  const gradeF = computeGrade(35);
  assert('Grade for 35 is F (0 points)', gradeF.grade === 'F' && gradeF.gradePoints === 0);
  const gradeAB = computeGrade(0, true);
  assert('Grade for Absent is AB (0 points)', gradeAB.grade === 'AB' && gradeAB.gradePoints === 0);

  // ── TEST 2: Create Exam Type & Examination Session ───────────────────────
  console.log('\n--- 2. Create Exam Type & Exam Session (DRAFT) ---');
  const examType = await service.createExamType({
    code: 'REGULAR_SEM',
    name: 'Regular Semester Examination',
  });
  assert('Exam Type created', examType.code === 'REGULAR_SEM');

  const exam = await service.createExam({
    code: 'EXAM-BTECH-CSE-SEM4-2026',
    name: 'B.Tech CSE Semester-4 End-Sem Exam 2026',
    programId: 'prog-cse',
    examTypeId: examType.id,
    academicYearCode: '2026-27',
    semesterNumber: 4,
    startDate: '2026-11-01',
    endDate: '2026-11-15',
    baseFee: 400,
  }, adminUser.id);

  assert('Exam created in DRAFT status', exam.status === ExamStatusEnum.DRAFT);
  assert('Exam has generated code and program binding', exam.code === 'EXAM-BTECH-CSE-SEM4-2026');

  // ── TEST 3: Subject Mapping ──────────────────────────────────────────────
  console.log('\n--- 3. Subject Mapping ---');
  const mappedSubjects = await service.mapSubjectsToExam(exam.id, ['sub-dbms', 'sub-os', 'sub-dsa'], 'sem-4');
  assert('Mapped 3 subjects to exam', mappedSubjects.count === 3);

  // ── TEST 4: Student Enrollment & Forms ────────────────────────────────────
  console.log('\n--- 4. Student Enrollment & Exam Registration ---');
  const enrolled = await service.enrollStudentsToExam(exam.id, ['stu-01', 'stu-02']);
  assert('Enrolled 2 students with approved exam forms', enrolled.count === 2);

  // ── TEST 5: Exam Schedule Timetable ──────────────────────────────────────
  console.log('\n--- 5. Exam Schedules & Room Allocations ---');
  const scheduleDbms = await service.createSchedule({
    examId: exam.id,
    subjectId: 'sub-dbms',
    semesterId: 'sem-4',
    examDate: '2026-11-02',
    startTime: '10:00',
    endTime: '13:00',
    venue: 'Academic Block A',
  });
  assert('Schedule created for CS401 DBMS', scheduleDbms.startTime === '10:00');

  // ── TEST 6: Room Allocations ─────────────────────────────────────────────
  const allocationResult = await service.allocateRooms({
    examScheduleId: scheduleDbms.id,
    roomIds: ['room-101', 'room-102'],
    seatPrefix: 'SEAT',
  });
  assert('Allocated seats for enrolled students across rooms', allocationResult.totalAllocated === 2);

  const seating = await service.getRoomAllocations(scheduleDbms.id);
  assert('Seating arrangement generated with seat numbers', seating.length === 2 && seating[0].seatNumber.includes('ROOM-101'));

  // ── TEST 7: Marks Entry (Internal, External, Practical) ───────────────────
  console.log('\n--- 7. Internal & External Marks Entry ---');
  const forms = await service.getExamForms(exam.id);
  const form1 = forms.find((f) => f.studentId === 'stu-01')!;
  const form2 = forms.find((f) => f.studentId === 'stu-02')!;

  // Student 1: DBMS -> Internal 28/30, External 62/70 -> Total 90 (Grade O)
  const res1_dbms = await service.enterMarks(facultyUser, {
    examFormId: form1.id,
    subjectId: 'sub-dbms',
    internalMarks: 28,
    maxInternalMarks: 30,
    externalMarks: 62,
    maxExternalMarks: 70,
  });
  assert('Marks entry auto-calculates total and grade O', Number(res1_dbms.marksObtained) === 90 && res1_dbms.grade === 'O');

  // Student 1: OS -> Internal 24/30, External 52/70 -> Total 76 (Grade A)
  await service.enterMarks(facultyUser, {
    examFormId: form1.id,
    subjectId: 'sub-os',
    internalMarks: 24,
    externalMarks: 52,
  });

  // Student 2: DBMS -> Internal 12/30, External 20/70 -> Total 32 (Grade F, Backlog)
  const res2_dbms = await service.enterMarks(facultyUser, {
    examFormId: form2.id,
    subjectId: 'sub-dbms',
    internalMarks: 12,
    externalMarks: 20,
  });
  assert('Failed student gets Grade F and isPassed = false', res2_dbms.grade === 'F' && res2_dbms.isPassed === false);

  // ── TEST 8: Evaluation & SGPA/CGPA Calculation ───────────────────────────
  console.log('\n--- 8. Result Evaluation Engine (SGPA/CGPA) ---');
  const evalResult = await service.evaluateExamResults(examControllerUser, exam.id);
  assert('Evaluation calculates summaries for all students', evalResult.totalStudentsEvaluated === 2);

  const student1Summary = evalResult.summaries.find((s) => s.studentId === 'stu-01')!;
  assert('Student 1 passes all subjects and gets SGPA >= 8.5', student1Summary.resultStatus === 'PASS' && Number(student1Summary.sgpa) >= 8.5);

  const student2Summary = evalResult.summaries.find((s) => s.studentId === 'stu-02')!;
  assert('Student 2 has 1 backlog and ATKT status', student2Summary.backlogsCount === 1 && student2Summary.resultStatus === 'ATKT');

  // ── TEST 9: Result Approval (EVALUATION -> APPROVAL) ─────────────────────
  console.log('\n--- 9. Result Approval Workflow ---');
  const approvalRes = await service.approveExamResults(examControllerUser, exam.id);
  assert('Results approved by Exam Controller', approvalRes.examId === exam.id);

  // ── TEST 10: Result Publication & Marksheet Generation ───────────────────
  console.log('\n--- 10. Result Publication ---');
  const publishRes = await service.publishExamResults(examControllerUser, exam.id);
  assert('Results published successfully', !!publishRes.publishedAt);

  // ── TEST 11: Student Privacy & Access Checks ─────────────────────────────
  console.log('\n--- 11. Student Portal Access & RBAC Rules ---');
  const studentResults = await service.getStudentResults(studentUser1);
  assert('Student can view own published results', studentResults.results.length >= 2);
  assert('Student results contain marks and grades', studentResults.results.some((r) => r.subject.code === 'CS401'));

  // ── TEST 12: Result Correction Workflow with Reason ──────────────────────
  console.log('\n--- 12. Result Correction Workflow ---');
  const corrected = await service.correctResult(examControllerUser, res2_dbms.id, {
    revisedMarks: 45,
    revisedExternalMarks: 33,
    correctionReason: 'Re-totaling discrepancy corrected after verification',
  });
  assert('Result marks corrected to 45 (Grade C)', Number(corrected.marksObtained) === 45 && corrected.grade === 'C');
  assert('Correction reason recorded in audit log', corrected.correctionReason.includes('Re-totaling'));

  // ── TEST 13: Statistical Reports & Analytics ────────────────────────────
  console.log('\n--- 13. Examination Reports & Analytics ---');
  const summaryReport = await service.getExamSummaryReport(exam.id);
  assert('Summary report contains total and passed counts', summaryReport.totalStudents === 2 && summaryReport.passed >= 1);

  const toppers = await service.getExamToppersReport(exam.id, 5);
  assert('Toppers report returns ranked students', toppers.length >= 1 && toppers[0].studentId === 'stu-01');

  const subjectAnalysis = await service.getSubjectAnalysisReport(exam.id);
  assert('Subject analysis calculates pass percentage and average marks', subjectAnalysis.length >= 1 && 'averageMarks' in subjectAnalysis[0]);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runExamTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
