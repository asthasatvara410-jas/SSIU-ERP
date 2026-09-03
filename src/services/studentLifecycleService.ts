import { db } from './db';
import { academicStructureService } from './academicStructureService';
import { dossierCompletenessService, UniversalDossierPayload } from './dossierCompletenessService';
import {
  Student, UserAuthorizationContext, UserRole
} from '../types';

export type ApplicantStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'ADMITTED';
export type StudentLifecycleStatus = 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED' | 'ALUMNI';

export interface ApplicantRecord {
  id: string;
  applicationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  academicYearId: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  status: ApplicantStatus;
  applicationDate: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
}

export interface StudentTransferRecord {
  id: string;
  studentId: string;
  fromInstituteId: string;
  fromDepartmentId: string;
  fromProgramId: string;
  toInstituteId: string;
  toDepartmentId: string;
  toProgramId: string;
  effectiveDate: string;
  reason: string;
  approvedByUserId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface StudentProgramChangeRecord {
  id: string;
  studentId: string;
  oldProgramId: string;
  newProgramId: string;
  effectiveDate: string;
  reason: string;
  approvedByUserId: string;
}

export interface StudentWithdrawalRecord {
  id: string;
  studentId: string;
  reason: string;
  withdrawalDate: string;
  approvedByUserId: string;
  status: 'PROCESSED';
}

export interface StudentDossier360Payload {
  student: Student;
  currentEnrollment: {
    programName: string;
    departmentName: string;
    instituteName: string;
    batchName: string;
    academicYear: string;
    semester: number;
    division: string;
    mentorName: string;
  };
  enrollmentHistory: Array<{
    academicYear: string;
    semester: number;
    status: string;
  }>;
  attendanceSummary: {
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
  };
  academicSummary: {
    sgpa: number;
    cgpa: number;
    backlogs: number;
  };
  feeSummary: {
    totalDue: number;
    totalPaid: number;
    pendingAmount: number;
    status: 'PAID' | 'PENDING' | 'PARTIAL';
  };
  dossierDocuments: UniversalDossierPayload;
  timelineEvents: Array<{
    title: string;
    date: string;
    category: string;
  }>;
}

class StudentLifecycleService {
  private static instance: StudentLifecycleService;

  private applicants: ApplicantRecord[] = [
    {
      id: 'app-2026-001',
      applicationNumber: 'APP-SSIU-2026-001',
      fullName: 'Rohan Sharma',
      email: 'rohan.sharma@gmail.com',
      phone: '+91 9876543210',
      academicYearId: 'ay-2026-27',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      programId: 'prog-1',
      status: 'APPROVED',
      applicationDate: '2026-06-15T10:00:00Z',
      verifiedAt: '2026-06-20T14:00:00Z',
      verifiedByUserId: 'usr-admin-01'
    }
  ];

  private transfers: StudentTransferRecord[] = [];
  private programChanges: StudentProgramChangeRecord[] = [];
  private withdrawals: StudentWithdrawalRecord[] = [];

  private constructor() {}

  public static getInstance(): StudentLifecycleService {
    if (!StudentLifecycleService.instance) {
      StudentLifecycleService.instance = new StudentLifecycleService();
    }
    return StudentLifecycleService.instance;
  }

  // ─── APPLICANT TO STUDENT CONVERSION ────────────────────────────────────

  public admitApplicant(applicationId: string): { student: Student; enrollmentId: string } {
    const applicant = this.applicants.find(a => a.id === applicationId);
    if (!applicant) throw new Error(`Applicant ${applicationId} not found`);
    if (applicant.status !== 'APPROVED') {
      throw new Error(`Cannot admit applicant with status: ${applicant.status}. Must be APPROVED.`);
    }

    applicant.status = 'ADMITTED';

    const newStudentId = `stud-${Date.now().toString().slice(-4)}`;
    const newEnrollmentNo = `SSIU26CS${Math.floor(100 + Math.random() * 900)}`;

    const newStudent: Student = {
      id: newStudentId,
      name: applicant.fullName,
      email: `${newStudentId}@student.ssiu.ac.in`,
      phone: applicant.phone,
      enrollmentNo: newEnrollmentNo,
      departmentId: applicant.departmentId,
      instituteId: applicant.instituteId,
      programId: applicant.programId,
      batchId: 'batch-cse-2026',
      semesterId: 'sem-1',
      divisionId: 'div-cse-a',
      gender: 'Male',
      guardianName: 'Guardian Name',
      guardianPhone: applicant.phone,
      status: 'ACTIVE',
      mentorName: 'Prof. Mentor'
    };

    // Add to DB store
    db.getState().students.push(newStudent);

    // Initial academic enrollment record
    const enrollmentId = `enr-${newStudentId}-sem1`;

    return { student: newStudent, enrollmentId };
  }

