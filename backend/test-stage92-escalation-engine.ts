import { PrismaClient } from '@prisma/client';
import { FeedbackService } from './src/feedback/feedback.service';
import { GrievanceCategoryEnum } from './src/feedback/dto/feedback.dto';

const prisma = new PrismaClient();
const feedbackService = new FeedbackService(prisma as any);

async function runStage92EscalationTests() {
  console.log('================================================================');
  console.log('🚀 STAGE 9.2 — FEEDBACK & GRIEVANCE ESCALATION ENGINE TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const TENANT_A = 'TENANT-ESCALATION-A';
  const TENANT_B = 'TENANT-ESCALATION-B';

  try {
    // Clean up any previous test cases
    await prisma.grievanceCaseEvent.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceInternalNote.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceEvidence.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceComplainantIdentity.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceCase.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });

    // --- TEST 1: PRIORITY-BASED SLA CALCULATION ---
    console.log('--- Test 1: SLA Deadline Calculation by Priority ---');
    const baseDate = new Date('2026-09-01T10:00:00Z');

    const criticalDeadline = feedbackService.calculateSlaDeadline('CRITICAL', baseDate);
    const highDeadline = feedbackService.calculateSlaDeadline('HIGH', baseDate);
    const mediumDeadline = feedbackService.calculateSlaDeadline('MEDIUM', baseDate);
    const lowDeadline = feedbackService.calculateSlaDeadline('LOW', baseDate);

    assert(
      (criticalDeadline.getTime() - baseDate.getTime()) === (24 * 60 * 60 * 1000),
      'CRITICAL priority SLA deadline is 24 hours (1 day)'
    );
    assert(
      (highDeadline.getTime() - baseDate.getTime()) === (48 * 60 * 60 * 1000),
      'HIGH priority SLA deadline is 48 hours (2 days)'
    );
    assert(
      (mediumDeadline.getTime() - baseDate.getTime()) === (72 * 60 * 60 * 1000),
      'MEDIUM priority SLA deadline is 72 hours (3 days)'
    );
    assert(
      (lowDeadline.getTime() - baseDate.getTime()) === (120 * 60 * 60 * 1000),
      'LOW priority SLA deadline is 120 hours (5 days)'
    );

    // --- TEST 2: SLA LIVE STATUS COMPUTATION ---
    console.log('\n--- Test 2: Live SLA Status Computation (ON_TRACK, DUE_SOON, SLA_BREACHED, RESOLVED) ---');
    const futureCase = { createdAt: new Date(), escalationDeadline: new Date(Date.now() + 40 * 3600 * 1000), status: 'SUBMITTED', priority: 'HIGH' };
    const dueSoonCase = { createdAt: new Date(), escalationDeadline: new Date(Date.now() + 4 * 3600 * 1000), status: 'SUBMITTED', priority: 'HIGH' };
    const breachedCase = { createdAt: new Date(Date.now() - 100 * 3600 * 1000), escalationDeadline: new Date(Date.now() - 5 * 3600 * 1000), status: 'SUBMITTED', priority: 'HIGH' };
    const resolvedCase = { createdAt: new Date(Date.now() - 100 * 3600 * 1000), escalationDeadline: new Date(Date.now() - 5 * 3600 * 1000), status: 'RESOLVED', priority: 'HIGH' };

    assert(feedbackService.computeSlaInfo(futureCase).slaStatus === 'ON_TRACK', 'Future deadline yields ON_TRACK status');
    assert(feedbackService.computeSlaInfo(dueSoonCase).slaStatus === 'DUE_SOON', 'Deadline within 8h yields DUE_SOON status');
    assert(feedbackService.computeSlaInfo(breachedCase).slaStatus === 'SLA_BREACHED', 'Expired deadline yields SLA_BREACHED status');
    assert(feedbackService.computeSlaInfo(resolvedCase).slaStatus === 'RESOLVED', 'Resolved case yields RESOLVED SLA status');

    // --- TEST 3: INSTITUTIONAL HIERARCHY ROUTING ---
    console.log('\n--- Test 3: Institutional Hierarchy & Authority Routing ---');
    const lvl0 = feedbackService.getHierarchyAuthority(0, 'Computer Science');
    const lvl1 = feedbackService.getHierarchyAuthority(1, 'Computer Science');
    const lvl2 = feedbackService.getHierarchyAuthority(2, 'Computer Science');
    const lvl3 = feedbackService.getHierarchyAuthority(3, 'Computer Science');
    const lvl4 = feedbackService.getHierarchyAuthority(4, 'Computer Science');

    assert(lvl0.role === 'FACULTY_OFFICER', 'Level 0 routes to Department Grievance Officer');
    assert(lvl1.role === 'HOD', 'Level 1 routes to Head of Department (HOD)');
    assert(lvl2.role === 'PRINCIPAL', 'Level 2 routes to Dean / Institute Principal');
    assert(lvl3.role === 'REGISTRAR', 'Level 3 routes to University Grievance Cell / Registrar');
    assert(lvl4.role === 'VICE_CHANCELLOR', 'Level 4 routes to Vice Chancellor (Final Institutional Tier)');

    // --- TEST 4: GRIEVANCE CREATION WITH SLA DEADLINE ---
    console.log('\n--- Test 4: Grievance Creation & Initial SLA Assignment ---');
    const createdGrievance = await feedbackService.submitAnonymousGrievance({
      category: GrievanceCategoryEnum.ACADEMIC,
      subject: 'Delay in Laboratory Equipment Repairs',
      description: 'The networking lab computers have faulty Ethernet switches.',
      priority: 'HIGH',
      department: 'Computer Engineering',
      incidentLocation: 'Lab 402, Block B',
    }, TENANT_A);

    assert(createdGrievance.success === true, 'Grievance submitted successfully');
    assert(createdGrievance.caseNumber.startsWith('GRV-2026-'), 'Unguessable case reference generated');

    const dbCase = await prisma.grievanceCase.findFirst({
      where: { caseNumber: createdGrievance.caseNumber, tenantId: TENANT_A },
    });
    assert(dbCase !== null, 'Case record persisted in DB');
    assert(dbCase!.escalationLevel === 0, 'Initial escalation level is Level 0');

    // --- TEST 5: AUTOMATIC SLA BREACH ESCALATION ---
    console.log('\n--- Test 5: Automatic SLA Breach Escalation Background Processor ---');
    // Artificially backdate the deadline to simulate an SLA breach
    const pastDeadline = new Date(Date.now() - 2 * 3600 * 1000);
    await prisma.grievanceCase.update({
      where: { id: dbCase!.id },
      data: { escalationDeadline: pastDeadline },
    });

    const processResult1 = await feedbackService.processSlaEscalations(TENANT_A, { id: 'SYSTEM_SLA_ENGINE' });
    assert(processResult1.escalatedCount === 1, 'Automatic escalation engine detected breached case and escalated');

    const escalatedCaseDb = await prisma.grievanceCase.findFirst({
      where: { id: dbCase!.id },
      include: { timelineEvents: true },
    });
    assert(escalatedCaseDb!.escalationLevel === 1, 'Case escalation level promoted to Level 1 (HOD)');
    assert(escalatedCaseDb!.status === 'ESCALATED', 'Case workflow status updated to ESCALATED');
    assert(
      escalatedCaseDb!.timelineEvents.some(e => e.eventType === 'ESCALATED' && e.title.includes('Level 1')),
      'Immutable timeline event recorded for Level 1 auto-escalation'
    );

    // --- TEST 6: DUPLICATE ESCALATION PREVENTION (IDEMPOTENCY) ---
    console.log('\n--- Test 6: Duplicate Escalation Prevention (Idempotency Check) ---');
    const processResult2 = await feedbackService.processSlaEscalations(TENANT_A, { id: 'SYSTEM_SLA_ENGINE' });
    assert(processResult2.escalatedCount === 0, 'Re-running processor does NOT create duplicate escalation event');

    const caseAfterRerun = await prisma.grievanceCase.findFirst({
      where: { id: dbCase!.id },
      include: { timelineEvents: true },
    });
    const escalationEvents = caseAfterRerun!.timelineEvents.filter(e => e.eventType === 'ESCALATED');
    assert(escalationEvents.length === 1, 'Exactly one escalation event exists for Level 1');

    // --- TEST 7: MANUAL ESCALATION BY AUTHORIZED OFFICER ---
    console.log('\n--- Test 7: Manual Escalation by Authorized Officer ---');
    const manualEscResult = await feedbackService.escalateGrievance(
      dbCase!.id,
      {
        toLevel: 2,
        reason: 'CRITICAL_PRIORITY',
        note: 'Department HOD requested Institute Dean intervention due to budget requirements.',
      },
      { id: 'HOD-USER-01', role: 'HOD' },
      TENANT_A
    );

    assert(manualEscResult.success === true, 'Manual escalation succeeded');
    assert(manualEscResult.escalationLevel === 2, 'Case promoted to Level 2 (Dean / Principal)');

    const caseAfterManual = await prisma.grievanceCase.findFirst({
      where: { id: dbCase!.id },
      include: { timelineEvents: true, internalNotes: true },
    });
    assert(caseAfterManual!.escalationLevel === 2, 'DB reflects Level 2 escalation');
    assert(
      caseAfterManual!.internalNotes.some(n => n.note.includes('MANUAL_ESCALATION')),
      'Internal note recorded with manual escalation justification'
    );

    // --- TEST 8: CASE ASSIGNMENT ---
    console.log('\n--- Test 8: Case Assignment to Designated Officer ---');
    const assignResult = await feedbackService.assignGrievance(
      dbCase!.id,
      {
        assignedRole: 'Infrastructure Maintenance Committee',
        assignedToUserId: 'OFFICER-MAINT-99',
        note: 'Instructed to inspect lab Ethernet switchboard.',
      },
      { id: 'DEAN-01', role: 'PRINCIPAL' },
      TENANT_A
    );

    assert(assignResult.success === true, 'Case assignment succeeded');
    assert(assignResult.grievance.status === 'ASSIGNED', 'Status updated to ASSIGNED');

    // --- TEST 9: FORMAL RESOLUTION & CORRECTIVE ACTIONS ---
    console.log('\n--- Test 9: Formal Resolution & Corrective Action Tracking ---');
    const resolveResult = await feedbackService.resolveGrievance(
      dbCase!.id,
      {
        resolutionSummary: 'Brand new 48-port Gigabit Cisco switches installed in Lab 402.',
        correctiveAction: 'Monthly lab networking infrastructure maintenance audit schedule initiated.',
        internalRemarks: 'Procured under central IT budget code IT-2026-B.',
      },
      { id: 'OFFICER-MAINT-99', role: 'AUTHORIZED_OFFICER' },
      TENANT_A
    );

    assert(resolveResult.success === true, 'Case resolved successfully');
    assert(resolveResult.grievance.status === 'RESOLVED', 'DB status updated to RESOLVED');
    assert(resolveResult.grievance.closedAt !== null, 'Closed timestamp recorded');

    // --- TEST 10: CASE REOPEN & SLA RECALCULATION ---
    console.log('\n--- Test 10: Reopen Case with New SLA Deadline (Historical Timeline Preserved) ---');
    const reopenResult = await feedbackService.reopenGrievance(
      dbCase!.id,
      {
        reason: 'Port 12 and 14 in Row 3 are still reporting packet drops.',
        additionalDetails: 'Submitter verified partial network failure still persisting.',
      },
      { id: 'IQAC-OFFICER-01', role: 'IQAC' },
      TENANT_A
    );

    assert(reopenResult.success === true, 'Case successfully reopened');
    assert(reopenResult.grievance.status === 'REOPENED', 'Status changed to REOPENED');
    assert(reopenResult.newDeadline !== null, 'New SLA deadline initiated for reopened cycle');

    const reopenedCaseDb = await prisma.grievanceCase.findFirst({
      where: { id: dbCase!.id },
      include: { timelineEvents: true },
    });
    assert(
      reopenedCaseDb!.timelineEvents.some(e => e.eventType === 'REOPENED'),
      'Timeline includes REOPENED event'
    );
    assert(
      reopenedCaseDb!.timelineEvents.some(e => e.eventType === 'RESOLVED'),
      'Historical RESOLVED timeline event preserved without truncation'
    );

    // --- TEST 11: ESCALATION QUEUE & ANONYMOUS PRIVACY SHIELDING ---
    console.log('\n--- Test 11: Escalation Queue & Anonymous Complainant Identity Shielding ---');
    const queue = await feedbackService.getEscalationQueue({}, { role: 'IQAC' }, TENANT_A);
    assert(queue.length >= 1, 'Escalation queue returned active cases');

    const queueItem = queue.find(q => q.id === dbCase!.id);
    assert(queueItem !== undefined, 'Target case found in queue');
    assert(queueItem!.submitterType.includes('Anonymous Submitter'), 'Submitter type is strictly masked as Anonymous');
    assert((queueItem as any).studentId === undefined, 'No student ID exposed in queue item');
    assert((queueItem as any).trackingToken === undefined, 'Secret tracking token stripped from queue item');

    // --- TEST 12: ESCALATION ANALYTICS & NAAC / IQAC EVIDENCE METRICS ---
    console.log('\n--- Test 12: Escalation Analytics & NAAC / IQAC Quality Metrics ---');
    const analytics = await feedbackService.getEscalationAnalytics(TENANT_A, { role: 'IQAC' });

    assert(analytics.totalCases >= 1, 'Total cases counted');
    assert(analytics.slaComplianceRate >= 0 && analytics.slaComplianceRate <= 100, 'SLA compliance rate is a valid percentage');
    assert(analytics.institutionalQualitySummary.title.includes('NAAC Metric 5.1.5'), 'Institutional summary references NAAC Metric 5.1.5');
    assert(analytics.priorityCounts.HIGH >= 1, 'Priority breakdown counts high priority case');

    // --- TEST 13: MULTI-TENANT ISOLATION ---
    console.log('\n--- Test 13: Multi-Tenant Isolation ---');
    const tenantBQueue = await feedbackService.getEscalationQueue({}, { role: 'IQAC' }, TENANT_B);
    assert(
      !tenantBQueue.some(q => q.id === dbCase!.id),
      'Tenant B cannot access Tenant A grievance cases (Strict multi-tenant boundary verified)'
    );

    // Clean up test records
    await prisma.grievanceCaseEvent.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceInternalNote.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceEvidence.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceComplainantIdentity.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
    await prisma.grievanceCase.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} STAGE 9.2 ESCALATION TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage92EscalationTests();
