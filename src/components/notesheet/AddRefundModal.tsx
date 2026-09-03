import React, { useState } from 'react';
import { NoteSheet, PaymentMode } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { X, RotateCcw } from 'lucide-react';

interface Props {
  noteSheet: NoteSheet;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRefundModal: React.FC<Props> = ({ noteSheet, onClose, onSuccess }) => {
  const { user } = useAuth();
  const fundAccounts = db.getFundAccounts().filter(a => a.status === 'ACTIVE');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [toAccountId, setToAccountId] = useState(noteSheet.allocatedFundAccountId || fundAccounts[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid refund / return amount.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please enter the reason for the refund / returned money.');
      return;
    }
    if (!toAccountId) {
      setErrorMsg('Please select a destination fund account.');
      return;
    }

    const selectedAcc = fundAccounts.find(a => a.id === toAccountId);
    const toAccountName = selectedAcc ? selectedAcc.name : 'University Fund';

    db.addRefund({
      noteSheetId: noteSheet.id,
      noteSheetNumber: noteSheet.noteSheetNumber,
      date,
      amount: Number(amount),
      reason: reason.trim(),
      returnedTo: toAccountName,
      paymentMode,
      referenceNo: referenceNo.trim() || `REF-RET-${Date.now().toString().slice(-6)}`,
      toAccountId,
      toAccountName,
      processedBy: user?.name || 'Authorized Officer',
      processedById: user?.id || 'admin-1',
      remarks: remarks.trim() || undefined
    }, user || { id: 'admin-1', name: 'Finance Officer', role: 'REGISTRAR' as any, email: '', departmentId: '', instituteId: '' });

    onSuccess();
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '580px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RotateCcw size={20} color="var(--brand-orange)" /> Record Return / Refund Money
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Note Sheet: <strong>{noteSheet.noteSheetNumber}</strong>
            </p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger, #dc2626)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Return Date *</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '0.85rem', fontWeight: 700, color: 'var(--brand-orange)' }}>₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '1.85rem' }}
                  placeholder="Enter refunded amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Return / Refund *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Unspent advance returned, Vendor security deposit refund"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Returned To Account *</label>
              <select className="form-select" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                {fundAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} (Bal: ₹{a.currentBalance.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} required>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="UPI">UPI / QR</option>
                <option value="Cash">Cash Deposit</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reference / Transaction Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UTR-REF-99212, Cheque #00129"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Reconciliation Details</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Credited back to Student Activity Fund after event settlement."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <RotateCcw size={16} /> Record Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
