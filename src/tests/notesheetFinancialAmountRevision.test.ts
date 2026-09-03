/**
 * Comprehensive Test Suite: Financial Amount Revision & Approval History
 * 
 * Tests the complete lifecycle specified by the user:
 * 1. Initial Creation: ₹10,00,000
 * 2. HOD Revision: ₹10,00,000 → ₹9,50,000 (Reason: "Budget optimization")
 * 3. HOI Revision: ₹9,50,000 → ₹9,00,000 (Reason: "Cost optimization")
 * 4. Deputy Registrar Revision: ₹9,00,000 → ₹8,75,000 (Reason: "Final budget review")
 * 5. Registrar Endorsement: ₹8,75,000 → ₹8,75,000 (No change)
 * 6. Vice President Final Approval: Final Approved Amount: ₹8,75,000 (Total Reduction: ₹1,25,000)
 * 7. Validation: Mandatory reason when amount changes, increase test, immutable audit trail.
 */

import { db } from '../services/db';
import { User, NoteSheet } from '../types';

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    totalPassed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    totalFailed++;
    console.error(`  ✗ FAIL: ${testName}`, details ? details : '');
  }
}

export async function runFinancialAmountRevisionTests() {
  console.log('\n========================================================================');
  console.log('STARTING FINANCIAL AMOUNT REVISION & APPROVAL AUDIT TRAIL TEST SUITE');
  console.log('========================================================================\n');

  // Test Actors
  const facultyUser: User = {
    id: 'user-fac-fin-001',
    name: 'Prof. Rajesh Sharma',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'CSE',
    status: 'ACTIVE',
    email: 'rajesh.sharma@swarrnim.edu.in',
    username: 'rajesh.sharma',
    createdAt: new Date().toISOString()
  };

  const hodUser: User = {
    id: 'user-hod-fin-001',
    name: 'Dr. Ramesh Patel',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'CSE',
    status: 'ACTIVE',
    email: 'hod.cse@swarrnim.edu.in',
    username: 'hod.cse',
    createdAt: new Date().toISOString()
  };

  const principalUser: User = {
    id: 'user-pri-fin-001',
    name: 'Dr. Suresh Verma',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    departmentId: 'SIT',
    status: 'ACTIVE',
    email: 'principal.sit@swarrnim.edu.in',
    username: 'principal.sit',
    createdAt: new Date().toISOString()
  };

  const dyRegUser: User = {
    id: 'user-dyreg-fin-001',
    name: 'Dr. Anand Joshi',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'ALL',
    departmentId: 'ADMIN',
    status: 'ACTIVE',
    email: 'dyreg.admin@swarrnim.edu.in',
    username: 'dyreg.admin',
    createdAt: new Date().toISOString()
  };

  const registrarUser: User = {
    id: 'user-reg-fin-001',
    name: 'Dr. Hardik Patel',
    role: 'REGISTRAR',
    instituteId: 'ALL',
    departmentId: 'REGISTRAR',
    status: 'ACTIVE',
    email: 'registrar@swarrnim.edu.in',
    username: 'registrar',
    createdAt: new Date().toISOString()
  };

  const vpUser: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    role: 'VICE_PRESIDENT',
    instituteId: 'ALL',
    departmentId: 'EXECUTIVE',
    status: 'ACTIVE',
    email: 'vp@swarrnim.edu.in',
    username: 'vp',
    createdAt: new Date().toISOString()
  };

  // ─── STEP 1: Faculty creates Notesheet with ₹10,00,000 ─────────────────────
  console.log('\n--- Step 1: Faculty creates ₹10,00,000 Financial Notesheet ---');
  const initialAmount = 1000000;
  const note1 = db.createNoteSheet({
    subject: 'Procurement of High-End AI Research Computing Lab',
    proposal: 'Setting up GPU cluster for deep learning research.',
    purposeJustification: 'Required for NAAC Criterion 3 research infrastructure and AI projects.',
    financialRequirement: true,
    estimatedCost: initialAmount,
    requestedAmount: initialAmount,
    instituteId: 'inst-sit',
    department: 'CSE',
    items: [
      { id: 'it-1', itemName: 'NVIDIA GPU Server Cluster', description: '4x A100 Nodes', quantity: 1, unit: 'Set', rate: initialAmount, amount: initialAmount }
    ]
  }, facultyUser, false);

  assert(Boolean(note1 && note1.id), '1.1 Notesheet created successfully');
  assert(note1.originalRequestedAmount === 1000000, `1.2 originalRequestedAmount permanently initialized to ₹10,00,000 (actual: ${note1.originalRequestedAmount})`);
  assert(note1.currentAmount === 1000000, `1.3 currentAmount initialized to ₹10,00,000 (actual: ${note1.currentAmount})`);
  assert(Array.isArray(note1.financialRevisionHistory) && note1.financialRevisionHistory.length === 0, '1.4 financialRevisionHistory initialized as empty array');
  assert(note1.status === 'PENDING_HOD', '1.5 Stage is PENDING_HOD');

  // ─── STEP 2: Validation - Mandatory Reason on Revision ────────────────────
  console.log('\n--- Step 2: Validation - Revision without Reason must fail ---');
  let reasonErrorCaught = false;
  try {
    db.processNoteSheetAction(
      note1.id,
      'FORWARD',
      '',
      undefined,
      hodUser,
      undefined,
      {
        revisedAmount: 950000,
        revisionReason: '' // Empty reason
      }
    );
  } catch (e: any) {
    reasonErrorCaught = true;
    assert(e.message.includes('Reason / Remarks is mandatory'), `2.1 Caught expected error on empty revision reason: "${e.message}"`);
  }
  assert(reasonErrorCaught, '2.2 Amount revision was rejected without reason');

  // ─── STEP 3: HOD Replaces Amount: ₹10,00,000 → ₹9,50,000 ──────────────────
  console.log('\n--- Step 3: HOD revises amount to ₹9,50,000 (Reason: Budget optimization) ---');
  db.processNoteSheetAction(
    note1.id,
    'FORWARD',
    'Forwarded with budgetary optimizations.',
    undefined,
    hodUser,
    undefined,
    {
      revisedAmount: 950000,
      revisionReason: 'Budget optimization'
    }
  );

  const noteAfterHod = db.getNoteSheetById(note1.id)!;
  assert(noteAfterHod.originalRequestedAmount === 1000000, '3.1 originalRequestedAmount remains strictly ₹10,00,000 (immutable)');
  assert(noteAfterHod.currentAmount === 950000, `3.2 currentAmount updated to ₹9,50,000 (actual: ${noteAfterHod.currentAmount})`);
  assert(noteAfterHod.financialRevisionHistory?.length === 1, '3.3 financialRevisionHistory has exactly 1 entry');
  
  const rev1 = noteAfterHod.financialRevisionHistory![0];
  assert(rev1.previousAmount === 1000000, '3.4 Rev 1 previousAmount is ₹10,00,000');
  assert(rev1.newAmount === 950000, '3.5 Rev 1 newAmount is ₹9,50,000');
  assert(rev1.changeAmount === -50000, `3.6 Rev 1 changeAmount is -₹50,000 (actual: ${rev1.changeAmount})`);
  assert(rev1.changeType === 'DECREASE', '3.7 Rev 1 changeType is DECREASE');
  assert(rev1.reason === 'Budget optimization', `3.8 Rev 1 reason is "${rev1.reason}"`);
  assert(rev1.actorUserId === hodUser.id && rev1.actorRole === 'HOD', '3.9 Rev 1 actor logged as HOD');
  assert(noteAfterHod.status === 'PENDING_HOI', '3.10 Workflow advanced to PENDING_HOI');

  // ─── STEP 4: HOI / Principal Revises Amount: ₹9,50,000 → ₹9,00,000 ─────────
  console.log('\n--- Step 4: HOI revises amount to ₹9,00,000 (Reason: Cost optimization) ---');
  db.processNoteSheetAction(
    note1.id,
    'FORWARD',
    'Approved with cost optimizations per institute budget.',
    undefined,
    principalUser,
    undefined,
    {
      revisedAmount: 900000,
      revisionReason: 'Cost optimization'
    }
  );

  const noteAfterHoi = db.getNoteSheetById(note1.id)!;
  assert(noteAfterHoi.originalRequestedAmount === 1000000, '4.1 originalRequestedAmount is still ₹10,00,000');
  assert(noteAfterHoi.currentAmount === 900000, `4.2 currentAmount updated to ₹9,00,000 (actual: ${noteAfterHoi.currentAmount})`);
  assert(noteAfterHoi.financialRevisionHistory?.length === 2, '4.3 financialRevisionHistory has 2 entries');

  const rev2 = noteAfterHoi.financialRevisionHistory![1];
  assert(rev2.previousAmount === 950000, '4.4 Rev 2 previousAmount is ₹9,50,000');
  assert(rev2.newAmount === 900000, '4.5 Rev 2 newAmount is ₹9,00,000');
  assert(rev2.changeAmount === -50000, '4.6 Rev 2 changeAmount is -₹50,000');
  assert(rev2.changeType === 'DECREASE', '4.7 Rev 2 changeType is DECREASE');
  assert(rev2.reason === 'Cost optimization', '4.8 Rev 2 reason is "Cost optimization"');
  assert(noteAfterHoi.status === 'PENDING_DEPUTY_REGISTRAR', '4.9 Advanced to PENDING_DEPUTY_REGISTRAR');

  // ─── STEP 5: Deputy Registrar Revises Amount: ₹9,00,000 → ₹8,75,000 ───────
  console.log('\n--- Step 5: Deputy Registrar revises amount to ₹8,75,000 (Reason: Final budget review) ---');
  db.processNoteSheetAction(
    note1.id,
    'FORWARD',
    'Scrutinized with final vendor negotiations.',
    undefined,
    dyRegUser,
    undefined,
    {
      revisedAmount: 875000,
      revisionReason: 'Final budget review'
    }
  );

  const noteAfterDyReg = db.getNoteSheetById(note1.id)!;
  assert(noteAfterDyReg.originalRequestedAmount === 1000000, '5.1 originalRequestedAmount remains ₹10,00,000');
  assert(noteAfterDyReg.currentAmount === 875000, `5.2 currentAmount updated to ₹8,75,000 (actual: ${noteAfterDyReg.currentAmount})`);
  assert(noteAfterDyReg.financialRevisionHistory?.length === 3, '5.3 financialRevisionHistory has 3 entries');

  const rev3 = noteAfterDyReg.financialRevisionHistory![2];
  assert(rev3.previousAmount === 900000, '5.4 Rev 3 previousAmount is ₹9,00,000');
  assert(rev3.newAmount === 875000, '5.5 Rev 3 newAmount is ₹8,75,000');
  assert(rev3.changeAmount === -25000, '5.6 Rev 3 changeAmount is -₹25,000');
  assert(rev3.changeType === 'DECREASE', '5.7 Rev 3 changeType is DECREASE');
  assert(rev3.reason === 'Final budget review', '5.8 Rev 3 reason is "Final budget review"');
  assert(noteAfterDyReg.status === 'PENDING_REGISTRAR', '5.9 Advanced to PENDING_REGISTRAR');

  // ─── STEP 6: Registrar Endorsement (No change: ₹8,75,000 → ₹8,75,000) ─────
  console.log('\n--- Step 6: Registrar endorses with no amount change ---');
  db.processNoteSheetAction(
    note1.id,
    'FORWARD',
    'Recommended for sanction to Vice President.',
    undefined,
    registrarUser,
    undefined
  );

  const noteAfterReg = db.getNoteSheetById(note1.id)!;
  assert(noteAfterReg.originalRequestedAmount === 1000000, '6.1 originalRequestedAmount is ₹10,00,000');
  assert(noteAfterReg.currentAmount === 875000, '6.2 currentAmount remains ₹8,75,000');
  assert(noteAfterReg.financialRevisionHistory?.length === 3, '6.3 financialRevisionHistory remains 3 entries (no unnecessary revision record when unchanged)');
  assert(noteAfterReg.status === 'PENDING_VICE_PRESIDENT', '6.4 Advanced to PENDING_VICE_PRESIDENT');

  // ─── STEP 7: Vice President Final Sanction / Approval ─────────────────────
  console.log('\n--- Step 7: Vice President executes final approval ---');
  db.processNoteSheetAction(
    note1.id,
    'APPROVE',
    'Sanctioned and approved at ₹8,75,000.',
    undefined,
    vpUser
  );

  const finalNote = db.getNoteSheetById(note1.id)!;
  assert(finalNote.status === 'APPROVED', '7.1 Status is APPROVED');
  assert(finalNote.decision === 'APPROVED', '7.2 Decision is APPROVED');
  assert(finalNote.originalRequestedAmount === 1000000, `7.3 Final originalRequestedAmount is ₹10,00,000 (actual: ${finalNote.originalRequestedAmount})`);
  assert(finalNote.currentAmount === 875000, `7.4 Final currentAmount is ₹8,75,000 (actual: ${finalNote.currentAmount})`);
  assert(finalNote.finalApprovedAmount === 875000, `7.5 finalApprovedAmount is ₹8,75,000 (actual: ${finalNote.finalApprovedAmount})`);
  assert(finalNote.approvedAmount === 875000, `7.6 approvedAmount is ₹8,75,000 (actual: ${finalNote.approvedAmount})`);
  
  const totalReduction = (finalNote.originalRequestedAmount || 0) - (finalNote.finalApprovedAmount || 0);
  assert(totalReduction === 125000, `7.7 Total Reduction is exactly ₹1,25,000 (actual: ${totalReduction})`);
  assert(finalNote.financialRevisionHistory?.length === 3, '7.8 All 3 intermediate revision records preserved intact');

  // ─── STEP 8: Positive Increase Revision Test ──────────────────────────────
  console.log('\n--- Step 8: Positive Amount Increase Test (₹5,00,000 → ₹6,00,000) ---');
  const note2 = db.createNoteSheet({
    subject: 'National Level Hackathon Event Budget',
    proposal: 'Funding for national hackathon prizes and hosting.',
    purposeJustification: 'Student innovation and institutional branding.',
    financialRequirement: true,
    estimatedCost: 500000,
    requestedAmount: 500000,
    instituteId: 'inst-sit',
    department: 'CSE'
  }, facultyUser, false);

  assert(note2.originalRequestedAmount === 500000, '8.1 Note 2 originalRequestedAmount is ₹5,00,000');

  // HOD increases amount to ₹6,00,000 for additional prize pool
  db.processNoteSheetAction(
    note2.id,
    'FORWARD',
    'Forwarded with additional sponsorship support.',
    undefined,
    hodUser,
    undefined,
    {
      revisedAmount: 600000,
      revisionReason: 'Additional 1st prize category added by jury'
    }
  );

  const note2AfterHod = db.getNoteSheetById(note2.id)!;
  assert(note2AfterHod.originalRequestedAmount === 500000, '8.2 originalRequestedAmount preserved as ₹5,00,000');
  assert(note2AfterHod.currentAmount === 600000, '8.3 currentAmount updated to ₹6,00,000');
  assert(note2AfterHod.financialRevisionHistory?.length === 1, '8.4 Revision record added');
  
  const revInc = note2AfterHod.financialRevisionHistory![0];
  assert(revInc.changeAmount === 100000, `8.5 changeAmount is +₹1,00,000 (actual: ${revInc.changeAmount})`);
  assert(revInc.changeType === 'INCREASE', '8.6 changeType is INCREASE');

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`FINANCIAL AMOUNT REVISION TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalTests} tests`);
  console.log('========================================================================\n');

  const proc = (globalThis as any).process;
  if (totalFailed > 0 && proc && proc.exit) {
    proc.exit(1);
  }
}

const proc = (globalThis as any).process;
if (proc && proc.argv && proc.argv[1] && proc.argv[1].includes('notesheetFinancialAmountRevision.test.ts')) {
  runFinancialAmountRevisionTests();
}
