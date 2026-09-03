import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type FeeHeadCategory = 'ACADEMIC' | 'HOSTEL' | 'TRANSPORT' | 'EXAMINATION' | 'LIBRARY' | 'ADMINISTRATIVE' | 'OTHER';
export type PaymentMethod = 'ONLINE' | 'BANK' | 'CARD' | 'UPI' | 'CASH';
export type FinancialHoldStatus = 'ACTIVE' | 'RELEASED' | 'CANCELLED';

export interface FeeHeadRecord {
  id: string;
  code: string;
  name: string;
  category: FeeHeadCategory;
  taxApplicable: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FeeStructureVersionRecord {
  id: string;
  academicYearId: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  version: number;
  lines: Array<{
    feeHeadId: string;
    feeHeadName: string;
    amount: number;
    frequency: 'ONE_TIME' | 'SEMESTER' | 'ANNUAL';
  }>;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface FinancialHoldRecord {
  id: string;
  studentId: string;
  reason: string;
  amount: number;
  status: FinancialHoldStatus;
  createdAt: string;
  releasedAt?: string;
  releasedByUserId?: string;
}

export interface ScholarshipAwardRecord {
  id: string;
  studentId: string;
  scholarshipName: string;
  awardedAmount: number;
  academicYearId: string;
  status: 'APPROVED' | 'DISBURSED';
  awardedAt: string;
}

export interface FeeClearanceRecord {
  id: string;
  studentId: string;
  academicYearId: string;
  outstandingBalance: number;
  status: 'CLEARED' | 'PENDING' | 'HELD';
  clearedAt?: string;
  approvedByUserId?: string;
}

class AccountsReceivableFinanceGovernanceService {
  private static instance: AccountsReceivableFinanceGovernanceService;

  private feeHeads: FeeHeadRecord[] = [
    { id: 'fh-tuition', code: 'TUIT', name: 'Tuition Fee', category: 'ACADEMIC', taxApplicable: false, status: 'ACTIVE' },
    { id: 'fh-exam', code: 'EXAM', name: 'Examination Fee', category: 'EXAMINATION', taxApplicable: false, status: 'ACTIVE' },
    { id: 'fh-hostel', code: 'HOST', name: 'Hostel Fee', category: 'HOSTEL', taxApplicable: false, status: 'ACTIVE' },
    { id: 'fh-transport', code: 'TRAN', name: 'Transport Fee', category: 'TRANSPORT', taxApplicable: false, status: 'ACTIVE' },
    { id: 'fh-lib-fine', code: 'LIBF', name: 'Library Overdue Fine', category: 'LIBRARY', taxApplicable: false, status: 'ACTIVE' }
  ];

  private feeStructures: FeeStructureVersionRecord[] = [
    {
      id: 'fsv-btech-cse-2026-v1',
      academicYearId: 'ay-2026-27',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      programId: 'prog-1',
      semesterId: 'sem-3',
      version: 1,
      lines: [
        { feeHeadId: 'fh-tuition', feeHeadName: 'Tuition Fee', amount: 50000, frequency: 'SEMESTER' },
        { feeHeadId: 'fh-exam', feeHeadName: 'Examination Fee', amount: 1500, frequency: 'SEMESTER' }
      ],
      status: 'ACTIVE'
    }
  ];

  private financialHolds: FinancialHoldRecord[] = [
    {
      id: 'hold-01',
      studentId: 'stud-002',
      reason: 'Unpaid Semester 2 Tuition & Exam Dues',
      amount: 25000,
      status: 'ACTIVE',
      createdAt: '2026-08-01T10:00:00Z'
    }
  ];

  private scholarships: ScholarshipAwardRecord[] = [
    {
      id: 'sch-01',
      studentId: 'stud-001',
      scholarshipName: 'SSIU Merit Academic Scholarship 2026',
      awardedAmount: 10000,
      academicYearId: 'ay-2026-27',
      status: 'APPROVED',
      awardedAt: '2026-07-20T12:00:00Z'
    }
  ];

  private clearances: FeeClearanceRecord[] = [
    { id: 'clr-01', studentId: 'stud-001', academicYearId: 'ay-2026-27', outstandingBalance: 0, status: 'CLEARED', clearedAt: '2026-08-20T15:00:00Z', approvedByUserId: 'usr-finance-admin' },
    { id: 'clr-02', studentId: 'stud-002', academicYearId: 'ay-2026-27', outstandingBalance: 25000, status: 'HELD' }
  ];

  private constructor() {}

  public static getInstance(): AccountsReceivableFinanceGovernanceService {
    if (!AccountsReceivableFinanceGovernanceService.instance) {
      AccountsReceivableFinanceGovernanceService.instance = new AccountsReceivableFinanceGovernanceService();
    }
    return AccountsReceivableFinanceGovernanceService.instance;
  }

  // ─── AGING & ACCOUNTS RECEIVABLE ──────────────────────────────────────

  public getAccountsReceivableAging(scope?: { instituteId?: string; departmentId?: string }): {
    current_0_30_days: number;
    aging_31_60_days: number;
    aging_61_90_days: number;
    aging_90_plus_days: number;
    totalReceivable: number;
  } {
    return {
      current_0_30_days: 0,
      aging_31_60_days: 25000,
      aging_61_90_days: 0,
      aging_90_plus_days: 0,
      totalReceivable: 25000
    };
  }

  // ─── FINANCIAL HOLDS & CLEARANCES ─────────────────────────────────────

  public releaseFinancialHold(holdId: string, releasedByUserId: string): FinancialHoldRecord {
    const hold = this.financialHolds.find(h => h.id === holdId);
    if (!hold) throw new Error(`Hold ${holdId} not found`);

    hold.status = 'RELEASED';
    hold.releasedAt = new Date().toISOString();
    hold.releasedByUserId = releasedByUserId;

    // Update clearance
    const clearance = this.clearances.find(c => c.studentId === hold.studentId);
    if (clearance) {
      clearance.status = 'CLEARED';
      clearance.clearedAt = new Date().toISOString();
      clearance.approvedByUserId = releasedByUserId;
    }

    return hold;
  }

  public getStudentFinanceSummary(studentId: string, context?: UserAuthorizationContext): {
    holds: FinancialHoldRecord[];
    scholarships: ScholarshipAwardRecord[];
    clearance?: FeeClearanceRecord;
  } | undefined {
    // RBAC: If student, restrict to self
    if (context && String(context.activeRole) === 'STUDENT' && context.userId !== studentId) {
      return undefined;
    }

    return {
      holds: this.financialHolds.filter(h => h.studentId === studentId && h.status === 'ACTIVE'),
      scholarships: this.scholarships.filter(s => s.studentId === studentId),
      clearance: this.clearances.find(c => c.studentId === studentId)
    };
  }
}

export const accountsReceivableFinanceGovernanceService = AccountsReceivableFinanceGovernanceService.getInstance();
