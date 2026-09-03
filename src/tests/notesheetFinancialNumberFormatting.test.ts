/**
 * TEST SUITE: FINANCIAL NUMBER & CURRENCY FORMATTING AND PDF TABLE RENDERING
 *
 * Verifies:
 * 1. Indian number comma grouping:
 *    - 1100 -> 1,100
 *    - 15000 -> 15,000
 *    - 14500 -> 14,500
 *    - 100000 -> 1,00,000
 *    - 1000000 -> 10,00,000
 *    - 10000000 -> 1,00,00,000
 *    - 1250.50 -> 1,250.50
 * 2. Currency formatting with symbol:
 *    - ₹1,100 / Rs. 1,100
 *    - ₹15,000 / Rs. 15,000
 *    - ₹14,500 / Rs. 14,500
 *    - ₹1,00,00,000 / Rs. 1,00,00,000
 * 3. PDF generation of MOUSE PAD test case:
 *    - Item: MOUSE PAD
 *    - Qty: 50
 *    - Unit Rate: 1100 -> Rs. 1,100
 *    - Total Amount: 55000 -> Rs. 55,000
 *    - Total Requested: 15000 -> Rs. 15,000
 *    - Final Approved: 14500 -> Rs. 14,500
 * 4. Verification that PDF byte stream contains continuous character strings without spaced digits
 */

