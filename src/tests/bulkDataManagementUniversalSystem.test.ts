import { db } from '../services/db';
import { User, BulkImportType } from '../types';

declare const process: any;

console.log('========================================================================');
console.log('STARTING UNIVERSAL BULK DATA MANAGEMENT PRODUCTION SUITE');
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

const superAdminUser: User = {
  id: 'user-sa-01',
  name: 'Jigar Parmar (VP / Super Admin)',
  email: 'vp@swarrnim.edu.in',
  role: 'SUPER_ADMIN',
  departmentId: 'dept-ce',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
};

const studentUser: User = {
  id: 'user-stu-01',
  name: 'Demo Student',
  email: 'student@swarrnim.edu.in',
  role: 'STUDENT',
  departmentId: 'dept-ce',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
};

// ─── STAGE 1: TEMPLATE GENERATION & MODULE COVERAGE ─────────────────────────
console.log('--- Stage 1: Universal Template Generation & Coverage ---');
const templates = db.getBulkImportTemplates(superAdminUser);
assert(templates.length >= 10, '1.1 Multi-sheet templates available for 10+ core modules');

const expectedTypes: BulkImportType[] = [
  'STUDENT',
  'FACULTY',
  'SUBJECT',
  'EXAM_FORM',
  'MARKS',
  'FEE_ASSIGNMENT',
  'HOSTEL_STUDENT',
  'HOSTEL_ROOM',
  'TRANSPORT_VEHICLE',
  'TRANSPORT_DRIVER',
  'TRANSPORT_ROUTE'
];

let allExist = true;
for (const t of expectedTypes) {
  const match = templates.find(item => item.type === t);
  if (!match || !match.headers || match.headers.length === 0) {
    allExist = false;
  }
}
assert(allExist, '1.2 All 11 university bulk dataset schemas properly registered');

// ─── STAGE 2: RBAC AND AUTHORIZATION BOUNDARIES ─────────────────────────────
console.log('\n--- Stage 2: RBAC Authorization & Security Scopes ---');
const studentTemplates = db.getBulkImportTemplates(studentUser);
assert(studentTemplates.length === 0, '2.1 Student user receives 0 authorized import templates');

let threwUnauthorized = false;
try {
  db.uploadBulkImportFile({
    importType: 'STUDENT',
    fileName: 'unauthorized.xlsx',
    rows: [{ 'Enrollment No': 'STU-999', 'Full Name': 'Hacker' }]
  }, studentUser);
} catch (e: any) {
  if (/403|Forbidden|Access Denied|Unauthorized/i.test(e.message)) {
    threwUnauthorized = true;
  }
}
assert(threwUnauthorized, '2.2 Unauthorized upload blocked with 403 Forbidden');

// ─── STAGE 3: REAL 1,000-ROW DATASET BENCHMARK ──────────────────────────────
console.log('\n--- Stage 3: Real 1,000-Record Ingestion Benchmark ---');
const inst = db.getInstitutes()[0];
const dept = db.getDepartments()[0];
const prog = db.getPrograms()[0];
const batch = db.getBatches()[0];
const sem = db.getSemesters()[0];

// Seed 300 initial existing students in DB to update
const studentsDb = db.getStudents();
for (let i = 1; i <= 300; i++) {
  const enr = `ENR-EXIST-${String(i).padStart(4, '0')}`;
  if (!studentsDb.some(s => s.enrollmentNo === enr)) {
    studentsDb.push({
      id: `stu-exist-${i}`,
      enrollmentNo: enr,
      name: `Original Student ${i}`,
      email: `orig.student${i}@swarrnim.edu.in`,
      phone: `98765${String(i).padStart(5, '0')}`,
      gender: 'Male',
      guardianName: 'Parent',
      guardianPhone: '9876543210',
      instituteId: inst.id,
      departmentId: dept.id,
      programId: prog.id,
      batchId: batch.id,
      semesterId: sem.id,
      divisionId: 'div-1',
      academicYearId: 'ay-1',
      status: 'ACTIVE'
    });
  }
}

// 1,000-record Excel dataset
const thousandRows: any[] = [];

// 1. 650 New records
for (let i = 1; i <= 650; i++) {
  thousandRows.push({
    'Enrollment Number': `ENR-NEW-${String(i).padStart(4, '0')}`,
    'Student Full Name': `New Enrolled Student ${i}`,
    'Email Address': `new.student${i}@swarrnim.edu.in`,
    'Phone Number': `91234${String(i).padStart(5, '0')}`,
    'Gender': i % 2 === 0 ? 'Female' : 'Male',
    'Institute Code': inst.code,
    'Department Code': dept.code,
    'Program Code': prog.code,
    'Batch Academic Year': batch.name,
    'Semester Code': sem.code,
    'Status': 'ACTIVE'
  });
}

