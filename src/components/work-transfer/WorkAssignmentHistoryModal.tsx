import React from 'react';
import { WorkAssignmentHistoryChainItem } from '../../types/workTransfer';
import { workTransferService } from '../../services/workTransferService';
import { X, History, ArrowRight, UserCheck, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../common/Badge';

interface WorkAssignmentHistoryModalProps {
  workItemId: string | null;
  workItemTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkAssignmentHistoryModal: React.FC<WorkAssignmentHistoryModalProps> = ({
  workItemId,
  workItemTitle,
  isOpen,
  onClose
}) => {
  if (!isOpen || !workItemId) return null;

  const history: WorkAssignmentHistoryChainItem[] = workTransferService.getWorkItemAssignmentHistory(workItemId);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(11, 25, 44, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'var(--bg-surface, #FFFFFF)',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={20} color="var(--brand-orange, #F37023)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Work Item Assignment History &amp; Delegation Chain
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                Work Item: <code>{workItemId}</code> {workItemTitle ? `— ${workItemTitle}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>
              CHRONOLOGICAL LIFECYCLE ({history.length} Event{history.length > 1 ? 's' : ''})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {history.map((step, idx) => {
              const isLast = idx === history.length - 1;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    position: 'relative'
                  }}
                >
                  {/* Timeline indicator */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isLast ? 'var(--brand-orange, #F37023)' : 'var(--brand-navy, #0B192C)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        zIndex: 2
                      }}
                    >
                      {idx + 1}
                    </div>
                    {!isLast && (
                      <div
                        style={{
                          width: '2px',
                          flex: 1,
                          background: 'var(--border-color, #E2E8F0)',
                          marginTop: '4px',
                          marginBottom: '4px'
                        }}
                      />
                    )}
                  </div>

                  {/* Step Card */}
                  <div
                    className="card"
                    style={{
                      flex: 1,
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-surface-hover, #F8FAFC)',
                      border: '1px solid var(--border-color, #E2E8F0)',
                      borderRadius: 'var(--radius-md, 8px)',
                      marginBottom: isLast ? 0 : '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <Badge variant={step.action.includes('COMPLETED') ? 'success' : step.action.includes('RESTORED') ? 'navy' : 'orange'}>
                          {step.action}
                        </Badge>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', marginLeft: '8px' }}>
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {step.transferTrackingCode && (
                        <code style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#E2E8F0', borderRadius: '4px' }}>
                          {step.transferTrackingCode}
                        </code>
                      )}
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                      {step.fromUser && (
                        <>
                          <span style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{step.fromUser}</span>
                          <ArrowRight size={14} color="var(--brand-orange, #F37023)" />
                        </>
                      )}
                      {step.toUser && (
                        <span style={{ fontWeight: 700, color: 'var(--brand-orange, #F37023)' }}>{step.toUser}</span>
                      )}
                      {!step.fromUser && !step.toUser && step.actor && (
                        <span>By: <strong>{step.actor}</strong></span>
                      )}
                    </div>

                    {step.notes && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #475569)', margin: '6px 0 0 0', background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        {step.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'var(--bg-surface-hover, #F8FAFC)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
