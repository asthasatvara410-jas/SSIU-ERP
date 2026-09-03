import React, { useEffect } from 'react';
import { UniversalFeeReceiptData } from './receiptTypes';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';

interface UniversalFeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: UniversalFeeReceiptData | null;
}

/**
 * Headless Universal Fee Receipt Trigger
 * Opens PDF directly in new tab with native browser PDF viewer.
 */
export const UniversalFeeReceiptModal: React.FC<UniversalFeeReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  useEffect(() => {
    if (isOpen && receipt) {
      feeReceiptPdfService.openInNewTab(receipt);
      onClose();
    }
  }, [isOpen, receipt, onClose]);

  return null;
};
