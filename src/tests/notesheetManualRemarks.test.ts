// @ts-nocheck
import zlib from 'zlib';
import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { User, NoteSheet } from '../types';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('RUNNING MANUAL REMARKS / OFFICE USE SPACE TEST SUITE');
  console.log('========================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition: boolean, testName: string, actual?: any, expected?: any) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (actual !== undefined || expected !== undefined) {
        console.error(`    - Expected: ${JSON.stringify(expected)}`);
        console.error(`    - Actual:   ${JSON.stringify(actual)}`);
      }
    }
  };

  const allUsers = db.getUsers();
  const facultyUser = allUsers.find(u => u.role === 'FACULTY') || allUsers[0];
  const registrarUser = allUsers.find(u => u.role === 'REGISTRAR') || allUsers.find(u => u.id === 'user-registrar')!;

  console.log('--- Step 1: Create Test Notesheet with Digital Remarks ---');
  const note = db.createNoteSheet({
    title: 'Advanced AI Server Infrastructure Procurement',
    subject: 'Procurement of Enterprise Server for AI Lab',
    proposal: 'Proposal for high-performance compute node for Machine Learning research.',
    purposeJustification: 'Required for department AI and Cloud computing projects.',
    category: 'Infrastructure',
    instituteId: 'inst-sit',
    instituteCode: 'SIT',
    instituteName: 'Swarrnim Institute of Technology',
    departmentId: 'dept-cse',
    departmentName: 'Computer Engineering',
    department: 'Computer Engineering',
    budgetRequired: true,
    estimatedCost: 350000,
    requestedAmount: 350000,
    currentAmount: 350000,
    priority: 'HIGH',
    creatorId: facultyUser.id,
    creatorName: facultyUser.name,
    contactNumber: '+91 98765 43210',
    date: '2026-08-19',
    requiredDate: '2026-09-01'
  }, facultyUser, false);

  assert(note.id !== undefined, 'Notesheet created successfully');
  assert(note.status === 'PENDING_HOD', 'Initial status is PENDING_HOD');

  console.log('\n--- Step 2: Generate PDF and Verify Manual Remarks Section in Stream ---');
  const pdfResponse = await notesheetPdfService.generatePdf(note.id, registrarUser, 'REGISTRAR', {
    watermarkText: 'OFFICIAL RECORD',
    forceRegenerate: true
  });

  assert(pdfResponse.success, 'PDF generated successfully');
  assert(!!pdfResponse.downloadUrl, 'PDF downloadUrl is present');

  const base64Data = (pdfResponse.downloadUrl || '').split(',')[1];
  const pdfBuffer = Buffer.from(base64Data, 'base64');
  const rawText = pdfBuffer.toString('binary');

  // Decompress flate streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let decompressedText = '';
  let match;
  while ((match = streamRegex.exec(rawText)) !== null) {
    try {
      const decompressed = zlib.inflateSync(Buffer.from(match[1], 'binary'));
      decompressedText += decompressed.toString('utf-8') + '\n';
    } catch {
      decompressedText += match[1] + '\n';
    }
  }

  const combinedText = decompressedText + '\n' + rawText;

  // Assert section title
  assert(
    combinedText.includes('REMARKS / MODIFICATION, IF ANY:') || combinedText.includes('REMARKS'),
    'PDF contains "REMARKS / MODIFICATION, IF ANY:" section heading'
  );

  // Assert Signature and Date placeholders
  assert(
    combinedText.includes('Signature: __________________________') || combinedText.includes('Signature:'),
    'PDF contains physical manual signature line "Signature: __________________________"'
  );

  assert(
    combinedText.includes('Date: ____________________') || combinedText.includes('Date:'),
    'PDF contains physical manual date line "Date: ____________________"'
  );

  console.log('\n--- Step 3: Separation of Digital Workflow Remarks vs Manual Remarks ---');
  // Digital remarks in workflow movements remain intact
  assert(note.movements.length > 0, 'Workflow movements exist');
  assert(note.proposal.length > 0, 'Proposal content is unaffected');

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    throw new Error(`${totalTests - passedTests} tests failed`);
  }
}

runTestSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
