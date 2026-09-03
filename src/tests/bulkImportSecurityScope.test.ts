declare const process: any;

import { canUserImportModule, unifiedBulkImportEngine } from '../services/unifiedBulkImportEngine';
import { db } from '../services/db';
import { User } from '../types';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    testsFailed++;
  }
}

export async function runBulkImportSecurityScopeTests(): Promise<void> {
  console.log('\n======================================================');
  console.log('RUNNING BULK IMPORT SECURITY & SCOPING TEST MATRIX');
  console.log('======================================================\n');

  db.resetToDefaultSeed();

  const studentUser: User = {
    id: 'user-stu-1',
    name: 'Aarav Sharma',
    email: 'aarav@swarrnim.edu.in',
    role: 'STUDENT',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const facultyUser: User = {
    id: 'user-fac-1',
    name: 'Prof. Regular Faculty',
    email: 'faculty@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodCseUser: User = {
    id: 'user-hod-cse',
    name: 'Dr. CSE HOD',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1', // SIT
    departmentId: 'dept-1', // CSE
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principalSitUser: User = {
    id: 'user-princi-sit',
    name: 'Dr. SIT Principal',
    email: 'principal.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1', // SIT
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const registrarUser: User = {
    id: 'user-reg-1',
    name: 'Registrar Officer',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const studentSectionUser: User = {
    id: 'user-stu-sec',
    name: 'Admission Officer',
    email: 'admission@swarrnim.edu.in',
    role: 'STUDENT_SECTION',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const examCellUser: User = {
    id: 'user-exam-1',
    name: 'Exam Controller',
    email: 'exam@swarrnim.edu.in',
    role: 'EXAM_CELL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const financeUser: User = {
    id: 'user-fin-1',
    name: 'Finance Officer',
    email: 'finance@swarrnim.edu.in',
    role: 'ACCOUNTS_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hostelAdminUser: User = {
    id: 'user-hostel-1',
    name: 'Chief Warden',
    email: 'warden@swarrnim.edu.in',
    role: 'HOSTEL_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // ─── 1. MODULE-LEVEL PERMISSION ENFORCEMENT ───────────────────────────────
  console.log('\n--- 1. Student Access Control ---');
  const stuRes = canUserImportModule('STUDENT', studentUser, 'STUDENT');
  assert(!stuRes.allowed, '1.1 Student blocked from Student Master bulk import');
  assert(Boolean(stuRes.reason && stuRes.reason.includes('403 Forbidden')), '1.2 Student receives explicit 403 reason');

  const stuFacRes = canUserImportModule('FACULTY', studentUser, 'STUDENT');
  assert(!stuFacRes.allowed, '1.3 Student blocked from Faculty Master bulk import');

  console.log('\n--- 2. Faculty Access Control ---');
  const facRes = canUserImportModule('FACULTY', facultyUser, 'FACULTY');
  assert(!facRes.allowed, '2.1 Regular Faculty without permission blocked from Faculty Master');

  console.log('\n--- 3. HOD Access Control ---');
  assert(canUserImportModule('FACULTY', hodCseUser, 'HOD').allowed, '3.1 HOD permitted for Faculty import');
  assert(canUserImportModule('STUDENT', hodCseUser, 'HOD').allowed, '3.2 HOD permitted for Student import');
  assert(canUserImportModule('SUBJECT', hodCseUser, 'HOD').allowed, '3.3 HOD permitted for Subject import');
  assert(canUserImportModule('INVENTORY_ASSET', hodCseUser, 'HOD').allowed, '3.4 HOD permitted for Inventory import');
  assert(!canUserImportModule('DEPARTMENT', hodCseUser, 'HOD').allowed, '3.5 HOD blocked from Department Master import');
  assert(!canUserImportModule('PROGRAM', hodCseUser, 'HOD').allowed, '3.6 HOD blocked from Program Master import');
  assert(!canUserImportModule('FEE_ASSIGNMENT', hodCseUser, 'HOD').allowed, '3.7 HOD blocked from Finance Fee import');

  console.log('\n--- 4. HOI / Principal Access Control ---');
  assert(canUserImportModule('FACULTY', principalSitUser, 'PRINCIPAL').allowed, '4.1 Principal permitted for Faculty import');
  assert(canUserImportModule('DEPARTMENT', principalSitUser, 'PRINCIPAL').allowed, '4.2 Principal permitted for Department import');
  assert(canUserImportModule('PROGRAM', principalSitUser, 'PRINCIPAL').allowed, '4.3 Principal permitted for Program import');
  assert(canUserImportModule('STUDENT', principalSitUser, 'PRINCIPAL').allowed, '4.4 Principal permitted for Student import');
  assert(!canUserImportModule('FEE_ASSIGNMENT', principalSitUser, 'PRINCIPAL').allowed, '4.5 Principal blocked from Fee import');

  console.log('\n--- 5. Specialized Administrative Offices ---');
  assert(canUserImportModule('STUDENT', studentSectionUser, 'STUDENT_SECTION').allowed, '5.1 Student Section permitted for Student import');
  assert(!canUserImportModule('FACULTY', studentSectionUser, 'STUDENT_SECTION').allowed, '5.2 Student Section blocked from Faculty import');

  assert(canUserImportModule('EXAM_FORM', examCellUser, 'EXAM_CELL').allowed, '5.3 Exam Cell permitted for Exam Form import');
  assert(canUserImportModule('SUBJECT', examCellUser, 'EXAM_CELL').allowed, '5.4 Exam Cell permitted for Subject import');
  assert(!canUserImportModule('HOSTEL_ROOM', examCellUser, 'EXAM_CELL').allowed, '5.5 Exam Cell blocked from Hostel import');

  assert(canUserImportModule('FEE_ASSIGNMENT', financeUser, 'ACCOUNTS_ADMIN').allowed, '5.6 Finance permitted for Fee import');
  assert(!canUserImportModule('FACULTY', financeUser, 'ACCOUNTS_ADMIN').allowed, '5.7 Finance blocked from Faculty import');

  assert(canUserImportModule('HOSTEL_ROOM', hostelAdminUser, 'HOSTEL_ADMIN').allowed, '5.8 Hostel Admin permitted for Hostel import');
  assert(!canUserImportModule('EXAM_FORM', hostelAdminUser, 'HOSTEL_ADMIN').allowed, '5.9 Hostel Admin blocked from Exam import');

  console.log('\n--- 6. Registrar University-Level Master Access ---');
  assert(canUserImportModule('STUDENT', registrarUser, 'REGISTRAR').allowed, '6.1 Registrar permitted for Student import');
  assert(canUserImportModule('FACULTY', registrarUser, 'REGISTRAR').allowed, '6.2 Registrar permitted for Faculty import');
  assert(canUserImportModule('DEPARTMENT', registrarUser, 'REGISTRAR').allowed, '6.3 Registrar permitted for Department import');
  assert(canUserImportModule('PROGRAM', registrarUser, 'REGISTRAR').allowed, '6.4 Registrar permitted for Program import');

  // ─── 7. ROW-LEVEL DEPARTMENT & INSTITUTE SCOPE ENFORCEMENT ────────────────
  console.log('\n--- 7. Row-Level Scope Validation ---');
  const facultyHandler = (unifiedBulkImportEngine as any)['HANDLERS_REGISTRY']?.FACULTY;
  if (facultyHandler) {
    const seenKeys = new Set<string>();

    // CSE Faculty for CSE HOD (Allowed)
    const validCseRow = {
      'Employee ID': 'EMP-TEST-SCOPE-1',
      'Faculty Name': 'Prof. Authorized CSE',
      'Email': 'auth.cse@swarrnim.edu.in',
      'Institute Code': 'SIT',
      'Department Code': 'CSE'
    };
    const res1 = facultyHandler.validateRow(validCseRow, seenKeys, 'INSERT_ONLY', hodCseUser, 'HOD');
    assert(res1.status === 'VALID', '7.1 HOD successfully validates own department row');

    // MECH Faculty for CSE HOD (Unauthorized)
    const invalidDeptRow = {
      'Employee ID': 'EMP-TEST-SCOPE-2',
      'Faculty Name': 'Prof. Foreign MECH',
      'Email': 'foreign.mech@swarrnim.edu.in',
      'Institute Code': 'SIT',
      'Department Code': 'MECH'
    };
    const res2 = facultyHandler.validateRow(invalidDeptRow, seenKeys, 'INSERT_ONLY', hodCseUser, 'HOD');
    assert(res2.status === 'INVALID', '7.2 HOD row validation rejects foreign department row');
    assert(Boolean(res2.errorMessage && res2.errorMessage.includes('Unauthorized')), '7.3 Scope violation message returned');

    // SAL Institute Faculty for SIT Principal (Unauthorized)
    const foreignInstRow = {
      'Employee ID': 'EMP-TEST-SCOPE-3',
      'Faculty Name': 'Prof. Foreign SAL',
      'Email': 'foreign.sal@swarrnim.edu.in',
      'Institute Code': 'SAL',
      'Department Code': 'CSE'
    };
    const res3 = facultyHandler.validateRow(foreignInstRow, seenKeys, 'INSERT_ONLY', principalSitUser, 'PRINCIPAL');
    assert(res3.status === 'INVALID', '7.4 Principal row validation rejects foreign institute row');
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
}

if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runBulkImportSecurityScopeTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}
