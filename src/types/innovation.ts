export type InnovationCategory =
  | 'Technology'
  | 'AI / ML'
  | 'Cyber Security'
  | 'IoT'
  | 'Robotics'
  | 'Healthcare'
  | 'Agriculture'
  | 'Education'
  | 'Sustainability'
  | 'Renewable Energy'
  | 'Social Innovation'
  | 'FinTech'
  | 'Other';

export type InnovationStage =
  | 'IDEA'
  | 'CONCEPT'
  | 'PROTOTYPE'
  | 'VALIDATION'
  | 'PILOT'
  | 'IMPLEMENTATION'
  | 'COMMERCIALIZATION'
  | 'COMPLETED';

export type InnovationProjectStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'REJECTED'
  | 'ARCHIVED';

export type StartupStage =
  | 'IDEA'
  | 'VALIDATION'
  | 'MVP'
  | 'EARLY_STAGE'
  | 'GROWTH'
  | 'SCALE_UP'
  | 'MATURE';

export type StartupStatus =
  | 'PROPOSED'
  | 'INCUBATING'
  | 'ACTIVE'
  | 'GRADUATED'
  | 'DORMANT'
  | 'CLOSED';

export type FounderType = 'Student' | 'Faculty' | 'Alumni' | 'External' | 'Industry';

export type MentorType =
  | 'Faculty'
  | 'Industry'
  | 'Entrepreneur'
  | 'Investor'
  | 'Legal'
  | 'Technical'
  | 'Domain Expert'
  | 'Alumni'
  | 'External';

export type FundingType =
  | 'University'
  | 'Government'
  | 'Grant'
  | 'Incubation Fund'
  | 'Angel'
  | 'Venture Capital'
  | 'Industry'
  | 'CSR'
  | 'International'
  | 'Other';

export type CollaborationType =
  | 'MoU'
  | 'Sponsored Innovation'
  | 'Technology Transfer'
  | 'Consultancy'
  | 'Incubation Support'
  | 'Mentorship'
  | 'Internship'
  | 'Joint Research'
  | 'Other';

export type InnovationEventType =
  | 'Innovation Day'
  | 'Startup Event'
  | 'Seminar'
  | 'Workshop'
  | 'Exhibition'
  | 'Demo Day'
  | 'Investor Meet'
  | 'Entrepreneurship Program'
  | 'Other';

export type AwardLevel = 'Institutional' | 'University' | 'State' | 'National' | 'International';

export interface InnovationProjectItem {
  id: string;
  innovationCode: string;
  title: string;
  description: string;
  category: InnovationCategory;
  problemStatement: string;
  proposedSolution: string;
  leadName: string;
  leadId?: string;
  leadType: 'STUDENT' | 'FACULTY';
  studentMembers?: string[];
  facultyMentorName: string;
  facultyMentorId?: string;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName: string;
  academicYear: string;
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status: InnovationProjectStatus;
  stage: InnovationStage;
  technologyArea: string;
  sdgAlignment?: string;
  industryPartner?: string;
  iprStatus?: string;
  linkedPatentId?: string;
  linkedPatentAppNo?: string;
  outcome?: string;
  remarks?: string;
  documentCount?: number;
  createdAt: string;
}

export interface IncubationCentreItem {
  id: string;
  centreName: string;
  centreCode: string;
  instituteName: string;
  instituteId: string;
  directorName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  facilities: string[];
  totalSeats: number;
  occupiedSeats: number;
  establishedDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  activeCohortsCount: number;
}

export interface IncubationApplicationItem {
  id: string;
  applicationNumber: string;
  applicantName: string;
  applicantRole: 'STUDENT' | 'FACULTY' | 'ALUMNI' | 'EXTERNAL';
  startupOrIdeaName: string;
  linkedInnovationId?: string;
  category: InnovationCategory;
  problemStatement: string;
  solution: string;
  teamMembersCount: number;
  facultyMentorName?: string;
  businessModel: string;
  marketOpportunity: string;
  technologyReadinessLevel: string; // TRL 1 to 9
  fundingRequirement: number;
  applicationDate: string;
  reviewStatus: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  reviewerName?: string;
  reviewRemarks?: string;
  decisionDate?: string;
}

export interface StartupFounderItem {
  id: string;
  name: string;
  role: string;
  founderType: FounderType;
  departmentName?: string;
  instituteName?: string;
  joiningDate: string;
  ownershipPercentage?: number;
  email: string;
  phone?: string;
}

