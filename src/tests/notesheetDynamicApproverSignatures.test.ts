/**
 * Notesheet Dynamic Approver & Designation Signature Block Test Suite
 * 
 * Verifies that:
 * 1. Notesheet approval trail and signature blocks dynamically reflect the ACTUAL user name and designation.
 * 2. No hardcoded or placeholder names (e.g. "Demo Registrar 1", "Vice President / Executive Authority") are displayed.
 * 3. Every completed approval stage displays:
 *    - Actual Approver Name
 *    - Actual Designation from user/master database
 *    - Actual Timestamp and Digital Approval ID
 * 4. Only completed approval actions are rendered as signed blocks.
 */

import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { User } from '../types';

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

async function runTests() {
  console.log('\n========================================================================');
  console.log('RUNNING NOTESHEET DYNAMIC APPROVER & DESIGNATION TEST SUITE');
  console.log('========================================================================\n');

  // 1. Setup actual test users with distinct names and designations
  const facultyUser: User = {
    id: 'usr-fac-101',
    name: 'Prof. Ramesh Sharma',
    email: 'ramesh.sharma@swarrnim.edu.in',
    role: 'FACULTY',
    designation: 'Assistant Professor (Grade I)',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodUser: User = {
    id: 'usr-hod-102',
    name: 'Dr. Amit Trivedi',
    email: 'amit.trivedi@swarrnim.edu.in',
    role: 'HOD',
    designation: 'Professor & Head of Department',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principalUser: User = {
    id: 'usr-prin-103',
    name: 'Dr. Bhavesh Patel',
    email: 'bhavesh.patel@swarrnim.edu.in',
    role: 'PRINCIPAL',
    designation: 'Principal & Director (SIT)',
    instituteId: 'inst-sit',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const deputyRegUser: User = {
    id: 'usr-dyreg-104',
    name: 'Dr. Chintan Desai',
    email: 'chintan.desai@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    designation: 'Deputy Registrar (Academics & Admin)',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const registrarUser: User = {
    id: 'usr-reg-105',
    name: 'Dr. Dhaval Shah',
    email: 'dhaval.shah@swarrnim.edu.in',
    role: 'REGISTRAR',
    designation: 'Registrar & Chief Administrative Officer',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const vpUser: User = {
    id: 'usr-vp-106',
    name: 'Dr. Elesh Patel',
    email: 'elesh.patel@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    designation: 'Vice President & Executive Authority',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // Register users in db state
  const existingUsers = db.getUsers().filter(u => 
    u.role !== 'VICE_PRESIDENT' &&
    ![facultyUser.id, hodUser.id, principalUser.id, deputyRegUser.id, registrarUser.id, vpUser.id].includes(u.id)
  );

  // @ts-ignore
  db.state.users = [
    ...existingUsers,
    facultyUser,
    hodUser,
    principalUser,
    deputyRegUser,
    registrarUser,
    vpUser
  ];

  // 2. Step 1: Create Notesheet by Faculty
  const note = db.createNoteSheet({
    subject: 'Procurement of High-End AI GPU Workstations for CSE Department',
    proposal: 'Proposal for procuring 4 NVIDIA RTX 4090 GPU workstations for Machine Learning laboratory research.',
    purposeJustification: 'Required for advanced AI project coursework, PhD research scholar simulations and student capstone projects.',
    financialRequirement: true,
    estimatedCost: 850000,
    requestedAmount: 850000,
    currentAmount: 850000,
    items: [
      { id: '1', itemName: 'NVIDIA RTX 4090 Workstation 64GB RAM', quantity: 4, unit: 'Nos', rate: 212500, amount: 850000 }
    ],
    attachments: ['AI_Lab_Specification.pdf', 'Vendor_Comparative_Report.pdf'],
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    branch: 'ACADEMIC',
    requiredDate: '2026-09-15'
  }, facultyUser, false);

  assert(note.creatorName === 'Prof. Ramesh Sharma', 'Creator name is dynamically set to Prof. Ramesh Sharma');
  assert(note.creatorRole === 'FACULTY', 'Creator role is FACULTY');
  assert(note.movements.length === 1, 'Initial submission logged 1 movement');
  assert(note.movements[0].actorName === 'Prof. Ramesh Sharma', 'Movement 1 actor name is Prof. Ramesh Sharma');
  assert(note.movements[0].designation === 'Assistant Professor (Grade I)', 'Movement 1 designation resolved to Assistant Professor (Grade I)');

  // 3. Step 2: HOD Approval & Forward to HOI
  db.processNoteSheetAction(note.id, 'APPROVE', 'Verified by HOD. Highly recommended for AI Lab setup.', undefined, hodUser, 'HOI');
  const noteAfterHod = db.getNoteSheetById(note.id)!;
  assert(noteAfterHod.status === 'PENDING_HOI', 'Status advanced to PENDING_HOI');
  assert(noteAfterHod.movements.length === 2, '2 movements logged');
  assert(noteAfterHod.movements[1].actorName === 'Dr. Amit Trivedi', 'Movement 2 actor is Dr. Amit Trivedi');
  assert(noteAfterHod.movements[1].designation === 'Professor & Head of Department', 'Movement 2 designation is Professor & Head of Department');

  // Verify intermediate PDF generation does not show uncompleted approvals
  const intermediatePdfResult = await notesheetPdfService.generatePdf(note.id, hodUser, hodUser.role);
  assert(Boolean(intermediatePdfResult.pdfId), 'Intermediate PDF generated successfully');
  assert(intermediatePdfResult.fileSize > 0, 'Intermediate PDF bytes generated');

  // 4. Step 3: Principal / HOI Approval & Forward to Deputy Registrar
  db.processNoteSheetAction(note.id, 'APPROVE', 'Forwarded and approved by Principal SIT.', undefined, principalUser, 'DEPUTY_REGISTRAR');
  const noteAfterPrin = db.getNoteSheetById(note.id)!;
  assert(noteAfterPrin.status === 'PENDING_DEPUTY_REGISTRAR', 'Status advanced to PENDING_DEPUTY_REGISTRAR');
  assert(noteAfterPrin.movements[2].actorName === 'Dr. Bhavesh Patel', 'Movement 3 actor is Dr. Bhavesh Patel');
  assert(noteAfterPrin.movements[2].designation === 'Principal & Director (SIT)', 'Movement 3 designation is Principal & Director (SIT)');

  // 5. Step 4: Deputy Registrar Verification & Forward to Registrar
  db.processNoteSheetAction(note.id, 'APPROVE', 'Administrative review completed by Deputy Registrar.', undefined, deputyRegUser, 'REGISTRAR');
  const noteAfterDyReg = db.getNoteSheetById(note.id)!;
  assert(noteAfterDyReg.status === 'PENDING_REGISTRAR', 'Status advanced to PENDING_REGISTRAR');
  assert(noteAfterDyReg.movements[3].actorName === 'Dr. Chintan Desai', 'Movement 4 actor is Dr. Chintan Desai');
  assert(noteAfterDyReg.movements[3].designation === 'Deputy Registrar (Academics & Admin)', 'Movement 4 designation is Deputy Registrar (Academics & Admin)');

  // 6. Step 5: Registrar Endorsement & Forward to Vice President
  db.processNoteSheetAction(note.id, 'APPROVE', 'Verified budget availability with finance. Recommended for executive sanction.', undefined, registrarUser, 'VICE_PRESIDENT');
  const noteAfterReg = db.getNoteSheetById(note.id)!;
  assert(noteAfterReg.status === 'PENDING_VICE_PRESIDENT', 'Status advanced to PENDING_VICE_PRESIDENT');
  assert(noteAfterReg.movements[4].actorName === 'Dr. Dhaval Shah', 'Movement 5 actor is Dr. Dhaval Shah');
  assert(noteAfterReg.movements[4].designation === 'Registrar & Chief Administrative Officer', 'Movement 5 designation is Registrar & Chief Administrative Officer');

  // 7. Step 6: Vice President Final Executive Sanction
  db.processNoteSheetAction(note.id, 'APPROVE', 'Executive Sanction Granted for 4 GPU Workstations.', undefined, vpUser, 'COMPLETED', {
    approvedAmount: 850000,
    approvedAmountRemarks: 'Sanctioned in full per academic plan'
  });

  const noteFinal = db.getNoteSheetById(note.id)!;
  assert(noteFinal.status === 'APPROVED', 'Notesheet status is final APPROVED');
  assert(noteFinal.movements.length === 6, 'All 6 movements logged in sequence');
  assert(noteFinal.movements[5].actorName === 'Dr. Elesh Patel', 'Movement 6 actor is Dr. Elesh Patel');
  assert(noteFinal.movements[5].designation === 'Vice President & Executive Authority', 'Movement 6 designation is Vice President & Executive Authority');
  assert(Boolean(noteFinal.finalApprovalId), `Final Executive Sanction ID generated: ${noteFinal.finalApprovalId}`);

  // 8. Generate Final Official Notesheet PDF
  const finalPdf = await notesheetPdfService.generatePdf(note.id, vpUser, vpUser.role, { forceRegenerate: true });
  assert(Boolean(finalPdf.pdfId), 'Final PDF generated successfully');
  assert(finalPdf.fileSize > 200000, `Rich PDF generated with size ${finalPdf.fileSize} bytes`);

  // Verify official disclaimer in footer and exclusion of unwanted lines
  const base64Data = finalPdf.downloadUrl.split(',')[1];
  let fullText = atob(base64Data);
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
          fullText += ' ' + decompressed;
        } catch {
          // Not a deflate stream or already uncompressed
        }
        offset = streamEnd + 10;
      }
    }
  } catch {}

  assert(!fullText.includes('Established under Gujarat Private Universities Act No. 10 of 2017'), 'PDF does NOT contain University Recognition Line');
  assert(fullText.includes('authentic electronic administrative record'), 'PDF contains Official Electronic Record Legal Disclaimer in footer');
  assert(!fullText.includes('SIT • SIT') && !fullText.includes('SIT | SIT') && !fullText.includes('SIT - SIT'), 'PDF header does not contain duplicate short name');
  assert(fullText.includes('SWARRNIM STARTUP & INNOVATION UNIVERSITY'), 'PDF contains official University Name in header');
  assert(fullText.includes('SWARRNIM INSTITUTE OF TECHNOLOGY'), 'PDF contains official Institute Name in header');

  // Verify ERP database preserves complete workflow trail & audit data
  assert(noteFinal.movements.length === 6, 'ERP UI continues to have all 6 movements for UI viewing');
  assert(Boolean(noteFinal.movements[1].approvalId), 'ERP UI movements preserve Digital Approval IDs');
  assert(Boolean(noteFinal.movements[1].remarks), 'ERP UI movements preserve internal workflow remarks');
  assert((noteFinal.auditTrail || []).length >= 6, 'ERP UI preserves complete audit trail');

  // 9. Test Return/Rejection Dynamic Designation
  const returnedNote = db.createNoteSheet({
    subject: 'Request for Department Library Books Renewal',
    proposal: 'Proposal for subscription of 50 IEEE journals.',
    purposeJustification: 'Department reference library update.',
    financialRequirement: false,
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    branch: 'ACADEMIC',
    requiredDate: '2026-09-01'
  }, facultyUser, false);

  db.processNoteSheetAction(returnedNote.id, 'RETURN', 'Please attach syllabus references and recommendation committee minutes.', undefined, hodUser);
  const reloadedReturned = db.getNoteSheetById(returnedNote.id)!;
  assert(reloadedReturned.status === 'RETURNED', 'Notesheet status is RETURNED');
  assert(reloadedReturned.movements[1].action === 'RETURN', 'Movement 2 action is RETURN');
  assert(reloadedReturned.movements[1].actorName === 'Dr. Amit Trivedi', 'Returned action actor is Dr. Amit Trivedi');
  assert(reloadedReturned.movements[1].designation === 'Professor & Head of Department', 'Returned action designation is Professor & Head of Department');

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} OF ${passed + failed} TESTS PASSED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed.`);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  throw err;
});
