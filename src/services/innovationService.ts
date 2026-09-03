import * as XLSX from 'xlsx';
import {
  InnovationProjectItem,
  IncubationCentreItem,
  IncubationApplicationItem,
  StartupItem,
  InnovationMentorItem,
  MentoringSessionItem,
  InnovationFundingItem,
  IndustryCollaborationItem,
  InnovationEventItem,
  HackathonItem,
  InnovationAwardItem,
  StartupMilestoneItem,
  InnovationFilterState,
  InnovationMetricsData,
  InnovationNaacSummary,
} from '../types/innovation';

class InnovationService {
  private projects: InnovationProjectItem[] = [
    {
      id: 'inn-1',
      innovationCode: 'INN-2026-001',
      title: 'Smart Agro-IoT Soil Nutrient & Moisture Sensing Drone System',
      description: 'Autonomous low-cost drone equipped with multispectral camera and IoT soil probe telemetry.',
      category: 'Agriculture',
      problemStatement: 'Excessive fertilizer usage and erratic soil moisture in semi-arid Gujarat farmland.',
      proposedSolution: 'Drone-assisted precision mapping transmitting real-time NPK & soil pH alerts to farmers.',
      leadName: 'Darshan Varma',
      leadId: 'stu-inn-01',
      leadType: 'STUDENT',
      studentMembers: ['Darshan Varma', 'Kunal Shah', 'Riya Sen'],
      facultyMentorName: 'Dr. Rajesh Sharma',
      facultyMentorId: 'fac-1',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      academicYear: '2025-26',
      startDate: '2025-08-01',
      expectedCompletionDate: '2026-06-30',
      status: 'ACTIVE',
      stage: 'PROTOTYPE',
      technologyArea: 'IoT & Edge Computing',
      sdgAlignment: 'SDG 2: Zero Hunger & SDG 12: Responsible Consumption',
      industryPartner: 'AgriTech Agro Solutions LLP',
      iprStatus: 'PATENT_FILED',
      linkedPatentId: 'PAT-2026-101',
      linkedPatentAppNo: '202521048912 A',
      outcome: 'Working alpha prototype deployed across 5 partner farm acres.',
      remarks: 'Selected for SSIP PoC Grant round 2.',
      documentCount: 3,
      createdAt: '2025-08-01T10:00:00Z',
    },
    {
      id: 'inn-2',
      innovationCode: 'INN-2026-002',
      title: 'Decentralized Microgrid Energy Ledger for EV Fleet Charging',
      description: 'Smart contract based dynamic load balancing for solar powered EV charging stations.',
      category: 'Renewable Energy',
      problemStatement: 'Transformer overload and tariff synchronization during peak fleet charging hours.',
      proposedSolution: 'P2P energy trading and autonomous micro-inverter switching via local blockchain node.',
      leadName: 'Dr. Amit Trivedi',
      leadId: 'fac-2',
      leadType: 'FACULTY',
      facultyMentorName: 'Dr. Amit Trivedi',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      academicYear: '2025-26',
      startDate: '2025-09-15',
      expectedCompletionDate: '2026-09-15',
      status: 'ACTIVE',
      stage: 'PILOT',
      technologyArea: 'CleanTech & Blockchain',
      sdgAlignment: 'SDG 7: Affordable and Clean Energy',
      industryPartner: 'Adani Green Energy Labs',
      iprStatus: 'PATENT_PUBLISHED',
      linkedPatentId: 'PAT-2025-084',
      linkedPatentAppNo: '202521098412 A',
      outcome: 'Operational charging node on SSIU campus parking area.',
      documentCount: 2,
      createdAt: '2025-09-15T11:00:00Z',
    },
    {
      id: 'inn-3',
      innovationCode: 'INN-2025-014',
      title: 'Biodegradable Agricultural Mulch Sheet from Sugarcane Bagasse',
      description: 'Eco-friendly mulch films that decompose within 90 days enriching soil nitrogen.',
      category: 'Sustainability',
      problemStatement: 'Plastic mulch contamination in soil causing soil toxicity and livestock health hazards.',
      proposedSolution: 'Compressed bagasse and cellulose composite film.',
      leadName: 'Priya Joshi',
      leadId: 'stu-inn-02',
      leadType: 'STUDENT',
      facultyMentorName: 'Prof. Sneha Patel',
      departmentId: 'dept-2',
      departmentName: 'Information Technology',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      academicYear: '2024-25',
      startDate: '2024-07-10',
      actualCompletionDate: '2025-05-20',
      status: 'COMPLETED',
      stage: 'COMMERCIALIZATION',
      technologyArea: 'Green Materials & Bio-Tech',
      sdgAlignment: 'SDG 13: Climate Action',
      industryPartner: 'BioGreen Packaging Ltd.',
      outcome: 'Transferred technology to incubated startup BioMulch Innovations.',
      documentCount: 4,
      createdAt: '2024-07-10T09:00:00Z',
    },
  ];

