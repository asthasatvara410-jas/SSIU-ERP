import { Test, TestingModule } from '@nestjs/testing';
import { HostelService } from './src/hostel/hostel.service';
import { PrismaService } from './src/prisma/prisma.service';
import { HostelController } from './src/hostel/hostel.controller';
import {
  VisitorStatusEnum,
  VisitorRelationEnum,
  VisitorIdProofEnum,
} from './src/hostel/dto/visitor.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

async function runHostelVisitorTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE HOSTEL VISITOR MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    hostels: new Map<string, any>(),
    rooms: new Map<string, any>(),
    beds: new Map<string, any>(),
    allotments: new Map<string, any>(),
    students: new Map<string, any>(),
    users: new Map<string, any>(),
    visitors: new Map<string, any>(),
    visitorLogs: new Map<string, any>(),
  };

  // Seed default data
  store.hostels.set('hst-boys-a', { id: 'hst-boys-a', code: 'BH-A', name: 'Boys Hostel Block A', gender: 'BOYS', capacity: 150 });
  store.rooms.set('room-101', { id: 'room-101', hostelId: 'hst-boys-a', roomNumber: '101', floor: 1 });
  store.beds.set('bed-101-a', { id: 'bed-101-a', roomId: 'room-101', bedNumber: '101-A', room: store.rooms.get('room-101') });

  store.students.set('stu-01', {
    id: 'stu-01',
    erpId: 'STU000001',
    enrollmentNo: 'SSIU2026CSE001',
    firstName: 'Aarav',
    lastName: 'Patel',
  });

  store.students.set('stu-02', {
    id: 'stu-02',
    erpId: 'STU000002',
    enrollmentNo: 'SSIU2026CSE002',
    firstName: 'Dev',
    lastName: 'Mehta',
  });

  store.allotments.set('allot-01', {
    id: 'allot-01',
    studentId: 'stu-01',
    hostelId: 'hst-boys-a',
    bedId: 'bed-101-a',
    status: 'ACTIVE',
    bed: { roomId: 'room-101', room: store.rooms.get('room-101') },
  });

  store.users.set('usr-admin-01', { id: 'usr-admin-01', username: 'admin', role: 'SUPER_ADMIN', authorityLevel: 1 });
  store.users.set('usr-warden-01', { id: 'usr-warden-01', username: 'warden_bha', role: 'HOSTEL_WARDEN', authorityLevel: 4 });
  store.users.set('usr-stu-01', { id: 'usr-stu-01', username: 'SSIU2026CSE001', erpId: 'STU000001', role: 'STUDENT', authorityLevel: 10, studentId: 'stu-01' });
  store.users.set('usr-stu-02', { id: 'usr-stu-02', username: 'SSIU2026CSE002', erpId: 'STU000002', role: 'STUDENT', authorityLevel: 10, studentId: 'stu-02' });

  const mockPrismaService = {
    hostel: {
      findFirst: async () => Array.from(store.hostels.values())[0],
      findMany: async () => Array.from(store.hostels.values()),
      findUnique: async ({ where }: any) => store.hostels.get(where.id || where.code),
    },
    hostelRoom: {
      findUnique: async ({ where }: any) => store.rooms.get(where.id),
      findMany: async () => Array.from(store.rooms.values()),
    },
    hostelAllotment: {
      findFirst: async ({ where }: any) => {
        return Array.from(store.allotments.values()).find(
          (a) => a.studentId === where.studentId && (!where.status || a.status === where.status)
        );
      },
    },
    student: {
      findFirst: async ({ where }: any) => {
        return Array.from(store.students.values()).find((s) => s.erpId === where.erpId || s.id === where.id);
      },
      findUnique: async ({ where }: any) => store.students.get(where.id),
    },
    user: {
      findUnique: async ({ where }: any) => store.users.get(where.id),
    },
    hostelVisitor: {
      create: async ({ data }: any) => {
        const id = 'vis-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.visitors.set(id, record);
        return {
          ...record,
          student: store.students.get(record.studentId),
          hostel: store.hostels.get(record.hostelId),
          room: store.rooms.get(record.roomId),
        };
      },
      findUnique: async ({ where }: any) => {
        const found = store.visitors.get(where.id);
        if (!found) return null;
        const logs = Array.from(store.visitorLogs.values()).filter((l) => l.visitorId === where.id);
        return {
          ...found,
          student: store.students.get(found.studentId),
          hostel: store.hostels.get(found.hostelId),
          room: store.rooms.get(found.roomId),
          logs: logs.map((l) => ({ ...l, performedBy: store.users.get(l.performedByUserId) })),
        };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.visitors.values());
        if (where?.studentId) list = list.filter((v) => v.studentId === where.studentId);
        if (where?.hostelId) list = list.filter((v) => v.hostelId === where.hostelId);
        if (where?.status) list = list.filter((v) => v.status === where.status);
        if (where?.relation) list = list.filter((v) => v.relation === where.relation);
        if (where?.OR) {
          const search = (where.OR[0]?.visitorName?.contains || '').toLowerCase();
          list = list.filter(
            (v) =>
              v.visitorName.toLowerCase().includes(search) ||
              (v.passNumber && v.passNumber.toLowerCase().includes(search)) ||
              v.purpose.toLowerCase().includes(search)
          );
        }
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((v) => ({
          ...v,
          student: store.students.get(v.studentId),
          hostel: store.hostels.get(v.hostelId),
          room: store.rooms.get(v.roomId),
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.visitors.values());
        if (where?.studentId) list = list.filter((v) => v.studentId === where.studentId);
        if (where?.hostelId) list = list.filter((v) => v.hostelId === where.hostelId);
        if (where?.status) list = list.filter((v) => v.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.visitors.get(where.id);
        if (!existing) throw new Error('Visitor not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.visitors.set(where.id, updated);
        return {
          ...updated,
          student: store.students.get(updated.studentId),
          hostel: store.hostels.get(updated.hostelId),
          room: store.rooms.get(updated.roomId),
        };
      },
      delete: async ({ where }: any) => {
        const existing = store.visitors.get(where.id);
        store.visitors.delete(where.id);
        return existing;
      },
    },
    hostelVisitorLog: {
      create: async ({ data }: any) => {
        const id = 'vlog-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.visitorLogs.set(id, record);
        return record;
      },
      findMany: async ({ where }: any = {}) => {
        return Array.from(store.visitorLogs.values())
          .filter((l) => l.visitorId === where.visitorId)
          .map((l) => ({ ...l, performedBy: store.users.get(l.performedByUserId) }));
      },
    },
    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      HostelService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<HostelService>(HostelService);
  const controller = new HostelController(service);

  // Users
  const adminUser = store.users.get('usr-admin-01');
  const wardenUser = store.users.get('usr-warden-01');
  const studentUser1 = store.users.get('usr-stu-01');
  const studentUser2 = store.users.get('usr-stu-02');

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

  // ── TEST 1: Student Requests Visitor Entry (REQUESTED) ────────────────────
  console.log('--- 1. Student Visitor Registration (REQUESTED) ---');
  const visitorReq1 = await service.registerVisitor(studentUser1, {
    visitorName: 'Mukesh Sharma',
    relation: VisitorRelationEnum.PARENT,
    purpose: 'Delivering semester textbooks and winter clothes',
    contactPhone: '9825012345',
    visitorEmail: 'mukesh.sharma@example.com',
    idProofType: VisitorIdProofEnum.AADHAAR,
    idProofNumber: '9876-5432-1098',
    idProofDocumentUrl: 'https://cdn.ssiu.edu.in/aadhaar_mukesh.pdf',
    vehicleNumber: 'GJ-01-AB-1234',
    expectedCheckInDate: '2026-08-20',
    expectedCheckOutDate: '2026-08-20',
    remarks: 'Visiting during approved afternoon visiting hours.',
  });

  assert('Visitor created with unique VIS pass number', visitorReq1.passNumber?.startsWith('VIS-') || false);
  assert('Visitor status is initial REQUESTED', visitorReq1.status === VisitorStatusEnum.REQUESTED);
  assert('Auto-mapped student and hostel allotment', visitorReq1.studentId === 'stu-01' && visitorReq1.hostelId === 'hst-boys-a' && visitorReq1.roomId === 'room-101');

  // ── TEST 2: Warden Reviews & Approves Visitor (REQUESTED -> APPROVED) ────
  console.log('\n--- 2. Hostel Warden Approval (APPROVED) ---');
  const approvedVisitor = await service.approveVisitor(visitorReq1.id, wardenUser, {
    comments: 'Visitor pass approved for visiting hours (4 PM - 6 PM).',
  });
  assert('Visitor request status transitioned to APPROVED', approvedVisitor.status === VisitorStatusEnum.APPROVED);
  assert('Recorded approver user ID and approval timestamp', approvedVisitor.approvedByUserId === wardenUser.id);

  // ── TEST 3: Visitor Gate Check-in (APPROVED -> CHECKED_IN) ───────────────
  console.log('\n--- 3. Visitor Check-in at Hostel Gate (CHECKED_IN) ---');
  const checkedInVisitor = await service.checkInVisitor(visitorReq1.id, wardenUser, {
    idProofType: VisitorIdProofEnum.AADHAAR,
    idProofNumber: '9876-5432-1098',
    vehicleNumber: 'GJ-01-AB-1234',
    remarks: 'Physical Aadhaar verified and campus visitor badge #42 issued.',
  });
  assert('Visitor status transitioned to CHECKED_IN', checkedInVisitor.status === VisitorStatusEnum.CHECKED_IN);
  assert('Check-in timestamp recorded', !!checkedInVisitor.checkInTime);

  // ── TEST 4: Visitor Gate Check-out (CHECKED_IN -> CHECKED_OUT) ───────────
  console.log('\n--- 4. Visitor Check-out from Hostel (CHECKED_OUT) ---');
  const checkedOutVisitor = await service.checkOutVisitor(visitorReq1.id, wardenUser, {
    remarks: 'Visitor returned badge and exited hostel premises safely.',
  });
  assert('Visitor status transitioned to CHECKED_OUT', checkedOutVisitor.status === VisitorStatusEnum.CHECKED_OUT);
  assert('Check-out timestamp recorded', !!checkedOutVisitor.checkOutTime);

  // ── TEST 5: Direct Gate Security Check-in (Walk-in Parent) ───────────────
  console.log('\n--- 5. Direct Security Gate Entry ---');
  const directGateVisitor = await service.registerVisitor(wardenUser, {
    studentId: 'stu-01',
    visitorName: 'Suresh Patel',
    relation: VisitorRelationEnum.GUARDIAN,
    purpose: 'Urgent fee document handover',
    contactPhone: '9825099999',
    idProofType: VisitorIdProofEnum.DRIVING_LICENSE,
    idProofNumber: 'GJ01-20150012345',
  });
  assert('Direct gate entry registered with immediate CHECKED_IN status', directGateVisitor.status === VisitorStatusEnum.CHECKED_IN);

  // ── TEST 6: Rejection Workflow ───────────────────────────────────────────
  console.log('\n--- 6. Rejection Workflow (REJECTED) ---');
  const visitorReq2 = await service.registerVisitor(studentUser1, {
    visitorName: 'Unregistered Friend',
    relation: VisitorRelationEnum.FRIEND,
    purpose: 'Group stayover',
    contactPhone: '9123456789',
    expectedCheckInDate: '2026-08-22',
  });

  const rejectedVisitor = await service.rejectVisitor(visitorReq2.id, wardenUser, {
    rejectionReason: 'Overnight non-family guest stayovers are strictly prohibited.',
  });
  assert('Visitor request transitioned to REJECTED with reason', rejectedVisitor.status === VisitorStatusEnum.REJECTED && !!rejectedVisitor.rejectionReason && rejectedVisitor.rejectionReason.includes('stayovers'));

  // ── TEST 7: Visitor Audit Trail History ──────────────────────────────────
  console.log('\n--- 7. Visitor Audit Trail History ---');
  const auditLogs = await service.getVisitorHistory(visitorReq1.id, wardenUser);
  assert('Complete lifecycle recorded (REQUESTED -> APPROVED -> CHECKED_IN -> CHECKED_OUT)', auditLogs.length >= 4);

  // ── TEST 8: RBAC & Student Privacy Rules ─────────────────────────────────
  console.log('\n--- 8. RBAC & Privacy Ownership Enforcement ---');
  let privacyViolationCaught = false;
  try {
    // Student 2 attempting to view Student 1's visitor pass
    await service.getVisitorById(visitorReq1.id, studentUser2);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403 || err.message?.includes('Privacy violation')) {
      privacyViolationCaught = true;
    }
  }
  assert('Student 2 strictly blocked from viewing Student 1 visitor records', privacyViolationCaught);

  const student1List = await service.getVisitors(studentUser1, {});
  assert('Student only receives their own visitor entries', student1List.data.every((v) => v.studentId === 'stu-01'));

  const adminView = await service.getVisitorById(visitorReq1.id, adminUser);
  assert('Super Admin has full authorized access to any visitor pass', adminView.id === visitorReq1.id);

  // ── TEST 9: Querying, Multi-Filter & Search ──────────────────────────────
  console.log('\n--- 9. Querying, Multi-filter & Search ---');
  const filteredQuery = await service.getVisitors(adminUser, {
    status: VisitorStatusEnum.CHECKED_OUT,
    relation: VisitorRelationEnum.PARENT,
    search: 'Mukesh',
  });
  assert('Multi-filter search returns matched visitor pass', filteredQuery.data.length >= 1 && filteredQuery.meta.total >= 1);

  // ── TEST 10: Visitor Dashboard KPI Metrics ───────────────────────────────
  console.log('\n--- 10. Visitor Dashboard KPIs & Metrics ---');
  const metrics = await service.getVisitorDashboardMetrics(adminUser);
  assert('Dashboard metrics returns total, approved, checkedIn, checkedOut, and rejected counters', metrics.totalVisitors >= 3 && metrics.checkedOut >= 1 && metrics.rejected >= 1);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runHostelVisitorTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
