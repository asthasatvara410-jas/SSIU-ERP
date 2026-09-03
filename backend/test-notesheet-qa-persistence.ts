import { db } from '../src/services/db';
import { qaTestingService, INITIAL_MANUAL_TEST_RECORDS } from '../src/services/qaTestingService';
import { User, ManualTestRecord, ManualTestStatus } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`❌ FAIL: ${testName}`);
    if (failureDetails) {
      console.error('   Details:', failureDetails);
    }
  }
}

async function runQAPersistenceTestSuite() {
  console.log('======================================================================');
  console.log('🧪 SSIU ERP NOTESHEET QA & MANUAL TESTING PERSISTENCE TEST SUITE');
  console.log('======================================================================\n');

  const qaActor: User = {
    id: 'user-qa-lead',
    name: 'Lead QA Engineer',
    email: 'qa.lead@ssiu.edu.in',
    role: 'SUPER_ADMIN'
  };

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: INITIAL RETRIEVAL & DEFAULT RECONNECTION
  // ──────────────────────────────────────────────────────────────────────────
  const initialTests = qaTestingService.getManualTests();
  assert(initialTests.length >= 10, 'Test 1.1: Pre-seeded manual test records loaded into system');
  
  const nsTest = initialTests.find(t => t.testId === 'TC-NS-001');
  assert(!!nsTest, 'Test 1.2: Notesheet Organogram test case (TC-NS-001) exists');
  assert(nsTest?.module === 'Notesheet', 'Test 1.3: Module is correctly set to Notesheet');
  assert(nsTest?.status === 'Pass', 'Test 1.4: Initial status is Pass');

  const hrmsTest = initialTests.find(t => t.testId === 'TC-HR-001');
  assert(!!hrmsTest, 'Test 1.5: HRMS Employee Onboarding test case (TC-HR-001) exists');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: METRICS & KPI CARDS CALCULATION
  // ──────────────────────────────────────────────────────────────────────────
  const metrics = qaTestingService.getQASummaryMetrics();
  assert(metrics.total >= 10, 'Test 2.1: Total test count matches registered items');
  assert(metrics.passed > 0, 'Test 2.2: Passed test count is positive');
  assert(metrics.pending > 0, 'Test 2.3: Pending test count is positive');
  assert(metrics.passRate > 0 && metrics.passRate <= 100, 'Test 2.4: Pass rate percentage is between 1% and 100%');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: CREATING NEW MANUAL TEST RECORD & DUPLICATE PREVENTION
  // ──────────────────────────────────────────────────────────────────────────
  const customTestId = `TC-TEST-${Date.now()}`;
  const createRes = qaTestingService.createTestRecord({
    testId: customTestId,
    module: 'Notesheet',
    feature: 'Budget Head Allocation Guard',
    testScenario: 'Verify Notesheet creation blocks submission if allocated fund account has insufficient uncommitted balance.',
    testType: 'Validation',
    expectedResult: 'System displays error alert and blocks forward action.',
    actualResult: 'Pending verification',
    status: 'Pending',
    priority: 'HIGH',
    remarks: 'Automated test suite creation',
    bugIssue: 'None'
  }, qaActor);

  assert(createRes.success === true, 'Test 3.1: Create new manual test record succeeds');
  assert(createRes.test?.testId === customTestId, 'Test 3.2: Created test ID matches specified identifier');
  assert(createRes.test?.status === 'Pending', 'Test 3.3: Initial status is Pending');
  assert(createRes.test?.history.length === 1, 'Test 3.4: Creation audit history entry logged');

  // Duplicate test ID prevention
  const dupCreateRes = qaTestingService.createTestRecord({
    testId: customTestId, // Duplicate
    module: 'Notesheet',
    feature: 'Duplicate Attempt',
    testScenario: 'Duplicate scenario',
    testType: 'Manual',
    expectedResult: 'Should be blocked'
  }, qaActor);

  assert(dupCreateRes.success === false, 'Test 3.5: Duplicate Test ID creation strictly blocked');
  assert(dupCreateRes.message.includes('already exists'), 'Test 3.6: Informative duplicate error message returned');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: STATUS TRANSITION LIFECYCLE & AUDIT HISTORY
  // ──────────────────────────────────────────────────────────────────────────
  const testRecordId = createRes.test!.id;

  // Transition 1: Mark as Fail with bug issue
  const failRes = qaTestingService.updateTestRecord(testRecordId, {
    status: 'Fail',
    actualResult: 'Submission was allowed with negative balance.',
    bugIssue: 'Missing server-side fund balance threshold check',
    remarks: 'Failed on testing with ₹5,00,000 budget claim.'
  }, qaActor);

  assert(failRes.success === true, 'Test 4.1: Update status to Fail succeeds');
  assert(failRes.test?.status === 'Fail', 'Test 4.2: Current status updated to Fail');
  assert(failRes.test?.history.length === 2, 'Test 4.3: History contains 2 transition records');
  assert(failRes.test?.history[0].previousStatus === 'Pending' && failRes.test?.history[0].newStatus === 'Fail', 'Test 4.4: History captures Pending -> Fail transition');

  // Transition 2: Mark as Fixed
  const fixedRes = qaTestingService.updateTestRecord(testRecordId, {
    status: 'Fixed',
    remarks: 'Patch applied in fundAllocationGuard.ts to reject over-budget.',
    fixStatus: 'Fixed'
  }, qaActor);

  assert(fixedRes.success === true, 'Test 4.5: Update status to Fixed succeeds');
  assert(fixedRes.test?.status === 'Fixed', 'Test 4.6: Current status updated to Fixed');
  assert(fixedRes.test?.history.length === 3, 'Test 4.7: History captures Fail -> Fixed transition');

  // Transition 3: Mark as Retest Required
  const retestRes = qaTestingService.updateTestRecord(testRecordId, {
    status: 'Retest Required',
    remarks: 'Ready for re-execution in staging environment.'
  }, qaActor);

  assert(retestRes.success === true, 'Test 4.8: Update status to Retest Required succeeds');
  assert(retestRes.test?.status === 'Retest Required', 'Test 4.9: Current status is Retest Required');
  assert(retestRes.test?.history.length === 4, 'Test 4.10: History captures Fixed -> Retest Required transition');

  // Transition 4: Mark as Pass
  const passRes = qaTestingService.updateTestRecord(testRecordId, {
    status: 'Pass',
    actualResult: 'System correctly displayed "Insufficient Fund Balance" modal and prevented forwarding.',
    retestResult: 'Pass',
    fixStatus: 'Verified',
    remarks: 'Verified complete end-to-end fix.'
  }, qaActor);

  assert(passRes.success === true, 'Test 4.11: Update status to Pass succeeds');
  assert(passRes.test?.status === 'Pass', 'Test 4.12: Final status is Pass');
  assert(passRes.test?.history.length === 5, 'Test 4.13: Full 5-stage lifecycle history preserved');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 5: PERSISTENCE ACROSS STATE RELOAD
  // ──────────────────────────────────────────────────────────────────────────
  // Simulate database reload / persistence check
  const reloadedDbRecord = db.getManualTestRecordById(testRecordId);
  assert(!!reloadedDbRecord, 'Test 5.1: Test record retrieved from central db state');
  assert(reloadedDbRecord?.status === 'Pass', 'Test 5.2: Persisted status matches latest Pass status');
  assert(reloadedDbRecord?.history.length === 5, 'Test 5.3: Persisted history retains all 5 chronological transitions');
  assert(reloadedDbRecord?.fixStatus === 'Verified', 'Test 5.4: Persisted fix status is Verified');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 6: FILTERING & PENDING TESTING VIEW
  // ──────────────────────────────────────────────────────────────────────────
  const allFilteredTests = qaTestingService.getManualTests({ module: 'Notesheet' });
  assert(allFilteredTests.every(t => t.module.toLowerCase() === 'notesheet'), 'Test 6.1: Module filter correctly filters by Notesheet');

  const pendingFilterTests = qaTestingService.getManualTests({ status: 'Pending' });
  assert(pendingFilterTests.every(t => t.status === 'Pending'), 'Test 6.2: Status filter correctly isolates Pending records');

  const searchTests = qaTestingService.getManualTests({ searchQuery: customTestId });
  assert(searchTests.length === 1 && searchTests[0].testId === customTestId, 'Test 6.3: Search by Test ID finds exact record');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 7: CLEANUP / DELETE VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  const delRes = qaTestingService.deleteTestRecord(testRecordId);
  assert(delRes.success === true, 'Test 7.1: Delete test record succeeds');
  assert(!db.getManualTestRecordById(testRecordId), 'Test 7.2: Deleted record no longer present in db state');

  console.log('\n======================================================================');
  console.log(`🏁 QA PERSISTENCE TEST SUITE RESULTS: ${passedTests} PASSED | ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runQAPersistenceTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