  private incubationCentres: IncubationCentreItem[] = [
    {
      id: 'inc-cnt-1',
      centreName: 'Swarrnim Incubation Centre (SInC)',
      centreCode: 'SINC-MAIN',
      instituteName: 'Swarrnim Startup & Innovation University',
      instituteId: 'inst-1',
      directorName: 'Dr. Hiren Parmar',
      contactEmail: 'incubation@swarrnim.edu.in',
      contactPhone: '+91 79 2320 0111',
      description: 'Flagship university incubation centre equipped with FabLab, IoT testbed, and co-working space.',
      facilities: ['FabLab & 3D Prototyping', 'IoT Hardware Testing Bench', 'High-Performance AI Workstations', 'Conference & Pitching Rooms', 'Legal & IPR Helpdesk'],
      totalSeats: 60,
      occupiedSeats: 44,
      establishedDate: '2020-01-15',
      status: 'ACTIVE',
      activeCohortsCount: 4,
    },
  ];

  private incubationApplications: IncubationApplicationItem[] = [
    {
      id: 'inc-app-1',
      applicationNumber: 'SINC/APP/2026/019',
      applicantName: 'Darshan Varma',
      applicantRole: 'STUDENT',
      startupOrIdeaName: 'KisanDrone AeroTech',
      linkedInnovationId: 'inn-1',
      category: 'Agriculture',
      problemStatement: 'Unchecked crop pests and uneven fertilizer spraying in rural Gujarat.',
      solution: 'Autonomous scouting drones with multispectral imaging.',
      teamMembersCount: 4,
      facultyMentorName: 'Dr. Rajesh Sharma',
      businessModel: 'B2B equipment leasing and drone-as-a-service to FPOs.',
      marketOpportunity: '₹1,200 Cr Agri-drone service market in Western India.',
      technologyReadinessLevel: 'TRL 5 (Prototype validated in relevant environment)',
      fundingRequirement: 750000,
      applicationDate: '2026-01-10',
      reviewStatus: 'APPROVED',
      reviewerName: 'Dr. Hiren Parmar (Incubation Director)',
      reviewRemarks: 'Strong technical prototype and viable FPO network.',
      decisionDate: '2026-01-25',
    },
  ];

  private startups: StartupItem[] = [
    {
      id: 'stp-1',
      startupCode: 'STP-2026-001',
      startupName: 'KisanDrone AeroTech Pvt. Ltd.',
      legalEntityName: 'KisanDrone AeroTech Private Limited',
      founders: [
        {
          id: 'fnd-1',
          name: 'Darshan Varma',
          role: 'Founder & CEO',
          founderType: 'Student',
          departmentName: 'Computer Engineering',
          joiningDate: '2025-08-01',
          ownershipPercentage: 65,
          email: 'darshan@kisandrone.in',
        },
        {
          id: 'fnd-2',
          name: 'Dr. Rajesh Sharma',
          role: 'Co-Founder & Chief Technical Advisor',
          founderType: 'Faculty',
          departmentName: 'Computer Engineering',
          joiningDate: '2025-08-01',
          ownershipPercentage: 15,
          email: 'rajesh.sharma@swarrnim.edu.in',
        },
      ],
      primaryFounderName: 'Darshan Varma',
      founderType: 'Student',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      category: 'Agriculture',
      sector: 'AgriTech & Robotics',
      website: 'https://kisandrone.in',
      registrationNumber: 'U01111GJ2025PTC148920',
      incorporationDate: '2025-11-12',
      dpiitRecognized: true,
      dpiitNumber: 'DIPP114820',
      stage: 'EARLY_STAGE',
      status: 'INCUBATING',
      incubationCentreName: 'Swarrnim Incubation Centre (SInC)',
      incubationStartDate: '2025-12-01',
      expectedExitDate: '2027-12-01',
      teamSize: 6,
      fundingRaised: 1250000,
      annualRevenue: 340000,
      industryPartners: ['AgriTech Agro Solutions LLP', 'Gujarat Agro Industries Corp'],
      linkedInnovationProjectId: 'inn-1',
      linkedPatentId: 'PAT-2026-101',
      linkedPatentNumber: '202521048912 A',
      academicYear: '2025-26',
      createdAt: '2025-11-15T10:00:00Z',
    },
    {
      id: 'stp-2',
      startupCode: 'STP-2025-008',
      startupName: 'BioMulch Innovations LLP',
      legalEntityName: 'BioMulch Green Tech LLP',
      founders: [
        {
          id: 'fnd-3',
          name: 'Priya Joshi',
          role: 'Managing Partner',
          founderType: 'Alumni',
          departmentName: 'Information Technology',
          joiningDate: '2024-07-10',
          ownershipPercentage: 80,
          email: 'priya@biomulch.com',
        },
      ],
      primaryFounderName: 'Priya Joshi',
      founderType: 'Student',
      departmentId: 'dept-2',
      departmentName: 'Information Technology',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      category: 'Sustainability',
      sector: 'CleanTech & Bio-Packaging',
      registrationNumber: 'AAX-4819',
      incorporationDate: '2024-10-05',
      dpiitRecognized: true,
      dpiitNumber: 'DIPP098412',
      stage: 'GROWTH',
      status: 'ACTIVE',
      incubationCentreName: 'Swarrnim Incubation Centre (SInC)',
      incubationStartDate: '2024-11-01',
      teamSize: 9,
      fundingRaised: 2500000,
      annualRevenue: 1450000,
      linkedInnovationProjectId: 'inn-3',
      academicYear: '2024-25',
      createdAt: '2024-10-10T10:00:00Z',
    },
  ];

