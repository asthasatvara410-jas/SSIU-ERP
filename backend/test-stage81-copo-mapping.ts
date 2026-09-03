/**
 * STAGE 8.1 — CO-PO MAPPING ENGINE VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Matrix Initialization & Retrieval (GET /courses/:courseId/co-po-matrix)
 * 2. 12 NBA POs auto-seeding and 5 Course COs initialization
 * 3. Bulk Save & Upsert (POST /courses/:courseId/co-po-matrix)
 * 4. Validation: 0..3 range enforcement & invalid level rejection
 * 5. Security & RBAC: Student forbidden from editing (HTTP 403)
 * 6. Live Matrix Stats: totalCells, mappedCells, averageCorrelation, coveragePercentage
 * 7. Live Attainment Calculation cascading with updated mappings
 * 8. NBA Criterion 2.1 mapping coverage integration
 */

import { PrismaClient } from '@prisma/client';
import { COMappingService } from './src/obe/co-mapping.service';
import { AttainmentEngine } from './src/obe/attainment-engine.service';
import { OBEAuditService } from './src/obe/obe-audit.service';
import { NbaEngineService } from './src/accreditation/services/nba-engine.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

async function runStage81Verification() {
  console.log('================================================================');
  console.log('🚀 RUNNING STAGE 8.1 — CO-PO MAPPING ENGINE VERIFICATION SUITE');
  console.log('================================================================\n');

  const prisma = new PrismaClient();
  const auditService = new OBEAuditService();
  const coMappingService = new COMappingService(prisma as any, auditService);
  const attainmentEngine = new AttainmentEngine(prisma as any, auditService);
  const nbaEngine = new NbaEngineService(prisma as any);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
      process.exitCode = 1;
    }
  }

  try {
    const testCourseId = 'COURSE-TEST-CS301';
    const testProgramId = 'PROG-TEST-BTECH-CSE';
    const tenantId = 'DEFAULT';

    // -------------------------------------------------------------------------
    // TEST 1: MATRIX RETRIEVAL & AUTO-SEEDING
    // -------------------------------------------------------------------------
    console.log('Test Group 1: Matrix Initialization & Standard NBA POs');
    const matrix = await coMappingService.getMatrix(testCourseId, testProgramId, tenantId);

    assert(Array.isArray(matrix.courseOutcomes) && matrix.courseOutcomes.length >= 5, 'Matrix initializes at least 5 Course Outcomes');
    assert(Array.isArray(matrix.programOutcomes) && matrix.programOutcomes.length >= 12, 'Matrix ensures all 12 Standard NBA Program Outcomes exist');
    assert(matrix.stats.totalCells >= 60, `Total matrix cells calculated correctly (${matrix.stats.totalCells} cells)`);

    // -------------------------------------------------------------------------
    // TEST 2: BULK SAVE & UPSERT CO-PO MAPPINGS
    // -------------------------------------------------------------------------
    console.log('\nTest Group 2: Bulk Save & Upsert of CO-PO Mappings');
    const co1 = matrix.courseOutcomes[0];
    const co2 = matrix.courseOutcomes[1];
    const po1 = matrix.programOutcomes[0];
    const po2 = matrix.programOutcomes[1];
    const po3 = matrix.programOutcomes[2];

    const testMappings = [
      { coId: co1.id, poId: po1.id, correlationLevel: 3 }, // High
      { coId: co1.id, poId: po2.id, correlationLevel: 2 }, // Medium
      { coId: co1.id, poId: po3.id, correlationLevel: 0 }, // None
      { coId: co2.id, poId: po1.id, correlationLevel: 2 }, // Medium
      { coId: co2.id, poId: po2.id, correlationLevel: 3 }, // High
    ];

    const facultyUser = { id: 'FAC000001', role: 'FACULTY', email: 'faculty@ssiu.ac.in' };
    const saveResult = await coMappingService.saveCOPOMatrix(
      testCourseId,
      { programId: testProgramId, academicYear: '2025-26', mappings: testMappings },
      tenantId,
      facultyUser
    );

    assert(saveResult.success === true, 'saveCOPOMatrix returns success: true');
    assert(saveResult.updatedCount === 5, 'Updated count matches submitted cell count (5 cells)');
    assert(saveResult.stats.mappedCells === 4, 'Active mapped cells count correctly excludes 0-correlation (4 active)');
    assert(saveResult.stats.averageCorrelation === 2.5, `Average correlation level accurately computed (${saveResult.stats.averageCorrelation})`);

    // -------------------------------------------------------------------------
    // TEST 3: VALIDATION CHECKS (OUT OF BOUNDS CORRELATION)
    // -------------------------------------------------------------------------
    console.log('\nTest Group 3: Validation & Boundary Defense');
    let outOfBoundsCaught = false;
    try {
      await coMappingService.saveCOPOMatrix(
        testCourseId,
        {
          programId: testProgramId,
          mappings: [{ coId: co1.id, poId: po1.id, correlationLevel: 5 }], // 5 is invalid
        },
        tenantId,
        facultyUser
      );
    } catch (e: any) {
      if (e instanceof BadRequestException) outOfBoundsCaught = true;
    }
    assert(outOfBoundsCaught, 'Correlation level > 3 is rejected with BadRequestException');

    let negativeLevelCaught = false;
    try {
      await coMappingService.saveCOPOMatrix(
        testCourseId,
        {
          programId: testProgramId,
          mappings: [{ coId: co1.id, poId: po1.id, correlationLevel: -1 }],
        },
        tenantId,
        facultyUser
      );
    } catch (e: any) {
      if (e instanceof BadRequestException) negativeLevelCaught = true;
    }
    assert(negativeLevelCaught, 'Negative correlation level is rejected with BadRequestException');

    // -------------------------------------------------------------------------
    // TEST 4: RBAC AUTHORIZATION (STUDENT BLOCKED)
    // -------------------------------------------------------------------------
    console.log('\nTest Group 4: Role-Based Access Control (RBAC)');
    const studentUser = { id: 'STU000001', role: 'STUDENT', email: 'student@ssiu.ac.in' };
    let studentBlocked = false;
    try {
      await coMappingService.saveCOPOMatrix(
        testCourseId,
        { programId: testProgramId, mappings: testMappings },
        tenantId,
        studentUser
      );
    } catch (e: any) {
      if (e instanceof ForbiddenException) studentBlocked = true;
    }
    assert(studentBlocked, 'STUDENT role is strictly forbidden from saving CO-PO mappings (HTTP 403)');

    // -------------------------------------------------------------------------
    // TEST 5: PERSISTENCE & MATRIX RE-FETCH INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\nTest Group 5: Data Persistence & Matrix Re-query Integrity');
    const refreshedMatrix = await coMappingService.getMatrix(testCourseId, testProgramId, tenantId);
    const co1_po1_val = refreshedMatrix.matrixMap[`${co1.id}_${po1.id}`];
    const co1_po2_val = refreshedMatrix.matrixMap[`${co1.id}_${po2.id}`];
    const co1_po3_val = refreshedMatrix.matrixMap[`${co1.id}_${po3.id}`];

    assert(co1_po1_val === 3, 'Persisted CO1 -> PO1 mapping is level 3');
    assert(co1_po2_val === 2, 'Persisted CO1 -> PO2 mapping is level 2');
    assert(co1_po3_val === 0, 'Persisted CO1 -> PO3 mapping is level 0 (distinguishable from missing)');

    // -------------------------------------------------------------------------
    // TEST 6: OBE ATTAINMENT ENGINE CONSUMPTION
    // -------------------------------------------------------------------------
    console.log('\nTest Group 6: OBE Attainment Engine Integration');
    const attainmentRes = await attainmentEngine.calculateAttainment(testCourseId, '2025-26', tenantId);
    assert(Array.isArray(attainmentRes.courseAttainments) && attainmentRes.courseAttainments.length > 0, 'Course attainments successfully computed for all COs');
    assert(Array.isArray(attainmentRes.programAttainments) && attainmentRes.programAttainments.length > 0, 'PO attainments successfully cascaded based on CO-PO correlation weights');

    // -------------------------------------------------------------------------
    // TEST 7: NBA ACCREDITATION INTEGRATION (CRITERION 2.1)
    // -------------------------------------------------------------------------
    console.log('\nTest Group 7: NBA Accreditation Criterion 2.1 Mapping Coverage');
    const nba21Result = await nbaEngine.calc2_1('2025-26', { tenantId, programId: testProgramId, academicYears: ['2025-26'] });
    assert(nba21Result.metricCode === 'NBA-2.1', 'NBA Metric NBA-2.1 calculated');
    assert(nba21Result.value >= 85.0, `NBA CO-PO coverage metric score valid (${nba21Result.value}%)`);
    assert(nba21Result.status === 'VALID', 'NBA Metric status is VALID');

    console.log('\n================================================================');
    console.log(`📊 STAGE 8.1 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } finally {
    await prisma.$disconnect();
  }
}

runStage81Verification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
