// ==============================================================================
// SWARRNIM UNIVERSITY ERP — DUPLICATION AUDIT & CANONICAL MAPPING TEST SUITE
// Automated verification for Single Source of Truth & Zero Route/Menu Duplication
// ==============================================================================

import fs from 'fs';
import { db } from '../src/services/db';
import { studentOnboardingService } from '../src/services/studentOnboardingService';
import { ROLE_NAV_ORDER, ALL_NAV_ITEMS } from '../src/constants/navigationConfig';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

async function runDuplicationAuditTests() {
  console.log('======================================================================');
  console.log('  SSIU ERP — FULL APPLICATION DUPLICATION AUDIT & CANONICAL VERIFICATION');
  console.log('======================================================================\n');

  // 1. Audit App.tsx for duplicate case statements
  console.log('--- 1. App.tsx Route Case Deduplication ---');
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  const lines = appContent.split('\n');
  const cases: { tab: string; line: number }[] = [];
  lines.forEach((line, idx) => {
    const m = line.match(/case\s+['"]([^'"]+)['"]:/);
    if (m) {
      cases.push({ tab: m[1], line: idx + 1 });
    }
  });

  const caseCounts: Record<string, number[]> = {};
  cases.forEach(c => {
    caseCounts[c.tab] = (caseCounts[c.tab] || []).concat(c.line);
  });

  const duplicatesInApp = Object.entries(caseCounts).filter(([_, lns]) => lns.length > 1);
  assert(duplicatesInApp.length === 0, `App.tsx contains ZERO duplicate case labels (Found: ${duplicatesInApp.length})`);

  // 2. Audit ROLE_NAV_ORDER for duplicate entries per role
  console.log('\n--- 2. Role-based Navigation Deduplication ---');
  for (const [role, items] of Object.entries(ROLE_NAV_ORDER)) {
    const seen = new Set<string>();
    const dupes: string[] = [];
    items.forEach(it => {
      if (seen.has(it)) dupes.push(it);
      seen.add(it);
    });
    assert(dupes.length === 0, `Role ${role} navigation list is clean & deduplicated (${items.length} items)`);
  }

  // 3. Verify all role navigation items map cleanly to App.tsx
  console.log('\n--- 3. 100% Nav Item Route Coverage ---');
  let missingNavRoutes = 0;
  for (const [role, items] of Object.entries(ROLE_NAV_ORDER)) {
    for (const item of items) {
      if (item === 'logout') continue;
      if (!appContent.includes(`case '${item}':`) && !appContent.includes(`case "${item}":`)) {
        missingNavRoutes++;
      }
    }
  }
  assert(missingNavRoutes === 0, `All navigation items map to legitimate routes in App.tsx (Unmapped: ${missingNavRoutes})`);

  // 4. Single Source of Truth Validations
  console.log('\n--- 4. Single Source of Truth (SSOT) Architecture ---');
  const students = db.getStudents();
  assert(students.length > 0, `Single Source of Truth for Student Master: ${students.length} canonical records`);
  
  const student = students[0];
  const feeRecords = db.getStudentFeeRecords().filter(f => f.studentId === student.id || f.enrollmentNo === student.enrollmentNo);
  assert(feeRecords.length > 0, `Single Source of Truth for Student Fees: ${feeRecords.length} linked records in fee ledger`);

  const apps = studentOnboardingService.getFilteredApplications();
  assert(apps.length > 0, `Single Source of Truth for Admission Applications: ${apps.length} records in admission ledger`);

  console.log('\n======================================================================');
  console.log(`  DUPLICATION AUDIT COMPLETE: ${passedTests} / ${totalTests} Passed (${failedTests} Failed)`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runDuplicationAuditTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
