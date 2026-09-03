import React, { useState } from 'react';
import { NoteSheet } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { X, Receipt, UploadCloud } from 'lucide-react';

interface Props {
  noteSheet: NoteSheet;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddReimbursementModal: React.FC<Props> = ({ noteSheet, onClose, onSuccess }) => {
  const { user } = useAuth();
  const categories = db.getExpenseCategories().filter(c => c.isActive);

  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [applicantRole, setApplicantRole] = useState(user?.role || 'FACULTY');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(categories[0]?.name || 'Travel');
  const [purpose, setPurpose] = useState('');
  const [billAttachmentUrl, setBillAttachmentUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid reimbursement amount.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMsg('Please state the purpose and details of the expense.');
      return;
    }

    db.addReimbursement({
      noteSheetId: noteSheet.id,
      noteSheetNumber: noteSheet.noteSheetNumber,
      applicantId: user?.id || `user-${Date.now()}`,
      applicantName,
      applicantRole,
      expenseDate,
      amount: Number(amount),
      category,
      purpose: purpose.trim(),
      billAttachmentUrl: billAttachmentUrl.trim() || undefined
    }, user || { id: 'admin-1', name: applicantName, role: applicantRole as any, email: '', departmentId: '', instituteId: '' });

    onSuccess();
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '580px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} color="var(--brand-orange)" /> Submit Reimbursement Claim
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
              <label className="form-label">Applicant Name *</label>
              <input type="text" className="form-input" value={applicantName} onChange={e => setApplicantName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Designation / Role</label>
              <input type="text" className="form-input" value={applicantRole} onChange={e => setApplicantRole(e.target.value as any)} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Expense Date *</label>
              <input type="date" className="form-input" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Claim Amount (₹) *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '0.85rem', fontWeight: 700, color: 'var(--brand-orange)' }}>₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '1.85rem' }}
                  placeholder="Enter claim amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} required>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bill / Voucher Attachment (PDF / Image)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fuel_Bill_Receipt_102.pdf"
                  value={billAttachmentUrl}
                  onChange={e => setBillAttachmentUrl(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '0.75rem', color: 'var(--text-muted)' }}>
                  <UploadCloud size={16} />
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Description of Out-of-Pocket Expense *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Emergency purchase of ribbons, name tags and tea for external speakers."
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Receipt size={16} /> Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
