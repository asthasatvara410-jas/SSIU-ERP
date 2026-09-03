/**
 * SSIU ERP - Centralized Semester-Wise Student Fee Calculation & Management Service
 * Single Source of Truth for all Semester-wise Fee Schedules, Mathematical Rules,
 * Concession/Scholarship Deductions, Late Fee Calculations, Ledger Updates, and PDF Receipts.
 */

import { StudentFeeRecord, FeePaymentTransaction, PaymentMode } from '../types';
import { db } from './db';
import { feeReceiptPdfService } from './feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../components/receipt/receiptTypes';

export interface FeeHeadItem {
  id: string;
  name: string;
  category: 'TUITION' | 'LAB' | 'EXAM' | 'LIBRARY' | 'DEVELOPMENT' | 'OTHER';
  baseAmount: number;
  concessionAmount: number;
  lateFee: number;
  totalAmount: number;
  payableAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
}

export interface StudentSemesterFeePlan {
  semesterNumber: number;
  semesterCode: string;
  semesterLabel: string;
  academicYear: string;
  dueDate: string;
  baseFee: number;
  tuitionFee: number;
  labFee: number;
  examFee: number;
  otherFee: number;
  concessionAmount: number;
  lateFee: number;
  netPayableAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
  isCurrent: boolean;
  feeHeads: FeeHeadItem[];
  rawRecord?: StudentFeeRecord;
}

export interface CourseFeeSummary {
  totalCourseFee: number;
  totalConcession: number;
  totalLateFee: number;
  totalNetFee: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  currentSemesterNumber: number;
  semesters: StudentSemesterFeePlan[];
}

export interface SemesterFeeRow {
  id: string;
  semesterId: string;
  semesterName: string;
  academicYear: string;
  feeType?: string;
  tuitionFee: number;
  labFee: number;
  examFee: number;
  otherFee: number;
  totalFee: number;
  discount: number;
  lateFee: number;
  netPayable: number;
  paidAmount: number;
  previouslyPaid: number;
  currentPaid: number;
  refunded: number;
  outstanding: number;
  dueDate: string;
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
  isCurrent: boolean;
}

export interface StudentFeeSummary {
  totalFee: number;
  totalFees: number;
  totalPaid: number;
  previouslyPaid: number;
  currentPaid: number;
  outstandingAmount: number;
  totalOutstanding: number;
  refundAmount: number;
  totalDiscount: number;
  totalLateFee: number;
  currentSemesterFee: number;
  currentSemesterPaid: number;
  currentSemesterOutstanding: number;
  currentSemesterStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
}

export interface ConcessionConfig {
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  reason?: string;
}

export interface LateFeeRule {
  graceDays: number;
  ratePerDay: number;
  flatFee?: number;
  maxLateFee?: number;
}

export const STANDARD_SEMESTER_BASE_FEE = 35500;
export const COURSE_SEMESTERS_COUNT = 8;
export const STANDARD_COURSE_TOTAL_BASE_FEE = STANDARD_SEMESTER_BASE_FEE * COURSE_SEMESTERS_COUNT; // ₹2,84,000

