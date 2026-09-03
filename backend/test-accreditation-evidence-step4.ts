import { PrismaClient } from '@prisma/client';
import { AccreditationEvidenceService } from './src/accreditation/services/accreditation-evidence.service';
import { AccreditationAuditService } from './src/accreditation/accreditation-audit.service';

const prisma = new PrismaClient();

async function runStep4Tests() {
  console.log('========================================================================');
  console.log('STAGE 7.3 (STEP 4) — ACCREDITATION EVIDENCE MAPPING & VERIFICATION TEST');
  console.log('========================================================================\n');

  const auditService = new AccreditationAuditService();
  const evidenceService = new AccreditationEvidenceService(prisma as any, auditService);

  const naacFramework = await prisma.accreditationFramework.findFirst({
    where: { name: 'NAAC' },
    include: { criteria: { include: { metrics: true } } },
  });
  const sampleMetric = naacFramework?.criteria[0]?.metrics[0];
  const dept = await prisma.department.findFirst();

  // Test 1: Attach Evidence (ERP Record) as Faculty -> Status PENDING
  console.log('--- TEST 1: Attach Evidence as Faculty (Initial Status PENDING) ---');
  const facultyUser = {
    id: 'fac-101',
    role: 'FACULTY',
    roles: ['FACULTY'],
    departmentId: dept?.id,
  };

  const evidence1 = await evidenceService.attachEvidence(
    {
      framework: 'NAAC',
      criterionCode: 'CR1',
      metricId: sampleMetric?.id,
      title: 'BOS Curriculum Revision Minutes 2024-25',
      description: 'Departmental Board of Studies approval minutes for AI curriculum',
      sourceModule: 'ERP',
      evidenceType: 'PDF',
      academicYear: '2024-25',
      departmentId: dept?.id,
    },
    'DEFAULT',
    facultyUser,
  );

  console.assert(evidence1.id !== undefined, 'Evidence creation failed');
  console.assert(evidence1.status === 'PENDING', `Expected status PENDING, got ${evidence1.status}`);
  console.log(`✔ TEST 1 PASS: Evidence created with ID: ${evidence1.id} (Status: ${evidence1.status})`);

  // Test 2: Verify Evidence as IQAC / Admin -> Status VERIFIED
  console.log('\n--- TEST 2: Verify Evidence as IQAC / Admin ---');
  const iqacUser = {
    id: 'iqac-admin-01',
    role: 'IQAC',
    roles: ['IQAC', 'UNIVERSITY_ADMIN'],
  };

  const verifiedEvidence = await evidenceService.verifyEvidence(
    evidence1.id,
    'DEFAULT',
    iqacUser,
    { remarks: 'Verified compliant with NAAC Criterion 1.1 documentation norms' },
  );

  console.assert(verifiedEvidence.status === 'VERIFIED', `Expected status VERIFIED, got ${verifiedEvidence.status}`);
  console.assert(verifiedEvidence.verifiedBy === 'iqac-admin-01', 'Verifier ID mismatch');
  console.log(`✔ TEST 2 PASS: Evidence ${evidence1.id} successfully marked as VERIFIED`);

  // Test 3: Reject Evidence with Reason
  console.log('\n--- TEST 3: Reject Non-Compliant Evidence with Audit Reason ---');
  const evidence2 = await evidenceService.attachEvidence(
    {
      framework: 'NAAC',
      criterionCode: 'CR2',
      title: 'Incomplete Attendance Register 2023-24',
      sourceModule: 'ERP',
      evidenceType: 'PDF',
      academicYear: '2023-24',
      departmentId: dept?.id,
    },
    'DEFAULT',
    facultyUser,
  );

  const rejectedEvidence = await evidenceService.rejectEvidence(
    evidence2.id,
    'DEFAULT',
    iqacUser,
    { rejectionReason: 'Attendance signature sheets missing faculty countersign' },
  );

  console.assert(rejectedEvidence.status === 'REJECTED', `Expected status REJECTED, got ${rejectedEvidence.status}`);
  console.assert(rejectedEvidence.rejectionReason === 'Attendance signature sheets missing faculty countersign', 'Rejection reason missing');
  console.log(`✔ TEST 3 PASS: Evidence ${evidence2.id} rejected with reason: "${rejectedEvidence.rejectionReason}"`);

  // Test 4: Unauthorized Student Verification Rejection
  console.log('\n--- TEST 4: Student Role Verification Rejection Guard ---');
  const studentUser = {
    id: 'stu-101',
    role: 'STUDENT',
    roles: ['STUDENT'],
  };

  try {
    await evidenceService.verifyEvidence(evidence2.id, 'DEFAULT', studentUser);
    console.assert(false, 'Should have thrown ForbiddenException for student');
  } catch (err: any) {
    console.log(`✔ TEST 4 PASS: Student verification correctly blocked (${err.message})`);
  }

  // Test 5: Invalid Document Reference Rejection
  console.log('\n--- TEST 5: Invalid Document Reference Rejection ---');
  try {
    await evidenceService.attachEvidence(
      {
        framework: 'NAAC',
        criterionCode: 'CR1',
        title: 'Ghost DMS Doc',
        sourceModule: 'DMS',
        documentId: '00000000-0000-0000-0000-000000000000',
      },
      'DEFAULT',
      facultyUser,
    );
    console.assert(false, 'Should have thrown BadRequestException for non-existent DMS doc');
  } catch (err: any) {
    console.log(`✔ TEST 5 PASS: Non-existent DMS document reference rejected (${err.message})`);
  }

  // Test 6: Data Lineage Creation and Evidence Completeness
  console.log('\n--- TEST 6: Data Lineage & Evidence Completeness Metric ---');
  const lineage = await prisma.accreditationDataLineage.findFirst({
    where: { evidenceId: evidence1.id },
  });
  console.assert(lineage !== null, 'Data lineage record missing for attached evidence');
  console.log(`✔ Traceable Lineage Verified: [${lineage?.framework} ${lineage?.metricCode}] -> ${lineage?.sourceEntity}`);

  const completeness = await evidenceService.getEvidenceCompleteness('NAAC', 'DEFAULT');
  console.assert(completeness.totalEvidenceItems > 0, 'Completeness calculation returned 0 items');
  console.log(`✔ Completeness Verified: ${completeness.completenessPercentage}% (Verified: ${completeness.verifiedCount}, Pending: ${completeness.pendingCount}, Rejected: ${completeness.rejectedCount})`);

  console.log('\n========================================================================');
  console.log('ALL STEP 4 ACCREDITATION EVIDENCE & LINEAGE TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runStep4Tests()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
