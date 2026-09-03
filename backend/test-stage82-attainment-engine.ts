import { PrismaClient } from '@prisma/client';
import { AttainmentEngine } from './src/obe/attainment-engine.service';
import { OBEAuditService } from './src/obe/obe-audit.service';
import { COMappingService } from './src/obe/co-mapping.service';

async function runStage82Tests() {
  const prisma = new PrismaClient();
  const auditService = new OBEAuditService();
  const attainmentEngine = new AttainmentEngine(prisma as any, auditService);
  const coMappingService = new COMappingService(prisma as any, auditService);

  console.log('====================================================');
  console.log('🚀 STAGE 8.2 — OBE ATTAINMENT ENGINE TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  const testTenantId = 'TENANT-TEST-82';
  const testProgramId = 'PROG-BTECH-CSE';
  const testCourseId = 'COURSE-CS301';
  const testAcademicYear = '2025-26';

  try {
    // 0. Ensure seed COs, POs and PSOs exist
    console.log('--- Step 0: Ensure Test OBE Setup ---');
    const matrixRes = await coMappingService.getMatrix(testCourseId, testProgramId, testTenantId);
    assert(matrixRes.courseOutcomes.length >= 4, 'Test Course Outcomes seeded (>= 4 COs)');
    assert(matrixRes.programOutcomes.length === 12, 'Standard NBA 12 POs seeded');

    // Ensure PSOs exist
    const pso1 = await prisma.programSpecificOutcome.upsert({
      where: {
        programId_code_version_tenantId: {
          programId: testProgramId,
          code: 'PSO1',
          version: 'v1.0',
          tenantId: testTenantId,
        },
      },
      create: {
        tenantId: testTenantId,
        programId: testProgramId,
        code: 'PSO1',
        description: 'Software Architecture & Enterprise Systems',
      },
      update: {},
    });

    const pso2 = await prisma.programSpecificOutcome.upsert({
      where: {
        programId_code_version_tenantId: {
          programId: testProgramId,
          code: 'PSO2',
          version: 'v1.0',
          tenantId: testTenantId,
        },
      },
      create: {
        tenantId: testTenantId,
        programId: testProgramId,
        code: 'PSO2',
        description: 'Intelligent Systems & Cloud Engineering',
      },
      update: {},
    });

    // Map first 2 COs to PSOs
    const co1 = matrixRes.courseOutcomes[0];
    const co2 = matrixRes.courseOutcomes[1];

    await prisma.cOPSOMapping.upsert({
      where: {
        courseOutcomeId_programSpecificOutcomeId_tenantId: {
          courseOutcomeId: co1.id,
          programSpecificOutcomeId: pso1.id,
          tenantId: testTenantId,
        },
      },
      create: {
        tenantId: testTenantId,
        courseOutcomeId: co1.id,
        programSpecificOutcomeId: pso1.id,
        level: 3,
      },
      update: { level: 3 },
    });

    await prisma.cOPSOMapping.upsert({
      where: {
        courseOutcomeId_programSpecificOutcomeId_tenantId: {
          courseOutcomeId: co2.id,
          programSpecificOutcomeId: pso2.id,
          tenantId: testTenantId,
        },
      },
      create: {
        tenantId: testTenantId,
        courseOutcomeId: co2.id,
        programSpecificOutcomeId: pso2.id,
        level: 2,
      },
      update: { level: 2 },
    });
    assert(true, 'Test PSOs and CO-PSO mappings configured');

    // Populate CO-PO mappings
    const testMappings = [];
    for (let c = 0; c < matrixRes.courseOutcomes.length; c++) {
      for (let p = 0; p < matrixRes.programOutcomes.length; p++) {
        testMappings.push({
          coId: matrixRes.courseOutcomes[c].id,
          poId: matrixRes.programOutcomes[p].id,
          correlationLevel: (c + p) % 3 + 1, // Levels 1, 2, 3
        });
      }
    }
    await coMappingService.saveCOPOMatrix(
      testCourseId,
      { programId: testProgramId, academicYear: testAcademicYear, mappings: testMappings },
      testTenantId,
      { id: 'USER-FACULTY-01', role: 'FACULTY' }
    );
    assert(true, 'CO-PO matrix populated with correlation levels');

    // TEST 1: Calculate Attainment Flow
    console.log('\n--- Test 1: Full Attainment Calculation Flow ---');
    const attResult = await attainmentEngine.calculateAttainment(
      testCourseId,
      testProgramId,
      testAcademicYear,
      testTenantId,
      'USER-FACULTY-01'
    );

    assert(attResult.success === true, 'calculateAttainment returns success');
    assert(attResult.courseAttainments.length === matrixRes.courseOutcomes.length, 'All COs evaluated for attainment');
    assert(attResult.programAttainments.length > 0, 'Direct PO attainments calculated');
    assert(attResult.psoAttainments.length >= 2, 'PSO attainments calculated');

    // TEST 2: CO Attainment Thresholds and NBA 3-tier levels
    console.log('\n--- Test 2: CO Attainment Threshold Mapping ---');
    for (const ca of attResult.courseAttainments) {
      assert(ca.attainmentPercentage >= 0 && ca.attainmentPercentage <= 100, `CO ${ca.courseOutcomeCode} % in valid range`);
      if (ca.attainmentPercentage >= 75.0) {
        assert(ca.attainmentLevel === 3.0, `CO ${ca.courseOutcomeCode} >= 75% maps to Level 3.0`);
      } else if (ca.attainmentPercentage >= 65.0) {
        assert(ca.attainmentLevel === 2.0, `CO ${ca.courseOutcomeCode} >= 65% maps to Level 2.0`);
      }
    }

    // TEST 3: Direct PO Attainment weighted by Stage 8.1 Matrix
    console.log('\n--- Test 3: PO Attainment Weighting Logic ---');
    for (const pa of attResult.programAttainments) {
      assert(pa.directPercentage >= 0 && pa.directPercentage <= 100, `PO ${pa.poCode} Direct % valid`);
      assert(pa.totalMappedWeight > 0, `PO ${pa.poCode} has positive mapped correlation weight`);
      assert(pa.attainmentLevel >= 1.0 && pa.attainmentLevel <= 3.0, `PO ${pa.poCode} Level between 1.0 and 3.0`);
    }

    // TEST 4: Explainability Metadata
    console.log('\n--- Test 4: Explainability & NBA Audit Metadata ---');
    assert(attResult.metadata !== undefined, 'Metadata object present');
    assert(attResult.metadata.thresholds.level3 === 75.0, 'NBA Level 3 threshold is 75%');
    assert(attResult.metadata.weights.direct === 80.0, 'Direct weight is 80%');
    assert(attResult.metadata.weights.indirect === 20.0, 'Indirect weight is 20%');

    // TEST 5: Idempotency & Recalculation Safety
    console.log('\n--- Test 5: Idempotent Recalculation ---');
    const secondCalc = await attainmentEngine.calculateAttainment(
      testCourseId,
      testProgramId,
      testAcademicYear,
      testTenantId,
      'USER-FACULTY-01'
    );
    assert(secondCalc.courseAttainments.length === attResult.courseAttainments.length, 'Recalculation does not duplicate CO attainment records');
    assert(secondCalc.programAttainments.length === attResult.programAttainments.length, 'Recalculation does not duplicate PO attainment records');

    // TEST 6: Attainment Override by Authorized Role
    console.log('\n--- Test 6: Attainment Override Workflow ---');
    const targetCOAttainment = attResult.courseAttainments[0];
    const overrideRes = await attainmentEngine.overrideAttainment(
      {
        targetType: 'COURSE_CO',
        targetId: targetCOAttainment.id,
        overrideLevel: 3,
        overridePercentage: 88.5,
        reason: 'Verified additional external project evaluation score.',
      },
      testTenantId,
      { id: 'USER-HOD-01', role: 'HOD', name: 'Dr. Ramesh Sharma' }
    );
    assert(overrideRes.success === true, 'Authorized HOD override succeeded');
    assert(overrideRes.data.attainmentPercentage === 88.5, 'Overridden percentage persisted');

    // TEST 7: Attainment Override Rejected for Student
    console.log('\n--- Test 7: Attainment Override Rejected for Student ---');
    let studentBlocked = false;
    try {
      await attainmentEngine.overrideAttainment(
        {
          targetType: 'COURSE_CO',
          targetId: targetCOAttainment.id,
          overrideLevel: 3,
          overridePercentage: 99.0,
          reason: 'Student unauthorized modification',
        },
        testTenantId,
        { id: 'STUDENT-01', role: 'STUDENT' }
      );
    } catch (err: any) {
      if (err.message.includes('Students cannot override')) {
        studentBlocked = true;
      }
    }
    assert(studentBlocked, 'Student role forbidden from overriding attainment');

    // TEST 8: Query APIs
    console.log('\n--- Test 8: Attainment Summary Queries ---');
    const courseSummary = await attainmentEngine.getCourseAttainment(testCourseId, testTenantId);
    assert(courseSummary.length > 0, 'getCourseAttainment returns array of CO attainments');

    const progSummary = await attainmentEngine.getProgramAttainment(testProgramId, testTenantId);
    assert(progSummary.length > 0, 'getProgramAttainment returns array of PO attainments');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedCount}/${totalTests} STAGE 8.2 ATTAINMENT ENGINE TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage82Tests();
