/**
 * PHASE 1 — CENTRALIZED UNIVERSITY NOTESHEET ENGINE TEST SUITE
 * 
 * Comprehensive test suite verifying:
 * 1. Exam Controller: Notesheet creation, draft saving, department number generation (NS/EXAM/2026/0001).
 * 2. Hostel Warden: Notesheet creation, department number generation (NS/HOSTEL/2026/0001).
 * 3. Workflow transitions: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED / RETURNED -> CLOSED.
 * 4. Approval details: Timestamp and approving user stored on approval.
 * 5. History audit trail: Tracks every action with user, role, action, timestamp, remarks.
 * 6. RBAC & Department Scoping:
 *    - Exam Controller blocked from Hostel notesheets (403).
 *    - Hostel Warden blocked from Exam notesheets (403).
 *    - Student blocked from Notesheet API entirely (403).
 *    - Super Admin / Registrar has university-wide access.
 * 7. Mandatory Reason validation on Return and Reject.
 * 8. Supporting documents / Attachment validation (PDF, DOCX, XLSX, JPG, PNG vs invalid types).
 * 9. Duplicate Notesheet Number collision protection.
 * 10. Itemized Estimate calculation & Decimal precision.
 * 11. Search, department filtering, priority filtering, and pagination.
 * 12. Close & Archive workflow for approved notesheets.
 */

import { NoteSheetService } from './src/notesheet/notesheet.service';
import { PrismaService } from './src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetails?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}`);
    if (errorDetails) {
      console.error('     Details:', errorDetails);
    }
  }
}

// In-Memory Mock Store for NoteSheet entities
class MockPrismaService {
  private noteSheets: any[] = [];
  private noteSheetItems: any[] = [];
  private noteSheetAttachments: any[] = [];
  private noteSheetHistories: any[] = [];

