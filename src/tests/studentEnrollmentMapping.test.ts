// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT ENROLLMENT MAPPING & BULK IMPORT TESTS
// ==============================================================================

import { studentEnrollmentMappingService } from '../services/studentEnrollmentMappingService';
import { db } from '../services/db';
import { User, ParsedMappingRow } from '../types';
import * as XLSX from 'xlsx';

async function runTests() {
  console.log('--- STARTING STUDENT ENROLLMENT MAPPING & BULK IMPORT TESTS ---');

  const adminUser: User = {
    id: 'usr-admin-1',
    username: 'superadmin',
    name: 'Dr. Sanjay Patel',
    email: 'superadmin@swarrnim.edu.in',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    permissions: []
  };

  // ── TEST 1: Generate Excel Template ──
  console.log('\n[TEST 1] Testing Excel Template Generation...');
  const templateWb = studentEnrollmentMappingService.generateTemplateWorkbook();
  if (!templateWb.Sheets['Student_Mapping_Template']) {
    throw new Error('Template sheet "Student_Mapping_Template" missing in workbook!');
  }
  if (!templateWb.Sheets['Instructions']) {
    throw new Error('Instruction sheet "Instructions" missing in workbook!');
  }

  const templateRows = XLSX.utils.sheet_to_json(templateWb.Sheets['Student_Mapping_Template']);
  console.log(`✓ Template generated with 2 sheets. Sheet 1 contains ${templateRows.length} sample rows.`);

  // ── TEST 2: Parse & Validate Valid Workbook ──
  console.log('\n[TEST 2] Testing Excel Validation Engine with Valid Data...');
  const validWb = XLSX.utils.book_new();
  const validData = [
    [
      'Enrollment No', 'Student Name', 'Student Email', 'Institute', 'Department',
      'Program Code', 'Program Name', 'Academic Year', 'Semester', 'Division',
      'Class / Batch', 'Mentor Faculty', 'Student Status'
    ],
    [
      'TEST-2026-001', 'Test Student Alpha', 'alpha.test@swarrnim.edu.in', 'SSCIT', 'CSE',
      'BTECH_CSE', 'B.Tech CSE', '2025-26', 4, 'A',
      '2023-2027', 'Dr. Rajesh Verma', 'ACTIVE'
    ],
    [
      'TEST-2026-002', 'Test Student Beta', 'beta.test@swarrnim.edu.in', 'SSCIT', 'CSE',
      'BTECH_CSE', 'B.Tech CSE', '2025-26', 4, 'B',
      '2023-2027', 'Dr. Rajesh Verma', 'ACTIVE'
    ]
  ];
  const wsValid = XLSX.utils.aoa_to_sheet(validData);
  XLSX.utils.book_append_sheet(validWb, wsValid, 'Data');
  const validBuffer = XLSX.write(validWb, { type: 'array', bookType: 'xlsx' });

  const valResult = await studentEnrollmentMappingService.parseAndValidateExcel(validBuffer, adminUser, 'SUPER_ADMIN');
  if (!valResult.canImport) {
    throw new Error('Expected validation to pass but canImport was false: ' + JSON.stringify(valResult.globalErrors));
  }
  if (valResult.validRows !== 2) {
    throw new Error(`Expected 2 valid rows, got ${valResult.validRows}`);
  }
  if (valResult.invalidRows !== 0) {
    throw new Error(`Expected 0 invalid rows, got ${valResult.invalidRows}`);
  }
  console.log(`✓ Validation passed: ${valResult.validRows} valid rows, ${valResult.invalidRows} invalid rows.`);

  // ── TEST 3: Validation Error Handling (Missing fields, duplicates, invalid semester) ──
  console.log('\n[TEST 3] Testing Validation Error Detection...');
  const invalidWb = XLSX.utils.book_new();
  const invalidData = [
    [
      'Enrollment No', 'Student Name', 'Institute', 'Department',
      'Program Code', 'Academic Year', 'Semester', 'Division'
    ],
    [
      '', 'Missing Enrollment Student', 'SSCIT', 'CSE',
      'BTECH_CSE', '2025-26', 4, 'A'
    ],
    [
      'TEST-DUP-01', 'Duplicate 1', 'SSCIT', 'CSE',
      'BTECH_CSE', '2025-26', 4, 'A'
    ],
    [
      'TEST-DUP-01', 'Duplicate 2', 'SSCIT', 'CSE',
      'BTECH_CSE', '2025-26', 4, 'A'
    ],
    [
      'TEST-SEM-INV', 'Invalid Sem Student', 'SSCIT', 'CSE',
      'BTECH_CSE', '2025-26', 99, 'A'
    ]
  ];
  const wsInvalid = XLSX.utils.aoa_to_sheet(invalidData);
  XLSX.utils.book_append_sheet(invalidWb, wsInvalid, 'Data');
  const invalidBuffer = XLSX.write(invalidWb, { type: 'array', bookType: 'xlsx' });

  const invResult = await studentEnrollmentMappingService.parseAndValidateExcel(invalidBuffer, adminUser, 'SUPER_ADMIN');
  if (invResult.errorRowsCount === 0) {
    throw new Error('Expected validation errors for missing enrollment, duplicates, and invalid semester.');
  }
  console.log(`✓ Error detection verified: Detected ${invResult.invalidRows} invalid rows and ${invResult.duplicateRowsCount} duplicates.`);

  // ── TEST 4: Execute Atomic Bulk Mapping Transaction ──
  console.log('\n[TEST 4] Testing Atomic Bulk Mapping Transaction...');
  const execResult = studentEnrollmentMappingService.executeBulkMappingTransaction(
    valResult.rows,
    adminUser,
    'SUPER_ADMIN',
    { fileName: 'Test_Import.xlsx', fileSize: '18 KB' }
  );

  if (!execResult.success) {
    throw new Error('Bulk mapping transaction failed: ' + execResult.message);
  }
  if (execResult.successfullyMapped !== 2) {
    throw new Error(`Expected 2 successfully mapped records, got ${execResult.successfullyMapped}`);
  }

  // Verify created mapping records in centralized database
  const mappings = studentEnrollmentMappingService.getStudentEnrollmentMappings({
    academicYear: '2025-26',
    semester: 4
  });
  const foundAlpha = mappings.find(m => m.enrollmentNo === 'TEST-2026-001');
  const foundBeta = mappings.find(m => m.enrollmentNo === 'TEST-2026-002');

  if (!foundAlpha || !foundBeta) {
    throw new Error('Mapped students not found in centralized enrollment query!');
  }
  if (!foundAlpha.isCurrent) {
    throw new Error('Expected newly mapped student to have isCurrent=true');
  }

  // Verify student master record in DB
  const studentMaster = db.getStudents().find(s => s.enrollmentNo === 'TEST-2026-001');
  if (!studentMaster) {
    throw new Error('Student record was not created in Master Student list!');
  }
  console.log(`✓ Atomic transaction committed: ${execResult.successfullyMapped} students mapped, Master records synchronized.`);

  // ── TEST 5: Semester Upgrade without Duplicate Student (History Retention) ──
  console.log('\n[TEST 5] Testing Historical Mapping Preservation on Semester Change...');
  const upgradeWb = XLSX.utils.book_new();
  const upgradeData = [
    [
      'Enrollment No', 'Student Name', 'Student Email', 'Institute', 'Department',
      'Program Code', 'Program Name', 'Academic Year', 'Semester', 'Division',
      'Class / Batch', 'Mentor Faculty', 'Student Status'
    ],
    [
      'TEST-2026-001', 'Test Student Alpha', 'alpha.test@swarrnim.edu.in', 'SSCIT', 'CSE',
      'BTECH_CSE', 'B.Tech CSE', '2026-27', 5, 'B',
      '2023-2027', 'Dr. Rajesh Verma', 'ACTIVE'
    ]
  ];
  const wsUpgrade = XLSX.utils.aoa_to_sheet(upgradeData);
  XLSX.utils.book_append_sheet(upgradeWb, wsUpgrade, 'Data');
  const upgradeBuffer = XLSX.write(upgradeWb, { type: 'array', bookType: 'xlsx' });

  const upgradeVal = await studentEnrollmentMappingService.parseAndValidateExcel(upgradeBuffer, adminUser, 'SUPER_ADMIN');
  if (!upgradeVal.rows[0].isExistingStudent) {
    throw new Error('Expected student TEST-2026-001 to be recognized as existing student!');
  }

  const upgradeExec = studentEnrollmentMappingService.executeBulkMappingTransaction(
    upgradeVal.rows,
    adminUser,
    'SUPER_ADMIN'
  );

  if (upgradeExec.updatedExisting !== 1) {
    throw new Error(`Expected updatedExisting=1, got ${upgradeExec.updatedExisting}`);
  }

  // Verify historical records for this student
  const studentHist = studentEnrollmentMappingService.getHistoricalMappingsForStudent(studentMaster.id);
  if (studentHist.length < 2) {
    throw new Error(`Expected at least 2 mapping records (Sem 4 and Sem 5) for student, found ${studentHist.length}`);
  }

  const activeMapping = studentEnrollmentMappingService.getActiveMappingForStudent(studentMaster.id);
  if (activeMapping?.semester !== 5 || activeMapping?.academicYear !== '2026-27' || activeMapping?.division !== 'B') {
    throw new Error(`Expected active mapping to be Sem 5 Div B (2026-27), got Sem ${activeMapping?.semester} Div ${activeMapping?.division} (${activeMapping?.academicYear})`);
  }

  console.log(`✓ History preservation verified: Student has ${studentHist.length} historical academic mappings (Sem 4 -> Sem 5).`);

  // ── TEST 6: Verify Mapping History Record ──
  console.log('\n[TEST 6] Testing Mapping History Audit Log...');
  const histories = studentEnrollmentMappingService.getStudentMappingHistories();
  if (histories.length === 0) {
    throw new Error('No mapping history records found in database!');
  }
  const latestHist = histories[0];
  if (!latestHist.batchId || latestHist.rowDetails.length === 0) {
    throw new Error('Mapping history record is incomplete!');
  }
  console.log(`✓ History log verified: Batch ${latestHist.batchId} contains ${latestHist.rowDetails.length} audited row details.`);

  console.log('\n======================================================');
  console.log('✅ ALL STUDENT ENROLLMENT MAPPING & BULK IMPORT TESTS PASSED');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
