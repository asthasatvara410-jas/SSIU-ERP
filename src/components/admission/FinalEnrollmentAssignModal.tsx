import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Student } from '../../types';
import { studentOnboardingService } from '../../services/studentOnboardingService';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  KeyRound, CheckCircle2, AlertCircle, ShieldCheck, 
  GraduationCap, Building2, BookOpen, Clock, AlertTriangle, ArrowRight 
} from 'lucide-react';

interface FinalEnrollmentAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: (updatedStudent: Student) => void;
}

export const FinalEnrollmentAssignModal: React.FC<FinalEnrollmentAssignModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess
}) => {
  const { user } = useAuth();
  const [finalEnrollmentNo, setFinalEnrollmentNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (student) {
      const year = '2026';
      const prog = db.getPrograms().find(p => p.id === student.programId);
      const code = prog?.code || 'CE';
      const seq = student.id.replace(/\D/g, '').slice(-3) || '001';
      setFinalEnrollmentNo(student.finalEnrollmentNumber || `${year}${code}000${seq}`);
      setRemarks('');
      setError(null);
    }
  }, [student, isOpen]);

  if (!student) return null;

  const program = db.getPrograms().find(p => p.id === student.programId);
  const department = db.getDepartments().find(d => d.id === student.departmentId);
  const institute = db.getInstitutes().find(i => i.id === student.instituteId);
  const tempNo = student.temporaryEnrollmentNumber || student.enrollmentNo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanNo = finalEnrollmentNo.trim();
    if (!cleanNo) {
      setError('Please enter a valid Final Enrollment Number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = studentOnboardingService.assignFinalEnrollment(student.id, cleanNo, user, remarks);
      setIsSubmitting(false);

      if (res.success && res.student) {
        onSuccess(res.student);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to assign final enrollment number.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Final University Enrollment Number"
      subtitle={`Convert Temporary Enrollment to Final Institutional Enrollment`}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '6px',
            color: '#B91C1C',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Student Dossier Summary Card */}
        <div style={{
          padding: '1.25rem',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>STUDENT NAME</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{student.name}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ENROLLMENT NO.</span>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--brand-orange, #F37023)' }}>{student.enrollmentNo || student.temporaryEnrollmentNumber || '—'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TEMPORARY ENROLLMENT NO</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', fontFamily: 'monospace' }}>
              {tempNo}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>CURRENT ENROLLMENT STATUS</span>
            <div>
              <Badge variant={student.enrollmentStatus === 'FINAL' ? 'active' : 'orange'}>
                {student.enrollmentStatus === 'FINAL' ? 'FINAL ENROLLMENT' : 'TEMPORARY ENROLLMENT'}
              </Badge>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PROGRAM &amp; DEPARTMENT</span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)', fontWeight: 600 }}>
              {program?.name || 'Program'} • {department?.name || 'Department'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>LOGIN ACCOUNT STATUS</span>
            <div><Badge variant="active">ACTIVE</Badge></div>
          </div>
        </div>

        {/* Input for Final Enrollment Number */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid var(--border-color, #E2E8F0)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
              Official University Final Enrollment Number *
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 2026CE000123"
              value={finalEnrollmentNo}
              onChange={e => setFinalEnrollmentNo(e.target.value.toUpperCase())}
              style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: 'var(--brand-navy, #0B192C)',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
              required
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)', marginTop: '4px', display: 'block' }}>
              Must be unique across the university. This will become the primary active student login identifier.
            </span>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Assignment Remarks / Committee Reference (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Verified against Gujarat State Admission Committee list"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* Information Callout */}
        <div style={{
          padding: '0.85rem 1rem',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: '#1E40AF',
          lineHeight: 1.5
        }}>
          <strong>System Integrity Rule:</strong> The temporary enrollment number <code>{tempNo}</code> will be preserved permanently as a historical reference. The student's existing record, fee ledgers, documents, exam records, attendance, and mentor mappings will remain completely intact on the single canonical Student Master record.
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !finalEnrollmentNo.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? 'Confirming Conversion...' : 'Confirm Final Enrollment'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
