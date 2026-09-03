import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AdmissionApplication, FeePaymentTransaction } from '../../types';
import { studentOnboardingService } from '../../services/studentOnboardingService';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, Smartphone, Building2, CheckCircle2, 
  XCircle, AlertTriangle, Download, ArrowRight, ShieldCheck, 
  IndianRupee, Lock, Sparkles, RefreshCw, Printer
} from 'lucide-react';
import logoSvg from '../../assets/swarrnim-logo.svg';

import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../receipt/receiptTypes';

interface AdmissionFeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
  onPaymentSuccess: (transaction: FeePaymentTransaction, app: AdmissionApplication) => void;
  onOpenReceipt?: (transaction: FeePaymentTransaction) => void;
  onOpenOnboard?: (app: AdmissionApplication) => void;
}

export const AdmissionFeePaymentModal: React.FC<AdmissionFeePaymentModalProps> = ({
  isOpen,
  onClose,
  application,
  onPaymentSuccess,
  onOpenReceipt,
  onOpenOnboard
}) => {
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING'>('UPI');
  const [upiId, setUpiId] = useState('student@oksbi');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('•••');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'SUCCESS' | 'FAILED' | 'IDLE';
    transaction?: FeePaymentTransaction;
    receiptNo?: string;
    transactionId?: string;
    paidAmount?: number;
    paidAt?: string;
    message?: string;
  }>({ status: 'IDLE' });

  if (!application) return null;

  const programs = db.getPrograms();
  const departments = db.getDepartments();
  const prog = programs.find(p => p.id === application.programId);
  const dept = departments.find(d => d.id === application.departmentId) || departments.find(d => d.id === prog?.departmentId);

  const totalFee = application.feeTotal || 25000;
  const discount = 0;
  const payableAmount = application.feePending || application.feeAmountPaid || 25000;

  const handleSimulatePayment = (simulationStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED') => {
    if (simulationStatus === 'CANCELLED') {
      onClose();
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const res = studentOnboardingService.payAdmissionFee({
        applicationId: application.id,
        amount: payableAmount,
        paymentMethod,
        simulationStatus,
        actor: user
      });

      if (res.success && res.transaction) {
        setPaymentResult({
          status: 'SUCCESS',
          transaction: res.transaction,
          receiptNo: res.receiptNumber,
          transactionId: res.transactionId,
          paidAmount: res.paidAmount,
          paidAt: res.paidAt,
          message: res.message
        });
        const updatedApp = db.getAdmissionApplications().find(a => a.id === application.id) || application;
        onPaymentSuccess(res.transaction, updatedApp);
        feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(res.transaction));
      } else {
        setPaymentResult({
          status: 'FAILED',
          message: res.message || 'Payment simulation failed. Please try again.'
        });
      }
    }, 600);
  };

  const handleResetForRetry = () => {
    setPaymentResult({ status: 'IDLE' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admission Fee Payment Gateway"
      subtitle="Swarrnim Startup & Innovation University — Official Admission Fee Portal"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* University Header Brand Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          borderTop: '3px solid #F37023'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logoSvg} alt="SSIU" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                SWARRNIM UNIVERSITY
              </h4>
              <p style={{ margin: 0, fontSize: '0.71875rem', color: '#94A3B8' }}>
                Initial Admission &amp; Seat Confirmation Fee
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1', display: 'block' }}>DEMO SIMULATION MODE</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FDBA74' }}>SECURE GATEWAY</span>
          </div>
        </div>

        {/* ─── STATE 1: PAYMENT SUCCESS CONFIRMATION ──────────────────────────── */}
        {paymentResult.status === 'SUCCESS' && paymentResult.transaction ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            background: '#F8FAFC',
            border: '2px solid #10B981',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: '2px solid #A7F3D0'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#065F46', margin: 0 }}>
                Payment Successful!
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#047857', margin: '4px 0 0 0' }}>
                Admission fee has been settled and verified. Official university receipt generated.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              fontSize: '0.8125rem'
            }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>APPLICANT NAME</span>
                <strong style={{ color: '#0F2C59' }}>{application.applicantName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>APPLICATION NUMBER</span>
                <strong style={{ fontFamily: 'monospace', color: '#F37023' }}>{application.applicationNumber || application.id}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>TRANSACTION ID</span>
                <strong style={{ fontFamily: 'monospace', color: '#0F2C59' }}>{paymentResult.transactionId}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>RECEIPT NUMBER</span>
                <strong style={{ fontFamily: 'monospace', color: '#047857' }}>{paymentResult.receiptNo}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>AMOUNT PAID</span>
                <strong style={{ fontSize: '1.05rem', color: '#047857' }}>₹{paymentResult.paidAmount?.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>PAYMENT DATE</span>
                <strong style={{ color: '#334155' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(paymentResult.transaction!))}
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} /> View &amp; Download Fee Receipt PDF
              </button>

              {onOpenOnboard && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onOpenOnboard(application);
                  }}
                  style={{ fontWeight: 800, background: '#0F2C59', borderColor: '#0F2C59', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowRight size={16} /> Proceed to Final Onboarding
                </button>
              )}
            </div>
          </div>
        ) : paymentResult.status === 'FAILED' ? (
          /* ─── STATE 2: PAYMENT FAILED ─────────────────────────────────────── */
          <div style={{
            background: '#FEF2F2',
            border: '2px solid #EF4444',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <XCircle size={30} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                Payment Transaction Failed
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#B91C1C', margin: '4px 0 0 0' }}>
                {paymentResult.message || 'Payment simulation failed. Final onboarding remains locked until fee payment is confirmed.'}
              </p>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetForRetry}
                style={{ fontWeight: 700 }}
              >
                <RefreshCw size={14} style={{ display: 'inline', marginRight: '4px' }} /> Retry Fee Payment
              </button>
            </div>
          </div>
        ) : (
          /* ─── STATE 3: PAYMENT FORM & SELECTION ───────────────────────────── */
          <>
            {/* Student & Fee Summary Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              fontSize: '0.8125rem'
            }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>STUDENT NAME</span>
                <strong style={{ color: '#0F2C59', fontSize: '0.875rem' }}>{application.applicantName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>APPLICATION NO.</span>
                <strong style={{ fontFamily: 'monospace', color: '#F37023' }}>{application.applicationNumber || application.id}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>PROGRAM &amp; DEPARTMENT</span>
                <span style={{ color: '#334155' }}>{prog?.name || 'B.Tech CSE'} ({dept?.name || 'Engineering'})</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>ADMISSION CATEGORY</span>
                <span style={{ color: '#334155' }}>{application.category || 'General Merit'}</span>
              </div>
            </div>

            {/* Fee Amount Calculation Banner */}
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
                  Total Payable Initial Admission Fee
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#C2410C' }}>
                  ₹{payableAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#9A3412' }}>
                <div>Total Fee: ₹{totalFee.toLocaleString('en-IN')}</div>
                <div>Scholarship / Discount: -₹{discount.toLocaleString('en-IN')}</div>
                <div style={{ fontWeight: 800, marginTop: '2px', color: '#C2410C' }}>Net Due: ₹{payableAmount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F2C59', display: 'block', marginBottom: '0.5rem' }}>
                SELECT PAYMENT METHOD
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                  { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
                  { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
                  { id: 'NET_BANKING', label: 'Net Banking', icon: Building2 }
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '6px',
                        border: `2px solid ${isSelected ? '#F37023' : '#E2E8F0'}`,
                        background: isSelected ? '#FFF7ED' : '#FFFFFF',
                        color: isSelected ? '#C2410C' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={18} color={isSelected ? '#F37023' : '#64748B'} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Details Input Fields */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.85rem' }}>
              {paymentMethod === 'UPI' && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Enter Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              )}

              {(paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Card Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Expiry</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>CVV</label>
                    <input
                      type="password"
                      className="form-control"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'NET_BANKING' && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Select Bank</label>
                  <select
                    className="form-control"
                    value={selectedBank}
                    onChange={e => setSelectedBank(e.target.value)}
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* DEMO MODE Simulation Trigger Buttons */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2C59', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} color="#F37023" /> DEMO PAYMENT SIMULATION ACTIONS:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  style={{
                    background: '#047857',
                    borderColor: '#047857',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    padding: '0.65rem 0.5rem'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Simulate Successful Payment'}
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment('FAILED')}
                  style={{
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    padding: '0.65rem 0.5rem'
                  }}
                >
                  Simulate Failed Payment
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment('CANCELLED')}
                  style={{
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    padding: '0.65rem 0.5rem'
                  }}
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
