import React, { useState, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentRequestService } from '../../services/studentRequestService';
import { StudentRequestCategory } from '../../types/studentRequest';
import { 
  Send, AlertCircle, UserCheck, AlertTriangle, 
  Upload, FileText, X, Phone, Paperclip, CheckCircle
} from 'lucide-react';

interface StudentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { value: StudentRequestCategory; label: string }[] = [
  { value: 'ACADEMIC', label: 'Academic Matter' },
  { value: 'SUBJECT_RELATED', label: 'Subject / Syllabus Related' },
  { value: 'ATTENDANCE', label: 'Attendance Discrepancy / Leave' },
  { value: 'FACULTY_RELATED', label: 'Faculty Query / Guidance' },
  { value: 'EXAMINATION', label: 'Examination & Hall Ticket' },
  { value: 'FEES', label: 'Fee Payment & Concession' },
  { value: 'ACCOUNTS', label: 'Accounts & Refund Query' },
  { value: 'HOSTEL', label: 'Hostel Allotment & Room Issue' },
  { value: 'TRANSPORT', label: 'Transport & Bus Route' },
  { value: 'IT_SUPPORT', label: 'IT Support & Portal Issue' },
  { value: 'LIBRARY', label: 'Library & Book Issue' },
  { value: 'DOCUMENT_CERTIFICATE', label: 'Bonafide / Certificates / NOC' },
  { value: 'COMPLAINT', label: 'Student Grievance / Complaint' },
  { value: 'OTHER', label: 'General Administrative Request' }
];