export class StudentFeeService {
  /**
   * 1. Calculate Single Semester Fee using Centralized Business Logic
   */
  public calculateStudentSemesterFee(
    studentId: string,
    enrollmentNo: string,
    semesterNumber: number,
    baseFee: number = STANDARD_SEMESTER_BASE_FEE,
    concessionConfig?: ConcessionConfig,
    lateFeeRule?: LateFeeRule,
    existingRecords?: StudentFeeRecord[],
    transactions?: FeePaymentTransaction[]
  ): StudentSemesterFeePlan {
    const records = existingRecords || db.getStudentFeeRecords();
    const allTxs = transactions || db.getFeePaymentTransactions();

    // Match existing student fee records
    const studentFeeRecord = records.find(r => 
      (r.studentId === studentId || r.enrollmentNo === enrollmentNo) &&
      (r.semesterName?.includes(String(semesterNumber)) || r.semesterId?.includes(String(semesterNumber)) || r.academicYearId?.includes(String(semesterNumber)))
    ) || (semesterNumber === 4 ? records.find(r => r.studentId === studentId || r.enrollmentNo === enrollmentNo) : undefined);

    // Calculate Academic Year
    const yearStart = 2024 + Math.floor((semesterNumber - 1) / 2);
    const yearEnd = (yearStart + 1) % 100;
    const academicYear = `${yearStart}-${yearEnd < 10 ? '0' + yearEnd : yearEnd}`;

    // Standard Default Due Dates
    let dueDate = `${yearStart}-${semesterNumber % 2 === 1 ? '08-15' : '02-15'}`;
    if (studentFeeRecord?.dueDate) {
      dueDate = studentFeeRecord.dueDate;
    }

    // 1. Calculate Concession
    let concessionAmount = 0;
    if (concessionConfig) {
      if (concessionConfig.type === 'PERCENTAGE') {
        concessionAmount = Math.round((baseFee * concessionConfig.value) / 100);
      } else {
        concessionAmount = Math.min(baseFee, concessionConfig.value);
      }
    } else if (studentFeeRecord?.discountAmount || studentFeeRecord?.waivedAmount) {
      concessionAmount = (studentFeeRecord.discountAmount || 0) + (studentFeeRecord.waivedAmount || 0);
    }

    // 2. Calculate Late Fee
    let lateFee = 0;
    const currentSemNum = 4; // Current active student semester
    const isPastDue = new Date() > new Date(dueDate) && semesterNumber <= currentSemNum;
    
    if (studentFeeRecord?.lateFeeAmount !== undefined) {
      lateFee = studentFeeRecord.lateFeeAmount;
    } else if (lateFeeRule && semesterNumber === currentSemNum) {
      const now = new Date();
      const due = new Date(dueDate);
      if (now > due) {
        const diffTime = now.getTime() - due.getTime();
        const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        if (daysOverdue > lateFeeRule.graceDays) {
          const chargeableDays = daysOverdue - lateFeeRule.graceDays;
          lateFee = Math.min(lateFeeRule.maxLateFee || 5000, (lateFeeRule.flatFee || 0) + (chargeableDays * lateFeeRule.ratePerDay));
        }
      }
    }

    // 3. Calculate Net & Paid Amounts
    let paidAmount = 0;

    // Check actual payment transactions for this semester
    const semTxs = allTxs.filter(t => 
      (t.studentId === studentId || t.enrollmentNo === enrollmentNo) &&
      (t.semesterId === `sem-cse-${semesterNumber}` || t.semesterId === `SEM_${semesterNumber}` || t.semesterId === String(semesterNumber) || (semesterNumber === currentSemNum && !t.semesterId)) &&
      (t.status === 'SUCCESS' || !t.status)
    );
    const txPaidSum = semTxs.reduce((sum, t) => sum + (t.paidAmount || 0), 0);

    if (semesterNumber < currentSemNum) {
      // Past completed semesters are marked as Settled
      paidAmount = baseFee;
    } else if (semesterNumber === currentSemNum) {
      // Current active semester
      if (txPaidSum > 0) {
        paidAmount = txPaidSum;
      } else if (studentFeeRecord?.paidAmount !== undefined) {
        paidAmount = studentFeeRecord.paidAmount;
      } else {
        paidAmount = 0;
      }
    } else {
      // Future semesters
      paidAmount = txPaidSum > 0 ? txPaidSum : 0;
    }

    const netPayableAmount = Math.max(0, baseFee - concessionAmount + lateFee);
    const pendingAmount = Math.max(0, netPayableAmount - paidAmount);

    // 4. Dynamic Payment Status
    let status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
    if (paidAmount >= netPayableAmount && netPayableAmount > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIALLY_PAID';
    } else if (isPastDue && pendingAmount > 0) {
      status = 'OVERDUE';
    } else {
      status = 'PENDING';
    }

    // 5. Data-driven Fee Heads Breakdown (Standard 4 heads totaling ₹35,500)
    const tuitionBase = 30000;
    const labBase = 3000;
    const examBase = 1500;
    const libraryBase = 1000;

    const feeHeads: FeeHeadItem[] = [
      {
        id: `fh-tuition-${semesterNumber}`,
        name: 'Tuition Fee',
        category: 'TUITION',
        baseAmount: tuitionBase,
        concessionAmount: Math.round(concessionAmount * 0.8),
        lateFee: Math.round(lateFee * 0.6),
        totalAmount: tuitionBase + Math.round(lateFee * 0.6),
        payableAmount: status === 'PAID' ? 0 : tuitionBase - Math.round(concessionAmount * 0.8) + Math.round(lateFee * 0.6),
        paidAmount: status === 'PAID' ? tuitionBase : Math.min(paidAmount, tuitionBase),
        pendingAmount: status === 'PAID' ? 0 : Math.max(0, tuitionBase - Math.round(concessionAmount * 0.8) - paidAmount),
        dueDate,
        status: status === 'PAID' ? 'PAID' : isPastDue ? 'OVERDUE' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING'
      },
      {
        id: `fh-lab-${semesterNumber}`,
        name: 'Lab & Computing Infrastructure Fee',
        category: 'LAB',
        baseAmount: labBase,
        concessionAmount: Math.round(concessionAmount * 0.1),
        lateFee: Math.round(lateFee * 0.2),
        totalAmount: labBase + Math.round(lateFee * 0.2),
        payableAmount: status === 'PAID' ? 0 : labBase - Math.round(concessionAmount * 0.1) + Math.round(lateFee * 0.2),
        paidAmount: status === 'PAID' ? labBase : 0,
        pendingAmount: status === 'PAID' ? 0 : labBase - Math.round(concessionAmount * 0.1),
        dueDate,
        status: status === 'PAID' ? 'PAID' : isPastDue ? 'OVERDUE' : 'PENDING'
      },
      {
        id: `fh-exam-${semesterNumber}`,
        name: 'Examination Fee',
        category: 'EXAM',
        baseAmount: examBase,
        concessionAmount: 0,
        lateFee: 0,
        totalAmount: examBase,
        payableAmount: status === 'PAID' ? 0 : examBase,
        paidAmount: status === 'PAID' ? examBase : 0,
        pendingAmount: status === 'PAID' ? 0 : examBase,
        dueDate,
        status: status === 'PAID' ? 'PAID' : isPastDue ? 'OVERDUE' : 'PENDING'
      },
      {
        id: `fh-library-${semesterNumber}`,
        name: 'Library & Student Activity Fee',
        category: 'LIBRARY',
        baseAmount: libraryBase,
        concessionAmount: Math.round(concessionAmount * 0.1),
        lateFee: Math.round(lateFee * 0.2),
        totalAmount: libraryBase + Math.round(lateFee * 0.2),
        payableAmount: status === 'PAID' ? 0 : libraryBase - Math.round(concessionAmount * 0.1) + Math.round(lateFee * 0.2),
        paidAmount: status === 'PAID' ? libraryBase : 0,
        pendingAmount: status === 'PAID' ? 0 : libraryBase - Math.round(concessionAmount * 0.1),
        dueDate,
        status: status === 'PAID' ? 'PAID' : isPastDue ? 'OVERDUE' : 'PENDING'
      }
    ];

    return {
      semesterNumber,
      semesterCode: `SEM_${semesterNumber}`,
      semesterLabel: `Semester ${semesterNumber}`,
      academicYear,
      dueDate,
      baseFee,
      tuitionFee: tuitionBase,
      labFee: labBase,
      examFee: examBase,
      otherFee: libraryBase,
      concessionAmount,
      lateFee,
      netPayableAmount,
      paidAmount,
      pendingAmount,
      status,
      isCurrent: semesterNumber === currentSemNum,
      feeHeads,
      rawRecord: studentFeeRecord
    };
  }