  private mentors: InnovationMentorItem[] = [
    {
      id: 'mnt-1',
      mentorName: 'Vikramaditya Solanki',
      mentorType: 'Entrepreneur',
      organization: 'Solanki Ventures & Tech Fund',
      expertise: 'Early Stage GTM, Product-Market Fit, B2B SaaS',
      email: 'vikram@solankiventures.in',
      contactNumber: '+91 98250 11920',
      experienceYears: 14,
      availability: 'Alternate Saturdays (4 hrs/mo)',
      assignedStartupsCount: 3,
      assignedProjectsCount: 2,
      status: 'ACTIVE',
    },
    {
      id: 'mnt-2',
      mentorName: 'Adv. Meera Desai',
      mentorType: 'Legal',
      organization: 'Desai & Associates IP Law',
      expertise: 'Patent Drafting, Trademark Protection & Equity Structuring',
      email: 'meera@desai-ip.com',
      contactNumber: '+91 94260 88219',
      experienceYears: 11,
      availability: 'Monthly Advisory Clinic',
      assignedStartupsCount: 5,
      assignedProjectsCount: 4,
      status: 'ACTIVE',
    },
    {
      id: 'mnt-3',
      mentorName: 'Dr. Rajesh Sharma',
      mentorType: 'Faculty',
      organization: 'Swarrnim Institute of Technology',
      expertise: 'AI/ML, Edge Computing & IoT Sensor Networks',
      departmentName: 'Computer Engineering',
      instituteName: 'Swarrnim Institute of Technology',
      email: 'rajesh.sharma@swarrnim.edu.in',
      contactNumber: '+91 98795 44102',
      experienceYears: 16,
      availability: 'Weekly Incubation Office Hours',
      assignedStartupsCount: 2,
      assignedProjectsCount: 5,
      status: 'ACTIVE',
    },
  ];

  private mentoringSessions: MentoringSessionItem[] = [
    {
      id: 'ms-1',
      mentorId: 'mnt-1',
      mentorName: 'Vikramaditya Solanki',
      targetType: 'STARTUP',
      targetId: 'stp-1',
      targetName: 'KisanDrone AeroTech Pvt. Ltd.',
      sessionDate: '2026-02-15',
      objectives: 'FPO Pricing tier review and unit economics optimization',
      mentoringNotes: 'Advised shifting from per-acre billing to annual subscription bundles for farmer producer organizations.',
      recommendations: 'Conduct pilot with 20 FPO cluster heads in Mehsana district.',
      nextAction: 'Finalize standard SLA contract draft.',
      followUpDate: '2026-03-15',
      completed: true,
    },
  ];

  private fundings: InnovationFundingItem[] = [
    {
      id: 'fnd-grant-1',
      fundingCode: 'SSIP/POC/2025/081',
      recipientType: 'INNOVATION_PROJECT',
      recipientId: 'inn-1',
      recipientName: 'Smart Agro-IoT Soil Nutrient Sensing Drone',
      fundingSource: 'Gujarat Student Startup and Innovation Policy (SSIP 2.0)',
      fundingType: 'Government',
      sanctionDate: '2025-10-15',
      sanctionedAmount: 250000,
      releasedAmount: 200000,
      utilizedAmount: 185000,
      balanceAmount: 15000,
      purpose: 'Fabrication of drone carbon-fiber airframe and NPK optical sensor purchase',
      status: 'RELEASED',
      academicYear: '2025-26',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
    },
    {
      id: 'fnd-grant-2',
      fundingCode: 'SINC/SEED/2026/012',
      recipientType: 'STARTUP',
      recipientId: 'stp-1',
      recipientName: 'KisanDrone AeroTech Pvt. Ltd.',
      fundingSource: 'Swarrnim University Seed Support Fund',
      fundingType: 'Incubation Fund',
      sanctionDate: '2026-01-20',
      sanctionedAmount: 1000000,
      releasedAmount: 500000,
      utilizedAmount: 320000,
      balanceAmount: 180000,
      purpose: 'Commercial batch tooling and field certification',
      status: 'RELEASED',
      academicYear: '2025-26',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
    },
  ];

