import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  Student, 
  DataChangeCategory, 
  DATA_CHANGE_FIELD_CATALOG, 
  DataChangeFieldDef 
} from '../../types';
import { studentDataChangeRequestService } from '../../services/studentDataChangeRequestService';
import { 
  FileText, AlertTriangle, Upload, CheckCircle2, 
  ArrowRight, ShieldCheck, HelpCircle, Lock, Info 
} from 'lucide-react';
import { DragDropUpload } from '../common/form';

interface StudentDataChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  initialFieldKey?: string;
  onSuccess?: () => void;
}

export const StudentDataChangeRequestModal: React.FC<StudentDataChangeRequestModalProps> = ({
  isOpen,
  onClose,
  student,
  initialFieldKey,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [category, setCategory] = useState<DataChangeCategory>('CONTACT');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>(initialFieldKey || 'phone');
  const [newValue, setNewValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentSize, setAttachmentSize] = useState<string>('1.2 MB');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [isNotApplicableDoc, setIsNotApplicableDoc] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set initial field key if provided
  React.useEffect(() => {
    if (initialFieldKey) {
      const match = DATA_CHANGE_FIELD_CATALOG.find(f => f.key === initialFieldKey);
      if (match) {
        setCategory(match.category);
        setSelectedFieldKey(match.key);
      }
    }
  }, [initialFieldKey]);

  // Available fields in selected category
  const availableFields = useMemo(() => {
    return DATA_CHANGE_FIELD_CATALOG.filter(f => f.category === category);
  }, [category]);

  // Current selected field definition
  const currentFieldDef = useMemo<DataChangeFieldDef | undefined>(() => {
    return DATA_CHANGE_FIELD_CATALOG.find(f => f.key === selectedFieldKey) || availableFields[0];
  }, [selectedFieldKey, availableFields]);

  // Current registered value in Student master record
  const currentValue = useMemo(() => {
    if (!student || !currentFieldDef) return '';
    return studentDataChangeRequestService.extractCurrentValue(student, currentFieldDef.key);
  }, [student, currentFieldDef]);

  // Duplicate Check in real-time
  const duplicatePendingRequest = useMemo(() => {
    if (!student || !currentFieldDef) return null;
    const all = studentDataChangeRequestService.getAllRequests();
    const pendingStatuses = ['DRAFT', 'SUBMITTED', 'MENTOR_PENDING', 'MENTOR_APPROVED', 'HOD_PENDING'];
    return all.find(r => r.studentId === student.id && r.fieldName === currentFieldDef.key && pendingStatuses.includes(r.status));
  }, [student, currentFieldDef]);

  const handleCategoryChange = (cat: DataChangeCategory) => {
    setCategory(cat);
    const firstField = DATA_CHANGE_FIELD_CATALOG.find(f => f.category === cat);
    if (firstField) {
      setSelectedFieldKey(firstField.key);
      setNewValue('');
    }
    setError('');
  };

  const handleFieldChange = (key: string) => {
    setSelectedFieldKey(key);
    setNewValue('');
    setError('');
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachmentName(file.name);
      setAttachmentSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setAttachmentUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !user) return;
    setError('');
    setSuccessMsg('');

    if (duplicatePendingRequest) {
      setError('A change request for this field is already pending.');
      return;
    }

    if (!newValue.trim()) {
      setError('Please enter the requested new value.');
      return;
    }

    if (newValue.trim() === currentValue.trim()) {
      setError('Requested new value is identical to current registered value.');
      return;
    }

    if (!reason.trim()) {
      setError('Please enter a clear justification reason for the data change.');
      return;
    }

    if (currentFieldDef?.requiresAttachment && !attachmentName) {
      setError(`Supporting proof attachment is mandatory for ${currentFieldDef.label}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      studentDataChangeRequestService.createRequest(
        {
          studentId: student.id,
          fieldCategory: category,
          fieldName: currentFieldDef?.key || selectedFieldKey,
          fieldLabel: currentFieldDef?.label || selectedFieldKey,
          newValue: newValue.trim(),
          reason: reason.trim(),
          attachmentName: attachmentName || `Proof_${selectedFieldKey}.pdf`,
          attachmentSize: attachmentSize || '1.1 MB',
          attachmentUrl: attachmentUrl || 'https://docs.swarrnim.edu.in/proofs/student_id.pdf',
        },
        user
      );

      setSuccessMsg('Data Change Request submitted successfully! It has been forwarded to your assigned Mentor for review.');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit data change request.');
    }
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Master Data Change Request"
      subtitle={`Student: ${student.name} (${student.enrollmentNo})`}
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Notice Banner */}
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(243, 112, 35, 0.08)',
          borderLeft: '4px solid var(--brand-orange, #F37023)',
          borderRadius: '4px',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <Lock size={18} color="var(--brand-orange, #F37023)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)', lineHeight: 1.4 }}>
            <strong>Official Record Protection Policy:</strong> Direct editing of master profile fields is strictly disabled for security and regulatory compliance. All requests are routed through <strong>Mentor Review &rarr; HOD Final Approval</strong> before the official record updates.
          </div>
        </div>

        {/* Duplicate Pending Warning */}
        {duplicatePendingRequest && (
          <div style={{
            padding: '0.85rem 1rem',
            background: '#FEE2E2',
            border: '1px solid #F87171',
            borderRadius: '6px',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#991B1B', fontSize: '0.85rem', display: 'block' }}>
                A change request for this field is already pending.
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#7F1D1D' }}>
                Request <code>{duplicatePendingRequest.requestNo}</code> is currently in status <strong>{duplicatePendingRequest.status}</strong>. You cannot submit another request for this field until the existing one is resolved.
              </span>
            </div>
          </div>
        )}

        {/* Error / Success Banners */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#059669" /> {successMsg}
          </div>
        )}

        {/* 1. Category Selection Tabs */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>
            1. Select Field Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {(['PERSONAL', 'CONTACT', 'PARENT', 'ACADEMIC', 'OTHER'] as DataChangeCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: category === cat ? '2px solid var(--brand-orange, #F37023)' : '1px solid var(--border-color, #E2E8F0)',
                  background: category === cat ? 'rgba(243, 112, 35, 0.08)' : 'var(--bg-surface, #FFFFFF)',
                  color: category === cat ? 'var(--brand-orange, #F37023)' : 'var(--brand-navy, #0B192C)',
                  fontWeight: category === cat ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center'
                }}
              >
                {cat === 'PERSONAL' && '👤 Personal'}
                {cat === 'CONTACT' && '📞 Contact'}
                {cat === 'PARENT' && '👨‍👩‍👧 Parents'}
                {cat === 'ACADEMIC' && '🎓 Academic'}
                {cat === 'OTHER' && '📋 Other'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Field Selection Dropdown */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>
            2. Choose Specific Field To Update
          </label>
          <select
            className="form-control"
            value={selectedFieldKey}
            onChange={e => handleFieldChange(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.875rem', fontWeight: 600 }}
          >
            {availableFields.map(f => (
              <option key={f.key} value={f.key}>
                {f.label} {f.requiresAttachment ? '*(Doc Required)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Old vs New Value Comparison Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'center',
          padding: '1rem',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          {/* Current Registered Value */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase' }}>
              Current Value in Master
            </span>
            <div style={{
              padding: '0.65rem 0.75rem',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: currentValue ? 'var(--brand-navy, #0B192C)' : 'var(--text-muted, #94A3B8)',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              wordBreak: 'break-word'
            }}>
              {currentValue || '— None / Not Set —'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
            <ArrowRight size={20} color="var(--brand-orange, #F37023)" />
          </div>

          {/* Requested New Value Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', textTransform: 'uppercase' }}>
              Requested New Value *
            </span>
            {currentFieldDef?.inputType === 'select' ? (
              <select
                className="form-control"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}
                required
              >
                <option value="">-- Select New Value --</option>
                {currentFieldDef.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : currentFieldDef?.inputType === 'textarea' ? (
              <textarea
                className="form-control"
                rows={2}
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="Enter new permanent address..."
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}
                required
              />
            ) : (
              <input
                type={currentFieldDef?.inputType || 'text'}
                className="form-control"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder={`Enter new ${currentFieldDef?.label.toLowerCase() || 'value'}`}
                style={{ width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}
                required
              />
            )}
          </div>
        </div>

        {/* 4. Reason for Change */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>
            4. Reason &amp; Justification for Data Change *
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this change is required (e.g. Correction of spelling error, SIM card upgraded, relocation, gazette update)..."
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.875rem' }}
            required
          />
        </div>

        {/* 5. Supporting Document Proof Upload */}
        <DragDropUpload
          label={`5. Supporting Document / Attachment`}
          requirement={currentFieldDef?.requiresAttachment ? 'REQUIRED' : 'OPTIONAL'}
          required={currentFieldDef?.requiresAttachment}
          value={attachmentUrl || attachmentName}
          allowNotApplicable={!currentFieldDef?.requiresAttachment}
          isNotApplicable={isNotApplicableDoc}
          onNotApplicableChange={(na) => {
            setIsNotApplicableDoc(na);
            if (na) {
              setAttachmentName('N/A (Supporting Document Not Applicable)');
              setAttachmentUrl('N/A');
            } else {
              setAttachmentName('');
              setAttachmentUrl('');
            }
          }}
          notApplicableLabel="Supporting document not applicable"
          onUploadSuccess={(item) => {
            if (Array.isArray(item)) return;
            setAttachmentName(item.name);
            setAttachmentUrl(item.url);
            setAttachmentSize(item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB');
            setIsNotApplicableDoc(false);
          }}
          onFileUrlChange={(url) => setAttachmentUrl(url)}
          onRemove={() => {
            setAttachmentName('');
            setAttachmentUrl('');
            setIsNotApplicableDoc(false);
          }}
          helperText={currentFieldDef?.helpText || (currentFieldDef?.requiresAttachment ? 'Mandatory official document proof required (PDF, PNG, JPG up to 5MB).' : 'Upload supporting document if available, or mark Not Applicable.')}
          maxSizeMB={5}
          allowedExtensions={['.pdf', '.png', '.jpg', '.jpeg', '.docx']}
        />

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
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
            className="btn btn-primary"
            disabled={isSubmitting || Boolean(duplicatePendingRequest)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShieldCheck size={16} />
            {isSubmitting ? 'Submitting Request...' : 'Submit Change Request'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
