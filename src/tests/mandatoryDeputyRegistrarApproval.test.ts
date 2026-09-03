import { db } from '../services/db';
import { User } from '../types';

export async function runMandatoryDeputyRegistrarApprovalTests() {
  console.log('========================================================================');
  console.log('RUNNING MANDATORY DEPUTY REGISTRAR APPROVAL WORKFLOW TEST SUITE');
  console.log('========================================================================\n');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      totalPassed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      totalFailed++;
      console.error(`  [FAIL] ${testName}`);
    }
  }

  db.resetToDefaultSeed();

  // ─── Test Actors ─────────────────────────────────────────────────────────────
  const facultyUser: User = {
    id: 'usr-fac-cse-101',
    name: 'Dr. Test Faculty',
    email: 'faculty.cse@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const hodUser: User = {
    id: 'usr-hod-cse-101',
    name: 'Dr. Test HOD',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const hoiUser: User = {
    id: 'usr-hoi-sit-101',
    name: 'Dr. Test HOI',
    email: 'principal.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const dyRegSitUser: User = {
    id: 'usr-dyreg-sit-101',
    name: 'Dr. SIT Deputy Registrar',
    email: 'dyreg.sit@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const dyRegOtherUser: User = {
    id: 'usr-dyreg-other-102',
    name: 'Dr. Other Deputy Registrar',
    email: 'dyreg.other@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-pharmacy',
    departmentId: 'Pharmaceutics',
    status: 'ACTIVE',
    createdAt: ''
  };

  const registrarUser: User = {
    id: 'usr-reg-univ-101',
    name: 'Dr. Sanjay Patel',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    createdAt: ''
  };

  const vicePresidentUser: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    status: 'ACTIVE',
    createdAt: ''
  };

  // Register users in database state
  const users = db.getUsers();
  [facultyUser, hodUser, hoiUser, dyRegSitUser, dyRegOtherUser, registrarUser, vicePresidentUser].forEach(u => {
    if (!users.some(existing => existing.id === u.id)) {
      users.push(u);
    }
  });

  // Assign scope to SIT Deputy Registrar
  db.assignDeputyRegistrarScope({
    userId: dyRegSitUser.id,
    instituteId: 'inst-sit',
    departmentIds: ['dept-cse', 'Computer Engineering', 'ALL'],
    assignedByUser: registrarUser
  });

  // Assign scope to Other Deputy Registrar (Pharmacy only)
  db.assignDeputyRegistrarScope({
    userId: dyRegOtherUser.id,
    instituteId: 'inst-pharmacy',
    departmentIds: ['dept-pharm', 'Pharmaceutics'],
    assignedByUser: registrarUser
  });

  // ─── STEP 1: Faculty creates & submits Notesheet ────────────────────────────
  console.log('\n--- Step 1: Faculty creates & submits Notesheet ---');
  const newNote = db.createNoteSheet({
    subject: 'GPU Server Cluster for AI Research Lab',
    department: 'Computer Engineering',
    instituteId: 'inst-sit',
    category: 'Academic',
    proposal: 'Procurement of GPU compute server with 4x RTX 4090 for department AI/ML coursework and student capstone projects.',
    purposeJustification: 'Critical infrastructure requirement for NAAC Criterion 4 & university research output.',
    financialRequirement: false
  }, facultyUser, false);

  assert(Boolean(newNote && newNote.id), '1.1 Notesheet created successfully');
  assert(newNote.status === 'PENDING_HOD', `1.2 Status is PENDING_HOD (actual: ${newNote.status})`);
  assert(newNote.currentOffice === 'HOD', `1.3 Current office is HOD (actual: ${newNote.currentOffice})`);

  // ─── STEP 2: HOD Endorses & Forwards to HOI ────────────────────────────────
  console.log('\n--- Step 2: HOD Endorses & Forwards to HOI ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Recommended by HOD Computer Engineering.',
    undefined,
    hodUser
  );

  const noteAfterHod = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterHod.status === 'PENDING_HOI', `2.1 Status advanced to PENDING_HOI`);
  assert(noteAfterHod.currentOffice === 'HOI', `2.2 Current office advanced to HOI`);

  // ─── STEP 3: Security Guards & Bypass Prevention ────────────────────────────
  console.log('\n--- Step 3: Security Guards & Bypass Prevention ---');
  
  // Test 3.1: HOI attempting direct forward to Registrar must be BLOCKED
  let directForwardBlocked = false;
  try {
    db.processNoteSheetAction(
      newNote.id,
      'APPROVE',
      'Attempting to bypass Deputy Registrar to Registrar.',
      undefined,
      hoiUser,
      'REGISTRAR'
    );
  } catch (err: any) {
    directForwardBlocked = true;
    assert(err.message.includes('403') || err.message.includes('Deputy Registrar'), `3.1 Backend blocks HOI direct forward to Registrar: "${err.message}"`);
  }
  assert(directForwardBlocked, '3.2 Direct transition HOI -> REGISTRAR rejected with 403 error');

  // ─── STEP 4: HOI Approves & Forwards to Deputy Registrar ───────────────────
  console.log('\n--- Step 4: HOI Approves & Forwards to Deputy Registrar ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Strongly endorsed by HOI. Forwarding to Deputy Registrar for statutory review.',
    undefined,
    hoiUser
  );

  const noteAfterHoi = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterHoi.status === 'PENDING_DEPUTY_REGISTRAR', `4.1 Status is PENDING_DEPUTY_REGISTRAR`);
  assert(noteAfterHoi.currentOffice === 'DEPUTY_REGISTRAR', `4.2 Current office is DEPUTY_REGISTRAR`);

  // Verify Queues and Scope
  const sitDyRegPending = db.getPendingWithMeNotesheets(dyRegSitUser, 'DEPUTY_REGISTRAR');
  assert(sitDyRegPending.some(n => n.id === newNote.id), '4.3 Authorized SIT Deputy Registrar has Notesheet in Pending With Me');

  const otherDyRegPending = db.getPendingWithMeNotesheets(dyRegOtherUser, 'DEPUTY_REGISTRAR');
  assert(!otherDyRegPending.some(n => n.id === newNote.id), '4.4 Out-of-scope Pharmacy Deputy Registrar does NOT have Notesheet in Pending With Me');

  const regPendingDuringDyReg = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
  assert(!regPendingDuringDyReg.some(n => n.id === newNote.id), '4.5 Registrar Pending With Me is 0 while pending Deputy Registrar');

  // Verify Notification isolation
  const dyRegNotifs = db.getNotifications(dyRegSitUser, 'DEPUTY_REGISTRAR').filter(n => n.referenceId === newNote.noteSheetNumber);
  assert(dyRegNotifs.length > 0, '4.6 SIT Deputy Registrar received Pending Approval notification');

  const regNotifsStep4 = db.getNotifications(registrarUser, 'REGISTRAR').filter(n => n.referenceId === newNote.noteSheetNumber);
  assert(regNotifsStep4.length === 0, '4.7 Registrar received NO notification while at Deputy Registrar stage');

  // Test 4.8: Registrar attempting to approve when office is DEPUTY_REGISTRAR must be BLOCKED
  let regApprovalBlocked = false;
  try {
    db.processNoteSheetAction(
      newNote.id,
      'APPROVE',
      'Registrar attempting premature approval.',
      undefined,
      registrarUser
    );
  } catch (err: any) {
    regApprovalBlocked = true;
    assert(err.message.includes('403') || err.message.includes('Deputy Registrar'), `4.8 Registrar blocked from approving at Deputy Registrar stage: "${err.message}"`);
  }
  assert(regApprovalBlocked, '4.9 Premature Registrar approval blocked');

  // ─── STEP 5: Deputy Registrar Approves & Forwards to Registrar ─────────────
  console.log('\n--- Step 5: Deputy Registrar Approves & Forwards to Registrar ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Verified compliance with academic guidelines and budget norms. Forwarded to Registrar.',
    undefined,
    dyRegSitUser
  );

  const noteAfterDyReg = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterDyReg.status === 'PENDING_REGISTRAR', `5.1 Status advanced to PENDING_REGISTRAR (actual: ${noteAfterDyReg.status})`);
  assert(noteAfterDyReg.currentOffice === 'REGISTRAR', `5.2 Current office advanced to REGISTRAR (actual: ${noteAfterDyReg.currentOffice})`);

  // Verify Queue Transition
  const sitDyRegPendingAfter = db.getPendingWithMeNotesheets(dyRegSitUser, 'DEPUTY_REGISTRAR');
  assert(!sitDyRegPendingAfter.some(n => n.id === newNote.id), '5.3 Deputy Registrar pending count decremented to 0');

  const regPendingAfter = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
  assert(regPendingAfter.some(n => n.id === newNote.id), '5.4 Registrar pending count incremented to 1');

  // Verify Registrar Notification
  const regNotifsStep5 = db.getNotifications(registrarUser, 'REGISTRAR').filter(n => n.referenceId === newNote.noteSheetNumber);
  assert(regNotifsStep5.length > 0, '5.5 Registrar received notification after Deputy Registrar forwarded');
  if (regNotifsStep5.length > 0) {
    assert(regNotifsStep5[0].message.includes('forwarded by the Deputy Registrar'), `5.6 Notification message states: "${regNotifsStep5[0].message}"`);
  }

  // ─── STEP 6: Registrar Endorsement to Vice President ──────────────────────
  console.log('\n--- Step 6: Registrar Endorses & Forwards to Vice President ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Registrar Endorsement granted. Submitted for Vice President final sanction.',
    undefined,
    registrarUser
  );

  const noteAfterReg = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterReg.status === 'PENDING_VICE_PRESIDENT', '6.1 Status advanced to PENDING_VICE_PRESIDENT');
  assert(noteAfterReg.currentOffice === 'VICE_PRESIDENT', '6.2 Current office advanced to VICE_PRESIDENT');
  assert(noteAfterReg.currentAssigneeRole === 'VICE_PRESIDENT', '6.3 Current Assignee Role is VICE_PRESIDENT');

  // ─── STEP 7: Vice President Final Sanction ────────────────────────────────
  console.log('\n--- Step 7: Vice President Final Sanction ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Final Sanction & Approval granted by Vice President.',
    undefined,
    vicePresidentUser
  );

  const finalNote = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(finalNote.status === 'APPROVED', '7.1 Status is APPROVED');
  assert(finalNote.decision === 'APPROVED', '7.2 Decision is APPROVED');
  assert(finalNote.currentOffice === 'COMPLETED', '7.3 Current office is COMPLETED');
  assert(Boolean(finalNote.finalApprovalId), `7.4 Digital Approval ID generated: ${finalNote.finalApprovalId}`);

  // ─── STEP 8: Full Audit Trail & Designation History Verification ──────────
  console.log('\n--- Step 8: Full Sequential Movements Audit Trail ---');
  assert(finalNote.movements.length >= 6, `8.1 Complete movement audit trail recorded (${finalNote.movements.length} steps)`);

  const dyRegMovement = finalNote.movements.find(m => m.fromUserRole === 'DEPUTY_REGISTRAR' || m.designation === 'Deputy Registrar');
  assert(Boolean(dyRegMovement), '8.2 Deputy Registrar step present in official movement log');
  if (dyRegMovement) {
    assert(dyRegMovement.action === 'FORWARD', '8.3 Deputy Registrar action recorded as FORWARD');
    assert(dyRegMovement.designation === 'Deputy Registrar', `8.4 Designation correctly logged as "Deputy Registrar" (actual: ${dyRegMovement.designation})`);
    assert(Boolean(dyRegMovement.approvalId), `8.5 Intermediate digital approval ID generated for Deputy Registrar: ${dyRegMovement.approvalId}`);
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`MANDATORY DEPUTY REGISTRAR APPROVAL TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalTests} tests`);
  console.log('========================================================================\n');

  const proc = (globalThis as any).process;
  if (totalFailed > 0 && proc && proc.exit) {
    proc.exit(1);
  }
}

const proc = (globalThis as any).process;
if (typeof window === 'undefined' && proc) {
  runMandatoryDeputyRegistrarApprovalTests().catch(err => {
    console.error('Fatal test execution error:', err);
    if (proc && proc.exit) proc.exit(1);
  });
}
