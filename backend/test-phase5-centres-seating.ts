/**
 * Phase 5 Automated Test Suite: Exam Centre, Room, Seating & EDP Duty Management
 * 
 * Verifies all 21 test scenarios:
 * 1. Create exam centre successfully
 * 2. Reject duplicate centre code
 * 3. Reject centre with invalid total capacity (<=0)
 * 4. Add room with capacity > 0 and room number unique within centre
 * 5. Reject duplicate room number in same centre
 * 6. Reject room capacity <= 0
 * 7. Allocate examination to one or more centres
 * 8. Filter eligible candidates: ONLY verified exam form and successful payment
 * 9. Reject unverified, draft, returned, or unpaid students from seating allocation
 * 10. Auto seating allocation under Sequential pattern
 * 11. Auto seating allocation under Alternate pattern
 * 12. Auto seating allocation under Row/Column pattern
 * 13. Reject auto-allocation when total eligible students exceed total capacity with message "Insufficient examination capacity."
 * 14. Ensure at most one active seat per candidate per exam (no duplicate seats)
 * 15. Prevent double-allocation of the same seat to different students
 * 16. Manual seat reallocation requiring mandatory reason
 * 17. Record complete audit trail in ExamSeatChangeHistory on manual seat change
 * 18. Sync seat allocation changes to Hall Ticket with requiresReissue flag
 * 19. Assign EDP duty to staff member with mandatory fields
 * 20. Reject overlapping EDP duty assignment for same staff on same date & shift
 * 21. EDP duty decline requiring mandatory rejection reason & status tracking
 */

import { ExamService } from './src/exam/exam.service';

interface MockAuditLog {
  action: string;
  module: string;
  details: string;
  performedBy: string;
}

