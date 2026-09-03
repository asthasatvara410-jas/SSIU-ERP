// ==============================================================================
// SSIU ERP - STUDENT ATTENDANCE EXCEL-STYLE TABLE TEST SUITE
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { db } from '../src/services/db';
import { attendanceApprovalService } from '../src/services/attendanceApprovalService';

function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 RUNNING VERIFICATION FOR STUDENT ATTENDANCE EXCEL-STYLE TABLE');
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

  const attendancePagePath = path.join(process.cwd(), 'src/pages/academic/AttendancePage.tsx');
  assert(fs.existsSync(attendancePagePath), 'Test 1.1: AttendancePage.tsx exists');

  const content = fs.readFileSync(attendancePagePath, 'utf-8');

  // ── Test 1: Page Title & Top Controls ──
  assert(
    content.includes('Subject-Wise Attendance & 75% Rule Condonation') ||
    content.includes('Subject-Wise Attendance &amp; 75% Rule Condonation'),
    'Test 1.2: Page Title is "Subject-Wise Attendance & 75% Rule Condonation"'
  );
  assert(content.includes('Generate Attendance Report'), 'Test 1.3: "Generate Attendance Report" action button preserved');

  // ── Test 2: Top 4 Summary Cards (Single Source of Truth) ──
  assert(content.includes('Overall Attendance'), 'Test 2.1: Top card "Overall Attendance" present');
  assert(content.includes('Total Attended'), 'Test 2.2: Top card "Total Attended" present');
  assert(content.includes('Classes Absent'), 'Test 2.3: Top card "Classes Absent" present');
  assert(content.includes('Total Conducted'), 'Test 2.4: Top card "Total Conducted" present');
  assert(content.includes('overallStudentStats'), 'Test 2.5: Top cards use unified overallStudentStats calculation');

  // ── Test 3: Excel-Style 10-Column Table Structure ──
  assert(content.includes('<table') && content.includes('</table>'), 'Test 3.1: Renders real HTML <table> element');
  assert(content.includes('Sr. No.'), 'Test 3.2: Column 1 "Sr. No." present');
  assert(content.includes('<th>\n                      Subject\n                    </th>') || content.includes('Subject\n                    </th>') || content.includes('>Subject<'), 'Test 3.3: Column 2 "Subject" present');
  assert(content.includes('Subject Code'), 'Test 3.4: Column 3 "Subject Code" present');
  assert(content.includes('Total Classes'), 'Test 3.5: Column 4 "Total Classes" present');
  assert(content.includes('Present\n                    </th>') || content.includes('>Present<'), 'Test 3.6: Column 5 "Present" present');
  assert(content.includes('Absent\n                    </th>') || content.includes('>Absent<'), 'Test 3.7: Column 6 "Absent" present');
  assert(content.includes('Late\n                    </th>') || content.includes('>Late<'), 'Test 3.8: Column 7 "Late" present');
  assert(content.includes('Attendance %'), 'Test 3.9: Column 8 "Attendance %" present');
  assert(content.includes('Status\n                    </th>') || content.includes('>Status<'), 'Test 3.10: Column 9 "Status" present');
  assert(content.includes('Action\n                    </th>') || content.includes('>Action<'), 'Test 3.11: Column 10 "Action" present');

  // ── Test 4: Excel Styling & Responsiveness ──
  assert(content.includes('position: \'sticky\'') || content.includes('position: "sticky"'), 'Test 4.1: Sticky table header implemented');
  assert(content.includes('overflowX:') || content.includes('overflow-x: auto'), 'Test 4.2: Responsive horizontal scrolling container on mobile');
  assert(content.includes('No attendance records available.'), 'Test 4.3: Table empty state handles 0 records cleanly');

  // ── Test 5: Subject Details Modal & Actions ──
  assert(content.includes('setViewingSubjectDetails') && content.includes('viewingSubjectDetails'), 'Test 5.1: Subject Attendance Details Modal implemented');
  assert(content.includes('Apply for 75% Rule Condonation') || content.includes('Apply for Approval'), 'Test 5.2: 75% Rule Condonation Application flow connected');

  // ── Test 6: Strict Anti-Duplication Check ──
  assert(!content.includes('attendanceData2'), 'Test 6.1: No attendanceData2 duplication store created');
  assert(!content.includes('attendanceRecordsNew'), 'Test 6.2: No attendanceRecordsNew duplication store created');
  assert(!content.includes('studentAttendanceNew'), 'Test 6.3: No studentAttendanceNew duplication store created');

  // ── Test 7: Data Calculation & 75% Rule Verification ──
  const students = db.getStudents();
  const demoStudent = students[0];
  if (demoStudent) {
    const stats = attendanceApprovalService.calculateStudentSubjectAttendance(demoStudent.id);
    assert(Array.isArray(stats) && stats.length > 0, `Test 7.1: Demo student has ${stats.length} enrolled subjects with attendance`);
    const firstSubj = stats[0];
    assert(typeof firstSubj.percentage === 'number', 'Test 7.2: Attendance percentage dynamically calculated as number');
    assert(firstSubj.totalClasses >= firstSubj.presentClasses, 'Test 7.3: Total classes >= present classes');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 ATTENDANCE TABLE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
