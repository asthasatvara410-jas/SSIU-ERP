declare const process: any;

import { db } from '../services/db';
import { User, NoteSheet } from '../types';

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

export async function runNotesheetVisibilityAndAccessTests(): Promise<void> {
  console.log('\n========================================================================');
  console.log('TEST SUITE: GLOBAL NOTESHEET VISIBILITY + ACTION-BASED ACCESS FIX');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  // Test Actors
  const facultyA: User = {
    id: 'usr-fac-cse-a',
    name: 'Prof. Faculty A',
    email: 'fac.a@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const facultyB: User = {
    id: 'usr-fac-cse-b',
    name: 'Prof. Faculty B',
    email: 'fac.b@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const facultyMech: User = {
    id: 'usr-fac-mech-c',
    name: 'Prof. Faculty Mech',
    email: 'fac.mech@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-2',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodCse: User = {
    id: 'usr-hod-cse',
    name: 'Dr. CSE HOD',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodMech: User = {
    id: 'usr-hod-mech',
    name: 'Dr. Mech HOD',
    email: 'hod.mech@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-2',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hoiSit: User = {
    id: 'usr-hoi-sit',
    name: 'Dr. SIT Principal',
    email: 'hoi.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const dyRegSit: User = {
    id: 'usr-dyreg-sit',
    name: 'Dr. SIT Deputy Registrar',
    email: 'dyreg.sit@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hoiPharmacy: User = {
    id: 'usr-hoi-pharmacy',
    name: 'Dr. Pharmacy Principal',
    email: 'hoi.pharmacy@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-2',
    departmentId: 'dept-pharmacy',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const registrar: User = {
    id: 'usr-registrar',
    name: 'Dr. University Registrar',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const financeAdmin: User = {
    id: 'usr-finance',
    name: 'Shri Finance Officer',
    email: 'finance@swarrnim.edu.in',
    role: 'ACCOUNTS_ADMIN',
    instituteId: 'inst-1',
    departmentId: 'ACCOUNTS',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const vp: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    instituteId: 'inst-1',
    departmentId: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // ─── 1. CREATION & ISOLATION (Faculty A creates 2 notesheets) ────────────────
  console.log('--- 1. Creation & Visibility Isolation ---');
  
  db.assignDeputyRegistrarScope({
    userId: dyRegSit.id,
    instituteId: 'inst-1',
    departmentIds: ['dept-1', 'ALL'],
    assignedByUser: registrar
  });

  const ns1 = db.createNoteSheet({
    subject: 'CSE Lab Equipment Purchase',
    proposal: 'Procurement of GPU Workstations for AI Lab',
    purposeJustification: 'Required for advanced AI coursework',
    instituteId: 'inst-1',
    department: 'dept-1',
    departmentId: 'dept-1',
    financialRequirement: true,
    estimatedCost: 150000,
    requestedAmount: 150000
  }, facultyA, false);

  assert(Boolean(ns1 && ns1.id), '1.1 Notesheet NS1 created by Faculty A');

  // Check Authorized Notesheets for Faculty A
  const facA_Notes = db.getAuthorizedNotesheetsForUser(facultyA, 'FACULTY');
  assert(facA_Notes.some(n => n.id === ns1.id), '1.2 Faculty A can see their own Notesheet NS1');

  // Check Faculty B (same department, but not creator or participant)
  const facB_Notes = db.getAuthorizedNotesheetsForUser(facultyB, 'FACULTY');
  assert(!facB_Notes.some(n => n.id === ns1.id), '1.3 Faculty B cannot see Faculty A private Notesheet NS1');

  // Check Faculty Mech (different department)
  const facMech_Notes = db.getAuthorizedNotesheetsForUser(facultyMech, 'FACULTY');
  assert(!facMech_Notes.some(n => n.id === ns1.id), '1.4 Faculty Mech cannot see CSE Notesheet NS1');

  // ─── 2. MY NOTESHEETS COUNT ────────────────────────────────────────────────
  console.log('\n--- 2. My Notesheets Category Filtering ---');
  const facA_MyNotes = db.filterNotesheetsByCategory(facA_Notes, 'MY_NOTESHEETS', facultyA, 'FACULTY');
  assert(facA_MyNotes.some(n => n.id === ns1.id), '2.1 Faculty A has NS1 in My Notesheets');

  const facB_MyNotes = db.filterNotesheetsByCategory(facB_Notes, 'MY_NOTESHEETS', facultyB, 'FACULTY');
  assert(!facB_MyNotes.some(n => n.id === ns1.id), '2.2 Faculty B has 0 in My Notesheets for NS1');

  // ─── 3. PENDING WITH ME & HIERARCHY QUEUE ──────────────────────────────────
  console.log('\n--- 3. Pending With Me Progression Across Hierarchy ---');
  
  // Faculty A should NOT have it in Pending With Me (already submitted)
  const facA_Pending = db.getPendingWithMeNotesheets(facultyA, 'FACULTY');
  assert(!facA_Pending.some(n => n.id === ns1.id), '3.1 Faculty A Pending With Me is 0 for submitted Notesheet');

  // HOD CSE should have it in Pending With Me
  const hodCse_Pending1 = db.getPendingWithMeNotesheets(hodCse, 'HOD');
  assert(hodCse_Pending1.some(n => n.id === ns1.id), '3.2 HOD CSE has NS1 in Pending With Me');

  // HOD Mech should NOT have it in Pending With Me
  const hodMech_Pending1 = db.getPendingWithMeNotesheets(hodMech, 'HOD');
  assert(!hodMech_Pending1.some(n => n.id === ns1.id), '3.3 HOD Mech has 0 for CSE Notesheet');

  // HOI SIT should NOT have it yet (it is at HOD level)
  const hoiSit_Pending1 = db.getPendingWithMeNotesheets(hoiSit, 'PRINCIPAL');
  assert(!hoiSit_Pending1.some(n => n.id === ns1.id), '3.4 HOI SIT does not yet have NS1 in Pending With Me before HOD forwards');

  // ─── 4. HOD APPROVES & FORWARDS TO HOI ─────────────────────────────────────
  console.log('\n--- 4. HOD Intermediate Action & Forward ---');
  db.processNoteSheetAction(ns1.id, 'APPROVE', 'HOD CSE Recommended', undefined, hodCse, 'HOI');

  // HOD CSE Pending With Me should now be 0
  const hodCse_Pending2 = db.getPendingWithMeNotesheets(hodCse, 'HOD');
  assert(!hodCse_Pending2.some(n => n.id === ns1.id), '4.1 HOD CSE Pending With Me is now 0 after forwarding');

  // HOD CSE should now see it in Forwarded
  const hodCse_Authorized = db.getAuthorizedNotesheetsForUser(hodCse, 'HOD');
  const hodCse_Forwarded = db.filterNotesheetsByCategory(hodCse_Authorized, 'FORWARDED', hodCse, 'HOD');
  assert(hodCse_Forwarded.some(n => n.id === ns1.id), '4.2 HOD CSE sees NS1 in Forwarded');

  // HOD Mech should NOT see it in Forwarded
  const hodMech_Authorized = db.getAuthorizedNotesheetsForUser(hodMech, 'HOD');
  const hodMech_Forwarded = db.filterNotesheetsByCategory(hodMech_Authorized, 'FORWARDED', hodMech, 'HOD');
  assert(!hodMech_Forwarded.some(n => n.id === ns1.id), '4.3 HOD Mech does NOT see NS1 in Forwarded');

  // HOI SIT should now have it in Pending With Me
  const hoiSit_Pending2 = db.getPendingWithMeNotesheets(hoiSit, 'PRINCIPAL');
  assert(hoiSit_Pending2.some(n => n.id === ns1.id), '4.4 HOI SIT now has NS1 in Pending With Me');

  // HOI Pharmacy should NOT see it
  const hoiPharm_Authorized = db.getAuthorizedNotesheetsForUser(hoiPharmacy, 'PRINCIPAL');
  assert(!hoiPharm_Authorized.some(n => n.id === ns1.id), '4.5 HOI Pharmacy cannot see SIT Notesheet');

  // ─── 5. HOI APPROVES & FORWARDS TO DEPUTY REGISTRAR ──────────────────────
  console.log('\n--- 5. HOI Intermediate Action & Forward to Deputy Registrar ---');
  db.processNoteSheetAction(ns1.id, 'APPROVE', 'HOI Approved & Forwarded to Deputy Registrar', undefined, hoiSit, 'DEPUTY_REGISTRAR');

  const hoiSit_Pending3 = db.getPendingWithMeNotesheets(hoiSit, 'PRINCIPAL');
  assert(!hoiSit_Pending3.some(n => n.id === ns1.id), '5.1 HOI SIT Pending With Me is now 0 after forwarding');

  const dyReg_Pending1 = db.getPendingWithMeNotesheets(dyRegSit, 'DEPUTY_REGISTRAR');
  assert(dyReg_Pending1.some(n => n.id === ns1.id), '5.2 Deputy Registrar now has NS1 in Pending With Me');

  const reg_PendingBeforeDyReg = db.getPendingWithMeNotesheets(registrar, 'REGISTRAR');
  assert(!reg_PendingBeforeDyReg.some(n => n.id === ns1.id), '5.3 Registrar does NOT have NS1 in Pending With Me while at Deputy Registrar');

  // Deputy Registrar approves and forwards to Registrar
  db.processNoteSheetAction(ns1.id, 'APPROVE', 'Deputy Registrar Verified & Forwarded', undefined, dyRegSit, 'REGISTRAR');

  const dyReg_Pending2 = db.getPendingWithMeNotesheets(dyRegSit, 'DEPUTY_REGISTRAR');
  assert(!dyReg_Pending2.some(n => n.id === ns1.id), '5.4 Deputy Registrar Pending With Me is now 0 after forwarding');

  const reg_Pending1 = db.getPendingWithMeNotesheets(registrar, 'REGISTRAR');
  assert(reg_Pending1.some(n => n.id === ns1.id), '5.5 Registrar now has NS1 in Pending With Me');

  // ─── 6. REGISTRAR FORWARDS TO VP & VP FINAL APPROVAL ─────────────────────
  console.log('\n--- 6. Registrar Forwards & Vice President Final Approval ---');
  db.processNoteSheetAction(ns1.id, 'APPROVE', 'Registrar Endorsed & Forwarded', undefined, registrar);

  const reg_Pending2 = db.getPendingWithMeNotesheets(registrar, 'REGISTRAR');
  assert(!reg_Pending2.some(n => n.id === ns1.id), '6.0 Registrar Pending is 0 after forwarding');

  const vp_Pending = db.getPendingWithMeNotesheets(vp, 'VICE_PRESIDENT');
  assert(vp_Pending.some(n => n.id === ns1.id), '6.1 Vice President now has NS1 in Pending With Me');

  db.processNoteSheetAction(ns1.id, 'APPROVE', 'Vice President Final Sanction Granted', undefined, vp, 'COMPLETED', { approvedAmount: 150000 });

  const finalNs = db.getNoteSheets().find(n => n.id === ns1.id)!;
  assert(finalNs.status === 'APPROVED', '6.2 Final Status is APPROVED');
  assert(finalNs.currentOffice === 'COMPLETED', '6.3 Final currentOffice is COMPLETED');

  // All pending counts must become 0
  assert(!db.getPendingWithMeNotesheets(facultyA, 'FACULTY').some(n => n.id === ns1.id), '6.4 Faculty A Pending is 0');
  assert(!db.getPendingWithMeNotesheets(hodCse, 'HOD').some(n => n.id === ns1.id), '6.5 HOD CSE Pending is 0');
  assert(!db.getPendingWithMeNotesheets(hoiSit, 'PRINCIPAL').some(n => n.id === ns1.id), '6.6 HOI SIT Pending is 0');
  assert(!db.getPendingWithMeNotesheets(dyRegSit, 'DEPUTY_REGISTRAR').some(n => n.id === ns1.id), '6.7 Deputy Registrar Pending is 0');
  assert(!db.getPendingWithMeNotesheets(registrar, 'REGISTRAR').some(n => n.id === ns1.id), '6.8 Registrar Pending is 0');
  assert(!db.getPendingWithMeNotesheets(vp, 'VICE_PRESIDENT').some(n => n.id === ns1.id), '6.9 Vice President Pending is 0');

  // ─── 7. WORKFLOW PARTICIPANTS POST-APPROVAL ACCESS ─────────────────────────
  console.log('\n--- 7. Post-Approval Authorized Access ---');
  assert(db.getAuthorizedNotesheetsForUser(facultyA, 'FACULTY').some(n => n.id === ns1.id), '7.1 Creator Faculty A can view completed Notesheet');
  assert(db.getAuthorizedNotesheetsForUser(hodCse, 'HOD').some(n => n.id === ns1.id), '7.2 Participant HOD CSE can view completed Notesheet');
  assert(db.getAuthorizedNotesheetsForUser(hoiSit, 'PRINCIPAL').some(n => n.id === ns1.id), '7.3 Participant HOI SIT can view completed Notesheet');
  assert(db.getAuthorizedNotesheetsForUser(dyRegSit, 'DEPUTY_REGISTRAR').some(n => n.id === ns1.id), '7.4 Participant Deputy Registrar can view completed Notesheet');
  assert(db.getAuthorizedNotesheetsForUser(registrar, 'REGISTRAR').some(n => n.id === ns1.id), '7.5 Approver Registrar can view completed Notesheet');
  assert(db.getAuthorizedNotesheetsForUser(vp, 'VICE_PRESIDENT').some(n => n.id === ns1.id), '7.6 Approver VP can view completed Notesheet');
  assert(!db.getAuthorizedNotesheetsForUser(facultyB, 'FACULTY').some(n => n.id === ns1.id), '7.7 Unrelated Faculty B CANNOT view completed Notesheet');
  assert(!db.getAuthorizedNotesheetsForUser(hodMech, 'HOD').some(n => n.id === ns1.id), '7.8 Unrelated HOD Mech CANNOT view completed Notesheet');

  // ─── 8. FINANCIAL NOTESHEET SCOPE ──────────────────────────────────────────
  console.log('\n--- 8. Financial Notesheet Scoping ---');
  const fin_Authorized = db.getAuthorizedNotesheetsForUser(financeAdmin, 'ACCOUNTS_ADMIN');
  assert(fin_Authorized.some(n => n.id === ns1.id), '8.1 Finance Admin can see financial Notesheet');

  console.log('\n========================================================================');
  console.log('ALL NOTESHEET VISIBILITY & ACCESS TESTS PASSED SUCCESSFULLY');
  console.log('========================================================================\n');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('notesheetVisibilityAndAccess.test')) {
  runNotesheetVisibilityAndAccessTests().catch(err => {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  });
}
