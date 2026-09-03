import React from 'react';
import { UniversalFeeReceiptData } from './receiptTypes';
import { ReceiptCopy } from './ReceiptCopy';

interface FeeReceiptPrintProps {
  receipt: UniversalFeeReceiptData;
}

export const FeeReceiptPrint: React.FC<FeeReceiptPrintProps> = ({ receipt }) => {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body > * {
            visibility: hidden !important;
          }

          #ssiu-universal-fee-receipt-print-root,
          #ssiu-universal-fee-receipt-print-root * {
            visibility: visible !important;
          }

          #ssiu-universal-fee-receipt-print-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 194mm !important;
            max-width: 194mm !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 3mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #FFFFFF !important;
            z-index: 999999 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
          }

          .receipt-print-separator {
            border-top: 1px dashed #94A3B8 !important;
            text-align: center !important;
            font-size: 7.5px !important;
            font-weight: 700 !important;
            color: #64748B !important;
            padding: 1px 0 !important;
            margin: 1mm 0 !important;
          }

          .no-print,
          .no-print * {
            display: none !important;
          }
        }
      `}</style>

      <div id="ssiu-universal-fee-receipt-print-root">
        {/* Copy 1: STUDENT COPY */}
        <ReceiptCopy receipt={receipt} copyType="STUDENT COPY" isPrint={true} />

        {/* Separator Line */}
        <div className="receipt-print-separator">
          ✂ - - - - - - - - - - - - - - CUT / TEAR ALONG THIS LINE (STUDENT COPY ON TOP / DEPARTMENT COPY ON BOTTOM) - - - - - - - - - - - - - - ✂
        </div>

        {/* Copy 2: DEPARTMENT COPY */}
        <ReceiptCopy receipt={receipt} copyType="DEPARTMENT COPY" isPrint={true} />
      </div>
    </>
  );
};