export const StudentRequestModal: React.FC<StudentRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<StudentRequestCategory>('SUBJECT_RELATED');
  const [subjectId, setSubjectId] = useState<string>('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [preferredContact, setPreferredContact] = useState(user?.phone || '');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-lookup assigned mentor
  const mentorInfo = useMemo(() => {
    if (!user) return null;
    try {
      return studentRequestService.getStudentMentor(user.id || user.enrollmentNo || user.email);
    } catch (e: any) {
      return null;
    }
  }, [user]);

  // Enrolled subjects for student
  const availableSubjects = useMemo(() => {
    return db.getSubjects();
  }, []);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeInMB} MB`);
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setGeneralError(null);

    // Field-level validation
    if (!subjectTitle.trim() || !description.trim()) {
      return;
    }

    if ((category === 'SUBJECT_RELATED' || category === 'ACADEMIC') && availableSubjects.length > 0 && !subjectId) {
      // If none selected, default to first available subject
      setSubjectId(availableSubjects[0]?.id || '');
    }

    if (!mentorInfo) {
      setGeneralError('Your mentor is not assigned. Please contact the Student Section.');
      return;
    }

    const attachments = fileName.trim() ? [
      {
        id: `att-${Date.now()}`,
        fileName: fileName.trim(),
        fileSize: fileSize || '1.2 MB',
        fileType: fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
        uploadedAt: new Date().toISOString()
      }
    ] : [];

    setIsSubmitting(true);
    try {
      studentRequestService.createStudentRequest({
        category,
        subjectId: (category === 'SUBJECT_RELATED' || category === 'ACADEMIC') ? (subjectId || availableSubjects[0]?.id) : undefined,
        subject: subjectTitle.trim(),
        description: description.trim(),
        priority,
        attachments,
        preferredContact: preferredContact.trim() || undefined
      }, user);

      onSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to submit student request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTitleInvalid = formSubmitted && !subjectTitle.trim();
  const isDescInvalid = formSubmitted && !description.trim();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create Student Request"
      subtitle="Student Request Submission Form — Submit your academic or departmental request for review and resolution."
      maxWidth="860px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ minWidth: '100px', fontWeight: 600 }}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={!mentorInfo || isSubmitting}
            style={{ 
              background: !mentorInfo ? '#94A3B8' : 'var(--brand-orange, #F37023)',
              borderColor: !mentorInfo ? '#94A3B8' : 'var(--brand-orange, #F37023)',
              opacity: !mentorInfo ? 0.65 : 1,
              cursor: !mentorInfo ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              minWidth: '170px',
              justifyContent: 'center'
            }}
          >
            <Send size={16} /> Submit to Mentor
          </button>
        </div>
      }
    >
      <form 
        noValidate 
        onSubmit={handleSubmit} 
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        
        {/* Mentor Routing Alert Notification */}
        {mentorInfo ? (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <UserCheck size={20} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#15803D' }}>
                Automatic Mentor Routing Active
              </div>
              <div style={{ fontSize: '0.78125rem', color: '#166534', marginTop: '0.15rem', lineHeight: 1.4 }}>
                Your request will be submitted directly to your assigned Faculty Mentor: <strong>{mentorInfo.mentorName}</strong> for initial assessment and controlled routing.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#B91C1C' }}>
                Mentor Assignment Required
              </div>
              <div style={{ fontSize: '0.78125rem', color: '#991B1B', marginTop: '0.15rem', lineHeight: 1.4 }}>
                Your mentor is not currently assigned. Please contact the Student Section before submitting a request.
              </div>
            </div>
          </div>
        )}

        {generalError && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            color: '#B91C1C',
            padding: '0.65rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        {/* ROW 1: Request Category & Priority Level (2-column layout) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
              Request Category <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as StudentRequestCategory)}
              className="input-field"
              style={{ width: '100%', height: '40px', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
              Priority Level <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="input-field"
              style={{ width: '100%', height: '40px', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
            >
              <option value="LOW">Low — Normal Inquiry</option>
              <option value="MEDIUM">Medium — Standard Request</option>
              <option value="HIGH">High — Time Sensitive</option>
              <option value="URGENT">Urgent — Immediate Attention Required</option>
            </select>
          </div>
        </div>

        {/* ROW 2: Enrolled Subject (Full Width when Subject Related or Academic) */}
        {(category === 'SUBJECT_RELATED' || category === 'ACADEMIC') && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
              Enrolled Subject <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="input-field"
              style={{ width: '100%', height: '40px', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
            >
              <option value="">-- Select Relevant Academic Subject --</option>
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', marginTop: '0.3rem', display: 'block' }}>
              Your mentor will route this request to the faculty member assigned to teach this subject.
            </span>
          </div>
        )}

        {/* ROW 3: Request Subject / Title (Full Width) */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
            Request Subject / Title <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={subjectTitle}
            onChange={e => setSubjectTitle(e.target.value)}
            placeholder="e.g. Request for Lab Evaluation / Attendance Leave Regularization"
            className="input-field"
            style={{ 
              width: '100%', 
              height: '40px', 
              fontSize: '0.85rem',
              borderColor: isTitleInvalid ? '#EF4444' : '#CBD5E1',
              backgroundColor: isTitleInvalid ? '#FFF8F8' : '#FFFFFF'
            }}
          />
          {isTitleInvalid && (
            <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
              Please enter a brief subject or title for your request.
            </span>
          )}
        </div>

        {/* ROW 4: Detailed Description (Full Width Large Textarea) */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
            Detailed Description <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Provide complete details, affected dates, subject context, roll number, or explanation of the request..."
            className="input-field"
            style={{ 
              width: '100%', 
              minHeight: '130px', 
              resize: 'vertical',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              padding: '0.75rem',
              borderColor: isDescInvalid ? '#EF4444' : '#CBD5E1',
              backgroundColor: isDescInvalid ? '#FFF8F8' : '#FFFFFF'
            }}
          />
          {isDescInvalid && (
            <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
              Please provide detailed information describing your request.
            </span>
          )}
        </div>

        {/* ROW 5: Supporting Document & Preferred Contact Number (2-Column Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
              Supporting Document / Attachment (Optional)
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ display: 'none' }}
            />

            {!fileName ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '6px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-orange, #F37023)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={16} color="var(--brand-orange, #F37023)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy, #0B192C)' }}>
                    Upload Document
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)' }}>
                  PDF, JPG, PNG (Max 5MB)
                </span>
              </div>
            ) : (
              <div style={{
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F0FDF4'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <Paperclip size={15} color="#15803D" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#15803D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fileName}
                  </span>
                  {fileSize && (
                    <span style={{ fontSize: '0.7rem', color: '#166534', flexShrink: 0 }}>
                      ({fileSize})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#991B1B',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove attachment"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
              Preferred Contact Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="tel"
                value={preferredContact}
                onChange={e => setPreferredContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-field"
                style={{ width: '100%', height: '40px', paddingLeft: '2.25rem', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
              />
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
};
