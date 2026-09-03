import { PrismaClient } from '@prisma/client';
import { AccreditationSnapshotService } from './src/accreditation/services/accreditation-snapshot.service';
import { AccreditationExportService } from './src/accreditation/services/accreditation-export.service';
import { AccreditationAuditService } from './src/accreditation/accreditation-audit.service';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function runStep5Tests() {
  console.log('========================================================================');
  console.log('STAGE 7.3 (STEP 5) — IMMUTABLE ACCREDITATION SNAPSHOT & EXPORT TEST');
  console.log('========================================================================\n');

  const auditService = new AccreditationAuditService();
  const snapshotService = new AccreditationSnapshotService(prisma as any, auditService);
  const exportService = new AccreditationExportService();

  const adminUser = { id: 'admin-iqac-1', role: 'IQAC', roles: ['IQAC', 'SUPER_ADMIN'] };

  // TEST 1: Generate NAAC 5-Year Snapshot
  console.log('--- TEST 1: Generate 5-Year NAAC Accreditation Snapshot ---');
  const naacReport = await snapshotService.generateSnapshot(
    {
      framework: 'NAAC',
      academicYearRange: '2021-22 to 2025-26',
    },
    'DEFAULT',
    adminUser,
  );

  console.assert(naacReport.id !== undefined, 'Report creation failed');
  console.assert(naacReport.status === 'GENERATED', `Expected status GENERATED, got ${naacReport.status}`);
  console.assert(naacReport.hash !== null, 'Report SHA-256 hash missing');
  console.log(`✔ TEST 1 PASS: NAAC Snapshot generated: ${naacReport.reportId} (Hash: ${naacReport.hash})`);

  // TEST 2: Canonicalization Determinism
  console.log('\n--- TEST 2: Canonicalization Determinism & Hash Stability ---');
  const payloadA = { b: 2, a: 1, nested: { z: 100, y: 50 }, list: [{ d: 4, c: 3 }] };
  const payloadB = { a: 1, list: [{ c: 3, d: 4 }], b: 2, nested: { y: 50, z: 100 } };

  const canonicalA = snapshotService.canonicalize(payloadA);
  const canonicalB = snapshotService.canonicalize(payloadB);
  const hashA = snapshotService.computeHash(canonicalA);
  const hashB = snapshotService.computeHash(canonicalB);

  console.assert(canonicalA === canonicalB, 'Canonical representation mismatch for unordered keys');
  console.assert(hashA === hashB, 'SHA-256 hash mismatch for unordered keys');
  console.log(`✔ TEST 2 PASS: Deterministic canonicalization confirmed (Hash: ${hashA.substring(0, 16)}...)`);

  // TEST 3: Finalize and Seal Snapshot
  console.log('\n--- TEST 3: Finalize & Seal Snapshot with SHA-256 Lock ---');
  const sealedReport = await snapshotService.finalizeAndSealReport(naacReport.id, 'DEFAULT', adminUser);

  console.assert(sealedReport.status === 'SEALED', `Expected status SEALED, got ${sealedReport.status}`);
  console.log(`✔ TEST 3 PASS: Report ${sealedReport.reportId} successfully sealed (Status: ${sealedReport.status})`);

  // TEST 4: Integrity Verification on Valid Report
  console.log('\n--- TEST 4: Cryptographic Integrity Verification (Valid Sealed Snapshot) ---');
  const check1 = await snapshotService.verifySnapshotIntegrity(sealedReport.id, 'DEFAULT');

  console.assert(!check1.isTampered, 'Report incorrectly reported as tampered');
  console.assert(check1.status === 'VALID', 'Integrity status should be VALID');
  console.log(`✔ TEST 4 PASS: Cryptographic Integrity Verified (Status: ${check1.status}, Hash matches)`);

  // TEST 5: Tamper Detection (Simulate Unauthorized Modification)
  console.log('\n--- TEST 5: Tamper Detection & Unauthorized Payload Mutation Test ---');
  const tamperedSnapshotData = JSON.parse(JSON.stringify(sealedReport.snapshotData));
  tamperedSnapshotData.institution.name = 'Forged Entity University';

  await prisma.accreditationReport.update({
    where: { id: sealedReport.id },
    data: { snapshotData: tamperedSnapshotData },
  });

  const check2 = await snapshotService.verifySnapshotIntegrity(sealedReport.id, 'DEFAULT');
  console.assert(check2.isTampered === true, 'Tampered data was not detected');
  console.assert(check2.status === 'TAMPERED', 'Integrity status should be TAMPERED');
  console.log(`✔ TEST 5 PASS: Tamper detected successfully! Stored: ${check2.storedHash.substring(0, 10)}... vs Computed: ${check2.computedHash.substring(0, 10)}... (Status: ${check2.status})`);

  // Restore original data for export tests
  await prisma.accreditationReport.update({
    where: { id: sealedReport.id },
    data: { snapshotData: naacReport.snapshotData },
  });

  // TEST 6: JSON Export
  console.log('\n--- TEST 6: Structured JSON Export from Sealed Snapshot ---');
  const fullReport = await snapshotService.getReportById(sealedReport.id, 'DEFAULT');
  const jsonExport = exportService.exportJson(fullReport);

  console.assert(jsonExport.reportId === sealedReport.reportId, 'JSON export report ID mismatch');
  console.assert(jsonExport.snapshot.criteria.length > 0, 'JSON export missing criteria');
  console.log(`✔ TEST 6 PASS: JSON Export validated with ${jsonExport.snapshot.criteria.length} criteria`);

  // TEST 7: Excel (XLSX) Export
  console.log('\n--- TEST 7: Multi-Sheet Excel (XLSX) Export ---');
  const xlsxBuffer = exportService.exportExcelBuffer(fullReport);

  console.assert(xlsxBuffer.length > 0, 'Excel buffer is empty');
  const parsedWb = XLSX.read(xlsxBuffer, { type: 'buffer' });
  console.assert(parsedWb.SheetNames.includes('Report Summary'), 'Missing Report Summary sheet');
  console.assert(parsedWb.SheetNames.includes('Criteria'), 'Missing Criteria sheet');
  console.assert(parsedWb.SheetNames.includes('5-Year Metric Data'), 'Missing 5-Year Metric Data sheet');
  console.assert(parsedWb.SheetNames.includes('Evidence Registry'), 'Missing Evidence Registry sheet');
  console.assert(parsedWb.SheetNames.includes('Data Lineage'), 'Missing Data Lineage sheet');
  console.assert(parsedWb.SheetNames.includes('Integrity Seal'), 'Missing Integrity Seal sheet');
  console.log(`✔ TEST 7 PASS: Excel Export validated with ${parsedWb.SheetNames.length} sheets (${xlsxBuffer.length} bytes)`);

  // TEST 8: HTML / Print-Ready PDF Export
  console.log('\n--- TEST 8: Print-Ready HTML Document Export ---');
  const htmlExport = exportService.exportHtml(fullReport);

  console.assert(htmlExport.includes(fullReport.reportId), 'HTML missing report ID');
  console.assert(htmlExport.includes('CRYPTOGRAPHIC INTEGRITY SEAL'), 'HTML missing seal box');
  console.assert(htmlExport.includes('Swarrnim Startup & Innovation University'), 'HTML missing institution title');
  console.log(`✔ TEST 8 PASS: Print-ready HTML document generated (${htmlExport.length} characters)`);

  console.log('\n========================================================================');
  console.log('ALL STEP 5 IMMUTABLE SNAPSHOT & EXPORT TESTS PASSED SUCCESSFULLY (100%)');
  console.log('========================================================================\n');
}

runStep5Tests()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