// 2. 300 Updates to existing records
for (let i = 1; i <= 300; i++) {
  thousandRows.push({
    'Enrollment Number': `ENR-EXIST-${String(i).padStart(4, '0')}`,
    'Student Full Name': `Updated Student Name ${i}`,
    'Email Address': `updated.student${i}@swarrnim.edu.in`,
    'Phone Number': `99999${String(i).padStart(5, '0')}`,
    'Gender': 'Male',
    'Institute Code': inst.code,
    'Department Code': dept.code,
    'Program Code': prog.code,
    'Batch Academic Year': batch.name,
    'Semester Code': sem.code,
    'Status': 'ACTIVE'
  });
}

// 3. 25 Duplicates inside Excel
for (let i = 1; i <= 25; i++) {
  thousandRows.push({
    'Enrollment Number': `ENR-NEW-${String(i).padStart(4, '0')}`, // Duplicate in-file
    'Student Full Name': `Duplicate Student Copy ${i}`,
    'Email Address': `duplicate.student${i}@swarrnim.edu.in`,
    'Phone Number': `90000${String(i).padStart(5, '0')}`,
    'Gender': 'Male',
    'Institute Code': inst.code,
    'Department Code': dept.code,
    'Program Code': prog.code,
    'Batch Academic Year': batch.name,
    'Semester Code': sem.code,
    'Status': 'ACTIVE'
  });
}

// 4. 25 Invalid records
for (let i = 1; i <= 25; i++) {
  thousandRows.push({
    'Enrollment Number': `ENR-INV-${String(i).padStart(4, '0')}`,
    'Student Full Name': `Invalid Student ${i}`,
    'Email Address': `invalid_email_format_${i}`, // Bad email without @
    'Phone Number': '123',
    'Gender': 'Male',
    'Institute Code': 'INVALID_INSTITUTE', // Bad foreign key
    'Department Code': 'INVALID_DEPARTMENT',
    'Program Code': prog.code,
    'Batch Academic Year': batch.name,
    'Semester Code': sem.code,
    'Status': 'ACTIVE'
  });
}

assert(thousandRows.length === 1000, '3.1 Exactly 1,000 dataset rows staged in batch');

const startUpload = Date.now();
const session = db.uploadBulkImportFile({
  importType: 'STUDENT',
  fileName: 'ssiu_students_1000_batch.xlsx',
  rows: thousandRows
}, superAdminUser);
const duration = Date.now() - startUpload;
console.log(`    [Throughput] Staged & pre-validated 1,000 records in ${duration}ms`);

assert(session.totalRows === 1000 && session.validRows === 650 && session.duplicateRows === 325 && session.invalidRows === 25, '3.2 INSERT_ONLY mode safely isolates 325 duplicate records');

// Switch strategy to UPSERT mode (Create New + Update Existing)
const upsertSession = db.validateBulkImport(session.id, 'UPSERT', superAdminUser);
assert(upsertSession.validRows === 950 && upsertSession.duplicateRows === 25 && upsertSession.invalidRows === 25, '3.3 UPSERT mode validates 950 rows (650 new + 300 updates)');

// Confirm execution in UPSERT mode
const commitStart = Date.now();
const result = db.confirmBulkImport(session.id, 'UPSERT', undefined, superAdminUser);
const commitDuration = Date.now() - commitStart;
console.log(`    [Throughput] Committed 950 records to DB in ${commitDuration}ms`);

assert(result.import.importedRows === 950, '3.4 Exactly 950 records committed to DB');
assert(result.import.status === 'PARTIALLY_IMPORTED', '3.5 Session status correctly reflects PARTIALLY_IMPORTED');

// Verify existing record 1 got updated
const updatedStu1 = db.getStudents().find(s => s.enrollmentNo === 'ENR-EXIST-0001');
assert(!!updatedStu1 && updatedStu1.name === 'Updated Student Name 1' && updatedStu1.phone === '9999900001', '3.6 Existing record updated in-place');

// Verify new record 650 got created
const newStu650 = db.getStudents().find(s => s.enrollmentNo === 'ENR-NEW-0650');
assert(!!newStu650 && newStu650.name === 'New Enrolled Student 650', '3.7 New student record persisted cleanly');

// ─── STAGE 4: AUDIT TRAIL & ERROR EXCEL EXPORT ─────────────────────────────
console.log('\n--- Stage 4: Traceability, Audit Trail & Error Report ---');
const history = db.getBulkImportHistory({ importType: 'STUDENT' }, superAdminUser);
assert(history.length > 0 && history[0].importNo.startsWith('IMP-'), '4.1 Import registered with official tracking code ' + (history[0]?.importNo || ''));

const errorReport = db.downloadBulkImportErrorReport(history[0].id, superAdminUser);
assert(errorReport.success && errorReport.errorCount >= 25, '4.2 Error report spreadsheet generated with 25 remediation instructions');

console.log('\n======================================================');
console.log(`UNIVERSAL BULK DATA SYSTEM RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0 && typeof process !== 'undefined') {
  process.exit(1);
}
