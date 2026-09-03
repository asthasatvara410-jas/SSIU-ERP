/**
 * Centralized Universal Fee Receipt Types & Converters for SSIU ERP
 * Standardized data models for Tuition, Exam, Hostel, Student Section, Admission, and all other fees.
 */

import { FeePaymentTransaction, StudentFeeRecord } from '../../types';
import { db } from '../../services/db';

export interface FeeReceiptItem {
  sr?: number;
  head: string;
  qty?: string | number;
  rate?: number;
  amount: number;
}

export interface UniversalFeeReceiptData {
  // 1. Receipt Identification
  receiptNo: string;
  transactionId: string;
  paymentDate: string;
  paymentTime?: string;
  paymentStatus?: string; // e.g. "PAID & VERIFIED", "SUCCESSFUL", "CLEARED"
  paymentMode?: string; // e.g. "Online UPI", "Credit/Debit Card", "Net Banking", "Cash"
  academicYear?: string;

  // 2. Department / Module Branding
  departmentOrSectionTitle?: string; // e.g. "EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS", "FINANCE & ACCOUNTS DEPARTMENT"
  receiptTitle?: string; // e.g. "EXAMINATION FEE PAYMENT RECEIPT", "OFFICIAL UNIVERSITY FEE RECEIPT"

  // 3. Student / Applicant Information
  studentName: string;
  enrollmentNo: string;
  admissionNo?: string;
  instituteName?: string;
  programName?: string;
  departmentName?: string;
  semesterName?: string;

  // 4. Module-Specific Extra Details (Key-Value pairs)
  extraDetails?: Array<{ label: string; value: string; bold?: boolean }>;

  // 5. Itemized Fee Breakdown
  items: FeeReceiptItem[];

  // 6. Financial Totals
  subtotal?: number;
  additionalCharges?: number;
  discount?: number;
  totalPaid: number;
  amountInWords?: string;

  // 7. Authorization & Signatures
  recordedBy?: string;
  authorizedSignatoryTitle?: string; // e.g. "Controller of Examinations", "Finance & Accounts Officer"
  studentAcknowledgementTitle?: string; // e.g. "Student Signature / Acknowledgment"
  officialDisclaimer?: string;
}

/**
 * Converts any positive integer into Indian Rupee words (e.g. 450 -> "Four Hundred Fifty Rupees Only")
 */
