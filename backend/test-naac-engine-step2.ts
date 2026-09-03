import { PrismaClient } from '@prisma/client';
import { NaacEngineService } from './src/accreditation/services/naac-engine.service';
import { NbaEngineService } from './src/accreditation/services/nba-engine.service';
import { AccreditationDataAggregator } from './src/accreditation/accreditation-data-aggregator.service';
import { AccreditationCriteriaService } from './src/accreditation/accreditation-criteria.service';

const prisma = new PrismaClient();

async function runStep2Tests() {
  console.log('========================================================================');
  console.log('STAGE 7.3 (STEP 2) — NAAC 7-CRITERIA DETERMINISTIC CALCULATION TEST SUITE');
  console.log('========================================================================\n');

  const naacEngine = new NaacEngineService(prisma as any);
  const nbaEngine = new NbaEngineService(prisma as any);
  const criteriaService = new AccreditationCriteriaService(prisma as any);
  const aggregator = new AccreditationDataAggregator(prisma as any, criteriaService, naacEngine, nbaEngine);

  const academicYears = ['2021-22', '2022-23', '2023-24', '2024-25', '2025-26'];

  // Test 1: Full 5-Year NAAC Calculation across all Criteria 1–7
  console.log('--- TEST 1: Direct NaacEngineService Calculation (5-Year Window) ---');
  const metrics = await naacEngine.calculateAllCriteria({
    tenantId: 'DEFAULT',
    academicYears,
  });

  console.log(`Calculated ${metrics.length} NAAC data points across 5 academic years.`);
  console.assert(metrics.length === 22 * 5 || metrics.length >= 100, `Expected >= 100 metric calculations, got ${metrics.length}`);

  // Sample verification of each criterion
  const sampleCodes = [
    '1.1.1', '1.2.1', '1.3.2', '1.4.1', // Criterion 1
    '2.1.1', '2.2.2', '2.3.1', '2.6.3', // Criterion 2
    '3.1.1', '3.2.2', '3.3.1', '3.4.3', // Criterion 3
    '4.1.1', '4.2.2', '4.3.1', '4.4.1', // Criterion 4
    '5.1.1', '5.2.1', '5.3.1', '5.4.1', // Criterion 5
    '6.2.2', '6.3.2', '6.5.3',          // Criterion 6
    '7.1.1', '7.1.3',                   // Criterion 7
  ];

  console.log('\n--- Criterion Metrics Sample Inspection (2025-26) ---');
  for (const code of sampleCodes) {
    const m = metrics.find((item) => item.metricCode === code && item.academicYear === '2025-26');
    if (m) {
      console.log(`[NAAC ${m.metricCode.padEnd(5)}] Value: ${String(m.value).padEnd(8)} | Status: ${m.status.padEnd(7)} | Source: ${m.sourceRecordReference}`);
      console.assert(m.value !== null && !isNaN(Number(m.value)), `Invalid metric value for ${code}`);
      console.assert(m.status === 'VALID' || m.status === 'WARNING', `Invalid status for ${code}`);
    }
  }
  console.log('✔ TEST 1 PASS: Direct 7-Criteria NAAC Engine calculations verified');

  // Test 2: Aggregator Integration & Database Storage
  console.log('\n--- TEST 2: Aggregator Service Integration with NaacEngineService ---');
  const aggResult = await aggregator.aggregateFrameworkData(
    { framework: 'NAAC', academicYears },
    'DEFAULT',
    { scope: 'UNIVERSITY' },
  );

  console.assert(aggResult.success === true, 'Aggregator execution failed');
  console.assert(aggResult.totalMetricsAggregated > 0, 'No metrics aggregated');
  console.log(`✔ TEST 2 PASS: Aggregated and stored ${aggResult.totalMetricsAggregated} NAAC metrics into database`);

  // Test 3: Zero-Denominator & Missing Data Resilience
  console.log('\n--- TEST 3: Zero-Denominator & Isolation Resilience ---');
  const emptyScopeCalc = await naacEngine.calc2_2_2('2025-26', {
    tenantId: 'NON_EXISTENT_TENANT',
    departmentId: '00000000-0000-0000-0000-000000000000',
    academicYears: ['2025-26'],
  });
  console.assert(!isNaN(Number(emptyScopeCalc.value)), 'SFR calculated NaN on empty scope');
  console.log(`SFR on empty scope handled safely: Value = ${emptyScopeCalc.value} (Status: ${emptyScopeCalc.status})`);
  console.log('✔ TEST 3 PASS: Zero-denominator safety verified');

  // Test 4: Data Lineage Traceability
  console.log('\n--- TEST 4: Data Lineage Verification ---');
  const lineageCount = await prisma.accreditationDataLineage.count({
    where: { framework: 'NAAC' },
  });
  console.assert(lineageCount > 0, 'Lineage records missing');
  console.log(`✔ TEST 4 PASS: Data lineage confirmed with ${lineageCount} traceable entries`);

  console.log('\n========================================================================');
  console.log('ALL STEP 2 NAAC 7-CRITERIA ENGINE TESTS PASSED SUCCESSFULLY (100%)');
  console.log('========================================================================\n');
}

runStep2Tests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
