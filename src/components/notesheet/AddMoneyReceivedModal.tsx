import React, { useState } from 'react';
import { NoteSheet, PaymentMode } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowDownLeft, UploadCloud } from 'lucide-react';

interface Props {
  noteSheet: NoteSheet;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMoneyReceivedModal: React.FC<Props> = ({ noteSheet, onClose, onSuccess }) => {
  const { user } = useAuth();
  const fundAccounts = db.getFundAccounts().filter(a => a.status === 'ACTIVE');
  const fundSources = db.getFundSources().filter(s => s.isActive);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [source, setSource] = useState(fundSources[0]?.name || 'University Fund');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankAccountId, setBankAccountId] = useState(noteSheet.allocatedFundAccountId || fundAccounts[0]?.id || '');
  const [receivedBy, setReceivedBy] = useState(user?.name || 'Authorized Officer');
  const [remarks, setRemarks] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }
    if (!bankAccountId) {
      setErrorMsg('Please select a destination fund / bank account.');
      return;
    }

    const selectedAcc = fundAccounts.find(a => a.id === bankAccountId);
    const bankAccountName = selectedAcc ? selectedAcc.name : 'University Fund';

    db.addMoneyReceived({
      noteSheetId: noteSheet.id,
      noteSheetNumber: noteSheet.noteSheetNumber,
      date,
      amount: Number(amount),
      source,
      paymentMode,
      referenceNo: referenceNo.trim() || `TXN-REC-${Date.now().toString().slice(-6)}`,
      bankAccountId,
      bankAccountName,
      receivedBy,
      receivedById: user?.id || 'admin-1',
      remarks,
      receiptUrl: receiptUrl.trim() || undefined
    }, user || { id: 'admin-1', name: 'Finance Officer', role: 'REGISTRAR' as any, email: '', departmentId: '', instituteId: '' });

    onSuccess();
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDownLeft size={20} color="var(--color-success, #10b981)" /> Add Money Received / Income
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Note Sheet: <strong>{noteSheet.noteSheetNumber}</strong> — {noteSheet.subject}
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
              <label className="form-label">Receipt Date *</label>
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
                  placeholder="Enter received amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Fund Source *</label>
              <select className="form-select" value={source} onChange={e => setSource(e.target.value)} required>
                {fundSources.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} required>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Credit to Fund Account *</label>
              <select className="form-select" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} required>
                {fundAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} (Bal: ₹{a.currentBalance.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Reference / Transaction ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. UTR-992144, Cheque #4412"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Received By (Officer/Handler) *</label>
              <input
                type="text"
                className="form-input"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attachment / Receipt Document (Optional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bank_Challan_Receipt.pdf"
                  value={receiptUrl}
                  onChange={e => setReceiptUrl(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '0.75rem', color: 'var(--text-muted)' }}>
                  <UploadCloud size={16} />
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Purpose Details</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Advance installment credited for TechFest organization"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowDownLeft size={16} /> Record Money Received
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
