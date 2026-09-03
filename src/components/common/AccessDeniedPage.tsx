import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AccessDeniedPageProps {
  onNavigateHome: () => void;
  tabName?: string;
  userRole?: string;
  reason?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  onNavigateHome,
  tabName = 'this section',
  userRole = 'USER',
  reason
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: '2px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <ShieldAlert size={42} style={{ color: '#DC2626' }} />
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#DC2626',
        fontSize: '0.75rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: '0.75rem'
      }}>
        <Lock size={12} />
        <span>HTTP 403 • ACCESS RESTRICTED</span>
      </div>

      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--brand-navy)',
        margin: '0 0 0.5rem 0'
      }}>
        Access Denied & Authorization Required
      </h2>

      <p style={{
        maxWidth: '560px',
        color: 'var(--text-muted)',
        fontSize: '0.9375rem',
        lineHeight: 1.6,
        margin: '0 0 1.5rem 0'
      }}>
        {reason || (
          <>
            Your current assigned role (<strong>{userRole}</strong>) does not have authorization to view or manage <strong>{tabName}</strong>. Access is centrally governed by the Central ERP Coordinator and University Governance policies.
          </>
        )}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onNavigateHome}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            fontWeight: 700,
            borderRadius: '6px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