  /**
   * 2. Calculate Complete 8-Semester Course Summary
   */
  public calculateCourseFeeSummary(
    studentId: string,
    enrollmentNo: string,
    concessions?: Record<number, ConcessionConfig>,
    lateFeeRules?: Record<number, LateFeeRule>
  ): CourseFeeSummary {
    const semesters: StudentSemesterFeePlan[] = [];
    let totalCourseFee = 0;
    let totalConcession = 0;
    let totalLateFee = 0;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;

    for (let semNum = 1; semNum <= COURSE_SEMESTERS_COUNT; semNum++) {
      const plan = this.calculateStudentSemesterFee(
        studentId,
        enrollmentNo,
        semNum,
        STANDARD_SEMESTER_BASE_FEE,
        concessions ? concessions[semNum] : undefined,
        lateFeeRules ? lateFeeRules[semNum] : undefined
      );

      semesters.push(plan);
      totalCourseFee += plan.baseFee;
      totalConcession += plan.concessionAmount;
      totalLateFee += plan.lateFee;
      totalPaidAmount += plan.paidAmount;
      totalPendingAmount += plan.pendingAmount;
    }

    const totalNetFee = totalCourseFee - totalConcession + totalLateFee;

    return {
      totalCourseFee,
      totalConcession,
      totalLateFee,
      totalNetFee,
      totalPaidAmount,
      totalPendingAmount,
      currentSemesterNumber: 4,
      semesters
    };
  }

