import { PrismaClient } from '@prisma/client';
import { GrievanceService } from './src/grievance/grievance.service';
import { AnonymousComplaintService } from './src/grievance/anonymous-complaint.service';
import { ComplaintWorkflowService } from './src/grievance/complaint-workflow.service';
import { ComplaintEscalationService } from './src/grievance/complaint-escalation.service';
import { AntiRaggingService } from './src/grievance/anti-ragging.service';
import { ICCService } from './src/grievance/icc.service';
import { CommitteeService } from './src/grievance/committee.service';
import { CaseAssignmentService } from './src/grievance/case-assignment.service';
import { InvestigationService } from './src/grievance/investigation.service';
import { CaseEvidenceService } from './src/grievance/case-evidence.service';
import { GrievanceSLAService } from './src/grievance/grievance-sla.service';
import { GrievanceReportService } from './src/grievance/grievance-report.service';
import { GrievanceAuditService } from './src/grievance/grievance-audit.service';

const prisma = new PrismaClient();

async function runStage91Tests() {
  console.log('===========================================================');
  console.log('🚀 STAGE 9.1 — ANONYMOUS GRIEVANCE ENGINE TEST SUITE');
  console.log('===========================================================\n');

  const auditService = new GrievanceAuditService();
  const anonService = new AnonymousComplaintService(prisma as any);
  const workflowService = new ComplaintWorkflowService(prisma as any);
  const escalationService = new ComplaintEscalationService(prisma as any);
  const antiRaggingService = new AntiRaggingService(prisma as any, anonService);
  const iccService = new ICCService(prisma as any, anonService);
  const committeeService = new CommitteeService(prisma as any);
  const assignmentService = new CaseAssignmentService(prisma as any);
  const investigationService = new InvestigationService(prisma as any);
  const evidenceService = new CaseEvidenceService(prisma as any);
  const slaService = new GrievanceSLAService(prisma as any);
  const reportService = new GrievanceReportService(prisma as any);

  const grievanceService = new GrievanceService(
    prisma as any,
    anonService,
    workflowService,
    escalationService,
    antiRaggingService,
    iccService,
    committeeService,
    assignmentService,
    investigationService,
    evidenceService,
    slaService,
    reportService,
    auditService,
  );

  const TENANT_A = 'TENANT-SSIU-A';
  const TENANT_B = 'TENANT-SSIU-B';

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  try {
    // --- Test 1: Anonymous Grievance Submission ---
    console.log('--- Test 1: Anonymous Grievance Submission ---');
    const submissionPayload = {
      category: 'FACILITY',
      type: 'ANONYMOUS',
      subject: 'Hostel Block 3 Hot Water Supply',
      description: 'The geysers on the 2nd floor have not been operational for 3 days.',
      priority: 'HIGH',
      department: 'Hostel Administration Cell',
      incidentLocation: 'Boys Hostel 3, 2nd Floor',
      attachmentName: 'geyser_issue.png',
      attachmentType: 'IMAGE',
    };

    const resAnon = await grievanceService.fileComplaint(submissionPayload, TENANT_A);
    assert(resAnon.id !== undefined, 'Grievance record created with database ID');
    assert(resAnon.caseNumber.startsWith('GRV-'), 'Cryptographically strong Case Number generated (GRV-...)');
    assert(resAnon.trackingToken !== undefined && resAnon.trackingToken.length >= 16, 'Secret tracking token generated for submitter');
    assert(resAnon.status === 'SUBMITTED', 'Initial grievance status is SUBMITTED');

    // --- Test 2: Identity Privacy Model Verification ---
    console.log('\n--- Test 2: Privacy Model Verification ---');
    const identityRecord = await prisma.grievanceComplainantIdentity.findFirst({
      where: { caseId: resAnon.id },
    });
    assert(identityRecord === null, 'No GrievanceComplainantIdentity record created for anonymous complaint');

    const rawCaseInDb = await prisma.grievanceCase.findUnique({
      where: { id: resAnon.id },
    });
    assert(rawCaseInDb?.type === 'ANONYMOUS', 'Case type explicitly marked as ANONYMOUS in DB');

    // --- Test 3: Public Anonymous Status Tracking ---
    console.log('\n--- Test 3: Anonymous Status Tracking ---');
    const tracked = await anonService.trackAnonymous(resAnon.caseNumber, resAnon.trackingToken!, TENANT_A);
    assert(tracked.caseNumber === resAnon.caseNumber, 'Tracked case number matches');
    assert(tracked.status === 'SUBMITTED', 'Tracked status is SUBMITTED');
    assert(tracked.subject === submissionPayload.subject, 'Subject returned in public status');
    assert(Array.isArray(tracked.timeline) && tracked.timeline.length > 0, 'Public timeline events list returned');
    assert((tracked as any).trackingToken === undefined, 'Public tracking view does not expose internal tracking token');
    assert((tracked as any).studentId === undefined, 'Public tracking view does not expose student ID');

    // --- Test 4: Invalid Tracking Token Rejection ---
    console.log('\n--- Test 4: Invalid Tracking Credentials Defense ---');
    let rejectedBadToken = false;
    try {
      await anonService.trackAnonymous(resAnon.caseNumber, 'INVALID-TOKEN-12345', TENANT_A);
    } catch {
      rejectedBadToken = true;
    }
    assert(rejectedBadToken === true, 'Invalid tracking token rejected with exception');

    let rejectedBadCase = false;
    try {
      await anonService.trackAnonymous('GRV-9999-NONEXIST', resAnon.trackingToken!, TENANT_A);
    } catch {
      rejectedBadCase = true;
    }
    assert(rejectedBadCase === true, 'Non-existent case number rejected with exception');

    // --- Test 5: Tenant Isolation ---
    console.log('\n--- Test 5: Tenant Isolation ---');
    let tenantBlocked = false;
    try {
      await anonService.trackAnonymous(resAnon.caseNumber, resAnon.trackingToken!, TENANT_B);
    } catch {
      tenantBlocked = true;
    }
    assert(tenantBlocked === true, 'Tenant B cannot access Tenant A grievance (Tenant Isolation verified)');

    // --- Test 6: Malicious Payload & XSS Sanitization ---
    console.log('\n--- Test 6: Malicious Payload & XSS Defense ---');
    const maliciousPayload = {
      category: 'ACADEMIC',
      type: 'ANONYMOUS',
      subject: '<script>alert("XSS")</script>Urgent Exam Issue<b>!!!</b>',
      description: '<img src=x onerror=alert(1)>Lab computers malfunctioning with <script>console.log("hack")</script>',
    };

    const resMalicious = await grievanceService.fileComplaint(maliciousPayload, TENANT_A);
    const caseInDb = await prisma.grievanceCase.findUnique({ where: { id: resMalicious.id } });
    assert(!caseInDb?.subject.includes('<script>'), 'Script tags stripped from subject');
    assert(!caseInDb?.description.includes('<script>'), 'Script tags stripped from description');
    assert(!caseInDb?.description.includes('<img'), 'Unsafe HTML stripped from description');

    // --- Test 7: Malicious Attachment Rejection ---
    console.log('\n--- Test 7: Malicious Attachment Defense ---');
    let dangerousExtBlocked = false;
    try {
      await grievanceService.fileComplaint(
        {
          category: 'ACADEMIC',
          type: 'ANONYMOUS',
          subject: 'Exploit test',
          description: 'Testing malicious attachment',
          attachmentName: 'exploit_script.exe',
          attachmentSize: 1024,
        },
        TENANT_A
      );
    } catch {
      dangerousExtBlocked = true;
    }
    assert(dangerousExtBlocked === true, 'Executable attachment (.exe) blocked with exception');

    let pathTraversalBlocked = false;
    try {
      await grievanceService.fileComplaint(
        {
          category: 'ACADEMIC',
          type: 'ANONYMOUS',
          subject: 'Traversal test',
          description: 'Testing path traversal',
          attachmentName: '../../etc/passwd.pdf',
          attachmentSize: 1024,
        },
        TENANT_A
      );
    } catch {
      pathTraversalBlocked = true;
    }
    assert(pathTraversalBlocked === true, 'Path traversal attachment filename blocked with exception');

    // --- Test 8: Status Lifecycle & Administrative Actions ---
    console.log('\n--- Test 8: Status Lifecycle & Admin Actions ---');
    const officerUser = { id: 'OFFICER-001', email: 'grievance.officer@ssiu.edu.in', role: 'GRIEVANCE_OFFICER' };

    // Transition to ACKNOWLEDGED
    const ackCase = await grievanceService.updateCaseStatus(resAnon.id, 'ACKNOWLEDGED', 'Complaint received and verified by SGRC.', officerUser, TENANT_A);
    assert(ackCase.status === 'ACKNOWLEDGED', 'Status transitioned to ACKNOWLEDGED');

    // Transition to UNDER_REVIEW
    const revCase = await grievanceService.updateCaseStatus(resAnon.id, 'UNDER_REVIEW', 'Inquiry commenced with Hostel Warden.', officerUser, TENANT_A);
    assert(revCase.status === 'UNDER_REVIEW', 'Status transitioned to UNDER_REVIEW');

    // Add Internal Officer Note (Confidential)
    const note = await grievanceService.addInternalNote(resAnon.id, { note: 'Warden confirmed contractor has been summoned.' }, officerUser, TENANT_A);
    assert(note.note.includes('contractor has been summoned'), 'Officer internal note recorded');

    // Verify internal note is NOT in public tracking
    const trackedAfterNote = await anonService.trackAnonymous(resAnon.caseNumber, resAnon.trackingToken!, TENANT_A);
    assert((trackedAfterNote as any).internalNotes === undefined, 'Internal confidential note not leaked to anonymous tracking');

    // Resolve Case
    const resCase = await grievanceService.resolveCase(
      resAnon.id,
      {
        resolutionType: 'REDRESSED',
        summary: 'Geyser heating element replaced and hot water restored.',
        studentVisibleSummary: 'Geyser heating element replaced and hot water restored.',
      },
      officerUser,
      TENANT_A
    );
    assert(resCase.status === 'RESOLVED', 'Status transitioned to RESOLVED');
    assert(resCase.resolutionSummary?.includes('hot water restored'), 'Resolution summary persisted');

    // Check tracked status after resolution
    const trackedResolved = await anonService.trackAnonymous(resAnon.caseNumber, resAnon.trackingToken!, TENANT_A);
    assert(trackedResolved.status === 'RESOLVED', 'Anonymous tracking reflects RESOLVED status');
    assert(trackedResolved.resolutionSummary?.includes('hot water restored'), 'Public tracking shows resolution summary');

    // --- Test 9: Authorized Grievance Desk Queries ---
    console.log('\n--- Test 9: Authorized Desk Queries & Filtering ---');
    const allAdminCases = await grievanceService.listAdminComplaints(TENANT_A, { status: 'RESOLVED' });
    assert(allAdminCases.length > 0, 'listAdminComplaints returns filtered resolved cases');
    const resolvedFound = allAdminCases.find(c => c.caseNumber === resAnon.caseNumber);
    assert(resolvedFound !== undefined, 'Newly resolved anonymous case appears in admin desk');
    assert((resolvedFound as any).trackingToken === undefined, 'Admin desk view strips internal secret tracking token');

    console.log('\n===========================================================');
    console.log(`🎉 ALL ${passed}/${total} STAGE 9.1 TESTS PASSED (100%)`);
    console.log('===========================================================\n');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage91Tests();
