import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionService } from './src/admission/admission.service';
import { PrismaService } from './src/prisma/prisma.service';
import { AdmissionController } from './src/admission/admission.controller';
import {
  LeadStatusEnum,
  LeadSourceEnum,
  LeadQualityEnum,
} from './src/admission/dto/admission.dto';
import { ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

async function runAdmissionTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE ADMISSION & ENROLLMENT TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    cycles: new Map<string, any>(),
    inquiries: new Map<string, any>(),
    counsellings: new Map<string, any>(),
    applications: new Map<string, any>(),
    documents: new Map<string, any>(),
    approvals: new Map<string, any>(),
    enrollments: new Map<string, any>(),
    students: new Map<string, any>(),
    users: new Map<string, any>(),
    roles: new Map<string, any>(),
    programs: new Map<string, any>(),
    batches: new Map<string, any>(),
    academicYears: new Map<string, any>(),
  };

  // Seed default data
  store.roles.set('STUDENT', { id: 'role-student', code: 'STUDENT', authorityLevel: 10 });
  store.programs.set('prog-cse', { id: 'prog-cse', code: 'BTECH_CSE', name: 'B.Tech Computer Science & Engineering', departmentId: 'dept-cse' });
  store.batches.set('batch-2026', { id: 'batch-2026', code: 'BATCH-2026-CSE', programId: 'prog-cse', startYear: 2026, endYear: 2030 });
  store.academicYears.set('ay-2026', { id: 'ay-2026', code: '2026-27', isCurrent: true });

  const mockPrismaService = {
    admissionCycle: {
      create: async ({ data }: any) => {
        const id = 'ac-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, status: 'ACTIVE' };
        store.cycles.set(id, record);
        return record;
      },
      findFirst: async () => Array.from(store.cycles.values())[0] || null,
      findMany: async () => Array.from(store.cycles.values()),
    },
    admissionInquiry: {
      create: async ({ data }: any) => {
        const id = 'inq-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.inquiries.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        const found = store.inquiries.get(where.id);
        if (!found) return null;
        const counsellings = Array.from(store.counsellings.values()).filter((c) => c.inquiryId === where.id);
        const applications = Array.from(store.applications.values()).filter((a) => a.inquiryId === where.id);
        return { ...found, counsellings, applications };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.inquiries.values());
        if (where?.status) list = list.filter((i) => i.status === where.status);
        if (where?.counsellorUserId) list = list.filter((i) => i.counsellorUserId === where.counsellorUserId);
        if (where?.source) list = list.filter((i) => i.source === where.source);
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((i) => ({
          ...i,
          counsellings: Array.from(store.counsellings.values()).filter((c) => c.inquiryId === i.id),
          applications: Array.from(store.applications.values()).filter((a) => a.inquiryId === i.id),
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.inquiries.values());
        if (where?.status) list = list.filter((i) => i.status === where.status);
        if (where?.counsellorUserId) list = list.filter((i) => i.counsellorUserId === where.counsellorUserId);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.inquiries.get(where.id);
        if (!existing) throw new Error('Inquiry not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.inquiries.set(where.id, updated);
        return updated;
      },
    },
    counsellingRecord: {
      create: async ({ data }: any) => {
        const id = 'cr-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.counsellings.set(id, record);
        return record;
      },
      findMany: async ({ where }: any) => {
        return Array.from(store.counsellings.values()).filter((c) => c.inquiryId === where.inquiryId);
      },
    },
    admissionApplication: {
      create: async ({ data }: any) => {
        const id = 'app-' + Math.random().toString(36).substr(2, 6);
        const docs = (data.documents?.create || []).map((doc: any) => {
          const docId = 'doc-' + Math.random().toString(36).substr(2, 6);
          const docRecord = { id: docId, applicationId: id, ...doc };
          store.documents.set(docId, docRecord);
          return docRecord;
        });
        const record = { id, ...data, documents: docs, createdAt: new Date(), updatedAt: new Date() };
        store.applications.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        const found = store.applications.get(where.id);
        if (!found) return null;
        const docs = Array.from(store.documents.values()).filter((d) => d.applicationId === where.id);
        const enrollment = Array.from(store.enrollments.values()).find((e) => e.applicationId === where.id);
        return { ...found, documents: docs, enrollment };
      },
      findMany: async ({ where, skip, take }: any) => {
        let list = Array.from(store.applications.values());
        if (where?.status) list = list.filter((a) => a.status === where.status);
        if (where?.programId) list = list.filter((a) => a.programId === where.programId);
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((a) => ({
          ...a,
          documents: Array.from(store.documents.values()).filter((d) => d.applicationId === a.id),
          enrollment: Array.from(store.enrollments.values()).find((e) => e.applicationId === a.id),
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.applications.values());
        if (where?.status) list = list.filter((a) => a.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.applications.get(where.id);
        if (!existing) throw new Error('Application not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.applications.set(where.id, updated);
        return updated;
      },
    },
    admissionApplicationDocument: {
      create: async ({ data }: any) => {
        const id = 'doc-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, status: 'UPLOADED', uploadedAt: new Date() };
        store.documents.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => store.documents.get(where.id),
      update: async ({ where, data }: any) => {
        const existing = store.documents.get(where.id);
        const updated = { ...existing, ...data };
        store.documents.set(where.id, updated);
        return updated;
      },
    },
    admissionApproval: {
      create: async ({ data }: any) => {
        const id = 'apr-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, actedAt: new Date() };
        store.approvals.set(id, record);
        return record;
      },
    },
    enrollment: {
      create: async ({ data }: any) => {
        const id = 'enr-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, enrolledAt: new Date() };
        store.enrollments.set(id, record);
        return record;
      },
    },
    student: {
      create: async ({ data }: any) => {
        const id = 'stu-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.students.set(id, record);
        return record;
      },
    },
    user: {
      create: async ({ data }: any) => {
        const id = 'usr-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.users.set(id, record);
        return record;
      },
    },
    role: {
      findUnique: async ({ where }: any) => store.roles.get(where.code),
    },
    program: {
      findUnique: async ({ where }: any) => store.programs.get(where.id),
    },
    batch: {
      findFirst: async ({ where }: any) => Array.from(store.batches.values()).find((b) => b.programId === where.programId) || Array.from(store.batches.values())[0],
      create: async ({ data }: any) => {
        const id = 'batch-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data };
        store.batches.set(id, record);
        return record;
      },
    },
    academicYear: {
      findFirst: async () => Array.from(store.academicYears.values())[0],
    },
    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AdmissionService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<AdmissionService>(AdmissionService);
  const controller = new AdmissionController(service);

  // Users
  const adminUser = { id: 'usr-admin-01', role: 'SUPER_ADMIN', authorityLevel: 1 };
  const counselor1 = { id: 'usr-coun-01', role: 'COUNSELLOR', authorityLevel: 5 };
  const counselor2 = { id: 'usr-coun-02', role: 'COUNSELLOR', authorityLevel: 5 };

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

  // ── TEST 1: Create Admission Cycle & Lead ────────────────────────────────
  console.log('--- 1. Admission Cycle & Lead Creation (NEW) ---');
  const cycle = await service.createAdmissionCycle({
    code: 'ADM-2026-REGULAR',
    name: 'B.Tech Regular Admissions 2026-27',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
  });
  assert('Admission Cycle created and active', cycle.code === 'ADM-2026-REGULAR');

  const lead = await service.createInquiry({
    applicantName: 'Rohan Sharma',
    mobile: '9876543210',
    email: 'rohan.sharma@example.com',
    city: 'Ahmedabad',
    state: 'Gujarat',
    interestedInstituteId: 'inst-sscit',
    interestedProgramId: 'prog-cse',
    source: LeadSourceEnum.WEBSITE,
    leadQuality: LeadQualityEnum.HOT,
    remarks: 'Interested in AI/ML track',
  });
  assert('Lead created with unique INQ number and status NEW', lead.status === LeadStatusEnum.NEW && lead.inquiryNo.startsWith('INQ-'));

  // ── TEST 2: Assign Lead to Counselor (NEW -> CONTACTED) ──────────────────
  console.log('\n--- 2. Lead Assignment to Counselor (CONTACTED) ---');
  const assignedLead = await service.assignLead(lead.id, {
    counsellorUserId: counselor1.id,
    remarks: 'Assigned to senior counselor for AI/ML guidance',
  });
  assert('Lead status transitions to CONTACTED upon counselor assignment', assignedLead.status === LeadStatusEnum.CONTACTED);
  assert('Lead has assigned counselor', assignedLead.counsellorUserId === counselor1.id);

  // ── TEST 3: Counselling Follow-up & History (CONTACTED -> FOLLOW_UP) ─────
  console.log('\n--- 3. Follow-up Recording & Audit Trail (FOLLOW_UP) ---');
  const counselling1 = await service.recordCounselling({
    inquiryId: lead.id,
    discussionPoints: 'Discussed B.Tech curriculum, lab infrastructure, and hostel facility.',
    applicantNeed: 'Hostel accommodation & transport from Gandhinagar',
    mode: 'PHONE_CALL',
    outcome: 'VERY_POSITIVE',
    nextFollowUpDate: '2026-08-25',
  }, counselor1.id);
  assert('Follow-up recorded with notes and next follow-up date', !!counselling1.id);

  const updatedLeadAfterFollowup = await service.getInquiryById(lead.id);
  assert('Lead status transitions to FOLLOW_UP', updatedLeadAfterFollowup.status === LeadStatusEnum.FOLLOW_UP);

  const history = await service.getFollowUpHistory(lead.id);
  assert('Follow-up history retrieved for lead', history.length >= 1 && history[0].discussionPoints.includes('curriculum'));

  // ── TEST 4: Application Submission (FOLLOW_UP -> APPLIED) ────────────────
  console.log('\n--- 4. Application Submission & Document Upload (APPLIED) ---');
  const app = await service.createApplication({
    inquiryId: lead.id,
    admissionCycleId: cycle.id,
    instituteId: 'inst-sscit',
    programId: 'prog-cse',
    firstName: 'Rohan',
    middleName: 'Manoj',
    lastName: 'Sharma',
    email: 'rohan.sharma@example.com',
    mobile: '9876543210',
    gender: 'MALE',
    dateOfBirth: '2006-05-15',
    category: 'GENERAL',
    city: 'Ahmedabad',
    state: 'Gujarat',
    qualifyingExam: '12th Science',
    qualifyingBoard: 'GSEB',
    passingYear: 2026,
    percentage: 88.5,
    documents: [
      { documentType: '10TH_MARKSHEET', documentUrl: 'https://cdn.ssiu.edu/10th.pdf' },
      { documentType: '12TH_MARKSHEET', documentUrl: 'https://cdn.ssiu.edu/12th.pdf' },
      { documentType: 'ID_PROOF', documentUrl: 'https://cdn.ssiu.edu/aadhaar.pdf' },
    ],
  });
  assert('Application created with APP number and documents', app.applicationNo.startsWith('APP-') && app.documents.length === 3);

  const leadAfterApplication = await service.getInquiryById(lead.id);
  assert('Lead status automatically transitions to APPLIED', leadAfterApplication.status === LeadStatusEnum.APPLIED);

  // ── TEST 5: Document & Application Verification (APPLIED -> VERIFIED) ────
  console.log('\n--- 5. Document & Application Verification (VERIFIED) ---');
  const doc1 = app.documents[0];
  const docVerifyResult = await service.verifyDocument(doc1.id, adminUser.id, true, 'Verified from GSEB digital database');
  assert('Single document verified successfully', docVerifyResult.status === 'VERIFIED');

  const verifiedApp = await service.verifyApplication(app.id, adminUser.id, {
    isVerified: true,
    remarks: 'All 3 certificates verified & PCM eligibility satisfied (88.5%)',
  });
  assert('Application status is VERIFIED', verifiedApp.status === 'VERIFIED');

  const leadAfterVerify = await service.getInquiryById(lead.id);
  assert('Lead status transitions to VERIFIED', leadAfterVerify.status === LeadStatusEnum.VERIFIED);

  // ── TEST 6: Admission Approval (VERIFIED -> ADMITTED) ────────────────────
  console.log('\n--- 6. Admission Approval & Merit Allocation (ADMITTED) ---');
  const approvedApp = await service.approveApplication(app.id, adminUser.id, 'ADMISSION_DIRECTOR', {
    comments: 'Allocated Merit Seat in B.Tech CSE (Rank 24)',
    meritRank: 24,
    allocatedCategory: 'OPEN',
  });
  assert('Application status is APPROVED', approvedApp.status === 'APPROVED');

  const leadAfterApproval = await service.getInquiryById(lead.id);
  assert('Lead status transitions to ADMITTED', leadAfterApproval.status === LeadStatusEnum.ADMITTED);

  // ── TEST 7: Fee Payment Confirmation ─────────────────────────────────────
  console.log('\n--- 7. Admission Fee Confirmation ---');
  const feeConfirmed = await service.confirmFeePayment(app.id, 50000, 'RCPT-2026-0042');
  assert('Admission fee marked confirmed with receipt', feeConfirmed.isFeePaid === true && feeConfirmed.feeReceiptNo === 'RCPT-2026-0042');

  // ── TEST 8: Applicant -> Student Conversion & Enrollment (ENROLLED) ──────
  console.log('\n--- 8. Student Conversion & Enrollment Generation (ENROLLED) ---');
  const enrollmentResult = await service.enrollStudent(app.id, adminUser.id, {
    customEnrollmentNo: 'SSIU2026CSE042',
  });
  assert('Generated Enrollment record with number SSIU2026CSE042', enrollmentResult.enrollment.enrollmentNo === 'SSIU2026CSE042');
  assert('Created Student master record with ERP ID', enrollmentResult.student.erpId.startsWith('STU'));
  assert('Created User login account for Student', enrollmentResult.user.username === 'SSIU2026CSE042');

  const appAfterEnroll = await service.getApplicationById(app.id);
  assert('Application status is ENROLLED', appAfterEnroll.status === 'ENROLLED');

  const leadAfterEnroll = await service.getInquiryById(lead.id);
  assert('Lead status transitions to ENROLLED', leadAfterEnroll.status === LeadStatusEnum.ENROLLED);

  // ── TEST 9: Rejection Workflow ───────────────────────────────────────────
  console.log('\n--- 9. Rejection Workflow ---');
  const inqReject = await service.createInquiry({
    applicantName: 'Ineligible Applicant',
    mobile: '9123456789',
  });
  const appReject = await service.createApplication({
    inquiryId: inqReject.id,
    instituteId: 'inst-sscit',
    programId: 'prog-cse',
    firstName: 'Ineligible',
    lastName: 'Applicant',
    email: 'ineligible@example.com',
    mobile: '9123456789',
    percentage: 35.0,
  });

  const rejectedApp = await service.rejectApplication(appReject.id, adminUser.id, {
    rejectionReason: 'Does not meet minimum 45% qualifying criteria.',
  });
  assert('Application marked REJECTED with reason', rejectedApp.status === 'REJECTED' && rejectedApp.rejectionReason.includes('minimum 45%'));

  const leadAfterReject = await service.getInquiryById(inqReject.id);
  assert('Lead status transitions to REJECTED', leadAfterReject.status === LeadStatusEnum.REJECTED);

  // ── TEST 10: Pagination, Search & Multi-filter ───────────────────────────
  console.log('\n--- 10. Querying, Filtering, Pagination & Counselor Scope ---');
  const inquiriesList = await service.getInquiries(adminUser, { page: 1, limit: 10 });
  assert('Inquiries query returns data and pagination meta', Array.isArray(inquiriesList.data) && inquiriesList.meta.total >= 2);

  const counselor1Leads = await service.getInquiries(counselor1, {});
  assert('Counselor scoped query returns assigned leads only', counselor1Leads.data.every((i) => i.counsellorUserId === counselor1.id));

  // ── TEST 11: Admission Reports & Funnel Analytics ────────────────────────
  console.log('\n--- 11. Admission Reports & Conversion Analytics ---');
  const dashboardMetrics = await service.getAdmissionDashboardMetrics();
  assert('Admission dashboard metrics calculates conversion funnel', dashboardMetrics.funnel.totalInquiries >= 2 && 'conversionRate' in dashboardMetrics.funnel);

  const programReport = await service.getProgramAdmissionsReport();
  assert('Program report returns applied and enrolled counts', programReport.length >= 1 && programReport[0].programId === 'prog-cse');

  const sourceReport = await service.getSourceEffectivenessReport();
  assert('Source effectiveness report calculates conversion rates', sourceReport.length >= 1 && 'conversionRate' in sourceReport[0]);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runAdmissionTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
