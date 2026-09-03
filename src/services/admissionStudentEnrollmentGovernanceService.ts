import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralFinanceGovernanceService } from './centralFinanceGovernanceService';

export interface ProgramIntakeRecord {
  id: string;
  programId: string;
  programName: string;
  sessionId: string;
  totalIntakeSeats: number;
  confirmedAdmissionsCount: number;
}

export interface CandidateApplicantRecord {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface AdmissionApplicationRecord {
  id: string;
  applicationNumber: string;
  candidateId: string;
  programIntakeId: string;
  meritRank: number;
  status: 'SUBMITTED' | 'ELIGIBLE' | 'SHORTLISTED' | 'OFFERED' | 'CONFIRMED' | 'CANCELLED';
}

export interface StudentMasterCreationRecord {
  studentId: string;
  applicationId: string;
  enrollmentNumber: string;
  rollNumber: string;
  programName: string;
  batchName: string;
  sectionName: string;
  admissionStatus: 'CONFIRMED' | 'ACTIVE';
}

class AdmissionStudentEnrollmentGovernanceService {
  private static instance: AdmissionStudentEnrollmentGovernanceService;

  private intakes: ProgramIntakeRecord[] = [
    {
      id: 'intake-bca-2026',
      programId: 'prog-bca',
      programName: 'Bachelor of Computer Applications (BCA)',
      sessionId: 'sess-2026-27',
      totalIntakeSeats: 60,
      confirmedAdmissionsCount: 58
    }
  ];

  private candidates: CandidateApplicantRecord[] = [
    { id: 'cand-app-01', candidateCode: 'CAND-ADM-001', fullName: 'Rajesh Patel', email: 'rajesh.patel@example.com', phone: '+91 9898012345' },
    { id: 'cand-app-02', candidateCode: 'CAND-ADM-002', fullName: 'Priya Shah', email: 'priya.shah@example.com', phone: '+91 9898012346' },
    { id: 'cand-app-03', candidateCode: 'CAND-ADM-003', fullName: 'Kavita Joshi', email: 'kavita.joshi@example.com', phone: '+91 9898012347' }
  ];

  private applications: AdmissionApplicationRecord[] = [
    { id: 'adm-app-01', applicationNumber: 'ADM-2026-000101', candidateId: 'cand-app-01', programIntakeId: 'intake-bca-2026', meritRank: 1, status: 'OFFERED' },
    { id: 'adm-app-02', applicationNumber: 'ADM-2026-000102', candidateId: 'cand-app-02', programIntakeId: 'intake-bca-2026', meritRank: 2, status: 'OFFERED' },
    { id: 'adm-app-03', applicationNumber: 'ADM-2026-000103', candidateId: 'cand-app-03', programIntakeId: 'intake-bca-2026', meritRank: 3, status: 'SHORTLISTED' }
  ];

  private enrolledStudents: StudentMasterCreationRecord[] = [];

  private constructor() {}

  public static getInstance(): AdmissionStudentEnrollmentGovernanceService {
    if (!AdmissionStudentEnrollmentGovernanceService.instance) {
      AdmissionStudentEnrollmentGovernanceService.instance = new AdmissionStudentEnrollmentGovernanceService();
    }
    return AdmissionStudentEnrollmentGovernanceService.instance;
  }

  // ─── DYNAMIC SEAT AVAILABILITY DERIVATION ─────────────────────────────

  public getSeatAvailability(programIntakeId: string): {
    totalIntakeSeats: number;
    confirmedAdmissionsCount: number;
    availableSeatsCount: number;
  } {
    const intake = this.intakes.find(i => i.id === programIntakeId);
    if (!intake) throw new Error(`Program intake ${programIntakeId} not found`);

    const availableSeatsCount = intake.totalIntakeSeats - intake.confirmedAdmissionsCount;
    return {
      totalIntakeSeats: intake.totalIntakeSeats,
      confirmedAdmissionsCount: intake.confirmedAdmissionsCount,
      availableSeatsCount: Math.max(0, availableSeatsCount)
    };
  }

  // ─── ADMISSION CONFIRMATION & STUDENT MASTER CREATION ─────────────────

  public confirmAdmissionAndCreateStudent(params: {
    applicationId: string;
    batchName: string;
    sectionName: string;
  }): StudentMasterCreationRecord {
    const app = this.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    const intake = this.intakes.find(i => i.id === app.programIntakeId);
    if (!intake) throw new Error(`Intake ${app.programIntakeId} not found`);

    const { availableSeatsCount } = this.getSeatAvailability(app.programIntakeId);
    if (availableSeatsCount <= 0) {
      throw new Error(`Cannot confirm admission: Intake capacity full (0 seats available for ${intake.programName})`);
    }

    // Check if already confirmed
    const existingStudent = this.enrolledStudents.find(s => s.applicationId === params.applicationId);
    if (existingStudent) {
      throw new Error(`Student already created for application ${params.applicationId} (${existingStudent.enrollmentNumber})`);
    }

    app.status = 'CONFIRMED';
    intake.confirmedAdmissionsCount += 1;

    const seq = intake.confirmedAdmissionsCount;
    const enrollmentNumber = `SSIU26BCA${seq.toString().padStart(6, '0')}`;
    const rollNumber = `BCA-26-${params.sectionName}-${seq.toString().padStart(2, '0')}`;

    const newStudent: StudentMasterCreationRecord = {
      studentId: `stud-master-${Date.now()}`,
      applicationId: params.applicationId,
      enrollmentNumber,
      rollNumber,
      programName: intake.programName,
      batchName: params.batchName,
      sectionName: params.sectionName,
      admissionStatus: 'ACTIVE'
    };

    this.enrolledStudents.push(newStudent);
    return newStudent;
  }
}

export const admissionStudentEnrollmentGovernanceService = AdmissionStudentEnrollmentGovernanceService.getInstance();
