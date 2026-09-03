import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';

interface SessionTimeoutWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onLogout: () => void;
}

/**
 * Enterprise Session Inactivity Warning Modal for SSIU ERP
 * Displays a countdown before the 15-minute inactivity automatic logout.
 * Enables users to continue their session or immediately sign out securely.
 */
export const SessionTimeoutWarningModal: React.FC<SessionTimeoutWarningModalProps> = ({
  isOpen,
  remainingSeconds,
  onContinue,
  onLogout,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / 120) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-desc"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          width: '100%',
          maxWidth: '460px',
          padding: '2rem',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            border: '4px solid #FFFBEB',
          }}
        >
          <Clock size={32} />
        </div>

        <h3
          id="session-warning-title"
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#001F3F',
            margin: '0 0 0.5rem 0',
          }}
        >
          Session Inactivity Warning
        </h3>

        <p
          id="session-warning-desc"
          style={{
            fontSize: '0.9rem',
            color: '#64748B',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0',
          }}
        >
          You have been inactive. For security compliance, your session will automatically expire in:
        </p>

        {/* Live Countdown Display */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '2px dashed #CBD5E1',
            borderRadius: '0.85rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: remainingSeconds <= 30 ? '#DC2626' : '#001F3F',
              letterSpacing: '0.1em',
            }}
          >
            {formattedTime}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginTop: '0.25rem' }}>
            MINUTES : SECONDS REMAINING
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#E2E8F0',
              borderRadius: '999px',
              marginTop: '0.75rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: remainingSeconds <= 30 ? '#EF4444' : '#001F3F',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onContinue}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: '#001F3F',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 31, 63, 0.25)',
              transition: 'all 0.15s ease-in-out',
            }}
            onMouseOver={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#0F172A')}
            onMouseOut={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#001F3F')}
          >
            <ShieldCheck size={18} />
            <span>CONTINUE SESSION</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'transparent',
              color: '#64748B',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease-in-out',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9';
              (e.currentTarget as HTMLElement).style.color = '#334155';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#64748B';
            }}
          >
            <LogOut size={16} />
            <span>Log Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
