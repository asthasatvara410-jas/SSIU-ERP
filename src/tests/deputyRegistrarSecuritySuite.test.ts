import { db } from '../services/db';
import { hasPermission, verifyScopeAccess, enforceApiSecurity } from '../services/securityService';
import { isTabPermittedForRole } from '../constants/navigationConfig';
import { User, NoteSheet, NoteSheetMovement } from '../types';

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, category: string, testName: string, detail?: string): void {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [${category}] ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ✗ FAIL [${category}] ${testName} ${detail ? `(${detail})` : ''}`);
    totalFailed++;
  }
}

export async function runDeputyRegistrarSecuritySuite(): Promise<void> {
  console.log('\n========================================================================');
  console.log('PHASE: DEPUTY REGISTRAR SECURITY, RBAC & NOTESHEET INTEGRATION SUITE');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();
  const allUsers = db.getUsers();

  // 1. DEPUTY REGISTRAR USER RESOLUTION & LOGIN
  console.log('\n--- 1. Deputy Registrar User Account & Authentication ---');
  const deputyRegistrar = allUsers.find(u => u.role === 'DEPUTY_REGISTRAR');
  assert(Boolean(deputyRegistrar), 'AUTH', '1.1 Deputy Registrar user found in database seed');
  assert(deputyRegistrar?.username === 'deputyregistrar', 'AUTH', '1.2 Username is deputyregistrar');
  assert(deputyRegistrar?.role === 'DEPUTY_REGISTRAR', 'AUTH', '1.3 Role is DEPUTY_REGISTRAR');

  const registrar = allUsers.find(u => u.role === 'REGISTRAR') || {
    id: 'usr-reg', name: 'Dr. Registrar', email: 'registrar@swarrnim.edu.in', role: 'REGISTRAR' as const,
    status: 'ACTIVE' as const, createdAt: ''
  };
  const hod = allUsers.find(u => u.role === 'HOD') || {
    id: 'usr-hod', name: 'Dr. HOD', email: 'hod@swarrnim.edu.in', role: 'HOD' as const,
    instituteId: 'inst-1', departmentId: 'dept-1', status: 'ACTIVE' as const, createdAt: ''
  };
  const faculty = allUsers.find(u => u.role === 'FACULTY') || {
    id: 'usr-faculty', name: 'Prof. Faculty', email: 'faculty@swarrnim.edu.in', role: 'FACULTY' as const,
    instituteId: 'inst-1', departmentId: 'dept-1', status: 'ACTIVE' as const, createdAt: ''
  };
  const student = allUsers.find(u => u.role === 'STUDENT') || {
    id: 'usr-student', name: 'Student', email: 'student@swarrnim.edu.in', role: 'STUDENT' as const,
    instituteId: 'inst-1', departmentId: 'dept-1', status: 'ACTIVE' as const, createdAt: ''
  };

  // 2. EXPLICIT RBAC PERMISSIONS (NOT FULL REGISTRAR COPY)
  console.log('\n--- 2. Deputy Registrar RBAC & Explicit Permissions ---');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'NOTESHEET_VIEW'), 'RBAC', '2.1 Deputy Registrar has NOTESHEET_VIEW');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'NOTESHEET_CREATE'), 'RBAC', '2.2 Deputy Registrar has NOTESHEET_CREATE');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'NOTESHEET_REVIEW'), 'RBAC', '2.3 Deputy Registrar has NOTESHEET_REVIEW');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'NOTESHEET_APPROVE'), 'RBAC', '2.4 Deputy Registrar has NOTESHEET_APPROVE');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'NOTESHEET_FORWARD'), 'RBAC', '2.5 Deputy Registrar has NOTESHEET_FORWARD');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'NOTESHEET_REJECT'), 'RBAC', '2.6 Deputy Registrar has NOTESHEET_REJECT');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'APPROVAL_VIEW'), 'RBAC', '2.7 Deputy Registrar has APPROVAL_VIEW');
  assert(hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'APPROVAL_DECIDE'), 'RBAC', '2.8 Deputy Registrar has APPROVAL_DECIDE');

  // Negative RBAC tests: Deputy Registrar must NOT have full Registrar management permissions
  assert(!hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'INSTITUTE_MANAGE'), 'RBAC', '2.9 Deputy Registrar DENIED INSTITUTE_MANAGE');
  assert(!hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'DEPARTMENT_MANAGE'), 'RBAC', '2.10 Deputy Registrar DENIED DEPARTMENT_MANAGE');
  assert(!hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'PROGRAM_MANAGE'), 'RBAC', '2.11 Deputy Registrar DENIED PROGRAM_MANAGE');
  assert(!hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'STUDENT_DELETE'), 'RBAC', '2.12 Deputy Registrar DENIED STUDENT_DELETE');
  assert(!hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'FACULTY_DELETE'), 'RBAC', '2.13 Deputy Registrar DENIED FACULTY_DELETE');
  assert(!hasPermission(deputyRegistrar as User, 'DEPUTY_REGISTRAR', 'SETTINGS_MANAGE'), 'RBAC', '2.14 Deputy Registrar DENIED SETTINGS_MANAGE');

  // 3. ROUTE GUARD & NAVIGATION AUTHORIZATION
  console.log('\n--- 3. Route Guard & Tab Permissions ---');
  assert(isTabPermittedForRole('dashboard', 'DEPUTY_REGISTRAR'), 'ROUTE', '3.1 Deputy Registrar ALLOWED dashboard');
  assert(isTabPermittedForRole('reg-uni-institutes', 'DEPUTY_REGISTRAR'), 'ROUTE', '3.2 Deputy Registrar ALLOWED reg-uni-institutes');
  assert(isTabPermittedForRole('reg-corr-incoming', 'DEPUTY_REGISTRAR'), 'ROUTE', '3.3 Deputy Registrar ALLOWED reg-corr-incoming');
  assert(isTabPermittedForRole('inward-outward', 'DEPUTY_REGISTRAR'), 'ROUTE', '3.4 Deputy Registrar ALLOWED inward-outward');
  assert(isTabPermittedForRole('note-sheets', 'DEPUTY_REGISTRAR'), 'ROUTE', '3.5 Deputy Registrar ALLOWED note-sheets');

  // Non-authorized roles accessing Deputy Registrar/Registrar routes
  assert(!isTabPermittedForRole('reg-uni-institutes', 'STUDENT'), 'SECURITY', '3.6 Student DENIED reg-uni-institutes');
  assert(!isTabPermittedForRole('reg-corr-incoming', 'STUDENT'), 'SECURITY', '3.7 Student DENIED reg-corr-incoming');
  assert(!isTabPermittedForRole('note-sheets', 'STUDENT'), 'SECURITY', '3.8 Student DENIED note-sheets');
  assert(!isTabPermittedForRole('reg-uni-institutes', 'FACULTY'), 'SECURITY', '3.9 Faculty DENIED reg-uni-institutes');
  assert(!isTabPermittedForRole('reg-corr-incoming', 'FACULTY'), 'SECURITY', '3.10 Faculty DENIED reg-corr-incoming');
  assert(!isTabPermittedForRole('reg-uni-institutes', 'HOD'), 'SECURITY', '3.11 HOD DENIED reg-uni-institutes');

  // 4. NOTESHEET WORKFLOW & PENDING WITH ME
  console.log('\n--- 4. Notesheet Workflow & Pending With Me ---');
  const testNsId = `ns-dr-test-${Date.now()}`;
  const drTestNs: NoteSheet = {
    id: testNsId,
    noteSheetNumber: `SSIU-NOTESHEET-TEST-${Date.now().toString().slice(-4)}`,
    subject: 'University Statutory Audit Concurrence',
    department: 'Computer Engineering',
    category: 'ADMINISTRATIVE',
    priority: 'HIGH',
    creatorId: 'usr-reg',
    creatorName: 'Registrar',
    creatorRole: 'REGISTRAR',
    contactNumber: '9999999999',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    date: new Date().toISOString(),
    requiredDate: '2026-09-01',
    status: 'SUBMITTED',
    currentOffice: 'DEPUTY_REGISTRAR',
    budgetRequired: false,
    estimatedCost: 0,
    proposal: 'Proposal for administrative concurrence.',
    purposeJustification: 'Statutory compliance verification.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movements: [
      {
        id: `m-dr-1`,
        noteSheetId: testNsId,
        fromUser: 'Registrar (REGISTRAR)',
        toUser: 'Pending Approval - DEPUTY_REGISTRAR',
        action: 'FORWARD',
        remarks: 'Forwarded to Deputy Registrar for scrutiny.',
        timestamp: new Date().toISOString()
      }
    ],
    attachments: [],
    items: []
  };

  const allNotes = db.getNoteSheets();
  allNotes.unshift(drTestNs);
  db.saveState();

  const pendingForDR = db.getPendingWithMeNotesheets(deputyRegistrar, 'DEPUTY_REGISTRAR');
  const foundInPending = pendingForDR.some(n => n.id === testNsId);
  assert(foundInPending, 'NOTESHEET', '4.1 Notesheet assigned to DEPUTY_REGISTRAR appears in Pending With Me');

  // Workflow forward to Registrar
  drTestNs.movements.push({
    id: `m-dr-2`,
    noteSheetId: testNsId,
    fromUser: 'Deputy Registrar (DEPUTY_REGISTRAR)',
    toUser: 'Pending Approval - REGISTRAR',
    action: 'FORWARD',
    remarks: 'Scrutinized and verified. Forwarded to Registrar.',
    timestamp: new Date().toISOString()
  });
  drTestNs.currentOffice = 'REGISTRAR';
  db.saveState();

  const pendingAfterForward = db.getPendingWithMeNotesheets(deputyRegistrar, 'DEPUTY_REGISTRAR');
  const noLongerInDRPending = !pendingAfterForward.some(n => n.id === testNsId);
  assert(noLongerInDRPending, 'NOTESHEET', '4.2 Forwarded Notesheet cleared from Deputy Registrar Pending With Me');

  // Clean up test notesheet
  db.saveState({ ...db.getRawState(), noteSheets: db.getNoteSheets().filter(n => n.id !== testNsId) });

  // 5. DEPUTY REGISTRAR SCOPE ASSIGNMENT & JURISDICTIONAL ENFORCEMENT
  console.log('\n--- 5. Deputy Registrar Scope Assignment & Delegation ---');
  
  // 5.1 Initial seed scope
  const initialScopes = db.getDeputyRegistrarScopeByUserId(deputyRegistrar!.id);
  assert(initialScopes.length > 0, 'SCOPE', '5.1 Initial seed scope exists for Deputy Registrar');
  assert(initialScopes[0].instituteId === 'inst-1', 'SCOPE', '5.2 Scope assigned to Institute inst-1 (SIT)');
  assert(initialScopes[0].departmentIds.includes('dept-1'), 'SCOPE', '5.3 Scope includes dept-1 (Computer Engineering)');
  assert(initialScopes[0].departmentIds.includes('dept-2'), 'SCOPE', '5.4 Scope includes dept-2 (Mechanical Engineering)');

  // 5.2 Scoped Students Filtering
  console.log('\n--- 6. Scoped Entity Querying & Data Isolation ---');
  const scopedStudents = db.getScopedStudents(deputyRegistrar, 'DEPUTY_REGISTRAR');
  const allStudents = db.getStudents();
  assert(scopedStudents.length > 0, 'DATA_SCOPE', '6.1 Deputy Registrar retrieves scoped students');
  const onlyAssignedDepts = scopedStudents.every(s => s.instituteId === 'inst-1' && (s.departmentId === 'dept-1' || s.departmentId === 'dept-2'));
  assert(onlyAssignedDepts, 'DATA_SCOPE', '6.2 All scoped students belong strictly to assigned institute & departments');

  // 5.3 Scoped Faculty Filtering
  const scopedFaculty = db.getScopedFaculty(deputyRegistrar, 'DEPUTY_REGISTRAR');
  assert(scopedFaculty.length > 0, 'DATA_SCOPE', '6.3 Deputy Registrar retrieves scoped faculty');
  const onlyAssignedFacDepts = scopedFaculty.every(f => f.instituteId === 'inst-1' && (f.departmentId === 'dept-1' || f.departmentId === 'dept-2'));
  assert(onlyAssignedFacDepts, 'DATA_SCOPE', '6.4 All scoped faculty belong strictly to assigned institute & departments');

  // 5.4 Backend Scope Access Verification & 403 Forbidden Enforcement
  console.log('\n--- 7. Scope Verification & 403 Forbidden Enforcement ---');
  const allowedCheck = verifyScopeAccess(deputyRegistrar || null, 'DEPUTY_REGISTRAR', { instituteId: 'inst-1', departmentId: 'dept-1' });
  assert(allowedCheck.allowed, 'SECURITY', '7.1 Access ALLOWED for assigned Department dept-1 in Institute inst-1');

  const unassignedDeptCheck = verifyScopeAccess(deputyRegistrar || null, 'DEPUTY_REGISTRAR', { instituteId: 'inst-1', departmentId: 'dept-3' });
  assert(!unassignedDeptCheck.allowed, 'SECURITY', '7.2 Access DENIED (403) for unassigned Department dept-3 (Electrical Engineering)');
  assert(Boolean(unassignedDeptCheck.reason?.includes('403 Forbidden')), 'SECURITY', '7.3 Reason contains 403 Forbidden explanation');

  const foreignInstCheck = verifyScopeAccess(deputyRegistrar || null, 'DEPUTY_REGISTRAR', { instituteId: 'inst-2', departmentId: 'dept-pharmacy' });
  assert(!foreignInstCheck.allowed, 'SECURITY', '7.4 Access DENIED (403) for unassigned Institute inst-2');

  // 5.5 Multi-Institute & Multi-Department Dynamic Assignment by Registrar
  console.log('\n--- 8. Dynamic Multi-Scope Assignment & Registrar Delegation ---');
  const registrarUser = registrar as User;
  
  // Assign cross-institute scope (e.g. Institute 2, Pharmacy)
  const crossInstScope = db.assignDeputyRegistrarScope({
    userId: deputyRegistrar!.id,
    instituteId: 'inst-2',
    departmentIds: ['dept-pharmacy'],
    assignedByUser: registrarUser
  });
  assert(crossInstScope.instituteId === 'inst-2', 'DELEGATION', '8.1 Successfully assigned second institute scope');
  assert(crossInstScope.departmentIds.includes('dept-pharmacy'), 'DELEGATION', '8.2 Second institute scope includes dept-pharmacy');

  // Next API request immediately reflects updated multi-institute scope
  const updatedScopes = db.getDeputyRegistrarScopeByUserId(deputyRegistrar!.id);
  assert(updatedScopes.length === 2, 'DELEGATION', '8.3 Deputy Registrar now has 2 active jurisdictional institute scopes');

  const newScopeCheck = verifyScopeAccess(deputyRegistrar || null, 'DEPUTY_REGISTRAR', { instituteId: 'inst-2', departmentId: 'dept-pharmacy' });
  assert(newScopeCheck.allowed, 'DELEGATION', '8.4 Access now immediately ALLOWED for newly delegated institute & department');

  // 5.6 Scope Audit Logging
  console.log('\n--- 9. Scope Assignment Audit Trail ---');
  const auditLogs = db.getDeputyRegistrarScopeAuditLogs(deputyRegistrar!.id);
  assert(auditLogs.length > 0, 'AUDIT', '9.1 Scope audit logs recorded');
  const latestAudit = auditLogs[0];
  assert(latestAudit.action === 'ASSIGNED' || latestAudit.action === 'UPDATED', 'AUDIT', '9.2 Latest audit action is ASSIGNED/UPDATED');
  assert(latestAudit.assignedByUserId === registrarUser.id, 'AUDIT', '9.3 Audit log records assigning Registrar user ID');
  assert(Boolean(latestAudit.timestamp), 'AUDIT', '9.4 Audit log contains precise ISO timestamp');

  // 5.7 Dynamic Department Removal
  console.log('\n--- 10. Department Removal & Scope Revocation ---');
  db.removeDepartmentFromDeputyRegistrarScope(crossInstScope.id, 'dept-pharmacy', registrarUser);
  const checkAfterDeptRemove = verifyScopeAccess(deputyRegistrar || null, 'DEPUTY_REGISTRAR', { instituteId: 'inst-2', departmentId: 'dept-pharmacy' });
  assert(!checkAfterDeptRemove.allowed, 'REVOCATION', '10.1 Access immediately DENIED after department removal from scope');

  // Remove full scope
  db.removeDeputyRegistrarScope(crossInstScope.id, registrarUser);
  const remainingScopes = db.getDeputyRegistrarScopeByUserId(deputyRegistrar!.id);
  assert(remainingScopes.length === 1, 'REVOCATION', '10.2 Second institute scope cleanly removed');

  // 5.8 Security Rule: Deputy Registrar CANNOT assign or modify their own scope
  console.log('\n--- 11. Self-Assignment Prevention Security Guard ---');
  let selfAssignBlocked = false;
  try {
    db.assignDeputyRegistrarScope({
      userId: deputyRegistrar!.id,
      instituteId: 'inst-3',
      departmentIds: ['dept-unauthorized'],
      assignedByUser: deputyRegistrar as User // Attempting self-assignment!
    });
  } catch (err: any) {
    selfAssignBlocked = err.message.includes('403 Forbidden');
  }
  assert(selfAssignBlocked, 'SECURITY_GUARD', '11.1 Deputy Registrar self-scope assignment STRICTLY BLOCKED with 403');

  // 5.9 Notesheet Departmental Scoping
  console.log('\n--- 12. Notesheet Departmental Scope Validation ---');
  const nsInScope: NoteSheet = {
    id: 'ns-in-scope',
    noteSheetNumber: 'NS-SCOPE-001',
    subject: 'Lab Equipment Purchase',
    department: 'Computer Engineering',
    category: 'ACADEMIC',
    priority: 'NORMAL',
    creatorId: 'usr-fac-1',
    creatorName: 'Prof. Fac',
    creatorRole: 'FACULTY',
    contactNumber: '9999999999',
    instituteId: 'inst-1',
    departmentId: 'dept-1', // In scope
    date: new Date().toISOString(),
    requiredDate: '2026-09-01',
    status: 'UNDER_REVIEW',
    currentOffice: 'HOD',
    budgetRequired: false,
    estimatedCost: 0,
    proposal: 'Lab procurement',
    purposeJustification: 'Hardware upgrade',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movements: [],
    attachments: [],
    items: []
  };

  const nsOutOfScope: NoteSheet = {
    id: 'ns-out-scope',
    noteSheetNumber: 'NS-SCOPE-002',
    subject: 'Chemical Reagent Order',
    department: 'Pharmacy',
    category: 'ACADEMIC',
    priority: 'NORMAL',
    creatorId: 'usr-fac-pharma',
    creatorName: 'Prof. Pharma',
    creatorRole: 'FACULTY',
    contactNumber: '9999999999',
    instituteId: 'inst-2', // Out of scope
    departmentId: 'dept-pharmacy',
    date: new Date().toISOString(),
    requiredDate: '2026-09-01',
    status: 'UNDER_REVIEW',
    currentOffice: 'HOD',
    budgetRequired: false,
    estimatedCost: 0,
    proposal: 'Reagent procurement',
    purposeJustification: 'Pharma lab upgrade',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movements: [],
    attachments: [],
    items: []
  };

  db.saveState({
    ...db.getRawState(),
    noteSheets: [nsInScope, nsOutOfScope, ...db.getNoteSheets()]
  });

  const scopedNotes = db.getScopedNoteSheets(deputyRegistrar, 'DEPUTY_REGISTRAR');
  const inScopeFound = scopedNotes.some(n => n.id === 'ns-in-scope');
  const outScopeFound = scopedNotes.some(n => n.id === 'ns-out-scope');
  assert(inScopeFound, 'NOTESHEET_SCOPE', '12.1 Notesheet from assigned department is VISIBLE in scoped notesheets');
  assert(!outScopeFound, 'NOTESHEET_SCOPE', '12.2 Notesheet from unassigned department/institute is ISOLATED & HIDDEN');

  console.log(`\n========================================================================`);
  console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log(`========================================================================\n`);

  if (totalFailed > 0) {
    throw new Error(`Deputy Registrar test suite failed with ${totalFailed} errors.`);
  }
}

runDeputyRegistrarSecuritySuite().catch(console.error);