  /**
   * 3. Overall Student Fee Summary Helper for Dashboard
   */
  public calculateStudentFeeSummary(studentId: string): StudentFeeSummary {
    const student = db.getStudents().find(s => s.id === studentId);
    const summary = this.calculateCourseFeeSummary(studentId, student?.enrollmentNo || '');
    const currentSem = summary.semesters.find(s => s.isCurrent) || summary.semesters[3];

    return {
      totalFee: summary.totalCourseFee,
      totalFees: summary.totalCourseFee,
      totalPaid: summary.totalPaidAmount,
      previouslyPaid: summary.semesters.filter(s => !s.isCurrent).reduce((sum, s) => sum + s.paidAmount, 0),
      currentPaid: currentSem.paidAmount,
      outstandingAmount: summary.totalPendingAmount,
      totalOutstanding: summary.totalPendingAmount,
      refundAmount: 0,
      totalDiscount: summary.totalConcession,
      totalLateFee: summary.totalLateFee,
      currentSemesterFee: currentSem.baseFee,
      currentSemesterPaid: currentSem.paidAmount,
      currentSemesterOutstanding: currentSem.pendingAmount,
      currentSemesterStatus: currentSem.status
    };
  }

  /**
   * 4. Semester Fee Rows Breakdown for Tables
   */
  public getSemesterFeeDetails(
    studentId: string,
    filters?: { semesterId?: string; academicYear?: string }
  ): SemesterFeeRow[] {
    const student = db.getStudents().find(s => s.id === studentId);
    const summary = this.calculateCourseFeeSummary(studentId, student?.enrollmentNo || '');
    
    let rows: SemesterFeeRow[] = summary.semesters.map(s => ({
      id: `sem-row-${s.semesterNumber}`,
      semesterId: s.semesterCode,
      semesterName: s.semesterLabel,
      academicYear: s.academicYear,
      feeType: 'TUITION',
      tuitionFee: s.tuitionFee,
      labFee: s.labFee,
      examFee: s.examFee,
      otherFee: s.otherFee,
      totalFee: s.baseFee,
      discount: s.concessionAmount,
      lateFee: s.lateFee,
      netPayable: s.netPayableAmount,
      paidAmount: s.paidAmount,
      previouslyPaid: s.paidAmount,
      currentPaid: s.paidAmount,
      refunded: 0,
      outstanding: s.pendingAmount,
      dueDate: s.dueDate,
      status: s.status,
      isCurrent: s.isCurrent
    }));

    if (filters?.semesterId && filters.semesterId !== 'ALL') {
      rows = rows.filter(r => r.semesterId === filters.semesterId || r.semesterName === filters.semesterId);
    }
    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      rows = rows.filter(r => r.academicYear === filters.academicYear);
    }

