import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid institutional email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const handleResetState = () => {
    setEmail('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetState}
      title="Reset Your Password"
      subtitle="Enter your Swarrnim University email to receive password reset instructions"
      maxWidth="480px"
    >
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <CheckCircle2 size={32} />
          </div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Reset Link Dispatched</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            We have sent password recovery instructions and a secure reset token to <strong>{email}</strong>.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={handleResetState}>
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Institutional Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="username@swarrnim.edu.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <span className="form-hint">Enter your official @swarrnim.edu.in account email.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleResetState}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Reset Link
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
