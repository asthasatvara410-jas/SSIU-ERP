import React, { useEffect } from 'react';
import { FeePaymentTransaction, StudentFeeRecord } from '../../types';
import { fromFeePaymentTransaction } from '../receipt/receiptTypes';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FeePaymentTransaction | null;
  feeRecord?: StudentFeeRecord | null;
}

/**
 * Headless Direct PDF Receipt Trigger (Replaces old modal popup system)
 * When opened, immediately generates and displays the official A4 Landscape PDF in a new tab.
 */
export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  feeRecord
}) => {
  useEffect(() => {
    if (isOpen && transaction) {
      const receiptData = fromFeePaymentTransaction(transaction, feeRecord);
      feeReceiptPdfService.openInNewTab(receiptData);
      onClose();
    }
  }, [isOpen, transaction, feeRecord, onClose]);

  return null;
};
