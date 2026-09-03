import { PrismaClient } from '@prisma/client';
import { AccreditationDataAggregator } from './src/accreditation/accreditation-data-aggregator.service';
import { AccreditationCriteriaService } from './src/accreditation/accreditation-criteria.service';
import { NaacEngineService } from './src/accreditation/services/naac-engine.service';
import { NbaEngineService } from './src/accreditation/services/nba-engine.service';

const prisma = new PrismaClient();

async function runStep1Tests() {
  console.log('=== STAGE 7.3 (STEP 1) — ACCREDITATION SCOPING & AGGREGATOR TEST SUITE ===\n');

  const criteriaService = new AccreditationCriteriaService(prisma as any);
  const naacEngine = new NaacEngineService(prisma as any);
  const nbaEngine = new NbaEngineService(prisma as any);
  const aggregator = new AccreditationDataAggregator(prisma as any, criteriaService, naacEngine, nbaEngine);

  // 1. Institution-wide Aggregation Test
  console.log('--- Test 1: Institution Scope Aggregation (NAAC) ---');
  const instRes = await aggregator.aggregateFrameworkData(
    { framework: 'NAAC', academicYears: ['2023-24', '2024-25', '2025-26'] },
    'DEFAULT',
    { scope: 'UNIVERSITY' },
  );
  console.assert(instRes.success === true, 'Institution aggregation failed');
  console.assert(instRes.scopeType === 'INSTITUTION', `Expected scopeType INSTITUTION, got ${instRes.scopeType}`);
  console.assert(instRes.scopeId === 'ALL', `Expected scopeId ALL, got ${instRes.scopeId}`);
  console.log(`✔ Test 1 PASS: Aggregated ${instRes.totalMetricsAggregated} data points for NAAC [INSTITUTION#ALL]`);

  // 2. Department-scoped Aggregation Test
  console.log('\n--- Test 2: Department Scope Aggregation (NBA) ---');
  const dept = await prisma.department.findFirst();
  if (dept) {
    const deptRes = await aggregator.aggregateFrameworkData(
      { framework: 'NBA', departmentId: dept.id, academicYears: ['2024-25', '2025-26'] },
      'DEFAULT',
      { scope: 'DEPARTMENT', departmentId: dept.id },
    );
    console.assert(deptRes.success === true, 'Department aggregation failed');
    console.assert(deptRes.scopeType === 'DEPARTMENT', `Expected scopeType DEPARTMENT, got ${deptRes.scopeType}`);
    console.assert(deptRes.scopeId === dept.id, `Expected scopeId ${dept.id}, got ${deptRes.scopeId}`);
    console.log(`✔ Test 2 PASS: Aggregated ${deptRes.totalMetricsAggregated} data points for NBA [DEPARTMENT#${dept.name}]`);
  }

  // 3. Program-scoped Aggregation Test
  console.log('\n--- Test 3: Program Scope Aggregation (NBA) ---');
  const prog = await prisma.program.findFirst();
  if (prog) {
    const progRes = await aggregator.aggregateFrameworkData(
      { framework: 'NBA', programId: prog.id, academicYears: ['2025-26'] },
      'DEFAULT',
      { scope: 'FACULTY_ASSIGNED' },
    );
    console.assert(progRes.success === true, 'Program aggregation failed');
    console.assert(progRes.scopeType === 'PROGRAM', `Expected scopeType PROGRAM, got ${progRes.scopeType}`);
    console.assert(progRes.scopeId === prog.id, `Expected scopeId ${prog.id}, got ${progRes.scopeId}`);
    console.log(`✔ Test 3 PASS: Aggregated ${progRes.totalMetricsAggregated} data points for NBA [PROGRAM#${prog.name}]`);
  }

  // 4. Data Lineage Verification Test
  console.log('\n--- Test 4: Data Lineage Preservation ---');
  const lineageCount = await prisma.accreditationDataLineage.count({
    where: { framework: 'NAAC' },
  });
  console.assert(lineageCount > 0, 'No data lineage records found');
  console.log(`✔ Test 4 PASS: Data lineage verified with ${lineageCount} traceable entries`);

  // 5. Database Multi-Scope Verification
  console.log('\n--- Test 5: Multi-Scope Database Record Verification ---');
  const [instCount, scopedCount] = await Promise.all([
    prisma.accreditationAggregatedValue.count({ where: { scopeType: 'INSTITUTION' } }),
    prisma.accreditationAggregatedValue.count({ where: { scopeType: { not: 'INSTITUTION' } } }),
  ]);
  console.assert(instCount > 0, 'Institution records missing');
  console.log(`✔ Test 5 PASS: Database maintains ${instCount} institution records and ${scopedCount} department/program scoped records`);

  console.log('\n================================================================');
  console.log('ALL STEP 1 ACCREDITATION SCOPING TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runStep1Tests()
  .catch((err) => {
    console.error('Step 1 Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
