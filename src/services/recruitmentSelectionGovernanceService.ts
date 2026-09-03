import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface PositionRecord {
  id: string;
  positionCode: string;
  designationTitle: string;
  departmentId: string;
  sanctionedStrength: number;
  activeEmployeeCount: number;
}

export interface VacancyRecord {
  id: string;
  positionId: string;
  vacancyCode: string;
  numberOfPosts: number;
  status: 'OPEN' | 'IN_SELECTION' | 'FILLED' | 'CLOSED';
}

export interface CandidateRecord {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'REGISTERED' | 'APPLIED' | 'SELECTED' | 'JOINED';
}

export interface JobApplicationRecord {
  id: string;
  applicationNumber: string;
  candidateId: string;
  vacancyId: string;
  screeningScore: number;
  testScore: number;
  interviewScore: number;
  experienceScore: number;
  meritScore: number;
  status: 'SUBMITTED' | 'SHORTLISTED' | 'SELECTED' | 'OFFERED' | 'JOINED' | 'REJECTED';
}

export interface JobOfferRecord {
  id: string;
  applicationId: string;
  candidateId: string;
  offeredSalaryMonthly: number;
  joiningDeadline: string;
  status: 'ISSUED' | 'ACCEPTED' | 'DECLINED';
}

class RecruitmentSelectionGovernanceService {
  private static instance: RecruitmentSelectionGovernanceService;

  private positions: PositionRecord[] = [
    {
      id: 'pos-cse-prof',
      positionCode: 'POS-CSE-PROF-01',
      designationTitle: 'Professor - Computer Science',
      departmentId: 'dept-cse',
      sanctionedStrength: 5,
      activeEmployeeCount: 3
    }
  ];

  private vacancies: VacancyRecord[] = [
    {
      id: 'vac-01',
      positionId: 'pos-cse-prof',
      vacancyCode: 'VAC-2026-CSE-01',
      numberOfPosts: 2,
      status: 'OPEN'
    }
  ];

  private candidates: CandidateRecord[] = [
    { id: 'cand-01', candidateCode: 'CAND-2026-001', fullName: 'Dr. Aarav Mehta', email: 'aarav.mehta@example.com', phone: '+91 9876543210', status: 'APPLIED' },
    { id: 'cand-02', candidateCode: 'CAND-2026-002', fullName: 'Dr. Sunita Sharma', email: 'sunita.sharma@example.com', phone: '+91 9876543211', status: 'APPLIED' },
    { id: 'cand-03', candidateCode: 'CAND-2026-003', fullName: 'Dr. Vikram Patel', email: 'vikram.patel@example.com', phone: '+91 9876543212', status: 'APPLIED' }
  ];

  private applications: JobApplicationRecord[] = [
    { id: 'app-01', applicationNumber: 'REC-2026-000101', candidateId: 'cand-01', vacancyId: 'vac-01', screeningScore: 90, testScore: 85, interviewScore: 90, experienceScore: 95, meritScore: 0, status: 'SUBMITTED' },
    { id: 'app-02', applicationNumber: 'REC-2026-000102', candidateId: 'cand-02', vacancyId: 'vac-01', screeningScore: 85, testScore: 80, interviewScore: 85, experienceScore: 80, meritScore: 0, status: 'SUBMITTED' },
    { id: 'app-03', applicationNumber: 'REC-2026-000103', candidateId: 'cand-03', vacancyId: 'vac-01', screeningScore: 70, testScore: 65, interviewScore: 70, experienceScore: 60, meritScore: 0, status: 'SUBMITTED' }
  ];

  private offers: JobOfferRecord[] = [];

  private constructor() {}

  public static getInstance(): RecruitmentSelectionGovernanceService {
    if (!RecruitmentSelectionGovernanceService.instance) {
      RecruitmentSelectionGovernanceService.instance = new RecruitmentSelectionGovernanceService();
    }
    return RecruitmentSelectionGovernanceService.instance;
  }

  // ─── POSITION STRENGTH & VACANCY CALCULATION ──────────────────────────

  public getPositionVacancyStrength(positionId: string): {
    sanctionedStrength: number;
    activeEmployeeCount: number;
    vacantPositionsCount: number;
  } {
    const pos = this.positions.find(p => p.id === positionId);
    if (!pos) throw new Error(`Position ${positionId} not found`);

    const vacantPositionsCount = pos.sanctionedStrength - pos.activeEmployeeCount;
    return {
      sanctionedStrength: pos.sanctionedStrength,
      activeEmployeeCount: pos.activeEmployeeCount,
      vacantPositionsCount: Math.max(0, vacantPositionsCount)
    };
  }

  // ─── MERIT CALCULATION ENGINE ─────────────────────────────────────────

  public computeMeritList(vacancyId: string, weights = { test: 0.4, interview: 0.4, experience: 0.2 }): JobApplicationRecord[] {
    const vacancyApps = this.applications.filter(a => a.vacancyId === vacancyId);

    vacancyApps.forEach(app => {
      app.meritScore = Math.round(
        app.testScore * weights.test +
        app.interviewScore * weights.interview +
        app.experienceScore * weights.experience
      );
    });

    // Sort descending by merit score
    return vacancyApps.sort((a, b) => b.meritScore - a.meritScore);
  }

  // ─── SELECTION & OFFER GOVERNANCE ─────────────────────────────────────

  public issueOfferToSelectedCandidate(params: {
    applicationId: string;
    offeredSalaryMonthly: number;
    joiningDeadline: string;
  }): JobOfferRecord {
    const app = this.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    const vacancy = this.vacancies.find(v => v.id === app.vacancyId);
    if (!vacancy) throw new Error(`Vacancy ${app.vacancyId} not found`);

    // Check vacancy ceiling
    const existingOffers = this.offers.filter(o => {
      const parentApp = this.applications.find(a => a.id === o.applicationId);
      return parentApp?.vacancyId === app.vacancyId && o.status !== 'DECLINED';
    });

    if (existingOffers.length >= vacancy.numberOfPosts) {
      throw new Error(`Cannot issue offer: Selection ceiling reached (${vacancy.numberOfPosts} posts approved)`);
    }

    app.status = 'OFFERED';

    const newOffer: JobOfferRecord = {
      id: `off-${Date.now()}`,
      applicationId: params.applicationId,
      candidateId: app.candidateId,
      offeredSalaryMonthly: params.offeredSalaryMonthly,
      joiningDeadline: params.joiningDeadline,
      status: 'ISSUED'
    };

    this.offers.push(newOffer);
    return newOffer;
  }

  // ─── CANDIDATE TO EMPLOYEE CONVERSION ─────────────────────────────────

  public confirmJoiningAndConvertToEmployee(offerId: string): {
    candidateId: string;
    employeeCode: string;
    status: 'JOINED';
  } {
    const offer = this.offers.find(o => o.id === offerId);
    if (!offer) throw new Error(`Offer ${offerId} not found`);

    offer.status = 'ACCEPTED';
    const app = this.applications.find(a => a.id === offer.applicationId);
    if (app) app.status = 'JOINED';

    const cand = this.candidates.find(c => c.id === offer.candidateId);
    if (cand) cand.status = 'JOINED';

    // Increment active position count
    const pos = this.positions.find(p => p.id === 'pos-cse-prof');
    if (pos) pos.activeEmployeeCount += 1;

    return {
      candidateId: offer.candidateId,
      employeeCode: `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'JOINED'
    };
  }
}

export const recruitmentSelectionGovernanceService = RecruitmentSelectionGovernanceService.getInstance();
