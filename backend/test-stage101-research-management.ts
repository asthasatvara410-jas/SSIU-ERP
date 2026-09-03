import { PrismaClient } from '@prisma/client';
import { ResearchService } from './src/research/research.service';
import { ResearchProjectService } from './src/research/research-project.service';
import { PublicationService } from './src/research/publication.service';
import { PatentService } from './src/research/patent.service';
import { ResearchValidationService } from './src/research/research-validation.service';
import { ResearchApprovalService } from './src/research/research-approval.service';
import { ResearchAuditService } from './src/research/research-audit.service';

const prisma = new PrismaClient();
const projectService = new ResearchProjectService(prisma as any);
const pubService = new PublicationService(prisma as any);
const patentService = new PatentService(prisma as any);

const mockDoiService = { resolveDOI: async () => ({ status: 'VERIFIED' }) };
const mockCrossrefService = { validatePublication: async () => ({ status: 'MATCH', matchedFields: ['title', 'doi'], mismatchedFields: [] }) };
const mockOpenAlexService = { searchByTitle: async () => null };
const mockOrcidService = { getRecord: async () => null };

const validationService = new (ResearchValidationService as any)(
  prisma as any,
  mockDoiService,
  mockCrossrefService,
  mockOpenAlexService,
  mockOrcidService,
);
const approvalService = new ResearchApprovalService(prisma as any);
const auditService = new ResearchAuditService();

const researchService = new ResearchService(
  prisma as any,
  projectService,
  pubService,
  patentService,
  validationService,
  approvalService,
  auditService,
);

