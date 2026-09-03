// @ts-nocheck
import zlib from 'zlib';
import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { User, NoteSheet } from '../types';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('RUNNING REGISTRAR INWARD & OUTWARD AUTOMATION TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition: boolean, testName: string, actual?: any, expected?: any) => {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (actual !== undefined || expected !== undefined) {
        console.error(`         Expected: ${JSON.stringify(expected)}`);
        console.error(`         Actual:   ${JSON.stringify(actual)}`);
      }
    }
  };

  // Fetch active system users
  const allUsers = db.getUsers();
  const facultyUser = allUsers.find(u => u.role === 'FACULTY') || allUsers[0];
  const hodUser = allUsers.find(u => u.role === 'HOD') || allUsers.find(u => u.id === 'usr-hod-cse')!;
  const principalUser = allUsers.find(u => u.role === 'PRINCIPAL') || allUsers.find(u => u.id === 'user-principal-1')!;
  const dyRegistrarUser = allUsers.find(u => u.role === 'DEPUTY_REGISTRAR') || allUsers.find(u => u.id === 'user-dy-reg-sit')!;
  const registrarUser = allUsers.find(u => u.role === 'REGISTRAR') || allUsers.find(u => u.id === 'user-registrar')!;
  const vpUser = allUsers.find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE') || allUsers.find(u => u.id === 'user-vp')!;

  const studentUser: User = allUsers.find(u => u.role === 'STUDENT') || {
    id: 'usr-stud-01',
    name: 'Student User',
    email: 'student@swarrnim.edu.in',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // Clear in-memory state
  const state = (db as any).state;
  state.notesheets = [];
  state.inwardOutwardRecords = [];
  state.auditLogs = [];

  console.log('--- Step 1: Create Notesheet and Progress Through Workflow Stages ---');
  const note1 = db.createNoteSheet({
    title: 'Computer Lab GPU Server Procurement',
    subject: 'Procurement of High-Performance GPU Workstations for AI Lab',
    proposal: 'Proposal to procure 4x NVIDIA RTX GPU Servers for advanced AI research.',
    purposeJustification: 'Required for AI Research Lab student projects and sponsored research.',
    category: 'Infrastructure',
    instituteId: 'inst-sit',
    instituteCode: 'SIT',
    instituteName: 'Swarrnim Institute of Technology',
    departmentId: 'dept-cse',
    departmentName: 'Computer Engineering',
    department: 'Computer Engineering',
    budgetRequired: true,
    estimatedCost: 650000,
    requestedAmount: 650000,
    currentAmount: 650000,
    priority: 'HIGH',
    creatorId: facultyUser.id,
    creatorName: facultyUser.name,
    creatorRole: facultyUser.role,
    contactNumber: '+91 98765 43210',
    date: '2026-08-19',
    requiredDate: '2026-09-01'
  }, facultyUser);

  assert(note1.status === 'PENDING_HOD', 'Note 1 status is PENDING_HOD', note1.status, 'PENDING_HOD');
  assert(note1.inwardNumber === undefined, 'Note 1 has no inward number prior to final approval');

  // HOD approves
  db.processNoteSheetAction(note1.id, 'FORWARD', 'Recommended for lab upgrade', undefined, hodUser);
  // Principal approves
  db.processNoteSheetAction(note1.id, 'FORWARD', 'Endorsed by HOI', undefined, principalUser);
  // Deputy Registrar approves
  db.processNoteSheetAction(note1.id, 'FORWARD', 'Verified budgetary compliance', undefined, dyRegistrarUser);
  // Registrar approves
  db.processNoteSheetAction(note1.id, 'FORWARD', 'Recommended to VP for final sanction', undefined, registrarUser);

  const beforeFinalNote = db.getNoteSheetById(note1.id)!;
  assert(beforeFinalNote.status === 'PENDING_VICE_PRESIDENT', 'Note 1 is at PENDING_VICE_PRESIDENT stage');
  assert(beforeFinalNote.inwardNumber === undefined, 'Note 1 still has no inward number before VP sanction');

  console.log('\n--- Step 2: VP Final Sanction Triggers Automatic Inward Generation ---');
  db.processNoteSheetAction(note1.id, 'APPROVE', 'Sanctioned and approved.', undefined, vpUser);
  const finalApprovedNote = db.getNoteSheetById(note1.id)!;

  assert(finalApprovedNote.status === 'APPROVED', 'Notesheet status is APPROVED', finalApprovedNote.status, 'APPROVED');
  assert(finalApprovedNote.decision === 'APPROVED', 'Notesheet decision is APPROVED');
  assert(!!finalApprovedNote.inwardNumber, 'Notesheet has inwardNumber generated', finalApprovedNote.inwardNumber);
  assert(finalApprovedNote.inwardNumber!.startsWith('REG-IN-2026-'), 'Inward format matches REG-IN-2026-XXXXXX', finalApprovedNote.inwardNumber);
  assert(!!finalApprovedNote.inwardId, 'Notesheet has inwardId linked', finalApprovedNote.inwardId);
  assert(finalApprovedNote.inwardDate === new Date().toISOString().split('T')[0], 'Inward date is today');

  console.log('\n--- Step 3: Verify Inward Record in Registrar Register ---');
  const inwardRecords = db.getInwardOutwardRecords({ type: 'INWARD' });
  assert(inwardRecords.length === 1, 'Exactly 1 Inward record exists in Registrar register', inwardRecords.length, 1);
  const inwRecord = inwardRecords[0];
  assert(inwRecord.inwardNumber === finalApprovedNote.inwardNumber, 'Inward record number matches Notesheet inwardNumber');
  assert(inwRecord.notesheetId === note1.id, 'Inward record is linked to Notesheet ID');
  assert(inwRecord.notesheetNumber === note1.noteSheetNumber, 'Inward record is linked to Notesheet Number');
  assert(inwRecord.subject === note1.subject, 'Inward subject matches Notesheet subject');
  assert(inwRecord.status === 'RECEIVED', 'Inward record status is RECEIVED', inwRecord.status, 'RECEIVED');

  console.log('\n--- Step 4: Idempotency Verification (No Duplicate Inward Records) ---');
  // Re-calling inward generation directly or approving again
  const secondInward = db.createRegistrarInwardForApprovedNotesheet(finalApprovedNote, vpUser);
  assert(secondInward.id === inwRecord.id, 'Second call returns identical Inward record ID (Idempotent)');
  assert(secondInward.inwardNumber === inwRecord.inwardNumber, 'Second call reuses exact same Inward Number');
  const totalInwardAfterSecondCall = db.getInwardOutwardRecords({ type: 'INWARD' });
  assert(totalInwardAfterSecondCall.length === 1, 'Total Inward count remains strictly 1 (No duplicates created)', totalInwardAfterSecondCall.length, 1);

  console.log('\n--- Step 5: Security & RBAC Guard on Outward Dispatch ---');
  const unauthorizedAttempt = db.processRegistrarOutwardForNotesheet(note1.id, {}, studentUser);
  assert(!unauthorizedAttempt.success, 'Student cannot trigger Outward generation');
  assert(unauthorizedAttempt.message.includes('Unauthorized'), 'Error message states Unauthorized');

  console.log('\n--- Step 6: Registrar Processes Inward and Generates Outward Dispatch ---');
  const outwardResult = db.processRegistrarOutwardForNotesheet(note1.id, {
    recipient: 'Prof. Rajesh Sharma (Faculty Coordinator)',
    destinationInstitute: 'SIT - Computer Engineering',
    remarks: 'Official sanction letter and notesheet copy dispatched to department.'
  }, registrarUser);

  assert(outwardResult.success, 'Registrar Outward generation succeeded');
  assert(!!outwardResult.outwardNumber, 'Outward Number generated', outwardResult.outwardNumber);
  assert(outwardResult.outwardNumber!.startsWith('REG-OUT-2026-'), 'Outward format matches REG-OUT-2026-XXXXXX', outwardResult.outwardNumber);

  const updatedNote = db.getNoteSheetById(note1.id)!;
  assert(updatedNote.outwardNumber === outwardResult.outwardNumber, 'Notesheet has outwardNumber linked', updatedNote.outwardNumber);
  assert(updatedNote.outwardStatus === 'DISPATCHED', 'Notesheet outwardStatus is DISPATCHED');
  assert(updatedNote.outwardIssuedByName === registrarUser.name, 'Notesheet outwardIssuedByName is Registrar');

  const outwardRecords = db.getInwardOutwardRecords({ type: 'OUTWARD' });
  assert(outwardRecords.length === 1, 'Exactly 1 Outward record in Registrar register', outwardRecords.length, 1);
  const outRecord = outwardRecords[0];
  assert(outRecord.outwardNumber === outwardResult.outwardNumber, 'Outward record matches generated Outward Number');
  assert(outRecord.inwardNumber === finalApprovedNote.inwardNumber, 'Outward record is permanently linked to Inward Number');
  assert(outRecord.notesheetId === note1.id, 'Outward record is linked to Notesheet ID');

  // Verify updated Inward record
  const updatedInwRecord = db.getInwardOutwardRecordById(inwRecord.id)!;
  assert(updatedInwRecord.status === 'DISPATCHED', 'Inward record status updated to DISPATCHED');
  assert(updatedInwRecord.outwardNumber === outwardResult.outwardNumber, 'Inward record links outwardNumber');

  console.log('\n--- Step 7: Sequential Numbering with Multiple Notesheets ---');
  const note2 = db.createNoteSheet({
    title: 'Robotics Workshop Sponsorship',
    subject: 'Sponsorship for National Robotics Workshop 2026',
    proposal: 'Workshop proposal for 2-day hands-on robotics event.',
    purposeJustification: 'Skill enhancement for mechanical and computer students.',
    category: 'Event',
    instituteId: 'inst-sit',
    instituteCode: 'SIT',
    instituteName: 'Swarrnim Institute of Technology',
    departmentId: 'dept-me',
    departmentName: 'Mechanical Engineering',
    budgetRequired: true,
    estimatedCost: 75000,
    requestedAmount: 75000,
    currentAmount: 75000,
    priority: 'NORMAL',
    creatorId: facultyUser.id,
    creatorName: facultyUser.name,
    contactNumber: '+91 98765 43210',
    date: '2026-08-19',
    requiredDate: '2026-09-10'
  }, facultyUser);

  // Directly sanction note 2 to final approval
  db.processNoteSheetAction(note2.id, 'FORWARD', 'HOD Endorsement', undefined, hodUser);
  db.processNoteSheetAction(note2.id, 'FORWARD', 'HOI Endorsement', undefined, principalUser);
  db.processNoteSheetAction(note2.id, 'FORWARD', 'DR Endorsement', undefined, dyRegistrarUser);
  db.processNoteSheetAction(note2.id, 'FORWARD', 'Registrar Endorsement', undefined, registrarUser);
  db.processNoteSheetAction(note2.id, 'APPROVE', 'Sanctioned', undefined, vpUser);
  const approvedNote2 = db.getNoteSheetById(note2.id)!;

  assert(!!approvedNote2.inwardNumber, 'Note 2 received Inward Number');
  assert(approvedNote2.inwardNumber !== finalApprovedNote.inwardNumber, 'Note 2 Inward Number is distinct from Note 1');
  assert(approvedNote2.inwardNumber === 'REG-IN-2026-000002', 'Note 2 Inward Number is sequential: REG-IN-2026-000002', approvedNote2.inwardNumber, 'REG-IN-2026-000002');

  const outwardResult2 = db.processRegistrarOutwardForNotesheet(note2.id, {}, registrarUser);
  assert(outwardResult2.outwardNumber === 'REG-OUT-2026-000002', 'Note 2 Outward Number is sequential: REG-OUT-2026-000002', outwardResult2.outwardNumber, 'REG-OUT-2026-000002');

  console.log('\n--- Step 8: PDF Stream Generation with Inward/Outward Header ---');
  const pdfResponse = await notesheetPdfService.generatePdf(updatedNote.id, registrarUser, 'REGISTRAR', {
    watermarkText: 'APPROVED & SANCTIONED',
    includeDigitalSignatures: true,
    forceRegenerate: true
  });

  assert(pdfResponse.success, 'PDF generated successfully');
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

  assert(decompressedText.includes('REG-IN-2026-000001') || rawText.includes('REG-IN-2026-000001'), 'PDF stream contains Inward Number REG-IN-2026-000001');
  assert(decompressedText.includes('REG-OUT-2026-000001') || rawText.includes('REG-OUT-2026-000001'), 'PDF stream contains Outward Number REG-OUT-2026-000001');
  assert(decompressedText.includes('REGISTRAR OFFICE') || rawText.includes('REGISTRAR OFFICE'), 'PDF stream contains REGISTRAR OFFICE label');
  assert(decompressedText.includes('ORIGINATING OFFICE DISPATCH') || rawText.includes('ORIGINATING OFFICE DISPATCH'), 'PDF stream contains ORIGINATING OFFICE DISPATCH label');

  console.log('\n--- Step 9: Audit Trail Logging Verification ---');
  const auditLogs = db.getAuditLogs();
  const inwardCreatedLog = auditLogs.find(l => l.action === 'INWARD_CREATED');
  const inwardNoLog = auditLogs.find(l => l.action === 'INWARD_NUMBER_GENERATED');
  const outwardCreatedLog = auditLogs.find(l => l.action === 'OUTWARD_CREATED');
  const outwardNoLog = auditLogs.find(l => l.action === 'OUTWARD_NUMBER_GENERATED');

  assert(!!inwardCreatedLog, 'Audit trail logged INWARD_CREATED');
  assert(!!inwardNoLog, 'Audit trail logged INWARD_NUMBER_GENERATED');
  assert(!!outwardCreatedLog, 'Audit trail logged OUTWARD_CREATED');
  assert(!!outwardNoLog, 'Audit trail logged OUTWARD_NUMBER_GENERATED');

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite();
