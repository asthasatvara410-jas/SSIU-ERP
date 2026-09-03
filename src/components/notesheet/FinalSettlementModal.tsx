import React, { useState } from 'react';
import { NoteSheet } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle2, Lock, Unlock, ShieldAlert } from 'lucide-react';

interface Props {
  noteSheet: NoteSheet;
  onClose: () => void;
  onSuccess: () => void;
}

export const FinalSettlementModal: React.FC<Props> = ({ noteSheet, onClose, onSuccess }) => {
  const { user } = useAuth();
  const summary = db.getNoteSheetFinancialSummary(noteSheet.id);
  const settlements = db.getFinancialSettlements(noteSheet.id);
  const currentSettlement = settlements.find(s => s.isClosed);

  const [remarks, setRemarks] = useState(currentSettlement?.closureRemarks || 'All event expenses reconciled and bills verified. Account ready for formal closure.');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'REGISTRAR';

  const handleCloseAccount = () => {
    if (!isAdmin) {
      setErrorMsg('Only Registrar or Super Admin is authorized to formally close financial accounts.');
      return;
    }
    if (!remarks.trim()) {
      setErrorMsg('Please enter final settlement and closure remarks.');
      return;
    }

    db.closeNoteSheetFinancialAccount(noteSheet.id, remarks.trim(), user || { id: 'admin-1', name: 'Dr. Registrar', role: 'REGISTRAR' as any, email: '', departmentId: '', instituteId: '' });
    onSuccess();
    onClose();
  };

  const handleReopenAccount = () => {
    if (!isAdmin) {
      setErrorMsg('Only Registrar or Super Admin is authorized to reopen closed accounts.');
      return;
    }
    db.reopenNoteSheetFinancialAccount(noteSheet.id, user || { id: 'admin-1', name: 'Dr. Registrar', role: 'REGISTRAR' as any, email: '', departmentId: '', instituteId: '' });
    onSuccess();
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {summary.isClosed ? <Lock size={20} color="var(--color-danger)" /> : <CheckCircle2 size={20} color="var(--color-success)" />}
              Financial Final Settlement &amp; Account Closure
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

        {/* Settlement Summary Breakdown Table */}
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Final Financial Reconciliation Statement
          </div>

          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Approved / Sanctioned Budget:</td>
                <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  ₹ {summary.approvedBudget.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Total Money Received / Disbursed:</td>
                <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                  ₹ {summary.totalReceived.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Total Money Spent (Approved Expenses):</td>
                <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                  - ₹ {summary.totalSpent.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Total Money Returned / Refunded:</td>
                <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: '#7e22ce' }}>
                  + ₹ {summary.totalReturned.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-surface-hover)' }}>
                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Final Remaining Balance / Unutilized:
                </td>
                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: summary.balanceAvailable <= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  ₹ {summary.balanceAvailable.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Budget Utilization Percentage:</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--brand-orange)' }}>
                  {summary.utilizedPercentage.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {summary.isClosed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(100, 116, 139, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#334155' }}>
              <Lock size={18} /> Financial Account Status: CLOSED
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Closed By: <strong>{currentSettlement?.settledBy || 'Authorized Admin'}</strong> on {currentSettlement?.settledDate}
            </div>
            {currentSettlement?.closureRemarks && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                "{currentSettlement.closureRemarks}"
              </div>
            )}
            {isAdmin && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleReopenAccount}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-orange)' }}
                >
                  <Unlock size={15} /> Reopen Financial Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {!isAdmin && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(234, 179, 8, 0.12)', color: '#b45309', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} /> Final settlement can only be executed by Registrar or Super Admin.
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Settlement &amp; Audit Closure Remarks *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter formal verification notes, unspent fund disposal and reconciliation approval."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCloseAccount}
                disabled={!isAdmin}
                style={{ background: 'var(--brand-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Lock size={16} /> Finalize &amp; Close Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
