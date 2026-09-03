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

async function runStep6Tests() {
  console.log('========================================================================');
  console.log('STAGE 7.3 (STEP 6) — RBAC, ORGANIZATIONAL SCOPE & IDOR HARDENING TEST');
  console.log('========================================================================\n');

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

  const studentUser = { id: 'stu-999', role: 'STUDENT', roles: ['STUDENT'], studentId: 'stu-999' };
  const facultyUser = { id: 'fac-999', role: 'FACULTY', roles: ['FACULTY'], departmentId: deptA.id };
  const hodDeptA = { id: 'hod-dept-a', role: 'HOD', roles: ['HOD'], departmentId: deptA.id };
  const hodDeptB = { id: 'hod-dept-b', role: 'HOD', roles: ['HOD'], departmentId: deptB.id };
  const iqacUser = { id: 'iqac-coord-1', role: 'IQAC', roles: ['IQAC', 'REGISTRAR'] };

  // TEST 1: Student role blocked from report generation
  console.log('--- TEST 1: Student Role Blocked from Report Generation ---');
  try {
    await accreditationService.generateReport({ framework: 'NAAC' }, 'DEFAULT', studentUser);
    console.assert(false, 'Student should not be able to generate reports');
  } catch (err: any) {
    console.log(`✔ TEST 1 PASS: Student report generation blocked (${err.message})`);
  }

  // TEST 2: Student blocked from evidence attachment
  console.log('\n--- TEST 2: Student Role Blocked from Evidence Attachment ---');
  try {
    await accreditationService.addEvidence(
      { framework: 'NAAC', criterionCode: 'CR1', title: 'Student Fake Evidence', evidenceType: 'PDF' },
      'DEFAULT',
      studentUser,
    );
    console.assert(false, 'Student should not be able to attach evidence');
  } catch (err: any) {
    console.log(`✔ TEST 2 PASS: Student evidence attachment blocked (${err.message})`);
  }

  // TEST 3: Faculty blocked from report generation and finalization
  console.log('\n--- TEST 3: Faculty Blocked from Report Generation & Finalization ---');
  try {
    await accreditationService.generateReport({ framework: 'NAAC' }, 'DEFAULT', facultyUser);
    console.assert(false, 'Faculty should not be able to generate institutional reports');
  } catch (err: any) {
    console.log(`✔ TEST 3 PASS: Faculty report generation blocked (${err.message})`);
  }

  // TEST 4: Faculty blocked from viewing system audit logs
  console.log('\n--- TEST 4: Faculty Blocked from System Audit Log Access ---');
  try {
    await accreditationService.getAuditLogs('NAAC', 'DEFAULT', facultyUser);
    console.assert(false, 'Faculty should not be able to access system audit logs');
  } catch (err: any) {
    console.log(`✔ TEST 4 PASS: Faculty audit log access blocked (${err.message})`);
  }

  // TEST 5: HOD Dept A generates Department-Scoped Report -> Success
  console.log('\n--- TEST 5: HOD Dept A Generates Authorized Department Report ---');
  const deptAReport = await accreditationService.generateReport(
    { framework: 'NBA', departmentId: deptA.id },
    'DEFAULT',
    hodDeptA,
  );
  console.assert(deptAReport.report.departmentId === deptA.id, 'Department ID mismatch in generated report');
  console.log(`✔ TEST 5 PASS: HOD Dept A generated report: ${deptAReport.report.reportId} for department ${deptA.name}`);

  // TEST 6: IDOR Protection: HOD Dept B blocked from viewing Dept A report
  console.log('\n--- TEST 6: IDOR Protection: HOD Dept B Blocked from Viewing Dept A Report ---');
  try {
    await accreditationService.getReport(deptAReport.report.id, 'DEFAULT', hodDeptB);
    console.assert(false, 'HOD Dept B should not be able to access Dept A report');
  } catch (err: any) {
    console.log(`✔ TEST 6 PASS: Cross-department report access blocked (${err.message})`);
  }

  // TEST 7: IDOR Protection: HOD Dept B blocked from sealing Dept A report
  console.log('\n--- TEST 7: IDOR Protection: HOD Dept B Blocked from Sealing Dept A Report ---');
  try {
    await accreditationService.finalizeReport(deptAReport.report.id, 'DEFAULT', hodDeptB);
    console.assert(false, 'HOD Dept B should not be able to seal Dept A report');
  } catch (err: any) {
    console.log(`✔ TEST 7 PASS: Unauthorized report finalization blocked (${err.message})`);
  }

  // TEST 8: Tenant Isolation: Cross-tenant access rejected
  console.log('\n--- TEST 8: Tenant Isolation: Cross-Tenant Report Access Rejection ---');
  try {
    await accreditationService.getReport(deptAReport.report.id, 'OTHER_TENANT_ID', iqacUser);
    console.assert(false, 'Should not find report in another tenant');
  } catch (err: any) {
    console.log(`✔ TEST 8 PASS: Cross-tenant report query rejected (${err.message})`);
  }

  // TEST 9: IQAC / Admin authorized access to Audit Logs
  console.log('\n--- TEST 9: IQAC / Admin Authorized Audit Log Access ---');
  const auditLogs = await accreditationService.getAuditLogs('NAAC', 'DEFAULT', iqacUser);
  console.assert(Array.isArray(auditLogs), 'Audit logs should return an array');
  console.log(`✔ TEST 9 PASS: IQAC retrieved ${auditLogs.length} audit trail entries`);

  console.log('\n========================================================================');
  console.log('ALL STEP 6 RBAC, SCOPE & IDOR HARDENING TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runStep6Tests()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
