import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { AUTH_STORAGE_KEY, DB_STORAGE_KEY } from '../../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SSIU ERP Uncaught ErrorBoundary Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSessionAndReload = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
    window.location.href = '/';
  };

  private handleFullReset = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(DB_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071325',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#0F2C59',
            borderRadius: '16px',
            border: '1px solid rgba(245, 166, 35, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '2.5rem',
            textAlign: 'center',
            color: '#F8FAFC'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: '#EF4444'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#F5A623',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em'
            }}>
              Application Rendering Exception
            </h2>

            <p style={{
              fontSize: '0.9375rem',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '1.5rem'
            }}>
              The ERP user interface encountered an unexpected runtime state. You can safely reload the page or reset the cached session below.
            </p>

            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: 'rgba(7, 19, 37, 0.8)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '1.75rem',
                maxHeight: '140px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                color: '#FCA5A5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  backgroundColor: '#F5A623',
                  color: '#071325',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <RefreshCw size={18} />
                Reload ERP
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={this.handleResetSessionAndReload}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#F8FAFC',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={16} />
                  Reset Session
                </button>

                <button
                  onClick={this.handleFullReset}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#FCA5A5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear Cached Database
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
