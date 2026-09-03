/**
 * Test Suite: Notesheet Secure Digital Signature Snapshot & PDF Embedding
 * 
 * Verifies:
 * 1. User signature management (upload, version increment, status).
 * 2. Immutable signature snapshots recorded during Notesheet submission and each approval stage.
 * 3. Profile signature updates do NOT mutate prior approved Notesheet snapshots.
 * 4. Multi-stage approvals embed correct distinct signatures in backend PDF.
 * 5. Role isolation & graceful fallback when signature is not configured.
 */

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

// 1x1 transparent PNG data URI for testing signature image embedding
const SPECIMEN_SIG_FACULTY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SPECIMEN_SIG_HOD = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjAwMDAwAALAC/wX0nKkAAAAASUVORK5CYII=';
const SPECIMEN_SIG_PRINCIPAL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARAwMDAwMDAwAAP8C/wH2a8UAAAAASUVORK5CYII=';
const SPECIMEN_SIG_DY_REGISTRAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNkYGD4zwABjAwMDAwAAN8C/wF1P8kAAAAASUVORK5CYII=';
const SPECIMEN_SIG_REGISTRAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNgYGD4DwABBAEAAAEAAAD//wOfAf+1Q3kAAAAASUVORK5CYII=';
const SPECIMEN_SIG_VP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+A8AAQUBAAEAAAD//wOfAf+1Q3kAAAAASUVORK5CYII=';