  private collaborations: IndustryCollaborationItem[] = [
    {
      id: 'col-1',
      collaborationCode: 'MOU-IND-2025-018',
      industryName: 'Adani Green Energy Labs, Ahmedabad',
      collaborationType: 'MoU',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteName: 'Swarrnim Institute of Technology',
      facultyCoordinatorName: 'Dr. Amit Trivedi',
      linkedStartupOrProjectName: 'Decentralized Microgrid Energy Ledger',
      startDate: '2025-06-01',
      endDate: '2028-05-31',
      mouReference: 'SSIU/MOU/2025/08',
      scope: 'Joint development of smart charging protocols, solar inverter telemetry and student internships.',
      deliverables: '2 Field pilot installations and 4 co-developed research papers.',
      status: 'ACTIVE',
    },
  ];

  private events: InnovationEventItem[] = [
    {
      id: 'evt-1',
      eventName: 'Swarrnim National Innovation Day & Expo 2026',
      eventType: 'Innovation Day',
      organizer: 'Directorate of Innovation & Incubation',
      instituteName: 'Swarrnim Startup & Innovation University',
      departmentName: 'Computer Engineering',
      eventDate: '2026-01-28',
      venue: 'University Central Auditorium & Expo Ground',
      participantCount: 450,
      facultyCoordinators: 'Dr. Hiren Parmar, Dr. Rajesh Sharma',
      industryGuests: 'Mr. Sunil Parekh (CII National Committee), Ms. Anita Gupta (DST)',
      outcomes: '72 student prototype exhibits displayed; 6 startups received angel investor commitments.',
      academicYear: '2025-26',
    },
  ];

  private hackathons: HackathonItem[] = [
    {
      id: 'hck-1',
      hackathonName: 'Swarrnim Smart India Hackathon (SSIU-SIH 2025)',
      organizer: 'Institute Innovation Council (IIC) & Dept of CSE',
      eventDate: '2025-09-20',
      theme: 'Smart Automation, Precision Agriculture & CleanTech Solutions',
      problemStatementsCount: 18,
      teamsCount: 42,
      participantsCount: 210,
      facultyMentors: 'Dr. Rajesh Sharma, Prof. Sneha Patel',
      industryMentors: 'Engineers from L&T Technology Services, Infostretch',
      winners: 'Team AgroPulse (Darshan Varma & Team) - 1st Prize',
      awardsPrizePool: 150000,
      innovationProjectsCreatedCount: 5,
      followUpStatus: 'All 3 winning teams onboarded to SInC Incubation Cohort 4.',
      academicYear: '2025-26',
    },
  ];

  private awards: InnovationAwardItem[] = [
    {
      id: 'awd-1',
      awardTitle: 'Best Student Innovator of Gujarat (AgriTech)',
      recipientName: 'Darshan Varma',
      recipientType: 'STUDENT',
      startupOrProjectName: 'KisanDrone AeroTech',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteName: 'Swarrnim Institute of Technology',
      awardingOrganization: 'Gujarat Knowledge Society (GKS) & Education Department',
      level: 'State',
      category: 'Student Innovation & Entrepreneurship',
      awardDate: '2025-12-18',
      description: 'Awarded state gold trophy and ₹1,00,000 cash citation for drone soil sensor innovation.',
      prizeMoney: 100000,
      academicYear: '2025-26',
    },
  ];

  private milestones: StartupMilestoneItem[] = [
    {
      id: 'mst-1',
      startupId: 'stp-1',
      startupName: 'KisanDrone AeroTech Pvt. Ltd.',
      milestoneTitle: 'Working Alpha Prototype Field Validation',
      milestoneStage: 'MVP',
      targetDate: '2025-10-30',
      completionDate: '2025-10-25',
      status: 'COMPLETED',
      evidenceDoc: 'DOC-ALPHA-TEST-REPORT.pdf',
      remarks: 'Validated 15 flights across 3 agricultural fields.',
    },
    {
      id: 'mst-2',
      startupId: 'stp-1',
      startupName: 'KisanDrone AeroTech Pvt. Ltd.',
      milestoneTitle: 'Company Incorporation & DPIIT Recognition',
      milestoneStage: 'EARLY_STAGE',
      targetDate: '2025-12-15',
      completionDate: '2025-11-12',
      status: 'COMPLETED',
      evidenceDoc: 'CERT-DPIIT-114820.pdf',
      remarks: 'Registered under Ministry of Corporate Affairs and DPIIT portal.',
    },
    {
      id: 'mst-3',
      startupId: 'stp-1',
      startupName: 'KisanDrone AeroTech Pvt. Ltd.',
      milestoneTitle: 'DGCA Type Certification & Commercial Batch Production',
      milestoneStage: 'GROWTH',
      targetDate: '2026-06-30',
      status: 'IN_PROGRESS',
      remarks: 'Application under review with Quality Council of India.',
    },
  ];

