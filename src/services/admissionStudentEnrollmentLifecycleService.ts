import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralFinanceGovernanceService } from './centralFinanceGovernanceService';

export interface AdmissionSeatMatrixRecord {
  id: string;
  programId: string;
  programName: string;
  admissionSession: string;
  sanctionedSeats: number;
  filledSeats: number;
  availableSeats: number;
}

export interface ApplicantMasterRecord {
  id: string;
  applicantCode: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface AdmissionApplicationDossierRecord {
  id: string;
  applicationNumber: string;
  applicantId: string;
  programId: string;
  academicPercentage: number;
  entranceExamScore: number;
  interviewScore: number;
  compositeMeritScore: number;
  documentVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE';
  ineligibilityReason?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'SHORTLISTED' | 'OFFERED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
}

export interface ConfirmedStudentMasterRecord {
  studentId: string;
  applicationId: string;
  applicantId: string;
  fullName: string;
  programName: string;
  enrollmentNumber: string;
  rollNumber: string;
  batchName: string;
  sectionName: string;
  admissionDate: string;
  academicStatus: 'ACTIVE';
}

class AdmissionStudentEnrollmentLifecycleService {
  private static instance: AdmissionStudentEnrollmentLifecycleService;

  private seatMatrices: AdmissionSeatMatrixRecord[] = [
    {
      id: 'matrix-bca-2026',
      programId: 'prog-bca',
      programName: 'Bachelor of Computer Applications (BCA)',
      admissionSession: '2026-2027',
      sanctionedSeats: 60,
      filledSeats: 58,
      availableSeats: 2
    }
  ];

  private applicants: ApplicantMasterRecord[] = [
    { id: 'app-user-01', applicantCode: 'APPL-2026-001', fullName: 'Harshil Varma', email: 'harshil.v@example.com', phone: '+91 9898011223', dateOfBirth: '2005-04-12' },
    { id: 'app-user-02', applicantCode: 'APPL-2026-002', fullName: 'Riya Shah', email: 'riya.s@example.com', phone: '+91 9898011224', dateOfBirth: '2005-08-19' }
  ];

  private applications: AdmissionApplicationDossierRecord[] = [
    {
      id: 'app-doc-01',
      applicationNumber: 'APP-2026-000101',
      applicantId: 'app-user-01',
      programId: 'prog-bca',
      academicPercentage: 88,
      entranceExamScore: 84,
      interviewScore: 90,
      compositeMeritScore: 86.9, // 0.5*88 + 0.35*84 + 0.15*90 = 44 + 29.4 + 13.5 = 86.9
      documentVerificationStatus: 'VERIFIED',
      eligibilityStatus: 'ELIGIBLE',
      status: 'OFFERED'
    }
  ];

  private confirmedStudents: ConfirmedStudentMasterRecord[] = [];

  private constructor() {}

  public static getInstance(): AdmissionStudentEnrollmentLifecycleService {
    if (!AdmissionStudentEnrollmentLifecycleService.instance) {
      AdmissionStudentEnrollmentLifecycleService.instance = new AdmissionStudentEnrollmentLifecycleService();
    }
    return AdmissionStudentEnrollmentLifecycleService.instance;
  }

  // ─── DYNAMIC MERIT CALCULATION ENGINE ─────────────────────────────────

  public calculateCompositeMerit(academicPct: number, entranceScore: number, interviewScore: number): number {
    const composite = (0.50 * academicPct) + (0.35 * entranceScore) + (0.15 * interviewScore);
    return Number(composite.toFixed(2));
  }

  // ─── DYNAMIC SEAT AVAILABILITY DERIVATION ─────────────────────────────

  public getSeatAvailability(programId: string): AdmissionSeatMatrixRecord {
    const matrix = this.seatMatrices.find(m => m.programId === programId);
    if (!matrix) throw new Error(`Seat matrix for program ${programId} not found`);

    matrix.availableSeats = Math.max(0, matrix.sanctionedSeats - matrix.filledSeats);
    return matrix;
  }

  // ─── ADMISSION CONFIRMATION & CANONICAL STUDENT CREATION ──────────────

  public confirmAdmissionAndInstantiateStudent(params: {
    applicationId: string;
    batchName: string;
    sectionName: string;
  }): ConfirmedStudentMasterRecord {
    const app = this.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    if (app.documentVerificationStatus !== 'VERIFIED') {
      throw new Error(`Cannot confirm admission: Document verification is ${app.documentVerificationStatus}`);
    }
    if (app.eligibilityStatus !== 'ELIGIBLE') {
      throw new Error(`Cannot confirm admission: Applicant is ineligible (${app.ineligibilityReason || 'Criteria unmet'})`);
    }

    const seatMatrix = this.getSeatAvailability(app.programId);
    if (seatMatrix.availableSeats <= 0) {
      throw new Error(`Cannot confirm admission: Sanctioned seats full for ${seatMatrix.programName}`);
    }

    const applicant = this.applicants.find(a => a.id === app.applicantId);
    if (!applicant) throw new Error(`Applicant ${app.applicantId} not found`);

    // Check duplicate student
    const existing = this.confirmedStudents.find(s => s.applicationId === params.applicationId);
    if (existing) {
      throw new Error(`Student record already created for application ${params.applicationId} (${existing.enrollmentNumber})`);
    }

    app.status = 'CONFIRMED';
    seatMatrix.filledSeats += 1;
    seatMatrix.availableSeats = seatMatrix.sanctionedSeats - seatMatrix.filledSeats;

    const seq = seatMatrix.filledSeats;
    const enrollmentNumber = `SSIU26BCA${seq.toString().padStart(6, '0')}`;
    const rollNumber = `BCA-26-${params.sectionName}-${seq.toString().padStart(2, '0')}`;

    const student: ConfirmedStudentMasterRecord = {
      studentId: `stud-${Date.now()}`,
      applicationId: app.id,
      applicantId: applicant.id,
      fullName: applicant.fullName,
      programName: seatMatrix.programName,
      enrollmentNumber,
      rollNumber,
      batchName: params.batchName,
      sectionName: params.sectionName,
      admissionDate: new Date().toISOString().split('T')[0],
      academicStatus: 'ACTIVE'
    };

    this.confirmedStudents.push(student);
    return student;
  }
}

export const admissionStudentEnrollmentLifecycleService = AdmissionStudentEnrollmentLifecycleService.getInstance();