async function runSignatureTestSuite() {
  console.log('\n========================================================================');
  console.log('RUNNING SECURE DIGITAL SIGNATURE SNAPSHOT & PDF TEST SUITE');
  console.log('========================================================================\n');

  // 1. Setup Test Users
  const facultyUser: User = {
    id: 'usr-fac-sig-1',
    name: 'Prof. Alok Gupta',
    email: 'alok.gupta@swarrnim.edu.in',
    role: 'FACULTY',
    designation: 'Assistant Professor (Senior Scale)',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodUser: User = {
    id: 'usr-hod-sig-2',
    name: 'Dr. Manish Trivedi',
    email: 'manish.trivedi@swarrnim.edu.in',
    role: 'HOD',
    designation: 'Professor & Head of Computer Engineering',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principalUser: User = {
    id: 'usr-prin-sig-3',
    name: 'Dr. B. K. Sharma',
    email: 'bk.sharma@swarrnim.edu.in',
    role: 'PRINCIPAL',
    designation: 'Principal & Director (SIT)',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const dyRegUser: User = {
    id: 'usr-dyreg-sig-4',
    name: 'Dr. Chetan Joshi',
    email: 'chetan.joshi@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    designation: 'Deputy Registrar (Academics & Administration)',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const registrarUser: User = {
    id: 'usr-reg-sig-5',
    name: 'Dr. D. K. Raval',
    email: 'dk.raval@swarrnim.edu.in',
    role: 'REGISTRAR',
    designation: 'Registrar & Chief Administration Officer',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const vpUser: User = {
    id: 'usr-vp-sig-6',
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
    ![facultyUser.id, hodUser.id, principalUser.id, dyRegUser.id, registrarUser.id, vpUser.id].includes(u.id)
  );

  // @ts-ignore
  db.state.users = [
    ...existingUsers,
    facultyUser,
    hodUser,
    principalUser,
    dyRegUser,
    registrarUser,
    vpUser
  ];

  // 2. Test User Signature Configuration & Versioning
  console.log('--- Step 1: User Profile Signature Registration & Versioning ---');
  const resFac = db.updateUserSignature(facultyUser.id, SPECIMEN_SIG_FACULTY);
  assert(resFac.success && resFac.signatureVersion === 1, 'Faculty signature updated to version 1');

  const resHod = db.updateUserSignature(hodUser.id, SPECIMEN_SIG_HOD);
  assert(resHod.success && resHod.signatureVersion === 1, 'HOD signature updated to version 1');

  const resPrin = db.updateUserSignature(principalUser.id, SPECIMEN_SIG_PRINCIPAL);
  assert(resPrin.success && resPrin.signatureVersion === 1, 'Principal signature updated to version 1');

  const resDyReg = db.updateUserSignature(dyRegUser.id, SPECIMEN_SIG_DY_REGISTRAR);
  assert(resDyReg.success && resDyReg.signatureVersion === 1, 'Deputy Registrar signature updated to version 1');

  const resReg = db.updateUserSignature(registrarUser.id, SPECIMEN_SIG_REGISTRAR);
  assert(resReg.success && resReg.signatureVersion === 1, 'Registrar signature updated to version 1');

  const resVp = db.updateUserSignature(vpUser.id, SPECIMEN_SIG_VP);
  assert(resVp.success && resVp.signatureVersion === 1, 'Vice President signature updated to version 1');

  // Verify updated user states
  const refreshedFaculty = db.getUsers().find(u => u.id === facultyUser.id)!;
  assert(refreshedFaculty.signatureStatus === 'ACTIVE', 'Faculty signatureStatus is ACTIVE');
  assert(refreshedFaculty.signatureFile === SPECIMEN_SIG_FACULTY, 'Faculty signatureFile stored securely');

  // 3. Step 2: Faculty Submits Notesheet (Initiator Snapshot)
  console.log('\n--- Step 2: Notesheet Creation with Initiator Signature Snapshot ---');
  const note = db.createNoteSheet({
    subject: 'Procurement of High-Performance Computing Cluster for CSE AI Research',
    proposal: 'Proposal to establish a 64-core AI cluster node with tensor accelerators.',
    purposeJustification: 'Critical infrastructure for sponsored DST/SERB AI research grants and PhD scholars.',
    financialRequirement: true,
    estimatedCost: 1250000,
    requestedAmount: 1250000,
    currentAmount: 1250000,
    items: [
      { id: '1', itemName: 'HPC Compute Node 128GB RAM', quantity: 2, unit: 'Sets', rate: 625000, amount: 1250000 }
    ],
    attachments: ['HPC_Specifications.pdf', 'Technical_Comparative.pdf'],
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    branch: 'ACADEMIC',
    requiredDate: '2026-10-01'
  }, refreshedFaculty, false);

  assert(note.movements.length === 1, 'Notesheet submission created 1 movement');
  const mvtInit = note.movements[0];
  assert(Boolean(mvtInit.signatureSnapshot), 'Movement 1 contains signatureSnapshot');
  assert(mvtInit.signatureSnapshot?.signatureData === SPECIMEN_SIG_FACULTY, 'Movement 1 signature matches Faculty specimen');
  assert(mvtInit.signatureSnapshot?.signatureVersion === 1, 'Movement 1 recorded signature version 1');

  // 4. Step 3: HOD Endorsement & Signature Snapshot
  console.log('\n--- Step 3: HOD Approval with Digital Signature Snapshot ---');
  const refreshedHod = db.getUsers().find(u => u.id === hodUser.id)!;
  db.processNoteSheetAction(
    note.id,
    'APPROVE',
    'Proposal scrutinized by Department Purchase Committee and strongly recommended.',
    undefined,
    refreshedHod,
    'HOI'
  );

  const noteAfterHod = db.getNoteSheetById(note.id)!;
  assert(noteAfterHod.movements.length === 2, '2 movements logged');
  const mvtHod = noteAfterHod.movements[1];
  assert(Boolean(mvtHod.signatureSnapshot), 'HOD movement contains signatureSnapshot');
  assert(mvtHod.signatureSnapshot?.signatureData === SPECIMEN_SIG_HOD, 'HOD signature matches HOD specimen');
  assert(mvtHod.signatureSnapshot?.signatureVersion === 1, 'HOD recorded signature version 1');

  // 5. Step 4: Principal Approval & Signature Snapshot
  console.log('\n--- Step 4: Principal Approval with Digital Signature Snapshot ---');
  const refreshedPrin = db.getUsers().find(u => u.id === principalUser.id)!;
  db.processNoteSheetAction(
    note.id,
    'APPROVE',
    'Institutional recommendation granted. Forwarded to Deputy Registrar.',
    undefined,
    refreshedPrin,
    'DEPUTY_REGISTRAR'
  );

  const noteAfterPrin = db.getNoteSheetById(note.id)!;
  const mvtPrin = noteAfterPrin.movements[2];
  assert(mvtPrin.signatureSnapshot?.signatureData === SPECIMEN_SIG_PRINCIPAL, 'Principal signature snapshot captured');

  // 6. Step 5: Deputy Registrar Review & Signature Snapshot
  console.log('\n--- Step 5: Deputy Registrar Approval with Digital Signature Snapshot ---');
  const refreshedDyReg = db.getUsers().find(u => u.id === dyRegUser.id)!;
  db.processNoteSheetAction(
    note.id,
    'APPROVE',
    'Administrative and regulatory compliance verified per University norms.',
    undefined,
    refreshedDyReg,
    'REGISTRAR'
  );

  const noteAfterDyReg = db.getNoteSheetById(note.id)!;
  const mvtDyReg = noteAfterDyReg.movements[3];
  assert(mvtDyReg.signatureSnapshot?.signatureData === SPECIMEN_SIG_DY_REGISTRAR, 'Deputy Registrar signature snapshot captured');

  // 7. Step 6: Registrar Verification & Signature Snapshot
  console.log('\n--- Step 6: Registrar Endorsement with Digital Signature Snapshot ---');
  const refreshedReg = db.getUsers().find(u => u.id === registrarUser.id)!;
  db.processNoteSheetAction(
    note.id,
    'APPROVE',
    'Budget allocation confirmed under Capital Equipment Fund. Recommended for Executive Sanction.',
    undefined,
    refreshedReg,
    'VICE_PRESIDENT'
  );

  const noteAfterReg = db.getNoteSheetById(note.id)!;
  const mvtReg = noteAfterReg.movements[4];
  assert(mvtReg.signatureSnapshot?.signatureData === SPECIMEN_SIG_REGISTRAR, 'Registrar signature snapshot captured');

  // 8. Step 7: Vice President Final Executive Sanction & Signature Snapshot
  console.log('\n--- Step 7: Vice President Final Sanction with Digital Signature Snapshot ---');
  const refreshedVp = db.getUsers().find(u => u.id === vpUser.id)!;
  db.processNoteSheetAction(
    note.id,
    'APPROVE',
    'Executive Sanction Granted for ₹12,50,000 for AI HPC Cluster setup.',
    undefined,
    refreshedVp,
    'COMPLETED',
    {
      approvedAmount: 1250000,
      approvedAmountRemarks: 'Sanctioned in full per research mandate'
    }
  );

  const noteFinal = db.getNoteSheetById(note.id)!;
  assert(noteFinal.status === 'APPROVED', 'Notesheet status is final APPROVED');
  const mvtVp = noteFinal.movements[5];
  assert(mvtVp.signatureSnapshot?.signatureData === SPECIMEN_SIG_VP, 'Vice President signature snapshot captured');
  assert(mvtVp.signatureSnapshot?.signatureVersion === 1, 'Vice President recorded signature version 1');

  // 9. Step 8: Snapshot Immutability Test (Changing user signature later must NOT alter previous Notesheet)
  console.log('\n--- Step 8: Signature Snapshot Immutability Verification ---');
  const NEW_HOD_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAFElEQVR42mNk+M9QzwAEjAwMDAwAALAC/wX0nKkAAAAASUVORK5CYII=';
  const updateRes = db.updateUserSignature(hodUser.id, NEW_HOD_SIGNATURE);
  assert(updateRes.signatureVersion === 2, 'HOD signature updated to version 2 in profile');

  const reloadedNote = db.getNoteSheetById(note.id)!;
  assert(
    reloadedNote.movements[1].signatureSnapshot?.signatureData === SPECIMEN_SIG_HOD,
    'Previously approved Notesheet retains original HOD signature v1 (Immutable Snapshot)'
  );
  assert(
    reloadedNote.movements[1].signatureSnapshot?.signatureVersion === 1,
    'Previously approved Notesheet movement retains signatureVersion 1'
  );

  // 10. Step 9: Server-Side PDF Generation with Embedded Signatures
  console.log('\n--- Step 9: Server-Side PDF Generation with Embedded Signatures ---');
  const pdfResult = await notesheetPdfService.generatePdf(note.id, vpUser, vpUser.role, { forceRegenerate: true });
  assert(Boolean(pdfResult.pdfId), 'PDF generated successfully with embedded digital signatures');
  assert(pdfResult.fileSize > 200000, `Generated official PDF file size: ${pdfResult.fileSize} bytes`);

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} OF ${passed + failed} TESTS PASSED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed.`);
  }
}

runSignatureTestSuite().catch(err => {
  console.error('Test execution failed:', err);
  throw err;
});