  // ─── FILTER ENGINE ──────────────────────────────────────────────────────────
  public getFilteredData(filters: InnovationFilterState, role?: string, user?: any) {
    let prjs = [...this.projects];
    let stps = [...this.startups];
    let fnds = [...this.fundings];
    let cols = [...this.collaborations];
    let hcks = [...this.hackathons];
    let awds = [...this.awards];

    // RBAC scoping
    if (role === 'STUDENT' && user?.id) {
      prjs = prjs.filter(p => p.leadId === user.id || p.studentMembers?.includes(user.name));
      stps = stps.filter(s => s.founders.some(f => f.email === user.email || f.name === user.name));
    } else if (role === 'FACULTY' && user?.id) {
      prjs = prjs.filter(p => p.facultyMentorId === user.id || p.leadId === user.id);
      stps = stps.filter(s => s.founders.some(f => f.email === user.email || f.name === user.name));
    } else if (role === 'HOD' && user?.departmentId) {
      prjs = prjs.filter(p => p.departmentId === user.departmentId);
      stps = stps.filter(s => s.departmentId === user.departmentId);
    }

    // Filter by Academic Year
    if (filters.academicYear && filters.academicYear !== 'ALL') {
      prjs = prjs.filter(p => p.academicYear === filters.academicYear);
      stps = stps.filter(s => s.academicYear === filters.academicYear);
      fnds = fnds.filter(f => f.academicYear === filters.academicYear);
      hcks = hcks.filter(h => h.academicYear === filters.academicYear);
      awds = awds.filter(a => a.academicYear === filters.academicYear);
    }

    // Filter by Department
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      prjs = prjs.filter(p => p.departmentId === filters.departmentId);
      stps = stps.filter(s => s.departmentId === filters.departmentId);
      fnds = fnds.filter(f => f.departmentId === filters.departmentId);
      cols = cols.filter(c => c.departmentId === filters.departmentId);
      awds = awds.filter(a => a.departmentId === filters.departmentId);
    }

    // Filter by Category
    if (filters.category && filters.category !== 'ALL') {
      prjs = prjs.filter(p => p.category === filters.category);
      stps = stps.filter(s => s.category === filters.category);
    }

    // Filter by Stage
    if (filters.stage && filters.stage !== 'ALL') {
      prjs = prjs.filter(p => p.stage === filters.stage);
      stps = stps.filter(s => s.stage === filters.stage);
    }

    // Filter by Status
    if (filters.status && filters.status !== 'ALL') {
      prjs = prjs.filter(p => p.status === filters.status);
      stps = stps.filter(s => s.status === filters.status);
    }

