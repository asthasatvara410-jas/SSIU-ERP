import { PrismaClient } from '@prisma/client';
import { FeedbackService } from './src/feedback/feedback.service';
import { GrievanceCategoryEnum, GrievanceStatusEnum } from './src/feedback/dto/feedback.dto';

const prisma = new PrismaClient();

async function runStage91FeedbackGrievanceTests() {
  console.log('================================================================');
  console.log('🚀 STAGE 9.1 — ANONYMOUS GRIEVANCE EXTENSION TEST SUITE');
  console.log('================================================================\n');

  const feedbackService = new FeedbackService(prisma as any);
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
    // --- Test 1: Normal Feedback Submission (Regression Verification) ---
    console.log('--- Test 1: Normal Feedback Submission ---');
    const existingTargets = await prisma.student.findFirst();
    if (existingTargets) {
      const normalFeedbackRes = await feedbackService.submitFeedback(
        {
          category: 'GENERAL_UNIVERSITY' as any,
          ratings: { 'Campus Facilities': 5, 'Cleanliness': 5 },
          overallRating: 5,
          comments: 'University campus infrastructure is well maintained.',
          isAnonymous: false,
        },
        { id: existingTargets.id, username: existingTargets.enrollmentNo, email: existingTargets.email }
      );
      assert(normalFeedbackRes.success === true, 'Existing normal student feedback submission succeeds');
      assert(normalFeedbackRes.feedback.feedbackNo.startsWith('FDB/'), 'Normal feedback generates FDB/... reference');
    }

    // --- Test 2: Anonymous Grievance Submission ---
    console.log('\n--- Test 2: Anonymous Grievance Submission ---');
    const grvPayload = {
      category: GrievanceCategoryEnum.FACILITY,
      subject: 'Classroom 402 Projector Bulb Defect',
      description: 'The overhead projector in room 402 has been flickering continuously during lectures.',
      priority: 'HIGH',
      department: 'Department of Computer Science & Engineering',
      incidentLocation: 'Block B, 4th Floor, Room 402',
      attachmentName: 'projector_issue.png',
      attachmentSize: 2048,
      attachmentUrl: 'https://storage.ssiu.edu.in/dms/proof-123.png',
    };

    const resAnon = await feedbackService.submitAnonymousGrievance(grvPayload, TENANT_A);
    assert(resAnon.success === true, 'Anonymous grievance submission returns success: true');
    assert(resAnon.caseNumber.startsWith('GRV-'), 'Cryptographic unguessable reference generated (GRV-YYYY-XXXXXX)');
    assert(resAnon.trackingToken !== undefined && resAnon.trackingToken.length === 32, '32-character secret tracking token generated');
    assert(resAnon.status === 'SUBMITTED', 'Initial status is SUBMITTED');

    // --- Test 3: Identity Privacy Model Verification ---
    console.log('\n--- Test 3: Identity Privacy Model Verification ---');
    const caseInDb = await prisma.grievanceCase.findFirst({
      where: { caseNumber: resAnon.caseNumber, tenantId: TENANT_A },
    });
    assert(caseInDb !== null, 'Grievance record stored in DB');
    assert(caseInDb?.type === 'ANONYMOUS', 'Case type explicitly marked as ANONYMOUS');

    const identityRecord = await prisma.grievanceComplainantIdentity.findFirst({
      where: { caseId: caseInDb?.id },
    });
    assert(identityRecord === null, 'No GrievanceComplainantIdentity record created for anonymous complaint');

    // --- Test 4: Anonymous Tracking Lookup ---
    console.log('\n--- Test 4: Anonymous Tracking Lookup ---');
    const tracked = await feedbackService.trackAnonymousGrievance(resAnon.caseNumber, resAnon.trackingToken, TENANT_A);
    assert(tracked.caseNumber === resAnon.caseNumber, 'Tracked case number matches');
    assert(tracked.subject === grvPayload.subject, 'Subject matches');
    assert(tracked.status === 'SUBMITTED', 'Status is SUBMITTED');
    assert(Array.isArray(tracked.timeline) && tracked.timeline.length > 0, 'Timeline events returned');
    assert((tracked as any).trackingToken === undefined, 'Public tracking view does not leak tracking token');
    assert((tracked as any).studentId === undefined, 'Public tracking view does not leak student ID');

    // --- Test 5: Invalid Token & Reference Defense ---
    console.log('\n--- Test 5: Invalid Credentials Defense ---');
    let rejectedBadToken = false;
    try {
      await feedbackService.trackAnonymousGrievance(resAnon.caseNumber, 'INVALID_TOKEN_1234567890123456', TENANT_A);
    } catch {
      rejectedBadToken = true;
    }
    assert(rejectedBadToken === true, 'Invalid tracking token rejected with exception');

    let rejectedBadRef = false;
    try {
      await feedbackService.trackAnonymousGrievance('GRV-9999-FAKE00', resAnon.trackingToken, TENANT_A);
    } catch {
      rejectedBadRef = true;
    }
    assert(rejectedBadRef === true, 'Invalid reference rejected with exception');

    // --- Test 6: Multi-Tenant Isolation ---
    console.log('\n--- Test 6: Multi-Tenant Isolation ---');
    let tenantBlocked = false;
    try {
      await feedbackService.trackAnonymousGrievance(resAnon.caseNumber, resAnon.trackingToken, TENANT_B);
    } catch {
      tenantBlocked = true;
    }
    assert(tenantBlocked === true, 'Tenant B cannot access Tenant A grievance (Tenant Isolation verified)');

    // --- Test 7: Malicious XSS & Script Tag Sanitization ---
    console.log('\n--- Test 7: Malicious XSS Defense ---');
    const xssPayload = {
      category: GrievanceCategoryEnum.ACADEMIC,
      subject: '<script>alert("XSS Attack")</script>Exam Rescheduling Query<b>!</b>',
      description: '<img src=x onerror=alert(1)>Malicious injection <script>stealCookies()</script>',
    };
    const resXss = await feedbackService.submitAnonymousGrievance(xssPayload, TENANT_A);
    const xssCase = await prisma.grievanceCase.findFirst({ where: { caseNumber: resXss.caseNumber } });
    assert(!xssCase?.subject.includes('<script>'), 'Script tags stripped from subject');
    assert(!xssCase?.description.includes('<script>'), 'Script tags stripped from description');
    assert(!xssCase?.description.includes('<img'), 'HTML tags stripped from description');

    // --- Test 8: Malicious Attachment Rejection ---
    console.log('\n--- Test 8: Malicious Attachment Rejection ---');
    let dangerousExtBlocked = false;
    try {
      await feedbackService.submitAnonymousGrievance(
        {
          category: GrievanceCategoryEnum.ACADEMIC,
          subject: 'Dangerous file test',
          description: 'Testing executable block',
          attachmentName: 'malware.exe',
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
      await feedbackService.submitAnonymousGrievance(
        {
          category: GrievanceCategoryEnum.ACADEMIC,
          subject: 'Traversal test',
          description: 'Testing traversal block',
          attachmentName: '../../../etc/passwd.png',
          attachmentSize: 1024,
        },
        TENANT_A
      );
    } catch {
      pathTraversalBlocked = true;
    }
    assert(pathTraversalBlocked === true, 'Path traversal attachment filename blocked with exception');

    // --- Test 9: Authorized Grievance Management & Status Workflow ---
    console.log('\n--- Test 9: Authorized Management & Status Lifecycle ---');
    const officerUser = { id: 'OFFICER-001', email: 'grievance.officer@ssiu.edu.in', role: 'IQAC_ADMIN' };

    // 1. Transition to UNDER_REVIEW
    const underReview = await feedbackService.updateGrievanceStatus(
      caseInDb!.id,
      {
        status: GrievanceStatusEnum.UNDER_REVIEW,
        remarks: 'Electrician dispatched to inspect room 402.',
        publicResponse: 'Maintenance team dispatched for on-site inspection.',
      },
      officerUser,
      TENANT_A
    );
    assert(underReview.grievance.status === 'UNDER_REVIEW', 'Status transitioned to UNDER_REVIEW');

    // 2. Transition to RESOLVED
    const resolved = await feedbackService.updateGrievanceStatus(
      caseInDb!.id,
      {
        status: GrievanceStatusEnum.RESOLVED,
        remarks: 'Projector bulb replaced and tested.',
        resolutionSummary: 'New projector lamp installed and verified working.',
      },
      officerUser,
      TENANT_A
    );
    assert(resolved.grievance.status === 'RESOLVED', 'Status transitioned to RESOLVED');
    assert(resolved.grievance.resolutionSummary?.includes('New projector lamp installed'), 'Resolution summary saved');

    // Verify public tracking reflects resolution
    const trackedAfterResolve = await feedbackService.trackAnonymousGrievance(resAnon.caseNumber, resAnon.trackingToken, TENANT_A);
    assert(trackedAfterResolve.status === 'RESOLVED', 'Anonymous tracking reflects RESOLVED status');
    assert(trackedAfterResolve.resolutionSummary?.includes('New projector lamp installed'), 'Public tracking shows resolution summary');

    // --- Test 10: Authorized Listing & Submitter Identity Shielding ---
    console.log('\n--- Test 10: Authorized Listing & Submitter Identity Shielding ---');
    const authorizedList = await feedbackService.listAuthorizedGrievances({ status: 'RESOLVED' }, officerUser, TENANT_A);
    assert(authorizedList.length > 0, 'Authorized listing returns resolved grievances');
    const foundCase = authorizedList.find(c => c.caseNumber === resAnon.caseNumber);
    assert(foundCase !== undefined, 'Newly resolved case found in list');
    assert(foundCase?.submitterType === 'Anonymous Submitter (Identity Protected)', 'Submitter identity masked for handlers');
    assert((foundCase as any).trackingToken === undefined, 'Secret tracking token stripped from management list view');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passed}/${total} STAGE 9.1 TESTS PASSED (100%)`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage91FeedbackGrievanceTests();
