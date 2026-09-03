import React from 'react';
import { StudentSectionRequestStatus } from '../../types/studentSection';
import { Check, Clock } from 'lucide-react';

interface RequestTimelineStepperProps {
  status: StudentSectionRequestStatus;
  isUrgent?: boolean;
}

const STEPS: { key: StudentSectionRequestStatus | string; label: string; shortLabel: string }[] = [
  { key: 'SUBMITTED',      label: 'Submitted',          shortLabel: 'Submitted' },
  { key: 'PAID',           label: 'Payment Completed',  shortLabel: 'Payment' },
  { key: 'UNDER_REVIEW',   label: 'Under Verification', shortLabel: 'Verification' },
  { key: 'APPROVED',       label: 'Approved',           shortLabel: 'Approved' },
  { key: 'PROCESSING',     label: 'Processing',         shortLabel: 'Processing' },
  { key: 'DOCUMENT_READY', label: 'Document Ready',     shortLabel: 'Ready' },
  { key: 'COMPLETED',      label: 'Completed',          shortLabel: 'Completed' },
];

// Map statuses to step indices (0-based)
const STATUS_TO_STEP: Record<string, number> = {
  DRAFT:           -1,
  SUBMITTED:        0,
  PAYMENT_PENDING:  0,
  PAID:             1,
  UNDER_REVIEW:     2,
  APPROVED:         3,
  PROCESSING:       4,
  DOCUMENT_READY:   5,
  READY:            5,
  COLLECTED:        6,
  DELIVERED:        6,
  COMPLETED:        6,
  REJECTED:        -2,
  CANCELLED:       -2,
};

export const RequestTimelineStepper: React.FC<RequestTimelineStepperProps> = ({
  status,
  isUrgent,
}) => {
  const currentStepIdx = STATUS_TO_STEP[status] ?? 0;
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';

  if (isRejected) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.875rem',
        backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5',
        borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700,
        color: '#991B1B',
      }}>
        <span>⚠️</span>
        <span>Application {status === 'CANCELLED' ? 'Cancelled' : 'Rejected'} — Contact Student Section for details</span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        minWidth: `${STEPS.length * 100}px`,
        gap: 0,
      }}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIdx;
          const isActive    = idx === currentStepIdx;
          const isFuture    = idx > currentStepIdx;

          const dotColor = isCompleted ? '#16A34A'
                         : isActive    ? '#F37023'
                         : '#CBD5E1';
          const lineColor = isCompleted ? '#16A34A' : '#E2E8F0';
          const textColor = isCompleted ? '#16A34A'
                          : isActive    ? '#F37023'
                          : '#94A3B8';

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: '72px' }}>
                {/* Dot */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: isCompleted ? '#16A34A' : isActive ? '#FFF7ED' : '#F8FAFC',
                  border: `2px solid ${dotColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 0 0 3px rgba(243,112,35,0.18)' : 'none',
                }}>
                  {isCompleted ? (
                    <Check size={13} color="#FFFFFF" strokeWidth={3} />
                  ) : isActive ? (
                    <Clock size={12} color="#F37023" />
                  ) : (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isFuture ? '#CBD5E1' : dotColor }} />
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: '0.625rem', fontWeight: isActive ? 800 : 600,
                  color: textColor, marginTop: '5px', textAlign: 'center',
                  lineHeight: 1.2, whiteSpace: 'nowrap',
                }}>
                  {step.shortLabel}
                </span>
              </div>

              {/* Connector line (not after last) */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: '2px',
                  backgroundColor: lineColor,
                  marginTop: '-18px',
                  transition: 'background-color 0.2s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Payment Pending inline note */}
      {status === 'PAYMENT_PENDING' && (
        <div style={{
          marginTop: '0.625rem',
          fontSize: '0.75rem', fontWeight: 700, color: '#B45309',
          backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: '6px', padding: '4px 10px',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}>
          ⚡ Payment pending — please complete payment to proceed
        </div>
      )}

      {/* Document ready banner */}
      {(status === 'DOCUMENT_READY' || status === 'READY') && (
        <div style={{
          marginTop: '0.625rem',
          fontSize: '0.75rem', fontWeight: 700, color: '#15803D',
          backgroundColor: '#DCFCE7', border: '1px solid #86EFAC',
          borderRadius: '6px', padding: '4px 10px',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}>
          🎉 Document is ready! View or download below.
        </div>
      )}

      {/* Urgent badge */}
      {isUrgent && (
        <div style={{
          marginTop: '0.375rem',
          fontSize: '0.6875rem', fontWeight: 700, color: '#92400E',
          backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: '6px', padding: '2px 8px',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          ⚡ Urgent / Fast-Track Processing requested
        </div>
      )}
    </div>
  );
};
