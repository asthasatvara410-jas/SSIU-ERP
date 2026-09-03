import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type ApplicantStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'SELECTED' | 'OFFERED' | 'ADMITTED' | 'REJECTED' | 'WITHDRAWN';
export type AdmissionOfferStatus = 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type LifecycleStage = 'APPLICANT' | 'ADMITTED' | 'ENROLLED' | 'ACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED' | 'ALUMNI';

export interface AdmissionCycleRecord {
  id: string;
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
}

export interface ApplicantRecord {
  id: string;
  personId: string;
  applicationNumber: string;
  admissionCycleId: string;
  fullName: string;
  email: string;
  phone: string;
  appliedProgramId: string;
  appliedDepartmentId: string;
  appliedInstituteId: string;
  status: ApplicantStatus;
  createdAt: string;
}

export interface AdmissionOfferRecord {
  id: string;
  offerNumber: string;
  applicantId: string;
  programId: string;
  issueDate: string;
  expiryDate: string;
  status: AdmissionOfferStatus;
}

export interface GraduationRecord {
  id: string;
  studentId: string;
  programId: string;
  graduationYear: number;
  totalCreditsEarned: number;
  finalCgpa: number;
  degreeAwarded: string;
  status: 'ELIGIBLE' | 'APPROVED' | 'GRADUATED';
}

export interface AlumniProfileRecord {
  id: string;
  studentId: string;
  fullName: string;
  graduationYear: number;
  programName: string;
  currentCompany?: string;
  currentDesignation?: string;
  contactEmail: string;
}

class AdmissionLifecycleGovernanceService {
  private static instance: AdmissionLifecycleGovernanceService;

  private cycles: AdmissionCycleRecord[] = [
    { id: 'cycle-2026-27', name: 'Academic Session 2026–27 Undergraduate & Postgraduate Admissions', academicYearId: 'ay-2026-27', startDate: '2026-03-01', endDate: '2026-08-31', status: 'OPEN' }
  ];

  private applicants: ApplicantRecord[] = [
    {
      id: 'app-001',
      personId: 'per-001',
      applicationNumber: 'APP-2026-000101',
      admissionCycleId: 'cycle-2026-27',
      fullName: 'Vikram Mehta',
      email: 'vikram.mehta@gmail.com',
      phone: '+91 9898012345',
      appliedProgramId: 'prog-1',
      appliedDepartmentId: 'dept-1',
      appliedInstituteId: 'inst-1',
      status: 'OFFERED',
      createdAt: '2026-05-10T10:00:00Z'
    }
  ];

  private offers: AdmissionOfferRecord[] = [
    {
      id: 'ofr-001',
      offerNumber: 'OFR-SSIU-2026-0881',
      applicantId: 'app-001',
      programId: 'prog-1',
      issueDate: '2026-06-01',
      expiryDate: '2026-06-15',
      status: 'ISSUED'
    }
  ];

  private graduations: GraduationRecord[] = [];
  private alumniProfiles: AlumniProfileRecord[] = [];

  private constructor() {}

  public static getInstance(): AdmissionLifecycleGovernanceService {
    if (!AdmissionLifecycleGovernanceService.instance) {
      AdmissionLifecycleGovernanceService.instance = new AdmissionLifecycleGovernanceService();
    }
    return AdmissionLifecycleGovernanceService.instance;
  }

  // ─── APPLICANT & OFFER WORKFLOW ────────────────────────────────────────

  public acceptAdmissionOffer(offerId: string): { applicant: ApplicantRecord; offer: AdmissionOfferRecord; newStudentId: string } {
    const offer = this.offers.find(o => o.id === offerId);
    if (!offer) throw new Error(`Offer ${offerId} not found`);

    offer.status = 'ACCEPTED';

    const applicant = this.applicants.find(a => a.id === offer.applicantId);
    if (!applicant) throw new Error(`Applicant ${offer.applicantId} not found`);

    applicant.status = 'ADMITTED';

    // Generates official enrolled student
    const newStudentId = `stu-adm-${Date.now()}`;
    db.getState().students.push({
      id: newStudentId,
      name: applicant.fullName,
      email: `${newStudentId}@student.ssiu.ac.in`,
      phone: applicant.phone,
      enrollmentNo: `ENR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      instituteId: applicant.appliedInstituteId,
      departmentId: applicant.appliedDepartmentId,
      programId: applicant.appliedProgramId,
      batchId: 'batch-cse-2026',
      semesterId: 'sem-1',
      divisionId: 'div-cse-a',
      gender: 'Male',
      guardianName: 'Parent / Guardian',
      guardianPhone: applicant.phone,
      status: 'ACTIVE',
      mentorName: 'Prof. Faculty Mentor'
    });

    return { applicant, offer, newStudentId };
  }

  // ─── GRADUATION & ALUMNI TRANSITION ────────────────────────────────────

  public graduateStudent(graduation: Omit<GraduationRecord, 'id' | 'status'>): { graduation: GraduationRecord; alumni: AlumniProfileRecord } {
    const student = db.getStudents().find(s => s.id === graduation.studentId);
    if (!student) throw new Error(`Student ${graduation.studentId} not found`);

    const gradRecord: GraduationRecord = {
      id: `grad-${Date.now()}`,
      ...graduation,
      status: 'GRADUATED'
    };
    this.graduations.push(gradRecord);

    student.status = 'INACTIVE'; // Officially transitioned to Alumni

    const alumniRecord: AlumniProfileRecord = {
      id: `alm-${Date.now()}`,
      studentId: student.id,
      fullName: student.name,
      graduationYear: graduation.graduationYear,
      programName: 'B.Tech Computer Science & Engineering',
      contactEmail: student.email || 'alumni@ssiu.ac.in'
    };
    this.alumniProfiles.push(alumniRecord);

    return { graduation: gradRecord, alumni: alumniRecord };
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getApplicantById(applicantId: string, context?: UserAuthorizationContext): ApplicantRecord | undefined {
    // RBAC: If student/applicant, only allow self
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== applicantId) {
      return undefined;
    }
    return this.applicants.find(a => a.id === applicantId);
  }
}

export const admissionLifecycleGovernanceService = AdmissionLifecycleGovernanceService.getInstance();