async function runStage101ResearchTests() {
  console.log('================================================================');
  console.log('🚀 STAGE 10.1 — RESEARCH, PATENT & PUBLICATION MANAGEMENT TEST SUITE');
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

  const TENANT_A = 'TENANT-RESEARCH-A';
  const TENANT_B = 'TENANT-RESEARCH-B';

  try {
    // Ensure valid Institute, Department, and User exist for DB foreign keys
    let inst = await prisma.institute.findFirst();
    let dept = await prisma.department.findFirst();
    let user = await prisma.user.findFirst();

    if (!inst) {
      const uni = await prisma.university.findFirst() || await prisma.university.create({ data: { id: 'uni-01', name: 'SSIU', code: 'SSIU' } as any });
      inst = await prisma.institute.create({
        data: {
          id: 'inst-test-01',
          name: 'Swarrnim Institute of Technology',
          code: 'SIT',
          universityId: uni.id,
        } as any,
      });
    }

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          id: 'dept-test-01',
          name: 'Computer Engineering',
          code: 'CSE',
          instituteId: inst.id,
        } as any,
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'user-test-pi-01',
          username: 'faculty_pi',
          email: 'pi@swarrnim.edu.in',
          passwordHash: 'hashed_password',
          role: 'FACULTY',
        } as any,
      });
    }

    // --- TEST 1: RESEARCH PROJECTS MANAGEMENT ---
    console.log('--- Test 1: Research Project Creation & Lifecycle ---');
    const project = await researchService.createProject(
      {
        title: 'Distributed Edge Computing for Smart Campus Energy Optimization',
        abstract: 'Intelligent IoT micro-controllers for dynamic power load balancing.',
        researchArea: 'Artificial Intelligence & IoT',
        fundingSource: 'DST (Department of Science & Technology)',
        fundingAmount: 2850000,
        departmentId: dept.id,
      },
      inst.id,
      user.id
    );

    assert(project.id !== '', 'Research project created with valid ID');
    assert(project.title.includes('Distributed Edge Computing'), 'Project title saved');
    assert(project.totalBudget !== undefined, 'Project budget recorded');

    // --- TEST 2: PUBLICATIONS REPOSITORY & INDEXING METADATA ---
    console.log('\n--- Test 2: Publication Management & Indexing Metadata ---');
    const publication = await researchService.createPublication(
      {
        title: 'Deep Q-Networks for Low-Latency Fog Scheduling in Academic Campuses',
        authors: 'Dr. Rajesh Sharma, Prof. Priya Patel',
        journalName: 'IEEE Transactions on Network and Service Management',
        publicationType: 'JOURNAL_ARTICLE',
        year: 2026,
        doi: '10.1109/TNSM.2026.3190842',
        issn: '1932-4537',
        indexing: 'SCOPUS',
      },
      TENANT_A,
      'USER-PI-01'
    );

    assert(publication.id !== '', 'Publication created successfully');
    assert(publication.indexing === 'SCOPUS', 'Scopus indexing tag preserved');
    assert(publication.doi === '10.1109/TNSM.2026.3190842', 'DOI metadata persisted');
    assert(publication.validationStatus === 'NOT_VERIFIED', 'Initial validation status is NOT_VERIFIED');

    // Validate DOI with validation service
    const validatedPub = await researchService.validatePublication(publication.id, TENANT_A);
    assert(validatedPub.validationStatus === 'VERIFIED', 'DOI validated and verified via Crossref engine');

    // --- TEST 3: PATENTS & IPR LIFECYCLE ---
    console.log('\n--- Test 3: Patent & IPR Management ---');
    const patent = await researchService.createPatent(
      {
        title: 'Intelligent Energy-Harvesting Microgrid Node Controller',
        inventors: 'Dr. Rajesh Sharma, Prof. Priya Patel',
        applicationNumber: '202521048912 A',
        publicationNumber: 'IN-202521048912-A',
        jurisdiction: 'India (IPO)',
        status: 'PUBLISHED',
      },
      TENANT_A,
      'USER-PI-01'
    );

    assert(patent.id !== '', 'Patent record created successfully');
    assert(patent.applicationNumber === '202521048912 A', 'Patent application number preserved');
    assert(patent.status === 'PUBLISHED', 'Patent status is PUBLISHED');

    // --- TEST 4: RESEARCH GRANTS MANAGEMENT ---
    console.log('\n--- Test 4: Research Grants & Funding Management ---');
    const grant = await researchService.createGrant(
      {
        grantNo: 'DST/TDT/DDP-2025/119',
        projectTitle: 'Distributed Edge Computing for Smart Campus Energy Optimization',
        fundingAgency: 'DST (Department of Science & Technology)',
        grantType: 'GOVERNMENT',
        sanctionedAmount: 2850000,
        releasedAmount: 1800000,
        utilizedAmount: 1420000,
        status: 'RELEASED',
        departmentId: 'dept-1',
      },
      TENANT_A,
      'USER-PI-01'
    );

    assert(grant.id !== '', 'Grant record created successfully');
    assert(grant.sanctionedAmount === 2850000, 'Sanctioned grant amount recorded');
    assert(grant.balanceAmount === 1430000, 'Grant balance amount calculated accurately');

    const grantsList = await researchService.listGrants(TENANT_A);
    assert(grantsList.length >= 1, 'Grant retrieved in list');

    // --- TEST 5: RESEARCH SCHOLARS (PH.D. CANDIDATES) ---
    console.log('\n--- Test 5: Research Scholar & Doctoral Guidance ---');
    const scholar = await researchService.createScholar(
      {
        scholarName: 'Ananya Deshmukh',
        registrationNumber: 'SSIU/PHD/2024/042',
        program: 'Ph.D.',
        supervisorName: 'Dr. Rajesh Sharma',
        researchArea: 'Reinforcement Learning in Smart Grid Systems',
        thesisTitle: 'Autonomous Energy Orchestration in Distributed Microgrids Using Multi-Agent Deep Q-Learning',
        status: 'ACTIVE',
        departmentId: 'dept-1',
      },
      TENANT_A,
      'USER-PI-01'
    );

    assert(scholar.id !== '', 'Research scholar enrolled successfully');
    assert(scholar.scholarName === 'Ananya Deshmukh', 'Scholar name recorded');
    assert(scholar.status === 'ACTIVE', 'Scholar status is ACTIVE');

    // --- TEST 6: CORPORATE CONSULTANCY PROJECTS ---
    console.log('\n--- Test 6: Corporate Consultancy Management ---');
    const consultancy = await researchService.createConsultancy(
      {
        projectTitle: 'Automated Defect Detection System for Industrial Textile Looms',
        clientName: 'Arvind Mills Ltd., Ahmedabad',
        facultyConsultantName: 'Dr. Rajesh Sharma',
        contractAmount: 650000,
        receivedAmount: 650000,
        status: 'COMPLETED',
        departmentId: 'dept-1',
      },
      TENANT_A,
      'USER-PI-01'
    );

    assert(consultancy.id !== '', 'Consultancy project created successfully');
    assert(consultancy.contractAmount === 650000, 'Consultancy contract revenue recorded');

    // --- TEST 7: CONFERENCES, BOOKS & RESEARCH AWARDS ---
    console.log('\n--- Test 7: Conferences, Books & Research Awards ---');
    const conference = await researchService.createConference(
      {
        conferenceName: '2025 IEEE International Conference on Advanced Computing (IACC)',
        organizer: 'IEEE Computer Society',
        facultyName: 'Dr. Amit Trivedi',
        location: 'Goa, India',
        paperPresented: 'Real-Time Crop Health Assessment Using Multispectral Drone Imagery',
      },
      TENANT_A,
      'USER-PI-01'
    );
    assert(conference.id !== '', 'Conference record created');

    const book = await researchService.createBook(
      {
        title: 'Reinforcement Learning Principles for Cyber-Physical Edge Systems',
        authors: 'Dr. Rajesh Sharma, Dr. Amit Trivedi',
        publisher: 'Springer Nature (Singapore)',
        isbn: '978-981-19-4820-3',
        itemType: 'BOOK_CHAPTER',
      },
      TENANT_A,
      'USER-PI-01'
    );
    assert(book.id !== '', 'Book chapter record created');

    const award = await researchService.createAward(
      {
        awardTitle: 'Best Research Faculty of the Year (Engineering)',
        recipientName: 'Dr. Rajesh Sharma',
        awardingOrganization: 'Gujarat Innovation Society (GIS)',
        level: 'State',
      },
      TENANT_A,
      'USER-PI-01'
    );
    assert(award.id !== '', 'Research award record created');

    // --- TEST 8: COMPREHENSIVE RESEARCH METRICS CALCULATION ---
    console.log('\n--- Test 8: Comprehensive Research Metrics & 3-Year Comparison ---');
    const metrics = await researchService.getComprehensiveResearchMetrics(TENANT_A);

    assert(metrics.success === true, 'Metrics computed successfully');
    assert(metrics.totalPublications >= 1, 'Total publications counted');
    assert(metrics.scopusPublications >= 1, 'Scopus publications counted');
    assert(metrics.totalGrantsCount >= 1, 'Total grants count matches test data');
    assert(metrics.totalGrantAmount >= 2850000, 'Total grant amount matches test data');
    assert(metrics.totalScholars >= 1, 'Active Ph.D. scholars counted');
    assert(metrics.totalConsultancy >= 1, 'Consultancy projects counted');
    assert(metrics.totalConsultancyAmount >= 650000, 'Consultancy revenue counted');
    assert(metrics.totalAwards >= 1, 'Research awards counted');
    assert(metrics.yearWiseComparison.length === 3, '3-Year comparison trajectory generated');

    // --- TEST 9: NAAC / IQAC CRITERION 3 EVIDENCE DOSSIER ---
    console.log('\n--- Test 9: NAAC Criterion 3 Evidence Dossier Mapping ---');
    const naac = await researchService.getNaacCriterion3Summary(TENANT_A);

    assert(naac.success === true, 'NAAC summary dossier generated');
    assert(naac.indicators.length >= 5, 'Criterion 3 indicators populated (3.1, 3.3, 3.4, 3.5)');
    const metric311 = naac.indicators.find(i => i.metric.includes('3.1.1'));
    assert(metric311 !== undefined, 'Metric 3.1.1 (Grants) present');
    assert(metric311!.evidenceCount >= 1, 'Metric 3.1.1 evidence file count populated');

    const metric343 = naac.indicators.find(i => i.metric.includes('3.4.3'));
    assert(metric343 !== undefined, 'Metric 3.4.3 (Scopus/WoS Papers) present');
    assert(metric343!.currentValue.includes('Scopus'), 'Metric 3.4.3 details Scopus indexing');

    // --- TEST 10: MULTI-TENANT ISOLATION ---
    console.log('\n--- Test 10: Multi-Tenant Research Isolation ---');
    const tenantBGrants = await researchService.listGrants(TENANT_B);
    assert(tenantBGrants.length === 0, 'Tenant B does not leak Tenant A research grant records');

    const tenantBScholars = await researchService.listScholars(TENANT_B);
    assert(tenantBScholars.length === 0, 'Tenant B does not leak Tenant A research scholar records');

    // Clean up test DB records
    await prisma.researchEvidence.deleteMany({ where: { tenantId: TENANT_A } });
    await prisma.patent.deleteMany({ where: { tenantId: TENANT_A } });
    await prisma.publication.deleteMany({ where: { tenantId: TENANT_A } });
    await prisma.researchProject.deleteMany({ where: { instituteId: TENANT_A } });

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} STAGE 10.1 RESEARCH TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage101ResearchTests();
