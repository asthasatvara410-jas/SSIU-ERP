import { PrismaClient } from '@prisma/client';
import { FeedbackService } from './src/feedback/feedback.service';
import { GrievanceCategoryEnum } from './src/feedback/dto/feedback.dto';

const prisma = new PrismaClient();
const feedbackService = new FeedbackService(prisma as any);

async function runStage93ReportingTests() {
  console.log('================================================================');
  console.log('🚀 STAGE 9.3 — FEEDBACK & GRIEVANCE REPORTING + NAAC ANALYTICS TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const TENANT_A = 'TENANT-REPORTING-A';
  const TENANT_B = 'TENANT-REPORTING-B';

  try {
    // Clean up any test records
    await prisma.grievanceCaseEvent.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceInternalNote.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceEvidence.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceComplainantIdentity.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceCase.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });

    // Seed test cases in Tenant A
    const case1 = await feedbackService.submitAnonymousGrievance({
      category: GrievanceCategoryEnum.ACADEMIC,
      subject: 'Lab Equipment Maintenance Requirement',
      description: 'Oscilloscopes in Lab 301 require calibration.',
      priority: 'HIGH',
      department: 'Computer Engineering',
      incidentLocation: 'Lab 301',
    }, TENANT_A);

    const case2 = await feedbackService.submitAnonymousGrievance({
      category: GrievanceCategoryEnum.FACILITY,
      subject: 'Air Conditioning Service in Auditorium',
      description: 'Auditorium AC units require filter cleaning.',
      priority: 'MEDIUM',
      department: 'Campus Infrastructure',
      incidentLocation: 'Main Auditorium',
    }, TENANT_A);

    // Resolve case 1 to have resolution summary
    const dbCase1 = await prisma.grievanceCase.findFirst({ where: { caseNumber: case1.caseNumber, tenantId: TENANT_A } });
    await feedbackService.resolveGrievance(
      dbCase1!.id,
      {
        resolutionSummary: 'All 15 oscilloscopes in Lab 301 calibrated and certified.',
        correctiveAction: 'Quarterly instrument calibration contract executed.',
        internalRemarks: 'Checked by Chief Technical Officer.',
      },
      { id: 'OFFICER-01', role: 'ADMIN' },
      TENANT_A
    );

    // --- TEST 1: COMPREHENSIVE FEEDBACK REPORT GENERATION ---
    console.log('--- Test 1: Comprehensive Feedback Report & Executive Analytics ---');
    const compReport = await feedbackService.getComprehensiveFeedbackReport({}, { role: 'IQAC_ADMIN' }, TENANT_A);

    assert(compReport.success === true, 'Comprehensive report generated successfully');
    assert(compReport.totalResponses > 0, 'Total responses aggregated');
    assert(compReport.averageRating >= 1.0 && compReport.averageRating <= 5.0, 'Average overall rating is within valid 1-5 star scale');
    assert(compReport.criteriaAverages['Teaching Clarity'] > 0, 'Teaching Clarity criterion score calculated');
    assert(compReport.criteriaAverages['Subject Knowledge'] > 0, 'Subject Knowledge criterion score calculated');
    assert(compReport.ratingDistribution[5] > 0, '5-star rating count populated');

    // --- TEST 2: FACULTY-WISE PERFORMANCE BREAKDOWN ---
    console.log('\n--- Test 2: Faculty-Wise Feedback Performance Reporting ---');
    assert(Array.isArray(compReport.facultyWiseReport), 'Faculty-wise performance report returned as array');
    assert(compReport.facultyWiseReport.length >= 1, 'Faculty members present in report');

    const firstFaculty = compReport.facultyWiseReport[0];
    assert(firstFaculty.facultyName !== '', 'Faculty name present');
    assert(firstFaculty.departmentName !== '', 'Department name present');
    assert(firstFaculty.totalResponses > 0, 'Faculty response count present');
    assert(firstFaculty.averageRating > 0, 'Faculty average rating present');
    assert(firstFaculty.teachingClarity > 0, 'Teaching clarity metric present');
    assert(firstFaculty.subjectKnowledge > 0, 'Subject knowledge metric present');
    assert(firstFaculty.positiveCount >= 0, 'Positive feedback count present');
    assert(firstFaculty.suggestionCount >= 0, 'Improvement suggestion count present');

    // --- TEST 3: SUBJECT-WISE & DEPARTMENT-WISE REPORTING ---
    console.log('\n--- Test 3: Subject-Wise & Department-Wise Reporting ---');
    assert(Array.isArray(compReport.subjectWiseReport), 'Subject-wise report returned as array');
    const firstSubject = compReport.subjectWiseReport[0];
    assert(firstSubject.subjectCode !== '', 'Subject code present');
    assert(firstSubject.subjectName !== '', 'Subject name present');
    assert(firstSubject.averageRating > 0, 'Subject average rating present');

    assert(Array.isArray(compReport.departmentWiseReport), 'Department-wise report returned as array');
    const firstDept = compReport.departmentWiseReport[0];
    assert(firstDept.departmentName !== '', 'Department name present');
    assert(firstDept.responseParticipationRate.includes('%'), 'Department response participation rate present');

    // --- TEST 4: INSTITUTIONAL QUALITY SUMMARY & STRENGTHS/IMPROVEMENTS ---
    console.log('\n--- Test 4: Institutional Strengths & Improvement Observations ---');
    assert(Array.isArray(compReport.institutionalSummary.strengths), 'Institutional strengths returned as list');
    assert(compReport.institutionalSummary.strengths.length > 0, 'Key institutional strengths identified');
    assert(Array.isArray(compReport.institutionalSummary.improvementAreas), 'Improvement areas returned as list');
    assert(compReport.institutionalSummary.improvementAreas.length > 0, 'Improvement recommendations identified');
    assert(compReport.institutionalSummary.teachingObservations.length > 0, 'Teaching observations present');

    // --- TEST 5: NAAC / IQAC ACCREDITATION EVIDENCE SUMMARY ---
    console.log('\n--- Test 5: NAAC / IQAC Supporting Summary Metrics ---');
    assert(compReport.naacSummary.metric.includes('NAAC Criterion 2.7.1'), 'NAAC summary references Criterion 2.7.1');
    assert(compReport.naacSummary.satisfactionPercentage.includes('%'), 'Satisfaction percentage formatted correctly');
    assert(compReport.naacSummary.actionTakenRatio.includes('%'), 'Action-taken ratio present');
    assert(compReport.naacSummary.qualityComplianceStatus !== '', 'Quality compliance status stated');

    // --- TEST 6: GRIEVANCE REDRESSAL ANALYTICS & ACTION-TAKEN LOG ---
    console.log('\n--- Test 6: Grievance Redressal Analytics & Action-Taken Closure Log ---');
    const grievanceReport = await feedbackService.getGrievanceAnalyticsReport({}, { role: 'IQAC' }, TENANT_A);

    assert(grievanceReport.success === true, 'Grievance analytics report generated successfully');
    assert(grievanceReport.totalGrievances >= 2, 'Total grievances count matches test seed data');
    assert(grievanceReport.resolvedCount >= 1, 'Resolved grievance count matches test seed data');
    assert(grievanceReport.priorityCounts.HIGH >= 1, 'Priority breakdown counts high priority case');
    assert(grievanceReport.categoryCounts.ACADEMIC >= 1, 'Category breakdown counts academic case');
    assert(grievanceReport.categoryCounts.FACILITY >= 1, 'Category breakdown counts facility case');
    assert(grievanceReport.avgResolutionTimeDays > 0, 'Average resolution turnaround calculated in days');

    // --- TEST 7: STRICT SUBMITTER ANONYMITY SHIELDING IN REPORTS ---
    console.log('\n--- Test 7: Submitter Anonymity Shielding in Administrative Reports ---');
    assert(Array.isArray(grievanceReport.actionTakenLog), 'Action-taken log returned as array');
    const resolvedLogItem = grievanceReport.actionTakenLog.find(l => l.caseNumber === case1.caseNumber);
    assert(resolvedLogItem !== undefined, 'Target resolved grievance found in action log');
    assert(resolvedLogItem!.resolutionSummary.includes('calibrated'), 'Resolution summary populated');
    assert(resolvedLogItem!.submitterType.includes('Anonymous Submitter'), 'Submitter type strictly marked as Anonymous');
    assert((resolvedLogItem as any).studentName === undefined, 'Student name is NOT exposed in report');
    assert((resolvedLogItem as any).studentEnrollmentNo === undefined, 'Student enrollment number is NOT exposed in report');
    assert((resolvedLogItem as any).trackingToken === undefined, 'Secret tracking token is NOT exposed in report');

    // --- TEST 8: MULTI-TENANT ISOLATION ---
    console.log('\n--- Test 8: Multi-Tenant Reporting Isolation ---');
    const tenantBReport = await feedbackService.getGrievanceAnalyticsReport({}, { role: 'IQAC' }, TENANT_B);
    assert(tenantBReport.totalGrievances === 0, 'Tenant B report does not leak Tenant A grievance records');

    // Clean up test records
    await prisma.grievanceCaseEvent.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceInternalNote.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceEvidence.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceComplainantIdentity.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceCase.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} STAGE 9.3 REPORTING TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage93ReportingTests();
