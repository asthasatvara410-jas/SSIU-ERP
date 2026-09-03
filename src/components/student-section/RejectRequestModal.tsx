import React, { useState } from 'react';
import { StudentSectionRequest } from '../../types/studentSection';
import { User } from '../../types';
import { studentSectionService } from '../../services/studentSectionService';
import { Modal } from '../common/Modal';
import { AlertTriangle, XCircle } from 'lucide-react';

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: StudentSectionRequest;
  staffUser: User;
  onSuccess: (updatedRequest: StudentSectionRequest) => void;
}

export const RejectRequestModal: React.FC<RejectRequestModalProps> = ({
  isOpen,
  onClose,
  request,
  staffUser,
  onSuccess
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedReasons = [
    'Uploaded grade reports/documents are blurry or unreadable.',
    'Fee payment pending verification or transaction reference invalid.',
    'Disciplinary clearance pending from Proctorial Board.',
    'No-dues clearance certificate missing from Hostel/Library.',
    'Incomplete application purpose or incorrect academic year selected.'
  ];

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('A mandatory rejection reason is required before rejecting the application.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = studentSectionService.rejectRequest(request.id, rejectionReason.trim(), staffUser);
      setIsSubmitting(false);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to reject request.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Application: ${request.requestNo}`}
      subtitle={`Service: ${request.serviceName} • Student: ${request.studentName}`}
      maxWidth="560px"
    >
      <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8125rem', color: '#991B1B', lineHeight: 1.5 }}>
            <strong>Mandatory Administrative Requirement:</strong> When rejecting a student service request, an official justification must be recorded in the audit log and communicated to the student.
          </div>
        </div>

        {error && (
          <div style={{ color: '#DC2626', fontSize: '0.8125rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
            Quick Select Common Reason:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {predefinedReasons.map((reason, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRejectionReason(reason)}
                style={{
                  textAlign: 'left',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  fontSize: '0.75rem',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                • {reason}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
            Official Rejection Reason (Sent to Student) <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Type detailed rejection remarks..."
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.875rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={isSubmitting}
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <XCircle size={15} /> Confirm Rejection
          </button>
        </div>

      </form>
    </Modal>
  );
};
