/**
 * Test Suite: Notesheet Amount in Words & Indian Numbering System
 *
 * Verifies:
 * 1. Unit conversion for Indian currency values:
 *    - ₹1 -> Rupees One Only
 *    - ₹100 -> Rupees One Hundred Only
 *    - ₹500 -> Rupees Five Hundred Only
 *    - ₹1,100 -> Rupees One Thousand One Hundred Only
 *    - ₹4,500 -> Rupees Four Thousand Five Hundred Only
 *    - ₹5,000 -> Rupees Five Thousand Only
 *    - ₹14,500 -> Rupees Fourteen Thousand Five Hundred Only
 *    - ₹1,00,000 -> Rupees One Lakh Only
 *    - ₹10,00,000 -> Rupees Ten Lakh Only
 *    - ₹1,00,00,000 -> Rupees One Crore Only
 *    - ₹1,250.50 -> Rupees One Thousand Two Hundred Fifty and Fifty Paise Only
 * 2. Dynamic derivation from authoritative numeric amount (no client tampering).
 * 3. Live update when approved amount changes.
 * 4. Embedding in backend generated official PDF.
 */

import { amountToWords, formatIndianNumber, formatIndianCurrency } from '../utils/numberFormat';
import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { User, NoteSheet } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runAmountInWordsTests() {
  console.log('\n========================================================================');
  console.log('RUNNING NOTESHEET AMOUNT IN WORDS TEST SUITE');
  console.log('========================================================================\n');

  // 1. Unit Test Matrix for amountToWords
  console.log('--- Step 1: Unit Test Matrix for Indian Numbering Words ---');

  const testCases: [number | string, string][] = [
    [1, 'Rupees One Only'],
    [100, 'Rupees One Hundred Only'],
    [500, 'Rupees Five Hundred Only'],
    [1100, 'Rupees One Thousand One Hundred Only'],
    [4500, 'Rupees Four Thousand Five Hundred Only'],
    [5000, 'Rupees Five Thousand Only'],
    [14500, 'Rupees Fourteen Thousand Five Hundred Only'],
    [100000, 'Rupees One Lakh Only'],
    [1000000, 'Rupees Ten Lakh Only'],
    [10000000, 'Rupees One Crore Only'],
    ['1,250.50', 'Rupees One Thousand Two Hundred Fifty and Fifty Paise Only'],
    [1250.50, 'Rupees One Thousand Two Hundred Fifty and Fifty Paise Only'],
    [1250.05, 'Rupees One Thousand Two Hundred Fifty and Five Paise Only'],
    [0, 'Rupees Zero Only'],
    [2500000, 'Rupees Twenty Five Lakh Only'],
    [85000000, 'Rupees Eight Crore Fifty Lakh Only']
  ];

  for (const [input, expected] of testCases) {
    const actual = amountToWords(input);
    assert(actual === expected, `amountToWords(${input}) -> "${actual}" (expected: "${expected}")`);
  }

  // 2. Integration with Notesheet Workflow & Authoritative Numeric Source
  console.log('\n--- Step 2: Notesheet Creation with Total Requested Amount ---');
  const facultyUser: User = {
    id: 'usr-fac-amt-1',
    name: 'Prof. Jignesh Shah',
    email: 'jignesh.shah@swarrnim.edu.in',
    role: 'FACULTY',
    designation: 'Assistant Professor',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodUser: User = {
    id: 'usr-hod-amt-2',
    name: 'Dr. HOD',
    email: 'hod@swarrnim.edu.in',
    role: 'HOD',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const prinUser: User = {
    id: 'usr-prin-amt-3',
    name: 'Dr. Principal',
    email: 'principal@swarrnim.edu.in',
    role: 'PRINCIPAL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const dyRegUser: User = {
    id: 'usr-dyreg-amt-4',
    name: 'Dr. Dy Registrar',
    email: 'dyreg@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const regUser: User = {
    id: 'usr-reg-amt-5',
    name: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const vpUser: User = {
    id: 'usr-vp-amt-6',
    name: 'Dr. Elesh Patel',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    designation: 'Vice President',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // Register users
  const existingUsers = db.getUsers().filter(u => u.role !== 'VICE_PRESIDENT');
  // @ts-ignore
  db.state.users = [...existingUsers, facultyUser, hodUser, prinUser, dyRegUser, regUser, vpUser];

  const note = db.createNoteSheet({
    subject: 'Procurement of Laboratory Mouse Pads & Consumables',
    proposal: 'Procurement of ergonomic mouse pads for IoT Research Lab.',
    purposeJustification: 'Student laboratory upgrade.',
    financialRequirement: true,
    estimatedCost: 5000,
    requestedAmount: 5000,
    currentAmount: 5000,
    items: [
      { id: 'item-1', itemName: 'Ergonomic Mouse Pad', quantity: 50, unit: 'Nos', rate: 100, amount: 5000 }
    ],
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    branch: 'ACADEMIC',
    requiredDate: '2026-10-15'
  }, facultyUser, false);

  assert(note.requestedAmount === 5000, 'Note requestedAmount is ₹5,000');
  assert(amountToWords(note.requestedAmount) === 'Rupees Five Thousand Only', 'Requested amount words is "Rupees Five Thousand Only"');

  // 3. Final Sanction with Revised Amount (₹5,000 -> ₹4,500)
  console.log('\n--- Step 3: Approval with Revised Amount (₹4,500) ---');
  db.processNoteSheetAction(note.id, 'APPROVE', 'Endorsed', undefined, hodUser, 'HOI');
  db.processNoteSheetAction(note.id, 'APPROVE', 'Endorsed', undefined, prinUser, 'DEPUTY_REGISTRAR');
  db.processNoteSheetAction(note.id, 'APPROVE', 'Verified', undefined, dyRegUser, 'REGISTRAR');
  db.processNoteSheetAction(note.id, 'APPROVE', 'Forwarded to VP', undefined, regUser, 'VICE_PRESIDENT');
  db.processNoteSheetAction(
    note.id,
    'APPROVE',
    'Approved with revised ceiling of ₹4,500 per department quota.',
    undefined,
    vpUser,
    'COMPLETED',
    {
      approvedAmount: 4500,
      approvedAmountRemarks: 'Sanctioned for ₹4,500'
    }
  );

  const approvedNote = db.getNoteSheetById(note.id)!;
  assert(approvedNote.status === 'APPROVED', 'Notesheet status is final APPROVED');
  assert(approvedNote.approvedAmount === 4500, 'Approved amount is ₹4,500');
  assert(amountToWords(approvedNote.approvedAmount) === 'Rupees Four Thousand Five Hundred Only', 'Approved amount in words is "Rupees Four Thousand Five Hundred Only"');
  assert(amountToWords(approvedNote.originalRequestedAmount || approvedNote.requestedAmount) === 'Rupees Five Thousand Only', 'Requested amount in words remains "Rupees Five Thousand Only"');

  // 4. PDF Generation & Embedding Verification
  console.log('\n--- Step 4: PDF Generation and Stream Text Verification ---');
  const pdfRes = await notesheetPdfService.generatePdf(note.id, vpUser, vpUser.role, { forceRegenerate: true });
  assert(Boolean(pdfRes.pdfId), 'PDF generated successfully');
  assert(pdfRes.fileSize > 200000, `Generated PDF size: ${pdfRes.fileSize} bytes`);

  const base64Data = pdfRes.downloadUrl.split(',')[1];
  let fullPdfText = atob(base64Data);
  try {
    const globalAny = globalThis as any;
    if (typeof globalAny.process !== 'undefined' && globalAny.process.versions?.node) {
      const zlib = await import('' + 'zlib');
      const Buf = globalAny.Buffer;
      const pdfBuf = Buf.from(base64Data, 'base64');
      let offset = 0;
      while (offset < pdfBuf.length) {
        const streamStart = pdfBuf.indexOf(Buf.from('stream\n'), offset);
        if (streamStart === -1) break;
        const dataStart = streamStart + 7;
        const streamEnd = pdfBuf.indexOf(Buf.from('\nendstream'), dataStart);
        if (streamEnd === -1) break;
        try {
          const decompressed = zlib.inflateSync(pdfBuf.subarray(dataStart, streamEnd)).toString('latin1');
          fullPdfText += ' ' + decompressed;
        } catch {}
        offset = streamEnd + 10;
      }
    }
  } catch {}

  assert(fullPdfText.includes('Rupees Five Thousand Only'), 'PDF contains "Rupees Five Thousand Only" for requested amount');
  assert(fullPdfText.includes('Rupees Four Thousand Five Hundred Only'), 'PDF contains "Rupees Four Thousand Five Hundred Only" for final approved amount');
  assert(fullPdfText.includes('Total Requested Amount:'), 'PDF contains Total Requested Amount label in full-width footer row');
  assert(fullPdfText.includes('Final Approved / Sanctioned Amount:'), 'PDF contains Final Approved / Sanctioned Amount label in full-width footer row');
  assert(fullPdfText.includes('5,000'), 'PDF contains requested numeric amount 5,000');
  assert(fullPdfText.includes('4,500'), 'PDF contains approved numeric amount 4,500');

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} OF ${passed + failed} TESTS PASSED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed.`);
  }
}

runAmountInWordsTests().catch(err => {
  console.error('Test execution failed:', err);
  throw err;
});