    return rows;
  }

  /**
   * 5. Filtered Student Payment History
   */
  public getStudentPaymentHistory(
    studentId: string,
    filters?: {
      search?: string;
      semesterId?: string;
      academicYear?: string;
      status?: string;
      paymentMode?: string;
      startDate?: string;
      endDate?: string;
    }
  ): FeePaymentTransaction[] {
    const student = db.getStudents().find(s => s.id === studentId);
    let txs = db.getFeePaymentTransactions().filter(t => 
      t.studentId === studentId || (student?.enrollmentNo && t.enrollmentNo === student.enrollmentNo)
    );

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      txs = txs.filter(t => 
        (t.receiptNo && t.receiptNo.toLowerCase().includes(q)) ||
        (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
        (t.gatewayRef && t.gatewayRef.toLowerCase().includes(q))
      );
    }
    if (filters?.status && filters.status !== 'ALL') {
      txs = txs.filter(t => t.status === filters.status);
    }
    if (filters?.paymentMode && filters.paymentMode !== 'ALL') {
      txs = txs.filter(t => t.paymentMode === filters.paymentMode);
    }
    if (filters?.startDate) {
      txs = txs.filter(t => t.paymentDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      txs = txs.filter(t => t.paymentDate <= filters.endDate!);
    }

    return txs;
  }

  /**
   * 6. Record Fee Payment Transaction & Update Ledger in Real-Time
   */
  public recordStudentFeePayment(params: {
    studentId: string;
    enrollmentNo: string;
    studentName: string;
    programId: string;
    semesterNumber: number;
    amount: number;
    paymentMode: PaymentMode;
    feeType: 'SEMESTER' | 'EXAM' | 'HOSTEL' | 'ALL';
    gatewayReference?: string;
    remarks?: string;
  }): { transaction: FeePaymentTransaction; receiptNo: string } {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0];
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const receiptNo = `SSIU/REC/${timestamp.getFullYear()}/${randNum}`;
    const txId = `tx-fee-${Date.now()}`;
    const gatewayRef = params.gatewayReference || `GTW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: FeePaymentTransaction = {
      id: txId,
      studentFeeRecordId: `sfr-${params.studentId}`,
      studentId: params.studentId,
      studentName: params.studentName,
      enrollmentNo: params.enrollmentNo,
      programId: params.programId,
      semesterId: `sem-cse-${params.semesterNumber}`,
      academicYear: '2026-27',
      receiptNo,
      paidAmount: params.amount,
      paymentMode: params.paymentMode,
      transactionId: `TXN-${Date.now()}`,
      gatewayRef: gatewayRef,
      feeType: params.feeType === 'EXAM' ? 'EXAM' : 'TUITION',
      status: 'SUCCESS',
      paymentDate: dateStr,
      remarks: params.remarks || `Online payment received for Semester ${params.semesterNumber} fees`,
      recordedBy: 'Accounts Gateway Automation'
    };

    // 1. Insert transaction into state
    const createdTx = db.addEntity<FeePaymentTransaction>(
      'feePaymentTransactions',
      newTx,
      `Recorded fee payment of ₹${params.amount.toLocaleString()} for Receipt ${receiptNo}`
    );

    // 2. Update StudentFeeRecord if exists
    const records = db.getStudentFeeRecords();
    const feeRec = records.find(r => r.studentId === params.studentId || r.enrollmentNo === params.enrollmentNo);
    if (feeRec) {
      const newPaid = (feeRec.paidAmount || 0) + params.amount;
      const newPending = Math.max(0, (feeRec.totalAmount || STANDARD_SEMESTER_BASE_FEE) - newPaid);
      db.updateEntity<StudentFeeRecord>('studentFeeRecords', feeRec.id, {
        paidAmount: newPaid,
        pendingAmount: newPending,
        status: newPending === 0 ? 'PAID' : 'PARTIAL'
      }, `Recorded payment of ₹${params.amount.toLocaleString()} for Receipt ${receiptNo}`);
    }

    return { transaction: createdTx, receiptNo };
  }

  /**
   * 7. Generate and Open Official PDF Receipt
   */
  public generateAndOpenReceipt(
    transaction: FeePaymentTransaction,
    feeRecord?: StudentFeeRecord | null
  ): void {
    const receiptData = fromFeePaymentTransaction(transaction, feeRecord);
    feeReceiptPdfService.openInNewTab(receiptData);
  }
}

export const studentFeeService = new StudentFeeService();
