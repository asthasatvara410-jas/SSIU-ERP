import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'FOLLOW_UP' | 'CONVERTED' | 'CLOSED';
export type AdmissionOfferStatus = 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'EXPIRED' | 'DECLINED' | 'CANCELLED';

export interface AdmissionCycleRecord {
  id: string;
  name: string;
  academicYearId: string;
  applicationOpenDate: string;
  applicationCloseDate: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
}

export interface AdmissionEnquiryRecord {
  id: string;
  personName: string;
  email: string;
  phone: string;
  interestedProgramId: string;
  source: 'WEBSITE' | 'WALK_IN' | 'PHONE' | 'CAMPAIGN';
  assignedCounselorId?: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface AdmissionSeatMatrixRecord {
  id: string;
  admissionCycleId: string;
  programId: string;
  totalSeats: number;
  allocatedSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

export interface AdmissionOfferLetterRecord {
  id: string;
  offerNumber: string;
  applicationId: string;
  programId: string;
  allocatedCategory: string;
  issueDate: string;
  expiryDate: string;
  status: AdmissionOfferStatus;
}

export interface StudentConversionResult {
  studentId: string;
  studentNumber: string;
  universityEnrollmentNumber: string;
  personId: string;
  programId: string;
  academicYearId: string;
  status: 'ACTIVE';
}

class AdmissionEnquiryLifecycleGovernanceService {
  private static instance: AdmissionEnquiryLifecycleGovernanceService;

  private cycles: AdmissionCycleRecord[] = [
    {
      id: 'adm-cycle-2026-ug',
      name: 'SSIU UG Admissions 2026-27',
      academicYearId: 'ay-2026-27',
      applicationOpenDate: '2026-03-01',
      applicationCloseDate: '2026-08-15',
      status: 'OPEN'
    }
  ];

  private enquiries: AdmissionEnquiryRecord[] = [
    {
      id: 'enq-01',
      personName: 'Rohan Mehta',
      email: 'rohan.mehta@gmail.com',
      phone: '+91 9898012345',
      interestedProgramId: 'prog-1',
      source: 'WEBSITE',
      assignedCounselorId: 'emp-counselor-01',
      status: 'NEW',
      createdAt: '2026-06-01T09:00:00Z'
    }
  ];

  private seatMatrices: AdmissionSeatMatrixRecord[] = [
    {
      id: 'sm-btech-cse-2026',
      admissionCycleId: 'adm-cycle-2026-ug',
      programId: 'prog-1',
      totalSeats: 120,
      allocatedSeats: 80,
      confirmedSeats: 70,
      availableSeats: 40 // 120 - 80 = 40
    }
  ];

  private offers: AdmissionOfferLetterRecord[] = [
    {
      id: 'off-01',
      offerNumber: 'OFF-2026-000412',
      applicationId: 'adm-app-2026-001',
      programId: 'prog-1',
      allocatedCategory: 'GENERAL',
      issueDate: '2026-07-01',
      expiryDate: '2026-07-15',
      status: 'ISSUED'
    }
  ];

  private constructor() {}

  public static getInstance(): AdmissionEnquiryLifecycleGovernanceService {
    if (!AdmissionEnquiryLifecycleGovernanceService.instance) {
      AdmissionEnquiryLifecycleGovernanceService.instance = new AdmissionEnquiryLifecycleGovernanceService();
    }
    return AdmissionEnquiryLifecycleGovernanceService.instance;
  }

  // ─── SEAT INVENTORY & ALLOCATION ENGINE ───────────────────────────────

  public allocateSeat(params: {
    admissionCycleId: string;
    programId: string;
  }): AdmissionSeatMatrixRecord {
    const matrix = this.seatMatrices.find(m => m.admissionCycleId === params.admissionCycleId && m.programId === params.programId);
    if (!matrix) throw new Error(`Seat matrix not found for program ${params.programId}`);

    if (matrix.availableSeats <= 0) {
      throw new Error(`No available seats remaining in program ${params.programId}`);
    }

    matrix.allocatedSeats += 1;
    matrix.availableSeats = matrix.totalSeats - matrix.allocatedSeats;
    return matrix;
  }

  // ─── OFFER ACCEPTANCE & STUDENT CONVERSION ─────────────────────────────

  public acceptOfferAndCreateStudent(params: {
    offerId: string;
    personId: string;
    programId: string;
    academicYearId: string;
  }): StudentConversionResult {
    const offer = this.offers.find(o => o.id === params.offerId);
    if (!offer) throw new Error(`Offer ${params.offerId} not found`);

    if (offer.status !== 'ISSUED') {
      throw new Error(`Offer ${params.offerId} cannot be accepted because status is ${offer.status}`);
    }

    offer.status = 'ACCEPTED';

    // Update seat matrix
    const matrix = this.seatMatrices.find(m => m.programId === params.programId);
    if (matrix) {
      matrix.confirmedSeats += 1;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return {
      studentId: `stud-${randomSuffix}`,
      studentNumber: `STU-2026-${randomSuffix}`,
      universityEnrollmentNumber: `UNI-2026-${randomSuffix}`,
      personId: params.personId,
      programId: params.programId,
      academicYearId: params.academicYearId,
      status: 'ACTIVE'
    };
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getEnquirySummary(context?: UserAuthorizationContext): {
    totalEnquiries: number;
    newEnquiries: number;
    cycles: AdmissionCycleRecord[];
    seatMatrices: AdmissionSeatMatrixRecord[];
  } {
    return {
      totalEnquiries: this.enquiries.length,
      newEnquiries: this.enquiries.filter(e => e.status === 'NEW').length,
      cycles: this.cycles,
      seatMatrices: this.seatMatrices
    };
  }
}

export const admissionEnquiryLifecycleGovernanceService = AdmissionEnquiryLifecycleGovernanceService.getInstance();
