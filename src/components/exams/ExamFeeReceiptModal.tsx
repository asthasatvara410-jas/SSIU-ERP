import React, { useEffect } from 'react';
import { fromExamFeeReceiptDetails } from '../receipt/receiptTypes';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';

export interface ExamFeeReceiptDetails {
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
}

interface ExamFeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ExamFeeReceiptDetails | null;
}

/**
 * Headless Direct PDF Exam Fee Receipt Trigger (Replaces old modal popup system)
 * Immediately generates and opens the official A4 Landscape dual-copy PDF in a new tab.
 */
export const ExamFeeReceiptModal: React.FC<ExamFeeReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  useEffect(() => {
    if (isOpen && receipt) {
      const universalReceipt = fromExamFeeReceiptDetails(receipt);
      feeReceiptPdfService.openInNewTab(universalReceipt);
      onClose();
    }
  }, [isOpen, receipt, onClose]);

  return null;
};