  // ─── STUDENT TRANSFERS & LIFECYCLE ──────────────────────────────────────

  public transferStudent(transfer: Omit<StudentTransferRecord, 'id' | 'status'>): StudentTransferRecord {
    const record: StudentTransferRecord = {
      id: `tr-${Date.now()}`,
      ...transfer,
      status: 'APPROVED'
    };

    this.transfers.push(record);

    // Update active student master
    const student = db.getStudents().find(s => s.id === transfer.studentId);
    if (student) {
      student.instituteId = transfer.toInstituteId;
      student.departmentId = transfer.toDepartmentId;
      student.programId = transfer.toProgramId;
    }

    return record;
  }

  public withdrawStudent(withdrawal: Omit<StudentWithdrawalRecord, 'id' | 'status'>): StudentWithdrawalRecord {
    const record: StudentWithdrawalRecord = {
      id: `wd-${Date.now()}`,
      ...withdrawal,
      status: 'PROCESSED'
    };

    this.withdrawals.push(record);

    const student = db.getStudents().find(s => s.id === withdrawal.studentId);
    if (student) {
      student.status = 'INACTIVE';
    }

    return record;
  }

  // ─── STUDENT 360 DOSSIER ASSEMBLY ───────────────────────────────────────

  public getStudentDossier360(studentId: string, context?: UserAuthorizationContext): StudentDossier360Payload | undefined {
    // RBAC: If Student role, ensure user only accesses self dossier
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    const student = db.getStudents().find(s => s.id === studentId || (s as any).studentId === studentId);
    if (!student) return undefined;

    const institute = db.getInstitutes().find(i => i.id === student.instituteId);
    const department = db.getDepartments().find(d => d.id === student.departmentId);
    const program = db.getPrograms().find(p => p.id === student.programId);

    const dossierDocs = dossierCompletenessService.getDossier('STUDENT', student.id, context);

    return {
      student,
      currentEnrollment: {
        programName: program?.name || 'B.Tech Computer Science & Engineering',
        departmentName: department?.name || 'Computer Science & Engineering',
        instituteName: institute?.name || 'Swarrnim Institute of Technology',
        batchName: 'Batch 2026-2030',
        academicYear: '2026–2027',
        semester: 3,
        division: student.divisionId || 'CSE-A',
        mentorName: student.mentorName || 'Prof. Rajesh Patel'
      },
      enrollmentHistory: [
        { academicYear: '2025–2026', semester: 1, status: 'COMPLETED' },
        { academicYear: '2025–2026', semester: 2, status: 'COMPLETED' },
        { academicYear: '2026–2027', semester: 3, status: 'ACTIVE' }
      ],
      attendanceSummary: {
        totalSessions: 6,
        attendedSessions: 4,
        percentage: 67
      },
      academicSummary: {
        sgpa: 8.5,
        cgpa: 8.4,
        backlogs: 0
      },
      feeSummary: {
        totalDue: 65000,
        totalPaid: 65000,
        pendingAmount: 0,
        status: 'PAID'
      },
      dossierDocuments: dossierDocs!,
      timelineEvents: [
        { title: 'Admitted into B.Tech CSE', date: '2025-07-15', category: 'ADMISSION' },
        { title: 'Document Verification Completed', date: '2025-07-20', category: 'DOCUMENTS' },
        { title: 'Promoted to Semester 3', date: '2026-07-01', category: 'ACADEMIC' },
        { title: 'Exam Form Approved for Winter 2026', date: '2026-08-22', category: 'EXAMINATION' }
      ]
    };
  }

}

export const studentLifecycleService = StudentLifecycleService.getInstance();
