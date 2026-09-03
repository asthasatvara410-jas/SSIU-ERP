import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface HostelBedAllocation {
  id: string;
  hostelId: string;
  hostelName: string;
  roomNumber: string;
  bedNumber: string;
  studentId: string;
  academicYearId: string;
  status: 'ALLOCATED' | 'VACATED';
  allocationDate: string;
}

export interface TransportPassRecord {
  id: string;
  passNumber: string;
  studentId: string;
  routeName: string;
  stopName: string;
  academicYearId: string;
  validFrom: string;
  validTo: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface LibraryBookIssueRecord {
  id: string;
  bookCopyId: string;
  accessionNumber: string;
  bookTitle: string;
  studentId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'ISSUED' | 'OVERDUE' | 'RETURNED' | 'LOST';
}

export interface StudentServiceRequestRecord {
  id: string;
  applicationNumber: string;
  studentId: string;
  serviceType: 'BONAFIDE_CERTIFICATE' | 'TRANSCRIPT' | 'ID_CARD_REPLACEMENT' | 'NO_OBJECTION_CERTIFICATE';
  submittedAt: string;
  targetSlaHours: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  assignedToUserId?: string;
  completedAt?: string;
  remarks?: string;
}

class StudentServicesGovernanceService {
  private static instance: StudentServicesGovernanceService;

  private hostelAllocations: HostelBedAllocation[] = [
    {
      id: 'ha-01',
      hostelId: 'host-boys-1',
      hostelName: 'Swarrnim Boys Hostel - Block A',
      roomNumber: 'A-204',
      bedNumber: 'Bed-1',
      studentId: 'stud-001',
      academicYearId: 'ay-2026-27',
      status: 'ALLOCATED',
      allocationDate: '2026-07-20'
    }
  ];

  private transportPasses: TransportPassRecord[] = [
    {
      id: 'tp-01',
      passNumber: 'TP-SSIU-2026-00412',
      studentId: 'stud-001',
      routeName: 'Route 4: Gandhinagar - Sector 21 to SSIU Campus',
      stopName: 'Sector 21 Cross Road',
      academicYearId: 'ay-2026-27',
      validFrom: '2026-07-15',
      validTo: '2027-06-30',
      status: 'ACTIVE'
    }
  ];

  private libraryIssues: LibraryBookIssueRecord[] = [
    {
      id: 'li-01',
      bookCopyId: 'copy-dbms-009',
      accessionNumber: 'ACC-LIB-88912',
      bookTitle: 'Database System Concepts (7th Edition) - Silberschatz',
      studentId: 'stud-001',
      issuedAt: '2026-08-15T11:00:00Z',
      dueDate: '2026-08-30T17:00:00Z',
      status: 'ISSUED'
    }
  ];

  private serviceRequests: StudentServiceRequestRecord[] = [
    {
      id: 'sr-01',
      applicationNumber: 'SSR-2026-00994',
      studentId: 'stud-001',
      serviceType: 'BONAFIDE_CERTIFICATE',
      submittedAt: '2026-08-26T09:30:00Z',
      targetSlaHours: 48,
      status: 'UNDER_REVIEW',
      assignedToUserId: 'usr-student-section-01'
    }
  ];

  private constructor() {}

  public static getInstance(): StudentServicesGovernanceService {
    if (!StudentServicesGovernanceService.instance) {
      StudentServicesGovernanceService.instance = new StudentServicesGovernanceService();
    }
    return StudentServicesGovernanceService.instance;
  }

  // ─── HOSTEL ALLOCATION ────────────────────────────────────────────────

  public getStudentHostelAllocation(studentId: string): HostelBedAllocation | undefined {
    return this.hostelAllocations.find(h => h.studentId === studentId && h.status === 'ALLOCATED');
  }

  public vacateHostelBed(allocationId: string): HostelBedAllocation {
    const alloc = this.hostelAllocations.find(h => h.id === allocationId);
    if (!alloc) throw new Error(`Hostel allocation ${allocationId} not found`);

    alloc.status = 'VACATED';
    return alloc;
  }

  // ─── TRANSPORT PASS ───────────────────────────────────────────────────

  public getStudentTransportPass(studentId: string): TransportPassRecord | undefined {
    return this.transportPasses.find(t => t.studentId === studentId && t.status === 'ACTIVE');
  }

  // ─── LIBRARY ISSUE & RETURN ───────────────────────────────────────────

  public getStudentLibraryIssues(studentId: string): LibraryBookIssueRecord[] {
    return this.libraryIssues.filter(l => l.studentId === studentId);
  }

  public returnLibraryBook(issueId: string): LibraryBookIssueRecord {
    const issue = this.libraryIssues.find(l => l.id === issueId);
    if (!issue) throw new Error(`Library issue ${issueId} not found`);

    issue.status = 'RETURNED';
    issue.returnedAt = new Date().toISOString();
    return issue;
  }

  // ─── STUDENT SERVICES & SLA ───────────────────────────────────────────

  public submitServiceRequest(req: {
    studentId: string;
    serviceType: StudentServiceRequestRecord['serviceType'];
  }): StudentServiceRequestRecord {
    const newReq: StudentServiceRequestRecord = {
      id: `sr-${Date.now()}`,
      applicationNumber: `SSR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      studentId: req.studentId,
      serviceType: req.serviceType,
      submittedAt: new Date().toISOString(),
      targetSlaHours: 48,
      status: 'SUBMITTED'
    };

    this.serviceRequests.push(newReq);
    return newReq;
  }

  public completeServiceRequest(requestId: string, completedByUserId: string, remarks?: string): StudentServiceRequestRecord {
    const request = this.serviceRequests.find(r => r.id === requestId);
    if (!request) throw new Error(`Service request ${requestId} not found`);

    request.status = 'COMPLETED';
    request.assignedToUserId = completedByUserId;
    request.completedAt = new Date().toISOString();
    request.remarks = remarks || 'Service certificate generated and dispatched';
    return request;
  }

  public getStudentServicesSummary(studentId: string, context?: UserAuthorizationContext): {
    hostel?: HostelBedAllocation;
    transport?: TransportPassRecord;
    library: LibraryBookIssueRecord[];
    requests: StudentServiceRequestRecord[];
  } | undefined {
    // RBAC: If student, restrict to self
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    return {
      hostel: this.getStudentHostelAllocation(studentId),
      transport: this.getStudentTransportPass(studentId),
      library: this.getStudentLibraryIssues(studentId),
      requests: this.serviceRequests.filter(r => r.studentId === studentId)
    };
  }
}

export const studentServicesGovernanceService = StudentServicesGovernanceService.getInstance();
