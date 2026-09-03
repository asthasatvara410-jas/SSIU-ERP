// ==============================================================================
// SWARRNIM UNIVERSITY ERP — NOT APPLICABLE FIELD WRAPPER COMPONENT
// ==============================================================================

import React from 'react';
import { HelpCircle, AlertCircle, Check, Ban } from 'lucide-react';
import { BaseFieldProps } from './formTypes';

export interface NotApplicableFieldProps extends BaseFieldProps {
  children?: React.ReactNode | ((props: { disabled: boolean; isNA: boolean }) => React.ReactNode);
}

export const NotApplicableField: React.FC<NotApplicableFieldProps> = ({
  id,
  label,
  helperText,
  error,
  required,
  requirement,
  disabled = false,
  allowNotApplicable = true,
  isNotApplicable = false,
  onNotApplicableChange,
  notApplicableLabel = 'Not Applicable',
  tooltip,
  children,
  className = '',
  style
}) => {
  const isReq = required || requirement === 'REQUIRED' || requirement === true;
  const isOpt = requirement === 'OPTIONAL' || (requirement === false && !isReq);
  const isCond = requirement === 'CONDITIONAL';

  const isDisabled = disabled || isNotApplicable;

  return (
    <div 
      className={`form-field-group ${className}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.35rem', 
        marginBottom: '0.75rem',
        ...style 
      }}
    >
      {/* Label and N/A Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        {label && (
          <label 
            htmlFor={id} 
            style={{ 
              fontSize: '0.8125rem', 
              fontWeight: 700, 
              color: isNotApplicable ? 'var(--text-muted, #94A3B8)' : 'var(--brand-navy, #0B192C)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              margin: 0,
              userSelect: 'none'
            }}
          >
            {label}
            {isReq && <span style={{ color: '#EF4444', fontWeight: 900 }} title="Required field">*</span>}
            {isOpt && !isReq && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-muted, #64748B)' }}>
                (Optional)
              </span>
            )}
            {isCond && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--brand-orange, #F37023)' }}>
                (Conditional)
              </span>
            )}
            {tooltip && (
              <span title={tooltip} style={{ cursor: 'help', color: 'var(--text-muted, #64748B)', display: 'inline-flex' }}>
                <HelpCircle size={13} />
              </span>
            )}
          </label>
        )}

        {/* N/A Checkbox Toggle (only if allowed and field is not strictly mandatory) */}
        {allowNotApplicable && !isReq && onNotApplicableChange && (
          <label 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.3rem', 
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.725rem',
              fontWeight: isNotApplicable ? 800 : 600,
              color: isNotApplicable ? 'var(--brand-orange, #F37023)' : 'var(--text-muted, #64748B)',
              background: isNotApplicable ? 'rgba(243, 112, 35, 0.08)' : 'transparent',
              padding: '2px 6px',
              borderRadius: '4px',
              border: isNotApplicable ? '1px solid rgba(243, 112, 35, 0.25)' : '1px solid transparent',
              transition: 'all 0.15s ease',
              margin: 0,
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={isNotApplicable}
              disabled={disabled}
              onChange={(e) => onNotApplicableChange(e.target.checked)}
              style={{
                width: '13px',
                height: '13px',
                accentColor: 'var(--brand-orange, #F37023)',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            />
            <span>{notApplicableLabel}</span>
          </label>
        )}
      </div>

      {/* Input container with conditional styling when N/A is checked */}
      <div style={{ position: 'relative' }}>
        {typeof children === 'function' 
          ? children({ disabled: isDisabled, isNA: isNotApplicable }) 
          : children
        }

        {/* N/A Overlay Badge for clear accessibility & visual indicator */}
        {isNotApplicable && (
          <div 
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              color: 'var(--brand-orange, #F37023)',
              background: 'rgba(243, 112, 35, 0.12)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(243, 112, 35, 0.3)'
            }}
          >
            <Ban size={11} /> N/A Marked
          </div>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.725rem', fontWeight: 600 }}>
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
};
