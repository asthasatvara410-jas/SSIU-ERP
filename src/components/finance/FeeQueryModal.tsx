import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { feeQueryService } from '../../services/feeQueryService';
import { FeeQueryCategory } from '../../types/feeQuery';
import { HelpCircle, AlertCircle, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DragDropUpload } from '../common/form';

interface FeeQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: FeeQueryCategory;
}

export const FeeQueryModal: React.FC<FeeQueryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'SEMESTER_FEE'
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<FeeQueryCategory>(defaultCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [claimedAmount, setClaimedAmount] = useState<number | undefined>(undefined);
  const [txRefNo, setTxRefNo] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject summary and detailed description.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      feeQueryService.createFeeQuery({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        claimedAmount: claimedAmount ? Number(claimedAmount) : undefined,
        transactionReferenceNo: txRefNo.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined
      }, user);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit fee query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Official Fee Query to Accounts Directorate" maxWidth="680px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Notice Info Box */}
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '8px',
          padding: '0.875rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <HelpCircle size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8125rem', color: '#1E40AF', lineHeight: 1.5 }}>
            <strong>Direct Accounts Routing:</strong> Fee queries are automatically routed to the <strong>Finance &amp; Accounts Directorate</strong>. Our accounts officers will verify your ledger statement, payment logs, and respond with official resolution.
          </div>
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

        <div className="grid-2">
          {/* Query Category */}
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Query Category <span style={{ color: '#EF4444' }}>*</span></label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value as FeeQueryCategory)}
              required
            >
              <option value="SEMESTER_FEE">Semester Tuition / Development Fee</option>
              <option value="EXAM_FEE">Regular Examination Fee</option>
              <option value="BACKLOG_FEE">Backlog / ATKT Exam Fee</option>
              <option value="RE_EXAM_FEE">Re-Exam / Remedial Fee</option>
              <option value="RECHECK_FEE">Recheck / Verification Fee</option>
              <option value="REASSESSMENT_FEE">Reassessment Fee</option>
              <option value="LATE_FEE">Late Fee Penalty Dispute</option>
              <option value="PAYMENT_ISSUE">Payment Deducted but Unsettled</option>
              <option value="RECEIPT_ISSUE">Receipt Generation Error</option>
              <option value="REFUND">Fee Refund / Excess Payment Reversal</option>
              <option value="OTHER_FEE_QUERY">Other Accounts Inquiry</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Urgency / Priority</label>
            <select
              className="form-select"
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
            >
              <option value="LOW">Low (General Inquiry)</option>
              <option value="MEDIUM">Medium (Normal Processing)</option>
              <option value="HIGH">High (Upcoming Deadline)</option>
              <option value="URGENT">Urgent (Exam Clearance / Disputed Debit)</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="form-label" style={{ fontWeight: 600 }}>Subject / Title <span style={{ color: '#EF4444' }}>*</span></label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Merit scholarship concession not adjusted in Semester 4 ledger"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label className="form-label" style={{ fontWeight: 600 }}>Detailed Description <span style={{ color: '#EF4444' }}>*</span></label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Please detail your query with specific amounts, dates, bank transaction references, or concession order numbers..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid-2">
          {/* Claimed Amount */}
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Claimed / Disputed Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 5000"
              value={claimedAmount || ''}
              onChange={e => setClaimedAmount(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          {/* Bank / Gateway Tx Reference */}
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Bank Reference / UTR Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI/123456789/HDFC or Axis Ref"
              value={txRefNo}
              onChange={e => setTxRefNo(e.target.value)}
            />
          </div>
        </div>

        {/* Supporting Evidence Upload with Drag & Drop and N/A */}
        <DragDropUpload
          label="Supporting Evidence / Payment Proof"
          value={attachmentUrl}
          onFileUrlChange={(url) => setAttachmentUrl(url)}
          allowNotApplicable={true}
          requirement="OPTIONAL"
          notApplicableLabel="Supporting proof not applicable"
          helperText="Upload bank debit screenshot, challan or sanction order (PDF, PNG, JPG up to 5MB)."
          maxSizeMB={5}
        />

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : (
              <>
                <Send size={16} /> Submit to Accounts
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
