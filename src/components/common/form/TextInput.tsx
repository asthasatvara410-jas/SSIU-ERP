// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED TEXT INPUT COMPONENT
// ==============================================================================

import React from 'react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface TextInputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'style' | 'className' | 'disabled' | 'readOnly'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (val: string) => void;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  maxLength?: number;
  showCharCount?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
  label,
  value = '',
  onChange,
  onValueChange,
  placeholder = 'Enter value...',
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
  prefixIcon,
  suffixIcon,
  maxLength,
  showCharCount = false,
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
        {prefixIcon && (
          <div style={{
            position: 'absolute',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            color: isDisabled ? 'var(--text-muted, #94A3B8)' : 'var(--text-muted, #64748B)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {prefixIcon}
          </div>
        )}

        <input
          id={id}
          name={name}
          type="text"
          value={isNotApplicable ? 'N/A' : value}
          onChange={handleChange}
          placeholder={isNotApplicable ? 'Not Applicable (N/A)' : placeholder}
          disabled={isDisabled}
          readOnly={readOnly}
          maxLength={maxLength}
          style={{
            width: '100%',
            height: '38px',
            fontSize: '0.8125rem',
            paddingLeft: prefixIcon ? '34px' : '10px',
            paddingRight: (suffixIcon || isNotApplicable || showCharCount) ? '80px' : '10px',
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
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            cursor: isDisabled ? 'not-allowed' : 'text'
          }}
          className="form-control"
          {...rest}
        />

        {suffixIcon && !isNotApplicable && (
          <div style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted, #64748B)',
            pointerEvents: 'none'
          }}>
            {suffixIcon}
          </div>
        )}

        {showCharCount && maxLength && !isNotApplicable && (
          <div style={{
            position: 'absolute',
            right: suffixIcon ? '30px' : '10px',
            fontSize: '0.6875rem',
            color: 'var(--text-muted, #94A3B8)',
            pointerEvents: 'none'
          }}>
            {String(value).length}/{maxLength}
          </div>
        )}
      </div>
    </NotApplicableField>
  );
};
