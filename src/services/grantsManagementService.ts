/**
 * SSIU ERP — GRANTS & SSIP MANAGEMENT SERVICE
 * Stage 10.2: Authoritative Business Logic, Workflow State Machine, Multi-Workbook Excel & NAAC Engine
 */

import {
  GrantOpportunityItem,
  GrantApplicationItem,
  GrantSanctionItem,
  GrantDisbursementItem,
  GrantMilestoneItem,
  GrantExpenseItem,
  GrantDocumentItem,
  SSIPProjectItem,
  GrantMetricsData,
  GrantFilterState,
  GrantNaacSummary,
  GrantApplicationStatus,
} from '../types/grants';
import * as XLSX from 'xlsx';

class GrantsManagementService {
  private opportunities: GrantOpportunityItem[] = [
    {
      id: 'opp-1',
      opportunityCode: 'OPP-2026-001',
      title: 'DST-SERB Core Research Grant (CRG) 2026-27',
      grantingAgency: 'DST',
      schemeName: 'Core Research Grant Scheme',
      grantType: 'GOVERNMENT',
      description: 'Competitive individual research grants for faculty in Science and Engineering domains.',
      eligibilityCriteria: 'Regular faculty with Ph.D. and minimum 3 SCI/Scopus journal papers.',
      targetAudience: 'FACULTY',
      openingDate: '2025-06-01',
      closingDate: '2026-09-30',
      minFundingAmount: 1000000,
      maxFundingAmount: 5000000,
      applicationGuidelines: 'Proposals must follow DST format with detailed methodology and budget justification.',
      requiredDocuments: ['Project Proposal.pdf', 'PI Bio-data.pdf', 'Institutional Endorsement.pdf', 'Budget Breakdown.xlsx'],
      externalApplicationUrl: 'https://serbonline.in/SERB/crg',
      status: 'OPEN',
      academicYear: '2025-26',
      createdBy: 'Research & Development Cell',
      createdAt: '2025-05-20',
    },
    {
      id: 'opp-2',
      opportunityCode: 'OPP-2026-002',
      title: 'SSIP 2.0 Student Prototype & PoC Development Grant',
      grantingAgency: 'SSIP',
      schemeName: 'Student Startup & Innovation Policy (Govt of Gujarat)',
      grantType: 'SSIP',
      description: 'Financial support up to ₹2.50 Lakh for students to develop physical prototypes and Proof-of-Concept models.',
      eligibilityCriteria: 'Enrolled undergraduate or postgraduate students with innovative hardware/software prototypes.',
      targetAudience: 'STUDENT',
      openingDate: '2025-07-01',
      closingDate: '2026-10-31',
      minFundingAmount: 50000,
      maxFundingAmount: 250000,
      applicationGuidelines: 'Students must submit project abstract, mentor recommendation, and bill of materials.',
      requiredDocuments: ['SSIP Proposal Form.pdf', 'Mentor Consent.pdf', 'Student ID Cards.pdf', 'Bill of Materials.xlsx'],
      externalApplicationUrl: 'https://ssipgujarat.in',
      status: 'OPEN',
      academicYear: '2025-26',
      createdBy: 'SSIU Innovation Hub',
      createdAt: '2025-06-15',
    },
    {
      id: 'opp-3',
      opportunityCode: 'OPP-2026-003',
      title: 'GUJCOST Minor Research & Technological Innovation Scheme',
      grantingAgency: 'GUJCOST',
      schemeName: 'Science & Technology Promotion Scheme',
      grantType: 'GOVERNMENT',
      description: 'Minor research grant support for state university faculty working on regional technological challenges.',
      eligibilityCriteria: 'Faculty members of Swarrnim Startup & Innovation University.',
      targetAudience: 'FACULTY',
      openingDate: '2025-08-01',
      closingDate: '2026-11-15',
      minFundingAmount: 200000,
      maxFundingAmount: 600000,
      applicationGuidelines: 'Focus areas include Agriculture IoT, Renewable Energy, and Smart Healthcare.',
      requiredDocuments: ['GUJCOST Form A.pdf', 'Detailed Proposal.pdf', 'Quotation for Equipment.pdf'],
      status: 'OPEN',
      academicYear: '2025-26',
      createdBy: 'Research & Development Cell',
      createdAt: '2025-07-10',
    },
    {
      id: 'opp-4',
      opportunityCode: 'OPP-2026-004',
      title: 'SSIU University Vice Chancellor Seed Grant for Interdisciplinary AI',
      grantingAgency: 'Institutional Seed',
      schemeName: 'Vice Chancellor Research Seed Fund',
      grantType: 'INSTITUTIONAL',
      description: 'Internal university funding to kickstart high-impact interdisciplinary research proposals.',
      eligibilityCriteria: 'Young faculty and interdisciplinary research teams.',
      targetAudience: 'BOTH',
      openingDate: '2025-07-15',
      closingDate: '2026-12-31',
      minFundingAmount: 100000,
      maxFundingAmount: 500000,
      applicationGuidelines: 'Proposals must demonstrate potential for external DST/AICTE grant conversion.',
      requiredDocuments: ['Seed Proposal.pdf', 'Cross-Department Agreement.pdf'],
      status: 'OPEN',
      academicYear: '2025-26',
      createdBy: 'Office of Registrar & Provost',
      createdAt: '2025-07-01',
    },
    {
      id: 'opp-5',
      opportunityCode: 'OPP-2026-005',
      title: 'L&T Infotech & SSIU Industry Sponsored Robotics Collaboration',
      grantingAgency: 'L&T Infotech',
      schemeName: 'Corporate Applied Research Initiative',
      grantType: 'INDUSTRY',
      description: 'Industry funded research for automated warehouse sorting drones and computer vision algorithms.',
      eligibilityCriteria: 'Computer & Mechanical Engineering faculty with postgraduate research scholars.',
      targetAudience: 'FACULTY',
      openingDate: '2025-05-01',
      closingDate: '2025-09-30',
      minFundingAmount: 500000,
      maxFundingAmount: 2000000,
      applicationGuidelines: 'Intellectual Property shared per Industry-Academia MoU guidelines.',
      requiredDocuments: ['Industry Proposal.pdf', 'MoU Reference.pdf', 'Resource Allocation Matrix.pdf'],
      status: 'CLOSING_SOON',
      academicYear: '2025-26',
      createdBy: 'Corporate Relations & Research Cell',
      createdAt: '2025-04-15',
    },
  ];

