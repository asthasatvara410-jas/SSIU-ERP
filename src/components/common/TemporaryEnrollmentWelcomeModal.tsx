import React, { useState } from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  Sparkles, KeyRound, ShieldCheck, GraduationCap, 
  ArrowRight, Lock, CheckCircle2, AlertCircle, Copy, Check, Clock 
} from 'lucide-react';

interface TemporaryEnrollmentWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemporaryEnrollmentWelcomeModal: React.FC<TemporaryEnrollmentWelcomeModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, updateProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user || user.role !== 'STUDENT') return null;

  const students = db.getStudents();
  const student = students.find(s => 
    (user?.id && s.id === user.id.replace('user-', '')) || 
    s.enrollmentNo === user.username ||
    s.temporaryEnrollmentNumber === user.temporaryEnrollmentNumber
  );

  const isTemporary = student?.enrollmentStatus === 'TEMPORARY' || user.enrollmentStatus === 'TEMPORARY' || user.username?.startsWith('TEMP-');
  const tempEnrollmentNo = student?.temporaryEnrollmentNumber || user.temporaryEnrollmentNumber || user.username;
  const accessCode = student?.studentAccessCode || user.studentAccessCode || user.password;

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`Username: ${tempEnrollmentNo}\nAccess Code: ${accessCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPass) {
      setFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    updateProfile({ password: newPassword, isFirstLogin: false });
    if (student) {
      db.updateEntity('students', student.id, { isFirstLogin: false } as any, 'Updated student first login status');
    }
    setFeedback({ type: 'success', text: 'Password successfully updated! Proceeding to portal...' });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to SSIU ERP Student Portal"
      subtitle="Your Official Institutional Onboarding Overview"
      maxWidth="620px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Welcome Header */}
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(11,25,44,0.04) 0%, rgba(243,112,35,0.08) 100%)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <Sparkles size={40} color="var(--brand-orange, #F37023)" style={{ margin: '0 auto 0.5rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
            Welcome to SSIU ERP
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748B)', marginTop: '0.35rem' }}>
            Your student admission onboarding is complete and your digital account is active.
          </p>
        </div>

        {/* Temporary Enrollment Status Notice */}
        {isTemporary && (
          <div style={{
            padding: '1rem',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: '#92400E'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              <Clock size={16} color="#D97706" /> Your final enrollment number is currently pending.
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.4 }}>
              You have been provisionally assigned a <strong>Temporary Enrollment Number</strong> for full ERP access. Once verified by the university registrar, your official permanent enrollment number will be automatically updated on your account.
            </p>
          </div>
        )}

        {/* Credentials & Details Card */}
        <div style={{
          padding: '1.25rem',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>STUDENT NAME</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{user.name}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ENROLLMENT STATUS</span>
            <div>
              <Badge variant={isTemporary ? 'orange' : 'active'}>
                {isTemporary ? 'TEMPORARY ENROLLMENT' : 'FINAL ENROLLMENT'}
              </Badge>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TEMPORARY ENROLLMENT NUMBER</span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', fontFamily: 'monospace' }}>
              {tempEnrollmentNo}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>FINAL ENROLLMENT NUMBER</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>
              {student?.finalEnrollmentNumber || 'PENDING'}
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#065F46' : '#B91C1C',
            border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#F87171'}`
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.text}
          </div>
        )}

        {/* Optional Password Set / Quick Continue Form */}
        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF', border: '1px solid var(--border-color, #E2E8F0)' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="var(--brand-orange, #F37023)" /> Set Permanent Password (Optional)
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '0 0 0.75rem 0' }}>
              You may continue using your 5-digit Access Code or set a custom secure password now.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <input
                  type="password"
                  className="form-control"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
              <div>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm new password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyCredentials}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              {copied ? 'Credentials Copied!' : 'Copy Credentials'}
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {newPassword ? (
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
                  Save Password &amp; Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    updateProfile({ isFirstLogin: false });
                    onClose();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
                >
                  Continue to Student Portal <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </Modal>
  );
};
