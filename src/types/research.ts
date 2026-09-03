export type ResearchProjectType = 'INTERNAL' | 'SPONSORED' | 'CONSULTANCY' | 'COLLABORATIVE';
export type ResearchProjectStatus = 'PROPOSED' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'REJECTED';

export type PublicationType = 
  | 'JOURNAL_ARTICLE' 
  | 'CONFERENCE_PAPER' 
  | 'BOOK' 
  | 'BOOK_CHAPTER' 
  | 'REVIEW_ARTICLE' 
  | 'CASE_STUDY' 
  | 'TECHNICAL_PAPER' 
  | 'OTHER';

export type PublicationIndexing = 'Scopus' | 'Web of Science' | 'UGC CARE' | 'Google Scholar' | 'PubMed' | 'Other' | 'Not Indexed';

export type IprCategory = 'PATENT' | 'COPYRIGHT' | 'DESIGN' | 'TRADEMARK' | 'OTHER_IPR';
export type PatentStatus = 'DRAFT' | 'FILED' | 'PUBLISHED' | 'UNDER_EXAMINATION' | 'GRANTED' | 'ABANDONED' | 'EXPIRED';

export type GrantStatus = 'PROPOSED' | 'SANCTIONED' | 'RELEASED' | 'UTILIZED' | 'COMPLETED' | 'CLOSED';
export type ScholarStatus = 'REGISTERED' | 'ACTIVE' | 'THESIS_SUBMITTED' | 'VIVA_PENDING' | 'COMPLETED' | 'WITHDRAWN';
export type ConsultancyStatus = 'PROPOSED' | 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
export type AwardLevel = 'Institutional' | 'University' | 'State' | 'National' | 'International';

export interface ResearchDocumentAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  sizeBytes?: number;
}

export interface ResearchProjectItem {
  id: string;
  projectCode: string;
  title: string;
  principalInvestigatorId: string;
  principalInvestigatorName: string;
  coInvestigators?: string[];
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName?: string;
  researchArea: string;
  fundingAgency: string; // e.g. DST, SERB, UGC, AICTE, GUJCOST, Industry
  projectType: ResearchProjectType;
  startDate: string;
  endDate?: string;
  sanctionedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  status: ResearchProjectStatus;
  approvalDate?: string;
  completionDate?: string;
  description?: string;
  keywords?: string[];
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface PublicationItem {
  id: string;
  publicationCode: string;
  title: string;
  authors: string;
  facultyAuthors?: string[];
  departmentId: string;
  departmentName: string;
  instituteId?: string;
  publicationType: PublicationType;
  journalOrConferenceName: string;
  publisher?: string;
  publicationDate: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year: number;
  doi?: string;
  isbn?: string;
  issn?: string;
  url?: string;
  indexing: PublicationIndexing;
  citationCount: number;
  impactFactor?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  openAccess?: boolean;
  abstract?: string;
  keywords?: string[];
  validationStatus: 'NOT_VERIFIED' | 'VERIFIED' | 'NOT_FOUND' | 'ERROR';
  approvalStatus: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  evidenceDocumentUrl?: string;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface PatentIprItem {
  id: string;
  iprCode: string;
  category: IprCategory;
  title: string;
  inventors: string;
  facultyInventors?: string[];
  departmentId: string;
  departmentName: string;
  instituteId?: string;
  applicationNumber: string;
  filingDate: string;
  publicationNumber?: string;
  publicationDate?: string;
  grantNumber?: string;
  grantDate?: string;
  country: string; // e.g. India (IPO), US (USPTO), PCT
  patentOffice?: string;
  technologyArea: string;
  abstract?: string;
  status: PatentStatus;
  validationStatus?: string;
  approvalStatus?: string;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface ResearchGrantItem {
  id: string;
  grantNo: string;
  projectTitle: string;
  principalInvestigatorId: string;
  principalInvestigatorName: string;
  departmentId: string;
  departmentName: string;
  fundingAgency: string; // DST, SERB, DBT, UGC, AICTE, ISRO, DRDO, Industry, International
  grantType: 'GOVERNMENT' | 'INDUSTRY' | 'INSTITUTIONAL' | 'INTERNATIONAL';
  sanctionDate: string;
  startDate: string;
  endDate: string;
  sanctionedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  balanceAmount: number;
  status: GrantStatus;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface ResearchScholarItem {
  id: string;
  scholarId: string;
  scholarName: string;
  program: 'Ph.D.' | 'Post-Doc' | 'M.Phil.' | 'Integrated Ph.D.';
  departmentId: string;
  departmentName: string;
  supervisorId: string;
  supervisorName: string;
  coSupervisorName?: string;
  admissionDate: string;
  registrationNumber: string;
  researchArea: string;
  thesisTitle: string;
  status: ScholarStatus;
  expectedCompletionDate?: string;
  completionDate?: string;
  publicationsCount?: number;
  patentsCount?: number;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface ConsultancyProjectItem {
  id: string;
  consultancyId: string;
  projectTitle: string;
  clientName: string;
  facultyConsultantId: string;
  facultyConsultantName: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  contractAmount: number;
  receivedAmount: number;
  status: ConsultancyStatus;
  deliverables?: string;
  outcome?: string;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface ConferenceRecordItem {
  id: string;
  conferenceName: string;
  conferenceType: 'INTERNATIONAL' | 'NATIONAL' | 'STATE';
  organizer: string;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName: string;
  location: string;
  startDate: string;
  endDate: string;
  paperPresented?: string;
  publicationTitle?: string;
  participationType: 'PRESENTER' | 'KEYNOTE_SPEAKER' | 'SESSION_CHAIR' | 'ATTENDEE';
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface BookChapterItem {
  id: string;
  title: string;
  authors: string;
  facultyAuthors?: string[];
  departmentId: string;
  departmentName: string;
  publisher: string;
  isbn?: string;
  publicationDate: string;
  edition?: string;
  itemType: 'BOOK' | 'BOOK_CHAPTER' | 'MONOGRAPH';
  doi?: string;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface ResearchAwardItem {
  id: string;
  awardTitle: string;
  recipientId: string;
  recipientName: string;
  departmentId: string;
  departmentName: string;
  awardingOrganization: string;
  awardCategory: string;
  date: string;
  level: AwardLevel;
  description?: string;
  documents?: ResearchDocumentAttachment[];
  createdAt: string;
}

export interface ResearchFilterState {
  academicYear: string;
  instituteId: string;
  departmentId: string;
  facultyId: string;
  status: string;
  researchArea: string;
  searchQuery: string;
  fromDate?: string;
  toDate?: string;
}

export interface ResearchMetricsData {
  activeProjects: number;
  completedProjects: number;
  totalPublications: number;
  scopusPublications: number;
  wosPublications: number;
  ugcCarePublications: number;
  patentsFiled: number;
  patentsPublished: number;
  patentsGranted: number;
  totalGrantsCount: number;
  totalGrantAmount: number;
  totalScholars: number;
  totalConsultancy: number;
  totalConsultancyAmount: number;
  totalAwards: number;
  yearWiseComparison: Array<{
    academicYear: string;
    publications: number;
    patents: number;
    grantsAmount: number;
    consultancyAmount: number;
  }>;
}

export interface ResearchNaacSummary {
  metric: string;
  currentValue: string | number;
  previousPeriodValue: string | number;
  change: string;
  interpretation: string;
  evidenceCount: number;
}