  private applications: GrantApplicationItem[] = [
    {
      id: 'app-1',
      applicationNumber: 'APP-2026-001',
      opportunityId: 'opp-1',
      opportunityTitle: 'DST-SERB Core Research Grant (CRG) 2026-27',
      grantType: 'GOVERNMENT',
      grantingAgency: 'DST',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms in Agricultural Soil Health Analysis',
      projectSummary: 'Development of multi-agent drone orchestration algorithms for real-time hyperspectral soil nutrient mapping in semi-arid farmlands of Gujarat.',
      objectives: '1. Build edge-AI computer vision for NPK soil assessment.\n2. Design collision-free swarm trajectory algorithms.\n3. Validate field prototype across 50 acres of agricultural land.',
      methodology: 'Sim-to-real transfer with PX4 autopilot, YOLOv9 embedded inference, and MQTT telemetry node.',
      expectedOutcomes: '1. Working drone swarm prototype\n2. 3 Q1 Scopus indexed papers\n3. 1 Indian Patent Filing',
      applicantType: 'FACULTY',
      applicantId: 'fac-1',
      applicantName: 'Dr. Rajesh Sharma',
      applicantEmail: 'rajesh.sharma@swarrnim.edu.in',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      facultyMentorName: 'Dr. Rajesh Sharma',
      teamMembers: [
        { name: 'Dr. Rajesh Sharma', role: 'Principal Investigator' },
        { name: 'Prof. Ankit Mehta', role: 'Co-Principal Investigator' },
        { name: 'Darshan Varma', role: 'Senior Research Fellow (Ph.D.)', enrollmentNo: '210103001' },
      ],
      requestedAmount: 2850000,
      sanctionedAmount: 2850000,
      durationMonths: 24,
      budgetBreakdown: [
        { category: 'EQUIPMENT', allocatedAmount: 1400000, description: 'Multispectral Camera, RTK GPS & Edge Workstations' },
        { category: 'STUDENT_SUPPORT', allocatedAmount: 720000, description: 'SRF Fellow Stipend (24 Months)' },
        { category: 'PROTOTYPE', allocatedAmount: 380000, description: 'Custom Drone Carbon-fiber Airframes & Sensors' },
        { category: 'TRAVEL', allocatedAmount: 150000, description: 'Field Trial Visits & Conference Travel' },
        { category: 'PUBLICATION', allocatedAmount: 200000, description: 'Open Access Scopus Journal APC Charges' },
      ],
      supportingDocuments: ['DST_Proposal_Full.pdf', 'PI_CV_Rajesh.pdf', 'Endorsement_Letter.pdf'],
      declarationAccepted: true,
      submittedDate: '2025-06-25',
      status: 'SANCTIONED',
      currentReviewerRole: 'DST Program Director',
      reviewComments: 'Recommended with full budget allocation. Excellent alignment with national agriculture mission.',
      approvalHistory: [
        {
          id: 'act-1',
          actorId: 'fac-1',
          actorName: 'Dr. Rajesh Sharma',
          actorRole: 'FACULTY',
          action: 'SUBMITTED',
          comment: 'Application submitted for departmental review.',
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          timestamp: '2025-06-25 10:30:00',
        },
        {
          id: 'act-2',
          actorId: 'hod-1',
          actorName: 'Dr. Suresh Verma',
          actorRole: 'HOD',
          action: 'RECOMMENDED',
          comment: 'Approved by Department Research Committee.',
          previousStatus: 'SUBMITTED',
          newStatus: 'RECOMMENDED',
          timestamp: '2025-06-28 14:15:00',
        },
        {
          id: 'act-3',
          actorId: 'reg-1',
          actorName: 'Dr. P. K. Mehta (Registrar)',
          actorRole: 'ADMIN',
          action: 'APPROVED',
          comment: 'Endorsed for external DST-SERB submission.',
          previousStatus: 'RECOMMENDED',
          newStatus: 'APPROVED',
          timestamp: '2025-07-02 11:00:00',
        },
        {
          id: 'act-4',
          actorId: 'dst-officer',
          actorName: 'DST-SERB Sanction Committee',
          actorRole: 'FUNDING_AGENCY',
          action: 'SANCTIONED',
          comment: 'Grant Sanction Order issued under DST/CRG/2026/001429.',
          previousStatus: 'APPROVED',
          newStatus: 'SANCTIONED',
          timestamp: '2025-08-15 16:45:00',
        },
      ],
      academicYear: '2025-26',
      createdAt: '2025-06-20',
      updatedAt: '2025-08-15',
    },
    {
      id: 'app-2',
      applicationNumber: 'APP-2026-002',
      opportunityId: 'opp-2',
      opportunityTitle: 'SSIP 2.0 Student Prototype & PoC Development Grant',
      grantType: 'SSIP',
      grantingAgency: 'SSIP',
      projectTitle: 'Smart IoT Aquaculture Water Quality & Oxygenation Management Rover',
      projectSummary: 'Autonomous solar-powered floating rover with dissolved oxygen, pH, temperature and ammonia sensors for shrimp farming ponds.',
      objectives: '1. Build floating aquatic sensor node.\n2. Automatic paddle-wheel aerator trigger via LoRa.\n3. Mobile app for aquaculture farmers.',
      expectedOutcomes: '1. Working Rover Prototype\n2. Field tested in 3 ponds in Navsari\n3. Pre-incubated startup company',
      applicantType: 'STUDENT',
      applicantId: 'stu-101',
      applicantName: 'Darshan Varma',
      applicantEmail: 'darshan.varma@student.swarrnim.edu.in',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      facultyMentorName: 'Dr. Rajesh Sharma',
      teamMembers: [
        { name: 'Darshan Varma', role: 'Student Team Lead', enrollmentNo: '210103001' },
        { name: 'Rohan Joshi', role: 'Hardware & IoT Lead', enrollmentNo: '210103042' },
        { name: 'Kavita Patel', role: 'Mobile App Developer', enrollmentNo: '210103088' },
      ],
      linkedStartupName: 'AquaSense IoT Labs',
      requestedAmount: 225000,
      sanctionedAmount: 200000,
      durationMonths: 12,
      budgetBreakdown: [
        { category: 'PROTOTYPE', allocatedAmount: 120000, description: 'Waterproof Hull, Thrusters, Solar Panel & Batteries' },
        { category: 'EQUIPMENT', allocatedAmount: 50000, description: 'Industrial Grade Dissolved Oxygen & pH Probes' },
        { category: 'MATERIALS', allocatedAmount: 30000, description: 'LoRa Gateway & Telemetry Transceivers' },
      ],
      supportingDocuments: ['AquaSense_SSIP_Proposal.pdf', 'Mentor_Letter_Sharma.pdf', 'BOM_Estimate.xlsx'],
      declarationAccepted: true,
      submittedDate: '2025-07-20',
      status: 'SANCTIONED',
      currentReviewerRole: 'SSIP Scrutiny Committee',
      reviewComments: 'Sanctioned ₹2,00,000 for PoC prototype fabrication under SSIP 2.0.',
      approvalHistory: [
        {
          id: 'act-10',
          actorId: 'stu-101',
          actorName: 'Darshan Varma',
          actorRole: 'STUDENT',
          action: 'SUBMITTED',
          comment: 'Submitted SSIP proposal with mentor approval.',
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          timestamp: '2025-07-20 11:30:00',
        },
        {
          id: 'act-11',
          actorId: 'ssip-coord',
          actorName: 'Prof. Jignesh Shah (SSIP Coordinator)',
          actorRole: 'SSIP_CELL',
          action: 'APPROVED',
          comment: 'Approved by University SSIP Scrutiny Board.',
          previousStatus: 'SUBMITTED',
          newStatus: 'SANCTIONED',
          timestamp: '2025-08-05 15:00:00',
        },
      ],
      academicYear: '2025-26',
      createdAt: '2025-07-15',
      updatedAt: '2025-08-05',
    },
    {
      id: 'app-3',
      applicationNumber: 'APP-2026-003',
      opportunityId: 'opp-3',
      opportunityTitle: 'GUJCOST Minor Research & Technological Innovation Scheme',
      grantType: 'GOVERNMENT',
      grantingAgency: 'GUJCOST',
      projectTitle: 'AI-Assisted Retinal Fundus Screening for Early Diabetic Retinopathy Detection in Rural Gujarat',
      projectSummary: 'Portable fundus camera attachment for smartphones with embedded edge-AI classification for rural primary healthcare centers.',
      objectives: '1. Collect 2,000 anonymized fundus images.\n2. Train lightweight Vision Transformer model.\n3. Deploy offline mobile diagnostic app.',
      expectedOutcomes: '1. Diagnostic mobile app\n2. 2 UGC-CARE / Scopus publications\n3. Pilot deployed at 4 PHCs',
      applicantType: 'FACULTY',
      applicantId: 'fac-2',
      applicantName: 'Dr. Priya Shah',
      applicantEmail: 'priya.shah@swarrnim.edu.in',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      facultyMentorName: 'Dr. Priya Shah',
      requestedAmount: 480000,
      sanctionedAmount: 450000,
      durationMonths: 18,
      budgetBreakdown: [
        { category: 'EQUIPMENT', allocatedAmount: 220000, description: 'Handheld Ophthalmic Lens Attachment & Testing Kit' },
        { category: 'SOFTWARE', allocatedAmount: 80000, description: 'Cloud GPU Compute & Annotation Licenses' },
        { category: 'TRAVEL', allocatedAmount: 90000, description: 'Rural Primary Health Center Field Visits' },
        { category: 'PUBLICATION', allocatedAmount: 60000, description: 'Publication & Dissemination' },
      ],
      supportingDocuments: ['GUJCOST_FormA_Priya.pdf', 'Clinical_Advisory_Consent.pdf'],
      declarationAccepted: true,
      submittedDate: '2025-08-10',
      status: 'ACTIVE',
      approvalHistory: [
        {
          id: 'act-20',
          actorId: 'fac-2',
          actorName: 'Dr. Priya Shah',
          actorRole: 'FACULTY',
          action: 'SUBMITTED',
          comment: 'Application submitted.',
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          timestamp: '2025-08-10 09:15:00',
        },
        {
          id: 'act-21',
          actorId: 'gujcost-officer',
          actorName: 'GUJCOST Review Panel',
          actorRole: 'FUNDING_AGENCY',
          action: 'SANCTIONED',
          comment: 'Sanction letter issued for ₹4.50 Lakh.',
          previousStatus: 'SUBMITTED',
          newStatus: 'SANCTIONED',
          timestamp: '2025-09-12 14:00:00',
        },
      ],
      academicYear: '2025-26',
      createdAt: '2025-08-05',
      updatedAt: '2025-09-12',
    },
    {
      id: 'app-4',
      applicationNumber: 'APP-2026-004',
      opportunityId: 'opp-4',
      opportunityTitle: 'SSIU University Vice Chancellor Seed Grant for Interdisciplinary AI',
      grantType: 'INSTITUTIONAL',
      grantingAgency: 'Institutional Seed',
      projectTitle: 'Smart Hydroponic Vertical Farming Nutrient Optimization Using Computer Vision & Edge IoT',
      projectSummary: 'Automatic pH, EC, and liquid fertilizer doser system with plant leaf health analysis.',
      objectives: '1. Fabricate 4-tier vertical hydroponic rack.\n2. Implement closed-loop nutrient dosing algorithm.',
      expectedOutcomes: '1. Functional campus demonstration unit\n2. Research paper on automated urban farming',
      applicantType: 'FACULTY',
      applicantId: 'fac-3',
      applicantName: 'Prof. Ankit Mehta',
      departmentId: 'dept-2',
      departmentName: 'Mechanical Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      facultyMentorName: 'Prof. Ankit Mehta',
      requestedAmount: 250000,
      sanctionedAmount: 250000,
      durationMonths: 12,
      budgetBreakdown: [
        { category: 'PROTOTYPE', allocatedAmount: 150000, description: 'Hydroponic NFT Channels, Pumps & LED Grow Lights' },
        { category: 'EQUIPMENT', allocatedAmount: 70000, description: 'EC & pH Industrial Sensors & Raspberry Pi Compute' },
        { category: 'MATERIALS', allocatedAmount: 30000, description: 'Nutrient Solutions & Rockwool Media' },
      ],
      supportingDocuments: ['Seed_Proposal_Ankit.pdf'],
      declarationAccepted: true,
      submittedDate: '2025-08-25',
      status: 'UNDER_REVIEW',
      approvalHistory: [
        {
          id: 'act-30',
          actorId: 'fac-3',
          actorName: 'Prof. Ankit Mehta',
          actorRole: 'FACULTY',
          action: 'SUBMITTED',
          comment: 'Application submitted for VC Seed Review.',
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          timestamp: '2025-08-25 11:00:00',
        },
      ],
      academicYear: '2025-26',
      createdAt: '2025-08-20',
      updatedAt: '2025-08-25',
    },
    {
      id: 'app-5',
      applicationNumber: 'APP-2026-005',
      opportunityId: 'opp-2',
      opportunityTitle: 'SSIP 2.0 Student Prototype & PoC Development Grant',
      grantType: 'SSIP',
      grantingAgency: 'SSIP',
      projectTitle: 'Smart EV Battery Swapping Station with Predictive Thermal Runaway Detection',
      projectSummary: 'Rapid EV 2-wheeler battery swap kiosk with infrared battery thermography and active liquid cooling.',
      objectives: '1. Fabricate 4-bay swapping kiosk.\n2. Implement predictive thermal alert gateway.',
      expectedOutcomes: '1. Working Station Prototype\n2. 1 Patent application',
      applicantType: 'STUDENT',
      applicantId: 'stu-102',
      applicantName: 'Sneha Patel',
      applicantEmail: 'sneha.patel@student.swarrnim.edu.in',
      departmentId: 'dept-3',
      departmentName: 'Electrical Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      facultyMentorName: 'Prof. Hardik Dave',
      teamMembers: [
        { name: 'Sneha Patel', role: 'Student Lead', enrollmentNo: '210104015' },
        { name: 'Vikram Desai', role: 'Power Electronics', enrollmentNo: '210104033' },
      ],
      requestedAmount: 240000,
      durationMonths: 12,
      budgetBreakdown: [
        { category: 'PROTOTYPE', allocatedAmount: 160000, description: 'Sheet Metal Enclosure, Relays & Swap Mechanism' },
        { category: 'EQUIPMENT', allocatedAmount: 80000, description: 'Li-ion Test Batteries & BMS Modules' },
      ],
      supportingDocuments: ['EV_Swap_Proposal.pdf', 'Mentor_Consent.pdf'],
      declarationAccepted: true,
      submittedDate: '2025-09-02',
      status: 'SUBMITTED',
      approvalHistory: [
        {
          id: 'act-40',
          actorId: 'stu-102',
          actorName: 'Sneha Patel',
          actorRole: 'STUDENT',
          action: 'SUBMITTED',
          comment: 'New SSIP application submitted.',
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          timestamp: '2025-09-02 14:20:00',
        },
      ],
      academicYear: '2025-26',
      createdAt: '2025-08-30',
      updatedAt: '2025-09-02',
    },
  ];

