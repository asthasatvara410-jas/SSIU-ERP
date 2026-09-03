// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED EMAIL INPUT COMPONENT
// ==============================================================================

import React from 'react';
import { Mail } from 'lucide-react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface EmailInputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'style' | 'className' | 'disabled' | 'readOnly' | 'onChange' | 'value' | 'type'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (val: string) => void;
  suggestDomains?: string[]; // e.g. ["@swarrnim.edu.in", "@gmail.com"]
}

export const EmailInput: React.FC<EmailInputProps> = ({
  id,
  name,
  label,
  value = '',
  onChange,
  onValueChange,
  suggestDomains = ['@swarrnim.edu.in', '@gmail.com'],
  placeholder = 'student@swarrnim.edu.in',
  helperText,
  error,
  required,
  requirement,
  disabled = false,
  readOnly = false,
  allowNotApplicable = false,
  isNotApplicable = false,
  onNotApplicableChange,
  notApplicableLabel,
  tooltip,
  className = '',
  style,
  ...rest
}) => {
  const isDisabled = disabled || isNotApplicable;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
  };

  const handleNA = (isNA: boolean) => {
    if (onNotApplicableChange) {
      onNotApplicableChange(isNA);
      if (isNA && onValueChange) {
        onValueChange('N/A');
      } else if (!isNA && onValueChange && value === 'N/A') {
        onValueChange('');
      }
    }
  };

  return (
    <NotApplicableField
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
      requirement={requirement}
      disabled={disabled}
      allowNotApplicable={allowNotApplicable}
      isNotApplicable={isNotApplicable}
      onNotApplicableChange={handleNA}
      notApplicableLabel={notApplicableLabel}
      tooltip={tooltip}
      className={className}
      style={style}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{
          position: 'absolute',
          left: '10px',
          color: isDisabled ? 'var(--text-muted, #94A3B8)' : 'var(--brand-orange, #F37023)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          zIndex: 1
        }}>
          <Mail size={15} />
        </div>

        <input
          id={id}
          name={name}
          type={isNotApplicable ? 'text' : 'email'}
          value={isNotApplicable ? 'N/A' : (value || '')}
          onChange={handleChange}
          placeholder={isNotApplicable ? 'Not Applicable' : placeholder}
          disabled={isDisabled}
          readOnly={readOnly}
          style={{
            width: '100%',
            height: '38px',
            fontSize: '0.8125rem',
            paddingLeft: '32px',
            paddingRight: isNotApplicable ? '80px' : '10px',
            borderRadius: '6px',
            border: error 
              ? '1px solid #EF4444' 
              : isNotApplicable 
                ? '1px dashed #CBD5E1' 
                : '1px solid var(--border-color, #CBD5E1)',
            background: isNotApplicable 
              ? '#F8FAFC' 
              : isDisabled 
                ? '#F1F5F9' 
                : '#FFFFFF',
            color: isNotApplicable 
              ? 'var(--brand-orange, #F37023)' 
              : 'var(--text-color, #1E293B)',
            fontWeight: isNotApplicable ? 800 : 500,
            outline: 'none',
            cursor: isDisabled ? 'not-allowed' : 'text'
          }}
          className="form-control"
          {...rest}
        />
      </div>
    </NotApplicableField>
  );
};
