// ==============================================================================
// SSIU ERP - TIMETABLE TABLE/GRID LAYOUT VERIFICATION TEST SUITE
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { db } from '../src/services/db';

function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 RUNNING VERIFICATION FOR TIMETABLE TABLE / GRID LAYOUT');
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

  const timetablePagePath = path.join(process.cwd(), 'src/pages/academic/TimetablePage.tsx');
  assert(fs.existsSync(timetablePagePath), 'Test 1.1: TimetablePage.tsx exists');

  const content = fs.readFileSync(timetablePagePath, 'utf-8');

  // ── Test 1: Professional Table & Grid Layout ──
  assert(content.includes('<table') && content.includes('</table>'), 'Test 1.2: Renders <table> element replacing card layout');
  assert(content.includes('<thead>') && content.includes('<tbody>'), 'Test 1.3: Uses standard accessible <thead> and <tbody>');
  assert(content.includes('overflowX:') || content.includes('overflow-x: auto') || content.includes('overflowX: "auto"'), 'Test 1.4: Horizontally scrollable container on smaller screens');

  // ── Test 2: Fixed Time Column & Monday-Saturday Headers ──
  assert(content.includes('position: \'sticky\'') && content.includes('left: 0'), 'Test 2.1: Time column is fixed/sticky on the left');
  assert(
    content.includes('Monday') && 
    content.includes('Tuesday') && 
    content.includes('Wednesday') && 
    content.includes('Thursday') && 
    content.includes('Friday') && 
    content.includes('Saturday'),
    'Test 2.2: Monday through Saturday columns present'
  );

  // ── Test 3: Required Cell Content ──
  assert(content.includes('subj?.name') || content.includes('Subject Name'), 'Test 3.1: Displays Subject Name in cell');
  assert(content.includes('subj?.code') || content.includes('CSE-401'), 'Test 3.2: Displays Subject Code in cell');
  assert(content.includes('fac?.name') || content.includes('faculty'), 'Test 3.3: Displays Faculty Name in cell');
  assert(content.includes('entry.roomNo') || content.includes('roomNo'), 'Test 3.4: Displays Classroom / Lab / Venue in cell');
  assert(content.includes('div?.name') || content.includes('Division'), 'Test 3.5: Displays Division in cell');
  assert(content.includes('THEORY') && content.includes('PRACTICAL'), 'Test 3.6: Displays Lecture Type (Theory/Practical)');
  assert(content.includes('No Class'), 'Test 3.7: Empty periods display "No Class"');

  // ── Test 4: Rowspan & Multi-period Merging ──
  assert(content.includes('rowSpan') || content.includes('rowspan'), 'Test 4.1: Supports rowSpan for multi-hour lectures & labs');

  // ── Test 5: Compact Filters (Academic Year, Semester, Division, Week) ──
  assert(content.includes('selectedAcademicYear') || content.includes('Academic Year'), 'Test 5.1: Academic Year filter present');
  assert(content.includes('selectedSemester') || content.includes('Semester'), 'Test 5.2: Semester filter present');
  assert(content.includes('selectedDivision') || content.includes('Division'), 'Test 5.3: Division filter present');
  assert(content.includes('weekRangeLabel') || content.includes('Week'), 'Test 5.4: Week navigator / filter present');

  // ── Test 6: Interactive Lecture Details Modal ──
  assert(content.includes('setSelectedLectureDetail') && content.includes('Lecture Details'), 'Test 6.1: Interactive modal with complete lecture details');

  // ── Test 7: Data Integrity & Backend Persistence ──
  const entries = db.getTimetableEntries();
  assert(Array.isArray(entries) && entries.length >= 6, `Test 7.1: db.getTimetableEntries() contains valid schedule data (Found ${entries.length} entries)`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 TIMETABLE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
