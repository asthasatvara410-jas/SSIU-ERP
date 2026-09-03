import { FeesService } from './src/fees/fees.service';
import { FeesController } from './src/fees/fees.controller';
import { FeeInvoiceStatusEnum } from './src/fees/dto/fees.dto';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

async function runFeeInvoiceTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING FEE INVOICE / DEMAND MANAGEMENT (PHASE 4) TESTS');
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
    studentFeeAccounts: new Map<string, any>(),
    studentFeeItems: new Map<string, any>(),
    feeInvoices: new Map<string, any>(),
    feeInvoiceItems: new Map<string, any>(),
    feeInvoiceAuditLogs: new Map<string, any>(),
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

  // Seed Fee Heads
  store.feeHeads.set('fh-tuition', { id: 'fh-tuition', code: 'TUITION', name: 'Tuition Fee', category: 'ACADEMIC', defaultAmount: new Prisma.Decimal(50000), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-dev', { id: 'fh-dev', code: 'DEV', name: 'Development Fee', category: 'ACADEMIC', defaultAmount: new Prisma.Decimal(10000), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-exam', { id: 'fh-exam', code: 'EXAM', name: 'Examination Fee', category: 'EXAMINATION', defaultAmount: new Prisma.Decimal(2500), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-library', { id: 'fh-library', code: 'LIBRARY', name: 'Library Fee', category: 'LIBRARY', defaultAmount: new Prisma.Decimal(1000), isMandatory: true, status: 'ACTIVE' });
  store.feeHeads.set('fh-sports', { id: 'fh-sports', code: 'SPORTS', name: 'Sports Fee', category: 'STUDENT_ACTIVITY', defaultAmount: new Prisma.Decimal(500), isMandatory: true, status: 'ACTIVE' });

  // Seed Fee Structure (Total ₹64,000)
  const structureId = 'fs-btech-ce-s5';
  store.feeStructures.set(structureId, {
    id: structureId,
    structureCode: 'FS-BTECH-CE-SEM5-2026-V1',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    programId: 'prog-btech-ce',
    semesterId: 'sem-5',
    academicYearCode: '2026-27',
    name: 'B.Tech Computer Engineering Sem 5 Fee Structure',
    totalAmount: new Prisma.Decimal(64000),
    status: 'ACTIVE',
  });

  // Seed Student Fee Accounts for Student 1 and Student 2
  const acc1Id = 'sfa-stu-1';
  store.studentFeeAccounts.set(acc1Id, {
    id: acc1Id,
    studentId: 'stu-1',
    feeStructureId: structureId,
    academicYearCode: '2026-27',
    totalDue: new Prisma.Decimal(64000),
    totalPaid: new Prisma.Decimal(0),
    totalDiscount: new Prisma.Decimal(0),
    totalWaived: new Prisma.Decimal(0),
    balanceDue: new Prisma.Decimal(64000),
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.studentFeeItems.set('sfi-1-1', { id: 'sfi-1-1', studentFeeAccountId: acc1Id, feeHeadId: 'fh-tuition', amount: new Prisma.Decimal(50000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(50000), status: 'PENDING' });
  store.studentFeeItems.set('sfi-1-2', { id: 'sfi-1-2', studentFeeAccountId: acc1Id, feeHeadId: 'fh-dev', amount: new Prisma.Decimal(10000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(10000), status: 'PENDING' });
  store.studentFeeItems.set('sfi-1-3', { id: 'sfi-1-3', studentFeeAccountId: acc1Id, feeHeadId: 'fh-exam', amount: new Prisma.Decimal(2500), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(2500), status: 'PENDING' });
  store.studentFeeItems.set('sfi-1-4', { id: 'sfi-1-4', studentFeeAccountId: acc1Id, feeHeadId: 'fh-library', amount: new Prisma.Decimal(1000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(1000), status: 'PENDING' });
  store.studentFeeItems.set('sfi-1-5', { id: 'sfi-1-5', studentFeeAccountId: acc1Id, feeHeadId: 'fh-sports', amount: new Prisma.Decimal(500), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(500), status: 'PENDING' });

  const acc2Id = 'sfa-stu-2';
  store.studentFeeAccounts.set(acc2Id, {
    id: acc2Id,
    studentId: 'stu-2',
    feeStructureId: structureId,
    academicYearCode: '2026-27',
    totalDue: new Prisma.Decimal(64000),
    totalPaid: new Prisma.Decimal(0),
    totalDiscount: new Prisma.Decimal(0),
    totalWaived: new Prisma.Decimal(0),
    balanceDue: new Prisma.Decimal(64000),
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.studentFeeItems.set('sfi-2-1', { id: 'sfi-2-1', studentFeeAccountId: acc2Id, feeHeadId: 'fh-tuition', amount: new Prisma.Decimal(50000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(50000), status: 'PENDING' });
  store.studentFeeItems.set('sfi-2-2', { id: 'sfi-2-2', studentFeeAccountId: acc2Id, feeHeadId: 'fh-dev', amount: new Prisma.Decimal(10000), paidAmount: new Prisma.Decimal(0), outstandingAmount: new Prisma.Decimal(10000), status: 'PENDING' });

  let idCounter = 1;

  const mockPrisma: any = {
    feeInvoice: {
      count: async ({ where }: any) => {
        let list = Array.from(store.feeInvoices.values());
        if (where?.studentId) list = list.filter(i => i.studentId === where.studentId);
        if (where?.status) list = list.filter(i => i.status === where.status);
        if (where?.academicYearCode) list = list.filter(i => i.academicYearCode === where.academicYearCode);
        return list.length;
      },
      findUnique: async ({ where }: any) => {
        let inv = null;
        if (where.id) inv = store.feeInvoices.get(where.id);
        if (where.invoiceNumber) {
          for (const i of store.feeInvoices.values()) {
            if (i.invoiceNumber === where.invoiceNumber) {
              inv = i;
              break;
            }
          }
        }
        if (!inv) return null;
        const student = store.students.get(inv.studentId);
        const feeStructure = store.feeStructures.get(inv.feeStructureId);
        const items = Array.from(store.feeInvoiceItems.values())
          .filter(i => i.invoiceId === inv.id)
          .map(i => ({
            ...i,
            feeHead: store.feeHeads.get(i.feeHeadId),
            studentFeeItem: store.studentFeeItems.get(i.studentFeeItemId),
          }));
        const auditLogs = Array.from(store.feeInvoiceAuditLogs.values())
          .filter(l => l.invoiceId === inv.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return {
          ...inv,
          student: student ? {
            ...student,
            institute: store.institutes.get(student.instituteId),
            department: store.departments.get(student.departmentId),
            batch: { program: store.programs.get('prog-btech-ce') },
          } : null,
          feeStructure: feeStructure ? {
            ...feeStructure,
            program: store.programs.get(feeStructure.programId),
            semester: store.semesters.get(feeStructure.semesterId),
          } : null,
          items,
          auditLogs,
        };
      },
      findMany: async ({ where, skip = 0, take = 50 }: any) => {
        let list = Array.from(store.feeInvoices.values());
        if (where?.studentId) list = list.filter(i => i.studentId === where.studentId);
        if (where?.status) list = list.filter(i => i.status === where.status);
        if (where?.invoiceNumber?.contains) {
          list = list.filter(i => i.invoiceNumber.toLowerCase().includes(where.invoiceNumber.contains.toLowerCase()));
        }
        return list.slice(skip, skip + take).map(inv => {
          const student = store.students.get(inv.studentId);
          const feeStructure = store.feeStructures.get(inv.feeStructureId);
          const items = Array.from(store.feeInvoiceItems.values())
            .filter(i => i.invoiceId === inv.id)
            .map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
          return {
            ...inv,
            student: student ? {
              ...student,
              institute: store.institutes.get(student.instituteId),
              department: store.departments.get(student.departmentId),
              batch: { program: store.programs.get('prog-btech-ce') },
            } : null,
            feeStructure: feeStructure ? {
              ...feeStructure,
              program: store.programs.get(feeStructure.programId),
              semester: store.semesters.get(feeStructure.semesterId),
            } : null,
            items,
          };
        });
      },
      create: async ({ data }: any) => {
        const id = `inv-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.feeInvoices.set(id, record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const current = store.feeInvoices.get(where.id);
        if (!current) throw new Error('Invoice not found');
        const updated = {
          ...current,
          ...data,
          updatedAt: new Date(),
        };
        store.feeInvoices.set(where.id, updated);
        return updated;
      },
    },
    feeInvoiceItem: {
      create: async ({ data }: any) => {
        const id = `invi-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.feeInvoiceItems.set(id, record);
        return record;
      },
    },
    feeInvoiceAuditLog: {
      create: async ({ data }: any) => {
        const id = `inval-${idCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
        };
        store.feeInvoiceAuditLogs.set(id, record);
        return record;
      },
      findMany: async ({ where }: any) => {
        let list = Array.from(store.feeInvoiceAuditLogs.values());
        if (where?.invoiceId) list = list.filter(l => l.invoiceId === where.invoiceId);
        return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
    },
    studentFeeAccount: {
      findUnique: async ({ where }: any) => {
        const acc = store.studentFeeAccounts.get(where.id);
        if (!acc) return null;
        const student = store.students.get(acc.studentId);
        const feeStructure = store.feeStructures.get(acc.feeStructureId);
        const items = Array.from(store.studentFeeItems.values())
          .filter(i => i.studentFeeAccountId === acc.id)
          .map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
        return {
          ...acc,
          student,
          feeStructure: feeStructure ? {
            ...feeStructure,
            program: store.programs.get(feeStructure.programId),
            semester: store.semesters.get(feeStructure.semesterId),
          } : null,
          items,
        };
      },
    },
    studentFeeItem: {
      findMany: async ({ where }: any) => {
        let list = Array.from(store.studentFeeItems.values());
        if (where?.studentFeeAccountId) list = list.filter(i => i.studentFeeAccountId === where.studentFeeAccountId);
        return list.map(i => ({ ...i, feeHead: store.feeHeads.get(i.feeHeadId) }));
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'usr-student-1') return { id: 'usr-student-1', student: store.students.get('stu-1') };
        if (where.id === 'usr-student-2') return { id: 'usr-student-2', student: store.students.get('stu-2') };
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
    // 1. Generate Full Fee Invoice for Student 1
    console.log('--- TEST GROUP 1: Generate Full Fee Invoice ---');
    const invoiceRes = await feesController.generateFeeInvoice({
      studentFeeAccountId: acc1Id,
      dueDate: '2026-09-30',
      status: FeeInvoiceStatusEnum.ISSUED,
      remarks: 'Official Fall 2026 Semester Demand Notice',
    }, mockFinanceAdminReq);

    assert(!!invoiceRes && !!invoiceRes.id, 'Fee Invoice generated successfully with ID');
    assert(invoiceRes.invoiceNumber === 'SSIU/FEE/2026-27/000001', `Generated unique sequential invoice number: ${invoiceRes.invoiceNumber}`);
    assert(invoiceRes.studentId === 'stu-1', 'Invoice linked to Student 1');
    assert(Number(invoiceRes.subtotal) === 64000, 'Calculated subtotal is ₹64,000');
    assert(Number(invoiceRes.discountAmount) === 0, 'Discount is ₹0');
    assert(Number(invoiceRes.waiverAmount) === 0, 'Waiver is ₹0');
    assert(Number(invoiceRes.lateFeeAmount) === 0, 'Late fee is ₹0 initially');
    assert(Number(invoiceRes.totalAmount) === 64000, 'Total payable amount matches ₹64,000');
    assert(invoiceRes.status === 'ISSUED', 'Invoice status is ISSUED');
    assert(invoiceRes.items.length === 5, 'All 5 fee head items attached to invoice');

    // 2. Partial Fee Item Selection (Exam + Library only = ₹3,500)
    console.log('\n--- TEST GROUP 2: Partial Fee Item Demand Generation ---');
    const partialInvoice = await feesController.generateFeeInvoice({
      studentFeeAccountId: acc1Id,
      dueDate: '2026-09-15',
      status: FeeInvoiceStatusEnum.ISSUED,
      feeItemIds: ['sfi-1-3', 'sfi-1-4'], // Exam (₹2,500) + Library (₹1,000)
      remarks: 'Supplementary Mid-Sem Demand',
    }, mockFinanceAdminReq);

    assert(partialInvoice.invoiceNumber === 'SSIU/FEE/2026-27/000002', `Sequential invoice number generated: ${partialInvoice.invoiceNumber}`);
    assert(Number(partialInvoice.totalAmount) === 3500, 'Partial invoice total accurately calculated: ₹3,500 (₹2,500 + ₹1,000)');
    assert(partialInvoice.items.length === 2, 'Only 2 selected fee items included in demand');

    // 3. Draft Invoice Lifecycle: Create -> Update Draft -> Issue
    console.log('\n--- TEST GROUP 3: Draft Invoice Lifecycle ---');
    const draftInvoice = await feesController.generateFeeInvoice({
      studentFeeAccountId: acc2Id,
      dueDate: '2026-10-15',
      status: FeeInvoiceStatusEnum.DRAFT,
      remarks: 'Draft assessment for Student 2',
    }, mockFinanceAdminReq);

    assert(draftInvoice.status === 'DRAFT', 'Invoice created in DRAFT status');

    // Update Draft Due Date
    const updatedDraft = await feesController.updateFeeInvoice(draftInvoice.id, {
      dueDate: '2026-10-31',
      remarks: 'Extended due date draft',
    }, mockFinanceAdminReq);
    assert(updatedDraft.dueDate.toISOString().startsWith('2026-10-31'), 'Draft invoice due date updated successfully');

    // Issue Draft Invoice
    const issuedInvoice = await feesController.issueFeeInvoice(draftInvoice.id, mockFinanceAdminReq);
    assert(issuedInvoice.status === 'ISSUED', 'Draft invoice transitioned to ISSUED');

    // Attempting to edit an issued invoice should fail
    let editIssuedBlocked = false;
    try {
      await feesController.updateFeeInvoice(draftInvoice.id, { dueDate: '2026-11-15' }, mockFinanceAdminReq);
    } catch (err: any) {
      editIssuedBlocked = err instanceof BadRequestException && err.message.includes('Only DRAFT invoices can be updated');
    }
    assert(editIssuedBlocked, 'Editing an ISSUED invoice strictly blocked with 400 Bad Request');

    // 4. Invoice Cancellation Workflow
    console.log('\n--- TEST GROUP 4: Cancellation Workflow ---');
    const cancelledInvoice = await feesController.cancelFeeInvoice(partialInvoice.id, {
      cancellationReason: 'Category revision requested by Dean',
    }, mockFinanceAdminReq);

    assert(cancelledInvoice.status === 'CANCELLED', 'Invoice status updated to CANCELLED');
    assert(cancelledInvoice.cancellationReason === 'Category revision requested by Dean', 'Cancellation reason preserved');
    assert(cancelledInvoice.cancelledBy === mockFinanceAdminReq.user.id, 'CancelledBy actor ID stored');

    // Attempting to cancel an already cancelled invoice should fail
    let cancelTwiceBlocked = false;
    try {
      await feesController.cancelFeeInvoice(partialInvoice.id, { cancellationReason: 'Again' }, mockFinanceAdminReq);
    } catch (err: any) {
      cancelTwiceBlocked = err instanceof BadRequestException && err.message.includes('already cancelled');
    }
    assert(cancelTwiceBlocked, 'Cancelling an already CANCELLED invoice rejected with 400 Bad Request');

    // 5. PDF & Print Document Payload
    console.log('\n--- TEST GROUP 5: PDF / Print Demand Notice Generation ---');
    const pdfPayload = await feesController.getFeeInvoicePdf(invoiceRes.id, mockFinanceAdminReq);
    assert(!!pdfPayload.html && pdfPayload.html.includes('Swarrnim Startup & Innovation University'), 'PDF payload includes university letterhead');
    assert(pdfPayload.html.includes('SSIU/FEE/2026-27/000001'), 'PDF includes invoice number');
    assert(pdfPayload.totalPayable === 64000, 'PDF payload contains accurate total payable');
    assert(!!pdfPayload.base64Pdf, 'Generated base64 PDF payload');

    // 6. Security & Student Privacy Isolation
    console.log('\n--- TEST GROUP 6: Student Privacy & RBAC Enforcement ---');
    // Student 1 retrieves their own invoices
    const student1Invoices = await feesController.getMyFeeInvoices(mockStudent1Req);
    assert(student1Invoices.length >= 1 && student1Invoices.every((i: any) => i.studentId === 'stu-1'), 'Student 1 can view only their own invoices');

    // Student 1 tries to access Student 2's invoice directly
    let student2InvoiceBlocked = false;
    try {
      await feesController.getFeeInvoiceById(draftInvoice.id, mockStudent1Req); // Student 2's invoice
    } catch (err: any) {
      student2InvoiceBlocked = err instanceof ForbiddenException;
    }
    assert(student2InvoiceBlocked, 'Student 1 strictly blocked from viewing Student 2 invoice with 403 Forbidden');

    // Student 1 tries to call getStudentFeeInvoicesByStudentId for Student 2
    let student2ListBlocked = false;
    try {
      await feesController.getStudentFeeInvoicesByStudentId('stu-2', mockStudent1Req);
    } catch (err: any) {
      student2ListBlocked = err instanceof ForbiddenException;
    }
    assert(student2ListBlocked, 'Student 1 strictly blocked from listing Student 2 invoices with 403 Forbidden');

    // 7. Validation & Error Handling
    console.log('\n--- TEST GROUP 7: Validation & Edge Cases ---');
    // Due date earlier than invoice date
    let pastDueDateRejected = false;
    try {
      await feesController.generateFeeInvoice({
        studentFeeAccountId: acc1Id,
        dueDate: '2020-01-01',
      }, mockFinanceAdminReq);
    } catch (err: any) {
      pastDueDateRejected = err instanceof BadRequestException && err.message.includes('Due Date cannot be earlier than Invoice Date');
    }
    assert(pastDueDateRejected, 'Due date in the past rejected with 400 Bad Request');

    // Invalid student fee account
    let invalidAccountRejected = false;
    try {
      await feesController.generateFeeInvoice({
        studentFeeAccountId: 'invalid-id',
        dueDate: '2026-09-30',
      }, mockFinanceAdminReq);
    } catch (err: any) {
      invalidAccountRejected = err instanceof NotFoundException;
    }
    assert(invalidAccountRejected, 'Non-existent fee account rejected with 404 Not Found');

    // 8. Audit Logging Verification
    console.log('\n--- TEST GROUP 8: Audit Logging ---');
    const invoiceAuditLogs = await feesController.getFeeInvoiceAuditLogs(invoiceRes.id, mockFinanceAdminReq);
    assert(invoiceAuditLogs.length >= 1, 'Audit log persisted for invoice generation');
    assert(invoiceAuditLogs.some((l: any) => l.action === 'ISSUED'), 'Audit log contains ISSUED action');
    assert(invoiceAuditLogs.some((l: any) => l.action === 'DOWNLOADED'), 'Audit log records DOWNLOADED action');

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

runFeeInvoiceTests();
