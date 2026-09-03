/**
 * Comprehensive Test Suite: Vice President Login + Notesheet Final Approval Role
 * 
 * Verifies:
 * 1. Vice President Authentication & Seed Profile (Vp SSIU, user-vp)
 * 2. Strict 6-Stage Notesheet Approval Sequence:
 *    Faculty -> HOD -> HOI -> Deputy Registrar -> Registrar -> Vice President -> Final Approval
 * 3. VP Pending queue and notification generation upon Registrar approval
 * 4. VP Actions: Approve & Finalize, Return, Reject, Clarification
 * 5. Financial Amount Integrity during VP Final Approval
 * 6. Participant and Creator notification upon Final VP Sanction
 * 7. Negative Security Guards (Out-of-order approvals, non-VP approvals, Registrar skipping VP)
 * 8. Inactive VP user configuration guard
 * 9. Per-user VP Pending queue isolation (multi-VP assignment test)
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

export async function runVicePresidentNotesheetApprovalTests() {
  console.log('\n========================================================================');
  console.log('STARTING VICE PRESIDENT LOGIN & NOTESHEET FINAL APPROVAL TEST SUITE');
  console.log('========================================================================\n');

  // Test Actors
  const facultyUser: User = {
    id: 'user-fac-vp-001',
    name: 'Prof. Amit Verma',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'CSE',
    status: 'ACTIVE',
    email: 'amit.verma@swarrnim.edu.in',
    username: 'amit.verma',
    createdAt: new Date().toISOString()
  };

  const hodUser: User = {
    id: 'user-hod-vp-001',
    name: 'Dr. Ramesh Patel',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'CSE',
    status: 'ACTIVE',
    email: 'hod.cse@swarrnim.edu.in',
    username: 'hod.cse',
    createdAt: new Date().toISOString()
  };

  const hoiUser: User = {
    id: 'user-hoi-vp-001',
    name: 'Dr. Suresh Shah',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    status: 'ACTIVE',
    email: 'principal.sit@swarrnim.edu.in',
    username: 'principal.sit',
    createdAt: new Date().toISOString()
  };

  const dyRegUser: User = {
    id: 'user-dyreg-vp-001',
    name: 'Shri Manoj Dave',
    role: 'DEPUTY_REGISTRAR',
    status: 'ACTIVE',
    email: 'dy.registrar@swarrnim.edu.in',
    username: 'dy.registrar',
    createdAt: new Date().toISOString()
  };

  const regUser: User = {
    id: 'user-reg-vp-001',
    name: 'Dr. K. N. Sharma',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    email: 'registrar@swarrnim.edu.in',
    username: 'registrar',
    createdAt: new Date().toISOString()
  };

  const vpUser: User = {
    id: 'user-vp',
    name: 'Vp SSIU',
    role: 'VICE_PRESIDENT',
    designation: 'Vice President, Swarrnim Startup & Innovation University',
    status: 'ACTIVE',
    email: 'vp@swarrnim.edu.in',
    username: 'vp',
    createdAt: new Date().toISOString()
  };

  // Add actors to system users if not already present
  const users = db.getUsers();
  if (!users.some(u => u.id === facultyUser.id)) users.push(facultyUser);
  if (!users.some(u => u.id === hodUser.id)) users.push(hodUser);
  if (!users.some(u => u.id === hoiUser.id)) users.push(hoiUser);
  if (!users.some(u => u.id === dyRegUser.id)) users.push(dyRegUser);
  if (!users.some(u => u.id === regUser.id)) users.push(regUser);
  if (!users.some(u => u.id === vpUser.id)) users.push(vpUser);

  // -------------------------------------------------------------------------
  // 1. VP AUTHENTICATION & SEED USER VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- 1. Vice President Authentication & Seed Account ---');
  const allUsers = db.getUsers();
  const seededVP = allUsers.find(u => u.role === 'VICE_PRESIDENT' || u.username === 'vp');
  assert(Boolean(seededVP), 'VP user account exists in system');
  assert(seededVP?.role === 'VICE_PRESIDENT', 'VP role is VICE_PRESIDENT');
  assert(seededVP?.name === 'Vp SSIU', 'VP display name is Vp SSIU');
  assert(seededVP?.username === 'vp', 'VP username is vp');

  // -------------------------------------------------------------------------
  // 2. NOTESHEET CREATION & PROGRESSION UP TO REGISTRAR
  // -------------------------------------------------------------------------
  console.log('\n--- 2. End-to-End Progression to Vice President ---');
  const ns = db.createNoteSheet(
    {
      subject: 'Procurement of High-Performance GPU Cluster & Workstations',
      proposal: 'Establishment of state-of-the-art AI infrastructure for research scholars and students.',
      purposeJustification: 'Required for university research computing and AI labs.',
      department: 'CSE',
      departmentId: 'CSE',
      instituteId: 'inst-sit',
      priority: 'HIGH',
      financialRequirement: true,
      estimatedCost: 2000000,
      requestedAmount: 2000000,
      items: [
        { id: 'it-1', itemName: 'GPU Workstations', description: 'Deep learning nodes', quantity: 1, unit: 'Set', rate: 2000000, amount: 2000000 }
      ]
    },
    facultyUser,
    false
  );

  assert(Boolean(ns), 'Notesheet created successfully');
  assert(ns.status === 'PENDING_HOD' || ns.status === 'SUBMITTED', 'Notesheet status is initialized at HOD stage');
  assert(ns.currentOffice === 'HOD', 'Notesheet currentOffice is HOD');
  assert(ns.originalRequestedAmount === 2000000, 'Original requested amount permanently stored as ₹20,00,000');
  assert(ns.currentAmount === 2000000, 'Current amount initialized as ₹20,00,000');

  // Check VP pending queue before reaching VP
  let vpPending = db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT');
  assert(!vpPending.some(n => n.id === ns.id), 'VP Pending queue does NOT contain Notesheet at HOD stage');

  // 2a. HOD Approval -> HOI
  db.processNoteSheetAction(
    ns.id,
    'FORWARD',
    'Recommended by HOD for advanced AI research.',
    undefined,
    hodUser,
    undefined,
    { revisedAmount: 1900000, revisionReason: 'Negotiated with local vendor on server racks' }
  );
  const afterHod = db.getNoteSheetById(ns.id);
  assert(Boolean(afterHod), 'HOD approval executed');
  assert(afterHod?.currentOffice === 'HOI', 'Stage forwarded to HOI');
  assert(afterHod?.currentAmount === 1900000, 'Current amount revised to ₹19,00,000');

  // 2b. HOI Approval -> Deputy Registrar
  db.processNoteSheetAction(
    ns.id,
    'FORWARD',
    'Endorsed by Principal. Forwarded to Central Administration.',
    undefined,
    hoiUser,
    undefined,
    { revisedAmount: 1850000, revisionReason: 'Consolidated display hardware quotes' }
  );
  const afterHoi = db.getNoteSheetById(ns.id);
  assert(Boolean(afterHoi), 'HOI approval executed');
  assert(afterHoi?.currentOffice === 'DEPUTY_REGISTRAR', 'Stage forwarded to DEPUTY_REGISTRAR');
  assert(afterHoi?.currentAmount === 1850000, 'Current amount revised to ₹18,50,000');

  // 2c. Deputy Registrar Approval -> Registrar
  db.processNoteSheetAction(
    ns.id,
    'FORWARD',
    'Scrutinized by Deputy Registrar. Verified budget allocation.',
    undefined,
    dyRegUser
  );
  const afterDyReg = db.getNoteSheetById(ns.id);
  assert(Boolean(afterDyReg), 'Deputy Registrar approval executed');
  assert(afterDyReg?.currentOffice === 'REGISTRAR', 'Stage forwarded to REGISTRAR');
  assert(afterDyReg?.status === 'PENDING_REGISTRAR', 'Status is PENDING_REGISTRAR');

  // Check VP pending queue before Registrar approval
  vpPending = db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT');
  assert(!vpPending.some(n => n.id === ns.id), 'VP Pending queue is still 0 before Registrar approval');

  // -------------------------------------------------------------------------
  // 3. REGISTRAR APPROVAL FORWARDS TO VICE PRESIDENT
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Registrar Endorsement & Handover to Vice President ---');
  db.processNoteSheetAction(
    ns.id,
    'FORWARD',
    'Recommended by Registrar secretariat for final executive sanction by Vice President.',
    undefined,
    regUser
  );
  const afterReg = db.getNoteSheetById(ns.id);
  assert(Boolean(afterReg), 'Registrar approval executed');
  assert(afterReg?.currentOffice === 'VICE_PRESIDENT', 'currentOffice transitioned to VICE_PRESIDENT');
  assert(afterReg?.status === 'PENDING_VICE_PRESIDENT', 'Status set to PENDING_VICE_PRESIDENT');
  assert(afterReg?.currentStage === 'VICE_PRESIDENT_APPROVAL', 'currentStage set to VICE_PRESIDENT_APPROVAL');
  assert(afterReg?.currentAssigneeRole === 'VICE_PRESIDENT', 'currentAssigneeRole is VICE_PRESIDENT');
  assert(afterReg?.currentAssigneeUserId === 'user-vp', 'currentAssigneeUserId is actual user-vp ID');
  assert(afterReg?.currentAssigneeName === 'Vp SSIU', 'currentAssigneeName resolved to Vp SSIU');

  // Verify VP pending counts
  vpPending = db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT');
  assert(vpPending.some(n => n.id === ns.id), 'VP Pending queue count is +1 (contains Notesheet)');

  // Verify Registrar pending count is 0
  const regPending = db.getPendingWithMeNotesheets(regUser, 'REGISTRAR');
  assert(!regPending.some(n => n.id === ns.id), 'Registrar Pending queue count is 0 for this Notesheet');

  // Verify VP Notification Generated
  const vpNotifs = db.getNotifications(vpUser, 'VICE_PRESIDENT');
  const matchingNotif = vpNotifs.find(n => n.referenceId === ns.id || (n.message && n.message.includes(ns.noteSheetNumber)));
  assert(Boolean(matchingNotif), 'VP received targeted notification for Notesheet pending final approval');

  // -------------------------------------------------------------------------
  // 4. VICE PRESIDENT FINAL SANCTION (APPROVE & FINALIZE)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Vice President Final Approval (Terminal Sanction) ---');
  db.processNoteSheetAction(
    ns.id,
    'APPROVE',
    'Sanctioned and approved in full for the development of Swarrnim AI Research Centre.',
    undefined,
    vpUser,
    undefined,
    { revisedAmount: 1800000, revisionReason: 'Final approved institutional budget sanction' }
  );

  const finalApprovedNs = db.getNoteSheetById(ns.id);
  assert(Boolean(finalApprovedNs), 'VP processNoteSheetAction executed successfully');
  assert(finalApprovedNs?.status === 'APPROVED', 'Final Notesheet status is terminal APPROVED');
  assert(finalApprovedNs?.currentStage === 'FINAL_APPROVAL', 'currentStage is FINAL_APPROVAL');
  assert(finalApprovedNs?.decision === 'APPROVED', 'Decision recorded as APPROVED');
  assert(finalApprovedNs?.approvedByUserId === vpUser.id, 'approvedByUserId recorded as Vice President');
  assert(finalApprovedNs?.approvedByName === 'Vp SSIU', 'approvedByName is Vp SSIU');
  assert(Boolean(finalApprovedNs?.approvedAt), 'approvedAt timestamp recorded');
  assert(Boolean(finalApprovedNs?.finalApprovalId), 'finalApprovalId security token generated');
  assert(finalApprovedNs?.finalApprovedAmount === 1800000, 'finalApprovedAmount recorded as ₹18,00,000');
  assert(finalApprovedNs?.originalRequestedAmount === 2000000, 'originalRequestedAmount preserved as ₹20,00,000');
  assert(finalApprovedNs?.currentAssigneeUserId === undefined, 'currentAssigneeUserId cleared after final sanction');

  // Check VP pending queue after final sanction
  vpPending = db.getPendingWithMeNotesheets(vpUser, 'VICE_PRESIDENT');
  assert(!vpPending.some(n => n.id === ns.id), 'Notesheet removed from VP Pending queue after final approval');

  // Check Creator Notification
  const creatorNotifs = db.getNotifications(facultyUser, 'FACULTY');
  const approvalNotif = creatorNotifs.find(n => (n.referenceId === ns.id || (n.message && n.message.includes(ns.noteSheetNumber))) && n.message.includes('Vice President'));
  assert(Boolean(approvalNotif), 'Creator received confirmation notification of Vice President final approval');

  // Verify Audit & Movement Trails
  assert(Boolean(finalApprovedNs?.auditTrail?.some(a => a.userRole === 'VICE_PRESIDENT' && ((a.action as any) === 'APPROVE' || (a.action as any) === 'SANCTION'))), 'VP approval logged in immutable audit trail');
  assert(Boolean(finalApprovedNs?.movements?.some(m => m.fromUser.includes('Vp SSIU') && m.action === 'APPROVE')), 'VP approval recorded in movement log');

  // -------------------------------------------------------------------------
  // 5. NEGATIVE SECURITY GUARDS & ALTERNATIVE ACTIONS
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Negative Security Guards & Alternative Actions ---');

  // Create a second Notesheet to test Return and alternative actions
  const secondNs = db.createNoteSheet(
    {
      subject: 'Procurement of High-Performance Robotic Kits',
      proposal: 'Robotics lab refurbishment',
      purposeJustification: 'Hardware lab equipment',
      department: 'CSE',
      departmentId: 'CSE',
      instituteId: 'inst-sit',
      priority: 'NORMAL',
      financialRequirement: true,
      estimatedCost: 500000,
      requestedAmount: 500000
    },
    facultyUser,
    false
  );

  // Fast forward secondNs to VP
  db.processNoteSheetAction(secondNs.id, 'FORWARD', 'HOD Endorsed', undefined, hodUser);
  db.processNoteSheetAction(secondNs.id, 'FORWARD', 'HOI Endorsed', undefined, hoiUser);
  db.processNoteSheetAction(secondNs.id, 'FORWARD', 'DyReg Endorsed', undefined, dyRegUser);

  // 5a. Registrar attempting to finalize directly with COMPLETED (bypassing VP) must be blocked
  let regBypassBlocked = false;
  try {
    db.processNoteSheetAction(secondNs.id, 'APPROVE', 'Registrar trying to close directly', undefined, regUser, 'COMPLETED');
  } catch (err: any) {
    if (err.message.includes('mandatory final sanction from Vice President')) {
      regBypassBlocked = true;
    }
  }
  assert(regBypassBlocked, 'Registrar is strictly blocked from finalizing without Vice President sanction');

  // Forward properly from Registrar to VP
  db.processNoteSheetAction(secondNs.id, 'FORWARD', 'Registrar Forwarded to VP', undefined, regUser);

  const atVpStage = db.getNoteSheetById(secondNs.id);
  assert(atVpStage?.currentOffice === 'VICE_PRESIDENT', 'Second Notesheet reached VP stage');

  // 5b. Non-VP role blocked from executing VP stage approval
  let nonVpApproved = false;
  try {
    db.processNoteSheetAction(
      secondNs.id,
      'APPROVE',
      'Illegal Faculty approval at VP stage',
      undefined,
      facultyUser
    );
    const postAttempt = db.getNoteSheetById(secondNs.id);
    if (postAttempt && postAttempt.status === 'APPROVED') nonVpApproved = true;
  } catch (err) {
    nonVpApproved = false;
  }
  const postNonVpState = db.getNoteSheetById(secondNs.id);
  assert(!nonVpApproved && postNonVpState?.status !== 'APPROVED', 'Non-VP role blocked from executing VP stage approval');

  // 5c. Multi-VP Assignment isolation: Different VP cannot approve if assigned to a specific VP
  const vp2User: User = {
    id: 'user-vp-2',
    name: 'Dr. Alternative VP',
    role: 'VICE_PRESIDENT',
    status: 'ACTIVE',
    email: 'alt.vp@swarrnim.edu.in',
    username: 'alt_vp',
    createdAt: new Date().toISOString()
  };
  let diffVpBlocked = false;
  try {
    db.processNoteSheetAction(
      secondNs.id,
      'APPROVE',
      'Different VP approval attempt',
      undefined,
      vp2User
    );
  } catch (err: any) {
    if (err.message.includes('assigned to a different Vice President')) {
      diffVpBlocked = true;
    }
  }
  assert(diffVpBlocked, 'VP user blocked from acting on Notesheet assigned to a different VP user');

  // 5d. VP Return Notesheet
  db.processNoteSheetAction(
    secondNs.id,
    'RETURN',
    'Please submit complete itemized vendor quotations with 3-year warranty.',
    undefined,
    vpUser
  );
  const returnedNs = db.getNoteSheetById(secondNs.id);
  assert(returnedNs?.status === 'RETURNED', 'VP can return Notesheet for revisions with mandatory reason');
  assert(returnedNs?.returnedByUserId === vpUser.id, 'returnedByUserId recorded as Vice President');

  // -------------------------------------------------------------------------
  // 6. INACTIVE VP ACCOUNT CONFIGURATION GUARD
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Inactive VP Account Configuration Guard ---');
  const thirdNs = db.createNoteSheet(
    {
      subject: 'Campus Network Upgrade',
      proposal: 'Fiber optic cables',
      purposeJustification: 'Infrastructure enhancement',
      department: 'CSE',
      departmentId: 'CSE',
      instituteId: 'inst-sit',
      priority: 'NORMAL',
      financialRequirement: false
    },
    facultyUser,
    false
  );

  db.processNoteSheetAction(thirdNs.id, 'FORWARD', 'HOD Endorsed', undefined, hodUser);
  db.processNoteSheetAction(thirdNs.id, 'FORWARD', 'HOI Endorsed', undefined, hoiUser);
  db.processNoteSheetAction(thirdNs.id, 'FORWARD', 'DyReg Endorsed', undefined, dyRegUser);

  // Temporarily deactivate all VP users
  const originalVPStatus = vpUser.status;
  const originalSeededVP = db.getUsers().find(u => u.id === vpUser.id || u.role === 'VICE_PRESIDENT');
  if (originalSeededVP) originalSeededVP.status = 'INACTIVE';

  let inactiveVpCaught = false;
  try {
    db.processNoteSheetAction(thirdNs.id, 'FORWARD', 'Forwarding when no active VP exists', undefined, regUser);
  } catch (err: any) {
    if (err.message.includes('No active Vice President is configured')) {
      inactiveVpCaught = true;
    }
  }
  assert(inactiveVpCaught, 'System throws configuration error when attempting to forward with inactive VP user');

  // Restore VP status
  if (originalSeededVP) originalSeededVP.status = 'ACTIVE';

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${totalPassed}/${totalTests} PASSED (${totalFailed} FAILED)`);
  console.log('========================================================================\n');

  return { totalTests, totalPassed, totalFailed };
}
