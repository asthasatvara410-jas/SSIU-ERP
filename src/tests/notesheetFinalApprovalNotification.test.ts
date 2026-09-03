declare const process: any;

import { db } from '../services/db';
import { User, NoteSheet } from '../types';

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    totalFailed++;
  }
}

export async function runNotesheetFinalApprovalNotificationTests(): Promise<void> {
  console.log('\n========================================================================');
  console.log('TEST SUITE: NOTESHEET FINAL APPROVAL ALL-PARTICIPANTS NOTIFICATION & AUDIT');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  const facultyUser: User = {
    id: 'usr-fac-demo-1',
    name: 'Demo Faculty 1',
    email: 'fac1@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const hodUser: User = {
    id: 'usr-hod-demo-1',
    name: 'Demo HOD 1',
    email: 'hod1@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const hoiUser: User = {
    id: 'usr-hoi-demo-1',
    name: 'Demo HOI 1',
    email: 'hoi1@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    status: 'ACTIVE',
    createdAt: ''
  };

  const dyRegUser: User = {
    id: 'usr-dyreg-demo-1',
    name: 'Demo Deputy Registrar 1',
    email: 'dyreg1@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-sit',
    status: 'ACTIVE',
    createdAt: ''
  };

  const registrarUser: User = {
    id: 'usr-reg-demo-1',
    name: 'Demo Registrar 1',
    email: 'reg1@swarrnim.edu.in',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    createdAt: ''
  };

  const vpUser: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    status: 'ACTIVE',
    createdAt: ''
  };

  const unrelatedFaculty: User = {
    id: 'usr-unrelated-fac-99',
    name: 'Unrelated Faculty 99',
    email: 'unrelated@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'Mechanical Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  // Register users in state for resolution
  const users = db.getUsers();
  [facultyUser, hodUser, hoiUser, dyRegUser, registrarUser, vpUser, unrelatedFaculty].forEach(u => {
    if (!users.some(existing => existing.id === u.id)) {
      users.push(u);
    }
  });

  db.assignDeputyRegistrarScope({
    userId: dyRegUser.id,
    instituteId: 'inst-sit',
    departmentIds: ['Computer Engineering', 'ALL'],
    assignedByUser: registrarUser
  });

  // ─── STEP 1: FACULTY SUBMITS NOTESHEET ────────────────────────────────────
  console.log('\n--- Step 1: Faculty creates & submits Notesheet ---');
  const newNote = db.createNoteSheet({
    subject: 'Robotics Workshop Fund Request',
    department: 'Computer Engineering',
    category: 'Academic',
    proposal: 'Proposal for high-performance microcontrollers.',
    purposeJustification: 'Required for robotics competition.',
    financialRequirement: false
  }, facultyUser, false);

  assert(Boolean(newNote && newNote.id), '1.1 Notesheet created');
  assert(newNote.status === 'PENDING_HOD', `1.2 Initial status is PENDING_HOD`);

  // ─── STEP 2: HOD INTERMEDIATE APPROVAL ────────────────────────────────────
  console.log('\n--- Step 2: HOD Intermediate Approve & Forward ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Recommended at Department level.',
    undefined,
    hodUser
  );

  const noteAfterHod = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterHod.status === 'PENDING_HOI', `2.1 Notesheet is PENDING_HOI (not final approved)`);

  const facNotifsStep2 = db.getNotifications(facultyUser, 'FACULTY').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(facNotifsStep2.length === 0, '2.2 Faculty does NOT receive final approval notification on intermediate HOD approval');

  // ─── STEP 3: HOI INTERMEDIATE APPROVAL ────────────────────────────────────
  console.log('\n--- Step 3: HOI Intermediate Approve & Forward ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Recommended at Institute level. Forwarding to Deputy Registrar.',
    undefined,
    hoiUser
  );

  const noteAfterHoi = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterHoi.status === 'PENDING_DEPUTY_REGISTRAR', `3.1 Notesheet is PENDING_DEPUTY_REGISTRAR (not final approved)`);

  const hodNotifsStep3 = db.getNotifications(hodUser, 'HOD').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(hodNotifsStep3.length === 0, '3.2 HOD does NOT receive final approval notification on intermediate HOI approval');

  // ─── STEP 4: DEPUTY REGISTRAR INTERMEDIATE APPROVAL ───────────────────────
  console.log('\n--- Step 4: Deputy Registrar Intermediate Approve & Forward ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Recommended by Deputy Registrar. Forwarding to Registrar.',
    undefined,
    dyRegUser
  );

  const noteAfterDyReg = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterDyReg.status === 'PENDING_REGISTRAR', `4.1 Notesheet is PENDING_REGISTRAR (not final approved)`);

  // ─── STEP 5: REGISTRAR INTERMEDIATE APPROVAL ─────────────────────────────
  console.log('\n--- Step 5: Registrar Endorses & Forwards to Vice President ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Registrar Endorsement granted. Submitted for Vice President final sanction.',
    undefined,
    registrarUser
  );

  const noteAfterReg = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterReg.status === 'PENDING_VICE_PRESIDENT', `5.1 Notesheet is PENDING_VICE_PRESIDENT (not final approved)`);

  // ─── STEP 6: VICE PRESIDENT FINAL APPROVAL ───────────────────────────────
  console.log('\n--- Step 6: Vice President executes FINAL APPROVAL ---');
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Final Sanction & Approval granted by Vice President.',
    undefined,
    vpUser
  );

  const finalNote = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(finalNote.status === 'APPROVED', '6.1 Notesheet status is APPROVED / COMPLETED');
  assert(finalNote.decision === 'APPROVED', '6.2 Notesheet decision is APPROVED');
  assert(finalNote.currentOffice === 'COMPLETED', '6.3 currentOffice is COMPLETED');
  assert(Boolean(finalNote.finalApprovalId), `6.4 Digital Approval ID stored: ${finalNote.finalApprovalId}`);

  // ─── STEP 7: VERIFY NOTIFICATION DELIVERED TO ALL 6 PARTICIPANTS ──────────
  console.log('\n--- Step 7: Verify Notification Delivered to Participants ---');

  const facFinalNotifs = db.getNotifications(facultyUser, 'FACULTY').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(facFinalNotifs.length > 0, '7.1 [Creator] Demo Faculty 1 received Final Approval notification');
  if (facFinalNotifs.length > 0) {
    assert(facFinalNotifs[0].title === 'Notesheet Approved', '7.1b Notification title is "Notesheet Approved"');
    assert(facFinalNotifs[0].message.includes('successfully approved'), '7.1c Notification message contains completion text');
    assert(facFinalNotifs[0].message.includes(newNote.noteSheetNumber), '7.1d Notification message contains Notesheet number');
  }

  const hodFinalNotifs = db.getNotifications(hodUser, 'HOD').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(hodFinalNotifs.length > 0, '7.2 [Participant] Demo HOD 1 received Final Approval notification');

  const hoiFinalNotifs = db.getNotifications(hoiUser, 'PRINCIPAL').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(hoiFinalNotifs.length > 0, '7.3 [Participant] Demo HOI 1 received Final Approval notification');

  const dyRegFinalNotifs = db.getNotifications(dyRegUser, 'DEPUTY_REGISTRAR').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(dyRegFinalNotifs.length > 0, '7.4 [Participant] Demo Deputy Registrar 1 received Final Approval notification');

  const regFinalNotifs = db.getNotifications(registrarUser, 'REGISTRAR').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(regFinalNotifs.length > 0, '7.5 [Participant] Demo Registrar 1 received Final Approval notification');

  const vpFinalNotifs = db.getNotifications(vpUser, 'VICE_PRESIDENT').filter(n => n.referenceId === newNote.noteSheetNumber && n.type === 'APPROVAL_COMPLETED');
  assert(vpFinalNotifs.length > 0, '7.6 [Approver] Demo Vice President 1 received Final Approval notification');

  // ─── STEP 8: VERIFY UNRELATED USERS RECEIVE ZERO NOTIFICATIONS ────────────
  console.log('\n--- Step 8: Verify Unrelated Users Are NOT Spammed ---');
  const unrelatedNotifs = db.getNotifications(unrelatedFaculty, 'FACULTY').filter(n => n.referenceId === newNote.noteSheetNumber);
  assert(unrelatedNotifs.length === 0, '8.1 Unrelated faculty member received 0 notifications');

  // ─── STEP 9: VERIFY PENDING WITH ME CLEARED FOR ALL ───────────────────────
  console.log('\n--- Step 9: Verify Pending With Me Cleared ---');
  assert(db.getPendingWithMeNotesheets(facultyUser, 'FACULTY').filter(n => n.id === newNote.id).length === 0, '9.1 Faculty Pending With Me is 0');
  assert(db.getPendingWithMeNotesheets(hodUser, 'HOD').filter(n => n.id === newNote.id).length === 0, '9.2 HOD Pending With Me is 0');
  assert(db.getPendingWithMeNotesheets(hoiUser, 'PRINCIPAL').filter(n => n.id === newNote.id).length === 0, '9.3 HOI Pending With Me is 0');
  assert(db.getPendingWithMeNotesheets(dyRegUser, 'DEPUTY_REGISTRAR').filter(n => n.id === newNote.id).length === 0, '9.4 Deputy Registrar Pending With Me is 0');
  assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').filter(n => n.id === newNote.id).length === 0, '9.5 Registrar Pending With Me is 0');
  assert(db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT').filter(n => n.id === newNote.id).length === 0, '9.6 Vice President Pending With Me is 0');

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`NOTIFICATION SUITE RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalTests} tests`);
  console.log('========================================================================\n');

  if (totalFailed > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
}

if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runNotesheetFinalApprovalNotificationTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}
