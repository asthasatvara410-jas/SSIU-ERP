// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED CONFIRMATION DIALOG
// ==============================================================================

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={24} color="#EF4444" />;
      case 'warning':
        return <AlertCircle size={24} color="#F59E0B" />;
      case 'success':
        return <CheckCircle2 size={24} color="#10B981" />;
      default:
        return <HelpCircle size={24} color="var(--brand-orange, #F37023)" />;
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-warning';
      case 'success':
        return 'btn btn-active';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(243, 112, 35, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {getIcon()}
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-color, #1E293B)', lineHeight: 1.5, flex: 1 }}>
            {message}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          borderTop: '1px solid var(--border-color, #E2E8F0)',
          paddingTop: '1rem',
          marginTop: '0.5rem'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={getConfirmBtnClass()}
            onClick={onConfirm}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
