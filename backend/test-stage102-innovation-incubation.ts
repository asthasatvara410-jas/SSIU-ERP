import { PrismaClient } from '@prisma/client';
import { StartupGrantService } from './src/startup-grant/startup-grant.service';
import { StartupService } from './src/startup-grant/startup.service';
import { SSIPService } from './src/startup-grant/ssip.service';
import { HackathonService } from './src/startup-grant/hackathon.service';
import { GrantService } from './src/startup-grant/grant.service';
import { GrantBudgetService } from './src/startup-grant/grant-budget.service';
import { GrantUtilizationService } from './src/startup-grant/grant-utilization.service';
import { StartupAuditService } from './src/startup-grant/startup-audit.service';

const prisma = new PrismaClient();
const startupService = new StartupService(prisma as any);
const ssipService = new SSIPService(prisma as any);
const hackathonService = new HackathonService(prisma as any);
const grantService = new GrantService(prisma as any);
const budgetService = new GrantBudgetService(prisma as any);
const utilService = new GrantUtilizationService(prisma as any);
const auditService = new StartupAuditService();

const sgService = new StartupGrantService(
  prisma as any,
  startupService,
  ssipService,
  hackathonService,
  grantService,
  budgetService,
  utilService,
  auditService,
);

async function runStage102InnovationTests() {
  console.log('================================================================');
  console.log('🚀 STAGE 10.2 — INNOVATION, INCUBATION & STARTUP TEST SUITE');
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

  const TENANT_A = 'TENANT-INNOVATION-A';
  const TENANT_B = 'TENANT-INNOVATION-B';

  try {
    // Ensure IncubationCenter exists for foreign key
    const incCenter = await prisma.incubationCenter.findUnique({ where: { id: 'INC-MAIN' } });
    if (!incCenter) {
      await prisma.incubationCenter.create({
        data: {
          id: 'INC-MAIN',
          code: 'SINC-MAIN',
          name: 'Swarrnim Incubation Centre',
        } as any,
      });
    }

    // --- TEST 1: INNOVATION PROJECT CREATION & LIFECYCLE ---
    console.log('--- Test 1: Innovation Project Creation & Stages ---');
    const innoProject = await sgService.createInnovationProject(
      {
        title: 'Smart Agro-IoT Soil Nutrient & Moisture Sensing Drone System',
        category: 'Agriculture',
        description: 'Autonomous low-cost drone equipped with multispectral camera.',
        problemStatement: 'Excessive fertilizer usage in semi-arid farmland.',
        proposedSolution: 'Real-time NPK & soil pH alerts transmitted to farmers.',
        leadName: 'Darshan Varma',
        leadType: 'STUDENT',
        facultyMentorName: 'Dr. Rajesh Sharma',
        stage: 'PROTOTYPE',
        status: 'ACTIVE',
        technologyArea: 'IoT & Edge Computing',
        sdgAlignment: 'SDG 2: Zero Hunger',
        linkedPatentId: 'PAT-2026-101',
      },
      TENANT_A,
      'USER-STU-01'
    );

    assert(innoProject.id !== '', 'Innovation project created with valid ID');
    assert(innoProject.innovationCode.startsWith('INN-'), 'Innovation code generated');
    assert(innoProject.stage === 'PROTOTYPE', 'Innovation stage recorded as PROTOTYPE');
    assert(innoProject.linkedPatentId === 'PAT-2026-101', 'Stage 10.1 Patent linked without record duplication');

    // --- TEST 2: INCUBATION APPLICATION WORKFLOW ---
    console.log('\n--- Test 2: Incubation Centre Application & Pipeline ---');
    const application = await sgService.createIncubationApplication(
      {
        startupOrIdeaName: 'KisanDrone AeroTech',
        category: 'Agriculture',
        applicantName: 'Darshan Varma',
        problemStatement: 'Crop pests and uneven fertilizer spraying.',
        solution: 'Autonomous scouting drones with multispectral imaging.',
        fundingRequirement: 750000,
      },
      TENANT_A,
      'USER-STU-01'
    );

    assert(application.id !== '', 'Incubation application submitted');
    assert(application.applicationNumber.startsWith('SINC/APP/'), 'Application reference generated');
    assert(application.reviewStatus === 'SUBMITTED', 'Initial review status is SUBMITTED');

    const appList = await sgService.listIncubationApplications(TENANT_A);
    assert(appList.length >= 1, 'Application retrieved in incubation pipeline');

    // --- TEST 3: STARTUP VENTURE & FOUNDER MANAGEMENT ---
    console.log('\n--- Test 3: Startup Management & DPIIT Recognition ---');
    const startup = await sgService.createStartup(
      {
        name: 'KisanDrone AeroTech Pvt. Ltd.',
        category: 'Agriculture',
        sector: 'AgriTech & Robotics',
        stage: 'EARLY_TRACTION',
        contactEmail: 'contact@kisandrone.in',
        founders: [
          {
            name: 'Darshan Varma',
            role: 'Founder & CEO',
            ownershipPercentage: 70,
            isPrimaryFounder: true,
          },
          {
            name: 'Dr. Rajesh Sharma',
            role: 'Faculty Co-Founder & Technical Advisor',
            ownershipPercentage: 15,
            isPrimaryFounder: false,
          },
        ],
      },
      TENANT_A,
      'USER-STU-01'
    );

    assert(startup.id !== '', 'Startup venture registered successfully');
    assert(startup.name === 'KisanDrone AeroTech Pvt. Ltd.', 'Startup name preserved');

    // --- TEST 4: MENTOR POOL & MENTORING SESSIONS ---
    console.log('\n--- Test 4: Mentor Repository & Session Logging ---');
    const mentor = await sgService.createInnovationMentor(
      {
        mentorName: 'Vikramaditya Solanki',
        mentorType: 'Entrepreneur',
        organization: 'Solanki Ventures & Tech Fund',
        expertise: 'Early Stage GTM & B2B SaaS',
        email: 'vikram@solankiventures.in',
        contactNumber: '+91 98250 11920',
      },
      TENANT_A
    );

    assert(mentor.id !== '', 'Mentor enrolled successfully');
    assert(mentor.mentorType === 'Entrepreneur', 'Mentor type recorded');

    const session = await sgService.createMentoringSession(
      {
        mentorId: mentor.id,
        targetName: 'KisanDrone AeroTech Pvt. Ltd.',
        objectives: 'FPO pricing review and unit economics optimization',
        mentoringNotes: 'Advised shifting from per-acre billing to annual subscription bundles.',
      },
      TENANT_A
    );

    assert(session.id !== '', 'Mentoring session logged');
    assert(session.completed === true, 'Session marked completed');

    // --- TEST 5: INNOVATION FUNDING & SSIP GRANTS ---
    console.log('\n--- Test 5: Innovation Grants & SSIP Mobilization ---');
    const funding = await sgService.createInnovationFunding(
      {
        recipientName: 'Smart Agro-IoT Soil Nutrient Sensing Drone',
        fundingSource: 'Gujarat Student Startup and Innovation Policy (SSIP 2.0)',
        fundingType: 'Government',
        sanctionedAmount: 250000,
        releasedAmount: 200000,
      },
      TENANT_A
    );

    assert(funding.id !== '', 'Innovation funding registered');
    assert(funding.sanctionedAmount === 250000, 'Sanctioned amount recorded');
    assert(funding.balanceAmount === 250000, 'Balance amount initialized');

    // --- TEST 6: INDUSTRY COLLABORATION & MOUS ---
    console.log('\n--- Test 6: Industry Collaboration & MoUs ---');
    const collab = await sgService.createIndustryCollaboration(
      {
        industryName: 'Adani Green Energy Labs, Ahmedabad',
        collaborationType: 'MoU',
        scope: 'Joint development of smart charging protocols and solar telemetry.',
        facultyCoordinatorName: 'Dr. Amit Trivedi',
      },
      TENANT_A
    );

    assert(collab.id !== '', 'Industry collaboration registered');
    assert(collab.industryName.includes('Adani Green Energy'), 'Industry partner recorded');
    assert(collab.status === 'ACTIVE', 'MoU status is ACTIVE');

    // --- TEST 7: INNOVATION EVENTS & HACKATHONS ---
    console.log('\n--- Test 7: Innovation Events & Hackathons ---');
    const event = await sgService.createInnovationEvent(
      {
        eventName: 'Swarrnim National Innovation Day & Expo 2026',
        eventType: 'Innovation Day',
        participantCount: 450,
        outcomes: '72 student prototype exhibits displayed; 6 startups received angel commitments.',
      },
      TENANT_A
    );

    assert(event.id !== '', 'Innovation event registered');
    assert(event.participantCount === 450, 'Participant count recorded');

    // --- TEST 8: INNOVATION AWARDS ---
    console.log('\n--- Test 8: Innovation & Startup Awards ---');
    const award = await sgService.createInnovationAward(
      {
        awardTitle: 'Best Student Innovator of Gujarat (AgriTech)',
        recipientName: 'Darshan Varma',
        awardingOrganization: 'Gujarat Knowledge Society (GKS) & Education Department',
        level: 'State',
      },
      TENANT_A
    );

    assert(award.id !== '', 'Innovation award registered');
    assert(award.level === 'State', 'Award level recorded');

    // --- TEST 9: COMPREHENSIVE INNOVATION METRICS ---
    console.log('\n--- Test 9: Comprehensive Innovation Metrics & 3-Year Trajectory ---');
    const metrics = await sgService.getComprehensiveInnovationMetrics(TENANT_A);

    assert(metrics.success === true, 'Metrics computed successfully');
    assert(metrics.totalInnovationProjects >= 1, 'Total innovation projects counted');
    assert(metrics.totalStartups >= 1, 'Total startups counted');
    assert(metrics.totalMentors >= 1, 'Total mentors counted');
    assert(metrics.totalFundingReceived >= 250000, 'Total funding mobilized counted');
    assert(metrics.totalIndustryCollaborations >= 1, 'Total industry collaborations counted');
    assert(metrics.totalInnovationEvents >= 1, 'Total innovation events counted');
    assert(metrics.totalInnovationAwards >= 1, 'Total innovation awards counted');
    assert(metrics.yearWiseComparison.length === 3, '3-Year trajectory comparison generated');

    // --- TEST 10: NAAC / IQAC INNOVATION SUMMARY DOSSIER ---
    console.log('\n--- Test 10: NAAC Innovation Summary Evidence Dossier ---');
    const naac = await sgService.getNaacInnovationSummary(TENANT_A);

    assert(naac.success === true, 'NAAC Innovation summary generated');
    assert(naac.indicators.length >= 4, 'Criterion 3 innovation indicators populated');
    const metric321 = naac.indicators.find(i => i.metric.includes('3.2.1'));
    assert(metric321 !== undefined, 'Metric 3.2.1 (Ecosystem & Incubation) present');
    assert(metric321!.evidenceCount >= 1, 'Metric 3.2.1 evidence files counted');

    // --- TEST 11: MULTI-TENANT ISOLATION ---
    console.log('\n--- Test 11: Multi-Tenant Innovation Isolation ---');
    const tenantBInnovations = await sgService.listInnovationProjects(TENANT_B);
    assert(tenantBInnovations.length === 0, 'Tenant B does not leak Tenant A innovation projects');

    const tenantBMentors = await sgService.listInnovationMentors(TENANT_B);
    assert(tenantBMentors.length === 0, 'Tenant B does not leak Tenant A mentors');

    // Clean up DB startup records for Tenant A
    await prisma.startup.deleteMany({ where: { tenantId: TENANT_A } });

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} STAGE 10.2 INNOVATION TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage102InnovationTests();
