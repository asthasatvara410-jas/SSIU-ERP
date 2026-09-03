import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type StudentLifecycleStatus = 'APPLICANT' | 'ADMITTED' | 'ACTIVE' | 'ON_LEAVE' | 'DETAINED' | 'SUSPENDED' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED' | 'ALUMNI';
export type AdmissionApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'SELECTED' | 'WAITLISTED' | 'REJECTED';

export interface AdmissionApplicationRecord {
  id: string;
  applicationNumber: string;
  personId: string;
  fullName: string;
  email: string;
  phone: string;
  academicYearId: string;
  instituteId: string;
  programId: string;
  preferences: Array<{
    instituteId: string;
    programId: string;
    priority: number;
  }>;
  status: AdmissionApplicationStatus;
  submittedAt: string;
}

export interface StudentSectionEnrollmentRecord {
  id: string;
  studentId: string;
  academicTermId: string;
  sectionName: string;
  rollNumber: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'TRANSFERRED';
}

export interface StudentSemesterPromotionRecord {
  id: string;
  studentId: string;
  fromSemester: number;
  toSemester: number;
  academicYearId: string;
  creditsEarned: number;
  backlogsCount: number;
  decision: 'PROMOTED' | 'DETAINED' | 'CONDITIONAL';
  approvedByUserId: string;
  promotedAt: string;
}

export interface StudentStatusAuditRecord {
  id: string;
  studentId: string;
  oldStatus: StudentLifecycleStatus;
  newStatus: StudentLifecycleStatus;
  reason: string;
  changedByUserId: string;
  effectiveDate: string;
}

class StudentOnboardingLifecycleGovernanceService {
  private static instance: StudentOnboardingLifecycleGovernanceService;

  private applications: AdmissionApplicationRecord[] = [
    {
      id: 'adm-app-2026-001',
      applicationNumber: 'APP-2026-000412',
      personId: 'per-412',
      fullName: 'Kavya Shah',
      email: 'kavya.shah@gmail.com',
      phone: '+91 9712034567',
      academicYearId: 'ay-2026-27',
      instituteId: 'inst-1',
      programId: 'prog-1',
      preferences: [
        { instituteId: 'inst-1', programId: 'prog-1', priority: 1 },
        { instituteId: 'inst-1', programId: 'prog-2', priority: 2 }
      ],
      status: 'VERIFIED',
      submittedAt: '2026-06-01T10:00:00Z'
    }
  ];

  private sectionEnrollments: StudentSectionEnrollmentRecord[] = [
    {
      id: 'sec-enr-01',
      studentId: 'stud-001',
      academicTermId: 'term-2026-sem3',
      sectionName: 'CSE-A',
      rollNumber: '26CSE042',
      effectiveDate: '2026-07-15',
      status: 'ACTIVE'
    }
  ];

  private promotionHistory: StudentSemesterPromotionRecord[] = [
    {
      id: 'prm-stu-01',
      studentId: 'stud-001',
      fromSemester: 2,
      toSemester: 3,
      academicYearId: 'ay-2026-27',
      creditsEarned: 44,
      backlogsCount: 0,
      decision: 'PROMOTED',
      approvedByUserId: 'usr-hod-01',
      promotedAt: '2026-07-01T10:00:00Z'
    }
  ];

  private statusAudits: StudentStatusAuditRecord[] = [
    {
      id: 'sta-01',
      studentId: 'stud-001',
      oldStatus: 'ADMITTED',
      newStatus: 'ACTIVE',
      reason: 'Semester 1 enrollment completed and verified',
      changedByUserId: 'usr-admin-01',
      effectiveDate: '2025-07-20'
    }
  ];

  private constructor() {}

  public static getInstance(): StudentOnboardingLifecycleGovernanceService {
    if (!StudentOnboardingLifecycleGovernanceService.instance) {
      StudentOnboardingLifecycleGovernanceService.instance = new StudentOnboardingLifecycleGovernanceService();
    }
    return StudentOnboardingLifecycleGovernanceService.instance;
  }

  // ─── SECTION ALLOCATION & ROLL NUMBER ASSIGNMENT ───────────────────────

  public assignSectionAndRollNumber(params: {
    studentId: string;
    academicTermId: string;
    sectionName: string;
    rollNumber: string;
  }): StudentSectionEnrollmentRecord {
    // Check if duplicate roll number exists in same term and section
    const conflict = this.sectionEnrollments.find(
      s => s.academicTermId === params.academicTermId && s.sectionName === params.sectionName && s.rollNumber === params.rollNumber && s.studentId !== params.studentId
    );
    if (conflict) throw new Error(`Roll number ${params.rollNumber} is already assigned in section ${params.sectionName}`);

    const newRecord: StudentSectionEnrollmentRecord = {
      id: `sec-enr-${Date.now()}`,
      studentId: params.studentId,
      academicTermId: params.academicTermId,
      sectionName: params.sectionName,
      rollNumber: params.rollNumber,
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    this.sectionEnrollments.push(newRecord);
    return newRecord;
  }

  // ─── SEMESTER PROMOTION ENGINE ─────────────────────────────────────────

  public promoteStudentSemester(params: {
    studentId: string;
    fromSemester: number;
    toSemester: number;
    academicYearId: string;
    creditsEarned: number;
    backlogsCount: number;
    approvedByUserId: string;
  }): StudentSemesterPromotionRecord {
    const isPromoted = params.backlogsCount <= 3;
    const record: StudentSemesterPromotionRecord = {
      id: `prm-${Date.now()}`,
      studentId: params.studentId,
      fromSemester: params.fromSemester,
      toSemester: params.toSemester,
      academicYearId: params.academicYearId,
      creditsEarned: params.creditsEarned,
      backlogsCount: params.backlogsCount,
      decision: isPromoted ? 'PROMOTED' : 'DETAINED',
      approvedByUserId: params.approvedByUserId,
      promotedAt: new Date().toISOString()
    };

    this.promotionHistory.push(record);
    return record;
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getStudentLifecycleSummary(studentId: string, context?: UserAuthorizationContext): {
    sectionEnrollment?: StudentSectionEnrollmentRecord;
    promotions: StudentSemesterPromotionRecord[];
    statusAudits: StudentStatusAuditRecord[];
  } | undefined {
    // RBAC: If student, restrict to self
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    return {
      sectionEnrollment: this.sectionEnrollments.find(s => s.studentId === studentId && s.status === 'ACTIVE'),
      promotions: this.promotionHistory.filter(p => p.studentId === studentId),
      statusAudits: this.statusAudits.filter(a => a.studentId === studentId)
    };
  }
}

export const studentOnboardingLifecycleGovernanceService = StudentOnboardingLifecycleGovernanceService.getInstance();
