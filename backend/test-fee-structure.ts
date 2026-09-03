import { FeesService } from './src/fees/fees.service';
import { FeesController } from './src/fees/fees.controller';
import { FeeCategoryEnum, FeeFrequencyEnum, FeeStructureStatusEnum } from './src/fees/dto/fees.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

async function runFeeStructureMasterTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING UNIVERSITY FEE STRUCTURE MANAGEMENT (PHASE 2) TESTS');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // In-memory data store for Fee Structures, Items, Fee Heads, Audit Logs, Programs, Semesters
  const store = {
    institutes: new Map<string, any>(),
    departments: new Map<string, any>(),
    programs: new Map<string, any>(),
    semesters: new Map<string, any>(),
    feeHeads: new Map<string, any>(),
    feeStructures: new Map<string, any>(),
    feeStructureItems: new Map<string, any>(),
    feeStructureAuditLogs: new Map<string, any>(),
    feeHeadAuditLogs: new Map<string, any>(),
  };

  // Seed Reference Masters
  store.institutes.set('inst-sit', { id: 'inst-sit', code: 'SIT', name: 'Swarrnim Institute of Technology' });
  store.departments.set('dept-cse', { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering', instituteId: 'inst-sit' });
  store.programs.set('prog-btech-ce', { id: 'prog-btech-ce', code: 'BTECH-CE', name: 'B.Tech Computer Engineering', departmentId: 'dept-cse' });
  store.semesters.set('sem-5', { id: 'sem-5', semesterNumber: 5, code: 'SEM-5', name: 'Semester 5', programId: 'prog-btech-ce' });
  store.semesters.set('sem-6', { id: 'sem-6', semesterNumber: 6, code: 'SEM-6', name: 'Semester 6', programId: 'prog-btech-ce' });

  // Seed Fee Heads
  store.feeHeads.set('fh-tuition', { id: 'fh-tuition', code: 'TUITION', name: 'Tuition Fee', category: 'ACADEMIC', defaultAmount: new Prisma.Decimal(50000), isMandatory: true, isActive: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-dev', { id: 'fh-dev', code: 'DEV', name: 'Development Fee', category: 'ACADEMIC', defaultAmount: new Prisma.Decimal(10000), isMandatory: true, isActive: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-exam', { id: 'fh-exam', code: 'EXAM', name: 'Examination Fee', category: 'EXAMINATION', defaultAmount: new Prisma.Decimal(2500), isMandatory: true, isActive: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-library', { id: 'fh-library', code: 'LIBRARY', name: 'Library Fee', category: 'LIBRARY', defaultAmount: new Prisma.Decimal(1000), isMandatory: true, isActive: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-sports', { id: 'fh-sports', code: 'SPORTS', name: 'Sports Fee', category: 'STUDENT_ACTIVITY', defaultAmount: new Prisma.Decimal(500), isMandatory: true, isActive: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-hostel', { id: 'fh-hostel', code: 'HOSTEL', name: 'Hostel Accommodation', category: 'HOSTEL', defaultAmount: new Prisma.Decimal(35000), isMandatory: false, isActive: true, status: 'ACTIVE' });

  let idCounter = 1;

  const mockPrisma: any = {
    program: {
      findUnique: async ({ where }: any) => {
        const prog = store.programs.get(where.id);
        if (!prog) return null;
        return {
          ...prog,
          department: store.departments.get(prog.departmentId),
        };
      },
    },
    semester: {
      findUnique: async ({ where }: any) => store.semesters.get(where.id) || null,
    },
    feeHead: {
      findUnique: async ({ where }: any) => {
        if (where.id) return store.feeHeads.get(where.id) || null;
        if (where.code) {
          for (const h of store.feeHeads.values()) {
            if (h.code.toUpperCase() === where.code.toUpperCase()) return h;
          }
        }
        return null;
      },
      findMany: async () => Array.from(store.feeHeads.values()),
    },
    feeStructure: {
      findUnique: async ({ where }: any) => {
        const fs = store.feeStructures.get(where.id);
        if (!fs) return null;
        const items = Array.from(store.feeStructureItems.values())
          .filter(i => i.feeStructureId === fs.id)
          .map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
        const auditLogs = Array.from(store.feeStructureAuditLogs.values())
          .filter(l => l.feeStructureId === fs.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const prog = store.programs.get(fs.programId);
        const dept = prog ? store.departments.get(prog.departmentId) : null;
        const inst = dept ? store.institutes.get(dept.instituteId) : null;
        return {
          ...fs,
          items,
          auditLogs,
          program: prog ? { ...prog, department: dept ? { ...dept, institute: inst } : null } : null,
          semester: store.semesters.get(fs.semesterId),
          institute: inst,
          department: dept,
          _count: { accounts: 0, items: items.length },
        };
      },
      findFirst: async ({ where }: any) => {
        for (const fs of store.feeStructures.values()) {
          let match = true;
          if (where.programId && fs.programId !== where.programId) match = false;
          if (where.semesterId && fs.semesterId !== where.semesterId) match = false;
          if (where.academicYearCode && fs.academicYearCode !== where.academicYearCode) match = false;
          if (where.status && typeof where.status === 'object' && where.status.in) {
            if (!where.status.in.includes(fs.status)) match = false;
          }
          if (match) return fs;
        }
        return null;
      },
      findMany: async ({ where, skip = 0, take = 20, orderBy }: any) => {
        let list = Array.from(store.feeStructures.values());
        if (where) {
          if (where.OR) {
            list = list.filter(fs => {
              const prog = store.programs.get(fs.programId);
              return where.OR.some((clause: any) => {
                if (clause.structureCode?.contains && fs.structureCode?.toLowerCase().includes(clause.structureCode.contains.toLowerCase())) return true;
                if (clause.name?.contains && fs.name.toLowerCase().includes(clause.name.contains.toLowerCase())) return true;
                if (clause.program?.code?.contains && prog?.code.toLowerCase().includes(clause.program.code.contains.toLowerCase())) return true;
                return false;
              });
            });
          }
          if (where.programId) list = list.filter(fs => fs.programId === where.programId);
          if (where.semesterId) list = list.filter(fs => fs.semesterId === where.semesterId);
          if (where.academicYearCode) list = list.filter(fs => fs.academicYearCode === where.academicYearCode);
          if (where.status) list = list.filter(fs => fs.status === where.status);
        }
        return list.slice(skip, skip + take).map(fs => {
          const items = Array.from(store.feeStructureItems.values()).filter(i => i.feeStructureId === fs.id);
          return {
            ...fs,
            items: items.map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) })),
            program: store.programs.get(fs.programId),
            semester: store.semesters.get(fs.semesterId),
            _count: { accounts: 0, items: items.length },
          };
        });
      },
      count: async ({ where }: any) => {
        let list = Array.from(store.feeStructures.values());
        if (where) {
          if (where.programId) list = list.filter(fs => fs.programId === where.programId);
          if (where.semesterId) list = list.filter(fs => fs.semesterId === where.semesterId);
          if (where.status) list = list.filter(fs => fs.status === where.status);
        }
        return list.length;
      },
      create: async ({ data }: any) => {
        const id = `fs-${idCounter++}`;
        const items = data.items?.create || [];
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        delete record.items;
        store.feeStructures.set(id, record);

        for (const item of items) {
          const itemId = `fsi-${idCounter++}`;
          store.feeStructureItems.set(itemId, {
            id: itemId,
            feeStructureId: id,
            ...item,
            amount: new Prisma.Decimal(item.amount),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return {
          ...record,
          items: Array.from(store.feeStructureItems.values()).filter(i => i.feeStructureId === id),
          program: store.programs.get(record.programId),
          semester: store.semesters.get(record.semesterId),
        };
      },
      update: async ({ where, data }: any) => {
        const existing = store.feeStructures.get(where.id);
        if (!existing) throw new NotFoundException('Record not found');
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.feeStructures.set(where.id, updated);
        return {
          ...updated,
          items: Array.from(store.feeStructureItems.values()).filter(i => i.feeStructureId === where.id),
          program: store.programs.get(updated.programId),
          semester: store.semesters.get(updated.semesterId),
        };
      },
    },
    feeStructureItem: {
      findUnique: async ({ where }: any) => {
        const item = store.feeStructureItems.get(where.id);
        if (!item) return null;
        return {
          ...item,
          feeHead: store.feeHeads.get(item.feeHeadId),
        };
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.feeStructureItems.values());
        if (where?.feeStructureId) {
          list = list.filter(i => i.feeStructureId === where.feeStructureId);
        }
        return list;
      },
      create: async ({ data }: any) => {
        const id = `fsi-${idCounter++}`;
        const item = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.feeStructureItems.set(id, item);
        return {
          ...item,
          feeHead: store.feeHeads.get(item.feeHeadId),
        };
      },
      createMany: async ({ data }: any) => {
        for (const d of data) {
          const id = `fsi-${idCounter++}`;
          store.feeStructureItems.set(id, {
            id,
            ...d,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return { count: data.length };
      },
      update: async ({ where, data }: any) => {
        const existing = store.feeStructureItems.get(where.id);
        if (!existing) throw new NotFoundException('Item not found');
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.feeStructureItems.set(where.id, updated);
        return {
          ...updated,
          feeHead: store.feeHeads.get(updated.feeHeadId),
        };
      },
      delete: async ({ where }: any) => {
        const existing = store.feeStructureItems.get(where.id);
        store.feeStructureItems.delete(where.id);
        return existing;
      },
      deleteMany: async ({ where }: any) => {
        if (where?.feeStructureId) {
          for (const [id, item] of store.feeStructureItems.entries()) {
            if (item.feeStructureId === where.feeStructureId) {
              store.feeStructureItems.delete(id);
            }
          }
        }
        return { count: 1 };
      },
    },
    feeStructureAuditLog: {
      create: async ({ data }: any) => {
        const id = `fsal-${idCounter++}`;
        const log = {
          id,
          ...data,
          createdAt: new Date(),
        };
        store.feeStructureAuditLogs.set(id, log);
        return log;
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.feeStructureAuditLogs.values());
        if (where?.feeStructureId) {
          list = list.filter(l => l.feeStructureId === where.feeStructureId);
        }
        return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
    },
    $transaction: async (cb: (tx: any) => Promise<any>) => cb(mockPrisma),
  };

  const feesService = new FeesService(mockPrisma);
  const feesController = new FeesController(feesService);

  const mockAdminReq = {
    user: {
      id: 'usr-accounts-admin',
      username: 'accounts_admin',
      firstName: 'Finance',
      lastName: 'Director',
      roles: ['ACCOUNTS_ADMIN', 'UNIVERSITY_ADMIN'],
    },
  };

  try {
    // 1. Create Complete Fee Structure with Example Tariff
    console.log('--- TEST GROUP 1: Create Fee Structure & Automatic Total ---');
    const createDto = {
      structureCode: 'FS-BTECH-CE-SEM5-2026-V1',
      programId: 'prog-btech-ce',
      semesterId: 'sem-5',
      academicYearCode: '2026-27',
      name: 'B.Tech Computer Engineering Semester 5 Fee Structure (AY 2026-27)',
      description: 'Annual regular semester fee structure',
      status: FeeStructureStatusEnum.DRAFT,
      items: [
        { feeHeadId: 'fh-tuition', amount: 50000, isMandatory: true, frequency: FeeFrequencyEnum.PER_SEMESTER, sequence: 1 },
        { feeHeadId: 'fh-dev', amount: 10000, isMandatory: true, frequency: FeeFrequencyEnum.PER_SEMESTER, sequence: 2 },
        { feeHeadId: 'fh-exam', amount: 2500, isMandatory: true, frequency: FeeFrequencyEnum.PER_SEMESTER, sequence: 3 },
        { feeHeadId: 'fh-library', amount: 1000, isMandatory: true, frequency: FeeFrequencyEnum.PER_SEMESTER, sequence: 4 },
        { feeHeadId: 'fh-sports', amount: 500, isMandatory: true, frequency: FeeFrequencyEnum.PER_SEMESTER, sequence: 5 },
      ],
    };

    const createdStructure = await feesController.createFeeStructure(createDto, mockAdminReq);
    assert(!!createdStructure.id, 'Fee Structure created successfully with unique ID');
    assert(createdStructure.structureCode === 'FS-BTECH-CE-SEM5-2026-V1', 'Structure Code saved correctly');
    assert(Number(createdStructure.totalAmount) === 64000, `Automatic Total accurately calculated: ₹64,000 (Got ₹${createdStructure.totalAmount})`);
    assert(createdStructure.items.length === 5, 'All 5 Fee Head items attached to structure');
    assert(createdStructure.status === 'DRAFT', 'Initial status is DRAFT');

    // 2. Reject Duplicate Fee Head within same structure
    console.log('\n--- TEST GROUP 2: Validation & Error Handling ---');
    let duplicateHeadRejected = false;
    try {
      await feesController.createFeeStructure({
        programId: 'prog-btech-ce',
        semesterId: 'sem-6',
        academicYearCode: '2026-27',
        name: 'B.Tech CE Sem 6 with Duplicate Item',
        items: [
          { feeHeadId: 'fh-tuition', amount: 50000, isMandatory: true },
          { feeHeadId: 'fh-tuition', amount: 50000, isMandatory: true }, // DUPLICATE
        ],
      }, mockAdminReq);
    } catch (err: any) {
      duplicateHeadRejected = err instanceof BadRequestException && err.message.includes('Duplicate Fee Heads');
    }
    assert(duplicateHeadRejected, 'Duplicate Fee Head in same structure correctly rejected with 400 Bad Request');

    // 3. Reject Zero Items
    let zeroItemsRejected = false;
    try {
      await feesController.createFeeStructure({
        programId: 'prog-btech-ce',
        semesterId: 'sem-6',
        academicYearCode: '2026-27',
        name: 'Empty Structure',
        items: [],
      }, mockAdminReq);
    } catch (err: any) {
      zeroItemsRejected = err instanceof BadRequestException;
    }
    assert(zeroItemsRejected, 'Structure with 0 items rejected with 400 Bad Request');

    // 4. Reject Negative Amount
    let negativeAmountRejected = false;
    try {
      await feesController.createFeeStructure({
        programId: 'prog-btech-ce',
        semesterId: 'sem-6',
        academicYearCode: '2026-27',
        name: 'Negative Amount Structure',
        items: [{ feeHeadId: 'fh-tuition', amount: -5000 }],
      }, mockAdminReq);
    } catch (err: any) {
      negativeAmountRejected = err instanceof BadRequestException && err.message.includes('cannot be negative');
    }
    assert(negativeAmountRejected, 'Negative fee amount rejected with 400 Bad Request');

    // 5. Query, Search & Filters
    console.log('\n--- TEST GROUP 3: Search, Filters & Pagination ---');
    const searchRes = await feesController.getFeeStructures({ search: 'FS-BTECH-CE' });
    assert(searchRes.data.length >= 1, 'Search by structure code returns matched structures');

    const filterRes = await feesController.getFeeStructures({ programId: 'prog-btech-ce', status: FeeStructureStatusEnum.DRAFT });
    assert(filterRes.data.length >= 1 && filterRes.data[0].id === createdStructure.id, 'Filter by Program + Status works');

    // 6. Get Detail by ID with Subtotal Breakdown
    console.log('\n--- TEST GROUP 4: Fee Structure Detail & Financial Breakdown ---');
    const detail = await feesController.getFeeStructureById(createdStructure.id);
    assert(detail.id === createdStructure.id, 'Fetched structure by ID');
    assert(detail.breakdown.mandatoryTotal === 64000, 'Mandatory subtotal calculated accurately: ₹64,000');
    assert(detail.breakdown.optionalTotal === 0, 'Optional subtotal calculated accurately: ₹0');
    assert(detail.breakdown.totalAmount === 64000, 'Total amount matches sum of items: ₹64,000');

    // 7. Add Optional Fee Item (Hostel ₹35,000) & Verify Total Update
    console.log('\n--- TEST GROUP 5: Dynamic Fee Items Management ---');
    const addedItem = await feesController.addFeeStructureItem(createdStructure.id, {
      feeHeadId: 'fh-hostel',
      amount: 35000,
      isMandatory: false,
      frequency: FeeFrequencyEnum.PER_SEMESTER,
      sequence: 6,
      description: 'Optional accommodation package',
    }, mockAdminReq);

    assert(!!addedItem.id, 'Optional Fee Head added dynamically to structure');

    const detailAfterAdd = await feesController.getFeeStructureById(createdStructure.id);
    assert(detailAfterAdd.breakdown.optionalTotal === 35000, 'Optional subtotal updated to ₹35,000');
    assert(detailAfterAdd.breakdown.totalAmount === 99000, `Total updated to ₹99,000 (Got ₹${detailAfterAdd.breakdown.totalAmount})`);

    // 8. Update Fee Item Amount & Verify Recalculation
    const updatedItem = await feesController.updateFeeStructureItem(createdStructure.id, addedItem.id, {
      amount: 40000,
    }, mockAdminReq);
    assert(Number(updatedItem.amount) === 40000, 'Item amount updated to ₹40,000');

    const detailAfterItemUpdate = await feesController.getFeeStructureById(createdStructure.id);
    assert(detailAfterItemUpdate.breakdown.totalAmount === 104000, `Total dynamically recalculated to ₹104,000 (Got ₹${detailAfterItemUpdate.breakdown.totalAmount})`);

    // 9. Remove Item & Verify Recalculation
    const deleteRes = await feesController.deleteFeeStructureItem(createdStructure.id, addedItem.id, mockAdminReq);
    assert(deleteRes.success === true && deleteRes.newTotalAmount === 64000, 'Item removed and structure total reverted to ₹64,000');

    // 10. Activate & Deactivate Workflow
    console.log('\n--- TEST GROUP 6: Activation & Lifecycle Workflow ---');
    const activated = await feesController.activateFeeStructure(createdStructure.id, mockAdminReq);
    assert(activated.status === 'ACTIVE', 'Fee Structure status transitioned to ACTIVE');

    const deactivated = await feesController.deactivateFeeStructure(createdStructure.id, mockAdminReq);
    assert(deactivated.status === 'INACTIVE', 'Fee Structure status transitioned to INACTIVE');

    // Reactivate for duplication test
    await feesController.activateFeeStructure(createdStructure.id, mockAdminReq);

    // 11. Duplicate Structure (Clone to next AY 2027-28)
    console.log('\n--- TEST GROUP 7: Duplicate Structure Feature ---');
    const duplicated = await feesController.duplicateFeeStructure(createdStructure.id, {
      targetAcademicYearCode: '2027-28',
      name: 'B.Tech CE Sem 5 Fee Structure (AY 2027-28)',
      copyItems: true,
    }, mockAdminReq);

    assert(!!duplicated.id && duplicated.id !== createdStructure.id, 'New distinct Fee Structure created upon duplication');
    assert(duplicated.status === 'DRAFT', 'Duplicated structure is created in DRAFT status');
    assert(duplicated.academicYearCode === '2027-28', 'Duplicated structure assigned target Academic Year (2027-28)');
    assert(Number(duplicated.totalAmount) === 64000, 'All fee items copied with exact amounts (₹64,000)');

    // Verify original structure remains unchanged
    const originalCheck = await feesController.getFeeStructureById(createdStructure.id);
    assert(originalCheck.status === 'ACTIVE' && originalCheck.academicYearCode === '2026-27', 'Original structure remained active and unchanged');

    // 12. Audit Trail Verification
    console.log('\n--- TEST GROUP 8: Audit Trail Verification ---');
    const auditLogs = await feesController.getFeeStructureAuditLogs(createdStructure.id);
    const actions = auditLogs.map(l => l.action);
    assert(actions.includes('CREATED'), 'Audit log contains CREATED action');
    assert(actions.includes('ITEM_ADDED'), 'Audit log contains ITEM_ADDED action');
    assert(actions.includes('ITEM_UPDATED'), 'Audit log contains ITEM_UPDATED action');
    assert(actions.includes('ITEM_REMOVED'), 'Audit log contains ITEM_REMOVED action');
    assert(actions.includes('ACTIVATED'), 'Audit log contains ACTIVATED action');
    assert(actions.includes('DEACTIVATED'), 'Audit log contains DEACTIVATED action');
    assert(actions.includes('DUPLICATED'), 'Audit log contains DUPLICATED action');
    assert(auditLogs[0].performedByUserId === mockAdminReq.user.id, 'Audit log records acting user ID');

  } catch (error) {
    console.error('❌ Test suite encountered unhandled error:', error);
    failed++;
  }

  console.log('\n===========================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFeeStructureMasterTests();
