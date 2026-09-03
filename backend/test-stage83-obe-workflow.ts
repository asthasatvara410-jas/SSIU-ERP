import { PrismaClient } from '@prisma/client';
import { OBEService } from './src/obe/obe.service';
import { CourseOutcomeService } from './src/obe/course-outcome.service';
import { ProgramOutcomeService } from './src/obe/program-outcome.service';
import { ProgramSpecificOutcomeService } from './src/obe/program-specific-outcome.service';
import { COMappingService } from './src/obe/co-mapping.service';
import { AssessmentMappingService } from './src/obe/assessment-mapping.service';
import { AttainmentEngine } from './src/obe/attainment-engine.service';
import { OBEValidationService } from './src/obe/obe-validation.service';
import { OBEReportService } from './src/obe/obe-report.service';
import { OBEAuditService } from './src/obe/obe-audit.service';

const prisma = new PrismaClient();

async function runStage83Tests() {
  console.log('====================================================');
  console.log('🚀 STAGE 8.3 — OBE WORKFLOW & MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  const auditService = new OBEAuditService();
  const coService = new CourseOutcomeService(prisma as any);
  const poService = new ProgramOutcomeService(prisma as any);
  const psoService = new ProgramSpecificOutcomeService(prisma as any);
  const coMappingService = new COMappingService(prisma as any, auditService);
  const assessmentMappingService = new AssessmentMappingService(prisma as any);
  const attainmentEngine = new AttainmentEngine(prisma as any, auditService);
  const validationService = new OBEValidationService(prisma as any);
  const reportService = new OBEReportService(prisma as any);

  const obeService = new OBEService(
    prisma as any,
    coService,
    poService,
    psoService,
    coMappingService,
    assessmentMappingService,
    attainmentEngine,
    validationService,
    reportService,
    auditService,
  );

  const TEST_TENANT = 'TENANT-TEST-83';
  const TEST_PROGRAM = 'PROG-TEST-CSE-83';
  const TEST_COURSE = 'COURSE-TEST-CS830';
  const TEST_ACADEMIC_YEAR = '2025-26';

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  try {
    // --- Step 0: Ensure Test Seed Data ---
    console.log('--- Step 0: Ensure Test Seed Data ---');
    const matrixRes = await coMappingService.getMatrix(TEST_COURSE, TEST_PROGRAM, TEST_TENANT);
    const cos = matrixRes.courseOutcomes;
    assert(cos.length >= 4, 'Course outcomes initialized for test course');

    const pos = matrixRes.programOutcomes;
    assert(pos.length >= 12, '12 Standard NBA Program Outcomes available');

    // --- Test 1: PSO Lifecycle & Auto-Seeding ---
    console.log('\n--- Test 1: Program Specific Outcomes (PSO) ---');
    const psos = await psoService.listByProgram(TEST_PROGRAM, TEST_TENANT);
    assert(psos.length >= 2, 'PSOs automatically seeded for program (>= 2 PSOs)');
    assert(psos.some(p => p.code === 'PSO1'), 'PSO1 exists for technical specializations');
    assert(psos.some(p => p.code === 'PSO2'), 'PSO2 exists for emerging tech & cloud');

    // --- Test 2: Interactive CO-PSO Matrix Bulk Persistence ---
    console.log('\n--- Test 2: CO-PSO Matrix Bulk Mapping ---');
    const psoMappings = [
      { courseOutcomeId: cos[0].id, programSpecificOutcomeId: psos[0].id, level: 3 },
      { courseOutcomeId: cos[0].id, programSpecificOutcomeId: psos[1].id, level: 2 },
      { courseOutcomeId: cos[1].id, programSpecificOutcomeId: psos[0].id, level: 2 },
      { courseOutcomeId: cos[1].id, programSpecificOutcomeId: psos[1].id, level: 3 },
      { courseOutcomeId: cos[2].id, programSpecificOutcomeId: psos[0].id, level: 3 },
      { courseOutcomeId: cos[3].id, programSpecificOutcomeId: psos[1].id, level: 2 },
    ];

    const psoSaveRes = await obeService.saveCOPSOMatrix(
      TEST_COURSE,
      { programId: TEST_PROGRAM, academicYear: TEST_ACADEMIC_YEAR, mappings: psoMappings },
      TEST_TENANT,
      { id: 'FAC-TEST-01', role: 'FACULTY' }
    );
    assert(psoSaveRes.success === true, 'saveCOPSOMatrix returns success: true');
    assert(psoSaveRes.updatedCount === 6, 'Saved 6 CO-PSO correlation cells');

    // Verify student rejection on CO-PSO matrix
    let studentBlockedPSO = false;
    try {
      await obeService.saveCOPSOMatrix(
        TEST_COURSE,
        { programId: TEST_PROGRAM, mappings: psoMappings },
        TEST_TENANT,
        { id: 'STU-001', role: 'STUDENT' }
      );
    } catch {
      studentBlockedPSO = true;
    }
    assert(studentBlockedPSO === true, 'STUDENT role forbidden from modifying CO-PSO mappings (HTTP 403)');

    // --- Test 3: Assessment Mapping Batch Persistence ---
    console.log('\n--- Test 3: Assessment Question & Tool to CO Mapping ---');
    const asmRes = await obeService.listAssessments(TEST_COURSE, TEST_TENANT);
    assert(Array.isArray(asmRes), 'listAssessments returns an array');
    assert(asmRes.length > 0, 'Course assessments mapped (CIE & SEE components)');

    const batchAsmRes = await obeService.mapAssessmentBatch(
      {
        mappings: [
          { assessmentId: 'ASM-CIE-MIDSEM', courseOutcomeId: cos[0].id, weight: 0.3, maxMarks: 30 },
          { assessmentId: 'ASM-CIE-LAB', courseOutcomeId: cos[1].id, weight: 0.2, maxMarks: 20 },
          { assessmentId: 'ASM-SEE-ENDSEM', courseOutcomeId: cos[2].id, weight: 0.5, maxMarks: 50 },
        ],
      },
      TEST_TENANT
    );
    assert(batchAsmRes.success === true, 'mapAssessmentBatch succeeds');
    assert(batchAsmRes.updatedCount === 3, 'Persisted 3 assessment weight mappings');

    // --- Test 4: OBE Validation Engine Checks ---
    console.log('\n--- Test 4: OBE Validation & Compliance Checks ---');
    const valRes = await obeService.validateCourse(TEST_COURSE, TEST_TENANT);
    assert(valRes.coCount >= 4, 'Validation identifies defined COs count');
    assert(typeof valRes.isValid === 'boolean', 'Validation returns boolean compliance state');
    assert(Array.isArray(valRes.warnings), 'Validation returns warnings list');

    // --- Test 5: CQI Continuous Improvement Actions Lifecycle ---
    console.log('\n--- Test 5: CQI Improvement Actions Lifecycle ---');
    const actRes = await obeService.createImprovementAction(
      {
        courseId: TEST_COURSE,
        courseOutcomeId: cos[2].id,
        issue: 'CO3 Database indexing attainment below 75% target.',
        action: 'Schedule 2 hands-on laboratory optimization workshops.',
        owner: 'Prof. Ananya Roy',
        dueDate: '2026-10-15',
      },
      TEST_TENANT
    );
    assert(actRes.id !== undefined, 'Created CQI Improvement action with ID');
    assert(actRes.status === 'OPEN', 'Initial CQI action status is OPEN');

    // Update status to IN_PROGRESS
    await obeService.updateImprovementActionStatus(actRes.id, 'IN_PROGRESS', TEST_TENANT);
    let allActions = await obeService.listImprovementActions(TEST_COURSE, TEST_TENANT);
    let updatedAction = allActions.find(a => a.id === actRes.id);
    assert(updatedAction?.status === 'IN_PROGRESS', 'CQI action updated to IN_PROGRESS');

    // Update status to RESOLVED
    await obeService.updateImprovementActionStatus(actRes.id, 'RESOLVED', TEST_TENANT);
    allActions = await obeService.listImprovementActions(TEST_COURSE, TEST_TENANT);
    updatedAction = allActions.find(a => a.id === actRes.id);
    assert(updatedAction?.status === 'RESOLVED', 'CQI action updated to RESOLVED');

    // --- Test 6: OBE Reports & Snapshot Exports ---
    console.log('\n--- Test 6: OBE Report Generation ---');
    const repRes = await obeService.generateReport(
      {
        reportType: 'ATTAINMENT',
        courseId: TEST_COURSE,
        programId: TEST_PROGRAM,
        academicYear: TEST_ACADEMIC_YEAR,
      },
      TEST_TENANT,
      'USER-HOD-01'
    );
    assert(repRes.success === true, 'generateReport succeeds');
    assert(repRes.report.reportId.startsWith('REP-OBE-'), 'Generated formatted OBE report ID');
    assert(repRes.report.status === 'GENERATED', 'Report status is GENERATED');

    const reportsList = await obeService.listReports(undefined, TEST_TENANT);
    assert(reportsList.length > 0, 'listReports returns generated dossier list');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passed}/${total} STAGE 8.3 TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage83Tests();
