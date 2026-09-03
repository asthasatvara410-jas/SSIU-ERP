declare const process: any;

import { db } from '../services/db';
import { User } from '../types';

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

export async function runNotesheetApprovalFlowAndDigitalTrailSuite() {
  console.log('\n========================================================================');
  console.log('TEST SUITE: NOTESHEET APPROVAL FLOW + DIGITAL APPROVAL TRAIL (₹8,45,000)');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  // 1. Setup Test Users
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

  const hodMechanical: User = {
    id: 'usr-hod-mech',
    name: 'Dr. Vikram Joshi',
    email: 'vikram.joshi@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-2',
    departmentName: 'Mechanical Engineering',
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
    state.users = [facultyCSE, hodCSE, hodMechanical, principalSIT, dyRegistrarSIT, registrarUser, vicePresidentUser];
    state.deputyRegistrarScopes = [
      {
        id: 'drs-sit',
        userId: dyRegistrarSIT.id,
        userName: dyRegistrarSIT.name,
        userEmail: dyRegistrarSIT.email,
        instituteId: 'inst-1',
        instituteName: 'Swarrnim School of Computing & IT',
        departmentIds: ['dept-1', 'dept-2'],
        departmentNames: ['Computer Engineering', 'Mechanical Engineering'],
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
  }, 'Initialize Notesheet Approval Flow Test State');

  // ============================================================================
  // STAGE 1: Faculty creates & submits Financial Demo Notesheet (₹8,45,000)
  // ============================================================================
  console.log('--- Stage 1: Faculty Creates & Submits Demo Notesheet (₹8,45,000) ---');

  const demoNotesheet = db.createNoteSheet({
    subject: 'AI & High Performance Computing Lab Infrastructure Upgrade',
    proposal: 'Procurement of GPU compute nodes, deep learning workstations, and server racks.',
    purposeJustification: 'Mandatory upgrade for NAAC accreditation and AI research lab setup.',
    notesheetType: 'Financial Sanction',
    category: 'INFRASTRUCTURE',
    priority: 'HIGH',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    department: 'Computer Engineering',
    financialRequirement: true,
    budgetRequired: true,
    budgetHead: 'LAB_EQUIPMENT_CAPEX',
    requestedAmount: 845000,
    estimatedCost: 845000,
    items: [
      { id: 'item-1', itemName: 'High-Performance GPU Server', description: 'Dual Xeon, 8x RTX 4090, 256GB RAM', quantity: 1, unit: 'Unit', rate: 650000, amount: 650000 },
      { id: 'item-2', itemName: 'Network Switch 10GbE', description: '24-Port Managed SFP+ Switch', quantity: 2, unit: 'Unit', rate: 75000, amount: 150000 },
      { id: 'item-3', itemName: 'Server Rack & PDU', description: '42U Server Rack with Smart PDU', quantity: 1, unit: 'Set', rate: 45000, amount: 45000 }
    ]
  }, facultyCSE, false);

  assert(Boolean(demoNotesheet.id), '1.1 Demo Notesheet created successfully');
  assert(demoNotesheet.requestedAmount === 845000, `1.2 Requested amount is ₹8,45,000 (actual: ₹${demoNotesheet.requestedAmount})`);
  assert(demoNotesheet.status === 'PENDING_HOD', `1.3 Status is PENDING_HOD (actual: ${demoNotesheet.status})`);
  assert(demoNotesheet.currentOffice === 'HOD', `1.4 Current Office is HOD (actual: ${demoNotesheet.currentOffice})`);
  assert(demoNotesheet.currentAssigneeRole === 'HOD', `1.5 Current Assignee Role is HOD (actual: ${demoNotesheet.currentAssigneeRole})`);
  assert(demoNotesheet.currentAssigneeUserId === hodCSE.id, `1.6 Current Assignee User ID is HOD CSE (actual: ${demoNotesheet.currentAssigneeUserId})`);
  assert(demoNotesheet.currentAssigneeName === hodCSE.name, `1.7 Current Assignee Name is Dr. Amit Patel (actual: ${demoNotesheet.currentAssigneeName})`);

  // Verify Organogram Path
  assert(
    JSON.stringify(demoNotesheet.organogramPath) === JSON.stringify(['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT']),
    `1.8 Organogram path is strictly [HOD -> HOI -> DEPUTY_REGISTRAR -> REGISTRAR -> VICE_PRESIDENT]`
  );

  // Verify Pending Queue Isolation at Stage 1
  const pendingHOD_CSE = db.getPendingWithMeNotesheets(hodCSE, 'HOD');
  const pendingHOD_Mech = db.getPendingWithMeNotesheets(hodMechanical, 'HOD');
  const pendingHOI = db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL');
  const pendingDyReg = db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR');
  const pendingReg = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
  const pendingVP = db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT');

  assert(pendingHOD_CSE.length === 1 && pendingHOD_CSE[0].id === demoNotesheet.id, '1.9 HOD CSE has exactly 1 pending Notesheet');
  assert(pendingHOD_Mech.length === 0, '1.10 HOD Mechanical has 0 pending Notesheets (Scope Isolation)');
  assert(pendingHOI.length === 0, '1.11 Principal SIT has 0 pending Notesheets at HOD stage');
  assert(pendingDyReg.length === 0, '1.12 Deputy Registrar has 0 pending Notesheets at HOD stage');
  assert(pendingReg.length === 0, '1.13 Registrar has 0 pending Notesheets at HOD stage');
  assert(pendingVP.length === 0, '1.14 Vice President has 0 pending Notesheets at HOD stage');

  // Verify Movement 1
  assert(demoNotesheet.movements.length === 1, '1.15 Exactly 1 movement recorded upon submission');
  const mvt1 = demoNotesheet.movements[0];
  assert(mvt1.actorUserId === facultyCSE.id, '1.16 Movement 1 actorUserId is Faculty');
  assert(mvt1.action === 'SUBMIT', '1.17 Movement 1 action is SUBMIT');
  assert(mvt1.toUserId === hodCSE.id, '1.18 Movement 1 toUserId is HOD CSE');

  // ============================================================================
  // STAGE 2: HOD Approves & Forwards to HOI / Principal
  // ============================================================================
  console.log('\n--- Stage 2: HOD Approves & Forwards to HOI / Principal ---');

  db.processNoteSheetAction(
    demoNotesheet.id,
    'APPROVE',
    'Recommended for high-performance AI lab setup. Forwarded for Principal sanction.',
    undefined,
    hodCSE
  );

  const nsAfterHOD = db.getNoteSheetById(demoNotesheet.id)!;
  assert(nsAfterHOD.status === 'PENDING_HOI', `2.1 Status advanced to PENDING_HOI (actual: ${nsAfterHOD.status})`);
  assert(nsAfterHOD.currentOffice === 'HOI', `2.2 Current Office advanced to HOI (actual: ${nsAfterHOD.currentOffice})`);
  assert(nsAfterHOD.currentAssigneeRole === 'PRINCIPAL', `2.3 Current Assignee Role is PRINCIPAL (actual: ${nsAfterHOD.currentAssigneeRole})`);
  assert(nsAfterHOD.currentAssigneeUserId === principalSIT.id, `2.4 Current Assignee User ID is Principal SIT (actual: ${nsAfterHOD.currentAssigneeUserId})`);
  assert(nsAfterHOD.currentAssigneeName === principalSIT.name, `2.5 Current Assignee Name is Dr. Arvind Sharma (actual: ${nsAfterHOD.currentAssigneeName})`);

  // Verify Pending Queue Transitions
  assert(db.getPendingWithMeNotesheets(hodCSE, 'HOD').length === 0, '2.6 HOD CSE pending count cleared to 0');
  assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 1, '2.7 Principal SIT has exactly 1 pending Notesheet');
  assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 0, '2.8 Deputy Registrar has 0 pending Notesheets');
  assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, '2.9 Registrar has 0 pending Notesheets');
  assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, '2.10 Vice President has 0 pending Notesheets');

  // Verify Movement 2
  assert(nsAfterHOD.movements.length === 2, '2.11 Exactly 2 movements recorded after HOD endorsement');
  const mvt2 = nsAfterHOD.movements[1];
  assert(mvt2.actorUserId === hodCSE.id, '2.12 Movement 2 actorUserId is HOD');
  assert(mvt2.action === 'FORWARD', '2.13 Movement 2 action is FORWARD');
  assert(mvt2.decision === 'APPROVED_AND_FORWARDED', '2.14 Movement 2 decision is APPROVED_AND_FORWARDED');
  assert(Boolean(mvt2.approvalId && mvt2.approvalId.startsWith('NS-APR-')), `2.15 Digital Approval ID generated: ${mvt2.approvalId}`);
  assert(mvt2.toUserId === principalSIT.id, '2.16 Movement 2 toUserId is Principal SIT');

  // ============================================================================
  // STAGE 3: HOI / Principal Approves & Forwards to Deputy Registrar
  // ============================================================================
  console.log('\n--- Stage 3: HOI / Principal Approves & Forwards to Deputy Registrar ---');

  db.processNoteSheetAction(
    demoNotesheet.id,
    'APPROVE',
    'Institute level concurrence granted. Forwarded to Deputy Registrar for statutory scrutiny.',
    undefined,
    principalSIT
  );

  const nsAfterHOI = db.getNoteSheetById(demoNotesheet.id)!;
  assert(nsAfterHOI.status === 'PENDING_DEPUTY_REGISTRAR', `3.1 Status advanced to PENDING_DEPUTY_REGISTRAR (actual: ${nsAfterHOI.status})`);
  assert(nsAfterHOI.currentOffice === 'DEPUTY_REGISTRAR', `3.2 Current Office advanced to DEPUTY_REGISTRAR (actual: ${nsAfterHOI.currentOffice})`);
  assert(nsAfterHOI.currentAssigneeRole === 'DEPUTY_REGISTRAR', `3.3 Current Assignee Role is DEPUTY_REGISTRAR (actual: ${nsAfterHOI.currentAssigneeRole})`);
  assert(nsAfterHOI.currentAssigneeUserId === dyRegistrarSIT.id, `3.4 Current Assignee User ID is Deputy Registrar SIT (actual: ${nsAfterHOI.currentAssigneeUserId})`);
  assert(nsAfterHOI.currentAssigneeName === dyRegistrarSIT.name, `3.5 Current Assignee Name is Dr. Suresh Verma (actual: ${nsAfterHOI.currentAssigneeName})`);

  // Verify Pending Queue Transitions
  assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 0, '3.6 Principal pending count cleared to 0');
  assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 1, '3.7 Deputy Registrar has exactly 1 pending Notesheet');
  assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, '3.8 Registrar has 0 pending Notesheets while at Deputy Registrar stage');
  assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, '3.9 Vice President has 0 pending Notesheets');

  // Verify Movement 3
  assert(nsAfterHOI.movements.length === 3, '3.10 Exactly 3 movements recorded');
  const mvt3 = nsAfterHOI.movements[2];
  assert(mvt3.actorUserId === principalSIT.id, '3.11 Movement 3 actorUserId is Principal');
  assert(mvt3.action === 'FORWARD', '3.12 Movement 3 action is FORWARD');
  assert(Boolean(mvt3.approvalId && mvt3.approvalId.startsWith('NS-APR-')), `3.13 Digital Approval ID generated: ${mvt3.approvalId}`);
  assert(mvt3.toUserId === dyRegistrarSIT.id, '3.14 Movement 3 toUserId is Deputy Registrar SIT');

  // ============================================================================
  // STAGE 4: Deputy Registrar Scrutinizes & Forwards to Registrar
  // ============================================================================
  console.log('\n--- Stage 4: Deputy Registrar Approves & Forwards to Registrar ---');

  db.processNoteSheetAction(
    demoNotesheet.id,
    'APPROVE',
    'Statutory compliance and department inventory verified. Submitted to Registrar for administrative endorsement.',
    undefined,
    dyRegistrarSIT
  );

  const nsAfterDyReg = db.getNoteSheetById(demoNotesheet.id)!;
  assert(nsAfterDyReg.status === 'PENDING_REGISTRAR', `4.1 Status advanced to PENDING_REGISTRAR (actual: ${nsAfterDyReg.status})`);
  assert(nsAfterDyReg.currentOffice === 'REGISTRAR', `4.2 Current Office advanced to REGISTRAR (actual: ${nsAfterDyReg.currentOffice})`);
  assert(nsAfterDyReg.currentAssigneeRole === 'REGISTRAR', `4.3 Current Assignee Role is REGISTRAR (actual: ${nsAfterDyReg.currentAssigneeRole})`);
  assert(nsAfterDyReg.currentAssigneeUserId === registrarUser.id, `4.4 Current Assignee User ID is Registrar (actual: ${nsAfterDyReg.currentAssigneeUserId})`);
  assert(nsAfterDyReg.currentAssigneeName === registrarUser.name, `4.5 Current Assignee Name is Dr. K. N. Shah (actual: ${nsAfterDyReg.currentAssigneeName})`);

  // Verify Pending Queue Transitions
  assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 0, '4.6 Deputy Registrar pending count cleared to 0');
  assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 1, '4.7 Registrar has exactly 1 pending Notesheet');
  assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, '4.8 Vice President has 0 pending Notesheets');

  // Verify Movement 4
  assert(nsAfterDyReg.movements.length === 4, '4.9 Exactly 4 movements recorded');
  const mvt4 = nsAfterDyReg.movements[3];
  assert(mvt4.actorUserId === dyRegistrarSIT.id, '4.10 Movement 4 actorUserId is Deputy Registrar');
  assert(mvt4.action === 'FORWARD', '4.11 Movement 4 action is FORWARD');
  assert(Boolean(mvt4.approvalId && mvt4.approvalId.startsWith('NS-APR-')), `4.12 Digital Approval ID generated: ${mvt4.approvalId}`);
  assert(mvt4.toUserId === registrarUser.id, '4.13 Movement 4 toUserId is Registrar');

  // ============================================================================
  // STAGE 5: Registrar Endorses & Forwards to Vice President
  // ============================================================================
  console.log('\n--- Stage 5: Registrar Endorses & Forwards to Vice President ---');

  db.processNoteSheetAction(
    demoNotesheet.id,
    'APPROVE',
    'Registrar Endorsement accorded. Recommended and submitted for Vice President final sanction.',
    undefined,
    registrarUser
  );

  const nsAfterReg = db.getNoteSheetById(demoNotesheet.id)!;
  assert(nsAfterReg.status === 'PENDING_VICE_PRESIDENT', `5.1 Status advanced to PENDING_VICE_PRESIDENT (actual: ${nsAfterReg.status})`);
  assert(nsAfterReg.currentOffice === 'VICE_PRESIDENT', `5.2 Current Office advanced to VICE_PRESIDENT (actual: ${nsAfterReg.currentOffice})`);
  assert(nsAfterReg.currentAssigneeRole === 'VICE_PRESIDENT', `5.3 Current Assignee Role is VICE_PRESIDENT (actual: ${nsAfterReg.currentAssigneeRole})`);
  assert(nsAfterReg.currentAssigneeUserId === vicePresidentUser.id, `5.4 Current Assignee User ID is Vice President (actual: ${nsAfterReg.currentAssigneeUserId})`);
  assert(nsAfterReg.currentAssigneeName === vicePresidentUser.name, `5.5 Current Assignee Name is Vp SSIU (actual: ${nsAfterReg.currentAssigneeName})`);

  // Verify Pending Queue Transitions
  assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, '5.6 Registrar pending count cleared to 0');
  assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 1, '5.7 Vice President has exactly 1 pending Notesheet');

  // Verify Movement 5
  assert(nsAfterReg.movements.length === 5, '5.8 Exactly 5 movements recorded');
  const mvt5 = nsAfterReg.movements[4];
  assert(mvt5.actorUserId === registrarUser.id, '5.9 Movement 5 actorUserId is Registrar');
  assert(mvt5.action === 'FORWARD', '5.10 Movement 5 action is FORWARD');
  assert(Boolean(mvt5.approvalId && mvt5.approvalId.startsWith('NS-APR-')), `5.11 Digital Approval ID generated: ${mvt5.approvalId}`);
  assert(mvt5.toUserId === vicePresidentUser.id, '5.12 Movement 5 toUserId is Vice President');

  // ============================================================================
  // STAGE 6: Vice President Executes Final Sanction of ₹8,45,000
  // ============================================================================
  console.log('\n--- Stage 6: Vice President Executes Final Sanction ---');

  db.processNoteSheetAction(
    demoNotesheet.id,
    'APPROVE',
    'Final Administrative and Financial Sanction accorded for ₹8,45,000. Purchase department to initiate procurement.',
    undefined,
    vicePresidentUser,
    undefined,
    { approvedAmount: 845000, approvedAmountRemarks: 'Full sanction granted.' }
  );

  const nsFinal = db.getNoteSheetById(demoNotesheet.id)!;
  assert(nsFinal.status === 'APPROVED', `6.1 Final status is APPROVED (actual: ${nsFinal.status})`);
  assert(nsFinal.decision === 'APPROVED', `6.2 Decision is APPROVED (actual: ${nsFinal.decision})`);
  assert(nsFinal.currentOffice === 'COMPLETED', `6.3 Current Office is COMPLETED (actual: ${nsFinal.currentOffice})`);
  assert(nsFinal.currentAssigneeUserId === undefined, '6.4 Current Assignee User ID is cleared upon completion');
  assert(nsFinal.approvedAmount === 845000, `6.5 Approved amount recorded as ₹8,45,000 (actual: ₹${nsFinal.approvedAmount})`);
  assert(Boolean(nsFinal.finalApprovalId && nsFinal.finalApprovalId.startsWith('NS-APR-')), `6.6 Final Approval ID generated: ${nsFinal.finalApprovalId}`);
  assert(nsFinal.approvedByUserId === vicePresidentUser.id, '6.7 ApprovedByUserId is Vice President');
  assert(nsFinal.approvedByName === vicePresidentUser.name, '6.8 ApprovedByName is Vp SSIU');

  // All pending counts must be 0
  assert(db.getPendingWithMeNotesheets(facultyCSE, 'FACULTY').length === 0, '6.9 Faculty pending count is 0');
  assert(db.getPendingWithMeNotesheets(hodCSE, 'HOD').length === 0, '6.10 HOD pending count is 0');
  assert(db.getPendingWithMeNotesheets(principalSIT, 'PRINCIPAL').length === 0, '6.11 Principal pending count is 0');
  assert(db.getPendingWithMeNotesheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').length === 0, '6.12 Deputy Registrar pending count is 0');
  assert(db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR').length === 0, '6.13 Registrar pending count is 0');
  assert(db.getPendingWithMeNotesheets(vicePresidentUser, 'VICE_PRESIDENT').length === 0, '6.14 Vice President pending count is 0');

  // ============================================================================
  // STAGE 7: Complete Digital Approval Trail Audit Verification
  // ============================================================================
  console.log('\n--- Stage 7: Verify Complete Digital Approval Trail Integrity ---');

  assert(nsFinal.movements.length === 6, `7.1 Exactly 6 movements in complete approval chain (actual: ${nsFinal.movements.length})`);

  const [trail1, trail2, trail3, trail4, trail5, trail6] = nsFinal.movements;

  // Step 1: Faculty
  assert(trail1.actorUserId === facultyCSE.id, '7.2 Step 1 actor is Faculty');
  assert(trail1.action === 'SUBMIT', '7.3 Step 1 action is SUBMIT');
  assert(trail1.designation === 'Faculty' || trail1.designation === 'Faculty / Initiator', `7.4 Step 1 designation is Faculty (actual: ${trail1.designation})`);

  // Step 2: HOD
  assert(trail2.actorUserId === hodCSE.id, '7.5 Step 2 actor is HOD');
  assert(trail2.action === 'FORWARD', '7.6 Step 2 action is FORWARD');
  assert(trail2.designation === 'Head of Department', `7.7 Step 2 designation is Head of Department (actual: ${trail2.designation})`);
  assert(Boolean(trail2.approvalId), '7.8 Step 2 has digital approval ID');

  // Step 3: Principal
  assert(trail3.actorUserId === principalSIT.id, '7.9 Step 3 actor is Principal');
  assert(trail3.action === 'FORWARD', '7.10 Step 3 action is FORWARD');
  assert(trail3.designation === 'Principal / HOI' || trail3.designation === 'Head of Institute / Principal', `7.11 Step 3 designation is Principal (actual: ${trail3.designation})`);
  assert(Boolean(trail3.approvalId), '7.12 Step 3 has digital approval ID');

  // Step 4: Deputy Registrar
  assert(trail4.actorUserId === dyRegistrarSIT.id, '7.13 Step 4 actor is Deputy Registrar');
  assert(trail4.action === 'FORWARD', '7.14 Step 4 action is FORWARD');
  assert(trail4.designation === 'Deputy Registrar', `7.15 Step 4 designation is Deputy Registrar (actual: ${trail4.designation})`);
  assert(Boolean(trail4.approvalId), '7.16 Step 4 has digital approval ID');

  // Step 5: Registrar
  assert(trail5.actorUserId === registrarUser.id, '7.17 Step 5 actor is Registrar');
  assert(trail5.action === 'FORWARD', '7.18 Step 5 action is FORWARD');
  assert(trail5.designation === 'Registrar', `7.19 Step 5 designation is Registrar (actual: ${trail5.designation})`);
  assert(Boolean(trail5.approvalId), '7.20 Step 5 has digital approval ID');

  // Step 6: Vice President
  assert(trail6.actorUserId === vicePresidentUser.id, '7.21 Step 6 actor is Vice President');
  assert(trail6.action === 'APPROVE', '7.22 Step 6 action is APPROVE');
  assert(trail6.decision === 'FINAL_APPROVED', '7.23 Step 6 decision is FINAL_APPROVED');
  assert(trail6.designation === 'Vice President', `7.24 Step 6 designation is Vice President (actual: ${trail6.designation})`);
  assert(Boolean(trail6.approvalId), '7.25 Step 6 has digital approval ID');

  // Verify Immutable Audit Trail Entries
  assert((nsFinal.auditTrail || []).length >= 6, `7.26 Security audit trail recorded ${nsFinal.auditTrail?.length} entries`);

  // ============================================================================
  // STAGE 8: Security & Out-of-Order Approval Prevention Guards
  // ============================================================================
  console.log('\n--- Stage 8: Security & Authority Guard Enforcement ---');

  // Create a fresh test notesheet at HOD stage
  const guardTestNs = db.createNoteSheet({
    subject: 'Security Guard Test Notesheet',
    proposal: 'Test out-of-order approval prevention.',
    notesheetType: 'Administrative',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    department: 'Computer Engineering'
  }, facultyCSE, false);

  // Deputy Registrar attempts to approve while at HOD -> Must be blocked
  let dyRegBypassBlocked = false;
  try {
    db.processNoteSheetAction(guardTestNs.id, 'APPROVE', 'Attempted unauthorized skip', undefined, dyRegistrarSIT);
  } catch (err: any) {
    dyRegBypassBlocked = true;
  }
  assert(dyRegBypassBlocked || guardTestNs.status === 'PENDING_HOD', '8.1 Deputy Registrar cannot approve while Notesheet is at HOD stage');

  // Registrar attempts to approve while at HOD -> Must be blocked
  let regBypassBlocked = false;
  try {
    db.processNoteSheetAction(guardTestNs.id, 'APPROVE', 'Attempted bypass to Registrar', undefined, registrarUser);
  } catch (err: any) {
    regBypassBlocked = true;
  }
  assert(regBypassBlocked || guardTestNs.status === 'PENDING_HOD', '8.2 Registrar cannot approve while Notesheet is at HOD stage');

  // Vice President attempts to approve while at HOD -> Must be blocked
  let vpBypassBlocked = false;
  try {
    db.processNoteSheetAction(guardTestNs.id, 'APPROVE', 'Attempted bypass to VP', undefined, vicePresidentUser);
  } catch (err: any) {
    vpBypassBlocked = true;
  }
  assert(vpBypassBlocked || guardTestNs.status === 'PENDING_HOD', '8.3 Vice President cannot approve while Notesheet is at HOD stage');

  console.log('\n========================================================================');
  console.log(`TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} tests`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    throw new Error(`${failCount} tests failed in Notesheet Approval Flow & Digital Approval Trail suite.`);
  }
}

// Auto-run if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('notesheetApprovalFlowAndDigitalTrail.test.ts')) {
  runNotesheetApprovalFlowAndDigitalTrailSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}



