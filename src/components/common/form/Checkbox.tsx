// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED CHECKBOX COMPONENT
// ==============================================================================

import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { BaseFieldProps } from './formTypes';

export interface CheckboxProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'style' | 'className' | 'disabled' | 'type' | 'checked' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  subtitle?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  subtitle,
  checked = false,
  onCheckedChange,
  helperText,
  error,
  required,
  disabled = false,
  tooltip,
  className = '',
  style,
  ...rest
}) => {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', ...style }}>
      <label
        htmlFor={id}
        style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          margin: 0
        }}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
          style={{
            width: '16px',
            height: '16px',
            marginTop: '2px',
            accentColor: 'var(--brand-orange, #F37023)',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          {...rest}
        />
        <div>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: checked ? 700 : 500,
            color: disabled ? 'var(--text-muted, #94A3B8)' : 'var(--brand-navy, #0B192C)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {label}
            {required && <span style={{ color: '#EF4444' }}>*</span>}
            {tooltip && (
              <span title={tooltip} style={{ cursor: 'help', color: 'var(--text-muted, #64748B)' }}>
                <HelpCircle size={12} />
              </span>
            )}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', marginTop: '1px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </label>

      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.725rem', fontWeight: 600, marginLeft: '24px' }}>
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)', marginLeft: '24px' }}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
};
