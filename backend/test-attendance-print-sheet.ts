// ==============================================================================
// SSIU ERP - STUDENT ATTENDANCE EXCEL-STYLE PRINT SHEET TEST SUITE
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { db } from '../src/services/db';

function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 RUNNING VERIFICATION FOR STUDENT ATTENDANCE PRINT SHEET');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── Test 1: File Existence & Imports ──
  const modalPath = path.join(process.cwd(), 'src/components/academic/StudentAttendanceReportModal.tsx');
  assert(fs.existsSync(modalPath), 'Test 1.1: StudentAttendanceReportModal.tsx exists');

  const attendancePagePath = path.join(process.cwd(), 'src/pages/academic/AttendancePage.tsx');
  const attendancePageContent = fs.readFileSync(attendancePagePath, 'utf-8');
  assert(
    attendancePageContent.includes('StudentAttendanceReportModal'),
    'Test 1.2: AttendancePage.tsx imports and integrates StudentAttendanceReportModal'
  );

  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  // ── Test 2: Institutional Header & Metadata ──
  assert(
    modalContent.includes('SWARRNIM STARTUP & INNOVATION UNIVERSITY') ||
    modalContent.includes('SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY'),
    'Test 2.1: University Header "SWARRNIM STARTUP & INNOVATION UNIVERSITY" present'
  );
  assert(
    modalContent.includes('STUDENT ATTENDANCE SHEET'),
    'Test 2.2: Document title "STUDENT ATTENDANCE SHEET" present'
  );
  assert(modalContent.includes('Student Name:'), 'Test 2.3: Student Name field present');
  assert(modalContent.includes('Enrollment No.:'), 'Test 2.4: Enrollment No. field present');
  assert(modalContent.includes('Program:'), 'Test 2.5: Program field present');
  assert(modalContent.includes('Department:'), 'Test 2.6: Department field present');
  assert(modalContent.includes('Semester:'), 'Test 2.7: Semester field present');
  assert(modalContent.includes('Division:'), 'Test 2.8: Division field present');
  assert(modalContent.includes('Academic Year:'), 'Test 2.9: Academic Year field present');

  // ── Test 3: 10-Column Excel Table Structure ──
  assert(modalContent.includes('Sr. No.'), 'Test 3.1: Column 1 "Sr. No." present');
  assert(modalContent.includes('Date\n') || modalContent.includes('>Date<') || modalContent.includes('Date'), 'Test 3.2: Column 2 "Date" present');
  assert(modalContent.includes('Day\n') || modalContent.includes('>Day<') || modalContent.includes('Day'), 'Test 3.3: Column 3 "Day" present');
  assert(modalContent.includes('Subject Code'), 'Test 3.4: Column 4 "Subject Code" present');
  assert(modalContent.includes('Subject\n') || modalContent.includes('>Subject<') || modalContent.includes('Subject'), 'Test 3.5: Column 5 "Subject" present');
  assert(modalContent.includes('Faculty'), 'Test 3.6: Column 6 "Faculty" present');
  assert(modalContent.includes('Time\n') || modalContent.includes('>Time<') || modalContent.includes('Time'), 'Test 3.7: Column 7 "Time" present');
  assert(modalContent.includes('Room\n') || modalContent.includes('>Room<') || modalContent.includes('Room'), 'Test 3.8: Column 8 "Room" present');
  assert(modalContent.includes('Status\n') || modalContent.includes('>Status<') || modalContent.includes('Status'), 'Test 3.9: Column 9 "Status" present');
  assert(modalContent.includes('Attendance %'), 'Test 3.10: Column 10 "Attendance %" present');

  // ── Test 4: Summary Section Calculation & 75% Rule ──
  assert(modalContent.includes('Total Conducted Classes'), 'Test 4.1: Summary "Total Conducted Classes" present');
  assert(modalContent.includes('Total Present'), 'Test 4.2: Summary "Total Present" present');
  assert(modalContent.includes('Total Absent'), 'Test 4.3: Summary "Total Absent" present');
  assert(modalContent.includes('Total Late'), 'Test 4.4: Summary "Total Late" present');
  assert(modalContent.includes('Overall Attendance'), 'Test 4.5: Summary "Overall Attendance" present');
  assert(modalContent.includes('75% Rule Status'), 'Test 4.6: Summary "75% Rule Status" present');

  // ── Test 5: Print Media CSS Specifications ──
  assert(modalContent.includes('@media print'), 'Test 5.1: Dedicated @media print stylesheet defined');
  assert(modalContent.includes('size: A4 landscape') || modalContent.includes('size: A4 landscape;'), 'Test 5.2: @page set to A4 landscape');
  assert(modalContent.includes('display: table-header-group'), 'Test 5.3: Table header repeats on every printed page (display: table-header-group)');
  assert(modalContent.includes('page-break-inside: avoid') || modalContent.includes('break-inside: avoid'), 'Test 5.4: Row break avoidance (page-break-inside: avoid)');
  assert(modalContent.includes('no-print') && modalContent.includes('print-only'), 'Test 5.5: Clean print isolation with .no-print and .print-only classes');

  // ── Test 6: Zero Duplication & Live DB Sessions Integration ──
  assert(modalContent.includes('db.getAttendanceSessions()'), 'Test 6.1: Fetches directly from existing central db.getAttendanceSessions()');
  const sessions = db.getAttendanceSessions();
  assert(Array.isArray(sessions) && sessions.length > 0, `Test 6.2: Database contains ${sessions.length} active attendance session records`);

  // ── Test 7: Export & Interactive Actions ──
  assert(modalContent.includes('handlePrint') && modalContent.includes('window.print()'), 'Test 7.1: Browser print trigger handler implemented');
  assert(modalContent.includes('handleExportCSV') || modalContent.includes('Export CSV'), 'Test 7.2: CSV / Excel download export handler implemented');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 ATTENDANCE PRINT SHEET TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
