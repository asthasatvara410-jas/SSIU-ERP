import * as XLSX from 'xlsx';
import {
  ResearchProjectItem,
  PublicationItem,
  PatentIprItem,
  ResearchGrantItem,
  ResearchScholarItem,
  ConsultancyProjectItem,
  ConferenceRecordItem,
  BookChapterItem,
  ResearchAwardItem,
  ResearchFilterState,
  ResearchMetricsData,
  ResearchNaacSummary
} from '../types/research';

const STORAGE_KEY_PREFIX = 'ssiu_research_';

// Initial Mock Seed Data
const initialProjects: ResearchProjectItem[] = [
  {
    id: 'prj-001',
    projectCode: 'PRJ-2026-001',
    title: 'AI-Driven Distributed Edge Computing for Smart Campus Energy Management',
    principalInvestigatorId: 'user-faculty-1',
    principalInvestigatorName: 'Dr. Rajesh Sharma',
    coInvestigators: ['Prof. Priya Patel', 'Dr. Amit Trivedi'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    instituteId: 'inst-1',
    instituteName: 'Swarrnim Institute of Technology',
    researchArea: 'Artificial Intelligence & IoT',
    fundingAgency: 'DST (Department of Science & Technology)',
    projectType: 'SPONSORED',
    startDate: '2025-07-01',
    endDate: '2027-06-30',
    sanctionedAmount: 2850000,
    utilizedAmount: 1420000,
    remainingAmount: 1430000,
    status: 'ACTIVE',
    approvalDate: '2025-06-15',
    description: 'Development of intelligent edge node controllers to minimize peak power draw across campus facilities.',
    keywords: ['Edge Computing', 'Deep Learning', 'Smart Grid', 'IoT Sensors'],
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'prj-002',
    projectCode: 'PRJ-2026-002',
    title: 'Low-Latency Blockchain Consensus for Multi-Tenant Health Records',
    principalInvestigatorId: 'user-hod-1',
    principalInvestigatorName: 'Prof. Priya Patel',
    coInvestigators: ['Dr. Rajesh Sharma'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    instituteId: 'inst-1',
    instituteName: 'Swarrnim Institute of Technology',
    researchArea: 'Cybersecurity & Blockchain',
    fundingAgency: 'GUJCOST',
    projectType: 'SPONSORED',
    startDate: '2024-08-01',
    endDate: '2026-07-31',
    sanctionedAmount: 1200000,
    utilizedAmount: 1100000,
    remainingAmount: 100000,
    status: 'ACTIVE',
    approvalDate: '2024-07-20',
    description: 'Privacy-preserving cryptographic protocol for hospital information sharing with zero-knowledge proofs.',
    keywords: ['Blockchain', 'Zero-Knowledge', 'EHR Security'],
    createdAt: '2024-07-20T11:00:00Z',
  },
  {
    id: 'prj-003',
    projectCode: 'PRJ-2026-003',
    title: 'Automated Micro-Irrigation Soil Moisture Optimization Using LoRaWAN',
    principalInvestigatorId: 'user-faculty-2',
    principalInvestigatorName: 'Dr. Amit Trivedi',
    departmentId: 'dept-2',
    departmentName: 'Information Technology',
    instituteId: 'inst-1',
    instituteName: 'Swarrnim Institute of Technology',
    researchArea: 'Agri-Tech & Embedded Systems',
    fundingAgency: 'AICTE RPS',
    projectType: 'SPONSORED',
    startDate: '2024-01-15',
    endDate: '2025-12-31',
    sanctionedAmount: 950000,
    utilizedAmount: 950000,
    remainingAmount: 0,
    status: 'COMPLETED',
    approvalDate: '2023-12-10',
    completionDate: '2025-12-28',
    description: 'Sensor mesh deployment for optimal precision water delivery in semi-arid crop regions.',
    keywords: ['LoRaWAN', 'Soil Sensors', 'Precision Agriculture'],
    createdAt: '2023-12-10T09:30:00Z',
  },
];

const initialPublications: PublicationItem[] = [
  {
    id: 'pub-001',
    publicationCode: 'PUB-2026-001',
    title: 'Adaptive Resource Scheduling in Edge-Fog Frameworks via Deep Q-Networks',
    authors: 'Dr. Rajesh Sharma, Prof. Priya Patel, Dr. Amit Trivedi',
    facultyAuthors: ['Dr. Rajesh Sharma', 'Prof. Priya Patel'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    publicationType: 'JOURNAL_ARTICLE',
    journalOrConferenceName: 'IEEE Transactions on Network and Service Management',
    publisher: 'IEEE',
    publicationDate: '2026-01-15',
    volume: '23',
    issue: '1',
    pages: '112-126',
    year: 2026,
    doi: '10.1109/TNSM.2026.3190842',
    issn: '1932-4537',
    indexing: 'Scopus',
    citationCount: 14,
    impactFactor: 5.3,
    quartile: 'Q1',
    openAccess: true,
    abstract: 'This paper presents a reinforcement learning approach to dynamically balance computational load at edge micro-data centers.',
    keywords: ['Deep Q-Networks', 'Edge Computing', 'Resource Scheduling'],
    validationStatus: 'VERIFIED',
    approvalStatus: 'APPROVED',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'pub-002',
    publicationCode: 'PUB-2026-002',
    title: 'Zero-Knowledge Proofs for Verifiable Credential Exchange in Higher Education',
    authors: 'Prof. Priya Patel, Dr. Rajesh Sharma',
    facultyAuthors: ['Prof. Priya Patel'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    publicationType: 'JOURNAL_ARTICLE',
    journalOrConferenceName: 'Journal of Information Security and Applications',
    publisher: 'Elsevier',
    publicationDate: '2025-11-10',
    volume: '68',
    pages: '103210',
    year: 2025,
    doi: '10.1016/j.jisa.2025.103210',
    issn: '2214-2126',
    indexing: 'Web of Science',
    citationCount: 8,
    impactFactor: 4.9,
    quartile: 'Q1',
    openAccess: false,
    abstract: 'A privacy-preserving framework enabling cryptographic verification of academic degrees without exposing student identity.',
    keywords: ['Zero-Knowledge', 'Verifiable Credentials', 'Data Privacy'],
    validationStatus: 'VERIFIED',
    approvalStatus: 'APPROVED',
    createdAt: '2025-11-15T09:00:00Z',
  },
  {
    id: 'pub-003',
    publicationCode: 'PUB-2026-003',
    title: 'Real-Time Crop Health Assessment Using Multispectral Drone Imagery',
    authors: 'Dr. Amit Trivedi, Er. Sagar Mehta',
    facultyAuthors: ['Dr. Amit Trivedi'],
    departmentId: 'dept-2',
    departmentName: 'Information Technology',
    publicationType: 'CONFERENCE_PAPER',
    journalOrConferenceName: '2025 IEEE International Conference on Advanced Computing (IACC)',
    publisher: 'IEEE Xplore',
    publicationDate: '2025-09-22',
    year: 2025,
    doi: '10.1109/IACC58921.2025.1009823',
    indexing: 'Scopus',
    citationCount: 5,
    validationStatus: 'VERIFIED',
    approvalStatus: 'APPROVED',
    createdAt: '2025-09-25T14:00:00Z',
  },
];

const initialPatents: PatentIprItem[] = [
  {
    id: 'pat-001',
    iprCode: 'PAT-2026-001',
    category: 'PATENT',
    title: 'An Intelligent Energy-Harvesting Edge Node Controller for Smart Microgrids',
    inventors: 'Dr. Rajesh Sharma, Prof. Priya Patel, Swarrnim Startup & Innovation University',
    facultyInventors: ['Dr. Rajesh Sharma', 'Prof. Priya Patel'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    applicationNumber: '202521048912 A',
    filingDate: '2025-04-18',
    publicationNumber: 'IN-202521048912-A',
    publicationDate: '2025-10-24',
    country: 'India (IPO)',
    patentOffice: 'Indian Patent Office, Mumbai',
    technologyArea: 'Renewable Energy & IoT Hardware',
    status: 'PUBLISHED',
    abstract: 'An embedded hardware circuit optimizing supercapacitor charge cycles during intermittent solar harvesting.',
    createdAt: '2025-04-20T10:00:00Z',
  },
  {
    id: 'pat-002',
    iprCode: 'PAT-2026-002',
    category: 'PATENT',
    title: 'System and Method for Tamper-Evident Academic Credential Verification on Distributed Ledger',
    inventors: 'Prof. Priya Patel, Dr. Rajesh Sharma',
    facultyInventors: ['Prof. Priya Patel'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    applicationNumber: '202421031980 A',
    filingDate: '2024-03-12',
    publicationNumber: 'IN-202421031980-A',
    publicationDate: '2024-09-15',
    grantNumber: 'IN-PAT-498214',
    grantDate: '2025-12-05',
    country: 'India (IPO)',
    patentOffice: 'Indian Patent Office, Mumbai',
    technologyArea: 'Cryptography & Distributed Computing',
    status: 'GRANTED',
    abstract: 'Decentralized verification engine utilizing succinct cryptographic proofs to authenticate digital degrees.',
    createdAt: '2024-03-15T11:00:00Z',
  },
  {
    id: 'pat-003',
    iprCode: 'CPY-2026-001',
    category: 'COPYRIGHT',
    title: 'SSIU Neural-Sim: Visual Laboratory Simulator for Deep Convolutional Architectures',
    inventors: 'Dr. Rajesh Sharma',
    facultyInventors: ['Dr. Rajesh Sharma'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    applicationNumber: 'SW-18921/2025',
    filingDate: '2025-02-10',
    grantNumber: 'ROC-SW-18921',
    grantDate: '2025-08-14',
    country: 'India (Copyright Office)',
    technologyArea: 'Educational Software',
    status: 'GRANTED',
    createdAt: '2025-02-12T10:00:00Z',
  },
];

const initialGrants: ResearchGrantItem[] = [
  {
    id: 'grt-001',
    grantNo: 'DST/TDT/DDP-2025/119',
    projectTitle: 'AI-Driven Distributed Edge Computing for Smart Campus Energy Management',
    principalInvestigatorId: 'user-faculty-1',
    principalInvestigatorName: 'Dr. Rajesh Sharma',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    fundingAgency: 'DST (Department of Science & Technology)',
    grantType: 'GOVERNMENT',
    sanctionDate: '2025-06-15',
    startDate: '2025-07-01',
    endDate: '2027-06-30',
    sanctionedAmount: 2850000,
    releasedAmount: 1800000,
    utilizedAmount: 1420000,
    balanceAmount: 380000,
    status: 'RELEASED',
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'grt-002',
    grantNo: 'GUJCOST/MRP/2024-25/882',
    projectTitle: 'Low-Latency Blockchain Consensus for Multi-Tenant Health Records',
    principalInvestigatorId: 'user-hod-1',
    principalInvestigatorName: 'Prof. Priya Patel',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    fundingAgency: 'GUJCOST',
    grantType: 'GOVERNMENT',
    sanctionDate: '2024-07-20',
    startDate: '2024-08-01',
    endDate: '2026-07-31',
    sanctionedAmount: 1200000,
    releasedAmount: 1200000,
    utilizedAmount: 1100000,
    balanceAmount: 100000,
    status: 'RELEASED',
    createdAt: '2024-07-20T11:00:00Z',
  },
];

const initialScholars: ResearchScholarItem[] = [
  {
    id: 'sch-001',
    scholarId: 'PHD-2024-CSE-001',
    scholarName: 'Ananya Deshmukh',
    program: 'Ph.D.',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    supervisorId: 'user-faculty-1',
    supervisorName: 'Dr. Rajesh Sharma',
    admissionDate: '2024-08-10',
    registrationNumber: 'SSIU/PHD/2024/042',
    researchArea: 'Reinforcement Learning in Smart Grid Systems',
    thesisTitle: 'Autonomous Energy Orchestration in Distributed Microgrids Using Multi-Agent Deep Q-Learning',
    status: 'ACTIVE',
    expectedCompletionDate: '2027-07-31',
    publicationsCount: 3,
    patentsCount: 1,
    createdAt: '2024-08-10T10:00:00Z',
  },
  {
    id: 'sch-002',
    scholarId: 'PHD-2023-CSE-004',
    scholarName: 'Rohan Varma',
    program: 'Ph.D.',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    supervisorId: 'user-hod-1',
    supervisorName: 'Prof. Priya Patel',
    admissionDate: '2023-01-15',
    registrationNumber: 'SSIU/PHD/2023/018',
    researchArea: 'Zero-Knowledge Cryptography',
    thesisTitle: 'Efficient Non-Interactive Zero-Knowledge Arguments of Knowledge for Verifiable Decentralized Identifiers',
    status: 'THESIS_SUBMITTED',
    expectedCompletionDate: '2026-06-30',
    publicationsCount: 4,
    patentsCount: 1,
    createdAt: '2023-01-15T11:00:00Z',
  },
];

const initialConsultancies: ConsultancyProjectItem[] = [
  {
    id: 'con-001',
    consultancyId: 'CNS-2025-01',
    projectTitle: 'Automated Defect Detection System for Industrial Textile Looms',
    clientName: 'Arvind Mills Ltd., Ahmedabad',
    facultyConsultantId: 'user-faculty-1',
    facultyConsultantName: 'Dr. Rajesh Sharma',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    startDate: '2025-03-01',
    endDate: '2025-11-30',
    contractAmount: 650000,
    receivedAmount: 650000,
    status: 'COMPLETED',
    deliverables: 'Computer vision edge hardware kit and real-time inference model.',
    outcome: 'Successfully deployed across 24 loom units, cutting fabric waste by 18%.',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'con-002',
    consultancyId: 'CNS-2026-02',
    projectTitle: 'Cloud Security Audit & Compliance Assessment Framework',
    clientName: 'FinSecure Technologies Inc.',
    facultyConsultantId: 'user-hod-1',
    facultyConsultantName: 'Prof. Priya Patel',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    startDate: '2026-01-10',
    endDate: '2026-08-31',
    contractAmount: 480000,
    receivedAmount: 240000,
    status: 'ACTIVE',
    deliverables: 'ISO 27001 vulnerability audit and remediation blueprint.',
    createdAt: '2026-01-10T10:00:00Z',
  },
];

const initialConferences: ConferenceRecordItem[] = [
  {
    id: 'conf-001',
    conferenceName: '2025 IEEE International Conference on Advanced Computing (IACC)',
    conferenceType: 'INTERNATIONAL',
    organizer: 'IEEE Computer Society',
    facultyId: 'user-faculty-2',
    facultyName: 'Dr. Amit Trivedi',
    departmentId: 'dept-2',
    departmentName: 'Information Technology',
    location: 'Goa, India',
    startDate: '2025-09-20',
    endDate: '2025-09-22',
    paperPresented: 'Real-Time Crop Health Assessment Using Multispectral Drone Imagery',
    publicationTitle: 'Proceedings of IEEE IACC 2025',
    participationType: 'PRESENTER',
    createdAt: '2025-09-23T10:00:00Z',
  },
];

const initialBooks: BookChapterItem[] = [
  {
    id: 'bk-001',
    title: 'Reinforcement Learning Principles for Cyber-Physical Edge Systems',
    authors: 'Dr. Rajesh Sharma, Dr. Amit Trivedi',
    facultyAuthors: ['Dr. Rajesh Sharma', 'Dr. Amit Trivedi'],
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    publisher: 'Springer Nature (Singapore)',
    isbn: '978-981-19-4820-3',
    publicationDate: '2025-08-15',
    edition: '1st Edition',
    itemType: 'BOOK_CHAPTER',
    doi: '10.1007/978-981-19-4820-3_7',
    createdAt: '2025-08-20T10:00:00Z',
  },
];

const initialAwards: ResearchAwardItem[] = [
  {
    id: 'awd-001',
    awardTitle: 'Best Research Faculty of the Year (Engineering)',
    recipientId: 'user-faculty-1',
    recipientName: 'Dr. Rajesh Sharma',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    awardingOrganization: 'Gujarat Innovation Society (GIS)',
    awardCategory: 'Academic Research Excellence',
    date: '2025-10-15',
    level: 'State',
    description: 'Conferred for high-impact Scopus Q1 publications and funded IoT edge research grants.',
    createdAt: '2025-10-16T10:00:00Z',
  },
];

class ResearchService {
  private load<T>(key: string, fallback: T[]): T[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T[]) {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  // --- PROJECTS ---
  getProjects(): ResearchProjectItem[] {
    return this.load('projects', initialProjects);
  }

  createProject(item: Omit<ResearchProjectItem, 'id' | 'createdAt'>): ResearchProjectItem {
    const projects = this.getProjects();
    const newPrj: ResearchProjectItem = {
      ...item,
      id: `prj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    projects.unshift(newPrj);
    this.save('projects', projects);
    return newPrj;
  }

  updateProject(id: string, updates: Partial<ResearchProjectItem>): ResearchProjectItem | null {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save('projects', projects);
    return projects[idx];
  }

  // --- PUBLICATIONS ---
  getPublications(): PublicationItem[] {
    return this.load('publications', initialPublications);
  }

  createPublication(item: Omit<PublicationItem, 'id' | 'createdAt'>): PublicationItem {
    const pubs = this.getPublications();
    const newPub: PublicationItem = {
      ...item,
      id: `pub-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    pubs.unshift(newPub);
    this.save('publications', pubs);
    return newPub;
  }

  // --- PATENTS & IPR ---
  getPatents(): PatentIprItem[] {
    return this.load('patents', initialPatents);
  }

  createPatent(item: Omit<PatentIprItem, 'id' | 'createdAt'>): PatentIprItem {
    const pats = this.getPatents();
    const newPat: PatentIprItem = {
      ...item,
      id: `pat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    pats.unshift(newPat);
    this.save('patents', pats);
    return newPat;
  }

  // --- GRANTS ---
  getGrants(): ResearchGrantItem[] {
    return this.load('grants', initialGrants);
  }

  createGrant(item: Omit<ResearchGrantItem, 'id' | 'createdAt'>): ResearchGrantItem {
    const grants = this.getGrants();
    const newGrant: ResearchGrantItem = {
      ...item,
      id: `grt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    grants.unshift(newGrant);
    this.save('grants', grants);
    return newGrant;
  }

  // --- SCHOLARS ---
  getScholars(): ResearchScholarItem[] {
    return this.load('scholars', initialScholars);
  }

  createScholar(item: Omit<ResearchScholarItem, 'id' | 'createdAt'>): ResearchScholarItem {
    const scholars = this.getScholars();
    const newScholar: ResearchScholarItem = {
      ...item,
      id: `sch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    scholars.unshift(newScholar);
    this.save('scholars', scholars);
    return newScholar;
  }

  // --- CONSULTANCY ---
  getConsultancies(): ConsultancyProjectItem[] {
    return this.load('consultancies', initialConsultancies);
  }

  createConsultancy(item: Omit<ConsultancyProjectItem, 'id' | 'createdAt'>): ConsultancyProjectItem {
    const consultancies = this.getConsultancies();
    const newCon: ConsultancyProjectItem = {
      ...item,
      id: `con-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    consultancies.unshift(newCon);
    this.save('consultancies', consultancies);
    return newCon;
  }

  // --- CONFERENCES ---
  getConferences(): ConferenceRecordItem[] {
    return this.load('conferences', initialConferences);
  }

  createConference(item: Omit<ConferenceRecordItem, 'id' | 'createdAt'>): ConferenceRecordItem {
    const confs = this.getConferences();
    const newConf: ConferenceRecordItem = {
      ...item,
      id: `conf-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    confs.unshift(newConf);
    this.save('conferences', confs);
    return newConf;
  }

  // --- BOOKS & CHAPTERS ---
  getBooks(): BookChapterItem[] {
    return this.load('books', initialBooks);
  }

  createBook(item: Omit<BookChapterItem, 'id' | 'createdAt'>): BookChapterItem {
    const books = this.getBooks();
    const newBook: BookChapterItem = {
      ...item,
      id: `bk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    books.unshift(newBook);
    this.save('books', books);
    return newBook;
  }

  // --- AWARDS ---
  getAwards(): ResearchAwardItem[] {
    return this.load('awards', initialAwards);
  }

  createAward(item: Omit<ResearchAwardItem, 'id' | 'createdAt'>): ResearchAwardItem {
    const awards = this.getAwards();
    const newAwd: ResearchAwardItem = {
      ...item,
      id: `awd-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    awards.unshift(newAwd);
    this.save('awards', awards);
    return newAwd;
  }

  // --- FILTERED DATA RETRIEVAL ---
  getFilteredData(filters: ResearchFilterState, role?: string, user?: any) {
    let projects = this.getProjects();
    let publications = this.getPublications();
    let patents = this.getPatents();
    let grants = this.getGrants();
    let scholars = this.getScholars();
    let consultancies = this.getConsultancies();
    let conferences = this.getConferences();
    let books = this.getBooks();
    let awards = this.getAwards();

    // RBAC Scoping
    if (role === 'FACULTY' && user?.name) {
      projects = projects.filter(p => p.principalInvestigatorName.includes(user.name) || p.coInvestigators?.some(c => c.includes(user.name)));
      publications = publications.filter(p => p.authors.includes(user.name) || p.facultyAuthors?.some(f => f.includes(user.name)));
      patents = patents.filter(p => p.inventors.includes(user.name) || p.facultyInventors?.some(f => f.includes(user.name)));
      grants = grants.filter(g => g.principalInvestigatorName.includes(user.name));
      scholars = scholars.filter(s => s.supervisorName.includes(user.name));
      consultancies = consultancies.filter(c => c.facultyConsultantName.includes(user.name));
      conferences = conferences.filter(c => c.facultyName.includes(user.name));
      books = books.filter(b => b.authors.includes(user.name));
      awards = awards.filter(a => a.recipientName.includes(user.name));
    } else if (role === 'HOD' && user?.departmentId) {
      projects = projects.filter(p => p.departmentId === user.departmentId || p.departmentName.includes(user.departmentId));
      publications = publications.filter(p => p.departmentId === user.departmentId);
      patents = patents.filter(p => p.departmentId === user.departmentId);
      grants = grants.filter(g => g.departmentId === user.departmentId);
      scholars = scholars.filter(s => s.departmentId === user.departmentId);
      consultancies = consultancies.filter(c => c.departmentId === user.departmentId);
      conferences = conferences.filter(c => c.departmentId === user.departmentId);
      books = books.filter(b => b.departmentId === user.departmentId);
      awards = awards.filter(a => a.departmentId === user.departmentId);
    }

    // Department Filter
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      projects = projects.filter(p => p.departmentId === filters.departmentId);
      publications = publications.filter(p => p.departmentId === filters.departmentId);
      patents = patents.filter(p => p.departmentId === filters.departmentId);
      grants = grants.filter(g => g.departmentId === filters.departmentId);
      scholars = scholars.filter(s => s.departmentId === filters.departmentId);
      consultancies = consultancies.filter(c => c.departmentId === filters.departmentId);
      conferences = conferences.filter(c => c.departmentId === filters.departmentId);
      books = books.filter(b => b.departmentId === filters.departmentId);
      awards = awards.filter(a => a.departmentId === filters.departmentId);
    }

    // Search Query Filter
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      projects = projects.filter(p => p.title.toLowerCase().includes(q) || p.principalInvestigatorName.toLowerCase().includes(q));
      publications = publications.filter(p => p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q));
      patents = patents.filter(p => p.title.toLowerCase().includes(q) || p.inventors.toLowerCase().includes(q));
      grants = grants.filter(g => g.projectTitle.toLowerCase().includes(q) || g.fundingAgency.toLowerCase().includes(q));
      scholars = scholars.filter(s => s.scholarName.toLowerCase().includes(q) || s.thesisTitle.toLowerCase().includes(q));
      consultancies = consultancies.filter(c => c.projectTitle.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q));
    }

    return {
      projects,
      publications,
      patents,
      grants,
      scholars,
      consultancies,
      conferences,
      books,
      awards,
    };
  }

  // --- METRICS CALCULATION ---
  getMetrics(filters: ResearchFilterState, role?: string, user?: any): ResearchMetricsData {
    const data = this.getFilteredData(filters, role, user);

    const activeProjects = data.projects.filter(p => p.status === 'ACTIVE' || p.status === 'SUBMITTED').length;
    const completedProjects = data.projects.filter(p => p.status === 'COMPLETED').length;

    const totalPublications = data.publications.length;
    const scopusPublications = data.publications.filter(p => p.indexing === 'Scopus').length;
    const wosPublications = data.publications.filter(p => p.indexing === 'Web of Science').length;
    const ugcCarePublications = data.publications.filter(p => p.indexing === 'UGC CARE').length;

    const patentsFiled = data.patents.filter(p => p.status === 'FILED' || p.status === 'DRAFT').length;
    const patentsPublished = data.patents.filter(p => p.status === 'PUBLISHED' || p.status === 'UNDER_EXAMINATION').length;
    const patentsGranted = data.patents.filter(p => p.status === 'GRANTED').length;

    const totalGrantsCount = data.grants.length;
    const totalGrantAmount = data.grants.reduce((sum, g) => sum + (g.sanctionedAmount || 0), 0);

    const totalScholars = data.scholars.length;
    const totalConsultancy = data.consultancies.length;
    const totalConsultancyAmount = data.consultancies.reduce((sum, c) => sum + (c.contractAmount || 0), 0);
    const totalAwards = data.awards.length;

    const yearWiseComparison = [
      {
        academicYear: '2024-25',
        publications: 18,
        patents: 2,
        grantsAmount: 2150000,
        consultancyAmount: 450000,
      },
      {
        academicYear: '2025-26',
        publications: totalPublications > 0 ? totalPublications : 24,
        patents: data.patents.length > 0 ? data.patents.length : 3,
        grantsAmount: totalGrantAmount > 0 ? totalGrantAmount : 4050000,
        consultancyAmount: totalConsultancyAmount > 0 ? totalConsultancyAmount : 1130000,
      },
      {
        academicYear: '2026-27 (Target / Projected)',
        publications: 35,
        patents: 6,
        grantsAmount: 6000000,
        consultancyAmount: 2000000,
      },
    ];

    return {
      activeProjects,
      completedProjects,
      totalPublications,
      scopusPublications,
      wosPublications,
      ugcCarePublications,
      patentsFiled,
      patentsPublished,
      patentsGranted,
      totalGrantsCount,
      totalGrantAmount,
      totalScholars,
      totalConsultancy,
      totalConsultancyAmount,
      totalAwards,
      yearWiseComparison,
    };
  }

  // --- NAAC / IQAC EVIDENCE DOSSIER ---
  getNaacSummary(filters: ResearchFilterState, role?: string, user?: any): ResearchNaacSummary[] {
    const m = this.getMetrics(filters, role, user);

    return [
      {
        metric: 'Metric 3.1.1 — Grants received from Government and Non-Governmental Agencies for Research Projects',
        currentValue: `₹${(m.totalGrantAmount / 100000).toFixed(2)} Lakhs`,
        previousPeriodValue: '₹21.50 Lakhs',
        change: '+88.3%',
        interpretation: 'Significant growth in external funded research projects (DST & GUJCOST).',
        evidenceCount: m.totalGrantsCount,
      },
      {
        metric: 'Metric 3.2.2 — Total Number of Workshops/Seminars Conducted on Research Methodology & IPR',
        currentValue: '14 Programs',
        previousPeriodValue: '9 Programs',
        change: '+55.5%',
        interpretation: 'Regular IPR and patent drafting workshops conducted for faculty and PG scholars.',
        evidenceCount: 14,
      },
      {
        metric: 'Metric 3.3.1 — Number of Ph.Ds Registered / Conferred per Recognized Research Guide',
        currentValue: `${m.totalScholars} Scholars`,
        previousPeriodValue: '8 Scholars',
        change: '+25.0%',
        interpretation: 'Active doctoral guidance across computer engineering and technology disciplines.',
        evidenceCount: m.totalScholars,
      },
      {
        metric: 'Metric 3.4.3 — Number of Research Papers Published per Teacher in UGC CARE / Scopus / WoS',
        currentValue: `${m.totalPublications} Papers (${m.scopusPublications} Scopus, ${m.wosPublications} WoS)`,
        previousPeriodValue: '18 Papers',
        change: '+33.3%',
        interpretation: 'High-impact factor Q1/Q2 journal publications meeting NAAC Criterion 3 standards.',
        evidenceCount: m.totalPublications,
      },
      {
        metric: 'Metric 3.4.4 — Number of Books and Chapters in Edited Volumes / Conference Proceedings',
        currentValue: `${this.getBooks().length} Chapters / Books`,
        previousPeriodValue: '3 Volumes',
        change: '+66.7%',
        interpretation: 'Edited volume chapters published with Springer Nature and IEEE.',
        evidenceCount: this.getBooks().length,
      },
      {
        metric: 'Metric 3.5.1 — Revenue Generated from Consultancy & Corporate Training',
        currentValue: `₹${(m.totalConsultancyAmount / 100000).toFixed(2)} Lakhs`,
        previousPeriodValue: '₹4.50 Lakhs',
        change: '+151.1%',
        interpretation: 'Industry collaboration with Arvind Mills and FinSecure Technologies.',
        evidenceCount: m.totalConsultancy,
      },
    ];
  }

  // --- MULTI-SHEET EXCEL EXPORT ---
  exportMultiSheetExcel(filters: ResearchFilterState, role?: string, user?: any) {
    const data = this.getFilteredData(filters, role, user);
    const metrics = this.getMetrics(filters, role, user);
    const naac = this.getNaacSummary(filters, role, user);
    const timestamp = new Date().toLocaleString('en-IN');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Summary
    const summaryRows = [
      ['SWARRNIM STARTUP & INNOVATION UNIVERSITY'],
      ['DIRECTORATE OF RESEARCH, INNOVATIONS & PATENTS (IPR CELL)'],
      ['Comprehensive Institutional Research Report & Evidence Dossier'],
      ['Generated On:', timestamp],
      ['Generated By:', `${user?.name || 'Administrator'} (${role || 'RESEARCH_ADMIN'})`],
      [],
      ['KEY RESEARCH INDICATORS', 'VALUE'],
      ['Active Research Projects', metrics.activeProjects],
      ['Completed Research Projects', metrics.completedProjects],
      ['Total Publications (All Types)', metrics.totalPublications],
      ['Scopus Indexed Publications', metrics.scopusPublications],
      ['Web of Science Publications', metrics.wosPublications],
      ['UGC CARE Publications', metrics.ugcCarePublications],
      ['Patents / IPR Filed', metrics.patentsFiled],
      ['Patents Published', metrics.patentsPublished],
      ['Patents / Copyrights Granted', metrics.patentsGranted],
      ['Total Sponsored Grants Count', metrics.totalGrantsCount],
      ['Total Sanctioned Grant Amount', `₹${metrics.totalGrantAmount.toLocaleString('en-IN')}`],
      ['Active Research Scholars (Ph.D.)', metrics.totalScholars],
      ['Industry Consultancy Projects', metrics.totalConsultancy],
      ['Consultancy Revenue Generated', `₹${metrics.totalConsultancyAmount.toLocaleString('en-IN')}`],
      ['Faculty Research Awards & Honors', metrics.totalAwards],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Research Projects
    const prjHeader = ['Project Code', 'Title', 'Principal Investigator', 'Department', 'Funding Agency', 'Type', 'Sanctioned Amount', 'Utilized Amount', 'Remaining', 'Status', 'Start Date', 'End Date'];
    const prjRows = data.projects.map(p => [
      p.projectCode, p.title, p.principalInvestigatorName, p.departmentName, p.fundingAgency, p.projectType, p.sanctionedAmount, p.utilizedAmount, p.remainingAmount, p.status, p.startDate, p.endDate || 'N/A'
    ]);
    const wsProjects = XLSX.utils.aoa_to_sheet([prjHeader, ...prjRows]);
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Research_Projects');

    // Sheet 3: Publications
    const pubHeader = ['Code', 'Title', 'Authors', 'Department', 'Type', 'Journal / Conference', 'Year', 'DOI', 'ISSN/ISBN', 'Indexing', 'Citations', 'Impact Factor', 'Quartile', 'Status'];
    const pubRows = data.publications.map(p => [
      p.publicationCode, p.title, p.authors, p.departmentName, p.publicationType, p.journalOrConferenceName, p.year, p.doi || 'N/A', p.issn || p.isbn || 'N/A', p.indexing, p.citationCount, p.impactFactor || 'N/A', p.quartile || 'N/A', p.approvalStatus
    ]);
    const wsPubs = XLSX.utils.aoa_to_sheet([pubHeader, ...pubRows]);
    XLSX.utils.book_append_sheet(wb, wsPubs, 'Publications');

    // Sheet 4: Patents & IPR
    const patHeader = ['IPR Code', 'Category', 'Title', 'Inventors', 'Department', 'Application No', 'Filing Date', 'Publication No', 'Grant No', 'Grant Date', 'Jurisdiction', 'Status'];
    const patRows = data.patents.map(p => [
      p.iprCode, p.category, p.title, p.inventors, p.departmentName, p.applicationNumber, p.filingDate, p.publicationNumber || 'N/A', p.grantNumber || 'N/A', p.grantDate || 'N/A', p.country, p.status
    ]);
    const wsPats = XLSX.utils.aoa_to_sheet([patHeader, ...patRows]);
    XLSX.utils.book_append_sheet(wb, wsPats, 'Patents_IPR');

    // Sheet 5: Research Grants
    const grtHeader = ['Grant No', 'Project Title', 'Principal Investigator', 'Department', 'Funding Agency', 'Sanction Date', 'Sanctioned Amount', 'Released Amount', 'Utilized Amount', 'Balance', 'Status'];
    const grtRows = data.grants.map(g => [
      g.grantNo, g.projectTitle, g.principalInvestigatorName, g.departmentName, g.fundingAgency, g.sanctionDate, g.sanctionedAmount, g.releasedAmount, g.utilizedAmount, g.balanceAmount, g.status
    ]);
    const wsGrants = XLSX.utils.aoa_to_sheet([grtHeader, ...grtRows]);
    XLSX.utils.book_append_sheet(wb, wsGrants, 'Research_Grants');

    // Sheet 6: Research Scholars
    const schHeader = ['Scholar ID', 'Scholar Name', 'Program', 'Department', 'Supervisor', 'Admission Date', 'Registration No', 'Research Area', 'Thesis Title', 'Status', 'Expected Completion'];
    const schRows = data.scholars.map(s => [
      s.scholarId, s.scholarName, s.program, s.departmentName, s.supervisorName, s.admissionDate, s.registrationNumber, s.researchArea, s.thesisTitle, s.status, s.expectedCompletionDate || 'N/A'
    ]);
    const wsScholars = XLSX.utils.aoa_to_sheet([schHeader, ...schRows]);
    XLSX.utils.book_append_sheet(wb, wsScholars, 'Research_Scholars');

    // Sheet 7: Consultancy
    const conHeader = ['Consultancy ID', 'Project Title', 'Client Name', 'Faculty Consultant', 'Department', 'Contract Amount', 'Received Amount', 'Status', 'Deliverables', 'Outcome'];
    const conRows = data.consultancies.map(c => [
      c.consultancyId, c.projectTitle, c.clientName, c.facultyConsultantName, c.departmentName, c.contractAmount, c.receivedAmount, c.status, c.deliverables || 'N/A', c.outcome || 'N/A'
    ]);
    const wsCons = XLSX.utils.aoa_to_sheet([conHeader, ...conRows]);
    XLSX.utils.book_append_sheet(wb, wsCons, 'Consultancy_Projects');

    // Sheet 8: Conferences
    const confHeader = ['Conference Name', 'Type', 'Organizer', 'Faculty', 'Department', 'Location', 'Dates', 'Paper Presented', 'Participation Type'];
    const confRows = data.conferences.map(c => [
      c.conferenceName, c.conferenceType, c.organizer, c.facultyName, c.departmentName, c.location, `${c.startDate} to ${c.endDate}`, c.paperPresented || 'N/A', c.participationType
    ]);
    const wsConfs = XLSX.utils.aoa_to_sheet([confHeader, ...confRows]);
    XLSX.utils.book_append_sheet(wb, wsConfs, 'Conferences');

    // Sheet 9: Books & Chapters
    const bkHeader = ['Title', 'Authors', 'Department', 'Publisher', 'ISBN', 'Publication Date', 'Edition', 'Type', 'DOI'];
    const bkRows = data.books.map(b => [
      b.title, b.authors, b.departmentName, b.publisher, b.isbn || 'N/A', b.publicationDate, b.edition || 'N/A', b.itemType, b.doi || 'N/A'
    ]);
    const wsBooks = XLSX.utils.aoa_to_sheet([bkHeader, ...bkRows]);
    XLSX.utils.book_append_sheet(wb, wsBooks, 'Books_Chapters');

    // Sheet 10: Research Awards
    const awdHeader = ['Award Title', 'Recipient', 'Department', 'Awarding Organization', 'Category', 'Date', 'Level', 'Description'];
    const awdRows = data.awards.map(a => [
      a.awardTitle, a.recipientName, a.departmentName, a.awardingOrganization, a.awardCategory, a.date, a.level, a.description || 'N/A'
    ]);
    const wsAwards = XLSX.utils.aoa_to_sheet([awdHeader, ...awdRows]);
    XLSX.utils.book_append_sheet(wb, wsAwards, 'Research_Awards');

    // Sheet 11: NAAC Criterion 3 Evidence
    const naacHeader = ['NAAC Metric Description', 'Current Value (2025-26)', 'Previous Period (2024-25)', 'Growth (%)', 'Institutional Interpretation', 'Evidence File Count'];
    const naacRows = naac.map(n => [
      n.metric, n.currentValue, n.previousPeriodValue, n.change, n.interpretation, n.evidenceCount
    ]);
    const wsNaac = XLSX.utils.aoa_to_sheet([naacHeader, ...naacRows]);
    XLSX.utils.book_append_sheet(wb, wsNaac, 'NAAC_Criterion_3_Evidence');

    const filename = `SSIU_Institutional_Research_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
}

export const researchService = new ResearchService();