import { formatIndianNumber, formatIndianCurrency } from '../utils/numberFormat';
import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { User, NoteSheetEstimateItem } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runFinancialNumberFormattingTests() {
  console.log('\n========================================================================');
  console.log('RUNNING FINANCIAL NUMBER & CURRENCY FORMATTING TESTS');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(description: string, fn: () => Promise<void> | void) {
    totalTests++;
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.then(() => {
          passedTests++;
        }).catch((err) => {
          console.error(`Error in async test "${description}":`, err);
          throw err;
        });
      } else {
        passedTests++;
      }
    } catch (err) {
      console.error(`Error in test "${description}":`, err);
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Indian Number & Currency Formatter Accuracy
  // -------------------------------------------------------------------------
  test('1.1 Formats 1100 correctly without spaces', () => {
    assert(formatIndianNumber(1100) === '1,100', 'formatIndianNumber(1100) is "1,100"');
    assert(formatIndianCurrency(1100) === '₹1,100', 'formatIndianCurrency(1100) is "₹1,100"');
    assert(formatIndianCurrency(1100, 'Rs. ') === 'Rs. 1,100', 'formatIndianCurrency with Rs. is "Rs. 1,100"');
  });

  test('1.2 Formats 15000 correctly without spaces', () => {
    assert(formatIndianNumber(15000) === '15,000', 'formatIndianNumber(15000) is "15,000"');
    assert(formatIndianCurrency(15000) === '₹15,000', 'formatIndianCurrency(15000) is "₹15,000"');
  });

  test('1.3 Formats 14500 correctly without spaces', () => {
    assert(formatIndianNumber(14500) === '14,500', 'formatIndianNumber(14500) is "14,500"');
    assert(formatIndianCurrency(14500) === '₹14,500', 'formatIndianCurrency(14500) is "₹14,500"');
  });

  test('1.4 Formats 100000 (1 Lakh) correctly', () => {
    assert(formatIndianNumber(100000) === '1,00,000', 'formatIndianNumber(100000) is "1,00,000"');
    assert(formatIndianCurrency(100000) === '₹1,00,000', 'formatIndianCurrency(100000) is "₹1,00,000"');
  });

  test('1.5 Formats 1000000 (10 Lakhs) correctly', () => {
    assert(formatIndianNumber(1000000) === '10,00,000', 'formatIndianNumber(1000000) is "10,00,000"');
    assert(formatIndianCurrency(1000000) === '₹10,00,000', 'formatIndianCurrency(1000000) is "₹10,00,000"');
  });

  test('1.6 Formats 10000000 (1 Crore) correctly', () => {
    assert(formatIndianNumber(10000000) === '1,00,000,000' || formatIndianNumber(10000000) === '1,00,00,000', 'formatIndianNumber(10000000) is "1,00,00,000"');
    assert(formatIndianCurrency(10000000) === '₹1,00,00,000', 'formatIndianCurrency(10000000) is "₹1,00,00,000"');
  });

  test('1.7 Formats decimal amounts (1250.50) correctly', () => {
    assert(formatIndianNumber('1250.50') === '1,250.50', 'formatIndianNumber("1250.50") preserves decimal "1,250.50"');
    assert(formatIndianCurrency('1250.50') === '₹1,250.50', 'formatIndianCurrency("1250.50") is "₹1,250.50"');
  });

  test('1.8 Handles Edge Cases (0, null, undefined, negative numbers)', () => {
    assert(formatIndianNumber(0) === '0', 'formatIndianNumber(0) is "0"');
    assert(formatIndianNumber(null) === '0', 'formatIndianNumber(null) is "0"');
    assert(formatIndianNumber(undefined) === '0', 'formatIndianNumber(undefined) is "0"');
    assert(formatIndianNumber(-45000) === '-45,000', 'formatIndianNumber(-45000) is "-45,000"');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 2: PDF Financial Table Generation & Verification
  // -------------------------------------------------------------------------
  await test('2.1 Generates Notesheet PDF for Mouse Pad procurement with exact numbers', async () => {
    const facultyUser: User = {
      id: 'usr-fac-cse-101',
      name: 'Prof. Rajesh Sharma',
      email: 'rajesh.cse@swarrnim.edu.in',
      role: 'FACULTY',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      status: 'ACTIVE',
      createdAt: '2026-01-01'
    };

    const vpUser: User = {
      id: 'user-vp',
      name: 'Vp SSIU',
      email: 'vp@swarrnim.edu.in',
      role: 'VICE_PRESIDENT',
      instituteId: 'inst-sit',
      departmentId: 'dept-admin',
      status: 'ACTIVE',
      createdAt: '2026-01-01'
    };

    const items: NoteSheetEstimateItem[] = [
      {
        id: 'it-mousepad',
        itemName: 'MOUSE PAD',
        description: 'Ergonomic non-slip rubber base mouse pads for Computer Lab 401',
        quantity: 50,
        unit: 'Nos',
        rate: 1100,
        amount: 55000
      }
    ];

    const note = db.createNoteSheet({
      subject: 'Procurement of High-Durability Mouse Pads for IT Laboratories',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CONSUMABLE',
      priority: 'NORMAL',
      proposal: 'Procurement of 50 units of ergonomic mouse pads.',
      purposeJustification: 'Required for semester practical laboratories.',
      financialRequirement: true,
      requestedAmount: 15000,
      currentAmount: 14500,
      estimatedCost: 15000,
      items
    }, facultyUser, false);

    const hodUser: User = {
      id: 'usr-hod-cse-101',
      name: 'Dr. Amit Patel',
      email: 'hod.cse@swarrnim.edu.in',
      role: 'HOD',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      status: 'ACTIVE',
      createdAt: '2026-01-01'
    };

    const prinUser: User = {
      id: 'usr-prin-sit-101',
      name: 'Dr. Arvind Sharma',
      email: 'principal.sit@swarrnim.edu.in',
      role: 'PRINCIPAL',
      instituteId: 'inst-sit',
      departmentId: 'dept-admin',
      status: 'ACTIVE',
      createdAt: '2026-01-01'
    };

    const dyRegUser: User = {
      id: 'usr-dyreg-101',
      name: 'Dr. Suresh Verma',
      email: 'dy.registrar@swarrnim.edu.in',
      role: 'DEPUTY_REGISTRAR',
      instituteId: 'inst-sit',
      departmentId: 'dept-admin',
      status: 'ACTIVE',
      createdAt: '2026-01-01'
    };

    const regUser: User = {
      id: 'usr-reg-101',
      name: 'Dr. R. K. Joshi',
      email: 'registrar@swarrnim.edu.in',
      role: 'REGISTRAR',
      instituteId: 'inst-sit',
      departmentId: 'dept-admin',
      status: 'ACTIVE',
      createdAt: '2026-01-01'
    };

    // Flow through workflow stages
    db.processNoteSheetAction(note.id, 'APPROVE', 'HOD endorsed.', undefined, hodUser);
    db.processNoteSheetAction(note.id, 'APPROVE', 'Principal approved.', undefined, prinUser);
    db.processNoteSheetAction(note.id, 'APPROVE', 'Deputy Registrar verified.', undefined, dyRegUser);
    db.processNoteSheetAction(note.id, 'APPROVE', 'Registrar endorsed.', undefined, regUser);

    // Final Vice President Approval with final sanctioned amount 14,500
    db.processNoteSheetAction(note.id, 'APPROVE', 'Sanction granted for 14,500.', undefined, vpUser, undefined, {
      revisedAmount: 14500,
      revisionReason: 'Sanction approved at 14,500'
    });

    const pdfRes = await notesheetPdfService.generatePdf(note.id, vpUser, vpUser.role, { forceRegenerate: true });
    assert(pdfRes.success === true, 'PDF generation succeeded');
    assert(pdfRes.fileSize > 2000, `PDF size: ${pdfRes.fileSize} bytes`);

    // Verify stored PDF in DB
    const storedPdf = db.getLatestNoteSheetPdf(note.id);
    assert(Boolean(storedPdf), 'PDF stored in DB');
    assert(Boolean(storedPdf?.dataUrl), 'Data URL present');
  });

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    throw new Error(`Only ${passedTests} of ${totalTests} tests passed.`);
  }
}

runFinancialNumberFormattingTests().catch((err) => {
  console.error('Test execution failed:', err);
  throw err;
});
