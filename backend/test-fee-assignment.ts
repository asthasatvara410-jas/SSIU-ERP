import { FeesService } from './src/fees/fees.service';
import { FeesController } from './src/fees/fees.controller';
import { FeeCategoryEnum, FeeFrequencyEnum, FeeStructureStatusEnum, FeeAccountStatusEnum } from './src/fees/dto/fees.dto';
import { BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

async function runFeeAssignmentAndAccountTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING STUDENT FEE ASSIGNMENT & STUDENT FEE ACCOUNT (PHASE 3) TESTS');
  console.log('========================================================================\n');

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

  // In-memory data store
  const store = {
    institutes: new Map<string, any>(),
    departments: new Map<string, any>(),
    programs: new Map<string, any>(),
    semesters: new Map<string, any>(),
    batches: new Map<string, any>(),
    students: new Map<string, any>(),
    users: new Map<string, any>(),
    feeHeads: new Map<string, any>(),
    feeStructures: new Map<string, any>(),
    feeStructureItems: new Map<string, any>(),
    feeStructureAuditLogs: new Map<string, any>(),
    studentFeeAccounts: new Map<string, any>(),
    studentFeeItems: new Map<string, any>(),
    studentFeeAccountAuditLogs: new Map<string, any>(),
  };

  // Seed Reference Masters
  store.institutes.set('inst-sit', { id: 'inst-sit', code: 'SIT', name: 'Swarrnim Institute of Technology' });
  store.departments.set('dept-cse', { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering', instituteId: 'inst-sit' });
  store.programs.set('prog-btech-ce', { id: 'prog-btech-ce', code: 'BTECH-CE', name: 'B.Tech Computer Engineering', departmentId: 'dept-cse' });
  store.semesters.set('sem-5', { id: 'sem-5', semesterNumber: 5, code: 'SEM-5', name: 'Semester 5', programId: 'prog-btech-ce' });

  store.batches.set('batch-2024-ce', {
    id: 'batch-2024-ce',
    code: 'BTECH-CE-2024',
    programId: 'prog-btech-ce',
    academicYearId: 'ay-2024',
  });

  // Seed Students
  store.students.set('stu-1', {
    id: 'stu-1',
    erpId: 'STU001',
    enrollmentNo: '2026SSIUCE0101',
    firstName: 'Jigar',
    lastName: 'Parmar',
    email: 'jigar@ssiu.edu.in',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    batchId: 'batch-2024-ce',
    status: 'ACTIVE',
  });

  store.students.set('stu-2', {
    id: 'stu-2',
    erpId: 'STU002',
    enrollmentNo: '2026SSIUCE0102',
    firstName: 'Aarav',
    lastName: 'Shah',
    email: 'aarav@ssiu.edu.in',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    batchId: 'batch-2024-ce',
    status: 'ACTIVE',
  });

  store.students.set('stu-3', {
    id: 'stu-3',
    erpId: 'STU003',
    enrollmentNo: '2026SSIUCE0103',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya@ssiu.edu.in',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    batchId: 'batch-2024-ce',
    status: 'ACTIVE',
  });

  store.students.set('stu-4', {
    id: 'stu-4',
    erpId: 'STU004',
    enrollmentNo: '2026SSIUCE0104',
    firstName: 'Rohan',
    lastName: 'Deshmukh',
    email: 'rohan@ssiu.edu.in',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    batchId: 'batch-2024-ce',
    status: 'ACTIVE',
  });

  // Seed Fee Heads
  store.feeHeads.set('fh-tuition', { id: 'fh-tuition', code: 'TUITION', name: 'Tuition Fee', category: 'ACADEMIC', defaultAmount: new Prisma.Decimal(50000), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-dev', { id: 'fh-dev', code: 'DEV', name: 'Development Fee', category: 'ACADEMIC', defaultAmount: new Prisma.Decimal(10000), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-exam', { id: 'fh-exam', code: 'EXAM', name: 'Examination Fee', category: 'EXAMINATION', defaultAmount: new Prisma.Decimal(2500), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-library', { id: 'fh-library', code: 'LIBRARY', name: 'Library Fee', category: 'LIBRARY', defaultAmount: new Prisma.Decimal(1000), isMandatory: true, status: 'ACTIVE' });

  // Seed Active Fee Structure (Total ₹63,500)
  const activeStructureId = 'fs-btech-ce-s5';
  store.feeStructures.set(activeStructureId, {
    id: activeStructureId,
    structureCode: 'FS-BTECH-CE-SEM5-2026-V1',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    programId: 'prog-btech-ce',
    semesterId: 'sem-5',
    academicYearCode: '2026-27',
    name: 'B.Tech Computer Engineering Sem 5 Fee Structure (AY 2026-27)',
    totalAmount: new Prisma.Decimal(63500),
    status: 'ACTIVE',
  });

  store.feeStructureItems.set('fsi-1', { id: 'fsi-1', feeStructureId: activeStructureId, feeHeadId: 'fh-tuition', amount: new Prisma.Decimal(50000), isMandatory: true, sequence: 1 });
  store.feeStructureItems.set('fsi-2', { id: 'fsi-2', feeStructureId: activeStructureId, feeHeadId: 'fh-dev', amount: new Prisma.Decimal(10000), isMandatory: true, sequence: 2 });
  store.feeStructureItems.set('fsi-3', { id: 'fsi-3', feeStructureId: activeStructureId, feeHeadId: 'fh-exam', amount: new Prisma.Decimal(2500), isMandatory: true, sequence: 3 });
  store.feeStructureItems.set('fsi-4', { id: 'fsi-4', feeStructureId: activeStructureId, feeHeadId: 'fh-library', amount: new Prisma.Decimal(1000), isMandatory: true, sequence: 4 });

  // Seed Inactive Fee Structure (Draft)
  store.feeStructures.set('fs-draft', {
    id: 'fs-draft',
    structureCode: 'FS-DRAFT',
    programId: 'prog-btech-ce',
    semesterId: 'sem-5',
    academicYearCode: '2026-27',
    name: 'Draft Structure',
    totalAmount: new Prisma.Decimal(50000),
    status: 'DRAFT',
  });

  let idCounter = 1;

  const mockPrisma: any = {
    feeStructure: {
      findUnique: async ({ where }: any) => {
        const fs = store.feeStructures.get(where.id);
        if (!fs) return null;
        const items = Array.from(store.feeStructureItems.values())
          .filter(i => i.feeStructureId === fs.id)
          .map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
        const prog = store.programs.get(fs.programId);
        const dept = prog ? store.departments.get(prog.departmentId) : null;
        const inst = dept ? store.institutes.get(dept.instituteId) : null;
        return {
          ...fs,
          items,
          program: prog ? { ...prog, department: dept ? { ...dept, institute: inst } : null } : null,
          semester: store.semesters.get(fs.semesterId),
        };
      },
    },
    student: {
      count: async ({ where }: any) => {
        let list = Array.from(store.students.values());
        if (where?.status) list = list.filter(s => s.status === where.status);
        if (where?.instituteId) list = list.filter(s => s.instituteId === where.instituteId);
        if (where?.departmentId) list = list.filter(s => s.departmentId === where.departmentId);
        return list.length;
      },
      findMany: async ({ where, skip = 0, take = 50 }: any) => {
        let list = Array.from(store.students.values());
        if (where?.id?.in) {
          list = list.filter(s => where.id.in.includes(s.id));
        }
        if (where?.status) list = list.filter(s => s.status === where.status);
        if (where?.instituteId) list = list.filter(s => s.instituteId === where.instituteId);
        if (where?.departmentId) list = list.filter(s => s.departmentId === where.departmentId);
        return list.slice(skip, skip + take).map(s => {
          const batch = store.batches.get(s.batchId);
          const feeAccounts = Array.from(store.studentFeeAccounts.values()).filter(a => a.studentId === s.id);
          return {
            ...s,
            institute: store.institutes.get(s.instituteId),
            department: store.departments.get(s.departmentId),
            batch: batch ? { ...batch, program: store.programs.get(batch.programId) } : null,
            feeAccounts,
          };
        });
      },
    },
    studentFeeAccount: {
      findUnique: async ({ where }: any) => {
        let account = null;
        if (where.id) account = store.studentFeeAccounts.get(where.id);
        if (where.studentId_feeStructureId) {
          for (const a of store.studentFeeAccounts.values()) {
            if (a.studentId === where.studentId_feeStructureId.studentId && a.feeStructureId === where.studentId_feeStructureId.feeStructureId) {
              account = a;
              break;
            }
          }
        }
        if (!account) return null;
        const student = store.students.get(account.studentId);
        const feeStructure = store.feeStructures.get(account.feeStructureId);
        const items = Array.from(store.studentFeeItems.values())
          .filter(i => i.studentFeeAccountId === account.id)
          .map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
        const auditLogs = Array.from(store.studentFeeAccountAuditLogs.values())
          .filter(l => l.studentFeeAccountId === account.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return {
          ...account,
          student: student ? { ...student, batch: store.batches.get(student.batchId) } : null,
          feeStructure: feeStructure ? { ...feeStructure, program: store.programs.get(feeStructure.programId), semester: store.semesters.get(feeStructure.semesterId) } : null,
          items,
          auditLogs,
        };
      },
      findMany: async ({ where, skip = 0, take = 50 }: any) => {
        let list = Array.from(store.studentFeeAccounts.values());
        if (where?.studentId) list = list.filter(a => a.studentId === where.studentId);
        if (where?.feeStructureId) list = list.filter(a => a.feeStructureId === where.feeStructureId);
        if (where?.status) list = list.filter(a => a.status === where.status);
        return list.slice(skip, skip + take).map(a => {
          const student = store.students.get(a.studentId);
          const feeStructure = store.feeStructures.get(a.feeStructureId);
          const items = Array.from(store.studentFeeItems.values())
            .filter(i => i.studentFeeAccountId === a.id)
            .map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
          return {
            ...a,
            student,
            feeStructure,
            items,
            _count: { items: items.length, payments: 0 },
          };
        });
      },
      count: async ({ where }: any) => {
        let list = Array.from(store.studentFeeAccounts.values());
        if (where?.studentId) list = list.filter(a => a.studentId === where.studentId);
        if (where?.feeStructureId) list = list.filter(a => a.feeStructureId === where.feeStructureId);
        if (where?.status) list = list.filter(a => a.status === where.status);
        return list.length;
      },
      create: async ({ data }: any) => {
        const id = `sfa-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.studentFeeAccounts.set(id, record);
        return record;
      },
    },
    studentFeeItem: {
      create: async ({ data }: any) => {
        const id = `sfi-acc-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.studentFeeItems.set(id, record);
        return record;
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.studentFeeItems.values());
        if (where?.studentFeeAccountId) list = list.filter(i => i.studentFeeAccountId === where.studentFeeAccountId);
        return list.map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
      },
    },
    studentFeeAccountAuditLog: {
      create: async ({ data }: any) => {
        const id = `sfaal-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
        };
        store.studentFeeAccountAuditLogs.set(id, record);
        return record;
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.studentFeeAccountAuditLogs.values());
        if (where?.studentFeeAccountId) list = list.filter(l => l.studentFeeAccountId === where.studentFeeAccountId);
        return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'usr-student-1') {
          return { id: 'usr-student-1', student: store.students.get('stu-1') };
        }
        if (where.id === 'usr-student-2') {
          return { id: 'usr-student-2', student: store.students.get('stu-2') };
        }
        return null;
      },
    },
    $transaction: async (cb: (tx: any) => Promise<any>) => cb(mockPrisma),
  };

  const feesService = new FeesService(mockPrisma);
  const feesController = new FeesController(feesService);

  const mockFinanceAdminReq = {
    user: {
      id: 'usr-accounts-admin',
      username: 'accounts_admin',
      firstName: 'Finance',
      lastName: 'Director',
      roles: ['ACCOUNTS_ADMIN', 'UNIVERSITY_ADMIN'],
    },
  };

  const mockStudent1Req = {
    user: {
      id: 'usr-student-1',
      student: { id: 'stu-1' },
      roles: ['STUDENT'],
    },
  };

  const mockStudent2Req = {
    user: {
      id: 'usr-student-2',
      student: { id: 'stu-2' },
      roles: ['STUDENT'],
    },
  };

  try {
    // 1. Fetch Eligible Students for Active Fee Structure
    console.log('--- TEST GROUP 1: Eligible Students Finder ---');
    const eligibleRes = await feesController.getEligibleStudents({ feeStructureId: activeStructureId });
    assert(eligibleRes.data.length === 4, `Found all 4 eligible students for B.Tech CE (Got ${eligibleRes.data.length})`);
    assert(eligibleRes.data.every((s: any) => !s.isAlreadyAssigned), 'All students initially unassigned');
    assert(eligibleRes.feeStructureSummary.totalAmount === 63500, 'Fee Structure summary total matches ₹63,500');

    // 2. Assign Fee to Single Student (Student 1: Jigar Parmar)
    console.log('\n--- TEST GROUP 2: Single Student Fee Assignment ---');
    const singleAssignRes = await feesController.assignFeeStructure({
      feeStructureId: activeStructureId,
      studentIds: ['stu-1'],
    }, mockFinanceAdminReq);

    assert(singleAssignRes.success === true, 'Fee assignment executed successfully');
    assert(singleAssignRes.assignedCount === 1, 'Assigned count is 1');
    assert(singleAssignRes.alreadyAssignedCount === 0, 'Already assigned count is 0');

    const createdAccountId = singleAssignRes.assignedAccountIds[0];
    const accountDetail = await feesController.getStudentFeeAccountById(createdAccountId, mockFinanceAdminReq);
    assert(accountDetail.studentId === 'stu-1', 'Account created for Student 1');
    assert(Number(accountDetail.totalDue) === 63500, 'Total due is ₹63,500');
    assert(Number(accountDetail.totalPaid) === 0, 'Total paid is ₹0');
    assert(Number(accountDetail.totalDiscount) === 0, 'Total discount is ₹0');
    assert(Number(accountDetail.totalWaived) === 0, 'Total waived is ₹0');
    assert(Number(accountDetail.balanceDue) === 63500, 'Outstanding balance due is ₹63,500');
    assert(accountDetail.status === 'PENDING', 'Initial account status is PENDING');
    assert(accountDetail.items.length === 4, 'All 4 individual Fee Head items created in account');

    // Verify individual items amounts and outstanding
    const tuitionItem = accountDetail.items.find((i: any) => i.feeHead?.code === 'TUITION');
    assert(!!tuitionItem && Number(tuitionItem.amount) === 50000, 'Tuition fee item created with ₹50,000');
    assert(!!tuitionItem && Number(tuitionItem.paidAmount) === 0 && Number(tuitionItem.outstandingAmount) === 50000, 'Tuition item outstanding is ₹50,000');

    // 3. Duplicate Assignment Protection
    console.log('\n--- TEST GROUP 3: Duplicate Assignment Protection ---');
    const duplicateRes = await feesController.assignFeeStructure({
      feeStructureId: activeStructureId,
      studentIds: ['stu-1'], // Already assigned
    }, mockFinanceAdminReq);

    assert(duplicateRes.assignedCount === 0, 'Assigned count is 0 for duplicate attempt');
    assert(duplicateRes.alreadyAssignedCount === 1, 'Already assigned count is 1');
    assert(duplicateRes.skippedCount === 1, 'Duplicate student safely skipped without creating duplicate account');

    // 4. Bulk Fee Assignment
    console.log('\n--- TEST GROUP 4: Bulk Student Fee Assignment ---');
    const bulkRes = await feesController.assignFeeStructure({
      feeStructureId: activeStructureId,
      studentIds: ['stu-1', 'stu-2', 'stu-3', 'stu-4'], // Student 1 already assigned, Students 2, 3, 4 are new
    }, mockFinanceAdminReq);

    assert(bulkRes.assignedCount === 3, `Assigned to 3 new students in batch (Got ${bulkRes.assignedCount})`);
    assert(bulkRes.alreadyAssignedCount === 1, `Skipped 1 student who already had fee assigned (Got ${bulkRes.alreadyAssignedCount})`);

    // Verify all 4 students now have accounts
    const allAccountsRes = await feesController.getStudentFeeAccounts({}, mockFinanceAdminReq);
    assert(allAccountsRes.data.length === 4, 'All 4 students now have active fee accounts');

    // 5. Eligible Students status update check
    console.log('\n--- TEST GROUP 5: Eligible Students Post-Assignment Check ---');
    const eligibleCheckAfter = await feesController.getEligibleStudents({ feeStructureId: activeStructureId });
    assert(eligibleCheckAfter.data.every((s: any) => s.isAlreadyAssigned === true), 'All eligible students now flagged as isAlreadyAssigned = true');

    // 6. Security & Student Data Isolation
    console.log('\n--- TEST GROUP 6: Student Privacy & RBAC Security Enforcement ---');
    // Student 1 retrieves their own fee account
    const student1Accounts = await feesController.getMyFeeAccount(mockStudent1Req.user.id);
    assert(student1Accounts.length === 1 && student1Accounts[0].studentId === 'stu-1', 'Student 1 can view their own fee account');

    // Student 1 tries to view Student 2's fee account directly
    let student2AccessBlocked = false;
    try {
      const student2AccountId = bulkRes.assignedAccountIds[0]; // Student 2's account
      await feesController.getStudentFeeAccountById(student2AccountId, mockStudent1Req);
    } catch (err: any) {
      student2AccessBlocked = err instanceof ForbiddenException;
    }
    assert(student2AccessBlocked, 'Student 1 strictly blocked from viewing Student 2 account with 403 Forbidden');

    // Student 1 tries to call getStudentFeesByStudentId for Student 2
    let student2ListBlocked = false;
    try {
      await feesController.getStudentFeesByStudentId('stu-2', mockStudent1Req);
    } catch (err: any) {
      student2ListBlocked = err instanceof ForbiddenException;
    }
    assert(student2ListBlocked, 'Student 1 strictly blocked from listing Student 2 fees with 403 Forbidden');

    // 7. Validation & Error Handling
    console.log('\n--- TEST GROUP 7: Validation & Edge Cases ---');
    // Inactive/Draft fee structure assignment rejection
    let draftStructureRejected = false;
    try {
      await feesController.assignFeeStructure({
        feeStructureId: 'fs-draft',
        studentIds: ['stu-2'],
      }, mockFinanceAdminReq);
    } catch (err: any) {
      draftStructureRejected = err instanceof BadRequestException && err.message.includes('Only ACTIVE fee structures');
    }
    assert(draftStructureRejected, 'Assignment of DRAFT structure rejected with 400 Bad Request');

    // Empty student array rejection
    let emptyStudentsRejected = false;
    try {
      await feesController.assignFeeStructure({
        feeStructureId: activeStructureId,
        studentIds: [],
      }, mockFinanceAdminReq);
    } catch (err: any) {
      emptyStudentsRejected = err instanceof BadRequestException;
    }
    assert(emptyStudentsRejected, 'Assignment with empty student list rejected with 400 Bad Request');

    // Non-existent structure rejection
    let nonExistentRejected = false;
    try {
      await feesController.assignFeeStructure({
        feeStructureId: 'non-existent-id',
        studentIds: ['stu-2'],
      }, mockFinanceAdminReq);
    } catch (err: any) {
      nonExistentRejected = err instanceof NotFoundException;
    }
    assert(nonExistentRejected, 'Non-existent structure assignment rejected with 404 Not Found');

    // 8. Audit Trail Verification
    console.log('\n--- TEST GROUP 8: Audit Logging ---');
    const auditLogs = await feesController.getStudentFeeAccountAuditLogs(createdAccountId, mockFinanceAdminReq);
    assert(auditLogs.length >= 1, 'Audit log persisted for fee account');
    assert(auditLogs[0].action === 'FEE_ASSIGNED', 'Audit log action is FEE_ASSIGNED');
    assert(auditLogs[0].performedByUserId === mockFinanceAdminReq.user.id, 'Audit log records finance actor ID');

  } catch (error) {
    console.error('❌ Test suite encountered unhandled error:', error);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFeeAssignmentAndAccountTests();
