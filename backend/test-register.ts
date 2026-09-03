import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './src/communication/register.service';
import { PrismaService } from './src/prisma/prisma.service';
import { RegisterController } from './src/communication/register.controller';
import {
  InwardStatusEnum,
  OutwardStatusEnum,
  RegisterPriorityEnum,
  RegisterModeEnum,
} from './src/communication/dto/register.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

async function runRegisterTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE INWARD & OUTWARD REGISTER TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    departments: new Map<string, any>(),
    users: new Map<string, any>(),
    inwards: new Map<string, any>(),
    outwards: new Map<string, any>(),
    auditLogs: new Map<string, any>(),
  };

  // Seed default data
  store.departments.set('dept-cse', { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' });
  store.departments.set('dept-admin', { id: 'dept-admin', code: 'ADMIN', name: 'University Central Administration' });

  store.users.set('usr-admin-01', { id: 'usr-admin-01', username: 'admin', erpId: 'ADM001', role: 'SUPER_ADMIN', authorityLevel: 1 });
  store.users.set('usr-staff-cse', { id: 'usr-staff-cse', username: 'cse_staff', erpId: 'STF001', role: 'FACULTY', authorityLevel: 5, faculty: { departmentId: 'dept-cse' } });
  store.users.set('usr-staff-admin', { id: 'usr-staff-admin', username: 'reg_staff', erpId: 'STF002', role: 'STAFF', authorityLevel: 5, departmentId: 'dept-admin' });

  const mockPrismaService = {
    department: {
      findMany: async () => Array.from(store.departments.values()),
      findUnique: async ({ where }: any) => store.departments.get(where.id),
    },
    user: {
      findUnique: async ({ where }: any) => store.users.get(where.id),
    },
    inwardRegister: {
      create: async ({ data }: any) => {
        const id = 'inw-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.inwards.set(id, record);
        return {
          ...record,
          department: store.departments.get(record.departmentId),
          receivedBy: store.users.get(record.receivedByUserId),
          assignedTo: store.users.get(record.assignedToUserId),
        };
      },
      findUnique: async ({ where }: any) => {
        const found = store.inwards.get(where.id);
        if (!found) return null;
        const logs = Array.from(store.auditLogs.values()).filter((l) => l.inwardId === where.id);
        return {
          ...found,
          department: store.departments.get(found.departmentId),
          receivedBy: store.users.get(found.receivedByUserId),
          assignedTo: store.users.get(found.assignedToUserId),
          auditLogs: logs.map((l) => ({ ...l, performedBy: store.users.get(l.performedByUserId) })),
        };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.inwards.values());
        if (where?.departmentId) list = list.filter((i) => i.departmentId === where.departmentId);
        if (where?.status) list = list.filter((i) => i.status === where.status);
        if (where?.priority) list = list.filter((i) => i.priority === where.priority);
        if (where?.receivedThrough) list = list.filter((i) => i.receivedThrough === where.receivedThrough);
        if (where?.OR) {
          const term = (where.OR[0]?.registerNo?.contains || where.OR[3]?.subject?.contains || '').toLowerCase();
          list = list.filter(
            (i) =>
              i.registerNo.toLowerCase().includes(term) ||
              i.senderName.toLowerCase().includes(term) ||
              i.subject.toLowerCase().includes(term)
          );
        }
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((i) => ({
          ...i,
          department: store.departments.get(i.departmentId),
          receivedBy: store.users.get(i.receivedByUserId),
          assignedTo: store.users.get(i.assignedToUserId),
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.inwards.values());
        if (where?.departmentId) list = list.filter((i) => i.departmentId === where.departmentId);
        if (where?.status) list = list.filter((i) => i.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.inwards.get(where.id);
        if (!existing) throw new Error('Inward not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.inwards.set(where.id, updated);
        return {
          ...updated,
          department: store.departments.get(updated.departmentId),
          receivedBy: store.users.get(updated.receivedByUserId),
          assignedTo: store.users.get(updated.assignedToUserId),
        };
      },
      delete: async ({ where }: any) => {
        const existing = store.inwards.get(where.id);
        store.inwards.delete(where.id);
        return existing;
      },
    },
    outwardRegister: {
      create: async ({ data }: any) => {
        const id = 'out-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.outwards.set(id, record);
        return {
          ...record,
          department: store.departments.get(record.departmentId),
          sentBy: store.users.get(record.sentByUserId),
        };
      },
      findUnique: async ({ where }: any) => {
        const found = store.outwards.get(where.id);
        if (!found) return null;
        const logs = Array.from(store.auditLogs.values()).filter((l) => l.outwardId === where.id);
        return {
          ...found,
          department: store.departments.get(found.departmentId),
          sentBy: store.users.get(found.sentByUserId),
          auditLogs: logs.map((l) => ({ ...l, performedBy: store.users.get(l.performedByUserId) })),
        };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.outwards.values());
        if (where?.departmentId) list = list.filter((o) => o.departmentId === where.departmentId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        if (where?.priority) list = list.filter((o) => o.priority === where.priority);
        if (where?.mode) list = list.filter((o) => o.mode === where.mode);
        if (where?.OR) {
          const search = where.OR[0].dispatchNo.contains.toLowerCase();
          list = list.filter(
            (o) =>
              o.dispatchNo.toLowerCase().includes(search) ||
              o.receiverName.toLowerCase().includes(search) ||
              o.subject.toLowerCase().includes(search)
          );
        }
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((o) => ({
          ...o,
          department: store.departments.get(o.departmentId),
          sentBy: store.users.get(o.sentByUserId),
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.outwards.values());
        if (where?.departmentId) list = list.filter((o) => o.departmentId === where.departmentId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.outwards.get(where.id);
        if (!existing) throw new Error('Outward not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.outwards.set(where.id, updated);
        return {
          ...updated,
          department: store.departments.get(updated.departmentId),
          sentBy: store.users.get(updated.sentByUserId),
        };
      },
      delete: async ({ where }: any) => {
        const existing = store.outwards.get(where.id);
        store.outwards.delete(where.id);
        return existing;
      },
    },
    inwardOutwardAuditLog: {
      create: async ({ data }: any) => {
        const id = 'log-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.auditLogs.set(id, record);
        return record;
      },
      findMany: async ({ where }: any = {}) => {
        let list = Array.from(store.auditLogs.values());
        if (where?.recordType) list = list.filter((l) => l.recordType === where.recordType);
        if (where?.inwardId) list = list.filter((l) => l.inwardId === where.inwardId);
        if (where?.outwardId) list = list.filter((l) => l.outwardId === where.outwardId);
        return list.map((l) => ({ ...l, performedBy: store.users.get(l.performedByUserId) }));
      },
    },
    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RegisterService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<RegisterService>(RegisterService);
  const controller = new RegisterController(service);

  // Users
  const adminUser = { id: 'usr-admin-01', username: 'admin', role: 'SUPER_ADMIN', authorityLevel: 1 };
  const cseStaff = { id: 'usr-staff-cse', username: 'cse_staff', role: 'FACULTY', authorityLevel: 5, faculty: { departmentId: 'dept-cse' } };
  const adminStaff = { id: 'usr-staff-admin', username: 'reg_staff', role: 'STAFF', authorityLevel: 5, departmentId: 'dept-admin' };

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

  // ── TEST 1: Create Inward Register Entry ──────────────────────────────────
  console.log('--- 1. Inward Register Creation ---');
  const inward1 = await service.createInward(cseStaff.id, {
    senderName: 'Joint Director of Technical Education',
    senderOrganization: 'Govt. of Gujarat',
    senderEmail: 'jdte@gujarat.gov.in',
    subject: 'AICTE Extension of Approval (EoA) for Academic Year 2026-27',
    departmentId: 'dept-cse',
    receivedThrough: RegisterModeEnum.POST,
    priority: RegisterPriorityEnum.HIGH,
    documentUrl: 'https://cdn.ssiu.edu.in/eoa_2026.pdf',
    attachmentName: 'eoa_2026.pdf',
    remarks: 'Received original sanctioned intake document.',
  });
  assert('Inward created with safe unique INW register number', inward1.registerNo.startsWith('INW-'));
  assert('Inward has initial status RECEIVED', inward1.status === InwardStatusEnum.RECEIVED);
  assert('Inward records department and priority', inward1.departmentId === 'dept-cse' && inward1.priority === 'HIGH');

  // ── TEST 2: Update Inward Details ─────────────────────────────────────────
  console.log('\n--- 2. Update Inward Register Entry ---');
  const updatedInward = await service.updateInward(inward1.id, cseStaff, {
    dueDate: '2026-08-30',
    remarks: 'Forwarded to HOD CSE for compliance verification.',
  });
  assert('Inward remarks and due date updated', updatedInward.remarks.includes('compliance verification'));

  // ── TEST 3: Update Inward Status & Assignment ────────────────────────────
  console.log('\n--- 3. Inward Status Transition & Assignment ---');
  const assignedInward = await service.updateInwardStatus(inward1.id, cseStaff, {
    status: InwardStatusEnum.ASSIGNED,
    assignedToUserId: cseStaff.id,
    remarks: 'Assigned to CSE Department Coordinator',
  });
  assert('Inward status transitioned to ASSIGNED', assignedInward.status === InwardStatusEnum.ASSIGNED);

  // ── TEST 4: Inward Audit History ─────────────────────────────────────────
  console.log('\n--- 4. Inward Audit Trail History ---');
  const inwardAudit = await service.getAuditHistory('INWARD', inward1.id);
  assert('Audit trail records CREATED, UPDATED, and STATUS_CHANGED', inwardAudit.length >= 3);
  assert('Audit log contains actor information', inwardAudit[0].performedBy.username === 'cse_staff');

  // ── TEST 5: Query & Filter Inwards ───────────────────────────────────────
  console.log('\n--- 5. Inward Querying, Filtering & Search ---');
  const inwardList = await service.getInwards(adminUser, {
    status: InwardStatusEnum.ASSIGNED,
    priority: RegisterPriorityEnum.HIGH,
    search: 'AICTE',
  });
  assert('Inward filtered search returns matching records', inwardList.data.length >= 1 && inwardList.meta.total >= 1);

  // ── TEST 6: Create Outward / Dispatch Register Entry ─────────────────────
  console.log('\n--- 6. Outward Register Creation ---');
  const outward1 = await service.createOutward(cseStaff.id, {
    receiverName: 'Member Secretary, AICTE Western Regional Office',
    receiverOrganization: 'All India Council for Technical Education',
    receiverAddress: 'Churchgate, Mumbai 400020',
    receiverEmail: 'wro@aicte-india.org',
    subject: 'Submission of Compliance Report on Faculty Cadre Ratio 2026',
    departmentId: 'dept-cse',
    mode: RegisterModeEnum.SPEED_POST,
    trackingNo: 'SP123456789IN',
    courierAgency: 'India Post Speed Post',
    priority: RegisterPriorityEnum.URGENT,
    documentUrl: 'https://cdn.ssiu.edu.in/compliance_report.pdf',
    attachmentName: 'compliance_report.pdf',
    remarks: 'Dispatched through university central postal desk.',
  });
  assert('Outward created with safe unique OUT dispatch number', outward1.dispatchNo.startsWith('OUT-'));
  assert('Outward has initial status PREPARED', outward1.status === OutwardStatusEnum.PREPARED);
  assert('Outward records tracking number and mode', outward1.trackingNo === 'SP123456789IN' && outward1.mode === 'SPEED_POST');

  // ── TEST 7: Update Outward Status (PREPARED -> DISPATCHED -> DELIVERED) ──
  console.log('\n--- 7. Outward Dispatch & Delivery Tracking ---');
  const dispatchedOutward = await service.updateOutwardStatus(outward1.id, cseStaff, {
    status: OutwardStatusEnum.DISPATCHED,
    remarks: 'Dispatched via Speed Post Counter Gandhinagar',
  });
  assert('Outward status updated to DISPATCHED', dispatchedOutward.status === OutwardStatusEnum.DISPATCHED);

  const deliveredOutward = await service.updateOutwardStatus(outward1.id, cseStaff, {
    status: OutwardStatusEnum.DELIVERED,
    deliveredDate: '2026-08-18',
    remarks: 'Delivered and acknowledged by AICTE WRO receipt section',
  });
  assert('Outward status updated to DELIVERED with delivery date', deliveredOutward.status === OutwardStatusEnum.DELIVERED);

  // ── TEST 8: Outward Audit History ────────────────────────────────────────
  console.log('\n--- 8. Outward Audit Trail History ---');
  const outwardAudit = await service.getAuditHistory('OUTWARD', outward1.id);
  assert('Outward audit trail captures complete dispatch lifecycle', outwardAudit.length >= 3);

  // ── TEST 9: Query & Filter Outwards ──────────────────────────────────────
  console.log('\n--- 9. Outward Querying & Multi-filter ---');
  const outwardList = await service.getOutwards(adminUser, {
    mode: RegisterModeEnum.SPEED_POST,
    search: 'AICTE',
  });
  assert('Outward search query returns matching dispatches', outwardList.data.length >= 1);

  // ── TEST 10: Department Scoping & RBAC Rules ─────────────────────────────
  console.log('\n--- 10. Department Scoping & RBAC Restrictions ---');
  let forbiddenCaught = false;
  try {
    // Admin staff trying to access CSE record
    await service.getInwardById(inward1.id, adminStaff);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403 || err.name === 'ForbiddenException' || err.message?.includes('Access denied')) {
      forbiddenCaught = true;
    }
  }
  assert('Departmental staff restricted from viewing other departments records', forbiddenCaught);

  const adminAccess = await service.getInwardById(inward1.id, adminUser);
  assert('Super Admin has university-wide access across all departments', adminAccess.id === inward1.id);

  // ── TEST 11: Register Dashboard Metrics & Summary Report ─────────────────
  console.log('\n--- 11. Register Reports & Volume Summaries ---');
  const metrics = await service.getRegisterDashboardMetrics();
  assert('Dashboard metrics returns inward and outward counters', metrics.inward.total >= 1 && metrics.outward.total >= 1);

  const deptReport = await service.getDepartmentRegisterSummary();
  assert('Department summary report returns inward and outward volume totals', deptReport.length >= 1 && 'grandTotal' in deptReport[0]);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runRegisterTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
