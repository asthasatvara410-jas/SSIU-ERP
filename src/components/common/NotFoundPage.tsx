import React from 'react';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  requestedPath
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
        backgroundColor: 'rgba(243, 112, 35, 0.12)',
        border: '2px solid rgba(243, 112, 35, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <HelpCircle size={42} style={{ color: 'var(--brand-orange)' }} />
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(243, 112, 35, 0.1)',
        color: 'var(--brand-orange)',
        fontSize: '0.75rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: '0.75rem'
      }}>
        <span>HTTP 404 • ROUTE NOT FOUND</span>
      </div>

      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--brand-navy)',
        margin: '0 0 0.5rem 0'
      }}>
        Page Not Found
      </h2>

      <p style={{
        maxWidth: '540px',
        color: 'var(--text-muted)',
        fontSize: '0.9375rem',
        lineHeight: 1.6,
        margin: '0 0 1.5rem 0'
      }}>
        The requested university route {requestedPath ? <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--brand-navy)' }}>{requestedPath}</code> : 'page'} does not exist in the SSIU ERP navigation system.
      </p>

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
        <Home size={16} />
        <span>Return to Dashboard Overview</span>
      </button>
    </div>
  );
};
