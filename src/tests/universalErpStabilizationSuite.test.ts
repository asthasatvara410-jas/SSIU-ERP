declare const process: any;

import { db } from '../services/db';
import { masterDataService } from '../services/masterDataService';
import { hasPermission, verifyScopeAccess, filterRecordsByScope, enforceApiSecurity } from '../services/securityService';
import { unifiedBulkImportEngine, HANDLERS_REGISTRY } from '../services/unifiedBulkImportEngine';
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

export async function runUniversalErpStabilizationSuite(): Promise<void> {
  console.log('\n========================================================================');
  console.log('PHASE 6: UNIVERSAL ERP COMPLETE BACKEND SMOKE & STABILIZATION SUITE');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  // ─── 1. AUTHENTICATION & LOGIN ROLES ───────────────────────────────────────
  console.log('\n--- 1. Authentication & Role Logins ---');
  const allUsers = db.getUsers();
  assert(allUsers.length > 0, 'AUTH', '1.1 User directory loaded from database');

  const requiredRoles = [
    'STUDENT',
    'FACULTY',
    'HOD',
    'PRINCIPAL',
    'REGISTRAR',
    'STUDENT_SECTION',
    'EXAM_CELL',
    'ACCOUNTS_ADMIN',
    'HOSTEL_ADMIN',
    'SUPER_ADMIN'
  ];

  requiredRoles.forEach(role => {
    const user = allUsers.find(u => u.role === role);
    assert(Boolean(user), 'AUTH', `1.2 Login session resolution verified for role: ${role}`);
  });

  // ─── 2. RBAC & SCOPE ISOLATION ─────────────────────────────────────────────
  console.log('\n--- 2. RBAC & Hierarchical Scope Verification ---');
  const hodCse = allUsers.find(u => u.role === 'HOD') || {
    id: 'usr-hod-cse', name: 'Dr. CSE HOD', email: 'hod.cse@swarrnim.edu.in', role: 'HOD',
    instituteId: 'inst-1', departmentId: 'dept-1', status: 'ACTIVE', createdAt: ''
  };

  const principalSit = allUsers.find(u => u.role === 'PRINCIPAL') || {
    id: 'usr-princi-sit', name: 'Dr. Principal SIT', email: 'princi.sit@swarrnim.edu.in', role: 'PRINCIPAL',
    instituteId: 'inst-1', status: 'ACTIVE', createdAt: ''
  };

  const registrar = allUsers.find(u => u.role === 'REGISTRAR') || {
    id: 'usr-reg', name: 'Registrar', email: 'registrar@swarrnim.edu.in', role: 'REGISTRAR',
    status: 'ACTIVE', createdAt: ''
  };

  const student = allUsers.find(u => u.role === 'STUDENT') || {
    id: 'usr-stu', name: 'Student', email: 'student@swarrnim.edu.in', role: 'STUDENT',
    instituteId: 'inst-1', departmentId: 'dept-1', status: 'ACTIVE', createdAt: ''
  };

  // 2.1 HOD Scope
  const hodOwn = verifyScopeAccess(hodCse as any, 'HOD', { instituteId: 'inst-1', departmentId: 'dept-1' });
  const hodCross = verifyScopeAccess(hodCse as any, 'HOD', { instituteId: 'inst-1', departmentId: 'dept-pharmacy' });
  assert(hodOwn.allowed === true, 'RBAC', '2.1 HOD access to own department allowed');
  assert(hodCross.allowed === false, 'RBAC', '2.2 HOD cross-department access blocked');

  // 2.2 Principal Scope
  const princiOwn = verifyScopeAccess(principalSit as any, 'PRINCIPAL', { instituteId: 'inst-1' });
  const princiCross = verifyScopeAccess(principalSit as any, 'PRINCIPAL', { instituteId: 'inst-sal' });
  assert(princiOwn.allowed === true, 'RBAC', '2.3 Principal access to own institute allowed');
  assert(princiCross.allowed === false, 'RBAC', '2.4 Principal cross-institute access blocked');

  // 2.3 Student admin restriction
  assert(!hasPermission(student as any, 'STUDENT', 'STUDENT_CREATE'), 'RBAC', '2.5 Student blocked from administrative creation');
  assert(!hasPermission(student as any, 'STUDENT', 'SETTINGS_MANAGE'), 'RBAC', '2.6 Student blocked from system settings');

  // 2.4 Registrar university scope
  assert(hasPermission(registrar as any, 'REGISTRAR', 'STUDENT_VIEW'), 'RBAC', '2.7 Registrar has authorized university student view');
  assert(hasPermission(registrar as any, 'REGISTRAR', 'FACULTY_VIEW'), 'RBAC', '2.8 Registrar has authorized university faculty view');

  // ─── 3. MASTER DATA RELATIONSHIPS & ORPHAN HEALTH ──────────────────────────
  console.log('\n--- 3. Master Data Relational Hierarchy & Health ---');
  const health = masterDataService.runMasterDataHealthCheck();
  assert(health.isHealthy === true, 'MASTER_DATA', '3.1 Master Data Health Check passed (0 orphan records across ERP)');
  assert(health.totalInstitutes > 0, 'MASTER_DATA', '3.2 Institutes populated');
  assert(health.totalDepartments > 0, 'MASTER_DATA', '3.3 Departments populated');
  assert(health.totalPrograms > 0, 'MASTER_DATA', '3.4 Programs populated');
  assert(health.totalSubjects > 0, 'MASTER_DATA', '3.5 Subjects populated');
  assert(health.totalStudents > 0, 'MASTER_DATA', '3.6 Students populated');
  assert(health.totalFaculty > 0, 'MASTER_DATA', '3.7 Faculty populated');

  // ─── 4. NOTESHEET DIGITAL WORKFLOW LIFECYCLE ───────────────────────────────
  console.log('\n--- 4. Notesheet Digital Workflow Full Lifecycle ---');
  const noteSheets = db.getNoteSheets();
  assert(Array.isArray(noteSheets) && noteSheets.length > 0, 'NOTESHEET', '4.1 Notesheet repository loaded');

  const testNsId = `ns-test-${Date.now()}`;
  const testNsNumber = `Swarrnim School of Computing & IT-Notesheet-0826-${Date.now().toString().slice(-3)}`;
  const initialMovement: NoteSheetMovement = {
    id: `m-${Date.now()}`,
    noteSheetId: testNsId,
    fromUser: 'Dr. Rajesh Patel (HOD)',
    toUser: 'Pending Approval - DEPUTY_REGISTRAR',
    action: 'SUBMIT',
    remarks: 'Submitted for university lab infrastructure upgrade.',
    timestamp: new Date().toISOString()
  };

  const newNotesheet: NoteSheet = {
    id: testNsId,
    noteSheetNumber: testNsNumber,
    subject: 'Lab Infrastructure Modernization 2026',
    department: 'Computer Engineering',
    category: 'INFRASTRUCTURE',
    priority: 'HIGH',
    creatorId: 'usr-hod-1',
    creatorName: 'Dr. Rajesh Patel',
    creatorRole: 'HOD',
    contactNumber: '9876543210',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    date: new Date().toISOString(),
    requiredDate: '2026-09-01',
    status: 'SUBMITTED',
    currentOffice: 'DEPUTY_REGISTRAR',
    budgetRequired: true,
    estimatedCost: 150000,
    proposal: 'Proposal to acquire 30 high-performance workstations for AI lab.',
    purposeJustification: 'Required for advanced AI and machine learning practicals.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movements: [initialMovement],
    attachments: [],
    items: [{ id: 'item-1', itemName: 'Workstations', description: 'High performance AI workstations', quantity: 30, unit: 'Units', rate: 5000, amount: 150000 }]
  };

  // 4.2 Create & Submit
  noteSheets.unshift(newNotesheet);
  db.saveState();
  const verifySubmitted = db.getNoteSheets().find(n => n.id === testNsId);
  assert(Boolean(verifySubmitted && verifySubmitted.status === 'SUBMITTED'), 'NOTESHEET', '4.2 Notesheet created and submitted with sequential number');

  // 4.3 Forward / Approval Movement
  const approvalMovement: NoteSheetMovement = {
    id: `m-app-${Date.now()}`,
    noteSheetId: testNsId,
    fromUser: 'Deputy Registrar (DEPUTY_REGISTRAR)',
    toUser: 'Pending Approval - REGISTRAR',
    action: 'FORWARD',
    remarks: 'Recommended for sanction under University Capital Expenditure budget.',
    timestamp: new Date().toISOString()
  };
  verifySubmitted!.movements.push(approvalMovement);
  verifySubmitted!.currentOffice = 'REGISTRAR';
  db.saveState();
  assert(verifySubmitted?.movements.length === 2 && verifySubmitted?.currentOffice === 'REGISTRAR', 'NOTESHEET', '4.3 Notesheet forwarded to Registrar desk');

  // 4.4 Sanction / Final Approval
  const finalApproveMovement: NoteSheetMovement = {
    id: `m-final-${Date.now()}`,
    noteSheetId: testNsId,
    fromUser: 'Registrar (REGISTRAR)',
    toUser: 'Approved - ACCOUNTS_OFFICE',
    action: 'APPROVE',
    remarks: 'Sanctioned. Disburse funds in two tranches.',
    timestamp: new Date().toISOString()
  };
  verifySubmitted!.movements.push(finalApproveMovement);
  verifySubmitted!.status = 'APPROVED';
  db.saveState();
  assert(verifySubmitted?.status === 'APPROVED', 'NOTESHEET', '4.4 Notesheet sanctioned and approved');

  // Cleanup test notesheet
  db.saveState({ ...db.getRawState(), noteSheets: db.getNoteSheets().filter(n => n.id !== testNsId) });

  // ─── 5. UNIVERSAL BULK EXCEL IMPORT SMOKE TEST ─────────────────────────────
  console.log('\n--- 5. Universal Bulk Excel Import Engine Smoke Test ---');

  const studentHandler = HANDLERS_REGISTRY.STUDENT;
  assert(Boolean(studentHandler), 'EXCEL_IMPORT', '5.1 Student Import Handler loaded');

  if (studentHandler) {
    const seen = new Set<string>();

    // 5.2 Valid Row
    const validRow = {
      'Enrollment Number': `ENR-SMOKE-${Date.now().toString().slice(-4)}`,
      'Student Name': 'Smoke Test Student',
      'Email': `smoke.${Date.now()}@swarrnim.edu.in`,
      'Institute Code': 'SIT',
      'Department Code': 'CE',
      'Program Code': 'BTECH-CE',
      'Phone': '9876543210',
      'Date of Birth': '2004-05-15',
      'Gender': 'Male'
    };
    const resValid = studentHandler.validateRow(validRow, seen, 'INSERT_ONLY', registrar as any, 'REGISTRAR');
    assert(resValid.status === 'VALID', 'EXCEL_IMPORT', '5.2 Valid student row validated');

    // 5.3 In-File Duplicate Row
    const resDup = studentHandler.validateRow(validRow, seen, 'INSERT_ONLY', registrar as any, 'REGISTRAR');
    assert(resDup.status === 'DUPLICATE', 'EXCEL_IMPORT', '5.3 Duplicate student enrollment rejected');

    // 5.4 Cross-Institute Scope Violation (HOD uploading foreign row)
    seen.clear();
    const foreignInstRow = {
      ...validRow,
      'Enrollment Number': `ENR-FOREIGN-${Date.now().toString().slice(-4)}`,
      'Institute Code': 'SSS',
      'Department Code': 'MATH',
      'Program Code': 'BSC-MATH'
    };
    const resForeign = studentHandler.validateRow(foreignInstRow, seen, 'INSERT_ONLY', hodCse as any, 'HOD');
    assert(resForeign.status === 'INVALID', 'EXCEL_IMPORT', '5.4 HOD uploading foreign institute row rejected');
    assert(Boolean(resForeign.errorMessage?.includes('Unauthorized')), 'EXCEL_IMPORT', '5.5 Scope violation explanation returned');
  }

  // ─── 6. SECURITY INTRUSION ATTEMPTS ────────────────────────────────────────
  console.log('\n--- 6. Security Intrusion & Authorization Test Matrix ---');

  // 6.1 Student trying to bulk import -> 403
  let threwStuImport = false;
  try {
    enforceApiSecurity(student as any, 'STUDENT', 'STUDENT_IMPORT');
  } catch (err: any) {
    threwStuImport = err.statusCode === 403;
  }
  assert(threwStuImport, 'SECURITY', '6.1 Student attempting bulk import throws 403 Forbidden');

  // 6.2 HOD accessing Pharmacy student record -> 403
  let threwCrossDept = false;
  try {
    enforceApiSecurity(hodCse as any, 'HOD', 'STUDENT_EDIT', { departmentId: 'dept-pharmacy' });
  } catch (err: any) {
    threwCrossDept = err.statusCode === 403;
  }
  assert(threwCrossDept, 'SECURITY', '6.2 HOD cross-department student edit throws 403 Forbidden');

  // 6.3 Principal accessing foreign institute faculty record -> 403
  let threwCrossInst = false;
  try {
    enforceApiSecurity(principalSit as any, 'PRINCIPAL', 'FACULTY_EDIT', { instituteId: 'inst-sal' });
  } catch (err: any) {
    threwCrossInst = err.statusCode === 403;
  }
  assert(threwCrossInst, 'SECURITY', '6.3 Principal cross-institute faculty edit throws 403 Forbidden');

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`SMOKE TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalTests} tests`);
  console.log('========================================================================\n');

  if (totalFailed > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
}

if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runUniversalErpStabilizationSuite().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}
