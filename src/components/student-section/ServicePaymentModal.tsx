import React, { useState } from 'react';
import { StudentSectionRequest } from '../../types/studentSection';
import { User, PaymentMode } from '../../types';
import { studentSectionService } from '../../services/studentSectionService';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useModalScrollLock } from '../../utils/modalScrollLock';
import swarrnimLogo from '../../assets/swarrnim-university-logo.png';
import { 
  CreditCard, CheckCircle2, AlertCircle, ShieldCheck, QrCode, 
  ArrowRight, Download, Printer, ExternalLink, Sparkles, Building2, X
} from 'lucide-react';

import { studentSectionFeeMasterService } from '../../services/studentSectionFeeMasterService';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction, fromStudentSectionRequest } from '../receipt/receiptTypes';
import { db } from '../../services/db';

interface ServicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: StudentSectionRequest;
  user: User;
  onPaymentSuccess: (receiptNo: string) => void;
}

export const ServicePaymentModal: React.FC<ServicePaymentModalProps> = ({
  isOpen,
  onClose,
  request,
  user,
  onPaymentSuccess
}) => {
  const [payMode, setPayMode] = useState<PaymentMode>('Online UPI');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('•••');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const result = studentSectionService.processPayment(request.id, {
          paymentMode: payMode,
          shouldSucceed: true
        }, user);

        setIsProcessing(false);
        if (result.success && result.receiptNo) {
          setSuccessReceipt(result.receiptNo);
          onPaymentSuccess(result.receiptNo);
          const updatedReq = db.getStudentSectionRequests().find(r => r.id === request.id);
          if (updatedReq) {
            feeReceiptPdfService.openInNewTab(fromStudentSectionRequest(updatedReq));
          } else {
            const tx = db.getFeePaymentTransactions().find(t => t.receiptNo === result.receiptNo);
            if (tx) {
              feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(tx));
            }
          }
        } else {
          setErrorMessage(result.error || 'Payment failed. Please retry.');
        }
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(err.message || 'Payment processing error.');
      }
    }, 1200);
  };

  useModalScrollLock(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="student-section-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="student-section-payment-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Service Fee Payment"
      >
        
        {/* Success Confirmation View */}
        {successReceipt ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', overflowY: 'auto', flex: '1 1 auto' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0F2C59)', margin: '0 0 0.25rem 0' }}>
              Application Submitted Successfully!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
              Your university service fee payment has been confirmed and officially recorded.
            </p>

            {/* Receipt Summary Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '1.25rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              fontSize: '0.8125rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B' }}>Service Request Number:</span>
                <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{request.requestNo}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B' }}>Official Payment Receipt:</span>
                <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{successReceipt}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B' }}>Service Applied:</span>
                <strong style={{ color: '#0F2C59' }}>{request.serviceName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B' }}>Amount Paid:</span>
                <strong style={{ color: '#0F2C59', fontSize: '0.9375rem' }}>₹{request.calculatedFee}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Expected Working-Day SLA:</span>
                <strong style={{ color: '#1E40AF' }}>{request.expectedCompletionDate || '3 Working Days'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const updatedReq = db.getStudentSectionRequests().find(r => r.id === request.id);
                  if (updatedReq) {
                    feeReceiptPdfService.openInNewTab(fromStudentSectionRequest(updatedReq));
                  } else {
                    const tx = db.getFeePaymentTransactions().find(t => t.receiptNo === successReceipt);
                    if (tx) feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(tx));
                  }
                }}
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={15} /> View Receipt PDF
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ minWidth: '160px', fontWeight: 800 }}
              >
                Track in My Requests
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            
            {/* 1. Fixed Header Box */}
            <div style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #F37023'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#F37023', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SWARRNIM ERP FEE GATEWAY
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0' }}>
                  {request.serviceName}
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                  Request No: <strong style={{ fontFamily: 'monospace' }}>{request.requestNo}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#E2E8F0' }}>Total Payable Amount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF' }}>
                    ₹{request.calculatedFee}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Close payment window"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <div style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              {errorMessage && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Itemized Fee Breakdown Summary (From Centralized Fee Master) */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#EEF4FB',
                  padding: '6px 10px',
                  fontSize: '0.71875rem',
                  fontWeight: 800,
                  color: '#0F2C59',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #CBD5E1'
                }}>
                  <span>OFFICIAL FEE PARTICULARS</span>
                  <span>AMOUNT</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {((request.serviceSpecificData?.feeBreakdown as any[]) || [
                    { head: `${request.serviceName} Base Fee`, qty: '1 Copy', amount: request.calculatedFee }
                  ]).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        fontSize: '0.78125rem',
                        borderBottom: '1px solid #F1F5F9'
                      }}
                    >
                      <span style={{ color: '#334155' }}>{item.head}</span>
                      <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>
                        ₹{item.amount?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: '#F1F5F9',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    color: '#0F2C59'
                  }}>
                    <span>TOTAL AMOUNT PAYABLE</span>
                    <span>₹{request.calculatedFee?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                  Select Payment Method
                </label>
                <select
                  className="form-select"
                  value={payMode}
                  onChange={e => setPayMode(e.target.value as PaymentMode)}
                >
                  <option value="Online UPI">Instant UPI (Google Pay, PhonePe, Paytm, BHIM)</option>
                  <option value="Net Banking">Net Banking (HDFC, SBI, ICICI, Axis Bank)</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash Payment at University Student Section Counter</option>
                </select>
              </div>

              {/* Dynamic Payment Details */}
              {payMode === 'Online UPI' && (
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Virtual Payment Address (UPI ID)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    required
                  />
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                    You will receive a collection request on your UPI mobile application.
                  </div>
                </div>
              )}

              {payMode === 'Net Banking' && (
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Select Bank
                  </label>
                  <select
                    className="form-select"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                  </select>
                </div>
              )}

              {(payMode === 'Debit Card' || payMode === 'Credit Card') && (
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Card Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Valid Thru (MM/YY)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        className="form-input"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {payMode === 'Cash' && (
                <div style={{ background: '#FEF3C7', padding: '1rem', borderRadius: '6px', border: '1px solid #FDE68A', fontSize: '0.8125rem', color: '#92400E' }}>
                  <strong>Cash Counter Payment:</strong> Pay ₹{request.calculatedFee} directly at the Student Section Accounts Counter (Ground Floor, Admin Block). The fee receipt will be endorsed instantly by the cashier.
                </div>
              )}
            </div>

            {/* 3. Fixed Footer Buttons */}
            <div style={{
              flexShrink: 0,
              background: '#F8FAFC',
              borderTop: '1px solid #CBD5E1',
              padding: '0.875rem 1.25rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              zIndex: 10
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isProcessing}
                style={{
                  background: 'var(--brand-orange, #F37023)',
                  borderColor: 'var(--brand-orange, #F37023)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isProcessing ? (
                  'Verifying & Authorizing...'
                ) : (
                  <>
                    <CreditCard size={15} /> Pay ₹{request.calculatedFee} &amp; Submit
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
