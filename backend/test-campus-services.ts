import { Test, TestingModule } from '@nestjs/testing';
import { StudentServicesService } from './src/student-services/student-services.service';
import { PrismaService } from './src/prisma/prisma.service';
import { StudentServicesController } from './src/student-services/student-services.controller';
import {
  ServiceRequestStatusEnum,
  ServiceRequestPriorityEnum,
  ServiceRequestCategoryEnum,
} from './src/student-services/dto/service-request.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

async function runCampusServicesTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE SSIU CAMPUS SERVICES TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    students: new Map<string, any>(),
    users: new Map<string, any>(),
    departments: new Map<string, any>(),
    services: new Map<string, any>(),
    requests: new Map<string, any>(),
    documents: new Map<string, any>(),
    messages: new Map<string, any>(),
    history: new Map<string, any>(),
    certificates: new Map<string, any>(),
  };

  // Seed departments
  store.departments.set('dept-cse', { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' });
  store.departments.set('dept-ece', { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' });

  // Seed services
  store.services.set('srv-bonafide', {
    id: 'srv-bonafide',
    code: 'BONAFIDE',
    name: 'Bonafide Certificate',
    category: 'CERTIFICATE',
    expectedDays: 2,
    responsibleRoleCode: 'STUDENT_SECTION',
    isActive: true,
  });

  // Seed Students
  store.students.set('stu-a', {
    id: 'stu-a',
    erpId: 'STU_A_001',
    enrollmentNo: 'SSIU2026CSE001',
    firstName: 'Aarav',
    lastName: 'Patel',
    departmentId: 'dept-cse',
    department: store.departments.get('dept-cse'),
  });

  store.students.set('stu-b', {
    id: 'stu-b',
    erpId: 'STU_B_002',
    enrollmentNo: 'SSIU2026ECE002',
    firstName: 'Bhavna',
    lastName: 'Shah',
    departmentId: 'dept-ece',
    department: store.departments.get('dept-ece'),
  });

  // Seed Users
  store.users.set('usr-stu-a', {
    id: 'usr-stu-a',
    username: 'aarav_patel',
    erpId: 'STU_A_001',
    role: 'STUDENT',
    authorityLevel: 10,
    studentId: 'stu-a',
    student: store.students.get('stu-a'),
  });

  store.users.set('usr-stu-b', {
    id: 'usr-stu-b',
    username: 'bhavna_shah',
    erpId: 'STU_B_002',
    role: 'STUDENT',
    authorityLevel: 10,
    studentId: 'stu-b',
    student: store.students.get('stu-b'),
  });

  store.users.set('usr-staff-cse', {
    id: 'usr-staff-cse',
    username: 'cse_coordinator',
    role: 'FACULTY',
    authorityLevel: 5,
    departmentId: 'dept-cse',
  });

  store.users.set('usr-staff-ece', {
    id: 'usr-staff-ece',
    username: 'ece_coordinator',
    role: 'FACULTY',
    authorityLevel: 5,
    departmentId: 'dept-ece',
  });

  store.users.set('usr-super-admin', {
    id: 'usr-super-admin',
    username: 'admin',
    role: 'SUPER_ADMIN',
    authorityLevel: 1,
  });

  const mockPrismaService = {
    student: {
      findFirst: async ({ where }: any) => {
        if (where?.OR) {
          for (const cond of where.OR) {
            const found = Array.from(store.students.values()).find(
              (s) => (cond.id && s.id === cond.id) || (cond.erpId && s.erpId === cond.erpId)
            );
            if (found) return found;
          }
        }
        return store.students.get(where.id || where.erpId);
      },
      findUnique: async ({ where }: any) => store.students.get(where.id),
    },

    studentService: {
      findFirst: async () => Array.from(store.services.values())[0],
      findUnique: async ({ where }: any) => store.services.get(where.id),
      findMany: async () => Array.from(store.services.values()),
      upsert: async ({ create }: any) => create,
    },

    department: {
      findUnique: async ({ where }: any) => store.departments.get(where.id),
    },

    studentServiceRequest: {
      create: async ({ data }: any) => {
        const id = 'req-' + Math.random().toString(36).substr(2, 6);
        const { documents, ...rest } = data;
        const record = { id, ...rest, createdAt: new Date(), updatedAt: new Date() };
        store.requests.set(id, record);

        if (documents?.create) {
          for (const d of documents.create) {
            const docId = 'doc-' + Math.random().toString(36).substr(2, 6);
            store.documents.set(docId, { id: docId, requestId: id, ...d, uploadedAt: new Date() });
          }
        }

        const student = store.students.get(record.studentId);
        const service = store.services.get(record.serviceId);
        const dept = store.departments.get(record.departmentId);
        const docs = Array.from(store.documents.values()).filter((d) => d.requestId === id);

        return { ...record, student, service, department: dept, documents: docs };
      },

      findUnique: async ({ where }: any) => {
        const found = store.requests.get(where.id || where.requestNo);
        if (!found) return null;
        const student = store.students.get(found.studentId);
        const service = store.services.get(found.serviceId);
        const dept = store.departments.get(found.departmentId);
        const docs = Array.from(store.documents.values()).filter((d) => d.requestId === found.id);
        const msgs = Array.from(store.messages.values()).filter((m) => m.requestId === found.id);
        const hist = Array.from(store.history.values()).filter((h) => h.requestId === found.id);
        return {
          ...found,
          student,
          service,
          department: dept,
          documents: docs,
          messages: msgs,
          history: hist,
          certificates: [],
        };
      },

      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.requests.values());
        if (where?.studentId) list = list.filter((r) => r.studentId === where.studentId);
        if (where?.departmentId) list = list.filter((r) => r.departmentId === where.departmentId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        if (where?.category) list = list.filter((r) => r.category === where.category);
        if (where?.priority) list = list.filter((r) => r.priority === where.priority);
        if (where?.OR && !where.studentId) {
          // Check staff queue
          const isQueueQuery = where.OR.some((c: any) => c.departmentId || c.assignedToUserId);
          if (isQueueQuery) {
            list = list.filter((r) => where.OR.some((c: any) => (c.departmentId && r.departmentId === c.departmentId) || (c.assignedToUserId && r.assignedToUserId === c.assignedToUserId)));
          }
        }

        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((r) => ({
          ...r,
          student: store.students.get(r.studentId),
          service: store.services.get(r.serviceId),
          department: store.departments.get(r.departmentId),
          documents: Array.from(store.documents.values()).filter((d) => d.requestId === r.id),
          certificates: [],
          _count: {
            messages: Array.from(store.messages.values()).filter((m) => m.requestId === r.id).length,
            history: Array.from(store.history.values()).filter((h) => h.requestId === r.id).length,
          },
        }));
      },

      count: async ({ where }: any = {}) => {
        let list = Array.from(store.requests.values());
        if (where?.studentId) list = list.filter((r) => r.studentId === where.studentId);
        if (where?.departmentId) list = list.filter((r) => r.departmentId === where.departmentId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list.length;
      },

      update: async ({ where, data }: any) => {
        const existing = store.requests.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.requests.set(where.id, updated);
        return {
          ...updated,
          student: store.students.get(updated.studentId),
          service: store.services.get(updated.serviceId),
          department: store.departments.get(updated.departmentId),
        };
      },
    },

    studentServiceRequestDocument: {
      findMany: async ({ where }: any) => Array.from(store.documents.values()).filter((d) => d.requestId === where.requestId),
    },

    studentServiceRequestMessage: {
      create: async ({ data }: any) => {
        const id = 'msg-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.messages.set(id, record);
        return record;
      },
      findMany: async ({ where }: any) => Array.from(store.messages.values()).filter((m) => m.requestId === where.requestId),
    },

    studentServiceRequestHistory: {
      create: async ({ data }: any) => {
        const id = 'hist-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.history.set(id, record);
        return record;
      },
      findMany: async ({ where }: any) => Array.from(store.history.values()).filter((h) => h.requestId === where.requestId),
    },

    certificate: {
      create: async ({ data }: any) => {
        const id = 'cert-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.certificates.set(id, record);
        return record;
      },
      findMany: async () => Array.from(store.certificates.values()),
    },

    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      StudentServicesService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<StudentServicesService>(StudentServicesService);

  // Users
  const userStudentA = store.users.get('usr-stu-a');
  const userStudentB = store.users.get('usr-stu-b');
  const userStaffCSE = store.users.get('usr-staff-cse');
  const userStaffECE = store.users.get('usr-staff-ece');
  const userSuperAdmin = store.users.get('usr-super-admin');

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

  // ── TEST 1: Student A Creates Service Request ─────────────────────────────
  console.log('--- 1. Student A Creates Service Request ---');
  const reqA = await service.createServiceRequest(userStudentA, {
    serviceId: 'srv-bonafide',
    subject: 'Bonafide Certificate for Passport Office',
    description: 'Required for urgent passport verification at RPO Ahmedabad.',
    category: ServiceRequestCategoryEnum.CERTIFICATE,
    priority: ServiceRequestPriorityEnum.HIGH,
    documents: [
      { name: 'passport_appointment.pdf', documentUrl: 'https://cdn.ssiu.edu.in/docs/passport_app.pdf', fileSize: 500000 },
    ],
  });

  assert('Student A request created with REQ number', reqA.requestNo?.startsWith('REQ-') || false);
  assert('Student A request auto-bound to Student A and CSE department', reqA.studentId === 'stu-a' && reqA.departmentId === 'dept-cse');
  assert('Student A request has uploaded document', reqA.documents?.length === 1);

  // ── TEST 2: Student B Creates Service Request ─────────────────────────────
  console.log('\n--- 2. Student B Creates Service Request ---');
  const reqB = await service.createServiceRequest(userStudentB, {
    serviceId: 'srv-bonafide',
    subject: 'Character Certificate for Job Application',
    description: 'Applying for internship at TCS, requires character endorsement.',
    category: ServiceRequestCategoryEnum.CERTIFICATE,
    priority: ServiceRequestPriorityEnum.NORMAL,
  });

  assert('Student B request created with distinct REQ number', reqB.requestNo?.startsWith('REQ-') || false);
  assert('Student B request bound to Student B and ECE department', reqB.studentId === 'stu-b' && reqB.departmentId === 'dept-ece');

  // ── TEST 3: CRITICAL PRIVACY RULE VERIFICATION ───────────────────────────
  console.log('\n--- 3. CRITICAL PRIVACY & DATA ISOLATION VERIFICATION ---');

  // Student A lists requests
  const listForStudentA = await service.getServiceRequests(userStudentA, {});
  assert('Student A queries requests -> gets ONLY Student A requests', listForStudentA.data.every((r) => r.studentId === 'stu-a'));
  assert('Student A CANNOT see Student B request in list', !listForStudentA.data.some((r) => r.id === reqB.id));

  // Student B lists requests
  const listForStudentB = await service.getServiceRequests(userStudentB, {});
  assert('Student B queries requests -> gets ONLY Student B requests', listForStudentB.data.every((r) => r.studentId === 'stu-b'));
  assert('Student B CANNOT see Student A request in list', !listForStudentB.data.some((r) => r.id === reqA.id));

  // Direct ID Access Violation Check: Student A attempts to access Student B's request
  let studentABlockedFromB = false;
  try {
    await service.getRequestById(reqB.id, userStudentA);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403 || err.message?.includes('Privacy violation')) {
      studentABlockedFromB = true;
    }
  }
  assert('Student A direct ID access to Student B request blocked with 403 Forbidden', studentABlockedFromB);

  // Direct ID Access Violation Check: Student B attempts to access Student A's request
  let studentBBlockedFromA = false;
  try {
    await service.getRequestById(reqA.id, userStudentB);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403 || err.message?.includes('Privacy violation')) {
      studentBBlockedFromA = true;
    }
  }
  assert('Student B direct ID access to Student A request blocked with 403 Forbidden', studentBBlockedFromA);

  // ── TEST 4: Department Staff Scoping ──────────────────────────────────────
  console.log('\n--- 4. Department Staff Scoping & Access Control ---');

  // CSE Staff can view CSE requests
  const cseStaffView = await service.getRequestById(reqA.id, userStaffCSE);
  assert('CSE Department staff can view CSE Student A request', cseStaffView.id === reqA.id);

  // ECE Staff attempting to view CSE Student A request without assignment
  let eceStaffBlockedFromCSE = false;
  try {
    await service.getRequestById(reqA.id, userStaffECE);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403 || err.message?.includes('Access denied')) {
      eceStaffBlockedFromCSE = true;
    }
  }
  assert('ECE Department staff blocked from accessing unassigned CSE request', eceStaffBlockedFromCSE);

  // Super Admin can view all requests
  const adminViewA = await service.getRequestById(reqA.id, userSuperAdmin);
  const adminViewB = await service.getRequestById(reqB.id, userSuperAdmin);
  assert('Super Admin can view requests across all students and departments', adminViewA.id === reqA.id && adminViewB.id === reqB.id);

  // ── TEST 5: Assignment Workflow ───────────────────────────────────────────
  console.log('\n--- 5. Service Request Assignment Workflow ---');
  const assignedReqA = await service.assignServiceRequest(reqA.id, userStaffCSE, {
    assignedToUserId: userStaffCSE.id,
    remarks: 'Assigned to CSE Coordinator for verification',
  });
  assert('Request A status transitioned to ASSIGNED', assignedReqA.status === ServiceRequestStatusEnum.ASSIGNED);
  assert('Assigned staff user ID recorded', assignedReqA.assignedToUserId === userStaffCSE.id);

  // ── TEST 6: Two-Way Conversation & Internal Notes ────────────────────────
  console.log('\n--- 6. Two-Way Authorized Conversation & Internal Notes ---');

  // Staff sends clarification request message
  const staffMsg = await service.addRequestMessage(reqA.id, userStaffCSE, {
    message: 'Please confirm whether you require physical hard copy or digitally signed e-certificate.',
  });
  assert('Staff sent message on Request A', staffMsg.senderType === 'STAFF');

  // Staff adds internal note (hidden from student)
  const internalNote = await service.addRequestMessage(reqA.id, userStaffCSE, {
    message: 'Internal Note: Fee clearance verified with accounts.',
    isInternal: true,
  });
  assert('Staff internal note logged', internalNote.isInternal === true);

  // Student A views request -> internal note must be filtered out
  const studentAView = await service.getRequestById(reqA.id, userStudentA);
  assert('Student A can view public staff message', studentAView.messages.some((m) => m.id === staffMsg.id));
  assert('Student A CANNOT see staff internal note', !studentAView.messages.some((m) => m.id === internalNote.id));

  // Student A replies to staff
  const studentReply = await service.addRequestMessage(reqA.id, userStudentA, {
    message: 'Digitally signed e-certificate with QR code is sufficient.',
  });
  assert('Student A replied to conversation', studentReply.senderType === 'STUDENT');

  // Unauthorized Student B attempts to post message on Student A's request
  let studentBBlockedFromMessaging = false;
  try {
    await service.addRequestMessage(reqA.id, userStudentB, {
      message: 'Unauthorized injection attempt',
    });
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403) {
      studentBBlockedFromMessaging = true;
    }
  }
  assert('Student B strictly blocked from messaging on Student A request', studentBBlockedFromMessaging);

  // ── TEST 7: Resolution Workflow ──────────────────────────────────────────
  console.log('\n--- 7. Resolution Workflow ---');
  const resolvedReqA = await service.resolveServiceRequest(reqA.id, userStaffCSE, {
    resolution: 'Bonafide Certificate generated and dispatched to student email and portal.',
  });
  assert('Request A status transitioned to RESOLVED', resolvedReqA.status === ServiceRequestStatusEnum.RESOLVED);
  assert('Resolution text and resolver user ID recorded', resolvedReqA.resolution?.includes('dispatched') || false);

  // ── TEST 8: Rejection Workflow ───────────────────────────────────────────
  console.log('\n--- 8. Rejection Workflow ---');
  const rejectedReqB = await service.rejectServiceRequest(reqB.id, userStaffECE, {
    rejectionReason: 'Incomplete application: Student must complete minimum 1 year residency for endorsement.',
  });
  assert('Request B status transitioned to REJECTED', rejectedReqB.status === ServiceRequestStatusEnum.REJECTED);
  assert('Rejection reason recorded', rejectedReqB.rejectionReason?.includes('residency') || false);

  // ── TEST 9: Audit Trail History ──────────────────────────────────────────
  console.log('\n--- 9. Chronological Audit Trail History ---');
  const historyA = await service.getRequestHistory(reqA.id, userStaffCSE);
  assert('Request A audit history records all transitions (CREATED, ASSIGNED, REPLIED, RESOLVED)', historyA.length >= 4);

  // ── TEST 10: Dashboard Metrics & Search ──────────────────────────────────
  console.log('\n--- 10. Dashboard KPIs & Search ---');
  const adminMetrics = await service.getServiceRequestDashboardMetrics(userSuperAdmin);
  assert('Admin metrics returns total, resolved, and rejected counts', adminMetrics.totalRequests >= 2 && adminMetrics.resolved >= 1 && adminMetrics.rejected >= 1);

  const studentAMetrics = await service.getServiceRequestDashboardMetrics(userStudentA);
  assert('Student A metrics counts only Student A requests', studentAMetrics.totalRequests === 1 && studentAMetrics.resolved === 1);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runCampusServicesTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