export function numberToWords(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const integerPart = Math.floor(Math.abs(num));
  if (integerPart === 0) return 'Zero Rupees Only';
  
  const n = ('000000000' + integerPart).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return `${integerPart} Rupees Only`;
  
  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + ' Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + ' Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + ' Thousand ' : '';
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + ' Hundred ' : '';
  str += Number(n[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + ' ' : '';
  
  return str.trim() + ' Rupees Only';
}

/**
 * Adapter from FeePaymentTransaction (General Tuition / Finance / Student Section)
 */
export function fromFeePaymentTransaction(
  transaction: FeePaymentTransaction,
  feeRecord?: StudentFeeRecord | null
): UniversalFeeReceiptData {
  // Single Source of Truth: Resolve authoritative student master record
  const student = db.getStudents().find(s => 
    (transaction.studentId && s.id === transaction.studentId) || 
    (transaction.enrollmentNo && s.enrollmentNo === transaction.enrollmentNo)
  );

  const program = (student?.programId ? db.getProgramById(student.programId) : undefined) || db.getProgramById(transaction.programId);
  const semester = (student?.semesterId ? db.getSemesterById(student.semesterId) : undefined) || db.getSemesterById(transaction.semesterId);
  const department = program?.departmentId ? db.getDepartments().find(d => d.id === program.departmentId) : undefined;
  const institute = db.getInstitutes().find(i => i.id === program?.instituteId) || db.getInstitutes()[0];

  const feeCategoryTitle = transaction.feeType === 'EXAM'
    ? 'EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS'
    : transaction.feeType === 'HOSTEL'
    ? 'CAMPUS RESIDENCE & HOSTEL ADMINISTRATION'
    : transaction.feeType === 'TRANSPORT'
    ? 'TRANSPORT & LOGISTICS DEPARTMENT'
    : 'FINANCE & ACCOUNTS DEPARTMENT';

  const receiptTitle = transaction.feeType === 'EXAM'
    ? 'EXAMINATION FEE PAYMENT RECEIPT'
    : transaction.feeType === 'HOSTEL'
    ? 'HOSTEL FEE PAYMENT RECEIPT'
    : transaction.feeType === 'TRANSPORT'
    ? 'TRANSPORT FEE PAYMENT RECEIPT'
    : 'OFFICIAL UNIVERSITY FEE PAYMENT RECEIPT';

  // Build fee items
  const items: FeeReceiptItem[] = [];
  if (feeRecord && (feeRecord as any).breakdown && (feeRecord as any).breakdown.length > 0) {
    (feeRecord as any).breakdown.forEach((b: any, idx: number) => {
      items.push({
        sr: idx + 1,
        head: b.feeHead || b.headName || 'Fee Component',
        qty: '1 Term',
        rate: b.amount,
        amount: b.amount,
      });
    });
  } else {
    items.push({
      sr: 1,
      head: transaction.remarks || `${transaction.feeType || 'Academic Tuition'} Fee Installment`,
      qty: '1 Term',
      rate: transaction.paidAmount,
      amount: transaction.paidAmount,
    });
  }

  const dateParts = transaction.paymentDate ? transaction.paymentDate.split(' ') : [new Date().toISOString().split('T')[0]];
  const pDate = dateParts[0] || new Date().toISOString().split('T')[0];
  const pTime = dateParts[1] || '10:30 AM';

  const resolvedStudentName = student?.fullNameAsPerMarksheet || student?.name || transaction.studentName || 'Student';
  const resolvedEnrollmentNo = student?.enrollmentNo || transaction.enrollmentNo || '-';
  const resolvedAdmissionNo = student?.grNo || student?.admissionNumber || student?.admissionId || undefined;

  return {
    receiptNo: transaction.receiptNo || `SSIU-REC-${Date.now().toString().slice(-6)}`,
    transactionId: transaction.transactionId || `TXN${Date.now()}`,
    paymentDate: pDate,
    paymentTime: pTime,
    paymentStatus: transaction.status === 'SUCCESS' || !transaction.status ? 'PAID & VERIFIED' : transaction.status,
    paymentMode: transaction.paymentMode || 'Online UPI',
    academicYear: transaction.academicYear || student?.academicYear || feeRecord?.academicYear || '2026-2027',
    departmentOrSectionTitle: feeCategoryTitle,
    receiptTitle: receiptTitle,
    studentName: resolvedStudentName,
    enrollmentNo: resolvedEnrollmentNo,
    admissionNo: resolvedAdmissionNo,
    instituteName: institute?.name || student?.instituteName || 'Swarrnim Institute of Technology',
    programName: program?.name || student?.programName || 'Degree Program',
    departmentName: department?.name || program?.code || 'Main Campus',
    semesterName: semester?.name || semester?.code || transaction.semesterName || 'Semester 1',
    items: items,
    totalPaid: transaction.paidAmount,
    amountInWords: numberToWords(transaction.paidAmount),
    recordedBy: transaction.recordedBy || 'Accounts Officer',
    authorizedSignatoryTitle: transaction.feeType === 'EXAM' ? 'Controller of Examinations' : 'Finance & Accounts Officer',
    studentAcknowledgementTitle: 'Student Signature / Acknowledgment',
    officialDisclaimer: 'This is a computer-generated official University Fee Receipt. No physical signature required.'
  };
}

/**
 * Adapter from ExamFeeReceiptDetails (Exam section)
 */
export function fromExamFeeReceiptDetails(receipt: {
  receiptNo: string;
  transactionId: string;
  paymentDate: string;
  paymentTime: string;
  paymentMode: string;
  paymentStatus: string;
  studentName: string;
  enrollmentNo: string;
  instituteName: string;
  departmentName: string;
  programName: string;
  semesterName: string;
  academicYear: string;
  examCode: string;
  examName: string;
  examType: string;
  examSession: string;
  feeCode?: string;
  feeType?: string;
  baseFee: number;
  perSubjectFee: number;
  subjectCount: number;
  subjectFeeTotal: number;
  lateFee: number;
  otherCharges: number;
  totalPaid: number;
}): UniversalFeeReceiptData {
  // Single Source of Truth: Resolve student master record by enrollmentNo
  const student = db.getStudents().find(s => s.enrollmentNo === receipt.enrollmentNo);
  const resolvedStudentName = student?.fullNameAsPerMarksheet || student?.name || receipt.studentName;
  const resolvedAdmissionNo = student?.grNo || student?.admissionNumber || undefined;

  const items: FeeReceiptItem[] = [
    {
      sr: 1,
      head: `Base Examination Fee (${receipt.feeType || 'Regular'})`,
      qty: 'Fixed Rate',
      rate: receipt.baseFee,
      amount: receipt.baseFee
    },
    {
      sr: 2,
      head: `Subject Assessment Fee (₹${receipt.perSubjectFee}/subject)`,
      qty: `${receipt.subjectCount} Subject${receipt.subjectCount > 1 ? 's' : ''}`,
      rate: receipt.perSubjectFee,
      amount: receipt.subjectFeeTotal
    }
  ];

  if (receipt.lateFee > 0) {
    items.push({
      sr: items.length + 1,
      head: 'Late Submission Surcharge',
      qty: 'Overdue Penalty',
      rate: receipt.lateFee,
      amount: receipt.lateFee
    });
  }

  if (receipt.otherCharges > 0) {
    items.push({
      sr: items.length + 1,
      head: 'University Verification & Processing Fee',
      qty: 'Portal Service',
      rate: receipt.otherCharges,
      amount: receipt.otherCharges
    });
  }

  return {
    receiptNo: receipt.receiptNo,
    transactionId: receipt.transactionId,
    paymentDate: receipt.paymentDate,
    paymentTime: receipt.paymentTime,
    paymentStatus: receipt.paymentStatus || 'PAID & VERIFIED',
    paymentMode: receipt.paymentMode || 'Online UPI',
    academicYear: receipt.academicYear || student?.academicYear || '2026-2027',
    departmentOrSectionTitle: 'EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS',
    receiptTitle: 'EXAMINATION FEE PAYMENT RECEIPT',
    studentName: resolvedStudentName,
    enrollmentNo: receipt.enrollmentNo,
    admissionNo: resolvedAdmissionNo,
    instituteName: receipt.instituteName || student?.instituteName || 'Swarrnim Institute of Technology',
    programName: receipt.programName || student?.programName || 'Degree Program',
    departmentName: receipt.departmentName || 'Main Campus',
    semesterName: receipt.semesterName || 'Semester 4',
    extraDetails: [
      { label: 'Exam Code', value: receipt.examCode, bold: true },
      { label: 'Examination', value: receipt.examName, bold: true },
      { label: 'Exam Type', value: receipt.examType },
      { label: 'Exam Session', value: receipt.examSession }
    ],
    items: items,
    totalPaid: receipt.totalPaid,
    amountInWords: numberToWords(receipt.totalPaid),
    recordedBy: 'Controller of Examinations',
    authorizedSignatoryTitle: 'Controller of Examinations',
    studentAcknowledgementTitle: 'Student Signature / Acknowledgment',
    officialDisclaimer: 'This is a computer-generated official University Examination Fee Receipt. Valid for Hall Ticket issuance.'
  };
}

/**
 * Adapter from StudentSectionRequest (Student Section Services)
 */
export function fromStudentSectionRequest(req: {
  id: string;
  requestNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  admissionNo?: string;
  applicationNumber?: string;
  instituteName?: string;
  departmentName?: string;
  programName?: string;
  semesterName?: string;
  academicYear?: string;
  serviceCode: string;
  serviceName: string;
  category: string;
  purpose: string;
  copies: number;
  isUrgent?: boolean;
  calculatedFee: number;
  receiptNo?: string;
  paymentTransactionId?: string;
  paidAt?: string;
  paymentMode?: string;
  paymentStatus?: string;
  deliveryMode?: string;
  serviceSpecificData?: Record<string, any>;
}): UniversalFeeReceiptData {
  // Single Source of Truth: Resolve student master record
  const student = db.getStudents().find(s => s.id === req.studentId || s.enrollmentNo === req.enrollmentNo);
  const resolvedStudentName = student?.fullNameAsPerMarksheet || student?.name || req.studentName;
  const resolvedAdmissionNo = student?.grNo || student?.admissionNumber || req.admissionNo || req.applicationNumber;

  const items: FeeReceiptItem[] = [];

  if (req.serviceSpecificData?.feeBreakdown && Array.isArray(req.serviceSpecificData.feeBreakdown)) {
    req.serviceSpecificData.feeBreakdown.forEach((b: any, idx: number) => {
      items.push({
        sr: idx + 1,
        head: b.head,
        qty: b.qty || '1 Unit',
        rate: b.rate || b.amount,
        amount: b.amount
      });
    });
  } else {
    items.push({
      sr: 1,
      head: `University Official Service Fee (${req.serviceName})`,
      qty: `${req.copies} Cop${req.copies > 1 ? 'ies' : 'y'}`,
      rate: req.calculatedFee,
      amount: req.calculatedFee
    });
  }

  const pDateParts = req.paidAt ? req.paidAt.split('T') : [new Date().toISOString().split('T')[0]];
  const pDate = pDateParts[0];
  const pTime = pDateParts[1] ? pDateParts[1].substring(0, 8) : '11:00 AM';

  return {
    receiptNo: req.receiptNo || `SSR-FEE-${req.requestNo.replace(/\//g, '-')}`,
    transactionId: req.paymentTransactionId || `TXN-SSR-${req.id.slice(-6)}`,
    paymentDate: pDate,
    paymentTime: pTime,
    paymentStatus: req.paymentStatus || 'PAID & VERIFIED',
    paymentMode: req.paymentMode || 'Online UPI',
    academicYear: req.academicYear || student?.academicYear || '2026-2027',
    departmentOrSectionTitle: 'STUDENT SECTION • OFFICE OF THE REGISTRAR',
    receiptTitle: 'STUDENT SERVICE FEE PAYMENT RECEIPT',
    studentName: resolvedStudentName,
    enrollmentNo: req.enrollmentNo,
    admissionNo: resolvedAdmissionNo,
    instituteName: req.instituteName || student?.instituteName || 'Swarrnim Institute of Technology',
    programName: req.programName || student?.programName || 'Degree Program',
    departmentName: req.departmentName || (student as any)?.departmentName || 'Computer Science & Engineering',
    semesterName: req.semesterName || (student as any)?.semesterName || 'Semester 4',
    extraDetails: [
      { label: 'Request Number', value: req.requestNo, bold: true },
      { label: 'Official Service', value: req.serviceName, bold: true },
      { label: 'Service Code', value: req.serviceCode },
      { label: 'Delivery Mode', value: 'Physical Hardcopy (Collect from Student Section)' }
    ],
    items: items,
    totalPaid: req.calculatedFee,
    amountInWords: numberToWords(req.calculatedFee),
    recordedBy: 'Student Section Officer',
    authorizedSignatoryTitle: 'Registrar / Deputy Registrar',
    studentAcknowledgementTitle: 'Student Signature / Acknowledgment',
    officialDisclaimer: 'This is a computer-generated official University Student Section Fee Receipt. Valid for official document collection and verification.'
  };
}