class MockPrismaService {
  examCentres: any[] = [];
  examRooms: any[] = [];
  examCentreAllocations: any[] = [];
  examSeatAllocations: any[] = [];
  examSeatChangeHistories: any[] = [];
  examEdpDuties: any[] = [];
  examEdpDutyHistories: any[] = [];
  hallTickets: any[] = [];
  exams: any[] = [];
  examForms: any[] = [];
  students: any[] = [];
  users: any[] = [];
  departments: any[] = [];
  auditLogs: MockAuditLog[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.exams = [
      { id: 'exam-summer-2026', code: 'SUMMER-2026', name: 'Summer 2026 Regular End-Sem Exam', session: 'Summer 2026', status: 'SCHEDULED' }
    ];

    this.students = [
      { id: 'stud-1', enrollmentNo: 'EN2024001', firstName: 'Aarav', lastName: 'Sharma', name: 'Aarav Sharma', departmentId: 'dept-cse', department: { name: 'Computer Engineering' }, batch: { program: { name: 'B.Tech CSE' } } },
      { id: 'stud-2', enrollmentNo: 'EN2024002', firstName: 'Diya', lastName: 'Patel', name: 'Diya Patel', departmentId: 'dept-cse', department: { name: 'Computer Engineering' }, batch: { program: { name: 'B.Tech CSE' } } },
      { id: 'stud-3', enrollmentNo: 'EN2024003', firstName: 'Rohan', lastName: 'Gupta', name: 'Rohan Gupta', departmentId: 'dept-ece', department: { name: 'Electronics Engineering' }, batch: { program: { name: 'B.Tech ECE' } } },
      { id: 'stud-4', enrollmentNo: 'EN2024004', firstName: 'Sneha', lastName: 'Verma', name: 'Sneha Verma', departmentId: 'dept-it', department: { name: 'Information Technology' }, batch: { program: { name: 'B.Tech IT' } } },
      { id: 'stud-5', enrollmentNo: 'EN2024005', firstName: 'Vikram', lastName: 'Mehta', name: 'Vikram Mehta', departmentId: 'dept-me', department: { name: 'Mechanical Engineering' }, batch: { program: { name: 'B.Tech ME' } } },
      { id: 'stud-unpaid', enrollmentNo: 'EN2024099', firstName: 'Unpaid', lastName: 'Student', name: 'Unpaid Student', departmentId: 'dept-cse', department: { name: 'Computer Engineering' } },
      { id: 'stud-draft', enrollmentNo: 'EN2024098', firstName: 'Draft', lastName: 'Student', name: 'Draft Student', departmentId: 'dept-cse', department: { name: 'Computer Engineering' } },
    ];

    this.examForms = [
      { id: 'form-1', examId: 'exam-summer-2026', studentId: 'stud-1', status: 'VERIFIED', feePaid: true, paymentStatus: 'PAID', hallTicket: { hallTicketNo: 'HT-2026-0001' } },
      { id: 'form-2', examId: 'exam-summer-2026', studentId: 'stud-2', status: 'VERIFIED', feePaid: true, paymentStatus: 'PAID', hallTicket: { hallTicketNo: 'HT-2026-0002' } },
      { id: 'form-3', examId: 'exam-summer-2026', studentId: 'stud-3', status: 'VERIFIED', feePaid: true, paymentStatus: 'PAID', hallTicket: { hallTicketNo: 'HT-2026-0003' } },
      { id: 'form-4', examId: 'exam-summer-2026', studentId: 'stud-4', status: 'APPROVED', feePaid: true, paymentStatus: 'PAID', hallTicket: { hallTicketNo: 'HT-2026-0004' } },
      { id: 'form-5', examId: 'exam-summer-2026', studentId: 'stud-5', status: 'VERIFIED', feePaid: true, paymentStatus: 'PAID', hallTicket: { hallTicketNo: 'HT-2026-0005' } },
      // Invalid / Excluded forms
      { id: 'form-unpaid', examId: 'exam-summer-2026', studentId: 'stud-unpaid', status: 'VERIFIED', feePaid: false, paymentStatus: 'PENDING' },
      { id: 'form-draft', examId: 'exam-summer-2026', studentId: 'stud-draft', status: 'DRAFT', feePaid: true, paymentStatus: 'PAID' },
    ];

    this.hallTickets = [
      { id: 'ht-1', examId: 'exam-summer-2026', studentId: 'stud-1', hallTicketNo: 'HT-2026-0001', requiresReissue: false },
      { id: 'ht-2', examId: 'exam-summer-2026', studentId: 'stud-2', hallTicketNo: 'HT-2026-0002', requiresReissue: false },
      { id: 'ht-3', examId: 'exam-summer-2026', studentId: 'stud-3', hallTicketNo: 'HT-2026-0003', requiresReissue: false },
    ];

    this.users = [
      { id: 'staff-1', name: 'Prof. Ananya Roy', email: 'ananya@swarrnim.edu.in', role: 'FACULTY', department: 'dept-cse' },
      { id: 'staff-2', name: 'Dr. Bharat Patel', email: 'bharat@swarrnim.edu.in', role: 'FACULTY', department: 'dept-ece' },
      { id: 'controller-1', name: 'Exam Controller Admin', email: 'controller@swarrnim.edu.in', role: 'EXAM_CONTROLLER' },
    ];
  }

