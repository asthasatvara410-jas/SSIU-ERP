import React, { useState } from 'react';
import { StudentGatePass } from '../../types';
import { studentGatePassService } from '../../services/studentGatePassService';
import { X, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

interface WardenGatePassReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatePass: StudentGatePass;
  action: 'APPROVE' | 'REJECT';
  user: any;
  onSuccess: (updatedPass: StudentGatePass) => void;
}

export const WardenGatePassReviewModal: React.FC<WardenGatePassReviewModalProps> = ({
  isOpen,
  onClose,
  gatePass,
  action,
  user,
  onSuccess
}) => {
  const [wardenRemarks, setWardenRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !gatePass) return null;

  const isApprove = action === 'APPROVE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let updated: StudentGatePass;
      if (isApprove) {
        updated = studentGatePassService.approveGatePass(gatePass.id, wardenRemarks, user);
      } else {
        if (!rejectionReason.trim()) {
          setError('Rejection reason is mandatory.');
          return;
        }
        updated = studentGatePassService.rejectGatePass(gatePass.id, rejectionReason, user);
      }

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    }
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
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div style={{
        background: '#FFFFFF',
        width: '100%',
        maxWidth: '520px',
        borderRadius: '6px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        
        {/* Modal Top */}
        <div style={{
          background: isApprove ? '#047857' : '#DC2626',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.9375rem' }}>
            {isApprove ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {isApprove ? 'Chief Warden Approval: Student Gate Pass' : 'Reject Student Gate Pass Request'}
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}

          {/* Quick Details */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748B' }}>Gate Pass No:</span>
              <strong style={{ fontFamily: 'monospace', color: '#0F2C59' }}>{gatePass.gatePassNo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748B' }}>Student:</span>
              <strong>{gatePass.studentName} ({gatePass.enrollmentNo})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748B' }}>Purpose &amp; Destination:</span>
              <span>{gatePass.purpose} • {gatePass.destination}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Outing Timing:</span>
              <span>{gatePass.outingDate} ({gatePass.expectedOutTime} - {gatePass.expectedReturnTime})</span>
            </div>
          </div>

          {isApprove ? (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Warden Clearance Remarks (Optional)
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Approved for family outing. Return before 09:30 PM."
                value={wardenRemarks}
                onChange={e => setWardenRemarks(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', display: 'block', marginBottom: '4px' }}>
                Mandatory Rejection Reason *
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Specify administrative, disciplinary or timing reason for rejection..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm"
              style={{
                background: isApprove ? '#047857' : '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800
              }}
            >
              {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
