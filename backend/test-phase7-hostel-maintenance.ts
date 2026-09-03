import { HostelService } from './src/hostel/hostel.service';
import { MaintenanceCategoryEnum, MaintenancePriorityEnum } from './src/hostel/dto/maintenance.dto';

// In-Memory Mock Prisma Service for Phase 7
class MockPrismaService {
  public hostels: any[] = [];
  public hostelRooms: any[] = [];
  public hostelBeds: any[] = [];
  public hostelAllotments: any[] = [];
  public hostelVisitors: any[] = [];
  public hostelVisitorLogs: any[] = [];
  public students: any[] = [];
  public hostelMaintenanceRequests: any[] = [];
  public _historyList: any[] = [];
  public _attachmentList: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.students = [
      { id: 'stud-01', firstName: 'Aarav', lastName: 'Patel', enrollmentNo: '24SSIU01001', email: 'aarav@ssiu.edu.in', phone: '9825000001', instituteId: 'inst-01', departmentId: 'dept-01', batchId: 'batch-01' },
      { id: 'stud-02', firstName: 'Priya', lastName: 'Mehta', enrollmentNo: '24SSIU01002', email: 'priya@ssiu.edu.in', phone: '9825000002', instituteId: 'inst-01', departmentId: 'dept-01', batchId: 'batch-01' },
      { id: 'stud-03', firstName: 'Rohan', lastName: 'Shah', enrollmentNo: '24SSIU01003', email: 'rohan@ssiu.edu.in', phone: '9825000003', instituteId: 'inst-01', departmentId: 'dept-01', batchId: 'batch-01' },
    ];
  }

  $transaction(callback: (tx: any) => Promise<any>) {
    return callback(this);
  }

  student = {
    findUnique: async (args: any) => {
      return this.students.find((s) => s.id === args.where.id) || null;
    },
  };

  hostel = {
    findUnique: async (args: any) => {
      if (args.where.code) {
        return this.hostels.find((h) => h.code === args.where.code) || null;
      }
      return this.hostels.find((h) => h.id === args.where.id) || null;
    },
    create: async (args: any) => {
      const newH = { id: `hst-${this.hostels.length + 1}`, ...args.data };
      this.hostels.push(newH);
      return newH;
    },
    findMany: async (args?: any) => {
      return this.hostels.map((h) => {
        const rooms = this.hostelRooms.filter((r) => r.hostelId === h.id);
        const allotments = this.hostelAllotments.filter((a) => a.hostelId === h.id && a.status === 'ACTIVE');
        return {
          ...h,
          rooms,
          allotments,
          _count: { rooms: rooms.length, allotments: allotments.length },
        };
      });
    },
    update: async (args: any) => {
      const idx = this.hostels.findIndex((h) => h.id === args.where.id);
      if (idx !== -1) {
        this.hostels[idx] = { ...this.hostels[idx], ...args.data };
        return this.hostels[idx];
      }
      return null;
    },
    count: async () => this.hostels.length,
  };

  hostelRoom = {
    findUnique: async (args: any) => {
      if (args.where.hostelId_roomNumber) {
        return (
          this.hostelRooms.find(
            (r) =>
              r.hostelId === args.where.hostelId_roomNumber.hostelId &&
              r.roomNumber === args.where.hostelId_roomNumber.roomNumber
          ) || null
        );
      }
      const room = this.hostelRooms.find((r) => r.id === args.where.id);
      if (!room) return null;
      const beds = this.hostelBeds.filter((b) => b.roomId === room.id);
      const allotments = this.hostelAllotments.filter((a) => a.roomId === room.id && a.status === 'ACTIVE');
      return { ...room, beds, allotments };
    },
    create: async (args: any) => {
      const newR = { id: `room-${this.hostelRooms.length + 1}`, ...args.data, occupiedBeds: 0 };
      this.hostelRooms.push(newR);
      return newR;
    },
    findMany: async (args?: any) => {
      let list = [...this.hostelRooms];
      if (args?.where?.hostelId) {
        list = list.filter((r) => r.hostelId === args.where.hostelId);
      }
      return list.map((r) => {
        const hostel = this.hostels.find((h) => h.id === r.hostelId);
        const beds = this.hostelBeds.filter((b) => b.roomId === r.id);
        const allotments = this.hostelAllotments.filter((a) => a.roomId === r.id && a.status === 'ACTIVE');
        return { ...r, hostel, beds, allotments };
      });
    },
    update: async (args: any) => {
      const idx = this.hostelRooms.findIndex((r) => r.id === args.where.id);
      if (idx !== -1) {
        this.hostelRooms[idx] = { ...this.hostelRooms[idx], ...args.data };
        return this.hostelRooms[idx];
      }
      return null;
    },
    count: async () => this.hostelRooms.length,
  };

  hostelBed = {
    findUnique: async (args: any) => {
      return this.hostelBeds.find((b) => b.id === args.where.id) || null;
    },
    create: async (args: any) => {
      const newB = { id: `bed-${this.hostelBeds.length + 1}`, ...args.data };
      this.hostelBeds.push(newB);
      return newB;
    },
    createMany: async (args: any) => {
      for (const item of args.data) {
        this.hostelBeds.push({ id: `bed-${this.hostelBeds.length + 1}`, ...item });
      }
      return { count: args.data.length };
    },
    update: async (args: any) => {
      const idx = this.hostelBeds.findIndex((b) => b.id === args.where.id);
      if (idx !== -1) {
        this.hostelBeds[idx] = { ...this.hostelBeds[idx], ...args.data };
        return this.hostelBeds[idx];
      }
      return null;
    },
    count: async (args?: any) => {
      if (args?.where?.status) {
        return this.hostelBeds.filter((b) => b.status === args.where.status).length;
      }
      return this.hostelBeds.length;
    },
  };

  hostelAllotment = {
    findFirst: async (args: any) => {
      return (
        this.hostelAllotments.find((a) => {
          let match = true;
          if (args.where.studentId) match = match && a.studentId === args.where.studentId;
          if (args.where.status) match = match && a.status === args.where.status;
          return match;
        }) || null
      );
    },
    findUnique: async (args: any) => {
      const allot = this.hostelAllotments.find((a) => a.id === args.where.id);
      if (!allot) return null;
      const room = this.hostelRooms.find((r) => r.id === allot.roomId);
      return { ...allot, room };
    },
    create: async (args: any) => {
      const newA = { id: `allot-${this.hostelAllotments.length + 1}`, ...args.data, allottedDate: new Date() };
      this.hostelAllotments.push(newA);
      const student = this.students.find((s) => s.id === newA.studentId);
      const hostel = this.hostels.find((h) => h.id === newA.hostelId);
      const room = this.hostelRooms.find((r) => r.id === newA.roomId);
      const bed = this.hostelBeds.find((b) => b.id === newA.bedId);
      return { ...newA, student, hostel, room, bed };
    },
    findMany: async (args?: any) => {
      let list = [...this.hostelAllotments];
      if (args?.where?.studentId) list = list.filter((a) => a.studentId === args.where.studentId);
      if (args?.where?.hostelId) list = list.filter((a) => a.hostelId === args.where.hostelId);
      if (args?.where?.status) list = list.filter((a) => a.status === args.where.status);
      return list.map((a) => {
        const student = this.students.find((s) => s.id === a.studentId);
        const hostel = this.hostels.find((h) => h.id === a.hostelId);
        const room = this.hostelRooms.find((r) => r.id === a.roomId);
        const bed = this.hostelBeds.find((b) => b.id === a.bedId);
        return { ...a, student, hostel, room, bed };
      });
    },
    count: async (args?: any) => {
      let list = [...this.hostelAllotments];
      if (args?.where?.roomId) list = list.filter((a) => a.roomId === args.where.roomId);
      if (args?.where?.status) list = list.filter((a) => a.status === args.where.status);
      if (args?.where?.id?.not) list = list.filter((a) => a.id !== args.where.id.not);
      return list.length;
    },
    update: async (args: any) => {
      const idx = this.hostelAllotments.findIndex((a) => a.id === args.where.id);
      if (idx !== -1) {
        this.hostelAllotments[idx] = { ...this.hostelAllotments[idx], ...args.data };
        const allot = this.hostelAllotments[idx];
        const student = this.students.find((s) => s.id === allot.studentId);
        const hostel = this.hostels.find((h) => h.id === allot.hostelId);
        const room = this.hostelRooms.find((r) => r.id === allot.roomId);
        const bed = this.hostelBeds.find((b) => b.id === allot.bedId);
        return { ...allot, student, hostel, room, bed };
      }
      return null;
    },
  };

  hostelMaintenanceRequest = {
    create: async (args: any) => {
      const newReq = {
        id: `mnt-${this.hostelMaintenanceRequests.length + 1}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.hostelMaintenanceRequests.push(newReq);
      const student = this.students.find((s) => s.id === newReq.studentId);
      const hostel = this.hostels.find((h) => h.id === newReq.hostelId);
      const room = this.hostelRooms.find((r) => r.id === newReq.roomId);
      const history = this._historyList.filter((h) => h.requestId === newReq.id);
      const attachments = this._attachmentList.filter((att) => att.requestId === newReq.id);
      return { ...newReq, student, hostel, room, history, attachments };
    },
    findUnique: async (args: any) => {
      const req = this.hostelMaintenanceRequests.find((r) => r.id === args.where.id);
      if (!req) return null;
      const student = this.students.find((s) => s.id === req.studentId);
      const hostel = this.hostels.find((h) => h.id === req.hostelId);
      const room = this.hostelRooms.find((r) => r.id === req.roomId);
      const history = this._historyList.filter((h) => h.requestId === req.id);
      const attachments = this._attachmentList.filter((att) => att.requestId === req.id);
      return { ...req, student, hostel, room, history, attachments };
    },
    findMany: async (args?: any) => {
      let list = [...this.hostelMaintenanceRequests];
      if (args?.where?.studentId) list = list.filter((r) => r.studentId === args.where.studentId);
      if (args?.where?.assignedToStaffId) list = list.filter((r) => r.assignedToStaffId === args.where.assignedToStaffId);
      if (args?.where?.hostelId) list = list.filter((r) => r.hostelId === args.where.hostelId);
      if (args?.where?.category) list = list.filter((r) => r.category === args.where.category);
      if (args?.where?.priority) list = list.filter((r) => r.priority === args.where.priority);
      if (args?.where?.status) {
        if (typeof args.where.status === 'string') {
          list = list.filter((r) => r.status === args.where.status);
        } else if (args.where.status.in) {
          list = list.filter((r) => args.where.status.in.includes(r.status));
        } else if (args.where.status.notIn) {
          list = list.filter((r) => !args.where.status.notIn.includes(r.status));
        }
      }
      if (args?.where?.slaDueDate?.lt) {
        list = list.filter((r) => r.slaDueDate && new Date(r.slaDueDate) < args.where.slaDueDate.lt);
      }

      return list.map((r) => {
        const student = this.students.find((s) => s.id === r.studentId);
        const hostel = this.hostels.find((h) => h.id === r.hostelId);
        const room = this.hostelRooms.find((r) => r.id === r.roomId);
        const history = this._historyList.filter((h) => h.requestId === r.id);
        const attachments = this._attachmentList.filter((att) => att.requestId === r.id);
        return { ...r, student, hostel, room, history, attachments };
      });
    },
    update: async (args: any) => {
      const idx = this.hostelMaintenanceRequests.findIndex((r) => r.id === args.where.id);
      if (idx !== -1) {
        this.hostelMaintenanceRequests[idx] = { ...this.hostelMaintenanceRequests[idx], ...args.data, updatedAt: new Date() };
        const req = this.hostelMaintenanceRequests[idx];
        const student = this.students.find((s) => s.id === req.studentId);
        const hostel = this.hostels.find((h) => h.id === req.hostelId);
        const room = this.hostelRooms.find((r) => r.id === req.roomId);
        const history = this._historyList.filter((h) => h.requestId === req.id);
        const attachments = this._attachmentList.filter((att) => att.requestId === req.id);
        return { ...req, student, hostel, room, history, attachments };
      }
      return null;
    },
    count: async (args?: any) => {
      return (await this.hostelMaintenanceRequest.findMany(args)).length;
    },
  };

  hostelMaintenanceHistory = {
    create: async (args: any) => {
      const newHist = { id: `hist-${this._historyList.length + 1}`, ...args.data, timestamp: new Date() };
      this._historyList.push(newHist);
      return newHist;
    },
  };

  hostelMaintenanceAttachment = {
    create: async (args: any) => {
      const newAtt = { id: `att-${this._attachmentList.length + 1}`, ...args.data, createdAt: new Date() };
      this._attachmentList.push(newAtt);
      return newAtt;
    },
  };

  hostelVisitor = {
    create: async (args: any) => {
      const newV = { id: `vis-${this.hostelVisitors.length + 1}`, ...args.data, createdAt: new Date() };
      this.hostelVisitors.push(newV);
      const student = this.students.find((s) => s.id === newV.studentId);
      const hostel = this.hostels.find((h) => h.id === newV.hostelId);
      const room = this.hostelRooms.find((r) => r.id === newV.roomId);
      return { ...newV, student, hostel, room };
    },
    findUnique: async (args: any) => {
      const v = this.hostelVisitors.find((item) => item.id === args.where.id);
      if (!v) return null;
      const logs = this.hostelVisitorLogs.filter((l) => l.visitorId === v.id);
      return { ...v, logs };
    },
    findMany: async () => this.hostelVisitors,
    update: async (args: any) => {
      const idx = this.hostelVisitors.findIndex((v) => v.id === args.where.id);
      if (idx !== -1) {
        this.hostelVisitors[idx] = { ...this.hostelVisitors[idx], ...args.data };
        return this.hostelVisitors[idx];
      }
      return null;
    },
    count: async () => this.hostelVisitors.length,
  };

  hostelVisitorLog = {
    create: async (args: any) => {
      const newLog = { id: `log-${this.hostelVisitorLogs.length + 1}`, ...args.data, createdAt: new Date() };
      this.hostelVisitorLogs.push(newLog);
      return newLog;
    },
  };

  hostelApplication = { count: async () => 0 };
  outpassRequest = { count: async () => 0 };
  mess = { findMany: async () => [] };
}

// ── Test Runner ─────────────────────────────────────────────────────────────
async function runPhase7Tests() {
  console.log('\n===============================================================');
  console.log('PHASE 7 — HOSTEL MANAGEMENT + MAINTENANCE REQUEST TEST SUITE');
  console.log('===============================================================\n');

  const mockPrisma = new MockPrismaService();
  const service = new HostelService(mockPrisma as any);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Hostel Master Creation
  console.log('▶ Scenario 1: Hostel Master Registration & Unique Code Constraint');
  const h1 = await service.createHostel({
    code: 'BH-1',
    name: 'Vivekananda Boys Hostel (Block A)',
    hostelType: 'STANDARD',
    gender: 'BOYS',
    building: 'Block A',
    capacity: 150,
    wardenName: 'Dr. Suresh Patel',
  });
  assert(h1.code === 'BH-1' && h1.capacity === 150, 'Hostel BH-1 registered successfully');

  let duplicateCaught = false;
  try {
    await service.createHostel({
      code: 'BH-1',
      name: 'Duplicate Hostel',
    });
  } catch (err: any) {
    duplicateCaught = true;
  }
  assert(duplicateCaught, 'Prevented creation of duplicate hostel code');

  // 2. Room Management & Capacity
  console.log('\n▶ Scenario 2: Room Addition & Initial Bed Creation');
  const room1 = await service.createRoom({
    hostelId: h1.id,
    roomNumber: '101',
    floor: 1,
    capacity: 2,
    roomType: 'DOUBLE',
  });
  assert(room1.roomNumber === '101' && room1.capacity === 2, 'Room 101 created with capacity 2');
  assert(mockPrisma.hostelBeds.length === 2, '2 beds automatically generated for Room 101');

  // 3. Bed Allotment & Single Active Check
  console.log('\n▶ Scenario 3: Bed Allotment & Duplicate Active Allocation Prevention');
  const allot1 = await service.allotBed({
    studentId: 'stud-01',
    hostelId: h1.id,
    roomId: room1.id,
  });
  assert(allot1.status === 'ACTIVE' && allot1.allotmentNo.startsWith('HST-ALL-2026-'), 'Student 1 allotted Bed A');

  let duplicateActiveCaught = false;
  try {
    await service.allotBed({
      studentId: 'stud-01',
      hostelId: h1.id,
      roomId: room1.id,
    });
  } catch (err: any) {
    duplicateActiveCaught = true;
  }
  assert(duplicateActiveCaught, 'Duplicate active allotment for same student strictly blocked');

  // 4. Room Maximum Capacity Enforcement
  console.log('\n▶ Scenario 4: Room Maximum Capacity Enforcement');
  const allot2 = await service.allotBed({
    studentId: 'stud-02',
    hostelId: h1.id,
    roomId: room1.id,
  });
  assert(allot2.status === 'ACTIVE', 'Student 2 allotted Bed B (Room full at 2/2)');

  let roomFullCaught = false;
  try {
    await service.allotBed({
      studentId: 'stud-03',
      hostelId: h1.id,
      roomId: room1.id,
    });
  } catch (err: any) {
    roomFullCaught = true;
  }
  assert(roomFullCaught, 'Attempt to allot bed beyond room capacity rejected');

  // 5. Visitor Workflow
  console.log('\n▶ Scenario 5: Visitor Pass Issuance & Student Modification Guard');
  const vis1 = await service.registerVisitor(
    { role: 'SECURITY', id: 'sec-01', name: 'Security Guard' },
    {
      visitorName: 'Mukesh Patel',
      contactPhone: '9825012345',
      studentId: 'stud-01',
      hostelId: h1.id,
      roomId: room1.id,
      relation: 'PARENT',
      purpose: 'Family Visit',
    } as any
  );
  assert(vis1.passNumber.startsWith('VIS-2026-') && vis1.status === 'CHECKED_IN', 'Security checked in visitor');

  let studentEditBlocked = false;
  try {
    await service.updateVisitor(vis1.id, { role: 'STUDENT', id: 'stud-01' }, { visitorName: 'Hacked Name' });
  } catch (err: any) {
    studentEditBlocked = true;
  }
  assert(studentEditBlocked, 'Student forbidden from altering visitor record after entry');

  // 6. Maintenance Request Lifecycle: Creation & SLA
  console.log('\n▶ Scenario 6: Maintenance Request Creation & SLA Determination');
  const mnt1 = await service.createMaintenanceRequest(
    { id: 'stud-01', role: 'STUDENT', name: 'Aarav Patel' },
    {
      hostelId: h1.id,
      roomId: room1.id,
      category: MaintenanceCategoryEnum.ELECTRICAL,
      title: 'Ceiling Fan Regulator Malfunction',
      description: 'Regulator knob broken, fan spinning at max speed',
      priority: MaintenancePriorityEnum.URGENT,
      photoUrl: 'https://storage.ssiu.edu.in/photos/fan.jpg',
    }
  );
  assert(mnt1.requestNo.startsWith('HOST-MNT-2026-'), 'Generated RequestNo in format HOST-MNT-YYYY-XXXXXX');
  assert(mnt1.slaHours === 4, 'URGENT priority assigned 4 hours resolution SLA');
  assert(mnt1.status === 'SUBMITTED', 'Initial status set to SUBMITTED');
  assert(mockPrisma._historyList.length === 1, 'Chronological creation history logged');
  assert(mockPrisma._attachmentList.length === 1, 'Problem evidence photo linked to request');

  // 7. Role-Based Scoping
  console.log('\n▶ Scenario 7: Role-Based Ticket Visibility Scoping');
  const studentView = await service.getMaintenanceRequests({ role: 'STUDENT', id: 'stud-01' }, {});
  assert(studentView.length === 1 && studentView[0].id === mnt1.id, 'Student sees only their own ticket');

  const otherStudentView = await service.getMaintenanceRequests({ role: 'STUDENT', id: 'stud-02' }, {});
  assert(otherStudentView.length === 0, 'Other student cannot see un-owned tickets');

  // 8. Maintenance Head Assignment
  console.log('\n▶ Scenario 8: Maintenance Head Assignment & Staff Notification');
  const assigned = await service.assignMaintenanceRequest(
    mnt1.id,
    {
      staffId: 'staff-01',
      staffName: 'Ramesh Sharma (Senior Electrician)',
      remarks: 'Urgent repair scheduled for 2 PM',
    },
    { id: 'user-head', name: 'Dr. Suresh Patel', role: 'MAINTENANCE_HEAD' }
  );
  assert(assigned.status === 'ASSIGNED' && assigned.assignedToStaffId === 'staff-01', 'Ticket transitioned to ASSIGNED');

  const staffView = await service.getMaintenanceRequests({ role: 'MAINTENANCE_STAFF', id: 'staff-01' }, {});
  assert(staffView.length === 1, 'Assigned technician sees ticket in assigned work queue');

  // 9. Maintenance Staff Commences Work
  console.log('\n▶ Scenario 9: Maintenance Staff Starts Work');
  const inProgress = await service.startMaintenanceWork(mnt1.id, { id: 'staff-01', role: 'MAINTENANCE_STAFF' });
  assert(inProgress.status === 'IN_PROGRESS', 'Ticket transitioned to IN_PROGRESS');

  // 10. Maintenance Staff Put On Hold (Mandatory Reason)
  console.log('\n▶ Scenario 10: Put On Hold With Mandatory Reason');
  const onHold = await service.holdMaintenanceRequest(
    mnt1.id,
    { holdReason: 'Awaiting replacement capacitor from store' },
    { id: 'staff-01', role: 'MAINTENANCE_STAFF' }
  );
  assert(onHold.status === 'ON_HOLD' && onHold.holdReason?.includes('capacitor'), 'Ticket transitioned to ON_HOLD');

  // 11. Maintenance Staff Marks Resolved
  console.log('\n▶ Scenario 11: Technician Resolves Ticket with Completion Proof');
  const resolved = await service.resolveMaintenanceRequest(
    mnt1.id,
    {
      resolutionDetails: 'Replaced capacitor and regulator knob. Fan tested operational.',
      resolvedPhotoUrl: 'https://storage.ssiu.edu.in/photos/fixed_fan.jpg',
    },
    { id: 'staff-01', role: 'MAINTENANCE_STAFF' }
  );
  assert(resolved.status === 'RESOLVED', 'Ticket marked RESOLVED');
  assert(mockPrisma._attachmentList.length === 2, 'Completion proof photo attached');

  // 12. Student Reopen Workflow
  console.log('\n▶ Scenario 12: Student Reopens Ticket with Reason');
  const reopened = await service.reopenMaintenanceRequest(
    mnt1.id,
    { reopenedReason: 'Speed regulator still slipping when set to speed 2' },
    { id: 'stud-01', role: 'STUDENT' }
  );
  assert(reopened.status === 'REOPENED', 'Ticket successfully reopened by student');

  // Re-resolve for final confirmation test
  await service.resolveMaintenanceRequest(
    mnt1.id,
    { resolutionDetails: 'Re-tightened regulator spindle. Verified all 5 speed steps.' },
    { id: 'staff-01', role: 'MAINTENANCE_STAFF' }
  );

  // 13. Student Confirms Resolution & Rates Service
  console.log('\n▶ Scenario 13: Student Confirms Resolution & Submits Rating');
  const closed = await service.confirmResolution(
    mnt1.id,
    { rating: 5, feedback: 'Working perfectly now. Prompt service.' },
    { id: 'stud-01', role: 'STUDENT' }
  );
  assert(closed.status === 'CLOSED', 'Ticket CLOSED after student confirmation');
  assert(closed.studentRating === 5, 'Recorded 5-star rating and feedback');

  // 14. Audit History Verification
  console.log('\n▶ Scenario 14: Complete Chronological Lifecycle History Audit');
  const fullTicket = await service.getMaintenanceRequestById(mnt1.id, { role: 'HOSTEL_ADMIN' });
  const actions = fullTicket.history.map((h: any) => h.action);
  assert(
    actions.includes('CREATED') &&
      actions.includes('ASSIGNED') &&
      actions.includes('STARTED') &&
      actions.includes('ON_HOLD') &&
      actions.includes('RESOLVED') &&
      actions.includes('REOPENED') &&
      actions.includes('CONFIRMED'),
    'All 7 lifecycle transitions captured in audit history'
  );

  // 15. Hostel Reports Generation
  console.log('\n▶ Scenario 15: Hostel & Maintenance Reporting Engine');
  const occupancyReport: any = await service.getHostelReports('HOSTEL_OCCUPANCY');
  assert(occupancyReport.length === 1 && occupancyReport[0].code === 'BH-1', 'Generated Hostel Occupancy Report');

  const mntReport: any = await service.getHostelReports('MAINTENANCE_REQUEST_REPORT');
  assert(mntReport.length === 1 && mntReport[0].requestNo === mnt1.requestNo, 'Generated Maintenance Master Report');

  // Summary
  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
