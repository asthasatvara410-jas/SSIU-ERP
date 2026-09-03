declare const process: any;

import { db } from '../services/db';
import { NoteSheet, User } from '../types';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, message?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${message ? ` - ${message}` : ''}`);
    failCount++;
  }
}

export async function runNotesheetFixedHierarchyMultiAmountSuite() {
  console.log('\n========================================================================');
  console.log('TEST SUITE: FIXED 6-STAGE NOTESHEET APPROVAL HIERARCHY MULTI-AMOUNT');
  console.log('Flow: Faculty -> HOD -> Principal -> Dy Reg -> Registrar -> Vice President');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  // Setup Test Hierarchy Users
  const facultyCSE: User = {
    id: 'usr-fac-cse',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const hodCSE: User = {
    id: 'usr-hod-cse',
    name: 'Dr. Amit Patel',
    email: 'amit.patel@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const principalSIT: User = {
    id: 'usr-prin-sit',
    name: 'Dr. Arvind Sharma',
    email: 'principal.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const dyRegistrarSIT: User = {
    id: 'usr-dy-reg-sit',
    name: 'Dr. Suresh Verma',
    email: 'deputyregistrar.sit@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const registrarUser: User = {
    id: 'usr-reg-univ',
    name: 'Dr. K. N. Shah',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const vicePresidentUser: User = {
    id: 'usr-vp-univ',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  db.updateState(state => {
    state.users = [facultyCSE, hodCSE, principalSIT, dyRegistrarSIT, registrarUser, vicePresidentUser];
    state.deputyRegistrarScopes = [
      {
        id: 'drs-sit',
        userId: dyRegistrarSIT.id,
        userName: dyRegistrarSIT.name,
        userEmail: dyRegistrarSIT.email,
        instituteId: 'inst-1',
        instituteName: 'Swarrnim School of Computing & IT',
        departmentIds: ['dept-1'],
        departmentNames: ['Computer Engineering'],
        isUniversalInstituteScope: true,
        assignedByUserId: registrarUser.id,
        assignedBy: registrarUser.name,
        assignedAt: '2026-01-01',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        status: 'ACTIVE'
      }
    ];
    state.noteSheets = [];
    state.notifications = [];
  }, 'Initialize Multi-Amount Test State');

  const testAmounts = [
    { label: 'Test A', amount: 1, desc: 'Nominal Amount (₹1)' },
    { label: 'Test B', amount: 100000, desc: 'Operational Amount (₹1,00,000)' },
    { label: 'Test C', amount: 1000000, desc: 'Capital Expenditure (₹10,00,000)' },
    { label: 'Test D', amount: 10000000, desc: 'Major Strategic Project (₹1,00,00,000)' }
  ];

  for (const testCase of testAmounts) {
    console.log(`\n========================================================================`);
    console.log(`RUNNING ${testCase.label}: Amount = ₹${testCase.amount.toLocaleString('en-IN')} (${testCase.desc})`);
    console.log(`========================================================================`);

    // 1. Faculty Submits Notesheet
    const ns = db.createNoteSheet({
      subject: `${testCase.label} - Procurement & Expansion Proposal`,
      proposal: `Proposal requiring financial budget of ₹${testCase.amount.toLocaleString('en-IN')}`,
      purposeJustification: 'Academic & Institutional enhancement requirements.',
      notesheetType: 'Financial Sanction',
      category: 'INFRASTRUCTURE',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      department: 'Computer Engineering',
      financialRequirement: true,
      budgetRequired: true,
      requestedAmount: testCase.amount,
      estimatedCost: testCase.amount
    }, facultyCSE, false);

    assert(
      JSON.stringify(ns.organogramPath) === JSON.stringify(['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT']),
      `${testCase.label} 1.1 Organogram path strictly contains all 5 approval stages ending at VICE_PRESIDENT`
    );
    assert(ns.status === 'PENDING_HOD', `${testCase.label} 1.2 Status is PENDING_HOD`);
    assert(ns.currentOffice === 'HOD', `${testCase.label} 1.3 Current Office is HOD`);
    assert(ns.currentAssigneeRole === 'HOD', `${testCase.label} 1.4 Current Assignee Role is HOD`);
    assert(ns.currentAssigneeUserId === hodCSE.id, `${testCase.label} 1.5 Current Assignee User ID is HOD`);

    // Verify Pending Queue at HOD Stage
    assert(db.getPendingWithMeNotesheets(hodCSE, 'HOD').length === 1, `${testCase.label} 1.6 HOD has 1 pending Notesheet`);
    assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 0, `${testCase.label} 1.7 Principal has 0 pending`);
    assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 0, `${testCase.label} 1.8 Deputy Registrar has 0 pending`);
    assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, `${testCase.label} 1.9 Registrar has 0 pending`);
    assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, `${testCase.label} 1.10 Vice President has 0 pending`);

    // 2. HOD Approves & Forwards to Principal
    db.processNoteSheetAction(ns.id, 'APPROVE', 'HOD Recommendation granted.', undefined, hodCSE);
    const nsAfterHOD = db.getNoteSheetById(ns.id)!;
    assert(nsAfterHOD.status === 'PENDING_HOI', `${testCase.label} 2.1 Status is PENDING_HOI`);
    assert(nsAfterHOD.currentOffice === 'HOI', `${testCase.label} 2.2 Current Office is HOI`);
    assert(nsAfterHOD.currentAssigneeUserId === principalSIT.id, `${testCase.label} 2.3 Current Assignee is Principal`);
    assert(db.getPendingWithMeNotesheets(hodCSE, 'HOD').length === 0, `${testCase.label} 2.4 HOD pending cleared to 0`);
    assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 1, `${testCase.label} 2.5 Principal pending is 1`);

    // 3. Principal Approves & Forwards to Deputy Registrar
    db.processNoteSheetAction(ns.id, 'APPROVE', 'Principal Concurrence granted.', undefined, principalSIT);
    const nsAfterHOI = db.getNoteSheetById(ns.id)!;
    assert(nsAfterHOI.status === 'PENDING_DEPUTY_REGISTRAR', `${testCase.label} 3.1 Status is PENDING_DEPUTY_REGISTRAR`);
    assert(nsAfterHOI.currentOffice === 'DEPUTY_REGISTRAR', `${testCase.label} 3.2 Current Office is DEPUTY_REGISTRAR`);
    assert(nsAfterHOI.currentAssigneeUserId === dyRegistrarSIT.id, `${testCase.label} 3.3 Current Assignee is Deputy Registrar`);
    assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 0, `${testCase.label} 3.4 Principal pending cleared to 0`);
    assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 1, `${testCase.label} 3.5 Deputy Registrar pending is 1`);

    // 4. Deputy Registrar Approves & Forwards to Registrar
    db.processNoteSheetAction(ns.id, 'APPROVE', 'Statutory scrutiny completed.', undefined, dyRegistrarSIT);
    const nsAfterDyReg = db.getNoteSheetById(ns.id)!;
    assert(nsAfterDyReg.status === 'PENDING_REGISTRAR', `${testCase.label} 4.1 Status is PENDING_REGISTRAR`);
    assert(nsAfterDyReg.currentOffice === 'REGISTRAR', `${testCase.label} 4.2 Current Office is REGISTRAR`);
    assert(nsAfterDyReg.currentAssigneeUserId === registrarUser.id, `${testCase.label} 4.3 Current Assignee is Registrar`);
    assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 0, `${testCase.label} 4.4 Deputy Registrar pending cleared to 0`);
    assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 1, `${testCase.label} 4.5 Registrar pending is 1`);
    assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, `${testCase.label} 4.6 Vice President pending is 0`);

    // 5. Registrar Approves & Forwards to Vice President
    db.processNoteSheetAction(ns.id, 'APPROVE', 'Registrar Endorsement granted. Submitted for Vice President final sanction.', undefined, registrarUser);
    const nsAfterReg = db.getNoteSheetById(ns.id)!;
    assert(nsAfterReg.status === 'PENDING_VICE_PRESIDENT', `${testCase.label} 5.1 Status advanced to PENDING_VICE_PRESIDENT`);
    assert(nsAfterReg.currentOffice === 'VICE_PRESIDENT', `${testCase.label} 5.2 Current Office advanced to VICE_PRESIDENT`);
    assert(nsAfterReg.currentAssigneeRole === 'VICE_PRESIDENT', `${testCase.label} 5.3 Current Assignee Role is VICE_PRESIDENT`);
    assert(nsAfterReg.currentAssigneeUserId === vicePresidentUser.id, `${testCase.label} 5.4 Current Assignee is Vice President`);
    assert(nsAfterReg.currentAssigneeName === vicePresidentUser.name, `${testCase.label} 5.5 Current Assignee Name is Vp SSIU`);
    assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, `${testCase.label} 5.6 Registrar pending cleared to 0`);
    assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 1, `${testCase.label} 5.7 Vice President pending is 1`);

    // 6. Vice President Executes Final Sanction
    db.processNoteSheetAction(
      ns.id,
      'APPROVE',
      `Final Administrative and Financial Sanction accorded for ₹${testCase.amount.toLocaleString('en-IN')}.`,
      undefined,
      vicePresidentUser,
      undefined,
      { approvedAmount: testCase.amount }
    );
    const nsFinal = db.getNoteSheetById(ns.id)!;
    assert(nsFinal.status === 'APPROVED', `${testCase.label} 6.1 Status is APPROVED`);
    assert(nsFinal.decision === 'APPROVED', `${testCase.label} 6.2 Decision is APPROVED`);
    assert(nsFinal.currentOffice === 'COMPLETED', `${testCase.label} 6.3 Current Office is COMPLETED`);
    assert(nsFinal.currentAssigneeUserId === undefined, `${testCase.label} 6.4 Current Assignee is cleared`);
    assert(nsFinal.approvedAmount === testCase.amount, `${testCase.label} 6.5 Approved amount matches ₹${testCase.amount}`);
    assert(nsFinal.approvedByUserId === vicePresidentUser.id, `${testCase.label} 6.6 ApprovedByUserId is Vice President`);
    assert(nsFinal.approvedByName === vicePresidentUser.name, `${testCase.label} 6.7 ApprovedByName is Vp SSIU`);
    assert(Boolean(nsFinal.finalApprovalId && nsFinal.finalApprovalId.startsWith('NS-APR-')), `${testCase.label} 6.8 Digital Final Approval ID generated`);

    // Verify All Pending Queues Cleared
    assert(db.getPendingWithMeNotesheets(facultyCSE, 'FACULTY').length === 0, `${testCase.label} 6.9 Faculty pending is 0`);
    assert(db.getPendingWithMeNotesheets(hodCSE, 'HOD').length === 0, `${testCase.label} 6.10 HOD pending is 0`);
    assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 0, `${testCase.label} 6.11 Principal pending is 0`);
    assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 0, `${testCase.label} 6.12 Deputy Registrar pending is 0`);
    assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, `${testCase.label} 6.13 Registrar pending is 0`);
    assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, `${testCase.label} 6.14 Vice President pending is 0`);

    // Verify 6-Movement Digital Trail
    assert(nsFinal.movements.length === 6, `${testCase.label} 6.15 Exactly 6 movements recorded in complete approval chain`);
    assert(nsFinal.movements[0].action === 'SUBMIT' && nsFinal.movements[0].actorUserId === facultyCSE.id, `${testCase.label} 6.16 Movement 1 is Faculty Submission`);
    assert(nsFinal.movements[1].action === 'FORWARD' && nsFinal.movements[1].actorUserId === hodCSE.id, `${testCase.label} 6.17 Movement 2 is HOD Endorsement`);
    assert(nsFinal.movements[2].action === 'FORWARD' && nsFinal.movements[2].actorUserId === principalSIT.id, `${testCase.label} 6.18 Movement 3 is Principal Endorsement`);
    assert(nsFinal.movements[3].action === 'FORWARD' && nsFinal.movements[3].actorUserId === dyRegistrarSIT.id, `${testCase.label} 6.19 Movement 4 is Deputy Registrar Endorsement`);
    assert(nsFinal.movements[4].action === 'FORWARD' && nsFinal.movements[4].actorUserId === registrarUser.id, `${testCase.label} 6.20 Movement 5 is Registrar Endorsement`);
    assert(nsFinal.movements[5].action === 'APPROVE' && nsFinal.movements[5].actorUserId === vicePresidentUser.id, `${testCase.label} 6.21 Movement 6 is Vice President Final Sanction`);
  }

  // Security Guard Checks
  console.log('\n========================================================================');
  console.log('SECURITY & OUT-OF-ORDER BYPASS PREVENTION CHECKS');
  console.log('========================================================================');

  const securityNs = db.createNoteSheet({
    subject: 'Security Bypass Attempt Notesheet',
    proposal: 'Testing bypass prevention guards.',
    notesheetType: 'Financial Sanction',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    department: 'Computer Engineering',
    financialRequirement: true,
    requestedAmount: 5000000
  }, facultyCSE, false);

  // Deputy Registrar cannot approve while at HOD
  let dyRegBlocked = false;
  try {
    db.processNoteSheetAction(securityNs.id, 'APPROVE', 'Bypass attempt', undefined, dyRegistrarSIT);
  } catch (err: any) {
    dyRegBlocked = true;
  }
  assert(dyRegBlocked, 'Security 1.1 Deputy Registrar blocked from acting while Notesheet is at HOD stage');

  // Registrar cannot approve while at HOD
  let regBlocked = false;
  try {
    db.processNoteSheetAction(securityNs.id, 'APPROVE', 'Bypass attempt', undefined, registrarUser);
  } catch (err: any) {
    regBlocked = true;
  }
  assert(regBlocked, 'Security 1.2 Registrar blocked from acting while Notesheet is at HOD stage');

  // Vice President cannot approve while at HOD
  let vpBlocked = false;
  try {
    db.processNoteSheetAction(securityNs.id, 'APPROVE', 'Bypass attempt', undefined, vicePresidentUser);
  } catch (err: any) {
    vpBlocked = true;
  }
  assert(vpBlocked, 'Security 1.3 Vice President blocked from acting while Notesheet is at HOD stage');

  console.log('\n========================================================================');
  console.log(`MULTI-AMOUNT SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} tests`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    throw new Error(`${failCount} tests failed in Fixed Hierarchy Multi-Amount suite.`);
  }
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('notesheetFixedHierarchyMultiAmount.test.ts')) {
  runNotesheetFixedHierarchyMultiAmountSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
