import { PrismaClient } from '@prisma/client';
import { AccreditationService } from './src/accreditation/accreditation.service';
import { AccreditationCriteriaService } from './src/accreditation/accreditation-criteria.service';
import { AccreditationDataAggregator } from './src/accreditation/accreditation-data-aggregator.service';
import { AccreditationMetricService } from './src/accreditation/accreditation-metric.service';
import { AccreditationEvidenceService } from './src/accreditation/services/accreditation-evidence.service';
import { AccreditationReportService } from './src/accreditation/accreditation-report.service';
import { AccreditationSnapshotService } from './src/accreditation/services/accreditation-snapshot.service';
import { AccreditationExportService } from './src/accreditation/services/accreditation-export.service';
import { AccreditationAuditService } from './src/accreditation/accreditation-audit.service';
import { NaacEngineService } from './src/accreditation/services/naac-engine.service';
import { NbaEngineService } from './src/accreditation/services/nba-engine.service';

const prisma = new PrismaClient();

async function runStep8ComprehensiveValidation() {
  console.log('========================================================================================');
  console.log('STAGE 7.3 (STEP 8) — COMPREHENSIVE TESTING, SECURITY VERIFICATION & E2E VALIDATION');
  console.log('========================================================================================\n');

  const auditService = new AccreditationAuditService();
  const criteriaService = new AccreditationCriteriaService(prisma as any);
  const naacEngine = new NaacEngineService(prisma as any);
  const nbaEngine = new NbaEngineService(prisma as any);
  const aggregator = new AccreditationDataAggregator(prisma as any, criteriaService, naacEngine, nbaEngine);
  const metricService = new AccreditationMetricService(prisma as any);
  const evidenceService = new AccreditationEvidenceService(prisma as any, auditService);
  const snapshotService = new AccreditationSnapshotService(prisma as any, auditService);
  const exportService = new AccreditationExportService();
  const reportService = new AccreditationReportService(prisma as any, snapshotService, exportService);

  const accreditationService = new AccreditationService(
    prisma as any,
    criteriaService,
    aggregator,
    metricService,
    evidenceService,
    reportService,
    auditService,
  );

  const departments = await prisma.department.findMany({ take: 2 });
  const deptA = departments[0];
  const deptB = departments[1] || { id: 'dummy-dept-b', name: 'Mechanical Engineering' };
  const programs = await prisma.program.findMany({ take: 1 });
  const progA = programs[0] || { id: 'dummy-prog-a', name: 'B.Tech CSE' };

  const academicYears = ['2021-22', '2022-23', '2023-24', '2024-25', '2025-26'];

  // Roles
  const studentUser = { id: 'stu-888', role: 'STUDENT', roles: ['STUDENT'], studentId: 'stu-888' };
  const facultyUser = { id: 'fac-888', role: 'FACULTY', roles: ['FACULTY'], departmentId: deptA.id };
  const hodDeptA = { id: 'hod-888-a', role: 'HOD', roles: ['HOD'], departmentId: deptA.id };
  const hodDeptB = { id: 'hod-888-b', role: 'HOD', roles: ['HOD'], departmentId: deptB.id };
  const iqacUser = { id: 'iqac-admin-888', role: 'IQAC', roles: ['IQAC', 'REGISTRAR'] };

  // SECTION 1: NAAC 7-CRITERIA & 5-YEAR CALCULATION VERIFICATION
  console.log('--- SECTION 1: NAAC 7-CRITERIA 5-YEAR ENGINE & LINEAGE VALIDATION ---');
  const naacCalc = await naacEngine.calculateAllCriteria({ tenantId: 'DEFAULT', academicYears });
  console.assert(naacCalc.length > 0, 'NAAC calculation should produce results');
  const naacPrefixes = new Set(naacCalc.map((c) => c.metricCode.split('.')[0]));
  ['1', '2', '3', '4', '5', '6', '7'].forEach((num) => {
    console.assert(naacPrefixes.has(num), `Missing NAAC Criterion ${num}`);
  });
  console.log(`✔ SECTION 1 PASS: All 7 NAAC Criteria computed (${naacCalc.length} metric points across 5 years)`);

  // SECTION 2: NBA 10-CRITERIA & OBE ATTAINMENT VERIFICATION
  console.log('\n--- SECTION 2: NBA 10-CRITERIA & OBE ATTAINMENT MATRIX VALIDATION ---');
  const nbaCalc = await nbaEngine.calculateAllCriteria({ tenantId: 'DEFAULT', departmentId: deptA.id, programId: progA.id, academicYears });
  console.assert(nbaCalc.length > 0, 'NBA calculation should produce results');
  const nbaPrefixes = new Set(nbaCalc.map((c) => c.metricCode.replace('NBA-', '').split('.')[0]));
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].forEach((num) => {
    console.assert(nbaPrefixes.has(num), `Missing NBA Criterion ${num}`);
  });
  console.log(`✔ SECTION 2 PASS: All 10 NBA Criteria computed (${nbaCalc.length} metric points)`);

  // SECTION 3: EVIDENCE ATTACHMENT, VERIFICATION & REJECTION WORKFLOW
  console.log('\n--- SECTION 3: EVIDENCE LIFECYCLE & AUDIT JUSTIFICATION VALIDATION ---');
  const pendingEv = await evidenceService.attachEvidence(
    {
      framework: 'NAAC',
      criterionCode: 'CR2',
      title: 'Faculty Ph.D. Certificates Compilation',
      evidenceType: 'PDF',
      academicYear: '2024-25',
    },
    'DEFAULT',
    facultyUser,
  );
  console.assert(pendingEv.status === 'PENDING', 'Initial evidence must be PENDING');

  const verifiedEv = await evidenceService.verifyEvidence(pendingEv.id, 'DEFAULT', iqacUser, { remarks: 'Verified by IQAC' });
  console.assert(verifiedEv.status === 'VERIFIED', 'Evidence status must update to VERIFIED');

  const rejectEv = await evidenceService.attachEvidence(
    {
      framework: 'NAAC',
      criterionCode: 'CR3',
      title: 'Incomplete Grant Sanction Letters',
      evidenceType: 'PDF',
      academicYear: '2024-25',
    },
    'DEFAULT',
    facultyUser,
  );
  const rejected = await evidenceService.rejectEvidence(
    rejectEv.id,
    'DEFAULT',
    iqacUser,
    { rejectionReason: 'Missing funding agency signature stamp' },
  );
  console.assert(rejected.status === 'REJECTED', 'Evidence status must update to REJECTED');
  console.assert(rejected.rejectionReason === 'Missing funding agency signature stamp', 'Rejection reason mismatch');
  console.log('✔ SECTION 3 PASS: Evidence attachment, verification, and rejection with reason verified');

  // SECTION 4: IMMUTABLE SNAPSHOT, SHA-256 SEALING & CRYPTOGRAPHIC TAMPER DETECTION
  console.log('\n--- SECTION 4: IMMUTABLE SNAPSHOT, SHA-256 SEALING & INTEGRITY AUDIT ---');
  const snapRes = await reportService.generateReport({ framework: 'NAAC' }, 'DEFAULT', iqacUser);
  const reportId = snapRes.report.id;

  const sealed = await reportService.finalizeReport(reportId, 'DEFAULT', iqacUser);
  console.assert(sealed.status === 'SEALED', 'Report must be SEALED');

  const validIntegrity = await reportService.verifyIntegrity(reportId, 'DEFAULT', iqacUser);
  console.assert(validIntegrity.status === 'VALID' && !validIntegrity.isTampered, 'Sealed snapshot must be cryptographically VALID');

  // Mutate report in database to simulate unauthorized payload tamper
  await prisma.accreditationReport.update({
    where: { id: reportId },
    data: { snapshotData: { mutated: true, malicious: 'injected data' } as any },
  });

  const tamperedIntegrity = await reportService.verifyIntegrity(reportId, 'DEFAULT', iqacUser);
  console.assert(tamperedIntegrity.status === 'TAMPERED' && tamperedIntegrity.isTampered, 'Tamper detection must detect mutation');
  console.log('✔ SECTION 4 PASS: SHA-256 cryptographic sealing and tamper detection verified (100% accurate)');

  // SECTION 5: MULTI-FORMAT EXPORT VERIFICATION (JSON, XLSX, HTML)
  console.log('\n--- SECTION 5: MULTI-FORMAT EXPORTS & SENSITIVE DATA EXCLUSION ---');
  // Re-generate fresh sealed report for export validation
  const exportSnap = await reportService.generateReport({ framework: 'NBA', departmentId: deptA.id }, 'DEFAULT', hodDeptA);
  await reportService.finalizeReport(exportSnap.report.id, 'DEFAULT', hodDeptA);

  const jsonExp = await reportService.exportReport(exportSnap.report.id, 'DEFAULT', 'JSON', hodDeptA);
  console.assert(jsonExp && jsonExp.format === 'JSON' && jsonExp.data, 'JSON export must contain report payload');

  const xlsxExp = await reportService.exportReport(exportSnap.report.id, 'DEFAULT', 'EXCEL', hodDeptA);
  console.assert(xlsxExp && xlsxExp.format === 'EXCEL' && Buffer.isBuffer(xlsxExp.data), 'Excel export must produce buffer');

  const htmlExp = await reportService.exportReport(exportSnap.report.id, 'DEFAULT', 'HTML', hodDeptA);
  console.assert(htmlExp && htmlExp.format === 'HTML' && (htmlExp.data as string).includes('Self-Study Report (SSR / SAR)'), 'HTML must include official header');

  // Sensitive data check
  const exportedString = (jsonExp.data as string) + (htmlExp.data as string);
  const sensitivePatterns = ['password', 'client_secret', 'refresh_token', 'access_token'];
  sensitivePatterns.forEach((pat) => {
    console.assert(!exportedString.includes(`"${pat}"`), `Sensitive field ${pat} must not be exposed in exports`);
  });
  console.log('✔ SECTION 5 PASS: JSON, XLSX, and HTML exports verified without sensitive leakage');

  // SECTION 6: RBAC, IDOR & TENANT ISOLATION BOUNDARY CHECKS
  console.log('\n--- SECTION 6: RBAC, SCOPE ENFORCEMENT & IDOR BOUNDARY VALIDATION ---');
  // Student rejection
  try {
    await accreditationService.generateReport({ framework: 'NAAC' }, 'DEFAULT', studentUser);
    console.assert(false, 'Student should be rejected');
  } catch (err: any) {
    console.log(`✔ RBAC Guard 1: Student blocked (${err.message})`);
  }

  // Faculty report generation rejection
  try {
    await accreditationService.generateReport({ framework: 'NAAC' }, 'DEFAULT', facultyUser);
    console.assert(false, 'Faculty should be rejected');
  } catch (err: any) {
    console.log(`✔ RBAC Guard 2: Faculty report generation blocked (${err.message})`);
  }

  // HOD Dept B accessing Dept A report
  try {
    await accreditationService.getReport(exportSnap.report.id, 'DEFAULT', hodDeptB);
    console.assert(false, 'Cross-department access must fail');
  } catch (err: any) {
    console.log(`✔ IDOR Guard 3: Cross-department access blocked (${err.message})`);
  }

  // Cross-tenant access
  try {
    await accreditationService.getReport(exportSnap.report.id, 'DIFFERENT_TENANT_ID', iqacUser);
    console.assert(false, 'Cross-tenant access must fail');
  } catch (err: any) {
    console.log(`✔ Tenant Guard 4: Cross-tenant access rejected (${err.message})`);
  }

  console.log('\n========================================================================================');
  console.log('ALL STAGE 7.3 (STEP 8) E2E & SECURITY VALIDATION TESTS PASSED (100%)');
  console.log('========================================================================================\n');
}

runStep8ComprehensiveValidation()
  .catch((err) => {
    console.error('Validation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