export interface StartupItem {
  id: string;
  startupCode: string;
  startupName: string;
  legalEntityName?: string;
  founders: StartupFounderItem[];
  primaryFounderName: string;
  founderType: FounderType;
  departmentId: string;
  departmentName: string;
  instituteId: string;
  instituteName: string;
  category: InnovationCategory;
  sector: string;
  website?: string;
  registrationNumber?: string;
  incorporationDate?: string;
  dpiitRecognized: boolean;
  dpiitNumber?: string;
  stage: StartupStage;
  status: StartupStatus;
  incubationCentreName?: string;
  incubationStartDate?: string;
  expectedExitDate?: string;
  teamSize: number;
  fundingRaised: number;
  annualRevenue?: number;
  industryPartners?: string[];
  linkedInnovationProjectId?: string;
  linkedPatentId?: string;
  linkedPatentNumber?: string;
  academicYear: string;
  createdAt: string;
}

export interface InnovationMentorItem {
  id: string;
  mentorName: string;
  mentorType: MentorType;
  organization: string;
  expertise: string;
  departmentName?: string;
  instituteName?: string;
  email: string;
  contactNumber: string;
  experienceYears: number;
  availability: string;
  assignedStartupsCount: number;
  assignedProjectsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MentoringSessionItem {
  id: string;
  mentorId: string;
  mentorName: string;
  targetType: 'STARTUP' | 'INNOVATION_PROJECT' | 'COHORT';
  targetId: string;
  targetName: string;
  sessionDate: string;
  objectives: string;
  mentoringNotes: string;
  recommendations: string;
  nextAction: string;
  followUpDate?: string;
  completed: boolean;
}

export interface InnovationFundingItem {
  id: string;
  fundingCode: string;
  recipientType: 'STARTUP' | 'INNOVATION_PROJECT';
  recipientId: string;
  recipientName: string;
  fundingSource: string;
  fundingType: FundingType;
  sanctionDate: string;
  sanctionedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  balanceAmount: number;
  purpose: string;
  status: 'SANCTIONED' | 'RELEASED' | 'UTILIZED' | 'CLOSED';
  academicYear: string;
  departmentId: string;
  departmentName: string;
}

export interface IndustryCollaborationItem {
  id: string;
  collaborationCode: string;
  industryName: string;
  collaborationType: CollaborationType;
  departmentId: string;
  departmentName: string;
  instituteName: string;
  facultyCoordinatorName: string;
  linkedStartupOrProjectName?: string;
  startDate: string;
  endDate?: string;
  mouReference?: string;
  scope: string;
  deliverables: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'TERMINATED';
}

export interface InnovationEventItem {
  id: string;
  eventName: string;
  eventType: InnovationEventType;
  organizer: string;
  instituteName: string;
  departmentName: string;
  eventDate: string;
  venue: string;
  participantCount: number;
  facultyCoordinators: string;
  industryGuests?: string;
  outcomes: string;
  academicYear: string;
}

export interface HackathonItem {
  id: string;
  hackathonName: string;
  organizer: string;
  eventDate: string;
  theme: string;
  problemStatementsCount: number;
  teamsCount: number;
  participantsCount: number;
  facultyMentors: string;
  industryMentors?: string;
  winners: string;
  awardsPrizePool: number;
  innovationProjectsCreatedCount: number;
  followUpStatus: string;
  academicYear: string;
}

export interface InnovationAwardItem {
  id: string;
  awardTitle: string;
  recipientName: string;
  recipientType: 'STUDENT' | 'FACULTY' | 'STARTUP';
  startupOrProjectName?: string;
  departmentId: string;
  departmentName: string;
  instituteName: string;
  awardingOrganization: string;
  level: AwardLevel;
  category: string;
  awardDate: string;
  description: string;
  prizeMoney?: number;
  academicYear: string;
}

export interface StartupMilestoneItem {
  id: string;
  startupId: string;
  startupName: string;
  milestoneTitle: string;
  milestoneStage: StartupStage;
  targetDate: string;
  completionDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  evidenceDoc?: string;
  remarks?: string;
}

export interface InnovationFilterState {
  academicYear: string;
  instituteId: string;
  departmentId: string;
  stage: string;
  category: string;
  status: string;
  founderType: string;
  fundingSource: string;
  searchQuery: string;
}

export interface InnovationMetricsData {
  totalInnovationProjects: number;
  activeInnovationProjects: number;
  completedInnovations: number;
  totalStartups: number;
  incubatedStartups: number;
  activeStartups: number;
  studentStartups: number;
  facultyStartups: number;
  totalMentors: number;
  activeIncubationPrograms: number;
  totalFundingReceived: number;
  totalIndustryCollaborations: number;
  totalInnovationEvents: number;
  totalHackathons: number;
  totalInnovationAwards: number;
  patentsLinkedToInnovation: number;
  yearWiseComparison: {
    academicYear: string;
    innovations: number;
    startups: number;
    fundingAmount: number;
    collaborations: number;
    hackathons: number;
  }[];
}

export interface InnovationNaacSummary {
  metric: string;
  currentValue: string;
  previousPeriodValue: string;
  change: string;
  interpretation: string;
  evidenceCount: number;
}
