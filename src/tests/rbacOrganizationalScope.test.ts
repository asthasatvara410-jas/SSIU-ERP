declare const process: any;

import { db } from '../services/db';
import {
  hasPermission,
  verifyScopeAccess,
  filterRecordsByScope,
  enforceApiSecurity
} from '../services/securityService';
import { User, Student } from '../types';

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

export async function runRbacOrganizationalScopeTests(): Promise<void> {
  console.log('\n======================================================');
  console.log('RUNNING RBAC & ORGANIZATIONAL SCOPE VERIFICATION TESTS');
  console.log('======================================================\n');

  db.resetToDefaultSeed();

  const hodCseUser: User = {
    id: 'user-hod-cse',
    name: 'Dr. CSE HOD',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1', // SIT
    departmentId: 'dept-1', // Computer Engineering
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

  const studentUser: User = {
    id: 'user-stu-10',
    name: 'Aarav Patel',
    email: 'aarav@swarrnim.edu.in',
    role: 'STUDENT',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    enrollmentNo: '240101010',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // ─── 1. HOD COMPUTER ENGINEERING SCOPE ─────────────────────────────────────
  console.log('\n--- 1. HOD Department-Level Scope ---');
  
  // 1.1 Own Department (CSE)
  const hodOwnDeptCheck = verifyScopeAccess(hodCseUser, 'HOD', {
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  });
  assert(hodOwnDeptCheck.allowed === true, '1.1 HOD can access own department (Computer Engineering)');

  // 1.2 Foreign Department (Pharmacy)
  const hodForeignDeptCheck = verifyScopeAccess(hodCseUser, 'HOD', {
    instituteId: 'inst-1',
    departmentId: 'dept-pharmacy'
  });
  assert(hodForeignDeptCheck.allowed === false, '1.2 HOD cannot access foreign department (Pharmacy)');
  assert(Boolean(hodForeignDeptCheck.reason?.includes('403 Forbidden')), '1.3 HOD receives explicit 403 scope error');

  // 1.3 enforceApiSecurity throws ForbiddenError for foreign department
  let threwHOD = false;
  try {
    enforceApiSecurity(hodCseUser, 'HOD', 'STUDENT_EDIT', { departmentId: 'dept-pharmacy' });
  } catch (err: any) {
    threwHOD = err.statusCode === 403;
  }
  assert(threwHOD, '1.4 enforceApiSecurity throws 403 on HOD cross-department violation');

  // ─── 2. HOI / PRINCIPAL SIT INSTITUTE SCOPE ────────────────────────────────
  console.log('\n--- 2. Principal Institute-Level Scope ---');

  // 2.1 Own Institute (SIT)
  const princiOwnInstCheck = verifyScopeAccess(principalSitUser, 'PRINCIPAL', {
    instituteId: 'inst-1'
  });
  assert(princiOwnInstCheck.allowed === true, '2.1 Principal can access own institute (SIT)');

  // 2.2 Foreign Institute (SAL)
  const princiForeignInstCheck = verifyScopeAccess(principalSitUser, 'PRINCIPAL', {
    instituteId: 'inst-sal'
  });
  assert(princiForeignInstCheck.allowed === false, '2.2 Principal cannot access another institute (SAL)');
  assert(Boolean(princiForeignInstCheck.reason?.includes('403 Forbidden')), '2.3 Principal receives explicit 403 scope error');

  // 2.3 enforceApiSecurity throws ForbiddenError for foreign institute
  let threwPrincipal = false;
  try {
    enforceApiSecurity(principalSitUser, 'PRINCIPAL', 'FACULTY_EDIT', { instituteId: 'inst-sal' });
  } catch (err: any) {
    threwPrincipal = err.statusCode === 403;
  }
  assert(threwPrincipal, '2.4 enforceApiSecurity throws 403 on Principal cross-institute violation');

  // ─── 3. REGISTRAR UNIVERSITY SCOPE ─────────────────────────────────────────
  console.log('\n--- 3. Registrar University-Level Scope ---');

  const regCheckSIT = verifyScopeAccess(registrarUser, 'REGISTRAR', { instituteId: 'inst-1', departmentId: 'dept-1' });
  const regCheckSAL = verifyScopeAccess(registrarUser, 'REGISTRAR', { instituteId: 'inst-sal', departmentId: 'dept-pharmacy' });
  assert(regCheckSIT.allowed && regCheckSAL.allowed, '3.1 Registrar has authorized university-wide access across all institutes and departments');

  assert(hasPermission(registrarUser, 'REGISTRAR', 'STUDENT_VIEW'), '3.2 Registrar has STUDENT_VIEW');
  assert(hasPermission(registrarUser, 'REGISTRAR', 'FACULTY_VIEW'), '3.3 Registrar has FACULTY_VIEW');
  assert(hasPermission(registrarUser, 'REGISTRAR', 'INSTITUTE_MANAGE'), '3.4 Registrar has INSTITUTE_MANAGE');

  // ─── 4. STUDENT ACCESS RESTRICTIONS ────────────────────────────────────────
  console.log('\n--- 4. Student Access & Isolation ---');

  // 4.1 Admin APIs blocked
  assert(!hasPermission(studentUser, 'STUDENT', 'STUDENT_CREATE'), '4.1 Student blocked from STUDENT_CREATE');
  assert(!hasPermission(studentUser, 'STUDENT', 'FACULTY_EDIT'), '4.2 Student blocked from FACULTY_EDIT');
  assert(!hasPermission(studentUser, 'STUDENT', 'SETTINGS_MANAGE'), '4.3 Student blocked from SETTINGS_MANAGE');

  let threwStudentAdmin = false;
  try {
    enforceApiSecurity(studentUser, 'STUDENT', 'STUDENT_CREATE');
  } catch (err: any) {
    threwStudentAdmin = err.statusCode === 403;
  }
  assert(threwStudentAdmin, '4.4 Student calling admin API throws 403 Forbidden');

  // 4.2 Student Own vs Other Profile
  const stuOwnCheck = verifyScopeAccess(studentUser, 'STUDENT', { studentId: 'user-stu-10' });
  const stuOtherCheck = verifyScopeAccess(studentUser, 'STUDENT', { studentId: 'user-stu-99' });
  assert(stuOwnCheck.allowed === true, '4.5 Student permitted to access own record');
  assert(stuOtherCheck.allowed === false, '4.6 Student forbidden from accessing another student record');

  // ─── 5. GENERIC COLLECTION SCOPE FILTERING ─────────────────────────────────
  console.log('\n--- 5. Generic Scope Collection Filtering ---');

  const mixedDataset = [
    { id: '1', name: 'CSE Item', instituteId: 'inst-1', departmentId: 'dept-1' },
    { id: '2', name: 'MECH Item', instituteId: 'inst-1', departmentId: 'dept-mech' },
    { id: '3', name: 'SAL Pharmacy Item', instituteId: 'inst-sal', departmentId: 'dept-pharmacy' }
  ];

  const hodFiltered = filterRecordsByScope(mixedDataset, hodCseUser, 'HOD');
  assert(hodFiltered.length === 1 && hodFiltered[0].id === '1', '5.1 HOD collection filter strictly returns own department records');

  const princiFiltered = filterRecordsByScope(mixedDataset, principalSitUser, 'PRINCIPAL');
  assert(princiFiltered.length === 2 && !princiFiltered.some(r => r.instituteId === 'inst-sal'), '5.2 Principal collection filter strictly returns own institute records');

  const regFiltered = filterRecordsByScope(mixedDataset, registrarUser, 'REGISTRAR');
  assert(regFiltered.length === 3, '5.3 Registrar collection filter returns full university dataset');

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
}

if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runRbacOrganizationalScopeTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}