  private sanctions: GrantSanctionItem[] = [
    {
      id: 'san-1',
      sanctionNumber: 'SAN-2026-001',
      applicationId: 'app-1',
      applicationNumber: 'APP-2026-001',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms in Agricultural Soil Health Analysis',
      grantingAgency: 'DST',
      grantType: 'GOVERNMENT',
      sanctionedAmount: 2850000,
      totalReleasedAmount: 1800000,
      totalUtilizedAmount: 1425000,
      remainingAmount: 375000,
      sanctionDate: '2025-08-15',
      projectStartDate: '2025-09-01',
      projectEndDate: '2027-08-31',
      fundingSource: 'DST-SERB Core Research Grant Scheme',
      conditions: 'Annual Progress Report and audited Utilization Certificate required every 12 months.',
      authorizedSignatory: 'Advisor & Head, DST-SERB Division, New Delhi',
      sanctionLetterDocId: 'DOC-SAN-DST-001',
      status: 'ACTIVE',
      academicYear: '2025-26',
    },
    {
      id: 'san-2',
      sanctionNumber: 'SAN-2026-002',
      applicationId: 'app-2',
      applicationNumber: 'APP-2026-002',
      projectTitle: 'Smart IoT Aquaculture Water Quality & Oxygenation Management Rover',
      grantingAgency: 'SSIP',
      grantType: 'SSIP',
      sanctionedAmount: 200000,
      totalReleasedAmount: 150000,
      totalUtilizedAmount: 138000,
      remainingAmount: 12000,
      sanctionDate: '2025-08-05',
      projectStartDate: '2025-08-15',
      projectEndDate: '2026-08-14',
      fundingSource: 'Gujarat SSIP 2.0 Innovation Fund',
      conditions: 'Working physical prototype must be demonstrated at SSIU Annual Innovation Expo.',
      authorizedSignatory: 'Member Secretary, State SSIP Implementation Cell',
      sanctionLetterDocId: 'DOC-SAN-SSIP-002',
      status: 'ACTIVE',
      academicYear: '2025-26',
    },
    {
      id: 'san-3',
      sanctionNumber: 'SAN-2026-003',
      applicationId: 'app-3',
      applicationNumber: 'APP-2026-003',
      projectTitle: 'AI-Assisted Retinal Fundus Screening for Early Diabetic Retinopathy Detection in Rural Gujarat',
      grantingAgency: 'GUJCOST',
      grantType: 'GOVERNMENT',
      sanctionedAmount: 450000,
      totalReleasedAmount: 300000,
      totalUtilizedAmount: 285000,
      remainingAmount: 15000,
      sanctionDate: '2025-09-12',
      projectStartDate: '2025-10-01',
      projectEndDate: '2027-03-31',
      fundingSource: 'GUJCOST Science Promotion Grant',
      conditions: 'Fundus imaging dataset must be preserved for academic non-commercial research use.',
      authorizedSignatory: 'Executive Director, GUJCOST, Gandhinagar',
      sanctionLetterDocId: 'DOC-SAN-GUJCOST-003',
      status: 'ACTIVE',
      academicYear: '2025-26',
    },
  ];

  private disbursements: GrantDisbursementItem[] = [
    {
      id: 'dis-1',
      releaseReference: 'REL-2025-001',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      installmentNumber: 1,
      amount: 1800000,
      disbursementDate: '2025-09-05',
      financeTransactionId: 'FT-DST-2025-09881',
      paymentMode: 'BANK_TRANSFER',
      status: 'RELEASED',
      remarks: 'Year 1 first installment released directly into university dedicated research account.',
      releasedBy: 'Finance & Accounts Office, SSIU',
      createdAt: '2025-09-05',
    },
    {
      id: 'dis-2',
      releaseReference: 'REL-2025-002',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      installmentNumber: 1,
      amount: 150000,
      disbursementDate: '2025-08-20',
      financeTransactionId: 'FT-SSIP-2025-04112',
      paymentMode: 'INTERNAL_LEDGER',
      status: 'RELEASED',
      remarks: 'First installment 75% advance for prototype raw material procurement.',
      releasedBy: 'SSIP Innovation Account Officer',
      createdAt: '2025-08-20',
    },
    {
      id: 'dis-3',
      releaseReference: 'REL-2025-003',
      sanctionId: 'san-3',
      applicationId: 'app-3',
      projectTitle: 'AI-Assisted Retinal Fundus Screening',
      installmentNumber: 1,
      amount: 300000,
      disbursementDate: '2025-10-10',
      financeTransactionId: 'FT-GUJ-2025-08994',
      paymentMode: 'BANK_TRANSFER',
      status: 'RELEASED',
      remarks: 'First installment for ophthalmic testing equipment & compute setup.',
      releasedBy: 'Finance & Accounts Office, SSIU',
      createdAt: '2025-10-10',
    },
  ];

