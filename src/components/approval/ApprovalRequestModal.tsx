import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { ApprovalOfficeType, ApprovalPriority, ApprovalRequestCategory } from '../../types';
import { 
  getPermittedApprovalCategories, 
  getPermittedTargetOffices, 
  canUserAccessApprovalCategory 
} from '../../services/securityService';
import { FileUp, Send, AlertCircle, ShieldCheck } from 'lucide-react';

interface ApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Category display label helper
const CATEGORY_LABELS: Record<ApprovalRequestCategory, string> = {
  BONAFIDE_CERTIFICATE: 'Bonafide Certificate',
  TRANSCRIPT_DEGREE: 'Official Transcript & Degree Verification',
  FEE_CONCESSION: 'Fee Concession & Scholarship Application',
  HOSTEL_NO_DUES: 'Hostel No-Dues & Clearance Certificate',
  RE_EVALUATION: 'Exam Re-evaluation & Answer Script Verification',
  NO_OBJECTION_CERTIFICATE: 'No Objection Certificate (NOC)',
  LEAVE_APPLICATION: 'Academic Duty / Medical Leave Application',
  RESEARCH_GRANT: 'Research & Project Grant Sanction',
  EVENT_PERMISSION: 'Institutional Event & Seminar Permission',
  INFRASTRUCTURE_MAINTENANCE: 'Campus Infrastructure & Maintenance Requisition',
  GENERAL_ADMINISTRATIVE: 'General Administrative Approval'
};

const OFFICE_LABELS: Record<ApprovalOfficeType, string> = {
  STUDENT_SECTION: 'Student Section & Certificates',
  EXAM_CELL: 'Examination Controller Office',
  HOSTEL_ADMIN: 'Hostel Administration & Warden Desk',
  TRANSPORT_ADMIN: 'Transport Office',
  MAINTENANCE_ADMIN: 'Estate & Maintenance Office',
  FINANCE_CELL: 'Finance & Accounts Office',
  REGISTRAR: 'Registrar Office',
  UNIVERSITY_ADMIN: 'Vice Chancellor / University Admin',
  IQAC: 'IQAC Quality Assurance Cell',
  HOD_ACADEMIC: 'Department HOD Desk',
  LIBRARY_ADMIN: 'Library Administration'
};

export const ApprovalRequestModal: React.FC<ApprovalRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, role } = useAuth();

  const permittedCategories = useMemo(() => {
    return getPermittedApprovalCategories(role);
  }, [role]);

  const [category, setCategory] = useState<ApprovalRequestCategory>(() => 
    permittedCategories[0] || 'BONAFIDE_CERTIFICATE'
  );
  
  const permittedOffices = useMemo(() => {
    return getPermittedTargetOffices(category, role);
  }, [category, role]);

  const [targetOffice, setTargetOffice] = useState<ApprovalOfficeType>(() => 
    permittedOffices[0] || 'STUDENT_SECTION'
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ApprovalPriority>('MEDIUM');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState<string>('');
  const [financialEstimateSummary, setFinancialEstimateSummary] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!canUserAccessApprovalCategory(category, role)) {
      if (permittedCategories.length > 0) {
        setCategory(permittedCategories[0]);
      }
    }
  }, [role, permittedCategories, category]);

  useEffect(() => {
    if (!permittedOffices.includes(targetOffice)) {
      if (permittedOffices.length > 0) {
        setTargetOffice(permittedOffices[0]);
      }
    }
  }, [category, role, targetOffice, permittedOffices]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please provide a title and detailed description for your request.');
      return;
    }

    if (!canUserAccessApprovalCategory(category, role)) {
      alert('403 Forbidden: You do not have permission to submit requests in this category.');
      return;
    }

    const attachments = fileName.trim() ? [
      {
        id: `att-${Date.now()}`,
        fileName: fileName.trim(),
        fileSize: '1.5 MB',
        fileType: fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
        fileUrl: '#',
        uploadedAt: new Date().toISOString()
      }
    ] : [];

    const parsedAmount = amount.trim() ? parseFloat(amount.trim()) : undefined;

    try {
      db.addApprovalRequest({
        applicantId: user.id,
        applicantName: user.name,
        applicantRole: user.role,
        applicantEmail: user.email,
        applicantPhone: user.phone || '+91 98765 43210',
        applicantEnrollmentOrEmpId: user.enrollmentNo || user.employeeId || 'ID-GENERIC',
        departmentId: user.departmentId,
        departmentName: user.departmentId ? 'Department of ' + user.departmentId : undefined,
        instituteId: user.instituteId,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        targetOffice,
        currentOffice: targetOffice,
        amount: parsedAmount,
        financialEstimateSummary: financialEstimateSummary.trim() || (parsedAmount ? `Estimated amount: ₹${parsedAmount.toLocaleString('en-IN')}` : undefined),
        status: 'PENDING',
        deadlineDate,
        attachments
      }, remarks.trim() || `Submitted request ${title.trim()} to ${targetOffice}`, user, role);

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Submission failed.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit New Central Approval Request" maxWidth="760px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ background: 'var(--bg-surface-hover)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.84375rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={18} color="var(--brand-orange)" />
          <div>
            Request submitted by <strong>{user.name}</strong> (<span style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>{user.role}</span>). Form options are strictly filtered according to your role authorizations.
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Request Category *</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value as ApprovalRequestCategory)}
              required
            >
              {permittedCategories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Target Office Desk *</label>
            <select
              className="form-select"
              value={targetOffice}
              onChange={e => setTargetOffice(e.target.value as ApprovalOfficeType)}
              required
            >
              {permittedOffices.map(off => (
                <option key={off} value={off}>
                  {OFFICE_LABELS[off] || off}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Request Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Urgent Bonafide Certificate for Education Loan Sanction"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Detailed Proposal / Justification *</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Provide complete details, purpose, background context, and statutory requirements..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid-2">
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Priority Level *</label>
            <select
              className="form-select"
              value={priority}
              onChange={e => setPriority(e.target.value as ApprovalPriority)}
            >
              <option value="LOW">Low Priority (Standard SLA)</option>
              <option value="MEDIUM">Medium Priority (Regular)</option>
              <option value="HIGH">High Priority (Urgent Action)</option>
              <option value="URGENT">Urgent (Immediate Review)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Required Resolution Deadline *</label>
            <input
              type="date"
              className="form-input"
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Financial Estimate / Amount (INR, if applicable)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Financial Budget Summary (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Department Fund / Co-sponsored Budget"
              value={financialEstimateSummary}
              onChange={e => setFinancialEstimateSummary(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Attach Supporting Document (Optional)</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <FileUp size={20} color="var(--brand-orange)" />
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Supporting_Doc_Proof.pdf"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Submission Remarks / Comments</label>
          <input
            type="text"
            className="form-input"
            placeholder="Initial comments for the receiving office officer..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> Submit Approval Request
          </button>
        </div>
      </form>
    </Modal>
  );
};
