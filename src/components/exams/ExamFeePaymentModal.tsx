import React, { useState } from 'react';
import { Badge } from '../common/Badge';
import { X, CreditCard, ShieldCheck, IndianRupee, QrCode, Smartphone, Building, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import logoSvg from '../../assets/swarrnim-logo.svg';

export interface ExamFeePaymentData {
  feeCode: string;
  feeType: string;
  description: string;
  baseFee: number;
  perSubjectFee: number;
  subjectCount: number;
  lateFee: number;
  otherCharges: number;
  totalAmount: number;
  dueDate: string;
  examId: string;
  examName: string;
  examType: string;
  academicYear: string;
  semesterName: string;
  formId?: string;
}

interface ExamFeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeData: ExamFeePaymentData;
  student: any;
  onSuccess: (paymentResult: {
    receiptNo: string;
    transactionId: string;
    paidAmount: number;
    paymentMode: string;
    paidDate: string;
    paidTime: string;
    feeData: ExamFeePaymentData;
  }) => void;
}

export const ExamFeePaymentModal: React.FC<ExamFeePaymentModalProps> = ({
  isOpen,
  onClose,
  feeData,
  student,
  onSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiApp, setUpiApp] = useState('Google Pay / PhonePe (QR & UPI ID)');
  const [upiId, setUpiId] = useState(`${student?.enrollmentNo?.toLowerCase() || 'student'}@okaxis`);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('•••');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !feeData) return null;

  const handleProceedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    // Simulate safe University ERP Gateway transaction
    setTimeout(() => {
      const now = new Date();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const transactionId = `TXN-EXAM-${Date.now().toString().slice(-6)}-${randomSeq}`;
      const receiptNo = `EXAM-FEE/${now.getFullYear()}/${String(randomSeq).padStart(4, '0')}`;
      const paidDate = now.toISOString().split('T')[0];
      const paidTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setIsProcessing(false);
      onSuccess({
        receiptNo,
        transactionId,
        paidAmount: feeData.totalAmount,
        paymentMode: paymentMethod === 'UPI' ? `UPI (${upiApp})` : paymentMethod === 'CARD' ? 'Debit / Credit Card' : `Net Banking (${selectedBank})`,
        paidDate,
        paidTime,
        feeData
      });
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#FFFFFF',
        width: '100%',
        maxWidth: '640px',
        borderRadius: '6px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        
        {/* Top Header */}
        <div style={{
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #F37023'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <IndianRupee size={20} color="#F37023" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                University Examination Fee Payment
              </h3>
              <div style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>
                Swarrnim Startup &amp; Innovation University • Secure Payment Gateway
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleProceedPayment} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '1.25rem', gap: '1rem' }}>
          
          {errorMessage && (
            <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          {/* Student & Examination Identification Strip */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Student Name:</span>
                <div style={{ fontWeight: 800, color: '#0F2C59' }}>{student?.name || 'Kavya Shah'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Enrollment No:</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#F37023' }}>{student?.enrollmentNo || '26SSIU042'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Examination:</span>
                <div style={{ fontWeight: 700, color: '#0F2C59' }}>{feeData.examName}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Academic Year:</span>
                <div style={{ fontWeight: 700, color: '#334155' }}>{feeData.academicYear} • {feeData.semesterName}</div>
              </div>
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.45rem 0.75rem', fontSize: '0.78125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
              <span>FEE HEAD ITEMIZATION — {feeData.feeType} ({feeData.feeCode})</span>
              <span style={{ color: '#FDBA74' }}>Due Date: {feeData.dueDate}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                  <td style={{ padding: '6px 10px', color: '#475569' }}>Base Examination Fee</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>₹{feeData.baseFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <td style={{ padding: '6px 10px', color: '#475569' }}>
                    Subject Fee (₹{feeData.perSubjectFee} × {feeData.subjectCount} subject{feeData.subjectCount > 1 ? 's' : ''})
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>₹{(feeData.perSubjectFee * feeData.subjectCount).toLocaleString('en-IN')}</td>
                </tr>
                {feeData.lateFee > 0 && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FEF2F2' }}>
                    <td style={{ padding: '6px 10px', color: '#DC2626', fontWeight: 700 }}>Late Fee Surcharge (Overdue)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#DC2626', fontFamily: 'monospace' }}>+₹{feeData.lateFee.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                {feeData.otherCharges > 0 && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <td style={{ padding: '6px 10px', color: '#475569' }}>Administrative / Portal Processing Charges</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>+₹{feeData.otherCharges.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                <tr style={{ background: '#EFF6FF', borderTop: '2px solid #0F2C59' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0F2C59', fontSize: '0.875rem' }}>TOTAL AMOUNT PAYABLE</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0F2C59', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                    ₹{feeData.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2C59', display: 'block', marginBottom: '6px' }}>
              SELECT PAYMENT METHOD *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                style={{
                  padding: '0.65rem',
                  border: `2px solid ${paymentMethod === 'UPI' ? '#0F2C59' : '#CBD5E1'}`,
                  background: paymentMethod === 'UPI' ? '#F0F9FF' : '#FFFFFF',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={20} color={paymentMethod === 'UPI' ? '#0F2C59' : '#64748B'} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: paymentMethod === 'UPI' ? '#0F2C59' : '#334155' }}>
                  UPI / QR Code
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                style={{
                  padding: '0.65rem',
                  border: `2px solid ${paymentMethod === 'CARD' ? '#0F2C59' : '#CBD5E1'}`,
                  background: paymentMethod === 'CARD' ? '#F0F9FF' : '#FFFFFF',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={20} color={paymentMethod === 'CARD' ? '#0F2C59' : '#64748B'} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: paymentMethod === 'CARD' ? '#0F2C59' : '#334155' }}>
                  Debit / Credit Card
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                style={{
                  padding: '0.65rem',
                  border: `2px solid ${paymentMethod === 'NETBANKING' ? '#0F2C59' : '#CBD5E1'}`,
                  background: paymentMethod === 'NETBANKING' ? '#F0F9FF' : '#FFFFFF',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Building size={20} color={paymentMethod === 'NETBANKING' ? '#0F2C59' : '#64748B'} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: paymentMethod === 'NETBANKING' ? '#0F2C59' : '#334155' }}>
                  Net Banking
                </span>
              </button>
            </div>
          </div>

          {/* Payment Method Specific Inputs */}
          {paymentMethod === 'UPI' && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                  Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  className="form-control"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. username@okhdfcbank"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
              <div style={{ fontSize: '0.71875rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <CheckCircle2 size={13} /> Instant Verification via UPI Autopay / Gateway
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                  Card Number
                </label>
                <input
                  className="form-control"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  placeholder="4532 •••• •••• ••••"
                  style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                    Valid Thru (MM/YY)
                  </label>
                  <input
                    className="form-control"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                    CVV
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    placeholder="•••"
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'NETBANKING' && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '4px' }}>
              <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                Select Authorised Bank
              </label>
              <select
                className="form-control"
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
              </select>
            </div>
          )}

          {/* Security & Verification Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.6rem 0.85rem', borderRadius: '4px', fontSize: '0.75rem', color: '#065F46' }}>
            <Lock size={14} color="#059669" />
            <span>256-Bit SSL Encrypted University Payment Gateway • Instant Receipt Generation</span>
          </div>

          {/* Bottom Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isProcessing}
              style={{
                background: '#0F2C59',
                borderColor: '#0F2C59',
                fontWeight: 800,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShieldCheck size={16} />
              {isProcessing ? 'Authorizing Payment...' : `Proceed to Payment (₹${feeData.totalAmount.toLocaleString('en-IN')})`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
