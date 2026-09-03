import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { feeQueryService } from '../../services/feeQueryService';
import { FeeQuery } from '../../types/feeQuery';
import { Badge } from '../common/Badge';
import { CheckCircle2, XCircle, AlertCircle, Send, User, Calendar, FileText } from 'lucide-react';

interface FeeQueryResolveModalProps {
  query: FeeQuery | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeeQueryResolveModal: React.FC<FeeQueryResolveModalProps> = ({
  query,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [actionType, setActionType] = useState<'RESOLVED' | 'REJECTED' | 'UNDER_REVIEW'>('RESOLVED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !query || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) {
      setError('Please provide a resolution summary or explanation.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      feeQueryService.resolveFeeQuery(query.id, {
        resolutionSummary: resolutionSummary.trim(),
        resolutionRemarks: resolutionRemarks.trim() || resolutionSummary.trim(),
        action: actionType
      }, user);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update fee query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review Fee Query: ${query.queryNo}`} maxWidth="720px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Ticket Header */}
        <div style={{
          backgroundColor: 'var(--bg-main)',
          padding: '1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                {query.subject}
              </span>
              <Badge variant="navy">{query.category.replace(/_/g, ' ')}</Badge>
              <Badge variant={query.priority === 'URGENT' ? 'danger' : query.priority === 'HIGH' ? 'warning' : 'navy'}>
                {query.priority}
              </Badge>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Submitted by <strong>{query.studentName}</strong> ({query.enrollmentNo}) • {query.departmentName}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Date Submitted:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
              {new Date(query.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Student's Query Description */}
        <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#F8FAFC' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
            Student Query Description:
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {query.description}
          </div>
          {(query.claimedAmount || query.transactionReferenceNo || query.attachmentUrl) && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              {query.claimedAmount && <div>Claimed Amount: <strong>₹{query.claimedAmount.toLocaleString()}</strong></div>}
              {query.transactionReferenceNo && <div>Bank Ref/UTR: <strong>{query.transactionReferenceNo}</strong></div>}
              {query.attachmentUrl && (
                <div>
                  <a href={query.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-orange)', fontWeight: 600 }}>
                    View Attached Proof
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Selection */}
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Accounts Decision Action <span style={{ color: '#EF4444' }}>*</span></label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionType"
                value="RESOLVED"
                checked={actionType === 'RESOLVED'}
                onChange={() => setActionType('RESOLVED')}
              />
              <span style={{ fontWeight: 600, color: 'var(--brand-green)' }}>Resolve Query</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionType"
                value="UNDER_REVIEW"
                checked={actionType === 'UNDER_REVIEW'}
                onChange={() => setActionType('UNDER_REVIEW')}
              />
              <span style={{ fontWeight: 600, color: 'var(--brand-gold)' }}>Put Under Investigation</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionType"
                value="REJECTED"
                checked={actionType === 'REJECTED'}
                onChange={() => setActionType('REJECTED')}
              />
              <span style={{ fontWeight: 600, color: '#EF4444' }}>Reject Query</span>
            </label>
          </div>
        </div>

        {/* Official Resolution Summary */}
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            Official Resolution Summary (Visible to Student) <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Verified bank UTR. ₹10,000 scholarship credit voucher posted to your fee ledger."
            value={resolutionSummary}
            onChange={e => setResolutionSummary(e.target.value)}
            required
          />
        </div>

        {/* Internal Remarks / Audit Notes */}
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Detailed Resolution Remarks &amp; Accounting Notes</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Enter full accounting adjustment details, ledger voucher IDs, or bank settlement references..."
            value={resolutionRemarks}
            onChange={e => setResolutionRemarks(e.target.value)}
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Close
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : (
              <>
                <CheckCircle2 size={16} /> Save Resolution &amp; Notify Student
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