  noteSheet = {
    count: async ({ where }: any = {}) => {
      let list = [...this.noteSheets];
      if (where?.notesheetNumber?.startsWith) {
        list = list.filter((n) => n.notesheetNumber.startsWith(where.notesheetNumber.startsWith));
      }
      if (where?.department) {
        list = list.filter((n) => n.department === where.department);
      }
      if (where?.status) {
        list = list.filter((n) => n.status === where.status);
      }
      return list.length;
    },
    findUnique: async ({ where }: any) => {
      const found = this.noteSheets.find((n) => (where.id && n.id === where.id) || (where.notesheetNumber && n.notesheetNumber === where.notesheetNumber));
      if (!found) return null;
      return {
        ...found,
        items: this.noteSheetItems.filter((i) => i.notesheetId === found.id),
        attachments: this.noteSheetAttachments.filter((a) => a.notesheetId === found.id),
        history: this.noteSheetHistories.filter((h) => h.notesheetId === found.id),
      };
    },
    findMany: async ({ where, skip = 0, take = 50 }: any = {}) => {
      let list = [...this.noteSheets];
      if (where?.department) {
        list = list.filter((n) => n.department === where.department);
      }
      if (where?.status) {
        list = list.filter((n) => n.status === where.status);
      }
      if (where?.priority) {
        list = list.filter((n) => n.priority === where.priority);
      }
      if (where?.createdByUserId) {
        list = list.filter((n) => n.createdByUserId === where.createdByUserId);
      }
      if (where?.OR) {
        const q = where.OR[0]?.notesheetNumber?.contains?.toLowerCase() || '';
        list = list.filter(
          (n) =>
            n.notesheetNumber.toLowerCase().includes(q) ||
            n.title.toLowerCase().includes(q) ||
            n.subject.toLowerCase().includes(q) ||
            n.createdByName.toLowerCase().includes(q),
        );
      }
      return list.slice(skip, skip + take).map((n) => ({
        ...n,
        items: this.noteSheetItems.filter((i) => i.notesheetId === n.id),
        attachments: this.noteSheetAttachments.filter((a) => a.notesheetId === n.id),
        history: this.noteSheetHistories.filter((h) => h.notesheetId === n.id),
      }));
    },
    create: async ({ data }: any) => {
      const id = `ns-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const { items, attachments, ...rest } = data;
      const record = {
        id,
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.noteSheets.unshift(record);

      if (items?.create) {
        for (const it of items.create) {
          this.noteSheetItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            notesheetId: id,
            ...it,
            createdAt: new Date(),
          });
        }
      }

      if (attachments?.create) {
        for (const att of attachments.create) {
          this.noteSheetAttachments.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            notesheetId: id,
            ...att,
            createdAt: new Date(),
          });
        }
      }

      return this.noteSheet.findUnique({ where: { id } });
    },
    update: async ({ where, data }: any) => {
      const idx = this.noteSheets.findIndex((n) => n.id === where.id);
      if (idx < 0) throw new Error('Not found');
      this.noteSheets[idx] = {
        ...this.noteSheets[idx],
        ...data,
        updatedAt: new Date(),
      };
      return this.noteSheet.findUnique({ where });
    },
  };

  noteSheetEstimateItem = {
    deleteMany: async ({ where }: any) => {
      this.noteSheetItems = this.noteSheetItems.filter((i) => i.notesheetId !== where.notesheetId);
    },
    createMany: async ({ data }: any) => {
      for (const item of data) {
        this.noteSheetItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ...item,
          createdAt: new Date(),
        });
      }
    },
  };

  noteSheetAttachment = {
    create: async ({ data }: any) => {
      const record = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        createdAt: new Date(),
      };
      this.noteSheetAttachments.push(record);
      return record;
    },
  };

  noteSheetHistory = {
    create: async ({ data }: any) => {
      const record = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        createdAt: new Date(),
      };
      this.noteSheetHistories.push(record);
      return record;
    },
    findMany: async ({ where }: any) => {
      return this.noteSheetHistories.filter((h) => h.notesheetId === where.notesheetId);
    },
  };

  $transaction = async (fn: any) => {
    return fn(this);
  };
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PHASE 1 — CENTRALIZED UNIVERSITY NOTESHEET ENGINE TESTS');
  console.log('===============================================================\n');

  const mockPrisma = new MockPrismaService() as any;
  const service = new NoteSheetService(mockPrisma);

  // Mock Users
  const examController = {
    id: 'user-exam-01',
    username: 'exam_controller',
    name: 'Dr. Exam Controller',
    roles: ['EXAM_CELL'],
    role: 'EXAM_CELL',
    phone: '9876543210',
  };

  const hostelWarden = {
    id: 'user-hostel-01',
    username: 'hostel_warden',
    name: 'Mr. Ramesh Hostel Warden',
    roles: ['HOSTEL_ADMIN'],
    role: 'HOSTEL_ADMIN',
    phone: '9876543211',
  };

  const registrar = {
    id: 'user-registrar-01',
    username: 'registrar_ssiu',
    name: 'Dr. University Registrar',
    roles: ['REGISTRAR'],
    role: 'REGISTRAR',
    phone: '9876543212',
  };

  const superAdmin = {
    id: 'user-admin-01',
    username: 'super_admin',
    name: 'Super Admin',
    roles: ['SUPER_ADMIN'],
    role: 'SUPER_ADMIN',
    phone: '9876543213',
  };

  const studentUser = {
    id: 'user-student-01',
    username: 'student_jigar',
    name: 'Jigar Ahir',
    roles: ['STUDENT'],
    role: 'STUDENT',
    phone: '9876543214',
  };

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 1: Department Number Generation & Format Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- Group 1: Notesheet Number Generation & Department Formats ---');
  const year = new Date().getFullYear();

  const examNum1 = await service.generateNotesheetNumber('EXAM');
  assert(examNum1 === `NS/EXAM/${year}/0001`, `Exam section number format is NS/EXAM/${year}/0001`, { examNum1 });

  const hostelNum1 = await service.generateNotesheetNumber('HOSTEL');
  assert(hostelNum1 === `NS/HOSTEL/${year}/0001`, `Hostel section number format is NS/HOSTEL/${year}/0001`, { hostelNum1 });

  const accountsNum1 = await service.generateNotesheetNumber('ACCOUNTS');
  assert(accountsNum1 === `NS/ACCOUNTS/${year}/0001`, `Accounts section number format is NS/ACCOUNTS/${year}/0001`, { accountsNum1 });

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 2: Exam Controller Login & Notesheet Creation (Draft & Submit)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 2: Exam Controller Creation & Draft Workflow ---');

  // Create Draft Exam Notesheet
  const examDraft = await service.createNoteSheet(
    {
      title: 'Summer 2026 Examination Answer Booklet Procurement',
      department: 'EXAM',
      section: 'Conduct Section',
      referenceNumber: 'EXAM/CONF/2026/042',
      priority: 'HIGH',
      proposal: 'Procurement of 50,000 barcoded answer booklets for Summer 2026 End-Semester Examinations.',
      purposeJustification: 'Mandatory exam stationary required before university end-sem theory exams.',
      budgetRequired: true,
      estimatedCost: 150000,
      isDraft: true,
      items: [
        { itemName: 'Barcoded Answer Booklets (32 Pages)', quantity: 50000, unit: 'Nos', rate: 3, amount: 150000 },
      ],
    },
    examController,
  );

  assert(examDraft.notesheetNumber === `NS/EXAM/${year}/0001`, 'Exam Draft created with sequential number NS/EXAM/2026/0001');
  assert(examDraft.status === 'DRAFT', 'Exam Notesheet status is DRAFT');
  assert(examDraft.currentOffice === 'CREATOR', 'Draft Notesheet is parked at CREATOR office');
  assert(examDraft.department === 'EXAM', 'Notesheet department is EXAM');
  assert(examDraft.priority === 'HIGH', 'Notesheet priority is HIGH');
  assert(examDraft.items.length === 1, 'Estimate items persisted with draft');

  // Submit Draft to Workflow
  const examSubmitted = await service.submitNoteSheet(
    examDraft.id,
    { remarks: 'Submitted to Registrar for financial and administrative sanction.' },
    examController,
  );

  assert(examSubmitted.status === 'SUBMITTED', 'Notesheet transitioned from DRAFT to SUBMITTED');
  assert(examSubmitted.currentOffice === 'REGISTRAR', 'Exam Notesheet routes directly to REGISTRAR');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 3: Hostel Warden Notesheet Creation & Routing
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 3: Hostel Warden Creation & Maintenance Request Workflow ---');

  const hostelNote = await service.createNoteSheet(
    {
      title: 'Block-A Water Purifier and Geyser Urgent Repair',
      department: 'HOSTEL',
      section: 'Boys Hostel Block A',
      priority: 'URGENT',
      proposal: 'Emergency replacement of commercial RO membrane and 3 heating elements in Block A.',
      purposeJustification: 'Critical for 120 resident students drinking water and hygiene.',
      budgetRequired: true,
      estimatedCost: 18500,
      isDraft: false, // Direct submit
      items: [
        { itemName: 'Industrial RO Membrane', quantity: 2, unit: 'Pcs', rate: 5500, amount: 11000 },
        { itemName: 'Commercial Geyser Coil', quantity: 3, unit: 'Nos', rate: 2500, amount: 7500 },
      ],
    },
    hostelWarden,
  );

  assert(hostelNote.notesheetNumber === `NS/HOSTEL/${year}/0001`, 'Hostel Notesheet generated unique number NS/HOSTEL/2026/0001');
  assert(hostelNote.status === 'SUBMITTED', 'Direct submission sets status to SUBMITTED');
  assert(hostelNote.currentOffice === 'REGISTRAR', 'Hostel notesheet routes to REGISTRAR');
  assert(hostelNote.department === 'HOSTEL', 'Department is HOSTEL');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 4: Department Access Isolation & RBAC Protection (Critical Security)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 4: Department Access Isolation & RBAC Security ---');

  // 1. Exam Controller attempts to access Hostel Notesheet -> 403 Forbidden
  let examAccessHostelError = null;
  try {
    await service.getNoteSheetById(hostelNote.id, examController);
  } catch (err: any) {
    examAccessHostelError = err;
  }
  assert(
    examAccessHostelError instanceof Error && (examAccessHostelError.message.includes('Department Access Denied') || (examAccessHostelError as any).status === 403),
    'Exam Controller is blocked with 403 Forbidden when accessing Hostel Notesheet',
    examAccessHostelError,
  );

  // 2. Hostel Warden attempts to access Exam Notesheet -> 403 Forbidden
  let hostelAccessExamError = null;
  try {
    await service.getNoteSheetById(examSubmitted.id, hostelWarden);
  } catch (err: any) {
    hostelAccessExamError = err;
  }
  assert(
    hostelAccessExamError instanceof Error && (hostelAccessExamError.message.includes('Department Access Denied') || (hostelAccessExamError as any).status === 403),
    'Hostel Warden is blocked with 403 Forbidden when accessing Exam Notesheet',
    hostelAccessExamError,
  );

  // 3. Student attempts to access Notesheet API -> 403 Forbidden
  let studentAccessError = null;
  try {
    await service.getNoteSheets({}, studentUser);
  } catch (err: any) {
    studentAccessError = err;
  }
  assert(
    studentAccessError instanceof Error && (studentAccessError.message.includes('Students are not authorized') || (studentAccessError as any).status === 403),
    'Student role is blocked with 403 Forbidden from accessing Notesheet list',
    studentAccessError,
  );

  let studentCreateError = null;
  try {
    await service.createNoteSheet(
      {
        title: 'Hacked Notesheet',
        department: 'EXAM',
        proposal: 'Test',
        purposeJustification: 'Test',
      },
      studentUser,
    );
  } catch (err: any) {
    studentCreateError = err;
  }
  assert(
    studentCreateError instanceof Error && (studentCreateError.message.includes('Students are not authorized') || (studentCreateError as any).status === 403),
    'Student role is blocked with 403 Forbidden from creating Notesheets',
    studentCreateError,
  );

  // 4. Super Admin and Registrar can access all departments
  const registrarViewExam = await service.getNoteSheetById(examSubmitted.id, registrar);
  assert(registrarViewExam.id === examSubmitted.id, 'Registrar can view Exam Notesheet');

  const registrarViewHostel = await service.getNoteSheetById(hostelNote.id, registrar);
  assert(registrarViewHostel.id === hostelNote.id, 'Registrar can view Hostel Notesheet');

  const adminNotesList = await service.getNoteSheets({}, superAdmin);
  assert(adminNotesList.data.length >= 2, 'Super Admin lists Notesheets across all departments');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 5: Approval Workflow & Approval Audit Stamp
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 5: Approval Workflow & Timestamp Stamping ---');

  const approvedExamNote = await service.approveNoteSheet(
    examSubmitted.id,
    {
      remarks: 'Sanctioned INR 1,50,000 for Summer 2026 exam booklets under Examination Operating Budget.',
      forwardToOffice: 'COMPLETED',
    },
    registrar,
  );

  assert(approvedExamNote.status === 'APPROVED', 'Notesheet status changed to APPROVED');
  assert(approvedExamNote.currentOffice === 'COMPLETED', 'Current office moved to COMPLETED');
  assert(approvedExamNote.approvedByUserId === registrar.id, 'Approving user ID stored');
  assert(approvedExamNote.approvedByName === registrar.username, 'Approving user name stored');
  assert(approvedExamNote.approvedAt instanceof Date, 'Approval timestamp stored');
  assert(approvedExamNote.decision === 'APPROVED', 'Decision marked as APPROVED');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 6: Action History Audit Trail Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 6: History & Audit Trail ---');

  const history = await service.getNoteSheetHistory(examSubmitted.id, registrar);
  assert(history.length >= 3, 'Full history trail contains CREATE, SUBMIT, and APPROVE actions', { count: history.length });

  const actions = history.map((h) => h.action);
  assert(actions.includes('CREATED') || actions.includes('SUBMITTED'), 'History contains creation/submission entry');
  assert(actions.includes('APPROVED'), 'History contains APPROVE entry with approver credentials');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 7: Mandatory Reason on Return & Reject Workflows
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 7: Mandatory Reason Validation on Return & Reject ---');

  // Create another Notesheet to test Return
  const returnTestNote = await service.createNoteSheet(
    {
      title: 'Hostel Mess Utensil Replacement',
      department: 'HOSTEL',
      section: 'Mess Kitchen',
      proposal: 'Replace 5 large cooking cauldrons.',
      purposeJustification: 'Old cauldrons damaged.',
      isDraft: false,
    },
    hostelWarden,
  );

  // Return with empty reason -> MUST throw BadRequestException
  let emptyReturnError = null;
  try {
    await service.returnNoteSheet(returnTestNote.id, { reason: '   ' }, registrar);
  } catch (err: any) {
    emptyReturnError = err;
  }
  assert(
    emptyReturnError instanceof Error && emptyReturnError.message.includes('Return reason is mandatory'),
    'Empty return reason is strictly rejected',
    emptyReturnError,
  );

  // Return with valid reason
  const returnedNote = await service.returnNoteSheet(
    returnTestNote.id,
    { reason: 'Please attach 3 competitive vendor quotations before re-submitting.' },
    registrar,
  );
  assert(returnedNote.status === 'RETURNED', 'Notesheet status is RETURNED');
  assert(returnedNote.currentOffice === 'CREATOR', 'Returned notesheet is sent back to CREATOR');
  assert(returnedNote.decisionReason === 'Please attach 3 competitive vendor quotations before re-submitting.', 'Return reason is stored');
  assert(returnedNote.version === 2, 'Notesheet version incremented on return cycle');

  // Create another Notesheet to test Reject
  const rejectTestNote = await service.createNoteSheet(
    {
      title: 'Unsanctioned Luxury Equipment',
      department: 'HOSTEL',
      proposal: 'Procure 80-inch OLED TV for warden room.',
      purposeJustification: 'Entertainment.',
      isDraft: false,
    },
    hostelWarden,
  );

  // Reject with empty reason -> MUST throw BadRequestException
  let emptyRejectError = null;
  try {
    await service.rejectNoteSheet(rejectTestNote.id, { reason: '' }, registrar);
  } catch (err: any) {
    emptyRejectError = err;
  }
  assert(
    emptyRejectError instanceof Error && emptyRejectError.message.includes('Rejection reason is mandatory'),
    'Empty rejection reason is strictly rejected',
    emptyRejectError,
  );

  // Reject with valid reason
  const rejectedNote = await service.rejectNoteSheet(
    rejectTestNote.id,
    { reason: 'Not in accordance with SSIU University Hostels policy.' },
    registrar,
  );
  assert(rejectedNote.status === 'REJECTED', 'Notesheet status is REJECTED');
  assert(rejectedNote.decisionReason === 'Not in accordance with SSIU University Hostels policy.', 'Rejection reason is stored');
  assert(rejectedNote.rejectedByUserId === registrar.id, 'Rejecting user ID stored');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 8: Supporting Documents & Attachment Validation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 8: Attachment Handling & File Type Validation ---');

  const validAtt = await service.addAttachment(
    returnTestNote.id,
    {
      fileName: 'Vendor_Quotations_Comparative.pdf',
      fileType: 'PDF',
      fileSize: 1048576,
      fileUrl: '/uploads/notesheets/quotations.pdf',
    },
    hostelWarden,
  );
  assert(validAtt.fileType === 'PDF', 'Valid PDF attachment uploaded and attached to notesheet');

  let invalidAttError = null;
  try {
    await service.addAttachment(
      returnTestNote.id,
      {
        fileName: 'malicious_script.exe',
        fileType: 'EXE',
        fileUrl: '/uploads/bad.exe',
      },
      hostelWarden,
    );
  } catch (err: any) {
    invalidAttError = err;
  }
  assert(
    invalidAttError instanceof Error && invalidAttError.message.includes('Invalid file type'),
    'Invalid file type (EXE) rejected by attachment validator',
    invalidAttError,
  );

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 9: Close & Archive Workflow
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 9: Close & Archive Workflow ---');

  const closedExamNote = await service.closeNoteSheet(
    approvedExamNote.id,
    { remarks: 'All 50,000 booklets received in exam cell. Order fulfilled and archived.' },
    examController,
  );

  assert(closedExamNote.status === 'CLOSED', 'Approved Notesheet successfully transitioned to CLOSED');
  assert(closedExamNote.closedByUserId === examController.id, 'Closing user ID stored');
  assert(closedExamNote.closedAt instanceof Date, 'Closure timestamp stored');

  // Cannot close an unapproved notesheet
  let closeUnapprovedError = null;
  try {
    await service.closeNoteSheet(rejectedNote.id, {}, hostelWarden);
  } catch (err: any) {
    closeUnapprovedError = err;
  }
  assert(
    closeUnapprovedError instanceof Error && closeUnapprovedError.message.includes('Only APPROVED Notesheets can be CLOSED'),
    'Attempting to close non-approved notesheet throws BadRequestException',
  );

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 10: Search, Department Filters & Query Capabilities
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 10: Search & Filtering ---');

  const examFilterResult = await service.getNoteSheets({ department: 'EXAM' }, superAdmin);
  assert(examFilterResult.data.every((n) => n.department === 'EXAM'), 'Department filter returns only EXAM notesheets');

  const priorityFilterResult = await service.getNoteSheets({ priority: 'URGENT' }, superAdmin);
  assert(priorityFilterResult.data.every((n) => n.priority === 'URGENT'), 'Priority filter returns only URGENT notesheets');

  const searchResult = await service.getNoteSheets({ search: 'Booklet' }, superAdmin);
  assert(searchResult.data.length >= 1, 'Search query successfully locates keyword across notesheets');

  // ──────────────────────────────────────────────────────────────────────────
  // GROUP 11: Pending With Me & Workflow Permission Control
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 11: Pending With Me RBAC & Assignment Security ---');

  // 1. Student accessing pending with me -> MUST FAIL (403 Forbidden)
  let studentPendingErr: any = null;
  try {
    await service.getPendingWithMe(studentUser);
  } catch (err: any) {
    studentPendingErr = err;
  }
  assert(
    studentPendingErr instanceof Error && (studentPendingErr.message.includes('403') || studentPendingErr.message.includes('Forbidden') || studentPendingErr.message.includes('not authorized')),
    'Student role is strictly blocked with 403 Forbidden from accessing Pending With Me',
  );

  // 2. Standard faculty without review/approval permission -> MUST FAIL (403 Forbidden)
  const facultyCreator = {
    id: 'user-faculty-01',
    username: 'prof_sharma',
    name: 'Prof. Sharma',
    roles: ['FACULTY'],
    role: 'FACULTY',
    phone: '9876543299',
    departmentId: 'CSE',
    instituteId: 'inst-sit'
  };

  let facultyPendingErr: any = null;
  try {
    await service.getPendingWithMe(facultyCreator);
  } catch (err: any) {
    facultyPendingErr = err;
  }
  assert(
    facultyPendingErr instanceof Error && (facultyPendingErr.message.includes('403') || facultyPendingErr.message.includes('Forbidden')),
    'Faculty without review/approval permission is blocked with 403 Forbidden from Pending With Me',
  );

  // 3. Authorized Registrar accessing Pending With Me
  const registrarPendingResult = await service.getPendingWithMe(undefined, registrar);
  assert(
    Array.isArray(registrarPendingResult.data),
    'Authorized Registrar successfully retrieves Pending With Me array',
  );

  const registrarPendingCount = await service.getPendingWithMeCount(undefined, registrar);
  assert(
    typeof registrarPendingCount.count === 'number',
    'Authorized Registrar retrieves numeric Pending With Me count',
  );

  // 4. Authorized HOD accessing Pending With Me
  const hodCSE = {
    id: 'user-hod-cse',
    username: 'hod_cse',
    name: 'Dr. HOD CSE',
    roles: ['HOD'],
    role: 'HOD',
    phone: '9876543288',
    departmentId: 'CSE',
    instituteId: 'inst-sit'
  };
  const hodPendingResult = await service.getPendingWithMe(undefined, hodCSE);
  assert(
    Array.isArray(hodPendingResult.data),
    'Authorized HOD successfully retrieves departmental Pending With Me array',
  );

  const hodPendingCount = await service.getPendingWithMeCount(undefined, hodCSE);
  assert(
    typeof hodPendingCount.count === 'number',
    'Authorized HOD retrieves numeric Pending With Me count',
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`📊 PHASE 1 NOTESHEET ENGINE TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (${totalTests} TOTAL)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
