import { Test, TestingModule } from '@nestjs/testing';
import { WorkManagementService } from './src/work-management/work-management.service';
import { PrismaService } from './src/prisma/prisma.service';
import { WorkManagementController } from './src/work-management/work-management.controller';
import {
  WorkDiaryStatusEnum,
  WorkDiaryCategoryEnum,
  WorkDiaryPriorityEnum,
} from './src/work-management/dto/work-diary.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

async function runWorkDiaryTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE WORK DIARY BACKEND TEST SUITE');
  console.log('====================================================\n');

  // In-memory mock database
  const diariesStore = new Map<string, any>();
  const historyStore: any[] = [];

  const mockPrismaService = {
    workDiary: {
      create: async ({ data, include }: any) => {
        const id = 'wd-' + Math.random().toString(36).substr(2, 9);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        diariesStore.set(id, record);
        return {
          ...record,
          user: { id: record.userId, username: 'prof_sharma', faculty: { firstName: 'Ramesh', lastName: 'Sharma' } },
          history: [],
        };
      },
      update: async ({ where, data }: any) => {
        const existing = diariesStore.get(where.id);
        if (!existing) throw new Error('Record not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        diariesStore.set(where.id, updated);
        return {
          ...updated,
          user: { id: updated.userId, username: 'prof_sharma', faculty: { firstName: 'Ramesh', lastName: 'Sharma' } },
        };
      },
      findUnique: async ({ where }: any) => {
        const found = diariesStore.get(where.id);
        if (!found) return null;
        return {
          ...found,
          user: { id: found.userId, username: 'prof_sharma', faculty: { firstName: 'Ramesh', lastName: 'Sharma' } },
          history: historyStore.filter((h) => h.workDiaryId === where.id),
        };
      },
      findMany: async ({ where, skip, take }: any) => {
        let list = Array.from(diariesStore.values());
        if (where?.userId) list = list.filter((d) => d.userId === where.userId);
        if (where?.status) list = list.filter((d) => d.status === where.status);
        if (where?.departmentId) list = list.filter((d) => d.departmentId === where.departmentId);
        if (where?.instituteId) list = list.filter((d) => d.instituteId === where.instituteId);
        if (where?.category) list = list.filter((d) => d.category === where.category);
        if (where?.priority) list = list.filter((d) => d.priority === where.priority);
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((d) => ({
          ...d,
          user: { id: d.userId, username: 'prof_sharma', faculty: { firstName: 'Ramesh', lastName: 'Sharma' } },
          history: historyStore.filter((h) => h.workDiaryId === d.id),
        }));
      },
      count: async ({ where }: any) => {
        let list = Array.from(diariesStore.values());
        if (where?.userId) list = list.filter((d) => d.userId === where.userId);
        if (where?.status) list = list.filter((d) => d.status === where.status);
        if (where?.departmentId) list = list.filter((d) => d.departmentId === where.departmentId);
        return list.length;
      },
      delete: async ({ where }: any) => {
        diariesStore.delete(where.id);
        return { success: true };
      },
    },
    workDiaryHistory: {
      create: async ({ data }: any) => {
        const id = 'wdh-' + Math.random().toString(36).substr(2, 9);
        const record = { id, ...data, createdAt: new Date() };
        historyStore.push(record);
        return record;
      },
      findMany: async ({ where }: any) => {
        return historyStore.filter((h) => h.workDiaryId === where.workDiaryId);
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        return {
          id: where.id,
          username: 'faculty_user',
          faculty: { departmentId: 'dept-cse', instituteId: 'inst-sscit' },
        };
      },
    },
    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      WorkManagementService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<WorkManagementService>(WorkManagementService);
  const controller = new WorkManagementController(service);

  // Test Users
  const facultyUser = { id: 'user-fac-01', username: 'dr_ramesh', role: 'FACULTY', authorityLevel: 5, faculty: { departmentId: 'dept-cse', instituteId: 'inst-sscit' } };
  const mentorUser = { id: 'user-fac-02', username: 'dr_anita', role: 'FACULTY', authorityLevel: 5, faculty: { departmentId: 'dept-cse', instituteId: 'inst-sscit' } };
  const hodUser = { id: 'user-hod-01', username: 'hod_cse', role: 'HOD', authorityLevel: 4, faculty: { departmentId: 'dept-cse', instituteId: 'inst-sscit' } };
  const principalUser = { id: 'user-prin-01', username: 'principal_sscit', role: 'PRINCIPAL', authorityLevel: 2 };
  const studentUser = { id: 'user-stu-01', username: 'student_01', role: 'STUDENT', authorityLevel: 10 };
  const outsiderFaculty = { id: 'user-fac-99', username: 'outsider_fac', role: 'FACULTY', authorityLevel: 5, faculty: { departmentId: 'dept-mech', instituteId: 'inst-sscit' } };

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

  // ── TEST 1: Student Access Blocked ──────────────────────────────────────
  console.log('\n--- 1. RBAC & Role Restrictions ---');
  try {
    controller.createDiaryEntry({ user: studentUser }, {
      workTitle: 'Student Attempt',
      workDate: '2026-08-16',
    });
    assert('Student cannot create work diary', false, 'Should have thrown ForbiddenException');
  } catch (e: any) {
    assert('Student cannot create work diary', e instanceof ForbiddenException);
  }

  // ── TEST 2: Save Draft ──────────────────────────────────────────────────
  console.log('\n--- 2. Create Work Diary & Save Draft ---');
  const draftEntry = await service.saveDraft(facultyUser, {
    workTitle: 'Lecture Preparation - Unit 4 Advanced DBMS',
    description: 'Drafted slide decks and case studies for query optimization.',
    category: WorkDiaryCategoryEnum.ACADEMIC,
    workDate: '2026-08-16',
    startTime: '09:00',
    endTime: '11:00',
    priority: WorkDiaryPriorityEnum.NORMAL,
  });

  assert('Save Draft creates entry with DRAFT status', draftEntry.status === WorkDiaryStatusEnum.DRAFT);
  assert('Draft resolves departmentId automatically', draftEntry.departmentId === 'dept-cse');
  assert('Draft records initial history event', historyStore.some((h) => h.workDiaryId === draftEntry.id && h.action === 'SAVED_DRAFT'));

  // ── TEST 3: Update Work Diary ───────────────────────────────────────────
  console.log('\n--- 3. Update Work Diary & Ownership Check ---');
  const updatedEntry = await service.updateDiaryEntry(facultyUser, draftEntry.id, {
    workTitle: 'Lecture Preparation - Unit 4 & Unit 5 Advanced DBMS',
    remarks: 'Added indexing examples',
  });
  assert('Owner can update work diary details', updatedEntry.workTitle.includes('Unit 5'));

  try {
    await service.updateDiaryEntry(outsiderFaculty, draftEntry.id, { workTitle: 'Hacked Title' });
    assert('Outsider faculty cannot update someone else diary', false, 'Expected ForbiddenException');
  } catch (e: any) {
    assert('Outsider faculty cannot update someone else diary', e instanceof ForbiddenException);
  }

  // ── TEST 4: Submit Work Diary (DRAFT -> SUBMITTED) ──────────────────────
  console.log('\n--- 4. Submit Work Diary ---');
  const submittedEntry = await service.submitDiaryEntry(facultyUser, draftEntry.id, {
    submissionRemarks: 'Completed all preparation and lab tests.',
  });
  assert('Status transitions to SUBMITTED', submittedEntry.status === WorkDiaryStatusEnum.SUBMITTED);
  assert('History records SUBMITTED action', historyStore.some((h) => h.workDiaryId === draftEntry.id && h.action === 'SUBMITTED'));

  // ── TEST 5: Faculty Response / Review (SUBMITTED -> FACULTY_REVIEW / HOD_REVIEW)
  console.log('\n--- 5. Faculty Response & Review ---');
  const facultyReviewed = await service.facultyReview(mentorUser, draftEntry.id, {
    facultyComments: 'Verified syllabus coverage. Topics are well aligned with Bloom Taxonomy.',
    nextStatus: WorkDiaryStatusEnum.HOD_REVIEW,
  });
  assert('Faculty review advances status to HOD_REVIEW', facultyReviewed.status === WorkDiaryStatusEnum.HOD_REVIEW);
  assert('Faculty comments captured', facultyReviewed.facultyComments.includes('Bloom Taxonomy'));

  // ── TEST 6: HOD Review & Approval (HOD_REVIEW -> APPROVED) ─────────────
  console.log('\n--- 6. HOD Review & Approval ---');
  const hodReviewed = await service.hodReview(hodUser, draftEntry.id, {
    hodComments: 'Excellent work plan. Approved for departmental archive.',
    decision: WorkDiaryStatusEnum.APPROVED,
  });
  assert('HOD review approves work diary (APPROVED)', hodReviewed.status === WorkDiaryStatusEnum.APPROVED);
  assert('HOD comments captured', hodReviewed.hodComments.includes('Approved'));
  assert('History records APPROVED action', historyStore.some((h) => h.workDiaryId === draftEntry.id && h.action === 'APPROVED'));

  // ── TEST 7: Rejection Workflow ──────────────────────────────────────────
  console.log('\n--- 7. Rejection Workflow ---');
  const diaryToReject = await service.createDiaryEntry(facultyUser, {
    workTitle: 'Incomplete NAAC Report',
    workDate: '2026-08-16',
    status: WorkDiaryStatusEnum.SUBMITTED,
  });

  const rejectedEntry = await service.rejectDiaryEntry(hodUser, diaryToReject.id, {
    rejectionReason: 'Missing Criterion 2 feedback attachments. Please update.',
  });
  assert('Diary rejected status is REJECTED', rejectedEntry.status === WorkDiaryStatusEnum.REJECTED);
  assert('Rejection reason recorded', rejectedEntry.rejectionReason.includes('Missing Criterion 2'));

  // ── TEST 8: Full Chronological History ──────────────────────────────────
  console.log('\n--- 8. History Audit Trail ---');
  const history = await service.getDiaryHistory(facultyUser, draftEntry.id);
  assert('Chronological history returned for diary', history.length >= 4);
  const actions = history.map((h) => h.action);
  assert('History contains full lifecycle (SAVED_DRAFT -> UPDATED -> SUBMITTED -> FACULTY_REVIEWED -> APPROVED)',
    actions.includes('SAVED_DRAFT') &&
    actions.includes('SUBMITTED') &&
    actions.includes('FACULTY_REVIEWED') &&
    actions.includes('APPROVED')
  );

  // ── TEST 9: Querying, Pagination, Filtering & Search ────────────────────
  console.log('\n--- 9. Querying, Filtering, Pagination & Search ---');
  // Create additional mock entries
  await service.createDiaryEntry(facultyUser, {
    workTitle: 'NAAC Documentation Criteria 3',
    category: WorkDiaryCategoryEnum.NAAC,
    workDate: '2026-08-15',
    priority: WorkDiaryPriorityEnum.HIGH,
    status: WorkDiaryStatusEnum.APPROVED,
  });

  await service.createDiaryEntry(facultyUser, {
    workTitle: 'Mid-term Examination Duty & Paper Evaluation',
    category: WorkDiaryCategoryEnum.EXAMINATION,
    workDate: '2026-08-14',
    priority: WorkDiaryPriorityEnum.URGENT,
    status: WorkDiaryStatusEnum.SUBMITTED,
  });

  const allDiariesResult = await service.getDiaryEntries(facultyUser, { page: 1, limit: 10 });
  assert('Pagination returns data array and meta object', Array.isArray(allDiariesResult.data) && allDiariesResult.meta.total >= 3);
  assert('Pagination calculates meta properties correctly', allDiariesResult.meta.page === 1 && allDiariesResult.meta.limit === 10);

  const approvedFilterResult = await service.getDiaryEntries(facultyUser, { status: WorkDiaryStatusEnum.APPROVED });
  assert('Status filter returns only matching entries', approvedFilterResult.data.every((d) => d.status === WorkDiaryStatusEnum.APPROVED));

  const naacFilterResult = await service.getDiaryEntries(facultyUser, { category: WorkDiaryCategoryEnum.NAAC });
  assert('Category filter returns matching entries', naacFilterResult.data.every((d) => d.category === WorkDiaryCategoryEnum.NAAC));

  // ── TEST 10: Dashboard Summary Statistics ───────────────────────────────
  console.log('\n--- 10. Dashboard Statistics ---');
  const stats = await service.getDiaryDashboardStats(facultyUser);
  assert('Dashboard stats returns total count', stats.total >= 3);
  assert('Dashboard stats contains approved, underReview, and drafts', 'approved' in stats && 'underReview' in stats && 'drafts' in stats);

  // ── TEST 11: Direct HOD/Principal Approval & Deletion Rules ──────────────
  console.log('\n--- 11. Security & Edge Case Rules ---');
  try {
    await service.deleteDiaryEntry(facultyUser, draftEntry.id);
    assert('Cannot delete approved work diary without admin authority', false, 'Expected BadRequestException');
  } catch (e: any) {
    assert('Cannot delete approved work diary without admin authority', e instanceof BadRequestException);
  }

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runWorkDiaryTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
