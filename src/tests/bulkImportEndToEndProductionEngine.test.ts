import * as XLSX from 'xlsx';
import { db } from '../services/db';

declare const process: any;

console.log('========================================================================');
console.log('STARTING REAL PRODUCTION-GRADE BULK IMPORT ENGINE E2E STRESS TEST SUITE');
console.log('========================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✕ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// Test Admin & Student Mock Contexts
// -----------------------------------------------------------------------------
const superAdminUser = {
  id: 'admin-super-001',
  name: 'Registrar & Super Admin',
  role: 'SUPER_ADMIN',
  email: 'registrar@swarrnim.edu.in',
};

const hodUser = {
  id: 'hod-cse-001',
  name: 'Head of Department (CSE)',
  role: 'HOD',
  departmentId: 'DEP-CSE',
  instituteId: 'INST-ENG',
  email: 'hod.cse@swarrnim.edu.in',
};

const studentUser = {
  id: 'student-001',
  name: 'Rajesh Scholar',
  role: 'STUDENT',
  email: 'rajesh@swarrnim.edu.in',
};

// -----------------------------------------------------------------------------
// 1. Template Generation & Structure Verification
// -----------------------------------------------------------------------------
console.log('--- Stage 1: Template Generation & Structure Verification ---');
const templates = db.getBulkImportTemplates(superAdminUser);
assert(templates.length >= 10, '1.1 Super Admin retrieves all universal import templates (10+ modules)');

const studentTpl = templates.find(t => t.type === 'STUDENT');
assert(!!studentTpl, '1.2 Student Master template exists');
assert(studentTpl!.headers.includes('Enrollment Number'), '1.3 Student template contains "Enrollment Number"');
assert(studentTpl!.headers.includes('Student Name'), '1.4 Student template contains "Student Name"');
assert(studentTpl!.headers.includes('Institute Code'), '1.5 Student template contains "Institute Code"');
assert(studentTpl!.headers.includes('Department Code'), '1.6 Student template contains "Department Code"');

// -----------------------------------------------------------------------------
// 2. RBAC & Security Boundaries Enforcement
// -----------------------------------------------------------------------------
console.log('\n--- Stage 2: RBAC & Security Authorization Scopes ---');
const studentTemplates = db.getBulkImportTemplates(studentUser);
assert(studentTemplates.length === 0, '2.1 Student user receives 0 authorized import templates');

const hodTemplates = db.getBulkImportTemplates(hodUser);
assert(hodTemplates.some(t => t.type === 'STUDENT'), '2.2 HOD authorized to import Students');
assert(hodTemplates.some(t => t.type === 'FACULTY'), '2.3 HOD authorized to import Faculty');
assert(hodTemplates.some(t => t.type === 'SUBJECT'), '2.4 HOD authorized to import Subjects');
assert(!hodTemplates.some(t => t.type === 'FEE_ASSIGNMENT'), '2.5 HOD cannot import central Fee structures (Least Privilege)');

// -----------------------------------------------------------------------------
// 3. Security Sanitization (Formula / Macro Injection Protection)
// -----------------------------------------------------------------------------
console.log('\n--- Stage 3: Security & Formula Injection Sanitization ---');
const formulaRow = {
  'Enrollment Number': '=CMD|"/C calc"!A0',
  'Student Name': '@SUM(1+1)',
  'Email': '+malicious@swarrnim.edu.in',
  'Mobile': '9876543210',
  'Date of Birth (YYYY-MM-DD)': '2005-01-01',
  'Gender': 'MALE',
  'Institute Code': 'INST-ENG',
  'Department Code': 'DEP-CSE',
  'Program Code': 'PROG-BTECH-CSE',
  'Academic Year': '2026-27',
  'Semester (1-8)': 1,
  'Admission Year': 2026,
  'Student Type': 'REGULAR',
  'Nationality': 'INDIAN',
  'Passport Number': '',
  'Status': 'ACTIVE',
};

const formulaSession = db.uploadBulkImportFile({
  importType: 'STUDENT',
  fileName: 'Security_Formula_Test.xlsx',
  rows: [formulaRow],
}, superAdminUser);

const formulaPreview = db.getBulkImportPreview(formulaSession.id, 1, 10, superAdminUser);
const parsedFormulaVal = formulaPreview.rows[0]?.parsedData?.enrollmentNo || '';
assert(!parsedFormulaVal.startsWith('='), '3.1 Leading formula "=" safely stripped / sanitized');

// -----------------------------------------------------------------------------
// 4. Real 500-Record Stress & Validation Test (Students Master)
// -----------------------------------------------------------------------------
console.log('\n--- Stage 4: 500-Record Real Student Batch Validation & Import ---');
const fiveHundredRows: any[] = [];
for (let i = 1; i <= 500; i++) {
  const isInvalid = i === 50 || i === 150 || i === 250; // 3 deliberate invalid rows
  fiveHundredRows.push({
    'Enrollment Number': `EN2026_ST500_${String(i).padStart(4, '0')}`,
    'Student Name': `Student Scholar ${i}`,
    'Email': isInvalid ? 'invalid-email-format' : `scholar.${i}@swarrnim.edu.in`,
    'Mobile': `98${String(10000000 + i).substring(0, 8)}`,
    'Date of Birth (YYYY-MM-DD)': '2004-06-15',
    'Gender': i % 2 === 0 ? 'FEMALE' : 'MALE',
    'Institute Code': isInvalid ? 'INVALID_INSTITUTE' : 'INST-ENG',
    'Department Code': 'DEP-CSE',
    'Program Code': 'PROG-BTECH-CSE',
    'Academic Year': '2026-27',
    'Semester (1-8)': 1,
    'Admission Year': 2026,
    'Student Type': 'REGULAR',
    'Nationality': 'INDIAN',
    'Passport Number': '',
    'Status': 'ACTIVE',
  });
}

const startTime500 = Date.now();
const session500 = db.uploadBulkImportFile({
  importType: 'STUDENT',
  fileName: '500_Students_Admission_Batch.xlsx',
  rows: fiveHundredRows,
}, superAdminUser);

const timeTakenValidate500 = Date.now() - startTime500;
console.log(`    [Perf] 500 rows validated in ${timeTakenValidate500}ms`);

assert(session500.totalRows === 500, '4.1 Total 500 rows registered in import job');
assert(session500.validRows === 497, '4.2 Exactly 497 valid rows detected');
assert(session500.invalidRows === 3, '4.3 Exactly 3 invalid rows isolated with clear error context');

// Perform Partial Import (Import Valid Records)
const importResult500 = db.confirmBulkImport(session500.id, 'INSERT_ONLY', undefined, superAdminUser);
assert(importResult500.import.importedRows === 497, '4.4 Exactly 497 records safely committed to database');
assert(importResult500.import.status === 'PARTIALLY_IMPORTED', '4.5 Session marked PARTIALLY_IMPORTED');

// -----------------------------------------------------------------------------
// 5. Dual Duplicate Detection & In-File Collision Check
// -----------------------------------------------------------------------------
console.log('\n--- Stage 5: Dual Duplicate Detection & Collision Safety ---');
const duplicateTestRows = [
  // Already imported in stage 4
  {
    'Enrollment Number': 'EN2026_ST500_0001',
    'Student Name': 'Duplicate Student 1',
    'Email': 'duplicate1@swarrnim.edu.in',
    'Mobile': '9876543210',
    'Date of Birth (YYYY-MM-DD)': '2004-06-15',
    'Gender': 'MALE',
    'Institute Code': 'INST-ENG',
    'Department Code': 'DEP-CSE',
    'Program Code': 'PROG-BTECH-CSE',
    'Academic Year': '2026-27',
    'Semester (1-8)': 1,
    'Admission Year': 2026,
    'Student Type': 'REGULAR',
    'Nationality': 'INDIAN',
    'Passport Number': '',
    'Status': 'ACTIVE',
  },
  // In-file duplicate 1
  {
    'Enrollment Number': 'EN2026_NEW_COLLISION_01',
    'Student Name': 'In File First',
    'Email': 'collision1@swarrnim.edu.in',
    'Mobile': '9876543211',
    'Date of Birth (YYYY-MM-DD)': '2004-06-15',
    'Gender': 'MALE',
    'Institute Code': 'INST-ENG',
    'Department Code': 'DEP-CSE',
    'Program Code': 'PROG-BTECH-CSE',
    'Academic Year': '2026-27',
    'Semester (1-8)': 1,
    'Admission Year': 2026,
    'Student Type': 'REGULAR',
    'Nationality': 'INDIAN',
    'Passport Number': '',
    'Status': 'ACTIVE',
  },
  // In-file duplicate 2 (same enrollment no)
  {
    'Enrollment Number': 'EN2026_NEW_COLLISION_01',
    'Student Name': 'In File Duplicate',
    'Email': 'collision2@swarrnim.edu.in',
    'Mobile': '9876543212',
    'Date of Birth (YYYY-MM-DD)': '2004-06-15',
    'Gender': 'FEMALE',
    'Institute Code': 'INST-ENG',
    'Department Code': 'DEP-CSE',
    'Program Code': 'PROG-BTECH-CSE',
    'Academic Year': '2026-27',
    'Semester (1-8)': 1,
    'Admission Year': 2026,
    'Student Type': 'REGULAR',
    'Nationality': 'INDIAN',
    'Passport Number': '',
    'Status': 'ACTIVE',
  }
];

const dupSession = db.uploadBulkImportFile({
  importType: 'STUDENT',
  fileName: 'Duplicate_Check_Batch.xlsx',
  rows: duplicateTestRows,
}, superAdminUser);

assert(dupSession.duplicateRows >= 2, '5.1 Detected existing DB collision and in-file duplicate');

// -----------------------------------------------------------------------------
// 6. Real 1,000-Record High-Throughput Batch Processing Test (Curriculum/Subject Master)
// -----------------------------------------------------------------------------
console.log('\n--- Stage 6: 1,000-Record High-Throughput Subject Batch Validation & Import ---');
const oneThousandSubjects: any[] = [];
for (let i = 1; i <= 1000; i++) {
  oneThousandSubjects.push({
    'Subject Code': `SUB_CS_1000_${String(i).padStart(4, '0')}`,
    'Subject Name': `Advanced Computing Topic ${i}`,
    'Program Code': 'PROG-BTECH-CSE',
    'Department Code': 'DEP-CSE',
    'Semester': (i % 8) + 1,
    'Academic Year': '2026-27',
    'Credits': (i % 4) + 1,
    'Subject Type': i % 3 === 0 ? 'PRACTICAL' : 'THEORY',
    'Maximum Marks': 100,
    'Passing Marks': 40,
    'Status': 'ACTIVE',
  });
}

const startTime1000 = Date.now();
const session1000 = db.uploadBulkImportFile({
  importType: 'SUBJECT',
  fileName: '1000_Subjects_Curriculum_Batch.xlsx',
  rows: oneThousandSubjects,
}, superAdminUser);

const timeTakenValidate1000 = Date.now() - startTime1000;
console.log(`    [Perf] 1,000 subjects validated in ${timeTakenValidate1000}ms`);

assert(session1000.totalRows === 1000, '6.1 Exactly 1,000 subject records staged');
assert(session1000.validRows === 1000, '6.2 All 1,000 subjects passed structural & schema validation');

const startCommit1000 = Date.now();
const result1000 = db.confirmBulkImport(session1000.id, 'INSERT_ONLY', undefined, superAdminUser);
const timeTakenCommit1000 = Date.now() - startCommit1000;
console.log(`    [Perf] 1,000 subjects committed in ${timeTakenCommit1000}ms`);

assert(result1000.import.importedRows === 1000, '6.3 All 1,000 subjects successfully persisted');
assert(result1000.import.status === 'IMPORTED', '6.4 Session status marked as IMPORTED');

// -----------------------------------------------------------------------------
// 7. Audit History & Traceability
// -----------------------------------------------------------------------------
console.log('\n--- Stage 7: Audit History & Traceability ---');
const historyLogs = db.getBulkImportHistory(undefined, superAdminUser);
assert(historyLogs.length >= 3, '7.1 Import sessions registered in persistent audit history');
const latestLog = historyLogs[0];
assert(!!latestLog.importNo, '7.2 Import session possesses official tracking number (IMP-2026-XXXXXX)');
assert(latestLog.uploadedByName === superAdminUser.name, '7.3 User attribution accurately recorded in audit log');

console.log('\n======================================================');
console.log(`BULK IMPORT ENGINE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
