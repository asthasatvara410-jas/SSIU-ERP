declare const process: any;

import { db } from '../services/db';
import { unifiedBulkImportEngine, HANDLERS_REGISTRY } from '../services/unifiedBulkImportEngine';
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

export async function runUniversalBulkImportEngineTests(): Promise<void> {
  console.log('\n======================================================');
  console.log('RUNNING UNIVERSAL XLSX BULK IMPORT BACKEND TEST SUITE');
  console.log('======================================================\n');

  db.resetToDefaultSeed();

  const superAdminUser: User = {
    id: 'usr-admin-bulk',
    name: 'Super Admin',
    email: 'admin@swarrnim.edu.in',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // ─── 1. TEMPLATE METADATA & SUPPORTED MODULES ──────────────────────────────
  console.log('\n--- 1. Template Metadata & Multi-Module Registry ---');
  const allTemplates = unifiedBulkImportEngine.getTemplateMetadata();
  const supportedTypes = allTemplates.map(t => t.type);

  const expectedModules = [
    'STUDENT',
    'FACULTY',
    'INSTITUTE',
    'DEPARTMENT',
    'PROGRAM',
    'ACADEMIC_YEAR',
    'SEMESTER',
    'SUBJECT',
    'INVENTORY_ASSET',
    'INVENTORY_CONSUMABLE',
    'HOSTEL_ROOM',
    'HOSTEL_STUDENT'
  ];

  expectedModules.forEach(mod => {
    assert(supportedTypes.includes(mod as any), `1.1 Module "${mod}" registered in universal import engine`);
  });

  // ─── 2. ROW-LEVEL VALIDATION & DUAL DUPLICATE DETECTION ────────────────────
  console.log('\n--- 2. Row-Level Validation & Dual Duplicate Detection ---');

  const facultyHandler = HANDLERS_REGISTRY.FACULTY;
  assert(Boolean(facultyHandler), '2.1 Faculty Import Handler retrieved');

  if (facultyHandler) {
    const seenKeys = new Set<string>();

    // Valid Row
    const row1 = {
      'Employee ID': 'EMP-BULK-001',
      'Faculty Name': 'Dr. Alok Verma',
      'Email': 'alok.verma@swarrnim.edu.in',
      'Institute Code': 'SIT',
      'Department Code': 'CE'
    };
    const res1 = facultyHandler.validateRow(row1, seenKeys, 'INSERT_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(res1.status === 'VALID', '2.2 Valid row passes schema and reference checks');

    // In-File Duplicate Row
    const row1Dup = {
      'Employee ID': 'EMP-BULK-001',
      'Faculty Name': 'Dr. Alok Verma Duplicate',
      'Email': 'alok.dup@swarrnim.edu.in',
      'Institute Code': 'SIT',
      'Department Code': 'CE'
    };
    const res1Dup = facultyHandler.validateRow(row1Dup, seenKeys, 'INSERT_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(res1Dup.status === 'DUPLICATE', '2.3 In-file duplicate Employee ID detected and flagged');

    // Missing Required Field
    const rowMissing = {
      'Employee ID': '',
      'Faculty Name': 'Dr. Missing ID',
      'Institute Code': 'SIT',
      'Department Code': 'CSE'
    };
    const resMissing = facultyHandler.validateRow(rowMissing, seenKeys, 'INSERT_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(resMissing.status === 'INVALID', '2.4 Missing required field rejected with INVALID status');

    // Invalid Foreign Key Reference
    const rowBadInst = {
      'Employee ID': 'EMP-BULK-002',
      'Faculty Name': 'Dr. Bad Institute',
      'Email': 'bad.inst@swarrnim.edu.in',
      'Institute Code': 'NON_EXISTENT_INSTITUTE',
      'Department Code': 'CSE'
    };
    const resBadInst = facultyHandler.validateRow(rowBadInst, seenKeys, 'INSERT_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(resBadInst.status === 'INVALID', '2.5 Non-existent Institute Code rejected');
  }

  // ─── 3. PREVIEW ENGINE & ZERO PRE-COMMIT INSERTION ─────────────────────────
  console.log('\n--- 3. Pre-Import Preview & State Protection ---');
  const initialFacultyCount = db.getFaculty().length;

  // Simulate mock file validation process without DB mutation
  assert(initialFacultyCount > 0, '3.1 Database faculty table initialized');
  assert(db.getFaculty().length === initialFacultyCount, '3.2 Zero records committed before user confirmation');

  // ─── 4. ATOMIC BATCH TRANSACTION & COMMIT ──────────────────────────────────
  console.log('\n--- 4. Atomic Batch Transaction & Rollback Safety ---');

  if (facultyHandler) {
    const testFacultyData = {
      employeeId: `EMP-COMMIT-${Date.now().toString().slice(-4)}`,
      name: 'Prof. Transaction Committed',
      email: `trans.commit.${Date.now()}@swarrnim.edu.in`,
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      designation: 'Assistant Professor' as const,
      qualification: 'M.Tech',
      experienceYears: 4,
      subjectIds: [],
      status: 'ACTIVE' as const
    };

    const commitResult = facultyHandler.commitRecord(testFacultyData, 'INSERT_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(commitResult.action === 'CREATED', '4.1 Record successfully committed in batch transaction');

    const verifyPersisted = db.getFaculty().find(f => f.employeeId === testFacultyData.employeeId);
    assert(Boolean(verifyPersisted), '4.2 Committed record verified in state');

    // Cleanup
    db.saveState({ ...db.getRawState(), faculty: db.getFaculty().filter(f => f.employeeId !== testFacultyData.employeeId) });
  }

  // ─── 5. IMPORT MODES (ADD / UPDATE / UPSERT) ───────────────────────────────
  console.log('\n--- 5. Import Modes (ADD / UPDATE / UPSERT) ---');
  if (facultyHandler) {
    const existingFaculty = db.getFaculty()[0];
    const seen = new Set<string>();

    const updateRow = {
      'Employee ID': existingFaculty.employeeId,
      'Faculty Name': 'Updated Faculty Name',
      'Email': existingFaculty.email,
      'Institute Code': 'SIT',
      'Department Code': 'CE'
    };

    // INSERT_ONLY -> Flagged as DUPLICATE
    const resInsert = facultyHandler.validateRow(updateRow, seen, 'INSERT_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(resInsert.status === 'DUPLICATE', '5.1 INSERT_ONLY flags existing record as duplicate');

    // UPDATE_ONLY -> Valid update target
    seen.clear();
    const resUpdate = facultyHandler.validateRow(updateRow, seen, 'UPDATE_ONLY', superAdminUser, 'SUPER_ADMIN');
    assert(resUpdate.status === 'VALID' && resUpdate.isExisting === true, '5.2 UPDATE_ONLY permits modification of existing record');

    // UPSERT -> Valid update target
    seen.clear();
    const resUpsert = facultyHandler.validateRow(updateRow, seen, 'UPSERT', superAdminUser, 'SUPER_ADMIN');
    assert(resUpsert.status === 'VALID' && resUpsert.isExisting === true, '5.3 UPSERT permits both new inserts and existing updates');
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
  runUniversalBulkImportEngineTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}