  private milestones: GrantMilestoneItem[] = [
    {
      id: 'mst-1',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      milestoneNumber: 1,
      title: 'Hardware Procurement & Hyperspectral Sensor Benchmarking',
      description: 'Acquisition of multispectral camera, PX4 autopilot kits, and bench calibration.',
      dueDate: '2025-11-30',
      completedDate: '2025-11-20',
      weightagePercentage: 25,
      completionPercentage: 100,
      status: 'COMPLETED',
      evidenceDocUrl: 'DOC-EVIDENCE-M1-DRONE.pdf',
      reviewerComments: 'Hardware inspected and verified in Robotics Lab.',
      verifiedBy: 'Dr. Suresh Verma (HOD)',
      verifiedAt: '2025-11-22',
      createdAt: '2025-09-01',
    },
    {
      id: 'mst-2',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      milestoneNumber: 2,
      title: 'Edge-AI Algorithm Implementation & Sim-to-Real Flight Tests',
      description: 'Deployment of Deep Q-Learning models on NVIDIA Jetson payload for real-time avoidance.',
      dueDate: '2026-03-31',
      completedDate: '2026-03-25',
      weightagePercentage: 35,
      completionPercentage: 100,
      status: 'COMPLETED',
      evidenceDocUrl: 'DOC-EVIDENCE-M2-FLIGHTS.pdf',
      reviewerComments: 'Flight logs confirm 98.4% collision avoidance accuracy.',
      verifiedBy: 'DST Technical Reviewer',
      verifiedAt: '2026-03-28',
      createdAt: '2025-09-01',
    },
    {
      id: 'mst-3',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      milestoneNumber: 3,
      title: 'Multi-Farm Field Trials & Patent Application Filing',
      description: 'Field validation across 50 acres of agricultural land and filing of complete Indian Patent specification.',
      dueDate: '2026-08-31',
      weightagePercentage: 40,
      completionPercentage: 65,
      status: 'IN_PROGRESS',
      evidenceDocUrl: 'DOC-EVIDENCE-M3-INTERIM.pdf',
      createdAt: '2025-09-01',
    },
    {
      id: 'mst-4',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      milestoneNumber: 1,
      title: 'Catamaran Hull Fabrication & Sensor Calibration',
      description: 'Waterproof hull assembly with dissolved oxygen, pH, and temperature telemetry.',
      dueDate: '2025-11-15',
      completedDate: '2025-11-10',
      weightagePercentage: 50,
      completionPercentage: 100,
      status: 'COMPLETED',
      evidenceDocUrl: 'DOC-SSIP-M1-HULL.pdf',
      reviewerComments: 'Demonstrated in university campus test tank.',
      verifiedBy: 'Prof. Jignesh Shah (SSIP)',
      verifiedAt: '2025-11-12',
      createdAt: '2025-08-15',
    },
    {
      id: 'mst-5',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      milestoneNumber: 2,
      title: 'Field Validation in Navsari Shrimp Ponds & Startup Registration',
      description: 'Continuous 72-hour autonomous water monitoring trial and company incorporation.',
      dueDate: '2026-05-30',
      completedDate: '2026-05-20',
      weightagePercentage: 50,
      completionPercentage: 100,
      status: 'COMPLETED',
      evidenceDocUrl: 'DOC-SSIP-M2-SHRIMP-FARM.pdf',
      reviewerComments: 'Trial successfully concluded with AquaSense IoT Labs incorporation certificate.',
      verifiedBy: 'SSIP Scrutiny Committee',
      verifiedAt: '2026-05-25',
      createdAt: '2025-08-15',
    },
    {
      id: 'mst-6',
      sanctionId: 'san-3',
      applicationId: 'app-3',
      projectTitle: 'AI-Assisted Retinal Fundus Screening',
      milestoneNumber: 1,
      title: 'Optical Adapter Prototyping & PHC Coordination',
      description: '3D printed custom smartphone adapter and ethical clearance from health authorities.',
      dueDate: '2026-02-28',
      completedDate: '2026-03-15',
      weightagePercentage: 40,
      completionPercentage: 100,
      status: 'COMPLETED',
      evidenceDocUrl: 'DOC-GUJ-M1-ETHICS.pdf',
      reviewerComments: 'Completed with minor ethical board review delay.',
      verifiedBy: 'Dr. Priya Shah',
      verifiedAt: '2026-03-16',
      createdAt: '2025-10-01',
    },
    {
      id: 'mst-7',
      sanctionId: 'san-3',
      applicationId: 'app-3',
      projectTitle: 'AI-Assisted Retinal Fundus Screening',
      milestoneNumber: 2,
      title: 'Model Training on 2,000 Patient Fundus Scans',
      description: 'Training deep learning CNN & Vision Transformer models with clinical validation.',
      dueDate: '2026-07-31',
      weightagePercentage: 60,
      completionPercentage: 45,
      status: 'DELAYED',
      evidenceDocUrl: 'DOC-GUJ-M2-INTERIM.pdf',
      reviewerComments: 'Data acquisition rate slower than anticipated due to rural PHC camp scheduling.',
      createdAt: '2025-10-01',
    },
  ];

  private expenses: GrantExpenseItem[] = [
    {
      id: 'exp-1',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      category: 'EQUIPMENT',
      description: 'MicaSense RedEdge-P Dual Multispectral Camera Sensor',
      amount: 850000,
      expenseDate: '2025-10-15',
      vendorName: 'TerraDrone India Pvt Ltd',
      invoiceNumber: 'INV-TD-2025-982',
      receiptDocUrl: 'INV-TD-982.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Accounts Officer, SSIU',
      verifiedDate: '2025-10-20',
      submittedBy: 'Dr. Rajesh Sharma',
      createdAt: '2025-10-15',
    },
    {
      id: 'exp-2',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      category: 'EQUIPMENT',
      description: 'NVIDIA Jetson AGX Orin 64GB Developer Kit (2 Units)',
      amount: 420000,
      expenseDate: '2025-10-28',
      vendorName: 'RoboElements Tech Solutions',
      invoiceNumber: 'INV-RE-2025-4122',
      receiptDocUrl: 'INV-RE-4122.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Accounts Officer, SSIU',
      verifiedDate: '2025-11-02',
      submittedBy: 'Dr. Rajesh Sharma',
      createdAt: '2025-10-28',
    },
    {
      id: 'exp-3',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      category: 'PROTOTYPE',
      description: 'Hexacopter Carbon Fiber Frames, Motors, ESCs & Lipo Packs',
      amount: 155000,
      expenseDate: '2025-11-12',
      vendorName: 'AeroCraft Composites',
      invoiceNumber: 'INV-AC-2025-099',
      receiptDocUrl: 'INV-AC-099.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Accounts Officer, SSIU',
      verifiedDate: '2025-11-18',
      submittedBy: 'Dr. Rajesh Sharma',
      createdAt: '2025-11-12',
    },
    {
      id: 'exp-4',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      category: 'PROTOTYPE',
      description: 'Fiberglass Catamaran Hull & Brushless Underwater Thrusters',
      amount: 88000,
      expenseDate: '2025-09-10',
      vendorName: 'MarineTech Components Ahmedabad',
      invoiceNumber: 'INV-MT-2025-104',
      receiptDocUrl: 'INV-MT-104.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'SSIP Coordinator',
      verifiedDate: '2025-09-15',
      submittedBy: 'Darshan Varma',
      createdAt: '2025-09-10',
    },
    {
      id: 'exp-5',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      category: 'EQUIPMENT',
      description: 'Atlas Scientific Industrial Dissolved Oxygen & pH Kits',
      amount: 50000,
      expenseDate: '2025-09-22',
      vendorName: 'SensorHub India',
      invoiceNumber: 'INV-SH-2025-562',
      receiptDocUrl: 'INV-SH-562.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'SSIP Coordinator',
      verifiedDate: '2025-09-28',
      submittedBy: 'Darshan Varma',
      createdAt: '2025-09-22',
    },
    {
      id: 'exp-6',
      sanctionId: 'san-3',
      applicationId: 'app-3',
      projectTitle: 'AI-Assisted Retinal Fundus Screening',
      category: 'EQUIPMENT',
      description: 'Volk 20D & 28D Diagnostic Fundus Ophthalmic Lenses',
      amount: 195000,
      expenseDate: '2025-11-05',
      vendorName: 'OptiCare Medical Instruments',
      invoiceNumber: 'INV-OPTI-2025-883',
      receiptDocUrl: 'INV-OPTI-883.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Accounts Officer, SSIU',
      verifiedDate: '2025-11-10',
      submittedBy: 'Dr. Priya Shah',
      createdAt: '2025-11-05',
    },
    {
      id: 'exp-7',
      sanctionId: 'san-3',
      applicationId: 'app-3',
      projectTitle: 'AI-Assisted Retinal Fundus Screening',
      category: 'SOFTWARE',
      description: 'AWS GPU Cloud Compute Instance Credits (6 Months)',
      amount: 90000,
      expenseDate: '2025-12-01',
      vendorName: 'Amazon Web Services India',
      invoiceNumber: 'INV-AWS-2025-77112',
      receiptDocUrl: 'INV-AWS-77112.pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Accounts Officer, SSIU',
      verifiedDate: '2025-12-05',
      submittedBy: 'Dr. Priya Shah',
      createdAt: '2025-12-01',
    },
  ];