  examCentre = {
    findMany: async (args?: any) => {
      let res = [...this.examCentres];
      if (args?.where?.status) res = res.filter(c => c.status === args.where.status);
      if (args?.where?.code) res = res.filter(c => c.code === args.where.code);
      if (args?.include?.rooms) {
        res = res.map(c => ({
          ...c,
          rooms: this.examRooms.filter(r => r.centreId === c.id),
        }));
      }
      return res;
    },
    findUnique: async (args: any) => {
      const c = this.examCentres.find(x => x.id === args?.where?.id || x.code === args?.where?.code);
      if (!c) return null;
      if (args?.include?.rooms) {
        return {
          ...c,
          rooms: this.examRooms.filter(r => r.centreId === c.id),
        };
      }
      return c;
    },
    create: async (args: any) => {
      const record = { id: `centre-${Date.now()}-${Math.random()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.examCentres.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.examCentres.findIndex(x => x.id === args.where.id);
      if (idx === -1) throw new Error('ExamCentre not found');
      this.examCentres[idx] = { ...this.examCentres[idx], ...args.data, updatedAt: new Date() };
      return this.examCentres[idx];
    },
  };

  examRoom = {
    findMany: async (args?: any) => {
      let res = [...this.examRooms];
      if (args?.where?.centreId) res = res.filter(r => r.centreId === args.where.centreId);
      if (args?.where?.id?.in) res = res.filter(r => args.where.id.in.includes(r.id));
      if (args?.where?.status?.in) res = res.filter(r => args.where.status.in.includes(r.status));
      else if (args?.where?.status) res = res.filter(r => r.status === args.where.status);
      if (args?.include?.centre) {
        res = res.map(r => ({
          ...r,
          centre: this.examCentres.find(c => c.id === r.centreId),
        }));
      }
      return res;
    },
    findUnique: async (args: any) => {
      if (args?.where?.centreId_roomNumber) {
        return this.examRooms.find(r => r.centreId === args.where.centreId_roomNumber.centreId && r.roomNumber === args.where.centreId_roomNumber.roomNumber) || null;
      }
      const r = this.examRooms.find(x => x.id === args?.where?.id) || null;
      if (r && args?.include?.centre) {
        return {
          ...r,
          centre: this.examCentres.find(c => c.id === r.centreId),
        };
      }
      return r;
    },
    create: async (args: any) => {
      const record = { id: `room-${Date.now()}-${Math.random()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.examRooms.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.examRooms.findIndex(r => r.id === args.where.id);
      if (idx === -1) throw new Error('ExamRoom not found');
      this.examRooms[idx] = { ...this.examRooms[idx], ...args.data, updatedAt: new Date() };
      return this.examRooms[idx];
    },
  };

  examCentreAllocation = {
    upsert: async (args: any) => {
      const { examId, centreId } = args.where.examId_centreId;
      const idx = this.examCentreAllocations.findIndex(a => a.examId === examId && a.centreId === centreId);
      if (idx !== -1) {
        this.examCentreAllocations[idx] = { ...this.examCentreAllocations[idx], ...args.update };
        return this.examCentreAllocations[idx];
      }
      const record = { id: `ca-${Date.now()}`, ...args.create, createdAt: new Date() };
      this.examCentreAllocations.push(record);
      return record;
    },
    findMany: async (args?: any) => {
      let res = [...this.examCentreAllocations];
      if (args?.where?.examId) res = res.filter(a => a.examId === args.where.examId);
      if (args?.include?.centre) {
        res = res.map(a => {
          const c = this.examCentres.find(x => x.id === a.centreId);
          return {
            ...a,
            centre: {
              ...c,
              rooms: this.examRooms.filter(r => r.centreId === a.centreId),
            },
          };
        });
      }
      return res;
    },
  };

  examSeatAllocation = {
    deleteMany: async (args?: any) => {
      const before = this.examSeatAllocations.length;
      if (args?.where?.examId) {
        this.examSeatAllocations = this.examSeatAllocations.filter(a => a.examId !== args.where.examId);
      }
      return { count: before - this.examSeatAllocations.length };
    },
    upsert: async (args: any) => {
      const id = args.where?.id || (args.where?.examId_studentId ? `alloc-${args.where.examId_studentId.examId}-${args.where.examId_studentId.studentId}` : '');
      const idx = this.examSeatAllocations.findIndex(a => (id && a.id === id) || (args.where?.examId_studentId && a.examId === args.where.examId_studentId.examId && a.studentId === args.where.examId_studentId.studentId));
      if (idx !== -1) {
        this.examSeatAllocations[idx] = { ...this.examSeatAllocations[idx], ...args.update };
        return this.examSeatAllocations[idx];
      }
      const record = {
        id: id || `seat-alloc-${Date.now()}-${Math.random()}`,
        ...args.create,
        allocatedAt: new Date(),
      };
      this.examSeatAllocations.push(record);
      return record;
    },
    create: async (args: any) => {
      const record = {
        id: `seat-alloc-${Date.now()}-${Math.random()}`,
        ...args.data,
        allocatedAt: new Date(),
      };
      this.examSeatAllocations.push(record);
      return record;
    },
    findMany: async (args?: any) => {
      let res = [...this.examSeatAllocations];
      if (args?.where?.examId) res = res.filter(a => a.examId === args.where.examId);
      if (args?.where?.status) res = res.filter(a => a.status === args.where.status);
      if (args?.where?.studentId) res = res.filter(a => a.studentId === args.where.studentId);
      return res.map(a => ({
        ...a,
        centre: this.examCentres.find(c => c.id === a.centreId),
        room: this.examRooms.find(r => r.id === a.roomId),
        student: this.students.find(s => s.id === a.studentId),
        history: this.examSeatChangeHistories.filter(h => h.seatAllocationId === a.id),
      }));
    },
    findUnique: async (args: any) => {
      const a = this.examSeatAllocations.find(x => x.id === args.where.id);
      if (!a) return null;
      return {
        ...a,
        centre: this.examCentres.find(c => c.id === a.centreId),
        room: this.examRooms.find(r => r.id === a.roomId),
        student: this.students.find(s => s.id === a.studentId),
        history: this.examSeatChangeHistories.filter(h => h.seatAllocationId === a.id),
      };
    },
    update: async (args: any) => {
      const idx = this.examSeatAllocations.findIndex(x => x.id === args.where.id);
      if (idx === -1) throw new Error('Seat allocation not found');
      this.examSeatAllocations[idx] = { ...this.examSeatAllocations[idx], ...args.data };
      return this.examSeatAllocations[idx];
    },
  };

  examSeatChangeHistory = {
    create: async (args: any) => {
      const record = { id: `sch-${Date.now()}-${Math.random()}`, ...args.data, changedAt: new Date() };
      this.examSeatChangeHistories.push(record);
      return record;
    },
  };

  examEdpDuty = {
    count: async () => this.examEdpDuties.length,
    findFirst: async (args: any) => {
      return this.examEdpDuties.find(d =>
        d.staffUserId === args.where.staffUserId &&
        d.dutyDate?.getTime?.() === args.where.dutyDate?.getTime?.() &&
        d.shift === args.where.shift &&
        args.where.status?.in?.includes(d.status)
      ) || null;
    },
    create: async (args: any) => {
      const record = {
        id: `edp-${Date.now()}-${Math.random()}`,
        ...args.data,
        assignedAt: new Date(),
      };
      this.examEdpDuties.push(record);
      return record;
    },
    findMany: async (args?: any) => {
      let res = [...this.examEdpDuties];
      if (args?.where?.examId) res = res.filter(d => d.examId === args.where.examId);
      if (args?.where?.staffUserId) res = res.filter(d => d.staffUserId === args.where.staffUserId);
      if (args?.where?.status) res = res.filter(d => d.status === args.where.status);
      return res.map(d => ({
        ...d,
        centre: this.examCentres.find(c => c.id === d.centreId),
        room: this.examRooms.find(r => r.id === d.roomId),
        staffUser: this.users.find(u => u.id === d.staffUserId),
        history: this.examEdpDutyHistories.filter(h => h.dutyId === d.id),
      }));
    },
    findUnique: async (args: any) => {
      const d = this.examEdpDuties.find(x => x.id === args.where.id);
      if (!d) return null;
      return {
        ...d,
        centre: this.examCentres.find(c => c.id === d.centreId),
        room: this.examRooms.find(r => r.id === d.roomId),
        staffUser: this.users.find(u => u.id === d.staffUserId),
        history: this.examEdpDutyHistories.filter(h => h.dutyId === d.id),
      };
    },
    update: async (args: any) => {
      const idx = this.examEdpDuties.findIndex(x => x.id === args.where.id);
      if (idx === -1) throw new Error('EDP duty not found');
      this.examEdpDuties[idx] = { ...this.examEdpDuties[idx], ...args.data };
      return this.examEdpDuties[idx];
    },
  };

  examEdpDutyHistory = {
    create: async (args: any) => {
      const record = { id: `edph-${Date.now()}-${Math.random()}`, ...args.data, createdAt: new Date() };
      this.examEdpDutyHistories.push(record);
      return record;
    },
  };

  hallTicket = {
    findFirst: async (args: any) => {
      return this.hallTickets.find(h => h.examId === args.where.examId && h.studentId === args.where.studentId) || null;
    },
    update: async (args: any) => {
      const idx = this.hallTickets.findIndex(h => h.id === args.where.id);
      if (idx !== -1) {
        this.hallTickets[idx] = { ...this.hallTickets[idx], ...args.data };
        return this.hallTickets[idx];
      }
      return null;
    },
  };

  exam = {
    findUnique: async (args: any) => {
      return this.exams.find(e => e.id === args.where.id) || null;
    },
  };

  examForm = {
    findMany: async (args?: any) => {
      let res = [...this.examForms];
      if (args?.where?.examId) res = res.filter(f => f.examId === args.where.examId);
      if (args?.where?.status?.in) res = res.filter(f => args.where.status.in.includes(f.status));
      if (args?.where?.OR) {
        res = res.filter(f => f.feePaid === true || f.paymentStatus === 'PAID');
      }
      return res.map(f => ({
        ...f,
        student: this.students.find(s => s.id === f.studentId),
      }));
    },
  };

  user = {
    findMany: async () => this.users,
    findUnique: async (args: any) => this.users.find(u => u.id === args?.where?.id || u.email === args?.where?.email) || null,
  };

  auditLog = {
    create: async (args: any) => {
      this.auditLogs.push(args.data);
      return args.data;
    },
  };
}

async function runPhase5TestSuite() {
  console.log('===============================================================');
  console.log('PHASE 5 TEST SUITE: EXAM CENTRE, ROOM, SEATING & EDP DUTY');
  console.log('===============================================================\n');

  const mockPrisma = new MockPrismaService();
  const service = new ExamService(mockPrisma as any);

  let passed = 0;
  let failed = 0;

  function assert(scenario: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`[PASS] Scenario: ${scenario}`);
      passed++;
    } else {
      console.error(`[FAIL] Scenario: ${scenario} - ${details || 'Assertion failed'}`);
      failed++;
    }
  }

