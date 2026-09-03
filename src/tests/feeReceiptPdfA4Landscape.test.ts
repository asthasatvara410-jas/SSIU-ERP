import { describe, it, expect } from 'vitest';
import { feeReceiptPdfService } from '../services/feeReceiptPdfService';
import { UniversalFeeReceiptData, fromFeePaymentTransaction, fromStudentSectionRequest } from '../components/receipt/receiptTypes';
import { StudentSectionRequest } from '../types/studentSection';
import { FeePaymentTransaction } from '../types';

describe('Centralized Fee Receipt PDF Generator (A4 Portrait Top+Bottom)', () => {
  const mockReceipt: UniversalFeeReceiptData = {
    receiptNo: 'REC-EXAM-2026-0042',
    transactionId: 'TXN-PAY-884920',
    paymentDate: '2026-08-26',
    paymentTime: '10:30 AM',
    paymentStatus: 'PAID & VERIFIED',
    paymentMode: 'Online UPI',
    academicYear: '2026-2027',
    departmentOrSectionTitle: 'EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS',
    receiptTitle: 'EXAMINATION FEE PAYMENT RECEIPT',
    studentName: 'Jigar Ahir',
    enrollmentNo: '24SSIU01CSE001',
    admissionNo: 'ADM-2024-001',
    instituteName: 'Swarrnim Institute of Technology',
    programName: 'B.Tech',
    departmentName: 'Computer Engineering',
    semesterName: 'Semester 4',
    extraDetails: [
      { label: 'Exam Code', value: 'EXAM-SUMMER-2026' },
      { label: 'Exam Type', value: 'Regular End Semester' },
      { label: 'Session', value: 'Summer 2026' },
      { label: 'Delivery Mode', value: 'Physical Hardcopy' }
    ],
    items: [
      { sr: 1, head: 'Examination Base Form Fee', qty: '1 Term', amount: 500 },
      { sr: 2, head: 'Theory Subjects Fee (6 Subjects @ Rs. 150)', qty: '6 Subjects', amount: 900 },
      { sr: 3, head: 'Practical Lab Examination Fee', qty: '3 Labs', amount: 450 }
    ],
    totalPaid: 1850,
    amountInWords: 'One Thousand Eight Hundred Fifty Rupees Only'
  };

  it('should generate an A4 Portrait PDF with EXACTLY 1 page', () => {
    const doc = feeReceiptPdfService.generatePdf(mockReceipt);
    
    // Total Pages MUST be exactly 1
    expect(doc.getNumberOfPages()).toBe(1);

    // Orientation must be portrait
    const pageSize = doc.internal.pageSize;
    const width = pageSize.getWidth();
    const height = pageSize.getHeight();

    // In mm: A4 Portrait is 210mm width x 297mm height
    expect(Math.round(width)).toBe(210);
    expect(Math.round(height)).toBe(297);
  });

  it('should generate a valid PDF Blob', async () => {
    const blob = await feeReceiptPdfService.generateBlob(mockReceipt);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('should map StudentSectionRequest to UniversalFeeReceiptData and generate 1-page PDF', () => {
    const mockRequest: StudentSectionRequest = {
      id: 'ssr-9901',
      requestNo: 'SSR/2026/0099',
      studentId: 'stud-1',
      studentName: 'Jigar Ahir',
      enrollmentNo: '24SSIU01CSE001',
      admissionNo: 'ADM-2024-001',
      email: 'jigar@swarrnim.edu.in',
      phone: '9876543210',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      programId: 'prog-1',
      programName: 'B.Tech Computer Engineering',
      semesterId: 'sem-4',
      semesterName: 'Semester 4',
      divisionName: 'Division A',
      batchName: '2024-2028',
      academicYear: '2026-27',
      serviceId: 'srv-transcript',
      serviceCode: 'TRANSCRIPT',
      serviceName: 'Official Academic Transcript',
      category: 'TRANSCRIPT',
      purpose: 'Higher Studies in Canada',
      copies: 2,
      calculatedFee: 700,
      paymentStatus: 'PAID',
      receiptNo: 'SSR-REC-2026-0099',
      paymentTransactionId: 'TXN-UPI-990188',
      paymentMode: 'Online UPI',
      paidAt: '2026-08-26T10:00:00.000Z',
      deliveryMode: 'PHYSICAL',
      status: 'APPROVED',
      timeline: [],
      attachments: [],
      createdAt: '2026-08-26T09:30:00.000Z',
      updatedAt: '2026-08-26T10:00:00.000Z'
    };

    const receiptData = fromStudentSectionRequest(mockRequest);
    expect(receiptData.receiptNo).toBe('SSR-REC-2026-0099');
    expect(receiptData.studentName).toBe('Jigar Ahir');
    expect(receiptData.totalPaid).toBe(700);

    const doc = feeReceiptPdfService.generatePdf(receiptData);
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