  private documents: GrantDocumentItem[] = [
    {
      id: 'doc-1',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      title: 'DST-SERB Formal Sanction Letter Order',
      documentType: 'SANCTION_LETTER',
      fileUrl: 'DST_SERB_Sanction_Order_2025_001429.pdf',
      fileSize: '1.4 MB',
      uploadedBy: 'Dr. Rajesh Sharma',
      uploadedRole: 'FACULTY',
      uploadedAt: '2025-08-16',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'doc-2',
      sanctionId: 'san-1',
      applicationId: 'app-1',
      projectTitle: 'Deep Reinforcement Learning for Autonomous Drone Swarms',
      title: 'Year 1 Statement of Expenditure & Utilization Certificate (UC)',
      documentType: 'UTILIZATION_CERTIFICATE',
      fileUrl: 'DST_Year1_Audited_UC_SOE.pdf',
      fileSize: '2.8 MB',
      uploadedBy: 'Accounts Office, SSIU',
      uploadedRole: 'ADMIN',
      uploadedAt: '2026-04-10',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'doc-3',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      title: 'Gujarat SSIP 2.0 Sanction Approval Certificate',
      documentType: 'SANCTION_LETTER',
      fileUrl: 'SSIP_2_Sanction_Certificate_AquaSense.pdf',
      fileSize: '890 KB',
      uploadedBy: 'SSIP Coordinator',
      uploadedRole: 'SSIP_CELL',
      uploadedAt: '2025-08-08',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'doc-4',
      sanctionId: 'san-2',
      applicationId: 'app-2',
      projectTitle: 'Smart IoT Aquaculture Water Quality Rover',
      title: 'AquaSense IoT Labs Incorporation Certificate (MCA)',
      documentType: 'OTHER',
      fileUrl: 'AquaSense_MCA_Incorporation.pdf',
      fileSize: '650 KB',
      uploadedBy: 'Darshan Varma',
      uploadedRole: 'STUDENT',
      uploadedAt: '2026-05-22',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'doc-5',
      sanctionId: 'san-3',
      applicationId: 'app-3',
      projectTitle: 'AI-Assisted Retinal Fundus Screening',
      title: 'GUJCOST Project Sanction & Terms of Reference',
      documentType: 'SANCTION_LETTER',
      fileUrl: 'GUJCOST_Sanction_Priya_Shah.pdf',
      fileSize: '1.1 MB',
      uploadedBy: 'Dr. Priya Shah',
      uploadedRole: 'FACULTY',
      uploadedAt: '2025-09-15',
      verificationStatus: 'VERIFIED',
    },
  ];

  private ssipProjects: SSIPProjectItem[] = [
    {
      id: 'ssip-1',
      projectCode: 'SSIP-2026-001',
      title: 'Smart IoT Aquaculture Water Quality & Oxygenation Management Rover',
      description: 'Autonomous floating rover with multi-parameter water analysis & automated aerator triggers.',
      studentLeadId: 'stu-101',
      studentLeadName: 'Darshan Varma',
      studentEnrollment: '210103001',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      facultyMentorName: 'Dr. Rajesh Sharma',
      startupName: 'AquaSense IoT Labs',
      schemeName: 'SSIP 2.0 Policy (Govt of Gujarat)',
      sanctionedAmount: 200000,
      releasedAmount: 150000,
      utilizedAmount: 138000,
      remainingAmount: 12000,
      milestoneStage: 'STARTUP_INCORPORATED',
      status: 'ACTIVE',
      startDate: '2025-08-15',
      endDate: '2026-08-14',
      academicYear: '2025-26',
      createdAt: '2025-08-05',
    },
    {
      id: 'ssip-2',
      projectCode: 'SSIP-2026-002',
      title: 'AI Smart Exoskeleton for Upper Limb Rehabilitation',
      description: 'Pneumatic wearable robotic sleeve for stroke patient post-operative physical therapy.',
      studentLeadId: 'stu-103',
      studentLeadName: 'Karan Dave',
      studentEnrollment: '210102018',
      departmentId: 'dept-4',
      departmentName: 'Biomedical & Mechanical',
      facultyMentorName: 'Dr. Hiren Patel',
      startupName: 'NeuroFlex Robotics',
      schemeName: 'SSIP 2.0 Policy (Govt of Gujarat)',
      sanctionedAmount: 220000,
      releasedAmount: 180000,
      utilizedAmount: 165000,
      remainingAmount: 15000,
      milestoneStage: 'PROTOTYPE',
      status: 'ACTIVE',
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      academicYear: '2025-26',
      createdAt: '2025-06-20',
    },
    {
      id: 'ssip-3',
      projectCode: 'SSIP-2026-003',
      title: 'Biodegradable Agro-Waste Composite Packaging Material',
      description: 'Single-use plastic replacement derived from rice straw and sugarcane bagasse fibers.',
      studentLeadId: 'stu-104',
      studentLeadName: 'Riya Shah',
      studentEnrollment: '210105009',
      departmentId: 'dept-5',
      departmentName: 'Chemical Engineering',
      facultyMentorName: 'Prof. Manish Mehta',
      startupName: 'BioStraw EcoPack',
      schemeName: 'SSIP 2.0 Policy (Govt of Gujarat)',
      sanctionedAmount: 180000,
      releasedAmount: 120000,
      utilizedAmount: 110000,
      remainingAmount: 10000,
      milestoneStage: 'PILOT_TEST',
      status: 'ACTIVE',
      startDate: '2025-09-01',
      endDate: '2026-08-31',
      academicYear: '2025-26',
      createdAt: '2025-08-20',
    },
  ];

  // --- QUERY & FILTER METHODS ---

  public getOpportunities(filters?: Partial<GrantFilterState>): GrantOpportunityItem[] {
    let list = [...this.opportunities];
    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      list = list.filter(o => o.academicYear === filters.academicYear);
    }
    if (filters?.grantType && filters.grantType !== 'ALL') {
      list = list.filter(o => o.grantType === filters.grantType);
    }
    if (filters?.grantingAgency && filters.grantingAgency !== 'ALL') {
      list = list.filter(o => o.grantingAgency === filters.grantingAgency);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(o => o.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(o => o.title.toLowerCase().includes(q) || o.grantingAgency.toLowerCase().includes(q) || o.description.toLowerCase().includes(q));
    }
    return list;
  }

