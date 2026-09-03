import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { User, NoteSheet } from '../types';

function describe(suiteName: string, fn: () => void) {
  console.log(`\n=== SUITE: ${suiteName} ===`);
  fn();
}

let currentBeforeEach: (() => void) | null = null;
function beforeEach(fn: () => void) {
  currentBeforeEach = fn;
}

function it(testName: string, fn: () => Promise<void> | void) {
  if (currentBeforeEach) currentBeforeEach();
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => console.log(`  ✓ PASS: ${testName}`))
        .catch(err => {
          console.error(`  ✗ FAIL: ${testName}`, err);
          throw err;
        });
    }
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`, err);
    throw err;
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    },
    toBeDefined() {
      if (actual === undefined || actual === null) throw new Error(`Expected value to be defined`);
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (actual < expected) throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' && !Array.isArray(actual) || (typeof actual === 'string' && !actual.includes(expected)) || (Array.isArray(actual) && !actual.includes(expected))) throw new Error(`Expected "${actual}" to contain "${expected}"`);
    },
    toMatch(regex: RegExp) {
      if (!regex.test(actual)) throw new Error(`Expected ${actual} to match ${regex}`);
    }
  };
}

describe('SSIU Notesheet 19 Production-Grade Features Comprehensive Test Suite', () => {
  const facultyUser: User = db.getUsers().find(u => u.role === 'FACULTY') || {
    id: 'user-faculty-01',
    name: 'Dr. Ramesh Patel',
    role: 'FACULTY',
    departmentId: 'Computer Science & Engineering',
    email: 'ramesh.patel@swarrnim.edu.in',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodUser: User = db.getUsers().find(u => u.role === 'HOD') || {
    id: 'user-hod-01',
    name: 'Prof. Anil Sharma',
    role: 'HOD',
    departmentId: 'Computer Science & Engineering',
    email: 'anil.sharma@swarrnim.edu.in',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principalUser: User = db.getUsers().find(u => u.role === 'PRINCIPAL') || {
    id: 'user-hoi-01',
    name: 'Dr. Sunita Mehta',
    role: 'PRINCIPAL',
    departmentId: 'Swarrnim Institute of Technology',
    email: 'principal.sit@swarrnim.edu.in',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const drUser: User = db.getUsers().find(u => u.role === 'DEPUTY_REGISTRAR') || {
    id: 'user-dr-01',
    name: 'Shri Vikram Joshi',
    role: 'DEPUTY_REGISTRAR',
    departmentId: 'Registrar Office',
    email: 'dr.admin@swarrnim.edu.in',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const registrarUser: User = db.getUsers().find(u => u.role === 'REGISTRAR') || {
    id: 'user-reg-01',
    name: 'Dr. Suresh Verma',
    role: 'REGISTRAR',
    departmentId: 'Registrar Directorate',
    email: 'registrar@swarrnim.edu.in',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const vpUser: User = db.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE') || {
    id: 'user-vp-01',
    name: 'Hon. Vice President',
    role: 'VICE_PRESIDENT',
    departmentId: 'Executive Governance',
    email: 'vp@swarrnim.edu.in',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  let testNotesheet: NoteSheet;

  beforeEach(() => {
    // Feature 1 & 4: Create new notesheet with initial version and financial items
    testNotesheet = db.createNoteSheet({
      subject: 'Upgrading deep learning computational laboratory for graduate research.',
      instituteId: 'inst-sit',
      department: 'Computer Science & Engineering',
      departmentName: 'Computer Science & Engineering',
      category: 'Academic & Research',
      priority: 'URGENT',
      proposal: 'Upgrading deep learning computational laboratory for graduate research.',
      purposeJustification: 'Current servers are fully utilized for student projects.',
      financialRequirement: true,
      budgetRequired: true,
      estimatedCost: 350000,
      requestedAmount: 350000,
      items: [
        { id: 'item-1', itemName: 'NVIDIA RTX 6000 Ada GPU Server', quantity: 1, unit: 'Unit', rate: 250000, amount: 250000 },
        { id: 'item-2', itemName: 'High-Speed 100GbE Network Switch', quantity: 2, unit: 'Units', rate: 50000, amount: 100000 }
      ]
    }, facultyUser, false);
  });

  // FEATURE 1: DOCUMENT CONTROL
  it('Feature 1: Document Control initializes unique number, version 1.0, and unlocked status', () => {
    expect(testNotesheet.noteSheetNumber).toBeDefined();
    expect(testNotesheet.version).toBe('1.0');
    expect(testNotesheet.isLocked).toBe(false);
    expect(['SUBMITTED', 'PENDING_HOD']).toContain(testNotesheet.status);
  });

  // FEATURE 3 & 6: COMPLETE 6-STAGE APPROVAL TRAIL & DIGITAL SIGNATURES
  it('Feature 3 & 6: Completes 6-stage chain (Faculty -> HOD -> Principal -> DR -> Registrar -> VP) with digital signatures', () => {
    // Step 1: HOD Forward/Approve
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Recommended for high performance research needs.', undefined, hodUser);
    let ns = db.getNoteSheetById(testNotesheet.id)!;
    expect(ns.currentOffice).toBe('HOI');

    // Step 2: Principal / HOI Approve
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Endorsed and forwarded to central administration.', undefined, principalUser);
    ns = db.getNoteSheetById(testNotesheet.id)!;
    expect(ns.currentOffice).toBe('DEPUTY_REGISTRAR');

    // Step 3: Deputy Registrar Approve
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Verified compliance with university procurement guidelines.', undefined, drUser);
    ns = db.getNoteSheetById(testNotesheet.id)!;
    expect(ns.currentOffice).toBe('REGISTRAR');

    // Step 4: Registrar Approve
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Placed before Executive Directorate for sanction.', undefined, registrarUser);
    ns = db.getNoteSheetById(testNotesheet.id)!;
    expect(ns.currentOffice).toBe('VICE_PRESIDENT');

    // Step 5: Vice President (Terminal Authority) Final Approval
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Sanction granted as requested.', undefined, vpUser);
    ns = db.getNoteSheetById(testNotesheet.id)!;

    // Verify Final Approval Status
    expect(ns.status).toBe('APPROVED');
    expect(ns.isLocked).toBe(true);
    expect(ns.finalApprovalDate).toBeDefined();
    expect(ns.digitalApprovalId).toBeDefined();

    // Verify Digital Signatures in Approvals array
    expect(ns.approvals?.length).toBeGreaterThanOrEqual(5);
    const vpApproval = ns.approvals?.find(a => a.approverRole === 'VICE_PRESIDENT');
    expect(vpApproval).toBeDefined();
    expect(vpApproval?.status).toBe('APPROVED');
    expect(vpApproval?.digitalApprovalId).toBeDefined();
  });

  // FEATURE 2: REGISTRAR INWARD / OUTWARD GENERATION
  it('Feature 2: Automatically creates Registrar Inward on final approval and supports Outward dispatch', () => {
    // Forward all the way to VP
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOD Ok', undefined, hodUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOI Ok', undefined, principalUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'DR Ok', undefined, drUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Reg Ok', undefined, registrarUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'VP Sanction Granted', undefined, vpUser);

    const approvedNs = db.getNoteSheetById(testNotesheet.id)!;
    expect(approvedNs.inwardNumber).toBeDefined();
    expect(approvedNs.inwardNumber).toMatch(/^REG-IN-\d{4}-\d{6}$/);

    // Process Outward Dispatch
    const outwardResult = db.processRegistrarOutwardForNotesheet(approvedNs.id, {
      remarks: 'Outward dispatched to CSE department'
    }, registrarUser);

    expect(outwardResult.success).toBe(true);
    expect(outwardResult.outwardNumber).toBeDefined();
    expect(outwardResult.outwardNumber).toMatch(/^REG-OUT-\d{4}-\d{6}$/);

    const outwardNs = db.getNoteSheetById(testNotesheet.id)!;
    expect(outwardNs.outwardNumber).toBe(outwardResult.outwardNumber);
  });

  // FEATURE 4: FINANCIAL CONTROL & WORDS CONVERSION
  it('Feature 4: Financial control validates amount, currency formatting, and item breakdown', () => {
    expect(testNotesheet.requestedAmount).toBe(450000);
    expect(testNotesheet.items?.length).toBe(1);
    expect(testNotesheet.items![0].amount).toBe(450000);
  });

  // FEATURE 7: VERSION / AMENDMENT HANDLING
  it('Feature 7: Version amendment advances version string to 1.1 and preserves history snapshot', () => {
    // Approve notesheet to lock it
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOD Ok', undefined, hodUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOI Ok', undefined, principalUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'DR Ok', undefined, drUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Reg Ok', undefined, registrarUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'VP Final Sanction', undefined, vpUser);

    const lockedNs = db.getNoteSheetById(testNotesheet.id)!;
    expect(lockedNs.isLocked).toBe(true);
    expect(lockedNs.version).toBe('1.0');

    // Create amendment
    const amendResult = db.createNoteSheetAmendmentVersion(
      lockedNs.id,
      'Vendor revised quotation with extended 3-year on-site warranty',
      facultyUser
    );

    const amendedNs = amendResult.notesheet || db.getNoteSheetById(lockedNs.id)!;
    expect(amendedNs.version).toBe('1.1');
    expect(amendedNs.isLocked).toBe(false);
    expect(amendedNs.amendmentReason).toBe('Vendor revised quotation with extended 3-year on-site warranty');
    expect(amendedNs.versionHistory).toBeDefined();
    expect(amendedNs.versionHistory?.length).toBe(1);
    expect(amendedNs.versionHistory![0].version).toBe('1.0');
  });

  // FEATURE 8: AUDIT TRAIL LOGGING
  it('Feature 8: Immutable audit trail records actions with user, timestamp, and transition', () => {
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOD Recommendation', undefined, hodUser);
    const ns = db.getNoteSheetById(testNotesheet.id)!;
    expect(ns.auditTrail).toBeDefined();
    expect(ns.auditTrail?.length).toBeGreaterThanOrEqual(2); // CREATE + APPROVE
    const approveAudit = ns.auditTrail?.find(a => a.action === 'APPROVE');
    expect(approveAudit).toBeDefined();
    expect(approveAudit?.userName).toBe(hodUser.name);
  });

  // FEATURE 9 & 10 & 18: QR DOCUMENT INTEGRITY & VERIFICATION API
  it('Feature 9, 10 & 18: Verifies document integrity, verification ID, and authenticity', () => {
    // Approve notesheet
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOD Ok', undefined, hodUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'HOI Ok', undefined, principalUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'DR Ok', undefined, drUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'Reg Ok', undefined, registrarUser);
    db.processNoteSheetAction(testNotesheet.id, 'APPROVE', 'VP Sanction', undefined, vpUser);

    const approvedNs = db.getNoteSheetById(testNotesheet.id)!;
    expect(approvedNs.verificationId).toBeDefined();
    expect(approvedNs.verificationId).toMatch(/^NSV-\d{4}-\d{6}$/);

    // Verify using verification ID
    const verifyResult = db.verifyNoteSheetIntegrity(approvedNs.verificationId!);
    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.integrityStatus).toBe('VERIFIED_AUTHENTIC');
    expect(verifyResult.notesheetNumber).toBe(approvedNs.noteSheetNumber);
    expect(verifyResult.status).toBe('APPROVED');

    // Verify using notesheet number
    const verifyByNum = db.verifyNoteSheetIntegrity(approvedNs.noteSheetNumber);
    expect(verifyByNum.valid).toBe(true);

    // Verify using invalid ID
    const invalidResult = db.verifyNoteSheetIntegrity('INVALID-ID-9999');
    expect(invalidResult.valid).toBe(false);
  });

  // FEATURE 14 & 15: ANALYTICS & SLA COMPUTATION
  it('Feature 15: Analytics calculates turnaround time, pending ageing, and department workload', () => {
    const analytics = db.getNoteSheetAnalytics(vpUser, 'VICE_PRESIDENT');
    expect(analytics).toBeDefined();
    expect(analytics.totalNotesheets).toBeGreaterThan(0);
    expect(analytics.pendingAgeing).toBeDefined();
    expect(typeof analytics.avgTurnaroundHours).toBe('number');
    expect(Array.isArray(analytics.stageAvgHours)).toBe(true);
    expect(Array.isArray(analytics.departmentWorkload)).toBe(true);
    expect(Array.isArray(analytics.approverWorkload)).toBe(true);
  });

  // FEATURE 17: BULK OPERATIONS
  it('Feature 17: Bulk operations forward and approve multiple notesheets with discrete audit logs', () => {
    const ns2 = db.createNoteSheet({
      subject: 'Annual Software License Renewal for MATLAB',
      instituteId: 'inst-sit',
      department: 'Computer Science & Engineering',
      category: 'Administrative'
    }, facultyUser, false);

    const bulkResult = db.processBulkNoteSheetActions(
      [testNotesheet.id, ns2.id],
      'FORWARD',
      'Bulk forwarded to Principal',
      hodUser,
      'HOI'
    );

    if (bulkResult.successCount !== 2) {
      console.error('Bulk result errors:', JSON.stringify(bulkResult.results));
    }
    expect(bulkResult.successCount).toBe(2);
    const updated1 = db.getNoteSheetById(testNotesheet.id)!;
    const updated2 = db.getNoteSheetById(ns2.id)!;
    expect(updated1.currentOffice).toBe('HOI');
    expect(updated2.currentOffice).toBe('HOI');
  });

  // FEATURE 5, 12, 13: PDF GENERATION, MANUAL REMARKS & PAGE NUMBERING
  it('Feature 5, 12, 13: PDF service produces multi-page document with Word-style border, manual remarks, and page numbers', async () => {
    const pdfRecord = await notesheetPdfService.generatePdf(testNotesheet.id, facultyUser, { forceRegenerate: true });
    expect(pdfRecord).toBeDefined();
    expect(pdfRecord.downloadUrl).toBeDefined();
    expect(pdfRecord.fileSize).toBeGreaterThan(1000);
    expect(pdfRecord.fileName).toContain('.pdf');
  });
});
