// ==============================================================================
// SSIU ERP - CREATE EXAMINATION SESSION MODAL UI VERIFICATION TEST SUITE
// ==============================================================================

import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 RUNNING VERIFICATION FOR CREATE EXAMINATION SESSION MODAL UI');
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

  const examsListPagePath = path.join(process.cwd(), 'src/pages/exams/ExamsListPage.tsx');
  assert(fs.existsSync(examsListPagePath), 'Test 1.1: ExamsListPage.tsx exists');

  const content = fs.readFileSync(examsListPagePath, 'utf-8');

  // ── Test 1: Official Header & Branding ──
  assert(content.includes('Create New Examination Session'), 'Test 1.2: Modal title "Create New Examination Session" present');
  assert(
    content.includes('Office of the Controller of Examinations') ||
    content.includes('Swarrnim Startup & Innovation University') ||
    content.includes('Swarrnim Startup &amp; Innovation University'),
    'Test 1.3: University administrative subtitle present'
  );
  assert(content.includes('#0F2C59') && content.includes('#F37023'), 'Test 1.4: Official university dark navy and orange accent colors used');

  // ── Test 2: Section Hierarchy & Structure ──
  assert(
    content.includes('1. Academic Mapping & Examination Details') ||
    content.includes('1. Academic Mapping &amp; Examination Details'),
    'Test 2.1: Section 1 "1. Academic Mapping & Examination Details" present'
  );
  assert(
    content.includes('2. Examination Window & Timeline') ||
    content.includes('2. Examination Window &amp; Timeline'),
    'Test 2.2: Section 2 "2. Examination Window & Timeline" present'
  );
  assert(content.includes('3. General Instructions'), 'Test 2.3: Section 3 "3. General Instructions" present');

  // ── Test 3: Existing Fields in Section 1 ──
  assert(content.includes('Examination Code'), 'Test 3.1: Examination Code field present');
  assert(content.includes('Examination Type'), 'Test 3.2: Examination Type field present');
  assert(content.includes('Examination Name / Title') || content.includes('Examination Name'), 'Test 3.3: Examination Name / Title field present');
  assert(content.includes('Institute'), 'Test 3.4: Institute dropdown present');
  assert(content.includes('Department'), 'Test 3.5: Department dropdown present');
  assert(content.includes('Program'), 'Test 3.6: Program dropdown present');
  assert(content.includes('Academic Year'), 'Test 3.7: Academic Year dropdown present');
  assert(content.includes('Semester'), 'Test 3.8: Semester dropdown present');
  assert(content.includes('Exam Session'), 'Test 3.9: Exam Session field present');

  // ── Test 4: Existing Fields in Section 2 (Timeline) ──
  assert(content.includes('Exam Form Start'), 'Test 4.1: Exam Form Start date field present');
  assert(content.includes('Examination Form End'), 'Test 4.2: Examination Form End date field present');
  assert(content.includes('Examination Start'), 'Test 4.3: Examination Start date field present');
  assert(content.includes('Examination End'), 'Test 4.4: Examination End date field present');
  assert(content.includes('Late Fee Form Start'), 'Test 4.5: Late Fee Form Start date field present');
  assert(content.includes('Late Fee Final End Deadline'), 'Test 4.6: Late Fee Final End Deadline date field present');
  assert(content.includes('Mandatory Attendance Gate (%)'), 'Test 4.7: Mandatory Attendance Gate field present');

  // ── Test 5: Section 3 & Required Red Asterisk ──
  assert(content.includes('Instructions for Student Hall Tickets'), 'Test 5.1: General Instructions field present');
  assert(content.includes('#DC2626') && content.includes('*'), 'Test 5.2: Required fields indicate mandatory red asterisk *');

  // ── Test 6: 4-Step Navigation ──
  assert(content.includes('1. Academic Mapping & Dates') || content.includes('Academic Mapping &amp; Dates'), 'Test 6.1: Step 1 Navigation present');
  assert(content.includes('2. Subjects') || content.includes('Subjects ('), 'Test 6.2: Step 2 Navigation present');
  assert(content.includes('3. Fees & Late Fee Rules') || content.includes('Fees &amp; Late Fee Rules'), 'Test 6.3: Step 3 Navigation present');
  assert(content.includes('4. Notesheet Link & Review') || content.includes('Notesheet Link &amp; Review'), 'Test 6.4: Step 4 Navigation present');

  // ── Test 7: Button Hierarchy & Actions ──
  assert(content.includes('Cancel'), 'Test 7.1: Cancel button present');
  assert(content.includes('Save as Draft'), 'Test 7.2: Save as Draft button present');
  assert(content.includes('Save & Publish Form Window') || content.includes('Save &amp; Publish Form Window'), 'Test 7.3: Save & Publish Form Window button present');
  assert(content.includes('handleSaveExam'), 'Test 7.4: Existing handleSaveExam handler connected');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 EXAMINATION SESSION MODAL UI TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
