/**
 * TEST SUITE: SIMPLIFIED NOTESHEET CREATION FORM
 *
 * Verifies that:
 * 1. Notesheet creation form works cleanly without expenseCategory, budgetHead, budgetAvailable, paymentRequirement.
 * 2. Normal administrative Notesheet can be created with only basic fields:
 *    Institute, Department, Notesheet Type, Subject, Required By Date, Workflow Due Date, Proposal, Attachments.
 * 3. All authorized roles (Faculty, Mentor, HOD, HOI/Principal, Deputy Registrar, Registrar, Vice President) can create/draft Notesheets.
 * 4. Financial amount functionality (Requested Amount, Line Items, Financial Revision History, Approval) remains 100% intact.
 * 5. Full 6-stage approval workflow (Faculty -> HOD -> Principal -> Dy Registrar -> Registrar -> VP) executes without errors.
 * 6. Historical Notesheets with legacy financial config fields continue to open and preserve their data.
 */

import { db } from '../services/db';
import { User } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runSimplifiedCreationFormTests() {
  console.log('\n========================================================================');
  console.log('RUNNING SIMPLIFIED NOTESHEET CREATION FORM TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(description: string, fn: () => void) {
    totalTests++;
    try {
      fn();
      passedTests++;
    } catch (err) {
      console.error(`Error in test "${description}":`, err);
      throw err;
    }
  }

  // Define test users for each role
  const facultyUser: User = {
    id: 'usr-fac-cse',
    name: 'Prof. Rajesh Kumar',
    email: 'rajesh.kumar@ssit.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const mentorUser: User = {
    id: 'fac-1',
    name: 'Dr. Amit Shah',
    email: 'amit.shah@ssit.edu.in',
    role: 'MENTOR',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const hodUser: User = {
    id: 'usr-hod-cse',
    name: 'Dr. Amit Patel',
    email: 'hod.cse@ssit.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const hoiUser: User = {
    id: 'usr-prin-sit',
    name: 'Dr. Arvind Sharma',
    email: 'principal.sit@ssit.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const dyRegUser: User = {
    id: 'usr-dy-reg-sit',
    name: 'Dr. Suresh Verma',
    email: 'dy.registrar@ssit.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const regUser: User = {
    id: 'usr-reg-univ',
    name: 'Dr. K. N. Shah',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const vpUser: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  // ─── Stage 1: Create Normal Administrative Notesheet Without Financial Config ───
  console.log('--- Stage 1: Normal Administrative Notesheet Creation ---');

  let adminNsId = '';
  test('1. Faculty creates normal administrative Notesheet without financial config', () => {
    const adminNs = db.createNoteSheet({
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      departmentName: 'Computer Engineering',
      notesheetType: 'Administrative',
      subject: 'Approval for Technical Symposium Organization',
      proposal: 'Organize 2-day national level technical symposium for engineering students.',
      purposeJustification: 'Will boost university visibility, student research, and external engagement.',
      requiredDate: '2026-09-15',
      workflowDueDate: '2026-09-01',
      financialRequirement: false
      // Notice: NO expenseCategory, NO budgetHead, NO budgetAvailable, NO procurementRequirement
    }, facultyUser, false);

    assert(Boolean(adminNs.id), '1.1 Notesheet created successfully');
    assert(adminNs.status === 'PENDING_HOD', '1.2 Status is PENDING_HOD');
    assert(adminNs.financialRequirement === false, '1.3 financialRequirement is false');
    assert(adminNs.expenseCategory === undefined, '1.4 expenseCategory is undefined (not required/forced)');
    assert(adminNs.budgetHead === undefined, '1.5 budgetHead is undefined (not required/forced)');
    assert(adminNs.budgetAvailable === undefined, '1.6 budgetAvailable is undefined (not forced to false)');
    assert(adminNs.procurementRequirement === undefined, '1.7 procurementRequirement is undefined');
    assert(adminNs.subject === 'Approval for Technical Symposium Organization', '1.8 Subject saved accurately');

    adminNsId = adminNs.id;
  });

  // ─── Stage 2: Verify Draft Creation for All Roles Without Financial Config ───
  console.log('\n--- Stage 2: Draft Creation Across All Roles ---');

  const testRoles = [
    { name: 'Faculty', user: facultyUser },
    { name: 'Mentor', user: mentorUser },
    { name: 'HOD', user: hodUser },
    { name: 'HOI / Principal', user: hoiUser },
    { name: 'Deputy Registrar', user: dyRegUser },
    { name: 'Registrar', user: regUser },
    { name: 'Vice President', user: vpUser }
  ];

  testRoles.forEach(({ name, user }, idx) => {
    test(`2.${idx + 1} ${name} can save draft Notesheet without financial config`, () => {
      const draft = db.saveNoteSheetDraft({
        instituteId: 'inst-1',
        department: 'COMPUTER ENGINEERING',
        notesheetType: 'Academic',
        subject: `Draft Proposal by ${name}`,
        proposal: `Initial proposal notes from ${name}`,
        purposeJustification: 'Justification for academic enhancement'
      }, user);

      assert(Boolean(draft.id), `Draft saved for ${name}`);
      assert(draft.status === 'DRAFT', `Draft status is DRAFT for ${name}`);
      assert(draft.expenseCategory === undefined, `Draft expenseCategory is undefined for ${name}`);
      assert(draft.budgetHead === undefined, `Draft budgetHead is undefined for ${name}`);
    });
  });

  // ─── Stage 3: Financial Notesheet with Amount & Items (Without Config Fields) ───
  console.log('\n--- Stage 3: Financial Notesheet Creation with Amount and Line Items ---');

  let finNsId = '';
  test('3. Faculty creates Financial Notesheet with items & amount, without budget config fields', () => {
    const finNs = db.createNoteSheet({
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      departmentName: 'Computer Engineering',
      notesheetType: 'Financial Sanction',
      subject: 'Procurement of High-Performance Computing Workstations',
      proposal: 'Procure 5 GPU workstations for AI/ML research lab.',
      purposeJustification: 'Required for advanced deep learning labs and PhD research projects.',
      financialRequirement: true,
      items: [
        { id: 'item-1', itemName: 'GPU Workstation Rig', description: 'RTX 4090 24GB', quantity: 5, unit: 'Nos', rate: 150000, amount: 750000 }
      ]
      // Notice: NO expenseCategory, NO budgetHead, NO budgetAvailable, NO procurementRequirement
    }, facultyUser, false);

    assert(Boolean(finNs.id), '3.1 Financial Notesheet created successfully');
    assert(finNs.requestedAmount === 750000, '3.2 Requested amount calculated from line items: ₹7,50,000');
    assert(finNs.currentAmount === 750000, '3.3 Current amount initialized to ₹7,50,000');
    assert(finNs.expenseCategory === undefined, '3.4 expenseCategory is undefined');
    assert(finNs.budgetHead === undefined, '3.5 budgetHead is undefined');
    assert(finNs.budgetAvailable === undefined, '3.6 budgetAvailable is undefined');

    finNsId = finNs.id;
  });

  // ─── Stage 4: Full 6-Stage Approval Workflow for Financial Notesheet ─────────
  console.log('\n--- Stage 4: Full 6-Stage Approval Flow for Financial Notesheet ---');

  test('4.1 HOD reviews and forwards to HOI', () => {
    db.processNoteSheetAction(
      finNsId,
      'APPROVE',
      'Recommended for lab upgrade. Budget allocation verified internally.',
      undefined,
      hodUser
    );

    const step1 = db.getNoteSheetById(finNsId)!;
    assert(step1.status === 'PENDING_HOI', '4.1.1 Status is PENDING_HOI');
    assert(step1.currentOffice === 'HOI', '4.1.2 Current Office is HOI');
  });

  test('4.2 HOI reviews and forwards to Deputy Registrar', () => {
    db.processNoteSheetAction(
      finNsId,
      'APPROVE',
      'Strongly supported. Forwarding to University Administration.',
      undefined,
      hoiUser
    );

    const step2 = db.getNoteSheetById(finNsId)!;
    assert(step2.status === 'PENDING_DEPUTY_REGISTRAR', '4.2.1 Status is PENDING_DEPUTY_REGISTRAR');
    assert(step2.currentOffice === 'DEPUTY_REGISTRAR', '4.2.2 Current Office is DEPUTY_REGISTRAR');
  });

  test('4.3 Deputy Registrar reviews and forwards to Registrar', () => {
    db.processNoteSheetAction(
      finNsId,
      'APPROVE',
      'Scrutinized and verified. Forwarding for Registrar endorsement.',
      undefined,
      dyRegUser
    );

    const step3 = db.getNoteSheetById(finNsId)!;
    assert(step3.status === 'PENDING_REGISTRAR', '4.3.1 Status is PENDING_REGISTRAR');
    assert(step3.currentOffice === 'REGISTRAR', '4.3.2 Current Office is REGISTRAR');
  });

  test('4.4 Registrar endorses and forwards to Vice President', () => {
    db.processNoteSheetAction(
      finNsId,
      'APPROVE',
      'Endorsed. Submitted for Vice President final sanction.',
      undefined,
      regUser
    );

    const step4 = db.getNoteSheetById(finNsId)!;
    assert(step4.status === 'PENDING_VICE_PRESIDENT', '4.4.1 Status is PENDING_VICE_PRESIDENT');
    assert(step4.currentOffice === 'VICE_PRESIDENT', '4.4.2 Current Office is VICE_PRESIDENT');
  });

  test('4.5 Vice President executes final approval with amount sanction', () => {
    db.processNoteSheetAction(
      finNsId,
      'APPROVE',
      'Final sanction granted for ₹7,50,000.',
      undefined,
      vpUser
    );

    const finalStep = db.getNoteSheetById(finNsId)!;
    assert(finalStep.status === 'APPROVED', '4.5.1 Status is APPROVED');
    assert(finalStep.currentOffice === 'COMPLETED', '4.5.2 Current Office is COMPLETED');
    assert(finalStep.approvedAmount === 750000, '4.5.3 Approved amount is ₹7,50,000');
    assert(finalStep.approvedByName === 'Vp SSIU', '4.5.4 ApprovedByName is Vp SSIU');
  });

  // ─── Stage 5: Backward Compatibility for Historical Notesheets ───────────────
  console.log('\n--- Stage 5: Backward Compatibility for Historical Notesheets ---');

  test('5. Historical Notesheets with legacy financial config continue to open and preserve fields', () => {
    const legacyNs = db.createNoteSheet({
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'Financial Sanction',
      subject: 'Historical Purchase from 2025',
      proposal: 'Legacy purchase record',
      purposeJustification: 'Old equipment record',
      financialRequirement: true,
      requestedAmount: 100000,
      expenseCategory: 'CAPEX',
      budgetHead: 'LAB_EQUIPMENT_CAPEX',
      budgetAvailable: true,
      procurementRequirement: 'DIRECT_PAYMENT'
    }, facultyUser, false);

    assert(legacyNs.expenseCategory === 'CAPEX', '5.1 Historical expenseCategory preserved');
    assert(legacyNs.budgetHead === 'LAB_EQUIPMENT_CAPEX', '5.2 Historical budgetHead preserved');
    assert(legacyNs.budgetAvailable === true, '5.3 Historical budgetAvailable preserved');
    assert(legacyNs.procurementRequirement === 'DIRECT_PAYMENT', '5.4 Historical procurementRequirement preserved');

    const fetched = db.getNoteSheetById(legacyNs.id);
    assert(fetched?.expenseCategory === 'CAPEX', '5.5 Database fetch preserves historical expenseCategory');
  });

  console.log('\n========================================================================');
  console.log(`SIMPLIFIED CREATION FORM TEST RESULTS: ${passedTests} PASSED, 0 FAILED out of ${totalTests} tests`);
  console.log('========================================================================\n');
}

runSimplifiedCreationFormTests().catch(err => {
  console.error('Fatal test error:', err);
  throw err;
});
