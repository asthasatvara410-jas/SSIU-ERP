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

export async function runNotesheetWorkflowLifecycleTests(): Promise<void> {
  console.log('\n========================================================================');
  console.log('TEST SUITE: NOTESHEET MULTI-STAGE APPROVE & FORWARD WORKFLOW LIFECYCLE');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  const facultyUser: User = {
    id: 'usr-fac-cse-101',
    name: 'Prof. Ananya Sharma',
    email: 'ananya.sharma@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const hodUser: User = {
    id: 'usr-hod-cse-101',
    name: 'Dr. Rajesh Patel',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'Computer Engineering',
    status: 'ACTIVE',
    createdAt: ''
  };

  const hoiUser: User = {
    id: 'usr-hoi-sit-101',
    name: 'Dr. D. M. Patel',
    email: 'principal.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    status: 'ACTIVE',
    createdAt: ''
  };

  const dyRegUser: User = {
    id: 'usr-dyreg-sit-101',
    name: 'Dr. Deputy Registrar',
    email: 'dyregistrar@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-sit',
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

  const vpUser: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    status: 'ACTIVE',
    createdAt: ''
  };

  // Register users in state
  db.updateState(state => {
    state.users = [facultyUser, hodUser, hoiUser, dyRegUser, registrarUser, vpUser];
  }, 'Register test users');

  // Seed scope for dyRegUser
  db.assignDeputyRegistrarScope({
    userId: dyRegUser.id,
    instituteId: 'inst-sit',
    departmentIds: ['dept-cse', 'Computer Engineering', 'ALL'],
    assignedByUser: registrarUser
  });

  // ─── STEP 1: FACULTY CREATES & SUBMITS NOTESHEET ───────────────────────────
  console.log('\n--- Step 1: Faculty creates & submits Notesheet ---');
  const newNote = db.createNoteSheet({
    subject: 'AI & Robotics Lab Modernization Proposal',
    department: 'Computer Engineering',
    category: 'Academic',
    proposal: 'Procurement of advanced GPU workstations for deep learning coursework.',
    purposeJustification: 'Mandatory for upcoming semester curriculum and research projects.',
    financialRequirement: false
  }, facultyUser, false);

  assert(Boolean(newNote && newNote.id), '1.1 Notesheet created with unique ID');
  assert(newNote.status === 'PENDING_HOD', `1.2 Initial status is PENDING_HOD (actual: ${newNote.status})`);
  assert(newNote.currentOffice === 'HOD', `1.3 Current office is HOD (actual: ${newNote.currentOffice})`);

  // ─── STEP 2: HOD RECEIVES & ENDORSES (APPROVES & FORWARDS) ────────────────
  console.log('\n--- Step 2: HOD Pending With Me & Intermediate Endorsement ---');
  const hodPendingBefore = db.getPendingWithMeNotesheets(hodUser, 'HOD');
  assert(hodPendingBefore.some(n => n.id === newNote.id), '2.1 HOD sees newly submitted Notesheet in Pending With Me');

  // HOD executes APPROVE action
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Recommended and approved at Department level. Forwarding to Principal Office.',
    undefined,
    hodUser
  );

  const noteAfterHod = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterHod.status !== 'APPROVED', `2.2 CRITICAL: Notesheet is NOT marked APPROVED at intermediate HOD stage (status: ${noteAfterHod.status})`);
  assert(noteAfterHod.status === 'PENDING_HOI', `2.3 Notesheet advanced to PENDING_HOI (actual: ${noteAfterHod.status})`);
  assert(noteAfterHod.currentOffice === 'HOI', `2.4 Current office advanced to HOI (actual: ${noteAfterHod.currentOffice})`);

  const hodPendingAfter = db.getPendingWithMeNotesheets(hodUser, 'HOD');
  assert(!hodPendingAfter.some(n => n.id === newNote.id), '2.5 HOD no longer has Notesheet in Pending With Me');

  // ─── STEP 3: HOI (PRINCIPAL) RECEIVES & ENDORSES (APPROVES & FORWARDS) ────
  console.log('\n--- Step 3: HOI (Principal) Pending With Me & Intermediate Endorsement ---');
  const hoiPendingBefore = db.getPendingWithMeNotesheets(hoiUser, 'PRINCIPAL');
  assert(hoiPendingBefore.some(n => n.id === newNote.id), '3.1 HOI (Principal) sees forwarded Notesheet in Pending With Me');

  // HOI executes APPROVE action -> Advances to DEPUTY_REGISTRAR (Mandatory)
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Strongly endorsed for university sanction. Forwarding to Deputy Registrar Office.',
    undefined,
    hoiUser
  );

  const noteAfterHoi = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterHoi.status !== 'APPROVED', `3.2 CRITICAL: Notesheet is NOT marked APPROVED at intermediate HOI stage (status: ${noteAfterHoi.status})`);
  assert(noteAfterHoi.status === 'PENDING_DEPUTY_REGISTRAR', `3.3 Notesheet advanced to PENDING_DEPUTY_REGISTRAR (actual: ${noteAfterHoi.status})`);
  assert(noteAfterHoi.currentOffice === 'DEPUTY_REGISTRAR', `3.4 Current office advanced to DEPUTY_REGISTRAR (actual: ${noteAfterHoi.currentOffice})`);

  const hoiPendingAfter = db.getPendingWithMeNotesheets(hoiUser, 'PRINCIPAL');
  assert(!hoiPendingAfter.some(n => n.id === newNote.id), '3.5 HOI no longer has Notesheet in Pending With Me');

  const regPendingDuringDyReg = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
  assert(!regPendingDuringDyReg.some(n => n.id === newNote.id), '3.6 Registrar does NOT see Notesheet while pending with Deputy Registrar');

  // ─── STEP 4: DEPUTY REGISTRAR REVIEWS & FORWARDS TO REGISTRAR ─────────────
  console.log('\n--- Step 4: Deputy Registrar Pending With Me & Intermediate Endorsement ---');
  const dyRegPendingBefore = db.getPendingWithMeNotesheets(dyRegUser, 'DEPUTY_REGISTRAR');
  assert(dyRegPendingBefore.some(n => n.id === newNote.id), '4.1 Deputy Registrar sees Notesheet in Pending With Me');

  // Deputy Registrar executes APPROVE action
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Verified compliance and administrative requirements. Recommended to Registrar.',
    undefined,
    dyRegUser
  );

  const noteAfterDyReg = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterDyReg.status !== 'APPROVED', `4.2 Notesheet is NOT marked APPROVED at intermediate Deputy Registrar stage`);
  assert(noteAfterDyReg.status === 'PENDING_REGISTRAR', `4.3 Notesheet advanced to PENDING_REGISTRAR (actual: ${noteAfterDyReg.status})`);
  assert(noteAfterDyReg.currentOffice === 'REGISTRAR', `4.4 Current office advanced to REGISTRAR (actual: ${noteAfterDyReg.currentOffice})`);

  const dyRegPendingAfter = db.getPendingWithMeNotesheets(dyRegUser, 'DEPUTY_REGISTRAR');
  assert(!dyRegPendingAfter.some(n => n.id === newNote.id), '4.5 Deputy Registrar pending count cleared');

  // ─── STEP 5: REGISTRAR REVIEWS & FORWARDS TO VICE PRESIDENT ─────────────
  console.log('\n--- Step 5: Registrar Pending With Me & Forward to Vice President ---');
  const regPendingBefore = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
  assert(regPendingBefore.some(n => n.id === newNote.id), '5.1 Registrar sees Notesheet in Pending With Me');

  // Registrar executes APPROVE action (forward to VP)
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Registrar Endorsement granted. Submitted for Vice President final sanction.',
    undefined,
    registrarUser
  );

  const noteAfterReg = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteAfterReg.status === 'PENDING_VICE_PRESIDENT', `5.2 Notesheet advanced to PENDING_VICE_PRESIDENT (actual: ${noteAfterReg.status})`);
  assert(noteAfterReg.currentOffice === 'VICE_PRESIDENT', `5.3 Notesheet currentOffice advanced to VICE_PRESIDENT`);

  const regPendingAfter = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
  assert(!regPendingAfter.some(n => n.id === newNote.id), '5.4 Notesheet cleared from Registrar Pending With Me queue');

  // ─── STEP 6: VICE PRESIDENT (FINAL AUTHORITY) REVIEWS & FINAL APPROVES ────
  console.log('\n--- Step 6: Vice President Pending With Me & Final Sanction ---');
  const vpPendingBefore = db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT');
  assert(vpPendingBefore.some(n => n.id === newNote.id), '6.1 Vice President sees Notesheet in Pending With Me');

  // Vice President executes APPROVE action (Terminal Stage)
  db.processNoteSheetAction(
    newNote.id,
    'APPROVE',
    'Final sanction and approval accorded by Vice President.',
    undefined,
    vpUser
  );

  const noteFinal = db.getNoteSheets().find(n => n.id === newNote.id)!;
  assert(noteFinal.status === 'APPROVED', `6.2 Notesheet is marked APPROVED upon completion by final authority (actual: ${noteFinal.status})`);
  assert(noteFinal.decision === 'APPROVED', `6.3 Notesheet decision is APPROVED`);
  assert(noteFinal.currentOffice === 'COMPLETED', `6.4 Notesheet currentOffice is COMPLETED`);
  assert(noteFinal.approvedByName === vpUser.name, `6.5 ApprovedByName set to ${vpUser.name}`);

  const vpPendingAfter = db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT');
  assert(!vpPendingAfter.some(n => n.id === newNote.id), '6.6 Completed Notesheet cleared from Vice President Pending With Me queue');

  // ─── STEP 7: VERIFY AUDIT MOVEMENT TRAIL ──────────────────────────────────
  console.log('\n--- Step 7: Verify Movement History Chain ---');
  assert(noteFinal.movements.length >= 6, `7.1 Complete movement audit trail recorded (${noteFinal.movements.length} steps)`);

  const mvtHod = noteFinal.movements.find(m => m.fromUser.includes('HOD') || m.fromUser.includes('Dr. Rajesh Patel'));
  assert(Boolean(mvtHod && mvtHod.action === 'FORWARD'), '7.2 HOD step recorded as FORWARD in movement history');

  const mvtHoi = noteFinal.movements.find(m => m.fromUser.includes('HOI') || m.fromUser.includes('Dr. D. M. Patel'));
  assert(Boolean(mvtHoi && mvtHoi.action === 'FORWARD'), '7.3 HOI step recorded as FORWARD in movement history');

  const mvtDyReg = noteFinal.movements.find(m => m.fromUserRole === 'DEPUTY_REGISTRAR' || m.fromUser.includes('Deputy Registrar'));
  assert(Boolean(mvtDyReg && mvtDyReg.action === 'FORWARD'), '7.4 Deputy Registrar step recorded as FORWARD in movement history');

  const mvtReg = noteFinal.movements.find(m => m.fromUserRole === 'REGISTRAR' || m.fromUserId === registrarUser.id || (m.fromUser.includes('REGISTRAR') && !m.fromUser.includes('DEPUTY')));
  assert(Boolean(mvtReg && mvtReg.action === 'FORWARD'), '7.5 Registrar step recorded as FORWARD in movement history');

  const mvtVP = noteFinal.movements.find(m => m.fromUserRole === 'VICE_PRESIDENT' || m.fromUserId === vpUser.id || m.fromUser.includes('VICE_PRESIDENT'));
  assert(Boolean(mvtVP && mvtVP.action === 'APPROVE'), '7.6 Vice President step recorded as APPROVE in movement history');

  console.log('========================================================================\n');
}

import { describe, it, expect } from 'vitest';

describe('Notesheet Multi-Stage Approval & Forward Workflow Lifecycle', () => {
  it('executes the full 35-assertion workflow lifecycle cleanly', async () => {
    await runNotesheetWorkflowLifecycleTests();
    expect(totalFailed).toBe(0);
    expect(totalPassed).toBeGreaterThanOrEqual(35);
  });
});