    // Filter by Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      prjs = prjs.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.leadName.toLowerCase().includes(q) ||
        p.innovationCode.toLowerCase().includes(q) ||
        p.technologyArea.toLowerCase().includes(q)
      );
      stps = stps.filter(s =>
        s.startupName.toLowerCase().includes(q) ||
        s.primaryFounderName.toLowerCase().includes(q) ||
        s.startupCode.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }

    return {
      projects: prjs,
      startups: stps,
      incubationCentres: this.incubationCentres,
      incubationApplications: this.incubationApplications,
      mentors: this.mentors,
      mentoringSessions: this.mentoringSessions,
      fundings: fnds,
      collaborations: cols,
      events: this.events,
      hackathons: hcks,
      awards: awds,
      milestones: this.milestones,
    };
  }

  // ─── METRICS CALCULATION ──────────────────────────────────────────────────
  public getMetrics(filters: InnovationFilterState, role?: string, user?: any): InnovationMetricsData {
    const data = this.getFilteredData(filters, role, user);

    const totalInnovations = data.projects.length;
    const activeInnovations = data.projects.filter(p => p.status === 'ACTIVE').length;
    const completedInnovations = data.projects.filter(p => p.status === 'COMPLETED').length;

    const totalStartups = data.startups.length;
    const incubatedStartups = data.startups.filter(s => s.status === 'INCUBATING').length;
    const activeStartups = data.startups.filter(s => s.status === 'ACTIVE' || s.status === 'INCUBATING').length;
    const studentStartups = data.startups.filter(s => s.founderType === 'Student').length;
    const facultyStartups = data.startups.filter(s => s.founders.some(f => f.founderType === 'Faculty')).length;

    const totalFunding = data.fundings.reduce((sum, f) => sum + f.sanctionedAmount, 0);
    const patentsLinked = data.projects.filter(p => p.linkedPatentId).length + data.startups.filter(s => s.linkedPatentId).length;

    return {
      totalInnovationProjects: totalInnovations,
      activeInnovationProjects: activeInnovations,
      completedInnovations: completedInnovations,
      totalStartups: totalStartups,
      incubatedStartups: incubatedStartups,
      activeStartups: activeStartups,
      studentStartups: studentStartups,
      facultyStartups: facultyStartups,
      totalMentors: data.mentors.length,
      activeIncubationPrograms: data.incubationCentres.reduce((s, c) => s + c.activeCohortsCount, 0),
      totalFundingReceived: totalFunding,
      totalIndustryCollaborations: data.collaborations.length,
      totalInnovationEvents: data.events.length,
      totalHackathons: data.hackathons.length,
      totalInnovationAwards: data.awards.length,
      patentsLinkedToInnovation: patentsLinked,
      yearWiseComparison: [
        { academicYear: '2024-25', innovations: 12, startups: 6, fundingAmount: 1800000, collaborations: 4, hackathons: 2 },
        { academicYear: '2025-26', innovations: 24, startups: 14, fundingAmount: 3750000, collaborations: 8, hackathons: 3 },
        { academicYear: '2026-27', innovations: 35, startups: 22, fundingAmount: 6000000, collaborations: 12, hackathons: 4 },
      ],
    };
  }

  // ─── NAAC / IQAC SUMMARY DOSSIER ──────────────────────────────────────────
  public getNaacSummary(filters: InnovationFilterState, role?: string, user?: any): InnovationNaacSummary[] {
    const data = this.getFilteredData(filters, role, user);
    const totalFunding = data.fundings.reduce((s, f) => s + f.sanctionedAmount, 0);

    return [
      {
        metric: 'Metric 3.2.1: Ecosystem for Innovations including Incubation Centre & Creation of Knowledge',
        currentValue: `${data.incubationCentres.length} Incubation Centre (${data.incubationCentres[0]?.totalSeats || 60} Seats), ${data.startups.length} Startups Incubated`,
        previousPeriodValue: '1 Incubation Centre (40 Seats), 6 Startups',
        change: '+133%',
        interpretation: 'Fully operational DST-recognized Innovation Ecosystem and Student Incubation Centre.',
        evidenceCount: 14,
      },
      {
        metric: 'Metric 3.2.2: Workshops/Seminars on Research Methodology, IPR & Entrepreneurship',
        currentValue: `${data.events.length + data.hackathons.length} Major Innovation Events & Hackathons (${data.events.reduce((s, e) => s + e.participantCount, 0) + data.hackathons.reduce((s, h) => s + h.participantsCount, 0)} Participants)`,
        previousPeriodValue: '3 Events (320 Participants)',
        change: '+106%',
        interpretation: 'Significant increase in university-wide hackathons and design-thinking bootcamps.',
        evidenceCount: 8,
      },
      {
        metric: 'Metric 3.3.2: Innovation Awards & Recognitions for Institution/Faculty/Students',
        currentValue: `${data.awards.length} State & National Innovation Recognitions`,
        previousPeriodValue: '1 State Recognition',
        change: '+100%',
        interpretation: 'Direct recognition by Gujarat Knowledge Society and Education Department.',
        evidenceCount: 5,
      },
      {
        metric: 'Metric 3.5.2: Industry-Academia MoUs & Innovation Collaborations',
        currentValue: `${data.collaborations.length} Active Industry MoUs for Tech Transfer & Incubation`,
        previousPeriodValue: '2 Active MoUs',
        change: '+150%',
        interpretation: 'Strong commercial links with leading energy and agritech conglomerates.',
        evidenceCount: 6,
      },
      {
        metric: 'SSIP 2.0 / Grant Funding: Total Innovation & PoC Financial Support Mobilized',
        currentValue: `₹${(totalFunding / 100000).toFixed(2)} Lakhs Sanctioned`,
        previousPeriodValue: '₹18.00 Lakhs',
        change: '+108%',
        interpretation: 'Substantial grant mobilization under Gujarat SSIP 2.0 and University Seed Fund.',
        evidenceCount: 10,
      },
    ];
  }

  // ─── CRUD METHODS ─────────────────────────────────────────────────────────
  public createInnovationProject(project: Omit<InnovationProjectItem, 'id' | 'createdAt'>): InnovationProjectItem {
    const newItem: InnovationProjectItem = {
      ...project,
      id: `inn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.projects.unshift(newItem);
    return newItem;
  }

  public createStartup(startup: Omit<StartupItem, 'id' | 'createdAt'>): StartupItem {
    const newItem: StartupItem = {
      ...startup,
      id: `stp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.startups.unshift(newItem);
    return newItem;
  }

  public createMentor(mentor: Omit<InnovationMentorItem, 'id'>): InnovationMentorItem {
    const newItem: InnovationMentorItem = {
      ...mentor,
      id: `mnt-${Date.now()}`,
    };
    this.mentors.unshift(newItem);
    return newItem;
  }

  public createMentoringSession(session: Omit<MentoringSessionItem, 'id'>): MentoringSessionItem {
    const newItem: MentoringSessionItem = {
      ...session,
      id: `ms-${Date.now()}`,
    };
    this.mentoringSessions.unshift(newItem);
    return newItem;
  }

  public createFunding(funding: Omit<InnovationFundingItem, 'id'>): InnovationFundingItem {
    const newItem: InnovationFundingItem = {
      ...funding,
      id: `fnd-${Date.now()}`,
    };
    this.fundings.unshift(newItem);
    return newItem;
  }

  public createCollaboration(collaboration: Omit<IndustryCollaborationItem, 'id'>): IndustryCollaborationItem {
    const newItem: IndustryCollaborationItem = {
      ...collaboration,
      id: `col-${Date.now()}`,
    };
    this.collaborations.unshift(newItem);
    return newItem;
  }

  public createEvent(event: Omit<InnovationEventItem, 'id'>): InnovationEventItem {
    const newItem: InnovationEventItem = {
      ...event,
      id: `evt-${Date.now()}`,
    };
    this.events.unshift(newItem);
    return newItem;
  }

  public createHackathon(hackathon: Omit<HackathonItem, 'id'>): HackathonItem {
    const newItem: HackathonItem = {
      ...hackathon,
      id: `hck-${Date.now()}`,
    };
    this.hackathons.unshift(newItem);
    return newItem;
  }

  public createAward(award: Omit<InnovationAwardItem, 'id'>): InnovationAwardItem {
    const newItem: InnovationAwardItem = {
      ...award,
      id: `awd-${Date.now()}`,
    };
    this.awards.unshift(newItem);
    return newItem;
  }

  public createMilestone(milestone: Omit<StartupMilestoneItem, 'id'>): StartupMilestoneItem {
    const newItem: StartupMilestoneItem = {
      ...milestone,
      id: `mst-${Date.now()}`,
    };
    this.milestones.unshift(newItem);
    return newItem;
  }

  // ─── 11-SHEET EXCEL EXPORT WORKBOOK ───────────────────────────────────────
  public exportMultiSheetExcel(filters: InnovationFilterState, role?: string, user?: any) {
    const data = this.getFilteredData(filters, role, user);
    const metrics = this.getMetrics(filters, role, user);
    const naac = this.getNaacSummary(filters, role, user);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['SWARRNIM STARTUP & INNOVATION UNIVERSITY (SSIU)'],
      ['DIRECTORATE OF INNOVATION, INCUBATION & STARTUP CELL'],
      ['INSTITUTIONAL INNOVATION & ENTREPRENEURSHIP AUDIT REPORT'],
      ['Generated On:', new Date().toLocaleString()],
      ['Academic Year Filter:', filters.academicYear],
      ['Department Filter:', filters.departmentId],
      [],
      ['EXECUTIVE INNOVATION KPIS', 'VALUE'],
      ['Total Innovation Projects', metrics.totalInnovationProjects],
      ['Active Innovations', metrics.activeInnovationProjects],
      ['Completed Innovations', metrics.completedInnovations],
      ['Total Startups Registered', metrics.totalStartups],
      ['Incubated Startups (SInC)', metrics.incubatedStartups],
      ['Student-Led Startups', metrics.studentStartups],
      ['Faculty-Led Startups', metrics.facultyStartups],
      ['Total Mentors in Pool', metrics.totalMentors],
      ['Active Incubation Cohorts', metrics.activeIncubationPrograms],
      ['Total Innovation Funding Mobilized (INR)', metrics.totalFundingReceived],
      ['Industry Collaborations / MoUs', metrics.totalIndustryCollaborations],
      ['Hackathons Organized', metrics.totalHackathons],
      ['Innovation Awards Won', metrics.totalInnovationAwards],
      ['Patents Linked to Innovations', metrics.patentsLinkedToInnovation],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Innovation_Projects
    const prjData = [
      ['Code', 'Title', 'Category', 'Lead Name', 'Lead Type', 'Faculty Mentor', 'Department', 'Stage', 'Status', 'SDG', 'Linked Patent', 'Start Date'],
      ...data.projects.map(p => [
        p.innovationCode,
        p.title,
        p.category,
        p.leadName,
        p.leadType,
        p.facultyMentorName,
        p.departmentName,
        p.stage,
        p.status,
        p.sdgAlignment || 'N/A',
        p.linkedPatentAppNo || p.linkedPatentId || 'None',
        p.startDate,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prjData), 'Innovation_Projects');

    // Sheet 3: Startups
    const stpData = [
      ['Startup Code', 'Startup Name', 'Legal Entity', 'Primary Founder', 'Founder Type', 'Sector', 'Stage', 'Status', 'DPIIT No', 'Incubation Centre', 'Funding Raised (INR)', 'Revenue (INR)'],
      ...data.startups.map(s => [
        s.startupCode,
        s.startupName,
        s.legalEntityName || 'N/A',
        s.primaryFounderName,
        s.founderType,
        s.sector,
        s.stage,
        s.status,
        s.dpiitNumber || (s.dpiitRecognized ? 'Recognized' : 'None'),
        s.incubationCentreName || 'Direct',
        s.fundingRaised,
        s.annualRevenue || 0,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stpData), 'Startups');

    // Sheet 4: Incubation_Centre
    const incData = [
      ['Centre Code', 'Centre Name', 'Director', 'Contact Email', 'Contact Phone', 'Total Seats', 'Occupied Seats', 'Active Cohorts', 'Status'],
      ...data.incubationCentres.map(c => [
        c.centreCode,
        c.centreName,
        c.directorName,
        c.contactEmail,
        c.contactPhone,
        c.totalSeats,
        c.occupiedSeats,
        c.activeCohortsCount,
        c.status,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(incData), 'Incubation_Centre');

    // Sheet 5: Mentors
    const mntData = [
      ['Mentor Name', 'Type', 'Organization', 'Expertise', 'Email', 'Contact', 'Experience (Yrs)', 'Assigned Startups', 'Assigned Projects', 'Status'],
      ...data.mentors.map(m => [
        m.mentorName,
        m.mentorType,
        m.organization,
        m.expertise,
        m.email,
        m.contactNumber,
        m.experienceYears,
        m.assignedStartupsCount,
        m.assignedProjectsCount,
        m.status,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mntData), 'Mentors');

    // Sheet 6: Funding_Grants
    const fndData = [
      ['Funding Code', 'Recipient', 'Recipient Type', 'Funding Source', 'Type', 'Sanction Date', 'Sanctioned (INR)', 'Released (INR)', 'Utilized (INR)', 'Balance (INR)', 'Status'],
      ...data.fundings.map(f => [
        f.fundingCode,
        f.recipientName,
        f.recipientType,
        f.fundingSource,
        f.fundingType,
        f.sanctionDate,
        f.sanctionedAmount,
        f.releasedAmount,
        f.utilizedAmount,
        f.balanceAmount,
        f.status,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fndData), 'Funding_Grants');

    // Sheet 7: Industry_Collaboration
    const colData = [
      ['MoU Code', 'Industry Name', 'Type', 'Faculty Coordinator', 'Department', 'Start Date', 'End Date', 'Scope', 'Status'],
      ...data.collaborations.map(c => [
        c.collaborationCode,
        c.industryName,
        c.collaborationType,
        c.facultyCoordinatorName,
        c.departmentName,
        c.startDate,
        c.endDate || 'Ongoing',
        c.scope,
        c.status,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(colData), 'Industry_Collaboration');

    // Sheet 8: Hackathons
    const hckData = [
      ['Hackathon Name', 'Organizer', 'Date', 'Theme', 'Teams', 'Participants', 'Faculty Mentors', 'Winners', 'Prize Pool (INR)', 'Projects Created'],
      ...data.hackathons.map(h => [
        h.hackathonName,
        h.organizer,
        h.eventDate,
        h.theme,
        h.teamsCount,
        h.participantsCount,
        h.facultyMentors,
        h.winners,
        h.awardsPrizePool,
        h.innovationProjectsCreatedCount,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hckData), 'Hackathons');

    // Sheet 9: Innovation_Awards
    const awdData = [
      ['Award Title', 'Recipient', 'Recipient Type', 'Startup/Project', 'Awarding Organization', 'Level', 'Category', 'Date', 'Prize Money (INR)'],
      ...data.awards.map(a => [
        a.awardTitle,
        a.recipientName,
        a.recipientType,
        a.startupOrProjectName || 'N/A',
        a.awardingOrganization,
        a.level,
        a.category,
        a.awardDate,
        a.prizeMoney || 0,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(awdData), 'Innovation_Awards');

    // Sheet 10: IPR_Patent_Links
    const iprLinks = [
      ['Entity Type', 'Entity Name', 'Lead / Founder', 'IPR Type', 'Linked Patent Application No', 'Stage / Status'],
      ...data.projects.filter(p => p.linkedPatentId || p.linkedPatentAppNo).map(p => [
        'Innovation Project',
        p.title,
        p.leadName,
        p.iprStatus || 'Patent',
        p.linkedPatentAppNo || p.linkedPatentId,
        p.stage,
      ]),
      ...data.startups.filter(s => s.linkedPatentId || s.linkedPatentNumber).map(s => [
        'Startup',
        s.startupName,
        s.primaryFounderName,
        'Patent',
        s.linkedPatentNumber || s.linkedPatentId,
        s.stage,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(iprLinks), 'IPR_Patent_Links');

    // Sheet 11: NAAC_IQAC_Summary
    const naacData = [
      ['NAAC Metric Description', 'Current Period (2025-26)', 'Previous Period (2024-25)', 'Growth (%)', 'Institutional Interpretation', 'Evidence Dossiers'],
      ...naac.map(n => [
        n.metric,
        n.currentValue,
        n.previousPeriodValue,
        n.change,
        n.interpretation,
        n.evidenceCount,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(naacData), 'NAAC_IQAC_Summary');

    XLSX.writeFile(wb, `SSIU_Innovation_Incubation_Report_${filters.academicYear || 'All'}.xlsx`);
  }
}

export const innovationService = new InnovationService();