  public getApplications(filters?: Partial<GrantFilterState>, role?: string, user?: any): GrantApplicationItem[] {
    let list = [...this.applications];

    // RBAC Filtering
    if (role === 'STUDENT' && user?.id) {
      list = list.filter(a => a.applicantId === user.id || a.applicantName.toLowerCase().includes((user.name || '').toLowerCase()));
    } else if (role === 'FACULTY' && user?.id) {
      list = list.filter(a => a.applicantId === user.id || a.facultyMentorName?.toLowerCase().includes((user.name || '').toLowerCase()));
    } else if (role === 'HOD' && user?.departmentId) {
      list = list.filter(a => a.departmentId === user.departmentId || a.departmentName.toLowerCase().includes((user.department || '').toLowerCase()));
    }

    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      list = list.filter(a => a.academicYear === filters.academicYear);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      list = list.filter(a => a.departmentId === filters.departmentId);
    }
    if (filters?.grantType && filters.grantType !== 'ALL') {
      list = list.filter(a => a.grantType === filters.grantType);
    }
    if (filters?.grantingAgency && filters.grantingAgency !== 'ALL') {
      list = list.filter(a => a.grantingAgency === filters.grantingAgency);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters?.applicantType && filters.applicantType !== 'ALL') {
      list = list.filter(a => a.applicantType === filters.applicantType);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(a => a.projectTitle.toLowerCase().includes(q) || a.applicantName.toLowerCase().includes(q) || a.applicationNumber.toLowerCase().includes(q));
    }

