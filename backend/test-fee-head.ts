import { FeesService } from './src/fees/fees.service';
import { FeesController } from './src/fees/fees.controller';
import { FeeCategoryEnum } from './src/fees/dto/fees.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

async function runFeeHeadMasterTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING UNIVERSITY FEE HEAD MASTER (PHASE 1) TESTS');
  console.log('====================================================\n');

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

  // In-memory data store for Fee Heads and Audit Logs
  const store = {
    feeHeads: new Map<string, any>(),
    feeHeadAuditLogs: new Map<string, any>(),
  };

  let idCounter = 1;

  const mockPrisma: any = {
    feeHead: {
      findUnique: async ({ where }: any) => {
        if (where.id) return store.feeHeads.get(where.id) || null;
        if (where.code) {
          for (const head of store.feeHeads.values()) {
            if (head.code.toUpperCase() === where.code.toUpperCase()) return head;
          }
          return null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        for (const head of store.feeHeads.values()) {
          let match = true;
          if (where.code && head.code.toUpperCase() !== where.code.toUpperCase()) match = false;
          if (where.status && head.status !== where.status) match = false;
          if (where.isActive !== undefined && head.isActive !== where.isActive) match = false;
          if (match) return head;
        }
        return null;
      },
      findMany: async ({ where, skip = 0, take = 50, orderBy, include }: any) => {
        let list = Array.from(store.feeHeads.values());
        if (where) {
          if (where.OR) {
            list = list.filter(head => {
              return where.OR.some((clause: any) => {
                if (clause.code?.contains) {
                  return head.code.toLowerCase().includes(clause.code.contains.toLowerCase());
                }
                if (clause.name?.contains) {
                  return head.name.toLowerCase().includes(clause.name.contains.toLowerCase());
                }
                if (clause.description?.contains) {
                  return (head.description || '').toLowerCase().includes(clause.description.contains.toLowerCase());
                }
                return false;
              });
            });
          }
          if (where.category) {
            list = list.filter(h => h.category === where.category);
          }
          if (where.status) {
            list = list.filter(h => h.status === where.status);
          }
          if (where.isActive !== undefined) {
            list = list.filter(h => h.isActive === where.isActive);
          }
          if (where.isMandatory !== undefined) {
            list = list.filter(h => h.isMandatory === where.isMandatory);
          }
        }
        if (orderBy) {
          const key = Object.keys(orderBy)[0];
          const dir = orderBy[key];
          list.sort((a, b) => {
            if (a[key] < b[key]) return dir === 'desc' ? 1 : -1;
            if (a[key] > b[key]) return dir === 'desc' ? -1 : 1;
            return 0;
          });
        }
        return list.slice(skip, skip + take).map(h => ({
          ...h,
          _count: { feeStructureItems: 0, feePaymentItems: 0 },
        }));
      },
      count: async ({ where }: any) => {
        let list = Array.from(store.feeHeads.values());
        if (where) {
          if (where.OR) {
            list = list.filter(head => {
              return where.OR.some((clause: any) => {
                if (clause.code?.contains) return head.code.toLowerCase().includes(clause.code.contains.toLowerCase());
                if (clause.name?.contains) return head.name.toLowerCase().includes(clause.name.contains.toLowerCase());
                return false;
              });
            });
          }
          if (where.category) list = list.filter(h => h.category === where.category);
          if (where.status) list = list.filter(h => h.status === where.status);
          if (where.isActive !== undefined) list = list.filter(h => h.isActive === where.isActive);
          if (where.isMandatory !== undefined) list = list.filter(h => h.isMandatory === where.isMandatory);
        }
        return list.length;
      },
      create: async ({ data }: any) => {
        const id = `fh-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.feeHeads.set(id, record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const existing = store.feeHeads.get(where.id);
        if (!existing) throw new NotFoundException('Record not found');
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.feeHeads.set(where.id, updated);
        return updated;
      },
    },
    feeHeadAuditLog: {
      create: async ({ data }: any) => {
        const id = `fhal-${idCounter++}`;
        const log = {
          id,
          ...data,
          createdAt: new Date(),
        };
        store.feeHeadAuditLogs.set(id, log);
        return log;
      },
      findMany: async ({ where, orderBy }: any) => {
        let list = Array.from(store.feeHeadAuditLogs.values());
        if (where?.feeHeadId) {
          list = list.filter(l => l.feeHeadId === where.feeHeadId);
        }
        return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
    },
    $transaction: async (cb: (tx: any) => Promise<any>) => {
      return cb(mockPrisma);
    },
  };

  const feesService = new FeesService(mockPrisma);
  const feesController = new FeesController(feesService);

  const mockAdminReq = {
    user: {
      id: 'usr-accounts-admin',
      username: 'accounts_officer',
      firstName: 'Finance',
      lastName: 'Officer',
      roles: ['ACCOUNTS_ADMIN', 'UNIVERSITY_ADMIN'],
    },
  };

  const testSuffix = Date.now().toString(36).toUpperCase();

  try {
    // 1. Get Fee Categories
    console.log('--- TEST GROUP 1: Configurable Fee Categories ---');
    const categories = feesController.getFeeCategories();
    assert(Array.isArray(categories) && categories.length >= 10, 'Retrieve all 10 Fee Categories');
    assert(categories.some(c => c.code === 'ACADEMIC') && categories.some(c => c.code === 'HOSTEL'), 'Includes standard ACADEMIC & HOSTEL categories');
    assert(categories.some(c => c.code === 'EXAMINATION') && categories.some(c => c.code === 'TRANSPORT'), 'Includes EXAMINATION & TRANSPORT categories');
    assert(categories.some(c => c.code === 'CERTIFICATE') && categories.some(c => c.code === 'LIBRARY'), 'Includes CERTIFICATE & LIBRARY categories');

    // 2. Create Fee Head
    console.log('\n--- TEST GROUP 2: Create Fee Head ---');
    const tuitionCode = `TUIT_${testSuffix}`;
    const feeHead1 = await feesController.createFeeHead({
      code: tuitionCode,
      name: 'Undergraduate Tuition Fee',
      description: 'Core semester tuition and laboratory instruction fee',
      category: FeeCategoryEnum.ACADEMIC,
      defaultAmount: 45000.50,
      isMandatory: true,
      isActive: true,
    }, mockAdminReq);

    assert(!!feeHead1.id, 'Fee Head created successfully with ID');
    assert(feeHead1.code === tuitionCode, 'Fee Code normalized to uppercase');
    assert(Number(feeHead1.defaultAmount) === 45000.50, 'Decimal default amount preserved accurately');
    assert(feeHead1.isMandatory === true && feeHead1.isOptional === false, 'Mandatory and Optional flags set correctly');
    assert(feeHead1.status === 'ACTIVE' && feeHead1.isActive === true, 'Fee Head active on creation');

    // 3. Duplicate Fee Code Prevention
    console.log('\n--- TEST GROUP 3: Duplicate Prevention ---');
    let duplicateRejected = false;
    try {
      await feesController.createFeeHead({
        code: tuitionCode.toLowerCase(),
        name: 'Another Tuition Fee',
        category: FeeCategoryEnum.ACADEMIC,
        defaultAmount: 50000,
      }, mockAdminReq);
    } catch (err: any) {
      duplicateRejected = err instanceof ConflictException || err.status === 409 || err.message?.includes('already exists');
    }
    assert(duplicateRejected, 'Duplicate Fee Code creation correctly rejected with 409 Conflict');

    // 4. Create Additional Diverse Fee Heads
    console.log('\n--- TEST GROUP 4: Create Multiple Category Fee Heads ---');
    const examCode = `EXAM_${testSuffix}`;
    const hostelCode = `HOSTEL_${testSuffix}`;
    const busCode = `BUS_${testSuffix}`;
    const certCode = `CERT_${testSuffix}`;

    const feeHeadExam = await feesController.createFeeHead({
      code: examCode,
      name: 'Semester End Examination Fee',
      category: FeeCategoryEnum.EXAMINATION,
      defaultAmount: 2500,
      isMandatory: true,
    }, mockAdminReq);

    const feeHeadHostel = await feesController.createFeeHead({
      code: hostelCode,
      name: 'Campus Hostel Accommodation & Mess',
      category: FeeCategoryEnum.HOSTEL,
      defaultAmount: 35000,
      isMandatory: false,
      isOptional: true,
    }, mockAdminReq);

    const feeHeadBus = await feesController.createFeeHead({
      code: busCode,
      name: 'University Bus Transit Pass',
      category: FeeCategoryEnum.TRANSPORT,
      defaultAmount: 12000,
      isMandatory: false,
    }, mockAdminReq);

    const feeHeadCert = await feesController.createFeeHead({
      code: certCode,
      name: 'Degree Certificate & Transcript Issue',
      category: FeeCategoryEnum.CERTIFICATE,
      defaultAmount: 1500,
      isMandatory: false,
    }, mockAdminReq);

    assert(!!feeHeadExam && !!feeHeadHostel && !!feeHeadBus && !!feeHeadCert, 'Successfully created diverse fee heads across categories');

    // 5. Search & Filters
    console.log('\n--- TEST GROUP 5: Search & Filtering ---');
    const searchRes = await feesController.getFeeHeads({ search: tuitionCode });
    assert(searchRes.data.length === 1 && searchRes.data[0].code === tuitionCode, 'Search by Fee Code returns exact match');

    const searchNameRes = await feesController.getFeeHeads({ search: 'Accommodation' });
    assert(searchNameRes.data.some(f => f.code === hostelCode), 'Search by Fee Name/Description keyword matches');

    const categoryRes = await feesController.getFeeHeads({ category: FeeCategoryEnum.HOSTEL });
    assert(categoryRes.data.every(f => f.category === 'HOSTEL'), 'Filter by Category returns only HOSTEL fee heads');

    const mandatoryRes = await feesController.getFeeHeads({ isMandatory: true });
    assert(mandatoryRes.data.some(f => f.code === tuitionCode) && !mandatoryRes.data.some(f => f.code === hostelCode), 'Filter by isMandatory=true works accurately');

    // 6. Pagination and Sorting
    console.log('\n--- TEST GROUP 6: Pagination and Sorting ---');
    const paginatedRes = await feesController.getFeeHeads({ page: 1, limit: 2, sortBy: 'name', sortOrder: 'asc' });
    assert(paginatedRes.data.length <= 2, 'Page limit respected');
    assert(paginatedRes.meta.total >= 5, 'Total records count metadata present');
    assert(paginatedRes.meta.totalPages >= 3, 'Total pages calculated correctly');

    // 7. Get by ID
    console.log('\n--- TEST GROUP 7: Get Fee Head by ID ---');
    const headDetail = await feesController.getFeeHeadById(feeHead1.id);
    assert(headDetail.id === feeHead1.id, 'Fee Head fetched by ID');
    assert(headDetail.name === 'Undergraduate Tuition Fee', 'Correct fee head name loaded');

    // 8. Update Fee Head
    console.log('\n--- TEST GROUP 8: Update Fee Head ---');
    const updated = await feesController.updateFeeHead(feeHead1.id, {
      name: 'Undergraduate Tuition & Laboratory Combined Fee',
      defaultAmount: 48000,
      description: 'Revised fee for AY 2026-27',
    }, mockAdminReq);

    assert(updated.name === 'Undergraduate Tuition & Laboratory Combined Fee', 'Fee Name updated successfully');
    assert(Number(updated.defaultAmount) === 48000, 'Default Amount updated successfully');

    // 9. Deactivate and Activate Fee Head
    console.log('\n--- TEST GROUP 9: Deactivate & Activate Workflow ---');
    const deactivated = await feesController.updateFeeHeadStatus(feeHead1.id, {
      isActive: false,
    }, mockAdminReq);
    assert(deactivated.isActive === false && deactivated.status === 'INACTIVE', 'Fee Head deactivated successfully');

    const activeList = await feesController.getFeeHeads({ isActive: true });
    assert(!activeList.data.some(f => f.id === feeHead1.id), 'Deactivated Fee Head excluded from active filter list');

    const reactivated = await feesController.updateFeeHeadStatus(feeHead1.id, {
      isActive: true,
    }, mockAdminReq);
    assert(reactivated.isActive === true && reactivated.status === 'ACTIVE', 'Fee Head reactivated successfully');

    // 10. Audit Trail Check
    console.log('\n--- TEST GROUP 10: Audit Log Verification ---');
    const auditLogs = await feesController.getFeeHeadAuditLogs(feeHead1.id);
    const actions = auditLogs.map(l => l.action);
    assert(actions.includes('CREATED'), 'Audit log contains CREATED action');
    assert(actions.includes('UPDATED'), 'Audit log contains UPDATED action');
    assert(actions.includes('DEACTIVATED'), 'Audit log contains DEACTIVATED action');
    assert(actions.includes('ACTIVATED'), 'Audit log contains ACTIVATED action');
    assert(auditLogs[0].performedByUserId === mockAdminReq.user.id, 'Audit log records acting user ID');

  } catch (error) {
    console.error('❌ Test suite encountered unhandled error:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFeeHeadMasterTests();
