// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED NUMBER INPUT COMPONENT
// ==============================================================================

import React from 'react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface NumberInputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'style' | 'className' | 'disabled' | 'readOnly' | 'onChange' | 'value'> {
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (val: number | string | null) => void;
  min?: number;
  max?: number;
  step?: number | string;
  prefixSymbol?: string; // e.g. "₹"
  suffixSymbol?: string; // e.g. "%" or "Years"
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  name,
  label,
  value = '',
  onChange,
  onValueChange,
  placeholder = '0',
  min,
  max,
  step = 'any',
  prefixSymbol,
  suffixSymbol,
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
    if (onValueChange) {
      if (raw === '') onValueChange('');
      else {
        const parsed = parseFloat(raw);
        onValueChange(isNaN(parsed) ? raw : parsed);
      }
    }
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
        {prefixSymbol && (
          <div style={{
            position: 'absolute',
            left: '10px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: isDisabled ? 'var(--text-muted, #94A3B8)' : 'var(--brand-navy, #0B192C)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {prefixSymbol}
          </div>
        )}

        <input
          id={id}
          name={name}
          type={isNotApplicable ? 'text' : 'number'}
          value={isNotApplicable ? 'N/A' : (value ?? '')}
          onChange={handleChange}
          placeholder={isNotApplicable ? 'Not Applicable' : placeholder}
          min={min}
          max={max}
          step={step}
          disabled={isDisabled}
          readOnly={readOnly}
          style={{
            width: '100%',
            height: '38px',
            fontSize: '0.8125rem',
            paddingLeft: prefixSymbol ? '26px' : '10px',
            paddingRight: (suffixSymbol || isNotApplicable) ? '80px' : '10px',
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

        {suffixSymbol && !isNotApplicable && (
          <div style={{
            position: 'absolute',
            right: '10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted, #64748B)',
            pointerEvents: 'none'
          }}>
            {suffixSymbol}
          </div>
        )}
      </div>
    </NotApplicableField>
  );
};
