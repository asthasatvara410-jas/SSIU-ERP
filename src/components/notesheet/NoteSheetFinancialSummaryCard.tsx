import React from 'react';
import { NoteSheetFinancialSummary } from '../../types';
import { IndianRupee, AlertTriangle, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  summary: NoteSheetFinancialSummary;
  compact?: boolean;
}

export const NoteSheetFinancialSummaryCard: React.FC<Props> = ({ summary, compact = false }) => {
  const {
    approvedBudget,
    totalReceived,
    totalSpent,
    totalReturned,
    balanceAvailable,
    utilizedPercentage,
    remainingPercentage,
    warningLevel,
    isClosed
  } = summary;

  const getWarningBadge = () => {
    if (isClosed) {
      return (
        <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
          <Lock size={12} /> Account Closed
        </span>
      );
    }
    if (warningLevel === 'EXHAUSTED') {
      return (
        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger, #dc2626)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
          <AlertCircle size={12} /> 100% Utilized (Budget Exhausted)
        </span>
      );
    }
    if (warningLevel === 'HIGH_WARNING') {
      return (
        <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--brand-orange, #ea580c)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
          <AlertTriangle size={12} /> 90%+ High Budget Utilization
        </span>
      );
    }
    if (warningLevel === 'WARNING') {
      return (
        <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.18)', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
          <AlertTriangle size={12} /> 75%+ Budget Warning
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success, #16a34a)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
        <CheckCircle2 size={12} /> Normal ({utilizedPercentage.toFixed(1)}% Utilized)
      </span>
    );
  };

  const getProgressBarColor = () => {
    if (warningLevel === 'EXHAUSTED') return 'var(--color-danger, #dc2626)';
    if (warningLevel === 'HIGH_WARNING') return 'var(--brand-orange, #ea580c)';
    if (warningLevel === 'WARNING') return '#f59e0b';
    return 'var(--color-success, #10b981)';
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '220px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Budget: ₹{approvedBudget.toLocaleString('en-IN')}</span>
          <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>₹{totalSpent.toLocaleString('en-IN')} Spent</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, utilizedPercentage)}%`, height: '100%', background: getProgressBarColor(), transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
          <span>Rem: <strong style={{ color: balanceAvailable <= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>₹{balanceAvailable.toLocaleString('en-IN')}</strong></span>
          {getWarningBadge()}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.25rem', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--bg-surface) 0%, #FFFFFF 100%)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IndianRupee size={18} color="var(--brand-orange)" /> Note Sheet Financial Summary
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Live budget tracking, fund allocation, expenses, and real-time available balance.
          </p>
        </div>
        <div>
          {getWarningBadge()}
        </div>
      </div>

      {/* 5-Column Financial Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ padding: '0.75rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Budget</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>
            ₹ {approvedBudget.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>Amount Received</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e40af', marginTop: '0.2rem' }}>
            ₹ {totalReceived.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>Amount Spent</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>
            ₹ {totalSpent.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#7e22ce', fontWeight: 600 }}>Returned / Refund</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6b21a8', marginTop: '0.2rem' }}>
            ₹ {totalReturned.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{
          padding: '0.75rem',
          background: balanceAvailable <= 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          borderRadius: 'var(--radius-md)',
          border: `1.5px solid ${balanceAvailable <= 0 ? '#ef4444' : '#10b981'}`
        }}>
          <div style={{ fontSize: '0.75rem', color: balanceAvailable <= 0 ? '#b91c1c' : '#047857', fontWeight: 700 }}>
            Balance Remaining
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: balanceAvailable <= 0 ? '#dc2626' : '#059669', marginTop: '0.2rem' }}>
            ₹ {balanceAvailable.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Utilization & Remaining Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Budget Utilization: <strong style={{ color: 'var(--brand-navy)' }}>{utilizedPercentage.toFixed(2)}%</strong>
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Remaining: <strong style={{ color: balanceAvailable <= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{remainingPercentage.toFixed(2)}%</strong>
          </span>
        </div>
        <div style={{ height: '8px', width: '100%', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, utilizedPercentage)}%`, height: '100%', background: getProgressBarColor(), transition: 'width 0.4s ease-in-out' }} />
        </div>
      </div>
    </div>
  );
};
