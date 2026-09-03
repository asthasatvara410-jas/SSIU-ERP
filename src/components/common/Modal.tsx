import React from 'react';
import { X } from 'lucide-react';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '640px',
  hideHeader = false
}) => {
  useModalScrollLock(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-container"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        {!hideHeader && Boolean(title) && (
          <div className="modal-header">
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              style={{ borderRadius: '50%' }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

