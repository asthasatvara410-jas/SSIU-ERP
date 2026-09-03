// ==============================================================================
// SWARRNIM UNIVERSITY ERP — GLOBAL NOTESHEET PENDING QUEUE AUDIT TEST SUITE
// ==============================================================================

import { db } from '../services/db';
import { User, NoteSheet } from '../types';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n========================================================================');
console.log('TEST SUITE: GLOBAL NOTESHEET PENDING QUEUE AUDIT ACROSS ALL LOGIN ROLES');
console.log('========================================================================\n');

// 1. Mock Users Across Different Roles & Scopes
const facultyCSE: User = {
  id: 'fac-cse-user',
  name: 'Prof. CSE Faculty',
  email: 'faculty.cse@ssiu.edu',
  role: 'FACULTY',
  instituteId: 'inst-1', // SIT
  departmentId: 'dept-1', // CSE
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hodCSE: User = {
  id: 'hod-cse-user',
  name: 'Dr. HOD Computer Engineering',
  email: 'hod.cse@ssiu.edu',
  role: 'HOD',
  instituteId: 'inst-1',
  departmentId: 'dept-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hodMechanical: User = {
  id: 'hod-mech-user',
  name: 'Dr. HOD Mechanical Engineering',
  email: 'hod.mech@ssiu.edu',
  role: 'HOD',
  instituteId: 'inst-1',
  departmentId: 'dept-2', // Mechanical
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const principalSIT: User = {
  id: 'hoi-sit-user',
  name: 'Dr. Principal SIT',
  email: 'principal.sit@ssiu.edu',
  role: 'PRINCIPAL',
  instituteId: 'inst-1', // SIT
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const principalPharmacy: User = {
  id: 'hoi-pharm-user',
  name: 'Dr. Principal Pharmacy',
  email: 'principal.pharmacy@ssiu.edu',
  role: 'PRINCIPAL',
  instituteId: 'inst-2', // Pharmacy
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const dyRegistrarSIT: User = {
  id: 'dy-reg-sit-user',
  name: 'Deputy Registrar (Engineering)',
  email: 'dyreg.eng@ssiu.edu',
  role: 'DEPUTY_REGISTRAR',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const dyRegistrarPharmacy: User = {
  id: 'dy-reg-pharm-user',
  name: 'Deputy Registrar (Medical & Pharmacy)',
  email: 'dyreg.pharm@ssiu.edu',
  role: 'DEPUTY_REGISTRAR',
  instituteId: 'inst-2',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const registrarUser: User = {
  id: 'reg-univ-user',
  name: 'Dr. University Registrar',
  email: 'registrar@ssiu.edu',
  role: 'REGISTRAR',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const vicePresidentUser: User = {
  id: 'user-vp',
  name: 'Vp SSIU',
  email: 'vp@swarrnim.edu.in',
  role: 'VICE_PRESIDENT',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const financeOfficer: User = {
  id: 'fin-officer-user',
  name: 'Finance & Accounts Officer',
  email: 'finance@ssiu.edu',
  role: 'ACCOUNTS_ADMIN',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const examCellOfficer: User = {
  id: 'exam-officer-user',
  name: 'Controller of Examination',
  email: 'exam@ssiu.edu',
  role: 'EXAM_CELL',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const studentSectionOfficer: User = {
  id: 'sec-officer-user',
  name: 'Student Section Incharge',
  email: 'studentsection@ssiu.edu',
  role: 'STUDENT_SECTION',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const hostelAdminUser: User = {
  id: 'hostel-admin-user',
  name: 'Chief Hostel Warden',
  email: 'hostel@ssiu.edu',
  role: 'HOSTEL_ADMIN',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

const iqacDirectorUser: User = {
  id: 'iqac-dir-user',
  name: 'Director IQAC',
  email: 'iqac@ssiu.edu',
  role: 'IQAC',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2026-01-01'
};

// Configure Deputy Registrar Scopes in DB
db.updateState(state => {
  state.users = [
    facultyCSE, hodCSE, hodMechanical, principalSIT, principalPharmacy,
    dyRegistrarSIT, dyRegistrarPharmacy, registrarUser, vicePresidentUser, financeOfficer,
    examCellOfficer, studentSectionOfficer, hostelAdminUser, iqacDirectorUser
  ];
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
      assignedByUserId: 'reg-univ-user',
      assignedBy: 'Registrar',
      assignedAt: '2026-01-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      status: 'ACTIVE'
    },
    {
      id: 'drs-pharm',
      userId: dyRegistrarPharmacy.id,
      userName: dyRegistrarPharmacy.name,
      userEmail: dyRegistrarPharmacy.email,
      instituteId: 'inst-2',
      instituteName: 'Swarrnim Institute of Pharmacy',
      departmentIds: ['dept-pharm-1'],
      departmentNames: ['Pharmacy Practice'],
      isUniversalInstituteScope: true,
      assignedByUserId: 'reg-univ-user',
      assignedBy: 'Registrar',
      assignedAt: '2026-01-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      status: 'ACTIVE'
    }
  ];
  state.noteSheets = [];
  state.notifications = [];
}, 'Reset test environment for global pending audit');

// ============================================================================
// STAGE 1: CREATION & FORWARDING TO HOD
// ============================================================================
console.log('--- Step 1: Faculty creates & submits Notesheet to HOD ---');

const nsCreated = db.createNoteSheet({
  subject: 'Procurement of High-End Workstations for CSE AI Lab',
  proposal: 'Proposal for purchasing 10 workstations with dedicated GPUs for deep learning coursework.',
  purposeJustification: 'Required for advanced semester AI & Machine Learning curriculum and research projects.',
  instituteId: 'inst-1',
  departmentId: 'dept-1',
  department: 'Computer Engineering',
  budgetRequired: true,
  estimatedCost: 120000,
  requiredDate: '2026-09-15',
  items: [
    { id: 'item-1', itemName: 'AI Deep Learning Workstation', description: 'i7 14th Gen, RTX 4070, 32GB RAM', quantity: 1, unit: 'Set', rate: 120000, amount: 120000 }
  ]
}, facultyCSE, false);

assert(Boolean(nsCreated.id), '1.1 Notesheet created successfully');
assert(nsCreated.status === 'PENDING_HOD', `1.2 Initial status is PENDING_HOD (actual: ${nsCreated.status})`);
assert(nsCreated.currentOffice === 'HOD', `1.3 Initial currentOffice is HOD (actual: ${nsCreated.currentOffice})`);

// Check Pending Queues: ONLY HOD CSE should have Pending = 1
const hodCsePending1 = db.getPendingNotesheetsForUser(hodCSE, 'HOD');
const hodMechPending1 = db.getPendingNotesheetsForUser(hodMechanical, 'HOD');
const hoiSitPending1 = db.getPendingNotesheetsForUser(principalSIT, 'PRINCIPAL');
const dyRegSitPending1 = db.getPendingNotesheetsForUser(dyRegistrarSIT, 'DEPUTY_REGISTRAR');
const regPending1 = db.getPendingNotesheetsForUser(registrarUser, 'REGISTRAR');

assert(hodCsePending1.length === 1 && hodCsePending1[0].id === nsCreated.id, '1.4 HOD CSE has exactly 1 pending Notesheet');
assert(hodMechPending1.length === 0, '1.5 HOD Mechanical has 0 pending Notesheets (Department Scope Isolation)');
assert(hoiSitPending1.length === 0, '1.6 Principal SIT has 0 pending Notesheets at HOD stage');
assert(dyRegSitPending1.length === 0, '1.7 Deputy Registrar SIT has 0 pending Notesheets at HOD stage');
assert(regPending1.length === 0, '1.8 Registrar has 0 pending Notesheets at HOD stage');

// ============================================================================
// STAGE 2: HOD APPROVES & FORWARDS TO PRINCIPAL (HOI)
// ============================================================================
console.log('\n--- Step 2: HOD Approves & Forwards to Principal (HOI) ---');

db.processNoteSheetAction(
  nsCreated.id,
  'FORWARD',
  'Approved at departmental level. Forwarded to Head of Institute (Principal) for concurrence.',
  undefined,
  hodCSE,
  'HOI'
);
const nsAfterHOD = db.getScopedNoteSheets(principalSIT, 'PRINCIPAL').find(n => n.id === nsCreated.id)!;

assert(nsAfterHOD.status === 'PENDING_HOI', `2.1 Notesheet advanced to PENDING_HOI (actual: ${nsAfterHOD.status})`);
assert(nsAfterHOD.currentOffice === 'HOI', `2.2 Notesheet currentOffice advanced to HOI (actual: ${nsAfterHOD.currentOffice})`);

const hodCsePending2 = db.getPendingNotesheetsForUser(hodCSE, 'HOD');
const hoiSitPending2 = db.getPendingNotesheetsForUser(principalSIT, 'PRINCIPAL');
const hoiPharmPending2 = db.getPendingNotesheetsForUser(principalPharmacy, 'PRINCIPAL');
const dyRegSitPending2 = db.getPendingNotesheetsForUser(dyRegistrarSIT, 'DEPUTY_REGISTRAR');
const regPending2 = db.getPendingNotesheetsForUser(registrarUser, 'REGISTRAR');

assert(hodCsePending2.length === 0, '2.3 HOD CSE pending count cleared to 0');
assert(hoiSitPending2.length === 1 && hoiSitPending2[0].id === nsCreated.id, '2.4 Principal SIT has exactly 1 pending Notesheet');
assert(hoiPharmPending2.length === 0, '2.5 Principal Pharmacy has 0 pending Notesheets (Institute Scope Isolation)');
assert(dyRegSitPending2.length === 0, '2.6 Deputy Registrar SIT has 0 pending Notesheets at HOI stage');
assert(regPending2.length === 0, '2.7 Registrar has 0 pending Notesheets at HOI stage');

// ============================================================================
// STAGE 3: PRINCIPAL APPROVES & FORWARDS TO DEPUTY REGISTRAR
// ============================================================================
console.log('\n--- Step 3: Principal Approves & Forwards to Deputy Registrar ---');

db.processNoteSheetAction(
  nsCreated.id,
  'FORWARD',
  'Strongly recommended for university academic infrastructure. Forwarded to Deputy Registrar.',
  undefined,
  principalSIT,
  'DEPUTY_REGISTRAR'
);
const nsAfterHOI = db.getScopedNoteSheets(dyRegistrarSIT, 'DEPUTY_REGISTRAR').find(n => n.id === nsCreated.id)!;

assert(nsAfterHOI.status === 'PENDING_DEPUTY_REGISTRAR', `3.1 Notesheet advanced to PENDING_DEPUTY_REGISTRAR (actual: ${nsAfterHOI.status})`);
assert(nsAfterHOI.currentOffice === 'DEPUTY_REGISTRAR', `3.2 Notesheet currentOffice advanced to DEPUTY_REGISTRAR (actual: ${nsAfterHOI.currentOffice})`);

const hoiSitPending3 = db.getPendingNotesheetsForUser(principalSIT, 'PRINCIPAL');
const dyRegSitPending3 = db.getPendingNotesheetsForUser(dyRegistrarSIT, 'DEPUTY_REGISTRAR');
const dyRegPharmPending3 = db.getPendingNotesheetsForUser(dyRegistrarPharmacy, 'DEPUTY_REGISTRAR');
const regPending3 = db.getPendingNotesheetsForUser(registrarUser, 'REGISTRAR');

assert(hoiSitPending3.length === 0, '3.3 Principal SIT pending count cleared to 0');
assert(dyRegSitPending3.length === 1 && dyRegSitPending3[0].id === nsCreated.id, '3.4 Deputy Registrar SIT has exactly 1 pending Notesheet');
assert(dyRegPharmPending3.length === 0, '3.5 Deputy Registrar Pharmacy has 0 pending Notesheets (Scope Isolation)');
assert(regPending3.length === 0, '3.6 Registrar has 0 pending Notesheets while at Deputy Registrar stage');

// ============================================================================
// STAGE 4: DEPUTY REGISTRAR APPROVES & FORWARDS TO REGISTRAR
// ============================================================================
console.log('\n--- Step 4: Deputy Registrar Approves & Forwards to Registrar ---');

db.processNoteSheetAction(
  nsCreated.id,
  'FORWARD',
  'Administrative vetting complete. Recommended for final statutory and financial sanction.',
  undefined,
  dyRegistrarSIT,
  'REGISTRAR'
);
const nsAfterDyReg = db.getScopedNoteSheets(registrarUser, 'REGISTRAR').find(n => n.id === nsCreated.id)!;

assert(nsAfterDyReg.status === 'PENDING_REGISTRAR', `4.1 Notesheet advanced to PENDING_REGISTRAR (actual: ${nsAfterDyReg.status})`);
assert(nsAfterDyReg.currentOffice === 'REGISTRAR', `4.2 Notesheet currentOffice advanced to REGISTRAR (actual: ${nsAfterDyReg.currentOffice})`);

const dyRegSitPending4 = db.getPendingNotesheetsForUser(dyRegistrarSIT, 'DEPUTY_REGISTRAR');
const regPending4 = db.getPendingNotesheetsForUser(registrarUser, 'REGISTRAR');

assert(dyRegSitPending4.length === 0, '4.3 Deputy Registrar SIT pending count cleared to 0');
assert(regPending4.length === 1 && regPending4[0].id === nsCreated.id, '4.4 Registrar has exactly 1 pending Notesheet');

// ============================================================================
// STAGE 5: REGISTRAR FORWARDS & VICE PRESIDENT EXECUTES FINAL APPROVAL
// ============================================================================
console.log('\n--- Step 5: Registrar Forwards & Vice President Executes Final Approval ---');

db.processNoteSheetAction(
  nsCreated.id,
  'APPROVE',
  'Endorsed. Forwarded for Vice President final sanction.',
  undefined,
  registrarUser
);

assert(db.getPendingNotesheetsForUser(registrarUser, 'REGISTRAR').filter(n => n.id === nsCreated.id).length === 0, '5.0 Registrar pending cleared to 0');
assert(db.getPendingNotesheetsForUser(vicePresidentUser, 'VICE_PRESIDENT').filter(n => n.id === nsCreated.id).length === 1, '5.1 Vice President has 1 pending Notesheet');

db.processNoteSheetAction(
  nsCreated.id,
  'APPROVE',
  'Sanctioned and Approved under Academic Computing Infrastructure grant.',
  undefined,
  vicePresidentUser,
  'COMPLETED',
  { approvedAmount: 120000, approvedAmountRemarks: 'Full sanction approved' }
);
const nsFinalApproved = db.getScopedNoteSheets(vicePresidentUser, 'VICE_PRESIDENT').find(n => n.id === nsCreated.id)!;

assert(nsFinalApproved.status === 'APPROVED', `5.1 Notesheet status is APPROVED (actual: ${nsFinalApproved.status})`);
assert(nsFinalApproved.decision === 'APPROVED', '5.2 Notesheet decision is APPROVED');
assert(nsFinalApproved.currentOffice === 'COMPLETED', '5.3 Notesheet currentOffice is COMPLETED');
assert(Boolean(nsFinalApproved.finalApprovalId), `5.4 Final Approval ID generated: ${nsFinalApproved.finalApprovalId}`);

// Check that ALL pending queues are 0 after completion
assert(db.getPendingNotesheetsForUser(facultyCSE, 'FACULTY').filter(n => n.id === nsCreated.id).length === 0, '5.5 Faculty pending is 0');
assert(db.getPendingNotesheetsForUser(hodCSE, 'HOD').filter(n => n.id === nsCreated.id).length === 0, '5.6 HOD pending is 0');
assert(db.getPendingNotesheetsForUser(principalSIT, 'PRINCIPAL').filter(n => n.id === nsCreated.id).length === 0, '5.7 Principal pending is 0');
assert(db.getPendingNotesheetsForUser(dyRegistrarSIT, 'DEPUTY_REGISTRAR').filter(n => n.id === nsCreated.id).length === 0, '5.8 Deputy Registrar pending is 0');
assert(db.getPendingNotesheetsForUser(registrarUser, 'REGISTRAR').filter(n => n.id === nsCreated.id).length === 0, '5.9 Registrar pending is 0');
assert(db.getPendingNotesheetsForUser(vicePresidentUser, 'VICE_PRESIDENT').filter(n => n.id === nsCreated.id).length === 0, '5.10 Vice President pending is 0');

// ============================================================================
// STAGE 6: FINAL APPROVAL NOTIFICATION TO ALL PARTICIPANTS
// ============================================================================
console.log('\n--- Step 6: Verify Final Approval Notification Delivered to All Participants ---');

const facNotifs = db.getNotifications(facultyCSE, 'FACULTY');
const hodNotifs = db.getNotifications(hodCSE, 'HOD');
const hoiNotifs = db.getNotifications(principalSIT, 'PRINCIPAL');
const dyRegNotifs = db.getNotifications(dyRegistrarSIT, 'DEPUTY_REGISTRAR');
const regNotifs = db.getNotifications(registrarUser, 'REGISTRAR');
const hodMechNotifs = db.getNotifications(hodMechanical, 'HOD');
const hoiPharmNotifs = db.getNotifications(principalPharmacy, 'PRINCIPAL');

assert(facNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.1 [Creator] Faculty received final approval notification');
assert(hodNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.2 [Participant] HOD received final approval notification');
assert(hoiNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.3 [Participant] Principal received final approval notification');
assert(dyRegNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.4 [Participant] Deputy Registrar received final approval notification');
assert(regNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.5 [Approver] Registrar received final approval notification');
assert(!hodMechNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.6 Unrelated HOD Mechanical received 0 notifications');
assert(!hoiPharmNotifs.some(n => n.type === 'APPROVAL_COMPLETED' && n.referenceId === nsCreated.noteSheetNumber), '6.7 Unrelated Principal Pharmacy received 0 notifications');

// ============================================================================
// STAGE 7: AUDIT OTHER SPECIALIZED ADMINISTRATIVE WORKFLOW OFFICES
// ============================================================================
console.log('\n--- Step 7: Specialized Administrative Offices Pending Check ---');

// 7.1 Finance / Accounts Pending
const nsFinance: NoteSheet = {
  ...nsCreated,
  id: 'ns-fin-test',
  noteSheetNumber: 'SIT-NOTESHEET-0826-099',
  status: 'PENDING_FINANCE',
  currentOffice: 'FINANCE',
  movements: []
};
assert(db.isNotesheetPendingForUser(financeOfficer, 'ACCOUNTS_ADMIN', nsFinance), '7.1 Finance Officer sees PENDING_FINANCE notesheet in pending queue');
assert(!db.isNotesheetPendingForUser(examCellOfficer, 'EXAM_CELL', nsFinance), '7.2 Exam Cell does NOT see PENDING_FINANCE notesheet');

// 7.2 Examination Cell Pending
const nsExam: NoteSheet = {
  ...nsCreated,
  id: 'ns-exam-test',
  noteSheetNumber: 'SIT-NOTESHEET-0826-100',
  status: 'PENDING_EXAMINATION',
  currentOffice: 'EXAM_CELL',
  movements: []
};
assert(db.isNotesheetPendingForUser(examCellOfficer, 'EXAM_CELL', nsExam), '7.3 Exam Cell Officer sees PENDING_EXAMINATION notesheet in pending queue');
assert(!db.isNotesheetPendingForUser(financeOfficer, 'ACCOUNTS_ADMIN', nsExam), '7.4 Finance Officer does NOT see PENDING_EXAMINATION notesheet');

// 7.3 Student Section Pending
const nsStudentSection: NoteSheet = {
  ...nsCreated,
  id: 'ns-sec-test',
  noteSheetNumber: 'SIT-NOTESHEET-0826-101',
  status: 'PENDING_STUDENT_SECTION',
  currentOffice: 'STUDENT_SECTION',
  movements: []
};
assert(db.isNotesheetPendingForUser(studentSectionOfficer, 'STUDENT_SECTION', nsStudentSection), '7.5 Student Section Officer sees PENDING_STUDENT_SECTION notesheet in pending queue');

// 7.4 Hostel Admin Pending
const nsHostel: NoteSheet = {
  ...nsCreated,
  id: 'ns-hostel-test',
  noteSheetNumber: 'SIT-NOTESHEET-0826-102',
  status: 'PENDING_HOSTEL',
  currentOffice: 'HOSTEL_ADMIN',
  movements: []
};
assert(db.isNotesheetPendingForUser(hostelAdminUser, 'HOSTEL_ADMIN', nsHostel), '7.6 Hostel Admin sees PENDING_HOSTEL notesheet in pending queue');

// 7.5 IQAC Director Pending
const nsIQAC: NoteSheet = {
  ...nsCreated,
  id: 'ns-iqac-test',
  noteSheetNumber: 'SIT-NOTESHEET-0826-103',
  status: 'PENDING_IQAC',
  currentOffice: 'IQAC',
  movements: []
};
assert(db.isNotesheetPendingForUser(iqacDirectorUser, 'IQAC', nsIQAC), '7.7 IQAC Director sees PENDING_IQAC notesheet in pending queue');

// 7.6 Clarification Required (Pending with Creator)
const nsClarification: NoteSheet = {
  ...nsCreated,
  id: 'ns-clar-test',
  noteSheetNumber: 'SIT-NOTESHEET-0826-104',
  status: 'CLARIFICATION_REQUIRED',
  currentOffice: 'CREATOR',
  creatorId: facultyCSE.id,
  movements: []
};
assert(db.isNotesheetPendingForUser(facultyCSE, 'FACULTY', nsClarification), '7.8 Creator Faculty sees CLARIFICATION_REQUIRED notesheet in pending queue');
assert(!db.isNotesheetPendingForUser(hodCSE, 'HOD', nsClarification), '7.9 HOD does NOT see CLARIFICATION_REQUIRED until clarified');

import { describe, it, expect } from 'vitest';

describe('Global Notesheet Pending Queue Audit Across All Login Roles', () => {
  it('verifies all 53 role-scoped pending queue assertions', () => {
    expect(failCount).toBe(0);
    expect(passCount).toBeGreaterThanOrEqual(53);
  });
});
