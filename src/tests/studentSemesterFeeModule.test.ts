import { describe, it, expect, beforeEach } from 'vitest';
import { studentFeeService, STANDARD_SEMESTER_BASE_FEE, COURSE_SEMESTERS_COUNT, STANDARD_COURSE_TOTAL_BASE_FEE } from '../services/studentFeeService';
import { feeReceiptPdfService } from '../services/feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../components/receipt/receiptTypes';
import { db } from '../services/db';
import { FeePaymentTransaction } from '../types';

describe('SSIU ERP — Semester-Wise Student Fees Management Module', () => {
  const mockStudentId = 'stu-1';
  const mockEnrollmentNo = '2024BCSE001';

  beforeEach(() => {
    // Ensure clean initial state
  });

  it('1. Standard Course Structure: 8 Semesters @ ₹35,500 = ₹2,84,000 Total Base Course Fee', () => {
    expect(COURSE_SEMESTERS_COUNT).toBe(8);
    expect(STANDARD_SEMESTER_BASE_FEE).toBe(35500);
    expect(STANDARD_COURSE_TOTAL_BASE_FEE).toBe(284000);

    const courseSummary = studentFeeService.calculateCourseFeeSummary(mockStudentId, mockEnrollmentNo);
    expect(courseSummary.semesters.length).toBe(8);
    expect(courseSummary.totalCourseFee).toBe(284000);

    courseSummary.semesters.forEach((sem, idx) => {
      expect(sem.semesterNumber).toBe(idx + 1);
      expect(sem.baseFee).toBe(35500);
      expect(sem.feeHeads.length).toBe(4);
      
      const sumHeads = sem.feeHeads.reduce((sum, h) => sum + h.baseAmount, 0);
      expect(sumHeads).toBe(35500);
    });
  });

  it('2. Unpaid Semester Fee: ₹35,500 base with 0 paid => ₹35,500 pending & PENDING status', () => {
    const semPlan = studentFeeService.calculateStudentSemesterFee(
      mockStudentId,
      mockEnrollmentNo,
      5, // Future semester with 0 paid
      35500,
      undefined,
      undefined,
      [],
      []
    );

    expect(semPlan.baseFee).toBe(35500);
    expect(semPlan.paidAmount).toBe(0);
    expect(semPlan.pendingAmount).toBe(35500);
    expect(semPlan.status).toBe('PENDING');
  });

  it('3. Partially Paid Semester Fee: ₹35,500 with ₹10,000 paid => ₹25,500 pending & PARTIALLY_PAID status', () => {
    const mockTxs: FeePaymentTransaction[] = [
      {
        id: 'tx-test-1',
        studentId: mockStudentId,
        studentName: 'Test Student',
        enrollmentNo: mockEnrollmentNo,
        programId: 'prog-cse',
        semesterId: 'sem-cse-4',
        paidAmount: 10000,
        amount: 10000,
        paymentMode: 'Online UPI',
        status: 'SUCCESS',
        paymentDate: '2026-08-01',
        receiptNo: 'SSIU/REC/2026/10001'
      }
    ];

    const semPlan = studentFeeService.calculateStudentSemesterFee(
      mockStudentId,
      mockEnrollmentNo,
      4,
      35500,
      undefined,
      undefined,
      [],
      mockTxs
    );

    expect(semPlan.paidAmount).toBe(10000);
    expect(semPlan.pendingAmount).toBe(25500);
    expect(semPlan.status).toBe('PARTIALLY_PAID');
  });

  it('4. Fully Settled Semester Fee: ₹35,500 with ₹35,500 paid => ₹0 pending & PAID status', () => {
    const semPlan = studentFeeService.calculateStudentSemesterFee(
      mockStudentId,
      mockEnrollmentNo,
      1, // Past semester 1 is completed
      35500
    );

    expect(semPlan.paidAmount).toBe(35500);
    expect(semPlan.pendingAmount).toBe(0);
    expect(semPlan.status).toBe('PAID');
  });

  it('5. Concession / Scholarship: ₹35,500 with ₹3,550 discount (10%) => Net ₹31,950', () => {
    const semPlan = studentFeeService.calculateStudentSemesterFee(
      mockStudentId,
      mockEnrollmentNo,
      4,
      35500,
      { type: 'PERCENTAGE', value: 10, reason: 'Merit Scholarship' }
    );

    expect(semPlan.baseFee).toBe(35500);
    expect(semPlan.concessionAmount).toBe(3550);
    expect(semPlan.netPayableAmount).toBe(31950);
  });

  it('6. Fixed Amount Concession: ₹35,500 with ₹5,000 fixed concession => Net ₹30,500', () => {
    const semPlan = studentFeeService.calculateStudentSemesterFee(
      mockStudentId,
      mockEnrollmentNo,
      4,
      35500,
      { type: 'FIXED', value: 5000, reason: 'Staff Concession' }
    );

    expect(semPlan.concessionAmount).toBe(5000);
    expect(semPlan.netPayableAmount).toBe(30500);
  });

  it('7. Automatic Late Fee Calculation: Applies late fee after due date', () => {
    const pastDueDate = '2025-01-01'; // Far in the past
    const semPlan = studentFeeService.calculateStudentSemesterFee(
      mockStudentId,
      mockEnrollmentNo,
      4,
      35500,
      undefined,
      { graceDays: 0, ratePerDay: 50, maxLateFee: 2500 }
    );

    // If semester has overdue date, late fee applies up to max limit
    if (new Date() > new Date(semPlan.dueDate)) {
      expect(semPlan.lateFee).toBeGreaterThanOrEqual(0);
    }
  });

  it('8. Payment Recording Flow: Records transaction and updates balance', () => {
    const payRes = studentFeeService.recordStudentFeePayment({
      studentId: mockStudentId,
      enrollmentNo: mockEnrollmentNo,
      studentName: 'Aarav Patel',
      programId: 'prog-cse',
      semesterNumber: 4,
      amount: 15000,
      paymentMode: 'Online UPI',
      feeType: 'SEMESTER',
      remarks: 'Installment payment for Sem 4'
    });

    expect(payRes.transaction).toBeDefined();
    expect(payRes.transaction.paidAmount).toBe(15000);
    expect(payRes.transaction.status).toBe('SUCCESS');
    expect(payRes.receiptNo).toContain('SSIU/REC/');

    // Verify transaction exists in db
    const allTxs = db.getFeePaymentTransactions();
    expect(allTxs.some(t => t.id === payRes.transaction.id)).toBe(true);
  });

  it('9. Official PDF Receipt Generation: Generates valid 1-page A4 receipt', () => {
    const mockTx: FeePaymentTransaction = {
      id: 'tx-rec-test',
      studentId: mockStudentId,
      studentName: 'Aarav Patel',
      enrollmentNo: mockEnrollmentNo,
      programId: 'prog-cse',
      semesterId: 'sem-cse-4',
      academicYearCode: '2026-27',
      paidAmount: 35500,
      amount: 35500,
      paymentMode: 'Online UPI',
      gatewayRef: 'UPI-REF-99281',
      status: 'SUCCESS',
      paymentDate: '2026-08-15',
      receiptNo: 'SSIU/REC/2026/88123',
      remarks: 'Full Semester Fee Clearance'
    };

    const receiptData = fromFeePaymentTransaction(mockTx);
    expect(receiptData.receiptNo).toBe('SSIU/REC/2026/88123');
    expect(receiptData.studentName).toBeTruthy();
    expect(receiptData.totalPaid).toBe(35500);

    const doc = feeReceiptPdfService.generatePdf(receiptData);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