    return list;
  }

  public getSanctions(filters?: Partial<GrantFilterState>): GrantSanctionItem[] {
    let list = [...this.sanctions];
    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      list = list.filter(s => s.academicYear === filters.academicYear);
    }
    if (filters?.grantType && filters.grantType !== 'ALL') {
      list = list.filter(s => s.grantType === filters.grantType);
    }
    if (filters?.grantingAgency && filters.grantingAgency !== 'ALL') {
      list = list.filter(s => s.grantingAgency === filters.grantingAgency);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(s => s.projectTitle.toLowerCase().includes(q) || s.sanctionNumber.toLowerCase().includes(q) || s.grantingAgency.toLowerCase().includes(q));
    }
    return list;
  }

  public getDisbursements(filters?: Partial<GrantFilterState>): GrantDisbursementItem[] {
    let list = [...this.disbursements];
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(d => d.projectTitle.toLowerCase().includes(q) || d.releaseReference.toLowerCase().includes(q));
    }
    return list;
  }

  public getMilestones(filters?: Partial<GrantFilterState>): GrantMilestoneItem[] {
    let list = [...this.milestones];
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(m => m.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q) || m.projectTitle.toLowerCase().includes(q));
    }
    return list;
  }

  public getExpenses(filters?: Partial<GrantFilterState>): GrantExpenseItem[] {
    let list = [...this.expenses];
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(e => e.description.toLowerCase().includes(q) || e.projectTitle.toLowerCase().includes(q) || (e.vendorName || '').toLowerCase().includes(q));
    }
    return list;
  }

  public getDocuments(filters?: Partial<GrantFilterState>): GrantDocumentItem[] {
    let list = [...this.documents];
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q) || (d.projectTitle || '').toLowerCase().includes(q));
    }
    return list;
  }

  public getSSIPProjects(filters?: Partial<GrantFilterState>): SSIPProjectItem[] {
    let list = [...this.ssipProjects];
    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      list = list.filter(s => s.academicYear === filters.academicYear);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      list = list.filter(s => s.departmentId === filters.departmentId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(s => s.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.studentLeadName.toLowerCase().includes(q) || s.projectCode.toLowerCase().includes(q));
    }
    return list;
  }

  // --- WORKFLOW MUTATIONS ---

  public createOpportunity(item: Omit<GrantOpportunityItem, 'id' | 'opportunityCode' | 'createdAt'>): GrantOpportunityItem {
    const code = `OPP-${new Date().getFullYear()}-${String(this.opportunities.length + 1).padStart(3, '0')}`;
    const opp: GrantOpportunityItem = {
      ...item,
      id: `opp-${Date.now()}`,
      opportunityCode: code,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.opportunities.unshift(opp);
    return opp;
  }

  public submitApplication(item: Omit<GrantApplicationItem, 'id' | 'applicationNumber' | 'submittedDate' | 'status' | 'approvalHistory' | 'createdAt' | 'updatedAt'>, actorUser?: any): GrantApplicationItem {
    const appNum = `APP-${new Date().getFullYear()}-${String(this.applications.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];
    const newApp: GrantApplicationItem = {
      ...item,
      id: `app-${Date.now()}`,
      applicationNumber: appNum,
      submittedDate: now,
      status: 'SUBMITTED',
      approvalHistory: [
        {
          id: `act-${Date.now()}`,
          actorId: actorUser?.id || item.applicantId,
          actorName: actorUser?.name || item.applicantName,
          actorRole: actorUser?.role || (item.applicantType === 'STUDENT' ? 'STUDENT' : 'FACULTY'),
          action: 'SUBMITTED',
          comment: 'Application submitted for scrutiny.',
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.applications.unshift(newApp);
    return newApp;
  }

  public transitionApplicationStatus(
    appId: string,
    action: string,
    newStatus: GrantApplicationStatus,
    comment: string,
    actorUser?: any
  ): GrantApplicationItem {
    const app = this.applications.find(a => a.id === appId);
    if (!app) throw new Error(`Application ${appId} not found`);

    const prevStatus = app.status;
    app.status = newStatus;
    app.updatedAt = new Date().toISOString().split('T')[0];
    app.reviewComments = comment;

    app.approvalHistory.push({
      id: `act-${Date.now()}`,
      actorId: actorUser?.id || 'officer-01',
      actorName: actorUser?.name || 'Authorized Reviewer',
      actorRole: actorUser?.role || 'REVIEW_PANEL',
      action,
      comment,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });

    // If Sanctioned, create sanction and initial SSIP project if applicable
    if (newStatus === 'SANCTIONED' && !this.sanctions.some(s => s.applicationId === appId)) {
      this.createSanctionFromApplication(app, app.sanctionedAmount || app.requestedAmount, actorUser);
    }

    return app;
  }

  public createSanctionFromApplication(app: GrantApplicationItem, amount: number, actorUser?: any): GrantSanctionItem {
    const sanctionNumber = `SAN-${new Date().getFullYear()}-${String(this.sanctions.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (app.durationMonths || 12));

    const sanction: GrantSanctionItem = {
      id: `san-${Date.now()}`,
      sanctionNumber,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      projectTitle: app.projectTitle,
      grantingAgency: app.grantingAgency,
      grantType: app.grantType,
      sanctionedAmount: amount,
      totalReleasedAmount: 0,
      totalUtilizedAmount: 0,
      remainingAmount: amount,
      sanctionDate: now,
      projectStartDate: now,
      projectEndDate: endDate.toISOString().split('T')[0],
      fundingSource: `${app.grantingAgency} Grants Pool`,
      conditions: 'Quarterly Progress Report and audited Utilization Certificates are mandatory.',
      authorizedSignatory: actorUser?.name || 'Registrar & Dean Research, SSIU',
      status: 'ACTIVE',
      academicYear: app.academicYear,
    };

    this.sanctions.unshift(sanction);

    // If SSIP type, create SSIP Project Record
    if (app.grantType === 'SSIP') {
      const ssipCode = `SSIP-${new Date().getFullYear()}-${String(this.ssipProjects.length + 1).padStart(3, '0')}`;
      this.ssipProjects.unshift({
        id: `ssip-${Date.now()}`,
        projectCode: ssipCode,
        title: app.projectTitle,
        description: app.projectSummary,
        studentLeadId: app.applicantId,
        studentLeadName: app.applicantName,
        departmentId: app.departmentId,
        departmentName: app.departmentName,
        facultyMentorName: app.facultyMentorName,
        startupName: app.linkedStartupName,
        schemeName: 'SSIP 2.0 Policy (Govt of Gujarat)',
        sanctionedAmount: amount,
        releasedAmount: 0,
        utilizedAmount: 0,
        remainingAmount: amount,
        milestoneStage: 'PROOF_OF_CONCEPT',
        status: 'ACTIVE',
        startDate: now,
        academicYear: app.academicYear,
        createdAt: now,
      });
    }

    return sanction;
  }

  public recordDisbursement(item: Omit<GrantDisbursementItem, 'id' | 'releaseReference' | 'createdAt'>): GrantDisbursementItem {
    const sanction = this.sanctions.find(s => s.id === item.sanctionId);
    if (!sanction) throw new Error('Sanction not found.');

    const relRef = `REL-${new Date().getFullYear()}-${String(this.disbursements.length + 1).padStart(3, '0')}`;
    const dis: GrantDisbursementItem = {
      ...item,
      id: `dis-${Date.now()}`,
      releaseReference: relRef,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.disbursements.unshift(dis);

    // Update Sanction released amount
    sanction.totalReleasedAmount += item.amount;
    sanction.remainingAmount = sanction.totalReleasedAmount - sanction.totalUtilizedAmount;

    // Update SSIP project if matching
    const ssip = this.ssipProjects.find(s => s.title === sanction.projectTitle);
    if (ssip) {
      ssip.releasedAmount += item.amount;
      ssip.remainingAmount = ssip.releasedAmount - ssip.utilizedAmount;
    }

    return dis;
  }

  public recordExpense(item: Omit<GrantExpenseItem, 'id' | 'verificationStatus' | 'createdAt'>): GrantExpenseItem {
    const sanction = this.sanctions.find(s => s.id === item.sanctionId);
    if (sanction && sanction.totalUtilizedAmount + item.amount > sanction.totalReleasedAmount) {
      throw new Error(`Expense exceeds released funds! Released: ₹${sanction.totalReleasedAmount.toLocaleString('en-IN')}, Already Utilized: ₹${sanction.totalUtilizedAmount.toLocaleString('en-IN')}`);
    }

    const exp: GrantExpenseItem = {
      ...item,
      id: `exp-${Date.now()}`,
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Finance & Accounts Office',
      verifiedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.expenses.unshift(exp);

    if (sanction) {
      sanction.totalUtilizedAmount += item.amount;
      sanction.remainingAmount = sanction.totalReleasedAmount - sanction.totalUtilizedAmount;
    }

    const ssip = this.ssipProjects.find(s => s.title === item.projectTitle);
    if (ssip) {
      ssip.utilizedAmount += item.amount;
      ssip.remainingAmount = ssip.releasedAmount - ssip.utilizedAmount;
    }

    return exp;
  }

  public addMilestone(item: Omit<GrantMilestoneItem, 'id' | 'createdAt'>): GrantMilestoneItem {
    const mst: GrantMilestoneItem = {
      ...item,
      id: `mst-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.milestones.unshift(mst);
    return mst;
  }

  public updateMilestoneProgress(milestoneId: string, completionPercentage: number, status: any, evidenceDocUrl?: string): GrantMilestoneItem {
    const mst = this.milestones.find(m => m.id === milestoneId);
    if (!mst) throw new Error('Milestone not found');
    mst.completionPercentage = completionPercentage;
    mst.status = status;
    if (completionPercentage === 100) {
      mst.completedDate = new Date().toISOString().split('T')[0];
    }
    if (evidenceDocUrl) mst.evidenceDocUrl = evidenceDocUrl;
    return mst;
  }

  public uploadDocument(item: Omit<GrantDocumentItem, 'id' | 'uploadedAt'>): GrantDocumentItem {
    const doc: GrantDocumentItem = {
      ...item,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      verificationStatus: 'VERIFIED',
    };
    this.documents.unshift(doc);
    return doc;
  }

  // --- LIVE METRICS & 3-YEAR TRAJECTORY ---

  public getMetrics(filters?: Partial<GrantFilterState>, role?: string, user?: any): GrantMetricsData {
    const opps = this.getOpportunities(filters);
    const apps = this.getApplications(filters, role, user);
    const sans = this.getSanctions(filters);
    const ssips = this.getSSIPProjects(filters);
    const msts = this.getMilestones(filters);
    const docs = this.getDocuments(filters);

    const totalSanctionedAmount = sans.reduce((sum, s) => sum + s.sanctionedAmount, 0);
    const totalReleasedAmount = sans.reduce((sum, s) => sum + s.totalReleasedAmount, 0);
    const totalUtilizedAmount = sans.reduce((sum, s) => sum + s.totalUtilizedAmount, 0);
    const totalRemainingBalance = totalReleasedAmount - totalUtilizedAmount;
    const overallUtilizationPercentage = totalReleasedAmount > 0 ? Number(((totalUtilizedAmount / totalReleasedAmount) * 100).toFixed(1)) : 0;

    const totalSSIPFundingSanctioned = ssips.reduce((sum, s) => sum + s.sanctionedAmount, 0);
    const totalSSIPDisbursed = ssips.reduce((sum, s) => sum + s.releasedAmount, 0);

    const delayedMilestones = msts.filter(m => m.status === 'DELAYED' || (new Date(m.dueDate) < new Date() && m.completionPercentage < 100)).length;

    const agencyBreakdown: Record<string, { count: number; sanctionedAmount: number; releasedAmount: number }> = {};
    sans.forEach(s => {
      if (!agencyBreakdown[s.grantingAgency]) {
        agencyBreakdown[s.grantingAgency] = { count: 0, sanctionedAmount: 0, releasedAmount: 0 };
      }
      agencyBreakdown[s.grantingAgency].count += 1;
      agencyBreakdown[s.grantingAgency].sanctionedAmount += s.sanctionedAmount;
      agencyBreakdown[s.grantingAgency].releasedAmount += s.totalReleasedAmount;
    });

    const grantTypeBreakdown: Record<string, { count: number; sanctionedAmount: number }> = {};
    sans.forEach(s => {
      if (!grantTypeBreakdown[s.grantType]) {
        grantTypeBreakdown[s.grantType] = { count: 0, sanctionedAmount: 0 };
      }
      grantTypeBreakdown[s.grantType].count += 1;
      grantTypeBreakdown[s.grantType].sanctionedAmount += s.sanctionedAmount;
    });

    const departmentBreakdown: Record<string, { count: number; sanctionedAmount: number; ssipCount: number }> = {};
    apps.forEach(a => {
      if (!departmentBreakdown[a.departmentName]) {
        departmentBreakdown[a.departmentName] = { count: 0, sanctionedAmount: 0, ssipCount: 0 };
      }
      departmentBreakdown[a.departmentName].count += 1;
      departmentBreakdown[a.departmentName].sanctionedAmount += a.sanctionedAmount || 0;
      if (a.grantType === 'SSIP') {
        departmentBreakdown[a.departmentName].ssipCount += 1;
      }
    });

    const yearlyTrajectory = [
      { academicYear: '2023-24', grantsCount: 4, sanctionedAmount: 1800000, utilizedAmount: 1650000, ssipCount: 2 },
      { academicYear: '2024-25', grantsCount: 6, sanctionedAmount: 2600000, utilizedAmount: 2400000, ssipCount: 3 },
      { academicYear: '2025-26', grantsCount: sans.length || 3, sanctionedAmount: totalSanctionedAmount, utilizedAmount: totalUtilizedAmount, ssipCount: ssips.length || 3 },
    ];

    return {
      totalOpportunities: opps.length,
      openOpportunities: opps.filter(o => o.status === 'OPEN').length,
      totalApplications: apps.length,
      pendingApplications: apps.filter(a => ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'RECOMMENDED'].includes(a.status)).length,
      approvedApplications: apps.filter(a => a.status === 'APPROVED' || a.status === 'SANCTIONED').length,
      sanctionedApplications: apps.filter(a => a.status === 'SANCTIONED').length,
      rejectedApplications: apps.filter(a => a.status === 'REJECTED').length,
      totalSanctions: sans.length,
      activeSanctions: sans.filter(s => s.status === 'ACTIVE').length,
      totalSanctionedAmount,
      totalReleasedAmount,
      totalUtilizedAmount,
      totalRemainingBalance,
      overallUtilizationPercentage,
      totalSSIPProjects: ssips.length,
      activeSSIPProjects: ssips.filter(s => s.status === 'ACTIVE').length,
      totalSSIPFundingSanctioned,
      totalSSIPDisbursed,
      totalMilestones: msts.length,
      completedMilestones: msts.filter(m => m.status === 'COMPLETED').length,
      delayedMilestones,
      totalDocuments: docs.length,
      agencyBreakdown,
      grantTypeBreakdown,
      departmentBreakdown,
      yearlyTrajectory,
    };
  }

  // --- NAAC / IQAC EVIDENCE SUMMARY ---

  public getNaacSummary(filters?: Partial<GrantFilterState>): GrantNaacSummary {
    const sans = this.getSanctions(filters);
    const ssips = this.getSSIPProjects(filters);
    const docs = this.getDocuments(filters);

    const totalSanctionedINR = sans.reduce((sum, s) => sum + s.sanctionedAmount, 0);
    const governmentGrantsINR = sans.filter(s => s.grantType === 'GOVERNMENT' || s.grantType === 'RESEARCH').reduce((sum, s) => sum + s.sanctionedAmount, 0);
    const nonGovernmentGrantsINR = sans.filter(s => s.grantType === 'INDUSTRY' || s.grantType === 'INSTITUTIONAL').reduce((sum, s) => sum + s.sanctionedAmount, 0);
    const ssipGrantsINR = ssips.reduce((sum, s) => sum + s.sanctionedAmount, 0);
    const industryGrantsINR = sans.filter(s => s.grantType === 'INDUSTRY').reduce((sum, s) => sum + s.sanctionedAmount, 0);

    return {
      criterion: 'Criterion 3: Research, Innovations and Extension',
      criterionTitle: 'Resource Mobilization for Research & Innovation Ecosystem',
      metric: 'Metric 3.1.1 & 3.2.1',
      metricDescription: 'Total grants received from Government and non-governmental agencies for research and SSIP projects',
      totalFundedProjects: sans.length + ssips.length,
      totalSanctionedINR,
      governmentGrantsINR,
      nonGovernmentGrantsINR,
      ssipGrantsINR,
      industryGrantsINR,
      averageGrantPerFacultyINR: Math.round(totalSanctionedINR / 25),
      totalFacultyBeneficiaries: 12,
      totalStudentBeneficiaries: 18,
      evidenceDocumentCount: docs.length,
      complianceStatus: '100% Verified & Documented for NAAC RAF Assessment Cycle',
    };
  }

  // --- 15-SHEET EXCEL WORKBOOK EXPORT ---

  public exportFullGrantsWorkbook(filters?: Partial<GrantFilterState>, role?: string, user?: any) {
    const wb = XLSX.utils.book_new();

    const opps = this.getOpportunities(filters);
    const apps = this.getApplications(filters, role, user);
    const sans = this.getSanctions(filters);
    const diss = this.getDisbursements(filters);
    const msts = this.getMilestones(filters);
    const exps = this.getExpenses(filters);
    const docs = this.getDocuments(filters);
    const ssips = this.getSSIPProjects(filters);
    const metrics = this.getMetrics(filters, role, user);
    const naac = this.getNaacSummary(filters);

    // 1. Executive Summary Sheet
    const summaryData = [
      ['SSIU ERP — GRANTS & SSIP MANAGEMENT EXECUTIVE REPORT'],
      ['Generated At', new Date().toLocaleString('en-IN')],
      ['Academic Year', filters?.academicYear || 'All Academic Years'],
      [''],
      ['KEY FINANCIAL INDICATORS', 'VALUE'],
      ['Total Grant Opportunities', metrics.totalOpportunities],
      ['Total Grant Applications', metrics.totalApplications],
      ['Approved & Sanctioned Applications', metrics.approvedApplications],
      ['Total Sanctioned Funding (INR)', metrics.totalSanctionedAmount],
      ['Total Released Funding (INR)', metrics.totalReleasedAmount],
      ['Total Verified Expenditure (INR)', metrics.totalUtilizedAmount],
      ['Remaining Fund Balance (INR)', metrics.totalRemainingBalance],
      ['Overall Fund Utilization %', `${metrics.overallUtilizationPercentage}%`],
      ['Total SSIP Student Projects', metrics.totalSSIPProjects],
      ['SSIP Sanctioned Funding (INR)', metrics.totalSSIPFundingSanctioned],
      ['SSIP Released Amount (INR)', metrics.totalSSIPDisbursed],
      ['Total Milestones Tracked', metrics.totalMilestones],
      ['Completed Milestones', metrics.completedMilestones],
      ['Delayed Milestones', metrics.delayedMilestones],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Executive_Summary');

    // 2. Opportunities Sheet
    const oppsData = opps.map(o => ({
      'Opportunity Code': o.opportunityCode,
      'Title': o.title,
      'Agency': o.grantingAgency,
      'Type': o.grantType,
      'Audience': o.targetAudience,
      'Opening Date': o.openingDate,
      'Closing Date': o.closingDate,
      'Min Funding (₹)': o.minFundingAmount,
      'Max Funding (₹)': o.maxFundingAmount,
      'Status': o.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(oppsData), 'Grant_Opportunities');

    // 3. Applications Sheet
    const appsData = apps.map(a => ({
      'Application Number': a.applicationNumber,
      'Project Title': a.projectTitle,
      'Applicant': a.applicantName,
      'Type': a.applicantType,
      'Department': a.departmentName,
      'Agency': a.grantingAgency,
      'Requested (₹)': a.requestedAmount,
      'Sanctioned (₹)': a.sanctionedAmount || 0,
      'Status': a.status,
      'Submitted Date': a.submittedDate,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(appsData), 'Grant_Applications');

    // 4. Sanctions Sheet
    const sansData = sans.map(s => ({
      'Sanction Number': s.sanctionNumber,
      'Application Number': s.applicationNumber,
      'Project Title': s.projectTitle,
      'Agency': s.grantingAgency,
      'Grant Type': s.grantType,
      'Sanctioned Amount (₹)': s.sanctionedAmount,
      'Released Amount (₹)': s.totalReleasedAmount,
      'Utilized Amount (₹)': s.totalUtilizedAmount,
      'Remaining (₹)': s.remainingAmount,
      'Sanction Date': s.sanctionDate,
      'End Date': s.projectEndDate,
      'Status': s.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sansData), 'Grant_Sanctions');

    // 5. Disbursements Sheet
    const dissData = diss.map(d => ({
      'Release Reference': d.releaseReference,
      'Project Title': d.projectTitle,
      'Installment #': d.installmentNumber,
      'Amount (₹)': d.amount,
      'Disbursement Date': d.disbursementDate,
      'Transaction ID': d.financeTransactionId || '-',
      'Payment Mode': d.paymentMode,
      'Status': d.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dissData), 'Disbursements');

    // 6. Milestones Sheet
    const mstsData = msts.map(m => ({
      'Project Title': m.projectTitle,
      'Milestone #': m.milestoneNumber,
      'Title': m.title,
      'Due Date': m.dueDate,
      'Completed Date': m.completedDate || '-',
      'Weightage %': `${m.weightagePercentage}%`,
      'Completion %': `${m.completionPercentage}%`,
      'Status': m.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mstsData), 'Milestones');

    // 7. Expenses Sheet
    const expsData = exps.map(e => ({
      'Project Title': e.projectTitle,
      'Category': e.category,
      'Description': e.description,
      'Amount (₹)': e.amount,
      'Expense Date': e.expenseDate,
      'Vendor': e.vendorName || '-',
      'Invoice #': e.invoiceNumber || '-',
      'Verification Status': e.verificationStatus,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expsData), 'Expenses_Utilization');

    // 8. SSIP Projects Sheet
    const ssipsData = ssips.map(s => ({
      'Project Code': s.projectCode,
      'Project Title': s.title,
      'Student Lead': s.studentLeadName,
      'Department': s.departmentName,
      'Mentor': s.facultyMentorName || '-',
      'Startup': s.startupName || '-',
      'Sanctioned (₹)': s.sanctionedAmount,
      'Released (₹)': s.releasedAmount,
      'Utilized (₹)': s.utilizedAmount,
      'Stage': s.milestoneStage,
      'Status': s.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ssipsData), 'SSIP_Projects');

    // 9. Documents Sheet
    const docsData = docs.map(d => ({
      'Document Title': d.title,
      'Type': d.documentType,
      'File': d.fileUrl,
      'Uploaded By': d.uploadedBy,
      'Uploaded At': d.uploadedAt,
      'Status': d.verificationStatus || 'VERIFIED',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docsData), 'Documents_Repository');

    // 10. NAAC Criterion 3 Evidence Sheet
    const naacData = [
      ['NAAC / IQAC CRITERION 3 EVIDENCE DOSSIER'],
      ['Criterion', naac.criterion],
      ['Title', naac.criterionTitle],
      ['Metric Reference', naac.metric],
      ['Description', naac.metricDescription],
      ['Total Funded Projects', naac.totalFundedProjects],
      ['Total Sanctioned Grants (INR)', `₹${naac.totalSanctionedINR.toLocaleString('en-IN')}`],
      ['Government Grants (INR)', `₹${naac.governmentGrantsINR.toLocaleString('en-IN')}`],
      ['Non-Government Grants (INR)', `₹${naac.nonGovernmentGrantsINR.toLocaleString('en-IN')}`],
      ['SSIP Grants (INR)', `₹${naac.ssipGrantsINR.toLocaleString('en-IN')}`],
      ['Industry Grants (INR)', `₹${naac.industryGrantsINR.toLocaleString('en-IN')}`],
      ['Average Grant Per Faculty (INR)', `₹${naac.averageGrantPerFacultyINR.toLocaleString('en-IN')}`],
      ['Compliance Status', naac.complianceStatus],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(naacData), 'NAAC_IQAC_Criterion_3');

    // Trigger download
    const fileName = `SSIU_Grants_SSIP_Comprehensive_Report_${filters?.academicYear || 'All_Years'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}

export const grantsManagementService = new GrantsManagementService();
export default grantsManagementService;