  const adminUser = { id: 'controller-1', name: 'Exam Controller Admin', role: 'EXAM_CONTROLLER' };

  try {
    // 1. Create Exam Centre
    const centre1 = await service.createExamCentre({
      code: 'CENTRE-01',
      name: 'SSIU Main Campus Examination Centre',
      building: 'Block A & B',
      capacity: 500,
      contactPerson: 'Dr. Sharma',
      contactNumber: '+91 9876543210',
    }, adminUser);
    assert('1. Create Exam Centre successfully', centre1.code === 'CENTRE-01' && centre1.capacity === 500);

    // 2. Reject duplicate centre code
    let duplicateRejected = false;
    try {
      await service.createExamCentre({
        code: 'CENTRE-01',
        name: 'Duplicate Centre',
        building: 'Block C',
        capacity: 300,
      }, adminUser);
    } catch (e: any) {
      duplicateRejected = e.message.includes('already exists');
    }
    assert('2. Reject duplicate centre code', duplicateRejected);

    // 3. Reject invalid capacity
    let invalidCapRejected = false;
    try {
      await service.createExamCentre({
        code: 'CENTRE-02',
        name: 'Zero Capacity Centre',
        building: 'Block D',
        capacity: 0,
      }, adminUser);
    } catch (e: any) {
      invalidCapRejected = e.message.includes('greater than 0');
    }
    assert('3. Reject centre with invalid total capacity (<=0)', invalidCapRejected);

    // 4. Add room with capacity > 0 and room number
    const room1 = await service.createExamRoom({
      centreId: centre1.id,
      roomNumber: 'ROOM-101',
      roomCode: 'R101',
      capacity: 2, // intentionally small for capacity testing
      floor: 1,
      roomType: 'CLASSROOM',
      hasCCTV: true,
    }, adminUser);
    assert('4. Add room with capacity > 0 and room unique within centre', room1.roomNumber === 'ROOM-101' && room1.capacity === 2);

    const room2 = await service.createExamRoom({
      centreId: centre1.id,
      roomNumber: 'ROOM-102',
      roomCode: 'R102',
      capacity: 3,
      floor: 1,
      roomType: 'CLASSROOM',
      hasCCTV: true,
    }, adminUser);
    assert('4b. Add second room ROOM-102 with capacity 3', room2.capacity === 3);

    // 5. Reject duplicate room in same centre
    let dupRoomRejected = false;
    try {
      await service.createExamRoom({
        centreId: centre1.id,
        roomNumber: 'ROOM-101',
        capacity: 30,
      }, adminUser);
    } catch (e: any) {
      dupRoomRejected = e.message.includes('already exists');
    }
    assert('5. Reject duplicate room number in same centre', dupRoomRejected);

    // 6. Reject room capacity <= 0
    let zeroRoomCapRejected = false;
    try {
      await service.createExamRoom({
        centreId: centre1.id,
        roomNumber: 'ROOM-103',
        capacity: -5,
      }, adminUser);
    } catch (e: any) {
      zeroRoomCapRejected = e.message.includes('greater than 0');
    }
    assert('6. Reject room capacity <= 0', zeroRoomCapRejected);

    // 7. Allocate examination to centre
    const centreAlloc = await service.allocateExamCentres({
      examId: 'exam-summer-2026',
      centreIds: [centre1.id],
    }, adminUser);
    assert('7. Allocate examination to exam centre', centreAlloc.allocations.length === 1);

    // 8. Filter eligible candidates (Only VERIFIED/APPROVED and PAID)
    const eligible = await service.getEligibleStudentsForSeating('exam-summer-2026');
    assert('8. Filter eligible candidates (ONLY verified + paid)', eligible.length === 5);

    // 9. Reject unverified, draft, or unpaid students
    const hasUnpaid = eligible.some((s: any) => s.studentId === 'stud-unpaid');
    const hasDraft = eligible.some((s: any) => s.studentId === 'stud-draft');
    assert('9. Reject unverified, draft, or unpaid students from seating', !hasUnpaid && !hasDraft);

    // 10. Auto seating allocation: Sequential pattern
    const seqResult = await service.autoAllocateSeating({
      examId: 'exam-summer-2026',
      centreId: centre1.id,
      seatPattern: 'SEQUENTIAL',
      prefix: 'SEQ-',
      startNumber: 1,
    }, adminUser);
    assert('10. Auto seating allocation under Sequential pattern', seqResult.summary.allocatedCount === 5);

    // 11. Auto seating allocation: Alternate pattern
    const altResult = await service.autoAllocateSeating({
      examId: 'exam-summer-2026',
      centreId: centre1.id,
      seatPattern: 'ALTERNATE',
      prefix: 'ALT-',
      startNumber: 101,
    }, adminUser);
    assert('11. Auto seating allocation under Alternate pattern', altResult.summary.allocatedCount === 5);

    // 12. Auto seating allocation: Row/Column pattern
    const rowColResult = await service.autoAllocateSeating({
      examId: 'exam-summer-2026',
      centreId: centre1.id,
      seatPattern: 'ROW_COLUMN',
    }, adminUser);
    assert('12. Auto seating allocation under Row/Column pattern', rowColResult.summary.allocatedCount === 5);

    // 13. Reject auto-allocation when total eligible students exceed capacity
    // Try allocating only to room1 (capacity = 2) for 5 eligible students
    let insufficientCapRejected = false;
    try {
      await service.autoAllocateSeating({
        examId: 'exam-summer-2026',
        roomIds: [room1.id],
      }, adminUser);
    } catch (e: any) {
      insufficientCapRejected = e.message.includes('Insufficient examination capacity');
    }
    assert('13. Reject auto-allocation on insufficient capacity with "Insufficient examination capacity."', insufficientCapRejected);

    // 14. Ensure at most one active seat per candidate per exam
    const allSeating = await service.getExamSeating('exam-summer-2026', {}, adminUser);
    const studentAllocIds = allSeating.allocations.map((a: any) => a.studentId);
    const hasUniqueStudents = new Set(studentAllocIds).size === studentAllocIds.length;
    assert('14. Ensure at most one active seat per candidate per exam (no duplicates)', hasUniqueStudents && studentAllocIds.length === 5);

    // 15. Prevent double-allocation of same seat to different students
    const roomSeatKeys = allSeating.allocations.map((a: any) => `${a.roomId}-${a.seatNumber}`);
    const hasUniqueSeats = new Set(roomSeatKeys).size === roomSeatKeys.length;
    assert('15. Prevent double-allocation of the same seat to different students', hasUniqueSeats);

    // 16. Manual seat reallocation requiring mandatory reason
    const firstAlloc = allSeating.allocations[0];
    let emptyReasonRejected = false;
    try {
      await service.manualChangeSeat({
        seatAllocationId: firstAlloc.id,
        newRoomId: room2.id,
        newSeatNumber: 'S-99',
        reason: '   ',
      }, adminUser);
    } catch (e: any) {
      emptyReasonRejected = e.message.includes('reason is required');
    }
    assert('16. Manual seat reallocation requires mandatory reason', emptyReasonRejected);

    // 17. Record complete audit trail in ExamSeatChangeHistory on manual seat change
    const changeResult = await service.manualChangeSeat({
      seatAllocationId: firstAlloc.id,
      newRoomId: room2.id,
      newSeatNumber: 'S-99',
      reason: 'Wheelchair accessibility ramp request on ground floor',
    }, adminUser);
    const updatedAlloc = await service.getExamSeating('exam-summer-2026', {}, adminUser);
    const changedRec = updatedAlloc.allocations.find((a: any) => a.id === firstAlloc.id);
    assert('17. Record complete audit trail in ExamSeatChangeHistory', changedRec.history.length >= 1 && changedRec.seatNumber === 'S-99');

    // 18. Sync seat allocation changes to Hall Ticket with requiresReissue flag
    const syncedHt = mockPrisma.hallTickets.find(h => h.studentId === firstAlloc.studentId);
    assert('18. Sync seat allocation to Hall Ticket and flag requiresReissue', syncedHt?.seatNumber === 'S-99' && syncedHt?.requiresReissue === true);

    // 19. Assign EDP duty to staff member with mandatory fields
    const edpDutyRes = await service.assignEdpDuty({
      examId: 'exam-summer-2026',
      dutyDate: '2026-05-15',
      shift: 'MORNING',
      centreId: centre1.id,
      staffUserId: 'staff-1',
      dutyType: 'EDP_OPERATOR',
      remarks: 'In charge of CCTV monitoring and paper packet verification',
    }, adminUser);
    const edpDuty1 = edpDutyRes.duty;
    assert('19. Assign EDP duty to staff member with mandatory fields', edpDuty1.dutyNo.startsWith('EXAM-EDP-') && edpDuty1.status === 'ASSIGNED');

    // 20. Reject overlapping EDP duty assignment for same staff on same date & shift
    let overlapRejected = false;
    try {
      await service.assignEdpDuty({
        examId: 'exam-summer-2026',
        dutyDate: '2026-05-15',
        shift: 'MORNING',
        centreId: centre1.id,
        staffUserId: 'staff-1',
        dutyType: 'TECHNICAL_SUPPORT',
      }, adminUser);
    } catch (e: any) {
      overlapRejected = e.message.includes('already has an assigned duty');
    }
    assert('20. Reject overlapping EDP duty on same date & shift', overlapRejected);

    // 21. EDP duty decline requiring mandatory rejection reason & status tracking
    let emptyDeclineRejected = false;
    try {
      await service.updateEdpDutyStatus(edpDuty1.id, {
        status: 'REJECTED',
        rejectionReason: '',
      }, { id: 'staff-1', name: 'Prof. Ananya Roy', role: 'FACULTY' });
    } catch (e: any) {
      emptyDeclineRejected = e.message.includes('rejection reason is required');
    }
    assert('21a. Reject duty decline without mandatory rejection reason', emptyDeclineRejected);

    const declinedDutyRes = await service.updateEdpDutyStatus(edpDuty1.id, {
      status: 'REJECTED',
      rejectionReason: 'Approved medical surgery scheduled on examination date',
    }, { id: 'staff-1', name: 'Prof. Ananya Roy', role: 'FACULTY' });
    const declinedDuty = declinedDutyRes.duty;
    assert('21b. EDP duty declined with mandatory reason & status updated', declinedDuty.status === 'REJECTED' && declinedDuty.rejectionReason?.includes('medical surgery'));

  } catch (err: any) {
    console.error('Unexpected error during test execution:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests.`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5TestSuite();
