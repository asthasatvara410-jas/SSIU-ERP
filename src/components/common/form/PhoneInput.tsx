// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED PHONE INPUT COMPONENT
// ==============================================================================

import React from 'react';
import { Phone } from 'lucide-react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface PhoneInputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'style' | 'className' | 'disabled' | 'readOnly' | 'onChange' | 'value'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (val: string) => void;
  countryCode?: string; // default "+91"
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  name,
  label,
  value = '',
  onChange,
  onValueChange,
  countryCode = '+91',
  placeholder = '98765 43210',
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
    const raw = e.target.value;
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(raw);
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
        {!isNotApplicable && (
          <div style={{
            position: 'absolute',
            left: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--bg-surface-hover, #F8FAFC)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--brand-navy, #0B192C)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            <Phone size={12} color="var(--brand-orange, #F37023)" />
            <span>{countryCode}</span>
          </div>
        )}

        <input
          id={id}
          name={name}
          type="tel"
          value={isNotApplicable ? 'N/A' : (value || '')}
          onChange={handleChange}
          placeholder={isNotApplicable ? 'Not Applicable' : placeholder}
          disabled={isDisabled}
          readOnly={readOnly}
          maxLength={15}
          style={{
            width: '100%',
            height: '38px',
            fontSize: '0.8125rem',
            paddingLeft: isNotApplicable ? '10px' : '64px',
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
            letterSpacing: isNotApplicable ? 'normal' : '0.5px',
            cursor: isDisabled ? 'not-allowed' : 'text'
          }}
          className="form-control"
          {...rest}
        />
      </div>
    </NotApplicableField>
  );
};
